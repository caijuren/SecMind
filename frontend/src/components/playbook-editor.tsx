"use client"

import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant,
  type Connection,
  type NodeProps,
  type Node,
  type Edge,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  Zap,
  GitBranch,
  Shield,
  UserCheck,
  Bell,
  Clock,
  Trash2,
  Copy,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { useLocaleStore } from "@/store/locale-store"

interface NodeData {
  label: string
  detail: string
  icon: string
  [key: string]: unknown
}

const iconMap: Record<string, LucideIcon> = {
  trigger: Zap,
  condition: GitBranch,
  action: Shield,
  approval: UserCheck,
  notify: Bell,
  delay: Clock,
}

const colorMap: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  trigger: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600",
    accent: "blue",
  },
  condition: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    accent: "amber",
  },
  action: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600",
    accent: "red",
  },
  approval: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-600",
    accent: "purple",
  },
  notify: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600",
    accent: "blue",
  },
  delay: {
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
    accent: "slate",
  },
}

function BaseNode({ data, nodeType }: { data: NodeData; nodeType: string }) {
  const Icon = iconMap[nodeType] || Shield
  const colors = colorMap[nodeType] || colorMap.action

  return (
    <div
      className={`px-4 py-3 rounded-lg border ${colors.border} ${colors.bg} min-w-[180px] max-w-[240px] transition-colors duration-200 hover:border-primary/30`}
    >
      {nodeType !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-card !border-2 !border-blue-500/40 !transition-colors hover:!border-blue-400 hover:!bg-blue-500/20"
        />
      )}
      <div className="flex items-center gap-2.5 mb-1">
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${colors.bg} border ${colors.border}`}>
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        </div>
        <span className="text-sm font-semibold text-foreground">{data.label}</span>
      </div>
      {data.detail && (
        <p className="text-xs text-muted-foreground leading-relaxed pl-[38px]">{data.detail}</p>
      )}
      {nodeType !== "delay" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-card !border-2 !border-blue-500/40 !transition-colors hover:!border-blue-400 hover:!bg-blue-500/20"
        />
      )}
    </div>
  )
}

function TriggerNode({ data }: NodeProps<Node<NodeData>>) {
  return <BaseNode data={data} nodeType="trigger" />
}

function ActionNode({ data }: NodeProps<Node<NodeData>>) {
  return <BaseNode data={data} nodeType="action" />
}

function ConditionNode({ data }: NodeProps<Node<NodeData>>) {
  return <BaseNode data={data} nodeType="condition" />
}

function DelayNode({ data }: NodeProps<Node<NodeData>>) {
  return <BaseNode data={data} nodeType="delay" />
}

function NotifyNode({ data }: NodeProps<Node<NodeData>>) {
  return <BaseNode data={data} nodeType="notify" />
}

function ApprovalNode({ data }: NodeProps<Node<NodeData>>) {
  return <BaseNode data={data} nodeType="approval" />
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  notify: NotifyNode,
  approval: ApprovalNode,
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  nodeId: string | null
  edgeId: string | null
}

interface PlaybookEditorProps {
  nodes: Node[]
  edges: Edge[]
  onChange?: (nodes: Node[], edges: Edge[]) => void
  readOnly?: boolean
}

interface HistoryEntry {
  nodes: Node[]
  edges: Edge[]
}

const MAX_HISTORY = 50

const CONNECTION_RULES: Record<string, string[]> = {
  trigger: ["action", "condition", "delay", "notify"],
  action: ["action", "condition", "delay", "notify", "approval"],
  condition: ["action", "condition", "delay", "notify", "approval"],
  delay: ["action", "condition", "delay", "notify", "approval"],
  notify: ["action", "condition", "delay", "notify", "approval"],
  approval: ["action", "notify", "delay"],
}

function validateConnection(sourceType: string, targetType: string): boolean {
  const allowed = CONNECTION_RULES[sourceType]
  if (!allowed) return true
  return allowed.includes(targetType)
}

function getValidationErrors(nodes: Node[], edges: Edge[], t: (key: string) => string): string[] {
  const errors: string[] = []

  for (const node of nodes) {
    const data = node.data as NodeData
    if (!data.label || data.label.trim() === "") {
      errors.push(t("playbook.nodeMissingName").replace("{id}", node.id))
    }
  }

  const triggerCount = nodes.filter((n) => (n.data as NodeData).icon === "trigger").length
  if (triggerCount === 0) {
    errors.push(t("playbook.needTrigger"))
  }

  const nodesWithNoOutput = nodes.filter((n) => {
    const icon = (n.data as NodeData).icon as string
    if (icon === "trigger") return false
    return !edges.some((e) => e.source === n.id)
  })
  if (nodesWithNoOutput.length > 1) {
    errors.push(t("playbook.noDownstreamCount").replace("{count}", String(nodesWithNoOutput.length)))
  }

  return errors
}

export function PlaybookEditor({ nodes: initialNodes, edges: initialEdges, onChange, readOnly = false }: PlaybookEditorProps) {
  const { t } = useLocaleStore()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])

  const historyRef = useRef<HistoryEntry[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isUndoRedoRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    edgeId: null,
  })

  const validationErrors = useMemo(
    () => getValidationErrors(nodes, edges, t),
    [nodes, edges, t]
  )

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    if (isUndoRedoRef.current) return
    const history = historyRef.current
    const index = historyIndexRef.current
    const newHistory = history.slice(0, index + 1)
    newHistory.push({ nodes: JSON.parse(JSON.stringify(n)), edges: JSON.parse(JSON.stringify(e)) })
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    historyRef.current = newHistory
    historyIndexRef.current = newHistory.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const history = historyRef.current
    const index = historyIndexRef.current
    if (index <= 0) return
    isUndoRedoRef.current = true
    const entry = history[index - 1]
    setNodes(entry.nodes)
    setEdges(entry.edges)
    historyIndexRef.current = index - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(true)
    onChange?.(entry.nodes, entry.edges)
    setTimeout(() => { isUndoRedoRef.current = false }, 0)
  }, [setNodes, setEdges, onChange])

  const redo = useCallback(() => {
    const history = historyRef.current
    const index = historyIndexRef.current
    if (index >= history.length - 1) return
    isUndoRedoRef.current = true
    const entry = history[index + 1]
    setNodes(entry.nodes)
    setEdges(entry.edges)
    historyIndexRef.current = index + 1
    setCanUndo(true)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    onChange?.(entry.nodes, entry.edges)
    setTimeout(() => { isUndoRedoRef.current = false }, 0)
  }, [setNodes, setEdges, onChange])

  useEffect(() => {
    if (historyRef.current.length === 0) {
      pushHistory(initialNodes, initialEdges)
    }
  }, [initialNodes, initialEdges, pushHistory])

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      setTimeout(() => {
        setNodes((currentNodes) => {
          setEdges((currentEdges) => {
            pushHistory(currentNodes, currentEdges)
            onChange?.(currentNodes, currentEdges)
            return currentEdges
          })
          return currentNodes
        })
      }, 0)
    },
    [onNodesChange, setNodes, setEdges, pushHistory, onChange]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes)
      setTimeout(() => {
        setNodes((currentNodes) => {
          setEdges((currentEdges) => {
            pushHistory(currentNodes, currentEdges)
            onChange?.(currentNodes, currentEdges)
            return currentEdges
          })
          return currentNodes
        })
      }, 0)
    },
    [onEdgesChange, setNodes, setEdges, pushHistory, onChange]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)
      if (sourceNode && targetNode) {
        const sourceType = (sourceNode.data as NodeData).icon as string
        const targetType = (targetNode.data as NodeData).icon as string
        if (!validateConnection(sourceType, targetType)) {
          return
        }
      }
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
          },
          eds
        )
        pushHistory(nodes, newEdges)
        onChange?.(nodes, newEdges)
        return newEdges
      })
    },
    [setEdges, nodes, onChange, pushHistory]
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { stroke: "#3b82f655", strokeWidth: 2 },
      type: "smoothstep",
    }),
    []
  )

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      if (readOnly) return
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        edgeId: null,
      })
    },
    [readOnly]
  )

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      if (readOnly) return
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: null,
        edgeId: edge.id,
      })
    },
    [readOnly]
  )

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null, edgeId: null })
  }, [])

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => {
        const newEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
        pushHistory(
          nodes.filter((n) => n.id !== nodeId),
          newEdges
        )
        onChange?.(nodes.filter((n) => n.id !== nodeId), newEdges)
        return newEdges
      })
    },
    [setNodes, setEdges, nodes, pushHistory, onChange]
  )

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => {
        const newEdges = eds.filter((e) => e.id !== edgeId)
        pushHistory(nodes, newEdges)
        onChange?.(nodes, newEdges)
        return newEdges
      })
    },
    [setEdges, nodes, pushHistory, onChange]
  )

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      const newId = `${node.type}-${Date.now()}`
      const newNode: Node = {
        ...node,
        id: newId,
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        selected: false,
        data: { ...(node.data as NodeData) },
      }
      setNodes((nds) => {
        const newNodes = [...nds, newNode]
        pushHistory(newNodes, edges)
        onChange?.(newNodes, edges)
        return newNodes
      })
    },
    [nodes, edges, setNodes, pushHistory, onChange]
  )

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodes(selNodes.map((n) => n.id))
      setSelectedEdges(selEdges.map((e) => e.id))
    },
    []
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
        return
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        if (selectedNodes.length > 0) {
          selectedNodes.forEach((id) => handleDeleteNode(id))
        }
        if (selectedEdges.length > 0) {
          selectedEdges.forEach((id) => handleDeleteEdge(id))
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault()
        redo()
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault()
        redo()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedNodes, selectedEdges, handleDeleteNode, handleDeleteEdge, undo, redo])

  useEffect(() => {
    const handleClick = () => closeContextMenu()
    if (contextMenu.visible) {
      document.addEventListener("click", handleClick)
      return () => document.removeEventListener("click", handleClick)
    }
  }, [contextMenu.visible, closeContextMenu])

  const contextMenuNode = contextMenu.nodeId
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null

  return (
    <div className="h-full w-full rounded-lg border border-border bg-card overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : handleNodesChange}
        onEdgesChange={readOnly ? undefined : handleEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onSelectionChange={onSelectionChange}
        deleteKeyCode={readOnly ? null : ["Delete", "Backspace"]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d8" />
        <Controls
          aria-label={t("playbook.flowControls")}
          className="!bg-card !border-border [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
        />
        <MiniMap
          aria-label={t("playbook.flowMinimap")}
          className="!bg-card !border-border"
          nodeColor={(n) => {
            const nodeType = (n.data as NodeData)?.icon as string
            const colorMap2: Record<string, string> = {
              trigger: "#06b6d4",
              condition: "#f59e0b",
              action: "#ef4444",
              approval: "#a855f7",
              notify: "#3b82f6",
              delay: "#64748b",
            }
            return colorMap2[nodeType] || "#22d3ee"
          }}
          maskColor="rgba(0,0,0,0.15)"
          pannable
          zoomable
        />
      </ReactFlow>

      {!readOnly && validationErrors.length > 0 && (
        <div className="absolute top-3 right-3 max-w-[260px]">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 ">
            <p className="text-xs font-semibold text-red-600 mb-1.5">{t("playbook.validationWarning")}</p>
            {validationErrors.map((err, i) => (
              <p key={i} className="text-[11px] text-red-500/80 leading-relaxed">
                {err}
              </p>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-2 py-1 text-[11px] rounded border border-border bg-card text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={t("playbook.undoShortcut")}
          >
            {t("playbook.undo")}
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-2 py-1 text-[11px] rounded border border-border bg-card text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={t("playbook.redoShortcut")}
          >
            {t("playbook.redo")}
          </button>
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-popover shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.nodeId && (
            <>
              <div className="px-3 py-1.5 text-[11px] text-muted-foreground font-semibold border-b border-border mb-1">
                {contextMenuNode ? (contextMenuNode.data as NodeData)?.label || t("playbook.node") : t("playbook.node")}
              </div>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {
                  handleDuplicateNode(contextMenu.nodeId!)
                  closeContextMenu()
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                {t("playbook.duplicateNode")}
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {
                  closeContextMenu()
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                {t("playbook.configNode")}
              </button>
              <div className="border-t border-border my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10 transition-colors"
                onClick={() => {
                  handleDeleteNode(contextMenu.nodeId!)
                  closeContextMenu()
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("playbook.deleteNode")}
              </button>
            </>
          )}
          {contextMenu.edgeId && (
            <>
              <div className="px-3 py-1.5 text-[11px] text-muted-foreground font-semibold border-b border-border mb-1">
                {t("playbook.connection")}
              </div>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10 transition-colors"
                onClick={() => {
                  handleDeleteEdge(contextMenu.edgeId!)
                  closeContextMenu()
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("playbook.deleteConnection")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function convertPlaybookToFlow(
  pbNodes: { id: string; type: string; label: string; detail: string }[],
  pbEdges: { from: string; to: string; label?: string }[]
): { nodes: Node[]; edges: Edge[] } {
  const yPositions: Record<string, number> = {}
  let currentY = 0

  const flowNodes: Node[] = pbNodes.map((n) => {
    if (!(n.id in yPositions)) {
      yPositions[n.id] = currentY
      currentY += 120
    }
    return {
      id: n.id,
      type: n.type,
      position: { x: 250, y: yPositions[n.id] },
      data: { label: n.label, detail: n.detail, icon: n.type },
    }
  })

  const flowEdges: Edge[] = pbEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
    label: e.label,
    animated: true,
    style: { stroke: "#22d3ee55", strokeWidth: 2 },
    type: "smoothstep",
  }))

  return { nodes: flowNodes, edges: flowEdges }
}
