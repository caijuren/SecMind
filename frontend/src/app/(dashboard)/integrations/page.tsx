"use client"

import { useState } from "react"
import {
  Plug,
  Store,
  Webhook,
  Link2,
  Unlink,
  Settings2,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Shield,
  MessageSquare,
  Bug,
  Database,
  Globe,
  Lock,
  Radio,
  FileSearch,
  Target,
  Brain,
  Network,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useLocaleStore } from "@/store/locale-store"

type FilterTab = "integrated" | "marketplace" | "webhooks"

interface IntegratedApp {
  id: string
  name: string
  icon: typeof Plug
  description: string
  status: "connected" | "disconnected"
  lastSync: string
  color: string
}

interface MarketplaceApp {
  id: string
  name: string
  icon: typeof Plug
  description: string
  category: string
  categoryColor: string
}

interface WebhookItem {
  id: string
  url: string
  events: string[]
  createdAt: string
  active: boolean
}

const integratedApps: IntegratedApp[] = [
  { id: "jira", name: "Jira", icon: Bug, description: "工单与项目管理集成，自动创建安全工单", status: "connected", lastSync: "2026-05-10 14:22", color: "#2684ff" },
  { id: "servicenow", name: "ServiceNow", icon: Settings2, description: "IT服务管理平台，同步事件与变更", status: "connected", lastSync: "2026-05-10 13:45", color: "#81b5a1" },
  { id: "feishu", name: "飞书", icon: MessageSquare, description: "即时通讯与协作，告警推送与通知", status: "connected", lastSync: "2026-05-10 14:30", color: "#3370ff" },
  { id: "wecom", name: "企业微信", icon: Radio, description: "企业通讯平台，安全事件实时推送", status: "disconnected", lastSync: "2026-05-09 18:00", color: "#07c160" },
  { id: "dingtalk", name: "钉钉", icon: Zap, description: "智能办公平台，告警与审批通知", status: "connected", lastSync: "2026-05-10 14:15", color: "#0089ff" },
  { id: "splunk", name: "Splunk", icon: Database, description: "SIEM日志分析平台，日志关联查询", status: "connected", lastSync: "2026-05-10 12:30", color: "#65a637" },
  { id: "elasticsearch", name: "Elasticsearch", icon: Search, description: "搜索引擎与日志分析，数据聚合查询", status: "disconnected", lastSync: "2026-05-08 09:00", color: "#f9b110" },
  { id: "virustotal", name: "VirusTotal", icon: Shield, description: "恶意软件与URL检测，威胁情报查询", status: "connected", lastSync: "2026-05-10 14:28", color: "#397ce9" },
]

const marketplaceApps: MarketplaceApp[] = [
  { id: "slack", name: "Slack", icon: MessageSquare, description: "团队协作与即时通讯，安全告警频道推送", category: "协作", categoryColor: "#06b6d4" },
  { id: "teams", name: "Microsoft Teams", icon: Globe, description: "企业协作平台，安全事件通知与响应", category: "协作", categoryColor: "#06b6d4" },
  { id: "pagerduty", name: "PagerDuty", icon: AlertTriangle, description: "事件响应与告警升级，自动分派值班", category: "响应", categoryColor: "#f59e0b" },
  { id: "fortinet", name: "Fortinet", icon: Shield, description: "防火墙与安全网关，策略联动管理", category: "防火墙", categoryColor: "#ef4444" },
  { id: "paloalto", name: "Palo Alto", icon: Lock, description: "下一代防火墙，威胁防护策略同步", category: "防火墙", categoryColor: "#ef4444" },
  { id: "crowdstrike", name: "CrowdStrike", icon: Target, description: "终端检测与响应，EDR数据联动", category: "EDR", categoryColor: "#a855f7" },
  { id: "sentinelone", name: "SentinelOne", icon: Brain, description: "AI驱动的终端安全，自动化威胁响应", category: "EDR", categoryColor: "#a855f7" },
  { id: "abuseipdb", name: "AbuseIPDB", icon: Globe, description: "IP滥用信誉查询，恶意IP情报丰富", category: "情报", categoryColor: "#22c55e" },
  { id: "shodan", name: "Shodan", icon: Network, description: "互联网设备搜索引擎，暴露面发现", category: "情报", categoryColor: "#22c55e" },
  { id: "mitre", name: "MITRE ATT&CK", icon: FileSearch, description: "攻击框架映射，战术与技术标注", category: "框架", categoryColor: "#3b82f6" },
  { id: "misp", name: "MISP", icon: Network, description: "威胁情报共享平台，IOC自动关联", category: "情报", categoryColor: "#22c55e" },
  { id: "thehive", name: "TheHive", icon: Bug, description: "安全事件响应平台，协同调查管理", category: "响应", categoryColor: "#f59e0b" },
]

const webhookItems: WebhookItem[] = [
  { id: "wh-001", url: "https://api.example.com/webhook/alerts", events: ["告警创建", "告警升级"], createdAt: "2026-03-15", active: true },
  { id: "wh-002", url: "https://soc.internal.com/hooks/cases", events: ["案件状态变更"], createdAt: "2026-04-02", active: true },
  { id: "wh-003", url: "https://notify.company.com/sec-events", events: ["高危告警", "漏洞发现"], createdAt: "2026-04-18", active: false },
  { id: "wh-004", url: "https://automation.local/hooks/response", events: ["自动响应执行"], createdAt: "2026-05-01", active: true },
  { id: "wh-005", url: "https://dashboard.corp.com/hooks/metrics", events: ["日报生成", "周报生成"], createdAt: "2026-05-08", active: true },
]

const filterCards: { key: FilterTab; label: string; count: number; color: string; icon: typeof Plug }[] = [
  { key: "integrated", label: "已集成", count: 8, color: "#06b6d4", icon: Link2 },
  { key: "marketplace", label: "可用集成", count: 24, color: "#22c55e", icon: Store },
  { key: "webhooks", label: "Webhook", count: 5, color: "#a855f7", icon: Webhook },
]

export default function IntegrationsPage() {
  const { t } = useLocaleStore()
  const [activeFilter, setActiveFilter] = useState<FilterTab>("integrated")
  const [searchQuery, setSearchQuery] = useState("")
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(webhookItems)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<IntegratedApp | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedMarketApp, setSelectedMarketApp] = useState<MarketplaceApp | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    )
  }

  const filteredIntegrated = integratedApps.filter((app) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)
  })

  const filteredMarketplace = marketplaceApps.filter((app) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q) || app.category.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20" style={{ background: "rgba(6,182,212,0.08)" }}>
            <Plug className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">集成中心</h1>
            <p className="text-xs text-white/40">第三方系统集成与API管理</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
            <Input
              placeholder="搜索集成..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-48 border-white/10 bg-white/[0.04] pl-8 text-xs text-white/60 placeholder:text-white/25"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filterCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setActiveFilter(card.key)}
            className={cn(
              "rounded-xl border p-4 transition-all duration-200 text-left",
              activeFilter === card.key
                ? "border-white/20 bg-white/[0.06]"
                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${card.color}15` }}
                >
                  <card.icon className="h-4.5 w-4.5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-xs text-white/50">{card.label}</p>
                  <p className="text-xl font-bold text-white">{card.count}</p>
                </div>
              </div>
              {activeFilter === card.key && (
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: card.color }} />
              )}
            </div>
          </button>
        ))}
      </div>

      {activeFilter === "integrated" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">已集成服务</h2>
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">
              {filteredIntegrated.length} 项
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredIntegrated.map((app) => (
              <Card
                key={app.id}
                className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ background: `${app.color}15` }}
                      >
                        <app.icon className="h-5 w-5" style={{ color: app.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{app.name}</p>
                        <p className="text-xs text-white/40 mt-0.5">{app.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] gap-1",
                        app.status === "connected"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-red-500/30 text-red-400"
                      )}
                      style={{
                        background: app.status === "connected" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                      }}
                    >
                      {app.status === "connected" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {app.status === "connected" ? "已连接" : "断开"}
                    </Badge>
                  </div>
                  <Separator className="my-3 bg-white/[0.06]" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <Clock className="h-3 w-3" />
                      最后同步: {app.lastSync}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-white/50 hover:text-cyan-400 gap-1"
                      onClick={() => {
                        setSelectedApp(app)
                        setConfigDialogOpen(true)
                      }}
                    >
                      <Settings2 className="h-3 w-3" />
                      配置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeFilter === "marketplace" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">可用集成市场</h2>
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">
              {filteredMarketplace.length} 项
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {filteredMarketplace.map((app) => (
              <Card
                key={app.id}
                className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ background: `${app.categoryColor}12` }}
                      >
                        <app.icon className="h-4.5 w-4.5" style={{ color: app.categoryColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{app.name}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        background: `${app.categoryColor}10`,
                        color: app.categoryColor,
                        borderColor: `${app.categoryColor}30`,
                      }}
                    >
                      {app.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{app.description}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-cyan-400 hover:text-cyan-300 gap-1 w-full border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
                    onClick={() => {
                      setSelectedMarketApp(app)
                      setAddDialogOpen(true)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    添加集成
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeFilter === "webhooks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">Webhook 管理</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-cyan-400 hover:text-cyan-300 gap-1 border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
            >
              <Plus className="h-3 w-3" />
              新建 Webhook
            </Button>
          </div>
          <div className="space-y-2">
            {webhooks.map((wh) => (
              <Card
                key={wh.id}
                className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                          wh.active ? "bg-purple-500/10" : "bg-white/[0.04]"
                        )}
                      >
                        <Webhook className={cn("h-4 w-4", wh.active ? "text-purple-400" : "text-white/30")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/60 font-mono truncate">{wh.url}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {wh.events.map((event) => (
                            <Badge
                              key={event}
                              variant="outline"
                              className="text-[10px] border-purple-500/25 text-purple-300"
                              style={{ background: "rgba(168,85,247,0.08)" }}
                            >
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-[10px] text-white/25">创建于 {wh.createdAt}</span>
                      <button
                        onClick={() => toggleWebhook(wh.id)}
                        className={cn(
                          "relative h-5 w-9 rounded-full transition-colors duration-200",
                          wh.active ? "bg-purple-500/60" : "bg-white/10"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200",
                            wh.active ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-white/50 hover:text-cyan-400 gap-1"
                      >
                        <Send className="h-3 w-3" />
                        测试
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-white/[0.06]" />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-medium text-white/70">API 文档入口</h2>
        </div>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-white/30 mb-1">API 基础 URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-cyan-400 font-mono bg-cyan-500/[0.06] px-2 py-1 rounded border border-cyan-500/10">
                    https://api.secmind.ai/v2
                  </code>
                  <Button variant="ghost" size="icon-sm" className="text-white/30 hover:text-cyan-400">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-1">API 密钥</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-white/50 font-mono bg-white/[0.04] px-2 py-1 rounded border border-white/[0.06]">
                    {showApiKey ? "sk-sec-a8f3e2d1c9b7a6f5e4d3c2b1a0" : "sk-sec-••••••••••••••••••••••••"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-white/30 hover:text-cyan-400"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-cyan-400 hover:text-cyan-300 gap-1.5 border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  查看 API 文档
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-[#0a1628]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedApp?.name} 配置
            </DialogTitle>
            <DialogDescription className="text-white/40">
              管理 {selectedApp?.name} 集成配置与连接状态
            </DialogDescription>
          </DialogHeader>
          <Separator className="bg-white/[0.06]" />
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/30 mb-1">连接状态</p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] gap-1",
                  selectedApp?.status === "connected"
                    ? "border-emerald-500/30 text-emerald-400"
                    : "border-red-500/30 text-red-400"
                )}
                style={{
                  background: selectedApp?.status === "connected" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                }}
              >
                {selectedApp?.status === "connected" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {selectedApp?.status === "connected" ? "已连接" : "断开"}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-1">最后同步</p>
              <p className="text-xs text-white/60">{selectedApp?.lastSync}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-1">同步频率</p>
              <Select>
                <SelectTrigger size="sm" className="w-full border-white/10 bg-white/[0.04] text-white/50">
                  <SelectValue placeholder="选择同步频率" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">每5分钟</SelectItem>
                  <SelectItem value="15min">每15分钟</SelectItem>
                  <SelectItem value="30min">每30分钟</SelectItem>
                  <SelectItem value="1h">每小时</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="bg-white/[0.06]" />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/50 hover:text-white"
              onClick={() => setConfigDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              保存配置
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-[#0a1628]">
          <DialogHeader>
            <DialogTitle className="text-white">
              添加 {selectedMarketApp?.name} 集成
            </DialogTitle>
            <DialogDescription className="text-white/40">
              配置 {selectedMarketApp?.name} 集成参数以启用服务
            </DialogDescription>
          </DialogHeader>
          <Separator className="bg-white/[0.06]" />
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/30 mb-1">服务描述</p>
              <p className="text-xs text-white/60">{selectedMarketApp?.description}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-1">API 端点</p>
              <Input
                placeholder="输入 API 端点 URL"
                className="h-7 border-white/10 bg-white/[0.04] text-xs text-white/60 placeholder:text-white/25"
              />
            </div>
            <div>
              <p className="text-[10px] text-white/30 mb-1">认证密钥</p>
              <Input
                placeholder="输入 API Key 或 Token"
                className="h-7 border-white/10 bg-white/[0.04] text-xs text-white/60 placeholder:text-white/25"
              />
            </div>
          </div>
          <Separator className="bg-white/[0.06]" />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/50 hover:text-white"
              onClick={() => setAddDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white gap-1"
            >
              <Plus className="h-3 w-3" />
              确认添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
