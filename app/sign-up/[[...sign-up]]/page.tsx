import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { SignUp } from "@clerk/nextjs"

export default async function SignUpPage() {
  const user = await currentUser()
  
  // If already signed in, redirect to profile
  if (user) {
    redirect('/profilePage')
  }

  return <SignUp />
}