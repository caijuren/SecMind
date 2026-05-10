"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Brain,
  ChevronRight,
  Clock,
  AlertTriangle,
  Shield,
  Sparkles,
  Radio,
  Crosshair,
  CheckCircle2,
  Network,
  Activity,
  Zap,
  GitBranch,
  Target,
  UserX,
  Globe,
  Server,
  Fingerprint,
  Eye,
  Link2,
  Layers,
  Workflow,
  Share2,
  Monitor,
  Mail,
  Cpu,
  Database,
  Lock,
  Unlock,
  Flag,
  CircleDot,
  MoveRight,
  Hexagon,
  TriangleAlert,
  CircleCheck,
  CircleSlash,
  Timer,
  Flame,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { RISK_CONFIG, type RiskLevel } from "@/lib/risk-config"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"
import { useAuthStore } from "@/store/auth-store"

type AIFeedStatus = "investigating" | "reasoning" | "confirmed" | "escalated"

interface AIReasoningStep {
  label: string
  type: "discover" | "correlate" | "judge"
}

interface AIFeedItem {
  id: string
  investigationId: string
  steps: AIReasoningStep[]
  status: AIFeedStatus
  confidence: number
  timestamp: string
  entities: string[]
}

interface AttackChainEntry {
  id: string
  chain: string[]
  risk: "critical" | "high" | "medium"
  investigationId: string
}

interface MITREStage {
  stage: string
  count: number
  color: string
}

interface RiskEntry {
  entity: string
  type: string
  score: number
  trend: "up" | "stable" | "down"
}

interface LatestCase {
  id: string
  title: string
  status: "investigating" | "reasoning" | "confirmed" | "closed"
  risk: "critical" | "high" | "medium" | "low"
  updated: string
}

interface HighRiskEntity {
  name: string
  type: "user" | "host" | "ip"
  score: number
  reason: string
}

interface LateralRelation {
  source: string
  target: string
  method: string
  risk: "critical" | "high" | "medium"
}

interface KillChainStage {
  name: string
  nameEn: string
  active: boolean
  techniques: { id: string; name: string; confidence: number; entities: string[] }[]
}

interface MITRETactic {
  tactic: string
  techniques: { id: string; name: string; active: boolean; count: number }[]
}

interface GraphNode {
  id: string
  label: string
  type: "user" | "device" | "ip" | "email" | "process" | "domain"
  x: number
  y: number
  risk: number
}

interface GraphEdge {
  source: string
  target: string
  label: string
}

interface TimelineEvent {
  id: string
  time: string
  title: string
  description: string
  risk: "critical" | "high" | "medium" | "low" | "info"
  aiAssessment: string
  aiType: "supports" | "contradicts" | "neutral"
  icon: "alert" | "shield" | "brain" | "lock" | "eye" | "zap"
}

const aiFeedItems: AIFeedItem[] = [
  {
    id: "feed-1",
    investigationId: "INV-2026-0042",
    steps: [
      { label: "AI发现异常VPN登录位置", type: "discover" },
      { label: "关联到终端PowerShell执行", type: "correlate" },
      { label: "AI判断：疑似横向移动", type: "judge" },
    ],
    status: "investigating",
    confidence: 92,
    timestamp: "2分钟前",
    entities: ["user-zhangwei", "10.0.4.22"],
  },
  {
    id: "feed-2",
    investigationId: "INV-2026-0039",
    steps: [
      { label: "AI检测到凭证读取行为", type: "discover" },
      { label: "关联到域控权限提升", type: "correlate" },
      { label: "AI判断：账号失陷", type: "judge" },
    ],
    status: "reasoning",
    confidence: 87,
    timestamp: "5分钟前",
    entities: ["DC-01", "lsass.exe"],
  },
  {
    id: "feed-3",
    investigationId: "INV-2026-0035",
    steps: [
      { label: "AI发现RDP暴力破解", type: "discover" },
      { label: "关联到内网横向扩散", type: "correlate" },
      { label: "AI判断：勒索软件前兆", type: "judge" },
    ],
    status: "escalated",
    confidence: 78,
    timestamp: "8分钟前",
    entities: ["185.220.101.34", "10.0.4.0/24"],
  },
  {
    id: "feed-4",
    investigationId: "INV-2026-0031",
    steps: [
      { label: "AI识别钓鱼邮件附件", type: "discover" },
      { label: "关联到宏代码执行", type: "correlate" },
      { label: "AI判断：恶意软件投递", type: "judge" },
    ],
    status: "investigating",
    confidence: 71,
    timestamp: "12分钟前",
    entities: ["finance@corp.com", "WIN-DESK-15"],
  },
  {
    id: "feed-5",
    investigationId: "INV-2026-0028",
    steps: [
      { label: "AI发现异常VPN会话", type: "discover" },
      { label: "关联到非工作时间数据传输", type: "correlate" },
      { label: "AI判断：数据外泄风险", type: "judge" },
    ],
    status: "reasoning",
    confidence: 65,
    timestamp: "18分钟前",
    entities: ["vpn-user-liuchen", "103.45.67.89"],
  },
  {
    id: "feed-6",
    investigationId: "INV-2026-0025",
    steps: [
      { label: "AI检测到C2信标通信", type: "discover" },
      { label: "关联到DNS隧道数据暂存", type: "correlate" },
      { label: "AI判断：APT数据窃取", type: "judge" },
    ],
    status: "confirmed",
    confidence: 94,
    timestamp: "22分钟前",
    entities: ["host-srv-03", "evil-domain.xyz"],
  },
  {
    id: "feed-7",
    investigationId: "INV-2026-0022",
    steps: [
      { label: "AI发现特权账号异常登录", type: "discover" },
      { label: "关联到敏感文件访问", type: "correlate" },
      { label: "AI判断：内部威胁", type: "judge" },
    ],
    status: "investigating",
    confidence: 54,
    timestamp: "28分钟前",
    entities: ["admin-wang", "fileserver-01"],
  },
  {
    id: "feed-8",
    investigationId: "INV-2026-0019",
    steps: [
      { label: "AI检测到Web注入攻击", type: "discover" },
      { label: "关联到数据库异常查询", type: "correlate" },
      { label: "AI判断：SQL注入数据窃取", type: "judge" },
    ],
    status: "confirmed",
    confidence: 88,
    timestamp: "35分钟前",
    entities: ["web-app-02", "db-server-01"],
  },
]

const attackChains: AttackChainEntry[] = [
  {
    id: "ac-1",
    chain: ["钓鱼邮件", "宏执行", "C2建立", "横向移动", "数据外泄"],
    risk: "critical",
    investigationId: "INV-2026-0042",
  },
  {
    id: "ac-2",
    chain: ["VPN爆破", "凭证窃取", "权限提升", "域控接管"],
    risk: "high",
    investigationId: "INV-2026-0039",
  },
  {
    id: "ac-3",
    chain: ["RDP暴力", "内网扩散", "勒索部署"],
    risk: "critical",
    investigationId: "INV-2026-0035",
  },
  {
    id: "ac-4",
    chain: ["供应链投毒", "恶意更新", "后门植入"],
    risk: "high",
    investigationId: "INV-2026-0031",
  },
  {
    id: "ac-5",
    chain: ["社工攻击", "VPN劫持", "数据暂存"],
    risk: "medium",
    investigationId: "INV-2026-0028",
  },
]

const mitreStages: MITREStage[] = [
  { stage: "Initial Access", count: 8, color: "text-[#ff4d4f]" },
  { stage: "Execution", count: 12, color: "text-amber-400" },
  { stage: "Persistence", count: 5, color: "text-orange-400" },
  { stage: "Priv Escalation", count: 7, color: "text-[#ff4d4f]" },
  { stage: "Defense Evasion", count: 4, color: "text-amber-400" },
  { stage: "Credential Access", count: 9, color: "text-[#ff4d4f]" },
  { stage: "Discovery", count: 3, color: "text-cyan-400" },
  { stage: "Lateral Movement", count: 6, color: "text-amber-400" },
  { stage: "Exfiltration", count: 4, color: "text-[#ff4d4f]" },
  { stage: "Command & Control", count: 7, color: "text-amber-400" },
]

const riskEntries: RiskEntry[] = [
  { entity: "DC-01", type: "host", score: 96, trend: "up" },
  { entity: "user-zhangwei", type: "user", score: 91, trend: "up" },
  { entity: "10.0.4.22", type: "ip", score: 85, trend: "stable" },
  { entity: "WIN-DESK-15", type: "host", score: 78, trend: "up" },
  { entity: "finance@corp.com", type: "user", score: 72, trend: "down" },
  { entity: "185.220.101.34", type: "ip", score: 68, trend: "stable" },
]

const latestCases: LatestCase[] = [
  { id: "INV-2026-0042", title: "VPN异常 → 横向移动", status: "investigating", risk: "critical", updated: "2分钟前" },
  { id: "INV-2026-0039", title: "凭证窃取 → 域控失陷", status: "reasoning", risk: "critical", updated: "5分钟前" },
  { id: "INV-2026-0035", title: "RDP暴力 → 勒索前兆", status: "investigating", risk: "high", updated: "8分钟前" },
  { id: "INV-2026-0031", title: "钓鱼邮件 → 恶意投递", status: "confirmed", risk: "high", updated: "12分钟前" },
  { id: "INV-2026-0028", title: "异常VPN → 数据外泄", status: "reasoning", risk: "medium", updated: "18分钟前" },
  { id: "INV-2026-0025", title: "C2通信 → APT窃取", status: "confirmed", risk: "critical", updated: "22分钟前" },
]

const highRiskEntities: HighRiskEntity[] = [
  { name: "DC-01", type: "host", score: 96, reason: "域控异常认证" },
  { name: "user-zhangwei", type: "user", score: 91, reason: "凭证疑似失陷" },
  { name: "10.0.4.22", type: "ip", score: 85, reason: "横向移动源" },
  { name: "WIN-DESK-15", type: "host", score: 78, reason: "恶意进程执行" },
  { name: "finance@corp.com", type: "user", score: 72, reason: "钓鱼邮件目标" },
]

const lateralRelations: LateralRelation[] = [
  { source: "user-zhangwei", target: "10.0.4.22", method: "PsExec", risk: "critical" },
  { source: "10.0.4.22", target: "DC-01", method: "PTH", risk: "critical" },
  { source: "DC-01", target: "WIN-DESK-15", method: "WMI", risk: "high" },
  { source: "WIN-DESK-15", target: "db-server-01", method: "RDP", risk: "high" },
  { source: "finance@corp.com", target: "WIN-DESK-15", method: "SMB", risk: "medium" },
]

const killChainStages: KillChainStage[] = [
  {
    name: "侦察", nameEn: "Reconnaissance", active: true,
    techniques: [
      { id: "T1595", name: "主动扫描", confidence: 92, entities: ["185.220.101.34", "10.0.4.0/24"] },
      { id: "T1589", name: "收集目标信息", confidence: 78, entities: ["user-zhangwei"] },
    ],
  },
  {
    name: "武器化", nameEn: "Weaponization", active: true,
    techniques: [
      { id: "T1566", name: "钓鱼附件", confidence: 85, entities: ["finance@corp.com", "WIN-DESK-15"] },
    ],
  },
  {
    name: "投递", nameEn: "Delivery", active: true,
    techniques: [
      { id: "T1566.001", name: "鱼叉式钓鱼邮件", confidence: 88, entities: ["finance@corp.com"] },
      { id: "T1190", name: "利用公开应用", confidence: 71, entities: ["web-app-02"] },
    ],
  },
  {
    name: "利用", nameEn: "Exploitation", active: true,
    techniques: [
      { id: "T1059", name: "命令行执行", confidence: 94, entities: ["WIN-DESK-15", "powershell.exe"] },
      { id: "T1053", name: "计划任务", confidence: 67, entities: ["host-srv-03"] },
    ],
  },
  {
    name: "安装", nameEn: "Installation", active: true,
    techniques: [
      { id: "T1059.001", name: "PowerShell", confidence: 90, entities: ["WIN-DESK-15"] },
      { id: "T1547", name: "注册表启动项", confidence: 73, entities: ["host-srv-03"] },
    ],
  },
  {
    name: "命令控制", nameEn: "C2", active: true,
    techniques: [
      { id: "T1071", name: "应用层协议", confidence: 96, entities: ["evil-domain.xyz", "host-srv-03"] },
      { id: "T1573", name: "加密信道", confidence: 82, entities: ["host-srv-03"] },
    ],
  },
  {
    name: "行动", nameEn: "Actions", active: true,
    techniques: [
      { id: "T1048", name: "数据外泄", confidence: 88, entities: ["103.45.67.89", "db-server-01"] },
      { id: "T1486", name: "数据加密", confidence: 65, entities: ["10.0.4.0/24"] },
    ],
  },
]

const mitreTactics: MITRETactic[] = [
  {
    tactic: "Initial Access",
    techniques: [
      { id: "T1566", name: "Phishing", active: true, count: 5 },
      { id: "T1190", name: "Exploit Public App", active: true, count: 3 },
      { id: "T1078", name: "Valid Accounts", active: false, count: 2 },
    ],
  },
  {
    tactic: "Execution",
    techniques: [
      { id: "T1059", name: "Command Script", active: true, count: 8 },
      { id: "T1053", name: "Scheduled Task", active: true, count: 4 },
      { id: "T1204", name: "User Execution", active: false, count: 2 },
    ],
  },
  {
    tactic: "Persistence",
    techniques: [
      { id: "T1547", name: "Registry Run Keys", active: true, count: 3 },
      { id: "T1053", name: "Scheduled Task", active: false, count: 2 },
    ],
  },
  {
    tactic: "Privilege Escalation",
    techniques: [
      { id: "T1068", name: "Exploitation", active: true, count: 4 },
      { id: "T1548", name: "Abuse Elevation", active: true, count: 3 },
    ],
  },
  {
    tactic: "Credential Access",
    techniques: [
      { id: "T1558", name: "Kerberoasting", active: true, count: 5 },
      { id: "T1003", name: "OS Credential Dump", active: true, count: 4 },
    ],
  },
  {
    tactic: "Lateral Movement",
    techniques: [
      { id: "T1550", name: "Pass the Hash", active: true, count: 6 },
      { id: "T1021", name: "Remote Services", active: true, count: 3 },
    ],
  },
  {
    tactic: "Exfiltration",
    techniques: [
      { id: "T1048", name: "Exfiltration Alt", active: true, count: 4 },
      { id: "T1560", name: "Archive Data", active: false, count: 1 },
    ],
  },
  {
    tactic: "Command & Control",
    techniques: [
      { id: "T1071", name: "Application Layer", active: true, count: 7 },
      { id: "T1573", name: "Encrypted Channel", active: true, count: 3 },
    ],
  },
]

const graphNodes: GraphNode[] = [
  { id: "n1", label: "user-zhangwei", type: "user", x: 200, y: 80, risk: 91 },
  { id: "n2", label: "WIN-DESK-15", type: "device", x: 420, y: 80, risk: 78 },
  { id: "n3", label: "10.0.4.22", type: "ip", x: 640, y: 80, risk: 85 },
  { id: "n4", label: "DC-01", type: "device", x: 640, y: 240, risk: 96 },
  { id: "n5", label: "finance@corp.com", type: "email", x: 200, y: 240, risk: 72 },
  { id: "n6", label: "powershell.exe", type: "process", x: 420, y: 240, risk: 88 },
  { id: "n7", label: "evil-domain.xyz", type: "domain", x: 860, y: 160, risk: 94 },
  { id: "n8", label: "host-srv-03", type: "device", x: 860, y: 320, risk: 82 },
  { id: "n9", label: "103.45.67.89", type: "ip", x: 420, y: 400, risk: 68 },
  { id: "n10", label: "db-server-01", type: "device", x: 640, y: 400, risk: 75 },
  { id: "n11", label: "lsass.exe", type: "process", x: 200, y: 400, risk: 87 },
  { id: "n12", label: "admin-wang", type: "user", x: 860, y: 460, risk: 54 },
]

const graphEdges: GraphEdge[] = [
  { source: "n1", target: "n2", label: "登录" },
  { source: "n1", target: "n3", label: "使用IP" },
  { source: "n2", target: "n6", label: "执行" },
  { source: "n5", target: "n2", label: "投递" },
  { source: "n3", target: "n4", label: "PTH" },
  { source: "n6", target: "n4", label: "提权" },
  { source: "n4", target: "n7", label: "DNS查询" },
  { source: "n7", target: "n8", label: "C2" },
  { source: "n8", target: "n9", label: "外传" },
  { source: "n4", target: "n10", label: "RDP" },
  { source: "n11", target: "n4", label: "凭证读取" },
  { source: "n8", target: "n12", label: "关联" },
]

const timelineEvents: TimelineEvent[] = [
  {
    id: "evt-1", time: "09:12:34", title: "异常VPN登录",
    description: "用户zhangwei从异常地理位置185.220.101.34登录VPN",
    risk: "high", aiAssessment: "AI判断：登录位置与历史行为不符，疑似凭证被盗用",
    aiType: "supports", icon: "alert",
  },
  {
    id: "evt-2", time: "09:14:21", title: "PowerShell执行",
    description: "WIN-DESK-15上执行编码PowerShell命令，下载远程脚本",
    risk: "critical", aiAssessment: "AI判断：编码执行+远程下载，高概率恶意行为",
    aiType: "supports", icon: "zap",
  },
  {
    id: "evt-3", time: "09:18:45", title: "LSASS内存读取",
    description: "进程mimikatz.exe尝试读取LSASS进程内存",
    risk: "critical", aiAssessment: "AI判断：凭证窃取行为，与横向移动模式匹配",
    aiType: "supports", icon: "lock",
  },
  {
    id: "evt-4", time: "09:22:10", title: "Pass-the-Hash攻击",
    description: "使用窃取的哈希向DC-01发起NTLM认证",
    risk: "critical", aiAssessment: "AI判断：PTH攻击确认，域控面临失陷风险",
    aiType: "supports", icon: "shield",
  },
  {
    id: "evt-5", time: "09:25:33", title: "计划任务创建",
    description: "在DC-01上创建持久化计划任务，每日执行恶意脚本",
    risk: "high", aiAssessment: "AI判断：持久化机制建立，攻击者意图长期驻留",
    aiType: "supports", icon: "brain",
  },
  {
    id: "evt-6", time: "09:31:07", title: "DNS异常查询",
    description: "DC-01向evil-domain.xyz发起高频DNS查询，疑似DNS隧道",
    risk: "critical", aiAssessment: "AI判断：C2通信建立，数据可能通过DNS隧道外传",
    aiType: "supports", icon: "eye",
  },
  {
    id: "evt-7", time: "09:38:52", title: "WMI远程执行",
    description: "从DC-01通过WMI向WIN-DESK-15执行远程命令",
    risk: "high", aiAssessment: "AI判断：横向移动扩散，攻击范围扩大",
    aiType: "supports", icon: "zap",
  },
  {
    id: "evt-8", time: "09:45:19", title: "用户休假中",
    description: "HR系统显示用户zhangwei当前处于休假状态",
    risk: "info", aiAssessment: "AI判断：休假期间异常活动进一步证实账号失陷",
    aiType: "contradicts", icon: "brain",
  },
  {
    id: "evt-9", time: "10:02:44", title: "大文件传输",
    description: "host-srv-03向外部IP 103.45.67.89传输2.3GB加密数据",
    risk: "critical", aiAssessment: "AI判断：数据外泄进行中，需立即阻断",
    aiType: "supports", icon: "alert",
  },
  {
    id: "evt-10", time: "10:15:08", title: "安全软件禁用",
    description: "攻击者通过注册表修改禁用了Windows Defender实时保护",
    risk: "high", aiAssessment: "AI判断：防御规避，攻击者试图隐藏后续行动",
    aiType: "supports", icon: "shield",
  },
]

const feedStatusConfig: Record<AIFeedStatus, { color: string; bg: string; border: string; pulse: string; label: string }> = {
  investigating: { color: "text-cyan-400", bg: "bg-cyan-500/[0.06]", border: "border-cyan-500/20", pulse: "bg-cyan-400", label: "home.aiInvestigating" },
  reasoning: { color: "text-amber-400", bg: "bg-amber-500/[0.06]", border: "border-amber-500/20", pulse: "bg-amber-400", label: "home.aiReasoning" },
  confirmed: { color: "text-emerald-400", bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/20", pulse: "bg-emerald-400", label: "home.aiAutoConfirmed" },
  escalated: { color: "text-[#ff4d4f]", bg: "bg-[#ff4d4f]/[0.06]", border: "border-[#ff4d4f]/20", pulse: "bg-[#ff4d4f]", label: "incidents.escalated" },
}

const caseStatusConfig: Record<LatestCase["status"], { color: string; bg: string; border: string }> = {
  investigating: { color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  reasoning: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  confirmed: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  closed: { color: "text-white/50", bg: "bg-white/5", border: "border-white/10" },
}

const stepTypeConfig: Record<AIReasoningStep["type"], { icon: React.ElementType; color: string }> = {
  discover: { icon: Eye, color: "text-cyan-400" },
  correlate: { icon: Link2, color: "text-amber-400" },
  judge: { icon: Brain, color: "text-[#ff4d4f]" },
}

const entityTypeIcon: Record<HighRiskEntity["type"], React.ElementType> = {
  user: UserX,
  host: Server,
  ip: Globe,
}

const nodeTypeColors: Record<GraphNode["type"], { fill: string; stroke: string; text: string; glow: string }> = {
  user: { fill: "rgba(34,211,238,0.15)", stroke: "#22d3ee", text: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
  device: { fill: "rgba(251,191,36,0.15)", stroke: "#fbbf24", text: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  ip: { fill: "rgba(255,77,79,0.15)", stroke: "#ff4d4f", text: "#ff4d4f", glow: "rgba(255,77,79,0.3)" },
  email: { fill: "rgba(59,130,246,0.15)", stroke: "#3b82f6", text: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
  process: { fill: "rgba(52,211,153,0.15)", stroke: "#34d399", text: "#34d399", glow: "rgba(52,211,153,0.3)" },
  domain: { fill: "rgba(167,139,250,0.15)", stroke: "#a78bfa", text: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
}

const nodeTypeLabels: Record<GraphNode["type"], string> = {
  user: "用户",
  device: "设备",
  ip: "IP",
  email: "邮件",
  process: "进程",
  domain: "域名",
}

const timelineRiskColors: Record<TimelineEvent["risk"], string> = {
  critical: "#ff4d4f",
  high: "#fa8c16",
  medium: "#faad14",
  low: "#22d3ee",
  info: "#64748b",
}

const timelineIconMap: Record<TimelineEvent["icon"], React.ElementType> = {
  alert: AlertTriangle,
  shield: Shield,
  brain: Brain,
  lock: Lock,
  eye: Eye,
  zap: Zap,
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-[#ff4d4f]" : value >= 60 ? "bg-amber-400" : "bg-cyan-400"
  const glowColor = value >= 80 ? "shadow-[0_0_8px_rgba(255,77,79,0.4)]" : value >= 60 ? "shadow-[0_0_8px_rgba(250,173,20,0.4)]" : "shadow-[0_0_8px_rgba(34,211,238,0.4)]"
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color} ${glowColor}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, accentColor, glow }: { icon: React.ReactNode; iconBg: string; label: string; value: number; accentColor?: string; glow?: string }) {
  return (
    <div className={`card-default p-5 ${glow || ""}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-xs text-white/50">{label}</p>
          <p className={`text-2xl font-bold ${accentColor || "text-white"}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

function AIReasoningChain({ steps }: { steps: AIReasoningStep[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, idx) => {
        const cfg = stepTypeConfig[step.type]
        const Icon = cfg.icon
        return (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <Icon className={`h-3 w-3 ${cfg.color}`} />
              <span className={`text-xs font-medium ${cfg.color} opacity-70`}>
                {idx === 0 ? "发现" : idx === 1 ? "关联" : "判断"}
              </span>
            </div>
            <span className="text-xs text-white/70 leading-relaxed">{step.label}</span>
            {idx < steps.length - 1 && <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />}
          </div>
        )
      })}
    </div>
  )
}

function AIFeedItem({ item }: { item: AIFeedItem }) {
  const { t } = useLocaleStore()
  const router = useRouter()
  const statusCfg = feedStatusConfig[item.status]
  return (
    <div className={`rounded-lg border ${statusCfg.border} ${statusCfg.bg} p-3 hover:bg-white/[0.06] transition-all group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className={`inline-block h-2 w-2 rounded-full ${statusCfg.pulse} animate-pulse`} />
            <span className={`absolute inline-block h-2 w-2 rounded-full ${statusCfg.pulse} animate-ping opacity-40`} />
          </div>
          <span className="font-mono text-xs text-white/50">{item.investigationId}</span>
          <Badge variant="outline" className={`text-[9px] ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border} py-0 px-1.5`}>
            {t(statusCfg.label)}
          </Badge>
        </div>
        <span className="text-xs text-white/30 flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {item.timestamp}
        </span>
      </div>
      <AIReasoningChain steps={item.steps} />
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/30">置信度</span>
          <span className={`text-xs font-semibold ${item.confidence >= 80 ? "text-[#ff4d4f]" : item.confidence >= 60 ? "text-amber-400" : "text-cyan-400"}`}>
            {item.confidence}%
          </span>
          <div className="w-16"><ConfidenceBar value={item.confidence} /></div>
        </div>
        <div className="flex items-center gap-1">
          {item.entities.slice(0, 2).map((entity) => (
            <span key={entity} className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-mono text-white/50">{entity}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {(item.status === "confirmed" || item.status === "escalated") && (
            <Button
              size="xs"
              className="bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 gap-1"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/cases?from=investigate&id=${item.investigationId}&confidence=${item.confidence}`)
              }}
            >
              <ArrowUpRight className="size-3" />
              升级为案件
            </Button>
          )}
          <Link href={`/cases?id=${item.investigationId}`}>
            <Button size="sm" className="bg-cyan-600/80 hover:bg-cyan-700 text-white text-xs h-6 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {t("home.continue")}
              <ArrowRight className="h-2.5 w-2.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function AttackChainRow({ entry }: { entry: AttackChainEntry }) {
  const riskCfg = RISK_CONFIG[entry.risk]
  return (
    <Link href={`/cases?id=${entry.investigationId}`} className="flex items-center gap-2 rounded-md px-2.5 py-2 hover:bg-white/[0.04] transition-colors group">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${riskCfg.color === "text-[#ff4d4f]" ? "bg-[#ff4d4f]" : riskCfg.color === "text-amber-400" ? "bg-amber-400" : "bg-cyan-400"} ${entry.risk === "critical" ? "animate-pulse" : ""}`} />
      <div className="flex items-center gap-0 flex-1 min-w-0 flex-wrap">
        {entry.chain.map((node, idx) => (
          <div key={idx} className="flex items-center">
            <span className="inline-flex items-center rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-xs font-mono text-white/60 whitespace-nowrap">{node}</span>
            {idx < entry.chain.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-cyan-400/40 mx-0.5" />}
          </div>
        ))}
      </div>
      <ArrowRight className="h-3 w-3 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  )
}

function MITREStageRow({ stage }: { stage: MITREStage }) {
  const maxCount = Math.max(...mitreStages.map((s) => s.count))
  const widthPct = (stage.count / maxCount) * 100
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-white/40 w-24 shrink-0 truncate">{stage.stage}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${stage.color === "text-[#ff4d4f]" ? "bg-[#ff4d4f]" : stage.color === "text-amber-400" ? "bg-amber-400" : stage.color === "text-orange-400" ? "bg-orange-400" : "bg-cyan-400"}`} style={{ width: `${widthPct}%` }} />
      </div>
      <span className={`text-xs font-mono ${stage.color} w-4 text-right`}>{stage.count}</span>
    </div>
  )
}

function RiskScoreRow({ entry }: { entry: RiskEntry }) {
  const TrendIcon = entry.trend === "up" ? TrendingUp : entry.trend === "down" ? TrendingDown : Minus
  const trendColor = entry.trend === "up" ? "text-[#ff4d4f]" : entry.trend === "down" ? "text-emerald-400" : "text-amber-400"
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs text-white/50 w-24 shrink-0 truncate font-mono">{entry.entity}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${entry.score >= 90 ? "bg-[#ff4d4f] shadow-[0_0_6px_rgba(255,77,79,0.4)]" : entry.score >= 70 ? "bg-amber-400" : "bg-cyan-400"}`} style={{ width: `${entry.score}%` }} />
      </div>
      <span className={`text-xs font-mono ${entry.score >= 90 ? "text-[#ff4d4f]" : entry.score >= 70 ? "text-amber-400" : "text-cyan-400"} w-6 text-right`}>{entry.score}</span>
      <TrendIcon className={`h-3 w-3 ${trendColor}`} />
    </div>
  )
}

function LatestCaseRow({ caseItem }: { caseItem: LatestCase }) {
  const riskCfg = RISK_CONFIG[caseItem.risk]
  const statusCfg = caseStatusConfig[caseItem.status]
  return (
    <Link href={`/cases?id=${caseItem.id}`} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] p-2.5 transition-colors group">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${caseItem.risk === "critical" ? "bg-[#ff4d4f] animate-pulse" : riskCfg.color === "text-amber-400" ? "bg-amber-400" : "bg-cyan-400"}`} />
        <div className="min-w-0">
          <span className="font-mono text-xs text-white/50 block">{caseItem.id}</span>
          <span className="text-xs text-white/70 block truncate">{caseItem.title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={`text-[9px] ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border} py-0 px-1.5`}>
          {caseItem.status === "investigating" ? "调查中" : caseItem.status === "reasoning" ? "推理中" : caseItem.status === "confirmed" ? "已确认" : "已关闭"}
        </Badge>
        <span className="text-xs text-white/25">{caseItem.updated}</span>
      </div>
    </Link>
  )
}

function HighRiskEntityRow({ entity }: { entity: HighRiskEntity }) {
  const Icon = entityTypeIcon[entity.type]
  const scoreColor = entity.score >= 90 ? "text-[#ff4d4f]" : entity.score >= 70 ? "text-amber-400" : "text-cyan-400"
  const scoreGlow = entity.score >= 90 ? "shadow-[0_0_8px_rgba(255,77,79,0.3)]" : ""
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 ${scoreGlow}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${entity.score >= 90 ? "bg-[#ff4d4f]/15" : entity.score >= 70 ? "bg-amber-500/15" : "bg-cyan-500/15"}`}>
        <Icon className={`h-3.5 w-3.5 ${scoreColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-white/70 font-mono block truncate">{entity.name}</span>
        <span className="text-xs text-white/35 block truncate">{entity.reason}</span>
      </div>
      <span className={`text-sm font-bold ${scoreColor}`}>{entity.score}</span>
    </div>
  )
}

function LateralRelationRow({ relation }: { relation: LateralRelation }) {
  const riskCfg = RISK_CONFIG[relation.risk]
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
      <span className="text-xs text-white/60 font-mono truncate flex-1 text-right">{relation.source}</span>
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${riskCfg.bg} ${riskCfg.color} border-current/20`}>{relation.method}</span>
        <ArrowRight className={`h-3 w-3 ${riskCfg.color}`} />
      </div>
      <span className="text-xs text-white/60 font-mono truncate flex-1">{relation.target}</span>
    </div>
  )
}

function KillChainVisualization() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff4d4f]/10 border border-[#ff4d4f]/20">
          <Flame className="h-4 w-4 text-[#ff4d4f]" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/90">Kill Chain 攻击链</h2>
          <p className="text-xs text-white/40">7个攻击阶段完整还原攻击路径</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-cyan-500/30 via-amber-500/30 to-[#ff4d4f]/30" />
        <div className="grid grid-cols-7 gap-3 relative">
          {killChainStages.map((stage, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <div className={`relative flex flex-col items-center ${stage.active ? "" : "opacity-40"}`}>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 z-10 ${
                  stage.active
                    ? "border-[#ff4d4f] bg-[#ff4d4f]/15 shadow-[0_0_16px_rgba(255,77,79,0.3)]"
                    : "border-white/20 bg-white/[0.04]"
                }`}>
                  <span className="text-xs font-bold text-white/80">{idx + 1}</span>
                  {stage.active && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#ff4d4f] animate-pulse" />}
                </div>
              </div>
              <div className="text-center">
                <p className={`text-xs font-medium ${stage.active ? "text-white/90" : "text-white/40"}`}>{stage.name}</p>
                <p className="text-[9px] text-white/25">{stage.nameEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {killChainStages.filter((s) => s.active).map((stage, idx) => (
          <div key={idx} className="card-default p-4 space-y-3 hover:border-[#ff4d4f]/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff4d4f]/15 text-xs font-bold text-[#ff4d4f]">{idx + 1}</span>
                <span className="text-sm font-medium text-white/80">{stage.name}</span>
                <span className="text-xs text-white/30">{stage.nameEn}</span>
              </div>
              <Badge variant="outline" className="text-[9px] text-[#ff4d4f] bg-[#ff4d4f]/10 border-[#ff4d4f]/20 py-0 px-1.5">
                {stage.techniques.length} 技术
              </Badge>
            </div>
            <div className="space-y-2">
              {stage.techniques.map((tech) => (
                <div key={tech.id} className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-2.5">
                  <span className="font-mono text-xs text-cyan-400/70 shrink-0">{tech.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">{tech.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {tech.entities.slice(0, 2).map((ent) => (
                        <span key={ent} className="inline-flex items-center rounded border border-white/10 bg-white/[0.06] px-1 py-0 text-[8px] font-mono text-white/40">{ent}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-white/30">AI置信度</span>
                    <span className={`text-xs font-semibold ${tech.confidence >= 80 ? "text-[#ff4d4f]" : tech.confidence >= 60 ? "text-amber-400" : "text-cyan-400"}`}>{tech.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MITREATTACKMatrix() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Fingerprint className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/90">MITRE ATT&CK 映射</h2>
          <p className="text-xs text-white/40">AI识别的攻击战术与技术矩阵</p>
        </div>
      </div>

      <div className="space-y-3">
        {mitreTactics.map((tactic) => (
          <div key={tactic.tactic} className="card-default overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-white/70">{tactic.tactic}</span>
              <span className="text-[9px] text-white/30 ml-auto">{tactic.techniques.filter((t) => t.active).length}/{tactic.techniques.length} 活跃</span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {tactic.techniques.map((tech) => (
                <div key={tech.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                  tech.active
                    ? "border-[#ff4d4f]/30 bg-[#ff4d4f]/[0.06] shadow-[0_0_8px_rgba(255,77,79,0.1)]"
                    : "border-white/10 bg-white/[0.02] opacity-50"
                }`}>
                  <span className={`font-mono text-xs ${tech.active ? "text-[#ff4d4f]" : "text-white/30"}`}>{tech.id}</span>
                  <span className={`text-xs ${tech.active ? "text-white/80" : "text-white/40"}`}>{tech.name}</span>
                  {tech.active && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d4f] opacity-50" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4d4f]" /></span>}
                  <span className={`text-[9px] font-mono ${tech.active ? "text-white/50" : "text-white/20"}`}>{tech.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AttackPathVisualization() {
  const paths = [
    { label: "主攻击路径", nodes: ["钓鱼邮件", "宏执行", "C2建立", "PTH", "域控接管", "数据外泄"], risk: "critical" as const },
    { label: "辅助路径", nodes: ["VPN爆破", "凭证窃取", "RDP横向", "勒索部署"], risk: "high" as const },
    { label: "潜在路径", nodes: ["供应链投毒", "恶意更新", "后门植入"], risk: "medium" as const },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <GitBranch className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/90">攻击路径可视化</h2>
          <p className="text-xs text-white/40">AI还原的多条攻击路径与横向移动</p>
        </div>
      </div>

      <div className="space-y-4">
        {paths.map((path, idx) => {
          const riskCfg = RISK_CONFIG[path.risk]
          return (
            <div key={idx} className={`rounded-xl border ${path.risk === "critical" ? "border-[#ff4d4f]/20" : path.risk === "high" ? "border-amber-500/20" : "border-cyan-500/20"} bg-white/[0.04] p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-medium ${riskCfg.color}`}>{path.label}</span>
                <Badge variant="outline" className={`text-[9px] ${riskCfg.color} ${riskCfg.bg} py-0 px-1.5`}>{path.risk.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {path.nodes.map((node, nIdx) => (
                  <div key={nIdx} className="flex items-center">
                    <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${
                      path.risk === "critical" ? "border-[#ff4d4f]/20 bg-[#ff4d4f]/[0.06]" : path.risk === "high" ? "border-amber-500/20 bg-amber-500/[0.06]" : "border-cyan-500/20 bg-cyan-500/[0.06]"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${path.risk === "critical" ? "bg-[#ff4d4f]" : path.risk === "high" ? "bg-amber-400" : "bg-cyan-400"} ${nIdx === 0 ? "animate-pulse" : ""}`} />
                      <span className="text-xs text-white/70">{node}</span>
                    </div>
                    {nIdx < path.nodes.length - 1 && <MoveRight className={`h-4 w-4 mx-1 ${riskCfg.color} opacity-40`} />}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReasoningGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const relatedEdges = useMemo(() => {
    if (!selectedNode) return []
    return graphEdges.filter((e) => e.source === selectedNode || e.target === selectedNode)
  }, [selectedNode])
  const relatedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>()
    const ids = new Set<string>()
    ids.add(selectedNode)
    relatedEdges.forEach((e) => { ids.add(e.source); ids.add(e.target) })
    return ids
  }, [selectedNode, relatedEdges])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Network className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white/90">推理图谱</h2>
            <p className="text-xs text-white/40">实体关系与攻击推理链路可视化</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(Object.entries(nodeTypeColors) as [GraphNode["type"], typeof nodeTypeColors[GraphNode["type"]]][]).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.stroke }} />
              <span className="text-xs text-white/40">{nodeTypeLabels[type]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-default overflow-hidden">
        <svg viewBox="0 0 1000 520" className="w-full h-auto min-h-[400px]">
          <defs>
            {Object.entries(nodeTypeColors).map(([type, colors]) => (
              <filter key={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood floodColor={colors.stroke} floodOpacity="0.4" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {graphEdges.map((edge, idx) => {
            const source = graphNodes.find((n) => n.id === edge.source)!
            const target = graphNodes.find((n) => n.id === edge.target)!
            const isHighlighted = selectedNode ? relatedEdges.includes(edge) : true
            const midX = (source.x + target.x) / 2
            const midY = (source.y + target.y) / 2
            return (
              <g key={`edge-${idx}`} opacity={isHighlighted ? 1 : 0.15}>
                <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={isHighlighted ? "#22d3ee" : "#ffffff"} strokeWidth={isHighlighted ? 1.5 : 0.5} strokeOpacity={isHighlighted ? 0.5 : 0.1} />
                <text x={midX} y={midY - 6} textAnchor="middle" fill={isHighlighted ? "#22d3ee" : "#ffffff"} fillOpacity={isHighlighted ? 0.6 : 0.15} fontSize="8" fontFamily="monospace">{edge.label}</text>
              </g>
            )
          })}

          {graphNodes.map((node) => {
            const colors = nodeTypeColors[node.type]
            const isSelected = selectedNode === node.id
            const isRelated = relatedNodeIds.has(node.id)
            const dimmed = selectedNode ? !isRelated : false
            return (
              <g key={node.id} opacity={dimmed ? 0.2 : 1} className="cursor-pointer" onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}>
                <circle cx={node.x} cy={node.y} r={isSelected ? 28 : 22} fill={colors.fill} stroke={colors.stroke} strokeWidth={isSelected ? 2.5 : 1.5} filter={isSelected || !selectedNode ? `url(#glow-${node.type})` : "none"} />
                <text x={node.x} y={node.y - 4} textAnchor="middle" fill={colors.text} fontSize="9" fontFamily="monospace" fontWeight="600">{node.label.length > 14 ? node.label.slice(0, 12) + ".." : node.label}</text>
                <text x={node.x} y={node.y + 10} textAnchor="middle" fill="#ffffff" fillOpacity="0.3" fontSize="7" fontFamily="monospace">{nodeTypeLabels[node.type]}</text>
                <text x={node.x + 20} y={node.y - 16} textAnchor="start" fill={node.risk >= 90 ? "#ff4d4f" : node.risk >= 70 ? "#fbbf24" : "#22d3ee"} fontSize="8" fontFamily="monospace" fontWeight="bold">{node.risk}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {selectedNode && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-cyan-400">选中实体</span>
            <span className="font-mono text-xs text-white/50">{graphNodes.find((n) => n.id === selectedNode)?.label}</span>
          </div>
          <div className="space-y-2">
            {relatedEdges.map((edge, idx) => {
              const otherNodeId = edge.source === selectedNode ? edge.target : edge.source
              const otherNode = graphNodes.find((n) => n.id === otherNodeId)
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="text-white/50">{edge.source === selectedNode ? "→" : "←"}</span>
                  <span className="text-cyan-400/70">{edge.label}</span>
                  <span className="text-white/30">→</span>
                  <span className="font-mono text-white/60">{otherNode?.label}</span>
                  <Badge variant="outline" className="text-[8px] py-0 px-1" style={{ color: nodeTypeColors[otherNode!.type].text, borderColor: nodeTypeColors[otherNode!.type].stroke }}>{nodeTypeLabels[otherNode!.type]}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TimelineView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Timer className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/90">攻击调查时间线</h2>
          <p className="text-xs text-white/40">完整事件序列与AI推理过程</p>
        </div>
      </div>

      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-amber-500/30 to-[#ff4d4f]/40" />

        <div className="space-y-6">
          {timelineEvents.map((event, idx) => {
            const Icon = timelineIconMap[event.icon]
            const dotColor = timelineRiskColors[event.risk]
            const isSupports = event.aiType === "supports"
            const isContradicts = event.aiType === "contradicts"
            return (
              <div key={event.id} className="relative group">
                <div className="absolute -left-5 top-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: dotColor, backgroundColor: `${dotColor}30`, boxShadow: `0 0 8px ${dotColor}60` }} />
                    {event.risk === "critical" && <span className="absolute inset-0 h-3 w-3 rounded-full animate-ping" style={{ backgroundColor: dotColor, opacity: 0.3 }} />}
                  </div>
                </div>

                <div className={`card-default p-4 hover:bg-white/[0.06] transition-all ${event.risk === "critical" ? "shadow-[0_0_12px_rgba(255,77,79,0.08)]" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color: dotColor }} />
                      <span className="text-sm font-medium text-white/90">{event.title}</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5" style={{ color: dotColor, borderColor: `${dotColor}40`, backgroundColor: `${dotColor}15` }}>
                        {event.risk === "critical" ? "严重" : event.risk === "high" ? "高危" : event.risk === "medium" ? "中危" : event.risk === "low" ? "低危" : "信息"}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs text-white/40">{event.time}</span>
                  </div>

                  <p className="text-[12px] text-white/60 mb-3 leading-relaxed">{event.description}</p>

                  <div className={`flex items-start gap-2 rounded-lg border p-2.5 ${
                    isSupports ? "border-emerald-500/20 bg-emerald-500/[0.04]" : isContradicts ? "border-amber-500/20 bg-amber-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"
                  }`}>
                    <Brain className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isSupports ? "text-emerald-400" : isContradicts ? "text-amber-400" : "text-white/30"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-white/50">AI评估</span>
                        {isSupports && <span className="text-[9px] px-1 py-0 rounded bg-emerald-500/15 text-emerald-400">支持</span>}
                        {isContradicts && <span className="text-[9px] px-1 py-0 rounded bg-amber-500/15 text-amber-400">矛盾</span>}
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{event.aiAssessment}</p>
                    </div>
                  </div>
                </div>

                {idx < timelineEvents.length - 1 && (
                  <div className="flex items-center gap-1.5 ml-2 mt-2 mb-0">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[8px] text-white/15 font-mono shrink-0">
                      {(() => {
                        const curr = timelineEvents[idx].time.split(":").map(Number)
                        const next = timelineEvents[idx + 1].time.split(":").map(Number)
                        const diff = (next[0] * 3600 + next[1] * 60 + next[2]) - (curr[0] * 3600 + curr[1] * 60 + curr[2])
                        return diff > 0 ? `+${diff}s` : ""
                      })()}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmptyInvestigate({ userName, isDemo }: { userName: string; isDemo: boolean }) {
  const { t } = useLocaleStore()
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <div className="relative">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20">
          <Crosshair className="size-10 text-cyan-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <Sparkles className="size-3.5 text-emerald-400" />
        </div>
      </div>
      <div className="text-center space-y-3 max-w-lg">
        <h1 className="text-2xl font-bold text-white">{isDemo ? "欢迎体验 SecMind" : `欢迎，${userName}`}</h1>
        <p className="text-sm text-white/40 leading-relaxed">
          {isDemo ? "这是 SecMind AI自主安全研判平台的演示环境。当前没有真实数据，您可以通过接入安全设备开始使用。" : "您的安全研判工作区已就绪。接入安全设备后，AI将自动开始调查攻击行为和攻击研判。"}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] p-5 text-center space-y-2">
          <div className="flex size-10 mx-auto items-center justify-center rounded-lg bg-cyan-500/15">
            <Radio className="size-5 text-cyan-400" />
          </div>
          <h3 className="text-sm font-medium text-cyan-300">接入信号源</h3>
          <p className="text-xs text-white/30">连接防火墙、VPN、EDR等安全设备</p>
        </div>
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-5 text-center space-y-2">
          <div className="flex size-10 mx-auto items-center justify-center rounded-lg bg-amber-500/15">
            <Brain className="size-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-medium text-amber-300">AI行为关联</h3>
          <p className="text-xs text-white/30">AI自动关联攻击行为和攻击类型</p>
        </div>
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5 text-center space-y-2">
          <div className="flex size-10 mx-auto items-center justify-center rounded-lg bg-emerald-500/15">
            <Crosshair className="size-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-emerald-300">攻击研判</h3>
          <p className="text-xs text-white/30">自动构建攻击链和调查建议</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 w-full max-w-xl">
        <div className="text-center">
          <div className="text-xl font-bold text-white/20">0</div>
          <div className="text-xs text-white/15 mt-0.5">活跃调查</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white/20">0</div>
          <div className="text-xs text-white/15 mt-0.5">待复核案件</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white/20">0</div>
          <div className="text-xs text-white/15 mt-0.5">已收集证据</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white/20">0</div>
          <div className="text-xs text-white/15 mt-0.5">已执行动作</div>
        </div>
      </div>
    </div>
  )
}

export default function InvestigatePage() {
  const { t } = useLocaleStore()
  const user = useAuthStore((s) => s.user)
  const [searchQuery, setSearchQuery] = useState("")

  const isEmptyState = user?.isDemo || user?.isNewUser

  if (isEmptyState) {
    return <EmptyInvestigate userName={user?.name || ""} isDemo={!!user?.isDemo} />
  }

  const filteredFeedItems = aiFeedItems.filter(
    (item) =>
      item.investigationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.steps.some((step) => step.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.entities.some((entity) => entity.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Crosshair}
        title={t("nav.investigate")}
        subtitle={
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            引擎在线
          </span>
        }
        actions={
          <Link href="/cases?action=new">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              {t("home.newInvestigation")}
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="live">
        <TabsList variant="line" className="border-b border-white/10 w-full justify-start gap-0">
          <TabsTrigger value="live" className="text-white/60 data-active:text-cyan-400">
            <Activity className="h-3.5 w-3.5 mr-1" />
            {t("nav.tabLiveInvestigation")}
          </TabsTrigger>
          <TabsTrigger value="chain" className="text-white/60 data-active:text-cyan-400">
            <GitBranch className="h-3.5 w-3.5 mr-1" />
            {t("nav.tabAttackChain")}
          </TabsTrigger>
          <TabsTrigger value="graph" className="text-white/60 data-active:text-cyan-400">
            <Network className="h-3.5 w-3.5 mr-1" />
            {t("nav.tabReasoningGraph")}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-white/60 data-active:text-cyan-400">
            <Timer className="h-3.5 w-3.5 mr-1" />
            {t("nav.tabTimeline")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Crosshair className="h-5 w-5 text-cyan-400" />} iconBg="bg-cyan-500/20" label={t("home.aiInvestigating")} value={12} accentColor="text-cyan-400" glow="shadow-[0_0_12px_rgba(34,211,238,0.15)]" />
            <StatCard icon={<Brain className="h-5 w-5 text-amber-400" />} iconBg="bg-amber-500/20" label={t("home.aiReasoning")} value={4} accentColor="text-amber-400" glow="shadow-[0_0_12px_rgba(250,173,20,0.15)]" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />} iconBg="bg-emerald-500/20" label={t("home.aiAutoConfirmed")} value={26} accentColor="text-emerald-400" />
            <StatCard icon={<Shield className="h-5 w-5 text-slate-400" />} iconBg="bg-slate-500/20" label={t("home.aiClosed")} value={102} accentColor="text-slate-400" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  {t("home.recentActivity")}
                </h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder={t("home.searchInvestigations")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-56 rounded-md border border-white/10 bg-white/[0.04] pl-8 pr-3 text-xs text-white/80 placeholder:text-white/25 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {filteredFeedItems.map((item) => (
                  <AIFeedItem key={item.id} item={item} />
                ))}
                {filteredFeedItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-white/30">
                    <Search className="h-8 w-8 mb-2" />
                    <p className="text-sm">{t("home.noInvestigationsMatch")}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="card-default">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white/90 text-sm">
                    <GitBranch className="h-4 w-4 text-[#ff4d4f]" />
                    {t("home.attackChainAnalysis")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {attackChains.map((entry) => (
                    <AttackChainRow key={entry.id} entry={entry} />
                  ))}
                </CardContent>
              </Card>

              <Card className="card-default">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white/90 text-sm">
                    <Fingerprint className="h-4 w-4 text-amber-400" />
                    {t("home.mitreStages")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {mitreStages.map((stage) => (
                    <MITREStageRow key={stage.stage} stage={stage} />
                  ))}
                </CardContent>
              </Card>

              <Card className="card-default">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white/90 text-sm">
                    <AlertTriangle className="h-4 w-4 text-[#ff4d4f]" />
                    {t("home.riskScore")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {riskEntries.map((entry) => (
                    <RiskScoreRow key={entry.entity} entry={entry} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
            <Card className="card-default">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90 text-sm">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  {t("home.latestCases")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {latestCases.map((c) => (
                  <LatestCaseRow key={c.id} caseItem={c} />
                ))}
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  {t("home.highRiskEntities")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {highRiskEntities.map((e) => (
                  <HighRiskEntityRow key={e.name} entity={e} />
                ))}
              </CardContent>
            </Card>

            <Card className="card-default">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white/90 text-sm">
                  <Share2 className="h-4 w-4 text-[#ff4d4f]" />
                  {t("home.lateralAttackRelations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {lateralRelations.map((r, idx) => (
                  <LateralRelationRow key={idx} relation={r} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chain" className="mt-6">
          <div className="space-y-6">
            <KillChainVisualization />
            <div className="h-px bg-white/[0.06]" />
            <MITREATTACKMatrix />
            <div className="h-px bg-white/[0.06]" />
            <AttackPathVisualization />
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-6">
          <ReasoningGraph />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
