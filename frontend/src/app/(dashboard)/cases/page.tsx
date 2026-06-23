"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Brain,
  Search,
  Shield,
  CheckCircle2,
  Sparkles,
  Target,
  Server,
  User,
  ArrowRight,
  Zap,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Link2,
  GitBranch,
  Activity,
  Globe,
  MoveRight,
  FileText,
  ClipboardList,
  Wrench,
  UserCircle,
  BarChart3,
  ShieldCheck,
  FileSearch,
  FileCheck,
  Inbox,
  ArrowRightLeft,
  Play,
  Loader2,
  Workflow,
  CircleDot,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/layout/page-header"
import { TablePagination } from "@/components/layout/table-pagination"
import { inputClass } from "@/lib/admin-ui"
import { useLocaleStore } from "@/store/locale-store"
import { useWorkbenchBridgeStore } from "@/store/workbench-bridge-store"
import { CARD } from "@/lib/design-system"
import {
  type InvestigationStatus,
  type InvestigationTab,
  type EvidenceItem,
  type PersonProfile,
  type BaselineDeviation,
  type MITREMapping,
  type CorrelationDetail,
  type AIReasoningStep,
  type InvestigationRecord,
  GridIcon,
  SEVERITY_CONFIG,
  DEVIATION_CONFIG,
  CORRELATION_STRENGTH_CONFIG,
  WORK_STATUS_CONFIG,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_TYPE_COLORS,
} from "@/data/investigations"

// ==================== Constants ====================

const TABS: { value: InvestigationTab; labelKey: string; icon: React.ElementType }[] = [
  { value: "investigating", labelKey: "statusInvestigating", icon: Activity },
  { value: "pending_review", labelKey: "statusPendingReview", icon: ClipboardList },
  { value: "disposing", labelKey: "statusDisposing", icon: Wrench },
  { value: "closed", labelKey: "statusClosed", icon: CheckCircle2 },
  { value: "all", labelKey: "statusAll", icon: GridIcon },
]


const STATUS_CONFIG: Record<InvestigationStatus, { color: string; bg: string; border: string; pulseColor: string; labelKey: string }> = {
  investigating: { color: "text-primary", bg: "bg-primary/10", border: "border-cyan-500/20", pulseColor: "bg-cyan-400", labelKey: "statusInvestigating" },
  pending_review: { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", pulseColor: "bg-amber-400", labelKey: "statusPendingReview" },
  disposing: { color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20", pulseColor: "bg-purple-400", labelKey: "statusDisposing" },
  closed: { color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", pulseColor: "bg-emerald-400", labelKey: "statusClosed" },
}


const STEP_TYPE_CONFIG: Record<AIReasoningStep["type"], { icon: React.ElementType; color: string; labelKey: string }> = {
  discover: { icon: Eye, color: "text-cyan-600", labelKey: "phaseDiscover" },
  correlate: { icon: Link2, color: "text-amber-600", labelKey: "phaseCorrelate" },
  judge: { icon: Brain, color: "text-red-600", labelKey: "phaseJudge" },
}


const EVIDENCE_TYPE_CONFIG: Record<EvidenceItem["type"], { icon: React.ElementType; labelKey: string; color: string }> = {
  log: { icon: FileText, labelKey: "evidenceLog", color: "#22d3ee" },
  network: { icon: Globe, labelKey: "evidenceNetwork", color: "#a78bfa" },
  endpoint: { icon: Server, labelKey: "evidenceEndpoint", color: "#fbbf24" },
  identity: { icon: User, labelKey: "evidenceIdentity", color: "#34d399" },
  behavioral: { icon: Activity, labelKey: "evidenceBehavioral", color: "#f97316" },
  threat_intel: { icon: Shield, labelKey: "evidenceThreatIntel", color: "#ff4d4f" },
  baseline: { icon: BarChart3, labelKey: "evidenceBaseline", color: "#06b6d4" },
  external: { icon: Globe, labelKey: "evidenceExternal", color: "#64748b" },
}


const CLOSURE_STEPS = [
  { key: "investigating", labelKey: "stepInvestigating", icon: Brain, color: "#06b6d4" },
  { key: "pending_review", labelKey: "stepPendingReview", icon: ClipboardList, color: "#fbbf24" },
  { key: "disposing", labelKey: "stepDisposing", icon: Wrench, color: "#a855f7" },
  { key: "verifying", labelKey: "stepVerifying", icon: ShieldCheck, color: "#22c55e" },
  { key: "closed", labelKey: "stepClosed", icon: CheckCircle2, color: "#22c55e" },
]


const RECOMMENDATION_CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; labelKey: string }> = {
  containment: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.20)", labelKey: "recommendationContainment" },
  eradication: { color: "#ff4d4f", bg: "rgba(255,77,79,0.08)", border: "rgba(255,77,79,0.20)", labelKey: "recommendationEradication" },
  recovery: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.20)", labelKey: "recommendationRecovery" },
  evidence: { color: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.20)", labelKey: "recommendationEvidence" },
}


// ==================== Helper Components ====================

function StatPill({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string
  value: string | number
  tone?: "default" | "cyan" | "amber" | "emerald" | "red"
  hint?: string
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-500/20 bg-primary/10 text-primary"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
        : tone === "emerald"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
          : tone === "red"
            ? "border-red-500/20 bg-red-500/10 text-red-600"
            : "border-border bg-card text-foreground"

  return (
    <div className={cn("rounded-2xl border px-3 py-2.5", toneClass)}>
      <div className="text-[11px] opacity-80">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[10px] opacity-75">{hint}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: InvestigationStatus }) {
  const { t } = useLocaleStore()
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", cfg.color, cfg.bg, cfg.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.pulseColor, status !== "closed" && "animate-pulse")} />
      {t("cases." + cfg.labelKey)}
    </span>
  )
}

function TriggerBadge({ type }: { type: "auto" | "manual" }) {
  const { t } = useLocaleStore()
  return (
    <Badge variant="outline" className={cn("text-[8px] py-0 px-1", type === "auto" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-primary bg-primary/10 border-cyan-500/20")}>
      {type === "auto" ? t("cases.triggerAuto") : t("cases.triggerManual")}
    </Badge>
  )
}

function AssetTag({ name, type }: { name: string; type: "asset" | "account" }) {
  const color = type === "asset" ? "#22d3ee" : "#a78bfa"
  const Icon = type === "asset" ? Server : User
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono font-semibold" style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}25` }}>
      <Icon className="h-2.5 w-2.5" />
      {name}
    </span>
  )
}

function EvidenceItemCard({ item }: { item: EvidenceItem }) {
  const { t } = useLocaleStore()
  const typeCfg = EVIDENCE_TYPE_CONFIG[item.type]
  const sevCfg = SEVERITY_CONFIG[item.severity]
  const Icon = typeCfg.icon
  return (
    <div className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: `${typeCfg.color}20`, backgroundColor: `${typeCfg.color}05` }}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" style={{ color: typeCfg.color }} />
        <span className="text-[10px] font-semibold" style={{ color: typeCfg.color }}>{item.source}</span>
        <span className="ml-auto inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-medium" style={{ color: sevCfg.color, backgroundColor: sevCfg.bg }}>{t("cases." + sevCfg.labelKey)}</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{item.content}</p>
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
        <span className="font-mono">{item.timestamp.slice(-8)}</span>
        {item.ioc && (
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] font-mono" style={{ color: "#f97316", backgroundColor: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
            IOC: {item.ioc.length > 20 ? item.ioc.slice(0, 20) + ".." : item.ioc}
          </span>
        )}
      </div>
    </div>
  )
}

function PersonProfileCard({ profile }: { profile: PersonProfile }) {
  const { t } = useLocaleStore()
  const wsCfg = WORK_STATUS_CONFIG[profile.workStatus]
  return (
    <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.03] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <UserCircle className="h-4 w-4 text-cyan-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600/70">关联人员</span>
      </div>
      <div className="rounded-md border border-border bg-background p-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-foreground" style={{ backgroundColor: `${wsCfg.color}25`, color: wsCfg.color }}>
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">{profile.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{profile.department} · {profile.jobTitle}({profile.level})</span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: wsCfg.color }} />
                <span className="text-[10px]" style={{ color: wsCfg.color }}>{t("cases." + wsCfg.labelKey)}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] pt-1 border-t border-border/50">
          <span className="text-slate-400">工号 <span className="text-muted-foreground font-mono ml-1">{profile.employeeId}</span></span>
          <span className="text-slate-400">位置 <span className="text-muted-foreground ml-1">{profile.location}</span></span>
          <span className="text-slate-400">风险分 <span className={cn("font-mono tabular-nums ml-1", profile.riskScore >= 60 ? "text-red-600" : profile.riskScore >= 30 ? "text-amber-600" : "text-cyan-600")}>{profile.riskScore}</span></span>
          <span className="text-slate-400">在线设备 <span className="text-muted-foreground font-mono tabular-nums ml-1">{profile.deviceCount}</span></span>
        </div>
      </div>
    </div>
  )
}

function BaselineDeviationCard({ deviation }: { deviation: BaselineDeviation }) {
  const { t } = useLocaleStore()
  const devCfg = DEVIATION_CONFIG[deviation.deviationDegree]
  return (
    <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-amber-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">基线偏差</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground min-w-[60px]">{deviation.metric}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground line-clamp-1">{deviation.normalValue}</span>
          <MoveRight className="h-3 w-3 text-amber-600/50" />
          <span className={cn("text-[10px] font-medium line-clamp-1", devCfg.color)}>{deviation.actualValue}</span>
          <span className="inline-flex items-center rounded px-1 py-[1px] text-[8px] font-medium ml-auto shrink-0" style={{ color: devCfg.color, backgroundColor: `${devCfg.color}15` }}>{t("cases." + devCfg.labelKey)}</span>
        </div>
      </div>
    </div>
  )
}

function MITREMappingCard({ mapping }: { mapping: MITREMapping }) {
  return (
    <div className="rounded-lg border border-purple-500/15 bg-purple-500/[0.03] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-purple-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600/70">MITRE ATT&CK</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-muted-foreground">{mapping.tactic}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-mono text-[11px] font-bold text-purple-600">{mapping.techniqueId}</span>
        <span className="text-[11px] text-muted-foreground">{mapping.techniqueName}</span>
      </div>
    </div>
  )
}

function CorrelationCard({ corr }: { corr: CorrelationDetail }) {
  const { t } = useLocaleStore()
  const strCfg = CORRELATION_STRENGTH_CONFIG[corr.strength]
  return (
    <div className="rounded-md border border-border bg-background p-2 flex items-start gap-2">
      <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-600/60 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-medium text-cyan-600/80">{corr.relatedSystem}</span>
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-medium" style={{ color: strCfg.color, backgroundColor: `${strCfg.color}12` }}>{t("cases." + strCfg.labelKey)}</span>
        </div>
        <p className="text-[9px] text-muted-foreground leading-relaxed">{corr.description}</p>
      </div>
    </div>
  )
}

function RichReasoningStepCard({ step, index }: { step: AIReasoningStep; index: number }) {
  const { t } = useLocaleStore()
  const cfg = STEP_TYPE_CONFIG[step.type]
  const Icon = cfg.icon
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3" style={{ background: `linear-gradient(90deg, ${cfg.color === "text-cyan-600" ? "#06b6d4" : cfg.color === "text-amber-600" ? "#fbbf24" : "#ff4d4f"}08, var(--card))` }}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: `${cfg.color === "text-cyan-600" ? "#06b6d4" : cfg.color === "text-amber-600" ? "#fbbf24" : "#ff4d4f"}40`, backgroundColor: `${cfg.color === "text-cyan-600" ? "#06b6d4" : cfg.color === "text-amber-600" ? "#fbbf24" : "#ff4d4f"}15` }}>
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        <span className="text-xs font-semibold text-foreground">{t("cases.stepLabel")} {index + 1}：{t("cases." + cfg.labelKey)}</span>
        <span className="font-mono text-[10px] text-muted-foreground ml-auto">{step.time}</span>
        {step.confidenceContribution > 0 && (
          <span className={cn("inline-flex items-center text-[10px] font-mono tabular-nums font-semibold", step.confidenceContribution >= 30 ? "text-red-600" : step.confidenceContribution >= 20 ? "text-amber-600" : "text-cyan-600")}>
            +{step.confidenceContribution}%
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm text-foreground leading-relaxed font-medium">{step.detail}</p>
        {step.reasoning && (
          <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.03] p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Brain className="h-3.5 w-3.5 text-cyan-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600/70">推理逻辑</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.reasoning}</p>
          </div>
        )}
        {step.personProfile && <PersonProfileCard profile={step.personProfile} />}
        {step.baselineDeviation && <BaselineDeviationCard deviation={step.baselineDeviation} />}
        {step.mitreMapping && <MITREMappingCard mapping={step.mitreMapping} />}
        {step.correlations && step.correlations.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-cyan-600/60" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">跨系统关联 ({step.correlations.length}条)</span>
            </div>
            <div className="space-y-1.5">
              {step.correlations.map((corr, cIdx) => <CorrelationCard key={cIdx} corr={corr} />)}
            </div>
          </div>
        )}
        {step.evidence && step.evidence.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FileSearch className="h-3.5 w-3.5 text-amber-600/70" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">证据链 ({step.evidence.length}条)</span>
            </div>
            <div className="space-y-1.5">
              {step.evidence.map((item, eIdx) => <EvidenceItemCard key={eIdx} item={item} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Closure Workflow ====================

function ClosureWorkflow({ status }: { status: InvestigationStatus }) {
  const { t } = useLocaleStore()
  const statusOrder: InvestigationStatus[] = ["investigating", "pending_review", "disposing", "closed"]
  const currentIdx = statusOrder.indexOf(status)

  return (
    <div className="flex items-center gap-0 w-full">
      {CLOSURE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx || (idx === 4 && status === "closed")
        const isCurrent = (idx < 4 && idx === currentIdx) || (idx === 3 && status === "disposing")
        const StepIcon = step.icon

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 min-w-[48px]">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted ? "border-emerald-500 bg-emerald-500/15" : isCurrent ? "border-primary bg-primary/15" : "border-border bg-muted/50"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <StepIcon className={cn("h-3.5 w-3.5", isCurrent ? "text-primary" : "text-muted-foreground/50")} />
                )}
              </div>
              <span className={cn("text-[9px] font-medium whitespace-nowrap", isCompleted ? "text-emerald-600" : isCurrent ? "text-primary" : "text-muted-foreground/50")}>
                {t("cases." + step.labelKey)}
              </span>
            </div>
            {idx < CLOSURE_STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-1 mt-[-14px]", isCompleted ? "bg-emerald-500/40" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ==================== Disposal Recommendations ====================

function DisposalRecommendationsPanel({ record }: { record: InvestigationRecord }) {
  const { t } = useLocaleStore()
  const recommendations = record.disposalRecommendations || []
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set())
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set(
    (record.disposalActions || []).map(a => a.action)
  ))

  if (recommendations.length === 0 && !record.disposalSuggestion) return null

  const handleExecute = (label: string) => {
    setExecutingActions(prev => new Set(prev).add(label))
    setTimeout(() => {
      setExecutingActions(prev => {
        const next = new Set(prev)
        next.delete(label)
        return next
      })
      setCompletedActions(prev => new Set(prev).add(label))
    }, 1500)
  }

  const priorityConfig: Record<string, { color: string; labelKey: string }> = {
    critical: { color: "#ff4d4f", labelKey: "priorityCritical" },
    high: { color: "#f97316", labelKey: "priorityHigh" },
    medium: { color: "#fbbf24", labelKey: "priorityMedium" },
    low: { color: "#1677ff", labelKey: "priorityLow" },
  }

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-semibold text-foreground">处置建议</span>
        <span className="text-[10px] text-muted-foreground ml-1">AI基于调查结论自动生成</span>
      </div>

      {record.disposalSuggestion && (
        <div className="rounded-lg border border-cyan-500/20 bg-primary/10 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3 text-cyan-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600/70">AI综合建议</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{record.disposalSuggestion}</p>
        </div>
      )}

      <div className="space-y-2.5">
        {recommendations.map((rec, idx) => {
          const catCfg = RECOMMENDATION_CATEGORY_CONFIG[rec.category]
          const priCfg = priorityConfig[rec.priority]
          const RecIcon = rec.icon
          const isExecuting = executingActions.has(rec.label)
          const isCompleted = completedActions.has(rec.label)
          const isDisabled = record.status === "closed" || isExecuting || isCompleted

          return (
            <div
              key={idx}
              className={cn(CARD.base, "p-3.5 hover:border-orange-500/15 transition-all duration-200", isCompleted && "opacity-70")}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5"
                  style={{ backgroundColor: catCfg.bg, border: `1px solid ${catCfg.border}` }}
                >
                  <RecIcon className="h-4 w-4" style={{ color: catCfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{rec.label}</span>
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ backgroundColor: `${catCfg.color}15`, color: catCfg.color, border: `1px solid ${catCfg.color}30` }}
                    >
                      {t("cases." + catCfg.labelKey)}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ backgroundColor: `${priCfg.color}15`, color: priCfg.color, border: `1px solid ${priCfg.color}30` }}
                    >
                      {t("cases." + priCfg.labelKey)}
                    </span>
                    {rec.aiAutomated && (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI可执行
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        已完成
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.description}</p>
                </div>

                <div className="shrink-0">
                  <Button
                    size="xs"
                    className={cn(
                      "gap-1",
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/15"
                        : "bg-cyan-600 text-foreground hover:bg-cyan-700"
                    )}
                    disabled={isDisabled}
                    onClick={() => handleExecute(rec.label)}
                  >
                    {isExecuting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    {isExecuting ? "执行中" : isCompleted ? "已完成" : "执行处置"}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== Disposal Timeline ====================

function DisposalTimeline({ record }: { record: InvestigationRecord }) {
  const actions = record.disposalActions || []
  if (actions.length === 0) return null

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-foreground">处置时间线</span>
        <span className="text-[10px] text-muted-foreground ml-1">
          {record.disposalMethod === "ai_auto" ? "AI自动执行" : "人工执行"} · {record.disposalExecutor}
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-purple-500/20" />
        <div className="space-y-4">
          {actions.map((action, idx) => {
            const isSuccess = action.result.startsWith("成功")
            const isRunning = action.result.startsWith("执行中") || action.result.startsWith("进行中")
            const isWaiting = action.result.startsWith("等待")
            const dotColor = isSuccess ? "#22c55e" : isRunning ? "#a855f7" : isWaiting ? "#fbbf24" : "#ff4d4f"

            return (
              <div key={idx} className="relative flex items-start gap-4 pl-8">
                <div
                  className="absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border"
                  style={{ backgroundColor: `${dotColor}20`, borderColor: dotColor }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground/60">{action.time}</span>
                    <span className="text-xs font-medium text-foreground">{action.action}</span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${dotColor}15`,
                        color: dotColor,
                        border: `1px solid ${dotColor}30`,
                      }}
                    >
                      {isRunning && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                      {action.result}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CaseStatusChip({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  count: number
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {label}
      <span className="rounded-full bg-background px-1.5 py-0.5 font-mono text-[10px]">{count}</span>
    </button>
  )
}

function CaseDossierPanel({
  record,
  onFeedback,
  selectedStepIndex,
  setSelectedStepIndex,
}: {
  record: InvestigationRecord
  onFeedback: (rating: "thumbs_up" | "thumbs_down") => void
  selectedStepIndex: number
  setSelectedStepIndex: (index: number) => void
}) {
  const safeSelectedStepIndex = Math.min(selectedStepIndex, record.aiReasoningSteps.length - 1)
  const evidenceCount = record.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/35 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={record.status} />
                <span className="font-mono text-xs text-muted-foreground">{record.id}</span>
                <TriggerBadge type={record.triggerType} />
                <span className="font-mono text-[10px] text-muted-foreground">来源事件: {record.sourceEvent.eventId}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{record.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{record.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AssetTag name={record.asset} type="asset" />
                {record.involvedAccounts?.slice(0, 3).map((account) => (
                  <AssetTag key={account} name={account} type="account" />
                ))}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-2 lg:min-w-[320px]">
              <StatPill label="AI置信度" value={`${record.confidence}%`} tone={record.confidence >= 80 ? "red" : "amber"} />
              <StatPill label="支撑证据" value={evidenceCount} tone="cyan" />
              <StatPill label="推理步骤" value={record.aiReasoningSteps.length} />
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-border bg-muted/25 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">案件闭环流程</span>
              <span className="text-[10px] text-muted-foreground ml-1">调查 → 复核 → 处置 → 验证 → 归档</span>
            </div>
            <ClosureWorkflow status={record.status} />
          </div>

          {record.aiConclusion && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold text-violet-600">AI调查摘要</span>
              </div>
              <p className="text-sm leading-6 text-foreground">{record.aiConclusion}</p>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <DisposalRecommendationsPanel record={record} />
              <DisposalTimeline record={record} />
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">案件证据链</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{record.aiReasoningSteps.length} 个步骤</span>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {record.aiReasoningSteps.map((step, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedStepIndex(idx)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left transition-colors",
                        safeSelectedStepIndex === idx
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div className="text-[10px] font-mono">步骤 {idx + 1}</div>
                      <div className="mt-1 text-xs font-medium">{step.step}</div>
                    </button>
                  ))}
                </div>
                <RichReasoningStepCard step={record.aiReasoningSteps[safeSelectedStepIndex]} index={safeSelectedStepIndex} />
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/25 p-4">
                <h3 className="text-sm font-semibold text-foreground">案卷信息</h3>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">来源系统</span><span className="text-right text-foreground">{record.sourceEvent.sourceSystemName}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">责任人</span><span className="text-right text-foreground">{record.handler || record.reviewer || "未分配"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">创建时间</span><span className="text-right font-mono text-foreground">{record.createdAt}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">更新时间</span><span className="text-right font-mono text-foreground">{record.updatedAt}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">闭环时间</span><span className="text-right font-mono text-foreground">{record.closedAt || "—"}</span></div>
                </div>
              </div>

              {record.reviewer && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-600">复核信息</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>复核人: <span className="text-foreground font-medium">{record.reviewer}</span></div>
                    <div>时间: <span className="font-mono">{record.reviewedAt}</span></div>
                    <div>意见: {record.reviewComment || "—"}</div>
                  </div>
                </div>
              )}

              {record.status === "closed" && (
                <div className="rounded-2xl border border-border bg-muted/25 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">处置反馈</span>
                    {record.feedback?.rating && (
                      <span className={cn("text-xs font-medium", record.feedback.rating === "thumbs_up" ? "text-emerald-600" : "text-red-600")}>
                        {record.feedback.rating === "thumbs_up" ? "好评" : "差评"}
                      </span>
                    )}
                  </div>
                  {record.feedback?.comment && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">&ldquo;{record.feedback.comment}&rdquo;</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10" onClick={() => onFeedback("thumbs_up")}>
                      <ThumbsUp className="h-3.5 w-3.5" />
                      好评
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-red-500/20 text-red-600 hover:bg-red-500/10" onClick={() => onFeedback("thumbs_down")}>
                      <ThumbsDown className="h-3.5 w-3.5" />
                      差评
                    </Button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </Card>
    </div>
  )
}

function CaseDetailDialog({
  open,
  onOpenChange,
  record,
  onFeedback,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: InvestigationRecord | null
  onFeedback: (rating: "thumbs_up" | "thumbs_down") => void
}) {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0)

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-[1180px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{record.title}</DialogTitle>
          <DialogDescription>{record.description}</DialogDescription>
        </DialogHeader>
        <CaseDossierPanel
          record={record}
          selectedStepIndex={selectedStepIndex}
          setSelectedStepIndex={setSelectedStepIndex}
          onFeedback={onFeedback}
        />
      </DialogContent>
    </Dialog>
  )
}

// ==================== Feedback Dialog ====================

function FeedbackDialog({
  open,
  onOpenChange,
  rating,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rating: "thumbs_up" | "thumbs_down"
  onSubmit?: (data: { feedbackType: string; comment: string }) => void
}) {
  const { t } = useLocaleStore()
  const [feedbackType, setFeedbackType] = useState("")
  const [comment, setComment] = useState("")
  const isPositive = rating === "thumbs_up"

  const filteredOptions = FEEDBACK_TYPE_OPTIONS.filter((opt) =>
    isPositive ? opt.value.includes("correct") || opt.value.includes("effective") : opt.value.includes("wrong") || opt.value.includes("ineffective")
  )

  const handleSubmit = () => {
    if (!feedbackType) return
    if (onSubmit) onSubmit({ feedbackType, comment })
    setFeedbackType("")
    setComment("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: isPositive ? "#22c55e15" : "#ff4d4f15" }}>
              {isPositive ? <ThumbsUp className="size-4 text-emerald-600" /> : <ThumbsDown className="size-4 text-red-600" />}
            </div>
            {isPositive ? "好评反馈" : "差评反馈"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isPositive ? "请选择您认可的具体方面" : "请告诉我们哪里有问题"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">反馈类型 <span className="text-red-600">*</span></span>
            <div className="grid grid-cols-1 gap-2">
              {filteredOptions.map((opt) => {
                const color = FEEDBACK_TYPE_COLORS[opt.value]
                const isSelected = feedbackType === opt.value
                return (
                  <button key={opt.value} onClick={() => setFeedbackType(opt.value)}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors"
                    style={{ borderColor: isSelected ? `${color}60` : "var(--border)", backgroundColor: isSelected ? `${color}12` : "var(--muted)" }}
                  >
                    <div className="flex size-4 items-center justify-center rounded-full border" style={{ borderColor: isSelected ? color : "var(--border)", backgroundColor: isSelected ? color : "transparent" }}>
                      {isSelected && <div className="size-1.5 rounded-full bg-card" />}
                    </div>
                    <span style={{ color: isSelected ? color : "var(--muted-foreground)" }}>{t("cases." + opt.labelKey)}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">补充说明</span>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="可选：补充说明..."
              className="min-h-[80px] bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-primary/20 resize-none text-xs" />
          </div>
          <Button onClick={handleSubmit} disabled={!feedbackType}
            className="w-full h-9 font-semibold gap-2 bg-cyan-600 hover:bg-cyan-700 text-foreground shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPositive ? <ThumbsUp className="size-3.5" /> : <ThumbsDown className="size-3.5" />}
            提交反馈
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Page ====================

import { usePageTitle } from "@/hooks/use-page-title"

export default function CasesPage() {
  usePageTitle("cases")
  const { t } = useLocaleStore()
  const records = useWorkbenchBridgeStore((s) => s.investigationRecords)
  const initializeRecords = useWorkbenchBridgeStore((s) => s.initializeRecords)
  const [selectedRecord, setSelectedRecord] = useState<InvestigationRecord | null>(null)
  const [activeTab, setActiveTab] = useState<InvestigationTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<"thumbs_up" | "thumbs_down" | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    initializeRecords()
  }, [initializeRecords])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: records.length }
    TABS.forEach(tab => {
      if (tab.value !== "all") {
        counts[tab.value] = records.filter(r => r.status === tab.value).length
      }
    })
    return counts
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (activeTab !== "all" && record.status !== activeTab) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return record.title.toLowerCase().includes(q) || record.id.toLowerCase().includes(q) ||
          record.asset.toLowerCase().includes(q) || record.description.toLowerCase().includes(q) ||
          record.sourceEvent.eventId.toLowerCase().includes(q) ||
          record.sourceEvent.sourceSystemName.toLowerCase().includes(q)
      }
      return true
    })
  }, [activeTab, records, searchQuery])

  const totalCount = records.length
  const investigatingCount = records.filter(r => r.status === "investigating").length
  const reviewCount = records.filter(r => r.status === "pending_review").length
  const disposingCount = records.filter(r => r.status === "disposing").length
  const closedCount = records.filter(r => r.status === "closed").length
  const avgConfidence = Math.round(records.reduce((sum, r) => sum + r.confidence, 0) / Math.max(records.length, 1))

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, pageSize, safePage])

  const openRecord = (record: InvestigationRecord) => {
    setSelectedRecord(record)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="案件管理"
        subtitle="案件是已确认需要正式跟进、协同处置、复盘和归档的安全事件。"
        icon={FileCheck}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                toast("正在导出案卷...", "info")
                setTimeout(() => toast("案卷已导出", "success"), 2000)
              }}
            >
              <ArrowUpRight className="size-3.5" />
              导出案卷
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatPill label="全部案件" value={totalCount} hint={`${closedCount} 个已归档`} />
        <StatPill label="调查中" value={investigatingCount} tone="cyan" />
        <StatPill label="待复核" value={reviewCount} tone="amber" />
        <StatPill label="处置中" value={disposingCount} tone="red" />
        <StatPill label="平均置信度" value={`${avgConfidence}%`} tone="emerald" />
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {TABS.map((tab) => (
              <CaseStatusChip
                key={tab.value}
                active={activeTab === tab.value}
                count={tabCounts[tab.value] || 0}
                icon={tab.icon}
                label={t("cases." + tab.labelKey)}
                onClick={() => {
                  setActiveTab(tab.value)
                  setCurrentPage(1)
                }}
              />
            ))}
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索案件标题、编号、资产..."
              aria-label="搜索案件"
              name="search"
              autoComplete="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className={`h-9 pl-9 text-sm ${inputClass}`}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">暂无匹配的案件记录</p>
            <p className="mt-1 text-xs text-muted-foreground">尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">案件</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">状态</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">来源告警/事件</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">关联资产</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">责任人</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">置信度</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">证据</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">更新时间</th>
                    <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => {
                    const evidenceCount = record.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)
                    return (
                      <tr
                        key={record.id}
                        className="group border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0 cursor-pointer"
                        onClick={() => openRecord(record)}
                      >
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md ring-1 bg-emerald-400/10 border-emerald-400/20 ring-emerald-400/20">
                              <FileCheck className="size-3.5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground max-w-[280px]">{record.title}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{record.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="text-xs text-foreground">{record.sourceEvent.sourceSystemName}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{record.sourceEvent.eventId}</div>
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <AssetTag name={record.asset} type="asset" />
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-muted-foreground">
                          {record.handler || record.reviewer || "未分配"}
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <span className={cn("font-mono text-xs font-semibold tabular-nums", record.confidence >= 80 ? "text-red-600" : record.confidence >= 60 ? "text-amber-600" : "text-primary")}>
                            {record.confidence}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <GitBranch className="size-3" />
                            <span>{record.aiReasoningSteps.length} 步</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span>{evidenceCount} 证据</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {record.updatedAt}
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end">
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`查看案件 ${record.id}`}
                              className="text-emerald-600/70 hover:text-emerald-600 hover:bg-emerald-400/10"
                              onClick={(event) => {
                                event.stopPropagation()
                                openRecord(record)
                              }}
                            >
                              <Eye className="size-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              totalItems={filteredRecords.length}
              pageSize={pageSize}
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              resultsLabel="案件"
              perPageLabel="每页显示"
            />
          </>
        )}
      </div>

      <CaseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        record={selectedRecord}
        onFeedback={(rating) => {
          setFeedbackRating(rating)
          setShowFeedbackDialog(true)
        }}
      />

      {feedbackRating && (
        <FeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          rating={feedbackRating}
        />
      )}
    </div>
  )
}
