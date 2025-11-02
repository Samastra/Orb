"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

// Add this to make the page dynamic
export const dynamic = 'force-dynamic';

// Move the main logic to a separate component wrapped in Suspense
function PaymentSuccessContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const reference = searchParams.get("reference");
  const plan = searchParams.get("plan");

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found");
      return;
    }

    verifyPayment();
  }, [reference, isSignedIn, router]);

  const verifyPayment = async () => {
    try {
      // FIX: Update the API path to match your actual route
      const response = await fetch("/api/payments/verify", { // Changed from "/api/payment/verify"
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(`Payment verified! You now have ${data.plan} access.`);
      } else {
        setStatus("error");
        setMessage(data.error || "Payment verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("Failed to verify payment. Please contact support.");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <GlassCard className="p-8 max-w-md text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h2>
          <p className="text-gray-600">Please sign in to continue</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <GlassCard className="p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          {status === "loading" && (
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto" />
          )}
          {status === "success" && (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          )}
          {status === "error" && (
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
          )}

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {status === "loading" && "Verifying Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "error" && "Payment Failed"}
            </h1>
            <p className="text-gray-600">
              {status === "loading" && "Please wait while we confirm your payment..."}
              {status === "success" && message}
              {status === "error" && message}
            </p>
          </div>

          {/* Reference */}
          {reference && (
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Reference: <code className="font-mono">{reference}</code>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {status === "success" && (
              <>
                <Link href="/boards" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3">
                    Go to Your Boards
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <Button 
                  onClick={verifyPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  Try Again
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Need help?{" "}
                    <a href="mailto:support@orb.com" className="text-blue-600 hover:underline">
                      Contact support
                    </a>
                  </p>
                </div>
              </>
            )}

            {status === "loading" && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  This may take a few moments...
                </p>
              </div>
            )}
          </div>

          {/* Success Benefits */}
          {status === "success" && plan === "lifetime" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-green-800 mb-2">🎉 Welcome to Orb Lifetime!</h3>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>• Unlimited boards and sessions</li>
                <li>• All AI features unlocked</li>
                <li>• Priority customer support</li>
                <li>• Lifetime updates included</li>
              </ul>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// Main export wrapped in Suspense
export default function PaymentSuccess() {
  return (  
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <GlassCard className="p-8 max-w-md text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing your payment details</p>
        </GlassCard>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}