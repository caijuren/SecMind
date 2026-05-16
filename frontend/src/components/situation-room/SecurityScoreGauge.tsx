"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SecurityScoreGaugeProps {
  score: number
  previousScore: number
  size?: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22d3ee"
  if (score >= 60) return "#fbbf24"
  if (score >= 40) return "#f97316"
  return "#ef4444"
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "安全"
  if (score >= 60) return "一般"
  if (score >= 40) return "风险"
  return "危险"
}

export function SecurityScoreGauge({ score, previousScore, size = 200 }: SecurityScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const animRef = useRef(0)

  const color = getScoreColor(score)
  const label = getScoreLabel(score)
  const trend = score > previousScore ? "up" : score < previousScore ? "down" : "stable"
  const diff = score - previousScore

  const center = size / 2
  const radius = size * 0.38
  const strokeWidth = size * 0.06
  const needleLength = radius * 0.7

  const startAngle = -210
  const endAngle = 30
  const totalAngle = endAngle - startAngle

  useEffect(() => {
    let startTime = performance.now()
    const duration = 1500

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * score))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score])

  const needleAngle = startAngle + (animatedScore / 100) * totalAngle
  const needleRad = (needleAngle * Math.PI) / 180
  const needleX = center + needleLength * Math.cos(needleRad)
  const needleY = center + needleLength * Math.sin(needleRad)

  const arcs: { start: number; end: number; color: string }[] = [
    { start: 0, end: 25, color: "#ef4444" },
    { start: 25, end: 50, color: "#f97316" },
    { start: 50, end: 75, color: "#fbbf24" },
    { start: 75, end: 100, color: "#22d3ee" },
  ]

  function angleForPercent(pct: number): number {
    return startAngle + (pct / 100) * totalAngle
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size * 0.85}
        viewBox={`0 0 ${size} ${size * 0.85}`}
        className="overflow-visible"
      >
        <defs>
          {arcs.map((arc, i) => {
            const s = angleForPercent(arc.start)
            const e = angleForPercent(arc.end)
            const sr = (s * Math.PI) / 180
            const er = (e * Math.PI) / 180
            return (
              <linearGradient key={i} id={`gaugeGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={arc.color} stopOpacity="0.6" />
                <stop offset="50%" stopColor={arc.color} stopOpacity="1" />
                <stop offset="100%" stopColor={arc.color} stopOpacity="0.6" />
              </linearGradient>
            )
          })}
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        <path
          d={(() => {
            const sr = (startAngle * Math.PI) / 180
            const er = (endAngle * Math.PI) / 180
            const x1 = center + radius * Math.cos(sr)
            const y1 = center + radius * Math.sin(sr)
            const x2 = center + radius * Math.cos(er)
            const y2 = center + radius * Math.sin(er)
            const large = totalAngle > 180 ? 1 : 0
            return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
          })()}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {arcs.map((arc, i) => {
          const s = angleForPercent(arc.start)
          const e = angleForPercent(arc.end)
          const sr = (s * Math.PI) / 180
          const er = (e * Math.PI) / 180
          const x1 = center + radius * Math.cos(sr)
          const y1 = center + radius * Math.sin(sr)
          const x2 = center + radius * Math.cos(er)
          const y2 = center + radius * Math.sin(er)
          const large = (e - s) > 180 ? 1 : 0

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`}
              fill="none"
              stroke={`url(#gaugeGrad-${i})`}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              style={{ filter: `url(#gaugeGlow)` }}
            />
          )
        })}

        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pct) => {
          const angle = angleForPercent(pct)
          const rad = (angle * Math.PI) / 180
          const innerR = radius - strokeWidth / 2 - 2
          const outerR = radius + strokeWidth / 2 + 2
          const x1 = center + innerR * Math.cos(rad)
          const y1 = center + innerR * Math.sin(rad)
          const x2 = center + outerR * Math.cos(rad)
          const y2 = center + outerR * Math.sin(rad)
          const isMajor = pct % 20 === 0

          return (
            <g key={pct}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={isMajor ? 1.5 : 0.5}
              />
              {isMajor && (
                <text
                  x={center + (innerR - 12) * Math.cos(rad)}
                  y={center + (innerR - 12) * Math.sin(rad) + 4}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.35)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {pct}
                </text>
              )}
            </g>
          )
        })}

        <g style={{ filter: "url(#needleShadow)" }}>
          <line
            x1={center - 6 * Math.cos(needleRad)}
            y1={center - 6 * Math.sin(needleRad)}
            x2={needleX}
            y2={needleY}
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx={center}
            cy={center}
            r={size * 0.04}
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
          />
          <circle
            cx={center}
            cy={center}
            r={size * 0.02}
            fill={color}
          />
        </g>
      </svg>

      <div
        className="absolute flex flex-col items-center"
        style={{ top: "52%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        <span
          className="font-mono font-bold tabular-nums leading-none"
          style={{ fontSize: size * 0.18, color }}
        >
          {animatedScore}
        </span>
        <span
          className="font-medium tracking-wider uppercase"
          style={{
            fontSize: size * 0.07,
            color: "rgba(255,255,255,0.5)",
            marginTop: 2,
          }}
        >
          {label}
        </span>
        <div
          className="flex items-center gap-1 mt-1"
          style={{ fontSize: size * 0.05 }}
        >
          {trend === "up" ? (
            <>
              <TrendingUp size={size * 0.06} style={{ color: "#22d3ee" }} />
              <span style={{ color: "#22d3ee" }}>+{Math.abs(diff)}</span>
            </>
          ) : trend === "down" ? (
            <>
              <TrendingDown size={size * 0.06} style={{ color: "#ef4444" }} />
              <span style={{ color: "#ef4444" }}>-{Math.abs(diff)}</span>
            </>
          ) : (
            <>
              <Minus size={size * 0.06} style={{ color: "rgba(255,255,255,0.4)" }} />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>0</span>
            </>
          )}
          <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>
            较上期
          </span>
        </div>
      </div>
    </div>
  )
}