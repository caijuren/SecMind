"use client"

import { useState } from "react"
import {
  FileText,
  Search,
  Plus,
  Download,
  Mail,
  Trash2,
  Clock,
  FileBarChart,
  Shield,
  AlertTriangle,
  Activity,
  BarChart3,
  Globe,
  CheckSquare,
  Square,
  CalendarDays,
  Zap,
  BookOpen,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

type ReportStatus = "generating" | "completed" | "sent"
type ReportType = "daily" | "weekly" | "monthly" | "special"

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; border: string }> = {
  generating: { label: "生成中", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  completed: { label: "已完成", color: "#22d3ee", bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.25)" },
  sent: { label: "已发送", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)" },
}

const typeConfig: Record<ReportType, { label: string; color: string }> = {
  daily: { label: "日报", color: "#06b6d4" },
  weekly: { label: "周报", color: "#8b5cf6" },
  monthly: { label: "月报", color: "#f97316" },
  special: { label: "专项报告", color: "#ef4444" },
}

const filterCards = [
  { key: "auto", label: "自动报告", count: 12, color: "#06b6d4", icon: Zap },
  { key: "manual", label: "手动报告", count: 8, color: "#f97316", icon: FileText },
  { key: "template", label: "报告模板", count: 6, color: "#a855f7", icon: BookOpen },
]

const moduleOptions = [
  { key: "threat_overview", label: "威胁概览" },
  { key: "event_analysis", label: "事件分析" },
  { key: "asset_risk", label: "资产风险" },
  { key: "compliance", label: "合规状态" },
  { key: "response_actions", label: "处置记录" },
  { key: "threat_intel", label: "威胁情报" },
]

interface ReportItem {
  id: string
  title: string
  type: ReportType
  generatedAt: string
  status: ReportStatus
  modules: string[]
}

const mockReports: ReportItem[] = [
  { id: "RPT-2026-001", title: "2026年5月第1周安全周报", type: "weekly", generatedAt: "2026-05-05 09:00", status: "sent", modules: ["威胁概览", "事件分析", "资产风险", "处置记录"] },
  { id: "RPT-2026-002", title: "2026年5月9日安全日报", type: "daily", generatedAt: "2026-05-09 08:30", status: "completed", modules: ["威胁概览", "事件分析", "合规状态"] },
  { id: "RPT-2026-003", title: "VPN凭证泄露专项报告", type: "special", generatedAt: "2026-05-08 14:20", status: "completed", modules: ["事件分析", "资产风险", "处置记录", "威胁情报"] },
  { id: "RPT-2026-004", title: "2026年4月安全月报", type: "monthly", generatedAt: "2026-05-01 10:00", status: "sent", modules: ["威胁概览", "事件分析", "资产风险", "合规状态", "处置记录", "威胁情报"] },
  { id: "RPT-2026-005", title: "2026年5月8日安全日报", type: "daily", generatedAt: "2026-05-08 08:30", status: "sent", modules: ["威胁概览", "事件分析"] },
  { id: "RPT-2026-006", title: "勒索软件防护专项报告", type: "special", generatedAt: "2026-05-10 11:00", status: "generating", modules: ["事件分析", "资产风险", "处置记录"] },
  { id: "RPT-2026-007", title: "2026年5月7日安全日报", type: "daily", generatedAt: "2026-05-07 08:30", status: "completed", modules: ["威胁概览", "事件分析", "合规状态"] },
  { id: "RPT-2026-008", title: "等保合规检查专项报告", type: "special", generatedAt: "2026-05-06 16:45", status: "completed", modules: ["合规状态", "资产风险"] },
]

interface TemplateItem {
  id: string
  name: string
  description: string
  usageCount: number
  icon: React.ElementType
  color: string
}

const mockTemplates: TemplateItem[] = [
  { id: "TPL-001", name: "安全日报", description: "每日安全事件汇总与威胁态势概览", usageCount: 156, icon: FileText, color: "#06b6d4" },
  { id: "TPL-002", name: "安全周报", description: "本周安全运营数据统计与趋势分析", usageCount: 89, icon: BarChart3, color: "#8b5cf6" },
  { id: "TPL-003", name: "安全月报", description: "月度安全态势总结与合规审计报告", usageCount: 34, icon: CalendarDays, color: "#f97316" },
  { id: "TPL-004", name: "等保合规报告", description: "等级保护合规检查与差距分析报告", usageCount: 27, icon: Shield, color: "#22d3ee" },
  { id: "TPL-005", name: "事件专项报告", description: "重大安全事件深度分析与处置复盘", usageCount: 45, icon: AlertTriangle, color: "#ef4444" },
  { id: "TPL-006", name: "威胁情报简报", description: "最新威胁情报汇总与IOC指标更新", usageCount: 62, icon: Globe, color: "#34d399" },
]

function GenerateReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [reportType, setReportType] = useState<string>("daily")
  const [timeRange, setTimeRange] = useState<string>("today")
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "threat_overview",
    "event_analysis",
  ])

  const toggleModule = (key: string) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  const handleGenerate = () => {
    onOpenChange(false)
    setSelectedModules(["threat_overview", "event_analysis"])
    setReportType("daily")
    setTimeRange("today")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-white/[0.08] bg-[#0a1628] text-slate-300 shadow-[0_0_40px_rgba(0,212,255,0.12)]">
        <DialogHeader>
          <DialogTitle className="text-white">生成报告</DialogTitle>
          <DialogDescription className="text-slate-500">
            选择报告类型、时间范围和包含模块，系统将自动生成安全运营报告
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">报告类型</label>
            <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
                <SelectTrigger className="h-9 border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 focus:ring-cyan-400/20">
                  <SelectValue placeholder="选择报告类型" />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#0a1628]">
                  <SelectItem value="daily" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">日报</SelectItem>
                  <SelectItem value="weekly" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">周报</SelectItem>
                  <SelectItem value="monthly" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">月报</SelectItem>
                  <SelectItem value="special" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">专项报告</SelectItem>
                </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">时间范围</label>
            <Select value={timeRange} onValueChange={(v) => v && setTimeRange(v)}>
                <SelectTrigger className="h-9 border-white/[0.08] bg-white/[0.04] text-sm text-slate-300 focus:ring-cyan-400/20">
                  <SelectValue placeholder="选择时间范围" />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#0a1628]">
                  <SelectItem value="today" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">今日</SelectItem>
                  <SelectItem value="yesterday" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">昨日</SelectItem>
                  <SelectItem value="this_week" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">本周</SelectItem>
                  <SelectItem value="last_week" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">上周</SelectItem>
                  <SelectItem value="this_month" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">本月</SelectItem>
                  <SelectItem value="last_month" className="text-slate-300 focus:bg-cyan-400/10 focus:text-cyan-400">上月</SelectItem>
                </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">包含模块</label>
            <div className="grid grid-cols-2 gap-2">
              {moduleOptions.map((mod) => {
                const isSelected = selectedModules.includes(mod.key)
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModule(mod.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all",
                      isSelected
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                        : "border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/10 hover:text-slate-400"
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {mod.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 text-white/50 hover:bg-white/[0.04] hover:text-white/70"
            >
              取消
            </Button>
            <Button
              onClick={handleGenerate}
              className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              生成报告
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ReportsPage() {
  const { t } = useLocaleStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [reports, setReports] = useState<ReportItem[]>(mockReports)

  const filteredReports = reports.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!r.title.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false
    }
    if (activeFilter === "auto" && r.id.startsWith("RPT-A")) return false
    if (activeFilter === "manual" && r.id.startsWith("RPT-M")) return false
    return true
  })

  const handleDelete = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20"
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))",
              boxShadow: "0 0 16px rgba(34,211,238,0.15)",
            }}
          >
            <FileBarChart className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">报告中心</h1>
            <p className="text-sm text-white/40 mt-0.5">安全运营报告自动生成与管理</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filterCards.map((card) => {
          const Icon = card.icon
          const isActive = activeFilter === card.key
          return (
            <Card
              key={card.key}
              className={cn(
                "cursor-pointer transition-all border",
                isActive ? "scale-[1.02]" : "hover:scale-[1.01]"
              )}
              style={{
                borderColor: isActive ? `${card.color}50` : `${card.color}20`,
                backgroundColor: isActive ? `${card.color}12` : `${card.color}06`,
                boxShadow: isActive ? `0 0 20px ${card.color}15` : "none",
              }}
              onClick={() => setActiveFilter(isActive ? null : card.key)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${card.color}18`,
                    boxShadow: `0 0 12px ${card.color}20`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-sm text-white/60">{card.label}</p>
                  <p className="text-2xl font-bold" style={{ color: card.color }}>
                    {card.count}
                    <span className="text-xs font-normal text-white/30 ml-1">
                      {card.key === "template" ? "个" : "份"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="搜索报告..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 border-white/[0.08] bg-white/[0.04] pl-9 text-sm text-slate-300 placeholder:text-slate-600 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
          />
        </div>
        <Button
          onClick={() => setGenerateDialogOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          生成报告
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400" />
          报告列表
          <span className="text-xs text-white/30 font-normal">({filteredReports.length})</span>
        </h2>
        {filteredReports.map((report) => {
          const tCfg = typeConfig[report.type]
          const sCfg = statusConfig[report.status]
          return (
            <Card
              key={report.id}
              className="border-white/[0.06] bg-white/[0.02] hover:border-cyan-500/15 transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-white/30">{report.id}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold rounded-md px-1.5 py-0"
                        style={{
                          backgroundColor: `${tCfg.color}15`,
                          color: tCfg.color,
                          borderColor: `${tCfg.color}30`,
                        }}
                      >
                        {tCfg.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold rounded-md px-1.5 py-0"
                        style={{
                          backgroundColor: sCfg.bg,
                          color: sCfg.color,
                          borderColor: sCfg.border,
                        }}
                      >
                        {report.status === "generating" && (
                          <Activity className="h-2.5 w-2.5 mr-1 animate-spin" />
                        )}
                        {sCfg.label}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-white/90 truncate">{report.title}</h3>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="h-3 w-3" />
                        {report.generatedAt}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {report.modules.map((mod) => (
                          <span
                            key={mod}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40 border border-white/[0.06]"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-white/30 hover:text-cyan-400 hover:bg-cyan-400/10"
                      disabled={report.status === "generating"}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-white/30 hover:text-cyan-400 hover:bg-cyan-400/10"
                      disabled={report.status === "generating"}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-white/30 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-400" />
          报告模板
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {mockTemplates.map((tpl) => {
            const Icon = tpl.icon
            return (
              <Card
                key={tpl.id}
                className="border-white/[0.06] bg-white/[0.02] hover:border-cyan-500/15 transition-all cursor-pointer group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${tpl.color}15`,
                        boxShadow: `0 0 10px ${tpl.color}15`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: tpl.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white/90 group-hover:text-cyan-400 transition-colors">{tpl.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{tpl.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-white/25">已使用 {tpl.usageCount} 次</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-white/30 hover:text-cyan-400 hover:bg-cyan-400/10 gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      使用模板
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <GenerateReportDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />
    </div>
  )
}
