import { NextRequest, NextResponse } from "next/server";
import Paystack from "paystack-api";
import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth(); // AWAIT the auth() function
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, amount, currency = "USD" } = await request.json();

    // Validate plan
    if (!["lifetime", "yearly"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get user from database using your existing pattern
    const supabase = createSupabaseClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, email, clerk_user_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert amount to kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100); // $99 = 9900 kobo

    // Initialize Paystack transaction
    const transaction = await paystack.transaction.initialize({
      amount: amountInKobo,
      email: dbUser.email || "customer@example.com",
      currency: currency,
      reference: `orb_${plan}_${Date.now()}_${dbUser.id}`,
      metadata: {
        user_id: dbUser.id,
        plan_type: plan,
        clerk_user_id: userId
      },
      callback_url: `https://orb-spb8.vercel.app/payment/success?plan=${plan}`
    });

    if (!transaction.status || !transaction.data.authorization_url) {
      throw new Error("Failed to initialize payment");
    }

    // Create pending payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: dbUser.id,
        plan_type: plan,
        amount: amount,
        currency: currency,
        paystack_reference: transaction.data.reference,
        status: "pending"
      });

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
    }

    return NextResponse.json({
      authorization_url: transaction.data.authorization_url,
      reference: transaction.data.reference
    });

  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}