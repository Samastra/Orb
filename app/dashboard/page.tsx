"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import EnterpriseLayout from "@/components/enterprise/layout/EnterpriseLayout"
import MainDashboard from "@/components/enterprise/dashboard/MainDashboard"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <EnterpriseLayout 
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <MainDashboard 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </EnterpriseLayout>
  )
}