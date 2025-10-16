"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface FloatingActionButtonProps {
  mainIcon?: string
  actions?: Array<{
    icon: string
    label: string
    href?: string
    onClick?: () => void
    color?: string
  }>
}

const FloatingActionButton = ({ 
  mainIcon = "/image/plus.svg",
  actions = [
    {
      icon: "/image/board-icon.svg",
      label: "New Session",
      href: "/boards/new",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: "/image/template-icon.svg",
      label: "From Template",
      href: "/templates",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: "/image/upload-icon.svg",
      label: "Import Board",
      onClick: () => console.log("Import clicked"),
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ]
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Buttons */}
      <div className={`flex flex-col items-end gap-3 mb-4 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action, index) => (
          <div key={action.label} className="flex items-center gap-3">
            <span className="bg-black/80 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-sm">
              {action.label}
            </span>
            {action.href ? (
              <Link href={action.href}>
                <Button 
                  className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${action.color}`}
                  onClick={() => setIsOpen(false)}
                >
                  <img src={action.icon} alt={action.label} className="w-6 h-6 invert" />
                </Button>
              </Link>
            ) : (
              <Button 
                className={`w-12 h-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${action.color}`}
                onClick={() => {
                  action.onClick?.()
                  setIsOpen(false)
                }}
              >
                <img src={action.icon} alt={action.label} className="w-6 h-6 invert" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <Button
        className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={mainIcon} 
          alt="Quick actions" 
          className={`w-6 h-6 invert transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>
    </div>
  )
}

export default FloatingActionButton