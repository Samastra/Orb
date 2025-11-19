"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import EnterpriseLayout from "@/components/enterprise/layout/EnterpriseLayout"
import MainDashboard from "@/components/enterprise/dashboard/MainDashboard"
import { loadPaddle, openPaddleCheckout } from '@/lib/paddle-loader';

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleGetLifetimeAccess = async () => {
  if (!user) {
    router.push("/sign-in");
    return;
  }
  
  try {
    const loaded = await loadPaddle();
    if (!loaded) {
      throw new Error('Failed to load Paddle');
    }
    
    console.log('🔄 Opening lifetime checkout with PRICE ID');
    openPaddleCheckout(
      'pri_01kabghk4hhgbz2dnj353sv2td', // ← CORRECT PRICE ID for lifetime
      user.primaryEmailAddress?.emailAddress
    );
    
  } catch (error) {
    console.error('Payment failed:', error);
  }
};

const handleGetYearlyAccess = async () => {
  if (!user) {
    router.push("/sign-in");
    return;
  }
  
  try {
    const loaded = await loadPaddle();
    if (!loaded) {
      throw new Error('Failed to load Paddle');
    }
    
    console.log('🔄 Opening yearly checkout with PRICE ID');
    openPaddleCheckout(
      'pri_01kabgkj0y7cv0yae5c89730pa', // ← CORRECT PRICE ID for yearly
      user.primaryEmailAddress?.emailAddress
    );
    
  } catch (error) {
    console.error('Payment failed:', error);
  }
};

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <EnterpriseLayout 
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onUpgradeLifetime={handleGetLifetimeAccess}
      onUpgradeYearly={handleGetYearlyAccess}
    >
      <MainDashboard 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUpgradeLifetime={handleGetLifetimeAccess}
        onUpgradeYearly={handleGetYearlyAccess}
      />
    </EnterpriseLayout>
  )
}