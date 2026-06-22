"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useAuthStore } from "@/store/auth-store"
import { useMockDataStore } from "@/store/mock-data-store"
import { setApiToken } from "@/lib/api"
import { startDemoSession } from "@/lib/demo-session"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const permissions = useAuthStore((s) => s.permissions)
  const setPermissions = useAuthStore((s) => s.setPermissions)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!isAuthenticated && !user) {
      startDemoSession()
      return
    }

    if (user && (user.role === "admin" || user.isDemo) && !permissions.includes("*:*")) {
      setPermissions(["*:*"])
    }
  }, [isAuthenticated, permissions, setPermissions, user])

  useEffect(() => {
    setApiToken(token)
  }, [token])

  // Initialize mock data store once
  const initializeMockData = useMockDataStore((s) => s.initialize)
  useEffect(() => {
    initializeMockData()
  }, [initializeMockData])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-56 md:hidden animate-slideInLeft">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 cyber-grid-bg">{children}</main>
      </div>
    </div>
  )
}
