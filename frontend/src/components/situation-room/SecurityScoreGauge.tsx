"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useLocaleStore } from "@/store/locale-store"

interface SecurityScoreGaugeProps {
  score: number
  previousScore: number
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

export function SecurityScoreGauge({ score, previousScore, size = 200 }: SecurityScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const animRef = useRef(0)
  const { t } = useLocaleStore()

  const color = getScoreColor(score)
  const label = getScoreLabel(score, t)
  const trend = score > previousScore ? "up" : score < previousScore ? "down" : "stable"
  const diff = score - previousScore

  // 环形参数
  const strokeWidth = 8
  const radius = size / 2 - strokeWidth - 4
  const circumference = 2 * Math.PI * radius
  const progress = animatedScore / 100
  const dashOffset = circumference * (1 - progress)

  useEffect(() => {
    const startTime = performance.now()
    const duration = 1500

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimatedScore(Math.round(eased * score))
      if (p < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score])

  const trendIcon = trend === "up"
    ? <TrendingUp size={14} style={{ color: "#00ff88" }} />
    : trend === "down"
    ? <TrendingDown size={14} style={{ color: "#ff2d55" }} />
    : <Minus size={14} style={{ color: "var(--muted-foreground)" }} />

  const trendColor = trend === "up" ? "#00ff88" : trend === "down" ? "#ff2d55" : "var(--muted-foreground)"

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="ringGradient" cx="0%" cy="0%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* 背景轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* 进度环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 0.5s ease-out",
            filter: "url(#ringGlow)",
          }}
        />
      </svg>

      {/* 中央内容 */}
      <div
        className="absolute flex flex-col items-center"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        <span
          className="font-bold tabular-nums leading-none font-[family-name:var(--font-space-grotesk)]"
          style={{ fontSize: size * 0.22, color }}
        >
          {animatedScore}
        </span>
        <span
          className="font-medium mt-1"
          style={{
            fontSize: size * 0.07,
            color: "var(--muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        <div
          className="flex items-center gap-1 mt-1.5"
        >
          {trendIcon}
          <span style={{ fontSize: size * 0.055, color: trendColor, fontWeight: 600 }}>
            {diff > 0 ? "+" : ""}{diff}
          </span>
          <span style={{ fontSize: size * 0.05, color: "var(--muted-foreground)", marginLeft: 1 }}>
            {t("situation.vsLastPeriod")}
          </span>
        </div>
      </div>
    </div>
  )
}