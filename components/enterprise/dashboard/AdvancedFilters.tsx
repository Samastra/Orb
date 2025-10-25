"use client"

import { useState } from "react"
import { Filter, X, ChevronDown, Save } from "lucide-react"

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void
}

export default function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    type: [] as string[],
    dateRange: "",
    owner: "",
    tags: [] as string[]
  })

  const filterOptions = {
    status: ["Active", "Archived", "Draft"],
    type: ["Personal", "Team", "Public", "Private"],
    dateRange: ["Today", "Last 7 days", "Last 30 days", "Custom"],
    owners: ["Me", "Team Members", "Everyone"],
    tags: ["Design", "Development", "Marketing", "Planning", "Research"]
  }

  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    const currentFilters = activeFilters[category] as string[]
    const updated = currentFilters.includes(value)
      ? currentFilters.filter(item => item !== value)
      : [...currentFilters, value]
    
    const newFilters = { ...activeFilters, [category]: updated }
    setActiveFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const cleared = {
      status: [],
      type: [],
      dateRange: "",
      owner: "",
      tags: []
    }
    setActiveFilters(cleared)
    onFiltersChange(cleared)
  }

  const activeFilterCount = Object.values(activeFilters).reduce((count, filter) => {
    if (Array.isArray(filter)) return count + filter.length
    return count + (filter ? 1 : 0)
  }, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      
      {/* Filters Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                {activeFilterCount} active
              </span>
            )}
          </div>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {filtersOpen ? "Hide filters" : "Show filters"}
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {filtersOpen && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.status.map(status => (
                <button
                  key={status}
                  onClick={() => toggleFilter("status", status)}
                  className={`
                    px-3 py-1.5 text-sm rounded-full border transition-colors
                    ${activeFilters.status.includes(status)
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }
                  `}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.type.map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter("type", type)}
                  className={`
                    px-3 py-1.5 text-sm rounded-full border transition-colors
                    ${activeFilters.type.includes(type)
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-2">
              {filterOptions.dateRange.map(range => (
                <button
                  key={range}
                  onClick={() => setActiveFilters(prev => ({ ...prev, dateRange: range }))}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg border transition-colors
                    ${activeFilters.dateRange === range
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }
                  `}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleFilter("tags", tag)}
                  className={`
                    px-3 py-1.5 text-sm rounded-full border transition-colors
                    ${activeFilters.tags.includes(tag)
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}