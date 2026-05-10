"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Brain,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Play,
  ShieldAlert,
  UserLock,
  Ban,
  KeyRound,
  Globe,
  Eye,
  Bell,
  HardDrive,
  FileSearch,
  AlertTriangle,
  ShieldCheck,
  Monitor,
  FlaskConical,
  Sparkles,
  Cpu,
  Workflow,
  Zap,
  RotateCcw,
  Activity,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Search,
  Target,
  Link2,
  BarChart3,
  Lightbulb,
  Database,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useLocaleStore } from "@/store/locale-store"

type ActionStatus = "pending" | "executing" | "completed" | "failed" | "awaiting_approval"
type Priority = "critical" | "high" | "medium" | "low"
type ReasoningPhase = "event_discovery" | "evidence_correlation" | "pattern_matching" | "confidence_assessment" | "disposal_decision"

interface EvidenceRef {
  source: string
  timestamp: string
  detail: string
  direction: "supports" | "contradicts" | "neutral"
}

interface ReasoningStep {
  phase: ReasoningPhase
  title: string
  description: string
  evidence: EvidenceRef[]
  mitreRef?: string
  confidenceDelta?: number
  conclusion: string
}

interface ActionItem {
  id: string
  nameKey: string
  icon: typeof Clock
  target: string
  status: ActionStatus
  priority: Priority
  hypothesisId: string
  hypothesisLabel: string
  hypothesisConfidence: number
  requestedBy: string
  timestamp: string
  aiReasoning: string
  reasoningChain: ReasoningStep[]
  evidenceSummary: {
    supporting: number
    contradicting: number
    neutral: number
  }
}

interface Hypothesis {
  id: string
  label: string
  confidence: number
  actions: { id: string; status: ActionStatus }[]
}

const hypotheses: Hypothesis[] = [
  {
    id: "A",
    label: "账号被盗",
    confidence: 92,
    actions: [
      { id: "ACT-001", status: "pending" },
      { id: "ACT-002", status: "executing" },
      { id: "ACT-003", status: "completed" },
      { id: "ACT-004", status: "awaiting_approval" },
      { id: "ACT-006", status: "completed" },
      { id: "ACT-007", status: "completed" },
    ],
  },
  {
    id: "B",
    label: "内部人员威胁",
    confidence: 54,
    actions: [
      { id: "ACT-005", status: "pending" },
      { id: "ACT-008", status: "pending" },
    ],
  },
  {
    id: "C",
    label: "误报",
    confidence: 12,
    actions: [],
  },
]

const actions: ActionItem[] = [
  {
    id: "ACT-001",
    nameKey: "execution.freezeAccount",
    icon: UserLock,
    target: "zhangsan@secmind.com",
    status: "pending",
    priority: "critical",
    hypothesisId: "A",
    hypothesisLabel: "账号被盗",
    hypothesisConfidence: 92,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:31",
    aiReasoning: "账号异地登录+VPN异常，置信度92%触发自动冻结",
    evidenceSummary: { supporting: 5, contradicting: 1, neutral: 1 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "异常登录事件检测",
        description: "VPN网关于08:15检测到账号zhangsan@secmind.com从异常地理位置(哈萨克斯坦)登录，与历史登录模式严重偏离",
        evidence: [
          { source: "VPN网关", timestamp: "2026-05-09 08:15:23", detail: "源IP 103.45.67.89 → VPN登录成功，地理位置：哈萨克斯坦阿拉木图", direction: "supports" },
          { source: "AD域控", timestamp: "2026-05-09 08:15:31", detail: "Kerberos TGT签发，用户zhangsan，来源IP 10.0.1.55(NAT后)", direction: "supports" },
        ],
        conclusion: "检测到从哈萨克斯坦的异常VPN登录，与用户历史登录地(北京、上海)严重偏离",
      },
      {
        phase: "evidence_correlation",
        title: "多源证据关联分析",
        description: "将VPN异常登录与EDR终端行为、AD域控日志进行时序关联，发现攻击链式行为",
        evidence: [
          { source: "EDR传感器", timestamp: "2026-05-09 08:18:05", detail: "WIN-02设备检测到powershell.exe执行编码命令，进程链异常", direction: "supports" },
          { source: "防火墙", timestamp: "2026-05-09 08:20:12", detail: "WIN-02(10.0.1.55)→103.45.67.89:443 异常外联，流量模式匹配C2心跳", direction: "supports" },
          { source: "AD域控", timestamp: "2026-05-09 08:22:45", detail: "zhangsan账号尝试访问域控共享目录\\DC01\C$，权限不足被拒", direction: "supports" },
          { source: "邮件网关", timestamp: "2026-05-09 07:50:00", detail: "zhangsan收到含恶意附件的钓鱼邮件，但未点击链接", direction: "neutral" },
          { source: "HR系统", timestamp: "2026-05-08 17:30:00", detail: "zhangsan提交出差申请：5月9日-12日哈萨克斯坦出差", direction: "contradicts" },
        ],
        conclusion: "5条证据支持账号被盗（4条强支持+1条中性），1条反对（出差申请），但攻击行为链与正常出差行为模式不符",
      },
      {
        phase: "pattern_matching",
        title: "攻击模式匹配与MITRE映射",
        description: "将关联证据与已知攻击模式库进行匹配，识别出完整的攻击链路",
        evidence: [
          { source: "威胁情报库", timestamp: "2026-05-09 08:25:00", detail: "IP 103.45.67.89匹配APT28关联基础设施，置信度0.85", direction: "supports" },
          { source: "MITRE ATT&CK", timestamp: "2026-05-09 08:25:00", detail: "匹配攻击链：T1078(有效账号)→T1059(命令行执行)→T1071(应用层协议C2)", direction: "supports" },
        ],
        mitreRef: "T1078 → T1059 → T1071",
        conclusion: "匹配APT28攻击模式，攻击链：有效账号利用→命令执行→C2通信，威胁情报IP置信度0.85",
      },
      {
        phase: "confidence_assessment",
        title: "置信度加权评估",
        description: "综合各证据权重、时效性、来源可靠性进行贝叶斯推理，计算最终置信度",
        evidence: [
          { source: "推理引擎", timestamp: "2026-05-09 08:28:00", detail: "VPN异常登录(权重0.25) + EDR异常进程(权重0.30) + C2通信(权重0.25) + 威胁情报(权重0.20)", direction: "supports" },
          { source: "推理引擎", timestamp: "2026-05-09 08:28:00", detail: "出差申请(权重0.15)降低置信度，但攻击行为链无法用出差解释", direction: "contradicts" },
        ],
        confidenceDelta: 92,
        conclusion: "加权置信度92%：支持证据累计权重0.95，反对证据权重0.15，经贝叶斯修正后为92%",
      },
      {
        phase: "disposal_decision",
        title: "处置动作决策",
        description: "基于置信度92%≥85%自动处置阈值，选择冻结账号作为首要遏制措施",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:30:00", detail: "账号失陷自动处置策略触发：置信度≥85%→冻结账号→重置密码→隔离终端", direction: "supports" },
          { source: "影响评估", timestamp: "2026-05-09 08:30:00", detail: "冻结zhangsan账号影响范围：1个活跃VPN会话、0个关键业务系统管理员权限", direction: "neutral" },
        ],
        conclusion: "置信度92%触发自动冻结，影响范围可控，优先遏制攻击者持续访问",
      },
    ],
  },
  {
    id: "ACT-002",
    nameKey: "execution.isolateHost",
    icon: ShieldAlert,
    target: "WIN-02 (10.0.1.55)",
    status: "executing",
    priority: "critical",
    hypothesisId: "A",
    hypothesisLabel: "账号被盗",
    hypothesisConfidence: 92,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:32",
    aiReasoning: "检测到横向移动行为，隔离受控设备阻断攻击链",
    evidenceSummary: { supporting: 4, contradicting: 0, neutral: 1 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "横向移动行为检测",
        description: "EDR检测到WIN-02设备发起RDP横向移动尝试，目标为域控制器和文件服务器",
        evidence: [
          { source: "EDR传感器", timestamp: "2026-05-09 08:19:30", detail: "WIN-02→10.0.1.1(DC01) RDP连接尝试，使用zhangsan凭证，认证失败3次", direction: "supports" },
          { source: "EDR传感器", timestamp: "2026-05-09 08:21:15", detail: "WIN-02→10.0.1.20(FILE-SVR01) SMB会话建立，访问\\FILE-SVR01\财务共享", direction: "supports" },
        ],
        conclusion: "WIN-02设备正在利用被盗凭证进行横向移动，目标为域控和文件服务器",
      },
      {
        phase: "evidence_correlation",
        title: "受控设备行为关联",
        description: "将WIN-02的横向移动行为与VPN异常登录时间线对齐，确认攻击链因果关系",
        evidence: [
          { source: "VPN网关", timestamp: "2026-05-09 08:15:23", detail: "异常VPN登录后3分钟内WIN-02即出现异常行为", direction: "supports" },
          { source: "EDR传感器", timestamp: "2026-05-09 08:18:05", detail: "powershell.exe执行Invoke-Mimikatz内存提取命令", direction: "supports" },
          { source: "网络流量", timestamp: "2026-05-09 08:20:12", detail: "WIN-02持续与103.45.67.89保持C2心跳通信", direction: "supports" },
          { source: "资产管理系统", timestamp: "2026-05-09 08:00:00", detail: "WIN-02为zhangsan日常工作设备，正常使用时段为09:00-18:00", direction: "neutral" },
        ],
        conclusion: "VPN异常登录→凭证窃取→横向移动，时序完全吻合，WIN-02已被攻击者控制",
      },
      {
        phase: "pattern_matching",
        title: "横向移动模式识别",
        description: "匹配凭据窃取+横向移动的标准攻击模式",
        evidence: [
          { source: "MITRE ATT&CK", timestamp: "2026-05-09 08:25:00", detail: "匹配T1003(OS凭据转储)→T1021(远程服务)横向移动链", direction: "supports" },
        ],
        mitreRef: "T1003 → T1021",
        conclusion: "匹配标准凭据窃取→横向移动攻击模式，攻击者正尝试扩大控制范围",
      },
      {
        phase: "confidence_assessment",
        title: "隔离必要性评估",
        description: "评估WIN-02继续在线的风险与隔离的业务影响",
        evidence: [
          { source: "风险评估", timestamp: "2026-05-09 08:29:00", detail: "WIN-02活跃C2通信+横向移动中，不隔离将导致域控被攻陷风险极高", direction: "supports" },
          { source: "业务影响", timestamp: "2026-05-09 08:29:00", detail: "WIN-02为普通办公终端，隔离影响1名员工，无关键业务依赖", direction: "neutral" },
        ],
        confidenceDelta: 95,
        conclusion: "隔离紧迫性评分95%，不隔离将面临域控失陷风险，业务影响极小",
      },
      {
        phase: "disposal_decision",
        title: "隔离处置决策",
        description: "基于紧迫性评分95%和低业务影响，决定立即网络隔离WIN-02",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:31:00", detail: "横向移动自动遏制策略：隔离紧迫性≥90%→立即隔离终端→保全取证数据", direction: "supports" },
        ],
        conclusion: "紧迫性95%触发立即隔离，阻断C2通信和横向移动，同时保全取证数据",
      },
    ],
  },
  {
    id: "ACT-003",
    nameKey: "execution.blockIp",
    icon: Ban,
    target: "103.45.67.89",
    status: "completed",
    priority: "high",
    hypothesisId: "A",
    hypothesisLabel: "账号被盗",
    hypothesisConfidence: 92,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:33",
    aiReasoning: "C2通信IP确认，封禁阻断远控通道",
    evidenceSummary: { supporting: 3, contradicting: 0, neutral: 0 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "C2通信流量识别",
        description: "防火墙检测到WIN-02与外部IP 103.45.67.89之间的周期性加密通信",
        evidence: [
          { source: "防火墙", timestamp: "2026-05-09 08:20:12", detail: "WIN-02→103.45.67.89:443 每60秒一次HTTPS请求，payload大小固定(256B)", direction: "supports" },
        ],
        conclusion: "检测到典型C2心跳通信模式：固定间隔、固定大小、加密载荷",
      },
      {
        phase: "evidence_correlation",
        title: "C2基础设施确认",
        description: "将通信IP与威胁情报和攻击时间线交叉验证",
        evidence: [
          { source: "威胁情报库", timestamp: "2026-05-09 08:25:00", detail: "103.45.67.89标记为APT28已知C2节点，首次发现2025-11，最近活跃2026-05", direction: "supports" },
          { source: "DNS日志", timestamp: "2026-05-09 08:17:00", detail: "WIN-02解析update-service.cloud-cdn.net→103.45.67.89，域名注册仅7天", direction: "supports" },
        ],
        conclusion: "IP确认为APT28 C2节点，域名特征匹配DGA生成，通信始于VPN异常登录后2分钟",
      },
      {
        phase: "pattern_matching",
        title: "C2通信模式匹配",
        description: "匹配标准C2通信行为模式",
        evidence: [
          { source: "MITRE ATT&CK", timestamp: "2026-05-09 08:25:00", detail: "匹配T1071.001(应用层协议:Web)C2通信模式", direction: "supports" },
        ],
        mitreRef: "T1071.001",
        conclusion: "确认C2通信通道，攻击者通过HTTPS伪装心跳维持对受控终端的远程控制",
      },
      {
        phase: "confidence_assessment",
        title: "封禁影响评估",
        description: "确认封禁该IP不会影响正常业务",
        evidence: [
          { source: "业务系统", timestamp: "2026-05-09 08:28:00", detail: "103.45.67.89不在任何业务白名单中，无合法业务依赖", direction: "supports" },
        ],
        confidenceDelta: 98,
        conclusion: "C2确认置信度98%，封禁无业务影响，应立即执行",
      },
      {
        phase: "disposal_decision",
        title: "IP封禁决策",
        description: "在防火墙和代理层双向封禁C2 IP",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:30:00", detail: "C2通信自动阻断策略：置信度≥90%→封禁IP→隔离终端→通知安全团队", direction: "supports" },
        ],
        conclusion: "置信度98%触发自动封禁，双向阻断C2通信，切断攻击者远程控制通道",
      },
    ],
  },
  {
    id: "ACT-004",
    nameKey: "execution.resetVpnCredentials",
    icon: KeyRound,
    target: "zhangsan@secmind.com",
    status: "awaiting_approval",
    priority: "high",
    hypothesisId: "A",
    hypothesisLabel: "账号被盗",
    hypothesisConfidence: 92,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:34",
    aiReasoning: "VPN凭证可能已泄露，重置以切断攻击者访问路径",
    evidenceSummary: { supporting: 3, contradicting: 1, neutral: 1 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "VPN凭证泄露风险识别",
        description: "攻击者已通过VPN成功登录，VPN凭证极可能已被窃取",
        evidence: [
          { source: "VPN网关", timestamp: "2026-05-09 08:15:23", detail: "攻击者使用zhangsan的VPN凭证+MFA token成功认证", direction: "supports" },
        ],
        conclusion: "攻击者已成功使用VPN凭证认证，凭证泄露风险极高",
      },
      {
        phase: "evidence_correlation",
        title: "凭证窃取路径分析",
        description: "分析攻击者可能获取VPN凭证的途径",
        evidence: [
          { source: "EDR传感器", timestamp: "2026-05-09 08:18:05", detail: "Mimikatz执行提取内存凭证，可能获取存储的VPN密码", direction: "supports" },
          { source: "邮件网关", timestamp: "2026-05-09 07:50:00", detail: "zhangsan收到钓鱼邮件但未点击，凭证非通过钓鱼获取", direction: "neutral" },
          { source: "HR系统", timestamp: "2026-05-08 17:30:00", detail: "出差申请说明zhangsan可能主动登录，凭证未必泄露", direction: "contradicts" },
        ],
        conclusion: "Mimikatz提取凭证概率高，但出差申请构成反对证据，需人工确认",
      },
      {
        phase: "pattern_matching",
        title: "凭证重置必要性评估",
        description: "评估不重置凭证的持续风险",
        evidence: [
          { source: "攻击路径分析", timestamp: "2026-05-09 08:28:00", detail: "若凭证未重置，攻击者可持续通过VPN回访内网，T1078有效账号利用", direction: "supports" },
        ],
        mitreRef: "T1078",
        conclusion: "不重置凭证则攻击者可持续利用有效账号回访，风险不可接受",
      },
      {
        phase: "confidence_assessment",
        title: "重置影响与风险评估",
        description: "评估重置VPN凭证对用户的影响与不重置的安全风险",
        evidence: [
          { source: "影响评估", timestamp: "2026-05-09 08:30:00", detail: "重置VPN凭证将中断zhangsan当前VPN会话，需重新认证", direction: "neutral" },
          { source: "风险评估", timestamp: "2026-05-09 08:30:00", detail: "不重置则攻击者可随时回访，风险等级：高", direction: "supports" },
        ],
        confidenceDelta: 78,
        conclusion: "凭证泄露置信度78%，存在出差合法使用的反对证据，建议人工审批后执行",
      },
      {
        phase: "disposal_decision",
        title: "凭证重置决策",
        description: "因存在反对证据(出差申请)，置信度未达自动处置阈值，提交人工审批",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:31:00", detail: "凭证重置策略：置信度≥85%自动执行，78%需人工审批确认", direction: "supports" },
        ],
        conclusion: "置信度78%未达自动处置阈值(85%)，提交人工审批，建议审批人核实出差真实性",
      },
    ],
  },
  {
    id: "ACT-005",
    nameKey: "execution.monitorUserActivity",
    icon: Monitor,
    target: "zhangsan@secmind.com",
    status: "pending",
    priority: "medium",
    hypothesisId: "B",
    hypothesisLabel: "内部人员威胁",
    hypothesisConfidence: 54,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:35",
    aiReasoning: "内部威胁置信度54%，先监控收集更多证据再决定处置",
    evidenceSummary: { supporting: 2, contradicting: 2, neutral: 1 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "内部威胁行为检测",
        description: "检测到zhangsan在非工作时间访问敏感文件，可能存在内部数据窃取行为",
        evidence: [
          { source: "文件服务器", timestamp: "2026-05-09 08:21:15", detail: "zhangsan账号访问\\FILE-SVR01\财务共享，下载3个文件(共12MB)", direction: "supports" },
        ],
        conclusion: "检测到非工作时段对敏感目录的异常访问行为",
      },
      {
        phase: "evidence_correlation",
        title: "内部威胁vs被盗行为区分",
        description: "尝试区分该行为是内部人员主动操作还是攻击者利用被盗账号操作",
        evidence: [
          { source: "行为基线", timestamp: "2026-05-09 08:25:00", detail: "zhangsan过去30天从未访问过财务共享目录，行为偏离基线", direction: "supports" },
          { source: "终端行为", timestamp: "2026-05-09 08:26:00", detail: "文件访问通过SMB协议从WIN-02发起，与被盗账号操作模式一致", direction: "neutral" },
          { source: "HR系统", timestamp: "2026-05-08 17:30:00", detail: "zhangsan有出差计划，可能需要远程访问财务文件", direction: "contradicts" },
          { source: "访问审批", timestamp: "2026-05-07 14:00:00", detail: "zhangsan上周申请过财务共享访问权限，已获主管批准", direction: "contradicts" },
        ],
        conclusion: "2条支持内部威胁，2条反对，行为可能为合法远程办公，也可能为攻击者利用",
      },
      {
        phase: "pattern_matching",
        title: "内部威胁模式匹配",
        description: "与内部威胁标准行为模式进行比对",
        evidence: [
          { source: "模式库", timestamp: "2026-05-09 08:27:00", detail: "非工作时段+敏感目录+大文件下载匹配内部数据窃取模式，但匹配度仅0.54", direction: "supports" },
        ],
        conclusion: "行为模式匹配度54%，不足以确认内部威胁，需更多证据",
      },
      {
        phase: "confidence_assessment",
        title: "置信度评估",
        description: "内部威胁假设置信度仅54%，不足以触发自动处置",
        evidence: [
          { source: "推理引擎", timestamp: "2026-05-09 08:28:00", detail: "支持证据权重0.45，反对证据权重0.40，经贝叶斯修正后置信度54%", direction: "neutral" },
        ],
        confidenceDelta: 54,
        conclusion: "内部威胁置信度54%，处于不确定区间，需持续监控收集更多行为证据",
      },
      {
        phase: "disposal_decision",
        title: "监控策略决策",
        description: "置信度不足触发自动处置，选择持续监控策略",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:30:00", detail: "置信度50-80%区间→持续监控+增强日志采集，等待更多证据", direction: "supports" },
        ],
        conclusion: "选择监控策略：增强zhangsan所有操作的日志采集，设置敏感操作实时告警，7天内重新评估",
      },
    ],
  },
  {
    id: "ACT-006",
    nameKey: "execution.notifySecurityTeam",
    icon: Bell,
    target: "security-team@secmind.com",
    status: "completed",
    priority: "medium",
    hypothesisId: "A",
    hypothesisLabel: "账号被盗",
    hypothesisConfidence: 92,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:36",
    aiReasoning: "高置信度攻击研判，通知安全团队协同处置",
    evidenceSummary: { supporting: 2, contradicting: 0, neutral: 0 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "高置信度攻击事件确认",
        description: "AI引擎已完成账号被盗研判，置信度92%，确认为高优先级安全事件",
        evidence: [
          { source: "推理引擎", timestamp: "2026-05-09 08:28:00", detail: "账号被盗假设置信度92%，超过高优先级告警阈值(80%)", direction: "supports" },
        ],
        conclusion: "确认为高置信度安全事件，需安全团队介入协同处置",
      },
      {
        phase: "evidence_correlation",
        title: "处置协同需求评估",
        description: "评估当前自动处置的覆盖范围和安全团队需介入的环节",
        evidence: [
          { source: "处置状态", timestamp: "2026-05-09 08:32:00", detail: "已自动执行：冻结账号、隔离终端、封禁IP；待人工：VPN凭证重置审批", direction: "supports" },
        ],
        conclusion: "自动处置已覆盖3项关键动作，VPN凭证重置需人工审批，需安全团队协调",
      },
      {
        phase: "confidence_assessment",
        title: "通知紧迫性评估",
        description: "评估通知安全团队的紧迫程度",
        evidence: [
          { source: "风险评估", timestamp: "2026-05-09 08:33:00", detail: "APT28攻击在处置中，需安全团队确认处置完整性并启动应急响应流程", direction: "supports" },
        ],
        confidenceDelta: 90,
        conclusion: "通知紧迫性90%，APT级别攻击需安全团队启动应急响应SOP",
      },
      {
        phase: "disposal_decision",
        title: "通知决策",
        description: "向安全团队发送包含完整攻击研判的通知",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:34:00", detail: "高置信度攻击事件→通知安全团队+附送攻击研判报告+处置状态", direction: "supports" },
        ],
        conclusion: "发送通知：包含攻击研判摘要、已执行处置、待审批事项、建议后续行动",
      },
    ],
  },
  {
    id: "ACT-007",
    nameKey: "execution.preserveForensicData",
    icon: HardDrive,
    target: "WIN-02 (10.0.1.55)",
    status: "completed",
    priority: "low",
    hypothesisId: "A",
    hypothesisLabel: "账号被盗",
    hypothesisConfidence: 92,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:37",
    aiReasoning: "保全设备取证数据，为后续溯源分析提供证据",
    evidenceSummary: { supporting: 2, contradicting: 0, neutral: 0 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "取证需求识别",
        description: "WIN-02为攻击关键设备，包含攻击者活动的直接证据",
        evidence: [
          { source: "EDR传感器", timestamp: "2026-05-09 08:18:05", detail: "WIN-02检测到Mimikatz执行、PowerShell编码命令等关键攻击行为", direction: "supports" },
        ],
        conclusion: "WIN-02包含攻击者完整活动痕迹，为溯源分析的关键证据来源",
      },
      {
        phase: "evidence_correlation",
        title: "取证范围评估",
        description: "评估需要保全的取证数据范围和优先级",
        evidence: [
          { source: "取证策略", timestamp: "2026-05-09 08:35:00", detail: "优先保全：内存镜像(含Mimikatz痕迹)、进程日志、网络连接记录、文件访问日志", direction: "supports" },
        ],
        conclusion: "需保全内存镜像和关键日志，防止设备重启或清理导致证据丢失",
      },
      {
        phase: "confidence_assessment",
        title: "取证紧迫性评估",
        description: "评估证据丢失风险",
        evidence: [
          { source: "风险评估", timestamp: "2026-05-09 08:36:00", detail: "攻击者可能通过C2下发清理指令，内存证据窗口约2-4小时", direction: "supports" },
        ],
        confidenceDelta: 85,
        conclusion: "取证紧迫性85%，内存证据有时间窗口限制，应在隔离后立即保全",
      },
      {
        phase: "disposal_decision",
        title: "取证保全决策",
        description: "在隔离状态下远程保全WIN-02取证数据",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:36:00", detail: "隔离后→远程内存镜像→日志打包→标记为取证保留", direction: "supports" },
        ],
        conclusion: "通过EDR代理远程采集内存镜像和日志，标记设备为取证保留状态，禁止重装",
      },
    ],
  },
  {
    id: "ACT-008",
    nameKey: "execution.reviewAccessLogs",
    icon: FileSearch,
    target: "域控制器",
    status: "pending",
    priority: "low",
    hypothesisId: "B",
    hypothesisLabel: "内部人员威胁",
    hypothesisConfidence: 54,
    requestedBy: "AI引擎",
    timestamp: "2026-05-09 08:38",
    aiReasoning: "审查域控访问日志，验证内部威胁假设",
    evidenceSummary: { supporting: 1, contradicting: 1, neutral: 1 },
    reasoningChain: [
      {
        phase: "event_discovery",
        title: "域控异常访问检测",
        description: "检测到zhangsan账号对域控制器的异常访问尝试",
        evidence: [
          { source: "AD域控", timestamp: "2026-05-09 08:22:45", detail: "zhangsan尝试访问\\DC01\C$共享，权限不足被拒绝", direction: "supports" },
        ],
        conclusion: "检测到对域控管理共享的异常访问尝试，可能是权限提升尝试",
      },
      {
        phase: "evidence_correlation",
        title: "内部威胁证据补充",
        description: "审查域控日志以获取更多内部威胁或被盗行为的区分证据",
        evidence: [
          { source: "AD域控", timestamp: "2026-05-09 08:25:00", detail: "过去7天zhangsan账号无域控异常访问记录，本次为首例", direction: "neutral" },
          { source: "权限审计", timestamp: "2026-05-09 08:26:00", detail: "zhangsan为普通域用户，无管理员权限，C$访问尝试异常", direction: "supports" },
        ],
        conclusion: "域控访问行为异常，但单次事件不足以确认内部威胁，需更多日志分析",
      },
      {
        phase: "confidence_assessment",
        title: "日志审查必要性评估",
        description: "评估域控日志审查对内部威胁假设验证的价值",
        evidence: [
          { source: "推理引擎", timestamp: "2026-05-09 08:30:00", detail: "域控日志可提供认证来源、时间模式等关键区分证据，预期可将置信度提升15-25%", direction: "supports" },
        ],
        confidenceDelta: 54,
        conclusion: "域控日志审查预期可将内部威胁置信度从54%提升至明确区间(>80%或<30%)",
      },
      {
        phase: "disposal_decision",
        title: "日志审查决策",
        description: "启动域控安全日志深度审查",
        evidence: [
          { source: "处置策略库", timestamp: "2026-05-09 08:35:00", detail: "置信度50-80%→增强日志审查+行为分析，7天内重新评估", direction: "supports" },
        ],
        conclusion: "启动域控30天安全日志审查，重点分析zhangsan的认证模式、权限使用和异常访问",
      },
    ],
  },
]

const strategies = [
  { name: "账号失陷自动处置", trigger: "置信度 ≥ 85%", actions: ["冻结账号", "重置密码", "隔离终端"], confidence: 85, description: "当AI研判账号失陷置信度≥85%时，自动触发冻结→重置→隔离处置链" },
  { name: "C2通信自动阻断", trigger: "置信度 ≥ 90%", actions: ["封禁IP", "隔离终端", "通知安全团队"], confidence: 90, description: "当AI确认C2通信置信度≥90%时，自动执行阻断→隔离→通知链" },
  { name: "暴力破解自动防御", trigger: "失败次数 ≥ 50", actions: ["封禁来源IP", "锁定账号", "启用MFA"], confidence: 95, description: "当AI检测到暴力破解失败次数≥50时，自动封禁→锁定→启用MFA" },
  { name: "数据外泄自动遏制", trigger: "外传数据 ≥ 100MB", actions: ["阻断连接", "保全取证数据", "通知DLP"], confidence: 80, description: "当AI检测到数据外传≥100MB时，自动阻断→取证→通知链" },
]

const executionRecords = [
  { id: "REC-001", action: "冻结账号(chengang)", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:15" },
  { id: "REC-002", action: "隔离设备(DEV-WS-004)", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:18" },
  { id: "REC-003", action: "封禁IP(45.33.32.156)", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:20" },
  { id: "REC-004", action: "重置密码(wangfang)", hypothesis: "H-B 内部威胁", confidence: 54, status: "awaiting" as const, executor: "待审批", time: "2026-05-09 10:35:00" },
  { id: "REC-005", action: "通知安全团队", hypothesis: "H-A 账号失陷", confidence: 92, status: "completed" as const, executor: "AI引擎", time: "2026-05-09 10:32:22" },
  { id: "REC-006", action: "保全取证数据", hypothesis: "H-A 账号失陷", confidence: 92, status: "running" as const, executor: "AI引擎", time: "2026-05-09 10:32:25" },
  { id: "REC-007", action: "封禁IP(103.45.67.89)", hypothesis: "H-A 账号失陷", confidence: 92, status: "failed" as const, executor: "AI引擎", time: "2026-05-09 10:33:01" },
  { id: "REC-008", action: "监控用户活动(linfeng)", hypothesis: "H-B 内部威胁", confidence: 54, status: "running" as const, executor: "AI引擎", time: "2026-05-09 10:36:00" },
]

const rollbackRecords = [
  { id: "RB-001", action: "解冻账号(chengang)", reason: "人工复核确认误报", operator: "赵敏", time: "2026-05-09 11:15:00", originalAction: "REC-001" },
  { id: "RB-002", action: "解除IP封禁(10.0.1.100)", reason: "IP为内部代理服务器", operator: "卫东", time: "2026-05-09 09:45:00", originalAction: "REC-003" },
]

function AIBrainIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Brain className="h-4 w-4 text-cyan-400" />
      <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
    </div>
  )
}

const phaseConfig: Record<ReasoningPhase, { icon: typeof Search; labelKey: string; color: string; bgColor: string }> = {
  event_discovery: { icon: Search, labelKey: "execution.phaseEventDiscovery", color: "#22d3ee", bgColor: "rgba(34,211,238,0.08)" },
  evidence_correlation: { icon: Link2, labelKey: "execution.phaseEvidenceCorrelation", color: "#a78bfa", bgColor: "rgba(167,139,250,0.08)" },
  pattern_matching: { icon: Target, labelKey: "execution.phasePatternMatching", color: "#f97316", bgColor: "rgba(249,115,22,0.08)" },
  confidence_assessment: { icon: BarChart3, labelKey: "execution.phaseConfidenceAssessment", color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
  disposal_decision: { icon: Lightbulb, labelKey: "execution.phaseDisposalDecision", color: "#facc15", bgColor: "rgba(250,204,21,0.08)" },
}

const directionConfig: Record<string, { color: string; labelKey: string }> = {
  supports: { color: "#22c55e", labelKey: "execution.directionSupports" },
  contradicts: { color: "#ff4d4f", labelKey: "execution.directionContradicts" },
  neutral: { color: "#64748b", labelKey: "execution.directionNeutral" },
}

function ReasoningChainPanel({ chain, evidenceSummary, t }: { chain: ReasoningStep[]; evidenceSummary: { supporting: number; contradicting: number; neutral: number }; t: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false)
  const total = evidenceSummary.supporting + evidenceSummary.contradicting + evidenceSummary.neutral

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <div className="flex items-center gap-1.5 text-xs text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <Sparkles className="h-3 w-3" />
          <span className="font-medium">{t("execution.viewReasoningChain")}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            +{evidenceSummary.supporting}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            -{evidenceSummary.contradicting}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            ~{evidenceSummary.neutral}
          </span>
          <span className="text-[10px] text-white/30 ml-0.5">{t("execution.evidenceCount")}: {total}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 relative">
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-gradient-to-b from-cyan-500/25 via-purple-500/15 to-amber-500/20" />
          <div className="space-y-3">
            {chain.map((step, idx) => {
              const phase = phaseConfig[step.phase]
              const PhaseIcon = phase.icon
              return (
                <div key={idx} className="relative pl-9">
                  <div
                    className="absolute left-0 top-1 flex h-[26px] w-[26px] items-center justify-center rounded-full shrink-0"
                    style={{
                      backgroundColor: `${phase.color}15`,
                      border: `1.5px solid ${phase.color}50`,
                      boxShadow: `0 0 8px ${phase.color}20`,
                    }}
                  >
                    <PhaseIcon className="h-3 w-3" style={{ color: phase.color }} />
                  </div>

                  <div
                    className="rounded-lg border p-3"
                    style={{
                      borderColor: `${phase.color}15`,
                      backgroundColor: phase.bgColor,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: phase.color }}>
                        {t(phase.labelKey)}
                      </span>
                      <span className="text-[10px] text-white/30">#{idx + 1}</span>
                      {step.mitreRef && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {step.mitreRef}
                        </span>
                      )}
                      {step.confidenceDelta !== undefined && (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <BarChart3 className="h-2.5 w-2.5" />
                          {step.confidenceDelta}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/60 mb-2 leading-relaxed">{step.description}</p>

                    {step.evidence.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {step.evidence.map((ev, evIdx) => {
                          const dir = directionConfig[ev.direction]
                          return (
                            <div
                              key={evIdx}
                              className="flex items-start gap-2 rounded-md px-2 py-1.5 bg-black/20 border border-white/[0.04]"
                            >
                              <div
                                className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: dir.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-medium" style={{ color: dir.color }}>
                                    {t(dir.labelKey)}
                                  </span>
                                  <span className="text-[10px] text-white/25 font-mono">{ev.timestamp}</span>
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-white/30">
                                    <Database className="h-2.5 w-2.5" />
                                    {ev.source}
                                  </span>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed">{ev.detail}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-start gap-1.5 pt-1.5 border-t border-white/[0.04]">
                      <Sparkles className="h-3 w-3 text-cyan-400/60 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-300/70 leading-relaxed">
                        <span className="font-medium text-cyan-400/80">{t("execution.stepConclusion")}:</span> {step.conclusion}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function HypothesisBadge({ id, label, confidence, t }: { id: string; label: string; confidence: number; t: (key: string) => string }) {
  const color = confidence >= 80 ? "#22c55e" : confidence >= 50 ? "#faad14" : "#64748b"
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <FlaskConical className="h-3 w-3" />
      <span className="opacity-70">→</span>
      <span>{t("execution.hyp")} {id}: {label}</span>
      <span className="font-semibold">({confidence}%)</span>
    </span>
  )
}

function getHypothesisProgress(h: Hypothesis) {
  const total = h.actions.length
  if (total === 0) return { completed: 0, total: 0, percent: 0, executing: 0, pending: 0, awaiting: 0 }
  const completed = h.actions.filter((a) => a.status === "completed").length
  const executing = h.actions.filter((a) => a.status === "executing").length
  const pending = h.actions.filter((a) => a.status === "pending").length
  const awaiting = h.actions.filter((a) => a.status === "awaiting_approval").length
  return { completed, total, percent: Math.round((completed / total) * 100), executing, pending, awaiting }
}

function AutoDisposalTab({ t }: { t: (key: string) => string }) {
  const [filterHypothesis, setFilterHypothesis] = useState<string>("all")

  const filteredActions = filterHypothesis === "all"
    ? actions
    : actions.filter((a) => a.hypothesisId === filterHypothesis)

  const statusConfig: Record<ActionStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: t("execution.statusPending"), color: "#f97316", icon: Clock },
    executing: { label: t("execution.statusExecuting"), color: "#22d3ee", icon: Loader2 },
    completed: { label: t("execution.statusCompleted"), color: "#22c55e", icon: CheckCircle2 },
    failed: { label: t("execution.statusFailed"), color: "#ff4d4f", icon: XCircle },
    awaiting_approval: { label: t("execution.statusAwaitingApproval"), color: "#faad14", icon: AlertTriangle },
  }

  const priorityConfig: Record<Priority, { label: string; color: string }> = {
    critical: { label: t("execution.priorityCritical"), color: "#ff4d4f" },
    high: { label: t("execution.priorityHigh"), color: "#f97316" },
    medium: { label: t("execution.priorityMedium"), color: "#faad14" },
    low: { label: t("execution.priorityLow"), color: "#1677ff" },
  }

  const statCards = [
    { label: t("execution.pendingActions"), value: 5, icon: Clock, color: "text-orange-400", bg: "bg-orange-500/20", borderColor: "border-orange-500/20" },
    { label: t("execution.executed"), value: 847, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20", borderColor: "border-emerald-500/20" },
    { label: t("execution.pendingApproval"), value: 3, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20", borderColor: "border-amber-500/20" },
    { label: t("execution.failed"), value: 2, icon: XCircle, color: "text-red-400", bg: "bg-red-500/20", borderColor: "border-red-500/20", glow: true },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="card-default p-5"
            style={stat.glow ? { boxShadow: "0 0 20px #ff4d4f15" } : undefined}
          >
            <div className="flex items-center gap-4">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-white/50">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              {t("execution.actionQueue")}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterHypothesis("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filterHypothesis === "all"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-white/40 hover:text-white/60 border border-transparent"
                )}
              >
                {t("execution.all")}
              </button>
              {hypotheses.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setFilterHypothesis(h.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    filterHypothesis === h.id
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-white/40 hover:text-white/60 border border-transparent"
                  )}
                >
                  {t("execution.hyp")} {h.id}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredActions.map((action) => {
              const status = statusConfig[action.status]
              const priority = priorityConfig[action.priority]
              const StatusIcon = status.icon
              const isAiDriven = action.requestedBy === "AI引擎"
              const isHighPriority = action.priority === "critical" || action.priority === "high"
              return (
                <div
                  key={action.id}
                  className="card-default p-4 hover:border-cyan-500/20 transition-colors"
                  style={isHighPriority ? { boxShadow: `0 0 12px ${priority.color}10` } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${priority.color}15`,
                        border: `1px solid ${priority.color}30`,
                      }}
                    >
                      <action.icon className="h-4 w-4" style={{ color: priority.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isAiDriven && <AIBrainIcon />}
                        <span className="text-sm font-semibold text-white">{t(action.nameKey)}</span>
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${priority.color}20`,
                            color: priority.color,
                            border: `1px solid ${priority.color}40`,
                          }}
                        >
                          {priority.label}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color,
                            border: `1px solid ${status.color}40`,
                          }}
                        >
                          <StatusIcon className={cn("h-2.5 w-2.5", action.status === "executing" && "animate-spin")} />
                          {status.label}
                        </span>
                      </div>

                      {action.aiReasoning && (
                        <div
                          className="mb-2 flex items-start gap-1.5 rounded-md px-2.5 py-1.5 text-xs border border-cyan-500/10"
                          style={{
                            background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(34,211,238,0.02))",
                          }}
                        >
                          <Sparkles className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="text-cyan-300/80">
                            <span className="font-medium text-cyan-400">{t("execution.aiReasoning")}:</span> {action.aiReasoning}
                          </span>
                        </div>
                      )}

                      {action.reasoningChain.length > 0 && (
                        <ReasoningChainPanel
                          chain={action.reasoningChain}
                          evidenceSummary={action.evidenceSummary}
                          t={t}
                        />
                      )}

                      <div className="mb-2">
                        <HypothesisBadge
                          id={action.hypothesisId}
                          label={action.hypothesisLabel}
                          confidence={action.hypothesisConfidence}
                          t={t}
                        />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {t("execution.target")}: {action.target}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {t("execution.source")}: {isAiDriven ? t("execution.aiAgent") : action.requestedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {action.status === "pending" && (
                        <Button size="xs" className="bg-cyan-600 text-white hover:bg-cyan-700 gap-1">
                          <Play className="h-3 w-3" />
                          {t("execution.execute")}
                        </Button>
                      )}
                      {action.status === "awaiting_approval" && (
                        <>
                          <Button size="xs" className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {t("execution.approve")}
                          </Button>
                          <Button size="xs" variant="outline" className="border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80 gap-1">
                            <XCircle className="h-3 w-3" />
                            {t("execution.cancel")}
                          </Button>
                        </>
                      )}
                      {action.status === "executing" && (
                        <Button size="xs" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1">
                          <XCircle className="h-3 w-3" />
                          {t("execution.cancel")}
                        </Button>
                      )}
                      {(action.status === "completed" || action.status === "failed") && (
                        <span className="text-xs text-white/30 px-2">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Workflow className="h-4 w-4 text-cyan-400" />
            {t("execution.hypothesisActionMap")}
          </h2>

          <div className="space-y-4">
            {hypotheses.map((h) => {
              const progress = getHypothesisProgress(h)
              const confColor = h.confidence >= 80 ? "#22c55e" : h.confidence >= 50 ? "#faad14" : "#64748b"
              const barColor = h.confidence >= 80 ? "#22c55e" : h.confidence >= 50 ? "#faad14" : "#475569"

              return (
                <div
                  key={h.id}
                  className="card-default p-5"
                  style={h.confidence >= 80 ? { boxShadow: "0 0 12px rgba(34,197,94,0.08)" } : undefined}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${confColor}15`,
                        border: `1px solid ${confColor}30`,
                      }}
                    >
                      <FlaskConical className="h-4 w-4" style={{ color: confColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{t("execution.hyp")} {h.id}</span>
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: `${confColor}20`,
                            color: confColor,
                            border: `1px solid ${confColor}40`,
                          }}
                        >
                          {h.confidence}%
                        </span>
                      </div>
                      <p className="text-xs text-white/50">{h.label}</p>
                    </div>
                  </div>

                  {h.actions.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-xs text-white/30 border border-dashed border-white/10 rounded-lg">
                      {t("execution.noActionsRecommended")}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/50">
                            {progress.completed} / {progress.total} {t("execution.actionsCompleted")}
                          </span>
                          <span className="text-xs font-medium" style={{ color: barColor }}>
                            {progress.percent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress.percent}%`,
                              backgroundColor: barColor,
                              boxShadow: `0 0 8px ${barColor}40`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center rounded-lg bg-emerald-500/10 border border-emerald-500/15 py-1.5">
                          <p className="text-sm font-bold text-emerald-400">{progress.completed}</p>
                          <p className="text-[9px] text-white/40">{t("execution.done")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-cyan-500/10 border border-cyan-500/15 py-1.5">
                          <p className="text-sm font-bold text-cyan-400">{progress.executing}</p>
                          <p className="text-[9px] text-white/40">{t("execution.running")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-orange-500/10 border border-orange-500/15 py-1.5">
                          <p className="text-sm font-bold text-orange-400">{progress.pending}</p>
                          <p className="text-[9px] text-white/40">{t("execution.pending")}</p>
                        </div>
                        <div className="text-center rounded-lg bg-amber-500/10 border border-amber-500/15 py-1.5">
                          <p className="text-sm font-bold text-amber-400">{progress.awaiting}</p>
                          <p className="text-[9px] text-white/40">{t("execution.await")}</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {h.actions.map((a) => {
                          const actionMeta = actions.find((x) => x.id === a.id)
                          if (!actionMeta) return null
                          const s = statusConfig[a.status]
                          const SIcon = s.icon
                          return (
                            <div
                              key={a.id}
                              className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-white/[0.02]"
                            >
                              <SIcon className={cn("h-3 w-3 shrink-0", a.status === "executing" && "animate-spin")} style={{ color: s.color }} />
                              <span className="text-white/70 truncate flex-1">{t(actionMeta.nameKey)}</span>
                              <span className="text-white/30 shrink-0">{a.id}</span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DisposalStrategyTab({ t }: { t: (key: string) => string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-cyan-500/15 bg-white/[0.04] backdrop-blur-xl p-5" style={{ boxShadow: "0 0 16px rgba(34,211,238,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white/80">{t("execution.aiDisposalStrategy")}</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/15 shrink-0 mt-0.5">
              <Sparkles className="h-3 w-3 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/70">{t("execution.aiExecutionLogic")}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {t("execution.confidenceTrigger")} ≥80% → {t("execution.priorityCritical")} | 50-80% → {t("execution.priorityMedium")} | &lt;50% → {t("execution.priorityLow")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/15 shrink-0 mt-0.5">
              <Workflow className="h-3 w-3 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/70">{t("execution.disposalChain")}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {t("execution.hypothesis")} → {t("execution.aiReasoning")} → {t("execution.disposalAction")} → {t("execution.statusCompleted")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {strategies.map((s) => (
          <div
            key={s.name}
            className="card-default p-5 hover:border-cyan-500/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AIBrainIcon />
                <h3 className="text-sm font-semibold text-white">{s.name}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400/60" />
                <span className="text-xs text-cyan-400/60">{s.trigger}</span>
              </div>
            </div>

            <p className="text-xs text-white/40 mb-3">{s.description}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-white/20">{t("execution.disposalChain")}:</span>
              {s.actions.map((action, idx) => (
                <span key={action} className="flex items-center gap-1.5">
                  <span className="text-xs text-white/50 bg-white/[0.04] px-2 py-0.5 rounded">{action}</span>
                  {idx < s.actions.length - 1 && <Zap className="h-3 w-3 text-white/15" />}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/20">{t("execution.confidenceTrigger")}</span>
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full" style={{ width: `${s.confidence}%` }} />
              </div>
              <span className="text-xs text-cyan-400/60">{s.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExecutionRecordTab({ t }: { t: (key: string) => string }) {
  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    completed: { icon: CheckCircle2, color: "#22c55e", label: t("execution.statusCompleted") },
    running: { icon: Activity, color: "#22d3ee", label: t("execution.statusExecuting") },
    awaiting: { icon: Clock, color: "#faad14", label: t("execution.statusAwaitingApproval") },
    failed: { icon: XCircle, color: "#ff4d4f", label: t("execution.statusFailed") },
  }

  return (
    <div className="space-y-6">
      <div className="card-default p-5">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-cyan-400" />
          {t("execution.executionLog")}
        </h3>
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/30 via-white/10 to-transparent" />
          <div className="space-y-5">
            {executionRecords.map((rec) => {
              const cfg = statusConfig[rec.status]
              const StatusIcon = cfg.icon
              const isAiAgent = rec.executor === "AI引擎"
              return (
                <div key={rec.id} className="relative flex items-start gap-4 pl-8">
                  <div
                    className="absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${cfg.color}20`,
                      border: `1.5px solid ${cfg.color}`,
                      boxShadow: `0 0 8px ${cfg.color}40`,
                    }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono text-white/30">{rec.time}</span>
                      <span className="text-xs font-medium text-white/80">{rec.action}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}40`,
                        }}
                      >
                        <StatusIcon className={cn("h-2.5 w-2.5", rec.status === "running" && "animate-spin")} />
                        {cfg.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-white/10 text-white/30">
                        {rec.hypothesis}
                      </Badge>
                      <span className="text-xs text-white/30">
                        {t("execution.confidenceTrigger")}: {rec.confidence}%
                      </span>
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        {t("execution.by")}
                        {isAiAgent ? (
                          <span className="inline-flex items-center gap-0.5 text-cyan-400">
                            <Brain className="h-2.5 w-2.5" />
                            {t("execution.aiAgent")}
                          </span>
                        ) : (
                          <span>{rec.executor}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/15 bg-white/[0.04] backdrop-blur-xl p-5">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
          <RotateCcw className="h-4 w-4 text-amber-400" />
          回滚记录
        </h3>
        <div className="space-y-3">
          {rollbackRecords.map((rb) => (
            <div
              key={rb.id}
              className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm text-white/80">{rb.action}</span>
                </div>
                <span className="text-xs font-mono text-white/30">{rb.id}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>原因: {rb.reason}</span>
                <span>操作人: {rb.operator}</span>
                <span className="font-mono">{rb.time}</span>
              </div>
              <div className="mt-1.5 text-xs text-white/20">
                原始操作: {rb.originalAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResponsePage() {
  const { t } = useLocaleStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("auto-disposal")

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        icon={Brain}
        title={t("execution.title")}
        actions={
          <>
            <Button
              className="gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25"
              onClick={() => router.push("/learning?from=response")}
            >
              <ArrowUpRight className="h-4 w-4" />
              反馈学习
            </Button>
            <Button className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700">
              <Plus className="h-4 w-4" />
              {t("execution.newAction")}
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="border-b border-white/10 w-full justify-start gap-0">
          <TabsTrigger value="auto-disposal" className="text-white/60 data-active:text-cyan-400">
            <Cpu className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabAutoDisposal")}
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-white/60 data-active:text-cyan-400">
            <Workflow className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabDisposalStrategy")}
          </TabsTrigger>
          <TabsTrigger value="records" className="text-white/60 data-active:text-cyan-400">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {t("nav.tabExecutionRecord")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto-disposal" className="mt-4">
          <AutoDisposalTab t={t} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
          <DisposalStrategyTab t={t} />
        </TabsContent>
        <TabsContent value="records" className="mt-4">
          <ExecutionRecordTab t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
