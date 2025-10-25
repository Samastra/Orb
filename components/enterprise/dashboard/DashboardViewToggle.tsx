"use client"

import { LayoutGrid, List, Kanban } from "lucide-react"

interface DashboardViewToggleProps {
  view: "grid" | "list" | "kanban"
  onViewChange: (view: "grid" | "list" | "kanban") => void
}

export default function DashboardViewToggle({ view, onViewChange }: DashboardViewToggleProps) {
  const views = [
    { id: "grid" as const, label: "Grid", icon: LayoutGrid },
    { id: "list" as const, label: "List", icon: List },
    { id: "kanban" as const, label: "Kanban", icon: Kanban }
  ]

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {views.map((viewOption) => (
        <button
          key={viewOption.id}
          onClick={() => onViewChange(viewOption.id)}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all
            ${view === viewOption.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
            }
          `}
        >
          <viewOption.icon className="w-4 h-4" />
          <span>{viewOption.label}</span>
        </button>
      ))}
    </div>
  )
}