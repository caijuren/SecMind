"use client"

import { setApiToken } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useEffect } from "react"

export default function SituationRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    setApiToken(token)
  }, [token])

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e27] text-white overflow-hidden">
      {children}
    </div>
  )
}
