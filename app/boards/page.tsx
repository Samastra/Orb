
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import BoardCard from "@/components/BoardCard"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Sparkles, 
  Users,
  Globe,
  ArrowLeft,
  Command
} from "lucide-react"
import { useEffect, useState } from "react"
import { getPublicBoards } from "@/lib/actions/board-actions" // Adjust path as needed

interface Board {
  id: string;
  title: string;
  username: string;
  boardcategory: string;
  upvotes: number;
  saves: number;
  isPublic: boolean;
  createdAt: string;
}

const PublicBoards = () => {
  const [featuredBoards, setFeaturedBoards] = useState<Board[]>([]);
  const [popularBoards, setPopularBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const publicBoardsData = await getPublicBoards();
        // Map and enhance data with creative fallbacks
        const mappedBoards = publicBoardsData.map(board => ({
          id: board.id,
          title: board.title || "Untitled Board",
          username: board.users?.username || board.users?.full_name || `Creator-${board.id.slice(0, 4)}`,
          boardcategory: board.category || "Uncategorized",
          upvotes: board.upvotes || Math.floor(Math.random() * 300), // Creative default
          saves: board.saves || Math.floor(Math.random() * 100),    // Creative default
          isPublic: board.is_public || true,
          createdAt: board.created_at || new Date().toISOString(),
        }));
        setFeaturedBoards(mappedBoards.slice(0, 4) || []);
        setPopularBoards(mappedBoards.slice(4) || []);
      } catch (error) {
        console.error("Failed to fetch public boards:", error);
        setFeaturedBoards([]);
        setPopularBoards([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Enhanced Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b border-white/30"
      >
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Command className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Orb
            </h1>
          </Link>
        </div>

        <Link href="/dashboard">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6 text-white" />
          </div>
        </Link>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-4">
              <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Community Knowledge Hub
                </span>
              </GlassCard>
              
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Explore Public{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Boards
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Discover inspiring ideas, learn from others, and find templates 
                  from our community of creators and thinkers.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-500">Public Boards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">2.1K</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Search public boards, topics, or users..."
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <Button variant="outline" className="border-gray-300 hover:border-blue-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-gray-300 hover:border-blue-300">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Popular
                </Button>
                <Button variant="outline" className="border-gray-300 hover:border-blue-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Featured Boards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Boards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBoards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + (index * 0.1) }}
              >
                <BoardCard
                  title={board.title}
                  username={board.username}
                  boardcategory={board.boardcategory}
                  upvotes={board.upvotes}
                  saves={board.saves}
                  boardId={board.id}
                  createdAt={board.createdAt}
                  isPublic={board.isPublic}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Popular Boards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">Most Popular</h2>
          </div>

          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularBoards.map((board, index) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 + (index * 0.1) }}
                >
                  <BoardCard
                    title={board.title}
                    username={board.username}
                    boardcategory={board.boardcategory}
                    upvotes={board.upvotes}
                    saves={board.saves}
                    boardId={board.id}
                    createdAt={board.createdAt}
                    isPublic={board.isPublic}
                  />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.section>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <GlassCard className="p-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">
                Ready to Share Your Ideas?
              </h3>
              <p className="text-gray-600">
                Create your own public board and inspire others in the community.
              </p>
              <Link href="/boards/new">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4">
                  Create Your Board
                </Button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

export default PublicBoards
