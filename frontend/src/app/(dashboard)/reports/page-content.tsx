"use client"

import { useState, useMemo } from "react"
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
  Send,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"
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
import { pageCardClass, inputClass } from "@/lib/admin-ui"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/layout/page-header"
import { usePageTitle } from "@/hooks/use-page-title"

// ==================== Types & Config ====================

type ReportStatus = "generating" | "completed" | "sent"
type ReportType = "daily" | "weekly" | "monthly" | "special"

const statusConfig: Record<ReportStatus, { labelKey: string; color: string; bg: string; border: string; glow: string }> = {
  generating: { labelKey: "reports.statusGenerating", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", glow: "" },
  completed: { labelKey: "reports.statusCompleted", color: "#00d4ff", bg: "rgba(0,212,255,0.10)", border: "rgba(0,212,255,0.25)", glow: "shadow-sm" },
  sent: { labelKey: "reports.statusSent", color: "#34d399", bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.25)", glow: "" },
}

const typeConfig: Record<ReportType, { labelKey: string; color: string; hex: string; icon: typeof FileText }> = {
  daily: { labelKey: "reports.typeDaily", color: "#06b6d4", hex: "#06b6d4", icon: FileText },
  weekly: { labelKey: "reports.typeWeekly", color: "#8b5cf6", hex: "#8b5cf6", icon: BarChart3 },
  monthly: { labelKey: "reports.typeMonthly", color: "#f97316", hex: "#f97316", icon: CalendarDays },
  special: { labelKey: "reports.typeSpecial", color: "#ef4444", hex: "#ef4444", icon: AlertTriangle },
}

const moduleOptions = [
  { key: "threat_overview", labelKey: "reports.moduleThreatOverview", color: "#06b6d4" },
  { key: "event_analysis", labelKey: "reports.moduleIncidentAnalysis", color: "#f97316" },
  { key: "asset_risk", labelKey: "reports.moduleAssetRisk", color: "#8b5cf6" },
  { key: "compliance", labelKey: "reports.moduleCompliance", color: "#22d3ee" },
  { key: "response_actions", labelKey: "reports.moduleResponseActions", color: "#34d399" },
  { key: "threat_intel", labelKey: "reports.moduleThreatIntel", color: "#ef4444" },
]

interface ReportItem {
  id: string
  title: string
  type: ReportType
  generatedAt: string
  status: ReportStatus
  modules: string[]
  pages?: number
  recipient?: string
}

const mockReports: ReportItem[] = [
  { id: "RPT-2026-001", title: "2026年5月第1周安全周报", type: "weekly", generatedAt: "2026-05-05 09:00", status: "sent", modules: ["threat_overview", "event_analysis", "asset_risk", "response_actions"], pages: 24, recipient: "安全运营组" },
  { id: "RPT-2026-002", title: "2026年5月9日安全日报", type: "daily", generatedAt: "2026-05-09 08:30", status: "completed", modules: ["threat_overview", "event_analysis", "compliance"], pages: 12, recipient: "SOC团队" },
  { id: "RPT-2026-003", title: "VPN凭证泄露专项报告", type: "special", generatedAt: "2026-05-08 14:20", status: "completed", modules: ["event_analysis", "asset_risk", "response_actions", "threat_intel"], pages: 36, recipient: "应急响应组" },
  { id: "RPT-2026-004", title: "2026年4月安全月报", type: "monthly", generatedAt: "2026-05-01 10:00", status: "sent", modules: ["threat_overview", "event_analysis", "asset_risk", "compliance", "response_actions", "threat_intel"], pages: 48, recipient: "管理层" },
  { id: "RPT-2026-005", title: "2026年5月8日安全日报", type: "daily", generatedAt: "2026-05-08 08:30", status: "sent", modules: ["threat_overview", "event_analysis"], pages: 8, recipient: "SOC团队" },
  { id: "RPT-2026-006", title: "勒索软件防护专项报告", type: "special", generatedAt: "2026-05-10 11:00", status: "generating", modules: ["event_analysis", "asset_risk", "response_actions"], pages: 0 },
  { id: "RPT-2026-007", title: "2026年5月7日安全日报", type: "daily", generatedAt: "2026-05-07 08:30", status: "completed", modules: ["threat_overview", "event_analysis", "compliance"], pages: 10, recipient: "SOC团队" },
  { id: "RPT-2026-008", title: "等保合规检查专项报告", type: "special", generatedAt: "2026-05-06 16:45", status: "completed", modules: ["compliance", "asset_risk"], pages: 32, recipient: "合规审计组" },
]

interface TemplateItem {
  id: string
  nameKey: string
  descriptionKey: string
  usageCount: number
  icon: React.ElementType
  color: string
  modules: string[]
}

const mockTemplates: TemplateItem[] = [
  { id: "TPL-001", nameKey: "reports.templateDailyName", descriptionKey: "reports.templateDailyDesc", usageCount: 156, icon: FileText, color: "#06b6d4", modules: ["threat_overview", "event_analysis"] },
  { id: "TPL-002", nameKey: "reports.templateWeeklyName", descriptionKey: "reports.templateWeeklyDesc", usageCount: 89, icon: BarChart3, color: "#8b5cf6", modules: ["threat_overview", "event_analysis", "asset_risk", "response_actions"] },
  { id: "TPL-003", nameKey: "reports.templateMonthlyName", descriptionKey: "reports.templateMonthlyDesc", usageCount: 34, icon: CalendarDays, color: "#f97316", modules: ["threat_overview", "event_analysis", "asset_risk", "compliance", "response_actions", "threat_intel"] },
  { id: "TPL-004", nameKey: "reports.templateComplianceName", descriptionKey: "reports.templateComplianceDesc", usageCount: 27, icon: Shield, color: "#22d3ee", modules: ["compliance", "asset_risk"] },
  { id: "TPL-005", nameKey: "reports.templateIncidentName", descriptionKey: "reports.templateIncidentDesc", usageCount: 45, icon: AlertTriangle, color: "#ef4444", modules: ["event_analysis", "asset_risk", "response_actions", "threat_intel"] },
  { id: "TPL-006", nameKey: "reports.templateThreatIntelName", descriptionKey: "reports.templateThreatIntelDesc", usageCount: 62, icon: Globe, color: "#34d399", modules: ["threat_intel", "threat_overview"] },
]

// ==================== HUD Corner Decoration ====================

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

// ==================== KPI Card ====================

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  unit?: string
  accent: string
  delay?: number
  children?: React.ReactNode
}

function KpiCard({ icon: Icon, label, value, unit, accent, delay = 0, children }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "stagger-item relative overflow-hidden border-border bg-card shadow-sm",
        "transition-colors duration-200 hover:border-primary/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="relative p-4">
        {/* Top gradient line */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-70"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        {/* Grid texture */}
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

// ==================== Type Filter Chip ====================

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

// ==================== Generate Report Dialog ====================

function GenerateReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useLocaleStore()
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
      <DialogContent className="sm:max-w-lg border-border bg-card text-foreground shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <Sparkles className="size-3.5 text-primary" />
            </div>
            {t("reports.dialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60">
            {t("reports.dialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{t("reports.reportTypeLabel")}</label>
            <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
              <SelectTrigger className={cn("h-9", inputClass)}>
                <SelectValue placeholder={t("reports.reportTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="daily" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.typeDaily")}</SelectItem>
                <SelectItem value="weekly" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.typeWeekly")}</SelectItem>
                <SelectItem value="monthly" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.typeMonthly")}</SelectItem>
                <SelectItem value="special" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.typeSpecial")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{t("reports.timeRangeLabel")}</label>
            <Select value={timeRange} onValueChange={(v) => v && setTimeRange(v)}>
              <SelectTrigger className={cn("h-9", inputClass)}>
                <SelectValue placeholder={t("reports.timeRangePlaceholder")} />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="today" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.timeToday")}</SelectItem>
                <SelectItem value="yesterday" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.timeYesterday")}</SelectItem>
                <SelectItem value="this_week" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.timeThisWeek")}</SelectItem>
                <SelectItem value="last_week" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.timeLastWeek")}</SelectItem>
                <SelectItem value="this_month" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.timeThisMonth")}</SelectItem>
                <SelectItem value="last_month" className="text-muted-foreground focus:bg-primary/10 focus:text-cyan-600">{t("reports.timeLastMonth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{t("reports.modulesLabel")}</label>
            <div className="grid grid-cols-2 gap-2">
              {moduleOptions.map((mod) => {
                const isSelected = selectedModules.includes(mod.key)
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModule(mod.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                      isSelected
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground/60 hover:border-border hover:text-muted-foreground"
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {t(mod.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground"
            >
              {t("reports.cancel")}
            </Button>
            <Button
              onClick={handleGenerate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("reports.generateReport")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Report Row ====================

function ReportRow({ report, onDelete }: { report: ReportItem; onDelete: (id: string) => void }) {
  const { t } = useLocaleStore()
  const { toast } = useToast()
  const tCfg = typeConfig[report.type]
  const sCfg = statusConfig[report.status]
  const TypeIcon = tCfg.icon

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border bg-card p-4 transition-colors duration-200 hover:border-primary/20 ",
        report.status === "generating" && "border-amber-500/15"
      )}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: tCfg.color }}
      />

      <div className="flex items-start gap-4 pl-2">
        {/* Type icon */}
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 mt-0.5"
          style={{ backgroundColor: `${tCfg.color}14`, color: tCfg.color, boxShadow: `inset 0 0 0 1px ${tCfg.color}25` }}
        >
          <TypeIcon className="size-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Row 1: ID + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">{report.id}</span>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold rounded-md px-1.5 py-0"
              style={{
                backgroundColor: `${tCfg.color}12`,
                color: tCfg.color,
                borderColor: `${tCfg.color}30`,
              }}
            >
              {t(tCfg.labelKey)}
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
              {t(sCfg.labelKey)}
            </Badge>
          </div>

          {/* Row 2: Title */}
          <h3 className="text-sm font-semibold text-foreground truncate">{report.title}</h3>

          {/* Row 3: Meta info */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-[11px] tabular-nums">{report.generatedAt}</span>
            </span>
            {report.pages ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <FileText className="h-3 w-3" />
                <span className="font-mono text-[11px] tabular-nums">{report.pages}P</span>
              </span>
            ) : null}
            {report.recipient && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <Send className="h-3 w-3" />
                {report.recipient}
              </span>
            )}
          </div>

          {/* Row 4: Module tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {report.modules.map((mod) => {
              const modCfg = moduleOptions.find((m) => m.key === mod)
              const modLabelKey = modCfg?.labelKey ?? mod
              const modColor = modCfg?.color ?? "#71717a"
              return (
                <span
                  key={mod}
                  className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium"
                  style={{
                    backgroundColor: `${modColor}08`,
                    color: `${modColor}cc`,
                    borderColor: `${modColor}20`,
                  }}
                >
                  {t(modLabelKey)}
                </span>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/70 hover:text-cyan-600 hover:bg-primary/10"
            disabled={report.status === "generating"}
            aria-label={t("reports.downloadAriaLabel")}
            onClick={() => toast("正在下载报告...", "info")}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/70 hover:text-cyan-600 hover:bg-primary/10"
            disabled={report.status === "generating"}
            aria-label={t("reports.sendAriaLabel")}
            onClick={() => toast("报告已发送至相关邮箱", "success")}
          >
            <Mail className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/70 hover:text-red-600 hover:bg-red-500/10"
            onClick={() => onDelete(report.id)}
            aria-label={t("reports.deleteAriaLabel")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==================== Template Card ====================

function TemplateCard({ template, onUse }: { template: TemplateItem; onUse: () => void }) {
  const { t } = useLocaleStore()
  const Icon = template.icon

  return (
    <Card className={cn(pageCardClass, "group cursor-pointer")}>
      <CardContent className="relative p-4 space-y-3">
        {/* Top gradient line */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-50"
          style={{ background: `linear-gradient(90deg, transparent, ${template.color}, transparent)` }}
        />

        <div className="flex items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg ring-1"
            style={{ backgroundColor: `${template.color}14`, color: template.color, boxShadow: `inset 0 0 0 1px ${template.color}25` }}
          >
            <Icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{t(template.nameKey)}</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t(template.descriptionKey)}</p>

        {/* Module dots */}
        <div className="flex items-center gap-1">
          {template.modules.map((mod) => {
            const modCfg = moduleOptions.find((m) => m.key === mod)
            const modColor = modCfg?.color ?? "#71717a"
            return (
              <span
                key={mod}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: modColor }}
                title={t(modCfg?.labelKey ?? mod)}
              />
            )
          })}
          <span className="text-[10px] text-muted-foreground/60 ml-1">{template.modules.length} {t("reports.moduleCount") ?? "modules"}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="font-mono text-[10px] text-muted-foreground">{t("reports.usedCountPrefix")}{template.usageCount}{t("reports.usedCountSuffix")}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1"
            onClick={onUse}
          >
            <Plus className="h-3 w-3" />
            {t("reports.useTemplate")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Main Page ====================

export function ReportsPage() {
  usePageTitle("reports")
  const { t } = useLocaleStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTypeFilter, setActiveTypeFilter] = useState<ReportType | "all">("all")
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [reports, setReports] = useState<ReportItem[]>(mockReports)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  // Stats
  const stats = useMemo(() => {
    const total = reports.length
    const completed = reports.filter((r) => r.status === "completed").length
    const generating = reports.filter((r) => r.status === "generating").length
    const sent = reports.filter((r) => r.status === "sent").length
    const totalPages = reports.reduce((sum, r) => sum + (r.pages ?? 0), 0)
    const typeCounts = (["daily", "weekly", "monthly", "special"] as ReportType[]).reduce((acc, type) => {
      acc[type] = reports.filter((r) => r.type === type).length
      return acc
    }, {} as Record<ReportType, number>)
    return { total, completed, generating, sent, totalPages, typeCounts }
  }, [reports])

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (activeTypeFilter !== "all" && r.type !== activeTypeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!r.title.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [reports, activeTypeFilter, searchQuery])

  const handleDelete = (id: string) => {
    const report = reports.find((r) => r.id === id)
    if (report) {
      setDeleteTarget({ id, title: report.title })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileBarChart}
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setGenerateDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              {t("reports.generateReport")}
            </Button>
          </div>
        }
      />

      {/* ==================== KPI Stats ==================== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={FileBarChart}
          label={t("reports.totalReports") ?? "TOTAL REPORTS"}
          value={stats.total}
          accent="#06b6d4"
          delay={0}
        >
          {/* Type distribution bar */}
          <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
            {(["daily", "weekly", "monthly", "special"] as ReportType[]).map((type) => {
              const cfg = typeConfig[type]
              const count = stats.typeCounts[type]
              const width = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div
                  key={type}
                  className="h-full transition-all duration-500"
                  style={{ width: `${width}%`, backgroundColor: cfg.color }}
                  title={`${t(cfg.labelKey)}: ${count}`}
                />
              )
            })}
          </div>
        </KpiCard>

        <KpiCard
          icon={Zap}
          label={t("reports.statusGenerating") ?? "GENERATING"}
          value={stats.generating}
          accent="#f59e0b"
          delay={60}
        >
          {stats.generating > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {t("reports.processing") ?? "Processing..."}
              </span>
            </div>
          )}
        </KpiCard>

        <KpiCard
          icon={CheckSquare}
          label={t("reports.statusCompleted") ?? "COMPLETED"}
          value={stats.completed}
          accent="#00d4ff"
          delay={120}
        >
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <FileText className="size-2.5 text-cyan-500" />
              {stats.totalPages}P
            </span>
            <span className="text-muted-foreground/60">total</span>
          </div>
        </KpiCard>

        <KpiCard
          icon={Send}
          label={t("reports.statusSent") ?? "SENT"}
          value={stats.sent}
          accent="#34d399"
          delay={180}
        >
          {/* Sent ratio bar */}
          <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${stats.total > 0 ? (stats.sent / stats.total) * 100 : 0}%` }}
            />
          </div>
        </KpiCard>
      </div>

      {/* ==================== Command Bar: Type Filter + Search ==================== */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Type filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 lg:pb-0">
            <TypeChip
              active={activeTypeFilter === "all"}
              label={t("reports.allTypes") ?? "All"}
              count={stats.total}
              icon={FileBarChart}
              color="#06b6d4"
              onClick={() => setActiveTypeFilter("all")}
            />
            {(["daily", "weekly", "monthly", "special"] as ReportType[]).map((type) => {
              const cfg = typeConfig[type]
              return (
                <TypeChip
                  key={type}
                  active={activeTypeFilter === type}
                  label={t(cfg.labelKey)}
                  count={stats.typeCounts[type]}
                  icon={cfg.icon}
                  color={cfg.hex}
                  onClick={() => setActiveTypeFilter(activeTypeFilter === type ? "all" : type)}
                />
              )
            })}
          </div>
          {/* Search */}
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("reports.searchPlaceholder")}
              aria-label={t("reports.searchAriaLabel")}
              className={cn("h-8 pl-9", inputClass)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              name="search"
              type="search"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* ==================== Report List ==================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t("reports.reportList")}</h2>
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground font-mono tabular-nums">{filteredReports.length}</span>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border bg-card">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{t("reports.noReportsFound") ?? "No reports found"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("reports.noReportsFoundDesc") ?? "Try adjusting your search or filter"}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredReports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ==================== Report Templates ==================== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{t("reports.reportTemplates")}</h2>
          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground font-mono tabular-nums">{mockTemplates.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockTemplates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onUse={() => {
                toast("已应用模板", "success")
                setGenerateDialogOpen(true)
              }}
            />
          ))}
        </div>
      </div>

      {/* ==================== Dialogs ==================== */}
      <GenerateReportDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={t("reports.deleteTitle")}
        description={t("reports.deleteDescriptionPrefix") + (deleteTarget?.title ?? "") + t("reports.deleteDescriptionSuffix")}
        level="warning"
        onConfirm={() => {
          if (deleteTarget) {
            setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id))
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
