"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Workflow,
  Search,
  Plus,
  Play,
  Edit3,
  Trash2,
  Zap,
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Activity,
  ToggleLeft,
  ToggleRight,
  Filter,
  Save,
  X,
  GripVertical,
  Bell,
  Shield,
  PenTool,
} from "lucide-react"
import type { Node as RfNode, Edge as RfEdge } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { api, formatDateTime } from "@/lib/api"
import { PlaybookEditor, convertPlaybookToFlow } from "@/components/playbook-editor"
import { PageHeader } from "@/components/layout/page-header"
import { inputClass, pageCardClass, softCardClass } from "@/lib/admin-ui"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { useLocaleStore } from "@/store/locale-store"

type PlaybookStatus = "enabled" | "disabled"
type NodeType = "trigger" | "condition" | "action" | "approval"
type ExecutionStatus = "success" | "failed" | "running"

interface FlowNode {
  id: string
  type: NodeType
  label: string
  detail: string
}

interface FlowEdge {
  from: string
  to: string
  label?: string
}

interface Playbook {
  id: string
  name: string
  description: string
  trigger: string
  steps: number
  executions: number
  lastExecution: string
  status: PlaybookStatus
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface ExecutionRecord {
  id: string
  playbookName: string
  triggerTime: string
  status: ExecutionStatus
  duration: string
}

interface ApiPlaybook {
  id: number
  name: string
  description: string | null
  trigger: string | null
  steps: number
  executions: number
  last_execution: string | null
  status: string
  nodes: FlowNode[] | null
  edges: FlowEdge[] | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

function mapApiPlaybook(raw: ApiPlaybook): Playbook {
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description || "",
    trigger: raw.trigger || "",
    steps: raw.steps,
    executions: raw.executions,
    lastExecution: formatDateTime(raw.last_execution),
    status: (raw.status as PlaybookStatus) || "disabled",
    nodes: raw.nodes || [],
    edges: raw.edges || [],
  }
}

const executionHistory: ExecutionRecord[] = [
  { id: "EX-20260510-001", playbookName: "账号失陷自动处置", triggerTime: "2026-05-10 09:32:15", status: "success", duration: "12.3s" },
  { id: "EX-20260510-002", playbookName: "钓鱼邮件自动处置", triggerTime: "2026-05-10 10:05:42", status: "success", duration: "8.7s" },
  { id: "EX-20260510-003", playbookName: "C2通信自动阻断", triggerTime: "2026-05-10 08:15:33", status: "failed", duration: "3.2s" },
  { id: "EX-20260510-004", playbookName: "暴力破解自动防御", triggerTime: "2026-05-10 07:48:11", status: "success", duration: "5.1s" },
  { id: "EX-20260510-005", playbookName: "数据外泄自动遏制", triggerTime: "2026-05-09 22:10:05", status: "running", duration: "—" },
  { id: "EX-20260509-006", playbookName: "WebShell自动清除", triggerTime: "2026-05-09 18:33:28", status: "success", duration: "15.6s" },
  { id: "EX-20260509-007", playbookName: "横向移动自动阻断", triggerTime: "2026-05-08 14:22:17", status: "success", duration: "9.8s" },
  { id: "EX-20260509-008", playbookName: "VPN异常登录处置", triggerTime: "2026-05-09 20:55:44", status: "failed", duration: "2.1s" },
  { id: "EX-20260508-009", playbookName: "内部威胁监控处置", triggerTime: "2026-05-08 09:12:36", status: "success", duration: "6.4s" },
  { id: "EX-20260507-010", playbookName: "权限提升自动遏制", triggerTime: "2026-05-06 11:30:52", status: "success", duration: "7.9s" },
]

const NODE_TYPE_CONFIG: Record<NodeType, { color: string; bgColor: string; borderColor: string; icon: typeof Zap; label: string }> = {
  trigger: { color: "#ef4444", bgColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", icon: Zap, label: "触发器" },
  condition: { color: "#eab308", bgColor: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.25)", icon: GitBranch, label: "条件判断" },
  action: { color: "#06b6d4", bgColor: "rgba(6,182,212,0.08)", borderColor: "rgba(6,182,212,0.25)", icon: Play, label: "执行动作" },
  approval: { color: "#a855f7", bgColor: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.25)", icon: UserCheck, label: "人工审批" },
}

interface TemplateItem {
  id: string
  label: string
  detail: string
  icon: string
}

interface TemplateCategory {
  type: string
  label: string
  icon: string
  category: string
  description: string
  templates: TemplateItem[]
}

const TEMPLATE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  trigger: { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.3)", text: "#22d3ee" },
  condition: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
  action: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#ef4444" },
  approval: { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.3)", text: "#a855f7" },
  notify: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", text: "#3b82f6" },
  delay: { bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.3)", text: "#64748b" },
}

const TEMPLATE_ICONS: Record<string, typeof Zap> = {
  trigger: Zap,
  condition: GitBranch,
  action: Shield,
  approval: UserCheck,
  notify: Bell,
  delay: Clock,
}

const EXECUTION_STATUS_CONFIG: Record<ExecutionStatus, { color: string; icon: typeof CheckCircle2; label: string }> = {
  success: { color: "#22c55e", icon: CheckCircle2, label: "成功" },
  failed: { color: "#ff4d4f", icon: XCircle, label: "失败" },
  running: { color: "#22d3ee", icon: Loader2, label: "执行中" },
}

export default function WorkflowsPage() {
  const { t } = useLocaleStore()
  const router = useRouter()
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterType, setFilterType] = useState<"all" | "enabled" | "disabled">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", description: "", trigger: "" })
  const [viewMode, setViewMode] = useState<"list" | "editor">("list")
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null)
  const [flowNodes, setFlowNodes] = useState<RfNode[]>([])
  const [flowEdges, setFlowEdges] = useState<RfEdge[]>([])
  const [templates, setTemplates] = useState<TemplateCategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["trigger"]))
  const [saving, setSaving] = useState(false)
  const nodeCounterRef = useRef(0)

  const fetchPlaybooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiPlaybook[]>("/playbooks")
      setPlaybooks(res.data.map(mapApiPlaybook))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "加载剧本列表失败"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<ApiPlaybook[]>("/playbooks")
        if (!cancelled) setPlaybooks(res.data.map(mapApiPlaybook))
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "加载剧本列表失败"
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadTemplates = async () => {
      try {
        const res = await api.get<TemplateCategory[]>("/playbook-editor/templates")
        if (!cancelled) setTemplates(res.data)
      } catch {}
    }
    loadTemplates()
    return () => { cancelled = true }
  }, [])

  const filteredPlaybooks = playbooks.filter((p) => {
    if (filterType === "enabled" && p.status !== "enabled") return false
    if (filterType === "disabled" && p.status !== "disabled") return false
    if (searchQuery && !p.name.includes(searchQuery) && !p.description.includes(searchQuery)) return false
    return true
  })

  const enabledCount = playbooks.filter((p) => p.status === "enabled").length
  const disabledCount = playbooks.filter((p) => p.status === "disabled").length

  const togglePlaybookStatus = async (id: string) => {
    try {
      await api.post(`/playbooks/${id}/toggle`)
      await fetchPlaybooks()
    } catch {
      setError("切换剧本状态失败")
    }
  }

  const deletePlaybook = async (id: string) => {
    try {
      await api.delete(`/playbooks/${id}`)
      if (selectedPlaybook?.id === id) setSelectedPlaybook(null)
      await fetchPlaybooks()
    } catch {
      setError("删除剧本失败")
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) return
    setSubmitting(true)
    try {
      await api.post("/playbooks", {
        name: createForm.name,
        description: createForm.description,
        trigger: createForm.trigger,
        steps: 0,
        executions: 0,
        status: "enabled",
        created_by: "current_user",
      })
      await fetchPlaybooks()
      setCreateDialogOpen(false)
      setCreateForm({ name: "", description: "", trigger: "" })
    } catch {
      setError("创建剧本失败")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditor = (playbook: Playbook) => {
    setEditingPlaybook(playbook)
    const { nodes, edges } = convertPlaybookToFlow(playbook.nodes, playbook.edges)
    setFlowNodes(nodes)
    setFlowEdges(edges)
    nodeCounterRef.current = playbook.nodes.length
    setViewMode("editor")
  }

  const closeEditor = () => {
    setViewMode("list")
    setEditingPlaybook(null)
    setFlowNodes([])
    setFlowEdges([])
  }

  const handleEditorChange = useCallback((nodes: RfNode[], edges: RfEdge[]) => {
    setFlowNodes(nodes)
    setFlowEdges(edges)
  }, [])

  const savePlaybook = async () => {
    if (!editingPlaybook) return
    setSaving(true)
    try {
      const pbNodes: FlowNode[] = flowNodes.map((n) => ({
        id: n.id,
        type: ((n.data as Record<string, unknown>)?.icon as string || "action") as NodeType,
        label: (n.data as Record<string, unknown>)?.label as string || "",
        detail: (n.data as Record<string, unknown>)?.detail as string || "",
      }))
      const pbEdges: FlowEdge[] = flowEdges.map((e) => ({
        from: e.source,
        to: e.target,
        ...(e.label ? { label: String(e.label) } : {}),
      }))
      await api.put(`/playbooks/${editingPlaybook.id}`, {
        nodes: pbNodes,
        edges: pbEdges,
        steps: pbNodes.length,
      })
      await fetchPlaybooks()
      setEditingPlaybook((prev) => prev ? { ...prev, nodes: pbNodes, edges: pbEdges, steps: pbNodes.length } : null)
      setError(null)
    } catch {
      setError("保存剧本失败")
    } finally {
      setSaving(false)
    }
  }

  const addNodeFromTemplate = (template: TemplateItem) => {
    nodeCounterRef.current += 1
    const newNode: RfNode = {
      id: `${template.id}-${nodeCounterRef.current}`,
      type: "playbook",
      position: { x: 250, y: nodeCounterRef.current * 120 },
      data: { label: template.label, detail: template.detail, icon: template.icon },
    }
    setFlowNodes((prev) => [...prev, newNode])
  }

  const toggleCategory = (type: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const filterCards = [
    { key: "all" as const, label: "全部剧本", count: playbooks.length, color: "#06b6d4" },
    { key: "enabled" as const, label: "已启用", count: enabledCount, color: "#22c55e" },
    { key: "disabled" as const, label: "已停用", count: disabledCount, color: "#64748b" },
  ]

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        icon={Workflow}
        title="自动化编排"
        subtitle="安全响应剧本与工作流自动化引擎"
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button className="ml-auto text-xs underline" onClick={() => setError(null)}>
            关闭
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {filterCards.map((card) => (
          <button
            key={card.key}
            aria-pressed={filterType === card.key}
            onClick={() => setFilterType(card.key)}
            className={cn(
              `${softCardClass} p-4 text-left transition-colors cursor-pointer`,
              filterType === card.key && "ring-1"
            )}
            style={
              filterType === card.key
                  ? { borderColor: `${card.color}40` }
                  : undefined
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: `${card.color}80` }}>{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.count}</p>
          </button>
        ))}
      </div>

      {viewMode === "editor" ? (
        <div className="flex gap-4" style={{ height: "calc(100vh - 340px)", minHeight: 500 }}>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/workflows"
                  onClick={closeEditor}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-400 hover:text-slate-600"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  返回列表
                </Link>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-cyan-600" />
                  <span className="text-sm font-semibold text-slate-900">{editingPlaybook?.name}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                    style={{
                      borderColor: editingPlaybook?.status === "enabled" ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)",
                      color: editingPlaybook?.status === "enabled" ? "#22c55e" : "#64748b",
                    }}
                  >
                    {editingPlaybook?.status === "enabled" ? "已启用" : "已停用"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {flowNodes.length} 个节点 · {flowEdges.length} 条连线
                </span>
                <Button
                  className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
                  disabled={saving}
                  onClick={savePlaybook}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <PlaybookEditor
                nodes={flowNodes}
                edges={flowEdges}
                onChange={handleEditorChange}
                readOnly={false}
              />
            </div>
          </div>

          <div className="w-64 shrink-0 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-semibold text-slate-700">节点模板</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">点击添加到画布</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {templates.map((category) => {
                  const colors = TEMPLATE_COLORS[category.type] || TEMPLATE_COLORS.action
                  const Icon = TEMPLATE_ICONS[category.type] || Shield
                  const isExpanded = expandedCategories.has(category.type)
                  return (
                    <div key={category.type} className="rounded-lg border border-slate-100 overflow-hidden">
                      <button
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-slate-50 transition-colors"
                        aria-expanded={isExpanded}
                        onClick={() => toggleCategory(category.type)}
                      >
                        <div
                          className="flex items-center justify-center w-5 h-5 rounded"
                          style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                        >
                          <Icon className="h-3 w-3" style={{ color: colors.text }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 flex-1">{category.category}</span>
                        <ChevronDown
                          className={cn("h-3 w-3 text-slate-400 transition-transform", isExpanded && "rotate-180")}
                        />
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-50 bg-slate-50/30">
                          {category.templates.map((template) => (
                            <button
                              key={template.id}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-white transition-colors group"
                              onClick={() => addNodeFromTemplate(template)}
                            >
                              <GripVertical className="h-3 w-3 text-slate-300 group-hover:text-slate-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-slate-600 truncate">{template.label}</p>
                                <p className="text-[10px] text-slate-400 truncate">{template.detail}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
      <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
              name="search"
              autoComplete="off"
              placeholder="搜索剧本名称或描述…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-9 ${inputClass}`}
          />
        </div>
        <Button
          className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          创建剧本
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
          onClick={() => router.push("/playbooks/editor")}
        >
          <PenTool className="h-4 w-4" />
          可视化编辑器
        </Button>
        {selectedPlaybook && viewMode === "list" && (
          <Button
            variant="outline"
            className="gap-1.5 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
            onClick={() => router.push(`/playbooks/editor?id=${selectedPlaybook.id}`)}
          >
            <Edit3 className="h-4 w-4" />
            可视化编辑
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : filteredPlaybooks.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-xs text-slate-400">
              暂无剧本数据
            </div>
          ) : (
            <>
              {filteredPlaybooks.map((playbook) => {
            const isEnabled = playbook.status === "enabled"
            return (
              <div
                key={playbook.id}
                className={cn(
                  `${softCardClass} p-4 transition-colors cursor-pointer`,
                  selectedPlaybook?.id === playbook.id && "border-cyan-200 shadow-sm shadow-slate-200/60"
                )}
                onClick={() => setSelectedPlaybook(playbook)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">{playbook.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0"
                        style={{
                          borderColor: isEnabled ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)",
                          color: isEnabled ? "#22c55e" : "#64748b",
                        }}
                      >
                        {isEnabled ? "已启用" : "已停用"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">{playbook.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#ef4444",
                        }}
                      >
                        <Zap className="h-2.5 w-2.5" />
                        {playbook.trigger}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {playbook.steps} 步骤
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {playbook.executions} 次执行
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {playbook.lastExecution}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      aria-pressed={isEnabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePlaybookStatus(playbook.id)
                      }}
                      className="transition-colors"
                    >
                      {isEnabled ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-300" />
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="编辑剧本"
                        className="text-slate-300 hover:text-cyan-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditor(playbook)
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="运行剧本"
                        className="text-slate-300 hover:text-cyan-600"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="删除剧本"
                        className="text-slate-300 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePlaybook(playbook.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
            </>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedPlaybook ? (
            <>
              <div className={`${pageCardClass} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-cyan-600" />
                    <h3 className="text-sm font-semibold text-slate-900">{selectedPlaybook.name}</h3>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        borderColor: selectedPlaybook.status === "enabled" ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)",
                        color: selectedPlaybook.status === "enabled" ? "#22c55e" : "#64748b",
                      }}
                    >
                      {selectedPlaybook.status === "enabled" ? "已启用" : "已停用"}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{selectedPlaybook.id}</span>
                </div>

                <div className="flex items-center gap-6 mb-5 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-red-400" />
                    触发: {selectedPlaybook.trigger}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3 text-cyan-400" />
                    {selectedPlaybook.steps} 个步骤
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-400" />
                    累计执行 {selectedPlaybook.executions} 次
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  {(["trigger", "condition", "action", "approval"] as NodeType[]).map((type) => {
                    const config = NODE_TYPE_CONFIG[type]
                    const count = selectedPlaybook.nodes.filter((n) => n.type === type).length
                    if (count === 0) return null
                    const Icon = config.icon
                    return (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
                        style={{
                          backgroundColor: config.bgColor,
                          border: `1px solid ${config.borderColor}`,
                          color: config.color,
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label} ×{count}
                      </span>
                    )
                  })}
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center gap-0 min-w-max">
                    {selectedPlaybook.nodes.map((node, idx) => {
                      const config = NODE_TYPE_CONFIG[node.type]
                      const Icon = config.icon
                      return (
                        <div key={node.id} className="flex items-center">
                          <div
                            className="rounded-lg px-4 py-3 min-w-[140px] text-center"
                            style={{
                              backgroundColor: config.bgColor,
                              border: `1.5px solid ${config.borderColor}`,
                              boxShadow: `0 0 12px ${config.color}10`,
                            }}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                              <span className="text-xs font-semibold" style={{ color: config.color }}>
                                {node.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">{node.detail}</p>
                          </div>
                          {idx < selectedPlaybook.nodes.length - 1 && (
                            <div className="flex items-center mx-1 relative">
                              <div className="w-8 h-px" style={{ backgroundColor: `${config.color}40` }} />
                              <ChevronRight className="h-3.5 w-3.5" style={{ color: `${config.color}60` }} />
                              {selectedPlaybook.edges[idx]?.label && (
                                <span
                                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap px-1 rounded"
                                  style={{ color: `${config.color}80`, backgroundColor: "rgba(2,10,26,0.9)" }}
                                >
                                  {selectedPlaybook.edges[idx].label}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className={`${pageCardClass} p-5`}>
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  执行历史
                </h3>
                <div className="space-y-2">
                  {executionHistory
                    .filter((r) => r.playbookName === selectedPlaybook.name)
                    .map((record) => {
                      const statusConfig = EXECUTION_STATUS_CONFIG[record.status]
                      const StatusIcon = statusConfig.icon
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 rounded-lg bg-slate-50/50 border border-slate-100 px-4 py-2.5"
                        >
                          <span className="text-xs font-mono text-slate-300 shrink-0">{record.id}</span>
                          <span className="text-xs text-slate-500 flex-1 truncate">{record.playbookName}</span>
                          <span className="text-xs font-mono text-slate-300 shrink-0">{record.triggerTime}</span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                            style={{
                              backgroundColor: `${statusConfig.color}15`,
                              border: `1px solid ${statusConfig.color}30`,
                              color: statusConfig.color,
                            }}
                          >
                            <StatusIcon className={cn("h-2.5 w-2.5", record.status === "running" && "animate-spin")} />
                            {statusConfig.label}
                          </span>
                          <span className="text-xs font-mono text-slate-300 shrink-0 w-14 text-right">{record.duration}</span>
                        </div>
                      )
                    })}
                  {executionHistory.filter((r) => r.playbookName === selectedPlaybook.name).length === 0 && (
                    <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                      暂无执行记录
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={`${softCardClass} p-12 flex flex-col items-center justify-center text-center min-h-[400px]`}>
              <Workflow className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-sm text-slate-400">选择左侧剧本查看可视化流程</p>
              <p className="text-xs text-slate-400 mt-1">点击任意剧本卡片以展示编排流程图</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${pageCardClass} p-5`}>
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-cyan-400" />
          最近执行记录
        </h3>
        <div className="space-y-2">
          {executionHistory.map((record) => {
            const statusConfig = EXECUTION_STATUS_CONFIG[record.status]
            const StatusIcon = statusConfig.icon
            return (
              <div
                key={record.id}
                className="flex items-center gap-4 rounded-lg bg-slate-50/50 border border-slate-100 px-4 py-2.5 hover:border-slate-200 transition-colors"
              >
                <span className="text-xs font-mono text-slate-300 shrink-0 w-36">{record.id}</span>
                <span className="text-xs text-slate-500 flex-1 truncate">{record.playbookName}</span>
                <span className="text-xs font-mono text-slate-300 shrink-0">{record.triggerTime}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                  style={{
                    backgroundColor: `${statusConfig.color}15`,
                    border: `1px solid ${statusConfig.color}30`,
                    color: statusConfig.color,
                  }}
                >
                  <StatusIcon className={cn("h-2.5 w-2.5", record.status === "running" && "animate-spin")} />
                  {statusConfig.label}
                </span>
                <span className="text-xs font-mono text-slate-300 shrink-0 w-14 text-right">{record.duration}</span>
              </div>
            )
          })}
        </div>
      </div>
      </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">创建新剧本</DialogTitle>
            <DialogDescription className="text-slate-400">
              配置安全响应剧本的触发条件、执行步骤和审批流程
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="playbook-name" className="text-xs text-slate-400 mb-1.5 block">剧本名称</label>
              <Input
                id="playbook-name"
                name="name"
                autoComplete="off"
                placeholder="输入剧本名称"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="border-slate-200 bg-white text-slate-700 placeholder:text-slate-300"
              />
            </div>
            <div>
              <label htmlFor="playbook-description" className="text-xs text-slate-400 mb-1.5 block">剧本描述</label>
              <Input
                id="playbook-description"
                name="description"
                autoComplete="off"
                placeholder="输入剧本描述"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                className="border-slate-200 bg-white text-slate-700 placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">触发条件</label>
              <Select
                value={createForm.trigger}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, trigger: v ?? "" }))}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white text-slate-600">
                  <SelectValue placeholder="选择触发条件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidence">AI研判置信度触发</SelectItem>
                  <SelectItem value="threshold">阈值触发</SelectItem>
                  <SelectItem value="signature">特征匹配触发</SelectItem>
                  <SelectItem value="behavior">行为检测触发</SelectItem>
                  <SelectItem value="schedule">定时调度触发</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700 gap-1.5"
                disabled={submitting}
                onClick={handleCreate}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                创建剧本
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600"
                onClick={() => setCreateDialogOpen(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
