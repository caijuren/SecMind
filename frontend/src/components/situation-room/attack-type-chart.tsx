"use client"

import { useMemo } from "react"
import { useLocaleStore } from "@/store/locale-store"

interface AttackTypeData {
  type: string
  count: number
}

interface AttackTypeChartProps {
  data: AttackTypeData[]
}

const COLORS = ["#00d4ff", "#a78bfa", "#ff2d55", "#fbbf24", "#00ff88"]

export function AttackTypeChart({ data }: AttackTypeChartProps) {
  const { t } = useLocaleStore()
  const top5 = useMemo(() => data.slice(0, 5), [data])
  const total = useMemo(() => top5.reduce((s, d) => s + d.count, 0), [top5])

  const size = 120
  const cx = size / 2
  const cy = size / 2
  const outerR = 52
  const innerR = 32

  const slices = useMemo(() => {
    const angles: number[] = [-90]
    top5.forEach((item) => {
      const pct = total > 0 ? item.count / total : 0
      angles.push(angles[angles.length - 1] + pct * 360)
    })
    return top5.map((item, i) => {
      const pct = total > 0 ? item.count / total : 0
      const startAngle = angles[i]
      const endAngle = angles[i + 1]

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1O = cx + outerR * Math.cos(startRad)
      const y1O = cy + outerR * Math.sin(startRad)
      const x2O = cx + outerR * Math.cos(endRad)
      const y2O = cy + outerR * Math.sin(endRad)
      const x1I = cx + innerR * Math.cos(endRad)
      const y1I = cy + innerR * Math.sin(endRad)
      const x2I = cx + innerR * Math.cos(startRad)
      const y2I = cy + innerR * Math.sin(startRad)

      const largeArc = pct > 0.5 ? 1 : 0

      return {
        path: `M ${x1O} ${y1O} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2O} ${y2O} L ${x1I} ${y1I} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2I} ${y2I} Z`,
        color: COLORS[i % COLORS.length],
        label: item.type,
        pct: (pct * 100).toFixed(1),
        count: item.count,
      }
    })
  }, [top5, total, cx, cy, outerR, innerR])

  return (
    <div className="flex items-start gap-3">
      {/* 环形图 */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-[100px] h-[100px] shrink-0"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="var(--border)" strokeWidth={outerR - innerR} opacity={0.3} />

        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            opacity={0.85}
            style={{
              filter: `drop-shadow(0 0 4px ${slice.color}44)`,
              transition: "opacity 0.3s ease",
            }}
          />
        ))}

        <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--background)" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="16"
          fontWeight="bold"
          fontFamily="var(--font-space-grotesk), monospace"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="8"
        >
          {t("situation.totalAttacks")}
        </text>
      </svg>

      {/* 图例 — 纵向排列，文字不换行 */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="shrink-0 w-2 h-2 rounded-sm" style={{ backgroundColor: slice.color, boxShadow: `0 0 4px ${slice.color}40` }} />
            <span className="text-[10px] text-muted-foreground truncate">{slice.label}</span>
            <span className="text-[11px] font-bold tabular-nums font-[family-name:var(--font-space-grotesk)] shrink-0" style={{ color: slice.color }}>{slice.count}</span>
            <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">{slice.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
