/* eslint-disable react/no-unescaped-entities */
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Search, Filter, TrendingUp, Sparkles, Users, 
  ArrowLeft, Command, Heart, Share2, Layout, Globe,
  Loader2
} from "lucide-react"
import { useEffect, useState } from "react"
import { getPublicBoards } from "@/lib/actions/board-actions"

// --- STICKERS ---
const ScribbleHighlight = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-3 text-yellow-300 -z-10 opacity-60" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
     <path d="M2.00025 7.00001C30.5003 3.00001 100.001 -2.99999 198.001 5.00002" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

interface Board {
  id: string;
  title: string;
  username: string;
  boardcategory: string;
  upvotes: number;
  saves: number;
  isPublic: boolean;
  createdAt: string;
  description?: string;
}

export default function PublicBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const publicBoardsData = await getPublicBoards();
        const mappedBoards = publicBoardsData.map(board => ({
          id: board.id,
          title: board.title || "Untitled Board",
          description: board.description || "A public brainstorming session.",
          username: board.users?.username || board.users?.full_name || "Anonymous",
          boardcategory: board.category || "Uncategorized",
          upvotes: board.upvotes || 0,
          saves: board.saves || 0,
          isPublic: true,
          createdAt: board.created_at,
        }));
        setBoards(mappedBoards);
      } catch (error) {
        console.error("Failed to fetch public boards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-blue-100 relative">
      
      {/* Background Dot Pattern (The "Studio" Look) */}
      <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Studio</span>
              </Link>
              <div className="h-6 w-px bg-gray-200 hidden sm:block" />
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm">
                  <Command className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Orblin Community</span>
              </Link>
            </div>
            
            <Link href="/boards/new">
               <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium">
                 Share Your Board
               </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 mb-6 uppercase tracking-wider shadow-sm">
              <Globe className="w-3 h-3" /> Public Hub
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Explore what others are <br />
              <span className="relative inline-block">
                <span className="relative z-10">building alone.</span>
                <ScribbleHighlight />
              </span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed">
              Discover thousands of public boards, copy templates, and find inspiration for your next big idea.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-gray-200/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/50 flex items-center p-2">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <input 
                  type="text" 
                  placeholder="Search for marketing, design, or startup ideas..." 
                  className="flex-1 px-4 py-4 outline-none text-gray-700 placeholder:text-gray-400 text-lg bg-transparent"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hidden sm:flex font-medium">
                    <Filter className="w-4 h-4 mr-2" /> Filters
                  </Button>
                  <Button className="bg-gray-900 hover:bg-black text-white rounded-xl px-8 h-12 font-bold">
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Boards Grid */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[280px] bg-white rounded-2xl border border-gray-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {boards.map((board) => (
                  <Link href={`/boards/${board.id}`} key={board.id}>
                    <motion.div 
                      whileHover={{ y: -4 }}
                      className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 h-full flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          board.boardcategory === 'Marketing' ? 'bg-purple-50 text-purple-600' : 
                          board.boardcategory === 'Tech' ? 'bg-blue-50 text-blue-600' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Layout className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full uppercase tracking-wide">
                          {board.boardcategory}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {board.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-8 flex-1 leading-relaxed">
                        {board.description}
                      </p>

                      <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {board.username[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]">{board.username}</span>
                        </div>
                        
                        <div className="flex gap-4 text-xs font-semibold text-gray-400">
                          <span className="flex items-center gap-1 hover:text-red-500 transition-colors">
                            <Heart className="w-3.5 h-3.5" /> {board.upvotes}
                          </span>
                          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                            <Share2 className="w-3.5 h-3.5" /> {board.saves}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
            
            {!loading && boards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No public boards yet</h3>
                <p className="text-gray-500 mb-8 max-w-sm text-center">
                  The community is just getting started. Be the first to share your ideas with the world.
                </p>
                <Link href="/boards/new">
                  <Button className="bg-gray-900 text-white hover:bg-black px-8">
                    Create First Board
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}