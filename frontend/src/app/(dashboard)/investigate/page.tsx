"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Brain,
  Search,
  Sparkles,
  Target,
  Server,
  User,
  ArrowRight,
  Zap,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  Link2,
  GitBranch,
  MoveRight,
  Wrench,
  Plus,
  UserCircle,
  BarChart3,
  ShieldCheck,
  FileSearch,
  FileCheck,
  Inbox,
  ArrowRightLeft,
  ChevronRight,
} from "lucide-react"
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
import { PageHeader } from "@/components/layout/page-header"
import { inputClass, pageCardClass } from "@/lib/admin-ui"
import { useLocaleStore } from "@/store/locale-store"
import {
  type InvestigationStatus,
  type EvidenceItem,
  type PersonProfile,
  type BaselineDeviation,
  type MITREMapping,
  type CorrelationDetail,
  type AIReasoningStep,
  type InvestigationRecord,
  TABS,
  STATUS_CONFIG,
  STEP_TYPE_CONFIG,
  EVIDENCE_TYPE_CONFIG,
  SEVERITY_CONFIG,
  DEVIATION_CONFIG,
  CORRELATION_STRENGTH_CONFIG,
  WORK_STATUS_CONFIG,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_TYPE_COLORS,
  mockRecords,
} from "@/data/investigations"

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
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : tone === "emerald"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : tone === "red"
            ? "border-red-500/20 bg-red-500/10 text-red-300"
            : "border-border bg-card text-foreground"

  return (
    <div className={cn("rounded-lg border px-3 py-2.5", toneClass)}>
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
      {t(`investigate.${cfg.labelKey}`)}
    </span>
  )
}

function TriggerBadge({ type }: { type: "auto" | "manual" }) {
  const { t } = useLocaleStore()
  return (
    <Badge variant="outline" className={cn("text-[8px] py-0 px-1", type === "auto" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-primary bg-primary/10 border-cyan-500/20")}>
      {type === "auto" ? t("investigate.autoByAi") : t("investigate.manualBy")}
    </Badge>
  )
}

function AssetTag({ name, type, vendor }: { name: string; type: "asset" | "account"; vendor?: string }) {
  const color = type === "asset" ? "#22d3ee" : "#a78bfa"
  const Icon = type === "asset" ? Server : User
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono font-semibold" style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}25` }}>
      <Icon className="h-2.5 w-2.5" />
      {vendor && <span className="opacity-60">{vendor}</span>}
      {name}
    </span>
  )
}

function getAccountDisplay(account: string, steps: AIReasoningStep[]): string {
  for (const step of steps) {
    if (step.personProfile) {
      const emailPrefix = step.personProfile.email.split("@")[0]
      if (emailPrefix === account) {
        return `${step.personProfile.name}（${step.personProfile.department}）`
      }
    }
  }
  return `${account}`
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
        <span className="ml-auto inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-medium" style={{ color: sevCfg.color, backgroundColor: sevCfg.bg }}>{t(`investigate.${sevCfg.labelKey}`)}</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{item.content}</p>
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
        <span className="font-mono">{item.timestamp.slice(-8)}</span>
        {item.ioc && (
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] font-mono" style={{ color: "#f97316", backgroundColor: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
            IOC: {item.ioc.length > 20 ? item.ioc.slice(0, 20) + ".." : item.ioc}
          </span>
        )}
        <span className="ml-auto capitalize text-muted-foreground">{item.type.replace("_", " ")}</span>
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600/70">{t("investigate.personnelProfile")}</span>
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
                <span className="text-[10px]" style={{ color: wsCfg.color }}>{t(`investigate.${wsCfg.labelKey}`)}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] pt-1 border-t border-border/50">
          <span className="text-slate-400">{t("investigate.investigationId")} <span className="text-muted-foreground font-mono ml-1">{profile.employeeId}</span></span>
          <span className="text-slate-400">{t("investigate.lastActivity")} <span className="text-muted-foreground ml-1">{profile.location}</span></span>
          <span className="text-slate-400">{t("investigate.riskScore")} <span className={cn("font-mono tabular-nums ml-1", profile.riskScore >= 60 ? "text-red-600" : profile.riskScore >= 30 ? "text-amber-600" : "text-cyan-600")}>{profile.riskScore}</span></span>
          <span className="text-slate-400">{t("investigate.accessLevel")} <span className="text-muted-foreground font-mono tabular-nums ml-1">{profile.deviceCount}</span></span>
          <span className="text-slate-400">{t("investigate.updated")} <span className="text-muted-foreground font-mono ml-1">{profile.lastLogin.slice(5).replace("-", "/")}</span></span>
        </div>
        {profile.notes && (
          <p className="text-[9px] text-muted-foreground italic pt-1 border-t border-border/50">{profile.notes}</p>
        )}
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">{t("investigate.baselineDeviation")}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground min-w-[60px]">{deviation.metric}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground line-clamp-1">{deviation.normalValue}</span>
          <MoveRight className="h-3 w-3 text-amber-600/50" />
          <span className={cn("text-[10px] font-medium line-clamp-1", devCfg.color)}>{deviation.actualValue}</span>
          <span className="inline-flex items-center rounded px-1 py-[1px] text-[8px] font-medium ml-auto shrink-0" style={{ color: devCfg.color, backgroundColor: `${devCfg.color}15` }}>{t(`investigate.${devCfg.labelKey}`)}</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground pl-[68px]">
          <span>{deviation.timeWindow}</span>
          <span>·</span>
          <span>{deviation.sampleSize.toLocaleString()}</span>
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
        {mapping.subTechnique && <span className="text-[10px] text-muted-foreground">({mapping.subTechnique})</span>}
        <span className="ml-auto flex items-center gap-1">
          <span className={cn("text-[10px] font-mono font-bold", mapping.confidence >= 90 ? "text-red-600" : mapping.confidence >= 70 ? "text-amber-600" : "text-cyan-600")}>{mapping.confidence}%</span>
        </span>
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
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-medium" style={{ color: strCfg.color, backgroundColor: `${strCfg.color}12` }}>{t(`investigate.${strCfg.labelKey}`)}</span>
        </div>
        <p className="text-[9px] text-foreground/45 leading-relaxed">{corr.description}</p>
      </div>
    </div>
  )
}

function RichReasoningStepCard({ step, index }: { step: AIReasoningStep; index: number }) {
  const { t } = useLocaleStore()
  const cfg = STEP_TYPE_CONFIG[step.type]
  const Icon = cfg.icon
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3" style={{ background: `linear-gradient(90deg, ${cfg.color}08, var(--card))` }}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}15` }}>
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        <span className="text-xs font-semibold text-foreground">{t("investigate.step")}{index + 1}：{t(`investigate.${cfg.labelKey}`)}</span>
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600/70">{t("investigate.aiReasoning")}</span>
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("investigate.correlation")} ({step.correlations.length})</span>
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("investigate.evidenceChain")} ({step.evidence.length})</span>
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
            {isPositive ? t("investigate.feedbackInvestigationCorrect") : t("investigate.feedbackInvestigationWrong")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isPositive ? t("investigate.noInvestigationsDesc") : t("investigate.noInvestigationsDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">{t("investigate.feedbackType")} <span className="text-red-600">*</span></span>
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
                    <span style={{ color: isSelected ? color : "var(--muted-foreground)" }}>{t(`investigate.${opt.labelKey}`)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">{t("investigate.additionalComments")}</span>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("investigate.commentsPlaceholder")}
              className="min-h-[80px] bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-primary/20 resize-none text-xs" />
          </div>

          <Button onClick={handleSubmit} disabled={!feedbackType}
            className="w-full h-9 font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPositive ? <ThumbsUp className="size-3.5" /> : <ThumbsDown className="size-3.5" />}
            {t("investigate.submitFeedback")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { usePageTitle } from "@/hooks/use-page-title"
import { useMockDataStore } from "@/store/mock-data-store"

export default function InvestigatePage() {
  usePageTitle("investigate")
  const { t } = useLocaleStore()
  const router = useRouter()
  const storeAlerts = useMockDataStore((s) => s.alerts)
  const storeAnalyses = useMockDataStore((s) => s.analyses)
  const [selectedRecord, setSelectedRecord] = useState<InvestigationRecord | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const feedbackRating: "thumbs_up" | "thumbs_down" | null = null

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    TABS.forEach(tab => {
      counts[tab.value] = mockRecords.filter(r => r.status === tab.value).length
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

  const positiveCount = mockRecords.filter(r => r.feedback?.rating === "thumbs_up").length
  const negativeCount = mockRecords.filter(r => r.feedback?.rating === "thumbs_down").length
  const totalCount = storeAlerts.length
  const investigatingCount = storeAlerts.filter(a => a.status === "investigating").length
  const reviewCount = storeAlerts.filter(a => a.status === "escalated").length
  const disposingCount = storeAnalyses.length
  const closedCount = storeAlerts.filter(a => a.status === "resolved" || a.status === "false_positive").length
  const avgConfidence = storeAnalyses.length > 0
    ? Math.round(storeAnalyses.reduce((sum, a) => sum + a.riskScore, 0) / storeAnalyses.length)
    : 0
  const visibleSelectedRecord = selectedRecord ? filteredRecords.find((record) => record.id === selectedRecord.id) ?? null : null
  const previewRecord = filteredRecords[0] ?? null
  const activeRecord = visibleSelectedRecord ?? previewRecord ?? null
  const safeSelectedStepIndex = activeRecord ? Math.min(selectedStepIndex, activeRecord.aiReasoningSteps.length - 1) : 0

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("investigate.pageTitle")}
        subtitle={t("investigate.pageSubtitle")}
        icon={Brain}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border bg-card text-foreground hover:bg-muted/50" onClick={() => { if (!selectedRecord && filteredRecords.length > 0) setSelectedRecord(filteredRecords[0]) }}>
              <ArrowUpRight className="mr-1 h-4 w-4" />
              {t("investigate.viewDetails")}
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push("/response")}>
              <Plus className="mr-1 h-4 w-4" />
              {t("investigate.stepDisposalDecision")}
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1200px] pb-8 pt-4 space-y-5">
        {/* 统计概览 - 全宽 */}
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-lg">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t("investigate.aiReasoning")}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("investigate.pageTitle")}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t("investigate.pageSubtitle")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <StatPill label={t("investigate.totalInvestigations")} value={totalCount} hint={`${investigatingCount} ${t("investigate.statusInvestigating")} / ${reviewCount} ${t("investigate.statusPendingReview")} / ${disposingCount} ${t("investigate.statusDisposing")} / ${closedCount} ${t("investigate.statusClosed")}`} />
                <StatPill label={t("investigate.statusInvestigating")} value={investigatingCount} tone="cyan" />
                <StatPill label={t("investigate.statusPendingReview")} value={reviewCount} tone="amber" />
                <StatPill label={t("investigate.confidence")} value={`${avgConfidence}%`} tone="emerald" hint={`${t("investigate.statusClosed")} ${closedCount}`} />
              </div>
            </div>
          </div>
        </div>

        {/* 搜索 + 筛选 + Tab */}
        <div className="rounded-[20px] border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("investigate.searchPlaceholder")}
                aria-label={t("investigate.searchPlaceholder")}
                name="search"
                autoComplete="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-11 pl-9 text-sm ${inputClass}`}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-300 text-sm">
                <ThumbsUp className="h-4 w-4 shrink-0" />
                <span className="font-semibold tabular-nums">{positiveCount}</span>
              </div>
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <ThumbsDown className="h-4 w-4 shrink-0" />
                <span className="font-semibold tabular-nums">{negativeCount}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 text-sm">
                <Wrench className="h-4 w-4 shrink-0" />
                <span className="font-semibold tabular-nums">{disposingCount}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.value
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active ? "border-primary/25 bg-primary/10 text-primary ring-1 ring-primary/15" : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {TabIcon && <TabIcon className="h-3.5 w-3.5" />}
                  {t(`investigate.${tab.labelKey}`)}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-mono", active ? "bg-background text-primary" : "bg-muted/50 text-muted-foreground")}>
                    {tabCounts[tab.value] || 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 调查列表 - 传统列表式，点击展开详情 */}
        <div className="space-y-3">
          {filteredRecords.length > 0 ? filteredRecords.map((record) => {
            const isExpanded = activeRecord?.id === record.id
            return (
              <div key={record.id} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden transition-colors">
                {/* 列表行 */}
                <button
                  type="button"
                  onClick={() => {
                    if (isExpanded) {
                      setSelectedRecord(null)
                      setSelectedStepIndex(0)
                    } else {
                      setSelectedRecord(record)
                      setSelectedStepIndex(0)
                    }
                  }}
                  className="w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={record.status} />
                    <span className="text-[10px] font-mono text-muted-foreground">{record.id}</span>
                    <TriggerBadge type={record.triggerType} />
                    <span className="ml-auto text-[11px] text-muted-foreground">{record.updatedAt.slice(0, 16)}</span>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{record.title}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{record.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <AssetTag name={record.asset} type="asset" />
                      <span className={cn("text-xs font-semibold tabular-nums", record.confidence >= 80 ? "text-red-300" : record.confidence >= 60 ? "text-amber-300" : "text-primary")}>
                        {record.confidence}%
                      </span>
                    </div>
                  </div>
                </button>

                {/* 展开详情 */}
                {isExpanded && activeRecord && (
                  <div className="border-t border-border">
                    <div className="p-5 space-y-4">
                      {/* 详情头部 */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {activeRecord.involvedAccounts?.slice(0, 3).map((account) => (
                            <AssetTag key={account} name={getAccountDisplay(account, activeRecord.aiReasoningSteps)} type="account" />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatPill label={t("investigate.confidence")} value={`${activeRecord.confidence}%`} tone={activeRecord.confidence >= 80 ? "red" : "amber"} />
                          <StatPill label={t("investigate.evidence")} value={activeRecord.aiReasoningSteps.reduce((sum, step) => sum + step.evidence.length, 0)} tone="cyan" />
                          <StatPill label={t("investigate.deviation")} value={activeRecord.aiReasoningSteps.filter((step) => step.baselineDeviation || step.correlations?.some((c) => c.strength !== "confirmed")).length} tone="amber" />
                          <StatPill label={t("investigate.step")} value={activeRecord.aiReasoningSteps.length} />
                        </div>
                      </div>

                      {activeRecord.aiConclusion && (
                        <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-violet-300" />
                            <span className="text-xs font-semibold text-violet-300">{t("investigate.aiReasoning")}</span>
                          </div>
                          <p className="text-sm leading-6 text-foreground">{activeRecord.aiConclusion}</p>
                        </div>
                      )}

                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-600">{t("investigate.stepDisposalDecision")}</span>
                        </div>
                        <p className="text-sm leading-6 text-foreground">
                          {activeRecord.status === "pending_review"
                            ? t("investigate.statusPendingReview")
                            : activeRecord.status === "disposing"
                              ? activeRecord.currentAction ?? t("investigate.statusDisposing")
                              : activeRecord.status === "closed"
                                ? activeRecord.closeReason ?? t("investigate.statusClosed")
                                : t("investigate.statusInvestigating")
                          }
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {[...activeRecord.involvedAccounts ?? [], ...activeRecord.involvedAssets ?? [], ...activeRecord.entities].slice(0, 4).map((entity) => (
                            <span key={entity} className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-mono text-muted-foreground">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {activeRecord.status === "closed" && activeRecord.conclusion && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5">
                          <div className="mb-2 flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-emerald-300" />
                            <span className="text-sm font-semibold text-emerald-300">{t("investigate.conclusion")}</span>
                          </div>
                          <p className="text-sm leading-6 text-foreground">{activeRecord.conclusion}</p>
                        </div>
                      )}

                      {activeRecord.disposalSuggestion && activeRecord.status === "pending_review" && (
                        <div className="rounded-lg border border-cyan-500/20 bg-primary/10 p-5">
                          <div className="mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">{t("investigate.stepDisposalDecision")}</span>
                          </div>
                          <p className="text-sm leading-6 text-foreground">{activeRecord.disposalSuggestion}</p>
                        </div>
                      )}

                      {/* 证据链 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">{t("investigate.evidenceChain")}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{activeRecord.aiReasoningSteps.length} {t("investigate.step")}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeRecord.aiReasoningSteps.map((step, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedStepIndex(idx)}
                              className={cn(
                                "rounded-lg border px-3 py-2 text-left transition-colors",
                                selectedStepIndex === idx
                                  ? "border-primary/25 bg-primary/10 text-primary"
                                  : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                              )}
                            >
                              <div className="text-[10px] font-mono">{t("investigate.step")} {idx + 1}</div>
                              <div className="mt-1 text-xs font-medium">{step.step}</div>
                            </button>
                          ))}
                        </div>
                        <RichReasoningStepCard
                          step={activeRecord.aiReasoningSteps[safeSelectedStepIndex]}
                          index={safeSelectedStepIndex}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }) : (
            <div className={cn(pageCardClass, "flex min-h-[320px] flex-col items-center justify-center py-20 text-muted-foreground")}>
              <Inbox className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm">{t("investigate.noInvestigations")}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.15); }
      `}</style>

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
