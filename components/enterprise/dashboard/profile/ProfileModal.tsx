"use client"

import { useState, useRef, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { 
  X, 
  Camera, 
  User, 
  Mail, 
  Lock,
  Bell,
  Save,
  Edit3
} from "lucide-react"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

type ActiveTab = "profile" | "preferences" | "account"

export default function ProfileModal({ isOpen, onClose, onSave }: ProfileModalProps) {
  const { user } = useUser()
  const modalRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    bio: "",
    emailNotifications: true,
    pushNotifications: true
  })

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        bio: "",
        emailNotifications: true,
        pushNotifications: true
      })
    }
  }, [user])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Update Clerk user data
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username
      })
      
      setIsEditing(false)
      onSave?.()
      onClose()
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToggleEdit = () => {
    setIsEditing(!isEditing)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your account information and preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "preferences", label: "Preferences", icon: Bell },
            { id: "account", label: "Account", icon: Lock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`
                flex items-center gap-2 flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2
                ${activeTab === tab.id 
                  ? "text-blue-600 border-blue-600" 
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          
          {activeTab === "profile" && (
            <div className="space-y-6">
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-600 mt-1">Click the camera to upload a new photo</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  <button
                    onClick={handleToggleEdit}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to change your email address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600 mt-1">Receive updates about your boards via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => handleInputChange("emailNotifications", e.target.checked.toString())}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600 mt-1">Get real-time updates in your browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pushNotifications}
                      onChange={(e) => handleInputChange("pushNotifications", e.target.checked.toString())}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Security & Sessions</h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">Change Password</h4>
                  <p className="text-sm text-gray-600 mt-1 mb-3">Update your password to keep your account secure</p>
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Change Password
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">Active Sessions</h4>
                  <p className="text-sm text-gray-600 mt-1 mb-3">You&apos;re currently signed in on this device</p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Session</p>
                      <p className="text-xs text-gray-500">This device • Just now</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900">Danger Zone</h4>
                  <p className="text-sm text-red-700 mt-1 mb-3">Permanently delete your account and all data</p>
                  <button className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading || !isEditing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}