// app/profile/page.tsx (Server component)
import { currentUser } from "@clerk/nextjs/server"
import ProfileClient from "@/components/profileClient"

export default async function ProfilePage() {
  const user = await currentUser()
  
  // ✅ JUST CHECK: Authentication, but don't pass user as prop
  if (!user) {
    return <div>Please sign in to view your profile</div>
  }

  return <ProfileClient /> // ✅ REMOVE: User prop
}