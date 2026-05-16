"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Crosshair,
  Search,
  Plus,
  Shield,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Hash,
  Link2,
  Zap,
  Brain,
  FileWarning,
  Database,
  RefreshCw,
  Bug,
  ShieldCheck,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api, formatDateTime, batchLookupIOC, type IOCLookupResult } from "@/lib/api"
import { PageHeader } from "@/components/layout/page-header"
import { inputClass, softCardClass } from "@/lib/admin-ui"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import RiskBadge from "@/components/common/RiskBadge"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { useLocaleStore } from "@/store/locale-store"

type HypothesisStatus = "验证中" | "已确认" | "已排除"

interface HuntingHypothesis {
  id: string
  name: string
  tactic: string
  technique: string
  techniqueId: string
  createdAt: string
  status: HypothesisStatus
  iocCount: number
  confidence: number
}

const ATTCK_TACTICS = [
  "侦察",
  "资源开发",
  "初始访问",
  "执行",
  "持久化",
  "权限提升",
  "防御规避",
  "凭证访问",
  "发现",
  "横向移动",
  "收集",
  "C2",
  "数据外泄",
  "影响",
]

const STATUS_CONFIG: Record<HypothesisStatus, { color: string; bg: string; border: string; icon: typeof Clock }> = {
  "验证中": { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  "已确认": { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle },
  "已排除": { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
}

interface ApiHuntingHypothesis {
  id: number
  name: string
  tactic: string
  technique: string | null
  technique_id: string | null
  description: string | null
  status: string
  confidence: number
  ioc_count: number
  related_ioc: string | null
  alert_id: number | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

function mapApiHypothesis(raw: ApiHuntingHypothesis): HuntingHypothesis {
  return {
    id: String(raw.id),
    name: raw.name,
    tactic: raw.tactic,
    technique: raw.technique || "",
    techniqueId: raw.technique_id || "",
    createdAt: formatDateTime(raw.created_at),
    status: (raw.status as HypothesisStatus) || "验证中",
    iocCount: raw.ioc_count,
    confidence: raw.confidence,
  }
}

type IocTypeDisplay = "IP" | "域名" | "Hash" | "URL"

function mapIocType(apiType: string): IocTypeDisplay {
  const t = apiType.toLowerCase()
  if (t === "ip") return "IP"
  if (t === "domain") return "域名"
  if (t === "hash" || t === "file") return "Hash"
  if (t === "url" || t === "uri") return "URL"
  return "域名"
}

const IOC_TYPE_CONFIG: Record<IocTypeDisplay, { color: string; bg: string; border: string; icon: typeof Globe }> = {
  IP: { color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", icon: Globe },
  域名: { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", icon: Link2 },
  Hash: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Hash },
  URL: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: Zap },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-red-500" : value >= 50 ? "bg-amber-400" : "bg-cyan-500"
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={cn("h-full rounded-full transition-colors duration-700", color)} style={{ width: `${value}%` }} />
    </div>
  )
}

function HypothesisCard({ hypothesis }: { hypothesis: HuntingHypothesis }) {
  const statusCfg = STATUS_CONFIG[hypothesis.status]
  const StatusIcon = statusCfg.icon
  return (
    <Card className={cn(
      "border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 hover:shadow-md",
      hypothesis.status === "已确认" && "border-red-200 bg-red-50/50",
      hypothesis.status === "验证中" && "border-amber-200 bg-amber-50/30",
      hypothesis.status === "已排除" && "border-emerald-200 bg-emerald-50/30"
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-slate-400">{hypothesis.id}</span>
              <span className="text-sm font-medium text-slate-800 truncate">{hypothesis.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] text-cyan-700 bg-cyan-50 border-cyan-200 py-0 px-1.5">
                <Target className="size-3 mr-0.5" />
                {hypothesis.tactic}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-indigo-600 bg-indigo-50 border-indigo-200 py-0 px-1.5">
                <span className="font-mono mr-0.5">{hypothesis.techniqueId}</span>
                {hypothesis.technique}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 shrink-0", statusCfg.color, statusCfg.bg, statusCfg.border)}>
            <StatusIcon className="size-3 mr-0.5" />
            {hypothesis.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3" />
            <span>{hypothesis.createdAt}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileWarning className="size-3" />
            <span>关联IOC: {hypothesis.iocCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">置信度</span>
          <div className="flex-1">
            <ConfidenceBar value={hypothesis.confidence} />
          </div>
          <span className={cn(
            "text-xs font-mono font-semibold shrink-0",
            hypothesis.confidence >= 80 ? "text-red-600" : hypothesis.confidence >= 50 ? "text-amber-600" : "text-cyan-600"
          )}>
            {hypothesis.confidence}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function IOCBatchQuery() {
  useLocaleStore()
  const [iocInput, setIocInput] = useState("")
  const [results, setResults] = useState<IOCLookupResult[]>([])
  const [cacheInfo, setCacheInfo] = useState<{ hits: number; misses: number } | null>(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQuery = async () => {
    const lines = iocInput.trim().split("\n").filter(Boolean)
    if (lines.length === 0) return

    setIsQuerying(true)
    setError(null)
    setCacheInfo(null)

    try {
      const response = await batchLookupIOC(lines)
      setResults(response.results)
      setCacheInfo({ hits: response.cache_hits, misses: response.cache_misses })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "IOC查询失败，请检查网络连接"
      setError(message)
      setResults([])
    } finally {
      setIsQuerying(false)
    }
  }

  const riskScoreColor = (score: number) => {
    if (score >= 90) return "text-red-600"
    if (score >= 70) return "text-amber-600"
    return "text-cyan-600"
  }

  const riskBarColor = (score: number) => {
    if (score >= 90) return "bg-red-500"
    if (score >= 70) return "bg-amber-400"
    return "bg-cyan-500"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 border border-amber-200">
          <Brain className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-slate-800">IOC批量查询</h2>
          <p className="text-xs text-slate-400">输入IP/域名/Hash/URL进行威胁情报关联查询</p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm shadow-slate-200/30">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder={"每行输入一个IOC指标，支持以下格式：\nIP: 185.220.101.34\n域名: evil-domain.xyz\nHash: a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5\nURL: https://cmd6.malware-c2.xyz/update"}
            value={iocInput}
            onChange={(e) => setIocInput(e.target.value)}
            className="min-h-[120px] border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-xs font-mono focus-visible:border-cyan-400 focus-visible:ring-cyan-200"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {iocInput.trim() ? `已输入 ${iocInput.trim().split("\n").filter(Boolean).length} 条IOC` : "等待输入"}
            </span>
            <Button
              onClick={handleQuery}
              disabled={!iocInput.trim() || isQuerying}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs gap-1.5"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  查询中…
                </>
              ) : (
                <>
                  <Search className="size-3.5" />
                  批量查询
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isQuerying && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-300">
          <div className="size-6 mb-2 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
          <p className="text-xs">正在查询威胁情报...</p>
        </div>
      )}

      {error && !isQuerying && (
        <div className="flex flex-col items-center justify-center py-8 text-red-400">
          <AlertTriangle className="size-6 mb-2" />
          <p className="text-xs text-center">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-red-200 bg-white text-red-500 hover:text-red-700 text-xs h-7"
            onClick={handleQuery}
          >
            重试
          </Button>
        </div>
      )}

      {!isQuerying && !error && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">查询结果 ({results.length})</span>
              {cacheInfo && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200 py-0 px-1.5">
                    <Database className="size-2.5 mr-0.5" />
                    缓存命中: {cacheInfo.hits}
                  </Badge>
                  {cacheInfo.misses > 0 && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200 py-0 px-1.5">
                      实时查询: {cacheInfo.misses}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white text-slate-500 hover:text-cyan-700 hover:border-cyan-200 text-xs h-7"
              onClick={() => { setResults([]); setCacheInfo(null) }}
            >
              清除结果
            </Button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {results.map((result, idx) => {
              const typeDisplay = mapIocType(result.ioc_type)
              const typeCfg = IOC_TYPE_CONFIG[typeDisplay]
              const TypeIcon = typeCfg.icon
              const maliciousSources = result.sources.filter((s) => s.result.malicious)
              const cleanSources = result.sources.filter((s) => !s.result.malicious)

              return (
                <Card key={`${result.ioc_value}-${idx}`} className={cn(
                  "border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm shadow-slate-200/30",
                  result.risk_level === "critical" && "border-red-200 bg-red-50/30",
                  result.risk_level === "high" && "border-orange-200 bg-orange-50/20"
                )}>
                  <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TypeIcon className={cn("size-3.5 shrink-0", typeCfg.color)} />
                        <span className="text-xs font-mono text-slate-700 truncate">{result.ioc_value}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5", typeCfg.color, typeCfg.bg, typeCfg.border)}>
                          {typeDisplay}
                        </Badge>
                        {result.from_cache && (
                          <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50 border-slate-200 py-0 px-1.5">
                            <Database className="size-2.5 mr-0.5" />
                            缓存
                          </Badge>
                        )}
                        <RiskBadge level={result.risk_level} size="sm" />
                        <span className={cn("text-xs font-mono font-semibold", riskScoreColor(result.risk_score))}>
                          {result.risk_score}
                        </span>
                      </div>
                    </div>

                    {result.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {result.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] text-slate-500 bg-slate-50 border-slate-200 py-0 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {result.sources.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Info className="size-3 text-slate-400 shrink-0" />
                          <span className="text-[10px] text-slate-400">情报源 ({result.sources.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {result.sources.slice(0, 3).map((source) => (
                            <div key={source.source_name} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {source.result.malicious ? (
                                  <Bug className="size-2.5 text-red-500 shrink-0" />
                                ) : (
                                  <ShieldCheck className="size-2.5 text-emerald-500 shrink-0" />
                                )}
                                <span className="text-slate-500 truncate">{source.source_name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={cn("font-mono", source.result.malicious ? "text-red-500" : "text-emerald-500")}>
                                  {source.result.score}
                                </span>
                                <span className="text-slate-300 truncate max-w-[80px] hidden sm:inline">
                                  {source.result.details}
                                </span>
                              </div>
                            </div>
                          ))}
                          {result.sources.length > 3 && (
                            <p className="text-[10px] text-slate-300">还有 {result.sources.length - 3} 个情报源...</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>恶意源: {maliciousSources.length}/{result.sources.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.first_seen && <span>首次: {formatDateTime(result.first_seen)}</span>}
                        {result.last_seen && <span>末次: {formatDateTime(result.last_seen)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-colors", riskBarColor(result.risk_score))}
                          style={{ width: `${result.risk_score}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {!isQuerying && !error && results.length === 0 && iocInput.trim() && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-300">
          <Search className="size-6 mb-2" />
          <p className="text-xs">输入IOC后点击批量查询</p>
        </div>
      )}
    </div>
  )
}

export default function HuntingPage() {
  useLocaleStore()
  const [activeFilter, setActiveFilter] = useState<HypothesisStatus | "全部">("全部")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hypotheses, setHypotheses] = useState<HuntingHypothesis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newHypothesis, setNewHypothesis] = useState({
    name: "",
    tactic: "",
    description: "",
    relatedIOC: "",
  })

  const fetchHypotheses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/hunting/hypotheses")
      const items: ApiHuntingHypothesis[] = res.data.items ?? res.data
      setHypotheses(items.map(mapApiHypothesis))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "加载假设列表失败"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHypotheses()
  }, [fetchHypotheses])

  const filteredHypotheses = hypotheses.filter((h) => {
    if (activeFilter !== "全部" && h.status !== activeFilter) return false
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase()) && !h.techniqueId.toLowerCase().includes(searchQuery.toLowerCase()) && !h.tactic.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filterCards: { label: string; count: number; color: string; bg: string; border: string; status: HypothesisStatus | "全部" }[] = [
    { label: "全部假设", count: hypotheses.length, color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", status: "全部" },
    { label: "验证中", count: hypotheses.filter((h) => h.status === "验证中").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", status: "验证中" },
    { label: "已确认", count: hypotheses.filter((h) => h.status === "已确认").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", status: "已确认" },
    { label: "已排除", count: hypotheses.filter((h) => h.status === "已排除").length, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", status: "已排除" },
  ]

  const handleCreateHypothesis = async () => {
    setSubmitting(true)
    try {
      await api.post("/hunting/hypotheses", {
        name: newHypothesis.name,
        tactic: newHypothesis.tactic,
        description: newHypothesis.description,
        related_ioc: newHypothesis.relatedIOC,
        confidence: 50.0,
        created_by: "current_user",
      })
      setNewHypothesis({ name: "", tactic: "", description: "", relatedIOC: "" })
      setDialogOpen(false)
      await fetchHypotheses()
    } catch {
      setError("创建假设失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Crosshair}
        title="威胁狩猎"
        subtitle="基于ATT&CK框架的主动威胁发现"
      />

      <div className="grid grid-cols-4 gap-4">
        {filterCards.map((card) => (
          <Card
            key={card.status}
            className={cn(
              "cursor-pointer transition-colors border",
              activeFilter === card.status
                ? cn(card.border, card.bg, "shadow-sm shadow-slate-200/50")
                : softCardClass
            )}
            onClick={() => setActiveFilter(card.status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", activeFilter === card.status ? card.color : "text-slate-400")}>{card.label}</span>
                {card.status === "验证中" && <Clock className="size-4 text-amber-400" />}
                {card.status === "已确认" && <AlertTriangle className="size-4 text-red-400" />}
                {card.status === "已排除" && <CheckCircle2 className="size-4 text-emerald-400" />}
                {card.status === "全部" && <Crosshair className="size-4 text-cyan-500" />}
              </div>
              <p className={cn("mt-1 text-2xl font-bold font-mono", activeFilter === card.status ? card.color : "text-slate-600")}>{card.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
          <Input
              placeholder="搜索假设名称、战术、技术ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-8 pl-8 text-xs ${inputClass}`}
              aria-label="搜索狩猎假设"
              name="search"
              type="search"
              autoComplete="off"
            />
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
        >
          <Plus className="size-4" />
          新建假设
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">狩猎假设列表 ({filteredHypotheses.length})</span>
          </div>
          <div className="space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <div className="size-8 mb-2 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
                <p className="text-sm">加载中…</p>
              </div>
            )}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-red-400">
                <AlertTriangle className="size-8 mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            {!loading && !error && filteredHypotheses.map((hypothesis) => (
              <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
            ))}
            {!loading && !error && filteredHypotheses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Search className="size-8 mb-2" />
                <p className="text-sm">未找到匹配的狩猎假设</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <IOCBatchQuery />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">新建狩猎假设</DialogTitle>
            <DialogDescription className="text-slate-400">创建基于ATT&CK框架的威胁狩猎假设</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-name" className="text-xs text-slate-400">假设名称</label>
              <Input
                id="hypothesis-name"
                placeholder="输入假设名称"
                value={newHypothesis.name}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, name: e.target.value }))}
                className={`text-xs ${inputClass}`}
                name="name"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-tactic" className="text-xs text-slate-400">ATT&CK战术</label>
              <Select value={newHypothesis.tactic} onValueChange={(v) => v && setNewHypothesis((prev) => ({ ...prev, tactic: v }))}>
                <SelectTrigger id="hypothesis-tactic" className={`w-full text-xs ${inputClass}`}>
                  <SelectValue placeholder="选择ATT&CK战术" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {ATTCK_TACTICS.map((tactic) => (
                    <SelectItem key={tactic} value={tactic} className="text-slate-600 text-xs focus:bg-cyan-50 focus:text-cyan-700">
                      {tactic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-description" className="text-xs text-slate-400">描述</label>
              <Textarea
                id="hypothesis-description"
                placeholder="描述假设的攻击场景和狩猎目标"
                value={newHypothesis.description}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px] border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-xs focus-visible:border-cyan-400 focus-visible:ring-cyan-200"
                name="description"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-ioc" className="text-xs text-slate-400">关联IOC</label>
              <Textarea
                id="hypothesis-ioc"
                placeholder={"每行输入一个IOC指标\n如: 185.220.101.34\nevil-domain.xyz"}
                value={newHypothesis.relatedIOC}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, relatedIOC: e.target.value }))}
                className="min-h-[60px] border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-xs font-mono focus-visible:border-cyan-400 focus-visible:ring-cyan-200"
                name="relatedIOC"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50 text-xs"
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
              disabled={submitting || !newHypothesis.name || !newHypothesis.tactic}
              onClick={handleCreateHypothesis}
            >
              {submitting ? "创建中…" : "创建假设"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
