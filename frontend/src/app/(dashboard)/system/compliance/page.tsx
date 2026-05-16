"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { inputClass, pageCardClass, softCardClass, subtleTextClass } from "@/lib/admin-ui"
import { CARD, RADIUS, TYPOGRAPHY } from "@/lib/design-system"
import { useLocaleStore } from "@/store/locale-store"

interface ControlItem {
  id: number
  framework_id: number
  control_id: string
  title: string
  description: string | null
  category: string
  severity: string
  mapping: string | null
}

interface FrameworkItem {
  id: number
  name: string
  code: string
  description: string | null
  version: string
  categories: string[]
  controls_count: number
  controls?: ControlItem[]
}

interface AssessmentItem {
  id: number
  framework_id: number
  name: string
  assessor: string | null
  status: string
  overall_score: number | null
  created_at: string | null
  updated_at: string | null
  results?: ResultItem[]
}

interface ResultItem {
  id: number
  assessment_id: number
  control_id: number
  status: string
  findings: string | null
  remediation: string | null
  control?: ControlItem
}

interface ReportData {
  framework: { name: string; code: string; version: string }
  overall_score: number
  grade: string
  category_breakdown: { category: string; score: number; total: number; compliant: number }[]
  summary: {
    compliant: number
    partially_compliant: number
    non_compliant: number
    not_assessed: number
    total: number
  }
}

const severityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "严重", className: "border-red-200 bg-red-50 text-red-700" },
  high: { label: "高", className: "border-orange-200 bg-orange-50 text-orange-700" },
  medium: { label: "中", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  low: { label: "低", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
}

const severityColorMap: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  high: "bg-amber-50 text-amber-700",
  medium: "bg-cyan-50 text-cyan-700",
  low: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  blue: "bg-blue-50 text-blue-700",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
}

const statusConfig: Record<string, { label: string; className: string; dotClass: string }> = {
  compliant: { label: "合规", className: "border-emerald-200 bg-emerald-50 text-emerald-700", dotClass: "bg-emerald-500" },
  partially_compliant: { label: "部分合规", className: "border-amber-200 bg-amber-50 text-amber-700", dotClass: "bg-amber-500" },
  non_compliant: { label: "不合规", className: "border-red-200 bg-red-50 text-red-700", dotClass: "bg-red-500" },
  not_assessed: { label: "未评估", className: "border-slate-200 bg-slate-50 text-slate-500", dotClass: "bg-slate-400" },
}

const assessmentStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "border-slate-200 bg-slate-50 text-slate-600" },
  in_progress: { label: "进行中", className: "border-blue-200 bg-blue-50 text-blue-700" },
  completed: { label: "已完成", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A", color: "text-emerald-600" }
  if (score >= 75) return { grade: "B", color: "text-blue-600" }
  if (score >= 60) return { grade: "C", color: "text-amber-600" }
  return { grade: "D", color: "text-red-600" }
}

function CircularProgress({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e4e4e7" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{Math.round(value)}</span>
        <span className="text-[11px] text-slate-500">分</span>
      </div>
    </div>
  )
}

function CreateAssessmentDialog({
  open,
  onOpenChange,
  frameworks,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworks: FrameworkItem[]
  onCreated: () => Promise<void>
}) {
  const [form, setForm] = useState({ framework_id: "", name: "", assessor: "" })
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!form.framework_id || !form.name) return
    setSaving(true)
    try {
      await api.post("/compliance/assessments", {
        framework_id: Number(form.framework_id),
        name: form.name,
        assessor: form.assessor || null,
      })
      onOpenChange(false)
      setForm({ framework_id: "", name: "", assessor: "" })
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建评估</DialogTitle>
          <DialogDescription className="text-slate-500">
            选择合规框架并创建新的合规评估任务。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessment-framework">合规框架</Label>
            <Select value={form.framework_id} onValueChange={(v) => v && setForm((p) => ({ ...p, framework_id: v }))}>
              <SelectTrigger className={`w-full ${inputClass}`}>
                <SelectValue placeholder="选择框架" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((fw) => (
                  <SelectItem key={fw.id} value={String(fw.id)}>
                    {fw.name} ({fw.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-name">评估名称</Label>
            <Input
              id="assessment-name"
              name="name"
              autoComplete="off"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="如: 2025年度等保评估"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-assessor">评估人</Label>
            <Input
              id="assessment-assessor"
              name="assessor"
              autoComplete="off"
              value={form.assessor}
              onChange={(e) => setForm((p) => ({ ...p, assessor: e.target.value }))}
              placeholder="评估人姓名（可选）"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.framework_id || !form.name}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {saving ? "创建中..." : "创建评估"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResultEditDialog({
  open,
  onOpenChange,
  result,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: ResultItem | null
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState({ status: "", findings: "", remediation: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (result && open) {
      setForm({
        status: result.status || "not_assessed",
        findings: result.findings || "",
        remediation: result.remediation || "",
      })
    }
  }, [result, open])

  async function handleSave() {
    if (!result || !form.status) return
    setSaving(true)
    try {
      await api.put(`/compliance/results/${result.id}`, {
        status: form.status,
        findings: form.findings || null,
        remediation: form.remediation || null,
      })
      onOpenChange(false)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更新评估结果</DialogTitle>
          <DialogDescription className="text-slate-500">
            {result?.control ? `${result.control.control_id} - ${result.control.title}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>合规状态</Label>
            <Select value={form.status} onValueChange={(v) => v && setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger className={`w-full ${inputClass}`}>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliant">合规</SelectItem>
                <SelectItem value="partially_compliant">部分合规</SelectItem>
                <SelectItem value="non_compliant">不合规</SelectItem>
                <SelectItem value="not_assessed">未评估</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-findings">发现</Label>
            <Input
              id="result-findings"
              name="findings"
              autoComplete="off"
              value={form.findings}
              onChange={(e) => setForm((p) => ({ ...p, findings: e.target.value }))}
              placeholder="评估发现（可选）"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-remediation">整改建议</Label>
            <Input
              id="result-remediation"
              name="remediation"
              autoComplete="off"
              value={form.remediation}
              onChange={(e) => setForm((p) => ({ ...p, remediation: e.target.value }))}
              placeholder="整改建议（可选）"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ViewMode = "frameworks" | "controls" | "assessment-results" | "report"

export default function CompliancePage() {
  useLocaleStore()

  const [frameworks, setFrameworks] = useState<FrameworkItem[]>([])
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState("")

  const [viewMode, setViewMode] = useState<ViewMode>("frameworks")
  const [selectedFramework, setSelectedFramework] = useState<FrameworkItem | null>(null)
  const [controls, setControls] = useState<ControlItem[]>([])
  const [controlsLoading, setControlsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentItem | null>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editResult, setEditResult] = useState<ResultItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const loadFrameworks = useCallback(async () => {
    try {
      const res = await api.get("/compliance/frameworks")
      setFrameworks(res.data)
    } catch {
      setFrameworks([])
    }
  }, [])

  const loadAssessments = useCallback(async () => {
    try {
      const res = await api.get("/compliance/assessments")
      setAssessments(res.data)
    } catch {
      setAssessments([])
    }
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([loadFrameworks(), loadAssessments()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadAll()
    })
  }, [])

  async function handleSeed() {
    setSeeding(true)
    setSeedMessage("")
    try {
      const res = await api.post("/compliance/seed")
      setSeedMessage(res.data?.message || "初始化完成")
      await loadAll()
    } catch {
      setSeedMessage("初始化失败，请检查后端服务")
    } finally {
      setSeeding(false)
      setTimeout(() => setSeedMessage(""), 3000)
    }
  }

  async function handleViewControls(fw: FrameworkItem) {
    setSelectedFramework(fw)
    setViewMode("controls")
    setControlsLoading(true)
    setCategoryFilter("")
    setSeverityFilter("")
    try {
      const res = await api.get(`/compliance/frameworks/${fw.id}/controls`)
      setControls(res.data)
    } catch {
      setControls([])
    } finally {
      setControlsLoading(false)
    }
  }

  async function handleStartAssessment(fw: FrameworkItem) {
    setCreateDialogOpen(true)
  }

  async function handleViewAssessment(assessment: AssessmentItem) {
    setSelectedAssessment(assessment)
    setViewMode("assessment-results")
    setAssessmentLoading(true)
    try {
      const res = await api.get(`/compliance/assessments/${assessment.id}`)
      setSelectedAssessment(res.data)
    } catch {
      setSelectedAssessment(assessment)
    } finally {
      setAssessmentLoading(false)
    }
  }

  async function handleAutoGenerate() {
    if (!selectedAssessment) return
    setGenerating(true)
    try {
      await api.post(`/compliance/assessments/${selectedAssessment.id}/generate`)
      const res = await api.get(`/compliance/assessments/${selectedAssessment.id}`)
      setSelectedAssessment(res.data)
    } catch {
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateReport() {
    if (!selectedFramework) return
    setReportLoading(true)
    try {
      const res = await api.get(`/compliance/frameworks/${selectedFramework.id}/report`)
      setReportData(res.data)
      setViewMode("report")
    } catch {
      setReportData(null)
    } finally {
      setReportLoading(false)
    }
  }

  async function handleRefreshAssessment() {
    if (!selectedAssessment) return
    setAssessmentLoading(true)
    try {
      const res = await api.get(`/compliance/assessments/${selectedAssessment.id}`)
      setSelectedAssessment(res.data)
    } catch {
    } finally {
      setAssessmentLoading(false)
    }
  }

  const filteredControls = useMemo(() => {
    let filtered = controls
    if (categoryFilter) {
      filtered = filtered.filter((c) => c.category === categoryFilter)
    }
    if (severityFilter) {
      filtered = filtered.filter((c) => c.severity === severityFilter)
    }
    if (searchQuery && viewMode === "controls") {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.control_id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
      )
    }
    return filtered
  }, [controls, categoryFilter, severityFilter, searchQuery, viewMode])

  const categories = useMemo(() => {
    const set = new Set(controls.map((c) => c.category))
    return Array.from(set)
  }, [controls])

  const stats = useMemo(
    () => ({
      frameworks: frameworks.length,
      totalControls: frameworks.reduce((sum, fw) => sum + (fw.controls_count || 0), 0),
      assessments: assessments.length,
      completed: assessments.filter((a) => a.status === "completed").length,
    }),
    [frameworks, assessments]
  )

  const assessmentStats = useMemo(() => {
    if (!selectedAssessment?.results) return null
    const results = selectedAssessment.results
    return {
      compliant: results.filter((r) => r.status === "compliant").length,
      partially: results.filter((r) => r.status === "partially_compliant").length,
      nonCompliant: results.filter((r) => r.status === "non_compliant").length,
      notAssessed: results.filter((r) => r.status === "not_assessed" || !r.status).length,
      total: results.length,
    }
  }, [selectedAssessment])

  function goBack() {
    if (viewMode === "controls" || viewMode === "report") {
      setViewMode("frameworks")
      setSelectedFramework(null)
    } else if (viewMode === "assessment-results") {
      setViewMode("frameworks")
      setSelectedAssessment(null)
      setSelectedFramework(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShieldCheck}
        title="合规管理"
        subtitle={
          viewMode === "controls" && selectedFramework ? (
            <span className="flex items-center gap-1">
              <Link href="/system/compliance" onClick={goBack} className="hover:text-cyan-600 transition-colors">合规框架</Link>
              <ChevronRight className="size-3.5" />
              {selectedFramework.name}
            </span>
          ) : viewMode === "assessment-results" && selectedAssessment ? (
            <span className="flex items-center gap-1">
              <Link href="/system/compliance" onClick={goBack} className="hover:text-cyan-600 transition-colors">合规框架</Link>
              <ChevronRight className="size-3.5" />
              {selectedAssessment.name}
            </span>
          ) : viewMode === "report" ? (
            <span className="flex items-center gap-1">
              <Link href="/system/compliance" onClick={goBack} className="hover:text-cyan-600 transition-colors">合规框架</Link>
              <ChevronRight className="size-3.5" />
              合规报告
            </span>
          ) : (
            <span>合规框架管理与评估报告</span>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {viewMode !== "frameworks" && (
              <Button variant="outline" onClick={goBack} className="gap-1.5">
                <ArrowLeft className="size-3.5" />
                返回
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSeed}
              disabled={seeding}
              className="gap-1.5"
            >
              {seeding ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              {seeding ? "初始化中..." : "初始化数据"}
            </Button>
          </div>
        }
      />

      {seedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {seedMessage}
        </div>
      )}

      {viewMode === "frameworks" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "合规框架", value: stats.frameworks, icon: ShieldCheck, color: "cyan" },
              { label: "控制项总数", value: stats.totalControls, icon: ClipboardCheck, color: "violet" },
              { label: "评估任务", value: stats.assessments, icon: FileCheck, color: "blue" },
              { label: "已完成评估", value: stats.completed, icon: CheckCircle2, color: "emerald" },
            ].map((item) => (
              <div key={item.label} className={`${softCardClass} p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${subtleTextClass}`}>{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                  <span className={`rounded-lg ${severityColorMap[item.color] ?? "bg-slate-50 text-slate-700"} p-2`}>
                    <item.icon className="size-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="frameworks">
            <TabsList variant="line">
              <TabsTrigger value="frameworks">
                <ShieldCheck className="size-3.5 mr-1" />
                合规框架
              </TabsTrigger>
              <TabsTrigger value="assessments">
                <FileCheck className="size-3.5 mr-1" />
                评估管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frameworks" className="mt-4 space-y-4">
              {loading ? (
                <div className="p-10 text-center text-slate-500">加载中...</div>
              ) : frameworks.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  暂无框架数据，请先点击「初始化数据」
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {frameworks.map((fw) => (
                    <Card key={fw.id} className={CARD.elevated}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex size-10 shrink-0 items-center justify-center ${RADIUS.lg} bg-cyan-50 text-cyan-700`}>
                            <Shield className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 truncate">{fw.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-cyan-700 font-mono">
                                {fw.code}
                              </code>
                              <span className={`text-[11px] ${subtleTextClass}`}>v{fw.version}</span>
                            </div>
                          </div>
                        </div>
                        <p className={`text-xs ${subtleTextClass} line-clamp-2`}>
                          {fw.description || "暂无描述"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs ${subtleTextClass}`}>控制项</span>
                            <span className="text-sm font-semibold text-slate-900">{fw.controls_count}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(fw.categories || []).slice(0, 3).map((cat) => (
                              <Badge
                                key={cat}
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-slate-600 text-[11px]"
                              >
                                {cat}
                              </Badge>
                            ))}
                            {(fw.categories || []).length > 3 && (
                              <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-slate-500 text-[11px]"
                              >
                                +{fw.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => handleViewControls(fw)}
                          >
                            <ClipboardCheck className="size-3.5" />
                            查看控制项
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
                            onClick={() => {
                              setSelectedFramework(fw)
                              handleStartAssessment(fw)
                            }}
                          >
                            <FileCheck className="size-3.5" />
                            开始评估
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assessments" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    aria-label="搜索评估名称"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索评估名称..."
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
                <Button
                  className="bg-cyan-600 text-white hover:bg-cyan-700"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-1 size-4" />
                  创建评估
                </Button>
              </div>

              {loading ? (
                <div className="p-10 text-center text-slate-500">加载中...</div>
              ) : assessments.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  暂无评估数据，请先创建评估任务
                </div>
              ) : (
                <div className="space-y-2">
                  {assessments
                    .filter((a) => {
                      if (!searchQuery) return true
                      return a.name.toLowerCase().includes(searchQuery.toLowerCase())
                    })
                    .map((assessment) => {
                      const fw = frameworks.find((f) => f.id === assessment.framework_id)
                      const statusCfg = assessmentStatusConfig[assessment.status] || assessmentStatusConfig.draft
                      return (
                        <Card key={assessment.id} className={pageCardClass}>
                          <CardContent className="p-0">
                            <button
                              type="button"
                              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
                              onClick={() => handleViewAssessment(assessment)}
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                <FileCheck className="size-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">{assessment.name}</span>
                                  <Badge variant="outline" className={statusCfg.className}>
                                    {statusCfg.label}
                                  </Badge>
                                </div>
                                <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                                  {fw ? `${fw.name} (${fw.code})` : `框架 #${assessment.framework_id}`}
                                  {assessment.assessor && ` · 评估人: ${assessment.assessor}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {assessment.overall_score !== null && (
                                  <div className="text-right">
                                    <p className={`text-xs ${subtleTextClass}`}>得分</p>
                                    <p className="text-sm font-semibold text-slate-900">{assessment.overall_score}</p>
                                  </div>
                                )}
                                <ChevronRight className="size-4 text-slate-400" />
                              </div>
                            </button>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {viewMode === "controls" && selectedFramework && (
        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 text-cyan-700`}>
                  <Shield className="size-5" />
                </div>
                <div>
                  <h2 className={String(TYPOGRAPHY.h2)}>{selectedFramework.name}</h2>
                  <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                    {selectedFramework.code} · v{selectedFramework.version} · {controls.length} 项控制
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className={`w-40 ${inputClass}`}>
                    <SelectValue placeholder="所有类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">所有类别</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={(v) => v && setSeverityFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className={`w-32 ${inputClass}`}>
                    <SelectValue placeholder="所有等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">所有等级</SelectItem>
                    {Object.entries(severityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    aria-label="搜索控制项"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索控制项..."
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {controlsLoading ? (
            <div className="p-10 text-center text-slate-500">加载中...</div>
          ) : filteredControls.length === 0 ? (
            <div className="p-10 text-center text-slate-500">没有匹配的控制项</div>
          ) : (
            <Card className={pageCardClass}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="合规控制项">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">控制项ID</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">标题</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">类别</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">严重等级</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">映射</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredControls.map((ctrl) => {
                        const sevCfg = severityConfig[ctrl.severity] || severityConfig.medium
                        return (
                          <tr key={ctrl.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                            <td className="px-5 py-2.5">
                              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-cyan-700 font-mono">
                                {ctrl.control_id}
                              </code>
                            </td>
                            <td className="px-5 py-2.5 text-slate-900">{ctrl.title}</td>
                            <td className="px-5 py-2.5">
                              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[11px]">
                                {ctrl.category}
                              </Badge>
                            </td>
                            <td className="px-5 py-2.5">
                              <Badge variant="outline" className={sevCfg.className}>
                                {sevCfg.label}
                              </Badge>
                            </td>
                            <td className={`px-5 py-2.5 text-xs ${subtleTextClass}`}>
                              {ctrl.mapping || "-"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {viewMode === "assessment-results" && selectedAssessment && (
        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-blue-50 text-blue-700`}>
                    <FileCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>{selectedAssessment.name}</h2>
                    <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                      {selectedAssessment.assessor ? `评估人: ${selectedAssessment.assessor}` : ""}
                      {selectedAssessment.status && ` · 状态: ${assessmentStatusConfig[selectedAssessment.status]?.label || selectedAssessment.status}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleAutoGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5" />
                    )}
                    {generating ? "评估中..." : "自动评估"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                  >
                    {reportLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    {reportLoading ? "生成中..." : "生成报告"}
                  </Button>
                </div>
              </div>

              {selectedAssessment.overall_score !== null && (
                <div className="flex items-center gap-8 mt-6">
                  <CircularProgress value={selectedAssessment.overall_score} />
                  {assessmentStats && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                      {[
                        { label: "合规", count: assessmentStats.compliant, color: "bg-emerald-500", textColor: "text-emerald-700" },
                        { label: "部分合规", count: assessmentStats.partially, color: "bg-amber-500", textColor: "text-amber-700" },
                        { label: "不合规", count: assessmentStats.nonCompliant, color: "bg-red-500", textColor: "text-red-700" },
                        { label: "未评估", count: assessmentStats.notAssessed, color: "bg-slate-400", textColor: "text-slate-600" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${item.color}`} />
                          <span className={`text-xs ${subtleTextClass}`}>{item.label}</span>
                          <span className={`text-sm font-semibold ${item.textColor}`}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {assessmentLoading ? (
            <div className="p-10 text-center text-slate-500">加载中...</div>
          ) : !selectedAssessment.results || selectedAssessment.results.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              暂无评估结果，请点击「自动评估」生成结果
            </div>
          ) : (
            <Card className={pageCardClass}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="评估结果">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">控制项ID</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">标题</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">状态</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">发现</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">整改建议</th>
                        <th className="px-5 py-2.5 text-left text-xs text-slate-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAssessment.results.map((result) => {
                        const statusCfg = statusConfig[result.status] || statusConfig.not_assessed
                        return (
                          <tr key={result.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                            <td className="px-5 py-2.5">
                              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-cyan-700 font-mono">
                                {result.control?.control_id || `#${result.control_id}`}
                              </code>
                            </td>
                            <td className="px-5 py-2.5 text-slate-900">
                              {result.control?.title || "-"}
                            </td>
                            <td className="px-5 py-2.5">
                              <Badge variant="outline" className={statusCfg.className}>
                                <span className={`size-1.5 rounded-full ${statusCfg.dotClass}`} />
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className={`px-5 py-2.5 text-xs max-w-[200px] truncate ${subtleTextClass}`}>
                              {result.findings || "-"}
                            </td>
                            <td className={`px-5 py-2.5 text-xs max-w-[200px] truncate ${subtleTextClass}`}>
                              {result.remediation || "-"}
                            </td>
                            <td className="px-5 py-2.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                                onClick={() => setEditResult(result)}
                              >
                                编辑
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {viewMode === "report" && reportData && (
        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 text-cyan-700`}>
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>{reportData.framework.name}</h2>
                    <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                      {reportData.framework.code} · v{reportData.framework.version}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                  合规报告
                </Badge>
              </div>

              <div className="flex items-center gap-8 mt-6">
                <div className="flex flex-col items-center">
                  <CircularProgress value={reportData.overall_score} size={140} strokeWidth={12} />
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-3xl font-bold ${getGrade(reportData.overall_score).color}`}>
                      {getGrade(reportData.overall_score).grade}
                    </span>
                    <span className={`text-xs ${subtleTextClass}`}>等级</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className={`text-xs font-medium text-slate-500 mb-2`}>控制项结果摘要</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "合规", count: reportData.summary.compliant, total: reportData.summary.total, color: "bg-emerald-500", bg: "bg-emerald-100", textColor: "text-emerald-700" },
                        { label: "部分合规", count: reportData.summary.partially_compliant, total: reportData.summary.total, color: "bg-amber-500", bg: "bg-amber-100", textColor: "text-amber-700" },
                        { label: "不合规", count: reportData.summary.non_compliant, total: reportData.summary.total, color: "bg-red-500", bg: "bg-red-100", textColor: "text-red-700" },
                        { label: "未评估", count: reportData.summary.not_assessed, total: reportData.summary.total, color: "bg-slate-400", bg: "bg-slate-100", textColor: "text-slate-600" },
                      ].map((item) => (
                        <div key={item.label} className={`${item.bg} rounded-lg px-3 py-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`size-2 rounded-full ${item.color}`} />
                              <span className={`text-xs ${item.textColor}`}>{item.label}</span>
                            </div>
                            <span className={`text-sm font-semibold ${item.textColor}`}>{item.count}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/60">
                            <div
                              className={`h-full rounded-full ${item.color} transition-colors duration-500`}
                              style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {reportData.category_breakdown && reportData.category_breakdown.length > 0 && (
            <Card className={pageCardClass}>
              <CardContent className="p-5">
                <h3 className={String(TYPOGRAPHY.h3) + " mb-4"}>类别分解</h3>
                <div className="space-y-3">
                  {reportData.category_breakdown.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-4">
                      <span className="text-sm text-slate-700 w-32 shrink-0 truncate">{cat.category}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-colors duration-500 ${
                            cat.score >= 75 ? "bg-emerald-500" : cat.score >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-slate-900">{Math.round(cat.score)}%</span>
                        <span className={`text-xs ${subtleTextClass}`}>
                          ({cat.compliant}/{cat.total})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreateAssessmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        frameworks={frameworks}
        onCreated={loadAssessments}
      />

      <ResultEditDialog
        open={!!editResult}
        onOpenChange={(open) => { if (!open) setEditResult(null) }}
        result={editResult}
        onSaved={handleRefreshAssessment}
      />
    </div>
  )
}
