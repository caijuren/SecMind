"use client"

import { useState, useEffect, useMemo } from "react"
import { useLocaleStore } from "@/store/locale-store"

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
  { id: "reconnaissance", nameKey: "situation.tacticReconnaissance", shortKey: "situation.tacticReconnaissance" },
  { id: "resource-dev", nameKey: "situation.tacticResourceDev", shortKey: "situation.tacticResourceDev" },
  { id: "initial-access", nameKey: "situation.tacticInitialAccess", shortKey: "situation.tacticInitialAccess" },
  { id: "execution", nameKey: "situation.tacticExecution", shortKey: "situation.tacticExecution" },
  { id: "persistence", nameKey: "situation.tacticPersistence", shortKey: "situation.tacticPersistence" },
  { id: "priv-escalation", nameKey: "situation.tacticPrivEscalation", shortKey: "situation.tacticPrivEscalation" },
  { id: "defense-evasion", nameKey: "situation.tacticDefenseEvasion", shortKey: "situation.tacticDefenseEvasion" },
  { id: "credential-access", nameKey: "situation.tacticCredentialAccess", shortKey: "situation.tacticCredentialAccess" },
  { id: "discovery", nameKey: "situation.tacticDiscovery", shortKey: "situation.tacticDiscovery" },
  { id: "lateral-movement", nameKey: "situation.tacticLateralMovement", shortKey: "situation.tacticLateralMovement" },
  { id: "collection", nameKey: "situation.tacticCollection", shortKey: "situation.tacticCollection" },
  { id: "exfiltration", nameKey: "situation.tacticExfiltration", shortKey: "situation.tacticExfiltration" },
]

const ROWS = 4

export function MitreMatrix({ techniques }: MitreMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [pulseActive, setPulseActive] = useState(true)
  const { t } = useLocaleStore()

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
  techniques.forEach((tech) => {
    const list = techniquesByTactic.get(tech.tactic) || []
    list.push(tech)
    techniquesByTactic.set(tech.tactic, list)
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
              backgroundColor: "var(--muted)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              className="text-[9px] font-medium text-center leading-tight"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t(tactic.shortKey)}
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

            let bgColor = "var(--muted)"
            let borderColor = "var(--border)"
            let textColor = "var(--muted-foreground)"

            if (hasAlert) {
              const count = technique?.alertCount ?? 1
              if (count >= 5) {
                bgColor = "rgba(255,45,85,0.2)"
                borderColor = "rgba(255,45,85,0.4)"
                textColor = "rgba(255,45,85,0.9)"
              } else if (count >= 3) {
                bgColor = "rgba(255,149,0,0.15)"
                borderColor = "rgba(255,149,0,0.3)"
                textColor = "rgba(255,149,0,0.9)"
              } else {
                bgColor = "rgba(251,191,36,0.12)"
                borderColor = "rgba(251,191,36,0.25)"
                textColor = "rgba(251,191,36,0.9)"
              }
            }

            if (isHovered) {
              bgColor = hasAlert ? bgColor : "var(--muted)"
              borderColor = "rgba(0,212,255,0.3)"
            }

            return (
              <div
                key={`${colIdx}-${rowIdx}`}
                className="flex flex-col items-center justify-center px-0.5 py-0.5 rounded-sm cursor-default transition-colors duration-200 relative"
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
                  <span className="text-[8px]" style={{ color: "var(--muted-foreground)" }}>
                    -
                  </span>
                )}

                {isPulsing && hasAlert && pulseActive && (
                  <div
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    style={{
                      animation: "mitrePulse 2s ease-in-out infinite",
                      border: `1px solid rgba(255,45,85,0.3)`,
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
