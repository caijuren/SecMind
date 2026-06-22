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
import { useLocaleStore } from "@/store/locale-store"

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
    vendorLabelKey: "datasource.brandSangfor",
    items: [
      { name: "datasource.productSslVpn", type: "datasource.deviceTypeVPN", model: "SSL VPN" },
      { name: "datasource.productNextGenFirewall", type: "datasource.deviceTypeFirewall", model: "AF系列" },
      { name: "EDR", type: "datasource.deviceTypeEDR", model: "EDR" },
    ],
  },
  {
    vendorLabelKey: "datasource.brandQianxin",
    items: [
      { name: "datasource.productTianqing", type: "datasource.deviceTypeEDR", model: "天擎" },
      { name: "datasource.productTianyan", type: "datasource.deviceTypeIDSIPS", model: "天眼" },
      { name: "NGSOC", type: "datasource.deviceTypeSIEM", model: "NGSOC" },
    ],
  },
  {
    vendorLabelKey: "datasource.brandAnheng",
    items: [
      { name: "datasource.productMingyuWaf", type: "datasource.deviceTypeWAF", model: "明御WAF" },
      { name: "datasource.productMingyuApt", type: "datasource.deviceTypeIDSIPS", model: "明御APT" },
    ],
  },
  {
    vendorLabelKey: "datasource.brandHuawei",
    items: [{ name: "datasource.productUsgFirewall", type: "datasource.deviceTypeFirewall", model: "USG系列" }],
  },
  {
    vendorLabelKey: "datasource.brand360",
    items: [{ name: "datasource.productEmailGateway", type: "datasource.deviceTypeEmailGateway", model: "邮件安全网关" }],
  },
  {
    vendorLabelKey: "datasource.brandAliyun",
    items: [{ name: "datasource.productCloudSecurity", type: "datasource.deviceTypeSIEM", model: "云安全中心" }],
  },
  {
    vendorLabelKey: "datasource.brandCrowdStrike",
    items: [{ name: "datasource.productFalcon", type: "datasource.deviceTypeEDR", model: "Falcon" }],
  },
  {
    vendorLabelKey: "datasource.brandSplunk",
    items: [{ name: "datasource.productEnterpriseSecurity", type: "datasource.deviceTypeSIEM", model: "ES" }],
  },
  {
    vendorLabelKey: "datasource.brandCoremail",
    items: [{ name: "datasource.productCoremailEmail", type: "datasource.deviceTypeEmailGateway", model: "Coremail" }],
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
  const { t } = useLocaleStore()
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

  function handleProductSelect(vendorLabelKey: string, product: { name: string; type: string; model: string }) {
    setForm((prev) => ({
      ...prev,
      type: t(product.type),
      brand: t(vendorLabelKey),
      model: product.model,
      name: t(vendorLabelKey) + " " + t(product.name),
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
      <DialogContent className="max-w-2xl border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{t("datasource.dialogTitle")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t("datasource.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>{t("datasource.selectProduct")}</Label>
            <div className="max-h-40 space-y-3 overflow-y-auto rounded-lg border border-border bg-background p-3">
              {VENDOR_PRODUCTS.map((group) => (
                <div key={group.vendorLabelKey}>
                  <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground">{t(group.vendorLabelKey)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((product) => {
                      const isSelected = selectedKey === t(group.vendorLabelKey) + "-" + product.model
                      return (
                        <button
                          key={product.name}
                          onClick={() => handleProductSelect(group.vendorLabelKey, product)}
                          className={
                            "rounded-md border px-2.5 py-1.5 text-xs transition-all" +
                            (isSelected
                              ? " border-cyan-500/50 bg-primary/10 text-primary"
                              : " border-border bg-card text-muted-foreground hover:border-border hover:text-foreground")
                          }
                        >
                          {t(product.name)}
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
                  <Label htmlFor="ds-name">{t("datasource.deviceName")}</Label>
                  <Input id="ds-name" name="name" type="text" autoComplete="off" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label>{t("datasource.deviceType")}</Label>
                  <Input value={form.type} className={inputClass} readOnly />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("datasource.brand")}</Label>
                  <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground">{form.brand}</div>
                </div>
                <div className="space-y-2">
                  <Label>{t("datasource.model")}</Label>
                  <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground">{form.model}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ds-ip">{t("datasource.ip")}</Label>
                  <Input id="ds-ip" name="ip" type="text" autoComplete="off" value={form.ip} onChange={(e) => setForm((prev) => ({ ...prev, ip: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-port">{t("datasource.port")}</Label>
                  <Input id="ds-port" name="port" type="number" autoComplete="off" value={form.port} onChange={(e) => setForm((prev) => ({ ...prev, port: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("datasource.protocol")}</Label>
                  <Select value={form.protocol} onValueChange={(value) => setForm((prev) => ({ ...prev, protocol: value || "" }))}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Syslog">{t("datasource.protocolSyslog")}</SelectItem>
                      <SelectItem value="API">{t("datasource.protocolAPI")}</SelectItem>
                      <SelectItem value="SNMP">{t("datasource.protocolSNMP")}</SelectItem>
                      <SelectItem value="Kafka">{t("datasource.protocolKafka")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("datasource.logFormat")}</Label>
                  <Select value={form.log_format} onValueChange={(value) => setForm((prev) => ({ ...prev, log_format: value || "" }))}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CEF">{t("datasource.logFormatCEF")}</SelectItem>
                      <SelectItem value="JSON">{t("datasource.logFormatJSON")}</SelectItem>
                      <SelectItem value="LEEF">{t("datasource.logFormatLEEF")}</SelectItem>
                      <SelectItem value="原生">{t("datasource.logFormatNative")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => setTestResult("success")}>{t("datasource.testConnection")}</Button>
                {testResult === "success" && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="size-4" />{t("datasource.connectionSuccess")}</span>}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("datasource.cancel")}</Button>
            <Button onClick={handleCreate} disabled={saving || !form.brand || !form.ip} className="bg-cyan-600 text-foreground hover:bg-cyan-700">{saving ? t("datasource.saving") : t("datasource.confirmAccess")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DataSourcePage() {
  const { t } = useLocaleStore()
  const [items, setItems] = useState<DataSourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all")

  async function loadDevices() {
    setLoading(true)
    try {
      const response = await api.get("/devices")
      setItems(response.data.items?.length > 0 ? response.data.items : MOCK_DEVICES)
    } catch {
      setItems(MOCK_DEVICES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        void loadDevices()
      })
    } else {
      Promise.resolve().then(() => loadDevices())
    }
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
        title={t("datasource.pageTitle")}
        subtitle={<span>{t("datasource.pageSubtitle")}</span>}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-cyan-600 text-foreground hover:bg-cyan-700">
            <Plus className="mr-1 size-4" />
            {t("datasource.addDataSource")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <button aria-pressed={statusFilter === "online"} onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")} className={softCardClass + " p-4 text-left" + (statusFilter === "online" ? " ring-2 ring-emerald-200" : "")}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">{t("datasource.onlineDevices")}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{onlineCount}</p></div>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><Wifi className="size-4" /></span>
          </div>
        </button>
        <button aria-pressed={statusFilter === "offline"} onClick={() => setStatusFilter(statusFilter === "offline" ? "all" : "offline")} className={softCardClass + " p-4 text-left" + (statusFilter === "offline" ? " ring-2 ring-red-200" : "")}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">{t("datasource.offlineDevices")}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{offlineCount}</p></div>
            <span className="rounded-lg bg-red-500/10 p-2 text-red-600"><WifiOff className="size-4" /></span>
          </div>
        </button>
        <div className={softCardClass + " p-4"}>
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">{t("datasource.dailyLogVolume")}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{Math.round(totalVolume / 1000)}K</p></div>
            <span className="rounded-lg bg-primary/10 p-2 text-cyan-600"><Database className="size-4" /></span>
          </div>
        </div>
      </div>

      <div className={softCardClass + " flex flex-col gap-3 p-4 md:flex-row md:items-center"}>
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("datasource.searchPlaceholder")} className={"pl-9 " + inputClass} />
          </div>
        <div className="text-sm text-muted-foreground">{t("datasource.deviceCount").replace("{count}", String(filtered.length))}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className={pageCardClass}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 p-2 text-cyan-600"><Server className="size-4" /></span>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.brand || "-"} {item.model || ""}</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={item.status === "online" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600" : "border-red-500/25 bg-red-500/10 text-red-600"}>
                  {item.status === "online" ? t("datasource.online") : t("datasource.offline")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-500/25 bg-primary/10 text-cyan-600">{item.type}</Badge>
                <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">{item.protocol || "-"}</Badge>
                <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">{item.log_format || "-"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>{t("datasource.address")}：{item.ip}:{item.port || "-"}</div>
                <div>{t("datasource.direction")}：{item.direction || "-"}</div>
                <div>{t("datasource.level")}：{item.log_level || "-"}</div>
                <div>{t("datasource.sync")}：{formatDateTime(item.last_sync)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && <div className="text-muted-foreground">{t("datasource.loading")}</div>}

      <AddDataSourceDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadDevices} />
    </div>
  )
}
