import { NextRequest, NextResponse } from "next/server";
import Paystack from "paystack-api";
import { createSupabaseClient } from "@/lib/supabase";
import crypto from "crypto";

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("❌ Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    console.log("🪝 Webhook received:", event.event, event.data.reference);

    // Handle different webhook events
    switch (event.event) {
      case "charge.success":
        await handleSuccessfulPayment(event.data);
        break;

      case "subscription.create":
        await handleSubscriptionCreation(event.data);
        break;

      case "subscription.disable":
        await handleSubscriptionCancellation(event.data);
        break;

      default:
        console.log("🤷 Unhandled webhook event:", event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleSuccessfulPayment(paymentData: any) {
  const supabase = createSupabaseClient();

  try {
    const { reference, metadata, customer } = paymentData;

    // Find payment record
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("paystack_reference", reference)
      .single();

    if (!payment) {
      console.error("❌ Payment record not found for reference:", reference);
      return;
    }

    // Update payment status
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("paystack_reference", reference);

    if (paymentError) {
      console.error("❌ Error updating payment:", paymentError);
      throw paymentError;
    }

    // Update user plan
    const { error: userError } = await supabase
      .from("users")
      .update({
        plan_type: payment.plan_type,
        payment_status: "paid",
        upgraded_at: new Date().toISOString()
      })
      .eq("id", payment.user_id);

    if (userError) {
      console.error("❌ Error updating user:", userError);
      throw userError;
    }

    console.log(`✅ Webhook: User ${payment.user_id} upgraded to ${payment.plan_type}`);

  } catch (error) {
    console.error("❌ Error handling successful payment:", error);
    throw error;
  }
}

async function handleSubscriptionCreation(subscriptionData: any) {
  // Handle yearly subscription creation
  console.log("📅 Subscription created:", subscriptionData);
  // You can implement subscription-specific logic here
}

async function handleSubscriptionCancellation(subscriptionData: any) {
  // Handle subscription cancellation
  console.log("❌ Subscription cancelled:", subscriptionData);
  // You can implement downgrade logic here
}