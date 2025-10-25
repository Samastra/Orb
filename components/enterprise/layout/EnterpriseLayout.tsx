"use client"

import { useState } from "react"
import WorkspaceSidebar from "./WorkspaceSidebar"
import DashboardHeader from "./DashboardHeader"
import RightPanel from "./RightPanel"

interface EnterpriseLayoutProps {
  children: React.ReactNode
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function EnterpriseLayout({ 
  children, 
  searchQuery = "", 
  onSearchChange = () => {} 
}: EnterpriseLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Workspace Sidebar */}
      <WorkspaceSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader 
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onPanelToggle={() => setRightPanelOpen(!rightPanelOpen)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          
          {/* Right Panel */}
          {rightPanelOpen && (
            <RightPanel onClose={() => setRightPanelOpen(false)} />
          )}
        </div>
      </div>
    </div>
  )
}