import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import crypto from "crypto";

// Remove unused paystack import and initialization

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

// Define proper types for Paystack webhook data
interface PaymentMetadata {
  user_id?: string;
  plan_type?: string;
  clerk_user_id?: string;
}

interface PaymentData {
  reference: string;
  metadata: PaymentMetadata;
  customer?: {
    email: string;
  };
}

interface SubscriptionData {
  id: string;
  status: string;
  customer: {
    email: string;
  };
  plan: {
    name: string;
  };
}

async function handleSuccessfulPayment(paymentData: PaymentData) {
  const supabase = createSupabaseClient();

  try {
    const { reference } = paymentData; // Remove unused metadata and customer

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

async function handleSubscriptionCreation(subscriptionData: SubscriptionData) {
  // Handle yearly subscription creation
  console.log("📅 Subscription created:", subscriptionData.id, "for", subscriptionData.customer.email);
  // You can implement subscription-specific logic here
  
  // Example: Update user to yearly plan
  // const supabase = createSupabaseClient();
  // await supabase
  //   .from("users")
  //   .update({ 
  //     plan_type: "yearly",
  //     subscription_status: "active"
  //   })
  //   .eq("email", subscriptionData.customer.email);
}

async function handleSubscriptionCancellation(subscriptionData: SubscriptionData) {
  // Handle subscription cancellation
  console.log("❌ Subscription cancelled:", subscriptionData.id);
  // You can implement downgrade logic here
  
  // Example: Downgrade user to free plan
  // const supabase = createSupabaseClient();
  // await supabase
  //   .from("users")
  //   .update({ 
  //     plan_type: "free",
  //     subscription_status: "cancelled"
  //   })
  //   .eq("email", subscriptionData.customer.email);
}