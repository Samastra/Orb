"use client"
import { SignIn } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (isSignedIn) {
    return <div>Redirecting to dashboard...</div>
  }

  // ✅ FIX: Add redirectUrl prop to tell Clerk where to go after sign-in
  return (
    <SignIn 
      redirectUrl="/dashboard"
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-none"
        }
      }}
    />
  )
}