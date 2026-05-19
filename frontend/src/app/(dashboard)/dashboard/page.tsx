"use client"

import { useState, useEffect } from "react"
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts"
import {
  Bell,
  ShieldAlert,
  Activity,
  Zap,
  Search,
  ArrowRight,
  AlertCircle,
  Clock,
  Eye,
  Brain,
  TrendingUp,
  ChevronDown,
  Shield,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { PageHeader } from "@/components/layout/page-header"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { inputClass } from "@/lib/admin-ui"
import { useLocaleStore } from "@/store/locale-store"
import { useAuthStore } from "@/store/auth-store"
import { ALL_ALERTS, mockITSMTickets } from "@/data/mock-data"
import {
  TYPOGRAPHY,
  CARD,
  RADIUS,
  COLORS,
  getSeverityStyles,
} from "@/lib/design-system"

// ==================== 数据定义 ====================

/** 核心KPI - 基于真实 mock 数据 */
const pendingAlerts = ALL_ALERTS.filter(a => a.status === 'new' || a.status === 'investigating').length
const activeCases = mockITSMTickets.filter(t => t.status === 'in_progress').length
const criticalAlerts = ALL_ALERTS.filter(a => a.riskLevel === 'critical' && a.status !== 'resolved' && a.status !== 'false_positive').length
const todayNewAlerts = ALL_ALERTS.filter(a => {
  const d = new Date(a.timestamp)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}).length

const coreKPIs = [
  {
    id: 'pending-alerts',
    label: '待处理告警',
    value: String(pendingAlerts),
    icon: Bell,
    severity: 'critical' as const,
    trend: { direction: 'up' as const, value: '+12.5%' },
    subtitle: `${criticalAlerts}条需立即处理`,
    link: '/alerts?status=pending',
  },
  {
    id: 'pending-cases',
    label: '进行中案件',
    value: String(activeCases),
    icon: Shield,
    severity: 'high' as const,
    trend: { direction: 'down' as const, value: '-2' },
    subtitle: `${activeCases}件处理中`,
    link: '/cases?status=active',
  },
  {
    id: 'active-threats',
    label: '活跃威胁',
    value: String(criticalAlerts),
    icon: ShieldAlert,
    severity: 'medium' as const,
    trend: null,
    subtitle: `${criticalAlerts}个严重威胁`,
    link: '/threats',
  },
  {
    id: 'ai-insights',
    label: 'AI新发现',
    value: String(todayNewAlerts),
    icon: Brain,
    severity: 'primary' as const,
    trend: { direction: 'up' as const, value: '+' + todayNewAlerts },
    subtitle: '今日新增',
    link: '/workspace/ai',
  },
]

/** 最高优先级告警 */
const priorityAlerts = [
  {
    id: 'alert-001',
    time: '14:35:22',
    level: 'critical' as const,
    source: 'EDR',
    title: '主机WIN-DESK-15检测到PowerShell编码执行行为',
    description: '疑似Cobalt Strike Beacon活动，已触发自动隔离',
    status: 'analyzing' as const,
    assignee: '张明远',
  },
  {
    id: 'alert-002',
    time: '14:35:18',
    level: 'critical' as const,
    source: 'VPN',
    title: '用户zhangwei从境外IP登录，触发不可能旅行检测',
    description: '源IP: 91.234.56.78 (俄罗斯莫斯科)，账号: admin_zhang',
    status: 'pending' as const,
    assignee: '未分配',
  },
  {
    id: 'alert-003',
    time: '14:35:15',
    level: 'high' as const,
    source: 'Email',
    title: 'CFO收到伪装DHL投递通知的钓鱼邮件',
    description: '目标: 财务部(23人)，附件: fake-dhl-invoice.exe',
    status: 'investigating' as const,
    assignee: '李思涵',
  },
]

/** AI能力概览 - 精简为关键指标 */
const aiOverview = [
  { label: '推理次数', value: '3,847', change: '+342', icon: Brain },
  { label: '处置率', value: '68.5%', change: '+12.4%', icon: Zap },
  { label: '准确率', value: '96.8%', change: '+2.1%', icon: TrendingUp },
  { label: '响应时间', value: '4.2min', change: '-15.2%', icon: Clock },
]

/** 实时告警流初始数据 */
const initialAlerts: Array<{
  time: string
  source: string
  level: 'critical' | 'high' | 'medium'
  message: string
}> = [
  { time: '14:35:22', source: 'EDR', level: 'critical' as const, message: 'PowerShell编码执行行为检测' },
  { time: '14:35:18', source: 'VPN', level: 'critical' as const, message: '境外IP异常登录触发不可能旅行' },
  { time: '14:35:15', source: 'Email', level: 'critical' as const, message: '高仿DHL钓鱼邮件拦截' },
  { time: '14:35:10', source: 'Firewall', level: 'high' as const, message: '内网主机向已知C2地址发起加密通信' },
  { time: '14:35:05', source: 'IAM', level: 'high' as const, message: '服务账号异常提权至Administrators组' },
  { time: '14:35:01', source: 'DNS', level: 'critical' as const, message: 'DGA域名高频TXT查询，疑似DNS隧道' },
]

// ==================== 组件 ====================

/** KPI卡片 - 行动导向设计 */
function KPICard({ item }: { item: typeof coreKPIs[number] }) {
  const { t } = useLocaleStore()
  const Icon = item.icon
  const severityColor = item.severity === 'primary'
    ? COLORS.primary[500]
    : COLORS.severity[item.severity === 'critical' || item.severity === 'high' || item.severity === 'medium' ? item.severity : 'low'].solid

  const glowClass = item.severity === 'critical' ? 'glow-red'
    : item.severity === 'high' ? 'glow-orange'
    : item.severity === 'primary' ? 'glow-blue'
    : 'glow-green'

  return (
    <Card className={cn(CARD.elevated, glowClass, "group cursor-pointer hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden")}>
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: severityColor }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn("flex size-10 items-center justify-center", RADIUS.lg)}
              style={{
                backgroundColor: `${severityColor}10`,
                border: `1px solid ${severityColor}20`,
              }}
            >
              <Icon className="size-5" style={{ color: severityColor }} />
            </div>
            <div>
              <p className={cn(TYPOGRAPHY.body, "font-medium text-zinc-300")}>{item.label}</p>
              <p className={cn(TYPOGRAPHY.micro, "text-zinc-600 mt-0.5")}>{item.subtitle}</p>
            </div>
          </div>

          {item.trend && (
            <span
              className={cn(
                TYPOGRAPHY.micro,
                "font-semibold px-2 py-1 rounded-md",
                item.trend.direction === 'up' && item.severity !== 'primary'
                  ? "bg-red-500/10 text-red-400"
                  : item.severity === 'primary'
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-emerald-500/10 text-emerald-400"
              )}
            >
              {item.trend.value}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-100">
            {item.value}
          </span>
          <Button variant="ghost" size="sm" className={cn(TYPOGRAPHY.micro, "text-primary hover:bg-primary/5 gap-1")}>
            {t("common.view")}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** 优先级告警卡片 */
function PriorityAlertCard({ alert }: { alert: typeof priorityAlerts[number] }) {
  const { t } = useLocaleStore()
  const severity = getSeverityStyles(alert.level)

  return (
    <div
      className={cn(
        CARD.base,
        "p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group",
        alert.level === 'critical' && "border-l-[3px] border-l-red-500"
      )}
    >
      {alert.level === 'critical' && (
        <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-red-500/60 via-red-500/30 to-transparent" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded", TYPOGRAPHY.micro, "font-semibold", severity.bg, severity.textColor)}>
            {alert.level === 'critical' ? '严重' : alert.level === 'high' ? '高危' : '中危'}
          </span>
          <span className={cn(TYPOGRAPHY.micro, "font-mono tabular-nums text-zinc-600")}>{alert.time}</span>
          <span className={cn(TYPOGRAPHY.micro, "text-zinc-500 font-medium")}>{alert.source}</span>
        </div>
        <span
          className={cn(
            TYPOGRAPHY.micro,
            "px-2 py-0.5 rounded-full",
            alert.status === 'analyzing'
              ? "bg-blue-500/10 text-blue-400 animate-pulse"
              : alert.status === 'pending'
              ? "bg-orange-500/10 text-orange-400"
              : "bg-cyan-500/10 text-cyan-400"
          )}
        >
          {alert.status === 'analyzing' ? 'AI分析中' : alert.status === 'pending' ? '待处理' : '调查中'}
        </span>
      </div>

      <h4 className={cn(TYPOGRAPHY.h3, "text-zinc-100 mb-2")}>{alert.title}</h4>
      <p className={cn(TYPOGRAPHY.body, "text-zinc-400 mb-3 line-clamp-2")}>{alert.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-zinc-600" />
          <span className={cn(TYPOGRAPHY.caption, "text-zinc-500")}>
            {t("dashboard.assignee")}: <strong className="text-zinc-300">{alert.assignee}</strong>
          </span>
        </div>
        <Button variant="outline" size="sm" className={cn(TYPOGRAPHY.micro, "gap-1")}>
          {t("dashboard.handleNow")}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/** AI指标卡片 */
function AIMetricCard({ item }: { item: typeof aiOverview[number] }) {
  const Icon = item.icon
  const isPositive = !item.change.includes('-')

  return (
    <div className={cn(CARD.base, "p-3 cursor-pointer hover:shadow-sm transition-[shadow,transform]")}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className={cn(TYPOGRAPHY.caption, "text-zinc-400")}>{item.label}</span>
        </div>
        <span
          className={cn(
            TYPOGRAPHY.micro,
            "font-semibold",
            isPositive ? "text-emerald-400" : "text-red-400"
          )}
        >
          {isPositive ? '+' : ''}{item.change}
        </span>
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums text-zinc-100">{item.value}</div>
    </div>
  )
}

/** 实时告警流 - 优化版 */
function RealtimeAlertStream() {
  const { t } = useLocaleStore()
  const { alerts: wsAlerts, newAlertCount, clearNewAlerts, isConnected } = useRealtimeAlerts()
  const [alerts, setAlerts] = useState(initialAlerts)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (wsAlerts.length > 0) {
      const latest = wsAlerts[0]
      const newAlert = {
        time: latest.timestamp ? new Date(latest.timestamp).toLocaleTimeString("zh-CN", { hour12: false }) : new Date().toLocaleTimeString("zh-CN", { hour12: false }),
        source: latest.source || "System",
        level: (latest.riskLevel === "critical" || latest.riskLevel === "high" || latest.riskLevel === "medium" ? latest.riskLevel : "medium") as "critical" | "high" | "medium",
        message: latest.title || latest.description || "新安全告警",
      }
      const applyAlert = () => {
        setAlerts((prev) => [newAlert, ...prev.slice(0, 19)])
      }
      if (typeof queueMicrotask === "function") {
        queueMicrotask(applyAlert)
      } else {
        Promise.resolve().then(applyAlert)
      }
    }
  }, [wsAlerts])

  useEffect(() => {
    const interval = setInterval(() => {
      const sources = ['EDR', 'VPN', 'IAM', 'Email', 'Firewall', 'DNS']
      const levels: Array<'critical' | 'high' | 'medium'> = ['critical', 'high', 'medium']
      const messages = [
        '检测到可疑PowerShell编码执行行为',
        '用户从境外IP登录触发不可能旅行检测',
        '收到伪装投递通知的钓鱼邮件',
        '内网主机向已知C2地址发起加密通信',
        '服务账号异常提权操作',
        'DGA域名高频查询疑似DNS隧道',
        '上传目录发现WebShell文件',
        '源代码外传至个人云盘',
        '用户同时从多个不同城市设备在线',
        '仿冒IT支持域名发送钓鱼邮件',
      ]
      const now = new Date()
      const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

      const newAlert = {
        time: ts,
        source: sources[Math.floor(Math.random() * sources.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      }

      setAlerts((prev) => [newAlert, ...prev.slice(0, 19)])
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const displayAlerts = isExpanded ? alerts : alerts.slice(0, 6)

  return (
    <Card className={CARD.default}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-wider">LIVE</span>
            </div>
            <Zap className="size-4 text-cyan-400" />
            <h2 className={String(TYPOGRAPHY.h2)}>{t("dashboard.realtimeAlertStream")}</h2>
            {isConnected ? (
              <Wifi className="size-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="size-3.5 text-zinc-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {newAlertCount > 0 && (
              <button
                onClick={clearNewAlerts}
                className={cn(TYPOGRAPHY.micro, "px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold animate-pulse cursor-pointer hover:bg-red-500/20 transition-colors")}
              >
                +{newAlertCount} {t("dashboard.newAlerts")}
              </button>
            )}
            <span className={cn(TYPOGRAPHY.caption, "text-zinc-600")}>{t("common.total")} {alerts.length} {t("common.items")}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(TYPOGRAPHY.micro, "gap-1 text-zinc-400")}
            >
              {isExpanded ? t("dashboard.collapse") : t("dashboard.expand")}
              <ChevronDown className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 transition-[max-height] duration-300",
            isExpanded ? "max-h-[520px]" : "max-h-[320px]"
          )}
        >
          {displayAlerts.map((alert, idx) => {
            const severity = getSeverityStyles(alert.level)
            return (
              <div
                key={`${alert.time}-${idx}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200",
                  idx === 0 ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/[0.04]"
                )}
              >
                <span className={cn(TYPOGRAPHY.caption, "font-mono tabular-nums text-zinc-600 shrink-0 w-16")}>
                  {alert.time}
                </span>
                <span className={cn(TYPOGRAPHY.caption, "text-zinc-500 font-medium shrink-0 w-10")}>
                  {alert.source}
                </span>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center px-1.5 py-0.5 rounded",
                    TYPOGRAPHY.micro,
                    "font-medium",
                    severity.bg,
                    severity.textColor
                  )}
                >
                  {alert.level === 'critical' ? '严重' : alert.level === 'high' ? '高危' : '中危'}
                </span>
                <span className={cn(TYPOGRAPHY.body, "text-zinc-300 truncate flex-1")}>
                  {alert.message}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== 主页面 ====================

export default function DashboardPage() {
  const { t } = useLocaleStore()
  return (
    <PermissionGate resource="dashboard_overview" action="read" fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto size-12 text-zinc-500 mb-4" />
          <h2 className="text-lg font-semibold text-slate-300">{t("common.forbidden")}</h2>
          <p className="text-sm text-zinc-500 mt-1">{t("error.forbidden")}</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </PermissionGate>
  )
}

function DashboardContent() {
  const { t } = useLocaleStore()
  const { newAlertCount, clearNewAlerts, isConnected, lastMessage } = useRealtimeAlerts()
  const [kpiOverrides, setKpiOverrides] = useState<Record<string, any>>({})
  const isDemo = useAuthStore(s => s.user?.isDemo)

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "stats_update" || !lastMessage.data) return
    const nextData = lastMessage.data as Record<string, any>
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        setKpiOverrides(prev => ({ ...prev, ...nextData }))
      })
      return
    }
    Promise.resolve().then(() => {
      setKpiOverrides(prev => ({ ...prev, ...nextData }))
    })
  }, [lastMessage])

  if (!isDemo) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Activity}
          title={t("dashboard.title")}
          subtitle={t("dashboard.subtitle")}
        />
        <Card className={CARD.default}>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Database className="size-12 text-zinc-700 mb-4" />
            <h3 className={cn(TYPOGRAPHY.h3, "text-zinc-400 mb-2")}>{t("dashboard.noData")}</h3>
            <p className={cn(TYPOGRAPHY.body, "text-zinc-600 text-center max-w-md")}>
              {t("dashboard.noDataDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {newAlertCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-400">
              {t("dashboard.received")} {newAlertCount} {t("dashboard.newRealtimeAlerts")}
            </span>
            {!isConnected && (
              <span className="text-xs text-zinc-600 ml-2">({t("dashboard.websocketDisconnected")})</span>
            )}
          </div>
          <button
            onClick={clearNewAlerts}
            className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            {t("common.confirm")}
          </button>
        </div>
      )}
      {/* 页面标题 */}
      <PageHeader
        icon={Activity}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span className={cn("text-xs font-medium", isConnected ? "text-emerald-400" : "text-red-500")}>
                {isConnected ? t("dashboard.connected") : t("dashboard.disconnected")}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
              <Input
                placeholder={t("dashboard.searchPlaceholder")}
                className={`h-9 w-64 pl-10 ${inputClass}`}
              />
            </div>
            <Select>
              <SelectTrigger size="sm" className={`w-32 ${inputClass}`}>
                <SelectValue placeholder={t("dashboard.timeRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{t("dashboard.last1Hour")}</SelectItem>
                <SelectItem value="6h">{t("dashboard.last6Hours")}</SelectItem>
                <SelectItem value="24h">{t("time.today")}</SelectItem>
                <SelectItem value="7d">{t("time.last7days")}</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Brain className="size-4" />
              {t("dashboard.enterAIWorkbench")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        }
      />

      {/* Bento Grid 布局 */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] p-5 -mx-5">
        <div className="bento-grid">
        {/* KPI 卡片行 */}
        {coreKPIs.map((kpi) => {
          const override = kpiOverrides[kpi.id]
          const merged = override
            ? { ...kpi, value: override.value ?? kpi.value, trend: override.trend ?? kpi.trend, subtitle: override.subtitle ?? kpi.subtitle }
            : kpi
          return <KPICard key={kpi.id} item={merged} />
        })}

        {/* 左侧：最高优先级告警 - 占2列2行 */}
        <div className="bento-col-span-2 bento-row-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              <h2 className={String(TYPOGRAPHY.h2)}>{t("dashboard.highPriorityAlerts")}</h2>
              <span
                className={cn(
                  TYPOGRAPHY.micro,
                  "px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold"
                )}
              >
                {t("dashboard.needsImmediateAttention")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}
            >
              {t("dashboard.allAlerts")}
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {priorityAlerts.map((alert) => (
              <PriorityAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* 右侧上：AI能力概览 */}
        <div className="bento-col-span-2">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="size-5 text-primary" />
                  <h2 className={String(TYPOGRAPHY.h2)}>{t("dashboard.aiOverview")}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}
                >
                  {t("dashboard.detailedReport")}
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {aiOverview.map((metric) => (
                  <AIMetricCard key={metric.label} item={metric} />
                ))}
              </div>

              <div className="rounded-lg bg-white/[0.03] p-3 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{t("dashboard.analyzingEvents")}</span>
                  <span className="font-semibold text-zinc-100">156 个</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{t("dashboard.todayAutoDisposal")}</span>
                  <span className="font-semibold text-emerald-400">+42 个</span>
                </div>
                <Button variant="outline" className="w-full mt-1 gap-2 border-white/[0.08] hover:bg-white/[0.04] hover:border-cyan-500/30">
                  <Eye className="size-4" />
                  {t("dashboard.viewAIDetails")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧下：实时告警流 */}
        <div className="bento-col-span-2">
          <RealtimeAlertStream />
        </div>
      </div>
    </div>
  </div>
  )
}
