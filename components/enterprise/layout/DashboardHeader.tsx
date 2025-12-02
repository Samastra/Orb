"use client"

import { useState, useEffect } from "react"
import { Search, Bell, PanelRight, Compass, User, Settings, LogOut, Sparkles } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import ProfileModal from "../dashboard/profile/ProfileModal"

// --- MOTIVATIONAL QUOTES ---
const MOTIVATIONAL_QUOTES = [
  "Don't think, just do.",
  "Action is the foundational key to all success.",
  "Creativity is intelligence having fun.",
  "Your time is limited, so don't waste it.",
  "Simplicity is the ultimate sophistication.",
  "Everything you can imagine is real.",
  "Dream big. Start small. Act now."
];

interface DashboardHeaderProps {
  onMenuToggle: () => void
  onPanelToggle: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onUpgradeLifetime?: () => void
  onUpgradeYearly?: () => void
}

export default function DashboardHeader({ 
  onMenuToggle, 
  onPanelToggle, 
  searchQuery, 
  onSearchChange 
}: DashboardHeaderProps) {
  const { user } = useUser()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [quote, setQuote] = useState("")
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Set random quote on mount
  useEffect(() => {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  const userInitials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <header className="bg-transparent px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: The Daily Spark */}
        <div className="hidden md:flex flex-col">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span>Daily Spark</span>
          </div>
          <p className="text-gray-700 font-medium italic text-sm">"{quote}"</p>
        </div>

        {/* Center/Right: Search & Actions */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          
          {/* Glass Search Bar */}
          <div className="relative group w-full max-w-md hidden sm:block">
            <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200 transition-shadow group-focus-within:shadow-md" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search your mind..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="relative w-full pl-10 pr-4 py-2.5 bg-transparent rounded-xl text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[10px] font-bold text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              ⌘K
            </div>
          </div>

          {/* Quick Action: Discover */}
          <Link href="/boards" className="hidden lg:block">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm">
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <button 
              onClick={onPanelToggle}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-all"
              title="Open Inspiration Panel"
            >
              <PanelRight className="w-5 h-5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
              >
                <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs shadow-md">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-gray-100 mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  
                  <button onClick={() => { setIsProfileModalOpen(true); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <Link href="/settings" className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <div className="h-px bg-gray-100 my-2" />
                  <Link href="/sign-out" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onSave={() => console.log("Saved")} 
      />
    </header>
  )
}