"use client"

import { useMemo } from "react"

interface TrendDataPoint {
  hour: string
  high: number
  medium: number
  low: number
}

interface AlertTrendChartProps {
  data: TrendDataPoint[]
}

const COLORS = {
  high: "#ef4444",
  medium: "#fbbf24",
  low: "#22d3ee",
}

function buildPath(points: [number, number][], width: number, height: number, data: number[]): string {
  if (data.length < 2) return ""
  const maxVal = Math.max(...data, 1)
  const stepX = width / (data.length - 1)

  return points
    .map(([, val], i) => {
      const x = i * stepX
      const y = height - (val / maxVal) * (height - 10) - 5
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
}

function buildAreaPath(points: [number, number][], width: number, height: number, data: number[]): string {
  const linePath = buildPath(points, width, height, data)
  if (!linePath) return ""
  const stepX = width / (data.length - 1)
  const lastX = (data.length - 1) * stepX
  return `${linePath} L ${lastX.toFixed(1)} ${height} L 0 ${height} Z`
}

export function AlertTrendChart({ data }: AlertTrendChartProps) {
  const width = 420
  const height = 180
  const padding = { top: 10, right: 10, bottom: 24, left: 35 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = useMemo(() => {
    const all = data.flatMap((d) => [d.high, d.medium, d.low])
    return Math.max(...all, 1)
  }, [data])

  const yTicks = useMemo(() => {
    const step = Math.ceil(maxVal / 4)
    return Array.from({ length: 5 }, (_, i) => i * step)
  }, [maxVal])

  function toPoints(key: "high" | "medium" | "low") {
    return data.map((d) => [0, d[key]] as [number, number])
  }

  function renderLine(key: "high" | "medium" | "low") {
    const values = data.map((d) => d[key])
    const points = toPoints(key)
    const linePath = buildPath(points, chartW, chartH, values)
    const areaPath = buildAreaPath(points, chartW, chartH, values)
    const color = COLORS[key]

    return (
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        <defs>
          <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${key})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((v, i) => {
          const stepX = chartW / (values.length - 1)
          const x = i * stepX
          const y = chartH - (v / maxVal) * (chartH - 10) - 5
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2.5}
              fill={color}
              stroke="#0a0e27"
              strokeWidth={1.5}
            />
          )
        })}
      </g>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {yTicks.map((tick) => {
          const y = chartH - (tick / maxVal) * (chartH - 10) - 5
          return (
            <g key={tick}>
              <line
                x1={0}
                y1={y}
                x2={chartW}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3,3"
              />
              <text
                x={-8}
                y={y + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.35)"
                fontSize="10"
                fontFamily="monospace"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const stepX = chartW / (data.length - 1)
          const x = i * stepX
          return (
            <text
              key={d.hour}
              x={x}
              y={chartH + 16}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="9"
              fontFamily="monospace"
            >
              {d.hour}
            </text>
          )
        })}
      </g>

      {renderLine("low")}
      {renderLine("medium")}
      {renderLine("high")}

      <g transform={`translate(${padding.left}, ${height - 2})`}>
        {["高危", "中危", "低危"].map((label, i) => {
          const colorKey = (["high", "medium", "low"] as const)[i]
          return (
            <g key={label} transform={`translate(${i * 70}, 0)`}>
              <circle cx={0} cy={-2} r={3} fill={COLORS[colorKey]} />
              <text
                x={7}
                y={1}
                fill="rgba(255,255,255,0.5)"
                fontSize="10"
              >
                {label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
