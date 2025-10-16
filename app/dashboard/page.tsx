"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import BoardCard from "@/components/BoardCard"
import BoardCardSkeleton from "@/components/BoardCardSkeleton"
import UserProfileSkeleton from "@/components/UserProfileSkeleton"
import FloatingActionButton from "@/components/FloatingActionButton"
import {
  SidebarInput,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Globe,
  Zap,
  Clock,
  Star
} from "lucide-react"
import { getUserBoards, getPublicBoards } from "@/lib/actions/board-actions"

export default function Page() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [myBoards, setMyBoards] = useState<Board[]>([])
  const [publicBoards, setPublicBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    const fetchBoards = async () => {
      if (user?.id) {
        try {
          setLoading(true)
          
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

  // Filter boards based on search and active filter
  const filteredMyBoards = myBoards.filter(board => {
    const title = board.title?.toLowerCase() || ""
    const category = board.category?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    
    return title.includes(query) || category.includes(query)
  })

  const filterButtons = [
    { key: "all", label: "All", icon: <Zap className="w-3 h-3" /> },
    { key: "recent", label: "Recent", icon: <Clock className="w-3 h-3" /> },
    { key: "starred", label: "Starred", icon: <Star className="w-3 h-3" /> }
  ]

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>
              <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col xl:flex-row gap-6 w-full">
                  {/* Left side skeleton - FIXED LAYOUT */}
                  <div className="flex-1 min-w-0 space-y-6">
                    {/* User profile skeleton */}
                    <UserProfileSkeleton />
                    
                    {/* My Sessions skeleton with GRID */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                      <section className="flex items-center justify-between mb-6">
                        <div className="space-y-2">
                          <div className="h-7 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-9 bg-gray-200 rounded w-16"></div>
                          <div className="h-9 bg-gray-200 rounded w-48"></div>
                        </div>
                      </section>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                          <BoardCardSkeleton key={i} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side skeleton - FIXED WIDTH */}
                  <div className="xl:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-9 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <BoardCardSkeleton key={i} />
                        ))}
                      </div>
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

  if (!user) return <div>Redirecting...</div>

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />

        <div className="flex flex-1">
          <AppSidebar />

          <SidebarInset>
            {/* FIXED: Better responsive layout */}
            <div className="flex flex-1 flex-col p-6">
              <div className="flex flex-col xl:flex-row gap-6 w-full">
                
                {/* Left Column - Profile + My Sessions */}
                <div className="flex-1 min-w-0 space-y-6">
                  
                  {/* User Profile Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 cursor-pointer group relative">
                            <img
                              width={80}
                              height={80}
                              src={userData.imageUrl}
                              alt="User avatar"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                          </div>
                          <div className="flex gap-1 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-gray-500">Online</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h1 className="font-bold text-2xl text-gray-900">{userData.fullName}</h1>
                          <h3 className="font-semibold text-gray-600">@{userData.username}</h3>
                          <p className="text-sm text-gray-500 mt-1">{userData.email}</p>
                          
                          {/* Quick Stats */}
                          <div className="flex gap-6 mt-4">
                            <div className="text-center">
                              <div className="font-bold text-lg text-blue-600">{myBoards.length}</div>
                              <div className="text-xs text-gray-500">Sessions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg text-green-600">
                                {myBoards.filter(b => b.is_public).length}
                              </div>
                              <div className="text-xs text-gray-500">Public</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg text-purple-600">0</div>
                              <div className="text-xs text-gray-500">Teams</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                        <Button variant="outline" className="gap-2">
                          <Users className="w-4 h-4" />
                          Groups
                        </Button>
                        <Link href="/boards/new">
                          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Plus className="w-4 h-4" />
                            New Session
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* My Sessions */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                    <section className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
                        <p className="text-sm text-gray-500 mt-1">
                          {filteredMyBoards.length} of {myBoards.length} board{myBoards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Quick Filters */}
                        <div className="flex items-center gap-2">
                          {filterButtons.map((filter) => (
                            <button 
                              key={filter.key}
                              onClick={() => setActiveFilter(filter.key)}
                              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${
                                activeFilter === filter.key 
                                  ? "bg-blue-100 text-blue-700" 
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {filter.icon}
                              <span>{filter.label}</span>
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            <Filter className="w-4 h-4" />
                            <span>Sort</span>
                          </div>
                          <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input 
                              type="text"
                              placeholder="Search my boards..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                    
                    {/* GRID LAYOUT */}
                    {filteredMyBoards.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
                        {filteredMyBoards.map((board) => (
                          <BoardCard
                            key={board.id}
                            title={board.title}
                            username={userData.username}
                            boardcategory={board.category}
                            upvotes={0}
                            saves={0}
                            boardId={board.id}
                            createdAt={board.created_at}
                            isPublic={board.is_public}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Zap className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchQuery ? "No matching sessions" : "No sessions yet"}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                          {searchQuery 
                            ? "Try adjusting your search terms or filters"
                            : "Create your first board to start organizing your ideas and collaborating with others."
                          }
                        </p>
                        <Link href="/boards/new">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Create Your First Session
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Public Boards - FIXED WIDTH */}
                <div className="xl:w-80 flex-shrink-0 space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <h2 className="text-xl font-bold text-gray-900">Public Boards</h2>
                        </div>
                        <p className="text-sm text-gray-500">
                          {publicBoards.length} public board{publicBoards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {/* Search input */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input 
                          type="text"
                          placeholder="Search public boards..."
                          className="h-9 w-48 text-sm pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* GRID LAYOUT */}
                    {publicBoards.length > 0 ? (
                      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {publicBoards.map((board) => (
                          <BoardCard
                            key={board.id}
                            title={board.title}
                            username={board.users?.username || board.users?.full_name || "Anonymous"}
                            boardcategory={board.category}
                            upvotes={0}
                            saves={0}
                            boardId={board.id}
                            createdAt={board.created_at}
                            isPublic={board.is_public}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Globe className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No public boards available yet</p>
                        <p className="text-gray-400 text-xs mt-1">Be the first to share a public board!</p>
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