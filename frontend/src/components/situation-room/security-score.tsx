"use client"

import { useEffect, useState } from "react"

interface SecurityScoreProps {
  score: number
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

export function SecurityScore({ score, size = 120 }: SecurityScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  useEffect(() => {
    let start = 0
    const duration = 1500
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * score)
      setAnimatedScore(start)
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.3s ease",
            filter: `drop-shadow(0 0 6px ${color}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          {animatedScore}
        </span>
        <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}
