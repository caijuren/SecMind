"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRealtimeAlerts } from "@/hooks/use-realtime"
import {
  Bell,
  Briefcase,
  ShieldAlert,
  Activity,
  Zap,
  BookOpen,
  Search,
  ArrowRight,
  AlertCircle,
  Clock,
  Eye,
  Brain,
  TrendingUp,
  ChevronDown,
  Loader2,
  FileText,
  Lock,
  Shield,
  Globe,
  Server,
  Database,
  Radio,
  User,
  Target,
  Layers,
  CheckCircle2,
  Network,
  ArrowRight as ArrowRightIcon,
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
import { inputClass } from "@/lib/admin-ui"
import { useLocaleStore } from "@/store/locale-store"
import {
  TYPOGRAPHY,
  CARD,
  RADIUS,
  COLORS,
  getSeverityStyles,
} from "@/lib/design-system"

// ==================== 数据定义 ====================

/** 核心KPI - 聚焦"行动需求"而非"统计数字" */
const coreKPIs = [
  {
    id: 'pending-alerts',
    label: '待处理告警',
    value: '23',
    icon: Bell,
    severity: 'critical' as const,
    trend: { direction: 'up' as const, value: '+12.5%' },
    subtitle: '3条需立即处理',
    link: '/alerts?status=pending',
  },
  {
    id: 'pending-cases',
    label: '进行中案件',
    value: '8',
    icon: Briefcase,
    severity: 'high' as const,
    trend: { direction: 'down' as const, value: '-2' },
    subtitle: '2件今日到期',
    link: '/cases?status=active',
  },
  {
    id: 'active-threats',
    label: '活跃威胁',
    value: '7',
    icon: ShieldAlert,
    severity: 'medium' as const,
    trend: null,
    subtitle: '2个正在攻击中',
    link: '/threats',
  },
  {
    id: 'ai-insights',
    label: 'AI新发现',
    value: '12',
    icon: Brain,
    severity: 'primary' as const,
    trend: { direction: 'up' as const, value: '+5' },
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

/** 最近案件 */
const recentCases = [
  { id: 'CASE-2024-0891', type: 'APT攻击链', level: 'critical' as const, status: '调查中', owner: '张明远', updatedAt: '10分钟前' },
  { id: 'CASE-2024-0890', type: '凭证窃取', level: 'high' as const, status: '处置中', owner: '李思涵', updatedAt: '25分钟前' },
  { id: 'CASE-2024-0889', type: '数据外泄', level: 'high' as const, status: '待确认', owner: '-', updatedAt: '1小时前' },
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

// ==================== AI能力展示板块数据 ====================

interface DataSource {
  id: string
  name: string
  icon: React.ElementType
  status: "active" | "idle" | "error"
  eventCount: number
  color: string
}

interface AIAgent {
  id: string
  name: string
  icon: React.ElementType
  status: "thinking" | "analyzing" | "waiting" | "complete"
  color: string
}

interface AIStep {
  id: string
  timestamp: string
  agent: string
  agentIcon: React.ElementType
  agentColor: string
  status: "working" | "complete"
  message: string
  result?: string[]
}

const demoDataSources: DataSource[] = [
  { id: "email", name: "邮件网关", icon: FileText, status: "active", eventCount: 1247, color: "#ef4444" },
  { id: "vpn", name: "VPN网关", icon: Lock, status: "active", eventCount: 389, color: "#f97316" },
  { id: "edr", name: "EDR终端", icon: Shield, status: "active", eventCount: 567, color: "#ef4444" },
  { id: "waf", name: "WAF防火墙", icon: Globe, status: "active", eventCount: 234, color: "#eab308" },
  { id: "ueba", name: "UEBA行为", icon: Activity, status: "active", eventCount: 678, color: "#f97316" },
  { id: "ad", name: "AD域控", icon: Server, status: "idle", eventCount: 145, color: "#22c55e" },
  { id: "siem", name: "SIEM平台", icon: Database, status: "active", eventCount: 2345, color: "#3b82f6" },
  { id: "dlp", name: "DLP系统", icon: Eye, status: "active", eventCount: 89, color: "#a78bfa" },
]

const demoAIAgents: AIAgent[] = [
  { id: "soc", name: "SOC 分析员", icon: Radio, status: "complete", color: "#3b82f6" },
  { id: "identity", name: "身份分析员", icon: User, status: "complete", color: "#8b5cf6" },
  { id: "threat", name: "威胁情报员", icon: Target, status: "analyzing", color: "#ef4444" },
  { id: "ueba", name: "行为分析师", icon: Activity, status: "thinking", color: "#f97316" },
  { id: "forensics", name: "取证分析员", icon: Layers, status: "waiting", color: "#a78bfa" },
  { id: "reasoning", name: "推理引擎", icon: Brain, status: "waiting", color: "#a78bfa" },
  { id: "conclusion", name: "结论生成器", icon: CheckCircle2, status: "waiting", color: "#22c55e" },
]

const demoAISteps: AIStep[] = [
  {
    id: "1-1", timestamp: "09:15:23", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
    status: "complete", message: "收到紧急告警 - 检测到高仿域名邮件 secm1nd.com",
    result: ["发件人: it-support@secm1nd.com", "收件人: 财务部全员(23人)", "严重程度: CRITICAL"]
  },
  {
    id: "1-2", timestamp: "09:15:25", agent: "Mail Agent", agentIcon: FileText, agentColor: "#f97316",
    status: "complete", message: "正在分析邮件内容...",
    result: ["✓ 域名相似度: 95%", "✓ 包含恶意链接", "✓ 附件: fake-oa-update.exe"]
  },
  {
    id: "1-3", timestamp: "09:15:28", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
    status: "working", message: "查询威胁情报库...",
    result: ["✓ IP已标记为恶意", "✓ 关联APT-41组织", "✓ 首次出现: 2025年12月"]
  },
]

// ==================== 组件 ====================

/** KPI卡片 - 行动导向设计 */
function KPICard({ item }: { item: typeof coreKPIs[number] }) {
  const Icon = item.icon
  const severityColor = item.severity === 'primary'
    ? COLORS.primary[500]
    : COLORS.severity[item.severity === 'critical' || item.severity === 'high' || item.severity === 'medium' ? item.severity : 'low'].solid

  return (
    <Card className={cn(CARD.elevated, "group cursor-pointer hover:border-slate-300 transition-[shadow,transform]")}>
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
              <p className={cn(TYPOGRAPHY.body, "font-medium text-slate-700")}>{item.label}</p>
              <p className={cn(TYPOGRAPHY.micro, "text-slate-400 mt-0.5")}>{item.subtitle}</p>
            </div>
          </div>

          {item.trend && (
            <span
              className={cn(
                TYPOGRAPHY.micro,
                "font-semibold px-2 py-1 rounded-md",
                item.trend.direction === 'up' && item.severity !== 'primary'
                  ? "bg-red-50 text-red-600"
                  : item.severity === 'primary'
                  ? "bg-cyan-50 text-cyan-600"
                  : "bg-emerald-50 text-emerald-600"
              )}
            >
              {item.trend.value}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {item.value}
          </span>
          <Button variant="ghost" size="sm" className={cn(TYPOGRAPHY.micro, "text-primary hover:bg-primary/5 gap-1")}>
            查看
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** 优先级告警卡片 */
function PriorityAlertCard({ alert }: { alert: typeof priorityAlerts[number] }) {
  const severity = getSeverityStyles(alert.level)

  return (
    <div
      className={cn(
        CARD.base,
        "p-4 cursor-pointer hover:shadow-md transition-[shadow,transform] duration-200",
        alert.level === 'critical' && "border-l-4 border-l-red-500"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded", TYPOGRAPHY.micro, "font-semibold", severity.bg, severity.textColor)}>
            {alert.level === 'critical' ? '严重' : alert.level === 'high' ? '高危' : '中危'}
          </span>
          <span className={cn(TYPOGRAPHY.micro, "font-mono tabular-nums text-slate-400")}>{alert.time}</span>
          <span className={cn(TYPOGRAPHY.micro, "text-slate-500 font-medium")}>{alert.source}</span>
        </div>
        <span
          className={cn(
            TYPOGRAPHY.micro,
            "px-2 py-0.5 rounded-full",
            alert.status === 'analyzing'
              ? "bg-blue-50 text-blue-600 animate-pulse"
              : alert.status === 'pending'
              ? "bg-orange-50 text-orange-600"
              : "bg-cyan-50 text-cyan-600"
          )}
        >
          {alert.status === 'analyzing' ? 'AI分析中' : alert.status === 'pending' ? '待处理' : '调查中'}
        </span>
      </div>

      <h4 className={cn(TYPOGRAPHY.h3, "text-slate-900 mb-2")}>{alert.title}</h4>
      <p className={cn(TYPOGRAPHY.body, "text-slate-600 mb-3 line-clamp-2")}>{alert.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-slate-400" />
          <span className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
            负责人: <strong className="text-slate-700">{alert.assignee}</strong>
          </span>
        </div>
        <Button variant="outline" size="sm" className={cn(TYPOGRAPHY.micro, "gap-1")}>
          立即处理
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/** 案件列表项 */
function CaseItem({ caseItem }: { caseItem: typeof recentCases[number] }) {
  const severity = getSeverityStyles(caseItem.level)

  return (
    <div className={cn(CARD.ghost, "px-4 py-3 flex items-center justify-between group hover:bg-white")}>
      <div className="flex items-center gap-4 min-w-0">
        <span className={cn(TYPOGRAPHY.caption, "font-mono text-slate-400 shrink-0")}>{caseItem.id}</span>
        <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-700 truncate")}>{caseItem.type}</span>
        <span
          className={cn(
            "shrink-0 inline-flex items-center px-2 py-0.5 rounded",
            TYPOGRAPHY.micro,
            "font-medium",
            severity.bg,
            severity.textColor
          )}
        >
          {caseItem.level === 'critical' ? '严重' : '高危'}
        </span>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded text-xs font-medium",
            caseItem.status === '调查中'
              ? "bg-blue-50 text-blue-700"
              : caseItem.status === '处置中'
              ? "bg-orange-50 text-orange-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {caseItem.status}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className={cn(TYPOGRAPHY.caption, "text-slate-500")}>{caseItem.owner}</span>
        <span className={cn(TYPOGRAPHY.micro, "text-slate-400 w-16 text-right")}>{caseItem.updatedAt}</span>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            TYPOGRAPHY.micro,
            "opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-primary"
          )}
        >
          查看
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
          <span className={cn(TYPOGRAPHY.caption, "text-slate-600")}>{item.label}</span>
        </div>
        <span
          className={cn(
            TYPOGRAPHY.micro,
            "font-semibold",
            isPositive ? "text-emerald-600" : "text-red-600"
          )}
        >
          {isPositive ? '+' : ''}{item.change}
        </span>
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">{item.value}</div>
    </div>
  )
}

/** 实时告警流 - 优化版 */
function RealtimeAlertStream() {
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
      setAlerts((prev) => [newAlert, ...prev.slice(0, 19)])
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
            <div className="relative">
              <span className="absolute flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            </div>
            <Zap className="size-5 text-cyan-600" />
            <h2 className={String(TYPOGRAPHY.h2)}>实时告警流</h2>
            {isConnected ? (
              <Wifi className="size-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="size-3.5 text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {newAlertCount > 0 && (
              <button
                onClick={clearNewAlerts}
                className={cn(TYPOGRAPHY.micro, "px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold animate-pulse cursor-pointer hover:bg-red-100 transition-colors")}
              >
                +{newAlertCount} 新告警
              </button>
            )}
            <span className={cn(TYPOGRAPHY.caption, "text-slate-400")}>共 {alerts.length} 条</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(TYPOGRAPHY.micro, "gap-1 text-slate-600")}
            >
              {isExpanded ? '收起' : '展开'}
              <ChevronDown className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 transition-[max-height] duration-300",
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
                  idx === 0 ? "bg-cyan-50/50 border border-cyan-200" : "hover:bg-slate-50"
                )}
              >
                <span className={cn(TYPOGRAPHY.caption, "font-mono tabular-nums text-slate-400 shrink-0 w-16")}>
                  {alert.time}
                </span>
                <span className={cn(TYPOGRAPHY.caption, "text-slate-500 font-medium shrink-0 w-10")}>
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
                <span className={cn(TYPOGRAPHY.body, "text-slate-700 truncate flex-1")}>
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

// ==================== AI能力展示板块组件 ====================

/** 数据输入流卡片 */
function AIDataSourceCard({ source, index }: { source: DataSource; index: number }) {
  const [pulse, setPulse] = useState(false)
  const Icon = source.icon

  useEffect(() => {
    if (source.status === "active") {
      const interval = setInterval(() => setPulse((p) => !p), 2000 + index * 300)
      return () => clearInterval(interval)
    }
  }, [source.status, index])

  return (
    <div className="group relative">
      <div className={`
        relative rounded-lg border p-2 transition-colors duration-200
        ${source.status === "active"
          ? `border-current/20 bg-white hover:border-current/40`
          : "border-slate-200 bg-slate-50"}
      `} style={{ color: source.color }}>
        <div className="flex items-center gap-2">
          <div className={`flex size-6 items-center justify-center rounded-md transition-[transform] duration-300 ${
            source.status === "active" ? "bg-current/10 scale-105" : "bg-slate-100"
          }`} style={{ color: source.color }}>
            <Icon className="size-3" />
          </div>
          <span className={cn(TYPOGRAPHY.micro, "font-medium text-slate-700 truncate")}>{source.name}</span>
          <span className="text-[10px] font-mono text-slate-400 tabular-nums ml-auto">{source.eventCount.toLocaleString()}</span>
          <div className={`size-2 rounded-full ${source.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
        </div>
      </div>
      {source.status === "active" && pulse && (
        <div className="absolute -top-1 -right-1 size-2 rounded-full animate-ping" style={{ backgroundColor: source.color }} />
      )}
    </div>
  )
}

/** AI分析步骤卡片 */
function AIStepCard({ step, isLast }: { step: AIStep; isLast: boolean }) {
  const Icon = step.agentIcon

  return (
    <div
      className={cn(
        "relative rounded-xl border p-3.5 transition-[shadow,transform,border-color] duration-700",
        isLast
          ? "border-current/30 bg-white shadow-md scale-[1.01]"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
      style={{ color: isLast ? step.agentColor : undefined }}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${step.agentColor}15` }}>
          <Icon className="size-4" style={{ color: step.agentColor }} />
          {step.status === "working" && (
            <>
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white animate-ping" style={{ backgroundColor: step.agentColor }} />
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full" style={{ backgroundColor: step.agentColor }} />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={cn(TYPOGRAPHY.caption, "font-mono tabular-nums text-slate-400")}>{step.timestamp}</span>
              <span className={cn(TYPOGRAPHY.micro, "font-semibold text-slate-600")}>{step.agent}</span>
              <span className={cn(
                TYPOGRAPHY.micro,
                "px-1.5 py-0.5 rounded-full",
                step.status === "complete"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600 animate-pulse"
              )}>
                {step.status === "complete" ? "✓ 完成" : "● 分析中"}
              </span>
            </div>
          </div>

          <h4 className={cn(TYPOGRAPHY.body, "font-semibold text-slate-800 mb-1.5")}>{step.message}</h4>

          {step.result && (
            <ul className="space-y-1">
              {step.result.map((item, i) => (
                <li key={i} className={cn(TYPOGRAPHY.caption, "text-slate-600 flex items-center gap-1.5")}>
                  <span className="size-1 rounded-full bg-slate-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/** AI协作Agent卡片 */
function AICollabAgent({ agent }: { agent: AIAgent }) {
  const Icon = agent.icon

  const statusStyles = {
    thinking: { bg: "bg-blue-50", text: "text-blue-700", label: "思考中..." },
    analyzing: { bg: "bg-amber-50", text: "text-amber-700", label: "分析中..." },
    waiting: { bg: "bg-slate-100", text: "text-slate-600", label: "待命中" },
    complete: { bg: "bg-emerald-50", text: "text-emerald-700", label: "已完成" },
  }

  const style = statusStyles[agent.status]

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 transition-colors duration-200 hover:border-slate-300">
      <div className="flex items-center gap-2.5">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-md transition-[transform] duration-200 group-hover:scale-105" style={{ backgroundColor: `${agent.color}10` }}>
          <Icon className="size-4" style={{ color: agent.color }} />
          {(agent.status === "thinking" || agent.status === "analyzing") && (
            <>
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white animate-ping" style={{ backgroundColor: agent.color }} />
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={cn(TYPOGRAPHY.micro, "font-semibold text-slate-800 truncate")}>{agent.name}</span>
            <span className={cn(TYPOGRAPHY.micro, "font-medium px-1.5 py-0.5 rounded-full", style.bg, style.text, "shrink-0")}>
              {style.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** AI能力展示板块 */
function AICapabilityShowcase() {
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'collab'>('analysis')

  return (
    <Card className={CARD.elevated}>
      <CardContent className="p-5">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="size-5 text-primary" />
            <h2 className={String(TYPOGRAPHY.h2)}>AI智能分析中心</h2>
            <span className={cn(TYPOGRAPHY.micro, "px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-semibold")}>
              实时演示
            </span>
          </div>
          <Button variant="ghost" size="sm" className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}>
            进入AI工作台
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Tab切换 */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-lg">
          {[
            { key: 'input' as const, label: '数据输入流', icon: Database },
            { key: 'analysis' as const, label: 'AI分析结果', icon: Brain },
            { key: 'collab' as const, label: 'AI协作', icon: Network },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors duration-200",
                  TYPOGRAPHY.micro,
                  "font-medium",
                  activeTab === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 内容区域 */}
        <div className="min-h-[280px]">
          {activeTab === 'input' && (
            <div className="space-y-2">
              <div className={cn(TYPOGRAPHY.micro, "font-semibold text-slate-600 flex items-center gap-1.5 mb-2")}>
                <Zap className="size-3.5" />
                实时数据接入
                <span className="text-slate-400 font-normal">({demoDataSources.filter(s => s.status === 'active').length} 个活跃源)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoDataSources.map((source, index) => (
                  <AIDataSourceCard key={source.id} source={source} index={index} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-3">
              <div className={cn(TYPOGRAPHY.micro, "font-semibold text-slate-600 flex items-center gap-1.5 mb-2")}>
                <Brain className="size-3.5" />
                事件分析进度
                <span className="text-slate-400 font-normal">(钓鱼邮件攻击)</span>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
                {demoAISteps.map((step, index) => (
                  <AIStepCard key={step.id} step={step} isLast={index === demoAISteps.length - 1} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'collab' && (
            <div className="space-y-2">
              <div className={cn(TYPOGRAPHY.micro, "font-semibold text-slate-600 flex items-center gap-1.5 mb-2")}>
                <Network className="size-3.5" />
                Agent协作状态
                <span className="text-slate-400 font-normal">({demoAIAgents.filter(a => a.status === 'complete').length}/{demoAIAgents.length} 已完成)</span>
              </div>
              <div className="space-y-2">
                {demoAIAgents.map((agent) => (
                  <AICollabAgent key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== 主页面 ====================

export default function DashboardPage() {
  useLocaleStore()
  const { newAlertCount, clearNewAlerts, isConnected, lastMessage } = useRealtimeAlerts()
  const [kpiOverrides, setKpiOverrides] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "stats_update") return
    setKpiOverrides(prev => ({ ...prev, ...lastMessage.data }))
  }, [lastMessage])

  return (
    <div className="space-y-6">
      {newAlertCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700">
              收到 {newAlertCount} 条新实时告警
            </span>
            {!isConnected && (
              <span className="text-xs text-slate-400 ml-2">(WebSocket 已断开，显示为缓存数据)</span>
            )}
          </div>
          <button
            onClick={clearNewAlerts}
            className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            确认
          </button>
        </div>
      )}
      {/* 页面标题 */}
      <PageHeader
        icon={Activity}
        title="运营概览"
        subtitle="实时态势感知 · 掌握当前安全状态"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span className={cn("text-xs font-medium", isConnected ? "text-emerald-600" : "text-red-500")}>
                {isConnected ? "实时连接" : "连接断开"}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="搜索告警、案件..."
                className={`h-9 w-64 pl-10 ${inputClass}`}
              />
            </div>
            <Select>
              <SelectTrigger size="sm" className={`w-32 ${inputClass}`}>
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">最近1小时</SelectItem>
                <SelectItem value="6h">最近6小时</SelectItem>
                <SelectItem value="24h">今天</SelectItem>
                <SelectItem value="7d">本周</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Brain className="size-4" />
              进入AI工作台
              <ArrowRight className="size-4" />
            </Button>
          </div>
        }
      />

      {/* 第一行：核心KPI - 聚焦"需要行动的内容" */}
      <div className="grid grid-cols-4 gap-4">
        {coreKPIs.map((kpi) => {
          const override = kpiOverrides[kpi.id]
          const merged = override
            ? { ...kpi, value: override.value ?? kpi.value, trend: override.trend ?? kpi.trend, subtitle: override.subtitle ?? kpi.subtitle }
            : kpi
          return <KPICard key={kpi.id} item={merged} />
        })}
      </div>

      {/* 第二行：左侧最高优先级告警 + 右侧最近案件 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：最高优先级告警 */}
        <div className="col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              <h2 className={String(TYPOGRAPHY.h2)}>最高优先级告警</h2>
              <span
                className={cn(
                  TYPOGRAPHY.micro,
                  "px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold"
                )}
              >
                需立即关注
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}
            >
              全部告警
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {priorityAlerts.map((alert) => (
              <PriorityAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* 右侧：最近案件 */}
        <div className="col-span-5">
          <Card className={CARD.default}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-5 text-orange-500" />
                  <h2 className={String(TYPOGRAPHY.h2)}>最近案件</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}
                >
                  全部案件
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="divide-y divide-slate-100">
                {recentCases.map((caseItem) => (
                  <CaseItem key={caseItem.id} caseItem={caseItem} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 第三行：AI智能分析中心（新增板块） */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <AICapabilityShowcase />
        </div>
      </div>

      {/* 第四行：左侧实时告警流 + 右侧AI能力概览 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：实时告警流 */}
        <div className="col-span-7">
          <RealtimeAlertStream />
        </div>

        {/* 右侧：AI能力概览 */}
        <div className="col-span-5">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="size-5 text-primary" />
                  <h2 className={String(TYPOGRAPHY.h2)}>AI能力概览</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(TYPOGRAPHY.caption, "gap-1 text-primary")}
                >
                  详细报告
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {aiOverview.map((metric) => (
                  <AIMetricCard key={metric.label} item={metric} />
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">正在分析的安全事件</span>
                  <span className="font-semibold text-slate-900">156 个</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">今日自动处置</span>
                  <span className="font-semibold text-emerald-600">+42 个</span>
                </div>
                <Button variant="outline" className="w-full mt-3 gap-2">
                  <Eye className="size-4" />
                  查看AI分析详情
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
