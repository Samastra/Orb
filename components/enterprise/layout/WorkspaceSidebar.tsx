"use client"

import { useState, useEffect } from "react"
import {
  LayoutGrid,
  Files,
  Star,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  FolderKanban
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getUserBoardsWithDetails } from "@/lib/actions/board-actions"
import Link from "next/link"
import { useSubscription } from "@/hooks/use-subscription"
import { loadPaddle, openPaddleCheckout } from "@/lib/paddle-loader"

// --- HAND DRAWN ASSETS ---
const SidebarScribble = () => (
  <svg className="absolute top-10 right-4 w-8 h-8 text-blue-400 transform rotate-12 opacity-60 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M10,50 Q40,10 80,50" strokeLinecap="round" />
    <path d="M80,50 L70,35 M80,50 L65,55" strokeLinecap="round" />
  </svg>
);

interface WorkspaceSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface Board {
  id: string
  title: string
  updated_at: string
}

export default function WorkspaceSidebar({ collapsed, onToggle }: WorkspaceSidebarProps) {
  const { user } = useUser()
  const [boards, setBoards] = useState<Board[]>([])
  const [recentBoards, setRecentBoards] = useState<Board[]>([])
  const { isPaid } = useSubscription()

  const handleCheckout = async (priceId: string) => {
    try {
      const loaded = await loadPaddle();
      if (loaded && user?.primaryEmailAddress?.emailAddress) {
        openPaddleCheckout(priceId, user.primaryEmailAddress.emailAddress);
      }
    } catch (e) { console.error(e); }
  };

  // Fetch logic (Kept your original logic intact)
  useEffect(() => {
    const fetchUserBoards = async () => {
      if (user?.id) {
        try {
          const userBoards = await getUserBoardsWithDetails(user.id, {
            username: user.username || undefined,
            fullName: user.fullName || undefined,
            imageUrl: user.imageUrl,
            email: user.primaryEmailAddress?.emailAddress
          })
          setBoards(userBoards || [])
          const recent = (userBoards || [])
            .sort((a: Board, b: Board) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5)
          setRecentBoards(recent)
        } catch (error) {
          console.error("Failed to fetch boards:", error)
        }
      }
    }
    fetchUserBoards()
  }, [user?.id])

  const mainNavItems = [
    { icon: LayoutGrid, label: "Studio", href: "/dashboard", active: true },
    { icon: Files, label: "All Boards", count: boards.length, href: "/dashboard" },
    { icon: Star, label: "Favorites", count: 0, href: "/dashboard?filter=favorites" },
    { icon: Clock, label: "Recent", count: recentBoards.length, href: "/dashboard?filter=recent" },
  ]

  const collectionItems = [
    { label: "Marketing Ideas", color: "bg-pink-500" },
    { label: "Product Roadmap", color: "bg-blue-500" },
    { label: "Random Thoughts", color: "bg-yellow-500" },
  ]

  return (
    <div className={`
      relative h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-30
      ${collapsed ? 'w-20' : 'w-72'}
    `}>
      {/* Header / Profile Switcher */}
      <div className="p-5 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold">
              {user?.firstName?.[0] || "O"}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm truncate max-w-[140px]">
                {user?.fullName || "Creator"}
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Personal Studio
              </span>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center text-white font-bold mx-auto">
            {user?.firstName?.[0] || "O"}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {mainNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`
              group flex items-center w-full p-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${item.active
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }
              ${collapsed ? 'justify-center' : 'justify-between'}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && item.count !== undefined && item.count > 0 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {item.count}
              </span>
            )}
          </Link>
        ))}

        {/* Collections (Simulated Folders) */}
        {!collapsed && (
          <div className="pt-8 pb-2">
            <div className="px-3 mb-2 flex items-center justify-between group">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Collections</h3>
              <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-blue-600" />
            </div>
            <div className="space-y-0.5">
              {collectionItems.map((item, i) => (
                <button key={i} className="flex items-center gap-3 w-full p-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* New Board Button */}
      <div className="p-4 relative">
        {!collapsed && boards.length === 0 && <SidebarScribble />}

        <Link href="/boards/new">
          <button className={`
            flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-blue-500/25
            ${collapsed ? 'p-3 aspect-square' : 'py-3 px-4'}
          `}>
            <Plus className="w-5 h-5" />
            {!collapsed && <span className="font-semibold">New Board</span>}
          </button>
        </Link>
      </div>

      {/* Upgrade Card - Shows for free users */}
      {!collapsed && !isPaid && (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-900">Upgrade to Pro</span>
          </div>
          <p className="text-[10px] text-blue-700 mb-3 leading-relaxed">
            Get unlimited boards and AI insights.
          </p>
          <button
            onClick={() => handleCheckout('pri_01kaehgc2qw3vkd42763qrrewe')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <Link href="/settings">
          <button className={`p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors ${collapsed && 'mx-auto'}`}>
            <Settings className="w-5 h-5" />
          </button>
        </Link>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapsed Toggle (Centered) */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2 text-gray-300 hover:text-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}