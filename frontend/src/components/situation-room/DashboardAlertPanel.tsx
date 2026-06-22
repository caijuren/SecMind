"use client"

import { memo } from "react"
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocaleStore } from "@/store/locale-store"
import { CARD, TYPOGRAPHY } from "@/lib/design-system"

// ==================== 类型 ====================

interface AlertSeverityData {
  critical: number
  high: number
  medium: number
  low: number
}

interface DataSourceStat {
  name: string
  count: number
  online: boolean
}

interface DashboardAlertPanelProps {
  severityData: AlertSeverityData
  dataSources: DataSourceStat[]
  totalAlerts: number
  isConnected: boolean
  newAlertCount: number
  onClearNewAlerts: () => void
}

// ==================== Severity 环形图 ====================

const SEVERITY_CONFIG = [
  { key: "critical" as const, label: "严重", color: "#ff2d55" },
  { key: "high" as const, label: "高危", color: "#ff9500" },
  { key: "medium" as const, label: "中危", color: "#fbbf24" },
  { key: "low" as const, label: "低危", color: "#00d4ff" },
]

function SeverityRing({ data, total }: { data: AlertSeverityData; total: number }) {
  const { t } = useLocaleStore()
  const cx = 90
  const cy = 90
  const outerR = 78
  const innerR = 52
  const gap = 2 // 间隔角度

  const totalVal = data.critical + data.high + data.medium + data.low
  const totalAngle = 360 - gap * 4

  const slices = SEVERITY_CONFIG.map((cfg, i) => {
    const val = data[cfg.key]
    const pct = totalVal > 0 ? val / totalVal : 0
    const angle = pct * totalAngle
    const startAngle = SEVERITY_CONFIG.slice(0, i).reduce((acc, c) => acc + (totalVal > 0 ? data[c.key] / totalVal : 0) * totalAngle + gap, 0)

    const startRad = ((startAngle - 90) * Math.PI) / 180
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180

    const x1O = cx + outerR * Math.cos(startRad)
    const y1O = cy + outerR * Math.sin(startRad)
    const x2O = cx + outerR * Math.cos(endRad)
    const y2O = cy + outerR * Math.sin(endRad)
    const x1I = cx + innerR * Math.cos(endRad)
    const y1I = cy + innerR * Math.sin(endRad)
    const x2I = cx + innerR * Math.cos(startRad)
    const y2I = cy + innerR * Math.sin(startRad)

    const largeArc = pct > 0.5 ? 1 : 0

    return {
      path: `M ${x1O} ${y1O} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2O} ${y2O} L ${x1I} ${y1I} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2I} ${y2I} Z`,
      color: cfg.color,
      label: cfg.label,
      count: val,
      pct: (pct * 100).toFixed(1),
    }
  })

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 180 180" className="w-[152px] h-[152px] shrink-0">
        <defs>
          <filter id="ringSliceGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 背景环 — 更精致的轨 */}
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="var(--border)" strokeWidth={outerR - innerR} opacity={0.15} />
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="var(--border)" strokeWidth={outerR - innerR} opacity={0.08} strokeDasharray="2 3" />

        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            opacity={0.88}
            style={{
              filter: `drop-shadow(0 0 8px ${slice.color}30)`,
              transition: "opacity 0.3s, filter 0.3s",
            }}
            className="hover:opacity-100 hover:brightness-110 cursor-pointer"
          />
        ))}

        {/* 中心区域 — 玻璃质感 */}
        <circle cx={cx} cy={cy} r={innerR - 4} fill="var(--background)" opacity={0.9} />
        <circle cx={cx} cy={cy} r={innerR - 4} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity={0.3} />

        <text x={cx} y={cy - 7} textAnchor="middle" fill="var(--foreground)" fontSize="26" fontWeight="bold" fontFamily="var(--font-space-grotesk), monospace">
          {total}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9" letterSpacing="0.5">
          {t("dashboard.todayAlerts")}
        </text>
      </svg>

      {/* 图例 — 更紧凑的布局 */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.map((slice) => (
          <div key={slice.label} className="group/legend flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/20 transition-colors cursor-pointer">
            <span
              className="shrink-0 w-2.5 h-2.5 rounded-sm transition-transform duration-200 group-hover/legend:scale-110"
              style={{
                backgroundColor: slice.color,
                boxShadow: `0 0 6px ${slice.color}40`,
              }}
            />
            <span className="text-[11px] text-muted-foreground flex-1">{slice.label}</span>
            <span className="text-[13px] font-bold tabular-nums font-[family-name:var(--font-space-grotesk)] transition-colors group-hover/legend:text-foreground" style={{ color: slice.color }}>{slice.count}</span>
            <span className="text-[10px] text-muted-foreground/50 tabular-nums w-10 text-right">{slice.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== 数据源分布条 ====================

function DataSourceBar({ sources }: { sources: DataSourceStat[] }) {
  const maxCount = Math.max(...sources.map((s) => s.count), 1)

  return (
    <div className="space-y-2">
      {sources.map((src) => (
        <div key={src.name} className="flex items-center gap-2.5 group/src">
          <span className="text-[10px] font-semibold text-muted-foreground w-14 shrink-0 truncate tracking-wide">{src.name}</span>
          <div className="flex-1 h-5 rounded-md bg-muted/30 overflow-hidden relative ring-1 ring-border/20">
            <div
              className="h-full rounded-md transition-colors duration-700 ease-out"
              style={{
                width: `${(src.count / maxCount) * 100}%`,
                background: src.online
                  ? "linear-gradient(90deg, rgba(0,212,255,0.5) 0%, rgba(0,212,255,0.25) 100%)"
                  : "linear-gradient(90deg, rgba(255,45,85,0.5) 0%, rgba(255,45,85,0.25) 100%)",
                boxShadow: src.online
                  ? "inset 0 1px 0 rgba(0,212,255,0.2), 0 0 8px rgba(0,212,255,0.1)"
                  : "inset 0 1px 0 rgba(255,45,85,0.2), 0 0 8px rgba(255,45,85,0.1)",
              }}
            />
          </div>
          <span
            className="text-[11px] font-bold tabular-nums w-8 text-right font-[family-name:var(--font-space-grotesk)]"
            style={{ color: src.online ? "#00d4ff" : "#ff2d55" }}
          >
            {src.count}
          </span>
          <span className={cn(
            "size-1.5 rounded-full shrink-0",
            src.online
              ? "bg-[#00ff88] shadow-sm"
              : "bg-[#ff2d55] shadow-sm animate-pulse"
          )} />
        </div>
      ))}
    </div>
  )
}

// ==================== 告警热力条（24h） ====================

function AlertHeatBar({ severityData }: { severityData: AlertSeverityData }) {
  // 生成24小时热力数据（基于severity分布模拟）
  const hours = Array.from({ length: 24 }, (_, i) => {
    const workFactor = (i >= 8 && i <= 18) ? 1.5 : 0.6
    const critical = Math.round(severityData.critical / 24 * workFactor * (0.7 + Math.random() * 0.6))
    const high = Math.round(severityData.high / 24 * workFactor * (0.7 + Math.random() * 0.6))
    const medium = Math.round(severityData.medium / 24 * workFactor * (0.7 + Math.random() * 0.6))
    const low = Math.round(severityData.low / 24 * workFactor * (0.7 + Math.random() * 0.6))
    return { hour: i, critical, high, medium, low, total: critical + high + medium + low }
  })

  const maxTotal = Math.max(...hours.map((h) => h.total), 1)

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px] h-14 px-1">
        {hours.map((h) => {
          const heightPct = (h.total / maxTotal) * 100
          const criticalRatio = h.total > 0 ? h.critical / h.total : 0
          const barColor = criticalRatio > 0.4
            ? "#ff2d55"
            : criticalRatio > 0.2
              ? "#ff9500"
              : "#00d4ff"
          return (
            <div
              key={h.hour}
              className="group/bar relative flex-1 flex flex-col justify-end"
            >
              <div
                className="w-full rounded-[2px] transition-colors duration-200 ease-out hover:scale-y-110 hover:origin-bottom cursor-pointer"
                style={{
                  height: `${Math.max(heightPct, 3)}%`,
                  background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}88 100%)`,
                  boxShadow: `0 0 6px ${barColor}30`,
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-foreground text-background shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {String(h.hour).padStart(2, "0")}:00 · {h.total}
              </div>
            </div>
          )
        })}
      </div>
      {/* 时间轴标签 */}
      <div className="flex justify-between text-[8px] text-muted-foreground/70 font-mono tracking-wider px-1">
        <span>00:00</span>
        <span>04:00</span>
        <span>08:00</span>
        <span>12:00</span>
        <span>16:00</span>
        <span>20:00</span>
        <span>23:00</span>
      </div>
    </div>
  )
}

// ==================== 主组件 ====================

export const DashboardAlertPanel = memo(function DashboardAlertPanel({
  severityData,
  dataSources,
  totalAlerts,
  isConnected,
  newAlertCount,
  onClearNewAlerts,
}: DashboardAlertPanelProps) {
  const { t } = useLocaleStore()

  return (
    <div className="space-y-3">
      {/* 告警态势总览：Severity 环形图 */}
      <Card className={cn(CARD.elevated)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff2d55]/10 ring-1 ring-[#ff2d55]/15">
                <AlertTriangle className="size-3.5 text-[#ff2d55]" />
              </div>
              <h2 className={cn(TYPOGRAPHY.h2)}>告警态势总览</h2>
              {newAlertCount > 0 && (
                <button
                  onClick={onClearNewAlerts}
                  className="px-2 py-0.5 rounded-full bg-[#ff2d55]/10 text-[#ff2d55] text-[10px] font-semibold animate-pulse cursor-pointer hover:bg-[#ff2d55]/20 transition-colors"
                >
                  +{newAlertCount} {t("dashboard.newLabel")}
                </button>
              )}
            </div>
            <Link href="/signals">
              <Button variant="ghost" size="sm" className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}>
                {t("dashboard.allAlerts")}
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
          <SeverityRing data={severityData} total={totalAlerts} />
        </CardContent>
      </Card>

      {/* 告警热力条（24h） */}
      <Card className={cn(CARD.elevated)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
                </span>
                <span className="text-[9px] font-medium text-[#00ff88]/80 tracking-wider font-[family-name:var(--font-space-grotesk)]">实时</span>
              </div>
              <h2 className={cn(TYPOGRAPHY.h2)}>24h 告警热力</h2>
              {isConnected ? (
                <Wifi className="size-3 text-[#00ff88]" />
              ) : (
                <WifiOff className="size-3 text-muted-foreground/60" />
              )}
            </div>
          </div>
          <AlertHeatBar severityData={severityData} />
        </CardContent>
      </Card>

      {/* 数据源告警分布 */}
      <Card className={cn(CARD.elevated)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#00d4ff]/10 ring-1 ring-[#00d4ff]/15">
              <AlertTriangle className="size-3.5 text-[#00d4ff]" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h2)}>数据源告警分布</h2>
          </div>
          <DataSourceBar sources={dataSources} />
        </CardContent>
      </Card>
    </div>
  )
})
