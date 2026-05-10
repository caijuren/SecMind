"use client"

import { useState } from "react"
import { Clock, AlertTriangle, Shield, Brain, FileText, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineEvent {
  id: string
  timestamp: string
  type: "alert" | "log" | "action" | "ai_analysis" | "vpn" | "email"
  title: string
  description?: string
  source?: string
  riskLevel?: "critical" | "high" | "medium" | "low" | "info"
}

interface EventTimelineProps {
  events: TimelineEvent[]
  title?: string
  maxHeight?: string
  showSource?: boolean
  highlightedId?: string | null
}

const typeIconMap: Record<TimelineEvent["type"], React.ElementType> = {
  alert: AlertTriangle,
  ai_analysis: Brain,
  action: Shield,
  log: FileText,
  vpn: Globe,
  email: Globe,
}

const typeColorMap: Record<TimelineEvent["type"], string> = {
  alert: "#ff4d4f",
  ai_analysis: "#00d4ff",
  action: "#faad14",
  log: "#1677ff",
  vpn: "#a855f7",
  email: "#ec4899",
}

const riskColorMap: Record<NonNullable<TimelineEvent["riskLevel"]>, string> = {
  critical: "#ff4d4f",
  high: "#ff4d4f",
  medium: "#faad14",
  low: "#1677ff",
  info: "#64748b",
}

const riskGlowSet = new Set(["critical", "high"])

function getDotColor(event: TimelineEvent): string {
  if (event.riskLevel) return riskColorMap[event.riskLevel]
  return typeColorMap[event.type]
}

function getDotGlow(event: TimelineEvent): boolean {
  return !!event.riskLevel && riskGlowSet.has(event.riskLevel)
}

export default function EventTimeline({
  events,
  title,
  maxHeight = "400px",
  showSource = false,
  highlightedId,
}: EventTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <Clock className="size-4 text-cyan-600" />
          <h3 className="text-sm font-medium text-slate-800">{title}</h3>
        </div>
      )}
      <div
        className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        style={{ maxHeight }}
      >
        <div className="relative pl-2">
          <div
            className="absolute left-[68px] top-0 bottom-0 w-0.5"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,212,255,0.6), rgba(0,212,255,0.1))",
            }}
          />
          <div className="space-y-0">
            {events.map((event) => {
              const dotColor = getDotColor(event)
              const hasGlow = getDotGlow(event)
              const Icon = typeIconMap[event.type]
              const isActive = activeId === event.id
              const isHighlighted = highlightedId === event.id

              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3 py-2.5 px-2 rounded-md transition-all duration-300 cursor-pointer group"
                  style={{
                    borderLeft: isHighlighted
                      ? `3px solid ${dotColor}`
                      : isActive
                        ? `2px solid ${dotColor}`
                        : "2px solid transparent",
                    background: isHighlighted
                      ? `rgba(6,182,212,0.08)`
                      : isActive
                        ? "rgba(248,250,252,0.9)"
                        : "transparent",
                    boxShadow: isHighlighted
                      ? `0 0 12px 2px ${dotColor}40, inset 0 0 8px ${dotColor}10`
                      : "none",
                  }}
                  onMouseEnter={() => setActiveId(event.id)}
                  onMouseLeave={() => setActiveId(null)}
                >
                  <span className="shrink-0 w-[52px] text-right font-mono text-xs text-slate-400 pt-0.5 select-none">
                    {event.timestamp}
                  </span>

                  <div className="relative flex items-center justify-center shrink-0 w-4 h-4 mt-0.5 ml-[0px]">
                    <div
                      className="size-3 rounded-full transition-transform group-hover:scale-125"
                      style={{
                        backgroundColor: dotColor,
                        boxShadow: hasGlow
                          ? `0 0 8px 2px ${dotColor}80, 0 0 16px 4px ${dotColor}40`
                          : `0 0 4px 1px ${dotColor}40`,
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className="size-3.5 shrink-0"
                        style={{ color: dotColor }}
                      />
                      <span className="text-sm text-slate-800 truncate">
                        {event.title}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {showSource && event.source && (
                      <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                        {event.source}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export type { TimelineEvent, EventTimelineProps }
