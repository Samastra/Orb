"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentSuccess() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // You'll process the Paddle webhook here later
    // For now, just show success
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-gray-600 mb-2">
          Thank you for upgrading to Orblin Pro!
        </p>
        
        <p className="text-gray-500 text-sm mb-8">
          Your account has been upgraded. You now have access to all premium features.
        </p>

        <div className="space-y-4">
          <Button 
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3"
          >
            <Zap className="w-5 h-5 mr-2" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Link href="/boards/new" className="block">
            <Button variant="outline" className="w-full">
              Create Your First Board
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Having issues? Contact our support team.
        </p>
      </div>
    </div>
  )
}