"use client"

import { useEffect, useRef, useMemo, useState } from "react"

interface AlertItem {
  id: string
  time: string
  sourceIp: string
  attackType: string
  severity: "critical" | "high" | "medium" | "low"
}

interface AlertStreamProps {
  alerts: AlertItem[]
}

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", label: "严重", bg: "rgba(239,68,68,0.12)" },
  high: { color: "#f97316", label: "高危", bg: "rgba(249,115,22,0.12)" },
  medium: { color: "#fbbf24", label: "中危", bg: "rgba(251,191,36,0.12)" },
  low: { color: "#22d3ee", label: "低危", bg: "rgba(34,211,238,0.12)" },
}

export function AlertStream({ alerts }: AlertStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set())
  const highlightIds = useMemo(() => {
    if (alerts.length === 0) return new Set<string>()
    return new Set(alerts.slice(0, 3).map((a) => a.id))
  }, [alerts])

  useEffect(() => {
    if (highlightIds.size === 0) return
    const timer = setTimeout(() => {
      setExpiredIds(new Set(highlightIds))
    }, 3000)
    return () => clearTimeout(timer)
  }, [highlightIds])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [alerts])

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1.5 overflow-y-auto h-full scrollbar-thin"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(34,211,238,0.2) transparent" }}
    >
      {alerts.map((alert) => {
        const config = SEVERITY_CONFIG[alert.severity]
        const isHighlight = highlightIds.has(alert.id) && !expiredIds.has(alert.id)

        return (
          <div
            key={alert.id}
            className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-500"
            style={{
              backgroundColor: isHighlight ? config.bg : "rgba(255,255,255,0.03)",
              borderLeft: `2px solid ${config.color}`,
              opacity: isHighlight ? 1 : 0.85,
            }}
          >
            <span
              className="text-[10px] font-mono tabular-nums shrink-0"
              style={{ color: "rgba(255,255,255,0.4)", minWidth: "52px" }}
            >
              {alert.time}
            </span>

            <span
              className="text-[10px] font-mono shrink-0"
              style={{ color: "rgba(255,255,255,0.5)", minWidth: "80px" }}
            >
              {alert.sourceIp}
            </span>

            <span
              className="text-[10px] shrink-0 px-1.5 py-0.5 rounded font-medium"
              style={{
                color: config.color,
                backgroundColor: config.bg,
                minWidth: "32px",
                textAlign: "center",
              }}
            >
              {config.label}
            </span>

            <span
              className="text-[11px] truncate"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {alert.attackType}
            </span>
          </div>
        )
      })}

      {alerts.length === 0 && (
        <div className="flex items-center justify-center h-full text-white/30 text-xs">
          暂无实时告警
        </div>
      )}
    </div>
  )
}
