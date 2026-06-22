"use client"

import { useEffect, useRef, useState } from "react"
import { useLocaleStore } from "@/store/locale-store"

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
  critical: { color: "#ff2d55", labelKey: "situation.severityCritical", bg: "rgba(255,45,85,0.12)" },
  high: { color: "#ff9500", labelKey: "situation.severityHigh", bg: "rgba(255,149,0,0.12)" },
  medium: { color: "#fbbf24", labelKey: "situation.severityMedium", bg: "rgba(251,191,36,0.12)" },
  low: { color: "#00d4ff", labelKey: "situation.severityLow", bg: "rgba(0,212,255,0.10)" },
}

export function ThreatTicker({ threats }: ThreatTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPos, setScrollPos] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const animRef = useRef(0)
  const { t } = useLocaleStore()

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
        style={{ color: "var(--muted-foreground)" }}
      >
        <span className="text-xs">{t("situation.noRealtimeThreats")}</span>
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
          style={{ color: "var(--muted-foreground)" }}
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
          {t(config.labelKey)}
        </span>
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--muted-foreground)" }}
        >
          {threat.type}
        </span>
        <span
          className="text-[10px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          {threat.description}
        </span>
        <span
          className="text-[10px] mx-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          |
        </span>
      </div>
    )
  })

  return (
    <div
      ref={containerRef}
      className="flex items-center h-full overflow-hidden relative rounded-lg"
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 shrink-0"
        style={{
          borderRight: "1px solid var(--border)",
          background: "rgba(255,45,85,0.06)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "#ff2d55", boxShadow: "0 0 8px rgba(255,45,85,0.6)" }}
        />
        <span
          className="text-[10px] font-bold tracking-wider font-[family-name:var(--font-space-grotesk)]"
          style={{ color: "#ff2d55" }}
        >
          {t("situation.threatBroadcast")}
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
          className="absolute inset-y-0 left-0 w-10 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, var(--background) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-10 pointer-events-none"
          style={{
            background: "linear-gradient(270deg, var(--background) 0%, transparent 100%)",
          }}
        />
      </div>
    </div>
  )
}