"use client"

import { useState, useEffect, useMemo } from "react"

interface MitreTechnique {
  id: string
  name: string
  tactic: string
  hasAlert: boolean
  alertCount?: number
}

interface MitreMatrixProps {
  techniques: MitreTechnique[]
}

const TACTICS = [
  { id: "reconnaissance", name: "侦察", short: "侦察" },
  { id: "resource-dev", name: "资源开发", short: "资源开发" },
  { id: "initial-access", name: "初始访问", short: "初始访问" },
  { id: "execution", name: "执行", short: "执行" },
  { id: "persistence", name: "持久化", short: "持久化" },
  { id: "priv-escalation", name: "权限提升", short: "权限提升" },
  { id: "defense-evasion", name: "防御规避", short: "防御规避" },
  { id: "credential-access", name: "凭证访问", short: "凭证访问" },
  { id: "discovery", name: "发现", short: "发现" },
  { id: "lateral-movement", name: "横向移动", short: "横向移动" },
  { id: "collection", name: "收集", short: "收集" },
  { id: "exfiltration", name: "数据外泄", short: "数据外泄" },
]

const ROWS = 4

export function MitreMatrix({ techniques }: MitreMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [pulseActive, setPulseActive] = useState(true)

  const pulseCells = useMemo(() => {
    return new Set(techniques.filter((t) => t.hasAlert).map((t) => t.id))
  }, [techniques])

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseActive((p) => !p)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  const techniquesByTactic = new Map<string, MitreTechnique[]>()
  techniques.forEach((t) => {
    const list = techniquesByTactic.get(t.tactic) || []
    list.push(t)
    techniquesByTactic.set(t.tactic, list)
  })

  return (
    <div className="w-full h-full overflow-hidden">
      <div
        className="grid gap-[2px] h-full"
        style={{
          gridTemplateColumns: `repeat(${TACTICS.length}, 1fr)`,
          gridTemplateRows: `auto repeat(${ROWS}, 1fr)`,
        }}
      >
        {TACTICS.map((tactic) => (
          <div
            key={tactic.id}
            className="flex items-center justify-center px-1 py-1.5 rounded-t"
            style={{
              backgroundColor: "rgba(34,211,238,0.08)",
              borderBottom: "1px solid rgba(34,211,238,0.15)",
            }}
          >
            <span
              className="text-[9px] font-medium text-center leading-tight"
              style={{ color: "rgba(34,211,238,0.7)" }}
            >
              {tactic.short}
            </span>
          </div>
        ))}

        {TACTICS.map((tactic, colIdx) => {
          const tacticTechniques = techniquesByTactic.get(tactic.id) || []

          return Array.from({ length: ROWS }, (_, rowIdx) => {
            const technique = tacticTechniques[rowIdx]
            const cellId = technique?.id || `${tactic.id}-${rowIdx}`
            const hasAlert = technique?.hasAlert ?? false
            const isHovered = hoveredCell === cellId
            const isPulsing = pulseCells.has(cellId)

            let bgColor = "rgba(255,255,255,0.02)"
            let borderColor = "rgba(255,255,255,0.04)"
            let textColor = "rgba(255,255,255,0.2)"

            if (hasAlert) {
              const count = technique?.alertCount ?? 1
              if (count >= 5) {
                bgColor = "rgba(239,68,68,0.2)"
                borderColor = "rgba(239,68,68,0.4)"
                textColor = "rgba(239,68,68,0.9)"
              } else if (count >= 3) {
                bgColor = "rgba(249,115,22,0.15)"
                borderColor = "rgba(249,115,22,0.3)"
                textColor = "rgba(249,115,22,0.9)"
              } else {
                bgColor = "rgba(251,191,36,0.12)"
                borderColor = "rgba(251,191,36,0.25)"
                textColor = "rgba(251,191,36,0.9)"
              }
            }

            if (isHovered) {
              bgColor = hasAlert ? bgColor : "rgba(255,255,255,0.06)"
              borderColor = "rgba(34,211,238,0.4)"
            }

            return (
              <div
                key={`${colIdx}-${rowIdx}`}
                className="flex flex-col items-center justify-center px-0.5 py-0.5 rounded-sm cursor-default transition-all duration-200 relative"
                style={{
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`,
                  minHeight: 0,
                }}
                onMouseEnter={() => setHoveredCell(cellId)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {technique ? (
                  <>
                    <span
                      className="text-[8px] font-medium leading-tight text-center truncate w-full"
                      style={{ color: textColor }}
                    >
                      {technique.name.length > 6
                        ? technique.name.slice(0, 6)
                        : technique.name}
                    </span>
                    {hasAlert && technique.alertCount && (
                      <span
                        className="text-[7px] font-mono"
                        style={{ color: textColor, opacity: 0.7 }}
                      >
                        {technique.alertCount}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.1)" }}>
                    -
                  </span>
                )}

                {isPulsing && hasAlert && pulseActive && (
                  <div
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    style={{
                      animation: "mitrePulse 2s ease-in-out infinite",
                      border: `1px solid rgba(239,68,68,0.3)`,
                    }}
                  />
                )}
              </div>
            )
          })
        })}
      </div>

      <style jsx>{`
        @keyframes mitrePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
