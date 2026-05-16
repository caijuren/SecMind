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
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Award,
  Star,
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
import { inputClass } from "@/lib/admin-ui"
import {
  TYPOGRAPHY,
  CARD,
  RADIUS,
  getTrendColor,
  formatNumber,
  formatPercent,
} from "@/lib/design-system"

// ==================== 数据定义 ====================

/** 核心效率指标 - 聚焦"质量"和"效率" */
const efficiencyMetrics = [
  {
    id: 'mttd',
    label: 'MTTD 平均检测时间',
    value: 4.2,
    unit: 'min',
    icon: Timer,
    color: '#0891b2',
    trend: { direction: 'down' as const, value: '-15.2%', isGood: true },
    target: '5.0min',
    achievement: 119, // 超额完成 = 更好
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
    target: '20.0min',
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
    target: '<30%',
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
    target: '<20%',
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
    target: '>60%',
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
    target: '>95%',
    achievement: 102,
    description: 'AI匹配到已知攻击模式的比率',
  },
]

/** 行业基准对比数据 */
const industryBenchmark = [
  { metric: 'MTTD', current: 4.2, industry: 8.5, unit: 'min', better: 'lower', improvement: '50.6%' },
  { metric: 'MTTR', current: 18.7, industry: 35.0, unit: 'min', better: 'lower', improvement: '46.6%' },
  { metric: '误报率', current: 15.3, industry: 25.0, unit: '%', better: 'lower', improvement: '38.8%' },
  { metric: '自动处置率', current: 68.5, industry: 45.0, unit: '%', better: 'higher', improvement: '52.2%' },
]

/** 改进建议 - 基于数据生成的actionable insights */
const improvementSuggestions = [
  {
    id: 'suggestion-1',
    priority: 'high',
    category: '检测能力',
    title: 'EDR规则优化可降低MTTD至3分钟内',
    description: '当前PowerShell编码执行检测延迟较高，建议增加行为基线规则',
    impact: '预计MTTD改善28%',
    effort: '中等 (2周)',
    owner: '张明远',
  },
  {
    id: 'suggestion-2',
    priority: 'medium',
    category: '自动化',
    title: '钓鱼邮件自动处置率可提升至85%',
    description: '新增URL信誉检查和附件沙箱联动，可实现钓鱼邮件全自动隔离',
    impact: '自动处置率+16.5%',
    effort: '高 (1个月)',
    owner: '李思涵',
  },
  {
    id: 'suggestion-3',
    priority: 'low',
    category: '知识库',
    title: 'IOC库更新频率提升至实时可提高命中率至98%+',
    description: '接入威胁情报联盟API，实现IOC自动同步（当前每日手动更新）',
    impact: '知识命中率+1.2%',
    effort: '低 (3天)',
    owner: '王建国',
  },
]

/** 团队绩效数据 */
const teamPerformance = [
  { name: '张明远', avatar: '张', cases: 147, avgTime: '12.3min', accuracy: '97.2%', efficiency: 'A+' },
  { name: '李思涵', avatar: '李', cases: 132, avgTime: '14.8min', accuracy: '95.6%', efficiency: 'A' },
  { name: '王建国', avatar: '王', cases: 128, avgTime: '16.1min', accuracy: '93.8%', efficiency: 'B+' },
  { name: '陈雨晴', avatar: '陈', cases: 119, avgTime: '13.5min', accuracy: '96.4%', efficiency: 'A' },
  { name: '刘浩然', avatar: '刘', cases: 108, avgTime: '15.7min', accuracy: '94.1%', efficiency: 'B+' },
]

// ==================== 组件 ====================

/** 效率指标卡片 - 带目标达成率和行业对比 */
function MetricCard({ item }: { item: typeof efficiencyMetrics[number] }) {
  const Icon = item.icon

  return (
    <Card className={CARD.elevated}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn('flex size-10 items-center justify-center', RADIUS.lg)}
              style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}20` }}
            >
              <Icon className="size-5" style={{ color: item.color }} />
            </div>
            <div>
              <p className={String(TYPOGRAPHY.body) + 'font-medium text-slate-700'}>{item.label}</p>
              <p className={String(TYPOGRAPHY.micro) + 'text-slate-400 mt-0.5'}>{item.description}</p>
            </div>
          </div>

          <span className={cn(
            TYPOGRAPHY.micro + 'font-semibold px-2 py-1 rounded-md',
            item.trend.isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          )}>
            {item.trend.value}
          </span>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
            {item.value}
          </span>
          <span className={String(TYPOGRAPHY.caption) + 'text-slate-500 mb-1'}>{item.unit}</span>
        </div>

        {/* 目标达成指示器 */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className={String(TYPOGRAPHY.micro) + 'text-slate-500'}>目标: {item.target}</span>
            <Badge variant="outline" className={cn(
              TYPOGRAPHY.micro,
              item.achievement >= 100 ? 'border-emerald-300 text-emerald-700' : 'border-orange-300 text-orange-700'
            )}>
              达成率 {item.achievement}%
            </Badge>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-colors duration-500', item.achievement >= 100 ? 'bg-emerald-500' : 'bg-orange-500')}
              style={{ width: `${Math.min(item.achievement, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** 行业基准对比组件 */
function BenchmarkComparison() {
  return (
    <Card className={CARD.default}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-yellow-500" />
            <h2 className={String(TYPOGRAPHY.h2)}>行业基准对比</h2>
          </div>
          <Badge variant="outline" className={String(TYPOGRAPHY.micro)}>
            数据来源: Gartner SOC Benchmark 2024
          </Badge>
        </div>

        <p className={String(TYPOGRAPHY.body) + 'text-slate-600 mb-4'}>
          与同行业SOC团队相比，我们的运营效率处于领先水平
        </p>

        <div className="space-y-4">
          {industryBenchmark.map((benchmark) => (
            <div key={benchmark.metric} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={String(TYPOGRAPHY.h3)}>{benchmark.metric}</span>
                <span className={cn(TYPOGRAPHY.caption + 'font-semibold px-2 py-0.5 rounded', 'bg-emerald-50 text-emerald-700')}>
                  领先 {benchmark.improvement}
                </span>
              </div>

              <div className="relative h-8 flex items-center">
                {/* 行业平均 */}
                <div className="absolute left-0 right-0 h-6 bg-slate-100 rounded flex items-center px-3">
                  <span className={String(TYPOGRAPHY.micro) + 'text-slate-500'}>
                    行业平均: {benchmark.industry}{benchmark.unit}
                  </span>
                </div>

                {/* 我们的值 */}
                <div
                  className="absolute h-8 rounded flex items-center px-3 z-10 transition-colors duration-500"
                  style={{
                    width: `${(benchmark.current / benchmark.industry) * 100}%`,
                    maxWidth: '100%',
                    backgroundColor: benchmark.better === 'lower' && benchmark.current < benchmark.industry
                      ? '#dcfce7' // 绿色背景（更低=更好）
                      : benchmark.better === 'higher' && benchmark.current > benchmark.industry
                        ? '#dcfce7' // 绿色背景（更高=更好）
                        : '#fef2f2', // 红色背景
                    borderLeft: `3px solid ${benchmark.better === 'lower' && benchmark.current < benchmark.industry || benchmark.better === 'higher' && benchmark.current > benchmark.industry ? '#16a34a' : '#dc2626'}`,
                  }}
                >
                  <span className={String(TYPOGRAPHY.caption) + 'font-bold'} style={{
                    color: benchmark.better === 'lower' && benchmark.current < benchmark.industry || benchmark.better === 'higher' && benchmark.current > benchmark.industry ? '#166534' : '#991b1b'
                  }}>
                    我们: {benchmark.current}{benchmark.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** 改进建议卡片 */
function SuggestionCard({ suggestion }: { suggestion: typeof improvementSuggestions[number] }) {
  const priorityColors = {
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  }
  const colors = priorityColors[suggestion.priority as keyof typeof priorityColors]

  return (
    <div className={cn(CARD.base + ' p-4 hover:shadow-md transition-colors cursor-pointer', colors.bg, colors.border)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-5" style={{ color: colors.text.replace('text-', '') }} />
          <h4 className={String(TYPOGRAPHY.h3)}>{suggestion.title}</h4>
        </div>
        <Badge className={cn(TYPOGRAPHY.micro, colors.badge)}>
          {suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
        </Badge>
      </div>

      <p className={String(TYPOGRAPHY.body) + 'text-slate-600 mb-3'}>{suggestion.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
        <div className="flex items-center gap-4">
          <div>
            <span className={String(TYPOGRAPHY.micro) + 'text-slate-500'}>预期影响</span>
            <p className={String(TYPOGRAPHY.caption) + 'font-semibold text-emerald-600'}>{suggestion.impact}</p>
          </div>
          <div>
            <span className={String(TYPOGRAPHY.micro) + 'text-slate-500'}>实施难度</span>
            <p className={String(TYPOGRAPHY.caption) + 'font-semibold text-slate-700'}>{suggestion.effort}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className={String(TYPOGRAPHY.micro) + 'gap-1'}>
          分配给 {suggestion.owner}
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}

/** 团队绩效卡片 */
function TeamMemberCard({ member }: { member: typeof teamPerformance[number] }) {
  const efficiencyColors: Record<string, string> = {
    'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'A': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'B+': 'bg-blue-50 text-blue-700 border-blue-200',
    'B': 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <Card className={CARD.base + ' p-4 hover:shadow-sm transition-colors'}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn('flex size-10 items-center justify-center', TYPOGRAPHY.h3 + ' font-bold', RADIUS.lg)}
          style={{ backgroundColor: '#0891b210', color: '#0891b2' }}
        >
          {member.avatar}
        </div>
        <div className="flex-1">
          <h4 className={String(TYPOGRAPHY.h3)}>{member.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span className={String(TYPOGRAPHY.micro) + 'font-mono text-emerald-600'}>{member.accuracy}</span>
          </div>
        </div>
        <Badge className={cn(TYPOGRAPHY.micro, efficiencyColors[member.efficiency])}>
          {member.efficiency}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={RADIUS.sm + ' bg-slate-50 p-2.5'}>
          <div className="flex items-center gap-1 mb-1">
            <Users className="size-3.5 text-slate-400" />
            <span className={String(TYPOGRAPHY.micro) + 'text-slate-500'}>处理案件</span>
          </div>
          <span className={String(TYPOGRAPHY.h3) + 'font-bold font-mono text-slate-900'}>{member.cases}</span>
        </div>
        <div className={RADIUS.sm + ' bg-slate-50 p-2.5'}>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="size-3.5 text-slate-400" />
            <span className={String(TYPOGRAPHY.micro) + 'text-slate-500'}>平均响应</span>
          </div>
          <span className={String(TYPOGRAPHY.h3) + 'font-bold font-mono text-slate-900'}>{member.avgTime}</span>
        </div>
      </div>
    </Card>
  )
}

// ==================== 主页面 ====================

export default function MetricsPage() {
  useLocaleStore()
  const [timeRange, setTimeRange] = useState("week")

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <PageHeader
        icon={BarChart3}
        title="运营指标"
        subtitle="SOC运营效率与质量度量 - 数据驱动的持续改进"
        actions={
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v ?? "week")}>
              <SelectTrigger size="sm" className={`w-32 ${inputClass}`}>
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季度</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Activity className="size-4" />
              导出报告
            </Button>
          </div>
        }
      />

      {/* 第一行：核心效率指标（6个KPI）*/}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={String(TYPOGRAPHY.h2)}>核心效率指标</h2>
          <span className={String(TYPOGRAPHY.caption) + 'text-slate-500'}>
            目标达成率: <strong className="text-emerald-600">114%</strong> (平均)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {efficiencyMetrics.map((metric) => (
            <MetricCard key={metric.id} item={metric} />
          ))}
        </div>
      </div>

      {/* 第二行：左侧行业基准对比 + 右侧改进建议 */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <BenchmarkComparison />
        </div>

        <div className="col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5 text-yellow-500" />
              <h2 className={String(TYPOGRAPHY.h2)}>改进建议</h2>
            </div>
            <Badge variant="outline" className={String(TYPOGRAPHY.micro)}>
              基于数据生成
            </Badge>
          </div>

          <div className="space-y-3">
            {improvementSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      </div>

      {/* 第三行：团队绩效 */}
      <Card className={CARD.default}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h2 className={String(TYPOGRAPHY.h2)}>团队绩效</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className={String(TYPOGRAPHY.caption) + 'text-slate-500'}>本月TOP表现者</span>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="size-3 mr-1" /> 张明远 (A+)
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
