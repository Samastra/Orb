"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Trash2, Globe, Lock, X, Users, Eye, Calendar, Folder, Loader2 } from "lucide-react"
import { getUserBoards, deleteBoard, updateBoard } from "@/lib/actions/board-actions"

interface Board {
  id: string
  title: string
  is_public: boolean
  category?: string
  created_at: string
  owner_id: string
}

interface ManageBoardsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function ManageBoardsModal({ open, onOpenChange, userId }: ManageBoardsModalProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    if (open && userId) {
      fetchUserBoards()
    }
  }, [open, userId])

  const fetchUserBoards = async () => {
    try {
      setLoading(true)
      const userBoards = await getUserBoards(userId)
      setBoards(userBoards || [])
    } catch (error) {
      console.error("Failed to fetch boards:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleBoardSelection = (boardId: string) => {
    setSelectedBoards(prev =>
      prev.includes(boardId)
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    )
  }

  const selectAllBoards = () => {
    setSelectedBoards(
      selectedBoards.length === filteredBoards.length
        ? []
        : filteredBoards.map(board => board.id)
    )
  }

  const handleDeleteSelected = async () => {
    if (!selectedBoards.length) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedBoards.length} board(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setDeleteLoading(true)
    try {
      for (const boardId of selectedBoards) {
        await deleteBoard(boardId)
      }
      await fetchUserBoards()
      setSelectedBoards([])
    } catch (error) {
      console.error("Failed to delete boards:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleVisibility = async (isPublic: boolean) => {
    if (!selectedBoards.length) return
    
    setUpdateLoading(true)
    try {
      for (const boardId of selectedBoards) {
        await updateBoard(boardId, { is_public: isPublic })
      }
      await fetchUserBoards()
    } catch (error) {
      console.error("Failed to update boards:", error)
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] w-[90vw] h-[90vh] flex flex-col p-0 bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden border-0 shadow-2xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white/80 backdrop-blur-sm">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Manage Boards
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                <span>{boards.length} board{boards.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-green-600" />
                <span>{boards.filter(b => b.is_public).length} public</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4 text-gray-500" />
                <span>{boards.filter(b => !b.is_public).length} private</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-full hover:bg-gray-100 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Enhanced Toolbar */}
        <div className="flex items-center gap-4 p-6 border-b bg-white/60 backdrop-blur-sm">
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search boards by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            <Button variant="outline" className="gap-2 rounded-lg border-gray-300 hover:bg-gray-50 transition-all">
              <Filter className="w-4 h-4" />
              Filter
              <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">3</Badge>
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={selectAllBoards}
            className="rounded-lg border-gray-300 hover:bg-gray-50 transition-all"
          >
            {selectedBoards.length === filteredBoards.length ? "Deselect All" : "Select All"}
          </Button>
        </div>

        {/* Enhanced Board Grid */}
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-white to-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="text-gray-500">Loading your boards...</p>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No boards found</p>
              {searchQuery && (
                <p className="text-sm">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBoards.map((board) => (
                <BoardManagementCard
                  key={board.id}
                  board={board}
                  isSelected={selectedBoards.includes(board.id)}
                  onSelect={() => toggleBoardSelection(board.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Bulk Actions Footer */}
        {selectedBoards.length > 0 && (
          <div className="border-t p-6 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{selectedBoards.length}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedBoards.length} board{selectedBoards.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleToggleVisibility(true)}
                  disabled={deleteLoading || updateLoading}
                  className="gap-2 rounded-lg border-green-200 bg-white hover:bg-green-50 hover:border-green-300 transition-all"
                >
                  {updateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  Make Public
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleToggleVisibility(false)}
                  disabled={deleteLoading || updateLoading}
                  className="gap-2 rounded-lg border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  {updateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Make Private
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={deleteLoading || updateLoading}
                  className="gap-2 rounded-lg bg-red-600 hover:bg-red-700 transition-all shadow-sm"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteLoading ? "Deleting..." : "Delete Selected"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Enhanced Board Card Component
function BoardManagementCard({ 
  board, 
  isSelected, 
  onSelect 
}: { 
  board: Board
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div 
      className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 w-full backdrop-blur-sm ${
        isSelected 
          ? "border-blue-500 bg-blue-50/80 shadow-lg shadow-blue-100 scale-[1.02]" 
          : "border-gray-200/80 bg-white/70 hover:border-gray-300 hover:shadow-lg hover:scale-[1.01]"
      }`}
      onClick={onSelect}
    >
      {/* Selection Glow Effect */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-blue-500/5 border-2 border-blue-500/20" />
      )}
      
      <div className="flex items-start gap-3 w-full relative">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="mt-1 flex-shrink-0 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
        />
        <div className="flex-1 min-w-0 space-y-3 w-full">
          {/* Header with title and visibility badge */}
          <div className="flex items-start justify-between w-full gap-2">
            <h3 className="font-semibold text-gray-900 truncate flex-1 text-lg leading-tight group-hover:text-gray-700 transition-colors">
              {board.title}
            </h3>
            <Badge 
              variant={board.is_public ? "default" : "secondary"}
              className={`flex items-center gap-1 flex-shrink-0 ${
                board.is_public 
                  ? "bg-green-100 text-green-700 hover:bg-green-200" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {board.is_public ? (
                <>
                  <Globe className="w-3 h-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  Private
                </>
              )}
            </Badge>
          </div>
          
          {/* Category with icon */}
          {board.category && (
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600 truncate">
                {board.category}
              </p>
            </div>
          )}
          
          {/* Date and additional info */}
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{board.is_public ? "Visible to all" : "Only you"}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}