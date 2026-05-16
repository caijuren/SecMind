import {
  Zap,
  Shield,
  GitBranch,
  Clock,
  Bell,
  UserCheck,
  type LucideIcon,
} from "lucide-react"

export interface PlaybookNode {
  id: string
  type: "trigger" | "action" | "condition" | "delay" | "notify" | "approval"
  x: number
  y: number
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export interface PlaybookEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface PlaybookGraph {
  nodes: PlaybookNode[]
  edges: PlaybookEdge[]
}

export type NodeType = PlaybookNode["type"]

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 72
export const PORT_RADIUS = 6

export interface NodeTypeConfig {
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: LucideIcon
  hasInput: boolean
  hasOutput: boolean
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  trigger: {
    label: "触发器",
    description: "剧本触发条件",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.4)",
    icon: Zap,
    hasInput: false,
    hasOutput: true,
  },
  action: {
    label: "执行动作",
    description: "执行安全响应动作",
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.08)",
    borderColor: "rgba(59,130,246,0.4)",
    icon: Shield,
    hasInput: true,
    hasOutput: true,
  },
  condition: {
    label: "条件判断",
    description: "条件分支判断",
    color: "#eab308",
    bgColor: "rgba(234,179,8,0.08)",
    borderColor: "rgba(234,179,8,0.4)",
    icon: GitBranch,
    hasInput: true,
    hasOutput: true,
  },
  delay: {
    label: "延时等待",
    description: "延时等待执行",
    color: "#64748b",
    bgColor: "rgba(100,116,139,0.08)",
    borderColor: "rgba(100,116,139,0.4)",
    icon: Clock,
    hasInput: true,
    hasOutput: true,
  },
  notify: {
    label: "发送通知",
    description: "发送告警通知",
    color: "#a855f7",
    bgColor: "rgba(168,85,247,0.08)",
    borderColor: "rgba(168,85,247,0.4)",
    icon: Bell,
    hasInput: true,
    hasOutput: true,
  },
  approval: {
    label: "人工审批",
    description: "等待人工审批",
    color: "#f97316",
    bgColor: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.4)",
    icon: UserCheck,
    hasInput: true,
    hasOutput: true,
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DEFAULT_NODE_DATA: Record<NodeType, Record<string, any>> = {
  trigger: { triggerType: "confidence", condition: "置信度 ≥ 85%" },
  action: { actionType: "isolateHost", target: "" },
  condition: { expression: "", trueLabel: "是", falseLabel: "否" },
  delay: { duration: 5, unit: "minutes" },
  notify: { channel: "email", recipients: "" },
  approval: { approver: "", timeout: 30, timeoutUnit: "minutes" },
}

export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function generateEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getNodeDetail(node: PlaybookNode): string {
  const d = node.data
  switch (node.type) {
    case "trigger":
      return (d.condition as string) || "触发条件"
    case "action": {
      const map: Record<string, string> = {
        freezeAccount: "冻结账号",
        isolateHost: "隔离终端",
        blockIp: "封禁IP",
        resetVpnCredentials: "重置密码",
        notifySecurityTeam: "通知团队",
        preserveForensicData: "保全取证",
      }
      return map[d.actionType as string] || (d.actionType as string) || "执行动作"
    }
    case "condition":
      return (d.expression as string) || "条件判断"
    case "delay": {
      const unitMap: Record<string, string> = { seconds: "秒", minutes: "分钟", hours: "小时" }
      return `${(d.duration as number) || 0} ${unitMap[d.unit as string] || "分钟"}`
    }
    case "notify": {
      const chMap: Record<string, string> = { email: "邮件通知", sms: "短信通知", webhook: "Webhook", im: "即时消息" }
      return chMap[d.channel as string] || "发送通知"
    }
    case "approval":
      return d.approver ? `审批人: ${d.approver as string}` : "等待审批"
    default:
      return ""
  }
}

export function getEdgePath(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string {
  const dy = Math.abs(ty - sy)
  const offset = Math.max(dy * 0.5, 50)
  return `M ${sx} ${sy} C ${sx} ${sy + offset}, ${tx} ${ty - offset}, ${tx} ${ty}`
}
