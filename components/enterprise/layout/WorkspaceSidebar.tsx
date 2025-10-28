"use client"

import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  Files, 
  Users, 
  Settings, 
  Search,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getUserBoardsWithDetails } from "@/lib/actions/board-actions"
import Link from "next/link"

interface WorkspaceSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface Board {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function WorkspaceSidebar({ collapsed, onToggle }: WorkspaceSidebarProps) {
  const { user } = useUser()
  const [activeWorkspace, setActiveWorkspace] = useState("personal")
  const [boards, setBoards] = useState<Board[]>([])
  const [recentBoards, setRecentBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch user's boards for counts
  useEffect(() => {
    const fetchUserBoards = async () => {
      if (user?.id) {
        try {
          setLoading(true)
          const userBoards = await getUserBoardsWithDetails(user.id, {
            username: user.username || undefined,
            fullName: user.fullName || undefined,
            imageUrl: user.imageUrl,
            email: user.primaryEmailAddress?.emailAddress
          })
          
          setBoards(userBoards || [])
          
          // Get recent boards (last 5)
          const recent = (userBoards || [])
            .sort((a: Board, b: Board) => 
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            .slice(0, 5)
          setRecentBoards(recent)
          
        } catch (error) {
          console.error("Failed to fetch user boards for sidebar:", error)
          setBoards([])
          setRecentBoards([])
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserBoards()
  }, [user])

  const workspaces = [
    { id: "personal", name: "Orb Brainstorming", type: "personal" },
    // We'll add teams dynamically when we implement teams
  ]

  const mainNavItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      active: true,
      href: "/dashboard"
    },
    { 
      icon: Files, 
      label: "All Boards", 
      count: boards.length,
      href: "/dashboard"
    },
    { 
      icon: Star, 
      label: "Favorites", 
      count: 0, // We'll implement favorites later
      href: "/dashboard?filter=favorites"
    },
    { 
      icon: Clock, 
      label: "Recent", 
      count: recentBoards.length,
      href: "/dashboard?filter=recent"
    },
    { 
      icon: Users, 
      label: "Shared with Me",
      count: 0, // We'll implement sharing later
      href: "/dashboard?filter=shared"
    },
  ]

  // For now, we'll show placeholder teams - we'll implement real teams later
  const teamNavItems = [
    { label: "No teams yet", count: 0 },
  ]

  return (
    <div className={`
      flex flex-col bg-white border-r border-gray-200 transition-all duration-300
      ${collapsed ? 'w-20' : 'w-80'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Orb Brainstorming</h2>
              <p className="text-xs text-gray-500">Personal Workspace</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Workspace Switcher */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200">
          <select 
            value={activeWorkspace}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {workspaces.map(workspace => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={collapsed ? "Search..." : "Search boards, teams..."}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {mainNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`
              flex items-center w-full p-3 rounded-lg text-sm font-medium transition-colors
              ${item.active 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
              }
              ${collapsed ? 'justify-center' : 'justify-between'}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && item.count !== undefined && (
              <span className={`
                px-2 py-1 rounded text-xs font-medium
                ${item.count > 0 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-500'
                }
              `}>
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Teams Section */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Teams
            </h3>
            <button 
              className="p-1 hover:bg-gray-100 rounded"
              title="Create team (coming soon)"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-1">
            {teamNavItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between w-full p-2 rounded-lg text-sm text-gray-500"
              >
                <span className="italic">{item.label}</span>
                <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link 
          href="/settings"
          className={`
            flex items-center w-full p-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors
            ${collapsed ? 'justify-center' : 'justify-start gap-3'}
          `}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )
}