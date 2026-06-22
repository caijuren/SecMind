"use client"

import { useState, memo } from "react"
import dynamic from "next/dynamic"
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Table2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLocaleStore } from "@/store/locale-store"
import { CARD, TYPOGRAPHY } from "@/lib/design-system"

const AttackMap = dynamic(() => import("./AttackMap").then((m) => m.AttackMap), {
  ssr: false,
  loading: () => <div className="h-[340px] rounded-lg bg-muted/20 animate-pulse" />,
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

interface DashboardAttackMapProps {
  attacks: AttackPoint[]
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

export const DashboardAttackMap = memo(function DashboardAttackMap({
  attacks,
}: DashboardAttackMapProps) {
  const { t } = useLocaleStore()
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<MapView>("globe")

  const sourceCount = attacks.filter((a) => a.type === "source").length
  const targetCount = attacks.filter((a) => a.type === "target").length

  return (
    <Card className={cn(CARD.elevated)}>
      {/* 标题栏 */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
            <Globe className="size-3.5 text-primary" />
          </div>
          <h2 className={cn(TYPOGRAPHY.h2)}>{t("dashboard.globalAttackLandscape")}</h2>
          <div className="flex items-center gap-3 ml-4">
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
        <div className="flex items-center gap-2">
          {expanded && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50 mr-2" onClick={(e) => e.stopPropagation()}>
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
          )}
          <Badge variant="outline" className="text-[10px] font-semibold border-primary/25 text-primary bg-primary/5">
            {expanded ? t("dashboard.collapse") : t("dashboard.expand")}
          </Badge>
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* 内容区 */}
      {expanded && (
        <CardContent className="p-4 pt-0">
          {view === "globe" ? (
            <div className="h-[380px]">
              <AttackMap attacks={attacks} />
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.location")}</th>
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.type")}</th>
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.severity")}</th>
                    <th className={cn(TYPOGRAPHY.micro, "text-muted-foreground py-2 px-2 text-left")}>{t("dashboard.coordinates")}</th>
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
                      <td className="py-2 px-2">
                        <span className={cn(TYPOGRAPHY.micro, "font-mono text-muted-foreground")}>
                          {point.lat.toFixed(2)}, {point.lng.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
})