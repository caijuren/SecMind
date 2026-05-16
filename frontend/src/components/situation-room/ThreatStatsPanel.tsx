"use client"

import { useEffect, useRef, useState } from "react"
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  BellOff,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

interface StatCardData {
  id: string
  label: string
  value: number
  unit: string
  icon: React.ReactNode
  color: string
  previousValue: number
  trend: "up" | "down" | "stable"
  trendLabel: string
}

interface ThreatStatsPanelProps {
  data: StatCardData[]
}

function AnimatedStatCard({ data }: { data: StatCardData }) {
  const [displayValue, setDisplayValue] = useState("0")
  const rafRef = useRef(0)
  const { value, unit, label, icon, color, previousValue, trend, trendLabel } = data

  useEffect(() => {
    const duration = 1200
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value

      if (Number.isInteger(value)) {
        setDisplayValue(Math.round(current).toLocaleString())
      } else {
        setDisplayValue(current.toFixed(1))
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

  const trendColor = trend === "up" ? "#ef4444" : trend === "down" ? "#22d3ee" : "rgba(255,255,255,0.3)"
  const trendBg = trend === "up" ? "rgba(239,68,68,0.1)" : trend === "down" ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)"

  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-lg relative overflow-hidden group transition-all duration-300"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${color}08 0%, transparent 50%)`,
        }}
      />

      <div className="flex items-center justify-between relative z-10">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex items-center gap-1">
          {trend === "up" ? (
            <TrendingUp size={12} style={{ color: trendColor }} />
          ) : trend === "down" ? (
            <TrendingDown size={12} style={{ color: trendColor }} />
          ) : null}
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ color: trendColor, backgroundColor: trendBg }}
          >
            {trendLabel}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold font-mono tabular-nums"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            {displayValue}
          </span>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {unit}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            {label}
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${color}40 0%, transparent 100%)`,
        }}
      />
    </div>
  )
}

export function ThreatStatsPanel({ data }: ThreatStatsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-2 h-full content-start">
      {data.map((stat) => (
        <AnimatedStatCard key={stat.id} data={stat} />
      ))}
    </div>
  )
}

export function createDefaultStats(): StatCardData[] {
  return [
    {
      id: "active-threats",
      label: "活跃威胁",
      value: 23,
      unit: "个",
      icon: <ShieldAlert size={18} />,
      color: "#ef4444",
      previousValue: 18,
      trend: "up",
      trendLabel: "+27.8%",
    },
    {
      id: "blocked-attacks",
      label: "已阻断攻击",
      value: 1847,
      unit: "次",
      icon: <ShieldCheck size={18} />,
      color: "#22d3ee",
      previousValue: 1520,
      trend: "up",
      trendLabel: "+21.5%",
    },
    {
      id: "mttr",
      label: "MTTR",
      value: 4.2,
      unit: "分钟",
      icon: <Clock size={18} />,
      color: "#fbbf24",
      previousValue: 5.8,
      trend: "down",
      trendLabel: "-27.6%",
    },
    {
      id: "noise-reduction",
      label: "告警降噪",
      value: 87.5,
      unit: "%",
      icon: <BellOff size={18} />,
      color: "#a78bfa",
      previousValue: 82.3,
      trend: "up",
      trendLabel: "+6.3%",
    },
  ]
}