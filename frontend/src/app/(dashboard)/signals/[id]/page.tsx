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
  Gauge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { CARD } from "@/lib/design-system"
import { usePageTitle } from "@/hooks/use-page-title"
import { RISK_CONFIG, type RiskLevel } from "@/lib/risk-config"
import { useWorkbenchBridgeStore } from "@/store/workbench-bridge-store"
import { useUnifiedDataStore, type LiveSignal, type SignalSource, type AIPreprocess } from "@/store/unified-data-store"
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
const SIGNAL_DETAIL_STORAGE_PREFIX = "secmind_signal_detail:"

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

function getSignalDetailFromStorage(signalId: string): LiveSignal | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(`${SIGNAL_DETAIL_STORAGE_PREFIX}${signalId}`)
    if (!raw) return null
    return JSON.parse(raw) as LiveSignal
  } catch {
    return null
  }
}

function mergeSignalLists(primary: LiveSignal[], fallback: LiveSignal[]): LiveSignal[] {
  const seen = new Set<string>()
  const merged: LiveSignal[] = []

  for (const signal of [...primary, ...fallback]) {
    if (seen.has(signal.id)) continue
    seen.add(signal.id)
    merged.push(signal)
  }

  return merged
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

function HeaderMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="mt-1 truncate text-xs font-medium text-foreground">{value}</div>
    </div>
  )
}

function AlertIdentityPanel({
  signal,
  investigation,
}: {
  signal: LiveSignal
  investigation: InvestigationRecord | null
}) {
  const riskConfig = RISK_CONFIG[signal.riskLevel]
  return (
    <section className={cn(CARD.base, "overflow-hidden")}>
      <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${riskConfig.hex}, transparent)` }} />
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: riskConfig.bgHex, border: `1px solid ${riskConfig.borderHex}` }}>
            <Radio className="size-5" style={{ color: riskConfig.hex }} />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <RiskIndicator level={signal.riskLevel} />
              <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {signal.aiClassification}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">告警 ID: {signal.id}</span>
              {investigation && <span className="font-mono text-[10px] text-muted-foreground">安全事件 ID: {investigation.id}</span>}
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {signal.sourceSystemName} · {signal.aiClassification}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">{signal.receivedTime}</span>
              <SourceBadge source={signal.source} />
              {investigation && <StatusBadge status={investigation.status} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/25 p-3 lg:min-w-[360px]">
          <HeaderMetaItem label="来源系统" value={signal.sourceSystemName} />
          <HeaderMetaItem label="AI预处理" value={signal.aiPreprocess} />
          <HeaderMetaItem label="AI分类" value={signal.aiClassification} />
          <HeaderMetaItem label="阶段" value={investigation ? "安全事件调查中" : "告警核查"} />
        </div>
      </div>
    </section>
  )
}

function AISummaryPanel({
  signal,
  investigation,
}: {
  signal: LiveSignal
  investigation: InvestigationRecord | null
}) {
  const confidence = investigation?.confidence ?? (signal.riskLevel === "critical" ? 88 : signal.riskLevel === "high" ? 76 : signal.riskLevel === "medium" ? 58 : 34)
  return (
    <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background dark:bg-primary dark:text-primary-foreground">
              <Brain className="size-3.5" />
              {investigation ? "AI 调查结论" : "AI 预处理结论"}
            </span>
            {!investigation && (
              <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600">
                未升级为安全事件
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-6 text-foreground">
            {investigation?.aiConclusion ?? signal.aiPreprocessResult}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {investigation ? "当前告警已进入安全事件调查流程，可继续查看证据、推理、影响和处置建议。" : "当前仍处于告警核查阶段。点击“发起 AI 调查”后，会生成安全事件并进入完整调查流程。"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-lg border border-border bg-background/70 px-4 py-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">AI置信度</div>
            <div className={cn("text-xl font-bold tabular-nums", confidence >= 80 ? "text-red-600" : confidence >= 60 ? "text-amber-600" : "text-primary")}>{confidence}%</div>
          </div>
          <div className="h-9 w-px bg-border" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">证据数</div>
            <div className="text-xl font-bold tabular-nums text-primary">
              {investigation ? investigation.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0) : "—"}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type DetailSectionKey = "overview" | "ai" | "findings" | "evidence" | "reasoning" | "impact" | "response"

const DETAIL_SECTIONS: { key: DetailSectionKey; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "告警概览", icon: Radio },
  { key: "ai", label: "实时AI调查", icon: Brain },
  { key: "findings", label: "关键发现", icon: Target },
  { key: "evidence", label: "证据库", icon: FileSearch },
  { key: "reasoning", label: "推理轨迹", icon: GitBranch },
  { key: "impact", label: "影响评估", icon: Gauge },
  { key: "response", label: "处置建议", icon: ShieldCheck },
]

function DetailSectionTabs({
  active,
  onChange,
  investigation,
}: {
  active: DetailSectionKey
  onChange: (key: DetailSectionKey) => void
  investigation: InvestigationRecord | null
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-1">
      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        {DETAIL_SECTIONS.map((section) => {
          const Icon = section.icon
          const locked = !investigation && section.key !== "overview" && section.key !== "ai"
          return (
            <button
              key={section.key}
              type="button"
              disabled={locked}
              onClick={() => onChange(section.key)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors",
                active === section.key
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                locked && "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {section.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EmptyInvestigationPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">尚未发起 AI 调查</h3>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
        当前页面只展示告警来源、原始输入和 AI 预处理结果。发起 AI 调查后，会生成安全事件，并解锁关键发现、证据库、推理轨迹、影响评估和处置建议。
      </p>
      <Button size="sm" className="mt-4 gap-1.5" onClick={onStart}>
        <Sparkles className="size-3.5" />
        发起 AI 调查
      </Button>
    </div>
  )
}

function OverviewPanel({ signal, investigation }: { signal: LiveSignal; investigation: InvestigationRecord | null }) {
  const ppConfig = PREPROCESS_CONFIG[signal.aiPreprocess]
  const PPIcon = ppConfig.icon

  return (
    <div className={cn(CARD.base, "p-5")}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">来源系统</span>
          <p className="text-xs text-foreground mt-1 font-medium">{signal.sourceSystemName}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">AI分类</span>
          <p className="text-xs text-foreground mt-1 font-medium">{signal.aiClassification}</p>
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
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">安全事件ID</span>
          <p className="text-xs text-foreground mt-1 font-mono">{investigation?.id || "—"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">原始输入</span>
        <p className="text-[11px] text-muted-foreground font-mono leading-relaxed break-all">{signal.rawInput}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3 text-amber-600" />
            <span className="text-[10px] text-amber-600/80 uppercase tracking-wider font-medium">来源分析</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{signal.sourceAnalysis}</p>
        </div>

        <div className="rounded-lg border border-cyan-500/20 bg-primary/[0.06] p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-cyan-600" />
            <span className="text-[10px] text-cyan-600/80 uppercase tracking-wider font-medium">来源建议</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{signal.sourceSuggestion}</p>
        </div>
      </div>
    </div>
  )
}

function FindingsPanel({ record }: { record: InvestigationRecord }) {
  const findings = record.aiReasoningSteps
    .map((step) => step.detail)
    .filter(Boolean)
    .slice(0, 4)

  return (
    <div className={cn(CARD.base, "p-5")}>
      <div className="mb-4 flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">关键发现</h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {findings.map((finding, index) => (
          <div key={index} className="rounded-lg border border-border bg-muted/25 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{index + 1}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">发现项</span>
            </div>
            <p className="text-xs leading-5 text-foreground">{finding}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvidenceRepositoryPanel({ record }: { record: InvestigationRecord }) {
  const evidence = record.aiReasoningSteps.flatMap((step) => step.evidence || [])
  return (
    <div className={cn(CARD.base, "p-5")}>
      <div className="mb-4 flex items-center gap-2">
        <FileSearch className="size-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-foreground">证据库</h3>
        <span className="text-[10px] text-muted-foreground">{evidence.length} 条证据</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {evidence.length > 0 ? evidence.map((item, index) => <EvidenceItemCard key={index} item={item} />) : (
          <p className="text-xs text-muted-foreground">暂无可展示证据。</p>
        )}
      </div>
    </div>
  )
}

function ReasoningTracePanel({ record }: { record: InvestigationRecord }) {
  return (
    <div className="space-y-3">
      {record.aiReasoningSteps.map((step, idx) => (
        <ReasoningStepCard key={idx} step={step} index={idx} />
      ))}
    </div>
  )
}

function ImpactPanel({ signal, record }: { signal: LiveSignal; record: InvestigationRecord }) {
  const relatedPeople = record.aiReasoningSteps.map((step) => step.personProfile).filter(Boolean) as PersonProfile[]
  const deviations = record.aiReasoningSteps.map((step) => step.baselineDeviation).filter(Boolean) as BaselineDeviation[]
  const mappings = record.aiReasoningSteps.map((step) => step.mitreMapping).filter(Boolean) as MITREMapping[]

  return (
    <div className={cn(CARD.base, "p-5 space-y-4")}>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">影响范围</div>
          <div className="mt-2 text-lg font-semibold text-foreground">{signal.sourceSystemName}</div>
          <p className="mt-1 text-xs text-muted-foreground">以来源系统和关联证据为初始影响面。</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">风险等级</div>
          <div className="mt-2"><RiskIndicator level={signal.riskLevel} /></div>
          <p className="mt-2 text-xs text-muted-foreground">结合告警等级与 AI 置信度评估。</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">MITRE 映射</div>
          <div className="mt-2 text-lg font-semibold text-foreground">{mappings.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">已关联攻击战术与技术项。</p>
        </div>
      </div>

      {relatedPeople.length > 0 && (
        <div className="space-y-2">
          {relatedPeople.map((profile, idx) => <PersonProfileCard key={idx} profile={profile} />)}
        </div>
      )}
      {deviations.length > 0 && (
        <div className="space-y-2">
          {deviations.map((deviation, idx) => <BaselineDeviationCard key={idx} deviation={deviation} />)}
        </div>
      )}
      {mappings.length > 0 && (
        <div className="space-y-2">
          {mappings.map((mapping, idx) => <MITREMappingCard key={idx} mapping={mapping} />)}
        </div>
      )}
    </div>
  )
}

function DetailSectionContent({
  active,
  signal,
  investigation,
  onStart,
}: {
  active: DetailSectionKey
  signal: LiveSignal
  investigation: InvestigationRecord | null
  onStart: () => void
}) {
  if (!investigation && active !== "overview" && active !== "ai") {
    return <EmptyInvestigationPanel onStart={onStart} />
  }

  switch (active) {
    case "overview":
      return <OverviewPanel signal={signal} investigation={investigation} />
    case "ai":
      return investigation ? <ReasoningTracePanel record={investigation} /> : <EmptyInvestigationPanel onStart={onStart} />
    case "findings":
      return <FindingsPanel record={investigation!} />
    case "evidence":
      return <EvidenceRepositoryPanel record={investigation!} />
    case "reasoning":
      return <ReasoningTracePanel record={investigation!} />
    case "impact":
      return <ImpactPanel signal={signal} record={investigation!} />
    case "response":
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">处置工作流</span>
              <span className="text-[10px] text-muted-foreground ml-1">调查 → 复核 → 处置 → 验证 → 闭环</span>
            </div>
            <ClosureWorkflow status={investigation!.status} />
          </div>
          <DisposalRecommendationsPanel record={investigation!} />
          <DisposalTimeline record={investigation!} />
        </div>
      )
  }
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
        <h2 className="text-lg font-semibold text-foreground">告警未找到</h2>
        <p className="text-sm text-muted-foreground">无法找到对应的告警数据，可能已被清除或链接无效</p>
      </div>
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="size-4" />
        返回告警列表
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
  const storeSignals = useUnifiedDataStore((s) => s.signals)
  const initializeSignals = useUnifiedDataStore((s) => s.initialize)

  const [signalList] = useState<LiveSignal[]>(() => getSignalListFromStorage())
  const [storedSignal] = useState<LiveSignal | null>(() => getSignalDetailFromStorage(signalId))
  const [startedInvestigationId, setStartedInvestigationId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<DetailSectionKey>("overview")

  useEffect(() => {
    initializeSignals()
  }, [initializeSignals])

  const navigationSignals = useMemo(() => mergeSignalLists(signalList, storeSignals), [signalList, storeSignals])

  const currentSignal = useMemo(
    () => navigationSignals.find((s) => s.id === signalId) || storedSignal,
    [navigationSignals, signalId, storedSignal]
  )

  const investigation = useMemo(() => {
    if (!currentSignal) return null

    const startedRecord = startedInvestigationId
      ? investigationRecords.find((r) => r.id === startedInvestigationId)
      : null
    if (startedRecord) return startedRecord

    const existingStatus = signalStatusMap[currentSignal.id]
    if (!existingStatus?.investigationId) return null

    return investigationRecords.find((r) => r.id === existingStatus.investigationId) || null
  }, [currentSignal, investigationRecords, signalStatusMap, startedInvestigationId])

  const handleStartInvestigation = useCallback(() => {
    if (!currentSignal) return

    const existingRecord = bridgeStore.getInvestigationBySignalId(currentSignal.id)
    if (existingRecord) {
      setStartedInvestigationId(existingRecord.id)
      return
    }

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
    try {
      sessionStorage.setItem(`${SIGNAL_DETAIL_STORAGE_PREFIX}${currentSignal.id}`, JSON.stringify(currentSignal))
    } catch { /* ignore quota errors */ }
    setStartedInvestigationId(record.id)
  }, [bridgeStore, currentSignal])

  // Navigation helpers
  const currentIndex = useMemo(() => navigationSignals.findIndex((s) => s.id === signalId), [navigationSignals, signalId])
  const prevSignal = currentIndex > 0 ? navigationSignals[currentIndex - 1] : null
  const nextSignal = currentIndex >= 0 && currentIndex < navigationSignals.length - 1 ? navigationSignals[currentIndex + 1] : null

  const handleNavigate = useCallback((signal: LiveSignal) => {
    router.push(`/signals/${signal.id}`)
  }, [router])

  const handleBack = useCallback(() => {
    router.push("/signals")
  }, [router])

  // Not found state
  if (!currentSignal) {
    return (
      <div className="space-y-4">
        <PageHeader
          icon={Radio}
          title="告警详情"
          subtitle="告警未找到"
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

  const signalStatus = signalStatusMap[currentSignal.id]
  const investigationStatus = signalStatus?.status || "new"

  return (
    <div className="space-y-5">
      {/* ==================== Page Header ==================== */}
      <PageHeader
        icon={Crosshair}
        title="告警详情"
        subtitle={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground xl:inline">
              告警是安全设备和规则产生的原始风险提示，AI 调查后可升级为安全事件。
            </span>
            <span className="hidden h-3 w-px bg-border xl:inline-block" />
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
            {investigation ? (
              <Button size="sm" onClick={() => router.push(`/workbench?highlight=${investigation.id}`)} className="gap-1.5">
                <ArrowRight className="size-3.5" />
                查看安全事件
              </Button>
            ) : (
              <Button size="sm" onClick={handleStartInvestigation} className="gap-1.5">
                <Sparkles className="size-3.5" />
                发起 AI 调查
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              返回列表
            </Button>
          </div>
        }
      />

      <AlertIdentityPanel signal={currentSignal} investigation={investigation} />
      <AISummaryPanel signal={currentSignal} investigation={investigation} />
      <DetailSectionTabs active={activeSection} onChange={setActiveSection} investigation={investigation} />
      <DetailSectionContent active={activeSection} signal={currentSignal} investigation={investigation} onStart={handleStartInvestigation} />

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
                {currentIndex >= 0 ? currentIndex + 1 : "—"} / {navigationSignals.length}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span>告警列表</span>
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
