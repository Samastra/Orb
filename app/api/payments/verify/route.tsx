import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// Add this line
export const dynamic = 'force-dynamic';

// Use dynamic import for Paystack to avoid build issues
async function getPaystack() {
  const Paystack = (await import('paystack-api')).default;
  return Paystack(process.env.PAYSTACK_SECRET_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Initialize Paystack with dynamic import
    const paystack = await getPaystack();

    // Verify payment with Paystack
    const verification = await paystack.transaction.verify(reference);

    if (!verification.status) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const paymentData = verification.data;

    // Check if payment was successful
    if (paymentData.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    // Get user from database
    const supabase = createSupabaseClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, clerk_user_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if payment already processed
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("paystack_reference", reference)
      .single();

    if (existingPayment && existingPayment.status === "completed") {
      return NextResponse.json({ 
        success: true, 
        message: "Payment already processed",
        plan: existingPayment.plan_type
      });
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("paystack_reference", reference);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // Get plan type from payment metadata or payment record
    const planType = paymentData.metadata?.plan_type || existingPayment?.plan_type;

    if (!planType) {
      return NextResponse.json({ error: "Plan type not found" }, { status: 400 });
    }

    // Update user plan
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        plan_type: planType,
        payment_status: "paid",
        upgraded_at: new Date().toISOString()
      })
      .eq("id", dbUser.id);

    if (userUpdateError) {
      console.error("Error updating user plan:", userUpdateError);
      throw userUpdateError;
    }

    console.log(`✅ Payment verified and user upgraded: ${dbUser.id} to ${planType}`);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      plan: planType,
      amount: paymentData.amount / 100, // Convert back from kobo
      currency: paymentData.currency
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}