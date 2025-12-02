"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResourceCard from "./resourceCard";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRecommendations } from "@/context/RecommendationsContext";
import { Search, RefreshCw, Layout, Book, Video, Globe, Image as ImageIcon, Loader2 } from "lucide-react";

// --- TYPES (Matching your API) ---
interface Resource {
  id: string;
  heading: string;
  body?: string;
  image?: string;
  alt: string;
  type: string;
  url?: string;
  videoId?: string;
  sourceData?: Record<string, unknown>;
}

interface SearchResults {
  books: Resource[];
  videos: Resource[];
  images: Resource[];
  websites: Resource[];
  query?: string;
  timestamp?: string;
}

interface ResourceListProps {
  boardTitle?: string;
  boardCategory?: string;
  onAddToBoard?: (imageUrl: string, altText: string) => void;
  onPlayVideo?: (videoId: string, title: string) => void;
  onOpenWebsite?: (url: string, title: string) => void;
  boardElements?: any;
}

const emptyResults: SearchResults = {
  books: [],
  videos: [],
  images: [],
  websites: [],
};

const ResourceList = ({
  boardTitle,
  boardCategory,
  onAddToBoard,
  onPlayVideo,
  onOpenWebsite,
  boardElements,
}: ResourceListProps) => {
  const { recommendations, setRecommendations, hasCachedRecommendations } = useRecommendations();
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("videos");
  const [manualSearchResults, setManualSearchResults] = useState<SearchResults | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [page, setPage] = useState(1);

  // --- 1. DEBOUNCE UTILITY ---
  const debounce = (func: (value: string) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(value), delay);
    };
  };

  // --- 2. FETCH LOGIC (RESTORED) ---
  const fetchResources = useCallback(async (query: string, isRefresh = false) => {
    if (!query.trim() && !isRefresh) {
      setManualSearchResults(null);
      return;
    }

    // Check cache
    if (!isRefresh && hasCachedRecommendations && recommendations.query === query) {
      console.log('📁 Using cached recommendations');
      setManualSearchResults(recommendations);
      return;
    }

    console.log("🔍 Fetching resources for:", query);

    try {
      setSearchLoading(true);
      const url = `/api/recommendations/search?query=${encodeURIComponent(
        query
      )}&refresh=${isRefresh ? "true" : "false"}&refreshCount=${refreshCount}&page=${page}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = (await response.json()) as SearchResults;
        console.log("✅ API Results received:", data);
        
        setRecommendations({
          ...data,
          query: query
        });
        setManualSearchResults(data);
      } else {
        console.error("API response not OK:", response.status);
        setManualSearchResults(emptyResults);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      setManualSearchResults(emptyResults);
    } finally {
      setSearchLoading(false);
    }
  }, [refreshCount, page, hasCachedRecommendations, recommendations, setRecommendations]);

  // --- 3. SEARCH HANDLER ---
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
      if (value.trim()) {
        if (hasCachedRecommendations && recommendations.query === value) {
          setManualSearchResults(recommendations);
        } else {
          setRefreshCount(0);
          fetchResources(value);
        }
      } else {
        setManualSearchResults(null);
      }
    }, 800),
    [fetchResources, hasCachedRecommendations, recommendations]
  );

  // --- 4. INITIAL AUTO-SEARCH (ON MOUNT) ---
  useEffect(() => {
    // If we have a board title but no results yet, auto-search
    if (boardTitle && boardTitle !== "Untitled Board" && !manualSearchResults && !searchQuery) {
      const initialQuery = boardTitle + (boardCategory ? ` ${boardCategory}` : "");
      console.log("🚀 Triggering initial auto-scan for:", initialQuery);
      setSearchQuery(initialQuery);
      fetchResources(initialQuery);
    }
  }, [boardTitle, boardCategory]); // Run when title changes

  const handleRefresh = () => {
    const currentQuery = searchQuery || (boardTitle && boardTitle !== "Untitled Board" ? boardTitle : "");
    if (currentQuery) {
      setRefreshCount((prev) => prev + 1);
      fetchResources(currentQuery, true);
    }
  };

  // --- 5. RENDER HELPERS ---
  const displayResources = manualSearchResults || recommendations;
  const currentResources = useMemo(() => {
    if (!displayResources) return [];
    // Map your API keys to the Tab IDs
    switch (activeTab) {
      case "books": return displayResources.books || [];
      case "videos": return displayResources.videos || [];
      case "websites": return displayResources.websites || [];
      case "images": return displayResources.images || [];
      default: return [];
    }
  }, [activeTab, displayResources]);

  return (
    <div className="h-full flex flex-col bg-white">
      
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Search for context..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all"
          title="Refresh results"
        >
          <RefreshCw className={`w-4 h-4 ${searchLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          
          {/* Custom Tab List */}
          <div className="px-4 pt-2">
            <TabsList className="w-full flex bg-transparent border-b border-gray-100 p-0 h-auto gap-4 justify-start">
              {[
                { id: "videos", label: "Watch", icon: Video },
                { id: "websites", label: "Read", icon: Globe },
                { id: "images", label: "Visuals", icon: ImageIcon },
                { id: "books", label: "Books", icon: Book },
              ].map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1.5 px-0 py-2.5 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-gray-900 rounded-none text-gray-500 data-[state=active]:text-gray-900 transition-all"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
            {searchLoading && !currentResources.length ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs">Finding best resources...</p>
              </div>
            ) : currentResources.length > 0 ? (
              <div className={`grid gap-3 ${activeTab === 'images' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {currentResources.map((res) => (
                  <ResourceCard 
                    key={res.id} 
                    heading={res.heading}
                    body={res.body}
                    image={res.image}
                    alt={res.alt}
                    url={res.url}
                    type={res.type as any}
                    onAddToBoard={onAddToBoard}
                    onPlayVideo={onPlayVideo}
                    onOpenWebsite={onOpenWebsite}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <Search className="w-8 h-8 mb-2" />
                <p className="text-xs font-medium">No results found.</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ResourceList;