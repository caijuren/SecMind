"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { DynamicOnboardingGuide } from "@/components/dynamic-imports"
import { TrialBanner } from "@/components/billing/TrialBanner"
import { useAuthStore } from "@/store/auth-store"
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
  const clearNewUserFlag = useAuthStore((s) => s.clearNewUserFlag)
  const [showOnboarding, setShowOnboarding] = useState(false)
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
    const onboarded = localStorage.getItem('secmind-onboarded')
    if (!onboarded && user?.isNewUser) {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => setShowOnboarding(true))
      } else {
        Promise.resolve().then(() => setShowOnboarding(true))
      }
    }
  }, [user?.isNewUser])

  useEffect(() => {
    setApiToken(token)
  }, [token])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    clearNewUserFlag()
    localStorage.setItem('secmind-onboarded', '1')
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-foreground">
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
        {!user?.isDemo && <TrialBanner />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      {showOnboarding && (
        <DynamicOnboardingGuide onComplete={handleOnboardingComplete} />
      )}
    </div>
  )
}
