"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import BoardCard from "@/components/BoardCard"
import {
  SidebarInput,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SearchForm } from "@/components/search-form"
import { getUserBoards, getPublicBoards } from "@/lib/actions/board-actions" // Add these imports



export default function Page() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [myBoards, setMyBoards] = useState<Board[]>([])
  const [publicBoards, setPublicBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ FIX: Use router.push instead of redirect
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [isLoaded, user, router])

  // Fetch boards when user is loaded
  // In your dashboard useEffect
useEffect(() => {
  const fetchBoards = async () => {
    if (user?.id) {
      try {
        setLoading(true)
        
        // Pass Clerk user data to the function
        const userBoards = await getUserBoards(user.id, {
          username: user.username,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          email: user.primaryEmailAddress?.emailAddress
        })
        setMyBoards(userBoards)
        
        const publicBoardsData = await getPublicBoards()
        setPublicBoards(publicBoardsData)
        
      } catch (error) {
        console.error("Failed to fetch boards:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  fetchBoards()
}, [user?.id])

  if (!isLoaded || loading) return <div>Loading…</div>
  if (!user) return <div>Redirecting...</div>

  // ✅ USE: Real user data from Clerk
  const userData = {
    fullName: user.fullName || "Anonymous",
    username: user.username || "No username", 
    imageUrl: user.imageUrl || "/default-avatar.png",
    email: user.primaryEmailAddress?.emailAddress || "No email",
  }


  type User = {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}
  // Add type for board data
type Board = {
  id: string
  title: string
  category: string
  is_public: boolean
  created_at: string
  owner_id: string 
  users?: User
}

  return (
    <div className="[--header-height:calc(--spacing(14))] bg-grey-100">
      <SidebarProvider className="flex flex-col">
        {/* Top header */}
        <SiteHeader />

        {/* Main content area */}
        <div className="flex flex-1">
          {/* Left sidebar */}
          <AppSidebar />

          {/* Main content inset */}
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
              {/* === The main grid layout === */}
              <div className="grid grid-cols-3 gap-4 flex-1">
                {/* Left side (2 stacked boxes) */}
                <div className="col-span-2 grid grid-rows-[200px_1fr] gap-4">
                  {/* Top smaller box */}
                  <div className="py-10 px-6 bg-white/90 rounded-3xl text-left gap-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <label className="w-24 h-24 rounded-full overflow-hidden border cursor-pointer group relative">
                            <img
                              width={96}
                              height={96}
                              src={userData.imageUrl}
                              alt="User avatar"
                              className="w-full h-full object-cover"
                            />
                          </label>
                        </div>
                        <div className="ml-4">
                          <h1 className="font-bold text-3xl">{userData.fullName}</h1>
                          <h3 className="font-semibold">@{userData.username}</h3>
                          <p className="text-sm text-gray-600">{userData.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-left gap-3 justify-center">
                        <Button>Groups</Button>
                        <Link href={"/boards/new"}>
                          <Button>New session</Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom bigger box - My Sessions */}
                  <div className="overflow-scroll bg-white/90 rounded-xl p-7">
                    <section className="flex items-center justify-between m-3">
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
                    <div className="bg-white p-5 rounded-md space-y-4">
                      {myBoards.length > 0 ?             
                        myBoards.map((board) => (
                          <BoardCard
                            key={board.id}
                            title={board.title}
                            username={userData.username}
                            boardcategory={board.category}
                            upvotes={0} // You can add these to your database later
                            saves={0}
                            boardId={board.id} // Pass board ID for navigation
                          />
                        )) : (
                        <div className="flex flex-col h-full mt-10 items-center justify-center text-center space-y-4">
                          <Link href="/boards/new">
                            <Button>Launch a Session</Button>
                          </Link>
                          <p className="text-gray-500">No recent sessions for display</p>                 
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right tall box - Public Boards */}
                <div className="bg-white/90 rounded-xl p-5">
                  <div className="flex items-center justify-center m-2">
                    <h2>Public Boards</h2>
                    <SidebarInput 
                      id="search" 
                      placeholder="Search public boards..."
                      className="h-8 pl-7"
                    />
                  </div>
                  <div className="space-y-4">
                    {publicBoards.length > 0 ?              
                      publicBoards.map((board) => (
                        <BoardCard
                          key={board.id}
                          title={board.title}
                          username={board.users?.username || board.users?.full_name || "User"} // You might want to fetch usernames separately
                          boardcategory={board.category}
                          upvotes={0}
                          saves={0}
                          boardId={board.id}
                        />
                      )) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No public boards available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}