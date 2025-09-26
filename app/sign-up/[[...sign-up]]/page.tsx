// app/sign-up/[[...sign-up]]/page.tsx
"use client"
import { SignUp } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Add timeout to ensure profile page is working
      setTimeout(() => {
        router.push("/profilePage")
      }, 1000)
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) return <div>Loading...</div>
  if (isSignedIn) return <div>Redirecting to profile...</div>

  return <SignUp />
}