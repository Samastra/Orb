"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import EnterpriseLayout from "@/components/enterprise/layout/EnterpriseLayout"
import MainDashboard from "@/components/enterprise/dashboard/MainDashboard"
import { loadPaddle } from '@/lib/paddle-loader'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleGetLifetimeAccess = async () => {
    if (!user) {
      router.push("/sign-in")
      return
    }
    
    try {
      await loadPaddle();
      
      window.Paddle.Checkout.open({
        items: [
          {
            priceId: 'pro_01kab5k19nxxqbjnr848wd2pa2', // Your lifetime product ID
            quantity: 1,
          }
        ],
        customer: {
          email: user.primaryEmailAddress?.emailAddress,
        },
        settings: {
          successUrl: `${window.location.origin}/payment-success`,
        }
      });
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  }

  const handleGetYearlyAccess = async () => {
    if (!user) {
      router.push("/sign-in")
      return
    }
    
    try {
      await loadPaddle();
      
      window.Paddle.Checkout.open({
        items: [
          {
            priceId: 'pro_01kab5mnpcb64a0a3vzx5gzj4m', // Your yearly product ID
            quantity: 1,
          }
        ],
        customer: {
          email: user.primaryEmailAddress?.emailAddress,
        },
        settings: {
          successUrl: `${window.location.origin}/payment-success`,
        }
      });
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  }

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