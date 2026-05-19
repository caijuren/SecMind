"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Database, Plus, Search, Server, Wifi, WifiOff } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, formatDateTime } from "@/lib/api"
import { inputClass, pageCardClass, softCardClass } from "@/lib/admin-ui"
import { useAuthStore } from "@/store/auth-store"

interface DataSourceItem {
  id: number
  name: string
  type: string
  brand?: string | null
  model?: string | null
  ip: string
  port?: number | null
  protocol?: string | null
  status: "online" | "offline"
  last_sync?: string | null
  log_format?: string | null
  log_level?: string | null
  direction?: string | null
  daily_volume?: number | null
  health?: number | null
}

const VENDOR_PRODUCTS = [
  {
    vendor: "深信服",
    items: [
      { name: "SSL VPN", type: "VPN网关", model: "SSL VPN" },
      { name: "下一代防火墙", type: "防火墙", model: "AF系列" },
      { name: "EDR", type: "EDR", model: "EDR" },
    ],
  },
  {
    vendor: "奇安信",
    items: [
      { name: "天擎", type: "EDR", model: "天擎" },
      { name: "天眼", type: "IDS/IPS", model: "天眼" },
      { name: "NGSOC", type: "SIEM", model: "NGSOC" },
    ],
  },
  {
    vendor: "安恒信息",
    items: [
      { name: "明御WAF", type: "WAF", model: "明御WAF" },
      { name: "明御APT", type: "IDS/IPS", model: "明御APT" },
    ],
  },
  {
    vendor: "华为",
    items: [{ name: "USG系列防火墙", type: "防火墙", model: "USG系列" }],
  },
  {
    vendor: "360",
    items: [{ name: "邮件安全网关", type: "邮件网关", model: "邮件安全网关" }],
  },
  {
    vendor: "阿里云",
    items: [{ name: "云安全中心", type: "SIEM", model: "云安全中心" }],
  },
  {
    vendor: "CrowdStrike",
    items: [{ name: "Falcon", type: "EDR", model: "Falcon" }],
  },
  {
    vendor: "Splunk",
    items: [{ name: "Enterprise Security", type: "SIEM", model: "ES" }],
  },
  {
    vendor: "Coremail",
    items: [{ name: "邮件系统", type: "邮件网关", model: "Coremail" }],
  },
]

const MOCK_DEVICES: DataSourceItem[] = [
  { id: 1, name: "深信服 下一代防火墙", type: "防火墙", brand: "深信服", model: "AF系列", ip: "10.0.1.1", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 120000).toISOString(), log_format: "CEF", log_level: "all", direction: "push", daily_volume: 2850000, health: 99 },
  { id: 2, name: "奇安信 天眼", type: "IDS/IPS", brand: "奇安信", model: "天眼", ip: "10.0.1.2", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 60000).toISOString(), log_format: "JSON", log_level: "all", direction: "push", daily_volume: 4320000, health: 98 },
  { id: 3, name: "奇安信 天擎", type: "EDR", brand: "奇安信", model: "天擎", ip: "10.0.2.1", port: 8080, protocol: "API", status: "online", last_sync: new Date(Date.now() - 180000).toISOString(), log_format: "JSON", log_level: "high", direction: "pull", daily_volume: 1680000, health: 100 },
  { id: 4, name: "奇安信 NGSOC", type: "SIEM", brand: "奇安信", model: "NGSOC", ip: "10.0.1.3", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 90000).toISOString(), log_format: "CEF", log_level: "all", direction: "push", daily_volume: 5200000, health: 97 },
  { id: 5, name: "安恒信息 明御WAF", type: "WAF", brand: "安恒信息", model: "明御WAF", ip: "10.0.3.1", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 30000).toISOString(), log_format: "CEF", log_level: "all", direction: "push", daily_volume: 1950000, health: 99 },
  { id: 6, name: "安恒信息 明御APT", type: "IDS/IPS", brand: "安恒信息", model: "明御APT", ip: "10.0.3.2", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 150000).toISOString(), log_format: "JSON", log_level: "all", direction: "push", daily_volume: 3120000, health: 95 },
  { id: 7, name: "华为 USG系列防火墙", type: "防火墙", brand: "华为", model: "USG系列", ip: "10.0.4.1", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 45000).toISOString(), log_format: "LEEF", log_level: "all", direction: "push", daily_volume: 3750000, health: 100 },
  { id: 8, name: "360 邮件安全网关", type: "邮件网关", brand: "360", model: "邮件安全网关", ip: "10.0.5.1", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 75000).toISOString(), log_format: "CEF", log_level: "all", direction: "push", daily_volume: 820000, health: 99 },
  { id: 9, name: "阿里云 云安全中心", type: "SIEM", brand: "阿里云", model: "云安全中心", ip: "api.aliyun.com", port: 443, protocol: "API", status: "online", last_sync: new Date(Date.now() - 30000).toISOString(), log_format: "JSON", log_level: "all", direction: "pull", daily_volume: 4600000, health: 100 },
  { id: 10, name: "CrowdStrike Falcon", type: "EDR", brand: "CrowdStrike", model: "Falcon", ip: "api.crowdstrike.com", port: 443, protocol: "API", status: "online", last_sync: new Date(Date.now() - 60000).toISOString(), log_format: "JSON", log_level: "high", direction: "pull", daily_volume: 2100000, health: 98 },
  { id: 11, name: "Splunk Enterprise Security", type: "SIEM", brand: "Splunk", model: "ES", ip: "10.0.6.1", port: 8089, protocol: "API", status: "online", last_sync: new Date(Date.now() - 120000).toISOString(), log_format: "JSON", log_level: "all", direction: "pull", daily_volume: 3850000, health: 96 },
  { id: 12, name: "Coremail 邮件系统", type: "邮件网关", brand: "Coremail", model: "Coremail", ip: "10.0.7.1", port: 514, protocol: "Syslog", status: "online", last_sync: new Date(Date.now() - 90000).toISOString(), log_format: "原生", log_level: "all", direction: "push", daily_volume: 650000, health: 100 },
  { id: 13, name: "深信服 SSL VPN", type: "VPN网关", brand: "深信服", model: "SSL VPN", ip: "vpn.secmind.com", port: 443, protocol: "API", status: "online", last_sync: new Date(Date.now() - 180000).toISOString(), log_format: "JSON", log_level: "all", direction: "pull", daily_volume: 120000, health: 100 },
  { id: 14, name: "深信服 EDR", type: "EDR", brand: "深信服", model: "EDR", ip: "10.0.2.2", port: 8080, protocol: "API", status: "online", last_sync: new Date(Date.now() - 60000).toISOString(), log_format: "JSON", log_level: "high", direction: "pull", daily_volume: 1450000, health: 97 },
]

function AddDataSourceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void>
}) {
  const [form, setForm] = useState({
    name: "",
    type: "",
    brand: "",
    model: "",
    ip: "",
    port: "514",
    protocol: "Syslog",
    log_format: "CEF",
    log_level: "all",
    direction: "push",
  })
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<"" | "success">("")

  function handleProductSelect(vendor: string, product: { name: string; type: string; model: string }) {
    setForm((prev) => ({
      ...prev,
      type: product.type,
      brand: vendor,
      model: product.model,
      name: vendor + " " + product.name,
    }))
  }

  async function handleCreate() {
    setSaving(true)
    try {
      await api.post("/devices", {
        ...form,
        port: Number(form.port),
        status: "online",
        daily_volume: 0,
        health: 100,
        vendor: form.brand,
        protocol_config: {},
      })
      setForm({
        name: "",
        type: "",
        brand: "",
        model: "",
        ip: "",
        port: "514",
        protocol: "Syslog",
        log_format: "CEF",
        log_level: "all",
        direction: "push",
      })
      setTestResult("")
      onOpenChange(false)
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  const selectedKey = form.brand && form.model ? form.brand + "-" + form.model : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/[0.06] bg-[#131316] text-zinc-100">
        <DialogHeader>
          <DialogTitle>添加数据源</DialogTitle>
          <DialogDescription className="text-zinc-500">选择告警源产品，配置连接信息后接入 SecMind。</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>选择告警源产品</Label>
            <div className="max-h-40 space-y-3 overflow-y-auto rounded-lg border border-white/6 bg-[#09090b] p-3">
              {VENDOR_PRODUCTS.map((group) => (
                <div key={group.vendor}>
                  <p className="mb-1.5 text-[10px] font-semibold text-zinc-500">{group.vendor}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((product) => {
                      const isSelected = selectedKey === group.vendor + "-" + product.model
                      return (
                        <button
                          key={product.name}
                          onClick={() => handleProductSelect(group.vendor, product)}
                          className={
                            "rounded-md border px-2.5 py-1.5 text-xs transition-all" +
                            (isSelected
                              ? " border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                              : " border-white/6 bg-[#131316] text-zinc-400 hover:border-white/10 hover:text-zinc-200")
                          }
                        >
                          {product.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedKey && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ds-name">设备名称</Label>
                  <Input id="ds-name" name="name" type="text" autoComplete="off" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label>设备类型</Label>
                  <Input value={form.type} className={inputClass} readOnly />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>品牌</Label>
                  <div className="flex h-10 items-center rounded-lg border border-white/6 bg-[#09090b] px-3 text-xs text-zinc-500">{form.brand}</div>
                </div>
                <div className="space-y-2">
                  <Label>型号</Label>
                  <div className="flex h-10 items-center rounded-lg border border-white/6 bg-[#09090b] px-3 text-xs text-zinc-500">{form.model}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ds-ip">IP</Label>
                  <Input id="ds-ip" name="ip" type="text" autoComplete="off" value={form.ip} onChange={(e) => setForm((prev) => ({ ...prev, ip: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-port">端口</Label>
                  <Input id="ds-port" name="port" type="number" autoComplete="off" value={form.port} onChange={(e) => setForm((prev) => ({ ...prev, port: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>协议</Label>
                  <Select value={form.protocol} onValueChange={(value) => setForm((prev) => ({ ...prev, protocol: value || "" }))}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Syslog">Syslog</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="SNMP">SNMP</SelectItem>
                      <SelectItem value="Kafka">Kafka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>日志格式</Label>
                  <Select value={form.log_format} onValueChange={(value) => setForm((prev) => ({ ...prev, log_format: value || "" }))}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CEF">CEF</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="LEEF">LEEF</SelectItem>
                      <SelectItem value="原生">原生</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => setTestResult("success")}>测试连接</Button>
                {testResult === "success" && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="size-4" />连接成功</span>}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={saving || !form.brand || !form.ip} className="bg-cyan-600 text-white hover:bg-cyan-700">{saving ? "保存中..." : "确认接入"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DataSourcePage() {
  const isDemo = useAuthStore(s => s.user?.isDemo)
  const [items, setItems] = useState<DataSourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")

  async function loadDevices() {
    if (isDemo) {
      setItems(MOCK_DEVICES)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get("/devices")
      setItems(response.data.items)
    } catch {
      setItems(MOCK_DEVICES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDevices()
  }, [isDemo])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return [item.name, item.brand ?? "", item.type, item.ip].some((value) => value.toLowerCase().includes(q))
    })
  }, [items, query, statusFilter])

  const onlineCount = items.filter((item) => item.status === "online").length
  const offlineCount = items.filter((item) => item.status === "offline").length
  const totalVolume = items.reduce((sum, item) => sum + (item.daily_volume ?? 0), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Database}
        title="数据源管理"
        subtitle={<span>测试连接、确认接入后的数据源会进入数据库。</span>}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-cyan-600 text-white hover:bg-cyan-700">
            <Plus className="mr-1 size-4" />
            添加数据源
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <button aria-pressed={statusFilter === "online"} onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")} className={softCardClass + " p-4 text-left" + (statusFilter === "online" ? " ring-2 ring-emerald-200" : "")}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-zinc-500">在线设备</p><p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{onlineCount}</p></div>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><Wifi className="size-4" /></span>
          </div>
        </button>
        <button aria-pressed={statusFilter === "offline"} onClick={() => setStatusFilter(statusFilter === "offline" ? "all" : "offline")} className={softCardClass + " p-4 text-left" + (statusFilter === "offline" ? " ring-2 ring-red-200" : "")}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-zinc-500">离线设备</p><p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{offlineCount}</p></div>
            <span className="rounded-lg bg-red-500/10 p-2 text-red-400"><WifiOff className="size-4" /></span>
          </div>
        </button>
        <div className={softCardClass + " p-4"}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-zinc-500">日均日志量</p><p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{Math.round(totalVolume / 1000)}K</p></div>
            <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400"><Database className="size-4" /></span>
          </div>
        </div>
      </div>

      <div className={softCardClass + " flex flex-col gap-3 p-4 md:flex-row md:items-center"}>
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索设备名称、品牌、类型、IP..." className={"pl-9 " + inputClass} />
          </div>
        <div className="text-sm text-zinc-500">当前显示 {filtered.length} 台设备</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className={pageCardClass}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400"><Server className="size-4" /></span>
                    <div>
                      <h3 className="font-semibold text-zinc-100">{item.name}</h3>
                      <p className="text-sm text-zinc-500">{item.brand || "-"} {item.model || ""}</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={item.status === "online" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-red-500/25 bg-red-500/10 text-red-400"}>
                  {item.status === "online" ? "在线" : "离线"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-500/25 bg-cyan-500/10 text-cyan-400">{item.type}</Badge>
                <Badge variant="outline" className="border-white/[0.08] bg-white/[0.03] text-zinc-400">{item.protocol || "-"}</Badge>
                <Badge variant="outline" className="border-white/[0.08] bg-white/[0.03] text-zinc-400">{item.log_format || "-"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-500">
                <div>地址：{item.ip}:{item.port || "-"}</div>
                <div>方向：{item.direction || "-"}</div>
                <div>级别：{item.log_level || "-"}</div>
                <div>同步：{formatDateTime(item.last_sync)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && <div className="text-zinc-500">数据源加载中...</div>}

      <AddDataSourceDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadDevices} />
    </div>
  )
}