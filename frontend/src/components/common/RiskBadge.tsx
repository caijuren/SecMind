"use client"

import { cn } from "@/lib/utils"

interface RiskBadgeProps {
  level: "critical" | "high" | "medium" | "low" | "info"
  showGlow?: boolean
  size?: "sm" | "md" | "lg"
  pulse?: boolean
}

const riskConfig = {
  critical: {
    label: "严重",
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.3)",
  },
  high: {
    label: "高危",
    color: "#fdba74",
    bg: "rgba(249,115,22,0.15)",
    border: "rgba(249,115,22,0.3)",
  },
  medium: {
    label: "中危",
    color: "#fde047",
    bg: "rgba(234,179,8,0.15)",
    border: "rgba(234,179,8,0.3)",
  },
  low: {
    label: "低危",
    color: "#86efac",
    bg: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.3)",
  },
  info: {
    label: "信息",
    color: "#93c5fd",
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.3)",
  },
} as const

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-3 py-1",
} as const

export default function RiskBadge({
  level,
  showGlow = false,
  size = "md",
  pulse = false,
}: RiskBadgeProps) {
  const config = riskConfig[level]

  const glowStyle =
    showGlow && (level === "critical" || level === "high")
      ? { boxShadow: `0 0 12px 2px ${config.color}40, 0 0 24px 4px ${config.color}20` }
      : {}

  return (
    <span
      role="status"
      aria-label={`风险等级: ${config.label}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
        sizeClasses[size],
        pulse && "animate-glow-pulse"
      )}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        ...glowStyle,
      }}
    >
      {config.label}
    </span>
  )
}

export type { RiskBadgeProps }