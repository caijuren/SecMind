"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWebSocket } from "@/hooks/useWebSocket"
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
  RefreshCw,
  WifiOff,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { softCardClass } from "@/lib/admin-ui"
import { CARD } from "@/lib/design-system"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useLocaleStore } from "@/store/locale-store"
import { usePageTitle } from "@/hooks/use-page-title"
import { api, isAxiosError } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

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

interface WsActionMessage {
  type: "action_update" | "action_status" | "new_action"
  data: ApiResponseAction
}

const MOCK_ACTION_BASE_TIME = new Date("2026-05-19T16:00:00+08:00").getTime()

function mockTimestamp(offsetMs: number) {
  return new Date(MOCK_ACTION_BASE_TIME - offsetMs).toISOString()
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

function parseError(err: unknown): { messageKey: string; type: "network" | "auth" | "permission" | "server" | "unknown"; detail?: string } {
  if (isAxiosError(err)) {
    if (!err.response) {
      return { messageKey: "execution.parseErrorNetwork", type: "network", detail: err.message }
    }
    const status = err.response.status
    const detail = err.response.data?.detail
    if (status === 401) {
      return { messageKey: "execution.parseErrorAuth", type: "auth", detail: detail || "" }
    }
    if (status === 403) {
      return { messageKey: "execution.parseErrorForbidden", type: "permission", detail: detail || "" }
    }
    if (status >= 500) {
      return { messageKey: "execution.parseErrorServer", type: "server", detail: detail || "" }
    }
    if (status === 404) {
      return { messageKey: "execution.parseErrorNotFound", type: "unknown", detail: detail || err.message }
    }
    return { messageKey: "execution.parseErrorUnknown", type: "unknown", detail: detail || err.message }
  }
  if (err instanceof Error) {
    return { messageKey: "execution.parseErrorUnknown", type: "unknown", detail: err.message }
  }
  return { messageKey: "execution.parseErrorData", type: "unknown" }
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
    requestedBy: raw.requested_by || "AI Engine",
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
  { nameKey: "execution.strategyAccountCompromise", trigger: "≥85%", actions: ["execution.actionFreezeAccount", "execution.actionResetPassword", "execution.actionQuarantineDevice"], confidence: 85, descriptionKey: "execution.strategyAccountCompromiseDesc" },
  { nameKey: "execution.strategyC2Block", trigger: "≥90%", actions: ["execution.actionBlockIp", "execution.actionQuarantineDevice", "execution.actionNotifyTeam"], confidence: 90, descriptionKey: "execution.strategyC2BlockDesc" },
  { nameKey: "execution.strategyBruteForce", trigger: "≥50", actions: ["execution.actionBlockIp", "execution.actionFreezeAccount", "execution.actionResetVpn"], confidence: 95, descriptionKey: "execution.strategyBruteForceDesc" },
  { nameKey: "execution.strategyDataExfil", trigger: "≥100MB", actions: ["execution.actionBlockIp", "execution.actionPreserveForensic", "execution.actionNotifyTeam"], confidence: 80, descriptionKey: "execution.strategyDataExfilDesc" },
]

const executionRecords = [
  { id: "REC-001", actionKey: "execution.actionFreezeAccount", actionTarget: "chengang", hypothesis: "H-A", hypothesisLabelKey: "execution.strategyAccountCompromise", confidence: 92, status: "completed" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:32:15" },
  { id: "REC-002", actionKey: "execution.actionIsolateHost", actionTarget: "DEV-WS-004", hypothesis: "H-A", hypothesisLabelKey: "execution.strategyAccountCompromise", confidence: 92, status: "completed" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:32:18" },
  { id: "REC-003", actionKey: "execution.actionBlockIp", actionTarget: "45.33.32.156", hypothesis: "H-A", hypothesisLabelKey: "execution.strategyAccountCompromise", confidence: 92, status: "completed" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:32:20" },
  { id: "REC-004", actionKey: "execution.actionResetPassword", actionTarget: "wangfang", hypothesis: "H-B", hypothesisLabelKey: "execution.strategyBruteForce", confidence: 54, status: "awaiting" as const, executorKey: "execution.awaitingApproval", executorName: "", time: "2026-05-09 10:35:00" },
  { id: "REC-005", actionKey: "execution.actionNotifyTeam", actionTarget: "", hypothesis: "H-A", hypothesisLabelKey: "execution.strategyAccountCompromise", confidence: 92, status: "completed" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:32:22" },
  { id: "REC-006", actionKey: "execution.actionPreserveForensic", actionTarget: "", hypothesis: "H-A", hypothesisLabelKey: "execution.strategyAccountCompromise", confidence: 92, status: "running" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:32:25" },
  { id: "REC-007", actionKey: "execution.actionBlockIp", actionTarget: "103.45.67.89", hypothesis: "H-A", hypothesisLabelKey: "execution.strategyAccountCompromise", confidence: 92, status: "failed" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:33:01" },
  { id: "REC-008", actionKey: "execution.actionMonitorUser", actionTarget: "linfeng", hypothesis: "H-B", hypothesisLabelKey: "execution.strategyBruteForce", confidence: 54, status: "running" as const, executorKey: "execution.aiAgent", executorName: "", time: "2026-05-09 10:36:00" },
]

const rollbackRecords = [
  { id: "RB-001", actionKey: "execution.actionFreezeAccount", actionTarget: "chengang", reasonKey: "execution.rollbackReasonFalsePositive", operator: "赵敏", time: "2026-05-09 11:15:00", originalAction: "REC-001" },
  { id: "RB-002", actionKey: "execution.actionBlockIp", actionTarget: "10.0.1.100", reasonKey: "execution.rollbackReasonInternalProxy", operator: "卫东", time: "2026-05-09 09:45:00", originalAction: "REC-003" },
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
        <div className="flex items-center gap-1.5 text-xs text-cyan-600 group-hover:text-primary transition-colors">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <Sparkles className="h-3 w-3" />
          <span className="font-medium">{t("execution.viewReasoningChain")}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            +{evidenceSummary.supporting}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-600 border border-red-500/20">
            -{evidenceSummary.contradicting}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border">
            ~{evidenceSummary.neutral}
          </span>
          <span className="text-[10px] text-muted-foreground/60 ml-0.5">{t("execution.evidenceCount")}: {total}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 relative">
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-cyan-500/20" />
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
                      <span className="text-[10px] text-muted-foreground/60">#{idx + 1}</span>
                      {step.mitreRef && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {step.mitreRef}
                        </span>
                      )}
                      {step.confidenceDelta !== undefined && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <BarChart3 className="h-2.5 w-2.5" />
                          {step.confidenceDelta}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{step.description}</p>

                    {step.evidence.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {step.evidence.map((ev, evIdx) => {
                          const dir = directionConfig[ev.direction]
                          return (
                            <div
                              key={evIdx}
                              className="flex items-start gap-2 rounded-md px-2 py-1.5 bg-muted/50 border border-border"
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
                                  <span className="text-[10px] text-muted-foreground/60 font-mono">{ev.timestamp}</span>
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                                    <Database className="h-2.5 w-2.5" />
                                    {ev.source}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{ev.detail}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-start gap-1.5 pt-1.5 border-t border-border/40">
                      <Sparkles className="h-3 w-3 text-cyan-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-600 leading-relaxed">
                        <span className="font-medium text-primary">{t("execution.stepConclusion")}:</span> {step.conclusion}
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

function ActionGuardrails({ action, t }: { action: ActionItem; t: (key: string) => string }) {
  const guardrails = action.guardrails ?? {
    approval: action.status === "awaiting_approval" ? t("execution.guardrailApprovalAwaiting") : t("execution.guardrailApprovalDefault"),
    impact: `${t("execution.guardrailImpactPrefix")}${action.target}`,
    rollback: t("execution.guardrailRollback"),
    audit: t("execution.guardrailAudit"),
  }
  const items = [
    { label: t("execution.approval"), value: guardrails.approval, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: t("execution.impact"), value: guardrails.impact, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: t("execution.rollback"), value: guardrails.rollback, icon: RotateCcw, color: "text-cyan-600", bg: "bg-primary/10" },
    { label: t("execution.audit"), value: guardrails.audit, icon: FileSearch, color: "text-muted-foreground", bg: "bg-muted/50" },
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
          <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", item.bg)}>
            <item.icon className={cn("h-3.5 w-3.5", item.color)} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-muted-foreground">{item.label}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{item.value}</div>
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

function AutoDisposalTab({ t, wsMessage }: { t: (key: string) => string; wsMessage: WsActionMessage | null }) {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ReturnType<typeof parseError> | null>(null)
  const [actionLoading, setActionLoading] = useState<string | number | null>(null)
  const [filterHypothesis, setFilterHypothesis] = useState<string>("all")

  const MOCK_ACTIONS: ActionItem[] = [
    {
      id: "mock-1",
      nameKey: "execution.freezeAccount",
      icon: UserLock,
      target: `${t("execution.targetUser")}: wangfang@secm1nd.com`,
      status: "completed",
      priority: "critical",
      hypothesisId: "hyp-001",
      hypothesisLabel: t("execution.mockHypAccountCompromise"),
      hypothesisConfidence: 92,
      requestedBy: "AI Engine",
      timestamp: mockTimestamp(3600000),
      aiReasoning: t("execution.mockReason1"),
      reasoningChain: [],
      evidenceSummary: { supporting: 5, contradicting: 0, neutral: 1 },
    },
    {
      id: "mock-2",
      nameKey: "execution.isolateHost",
      icon: ShieldAlert,
      target: `${t("execution.targetHost")}: WIN-DESK-15 (192.168.1.105)`,
      status: "executing",
      priority: "critical",
      hypothesisId: "hyp-002",
      hypothesisLabel: t("execution.mockHypC2"),
      hypothesisConfidence: 95,
      requestedBy: "AI Engine",
      timestamp: mockTimestamp(1800000),
      aiReasoning: t("execution.mockReason2"),
      reasoningChain: [],
      evidenceSummary: { supporting: 7, contradicting: 1, neutral: 0 },
    },
    {
      id: "mock-3",
      nameKey: "execution.blockIp",
      icon: Ban,
      target: `IP: 91.234.56.78 (${t("execution.mockMoscow")})`,
      status: "completed",
      priority: "high",
      hypothesisId: "hyp-003",
      hypothesisLabel: t("execution.mockHypBruteForce"),
      hypothesisConfidence: 88,
      requestedBy: "AI Engine",
      timestamp: mockTimestamp(7200000),
      aiReasoning: t("execution.mockReason3"),
      reasoningChain: [],
      evidenceSummary: { supporting: 4, contradicting: 0, neutral: 2 },
    },
    {
      id: "mock-4",
      nameKey: "execution.notifySecurityTeam",
      icon: Bell,
      target: `${t("execution.targetSecurityTeam")}: SOC`,
      status: "awaiting_approval",
      priority: "high",
      hypothesisId: "hyp-004",
      hypothesisLabel: t("execution.mockHypDataExfil"),
      hypothesisConfidence: 85,
      requestedBy: "AI Engine",
      timestamp: mockTimestamp(900000),
      aiReasoning: t("execution.mockReason4"),
      reasoningChain: [],
      evidenceSummary: { supporting: 6, contradicting: 0, neutral: 1 },
    },
    {
      id: "mock-5",
      nameKey: "execution.resetVpnCredentials",
      icon: KeyRound,
      target: `${t("execution.targetUser")}: zhangwei@secm1nd.com`,
      status: "pending",
      priority: "medium",
      hypothesisId: "hyp-005",
      hypothesisLabel: t("execution.mockHypVpn"),
      hypothesisConfidence: 72,
      requestedBy: "AI Engine",
      timestamp: mockTimestamp(600000),
      aiReasoning: t("execution.mockReason5"),
      reasoningChain: [],
      evidenceSummary: { supporting: 3, contradicting: 2, neutral: 2 },
    },
  ]

  const fetchActions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/response/actions")
      const data = res.data
      const mapped = (data.items ?? data).map(mapApiAction)
      if (mapped.length > 0) {
        setActions(mapped)
        setHypotheses(buildHypotheses(mapped))
      } else {
        setActions(MOCK_ACTIONS)
        setHypotheses(buildHypotheses(MOCK_ACTIONS))
      }
    } catch {
      setActions(MOCK_ACTIONS)
      setHypotheses(buildHypotheses(MOCK_ACTIONS))
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
        if (mapped.length > 0) {
          setActions(mapped)
          setHypotheses(buildHypotheses(mapped))
        } else {
          setActions(MOCK_ACTIONS)
          setHypotheses(buildHypotheses(MOCK_ACTIONS))
        }
      } catch {
        if (cancelled) return
        setActions(MOCK_ACTIONS)
        setHypotheses(buildHypotheses(MOCK_ACTIONS))
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
        const applyUpdate = () => {
          setActions(prev => {
            const next = prev.map(a => a.id === updatedAction.id ? updatedAction : a)
            setHypotheses(buildHypotheses(next))
            return next
          })
        }
        if (typeof queueMicrotask === "function") {
          queueMicrotask(applyUpdate)
        } else {
          Promise.resolve().then(applyUpdate)
        }
      } catch {}
    }
    if (wsMessage.type === "new_action") {
      try {
        const newAction = mapApiAction(wsMessage.data)
        const applyInsert = () => {
          setActions(prev => {
            const next = [newAction, ...prev]
            setHypotheses(buildHypotheses(next))
            return next
          })
        }
        if (typeof queueMicrotask === "function") {
          queueMicrotask(applyInsert)
        } else {
          Promise.resolve().then(applyInsert)
        }
      } catch {}
    }
  }, [wsMessage])

  const handleExecute = useCallback(async (actionId: string | number) => {
    setActionLoading(actionId)
    try {
      await api.post(`/response/actions/${actionId}/execute`)
      await fetchActions()
    } catch (err) {
      setError(parseError(err))
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
      setError(parseError(err))
    } finally {
      setActionLoading(null)
    }
  }, [fetchActions])

  const handleCancel = useCallback(async (actionId: string | number) => {
    setActionLoading(actionId)
    try {
      await api.post(`/response/actions/${actionId}/cancel`, { cancelled_by: "current_user", reason: "manual_cancellation" })
      await fetchActions()
    } catch (err) {
      setError(parseError(err))
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
    { label: t("execution.pendingActions"), value: actions.filter((a) => a.status === "pending").length, icon: Clock, color: "text-orange-600", bg: "bg-orange-500/10", borderColor: "border-orange-500/20" },
    { label: t("execution.executed"), value: actions.filter((a) => a.status === "completed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
    { label: t("execution.pendingApproval"), value: actions.filter((a) => a.status === "awaiting_approval").length, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10", borderColor: "border-amber-500/20" },
    { label: t("execution.failed"), value: actions.filter((a) => a.status === "failed").length, icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", borderColor: "border-red-500/20" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (error) {
    const errorConfig = {
      network: { icon: WifiOff, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", titleKey: "execution.errorNetwork" },
      auth: { icon: Lock, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", titleKey: "execution.errorAuth" },
      permission: { icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20", titleKey: "execution.errorPermission" },
      server: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", titleKey: "execution.errorServer" },
      unknown: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", titleKey: "execution.errorLoadFailed" },
    }
    const cfg = errorConfig[error.type]

    return (
      <div className={cn("rounded-lg border p-5", cfg.bg, cfg.border)}>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", cfg.bg)}>
            <cfg.icon className={cn("h-6 w-6", cfg.color)} />
          </div>
          <div className="text-center">
            <h3 className={cn("text-sm font-semibold", cfg.color)}>{t(cfg.titleKey)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(error.messageKey)}</p>
            {error.detail && (
              <p className="mt-1 text-xs text-muted-foreground/60">{error.detail}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="gap-1.5 border border-border bg-muted/50 text-muted-foreground hover:bg-muted/70"
              onClick={() => {
                setLoading(true)
                setError(null)
                fetchActions()
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("execution.retry")}
            </Button>
            {error.type === "auth" && (
              <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => window.location.href = "/login"}
              >
                {t("execution.relogin")}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(CARD.base, "p-5 transition-colors duration-200")}
            style={{
              borderColor: stat.borderColor.replace('border-', ''),
            }}
          >
            <div className="flex items-center gap-4">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1", stat.bg, stat.borderColor)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-600" />
              {t("execution.actionQueue")}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterHypothesis("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filterHypothesis === "all"
                    ? "bg-primary/10 text-cyan-600 border border-cyan-500/20"
                    : "text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 border border-transparent"
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
                        ? "bg-primary/10 text-cyan-600 border border-cyan-500/20"
                        : "text-muted-foreground hover:text-muted-foreground hover:bg-muted/50 border border-transparent"
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
              const isAiDriven = action.requestedBy === "AI Engine"
              return (
                <div
              key={action.id}
                  className={cn(CARD.base, "p-4 hover:border-cyan-500/15 transition-colors duration-200")}
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
                        <span className="text-sm font-semibold text-foreground">{t(action.nameKey)}</span>
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
                          className="mb-2 flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs border border-cyan-500/20 bg-primary/10"
                        >
                          <Sparkles className="h-3 w-3 text-cyan-600 shrink-0 mt-0.5" />
                          <span className="text-cyan-600">
                            <span className="font-medium text-primary">{t("execution.aiReasoning")}:</span> {action.aiReasoning}
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
                        <ActionGuardrails action={action} t={t} />
                      </div>

                      <div className="mb-2">
                        <HypothesisBadge
                          id={action.hypothesisId}
                          label={action.hypothesisLabel}
                          confidence={action.hypothesisConfidence}
                          t={t}
                        />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
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
                        <Button size="xs" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1" disabled={actionLoading === action.id} onClick={() => handleExecute(action.id)}>
                          {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          {t("execution.execute")}
                        </Button>
                      )}
                      {action.status === "awaiting_approval" && (
                        <>
                          <Button size="xs" className="bg-emerald-600 text-foreground hover:bg-emerald-700 gap-1" disabled={actionLoading === action.id} onClick={() => handleApprove(action.id)}>
                            {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                            {t("execution.approve")}
                          </Button>
                          <Button size="xs" variant="outline" className="border-border text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground gap-1" disabled={actionLoading === action.id} onClick={() => handleCancel(action.id)}>
                            {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                            {t("execution.cancel")}
                          </Button>
                        </>
                      )}
                      {action.status === "executing" && (
                        <Button size="xs" variant="outline" className="border-red-500/30 text-red-600 hover:bg-red-500/10 gap-1" disabled={actionLoading === action.id} onClick={() => handleCancel(action.id)}>
                          {actionLoading === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          {t("execution.cancel")}
                        </Button>
                      )}
                      {(action.status === "completed" || action.status === "failed") && (
                        <span className="text-xs text-muted-foreground/60 px-2">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
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
                  className={cn(CARD.base, "p-5 transition-colors duration-200")}
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
                        <span className="text-sm font-semibold text-foreground">{t("execution.hyp")} {h.id}</span>
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
                      <p className="text-xs text-muted-foreground">{h.label}</p>
                    </div>
                  </div>

                  {h.actions.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground/60 border border-dashed border-border rounded-lg">
                      {t("execution.noActionsRecommended")}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-muted-foreground">
                            {progress.completed} / {progress.total} {t("execution.actionsCompleted")}
                          </span>
                          <span className="text-xs font-medium" style={{ color: barColor }}>
                            {progress.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
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
                        <div className="text-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1.5">
                          <p className="text-sm font-bold text-emerald-600">{progress.completed}</p>
                          <p className="text-[9px] text-muted-foreground">{t("execution.done")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-primary/10 border border-cyan-500/20 py-1.5">
                          <p className="text-sm font-bold text-cyan-600">{progress.executing}</p>
                          <p className="text-[9px] text-muted-foreground">{t("execution.running")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-orange-500/10 border border-orange-500/20 py-1.5">
                          <p className="text-sm font-bold text-orange-600">{progress.pending}</p>
                          <p className="text-[9px] text-muted-foreground">{t("execution.pending")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-amber-500/10 border border-amber-500/20 py-1.5">
                          <p className="text-sm font-bold text-amber-600">{progress.awaiting}</p>
                          <p className="text-[9px] text-muted-foreground">{t("execution.await")}</p>
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
                              className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-muted/50"
                            >
                              <SIcon className={cn("h-3 w-3 shrink-0", a.status === "executing" && "animate-spin")} style={{ color: s.color }} />
                              <span className="text-muted-foreground truncate flex-1">{t(actionMeta.nameKey)}</span>
                              <span className="text-muted-foreground/60 shrink-0">{a.id}</span>
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
      <div className="rounded-lg border border-cyan-500/20 bg-primary/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-600" />
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 shrink-0 mt-0.5">
              <Sparkles className="h-3 w-3 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("execution.aiExecutionLogic")}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {t("execution.confidenceTrigger")} ≥80% → {t("execution.priorityCritical")} | 50-80% → {t("execution.priorityMedium")} | &lt;50% → {t("execution.priorityLow")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 shrink-0 mt-0.5">
              <Workflow className="h-3 w-3 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("execution.disposalChain")}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {t("execution.hypothesis")} → {t("execution.aiReasoning")} → {t("execution.disposalAction")} → {t("execution.statusCompleted")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {strategies.map((s) => (
          <div
            key={s.nameKey}
            className={cn(CARD.base, "p-5 hover:border-cyan-500/15 transition-colors duration-200")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AIBrainIcon />
                <h3 className="text-sm font-semibold text-foreground">{t(s.nameKey)}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
                <span className="text-xs text-cyan-600">{t("execution.confidenceTrigger")} {s.trigger}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60 mb-3">{t(s.descriptionKey)}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">
                {t("execution.disposalChain")}:
              </span>
              {s.actions.map((action, idx) => (
                <span key={action} className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{t(action)}</span>
                  {idx < s.actions.length - 1 && <Zap className="h-3 w-3 text-muted-foreground/60" />}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("execution.confidenceTrigger")}</span>
              <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
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
            actionKey: a.nameKey,
            actionTarget: a.target,
            hypothesis: a.hypothesisId ? `H-${a.hypothesisId}` : "",
            hypothesisLabelKey: "",
            confidence: a.hypothesisConfidence,
            status: (a.status === "executing" ? "running" : a.status === "awaiting_approval" ? "awaiting" : a.status) as "completed" | "running" | "awaiting" | "failed",
            executorKey: a.requestedBy === "AI Engine" ? "execution.aiAgent" : "",
            executorName: a.requestedBy === "AI Engine" ? "" : a.requestedBy,
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
      <div className={cn(CARD.base, "p-5")}>
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-600" />
          {t("execution.executionLog")}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
          </div>
        ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-cyan-500/20" />
          <div className="space-y-5">
            {records.map((rec) => {
              const cfg = statusConfig[rec.status]
              const StatusIcon = cfg.icon
              const isAiAgent = rec.executorKey === "execution.aiAgent"
              const actionDisplay = rec.actionTarget ? `${t(rec.actionKey)}(${rec.actionTarget})` : t(rec.actionKey)
              const hypothesisDisplay = rec.hypothesisLabelKey ? `${rec.hypothesis} ${t(rec.hypothesisLabelKey)}` : rec.hypothesis
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
                      <span className="text-xs font-mono text-muted-foreground/60">{rec.time}</span>
                      <span className="text-xs font-medium text-muted-foreground">{actionDisplay}</span>
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
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground/60">
                        {hypothesisDisplay}
                      </Badge>
                      <span className="text-xs text-muted-foreground/60">
                        {t("execution.confidenceTrigger")}: {rec.confidence}%
                      </span>
                      <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        {t("execution.by")}
                        {isAiAgent ? (
                          <span className="inline-flex items-center gap-0.5 text-cyan-600">
                            <Brain className="h-2.5 w-2.5" />
                            {t("execution.aiAgent")}
                          </span>
                        ) : (
                          <span>{rec.executorName}</span>
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

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4">
          <RotateCcw className="h-4 w-4 text-amber-600" />
          {t("execution.rollbackRecords")}
        </h3>
        <div className="space-y-3">
          {rollbackRecords.map((rb) => (
            <div
              key={rb.id}
              className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-sm text-muted-foreground">{t(rb.actionKey)}({rb.actionTarget})</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground/60">{rb.id}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                <span>{t("execution.rollbackReason")}: {t(rb.reasonKey)}</span>
                <span>{t("execution.rollbackOperator")}: {rb.operator}</span>
                <span className="font-mono">{rb.time}</span>
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">
                {t("execution.rollbackOriginalAction")}: {rb.originalAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResponsePage() {
  usePageTitle("response")
  const { t } = useLocaleStore()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("auto-disposal")
  const [showNewActionDialog, setShowNewActionDialog] = useState(false)
  const [autoDispose, setAutoDispose] = useState(false)
  const { connectionStatus, lastMessage: wsMessage } = useWebSocket({})
  const wsConnected = connectionStatus === "connected"

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        icon={Brain}
        title={t("execution.title")}
        actions={
          <>
            <div className="flex items-center gap-1.5 mr-2">
              <span className={cn("size-2 rounded-full", wsConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span className={cn("text-xs font-medium", wsConnected ? "text-emerald-600" : "text-red-600")}>
                {wsConnected ? t("execution.connected") : t("execution.disconnected")}
              </span>
            </div>
            <Button
              className="gap-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              onClick={() => router.push("/learning?from=response")}
            >
              <ArrowUpRight className="h-4 w-4" />
              {t("execution.feedbackLearning")}
            </Button>
            <Button
              className={cn("gap-1.5", autoDispose ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-muted/50 text-muted-foreground hover:bg-muted/70")}
              onClick={() => {
                const next = !autoDispose
                setAutoDispose(next)
                toast(next ? "自动处置模式已开启" : "自动处置模式已关闭", next ? "success" : "info")
              }}
            >
              <Zap className="h-4 w-4" />
              {autoDispose ? "自动处置: 开" : "自动处置: 关"}
            </Button>
            <Button className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowNewActionDialog(true)}>
              <Plus className="h-4 w-4" />
              {t("execution.newAction")}
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`${softCardClass} p-2`}>
        <TabsList variant="line" className="border-b border-border w-full justify-start gap-0">
          <TabsTrigger value="auto-disposal" className="text-muted-foreground data-active:text-cyan-600">
            <Cpu className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabAutoDisposal")}
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-muted-foreground data-active:text-cyan-600">
            <Workflow className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabDisposalStrategy")}
          </TabsTrigger>
          <TabsTrigger value="records" className="text-muted-foreground data-active:text-cyan-600">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabExecutionRecord")}
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="auto-disposal" className="mt-4">
          <AutoDisposalTab t={t} wsMessage={wsMessage as WsActionMessage | null} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
          <DisposalStrategyTab t={t} />
        </TabsContent>
        <TabsContent value="records" className="mt-4">
          <ExecutionRecordTab t={t} />
        </TabsContent>
      </Tabs>

      <Dialog open={showNewActionDialog} onOpenChange={setShowNewActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建处置动作</DialogTitle>
            <DialogDescription>请填写处置动作的相关信息以创建新的处置任务。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">处置类型</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="freezeAccount">冻结账户</option>
                <option value="isolateHost">隔离主机</option>
                <option value="blockIp">封禁IP</option>
                <option value="resetVpnCredentials">重置VPN凭证</option>
                <option value="notifySecurityTeam">通知安全团队</option>
                <option value="preserveForensicData">保全取证数据</option>
                <option value="monitorUserActivity">监控用户活动</option>
                <option value="reviewAccessLogs">审查访问日志</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">目标</label>
              <input
                type="text"
                placeholder="例如: user@secm1nd.com / 192.168.1.100"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">优先级</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="critical">紧急</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewActionDialog(false)}>取消</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { toast("处置动作已创建", "success"); setShowNewActionDialog(false) }}>确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
