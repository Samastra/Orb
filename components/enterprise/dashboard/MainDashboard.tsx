"use client"

import { useState, useEffect } from "react"
import DashboardViewToggle from "./DashboardViewToggle"
import AdvancedFilters from "./AdvancedFilters"
import { useUser } from "@clerk/nextjs"
import { Plus, ArrowRight, Calendar, Star, MoreHorizontal, Layout, Lock, Globe } from "lucide-react"
import { getUserBoardsWithDetails, getUserBoardsWithFavorites, searchBoards } from "@/lib/actions/board-actions"
import Link from "next/link"

// --- BENTO BOARD CARD COMPONENT (Inline for simplicity) ---
const BentoBoardCard = ({ board, onClick, onFavorite }: any) => (
  <div 
    onClick={onClick}
    className="group relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-[220px]"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center transition-colors
        ${board.category === 'Marketing' ? 'bg-purple-50 text-purple-600' : 
          board.category === 'Product' ? 'bg-blue-50 text-blue-600' : 
          'bg-gray-50 text-gray-600'}
      `}>
        <Layout className="w-5 h-5" />
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onFavorite(board.id, !board.isFavorite); }}
        className={`p-1.5 rounded-lg transition-colors ${board.isFavorite ? 'text-yellow-400 bg-yellow-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
      >
        <Star className="w-4 h-4 fill-current" />
      </button>
    </div>

    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
      {board.title}
    </h3>
    <p className="text-sm text-gray-500 line-clamp-2 mb-auto leading-relaxed">
      {board.description}
    </p>

    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-400">
      <div className="flex items-center gap-2">
        {board.isPublic ? (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <Globe className="w-3 h-3" /> Public
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" /> Private
          </div>
        )}
      </div>
      <span className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {new Date(board.lastModified).toLocaleDateString()}
      </span>
    </div>
  </div>
)

export default function MainDashboard({ searchQuery = "", onSearchChange = () => {} }: any) {
  const { user, isLoaded } = useUser()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [boards, setBoards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Data (Simplified logic for clarity)
  useEffect(() => {
    if (isLoaded && user?.id) {
      setLoading(true)
      getUserBoardsWithDetails(user.id, {
        username: user.username || undefined,
        fullName: user.fullName || undefined,
        imageUrl: user.imageUrl,
        email: user.primaryEmailAddress?.emailAddress
      }).then((data) => {
        const mapped = (data || []).map((b: any) => ({
          id: b.id,
          title: b.title || "Untitled Board",
          description: b.description || "No description provided.",
          category: b.category || "General",
          isPublic: b.is_public || false,
          lastModified: b.updated_at || b.created_at,
          isFavorite: b.is_favorited || false,
        }))
        setBoards(mapped)
        setLoading(false)
      })
    }
  }, [isLoaded, user])

  const recentBoard = boards[0]; // The most recently updated board

  if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">Loading your studio...</div>

  return (
    <div className="space-y-10">
      
      {/* 1. HERO SECTION: "Jump Back In" */}
      {recentBoard && !searchQuery && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Jump Back In</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <div 
            onClick={() => window.location.href = `/boards/${recentBoard.id}`}
            className="group relative w-full h-[280px] bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer overflow-hidden flex"
          >
            {/* Left: Content Info */}
            <div className="w-1/3 p-8 flex flex-col justify-center relative z-10 bg-white/90 backdrop-blur-sm">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold w-fit mb-4">
                Last Edited
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {recentBoard.title}
              </h2>
              <p className="text-gray-500 line-clamp-2 mb-8">
                {recentBoard.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                Continue Working <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right: Visual Preview (Simulated Pattern) */}
            <div className="w-2/3 h-full bg-[#F9FAFB] relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#CBD5E1 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
              {/* Decorative shapes to mimic a board */}
              <div className="absolute top-10 right-20 w-40 h-40 bg-white border border-gray-200 rounded-xl shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-700" />
              <div className="absolute top-32 right-40 w-48 h-32 bg-yellow-50 border border-yellow-100 rounded-xl shadow-md transform -rotate-2 group-hover:-rotate-3 transition-transform duration-700" />
            </div>
          </div>
        </section>
      )}

      {/* 2. MAIN GRID */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">All Boards</h2>
          <div className="flex items-center gap-3">
            <DashboardViewToggle view={view} onViewChange={(v) => setView(v as any)} />
            <Link href="/boards/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-lg hover:shadow-xl">
                <Plus className="w-4 h-4" /> New Board
              </button>
            </Link>
          </div>
        </div>

        {/* Filters (Simplified for visual clarity) */}
        <div className="mb-8">
          <AdvancedFilters onFiltersChange={() => {}} />
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Your studio is empty</h3>
            <p className="text-gray-500 mb-6">Start your first brainstorming session now.</p>
            <Link href="/boards/new">
              <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all">
                Create First Board
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {boards.map(board => (
              <BentoBoardCard 
                key={board.id} 
                board={board} 
                onClick={() => window.location.href = `/boards/${board.id}`}
                onFavorite={(id: string, val: boolean) => {
                  setBoards(prev => prev.map(b => b.id === id ? { ...b, isFavorite: val } : b))
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}