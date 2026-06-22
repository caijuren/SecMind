"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Workflow,
  Plus,
  Pencil,
  Trash2,
  Play,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { api, formatDateTime } from "@/lib/api"
import { inputClass, pageCardClass } from "@/lib/admin-ui"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"
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
import { ScrollArea } from "@/components/ui/scroll-area"

// ==================== 类型定义 ====================

interface Skill {
  id: number
  name: string
  display_name: string
  description?: string
  category: "investigation" | "response" | "management" | "utility"
  skill_type: "atomic" | "composite"
  required_connectors?: string[]
  parameters?: Record<string, unknown>
  script_content?: string
  execution_timeout?: number
  trigger_mode: "auto" | "manual" | "approval"
  is_active: boolean
  execution_count?: number
  created_at?: string
  updated_at?: string
}

interface SkillForm {
  name: string
  display_name: string
  description: string
  category: "investigation" | "response" | "management" | "utility"
  skill_type: "atomic" | "composite"
  required_connectors: string
  parameters: string
  script_content: string
  execution_timeout: number
  trigger_mode: "auto" | "manual" | "approval"
}

interface Execution {
  execution_id: string
  trigger_type: string
  status: "running" | "success" | "failed" | "timeout"
  started_at: string
  duration_ms?: number
  output?: string
}

const CATEGORY_OPTIONS = [
  { value: "investigation", labelKey: "skillCategoryInvestigation" },
  { value: "response", labelKey: "skillCategoryResponse" },
  { value: "management", labelKey: "skillCategoryManagement" },
  { value: "utility", labelKey: "skillCategoryUtility" },
] as const

const SKILL_TYPE_OPTIONS = [
  { value: "atomic", label: "原子技能" },
  { value: "composite", label: "组合技能" },
] as const

const TRIGGER_MODE_OPTIONS = [
  { value: "auto", label: "自动" },
  { value: "manual", label: "手动" },
  { value: "approval", label: "审批" },
] as const

const EMPTY_FORM: SkillForm = {
  name: "",
  display_name: "",
  description: "",
  category: "investigation",
  skill_type: "atomic",
  required_connectors: "",
  parameters: "{}",
  script_content: "",
  execution_timeout: 60,
  trigger_mode: "manual",
}

// ==================== 辅助函数 ====================

function getCategoryBadge(category: string) {
  switch (category) {
    case "investigation":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600"
    case "response":
      return "border-orange-500/20 bg-orange-500/10 text-orange-600"
    case "management":
      return "border-border bg-muted/50 text-muted-foreground"
    case "utility":
      return "border-purple-500/20 bg-purple-500/10 text-purple-600"
    default:
      return "border-border bg-muted/50 text-muted-foreground"
  }
}

function getCategoryLabel(category: string, t: (key: string) => string) {
  const option = CATEGORY_OPTIONS.find((o) => o.value === category)
  return option ? t("settings." + option.labelKey) : category
}

function getTriggerModeBadge(mode: string) {
  switch (mode) {
    case "auto":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
    case "manual":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600"
    case "approval":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600"
    default:
      return "border-border bg-muted/50 text-muted-foreground"
  }
}

function getTriggerModeLabel(mode: string) {
  const option = TRIGGER_MODE_OPTIONS.find((o) => o.value === mode)
  return option?.label ?? mode
}

function getExecutionStatusBadge(status: string) {
  switch (status) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-600"
    case "running":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600"
    case "timeout":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600"
    default:
      return "border-border bg-muted/50 text-muted-foreground"
  }
}

function getExecutionStatusLabel(status: string) {
  switch (status) {
    case "success":
      return "成功"
    case "failed":
      return "失败"
    case "running":
      return "运行中"
    case "timeout":
      return "超时"
    default:
      return status
  }
}

// ==================== 主页面 ====================

export function SkillsPage() {
  const { t } = useLocaleStore()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [form, setForm] = useState<SkillForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 执行对话框
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [executingSkill, setExecutingSkill] = useState<Skill | null>(null)
  const [executeParams, setExecuteParams] = useState<Record<string, string>>({})
  const [executing, setExecuting] = useState(false)
  const [executeResult, setExecuteResult] = useState<{
    success: boolean
    output?: string
    error?: string
  } | null>(null)

  // 历史对话框
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historySkill, setHistorySkill] = useState<Skill | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // ---------- 数据加载 ----------

  const loadSkills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/skills")
      setSkills(res.data?.items ?? res.data ?? [])
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadSkills()
    })
  }, [loadSkills])

  // ---------- 新增/编辑 ----------

  function openAddDialog() {
    setEditingSkill(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  function openEditDialog(skill: Skill) {
    setEditingSkill(skill)
    setForm({
      name: skill.name,
      display_name: skill.display_name,
      description: skill.description ?? "",
      category: skill.category,
      skill_type: skill.skill_type,
      required_connectors: skill.required_connectors?.join(", ") ?? "",
      parameters: skill.parameters ? JSON.stringify(skill.parameters, null, 2) : "{}",
      script_content: skill.script_content ?? "",
      execution_timeout: skill.execution_timeout ?? 60,
      trigger_mode: skill.trigger_mode,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let parsedParams: Record<string, unknown> = {}
      try {
        parsedParams = JSON.parse(form.parameters || "{}")
      } catch {
        parsedParams = {}
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        display_name: form.display_name,
        description: form.description,
        category: form.category,
        skill_type: form.skill_type,
        required_connectors: form.required_connectors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        parameters: parsedParams,
        script_content: form.script_content,
        execution_timeout: Number(form.execution_timeout),
        trigger_mode: form.trigger_mode,
      }

      if (editingSkill) {
        await api.put(`/skills/${editingSkill.id}`, payload)
      } else {
        await api.post("/skills", payload)
      }
      setDialogOpen(false)
      await loadSkills()
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
      await api.delete(`/skills/${id}`)
      await loadSkills()
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // ---------- 执行 ----------

  function openExecuteDialog(skill: Skill) {
    setExecutingSkill(skill)
    setExecuteResult(null)
    setExecuting(false)
    // 根据 parameters 生成表单
    const params: Record<string, string> = {}
    if (skill.parameters && typeof skill.parameters === "object") {
      for (const [key, value] of Object.entries(skill.parameters)) {
        if (typeof value === "object" && value !== null && "default" in (value as Record<string, unknown>)) {
          params[key] = String((value as Record<string, unknown>).default ?? "")
        } else {
          params[key] = ""
        }
      }
    }
    setExecuteParams(params)
    setExecuteDialogOpen(true)
  }

  async function handleExecute() {
    if (!executingSkill) return
    setExecuting(true)
    setExecuteResult(null)
    try {
      const res = await api.post(`/skills/${executingSkill.id}/execute`, {
        parameters: executeParams,
      })
      setExecuteResult({
        success: res.data?.success ?? true,
        output: typeof res.data?.output === "string" ? res.data.output : JSON.stringify(res.data?.output ?? res.data, null, 2),
        error: res.data?.error,
      })
      await loadSkills()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "执行失败"
      setExecuteResult({ success: false, error: message })
    } finally {
      setExecuting(false)
    }
  }

  // ---------- 执行历史 ----------

  async function openHistoryDialog(skill: Skill) {
    setHistorySkill(skill)
    setHistoryDialogOpen(true)
    setLoadingHistory(true)
    setExecutions([])
    try {
      const res = await api.get(`/skills/${skill.id}/executions`)
      setExecutions(res.data?.items ?? res.data ?? [])
    } catch {
      setExecutions([])
    } finally {
      setLoadingHistory(false)
    }
  }

  // ==================== 渲染 ====================

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <PageHeader
        icon={Workflow}
        title="Skill 管理"
        subtitle="管理 AI 技能定义和执行"
        actions={
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="size-4" />
            添加技能
          </Button>
        }
      />

      {/* 技能列表 */}
      {loading ? (
        <div className={cn(pageCardClass, "flex items-center justify-center py-20")}>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : skills.length === 0 ? (
        <div className={cn(pageCardClass, "flex flex-col items-center justify-center px-6 py-20 text-center")}>
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Workflow className="size-6" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-foreground">尚未定义 AI 技能</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            添加技能后，可将调查、处置和通知动作编排为可复用的自动化能力。
          </p>
          <Button size="sm" className="mt-5 gap-1.5" onClick={openAddDialog}>
            <Plus className="size-3.5" />
            添加第一个技能
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id} className={cn(pageCardClass, "relative")}>
              <CardContent className="space-y-4 p-5">
                {/* 头部信息 */}
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Workflow className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {skill.display_name || skill.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {skill.name}
                    </p>
                  </div>
                </div>

                {/* 描述 */}
                {skill.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {skill.description}
                  </p>
                )}

                {/* 详细信息 */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">分类</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getCategoryBadge(skill.category))}
                    >
                      {getCategoryLabel(skill.category, t)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">类型</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.skill_type === "atomic" ? "原子" : "组合"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">触发模式</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getTriggerModeBadge(skill.trigger_mode))}
                    >
                      {getTriggerModeLabel(skill.trigger_mode)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">状态</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        skill.is_active
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                          : "border-border bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {skill.is_active ? (
                        <CheckCircle2 className="mr-1 size-3" />
                      ) : (
                        <XCircle className="mr-1 size-3" />
                      )}
                      {skill.is_active ? "已启用" : "已禁用"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">执行次数</span>
                    <span className="flex items-center gap-1 text-xs text-foreground">
                      <Activity className="size-3" />
                      {skill.execution_count ?? 0}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(skill)}
                  >
                    <Pencil className="mr-1 size-3.5" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExecuteDialog(skill)}
                    disabled={!skill.is_active}
                  >
                    <Play className="mr-1 size-3.5" />
                    执行
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openHistoryDialog(skill)}
                  >
                    <History className="mr-1 size-3.5" />
                    历史
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(skill.id)}
                    disabled={deletingId === skill.id}
                  >
                    {deletingId === skill.id ? (
                      <Loader2 className="mr-1 size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 size-3.5" />
                    )}
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "编辑技能" : "添加技能"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingSkill
                ? "修改技能定义和参数配置。"
                : "定义 AI 技能的执行逻辑和参数。"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 标识名 */}
            <div className="space-y-2">
              <Label htmlFor="skill-name">标识名</Label>
              <Input
                id="skill-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="例如: ioc-enrichment"
                autoComplete="off"
                disabled={!!editingSkill}
              />
              <p className="text-xs text-muted-foreground">唯一标识符，创建后不可修改</p>
            </div>

            {/* 显示名称 */}
            <div className="space-y-2">
              <Label htmlFor="skill-display-name">显示名称</Label>
              <Input
                id="skill-display-name"
                value={form.display_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_name: e.target.value }))
                }
                className={inputClass}
                placeholder="例如: IOC 富化查询"
                autoComplete="off"
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="skill-description">描述</Label>
              <Textarea
                id="skill-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className={inputClass}
                placeholder="技能功能描述"
                autoComplete="off"
              />
            </div>

            {/* 分类 + 技能类型 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      category: value as SkillForm["category"],
                    }))
                  }
                >
                  <SelectTrigger className={cn("w-full", inputClass)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t("settings." + opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>技能类型</Label>
                <Select
                  value={form.skill_type}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      skill_type: value as SkillForm["skill_type"],
                    }))
                  }
                >
                  <SelectTrigger className={cn("w-full", inputClass)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 依赖连接器 */}
            <div className="space-y-2">
              <Label htmlFor="skill-connectors">依赖连接器</Label>
              <Input
                id="skill-connectors"
                value={form.required_connectors}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, required_connectors: e.target.value }))
                }
                className={inputClass}
                placeholder="逗号分隔，例如: virustotal, misp"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">逗号分隔的连接器标识名列表</p>
            </div>

            {/* 参数 JSON */}
            <div className="space-y-2">
              <Label htmlFor="skill-parameters">参数定义 (JSON)</Label>
              <Textarea
                id="skill-parameters"
                value={form.parameters}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, parameters: e.target.value }))
                }
                className={cn(inputClass, "font-mono text-xs min-h-24")}
                placeholder='{"ioc_value": {"type": "string", "default": ""}}'
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">JSON 格式的参数定义</p>
            </div>

            {/* 脚本内容 */}
            <div className="space-y-2">
              <Label htmlFor="skill-script">脚本内容</Label>
              <Textarea
                id="skill-script"
                value={form.script_content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, script_content: e.target.value }))
                }
                className={cn(inputClass, "font-mono text-xs min-h-32")}
                placeholder="技能执行的脚本代码"
                autoComplete="off"
              />
            </div>

            {/* 超时 + 触发模式 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="skill-timeout">超时 (秒)</Label>
                <Input
                  id="skill-timeout"
                  type="number"
                  value={form.execution_timeout}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      execution_timeout: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                  min={1}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>触发模式</Label>
                <Select
                  value={form.trigger_mode}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      trigger_mode: value as SkillForm["trigger_mode"],
                    }))
                  }
                >
                  <SelectTrigger className={cn("w-full", inputClass)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.display_name}>
                {saving ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : null}
                {editingSkill ? "保存修改" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 执行对话框 */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>执行技能</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {executingSkill?.display_name || executingSkill?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 参数输入 */}
            {Object.keys(executeParams).length > 0 ? (
              <div className="space-y-3">
                <Label>参数</Label>
                {Object.entries(executeParams).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`exec-${key}`} className="text-xs font-normal">
                      {key}
                    </Label>
                    <Input
                      id={`exec-${key}`}
                      value={value}
                      onChange={(e) =>
                        setExecuteParams((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className={inputClass}
                      placeholder={`输入 ${key}`}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">该技能无需参数</p>
            )}

            {/* 执行结果 */}
            {executeResult && (
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs",
                  executeResult.success
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700"
                    : "border-red-500/20 bg-red-500/5 text-red-700"
                )}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {executeResult.success ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  {executeResult.success ? "执行成功" : "执行失败"}
                </div>
                {executeResult.output && (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs">
                    {executeResult.output}
                  </pre>
                )}
                {!executeResult.success && executeResult.error && (
                  <div className="mt-1">{executeResult.error}</div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
                关闭
              </Button>
              <Button onClick={handleExecute} disabled={executing}>
                {executing ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Play className="mr-1 size-4" />
                )}
                执行
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 执行历史对话框 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>执行历史</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {historySkill?.display_name || historySkill?.name}
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Clock className="size-8 text-muted-foreground/70" />
              <p className="mt-2 text-sm text-muted-foreground">暂无执行记录</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {executions.map((exec) => (
                  <div
                    key={exec.execution_id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn("shrink-0", getExecutionStatusBadge(exec.status))}
                      >
                        {getExecutionStatusLabel(exec.status)}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-foreground truncate">
                          {exec.execution_id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exec.trigger_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-foreground">
                        {formatDateTime(exec.started_at)}
                      </p>
                      {exec.duration_ms != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exec.duration_ms}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
