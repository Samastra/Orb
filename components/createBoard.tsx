"use client"
import React, { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SelectOptions from './SelectOptions'
import { updateBoard } from '@/lib/actions/board-actions'
import { useRecommendations } from '@/context/RecommendationsContext'

interface CreateBoardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  onBoardUpdate?: (updates: { title: string; category: string }) => void; 
}

const Category = [
  { value: "Study / Education", label: "Study / Education" },
  { value: "Work / Office", label: "Work / Office" },
  { value: "Personal / Life", label: "Personal / Life" },
  { value: "Health / Fitness", label: "Health / Fitness" },
  { value: "Technology", label: "Technology" },
  { value: "Business", label: "Business" },
  { value: "Creative / Arts", label: "Creative / Arts" },
  { value: "Science", label: "Science" },
  { value: "Other", label: "Other" }
]

const Visibility = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" }
]   

const CreateBoard = ({ open, onOpenChange, boardId, onBoardUpdate }: CreateBoardProps) => {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [visibility, setVisibility] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setRecommendations } = useRecommendations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const updates = {
        title: title || "Untitled Board",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
        is_public: visibility === "public", 
        category: category
      }
      
      // 1. Update the board first
      await updateBoard(boardId, updates)
      
      // 2. Fetch recommendations immediately after board creation AND store them
      if (title && title !== "Untitled Board") {
        const query = category ? `${title} ${category}` : title
        try {
          const response = await fetch(`/api/recommendations/search?query=${encodeURIComponent(query)}`)
          if (response.ok) {
            const data = await response.json()
            setRecommendations(data) // Store in context
            console.log('Recommendations stored for board:', title)
          }
        } catch (error) {
          console.error('Failed to fetch recommendations:', error)
        }
      }
      
      // 3. Call the callback with new data
      if (onBoardUpdate) {
        onBoardUpdate({ title: updates.title, category: updates.category })
      }
      
      // 4. Close dialog without page reload
      onOpenChange(false)
      
    } catch (error) {
      console.error("Failed to update board:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setTitle("")
    setCategory("")
    setVisibility("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-gray-50 to-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-white/80 backdrop-blur-sm p-6 border-b border-gray-200/80">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Create Board
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Give your board a name and customize its settings to get started.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 min-w-[60px]">Title</Label>
                <Input 
                  id="title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Add a Title' 
                  className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <SelectOptions 
                  options={Category} 
                  placeholder='Select Category'
                  value={category}
                  onValueChange={setCategory}
                />
                <SelectOptions 
                  options={Visibility} 
                  placeholder='Select Visibility'
                  value={visibility}
                  onValueChange={setVisibility}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="bg-gray-50/80 backdrop-blur-sm px-6 py-4 border-t border-gray-200/80">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-lg border-gray-300 hover:bg-gray-100/80 transition-all duration-300 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg px-6 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Board"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateBoard