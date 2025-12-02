"use client"

import { LayoutGrid, List } from "lucide-react"

interface DashboardViewToggleProps {
  view: "grid" | "list"
  onViewChange: (view: "grid" | "list") => void
}

export default function DashboardViewToggle({ view, onViewChange }: DashboardViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
      <button
        onClick={() => onViewChange("grid")}
        className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}