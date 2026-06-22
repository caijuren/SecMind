"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Workflow,
  ArrowRight,
  Filter,
  Merge,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  TrendingDown,
  Eye,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { useLocaleStore } from "@/store/locale-store"
import { useMockDataStore } from "@/store/mock-data-store"
import { useUnifiedDataStore } from "@/store/unified-data-store"
import { usePageTitle } from "@/hooks/use-page-title"
import { CARD, TYPOGRAPHY } from "@/lib/design-system"
import { ShieldAlert } from "lucide-react"

// ==================== Mock 数据 ====================

interface PipelineStage {
  id: string
  icon: React.ElementType
  labelKey: string
  descKey: string
  input: number
  output: number
  color: string
  active: boolean
}

interface PreprocessRule {
  id: string
  nameKey: string
  descKey: string
  icon: React.ElementType
  color: string
  enabled: boolean
  processedCount: number
}

const RULES: PreprocessRule[] = [
  { id: "rule-dedup", nameKey: "pipeline.ruleDedup", descKey: "pipeline.ruleDedupDesc", icon: Merge, color: "#06b6d4", enabled: true, processedCount: 1651 },
  { id: "rule-noise", nameKey: "pipeline.ruleNoise", descKey: "pipeline.ruleNoiseDesc", icon: Filter, color: "#f59e0b", enabled: true, processedCount: 713 },
  { id: "rule-correlate", nameKey: "pipeline.ruleCorrelate", descKey: "pipeline.ruleCorrelateDesc", icon: Link2, color: "#8b5cf6", enabled: true, processedCount: 1071 },
  { id: "rule-enrich", nameKey: "pipeline.ruleEnrich", descKey: "pipeline.ruleEnrichDesc", icon: Sparkles, color: "#3b82f6", enabled: true, processedCount: 412 },
]

// ==================== 主页面 ====================

export default function PipelinePage() {
  usePageTitle("pipeline")
  const { t } = useLocaleStore()
  return (
    <PermissionGate resource="alerts" action="read" fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto size-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">{t("common.forbidden")}</h2>
        </div>
      </div>
    }>
      <PipelineContent />
    </PermissionGate>
  )
}

function PipelineContent() {
  const { t } = useLocaleStore()
  const pipelineStats = useMockDataStore((s) => s.pipelineStats)
  const alertGroups = useUnifiedDataStore((s) => s.alertGroups)

  // Derive pipeline stages from store data
  const INITIAL_STAGES: PipelineStage[] = [
    { id: "receive", icon: Radio, labelKey: "pipeline.stageReceive", descKey: "pipeline.stageReceiveDesc", input: pipelineStats.rawAlerts, output: pipelineStats.rawAlerts, color: "#6366f1", active: true },
    { id: "deduplicate", icon: Merge, labelKey: "pipeline.stageDeduplicate", descKey: "pipeline.stageDeduplicateDesc", input: pipelineStats.rawAlerts, output: pipelineStats.deduplicated, color: "#06b6d4", active: true },
    { id: "denoise", icon: Filter, labelKey: "pipeline.stageDenoise", descKey: "pipeline.stageDenoiseDesc", input: pipelineStats.deduplicated, output: pipelineStats.noiseFiltered, color: "#f59e0b", active: true },
    { id: "correlate", icon: Link2, labelKey: "pipeline.stageCorrelate", descKey: "pipeline.stageCorrelateDesc", input: pipelineStats.noiseFiltered, output: pipelineStats.correlated, color: "#8b5cf6", active: true },
    { id: "enrich", icon: Sparkles, labelKey: "pipeline.stageEnrich", descKey: "pipeline.stageEnrichDesc", input: pipelineStats.correlated, output: pipelineStats.correlated, color: "#3b82f6", active: true },
    { id: "output", icon: CheckCircle2, labelKey: "pipeline.stageOutput", descKey: "pipeline.stageOutputDesc", input: pipelineStats.correlated, output: pipelineStats.correlated, color: "#10b981", active: true },
  ]

  const [stages, setStages] = useState(INITIAL_STAGES)
  const [lastRefresh, setLastRefresh] = useState(() => Date.now())

  const refreshData = useCallback(() => {
    setStages((prev) => {
      const receive = prev[0]
      const newInput = receive.input + Math.floor(Math.random() * 30) - 5
      let running = Math.max(100, newInput)
      return prev.map((stage, i) => {
        if (i === 0) return { ...stage, input: newInput, output: newInput }
        const ratio = stage.output / (stage.input || 1)
        const newOutput = Math.max(10, Math.round(running * ratio + (Math.random() * 20 - 10)))
        const result = { ...stage, input: running, output: newOutput }
        running = newOutput
        return result
      })
    })
    setLastRefresh(Date.now())
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshData, 15000)
    return () => clearInterval(interval)
  }, [refreshData])

  const rawAlerts = stages[0].input
  const deduped = stages[0].input - stages[1].output
  const noised = stages[1].output - stages[2].output
  const correlated = stages[2].output - stages[3].output
  const finalOutput = stages[stages.length - 1].output
  const compressionRate = ((1 - finalOutput / rawAlerts) * 100).toFixed(1)

  const stats = [
    { label: t("pipeline.rawAlerts"), value: rawAlerts.toLocaleString(), desc: t("pipeline.rawAlertsDesc"), color: "#6366f1", icon: Radio },
    { label: t("pipeline.deduplicated"), value: deduped.toLocaleString(), desc: t("pipeline.deduplicatedDesc"), color: "#06b6d4", icon: Merge },
    { label: t("pipeline.noiseFiltered"), value: noised.toLocaleString(), desc: t("pipeline.noiseFilteredDesc"), color: "#f59e0b", icon: Filter },
    { label: t("pipeline.correlated"), value: correlated.toLocaleString(), desc: t("pipeline.correlatedDesc"), color: "#8b5cf6", icon: Link2 },
    { label: t("pipeline.compressionRate"), value: `${compressionRate}%`, desc: `${rawAlerts.toLocaleString()} → ${finalOutput.toLocaleString()}`, color: "#10b981", icon: TrendingDown },
  ]

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <PageHeader
        icon={Workflow}
        title={t("pipeline.pageTitle")}
        subtitle={t("pipeline.pageSubtitle")}
        actions={
          <div className="flex items-center gap-3">
            <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground font-mono tabular-nums")}>
              <Clock className="size-3 inline mr-1" />
              {new Date(lastRefresh).toLocaleTimeString("zh-CN", { hour12: false })}
            </span>
            <button
              onClick={refreshData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="size-3.5" />
              {t("dashboard.refresh")}
            </button>
          </div>
        }
      />

      {/* ========== 统计卡片 ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 hover:border-border hover:bg-card hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex size-7 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}25` }}
                >
                  <Icon className="size-3.5" style={{ color: stat.color }} />
                </div>
                <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground truncate")}>{stat.label}</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-foreground">{stat.value}</div>
              <div className={cn(TYPOGRAPHY.micro, "text-muted-foreground/60 mt-0.5 truncate")}>{stat.desc}</div>
            </div>
          )
        })}
      </div>

      {/* ========== AI预处理管线流程 ========== */}
      <Card className={cn(CARD.elevated)}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="size-4 text-primary" />
            <h2 className={cn(TYPOGRAPHY.h2)}>{t("pipeline.pipelineTitle")}</h2>
          </div>
          <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground mb-5")}>{t("pipeline.pipelineDesc")}</p>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((stage, idx) => {
              const Icon = stage.icon
              return (
                <div key={stage.id} className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "flex flex-col items-center rounded-xl border px-5 py-4 min-w-[130px] transition-all duration-200",
                      stage.active
                        ? "bg-card border-border shadow-sm"
                        : "bg-muted/20 border-border/70 opacity-50"
                    )}
                  >
                    <div
                      className="flex size-9 items-center justify-center rounded-lg mb-2"
                      style={{ backgroundColor: `${stage.color}12`, border: `1px solid ${stage.color}25` }}
                    >
                      <Icon className="size-4" style={{ color: stage.color }} />
                    </div>
                    <span className={cn(TYPOGRAPHY.caption, "font-medium text-foreground text-center")}>{t(stage.labelKey)}</span>
                    <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/60 text-center mt-0.5 max-w-[100px] truncate")}>{t(stage.descKey)}</span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={cn(TYPOGRAPHY.micro, "font-mono tabular-nums text-muted-foreground")}>{stage.input.toLocaleString()}</span>
                      {idx > 0 && (
                        <>
                          <ArrowRight className="size-3 text-muted-foreground/70" />
                          <span className={cn(TYPOGRAPHY.micro, "font-mono tabular-nums font-semibold")} style={{ color: stage.color }}>
                            {stage.output.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {idx < stages.length - 1 && (
                    <ArrowRight className="size-4 text-muted-foreground/60 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ========== 双栏：最近预处理结果 + 预处理规则 ========== */}
      <div className="grid grid-cols-12 gap-4">
        {/* 左栏：最近预处理结果 */}
        <div className="col-span-8">
          <Card className={cn(CARD.elevated)}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <h2 className={cn(TYPOGRAPHY.h2)}>{t("pipeline.recentTitle")}</h2>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold">{alertGroups.length} {t("pipeline.alertGroup")}</Badge>
              </div>
              <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground mb-3")}>{t("pipeline.recentDesc")}</p>

              <div className="space-y-2">
                {alertGroups.map((group) => {
                  const severityColor = group.severity === "critical" ? "#ef4444" : group.severity === "high" ? "#f97316" : "#f59e0b"
                  return (
                    <div
                      key={group.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors group"
                    >
                      {/* 严重级别指示 */}
                      <span className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: severityColor }} />

                      {/* 告警组信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(TYPOGRAPHY.body, "font-medium text-foreground truncate")}>{group.title}</span>
                          {group.status === "processing" && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9px] font-semibold animate-pulse">
                              {t("pipeline.processing")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>{group.source}</span>
                          <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/70")}>|</span>
                          <span className={cn(TYPOGRAPHY.micro, "font-mono tabular-nums text-muted-foreground")}>{group.time}</span>
                          <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/70")}>|</span>
                          {group.techniques.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono">{tech}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* 压缩效果 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground line-through font-mono tabular-nums")}>{group.originalCount}</span>
                            <ArrowRight className="size-3 text-emerald-500" />
                            <span className={cn(TYPOGRAPHY.caption, "font-semibold font-mono tabular-nums text-emerald-600")}>{group.processedCount}</span>
                          </div>
                          <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/60")}>
                            {((1 - group.processedCount / group.originalCount) * 100).toFixed(0)}% {t("pipeline.compressionRate")}
                          </span>
                        </div>
                      </div>

                      {/* 操作 */}
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-primary">
                        <Eye className="size-3 mr-1" />
                        {t("pipeline.viewDetails")}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右栏：预处理规则 */}
        <div className="col-span-4">
          <Card className={cn(CARD.elevated)}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-4 text-primary" />
                <h2 className={cn(TYPOGRAPHY.h2)}>{t("pipeline.ruleTitle")}</h2>
              </div>
              <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground mb-3")}>{t("pipeline.ruleDesc")}</p>

              <div className="space-y-3">
                {RULES.map((rule) => {
                  const Icon = rule.icon
                  return (
                    <div key={rule.id} className="rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex size-6 items-center justify-center rounded-md shrink-0"
                            style={{ backgroundColor: `${rule.color}12` }}
                          >
                            <Icon className="size-3" style={{ color: rule.color }} />
                          </div>
                          <span className={cn(TYPOGRAPHY.caption, "font-medium text-foreground")}>{t(rule.nameKey)}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-semibold",
                            rule.enabled
                              ? "border-emerald-500/25 text-emerald-600 bg-emerald-500/5"
                              : "border-muted text-muted-foreground"
                          )}
                        >
                          {rule.enabled ? t("pipeline.enabled") : t("pipeline.disabled")}
                        </Badge>
                      </div>
                      <p className={cn(TYPOGRAPHY.micro, "text-muted-foreground leading-relaxed")}>{t(rule.descKey)}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/60")}>已处理</span>
                        <span className={cn(TYPOGRAPHY.micro, "font-mono tabular-nums font-semibold", { color: rule.color })}>
                          {rule.processedCount.toLocaleString()}
                        </span>
                        <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground/60")}>条</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
