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
  { id: 'total-cases', labelKey: 'metrics.monthlyAlerts', value: 1234, icon: Zap, color: '#3b82f6', trend: '+18.2%' },
  { id: 'resolution-rate', labelKey: 'metrics.resolutionRate', value: '94.7%', icon: ShieldCheck, color: '#16a34a', trend: '+2.3%' },
  { id: 'avg-score', labelKey: 'metrics.analysisAccuracy', value: '96.8%', icon: Gauge, color: '#8b5cf6', trend: '+1.5%' },
  { id: 'sla-compliance', labelKey: 'metrics.slaCompliance', value: '98.2%', icon: CheckCircle2, color: '#0891b2', trend: '+0.8%' },
]

const efficiencyMetrics = [
  {
    id: 'mttd',
    labelKey: 'metrics.mttdLabel',
    value: 4.2,
    unit: 'min',
    icon: Timer,
    color: '#0891b2',
    trend: { direction: 'down' as const, value: '-15.2%', isGood: true },
    target: 5.0,
    achievement: 119,
    descriptionKey: 'metrics.mttdDesc',
  },
  {
    id: 'mttr',
    labelKey: 'metrics.mttrLabel',
    value: 18.7,
    unit: 'min',
    icon: Wrench,
    color: '#8b5cf6',
    trend: { direction: 'down' as const, value: '-8.6%', isGood: true },
    target: 20.0,
    achievement: 107,
    descriptionKey: 'metrics.mttrDesc',
  },
  {
    id: 'alert-fatigue',
    labelKey: 'metrics.alertFatigueIndex',
    value: 23,
    unit: '%',
    icon: AlertTriangle,
    color: '#ea580c',
    trend: { direction: 'down' as const, value: '-5.1%', isGood: true },
    target: 30,
    achievement: 130,
    descriptionKey: 'metrics.alertFatigueDesc',
  },
  {
    id: 'false-positive',
    labelKey: 'metrics.falsePositiveRate',
    value: 15.3,
    unit: '%',
    icon: ShieldX,
    color: '#dc2626',
    trend: { direction: 'down' as const, value: '-3.2%', isGood: true },
    target: 20,
    achievement: 131,
    descriptionKey: 'metrics.falsePositiveDesc',
  },
  {
    id: 'auto-remediation',
    labelKey: 'metrics.autoRemediationRate',
    value: 68.5,
    unit: '%',
    icon: Bot,
    color: '#16a34a',
    trend: { direction: 'up' as const, value: '+12.4%', isGood: true },
    target: 60,
    achievement: 114,
    descriptionKey: 'metrics.autoRemediationDesc',
  },
  {
    id: 'knowledge-hit',
    labelKey: 'metrics.knowledgeHitRate',
    value: 96.8,
    unit: '%',
    icon: Target,
    color: '#2563eb',
    trend: { direction: 'up' as const, value: '+2.1%', isGood: true },
    target: 95,
    achievement: 102,
    descriptionKey: 'metrics.knowledgeHitDesc',
  },
]

const industryBenchmark = [
  { metric: 'MTTD', current: 4.2, industry: 8.5, unit: 'min', better: 'lower', improvement: '50.6%' },
  { metric: 'MTTR', current: 18.7, industry: 35.0, unit: 'min', better: 'lower', improvement: '46.6%' },
  { metricKey: 'metrics.falsePositiveRate', current: 15.3, industry: 25.0, unit: '%', better: 'lower', improvement: '38.8%' },
  { metricKey: 'metrics.autoRemediationRate', current: 68.5, industry: 45.0, unit: '%', better: 'higher', improvement: '52.2%' },
]

const improvementSuggestions = [
  {
    id: 'suggestion-1',
    priority: 'high' as const,
    categoryKey: 'metrics.suggestion1Category',
    titleKey: 'metrics.suggestion1Title',
    descriptionKey: 'metrics.suggestion1Desc',
    impactKey: 'metrics.suggestion1Impact',
    effortKey: 'metrics.suggestion1Effort',
    owner: '张明远',
  },
  {
    id: 'suggestion-2',
    priority: 'medium' as const,
    categoryKey: 'metrics.suggestion2Category',
    titleKey: 'metrics.suggestion2Title',
    descriptionKey: 'metrics.suggestion2Desc',
    impactKey: 'metrics.suggestion2Impact',
    effortKey: 'metrics.suggestion2Effort',
    owner: '李思涵',
  },
  {
    id: 'suggestion-3',
    priority: 'low' as const,
    categoryKey: 'metrics.suggestion3Category',
    titleKey: 'metrics.suggestion3Title',
    descriptionKey: 'metrics.suggestion3Desc',
    impactKey: 'metrics.suggestion3Impact',
    effortKey: 'metrics.suggestion3Effort',
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
    bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600',
    badge: 'bg-red-500/20 text-red-600 border-red-500/30',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
    accent: '#ef4444',
  },
  medium: {
    bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600',
    badge: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.06)]',
    accent: '#eab308',
  },
  low: {
    bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600',
    badge: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.05)]',
    accent: '#3b82f6',
  },
}

const efficiencyColors: Record<string, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'A': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'B+': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'B': 'bg-muted/50 text-muted-foreground border-border',
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
      <div className="flex size-7 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border">
        <Icon className="size-3.5" style={{ color: accent ?? '#a1a1aa' }} />
      </div>
      <span className="text-sm font-semibold tracking-tight text-foreground">{label}</span>
    </div>
  )
}

function SummaryStatCard({ stat }: { stat: typeof summaryStats[number] }) {
  const { t } = useLocaleStore()
  const Icon = stat.icon
  return (
    <div className={cn(CARD.base, "p-4 hover:border-border hover:shadow-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}12` }}>
            <Icon className="size-4" style={{ color: stat.color }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{t(stat.labelKey)}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600">
          <TrendingUp className="size-3" />
          {stat.trend}
        </span>
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-foreground">
        {stat.value}
      </div>
    </div>
  )
}

function MetricCard({ item }: { item: typeof efficiencyMetrics[number] }) {
  const { t } = useLocaleStore()
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
    <Card className={cn(CARD.elevated, "group hover:border-border hover:shadow-xl hover:shadow-black/40 transition-all duration-300")}>
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
              <p className="text-sm font-medium text-foreground truncate">{t(item.labelKey)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t(item.descriptionKey)}</p>
            </div>
          </div>

          <span className={cn(
            "shrink-0 ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold",
            item.trend.isGood ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
          )}>
            {item.trend.direction === 'down' ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
            {item.trend.value}
          </span>
        </div>

        <div className="flex items-end justify-between mb-4">
          <div className="flex items-end gap-1.5">
            <span className="text-[28px] font-bold font-mono tracking-tight text-foreground leading-none">
              {item.value}
            </span>
            <span className="text-xs text-muted-foreground mb-0.5">{item.unit}</span>
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
            <span className="absolute text-[11px] font-bold font-mono tabular-nums text-muted-foreground">
              {item.achievement}%
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {t("metrics.target")} <span className="font-mono font-semibold text-muted-foreground">{item.target}{item.unit}</span>
            </span>
            <Badge variant="outline" className={cn(
              "text-[10px] font-semibold",
              item.achievement >= 100
                ? "border-emerald-500/25 text-emerald-600 bg-emerald-500/8"
                : "border-orange-500/25 text-orange-600 bg-orange-500/8"
            )}>
              {t("metrics.achievementRate")} {item.achievement}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BenchmarkComparison() {
  const { t } = useLocaleStore()
  return (
    <Card className={cn(CARD.elevated, "h-full")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-500/12 ring-1 ring-yellow-500/20">
              <Award className="size-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("metrics.benchmarkComparison")}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("metrics.benchmarkSubtitle")}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-muted/50">
            {t("metrics.dataSource")}
          </Badge>
        </div>

        <div className="space-y-5">
          {industryBenchmark.map((benchmark) => {
            const isBetter = (benchmark.better === 'lower' && benchmark.current < benchmark.industry)
              || (benchmark.better === 'higher' && benchmark.current > benchmark.industry)
            const ourWidth = Math.min((benchmark.current / benchmark.industry) * 100, 100)
            const metricLabel = benchmark.metric ?? t(benchmark.metricKey!)

            return (
              <div key={metricLabel} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{metricLabel}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {t("metrics.ours")} <span className="font-mono font-semibold text-foreground">{benchmark.current}{benchmark.unit}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {t("metrics.industry")} <span className="font-mono text-muted-foreground">{benchmark.industry}{benchmark.unit}</span>
                    </span>
                    <span className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                      isBetter ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {isBetter ? t("metrics.leading") : t("metrics.lagging")} {benchmark.improvement}
                    </span>
                  </div>
                </div>

                <div className="relative h-10 rounded-lg bg-muted/50 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-medium text-muted-foreground/60">{t("metrics.industryBaseline")}</span>
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
  const { t } = useLocaleStore()
  const colors = priorityConfig[suggestion.priority as keyof typeof priorityConfig]

  return (
    <div className={cn(
      CARD.base, "p-4 cursor-pointer transition-all duration-200",
      colors.border, colors.glow,
      "hover:shadow-lg hover:shadow-lg hover:-translate-y-0.5",
    )} style={{ backgroundColor: `${colors.accent}06` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${colors.accent}12` }}>
            <Lightbulb className="size-3.5" style={{ color: colors.accent }} />
          </div>
          <h4 className="text-sm font-medium text-foreground truncate">{t(suggestion.titleKey)}</h4>
        </div>
        <Badge className={cn("shrink-0 ml-2 text-[10px] font-semibold border", colors.badge)}>
          {suggestion.priority === 'high' ? t("metrics.highPriority") : suggestion.priority === 'medium' ? t("metrics.mediumPriority") : t("metrics.lowPriority")}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{t(suggestion.descriptionKey)}</p>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground">{t("metrics.expectedImpact")}</span>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">{t(suggestion.impactKey)}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">{t("metrics.implementationEffort")}</span>
            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{t(suggestion.effortKey)}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium border-border bg-muted/50 hover:bg-muted/50 hover:border-border">
          {t("metrics.assignTo")} {suggestion.owner}
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}

function TeamMemberCard({ member }: { member: typeof teamPerformance[number] }) {
  const { t } = useLocaleStore()
  const hasTopBadge = member.efficiency === 'A+' || member.efficiency === 'A'

  return (
    <Card className={cn(
      CARD.base, "p-4 hover:shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
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
            <h4 className="text-sm font-medium text-foreground truncate">{member.name}</h4>
            <Badge className={cn("text-[10px] font-semibold border shrink-0", efficiencyColors[member.efficiency])}>
              {member.efficiency}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="flex size-1.5 rounded-full" style={{ backgroundColor: efficiencyDotColors[member.efficiency] }} />
            <span className="text-[11px] text-muted-foreground">
              {t("metrics.accuracy")} {member.accuracy}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={cn(RADIUS.sm, "bg-muted/50 p-2.5 border border-border/40")}>
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 className="size-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{t("metrics.casesHandled")}</span>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-foreground">{member.cases}</span>
        </div>
        <div className={cn(RADIUS.sm, "bg-muted/50 p-2.5 border border-border/40")}>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="size-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{t("metrics.avgResponse")}</span>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-foreground">{member.avgTime}</span>
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
          <ShieldX className="mx-auto size-12 text-muted-foreground/60 mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">{t("common.forbidden")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("error.forbidden")}</p>
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
            <Button variant="outline" className="gap-2 border-border bg-muted/50 hover:bg-muted/50 hover:border-border">
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
          <span className="text-[11px] text-muted-foreground">
            {t("metrics.targetAchievement")}: <strong className="text-emerald-600 text-xs">114%</strong> ({t("metrics.average")})
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
              <span className="text-[11px] text-muted-foreground">{t("metrics.topPerformers")}</span>
              <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/25 text-[10px] font-semibold">
                <Star className="size-3 mr-1 fill-yellow-400" /> {t("metrics.topPerformerName")}
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