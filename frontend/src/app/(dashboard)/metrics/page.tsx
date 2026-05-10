"use client"

import { useState } from "react"
import {
  Timer,
  Wrench,
  AlertTriangle,
  ShieldX,
  Bot,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"

const coreMetrics = [
  {
    label: "MTTD平均检测时间",
    value: "4.2",
    unit: "min",
    icon: Timer,
    color: "#06b6d4",
    trend: "down" as const,
    percent: "15.2%",
    prevValue: "4.9min",
  },
  {
    label: "MTTR平均响应时间",
    value: "18.7",
    unit: "min",
    icon: Wrench,
    color: "#a855f7",
    trend: "down" as const,
    percent: "8.6%",
    prevValue: "20.5min",
  },
  {
    label: "告警疲劳指数",
    value: "23",
    unit: "%",
    icon: AlertTriangle,
    color: "#f97316",
    trend: "down" as const,
    percent: "5.1%",
    prevValue: "28.1%",
  },
  {
    label: "误报率",
    value: "15.3",
    unit: "%",
    icon: ShieldX,
    color: "#ef4444",
    trend: "down" as const,
    percent: "3.2%",
    prevValue: "18.5%",
  },
  {
    label: "自动处置率",
    value: "68.5",
    unit: "%",
    icon: Bot,
    color: "#22c55e",
    trend: "up" as const,
    percent: "12.4%",
    prevValue: "56.1%",
  },
  {
    label: "知识命中率",
    value: "96.8",
    unit: "%",
    icon: Target,
    color: "#3b82f6",
    trend: "up" as const,
    percent: "2.1%",
    prevValue: "94.7%",
  },
]

const mttdTrendData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  value: +(3.5 + Math.random() * 2.5).toFixed(1),
}))

const mttrTrendData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  value: +(15 + Math.random() * 10).toFixed(1),
}))

const alertSources = [
  { name: "SIEM", count: 3420, color: "#06b6d4" },
  { name: "EDR", count: 2815, color: "#a855f7" },
  { name: "防火墙", count: 2103, color: "#3b82f6" },
  { name: "邮件网关", count: 1567, color: "#f97316" },
  { name: "IAM", count: 892, color: "#22c55e" },
  { name: "威胁情报", count: 634, color: "#ef4444" },
]

const alertCategories = [
  { type: "恶意软件", percent: 32, color: "#ef4444" },
  { type: "凭证攻击", percent: 24, color: "#f97316" },
  { type: "钓鱼攻击", percent: 19, color: "#eab308" },
  { type: "横向移动", percent: 15, color: "#a855f7" },
  { type: "数据外泄", percent: 10, color: "#06b6d4" },
]

const analysts = [
  { name: "张明远", cases: 147, avgTime: "12.3min", accuracy: "97.2%", avatar: "张" },
  { name: "李思涵", cases: 132, avgTime: "14.8min", accuracy: "95.6%", avatar: "李" },
  { name: "王建国", cases: 128, avgTime: "16.1min", accuracy: "93.8%", avatar: "王" },
  { name: "陈雨晴", cases: 119, avgTime: "13.5min", accuracy: "96.4%", avatar: "陈" },
  { name: "刘浩然", cases: 108, avgTime: "15.7min", accuracy: "94.1%", avatar: "刘" },
]

function MetricCard({ item }: { item: typeof coreMetrics[number] }) {
  const Icon = item.icon
  const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown
  const isGood = (item.trend === "up" && (item.label === "自动处置率" || item.label === "知识命中率")) ||
    (item.trend === "down" && (item.label === "MTTD平均检测时间" || item.label === "MTTR平均响应时间" || item.label === "告警疲劳指数" || item.label === "误报率"))

  return (
    <Card
      className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
      style={{ boxShadow: `0 0 20px ${item.color}08` }}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40">{item.label}</span>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`,
              border: `1px solid ${item.color}30`,
            }}
          >
            <Icon className="size-4" style={{ color: item.color }} />
          </div>
        </div>
        <div className="flex items-end gap-1 mb-2">
          <span className="text-3xl font-bold text-white font-mono">{item.value}</span>
          <span className="text-sm text-white/40 mb-1">{item.unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/25">上期 {item.prevValue}</span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              isGood ? "text-[#22c55e]" : "text-[#ef4444]"
            )}
          >
            <TrendIcon className="size-3" />
            {item.percent}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function BarChart({ data, color, label, unit }: { data: typeof mttdTrendData; color: string; label: string; unit: string }) {
  const maxVal = Math.max(...data.map((d) => d.value))
  const minVal = Math.min(...data.map((d) => d.value))

  return (
    <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4" style={{ color }} />
            <span className="text-sm font-medium text-white/80">{label}</span>
          </div>
          <span className="text-xs text-white/30">近30天</span>
        </div>
        <div className="flex items-end gap-[3px] h-32">
          {data.map((item) => {
            const height = ((item.value - minVal + 0.5) / (maxVal - minVal + 1)) * 100
            return (
              <div key={item.day} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(height, 8)}%`,
                    background: `linear-gradient(to top, ${color}40, ${color}10)`,
                    borderTop: `1.5px solid ${color}80`,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-white/25">1日</span>
          <span className="text-[10px] text-white/25">15日</span>
          <span className="text-[10px] text-white/25">30日</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">最低 <span className="text-white/60 font-mono">{minVal}{unit}</span></span>
            <span className="text-[10px] text-white/30">最高 <span className="text-white/60 font-mono">{maxVal}{unit}</span></span>
          </div>
          <span className="text-[10px] text-white/30">均值 <span className="text-white/60 font-mono">{(data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1)}{unit}</span></span>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertSourceDistribution() {
  const maxCount = Math.max(...alertSources.map((s) => s.count))

  return (
    <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-400" />
            <span className="text-sm font-medium text-white/80">告警来源分布</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-white/30 border-white/10">
            6个来源
          </Badge>
        </div>
        <div className="space-y-3">
          {alertSources.map((source) => (
            <div key={source.name} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-16 shrink-0">{source.name}</span>
              <div className="flex-1 h-5 rounded bg-white/[0.04] overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${(source.count / maxCount) * 100}%`,
                    background: `linear-gradient(90deg, ${source.color}50, ${source.color}20)`,
                    borderRight: `2px solid ${source.color}80`,
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/50">
                  {source.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AlertCategoryStats() {
  return (
    <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldX className="size-4 text-cyan-400" />
            <span className="text-sm font-medium text-white/80">告警分类统计</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-white/30 border-white/10">
            5种类型
          </Badge>
        </div>
        <div className="space-y-3">
          {alertCategories.map((cat) => (
            <div key={cat.type} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-16 shrink-0">{cat.type}</span>
              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cat.percent}%`,
                    backgroundColor: cat.color,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-white/40 w-10 text-right">{cat.percent}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-4">
            {alertCategories.map((cat) => (
              <div key={cat.type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] text-white/30">{cat.type}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalystCard({ analyst }: { analyst: typeof analysts[number] }) {
  const accuracyNum = parseFloat(analyst.accuracy)
  const accuracyColor = accuracyNum >= 96 ? "#22c55e" : accuracyNum >= 94 ? "#eab308" : "#f97316"

  return (
    <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium"
            style={{
              background: "linear-gradient(135deg, #06b6d420, #06b6d408)",
              border: "1px solid #06b6d430",
              color: "#06b6d4",
            }}
          >
            {analyst.avatar}
          </div>
          <div>
            <span className="text-sm font-medium text-white/80">{analyst.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="size-3" style={{ color: accuracyColor }} />
              <span className="text-[10px] font-mono" style={{ color: accuracyColor }}>{analyst.accuracy}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-white/[0.02] border border-white/[0.04] p-2">
            <div className="flex items-center gap-1 mb-1">
              <Users className="size-3 text-white/30" />
              <span className="text-[10px] text-white/30">处理案件</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{analyst.cases}</span>
          </div>
          <div className="rounded-md bg-white/[0.02] border border-white/[0.04] p-2">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="size-3 text-white/30" />
              <span className="text-[10px] text-white/30">平均响应</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{analyst.avgTime.replace("min", "")}<span className="text-xs text-white/30">min</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MetricsPage() {
  const { t } = useLocaleStore()
  const [timeRange, setTimeRange] = useState("week")

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="运营指标"
        subtitle="SOC运营效率与质量度量看板"
        actions={
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v ?? "week")}>
              <SelectTrigger size="sm" className="w-28 border-white/10 bg-white/[0.04] text-white/50">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季度</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {coreMetrics.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BarChart data={mttdTrendData} color="#06b6d4" label="MTTD趋势（30天）" unit="min" />
        <BarChart data={mttrTrendData} color="#a855f7" label="MTTR趋势（30天）" unit="min" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AlertSourceDistribution />
        <AlertCategoryStats />
      </div>

      <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/80">团队绩效</span>
            </div>
            <Badge variant="outline" className="text-[10px] text-white/30 border-white/10">
              5名分析师
            </Badge>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {analysts.map((analyst) => (
              <AnalystCard key={analyst.name} analyst={analyst} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
