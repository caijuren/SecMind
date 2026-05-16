"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Brain,
  Shield,
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Zap,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import ConfidenceGauge from "@/components/ai/ConfidenceGauge"

interface AIThinkingStep {
  id: string
  timestamp: string
  agent: string
  agentIcon: React.ElementType
  agentColor?: string
  status: "complete" | "working" | "error"
  message: string
  result?: string[]
  findings?: string[]
  isTyping?: boolean
  confidence?: number
  mitreTechniques?: string[]
}

interface EvidenceItem {
  id: string
  type: string
  content: string
  indicator: "supporting" | "opposing" | "neutral"
  riskLevel?: "critical" | "high" | "medium" | "low"
  source?: string
  details?: { label: string; value: string }[]
}

interface AIConclusion {
  event: string
  confidence: number
  riskScore: number
  attackPhase: string
  recommendations: string[]
}

interface ReasoningChainProps {
  steps: AIThinkingStep[]
  evidence?: EvidenceItem[]
  conclusion?: AIConclusion
  isAnalyzing?: boolean
}

const agentTypeColorMap: Record<string, string> = {
  soc: "#3b82f6",
  identity: "#8b5cf6",
  threat: "#ef4444",
  ueba: "#22c55e",
  forensics: "#a78bfa",
  reasoning: "#a78bfa",
  conclusion: "#22c55e",
  mail: "#f97316",
  network: "#3b82f6",
  default: "#22d3ee",
}

function getAgentColor(agentName: string): string {
  const name = agentName.toLowerCase()
  if (name.includes("soc")) return agentTypeColorMap.soc
  if (name.includes("identity") || name.includes("user") || name.includes("ad")) return agentTypeColorMap.identity
  if (name.includes("threat") || name.includes("intel")) return agentTypeColorMap.threat
  if (name.includes("ueba") || name.includes("behavior")) return agentTypeColorMap.ueba
  if (name.includes("forensic") || name.includes("log") || name.includes("mail") || name.includes("edr") || name.includes("network")) return agentTypeColorMap.forensics
  if (name.includes("reasoning")) return agentTypeColorMap.reasoning
  if (name.includes("conclusion")) return agentTypeColorMap.conclusion
  return agentTypeColorMap.default
}

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed])

  return (
    <span>
      {displayText}
      {currentIndex < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-cyan-400 animate-pulse align-middle ml-0.5" />
      )}
    </span>
  )
}

const indicatorConfig = {
  supporting: {
    icon: ThumbsUp,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    label: "支持",
    border: "border-emerald-500/30",
  },
  opposing: {
    icon: ThumbsDown,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    label: "反对",
    border: "border-red-500/30",
  },
  neutral: {
    icon: Minus,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    label: "中性",
    border: "border-yellow-500/30",
  },
} as const

function EvidenceCard({
  evidence,
  isExpanded,
  onToggle,
}: {
  evidence: EvidenceItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const config = indicatorConfig[evidence.indicator]
  const IndicatorIcon = config.icon

  const riskColors: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 transition-all duration-200",
        config.border,
        isExpanded && "ring-1 ring-foreground/10"
      )}
    >
      <button
        className="flex w-full items-start gap-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: config.bg }}
        >
          <IndicatorIcon className="size-3.5" style={{ color: config.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-card-foreground">
              {evidence.type}
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              {config.label}
            </span>
            {evidence.riskLevel && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: riskColors[evidence.riskLevel] || "#64748b" }}
              >
                {evidence.riskLevel.toUpperCase()}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {evidence.content}
          </p>
          {evidence.source && (
            <span className="mt-1 inline-block text-[10px] text-muted-foreground/60">
              来源: {evidence.source}
            </span>
          )}
        </div>

        <div className="shrink-0 pt-1">
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && evidence.details && evidence.details.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          {evidence.details.map((detail, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{detail.label}</span>
              <span className="font-medium text-card-foreground">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MitreBadge({ technique }: { technique: string }) {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-red-500/20 bg-red-500/5 text-[10px] font-mono text-red-400 hover:bg-red-500/10"
    >
      <Target className="size-2.5" />
      {technique}
    </Badge>
  )
}

function ConclusionCard({ conclusion }: { conclusion: AIConclusion }) {
  return (
    <div className="rounded-xl border-2 border-red-500/20 bg-card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500">
          <Zap className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-card-foreground">
              AI 最终结论
            </h3>
            <div className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5">
              <Sparkles className="size-3 text-red-400" />
              <span className="text-[10px] font-bold text-red-400">
                置信度 {conclusion.confidence}%
              </span>
            </div>
          </div>
          <p className="text-sm font-semibold text-card-foreground">
            {conclusion.event}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 border border-border p-3">
          <div className="text-[10px] text-muted-foreground mb-1">风险评分</div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-black text-red-500">
              {conclusion.riskScore}
            </span>
            <span className="text-[10px] text-muted-foreground mb-1">/100</span>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border p-3">
          <div className="text-[10px] text-muted-foreground mb-1">攻击阶段</div>
          <div className="text-xs font-semibold text-card-foreground leading-tight">
            {conclusion.attackPhase}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground mb-2">AI 建议措施</div>
        <div className="space-y-1">
          {conclusion.recommendations.map((rec, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span className="text-card-foreground">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ReasoningChain({
  steps,
  evidence,
  conclusion,
  isAnalyzing = false,
}: ReasoningChainProps) {
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleEvidence = useCallback((id: string) => {
    setExpandedEvidence((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (containerRef.current && isAnalyzing) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [steps, isAnalyzing])

  if (steps.length === 0 && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-4">
        <Brain className="size-12 opacity-30" />
        <p className="text-sm">等待 AI 推理开始...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-4 overflow-y-auto scrollbar-thin">
      {steps.map((step, index) => {
        const color = step.agentColor || getAgentColor(step.agent)
        const isLast = index === steps.length - 1
        const isActive = step.status === "working" && isLast && isAnalyzing
        const isError = step.status === "error"
        const AgentIcon = step.agentIcon || Brain

        return (
          <div
            key={step.id}
            className={cn(
              "relative rounded-xl border p-4 transition-all duration-500 bg-card",
              isActive && "border-cyan-500/30 shadow-lg shadow-cyan-500/5 scale-[1.01]",
              isError && "border-red-500/30 shadow-lg shadow-red-500/5",
              !isActive && !isError && "border-border"
            )}
          >
            {index > 0 && (
              <div
                className="absolute -top-3 left-7 w-0.5 h-3"
                style={{
                  background: `linear-gradient(to bottom, ${color}40, ${color}10)`,
                }}
              />
            )}

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  style={{ backgroundColor: `${color}15` }}
                >
                  <AgentIcon
                    className="size-5"
                    style={{ color }}
                  />

                  {isActive && (
                    <>
                      <div
                        className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-card animate-ping"
                        style={{ backgroundColor: color }}
                      />
                      <div
                        className="absolute -top-0.5 -right-0.5 size-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </>
                  )}

                  {isError && (
                    <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-red-500" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {step.timestamp}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${color}12`, color }}
                  >
                    {step.agent}
                  </span>

                  {step.status === "complete" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle2 className="size-2.5" />
                      完成
                    </span>
                  )}
                  {step.status === "working" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      <Loader2 className="size-2.5 animate-spin" />
                      分析中
                    </span>
                  )}
                  {step.status === "error" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                      <XCircle className="size-2.5" />
                      错误
                    </span>
                  )}

                  {step.confidence !== undefined && (
                    <ConfidenceGauge
                      value={step.confidence}
                      size={28}
                      strokeWidth={3}
                      showLabel={false}
                    />
                  )}
                </div>

                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    isActive ? "font-bold text-card-foreground" : "font-medium text-card-foreground/80"
                  )}
                >
                  {step.isTyping && isActive ? (
                    <TypewriterText text={step.message} speed={40} />
                  ) : (
                    step.message
                  )}
                </p>

                {step.result && step.result.length > 0 && (
                  <div
                    className="space-y-1 border-l-2 pl-3"
                    style={{ borderColor: `${color}30` }}
                  >
                    {step.result.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <span style={{ color }}>•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {step.findings && step.findings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {step.findings.map((finding, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {finding}
                      </Badge>
                    ))}
                  </div>
                )}

                {step.mitreTechniques && step.mitreTechniques.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {step.mitreTechniques.map((technique) => (
                      <MitreBadge key={technique} technique={technique} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {evidence && evidence.length > 0 && (
        <div className="space-y-3 animate-fadeInUp">
          <div className="flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
            <Shield className="size-4 text-red-400" />
            <span className="text-[10px] font-bold text-red-400">
              证据链收集完成
            </span>
            <span className="ml-auto text-[10px] text-red-400/60">
              {evidence.length} 条关键证据
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {evidence.map((item) => (
              <EvidenceCard
                key={item.id}
                evidence={item}
                isExpanded={expandedEvidence.has(item.id)}
                onToggle={() => toggleEvidence(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {conclusion && (
        <div className="animate-fadeInUp">
          <ConclusionCard conclusion={conclusion} />
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center justify-center gap-2 py-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <span className="text-xs text-muted-foreground italic ml-2">
            AI 正在深度分析中...
          </span>
        </div>
      )}
    </div>
  )
}

export type { AIThinkingStep, EvidenceItem, AIConclusion, ReasoningChainProps }