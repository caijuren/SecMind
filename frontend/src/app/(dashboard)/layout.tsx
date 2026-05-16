"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { DynamicOnboardingGuide } from "@/components/dynamic-imports"
import { TrialBanner } from "@/components/billing/TrialBanner"
import { useAuthStore } from "@/store/auth-store"
import { setApiToken } from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const clearNewUserFlag = useAuthStore((s) => s.clearNewUserFlag)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const token = useAuthStore((s) => s.token)

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
    <div className="flex h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef8fb_48%,#f8fafc_100%)] text-slate-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <TrialBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      {showOnboarding && (
        <DynamicOnboardingGuide onComplete={handleOnboardingComplete} />
      )}
    </div>
  )
}
