"use client"

import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"

interface RiskBadgeProps {
  level: "critical" | "high" | "medium" | "low" | "info"
  showGlow?: boolean
  size?: "sm" | "md" | "lg"
  pulse?: boolean
}

const riskConfig = {
  critical: {
    color: "#ff2d55",
    bg: "rgba(255,45,85,0.12)",
    border: "rgba(255,45,85,0.30)",
  },
  high: {
    color: "#ff9500",
    bg: "rgba(255,149,0,0.12)",
    border: "rgba(255,149,0,0.30)",
  },
  medium: {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.30)",
  },
  low: {
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.10)",
    border: "rgba(0,212,255,0.25)",
  },
  info: {
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.10)",
    border: "rgba(0,212,255,0.25)",
  },
} as const

const riskLabelKeys: Record<RiskBadgeProps["level"], string> = {
  critical: "common.riskCritical",
  high: "common.riskHigh",
  medium: "common.riskMedium",
  low: "common.riskLow",
  info: "common.riskInfo",
}

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
  const { t } = useLocaleStore()
  const label = t(riskLabelKeys[level])

  const glowStyle =
    showGlow && (level === "critical" || level === "high")
      ? { boxShadow: `0 0 12px 2px ${config.color}40, 0 0 24px 4px ${config.color}20` }
      : {}

  return (
    <span
      role="status"
      aria-label={`${t("common.riskLevel")}: ${label}`}
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
      {label}
    </span>
  )
}

export type { RiskBadgeProps }