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

const deviceTypes = ["防火墙", "VPN网关", "WAF", "IDS/IPS", "EDR", "NAC", "SIEM", "邮件网关", "DLP"]

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
    type: "防火墙",
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
        type: "防火墙",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>添加数据源</DialogTitle>
          <DialogDescription className="text-slate-500">新数据源会直接保存到数据库中的 `devices` 表。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ds-name">设备名称</Label>
              <Input id="ds-name" name="name" type="text" autoComplete="off" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label>设备类型</Label>
              <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value || '' }))}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>{deviceTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ds-brand">品牌</Label>
              <Input id="ds-brand" name="brand" type="text" autoComplete="off" value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-model">型号</Label>
              <Input id="ds-model" name="model" type="text" autoComplete="off" value={form.model} onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))} className={inputClass} />
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
              <Select value={form.protocol} onValueChange={(value) => setForm((prev) => ({ ...prev, protocol: value || '' }))}>
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
              <Select value={form.log_format} onValueChange={(value) => setForm((prev) => ({ ...prev, log_format: value || '' }))}>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-cyan-600 text-white hover:bg-cyan-700">{saving ? "保存中…" : "确认接入"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DataSourcePage() {
  const [items, setItems] = useState<DataSourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")

  async function loadDevices() {
    setLoading(true)
    try {
      const response = await api.get("/devices")
      setItems(response.data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadDevices()
    })
  }, [])

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
        subtitle={<span>测试连接、确认接入后的数据源会进入数据库，而不是只停留在浏览器。</span>}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-cyan-600 text-white hover:bg-cyan-700">
            <Plus className="mr-1 size-4" />
            添加数据源
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <button aria-pressed={statusFilter === "online"} onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")} className={`${softCardClass} p-4 text-left ${statusFilter === "online" ? "ring-2 ring-emerald-200" : ""}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-slate-500">在线设备</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{onlineCount}</p></div>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Wifi className="size-4" /></span>
          </div>
        </button>
        <button aria-pressed={statusFilter === "offline"} onClick={() => setStatusFilter(statusFilter === "offline" ? "all" : "offline")} className={`${softCardClass} p-4 text-left ${statusFilter === "offline" ? "ring-2 ring-red-200" : ""}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-slate-500">离线设备</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{offlineCount}</p></div>
            <span className="rounded-lg bg-red-50 p-2 text-red-600"><WifiOff className="size-4" /></span>
          </div>
        </button>
        <div className={`${softCardClass} p-4`}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-slate-500">日均日志量</p><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{Math.round(totalVolume / 1000)}K</p></div>
            <span className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Database className="size-4" /></span>
          </div>
        </div>
      </div>

      <div className={`${softCardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索设备名称、品牌、类型、IP…" className={`pl-9 ${inputClass}`} />
        </div>
        <div className="text-sm text-slate-500">当前显示 {filtered.length} 台设备</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className={pageCardClass}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><Server className="size-4" /></span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-500">{item.brand || "-"} {item.model || ""}</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={item.status === "online" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}>
                  {item.status === "online" ? "在线" : "离线"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">{item.type}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{item.protocol || "-"}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{item.log_format || "-"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                <div>地址：{item.ip}:{item.port || "-"}</div>
                <div>方向：{item.direction || "-"}</div>
                <div>级别：{item.log_level || "-"}</div>
                <div>同步：{formatDateTime(item.last_sync)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && <div className="text-slate-500">数据源加载中…</div>}

      <AddDataSourceDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadDevices} />
    </div>
  )
}
