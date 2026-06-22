"use client"

import { useState, memo } from "react"
import dynamic from "next/dynamic"
import {
  Globe,
  TrendingUp,
  Target,
  Table2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocaleStore } from "@/store/locale-store"
import { CARD, TYPOGRAPHY } from "@/lib/design-system"

const AttackMap = dynamic(() => import("./AttackMap").then((m) => m.AttackMap), {
  ssr: false,
  loading: () => <div className="h-[260px] rounded-lg bg-muted/20 animate-pulse" />,
})
const AlertTrendChart = dynamic(() => import("./alert-trend-chart").then((m) => m.AlertTrendChart), {
  ssr: false,
  loading: () => <div className="h-[160px] rounded-lg bg-muted/20 animate-pulse" />,
})
const AttackTypeChart = dynamic(() => import("./attack-type-chart").then((m) => m.AttackTypeChart), {
  ssr: false,
  loading: () => <div className="h-[160px] rounded-lg bg-muted/20 animate-pulse" />,
})

interface AttackPoint {
  id: string
  name: string
  lat: number
  lng: number
  severity: "critical" | "high" | "medium" | "low"
  type: "source" | "target"
  timestamp: number
}

interface TrendDataPoint {
  hour: string
  high: number
  medium: number
  low: number
}

interface AttackTypeData {
  type: string
  count: number
}

interface DashboardAttackPanelProps {
  attacks: AttackPoint[]
  trendData: TrendDataPoint[]
  attackTypes: AttackTypeData[]
}

type MapView = "globe" | "table"

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff2d55",
  high: "#ff9500",
  medium: "#fbbf24",
  low: "#00d4ff",
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: "severityCritical",
  high: "severityHigh",
  medium: "severityMedium",
  low: "riskLow",
}

export const DashboardAttackPanel = memo(function DashboardAttackPanel({
  attacks,
  trendData,
  attackTypes,
}: DashboardAttackPanelProps) {
  const { t } = useLocaleStore()
  const [view, setView] = useState<MapView>("globe")

  const sourceCount = attacks.filter((a) => a.type === "source").length
  const targetCount = attacks.filter((a) => a.type === "target").length

  return (
    <div className="space-y-3">
      {/* 攻击态势：地图 + 攻击类型 */}
      <Card className={cn(CARD.elevated)}>
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <Globe className="size-3.5 text-primary" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h2)}>{t("dashboard.globalAttackLandscape")}</h2>
            <div className="flex items-center gap-3 ml-3">
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d55]/80" />
                {t("dashboard.attackSources")} {sourceCount}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                {t("dashboard.targets")} {targetCount}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50">
            <button
              onClick={() => setView("globe")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                view === "globe"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="size-3" />
              {t("dashboard.mapView")}
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                view === "table"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="size-3" />
              {t("dashboard.tableView")}
            </button>
          </div>
        </div>

        <CardContent className="p-4">
          {view === "globe" ? (
            <div className="h-[260px]">
              <AttackMap attacks={attacks} />
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.location")}</th>
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.type")}</th>
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.severity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {attacks.map((point) => (
                    <tr key={point.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2">
                        <span className={cn(TYPOGRAPHY.caption, "text-foreground font-medium")}>{point.name}</span>
                      </td>
                      <td className="py-2 px-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            point.type === "source"
                              ? "border-[#ff2d55]/25 text-[#ff2d55] bg-[#ff2d55]/5"
                              : "border-primary/25 text-primary bg-primary/5"
                          )}
                        >
                          {point.type === "source" ? t("dashboard.attackSource") : t("dashboard.attackTarget")}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={cn(TYPOGRAPHY.micro, "font-semibold")}
                          style={{ color: SEVERITY_COLORS[point.severity] }}
                        >
                          {t(`dashboard.${SEVERITY_LABELS[point.severity]}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 攻击类型 TOP5 */}
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="size-3 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">{t("dashboard.attackTypes")}</span>
            </div>
            <AttackTypeChart data={attackTypes} />
          </div>
        </CardContent>
      </Card>

      {/* 告警趋势 24h — 独立展示 */}
      <Card className={cn(CARD.elevated)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <TrendingUp className="size-3.5 text-primary" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h2)}>{t("dashboard.alertTrend24h")}</h2>
          </div>
          <AlertTrendChart data={trendData} />
        </CardContent>
      </Card>
    </div>
  )
})
