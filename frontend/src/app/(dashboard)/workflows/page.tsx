"use client"

import { useState } from "react"
import {
  Workflow,
  Search,
  Plus,
  Play,
  Edit3,
  Trash2,
  Zap,
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  ChevronRight,
  Activity,
  ToggleLeft,
  ToggleRight,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

type PlaybookStatus = "enabled" | "disabled"
type NodeType = "trigger" | "condition" | "action" | "approval"
type ExecutionStatus = "success" | "failed" | "running"

interface FlowNode {
  id: string
  type: NodeType
  label: string
  detail: string
}

interface FlowEdge {
  from: string
  to: string
  label?: string
}

interface Playbook {
  id: string
  name: string
  description: string
  trigger: string
  steps: number
  executions: number
  lastExecution: string
  status: PlaybookStatus
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface ExecutionRecord {
  id: string
  playbookName: string
  triggerTime: string
  status: ExecutionStatus
  duration: string
}

const playbooks: Playbook[] = [
  {
    id: "PB-001",
    name: "账号失陷自动处置",
    description: "当AI研判账号失陷置信度≥85%时，自动触发冻结→重置→隔离处置链",
    trigger: "置信度 ≥ 85%",
    steps: 5,
    executions: 347,
    lastExecution: "2026-05-10 09:32",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "AI研判触发", detail: "置信度 ≥ 85%" },
      { id: "n2", type: "condition", label: "影响评估", detail: "评估冻结影响范围" },
      { id: "n3", type: "action", label: "冻结账号", detail: "禁用AD账号登录" },
      { id: "n4", type: "action", label: "隔离终端", detail: "网络隔离受控设备" },
      { id: "n5", type: "approval", label: "人工审批", detail: "VPN凭证重置审批" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "影响可控" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "PB-002",
    name: "C2通信自动阻断",
    description: "当AI确认C2通信置信度≥90%时，自动执行阻断→隔离→通知链",
    trigger: "置信度 ≥ 90%",
    steps: 4,
    executions: 218,
    lastExecution: "2026-05-10 08:15",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "C2通信检测", detail: "置信度 ≥ 90%" },
      { id: "n2", type: "action", label: "封禁IP", detail: "防火墙双向封禁" },
      { id: "n3", type: "action", label: "隔离终端", detail: "阻断C2心跳" },
      { id: "n4", type: "action", label: "通知团队", detail: "发送攻击研判报告" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-003",
    name: "暴力破解自动防御",
    description: "当检测到暴力破解失败次数≥50时，自动封禁→锁定→启用MFA",
    trigger: "失败次数 ≥ 50",
    steps: 4,
    executions: 512,
    lastExecution: "2026-05-10 07:48",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "暴力破解检测", detail: "失败次数 ≥ 50" },
      { id: "n2", type: "action", label: "封禁来源IP", detail: "防火墙规则添加" },
      { id: "n3", type: "action", label: "锁定账号", detail: "AD账号临时锁定" },
      { id: "n4", type: "action", label: "启用MFA", detail: "强制多因子认证" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-004",
    name: "数据外泄自动遏制",
    description: "当检测到数据外传≥100MB时，自动阻断→取证→通知DLP",
    trigger: "外传数据 ≥ 100MB",
    steps: 4,
    executions: 89,
    lastExecution: "2026-05-09 22:10",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "DLP策略触发", detail: "外传 ≥ 100MB" },
      { id: "n2", type: "action", label: "阻断连接", detail: "中断数据传输" },
      { id: "n3", type: "action", label: "保全取证", detail: "远程内存镜像" },
      { id: "n4", type: "action", label: "通知DLP", detail: "合规事件上报" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-005",
    name: "WebShell自动清除",
    description: "当EDR检测到WebShell植入时，自动隔离→清除→加固",
    trigger: "WebShell特征匹配",
    steps: 5,
    executions: 156,
    lastExecution: "2026-05-09 18:33",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "WebShell检测", detail: "特征匹配 ≥ 95%" },
      { id: "n2", type: "condition", label: "业务影响评估", detail: "检查服务依赖" },
      { id: "n3", type: "action", label: "隔离Web服务", detail: "摘除流量入口" },
      { id: "n4", type: "action", label: "清除后门", detail: "删除恶意文件" },
      { id: "n5", type: "approval", label: "恢复审批", detail: "确认清除后恢复" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "可隔离" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "PB-006",
    name: "钓鱼邮件自动处置",
    description: "当邮件网关检测到钓鱼邮件时，自动隔离→通知→重置凭证",
    trigger: "钓鱼评分 ≥ 90",
    steps: 4,
    executions: 423,
    lastExecution: "2026-05-10 10:05",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "钓鱼邮件检测", detail: "评分 ≥ 90" },
      { id: "n2", type: "action", label: "隔离邮件", detail: "从收件箱移除" },
      { id: "n3", type: "action", label: "通知用户", detail: "安全提醒通知" },
      { id: "n4", type: "action", label: "重置凭证", detail: "预防性密码重置" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-007",
    name: "横向移动自动阻断",
    description: "当检测到内网横向移动行为时，自动隔离→封禁→取证",
    trigger: "横向移动行为检测",
    steps: 5,
    executions: 67,
    lastExecution: "2026-05-08 14:22",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "横向移动检测", detail: "RDP/SMB异常" },
      { id: "n2", type: "condition", label: "攻击范围评估", detail: "判断扩散范围" },
      { id: "n3", type: "action", label: "隔离源主机", detail: "网络微隔离" },
      { id: "n4", type: "action", label: "封禁凭证", detail: "禁用被盗账号" },
      { id: "n5", type: "action", label: "取证保全", detail: "采集攻击证据" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "确认攻击" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "PB-008",
    name: "DNS隧道自动阻断",
    description: "当检测到DNS隧道通信时，自动封禁域名→隔离主机→告警",
    trigger: "DNS隧道特征匹配",
    steps: 3,
    executions: 34,
    lastExecution: "2026-05-07 16:45",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "DNS隧道检测", detail: "TXT高频查询" },
      { id: "n2", type: "action", label: "封禁域名", detail: "DNS RPZ规则" },
      { id: "n3", type: "action", label: "隔离主机", detail: "阻断C2通信" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ],
  },
  {
    id: "PB-009",
    name: "权限提升自动遏制",
    description: "当检测到异常提权操作时，自动回滚→锁定→审计",
    trigger: "异常提权操作",
    steps: 4,
    executions: 45,
    lastExecution: "2026-05-06 11:30",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "提权行为检测", detail: "IAM异常操作" },
      { id: "n2", type: "action", label: "回滚权限", detail: "撤销提权变更" },
      { id: "n3", type: "action", label: "锁定账号", detail: "临时冻结操作" },
      { id: "n4", type: "approval", label: "安全审计", detail: "人工复核确认" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-010",
    name: "勒索软件自动防御",
    description: "当检测到勒索软件加密行为时，自动隔离→阻断→备份恢复",
    trigger: "勒索软件特征检测",
    steps: 5,
    executions: 12,
    lastExecution: "2026-05-04 03:18",
    status: "enabled",
    nodes: [
      { id: "n1", type: "trigger", label: "勒索行为检测", detail: "批量文件加密" },
      { id: "n2", type: "action", label: "隔离主机", detail: "紧急网络隔离" },
      { id: "n3", type: "action", label: "阻断传播", detail: "关闭SMB/RDP" },
      { id: "n4", type: "action", label: "备份快照", detail: "保护未感染数据" },
      { id: "n5", type: "approval", label: "恢复审批", detail: "确认安全后恢复" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "PB-011",
    name: "VPN异常登录处置",
    description: "当检测到VPN不可能旅行或异常地域登录时，自动冻结→验证→通知",
    trigger: "不可能旅行检测",
    steps: 4,
    executions: 198,
    lastExecution: "2026-05-09 20:55",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "VPN异常检测", detail: "不可能旅行" },
      { id: "n2", type: "condition", label: "出差核实", detail: "查询HR出差记录" },
      { id: "n3", type: "action", label: "冻结VPN", detail: "中断VPN会话" },
      { id: "n4", type: "action", label: "通知用户", detail: "验证登录真实性" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "无出差" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-012",
    name: "内部威胁监控处置",
    description: "当检测到内部威胁行为时，自动增强监控→限制权限→告警",
    trigger: "内部威胁评分 ≥ 70",
    steps: 4,
    executions: 56,
    lastExecution: "2026-05-08 09:12",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "内部威胁检测", detail: "评分 ≥ 70" },
      { id: "n2", type: "action", label: "增强监控", detail: "全操作日志采集" },
      { id: "n3", type: "action", label: "限制权限", detail: "降级访问控制" },
      { id: "n4", type: "approval", label: "HR审批", detail: "确认处置方案" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-013",
    name: "云资源异常处置",
    description: "当检测到云资源异常操作时，自动回滚→告警→审计",
    trigger: "云资源异常变更",
    steps: 3,
    executions: 78,
    lastExecution: "2026-05-07 15:40",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "云资源异常", detail: "IAM/K8s异常" },
      { id: "n2", type: "action", label: "回滚变更", detail: "撤销资源配置" },
      { id: "n3", type: "action", label: "安全告警", detail: "通知运维团队" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ],
  },
  {
    id: "PB-014",
    name: "供应链攻击响应",
    description: "当检测到供应链攻击时，自动隔离→阻断→溯源",
    trigger: "供应链异常检测",
    steps: 5,
    executions: 8,
    lastExecution: "2026-05-02 11:20",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "供应链异常", detail: "依赖包篡改" },
      { id: "n2", type: "condition", label: "影响范围评估", detail: "扫描受影响服务" },
      { id: "n3", type: "action", label: "隔离服务", detail: "摘除受影响实例" },
      { id: "n4", type: "action", label: "阻断流量", detail: "WAF规则更新" },
      { id: "n5", type: "action", label: "攻击溯源", detail: "威胁情报关联" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "确认受影响" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "PB-015",
    name: "零日漏洞应急响应",
    description: "当检测到零日漏洞利用时，自动加固→监控→补丁",
    trigger: "零日漏洞利用检测",
    steps: 5,
    executions: 3,
    lastExecution: "2026-04-28 08:45",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "0day利用检测", detail: "异常漏洞利用" },
      { id: "n2", type: "action", label: "紧急加固", detail: "虚拟补丁部署" },
      { id: "n3", type: "action", label: "增强监控", detail: "全流量分析" },
      { id: "n4", type: "approval", label: "补丁审批", detail: "确认补丁安全性" },
      { id: "n5", type: "action", label: "补丁部署", detail: "滚动更新部署" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  {
    id: "PB-016",
    name: "DDoS攻击自动缓解",
    description: "当检测到DDoS攻击时，自动引流→清洗→恢复",
    trigger: "流量异常检测",
    steps: 4,
    executions: 23,
    lastExecution: "2026-05-05 14:30",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "DDoS检测", detail: "流量基线偏离" },
      { id: "n2", type: "action", label: "流量牵引", detail: "DNS/Anycast引流" },
      { id: "n3", type: "action", label: "流量清洗", detail: "恶意流量过滤" },
      { id: "n4", type: "action", label: "恢复服务", detail: "回源正常流量" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
  {
    id: "PB-017",
    name: "数据库异常访问处置",
    description: "当检测到数据库异常访问时，自动阻断→审计→通知",
    trigger: "数据库异常查询",
    steps: 3,
    executions: 145,
    lastExecution: "2026-05-09 16:22",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "异常查询检测", detail: "SQL注入/大量导出" },
      { id: "n2", type: "action", label: "阻断连接", detail: "终止异常会话" },
      { id: "n3", type: "action", label: "安全审计", detail: "记录操作日志" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ],
  },
  {
    id: "PB-018",
    name: "终端恶意软件清除",
    description: "当EDR检测到终端恶意软件时，自动隔离→清除→修复",
    trigger: "恶意软件检测",
    steps: 4,
    executions: 267,
    lastExecution: "2026-05-10 06:18",
    status: "disabled",
    nodes: [
      { id: "n1", type: "trigger", label: "恶意软件检测", detail: "EDR特征匹配" },
      { id: "n2", type: "action", label: "隔离终端", detail: "网络微隔离" },
      { id: "n3", type: "action", label: "清除恶意文件", detail: "删除+注册表修复" },
      { id: "n4", type: "action", label: "恢复终端", detail: "安全扫描后恢复" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
  },
]

const executionHistory: ExecutionRecord[] = [
  { id: "EX-20260510-001", playbookName: "账号失陷自动处置", triggerTime: "2026-05-10 09:32:15", status: "success", duration: "12.3s" },
  { id: "EX-20260510-002", playbookName: "钓鱼邮件自动处置", triggerTime: "2026-05-10 10:05:42", status: "success", duration: "8.7s" },
  { id: "EX-20260510-003", playbookName: "C2通信自动阻断", triggerTime: "2026-05-10 08:15:33", status: "failed", duration: "3.2s" },
  { id: "EX-20260510-004", playbookName: "暴力破解自动防御", triggerTime: "2026-05-10 07:48:11", status: "success", duration: "5.1s" },
  { id: "EX-20260510-005", playbookName: "数据外泄自动遏制", triggerTime: "2026-05-09 22:10:05", status: "running", duration: "—" },
  { id: "EX-20260509-006", playbookName: "WebShell自动清除", triggerTime: "2026-05-09 18:33:28", status: "success", duration: "15.6s" },
  { id: "EX-20260509-007", playbookName: "横向移动自动阻断", triggerTime: "2026-05-08 14:22:17", status: "success", duration: "9.8s" },
  { id: "EX-20260509-008", playbookName: "VPN异常登录处置", triggerTime: "2026-05-09 20:55:44", status: "failed", duration: "2.1s" },
  { id: "EX-20260508-009", playbookName: "内部威胁监控处置", triggerTime: "2026-05-08 09:12:36", status: "success", duration: "6.4s" },
  { id: "EX-20260507-010", playbookName: "权限提升自动遏制", triggerTime: "2026-05-06 11:30:52", status: "success", duration: "7.9s" },
]

const NODE_TYPE_CONFIG: Record<NodeType, { color: string; bgColor: string; borderColor: string; icon: typeof Zap; label: string }> = {
  trigger: { color: "#ef4444", bgColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", icon: Zap, label: "触发器" },
  condition: { color: "#eab308", bgColor: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.25)", icon: GitBranch, label: "条件判断" },
  action: { color: "#06b6d4", bgColor: "rgba(6,182,212,0.08)", borderColor: "rgba(6,182,212,0.25)", icon: Play, label: "执行动作" },
  approval: { color: "#a855f7", bgColor: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.25)", icon: UserCheck, label: "人工审批" },
}

const EXECUTION_STATUS_CONFIG: Record<ExecutionStatus, { color: string; icon: typeof CheckCircle2; label: string }> = {
  success: { color: "#22c55e", icon: CheckCircle2, label: "成功" },
  failed: { color: "#ff4d4f", icon: XCircle, label: "失败" },
  running: { color: "#22d3ee", icon: Loader2, label: "执行中" },
}

export default function WorkflowsPage() {
  const { t } = useLocaleStore()
  const [filterType, setFilterType] = useState<"all" | "enabled" | "disabled">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [playbookStates, setPlaybookStates] = useState<Record<string, PlaybookStatus>>(
    Object.fromEntries(playbooks.map((p) => [p.id, p.status]))
  )

  const filteredPlaybooks = playbooks.filter((p) => {
    if (filterType === "enabled" && playbookStates[p.id] !== "enabled") return false
    if (filterType === "disabled" && playbookStates[p.id] !== "disabled") return false
    if (searchQuery && !p.name.includes(searchQuery) && !p.description.includes(searchQuery)) return false
    return true
  })

  const enabledCount = Object.values(playbookStates).filter((s) => s === "enabled").length
  const disabledCount = Object.values(playbookStates).filter((s) => s === "disabled").length

  const togglePlaybookStatus = (id: string) => {
    setPlaybookStates((prev) => ({
      ...prev,
      [id]: prev[id] === "enabled" ? "disabled" : "enabled",
    }))
  }

  const filterCards = [
    { key: "all" as const, label: "全部剧本", count: playbooks.length, color: "#06b6d4" },
    { key: "enabled" as const, label: "已启用", count: enabledCount, color: "#22c55e" },
    { key: "disabled" as const, label: "已停用", count: disabledCount, color: "#64748b" },
  ]

  return (
    <div className="space-y-6 p-1">
      <PageHeader
        icon={Workflow}
        title="自动化编排"
        subtitle="安全响应剧本与工作流自动化引擎"
      />

      <div className="grid grid-cols-3 gap-4">
        {filterCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setFilterType(card.key)}
            className={cn(
              "card-default p-4 text-left transition-all cursor-pointer",
              filterType === card.key && "ring-1"
            )}
            style={
              filterType === card.key
                ? { borderColor: `${card.color}40`, boxShadow: `0 0 16px ${card.color}15` }
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: `${card.color}80` }}>{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{card.count}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="搜索剧本名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/30"
          />
        </div>
        <Button
          className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          创建剧本
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredPlaybooks.map((playbook) => {
            const isEnabled = playbookStates[playbook.id] === "enabled"
            return (
              <div
                key={playbook.id}
                className={cn(
                  "card-default p-4 transition-all cursor-pointer",
                  selectedPlaybook?.id === playbook.id && "border-cyan-500/30 shadow-[0_0_16px_rgba(6,182,212,0.12)]"
                )}
                onClick={() => setSelectedPlaybook(playbook)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-white truncate">{playbook.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0"
                        style={{
                          borderColor: isEnabled ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)",
                          color: isEnabled ? "#22c55e" : "#64748b",
                        }}
                      >
                        {isEnabled ? "已启用" : "已停用"}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed mb-2 line-clamp-2">{playbook.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#ef4444",
                        }}
                      >
                        <Zap className="h-2.5 w-2.5" />
                        {playbook.trigger}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {playbook.steps} 步骤
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {playbook.executions} 次执行
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {playbook.lastExecution}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePlaybookStatus(playbook.id)
                      }}
                      className="transition-colors"
                    >
                      {isEnabled ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-white/20" />
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-white/30 hover:text-cyan-400"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-white/30 hover:text-cyan-400"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-white/30 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedPlaybook ? (
            <>
              <div className="card-default p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">{selectedPlaybook.name}</h3>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        borderColor: playbookStates[selectedPlaybook.id] === "enabled" ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.3)",
                        color: playbookStates[selectedPlaybook.id] === "enabled" ? "#22c55e" : "#64748b",
                      }}
                    >
                      {playbookStates[selectedPlaybook.id] === "enabled" ? "已启用" : "已停用"}
                    </Badge>
                  </div>
                  <span className="text-xs text-white/30 font-mono">{selectedPlaybook.id}</span>
                </div>

                <div className="flex items-center gap-6 mb-5 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-red-400" />
                    触发: {selectedPlaybook.trigger}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3 text-cyan-400" />
                    {selectedPlaybook.steps} 个步骤
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-400" />
                    累计执行 {selectedPlaybook.executions} 次
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  {(["trigger", "condition", "action", "approval"] as NodeType[]).map((type) => {
                    const config = NODE_TYPE_CONFIG[type]
                    const count = selectedPlaybook.nodes.filter((n) => n.type === type).length
                    if (count === 0) return null
                    const Icon = config.icon
                    return (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
                        style={{
                          backgroundColor: config.bgColor,
                          border: `1px solid ${config.borderColor}`,
                          color: config.color,
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label} ×{count}
                      </span>
                    )
                  })}
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center gap-0 min-w-max">
                    {selectedPlaybook.nodes.map((node, idx) => {
                      const config = NODE_TYPE_CONFIG[node.type]
                      const Icon = config.icon
                      return (
                        <div key={node.id} className="flex items-center">
                          <div
                            className="rounded-lg px-4 py-3 min-w-[140px] text-center"
                            style={{
                              backgroundColor: config.bgColor,
                              border: `1.5px solid ${config.borderColor}`,
                              boxShadow: `0 0 12px ${config.color}10`,
                            }}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                              <span className="text-xs font-semibold" style={{ color: config.color }}>
                                {node.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-tight">{node.detail}</p>
                          </div>
                          {idx < selectedPlaybook.nodes.length - 1 && (
                            <div className="flex items-center mx-1 relative">
                              <div className="w-8 h-px" style={{ backgroundColor: `${config.color}40` }} />
                              <ChevronRight className="h-3.5 w-3.5" style={{ color: `${config.color}60` }} />
                              {selectedPlaybook.edges[idx]?.label && (
                                <span
                                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap px-1 rounded"
                                  style={{ color: `${config.color}80`, backgroundColor: "rgba(2,10,26,0.9)" }}
                                >
                                  {selectedPlaybook.edges[idx].label}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="card-default p-5">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  执行历史
                </h3>
                <div className="space-y-2">
                  {executionHistory
                    .filter((r) => r.playbookName === selectedPlaybook.name)
                    .map((record) => {
                      const statusConfig = EXECUTION_STATUS_CONFIG[record.status]
                      const StatusIcon = statusConfig.icon
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 rounded-lg bg-white/[0.02] border border-white/[0.04] px-4 py-2.5"
                        >
                          <span className="text-xs font-mono text-white/25 shrink-0">{record.id}</span>
                          <span className="text-xs text-white/60 flex-1 truncate">{record.playbookName}</span>
                          <span className="text-xs font-mono text-white/30 shrink-0">{record.triggerTime}</span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                            style={{
                              backgroundColor: `${statusConfig.color}15`,
                              border: `1px solid ${statusConfig.color}30`,
                              color: statusConfig.color,
                            }}
                          >
                            <StatusIcon className={cn("h-2.5 w-2.5", record.status === "running" && "animate-spin")} />
                            {statusConfig.label}
                          </span>
                          <span className="text-xs font-mono text-white/30 shrink-0 w-14 text-right">{record.duration}</span>
                        </div>
                      )
                    })}
                  {executionHistory.filter((r) => r.playbookName === selectedPlaybook.name).length === 0 && (
                    <div className="flex items-center justify-center py-8 text-xs text-white/20">
                      暂无执行记录
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card-default p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Workflow className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-sm text-white/30">选择左侧剧本查看可视化流程</p>
              <p className="text-xs text-white/15 mt-1">点击任意剧本卡片以展示编排流程图</p>
            </div>
          )}
        </div>
      </div>

      <div className="card-default p-5">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-cyan-400" />
          最近执行记录
        </h3>
        <div className="space-y-2">
          {executionHistory.map((record) => {
            const statusConfig = EXECUTION_STATUS_CONFIG[record.status]
            const StatusIcon = statusConfig.icon
            return (
              <div
                key={record.id}
                className="flex items-center gap-4 rounded-lg bg-white/[0.02] border border-white/[0.04] px-4 py-2.5 hover:border-white/[0.08] transition-colors"
              >
                <span className="text-xs font-mono text-white/25 shrink-0 w-36">{record.id}</span>
                <span className="text-xs text-white/60 flex-1 truncate">{record.playbookName}</span>
                <span className="text-xs font-mono text-white/30 shrink-0">{record.triggerTime}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                  style={{
                    backgroundColor: `${statusConfig.color}15`,
                    border: `1px solid ${statusConfig.color}30`,
                    color: statusConfig.color,
                  }}
                >
                  <StatusIcon className={cn("h-2.5 w-2.5", record.status === "running" && "animate-spin")} />
                  {statusConfig.label}
                </span>
                <span className="text-xs font-mono text-white/30 shrink-0 w-14 text-right">{record.duration}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0a1628] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">创建新剧本</DialogTitle>
            <DialogDescription className="text-white/40">
              配置安全响应剧本的触发条件、执行步骤和审批流程
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">剧本名称</label>
              <Input
                placeholder="输入剧本名称"
                className="border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">剧本描述</label>
              <Input
                placeholder="输入剧本描述"
                className="border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">触发条件</label>
              <Select>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-white/70">
                  <SelectValue placeholder="选择触发条件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidence">AI研判置信度触发</SelectItem>
                  <SelectItem value="threshold">阈值触发</SelectItem>
                  <SelectItem value="signature">特征匹配触发</SelectItem>
                  <SelectItem value="behavior">行为检测触发</SelectItem>
                  <SelectItem value="schedule">定时调度触发</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button className="flex-1 bg-cyan-600 text-white hover:bg-cyan-700 gap-1.5">
                <Plus className="h-4 w-4" />
                创建剧本
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70"
                onClick={() => setCreateDialogOpen(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
