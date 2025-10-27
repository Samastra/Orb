"use client"

import { useState } from "react"
import { 
  MoreVertical, 
  Users, 
  Lock, 
  Globe, 
  Star,
  Eye,
  Calendar,
  Edit,
  Archive,
  Trash2,
  Share2
} from "lucide-react"
import { updateBoard, deleteBoard } from "@/lib/actions/board-actions"
import { toggleFavorite } from "@/lib/actions/favorite-actions"
import { useUser } from "@clerk/nextjs"
import ShareBoardModal from "@/components/enterprise/sharing/ShareBoardModal"

// const ShareBoardModal = ({
//   isOpen,
//   onClose,
//   boardId,
//   boardTitle
// }: {
//   isOpen: boolean
//   onClose: () => void
//   boardId: string
//   boardTitle: string
// }) => {
//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div
//         className="absolute inset-0 bg-black opacity-50"
//         onClick={onClose}
//       />
//       <div className="bg-white rounded-lg p-4 z-10 max-w-md w-full">
//         <h3 className="text-lg font-semibold mb-2">Share "{boardTitle}"</h3>
//         <p className="text-sm text-gray-600 mb-4">Board ID: {boardId}</p>
//         <div className="flex justify-end gap-2">
//           <button
//             onClick={onClose}
//             className="px-3 py-1 bg-gray-100 rounded"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }


interface EnterpriseBoardCardProps {
  id: string
  title: string
  description?: string
  category: string
  members?: number
  isPublic: boolean
  lastModified: string
  isFavorite?: boolean
  onFavorite?: (boardId: string, newFavoriteState: boolean) => void
  onClick?: () => void
  onUpdate?: () => void
}

export default function EnterpriseBoardCard({
  id,
  title,
  description,
  category,
  members = 0,
  isPublic,
  lastModified,
  isFavorite = false,
  onFavorite,
  onClick,
  onUpdate
}: EnterpriseBoardCardProps) {
  const { user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user?.id || isUpdating) return
    
    try {
      setIsUpdating(true)
      const newFavoriteState = await toggleFavorite(user.id, id)
      setLocalIsFavorite(newFavoriteState)
      onFavorite?.(id, newFavoriteState)
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
      // Revert local state on error
      setLocalIsFavorite(!localIsFavorite)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTogglePublic = async () => {
    if (!user?.id || isUpdating) return
    
    try {
      setIsUpdating(true)
      await updateBoard(id, { is_public: !isPublic })
      setMenuOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error("Failed to update board visibility:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user?.id || isUpdating) return
    
    if (!confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
      return
    }
    
    try {
      setIsUpdating(true)
      await deleteBoard(id)
      setMenuOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error("Failed to delete board:", error)
      alert("Failed to delete board. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  return (
    <>
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
    >
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            category === 'Design' ? 'bg-pink-500' :
            category === 'Development' ? 'bg-blue-500' :
            category === 'Marketing' ? 'bg-green-500' :
            category === 'Planning' ? 'bg-purple-500' :
            category === 'Research' ? 'bg-orange-500' :
            'bg-gray-500'
          }`} />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {category || "General"}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleToggleFavorite}
            className={`p-1 rounded-lg transition-colors ${
              localIsFavorite 
                ? "text-yellow-500 hover:bg-yellow-50" 
                : "text-gray-400 hover:bg-gray-100 hover:text-yellow-500"
            }`}
          >
            <Star className={`w-4 h-4 ${localIsFavorite ? "fill-current" : ""}`} />
          </button>
          
          <div className="relative">
            <button 
              onClick={handleMenuClick}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick?.()
                    setMenuOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Open board</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTogglePublic()
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  <span>Make {isPublic ? "Private" : "Public"}</span>
                </button>
               <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsShareModalOpen(true) // ← ADD THIS
                    setMenuOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share board</span>
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete board</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title || "Untitled Board"}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {isPublic ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            <span>{isPublic ? "Public" : "Private"}</span>
          </div>
          
          {members > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{members}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(lastModified)}</span>
        </div>
      </div>

    </div>
         <ShareBoardModal 
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      boardId={id}
      boardTitle={title}
    />

    </>
  )
}