"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResourceCard from "./resourceCard"
import { SidebarInput } from "./ui/sidebar"
import { useEffect, useState } from "react"
import { useRecommendations } from '@/context/RecommendationsContext'
import SelectOptions from './SelectOptions' // Import your existing Select component

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
  images: Resource[] // Combined photos + vectors
  websites: Resource[]
}

interface ResourceListProps {
  boardTitle?: string
  boardCategory?: string
}

// Image type options for the filter
const ImageTypes = [
  { value: "all", label: "All Images" },
  { value: "photo", label: "📷 Photos" },
  { value: "vector", label: "🎨 Vectors" }
]

// Default empty results
const emptyResults: SearchResults = {
  books: [],
  videos: [],
  images: [],
  websites: []
}

const ResourceList = ({ boardTitle, boardCategory }: ResourceListProps) => {
  const { recommendations } = useRecommendations()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("books")
  const [manualSearchResults, setManualSearchResults] = useState<SearchResults | null>(null)
  const [imageTypeFilter, setImageTypeFilter] = useState("all") // "all", "photo", "vector"

  // Use stored recommendations by default, manual search results when user searches
  const displayResources = manualSearchResults || recommendations

  // Fetch resources ONLY for manual search
  const fetchResources = async (query: string) => {
    if (!query.trim()) {
      setManualSearchResults(null)
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/recommendations/search?query=${encodeURIComponent(query)}`)
      
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

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setManualSearchResults(null)
    }
  }

  // Search when user presses Enter - ONLY for manual searches
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      fetchResources(searchQuery)
    }
  }

  // Get URL for resource based on type
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

  // Show appropriate empty state message
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

  // Filter images based on selected type
  const getFilteredImages = (): Resource[] => {
    const allImages = displayResources.images || []
    
    if (imageTypeFilter === "all") {
      return allImages
    }
    
    return allImages.filter(image => image.type === imageTypeFilter)
  }

  // Safe way to get current resources for active tab
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

  // Render resources for current tab
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

    // GRID LAYOUT FOR IMAGES TAB
    if (activeTab === 'images') {
      return (
        <div className="grid grid-cols-2 gap-3">
          {currentResources.map((resource: Resource) => (
            <ResourceCard 
              key={resource.id}
              heading={resource.heading}
              body={resource.body}
              image={resource.image}
              alt={resource.alt}
              type={resource.type as any}
              url={getResourceUrl(resource)}
            />
          ))}
        </div>
      )
    }

    // REGULAR LAYOUT FOR OTHER TABS
    return currentResources.map((resource: Resource) => (
      <div key={resource.id} className="mb-3">
        <ResourceCard 
          heading={resource.heading}
          body={resource.body}
          image={resource.image}
          alt={resource.alt}
          type={resource.type as any}
          url={getResourceUrl(resource)}
        />
      </div>
    ))
  }

  return (
    <Tabs defaultValue="books" className="mx-3" onValueChange={setActiveTab}>
      <div className="mx-1">
        <TabsList>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="images">🖼️ Images</TabsTrigger>
        </TabsList>
        
        <SidebarInput 
          id="search" 
          placeholder="Search learning resources..."
          className="h-8 pl-7 mt-3"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        
        {/* Image Type Filter - Only show on Images tab */}
        {activeTab === 'images' && (
          <div className="mt-3">
            <SelectOptions 
              options={ImageTypes} 
              placeholder="Filter image type"
              value={imageTypeFilter}
              onValueChange={setImageTypeFilter}
            />
          </div>
        )}
        
        {/* Show what we're displaying */}
        {manualSearchResults ? (
          <div className="mt-2 text-sm text-gray-600">
            Showing results for: <span className="font-medium">"{searchQuery}"</span>
            {loading && " (loading...)"}
          </div>
        ) : boardTitle && boardTitle !== "Untitled Board" ? (
          <div className="mt-2 text-sm text-gray-600">
            Recommendations for: <span className="font-medium">"{boardTitle}"</span>
          </div>
        ) : null}
        
        <div className="border border-gray-300 rounded-lg p-1 mt-2 mx-auto h-96 overflow-y-auto">
          <TabsContent value="books" className="mt-0">
            {renderResources()}
          </TabsContent>
          
          <TabsContent value="videos" className="mt-0">
            {renderResources()}
          </TabsContent>
          
          <TabsContent value="websites" className="mt-0">
            {renderResources()}
          </TabsContent>
          
          <TabsContent value="images" className="mt-0">
            {renderResources()}
          </TabsContent>
        </div>
      </div>
    </Tabs>
  )
}

export default ResourceList