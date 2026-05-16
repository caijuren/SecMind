"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  PlaybookNode,
  PlaybookEdge,
  NodeType,
  NODE_TYPE_CONFIG,
  NODE_WIDTH,
  NODE_HEIGHT,
  PORT_RADIUS,
  getNodeDetail,
  getEdgePath,
} from "./editor-types"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"

interface CanvasProps {
  nodes: PlaybookNode[]
  edges: PlaybookEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  onSelectNode: (id: string | null) => void
  onSelectEdge: (id: string | null) => void
  onNodeMove: (id: string, x: number, y: number) => void
  onAddNode: (type: NodeType, x: number, y: number) => void
  onConnect: (sourceId: string, targetId: string) => void
}

interface InteractionState {
  mode: "idle" | "dragging" | "connecting" | "panning"
  nodeId?: string
  startMouseX?: number
  startMouseY?: number
  startNodeX?: number
  startNodeY?: number
  startPanX?: number
  startPanY?: number
  hasMoved?: boolean
}

export function Canvas({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onNodeMove,
  onAddNode,
  onConnect,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const interactionRef = useRef<InteractionState>({ mode: "idle" })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 60, y: 60 })
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [tempEdgeEnd, setTempEdgeEnd] = useState<{ x: number; y: number } | null>(null)
  const [hoveredPort, setHoveredPort] = useState<string | null>(null)

  const panRef = useRef(pan)
  const zoomRef = useRef(zoom)
  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect()
      const svgX = clientX - rect.left
      const svgY = clientY - rect.top
      return {
        x: (svgX - panRef.current.x) / zoomRef.current,
        y: (svgY - panRef.current.y) / zoomRef.current,
      }
    },
    []
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const rect = svgRef.current!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const factor = e.deltaY > 0 ? 0.92 : 1.08
      const newZoom = Math.min(Math.max(zoomRef.current * factor, 0.15), 3)

      const newPanX = mouseX - (mouseX - panRef.current.x) * (newZoom / zoomRef.current)
      const newPanY = mouseY - (mouseY - panRef.current.y) * (newZoom / zoomRef.current)

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
    },
    []
  )

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement
      const portType = target.getAttribute("data-port-type")
      const nodeId = target.getAttribute("data-node-id")
      if (portType || nodeId) return

      if (e.altKey && e.button === 0) {
        interactionRef.current = {
          mode: "panning",
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
        }
        return
      }

      if (e.button !== 0) return

      if (connectingFrom) {
        setConnectingFrom(null)
        setTempEdgeEnd(null)
        return
      }

      onSelectNode(null)
      onSelectEdge(null)
    },
    [connectingFrom, onSelectNode, onSelectEdge]
  )

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const inter = interactionRef.current

      if (inter.mode === "dragging" && inter.nodeId) {
        const dx = (e.clientX - inter.startMouseX!) / zoomRef.current
        const dy = (e.clientY - inter.startMouseY!) / zoomRef.current
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          inter.hasMoved = true
        }
        onNodeMove(
          inter.nodeId,
          inter.startNodeX! + dx,
          inter.startNodeY! + dy
        )
      }

      if (inter.mode === "panning") {
        const dx = e.clientX - inter.startMouseX!
        const dy = e.clientY - inter.startMouseY!
        setPan({
          x: inter.startPanX! + dx,
          y: inter.startPanY! + dy,
        })
      }

      if (connectingFrom) {
        const pos = screenToCanvas(e.clientX, e.clientY)
        setTempEdgeEnd(pos)
      }
    },
    [onNodeMove, connectingFrom, screenToCanvas]
  )

  const handleSvgMouseUp = useCallback(
    () => {
      const inter = interactionRef.current

      if (inter.mode === "dragging" && inter.nodeId && !inter.hasMoved) {
        onSelectNode(inter.nodeId)
        onSelectEdge(null)
      }

      if (inter.mode === "panning") {
        interactionRef.current = { mode: "idle" }
        return
      }

      interactionRef.current = { mode: "idle" }
    },
    [onSelectNode, onSelectEdge]
  )

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent<SVGGElement>, nodeId: string) => {
      e.stopPropagation()
      if (e.button !== 0) return
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      interactionRef.current = {
        mode: "dragging",
        nodeId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startNodeX: node.x,
        startNodeY: node.y,
        hasMoved: false,
      }
    },
    [nodes]
  )

  const handleOutputPortMouseDown = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, nodeId: string) => {
      e.stopPropagation()
      e.preventDefault()
      setConnectingFrom(nodeId)
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        setTempEdgeEnd({
          x: node.x + NODE_WIDTH / 2,
          y: node.y + NODE_HEIGHT,
        })
      }
    },
    [nodes]
  )

  const handleInputPortMouseUp = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, nodeId: string) => {
      e.stopPropagation()
      if (connectingFrom && connectingFrom !== nodeId) {
        const exists = edges.some(
          (ed) => ed.source === connectingFrom && ed.target === nodeId
        )
        if (!exists) {
          onConnect(connectingFrom, nodeId)
        }
      }
      setConnectingFrom(null)
      setTempEdgeEnd(null)
    },
    [connectingFrom, edges, onConnect]
  )

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent<SVGGElement>, edgeId: string) => {
      e.stopPropagation()
      onSelectEdge(edgeId)
      onSelectNode(null)
    },
    [onSelectEdge, onSelectNode]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault()
      const nodeType = e.dataTransfer.getData(
        "application/playbook-node-type"
      ) as NodeType
      if (!nodeType) return

      const pos = screenToCanvas(e.clientX, e.clientY)
      onAddNode(nodeType, pos.x - NODE_WIDTH / 2, pos.y - NODE_HEIGHT / 2)
    },
    [onAddNode, screenToCanvas]
  )

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 3)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.width / 2
    const cy = rect.height / 2
    setPan({
      x: cx - (cx - pan.x) * (newZoom / zoom),
      y: cy - (cy - pan.y) * (newZoom / zoom),
    })
    setZoom(newZoom)
  }, [zoom, pan])

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom * 0.8, 0.15)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.width / 2
    const cy = rect.height / 2
    setPan({
      x: cx - (cx - pan.x) * (newZoom / zoom),
      y: cy - (cy - pan.y) * (newZoom / zoom),
    })
    setZoom(newZoom)
  }, [zoom, pan])

  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      setZoom(1)
      setPan({ x: 60, y: 60 })
      return
    }
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const minX = Math.min(...nodes.map((n) => n.x))
    const minY = Math.min(...nodes.map((n) => n.y))
    const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH))
    const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT))

    const cw = maxX - minX
    const ch = maxY - minY
    const padding = 80

    const newZoom = Math.min(
      (rect.width - padding * 2) / Math.max(cw, 1),
      (rect.height - padding * 2) / Math.max(ch, 1),
      1.5
    )

    setPan({
      x: (rect.width - cw * newZoom) / 2 - minX * newZoom,
      y: (rect.height - ch * newZoom) / 2 - minY * newZoom,
    })
    setZoom(newZoom)
  }, [nodes])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && connectingFrom) {
        setConnectingFrom(null)
        setTempEdgeEnd(null)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [connectingFrom])

  const connectingFromNode = connectingFrom
    ? nodes.find((n) => n.id === connectingFrom)
    : null

  return (
    <div className="flex-1 relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="select-none"
        style={{ cursor: connectingFrom ? "crosshair" : undefined }}
        onWheel={handleWheel}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <defs>
          <pattern
            id="canvas-grid"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={10} cy={10} r={0.8} fill="#cbd5e1" />
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
          <marker
            id="arrowhead-selected"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#0891b2" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="#f8fafc" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          <rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="url(#canvas-grid)"
            style={{ cursor: "grab" }}
          />

          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source)
            const targetNode = nodes.find((n) => n.id === edge.target)
            if (!sourceNode || !targetNode) return null

            const sx = sourceNode.x + NODE_WIDTH / 2
            const sy = sourceNode.y + NODE_HEIGHT
            const tx = targetNode.x + NODE_WIDTH / 2
            const ty = targetNode.y
            const path = getEdgePath(sx, sy, tx, ty)
            const isSelected = edge.id === selectedEdgeId

            return (
              <g
                key={edge.id}
                onClick={(e) => handleEdgeClick(e, edge.id)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={isSelected ? "#0891b2" : "#94a3b8"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={isSelected ? undefined : "6,3"}
                  markerEnd={`url(#${isSelected ? "arrowhead-selected" : "arrowhead"})`}
                />
                {edge.label && (
                  <text
                    x={(sx + tx) / 2}
                    y={(sy + ty) / 2 - 6}
                    textAnchor="middle"
                    fill={isSelected ? "#0891b2" : "#64748b"}
                    fontSize={11}
                    fontFamily="system-ui"
                    fontWeight={500}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {connectingFromNode && tempEdgeEnd && (
            <path
              d={getEdgePath(
                connectingFromNode.x + NODE_WIDTH / 2,
                connectingFromNode.y + NODE_HEIGHT,
                tempEdgeEnd.x,
                tempEdgeEnd.y
              )}
              fill="none"
              stroke="#0891b2"
              strokeWidth={2}
              strokeDasharray="8,4"
              opacity={0.7}
              pointerEvents="none"
            />
          )}

          {nodes.map((node) => {
            const config = NODE_TYPE_CONFIG[node.type]
            const Icon = config.icon
            const isSelected = node.id === selectedNodeId
            const detail = getNodeDetail(node)

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{ cursor: "grab" }}
              >
                <rect
                  x={1}
                  y={1}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill="rgba(0,0,0,0.03)"
                />
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill="white"
                  stroke={isSelected ? config.color : config.borderColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {isSelected && (
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={12}
                    fill={config.bgColor}
                    opacity={0.3}
                  />
                )}

                <rect
                  x={12}
                  y={16}
                  width={40}
                  height={40}
                  rx={8}
                  fill={config.bgColor}
                  stroke={config.borderColor}
                  strokeWidth={1}
                />
                <foreignObject
                  x={12}
                  y={16}
                  width={40}
                  height={40}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      size={18}
                      color={config.color}
                    />
                  </div>
                </foreignObject>

                <text
                  x={64}
                  y={34}
                  fill="#1e293b"
                  fontSize={13}
                  fontWeight={600}
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label.length > 10
                    ? node.label.substring(0, 10) + "…"
                    : node.label}
                </text>
                <text
                  x={64}
                  y={52}
                  fill="#94a3b8"
                  fontSize={11}
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none" }}
                >
                  {detail.length > 12
                    ? detail.substring(0, 12) + "…"
                    : detail}
                </text>

                {config.hasInput && (
                  <circle
                    cx={NODE_WIDTH / 2}
                    cy={0}
                    r={PORT_RADIUS}
                    fill="white"
                    stroke={
                      hoveredPort === `input-${node.id}`
                        ? config.color
                        : config.borderColor
                    }
                    strokeWidth={
                      hoveredPort === `input-${node.id}` ? 2.5 : 1.5
                    }
                    data-port-type="input"
                    data-node-id={node.id}
                    onMouseUp={(e) =>
                      handleInputPortMouseUp(e, node.id)
                    }
                    onMouseEnter={() =>
                      setHoveredPort(`input-${node.id}`)
                    }
                    onMouseLeave={() => setHoveredPort(null)}
                    style={{
                      cursor: connectingFrom ? "crosshair" : "default",
                      transition: "stroke 0.15s, stroke-width 0.15s",
                    }}
                  />
                )}

                {config.hasOutput && (
                  <circle
                    cx={NODE_WIDTH / 2}
                    cy={NODE_HEIGHT}
                    r={PORT_RADIUS}
                    fill="white"
                    stroke={
                      hoveredPort === `output-${node.id}`
                        ? config.color
                        : config.borderColor
                    }
                    strokeWidth={
                      hoveredPort === `output-${node.id}` ? 2.5 : 1.5
                    }
                    data-port-type="output"
                    data-node-id={node.id}
                    onMouseDown={(e) =>
                      handleOutputPortMouseDown(e, node.id)
                    }
                    onMouseEnter={() =>
                      setHoveredPort(`output-${node.id}`)
                    }
                    onMouseLeave={() => setHoveredPort(null)}
                    style={{
                      cursor: "crosshair",
                      transition: "stroke 0.15s, stroke-width 0.15s",
                    }}
                  />
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-1 py-1 shadow-sm">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleZoomOut}
          className="text-slate-500 hover:text-slate-700"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] text-slate-500 font-mono w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleZoomIn}
          className="text-slate-500 hover:text-slate-700"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleFitView}
          className="text-slate-500 hover:text-slate-700"
          title="适应画布"
        >
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>

      {connectingFrom && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-md">
          点击目标节点的输入端口完成连线，按 Esc 取消
        </div>
      )}
    </div>
  )
}
