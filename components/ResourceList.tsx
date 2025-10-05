"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResourceCard from "./resourceCard"
import { SidebarInput } from "./ui/sidebar"
import { useEffect, useState } from "react"

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
  boardTitle?: string
  boardCategory?: string
}

const ResourceList = ({ boardTitle, boardCategory }: ResourceListProps) => {
  const [resources, setResources] = useState<SearchResults>({
    books: [],
    videos: [],
    images: [],
    websites: []
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("books")
  const [hasAutoSearched, setHasAutoSearched] = useState(false)

  // Create clean, simple search queries - ONLY for board titles
  const createCleanQuery = (title: string): string => {
    // Only remove special characters that break URLs, keep most content
    let cleanTitle = title
      .replace(/[^\w\s\-]/gi, ' ') // Remove only problematic special characters
      .replace(/\s+/g, ' ')      // Replace multiple spaces
      .trim();

    // Limit length but don't cut words arbitrarily
    if (cleanTitle.length > 50) {
      cleanTitle = cleanTitle.substring(0, 50) + '...';
    }

    return cleanTitle;
  }

  // Fetch resources based on search query
  const fetchResources = async (query: string) => {
    if (!query.trim()) {
      setResources({ books: [], videos: [], images: [], websites: [] })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/recommendations/search?query=${encodeURIComponent(query)}`)
      
      if (response.ok) {
        const data = await response.json()
        setResources(data)
      } else {
        console.error('API response not OK:', response.status)
        setResources({ books: [], videos: [], images: [], websites: [] })
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      setResources({ books: [], videos: [], images: [], websites: [] })
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch resources when component mounts AND we have board data
  useEffect(() => {
    if (boardTitle && boardTitle !== "Untitled Board" && !hasAutoSearched) {
      // Only clean board titles, not manual searches
      const cleanQuery = createCleanQuery(boardTitle);
      setSearchQuery(cleanQuery)
      fetchResources(cleanQuery)
      setHasAutoSearched(true)
    }
  }, [boardTitle, boardCategory, hasAutoSearched])

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // Search when user presses Enter - NO CLEANING for manual searches
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Use the exact query user typed - no cleaning!
      fetchResources(searchQuery)
      setHasAutoSearched(true)
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
      case 'image':
        return resource.url || (resource.sourceData?.image?.source)
      default:
        return resource.url
    }
  }

  // Show appropriate empty state message
  const getEmptyStateMessage = () => {
    if (loading) {
      return "Loading resources..."
    }
    
    if (hasAutoSearched && boardTitle && boardTitle !== "Untitled Board") {
      return `Searching for "${searchQuery}"...`
    }
    
    if (searchQuery) {
      return `No ${activeTab} found for "${searchQuery}"`
    }
    
    return "Search for learning resources above"
  }

  // Render resources for current tab
  const renderResources = () => {
    const currentResources = resources[activeTab as keyof SearchResults] || []
    
    if (currentResources.length === 0) {
      return (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500 text-center px-4">
            {getEmptyStateMessage()}
          </p>
        </div>
      )
    }

    return currentResources.map((resource) => (
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
          <TabsTrigger value="images">Images</TabsTrigger>
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
        
        {/* Show what we're searching for */}
        {hasAutoSearched && boardTitle && boardTitle !== "Untitled Board" && (
          <div className="mt-2 text-sm text-gray-600">
            Showing resources for: <span className="font-medium">"{searchQuery}"</span>
            {loading && " (loading...)"}
          </div>
        )}
        
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