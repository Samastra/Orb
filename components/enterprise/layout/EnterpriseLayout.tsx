"use client"

import { useState } from "react"
import WorkspaceSidebar from "./WorkspaceSidebar"
import DashboardHeader from "./DashboardHeader"
import RightPanel from "./RightPanel"

interface EnterpriseLayoutProps {
  children: React.ReactNode
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onUpgradeLifetime?: () => void
  onUpgradeYearly?: () => void
}

export default function EnterpriseLayout({ 
  children, 
  searchQuery = "", 
  onSearchChange = () => {},
  onUpgradeLifetime = () => {},
  onUpgradeYearly = () => {}
}: EnterpriseLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false) // Default closed for focus

  return (
    <div className="flex h-screen bg-[#F9FAFB] selection:bg-blue-100 font-sans">
      {/* Background Texture (Subtle Noise/Gradient) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Workspace Sidebar - The "Toolbox" */}
      <div className="relative z-20">
        <WorkspaceSidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
        <DashboardHeader 
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onPanelToggle={() => setRightPanelOpen(!rightPanelOpen)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onUpgradeLifetime={onUpgradeLifetime}
          onUpgradeYearly={onUpgradeYearly}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas */}
          <main className="flex-1 overflow-auto">
            <div className="h-full w-full max-w-[1600px] mx-auto p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
          
          {/* Right Panel - The "Inspiration" Drawer */}
          <div className={`
            border-l border-gray-200 bg-white/80 backdrop-blur-xl transition-all duration-300 ease-in-out shadow-xl z-20
            ${rightPanelOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
          `}>
            <RightPanel onClose={() => setRightPanelOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  )
}