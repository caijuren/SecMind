"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWebSocket } from "@/hooks/use-websocket"
import {
  Brain,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Play,
  ShieldAlert,
  UserLock,
  Ban,
  KeyRound,
  Globe,
  Eye,
  Bell,
  HardDrive,
  FileSearch,
  AlertTriangle,
  ShieldCheck,
  Monitor,
  FlaskConical,
  Sparkles,
  Cpu,
  Workflow,
  Zap,
  RotateCcw,
  Activity,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Search,
  Target,
  Link2,
  BarChart3,
  Lightbulb,
  Database,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { softCardClass } from "@/lib/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useLocaleStore } from "@/store/locale-store"
import { api, formatDateTime } from "@/lib/api"

type ActionStatus = "pending" | "executing" | "completed" | "failed" | "awaiting_approval"
type Priority = "critical" | "high" | "medium" | "low"
type ReasoningPhase = "event_discovery" | "evidence_correlation" | "pattern_matching" | "confidence_assessment" | "disposal_decision"

interface EvidenceRef {
  source: string
  timestamp: string
  detail: string
  direction: "supports" | "contradicts" | "neutral"
}

interface ReasoningStep {
  phase: ReasoningPhase
  title: string
  description: string
  evidence: EvidenceRef[]
  mitreRef?: string
  confidenceDelta?: number
  conclusion: string
}

interface ActionItem {
  id: string | number
  nameKey: string
  icon: typeof Clock
  target: string
  status: ActionStatus
  priority: Priority
  hypothesisId: string
  hypothesisLabel: string
  hypothesisConfidence: number
  requestedBy: string
  timestamp: string
  aiReasoning: string
  reasoningChain: ReasoningStep[]
  evidenceSummary: {
    supporting: number
    contradicting: number
    neutral: number
  }
  guardrails?: {
    approval: string
    impact: string
    rollback: string
    audit: string
  }
}

interface Hypothesis {
  id: string
  label: string
  confidence: number
  actions: { id: string | number; status: ActionStatus }[]
}

interface ApiResponseAction {
  id: number
  name: string
  action_type: string
  target: string
  status: string
  priority: string
  alert_id: number | null
  hypothesis_id: string | null
  hypothesis_label: string | null
  hypothesis_confidence: number | null
  requested_by: string
  ai_reasoning: string | null
  reasoning_chain: ReasoningStep[] | null
  evidence_summary: { supporting: number; contradicting: number; neutral: number } | null
  guardrails: { approval: string; impact: string; rollback: string; audit: string } | null
  result: string | null
  executed_at: string | null
  completed_at: string | null
  approved_by: string | null
  approved_at: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string | null
  updated_at: string | null
}

const ACTION_TYPE_ICON_MAP: Record<string, typeof Clock> = {
  freezeAccount: UserLock,
  isolateHost: ShieldAlert,
  blockIp: Ban,
  resetVpnCredentials: KeyRound,
  notifySecurityTeam: Bell,
  preserveForensicData: HardDrive,
  monitorUserActivity: Monitor,
  reviewAccessLogs: FileSearch,
}

const ACTION_TYPE_NAME_MAP: Record<string, string> = {
  freezeAccount: "execution.freezeAccount",
  isolateHost: "execution.isolateHost",
  blockIp: "execution.blockIp",
  resetVpnCredentials: "execution.resetVpnCredentials",
  notifySecurityTeam: "execution.notifySecurityTeam",
  preserveForensicData: "execution.preserveForensicData",
  monitorUserActivity: "execution.monitorUserActivity",
  reviewAccessLogs: "execution.reviewAccessLogs",
}

function mapApiAction(raw: ApiResponseAction): ActionItem {
  return {
    id: raw.id,
    nameKey: ACTION_TYPE_NAME_MAP[raw.action_type] || `execution.${raw.action_type}`,
    icon: ACTION_TYPE_ICON_MAP[raw.action_type] || Clock,
    target: raw.target,
    status: (raw.status as ActionStatus) || "pending",
    priority: (raw.priority as Priority) || "medium",
    hypothesisId: raw.hypothesis_id || "",
    hypothesisLabel: raw.hypothesis_label || "",
    hypothesisConfidence: raw.hypothesis_confidence || 0,
    requestedBy: raw.requested_by || "AI引擎",
    timestamp: raw.created_at || "",
    aiReasoning: raw.ai_reasoning || "",
    reasoningChain: raw.reasoning_chain || [],
    evidenceSummary: raw.evidence_summary || { supporting: 0, contradicting: 0, neutral: 0 },
    guardrails: raw.guardrails || undefined,
  }
}

function buildHypotheses(actionList: ActionItem[]): Hypothesis[] {
  const map = new Map<string, Hypothesis>()
  for (const a of actionList) {
    if (!a.hypothesisId) continue
    if (!map.has(a.hypothesisId)) {
      map.set(a.hypothesisId, {
        id: a.hypothesisId,
        label: a.hypothesisLabel,
        confidence: a.hypothesisConfidence,
        actions: [],
      })
    }
    map.get(a.hypothesisId)!.actions.push({ id: a.id, status: a.status })
  }
  return Array.from(map.values())
}


const strategies = [
  { name: "账号失陷自动处置", trigger: "置信度 ≥ 85%", actions: ["冻结账号", "重置密码", "隔离终端"], confidence: 85, description: "当AI研判账号失陷置信度≥85%时，自动触发冻结→重置→隔离处置链" },
  { name: "C2通信自动阻断", trigger: "置信度 ≥ 90%", actions: ["封禁IP", "隔离终端", "通知安全团队"], confidence: 90, description: "当AI确认C2通信置信度≥90%时，自动执行阻断→隔离→通知链" },
  { name: "暴力破解自动防御", trigger: "失败次数 ≥ 50", actions: ["封禁来源IP", "锁定账号", "启用MFA"], confidence: 95, description: "当AI检测到暴力破解失败次数≥50时，自动封禁→锁定→启用MFA" },
  { name: "数据外泄自动遏制", trigger: "外传数据 ≥ 100MB", actions: ["阻断连接", "保全取证数据", "通知DLP"], confidence: 80, description: "当AI检测到数据外传≥100MB时，自动阻断→取证→通知链" },
]

const executionRecords = [
  { id: "REC-001", action: "冻结账号(chengang)", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:15" },
  { id: "REC-002", action: "隔离设备(DEV-WS-004)", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:18" },
  { id: "REC-003", action: "封禁IP(45.33.32.156)", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:20" },
  { id: "REC-004", action: "重置密码(wangfang)", hypothesis: "H-B 内部威胁", confidence: 54, status: "awaiting" as const, executor: "待审批", time: "2026-05-09 10:35:00" },
  { id: "REC-005", action: "通知安全团队", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:22" },
  { id: "REC-006", action: "保全取证数据", hypothesis: "H-A 账号失陷", confidence: 92, status: "running" as const, executor: "AI引擎", time: "2026-05-09 10:32:25" },
  { id: "REC-007", action: "封禁IP(103.45.67.89)", hypothesis: "H-A 账号失陷", confidence: 92, status: "failed" as const, executor: "AI引擎", time: "2026-05-09 10:33:01" },
  { id: "REC-008", action: "监控用户活动(linfeng)", hypothesis: "H-B 内部威胁", confidence: 54, status: "running" as const, executor: "AI引擎", time: "2026-05-09 10:36:00" },
]

const rollbackRecords = [
  { id: "RB-001", action: "解冻账号(chengang)", reason: "人工复核确认误报", operator: "赵敏", time: "2026-05-09 11:15:00", originalAction: "REC-001" },
  { id: "RB-002", action: "解除IP封禁(10.0.1.100)", reason: "IP为内部代理服务器", operator: "卫东", time: "2026-05-09 09:45:00", originalAction: "REC-003" },
]

function AIBrainIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Brain className="h-4 w-4 text-cyan-600" />
      <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
    </div>
  )
}

const phaseConfig: Record<ReasoningPhase, { icon: typeof Search; labelKey: string; color: string; bgColor: string }> = {
  event_discovery: { icon: Search, labelKey: "execution.phaseEventDiscovery", color: "#22d3ee", bgColor: "rgba(34,211,238,0.08)" },
  evidence_correlation: { icon: Link2, labelKey: "execution.phaseEvidenceCorrelation", color: "#a78bfa", bgColor: "rgba(167,139,250,0.08)" },
  pattern_matching: { icon: Target, labelKey: "execution.phasePatternMatching", color: "#f97316", bgColor: "rgba(249,115,22,0.08)" },
  confidence_assessment: { icon: BarChart3, labelKey: "execution.phaseConfidenceAssessment", color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
  disposal_decision: { icon: Lightbulb, labelKey: "execution.phaseDisposalDecision", color: "#facc15", bgColor: "rgba(250,204,21,0.08)" },
}

const directionConfig: Record<string, { color: string; labelKey: string }> = {
  supports: { color: "#22c55e", labelKey: "execution.directionSupports" },
  contradicts: { color: "#ff4d4f", labelKey: "execution.directionContradicts" },
  neutral: { color: "#64748b", labelKey: "execution.directionNeutral" },
}

function ReasoningChainPanel({ chain, evidenceSummary, t }: { chain: ReasoningStep[]; evidenceSummary: { supporting: number; contradicting: number; neutral: number }; t: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false)
  const total = evidenceSummary.supporting + evidenceSummary.contradicting + evidenceSummary.neutral

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <div className="flex items-center gap-1.5 text-xs text-cyan-700 group-hover:text-cyan-800 transition-colors">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <Sparkles className="h-3 w-3" />
          <span className="font-medium">{t("execution.viewReasoningChain")}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            +{evidenceSummary.supporting}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-600 border border-red-200">
            -{evidenceSummary.contradicting}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            ~{evidenceSummary.neutral}
          </span>
          <span className="text-[10px] text-slate-400 ml-0.5">{t("execution.evidenceCount")}: {total}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 relative">
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-cyan-200" />
          <div className="space-y-3">
            {chain.map((step, idx) => {
              const phase = phaseConfig[step.phase]
              const PhaseIcon = phase.icon
              return (
                <div key={idx} className="relative pl-9">
                  <div
                    className="absolute left-0 top-1 flex h-[26px] w-[26px] items-center justify-center rounded-full shrink-0 border"
                    style={{
                      backgroundColor: `${phase.color}15`,
                      borderColor: `${phase.color}40`,
                    }}
                  >
                      <PhaseIcon className="h-3 w-3" style={{ color: phase.color }} />
                  </div>

                  <div
                    className="rounded-lg border p-3"
                    style={{
                      borderColor: `${phase.color}15`,
                      backgroundColor: phase.bgColor,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: phase.color }}>
                        {t(phase.labelKey)}
                      </span>
                      <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                      {step.mitreRef && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {step.mitreRef}
                        </span>
                      )}
                      {step.confidenceDelta !== undefined && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <BarChart3 className="h-2.5 w-2.5" />
                          {step.confidenceDelta}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-2 leading-relaxed">{step.description}</p>

                    {step.evidence.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {step.evidence.map((ev, evIdx) => {
                          const dir = directionConfig[ev.direction]
                          return (
                            <div
                              key={evIdx}
                              className="flex items-start gap-2 rounded-md px-2 py-1.5 bg-slate-50 border border-slate-200"
                            >
                              <div
                                className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: dir.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-medium" style={{ color: dir.color }}>
                                    {t(dir.labelKey)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                    <Database className="h-2.5 w-2.5" />
                                    {ev.source}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{ev.detail}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-100">
                      <Sparkles className="h-3 w-3 text-cyan-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-700 leading-relaxed">
                        <span className="font-medium text-cyan-800">{t("execution.stepConclusion")}:</span> {step.conclusion}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function HypothesisBadge({ id, label, confidence, t }: { id: string; label: string; confidence: number; t: (key: string) => string }) {
  const color = confidence >= 80 ? "#22c55e" : confidence >= 50 ? "#faad14" : "#64748b"
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <FlaskConical className="h-3 w-3" />
      <span className="opacity-70">→</span>
      <span>{t("execution.hyp")} {id}: {label}</span>
      <span className="font-semibold">({confidence}%)</span>
    </span>
  )
}

function ActionGuardrails({ action }: { action: ActionItem }) {
  const guardrails = action.guardrails ?? {
    approval: action.status === "awaiting_approval" ? "需要人工审批后执行" : "遵循当前处置策略阈值",
    impact: `目标范围：${action.target}`,
    rollback: "保留回滚入口与原始状态快照",
    audit: "写入执行日志与关联调查记录",
  }
  const items = [
    { label: "审批", value: guardrails.approval, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "影响", value: guardrails.impact, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "回滚", value: guardrails.rollback, icon: RotateCcw, color: "text-cyan-700", bg: "bg-cyan-50" },
    { label: "审计", value: guardrails.audit, icon: FileSearch, color: "text-slate-600", bg: "bg-slate-50" },
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", item.bg)}>
            <item.icon className={cn("h-3.5 w-3.5", item.color)} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-500">{item.label}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-slate-700">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function getHypothesisProgress(h: Hypothesis) {
  const total = h.actions.length
  if (total === 0) return { completed: 0, total: 0, percent: 0, executing: 0, pending: 0, awaiting: 0 }
  const completed = h.actions.filter((a) => a.status === "completed").length
  const executing = h.actions.filter((a) => a.status === "executing").length
  const pending = h.actions.filter((a) => a.status === "pending").length
  const awaiting = h.actions.filter((a) => a.status === "awaiting_approval").length
  return { completed, total, percent: Math.round((completed / total) * 100), executing, pending, awaiting }
}

function AutoDisposalTab({ t, wsMessage }: { t: (key: string) => string; wsMessage: any }) {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | number | null>(null)
  const [filterHypothesis, setFilterHypothesis] = useState<string>("all")

  const fetchActions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/response/actions")
      const data = res.data
      const mapped = (data.items ?? data).map(mapApiAction)
      setActions(mapped)
      setHypotheses(buildHypotheses(mapped))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch actions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get("/response/actions")
        if (cancelled) return
        const data = res.data
        const mapped = (data.items ?? data).map(mapApiAction)
        setActions(mapped)
        setHypotheses(buildHypotheses(mapped))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to fetch actions")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!wsMessage) return
    if (wsMessage.type === "action_update" || wsMessage.type === "action_status") {
      try {
        const updatedAction = mapApiAction(wsMessage.data)
        setActions(prev => {
          const next = prev.map(a => a.id === updatedAction.id ? updatedAction : a)
          setHypotheses(buildHypotheses(next))
          return next
        })
      } catch {}
    }
    if (wsMessage.type === "new_action") {
      try {
        const newAction = mapApiAction(wsMessage.data)
        setActions(prev => {
          const next = [newAction, ...prev]
          setHypotheses(buildHypotheses(next))
          return next
        })
      } catch {}
    }
  }, [wsMessage])

  const handleExecute = useCallback(async (actionId: string | number) => {
    setActionLoading(actionId)
    try {
      await api.post(`/response/actions/${actionId}/execute`)
      await fetchActions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action")
    } finally {
      setActionLoading(null)
    }
  }, [fetchActions])

  const handleApprove = useCallback(async (actionId: string | number) => {
    setActionLoading(actionId)
    try {
      await api.post(`/response/actions/${actionId}/approve`, { approved_by: "current_user" })
      await fetchActions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve action")
    } finally {
      setActionLoading(null)
    }
  }, [fetchActions])

  const handleCancel = useCallback(async (actionId: string | number) => {
    setActionLoading(actionId)
    try {
      await api.post(`/response/actions/${actionId}/cancel`, { cancelled_by: "current_user", reason: "手动取消" })
      await fetchActions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel action")
    } finally {
      setActionLoading(null)
    }
  }, [fetchActions])

  const filteredActions = filterHypothesis === "all"
    ? actions
    : actions.filter((a) => a.hypothesisId === filterHypothesis)

  const statusConfig: Record<ActionStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: t("execution.statusPending"), color: "#f97316", icon: Clock },
    executing: { label: t("execution.statusExecuting"), color: "#22d3ee", icon: Loader2 },
    completed: { label: t("execution.statusCompleted"), color: "#22c55e", icon: CheckCircle2 },
    failed: { label: t("execution.statusFailed"), color: "#ff4d4f", icon: XCircle },
    awaiting_approval: { label: t("execution.statusAwaitingApproval"), color: "#faad14", icon: AlertTriangle },
  }

  const priorityConfig: Record<Priority, { label: string; color: string }> = {
    critical: { label: t("execution.priorityCritical"), color: "#ff4d4f" },
    high: { label: t("execution.priorityHigh"), color: "#f97316" },
    medium: { label: t("execution.priorityMedium"), color: "#faad14" },
    low: { label: t("execution.priorityLow"), color: "#1677ff" },
  }

  const statCards = [
    { label: t("execution.pendingActions"), value: actions.filter((a) => a.status === "pending").length, icon: Clock, color: "text-orange-600", bg: "bg-orange-50", borderColor: "border-orange-200" },
    { label: t("execution.executed"), value: actions.filter((a) => a.status === "completed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", borderColor: "border-emerald-200" },
    { label: t("execution.pendingApproval"), value: actions.filter((a) => a.status === "awaiting_approval").length, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", borderColor: "border-amber-200" },
    { label: t("execution.failed"), value: actions.filter((a) => a.status === "failed").length, icon: XCircle, color: "text-red-600", bg: "bg-red-50", borderColor: "border-red-200" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="card-default p-5"
          >
            <div className="flex items-center gap-4">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-600" />
              {t("execution.actionQueue")}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterHypothesis("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filterHypothesis === "all"
                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    : "text-slate-500 hover:text-slate-600 hover:bg-slate-50 border border-transparent"
                )}
              >
                {t("execution.all")}
              </button>
              {hypotheses.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setFilterHypothesis(h.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    filterHypothesis === h.id
                        ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                        : "text-slate-500 hover:text-slate-600 hover:bg-slate-50 border border-transparent"
                  )}
                >
                  {t("execution.hyp")} {h.id}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredActions.map((action) => {
              const status = statusConfig[action.status]
              const priority = priorityConfig[action.priority]
              const StatusIcon = status.icon
              const isAiDriven = action.requestedBy === "AI引擎"
              const isHighPriority = action.priority === "critical" || action.priority === "high"
              return (
                <div
              key={action.id}
                  className="card-default p-4 hover:border-cyan-500/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${priority.color}15`,
                        border: `1px solid ${priority.color}30`,
                      }}
                    >
                      <action.icon className="h-4 w-4" style={{ color: priority.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isAiDriven && <AIBrainIcon />}
                        <span className="text-sm font-semibold text-slate-900">{t(action.nameKey)}</span>
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${priority.color}20`,
                            color: priority.color,
                            border: `1px solid ${priority.color}40`,
                          }}
                        >
                          {priority.label}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color,
                            border: `1px solid ${status.color}40`,
                          }}
                        >
                          <StatusIcon className={cn("h-2.5 w-2.5", action.status === "executing" && "animate-spin")} />
                          {status.label}
                        </span>
                      </div>

                      {action.aiReasoning && (
                        <div
                          className="mb-2 flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs border border-cyan-200 bg-cyan-50"
                        >
                          <Sparkles className="h-3 w-3 text-cyan-600 shrink-0 mt-0.5" />
                          <span className="text-cyan-700">
                            <span className="font-medium text-cyan-800">{t("execution.aiReasoning")}:</span> {action.aiReasoning}
                          </span>
                        </div>
                      )}

                      {action.reasoningChain.length > 0 && (
                        <ReasoningChainPanel
                          chain={action.reasoningChain}
                          evidenceSummary={action.evidenceSummary}
                          t={t}
                        />
                      )}

                      <div className="my-3">
                        <ActionGuardrails action={action} />
                      </div>

                      <div className="mb-2">
                        <HypothesisBadge
                          id={action.hypothesisId}
                          label={action.hypothesisLabel}
                          confidence={action.hypothesisConfidence}
                          t={t}
                        />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {t("execution.target")}: {action.target}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {t("execution.source")}: {isAiDriven ? t("execution.aiAgent") : action.requestedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {action.status === "pending" && (
                        <Button size="xs" className="bg-cyan-600 text-white hover:bg-cyan-700 gap-1" disabled={actionLoading === action.id} onClick={() => handleExecute(action.id)}>
                          {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          {t("execution.execute")}
                        </Button>
                      )}
                      {action.status === "awaiting_approval" && (
                        <>
                          <Button size="xs" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1" disabled={actionLoading === action.id} onClick={() => handleApprove(action.id)}>
                            {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                            {t("execution.approve")}
                          </Button>
                          <Button size="xs" variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 gap-1" disabled={actionLoading === action.id} onClick={() => handleCancel(action.id)}>
                            {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                            {t("execution.cancel")}
                          </Button>
                        </>
                      )}
                      {action.status === "executing" && (
                        <Button size="xs" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1" disabled={actionLoading === action.id} onClick={() => handleCancel(action.id)}>
                          {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          {t("execution.cancel")}
                        </Button>
                      )}
                      {(action.status === "completed" || action.status === "failed") && (
                        <span className="text-xs text-slate-400 px-2">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Workflow className="h-4 w-4 text-cyan-600" />
            {t("execution.hypothesisActionMap")}
          </h2>

          <div className="space-y-4">
            {hypotheses.map((h) => {
              const progress = getHypothesisProgress(h)
              const confColor = h.confidence >= 80 ? "#22c55e" : h.confidence >= 50 ? "#faad14" : "#64748b"
              const barColor = h.confidence >= 80 ? "#22c55e" : h.confidence >= 50 ? "#faad14" : "#475569"

              return (
                <div
                  key={h.id}
                  className="card-default p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${confColor}15`,
                        border: `1px solid ${confColor}30`,
                      }}
                    >
                      <FlaskConical className="h-4 w-4" style={{ color: confColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{t("execution.hyp")} {h.id}</span>
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: `${confColor}20`,
                            color: confColor,
                            border: `1px solid ${confColor}40`,
                          }}
                        >
                          {h.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{h.label}</p>
                    </div>
                  </div>

                  {h.actions.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      {t("execution.noActionsRecommended")}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-500">
                            {progress.completed} / {progress.total} {t("execution.actionsCompleted")}
                          </span>
                          <span className="text-xs font-medium" style={{ color: barColor }}>
                            {progress.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-[width]"
                            style={{
                              width: `${progress.percent}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center rounded-lg bg-emerald-50 border border-emerald-200 py-1.5">
                          <p className="text-sm font-bold text-emerald-700">{progress.completed}</p>
                          <p className="text-[9px] text-slate-500">{t("execution.done")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-cyan-50 border border-cyan-200 py-1.5">
                          <p className="text-sm font-bold text-cyan-700">{progress.executing}</p>
                          <p className="text-[9px] text-slate-500">{t("execution.running")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-orange-50 border border-orange-200 py-1.5">
                          <p className="text-sm font-bold text-orange-700">{progress.pending}</p>
                          <p className="text-[9px] text-slate-500">{t("execution.pending")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-amber-50 border border-amber-200 py-1.5">
                          <p className="text-sm font-bold text-amber-700">{progress.awaiting}</p>
                          <p className="text-[9px] text-slate-500">{t("execution.await")}</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {h.actions.map((a) => {
                          const actionMeta = actions.find((x) => x.id === a.id)
                          if (!actionMeta) return null
                          const s = statusConfig[a.status]
                          const SIcon = s.icon
                          return (
                            <div
                              key={a.id}
                              className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-slate-50"
                            >
                              <SIcon className={cn("h-3 w-3 shrink-0", a.status === "executing" && "animate-spin")} style={{ color: s.color }} />
                              <span className="text-slate-600 truncate flex-1">{t(actionMeta.nameKey)}</span>
                              <span className="text-slate-400 shrink-0">{a.id}</span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DisposalStrategyTab({ t }: { t: (key: string) => string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-600" />
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-100 shrink-0 mt-0.5">
              <Sparkles className="h-3 w-3 text-cyan-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">{t("execution.aiExecutionLogic")}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t("execution.confidenceTrigger")} ≥80% → {t("execution.priorityCritical")} | 50-80% → {t("execution.priorityMedium")} | &lt;50% → {t("execution.priorityLow")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-100 shrink-0 mt-0.5">
              <Workflow className="h-3 w-3 text-cyan-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">{t("execution.disposalChain")}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t("execution.hypothesis")} → {t("execution.aiReasoning")} → {t("execution.disposalAction")} → {t("execution.statusCompleted")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {strategies.map((s) => (
          <div
            key={s.name}
            className="card-default p-5 hover:border-cyan-500/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AIBrainIcon />
                <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
                <span className="text-xs text-cyan-700">{s.trigger}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">{s.description}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500">
                {t("execution.disposalChain")}:
              </span>
              {s.actions.map((action, idx) => (
                <span key={action} className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{action}</span>
                  {idx < s.actions.length - 1 && <Zap className="h-3 w-3 text-slate-400" />}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{t("execution.confidenceTrigger")}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${s.confidence}%` }} />
              </div>
              <span className="text-xs text-cyan-600">{s.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExecutionRecordTab({ t }: { t: (key: string) => string }) {
  const [records, setRecords] = useState(executionRecords)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await api.get("/response/actions?limit=50")
        const data = res.data
        const mapped = (data.items ?? data).map(mapApiAction)
        const apiRecords = mapped
          .filter((a: ActionItem) => a.status === "completed" || a.status === "failed" || a.status === "executing" || a.status === "awaiting_approval")
          .map((a: ActionItem) => ({
            id: String(a.id),
            action: `${t(a.nameKey)}(${a.target})`,
            hypothesis: `H-${a.hypothesisId} ${a.hypothesisLabel}`,
            confidence: a.hypothesisConfidence,
            status: (a.status === "executing" ? "running" : a.status === "awaiting_approval" ? "awaiting" : a.status) as "completed" | "running" | "awaiting" | "failed",
            executor: a.requestedBy,
            time: a.timestamp,
          }))
        if (apiRecords.length > 0) {
          setRecords(apiRecords)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [t])

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    completed: { icon: CheckCircle2, color: "#22c55e", label: t("execution.statusCompleted") },
    running: { icon: Activity, color: "#22d3ee", label: t("execution.statusExecuting") },
    awaiting: { icon: Clock, color: "#faad14", label: t("execution.statusAwaitingApproval") },
    failed: { icon: XCircle, color: "#ff4d4f", label: t("execution.statusFailed") },
  }

  return (
    <div className="space-y-6">
      <div className="card-default p-5">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-600" />
          {t("execution.executionLog")}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
          </div>
        ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-cyan-200" />
          <div className="space-y-5">
            {records.map((rec) => {
              const cfg = statusConfig[rec.status]
              const StatusIcon = cfg.icon
              const isAiAgent = rec.executor === "AI引擎"
              return (
                <div key={rec.id} className="relative flex items-start gap-4 pl-8">
                  <div
                    className="absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border"
                    style={{
                      backgroundColor: `${cfg.color}20`,
                      borderColor: cfg.color,
                    }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">{rec.time}</span>
                      <span className="text-xs font-medium text-slate-700">{rec.action}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}40`,
                        }}
                      >
                        <StatusIcon className={cn("h-2.5 w-2.5", rec.status === "running" && "animate-spin")} />
                        {cfg.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">
                        {rec.hypothesis}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {t("execution.confidenceTrigger")}: {rec.confidence}%
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        {t("execution.by")}
                        {isAiAgent ? (
                          <span className="inline-flex items-center gap-0.5 text-cyan-700">
                            <Brain className="h-2.5 w-2.5" />
                            {t("execution.aiAgent")}
                          </span>
                        ) : (
                          <span>{rec.executor}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <RotateCcw className="h-4 w-4 text-amber-400" />
          回滚记录
        </h3>
        <div className="space-y-3">
          {rollbackRecords.map((rb) => (
            <div
              key={rb.id}
              className="rounded-lg border border-amber-200 bg-amber-50 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm text-slate-700">{rb.action}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{rb.id}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>原因: {rb.reason}</span>
                <span>操作人: {rb.operator}</span>
                <span className="font-mono">{rb.time}</span>
              </div>
              <div className="mt-1.5 text-xs text-slate-500">
                原始操作: {rb.originalAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResponsePage() {
  const { t } = useLocaleStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("auto-disposal")
  const { isConnected: wsConnected, lastMessage: wsMessage } = useWebSocket({})

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        icon={Brain}
        title={t("execution.title")}
        actions={
          <>
            <div className="flex items-center gap-1.5 mr-2">
              <span className={cn("size-2 rounded-full", wsConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span className={cn("text-xs font-medium", wsConnected ? "text-emerald-600" : "text-red-500")}>
                {wsConnected ? "实时连接" : "连接断开"}
              </span>
            </div>
            <Button
              className="gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              onClick={() => router.push("/learning?from=response")}
            >
              <ArrowUpRight className="h-4 w-4" />
              反馈学习
            </Button>
            <Button className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700">
              <Plus className="h-4 w-4" />
              {t("execution.newAction")}
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`${softCardClass} p-2`}>
        <TabsList variant="line" className="border-b border-slate-200 w-full justify-start gap-0">
          <TabsTrigger value="auto-disposal" className="text-slate-500 data-active:text-cyan-700">
            <Cpu className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabAutoDisposal")}
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-slate-500 data-active:text-cyan-700">
            <Workflow className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabDisposalStrategy")}
          </TabsTrigger>
          <TabsTrigger value="records" className="text-slate-500 data-active:text-cyan-700">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabExecutionRecord")}
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="auto-disposal" className="mt-4">
          <AutoDisposalTab t={t} wsMessage={wsMessage} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
          <DisposalStrategyTab t={t} />
        </TabsContent>
        <TabsContent value="records" className="mt-4">
          <ExecutionRecordTab t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
