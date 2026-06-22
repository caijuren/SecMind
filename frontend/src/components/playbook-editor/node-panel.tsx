"use client"

import { NODE_TYPE_CONFIG, type NodeType } from "./editor-types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GripVertical } from "lucide-react"

const NODE_TYPES: NodeType[] = [
  "trigger",
  "action",
  "condition",
  "delay",
  "notify",
  "approval",
]

export function NodePanel() {
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    type: NodeType
  ) => {
    e.dataTransfer.setData("application/playbook-node-type", type)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="w-60 shrink-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border/40 bg-muted/30">
        <h4 className="text-xs font-semibold text-muted-foreground">节点类型</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">拖拽到画布创建节点</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {NODE_TYPES.map((type) => {
            const config = NODE_TYPE_CONFIG[type]
            const Icon = config.icon
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-2.5 cursor-grab active:cursor-grabbing transition-colors hover:border-border group select-none"
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground shrink-0" />
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{
                    backgroundColor: config.bgColor,
                    border: `1px solid ${config.borderColor}`,
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: config.color }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {config.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {config.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
