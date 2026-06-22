"use client"

import { useState, useEffect, useCallback } from "react"
import {
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  Cloud,
  Cpu,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ==================== 类型定义 ====================

interface Provider {
  id: number
  name: string
  display_name: string
  provider_type: "openai_compatible" | "azure" | "ollama"
  api_key?: string
  base_url: string
  model: string
  max_tokens: number
  temperature: number
  timeout: number
  is_active: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

interface ProviderForm {
  name: string
  display_name: string
  provider_type: "openai_compatible" | "azure" | "ollama"
  api_key: string
  base_url: string
  model: string
  max_tokens: number
  temperature: number
  timeout: number
}

interface TestResult {
  success: boolean
  latency_ms?: number
  model?: string
  error?: string
}

const PROVIDER_TYPE_OPTIONS = [
  { value: "openai_compatible", label: "OpenAI Compatible", icon: Cloud },
  { value: "azure", label: "Azure OpenAI", icon: Server },
  { value: "ollama", label: "Ollama", icon: Cpu },
] as const

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai_compatible: "https://api.openai.com/v1",
  azure: "",
  ollama: "http://localhost:11434/v1",
}

const EMPTY_FORM: ProviderForm = {
  name: "",
  display_name: "",
  provider_type: "openai_compatible",
  api_key: "",
  base_url: "https://api.openai.com/v1",
  model: "gpt-4o",
  max_tokens: 4096,
  temperature: 0.7,
  timeout: 60,
}

// ==================== 辅助函数 ====================

function maskApiKey(key?: string): string {
  if (!key) return "••••••••"
  if (key.length <= 8) return "••••••••"
  return key.slice(0, 4) + "••••" + key.slice(-4)
}

function getProviderTypeIcon(type: string) {
  const option = PROVIDER_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.icon ?? Cloud
}

function getProviderTypeLabel(type: string) {
  const option = PROVIDER_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.label ?? type
}

// ==================== 主页面 ====================

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [form, setForm] = useState<ProviderForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({})
  const [testingIds, setTestingIds] = useState<Set<number>>(new Set())
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ---------- 数据加载 ----------

  const loadProviders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/providers")
      setProviders(res.data?.items ?? res.data ?? [])
    } catch {
      setProviders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadProviders()
    })
  }, [loadProviders])

  // ---------- 新增/编辑 ----------

  function openAddDialog() {
    setEditingProvider(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  function openEditDialog(provider: Provider) {
    setEditingProvider(provider)
    setForm({
      name: provider.name,
      display_name: provider.display_name,
      provider_type: provider.provider_type,
      api_key: "",
      base_url: provider.base_url,
      model: provider.model,
      max_tokens: provider.max_tokens,
      temperature: provider.temperature,
      timeout: provider.timeout,
    })
    setDialogOpen(true)
  }

  function handleProviderTypeChange(value: string | null) {
    const type = value ?? "openai_compatible"
    setForm((prev) => ({
      ...prev,
      provider_type: type as ProviderForm["provider_type"],
      base_url: DEFAULT_BASE_URLS[type] || prev.base_url,
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        display_name: form.display_name,
        provider_type: form.provider_type,
        base_url: form.base_url,
        model: form.model,
        max_tokens: Number(form.max_tokens),
        temperature: Number(form.temperature),
        timeout: Number(form.timeout),
      }
      if (form.api_key) {
        payload.api_key = form.api_key
      }

      if (editingProvider) {
        await api.put(`/providers/${editingProvider.id}`, payload)
      } else {
        await api.post("/providers", payload)
      }
      setDialogOpen(false)
      await loadProviders()
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
      await api.delete(`/providers/${id}`)
      await loadProviders()
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
      const res = await api.post(`/providers/${id}/test`)
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: res.data?.success ?? true,
          latency_ms: res.data?.latency_ms,
          model: res.data?.model,
          error: res.data?.error,
        },
      }))
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "连接失败"
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

  // ---------- 设为默认 ----------

  async function handleSetDefault(id: number) {
    try {
      await api.post(`/providers/${id}/set-default`)
      await loadProviders()
    } catch {
      // ignore
    }
  }

  // ==================== 渲染 ====================

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <PageHeader
        icon={KeyRound}
        title="Provider 配置"
        subtitle="管理 AI 模型供应商和 API 密钥"
        actions={
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="size-4" />
            添加 Provider
          </Button>
        }
      />

      {/* Provider 列表 */}
      {loading ? (
        <div className={cn(pageCardClass, "flex items-center justify-center py-20")}>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : providers.length === 0 ? (
        <div className={cn(pageCardClass, "flex flex-col items-center justify-center px-6 py-20 text-center")}>
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <KeyRound className="size-6" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-foreground">尚未配置模型供应商</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            添加 Provider 后，AI 研判、问答助手和自动处置建议将使用对应模型能力。
          </p>
          <Button size="sm" className="mt-5 gap-1.5" onClick={openAddDialog}>
            <Plus className="size-3.5" />
            添加第一个 Provider
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => {
            const TypeIcon = getProviderTypeIcon(provider.provider_type)
            const isTesting = testingIds.has(provider.id)
            const testResult = testResults[provider.id]

            return (
              <Card key={provider.id} className={cn(pageCardClass, "relative")}>
                {/* 默认标识 */}
                {provider.is_default && (
                  <div className="absolute top-3 right-3">
                    <Badge className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-600">
                      <Star className="size-3" />
                      默认
                    </Badge>
                  </div>
                )}

                <CardContent className="space-y-4 p-5">
                  {/* 头部信息 */}
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TypeIcon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {provider.display_name || provider.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {provider.name}
                      </p>
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">类型</span>
                      <Badge variant="outline" className="text-xs">
                        {getProviderTypeLabel(provider.provider_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">模型</span>
                      <span className="font-mono text-xs text-foreground">
                        {provider.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API Key</span>
                      <span className="font-mono text-xs text-foreground">
                        {maskApiKey(provider.api_key)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">状态</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          provider.is_active
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                            : "border-border bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {provider.is_active ? (
                          <CheckCircle2 className="mr-1 size-3" />
                        ) : (
                          <XCircle className="mr-1 size-3" />
                        )}
                        {provider.is_active ? "已启用" : "已禁用"}
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
                      {testResult.success && (
                        <div className="mt-1 text-muted-foreground">
                          {testResult.latency_ms != null && (
                            <span>延迟: {testResult.latency_ms}ms</span>
                          )}
                          {testResult.model && (
                            <span className="ml-3">模型: {testResult.model}</span>
                          )}
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
                      onClick={() => openEditDialog(provider)}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(provider.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <Zap className="mr-1 size-3.5" />
                      )}
                      测试连接
                    </Button>
                    {!provider.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(provider.id)}
                      >
                        <Star className="mr-1 size-3.5" />
                        设为默认
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
                      disabled={deletingId === provider.id}
                    >
                      {deletingId === provider.id ? (
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
              {editingProvider ? "编辑 Provider" : "添加 Provider"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingProvider
                ? "修改 Provider 配置，API Key 留空则保持不变。"
                : "配置 AI 模型供应商的连接信息和参数。"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 标识名 */}
            <div className="space-y-2">
              <Label htmlFor="provider-name">标识名</Label>
              <Input
                id="provider-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="例如: my-openai"
                autoComplete="off"
                disabled={!!editingProvider}
              />
              <p className="text-xs text-muted-foreground">唯一标识符，创建后不可修改</p>
            </div>

            {/* 显示名称 */}
            <div className="space-y-2">
              <Label htmlFor="provider-display-name">显示名称</Label>
              <Input
                id="provider-display-name"
                value={form.display_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_name: e.target.value }))
                }
                className={inputClass}
                placeholder="例如: 我的 OpenAI"
                autoComplete="off"
              />
            </div>

            {/* 供应商类型 */}
            <div className="space-y-2">
              <Label>供应商类型</Label>
              <Select
                value={form.provider_type}
                onValueChange={handleProviderTypeChange}
              >
                <SelectTrigger className={cn("w-full", inputClass)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <opt.icon className="mr-2 size-4" />
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="provider-api-key">API Key</Label>
              <Input
                id="provider-api-key"
                type="password"
                value={form.api_key}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, api_key: e.target.value }))
                }
                className={inputClass}
                placeholder={editingProvider ? "留空则保持不变" : "输入 API Key"}
                autoComplete="off"
              />
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="provider-base-url">Base URL</Label>
              <Input
                id="provider-base-url"
                value={form.base_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, base_url: e.target.value }))
                }
                className={inputClass}
                placeholder="API 基础地址"
                type="url"
                autoComplete="off"
              />
            </div>

            {/* 模型 */}
            <div className="space-y-2">
              <Label htmlFor="provider-model">模型</Label>
              <Input
                id="provider-model"
                value={form.model}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, model: e.target.value }))
                }
                className={inputClass}
                placeholder="例如: gpt-4o"
                autoComplete="off"
              />
            </div>

            {/* 参数行 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="provider-max-tokens">Max Tokens</Label>
                <Input
                  id="provider-max-tokens"
                  type="number"
                  value={form.max_tokens}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      max_tokens: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  min={1}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-temperature">Temperature</Label>
                <Input
                  id="provider-temperature"
                  type="number"
                  value={form.temperature}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      temperature: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  min={0}
                  max={2}
                  step={0.1}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-timeout">超时 (秒)</Label>
                <Input
                  id="provider-timeout"
                  type="number"
                  value={form.timeout}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      timeout: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  min={1}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.model}>
                {saving ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : null}
                {editingProvider ? "保存修改" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
