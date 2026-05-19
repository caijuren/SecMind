"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Link2, Plug, Plus, Search, Send, Settings2, Webhook, XCircle } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { inputClass, pageCardClass, softCardClass } from "@/lib/admin-ui"
import { useAuthStore } from "@/store/auth-store"

interface IntegrationApp {
  id: number
  slug: string
  name: string
  description: string
  category?: string | null
  status: string
  color?: string | null
  last_sync?: string | null
  api_url?: string | null
  api_key?: string | null
  sync_frequency: string
  source: "integrated" | "marketplace"
}

interface WebhookItem {
  id: number
  name: string
  url: string
  events: string[]
  active: boolean
  created_at: string
}

const MOCK_APPS: IntegrationApp[] = [
  { id: 1, slug: "qianxin-edr", name: "奇安信 天擎 EDR", description: "奇安信终端检测与响应平台，实时采集主机告警和威胁事件", category: "EDR", status: "connected", color: "#ef4444", last_sync: new Date(Date.now() - 120000).toISOString(), api_url: "https://edr.qianxin.com/api", sync_frequency: "realtime", source: "integrated" },
  { id: 2, slug: "qianxin-ngsoc", name: "奇安信 NGSOC", description: "奇安信安全运营中心平台，统一收集和分析安全事件", category: "SIEM", status: "connected", color: "#f97316", last_sync: new Date(Date.now() - 60000).toISOString(), api_url: "https://ngsoc.qianxin.com/api", sync_frequency: "realtime", source: "integrated" },
  { id: 3, slug: "sangfor-af", name: "深信服 下一代防火墙", description: "深信服NGAF系列防火墙，提供网络层攻击检测和访问控制日志", category: "防火墙", status: "connected", color: "#22d3ee", last_sync: new Date(Date.now() - 90000).toISOString(), api_url: "https://fw.sangfor.com/syslog", sync_frequency: "realtime", source: "integrated" },
  { id: 4, slug: "anheng-waf", name: "安恒信息 明御WAF", description: "安恒信息Web应用防火墙，检测SQL注入/XSS等Web攻击", category: "WAF", status: "connected", color: "#a78bfa", last_sync: new Date(Date.now() - 45000).toISOString(), api_url: "https://waf.dbappsecurity.com/api", sync_frequency: "realtime", source: "integrated" },
  { id: 5, slug: "crowdstrike-falcon", name: "CrowdStrike Falcon", description: "CrowdStrike端点安全平台，提供威胁猎杀和事件响应能力", category: "EDR", status: "connected", color: "#ef4444", last_sync: new Date(Date.now() - 300000).toISOString(), api_url: "https://api.crowdstrike.com", sync_frequency: "realtime", source: "integrated" },
  { id: 6, slug: "splunk-es", name: "Splunk ES", description: "Splunk Enterprise Security，大数据安全分析和关联规则引擎", category: "SIEM", status: "connected", color: "#22d3ee", last_sync: new Date(Date.now() - 75000).toISOString(), api_url: "https://splunk.internal:8089", sync_frequency: "5min", source: "integrated" },
  { id: 7, slug: "aliyun-security", name: "阿里云安全中心", description: "阿里云云安全中心，提供云资产安全态势和漏洞管理", category: "SIEM", status: "disconnected", color: "#f97316", last_sync: null, sync_frequency: "15min", source: "marketplace" },
  { id: 8, slug: "tencent-waf", name: "腾讯云 WAF", description: "腾讯云Web应用防火墙，为Web应用提供安全防护", category: "WAF", status: "disconnected", color: "#22d3ee", last_sync: null, sync_frequency: "15min", source: "marketplace" },
  { id: 9, slug: "paloalto-xdr", name: "Palo Alto Cortex XDR", description: "Palo Alto扩展检测与响应平台，跨端点、网络和云的威胁检测", category: "EDR", status: "disconnected", color: "#22d3ee", last_sync: null, sync_frequency: "15min", source: "marketplace" },
  { id: 10, slug: "microsoft-sentinel", name: "Microsoft Sentinel", description: "微软安全信息和事件管理(SIEM)与安全编排自动化响应(SOAR)", category: "SIEM", status: "disconnected", color: "#22d3ee", last_sync: null, sync_frequency: "15min", source: "marketplace" },
]

const MOCK_WEBHOOKS: WebhookItem[] = [
  { id: 1, name: "钉钉告警通知", url: "https://oapi.dingtalk.com/robot/webhook/xxx", events: ["告警创建", "告警升级"], active: true, created_at: "2025-12-01" },
  { id: 2, name: "企业微信通知", url: "https://qyapi.weixin.qq.com/cgi-bin/webhook/xxx", events: ["告警创建"], active: true, created_at: "2025-12-05" },
  { id: 3, name: "飞书告警机器人", url: "https://open.feishu.cn/open-apis/bot/v2/xxx", events: ["告警创建", "告警处理", "告警关闭"], active: true, created_at: "2025-12-10" },
]

export default function IntegrationsPage() {
  const isDemo = useAuthStore(s => s.user?.isDemo)
  const [apps, setApps] = useState<IntegrationApp[]>([])
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<"integrated" | "marketplace" | "webhooks">("integrated")
  const [selectedApp, setSelectedApp] = useState<IntegrationApp | null>(null)
  const [selectedMarketApp, setSelectedMarketApp] = useState<IntegrationApp | null>(null)
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: "告警创建,告警升级" })

  async function loadData() {
    if (isDemo) {
      setApps(MOCK_APPS)
      setWebhooks(MOCK_WEBHOOKS)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [appsResponse, webhookResponse] = await Promise.all([
        api.get("/integrations/apps"),
        api.get("/integrations/webhooks"),
      ])
      setApps(appsResponse.data.items)
      setWebhooks(webhookResponse.data.items)
    } catch {
      setApps(MOCK_APPS)
      setWebhooks(MOCK_WEBHOOKS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        void loadData()
      })
    } else {
      Promise.resolve().then(() => loadData())
    }
  }, [isDemo])

  async function saveAppConfig(app: IntegrationApp) {
    await api.put(`/integrations/apps/${app.id}`, {
      api_url: app.api_url,
      api_key: app.api_key,
      sync_frequency: app.sync_frequency,
      status: app.status,
    })
    setSelectedApp(null)
    await loadData()
  }

  async function addMarketplaceApp() {
    if (!selectedMarketApp) return
    await api.put(`/integrations/apps/${selectedMarketApp.id}`, {
      status: "connected",
      api_url: selectedMarketApp.api_url,
      api_key: selectedMarketApp.api_key,
      sync_frequency: selectedMarketApp.sync_frequency,
    })
    setSelectedMarketApp(null)
    await loadData()
  }

  async function toggleWebhook(webhook: WebhookItem) {
    await api.put(`/integrations/webhooks/${webhook.id}`, { active: !webhook.active })
    await loadData()
  }

  async function createWebhook() {
    await api.post("/integrations/webhooks", {
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events.split(",").map((item) => item.trim()).filter(Boolean),
      active: true,
      created_at: new Date().toISOString().slice(0, 10),
    })
    setWebhookDialogOpen(false)
    setNewWebhook({ name: "", url: "", events: "告警创建,告警升级" })
    await loadData()
  }

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (tab === "integrated" && app.source !== "integrated") return false
      if (tab === "marketplace" && app.source !== "marketplace") return false
      if (!query) return true
      const q = query.toLowerCase()
      return [app.name, app.description, app.category ?? ""].some((value) => value.toLowerCase().includes(q))
    })
  }, [apps, query, tab])

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Plug}
        title="集成中心"
        subtitle={<span>集成配置、状态切换和 Webhook 开关现在都写入数据库。</span>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { key: "integrated" as const, label: "已集成", count: apps.filter((item) => item.source === "integrated").length, icon: Link2 },
          { key: "marketplace" as const, label: "集成市场", count: apps.filter((item) => item.source === "marketplace").length, icon: Plus },
          { key: "webhooks" as const, label: "Webhook", count: webhooks.length, icon: Webhook },
        ].map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} role="tab" aria-selected={tab === item.key} className={`${softCardClass} p-4 text-left ${tab === item.key ? "ring-2 ring-cyan-500/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-100">{item.count}</p>
              </div>
              <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400"><item.icon className="size-4" /></span>
            </div>
          </button>
        ))}
      </div>

      <div className={`${softCardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索集成名称、说明、分类..." className={`pl-9 ${inputClass}`} aria-label="搜索集成" name="search" type="search" autoComplete="off" />
        </div>
        {tab === "webhooks" && (
          <Button onClick={() => setWebhookDialogOpen(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all">
            <Plus className="mr-1 size-4" />
            新建 Webhook
          </Button>
        )}
      </div>

      {tab !== "webhooks" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredApps.map((app) => (
            <Card key={app.id} className={pageCardClass}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{app.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{app.description}</p>
                  </div>
                  <Badge variant="outline" className={app.status === "connected" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/[0.08] bg-white/[0.03] text-zinc-500"}>
                    {app.status === "connected" ? <CheckCircle2 className="mr-1 size-3.5" /> : <XCircle className="mr-1 size-3.5" />}
                    {app.status === "connected" ? "已连接" : "未连接"}
                  </Badge>
                </div>
                <div className="text-xs text-zinc-500">最后同步：{app.last_sync || "-"}</div>
                <div className="flex gap-2">
                  {app.source === "integrated" ? (
                    <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                      <Settings2 className="mr-1 size-3.5" />
                      配置
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all" onClick={() => setSelectedMarketApp(app)}>
                      <Plus className="mr-1 size-3.5" />
                      接入
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && filteredApps.length === 0 && <div className="text-zinc-500">没有匹配的集成</div>}
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={pageCardClass}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-zinc-100">{webhook.name}</h3>
                    <Badge variant="outline" className={webhook.active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/[0.08] bg-white/[0.03] text-zinc-500"}>
                      {webhook.active ? "启用中" : "已关闭"}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-zinc-400">{webhook.url}</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400">{event}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleWebhook(webhook)}>
                    {webhook.active ? "停用" : "启用"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="mr-1 size-3.5" />
                    测试
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100">
          <DialogHeader>
            <DialogTitle>配置 {selectedApp?.name}</DialogTitle>
            <DialogDescription className="text-zinc-500">修改后会直接更新数据库中的集成配置。</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-api-url">API 地址</Label>
                <Input id="app-api-url" value={selectedApp.api_url ?? ""} onChange={(e) => setSelectedApp({ ...selectedApp, api_url: e.target.value })} className={inputClass} name="api_url" type="url" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-api-key">API Key / Token</Label>
                <Input id="app-api-key" value={selectedApp.api_key ?? ""} onChange={(e) => setSelectedApp({ ...selectedApp, api_key: e.target.value })} className={inputClass} type="password" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-sync-freq">同步频率</Label>
                <Select value={selectedApp.sync_frequency} onValueChange={(value) => setSelectedApp({ ...selectedApp, sync_frequency: value || '' })}>
                  <SelectTrigger id="app-sync-freq" className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">每 5 分钟</SelectItem>
                    <SelectItem value="15min">每 15 分钟</SelectItem>
                    <SelectItem value="30min">每 30 分钟</SelectItem>
                    <SelectItem value="1h">每小时</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>取消</Button>
                <Button onClick={() => saveAppConfig({ ...selectedApp, status: "connected" })} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all">保存配置</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMarketApp} onOpenChange={() => setSelectedMarketApp(null)}>
        <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100">
          <DialogHeader>
            <DialogTitle>接入 {selectedMarketApp?.name}</DialogTitle>
            <DialogDescription className="text-zinc-500">接入后状态会切为已连接，并保存 API 参数。</DialogDescription>
          </DialogHeader>
          {selectedMarketApp && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="market-api-url">API 地址</Label>
                <Input id="market-api-url" value={selectedMarketApp.api_url ?? ""} onChange={(e) => setSelectedMarketApp({ ...selectedMarketApp, api_url: e.target.value })} className={inputClass} name="api_url" type="url" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market-auth-key">认证密钥</Label>
                <Input id="market-auth-key" value={selectedMarketApp.api_key ?? ""} onChange={(e) => setSelectedMarketApp({ ...selectedMarketApp, api_key: e.target.value })} className={inputClass} type="password" autoComplete="off" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedMarketApp(null)}>取消</Button>
                <Button onClick={addMarketplaceApp} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all">确认接入</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100">
          <DialogHeader>
            <DialogTitle>新建 Webhook</DialogTitle>
            <DialogDescription className="text-zinc-500">事件用英文逗号分隔，创建后会直接写入数据库。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">名称</Label>
              <Input id="webhook-name" value={newWebhook.name} onChange={(e) => setNewWebhook((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} name="name" type="text" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL</Label>
              <Input id="webhook-url" value={newWebhook.url} onChange={(e) => setNewWebhook((prev) => ({ ...prev, url: e.target.value }))} className={inputClass} name="url" type="url" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-events">事件</Label>
              <Input id="webhook-events" value={newWebhook.events} onChange={(e) => setNewWebhook((prev) => ({ ...prev, events: e.target.value }))} className={inputClass} name="events" type="text" autoComplete="off" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>取消</Button>
              <Button onClick={createWebhook} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all">创建</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
