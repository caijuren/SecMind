"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  ShieldAlert,
  Activity,
  Globe,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react"
import ReactECharts from "echarts-for-react"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { inputClass } from "@/lib/admin-ui"
import {
  TYPOGRAPHY,
  CARD,
  RADIUS,
  getSeverityStyles,
} from "@/lib/design-system"
import { api } from "@/lib/api"

// ==================== 类型定义 ====================

interface KPIItem {
  label: string
  value: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>
  color: string
  trend: string | null
}

interface AlertItem {
  time: string
  source: string
  level: "critical" | "high" | "medium" | "low" | "info"
  message: string
}

interface OverviewSummary {
  total_alerts_today: number
  total_devices: number
  online_devices: number
  device_online_rate: number
  mttd_minutes: number
  mttr_minutes: number
  ai_accuracy: number
  auto_response_rate: number
}

interface HourlyAlert {
  hour: number
  count: number
}

interface AttackType {
  type: string
  count: number
  trend: string
}

interface ThreatRegion {
  region: string
  attacks: number
  top_type: string
}

interface RealtimeEvent {
  id: number
  type: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  source: string
  message: string
  timestamp: string
}

// ==================== 常量 ====================

const REGION_COORDS: Record<string, [number, number]> = {
  "华北": [116.46, 39.92],
  "华东": [121.48, 31.22],
  "华南": [113.27, 23.13],
  "华中": [114.31, 30.52],
  "西南": [104.08, 30.66],
  "西北": [108.95, 34.27],
  "东北": [123.43, 41.80],
}

const ATTACK_TYPE_COLORS = ["#dc2626", "#f59e0b", "#8b5cf6", "#0891b2", "#ec4899", "#94a3b8"]

const SEVERITY_LABEL: Record<string, string> = {
  critical: "严重",
  high: "高危",
  medium: "中危",
  low: "低危",
  info: "信息",
}

const teamStats = [
  { name: "张明远", avatar: "张", cases: 147, accuracy: "97.2%", status: "active" as const },
  { name: "李思涵", avatar: "李", cases: 132, accuracy: "95.6%", status: "busy" as const },
  { name: "王建国", avatar: "王", cases: 128, accuracy: "93.8%", status: "offline" as const },
  { name: "陈雨晴", avatar: "陈", cases: 119, accuracy: "96.4%", status: "active" as const },
  { name: "刘浩然", avatar: "刘", cases: 108, accuracy: "94.1%", status: "busy" as const },
]

const systemHealth = [
  { name: "EDR引擎", status: "normal" as const, load: 67 },
  { name: "NDR探针", status: "warning" as const, load: 85 },
  { name: "邮件网关", status: "normal" as const, load: 45 },
  { name: "DNS过滤", status: "normal" as const, load: 52 },
  { name: "AI推理引擎", status: "normal" as const, load: 73 },
]

// ==================== ECharts 配置 - Linear浅色精致风格 ====================

/** 折线图 - 干净的Linear风格 */
function getLineChartOption(hourlyAlerts: HourlyAlert[]) {
  const hours = hourlyAlerts.map(h => `${String(h.hour).padStart(2, "0")}:00`)
  const counts = hourlyAlerts.map(h => h.count)

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#e4e4e7",
      borderWidth: 1,
      borderRadius: RADIUS.md.replace('rounded-', ''),
      padding: [12, 16],
      textStyle: {
        color: "#18181b",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      axisPointer: {
        lineStyle: { color: "#d4d4d8", width: 1, type: "dashed" },
      },
    },
    legend: {
      data: ["告警总数"],
      top: 10,
      textStyle: {
        color: "#71717a",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      itemWidth: 20,
      itemHeight: 3,
      itemGap: 24,
    },
    grid: { top: 60, right: 30, bottom: 50, left: 60, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: hours,
      axisLine: { lineStyle: { color: "#e4e4e7", width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 12,
        interval: 3,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      splitLine: { lineStyle: { color: "#f4f4f5", type: "dashed" } },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#a1a1aa",
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      splitLine: { lineStyle: { color: "#f4f4f5", type: "dashed" } },
    },
    series: [
      {
        name: "告警总数",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: counts,
        lineStyle: { color: "#0891b2", width: 2.5 },
        itemStyle: { color: "#0891b2", borderColor: "#ffffff", borderWidth: 2 },
        areaStyle: {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(8,145,178,0.12)" }, { offset: 1, color: "rgba(8,145,178,0.01)" }] }
        },
      },
    ],
  }
}

/** 饼图 - 精致的环形设计 */
function getPieChartOption(attackTypes: AttackType[]) {
  const pieData = attackTypes.map((item, idx) => ({
    name: item.type,
    value: item.count,
    itemStyle: { color: ATTACK_TYPE_COLORS[idx % ATTACK_TYPE_COLORS.length] },
  }))

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#ffffff",
      borderColor: "#e4e4e7",
      borderWidth: 1,
      borderRadius: RADIUS.md.replace('rounded-', ''),
      padding: [12, 16],
      textStyle: { color: "#18181b", fontSize: 13, fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      formatter: "{b}: <strong>{c}</strong> ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      textStyle: { color: "#71717a", fontSize: 13, fontWeight: 500, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      itemWidth: 16,
      itemHeight: 16,
      itemGap: 16,
      icon: "roundRect",
    },
    series: [{
      type: "pie",
      radius: ["48%", "72%"],
      center: ["40%", "50%"],
      avoidLabelOverlap: true,
      padAngle: 2,
      itemStyle: { borderRadius: 8, borderColor: "#ffffff", borderWidth: 3 },
      label: {
        show: true,
        position: "outside",
        color: "#52525b",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        formatter: "{b}\n{d}%",
      },
      emphasis: {
        label: { show: true, fontSize: 15, fontWeight: "bold" },
        itemStyle: { shadowBlur: 20, shadowColor: "rgba(0,0,0,0.1)", shadowOffsetX: 0, shadowOffsetY: 4 },
      },
      labelLine: { show: true, lineStyle: { color: "#d4d4d8", width: 1.5 } },
      data: pieData,
    }],
  }
}

/** 柱状图 - 渐变+圆角 */
function getBarChartOption(hourlyAlerts: HourlyAlert[]) {
  const hours = hourlyAlerts.map(h => `${String(h.hour).padStart(2, "0")}:00`)
  const values = hourlyAlerts.map(h => h.count)
  
  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#e4e4e7",
      borderWidth: 1,
      borderRadius: RADIUS.md.replace('rounded-', ''),
      padding: [12, 16],
      textStyle: { color: "#18181b", fontSize: 13, fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(8,145,178,0.06)" } },
    },
    grid: { top: 30, right: 30, bottom: 50, left: 60, containLabel: true },
    xAxis: {
      type: "category",
      data: hours,
      axisLine: { lineStyle: { color: "#e4e4e7", width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, interval: 3, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      splitLine: { lineStyle: { color: "#f4f4f5", type: "dashed" } },
    },
    series: [{
      type: "bar",
      barWidth: "55%",
      data: values.map(val => ({
        value: val,
        itemStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: "#0891b2" }, { offset: 1, color: "#67e8f9" }]
          },
          borderRadius: [4, 4, 0, 0],
        },
      })),
      emphasis: {
        itemStyle: {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#0e7490" }, { offset: 1, color: "#22d3ee" }] },
          shadowBlur: 16,
          shadowColor: "rgba(8,145,178,0.25)",
          shadowOffsetY: 4,
        },
      },
    }],
  }
}

/** 地图 - 散点图替代（无需GeoJSON） */
function getMapOption(regions: ThreatRegion[]) {
  const mapData = regions
    .filter(r => REGION_COORDS[r.region])
    .map(r => ({
      name: r.region,
      value: [...REGION_COORDS[r.region], r.attacks],
      topType: r.top_type,
    }))

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "#ffffff",
      borderColor: "#e4e4e7",
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: "#18181b", fontSize: 13, fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      formatter: (params: any) => params.data ? `<div style="font-size:13px;font-weight:600;margin-bottom:4px">${params.data.name}</div><div style="color:#71717a;font-size:12px">告警数: <strong style="color:#0891b2">${params.data.value[2]}</strong></div><div style="color:#71717a;font-size:12px">主要威胁: <strong style="color:#ef4444">${params.data.topType}</strong></div>` : params.name,
    },
    xAxis: {
      show: false,
      min: 73, max: 136,
    },
    yAxis: {
      show: false,
      min: 18, max: 54,
    },
    grid: { left: 10, right: 10, top: 10, bottom: 10 },
    series: [{
      name: "告警分布",
      type: "effectScatter",
      data: mapData,
      symbolSize: (val: number[]) => Math.max(Math.sqrt(val[2]) * 2.5, 14),
      showEffectOn: "render",
      rippleEffect: { brushType: "stroke", scale: 4, period: 4 },
      itemStyle: { color: "#0891b2", shadowBlur: 16, shadowColor: "rgba(8,145,178,0.4)" },
      label: {
        show: true,
        formatter: "{b}",
        position: "right",
        color: "#334155",
        fontSize: 12,
        fontWeight: 600,
      },
      zlevel: 1,
    }],
  }
}

// ==================== 组件 ====================

/** KPI卡片 - 浅色精致版 */
function DashboardKPICard({ item }: { item: KPIItem }) {
  const Icon = item.icon
  
  return (
    <Card className={CARD.elevated + " group hover:border-slate-300 transition-colors duration-200"}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="flex size-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${item.color}08`, border: `1px solid ${item.color}18` }}
            >
              <Icon className="size-5" style={{ color: item.color }} />
            </div>
            <span className={String(TYPOGRAPHY.caption) + " text-slate-500 uppercase tracking-wide font-medium"}>
              {item.label}
            </span>
          </div>
          
          {item.trend && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold",
              item.trend.startsWith("+") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            )}>
              <ArrowUpRight className="size-3.5" />
              {item.trend}
            </span>
          )}
        </div>

        <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
          {item.value}
        </div>
        
        <div className={String(TYPOGRAPHY.micro) + " text-slate-400 mt-1"}>实时更新</div>
      </CardContent>
    </Card>
  )
}

/** 告警列表项 */
function AlertListItem({ alert }: { alert: AlertItem }) {
  const severity = getSeverityStyles(alert.level === "info" ? "low" : alert.level)
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150",
      "hover:bg-slate-50 border border-transparent hover:border-slate-200"
    )}>
      <span className={String(TYPOGRAPHY.caption) + "font-mono text-slate-400 w-20 shrink-0 tabular-nums"}>
        {alert.time}
      </span>
      
      <span className={String(TYPOGRAPHY.body) + "text-slate-500 w-14 shrink-0 font-medium"}>
        {alert.source}
      </span>
      
      <span className={cn(
        "shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
        severity.bg, severity.textColor, severity.borderColor
      )}>
        {SEVERITY_LABEL[alert.level] ?? alert.level}
      </span>
      
      <span className={String(TYPOGRAPHY.body) + "text-slate-700 truncate flex-1 ml-1"}>
        {alert.message}
      </span>
    </div>
  )
}

/** 团队成员卡片 */
function TeamMemberCard({ member }: { member: typeof teamStats[number] }) {
  const statusColors = { active: "bg-emerald-500", busy: "bg-amber-500", offline: "bg-slate-300" }

  return (
    <Card className={CARD.base + " p-3.5 hover:border-slate-300 transition-colors"}>
      <CardContent className="p-0 flex items-center gap-3">
        <div className="relative shrink-0">
          <div 
            className="flex size-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: "#0891b210", color: "#0891b2" }}
          >
            {member.avatar}
          </div>
          <div className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white", statusColors[member.status])} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={String(TYPOGRAPHY.body) + "text-slate-800 font-medium truncate"}>
            {member.name}
          </div>
          <div className={String(TYPOGRAPHY.caption) + "text-slate-500 mt-0.5"}>
            {member.cases}件 · {member.accuracy}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** 系统健康指示器 */
function HealthIndicator({ item }: { item: typeof systemHealth[number] }) {
  const statusColors = { normal: "from-emerald-500 to-emerald-400", warning: "from-amber-500 to-amber-400", error: "from-red-500 to-red-400" }

  return (
    <div className="flex items-center gap-3">
      <span className={String(TYPOGRAPHY.body) + "text-slate-700 w-24 truncate font-medium"}>
        {item.name}
      </span>
      
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-500", statusColors[item.status])}
          style={{ width: `${item.load}%` }}
        />
      </div>
      
      <span className={String(TYPOGRAPHY.caption) + "text-slate-400 w-10 text-right font-mono tabular-nums"}>
        {item.load}%
      </span>
    </div>
  )
}

// ==================== 主页面 ====================

export default function ScreenPage() {
  useLocaleStore()
  const [timeRange, setTimeRange] = useState("today")
  const [summary, setSummary] = useState<OverviewSummary | null>(null)
  const [hourlyAlerts, setHourlyAlerts] = useState<HourlyAlert[]>([])
  const [attackTypes, setAttackTypes] = useState<AttackType[]>([])
  const [regions, setRegions] = useState<ThreatRegion[]>([])
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, threatMapRes, realtimeRes] = await Promise.all([
        api.get("/situation/overview"),
        api.get("/situation/threat-map"),
        api.get("/situation/realtime-feed"),
      ])
      const overview = overviewRes.data
      setSummary(overview.summary)
      setHourlyAlerts(overview.hourly_alerts ?? [])
      setAttackTypes(overview.attack_types ?? [])
      setRegions(threatMapRes.data.regions ?? [])
      setRealtimeEvents(realtimeRes.data.events ?? [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error("获取态势数据失败:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const kpiData: KPIItem[] = summary ? [
    { label: "今日告警", value: String(summary.total_alerts_today), icon: AlertTriangle, color: "#dc2626", trend: null },
    { label: "设备在线率", value: `${(summary.device_online_rate * 100).toFixed(1)}%`, icon: Globe, color: "#0891b2", trend: null },
    { label: "MTTD", value: `${summary.mttd_minutes}分钟`, icon: Clock, color: "#ea580c", trend: null },
    { label: "自动处置率", value: `${(summary.auto_response_rate * 100).toFixed(1)}%`, icon: CheckCircle2, color: "#16a34a", trend: null },
  ] : []

  const realtimeAlerts: AlertItem[] = realtimeEvents.map(e => ({
    time: new Date(e.timestamp).toLocaleTimeString("zh-CN", { hour12: false }),
    source: e.source,
    level: e.severity,
    message: e.message,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="安全运营态势大屏"
        subtitle="SecMind Security Operations Center - Real-time Threat Monitoring"
        actions={
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v ?? "today")}>
              <SelectTrigger size="sm" className={`w-32 ${inputClass}`} aria-label="时间范围">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={fetchData}
              disabled={loading}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold",
                "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              刷新数据
            </button>
            
            <Badge variant="outline" className={cn("gap-1.5 px-3 py-1.5", "border-emerald-200 text-emerald-700")}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              实时监控中
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <DashboardKPICard key={kpi.label} item={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <Card className={CARD.elevated + " h-full"}>
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="size-5 text-primary" />
                <h2 className={String(TYPOGRAPHY.h2)}>全国威胁分布</h2>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                <ReactECharts option={getMapOption(regions)} style={{ height: "100%" }} opts={{ renderer: "canvas" }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4">
          <Card className={CARD.elevated + " h-full"}>
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-5 text-primary" />
                <h2 className={String(TYPOGRAPHY.h2)}>24小时攻击趋势</h2>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                <ReactECharts option={getLineChartOption(hourlyAlerts)} style={{ height: "100%" }} opts={{ renderer: "canvas" }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className={CARD.elevated + " h-full"}>
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="size-5 text-primary" />
                <h2 className={String(TYPOGRAPHY.h2)}>威胁类型分布</h2>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                <ReactECharts option={getPieChartOption(attackTypes)} style={{ height: "100%" }} opts={{ renderer: "canvas" }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <Card className={CARD.elevated + " h-full"}>
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                  </div>
                  <Eye className="size-5 text-primary" />
                  <h2 className={String(TYPOGRAPHY.h2)}>实时告警流</h2>
                </div>
                
                <Badge variant="outline" className={cn("border-red-200 text-red-600", TYPOGRAPHY.caption)}>
                  最近 {Math.min(realtimeAlerts.length, 8)} 条
                </Badge>
              </div>
              
              <div className="flex-1 space-y-1 overflow-hidden">
                {realtimeAlerts.length > 0 ? (
                  realtimeAlerts.slice(0, 8).map((alert, index) => (
                    <AlertListItem key={`${alert.time}-${index}`} alert={alert} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />加载中...</span>
                    ) : (
                      "暂无实时告警"
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-5 space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="size-5 text-primary" />
                <h2 className={String(TYPOGRAPHY.h2)}>团队在线状态</h2>
              </div>
              
              <div className="space-y-2">
                {teamStats.map((member) => (
                  <TeamMemberCard key={member.name} member={member} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="size-5 text-primary" />
                <h2 className={String(TYPOGRAPHY.h2)}>系统健康状态</h2>
              </div>
              
              <div className="space-y-3">
                {systemHealth.map((item) => (
                  <HealthIndicator key={item.name} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={cn(
        "flex items-center justify-between px-5 py-3",
        CARD.base
      )}>
        <div className="flex items-center gap-6">
          <span className={String(TYPOGRAPHY.caption) + "text-slate-500"}>
            SecMind AI SOC Platform v2.0 | 刷新间隔: 30s
          </span>
          {lastUpdated && (
            <span className={String(TYPOGRAPHY.caption) + "text-slate-400"}>
              上次更新: {lastUpdated.toLocaleTimeString("zh-CN", { hour12: false })}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <span className={String(TYPOGRAPHY.caption) + "text-slate-500 flex items-center gap-1.5"}>
            <CheckCircle2 className="size-3.5 text-emerald-500 animate-pulse" />
            系统正常
          </span>
          
          <span className={String(TYPOGRAPHY.caption) + "text-slate-500"}>
            内存: 62% | CPU: 34% | 磁盘: 51%
          </span>
          
          <Clock className="size-4 text-slate-400" />
          <time dateTime={new Date().toISOString()} className={String(TYPOGRAPHY.caption) + "font-mono text-slate-400 tabular-nums"} suppressHydrationWarning>
            {new Date().toLocaleTimeString("zh-CN")}
          </time>
        </div>
      </div>
    </div>
  )
}
