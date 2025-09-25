import { SignIn } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
  const user = await currentUser()
  
  // If already signed in, redirect to profile
  if (user) {
    redirect('/profilePage')
  }

  return <SignIn />
}