"use client"

import { useState } from "react"
import { Filter, X, ChevronDown } from "lucide-react"

export default function AdvancedFilters({ onFiltersChange }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTag, setActiveTag] = useState("All")

  const tags = ["All", "Marketing", "Product", "Design", "Personal"]

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-bold transition-all border
              ${activeTag === tag 
                ? "bg-gray-900 text-white border-gray-900" 
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}
            `}
          >
            {tag}
          </button>
        ))}
        <button 
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 ml-auto"
        >
          <Filter className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-900">Filters</h3>
        <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      {/* Expanded filters would go here (Date, Owner, etc.) */}
      <div className="text-sm text-gray-400 italic">Advanced filters coming soon...</div>
    </div>
  )
}