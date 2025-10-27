"use client"

import { useState } from "react"
import { 
  X, 
  Send, 
  Copy, 
  Users, 
  Link as LinkIcon,
  Eye,
  Edit,
  Settings
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { inviteToBoard, generatePublicLink } from "@/lib/actions/share-actions"

interface ShareBoardModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
  boardTitle: string
}

type ActiveTab = "people" | "link"
type PermissionLevel = "viewer" | "editor" | "admin"

export default function ShareBoardModal({ 
  isOpen, 
  onClose, 
  boardId, 
  boardTitle 
}: ShareBoardModalProps) {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<ActiveTab>("people")
  const [emailInput, setEmailInput] = useState("")
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("viewer")
  const [customMessage, setCustomMessage] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [publicUrl, setPublicUrl] = useState("")

  const handleSendInvitation = async () => {
    if (!user?.id || !emailInput.trim()) return

    setIsLoading(true)
    try {
      await inviteToBoard(
        user.id,
        boardId,
        emailInput.trim(),
        permissionLevel,
        customMessage || undefined
      )
      
      // Reset form
      setEmailInput("")
      setCustomMessage("")
      // Show success message
      alert("Invitation sent successfully!")
    } catch (error) {
      console.error("Failed to send invitation:", error)
      alert("Failed to send invitation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublic = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await generatePublicLink(user.id, boardId, !isPublic)
      setIsPublic(!isPublic)
      setPublicUrl(result.publicUrl || "")
    } catch (error) {
      console.error("Failed to update public access:", error)
      alert("Failed to update public access.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl)
      alert("Link copied to clipboard!")
    }
  }

  const getPermissionIcon = (level: PermissionLevel) => {
    switch (level) {
      case "viewer": return <Eye className="w-4 h-4" />
      case "editor": return <Edit className="w-4 h-4" />
      case "admin": return <Settings className="w-4 h-4" />
    }
  }

  const getPermissionDescription = (level: PermissionLevel) => {
    switch (level) {
      case "viewer": return "Can view board"
      case "editor": return "Can view and edit board"
      case "admin": return "Full access including management"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Share Board</h2>
            <p className="text-sm text-gray-600 mt-1">{boardTitle}</p>
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
          <button
            onClick={() => setActiveTab("people")}
            className={`
              flex items-center gap-2 flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2
              ${activeTab === "people" 
                ? "text-blue-600 border-blue-600" 
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <Users className="w-4 h-4" />
            <span>People</span>
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`
              flex items-center gap-2 flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2
              ${activeTab === "link" 
                ? "text-blue-600 border-blue-600" 
                : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          
          {activeTab === "people" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite by email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendInvitation}
                    disabled={!emailInput.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Level
                </label>
                <div className="space-y-2">
                  {(["viewer", "editor", "admin"] as PermissionLevel[]).map((level) => (
                    <label key={level} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="permission"
                        value={level}
                        checked={permissionLevel === level}
                        onChange={() => setPermissionLevel(level)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        {getPermissionIcon(level)}
                        <span className="font-medium capitalize">{level}</span>
                      </div>
                      <span className="text-sm text-gray-600 ml-auto">
                        {getPermissionDescription(level)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "link" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Public Access</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Anyone with the link can view this board
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={handleTogglePublic}
                    disabled={isLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                </label>
              </div>

              {isPublic && publicUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this link with anyone you want to view this board
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}