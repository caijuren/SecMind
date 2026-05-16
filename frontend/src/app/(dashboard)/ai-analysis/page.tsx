"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const isDev = process.env.NODE_ENV === "development"
function devLog(...args: unknown[]) { if (isDev) console.log(...args) }
function devWarn(...args: unknown[]) { if (isDev) console.warn(...args) }
function devError(...args: unknown[]) { if (isDev) console.error(...args) }
import {
  Brain,
  Activity,
  Shield,
  Zap,
  Eye,
  Lock,
  Globe,
  Server,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Cpu,
  Network,
  FileText,
  User,
  Search,
  Target,
  Layers,
  Sparkles,
  Radio,
  Terminal,
  Bug,
  Key,
  Download,
  Upload,
  Wifi,
  ShieldAlert,
  Code2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

// ==================== 统一设计令牌（Design Tokens）====================

/** 颜色系统 - 基于Tailwind语义色 */
const COLORS = {
  // 严重等级
  critical: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    solid: "bg-red-600 dark:bg-red-500",
    light: "bg-red-100 dark:bg-red-900/30",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    solid: "bg-orange-600 dark:bg-orange-500",
    light: "bg-orange-100 dark:bg-orange-900/30",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-300",
    solid: "bg-yellow-600 dark:bg-yellow-500",
    light: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  low: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    solid: "bg-emerald-600 dark:bg-emerald-500",
    light: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  
  // Agent角色色 - 使用cyan作为AI模块品牌色（符合admin-ui-guidelines）
  agent: {
    soc: { color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-900/30", solid: "bg-sky-500" },
    identity: { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30", solid: "bg-cyan-500" },
    threat: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", solid: "bg-red-500" },
    ueba: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", solid: "bg-amber-500" },
    forensics: { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30", solid: "bg-cyan-500" },
    reasoning: { color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/30", solid: "bg-cyan-500" },
    conclusion: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", solid: "bg-emerald-500" },
  },

  // 状态色
  status: {
    working: "animate-pulse",
    complete: "",
    waiting: "opacity-60",
  }
}

/** 字体层次 - 4级系统 */
const TYPOGRAPHY = {
  h1: "text-xl font-bold tracking-tight",       // 页面主标题
  h2: "text-lg font-semibold",                 // 区域标题
  h3: "text-base font-semibold",               // 卡片标题
  body: "text-sm leading-relaxed",            // 正文内容
  caption: "text-xs",                         // 辅助说明
  micro: "text-[11px]",                        // 极小标签（慎用）
}

/** 间距 - 8px栅格 */
const SPACING = {
  xs: "1",      // 4px
  sm: "1.5",    // 6px
  md: "2",      // 8px
  lg: "3",      // 12px
  xl: "4",      // 16px
  "2xl": "6",   // 24px
}

/** 圆角 */
const RADIUS = {
  sm: "rounded-md",   // 6px
  md: "rounded-lg",   // 8px
  lg: "rounded-xl",   // 12px
  xl: "rounded-2xl",  // 16px
}

/** 卡片基础样式 */
const CARD_BASE = `${RADIUS.lg} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200`

/** 获取严重等级样式 */
function getSeverityStyles(severity: string) {
  const map: Record<string, typeof COLORS.critical> = {
    critical: COLORS.critical,
    high: COLORS.high,
    medium: COLORS.medium,
    low: COLORS.low,
  }
  return map[severity] || COLORS.medium
}

/** 获取Agent颜色 */
function getAgentColor(agentName: string) {
  const name = agentName.toLowerCase()
  if (name.includes("soc")) return COLORS.agent.soc
  if (name.includes("identity") || name.includes("user") || name.includes("ad")) return COLORS.agent.identity
  if (name.includes("threat") || name.includes("intel")) return COLORS.agent.threat
  if (name.includes("ueba") || name.includes("behavior")) return COLORS.agent.ueba
  if (name.includes("forensic") || name.includes("log") || name.includes("mail") || name.includes("edr") || name.includes("network")) return COLORS.agent.forensics
  if (name.includes("reasoning")) return COLORS.agent.reasoning
  if (name.includes("conclusion")) return COLORS.agent.conclusion
  return COLORS.agent.soc  // 默认
}

// ==================== 数据类型定义 ====================

interface DataSource {
  id: string
  name: string
  icon: React.ElementType
  status: "active" | "idle" | "error"
  eventCount: number
  lastEvent?: string
  color: string
}

interface AIAgent {
  id: string
  name: string
  icon: React.ElementType
  status: "thinking" | "analyzing" | "waiting" | "complete"
  currentTask?: string
  progress?: number
  findings?: number
  color: string
}

interface Evidence {
  id: string
  type: string
  icon: React.ElementType
  content: string
  details?: { label: string; value: string }[]
  riskLevel: "low" | "medium" | "high" | "critical"
  source: string
}

interface CorrelationLink {
  from: string
  to: string
  description: string
}

interface AIThinkingStep {
  id: string
  timestamp: string
  agent: string
  agentIcon: React.ElementType
  agentColor: string
  status: "working" | "complete"
  message: string
  result?: string[]
  isTyping?: boolean
}

interface SecurityEvent {
  id: string
  eventId: string
  title: string
  source: string
  sourceIcon: React.ElementType
  sourceColor: string
  severity: "low" | "medium" | "high" | "critical"
  category: string
  description: string
  steps: AIThinkingStep[]
  evidenceList: Evidence[]
  correlationLinks: CorrelationLink[]
  conclusion: {
    event: string
    confidence: number
    attackPhase: string
    recommendations: string[]
    riskScore: number
  }
}

// ==================== 10个真实安全事件 ====================

const securityEvents: SecurityEvent[] = [
  // ===== 事件1: 钓鱼邮件攻击 =====
  {
    id: "evt-001",
    eventId: "ALT-2026-0511-001",
    title: "高仿OA系统钓鱼邮件攻击",
    source: "邮件网关",
    sourceIcon: FileText,
    sourceColor: "#ef4444",
    severity: "critical",
    category: "钓鱼攻击",
    description: "检测到针对财务部门的大规模钓鱼邮件攻击，伪装成OA系统登录通知",
    steps: [
      {
        id: "1-1", timestamp: "09:15:23", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到紧急告警 - 检测到高仿域名邮件 secm1nd.com",
        result: ["发件人: it-support@secm1nd.com", "收件人: 财务部全员(23人)", "严重程度: CRITICAL"]
      },
      {
        id: "1-2", timestamp: "09:15:25", agent: "Mail Agent", agentIcon: FileText, agentColor: "#f97316",
        status: "working", message: "正在分析邮件内容...", isTyping: true,
        result: ["✓ 域名相似度: 95% (secm1nd vs secmind)", "✓ 包含恶意链接: secm1nd.com/login", "✓ 附件: fake-oa-update.exe"]
      },
      {
        id: "1-3", timestamp: "09:15:28", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "查询威胁情报库...",
        result: ["✓ IP: 185.xxx.xxx.xxx 已标记为恶意", "✓ 关联APT-41组织", "✓ 首次出现: 2025年12月"]
      },
      {
        id: "1-4", timestamp: "09:15:31", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "分析目标用户画像...",
        result: ["✓ 目标群体: 财务部+高管层", "✓ 具有资金转账权限", "✓ 攻击意图: 商业欺诈"]
      },
      {
        id: "1-5", timestamp: "09:15:34", agent: "UEBA Agent", agentIcon: Activity, agentColor: "#22c55e",
        status: "working", message: "检测用户行为响应...",
        result: ["⚠️ 3人已点击链接", "⚠️ 1人已下载附件", "⚠️ 需立即处置"]
      },
      {
        id: "1-6", timestamp: "09:15:37", agent: "Reasoning Agent", agentIcon: Brain, agentColor: "#a78bfa",
        status: "working", message: "生成综合风险评估...", isTyping: true,
        result: ["邮件欺骗度: 98%", "用户点击率: 13%", "潜在损失: >500万"]
      },
      {
        id: "1-7", timestamp: "09:15:40", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#ef4444",
        status: "complete", message: "AI判定: 高级持续性钓鱼攻击（APT级别）",
        result: ["攻击阶段: Initial Access → Credential Harvesting", "置信度: 96%", "建议: 立即隔离已感染终端"]
      },
    ],
    evidenceList: [
      { id: "ev1-1", type: "邮件样本", icon: FileText, content: "高仿OA系统通知邮件", details: [{ label: "发件域", value: "secm1nd.com" }, { label: "相似度", value: "95%" }, { label: "附件", value: "fake-oa-update.exe" }], riskLevel: "critical", source: "邮件网关" },
      { id: "ev1-2", type: "威胁情报", icon: Target, content: "IP关联已知APT组织", details: [{ label: "IP地址", value: "185.234.56.78" }, { label: "信誉分", value: "0/100" }, { label: "组织", value: "APT-41" }], riskLevel: "critical", source: "威胁情报库" },
      { id: "ev1-3", type: "用户行为", icon: Activity, content: "3名员工已点击恶意链接", details: [{ label: "点击人数", value: "3/23" }, { label: "下载附件", value: "1人" }, { label: "响应时间", value: "<2分钟" }], riskLevel: "high", source: "UEBA系统" },
    ],
    correlationLinks: [
      { from: "钓鱼邮件发送", to: "用户点击链接", description: "社会工程学成功" },
      { from: "用户点击链接", to: "凭证输入页面", description: "伪造登录页" },
      { from: "凭证输入", to: "恶意软件下载", description: "后续载荷投递" },
    ],
    conclusion: {
      event: "高级钓鱼攻击 - APT-41组织针对性攻击",
      confidence: 96,
      attackPhase: "Initial Access → Credential Harvesting",
      recommendations: ["立即隔离3台已感染终端", "强制重置23名用户密码", "封锁恶意域名和IP", "通报全公司警惕类似攻击"],
      riskScore: 94,
    },
  },

  // ===== 事件2: VPN异地登录 =====
  {
    id: "evt-002",
    eventId: "ALT-2026-0511-002",
    title: "VPN异常地理位置登录",
    source: "VPN网关",
    sourceIcon: Lock,
    sourceColor: "#f97316",
    severity: "critical",
    category: "身份异常",
    description: "检测到VIP账号从俄罗斯莫斯科进行VPN登录，该账号具有系统管理员权限",
    steps: [
      {
        id: "2-1", timestamp: "10:23:11", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到VPN异地登录告警",
        result: ["用户: admin_zhang (系统管理员)", "源IP: 91.234.56.78", "登录地: 俄罗斯·莫斯科"]
      },
      {
        id: "2-2", timestamp: "10:23:13", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "正在构建用户画像...", isTyping: true,
        result: ["✓ 用户: 张伟, IT总监", "✓ 权限: Domain Admin", "✓ 当前状态: 在北京办公"]
      },
      {
        id: "2-3", timestamp: "10:23:16", agent: "AD Agent", agentIcon: Server, agentColor: "#22c55e",
        status: "working", message: "查询账户活动日志...",
        result: ["✓ 密码最后修改: 30天前", "✓ 账户未锁定", "⚠️ MFA被绕过"]
      },
      {
        id: "2-4", timestamp: "10:23:19", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "查询IP信誉...",
        result: ["✓ IP属于俄罗斯ISP", "✓ ASN: AS12389 (Rostelecom)", "✓ Tor出口节点历史"]
      },
      {
        id: "2-5", timestamp: "10:23:22", agent: "UEBA Agent", agentIcon: Activity, agentColor: "#f97316",
        status: "working", message: "计算行为偏离度...",
        result: ["✓ 地理距离: 5793km (不可能旅行)", "✓ 登录时间: 凌晨03:12", "✓ 行为基线偏离: 98%"]
      },
      {
        id: "2-6", timestamp: "10:23:25", agent: "Forensics Agent", agentIcon: Layers, agentColor: "#a78bfa",
        status: "working", message: "关联其他日志...",
        result: ["⚠️ 同IP尝试RDP连接", "⚠️ 查询AD高权限组列表", "⚠️ 导出员工数据"]
      },
      {
        id: "2-7", timestamp: "10:23:28", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#ef4444",
        status: "complete", message: "AI判定: 账号已被攻陷，攻击者获得Domain Admin权限",
        result: ["攻击阶段: Credential Access → Lateral Movement", "置信度: 97%", "风险等级: 极危 (P0)"]
      },
    ],
    evidenceList: [
      { id: "ev2-1", type: "VPN日志", icon: Lock, content: "从俄罗斯IP的异常登录", details: [{ label: "源IP", value: "91.234.56.78" }, { label: "国家", value: "俄罗斯" }, { label: "城市", value: "莫斯科" }], riskLevel: "critical", source: "VPN网关" },
      { id: "ev2-2", type: "用户上下文", icon: User, content: "用户实际位置与登录地点不符", details: [{ label: "用户", value: "张伟 (IT总监)" }, { label: "实际位置", value: "北京" }, { label: "状态", value: "正常出勤中" }], riskLevel: "critical", source: "AD域控" },
      { id: "ev2-3", type: "横向移动", icon: Network, content: "同IP尝试访问多台服务器", details: [{ label: "RDP尝试", value: "12台服务器" }, { label: "AD查询", value: "3次" }, { label: "数据导出", value: "2.3GB" }], riskLevel: "critical", source: "SIEM平台" },
    ],
    correlationLinks: [
      { from: "VPN异地登录", to: "MFA绕过", description: "凭证可能已泄露" },
      { from: "MFA绕过", to: "RDP横向移动", description: "内网侦察开始" },
      { from: "RDP扫描", to: "数据批量导出", description: "数据窃取行为" },
    ],
    conclusion: {
      event: "账号失陷 + 域管权限滥用 - 可能导致全域沦陷",
      confidence: 97,
      attackPhase: "Credential Access → Lateral Movement → Collection",
      recommendations: ["立即禁用admin_zhang账号", "强制断开所有活跃会话", "审查过去24小时的账号操作", "启动全域密码重置流程"],
      riskScore: 98,
    },
  },

  // ===== 事件3: SSH暴力破解 =====
  {
    id: "evt-003",
    eventId: "ALT-2026-0511-003",
    title: "SSH暴力破解攻击检测",
    source: "WAF防火墙",
    sourceIcon: Globe,
    sourceColor: "#eab308",
    severity: "high",
    category: "暴力破解",
    description: "检测到来自多个IP对生产服务器的SSH暴力破解尝试，已持续2小时",
    steps: [
      {
        id: "3-1", timestamp: "11:45:02", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到SSH暴力破解告警",
        result: ["目标: prod-server-03 (192.168.1.103)", "尝试次数: 14,523次", "来源IP数: 8个"]
      },
      {
        id: "3-2", timestamp: "11:45:04", agent: "Log Agent", agentIcon: Search, agentColor: "#22c55e",
        status: "working", message: "分析认证日志模式...",
        result: ["✓ 使用用户名: root, admin, test", "✓ 字典攻击特征明显", "✓ 尝试间隔: 0.3秒/次"]
      },
      {
        id: "3-3", timestamp: "11:45:07", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "匹配攻击者指纹...",
        result: ["✓ IP归属: 中国、越南、巴西", "✓ 工具识别: Medusa, Hydra", "✓ 关联黑客组织: 散装脚本小子"]
      },
      {
        id: "3-4", timestamp: "11:45:10", agent: "Network Agent", agentIcon: Network, agentColor: "#3b82f6",
        status: "working", message: "追踪攻击路径...",
        result: ["✓ 入口: 边界防火墙 (端口22)", "✓ 未使用VPN/跳板机", "⚠️ SSH直接暴露公网"]
      },
      {
        id: "3-5", timestamp: "11:45:13", agent: "Reasoning Agent", agentIcon: Brain, agentColor: "#a78bfa",
        status: "working", message: "评估入侵可能性...", isTyping: true,
        result: ["破解成功率: 0.0068% (目前)", "预计破解时间: 47天", "风险: 中等 (暂未成功)"]
      },
      {
        id: "3-6", timestamp: "11:45:16", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#eab308",
        status: "complete", message: "AI判定: 持续性暴力破解攻击，需加强防护",
        result: ["攻击阶段: Reconnaissance → Weaponization", "置信度: 89%", "建议: 启用fail2ban+密钥认证"]
      },
    ],
    evidenceList: [
      { id: "ev3-1", type: "认证日志", icon: Search, content: "14,523次失败登录尝试", details: [{ label: "时间跨度", value: "2小时" }, { label: "来源IP", value: "8个" }, { label: "速率", value: "120次/分钟" }], riskLevel: "high", source: "系统日志" },
      { id: "ev3-2", type: "攻击工具", icon: Bug, content: "识别到Medusa/Hydra工具特征", details: [{ label: "工具", value: "Medusa v2.2" }, { label: "字典大小", value: "50万条" }, { label: "线程数", value: "16" }], riskLevel: "medium", source: "WAF规则引擎" },
    ],
    correlationLinks: [
      { from: "SSH端口扫描", to: "暴力破解开始", description: "发现开放22端口" },
      { from: "字典攻击", to: "自动化脚本执行", description: "使用已知工具链" },
    ],
    conclusion: {
      event: "SSH暴力破解 - 未成功但需立即加固",
      confidence: 89,
      attackPhase: "Reconnaissance → Weaponization",
      recommendations: ["启用fail2ban自动封禁", "关闭密码登录，仅允许密钥认证", "将SSH移至VPN内部", "配置端口敲门(port knocking)"],
      riskScore: 72,
    },
  },

  // ===== 事件4: DLP数据外泄 =====
  {
    id: "evt-004",
    eventId: "ALT-2026-0511-004",
    title: "敏感数据批量外传检测",
    source: "DLP系统",
    sourceIcon: Eye,
    sourceColor: "#a78bfa",
    severity: "critical",
    category: "数据泄露",
    description: "DLP检测到研发部门员工试图通过个人网盘外传核心代码库，涉及商业机密",
    steps: [
      {
        id: "4-1", timestamp: "14:22:45", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到DLP数据外泄告警",
        result: ["用户: li_wei@company.com", "操作: 上传至百度网盘", "文件大小: 2.3GB"]
      },
      {
        id: "4-2", timestamp: "14:22:47", agent: "DLP Agent", agentIcon: Eye, agentColor: "#a78bfa",
        status: "working", message: "深度内容检查...",
        result: ["✓ 文件类型: 源代码压缩包 (.zip)", "✓ 包含关键词: API_KEY, SECRET, PASSWORD", "✓ 匹配策略: 核心代码保护"]
      },
      {
        id: "4-3", timestamp: "14:22:50", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "分析用户背景...",
        result: ["✓ 部门: 研发中心-AI组", "✓ 职位: 高级工程师", "✓ 入职时间: 2年3个月", "⚠️ 近期有离职倾向(推测)"]
      },
      {
        id: "4-4", timestamp: "14:22:53", agent: "UEBA Agent", agentIcon: Activity, agentColor: "#f97316",
        status: "working", message: "行为基线对比...",
        result: ["✓ 首次使用个人网盘", "✓ 传输时间: 下班后(19:30)", "✓ 历史无此类操作", "⚠️ 异常指数: 94/100"]
      },
      {
        id: "4-5", timestamp: "14:22:56", agent: "Forensics Agent", agentIcon: Layers, agentColor: "#a78bfa",
        status: "working", message: "追溯数据来源...",
        result: ["✓ 文件路径: /src/core/auth-module/", "✓ 最后修改: 今天14:20", "✓ 包含: 支付模块核心逻辑"]
      },
      {
        id: "4-6", timestamp: "14:22:59", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#ef4444",
        status: "complete", message: "AI判定: 高风险内部数据泄露，疑似离职前窃取",
        result: ["攻击阶段: Collection → Exfiltration", "置信度: 93%", "法律风险: 触犯《反不正当竞争法》"]
      },
    ],
    evidenceList: [
      { id: "ev4-1", type: "DLP快照", icon: Eye, content: "2.3GB源代码上传至个人网盘", details: [{ label: "目标平台", value: "百度网盘" }, { label: "文件数", value: "1,245个" }, { label: "敏感等级", value: "绝密" }], riskLevel: "critical", source: "DLP系统" },
      { id: "ev4-2", type: "内容分析", icon: FileText, content: "检测到大量硬编码密钥", details: [{ label: "API Key", value: "23个" }, { label: "数据库密码", value: "8个" }, { label: "私钥文件", value: "3个" }], riskLevel: "critical", source: "DLP内容引擎" },
      { id: "ev4-3", type: "行为画像", icon: User, content: "用户行为严重偏离基线", details: [{ label: "异常评分", value: "94/100" }, { label: "首次操作", value: "个人网盘上传" }, { label: "时间异常", value: "下班后操作" }], riskLevel: "high", source: "UEBA系统" },
    ],
    correlationLinks: [
      { from: "访问核心代码", to: "打包压缩", description: "数据收集阶段" },
      { from: "选择下班时间", to: "使用个人网盘", description: "规避监控意图明显" },
      { from: "大文件传输", to: "触发DLP规则", description: "被安全系统捕获" },
    ],
    conclusion: {
      event: "内部数据泄露 - 核心代码外传风险",
      confidence: 93,
      attackPhase: "Collection → Exfiltration",
      recommendations: ["立即阻断传输并隔离终端", "保全数字取证证据", "HR介入调查(疑似预谋性窃取)", "审查该用户近3个月的所有数据访问记录"],
      riskScore: 91,
    },
  },

  // ===== 事件5: 恶意软件C2通信 =====
  {
    id: "evt-005",
    eventId: "ALT-2026-0511-005",
    title: "Cobalt Beacon C2通信检测",
    source: "EDR终端",
    sourceIcon: Shield,
    sourceColor: "#ef4444",
    severity: "critical",
    category: "恶意软件",
    description: "EDR检测到市场部PC存在Cobalt Strike Beacon进程，正在与外部C2服务器通信",
    steps: [
      {
        id: "5-1", timestamp: "16:08:33", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到EDR恶意软件告警",
        result: ["主机: PC-MARKETING-012", "进程: microsoft_update.exe", "检测引擎: behavioral-AI"]
      },
      {
        id: "5-2", timestamp: "16:08:35", agent: "EDR Agent", agentIcon: Shield, agentColor: "#ef4444",
        status: "working", message: "深度进程分析...",
        result: ["✓ 进程签名: 无效/伪造", "✓ 父进程: Word.exe (宏病毒)", "✓ 内存特征: Cobalt Strike 4.7 Beacon"]
      },
      {
        id: "5-3", timestamp: "16:08:38", agent: "Network Agent", agentIcon: Network, agentColor: "#3b82f6",
        status: "working", message: "追踪网络连接...",
        result: ["✓ C2地址: 203.0.113.55:443", "✓ 通信协议: HTTPS (Stager)", "✓ 心跳间隔: 60秒", "⚠️ 数据外传: 已发送1.2MB"]
      },
      {
        id: "5-4", timestamp: "16:08:41", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "IOC匹配...",
        result: ["✓ C2基础设施已知", "✓ 关联APT-29 (Cozy Bear)", "✓ 活跃时间: 2026年4月起"]
      },
      {
        id: "5-5", timestamp: "16:08:44", agent: "Forensics Agent", agentIcon: Layers, agentColor: "#a78bfa",
        status: "working", message: "回溯攻击入口...",
        result: ["✓ 初始感染: 2小时前", "✓ 载荷: Excel宏 (预算表.xlsx)", "✓ 来源: 客户邮件附件"]
      },
      {
        id: "5-6", timestamp: "16:08:47", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "评估影响范围...",
        result: ["✓ 用户: wang_lei (市场经理)", "✓ 权限: 本地管理员", "✓ 可访问: 市场部文件服务器"]
      },
      {
        id: "5-7", timestamp: "16:08:50", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#ef4444",
        status: "complete", message: "AI判定: APT-29定向攻击，Beacon已建立持久化",
        result: ["攻击阶段: Execution → C2 → Persistence", "置信度: 95%", "紧迫性: 立即处置 (P0)"]
      },
    ],
    evidenceList: [
      { id: "ev5-1", type: "内存取证", icon: Shield, content: "Cobalt Strike Beacon内存特征", details: [{ label: "版本", value: "CS 4.7" }, { label: "配置", value: "Malleable C2 Profile" }, { label: "权限", value: "SYSTEM" }], riskLevel: "critical", source: "EDR引擎" },
      { id: "ev5-2", type: "网络流量", icon: Globe, content: "检测到加密C2心跳流量", details: [{ label: "C2地址", value: "203.0.113.55:443" }, { label: "外传数据", value: "1.2MB" }, { label: "持续时间", value: "2h15m" }], riskLevel: "critical", source: "NDR系统" },
      { id: "ev5-3", type: "攻击链", icon: Bug, content: "完整攻击链已还原", details: [{ label: "入口", value: "Excel宏病毒" }, { label: "载荷", value: "PowerShell Stager" }, { label: "持久化", value: "计划任务注册" }], riskLevel: "critical", source: "取证分析" },
    ],
    correlationLinks: [
      { from: "钓鱼Excel打开", to: "宏代码执行", description: "初始执行向量" },
      { from: "PowerShell下载", to: "Beacon加载", description: "载荷投递" },
      { from: "C2心跳建立", to: "数据回传", description: "命令控制通道激活" },
    ],
    conclusion: {
      event: "APT-29定向攻击 - Cobalt Strike Beacon活跃",
      confidence: 95,
      attackPhase: "Execution → Command & Control → Persistence",
      recommendations: ["立即断开该主机网络", "转储内存用于深度分析", "排查同网段其他主机", "通知威胁情报团队更新IOC"],
      riskScore: 96,
    },
  },

  // ===== 事件6: 横向移动RDP =====
  {
    id: "evt-006",
    eventId: "ALT-2026-0511-006",
    title: "异常RDP横向移动检测",
    source: "SIEM平台",
    sourceIcon: Database,
    sourceColor: "#3b82f6",
    severity: "high",
    category: "横向移动",
    description: "SIEM关联规则触发：单一账号在1小时内通过RDP连接了8台不同服务器",
    steps: [
      {
        id: "6-1", timestamp: "18:33:21", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到横向移动检测告警",
        result: ["账号: svc_backup (备份服务账号)", "RDP会话: 8台主机", "时间窗口: 17:15-18:30"]
      },
      {
        id: "6-2", timestamp: "18:33:23", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "验证账号合法性...",
        result: ["✓ 账号用途: Veeam备份服务", "✓ 正常范围: 仅备份服务器(3台)", "⚠️ 异常: 访问了Web+DB服务器"]
      },
      {
        id: "6-3", timestamp: "18:33:26", agent: "Log Agent", agentIcon: Search, agentColor: "#22c55e",
        status: "working", message: "分析RDP会话详情...",
        result: ["✓ 登录方式: 明文密码 (非Kerberos)", "✓ 源IP: 内网192.168.1.50", "⚠️ 会话时长: 平均3分钟 (太短)"]
      },
      {
        id: "6-4", timestamp: "18:33:29", agent: "UEBA Agent", agentIcon: Activity, agentColor: "#f97316",
        status: "working", message: "计算行为异常值...",
        result: ["✓ 历史基线: 日均2台/天", "✓ 今日偏差: +300%", "✓ 时间分布: 非备份窗口"]
      },
      {
        id: "6-5", timestamp: "18:33:32", agent: "Network Agent", agentIcon: Network, agentColor: "#3b82f6",
        status: "working", message: "追踪源头...",
        result: ["✓ 192.168.1.50 = JUMP-SERVER-01", "⚠️ 该跳板机近期有告警", "⚠️ 可能为攻击者据点"]
      },
      {
        id: "6-6", timestamp: "18:33:35", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#f97316",
        status: "complete", message: "AI判定: 服务账号被盗用进行内网横向渗透",
        result: ["攻击阶段: Lateral Movement → Discovery", "置信度: 88%", "影响: 可能已获取DB权限"]
      },
    ],
    evidenceList: [
      { id: "ev6-1", type: "RDP日志", icon: Network, content: "1小时内8台主机的异常RDP连接", details: [{ label: "账号", value: "svc_backup" }, { label: "目标数", value: "8台" }, { label: "异常程度", value: "+300%" }], riskLevel: "high", source: "Windows Event Log" },
      { id: "ev6-2", type: "跳板机分析", icon: Server, content: "源头机器存在可疑活动", details: [{ label: "跳板机", value: "JUMP-SERVER-01" }, { label: "近期告警", value: "3条" }, { label: "可疑进程", value: "mimikatz.exe" }], riskLevel: "critical", source: "EDR系统" },
    ],
    correlationLinks: [
      { from: "跳板机失陷", to: "盗用svc_backup凭据", description: "凭证转储" },
      { from: "RDP批量扫描", to: "定位高价值目标", description: "内网侦察" },
      { from: "短时连接", to: "快速信息收集", description: "避免长时间暴露" },
    ],
    conclusion: {
      event: "横向移动 - 备份服务账号被盗用",
      confidence: 88,
      attackPhase: "Lateral Movement → Discovery → Collection",
      recommendations: ["立即重置svc_backup密码", "隔离JUMP-SERVER-01", "审计所有8台目标主机的访问日志", "启用RDP限制策略"],
      riskScore: 85,
    },
  },

  // ===== 事件7: 权限提升检测 =====
  {
    id: "evt-007",
    eventId: "ALT-2026-0511-007",
    title: "Windows权限提升攻击检测",
    source: "EDR终端",
    sourceIcon: Shield,
    sourceColor: "#ef4444",
    severity: "high",
    category: "权限提升",
    description: "EDR检测到开发人员笔记本运行Potato系列提权工具，尝试从普通用户提升至SYSTEM",
    steps: [
      {
        id: "7-1", timestamp: "20:15:09", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到权限提升告警",
        result: ["主机: DEV-LAPTOP-023", "用户: zhang_san (开发者)", "检测项: PrintSpoofer利用"]
      },
      {
        id: "7-2", timestamp: "20:15:11", agent: "EDR Agent", agentIcon: Shield, agentColor: "#ef4444",
        status: "working", message: "分析提权过程...",
        result: ["✓ 利用漏洞: CVE-2021-1675 (PrintSpoofer)", "✓ 工具: PrintSpoofer64.exe", "✓ 目标权限: SYSTEM"]
      },
      {
        id: "7-3", timestamp: "20:15:14", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "检查用户权限需求...",
        result: ["✓ 正常权限: Users组 (标准用户)", "✓ 是否申请过管理员: 否", "⚠️ 无合法提权理由"]
      },
      {
        id: "7-4", timestamp: "20:15:17", agent: "Forensics Agent", agentIcon: Layers, agentColor: "#a78bfa",
        status: "working", message: "回溯攻击准备...",
        result: ["✓ 提权前: 下载hack工具包", "✓ 包含: mimikatz, procdump, nmap", "⚠️ 有预谋的渗透测试或攻击"]
      },
      {
        id: "7-5", timestamp: "20:15:20", agent: "UEBA Agent", agentIcon: Activity, agentColor: "#f97316",
        status: "working", message: "行为意图分析...",
        result: ["✓ 用户角色: 后端开发工程师", "✓ 项目: 安全合规项目?", "⚠️ 可能为授权测试但未报备"]
      },
      {
        id: "7-6", timestamp: "20:15:23", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#eab308",
        status: "complete", message: "AI判定: 权限提升行为，需确认是否为授权测试",
        result: ["攻击阶段: Privilege Escalation", "置信度: 82%", "建议: 联系用户确认或HR/安全团队介入"]
      },
    ],
    evidenceList: [
      { id: "ev7-1", type: "进程树", icon: Shield, content: "PrintSpoofer提权进程链", details: [{ label: "父进程", value: "cmd.exe" }, { label: "提权工具", value: "PrintSpoofer64.exe" }, { label: "结果权限", value: "SYSTEM" }], riskLevel: "high", source: "EDR" },
      { id: "ev7-2", type: "文件系统", icon: FileText, content: "发现渗透测试工具集", details: [{ label: "工具数量", value: "12个" }, { label: "目录", value: "C:\\tools\\" }, { label: "下载时间", value: "今天14:20" }], riskLevel: "medium", source: "文件监控" },
    ],
    correlationLinks: [
      { from: "下载攻击工具", to: "本地存储", description: "武器化准备" },
      { from: "运行提权工具", to: "获取SYSTEM权限", description: "利用漏洞" },
    ],
    conclusion: {
      event: "权限提升攻击 - PrintSpoofer利用",
      confidence: 82,
      attackPhase: "Privilege Escalation",
      recommendations: ["立即终止PrintSpoofer进程", "联系zhang_san确认操作原因", "如未授权则按安全事件处理", "审查是否需要补充红队测试流程"],
      riskScore: 78,
    },
  },

  // ===== 事件8: DNS隧道检测 =====
  {
    id: "evt-008",
    eventId: "ALT-2026-0511-008",
    title: "DNS隧道数据外传检测",
    source: "SIEM平台",
    sourceIcon: Database,
    sourceColor: "#3b82f6",
    severity: "high",
    category: "隐蔽通道",
    description: "DNS查询异常检测：某主机通过DNS TXT记录大量编码数据，疑似建立DNS隧道",
    steps: [
      {
        id: "8-1", timestamp: "21:45:12", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到DNS异常查询告警",
        result: ["主机: HR-SERVER-005", "查询量: 15,000次/hour", "域名模式: random.xyz123.com"]
      },
      {
        id: "8-2", timestamp: "21:45:14", agent: "Network Agent", agentIcon: Network, agentColor: "#3b82f6",
        status: "working", message: "分析DNS流量模式...",
        result: ["✓ 子域名长度: 53字符 (异常长)", "✓ 编码方式: Base64", "✓ 每次查询唯一 (无缓存)"]
      },
      {
        id: "8-3", timestamp: "21:45:17", agent: "DNS Analysis Agent", agentIcon: Globe, agentColor: "#22c55e",
        status: "working", message: "解码DNS payload...",
        result: ["✓ 解码样本: /etc/passwd 内容片段", "✓ 隧道工具: dns2tcp 或 iodine", "✓ 方向: 出站数据传输"]
      },
      {
        id: "8-4", timestamp: "21:45:20", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "确认主机用途...",
        result: ["✓ 主机角色: HR自助服务门户", "✓ 正常DNS: 应<500次/小时", "⚠️ 异常倍率: 30x"]
      },
      {
        id: "8-5", timestamp: "21:45:23", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "检查C2域名...",
        result: ["✓ NS记录指向: 恶意DNS服务器", "✓ IP: 198.51.100.23 (海外)", "✓ 历史情报: 已知DNS隧道基础设施"]
      },
      {
        id: "8-6", timestamp: "21:45:26", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#f97316",
        status: "complete", message: "AI判定: DNS隧道活跃，数据正被外传",
        result: ["攻击阶段: Command & Control (Data Exfil)", "置信度: 91%", "估算外传: ~50MB/小时"]
      },
    ],
    evidenceList: [
      { id: "ev8-1", type: "DNS流量", icon: Globe, content: "异常高频DNS TXT查询", details: [{ label: "查询频率", value: "15,000/小时" }, { label: "子域名长度", value: "53字符" }, { label: "编码", value: "Base64" }], riskLevel: "high", source: "DNS服务器" },
      { id: "ev8-2", type: "解码内容", icon: Code2, content: "DNS payload解码后发现敏感数据", details: [{ label: "内容类型", value: "/etc/passwd 片段" }, { label: "隧道工具", value: "dns2tcp" }, { label: "方向", value: "出站" }], riskLevel: "critical", source: "流量分析器" },
    ],
    correlationLinks: [
      { from: "恶意软件安装", to: "DNS隧道客户端启动", description: "建立隐蔽通道" },
      { from: "Base64编码数据", to: "DNS子域名封装", description: "数据包装" },
      { from: "DNS查询外传", to: "C2服务器接收", description: "数据泄露完成" },
    ],
    conclusion: {
      event: "DNS隧道数据外传 - 绕过防火墙的隐蔽通道",
      confidence: 91,
      attackPhase: "Command & Control (Data Exfiltration)",
      recommendations: ["立即阻断该主机的DNS出站(除白名单)", "隔离HR-SERVER-005进行取证", "分析已外传的数据内容", "检查其他主机是否有类似DNS模式"],
      riskScore: 88,
    },
  },

  // ===== 事件9: 凭证转储 =====
  {
    id: "evt-009",
    eventId: "ALT-2026-0511-009",
    title: "LSASS内存凭证转储检测",
    source: "EDR终端",
    sourceIcon: Shield,
    sourceColor: "#ef4444",
    severity: "critical",
    category: "凭证窃取",
    description: "EDR检测到域控制器上存在lsass.exe内存转储行为，攻击者试图提取域管理员哈希",
    steps: [
      {
        id: "9-1", timestamp: "22:18:45", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到凭证转储紧急告警",
        result: ["目标: DC-PRIMARY-01 (主域控)", "进程: procdump64.exe", "目标进程: lsass.exe"]
      },
      {
        id: "9-2", timestamp: "22:18:47", agent: "EDR Agent", agentIcon: Shield, agentColor: "#ef4444",
        status: "working", message: "实时阻断分析...",
        result: ["✓ 已自动阻止procdump", "✓ lsass受保护(已开启PPL)", "⚠️ 但可能有其他尝试"]
      },
      {
        id: "9-3", timestamp: "22:18:50", agent: "Forensics Agent", agentIcon: Layers, agentColor: "#a78bfa",
        status: "working", message: "回溯攻击者路径...",
        result: ["✓ 入侵时间: 约3小时前", "✓ 初始入口: VPN (zhang_admin账号)", "✓ 已获取: Domain Admin权限"]
      },
      {
        id: "9-4", timestamp: "22:18:53", agent: "Identity Agent", agentIcon: User, agentColor: "#8b5cf6",
        status: "working", message: "评估凭证暴露风险...",
        result: ["✓ 内存中的哈希: ~2,000个", "✓ 包含: krbtgt, 所有DA账号", "⚠️ 若成功=全域沦陷"]
      },
      {
        id: "9-5", timestamp: "22:18:56", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "匹配TTP...",
        result: ["✓ MITRE ATT&CK: T1003 (OS Credential Dumping)", "✓ 工具链: Mimikatz -> Procdump -> Samdump", "✓ 组织手法: 类似FIN7"]
      },
      {
        id: "9-6", timestamp: "22:18:59", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#ef4444",
        status: "complete", message: "AI判定: 域控上的黄金票据攻击准备，极高风险",
        result: ["攻击阶段: Credential Access → Defense Evasion", "置信度: 98%", "影响: 可能导致全域权限永久维持"]
      },
    ],
    evidenceList: [
      { id: "ev9-1", type: "进程监控", icon: Shield, content: "procdump64尝试转储lsass", details: [{ label: "攻击进程", value: "procdump64.exe" }, { label: "目标", value: "lsass.exe (PID 652)" }, { label: "状态", value: "已拦截" }], riskLevel: "critical", source: "EDR实时防护" },
      { id: "ev9-2", type: "权限分析", icon: Key, content: "攻击者已获Domain Admin", details: [{ label: "当前权限", value: "DOMAIN\\Administrator" }, { label: "在线会话", value: "3个" }, { label: "可访问", value: "所有域资源" }], riskLevel: "critical", source: "AD审计" },
      { id: "ev9-3", type: "TTP映射", icon: Target, content: "匹配MITRE T1003 + T1558", details: [{ label: "技术ID", value: "T1003.001" }, { label: "战术", value: "Credential Access" }, { label: "组织", value: "FIN7风格" }], riskLevel: "critical", source: "威胁情报" },
    ],
    correlationLinks: [
      { from: "VPN账号失陷", to: "域管权限获取", description: "权限升级路径" },
      { from: "登录域控", to: "尝试凭证转储", description: "攻击目标明确" },
      { from: "lsass转储", to: "Pass-the-Hash/Ticket", description: "后续攻击计划" },
    ],
    conclusion: {
      event: "域控凭证转阻 - 黄金票据攻击准备",
      confidence: 98,
      attackPhase: "Credential Access → Lateral Movement → Persistence",
      recommendations: ["立即重置krbtgt密码 (2次)", "强制注销所有Domain Admin会话", "检查是否有DCSync攻击痕迹", "考虑重建域控 (若污染严重)"],
      riskScore: 99,
    },
  },

  // ===== 事件10: 供应链攻击 =====
  {
    id: "evt-010",
    eventId: "ALT-2026-0511-010",
    title: "第三方软件更新供应链攻击",
    source: "EDR终端",
    sourceIcon: Shield,
    sourceColor: "#ef4444",
    severity: "critical",
    category: "供应链攻击",
    description: "检测到Notepad++官方更新通道被劫持，推送的安装包包含后门程序",
    steps: [
      {
        id: "10-1", timestamp: "23:55:01", agent: "SOC Agent", agentIcon: Radio, agentColor: "#3b82f6",
        status: "complete", message: "收到软件篡改告警",
        result: ["软件: Notepad++ v8.5.6 updater", "影响范围: 127台终端", "检测点: 代码签名验证失败"]
      },
      {
        id: "10-2", timestamp: "23:55:03", agent: "Malware Agent", agentIcon: Bug, agentColor: "#ef4444",
        status: "working", message: "分析恶意载荷...",
        result: ["✓ 文件哈希: 不匹配官方", "✓ 包含: Shellcode注入", "✓ 功能: 远程代码执行后门"]
      },
      {
        id: "10-3", timestamp: "23:55:06", agent: "Network Agent", agentIcon: Network, agentColor: "#3b82f6",
        status: "working", message: "追踪更新服务器...",
        result: ["✓ 官方CDN: 被DNS hijack", "✓ 恶意服务器: 仿冒更新节点", "✓ 影响用户: 全球 (不仅我们)"]
      },
      {
        id: "10-4", timestamp: "23:55:09", agent: "Threat Intel Agent", agentIcon: Target, agentColor: "#ef4444",
        status: "working", message: "全球情报同步...",
        result: ["✓ 多家安全厂商已确认", "✓ 攻击类型: Supply Chain Compromise", "✓ 可能幕后: 国家级APT"]
      },
      {
        id: "10-5", timestamp: "23:55:12", agent: "Impact Agent", agentIcon: AlertTriangle, agentColor: "#f97316",
        status: "working", message: "评估内部影响...",
        result: ["⚠️ 已下载: 45台", "⚠️ 已安装: 12台", "⚠️ 其中3台: 开发环境(高危)"]
      },
      {
        id: "10-6", timestamp: "23:55:15", agent: "Response Agent", agentIcon: ShieldAlert, agentColor: "#ef4444",
        status: "working", message: "启动应急响应...",
        result: ["✓ 已阻断更新URL", "✓ 推送卸载脚本", "✓ 隔离已感染主机"]
      },
      {
        id: "10-7", timestamp: "23:55:18", agent: "Conclusion Agent", agentIcon: CheckCircle2, agentColor: "#ef4444",
        status: "complete", message: "AI判定: 大规模供应链攻击，需全员应急响应",
        result: ["攻击阶段: Supply Chain → Initial Access (Massive)", "置信度: 99%", "影响等级: 企业级安全事件"]
      },
    ],
    evidenceList: [
      { id: "ev10-1", type: "文件完整性", icon: FileText, content: "Notepad++安装包签名无效", details: [{ label: "预期哈希", value: "ABC123... (官方)" }, { label: "实际哈希", value: "XYZ789... (篡改)" }, { label: "差异", value: "+2.3MB后门代码" }], riskLevel: "critical", source: "代码签名验证" },
      { id: "ev10-2", type: "影响范围", icon: Upload, content: "127台终端收到恶意更新", details: [{ label: "总终端", value: "127台" }, { label: "已下载", value: "45台" }, { label: "已安装", value: "12台 (3台高危)" }], riskLevel: "critical", source: "资产管理" },
      { id: "ev10-3", type: "全球协同", icon: Globe, content: "多家企业同时遭受攻击", details: [{ label: "确认受害", value: "50+家企业" }, { label: "行业", value: "科技、金融、政府" }, { label: "攻击规模", value: "全球性" }], riskLevel: "critical", source: "威胁情报联盟" },
    ],
    correlationLinks: [
      { from: "CDN/DNS劫持", to: "恶意更新包分发", description: "供应链污染" },
      { from: "用户自动更新", to: "后门静默安装", description: "信任关系利用" },
      { from: "后门激活", to: "C2大规模上线", description: "僵尸网络构建" },
    ],
    conclusion: {
      event: "供应链攻击 - Notepad++更新通道被劫持",
      confidence: 99,
      attackPhase: "Supply Chain Compromise → Initial Access (Massive Scale)",
      recommendations: ["立即全网阻断notepad-plus-plus.org", "强制所有终端卸载并重装官方版", "发布全员安全通告", "联系Notepad++官方确认事件", "考虑临时禁止所有第三方软件自动更新"],
      riskScore: 97,
    },
  },
]

const dataSources: DataSource[] = [
  { id: "email", name: "邮件网关", icon: FileText, status: "active", eventCount: 1247, lastEvent: "钓鱼邮件检测", color: "#ef4444" },
  { id: "vpn", name: "VPN网关", icon: Lock, status: "active", eventCount: 389, lastEvent: "异地登录告警", color: "#f97316" },
  { id: "edr", name: "EDR终端", icon: Shield, status: "active", eventCount: 567, lastEvent: "恶意进程检测", color: "#ef4444" },
  { id: "waf", name: "WAF防火墙", icon: Globe, status: "active", eventCount: 234, lastEvent: "暴力破解拦截", color: "#eab308" },
  { id: "ueba", name: "UEBA行为", icon: Activity, status: "active", eventCount: 678, lastEvent: "行为基线偏离", color: "#f97316" },
  { id: "ad", name: "AD域控", icon: Server, status: "idle", eventCount: 145, lastEvent: "异常权限变更", color: "#22c55e" },
  { id: "siem", name: "SIEM平台", icon: Database, status: "active", eventCount: 2345, lastEvent: "关联规则触发", color: "#3b82f6" },
  { id: "dlp", name: "DLP系统", icon: Eye, status: "active", eventCount: 89, lastEvent: "敏感数据外发", color: "#a78bfa" },
]

const aiAgents: AIAgent[] = [
  { id: "soc", name: "SOC 分析员", icon: Radio, status: "waiting", currentTask: "等待事件输入...", color: "#3b82f6" },
  { id: "identity", name: "身份分析员", icon: User, status: "waiting", currentTask: "待命中", color: "#8b5cf6" },
  { id: "threat", name: "威胁情报员", icon: Target, status: "waiting", currentTask: "待命中", color: "#ef4444" },
  { id: "ueba", name: "行为分析师", icon: Activity, status: "waiting", currentTask: "待命中", color: "#f97316" },
  { id: "forensics", name: "取证分析员", icon: Layers, status: "waiting", currentTask: "待命中", color: "#a78bfa" },
  { id: "reasoning", name: "推理引擎", icon: Brain, status: "waiting", currentTask: "待命中", color: "#a78bfa" },
  { id: "conclusion", name: "结论生成器", icon: CheckCircle2, status: "waiting", currentTask: "待命中", color: "#22c55e" },
]

/** Agent名称到ID的映射表（用于推理进度与右侧面板联动） */
const AGENT_NAME_TO_ID_MAP: Record<string, string> = {
  "SOC Agent": "soc",
  "Identity Agent": "identity",
  "AD Agent": "identity",
  "Threat Intel Agent": "threat",
  "UEBA Agent": "ueba",
  "Forensics Agent": "forensics",
  "Mail Agent": "soc",
  "Reasoning Agent": "reasoning",
  "Conclusion Agent": "conclusion",
}

// ==================== UI 组件 ====================

function useCurrentTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return time
}

function AnimatedPulse({ active }: { active: boolean }) {
  return (
    <div className={`size-2 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
  )
}

function DataSourceCard({ source, index }: { source: DataSource; index: number }) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (source.status === "active") {
      const interval = setInterval(() => setPulse((p) => !p), 2000 + index * 300)
      return () => clearInterval(interval)
    }
  }, [source.status, index])

  const Icon = source.icon

  return (
    <div className="group relative" role="button" tabIndex={0} aria-label={`${source.name}: ${source.eventCount}个事件`}>
      <div className={`
        relative ${RADIUS.md} border p-2 transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/50
        ${source.status === "active"
          ? `border-current/20 bg-white dark:bg-slate-800 hover:border-current/40`
          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"}
      `} style={{ color: source.color }}>
        <div className="flex items-center gap-2">
          <div className={`flex size-6 items-center justify-center ${RADIUS.sm} transition-[transform] duration-300 ${
            source.status === "active" ? "bg-current/10 scale-105" : "bg-slate-100 dark:bg-slate-800"
          }`} style={{ color: source.color }}>
            <Icon className="size-3" aria-hidden="true" />
          </div>
          <span className={String(TYPOGRAPHY.micro) + " font-medium text-slate-700 dark:text-slate-300 truncate"}>{source.name}</span>
          <span className="text-[10px] font-mono text-slate-400 tabular-nums ml-auto">{source.eventCount.toLocaleString()}</span>
          <AnimatedPulse active={source.status === "active"} />
        </div>
      </div>

      {source.status === "active" && pulse && (
        <div className="absolute -top-1 -right-1 size-2 rounded-full animate-ping" style={{ backgroundColor: source.color }} aria-hidden="true" />
      )}
    </div>
  )
}

function AgentCard({ agent, dynamicStatus }: { agent: AIAgent; dynamicStatus?: 'waiting' | 'thinking' | 'analyzing' | 'complete' }) {
  const Icon = agent.icon

  const effectiveStatus = dynamicStatus || agent.status

  const statusStyles = {
    thinking: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
    analyzing: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-300" },
    waiting: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
    complete: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300" },
  }

  const statusText = {
    thinking: "思考中...",
    analyzing: "分析中...",
    waiting: "待命中",
    complete: "已完成",
  }

  const currentStyle = statusStyles[effectiveStatus]

  return (
    <div className={`group relative overflow-hidden ${RADIUS.lg} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-600`} role="article" aria-label={`${agent.name}: ${statusText[effectiveStatus]}`}>
      <div className={`flex items-center gap-2.5`}>
        <div className={`relative flex size-8 shrink-0 items-center justify-center ${RADIUS.md} transition-[transform] duration-200 group-hover:scale-105`} style={{ backgroundColor: `${agent.color}10` }}>
          <Icon className="size-4 transition-transform duration-200" style={{ color: agent.color }} aria-hidden="true" />

          {(effectiveStatus === "thinking" || effectiveStatus === "analyzing") && (
            <>
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white animate-ping" style={{ backgroundColor: agent.color }} aria-hidden="true" />
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full" style={{ backgroundColor: agent.color }} aria-hidden="true" />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={String(TYPOGRAPHY.micro) + " font-semibold text-slate-800 truncate"}>{agent.name}</span>
            <span className={`${TYPOGRAPHY.micro} font-medium px-1.5 py-0.5 rounded-full ${currentStyle.bg} ${currentStyle.text} shrink-0`}>
              {statusText[effectiveStatus]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
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
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </span>
  )
}

function EvidenceCard({ evidence, delay }: { evidence: Evidence; delay: number }) {
  const [visible, setVisible] = useState(false)

  // 安全检查：确保evidence对象完整
  if (!evidence || !evidence.icon) {
    devWarn('⚠️ Invalid evidence object:', evidence)
    return null
  }

  const Icon = evidence.icon

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (!visible) return null

  // 使用设计令牌的颜色系统
  const severityStyle = getSeverityStyles(evidence.riskLevel)
  const color = evidence.riskLevel === "critical" ? "#ef4444" :
                evidence.riskLevel === "high" ? "#f97316" :
                evidence.riskLevel === "medium" ? "#eab308" : "#22c55e"

  return (
    <div className={`group relative overflow-hidden ${RADIUS.lg} border-2 p-3 bg-white dark:bg-slate-800 animate-slideInLeft`} style={{ borderColor: `${color}40`, animationDelay: `${delay}ms` }} role="article" aria-label={`证据: ${evidence.type}, 风险等级: ${evidence.riskLevel}`}>
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} aria-hidden="true" />

      <div className={`flex items-start gap-${SPACING.sm} mb-2`}>
        <div className={`flex size-7 items-center justify-center ${RADIUS.sm}`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="size-3.5" style={{ color }} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={String(TYPOGRAPHY.caption) + " font-bold text-slate-700"}>{evidence.type}</span>
            <span
              className={`${TYPOGRAPHY.micro} font-bold px-1.5 py-0.5 rounded text-white uppercase`}
              style={{ backgroundColor: color }}
            >
              {evidence.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <p className={String(TYPOGRAPHY.micro) + " font-semibold text-slate-800 mb-2"}>{evidence.content}</p>

      {evidence.details && (
        <div className={`space-y-1 mb-2`}>
          {evidence.details.map((detail, i) => (
            <div key={i} className={`flex items-center justify-between ${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")}`}>
              <span className="text-slate-500">{detail.label}</span>
              <span className="font-medium text-slate-700">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700`}>
        <Server className="size-2.5 text-slate-400" aria-hidden="true" />
        <span className={String(TYPOGRAPHY.micro) + " text-slate-500"}>{evidence.source}</span>
      </div>

      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
        <CheckCircle2 className="size-4" style={{ color }} />
      </div>
    </div>
  )
}

function CorrelationFlow({ links }: { links: CorrelationLink[] }) {
  const [visibleLinks, setVisibleLinks] = useState<number[]>([])

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < links.length) {
        setVisibleLinks((prev) => [...prev, index])
        index++
      } else {
        clearInterval(timer)
      }
    }, 1500)

    return () => clearInterval(timer)
  }, [links])

  return (
    <div className="mt-3 space-y-2">
      <div className={`flex items-center gap-2 ${TYPOGRAPHY.micro} font-semibold text-slate-600`}>
        <Network className="size-3.5" aria-hidden="true" />
        攻击链关联分析
      </div>

      {links.map((link, i) => {
        if (!link || !link.from || !link.to) {
          devWarn('⚠️ Invalid link object:', link)
          return null
        }

        return (
        <div
          key={`correlation-link-${i}`}
          className={`flex items-center gap-2 transition-[opacity,transform] duration-700 ${visibleLinks.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
          role="listitem"
          aria-label={`${link.from} → ${link.to}: ${link.description}`}
        >
          <div className={`${RADIUS.md} border border-slate-200 bg-white flex-1 px-3 py-2 text-center`}>
            <span className={String(TYPOGRAPHY.body) + " font-medium text-slate-700"}>{link.from}</span>
            <p className={`${TYPOGRAPHY.micro} text-slate-400 mt-0.5`}>{link.description}</p>
          </div>

          <ArrowRight className="size-4 text-cyan-500 shrink-0" aria-hidden="true" />

          <div className={`${RADIUS.md} border border-slate-200 bg-white flex-1 px-3 py-2 text-center`}>
            <span className={String(TYPOGRAPHY.body) + "font-medium text-slate-700"}>{link.to}</span>
          </div>
        </div>
        )
      })}

      {visibleLinks.length === links.length && (
        <div className="pt-2 animate-fadeIn">
          <div className={`${TYPOGRAPHY.micro} text-emerald-600 font-semibold flex items-center gap-1`}>
            <CheckCircle2 className="size-3" aria-hidden="true" />
            攻击链完整性：{links.length === 3 ? "100%" : `${Math.round((links.length / 3) * 100)}%`}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 核心：多事件推理流 ====================

interface EventState {
  currentIndex: number
  currentStep: number
  visibleSteps: AIThinkingStep[]
  showEvidence: boolean
  isAnalyzing: boolean
}

function ReasoningStream({ useRealData, onToggleMode, onAgentStatusChange }: {
  useRealData: boolean
  onToggleMode: () => void
  onAgentStatusChange?: (statuses: Record<string, 'waiting' | 'thinking' | 'analyzing' | 'complete'>) => void
}) {
  const [eventState, setEventState] = useState<EventState>({
    currentIndex: 0,
    currentStep: -1,
    visibleSteps: [],
    showEvidence: false,
    isAnalyzing: false,
  })

  // 防止重复启动分析的标志
  const hasStartedAnalysis = useRef(false)

  // 真实事件数据（从API获取）
  const [realEvents, setRealEvents] = useState<SecurityEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const evidenceRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // 根据模式选择数据源
  const currentEvents = useRealData ? realEvents : securityEvents
  const currentEvent = currentEvents[eventState.currentIndex]
  const totalEvents = currentEvents.length

  // 从API获取真实事件数据
  const fetchRealEvents = useCallback(async () => {
    setIsLoadingEvents(true)
    setApiError(null)
    
    try {
      const response = await fetch('/api/v1/api-analysis/events?limit=10')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.events && data.events.length > 0) {
        setRealEvents(data.events)
        devLog(`✅ 成功获取 ${data.events.length} 个真实安全事件`)
      } else {
        // API返回空，生成一些示例事件
        devLog('⚠️ API返回空数据，生成示例事件...')
        await generateSampleEvents()
      }

    } catch (error) {
      devError('❌ 获取真实事件失败:', error)
      setApiError(error instanceof Error ? error.message : '未知错误')

      // 降级：生成示例数据
      devLog('🔄 降级到示例数据...')
      await generateSampleEvents()
    } finally {
      setIsLoadingEvents(false)
    }
  }, [])

  // 生成示例事件（当API无数据时调用）
  const generateSampleEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/api-analysis/simulate/generate-sample-events?count=5', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.events && data.events.length > 0) {
          setRealEvents(data.events)
        }
      }
    } catch (error) {
      devError('生成示例事件失败:', error)
    }
  }, [])

  // 当 useRealData 改变时，重新获取数据
  useEffect(() => {
    if (useRealData) {
      fetchRealEvents()
    } else {
      // 切回演示模式时，清空真实数据并使用内置数据
      setRealEvents([])
      setApiError(null)
      // 重置状态并重新开始演示
      resetAndStartDemo()
    }
  }, [useRealData])

  // 重置演示状态（不自动启动，由外部控制）
  const resetAndStartDemo = () => {
    clearTimers()
    setEventState({
      currentIndex: 0,
      currentStep: -1,
      visibleSteps: [],
      showEvidence: false,
      isAnalyzing: false,
    })
  }

  // 清理定时器
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // 开始分析新事件
  const startEventAnalysis = useCallback((eventIndex: number) => {
    // 防止重复启动：如果已经在分析中且是同一个事件，跳过
    if (eventState.isAnalyzing) {
      devLog('⏭️ 已有分析正在进行，跳过重复启动')
      return
    }

    clearTimers()

    // 确保索引有效
    if (eventIndex >= currentEvents.length) {
      devWarn(`⚠️ 事件索引 ${eventIndex} 超出范围 (总数: ${currentEvents.length})`)
      return
    }

    const event = currentEvents[eventIndex]
    if (!event) {
      devError('❌ 事件不存在:', eventIndex)
      return
    }

    devLog(`🚀 开始分析事件 ${eventIndex + 1}/${totalEvents}: ${event.title}`)

    // 设置初始状态
    setEventState({
      currentIndex: eventIndex,
      currentStep: -1,
      visibleSteps: [],
      showEvidence: false,
      isAnalyzing: true,
    })

    // 延迟一点让UI渲染
    setTimeout(() => {
      let stepIndex = 0
      const addedStepIds = new Set<string>()

      const addStep = () => {
        if (stepIndex >= event.steps.length) return

        const step = event.steps[stepIndex]

        // 去重：防止同一步骤被添加多次
        if (addedStepIds.has(step.id)) {
          stepIndex++
          const timer = setTimeout(addStep, 2500)
          timersRef.current.push(timer)
          return
        }

        addedStepIds.add(step.id)
        setEventState(prev => ({
          ...prev,
          currentStep: stepIndex,
          visibleSteps: [...prev.visibleSteps, step],
        }))

        // 最后一步完成后显示证据
        if (stepIndex === event.steps.length - 1) {
          setTimeout(() => {
            setEventState(prev => ({ ...prev, showEvidence: true }))
            setTimeout(() => {
              evidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 100)

            // 证据显示完后，准备下一个事件
            setTimeout(() => {
              const nextIndex = (eventIndex + 1) % totalEvents
              devLog(`➡️ 准备进入下一个事件: ${nextIndex + 1}`)

              // 显示过渡提示
              setEventState(prev => ({ ...prev, isAnalyzing: false }))

              // 3秒后开始下一个事件
              setTimeout(() => {
                startEventAnalysis(nextIndex)
              }, 3000)
            }, 8000) // 证据展示8秒
          }, 2000)
        }

        stepIndex++
        const timer = setTimeout(addStep, 2500)
        timersRef.current.push(timer)
      }

      // 第一个步骤延迟800ms
      const firstTimer = setTimeout(addStep, 800)
      timersRef.current.push(firstTimer)
    }, 100)
  }, [totalEvents, clearTimers, currentEvents])

  // 启动第一个事件
  useEffect(() => {
    const startTimer = setTimeout(() => {
      startEventAnalysis(0)
    }, 500)

    return () => {
      clearTimeout(startTimer)
      clearTimers()
    }
  }, [])

  // 同步Agent状态到右侧面板
  useEffect(() => {
    if (!onAgentStatusChange) return

    const statuses: Record<string, 'waiting' | 'thinking' | 'analyzing' | 'complete'> = {}

    // 先把所有agent初始化为waiting
    aiAgents.forEach(a => { statuses[a.id] = "waiting" })

    // 根据visibleSteps更新状态
    eventState.visibleSteps.forEach((step, idx) => {
      const agentId = AGENT_NAME_TO_ID_MAP[step.agent]
      if (agentId) {
        if (step.status === "complete") {
          statuses[agentId] = "complete"
        } else if (idx === eventState.visibleSteps.length - 1) {
          // 最后一个正在执行的步骤
          statuses[agentId] = step.status === "working" ? "analyzing" : "thinking"
        } else {
          // 已执行完但不是最后一步（中间步骤）
          statuses[agentId] = "complete"
        }
      }
    })

    onAgentStatusChange(statuses)
  }, [eventState.visibleSteps, onAgentStatusChange])

  // 平滑滚动
  useEffect(() => {
    if (containerRef.current && eventState.visibleSteps.length > 0) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [eventState.visibleSteps, eventState.showEvidence])

  // 事件过渡界面
  if (!eventState.isAnalyzing && eventState.showEvidence) {
    const nextEvent = securityEvents[(eventState.currentIndex + 1) % totalEvents]
    const NextIcon = nextEvent.sourceIcon

    return (
      <div className="h-full flex flex-col items-center justify-center space-y-5 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center justify-center size-16 ${RADIUS.xl} bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200`}>
            <CheckCircle2 className="size-8 text-emerald-600 animate-pulse" aria-hidden="true" />
          </div>

          <div>
            <h3 className={String(TYPOGRAPHY.h2) + " text-slate-800"}>AI研判完成</h3>
            <p className={`${TYPOGRAPHY.body} text-slate-500 mt-1`}>{currentEvent.title}</p>
          </div>

          <div className={`flex items-center justify-center gap-4 ${TYPOGRAPHY.caption} text-slate-600`}>
            <span className={`px-2 py-1 ${RADIUS.md} bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200`}>
              置信度: <strong className="text-emerald-700">{currentEvent.conclusion.confidence}%</strong>
            </span>
            <span className={`px-2 py-1 ${RADIUS.md} bg-red-50 dark:bg-red-900/20 border border-red-200`}>
              风险评分: <strong className="text-red-700">{currentEvent.conclusion.riskScore}</strong>
            </span>
          </div>
        </div>

        <div className={`w-full max-w-lg space-y-${SPACING.md} pt-4 border-t border-slate-200 dark:border-slate-700`}>
          <div className={`flex items-center gap-2 ${TYPOGRAPHY.body} text-slate-600`}>
            <Radio className="size-4 text-blue-600 animate-pulse" aria-hidden="true" />
            <span className="font-medium">检测到新的安全告警</span>
          </div>

          <div className={`flex items-center gap-3 p-3.5 ${RADIUS.xl} bg-white dark:bg-slate-800 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer`} role="button" tabIndex={0} aria-label={`下一个事件: ${nextEvent.title}`}>
            <div className={`flex size-9 items-center justify-center ${RADIUS.lg} shrink-0`} style={{ backgroundColor: `${nextEvent.sourceColor}12` }}>
              <NextIcon className="size-4.5" style={{ color: nextEvent.sourceColor }} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`${TYPOGRAPHY.micro} font-semibold text-slate-800 truncate`}>{nextEvent.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`${TYPOGRAPHY.micro} px-1.5 py-0.5 rounded text-white font-medium`}
                  style={{ backgroundColor: nextEvent.severity === "critical" ? "#ef4444" : nextEvent.severity === "high" ? "#f97316" : "#eab308" }}
                >
                  {nextEvent.severity.toUpperCase()}
                </span>
                <span className={`${TYPOGRAPHY.micro} text-slate-500`}>来源: {nextEvent.source}</span>
              </div>
            </div>
            <ArrowRight className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
          </div>

          <div className="flex justify-center pt-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className={`${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} text-slate-400 ml-2`}>AI正在接入...</span>
          </div>
        </div>
      </div>
    )
  }

  // 安全检查：确保currentEvent存在（防止切换模式时崩溃）
  if (!currentEvent || currentEvents.length === 0) {
    return (
      <div ref={containerRef} className="h-full flex flex-col items-center justify-center">
        {useRealData ? (
          <div className="text-center space-y-4 max-w-md">
            <Database className="size-16 text-slate-300 mx-auto" />
            <p className="text-lg font-semibold text-slate-700">暂无安全事件</p>
            <p className="text-sm text-slate-500">
              {apiError ? (
                <>连接失败: <strong className="text-red-600">{apiError}</strong></>
              ) : isLoadingEvents ? (
                "正在从AI分析引擎获取数据..."
              ) : (
                "API未返回事件数据"
              )}
            </p>
            
            {!isLoadingEvents && (
              <div className="flex gap-3 justify-center pt-3">
                {apiError && (
                  <button
                    onClick={fetchRealEvents}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔄 重试连接
                  </button>
                )}
                <button
                    onClick={onToggleMode}
                    className="px-4 py-2 bg-cyan-100 text-cyan-700 text-sm rounded-lg hover:bg-cyan-200 transition-colors"
                  >
                    切回演示模式
                  </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Brain className="size-16 animate-pulse text-cyan-400 mx-auto" />
            <p className="text-lg font-semibold text-cyan-600">AI 引擎初始化中</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-3 pt-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent scroll-smooth">
      <div className="space-y-3 pb-4">
        {/* 事件标题卡片 */}
        <div className={`${RADIUS.lg} border-2 p-4 bg-white dark:bg-slate-800`} style={{ borderColor: `${currentEvent.sourceColor}30` }}>
          <div className={`flex items-start gap-${SPACING.md}`}>
            <div className={`flex size-12 items-center justify-center ${RADIUS.lg} shrink-0`} style={{ backgroundColor: `${currentEvent.sourceColor}15` }}>
              <currentEvent.sourceIcon className="size-6" style={{ color: currentEvent.sourceColor }} aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`${TYPOGRAPHY.micro} font-bold px-1.5 py-0.5 rounded text-white uppercase`}
                  style={{
                    backgroundColor: currentEvent.severity === "critical" ? "#ef4444" :
                                   currentEvent.severity === "high" ? "#f97316" :
                                   currentEvent.severity === "medium" ? "#eab308" : "#22c55e"
                  }}
                >
                  {currentEvent.severity === "critical" ? "CRITICAL" :
                   currentEvent.severity === "high" ? "HIGH" :
                   currentEvent.severity === "medium" ? "MEDIUM" : "LOW"}
                </span>
                <span className={`font-mono ${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} text-slate-400`}>{currentEvent.eventId}</span>
              </div>

              <h3 className={String(TYPOGRAPHY.h3) + " text-slate-900 mb-1"}>{currentEvent.title}</h3>
              <p className={String(TYPOGRAPHY.body) + " text-slate-600"}>{currentEvent.description}</p>

              <div className={`flex items-center gap-${SPACING.md} mt-2 ${TYPOGRAPHY.micro} text-slate-500`}>
                <span className="flex items-center gap-1">
                  <Radio className="size-3" style={{ color: currentEvent.sourceColor }} aria-hidden="true" />
                  来源: {currentEvent.source}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="size-3" aria-hidden="true" />
                  类型: {currentEvent.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Progress Bar - 使用cyan作为AI品牌色 */}
        {eventState.isAnalyzing && eventState.visibleSteps.length > 0 && eventState.visibleSteps.length < currentEvent.steps.length && (
          <div className={`flex items-center justify-between px-3 py-2 ${RADIUS.lg} bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800`}>
            <div className={`flex items-center gap-2`}>
              <div className="flex space-x-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className={`${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} font-medium text-cyan-700`}>AI 推理中...</span>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900 overflow-hidden" role="progressbar" aria-valuenow={eventState.visibleSteps.length} aria-valuemin={0} aria-valuemax={currentEvent.steps.length}>
              <div
                className="h-full bg-cyan-600 transition-[width] duration-500"
                style={{ width: `${(eventState.visibleSteps.length / currentEvent.steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Thinking Steps */}
        {eventState.visibleSteps.map((step, index) => {
          // 安全检查：确保step对象完整
          if (!step || !step.agentIcon || !step.agentColor) {
            devWarn('⚠️ Invalid step object:', step)
            return null
          }

          const Icon = step.agentIcon
          const isLast = index === eventState.visibleSteps.length - 1

          return (
            <div
              key={`step-${step.id}`}
              className={`
                relative group ${RADIUS.lg} border p-3.5 transition-[shadow,transform,border-color] duration-700
                ${isLast
                  ? "border-current/30 bg-white dark:bg-slate-800 shadow-md scale-[1.01]"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"}
              `}
              style={{ color: isLast ? step.agentColor : undefined }}
              role="article"
              aria-label={`${step.agent}: ${step.message}`}
            >
              {index > 0 && (
                <div className="absolute -top-3 left-6 w-0.5 h-3 bg-gradient-to-b from-slate-300 to-slate-200" aria-hidden="true" />
              )}

              <div className={`flex items-start gap-${SPACING.md}`}>
                <div className={`relative shrink-0`}>
                  <div
                    className={`
                      flex size-11 items-center justify-center ${RADIUS.lg} transition-[transform] duration-200 overflow-visible
                      ${isLast ? 'bg-current/15 scale-105' : 'bg-slate-100 dark:bg-slate-700'}
                    `}
                  >
                    <Icon
                      className="size-5 transition-transform duration-200"
                      style={{ color: step.agentColor }}
                      aria-hidden="true"
                    />

                    {(step.status === "working" || isLast) && (
                      <>
                        <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-white animate-ping" style={{ backgroundColor: step.agentColor }} aria-hidden="true" />
                        <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full" style={{ backgroundColor: step.agentColor }} aria-hidden="true" />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} font-bold text-slate-400`}>{step.timestamp}</span>
                      <span
                        className={`${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} font-bold px-2 py-0.5 rounded-full`}
                        style={{
                          backgroundColor: `${step.agentColor}12`,
                          color: step.agentColor
                        }}
                      >
                        {step.agent}
                      </span>
                      <span className={`${TYPOGRAPHY.micro} font-medium px-1.5 py-0.5 rounded-full ${
                        step.status === "complete"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {step.status === "complete" ? "✓ 完成" : "● 思考中"}
                      </span>
                    </div>
                  </div>

                  <p className={`${TYPOGRAPHY.body} leading-relaxed ${isLast ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {step.isTyping && isLast ? (
                      <TypewriterText text={step.message} speed={40} />
                    ) : (
                      step.message
                    )}
                  </p>

                  {step.result && (
                    <div className={`space-y-1 pl-3 border-l-2`} style={{ borderColor: `${step.agentColor}30` }}>
                      {step.result.map((result, i) => (
                        <div
                          key={i}
                          className={`${TYPOGRAPHY.micro} text-slate-600 flex items-start gap-1.5`}
                        >
                          <span style={{ color: step.agentColor }}>•</span>
                          <span>{result}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Evidence Cards Section */}
        {eventState.showEvidence && (
          <div ref={evidenceRef} className="mt-6 animate-fadeInUp">
            <div className={`mb-3 flex items-center gap-2 px-3 py-2 ${RADIUS.lg} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800`}>
              <Shield className="size-4 text-red-600" aria-hidden="true" />
              <span className={String(TYPOGRAPHY.micro) + " font-bold text-red-800"}>证据链收集完成</span>
              <span className={`ml-auto ${TYPOGRAPHY.micro} text-red-600`}>{currentEvent.evidenceList.length} 条关键证据</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentEvent.evidenceList.map((evidence, i) => (
                <EvidenceCard key={`${eventState.currentIndex}-${evidence.id}`} evidence={evidence} delay={i * 300} />
              ))}
            </div>

            {/* Correlation Flow */}
            <CorrelationFlow links={currentEvent.correlationLinks} />

            {/* Conclusion */}
            <div className={`mt-4 ${RADIUS.lg} border-2 border-red-200/60 bg-white dark:bg-slate-800 p-4 animate-fadeInUp`} style={{ animationDelay: "1500ms" }}>
              <div className={`flex items-start gap-${SPACING.md} mb-3`}>
                <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-gradient-to-br from-red-500 to-orange-500`}>
                  <Zap className="size-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={String(TYPOGRAPHY.h3) + " text-slate-800"}>AI 最终结论</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200">
                      <Sparkles className="size-3 text-red-600" aria-hidden="true" />
                      <span className={`${TYPOGRAPHY.micro} font-bold text-red-700`}>置信度 {currentEvent.conclusion.confidence}%</span>
                    </div>
                  </div>
                  <p className={String(TYPOGRAPHY.body) + " font-semibold text-slate-900"}>{currentEvent.conclusion.event}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className={`${RADIUS.md} bg-slate-50 dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700`}>
                  <div className={`${TYPOGRAPHY.micro} text-slate-500 mb-1`}>风险评分</div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-red-600">{currentEvent.conclusion.riskScore}</span>
                    <span className={`${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} text-slate-400 mb-1`}>/100</span>
                  </div>
                </div>
                <div className={`${RADIUS.md} bg-slate-50 dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700`}>
                  <div className={`${TYPOGRAPHY.micro} text-slate-500 mb-1`}>攻击阶段</div>
                  <div className={`${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")} font-semibold text-slate-700 leading-tight`}>{currentEvent.conclusion.attackPhase}</div>
                </div>
              </div>

              <div>
                <div className={`${TYPOGRAPHY.micro} text-slate-500 mb-2`}>AI 建议措施</div>
                <div className={`space-y-${SPACING.xs}`}>
                  {currentEvent.conclusion.recommendations.map((rec, i) => (
                    <div key={i} className={`flex items-center gap-2 ${TYPOGRAPHY.caption.replace("text-xs", "text-[10px]")}`}>
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                      <span className="text-slate-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator - 使用cyan品牌色 */}
        {eventState.isAnalyzing && eventState.visibleSteps.length > 0 && eventState.visibleSteps.length < currentEvent.steps.length && !eventState.showEvidence && (
          <div className="flex items-center justify-center py-6 space-x-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className={`${TYPOGRAPHY.micro} text-slate-500 italic`}>AI 正在深度分析中...</span>
          </div>
        )}

        {/* Initial state / Loading state / Error state */}
        {eventState.visibleSteps.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-6">
            {/* Loading state for real data - 移除glow效果，使用简洁的图标展示 */}
            {useRealData && isLoadingEvents && (
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <Brain className="size-20 animate-pulse text-cyan-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-cyan-700">正在连接AI分析引擎...</p>
                  <p className="text-sm text-slate-500 mt-1">从后端获取真实安全事件</p>
                  <div className="flex justify-center mt-3">
                    <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {useRealData && apiError && !isLoadingEvents && (
              <div className="text-center space-y-4 max-w-md">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-red-100">
                  <AlertTriangle className="size-8 text-red-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-700">连接失败</p>
                  <p className="text-sm text-slate-600 mt-1">{apiError}</p>
                  <p className="text-xs text-slate-500 mt-2">请检查后端服务是否启动，或切换到演示模式</p>
                </div>
                
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={fetchRealEvents}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔄 重试
                  </button>
                  <button
                    onClick={onToggleMode}
                    className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    切换到演示模式
                  </button>
                </div>
              </div>
            )}

            {/* Empty state (real data mode, no events) */}
            {useRealData && !isLoadingEvents && !apiError && realEvents.length === 0 && (
              <div className="text-center space-y-4">
                <Database className="size-16 text-slate-300 mx-auto" />
                <div>
                  <p className="text-lg font-bold text-slate-700">暂无安全事件</p>
                  <p className="text-sm text-slate-500">API返回空数据或没有待分析的事件</p>
                </div>
                <button
                  onClick={generateSampleEvents}
                  className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  ✨ 生成示例事件
                </button>
              </div>
            )}

            {/* Demo mode initial state */}
            {!useRealData && !isLoadingEvents && (
              <>
                <div className="relative">
                  <Brain className="size-20 animate-pulse text-cyan-500" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-xl font-bold text-cyan-700">AI 引擎已启动</p>
                  <p className="text-sm text-slate-500">正在接收安全事件数据...</p>
                  
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <div className="flex flex-col items-center gap-1">
                      <Radio className="size-4 animate-bounce text-blue-500" />
                      <span className="text-xs">SOC</span>
                    </div>
                    <ArrowRight className="size-3 text-slate-300 mt-2" />
                    <div className="flex flex-col items-center gap-1">
                      <User className="size-4 animate-bounce text-purple-500" style={{ animationDelay: '0.3s' }} />
                      <span className="text-xs">Identity</span>
                    </div>
                    <ArrowRight className="size-3 text-slate-300 mt-2" />
                    <div className="flex flex-col items-center gap-1">
                      <Target className="size-4 animate-bounce text-red-500" style={{ animationDelay: '0.6s' }} />
                      <span className="text-xs">Threat Intel</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pt-2">首条消息将在 1 秒内出现...</p>
                  
                  {/* Mode switch button in initial state - 使用纯色背景，移除渐变 */}
                  <div className="pt-4 border-t border-slate-200 w-full max-w-sm">
                    <button
                      onClick={onToggleMode}
                      className="w-full px-4 py-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-[11px] font-medium text-cyan-700 hover:bg-cyan-100 transition-colors"
                    >
                      🔄 切换到 <strong>真实数据模式</strong>（接入后端API）
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== 主页面组件 ====================

export default function AIAnalysisPage() {
  const now = useCurrentTime()

  // 数据源模式状态
  const [useRealData, setUseRealData] = useState(false)

  // Agent协作状态 - 与左侧推理进度联动
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'waiting' | 'thinking' | 'analyzing' | 'complete'>>({})
  const handleAgentStatusChange = useCallback((statuses: Record<string, 'waiting' | 'thinking' | 'analyzing' | 'complete'>) => {
    setAgentStatuses(statuses)
  }, [])
  
  const timeStr = now.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  // 切换数据源模式
  const toggleMode = () => {
    setUseRealData(!useRealData)
  }

  return (
    <div className="space-y-6">
      {/* 使用统一的PageHeader组件 - 保持与其他页面完全一致 */}
      <PageHeader
        icon={Brain}
        title="工作台"
        subtitle="AI驱动的安全事件分析与响应"
        actions={
          <div className="flex items-center gap-3">
            {/* 模式切换按钮 */}
            <button
              onClick={toggleMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/50 ${
                useRealData
                  ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
                  : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-700'
              }`}
              aria-label={`切换到${useRealData ? '演示模式' : '真实数据模式'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${useRealData ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
              <span className={String(TYPOGRAPHY.micro) + " font-medium"}>{useRealData ? '实时接入' : '演示模式'}</span>
            </button>

            {/* 时间显示 */}
            <time
              dateTime={now.toISOString()}
              className={String(TYPOGRAPHY.caption) + " font-mono bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md"}
              suppressHydrationWarning
            >
              {timeStr}
            </time>
          </div>
        }
      />

      {/* Main Content Grid - 左右固定，中间滚动，一屏放下 */}
      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Left Panel - 数据输入流 (固定高度) */}
        <div className={`col-span-2 ${RADIUS.xl} border border-slate-200/60 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col h-full`}>
          <div className={`px-${SPACING.lg} py-${SPACING.md} border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0`}>
            <div className="flex items-center gap-2">
              <Network className="size-4 text-blue-600" aria-hidden="true" />
              <h2 className={String(TYPOGRAPHY.h3) + " text-slate-800"}>数据输入流</h2>
            </div>
            <p className={`${TYPOGRAPHY.micro} text-slate-500 mt-0.5`}>AI正在消费的安全数据源</p>
          </div>

          <div className={`flex-1 overflow-y-auto p-${SPACING.md} gap-${SPACING.sm} scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent grid`}>
            {dataSources.map((source, index) => (
              <DataSourceCard key={source.id} source={source} index={index} />
            ))}
          </div>

          <div className={`px-${SPACING.lg} py-${SPACING.sm} border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900`}>
            <div className={`flex items-center justify-between ${TYPOGRAPHY.micro} text-slate-600`}>
              <span>活跃数据源: <strong className="text-blue-600">6/8</strong></span>
              <span>总事件数: <strong className="text-slate-800">5,694</strong></span>
            </div>
          </div>
        </div>

        {/* Center Panel - AI Reasoning Stream (可滚动) - 使用cyan作为AI模块品牌色 */}
        <div className={`col-span-7 ${RADIUS.xl} border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col h-full`}>
          <div className={`px-${SPACING.xl} py-${SPACING.md} border-b border-cyan-200 dark:border-cyan-800 bg-slate-50 dark:bg-slate-900`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center size-8 ${RADIUS.lg} bg-cyan-100 dark:bg-cyan-900/30`}>
                  <Brain className="size-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                </div>
                <div>
                  <h2 className={String(TYPOGRAPHY.h3) + " text-slate-800"}>AI 分析结果</h2>
                  <p className={`${TYPOGRAPHY.micro} text-slate-500 mt-0.5`}>展示AI如何理解、分析和判断安全事件</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-1.5 ${RADIUS.md} bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 ml-4`}>
                <Radio className="size-3 text-emerald-600 animate-pulse" aria-hidden="true" />
                <span className={`${TYPOGRAPHY.micro} font-bold text-emerald-700 whitespace-nowrap`}>实时监控中</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ReasoningStream
              useRealData={useRealData}
              onToggleMode={toggleMode}
              onAgentStatusChange={handleAgentStatusChange}
            />
          </div>
        </div>

        {/* Right Panel - AI Agent Status (固定高度) */}
        <div className={`col-span-3 ${RADIUS.xl} border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col h-full`}>
          <div className={`px-${SPACING.lg} py-${SPACING.md} border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900`}>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-cyan-600" aria-hidden="true" />
              <h2 className={String(TYPOGRAPHY.h3) + " text-slate-800"}>AI Agent 协作</h2>
            </div>
            <p className={`${TYPOGRAPHY.micro} text-slate-500 mt-0.5`}>多智能体协同分析状态</p>
          </div>

          <div className={`flex-1 overflow-y-auto p-${SPACING.md} gap-${SPACING.sm} scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent grid`}>
            {aiAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} dynamicStatus={agentStatuses[agent.id]} />
            ))}
          </div>

          <div className={`px-${SPACING.lg} py-${SPACING.sm} border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-${SPACING.xs}`}>
            <div className={`flex items-center justify-between ${TYPOGRAPHY.micro}`}>
              <span className="text-slate-600">Agent总数</span>
              <span className="font-bold text-cyan-600">7个</span>
            </div>
            <div className={`flex items-center justify-between ${TYPOGRAPHY.micro}`}>
              <span className="text-slate-600">协作模式</span>
              <span className="font-bold text-emerald-600">流水线式</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className={`shrink-0 px-4 py-2 ${RADIUS.lg} bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between ${TYPOGRAPHY.micro} text-slate-600`}>
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-800">SecMind AI Security Platform v2.0</span>
          <span aria-hidden="true">|</span>
          <span>刷新间隔: 30s</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500 animate-pulse" aria-hidden="true" />
            系统正常
          </span>
          <span>内存: 62%</span>
          <span>CPU: 34%</span>
          <span>磁盘: 51%</span>
        </div>
      </div>
    </div>
  )
}
