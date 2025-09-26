// app/profilePage/page.tsx
import { currentUser } from "@clerk/nextjs/server"
import ProfileClient from "@/components/profileClient"

export default async function ProfilePage() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return <div>Please sign in to view your profile</div>
    }

    return <ProfileClient />
  } catch (error) {
    console.error('Error getting user:', error)
    return <div>Error loading profile. Please try again.</div>
  }
}