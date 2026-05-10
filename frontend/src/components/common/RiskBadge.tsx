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
    color: "#ff4d4f",
    bg: "rgba(255,77,79,0.15)",
    border: "rgba(255,77,79,0.3)",
  },
  high: {
    label: "高危",
    color: "#ff4d4f",
    bg: "rgba(255,77,79,0.12)",
    border: "rgba(255,77,79,0.25)",
  },
  medium: {
    label: "中危",
    color: "#faad14",
    bg: "rgba(250,173,20,0.12)",
    border: "rgba(250,173,20,0.25)",
  },
  low: {
    label: "低危",
    color: "#1677ff",
    bg: "rgba(22,119,255,0.12)",
    border: "rgba(22,119,255,0.25)",
  },
  info: {
    label: "信息",
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.25)",
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
      ? { boxShadow: `0 0 8px 2px ${config.color}50, 0 0 20px 4px ${config.color}25` }
      : {}

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
        sizeClasses[size],
        pulse && "animate-[glow-pulse_2s_ease-in-out_infinite]"
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
