"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { startDemoSession } from "@/lib/demo-session"

export default function DemoEntryPage() {
  const router = useRouter()

  useEffect(() => {
    startDemoSession()
    if (typeof window !== "undefined") {
      window.location.replace("/investigate")
      return
    }
    router.replace("/investigate")
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="size-8 animate-spin text-cyan-400" />
      <p className="text-sm text-zinc-500">正在进入演示环境...</p>
    </div>
  )
}
