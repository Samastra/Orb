"use client"

import { useState, useEffect } from "react"
import DashboardViewToggle from "./DashboardViewToggle"
import AdvancedFilters from "./AdvancedFilters"
import EnterpriseBoardCard from "../cards/EnterpriseBoardCard"
import { useUser } from "@clerk/nextjs"
import { 
  Plus, 
  Grid3X3, 
  Users,
  Zap,
  Activity
} from "lucide-react"
import { 
  getUserBoardsWithDetails, 
  getBoardStats,
  searchBoards,
  getUserBoardsWithFavorites 
} from "@/lib/actions/board-actions"
import Link from "next/link"

type ViewType = "grid" | "list" | "kanban"

interface Board {
  id: string
  title: string
  description?: string
  category: string
  isPublic: boolean
  lastModified: string
  members: number
  isFavorite: boolean
  created_at: string
}

interface MainDashboardProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function MainDashboard({ 
  searchQuery = "", 
  onSearchChange = () => {} 
}: MainDashboardProps) {
  const { user, isLoaded } = useUser()
  const [currentView, setCurrentView] = useState<ViewType>("grid")
  const [boards, setBoards] = useState<Board[]>([])
  const [filteredBoards, setFilteredBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBoards: 0,
    teamMembers: 0,
    activeProjects: 0,
    publicBoards: 0
  })

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      if (isLoaded && user?.id) {
        setLoading(true)
        try {
          // Fetch boards and stats in parallel
          const [boardsData, statsData] = await Promise.all([
            getUserBoardsWithDetails(user.id, {
              username: user.username,
              fullName: user.fullName,
              imageUrl: user.imageUrl,
              email: user.primaryEmailAddress?.emailAddress
            }),
            getBoardStats(user.id)
          ])

          // Transform boards data to match our component
          const transformedBoards: Board[] = (boardsData || []).map((board: any) => ({
            id: board.id,
            title: board.title || "Untitled Board",
            description: board.description || "Add a description to your board...",
            category: board.category || "General",
            isPublic: board.is_public || false,
            lastModified: board.updated_at || board.created_at,
            members: 0, // We'll implement teams later
            isFavorite: false, // We'll implement favorites later
            created_at: board.created_at
          }))

          setBoards(transformedBoards)
          setFilteredBoards(transformedBoards)
          setStats({
            totalBoards: statsData.totalBoards,
            teamMembers: statsData.teamMembers,
            activeProjects: statsData.activeProjects,
            publicBoards: statsData.publicBoards
          })

        } catch (error) {
          console.error("Failed to fetch dashboard data:", error)
          // Set empty state on error
          setBoards([])
          setFilteredBoards([])
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [isLoaded, user])

  // Handle search from parent component
  useEffect(() => {
    const handleSearch = async () => {
      if (!user?.id) return

      if (!searchQuery.trim()) {
        // If search is empty, show all boards
        const boardsData = await getUserBoardsWithFavorites(user.id, {
          username: user.username,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          email: user.primaryEmailAddress?.emailAddress
        })

        
        const transformedBoards: Board[] = (boardsData || []).map((board: any) => ({
          id: board.id,
          title: board.title || "Untitled Board",
          description: board.description || "Add a description to your board...",
          category: board.category || "General",
          isPublic: board.is_public || false,
          lastModified: board.updated_at || board.created_at,
          members: 0,
          isFavorite: board.is_favorited || false, // Use the real favorite status
          created_at: board.created_at
        }))
        
        setFilteredBoards(transformedBoards)
        return
      }

      // Perform actual search
      try {
        const searchResults = await searchBoards(user.id, searchQuery)
        
        const transformedBoards: Board[] = (searchResults || []).map((board: any) => ({
          id: board.id,
          title: board.title || "Untitled Board",
          description: board.description || "Add a description to your board...",
          category: board.category || "General",
          isPublic: board.is_public || false,
          lastModified: board.updated_at || board.created_at,
          members: 0,
          isFavorite: false,
          created_at: board.created_at
        }))
        
        setFilteredBoards(transformedBoards)
      } catch (error) {
        console.error("Search failed:", error)
      }
    }

    handleSearch()
  }, [searchQuery, user])

  const handleFiltersChange = (filters: any) => {
    // For now, we'll implement basic filtering client-side
    // We can enhance this with server-side filtering later
    let filtered = boards

    // Status filtering
    if (filters.status.length > 0) {
      // We'll implement archived/draft status later
    }

    // Type filtering
    if (filters.type.length > 0) {
      if (filters.type.includes("Public")) {
        filtered = filtered.filter(board => board.isPublic)
      }
      if (filters.type.includes("Private")) {
        filtered = filtered.filter(board => !board.isPublic)
      }
    }

    setFilteredBoards(filtered)
  }

        const handleFavorite = (boardId: string, newFavoriteState: boolean) => {
        // Update local state immediately for better UX
        setBoards(prev => prev.map(board => 
          board.id === boardId 
            ? { ...board, isFavorite: newFavoriteState }
            : board
        ))
        setFilteredBoards(prev => prev.map(board => 
          board.id === boardId 
            ? { ...board, isFavorite: newFavoriteState }
            : board
        ))
      }

  if (!isLoaded || loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* REMOVED DASHBOARD HEADER - IT'S NOW IN THE LAYOUT */}
      
      {/* Quick Stats - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Grid3X3 className="w-5 h-5" />}
          label="Total Boards"
          value={stats.totalBoards.toString()}
          change={`${stats.publicBoards} public`}
          trend="up"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Team Members"
          value={stats.teamMembers.toString()}
          change={stats.teamMembers === 0 ? "Create a team" : "+2 recently"}
          trend={stats.teamMembers === 0 ? "neutral" : "up"}
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Active Projects"
          value={stats.activeProjects.toString()}
          change="All boards"
          trend="neutral"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Public Boards"
          value={stats.publicBoards.toString()}
          change={`${Math.round((stats.publicBoards / stats.totalBoards) * 100)}% of total`}
          trend="up"
        />
      </div>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {stats.totalBoards === 0 
              ? "Create your first board to get started" 
              : `Managing ${stats.totalBoards} boards, ${stats.publicBoards} public`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DashboardViewToggle 
            view={currentView} 
            onViewChange={setCurrentView} 
          />
          
          <Link href="/boards/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              New Board
            </button>
          </Link>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters onFiltersChange={handleFiltersChange} />

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        
        {/* Content Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {searchQuery ? `Search results for "${searchQuery}"` : "All Boards"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredBoards.length} of {boards.length} boards
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Sort by: Last modified</span>
          </div>
        </div>

        {/* Boards Grid - REAL DATA */}
        {currentView === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredBoards.map((board) => (
              <EnterpriseBoardCard
                key={board.id}
                id={board.id}
                title={board.title}
                description={board.description}
                category={board.category}
                members={board.members}
                isPublic={board.isPublic}
                lastModified={board.lastModified}
                isFavorite={board.isFavorite}
                onFavorite={handleFavorite}
                onClick={() => window.location.href = `/boards/${board.id}`}
              />
            ))}
          </div>
        )}

        {currentView === "list" && (
          <div className="space-y-3">
            {filteredBoards.map((board) => (
              <div 
                key={board.id}
                onClick={() => window.location.href = `/boards/${board.id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    board.category === 'Design' ? 'bg-pink-500' :
                    board.category === 'Development' ? 'bg-blue-500' :
                    board.category === 'Marketing' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {board.title}
                    </h3>
                    <p className="text-sm text-gray-600">{board.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{board.isPublic ? "Public" : "Private"}</span>
                  <span>{new Date(board.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {filteredBoards.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No boards found" : "No boards yet"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {searchQuery 
                ? "Try adjusting your search terms or create a new board"
                : "Create your first board to start organizing your ideas and collaborating with others."
              }
            </p>
            <Link href="/boards/new">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Your First Board
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component (same as before)
function StatCard({ icon, label, value, change, trend }: { 
  icon: React.ReactNode
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
}) {
  const trendColors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50", 
    neutral: "text-gray-600 bg-gray-50"
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${trendColors[trend]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-xs font-medium mt-3 ${trendColors[trend]} inline-block px-2 py-1 rounded-full`}>
        {change}
      </p>
    </div>
  )
}

// Skeleton Loader (same as before)
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16 mt-3"></div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-6"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center justify-between pt-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}