"use client"
import { useUser } from "@clerk/nextjs" // ✅ FIX: Import from @clerk/nextjs
import Navbar from "@/components/navbar"
import BoardCard from "@/components/BoardCard"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"



const ProfileClient = () => { // ✅ REMOVE: User prop since we'll use useUser hook
  const { user } = useUser() // ✅ GET: User from Clerk hook
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!user) {
    return <div>Please sign in</div>
  }

  // ✅ USE: Real user data from Clerk
  const userData = {
    fullName: user.fullName || "Anonymous",
    username: user.username || "No username", 
    imageUrl: user.imageUrl || "/default-avatar.png",
    email: user.primaryEmailAddress?.emailAddress || "No email",
  }
  // Dummy sessions data
  const sessions = [
    {
      id: 1,
      title: "Crash course: History of the Roman Empire",
      category: "Study",
      upvotes: 120,
      saves: 30,
      date: "2024-01-15"
    },
    {
      id: 2,
      title: "Advanced React Patterns Workshop",
      category: "Programming",
      upvotes: 85,
      saves: 42,
      date: "2024-01-10"
    }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  return (
    <div className="bg-grey-200 min-h-screen">
      <Navbar/>

      <div className="mx-10 bg-white p-10 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.15)] text-left gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center">
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="avatar-upload"
                className="w-24 h-24 rounded-full overflow-hidden border cursor-pointer group relative"
              >
                <img
                  width={96}
                  height={96}
                  src={previewUrl || userData.imageUrl} // ✅ FIX: Use userData
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm">
                  Change
                </div>
              </label>
            </div>
            
            <div className="ml-10">
              <h1 className="font-bold text-3xl">{userData.fullName}</h1> {/* ✅ FIX: Use userData */}
              <h3 className="font-semibold">@{userData.username}</h3> {/* ✅ FIX: Use userData */}
              <p className="text-sm text-gray-600">{userData.email}</p> {/* ✅ FIX: Use userData */}
            </div>
          </div>
          
          <div>
            <Button>Groups</Button>
          </div>
        </div>
      </div>

      <div className="mx-4 sm:mx-10 lg:mx-20 my-10">
        <section className="flex items-center justify-between">
          <h1 className="text-3xl font-600">My Sessions</h1>
          <div className="flex items-center justify-between gap-1">
            <img src="/image/sort.svg" alt="filter-icon" />
            <h3>Filter</h3>
            <input 
              type="text"
              placeholder="Search boards"
              className="border border-gray-300 rounded-lg px-4 py-2 ml-5"        
            />
          </div>
        </section>

        <div className="mt-10 overflow-scroll bg-white p-5 rounded-lg space-y-4">
          {sessions.map((session) => (
            <BoardCard
              key={session.id}
              title={session.title}
              username={userData.username} // ✅ FIX: Use userData
              boardcategory={session.category}
              upvotes={session.upvotes}
              saves={session.saves}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfileClient // ✅ FIX: Export ProfileClient (not ProfilePage)