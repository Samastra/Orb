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

interface CreateBoardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  onBoardUpdate?: (updates: { title: string; category: string }) => void; 
}

const Category = [
  { value: "Study / Education", label: "Study / Education" },
  { value: "Work / Office", label: "Work / Office" },
  // ... your other categories
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const updates = {
        title: title || "Untitled Board",
        is_public: visibility === "public", 
        category: category
      }
      
      await updateBoard(boardId, updates)
      
      // Call the callback with new data
      if (onBoardUpdate) {
        onBoardUpdate({ title: updates.title, category: updates.category })
      }
      
      // Close dialog without page reload
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