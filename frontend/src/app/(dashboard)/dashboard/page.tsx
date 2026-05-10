"use client"

import { useState, useEffect, useRef } from "react"
import {
  Bell,
  Briefcase,
  Timer,
  Wrench,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Brain,
  Activity,
  Zap,
  BookOpen,
  RefreshCw,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { useLocaleStore } from "@/store/locale-store"

const statCards = [
  {
    label: "今日告警数",
    value: "1,247",
    icon: Bell,
    color: "#ef4444",
    trend: "up" as const,
    percent: "12.5%",
  },
  {
    label: "待处理案件",
    value: "23",
    icon: Briefcase,
    color: "#f97316",
    trend: "down" as const,
    percent: "8.3%",
  },
  {
    label: "MTTD",
    value: "4.2min",
    icon: Timer,
    color: "#06b6d4",
    trend: "down" as const,
    percent: "15.2%",
  },
  {
    label: "MTTR",
    value: "18.7min",
    icon: Wrench,
    color: "#a855f7",
    trend: "up" as const,
    percent: "3.1%",
  },
]

const alertTrendData = [
  { day: "周一", value: 156, bar: 65 },
  { day: "周二", value: 189, bar: 78 },
  { day: "周三", value: 134, bar: 55 },
  { day: "周四", value: 210, bar: 88 },
  { day: "周五", value: 178, bar: 74 },
  { day: "周六", value: 95, bar: 40 },
  { day: "周日", value: 112, bar: 47 },
]

const alertLevelDistribution = [
  { level: "P0", label: "严重", count: 47, percent: 3.8, color: "#ef4444" },
  { level: "P1", label: "高危", count: 186, percent: 14.9, color: "#f97316" },
  { level: "P2", label: "中危", count: 423, percent: 33.9, color: "#eab308" },
  { level: "P3", label: "低危", count: 591, percent: 47.4, color: "#06b6d4" },
]

const recentCases = [
  { id: "CASE-2024-0891", attackType: "APT攻击链", riskLevel: "critical", status: "调查中", time: "10分钟前" },
  { id: "CASE-2024-0890", attackType: "凭证窃取", riskLevel: "high", status: "处置中", time: "25分钟前" },
  { id: "CASE-2024-0889", attackType: "数据外泄", riskLevel: "high", status: "待确认", time: "1小时前" },
  { id: "CASE-2024-0888", attackType: "WebShell植入", riskLevel: "critical", status: "已关闭", time: "2小时前" },
  { id: "CASE-2024-0887", attackType: "暴力破解", riskLevel: "medium", status: "已关闭", time: "3小时前" },
]

const aiStats = [
  { label: "今日推理次数", value: "3,847", icon: Brain, color: "#06b6d4" },
  { label: "准确率", value: "96.8%", icon: Activity, color: "#22c55e" },
  { label: "知识引用次数", value: "1,205", icon: BookOpen, color: "#f97316" },
  { label: "学习更新数", value: "89", icon: RefreshCw, color: "#a855f7" },
]

const realtimeAlerts = [
  { time: "14:35:22", source: "EDR", level: "critical", description: "主机WIN-DESK-15检测到PowerShell编码执行行为" },
  { time: "14:35:18", source: "VPN", level: "critical", description: "用户zhangwei从境外IP登录，触发不可能旅行检测" },
  { time: "14:35:15", source: "Email", level: "critical", description: "CFO收到伪装DHL投递通知的钓鱼邮件" },
  { time: "14:35:10", source: "Firewall", level: "high", description: "内网主机向已知C2地址发起加密通信" },
  { time: "14:35:05", source: "IAM", level: "high", description: "服务账号app-service异常提权至Administrators组" },
  { time: "14:35:01", source: "DNS", level: "critical", description: "检测到DGA域名高频TXT查询，疑似DNS隧道" },
  { time: "14:34:55", source: "EDR", level: "critical", description: "WEB-SVR上传目录发现ChinaChopper WebShell" },
  { time: "14:34:50", source: "Firewall", level: "high", description: "源代码外传至个人云盘，DLP策略触发" },
  { time: "14:34:45", source: "VPN", level: "medium", description: "用户linfeng同时从3个不同城市设备在线" },
  { time: "14:34:40", source: "Email", level: "high", description: "仿冒IT支持域名发送钓鱼邮件至全体员工" },
]

const riskLevelConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "严重", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  high: { label: "高危", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  medium: { label: "中危", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  low: { label: "低危", color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200" },
}

const alertLevelBadgeConfig: Record<string, { color: string; bg: string }> = {
  critical: { color: "text-red-600", bg: "bg-red-50 border-red-200" },
  high: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  medium: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  low: { color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200" },
}

function StatCard({ item }: { item: typeof statCards[number] }) {
  const Icon = item.icon
  const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown
  const isPositive = item.trend === "up"
  return (
    <Card
      className="border-slate-200 bg-white shadow-sm"
      style={{
        boxShadow: `0 1px 3px ${item.color}08`,
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500">{item.label}</span>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)`,
              border: `1px solid ${item.color}25`,
            }}
          >
            <Icon className="size-4" style={{ color: item.color }} />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-slate-900 font-mono">{item.value}</span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-[#ef4444]" : "text-[#22c55e]"
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

function AlertTrendChart() {
  const maxBar = Math.max(...alertTrendData.map((d) => d.bar))
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-600" />
            <span className="text-sm font-medium text-slate-800">告警趋势</span>
          </div>
          <span className="text-xs text-slate-400">近7天</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {alertTrendData.map((item, idx) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500 font-mono">{item.value}</span>
              <div className="w-full relative" style={{ height: "120px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${(item.bar / maxBar) * 100}%`,
                    background: `linear-gradient(to top, rgba(6,182,212,0.4), rgba(6,182,212,0.1))`,
                    borderTop: "2px solid rgba(6,182,212,0.7)",
                  }}
                />
                {idx < alertTrendData.length - 1 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                    style={{ zIndex: 1 }}
                  >
                    <line
                      x1="50%"
                      y1={`${100 - (item.bar / maxBar) * 100}%`}
                      x2="150%"
                      y2={`${100 - (alertTrendData[idx + 1].bar / maxBar) * 100}%`}
                      stroke="rgba(6,182,212,0.5)"
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    />
                    <circle
                      cx="50%"
                      cy={`${100 - (item.bar / maxBar) * 100}%`}
                      r="3"
                      fill="#06b6d4"
                    />
                  </svg>
                )}
                {idx === alertTrendData.length - 1 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    <circle
                      cx="50%"
                      cy={`${100 - (item.bar / maxBar) * 100}%`}
                      r="3"
                      fill="#06b6d4"
                    />
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{item.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AlertLevelDistribution() {
  const total = alertLevelDistribution.reduce((s, d) => s + d.count, 0)
  let accumulated = 0
  const segments = alertLevelDistribution.map((item) => {
    const start = accumulated
    accumulated += item.percent
    return { ...item, start }
  })

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-cyan-600" />
            <span className="text-sm font-medium text-slate-800">告警级别分布</span>
          </div>
          <span className="text-xs text-slate-400">总计 {total.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {segments.map((seg) => (
                <circle
                  key={seg.level}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="3"
                  strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
                  strokeDashoffset={`${-seg.start}`}
                  opacity="0.85"
                />
              ))}
              <circle cx="18" cy="18" r="12" fill="rgba(248,250,252,0.9)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-slate-900 font-mono">{total.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">告警总数</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {alertLevelDistribution.map((item) => (
              <div key={item.level} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-500 w-6">{item.level}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentCasesTable() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-cyan-600" />
            <span className="text-sm font-medium text-slate-800">最近案件</span>
          </div>
          <Button variant="ghost" size="xs" className="text-slate-400 hover:text-cyan-600">
            查看全部
          </Button>
        </div>
        <div className="space-y-2">
          {recentCases.map((c) => {
            const config = riskLevelConfig[c.riskLevel]
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-slate-400 shrink-0">{c.id}</span>
                  <span className="text-xs text-slate-700 truncate">{c.attackType}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                      config.bg,
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-400 w-12 text-center">{c.status}</span>
                  <span className="text-[10px] text-slate-300 w-14 text-right">{c.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function AIInferenceStats() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-cyan-600" />
            <span className="text-sm font-medium text-slate-800">AI推理统计</span>
          </div>
          <span className="text-xs text-slate-400">今日</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {aiStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-lg bg-slate-50 border border-slate-100 p-3"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="size-3.5" style={{ color: stat.color }} />
                  <span className="text-[10px] text-slate-400">{stat.label}</span>
                </div>
                <span className="text-xl font-bold text-slate-900 font-mono">{stat.value}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function RealtimeAlertStream() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [alerts, setAlerts] = useState(realtimeAlerts)

  useEffect(() => {
    const interval = setInterval(() => {
      const sources = ["EDR", "VPN", "IAM", "Email", "Firewall", "DNS"]
      const levels: Array<"critical" | "high" | "medium"> = ["critical", "high", "medium"]
      const descriptions = [
        "检测到可疑PowerShell编码执行行为",
        "用户从境外IP登录，触发不可能旅行检测",
        "收到伪装投递通知的钓鱼邮件",
        "内网主机向已知C2地址发起加密通信",
        "服务账号异常提权操作",
        "DGA域名高频查询，疑似DNS隧道",
        "上传目录发现WebShell文件",
        "源代码外传至个人云盘",
        "用户同时从多个不同城市设备在线",
        "仿冒IT支持域名发送钓鱼邮件",
      ]
      const now = new Date()
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`

      const newAlert = {
        time: ts,
        source: sources[Math.floor(Math.random() * sources.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
      }

      setAlerts((prev) => [newAlert, ...prev.slice(0, 9)])
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
            </span>
            <Zap className="size-4 text-cyan-600" />
            <span className="text-sm font-medium text-slate-800">实时告警流</span>
          </div>
          <span className="text-xs text-slate-400">最近10条</span>
        </div>
        <div ref={scrollRef} className="space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {alerts.map((alert, idx) => {
            const badgeConfig = alertLevelBadgeConfig[alert.level]
            const levelLabel = riskLevelConfig[alert.level]?.label ?? ""
            return (
              <div
                key={`${alert.time}-${idx}`}
                className={cn(
                  "flex items-center gap-3 rounded-md bg-slate-50 border border-slate-100 px-3 py-2 transition-all duration-500",
                  idx === 0 && "border-cyan-300/50 animate-in slide-in-from-top-1 duration-300"
                )}
              >
                <span className="text-[10px] font-mono text-slate-400 shrink-0 w-14">{alert.time}</span>
                <span className="text-[10px] text-slate-500 shrink-0 w-14">{alert.source}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium shrink-0",
                    badgeConfig.bg,
                    badgeConfig.color
                  )}
                >
                  {levelLabel}
                </span>
                <span className="text-xs text-slate-600 truncate">{alert.description}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useLocaleStore()

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="运营概览"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <Input
                placeholder="搜索告警、案件..."
                className="h-7 w-48 border-slate-200 bg-white pl-8 text-xs text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <Select>
              <SelectTrigger size="sm" className="w-28 border-slate-200 bg-white text-slate-600">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1小时</SelectItem>
                <SelectItem value="6h">6小时</SelectItem>
                <SelectItem value="24h">24小时</SelectItem>
                <SelectItem value="7d">7天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <AlertTrendChart />
        </div>
        <div className="col-span-2">
          <AlertLevelDistribution />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <RecentCasesTable />
        </div>
        <div className="col-span-2">
          <AIInferenceStats />
        </div>
      </div>

      <RealtimeAlertStream />
    </div>
  )
}
