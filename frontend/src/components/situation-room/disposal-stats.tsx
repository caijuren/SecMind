"use client"

import { useEffect, useRef, useState } from "react"

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
        backgroundColor: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.06)`,
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
              color: trend.startsWith("+") ? "#ef4444" : "#22d3ee",
              backgroundColor: trend.startsWith("+") ? "rgba(239,68,68,0.1)" : "rgba(34,211,238,0.1)",
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className="text-xl font-bold font-mono tabular-nums"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {finalDisplay}
        </span>
        {unit && (
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {unit}
          </span>
        )}
      </div>

      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </span>
    </div>
  )
}

export function DisposalStats({ data }: DisposalStatsProps) {
  const stats: StatCardProps[] = [
    {
      label: "今日处置动作",
      value: String(data.totalActions),
      unit: "次",
      icon: "⚡",
      color: "#22d3ee",
      trend: "+12",
    },
    {
      label: "自动处置率",
      value: String(data.autoRate),
      unit: "%",
      icon: "🤖",
      color: "#a78bfa",
      trend: "+3.2",
    },
    {
      label: "平均响应时间",
      value: String(data.avgResponseTime),
      unit: "分钟",
      icon: "⏱",
      color: "#fbbf24",
      trend: "-0.8",
    },
    {
      label: "处置成功率",
      value: String(data.successRate),
      unit: "%",
      icon: "✓",
      color: "#34d399",
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
