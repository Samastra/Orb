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

const ResourceList = () => {
  const [resources, setResources] = useState<SearchResults>({
    books: [],
    videos: [],
    images: [],
    websites: []
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("books")

  // Fetch resources based on search query
  const fetchResources = async (query: string) => {
    if (!query.trim()) {
      // Clear results if empty query
      setResources({ books: [], videos: [], images: [], websites: [] })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/recommendations/search?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setResources(data)
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // Search when user presses Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
      case 'image':
        return resource.url || (resource.sourceData?.image?.source)
      default:
        return resource.url
    }
  }

  // Render resources for current tab
  const renderResources = () => {
    const currentResources = resources[activeTab as keyof SearchResults] || []
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <p>Loading resources...</p>
        </div>
      )
    }

    if (currentResources.length === 0 && searchQuery) {
      return (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">No {activeTab} found for "{searchQuery}"</p>
        </div>
      )
    }

    if (currentResources.length === 0) {
      return (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Search for learning resources above</p>
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
        />
        
        <div className="border border-gray-300 rounded-lg p-1 mt-4 mx-auto h-96 overflow-y-auto">
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