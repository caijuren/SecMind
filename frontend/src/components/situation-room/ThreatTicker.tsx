"use client"

import { useEffect, useRef, useState } from "react"

interface ThreatItem {
  id: string
  time: string
  type: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
}

interface ThreatTickerProps {
  threats: ThreatItem[]
}

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", label: "严重", bg: "rgba(239,68,68,0.15)" },
  high: { color: "#f97316", label: "高危", bg: "rgba(249,115,22,0.15)" },
  medium: { color: "#fbbf24", label: "中危", bg: "rgba(251,191,36,0.15)" },
  low: { color: "#22d3ee", label: "低危", bg: "rgba(34,211,238,0.15)" },
}

export function ThreatTicker({ threats }: ThreatTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPos, setScrollPos] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const animRef = useRef(0)

  useEffect(() => {
    if (!scrollRef.current) return
    const measure = () => {
      if (scrollRef.current) {
        setContentWidth(scrollRef.current.scrollWidth)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scrollRef.current)
    return () => observer.disconnect()
  }, [threats])

  useEffect(() => {
    if (contentWidth === 0) return
    let lastTime = performance.now()
    const speed = 0.8

    const animate = (now: number) => {
      const dt = now - lastTime
      lastTime = now
      setScrollPos((prev) => {
        const next = prev + speed * (dt / 16)
        return next >= contentWidth / 2 ? 0 : next
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [contentWidth])

  if (threats.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        <span className="text-xs">暂无实时威胁</span>
      </div>
    )
  }

  const tickerItems = threats.map((threat) => {
    const config = SEVERITY_CONFIG[threat.severity]
    return (
      <div
        key={threat.id}
        className="flex items-center gap-3 shrink-0 px-4"
        style={{ whiteSpace: "nowrap" }}
      >
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {threat.time}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{
            color: config.color,
            backgroundColor: config.bg,
            border: `1px solid ${config.color}33`,
          }}
        >
          {config.label}
        </span>
        <span
          className="text-[11px] font-medium"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {threat.type}
        </span>
        <span
          className="text-[10px]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {threat.description}
        </span>
        <span
          className="text-[10px] mx-1"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          |
        </span>
      </div>
    )
  })

  return (
    <div
      ref={containerRef}
      className="flex items-center h-full overflow-hidden relative"
      style={{
        background: "linear-gradient(90deg, rgba(10,14,39,0.95) 0%, rgba(13,21,42,0.9) 50%, rgba(10,14,39,0.95) 100%)",
        borderTop: "1px solid rgba(34,211,238,0.08)",
      }}
    >
      <div
        className="flex items-center gap-1 px-3 py-1.5 shrink-0"
        style={{
          borderRight: "1px solid rgba(34,211,238,0.1)",
          background: "rgba(34,211,238,0.06)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "#ef4444", boxShadow: "0 0 6px #ef444488" }}
        />
        <span
          className="text-[10px] font-bold tracking-wider"
          style={{ color: "#ef4444" }}
        >
          威胁播报
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex items-center h-full absolute"
          style={{ transform: `translateX(${-scrollPos}px)` }}
        >
          <div ref={scrollRef} className="flex items-center h-full">
            {tickerItems}
          </div>
          <div className="flex items-center h-full">
            {tickerItems}
          </div>
        </div>

        <div
          className="absolute inset-y-0 left-0 w-8 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(10,14,39,0.95) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-8 pointer-events-none"
          style={{
            background: "linear-gradient(270deg, rgba(10,14,39,0.95) 0%, transparent 100%)",
          }}
        />
      </div>
    </div>
  )
}