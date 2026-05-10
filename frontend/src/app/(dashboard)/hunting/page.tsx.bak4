"use client"

import { useState } from "react"
import {
  Crosshair,
  Search,
  Plus,
  Shield,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Hash,
  Link2,
  Zap,
  Brain,
  FileWarning,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

interface IOCResult {
  id: string
  value: string
  type: "IP" | "域名" | "Hash" | "URL"
  threatScore: number
  relatedIntel: string
  firstSeen: string
  lastSeen: string
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
  "验证中": { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock },
  "已确认": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle },
  "已排除": { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2 },
}

const FILTER_CARDS: { label: string; count: number; color: string; bg: string; border: string; status: HypothesisStatus | "全部" }[] = [
  { label: "全部假设", count: 15, color: "text-cyan-400", bg: "bg-cyan-500/[0.06]", border: "border-cyan-500/20", status: "全部" },
  { label: "验证中", count: 5, color: "text-yellow-400", bg: "bg-yellow-500/[0.06]", border: "border-yellow-500/20", status: "验证中" },
  { label: "已确认", count: 3, color: "text-red-400", bg: "bg-red-500/[0.06]", border: "border-red-500/20", status: "已确认" },
  { label: "已排除", count: 7, color: "text-green-400", bg: "bg-green-500/[0.06]", border: "border-green-500/20", status: "已排除" },
]

const mockHypotheses: HuntingHypothesis[] = [
  { id: "HT-001", name: "APT29钓鱼攻击凭证窃取", tactic: "初始访问", technique: "鱼叉式钓鱼", techniqueId: "T1566.001", createdAt: "2026-05-10 09:12", status: "验证中", iocCount: 8, confidence: 87 },
  { id: "HT-002", name: "Cobalt Strike C2隧道通信", tactic: "C2", technique: "应用层协议", techniqueId: "T1071.001", createdAt: "2026-05-10 08:45", status: "已确认", iocCount: 12, confidence: 94 },
  { id: "HT-003", name: "内网横向移动Pass-the-Hash", tactic: "横向移动", technique: "Pass-the-Hash", techniqueId: "T1550.002", createdAt: "2026-05-09 22:30", status: "已确认", iocCount: 6, confidence: 91 },
  { id: "HT-004", name: "DNS隧道数据外泄", tactic: "数据外泄", technique: "替代通道", techniqueId: "T1048", createdAt: "2026-05-09 18:15", status: "验证中", iocCount: 4, confidence: 72 },
  { id: "HT-005", name: "PowerShell编码执行恶意脚本", tactic: "执行", technique: "PowerShell", techniqueId: "T1059.001", createdAt: "2026-05-09 16:40", status: "已排除", iocCount: 2, confidence: 35 },
  { id: "HT-006", name: "Mimikatz凭证转储", tactic: "凭证访问", technique: "OS凭证转储", techniqueId: "T1003.001", createdAt: "2026-05-09 14:22", status: "已确认", iocCount: 9, confidence: 96 },
  { id: "HT-007", name: "注册表持久化后门", tactic: "持久化", technique: "注册表运行键", techniqueId: "T1547.001", createdAt: "2026-05-09 11:08", status: "验证中", iocCount: 3, confidence: 65 },
  { id: "HT-008", name: "WebShell植入后门", tactic: "持久化", technique: "Web Shell", techniqueId: "T1505.003", createdAt: "2026-05-08 20:55", status: "已排除", iocCount: 1, confidence: 22 },
  { id: "HT-009", name: "域控权限提升攻击", tactic: "权限提升", technique: "域权限提升", techniqueId: "T1068", createdAt: "2026-05-08 17:33", status: "验证中", iocCount: 7, confidence: 83 },
  { id: "HT-010", name: "防御规避-禁用安全软件", tactic: "防御规避", technique: "禁用安全工具", techniqueId: "T1562.001", createdAt: "2026-05-08 15:10", status: "已排除", iocCount: 0, confidence: 18 },
  { id: "HT-011", name: "RDP暴力破解横向扩散", tactic: "横向移动", technique: "远程服务", techniqueId: "T1021.001", createdAt: "2026-05-08 12:47", status: "验证中", iocCount: 5, confidence: 78 },
  { id: "HT-012", name: "供应链投毒恶意更新", tactic: "初始访问", technique: "供应链妥协", techniqueId: "T1195.002", createdAt: "2026-05-07 23:20", status: "已排除", iocCount: 3, confidence: 28 },
  { id: "HT-013", name: "Kerberoasting域凭证攻击", tactic: "凭证访问", technique: "Kerberoasting", techniqueId: "T1558.003", createdAt: "2026-05-07 19:05", status: "已确认", iocCount: 11, confidence: 89 },
  { id: "HT-014", name: "计划任务持久化驻留", tactic: "持久化", technique: "计划任务", techniqueId: "T1053.005", createdAt: "2026-05-07 14:38", status: "已排除", iocCount: 2, confidence: 41 },
  { id: "HT-015", name: "云资源权限滥用", tactic: "权限提升", technique: "云权限提升", techniqueId: "T1548.005", createdAt: "2026-05-07 10:15", status: "已排除", iocCount: 1, confidence: 15 },
]

const mockIOCResults: IOCResult[] = [
  { id: "ioc-1", value: "185.220.101.34", type: "IP", threatScore: 92, relatedIntel: "Tor出口节点，APT29基础设施", firstSeen: "2026-04-12", lastSeen: "2026-05-10" },
  { id: "ioc-2", value: "evil-domain.xyz", type: "域名", threatScore: 88, relatedIntel: "DGA域名，C2通信关联", firstSeen: "2026-04-20", lastSeen: "2026-05-09" },
  { id: "ioc-3", value: "a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5", type: "Hash", threatScore: 95, relatedIntel: "Cobalt Strike Beacon样本", firstSeen: "2026-03-15", lastSeen: "2026-05-10" },
  { id: "ioc-4", value: "https://cmd6.malware-c2.xyz/update", type: "URL", threatScore: 91, relatedIntel: "恶意软件更新通道", firstSeen: "2026-04-28", lastSeen: "2026-05-10" },
  { id: "ioc-5", value: "103.45.67.89", type: "IP", threatScore: 76, relatedIntel: "代理服务器，数据外泄目标", firstSeen: "2026-05-01", lastSeen: "2026-05-09" },
  { id: "ioc-6", value: "shipping@dhl-phish.com", type: "域名", threatScore: 84, relatedIntel: "钓鱼域名，定向攻击", firstSeen: "2026-05-05", lastSeen: "2026-05-08" },
  { id: "ioc-7", value: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9", type: "Hash", threatScore: 97, relatedIntel: "Agent Tesla木马变种", firstSeen: "2026-04-18", lastSeen: "2026-05-10" },
  { id: "ioc-8", value: "10.0.2.100", type: "IP", threatScore: 68, relatedIntel: "内网失陷主机，横向移动源", firstSeen: "2026-05-02", lastSeen: "2026-05-10" },
]

const IOC_TYPE_CONFIG: Record<IOCResult["type"], { color: string; bg: string; border: string; icon: typeof Globe }> = {
  IP: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Globe },
  域名: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Link2 },
  Hash: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Hash },
  URL: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: Zap },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-red-400" : value >= 50 ? "bg-yellow-400" : "bg-cyan-400"
  const glow = value >= 80 ? "shadow-[0_0_8px_rgba(248,113,113,0.4)]" : value >= 50 ? "shadow-[0_0_8px_rgba(250,204,21,0.3)]" : ""
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-700", color, glow)} style={{ width: `${value}%` }} />
    </div>
  )
}

function HypothesisCard({ hypothesis }: { hypothesis: HuntingHypothesis }) {
  const statusCfg = STATUS_CONFIG[hypothesis.status]
  const StatusIcon = statusCfg.icon
  return (
    <Card className={cn(
      "border bg-white/[0.02] backdrop-blur-xl transition-all hover:bg-white/[0.04]",
      hypothesis.status === "已确认" && "border-red-500/15 shadow-[0_0_12px_rgba(239,68,68,0.08)]",
      hypothesis.status === "验证中" && "border-yellow-500/15",
      hypothesis.status === "已排除" && "border-green-500/10",
      hypothesis.status !== "已确认" && hypothesis.status !== "验证中" && hypothesis.status !== "已排除" && "border-white/[0.06]"
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-white/40">{hypothesis.id}</span>
              <span className="text-sm font-medium text-white/90 truncate">{hypothesis.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] text-cyan-400 bg-cyan-500/10 border-cyan-500/20 py-0 px-1.5">
                <Target className="size-3 mr-0.5" />
                {hypothesis.tactic}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-purple-400 bg-purple-500/10 border-purple-500/20 py-0 px-1.5">
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

        <div className="flex items-center justify-between text-xs text-white/40">
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
          <span className="text-xs text-white/30 shrink-0">置信度</span>
          <div className="flex-1">
            <ConfidenceBar value={hypothesis.confidence} />
          </div>
          <span className={cn(
            "text-xs font-mono font-bold shrink-0",
            hypothesis.confidence >= 80 ? "text-red-400" : hypothesis.confidence >= 50 ? "text-yellow-400" : "text-cyan-400"
          )}>
            {hypothesis.confidence}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function IOCBatchQuery() {
  const { t } = useLocaleStore()
  const [iocInput, setIocInput] = useState("")
  const [results, setResults] = useState<IOCResult[]>([])
  const [isQuerying, setIsQuerying] = useState(false)

  const handleQuery = () => {
    if (!iocInput.trim()) return
    setIsQuerying(true)
    setTimeout(() => {
      setResults(mockIOCResults)
      setIsQuerying(false)
    }, 800)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Brain className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/90">IOC批量查询</h2>
          <p className="text-xs text-white/40">输入IP/域名/Hash/URL进行威胁情报关联查询</p>
        </div>
      </div>

      <Card className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder={"每行输入一个IOC指标，支持以下格式：\nIP: 185.220.101.34\n域名: evil-domain.xyz\nHash: a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5\nURL: https://cmd6.malware-c2.xyz/update"}
            value={iocInput}
            onChange={(e) => setIocInput(e.target.value)}
            className="min-h-[120px] border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/20 text-xs font-mono focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">
              {iocInput.trim() ? `已输入 ${iocInput.trim().split("\n").filter(Boolean).length} 条IOC` : "等待输入"}
            </span>
            <Button
              onClick={handleQuery}
              disabled={!iocInput.trim() || isQuerying}
              className="bg-cyan-600/80 hover:bg-cyan-700 text-white text-xs gap-1.5"
            >
              <Search className="size-3.5" />
              {isQuerying ? "查询中..." : "批量查询"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">查询结果 ({results.length})</span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/[0.04] text-white/50 hover:text-cyan-400 hover:border-cyan-500/25 text-xs h-7"
              onClick={() => setResults([])}
            >
              清除结果
            </Button>
          </div>
          <div className="space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {results.map((result) => {
              const typeCfg = IOC_TYPE_CONFIG[result.type]
              const TypeIcon = typeCfg.icon
              return (
                <Card key={result.id} className="border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] transition-all">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TypeIcon className={cn("size-3.5 shrink-0", typeCfg.color)} />
                        <span className="text-xs font-mono text-white/80 truncate">{result.value}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5", typeCfg.color, typeCfg.bg, typeCfg.border)}>
                          {result.type}
                        </Badge>
                        <span className={cn(
                          "text-xs font-mono font-bold",
                          result.threatScore >= 90 ? "text-red-400" : result.threatScore >= 70 ? "text-amber-400" : "text-cyan-400"
                        )}>
                          {result.threatScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="size-3 text-white/30 shrink-0" />
                      <span className="text-xs text-white/50 truncate">{result.relatedIntel}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/30">
                      <span>首次出现: {result.firstSeen}</span>
                      <span>末次出现: {result.lastSeen}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            result.threatScore >= 90 ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]" : result.threatScore >= 70 ? "bg-amber-400" : "bg-cyan-400"
                          )}
                          style={{ width: `${result.threatScore}%` }}
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
    </div>
  )
}

export default function HuntingPage() {
  const { t } = useLocaleStore()
  const [activeFilter, setActiveFilter] = useState<HypothesisStatus | "全部">("全部")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newHypothesis, setNewHypothesis] = useState({
    name: "",
    tactic: "",
    description: "",
    relatedIOC: "",
  })

  const filteredHypotheses = mockHypotheses.filter((h) => {
    if (activeFilter !== "全部" && h.status !== activeFilter) return false
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase()) && !h.techniqueId.toLowerCase().includes(searchQuery.toLowerCase()) && !h.tactic.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Crosshair}
        title="威胁狩猎"
        subtitle="基于ATT&CK框架的主动威胁发现"
      />

      <div className="grid grid-cols-4 gap-4">
        {FILTER_CARDS.map((card) => (
          <Card
            key={card.status}
            className={cn(
              "cursor-pointer transition-all border backdrop-blur-xl",
              activeFilter === card.status
                ? cn(card.border, card.bg, "shadow-[0_0_16px_rgba(6,182,212,0.1)]")
                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            )}
            onClick={() => setActiveFilter(card.status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", activeFilter === card.status ? card.color : "text-white/40")}>{card.label}</span>
                {card.status === "验证中" && <Clock className="size-4 text-yellow-400/40" />}
                {card.status === "已确认" && <AlertTriangle className="size-4 text-red-400/40" />}
                {card.status === "已排除" && <CheckCircle2 className="size-4 text-green-400/40" />}
                {card.status === "全部" && <Crosshair className="size-4 text-cyan-400/40" />}
              </div>
              <p className={cn("mt-1 text-2xl font-bold font-mono", activeFilter === card.status ? card.color : "text-white/70")}>{card.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="搜索假设名称、战术、技术ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-white/10 bg-white/[0.04] pl-8 text-xs text-white/80 placeholder:text-white/25 focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
          />
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-cyan-600/80 hover:bg-cyan-700 text-white gap-1.5"
        >
          <Plus className="size-4" />
          新建假设
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">狩猎假设列表 ({filteredHypotheses.length})</span>
          </div>
          <div className="space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {filteredHypotheses.map((hypothesis) => (
              <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
            ))}
            {filteredHypotheses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
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
        <DialogContent className="sm:max-w-md bg-[#0a1628] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">新建狩猎假设</DialogTitle>
            <DialogDescription className="text-white/40">创建基于ATT&CK框架的威胁狩猎假设</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">假设名称</label>
              <Input
                placeholder="输入假设名称"
                value={newHypothesis.name}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, name: e.target.value }))}
                className="border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/25 text-xs focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">ATT&CK战术</label>
              <Select value={newHypothesis.tactic} onValueChange={(v) => v && setNewHypothesis((prev) => ({ ...prev, tactic: v }))}>
                <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-white/70 text-xs">
                  <SelectValue placeholder="选择ATT&CK战术" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1628] border-white/10">
                  {ATTCK_TACTICS.map((tactic) => (
                    <SelectItem key={tactic} value={tactic} className="text-white/70 text-xs focus:bg-cyan-500/10 focus:text-cyan-400">
                      {tactic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">描述</label>
              <Textarea
                placeholder="描述假设的攻击场景和狩猎目标"
                value={newHypothesis.description}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px] border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/25 text-xs focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">关联IOC</label>
              <Textarea
                placeholder={"每行输入一个IOC指标\n如: 185.220.101.34\nevil-domain.xyz"}
                value={newHypothesis.relatedIOC}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, relatedIOC: e.target.value }))}
                className="min-h-[60px] border-white/10 bg-white/[0.04] text-white/80 placeholder:text-white/25 text-xs font-mono focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] text-xs"
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              className="bg-cyan-600/80 hover:bg-cyan-700 text-white text-xs"
              onClick={() => setDialogOpen(false)}
            >
              创建假设
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
