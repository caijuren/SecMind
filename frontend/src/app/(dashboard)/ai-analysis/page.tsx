"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const isDev = process.env.NODE_ENV === "development"
function devLog(...args: unknown[]) { if (isDev) console.log(...args) }
function devWarn(...args: unknown[]) { if (isDev) console.warn(...args) }
function devError(...args: unknown[]) { if (isDev) console.error(...args) }

import {
  Brain,
  Shield,
  Zap,
  Server,
  Database,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Network,
  User,
  Target,
  Layers,
  Sparkles,
  Radio,
  FileText,
  Activity,
  Lock,
  Globe,
  Eye,
  Search,
  Bug,
  Key,
  Code2,
  ShieldAlert,
  Upload,
  ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import {
  getSeverityStyles,
  getModuleColor,
} from "@/lib/design-system"

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
    eventId: "ALT001",
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
    eventId: "ALT002",
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
    eventId: "ALT003",
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
    eventId: "ALT004",
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
    eventId: "ALT005",
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
    eventId: "ALT006",
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
    eventId: "ALT007",
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
    eventId: "ALT008",
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
    eventId: "ALT009",
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
    eventId: "ALT010",
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
  "DLP Agent": "forensics",
  "EDR Agent": "forensics",
  "Network Agent": "soc",
  "Log Agent": "forensics",
  "DNS Analysis Agent": "soc",
  "Malware Agent": "forensics",
  "Impact Agent": "ueba",
  "Response Agent": "soc",
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

/** 严重等级颜色映射 */
function getSeverityColor(severity: "low" | "medium" | "high" | "critical") {
  const styles = getSeverityStyles(severity)
  return styles
}

/** 风险评分弧形进度 */
function RiskGauge({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const center = size / 2

  const color = score >= 90 ? "#ff2d55" : score >= 70 ? "#ff9500" : score >= 50 ? "#fbbf24" : "#00ff88"

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  )
}

function DataSourceCard({ source }: { source: DataSource; index: number }) {
  const Icon = source.icon
  const isActive = source.status === "active"

  return (
    <div
      className="group relative cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${source.name}: ${source.eventCount}个事件`}
    >
      <div className={`
        relative rounded-lg border p-2.5 transition-all duration-300
        ${isActive
          ? "border-current/20 bg-card hover:border-current/40 hover:shadow-[0_0_12px_color-mix(in_srgb,currentColor_8%,transparent)]"
          : "border-border bg-background/50 opacity-60"}
      `} style={{ color: source.color }}>
        <div className="flex items-center gap-2.5">
          <div className={`
            flex size-7 items-center justify-center rounded-md transition-all duration-300
            ${isActive ? "bg-current/10 scale-105" : "bg-muted/30"}
          `} style={{ color: source.color }}>
            <Icon className="size-3.5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-foreground truncate block">{source.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{source.eventCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isActive && (
              <span className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-current animate-ping opacity-75" style={{ color: source.color }} />
                <span className="relative inline-flex size-2 rounded-full bg-current" style={{ color: source.color }} />
              </span>
            )}
            {!isActive && <span className="size-2 rounded-full bg-muted-foreground/30" />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent, dynamicStatus }: { agent: AIAgent; dynamicStatus?: 'waiting' | 'thinking' | 'analyzing' | 'complete' }) {
  const Icon = agent.icon
  const effectiveStatus = dynamicStatus || agent.status
  const isActive = effectiveStatus === "thinking" || effectiveStatus === "analyzing"

  const statusConfig = {
    thinking: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "思考中", dot: "bg-blue-400" },
    analyzing: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", label: "分析中", dot: "bg-cyan-400" },
    waiting: { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border", label: "待命中", dot: "bg-muted-foreground/40" },
    complete: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "已完成", dot: "bg-emerald-400" },
  }

  const cfg = statusConfig[effectiveStatus]

  return (
    <div className={`
      group relative overflow-hidden rounded-xl border p-3 transition-all duration-300
      ${isActive
        ? "border-current/20 bg-card shadow-sm hover:shadow-[0_0_16px_color-mix(in_srgb,currentColor_6%,transparent)]"
        : "border-border bg-card hover:border-primary/15"}
    `} style={{ color: isActive ? agent.color : undefined }}>
      {/* 活跃状态下的顶部光条 */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 animate-cyber-breathe" style={{ backgroundColor: agent.color }} />
      )}

      <div className="flex items-center gap-3">
        <div className={`
          relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300
          ${isActive ? "bg-current/15 scale-110" : "bg-muted/30"}
        `} style={{ color: agent.color }}>
          <Icon className="size-4 transition-transform duration-200" style={{ color: agent.color }} aria-hidden="true" />

          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 flex size-3">
              <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: agent.color }} />
              <span className="relative inline-flex size-3 rounded-full" style={{ backgroundColor: agent.color }} />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-foreground truncate">{agent.name}</span>
            <span className={`
              inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border
              ${cfg.bg} ${cfg.text} ${cfg.border}
            `}>
              <span className={`size-1.5 rounded-full ${cfg.dot} ${isActive ? "animate-pulse" : ""}`} />
              {cfg.label}
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
      {currentIndex < text.length && <span className="animate-pulse text-primary">|</span>}
    </span>
  )
}

function EvidenceCard({ evidence, delay }: { evidence: Evidence; delay: number }) {
  const [visible, setVisible] = useState(false)
  const isValidEvidence = Boolean(evidence?.icon)

  useEffect(() => {
    if (!isValidEvidence) return
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay, isValidEvidence])

  if (!isValidEvidence) {
    devWarn('⚠️ Invalid evidence object:', evidence)
    return null
  }

  const Icon = evidence.icon
  if (!visible) return null

  const sevStyle = getSeverityColor(evidence.riskLevel)

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border-2 p-3.5 bg-card
        animate-slideInLeft transition-all duration-300
        hover:shadow-[0_0_20px_${sevStyle.solid}15]
      `}
      style={{
        borderColor: sevStyle.border,
        animationDelay: `${delay}ms`,
      }}
      role="article"
      aria-label={`证据: ${evidence.type}, 风险等级: ${evidence.riskLevel}`}
    >
      {/* 顶部风险色条 */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: sevStyle.solid }} />

      <div className="flex items-start gap-3 mb-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: sevStyle.light }}>
          <Icon className="size-4" style={{ color: sevStyle.text }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">{evidence.type}</span>
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{ backgroundColor: sevStyle.solid, color: '#fff' }}
            >
              {evidence.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-foreground mb-2.5 leading-relaxed">{evidence.content}</p>

      {evidence.details && (
        <div className="space-y-1.5 mb-2.5">
          {evidence.details.map((detail, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{detail.label}</span>
              <span className="font-mono font-medium text-foreground">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        <Server className="size-2.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] text-muted-foreground">{evidence.source}</span>
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
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        <Network className="size-3.5 text-primary/60" aria-hidden="true" />
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
            className={`
              flex items-center gap-2 transition-all duration-700
              ${visibleLinks.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
            `}
            role="listitem"
            aria-label={`${link.from} → ${link.to}: ${link.description}`}
          >
            <div className="rounded-lg border border-border bg-card flex-1 px-3 py-2.5 text-center">
              <span className="text-xs font-medium text-foreground">{link.from}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">{link.description}</p>
            </div>

            <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 border border-primary/20 shrink-0">
              <ChevronRight className="size-3 text-primary" aria-hidden="true" />
            </div>

            <div className="rounded-lg border border-border bg-card flex-1 px-3 py-2.5 text-center">
              <span className="text-xs font-medium text-foreground">{link.to}</span>
            </div>
          </div>
        )
      })}

      {visibleLinks.length === links.length && (
        <div className="pt-2 animate-fadeIn">
          <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5">
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

  const [realEvents, setRealEvents] = useState<SecurityEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const evidenceRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<NodeJS.Timeout[]>([])
  const startEventAnalysisRef = useRef<(eventIndex: number) => void>(() => {})

  const scheduleTask = useCallback((task: () => void | Promise<void>) => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => { void task() })
      return
    }
    Promise.resolve().then(task)
  }, [])

  const currentEvents = useRealData ? realEvents : securityEvents
  const currentEvent = currentEvents[eventState.currentIndex]
  const totalEvents = currentEvents.length

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const generateSampleEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/api-analysis/simulate/generate-sample-events?count=5', { method: 'POST' })
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

  const fetchRealEvents = useCallback(async () => {
    setIsLoadingEvents(true)
    setApiError(null)

    try {
      const response = await fetch('/api/v1/api-analysis/events?limit=10')
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const data = await response.json()
      if (data.events && data.events.length > 0) {
        setRealEvents(data.events)
        devLog(`✅ 成功获取 ${data.events.length} 个真实安全事件`)
      } else {
        devLog('⚠️ API返回空数据，生成示例事件...')
        await generateSampleEvents()
      }
    } catch (error) {
      devError('❌ 获取真实事件失败:', error)
      setApiError(error instanceof Error ? error.message : '未知错误')
      devLog('🔄 降级到示例数据...')
      await generateSampleEvents()
    } finally {
      setIsLoadingEvents(false)
    }
  }, [generateSampleEvents])

  const resetToDemoMode = useCallback(() => {
    setRealEvents([])
    setApiError(null)
    clearTimers()
    setEventState({
      currentIndex: 0,
      currentStep: -1,
      visibleSteps: [],
      showEvidence: false,
      isAnalyzing: false,
    })
  }, [clearTimers])

  useEffect(() => {
    scheduleTask(async () => {
      if (useRealData) {
        await fetchRealEvents()
        return
      }
      resetToDemoMode()
    })
  }, [fetchRealEvents, resetToDemoMode, scheduleTask, useRealData])

  const startEventAnalysis = useCallback((eventIndex: number) => {
    if (eventState.isAnalyzing) {
      devLog('⏭️ 已有分析正在进行，跳过重复启动')
      return
    }

    clearTimers()

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

    setEventState({
      currentIndex: eventIndex,
      currentStep: -1,
      visibleSteps: [],
      showEvidence: false,
      isAnalyzing: true,
    })

    setTimeout(() => {
      let stepIndex = 0
      const addedStepIds = new Set<string>()

      const addStep = () => {
        if (stepIndex >= event.steps.length) return

        const step = event.steps[stepIndex]

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

        if (stepIndex === event.steps.length - 1) {
          setTimeout(() => {
            setEventState(prev => ({ ...prev, showEvidence: true }))
            setTimeout(() => {
              evidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 100)

            setTimeout(() => {
              const nextIndex = (eventIndex + 1) % totalEvents
              devLog(`➡️ 准备进入下一个事件: ${nextIndex + 1}`)
              setEventState(prev => ({ ...prev, isAnalyzing: false }))

              setTimeout(() => {
                startEventAnalysisRef.current(nextIndex)
              }, 3000)
            }, 8000)
          }, 2000)
        }

        stepIndex++
        const timer = setTimeout(addStep, 2500)
        timersRef.current.push(timer)
      }

      const firstTimer = setTimeout(addStep, 800)
      timersRef.current.push(firstTimer)
    }, 100)
  }, [eventState.isAnalyzing, totalEvents, clearTimers, currentEvents])

  useEffect(() => {
    startEventAnalysisRef.current = startEventAnalysis
  }, [startEventAnalysis])

  useEffect(() => {
    const startTimer = setTimeout(() => {
      startEventAnalysis(0)
    }, 500)

    return () => {
      clearTimeout(startTimer)
      clearTimers()
    }
  }, [clearTimers, startEventAnalysis])

  // 同步Agent状态到右侧面板
  useEffect(() => {
    if (!onAgentStatusChange) return

    const statuses: Record<string, 'waiting' | 'thinking' | 'analyzing' | 'complete'> = {}
    aiAgents.forEach(a => { statuses[a.id] = "waiting" })

    eventState.visibleSteps.forEach((step, idx) => {
      const agentId = AGENT_NAME_TO_ID_MAP[step.agent]
      if (agentId) {
        if (step.status === "complete") {
          statuses[agentId] = "complete"
        } else if (idx === eventState.visibleSteps.length - 1) {
          statuses[agentId] = step.status === "working" ? "analyzing" : "thinking"
        } else {
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
    const nextSevStyle = getSeverityColor(nextEvent.severity)

    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-cyber-breathe">
            <CheckCircle2 className="size-8 text-emerald-500" aria-hidden="true" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">AI研判完成</h3>
            <p className="text-sm text-muted-foreground mt-1">{currentEvent.title}</p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500">
              置信度: {currentEvent.conclusion.confidence}%
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500">
              风险评分: {currentEvent.conclusion.riskScore}
            </span>
          </div>
        </div>

        <div className="w-full max-w-lg space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Radio className="size-3.5 text-primary animate-pulse" aria-hidden="true" />
            <span className="font-medium">检测到新的安全告警</span>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-all cursor-pointer group" role="button" tabIndex={0} aria-label={`下一个事件: ${nextEvent.title}`}>
            <div className="flex size-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${nextEvent.sourceColor}12` }}>
              <NextIcon className="size-5" style={{ color: nextEvent.sourceColor }} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{nextEvent.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ backgroundColor: nextSevStyle.solid, color: '#fff' }}
                >
                  {nextEvent.severity.toUpperCase()}
                </span>
                <span className="text-[10px] text-muted-foreground">来源: {nextEvent.source}</span>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
          </div>

          <div className="flex justify-center pt-1">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">AI正在接入...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 安全检查
  if (!currentEvent || currentEvents.length === 0) {
    return (
      <div ref={containerRef} className="h-full flex flex-col items-center justify-center">
        {useRealData ? (
          <div className="text-center space-y-4 max-w-md">
            <Database className="size-16 text-muted-foreground mx-auto" />
            <p className="text-lg font-semibold text-foreground">暂无安全事件</p>
            <p className="text-sm text-muted-foreground">
              {apiError ? (
                <>连接失败: <strong className="text-red-500">{apiError}</strong></>
              ) : isLoadingEvents ? (
                "正在从AI分析引擎获取数据..."
              ) : (
                "API未返回事件数据"
              )}
            </p>

            {!isLoadingEvents && (
              <div className="flex gap-3 justify-center pt-3">
                {apiError && (
                  <button onClick={fetchRealEvents} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium">
                    重试连接
                  </button>
                )}
                <button onClick={onToggleMode} className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-lg hover:bg-primary/15 transition-colors font-medium">
                  切回演示模式
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Brain className="size-16 animate-pulse text-primary mx-auto" />
            <p className="text-lg font-semibold text-primary">AI 引擎初始化中</p>
          </div>
        )}
      </div>
    )
  }

  const currentSevStyle = getSeverityColor(currentEvent.severity)

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 pt-4 scrollbar-thin scroll-smooth">
      <div className="space-y-3 pb-4">
        {/* 事件标题卡片 - 使用cyber-card风格 */}
        <div className="cyber-card rounded-xl border-2 p-4" style={{ borderColor: `${currentEvent.sourceColor}30` }}>
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${currentEvent.sourceColor}15` }}>
              <currentEvent.sourceIcon className="size-6" style={{ color: currentEvent.sourceColor }} aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ backgroundColor: currentSevStyle.solid, color: '#fff' }}
                >
                  {currentEvent.severity.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{currentEvent.eventId}</span>
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wide">{currentEvent.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{currentEvent.description}</p>

              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
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

        {/* AI 推理进度条 */}
        {eventState.isAnalyzing && eventState.visibleSteps.length > 0 && eventState.visibleSteps.length < currentEvent.steps.length && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center gap-2.5">
              <div className="flex space-x-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-primary">AI 推理中...</span>
            </div>
            <div className="w-24 h-1.5 rounded-full bg-primary/10 overflow-hidden" role="progressbar" aria-valuenow={eventState.visibleSteps.length} aria-valuemin={0} aria-valuemax={currentEvent.steps.length}>
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-500"
                style={{ width: `${(eventState.visibleSteps.length / currentEvent.steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Thinking Steps - 增强视觉层次 */}
        {eventState.visibleSteps.map((step, index) => {
          if (!step || !step.agentIcon || !step.agentColor) {
            devWarn('⚠️ Invalid step object:', step)
            return null
          }

          const Icon = step.agentIcon
          const isLast = index === eventState.visibleSteps.length - 1
          const isWorking = step.status === "working" || isLast

          return (
            <div
              key={`step-${step.id}`}
              className={`
                relative group rounded-xl border p-4 transition-all duration-500
                ${isLast
                  ? "border-current/25 bg-card shadow-sm scale-[1.005]"
                  : "border-border bg-card hover:border-primary/15"}
              `}
              style={isLast ? { color: step.agentColor } : undefined}
              role="article"
              aria-label={`${step.agent}: ${step.message}`}
            >
              {/* 连接线 */}
              {index > 0 && (
                <div className="absolute -top-3 left-7 w-0.5 h-3 bg-gradient-to-b from-border to-border/50" aria-hidden="true" />
              )}

              {/* 活跃步骤顶部光条 */}
              {isLast && (
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl animate-cyber-breathe" style={{ backgroundColor: step.agentColor }} />
              )}

              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className={`
                    flex size-11 items-center justify-center rounded-xl transition-all duration-300
                    ${isLast ? 'bg-current/12 scale-110' : 'bg-muted/30'}
                  `}>
                    <Icon
                      className="size-5 transition-transform duration-200"
                      style={{ color: step.agentColor }}
                      aria-hidden="true"
                    />

                    {isWorking && (
                      <span className="absolute -top-0.5 -right-0.5 flex size-3">
                        <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: step.agentColor }} />
                        <span className="relative inline-flex size-3 rounded-full" style={{ backgroundColor: step.agentColor }} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">{step.timestamp}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${step.agentColor}12`,
                          color: step.agentColor,
                        }}
                      >
                        {step.agent}
                      </span>
                      <span className={`
                        text-[9px] font-bold px-2 py-0.5 rounded-full
                        ${step.status === "complete"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}
                      `}>
                        {step.status === "complete" ? "✓ 完成" : "● 思考中"}
                      </span>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed ${isLast ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
                    {step.isTyping && isLast ? (
                      <TypewriterText text={step.message} speed={40} />
                    ) : (
                      step.message
                    )}
                  </p>

                  {step.result && (
                    <div className="space-y-1 pl-3 border-l-2 rounded-bl" style={{ borderColor: `${step.agentColor}25` }}>
                      {step.result.map((result, i) => (
                        <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                          <span className="mt-0.5 shrink-0" style={{ color: step.agentColor }}>•</span>
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
          <div ref={evidenceRef} className="mt-6 animate-fadeInUp space-y-4">
            {/* 证据收集标题 */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
              <Shield className="size-4 text-red-500" aria-hidden="true" />
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">证据链收集完成</span>
              <span className="ml-auto text-[10px] font-bold text-red-500/70">{currentEvent.evidenceList.length} 条关键证据</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentEvent.evidenceList.map((evidence, i) => (
                <EvidenceCard key={`${eventState.currentIndex}-${evidence.id}`} evidence={evidence} delay={i * 300} />
              ))}
            </div>

            {/* Correlation Flow */}
            <CorrelationFlow links={currentEvent.correlationLinks} />

            {/* Conclusion - 增强视觉冲击 */}
            <div className="cyber-card rounded-xl border-2 border-red-500/20 p-5 animate-fadeInUp" style={{ animationDelay: "1500ms" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shrink-0 shadow-lg shadow-red-500/20">
                  <Zap className="size-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">AI 最终结论</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      <Sparkles className="size-3 text-primary" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-primary">置信度 {currentEvent.conclusion.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{currentEvent.conclusion.event}</p>
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-4 mb-4">
                {/* 风险评分仪表 */}
                <RiskGauge score={currentEvent.conclusion.riskScore} size={90} />

                <div className="space-y-3">
                  <div className="rounded-lg bg-background/80 border border-border p-3">
                    <div className="text-[10px] text-muted-foreground mb-1">攻击阶段</div>
                    <div className="text-xs font-bold text-foreground">{currentEvent.conclusion.attackPhase}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">AI 建议措施</div>
                <div className="space-y-2">
                  {currentEvent.conclusion.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-foreground">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {eventState.isAnalyzing && eventState.visibleSteps.length > 0 && eventState.visibleSteps.length < currentEvent.steps.length && !eventState.showEvidence && (
          <div className="flex items-center justify-center py-6 space-x-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground italic">AI 正在深度分析中...</span>
          </div>
        )}

        {/* Initial / Loading / Error states */}
        {eventState.visibleSteps.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground space-y-6">
            {useRealData && isLoadingEvents && (
              <div className="text-center space-y-4">
                <Brain className="size-20 animate-pulse text-primary mx-auto" />
                <div>
                  <p className="text-lg font-bold text-primary">正在连接AI分析引擎...</p>
                  <p className="text-sm text-muted-foreground mt-1">从后端获取真实安全事件</p>
                  <div className="flex justify-center mt-3">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                </div>
              </div>
            )}

            {useRealData && apiError && !isLoadingEvents && (
              <div className="text-center space-y-4 max-w-md">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="size-8 text-red-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-500">连接失败</p>
                  <p className="text-sm text-muted-foreground mt-1">{apiError}</p>
                  <p className="text-xs text-muted-foreground mt-2">请检查后端服务是否启动，或切换到演示模式</p>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <button onClick={fetchRealEvents} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                    重试
                  </button>
                  <button onClick={onToggleMode} className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors">
                    切换到演示模式
                  </button>
                </div>
              </div>
            )}

            {useRealData && !isLoadingEvents && !apiError && realEvents.length === 0 && (
              <div className="text-center space-y-4">
                <Database className="size-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-bold text-foreground">暂无安全事件</p>
                  <p className="text-sm text-muted-foreground">API返回空数据或没有待分析的事件</p>
                </div>
                <button onClick={generateSampleEvents} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                  生成示例事件
                </button>
              </div>
            )}

            {!useRealData && !isLoadingEvents && (
              <>
                <div className="relative">
                  <Brain className="size-20 animate-pulse text-primary" />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-lg font-bold text-primary">AI 引擎已启动</p>
                  <p className="text-sm text-muted-foreground">正在接收安全事件数据...</p>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <Radio className="size-4 animate-bounce text-blue-500" />
                      <span className="text-[10px] text-muted-foreground">SOC</span>
                    </div>
                    <ChevronRight className="size-3 text-border" />
                    <div className="flex flex-col items-center gap-1.5">
                      <User className="size-4 animate-bounce text-violet-500" style={{ animationDelay: '0.3s' }} />
                      <span className="text-[10px] text-muted-foreground">Identity</span>
                    </div>
                    <ChevronRight className="size-3 text-border" />
                    <div className="flex flex-col items-center gap-1.5">
                      <Target className="size-4 animate-bounce text-red-500" style={{ animationDelay: '0.6s' }} />
                      <span className="text-[10px] text-muted-foreground">Threat Intel</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground pt-2">首条消息将在 1 秒内出现...</p>

                  <div className="pt-4 border-t border-border w-full max-w-sm">
                    <button
                      onClick={onToggleMode}
                      className="w-full px-4 py-2.5 bg-primary/5 border border-primary/15 rounded-lg text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      切换到 <strong>真实数据模式</strong>（接入后端API）
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

import { usePageTitle } from "@/hooks/use-page-title"

export default function AIAnalysisPage() {
  usePageTitle("ai-analysis")
  const now = useCurrentTime()

  const [useRealData, setUseRealData] = useState(false)
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

  const toggleMode = useCallback(() => {
    setUseRealData((prev) => !prev)
  }, [])

  const aiModuleColor = getModuleColor("ai")

  return (
    <div className="space-y-4">
      {/* PageHeader - 统一组件 */}
      <PageHeader
        icon={Brain}
        title="工作台"
        subtitle="AI驱动的安全事件分析与响应"
        actions={
          <div className="flex items-center gap-3">
            {/* 模式切换 */}
            <button
              onClick={toggleMode}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-200
                focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/50
                ${useRealData
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/15'
                  : 'bg-primary/8 border-primary/20 text-primary hover:bg-primary/12'}
              `}
              aria-label={`切换到${useRealData ? '演示模式' : '真实数据模式'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${useRealData ? 'bg-emerald-500 animate-pulse' : 'bg-primary'}`} />
              {useRealData ? '实时接入' : '演示模式'}
            </button>

            {/* 时间 */}
            <time
              dateTime={now.toISOString()}
              className="text-[10px] font-mono bg-muted/30 border border-border px-2.5 py-1 rounded-md text-muted-foreground tabular-nums"
              suppressHydrationWarning
            >
              {timeStr}
            </time>
          </div>
        }
      />

      {/* Main Content Grid - 三栏布局 */}
      <div className="grid grid-cols-12 gap-3" style={{ height: 'calc(100vh - 130px)' }}>

        {/* ===== Left Panel - 数据输入流 ===== */}
        <div className="col-span-2 glass-card overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b border-border/50 bg-background/50 shrink-0">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-blue-500" aria-hidden="true" />
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wider">数据输入流</h2>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">AI正在消费的安全数据源</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
            {dataSources.map((source, index) => (
              <DataSourceCard key={source.id} source={source} index={index} />
            ))}
          </div>

          <div className="px-4 py-2 border-t border-border/50 bg-background/50">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>活跃: <strong className="text-blue-500">6/8</strong></span>
              <span>总事件: <strong className="text-foreground">5,694</strong></span>
            </div>
          </div>
        </div>

        {/* ===== Center Panel - AI Reasoning Stream ===== */}
        <div className="col-span-7 glass-card overflow-hidden flex flex-col h-full" style={{ borderColor: `${aiModuleColor}15` }}>
          <div className="px-5 py-3 border-b border-border/50 bg-background/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 border border-primary/15">
                  <Brain className="size-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wider">AI 分析结果</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">展示AI如何理解、分析和判断安全事件</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-emerald-500 whitespace-nowrap">实时监控中</span>
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

        {/* ===== Right Panel - AI Agent 协作 ===== */}
        <div className="col-span-3 glass-card overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b border-border/50 bg-background/50 shrink-0">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-[11px] font-bold text-foreground uppercase tracking-wider">AI Agent 协作</h2>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">多智能体协同分析状态</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin">
            {aiAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} dynamicStatus={agentStatuses[agent.id]} />
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-border/50 bg-background/50 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Agent总数</span>
              <span className="font-bold text-primary">7个</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">协作模式</span>
              <span className="font-bold text-emerald-500">流水线式</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Bottom Status Bar ===== */}
      <div className="shrink-0 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground/80">SecMind AI Security Platform v2.0</span>
          <span className="text-border" aria-hidden="true">|</span>
          <span>刷新间隔: 30s</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            系统正常
          </span>
          <span className="text-muted-foreground/50">内存: 62%</span>
          <span className="text-muted-foreground/50">CPU: 34%</span>
          <span className="text-muted-foreground/50">磁盘: 51%</span>
        </div>
      </div>
    </div>
  )
}
