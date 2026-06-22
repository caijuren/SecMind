"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AlertTriangle,
  Globe,
  Timer,
  Wrench,
  Bot,
  Activity,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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
import { useMockDataStore } from "@/store/mock-data-store"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts"
import { usePageTitle } from "@/hooks/use-page-title"
import { inputClass } from "@/lib/admin-ui"
import { CARD, TYPOGRAPHY } from "@/lib/design-system"

import { DashboardHero } from "@/components/situation-room/DashboardHero"
import { DashboardAlertPanel } from "@/components/situation-room/DashboardAlertPanel"
import { DashboardAttackPanel } from "@/components/situation-room/DashboardAttackPanel"
import dynamic from "next/dynamic"

const MitreMatrix = dynamic(() => import("@/components/situation-room/mitre-matrix").then((m) => m.MitreMatrix), {
  ssr: false,
  loading: () => <div className="h-[200px] rounded-xl bg-muted/20 animate-pulse" />,
})

// ==================== 类型定义 ====================

interface AttackPoint {
  id: string
  name: string
  lat: number
  lng: number
  severity: "critical" | "high" | "medium" | "low"
  type: "source" | "target"
  timestamp: number
}

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

// 告警 severity 分布数据
const ALERT_SEVERITY_DATA = {
  critical: 42,
  high: 186,
  medium: 523,
  low: 533,
}

// 数据源告警分布
const DATA_SOURCE_STATS = [
  { name: "EDR", count: 312, online: true },
  { name: "Firewall", count: 287, online: true },
  { name: "VPN", count: 198, online: true },
  { name: "Email", count: 176, online: true },
  { name: "DNS", count: 145, online: true },
  { name: "IAM", count: 166, online: false },
]

// ==================== Mock 数据 ====================

const ATTACK_POINTS: AttackPoint[] = [
  { id: "ap1", name: "莫斯科", lat: 55.75, lng: 37.62, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap2", name: "拉各斯", lat: 6.52, lng: 3.38, severity: "high", type: "source", timestamp: Date.now() },
  { id: "ap3", name: "柏林", lat: 52.52, lng: 13.41, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap4", name: "洛杉矶", lat: 34.05, lng: -118.24, severity: "high", type: "source", timestamp: Date.now() },
  { id: "ap5", name: "平壤", lat: 39.03, lng: 125.75, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap6", name: "德黑兰", lat: 35.69, lng: 51.39, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap7", name: "北京", lat: 39.9, lng: 116.4, severity: "critical", type: "target", timestamp: Date.now() },
  { id: "ap8", name: "上海", lat: 31.23, lng: 121.47, severity: "critical", type: "target", timestamp: Date.now() },
  { id: "ap9", name: "深圳", lat: 22.54, lng: 114.06, severity: "high", type: "target", timestamp: Date.now() },
  { id: "ap10", name: "杭州", lat: 30.27, lng: 120.15, severity: "medium", type: "target", timestamp: Date.now() },
  { id: "ap11", name: "广州", lat: 23.13, lng: 113.26, severity: "high", type: "target", timestamp: Date.now() },
  { id: "ap12", name: "成都", lat: 30.57, lng: 104.07, severity: "medium", type: "target", timestamp: Date.now() },
]

const TREND_DATA: TrendDataPoint[] = [
  { hour: "00:00", high: 2, medium: 5, low: 8 },
  { hour: "01:00", high: 3, medium: 4, low: 6 },
  { hour: "02:00", high: 5, medium: 7, low: 5 },
  { hour: "03:00", high: 8, medium: 6, low: 4 },
  { hour: "04:00", high: 4, medium: 5, low: 7 },
  { hour: "05:00", high: 6, medium: 8, low: 9 },
  { hour: "06:00", high: 3, medium: 6, low: 11 },
  { hour: "07:00", high: 5, medium: 9, low: 12 },
  { hour: "08:00", high: 7, medium: 11, low: 15 },
  { hour: "09:00", high: 9, medium: 13, low: 10 },
  { hour: "10:00", high: 6, medium: 10, low: 8 },
  { hour: "11:00", high: 4, medium: 8, low: 7 },
  { hour: "12:00", high: 3, medium: 6, low: 9 },
  { hour: "13:00", high: 5, medium: 7, low: 11 },
  { hour: "14:00", high: 7, medium: 9, low: 8 },
  { hour: "15:00", high: 4, medium: 6, low: 10 },
  { hour: "16:00", high: 6, medium: 8, low: 7 },
  { hour: "17:00", high: 8, medium: 10, low: 6 },
  { hour: "18:00", high: 5, medium: 7, low: 9 },
  { hour: "19:00", high: 3, medium: 5, low: 8 },
  { hour: "20:00", high: 4, medium: 6, low: 7 },
  { hour: "21:00", high: 6, medium: 8, low: 5 },
  { hour: "22:00", high: 7, medium: 9, low: 6 },
  { hour: "23:00", high: 5, medium: 7, low: 8 },
]

const ATTACK_TYPES: AttackTypeData[] = [
  { type: "钓鱼攻击", count: 8 },
  { type: "暴力破解", count: 7 },
  { type: "恶意软件", count: 6 },
  { type: "C2通信", count: 6 },
  { type: "数据外泄", count: 5 },
]

const MITRE_TECHNIQUES: MitreTechnique[] = [
  { id: "T1595", name: "主动扫描", tactic: "reconnaissance", hasAlert: true, alertCount: 3 },
  { id: "T1566", name: "钓鱼邮件", tactic: "initial-access", hasAlert: true, alertCount: 8 },
  { id: "T1190", name: "利用漏洞", tactic: "initial-access", hasAlert: true, alertCount: 2 },
  { id: "T1078", name: "有效账户", tactic: "initial-access", hasAlert: true, alertCount: 3 },
  { id: "T1059", name: "命令脚本", tactic: "execution", hasAlert: true, alertCount: 4 },
  { id: "T1055", name: "进程注入", tactic: "defense-evasion", hasAlert: true, alertCount: 3 },
  { id: "T1110", name: "暴力破解", tactic: "credential-access", hasAlert: true, alertCount: 7 },
  { id: "T1003", name: "凭证转储", tactic: "credential-access", hasAlert: true, alertCount: 2 },
  { id: "T1021", name: "远程服务", tactic: "lateral-movement", hasAlert: true, alertCount: 6 },
  { id: "T1041", name: "C2通道外泄", tactic: "exfiltration", hasAlert: true, alertCount: 5 },
  { id: "T1048", name: "替代协议", tactic: "exfiltration", hasAlert: true, alertCount: 3 },
  { id: "T1053", name: "计划任务", tactic: "persistence", hasAlert: true, alertCount: 1 },
  { id: "T1068", name: "漏洞利用", tactic: "priv-escalation", hasAlert: true, alertCount: 2 },
  { id: "T1046", name: "网络扫描", tactic: "discovery", hasAlert: true, alertCount: 2 },
  { id: "T1570", name: "横向传文件", tactic: "lateral-movement", hasAlert: true, alertCount: 2 },
  { id: "T1080", name: "WMI远程", tactic: "lateral-movement", hasAlert: true, alertCount: 3 },
  { id: "T1005", name: "本地数据", tactic: "collection", hasAlert: true, alertCount: 1 },
  { id: "T1204", name: "用户执行", tactic: "execution", hasAlert: true, alertCount: 2 },
  { id: "T1558", name: "票据攻击", tactic: "credential-access", hasAlert: true, alertCount: 1 },
  { id: "T1133", name: "外部服务", tactic: "persistence", hasAlert: false },
]

// ==================== 主页面 ====================

export default function DashboardPage() {
  usePageTitle("dashboard")
  const { t } = useLocaleStore()
  return (
    <PermissionGate resource="dashboard_overview" action="read" fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto size-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">{t("common.forbidden")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("error.forbidden")}</p>
        </div>
      </div>
    }>
      {/* 赛博扫描线效果 — 页面加载时一次闪烁 */}
      <div className="fixed inset-0 pointer-events-none z-50 animate-scanline opacity-30" />
      <UnifiedDashboardContent />
    </PermissionGate>
  )
}

function UnifiedDashboardContent() {
  const { t } = useLocaleStore()
  const storeSecurityScore = useMockDataStore((s) => s.securityScore)
  const [timeRange, setTimeRange] = useState("today")
  const [securityScore, setSecurityScore] = useState(storeSecurityScore)
  const [previousScore, setPreviousScore] = useState(Math.max(20, storeSecurityScore - 4))
  const [attackPoints, setAttackPoints] = useState(ATTACK_POINTS)
  const [trendData, setTrendData] = useState(TREND_DATA)
  const [attackTypes, setAttackTypes] = useState(ATTACK_TYPES)
  const [lastRefresh, setLastRefresh] = useState(() => Date.now())
  const { connectionStatus } = useWebSocket({})
  const isConnected = connectionStatus === "connected"
  const { newAlertCount, clearNewAlerts } = useRealtimeAlerts()

  // 刷新数据（仅在收到新告警、手动刷新、或 5 分钟定时触发）
  const refreshData = useCallback(() => {
    setSecurityScore((prev) => {
      const delta = Math.floor(Math.random() * 5) - 2
      const newScore = Math.max(30, Math.min(95, prev + delta))
      setPreviousScore(prev)
      return newScore
    })
    setTrendData((prev) => {
      const last = prev[prev.length - 1]
      const nextHour = String((parseInt(last.hour.split(":")[0]) + 1) % 24).padStart(2, "0") + ":00"
      return [...prev.slice(1), {
        hour: nextHour,
        high: Math.max(1, last.high + Math.floor(Math.random() * 3) - 1),
        medium: Math.max(1, last.medium + Math.floor(Math.random() * 3) - 1),
        low: Math.max(1, last.low + Math.floor(Math.random() * 3) - 1),
      }]
    })
    setAttackTypes((prev) => prev.map((item) => ({ ...item, count: Math.max(1, item.count + Math.floor(Math.random() * 3) - 1) })))
    setAttackPoints((prev) => prev.map((point) => {
      if (Math.random() > 0.3) return point
      const severities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"]
      return { ...point, severity: severities[Math.floor(Math.random() * severities.length)], timestamp: Date.now() }
    }))
    setLastRefresh(Date.now())
  }, [])

  // 当有新告警时才刷新数据
  useEffect(() => {
    if (newAlertCount > 0) {
      refreshData()
      clearNewAlerts()
    }
  }, [newAlertCount, refreshData, clearNewAlerts])

  // 定时刷新：仅每 5 分钟静默刷新一次，避免频繁无意义刷新
  useEffect(() => {
    const interval = setInterval(refreshData, 300000)
    return () => clearInterval(interval)
  }, [refreshData])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        refreshData()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [refreshData])

  // KPI 数据（含 sparkline）
  const kpis = [
    { icon: AlertTriangle, label: t("dashboard.todayAlerts"), value: 1284, color: "#ff2d55", trend: "+12.5%", sparkline: [8, 12, 9, 15, 11, 14, 18, 13], href: "/signals" },
    { icon: Globe, label: t("dashboard.deviceOnlineRate"), value: "97.3", unit: "%", color: "#00d4ff", sparkline: [96, 97, 95, 98, 97, 96, 97, 98] },
    { icon: Timer, label: "MTTD", value: 4.2, unit: "min", color: "#ff9500", trend: "-15.2%", trendGood: true, sparkline: [6, 5.5, 5, 4.8, 4.5, 4.3, 4.2, 4.2] },
    { icon: Wrench, label: "MTTR", value: 18.7, unit: "min", color: "#a78bfa", trend: "-8.6%", trendGood: true, sparkline: [25, 23, 22, 21, 20, 19, 18.7, 18.7] },
    { icon: Bot, label: t("dashboard.autoResponseRate"), value: "68.5", unit: "%", color: "#00ff88", trend: "+12.4%", sparkline: [55, 58, 60, 62, 64, 66, 68, 68.5], href: "/investigate" },
  ]

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <div className="animate-fadeInUp" style={{ animationDelay: '0ms' }}>
      <PageHeader
        icon={Activity}
        title={t("dashboard.pageTitle")}
        subtitle={t("dashboard.pageSubtitle")}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", isConnected ? "bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.5)]" : "bg-[#ff2d55] animate-pulse shadow-[0_0_6px_rgba(255,45,85,0.5)]")} />
              <span className={cn("text-xs font-medium", isConnected ? "text-[#00ff88]" : "text-[#ff2d55]")}>
                {isConnected ? t("dashboard.connected") : t("dashboard.disconnected")}
              </span>
            </div>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v ?? "today")}>
              <SelectTrigger size="sm" className={`w-28 ${inputClass}`}>
                <SelectValue placeholder={t("dashboard.timeRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t("time.today")}</SelectItem>
                <SelectItem value="week">{t("time.thisWeek")}</SelectItem>
                <SelectItem value="month">{t("time.thisMonth")}</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={refreshData}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "border border-border bg-card text-foreground hover:bg-muted/50 transition-colors duration-150"
              )}
            >
              <RefreshCw className="size-3.5" />
              {t("dashboard.refresh")}
            </button>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-[#00ff88]/25 text-[#00ff88] bg-[#00ff88]/5">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.4)]" />
              {t("dashboard.liveMonitoring")}
            </Badge>
          </div>
        }
      />
      </div>

      {/* ========== HERO 区域：安全评分 + AI建议 + KPI ========== */}
      <div className="animate-fadeInUp" style={{ animationDelay: '60ms' }}>
      <DashboardHero
        securityScore={securityScore}
        previousScore={previousScore}
        kpis={kpis}
      />
      </div>

      {/* ========== 双栏主体：告警面板 + 攻击态势面板 ========== */}
      <div className="grid grid-cols-12 gap-4">
        {/* 左栏：告警态势看板（图表为主） */}
        <div className="col-span-7 animate-fadeInUp" style={{ animationDelay: '160ms' }}>
          <DashboardAlertPanel
            severityData={ALERT_SEVERITY_DATA}
            dataSources={DATA_SOURCE_STATS}
            totalAlerts={1284}
            isConnected={isConnected}
            newAlertCount={newAlertCount}
            onClearNewAlerts={clearNewAlerts}
          />
        </div>

        {/* 右栏：攻击态势面板（地图+攻击类型+趋势） */}
        <div className="col-span-5 animate-fadeInUp" style={{ animationDelay: '240ms' }}>
          <DashboardAttackPanel
            attacks={attackPoints}
            trendData={trendData}
            attackTypes={attackTypes}
          />
        </div>
      </div>

      {/* ========== MITRE ATT&CK 矩阵（全宽） ========== */}
      <div className="animate-fadeInUp" style={{ animationDelay: '340ms' }}>
        <div className={cn(CARD.elevated, "rounded-xl border border-border bg-card p-4")}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff2d55]/10 ring-1 ring-[#ff2d55]/15">
              <ShieldAlert className="size-3.5 text-[#ff2d55]" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h2)}>MITRE ATT&CK 矩阵</h2>
            <Badge variant="outline" className="text-[10px] font-semibold border-primary/25 text-primary bg-primary/5">
              {MITRE_TECHNIQUES.filter(t => t.hasAlert).length} 个活跃技术
            </Badge>
          </div>
          <MitreMatrix techniques={MITRE_TECHNIQUES} />
        </div>
      </div>

      {/* ========== 状态栏 ========== */}
      <div className={cn(
        "relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card via-card/95 to-card",
        "animate-fadeInUp"
      )} style={{ animationDelay: '360ms' }}>
        {/* 赛博氛围光 */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/30 via-[#00ff88]/20 to-primary/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(0,212,255,0.03)_0%,transparent_50%)]" />

        <div className="relative flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-5">
            {/* AI 引擎状态 */}
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>AI 引擎</span>
              <span className="flex items-center gap-1">
                <span className={cn("size-1.5 rounded-full", isConnected ? "bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.6)]" : "bg-[#ff2d55] shadow-[0_0_6px_rgba(255,45,85,0.6)]")}>
                  <span className={cn("absolute inset-0 rounded-full animate-ping", isConnected ? "bg-[#00ff88]" : "bg-[#ff2d55]")} />
                </span>
                <span className={cn(TYPOGRAPHY.micro, isConnected ? "text-[#00ff88]" : "text-[#ff2d55]", "font-medium")}>
                  {isConnected ? "运行中" : "断连"}
                </span>
              </span>
              <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/50")}>推理延迟 120ms</span>
            </div>

            {/* 分隔 */}
            <span className="h-4 w-px bg-border/50" />

            {/* 数据源状态 */}
            <div className="flex items-center gap-2">
              <Database className="size-3.5 text-muted-foreground" />
              <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>数据源</span>
              <div className="flex items-center gap-1">
                {DATA_SOURCE_STATS.map((ds) => (
                  <span
                    key={ds.name}
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wider",
                      ds.online
                        ? "bg-[#00ff88]/8 text-[#00ff88] border border-[#00ff88]/15"
                        : "bg-[#ff2d55]/8 text-[#ff2d55] border border-[#ff2d55]/15"
                    )}
                  >
                    <span className={cn("size-1 rounded-full", ds.online ? "bg-[#00ff88] shadow-[0_0_4px_rgba(0,255,136,0.5)]" : "bg-[#ff2d55] shadow-[0_0_4px_rgba(255,45,85,0.5)]")} />
                    {ds.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 新告警徽章 */}
            {newAlertCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff2d55]/10 text-[#ff2d55] text-[10px] font-semibold border border-[#ff2d55]/20">
                <span className="size-1.5 rounded-full bg-[#ff2d55] animate-pulse" />
                +{newAlertCount} 新
              </span>
            )}

            {/* 最后刷新时间 */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <RefreshCw className="size-3" />
              <span className="font-mono tabular-nums">{new Date(lastRefresh).toLocaleTimeString("zh-CN", { hour12: false })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
