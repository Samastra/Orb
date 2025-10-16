"use client"

import Link from "next/link"
import * as React from "react"
import {
  LayoutDashboard,
  Globe,
  Settings2,
  LifeBuoy,
  Send,
  Command,
  FolderOpen,
} from "lucide-react"

import { useUser } from "@clerk/nextjs"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ManageBoardsModal } from "@/components/manage-boards-modal"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Public Boards", 
      url: "/boards",
      icon: Globe,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback", 
      url: "/contact",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const [manageBoardsOpen, setManageBoardsOpen] = React.useState(false)

  if (!user) return <div>Please sign in</div>

  const navUserData = {
    name: user.fullName || "Anonymous",
    email: user.primaryEmailAddress?.emailAddress || "No email", 
    avatar: user.imageUrl || "/default-avatar.png",
  }

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader className="border-b shrink-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <p className="truncate font-semibold">Orb</p>
                    <p className="truncate text-xs text-gray-500">Whiteboard</p>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent className="flex flex-col min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Main Navigation - Scrollable if needed */}
            <div className="p-2 flex-1 min-h-0 overflow-auto">
              <NavMain items={data.navMain} />
              
              {/* Board Management Section */}
              <div className="border-t mt-4 pt-4">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setManageBoardsOpen(true)}>
                      <FolderOpen className="size-4" />
                      <span>Manage Boards</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

              {/* Settings */}
              <div className="border-t mt-4 pt-4">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/settings">
                        <Settings2 className="size-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </div>

            {/* Support Links - Fixed at bottom of scrollable area */}
            <div className="shrink-0 p-2">
              <NavSecondary items={data.navSecondary} />
            </div>
          </div>
        </SidebarContent>
        
        {/* User Info - Fixed at very bottom */}
        <SidebarFooter className="border-t p-2 shrink-0">
          <NavUser user={navUserData} />
        </SidebarFooter>
      </Sidebar>

      {/* Manage Boards Modal */}
      <ManageBoardsModal 
        open={manageBoardsOpen} 
        onOpenChange={setManageBoardsOpen}
        userId={user.id}
      />
    </>
  )
}