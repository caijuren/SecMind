"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Brain,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Crosshair,
  Target,
  Server,
  User,
  ArrowRight,
  Zap,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useLocaleStore } from "@/store/locale-store"
import { RISK_CONFIG, type RiskLevel } from "@/lib/risk-config"
import { PageHeader } from "@/components/layout/page-header"

type CaseStatus = "ai_reasoning" | "pending_review" | "confirmed" | "disputed"
type CaseTab = CaseStatus | "all" | "high_risk"
type AttackChainStage = "initial_access" | "execution" | "persistence" | "lateral_movement" | "exfiltration"

interface ReasoningStep {
  time: string
  step: string
  detail: string
}

interface FeedbackData {
  rating: "thumbs_up" | "thumbs_down" | null
  comment: string | null
  feedbackType: string | null
  timestamp: string | null
}

interface CaseData {
  id: string
  status: CaseStatus
  riskLevel: RiskLevel
  attackProfile: string
  attackProfileType: string
  aiConclusion: string
  disposalSuggestion: string
  credibility: number
  involvedAssets: string[]
  involvedAccounts: string[]
  attackChainStage: AttackChainStage
  aiReasoningSteps: ReasoningStep[]
  createdAt: string
  feedback: FeedbackData
}

const TABS: { value: CaseTab; labelKey: string }[] = [
  { value: "all", labelKey: "nav.tabAllCases" },
  { value: "pending_review", labelKey: "nav.tabPendingReview" },
  { value: "high_risk", labelKey: "nav.tabHighRisk" },
  { value: "confirmed", labelKey: "nav.tabClosed" },
]

const STAGE_COLORS: Record<AttackChainStage, string> = {
  initial_access: "#22d3ee",
  execution: "#a78bfa",
  persistence: "#f472b6",
  lateral_movement: "#fb923c",
  exfiltration: "#ff4d4f",
}

const STAGE_LABELS: Record<AttackChainStage, string> = {
  initial_access: "INITIAL ACCESS",
  execution: "EXECUTION",
  persistence: "PERSISTENCE",
  lateral_movement: "LATERAL MOVEMENT",
  exfiltration: "EXFILTRATION",
}

const PROFILE_COLORS: Record<string, string> = {
  credential: "#22d3ee",
  malware: "#a78bfa",
  c2: "#f472b6",
  phishing: "#fb923c",
  brute_force: "#ff4d4f",
  exfiltration: "#34d399",
  lateral: "#facc15",
  priv_esc: "#f97316",
}

const PROFILE_LABELS: Record<string, string> = {
  credential: "alerts.typeCredential",
  malware: "alerts.typeMalware",
  c2: "alerts.typeC2",
  phishing: "alerts.typePhishing",
  brute_force: "alerts.typeBruteForce",
  exfiltration: "alerts.typeExfiltration",
  lateral: "alerts.typeLateral",
  priv_esc: "alerts.typePrivEsc",
}

const FEEDBACK_TYPE_OPTIONS = [
  { value: "investigation_correct", label: "cases.feedbackTypeInvestigationCorrect" },
  { value: "investigation_wrong", label: "cases.feedbackTypeInvestigationWrong" },
  { value: "judgment_correct", label: "cases.feedbackTypeJudgmentCorrect" },
  { value: "judgment_wrong", label: "cases.feedbackTypeJudgmentWrong" },
  { value: "disposal_effective", label: "cases.feedbackTypeDisposalEffective" },
  { value: "disposal_ineffective", label: "cases.feedbackTypeDisposalIneffective" },
]

const FEEDBACK_TYPE_COLORS: Record<string, string> = {
  investigation_correct: "#22c55e",
  investigation_wrong: "#ff4d4f",
  judgment_correct: "#22d3ee",
  judgment_wrong: "#f97316",
  disposal_effective: "#34d399",
  disposal_ineffective: "#ef4444",
}

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  investigation_correct: "cases.feedbackTypeInvestigationCorrect",
  investigation_wrong: "cases.feedbackTypeInvestigationWrong",
  judgment_correct: "cases.feedbackTypeJudgmentCorrect",
  judgment_wrong: "cases.feedbackTypeJudgmentWrong",
  disposal_effective: "cases.feedbackTypeDisposalEffective",
  disposal_ineffective: "cases.feedbackTypeDisposalIneffective",
}

const mockCases: CaseData[] = [
  {
    id: "CASE-2026-0042",
    status: "pending_review",
    riskLevel: "critical",
    attackProfile: "credential",
    attackProfileType: "credential",
    aiConclusion: "账号凭证被盗用，攻击者通过VPN异地登录并横向移动至核心服务器",
    disposalSuggestion: "冻结账号 + 隔离受控设备 + 重置VPN凭证",
    credibility: 92,
    involvedAssets: ["ADM-SRV01", "WIN-02", "DC-PRIMARY"],
    involvedAccounts: ["zhang.wei", "admin.svc"],
    attackChainStage: "lateral_movement",
    aiReasoningSteps: [
      { time: "08:31", step: "signals.correlatedTo", detail: "VPN异地登录 + EDR异常进程" },
      { time: "08:32", step: "investigation.aiAnalyzing", detail: "账号行为基线偏离度87%，判定凭证泄露" },
      { time: "08:33", step: "investigation.aiCorrelating", detail: "关联横向移动RDP会话至ADM-SRV01" },
      { time: "08:34", step: "investigation.aiJudging", detail: "置信度92%，建议立即冻结账号并隔离设备" },
    ],
    createdAt: "2026-05-09 08:31",
    feedback: { rating: "thumbs_up", comment: "判断准确，VPN异地登录确实是凭证泄露", feedbackType: "investigation_correct", timestamp: "2026-05-09 09:15" },
  },
  {
    id: "CASE-2026-0043",
    status: "pending_review",
    riskLevel: "critical",
    attackProfile: "exfiltration",
    attackProfileType: "exfiltration",
    aiConclusion: "APT攻击战役，攻击者已建立持久化并开始数据外泄",
    disposalSuggestion: "阻断C2通道 + 隔离数据库 + 保全取证数据",
    credibility: 88,
    involvedAssets: ["FIN-DB-01", "DBA-PROXY", "EXCH-01"],
    involvedAccounts: ["liu.ming", "cfo.wang"],
    attackChainStage: "exfiltration",
    aiReasoningSteps: [
      { time: "08:20", step: "signals.aiDiscovered", detail: "异常数据流量至外部存储blob.store.core" },
      { time: "08:22", step: "investigation.aiAnalyzing", detail: "OAuth应用滥用创建邮件转发规则" },
      { time: "08:25", step: "investigation.aiCorrelating", detail: "关联APT组织TTPs，匹配C2通信模式" },
      { time: "08:28", step: "investigation.aiJudging", detail: "置信度88%，判定为APT攻击战役阶段" },
    ],
    createdAt: "2026-05-09 08:20",
    feedback: { rating: "thumbs_up", comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0044",
    status: "ai_reasoning",
    riskLevel: "high",
    attackProfile: "brute_force",
    attackProfileType: "brute_force",
    aiConclusion: "RDP暴力破解尝试，疑似勒索软件操作者侦察阶段",
    disposalSuggestion: "封禁源IP + 监控目标设备 + 加固RDP策略",
    credibility: 76,
    involvedAssets: ["WS-FLOOR3-12", "DC-PRIMARY"],
    involvedAccounts: ["workstation.svc"],
    attackChainStage: "execution",
    aiReasoningSteps: [
      { time: "09:10", step: "signals.aiDiscovered", detail: "检测到RDP暴力破解行为" },
      { time: "09:12", step: "investigation.aiAnalyzing", detail: "分析攻击模式，匹配勒索软件侦察特征" },
      { time: "09:14", step: "investigation.aiCorrelating", detail: "关联历史勒索软件攻击链模式" },
    ],
    createdAt: "2026-05-09 09:10",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0045",
    status: "pending_review",
    riskLevel: "high",
    attackProfile: "phishing",
    attackProfileType: "phishing",
    aiConclusion: "定向钓鱼攻击，攻击者通过恶意邮件获取初始访问权限",
    disposalSuggestion: "隔离受感染设备 + 重置受影响账号密码 + 通知安全团队",
    credibility: 85,
    involvedAssets: ["WS-HR-08", "MAIL-GW-01"],
    involvedAccounts: ["hr.zhang", "marketing.li"],
    attackChainStage: "initial_access",
    aiReasoningSteps: [
      { time: "07:45", step: "signals.aiDiscovered", detail: "邮件网关检测到钓鱼邮件" },
      { time: "07:47", step: "investigation.aiAnalyzing", detail: "分析邮件内容，判定为定向钓鱼攻击" },
      { time: "07:49", step: "investigation.aiCorrelating", detail: "关联已点击链接的用户终端" },
      { time: "07:51", step: "investigation.aiJudging", detail: "置信度85%，建议隔离受感染设备" },
    ],
    createdAt: "2026-05-09 07:45",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0046",
    status: "confirmed",
    riskLevel: "medium",
    attackProfile: "lateral",
    attackProfileType: "lateral",
    aiConclusion: "内部横向移动行为，已确认为安全团队授权的渗透测试",
    disposalSuggestion: "标记为授权测试 + 关闭案件",
    credibility: 71,
    involvedAssets: ["TEST-SRV-01", "STAGING-DB"],
    involvedAccounts: ["pentest.svc"],
    attackChainStage: "lateral_movement",
    aiReasoningSteps: [
      { time: "06:30", step: "signals.aiDiscovered", detail: "检测到SMB横向移动行为" },
      { time: "06:32", step: "investigation.aiAnalyzing", detail: "分析源账号，匹配渗透测试服务账号" },
      { time: "06:35", step: "investigation.aiJudging", detail: "置信度71%，判定为授权渗透测试" },
    ],
    createdAt: "2026-05-09 06:30",
    feedback: { rating: "thumbs_up", comment: "确实是授权的渗透测试", feedbackType: "judgment_correct", timestamp: "2026-05-09 07:00" },
  },
  {
    id: "CASE-2026-0047",
    status: "ai_reasoning",
    riskLevel: "medium",
    attackProfile: "malware",
    attackProfileType: "malware",
    aiConclusion: "USB投放恶意软件，键盘记录器活跃",
    disposalSuggestion: "隔离设备 + 清除恶意软件 + 审查USB策略",
    credibility: 62,
    involvedAssets: ["WS-HR-08"],
    involvedAccounts: ["hr.chen"],
    attackChainStage: "persistence",
    aiReasoningSteps: [
      { time: "10:05", step: "signals.aiDiscovered", detail: "EDR检测到键盘记录器进程" },
      { time: "10:07", step: "investigation.aiAnalyzing", detail: "分析恶意软件行为模式" },
    ],
    createdAt: "2026-05-09 10:05",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0048",
    status: "confirmed",
    riskLevel: "low",
    attackProfile: "phishing",
    attackProfileType: "phishing",
    aiConclusion: "垃圾钓鱼邮件，无用户点击，风险已消除",
    disposalSuggestion: "关闭案件 + 更新邮件过滤规则",
    credibility: 83,
    involvedAssets: ["MAIL-GW-01"],
    involvedAccounts: ["marketing.li"],
    attackChainStage: "initial_access",
    aiReasoningSteps: [
      { time: "05:15", step: "signals.aiDiscovered", detail: "邮件网关拦截钓鱼邮件" },
      { time: "05:17", step: "investigation.aiAnalyzing", detail: "确认无用户点击，风险已消除" },
      { time: "05:18", step: "investigation.aiJudging", detail: "置信度83%，建议关闭案件" },
    ],
    createdAt: "2026-05-09 05:15",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0049",
    status: "disputed",
    riskLevel: "medium",
    attackProfile: "priv_esc",
    attackProfileType: "priv_esc",
    aiConclusion: "云平台权限提升，疑似IAM配置错误",
    disposalSuggestion: "审查IAM策略 + 收回过度权限",
    credibility: 45,
    involvedAssets: ["AWS-PROD-ACCT"],
    involvedAccounts: ["lambda-exec-role"],
    attackChainStage: "persistence",
    aiReasoningSteps: [
      { time: "04:20", step: "signals.aiDiscovered", detail: "检测到IAM权限异常变更" },
      { time: "04:22", step: "investigation.aiAnalyzing", detail: "分析权限变更模式" },
      { time: "04:24", step: "investigation.aiJudging", detail: "置信度45%，疑似配置错误" },
    ],
    createdAt: "2026-05-09 04:20",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0050",
    status: "pending_review",
    riskLevel: "high",
    attackProfile: "c2",
    attackProfileType: "c2",
    aiConclusion: "C2通信检测，受控设备正在与外部命令控制服务器通信",
    disposalSuggestion: "阻断C2通道 + 隔离受控设备 + 封禁C2域名",
    credibility: 91,
    involvedAssets: ["DEV-WKST-07", "PROXY-GW"],
    involvedAccounts: ["dev.zhou"],
    attackChainStage: "execution",
    aiReasoningSteps: [
      { time: "11:05", step: "signals.aiDiscovered", detail: "检测到异常DNS查询模式" },
      { time: "11:07", step: "investigation.aiAnalyzing", detail: "分析DNS流量，匹配C2通信特征" },
      { time: "11:09", step: "investigation.aiCorrelating", detail: "关联已知C2域名情报" },
      { time: "11:11", step: "investigation.aiJudging", detail: "置信度91%，判定为C2通信" },
    ],
    createdAt: "2026-05-09 11:05",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0051",
    status: "ai_reasoning",
    riskLevel: "low",
    attackProfile: "credential",
    attackProfileType: "credential",
    aiConclusion: "VPN异常登录，正在分析是否为合法用户行为",
    disposalSuggestion: "等待AI分析完成",
    credibility: 38,
    involvedAssets: ["VPN-GW-01"],
    involvedAccounts: ["contractor.wu"],
    attackChainStage: "initial_access",
    aiReasoningSteps: [
      { time: "11:30", step: "signals.aiDiscovered", detail: "VPN异常登录信号" },
      { time: "11:31", step: "investigation.aiAnalyzing", detail: "正在分析用户行为基线..." },
    ],
    createdAt: "2026-05-09 11:30",
    feedback: { rating: null, comment: null, feedbackType: null, timestamp: null },
  },
  {
    id: "CASE-2026-0052",
    status: "confirmed",
    riskLevel: "critical",
    attackProfile: "exfiltration",
    attackProfileType: "exfiltration",
    aiConclusion: "BEC诈骗团伙，已通过OAuth应用窃取财务数据",
    disposalSuggestion: "撤销OAuth应用 + 隔离邮件服务器 + 通知法务",
    credibility: 95,
    involvedAssets: ["EXCH-01", "O365-APP-77", "blob.store.core"],
    involvedAccounts: ["cfo.wang"],
    attackChainStage: "exfiltration",
    aiReasoningSteps: [
      { time: "03:15", step: "signals.aiDiscovered", detail: "检测到OAuth应用异常权限" },
      { time: "03:17", step: "investigation.aiAnalyzing", detail: "分析邮件转发规则，发现数据暂存行为" },
      { time: "03:20", step: "investigation.aiCorrelating", detail: "关联BEC诈骗TTPs" },
      { time: "03:23", step: "investigation.aiJudging", detail: "置信度95%，判定为BEC诈骗" },
    ],
    createdAt: "2026-05-09 03:15",
    feedback: { rating: "thumbs_up", comment: "BEC诈骗判断正确，已撤销OAuth应用", feedbackType: "judgment_correct", timestamp: "2026-05-09 04:00" },
  },
  {
    id: "CASE-2026-0053",
    status: "pending_review",
    riskLevel: "medium",
    attackProfile: "malware",
    attackProfileType: "malware",
    aiConclusion: "供应链攻击，后门植入CI/CD管道",
    disposalSuggestion: "暂停CI/CD管道 + 审查代码提交 + 隔离构建服务器",
    credibility: 65,
    involvedAssets: ["CI-PIPELINE"],
    involvedAccounts: ["deploy.svc"],
    attackChainStage: "persistence",
    aiReasoningSteps: [
      { time: "09:50", step: "signals.aiDiscovered", detail: "检测到CI/CD管道异常构建" },
      { time: "09:52", step: "investigation.aiAnalyzing", detail: "分析构建日志，发现可疑代码注入" },
      { time: "09:55", step: "investigation.aiCorrelating", detail: "关联供应链攻击模式" },
      { time: "09:57", step: "investigation.aiJudging", detail: "置信度65%，疑似供应链攻击" },
    ],
    createdAt: "2026-05-09 09:50",
    feedback: { rating: "thumbs_down", comment: "调查有误，是正常的CI/CD构建而非供应链攻击", feedbackType: "investigation_wrong", timestamp: "2026-05-09 10:30" },
  },
]

function FeedbackDialog({
  open,
  onOpenChange,
  rating,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rating: "thumbs_up" | "thumbs_down"
  onSubmit: (data: { feedbackType: string; comment: string }) => void
}) {
  const { t } = useLocaleStore()
  const [feedbackType, setFeedbackType] = useState("")
  const [comment, setComment] = useState("")
  const isPositive = rating === "thumbs_up"

  const filteredOptions = FEEDBACK_TYPE_OPTIONS.filter((opt) =>
    isPositive
      ? opt.value.includes("correct") || opt.value.includes("effective")
      : opt.value.includes("wrong") || opt.value.includes("ineffective")
  )

  const handleSubmit = () => {
    if (!feedbackType) return
    onSubmit({ feedbackType, comment })
    setFeedbackType("")
    setComment("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a1628] border-cyan-500/20 text-white shadow-[0_0_40px_rgba(0,212,255,0.12)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: isPositive ? "#22c55e15" : "#ff4d4f15",
              }}
            >
              {isPositive ? (
                <ThumbsUp className="size-4 text-emerald-400" />
              ) : (
                <ThumbsDown className="size-4 text-red-400" />
              )}
            </div>
            {isPositive ? t("cases.thumbsUpTitle") : t("cases.thumbsDownTitle")}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            {isPositive ? t("cases.thumbsUpDesc") : t("cases.thumbsDownDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <span className="text-xs text-white/60 font-medium">
              {t("cases.feedbackTypeLabel")} <span className="text-red-400">*</span>
            </span>
            <div className="grid grid-cols-1 gap-2">
              {filteredOptions.map((opt) => {
                const color = FEEDBACK_TYPE_COLORS[opt.value]
                const isSelected = feedbackType === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFeedbackType(opt.value)}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all"
                    style={{
                      borderColor: isSelected ? `${color}60` : "rgba(255,255,255,0.08)",
                      backgroundColor: isSelected ? `${color}12` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      className="flex size-4 items-center justify-center rounded-full border"
                      style={{
                        borderColor: isSelected ? color : "rgba(255,255,255,0.15)",
                        backgroundColor: isSelected ? color : "transparent",
                      }}
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <span style={{ color: isSelected ? color : "rgba(255,255,255,0.6)" }}>
                      {t(opt.label)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-white/60 font-medium">
              {t("cases.feedbackCommentLabel")}
            </span>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("cases.feedbackCommentPlaceholder")}
              className="min-h-[80px] bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:ring-cyan-500/20 resize-none text-xs"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!feedbackType}
            className="w-full h-9 font-semibold gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPositive ? <ThumbsUp className="size-3.5" /> : <ThumbsDown className="size-3.5" />}
            {t("cases.submitFeedback")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CredibilityBar({ value }: { value: number }) {
  const color = value >= 80 ? "#22d3ee" : value >= 50 ? "#faad14" : "#64748b"
  const glow = value >= 80
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            boxShadow: glow ? `0 0 12px ${color}80` : `0 0 4px ${color}40`,
          }}
        />
      </div>
      <span
        className="font-mono text-xs font-bold"
        style={{
          color,
          textShadow: glow ? `0 0 8px ${color}60` : undefined,
        }}
      >
        {value}%
      </span>
    </div>
  )
}

function AttackProfileBadge({ type }: { type: string }) {
  const { t } = useLocaleStore()
  const color = PROFILE_COLORS[type] || "#22d3ee"
  const labelKey = PROFILE_LABELS[type]
  return (
    <Badge
      variant="outline"
      className="gap-1.5 rounded-md text-[11px] font-semibold"
      style={{
        backgroundColor: `${color}15`,
        color,
        borderColor: `${color}35`,
      }}
    >
      <Crosshair className="h-3 w-3" />
      {labelKey ? t(labelKey) : type}
    </Badge>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level]
  return (
    <Badge
      className="gap-1.5 text-[11px] font-bold tracking-wider"
      style={{
        backgroundColor: `${config.hex}15`,
        color: config.hex,
        borderColor: `${config.hex}40`,
        textShadow: level === "critical" ? `0 0 8px ${config.hex}60` : undefined,
      }}
    >
      <AlertTriangle className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function StageBadge({ stage }: { stage: AttackChainStage }) {
  const color = STAGE_COLORS[stage]
  return (
    <Badge
      variant="outline"
      className="gap-1.5 text-[11px] font-bold tracking-wider"
      style={{
        backgroundColor: `${color}12`,
        color,
        borderColor: `${color}30`,
      }}
    >
      <Target className="h-3 w-3" />
      {STAGE_LABELS[stage]}
    </Badge>
  )
}

function AssetTag({ name, type }: { name: string; type: "asset" | "account" }) {
  const color = type === "asset" ? "#22d3ee" : "#a78bfa"
  const Icon = type === "asset" ? Server : User
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono font-semibold"
      style={{
        backgroundColor: `${color}12`,
        color,
        border: `1px solid ${color}25`,
      }}
    >
      <Icon className="h-2.5 w-2.5" />
      {name}
    </span>
  )
}

function CaseCard({
  caseData,
  isSelected,
  onSelect,
  onFeedback,
}: {
  caseData: CaseData
  isSelected: boolean
  onSelect: () => void
  onFeedback: (caseId: string, data: { rating: "thumbs_up" | "thumbs_down"; feedbackType: string; comment: string }) => void
}) {
  const { t } = useLocaleStore()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [pendingRating, setPendingRating] = useState<"thumbs_up" | "thumbs_down">("thumbs_up")
  const isHighRisk = caseData.riskLevel === "critical" || caseData.riskLevel === "high"
  const isPending = caseData.status === "pending_review"
  const borderColor = isHighRisk ? RISK_CONFIG[caseData.riskLevel].hex : isPending ? "#faad14" : "#22d3ee"
  const hasFeedback = caseData.feedback.rating !== null

  return (
    <Card
      className="overflow-hidden transition-all cursor-pointer"
      onClick={onSelect}
      style={{
        background: "oklch(0.12 0.04 264 / 60%)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${isSelected ? "#22d3ee" : `${borderColor}20`}`,
        borderLeftWidth: "3px",
        borderLeftColor: isSelected ? "#22d3ee" : borderColor,
        borderRadius: "var(--radius-lg)",
        boxShadow: isSelected
          ? "0 0 20px rgba(34,211,238,0.12), inset 0 0 20px rgba(34,211,238,0.03)"
          : isHighRisk
            ? `0 0 15px ${borderColor}08, inset 0 0 15px ${borderColor}02`
            : undefined,
      }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="font-mono text-sm font-bold text-cyan-400"
                style={{ textShadow: "0 0 8px rgba(34,211,238,0.3)" }}
              >
                {caseData.id}
              </span>
              <AttackProfileBadge type={caseData.attackProfileType} />
              <RiskBadge level={caseData.riskLevel} />
              <StageBadge stage={caseData.attackChainStage} />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 opacity-60" />
              {caseData.createdAt}
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-cyan-500/10 bg-cyan-500/[0.04] p-2.5">
            <Brain className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400/70">
                  {t("alerts.aiConclusion")}
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">{caseData.aiConclusion}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                {t("alerts.credibility")}
              </span>
              <CredibilityBar value={caseData.credibility} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "收起详情" : "展开详情"}
            </button>
            <div className="flex items-center gap-2">
              {hasFeedback ? (
                <div className="flex items-center gap-1.5">
                  {caseData.feedback.rating === "thumbs_up" ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "#22c55e15",
                        color: "#22c55e",
                        border: "1px solid #22c55e30",
                      }}
                    >
                      <ThumbsUp className="h-2.5 w-2.5" />
                      {t("cases.thumbsUp")}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "#ff4d4f15",
                        color: "#ff4d4f",
                        border: "1px solid #ff4d4f30",
                      }}
                    >
                      <ThumbsDown className="h-2.5 w-2.5" />
                      {t("cases.thumbsDown")}
                    </span>
                  )}
                  {caseData.feedback.feedbackType && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${FEEDBACK_TYPE_COLORS[caseData.feedback.feedbackType]}15`,
                        color: FEEDBACK_TYPE_COLORS[caseData.feedback.feedbackType],
                        border: `1px solid ${FEEDBACK_TYPE_COLORS[caseData.feedback.feedbackType]}30`,
                      }}
                    >
                      {t(FEEDBACK_TYPE_LABELS[caseData.feedback.feedbackType])}
                    </span>
                  )}
                  {caseData.feedback.comment && (
                    <span className="flex items-center gap-0.5 text-xs text-white/40">
                      <MessageSquare className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingRating("thumbs_up")
                      setFeedbackDialogOpen(true)
                    }}
                    className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingRating("thumbs_down")
                      setFeedbackDialogOpen(true)
                    }}
                    className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Button
                size="xs"
                className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/response?from=case&id=${caseData.id}&risk=${caseData.riskLevel}&profile=${caseData.attackProfileType}`)
                }}
              >
                <ArrowUpRight className="h-3 w-3" />
                AI处置
              </Button>
              <Button
                size="xs"
                className="bg-emerald-600/80 text-white hover:bg-emerald-500 gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <CheckCircle2 className="h-3 w-3" />
                {t("alerts.markAsRead")}
              </Button>
            </div>
          </div>

          {hasFeedback && caseData.feedback.comment && (
            <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <MessageSquare className="h-3.5 w-3.5 text-white/30 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                    {t("cases.userFeedback")}
                  </span>
                  {caseData.feedback.timestamp && (
                    <span className="text-xs text-white/20 font-mono">{caseData.feedback.timestamp}</span>
                  )}
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{caseData.feedback.comment}</p>
              </div>
            </div>
          )}

          <FeedbackDialog
            open={feedbackDialogOpen}
            onOpenChange={setFeedbackDialogOpen}
            rating={pendingRating}
            onSubmit={(data) => {
              onFeedback(caseData.id, { rating: pendingRating, ...data })
            }}
          />

          {expanded && (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400/70">
                      {t("alerts.disposalSuggestion")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{caseData.disposalSuggestion}</p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    {t("alerts.involvedAssets")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {caseData.involvedAssets.map((asset, i) => (
                      <AssetTag key={i} name={asset} type="asset" />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    {t("alerts.involvedAccounts")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {caseData.involvedAccounts.map((account, i) => (
                      <AssetTag key={i} name={account} type="account" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.03] p-3">
                <div className="relative">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/30 via-white/10 to-transparent" />
                  <div className="space-y-3">
                    {caseData.aiReasoningSteps.map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-3 pl-6">
                        <div
                          className="absolute left-0 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full"
                          style={{
                            backgroundColor: "#22d3ee20",
                            border: "1.5px solid #22d3ee",
                            boxShadow: "0 0 6px #22d3ee40",
                          }}
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-white/30">{step.time}</span>
                            <span className="text-xs font-medium text-cyan-400/80">{t(step.step)}</span>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ReasoningPanel({ caseData }: { caseData: CaseData }) {
  const { t } = useLocaleStore()

  return (
    <div className="sticky top-4 space-y-4">
      <div
        className="rounded-xl border border-cyan-500/15 bg-white/[0.04] backdrop-blur-xl p-5"
        style={{ boxShadow: "0 0 16px rgba(34,211,238,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white/80">{t("alerts.aiReasoningProcess")}</h3>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className="font-mono text-sm font-bold text-cyan-400"
            style={{ textShadow: "0 0 8px rgba(34,211,238,0.3)" }}
          >
            {caseData.id}
          </span>
          <AttackProfileBadge type={caseData.attackProfileType} />
        </div>

        <div className="mb-4">
          <CredibilityBar value={caseData.credibility} />
        </div>

        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 via-cyan-500/20 to-transparent" />
          <div className="space-y-5">
            {caseData.aiReasoningSteps.map((step, idx) => {
              const isLast = idx === caseData.aiReasoningSteps.length - 1
              return (
                <div key={idx} className="relative flex items-start gap-4 pl-8">
                  <div
                    className="absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "#22d3ee20",
                      border: `1.5px solid ${isLast ? "#22d3ee" : "#22d3ee60"}`,
                      boxShadow: isLast ? "0 0 10px #22d3ee50" : "0 0 4px #22d3ee20",
                    }}
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: isLast ? "#22d3ee" : "#22d3ee80",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-white/30">{step.time}</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: isLast ? "#22d3ee" : "#22d3ee80" }}
                      >
                        {t(step.step)}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{step.detail}</p>
                    {isLast && (
                      <div
                        className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: "#22d3ee15",
                          color: "#22d3ee",
                          border: "1px solid #22d3ee30",
                        }}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        {t("alerts.aiConclusion")}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card-default p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white/80">{t("alerts.disposalSuggestion")}</h3>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">{caseData.disposalSuggestion}</p>
      </div>

      <div className="card-default p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white/80">{t("alerts.involvedAssets")}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {caseData.involvedAssets.map((asset, i) => (
            <AssetTag key={i} name={asset} type="asset" />
          ))}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white/80">{t("alerts.involvedAccounts")}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {caseData.involvedAccounts.map((account, i) => (
            <AssetTag key={i} name={account} type="account" />
          ))}
        </div>
      </div>

      {caseData.feedback.rating && (
        <div
          className="rounded-xl border backdrop-blur-xl p-5"
          style={{
            borderColor: caseData.feedback.rating === "thumbs_up" ? "rgba(34,197,94,0.2)" : "rgba(255,77,79,0.2)",
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            {caseData.feedback.rating === "thumbs_up" ? (
              <ThumbsUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-400" />
            )}
            <h3 className="text-sm font-semibold text-white/80">{t("cases.userFeedback")}</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {caseData.feedback.rating === "thumbs_up" ? (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: "#22c55e15",
                  color: "#22c55e",
                  border: "1px solid #22c55e30",
                }}
              >
                <ThumbsUp className="h-3 w-3" />
                {t("cases.thumbsUp")}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: "#ff4d4f15",
                  color: "#ff4d4f",
                  border: "1px solid #ff4d4f30",
                }}
              >
                <ThumbsDown className="h-3 w-3" />
                {t("cases.thumbsDown")}
              </span>
            )}
            {caseData.feedback.feedbackType && (
              <span
                className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${FEEDBACK_TYPE_COLORS[caseData.feedback.feedbackType]}15`,
                  color: FEEDBACK_TYPE_COLORS[caseData.feedback.feedbackType],
                  border: `1px solid ${FEEDBACK_TYPE_COLORS[caseData.feedback.feedbackType]}30`,
                }}
              >
                {t(FEEDBACK_TYPE_LABELS[caseData.feedback.feedbackType])}
              </span>
            )}
            {caseData.feedback.timestamp && (
              <span className="text-xs text-white/20 font-mono ml-auto">{caseData.feedback.timestamp}</span>
            )}
          </div>
          {caseData.feedback.comment && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 mt-2">
              <p className="text-xs text-white/60 leading-relaxed">{caseData.feedback.comment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CasesPage() {
  const { t } = useLocaleStore()
  const [activeTab, setActiveTab] = useState<CaseTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all")
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [cases, setCases] = useState<CaseData[]>(mockCases)

  const handleFeedback = useCallback((caseId: string, data: { rating: "thumbs_up" | "thumbs_down"; feedbackType: string; comment: string }) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              feedback: {
                rating: data.rating,
                comment: data.comment || null,
                feedbackType: data.feedbackType,
                timestamp: new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\//g, "-"),
              },
            }
          : c
      )
    )
  }, [])

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (activeTab === "pending_review" && c.status !== "pending_review") return false
      if (activeTab === "high_risk" && (c.riskLevel !== "critical" && c.riskLevel !== "high")) return false
      if (activeTab === "confirmed" && c.status !== "confirmed" && c.status !== "disputed") return false
      if (activeTab === "ai_reasoning" && c.status !== "ai_reasoning") return false
      if (riskFilter !== "all" && c.riskLevel !== riskFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          c.id.toLowerCase().includes(q) ||
          c.aiConclusion.toLowerCase().includes(q) ||
          c.attackProfile.toLowerCase().includes(q) ||
          c.involvedAssets.some((a) => a.toLowerCase().includes(q)) ||
          c.involvedAccounts.some((a) => a.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  }, [activeTab, riskFilter, searchQuery, cases])

  const stats = useMemo(() => {
    const total = cases.length
    const aiReasoning = cases.filter((c) => c.status === "ai_reasoning").length
    const pendingReview = cases.filter((c) => c.status === "pending_review").length
    const confirmed = cases.filter((c) => c.status === "confirmed").length
    const thumbsUp = cases.filter((c) => c.feedback.rating === "thumbs_up").length
    const thumbsDown = cases.filter((c) => c.feedback.rating === "thumbs_down").length
    return { total, aiReasoning, pendingReview, confirmed, thumbsUp, thumbsDown }
  }, [cases])

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null
    return cases.find((c) => c.id === selectedCaseId) || null
  }, [selectedCaseId, cases])

  const handleTabChange = useCallback((tab: CaseTab) => {
    setActiveTab(tab)
    setSelectedCaseId(null)
  }, [])

  const handleRiskFilterChange = useCallback((v: string | null) => {
    setRiskFilter((v ?? "all") as RiskLevel | "all")
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Shield}
        title={t("alerts.title")}
      />

      <div
        className="flex items-center gap-5 rounded-lg border px-5 py-3 text-sm"
        style={{
          borderColor: "rgba(34,211,238,0.15)",
          backgroundColor: "rgba(34,211,238,0.03)",
        }}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t("alerts.total")}
          </span>
          <span className="font-mono font-bold text-base text-foreground">{stats.total}</span>
        </div>
        <span className="h-4 w-px bg-cyan-500/15" />
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t("alerts.statusNew")}
          </span>
          <span
            className="font-mono font-bold text-base"
            style={{
              color: "#22d3ee",
              textShadow: "0 0 8px rgba(34,211,238,0.5)",
              animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          >
            {stats.aiReasoning}
          </span>
        </div>
        <span className="h-4 w-px bg-cyan-500/15" />
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t("alerts.statusSeen")}
          </span>
          <span
            className="font-mono font-bold text-base"
            style={{ color: "#faad14" }}
          >
            {stats.pendingReview}
          </span>
        </div>
        <span className="h-4 w-px bg-cyan-500/15" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t("alerts.statusIgnored")}
          </span>
          <span
            className="font-mono font-bold text-base"
            style={{ color: "#52c41a" }}
          >
            {stats.confirmed}
          </span>
        </div>
        <span className="h-4 w-px bg-cyan-500/15" />
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t("cases.thumbsUp")}
          </span>
          <span
            className="font-mono font-bold text-base"
            style={{ color: "#22c55e" }}
          >
            {stats.thumbsUp}
          </span>
        </div>
        <span className="h-4 w-px bg-cyan-500/15" />
        <div className="flex items-center gap-2">
          <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t("cases.thumbsDown")}
          </span>
          <span
            className="font-mono font-bold text-base"
            style={{ color: "#ff4d4f" }}
          >
            {stats.thumbsDown}
          </span>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as CaseTab)}>
            <TabsList variant="line" className="border-b border-white/10 justify-start gap-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-white/60 data-active:text-cyan-400"
                >
                  {t(tab.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="h-5 w-px bg-cyan-500/10" />

          <Select value={riskFilter} onValueChange={handleRiskFilterChange}>
            <SelectTrigger className="h-8 w-[130px] border-cyan-500/15 bg-white/5 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-foreground">
              <SelectItem value="all">{t("alerts.allRiskLevels")}</SelectItem>
              <SelectItem value="critical">{t("alerts.riskCritical")}</SelectItem>
              <SelectItem value="high">{t("alerts.riskHigh")}</SelectItem>
              <SelectItem value="medium">{t("alerts.riskMedium")}</SelectItem>
              <SelectItem value="low">{t("alerts.riskLow")}</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("alerts.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-white/5 border-cyan-500/15 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {filteredCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              caseData={caseData}
              isSelected={selectedCaseId === caseData.id}
              onSelect={() => setSelectedCaseId(caseData.id)}
              onFeedback={handleFeedback}
            />
          ))}
          {filteredCases.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-sm text-muted-foreground">
              {t("common.noData")}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedCase ? (
            <ReasoningPanel caseData={selectedCase} />
          ) : (
            <div className="sticky top-4 flex h-64 items-center justify-center card-default">
              <div className="flex flex-col items-center gap-3 text-center">
                <Brain className="h-8 w-8 text-cyan-500/30" />
                <p className="text-sm text-white/30">{t("alerts.aiReasoningProcess")}</p>
                <p className="text-xs text-white/20">{t("alerts.viewDetail")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
