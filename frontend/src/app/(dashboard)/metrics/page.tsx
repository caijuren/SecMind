"use client"

import { useState } from "react"
import {
  Timer,
  Wrench,
  AlertTriangle,
  ShieldX,
  Bot,
  Target,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  ArrowRight,
  Lightbulb,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  Zap,
  ShieldCheck,
  Gauge,
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
import { PermissionGate } from "@/components/auth/PermissionGate"
import { useLocaleStore } from "@/store/locale-store"
import { inputClass } from "@/lib/admin-ui"
import {
  CARD,
  RADIUS,
} from "@/lib/design-system"

// ==================== 数据定义 ====================

const summaryStats = [
  { id: 'total-cases', label: '本月处理告警', value: 1234, icon: Zap, color: '#3b82f6', trend: '+18.2%' },
  { id: 'resolution-rate', label: '处置完成率', value: '94.7%', icon: ShieldCheck, color: '#16a34a', trend: '+2.3%' },
  { id: 'avg-score', label: '分析准确率', value: '96.8%', icon: Gauge, color: '#8b5cf6', trend: '+1.5%' },
  { id: 'sla-compliance', label: 'SLA达标率', value: '98.2%', icon: CheckCircle2, color: '#0891b2', trend: '+0.8%' },
]

const efficiencyMetrics = [
  {
    id: 'mttd',
    label: 'MTTD 平均检测时间',
    value: 4.2,
    unit: 'min',
    icon: Timer,
    color: '#0891b2',
    trend: { direction: 'down' as const, value: '-15.2%', isGood: true },
    target: 5.0,
    achievement: 119,
    description: '从告警产生到首次检测的平均时间',
  },
  {
    id: 'mttr',
    label: 'MTTR 平均响应时间',
    value: 18.7,
    unit: 'min',
    icon: Wrench,
    color: '#8b5cf6',
    trend: { direction: 'down' as const, value: '-8.6%', isGood: true },
    target: 20.0,
    achievement: 107,
    description: '从确认到处置完成的平均时间',
  },
  {
    id: 'alert-fatigue',
    label: '告警疲劳指数',
    value: 23,
    unit: '%',
    icon: AlertTriangle,
    color: '#ea580c',
    trend: { direction: 'down' as const, value: '-5.1%', isGood: true },
    target: 30,
    achievement: 130,
    description: '无效告警占比（越低越好）',
  },
  {
    id: 'false-positive',
    label: '误报率',
    value: 15.3,
    unit: '%',
    icon: ShieldX,
    color: '#dc2626',
    trend: { direction: 'down' as const, value: '-3.2%', isGood: true },
    target: 20,
    achievement: 131,
    description: '误报占所有告警的比例（越低越好）',
  },
  {
    id: 'auto-remediation',
    label: '自动处置率',
    value: 68.5,
    unit: '%',
    icon: Bot,
    color: '#16a34a',
    trend: { direction: 'up' as const, value: '+12.4%', isGood: true },
    target: 60,
    achievement: 114,
    description: 'AI自动处置的告警比例（越高越好）',
  },
  {
    id: 'knowledge-hit',
    label: '知识库命中率',
    value: 96.8,
    unit: '%',
    icon: Target,
    color: '#2563eb',
    trend: { direction: 'up' as const, value: '+2.1%', isGood: true },
    target: 95,
    achievement: 102,
    description: 'AI匹配到已知攻击模式的比率',
  },
]

const industryBenchmark = [
  { metric: 'MTTD', current: 4.2, industry: 8.5, unit: 'min', better: 'lower', improvement: '50.6%' },
  { metric: 'MTTR', current: 18.7, industry: 35.0, unit: 'min', better: 'lower', improvement: '46.6%' },
  { metric: '误报率', current: 15.3, industry: 25.0, unit: '%', better: 'lower', improvement: '38.8%' },
  { metric: '自动处置率', current: 68.5, industry: 45.0, unit: '%', better: 'higher', improvement: '52.2%' },
]

const improvementSuggestions = [
  {
    id: 'suggestion-1',
    priority: 'high' as const,
    category: '检测能力',
    title: 'EDR规则优化可降低MTTD至3分钟内',
    description: '当前PowerShell编码执行检测延迟较高，建议增加行为基线规则',
    impact: '预计MTTD改善28%',
    effort: '中等 (2周)',
    owner: '张明远',
  },
  {
    id: 'suggestion-2',
    priority: 'medium' as const,
    category: '自动化',
    title: '钓鱼邮件自动处置率可提升至85%',
    description: '新增URL信誉检查和附件沙箱联动，可实现钓鱼邮件全自动隔离',
    impact: '自动处置率+16.5%',
    effort: '高 (1个月)',
    owner: '李思涵',
  },
  {
    id: 'suggestion-3',
    priority: 'low' as const,
    category: '知识库',
    title: 'IOC库更新频率提升至实时可提高命中率至98%+',
    description: '接入威胁情报联盟API，实现IOC自动同步（当前每日手动更新）',
    impact: '知识命中率+1.2%',
    effort: '低 (3天)',
    owner: '王建国',
  },
]

const teamPerformance = [
  { name: '张明远', avatar: '张', cases: 147, avgTime: '12.3min', accuracy: '97.2%', efficiency: 'A+' },
  { name: '李思涵', avatar: '李', cases: 132, avgTime: '14.8min', accuracy: '95.6%', efficiency: 'A' },
  { name: '王建国', avatar: '王', cases: 128, avgTime: '16.1min', accuracy: '93.8%', efficiency: 'B+' },
  { name: '陈雨晴', avatar: '陈', cases: 119, avgTime: '13.5min', accuracy: '96.4%', efficiency: 'A' },
  { name: '刘浩然', avatar: '刘', cases: 108, avgTime: '15.7min', accuracy: '94.1%', efficiency: 'B+' },
]

// ==================== 工具函数 ====================

const priorityConfig = {
  high: {
    bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
    accent: '#ef4444',
  },
  medium: {
    bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.06)]',
    accent: '#eab308',
  },
  low: {
    bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.05)]',
    accent: '#3b82f6',
  },
}

const efficiencyColors: Record<string, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'A': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'B+': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'B': 'bg-white/[0.04] text-zinc-400 border-white/[0.08]',
}

const efficiencyDotColors: Record<string, string> = {
  'A+': '#22c55e',
  'A': '#22c55e',
  'B+': '#3b82f6',
  'B': '#71717a',
}

// ==================== 组件 ====================

function SectionLabel({ icon: Icon, label, accent, className }: {
  icon: React.ElementType
  label: string
  accent?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5 mb-4", className)}>
      <div className="flex size-7 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08]">
        <Icon className="size-3.5" style={{ color: accent ?? '#a1a1aa' }} />
      </div>
      <span className="text-sm font-semibold tracking-tight text-zinc-200">{label}</span>
    </div>
  )
}

function SummaryStatCard({ stat }: { stat: typeof summaryStats[number] }) {
  const Icon = stat.icon
  return (
    <div className={cn(CARD.base, "p-4 hover:border-white/10 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}12` }}>
            <Icon className="size-4" style={{ color: stat.color }} />
          </div>
          <span className="text-xs font-medium text-zinc-400">{stat.label}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
          <TrendingUp className="size-3" />
          {stat.trend}
        </span>
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-zinc-100">
        {stat.value}
      </div>
    </div>
  )
}

function MetricCard({ item }: { item: typeof efficiencyMetrics[number] }) {
  const Icon = item.icon
  const circleRadius = 22
  const circumference = 2 * Math.PI * circleRadius
  const isReverse = item.id === 'mttd' || item.id === 'mttr' || item.id === 'alert-fatigue' || item.id === 'false-positive'
  const ratio = isReverse
    ? item.target / item.value
    : item.value / item.target
  const clampedRatio = Math.min(Math.max(ratio, 0), 1)
  const dashOffset = circumference * (1 - clampedRatio)

  return (
    <Card className={cn(CARD.elevated, "group hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/40 transition-all duration-300")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn("flex size-10 shrink-0 items-center justify-center", RADIUS.lg)}
              style={{
                backgroundColor: `${item.color}12`,
                border: `1px solid ${item.color}25`,
                boxShadow: `0 0 12px ${item.color}08`,
              }}
            >
              <Icon className="size-5" style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{item.label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{item.description}</p>
            </div>
          </div>

          <span className={cn(
            "shrink-0 ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold",
            item.trend.isGood ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {item.trend.direction === 'down' ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
            {item.trend.value}
          </span>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div className="flex items-end gap-1.5">
            <span className="text-[28px] font-bold font-mono tracking-tight text-zinc-100 leading-none">
              {item.value}
            </span>
            <span className="text-xs text-zinc-500 mb-0.5">{item.unit}</span>
          </div>

          <div className="relative flex items-center justify-center">
            <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
              <circle
                cx="26" cy="26" r={circleRadius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <circle
                cx="26" cy="26" r={circleRadius}
                fill="none"
                stroke={item.achievement >= 100 ? '#22c55e' : '#f97316'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
                style={{ filter: `drop-shadow(0 0 4px ${item.achievement >= 100 ? '#22c55e40' : '#f9731640'})` }}
              />
            </svg>
            <span className="absolute text-[11px] font-bold font-mono tabular-nums text-zinc-300">
              {item.achievement}%
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              目标 <span className="font-mono font-semibold text-zinc-400">{item.target}{item.unit}</span>
            </span>
            <Badge variant="outline" className={cn(
              "text-[10px] font-semibold",
              item.achievement >= 100
                ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"
                : "border-orange-500/25 text-orange-400 bg-orange-500/8"
            )}>
              达成率 {item.achievement}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BenchmarkComparison() {
  return (
    <Card className={cn(CARD.elevated, "h-full")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-500/12 ring-1 ring-yellow-500/20">
              <Award className="size-4 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">行业基准对比</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">与同行业SOC团队比较</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-zinc-500 border-white/8 bg-white/[0.03]">
            数据来源: Gartner SOC Benchmark 2024
          </Badge>
        </div>

        <div className="space-y-5">
          {industryBenchmark.map((benchmark) => {
            const isBetter = (benchmark.better === 'lower' && benchmark.current < benchmark.industry)
              || (benchmark.better === 'higher' && benchmark.current > benchmark.industry)
            const ourWidth = Math.min((benchmark.current / benchmark.industry) * 100, 100)

            return (
              <div key={benchmark.metric} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">{benchmark.metric}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-500">
                      我们 <span className="font-mono font-semibold text-zinc-200">{benchmark.current}{benchmark.unit}</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      行业 <span className="font-mono text-zinc-500">{benchmark.industry}{benchmark.unit}</span>
                    </span>
                    <span className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                      isBetter ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {isBetter ? '领先' : '落后'} {benchmark.improvement}
                    </span>
                  </div>
                </div>

                <div className="relative h-10 rounded-lg bg-white/[0.04] overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-medium text-zinc-600">行业基线</span>
                  </div>

                  <div
                    className="absolute inset-y-0 left-0 rounded-lg flex items-center pl-3 transition-all duration-700 ease-out"
                    style={{
                      width: `${ourWidth}%`,
                      backgroundColor: isBetter ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
                      borderRight: `2px solid ${isBetter ? '#22c55e' : '#ef4444'}`,
                    }}
                  >
                    <span className="text-[11px] font-bold font-mono tabular-nums" style={{ color: isBetter ? '#4ade80' : '#f87171' }}>
                      {benchmark.current}{benchmark.unit}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function SuggestionCard({ suggestion }: { suggestion: typeof improvementSuggestions[number] }) {
  const colors = priorityConfig[suggestion.priority as keyof typeof priorityConfig]

  return (
    <div className={cn(
      CARD.base, "p-4 cursor-pointer transition-all duration-200",
      colors.border, colors.glow,
      "hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5",
    )} style={{ backgroundColor: `${colors.accent}06` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${colors.accent}12` }}>
            <Lightbulb className="size-3.5" style={{ color: colors.accent }} />
          </div>
          <h4 className="text-sm font-medium text-zinc-200 truncate">{suggestion.title}</h4>
        </div>
        <Badge className={cn("shrink-0 ml-2 text-[10px] font-semibold border", colors.badge)}>
          {suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
        </Badge>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">{suggestion.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-zinc-500">预期影响</span>
            <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">{suggestion.impact}</p>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500">实施难度</span>
            <p className="text-[11px] font-semibold text-zinc-300 mt-0.5">{suggestion.effort}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15">
          分配给 {suggestion.owner}
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}

function TeamMemberCard({ member }: { member: typeof teamPerformance[number] }) {
  const hasTopBadge = member.efficiency === 'A+' || member.efficiency === 'A'

  return (
    <Card className={cn(
      CARD.base, "p-4 hover:shadow-md hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200",
      hasTopBadge && "ring-1 ring-yellow-500/15"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex size-10 items-center justify-center text-sm font-bold",
              RADIUS.lg,
            )}
            style={{
              background: `linear-gradient(135deg, ${member.efficiency === 'A+' ? '#0891b220' : '#3b82f610'}, ${member.efficiency === 'A+' ? '#7c3aed10' : '#8b5cf608'})`,
              color: member.efficiency === 'A+' ? '#22d3ee' : '#60a5fa',
              border: `1px solid ${member.efficiency === 'A+' ? 'rgba(34,211,238,0.2)' : 'rgba(96,165,250,0.15)'}`,
            }}
          >
            {member.avatar}
          </div>
          {hasTopBadge && (
            <div className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-yellow-500 ring-2 ring-[#131316]">
              <Star className="size-2.5 text-[#09090b] fill-[#09090b]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-zinc-200 truncate">{member.name}</h4>
            <Badge className={cn("text-[10px] font-semibold border shrink-0", efficiencyColors[member.efficiency])}>
              {member.efficiency}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="flex size-1.5 rounded-full" style={{ backgroundColor: efficiencyDotColors[member.efficiency] }} />
            <span className="text-[11px] text-zinc-500">
              准确率 {member.accuracy}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={cn(RADIUS.sm, "bg-white/[0.03] p-2.5 border border-white/[0.04]")}>
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 className="size-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">处理案件</span>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-zinc-100">{member.cases}</span>
        </div>
        <div className={cn(RADIUS.sm, "bg-white/[0.03] p-2.5 border border-white/[0.04]")}>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="size-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">平均响应</span>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-zinc-100">{member.avgTime}</span>
        </div>
      </div>
    </Card>
  )
}

// ==================== 主页面 ====================

export default function MetricsPage() {
  const { t } = useLocaleStore()
  return (
    <PermissionGate resource="dashboard_metrics" action="read" fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ShieldX className="mx-auto size-12 text-zinc-600 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300">{t("common.forbidden")}</h2>
          <p className="text-sm text-zinc-500 mt-1">{t("error.forbidden")}</p>
        </div>
      </div>
    }>
      <MetricsContent />
    </PermissionGate>
  )
}

function MetricsContent() {
  const { t } = useLocaleStore()
  const [timeRange, setTimeRange] = useState("week")

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title={t("nav.metrics")}
        subtitle={t("metrics.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v ?? "week")}>
              <SelectTrigger size="sm" className={`w-32 ${inputClass}`}>
                <SelectValue placeholder={t("dashboard.timeRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t("time.today")}</SelectItem>
                <SelectItem value="week">{t("time.thisWeek")}</SelectItem>
                <SelectItem value="month">{t("time.thisMonth")}</SelectItem>
                <SelectItem value="quarter">{t("metrics.thisQuarter")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15">
              <Activity className="size-4" />
              {t("metrics.exportReport")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <SummaryStatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel icon={Target} label={t("metrics.coreEfficiencyMetrics")} accent="#3b82f6" />
          <span className="text-[11px] text-zinc-500">
            {t("metrics.targetAchievement")}: <strong className="text-emerald-400 text-xs">114%</strong> ({t("metrics.average")})
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {efficiencyMetrics.map((metric) => (
            <MetricCard key={metric.id} item={metric} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <BenchmarkComparison />
        </div>

        <div className="col-span-5 space-y-4">
          <SectionLabel icon={Lightbulb} label={t("metrics.improvementSuggestions")} accent="#eab308" />

          <div className="space-y-3">
            {improvementSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      </div>

      <Card className={CARD.elevated}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel icon={Users} label={t("metrics.teamPerformance")} accent="#8b5cf6" className="mb-0" />
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-500">{t("metrics.topPerformers")}</span>
              <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[10px] font-semibold">
                <Star className="size-3 mr-1 fill-yellow-400" /> 张明远 (A+)
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {teamPerformance.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}