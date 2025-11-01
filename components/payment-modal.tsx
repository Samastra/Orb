"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: "lifetime" | "yearly";
}

export function PaymentModal({ isOpen, onClose, onSuccess, plan }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"initial" | "processing" | "success" | "error">("initial");

  if (!isOpen) return null;

  const planDetails = {
    lifetime: {
      price: 99,
      title: "Lifetime Access",
      description: "One-time payment • Never pay again",
      features: [
        "Unlimited boards and sessions",
        "All AI features included",
        "Priority customer support",
        "Early access to new features",
        "Commercial usage rights",
        "Lifetime updates & upgrades"
      ]
    },
    yearly: {
      price: 60,
      title: "Yearly Plan",
      description: "Per year • Cancel anytime",
      features: [
        "All core features included",
        "AI-powered insights",
        "Real-time collaboration",
        "Public board sharing",
        "Basic customer support",
        "Regular updates"
      ]
    }
  };

  const currentPlan = planDetails[plan];

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    setPaymentStep("processing");

    try {
      // Initialize payment with Paystack
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          amount: currentPlan.price,
          currency: "USD"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }

    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
      setPaymentStep("error");
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStep("initial");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {paymentStep === "success" ? "Payment Successful!" : currentPlan.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStep === "initial" && (
            <div className="space-y-6">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-gray-900">${currentPlan.price}</span>
                  <span className="text-gray-500 text-lg">USD</span>
                </div>
                <p className="text-gray-600 mt-2">{currentPlan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold rounded-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${currentPlan.price} USD`
                )}
              </Button>

              {/* Security Note */}
              <p className="text-center text-sm text-gray-500">
                🔒 Secure payment powered by Paystack
              </p>
            </div>
          )}

          {paymentStep === "processing" && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Processing Payment</h3>
                <p className="text-gray-600 mt-1">Redirecting to secure payment page...</p>
              </div>
            </div>
          )}

          {paymentStep === "error" && (
            <div className="text-center space-y-4 py-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
                <p className="text-gray-600 mt-1">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}