"use client"

import { useState, useMemo } from "react"
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
  Plus,
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
  ArrowLeft,
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
import { inputClass, pageCardClass } from "@/lib/admin-ui"
import { useLocaleStore } from "@/store/locale-store"
import { useMockDataStore } from "@/store/mock-data-store"
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
  mockRecords,
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
        <span className="text-[10px] text-muted-foreground ml-1">AI基于研判结论自动生成</span>
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

// ==================== Case List Item ====================

function CaseListItem({
  record,
  selected,
  onSelect,
}: {
  record: InvestigationRecord
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary/25 bg-primary/10 ring-1 ring-primary/15"
          : "border-border bg-card hover:border-border hover:bg-muted"
      )}
    >
      <div className="flex items-center gap-2">
        <StatusBadge status={record.status} />
        <span className="text-[10px] font-mono text-muted-foreground">{record.id}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{record.updatedAt.slice(11, 16)}</span>
      </div>
      <div className="mt-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">{record.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{record.description}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <AssetTag name={record.asset} type="asset" />
        <span className="truncate text-[11px] text-muted-foreground">{record.sourceEvent.sourceSystemName}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">置信度</span>
          <span className={cn("text-xs font-semibold tabular-nums", record.confidence >= 80 ? "text-red-600" : record.confidence >= 60 ? "text-amber-600" : "text-primary")}>
            {record.confidence}%
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{record.aiReasoningSteps.length} 步</span>
      </div>
    </button>
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
  const storeTickets = useMockDataStore((s) => s.tickets)
  const storeAlerts = useMockDataStore((s) => s.alerts)
  const [selectedRecord, setSelectedRecord] = useState<InvestigationRecord | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<InvestigationTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<"thumbs_up" | "thumbs_down" | null>(null)
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false)
  const { toast } = useToast()

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockRecords.length }
    TABS.forEach(tab => {
      if (tab.value !== "all") {
        counts[tab.value] = mockRecords.filter(r => r.status === tab.value).length
      }
    })
    return counts
  }, [])

  const filteredRecords = useMemo(() => {
    return mockRecords.filter(record => {
      if (activeTab !== "all" && record.status !== activeTab) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return record.title.toLowerCase().includes(q) || record.id.toLowerCase().includes(q) ||
          record.asset.toLowerCase().includes(q) || record.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [activeTab, searchQuery])

  const totalCount = storeTickets.length
  const investigatingCount = storeTickets.filter(t => t.status === "in_progress").length
  const reviewCount = storeTickets.filter(t => t.status === "open").length
  const disposingCount = storeTickets.filter(t => t.status === "resolved").length
  const closedCount = storeTickets.filter(t => t.status === "closed").length
  const scoredAlerts = storeAlerts.filter(a => a.aiScore != null)
  const avgConfidence = scoredAlerts.length > 0
    ? Math.round(scoredAlerts.reduce((sum, a) => sum + (a.aiScore ?? 0), 0) / scoredAlerts.length)
    : 0

  const visibleSelectedRecord = selectedRecord ? filteredRecords.find(r => r.id === selectedRecord.id) ?? null : null
  const previewRecord = filteredRecords[0] ?? null
  const activeRecord = visibleSelectedRecord ?? previewRecord ?? null
  const safeSelectedStepIndex = activeRecord ? Math.min(selectedStepIndex, activeRecord.aiReasoningSteps.length - 1) : 0

  return (
    <div className="min-h-screen">
      <PageHeader
        title="案件分析与处置"
        subtitle="AI驱动的安全事件调查、处置与闭环管理"
        icon={Brain}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted/50"
              onClick={() => {
                toast("正在导出简报...", "info")
                setTimeout(() => toast("简报已导出", "success"), 2000)
              }}
            >
              <ArrowUpRight className="mr-1 h-4 w-4" />
              导出简报
            </Button>
            <Button className="bg-cyan-600 text-foreground hover:bg-cyan-700"
              onClick={() => setShowNewCaseDialog(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              新建案件
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1560px] pb-8 pt-4 space-y-5">
        {/* Stats Row */}
        <div className="grid gap-4 xl:grid-cols-[1.6fr_0.95fr]">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-lg">
            <div className="flex flex-col gap-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI案件分析与处置闭环
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">从研判到闭环，一站完成</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    集成AI研判、处置建议、执行操作与闭环验证于统一工作流，让安全事件从发现到闭环不再割裂。
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-4 xl:max-w-4xl">
                  <StatPill label="全部案件" value={totalCount} hint={`${investigatingCount} 研判中 / ${reviewCount} 待复核 / ${disposingCount} 处置中 / ${closedCount} 已闭环`} />
                  <StatPill label="研判中" value={investigatingCount} tone="cyan" />
                  <StatPill label="处置中" value={disposingCount} tone="amber" />
                  <StatPill label="平均置信度" value={`${avgConfidence}%`} tone="emerald" hint={`已闭环 ${closedCount} 条`} />
                </div>
              </div>
            </div>
          </div>

          <div className={cn(pageCardClass, "p-5")}>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">筛选与状态</span>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索案件标题、编号、资产..."
                  aria-label="搜索案件"
                  name="search"
                  autoComplete="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-11 pl-9 text-sm ${inputClass}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TABS.map((tab) => {
                  const active = activeTab === tab.value
                  const TabIcon = tab.icon
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTab(tab.value)}
                      className={cn(
                        "flex min-h-16 flex-col items-start justify-between rounded-2xl border px-3 py-3 text-left transition-colors",
                        active ? "border-primary/25 bg-primary/10 ring-1 ring-primary/15" : "border-border bg-card hover:border-border hover:bg-muted"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        {TabIcon && <TabIcon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-mono", active ? "bg-background text-primary" : "bg-muted/50 text-muted-foreground")}>
                          {tabCounts[tab.value] || 0}
                        </span>
                      </div>
                      <span className={cn("text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>{t("cases." + tab.labelKey)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: List + Detail */}
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          {/* Case List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground">案件池</h3>
              <span className="rounded-full bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">{filteredRecords.length} 条</span>
            </div>
            <div className="space-y-3">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <CaseListItem
                  key={record.id}
                  record={record}
                  selected={activeRecord?.id === record.id}
                  onSelect={() => {
                    setSelectedRecord(record)
                    setSelectedStepIndex(0)
                  }}
                />
              )) : (
                <div className={cn(pageCardClass, "flex min-h-[320px] flex-col items-center justify-center py-20 text-muted-foreground")}>
                  <Inbox className="mb-3 h-12 w-12 opacity-40" />
                  <p className="text-sm">暂无匹配的案件记录</p>
                </div>
              )}
            </div>
          </div>

          {/* Case Detail */}
          {activeRecord ? (
            <div className="space-y-3">
              <Card className="overflow-hidden border-border bg-card shadow-lg">
                {/* Header */}
                <div className="border-b border-border bg-muted/50 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={activeRecord.status} />
                      <span className="text-sm font-mono text-muted-foreground">{activeRecord.id}</span>
                      <TriggerBadge type={activeRecord.triggerType} />
                      {selectedRecord && (
                        <button
                          type="button"
                          onClick={() => { setSelectedRecord(null); setSelectedStepIndex(0) }}
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          返回自动预览
                        </button>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 shrink">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{activeRecord.title}</h2>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <AssetTag name={activeRecord.asset} type="asset" />
                          {activeRecord.involvedAccounts?.slice(0, 2).map((account) => (
                            <AssetTag key={account} name={account} type="account" />
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <StatPill label="AI置信度" value={`${activeRecord.confidence}%`} tone={activeRecord.confidence >= 80 ? "red" : "amber"} />
                        <StatPill label="支撑证据" value={activeRecord.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)} tone="cyan" />
                        <StatPill label="推理步骤" value={activeRecord.aiReasoningSteps.length} />
                      </div>
                    </div>

                    <p className="max-w-4xl text-sm leading-6 text-muted-foreground">{activeRecord.description}</p>

                    {/* Closure Workflow */}
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">闭环工作流</span>
                        <span className="text-[10px] text-muted-foreground ml-1">研判 → 复核 → 处置 → 验证 → 闭环</span>
                      </div>
                      <ClosureWorkflow status={activeRecord.status} />
                    </div>

                    {/* AI Conclusion */}
                    {activeRecord.aiConclusion && (
                      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-violet-600" />
                          <span className="text-xs font-semibold text-violet-600">AI研判摘要</span>
                        </div>
                        <p className="text-sm leading-6 text-foreground">{activeRecord.aiConclusion}</p>
                      </div>
                    )}

                    {/* Review Info */}
                    {activeRecord.reviewer && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-600">复核信息</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>复核人: <span className="text-foreground font-medium">{activeRecord.reviewer}</span></span>
                          <span>时间: <span className="font-mono">{activeRecord.reviewedAt}</span></span>
                          <span>结果: <span className={cn("font-medium", activeRecord.reviewAction === "approve" ? "text-emerald-600" : activeRecord.reviewAction === "modify" ? "text-amber-600" : "text-red-600")}>
                            {activeRecord.reviewAction === "approve" ? "批准" : activeRecord.reviewAction === "modify" ? "修正" : "驳回"}
                          </span></span>
                          {activeRecord.reviewComment && <span>意见: {activeRecord.reviewComment}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                  {/* Closed case conclusion */}
                  {activeRecord.status === "closed" && activeRecord.closeReason && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-600">闭环结论</span>
                      </div>
                      <p className="text-sm leading-6 text-foreground">{activeRecord.closeReason}</p>
                      {activeRecord.closedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">闭环时间: <span className="font-mono">{activeRecord.closedAt}</span></p>
                      )}
                    </div>
                  )}

                  {/* Disposal Recommendations */}
                  <DisposalRecommendationsPanel record={activeRecord} />

                  {/* Disposal Timeline */}
                  <DisposalTimeline record={activeRecord} />

                  {/* Evidence Chain */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">完整证据链</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activeRecord.aiReasoningSteps.length} 个推理步骤，当前聚焦第 {safeSelectedStepIndex + 1} 步</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeRecord.aiReasoningSteps.map((step, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedStepIndex(idx)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left transition-colors",
                            selectedStepIndex === idx
                              ? "border-primary/25 bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                          )}
                        >
                          <div className="text-[10px] font-mono">步骤 {idx + 1}</div>
                          <div className="mt-1 text-xs font-medium">{step.step}</div>
                        </button>
                      ))}
                    </div>
                    <RichReasoningStepCard
                      step={activeRecord.aiReasoningSteps[safeSelectedStepIndex]}
                      index={safeSelectedStepIndex}
                    />
                  </div>

                  {/* Feedback Section for closed cases */}
                  {activeRecord.status === "closed" && (
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">处置反馈</span>
                          {activeRecord.feedback?.rating && (
                            <span className={cn("text-xs font-medium", activeRecord.feedback.rating === "thumbs_up" ? "text-emerald-600" : "text-red-600")}>
                              {activeRecord.feedback.rating === "thumbs_up" ? "好评" : "差评"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => { setFeedbackRating("thumbs_up"); setShowFeedbackDialog(true) }}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            好评
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-red-500/20 text-red-600 hover:bg-red-500/10"
                            onClick={() => { setFeedbackRating("thumbs_down"); setShowFeedbackDialog(true) }}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            差评
                          </Button>
                        </div>
                      </div>
                      {activeRecord.feedback?.comment && (
                        <p className="mt-2 text-xs text-muted-foreground">&ldquo;{activeRecord.feedback.comment}&rdquo;</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <div className={cn(pageCardClass, "flex min-h-[720px] flex-col items-center justify-center p-10 text-center text-muted-foreground")}>
              <Brain className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm">暂无可展示的案件详情</p>
            </div>
          )}
        </div>
      </div>

      {feedbackRating && (
        <FeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          rating={feedbackRating}
        />
      )}

      <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Plus className="size-4 text-cyan-600" />
              新建案件
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              创建新的安全事件调查案件
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">案件标题 <span className="text-red-600">*</span></span>
              <Input placeholder="请输入案件标题" className="bg-card border-border text-foreground placeholder:text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">案件描述</span>
              <Textarea placeholder="请输入案件描述..." className="min-h-[80px] bg-card border-border text-foreground placeholder:text-muted-foreground/50 resize-none text-xs" />
            </div>
            <Button
              className="w-full h-9 font-semibold gap-2 bg-cyan-600 hover:bg-cyan-700 text-foreground shadow-sm"
              onClick={() => {
                toast("案件创建成功", "success")
                setShowNewCaseDialog(false)
              }}
            >
              创建案件
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
