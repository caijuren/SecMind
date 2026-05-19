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
    <div className="fixed inset-0 z-50 bg-[#050508] text-white overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(34,211,238,0.03) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 50%, rgba(139,92,246,0.02) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.02 }}
      >
        <div
          className="absolute w-full h-px"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.5) 20%, rgba(34,211,238,0.5) 80%, transparent 100%)",
            animation: "scanLine 8s linear infinite",
            top: "50%",
          }}
        />
      </div>
      <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none" style={{ borderTop: "1px solid rgba(34,211,238,0.06)", borderLeft: "1px solid rgba(34,211,238,0.06)" }} />
      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none" style={{ borderTop: "1px solid rgba(34,211,238,0.06)", borderRight: "1px solid rgba(34,211,238,0.06)" }} />
      <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)", borderLeft: "1px solid rgba(34,211,238,0.06)" }} />
      <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none" style={{ borderBottom: "1px solid rgba(34,211,238,0.06)", borderRight: "1px solid rgba(34,211,238,0.06)" }} />
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
      {children}
    </div>
  )
}
