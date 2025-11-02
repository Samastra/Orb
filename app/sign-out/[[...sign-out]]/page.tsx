"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut();
        // Redirect to home page after successful sign out
        router.push("/");
      } catch (error) {
        console.error("Sign out error:", error);
        // If there's an error, still redirect to home
        router.push("/");
      }
    };

    performSignOut();
  }, [signOut, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing Out</h2>
          <p className="text-gray-600">Taking you back to the home page...</p>
        </div>
      </div>
    </div>
  );
}