"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Bell,
  ShieldAlert,
  Search,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  VolumeX,
  Eye,
  Flame,
  AlertTriangle,
  Info,
  Shield,
  Radio,
  Monitor,
  Brain,
  Wifi,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePageTitle } from "@/hooks/use-page-title"
import { PageHeader } from "@/components/layout/page-header"
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
import { inputClass } from "@/lib/admin-ui"
import { CARD } from "@/lib/design-system"
import { useLocaleStore } from "@/store/locale-store"
import { useMockDataStore } from "@/store/mock-data-store"
import type { Alert } from "@/types"

type AlertLevel = "P0" | "P1" | "P2" | "P3"
type AlertSource = "防火墙" | "IDS" | "EDR" | "SIEM" | "态势感知"
type AlertStatus = "待处理" | "处理中" | "已确认" | "已静默"

interface AlertRecord {
  id: string
  time: string
  level: AlertLevel
  source: AlertSource
  title: string
  description: string
  status: AlertStatus
}

interface NotificationChannel {
  id: string
  nameKey: string
  icon: typeof Mail
  enabled: boolean
  summary: string
  color: string
  bg: string
}

const LEVEL_CONFIG: Record<AlertLevel, { color: string; bg: string; border: string; labelKey: string; hex: string }> = {
  P0: { color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/25", labelKey: "notifications.levelP0", hex: "#dc2626" },
  P1: { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/25", labelKey: "notifications.levelP1", hex: "#d97706" },
  P2: { color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/25", labelKey: "notifications.levelP2", hex: "#ca8a04" },
  P3: { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border", labelKey: "notifications.levelP3", hex: "#64748b" },
}

const SOURCE_CONFIG: Record<AlertSource, { icon: typeof Shield; color: string; bg: string }> = {
  "防火墙": { icon: Shield, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  "IDS": { icon: Radio, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  "EDR": { icon: Monitor, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  "SIEM": { icon: Brain, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  "态势感知": { icon: Globe, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
}

const STATUS_CONFIG: Record<AlertStatus, { color: string; bg: string; border: string }> = {
  "待处理": { color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/25" },
  "处理中": { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  "已确认": { color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  "已静默": { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
}


const LEVEL_ICONS: Record<AlertLevel, typeof Flame> = {
  P0: Flame,
  P1: AlertTriangle,
  P2: Info,
  P3: ShieldAlert,
}

const mockAlerts: AlertRecord[] = [
  { id: "ALT-001", time: "2026-05-10 14:32:18", level: "P0", source: "EDR", title: "检测到Cobalt Strike Beacon通信", description: "内网主机10.0.2.100与外部C2服务器185.220.101.34建立加密隧道，流量特征匹配Cobalt Strike Beacon心跳", status: "待处理" },
  { id: "ALT-002", time: "2026-05-10 14:28:45", level: "P0", source: "IDS", title: "SQL注入攻击-数据库数据泄露", description: "Web应用服务器遭受SQL注入攻击，攻击者成功提取用户表数据，影响约5000条记录", status: "处理中" },
  { id: "ALT-003", time: "2026-05-10 14:25:33", level: "P0", source: "态势感知", title: "APT攻击链-多阶段入侵检测", description: "关联分析发现钓鱼邮件→凭证窃取→横向移动→C2通信完整攻击链，攻击者已在内网建立据点", status: "待处理" },
  { id: "ALT-004", time: "2026-05-10 14:20:11", level: "P1", source: "防火墙", title: "异常数据外传-500MB源代码泄露", description: "内网主机10.0.2.88向cloud.baidu.com传输500MB源代码，DLP策略触发，疑似内部威胁", status: "处理中" },
  { id: "ALT-005", time: "2026-05-10 14:18:22", level: "P1", source: "EDR", title: "WebShell植入-中国菜刀后门", description: "Web服务器WEB-SVR上传目录发现ChinaChopper WebShell，攻击者可能已获取服务器控制权", status: "已确认" },
  { id: "ALT-006", time: "2026-05-10 14:15:07", level: "P1", source: "SIEM", title: "服务账号异常提权-云资源接管", description: "服务账号app-service被添加至Administrators组，操作来源10.0.2.50，关联K8s RBAC异常", status: "待处理" },
  { id: "ALT-007", time: "2026-05-10 14:10:55", level: "P1", source: "IDS", title: "DNS隧道通信-C2数据外传", description: "DNS TXT记录高频查询cmd6.malware-c2.xyz，频率12次/分钟，域名符合DGA生成算法特征", status: "处理中" },
  { id: "ALT-008", time: "2026-05-10 14:05:30", level: "P1", source: "防火墙", title: "暴力破解攻击-RDP端口扫描", description: "外部IP段45.33.32.0/24对内网RDP服务发起暴力破解，已累计尝试15000次", status: "已确认" },
  { id: "ALT-009", time: "2026-05-10 13:58:42", level: "P2", source: "EDR", title: "PowerShell编码执行-可疑脚本", description: "终端WIN-DESK-15执行PowerShell编码命令，可能为合法运维脚本，需人工复核", status: "待处理" },
  { id: "ALT-010", time: "2026-05-10 13:52:18", level: "P2", source: "态势感知", title: "多设备异常在线-凭证疑似共享", description: "用户linfeng同时从北京、上海、深圳3个城市设备在线，不符合物理移动规律", status: "处理中" },
  { id: "ALT-011", time: "2026-05-10 13:45:33", level: "P2", source: "SIEM", title: "异常登录行为-不可能旅行", description: "用户zhangwei从俄罗斯IP登录VPN，与上次北京登录间隔仅2小时，凭证极可能已被窃取", status: "已确认" },
  { id: "ALT-012", time: "2026-05-10 13:40:15", level: "P2", source: "IDS", title: "横向移动检测-SMB协议异常", description: "内网主机10.0.2.100通过SMB协议向10.0.4.22传播，疑似横向移动行为", status: "待处理" },
  { id: "ALT-013", time: "2026-05-10 13:35:08", level: "P3", source: "防火墙", title: "端口扫描活动-低风险探测", description: "外部IP103.45.67.89对DMZ区域进行端口扫描，目标端口为常见Web端口", status: "已静默" },
  { id: "ALT-014", time: "2026-05-10 13:28:44", level: "P3", source: "EDR", title: "可疑进程创建-需人工确认", description: "终端WIN-DESK-22创建cmd.exe子进程，父进程为浏览器，可能为合法操作", status: "已静默" },
  { id: "ALT-015", time: "2026-05-10 13:20:30", level: "P3", source: "SIEM", title: "VPN连接异常-非工作时间登录", description: "用户wangfang在凌晨3:00通过VPN登录，非常规工作时间，但用户为运维人员", status: "已确认" },
  { id: "ALT-016", time: "2026-05-10 13:15:22", level: "P1", source: "态势感知", title: "定向钓鱼攻击-CFO目标", description: "CFO收到伪装DHL投递通知的钓鱼邮件，附件为Agent Tesla木马，发件域名注册仅3天", status: "待处理" },
  { id: "ALT-017", time: "2026-05-10 13:08:11", level: "P2", source: "IDS", title: "异常DNS查询-DGA域名检测", description: "内网主机10.0.3.20发起异常DNS查询，域名update.evil-c2.net符合DGA特征", status: "处理中" },
]

/* ========= Store Alert → AlertRecord mapping ========= */

function mapRiskLevel(level: Alert["riskLevel"]): AlertLevel {
  switch (level) {
    case "critical": return "P0"
    case "high": return "P1"
    case "medium": return "P2"
    case "low":
    case "info": return "P3"
    default: return "P3"
  }
}

function mapStatus(status: Alert["status"]): AlertStatus {
  switch (status) {
    case "new": return "待处理"
    case "investigating":
    case "escalated": return "处理中"
    case "resolved": return "已确认"
    case "false_positive": return "已静默"
    default: return "待处理"
  }
}

function mapSource(source: string): AlertSource {
  const sourceMap: Record<string, AlertSource> = {
    "防火墙": "防火墙",
    "IDS": "IDS",
    "入侵检测系统": "IDS",
    "EDR": "EDR",
    "SIEM": "SIEM",
    "态势感知": "态势感知",
    "邮件网关": "SIEM",
    "VPN网关": "防火墙",
    "DLP": "SIEM",
  }
  return sourceMap[source] ?? "SIEM"
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function transformAlert(alert: Alert): AlertRecord {
  return {
    id: alert.id,
    time: formatTimestamp(alert.timestamp),
    level: mapRiskLevel(alert.riskLevel),
    source: mapSource(alert.source),
    title: alert.title,
    description: alert.description,
    status: mapStatus(alert.status),
  }
}

const STATUS_LABEL_KEYS: Record<AlertStatus, string> = {
  "待处理": "notifications.statusPending",
  "处理中": "notifications.statusProcessing",
  "已确认": "notifications.statusConfirmed",
  "已静默": "notifications.statusMuted",
}

const SOURCE_LABEL_KEYS: Partial<Record<AlertSource, string>> = {
  "防火墙": "notifications.sourceFirewall",
  "态势感知": "notifications.sourceSituationalAwareness",
}

const notificationChannels: NotificationChannel[] = [
  { id: "email", nameKey: "notifications.channelEmail", icon: Mail, enabled: true, summary: "已配置3个接收组，P0/P1告警实时推送，P2/P3每日汇总", color: "text-blue-600", bg: "bg-blue-400/10 border-blue-400/20" },
  { id: "wecom", nameKey: "notifications.channelWecom", icon: MessageSquare, enabled: true, summary: "已配置5个群组机器人，P0告警@全员，P1告警@安全组", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-400/20" },
  { id: "dingtalk", nameKey: "notifications.channelDingtalk", icon: Phone, enabled: false, summary: "未配置接收群组，需在设置中添加钉钉机器人Webhook", color: "text-cyan-600", bg: "bg-cyan-400/10 border-cyan-400/20" },
  { id: "sms", nameKey: "notifications.channelSms", icon: Phone, enabled: true, summary: "已配置8个手机号，仅P0紧急告警触发短信通知", color: "text-amber-600", bg: "bg-amber-400/10 border-amber-400/20" },
]

export default function NotificationsPage() {
  usePageTitle("notifications")
  const { t } = useLocaleStore()
  const storeAlerts = useMockDataStore((s) => s.alerts)
  const initializeStore = useMockDataStore((s) => s.initialize)

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  const transformedAlerts = useMemo<AlertRecord[]>(() => {
    if (storeAlerts.length === 0) return mockAlerts
    return storeAlerts.map(transformAlert)
  }, [storeAlerts])

  const levelCounts = useMemo<Record<AlertLevel, number>>(() => {
    const counts: Record<AlertLevel, number> = { P0: 0, P1: 0, P2: 0, P3: 0 }
    for (const a of transformedAlerts) {
      counts[a.level]++
    }
    return counts
  }, [transformedAlerts])

  const [selectedLevel, setSelectedLevel] = useState<AlertLevel | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [channels, setChannels] = useState<NotificationChannel[]>(notificationChannels)
  const [localOverrides, setLocalOverrides] = useState<Record<string, AlertStatus>>({})

  const alerts = useMemo<AlertRecord[]>(() => {
    return transformedAlerts.map((a) => {
      if (localOverrides[a.id]) {
        return { ...a, status: localOverrides[a.id] }
      }
      return a
    })
  }, [transformedAlerts, localOverrides])

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedLevel && alert.level !== selectedLevel) return false
    if (sourceFilter !== "all" && alert.source !== sourceFilter) return false
    if (statusFilter !== "all" && alert.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.id.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleLevelClick = (level: AlertLevel) => {
    setSelectedLevel((prev) => (prev === level ? null : level))
  }

  const handleConfirm = (id: string) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: "已确认" as AlertStatus }))
  }

  const handleMute = (id: string) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: "已静默" as AlertStatus }))
  }

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bell}
        title={t("notifications.title")}
      />

      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(LEVEL_CONFIG) as AlertLevel[]).map((level) => {
          const config = LEVEL_CONFIG[level]
          const LevelIcon = LEVEL_ICONS[level]
          const isSelected = selectedLevel === level
          return (
            <button
              key={level}
              className={cn(
                CARD.base,
                "p-4 text-left cursor-pointer transition-colors duration-200",
                isSelected
                  ? "border-primary/25 shadow-sm"
                  : "hover:border-primary/20",
              )}
              style={{
                borderColor: isSelected ? `${config.hex}40` : undefined,
                backgroundColor: isSelected ? `${config.hex}10` : undefined,
              }}
              onClick={() => handleLevelClick(level)}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="flex size-7 items-center justify-center rounded-md ring-1"
                  style={{
                    backgroundColor: `${config.hex}18`,
                    borderColor: `${config.hex}30`,
                  }}
                >
                  <LevelIcon className="size-3.5" style={{ color: isSelected ? config.hex : '#71717a' }} />
                </div>
                <span className={cn("text-[11px] font-semibold", isSelected ? "text-muted-foreground" : "text-muted-foreground")}>
                  {t(config.labelKey)}
                </span>
              </div>
              <p className={cn("text-2xl font-bold font-mono tabular-nums", isSelected ? "text-foreground" : "text-muted-foreground")}>
                {levelCounts[level]}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("notifications.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-9 ${inputClass}`}
            aria-label={t("notifications.searchAriaLabel")}
            name="search"
            type="search"
            autoComplete="off"
          />
        </div>
        <Select value={sourceFilter} onValueChange={(v) => v && setSourceFilter(v)}>
          <SelectTrigger size="sm" className={`w-32 ${inputClass}`} aria-label={t("notifications.sourceFilterAriaLabel")}>
            <SelectValue placeholder={t("notifications.sourceFilter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("notifications.allSources")}</SelectItem>
            <SelectItem value="防火墙">{t("notifications.sourceFirewall")}</SelectItem>
            <SelectItem value="IDS">IDS</SelectItem>
            <SelectItem value="EDR">EDR</SelectItem>
            <SelectItem value="SIEM">SIEM</SelectItem>
            <SelectItem value="态势感知">{t("notifications.sourceSituationalAwareness")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger size="sm" className={`w-32 ${inputClass}`} aria-label={t("notifications.statusFilterAriaLabel")}>
            <SelectValue placeholder={t("notifications.statusFilter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("notifications.allStatus")}</SelectItem>
            <SelectItem value="待处理">{t("notifications.statusPending")}</SelectItem>
            <SelectItem value="处理中">{t("notifications.statusProcessing")}</SelectItem>
            <SelectItem value="已确认">{t("notifications.statusConfirmed")}</SelectItem>
            <SelectItem value="已静默">{t("notifications.statusMuted")}</SelectItem>
          </SelectContent>
        </Select>
        {(selectedLevel || sourceFilter !== "all" || statusFilter !== "all" || searchQuery) && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-cyan-600"
            onClick={() => {
              setSelectedLevel(null)
              setSourceFilter("all")
              setStatusFilter("all")
              setSearchQuery("")
            }}
          >
            {t("notifications.clearFilters")}
          </Button>
        )}
      </div>

      <div className="space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredAlerts.length === 0 && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            {t("notifications.noMatchingAlerts")}
          </div>
        )}
        {filteredAlerts.map((alert) => {
          const levelConfig = LEVEL_CONFIG[alert.level]
          const sourceConfig = SOURCE_CONFIG[alert.source]
          const statusConfig = STATUS_CONFIG[alert.status]
          const SourceIcon = sourceConfig.icon
          return (
            <div
              key={alert.id}
              className={cn(
                CARD.base,
              "group relative p-3.5 transition-colors duration-200 hover:border-primary/20 hover:bg-muted/20",
              )}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
                style={{ backgroundColor: levelConfig.hex }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">{alert.time}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                        levelConfig.bg,
                        levelConfig.color
                      )}
                    >
                      {alert.level}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                        sourceConfig.bg,
                        sourceConfig.color
                      )}
                    >
                      <SourceIcon className="size-3" />
                      {SOURCE_LABEL_KEYS[alert.source] ? t(SOURCE_LABEL_KEYS[alert.source]!) : alert.source}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                        statusConfig.border,
                        statusConfig.bg,
                        statusConfig.color
                      )}
                    >
                      {t(STATUS_LABEL_KEYS[alert.status])}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{alert.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{alert.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-70 transition-opacity group-hover:opacity-100">
                  {alert.status !== "已确认" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-emerald-600 hover:bg-emerald-500/10 gap-1"
                      onClick={() => handleConfirm(alert.id)}
                      aria-label={t("notifications.ariaConfirmAlert")}
                    >
                      <CheckCircle2 className="size-3" />
                      {t("notifications.confirm")}
                    </Button>
                  )}
                  {alert.status !== "已静默" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-muted/50 gap-1"
                      onClick={() => handleMute(alert.id)}
                      aria-label={t("notifications.ariaMuteAlert")}
                    >
                      <VolumeX className="size-3" />
                      {t("notifications.mute")}
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-primary hover:bg-primary/10 gap-1"
                    aria-label={t("notifications.ariaViewAlert")}
                  >
                    <Eye className="size-3" />
                    {t("notifications.view")}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="size-4 text-cyan-600" />
          <span className="text-sm font-bold text-foreground">{t("notifications.channelConfig")}</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {channels.map((channel) => {
            const ChannelIcon = channel.icon
            return (
              <div
                key={channel.id}
                className={cn(
                  CARD.base,
                  "p-4 space-y-3 transition-colors duration-200 hover:border-primary/20",
                  channel.enabled && channel.bg,
                )}
              >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChannelIcon className={cn("size-4", channel.enabled ? channel.color : "text-muted-foreground/60")} />
                      <span className={cn("text-sm font-medium", channel.enabled ? "text-foreground" : "text-muted-foreground")}>
                        {t(channel.nameKey)}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                        channel.enabled ? "bg-cyan-500/60" : "bg-muted/70"
                      )}
                      role="switch"
                      aria-checked={channel.enabled}
                      aria-label={t(channel.nameKey)}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform duration-200",
                          channel.enabled ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                  <p className={cn("text-xs leading-relaxed", channel.enabled ? "text-muted-foreground" : "text-muted-foreground/60")}>
                    {channel.summary}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      channel.enabled
                        ? "border-cyan-400/25 text-cyan-600/70"
                        : "border-border text-muted-foreground/60"
                    )}
                  >
                    {channel.enabled ? t("notifications.enabled") : t("notifications.disabled")}</Badge>
                </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
