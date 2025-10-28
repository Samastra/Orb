"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import ResourceCard from "./resourceCard";
import { SidebarInput } from "./ui/sidebar";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRecommendations } from "@/context/RecommendationsContext";
import SelectOptions from "./SelectOptions";
import { Search, RefreshCw, Sparkles, LayoutTemplate } from "lucide-react";
import { getUserBoards } from "@/lib/actions/board-actions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
}

interface Board {
  id: string;
  title: string;
  category: string;
  collaborators: number;
  lastUpdated: string;
  thumbnail: string;
}

interface ResourceListProps {
  boardTitle?: string;
  boardCategory?: string;
  onAddToBoard?: (imageUrl: string, altText: string) => void;
  onPlayVideo?: (videoId: string, title: string) => void;
  boardElements?: {
    reactShapes: unknown[]; // Replace `any[]`
    konvaShapes: unknown[]; // Replace `any[]`
    stageFrames: unknown[]; // Replace `any[]`
    images: unknown[]; // Replace `any[]`
    connections: unknown[]; // Replace `any[]`
  };
}

const ImageTypes = [
  { value: "all", label: "All Images" },
  { value: "photo", label: "📷 Photos" },
  { value: "vector", label: "🎨 Vectors" },
];

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
  boardElements,
}: ResourceListProps) => {
  const { recommendations } = useRecommendations();
  const { user } = useUser();
  const router = useRouter();
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("boards");
  const [manualSearchResults, setManualSearchResults] = useState<SearchResults | null>(null);
  const [imageTypeFilter, setImageTypeFilter] = useState("all");
  const [refreshCount, setRefreshCount] = useState(0);
  const [sortOption, setSortOption] = useState("relevance");
  const [boards, setBoards] = useState<Board[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      if (user?.id) {
        try {
          const userBoards = await getUserBoards(user.id, {
            username: user.username,
            fullName: user.fullName,
            imageUrl: user.imageUrl,
            email: user.primaryEmailAddress?.emailAddress,
          });
          setBoards(
            userBoards.map((board) => ({
              id: board.id,
              title: board.title,
              category: board.category,
              collaborators: 0,
              lastUpdated: board.created_at || "N/A",
              thumbnail: "/board-thumb-1.svg",
            }))
          );
        } catch (error) {
          console.error("Failed to fetch boards:", error);
        }
      }
    };
    fetchBoards();
  }, [user?.id]);

  // Replace the debounce function:
      const debounce = (func: (value: string) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (value: string) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(value), delay);
        };
      };

 const fetchResources = useCallback(async (query: string, isRefresh = false) => {
  if (!query.trim() && !isRefresh) {
    setManualSearchResults(null);
    return;
  }

  try {
    const url = `/api/recommendations/search?query=${encodeURIComponent(
      query
    )}&refresh=${isRefresh ? "true" : "false"}&refreshCount=${refreshCount}&page=${page}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = (await response.json()) as SearchResults;
      setManualSearchResults((prev) => ({
        ...prev,
        ...data,
      }));
      setHasMore(data.images.length > 0 || data.books.length > 0 || data.videos.length > 0 || data.websites.length > 0);
    } else {
      console.error("API response not OK:", response.status);
      setManualSearchResults(emptyResults);
    }
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    setManualSearchResults(emptyResults);
  }
}, [refreshCount, page]); // Add dependencies here

const handleSearch = useCallback(
  debounce((value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchLoading(true);
      setRefreshCount(0);
      fetchResources(value).finally(() => setSearchLoading(false));
    } else {
      setManualSearchResults(null);
      setSearchLoading(false);
    }
  }, 800),
  [fetchResources] // Now depends on the stable fetchResources
);

  const handleRefresh = () => {
    const currentQuery =
      searchQuery ||
      (boardTitle && boardTitle !== "Untitled Board"
        ? boardTitle + (boardCategory ? ` ${boardCategory}` : "")
        : "");
    if (currentQuery) {
      setRefreshCount((prev) => prev + 1);
      fetchResources(currentQuery, true);
    }
  };

  // Replace the getResourceUrl function:
        const getResourceUrl = (resource: Resource): string | undefined => {
          switch (resource.type) {
            case "video":
              return resource.videoId ? `https://youtube.com/watch?v=${resource.videoId}` : resource.url;
            case "website":
              return resource.url || ((resource.sourceData as { content_urls?: { desktop?: { page?: string } } })?.content_urls?.desktop?.page);
            case "book":
              return resource.url || ((resource.sourceData as { volumeInfo?: { infoLink?: string } })?.volumeInfo?.infoLink);
            case "photo":
              return resource.url || ((resource.sourceData as { url?: string })?.url);
            case "vector":
              return resource.url || ((resource.sourceData as { url?: string })?.url);
            default:
              return resource.url;
          }
        };

  const getEmptyStateMessage = () => {
    if (searchLoading) return "Loading resources...";
    if (manualSearchResults && searchQuery)
      return `No ${activeTab} found for "${searchQuery}"`;
    if (boardTitle && boardTitle !== "Untitled Board")
      return `No recommendations found for "${boardTitle}"`;
    return "Search for learning resources above";
  };

  const getFilteredImages = (): Resource[] => {
    const allImages = displayResources.images || [];
    return imageTypeFilter === "all"
      ? allImages
      : allImages.filter((image) => image.type === imageTypeFilter);
  };

   const displayResources = useMemo(
    () => manualSearchResults || recommendations,
    [manualSearchResults, recommendations]
  );
  const currentResources = useMemo(() => {
    if (!displayResources) return [];
    switch (activeTab) {
      case "books":
        return displayResources.books || [];
      case "videos":
        return displayResources.videos || [];
      case "websites":
        return displayResources.websites || [];
      case "images":
        return getFilteredImages();
      default:
        return [];
    }
  }, [activeTab, displayResources, imageTypeFilter]);

  const renderSimilarBoards = () => {
    if (boards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-3">
          <LayoutTemplate className="w-12 h-12 text-gray-300" />
          <p className="text-sm">No similar boards found</p>
          <p className="text-xs text-gray-400">
            Create more boards to get recommendations
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {boards.map((board) => (
          <div
            key={board.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/80 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => router.push(`/boards/${board.id}`)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <LayoutTemplate className="w-6 h-6 text-blue-600" />
              </div>
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
                <p className="text-xs text-gray-400 mt-2">Updated {board.lastUpdated}</p>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Liked ${board.title}`);
                    }}
                    className="p-1 rounded-full text-gray-400 bg-gray-100 hover:text-green-500 hover:bg-green-100"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Disliked ${board.title}`);
                    }}
                    className="p-1 rounded-full text-gray-400 bg-gray-100 hover:text-red-500 hover:bg-red-100"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResources = () => {
    if (currentResources.length === 0) {
      return (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500 text-center px-4">
            {getEmptyStateMessage()}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-blue-600 ml-2"
              >
                Clear Search
              </button>
            )}
          </p>
        </div>
      );
    }

    if (activeTab === "images") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 masonry">
          {currentResources.map((resource: Resource) => (
            <ResourceCard
          key={resource.id}
          heading={resource.heading}
          body={resource.body}
          image={resource.image}
          alt={resource.alt}
          type={resource.type as "video" | "website" | "book" | "photo" | "vector"} // Add type assertion
          url={getResourceUrl(resource)}
          onAddToBoard={onAddToBoard}
          onPlayVideo={onPlayVideo}
        />
          ))}
          {hasMore && (
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="col-span-full text-center py-2 text-blue-600"
            >
              Load More
            </button>
          )}
        </div>
      );
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
          onAddToBoard={onAddToBoard}
          onPlayVideo={onPlayVideo}
        />
      </div>
    ));
  };

  useEffect(() => {
    if (boardElements && boardElements.images.length > 0) setActiveTab("images");
    else if (boardCategory) {
      setActiveTab(
        boardCategory.toLowerCase() === "design" ? "images" : "books"
      );
    }
  }, [boardElements, boardCategory]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              AI Recommendations
            </h2>
            <p className="text-sm text-gray-600">Smart resources for your project</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search learning resources..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 bg-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value); // Update input immediately for better UX
              handleSearch(value);
            }}
              disabled={searchLoading}
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={
              searchLoading ||
              (!searchQuery.trim() &&
                (!boardTitle || boardTitle === "Untitled Board"))
            }
            className={`
              h-10 px-3 rounded-xl border bg-white/80 text-sm font-medium
              flex items-center justify-center min-w-10
              transition-all duration-300
              ${
                searchLoading ||
                (!searchQuery.trim() &&
                  (!boardTitle || boardTitle === "Untitled Board"))
                  ? "opacity-50 cursor-not-allowed text-gray-400 border-gray-300"
                  : "text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md cursor-pointer"
              }
            `}
            title="Get new results"
          >
            {searchLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
          {manualSearchResults && (
            <span>
              Showing results for: <span className="font-medium">&quot;{searchQuery}&quot;</span>
            </span>
          )}
          {searchLoading && (
            <span className="flex items-center gap-1 text-blue-600">
              <RefreshCw className="w-3 h-3 animate-spin" /> loading new
              results...
            </span>
          )}
          {boardTitle &&
            boardTitle !== "Untitled Board" &&
            !manualSearchResults && (
              <span>
                Recommendations for: <span className="font-medium">&quot;{boardTitle}&quot;</span>
              </span>
            )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          {activeTab !== "boards" && (
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
            </select>
          )}
          {activeTab === "images" && (
            <SelectOptions
              options={ImageTypes}
              placeholder="Filter image type"
              value={imageTypeFilter}
              onValueChange={setImageTypeFilter}
            />
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-5 mb-6 bg-gray-100/80 p-1 rounded-xl border border-gray-200/80">
            <TabsTrigger
              value="boards"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <LayoutTemplate className="w-4 h-4" />
              Boards
            </TabsTrigger>
            <TabsTrigger
              value="books"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Books
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="websites"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Websites
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Images
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="boards" className="mt-0 h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Similar Boards</h3>
                  <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                    Suggested
                  </span>
                </div>
                {renderSimilarBoards()}
              </div>
            </TabsContent>

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
  );
};

export default ResourceList;
