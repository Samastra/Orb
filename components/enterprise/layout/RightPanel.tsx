"use client"

import { useState, useEffect } from "react"
import { 
  X, Sparkles, StickyNote, Info, Clock, 
  ArrowRight, ExternalLink, Frown, Loader2, Crown, CheckCircle, Calendar
} from "lucide-react"
import { getPublicBoards } from "@/lib/actions/board-actions"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

interface RightPanelProps {
  onClose: () => void
}

// MATCHING YOUR SUPABASE SCHEMA
interface UserSubscription {
  plan_type: string;      // 'free' | 'premium' | 'lifetime'
  payment_status: string; // 'paid' | 'unpaid'
  upgraded_at: string | null;
}

// FETCH LOGIC (Matches DashboardHeader)
const checkUserSubscription = async (clerkUserId: string): Promise<UserSubscription | null> => {
  try {
    const response = await fetch(`/api/user/subscription?clerk_user_id=${clerkUserId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Error checking user subscription:", error);
    return null;
  }
};

export default function RightPanel({ onClose }: RightPanelProps) {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<"scratchpad" | "sparks" | "details">("scratchpad")
  const [note, setNote] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Community Board State
  const [similarBoards, setSimilarBoards] = useState<any[]>([])
  const [loadingBoards, setLoadingBoards] = useState(false)

  // Subscription State
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // 1. LOAD NOTE
  useEffect(() => {
    const savedNote = localStorage.getItem("orblin_scratchpad")
    if (savedNote) setNote(savedNote)
    setIsLoaded(true)
  }, [])

  // 2. SAVE NOTE
  useEffect(() => {
    if (isLoaded) localStorage.setItem("orblin_scratchpad", note)
  }, [note, isLoaded])

  // 3. FETCH BOARDS (When Sparks tab is active)
  useEffect(() => {
    if (activeTab === "sparks" && similarBoards.length === 0) {
      setLoadingBoards(true)
      getPublicBoards()
        .then((data) => {
          setSimilarBoards(data.slice(0, 5) || [])
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingBoards(false))
    }
  }, [activeTab, similarBoards.length])

  // 4. FETCH SUBSCRIPTION (When Details tab is active)
  useEffect(() => {
    const fetchSubscription = async () => {
      if (activeTab === "details" && !userSubscription && user?.id) {
        setSubscriptionLoading(true)
        try {
          const subscription = await checkUserSubscription(user.id);
          setUserSubscription(subscription);
        } catch (error) {
          console.error("Failed to fetch subscription:", error);
        } finally {
          setSubscriptionLoading(false);
        }
      }
    };

    fetchSubscription();
  }, [activeTab, user, userSubscription]);

  // Check paid status based on DB columns
  const isPaid = userSubscription && 
    (userSubscription.payment_status === 'paid' || 
     userSubscription.plan_type === 'premium' || 
     userSubscription.plan_type === 'lifetime');

  const planName = userSubscription?.plan_type === 'lifetime' 
    ? 'Lifetime Access' 
    : userSubscription?.plan_type === 'premium' 
      ? 'Yearly Member' 
      : 'Free Plan';

  return (
    <div className="h-full flex flex-col bg-white/50">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Studio Sidekick</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 bg-gray-50/50 mx-4 mt-4 rounded-xl">
        {[
          { id: "scratchpad", label: "Scratchpad", icon: StickyNote },
          { id: "sparks", label: "Inspiration", icon: Sparkles },
          { id: "details", label: "Details", icon: Info },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center justify-center gap-2 flex-1 py-2 text-xs font-bold rounded-lg transition-all
              ${activeTab === tab.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }
            `}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        
        {/* TAB 1: SCRATCHPAD */}
        {activeTab === "scratchpad" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 relative group transition-all hover:shadow-sm focus-within:shadow-md">
              <textarea 
                className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-sm text-gray-900 leading-relaxed placeholder:text-yellow-700/30 font-medium"
                placeholder="Type a quick idea, link, or reminder here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                spellCheck={false}
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-yellow-700/40 font-bold uppercase tracking-wider">
                Auto-saving...
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSPIRATION */}
        {activeTab === "sparks" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">Recommended for You</span>
              </div>
              <p className="text-xs text-blue-600/80 leading-relaxed">
                Based on your recent work, here are some public boards that might spark an idea.
              </p>
            </div>

            <div className="space-y-3">
              {loadingBoards ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Finding genius ideas...</span>
                </div>
              ) : similarBoards.length > 0 ? (
                similarBoards.map((board) => (
                  <Link href={`/boards/${board.id}`} key={board.id}>
                    <div className="group flex flex-col p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer mb-3">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 line-clamp-1">
                          {board.title || "Untitled Idea"}
                        </h4>
                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {board.description || "No description provided."}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                          {board.category || "General"}
                        </div>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          by {board.users?.username || "Creator"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                  <Frown className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">No similar boards found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DETAILS (DATABASE CONNECTED) */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border border-gray-200">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👋</span>
                )}
              </div>
              <h4 className="font-bold text-gray-900">{user?.fullName || "Creator"}</h4>
              <p className="text-xs text-gray-500 mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
              
              {/* DATABASE STATUS BADGE */}
              <div className="mt-4 flex flex-col items-center gap-2">
                {subscriptionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : isPaid ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                      <Crown className="w-3 h-3 fill-current" />
                      {planName}
                    </span>
                    {userSubscription?.upgraded_at && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Since {new Date(userSubscription.upgraded_at).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                    Free Plan
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-gray-400 uppercase">Usage</h5>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-medium">{isPaid ? "Unlimited" : "12%"}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${isPaid ? "bg-amber-500 w-full" : "bg-blue-600 w-[12%]"}`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}