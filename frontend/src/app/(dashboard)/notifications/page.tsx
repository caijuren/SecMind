"use client"

import { useState } from "react"
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
import { PageHeader } from "@/components/layout/page-header"
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
import { useLocaleStore } from "@/store/locale-store"

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
  name: string
  icon: typeof Mail
  enabled: boolean
  summary: string
  color: string
  bg: string
}

const LEVEL_CONFIG: Record<AlertLevel, { color: string; bg: string; border: string; label: string; hex: string }> = {
  P0: { color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/25", label: "P0紧急", hex: "#ef4444" },
  P1: { color: "text-[#f97316]", bg: "bg-[#f97316]/10", border: "border-[#f97316]/25", label: "P1高危", hex: "#f97316" },
  P2: { color: "text-[#eab308]", bg: "bg-[#eab308]/10", border: "border-[#eab308]/25", label: "P2中危", hex: "#eab308" },
  P3: { color: "text-[#64748b]", bg: "bg-[#64748b]/10", border: "border-[#64748b]/25", label: "P3低危", hex: "#64748b" },
}

const SOURCE_CONFIG: Record<AlertSource, { icon: typeof Shield; color: string; bg: string }> = {
  "防火墙": { icon: Shield, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  "IDS": { icon: Radio, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  "EDR": { icon: Monitor, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  "SIEM": { icon: Brain, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  "态势感知": { icon: Globe, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
}

const STATUS_CONFIG: Record<AlertStatus, { color: string; bg: string; border: string }> = {
  "待处理": { color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/25" },
  "处理中": { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25" },
  "已确认": { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25" },
  "已静默": { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/25" },
}

const LEVEL_COUNTS: Record<AlertLevel, number> = {
  P0: 12,
  P1: 47,
  P2: 156,
  P3: 432,
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

const notificationChannels: NotificationChannel[] = [
  { id: "email", name: "邮件通知", icon: Mail, enabled: true, summary: "已配置3个接收组，P0/P1告警实时推送，P2/P3每日汇总", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { id: "wecom", name: "企微通知", icon: MessageSquare, enabled: true, summary: "已配置5个群组机器人，P0告警@全员，P1告警@安全组", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { id: "dingtalk", name: "钉钉通知", icon: Phone, enabled: false, summary: "未配置接收群组，需在设置中添加钉钉机器人Webhook", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  { id: "sms", name: "短信通知", icon: Phone, enabled: true, summary: "已配置8个手机号，仅P0紧急告警触发短信通知", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
]

export default function NotificationsPage() {
  const { t } = useLocaleStore()
  const [selectedLevel, setSelectedLevel] = useState<AlertLevel | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [channels, setChannels] = useState<NotificationChannel[]>(notificationChannels)
  const [alerts, setAlerts] = useState<AlertRecord[]>(mockAlerts)

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
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "已确认" as AlertStatus } : a))
    )
  }

  const handleMute = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "已静默" as AlertStatus } : a))
    )
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
        title="告警中心"
      />

      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(LEVEL_CONFIG) as AlertLevel[]).map((level) => {
          const config = LEVEL_CONFIG[level]
          const LevelIcon = LEVEL_ICONS[level]
          const isSelected = selectedLevel === level
          return (
            <Card
              key={level}
              className={cn(
                "cursor-pointer transition-all duration-200 backdrop-blur-xl",
                isSelected
                  ? cn(config.border, config.bg, "shadow-[0_0_20px_rgba(34,211,238,0.1)]")
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              )}
              onClick={() => handleLevelClick(level)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-medium", isSelected ? config.color : "text-white/40")}>
                    {config.label}
                  </span>
                  <LevelIcon className={cn("size-4", isSelected ? config.color : "text-white/20")} />
                </div>
                <p className={cn("mt-1 text-2xl font-bold font-mono", isSelected ? config.color : "text-white")}>
                  {LEVEL_COUNTS[level]}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <Input
            placeholder="搜索告警标题、描述或ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/25 focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
          />
        </div>
        <Select value={sourceFilter} onValueChange={(v) => v && setSourceFilter(v)}>
          <SelectTrigger size="sm" className="w-32 border-white/10 bg-white/[0.04] text-white/70">
            <SelectValue placeholder="告警来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="防火墙">防火墙</SelectItem>
            <SelectItem value="IDS">IDS</SelectItem>
            <SelectItem value="EDR">EDR</SelectItem>
            <SelectItem value="SIEM">SIEM</SelectItem>
            <SelectItem value="态势感知">态势感知</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger size="sm" className="w-32 border-white/10 bg-white/[0.04] text-white/70">
            <SelectValue placeholder="告警状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="待处理">待处理</SelectItem>
            <SelectItem value="处理中">处理中</SelectItem>
            <SelectItem value="已确认">已确认</SelectItem>
            <SelectItem value="已静默">已静默</SelectItem>
          </SelectContent>
        </Select>
        {(selectedLevel || sourceFilter !== "all" || statusFilter !== "all" || searchQuery) && (
          <Button
            size="sm"
            variant="ghost"
            className="text-white/40 hover:text-cyan-400"
            onClick={() => {
              setSelectedLevel(null)
              setSourceFilter("all")
              setStatusFilter("all")
              setSearchQuery("")
            }}
          >
            清除筛选
          </Button>
        )}
      </div>

      <div className="space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredAlerts.length === 0 && (
          <div className="flex items-center justify-center py-16 text-white/30 text-sm">
            没有匹配的告警记录
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
                "rounded-lg border bg-white/[0.02] p-3.5 transition-all",
                alert.level === "P0" && "border-[#ef4444]/25 shadow-[0_0_12px_rgba(239,68,68,0.1)]",
                alert.level === "P1" && "border-[#f97316]/20",
                alert.level === "P2" && "border-[#eab308]/15",
                alert.level === "P3" && "border-white/[0.06]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-white/30">{alert.time}</span>
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
                      {alert.source}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                        statusConfig.border,
                        statusConfig.bg,
                        statusConfig.color
                      )}
                    >
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/85 leading-snug">{alert.title}</p>
                  <p className="text-xs text-white/45 leading-relaxed line-clamp-2">{alert.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {alert.status !== "已确认" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10 gap-1"
                      onClick={() => handleConfirm(alert.id)}
                    >
                      <CheckCircle2 className="size-3" />
                      确认
                    </Button>
                  )}
                  {alert.status !== "已静默" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-slate-400/70 hover:text-slate-400 hover:bg-slate-400/10 gap-1"
                      onClick={() => handleMute(alert.id)}
                    >
                      <VolumeX className="size-3" />
                      静默
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-400/10 gap-1"
                  >
                    <Eye className="size-3" />
                    查看
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="size-4 text-cyan-400" />
          <span className="text-sm font-bold text-white/80">通知渠道配置</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {channels.map((channel) => {
            const ChannelIcon = channel.icon
            return (
              <Card
                key={channel.id}
                className={cn(
                  "backdrop-blur-xl transition-all",
                  channel.enabled
                    ? cn(channel.bg, "border-white/[0.06]")
                    : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChannelIcon className={cn("size-4", channel.enabled ? channel.color : "text-white/20")} />
                      <span className={cn("text-sm font-medium", channel.enabled ? "text-white/80" : "text-white/40")}>
                        {channel.name}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                        channel.enabled ? "bg-cyan-500/60" : "bg-white/10"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                          channel.enabled ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                  <p className={cn("text-xs leading-relaxed", channel.enabled ? "text-white/50" : "text-white/25")}>
                    {channel.summary}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      channel.enabled
                        ? "border-cyan-400/25 text-cyan-400/70"
                        : "border-white/10 text-white/30"
                    )}
                  >
                    {channel.enabled ? "已启用" : "未启用"}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
