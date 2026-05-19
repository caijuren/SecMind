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

const TREND_COLORS: Record<string, string> = {
  visit: "#0891b2",
  signup: "#0e7490",
  trial_start: "#14b8a6",
  first_analysis: "#10b981",
  first_response: "#f59e0b",
  subscribe: "#f97316",
}

const MOCK_FUNNEL_DATA: FunnelData = {
  period: "30d",
  total_entered: 12580,
  stages: [
    { stage: "visit", label: "访问页面", count: 12580, conversion_rate: null, overall_rate: 100 },
    { stage: "signup", label: "注册账号", count: 3840, conversion_rate: 30.5, overall_rate: 30.5 },
    { stage: "trial_start", label: "开始试用", count: 2150, conversion_rate: 56.0, overall_rate: 17.1 },
    { stage: "first_analysis", label: "首次分析", count: 1420, conversion_rate: 66.0, overall_rate: 11.3 },
    { stage: "first_response", label: "首次响应", count: 890, conversion_rate: 62.7, overall_rate: 7.1 },
    { stage: "subscribe", label: "付费订阅", count: 340, conversion_rate: 38.2, overall_rate: 2.7 },
  ],
  is_mock: true,
}

const MOCK_DROPOFF_DATA: DropOffData = {
  period: "30d",
  drop_offs: [
    { from_stage: "visit", from_label: "访问页面", to_stage: "signup", to_label: "注册账号", drop_count: 8740, drop_rate: 69.5, is_max: true },
    { from_stage: "signup", from_label: "注册账号", to_stage: "trial_start", to_label: "开始试用", drop_count: 1690, drop_rate: 44.0, is_max: false },
    { from_stage: "trial_start", from_label: "开始试用", to_stage: "first_analysis", to_label: "首次分析", drop_count: 730, drop_rate: 34.0, is_max: false },
    { from_stage: "first_analysis", from_label: "首次分析", to_stage: "first_response", to_label: "首次响应", drop_count: 530, drop_rate: 37.3, is_max: false },
    { from_stage: "first_response", from_label: "首次响应", to_stage: "subscribe", to_label: "付费订阅", drop_count: 550, drop_rate: 61.8, is_max: false },
  ],
  max_drop_off: { from_stage: "visit", from_label: "访问页面", to_stage: "signup", to_label: "注册账号", drop_count: 8740, drop_rate: 69.5, is_max: true },
  is_mock: true,
}

const MOCK_TREND_DATA: TrendPoint[] = [
  { date: "W1", visit: 3100, signup: 980, trial_start: 540, first_analysis: 350, first_response: 220, subscribe: 85 },
  { date: "W2", visit: 2900, signup: 920, trial_start: 510, first_analysis: 330, first_response: 210, subscribe: 80 },
  { date: "W3", visit: 3300, signup: 1050, trial_start: 580, first_analysis: 380, first_response: 240, subscribe: 90 },
  { date: "W4", visit: 3280, signup: 890, trial_start: 520, first_analysis: 360, first_response: 220, subscribe: 85 },
  { date: "W5", visit: 3500, signup: 1100, trial_start: 620, first_analysis: 400, first_response: 260, subscribe: 95 },
  { date: "W6", visit: 3200, signup: 960, trial_start: 550, first_analysis: 370, first_response: 230, subscribe: 88 },
  { date: "W7", visit: 3400, signup: 1020, trial_start: 590, first_analysis: 390, first_response: 250, subscribe: 92 },
  { date: "W8", visit: 3600, signup: 1150, trial_start: 640, first_analysis: 420, first_response: 270, subscribe: 100 },
  { date: "W9", visit: 3100, signup: 940, trial_start: 530, first_analysis: 345, first_response: 215, subscribe: 82 },
  { date: "W10", visit: 3700, signup: 1180, trial_start: 660, first_analysis: 440, first_response: 280, subscribe: 105 },
  { date: "W11", visit: 3250, signup: 1000, trial_start: 560, first_analysis: 375, first_response: 235, subscribe: 89 },
  { date: "W12", visit: 3450, signup: 1080, trial_start: 600, first_analysis: 405, first_response: 255, subscribe: 96 },
  { date: "W13", visit: 3550, signup: 1120, trial_start: 630, first_analysis: 415, first_response: 265, subscribe: 98 },
]

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
      setFunnelData(funnelRes.data || MOCK_FUNNEL_DATA)
      setDropOffData(dropoffRes.data || MOCK_DROPOFF_DATA)
      setTrendData(trendRes.data || MOCK_TREND_DATA)
    } catch {
      setFunnelData(MOCK_FUNNEL_DATA)
      setDropOffData(MOCK_DROPOFF_DATA)
      setTrendData(MOCK_TREND_DATA)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    Promise.resolve().then(() => { void loadData() })
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
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
            <p className={cn(TYPOGRAPHY.caption, "text-zinc-400")}>
              用户从访问到付费订阅的全链路转化分析
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {funnelData.is_mock && (
            <Badge variant="outline" className="border-white/[0.06] bg-white/[0.04] text-zinc-400">
              演示数据
            </Badge>
          )}
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p ? "bg-[#131316] text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
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
                <h3 className={cn(TYPOGRAPHY.h3, "text-zinc-100")}>漏斗概览</h3>
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
                          <span className={cn(TYPOGRAPHY.body, "font-medium text-zinc-100")}>
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
                          <span className={cn(TYPOGRAPHY.caption, "text-zinc-400")}>
                            总转化 {formatPercent(stage.overall_rate)}
                          </span>
                          <span className={cn(TYPOGRAPHY.h3, "font-bold font-mono text-zinc-100 min-w-[60px] text-right")}>
                            {formatNumber(stage.count)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-8 rounded-lg bg-white/[0.04] overflow-hidden relative">
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
                <h3 className={cn(TYPOGRAPHY.h3, "text-zinc-100")}>关键指标</h3>
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
                        <p className={cn(TYPOGRAPHY.caption, "text-zinc-400 mb-1")}>整体转化率</p>
                        <p className={cn(TYPOGRAPHY.h1, "font-bold text-cyan-700")}>
                          {overallRate}%
                        </p>
                        <p className={cn(TYPOGRAPHY.micro, "text-slate-400 mt-1")}>
                          {firstStage.label} → {lastStage.label}
                        </p>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={cn(TYPOGRAPHY.caption, "text-zinc-400 mb-1")}>最大流失点</p>
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
                          <p className={cn(TYPOGRAPHY.body, "text-zinc-400")}>暂无数据</p>
                        )}
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={cn(TYPOGRAPHY.caption, "text-zinc-400 mb-1")}>付费用户数</p>
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
                <h3 className={cn(TYPOGRAPHY.h3, "text-zinc-100")}>流失详情</h3>
              </div>
              <div className="space-y-3">
                {dropOffData?.drop_offs.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border",
                      item.is_max
                        ? "border-red-200 bg-red-50/50"
                        : "border-white/[0.06] bg-white/[0.04]/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(TYPOGRAPHY.caption, "font-medium text-zinc-200")}>
                        {item.from_label} → {item.to_label}
                      </span>
                      {item.is_max && (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px] px-1.5 py-0">
                          最大流失
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.micro, "text-zinc-400")}>
                        流失 {formatNumber(item.drop_count)} 人
                      </span>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="size-3 text-red-500" />
                        <span className={cn(TYPOGRAPHY.caption, "font-mono font-medium", item.is_max ? "text-red-600" : "text-slate-600")}>
                          {formatPercent(item.drop_rate)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.04] mt-2 overflow-hidden">
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
            <h3 className={cn(TYPOGRAPHY.h3, "text-zinc-100")}>转化趋势</h3>
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
                      <span className={cn(TYPOGRAPHY.micro, "text-zinc-400")}>{label}</span>
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
                  <thead className="bg-white/[0.04]">
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-3 py-2 text-left text-zinc-400 text-xs">日期</th>
                      {Object.entries(TREND_COLORS).map(([stage]) => {
                        const label = { visit: "访问", signup: "注册", trial_start: "试用", first_analysis: "分析", first_response: "处置", subscribe: "付费" }[stage]
                        return (
                          <th key={stage} className="px-3 py-2 text-right text-zinc-400 text-xs">{label}</th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((point, i) => (
                      <tr key={i} className="border-b border-white/[0.06] last:border-b-0">
                        <td className="px-3 py-2.5 text-zinc-200 font-medium text-xs">{point.date}</td>
                        {Object.entries(TREND_COLORS).map(([stage]) => (
                          <td key={stage} className="px-3 py-2.5 text-right font-mono text-zinc-100 text-xs">
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
