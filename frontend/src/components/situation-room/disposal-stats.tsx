"use client"

import { useEffect, useRef, useState } from "react"
import { useLocaleStore } from "@/store/locale-store"

interface DisposalStatsData {
  totalActions: number
  autoRate: number
  avgResponseTime: number
  successRate: number
}

interface DisposalStatsProps {
  data: DisposalStatsData
}

interface StatCardProps {
  label: string
  value: string
  unit?: string
  icon: React.ReactNode
  color: string
  trend?: string
}

function StatCard({ label, value, unit, icon, color, trend }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState("0")
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const numVal = parseFloat(value)
    if (isNaN(numVal)) {
      return
    }
    const duration = 1200
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * numVal

      if (value.includes(".")) {
        setDisplayValue(current.toFixed(1))
      } else {
        setDisplayValue(Math.round(current).toString())
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value])

  const numVal = parseFloat(value)
  const finalDisplay = isNaN(numVal) ? value : displayValue

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg"
      style={{
        backgroundColor: "var(--muted)",
        border: `1px solid var(--border)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: trend.startsWith("+") ? "#ff2d55" : "#00d4ff",
              backgroundColor: trend.startsWith("+") ? "rgba(255,45,85,0.1)" : "rgba(0,212,255,0.1)",
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className="text-xl font-bold font-mono tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {finalDisplay}
        </span>
        {unit && (
          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {unit}
          </span>
        )}
      </div>

      <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
    </div>
  )
}

export function DisposalStats({ data }: DisposalStatsProps) {
  const { t } = useLocaleStore()
  const stats: StatCardProps[] = [
    {
      label: t("situation.todayDisposalActions"),
      value: String(data.totalActions),
      unit: t("situation.times"),
      icon: "⚡",
      color: "#0066ff",
      trend: "+12",
    },
    {
      label: t("situation.autoDisposalRate"),
      value: String(data.autoRate),
      unit: "%",
      icon: "🤖",
      color: "#a78bfa",
      trend: "+3.2",
    },
    {
      label: t("situation.avgResponseTime"),
      value: String(data.avgResponseTime),
      unit: t("situation.minutes"),
      icon: "⏱",
      color: "#fbbf24",
      trend: "-0.8",
    },
    {
      label: t("situation.disposalSuccessRate"),
      value: String(data.successRate),
      unit: "%",
      icon: "✓",
      color: "#00ff88",
      trend: "+1.5",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
