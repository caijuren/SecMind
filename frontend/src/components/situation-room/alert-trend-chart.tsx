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
  high: "#ff2d55",
  medium: "#fbbf24",
  low: "#00d4ff",
}

const LEGEND_LABELS: Record<string, string> = {
  high: "高危",
  medium: "中危",
  low: "低危",
}

function buildPath(width: number, height: number, data: number[]): string {
  if (data.length < 2) return ""
  const maxVal = Math.max(...data, 1)
  const stepX = width / (data.length - 1)

  return data
    .map((val, i) => {
      const x = i * stepX
      const y = height - (val / maxVal) * (height - 10) - 5
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
}

function buildAreaPath(width: number, height: number, data: number[]): string {
  const linePath = buildPath(width, height, data)
  if (!linePath) return ""
  const stepX = width / (data.length - 1)
  const lastX = (data.length - 1) * stepX
  return `${linePath} L ${lastX.toFixed(1)} ${height} L 0 ${height} Z`
}

export function AlertTrendChart({ data }: AlertTrendChartProps) {
  const width = 500
  const height = 160
  const padding = { top: 8, right: 8, bottom: 20, left: 30 }
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

  function renderLine(key: "high" | "medium" | "low") {
    const values = data.map((d) => d[key])
    const linePath = buildPath(chartW, chartH, values)
    const areaPath = buildAreaPath(chartW, chartH, values)
    const color = COLORS[key]

    return (
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        <defs>
          <linearGradient id={`trend-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#trend-grad-${key})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
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
              r={2}
              fill={color}
              stroke="var(--background)"
              strokeWidth={1}
            />
          )
        })}
      </g>
    )
  }

  // X轴标签：每隔3个显示一次，避免重叠
  const xLabelInterval = 3

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minHeight: "140px" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y轴网格线 */}
          {yTicks.map((tick) => {
            const y = chartH - (tick / maxVal) * (chartH - 10) - 5
            return (
              <g key={tick}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartW}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3,3"
                />
                <text
                  x={-6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--muted-foreground)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* X轴时间标签 — 间隔显示 */}
          {data.map((d, i) => {
            if (i % xLabelInterval !== 0 && i !== data.length - 1) return null
            const stepX = chartW / (data.length - 1)
            const x = i * stepX
            return (
              <text
                key={d.hour}
                x={x}
                y={chartH + 14}
                textAnchor="middle"
                fill="var(--muted-foreground)"
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
      </svg>

      {/* 图例 — HTML 渲染 */}
      <div className="flex items-center gap-4 mt-2 pl-8">
        {(["high", "medium", "low"] as const).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[key], boxShadow: `0 0 4px ${COLORS[key]}40` }} />
            <span className="text-[10px] text-muted-foreground">{LEGEND_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
