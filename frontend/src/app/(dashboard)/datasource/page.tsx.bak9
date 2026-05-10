"use client"

import { useState, useMemo } from "react"
import {
  Database,
  Server,
  Plus,
  Wifi,
  WifiOff,
  Plug,
  Shield,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useLocaleStore } from "@/store/locale-store"
import { PageHeader } from "@/components/layout/page-header"

const deviceTypes = [
  "防火墙", "VPN网关", "WAF", "IDS/IPS", "EDR", "NAC",
  "SIEM", "态势感知", "堡垒机", "邮件网关", "漏洞扫描", "DLP",
  "上网行为管理", "安全审计", "负载均衡", "DNS安全", "沙箱",
  "威胁情报平台", "日志审计", "容器安全", "零信任网关", "蜜罐",
]

const typeColors: Record<string, string> = {
  "防火墙": "#ef4444", "VPN网关": "#f97316", "WAF": "#ec4899",
  "IDS/IPS": "#f43f5e", "EDR": "#a855f7", "NAC": "#8b5cf6",
  "SIEM": "#3b82f6", "态势感知": "#06b6d4", "堡垒机": "#e11d48",
  "邮件网关": "#eab308", "漏洞扫描": "#14b8a6", "DLP": "#0ea5e9",
  "上网行为管理": "#84cc16", "安全审计": "#6366f1", "负载均衡": "#f59e0b",
  "DNS安全": "#22d3ee", "沙箱": "#c084fc", "威胁情报平台": "#fb923c",
  "日志审计": "#818cf8", "容器安全": "#2dd4bf", "零信任网关": "#38bdf8",
  "蜜罐": "#f472b6",
}

const brandModels: Record<string, { country: string; models: string[] }> = {
  "深信服": { country: "CN", models: ["AF-2000", "AF-1000", "SSL VPN", "IPSec VPN", "AC-1000", "SIP", "EDR", "aES", "XSEC"] },
  "奇安信": { country: "CN", models: ["天擎", "天眼", "NGSOC", "天融新", "网神", "椒图", "鹰眼", "盘古", "诺盾"] },
  "安恒信息": { country: "CN", models: ["明御安全网关", "玄武盾", "明御堡垒机", "EDRA", "WAF", "APT", "天池云安全"] },
  "绿盟科技": { country: "CN", models: ["WAF", "NF", "IPS", "RSAS", "SAS", "UES", "BAS", "ISOP"] },
  "启明星辰": { country: "CN", models: ["天清汉马", "天阗", "天珣", "天榕", "天镜", "泰合", "Venusense"] },
  "天融信": { country: "CN", models: ["TopSEC", "猎鹰", "太行", "天融华", "可信", "云界"] },
  "山石网科": { country: "CN", models: ["SG-6000", "E-Series", "H-Series", "M-Series", "V-Series"] },
  "华为": { country: "CN", models: ["USG6000E", "HiSecEngine", "SecoManager", "HiSec Insight", "CloudCampus"] },
  "新华三": { country: "CN", models: ["SecPath", "H3C WAF", "iMC", "SecBlade", "Talent"] },
  "锐捷网络": { country: "CN", models: ["RG-WALL", "RG-SMP", "RG-SEC", "RG-ISG"] },
  "迪普科技": { country: "CN", models: ["DPX", "FW", "IPS", "WAF", "ADX", "UMC"] },
  "长亭科技": { country: "CN", models: ["雷池WAF", "牧云主机安全", "谛听流量分析", "洞鉴漏洞扫描"] },
  "微步在线": { country: "CN", models: ["TIP", "OneDNS", "X", "H"] },
  "青藤云安全": { country: "CN", models: ["万相主机安全", "蜂巢容器安全", "觅影威胁检测"] },
  "六方云": { country: "CN", models: ["AI防火墙", "AI WAF", "AI IPS", "超融合安全"] },
  "远江盛邦": { country: "CN", models: ["WebRay WAF", "RayScan", "RayShield"] },
  "观安信息": { country: "CN", models: ["大数据态势感知", "NF", "WAF", "APT"] },
  "知道创宇": { country: "CN", models: ["创宇盾", "ZoomEye", "Seebug"] },
  "360数字安全": { country: "CN", models: ["360安全大脑", "360天眼", "360终端安全", "360政企安全"] },
  "腾讯安全": { country: "CN", models: ["云防火墙", "云WAF", "主机安全", "安全运营中心"] },
  "阿里云安全": { country: "CN", models: ["云防火墙", "WAF", "安全中心", "态势感知"] },
  "网康科技": { country: "CN", models: ["NI", "NP", "NS", "NGFW"] },
  "盛科通信": { country: "CN", models: ["Centec SDN", "Centec Security"] },
  "Palo Alto Networks": { country: "US", models: ["PA-Series", "Prisma Cloud", "Cortex XDR", "Strata", "Panorama"] },
  "Fortinet": { country: "US", models: ["FortiGate", "FortiAnalyzer", "FortiManager", "FortiSandbox", "FortiWeb", "FortiEDR"] },
  "Check Point": { country: "IL", models: ["Quantum", "CloudGuard", "Harmony", "Infinity", "SandBlast"] },
  "Cisco": { country: "US", models: ["Firepower", "ASA", "Umbrella", "Duo", "SecureX", "Stealthwatch"] },
  "Juniper": { country: "US", models: ["SRX", "Junos Space", "Contrail", "Sky ATP"] },
  "F5": { country: "US", models: ["BIG-IP", "ASM", "AWAF", "DNS", "Advanced WAF"] },
  "Imperva": { country: "US", models: ["SecureSphere", "Cloud WAF", "Data Risk Fabric", "CounterBreach"] },
  "CrowdStrike": { country: "US", models: ["Falcon Platform", "Falcon XDR", "Falcon Insight", "Falcon Prevent"] },
  "SentinelOne": { country: "US", models: ["Singularity Platform", "Singularity XDR", "Singularity Cloud"] },
  "Splunk": { country: "US", models: ["Enterprise", "Cloud", "SOAR", "ES", "UBA"] },
  "Trend Micro": { country: "JP", models: ["TippingPoint", "Deep Security", "Cloud One", "Vision One"] },
  "Sophos": { country: "UK", models: ["XG Firewall", "Intercept X", "MTR", "Phish Threat"] },
  "SonicWall": { country: "US", models: ["TZ", "NSa", "NSsp", "Cloud App Security"] },
  "McAfee": { country: "US", models: ["MVISION", "ePO", "NSP", "ATD", "DLP"] },
  "IBM Security": { country: "US", models: ["QRadar", "Guardium", "MaaS360", "X-Force"] },
}

const brandColorMap: Record<string, string> = {
  "深信服": "#00b894", "奇安信": "#0984e3", "安恒信息": "#e17055",
  "绿盟科技": "#6c5ce7", "启明星辰": "#fdcb6e", "天融信": "#00cec9",
  "山石网科": "#e77f67", "华为": "#d63031", "新华三": "#74b9ff",
  "锐捷网络": "#55efc4", "迪普科技": "#a29bfe", "长亭科技": "#ff7675",
  "微步在线": "#fd79a8", "青藤云安全": "#00b894", "六方云": "#6c5ce7",
  "远江盛邦": "#e17055", "观安信息": "#0984e3", "知道创宇": "#fdcb6e",
  "360数字安全": "#00cec9", "腾讯安全": "#74b9ff", "阿里云安全": "#ff7675",
  "网康科技": "#55efc4", "盛科通信": "#a29bfe",
}

function getBrandColor(brand: string): string {
  return brandColorMap[brand] || "#64748b"
}

interface DataSource {
  id: string
  name: string
  type: string
  brand: string
  model: string
  status: "online" | "offline"
  ip: string
  port: number
  lastSync: string
  dailyVolume: number
  health: number
  protocol: string
  logFormat: string
  logLevel: string
  direction: string
  protocolConfig: Record<string, string>
}

const dataSources: DataSource[] = [
  { id: "DS-001", name: "核心防火墙-北京", type: "防火墙", brand: "深信服", model: "AF-2000", status: "online", ip: "10.0.0.1", port: 514, lastSync: "3秒前", dailyVolume: 230000, health: 99, protocol: "Syslog", logFormat: "CEF", logLevel: "all", direction: "push", protocolConfig: { transport: "UDP", syslogFormat: "RFC5424" } },
  { id: "DS-002", name: "VPN网关-主", type: "VPN网关", brand: "深信服", model: "SSL VPN", status: "online", ip: "10.0.0.5", port: 443, lastSync: "5秒前", dailyVolume: 45000, health: 98, protocol: "API", logFormat: "JSON", logLevel: "alert", direction: "pull", protocolConfig: { apiUrl: "https://10.0.0.5/api/v1/logs", authType: "Token", pollInterval: "30s" } },
  { id: "DS-003", name: "AD域控终端防护", type: "EDR", brand: "奇安信", model: "天擎", status: "online", ip: "10.0.5.1", port: 443, lastSync: "2秒前", dailyVolume: 89000, health: 97, protocol: "Agent", logFormat: "JSON", logLevel: "all", direction: "push", protocolConfig: { agentKey: "AG-****-3F7A", callbackUrl: "wss://10.0.5.1/agent" } },
  { id: "DS-004", name: "邮件安全网关", type: "邮件网关", brand: "安恒信息", model: "明御安全网关", status: "online", ip: "10.0.1.55", port: 443, lastSync: "8秒前", dailyVolume: 67000, health: 95, protocol: "API", logFormat: "JSON", logLevel: "alert", direction: "pull", protocolConfig: { apiUrl: "https://10.0.1.55/api/v2/events", authType: "OAuth2", pollInterval: "60s" } },
  { id: "DS-005", name: "SIEM平台", type: "SIEM", brand: "奇安信", model: "天眼", status: "online", ip: "10.0.5.3", port: 9092, lastSync: "1秒前", dailyVolume: 340000, health: 99, protocol: "Kafka", logFormat: "JSON", logLevel: "all", direction: "pull", protocolConfig: { broker: "10.0.5.3:9092", topic: "security-events", consumerGroup: "secmind-consumer", saslMechanism: "PLAIN" } },
  { id: "DS-006", name: "WAF-生产环境", type: "WAF", brand: "安恒信息", model: "玄武盾", status: "online", ip: "10.0.1.60", port: 514, lastSync: "4秒前", dailyVolume: 156000, health: 96, protocol: "Syslog", logFormat: "CEF", logLevel: "alert", direction: "push", protocolConfig: { transport: "TCP", syslogFormat: "RFC3164" } },
  { id: "DS-007", name: "NAC准入控制", type: "NAC", brand: "深信服", model: "AC-1000", status: "offline", ip: "10.0.5.5", port: 161, lastSync: "2小时前", dailyVolume: 0, health: 0, protocol: "SNMP", logFormat: "原生", logLevel: "all", direction: "pull", protocolConfig: { snmpVersion: "v2c", community: "public", trapPort: "162" } },
  { id: "DS-008", name: "堡垒机", type: "堡垒机", brand: "安恒信息", model: "明御堡垒机", status: "online", ip: "10.0.0.5", port: 514, lastSync: "6秒前", dailyVolume: 12000, health: 92, protocol: "Syslog", logFormat: "LEEF", logLevel: "all", direction: "push", protocolConfig: { transport: "TLS", syslogFormat: "RFC5424" } },
  { id: "DS-009", name: "态势感知平台", type: "态势感知", brand: "奇安信", model: "NGSOC", status: "online", ip: "10.0.6.1", port: 9092, lastSync: "1秒前", dailyVolume: 420000, health: 98, protocol: "Kafka", logFormat: "JSON", logLevel: "critical", direction: "pull", protocolConfig: { broker: "10.0.6.1:9092", topic: "ngsoc-alerts", consumerGroup: "secmind-ngsoc", saslMechanism: "SCRAM-SHA-256" } },
  { id: "DS-010", name: "终端检测响应", type: "EDR", brand: "安恒信息", model: "EDRA", status: "online", ip: "10.0.6.5", port: 443, lastSync: "3秒前", dailyVolume: 78000, health: 94, protocol: "Agent", logFormat: "JSON", logLevel: "alert", direction: "push", protocolConfig: { agentKey: "AG-****-8B2C", callbackUrl: "wss://10.0.6.5/edr" } },
  { id: "DS-011", name: "入侵检测-核心区", type: "IDS/IPS", brand: "绿盟科技", model: "IPS", status: "online", ip: "10.0.2.1", port: 514, lastSync: "2秒前", dailyVolume: 185000, health: 97, protocol: "Syslog", logFormat: "CEF", logLevel: "alert", direction: "push", protocolConfig: { transport: "TCP", syslogFormat: "RFC5424" } },
  { id: "DS-012", name: "漏洞扫描-月度巡检", type: "漏洞扫描", brand: "绿盟科技", model: "RSAS", status: "online", ip: "10.0.7.1", port: 443, lastSync: "10秒前", dailyVolume: 5200, health: 93, protocol: "API", logFormat: "JSON", logLevel: "critical", direction: "pull", protocolConfig: { apiUrl: "https://10.0.7.1/api/scan", authType: "Token", pollInterval: "300s" } },
  { id: "DS-013", name: "FortiGate-出口", type: "防火墙", brand: "Fortinet", model: "FortiGate", status: "online", ip: "10.0.0.100", port: 514, lastSync: "1秒前", dailyVolume: 310000, health: 99, protocol: "Syslog", logFormat: "CEF", logLevel: "all", direction: "push", protocolConfig: { transport: "UDP", syslogFormat: "RFC3164" } },
  { id: "DS-014", name: "DLP数据防泄漏", type: "DLP", brand: "天融信", model: "可信", status: "online", ip: "10.0.3.1", port: 443, lastSync: "5秒前", dailyVolume: 23000, health: 95, protocol: "API", logFormat: "JSON", logLevel: "alert", direction: "pull", protocolConfig: { apiUrl: "https://10.0.3.1/api/dlp", authType: "Token", pollInterval: "60s" } },
  { id: "DS-015", name: "上网行为管理", type: "上网行为管理", brand: "深信服", model: "SIP", status: "online", ip: "10.0.4.1", port: 514, lastSync: "3秒前", dailyVolume: 95000, health: 96, protocol: "Syslog", logFormat: "键值对", logLevel: "all", direction: "push", protocolConfig: { transport: "TCP", syslogFormat: "RFC5424" } },
]

const protocolOptions = ["Syslog", "API", "Kafka", "Agent", "SNMP", "NetFlow"]
const logFormatOptions = ["CEF", "LEEF", "JSON", "原生", "键值对"]
const logLevelOptions = [
  { value: "all", label: "全量日志" },
  { value: "alert", label: "仅告警" },
  { value: "critical", label: "仅关键告警" },
]
const directionOptions = [
  { value: "push", label: "推送（设备主动发送）" },
  { value: "pull", label: "拉取（平台主动采集）" },
]

function ProtocolConfigFields({ protocol, form, handleChange }: {
  protocol: string
  form: Record<string, string>
  handleChange: (field: string, value: string) => void
}) {
  if (!protocol) return null

  const fc = "h-9 bg-white/[0.03] border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-cyan-500/30 focus:ring-cyan-500/10 rounded-lg w-full"
  const sc = "h-9 bg-white/[0.03] border-white/[0.08] text-white text-sm rounded-lg w-full"
  const scc = "bg-[#0c1a3a] border-cyan-500/15 text-white"
  const lc = "text-white/50 text-xs font-medium"

  switch (protocol) {
    case "Syslog":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium">
            <Plug className="size-3.5" /> Syslog 连接配置
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>监听端口 *</Label>
              <Input required value={form.syslogPort} onChange={(e) => handleChange("syslogPort", e.target.value)} placeholder="514" className={fc} />
            </div>
            <div className="space-y-1">
              <Label className={lc}>传输协议 *</Label>
              <Select value={form.syslogTransport} onValueChange={(v) => handleChange("syslogTransport", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择传输协议" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="UDP">UDP</SelectItem>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="TLS">TLS（加密）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>Syslog格式</Label>
              <Select value={form.syslogFormat} onValueChange={(v) => handleChange("syslogFormat", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择Syslog格式" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="RFC3164">RFC 3164</SelectItem>
                  <SelectItem value="RFC5424">RFC 5424</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.syslogTransport === "TLS" && (
              <div className="space-y-1">
                <Label className={lc}>TLS证书</Label>
                <Input value={form.syslogTlsCert} onChange={(e) => handleChange("syslogTlsCert", e.target.value)} placeholder="证书指纹" className={fc} />
              </div>
            )}
          </div>
        </div>
      )
    case "API":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium">
            <Plug className="size-3.5" /> API 接口配置
          </div>
          <div className="space-y-1">
            <Label className={lc}>API地址 *</Label>
            <Input required value={form.apiUrl} onChange={(e) => handleChange("apiUrl", e.target.value)} placeholder="https://10.0.0.1/api/v1/logs" className={fc} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>认证方式 *</Label>
              <Select value={form.apiAuthType} onValueChange={(v) => handleChange("apiAuthType", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择认证方式" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="Token">API Token</SelectItem>
                  <SelectItem value="OAuth2">OAuth 2.0</SelectItem>
                  <SelectItem value="Basic">Basic Auth</SelectItem>
                  <SelectItem value="HMAC">HMAC签名</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={lc}>轮询间隔</Label>
              <Select value={form.apiPollInterval} onValueChange={(v) => handleChange("apiPollInterval", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择轮询间隔" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="10s">10秒</SelectItem>
                  <SelectItem value="30s">30秒</SelectItem>
                  <SelectItem value="60s">1分钟</SelectItem>
                  <SelectItem value="300s">5分钟</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className={lc}>{form.apiAuthType === "Basic" ? "用户名:密码" : form.apiAuthType === "OAuth2" ? "访问令牌" : "API密钥"} *</Label>
            <Input required type="password" value={form.apiKey} onChange={(e) => handleChange("apiKey", e.target.value)} placeholder={form.apiAuthType === "Basic" ? "admin:password" : "sk-xxxx"} className={fc} />
          </div>
        </div>
      )
    case "Kafka":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium">
            <Plug className="size-3.5" /> Kafka 消费配置
          </div>
          <div className="space-y-1">
            <Label className={lc}>Broker地址 *</Label>
            <Input required value={form.kafkaBroker} onChange={(e) => handleChange("kafkaBroker", e.target.value)} placeholder="10.0.5.3:9092" className={fc} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>Topic *</Label>
              <Input required value={form.kafkaTopic} onChange={(e) => handleChange("kafkaTopic", e.target.value)} placeholder="security-events" className={fc} />
            </div>
            <div className="space-y-1">
              <Label className={lc}>消费者组</Label>
              <Input value={form.kafkaConsumerGroup} onChange={(e) => handleChange("kafkaConsumerGroup", e.target.value)} placeholder="secmind-consumer" className={fc} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>SASL认证</Label>
              <Select value={form.kafkaSasl} onValueChange={(v) => handleChange("kafkaSasl", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择SASL认证" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="none">无认证</SelectItem>
                  <SelectItem value="PLAIN">SASL/PLAIN</SelectItem>
                  <SelectItem value="SCRAM-SHA-256">SCRAM-SHA-256</SelectItem>
                  <SelectItem value="SCRAM-SHA-512">SCRAM-SHA-512</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.kafkaSasl && form.kafkaSasl !== "none" && (
              <div className="space-y-1">
                <Label className={lc}>SASL用户名</Label>
                <Input value={form.kafkaSaslUser} onChange={(e) => handleChange("kafkaSaslUser", e.target.value)} placeholder="kafka-user" className={fc} />
              </div>
            )}
          </div>
        </div>
      )
    case "Agent":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium">
            <Plug className="size-3.5" /> Agent 采集配置
          </div>
          <div className="space-y-1">
            <Label className={lc}>回调地址 *</Label>
            <Input required value={form.agentCallbackUrl} onChange={(e) => handleChange("agentCallbackUrl", e.target.value)} placeholder="wss://10.0.5.1/agent/callback" className={fc} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>Agent密钥 *</Label>
              <Input required type="password" value={form.agentKey} onChange={(e) => handleChange("agentKey", e.target.value)} placeholder="自动生成或手动输入" className={fc} />
            </div>
            <div className="space-y-1">
              <Label className={lc}>数据压缩</Label>
              <Select value={form.agentCompression} onValueChange={(v) => handleChange("agentCompression", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择压缩方式" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="gzip">Gzip</SelectItem>
                  <SelectItem value="lz4">LZ4</SelectItem>
                  <SelectItem value="none">不压缩</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )
    case "SNMP":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium">
            <Plug className="size-3.5" /> SNMP 采集配置
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>SNMP版本 *</Label>
              <Select value={form.snmpVersion} onValueChange={(v) => handleChange("snmpVersion", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择SNMP版本" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="v2c">SNMPv2c</SelectItem>
                  <SelectItem value="v3">SNMPv3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={lc}>SNMP端口</Label>
              <Input value={form.snmpPort} onChange={(e) => handleChange("snmpPort", e.target.value)} placeholder="161" className={fc} />
            </div>
          </div>
          {form.snmpVersion === "v2c" ? (
            <div className="space-y-1">
              <Label className={lc}>团体字符串 *</Label>
              <Input required type="password" value={form.snmpCommunity} onChange={(e) => handleChange("snmpCommunity", e.target.value)} placeholder="public" className={fc} />
            </div>
          ) : form.snmpVersion === "v3" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={lc}>用户名 *</Label>
                <Input required value={form.snmpV3User} onChange={(e) => handleChange("snmpV3User", e.target.value)} placeholder="snmpv3-user" className={fc} />
              </div>
              <div className="space-y-1">
                <Label className={lc}>认证协议</Label>
                <Select value={form.snmpV3AuthProto} onValueChange={(v) => handleChange("snmpV3AuthProto", v ?? "")}>
                  <SelectTrigger className={sc}><SelectValue placeholder="选择认证协议" /></SelectTrigger>
                  <SelectContent className={scc}>
                    <SelectItem value="MD5">MD5</SelectItem>
                    <SelectItem value="SHA">SHA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <div className="space-y-1">
            <Label className={lc}>Trap接收端口</Label>
            <Input value={form.snmpTrapPort} onChange={(e) => handleChange("snmpTrapPort", e.target.value)} placeholder="162" className={fc} />
          </div>
        </div>
      )
    case "NetFlow":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium">
            <Plug className="size-3.5" /> NetFlow 采集配置
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={lc}>监听端口 *</Label>
              <Input required value={form.netflowPort} onChange={(e) => handleChange("netflowPort", e.target.value)} placeholder="2055" className={fc} />
            </div>
            <div className="space-y-1">
              <Label className={lc}>NetFlow版本 *</Label>
              <Select value={form.netflowVersion} onValueChange={(v) => handleChange("netflowVersion", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择NetFlow版本" /></SelectTrigger>
                <SelectContent className={scc}>
                  <SelectItem value="v5">NetFlow v5</SelectItem>
                  <SelectItem value="v9">NetFlow v9</SelectItem>
                  <SelectItem value="IPFIX">IPFIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

function AddDataSourceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState<Record<string, string>>({
    name: "", type: "", brand: "", model: "", ip: "", port: "",
    protocol: "", logFormat: "", logLevel: "", direction: "",
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<"idle" | "success" | "fail">("idle")

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === "protocol") setTestResult("idle")
    if (field === "brand") setForm((prev) => ({ ...prev, model: "" }))
  }

  const availableModels = form.brand ? (brandModels[form.brand]?.models || []) : []

  const handleTest = () => {
    setTesting(true)
    setTestResult("idle")
    setTimeout(() => { setTesting(false); setTestResult("success") }, 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onOpenChange(false)
    setForm({ name: "", type: "", brand: "", model: "", ip: "", port: "", protocol: "", logFormat: "", logLevel: "", direction: "" })
    setTestResult("idle")
  }

  const fc = "h-9 bg-white/[0.03] border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-cyan-500/30 focus:ring-cyan-500/10 rounded-lg w-full"
  const sc = "h-9 bg-white/[0.03] border-white/[0.08] text-white text-sm rounded-lg w-full"
  const scc = "bg-[#0c1a3a] border-cyan-500/15 text-white"
  const lc = "text-white/50 text-xs font-medium"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setTestResult("idle"); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto bg-[#060e1f] border-white/[0.08] text-white shadow-[0_0_60px_rgba(0,212,255,0.08)] rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3 text-white text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20">
              <Plus className="size-4 text-cyan-400" />
            </div>
            添加数据源
          </DialogTitle>
          <DialogDescription className="text-white/30 text-xs">配置安全设备日志/告警数据源接入</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium mb-3">
              <Server className="size-3.5" /> 基本信息
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={lc}>设备名称 *</Label>
                  <Input required value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="如：核心防火墙-上海" className={fc} />
                </div>
                <div className="space-y-1">
                  <Label className={lc}>设备类型 *</Label>
                  <Select value={form.type} onValueChange={(v) => handleChange("type", v ?? "")}>
                    <SelectTrigger className={sc}><SelectValue placeholder="选择类型" /></SelectTrigger>
                    <SelectContent className={scc}>
                      {deviceTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={lc}>品牌 *</Label>
                  <Select value={form.brand} onValueChange={(v) => handleChange("brand", v ?? "")}>
                    <SelectTrigger className={sc}><SelectValue placeholder="选择品牌" /></SelectTrigger>
                    <SelectContent className={scc}>
                      <div className="px-2 py-1 text-[10px] text-white/30 font-medium">国内品牌</div>
                      {Object.entries(brandModels).filter(([, v]) => v.country === "CN").map(([b]) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-[10px] text-white/30 font-medium mt-1">国际品牌</div>
                      {Object.entries(brandModels).filter(([, v]) => v.country !== "CN").map(([b]) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className={lc}>型号 *</Label>
                  <Select value={form.model} onValueChange={(v) => handleChange("model", v ?? "")} disabled={!form.brand}>
                    <SelectTrigger className={sc}><SelectValue placeholder={form.brand ? "选择型号" : "先选品牌"} /></SelectTrigger>
                    <SelectContent className={scc}>
                      {availableModels.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={lc}>IP地址 *</Label>
                  <Input required value={form.ip} onChange={(e) => handleChange("ip", e.target.value)} placeholder="10.0.0.1" className={fc} />
                </div>
                <div className="space-y-1">
                  <Label className={lc}>端口</Label>
                  <Input value={form.port} onChange={(e) => handleChange("port", e.target.value)} placeholder="514" className={fc} />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium mb-3">
              <Plug className="size-3.5" /> 接入协议
            </div>
            <Select value={form.protocol} onValueChange={(v) => handleChange("protocol", v ?? "")}>
              <SelectTrigger className={sc}><SelectValue placeholder="选择接入协议" /></SelectTrigger>
              <SelectContent className={scc}>
                {protocolOptions.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            {form.protocol && (
              <div className="mt-3"><ProtocolConfigFields protocol={form.protocol} form={form} handleChange={handleChange} /></div>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-medium mb-3">
              <Shield className="size-3.5" /> 日志与采集
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={lc}>日志格式 *</Label>
                <Select value={form.logFormat} onValueChange={(v) => handleChange("logFormat", v ?? "")}>
                  <SelectTrigger className={sc}><SelectValue placeholder="选择日志格式" /></SelectTrigger>
                  <SelectContent className={scc}>
                    {logFormatOptions.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className={lc}>日志级别 *</Label>
                <Select value={form.logLevel} onValueChange={(v) => handleChange("logLevel", v ?? "")}>
                  <SelectTrigger className={sc}><SelectValue placeholder="选择日志级别" /></SelectTrigger>
                  <SelectContent className={scc}>
                    {logLevelOptions.map((l) => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={lc}>数据方向 *</Label>
              <Select value={form.direction} onValueChange={(v) => handleChange("direction", v ?? "")}>
                <SelectTrigger className={sc}><SelectValue placeholder="选择数据方向" /></SelectTrigger>
                <SelectContent className={scc}>
                  {directionOptions.map((d) => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.protocol && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" className="gap-1.5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 h-9 text-xs rounded-lg" onClick={handleTest} disabled={testing}>
                  {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Plug className="size-3.5" />}
                  {testing ? "测试中..." : "测试连接"}
                </Button>
                {testResult === "success" && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" />连接成功</span>
                )}
                {testResult === "fail" && (
                  <span className="text-xs text-red-400">连接失败</span>
                )}
              </div>
            </>
          )}

          <Button type="submit" className="w-full h-10 font-semibold gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:brightness-110 rounded-xl text-sm">
            <ArrowRight className="size-4" /> 确认接入
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProtocolConfigSummary({ ds }: { ds: DataSource }) {
  const items: { label: string; value: string }[] = []
  switch (ds.protocol) {
    case "Syslog": items.push({ label: "传输", value: ds.protocolConfig.transport || "-" }, { label: "格式", value: ds.protocolConfig.syslogFormat || "-" }); break
    case "API": items.push({ label: "认证", value: ds.protocolConfig.authType || "-" }, { label: "轮询", value: ds.protocolConfig.pollInterval || "-" }); break
    case "Kafka": items.push({ label: "Topic", value: ds.protocolConfig.topic || "-" }, { label: "SASL", value: ds.protocolConfig.saslMechanism || "无" }); break
    case "Agent": items.push({ label: "Key", value: ds.protocolConfig.agentKey || "-" }); break
    case "SNMP": items.push({ label: "版本", value: ds.protocolConfig.snmpVersion || "-" }, { label: "Trap", value: ds.protocolConfig.trapPort || "-" }); break
    default: break
  }
  if (items.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] px-1.5 py-0.5 text-[10px] border border-white/[0.04]">
          <span className="text-white/25">{item.label}</span>
          <span className="text-white/50 font-mono">{item.value}</span>
        </span>
      ))}
    </div>
  )
}

export default function DataSourcePage() {
  const { t } = useLocaleStore()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const onlineCount = dataSources.filter((d) => d.status === "online").length
  const offlineCount = dataSources.filter((d) => d.status === "offline").length
  const totalVolume = dataSources.reduce((s, d) => s + d.dailyVolume, 0)

  const filtered = useMemo(() => {
    let result = dataSources
    if (filterType !== "all") result = result.filter((d) => d.type === filterType)
    if (filterStatus !== "all") result = result.filter((d) => d.status === filterStatus)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.ip.includes(q) ||
        d.type.includes(q)
      )
    }
    return result
  }, [searchQuery, filterType, filterStatus])

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Database}
        title={t("nav.tabDataSource")}
        actions={
          <Button className="gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white h-9 text-xs rounded-xl shadow-[0_0_16px_rgba(0,212,255,0.15)]" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> 添加数据源
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus(filterStatus === "online" ? "all" : "online")}
          className={cn(
            "group rounded-xl border p-4 text-left transition-all duration-200",
            filterStatus === "online"
              ? "border-emerald-400/30 bg-emerald-400/[0.06] shadow-[0_0_20px_rgba(52,211,153,0.08)]"
              : "border-white/[0.06] bg-white/[0.02] hover:border-emerald-400/15 hover:bg-emerald-400/[0.03]"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15">
                <Wifi className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">在线设备</p>
                <p className="text-xl font-bold text-emerald-400 font-mono leading-tight">{onlineCount}</p>
              </div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === "offline" ? "all" : "offline")}
          className={cn(
            "group rounded-xl border p-4 text-left transition-all duration-200",
            filterStatus === "offline"
              ? "border-red-400/30 bg-red-400/[0.06] shadow-[0_0_20px_rgba(248,113,113,0.08)]"
              : "border-white/[0.06] bg-white/[0.02] hover:border-red-400/15 hover:bg-red-400/[0.03]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/15">
              <WifiOff className="size-4 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">离线设备</p>
              <p className="text-xl font-bold text-red-400 font-mono leading-tight">{offlineCount}</p>
            </div>
          </div>
        </button>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/15">
              <Database className="size-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">日均日志量</p>
              <p className="text-xl font-bold text-cyan-400 font-mono leading-tight">{(totalVolume / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/20" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索设备名称、品牌、IP..."
            className="h-8 pl-8 pr-3 text-xs bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/20 focus:border-cyan-500/30 rounded-lg"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-xs bg-white/[0.02] border-white/[0.06] text-white/60 rounded-lg">
            <Filter className="size-3 mr-1 text-white/20" />
            <SelectValue placeholder="设备类型" />
          </SelectTrigger>
          <SelectContent className="bg-[#0c1a3a] border-cyan-500/15 text-white">
            <SelectItem value="all">全部类型</SelectItem>
            {deviceTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>
        {(filterType !== "all" || filterStatus !== "all" || searchQuery) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-white/40 hover:text-white/60 rounded-lg" onClick={() => { setFilterType("all"); setFilterStatus("all"); setSearchQuery("") }}>
            清除筛选
          </Button>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-white/20">{filtered.length} 台设备</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ds) => {
          const typeColor = typeColors[ds.type] || "#06b6d4"
          const bColor = getBrandColor(ds.brand)
          return (
            <Card
              key={ds.id}
              className={cn(
                "group border bg-white/[0.015] backdrop-blur-sm transition-all duration-200 rounded-xl overflow-hidden",
                ds.status === "offline"
                  ? "border-red-500/10 opacity-50 hover:opacity-70"
                  : "border-white/[0.05] hover:border-cyan-500/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.06)]"
              )}
            >
              <CardContent className="p-0">
                <div className="px-4 pt-3.5 pb-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${typeColor}12`, border: `1px solid ${typeColor}20` }}>
                        <Server className="size-3.5" style={{ color: typeColor }} />
                      </div>
                      <span className="text-sm font-medium text-white truncate">{ds.name}</span>
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold shrink-0 ml-2",
                      ds.status === "online"
                        ? "bg-emerald-400/8 text-emerald-400 border border-emerald-400/15"
                        : "bg-red-400/8 text-red-400 border border-red-400/15"
                    )}>
                      <span className={cn("size-1 rounded-full", ds.status === "online" ? "bg-emerald-400" : "bg-red-400")} />
                      {ds.status === "online" ? "在线" : "离线"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}20` }}>
                      {ds.type}
                    </span>
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: `${bColor}10`, color: bColor, border: `1px solid ${bColor}18` }}>
                      {ds.brand}
                    </span>
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] text-white/40 border border-white/[0.06] bg-white/[0.02]">
                      {ds.model}
                    </span>
                    <Badge variant="outline" className="text-[9px] text-white/25 border-white/[0.06] h-4 px-1.5">{ds.protocol}</Badge>
                  </div>

                  <ProtocolConfigSummary ds={ds} />
                </div>

                <div className="border-t border-white/[0.04] bg-white/[0.01]">
                  <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
                    <div className="px-3 py-2 text-center">
                      <p className="text-[9px] text-white/20 uppercase tracking-wider">地址</p>
                      <p className="text-[11px] text-white/50 font-mono mt-0.5">{ds.ip}:{ds.port}</p>
                    </div>
                    <div className="px-3 py-2 text-center">
                      <p className="text-[9px] text-white/20 uppercase tracking-wider">同步</p>
                      <p className="text-[11px] text-white/50 mt-0.5">{ds.lastSync}</p>
                    </div>
                    <div className="px-3 py-2 text-center">
                      <p className="text-[9px] text-white/20 uppercase tracking-wider">日志/日</p>
                      <p className="text-[11px] text-white/50 font-mono mt-0.5">{ds.dailyVolume > 0 ? `${(ds.dailyVolume / 1000).toFixed(0)}K` : "-"}</p>
                    </div>
                  </div>
                </div>

                {ds.health > 0 && (
                  <div className="h-[2px] bg-white/[0.03]">
                    <div
                      className={cn("h-full transition-all", ds.health >= 95 ? "bg-emerald-400/60" : ds.health >= 80 ? "bg-amber-400/60" : "bg-red-400/60")}
                      style={{ width: `${ds.health}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AddDataSourceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  )
}
