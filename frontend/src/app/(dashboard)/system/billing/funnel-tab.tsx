"use client"

import { useEffect, useState, useCallback } from "react"
import {
  FunnelIcon,
  TrendingUp,
  TrendingDown,
  ArrowDown,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { CARD, TYPOGRAPHY, RADIUS, formatNumber, formatPercent } from "@/lib/design-system"
import { softCardClass } from "@/lib/admin-ui"

interface FunnelStage {
  stage: string
  label: string
  count: number
  conversion_rate: number | null
  overall_rate: number
}

interface FunnelData {
  period: string
  total_entered: number
  stages: FunnelStage[]
  is_mock: boolean
}

interface DropOffItem {
  from_stage: string
  from_label: string
  to_stage: string
  to_label: string
  drop_count: number
  drop_rate: number
  is_max: boolean
}

interface DropOffData {
  period: string
  drop_offs: DropOffItem[]
  max_drop_off: DropOffItem | null
  is_mock: boolean
}

interface TrendPoint {
  date: string
  [key: string]: string | number
}

const STAGE_COLORS = [
  "bg-cyan-500",
  "bg-cyan-600",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-orange-500",
]

const STAGE_BG = [
  "bg-cyan-50",
  "bg-cyan-50",
  "bg-teal-50",
  "bg-emerald-50",
  "bg-amber-50",
  "bg-orange-50",
]

const STAGE_BORDER = [
  "border-cyan-200",
  "border-cyan-200",
  "border-teal-200",
  "border-emerald-200",
  "border-amber-200",
  "border-orange-200",
]

const STAGE_TEXT = [
  "text-cyan-700",
  "text-cyan-700",
  "text-teal-700",
  "text-emerald-700",
  "text-amber-700",
  "text-orange-700",
]

const TREND_COLORS: Record<string, string> = {
  visit: "#0891b2",
  signup: "#0e7490",
  trial_start: "#14b8a6",
  first_analysis: "#10b981",
  first_response: "#f59e0b",
  subscribe: "#f97316",
}

export function FunnelTab() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [dropOffData, setDropOffData] = useState<DropOffData | null>(null)
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [funnelRes, dropoffRes, trendRes] = await Promise.all([
        api.get("/funnel/data", { params: { period } }),
        api.get("/funnel/dropoff", { params: { period } }),
        api.get("/funnel/trend", { params: { period: "90d" } }),
      ])
      setFunnelData(funnelRes.data)
      setDropOffData(dropoffRes.data)
      setTrendData(trendRes.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    Promise.resolve().then(() => { void loadData() })
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        加载漏斗数据...
      </div>
    )
  }

  if (!funnelData) return null

  const maxCount = Math.max(...funnelData.stages.map((s) => s.count), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 ring-1 ring-cyan-200/50`}>
            <FunnelIcon className="size-5 text-cyan-700" />
          </div>
          <div>
            <h2 className={String(TYPOGRAPHY.h2)}>转化漏斗</h2>
            <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
              用户从访问到付费订阅的全链路转化分析
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {funnelData.is_mock && (
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
              演示数据
            </Badge>
          )}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {p === "7d" ? "7天" : p === "30d" ? "30天" : "90天"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <h3 className={cn(TYPOGRAPHY.h3, "text-slate-900")}>漏斗概览</h3>
                <span className={cn(TYPOGRAPHY.micro, "text-slate-400")}>
                  总进入 {formatNumber(funnelData.total_entered)} 人
                </span>
              </div>

              <div className="space-y-3">
                {funnelData.stages.map((stage, i) => {
                  const widthPercent = Math.max(8, (stage.count / maxCount) * 100)
                  return (
                    <div key={stage.stage} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-900")}>
                            {stage.label}
                          </span>
                          {i > 0 && stage.conversion_rate !== null && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                stage.conversion_rate >= 50
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : stage.conversion_rate >= 30
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                              )}
                            >
                              {formatPercent(stage.conversion_rate)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
                            总转化 {formatPercent(stage.overall_rate)}
                          </span>
                          <span className={cn(TYPOGRAPHY.h3, "font-bold font-mono text-slate-900 min-w-[60px] text-right")}>
                            {formatNumber(stage.count)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-8 rounded-lg bg-slate-50 overflow-hidden relative">
                        <div
                          className={cn(
                            "h-full rounded-lg transition-all duration-700 ease-out flex items-center",
                            STAGE_COLORS[i]
                          )}
                          style={{ width: `${widthPercent}%` }}
                        >
                          {widthPercent > 15 && (
                            <span className="pl-3 text-xs font-medium text-white/90">
                              {formatNumber(stage.count)}
                            </span>
                          )}
                        </div>
                      </div>
                      {i < funnelData.stages.length - 1 && (
                        <div className="flex items-center justify-center py-0.5">
                          <ArrowDown className="size-3.5 text-slate-300" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className={cn(TYPOGRAPHY.h3, "text-slate-900")}>关键指标</h3>
              </div>
              <div className="space-y-4">
                {(() => {
                  const firstStage = funnelData.stages[0]
                  const lastStage = funnelData.stages[funnelData.stages.length - 1]
                  const overallRate = firstStage.count > 0
                    ? ((lastStage.count / firstStage.count) * 100).toFixed(2)
                    : "0"
                  const maxDrop = dropOffData?.max_drop_off
                  return (
                    <>
                      <div className={`${softCardClass} p-4`}>
                        <p className={cn(TYPOGRAPHY.caption, "text-slate-500 mb-1")}>整体转化率</p>
                        <p className={cn(TYPOGRAPHY.h1, "font-bold text-cyan-700")}>
                          {overallRate}%
                        </p>
                        <p className={cn(TYPOGRAPHY.micro, "text-slate-400 mt-1")}>
                          {firstStage.label} → {lastStage.label}
                        </p>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={cn(TYPOGRAPHY.caption, "text-slate-500 mb-1")}>最大流失点</p>
                        {maxDrop ? (
                          <>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="size-4 text-red-500" />
                              <p className={cn(TYPOGRAPHY.h3, "font-bold text-red-600")}>
                                {maxDrop.from_label} → {maxDrop.to_label}
                              </p>
                            </div>
                            <p className={cn(TYPOGRAPHY.h2, "font-bold font-mono text-red-600 mt-1")}>
                              流失 {formatPercent(maxDrop.drop_rate)}
                            </p>
                            <p className={cn(TYPOGRAPHY.micro, "text-slate-400 mt-1")}>
                              流失 {formatNumber(maxDrop.drop_count)} 人
                            </p>
                          </>
                        ) : (
                          <p className={cn(TYPOGRAPHY.body, "text-slate-500")}>暂无数据</p>
                        )}
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={cn(TYPOGRAPHY.caption, "text-slate-500 mb-1")}>付费用户数</p>
                        <p className={cn(TYPOGRAPHY.h1, "font-bold text-emerald-700")}>
                          {formatNumber(lastStage.count)}
                        </p>
                        <p className={cn(TYPOGRAPHY.micro, "text-slate-400 mt-1")}>
                          占访问量 {overallRate}%
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className={cn(TYPOGRAPHY.h3, "text-slate-900")}>流失详情</h3>
              </div>
              <div className="space-y-3">
                {dropOffData?.drop_offs.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border",
                      item.is_max
                        ? "border-red-200 bg-red-50/50"
                        : "border-slate-100 bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(TYPOGRAPHY.caption, "font-medium text-slate-700")}>
                        {item.from_label} → {item.to_label}
                      </span>
                      {item.is_max && (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px] px-1.5 py-0">
                          最大流失
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.micro, "text-slate-500")}>
                        流失 {formatNumber(item.drop_count)} 人
                      </span>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="size-3 text-red-500" />
                        <span className={cn(TYPOGRAPHY.caption, "font-mono font-medium", item.is_max ? "text-red-600" : "text-slate-600")}>
                          {formatPercent(item.drop_rate)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.is_max ? "bg-red-400" : "bg-slate-300"
                        )}
                        style={{ width: `${Math.min(100, item.drop_rate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className={CARD.elevated}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="size-4 text-cyan-600" />
            <h3 className={cn(TYPOGRAPHY.h3, "text-slate-900")}>转化趋势</h3>
            <span className={cn(TYPOGRAPHY.micro, "text-slate-400")}>近90天按周统计</span>
          </div>

          {trendData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(TREND_COLORS).map(([stage, color]) => {
                  const label = { visit: "访问", signup: "注册", trial_start: "试用", first_analysis: "分析", first_response: "处置", subscribe: "付费" }[stage]
                  return (
                    <div key={stage} className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className={cn(TYPOGRAPHY.micro, "text-slate-500")}>{label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="relative">
                <svg
                  viewBox={`0 0 ${trendData.length * 120} 200`}
                  className="w-full h-48"
                  preserveAspectRatio="none"
                >
                  {(() => {
                    const allValues = trendData.flatMap((p) =>
                      Object.entries(TREND_COLORS).map(([stage]) => Number(p[stage]) || 0)
                    )
                    const maxVal = Math.max(...allValues, 1)
                    const xStep = 120
                    const chartH = 180
                    const padTop = 10

                    const gridLines = [0, 0.25, 0.5, 0.75, 1]
                    return (
                      <>
                        {gridLines.map((ratio) => (
                          <line
                            key={ratio}
                            x1={0}
                            y1={padTop + chartH * (1 - ratio)}
                            x2={trendData.length * xStep}
                            y2={padTop + chartH * (1 - ratio)}
                            stroke="#e4e4e7"
                            strokeWidth={0.5}
                            strokeDasharray="4,4"
                          />
                        ))}
                        {Object.entries(TREND_COLORS).map(([stage, color]) => {
                          const points = trendData
                            .map((p, i) => {
                              const val = Number(p[stage]) || 0
                              const x = i * xStep + xStep / 2
                              const y = padTop + chartH * (1 - val / maxVal)
                              return `${x},${y}`
                            })
                            .join(" ")
                          return (
                            <polyline
                              key={stage}
                              points={points}
                              fill="none"
                              stroke={color}
                              strokeWidth={2}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          )
                        })}
                        {trendData.map((p, i) => (
                          <text
                            key={i}
                            x={i * xStep + xStep / 2}
                            y={chartH + padTop + 15}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={10}
                          >
                            {p.date}
                          </text>
                        ))}
                      </>
                    )
                  })()}
                </svg>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-slate-500 text-xs">日期</th>
                      {Object.entries(TREND_COLORS).map(([stage]) => {
                        const label = { visit: "访问", signup: "注册", trial_start: "试用", first_analysis: "分析", first_response: "处置", subscribe: "付费" }[stage]
                        return (
                          <th key={stage} className="px-3 py-2 text-right text-slate-500 text-xs">{label}</th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((point, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2.5 text-slate-700 font-medium text-xs">{point.date}</td>
                        {Object.entries(TREND_COLORS).map(([stage]) => (
                          <td key={stage} className="px-3 py-2.5 text-right font-mono text-slate-900 text-xs">
                            {formatNumber(Number(point[stage]) || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
