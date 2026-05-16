"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  PlaybookNode,
  PlaybookEdge,
  PlaybookGraph,
  NodeType,
  NODE_TYPE_CONFIG,
  DEFAULT_NODE_DATA,
  generateNodeId,
  generateEdgeId,
} from "@/components/playbook-editor/editor-types"
import { Canvas } from "@/components/playbook-editor/canvas"
import { NodePanel } from "@/components/playbook-editor/node-panel"
import { PropertyPanel } from "@/components/playbook-editor/property-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { Workflow, Save, Loader2, ArrowLeft, Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

export default function PlaybookEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    }>
      <PlaybookEditorContent />
    </Suspense>
  )
}

function PlaybookEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const playbookId = searchParams.get("id")

  const [graph, setGraph] = useState<PlaybookGraph>({ nodes: [], edges: [] })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [playbookName, setPlaybookName] = useState("新建剧本")
  const [playbookDescription, setPlaybookDescription] = useState("")
  const [loading, setLoading] = useState(!!playbookId)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: "success" | "error" | "warning"
    message: string
    details?: string[]
  } | null>(null)

  useEffect(() => {
    if (!playbookId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await api.get(`/playbooks/${playbookId}`)
        if (cancelled) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = res.data as any
        setPlaybookName(data.name || "未命名剧本")
        setPlaybookDescription(data.description || "")
        const nodes: PlaybookNode[] = (data.nodes || []).map(
          (n: Record<string, unknown>, i: number) => ({
            id: (n.id as string) || `node-${i}`,
            type: (n.type as NodeType) || "action",
            x: (n.x as number) ?? 250,
            y: (n.y as number) ?? i * 120,
            label: (n.label as string) || "",
            data: (n.data as Record<string, unknown>) || DEFAULT_NODE_DATA[n.type as NodeType] || {},
          })
        )
        const edges: PlaybookEdge[] = (data.edges || []).map(
          (e: Record<string, unknown>, i: number) => ({
            id: (e.id as string) || `edge-${i}`,
            source: (e.from as string) || (e.source as string),
            target: (e.to as string) || (e.target as string),
            label: e.label as string | undefined,
          })
        )
        setGraph({ nodes, edges })
      } catch {
        setError("加载剧本失败")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [playbookId])

  const handleAddNode = useCallback(
    (type: NodeType, x: number, y: number) => {
      const config = NODE_TYPE_CONFIG[type]
      const newNode: PlaybookNode = {
        id: generateNodeId(),
        type,
        x,
        y,
        label: config.label,
        data: { ...DEFAULT_NODE_DATA[type] },
      }
      setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }))
      setSelectedNodeId(newNode.id)
      setSelectedEdgeId(null)
    },
    []
  )

  const handleNodeMove = useCallback(
    (id: string, x: number, y: number) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      }))
    },
    []
  )

  const handleConnect = useCallback(
    (sourceId: string, targetId: string) => {
      const newEdge: PlaybookEdge = {
        id: generateEdgeId(),
        source: sourceId,
        target: targetId,
      }
      setGraph((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }))
      setSelectedEdgeId(newEdge.id)
      setSelectedNodeId(null)
    },
    []
  )

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<PlaybookNode>) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }))
    },
    []
  )

  const handleUpdateEdge = useCallback(
    (id: string, updates: Partial<PlaybookEdge>) => {
      setGraph((prev) => ({
        ...prev,
        edges: prev.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }))
    },
    []
  )

  const handleDeleteNode = useCallback(
    (id: string) => {
      setGraph((prev) => ({
        nodes: prev.nodes.filter((n) => n.id !== id),
        edges: prev.edges.filter((e) => e.source !== id && e.target !== id),
      }))
      if (selectedNodeId === id) setSelectedNodeId(null)
    },
    [selectedNodeId]
  )

  const handleDeleteEdge = useCallback(
    (id: string) => {
      setGraph((prev) => ({
        ...prev,
        edges: prev.edges.filter((e) => e.id !== id),
      }))
      if (selectedEdgeId === id) setSelectedEdgeId(null)
    },
    [selectedEdgeId]
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: playbookName,
        description: playbookDescription,
        nodes: graph.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          x: n.x,
          y: n.y,
          data: n.data,
        })),
        edges: graph.edges.map((e) => ({
          source: e.source,
          target: e.target,
          label: e.label,
        })),
        steps: graph.nodes.length,
      }

      if (playbookId) {
        await api.put(`/playbooks/${playbookId}`, payload)
      } else {
        await api.post("/playbooks", {
          ...payload,
          trigger: graph.nodes.find((n) => n.type === "trigger")?.data?.condition || "",
          executions: 0,
          status: "enabled",
          created_by: "current_user",
        })
      }
      setError(null)
    } catch {
      setError("保存剧本失败")
    } finally {
      setSaving(false)
    }
  }, [playbookId, playbookName, playbookDescription, graph])

  const handleTestRun = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      if (playbookId) {
        const res = await api.post(`/playbooks/${playbookId}/validate`, {
          nodes: graph.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label,
            data: n.data,
          })),
          edges: graph.edges.map((e) => ({
            source: e.source,
            target: e.target,
            label: e.label,
          })),
        })
        const data = res.data as {
          valid?: boolean
          message?: string
          errors?: string[]
          warnings?: string[]
        }
        if (data.valid) {
          setTestResult({
            status: "success",
            message: data.message || "DAG 验证通过",
            details: data.warnings,
          })
        } else {
          setTestResult({
            status: "error",
            message: data.message || "DAG 验证失败",
            details: data.errors,
          })
        }
      } else {
        const res = await api.post("/playbooks/validate", {
          nodes: graph.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label,
            data: n.data,
          })),
          edges: graph.edges.map((e) => ({
            source: e.source,
            target: e.target,
            label: e.label,
          })),
        })
        const data = res.data as {
          valid?: boolean
          message?: string
          errors?: string[]
          warnings?: string[]
        }
        if (data.valid) {
          setTestResult({
            status: "success",
            message: data.message || "DAG 验证通过",
            details: data.warnings,
          })
        } else {
          setTestResult({
            status: "error",
            message: data.message || "DAG 验证失败",
            details: data.errors,
          })
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "验证请求失败，请检查后端服务"
      setTestResult({
        status: "warning",
        message: "无法连接到验证服务",
        details: [message],
      })
    } finally {
      setTesting(false)
    }
  }, [playbookId, graph])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        if (selectedNodeId) {
          handleDeleteNode(selectedNodeId)
        } else if (selectedEdgeId) {
          handleDeleteEdge(selectedEdgeId)
        }
      }
      if (e.key === "Escape") {
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge, handleSave])

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || null
  const selectedEdge = graph.edges.find((e) => e.id === selectedEdgeId) || null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-500 hover:text-slate-600"
            onClick={() => router.push("/workflows")}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-cyan-600" />
            <Input
              value={playbookName}
              onChange={(e) => setPlaybookName(e.target.value)}
              className="h-7 w-48 text-sm font-semibold border-transparent bg-transparent hover:border-slate-200 focus:border-cyan-400/60 focus:bg-white px-1"
            />
          </div>
          {playbookId && (
            <Badge
              variant="outline"
              className="text-[10px] border-slate-200 text-slate-500"
            >
              ID: {playbookId}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
          <span className="text-xs text-slate-500">
            {graph.nodes.length} 个节点 · {graph.edges.length} 条连线
          </span>
          <Button
            className="gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 border-cyan-200 text-cyan-700 hover:bg-cyan-50"
            disabled={testing || graph.nodes.length === 0}
            onClick={handleTestRun}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            测试运行
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`flex items-center gap-3 px-4 py-2.5 border-b shrink-0 ${
            testResult.status === "success"
              ? "bg-emerald-50/80 border-emerald-100"
              : testResult.status === "error"
                ? "bg-red-50/80 border-red-100"
                : "bg-amber-50/80 border-amber-100"
          }`}
        >
          {testResult.status === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : testResult.status === "error" ? (
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-medium ${
                testResult.status === "success"
                  ? "text-emerald-700"
                  : testResult.status === "error"
                    ? "text-red-700"
                    : "text-amber-700"
              }`}
            >
              {testResult.message}
            </p>
            {testResult.details && testResult.details.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {testResult.details.map((d, i) => (
                  <p
                    key={i}
                    className={`text-[11px] ${
                      testResult.status === "success"
                        ? "text-emerald-600/70"
                        : testResult.status === "error"
                          ? "text-red-600/70"
                          : "text-amber-600/70"
                    }`}
                  >
                    {d}
                  </p>
                ))}
              </div>
            )}
          </div>
          <button
            className={`text-xs shrink-0 hover:underline ${
              testResult.status === "success"
                ? "text-emerald-500"
                : testResult.status === "error"
                  ? "text-red-500"
                  : "text-amber-500"
            }`}
            onClick={() => setTestResult(null)}
          >
            关闭
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-3 p-3">
        <NodePanel />
        <Canvas
          nodes={graph.nodes}
          edges={graph.edges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectNode={setSelectedNodeId}
          onSelectEdge={setSelectedEdgeId}
          onNodeMove={handleNodeMove}
          onAddNode={handleAddNode}
          onConnect={handleConnect}
        />
        <PropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={handleUpdateNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>
    </div>
  )
}
