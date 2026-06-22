"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plug,
  Plus,
  Pencil,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { inputClass, pageCardClass } from "@/lib/admin-ui"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ==================== 类型定义 ====================

interface MCPConnector {
  id: number
  name: string
  display_name: string
  connector_type: "api" | "database" | "file" | "script"
  endpoint_url: string
  api_key?: string
  config?: Record<string, unknown>
  status: "connected" | "disconnected" | "error"
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface ConnectorForm {
  name: string
  display_name: string
  connector_type: "api" | "database" | "file" | "script"
  endpoint_url: string
  api_key: string
  config: string
}

interface TestResult {
  success: boolean
  latency_ms?: number
  error?: string
}

const CONNECTOR_TYPE_OPTIONS = [
  { value: "api", label: "API" },
  { value: "database", label: "Database" },
  { value: "file", label: "File" },
  { value: "script", label: "Script" },
] as const

const EMPTY_FORM: ConnectorForm = {
  name: "",
  display_name: "",
  connector_type: "api",
  endpoint_url: "",
  api_key: "",
  config: "{}",
}

// ==================== 辅助函数 ====================

function getStatusIcon(status: string) {
  switch (status) {
    case "connected":
      return <Wifi className="size-3" />
    case "error":
      return <AlertTriangle className="size-3" />
    default:
      return <WifiOff className="size-3" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "connected":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
    case "error":
      return "border-red-500/20 bg-red-500/10 text-red-600"
    default:
      return "border-border bg-muted/50 text-muted-foreground"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "connected":
      return "已连接"
    case "error":
      return "错误"
    default:
      return "未连接"
  }
}

function getConnectorTypeLabel(type: string) {
  const option = CONNECTOR_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.label ?? type
}

// ==================== 主页面 ====================

export function MCPPage() {
  const [connectors, setConnectors] = useState<MCPConnector[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConnector, setEditingConnector] = useState<MCPConnector | null>(null)
  const [form, setForm] = useState<ConnectorForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({})
  const [testingIds, setTestingIds] = useState<Set<number>>(new Set())
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // ---------- 数据加载 ----------

  const loadConnectors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/mcp/connectors")
      setConnectors(res.data?.items ?? res.data ?? [])
    } catch {
      setConnectors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadConnectors()
    })
  }, [loadConnectors])

  // ---------- 新增/编辑 ----------

  function openAddDialog() {
    setEditingConnector(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  function openEditDialog(connector: MCPConnector) {
    setEditingConnector(connector)
    setForm({
      name: connector.name,
      display_name: connector.display_name,
      connector_type: connector.connector_type,
      endpoint_url: connector.endpoint_url,
      api_key: "",
      config: connector.config ? JSON.stringify(connector.config, null, 2) : "{}",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let parsedConfig: Record<string, unknown> = {}
      try {
        parsedConfig = JSON.parse(form.config || "{}")
      } catch {
        parsedConfig = {}
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        display_name: form.display_name,
        connector_type: form.connector_type,
        endpoint_url: form.endpoint_url,
        config: parsedConfig,
      }
      if (form.api_key) {
        payload.api_key = form.api_key
      }

      if (editingConnector) {
        await api.put(`/mcp/connectors/${editingConnector.id}`, payload)
      } else {
        await api.post("/mcp/connectors", payload)
      }
      setDialogOpen(false)
      await loadConnectors()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  // ---------- 删除 ----------

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await api.delete(`/mcp/connectors/${id}`)
      await loadConnectors()
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // ---------- 测试连接 ----------

  async function handleTestConnection(id: number) {
    setTestingIds((prev) => new Set(prev).add(id))
    setTestResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    try {
      const res = await api.post(`/mcp/connectors/${id}/test`)
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: res.data?.success ?? true,
          latency_ms: res.data?.latency_ms,
          error: res.data?.error,
        },
      }))
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "连接测试失败"
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, error: message },
      }))
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // ---------- 切换启用/禁用 ----------

  async function handleToggle(id: number) {
    setTogglingId(id)
    try {
      await api.post(`/mcp/connectors/${id}/toggle`)
      await loadConnectors()
    } catch {
      // ignore
    } finally {
      setTogglingId(null)
    }
  }

  // ==================== 渲染 ====================

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <PageHeader
        icon={Plug}
        title="MCP 管理"
        subtitle="管理 MCP 连接器配置"
        actions={
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="size-4" />
            添加连接器
          </Button>
        }
      />

      {/* 连接器列表 */}
      {loading ? (
        <div className={cn(pageCardClass, "flex items-center justify-center py-20")}>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : connectors.length === 0 ? (
        <div className={cn(pageCardClass, "flex flex-col items-center justify-center px-6 py-20 text-center")}>
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Plug className="size-6" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-foreground">尚未接入 MCP 连接器</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            配置连接器后，AI 可调用外部情报、数据库或脚本能力完成证据补充。
          </p>
          <Button size="sm" className="mt-5 gap-1.5" onClick={openAddDialog}>
            <Plus className="size-3.5" />
            添加第一个连接器
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connectors.map((connector) => {
            const isTesting = testingIds.has(connector.id)
            const testResult = testResults[connector.id]
            const isToggling = togglingId === connector.id

            return (
              <Card key={connector.id} className={cn(pageCardClass, "relative")}>
                <CardContent className="space-y-4 p-5">
                  {/* 头部信息 */}
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Plug className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {connector.display_name || connector.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {connector.name}
                      </p>
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">类型</span>
                      <Badge variant="outline" className="text-xs">
                        {getConnectorTypeLabel(connector.connector_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">端点</span>
                      <span className="font-mono text-xs text-foreground truncate max-w-[180px]">
                        {connector.endpoint_url}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">状态</span>
                      <Badge
                        variant="outline"
                        className={cn("gap-1", getStatusBadge(connector.status))}
                      >
                        {getStatusIcon(connector.status)}
                        {getStatusLabel(connector.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">启用</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          connector.is_active
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                            : "border-border bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {connector.is_active ? (
                          <CheckCircle2 className="mr-1 size-3" />
                        ) : (
                          <XCircle className="mr-1 size-3" />
                        )}
                        {connector.is_active ? "已启用" : "已禁用"}
                      </Badge>
                    </div>
                  </div>

                  {/* 测试结果 */}
                  {testResult && (
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs",
                        testResult.success
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                          : "border-red-500/20 bg-red-500/5 text-red-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        {testResult.success ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <XCircle className="size-3.5" />
                        )}
                        {testResult.success ? "连接成功" : "连接失败"}
                      </div>
                      {testResult.success && testResult.latency_ms != null && (
                        <div className="mt-1 text-muted-foreground">
                          延迟: {testResult.latency_ms}ms
                        </div>
                      )}
                      {!testResult.success && testResult.error && (
                        <div className="mt-1">{testResult.error}</div>
                      )}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(connector)}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(connector.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <Zap className="mr-1 size-3.5" />
                      )}
                      测试连接
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(connector.id)}
                      disabled={isToggling}
                    >
                      {isToggling ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : connector.is_active ? (
                        <XCircle className="mr-1 size-3.5" />
                      ) : (
                        <CheckCircle2 className="mr-1 size-3.5" />
                      )}
                      {connector.is_active ? "禁用" : "启用"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(connector.id)}
                      disabled={deletingId === connector.id}
                    >
                      {deletingId === connector.id ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 size-3.5" />
                      )}
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingConnector ? "编辑连接器" : "添加连接器"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingConnector
                ? "修改 MCP 连接器配置，API Key 留空则保持不变。"
                : "配置 MCP 连接器的连接信息和参数。"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 标识名 */}
            <div className="space-y-2">
              <Label htmlFor="connector-name">标识名</Label>
              <Input
                id="connector-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="例如: my-virustotal"
                autoComplete="off"
                disabled={!!editingConnector}
              />
              <p className="text-xs text-muted-foreground">唯一标识符，创建后不可修改</p>
            </div>

            {/* 显示名称 */}
            <div className="space-y-2">
              <Label htmlFor="connector-display-name">显示名称</Label>
              <Input
                id="connector-display-name"
                value={form.display_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_name: e.target.value }))
                }
                className={inputClass}
                placeholder="例如: VirusTotal API"
                autoComplete="off"
              />
            </div>

            {/* 连接器类型 */}
            <div className="space-y-2">
              <Label>连接器类型</Label>
              <Select
                value={form.connector_type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    connector_type: value as ConnectorForm["connector_type"],
                  }))
                }
              >
                <SelectTrigger className={cn("w-full", inputClass)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONNECTOR_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Endpoint URL */}
            <div className="space-y-2">
              <Label htmlFor="connector-endpoint">Endpoint URL</Label>
              <Input
                id="connector-endpoint"
                value={form.endpoint_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endpoint_url: e.target.value }))
                }
                className={inputClass}
                placeholder="API 端点地址"
                type="url"
                autoComplete="off"
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="connector-api-key">API Key</Label>
              <Input
                id="connector-api-key"
                type="password"
                value={form.api_key}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, api_key: e.target.value }))
                }
                className={inputClass}
                placeholder={editingConnector ? "留空则保持不变" : "输入 API Key"}
                autoComplete="off"
              />
            </div>

            {/* Config JSON */}
            <div className="space-y-2">
              <Label htmlFor="connector-config">配置 (JSON)</Label>
              <Textarea
                id="connector-config"
                value={form.config}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, config: e.target.value }))
                }
                className={cn(inputClass, "font-mono text-xs min-h-24")}
                placeholder='{"key": "value"}'
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">JSON 格式的额外配置参数</p>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.endpoint_url}>
                {saving ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : null}
                {editingConnector ? "保存修改" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
