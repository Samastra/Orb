"use client"


import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import Link from "next/Link"
import { SiteHeader } from "@/components/site-header"
import BoardCard from "@/components/BoardCard"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { useUser } from "@clerk/nextjs" // ✅ FIX: Import from @clerk/nextjs
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation" // ✅ Add this


export const iframeHeight = "800px"
export const description = "A sidebar with a header and a search form."

export default function Page() {


const { user, isLoaded } = useUser()
    const router = useRouter() // ✅ Add router

    // ✅ FIX: Use router.push instead of redirect
    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in") // ✅ This will work in client components
        }
    }, [isLoaded, user, router]) // ✅ Add router to dependencies

    if (!isLoaded) return <div>Loading…</div>
    if (!user) return <div>Redirecting...</div> // ✅ Better loading state

   
        // ✅ USE: Real user data from Clerk
        const userData = {
          fullName: user.fullName || "Anonymous",
          username: user.username || "No username", 
          imageUrl: user.imageUrl || "/default-avatar.png",
          email: user.primaryEmailAddress?.emailAddress || "No email",
        }
        // Dummy sessions data
        const sessions = [
          // {
          //   id: 1,
          //   title: "Crash course: History of the Roman Empire",
          //   category: "Study",
          //   upvotes: 120,
          //   saves: 30,
          //   date: "2024-01-15"
          // },
          // {
          //   id: 2,
          //   title: "Advanced React Patterns Workshop",
          //   category: "Programming",
          //   upvotes: 85,
          //   saves: 42,
          //   date: "2024-01-10"
          // }
        ]
        
 

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
                <div className="col-span-2  grid grid-rows-[200px_1fr] gap-4">
                  {/* Top smaller box */}
                   <div className="py-10 px-6 bg-white/90 rounded-xl  rounded-3xl text-left gap-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-col items-center">
                             <label
                                  htmlFor="avatar-upload"
                                  className="w-24 h-24 rounded-full overflow-hidden border cursor-pointer group relative"
                                >
                                  <img
                                    width={96}
                                    height={96}
                                    src={userData.imageUrl} // ✅ FIX: Use userData
                                    alt="User avatar"
                                    className="w-full h-full object-cover"
                                  />
                                  {/* <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm">
                                    Change
                                  </div> */}
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
                

                  {/* Bottom bigger box */}
                  <div className="overflow-scroll  bg-white/90 rounded-xl p-7" >
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
                {sessions && sessions.length > 0 ?             
                  sessions.map((session) => (
                  <BoardCard
                    key={session.id}
                    title={session.title}
                    username={userData.username} // ✅ FIX: Use userData
                    boardcategory={session.category}
                    upvotes={session.upvotes}
                    saves={session.saves}
                  />
                )):(
                <div className = "flex flex-col h-full mt-10 items-center justify-center text-center space-y-4">
                  <Link href= "/boards/new" >
                  <Button>
                    Launch a Session
                  </Button>
                  
                  </Link>
                     <p className = "text-gray-500">No recent sessions for display</p>                 
                </div>)
                
                }
              </div>
                      </div>

                </div>
                {/* Right tall box */}
                <div className="bg-white/90 rounded-xl" >

                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
