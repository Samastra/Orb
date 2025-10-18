"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResourceCard from "./resourceCard"
import { SidebarInput } from "./ui/sidebar"
import { useEffect, useState } from "react"
import { useRecommendations } from '@/context/RecommendationsContext'
import SelectOptions from './SelectOptions'
import { Search, RefreshCw, Sparkles, LayoutTemplate } from "lucide-react"

interface Resource {
  id: string
  heading: string
  body?: string
  image?: string
  alt: string
  type: string
  url?: string
  videoId?: string
  sourceData?: any
}

interface SearchResults {
  books: Resource[]
  videos: Resource[]
  images: Resource[]
  websites: Resource[]
}

interface ResourceListProps {
  boardTitle?: string;
  boardCategory?: string;
  onAddToBoard?: (imageUrl: string, altText: string) => void; // ← ADD THIS
}
const ImageTypes = [
  { value: "all", label: "All Images" },
  { value: "photo", label: "📷 Photos" },
  { value: "vector", label: "🎨 Vectors" }
]

const emptyResults: SearchResults = {
  books: [],
  videos: [],
  images: [],
  websites: []
}

const ResourceList = ({ boardTitle, boardCategory, onAddToBoard }: ResourceListProps) => {
  const { recommendations } = useRecommendations()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("boards") // NEW: Boards tab first
  const [manualSearchResults, setManualSearchResults] = useState<SearchResults | null>(null)
  const [imageTypeFilter, setImageTypeFilter] = useState("all")
  const [refreshCount, setRefreshCount] = useState(0)

  // Use stored recommendations by default, manual search results when user searches
  const displayResources = manualSearchResults || recommendations

  // NEW: Mock similar boards data (you'll replace this with real AI logic)
  const similarBoards = [
    {
      id: "1",
      title: "Product Design System",
      category: "Design",
      collaborators: 3,
      lastUpdated: "2 hours ago",
      thumbnail: "/board-thumb-1.svg"
    },
    {
      id: "2", 
      title: "UX Research Findings",
      category: "Research",
      collaborators: 2,
      lastUpdated: "1 day ago",
      thumbnail: "/board-thumb-2.svg"
    },
    {
      id: "3",
      title: "Marketing Campaign Layout",
      category: "Marketing", 
      collaborators: 5,
      lastUpdated: "3 days ago",
      thumbnail: "/board-thumb-3.svg"
    }
  ]

  const fetchResources = async (query: string, isRefresh = false) => {
    if (!query.trim() && !isRefresh) {
      setManualSearchResults(null)
      return
    }
    
    setLoading(true)
    try {
      const url = `/api/recommendations/search?query=${encodeURIComponent(query)}&refresh=${isRefresh ? 'true' : 'false'}&refreshCount=${refreshCount}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json() as SearchResults
        setManualSearchResults(data)
      } else {
        console.error('API response not OK:', response.status)
        setManualSearchResults(emptyResults)
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      setManualSearchResults(emptyResults)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    const currentQuery = searchQuery || (boardTitle && boardTitle !== "Untitled Board" 
      ? boardTitle + (boardCategory ? ` ${boardCategory}` : '')
      : '');

    if (currentQuery) {
      setRefreshCount(prev => prev + 1)
      fetchResources(currentQuery, true)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setManualSearchResults(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setRefreshCount(0)
      fetchResources(searchQuery)
    }
  }

  useEffect(() => {
    if (boardTitle && boardTitle !== "Untitled Board" && !manualSearchResults) {
      const query = boardTitle + (boardCategory ? ` ${boardCategory}` : '')
      setSearchQuery(query)
      setRefreshCount(0)
      fetchResources(query)
    }
  }, [boardTitle, boardCategory, manualSearchResults])

  const getResourceUrl = (resource: Resource): string | undefined => {
    switch (resource.type) {
      case 'video':
        return resource.videoId ? `https://youtube.com/watch?v=${resource.videoId}` : resource.url
      case 'website':
        return resource.url || (resource.sourceData?.content_urls?.desktop?.page)
      case 'book':
        return resource.url || (resource.sourceData?.volumeInfo?.infoLink)
      case 'photo':
        return resource.url || (resource.sourceData?.url)
      case 'vector':
        return resource.url || (resource.sourceData?.url)
      default:
        return resource.url
    }
  }

  const getEmptyStateMessage = () => {
    if (loading) {
      return "Loading resources..."
    }
    
    if (manualSearchResults && searchQuery) {
      return `No ${activeTab} found for "${searchQuery}"`
    }
    
    if (boardTitle && boardTitle !== "Untitled Board") {
      return `No recommendations found for "${boardTitle}"`
    }
    
    return "Search for learning resources above"
  }

  const getFilteredImages = (): Resource[] => {
    const allImages = displayResources.images || []
    
    if (imageTypeFilter === "all") {
      return allImages
    }
    
    return allImages.filter(image => image.type === imageTypeFilter)
  }

  const getCurrentResources = (): Resource[] => {
    if (!displayResources) return []
    
    switch (activeTab) {
      case 'books':
        return displayResources.books || []
      case 'videos':
        return displayResources.videos || []
      case 'websites':
        return displayResources.websites || []
      case 'images':
        return getFilteredImages()
      default:
        return []
    }
  }

  // NEW: Render similar boards
  const renderSimilarBoards = () => {
    if (similarBoards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-3">
          <LayoutTemplate className="w-12 h-12 text-gray-300" />
          <p className="text-sm">No similar boards found</p>
          <p className="text-xs text-gray-400">Create more boards to get recommendations</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {similarBoards.map((board) => (
          <div 
            key={board.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/80 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              {/* Board Thumbnail */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <LayoutTemplate className="w-6 h-6 text-blue-600" />
              </div>
              
              {/* Board Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {board.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {board.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {board.collaborators} collaborators
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Updated {board.lastUpdated}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderResources = () => {
    const currentResources = getCurrentResources()
    
    if (currentResources.length === 0) {
      return (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500 text-center px-4">
            {getEmptyStateMessage()}
          </p>
        </div>
      )
    }

   // In ResourceList.tsx - Update the grid layout for images to use 3 columns
if (activeTab === 'images') {
  return (
    <div className="grid grid-cols-3 gap-3"> {/* Changed from 2 to 3 columns */}
      {currentResources.map((resource: Resource) => (
       <ResourceCard 
        key={resource.id}
        heading={resource.heading}
        body={resource.body}
        image={resource.image}
        alt={resource.alt}
        type={resource.type as any}
        url={getResourceUrl(resource)}
        onAddToBoard={onAddToBoard} // ← ADD THIS
      />
      ))}
    </div>
  )
}

    return currentResources.map((resource: Resource) => (
      <div key={resource.id} className="mb-3">
      <ResourceCard 
        key={resource.id}
        heading={resource.heading}
        body={resource.body}
        image={resource.image}
        alt={resource.alt}
        type={resource.type as any}
        url={getResourceUrl(resource)}
        onAddToBoard={onAddToBoard} // ← ADD THIS
      />
      </div>
    ))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              AI Recommendations
            </h2>
            <p className="text-sm text-gray-600">
              Smart resources for your project
            </p>
          </div>
        </div>

        {/* Search and Refresh */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              placeholder="Search learning resources..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading || (!searchQuery.trim() && (!boardTitle || boardTitle === "Untitled Board"))}
            className={`
              h-10 px-3 rounded-xl border bg-white/80 text-sm font-medium
              flex items-center justify-center min-w-10
              transition-all duration-300
              ${loading || (!searchQuery.trim() && (!boardTitle || boardTitle === "Untitled Board"))
                ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-300' 
                : 'text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md cursor-pointer'
              }
            `}
            title="Get new results"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Current Search Info */}
        {manualSearchResults ? (
          <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
            <span>Showing results for: <span className="font-medium">"{searchQuery}"</span></span>
            {loading && (
              <span className="flex items-center gap-1 text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>loading new results...</span>
              </span>
            )}
          </div>
        ) : boardTitle && boardTitle !== "Untitled Board" ? (
          <div className="mt-3 text-sm text-gray-600">
            Recommendations for: <span className="font-medium">"{boardTitle}"</span>
            {loading && (
              <span className="flex items-center gap-1 text-blue-600 ml-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>loading...</span>
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Tabs Content */}
      <div className="flex-1 p-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Premium Tabs */}
          <TabsList className="grid grid-cols-5 mb-6 bg-gray-100/80 p-1 rounded-xl border border-gray-200/80">
            <TabsTrigger value="boards" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <LayoutTemplate className="w-4 h-4" />
              Boards
            </TabsTrigger>
            <TabsTrigger value="books" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Books
            </TabsTrigger>
            <TabsTrigger value="videos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Videos
            </TabsTrigger>
            <TabsTrigger value="websites" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Websites
            </TabsTrigger>
            <TabsTrigger value="images" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Images
            </TabsTrigger>
          </TabsList>

          {/* Image Type Filter - Only show on Images tab */}
          {activeTab === 'images' && (
            <div className="mb-4">
              <SelectOptions 
                options={ImageTypes} 
                placeholder="Filter image type"
                value={imageTypeFilter}
                onValueChange={setImageTypeFilter}
              />
            </div>
          )}

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto">
            {/* NEW: Similar Boards Tab */}
            <TabsContent value="boards" className="mt-0 h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Similar Boards</h3>
                  <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                    AI Suggested
                  </span>
                </div>
                {renderSimilarBoards()}
              </div>
            </TabsContent>

            {/* Existing Resource Tabs */}
            <TabsContent value="books" className="mt-0 h-full">
              {renderResources()}
            </TabsContent>
            
            <TabsContent value="videos" className="mt-0 h-full">
              {renderResources()}
            </TabsContent>
            
            <TabsContent value="websites" className="mt-0 h-full">
              {renderResources()}
            </TabsContent>
            
            <TabsContent value="images" className="mt-0 h-full">
              {renderResources()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default ResourceList