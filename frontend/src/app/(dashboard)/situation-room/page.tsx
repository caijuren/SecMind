"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AttackMap } from "@/components/situation-room/AttackMap"
import { ThreatTicker } from "@/components/situation-room/ThreatTicker"
import { SecurityScoreGauge } from "@/components/situation-room/SecurityScoreGauge"
import { ThreatStatsPanel, createDefaultStats } from "@/components/situation-room/ThreatStatsPanel"
import { AlertTrendChart } from "@/components/situation-room/alert-trend-chart"
import { AttackTypeChart } from "@/components/situation-room/attack-type-chart"
import { MitreMatrix } from "@/components/situation-room/mitre-matrix"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { Maximize2, Minimize2, RefreshCw } from "lucide-react"

interface AttackPoint {
  id: string
  name: string
  lat: number
  lng: number
  severity: "critical" | "high" | "medium" | "low"
  type: "source" | "target"
  timestamp: number
}

interface TickerThreat {
  id: string
  time: string
  type: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
}

interface TrendDataPoint {
  hour: string
  high: number
  medium: number
  low: number
}

interface AttackTypeData {
  type: string
  count: number
}

interface MitreTechnique {
  id: string
  name: string
  tactic: string
  hasAlert: boolean
  alertCount?: number
}

const ATTACK_POINTS: AttackPoint[] = [
  { id: "ap1", name: "莫斯科", lat: 55.75, lng: 37.62, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap2", name: "拉各斯", lat: 6.52, lng: 3.38, severity: "high", type: "source", timestamp: Date.now() },
  { id: "ap3", name: "柏林", lat: 52.52, lng: 13.41, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap4", name: "洛杉矶", lat: 34.05, lng: -118.24, severity: "high", type: "source", timestamp: Date.now() },
  { id: "ap5", name: "旧金山", lat: 37.77, lng: -122.42, severity: "medium", type: "source", timestamp: Date.now() },
  { id: "ap6", name: "纽约", lat: 40.71, lng: -74.01, severity: "high", type: "source", timestamp: Date.now() },
  { id: "ap7", name: "北京", lat: 39.9, lng: 116.4, severity: "critical", type: "target", timestamp: Date.now() },
  { id: "ap8", name: "上海", lat: 31.23, lng: 121.47, severity: "critical", type: "target", timestamp: Date.now() },
  { id: "ap9", name: "深圳", lat: 22.54, lng: 114.06, severity: "high", type: "target", timestamp: Date.now() },
  { id: "ap10", name: "杭州", lat: 30.27, lng: 120.15, severity: "medium", type: "target", timestamp: Date.now() },
  { id: "ap11", name: "广州", lat: 23.13, lng: 113.26, severity: "high", type: "target", timestamp: Date.now() },
  { id: "ap12", name: "平壤", lat: 39.03, lng: 125.75, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap13", name: "德黑兰", lat: 35.69, lng: 51.39, severity: "critical", type: "source", timestamp: Date.now() },
  { id: "ap14", name: "河内", lat: 21.03, lng: 105.85, severity: "medium", type: "source", timestamp: Date.now() },
  { id: "ap15", name: "新加坡", lat: 1.35, lng: 103.82, severity: "low", type: "source", timestamp: Date.now() },
  { id: "ap16", name: "成都", lat: 30.57, lng: 104.07, severity: "medium", type: "target", timestamp: Date.now() },
  { id: "ap17", name: "武汉", lat: 30.59, lng: 114.31, severity: "high", type: "target", timestamp: Date.now() },
  { id: "ap18", name: "南京", lat: 32.06, lng: 118.79, severity: "medium", type: "target", timestamp: Date.now() },
]

const TREND_DATA: TrendDataPoint[] = [
  { hour: "00:00", high: 2, medium: 5, low: 8 },
  { hour: "01:00", high: 3, medium: 4, low: 6 },
  { hour: "02:00", high: 5, medium: 7, low: 5 },
  { hour: "03:00", high: 8, medium: 6, low: 4 },
  { hour: "04:00", high: 4, medium: 5, low: 7 },
  { hour: "05:00", high: 6, medium: 8, low: 9 },
  { hour: "06:00", high: 3, medium: 6, low: 11 },
  { hour: "07:00", high: 5, medium: 9, low: 12 },
  { hour: "08:00", high: 7, medium: 11, low: 15 },
  { hour: "09:00", high: 9, medium: 13, low: 10 },
  { hour: "10:00", high: 6, medium: 10, low: 8 },
  { hour: "11:00", high: 4, medium: 8, low: 7 },
  { hour: "12:00", high: 3, medium: 6, low: 9 },
  { hour: "13:00", high: 5, medium: 7, low: 11 },
  { hour: "14:00", high: 7, medium: 9, low: 8 },
  { hour: "15:00", high: 4, medium: 6, low: 10 },
  { hour: "16:00", high: 6, medium: 8, low: 7 },
  { hour: "17:00", high: 8, medium: 10, low: 6 },
  { hour: "18:00", high: 5, medium: 7, low: 9 },
  { hour: "19:00", high: 3, medium: 5, low: 8 },
  { hour: "20:00", high: 4, medium: 6, low: 7 },
  { hour: "21:00", high: 6, medium: 8, low: 5 },
  { hour: "22:00", high: 7, medium: 9, low: 6 },
  { hour: "23:00", high: 5, medium: 7, low: 8 },
]

const ATTACK_TYPES: AttackTypeData[] = [
  { type: "钓鱼攻击", count: 8 },
  { type: "暴力破解", count: 7 },
  { type: "恶意软件", count: 6 },
  { type: "C2通信", count: 6 },
  { type: "数据外泄", count: 5 },
]

const TICKER_THREATS: TickerThreat[] = [
  { id: "t1", time: "10:23:15", type: "钓鱼邮件攻击 - 高仿OA系统", severity: "critical", description: "针对财务部的针对性钓鱼攻击，高仿域名secm1nd.com" },
  { id: "t2", time: "10:20:33", type: "VPN暴力破解攻击", severity: "critical", description: "Tor出口节点发起200+次登录尝试" },
  { id: "t3", time: "10:15:10", type: "VPN异常登录 - 不可能旅行", severity: "high", description: "用户王芳2小时内从北京和莫斯科登录" },
  { id: "t4", time: "10:10:00", type: "Cobalt Strike Beacon通信", severity: "critical", description: "研发部工作站检测到APT攻击C2通道" },
  { id: "t5", time: "10:05:22", type: "Pass-the-Hash横向移动", severity: "critical", description: "攻击者通过PTH访问文件服务器和代码仓库" },
  { id: "t6", time: "09:58:00", type: "数据外泄 - 2.3GB代码外传", severity: "critical", description: "代码仓库数据通过HTTPS加密外传至境外IP" },
  { id: "t7", time: "09:50:15", type: "冒充IT部门密码重置钓鱼", severity: "high", description: "高仿域名secm1nd.com冒充IT部门" },
  { id: "t8", time: "09:45:30", type: "尼日利亚VPN异常登录", severity: "high", description: "市场总监从拉各斯凌晨登录VPN" },
  { id: "t9", time: "09:40:00", type: "WannaCry勒索病毒检测", severity: "critical", description: "运维部工作站检测到勒索病毒变种" },
  { id: "t10", time: "09:35:20", type: "恶意Excel宏代码附件", severity: "high", description: "伪造供应商发票含恶意VBA宏代码" },
  { id: "t11", time: "09:30:00", type: "Emotet木马 - 键盘记录", severity: "high", description: "人事部工作站感染Emotet凭证窃取木马" },
  { id: "t12", time: "09:25:10", type: "BEC攻击 - 冒充CEO转账", severity: "critical", description: "冒充CEO黄强要求财务部紧急转账" },
]

const MITRE_TECHNIQUES: MitreTechnique[] = [
  { id: "T1595", name: "主动扫描", tactic: "reconnaissance", hasAlert: true, alertCount: 3 },
  { id: "T1592", name: "收集信息", tactic: "reconnaissance", hasAlert: false },
  { id: "T1588", name: "获取能力", tactic: "resource-dev", hasAlert: false },
  { id: "T1583", name: "租用基础设施", tactic: "resource-dev", hasAlert: true, alertCount: 1 },
  { id: "T1566", name: "钓鱼邮件", tactic: "initial-access", hasAlert: true, alertCount: 8 },
  { id: "T1190", name: "利用漏洞", tactic: "initial-access", hasAlert: true, alertCount: 2 },
  { id: "T1078", name: "有效账户", tactic: "initial-access", hasAlert: true, alertCount: 3 },
  { id: "T1059", name: "命令脚本", tactic: "execution", hasAlert: true, alertCount: 4 },
  { id: "T1204", name: "用户执行", tactic: "execution", hasAlert: true, alertCount: 2 },
  { id: "T1053", name: "计划任务", tactic: "persistence", hasAlert: true, alertCount: 1 },
  { id: "T1133", name: "外部服务", tactic: "persistence", hasAlert: false },
  { id: "T1068", name: "漏洞利用", tactic: "priv-escalation", hasAlert: true, alertCount: 2 },
  { id: "T1055", name: "进程注入", tactic: "defense-evasion", hasAlert: true, alertCount: 3 },
  { id: "T1070", name: "痕迹清除", tactic: "defense-evasion", hasAlert: false },
  { id: "T1110", name: "暴力破解", tactic: "credential-access", hasAlert: true, alertCount: 7 },
  { id: "T1003", name: "凭证转储", tactic: "credential-access", hasAlert: true, alertCount: 2 },
  { id: "T1558", name: "票据攻击", tactic: "credential-access", hasAlert: true, alertCount: 1 },
  { id: "T1046", name: "网络扫描", tactic: "discovery", hasAlert: true, alertCount: 2 },
  { id: "T1087", name: "账户发现", tactic: "discovery", hasAlert: false },
  { id: "T1021", name: "远程服务", tactic: "lateral-movement", hasAlert: true, alertCount: 6 },
  { id: "T1570", name: "横向传文件", tactic: "lateral-movement", hasAlert: true, alertCount: 2 },
  { id: "T1080", name: "WMI远程", tactic: "lateral-movement", hasAlert: true, alertCount: 3 },
  { id: "T1560", name: "数据打包", tactic: "collection", hasAlert: false },
  { id: "T1005", name: "本地数据", tactic: "collection", hasAlert: true, alertCount: 1 },
  { id: "T1041", name: "C2通道外泄", tactic: "exfiltration", hasAlert: true, alertCount: 5 },
  { id: "T1048", name: "替代协议", tactic: "exfiltration", hasAlert: true, alertCount: 3 },
]

function Panel({
  title,
  children,
  className = "",
  headerRight,
}: {
  title: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
}) {
  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: "rgba(13,21,42,0.85)",
        border: "1px solid rgba(34,211,238,0.1)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{
          borderBottom: "1px solid rgba(34,211,238,0.08)",
          background: "linear-gradient(90deg, rgba(34,211,238,0.06) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-3 rounded-full"
            style={{ backgroundColor: "#22d3ee" }}
          />
          <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
            {title}
          </span>
        </div>
        {headerRight}
      </div>
      <div className="flex-1 p-2 min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

export default function SituationRoomPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [securityScore, setSecurityScore] = useState(62)
  const [previousScore, setPreviousScore] = useState(58)
  const [trendData, setTrendData] = useState(TREND_DATA)
  const [attackPoints, setAttackPoints] = useState(ATTACK_POINTS)
  const [tickerThreats, setTickerThreats] = useState(TICKER_THREATS)
  const [attackTypes, setAttackTypes] = useState(ATTACK_TYPES)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { isConnected } = useRealtimeData()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const refreshData = useCallback(() => {
    setSecurityScore((prev) => {
      const delta = Math.floor(Math.random() * 5) - 2
      const newScore = Math.max(30, Math.min(95, prev + delta))
      setPreviousScore(prev)
      return newScore
    })

    setTrendData((prev) => {
      const last = prev[prev.length - 1]
      const nextHour = String((parseInt(last.hour.split(":")[0]) + 1) % 24).padStart(2, "0") + ":00"
      return [
        ...prev.slice(1),
        {
          hour: nextHour,
          high: Math.max(1, last.high + Math.floor(Math.random() * 3) - 1),
          medium: Math.max(1, last.medium + Math.floor(Math.random() * 3) - 1),
          low: Math.max(1, last.low + Math.floor(Math.random() * 3) - 1),
        },
      ]
    })

    setAttackTypes((prev) =>
      prev.map((item) => ({
        ...item,
        count: Math.max(1, item.count + Math.floor(Math.random() * 3) - 1),
      }))
    )

    setAttackPoints((prev) =>
      prev.map((point) => {
        if (Math.random() > 0.3) return point
        const severities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"]
        return {
          ...point,
          severity: severities[Math.floor(Math.random() * severities.length)],
          timestamp: Date.now(),
        }
      })
    )

    setTickerThreats((prev) => {
      const attackTypeList = [
        "SQL注入攻击", "XSS跨站脚本", "DDoS攻击", "零日漏洞利用",
        "供应链攻击", "DNS隧道通信", "WebShell上传", "Redis未授权访问",
        "SSH暴力破解", "RDP横向移动", "钓鱼邮件", "恶意软件下载",
      ]
      const descriptions = [
        "来自境外IP的自动化攻击尝试", "检测到异常数据包流量", "疑似APT组织攻击行为",
        "内网主机异常外联通信", "用户凭证可能已泄露", "检测到已知漏洞利用特征",
      ]
      const severities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"]
      const newThreat: TickerThreat = {
        id: `rt-${Date.now()}`,
        time: new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: attackTypeList[Math.floor(Math.random() * attackTypeList.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
      }
      return [newThreat, ...prev].slice(0, 30)
    })

    setLastRefresh(Date.now())
  }, [])

  useEffect(() => {
    refreshTimerRef.current = setInterval(refreshData, 5000)
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [refreshData])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour12: false })
  }, [])

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
  }, [])

  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode((prev) => !prev)
  }, [])

  const statsData = createDefaultStats()

  return (
    <div className="flex flex-col h-full w-full select-none">
      {!isPresentationMode && (
        <header
          className="flex items-center justify-between px-6 py-2 shrink-0"
          style={{
            background: "linear-gradient(180deg, rgba(34,211,238,0.08) 0%, transparent 100%)",
            borderBottom: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#22d3ee", boxShadow: "0 0 8px #22d3ee88" }}
              />
              <h1
                className="text-lg font-bold tracking-wide"
                style={{
                  background: "linear-gradient(90deg, #22d3ee, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                SecMind 安全态势中心
              </h1>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isConnected ? "rgba(34,211,238,0.15)" : "rgba(239,68,68,0.15)",
                  color: isConnected ? "#22d3ee" : "#ef4444",
                  border: `1px solid ${isConnected ? "rgba(34,211,238,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                {isConnected ? "● 已连接" : "○ 未连接"}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                自动刷新: 5s
              </span>
              <button
                onClick={refreshData}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <RefreshCw size={10} />
                立即刷新
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.8)" }}>
                {formatTime(currentTime)}
              </div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {formatDate(currentTime)}
              </div>
            </div>

            <button
              onClick={togglePresentationMode}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded transition-all"
              style={{
                color: "rgba(255,255,255,0.6)",
                backgroundColor: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.15)",
              }}
              title="演示模式"
            >
              <Maximize2 size={12} />
              演示模式
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 grid grid-cols-12 grid-rows-5 gap-2 p-2 min-h-0">
        <div className="col-span-4 row-span-2">
          <Panel
            title="全球攻击态势"
            headerRight={
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  攻击源 {attackPoints.filter((p) => p.type === "source").length}
                </span>
                <span className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  目标 {attackPoints.filter((p) => p.type === "target").length}
                </span>
              </div>
            }
          >
            <AttackMap attacks={attackPoints} />
          </Panel>
        </div>

        <div className="col-span-4 row-span-2">
          <Panel
            title="安全评分"
            headerRight={
              <span
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(34,211,238,0.1)", color: "#22d3ee" }}
              >
                实时
              </span>
            }
          >
            <div className="flex items-center justify-center h-full">
              <SecurityScoreGauge
                score={securityScore}
                previousScore={previousScore}
                size={180}
              />
            </div>
          </Panel>
        </div>

        <div className="col-span-4 row-span-2">
          <Panel title="威胁统计">
            <ThreatStatsPanel data={statsData} />
          </Panel>
        </div>

        <div className="col-span-3 row-span-2">
          <Panel title="告警趋势 (24H)">
            <AlertTrendChart data={trendData} />
          </Panel>
        </div>

        <div className="col-span-5 row-span-2">
          <Panel title="MITRE ATT&CK 矩阵">
            <MitreMatrix techniques={MITRE_TECHNIQUES} />
          </Panel>
        </div>

        <div className="col-span-4 row-span-2">
          <Panel title="攻击类型分布 TOP5">
            <AttackTypeChart data={attackTypes} />
          </Panel>
        </div>

        <div className="col-span-12 row-span-1">
          <ThreatTicker threats={tickerThreats} />
        </div>
      </div>

      {!isPresentationMode && (
        <footer
          className="flex items-center justify-between px-6 py-1 shrink-0"
          style={{
            borderTop: "1px solid rgba(34,211,238,0.08)",
            background: "rgba(10,14,39,0.9)",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              SecMind AI SOC Platform v2.2
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              上次刷新: {formatTime(new Date(lastRefresh))}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(34,211,238,0.5)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              系统运行正常
            </span>
            <span className="text-[10px] font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
              CPU 34% | MEM 62% | DISK 51%
            </span>
          </div>
        </footer>
      )}

      {isPresentationMode && (
        <button
          onClick={togglePresentationMode}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 text-[10px] px-3 py-2 rounded-full opacity-30 hover:opacity-100 transition-opacity"
          style={{
            color: "rgba(255,255,255,0.6)",
            backgroundColor: "rgba(10,14,39,0.95)",
            border: "1px solid rgba(34,211,238,0.2)",
            backdropFilter: "blur(8px)",
          }}
          title="退出演示模式"
        >
          <Minimize2 size={12} />
          退出演示
        </button>
      )}
    </div>
  )
}