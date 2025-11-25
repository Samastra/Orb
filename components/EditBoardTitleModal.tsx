"use client";
import { useState, useEffect } from "react";

interface EditBoardTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  currentCategory: string;
  onSave: (updates: { title: string; category: string }) => Promise<void>;
}

export default function EditBoardTitleModal({ 
  isOpen, 
  onClose, 
  currentTitle, 
  currentCategory,
  onSave 
}: EditBoardTitleModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [category, setCategory] = useState(currentCategory);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens/closes or current values change
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setCategory(currentCategory);
    }
  }, [isOpen, currentTitle, currentCategory]);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({ 
        title: title.trim(), 
        category: category.trim() 
      });
      onClose();
    } catch (error) {
      console.error("Failed to update board:", error);
      alert("Failed to update board title. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Board Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Board Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter board title"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter category (optional)"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}