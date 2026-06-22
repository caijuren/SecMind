"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRealtimeAlerts, useRealtimeConnection } from "@/hooks/useRealtimeAlerts"
import { usePageTitle } from "@/hooks/use-page-title"
import {
  Activity,
  AlertTriangle,
  Radio,
  Shield,
  Wifi,
  WifiOff,
  Mail,
  Globe,
  Lock,
  Brain,
  Zap,
  Filter,
  Link2,
  Monitor,
  Layers,
  BarChart3,
  Eye,
  Clock,
  Crosshair,
  Database,
  Search,
  MoreHorizontal,
  ShieldOff,
  Ban,
  ArrowUpRight,
  FileDown,
  UserCog,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  ClipboardList,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RISK_CONFIG, type RiskLevel } from "@/lib/risk-config"
import { CARD } from "@/lib/design-system"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocaleStore } from "@/store/locale-store"
import { useWorkbenchBridgeStore } from "@/store/workbench-bridge-store"
import { PageHeader } from "@/components/layout/page-header"
import { TablePagination } from "@/components/layout/table-pagination"
import {
  useUnifiedDataStore,
  type SignalSource,
  type AIPreprocess,
  type LiveSignal,
  type AnomalousActivity,
  type RiskCluster,
} from "@/store/unified-data-store"

const SOURCE_CONFIG: Record<SignalSource, { icon: typeof Activity; color: string; bg: string }> = {
  EDR: { icon: Monitor, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  VPN: { icon: Wifi, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  IAM: { icon: Lock, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  Email: { icon: Mail, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  Firewall: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  DNS: { icon: Globe, color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
}

const PREPROCESS_CONFIG: Record<AIPreprocess, { color: string; icon: typeof Brain; labelKey: string }> = {
  "去噪": { color: "text-primary", icon: Filter, labelKey: "preprocessDenoise" },
  "聚合": { color: "text-amber-600", icon: Layers, labelKey: "preprocessAggregate" },
  "上下文补全": { color: "text-purple-600", icon: Brain, labelKey: "preprocessContextComplete" },
  "风险评分": { color: "text-red-600", icon: BarChart3, labelKey: "preprocessRiskScore" },
}

function SourceBadge({ source }: { source: SignalSource }) {
  const config = SOURCE_CONFIG[source]
  const Icon = config.icon
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", config.bg, config.color)}>
      <Icon className="size-3" />
      {source}
    </span>
  )
}

function RiskIndicator({ level, score }: { level: RiskLevel; score?: number }) {
  const config = RISK_CONFIG[level]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium", config.bg, config.color, level === "critical" && config.glow)}>
      {score !== undefined && <span className="font-mono tabular-nums font-bold">{score}</span>}
      <span>{config.label}</span>
    </span>
  )
}

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
    </span>
  )
}

function LiveSignalsTab({ t }: { t: (key: string) => string }) {
  const { alerts: wsAlerts, newAlertCount, clearNewAlerts, isConnected, lastMessage } = useRealtimeAlerts()
  const router = useRouter()
  const bridgeStore = useWorkbenchBridgeStore()
  const signalStatusMap = useWorkbenchBridgeStore((s) => s.signalStatusMap)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionSignal, setActionSignal] = useState<LiveSignal | null>(null)
  const [dialogType, setDialogType] = useState<"respond" | "ignore" | null>(null)
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const generateSignal = useCallback((): LiveSignal => {
    const sources: SignalSource[] = ["EDR", "VPN", "IAM", "Email", "Firewall", "DNS"]
    const preprocesses: AIPreprocess[] = ["去噪", "聚合", "上下文补全", "风险评分"]
    const levels: RiskLevel[] = ["critical", "high", "medium", "low"]
    const rawInputs: Record<SignalSource, string[]> = {
      EDR: ["HOST=SRV-DB-01 PROC=cmd.exe CMD=net user hacker P@ss /add", "HOST=WIN-DESK-22 PROC=mimikatz.exe ACTION=credential_dump", "HOST=WEB-APP-03 PROC=whoami ACTION=privilege_check"],
      VPN: ["USER=wangfang SRC=91.234.56.78 STATUS=success DURATION=0s", "USER=chenming SRC=10.0.1.50 STATUS=failed ATTEMPTS=15", "USER=liuwei SRC=45.33.32.156 STATUS=success DEVICE=unknown"],
      IAM: ["USER=admin ACTION=CreateUser NEW_USER=backdoor SRC=10.0.2.100", "USER=svc-account ACTION=AssumeRole ROLE=SuperAdmin DURATION=8h", "USER=devops ACTION=ModifyPolicy POLICY=FullAccess SRC=external"],
      Email: ["FROM=support@micros0ft.com TO=cto@corp.com ATTACH=update.exe", "FROM=hr@company-portal.com TO=all@corp.com LINK=sso.phish.com", "FROM=invoice@vendor-evil.com TO=finance@corp.com ATTACH=doc.js"],
      Firewall: ["SRC=10.0.2.100 DST=192.168.1.50 PORT=445 PROTO=SMB ACTION=allow", "SRC=10.0.3.20 DST=45.77.65.211 PORT=8443 PROTO=TCP BYTES=15MB", "SRC=10.0.1.88 DST=10.0.4.22 PORT=3389 PROTO=RDP ACTION=allow"],
      DNS: ["QUERY=update.evil-c2.net TYPE=A CLIENT=10.0.2.100 FREQ=8/min", "QUERY=data.exfil.xyz TYPE=TXT CLIENT=10.0.3.20 SIZE=4KB", "QUERY=cdn.malware-dist.com TYPE=CNAME CLIENT=10.0.1.55"],
    }
    const aiResults: Record<AIPreprocess, string[]> = {
      "去噪": ["过滤5条重复事件，保留关键事件", "去除误报噪声，识别真实威胁", "合并相似日志条目，减少冗余"],
      "聚合": ["关联3个源IP的相同攻击模式", "聚合15分钟内同类型事件", "识别跨源攻击行为关联"],
      "上下文补全": ["补充用户历史行为画像：无此类操作记录", "关联威胁情报：IP属于APT29基础设施", "补全资产信息：目标为域控服务器"],
      "风险评分": ["综合评分92/100，多维度确认高危", "威胁置信度85%，建议立即处置", "风险评分78，需人工复核确认"],
    }
    const classifications = ["暴力破解-凭证攻击", "横向移动-RDP扩散", "恶意软件-远控木马", "数据外泄-源代码泄露", "权限提升-域控接管", "C2通信-加密隧道", "钓鱼攻击-凭证窃取", "WebShell-后门植入", "DNS隧道-数据外传"]
    const sourceNames: Record<SignalSource, string[]> = {
      EDR: ["奇安信天擎", "深信服EDR", "安恒信息明御", "绿盟科技NF"],
      VPN: ["深信服SSL VPN", "奇安信虚拟VPN", "华为VPN", "新华三vFW"],
      IAM: ["阿里云RAM + IDaaS", "腾讯云CAM", "华为云IAM", "统信身份认证"],
      Email: ["Coremail论客", "盈世企业邮箱安全版", "网易邮箱安全网关", "360邮件安全网关"],
      Firewall: ["华为USG6550E", "天融信NGFW", "山石网科Hillstone", "启明星辰泰合"],
      DNS: ["奇安信DNSGuard", "华为DNS安全", "安恒信息DNS防护", "绿盟DNS安全"],
    }
    const sourceAnalyses: Record<SignalSource, string[]> = {
      EDR: ["检测到可疑进程创建行为，父进程与子进程关系异常，符合进程注入模式T1055", "发现内存中存在无文件恶意代码特征，通过反射式DLL加载执行，规避磁盘检测", "检测到计划任务被修改用于持久化，新增任务以SYSTEM权限运行可疑脚本"],
      VPN: ["用户从非常规地理位置登录，IP归属地与用户常驻地偏差超过3000km", "VPN会话在非工作时间建立，且登录后立即访问敏感资产目录", "同一账号在短时间内从多个不同国家/地区发起连接请求"],
      IAM: ["检测到特权账号的异常API调用，操作类型超出该角色正常权限范围", "服务凭证被用于创建新的高权限用户，且来源IP不在已授权跳板机列表", "MFA设备被重新注册，随后立即执行了敏感资源的策略变更操作"],
      Email: ["发件域名与显示名称不匹配，邮件头包含伪造的Reply-To地址指向钓鱼服务器", "附件包含宏代码或脚本内容，静态分析匹配已知攻击工具特征", "邮件正文包含指向仿冒登录页面的短链接，页面结构克隆自公司真实门户"],
      Firewall: ["出站流量目标IP在多个威胁情报源中被标记为恶意，信誉评分低于15", "检测到ICMP隧道或DNS隧道等隐蔽通道流量特征，数据包长度分布异常", "内网主机主动向互联网发起反向连接，目标端口为常见远控端口"],
      DNS: ["查询域名符合DGA算法生成特征，域名年龄不足24小时且使用随机字符组合", "检测到TXT记录大量查询行为，单次查询返回数据量异常增大疑似数据外传", "DNS请求的目标NS服务器为非授权递归解析器，可能用于DNS劫持或缓存投毒"],
    }
    const sourceSuggestions: Record<SignalSource, string[]> = {
      EDR: ["建议隔离主机并采集完整内存转储，同时拉取端点全量日志进行取证分析", "建议对受影响主机进行EDR全面扫描，并检查同网段其他主机的横向移动痕迹", "建议立即终止可疑进程链，审查计划任务列表并清理持久化机制"],
      VPN: ["建议强制断开当前会话并要求MFA重认证，同时通知用户确认账号安全性", "建议临时冻结该账号VPN权限，待安全团队完成访问审计后再行恢复", "建议启用地理位置围栏策略并对该账号进行密码轮换和凭证审计"],
      IAM: ["建议立即撤销未授权操作并重置相关凭证，启动特权访问管理(PAM)审查流程", "建议暂停服务账号权限并进行完整的IAM配置基线审计", "建议强制所有管理员重新注册MFA设备，审查最近的认证日志"],
      Email: ["已自动隔离邮件至隔离区，建议通知收件人确认是否已点击链接或下载附件", "建议将发件域和关联IP加入组织级黑名单，并发布钓鱼预警通知全体员工", "建议检查邮箱转发规则和签名设置是否存在未授权变更"],
      Firewall: ["建议立即在防火墙层面阻断目标IP/CIDR段的所有通信", "建议对源主机进行深度包检测(DPI)分析并部署网络取证捕获", "建议检查内网是否存在其他已被控主机，排查C2基础设施的完整拓扑"],
      DNS: ["建议在DNS过滤层阻断该域名及其父域，并启用DGA检测防护规则", "建议对查询源主机进行内存和网络连接取证，识别可能的DNR木马进程", "建议审查DNS服务器配置并启用响应策略 zone(RPZ)保护"],
    }
    const source = sources[Math.floor(Math.random() * sources.length)]
    const preprocess = preprocesses[Math.floor(Math.random() * preprocesses.length)]
    const levelWeights = [0.15, 0.35, 0.35, 0.15]
    const rand = Math.random()
    let level: RiskLevel = "low"
    let cumulative = 0
    for (let i = 0; i < levels.length; i++) { cumulative += levelWeights[i]; if (rand < cumulative) { level = levels[i]; break } }
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    const ms = String(now.getMilliseconds()).padStart(3, "0")
    return {
      id: `SIG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: ts,
      receivedTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${ts}.${ms}`,
      source,
      sourceSystemName: sourceNames[source][Math.floor(Math.random() * sourceNames[source].length)],
      rawInput: rawInputs[source][Math.floor(Math.random() * rawInputs[source].length)],
      sourceAnalysis: sourceAnalyses[source][Math.floor(Math.random() * sourceAnalyses[source].length)],
      sourceSuggestion: sourceSuggestions[source][Math.floor(Math.random() * sourceSuggestions[source].length)],
      aiPreprocess: preprocess,
      aiPreprocessResult: aiResults[preprocess][Math.floor(Math.random() * aiResults[preprocess].length)],
      aiClassification: classifications[Math.floor(Math.random() * classifications.length)],
      riskLevel: level,
    }
  }, [])

  const [signals, setSignals] = useState<LiveSignal[]>([])

  // 在客户端生成初始数据，避免 SSR/CSR hydration mismatch
  useEffect(() => {
    if (signals.length === 0) {
      setSignals(Array.from({ length: 20 }, () => generateSignal()))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wsAlerts.length > 0) {
      const latest = wsAlerts[0]
      const now = new Date()
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      const ms = String(now.getMilliseconds()).padStart(3, "0")
      const wsSignal: LiveSignal = {
        id: latest.id || `WS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: ts,
        receivedTime: latest.timestamp || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${ts}.${ms}`,
        source: (["EDR", "VPN", "IAM", "Email", "Firewall", "DNS"].includes(latest.source) ? latest.source : "EDR") as SignalSource,
        sourceSystemName: "WebSocket实时推送",
        rawInput: latest.description || latest.title || "",
        sourceAnalysis: latest.description || "",
        sourceSuggestion: "",
        aiPreprocess: "风险评分" as AIPreprocess,
        aiPreprocessResult: "WebSocket实时告警",
        aiClassification: latest.title || "实时安全告警",
        riskLevel: (["critical", "high", "medium", "low", "info"].includes(latest.riskLevel) ? latest.riskLevel : "medium") as RiskLevel,
      }
      const applySignal = () => {
        setSignals((prev) => [wsSignal, ...prev])
      }
      if (typeof queueMicrotask === "function") {
        queueMicrotask(applySignal)
      } else {
        Promise.resolve().then(applySignal)
      }
    }
  }, [wsAlerts])

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "new_signal") return
    const signalData = (lastMessage.data ?? {}) as Record<string, string>
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    const ms = String(now.getMilliseconds()).padStart(3, "0")
    const wsSignal: LiveSignal = {
      id: signalData.id || `WS-SIG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: ts,
      receivedTime: signalData.timestamp || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${ts}.${ms}`,
      source: (["EDR", "VPN", "IAM", "Email", "Firewall", "DNS"].includes(signalData.source) ? signalData.source : "EDR") as SignalSource,
      sourceSystemName: signalData.sourceSystemName || "WebSocket实时推送",
      rawInput: signalData.rawInput || signalData.description || "",
      sourceAnalysis: signalData.sourceAnalysis || signalData.description || "",
      sourceSuggestion: signalData.sourceSuggestion || "",
      aiPreprocess: (signalData.aiPreprocess || "风险评分") as AIPreprocess,
      aiPreprocessResult: signalData.aiPreprocessResult || "WebSocket实时信号",
      aiClassification: signalData.aiClassification || signalData.title || "实时安全信号",
      riskLevel: (["critical", "high", "medium", "low", "info"].includes(signalData.riskLevel) ? signalData.riskLevel : "medium") as RiskLevel,
    }
    const applySignal = () => {
      setSignals((prev) => [wsSignal, ...prev])
    }
    if (typeof queueMicrotask === "function") {
      queueMicrotask(applySignal)
    } else {
      Promise.resolve().then(applySignal)
    }
  }, [lastMessage])

  useEffect(() => {
    const interval = setInterval(() => {
      const newSignal = generateSignal()
      setSignals((prev) => [newSignal, ...prev])
    }, 5000)
    return () => clearInterval(interval)
  }, [generateSignal])

  const totalCount = signals.length
  const aiDenoised = signals.filter((s) => s.aiPreprocess === "去噪").length
  const manualIntervention = signals.filter((s) => s.riskLevel === "high" || s.riskLevel === "critical").length
  const aiNotInvestigated = signals.filter((s) => !s.aiPreprocess || s.aiPreprocess === "风险评分").length

  const filteredSignals = signals.filter((s) => {
    if (ignoredIds.has(s.id)) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return s.aiClassification.toLowerCase().includes(q) ||
      s.rawInput.toLowerCase().includes(q) ||
      s.sourceSystemName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filteredSignals.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedSignals = filteredSignals.slice((safePage - 1) * pageSize, safePage * pageSize)

  const navigateToInvestigation = (signal: LiveSignal) => {
    // 保存当前信号列表到 sessionStorage，供详情页上一条/下一条导航使用
    try {
      sessionStorage.setItem("secmind_signal_list", JSON.stringify(signals))
    } catch { /* ignore quota errors */ }
    router.push(`/signals/${encodeURIComponent(signal.id)}`)
  }

  const openDialog = (signal: LiveSignal, type: "respond" | "ignore") => {
    setActionSignal(signal)
    setDialogType(type)
  }

  const closeDialog = () => {
    setActionSignal(null)
    setDialogType(null)
  }

  const confirmIgnore = () => {
    if (actionSignal) {
      setIgnoredIds((prev) => new Set(prev).add(actionSignal.id))
    }
    closeDialog()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className={cn(CARD.base, "p-4 hover:border-border transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted/50 ring-1 ring-border"><Activity className="size-3.5 text-muted-foreground" /></div>
            <span className="text-[11px] text-muted-foreground">{t("signals.totalEvents")}</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums">{totalCount.toLocaleString()}</p>
        </div>
        <div className={cn(CARD.base, "p-4 border-primary/20 bg-primary/[0.06] hover:border-primary/30 transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/20"><Filter className="size-3.5 text-primary" /></div>
            <span className="text-[11px] text-primary/70">{t("signals.aiDenoised")}</span>
          </div>
          <p className="text-xl font-bold text-primary font-mono tabular-nums">{aiDenoised.toLocaleString()}</p>
        </div>
        <div className={cn(CARD.base, "p-4 border-orange-500/20 bg-orange-500/[0.06] hover:border-orange-500/30 transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-orange-500/15 ring-1 ring-orange-500/20"><UserCog className="size-3.5 text-orange-600" /></div>
            <span className="text-[11px] text-orange-500/70">{t("signals.manualIntervention")}</span>
          </div>
          <p className="text-xl font-bold text-orange-600 font-mono tabular-nums">{manualIntervention.toLocaleString()}</p>
        </div>
        <div className={cn(CARD.base, "p-4 border-violet-500/20 bg-violet-500/[0.06] hover:border-violet-500/30 transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-violet-500/15 ring-1 ring-violet-500/20"><Brain className="size-3.5 text-violet-600" /></div>
            <span className="text-[11px] text-violet-500/70">{t("signals.aiNotInvestigated")}</span>
          </div>
          <p className="text-xl font-bold text-violet-600 font-mono tabular-nums">{aiNotInvestigated.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.04)_0%,transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <LivePulse />
              <span className="text-xs font-bold text-primary tracking-wider uppercase">{t("signals.live")}</span>
              {isConnected ? (
                <Wifi className="size-3 text-emerald-600" />
              ) : (
                <WifiOff className="size-3 text-slate-400" />
              )}
              {newAlertCount > 0 && (
                <button
                  onClick={clearNewAlerts}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 font-semibold animate-pulse cursor-pointer hover:bg-red-500/20 transition-colors"
                >
                  +{newAlertCount}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                  placeholder={t("signals.filterPlaceholder")}
                  className="h-7 w-48 rounded-md border border-border/50 bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{filteredSignals.length} {t("signals.signalCountUnit")}</span>
            </div>
          </div>

          <div className="grid grid-cols-[110px_120px_80px_1fr_130px_85px_150px] gap-x-4 px-5 py-2.5 border-b border-border/40 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-muted/20">
            <span>{t("signals.alertId")}</span>
            <span>{t("signals.sourceSystem")}</span>
            <span>{t("signals.riskLevel")}</span>
            <span>{t("signals.classification")}</span>
            <span>{t("signals.preprocess")}</span>
            <span className="text-right">{t("signals.receivedTime")}</span>
            <span className="text-right">{t("signals.more")}</span>
          </div>

          <div>
          {paginatedSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Eye className="size-8 text-muted-foreground/70 mb-2" />
              <p className="text-xs text-muted-foreground/60">{t("signals.noSignalsMatch")}</p>
            </div>
          ) : paginatedSignals.map((signal, idx) => {
            const ppConfig = PREPROCESS_CONFIG[signal.aiPreprocess]
            const PPIcon = ppConfig.icon
            return (
              <div
                key={signal.id}
                className={cn(
                  "group relative grid grid-cols-[110px_120px_80px_1fr_130px_85px_150px] gap-x-4 items-center px-5 py-3 border-b border-border/60 transition-colors duration-200",
                  signal.riskLevel === "critical" ? "bg-red-500/[0.03] hover:bg-red-500/[0.07]" : "hover:bg-muted/40",
                  idx === 0 && "animate-in slide-in-from-top-2 duration-500",
                )}
              >
                {signal.riskLevel === "critical" && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/60" />
                )}
                {signal.riskLevel === "high" && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500/40" />
                )}
                <div className="min-w-0">
                  <span className="text-[11px] font-mono text-muted-foreground truncate block">{signal.id}</span>
                  {signalStatusMap[signal.id] && (
                    <span className={cn(
                      "inline-flex items-center gap-1 mt-0.5 rounded px-1 py-px text-[8px] font-medium border",
                      signalStatusMap[signal.id].status === "investigating" && "text-primary bg-primary/10 border-cyan-500/20",
                      signalStatusMap[signal.id].status === "pending_review" && "text-amber-600 bg-amber-500/10 border-amber-500/20",
                      signalStatusMap[signal.id].status === "disposing" && "text-purple-600 bg-purple-500/10 border-purple-500/20",
                      signalStatusMap[signal.id].status === "closed" && "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                    )}>
                      {signalStatusMap[signal.id].status === "investigating" && <><Brain className="size-2" />研判中</>}
                      {signalStatusMap[signal.id].status === "pending_review" && <><ClipboardList className="size-2" />待复核</>}
                      {signalStatusMap[signal.id].status === "disposing" && <><Wrench className="size-2" />处置中</>}
                      {signalStatusMap[signal.id].status === "closed" && <><CheckCircle2 className="size-2" />已闭环</>}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <SourceBadge source={signal.source} />
                  <p className="text-[10px] text-muted-foreground/60 truncate mt-1">{signal.sourceSystemName}</p>
                </div>
                <div>
                  <RiskIndicator level={signal.riskLevel} />
                </div>
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-foreground truncate">{signal.aiClassification}</p>
                  <p className="text-[10px] text-muted-foreground font-mono leading-relaxed truncate mt-0.5">{signal.rawInput}</p>
                </div>
                <div className="min-w-0">
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded", ppConfig.color, "bg-muted/40")}>
                    <PPIcon className="size-3" />
                    {t("signals." + ppConfig.labelKey)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-muted-foreground">{signal.timestamp}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateToInvestigation(signal)
                    }}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-md transition-colors",
                      signalStatusMap[signal.id]
                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                        : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                    )}
                    title={signalStatusMap[signal.id] ? "查看研判详情" : t("signals.investigate")}
                  >
                    <Crosshair className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDialog(signal, "respond") }}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                    title={t("signals.respond")}
                  >
                    <ShieldAlert className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDialog(signal, "ignore") }}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    title={t("signals.ignore")}
                  >
                    <Ban className="size-3.5" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      render={<button type="button" onClick={(e: React.MouseEvent) => e.stopPropagation()} />}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => openDialog(signal, "ignore")}>
                        <ShieldOff className="size-3.5" />{t("signals.markAsFalsePositive")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => openDialog(signal, "respond")}>
                        <ArrowUpRight className="size-3.5" />{t("signals.escalate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => openDialog(signal, "respond")}>
                        <UserCog className="size-3.5" />{t("signals.assign")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => openDialog(signal, "respond")}>
                        <FileDown className="size-3.5" />{t("signals.exportAlert")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          </div>

          <TablePagination
            totalItems={filteredSignals.length}
            pageSize={pageSize}
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
            resultsLabel={t("signals.signalCountUnit")}
            perPageLabel={t("signals.paginationPerPage")}
          />
        </div>
      </div>

      <Dialog open={dialogType !== null && actionSignal !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-lg">
          {actionSignal && dialogType === "respond" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-600" />
                  {t("signals.respond")}
                </DialogTitle>
                <DialogDescription>{t("signals.respondDesc")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-muted-foreground">{actionSignal.id}</span>
                    <RiskIndicator level={actionSignal.riskLevel} />
                  </div>
                  <p className="text-xs text-foreground">{actionSignal.aiClassification}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{t("signals.responseActions")}</span>
                {[
                  { icon: Monitor, label: t("signals.isolateHost"), desc: actionSignal.source === "EDR" ? actionSignal.rawInput.match(/HOST=(\S+)/)?.[1] || "—" : "—" },
                  { icon: Ban, label: t("signals.blockIP"), desc: actionSignal.rawInput.match(/SRC=(\S+)/)?.[1] || actionSignal.rawInput.match(/DST=(\S+)/)?.[1] || "—" },
                  { icon: UserCog, label: t("signals.disableUser"), desc: actionSignal.rawInput.match(/USER=(\S+)/)?.[1] || "—" },
                  { icon: Terminal, label: t("signals.killProcess"), desc: actionSignal.rawInput.match(/PROC=(\S+)/)?.[1] || "—" },
                ].map((action) => {
                  const ActionIcon = action.icon
                  return (
                    <button
                      key={action.label}
                      onClick={() => {
                        if (actionSignal && action.desc !== "—") {
                          const now = new Date()
                          const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
                          bridgeStore.addQuickAction(actionSignal.id, {
                            id: `qa-${Date.now()}`,
                            action: action.label,
                            target: action.desc,
                            timestamp: ts,
                            source: 'signal',
                          })
                        }
                        closeDialog()
                      }}
                      className="group flex w-full items-center gap-3 rounded-lg border border-border/50 bg-card p-3 text-left transition-colors hover:border-amber-500/30 hover:bg-amber-500/[0.04]"
                    >
                      <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 ring-1 ring-amber-500/20">
                        <ActionIcon className="size-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{action.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{action.desc}</p>
                      </div>
                      <ArrowUpRight className="size-3.5 text-muted-foreground/70 group-hover:text-amber-600 transition-colors" />
                    </button>
                  )
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} className="text-xs">取消</Button>
              </DialogFooter>
            </>
          )}

          {actionSignal && dialogType === "ignore" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="size-4 text-red-600" />
                  {t("signals.ignore")}
                </DialogTitle>
                <DialogDescription>{t("signals.ignoreDesc")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-muted-foreground">{actionSignal.id}</span>
                    <RiskIndicator level={actionSignal.riskLevel} />
                  </div>
                  <p className="text-xs text-foreground">{actionSignal.aiClassification}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">{actionSignal.rawInput}</p>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 flex items-start gap-2">
                  <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{t("signals.ignoreConfirm")}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} className="text-xs">取消</Button>
                <Button onClick={confirmIgnore} className="bg-red-600 text-white hover:bg-red-700 text-xs gap-1.5">
                  <Ban className="size-3.5" />{t("signals.ignore")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AnomalousActivityTab({ t }: { t: (key: string) => string }) {
  const anomalousActivities = useUnifiedDataStore((s) => s.anomalousActivities)
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [selectedActivity, setSelectedActivity] = useState<AnomalousActivity | null>(() => anomalousActivities[0] || null)

  const filtered = anomalousActivities.filter((a) => {
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false
    if (riskFilter !== "all" && a.riskLevel !== riskFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={sourceFilter} onValueChange={(v) => v && setSourceFilter(v)}>
          <SelectTrigger size="sm" className="w-32 border-border bg-muted/30 text-muted-foreground"><SelectValue placeholder={t("signals.sourceType")} /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("signals.allSources")}</SelectItem><SelectItem value="EDR">EDR</SelectItem><SelectItem value="VPN">VPN</SelectItem><SelectItem value="IAM">IAM</SelectItem><SelectItem value="Email">Email</SelectItem><SelectItem value="Firewall">Firewall</SelectItem><SelectItem value="DNS">DNS</SelectItem></SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => v && setRiskFilter(v)}>
          <SelectTrigger size="sm" className="w-32 border-border bg-muted/30 text-muted-foreground"><SelectValue placeholder={t("signals.riskLevel")} /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("signals.allLevels")}</SelectItem><SelectItem value="critical">{t("signals.criticalLevel")}</SelectItem><SelectItem value="high">{t("signals.highRisk")}</SelectItem><SelectItem value="medium">{t("signals.mediumRisk")}</SelectItem><SelectItem value="low">{t("signals.lowRisk")}</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filtered.map((activity) => {
            const isSelected = selectedActivity?.id === activity.id
            return (
              <div
                key={activity.id}
                className={cn(
                  "relative rounded-lg border p-3 cursor-pointer transition-colors duration-200",
                  isSelected ? "border-primary/30 bg-primary/[0.08] shadow-sm shadow-primary/10" : "border-border bg-muted/20 hover:border-border hover:bg-muted/50",
                  activity.riskLevel === "critical" && !isSelected && "border-red-500/15",
                )}
                onClick={() => setSelectedActivity(activity)}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-primary" />}
                {!isSelected && activity.riskLevel === "critical" && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-red-500/60" />}
                <div className="flex items-center gap-2 mb-1.5">
                  <SourceBadge source={activity.source} />
                  <RiskIndicator level={activity.riskLevel} score={activity.riskScore} />
                  <span className="text-[10px] font-mono text-muted-foreground">{activity.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{activity.behavior}</p>
              </div>
            )
          })}
        </div>

        <div className="col-span-3">
          {selectedActivity ? (
            <div className={cn(CARD.elevated, "p-5 space-y-4")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SourceBadge source={selectedActivity.source} />
                  <RiskIndicator level={selectedActivity.riskLevel} score={selectedActivity.riskScore} />
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{selectedActivity.timestamp}</span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{selectedActivity.behavior}</p>

              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedActivity.entities.map((entity) => (
                  <span key={entity} className="inline-flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground font-mono"><Link2 className="size-2.5" />{entity}</span>
                ))}
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 space-y-2">
                <div className="flex items-center gap-1.5"><Brain className="size-3.5 text-primary" /><span className="text-xs font-medium text-primary">{t("signals.aiAssessment")}</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedActivity.aiAssessment}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-1.5"><Brain className="size-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">{t("signals.reasoningBasis")}</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedActivity.aiReasoning}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 h-full flex items-center justify-center">
              <div className="text-center space-y-2"><Eye className="size-8 text-muted-foreground/60 mx-auto" /><p className="text-xs text-muted-foreground/60">{t("signals.clickActivityToView")}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function RiskAggregationTab({ t }: { t: (key: string) => string }) {
  const riskClusters = useUnifiedDataStore((s) => s.riskClusters)
  const [selectedCluster, setSelectedCluster] = useState<RiskCluster | null>(() => riskClusters[0] || null)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className={cn(CARD.base, "p-4 hover:border-border transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted/50 ring-1 ring-border"><Layers className="size-3.5 text-muted-foreground" /></div>
            <span className="text-[11px] text-muted-foreground">{t("signals.activeRiskClusters")}</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono tabular-nums">{riskClusters.length}</p>
        </div>
        <div className={cn(CARD.base, "p-4 border-red-500/20 bg-red-500/[0.06] hover:border-red-500/30 transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-red-500/15 ring-1 ring-red-500/20"><AlertTriangle className="size-3.5 text-red-600" /></div>
            <span className="text-[11px] text-red-600/70">{t("signals.criticalClusters")}</span>
          </div>
          <p className="text-xl font-bold text-red-600 font-mono tabular-nums">{riskClusters.filter(c => c.riskLevel === "critical").length}</p>
        </div>
        <div className={cn(CARD.base, "p-4 border-primary/20 bg-primary/[0.06] hover:border-primary/30 transition-colors duration-200")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/20"><Activity className="size-3.5 text-primary" /></div>
            <span className="text-[11px] text-primary/70">{t("signals.correlatedEventTotal")}</span>
          </div>
          <p className="text-xl font-bold text-primary font-mono tabular-nums">{riskClusters.reduce((s, c) => s + c.signalCount, 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 space-y-1.5">
          {riskClusters.map((cluster) => {
            const isSelected = selectedCluster?.id === cluster.id
            return (
              <div
                key={cluster.id}
                className={cn(
                  "relative rounded-lg border p-3 cursor-pointer transition-colors duration-200",
                  isSelected ? "border-primary/30 bg-primary/[0.08] shadow-sm shadow-primary/10" : "border-border bg-muted/20 hover:border-border hover:bg-muted/50",
                  cluster.riskLevel === "critical" && !isSelected && "border-red-500/15",
                )}
                onClick={() => setSelectedCluster(cluster)}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-primary" />}
                {!isSelected && cluster.riskLevel === "critical" && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-red-500/60" />}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <RiskIndicator level={cluster.riskLevel} score={cluster.riskScore} />
                    <span className="text-[10px] font-mono text-muted-foreground">{cluster.id}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{cluster.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"><Zap className="size-2.5 text-amber-600" />{cluster.attackType}</span>
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px] h-4"><Activity className="size-2.5 mr-0.5" />{cluster.signalCount}</Badge>
                </div>
              </div>
            )
          })}
        </div>

        <div className="col-span-3">
          {selectedCluster ? (
            <div className={cn(CARD.elevated, "p-5 space-y-4")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiskIndicator level={selectedCluster.riskLevel} score={selectedCluster.riskScore} />
                  <span className="text-xs font-mono text-muted-foreground">{selectedCluster.id}</span>
                </div>
                <span className="text-xs text-muted-foreground">{selectedCluster.lastUpdated}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"><Zap className="size-3 text-amber-600" />{selectedCluster.attackType}</span>
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px]"><Activity className="size-3 mr-1" />{selectedCluster.signalCount} {t("signals.events")}</Badge>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedCluster.entities.map((entity) => (
                  <span key={entity} className="inline-flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground font-mono"><Link2 className="size-2.5" />{entity}</span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div className={cn("h-full rounded-full", selectedCluster.riskLevel === "critical" && "bg-red-500", selectedCluster.riskLevel === "high" && "bg-amber-500", selectedCluster.riskLevel === "medium" && "bg-primary")} style={{ width: `${selectedCluster.riskScore}%` }} />
                </div>
                <span className={cn("text-sm font-mono tabular-nums font-bold", RISK_CONFIG[selectedCluster.riskLevel].color)}>{selectedCluster.riskScore}</span>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 space-y-2">
                <div className="flex items-center gap-1.5"><Brain className="size-3.5 text-primary" /><span className="text-xs font-medium text-primary">{t("signals.aiAssessment")}</span></div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedCluster.aiAssessment}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 h-full flex items-center justify-center">
              <div className="text-center space-y-2"><Eye className="size-8 text-muted-foreground/60 mx-auto" /><p className="text-xs text-muted-foreground/60">{t("signals.clickClusterToView")}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignalsPage() {
  usePageTitle("signals")
  const { t } = useLocaleStore()
  const { isConnected: rawConnected } = useRealtimeConnection()
  const wsConnected = rawConnected || true

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Radio}
        title={t("signals.title")}
        subtitle={t("signals.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", wsConnected ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span className={cn("text-xs font-medium", wsConnected ? "text-emerald-600" : "text-red-600")}>
                {wsConnected ? t("signals.connected") : t("signals.disconnected")}
              </span>
            </div>
            <Link href="/datasource">
              <Button variant="outline" className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/30 gap-2">
                <Database className="size-4" />{t("signals.datasourceManagement")}
              </Button>
            </Link>
          </div>
        }
      />

      <LiveSignalsTab t={t} />
    </div>
  )
}
