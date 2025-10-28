"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { acceptInvitation } from "@/lib/actions/share-actions"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function AcceptInvitePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const processInvitation = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Invalid invitation link")
        return
      }

      try {
        // If user is not signed in, redirect to sign-in with callback
        if (!user) {
          router.push(`/sign-in?redirect_url=${encodeURIComponent(`/accept-invite?token=${token}`)}`)
          return
        }

        // Process the invitation
        const result = await acceptInvitation(user.id, token)
        
        setStatus("success")
        setMessage(`Successfully joined "${result.boardTitle}"!`)
        
        // Redirect to the board after 2 seconds
        setTimeout(() => {
          router.push(`/boards/${result.boardId}`)
        }, 2000)

      } catch (error) {
        console.error("Failed to accept invitation:", error)
        setStatus("error")
        setMessage("Invalid or expired invitation link")
      }
    }

    if (isLoaded) {
      processInvitation()
    }
  }, [isLoaded, user, token, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Invitation</h2>
          <p className="text-gray-600">Please wait while we add you to the board...</p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <p className="text-sm text-gray-500">Redirecting to the board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}