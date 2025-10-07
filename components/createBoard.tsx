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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
            <DialogDescription>
              Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Add a Title' 
              />
            </div>
            <div className="flex items-center justify-between">
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
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Add to board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateBoard