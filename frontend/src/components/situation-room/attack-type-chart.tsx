"use client"

import { useMemo } from "react"

interface AttackTypeData {
  type: string
  count: number
}

interface AttackTypeChartProps {
  data: AttackTypeData[]
}

const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"]

export function AttackTypeChart({ data }: AttackTypeChartProps) {
  const top5 = useMemo(() => data.slice(0, 5), [data])
  const total = useMemo(() => top5.reduce((s, d) => s + d.count, 0), [top5])

  const cx = 130
  const cy = 110
  const outerR = 90
  const innerR = 55

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

      const x1Outer = cx + outerR * Math.cos(startRad)
      const y1Outer = cy + outerR * Math.sin(startRad)
      const x2Outer = cx + outerR * Math.cos(endRad)
      const y2Outer = cy + outerR * Math.sin(endRad)
      const x1Inner = cx + innerR * Math.cos(endRad)
      const y1Inner = cy + innerR * Math.sin(endRad)
      const x2Inner = cx + innerR * Math.cos(startRad)
      const y2Inner = cy + innerR * Math.sin(startRad)

      const largeArc = pct > 0.5 ? 1 : 0

      const midRad = ((startAngle + (endAngle - startAngle) / 2) * Math.PI) / 180
      const labelR = outerR + 18
      const labelX = cx + labelR * Math.cos(midRad)
      const labelY = cy + labelR * Math.sin(midRad)

      return {
        path: `M ${x1Outer} ${y1Outer} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner} Z`,
        color: COLORS[i % COLORS.length],
        label: item.type,
        pct: (pct * 100).toFixed(1),
        labelX,
        labelY,
        count: item.count,
      }
    })
  }, [top5, total, cx, cy, outerR, innerR])

  const width = 320
  const height = 230

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {slices.map((slice, i) => (
        <g key={i}>
          <path
            d={slice.path}
            fill={slice.color}
            opacity={0.85}
            style={{
              filter: `drop-shadow(0 0 4px ${slice.color}44)`,
              transition: "opacity 0.3s ease",
            }}
          />
        </g>
      ))}

      <circle cx={cx} cy={cy} r={innerR - 2} fill="#0a0e27" />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.9)"
        fontSize="22"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="10"
      >
        总攻击数
      </text>

      {slices.map((slice, i) => {
        const legendY = 20 + i * 22
        const legendX = 250
        return (
          <g key={`legend-${i}`} transform={`translate(${legendX}, ${legendY})`}>
            <rect
              x={0}
              y={-6}
              width={10}
              height={10}
              rx={2}
              fill={slice.color}
            />
            <text
              x={16}
              y={2}
              fill="rgba(255,255,255,0.7)"
              fontSize="11"
            >
              {slice.label}
            </text>
            <text
              x={16}
              y={14}
              fill="rgba(255,255,255,0.4)"
              fontSize="9"
              fontFamily="monospace"
            >
              {slice.count}次 · {slice.pct}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}
