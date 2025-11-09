"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  Bell, 
  HelpCircle, 
  PanelRight,
  User,
  Settings,
  LogOut,
  Crown // Added Crown icon
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import ProfileModal from "../dashboard/profile/ProfileModal"

interface DashboardHeaderProps {
  onMenuToggle: () => void
  onPanelToggle: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onUpgradeLifetime?: () => void // Added upgrade props
  onUpgradeYearly?: () => void
}

export default function DashboardHeader({ 
  onMenuToggle, 
  onPanelToggle, 
  searchQuery, 
  onSearchChange,
  onUpgradeLifetime = () => {}, // Added with default functions
  onUpgradeYearly = () => {}
}: DashboardHeaderProps) {
  const { user } = useUser()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; time: string }[]>([])
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  // In a real app, you'd fetch notifications from your database
  useEffect(() => {
    // For now, we'll set empty notifications for new users
    setNotifications([])
  }, [user])

  const userInitials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        
        {/* Left Section - Breadcrumbs & Actions */}
        <div className="flex items-center gap-6">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-900 font-medium">Orblin</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Dashboard</span>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/boards/new">
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + New Board
              </button>
            </Link>
            <button 
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Import feature coming soon"
            >
              Import
            </button>
          </div>
        </div>

        {/* Right Section - Search & User Menu */}
        <div className="flex items-center gap-4">
          
          {/* Global Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search across all boards..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              ⌘K
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Upgrade Button - Added this section */}
            <button 
              onClick={onUpgradeLifetime}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium text-sm"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">We&apos;ll notify you when something happens</p>
                    </div>
                  )}
                  
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-200 pt-2 px-4">
                      <button className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700">
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Help */}
            <Link href="/help">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
            </Link>

            {/* Panel Toggle */}
            <button 
              onClick={onPanelToggle}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <PanelRight className="w-5 h-5" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{userInitials}</span>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{user?.fullName || "User"}</p>
                    <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  
                  <div className="py-2">
                    
                     <button 
                          onClick={() => {
                            setIsProfileModalOpen(true)
                            setUserMenuOpen(false)
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                  
                    <Link href="/settings">
                      <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2">
                    <Link href="/sign-out">
                      <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="lg:hidden mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={() => {
            // Optional: Add any success handling here
            console.log("Profile updated successfully")
          }}
        />
    </header>
  )
}