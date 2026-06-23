"use client"

import { useState, useMemo } from "react"
import {
  Shield,
  Search,
  Plus,
  Server,
  Network,
  Lock,
  Monitor,
  Database,
  Cloud,
  Eye,
  Trash2,
  BarChart3,
  Download,
  Activity,
  Gauge,
  Cpu,
  CircleDot,
  ArrowUpRight,
  ArrowDownRight,
  ScanLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { TablePagination } from "@/components/layout/table-pagination"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useLocaleStore } from "@/store/locale-store"
import { usePageTitle } from "@/hooks/use-page-title"
import { inputClass, pageCardClass } from "@/lib/admin-ui"
import { useToast } from "@/components/ui/toast"

type AssetType = "服务器" | "网络设备" | "安全设备" | "终端" | "数据库" | "云资源" | "中间件" | "容器" | "物联网设备" | "自定义"
type RiskGrade = "高" | "中" | "低"
type AssetStatus = "online" | "offline" | "scanning"

interface Asset {
  id: string
  name: string
  ip: string
  type: AssetType
  customType?: string
  department: string
  owner: string
  riskScore: number
  riskGrade: RiskGrade
  alerts: number
  lastScan: string
  status: AssetStatus
  os?: string
  location?: string
  description?: string
  trend: number[] // 风险趋势 sparkline 数据
}

const ASSET_TYPE_CONFIG: Record<AssetType, { icon: typeof Server; color: string; bg: string; ring: string; dot: string; hex: string }> = {
  "服务器": { icon: Server, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20", ring: "ring-cyan-400/20", dot: "bg-cyan-500", hex: "#06b6d4" },
  "网络设备": { icon: Network, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", ring: "ring-blue-400/20", dot: "bg-blue-500", hex: "#3b82f6" },
  "安全设备": { icon: Lock, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", ring: "ring-purple-400/20", dot: "bg-purple-500", hex: "#a855f7" },
  "终端": { icon: Monitor, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", ring: "ring-amber-400/20", dot: "bg-amber-500", hex: "#f59e0b" },
  "数据库": { icon: Database, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", ring: "ring-emerald-400/20", dot: "bg-emerald-500", hex: "#10b981" },
  "云资源": { icon: Cloud, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-400/10 border-pink-400/20", ring: "ring-pink-400/20", dot: "bg-pink-500", hex: "#ec4899" },
  "中间件": { icon: Gauge, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/20", ring: "ring-indigo-400/20", dot: "bg-indigo-500", hex: "#6366f1" },
  "容器": { icon: CircleDot, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", ring: "ring-sky-400/20", dot: "bg-sky-500", hex: "#0ea5e9" },
  "物联网设备": { icon: Activity, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-400/10 border-teal-400/20", ring: "ring-teal-400/20", dot: "bg-teal-500", hex: "#14b8a6" },
  "自定义": { icon: Cpu, color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-400/10 border-zinc-400/20", ring: "ring-zinc-400/20", dot: "bg-zinc-500", hex: "#71717a" },
}

const ASSET_TYPE_KEY: Record<AssetType, string> = {
  "服务器": "assets.typeServer",
  "网络设备": "assets.typeNetworkDevice",
  "安全设备": "assets.typeSecurityDevice",
  "终端": "assets.typeTerminal",
  "数据库": "assets.typeDatabase",
  "云资源": "assets.typeCloudResource",
  "中间件": "assets.typeMiddleware",
  "容器": "assets.typeContainer",
  "物联网设备": "assets.typeIoT",
  "自定义": "assets.typeCustom",
}

const ASSET_TYPES: AssetType[] = ["服务器", "网络设备", "安全设备", "终端", "数据库", "云资源", "中间件", "容器", "物联网设备", "自定义"]

const STATUS_CONFIG: Record<AssetStatus, { color: string; pulse: boolean; label: string }> = {
  online: { color: "bg-emerald-500", pulse: true, label: "assets.online" },
  offline: { color: "bg-zinc-400", pulse: false, label: "assets.offline" },
  scanning: { color: "bg-cyan-500", pulse: true, label: "assets.scanning" },
}

// 生成趋势数据（模拟最近 7 个时间点的风险评分变化）
// 使用确定性算法避免 SSR/CSR hydration mismatch
function genTrend(base: number): number[] {
  const points: number[] = []
  let v = base - 15
  for (let i = 0; i < 7; i++) {
    // 使用基于 base 和 i 的确定性偏移，避免 Math.random() 导致 hydration mismatch
    const offset = ((base * 7 + i * 13 + 3) % 25) - 12
    v += offset
    v = Math.max(10, Math.min(100, v))
    points.push(v)
  }
  points.push(base)
  return points
}

const mockAssets: Asset[] = [
  { id: "AST-001", name: "核心业务服务器-01", ip: "10.0.1.10", type: "服务器", department: "技术部", owner: "张伟", riskScore: 92, riskGrade: "高", alerts: 15, lastScan: "2026-05-10 09:30", status: "online", trend: genTrend(92) },
  { id: "AST-002", name: "数据库主节点-MySQL", ip: "10.0.1.20", type: "数据库", department: "数据部", owner: "李娜", riskScore: 87, riskGrade: "高", alerts: 12, lastScan: "2026-05-10 09:15", status: "online", trend: genTrend(87) },
  { id: "AST-003", name: "核心交换机-SW01", ip: "10.0.0.1", type: "网络设备", department: "网络部", owner: "王强", riskScore: 78, riskGrade: "高", alerts: 8, lastScan: "2026-05-10 08:45", status: "online", trend: genTrend(78) },
  { id: "AST-004", name: "防火墙-FW-主", ip: "10.0.0.254", type: "安全设备", department: "安全部", owner: "赵敏", riskScore: 65, riskGrade: "中", alerts: 5, lastScan: "2026-05-10 09:00", status: "scanning", trend: genTrend(65) },
  { id: "AST-005", name: "开发终端-DEV-15", ip: "10.0.3.115", type: "终端", department: "研发部", owner: "陈浩", riskScore: 58, riskGrade: "中", alerts: 3, lastScan: "2026-05-10 08:30", status: "online", trend: genTrend(58) },
  { id: "AST-006", name: "云服务器-ECS-Prod", ip: "47.102.33.88", type: "云资源", department: "运维部", owner: "刘洋", riskScore: 81, riskGrade: "高", alerts: 9, lastScan: "2026-05-10 09:20", status: "online", trend: genTrend(81) },
  { id: "AST-007", name: "Web应用服务器-02", ip: "10.0.1.11", type: "服务器", department: "技术部", owner: "张伟", riskScore: 73, riskGrade: "中", alerts: 6, lastScan: "2026-05-10 08:50", status: "online", trend: genTrend(73) },
  { id: "AST-008", name: "IDS入侵检测系统", ip: "10.0.0.253", type: "安全设备", department: "安全部", owner: "赵敏", riskScore: 42, riskGrade: "低", alerts: 1, lastScan: "2026-05-10 09:10", status: "online", trend: genTrend(42) },
  { id: "AST-009", name: "汇聚交换机-SW02", ip: "10.0.0.2", type: "网络设备", department: "网络部", owner: "王强", riskScore: 35, riskGrade: "低", alerts: 0, lastScan: "2026-05-10 07:30", status: "offline", trend: genTrend(35) },
  { id: "AST-010", name: "财务终端-FIN-03", ip: "10.0.4.23", type: "终端", department: "财务部", owner: "孙丽", riskScore: 68, riskGrade: "中", alerts: 4, lastScan: "2026-05-10 08:20", status: "online", trend: genTrend(68) },
  { id: "AST-011", name: "Redis缓存集群", ip: "10.0.1.30", type: "数据库", department: "数据部", owner: "李娜", riskScore: 55, riskGrade: "中", alerts: 2, lastScan: "2026-05-10 09:05", status: "online", trend: genTrend(55) },
  { id: "AST-012", name: "VPN网关设备", ip: "10.0.0.250", type: "安全设备", department: "安全部", owner: "赵敏", riskScore: 89, riskGrade: "高", alerts: 11, lastScan: "2026-05-10 09:25", status: "online", trend: genTrend(89) },
  { id: "AST-013", name: "对象存储-OSS", ip: "oss-cn-hangzhou.aliyuncs.com", type: "云资源", department: "运维部", owner: "刘洋", riskScore: 47, riskGrade: "低", alerts: 1, lastScan: "2026-05-10 08:00", status: "online", trend: genTrend(47) },
  { id: "AST-014", name: "邮件服务器-Mail", ip: "10.0.1.40", type: "服务器", department: "技术部", owner: "周磊", riskScore: 76, riskGrade: "中", alerts: 7, lastScan: "2026-05-10 08:55", status: "scanning", trend: genTrend(76) },
  { id: "AST-015", name: "无线AP控制器", ip: "10.0.0.3", type: "网络设备", department: "网络部", owner: "王强", riskScore: 28, riskGrade: "低", alerts: 0, lastScan: "2026-05-10 07:45", status: "online", trend: genTrend(28) },
  { id: "AST-016", name: "CEO办公终端", ip: "10.0.5.10", type: "终端", department: "管理层", owner: "黄总", riskScore: 85, riskGrade: "高", alerts: 10, lastScan: "2026-05-10 09:22", status: "online", trend: genTrend(85) },
  { id: "AST-017", name: "K8s容器集群", ip: "10.0.2.100", type: "云资源", department: "运维部", owner: "刘洋", riskScore: 71, riskGrade: "中", alerts: 5, lastScan: "2026-05-10 09:18", status: "online", trend: genTrend(71) },
  { id: "AST-018", name: "日志审计服务器", ip: "10.0.1.50", type: "服务器", department: "安全部", owner: "赵敏", riskScore: 38, riskGrade: "低", alerts: 1, lastScan: "2026-05-10 07:50", status: "online", trend: genTrend(38) },
]

function getRiskBarColor(score: number): string {
  if (score >= 80) return "bg-red-500"
  if (score >= 60) return "bg-orange-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-green-500"
}

function getRiskTextColor(score: number): string {
  if (score >= 80) return "text-red-600 dark:text-red-400"
  if (score >= 60) return "text-orange-600 dark:text-orange-400"
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400"
  return "text-green-600 dark:text-green-400"
}

function getRiskHex(score: number): string {
  if (score >= 80) return "#ef4444"
  if (score >= 60) return "#f97316"
  if (score >= 40) return "#eab308"
  return "#22c55e"
}

// ==================== Sparkline 迷你趋势图 ====================

function Sparkline({ data, color, width = 56, height = 18 }: { data: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const pathD = `M ${points.join(" L ")}`
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`
  const lastVal = data[data.length - 1]
  const prevVal = data[data.length - 2] || lastVal
  const isUp = lastVal >= prevVal

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((lastVal - min) / range) * (height - 2) - 1} r="1.5" fill={color} />
      {isUp ? (
        <ArrowUpRight x={width + 2} y={0} className="size-2.5" style={{ color }} />
      ) : (
        <ArrowDownRight x={width + 2} y={0} className="size-2.5" style={{ color }} />
      )}
    </svg>
  )
}

// ==================== HUD 角标装饰 ====================

function HudCorners({ color }: { color: string }) {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 size-2 border-l border-t" style={{ borderColor: color }} />
      <span className="pointer-events-none absolute right-0 top-0 size-2 border-r border-t" style={{ borderColor: color }} />
      <span className="pointer-events-none absolute bottom-0 left-0 size-2 border-b border-l" style={{ borderColor: color }} />
      <span className="pointer-events-none absolute bottom-0 right-0 size-2 border-b border-r" style={{ borderColor: color }} />
    </>
  )
}

// ==================== KPI 卡片 ====================

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  unit?: string
  accent: string
  children?: React.ReactNode
  delay?: number
}

function KpiCard({ icon: Icon, label, value, unit, accent, children, delay = 0 }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "stagger-item relative overflow-hidden border-border bg-card shadow-sm",
        "transition-colors duration-200 hover:border-primary/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="relative p-4">
        {/* 顶部装饰渐变线 */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-70"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        {/* 背景网格纹理 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(${accent}50 1px, transparent 1px), linear-gradient(90deg, ${accent}50 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }}
        />
        <HudCorners color={`${accent}40`} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex size-7 items-center justify-center rounded-md ring-1"
              style={{ backgroundColor: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}30` }}
            >
              <Icon className="size-3.5" />
            </div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
          </div>
        </div>
        <div className="relative mt-3 flex items-baseline gap-1.5">
          <span
            className="font-mono text-[28px] font-bold tabular-nums leading-none tracking-tight"
            style={{ color: accent }}
          >
            {value}
          </span>
          {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
        </div>
        {children && <div className="relative mt-3">{children}</div>}
      </CardContent>
    </Card>
  )
}

// ==================== 类型筛选 Chip ====================

interface TypeChipProps {
  active: boolean
  label: string
  count: number
  icon: React.ElementType
  color: string
  onClick: () => void
}

function TypeChip({ active, label, count, icon: Icon, color, onClick }: TypeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
        active
          ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="size-3" style={{ color: active ? undefined : color }} />
      <span>{label}</span>
      <span className={cn("rounded-full px-1.5 py-px font-mono text-[10px] tabular-nums", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </button>
  )
}

// ==================== 主页面 ====================

export function AssetsPage() {
  usePageTitle("assets")
  const { t } = useLocaleStore()
  const [activeTypeFilter, setActiveTypeFilter] = useState<AssetType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    type: "服务器" as AssetType,
    customType: "",
    department: "",
    owner: "",
    os: "",
    location: "",
    description: "",
    riskGrade: "中" as RiskGrade,
  })
  const { toast } = useToast()

  // ---------- 导出 CSV ----------
  const handleExportCSV = () => {
    const headers = ["ID", "名称", "IP", "类型", "部门", "负责人", "风险评分", "风险等级", "告警数", "最近扫描", "状态"]
    const rows = filteredAssets.map((a) => [
      a.id, a.name, a.ip, a.type, a.department, a.owner,
      String(a.riskScore), a.riskGrade, String(a.alerts), a.lastScan, a.status,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `资产列表_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast("导出成功", "success")
  }

  // ---------- 立即扫描 ----------
  const handleScanNow = () => {
    toast("正在扫描资产...", "info")
    setTimeout(() => {
      toast("扫描完成", "success")
    }, 2000)
  }

  // ---------- 统计 ----------
  const stats = useMemo(() => {
    const total = mockAssets.length
    const high = mockAssets.filter((a) => a.riskGrade === "高").length
    const medium = mockAssets.filter((a) => a.riskGrade === "中").length
    const low = mockAssets.filter((a) => a.riskGrade === "低").length
    const alerts = mockAssets.reduce((sum, a) => sum + a.alerts, 0)
    const avgRisk = Math.round(mockAssets.reduce((sum, a) => sum + a.riskScore, 0) / total)
    const online = mockAssets.filter((a) => a.status === "online").length
    const typeCounts = ASSET_TYPES.reduce((acc, type) => {
      acc[type] = mockAssets.filter((a) => a.type === type).length
      return acc
    }, {} as Record<AssetType, number>)
    // 健康度 = 100 - 平均风险
    const health = 100 - avgRisk
    // 全局趋势
    const globalTrend = mockAssets.reduce((acc, a) => {
      a.trend.forEach((v, i) => {
        acc[i] = (acc[i] || 0) + v
      })
      return acc
    }, [] as number[]).map((v) => Math.round(v / total))
    return { total, high, medium, low, alerts, avgRisk, online, typeCounts, health, globalTrend }
  }, [])

  // ---------- 筛选 ----------
  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      if (activeTypeFilter !== "all" && asset.type !== activeTypeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          asset.name.toLowerCase().includes(q) ||
          asset.ip.toLowerCase().includes(q) ||
          asset.department.toLowerCase().includes(q) ||
          asset.owner.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [activeTypeFilter, searchQuery])

  // ---------- 分页 ----------
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedAssets = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredAssets.slice(start, start + pageSize)
  }, [filteredAssets, safePage, pageSize])

  // ---------- 风险分布（按类型） ----------
  const typeRiskDistribution = useMemo(() => {
    return ASSET_TYPES.map((type) => {
      const items = mockAssets.filter((a) => a.type === type)
      const high = items.filter((a) => a.riskGrade === "高").length
      const medium = items.filter((a) => a.riskGrade === "中").length
      const low = items.filter((a) => a.riskGrade === "低").length
      const avgScore = items.length > 0 ? Math.round(items.reduce((s, a) => s + a.riskScore, 0) / items.length) : 0
      return { type, total: items.length, high, medium, low, avgScore }
    })
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Server}
        title={t("nav.assets")}
        subtitle={t("assets.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{t("assets.exportAssets")}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleScanNow}>
              <ScanLine className="size-3.5" />
              <span className="hidden sm:inline">{t("assets.scanNow")}</span>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" />
              {t("assets.addAsset")}
            </Button>
          </div>
        }
      />

      {/* ==================== KPI 指标条 ==================== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Server}
          label={t("assets.totalAssets")}
          value={stats.total}
          accent="#06b6d4"
          delay={0}
        >
          {/* 类型分布迷你条 */}
          <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
            {ASSET_TYPES.map((type) => {
              const cfg = ASSET_TYPE_CONFIG[type]
              const count = stats.typeCounts[type]
              const width = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div
                  key={type}
                  className={cn("h-full transition-all duration-500", cfg.dot)}
                  style={{ width: `${width}%` }}
                  title={`${t(ASSET_TYPE_KEY[type])}: ${count}`}
                />
              )
            })}
          </div>
        </KpiCard>

        <KpiCard
          icon={Activity}
          label={t("assets.activeAlerts")}
          value={stats.alerts}
          accent="#ef4444"
          delay={60}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              {stats.alerts > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              )}
              <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {stats.high} {t("assets.riskLevelHigh")}
            </span>
          </div>
        </KpiCard>

        <KpiCard
          icon={Gauge}
          label={t("assets.avgRiskScore")}
          value={stats.avgRisk}
          unit="/ 100"
          accent={getRiskHex(stats.avgRisk)}
          delay={120}
        >
          {/* 风险刻度条 */}
          <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn("h-full rounded-full transition-all duration-700", getRiskBarColor(stats.avgRisk))}
              style={{ width: `${stats.avgRisk}%` }}
            />
          </div>
        </KpiCard>

        <KpiCard
          icon={Shield}
          label={t("assets.healthScore")}
          value={stats.health}
          unit="/ 100"
          accent={stats.health >= 60 ? "#22c55e" : stats.health >= 40 ? "#f97316" : "#ef4444"}
          delay={180}
        >
          {/* 全局趋势 Sparkline */}
          <div className="flex items-center justify-between">
            <Sparkline data={stats.globalTrend} color={stats.health >= 60 ? "#22c55e" : stats.health >= 40 ? "#f97316" : "#ef4444"} width={48} height={16} />
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <CircleDot className="size-2.5 text-emerald-500" />
                {stats.online}
              </span>
              <span className="text-muted-foreground/60">/ {stats.total - stats.online}</span>
            </div>
          </div>
        </KpiCard>
      </div>

      {/* ==================== 命令栏：风险筛选 + 类型筛选 + 搜索 ==================== */}
      <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* 类型筛选 */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 lg:pb-0">
              <TypeChip
                active={activeTypeFilter === "all"}
                label={t("assets.allTypes")}
                count={stats.total}
                icon={Cpu}
                color="#06b6d4"
                onClick={() => { setActiveTypeFilter("all"); setCurrentPage(1) }}
              />
              {ASSET_TYPES.map((type) => {
                const cfg = ASSET_TYPE_CONFIG[type]
                return (
                  <TypeChip
                    key={type}
                    active={activeTypeFilter === type}
                    label={t(ASSET_TYPE_KEY[type])}
                    count={stats.typeCounts[type]}
                    icon={cfg.icon}
                    color={cfg.hex}
                    onClick={() => { setActiveTypeFilter(type); setCurrentPage(1) }}
                  />
                )
              })}
            </div>
            {/* 搜索 */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("assets.searchPlaceholder")}
                aria-label={t("assets.searchAriaLabel")}
                className={cn("h-8 pl-9", inputClass)}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              />
            </div>
          </div>
      </div>

      {/* ==================== 资产表格 ==================== */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
                <Search className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{t("assets.noAssetsFound")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("assets.noAssetsFoundDesc")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colName")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colIP")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colType")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colDepartment")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colOwner")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colRiskScore")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colAlerts")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colLastScan")}</th>
                      <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.map((asset) => {
                      const typeConfig = ASSET_TYPE_CONFIG[asset.type]
                      const TypeIcon = typeConfig.icon
                      const statusCfg = STATUS_CONFIG[asset.status]
                      const riskHex = getRiskHex(asset.riskScore)
                      return (
                        <tr
                          key={asset.id}
                          className={cn(
                            "group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0",
                            asset.riskGrade === "高" && "bg-red-400/[0.02] hover:bg-red-400/[0.05]"
                          )}
                        >
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              {/* 状态指示灯 */}
                              <span className="relative flex size-2 shrink-0">
                                {statusCfg.pulse && (
                                  <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", statusCfg.color)} />
                                )}
                                <span className={cn("relative inline-flex size-2 rounded-full", statusCfg.color)} />
                              </span>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-md ring-1", typeConfig.bg, typeConfig.ring)}>
                                  <TypeIcon className={cn("size-3", typeConfig.color)} />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-foreground">{asset.name}</div>
                                  <div className="font-mono text-[10px] text-muted-foreground">{asset.id}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono text-xs text-muted-foreground">{asset.ip}</td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", typeConfig.bg, typeConfig.color)}>
                              <TypeIcon className="size-2.5" />
                              {t(ASSET_TYPE_KEY[asset.type])}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-muted-foreground">{asset.department}</td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap text-xs text-muted-foreground">{asset.owner}</td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2 min-w-[140px]">
                              {/* 风险趋势 Sparkline */}
                              <Sparkline data={asset.trend} color={riskHex} width={48} height={16} />
                              <div className="flex flex-1 items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                                  <div
                                    className={cn("h-full rounded-full transition-all duration-500", getRiskBarColor(asset.riskScore))}
                                    style={{ width: `${asset.riskScore}%` }}
                                  />
                                </div>
                                <span className={cn("font-mono text-xs font-bold tabular-nums min-w-[24px]", getRiskTextColor(asset.riskScore))}>
                                  {asset.riskScore}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            {asset.alerts > 0 ? (
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
                                asset.alerts >= 10
                                  ? "bg-red-400/10 border-red-400/20 text-red-600 dark:text-red-400"
                                  : "bg-orange-400/10 border-orange-400/20 text-orange-600 dark:text-orange-400"
                              )}>
                                {asset.alerts >= 10 && <span className="size-1 animate-pulse rounded-full bg-red-500" />}
                                {asset.alerts}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground/60">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono text-[11px] text-muted-foreground">{asset.lastScan}</td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`查看资产 ${asset.name}`}
                                className="text-cyan-600/70 hover:text-cyan-600 hover:bg-cyan-400/10"
                              >
                                <Eye className="size-3" />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`删除资产 ${asset.name}`}
                                className="text-red-600/70 hover:text-red-600 hover:bg-red-400/10"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 分页栏 */}
              <TablePagination
                totalItems={filteredAssets.length}
                pageSize={pageSize}
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                resultsLabel={t("assets.resultsCount")}
                perPageLabel={t("assets.paginationPerPage")}
              />
            </>
          )}
      </div>

      {/* ==================== 风险分布矩阵 ==================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 类型风险分布 */}
        <Card className={cn(pageCardClass, "lg:col-span-2")}>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">{t("assets.riskDistribution")}</h2>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-red-500" />
                  {t("assets.riskLevelHigh")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-orange-500" />
                  {t("assets.riskLevelMedium")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-green-500" />
                  {t("assets.riskLevelLow")}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {typeRiskDistribution.map((item) => {
                const cfg = ASSET_TYPE_CONFIG[item.type]
                const Icon = cfg.icon
                const maxTotal = Math.max(...typeRiskDistribution.map((d) => d.total))
                return (
                  <div key={item.type} className="group flex items-center gap-3">
                    <div className="flex w-28 shrink-0 items-center gap-2">
                      <div className={cn("flex size-6 items-center justify-center rounded-md", cfg.bg)}>
                        <Icon className={cn("size-3", cfg.color)} />
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{t(ASSET_TYPE_KEY[item.type])}</span>
                    </div>
                    {/* 堆叠条 */}
                    <div className="relative flex h-5 flex-1 overflow-hidden rounded-md bg-muted/40">
                      {/* 网格刻度线 */}
                      <div className="absolute inset-0 flex">
                        {[25, 50, 75].map((p) => (
                          <div key={p} className="absolute h-full border-l border-border/40" style={{ left: `${p}%` }} />
                        ))}
                      </div>
                      {item.total > 0 && (
                        <>
                          <div
                            className="h-full bg-red-500/80 transition-all duration-500 group-hover:bg-red-500"
                            style={{ width: `${(item.high / maxTotal) * 100}%` }}
                            title={`${item.high} ${t("assets.riskLevelHigh")}`}
                          />
                          <div
                            className="h-full bg-orange-500/80 transition-all duration-500 group-hover:bg-orange-500"
                            style={{ width: `${(item.medium / maxTotal) * 100}%` }}
                            title={`${item.medium} ${t("assets.riskLevelMedium")}`}
                          />
                          <div
                            className="h-full bg-green-500/80 transition-all duration-500 group-hover:bg-green-500"
                            style={{ width: `${(item.low / maxTotal) * 100}%` }}
                            title={`${item.low} ${t("assets.riskLevelLow")}`}
                          />
                        </>
                      )}
                    </div>
                    {/* 计数 */}
                    <div className="flex w-24 shrink-0 items-center justify-end gap-2 font-mono text-[10px] tabular-nums">
                      <span className="text-red-600 dark:text-red-400">{item.high}</span>
                      <span className="text-orange-600 dark:text-orange-400">{item.medium}</span>
                      <span className="text-green-600 dark:text-green-400">{item.low}</span>
                      <span className="text-muted-foreground">/ {item.total}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 风险概览环形 */}
        <Card className={pageCardClass}>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{t("assets.riskPercentage")}</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-2">
              {/* 环形进度（SVG 实现） */}
              <div className="relative size-32">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/30"
                    strokeWidth="2.5"
                  />
                  {/* 高风险段 */}
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray={`${(stats.high / stats.total) * 100} ${100 - (stats.high / stats.total) * 100}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* 中风险段 */}
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeDasharray={`${(stats.medium / stats.total) * 100} ${100 - (stats.medium / stats.total) * 100}`}
                    strokeDashoffset={`${-(stats.high / stats.total) * 100}`}
                    strokeLinecap="round"
                  />
                  {/* 低风险段 */}
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeDasharray={`${(stats.low / stats.total) * 100} ${100 - (stats.low / stats.total) * 100}`}
                    strokeDashoffset={`${-((stats.high + stats.medium) / stats.total) * 100}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-bold tabular-nums text-foreground">{stats.total}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("assets.totalAssets")}</span>
                </div>
              </div>
              {/* 图例 */}
              <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-red-400/[0.06] py-1.5">
                  <div className="font-mono text-base font-bold tabular-nums text-red-600 dark:text-red-400">{stats.high}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("assets.riskLevelHigh")}</div>
                </div>
                <div className="rounded-md bg-orange-400/[0.06] py-1.5">
                  <div className="font-mono text-base font-bold tabular-nums text-orange-600 dark:text-orange-400">{stats.medium}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("assets.riskLevelMedium")}</div>
                </div>
                <div className="rounded-md bg-green-400/[0.06] py-1.5">
                  <div className="font-mono text-base font-bold tabular-nums text-green-600 dark:text-green-400">{stats.low}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("assets.riskLevelLow")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== 添加资产对话框 ==================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-lg text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("assets.addAsset")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{t("assets.addAssetDesc")}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.assetName")}</label>
              <Input
                className={inputClass}
                placeholder={t("assets.assetNamePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.ipAddress")}</label>
              <Input
                className={inputClass}
                placeholder={t("assets.ipAddressPlaceholder")}
                value={formData.ip}
                onChange={(e) => setFormData((p) => ({ ...p, ip: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.assetType")}</label>
                <Select value={formData.type} onValueChange={(v) => v && setFormData((p) => ({ ...p, type: v as AssetType }))}>
                  <SelectTrigger className={cn("w-full", inputClass)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="服务器">{t("assets.typeServer")}</SelectItem>
                    <SelectItem value="网络设备">{t("assets.typeNetworkDevice")}</SelectItem>
                    <SelectItem value="安全设备">{t("assets.typeSecurityDevice")}</SelectItem>
                    <SelectItem value="终端">{t("assets.typeTerminal")}</SelectItem>
                    <SelectItem value="数据库">{t("assets.typeDatabase")}</SelectItem>
                    <SelectItem value="云资源">{t("assets.typeCloudResource")}</SelectItem>
                    <SelectItem value="中间件">{t("assets.typeMiddleware")}</SelectItem>
                    <SelectItem value="容器">{t("assets.typeContainer")}</SelectItem>
                    <SelectItem value="物联网设备">{t("assets.typeIoT")}</SelectItem>
                    <SelectItem value="自定义">{t("assets.typeCustom")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.riskGrade")}</label>
                <Select value={formData.riskGrade} onValueChange={(v) => v && setFormData((p) => ({ ...p, riskGrade: v as RiskGrade }))}>
                  <SelectTrigger className={cn("w-full", inputClass)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="高">{t("assets.riskHigh")}</SelectItem>
                    <SelectItem value="中">{t("assets.riskMedium")}</SelectItem>
                    <SelectItem value="低">{t("assets.riskLow")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.type === "自定义" && (
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">自定义类型名称</label>
                <Input
                  className={inputClass}
                  placeholder="请输入自定义设备类型名称"
                  value={formData.customType}
                  onChange={(e) => setFormData((p) => ({ ...p, customType: e.target.value }))}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.department")}</label>
                <Input
                  className={inputClass}
                  placeholder={t("assets.departmentPlaceholder")}
                  value={formData.department}
                  onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("assets.owner")}</label>
                <Input
                  className={inputClass}
                  placeholder={t("assets.ownerPlaceholder")}
                  value={formData.owner}
                  onChange={(e) => setFormData((p) => ({ ...p, owner: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">操作系统</label>
                <Input
                  className={inputClass}
                  placeholder="如 CentOS 7.9 / Windows Server 2022"
                  value={formData.os}
                  onChange={(e) => setFormData((p) => ({ ...p, os: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">物理位置</label>
                <Input
                  className={inputClass}
                  placeholder="如 北京机房A区3柜"
                  value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">描述</label>
              <textarea
                className={cn(inputClass, "min-h-[72px] resize-none")}
                placeholder="资产用途、备注等信息"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("assets.cancel")}
              </Button>
              <Button onClick={() => {
                setDialogOpen(false)
                toast("资产添加成功", "success")
                setFormData({ name: "", ip: "", type: "服务器" as AssetType, customType: "", department: "", owner: "", os: "", location: "", description: "", riskGrade: "中" as RiskGrade })
              }}>
                {t("assets.confirmAdd")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
