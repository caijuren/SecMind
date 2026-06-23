"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Brain,
  Search,
  Shield,
  CheckCircle2,
  ArrowRight,
  Zap,
  Link2,
  User,
  Server,
  BarChart3,
  Target,
  Activity,
  Wrench,
  ThumbsUp,
  ThumbsDown,
  UserCircle,
  GitBranch,
  FileCheck,
  FileSearch,
  ArrowRightLeft,
  Play,
  Loader2,
  Workflow,
  CircleDot,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Eye,
  Download,
  AlertTriangle,
  Radio,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { CARD } from "@/lib/design-system"
import { usePageTitle } from "@/hooks/use-page-title"
import {
  type InvestigationStatus,
  type InvestigationTab,
  type InvestigationRecord,
  type AIReasoningStep,
  type EvidenceItem,
  type PersonProfile,
  type BaselineDeviation,
  type MITREMapping,
  type CorrelationDetail,
  STATUS_CONFIG,
  STEP_TYPE_CONFIG,
  EVIDENCE_TYPE_CONFIG,
  SEVERITY_CONFIG,
  DEVIATION_CONFIG,
  CORRELATION_STRENGTH_CONFIG,
  WORK_STATUS_CONFIG,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_TYPE_COLORS,
} from "@/data/investigations"
import { useWorkbenchBridgeStore } from "@/store/workbench-bridge-store"

// ==================== Constants ====================

const FILTER_TABS: { value: InvestigationTab; label: string; icon: React.ElementType; accent: string }[] = [
  { value: "all", label: "全部", icon: Activity, accent: "#06b6d4" },
  { value: "investigating", label: "调查中", icon: Brain, accent: "#06b6d4" },
  { value: "pending_review", label: "待复核", icon: ClipboardList, accent: "#fbbf24" },
  { value: "disposing", label: "处置中", icon: Wrench, accent: "#a855f7" },
  { value: "closed", label: "已闭环", icon: CheckCircle2, accent: "#22c55e" },
]

const DETAIL_TABS = [
  { key: "ai", label: "AI调查", icon: Brain },
  { key: "disposal", label: "处置执行", icon: Wrench },
  { key: "closure", label: "闭环信息", icon: CheckCircle2 },
] as const

type DetailTabKey = (typeof DETAIL_TABS)[number]["key"]

const CLOSURE_STEPS = [
  { key: "investigating", label: "调查", icon: Brain, color: "#06b6d4" },
  { key: "pending_review", label: "复核", icon: ClipboardList, color: "#fbbf24" },
  { key: "disposing", label: "处置", icon: Wrench, color: "#a855f7" },
  { key: "verifying", label: "验证", icon: ShieldCheck, color: "#22c55e" },
  { key: "closed", label: "闭环", icon: CheckCircle2, color: "#22c55e" },
]

const RECOMMENDATION_CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  containment: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.20)", label: "遏制" },
  eradication: { color: "#ff4d4f", bg: "rgba(255,77,79,0.08)", border: "rgba(255,77,79,0.20)", label: "根除" },
  recovery: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.20)", label: "恢复" },
  evidence: { color: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.20)", label: "取证" },
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: "#ff4d4f", label: "紧急" },
  high: { color: "#f97316", label: "高" },
  medium: { color: "#fbbf24", label: "中" },
  low: { color: "#06b6d4", label: "低" },
}

const STATUS_LABELS: Record<InvestigationStatus, string> = {
  investigating: "调查中",
  pending_review: "待复核",
  disposing: "处置中",
  closed: "已闭环",
}

const STEP_TYPE_LABELS: Record<string, string> = { discover: "发现", correlate: "关联", judge: "判断" }
const SEVERITY_LABELS: Record<string, string> = { critical: "严重", high: "高危", medium: "中危", low: "低危", info: "信息" }
const DEVIATION_LABELS: Record<string, string> = { slight: "轻微", moderate: "中等", severe: "严重", extreme: "极端" }
const CORRELATION_LABELS: Record<string, string> = { weak: "弱", moderate: "中等", strong: "强", confirmed: "已确认" }
const WORK_STATUS_LABELS: Record<string, string> = { on_duty: "在岗", off_duty: "离岗", vacation: "休假", sick_leave: "病假", business_trip: "出差", remote: "远程" }

// ==================== KPI Card ====================

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  unit?: string
  accent: string
  delay?: number
}

function KpiCard({ icon: Icon, label, value, unit, accent, delay = 0 }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "stagger-item relative overflow-hidden border-border bg-card shadow-sm",
        "transition-colors duration-200 hover:border-primary/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="relative p-4">
        <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(${accent}50 1px, transparent 1px), linear-gradient(90deg, ${accent}50 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md ring-1" style={{ backgroundColor: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}30` }}>
              <Icon className="size-3.5" />
            </div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
          </div>
        </div>
        <div className="relative mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-[28px] font-bold tabular-nums leading-none tracking-tight" style={{ color: accent }}>{value}</span>
          {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Status Filter Chip ====================

interface StatusChipProps {
  active: boolean
  label: string
  count: number
  icon: React.ElementType
  accent: string
  onClick: () => void
}

function StatusChip({ active, label, count, icon: Icon, accent, onClick }: StatusChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
        active
          ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="size-3" style={{ color: active ? undefined : accent }} />
      <span>{label}</span>
      <span className={cn("rounded-full px-1.5 py-px font-mono text-[10px] tabular-nums", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </button>
  )
}

// ==================== Helper Components ====================

function StatusBadge({ status }: { status: InvestigationStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", cfg.color, cfg.bg, cfg.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.pulseColor, status !== "closed" && "animate-pulse")} />
      {STATUS_LABELS[status]}
    </span>
  )
}

function TriggerBadge({ type }: { type: "auto" | "manual" }) {
  return (
    <Badge variant="outline" className={cn("text-[8px] py-0 px-1", type === "auto" ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-primary bg-primary/10 border-cyan-500/20")}>
      {type === "auto" ? "自动" : "手动"}
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

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "#ef4444" : value >= 60 ? "#f97316" : "#06b6d4"
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-xs font-bold tabular-nums min-w-[28px]" style={{ color }}>{value}%</span>
    </div>
  )
}

function EvidenceItemCard({ item }: { item: EvidenceItem }) {
  const typeCfg = EVIDENCE_TYPE_CONFIG[item.type]
  const sevCfg = SEVERITY_CONFIG[item.severity]
  const Icon = typeCfg.icon
  return (
    <div className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: `${typeCfg.color}20`, backgroundColor: `${typeCfg.color}05` }}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" style={{ color: typeCfg.color }} />
        <span className="text-[10px] font-semibold" style={{ color: typeCfg.color }}>{item.source}</span>
        <span className="ml-auto inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-medium" style={{ color: sevCfg.color, backgroundColor: sevCfg.bg }}>{SEVERITY_LABELS[item.severity]}</span>
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
                <span className="text-[10px]" style={{ color: wsCfg.color }}>{WORK_STATUS_LABELS[profile.workStatus]}</span>
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
  const devCfg = DEVIATION_CONFIG[deviation.deviationDegree]
  return (
    <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-amber-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">基线偏差</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground min-w-[60px]">{deviation.metric}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground line-clamp-1">{deviation.normalValue}</span>
          <ArrowRight className="h-3 w-3 text-amber-600/50" />
          <span className="text-[10px] font-medium line-clamp-1" style={{ color: devCfg.color }}>{deviation.actualValue}</span>
          <span className="inline-flex items-center rounded px-1 py-[1px] text-[8px] font-medium ml-auto shrink-0" style={{ color: devCfg.color, backgroundColor: `${devCfg.color}15` }}>{DEVIATION_LABELS[deviation.deviationDegree]}</span>
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
        {mapping.subTechnique && <span className="text-[10px] text-muted-foreground/60">({mapping.subTechnique})</span>}
      </div>
    </div>
  )
}

function CorrelationCard({ corr }: { corr: CorrelationDetail }) {
  const strCfg = CORRELATION_STRENGTH_CONFIG[corr.strength]
  return (
    <div className="rounded-md border border-border bg-background p-2 flex items-start gap-2">
      <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-600/60 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-medium text-cyan-600/80">{corr.relatedSystem}</span>
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-medium" style={{ color: strCfg.color, backgroundColor: `${strCfg.color}12` }}>{CORRELATION_LABELS[corr.strength]}</span>
        </div>
        <p className="text-[9px] text-muted-foreground leading-relaxed">{corr.description}</p>
      </div>
    </div>
  )
}

function ReasoningStepCard({ step, index }: { step: AIReasoningStep; index: number }) {
  const cfg = STEP_TYPE_CONFIG[step.type]
  const Icon = cfg.icon
  const stepColor = cfg.color === "text-cyan-600" ? "#06b6d4" : cfg.color === "text-amber-600" ? "#fbbf24" : "#ff4d4f"

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5" style={{ background: `linear-gradient(90deg, ${stepColor}08, var(--card))` }}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: `${stepColor}40`, backgroundColor: `${stepColor}15` }}>
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        <span className="text-xs font-semibold text-foreground">步骤 {index + 1}：{STEP_TYPE_LABELS[step.type]}</span>
        <span className="font-mono text-[10px] text-muted-foreground ml-auto">{step.time}</span>
        {step.confidenceContribution > 0 && (
          <span className={cn("inline-flex items-center text-[10px] font-mono tabular-nums font-semibold", step.confidenceContribution >= 30 ? "text-red-600" : step.confidenceContribution >= 20 ? "text-amber-600" : "text-cyan-600")}>
            +{step.confidenceContribution}%
          </span>
        )}
      </div>
      <div className="space-y-2.5 p-3.5">
        <p className="text-sm text-foreground leading-relaxed font-medium">{step.detail}</p>
        {step.reasoning && (
          <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.03] p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="h-3 w-3 text-cyan-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600/70">推理逻辑</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{step.reasoning}</p>
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
                {step.label}
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

  return (
    <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] p-4 space-y-3">
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

      <div className="space-y-2">
        {recommendations.map((rec, idx) => {
          const catCfg = RECOMMENDATION_CATEGORY_CONFIG[rec.category]
          const priCfg = PRIORITY_CONFIG[rec.priority]
          const RecIcon = rec.icon
          const isExecuting = executingActions.has(rec.label)
          const isCompleted = completedActions.has(rec.label)
          const isDisabled = record.status === "closed" || isExecuting || isCompleted

          return (
            <div key={idx} className={cn(CARD.base, "p-3 hover:border-orange-500/15 transition-colors duration-200", isCompleted && "opacity-70")}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: catCfg.bg, border: `1px solid ${catCfg.border}` }}>
                  <RecIcon className="h-4 w-4" style={{ color: catCfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{rec.label}</span>
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: `${catCfg.color}15`, color: catCfg.color, border: `1px solid ${catCfg.color}30` }}>
                      {catCfg.label}
                    </span>
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: `${priCfg.color}15`, color: priCfg.color, border: `1px solid ${priCfg.color}30` }}>
                      {priCfg.label}
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
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    disabled={isDisabled}
                    onClick={() => handleExecute(rec.label)}
                  >
                    {isExecuting ? <Loader2 className="h-3 w-3 animate-spin" /> : isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {isExecuting ? "执行中" : isCompleted ? "已完成" : "执行"}
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
    <div className="rounded-lg border border-purple-500/20 bg-purple-500/[0.04] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-foreground">处置时间线</span>
        <span className="text-[10px] text-muted-foreground ml-1">
          {record.disposalMethod === "ai_auto" ? "AI自动执行" : "人工执行"} · {record.disposalExecutor}
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-purple-500/20" />
        <div className="space-y-3">
          {actions.map((action, idx) => {
            const isSuccess = action.result.startsWith("成功")
            const isRunning = action.result.startsWith("执行中") || action.result.startsWith("进行中")
            const isWaiting = action.result.startsWith("等待")
            const dotColor = isSuccess ? "#22c55e" : isRunning ? "#a855f7" : isWaiting ? "#fbbf24" : "#ff4d4f"

            return (
              <div key={idx} className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border" style={{ backgroundColor: `${dotColor}20`, borderColor: dotColor }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground/60">{action.time}</span>
                    <span className="text-xs font-medium text-foreground">{action.action}</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${dotColor}15`, color: dotColor, border: `1px solid ${dotColor}30` }}>
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

// ==================== Feedback Dialog ====================

function FeedbackDialog({
  open,
  onOpenChange,
  rating,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rating: "thumbs_up" | "thumbs_down"
}) {
  const [feedbackType, setFeedbackType] = useState("")
  const [comment, setComment] = useState("")
  const isPositive = rating === "thumbs_up"

  const filteredOptions = FEEDBACK_TYPE_OPTIONS.filter((opt) =>
    isPositive ? opt.value.includes("correct") || opt.value.includes("effective") : opt.value.includes("wrong") || opt.value.includes("ineffective")
  )

  const handleSubmit = () => {
    if (!feedbackType) return
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
                    <span style={{ color: isSelected ? color : "var(--muted-foreground)" }}>{opt.value}</span>
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
            className="w-full h-9 font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPositive ? <ThumbsUp className="size-3.5" /> : <ThumbsDown className="size-3.5" />}
            提交反馈
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Detail Tab Panels ====================

function AIInvestigationTab({ record }: { record: InvestigationRecord }) {
  return (
    <div className="space-y-4">
      {record.aiConclusion && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-600">AI调查摘要</span>
          </div>
          <p className="text-sm leading-6 text-foreground">{record.aiConclusion}</p>
        </div>
      )}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI推理链路</span>
          <span className="text-[10px] text-muted-foreground ml-1">{record.aiReasoningSteps.length} 个推理步骤</span>
        </div>
        <div className="space-y-3">
          {record.aiReasoningSteps.map((step, idx) => (
            <ReasoningStepCard key={idx} step={step} index={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}

function DisposalTab({ record, quickActions }: { record: InvestigationRecord; quickActions?: { action: string; target: string; timestamp: string; source: string }[] }) {
  return (
    <div className="space-y-4">
      {/* Quick Actions from Signals page */}
      {quickActions && quickActions.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-600">告警页面快速响应</span>
            <span className="text-[10px] text-muted-foreground ml-1">从告警中心发起的即时处置</span>
          </div>
          <div className="space-y-1.5">
            {quickActions.map((qa, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-md border border-border/50 bg-background p-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Zap className="h-2.5 w-2.5" />
                  快速
                </span>
                <span className="font-medium text-foreground">{qa.action}</span>
                <span className="font-mono text-muted-foreground">{qa.target}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">{qa.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {record.reviewer && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-600">复核信息</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>复核人: <span className="text-foreground font-medium">{record.reviewer}</span></span>
            <span>时间: <span className="font-mono">{record.reviewedAt}</span></span>
            <span>结果: <span className={cn("font-medium", record.reviewAction === "approve" ? "text-emerald-600" : record.reviewAction === "modify" ? "text-amber-600" : "text-red-600")}>
              {record.reviewAction === "approve" ? "批准" : record.reviewAction === "modify" ? "修正" : "驳回"}
            </span></span>
            {record.reviewComment && <span>意见: {record.reviewComment}</span>}
          </div>
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">处置工作流</span>
          <span className="text-[10px] text-muted-foreground ml-1">调查 → 复核 → 处置 → 验证 → 闭环</span>
        </div>
        <ClosureWorkflow status={record.status} />
      </div>
      <DisposalRecommendationsPanel record={record} />
      <DisposalTimeline record={record} />
    </div>
  )
}

function ClosureTab({ record, onFeedback }: { record: InvestigationRecord; onFeedback: (rating: "thumbs_up" | "thumbs_down") => void }) {
  return (
    <div className="space-y-4">
      {record.closeReason ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-600">闭环结论</span>
          </div>
          <p className="text-sm leading-6 text-foreground">{record.closeReason}</p>
          {record.closedAt && (
            <p className="mt-2 text-xs text-muted-foreground">闭环时间: <span className="font-mono">{record.closedAt}</span></p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">尚未闭环</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">该事件仍在处理流程中，闭环信息将在处置完成后自动生成。</p>
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">闭环工作流</span>
        </div>
        <ClosureWorkflow status={record.status} />
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">处置反馈</span>
            {record.feedback?.rating && (
              <span className={cn("text-xs font-medium", record.feedback.rating === "thumbs_up" ? "text-emerald-600" : "text-red-600")}>
                {record.feedback.rating === "thumbs_up" ? "好评" : "差评"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10" onClick={() => onFeedback("thumbs_up")}>
              <ThumbsUp className="h-3.5 w-3.5" />
              好评
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 border-red-500/20 text-red-600 hover:bg-red-500/10" onClick={() => onFeedback("thumbs_down")}>
              <ThumbsDown className="h-3.5 w-3.5" />
              差评
            </Button>
          </div>
        </div>
        {record.feedback?.comment && (
          <p className="mt-2 text-xs text-muted-foreground">&ldquo;{record.feedback.comment}&rdquo;</p>
        )}
      </div>
    </div>
  )
}

// ==================== Event Detail Dialog ====================

function EventDetailDialog({
  record,
  open,
  onOpenChange,
  onFeedback,
  quickActions,
}: {
  record: InvestigationRecord | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onFeedback: (rating: "thumbs_up" | "thumbs_down") => void
  quickActions?: { action: string; target: string; timestamp: string; source: string }[]
}) {
  const [detailTab, setDetailTab] = useState<DetailTabKey>("ai")

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] bg-card border-border text-foreground shadow-lg flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-6 py-4 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <span className="text-sm font-mono text-muted-foreground">{record.id}</span>
            <TriggerBadge type={record.triggerType} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{record.title}</h2>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <AssetTag name={record.asset} type="asset" />
                {record.involvedAccounts?.slice(0, 2).map((account) => (
                  <AssetTag key={account} name={account} type="account" />
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">AI置信度</div>
                <div className={cn("text-lg font-bold tabular-nums", record.confidence >= 80 ? "text-red-600" : record.confidence >= 60 ? "text-amber-600" : "text-primary")}>
                  {record.confidence}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">证据数</div>
                <div className="text-lg font-bold tabular-nums text-primary">
                  {record.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)}
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-6">{record.description}</p>
          {/* Source Event Info */}
          {record.sourceEvent && (
            <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Radio className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">来源告警</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                <span className="font-mono">{record.sourceEvent.eventId}</span>
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium bg-muted/50 border border-border/50">{record.sourceEvent.source}</span>
                <span>{record.sourceEvent.sourceSystemName}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{record.sourceEvent.classification}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-[10px]">{record.sourceEvent.receivedTime}</span>
              </div>
              <p className="mt-1 text-[10px] font-mono text-muted-foreground/60 truncate">{record.sourceEvent.rawInput}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-muted/20 px-6 shrink-0">
          <div className="flex items-center gap-1">
            {DETAIL_TABS.map((tab) => {
              const TabIcon = tab.icon
              const isActive = detailTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDetailTab(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {detailTab === "ai" && <AIInvestigationTab record={record} />}
          {detailTab === "disposal" && <DisposalTab record={record} quickActions={quickActions} />}
          {detailTab === "closure" && <ClosureTab record={record} onFeedback={onFeedback} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Main Page ====================

export default function WorkbenchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <WorkbenchPageContent />
    </Suspense>
  )
}

function WorkbenchPageContent() {
  usePageTitle("workbench")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get("highlight")

  const bridgeRecords = useWorkbenchBridgeStore((s) => s.investigationRecords)
  const initializeRecords = useWorkbenchBridgeStore((s) => s.initializeRecords)
  const signalStatusMap = useWorkbenchBridgeStore((s) => s.signalStatusMap)

  const [activeFilter, setActiveFilter] = useState<InvestigationTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(() => highlightId)
  const [detailOpen, setDetailOpen] = useState(() => Boolean(highlightId))
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<"thumbs_up" | "thumbs_down">("thumbs_up")

  useEffect(() => {
    initializeRecords()
  }, [initializeRecords])

  const allRecords = useMemo(() => {
    return bridgeRecords
  }, [bridgeRecords])

  const selectedRecord = useMemo(
    () => allRecords.find((record) => record.id === selectedRecordId) ?? null,
    [allRecords, selectedRecordId],
  )

  // Stats
  const stats = useMemo(() => {
    const total = allRecords.length
    const investigating = allRecords.filter(r => r.status === "investigating").length
    const pendingReview = allRecords.filter(r => r.status === "pending_review").length
    const disposing = allRecords.filter(r => r.status === "disposing").length
    const closed = allRecords.filter(r => r.status === "closed").length
    const avgConfidence = total > 0 ? Math.round(allRecords.reduce((sum, r) => sum + r.confidence, 0) / total) : 0
    return { total, investigating, pendingReview, disposing, closed, avgConfidence }
  }, [allRecords])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      if (activeFilter !== "all" && record.status !== activeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return record.title.toLowerCase().includes(q) || record.id.toLowerCase().includes(q) ||
          record.asset.toLowerCase().includes(q) || record.description.toLowerCase().includes(q) ||
          record.sourceEvent.classification.toLowerCase().includes(q) ||
          record.sourceEvent.sourceSystemName.toLowerCase().includes(q)
      }
      return true
    })
  }, [allRecords, activeFilter, searchQuery])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, safePage, pageSize])

  const handleRowClick = (record: InvestigationRecord) => {
    setSelectedRecordId(record.id)
    setDetailOpen(true)
  }

  const handleFeedback = (rating: "thumbs_up" | "thumbs_down") => {
    setFeedbackRating(rating)
    setShowFeedbackDialog(true)
  }

  const getRiskLevelFromConfidence = (confidence: number): { label: string; color: string; bg: string; border: string } => {
    if (confidence >= 80) return { label: "严重", color: "#ef4444", bg: "bg-red-400/10", border: "border-red-400/20" }
    if (confidence >= 60) return { label: "高危", color: "#f97316", bg: "bg-orange-400/10", border: "border-orange-400/20" }
    if (confidence >= 40) return { label: "中危", color: "#fbbf24", bg: "bg-amber-400/10", border: "border-amber-400/20" }
    return { label: "低危", color: "#06b6d4", bg: "bg-cyan-400/10", border: "border-cyan-400/20" }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Brain}
        title="安全事件工作台"
        subtitle="安全事件由一个或多个告警经 AI 调查形成，用于承载分析、复核、处置和闭环。"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              toast("正在导出简报...", "info")
              setTimeout(() => toast("简报已导出", "success"), 2000)
            }}>
              <Download className="size-3.5" />
              <span className="hidden sm:inline">导出简报</span>
            </Button>
          </div>
        }
      />

      {/* ==================== KPI 指标条 ==================== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={Activity} label="全部事件" value={stats.total} accent="#06b6d4" delay={0} />
        <KpiCard icon={Brain} label="调查中" value={stats.investigating} accent="#06b6d4" delay={60} />
        <KpiCard icon={ClipboardList} label="待复核" value={stats.pendingReview} accent="#fbbf24" delay={120} />
        <KpiCard icon={Wrench} label="处置中" value={stats.disposing} accent="#a855f7" delay={180} />
        <KpiCard icon={CheckCircle2} label="已闭环" value={stats.closed} accent="#22c55e" delay={240} />
      </div>

      {/* ==================== 命令栏：状态筛选 + 搜索 ==================== */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 lg:pb-0">
            {FILTER_TABS.map((tab) => {
              const count = tab.value === "all" ? stats.total : stats[tab.value as keyof typeof stats] || 0
              return (
                <StatusChip
                  key={tab.value}
                  active={activeFilter === tab.value}
                  label={tab.label}
                  count={count}
                  icon={tab.icon}
                  accent={tab.accent}
                  onClick={() => { setActiveFilter(tab.value); setCurrentPage(1) }}
                />
              )
            })}
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索事件标题、编号、资产..."
              aria-label="搜索事件"
              name="search"
              autoComplete="search"
              className={cn("h-8 pl-9", inputClass)}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>
      </div>

      {/* ==================== 事件表格 ==================== */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">暂无匹配的事件记录</p>
            <p className="mt-1 text-xs text-muted-foreground">尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">事件</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">状态</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">触发</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">关联资产</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">置信度</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">风险等级</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">推理步骤</th>
                    <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">更新时间</th>
                    <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => {
                    const riskLevel = getRiskLevelFromConfidence(record.confidence)
                    const evidenceCount = record.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)
                    return (
                      <tr
                        key={record.id}
                        className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0 cursor-pointer"
                        onClick={() => handleRowClick(record)}
                      >
                        {/* 事件 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md ring-1 bg-violet-400/10 border-violet-400/20 ring-violet-400/20">
                              <Brain className="size-3.5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground max-w-[240px]">{record.title}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{record.id}</div>
                            </div>
                          </div>
                        </td>
                        {/* 状态 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <StatusBadge status={record.status} />
                        </td>
                        {/* 触发 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <TriggerBadge type={record.triggerType} />
                        </td>
                        {/* 关联资产 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <AssetTag name={record.asset} type="asset" />
                        </td>
                        {/* 置信度 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <ConfidenceBar value={record.confidence} />
                        </td>
                        {/* 风险等级 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", riskLevel.bg, riskLevel.border)} style={{ color: riskLevel.color }}>
                            <AlertTriangle className="size-2.5" />
                            {riskLevel.label}
                          </span>
                        </td>
                        {/* 推理步骤 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="size-3 text-muted-foreground/60" />
                            <span className="font-mono text-xs text-muted-foreground">{record.aiReasoningSteps.length} 步</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="font-mono text-[10px] text-muted-foreground/60">{evidenceCount} 证据</span>
                          </div>
                        </td>
                        {/* 更新时间 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {record.updatedAt}
                        </td>
                        {/* 操作 */}
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`查看安全事件 ${record.id}`}
                              className="text-cyan-600/70 hover:text-cyan-600 hover:bg-cyan-400/10"
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

            {/* 分页栏 */}
            <TablePagination
              totalItems={filteredRecords.length}
              pageSize={pageSize}
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
              resultsLabel="事件"
              perPageLabel="每页显示"
            />
          </>
        )}
      </div>

      {/* ==================== Event Detail Dialog ==================== */}
      <EventDetailDialog
        record={selectedRecord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFeedback={handleFeedback}
        quickActions={selectedRecord ? signalStatusMap[selectedRecord.sourceEvent?.eventId]?.quickActions : undefined}
      />

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        rating={feedbackRating}
      />
    </div>
  )
}
