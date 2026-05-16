"use client"

import { useEffect, useState, useMemo } from "react"

interface AttackPoint {
  name: string
  lat: number
  lng: number
  type: "source" | "target"
}

interface AttackLine {
  from: AttackPoint
  to: AttackPoint
}

interface AttackMapProps {
  attacks: AttackPoint[]
}

const MAP_WIDTH = 800
const MAP_HEIGHT = 400

function lngToX(lng: number): number {
  return ((lng + 180) / 360) * MAP_WIDTH
}

function latToY(lat: number): number {
  return ((90 - lat) / 180) * MAP_HEIGHT
}

const CONTINENT_PATHS = [
  "M 120,80 L 140,60 L 170,55 L 195,65 L 210,80 L 215,100 L 210,120 L 195,135 L 180,140 L 160,135 L 140,120 L 125,100 Z",
  "M 195,140 L 210,130 L 225,135 L 235,150 L 230,170 L 220,185 L 205,190 L 195,180 L 190,160 Z",
  "M 350,55 L 380,50 L 410,55 L 430,70 L 435,90 L 425,110 L 410,120 L 385,125 L 360,115 L 345,95 L 340,75 Z",
  "M 350,130 L 375,125 L 400,130 L 415,150 L 420,175 L 410,200 L 395,215 L 370,220 L 350,210 L 340,185 L 338,160 Z",
  "M 430,60 L 470,50 L 520,55 L 560,65 L 590,80 L 600,100 L 590,120 L 560,130 L 520,135 L 480,130 L 450,115 L 435,95 Z",
  "M 540,140 L 580,135 L 620,140 L 650,155 L 660,175 L 650,195 L 620,210 L 580,215 L 550,205 L 535,185 L 530,160 Z",
  "M 640,70 L 680,60 L 720,65 L 750,80 L 760,100 L 750,120 L 720,135 L 680,140 L 650,130 L 635,110 L 630,90 Z",
  "M 620,220 L 660,210 L 700,215 L 730,230 L 740,250 L 730,270 L 700,280 L 660,285 L 630,275 L 615,255 L 610,235 Z",
]

export function AttackMap({ attacks }: AttackMapProps) {
  const [animPhase, setAnimPhase] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimPhase((p) => (p + 1) % 100)
    }, 50)
    return () => clearInterval(timer)
  }, [])

  const lines = useMemo<AttackLine[]>(() => {
    const sources = attacks.filter((a) => a.type === "source")
    const targets = attacks.filter((a) => a.type === "target")
    const result: AttackLine[] = []
    sources.forEach((s, idx) => {
      const t = targets[idx % targets.length]
      if (t) result.push({ from: s, to: t })
    })
    return result
  }, [attacks])

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <filter id="pointGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="transparent" />

      <ellipse
        cx={MAP_WIDTH / 2}
        cy={MAP_HEIGHT / 2}
        rx={MAP_WIDTH * 0.45}
        ry={MAP_HEIGHT * 0.4}
        fill="url(#mapGlow)"
      />

      {CONTINENT_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="rgba(34,211,238,0.06)"
          stroke="rgba(34,211,238,0.15)"
          strokeWidth={0.5}
        />
      ))}

      {[0, 1, 2, 3].map((i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={MAP_HEIGHT * (0.2 + i * 0.2)}
          x2={MAP_WIDTH}
          y2={MAP_HEIGHT * (0.2 + i * 0.2)}
          stroke="rgba(255,255,255,0.03)"
          strokeDasharray="4,8"
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line
          key={`v-${i}`}
          x1={MAP_WIDTH * (0.1 + i * 0.12)}
          y1={0}
          x2={MAP_WIDTH * (0.1 + i * 0.12)}
          y2={MAP_HEIGHT}
          stroke="rgba(255,255,255,0.03)"
          strokeDasharray="4,8"
        />
      ))}

      {lines.map((line, i) => {
        const x1 = lngToX(line.from.lng)
        const y1 = latToY(line.from.lat)
        const x2 = lngToX(line.to.lng)
        const y2 = latToY(line.to.lat)
        const midX = (x1 + x2) / 2
        const midY = Math.min(y1, y2) - 30

        const progress = ((animPhase + i * 17) % 100) / 100
        const dotX = x1 + (x2 - x1) * progress
        const dotY =
          y1 +
          (y2 - y1) * progress -
          Math.sin(progress * Math.PI) * 30

        return (
          <g key={`line-${i}`}>
            <path
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none"
              stroke="rgba(239,68,68,0.2)"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={2}
              fill="#ef4444"
              opacity={0.8}
              style={{ filter: "url(#pointGlow)" }}
            />
          </g>
        )
      })}

      {attacks.map((point, i) => {
        const x = lngToX(point.lng)
        const y = latToY(point.lat)
        const isSource = point.type === "source"
        const color = isSource ? "#ef4444" : "#3b82f6"
        const pulseScale = 1 + ((animPhase + i * 13) % 50) / 50

        return (
          <g key={`point-${i}`}>
            {isSource && (
              <circle
                cx={x}
                cy={y}
                r={8 * pulseScale}
                fill="none"
                stroke={color}
                strokeWidth={0.5}
                opacity={0.3 / pulseScale}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isSource ? 3.5 : 3}
              fill={color}
              style={{ filter: "url(#pointGlow)" }}
            />
            <text
              x={x}
              y={y - (isSource ? 10 : 8)}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="8"
            >
              {point.name}
            </text>
          </g>
        )
      })}

      <g transform={`translate(20, ${MAP_HEIGHT - 30})`}>
        <circle cx={0} cy={0} r={4} fill="#ef4444" />
        <text x={8} y={3} fill="rgba(255,255,255,0.4)" fontSize="9">
          攻击源
        </text>
        <circle cx={60} cy={0} r={4} fill="#3b82f6" />
        <text x={68} y={3} fill="rgba(255,255,255,0.4)" fontSize="9">
          攻击目标
        </text>
      </g>
    </svg>
  )
}
