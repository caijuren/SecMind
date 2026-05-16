"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlaybookNode, PlaybookEdge, NODE_TYPE_CONFIG } from "./editor-types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Trash2, MousePointer2 } from "lucide-react"

type NodeData = Record<string, any>
type UpdateDataFn = (key: string, value: any) => void

interface PropertyPanelProps {
  selectedNode: PlaybookNode | null
  selectedEdge: PlaybookEdge | null
  onUpdateNode: (id: string, updates: Partial<PlaybookNode>) => void
  onUpdateEdge: (id: string, updates: Partial<PlaybookEdge>) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
}

export function PropertyPanel({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
}: PropertyPanelProps) {
  if (selectedNode) {
    return (
      <NodePropertyEditor
        node={selectedNode}
        onUpdate={onUpdateNode}
        onDelete={onDeleteNode}
      />
    )
  }

  if (selectedEdge) {
    return (
      <EdgePropertyEditor
        edge={selectedEdge}
        onUpdate={onUpdateEdge}
        onDelete={onDeleteEdge}
      />
    )
  }

  return (
    <div className="w-72 shrink-0 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-xs font-semibold text-slate-700">属性面板</h4>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MousePointer2 className="h-8 w-8 text-slate-200 mb-3" />
        <p className="text-xs text-slate-500">选择节点或连线</p>
        <p className="text-[10px] text-slate-500 mt-1">点击画布中的元素查看属性</p>
      </div>
    </div>
  )
}

function NodePropertyEditor({
  node,
  onUpdate,
  onDelete,
}: {
  node: PlaybookNode
  onUpdate: (id: string, updates: Partial<PlaybookNode>) => void
  onDelete: (id: string) => void
}) {
  const config = NODE_TYPE_CONFIG[node.type]
  const Icon = config.icon

  const updateData: UpdateDataFn = (key, value) => {
    onUpdate(node.id, {
      data: { ...node.data, [key]: value },
    })
  }

  return (
    <div className="w-72 shrink-0 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-6 h-6 rounded shrink-0"
            style={{
              backgroundColor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
            }}
          >
            <Icon className="h-3 w-3" style={{ color: config.color }} />
          </div>
          <h4 className="text-xs font-semibold text-slate-700">
            {config.label}属性
          </h4>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <div>
            <Label className="text-[11px] text-slate-500 mb-1">节点名称</Label>
            <Input
              value={node.label}
              onChange={(e) => onUpdate(node.id, { label: e.target.value })}
              className="h-7 text-xs border-slate-200 bg-white"
            />
          </div>

          <div>
            <Label className="text-[11px] text-slate-500 mb-1">节点类型</Label>
            <div
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs border border-slate-100 bg-slate-50"
              style={{ color: config.color }}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {node.type === "trigger" && (
            <TriggerFields data={node.data} updateData={updateData} />
          )}
          {node.type === "action" && (
            <ActionFields data={node.data} updateData={updateData} />
          )}
          {node.type === "condition" && (
            <ConditionFields data={node.data} updateData={updateData} />
          )}
          {node.type === "delay" && (
            <DelayFields data={node.data} updateData={updateData} />
          )}
          {node.type === "notify" && (
            <NotifyFields data={node.data} updateData={updateData} />
          )}
          {node.type === "approval" && (
            <ApprovalFields data={node.data} updateData={updateData} />
          )}

          <div className="h-px bg-slate-100" />

          <div>
            <Label className="text-[11px] text-slate-500 mb-1">位置</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-slate-500">X</span>
                <Input
                  type="number"
                  value={Math.round(node.x)}
                  onChange={(e) =>
                    onUpdate(node.id, { x: Number(e.target.value) })
                  }
                  className="h-7 text-xs border-slate-200 bg-white"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-500">Y</span>
                <Input
                  type="number"
                  value={Math.round(node.y)}
                  onChange={(e) =>
                    onUpdate(node.id, { y: Number(e.target.value) })
                  }
                  className="h-7 text-xs border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-3 w-3" />
            删除节点
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}

function EdgePropertyEditor({
  edge,
  onUpdate,
  onDelete,
}: {
  edge: PlaybookEdge
  onUpdate: (id: string, updates: Partial<PlaybookEdge>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="w-72 shrink-0 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-xs font-semibold text-slate-700">连线属性</h4>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          <div>
            <Label className="text-[11px] text-slate-500 mb-1">连线标签</Label>
            <Input
              value={edge.label || ""}
              onChange={(e) => onUpdate(edge.id, { label: e.target.value })}
              placeholder="输入连线标签"
              className="h-7 text-xs border-slate-200 bg-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-500 mb-1">源节点</Label>
            <div className="text-xs text-slate-600 rounded-md px-2 py-1.5 border border-slate-100 bg-slate-50">
              {edge.source}
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-slate-500 mb-1">目标节点</Label>
            <div className="text-xs text-slate-600 rounded-md px-2 py-1.5 border border-slate-100 bg-slate-50">
              {edge.target}
            </div>
          </div>
          <div className="h-px bg-slate-100" />
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => onDelete(edge.id)}
          >
            <Trash2 className="h-3 w-3" />
            删除连线
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}

function TriggerFields({ data, updateData }: { data: NodeData; updateData: UpdateDataFn }) {
  return (
    <>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">触发类型</Label>
        <Select
          value={data.triggerType || "confidence"}
          onValueChange={(v) => updateData("triggerType", v ?? "confidence")}
        >
          <SelectTrigger className="h-7 text-xs border-slate-200 bg-white w-full">
            <SelectValue />
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
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">触发条件</Label>
        <Input
          value={data.condition || ""}
          onChange={(e) => updateData("condition", e.target.value)}
          placeholder="如：置信度 ≥ 85%"
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
    </>
  )
}

function ActionFields({ data, updateData }: { data: NodeData; updateData: UpdateDataFn }) {
  return (
    <>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">动作类型</Label>
        <Select
          value={data.actionType || "isolateHost"}
          onValueChange={(v) => updateData("actionType", v ?? "isolateHost")}
        >
          <SelectTrigger className="h-7 text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="freezeAccount">冻结账号</SelectItem>
            <SelectItem value="isolateHost">隔离终端</SelectItem>
            <SelectItem value="blockIp">封禁IP</SelectItem>
            <SelectItem value="resetVpnCredentials">重置密码</SelectItem>
            <SelectItem value="notifySecurityTeam">通知团队</SelectItem>
            <SelectItem value="preserveForensicData">保全取证</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">目标</Label>
        <Input
          value={data.target || ""}
          onChange={(e) => updateData("target", e.target.value)}
          placeholder="如：user-001 或 192.168.1.1"
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
    </>
  )
}

function ConditionFields({ data, updateData }: { data: NodeData; updateData: UpdateDataFn }) {
  return (
    <>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">条件表达式</Label>
        <Input
          value={data.expression || ""}
          onChange={(e) => updateData("expression", e.target.value)}
          placeholder="如：confidence >= 80"
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">True 分支标签</Label>
        <Input
          value={data.trueLabel || "是"}
          onChange={(e) => updateData("trueLabel", e.target.value)}
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">False 分支标签</Label>
        <Input
          value={data.falseLabel || "否"}
          onChange={(e) => updateData("falseLabel", e.target.value)}
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
    </>
  )
}

function DelayFields({ data, updateData }: { data: NodeData; updateData: UpdateDataFn }) {
  return (
    <>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">延时时长</Label>
        <Input
          type="number"
          value={data.duration || 0}
          onChange={(e) => updateData("duration", Number(e.target.value))}
          min={0}
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">时间单位</Label>
        <Select
          value={data.unit || "minutes"}
          onValueChange={(v) => updateData("unit", v ?? "minutes")}
        >
          <SelectTrigger className="h-7 text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seconds">秒</SelectItem>
            <SelectItem value="minutes">分钟</SelectItem>
            <SelectItem value="hours">小时</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function NotifyFields({ data, updateData }: { data: NodeData; updateData: UpdateDataFn }) {
  return (
    <>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">通知渠道</Label>
        <Select
          value={data.channel || "email"}
          onValueChange={(v) => updateData("channel", v ?? "email")}
        >
          <SelectTrigger className="h-7 text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">邮件</SelectItem>
            <SelectItem value="sms">短信</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="im">即时消息</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">接收人</Label>
        <Input
          value={data.recipients || ""}
          onChange={(e) => updateData("recipients", e.target.value)}
          placeholder="如：security-team@company.com"
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
    </>
  )
}

function ApprovalFields({ data, updateData }: { data: NodeData; updateData: UpdateDataFn }) {
  return (
    <>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">审批人</Label>
        <Input
          value={data.approver || ""}
          onChange={(e) => updateData("approver", e.target.value)}
          placeholder="如：安全主管"
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">超时时间</Label>
        <Input
          type="number"
          value={data.timeout || 30}
          onChange={(e) => updateData("timeout", Number(e.target.value))}
          min={0}
          className="h-7 text-xs border-slate-200 bg-white"
        />
      </div>
      <div>
        <Label className="text-[11px] text-slate-500 mb-1">超时单位</Label>
        <Select
          value={data.timeoutUnit || "minutes"}
          onValueChange={(v) => updateData("timeoutUnit", v ?? "minutes")}
        >
          <SelectTrigger className="h-7 text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">分钟</SelectItem>
            <SelectItem value="hours">小时</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
