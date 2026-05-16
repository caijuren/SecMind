"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Brain,
  Send,
  Square,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight,
  Zap,
  ShieldAlert,
  Globe,
  Clock,
  FileSearch,
  Link2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Hash,
  ArrowRight,
  Lightbulb,
  Database,
  Network,
  UserCheck,
  History,
  Plus,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { softCardClass } from "@/lib/admin-ui"

type Role = "user" | "assistant"
type MessageType = "text" | "evidence_list" | "tool_call" | "confidence_update" | "suggestion" | "error"

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
  isLoading?: boolean
}

const QUICK_QUESTIONS = [
  { icon: ShieldAlert, label: "分析最新告警", query: "帮我分析一下最新的高危告警，给出攻击研判结论" },
  { icon: UserCheck, label: "账号行为分析", query: "zhangsan@secmind.com 这个账号最近有什么异常行为？" },
  { icon: Globe, label: "IP 威胁查询", query: "103.45.67.89 这个IP有什么威胁情报？" },
  { icon: FileSearch, label: "文件访问追溯", query: "查询 WIN-02 设备过去7天的敏感文件访问记录" },
  { icon: Network, label: "横向移动检测", query: "检测内网是否存在横向移动行为" },
  { icon: History, label: "今日安全态势", query: "总结今天的安全态势，有哪些需要关注的事件？" },
]

const MOCK_SESSIONS = [
  { id: "sess-1", title: "VPN异常登录调查", time: "10分钟前", msgCount: 12 },
  { id: "sess-2", title: "APT29钓鱼分析", time: "2小时前", msgCount: 8 },
  { id: "sess-3", title: "数据外泄排查", time: "昨天 16:30", msgCount: 15 },
]

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const initialMessages: ChatMessage[] = [
  {
    id: "msg-welcome",
    role: "assistant",
    content: "你好，我是 SecMind **AI调查助手**。我可以帮你：\n\n• **分析告警** — 自动研判攻击意图和置信度\n• **溯源调查** — 关联证据链，还原攻击路径\n• **威胁查询** — IOC/IP/域名威胁情报关联\n• **处置建议** — 基于置信度推荐处置动作\n\n你可以直接输入问题，或点击下方的快捷提问开始。",
    type: "text",
    timestamp: new Date().toISOString(),
  },
]

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/15 to-teal-500/10 border border-cyan-500/20">
        <Brain className="h-4 w-4 text-cyan-600 animate-pulse" />
      </div>
      <div className={cn(softCardClass, "px-4 py-3 max-w-[85%]")}>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function EvidenceBadge({ direction }: { direction: EvidenceItem["direction"] }) {
  const config = {
    supports: { color: "#22c55e", bg: "bg-emerald-50", border: "border-emerald-200", label: "支持" },
    contradicts: { color: "#ef4444", bg: "bg-red-50", border: "border-red-200", label: "反对" },
    neutral: { color: "#64748b", bg: "bg-slate-50", border: "border-slate-200", label: "中性" },
  }
  const c = config[direction]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border", c.bg, c.border)} style={{ color: c.color }}>
      {c.label}
    </span>
  )
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 overflow-hidden my-2">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-amber-100/40 transition-colors">
        <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-medium text-amber-800">{toolCall.name}</span>
        <span className="text-[10px] text-amber-600 ml-auto">{toolCall.duration}</span>
        <ChevronDown className={cn("h-3 w-3 text-amber-400 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-amber-200/40 pt-2">
          <div>
            <p className="text-[10px] font-semibold text-amber-700 mb-1">输入参数</p>
            <pre className="text-[11px] text-amber-800 bg-amber-100/50 rounded p-2 overflow-x-auto font-mono">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-amber-700 mb-1">返回结果</p>
            <p className="text-[11px] text-amber-800 bg-white rounded p-2 border border-amber-200/50">{toolCall.output}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfidenceBar({ before, after }: { before: number; after: number }) {
  const delta = after - before
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "same"
  return (
    <div className="rounded-lg border border-cyan-200/60 bg-cyan-50/50 p-3 my-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-cyan-800 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
          置信度更新
        </span>
        <span className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
          direction === "down" ? "bg-emerald-100 text-emerald-700" : direction === "up" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
        )}>
          {direction === "down" ? "↓" : direction === "up" ? "↑" : "→"} {Math.abs(delta).toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-cyan-600">调整前</span>
            <span className="text-[10px] font-bold text-cyan-700">{before}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-cyan-100 overflow-hidden">
            <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${before}%` }} />
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-cyan-600">调整后</span>
            <span className="text-[10px] font-bold text-cyan-700">{after}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-cyan-100 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", direction === "down" ? "bg-emerald-400" : "bg-red-400")} style={{ width: `${after}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50/80 px-3 py-1 text-xs text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300 transition-colors"
        >
          <Lightbulb className="h-3 w-3 text-cyan-500" />
          {s}
        </button>
      ))}
    </div>
  )
}

function MessageBubble({ message, onSuggestionSelect, onCopy }: { message: ChatMessage; onSuggestionSelect: (q: string) => void; onCopy: (text: string) => void }) {
  const isUser = message.role === "user"

  if (message.isLoading) return <TypingIndicator />

  if (isUser) {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="max-w-[80%]">
          <div className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-2xl rounded-tr-md px-4 py-2.5 shadow-sm shadow-cyan-200/30">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[10px] text-slate-400 text-right mt-1">
            {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/15 to-teal-500/10 border border-cyan-500/20">
        <Brain className="h-4 w-4 text-cyan-600" />
      </div>
      <div className="max-w-[85%] space-y-2">
        <div className={cn(softCardClass, "px-4 py-3")}>
          {message.content && (
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{message.content}</p>
          )}

          {message.evidence && message.evidence.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <FileSearch className="h-3 w-3" /> 证据列表 ({message.evidence.length})
              </p>
              {message.evidence.map((ev) => (
                <div key={ev.id} className="flex items-start gap-2 rounded-md bg-slate-50 border border-slate-200/60 px-3 py-2">
                  <EvidenceBadge direction={ev.direction} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-cyan-600">{ev.source}</span>
                      <span className="text-[10px] text-slate-400">{ev.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600">{ev.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message.toolCall && <ToolCallCard toolCall={message.toolCall} />}

          {message.confidenceBefore !== undefined && message.confidenceAfter !== undefined && (
            <ConfidenceBar before={message.confidenceBefore} after={message.confidenceAfter} />
          )}
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <SuggestionChips suggestions={message.suggestions} onSelect={onSuggestionSelect} />
        )}

        <div className="flex items-center gap-2 pl-1">
          <p className="text-[10px] text-slate-400">
            {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <button onClick={() => onCopy(message.content)} className="text-slate-300 hover:text-slate-500 transition-colors p-0.5" title="复制">
            <Copy className="h-3 w-3" />
          </button>
          <button className="text-slate-300 hover:text-emerald-500 transition-colors p-0.5" title="有帮助">
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button className="text-slate-300 hover:text-red-400 transition-colors p-0.5" title="无帮助">
            <ThumbsDown className="h-3 w-3" />
          </button>
        </div>
      </div>
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

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sessions, setSessions] = useState(MOCK_SESSIONS)
  const [showSidebar, setShowSidebar] = useState(true)

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

  const startNewChat = () => {
    setMessages(initialMessages)
    setInput("")
    isUserScrolledUpRef.current = false
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6">
      {showSidebar && (
        <div className="w-64 border-r border-slate-200/80 bg-white/60 backdrop-blur-sm flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200/60">
            <Button onClick={startNewChat} variant="outline" size="sm" className="w-full gap-1.5 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
              <Plus className="h-3.5 w-3.5" />
              新建对话
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">历史对话</p>
            {sessions.map((sess) => (
              <button key={sess.id} className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors group">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-medium">{sess.title}</span>
                  <Trash2 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{sess.time} · {sess.msgCount}条消息</p>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200/60">
            <div className={cn(softCardClass, "p-3")}>
              <p className="text-[10px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <Database className="h-3 w-3" /> 数据范围
              </p>
              <div className="space-y-1.5">
                {[
                  { label: "告警数据", range: "近 30 天" },
                  { label: "威胁情报", range: "实时" },
                  { label: "资产数据", range: "全量" },
                  { label: "审计日志", range: "近 90 天" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-mono text-cyan-600 text-[10px]">{item.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-slate-200/80 bg-white/75 backdrop-blur-sm flex items-center gap-3 shrink-0">
          <PageHeader
            icon={Brain}
            title="AI 调查助手"
            subtitle={
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 px-2 py-0 text-[10px] font-medium border border-emerald-200">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  引擎在线
                </span>
                <span className="text-slate-300">|</span>
                <span>支持自然语言提问、IOC查询、攻击链分析</span>
              </span>
            }
            actions={
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ChevronRight className={cn("h-4 w-4 transition-transform", !showSidebar && "rotate-180")} />
                </Button>
              </>
            }
          />
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSuggestionSelect={handleSuggestionSelect}
                onCopy={handleCopy}
              />
            ))}

            {!isSending && messages.length <= 1 && (
              <div className="space-y-4 pt-4">
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> 快捷提问
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {QUICK_QUESTIONS.map((qq) => (
                    <button
                      key={qq.label}
                      onClick={() => handleQuickQuestion(qq.query)}
                      className={cn(
                        softCardClass,
                        "p-3 text-left hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
                      )}
                    >
                      <qq.icon className="h-4 w-4 text-cyan-500 group-hover:text-cyan-600 mb-1.5" />
                      <p className="text-xs font-medium text-slate-700">{qq.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className={cn(softCardClass, "flex items-end gap-3 p-2")}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述你的问题或调查需求… (Enter 发送，Shift+Enter 换行)"
                name="chat-message"
                autoComplete="off"
                rows={1}
                className="flex-1 resize-none rounded-lg border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 max-h-32 min-h-[40px] py-2 px-2"
                style={{ fieldSizing: "content" }}
              />
              {isSending ? (
                <Button size="icon-sm" variant="ghost" className="text-slate-400 shrink-0">
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon-sm"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-slate-400">
                AI 回答基于当前安全数据，重要决策请人工复核
              </p>
              <div className="flex items-center gap-3">
                <button className="text-[10px] text-slate-400 hover:text-cyan-600 transition-colors flex items-center gap-0.5">
                  <Hash className="h-3 w-3" />
                  关联案件
                </button>
                <button className="text-[10px] text-slate-400 hover:text-cyan-600 transition-colors flex items-center gap-0.5">
                  <Link2 className="h-3 w-3" />
                  附带附件
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
