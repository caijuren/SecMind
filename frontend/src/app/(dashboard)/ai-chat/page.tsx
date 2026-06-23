"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Brain,
  Square,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Zap,
  ShieldAlert,
  Globe,
  FileSearch,
  Sparkles,
  ArrowRight,
  Lightbulb,
  UserCheck,
  History,
  Network,
  Compass,
  ArrowUp,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLocaleStore } from "@/store/locale-store"

type Role = "user" | "assistant"
type MessageType = "text" | "evidence_list" | "tool_call" | "confidence_update" | "suggestion" | "next_steps" | "error"

interface EvidenceItem {
  id: string
  source: string
  timestamp: string
  detail: string
  direction: "supports" | "contradicts" | "neutral"
}

interface ToolCall {
  name: string
  input: Record<string, string | string[]>
  output: string
  duration: string
}

interface NextStepItem {
  action: string
  description: string
  skill_id: string
  parameters: Record<string, string>
}

interface ChatMessage {
  id: string
  role: Role
  content: string
  type: MessageType
  timestamp: string
  evidence?: EvidenceItem[]
  toolCall?: ToolCall
  confidenceBefore?: number
  confidenceAfter?: number
  suggestions?: string[]
  nextSteps?: NextStepItem[]
  context?: Record<string, string>
  isLoading?: boolean
}

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getInitialMessages(t: (key: string) => string): ChatMessage[] {
  return [
    {
      id: "msg-welcome",
      role: "assistant",
      content: t("aiChat.welcomeMessage"),
      type: "text",
      timestamp: new Date().toISOString(),
    },
  ]
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] border border-primary/10">
        <Brain className="h-3.5 w-3.5 text-primary/70" />
      </div>
      <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
</div>
  )
}

function EvidenceBadge({ direction }: { direction: EvidenceItem["direction"] }) {
  const { t } = useLocaleStore()
  const config = {
    supports: { color: "#22c55e", bg: "bg-emerald-500/8", border: "border-emerald-500/25", labelKey: "aiChat.evidenceSupports" as const },
    contradicts: { color: "#ef4444", bg: "bg-red-500/8", border: "border-red-500/25", labelKey: "aiChat.evidenceContradicts" as const },
    neutral: { color: "var(--muted-foreground)", bg: "bg-muted/30", border: "border-border/60", labelKey: "aiChat.evidenceNeutral" as const },
  }
  const c = config[direction]
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border", c.bg, c.border)} style={{ color: c.color }}>
      {t(c.labelKey)}
    </span>
  )
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const { t } = useLocaleStore()
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-md border border-amber-500/15 bg-amber-500/[0.02] overflow-hidden my-1.5">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-amber-500/[0.06] transition-colors">
        <div className="flex size-5 items-center justify-center rounded-md bg-amber-500/8 border border-amber-500/15">
          <Zap className="h-2.5 w-2.5 text-amber-500/80" />
        </div>
        <span className="text-[10px] font-medium text-amber-500/80">{toolCall.name}</span>
        <span className="text-[9px] text-amber-500/40 ml-auto font-mono">{toolCall.duration}</span>
        <ChevronDown className={cn("h-2.5 w-2.5 text-amber-500/40 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 border-t border-amber-500/15 pt-2 space-y-1.5">
          <div>
            <p className="text-[9px] font-medium text-amber-500/60 mb-0.5">{t("aiChat.toolInputParams")}</p>
            <pre className="text-[10px] text-foreground/70 bg-background/50 rounded-md p-1.5 overflow-x-auto font-mono border border-border/50">{JSON.stringify(toolCall.input, null, 2)}</pre>
          </div>
          <div>
            <p className="text-[9px] font-medium text-amber-500/60 mb-0.5">{t("aiChat.toolOutputResult")}</p>
            <p className="text-[10px] text-muted-foreground/60 bg-background/50 rounded-md p-1.5 border border-border/50">{toolCall.output}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfidenceBar({ before, after }: { before: number; after: number }) {
  const { t } = useLocaleStore()
  const delta = after - before
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "same"
  return (
    <div className="rounded-md border border-primary/10 bg-gradient-to-b from-primary/[0.02] to-transparent p-2 my-1.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-primary/70 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary/60" />
          {t("aiChat.confidenceUpdate")}
        </span>
        <span className={cn(
          "inline-flex items-center rounded-md px-1 py-0.5 text-[9px] font-semibold border",
          direction === "down"
            ? "text-emerald-500 bg-emerald-500/6 border-emerald-500/15"
            : direction === "up"
              ? "text-red-500 bg-red-500/6 border-red-500/15"
              : "text-muted-foreground bg-muted/20 border-border/70"
        )}>
          {direction === "down" ? "↓" : direction === "up" ? "↑" : "→"} {Math.abs(delta).toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-muted-foreground/70">{t("aiChat.confidenceBefore")}</span>
            <span className="text-[9px] font-semibold text-foreground/80">{before}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full rounded-full bg-muted-foreground/50 transition-all duration-500" style={{ width: `${before}%` }} />
          </div>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-muted-foreground/70">{t("aiChat.confidenceAfter")}</span>
            <span className="text-[9px] font-semibold text-foreground/80">{after}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", direction === "down" ? "bg-emerald-500/50" : "bg-red-500/50")} style={{ width: `${after}%` }} />
          </div>
        </div>
      </div>

    </div>
  )
}

function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
        >
          <Lightbulb className="h-2.5 w-2.5 text-primary/40" />
          {s}
        </button>
      ))}
    </div>
  )
}

function NextStepCards({ steps, onExecute }: { steps: NextStepItem[]; onExecute: (step: NextStepItem) => void }) {
  const { t } = useLocaleStore()
  return (
    <div className="mt-3 space-y-2 pt-3 border-t border-border/70">
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em] flex items-center gap-1.5">
        <Compass className="h-3 w-3 text-primary/60" /> {t("aiChat.suggestedNextSteps")}
      </p>
      {steps.map((step, i) => (
        <button
          key={`${step.action}-${i}`}
          onClick={() => onExecute(step)}
          className="w-full text-left rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-muted/30 hover:border-primary/20 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/8 border border-primary/15 group-hover:bg-primary/15 transition-colors">
              <ArrowRight className="h-3 w-3 text-primary/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{step.action}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{step.description}</p>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">{step.skill_id}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

const AI_CONTEXT_ITEMS = [
  { label: "当前范围", value: "全域 SOC" },
  { label: "模型", value: "SecMind Reasoner" },
  { label: "证据优先级", value: "高置信 > 近 24h" },
]

const AI_SOURCE_ITEMS = [
  { name: "VPN 网关", status: "已连接", tone: "text-emerald-600" },
  { name: "EDR 传感器", status: "实时同步", tone: "text-emerald-600" },
  { name: "威胁情报库", status: "3 源聚合", tone: "text-primary" },
  { name: "HR 系统", status: "可交叉验证", tone: "text-amber-600" },
]

function AIContextPanel() {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-border bg-card/70 xl:flex xl:flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-background">
            <Compass className="size-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">分析上下文</div>
            <div className="text-[10px] text-muted-foreground">随对话自动更新</div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-lg border border-border bg-background/60 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">当前设置</div>
          <div className="space-y-2">
            {AI_CONTEXT_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="truncate text-right text-[11px] font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">引用数据源</span>
            <span className="text-[10px] text-muted-foreground">{AI_SOURCE_ITEMS.length}</span>
          </div>
          <div className="space-y-2">
            {AI_SOURCE_ITEMS.map((source) => (
              <div key={source.name} className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-2.5 py-2">
                <span className="text-[11px] font-medium text-foreground">{source.name}</span>
                <span className={cn("text-[10px] font-medium", source.tone)}>{source.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background/60 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">可执行能力</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: FileSearch, label: "查证据" },
              { icon: Globe, label: "查 IOC" },
              { icon: ShieldAlert, label: "看告警" },
              { icon: Network, label: "追路径" },
            ].map((item) => (
              <button key={item.label} className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:bg-muted/30">
                <item.icon className="size-3.5 text-primary" />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}

function MessageBubble({ message, onSuggestionSelect, onCopy, onSuggestNextSteps, onExecuteNextStep, isSuggestingNextSteps }: {
  message: ChatMessage
  onSuggestionSelect: (q: string) => void
  onCopy: (text: string) => void
  onSuggestNextSteps: (msgId: string) => void
  onExecuteNextStep: (step: NextStepItem) => void
  isSuggestingNextSteps: boolean
}) {
  const { t } = useLocaleStore()
  const isUser = message.role === "user"

  if (message.isLoading) return <TypingIndicator />

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[76%]">
          <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[10px] text-muted-foreground/70 text-right mt-1.5 pr-1">
            {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border shadow-sm">
        <Brain className="h-4 w-4 text-primary" />
      </div>
      <div className="max-w-[88%] space-y-2">
        <div className="rounded-lg border border-border bg-card shadow-sm px-4 py-3">
          {message.content && (
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{message.content}</p>
          )}

          {message.evidence && message.evidence.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-border/60">
              <p className="text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1 mb-1.5">
                <FileSearch className="h-2.5 w-2.5" /> {t("aiChat.evidenceList")} ({message.evidence.length})
              </p>
              <div className="rounded-lg border border-border overflow-hidden bg-background/30">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left font-semibold text-muted-foreground px-3 py-2 w-20">来源</th>
                      <th className="text-left font-semibold text-muted-foreground px-3 py-2 w-32">时间</th>
                      <th className="text-left font-semibold text-muted-foreground px-3 py-2">详情</th>
                      <th className="text-left font-semibold text-muted-foreground px-3 py-2 w-16">方向</th>
                    </tr>
                  </thead>
                  <tbody>
                    {message.evidence.map((ev) => (
                      <tr key={ev.id} className="border-b border-border/70 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 font-mono text-muted-foreground font-medium">{ev.source}</td>
                        <td className="px-3 py-2 text-muted-foreground/80 font-mono">{ev.timestamp}</td>
                        <td className="px-3 py-2 text-muted-foreground">{ev.detail}</td>
                        <td className="px-3 py-2"><EvidenceBadge direction={ev.direction} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {message.toolCall && <ToolCallCard toolCall={message.toolCall} />}

          {message.confidenceBefore !== undefined && message.confidenceAfter !== undefined && (
            <ConfidenceBar before={message.confidenceBefore} after={message.confidenceAfter} />
          )}

          {message.nextSteps && message.nextSteps.length > 0 && (
            <NextStepCards steps={message.nextSteps} onExecute={onExecuteNextStep} />
          )}
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <SuggestionChips suggestions={message.suggestions} onSelect={onSuggestionSelect} />
        )}

        <div className="flex items-center gap-1.5 pl-0.5">
          <p className="text-[9px] text-muted-foreground/60">
            {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <button onClick={() => onCopy(message.content)} className="text-muted-foreground/50 hover:text-foreground/60 transition-colors" title={t("aiChat.copy")}>
            <Copy className="h-2.5 w-2.5" />
          </button>
          <button className="text-muted-foreground/50 hover:text-emerald-500/70 transition-colors" title={t("aiChat.helpful")}>
            <ThumbsUp className="h-2.5 w-2.5" />
          </button>
          <button className="text-muted-foreground/50 hover:text-red-500/70 transition-colors" title={t("aiChat.notHelpful")}>
            <ThumbsDown className="h-2.5 w-2.5" />
          </button>
          {!message.nextSteps && (
            <button
              onClick={() => onSuggestNextSteps(message.id)}
              disabled={isSuggestingNextSteps}
              className="text-muted-foreground/50 hover:text-primary/60 transition-colors disabled:opacity-10 flex items-center gap-0.5"
              title={t("aiChat.suggestNextStep")}
            >
              <Compass className="h-2.5 w-2.5" />
              <span className="text-[9px]">{t("aiChat.suggestNextStep")}</span>
            </button>
          )}
        </div>
      </div>
      <AIContextPanel />
    </div>
  )
}

function getAIResponse(userQuery: string): ChatMessage[] {
  const q = userQuery.toLowerCase()
  const now = new Date().toISOString()

  if (q.includes("登录") && q.includes("异常")) {
    return [
      {
        id: generateId(),
        role: "assistant",
        type: "tool_call",
        timestamp: now,
        content: "正在查询该账号的登录异常信息…",
        toolCall: {
          name: "query_auth_logs",
          input: { target: "zhangsan@secmind.com", timeframe: "7d" },
          output: "找到 3 条异常登录记录",
          duration: "0.8s",
        },
        isLoading: false,
      },
      {
        id: generateId(),
        role: "assistant",
        type: "evidence_list",
        timestamp: now,
        content: "**账号 zhangsan@secmind.com 登录异常分析结果：**\n\n检测到以下异常点：\n\n① **VPN 异地登录** — 登录地从北京变为哈萨克斯坦阿拉木图（IP: 103.45.67.89）\n② **可疑 C2 通信** — 该 IP 被标记为 APT28 已知基础设施\n③ **时间线吻合** — 异常登录后 3 分钟内出现 PowerShell 编码命令执行\n\n但发现一条**矛盾证据**：HR 系统显示该员工正在哈萨克斯坦出差（5月9日-12日）。",
        evidence: [
          { id: "ev-1", source: "VPN网关", timestamp: "2026-05-09 08:15:23", detail: "源IP 103.45.67.89 → VPN登录成功，地理位置：哈萨克斯坦阿拉木图，与历史模式偏离", direction: "supports" as const },
          { id: "ev-2", source: "EDR传感器", timestamp: "2026-05-09 08:18:05", detail: "WIN-02 检测到 powershell.exe 执行编码命令，进程链异常", direction: "supports" as const },
          { id: "ev-3", source: "防火墙", timestamp: "2026-05-09 08:20:12", detail: "WIN-02 → 103.45.67.89:443 异常外联，流量匹配 C2 心跳模式", direction: "supports" as const },
          { id: "ev-4", source: "威胁情报库", timestamp: "2026-05-09 08:25:00", detail: "IP 103.45.67.89 匹配 APT28 关联基础设施，置信度 0.85", direction: "supports" as const },
          { id: "ev-5", source: "HR系统", timestamp: "2026-05-08 17:30:00", detail: "zhangsan 提交出差申请：5月9日-12日 哈萨克斯坦出差", direction: "contradicts" as const },
        ],
        confidenceBefore: 92,
        confidenceAfter: 45,
        suggestions: ["联系员工确认是否本人操作", "查看出差申请审批人意见", "对比历史出差期间行为基线"],
      },
    ]
  }

  if (q.includes("ip") || q.includes("103.45")) {
    return [
      {
        id: generateId(),
        role: "assistant",
        type: "tool_call",
        timestamp: now,
        content: "正在查询威胁情报…",
        toolCall: {
          name: "threat_intel_lookup",
          input: { ioc: "103.45.67.89", sources: ["virustotal","alienvault","internal"] },
          output: "从 3 个情报源获取到结果",
          duration: "1.2s",
        },
      },
      {
        id: generateId(),
        role: "assistant",
        type: "evidence_list",
        timestamp: now,
        content: "**IP 103.45.67.89 威胁情报报告：**\n\n| 维度 | 结果 |\n|------|------|\n| **威胁评分** | 92/100 🔴 高危 |\n| **标签** | C2节点、APT28、Tor出口 |\n| **首次发现** | 2024-11 |\n| **最近活跃** | 2026-05-10（今天）|\n| **关联组织** | APT28 (Fancy Bear) |\n\n**内部关联：** 该 IP 在过去 24 小时内与 3 台内网设备有过通信。",
        evidence: [
          { id: "ioc-1", source: "VirusTotal", timestamp: "2026-05-10", detail: "Detection rate: 28/93 engines, Tagged as: apt28, c2", direction: "supports" as const },
          { id: "ioc-2", source: "AlienVault OTX", timestamp: "2026-05-10", detail: "Pulse: 92/100, Associated with Cobalt Strike Beacon", direction: "supports" as const },
          { id: "ioc-3", source: "内部流量日志", timestamp: "2026-05-09 20:55", detail: "WIN-02 → 103.45.67.89:443 HTTPS 2.3MB 出站", direction: "supports" as const },
        ],
        suggestions: ["封禁该 IP", "隔离关联终端 WIN-02", "创建狩猎假设追踪"],
      },
    ]
  }

  if (q.includes("态势") || q.includes("今日") || q.includes("总结")) {
    return [
      {
        id: generateId(),
        role: "assistant",
        type: "tool_call",
        timestamp: now,
        content: "正在聚合今日安全数据…",
        toolCall: {
          name: "aggregate_security_posture",
          input: { date: new Date().toISOString().split("T")[0], scope: "all" },
          output: "聚合完成，生成态势摘要",
          duration: "1.5s",
        },
      },
      {
        id: generateId(),
        role: "assistant",
        type: "text",
        timestamp: now,
        content: `**📊 ${new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })} 安全态势概览**

---

**🔴 需要立即关注（2件）**

1. **账号失陷事件** — zhangsan@secmind.com 疑似被盗用，AI 置信度已修正至 45%（需人工确认），已自动执行冻结+隔离
2. **C2 通信检测** — WIN-02 与 APT28 C2 IP (103.45.67.89) 有持续心跳通信

**🟡 待观察（3件）**

3. 内部威胁假设 H-B（linfeng）置信度 54%，持续监控中
4. DNS 隧道查询量较昨日上升 23%（基线偏离）
5. 新增 2 个钓鱼邮件被邮件网关拦截

**🟢 正常**

- 暴力破解防御：今日自动阻断 12 个来源 IP
- WebShell 清除：自动完成 1 次清除操作
- 数据外泄 DLP：无触发

**📈 关键指标**
| 指标 | 今日 | 昨日 | 趋势 |
|------|------|------|------|
| 信号总量 | 1,247 | 1,189 | ↑ 4.9% |
| 自动处置 | 34 | 31 | ↑ 9.7% |
| MTTD | 8.2min | 9.5min | ↓ 13.7% |
| MTTR | 23min | 28min | ↓ 17.9% |`,
        suggestions: ["查看详细告警列表", "导出今日态势报告", "启动全盘威胁狩猎"],
      },
    ]
  }

  if (q.includes("文件") || q.includes("访问")) {
    return [
      {
        id: generateId(),
        role: "assistant",
        type: "tool_call",
        timestamp: now,
        content: "查询文件服务器访问日志…",
        toolCall: {
          name: "query_file_access",
          input: { target: "WIN-02", timeframe: "7d", scope: "sensitive" },
          output: "检索到 47 条访问记录，其中 3 条标记为敏感",
          duration: "0.6s",
        },
      },
      {
        id: generateId(),
        role: "assistant",
        type: "evidence_list",
        timestamp: now,
        content: "**WIN-02 过去 7 天敏感文件访问记录：**\n\n发现 **3 次** 异常敏感目录访问，均发生在非工作时间：",
        evidence: [
          { id: "fa-1", source: "文件服务器", timestamp: "2026-05-09 21:15", detail: "访问 \\\\FILE-SVR01\\财务共享\\2026Q1报表.xlsx (12MB下载)", direction: "supports" as const },
          { id: "fa-2", source: "文件服务器", timestamp: "2026-05-09 21:22", detail: "访问 \\\\FILE-SVR01\\财务共享\\工资明细表.xlsx (8MB下载)", direction: "supports" as const },
          { id: "fa-3", source: "文件服务器", timestamp: "2026-05-09 21:30", detail: "尝试访问 \\\\DC01\\C$ (权限不足被拒)", direction: "supports" as const },
        ],
        confidenceBefore: undefined,
        confidenceAfter: undefined,
        suggestions: ["将此证据加入案件 HT-002", "通知财务部门确认", "检查 DLP 策略是否需要调整"],
      },
    ]
  }

  if (q.includes("横向") || q.includes("移动")) {
    return [
      {
        id: generateId(),
        role: "assistant",
        type: "tool_call",
        timestamp: now,
        content: "扫描内网横向移动行为…",
        toolCall: {
          name: "lateral_movement_scan",
          input: { scope: "internal_network", timeframe: "24h" },
          output: "检测到 2 个疑似横向移动模式",
          duration: "2.1s",
        },
      },
      {
        id: generateId(),
        role: "assistant",
        type: "evidence_list",
        timestamp: now,
        content: "**内网横向移动检测结果：**\n\n发现 **2 个** 可疑的横向移动模式：",
        evidence: [
          { id: "lm-1", source: "EDR传感器", timestamp: "2026-05-09 08:19:30", detail: "WIN-02 → DC01 RDP连接尝试(失败x3)，使用zhangsan凭证", direction: "supports" as const },
          { id: "lm-2", source: "EDR传感器", timestamp: "2026-05-09 08:21:15", detail: "WIN-02 → FILE-SVR01 SMB会话建立，访问财务共享目录", direction: "supports" as const },
        ],
        confidenceBefore: undefined,
        confidenceAfter: undefined,
        suggestions: ["创建横向移动狩猎假设", "立即隔离 WIN-02", "查看域控 Kerberos 日志"],
      },
    ]
  }

  return [
    {
      id: generateId(),
      role: "assistant",
      type: "text",
      timestamp: now,
      content: `我理解你的问题："${userQuery}"\n\n让我来帮你分析和处理。基于当前的安全数据，我建议我们可以从以下几个方面入手：`,
      suggestions: ["展开详细分析", "查看相关告警", "创建调查任务"],
    },
  ]
}

import { usePageTitle } from "@/hooks/use-page-title"

export default function AIChatPage() {
  usePageTitle("ai-chat")
  const { t } = useLocaleStore()

  const QUICK_QUESTIONS = [
    { icon: ShieldAlert, label: t("aiChat.quickQAlertLabel"), query: t("aiChat.quickQAlertQuery") },
    { icon: UserCheck, label: t("aiChat.quickQAccountLabel"), query: t("aiChat.quickQAccountQuery") },
    { icon: Globe, label: t("aiChat.quickQIpLabel"), query: t("aiChat.quickQIpQuery") },
    { icon: FileSearch, label: t("aiChat.quickQFileLabel"), query: t("aiChat.quickQFileQuery") },
    { icon: Network, label: t("aiChat.quickQLateralLabel"), query: t("aiChat.quickQLateralQuery") },
    { icon: History, label: t("aiChat.quickQPostureLabel"), query: t("aiChat.quickQPostureQuery") },
  ]

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(t))
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSuggestingNextSteps, setIsSuggestingNextSteps] = useState(false)
  const [chatContext, setChatContext] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isUserScrolledUpRef = useRef(false)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      isUserScrolledUpRef.current = distanceFromBottom > 120
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      scrollToBottom(true)
    }
  }, [messages, scrollToBottom])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      type: "text",
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsSending(true)
    isUserScrolledUpRef.current = false

    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      type: "text",
      timestamp: new Date().toISOString(),
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMsg])

    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 1000))

    const responses = getAIResponse(input.trim())
    setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id).concat(responses))
    setIsSending(false)
  }

  const handleQuickQuestion = (query: string) => {
    setInput(query)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleSuggestNextSteps = async (msgId: string) => {
    setIsSuggestingNextSteps(true)

    // Collect context from conversation
    const conversationText = messages
      .filter((m) => !m.isLoading)
      .map((m) => m.content)
      .join(" ")
      .toLowerCase()

    const context = { ...chatContext }

    // Auto-detect context from conversation
    const ipMatch = conversationText.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)
    if (ipMatch) context.ioc = ipMatch[0]

    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600))

    // Generate context-aware next step suggestions
    const steps: NextStepItem[] = []

    if (conversationText.includes("告警") || conversationText.includes("异常") || conversationText.includes("alert")) {
      steps.push(
        { action: "深入分析告警", description: "查看告警详情、关联事件和攻击链路", skill_id: "query_alerts", parameters: { action: "analyze" } },
        { action: "查询关联IOC", description: "提取告警中的IOC指标并查询威胁情报", skill_id: "search_threat_intel", parameters: { action: "lookup" } },
        { action: "查看受影响设备", description: "列出告警涉及的设备及其安全状态", skill_id: "query_devices", parameters: { action: "check" } },
      )
    }

    if (conversationText.includes("横向") || conversationText.includes("移动") || conversationText.includes("lateral")) {
      steps.push(
        { action: "绘制攻击路径", description: "基于当前证据还原横向移动路径", skill_id: "query_alerts", parameters: { action: "attack_path" } },
        { action: "隔离受影响终端", description: "对确认失陷的终端执行网络隔离", skill_id: "execute_response", parameters: { action: "isolate" } },
      )
    }

    if (conversationText.includes("ip") || conversationText.includes("c2") || conversationText.includes("威胁情报") || ipMatch) {
      steps.push(
        { action: "封禁恶意IP", description: "将确认恶意的IP加入防火墙黑名单", skill_id: "execute_response", parameters: { action: "block_ip" } },
        { action: "搜索内部关联", description: "查找内网中与该IOC通信的其他设备", skill_id: "query_devices", parameters: { action: "correlate" } },
      )
    }

    if (conversationText.includes("文件") || conversationText.includes("数据") || conversationText.includes("外泄")) {
      steps.push(
        { action: "追溯文件访问链", description: "追踪敏感文件的完整访问和传播路径", skill_id: "query_alerts", parameters: { action: "file_trace" } },
        { action: "检查DLP策略", description: "审查当前DLP策略是否覆盖此类场景", skill_id: "query_alerts", parameters: { action: "dlp_check" } },
      )
    }

    // Default fallback suggestions
    if (steps.length === 0) {
      steps.push(
        { action: "分析最新告警", description: "查看最近的高危告警并给出研判结论", skill_id: "query_alerts", parameters: { action: "analyze_latest" } },
        { action: "查询IOC信誉", description: "对当前关注的IOC指标进行威胁情报查询", skill_id: "search_threat_intel", parameters: { action: "lookup" } },
        { action: "生成调查报告", description: "基于当前对话内容生成调查分析报告", skill_id: "generate_report", parameters: { report_type: "investigation" } },
      )
    }

    // Add the next steps to the specific message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, nextSteps: steps } : m
      )
    )
    setIsSuggestingNextSteps(false)
  }

  const handleExecuteNextStep = (step: NextStepItem) => {
    // Build a natural language query from the step
    const query = step.action + "：" + step.description
    setInput(query)
    setTimeout(() => handleSend(), 100)
  }

  const startNewChat = () => {
    setMessages(getInitialMessages(t))
    setInput("")
    setChatContext({})
    isUserScrolledUpRef.current = false
  }

  const conversationItems = [
    { title: "今日安全态势摘要", meta: "8 分钟前", active: true },
    { title: "VPN 异常登录复核", meta: "32 分钟前", active: false },
    { title: "APT28 C2 IP 情报查询", meta: "昨天", active: false },
    { title: "财务共享目录访问追溯", meta: "昨天", active: false },
  ]

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/70 lg:flex lg:flex-col">
        <div className="border-b border-border p-3">
          <button
            onClick={startNewChat}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            {t("aiChat.newChat")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">会话</div>
          <div className="space-y-1">
            {conversationItems.map((item) => (
              <button
                key={item.title}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                  item.active
                    ? "border-primary/20 bg-primary/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground"
                )}
              >
                <div className="line-clamp-1 text-xs font-medium">{item.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{item.meta}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="size-3.5 text-primary" />
              AI 工作模式
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">优先引用证据、保留不确定性、给出可执行下一步。</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* ========== 精修头部 ========== */}
        <div className="shrink-0 border-b border-border bg-card/80">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/10">
                <Brain className="size-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight">{t("aiChat.pageTitle")}</h1>
                <p className="text-[10px] text-muted-foreground">安全分析 · 证据推理 · 响应建议</p>
              </div>
              <span className="mx-2 h-5 w-px bg-border" />
              <div className="flex items-center gap-1">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">{t("aiChat.engineOnline")}</span>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">RAG 已启用</span>
              <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">4 个数据源</span>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain bg-muted/10">
          <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSuggestionSelect={handleSuggestionSelect}
                onCopy={handleCopy}
                onSuggestNextSteps={handleSuggestNextSteps}
                onExecuteNextStep={handleExecuteNextStep}
                isSuggestingNextSteps={isSuggestingNextSteps}
              />
            ))}

            {!isSending && messages.length <= 1 && (
              <div className="pt-4 space-y-5">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-card border border-border shadow-sm">
                    <Brain className="size-6 text-primary" />
                  </div>
                  <p className="max-w-xl text-center text-sm font-medium leading-relaxed text-muted-foreground">{t("aiChat.welcomeMessage")}</p>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_QUESTIONS.slice(0, 3).map((qq, i) => {
                      const colorConfig = [
                        { border: 'border-l-red-500/60', iconBg: 'bg-red-500/8', iconText: 'text-red-500/80', hoverBorder: 'hover:border-l-red-500/80' },
                        { border: 'border-l-amber-500/60', iconBg: 'bg-amber-500/8', iconText: 'text-amber-500/80', hoverBorder: 'hover:border-l-amber-500/80' },
                        { border: 'border-l-blue-500/60', iconBg: 'bg-blue-500/8', iconText: 'text-blue-500/80', hoverBorder: 'hover:border-l-blue-500/80' },
                      ][i]
                      const descriptions = [t("aiChat.quickQAlertQuery").slice(0, 20) + '…', t("aiChat.quickQAccountQuery").slice(0, 20) + '…', t("aiChat.quickQIpQuery").slice(0, 20) + '…']
                      return (
                        <button
                          key={qq.label}
                          onClick={() => handleQuickQuestion(qq.query)}
                          className={cn("group flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/30 hover:border-primary/20 border-l-2", colorConfig.border, colorConfig.hoverBorder)}
                        >
                          <div className={cn("flex size-7 items-center justify-center rounded-md border border-current/10 shrink-0", colorConfig.iconBg)}>
                            <qq.icon className={cn("h-3.5 w-3.5", colorConfig.iconText)} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-foreground/90 group-hover:text-primary transition-colors">{qq.label}</p>
                            <p className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">{descriptions[i]}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_QUESTIONS.slice(3, 6).map((qq, i) => {
                      const colorConfig = [
                        { border: 'border-l-violet-500/40', iconBg: 'bg-violet-500/6', iconText: 'text-violet-500/60' },
                        { border: 'border-l-orange-500/40', iconBg: 'bg-orange-500/6', iconText: 'text-orange-500/60' },
                        { border: 'border-l-teal-500/40', iconBg: 'bg-teal-500/6', iconText: 'text-teal-500/60' },
                      ][i]
                      const descriptions = [t("aiChat.quickQFileQuery").slice(0, 20) + '…', t("aiChat.quickQLateralQuery").slice(0, 20) + '…', t("aiChat.quickQPostureQuery").slice(0, 20) + '…']
                      return (
                        <button
                          key={qq.label}
                          onClick={() => handleQuickQuestion(qq.query)}
                          className={cn("group flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/30 hover:border-border border-l-2", colorConfig.border)}
                        >
                          <div className={cn("flex size-6 items-center justify-center rounded-md shrink-0", colorConfig.iconBg)}>
                            <qq.icon className={cn("h-3 w-3", colorConfig.iconText)} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground/70 group-hover:text-foreground/80 transition-colors">{qq.label}</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">{descriptions[i]}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* ========== 精修输入区 ========== */}
        <div className="border-t border-border bg-card shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm transition-colors focus-within:border-primary/30">
              <Brain className="h-3.5 w-3.5 text-primary/40 shrink-0 mt-0.5" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("aiChat.inputPlaceholder")}
                name="chat-message"
                autoComplete="off"
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 max-h-32 min-h-[32px] py-0.5 leading-relaxed"
                style={{ fieldSizing: "content" as any }}
              />
              {isSending ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="停止生成"
                  className="text-muted-foreground shrink-0 size-7 rounded-full"
                >
                  <Square className="h-3 w-3 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon-sm"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  aria-label="发送消息"
                  className={cn(
                    "shrink-0 size-8 rounded-lg transition-colors",
                    input.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "bg-muted/40 text-muted-foreground/60 cursor-not-allowed"
                  )}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground/80 mt-1.5 px-0.5">{t("aiChat.aiDisclaimer")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
