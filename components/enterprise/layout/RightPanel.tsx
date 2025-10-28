"use client"

import { useState, useEffect } from "react"
import { 
  X, 
  MessageSquare, 
  Clock, 
  Users, 
  Star,
  Filter,
  Download,
  Share2,
  Plus,
  Edit
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getUserBoardsWithDetails } from "@/lib/actions/board-actions"

interface BoardData {
  id: string;
  title?: string;
  category?: string;
  is_public?: boolean;
  updated_at?: string;
  created_at: string;
}

interface UserData {
  username?: string;
  fullName?: string;
  imageUrl?: string;
  email?: string;
}

interface RightPanelProps {
  onClose: () => void
}

interface Activity {
  id: string
  user: string
  action: string
  target: string
  time: string
  type: "create" | "update" | "comment" | "share"
}

export default function RightPanel({ onClose }: RightPanelProps) {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<"activity" | "details" | "comments">("activity")
  const [boards, setBoards] = useState<BoardData[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch user's boards for activity and stats
  useEffect(() => {
    const fetchData = async () => {
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

          // Generate real activity from user's boards
          const activity: Activity[] = (userBoards || [])
            .sort((a: BoardData, b: BoardData) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 4)
            .map((board: BoardData, index: number) => ({
              id: board.id,
              user: "You",
              action: index === 0 ? "created" : "updated",
              target: board.title || "Untitled Board",
              time: formatTimeAgo(board.updated_at || board.created_at),
              type: index === 0 ? "create" : "update"
            }))

          setRecentActivity(activity)
          
        } catch (error) {
          console.error("Failed to fetch data for right panel:", error)
          setBoards([])
          setRecentActivity([])
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [user])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const quickStats = [
    { 
      label: "Total Boards", 
      value: boards.length.toString(), 
      change: `${boards.filter((b: BoardData) => b.is_public).length} public` 
    },
    { 
      label: "Team Members", 
      value: "1", // Just the user for now
      change: "You" 
    },
    { 
      label: "Active Projects", 
      value: boards.length.toString(), 
      change: "All boards" 
    },
    { 
      label: "Recently Updated", 
      value: recentActivity.filter(a => a.type === "update").length.toString(), 
      change: "this week" 
    }
  ]

  const getRecentBoards = () => {
    return boards
      .sort((a: BoardData, b: BoardData) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 3)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "activity", label: "Activity", icon: Clock },
          { id: "details", label: "Details", icon: Users },
          { id: "comments", label: "Comments", icon: MessageSquare }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "activity" | "details" | "comments")}
            className={`
              flex items-center gap-2 flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        
        {activeTab === "activity" && (
          <div className="p-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {quickStats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="flex-shrink-0 w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'create' ? 'bg-green-500' :
                      activity.type === 'update' ? 'bg-blue-500' :
                      activity.type === 'comment' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Workspace Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Workspace</label>
                  <p className="text-sm font-medium">Orb Brainstorming</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Plan</label>
                  <p className="text-sm font-medium">Free Plan</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Member Since</label>
                  <p className="text-sm font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Boards */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Boards</h4>
              <div className="space-y-2">
                {getRecentBoards().map((board: BoardData) => (
                  <div 
                    key={board.id}
                    onClick={() => window.location.href = `/boards/${board.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        board.category === 'Design' ? 'bg-pink-500' :
                        board.category === 'Development' ? 'bg-blue-500' :
                        board.category === 'Marketing' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm text-gray-700 group-hover:text-blue-600 truncate max-w-[180px]">
                        {board.title || "Untitled Board"}
                      </span>
                    </div>
                    <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                {getRecentBoards().length === 0 && !loading && (
                  <p className="text-sm text-gray-500 text-center py-2">No boards yet</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = "/boards/new"}
                  className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Board</span>
                </button>
                <button className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filter Views</span>
                </button>
                <button className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share Workspace</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="p-4">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No comments yet</p>
              <p className="text-xs text-gray-400 mt-1">Comments will appear here when people discuss your boards</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}