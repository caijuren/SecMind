"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Brain,
  Link2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Activity,
  ClipboardList,
  Wrench,
  Zap,
  Sparkles,
  FileSearch,
  BarChart3,
  Target,
  ArrowRight,
  ArrowRightLeft,
  UserCircle,
  GitBranch,
  CircleDot,
  Workflow,
  Loader2,
  Play,
  ShieldCheck,
  Crosshair,
  Monitor,
  Wifi,
  Lock,
  Mail,
  Globe,
  Filter,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { CARD } from "@/lib/design-system"
import { usePageTitle } from "@/hooks/use-page-title"
import { RISK_CONFIG, type RiskLevel } from "@/lib/risk-config"
import { useWorkbenchBridgeStore } from "@/store/workbench-bridge-store"
import type { LiveSignal, SignalSource, AIPreprocess } from "@/store/unified-data-store"
import {
  type InvestigationRecord,
  type InvestigationStatus,
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
} from "@/data/investigations"

// ==================== Constants ====================

const SIGNAL_LIST_STORAGE_KEY = "secmind_signal_list"

const SOURCE_CONFIG: Record<SignalSource, { icon: typeof Activity; color: string; bg: string }> = {
  EDR: { icon: Monitor, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  VPN: { icon: Wifi, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  IAM: { icon: Lock, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  Email: { icon: Mail, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  Firewall: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  DNS: { icon: Globe, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
}

const PREPROCESS_CONFIG: Record<AIPreprocess, { color: string; icon: typeof Brain; label: string }> = {
  "去噪": { color: "text-primary", icon: Filter, label: "去噪" },
  "聚合": { color: "text-amber-600", icon: Layers, label: "聚合" },
  "上下文补全": { color: "text-purple-600", icon: Brain, label: "上下文补全" },
  "风险评分": { color: "text-red-600", icon: BarChart3, label: "风险评分" },
}

const STATUS_LABELS: Record<InvestigationStatus, string> = {
  investigating: "研判中",
  pending_review: "待复核",
  disposing: "处置中",
  closed: "已闭环",
}

const STEP_TYPE_LABELS: Record<string, string> = { discover: "发现", correlate: "关联", judge: "判断" }
const SEVERITY_LABELS: Record<string, string> = { critical: "严重", high: "高危", medium: "中危", low: "低危", info: "信息" }
const DEVIATION_LABELS: Record<string, string> = { slight: "轻微", moderate: "中等", severe: "严重", extreme: "极端" }
const CORRELATION_LABELS: Record<string, string> = { weak: "弱", moderate: "中等", strong: "强", confirmed: "已确认" }
const WORK_STATUS_LABELS: Record<string, string> = { on_duty: "在岗", off_duty: "离岗", vacation: "休假", sick_leave: "病假", business_trip: "出差", remote: "远程" }

const CLOSURE_STEPS = [
  { key: "investigating", label: "研判", icon: Brain, color: "#06b6d4" },
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

// ==================== Helper: sessionStorage ====================

function getSignalListFromStorage(): LiveSignal[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(SIGNAL_LIST_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LiveSignal[]
  } catch {
    return []
  }
}

// ==================== Sub-Components ====================

function StatusBadge({ status }: { status: InvestigationStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", cfg.color, cfg.bg, cfg.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.pulseColor, status !== "closed" && "animate-pulse")} />
      {STATUS_LABELS[status]}
    </span>
  )
}

function SourceBadge({ source }: { source: SignalSource }) {
  const config = SOURCE_CONFIG[source]
  const Icon = config.icon
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", config.bg, config.color)}>
      <Icon className="size-3" />
      {source}
    </span>
  )
}

function RiskIndicator({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium", config.bg, config.color, level === "critical" && config.glow)}>
      <span>{config.label}</span>
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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-4 space-y-3">
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

      <div className="space-y-2">
        {recommendations.map((rec, idx) => {
          const catCfg = RECOMMENDATION_CATEGORY_CONFIG[rec.category]
          const priCfg = PRIORITY_CONFIG[rec.priority]
          const RecIcon = rec.icon
          const isExecuting = executingActions.has(rec.label)
          const isCompleted = completedActions.has(rec.label)
          const isDisabled = record.status === "closed" || isExecuting || isCompleted

          return (
            <div key={idx} className={cn(CARD.base, "p-3 hover:border-orange-500/15 transition-all duration-200", isCompleted && "opacity-70")}>
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
                        : "bg-cyan-600 text-foreground hover:bg-cyan-700"
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

function DisposalTimeline({ record }: { record: InvestigationRecord }) {
  const actions = record.disposalActions || []
  if (actions.length === 0) return null

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4 space-y-3">
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

// ==================== Not Found State ====================

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/60">
        <AlertTriangle className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">信号未找到</h2>
        <p className="text-sm text-muted-foreground">无法找到对应的信号数据，可能已被清除或链接无效</p>
      </div>
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="size-4" />
        返回信号列表
      </Button>
    </div>
  )
}

// ==================== Main Page ====================

export default function SignalDetailPage() {
  usePageTitle("signals")
  const params = useParams()
  const router = useRouter()

  const signalId = params.id as string

  const bridgeStore = useWorkbenchBridgeStore()
  const signalStatusMap = useWorkbenchBridgeStore((s) => s.signalStatusMap)
  const investigationRecords = useWorkbenchBridgeStore((s) => s.investigationRecords)

  // Load signal list from sessionStorage
  const [signalList, setSignalList] = useState<LiveSignal[]>([])
  const [currentSignal, setCurrentSignal] = useState<LiveSignal | null>(null)
  const [investigation, setInvestigation] = useState<InvestigationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load signal list from sessionStorage on mount
  useEffect(() => {
    const list = getSignalListFromStorage()
    setSignalList(list)
    const found = list.find((s) => s.id === signalId) || null
    setCurrentSignal(found)
    setIsLoading(false)
  }, [signalId])

  // Find or create investigation
  useEffect(() => {
    if (!currentSignal) return

    // Check if investigation already exists
    const existingStatus = signalStatusMap[currentSignal.id]
    if (existingStatus?.investigationId) {
      const existingRecord = investigationRecords.find((r) => r.id === existingStatus.investigationId)
      if (existingRecord) {
        setInvestigation(existingRecord)
        return
      }
    }

    // Auto-create investigation
    const record = bridgeStore.createInvestigationFromSignal({
      signalId: currentSignal.id,
      source: currentSignal.source,
      sourceSystemName: currentSignal.sourceSystemName,
      classification: currentSignal.aiClassification,
      riskLevel: currentSignal.riskLevel,
      rawInput: currentSignal.rawInput,
      receivedTime: currentSignal.receivedTime,
      triggerType: currentSignal.riskLevel === "critical" || currentSignal.riskLevel === "high" ? "auto" : "manual",
    })
    setInvestigation(record)
  }, [currentSignal, signalStatusMap, investigationRecords, bridgeStore])

  // Keep investigation in sync with store
  useEffect(() => {
    if (!investigation) return
    const latest = investigationRecords.find((r) => r.id === investigation.id)
    if (latest && latest !== investigation) {
      setInvestigation(latest)
    }
  }, [investigationRecords, investigation])

  // Navigation helpers
  const currentIndex = useMemo(() => signalList.findIndex((s) => s.id === signalId), [signalList, signalId])
  const prevSignal = currentIndex > 0 ? signalList[currentIndex - 1] : null
  const nextSignal = currentIndex >= 0 && currentIndex < signalList.length - 1 ? signalList[currentIndex + 1] : null

  const handleNavigate = useCallback((signal: LiveSignal) => {
    router.push(`/signals/${signal.id}`)
  }, [router])

  const handleBack = useCallback(() => {
    router.push("/signals")
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not found state
  if (!currentSignal) {
    return (
      <div className="space-y-4">
        <PageHeader
          icon={Radio}
          title="信号研判详情"
          subtitle="信号未找到"
          actions={
            <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              返回列表
            </Button>
          }
        />
        <NotFoundState onBack={handleBack} />
      </div>
    )
  }

  const riskConfig = RISK_CONFIG[currentSignal.riskLevel]
  const ppConfig = PREPROCESS_CONFIG[currentSignal.aiPreprocess]
  const PPIcon = ppConfig.icon
  const signalStatus = signalStatusMap[currentSignal.id]
  const investigationStatus = signalStatus?.status || "new"

  return (
    <div className="space-y-5">
      {/* ==================== Page Header ==================== */}
      <PageHeader
        icon={Crosshair}
        title="信号研判详情"
        subtitle={
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">{currentSignal.id}</span>
            <span className="h-3 w-px bg-border" />
            <SourceBadge source={currentSignal.source} />
            <RiskIndicator level={currentSignal.riskLevel} />
            {investigationStatus !== "new" && investigation && (
              <>
                <span className="h-3 w-px bg-border" />
                <StatusBadge status={investigation.status} />
              </>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              返回列表
            </Button>
          </div>
        }
      />

      {/* ==================== Signal Overview Card ==================== */}
      <div className={cn(CARD.base, "overflow-hidden")}>
        <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${riskConfig.hex}, transparent)` }} />
        <div className="border-b border-border px-5 py-3.5 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: riskConfig.bgHex, border: `1px solid ${riskConfig.borderHex}` }}>
            <Radio className="size-4" style={{ color: riskConfig.hex }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground">信号概览</h2>
            <p className="text-[10px] text-muted-foreground font-mono">{currentSignal.receivedTime}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SourceBadge source={currentSignal.source} />
            <RiskIndicator level={currentSignal.riskLevel} />
            {investigation && <StatusBadge status={investigation.status} />}
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Basic info grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">来源系统</span>
              <p className="text-xs text-foreground mt-1 font-medium">{currentSignal.sourceSystemName}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">AI分类</span>
              <p className="text-xs text-foreground mt-1 font-medium">{currentSignal.aiClassification}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">AI预处理</span>
              <div className="mt-1">
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded", ppConfig.color, "bg-muted/40")}>
                  <PPIcon className="size-3" />
                  {ppConfig.label}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">研判ID</span>
              <p className="text-xs text-foreground mt-1 font-mono">{investigation?.id || "—"}</p>
            </div>
          </div>

          {/* Raw input */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">原始输入</span>
            <p className="text-[11px] text-muted-foreground font-mono leading-relaxed break-all">{currentSignal.rawInput}</p>
          </div>

          {/* Source analysis */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-3 text-amber-600" />
              <span className="text-[10px] text-amber-600/80 uppercase tracking-wider font-medium">来源分析</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{currentSignal.sourceAnalysis}</p>
          </div>

          {/* Source suggestion */}
          <div className="rounded-lg border border-cyan-500/20 bg-primary/[0.06] p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3 text-cyan-600" />
              <span className="text-[10px] text-cyan-600/80 uppercase tracking-wider font-medium">来源建议</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{currentSignal.sourceSuggestion}</p>
          </div>

          {/* AI preprocess result */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Brain className="size-3 text-violet-600" />
              <span className="text-[10px] text-violet-600/80 uppercase tracking-wider font-medium">AI预处理结果</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{currentSignal.aiPreprocessResult}</p>
          </div>
        </div>
      </div>

      {/* ==================== AI Investigation Section ==================== */}
      {investigation && (
        <div className="space-y-4">
          {/* AI Conclusion */}
          {investigation.aiConclusion && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold text-violet-600">AI研判摘要</span>
                <div className="ml-auto flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">AI置信度</div>
                    <div className={cn("text-lg font-bold tabular-nums", investigation.confidence >= 80 ? "text-red-600" : investigation.confidence >= 60 ? "text-amber-600" : "text-primary")}>
                      {investigation.confidence}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">证据数</div>
                    <div className="text-lg font-bold tabular-nums text-primary">
                      {investigation.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-6 text-foreground">{investigation.aiConclusion}</p>
            </div>
          )}

          {/* Reasoning Steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">AI推理链路</span>
              <span className="text-[10px] text-muted-foreground ml-1">{investigation.aiReasoningSteps.length} 个推理步骤</span>
              {!investigation.aiConclusion && (
                <div className="ml-auto flex items-center gap-2">
                  <ConfidenceBar value={investigation.confidence} />
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-cyan-500/20">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    研判进行中
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {investigation.aiReasoningSteps.map((step, idx) => (
                <ReasoningStepCard key={idx} step={step} index={idx} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== Disposal Section ==================== */}
      {investigation && (
        <div className="space-y-4">
          {/* Closure Workflow */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">处置工作流</span>
              <span className="text-[10px] text-muted-foreground ml-1">研判 → 复核 → 处置 → 验证 → 闭环</span>
            </div>
            <ClosureWorkflow status={investigation.status} />
          </div>

          {/* Review Info */}
          {investigation.reviewer && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-600">复核信息</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span>复核人: <span className="text-foreground font-medium">{investigation.reviewer}</span></span>
                <span>时间: <span className="font-mono">{investigation.reviewedAt}</span></span>
                <span>结果: <span className={cn("font-medium", investigation.reviewAction === "approve" ? "text-emerald-600" : investigation.reviewAction === "modify" ? "text-amber-600" : "text-red-600")}>
                  {investigation.reviewAction === "approve" ? "批准" : investigation.reviewAction === "modify" ? "修正" : "驳回"}
                </span></span>
                {investigation.reviewComment && <span>意见: {investigation.reviewComment}</span>}
              </div>
            </div>
          )}

          {/* Disposal Recommendations */}
          <DisposalRecommendationsPanel record={investigation} />

          {/* Disposal Timeline */}
          <DisposalTimeline record={investigation} />

          {/* Closure Info */}
          {investigation.closeReason ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">闭环结论</span>
              </div>
              <p className="text-sm leading-6 text-foreground">{investigation.closeReason}</p>
              {investigation.closedAt && (
                <p className="mt-2 text-xs text-muted-foreground">闭环时间: <span className="font-mono">{investigation.closedAt}</span></p>
              )}
            </div>
          ) : investigation.status !== "closed" && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">尚未闭环</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">该事件仍在处理流程中，闭环信息将在处置完成后自动生成。</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== Bottom Navigation Bar ==================== */}
      <div className="sticky bottom-0 z-10 -mx-1">
        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg px-5 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevSignal}
              onClick={() => prevSignal && handleNavigate(prevSignal)}
              className="gap-1.5 min-w-[120px]"
            >
              <ChevronLeft className="size-4" />
              上一条
              {prevSignal && (
                <span className="text-[10px] text-muted-foreground font-mono ml-1 hidden sm:inline">{prevSignal.id}</span>
              )}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                {currentIndex >= 0 ? currentIndex + 1 : "—"} / {signalList.length}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span>信号列表</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!nextSignal}
              onClick={() => nextSignal && handleNavigate(nextSignal)}
              className="gap-1.5 min-w-[120px]"
            >
              {nextSignal && (
                <span className="text-[10px] text-muted-foreground font-mono mr-1 hidden sm:inline">{nextSignal.id}</span>
              )}
              下一条
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
