"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Crosshair,
  Search,
  Plus,
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
import { usePageTitle } from "@/hooks/use-page-title"

const DEMO_IOC_RESULTS: IOCLookupResult[] = [
  { ioc_value: '103.45.67.89', ioc_type: 'ip', risk_score: 92, risk_level: 'critical', tags: ['C2节点', 'APT28', 'Tor出口'], sources: [{ source_name: 'VirusTotal', result: { malicious: true, score: 92, details: 'C2: APT28 infrastructure' } }, { source_name: 'AlienVault', result: { malicious: true, score: 88, details: 'C2: Cobalt Strike' } }], first_seen: '2025-11-01', last_seen: '2026-05-18', from_cache: true },
  { ioc_value: '185.220.101.34', ioc_type: 'ip', risk_score: 88, risk_level: 'high', tags: ['C2通信', 'Cobalt Strike'], sources: [{ source_name: 'AlienVault', result: { malicious: true, score: 88, details: 'Cobalt Strike C2' } }, { source_name: '内部威胁情报', result: { malicious: true, score: 90, details: 'APT29 C2' } }], first_seen: '2026-01-15', last_seen: '2026-05-18', from_cache: true },
  { ioc_value: 'evil-domain.xyz', ioc_type: 'domain', risk_score: 95, risk_level: 'critical', tags: ['DGA域名', 'DNS隧道'], sources: [{ source_name: '奇安信威胁情报', result: { malicious: true, score: 95, details: 'DGA + DNS tunnel' } }], first_seen: '2026-05-10', last_seen: '2026-05-17', from_cache: false },
  { ioc_value: 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5', ioc_type: 'hash', risk_score: 85, risk_level: 'high', tags: ['RedLine Stealer', '恶意软件'], sources: [{ source_name: 'VirusTotal', result: { malicious: true, score: 85, details: 'RedLine Stealer v2.3' } }], first_seen: '2026-04-20', last_seen: '2026-05-16', from_cache: true },
  { ioc_value: 'malware-c2.xyz', ioc_type: 'domain', risk_score: 90, risk_level: 'critical', tags: ['C2域名', 'APT29'], sources: [{ source_name: '内部威胁情报', result: { malicious: true, score: 90, details: 'APT29 C2 domain' } }], first_seen: '2026-03-01', last_seen: '2026-05-18', from_cache: true },
  { ioc_value: '10.0.2.100', ioc_type: 'ip', risk_score: 12, risk_level: 'low', tags: ['内网IP'], sources: [{ source_name: '内部资产库', result: { malicious: false, score: 10, details: 'Internal host' } }], first_seen: '2024-01-01', last_seen: '2026-05-18', from_cache: true },
  { ioc_value: 'dhl-phish.com', ioc_type: 'domain', risk_score: 93, risk_level: 'critical', tags: ['钓鱼域名', 'BEC'], sources: [{ source_name: 'PhishTank', result: { malicious: true, score: 93, details: 'BEC phishing domain' } }], first_seen: '2026-05-08', last_seen: '2026-05-17', from_cache: false },
  { ioc_value: '45.33.32.156', ioc_type: 'ip', risk_score: 78, risk_level: 'high', tags: ['扫描器', 'Shodan'], sources: [{ source_name: 'GreyNoise', result: { malicious: true, score: 78, details: 'Scanner / Shodan' } }], first_seen: '2025-07-01', last_seen: '2026-05-15', from_cache: true },
]
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

const DEMO_HYPOTHESES: HuntingHypothesis[] = [
  { id: 'HYP-001', name: '钓鱼邮件攻击链关联分析 - secm1nd.com', tactic: '初始访问', technique: '鱼叉式钓鱼附件', techniqueId: 'T1566.001', createdAt: '2026-05-18 09:15:00', status: '已确认', iocCount: 12, confidence: 92 },
  { id: 'HYP-002', name: 'Cobalt Strike Beacon C2通道追踪', tactic: 'C2', technique: '应用层协议', techniqueId: 'T1071.001', createdAt: '2026-05-18 08:30:00', status: '验证中', iocCount: 8, confidence: 88 },
  { id: 'HYP-003', name: '内网横向移动模式分析 - Pass-the-Hash', tactic: '横向移动', technique: 'Pass the Hash', techniqueId: 'T1550.002', createdAt: '2026-05-18 07:45:00', status: '验证中', iocCount: 15, confidence: 85 },
  { id: 'HYP-004', name: 'VPN不可能旅行攻击场景重建', tactic: '凭证访问', technique: '有效账户', techniqueId: 'T1078.003', createdAt: '2026-05-17 22:00:00', status: '已确认', iocCount: 6, confidence: 90 },
  { id: 'HYP-005', name: '勒索病毒WannaCry变种传播溯源', tactic: '影响', technique: '数据加密影响', techniqueId: 'T1486', createdAt: '2026-05-17 18:20:00', status: '已确认', iocCount: 20, confidence: 95 },
  { id: 'HYP-006', name: 'DNS隧道隐蔽通道检测', tactic: 'C2', technique: 'DNS', techniqueId: 'T1572', createdAt: '2026-05-17 15:00:00', status: '验证中', iocCount: 10, confidence: 78 },
  { id: 'HYP-007', name: 'Kubernetes RBAC权限提升调查', tactic: '权限提升', technique: '利用Kubernetes RBAC', techniqueId: 'T1610', createdAt: '2026-05-17 14:00:00', status: '已排除', iocCount: 5, confidence: 45 },
  { id: 'HYP-008', name: '供应链攻击npm恶意包分析', tactic: '初始访问', technique: '供应链攻陷', techniqueId: 'T1195.002', createdAt: '2026-05-17 11:30:00', status: '验证中', iocCount: 9, confidence: 82 },
  { id: 'HYP-009', name: 'BEC商业邮件欺诈攻击链分析', tactic: '初始访问', technique: '鱼叉式钓鱼链接', techniqueId: 'T1566.002', createdAt: '2026-05-17 09:00:00', status: '已确认', iocCount: 7, confidence: 87 },
  { id: 'HYP-010', name: '内网WebShell后门排查与溯源', tactic: '持久化', technique: 'Web Shell', techniqueId: 'T1505.003', createdAt: '2026-05-16 20:00:00', status: '已排除', iocCount: 4, confidence: 35 },
  { id: 'HYP-011', name: 'AWS IAM异常提权行为检测', tactic: '权限提升', technique: '利用云IAM', techniqueId: 'T1612', createdAt: '2026-05-16 16:30:00', status: '验证中', iocCount: 3, confidence: 72 },
  { id: 'HYP-012', name: 'Emotet木马内网传播范围调查', tactic: '横向移动', technique: '通过WMI执行', techniqueId: 'T1047', createdAt: '2026-05-16 14:00:00', status: '已确认', iocCount: 11, confidence: 84 },
  { id: 'HYP-013', name: '数据外泄通道分析 - Telegram Bot', tactic: '数据外泄', technique: '通过C2通道外传', techniqueId: 'T1041', createdAt: '2026-05-16 11:00:00', status: '验证中', iocCount: 6, confidence: 79 },
  { id: 'HYP-014', name: 'Cloudflare Workers C2通道检测', tactic: 'C2', technique: 'Web协议', techniqueId: 'T1102', createdAt: '2026-05-16 09:30:00', status: '已排除', iocCount: 2, confidence: 40 },
  { id: 'HYP-015', name: '离职员工账号未停用安全风险排查', tactic: '持久化', technique: '有效账户', techniqueId: 'T1078.004', createdAt: '2026-05-15 22:00:00', status: '已确认', iocCount: 4, confidence: 81 },
]

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
  "reconnaissance",
  "resourceDevelopment",
  "initialAccess",
  "execution",
  "persistence",
  "privilegeEscalation",
  "defenseEvasion",
  "credentialAccess",
  "discovery",
  "lateralMovement",
  "collection",
  "commandAndControl",
  "exfiltration",
  "impact",
]

const STATUS_CONFIG: Record<HypothesisStatus, { color: string; bg: string; border: string; icon: typeof Clock }> = {
  "验证中": { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock },
  "已确认": { color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle },
  "已排除": { color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
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

type IocTypeDisplay = "IP" | "Domain" | "Hash" | "URL"

function mapIocType(apiType: string): IocTypeDisplay {
  const lower = apiType.toLowerCase()
  if (lower === "ip") return "IP"
  if (lower === "domain") return "Domain"
  if (lower === "hash" || lower === "file") return "Hash"
  if (lower === "url" || lower === "uri") return "URL"
  return "Domain"
}

const IOC_TYPE_CONFIG: Record<IocTypeDisplay, { color: string; bg: string; border: string; icon: typeof Globe }> = {
  IP: { color: "text-primary", bg: "bg-primary/10", border: "border-cyan-500/20", icon: Globe },
  Domain: { color: "text-indigo-600", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: Link2 },
  Hash: { color: "text-amber-700", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Hash },
  URL: { color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", icon: Zap },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-red-500" : value >= 50 ? "bg-amber-400" : "bg-cyan-500"
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
      <div className={cn("h-full rounded-full transition-colors duration-700", color)} style={{ width: `${value}%` }} />
    </div>
  )
}

function HypothesisCard({ hypothesis }: { hypothesis: HuntingHypothesis }) {
  const { t } = useLocaleStore()
  const statusLabelMap: Record<string, string> = {
    "验证中": t("hunting.statusVerifying"),
    "已确认": t("hunting.statusConfirmed"),
    "已排除": t("hunting.statusExcluded"),
  }
  const tacticLabelMap: Record<string, string> = {
    reconnaissance: t("hunting.tacticReconnaissance"),
    resourceDevelopment: t("hunting.tacticResourceDevelopment"),
    initialAccess: t("hunting.tacticInitialAccess"),
    execution: t("hunting.tacticExecution"),
    persistence: t("hunting.tacticPersistence"),
    privilegeEscalation: t("hunting.tacticPrivilegeEscalation"),
    defenseEvasion: t("hunting.tacticDefenseEvasion"),
    credentialAccess: t("hunting.tacticCredentialAccess"),
    discovery: t("hunting.tacticDiscovery"),
    lateralMovement: t("hunting.tacticLateralMovement"),
    collection: t("hunting.tacticCollection"),
    commandAndControl: t("hunting.tacticCommandAndControl"),
    exfiltration: t("hunting.tacticExfiltration"),
    impact: t("hunting.tacticImpact"),
    "侦察": t("hunting.tacticReconnaissance"),
    "资源开发": t("hunting.tacticResourceDevelopment"),
    "初始访问": t("hunting.tacticInitialAccess"),
    "执行": t("hunting.tacticExecution"),
    "持久化": t("hunting.tacticPersistence"),
    "权限提升": t("hunting.tacticPrivilegeEscalation"),
    "防御规避": t("hunting.tacticDefenseEvasion"),
    "凭证访问": t("hunting.tacticCredentialAccess"),
    "发现": t("hunting.tacticDiscovery"),
    "横向移动": t("hunting.tacticLateralMovement"),
    "收集": t("hunting.tacticCollection"),
    "C2": t("hunting.tacticCommandAndControl"),
    "数据外泄": t("hunting.tacticExfiltration"),
    "影响": t("hunting.tacticImpact"),
  }
  const statusCfg = STATUS_CONFIG[hypothesis.status]
  const StatusIcon = statusCfg.icon
  return (
    <Card className={cn(
      "border-border bg-card shadow-sm transition-colors hover:bg-muted/50 hover:shadow-md",
      hypothesis.status === "已确认" && "border-red-500/20 bg-red-500/10",
      hypothesis.status === "验证中" && "border-amber-500/20 bg-amber-500/10",
      hypothesis.status === "已排除" && "border-emerald-500/20 bg-emerald-500/10"
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-muted-foreground/60">{hypothesis.id}</span>
              <span className="text-sm font-medium text-foreground truncate">{hypothesis.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-cyan-500/20 py-0 px-1.5">
                <Target className="size-3 mr-0.5" />
                {tacticLabelMap[hypothesis.tactic] || hypothesis.tactic}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-indigo-600 bg-indigo-500/10 border-indigo-500/20 py-0 px-1.5">
                <span className="font-mono mr-0.5">{hypothesis.techniqueId}</span>
                {hypothesis.technique}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 shrink-0", statusCfg.color, statusCfg.bg, statusCfg.border)}>
            <StatusIcon className="size-3 mr-0.5" />
            {statusLabelMap[hypothesis.status] || hypothesis.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3" />
            <span>{hypothesis.createdAt}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileWarning className="size-3" />
            <span>{t("hunting.relatedIoc")}: {hypothesis.iocCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">{t("hunting.confidenceLabel")}</span>
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
  const { t } = useLocaleStore()
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
      console.warn("IOC lookup API unavailable, using demo data", err)
      const iocLower = lines.map(l => l.trim().toLowerCase())
      setResults(DEMO_IOC_RESULTS.filter(r => iocLower.includes(r.ioc_value)))
      setCacheInfo({ hits: 0, misses: lines.length })
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

  const iocTypeLabel = (type: IocTypeDisplay): string => {
    const map: Record<IocTypeDisplay, string> = {
      IP: t("hunting.iocTypeIp"),
      Domain: t("hunting.iocTypeDomain"),
      Hash: t("hunting.iocTypeHash"),
      URL: t("hunting.iocTypeUrl"),
    }
    return map[type]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Brain className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">{t("hunting.iocBatchQuery")}</h2>
          <p className="text-xs text-muted-foreground/60">{t("hunting.iocBatchQueryDesc")}</p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm shadow-black/[0.08]">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder={t("hunting.inputIocPlaceholder")}
            value={iocInput}
            onChange={(e) => setIocInput(e.target.value)}
            className="min-h-[120px] border-border bg-card text-muted-foreground placeholder:text-muted-foreground/50 text-xs font-mono focus-visible:border-primary focus-visible:ring-primary/20"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {iocInput.trim() ? `${t("hunting.iocCount")} ${iocInput.trim().split("\n").filter(Boolean).length} IOC` : t("hunting.waitingInput")}
            </span>
            <Button
              onClick={handleQuery}
              disabled={!iocInput.trim() || isQuerying}
              className="bg-cyan-600 hover:bg-cyan-700 text-foreground text-xs gap-1.5"
            >
              {isQuerying ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  {t("hunting.querying")}
                </>
              ) : (
                <>
                  <Search className="size-3.5" />
                  {t("hunting.batchQuery")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isQuerying && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/70">
          <div className="size-6 mb-2 animate-spin rounded-full border-2 border-border border-t-cyan-500" />
          <p className="text-xs">{t("hunting.queryingIntel")}</p>
        </div>
      )}

      {error && !isQuerying && (
        <div className="flex flex-col items-center justify-center py-8 text-red-600">
          <AlertTriangle className="size-6 mb-2" />
          <p className="text-xs text-center">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-red-500/20 bg-card text-red-600 hover:text-red-700 text-xs h-7"
            onClick={handleQuery}
          >
            {t("common.retry")}
          </Button>
        </div>
      )}

      {!isQuerying && !error && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/60">{t("hunting.queryResults")} ({results.length})</span>
              {cacheInfo && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20 py-0 px-1.5">
                    <Database className="size-2.5 mr-0.5" />
                    {t("hunting.cacheHit")}: {cacheInfo.hits}
                  </Badge>
                  {cacheInfo.misses > 0 && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/20 py-0 px-1.5">
                      {t("hunting.realtimeQuery")}: {cacheInfo.misses}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/20 text-xs h-7"
              onClick={() => { setResults([]); setCacheInfo(null) }}
            >
              {t("hunting.clearResults")}
            </Button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/[0.10] scrollbar-track-transparent">
            {results.map((result, idx) => {
              const typeDisplay = mapIocType(result.ioc_type)
              const typeCfg = IOC_TYPE_CONFIG[typeDisplay]
              const TypeIcon = typeCfg.icon
              const maliciousSources = result.sources.filter((s) => s.result.malicious)

              return (
                <Card key={`${result.ioc_value}-${idx}`} className={cn(
                  "border-border bg-card hover:bg-muted/50 transition-colors shadow-sm shadow-black/[0.08]",
                  result.risk_level === "critical" && "border-red-500/20 bg-red-500/10",
                  result.risk_level === "high" && "border-orange-500/20 bg-orange-500/10"
                )}>
                  <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TypeIcon className={cn("size-3.5 shrink-0", typeCfg.color)} />
                        <span className="text-xs font-mono text-muted-foreground truncate">{result.ioc_value}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5", typeCfg.color, typeCfg.bg, typeCfg.border)}>
                          {iocTypeLabel(typeDisplay)}
                        </Badge>
                        {result.from_cache && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground/60 bg-muted/50 border-border py-0 px-1.5">
                            <Database className="size-2.5 mr-0.5" />
                            {t("hunting.cache")}
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
                          <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 border-border py-0 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {result.sources.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Info className="size-3 text-muted-foreground/60 shrink-0" />
                          <span className="text-[10px] text-muted-foreground/60">{t("hunting.intelSources")} ({result.sources.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {result.sources.slice(0, 3).map((source) => (
                            <div key={source.source_name} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {source.result.malicious ? (
                                  <Bug className="size-2.5 text-red-600 shrink-0" />
                                ) : (
                                  <ShieldCheck className="size-2.5 text-emerald-500 shrink-0" />
                                )}
                                <span className="text-muted-foreground truncate">{source.source_name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={cn("font-mono", source.result.malicious ? "text-red-600" : "text-emerald-500")}>
                                  {source.result.score}
                                </span>
                                <span className="text-muted-foreground/70 truncate max-w-[80px] hidden sm:inline">
                                  {source.result.details}
                                </span>
                              </div>
                            </div>
                          ))}
                          {result.sources.length > 3 && (
                            <p className="text-[10px] text-muted-foreground/70">{t("hunting.moreSources")} {result.sources.length - 3} {t("hunting.intelSources")}...</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                      <div className="flex items-center gap-1">
                        <span>{t("hunting.maliciousSources")}: {maliciousSources.length}/{result.sources.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.first_seen && <span>{t("hunting.firstSeen")}: {formatDateTime(result.first_seen)}</span>}
                        {result.last_seen && <span>{t("hunting.lastSeen")}: {formatDateTime(result.last_seen)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
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
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/70">
          <Search className="size-6 mb-2" />
          <p className="text-xs">{t("hunting.inputIocThenQuery")}</p>
        </div>
      )}
    </div>
  )
}

export default function HuntingPage() {
  const { t } = useLocaleStore()
  usePageTitle("hunting")
  const tacticLabelMap: Record<string, string> = {
    reconnaissance: t("hunting.tacticReconnaissance"),
    resourceDevelopment: t("hunting.tacticResourceDevelopment"),
    initialAccess: t("hunting.tacticInitialAccess"),
    execution: t("hunting.tacticExecution"),
    persistence: t("hunting.tacticPersistence"),
    privilegeEscalation: t("hunting.tacticPrivilegeEscalation"),
    defenseEvasion: t("hunting.tacticDefenseEvasion"),
    credentialAccess: t("hunting.tacticCredentialAccess"),
    discovery: t("hunting.tacticDiscovery"),
    lateralMovement: t("hunting.tacticLateralMovement"),
    collection: t("hunting.tacticCollection"),
    commandAndControl: t("hunting.tacticCommandAndControl"),
    exfiltration: t("hunting.tacticExfiltration"),
    impact: t("hunting.tacticImpact"),
  }
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
      console.warn("API unavailable, using demo data", err)
      setHypotheses(DEMO_HYPOTHESES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        void fetchHypotheses()
      })
    } else {
      Promise.resolve().then(() => fetchHypotheses())
    }
  }, [fetchHypotheses])

  const filteredHypotheses = hypotheses.filter((h) => {
    if (activeFilter !== "全部" && h.status !== activeFilter) return false
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase()) && !h.techniqueId.toLowerCase().includes(searchQuery.toLowerCase()) && !h.tactic.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const filterCards: { label: string; count: number; color: string; bg: string; border: string; status: HypothesisStatus | "全部" }[] = [
    { label: t("hunting.allHypotheses"), count: hypotheses.length, color: "text-primary", bg: "bg-primary/10", border: "border-cyan-500/20", status: "全部" },
    { label: t("hunting.verifying"), count: hypotheses.filter((h) => h.status === "验证中").length, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", status: "验证中" },
    { label: t("hunting.confirmed"), count: hypotheses.filter((h) => h.status === "已确认").length, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", status: "已确认" },
    { label: t("hunting.excluded"), count: hypotheses.filter((h) => h.status === "已排除").length, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", status: "已排除" },
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
      setError(t("hunting.createHypothesisFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Crosshair}
        title={t("hunting.title")}
        subtitle={t("hunting.subtitle")}
      />

      <div className="grid grid-cols-4 gap-4">
        {filterCards.map((card) => (
          <Card
            key={card.status}
            className={cn(
              "cursor-pointer transition-colors border",
              activeFilter === card.status
                ? cn(card.border, card.bg, "shadow-sm shadow-black/[0.08]")
                : softCardClass
            )}
            onClick={() => setActiveFilter(card.status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", activeFilter === card.status ? card.color : "text-muted-foreground/60")}>{card.label}</span>
                {card.status === "验证中" && <Clock className="size-4 text-amber-600" />}
                {card.status === "已确认" && <AlertTriangle className="size-4 text-red-600" />}
                {card.status === "已排除" && <CheckCircle2 className="size-4 text-emerald-600" />}
                {card.status === "全部" && <Crosshair className="size-4 text-cyan-500" />}
              </div>
              <p className={cn("mt-1 text-2xl font-bold font-mono", activeFilter === card.status ? card.color : "text-muted-foreground")}>{card.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
              placeholder={t("hunting.searchHypotheses")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-8 pl-8 text-xs ${inputClass}`}
              aria-label={t("hunting.searchHypotheses")}
              name="search"
              type="search"
              autoComplete="off"
            />
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-foreground gap-1.5"
        >
          <Plus className="size-4" />
          {t("hunting.newHypothesis")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">{t("hunting.huntingHypothesisList")} ({filteredHypotheses.length})</span>
          </div>
          <div className="space-y-3 scrollbar-thin scrollbar-thumb-white/[0.10] scrollbar-track-transparent">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/70">
                <div className="size-8 mb-2 animate-spin rounded-full border-2 border-border border-t-cyan-500" />
                <p className="text-sm">{t("common.loading")}</p>
              </div>
            )}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-red-600">
                <AlertTriangle className="size-8 mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            {!loading && !error && filteredHypotheses.map((hypothesis) => (
              <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
            ))}
            {!loading && !error && filteredHypotheses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/70">
                <Search className="size-8 mb-2" />
                <p className="text-sm">{t("hunting.noMatchingHypotheses")}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <IOCBatchQuery />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("hunting.newHuntingHypothesis")}</DialogTitle>
            <DialogDescription className="text-muted-foreground/60">{t("hunting.newHypothesisDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-name" className="text-xs text-muted-foreground/60">{t("hunting.hypothesisName")}</label>
              <Input
                id="hypothesis-name"
                placeholder={t("hunting.hypothesisNamePlaceholder")}
                value={newHypothesis.name}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, name: e.target.value }))}
                className={`text-xs ${inputClass}`}
                name="name"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-tactic" className="text-xs text-muted-foreground">{t("hunting.attckTactic")}</label>
              <Select value={newHypothesis.tactic} onValueChange={(v) => v && setNewHypothesis((prev) => ({ ...prev, tactic: v }))}>
                <SelectTrigger id="hypothesis-tactic" className={`w-full text-xs ${inputClass}`}>
                  <SelectValue placeholder={t("hunting.selectTactic")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ATTCK_TACTICS.map((tactic) => (
                    <SelectItem key={tactic} value={tactic} className="text-muted-foreground text-xs focus:bg-primary/10 focus:text-primary">
                      {tacticLabelMap[tactic] || tactic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-description" className="text-xs text-muted-foreground/60">{t("hunting.description")}</label>
              <Textarea
                id="hypothesis-description"
                placeholder={t("hunting.descriptionPlaceholder")}
                value={newHypothesis.description}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px] border-border bg-card text-muted-foreground placeholder:text-muted-foreground/50 text-xs focus-visible:border-primary focus-visible:ring-primary/20"
                name="description"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hypothesis-ioc" className="text-xs text-muted-foreground/60">{t("hunting.relatedIOC")}</label>
              <Textarea
                id="hypothesis-ioc"
                placeholder={t("hunting.iocPlaceholder")}
                value={newHypothesis.relatedIOC}
                onChange={(e) => setNewHypothesis((prev) => ({ ...prev, relatedIOC: e.target.value }))}
                className="min-h-[60px] border-border bg-card text-muted-foreground placeholder:text-muted-foreground/50 text-xs font-mono focus-visible:border-primary focus-visible:ring-primary/20"
                name="relatedIOC"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border bg-card text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 text-xs"
              onClick={() => setDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-foreground text-xs"
              disabled={submitting || !newHypothesis.name || !newHypothesis.tactic}
              onClick={handleCreateHypothesis}
            >
              {submitting ? t("hunting.creating") : t("hunting.createHypothesis")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
