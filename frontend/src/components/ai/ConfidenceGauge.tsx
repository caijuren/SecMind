"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"

interface ConfidenceGaugeProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  animate?: boolean
}

function getConfidenceColor(value: number): string {
  if (value >= 80) return "#22d3ee"
  if (value >= 65) return "#4ade80"
  if (value >= 50) return "#fbbf24"
  if (value >= 35) return "#f97316"
  return "#ef4444"
}

function getConfidenceLabelKey(value: number): string {
  if (value >= 80) return "confidenceGauge.highConfidence"
  if (value >= 65) return "confidenceGauge.fairlyHigh"
  if (value >= 50) return "confidenceGauge.medium"
  if (value >= 35) return "confidenceGauge.fairlyLow"
  return "confidenceGauge.lowConfidence"
}

export default function ConfidenceGauge({
  value,
  size = 64,
  strokeWidth = 5,
  className,
  showLabel = true,
  animate = true,
}: ConfidenceGaugeProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value)
  const hasAnimated = useRef(false)
  const prevValue = useRef(value)
  const { t } = useLocaleStore()

  const startAnimation = useCallback(() => {
    hasAnimated.current = true
    const duration = 1200
    const startTime = performance.now()
    const startValue = 0
    const targetValue = value

    function tick(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(startValue + (targetValue - startValue) * eased))

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [value])

  useEffect(() => {
    if (!animate) {
      return
    }

    if (value !== prevValue.current) {
      prevValue.current = value
      startAnimation()
      return
    }

    if (!hasAnimated.current) {
      startAnimation()
    }
  }, [value, animate, startAnimation])

  const color = getConfidenceColor(value)
  const labelKey = getConfidenceLabelKey(value)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayValue / 100) * circumference
  const center = size / 2

  const fontSize = size <= 48 ? "text-[10px]" : size <= 64 ? "text-xs" : "text-sm"
  const valueFontSize = size <= 48 ? "text-xs" : size <= 64 ? "text-sm" : "text-base"

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${t("confidenceGauge.ariaLabel")}: ${value}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(34,211,238,0.08)"
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
          className="transition-[stroke-dashoffset] duration-300 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color}66)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("font-mono font-bold tabular-nums", valueFontSize)}
          style={{ color }}
        >
          {displayValue}%
        </span>
        {showLabel && size > 48 && (
          <span
            className={cn("font-medium tracking-wide opacity-70", fontSize)}
            style={{ color }}
          >
            {t(labelKey)}
          </span>
        )}
      </div>
    </div>
  )
}

export type { ConfidenceGaugeProps }