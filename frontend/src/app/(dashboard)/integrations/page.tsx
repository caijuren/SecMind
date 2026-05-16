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

export default function IntegrationsPage() {
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
    setLoading(true)
    try {
      const [appsResponse, webhookResponse] = await Promise.all([
        api.get("/integrations/apps"),
        api.get("/integrations/webhooks"),
      ])
      setApps(appsResponse.data.items)
      setWebhooks(webhookResponse.data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadData()
    })
  }, [])

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
          <button key={item.key} onClick={() => setTab(item.key)} role="tab" aria-selected={tab === item.key} className={`${softCardClass} p-4 text-left ${tab === item.key ? "ring-2 ring-cyan-200" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{item.count}</p>
              </div>
              <span className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><item.icon className="size-4" /></span>
            </div>
          </button>
        ))}
      </div>

      <div className={`${softCardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索集成名称、说明、分类..." className={`pl-9 ${inputClass}`} aria-label="搜索集成" name="search" type="search" autoComplete="off" />
        </div>
        {tab === "webhooks" && (
          <Button onClick={() => setWebhookDialogOpen(true)} className="bg-cyan-600 text-white hover:bg-cyan-700">
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
                    <h3 className="font-semibold text-slate-900">{app.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{app.description}</p>
                  </div>
                  <Badge variant="outline" className={app.status === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                    {app.status === "connected" ? <CheckCircle2 className="mr-1 size-3.5" /> : <XCircle className="mr-1 size-3.5" />}
                    {app.status === "connected" ? "已连接" : "未连接"}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">最后同步：{app.last_sync || "-"}</div>
                <div className="flex gap-2">
                  {app.source === "integrated" ? (
                    <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                      <Settings2 className="mr-1 size-3.5" />
                      配置
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => setSelectedMarketApp(app)}>
                      <Plus className="mr-1 size-3.5" />
                      接入
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && filteredApps.length === 0 && <div className="text-slate-500">没有匹配的集成</div>}
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={pageCardClass}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{webhook.name}</h3>
                    <Badge variant="outline" className={webhook.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                      {webhook.active ? "启用中" : "已关闭"}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-slate-500">{webhook.url}</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">{event}</Badge>
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
        <DialogContent className="border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>配置 {selectedApp?.name}</DialogTitle>
            <DialogDescription className="text-slate-500">修改后会直接更新数据库中的集成配置。</DialogDescription>
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
                <Button onClick={() => saveAppConfig({ ...selectedApp, status: "connected" })} className="bg-cyan-600 text-white hover:bg-cyan-700">保存配置</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMarketApp} onOpenChange={() => setSelectedMarketApp(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>接入 {selectedMarketApp?.name}</DialogTitle>
            <DialogDescription className="text-slate-500">接入后状态会切为已连接，并保存 API 参数。</DialogDescription>
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
                <Button onClick={addMarketplaceApp} className="bg-cyan-600 text-white hover:bg-cyan-700">确认接入</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>新建 Webhook</DialogTitle>
            <DialogDescription className="text-slate-500">事件用英文逗号分隔，创建后会直接写入数据库。</DialogDescription>
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
              <Button onClick={createWebhook} className="bg-cyan-600 text-white hover:bg-cyan-700">创建</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
