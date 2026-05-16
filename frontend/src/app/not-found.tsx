"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Home, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-8" style={{ background: "#020a1a" }}>
      <div className="relative">
        <div className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20">
          <SearchX className="size-12 text-cyan-400" />
        </div>
      </div>

      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-4xl font-bold text-white">404</h1>
        <h2 className="text-xl font-semibold text-white/80">页面未找到</h2>
        <p className="text-sm text-white/40 leading-relaxed">
          您访问的页面不存在或已被移除，请返回上一页或前往首页。
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="gap-2 border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          返回上一页
        </Button>
        <Link href="/">
          <Button
            className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110"
          >
            <Home className="size-4" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
