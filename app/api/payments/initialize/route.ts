import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, amount } = await request.json(); // Remove currency from destructuring

    // Validate plan
    if (!["lifetime", "yearly"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get user from database
    const supabase = createSupabaseClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, email, clerk_user_id")
      .eq("clerk_user_id", userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // FORCE NGN for testing
    const currency = "NGN";
    const amountInKobo = Math.round(amount * 100);

    console.log("🔄 Paystack API Request (FORCED NGN):", {
      amount: amountInKobo,
      currency: currency, // This will now always be "NGN"
      email: dbUser.email,
    });

    // Initialize Paystack transaction using direct fetch
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInKobo,
        email: dbUser.email || "customer@example.com",
        currency: currency, // Now forced to NGN
        reference: `orb_${plan}_${Date.now()}_${dbUser.id}`,
        metadata: {
          user_id: dbUser.id,
          plan_type: plan,
          clerk_user_id: userId
        },
        callback_url: `http://localhost:3000/success?plan=${plan}`
      }),
    });

    const transaction = await paystackResponse.json();
    console.log("📄 Paystack API Response:", transaction);

    if (!transaction.status || !transaction.data.authorization_url) {
      throw new Error(transaction.message || "Failed to initialize payment");
    }

    // Create pending payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: dbUser.id,
        plan_type: plan,
        amount: amount,
        currency: currency, // Store as NGN
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