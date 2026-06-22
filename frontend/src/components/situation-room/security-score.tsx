"use client"

import { useEffect, useState } from "react"
import { useLocaleStore } from "@/store/locale-store"

interface SecurityScoreProps {
  score: number
  size?: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#00ff88"
  if (score >= 60) return "#fbbf24"
  if (score >= 40) return "#ff9500"
  return "#ff2d55"
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 80) return t("situation.scoreSafe")
  if (score >= 60) return t("situation.scoreFair")
  if (score >= 40) return t("situation.scoreRisk")
  return t("situation.scoreDanger")
}

export function SecurityScore({ score, size = 120 }: SecurityScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const { t } = useLocaleStore()
  const color = getScoreColor(score)
  const label = getScoreLabel(score, t)

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
          stroke="var(--border)"
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
          className="font-bold text-2xl tabular-nums font-[family-name:var(--font-space-grotesk)]"
          style={{ color }}
        >
          {animatedScore}
        </span>
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground/50 uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}
