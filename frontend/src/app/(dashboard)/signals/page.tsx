"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  Radio,
  Shield,
  Wifi,
  Mail,
  Globe,
  Lock,
  Brain,
  Zap,
  Filter,
  ChevronRight,
  Link2,
  Monitor,
  Layers,
  BarChart3,
  Crosshair,
  Database,
  Eye,
  Clock,
  Tag,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RISK_CONFIG, type RiskLevel } from "@/lib/risk-config"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useLocaleStore } from "@/store/locale-store"

type SignalSource = "EDR" | "VPN" | "IAM" | "Email" | "Firewall" | "DNS"
type AIPreprocess = "去噪" | "聚合" | "上下文补全" | "风险评分"

interface LiveSignal {
  id: string
  timestamp: string
  source: SignalSource
  rawInput: string
  aiPreprocess: AIPreprocess
  aiPreprocessResult: string
  aiClassification: string
  riskLevel: RiskLevel
}

interface AnomalousActivity {
  id: string
  behavior: string
  riskScore: number
  riskLevel: RiskLevel
  source: SignalSource
  entities: string[]
  aiAssessment: string
  aiReasoning: string
  timestamp: string
}

interface RiskCluster {
  id: string
  signalCount: number
  riskScore: number
  riskLevel: RiskLevel
  entities: string[]
  aiAssessment: string
  attackType: string
  lastUpdated: string
}

const SOURCE_CONFIG: Record<SignalSource, { icon: typeof Activity; color: string; bg: string }> = {
  EDR: { icon: Monitor, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  VPN: { icon: Wifi, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  IAM: { icon: Lock, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  Email: { icon: Mail, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  Firewall: { icon: Shield, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  DNS: { icon: Globe, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
}

const PREPROCESS_CONFIG: Record<AIPreprocess, { color: string; icon: typeof Brain }> = {
  "去噪": { color: "text-cyan-400", icon: Filter },
  "聚合": { color: "text-amber-400", icon: Layers },
  "上下文补全": { color: "text-purple-400", icon: Brain },
  "风险评分": { color: "text-[#ff4d4f]", icon: BarChart3 },
}

const initialSignals: LiveSignal[] = [
  { id: "SIG-001", timestamp: "14:35:22", source: "EDR", rawInput: "HOST=WIN-DESK-15 PROC=powershell.exe CMD=-enc Base64String ACTION=execute", aiPreprocess: "去噪", aiPreprocessResult: "过滤3条重复日志，识别编码执行行为", aiClassification: "可疑PowerShell编码执行", riskLevel: "high" },
  { id: "SIG-002", timestamp: "14:35:18", source: "VPN", rawInput: "USER=zhangwei SRC=103.45.67.89 DST=VPN-GW-01 STATUS=success DURATION=0s", aiPreprocess: "上下文补全", aiPreprocessResult: "补充用户画像：常驻上海，首次境外IP登录", aiClassification: "不可能旅行-凭证疑似窃取", riskLevel: "critical" },
  { id: "SIG-003", timestamp: "14:35:15", source: "Email", rawInput: "FROM=shipping@dhl-phish.com TO=cfo@corp.com ATTACH=invoice.exe SCORE=93", aiPreprocess: "风险评分", aiPreprocessResult: "钓鱼评分93/100，附件为已知恶意家族", aiClassification: "定向钓鱼攻击-凭证窃取", riskLevel: "critical" },
  { id: "SIG-004", timestamp: "14:35:10", source: "Firewall", rawInput: "SRC=10.0.2.100 DST=185.220.101.34 PORT=443 PROTO=TCP BYTES=2.3MB", aiPreprocess: "聚合", aiPreprocessResult: "关联同一目标IP的5次连接，识别C2心跳", aiClassification: "C2通信-数据暂存", riskLevel: "high" },
  { id: "SIG-005", timestamp: "14:35:05", source: "IAM", rawInput: "USER=app-service ACTION=AddUserToGroup GROUP=Administrators SRC=10.0.2.50", aiPreprocess: "上下文补全", aiPreprocessResult: "服务账号异常提权，历史无管理员组操作", aiClassification: "权限提升-云资源接管", riskLevel: "high" },
  { id: "SIG-006", timestamp: "14:35:01", source: "DNS", rawInput: "QUERY=cmd6.malware-c2.xyz TYPE=TXT CLIENT=10.0.2.100 FREQ=12/min", aiPreprocess: "聚合", aiPreprocessResult: "DNS TXT高频查询，关联已知DGA域名特征", aiClassification: "DNS隧道-C2通信", riskLevel: "critical" },
  { id: "SIG-007", timestamp: "14:34:55", source: "EDR", rawInput: "HOST=WEB-SVR PATH=/uploads/cmd.php TYPE=WebShell SIG=ChinaChopper", aiPreprocess: "风险评分", aiPreprocessResult: "WebShell特征匹配99%，中国菜刀工具", aiClassification: "WebShell植入-后门", riskLevel: "critical" },
  { id: "SIG-008", timestamp: "14:34:50", source: "Firewall", rawInput: "SRC=10.0.2.88 DST=cloud.baidu.com SIZE=500MB TYPE=source_code", aiPreprocess: "上下文补全", aiPreprocessResult: "DLP策略触发，源代码外传至个人云盘", aiClassification: "数据外泄-源代码泄露", riskLevel: "high" },
  { id: "SIG-009", timestamp: "14:34:45", source: "VPN", rawInput: "USER=linfeng SESSIONS=3 DEVICES=Beijing,Shanghai,Shenzhen", aiPreprocess: "去噪", aiPreprocessResult: "过滤正常多设备登录，标记异常同时在线", aiClassification: "多设备异常在线", riskLevel: "medium" },
  { id: "SIG-010", timestamp: "14:34:40", source: "Email", rawInput: "FROM=it-support@corp-evil.com TO=all-staff@corp.com LINK=portal.phish.com", aiPreprocess: "风险评分", aiPreprocessResult: "仿冒IT支持域名，链接指向钓鱼页面", aiClassification: "广撒网钓鱼-凭证收集", riskLevel: "high" },
]

const anomalousActivities: AnomalousActivity[] = [
  { id: "ANO-001", behavior: "用户zhangwei从俄罗斯IP登录VPN，与上次北京登录间隔仅2小时", riskScore: 94, riskLevel: "critical", source: "VPN", entities: ["zhangwei", "103.45.67.89", "VPN-GW-01"], aiAssessment: "不可能旅行检测触发，凭证极可能已被窃取", aiReasoning: "登录IP归属俄罗斯已知代理服务商，用户30天内无境外行为，ASN信誉评分12/100", timestamp: "14:35:18" },
  { id: "ANO-002", behavior: "内网主机10.0.2.100向185.220.101.34发起加密通信，流量模式匹配C2心跳", riskScore: 91, riskLevel: "critical", source: "Firewall", entities: ["10.0.2.100", "185.220.101.34"], aiAssessment: "C2通信确认，主机已被植入远控木马", aiReasoning: "目标IP在Tor出口节点列表中，通信间隔固定60秒，流量特征匹配Cobalt Strike", timestamp: "14:35:10" },
  { id: "ANO-003", behavior: "CFO收到伪装DHL投递通知的钓鱼邮件，附件为可执行文件", riskScore: 88, riskLevel: "critical", source: "Email", entities: ["cfo@corp.com", "shipping@dhl-phish.com"], aiAssessment: "定向钓鱼攻击，针对高价值目标", aiReasoning: "发件域名注册仅3天，附件哈希匹配已知Agent Tesla木马，收件人为CFO", timestamp: "14:35:15" },
  { id: "ANO-004", behavior: "服务账号app-service被添加至Administrators组，操作来源10.0.2.50", riskScore: 82, riskLevel: "high", source: "IAM", entities: ["app-service", "10.0.2.50", "AWS-IAM"], aiAssessment: "权限提升攻击，攻击者获取云资源控制权", aiReasoning: "服务账号历史无管理员组操作，操作时间非维护窗口，关联K8s RBAC异常", timestamp: "14:35:05" },
  { id: "ANO-005", behavior: "WEB-SVR上传目录发现ChinaChopper WebShell", riskScore: 97, riskLevel: "critical", source: "EDR", entities: ["WEB-SVR", "10.0.2.100"], aiAssessment: "Web后门植入，攻击者已获取Web服务器控制权", aiReasoning: "文件路径在uploads目录，WebShell签名精确匹配，关联同一攻击源IP", timestamp: "14:34:55" },
  { id: "ANO-006", behavior: "DNS TXT记录高频查询cmd6.malware-c2.xyz，频率12次/分钟", riskScore: 86, riskLevel: "high", source: "DNS", entities: ["10.0.2.100", "cmd6.malware-c2.xyz"], aiAssessment: "DNS隧道通信，用于C2数据外传", aiReasoning: "域名符合DGA生成算法特征，TXT查询频率异常，关联C2主机同一来源", timestamp: "14:35:01" },
  { id: "ANO-007", behavior: "用户linfeng同时从3个不同城市设备在线", riskScore: 52, riskLevel: "medium", source: "VPN", entities: ["linfeng", "Beijing", "Shanghai", "Shenzhen"], aiAssessment: "多设备异常在线，可能为凭证共享或窃取", aiReasoning: "3个城市同时在线不符合物理移动规律，但用户为销售岗位出差频繁", timestamp: "14:34:45" },
  { id: "ANO-008", behavior: "10.0.2.88向cloud.baidu.com传输500MB源代码", riskScore: 78, riskLevel: "high", source: "Firewall", entities: ["10.0.2.88", "linfeng", "cloud.baidu.com"], aiAssessment: "DLP策略违规，源代码外泄至个人云盘", aiReasoning: "传输内容匹配源代码特征，目标为个人云存储，用户linfeng近期有离职意向", timestamp: "14:34:50" },
]

const riskClusters: RiskCluster[] = [
  { id: "CLUSTER-001", signalCount: 12, riskScore: 96, riskLevel: "critical", entities: ["10.0.2.100", "185.220.101.34", "zhangwei", "WEB-SVR"], aiAssessment: "APT攻击链：初始钓鱼→凭证窃取→横向移动→C2建立→数据暂存，攻击者已在内网建立据点", attackType: "APT攻击链", lastUpdated: "2分钟前" },
  { id: "CLUSTER-002", signalCount: 8, riskScore: 88, riskLevel: "critical", entities: ["cfo@corp.com", "shipping@dhl-phish.com", "app-service"], aiAssessment: "定向钓鱼→凭证窃取→云资源接管，针对CFO的精准攻击与云权限提升关联", attackType: "定向钓鱼+云攻击", lastUpdated: "5分钟前" },
  { id: "CLUSTER-003", signalCount: 6, riskScore: 82, riskLevel: "high", entities: ["10.0.2.88", "linfeng", "cloud.baidu.com"], aiAssessment: "内部威胁：离职员工利用合法权限外传源代码，DLP策略违规", attackType: "内部威胁-数据外泄", lastUpdated: "8分钟前" },
  { id: "CLUSTER-004", signalCount: 4, riskScore: 65, riskLevel: "medium", entities: ["linfeng", "Beijing", "Shanghai", "Shenzhen"], aiAssessment: "多设备异常在线，可能为凭证共享，销售岗位出差频繁降低置信度", attackType: "凭证异常", lastUpdated: "12分钟前" },
  { id: "CLUSTER-005", signalCount: 3, riskScore: 58, riskLevel: "medium", entities: ["WIN-DESK-15", "10.0.3.70"], aiAssessment: "PowerShell编码执行，可能为合法运维脚本，需进一步确认", attackType: "可疑执行", lastUpdated: "15分钟前" },
]

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
      {score !== undefined && <span className="font-mono font-bold">{score}</span>}
      <span>{config.label}</span>
    </span>
  )
}

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
    </span>
  )
}

function LiveSignalsTab({ t }: { t: (key: string) => string }) {
  const router = useRouter()
  const [signals, setSignals] = useState<LiveSignal[]>(initialSignals)
  const [signalCount, setSignalCount] = useState(12847)
  const [selectedSignal, setSelectedSignal] = useState<LiveSignal | null>(initialSignals[0])

  const generateSignal = useCallback(() => {
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
      "去噪": ["过滤5条重复信号，保留关键事件", "去除误报噪声，识别真实威胁", "合并相似日志条目，减少冗余"],
      "聚合": ["关联3个源IP的相同攻击模式", "聚合15分钟内同类型事件", "识别跨源攻击行为关联"],
      "上下文补全": ["补充用户历史行为画像：无此类操作记录", "关联威胁情报：IP属于APT29基础设施", "补全资产信息：目标为域控服务器"],
      "风险评分": ["综合评分92/100，多维度确认高危", "威胁置信度85%，建议立即处置", "风险评分78，需人工复核确认"],
    }
    const classifications = ["暴力破解-凭证攻击", "横向移动-RDP扩散", "恶意软件-远控木马", "数据外泄-源代码泄露", "权限提升-域控接管", "C2通信-加密隧道", "钓鱼攻击-凭证窃取", "WebShell-后门植入", "DNS隧道-数据外传"]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const preprocess = preprocesses[Math.floor(Math.random() * preprocesses.length)]
    const levelWeights = [0.15, 0.35, 0.35, 0.15]
    const rand = Math.random()
    let level: RiskLevel = "low"
    let cumulative = 0
    for (let i = 0; i < levels.length; i++) { cumulative += levelWeights[i]; if (rand < cumulative) { level = levels[i]; break } }
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    return { id: `SIG-${String(Date.now()).slice(-6)}`, timestamp: ts, source, rawInput: rawInputs[source][Math.floor(Math.random() * rawInputs[source].length)], aiPreprocess: preprocess, aiPreprocessResult: aiResults[preprocess][Math.floor(Math.random() * aiResults[preprocess].length)], aiClassification: classifications[Math.floor(Math.random() * classifications.length)], riskLevel: level }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newSignal = generateSignal()
      setSignals((prev) => [newSignal, ...prev.slice(0, 19)])
      setSignalCount((prev) => prev + 1)
      setSelectedSignal((prev) => prev || newSignal)
    }, 5000)
    return () => clearInterval(interval)
  }, [generateSignal])

  const aiDenoised = Math.round(signalCount * 0.62)
  const anomalies = Math.round(signalCount * 0.08)
  const riskSignals = Math.round(signalCount * 0.03)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="card-default"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-white/40">总信号量</span><Activity className="size-4 text-white/30" /></div><p className="mt-1 text-xl font-bold text-white font-mono">{signalCount.toLocaleString()}</p></CardContent></Card>
        <Card className="card-accent"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-cyan-400/60">AI去噪后</span><Filter className="size-4 text-cyan-400/40" /></div><p className="mt-1 text-xl font-bold text-cyan-400 font-mono">{aiDenoised.toLocaleString()}</p></CardContent></Card>
        <Card className="border-amber-400/20 bg-amber-400/[0.04] backdrop-blur-xl"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-amber-400/60">异常行为</span><AlertTriangle className="size-4 text-amber-400/40" /></div><p className="mt-1 text-xl font-bold text-amber-400 font-mono">{anomalies.toLocaleString()}</p></CardContent></Card>
        <Card className="border-[#ff4d4f]/20 bg-[#ff4d4f]/[0.04] backdrop-blur-xl"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-[#ff4d4f]/60">风险信号</span><Zap className="size-4 text-[#ff4d4f]/40" /></div><p className="mt-1 text-xl font-bold text-[#ff4d4f] font-mono">{riskSignals.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <LivePulse />
            <span className="text-xs font-bold text-cyan-400 tracking-wider">{t("signals.live")}</span>
            <span className="text-[10px] text-white/30 ml-1">点击查看详情</span>
          </div>
          {signals.map((signal, idx) => {
            const isSelected = selectedSignal?.id === signal.id
            return (
              <div
                key={signal.id}
                className={cn(
                  "rounded-lg border p-2.5 cursor-pointer transition-all duration-200",
                  isSelected ? "border-cyan-500/40 bg-cyan-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
                  idx === 0 && "animate-in slide-in-from-top-2 duration-500",
                  signal.riskLevel === "critical" && !isSelected && "border-[#ff4d4f]/20",
                )}
                onClick={() => setSelectedSignal(signal)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-white/30">{signal.timestamp}</span>
                  <SourceBadge source={signal.source} />
                  <RiskIndicator level={signal.riskLevel} />
                </div>
                <p className="text-xs text-white/70 truncate">{signal.aiClassification}</p>
              </div>
            )
          })}
        </div>

        <div className="col-span-3">
          {selectedSignal ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SourceBadge source={selectedSignal.source} />
                  <RiskIndicator level={selectedSignal.riskLevel} />
                  <span className="text-xs font-mono text-white/30">{selectedSignal.id}</span>
                </div>
                <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="size-3" />{selectedSignal.timestamp}</span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{selectedSignal.aiClassification}</h3>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-white/40"><Tag className="size-3" />原始输入</div>
                <p className="text-xs text-white/60 font-mono leading-relaxed break-all">{selectedSignal.rawInput}</p>
              </div>

              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] p-3 space-y-2">
                {(() => {
                  const ppConfig = PREPROCESS_CONFIG[selectedSignal.aiPreprocess]
                  const PPIcon = ppConfig.icon
                  return (
                    <>
                      <div className="flex items-center gap-1.5 text-xs"><PPIcon className="size-3 text-cyan-400" /><span className="text-cyan-400 font-medium">AI{selectedSignal.aiPreprocess}</span></div>
                      <p className="text-xs text-white/70 leading-relaxed">{selectedSignal.aiPreprocessResult}</p>
                    </>
                  )
                })()}
              </div>

              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs"><Brain className="size-3 text-cyan-400" /><span className="text-cyan-400 font-medium">AI预分类</span></div>
                <p className="text-xs text-white/80 font-medium">{selectedSignal.aiClassification}</p>
              </div>

              {(selectedSignal.riskLevel === "critical" || selectedSignal.riskLevel === "high") && (
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                  onClick={() => router.push(`/investigate?from=signal&source=${selectedSignal.source}&classification=${encodeURIComponent(selectedSignal.aiClassification)}&risk=${selectedSignal.riskLevel}`)}
                >
                  <Crosshair className="size-4" />
                  发起调查
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <Eye className="size-8 text-white/10 mx-auto" />
                <p className="text-xs text-white/20">点击左侧信号查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AnomalousActivityTab({ t }: { t: (key: string) => string }) {
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [selectedActivity, setSelectedActivity] = useState<AnomalousActivity | null>(anomalousActivities[0])

  const filtered = anomalousActivities.filter((a) => {
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false
    if (riskFilter !== "all" && a.riskLevel !== riskFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={sourceFilter} onValueChange={(v) => v && setSourceFilter(v)}>
          <SelectTrigger size="sm" className="w-32 border-white/10 bg-white/[0.04] text-white/70"><SelectValue placeholder="来源类型" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部来源</SelectItem><SelectItem value="EDR">EDR</SelectItem><SelectItem value="VPN">VPN</SelectItem><SelectItem value="IAM">IAM</SelectItem><SelectItem value="Email">Email</SelectItem><SelectItem value="Firewall">Firewall</SelectItem><SelectItem value="DNS">DNS</SelectItem></SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => v && setRiskFilter(v)}>
          <SelectTrigger size="sm" className="w-32 border-white/10 bg-white/[0.04] text-white/70"><SelectValue placeholder="风险等级" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全部等级</SelectItem><SelectItem value="critical">严重</SelectItem><SelectItem value="high">高危</SelectItem><SelectItem value="medium">中危</SelectItem><SelectItem value="low">低危</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 space-y-2">
          {filtered.map((activity) => {
            const isSelected = selectedActivity?.id === activity.id
            return (
              <div
                key={activity.id}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer transition-all duration-200",
                  isSelected ? "border-cyan-500/40 bg-cyan-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
                  activity.riskLevel === "critical" && !isSelected && "border-[#ff4d4f]/20",
                )}
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <SourceBadge source={activity.source} />
                  <RiskIndicator level={activity.riskLevel} score={activity.riskScore} />
                  <span className="text-[10px] font-mono text-white/30">{activity.timestamp}</span>
                </div>
                <p className="text-xs text-white/70 line-clamp-2">{activity.behavior}</p>
              </div>
            )
          })}
        </div>

        <div className="col-span-3">
          {selectedActivity ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SourceBadge source={selectedActivity.source} />
                  <RiskIndicator level={selectedActivity.riskLevel} score={selectedActivity.riskScore} />
                </div>
                <span className="text-xs text-white/30 flex items-center gap-1"><Clock className="size-3" />{selectedActivity.timestamp}</span>
              </div>

              <p className="text-sm text-white/80 leading-relaxed">{selectedActivity.behavior}</p>

              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedActivity.entities.map((entity) => (
                  <span key={entity} className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-xs text-white/50 font-mono"><Link2 className="size-2.5" />{entity}</span>
                ))}
              </div>

              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] p-3 space-y-2">
                <div className="flex items-center gap-1.5"><Brain className="size-3.5 text-cyan-400" /><span className="text-xs font-medium text-cyan-400">AI评估</span></div>
                <p className="text-xs text-white/70 leading-relaxed">{selectedActivity.aiAssessment}</p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center gap-1.5"><Brain className="size-3.5 text-cyan-400/60" /><span className="text-xs font-medium text-cyan-400/60">推理依据</span></div>
                <p className="text-xs text-white/50 leading-relaxed">{selectedActivity.aiReasoning}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl h-full flex items-center justify-center">
              <div className="text-center space-y-2"><Eye className="size-8 text-white/10 mx-auto" /><p className="text-xs text-white/20">点击左侧活动查看详情</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RiskAggregationTab({ t }: { t: (key: string) => string }) {
  const [selectedCluster, setSelectedCluster] = useState<RiskCluster | null>(riskClusters[0])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="card-default"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-white/40">活跃风险集群</span><Layers className="size-4 text-white/30" /></div><p className="mt-1 text-xl font-bold text-white font-mono">{riskClusters.length}</p></CardContent></Card>
        <Card className="border-[#ff4d4f]/20 bg-[#ff4d4f]/[0.04] backdrop-blur-xl"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-[#ff4d4f]/60">严重集群</span><AlertTriangle className="size-4 text-[#ff4d4f]/40" /></div><p className="mt-1 text-xl font-bold text-[#ff4d4f] font-mono">{riskClusters.filter(c => c.riskLevel === "critical").length}</p></CardContent></Card>
        <Card className="card-accent"><CardContent className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-cyan-400/60">关联信号总数</span><Activity className="size-4 text-cyan-400/40" /></div><p className="mt-1 text-xl font-bold text-cyan-400 font-mono">{riskClusters.reduce((s, c) => s + c.signalCount, 0)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 space-y-2">
          {riskClusters.map((cluster) => {
            const isSelected = selectedCluster?.id === cluster.id
            return (
              <div
                key={cluster.id}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer transition-all duration-200",
                  isSelected ? "border-cyan-500/40 bg-cyan-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
                  cluster.riskLevel === "critical" && !isSelected && "border-[#ff4d4f]/20",
                )}
                onClick={() => setSelectedCluster(cluster)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <RiskIndicator level={cluster.riskLevel} score={cluster.riskScore} />
                    <span className="text-[10px] font-mono text-white/30">{cluster.id}</span>
                  </div>
                  <span className="text-[10px] text-white/30">{cluster.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/60"><Zap className="size-2.5 text-amber-400" />{cluster.attackType}</span>
                  <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] h-4"><Activity className="size-2.5 mr-0.5" />{cluster.signalCount}</Badge>
                </div>
              </div>
            )
          })}
        </div>

        <div className="col-span-3">
          {selectedCluster ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiskIndicator level={selectedCluster.riskLevel} score={selectedCluster.riskScore} />
                  <span className="text-xs font-mono text-white/30">{selectedCluster.id}</span>
                </div>
                <span className="text-xs text-white/30">{selectedCluster.lastUpdated}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2.5 py-1 text-xs text-white/70"><Zap className="size-3 text-amber-400" />{selectedCluster.attackType}</span>
                <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]"><Activity className="size-3 mr-1" />{selectedCluster.signalCount} 信号</Badge>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedCluster.entities.map((entity) => (
                  <span key={entity} className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-xs text-white/50 font-mono"><Link2 className="size-2.5" />{entity}</span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={cn("h-full rounded-full", selectedCluster.riskLevel === "critical" && "bg-[#ff4d4f]", selectedCluster.riskLevel === "high" && "bg-amber-400", selectedCluster.riskLevel === "medium" && "bg-cyan-400")} style={{ width: `${selectedCluster.riskScore}%` }} />
                </div>
                <span className={cn("text-sm font-mono font-bold", RISK_CONFIG[selectedCluster.riskLevel].color)}>{selectedCluster.riskScore}</span>
              </div>

              <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] p-3 space-y-2">
                <div className="flex items-center gap-1.5"><Brain className="size-3.5 text-cyan-400" /><span className="text-xs font-medium text-cyan-400">AI评估</span></div>
                <p className="text-xs text-white/70 leading-relaxed">{selectedCluster.aiAssessment}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl h-full flex items-center justify-center">
              <div className="text-center space-y-2"><Eye className="size-8 text-white/10 mx-auto" /><p className="text-xs text-white/20">点击左侧集群查看详情</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignalsPage() {
  const { t } = useLocaleStore()
  const [activeTab, setActiveTab] = useState("live")

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Radio}
        title={t("signals.title")}
        subtitle={<span className="flex items-center gap-1.5"><LivePulse />LIVE</span>}
        actions={
          <Link href="/datasource">
            <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white/50 hover:text-cyan-400 hover:border-cyan-500/25 hover:bg-cyan-500/[0.06] gap-2">
              <Database className="size-4" />数据源管理
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-1 border-b border-white/10">
        {[
          { value: "live", label: t("nav.tabLiveSignals"), icon: Activity, color: "text-cyan-400" },
          { value: "anomalous", label: t("nav.tabAnomalousActivity"), icon: AlertTriangle, color: "text-amber-400" },
          { value: "risk", label: t("nav.tabRiskAggregation"), icon: Layers, color: "text-[#ff4d4f]" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
              activeTab === tab.value
                ? `${tab.color} border-current`
                : "text-white/40 border-transparent hover:text-white/60"
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "live" && <LiveSignalsTab t={t} />}
      {activeTab === "anomalous" && <AnomalousActivityTab t={t} />}
      {activeTab === "risk" && <RiskAggregationTab t={t} />}
    </div>
  )
}
