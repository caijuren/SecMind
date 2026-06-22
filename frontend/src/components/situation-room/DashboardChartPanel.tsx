"use client"

import { useState, memo } from "react"
import dynamic from "next/dynamic"
import {
  TrendingUp,
  ShieldAlert,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { useLocaleStore } from "@/store/locale-store"
import { CARD } from "@/lib/design-system"

const AlertTrendChart = dynamic(() => import("./alert-trend-chart").then((m) => m.AlertTrendChart), {
  ssr: false,
  loading: () => <div className="h-[180px] rounded-lg bg-muted/20 animate-pulse" />,
})
const AttackTypeChart = dynamic(() => import("./attack-type-chart").then((m) => m.AttackTypeChart), {
  ssr: false,
  loading: () => <div className="h-[180px] rounded-lg bg-muted/20 animate-pulse" />,
})
const MitreMatrix = dynamic(() => import("./mitre-matrix").then((m) => m.MitreMatrix), {
  ssr: false,
  loading: () => <div className="h-[180px] rounded-lg bg-muted/20 animate-pulse" />,
})

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

interface MitreTechnique {
  id: string
  name: string
  tactic: string
  hasAlert: boolean
  alertCount?: number
}

interface DashboardChartPanelProps {
  trendData: TrendDataPoint[]
  attackTypes: AttackTypeData[]
  mitreTechniques: MitreTechnique[]
}

type ChartTab = "trend" | "attack" | "mitre"

const tabs: { id: ChartTab; labelKey: string; icon: React.ElementType }[] = [
  { id: "trend", labelKey: "dashboard.alertTrend24h", icon: TrendingUp },
  { id: "attack", labelKey: "dashboard.attackTypes", icon: Target },
  { id: "mitre", labelKey: "dashboard.mitre", icon: ShieldAlert },
]

export const DashboardChartPanel = memo(function DashboardChartPanel({
  trendData,
  attackTypes,
  mitreTechniques,
}: DashboardChartPanelProps) {
  const { t } = useLocaleStore()
  const [activeTab, setActiveTab] = useState<ChartTab>("trend")

  return (
    <Card className={cn(CARD.elevated, "h-full")}>
      <CardContent className="p-4 h-full flex flex-col">
        {/* Tab 导航 */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50 mb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors duration-200",
                  active
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3" />
                {t(tab.labelKey)}
              </button>
            )
          })}
        </div>

        {/* 图表内容 */}
        <div className="flex-1 min-h-[280px] flex items-center justify-center">
          {activeTab === "trend" && <AlertTrendChart data={trendData} />}
          {activeTab === "attack" && <AttackTypeChart data={attackTypes} />}
          {activeTab === "mitre" && <MitreMatrix techniques={mitreTechniques} />}
        </div>
      </CardContent>
    </Card>
  )
})