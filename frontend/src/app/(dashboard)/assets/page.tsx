"use client"

import { useState } from "react"
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
  AlertTriangle,
  Eye,
  Trash2,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { useLocaleStore } from "@/store/locale-store"
import { inputClass, pageCardClass, softCardClass } from "@/lib/admin-ui"

type AssetType = "服务器" | "网络设备" | "安全设备" | "终端" | "数据库" | "云资源"
type RiskGrade = "高" | "中" | "低"

interface Asset {
  id: string
  name: string
  ip: string
  type: AssetType
  department: string
  owner: string
  riskScore: number
  riskGrade: RiskGrade
  alerts: number
  lastScan: string
}

const ASSET_TYPE_CONFIG: Record<AssetType, { icon: typeof Server; color: string; bg: string }> = {
  "服务器": { icon: Server, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  "网络设备": { icon: Network, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  "安全设备": { icon: Lock, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  "终端": { icon: Monitor, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  "数据库": { icon: Database, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  "云资源": { icon: Cloud, color: "text-pink-400", bg: "bg-pink-400/10 border-pink-400/20" },
}

const FILTER_CARDS = [
  { key: "all", label: "全部资产", count: 156, color: "#06b6d4", borderColor: "border-cyan-400/20", bgColor: "bg-cyan-400/[0.04]", textColor: "text-cyan-400", icon: Shield },
  { key: "high", label: "高危资产", count: 23, color: "#ef4444", borderColor: "border-red-400/20", bgColor: "bg-red-400/[0.04]", textColor: "text-red-400", icon: AlertTriangle },
  { key: "medium", label: "中危资产", count: 47, color: "#f97316", borderColor: "border-orange-400/20", bgColor: "bg-orange-400/[0.04]", textColor: "text-orange-400", icon: BarChart3 },
  { key: "low", label: "低危资产", count: 86, color: "#22c55e", borderColor: "border-green-400/20", bgColor: "bg-green-400/[0.04]", textColor: "text-green-400", icon: Shield },
]

const mockAssets: Asset[] = [
  { id: "AST-001", name: "核心业务服务器-01", ip: "10.0.1.10", type: "服务器", department: "技术部", owner: "张伟", riskScore: 92, riskGrade: "高", alerts: 15, lastScan: "2026-05-10 09:30" },
  { id: "AST-002", name: "数据库主节点-MySQL", ip: "10.0.1.20", type: "数据库", department: "数据部", owner: "李娜", riskScore: 87, riskGrade: "高", alerts: 12, lastScan: "2026-05-10 09:15" },
  { id: "AST-003", name: "核心交换机-SW01", ip: "10.0.0.1", type: "网络设备", department: "网络部", owner: "王强", riskScore: 78, riskGrade: "高", alerts: 8, lastScan: "2026-05-10 08:45" },
  { id: "AST-004", name: "防火墙-FW-主", ip: "10.0.0.254", type: "安全设备", department: "安全部", owner: "赵敏", riskScore: 65, riskGrade: "中", alerts: 5, lastScan: "2026-05-10 09:00" },
  { id: "AST-005", name: "开发终端-DEV-15", ip: "10.0.3.115", type: "终端", department: "研发部", owner: "陈浩", riskScore: 58, riskGrade: "中", alerts: 3, lastScan: "2026-05-10 08:30" },
  { id: "AST-006", name: "云服务器-ECS-Prod", ip: "47.102.33.88", type: "云资源", department: "运维部", owner: "刘洋", riskScore: 81, riskGrade: "高", alerts: 9, lastScan: "2026-05-10 09:20" },
  { id: "AST-007", name: "Web应用服务器-02", ip: "10.0.1.11", type: "服务器", department: "技术部", owner: "张伟", riskScore: 73, riskGrade: "中", alerts: 6, lastScan: "2026-05-10 08:50" },
  { id: "AST-008", name: "IDS入侵检测系统", ip: "10.0.0.253", type: "安全设备", department: "安全部", owner: "赵敏", riskScore: 42, riskGrade: "低", alerts: 1, lastScan: "2026-05-10 09:10" },
  { id: "AST-009", name: "汇聚交换机-SW02", ip: "10.0.0.2", type: "网络设备", department: "网络部", owner: "王强", riskScore: 35, riskGrade: "低", alerts: 0, lastScan: "2026-05-10 07:30" },
  { id: "AST-010", name: "财务终端-FIN-03", ip: "10.0.4.23", type: "终端", department: "财务部", owner: "孙丽", riskScore: 68, riskGrade: "中", alerts: 4, lastScan: "2026-05-10 08:20" },
  { id: "AST-011", name: "Redis缓存集群", ip: "10.0.1.30", type: "数据库", department: "数据部", owner: "李娜", riskScore: 55, riskGrade: "中", alerts: 2, lastScan: "2026-05-10 09:05" },
  { id: "AST-012", name: "VPN网关设备", ip: "10.0.0.250", type: "安全设备", department: "安全部", owner: "赵敏", riskScore: 89, riskGrade: "高", alerts: 11, lastScan: "2026-05-10 09:25" },
  { id: "AST-013", name: "对象存储-OSS", ip: "oss-cn-hangzhou.aliyuncs.com", type: "云资源", department: "运维部", owner: "刘洋", riskScore: 47, riskGrade: "低", alerts: 1, lastScan: "2026-05-10 08:00" },
  { id: "AST-014", name: "邮件服务器-Mail", ip: "10.0.1.40", type: "服务器", department: "技术部", owner: "周磊", riskScore: 76, riskGrade: "中", alerts: 7, lastScan: "2026-05-10 08:55" },
  { id: "AST-015", name: "无线AP控制器", ip: "10.0.0.3", type: "网络设备", department: "网络部", owner: "王强", riskScore: 28, riskGrade: "低", alerts: 0, lastScan: "2026-05-10 07:45" },
  { id: "AST-016", name: "CEO办公终端", ip: "10.0.5.10", type: "终端", department: "管理层", owner: "黄总", riskScore: 85, riskGrade: "高", alerts: 10, lastScan: "2026-05-10 09:22" },
  { id: "AST-017", name: "K8s容器集群", ip: "10.0.2.100", type: "云资源", department: "运维部", owner: "刘洋", riskScore: 71, riskGrade: "中", alerts: 5, lastScan: "2026-05-10 09:18" },
  { id: "AST-018", name: "日志审计服务器", ip: "10.0.1.50", type: "服务器", department: "安全部", owner: "赵敏", riskScore: 38, riskGrade: "低", alerts: 1, lastScan: "2026-05-10 07:50" },
]

const TYPE_DISTRIBUTION = [
  { type: "服务器" as AssetType, count: 28, riskPercent: 35 },
  { type: "网络设备" as AssetType, count: 35, riskPercent: 22 },
  { type: "安全设备" as AssetType, count: 22, riskPercent: 18 },
  { type: "终端" as AssetType, count: 45, riskPercent: 28 },
  { type: "数据库" as AssetType, count: 12, riskPercent: 42 },
  { type: "云资源" as AssetType, count: 14, riskPercent: 31 },
]

function getRiskBarColor(score: number): string {
  if (score >= 80) return "bg-red-500"
  if (score >= 60) return "bg-orange-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-green-500"
}

function getRiskTextColor(score: number): string {
  if (score >= 80) return "text-red-400"
  if (score >= 60) return "text-orange-400"
  if (score >= 40) return "text-yellow-400"
  return "text-green-400"
}

export default function AssetsPage() {
  useLocaleStore()
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    type: "服务器" as AssetType,
    department: "",
    owner: "",
    riskGrade: "中" as RiskGrade,
  })

  const filteredAssets = mockAssets.filter((asset) => {
    if (activeFilter === "high" && asset.riskGrade !== "高") return false
    if (activeFilter === "medium" && asset.riskGrade !== "中") return false
    if (activeFilter === "low" && asset.riskGrade !== "低") return false
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="资产管理"
      />

      <div className="grid grid-cols-4 gap-4">
        {FILTER_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.key}
              className={cn(
                "cursor-pointer transition-colors duration-200",
                activeFilter === card.key
                  ? `${card.borderColor} ${card.bgColor} shadow-sm shadow-slate-200/50`
                  : softCardClass
              )}
              onClick={() => setActiveFilter(card.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs", activeFilter === card.key ? `${card.textColor}/70` : "text-slate-400")}>
                    {card.label}
                  </span>
                  <Icon className={cn("size-4", activeFilter === card.key ? `${card.textColor}/60` : "text-slate-300")} />
                </div>
                <p className={cn("mt-1 text-2xl font-bold font-mono", activeFilter === card.key ? card.textColor : "text-slate-900")}>
                  {card.count}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
          <Input
            placeholder="搜索资产名称、IP、部门、负责人..."
            aria-label="搜索资产"
            className={`pl-9 ${inputClass}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          className="bg-cyan-600 text-white hover:bg-cyan-700 gap-1.5"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4" />
          添加资产
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-cyan-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">添加资产</DialogTitle>
            <DialogDescription className="text-slate-400">录入新的IT资产信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">资产名称</label>
              <Input
                className={inputClass}
                placeholder="请输入资产名称"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">IP地址</label>
              <Input
                className={inputClass}
                placeholder="请输入IP地址"
                value={formData.ip}
                onChange={(e) => setFormData((p) => ({ ...p, ip: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">资产类型</label>
                <Select value={formData.type} onValueChange={(v) => v && setFormData((p) => ({ ...p, type: v as AssetType }))}>
                  <SelectTrigger className={`w-full ${inputClass}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="服务器">服务器</SelectItem>
                    <SelectItem value="网络设备">网络设备</SelectItem>
                    <SelectItem value="安全设备">安全设备</SelectItem>
                    <SelectItem value="终端">终端</SelectItem>
                    <SelectItem value="数据库">数据库</SelectItem>
                    <SelectItem value="云资源">云资源</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">风险等级</label>
                <Select value={formData.riskGrade} onValueChange={(v) => v && setFormData((p) => ({ ...p, riskGrade: v as RiskGrade }))}>
                  <SelectTrigger className={`w-full ${inputClass}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="高">高</SelectItem>
                    <SelectItem value="中">中</SelectItem>
                    <SelectItem value="低">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">所属部门</label>
                <Input
                  className={inputClass}
                  placeholder="请输入所属部门"
                  value={formData.department}
                  onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">负责人</label>
                <Input
                  className={inputClass}
                  placeholder="请输入负责人"
                  value={formData.owner}
                  onChange={(e) => setFormData((p) => ({ ...p, owner: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-slate-200 bg-white text-slate-500 hover:text-slate-700"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                className="bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={() => setDialogOpen(false)}
              >
                确认添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className={pageCardClass}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-400 font-medium text-xs">资产名称</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">IP地址</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">类型</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">部门</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">负责人</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">风险评分</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">关联告警</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">最后扫描</TableHead>
                <TableHead className="text-slate-400 font-medium text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const typeConfig = ASSET_TYPE_CONFIG[asset.type]
                const TypeIcon = typeConfig.icon
                return (
                  <TableRow
                    key={asset.id}
                    className={cn(
                      "border-slate-100 hover:bg-slate-50",
                      asset.riskGrade === "高" && "bg-red-400/[0.02]"
                    )}
                  >
                    <TableCell className="text-slate-700 font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("size-4", typeConfig.color)} />
                        {asset.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{asset.ip}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", typeConfig.bg, typeConfig.color)}>
                        <TypeIcon className="size-3" />
                        {asset.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">{asset.department}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{asset.owner}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", getRiskBarColor(asset.riskScore))}
                            style={{ width: `${asset.riskScore}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-mono font-bold min-w-[24px]", getRiskTextColor(asset.riskScore))}>
                          {asset.riskScore}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.alerts > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                          {asset.alerts}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs font-mono">{asset.lastScan}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="xs" variant="ghost" className="text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-400/10">
                          <Eye className="size-3" />
                        </Button>
                        <Button size="xs" variant="ghost" className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-700">资产风险分布</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {TYPE_DISTRIBUTION.map((item) => {
            const config = ASSET_TYPE_CONFIG[item.type]
            const Icon = config.icon
            return (
              <Card key={item.type} className="card-default hover:border-slate-200 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center justify-center rounded-md p-1.5", config.bg)}>
                        <Icon className={cn("size-4", config.color)} />
                      </div>
                      <span className="text-sm text-slate-600">{item.type}</span>
                    </div>
                    <span className={cn("text-lg font-bold font-mono", config.color)}>{item.count}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300">风险占比</span>
                      <span className={cn("text-xs font-mono font-bold", getRiskTextColor(item.riskPercent))}>
                        {item.riskPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getRiskBarColor(item.riskPercent))}
                        style={{ width: `${item.riskPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
