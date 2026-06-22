"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablePagination } from "@/components/layout/table-pagination"
import { api } from "@/lib/api"
import { inputClass, pageCardClass, softCardClass, subtleTextClass } from "@/lib/admin-ui"
import { CARD, RADIUS, TYPOGRAPHY } from "@/lib/design-system"
import { useLocaleStore } from "@/store/locale-store"

interface ControlItem {
  id: number
  framework_id: number
  control_id: string
  title: string
  description: string | null
  category: string
  severity: string
  mapping: string | null
}

interface FrameworkItem {
  id: number
  name: string
  code: string
  description: string | null
  version: string
  categories: string[]
  controls_count: number
  controls?: ControlItem[]
}

interface AssessmentItem {
  id: number
  framework_id: number
  name: string
  assessor: string | null
  status: string
  overall_score: number | null
  created_at: string | null
  updated_at: string | null
  results?: ResultItem[]
}

interface ResultItem {
  id: number
  assessment_id: number
  control_id: number
  status: string
  findings: string | null
  remediation: string | null
  control?: ControlItem
}

interface ReportData {
  framework: { name: string; code: string; version: string }
  overall_score: number
  grade: string
  category_breakdown: { category: string; score: number; total: number; compliant: number }[]
  summary: {
    compliant: number
    partially_compliant: number
    non_compliant: number
    not_assessed: number
    total: number
  }
}

const severityConfig: Record<string, { labelKey: string; className: string }> = {
  critical: { labelKey: "compliance.severityCritical", className: "border-red-500/20 bg-red-500/10 text-red-600" },
  high: { labelKey: "compliance.severityHigh", className: "border-orange-500/20 bg-orange-500/10 text-orange-600" },
  medium: { labelKey: "compliance.severityMedium", className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600" },
  low: { labelKey: "compliance.severityLow", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
}

const severityColorMap: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600",
  high: "bg-amber-500/10 text-amber-400",
  medium: "bg-cyan-500/15 text-primary",
  low: "bg-emerald-500/10 text-emerald-300",
  violet: "bg-violet-500/10 text-violet-300",
  blue: "bg-blue-500/10 text-primary",
  cyan: "bg-cyan-500/15 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-300",
}

const statusConfig: Record<string, { labelKey: string; className: string; dotClass: string }> = {
  compliant: { labelKey: "compliance.compliant", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300", dotClass: "bg-emerald-500" },
  partially_compliant: { labelKey: "compliance.partiallyCompliant", className: "border-amber-500/20 bg-amber-500/10 text-amber-400", dotClass: "bg-amber-500" },
  non_compliant: { labelKey: "compliance.nonCompliant", className: "border-red-500/20 bg-red-500/10 text-red-600", dotClass: "bg-red-500" },
  not_assessed: { labelKey: "compliance.notAssessed", className: "border-border bg-background text-muted-foreground", dotClass: "bg-zinc-500" },
}

const assessmentStatusConfig: Record<string, { labelKey: string; className: string }> = {
  draft: { labelKey: "compliance.statusDraft", className: "border-border bg-background text-muted-foreground" },
  in_progress: { labelKey: "compliance.statusInProgress", className: "border-blue-500/20 bg-blue-500/10 text-primary" },
  completed: { labelKey: "compliance.statusCompleted", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
}

const MOCK_CONTROLS_DB20: ControlItem[] = [
  { id: 101, framework_id: 1, control_id: "DB20-AC-01", title: "身份鉴别", description: "应对登录的用户进行身份标识和鉴别，身份标识具有唯一性", category: "访问控制", severity: "critical", mapping: "ISO 27001 A.9.2.1" },
  { id: 102, framework_id: 1, control_id: "DB20-AC-02", title: "访问控制策略", description: "应制定访问控制策略，规定用户访问资源的权限", category: "访问控制", severity: "critical", mapping: "ISO 27001 A.9.1.1" },
  { id: 103, framework_id: 1, control_id: "DB20-AC-03", title: "特权账户管理", description: "应对特权账户进行限制和监控", category: "访问控制", severity: "high", mapping: "ISO 27001 A.9.2.3" },
  { id: 104, framework_id: 1, control_id: "DB20-AC-04", title: "远程访问控制", description: "应采用加密机制保证远程访问安全", category: "访问控制", severity: "high", mapping: "ISO 27001 A.6.2.1" },
  { id: 105, framework_id: 1, control_id: "DB20-AU-01", title: "安全审计", description: "应启用安全审计功能，覆盖到每个用户", category: "安全审计", severity: "critical", mapping: "ISO 27001 A.12.4.1" },
  { id: 106, framework_id: 1, control_id: "DB20-AU-02", title: "审计日志保护", description: "应保护审计日志，避免非预期的修改和删除", category: "安全审计", severity: "high", mapping: "ISO 27001 A.12.4.2" },
  { id: 107, framework_id: 1, control_id: "DB20-AU-03", title: "审计记录时间戳", description: "审计记录应包含准确的时间戳", category: "安全审计", severity: "medium", mapping: "ISO 27001 A.12.4.3" },
  { id: 108, framework_id: 1, control_id: "DB20-DP-01", title: "数据加密", description: "应采用密码技术保证数据在传输和存储过程中的保密性", category: "数据保护", severity: "critical", mapping: "ISO 27001 A.10.1.1" },
  { id: 109, framework_id: 1, control_id: "DB20-DP-02", title: "数据备份", description: "应提供数据本地备份与恢复功能", category: "数据保护", severity: "high", mapping: "ISO 27001 A.12.3.1" },
  { id: 110, framework_id: 1, control_id: "DB20-DP-03", title: "数据脱敏", description: "应对敏感数据进行脱敏处理", category: "数据保护", severity: "medium", mapping: "ISO 27001 A.11.2.7" },
  { id: 111, framework_id: 1, control_id: "DB20-SM-01", title: "安全监控", description: "应建立安全监控机制，实时检测安全事件", category: "安全监控", severity: "critical", mapping: "ISO 27001 A.12.6.1" },
  { id: 112, framework_id: 1, control_id: "DB20-SM-02", title: "漏洞管理", description: "应定期进行漏洞扫描和风险评估", category: "安全监控", severity: "high", mapping: "ISO 27001 A.12.6.1" },
  { id: 113, framework_id: 1, control_id: "DB20-IR-01", title: "应急响应", description: "应建立安全事件应急响应机制", category: "事件响应", severity: "critical", mapping: "ISO 27001 A.16.1.1" },
  { id: 114, framework_id: 1, control_id: "DB20-IR-02", title: "事件报告", description: "应规定安全事件报告流程和时限", category: "事件响应", severity: "high", mapping: "ISO 27001 A.16.1.2" },
  { id: 115, framework_id: 1, control_id: "DB20-CM-01", title: "配置管理", description: "应建立安全配置基线并定期检查", category: "配置管理", severity: "medium", mapping: "ISO 27001 A.12.1.2" },
  { id: 116, framework_id: 1, control_id: "DB20-CM-02", title: "变更管理", description: "所有系统变更应经过审批和记录", category: "配置管理", severity: "medium", mapping: "ISO 27001 A.12.1.2" },
]

const MOCK_CONTROLS_ISO: ControlItem[] = [
  { id: 201, framework_id: 2, control_id: "ISO-A.5.1.1", title: "信息安全方针", description: "管理层应批准和发布信息安全方针", category: "安全策略", severity: "high", mapping: "等保2.0 安全管理制度" },
  { id: 202, framework_id: 2, control_id: "ISO-A.6.1.1", title: "信息安全组织", description: "应建立信息安全管理组织架构", category: "安全组织", severity: "high", mapping: "等保2.0 安全管理机构" },
  { id: 203, framework_id: 2, control_id: "ISO-A.8.1.1", title: "资产清单", description: "应识别并维护信息资产清单", category: "资产管理", severity: "medium", mapping: "等保2.0 资产管理" },
  { id: 204, framework_id: 2, control_id: "ISO-A.8.2.1", title: "信息分类", description: "信息应根据法律要求、价值、关键性和敏感性进行分类", category: "资产管理", severity: "medium", mapping: "等保2.0 数据分类" },
  { id: 205, framework_id: 2, control_id: "ISO-A.9.1.1", title: "访问控制策略", description: "应实施访问控制策略以支持业务和安全要求", category: "访问控制", severity: "critical", mapping: "等保2.0 访问控制" },
  { id: 206, framework_id: 2, control_id: "ISO-A.9.2.1", title: "用户注册与注销", description: "应实施正式的用户注册和注销流程", category: "访问控制", severity: "high", mapping: "等保2.0 身份鉴别" },
  { id: 207, framework_id: 2, control_id: "ISO-A.10.1.1", title: "密码控制策略", description: "应制定使用密码控制的策略", category: "密码学", severity: "critical", mapping: "等保2.0 数据加密" },
  { id: 208, framework_id: 2, control_id: "ISO-A.12.1.1", title: "操作规程", description: "操作规程应文档化并对需要的用户可用", category: "运行安全", severity: "medium", mapping: "等保2.0 运维管理" },
  { id: 209, framework_id: 2, control_id: "ISO-A.12.2.1", title: "恶意软件防护", description: "应实施恶意软件检测、预防和恢复控制", category: "运行安全", severity: "critical", mapping: "等保2.0 恶意代码防范" },
  { id: 210, framework_id: 2, control_id: "ISO-A.12.3.1", title: "信息备份", description: "应按照商定的策略定期备份和测试", category: "运行安全", severity: "high", mapping: "等保2.0 数据备份" },
  { id: 211, framework_id: 2, control_id: "ISO-A.12.4.1", title: "事件日志", description: "应记录用户活动、异常和信息安全事件日志", category: "运行安全", severity: "high", mapping: "等保2.0 安全审计" },
  { id: 212, framework_id: 2, control_id: "ISO-A.13.1.1", title: "网络安全控制", description: "应管理和控制网络以保护系统和应用中的信息", category: "通信安全", severity: "critical", mapping: "等保2.0 网络安全" },
  { id: 213, framework_id: 2, control_id: "ISO-A.13.2.1", title: "信息传输策略", description: "应有正式的信息传输策略和程序", category: "通信安全", severity: "medium", mapping: "等保2.0 数据传输" },
  { id: 214, framework_id: 2, control_id: "ISO-A.16.1.1", title: "事件响应职责", description: "应建立管理职责和程序以快速响应安全事件", category: "事件管理", severity: "critical", mapping: "等保2.0 应急响应" },
  { id: 215, framework_id: 2, control_id: "ISO-A.17.1.1", title: "业务连续性规划", description: "应确定业务连续性的信息安全要求", category: "业务连续性", severity: "high", mapping: "等保2.0 灾难恢复" },
  { id: 216, framework_id: 2, control_id: "ISO-A.18.1.1", title: "适用法规识别", description: "应识别适用的法律法规和合同要求", category: "合规性", severity: "high", mapping: "等保2.0 合规性" },
]

const MOCK_FRAMEWORKS: FrameworkItem[] = [
  {
    id: 1,
    name: "信息安全技术 网络安全等级保护基本要求",
    code: "GB/T 22239-2019",
    description: "等保2.0国家标准，规定了不同安全保护等级的基本安全要求",
    version: "2.0",
    categories: ["访问控制", "安全审计", "数据保护", "安全监控", "事件响应", "配置管理"],
    controls_count: 16,
  },
  {
    id: 2,
    name: "ISO/IEC 27001:2022 信息安全管理体系",
    code: "ISO 27001:2022",
    description: "国际信息安全管理体系标准，提供建立、实施、维护和持续改进ISMS的要求",
    version: "2022",
    categories: ["安全策略", "安全组织", "资产管理", "访问控制", "密码学", "运行安全", "通信安全", "事件管理", "业务连续性", "合规性"],
    controls_count: 16,
  },
  {
    id: 3,
    name: "网络安全法合规要求",
    code: "CSL-2017",
    description: "中华人民共和国网络安全法规定的网络运营者安全保护义务",
    version: "1.0",
    categories: ["网络安全", "数据安全", "个人信息保护", "应急响应", "安全审计"],
    controls_count: 10,
  },
]

const MOCK_CONTROLS_BY_FRAMEWORK: Record<number, ControlItem[]> = {
  1: MOCK_CONTROLS_DB20,
  2: MOCK_CONTROLS_ISO,
  3: [
    { id: 301, framework_id: 3, control_id: "CSL-NW-01", title: "网络安全等级保护", description: "应按照网络安全等级保护制度要求履行安全保护义务", category: "网络安全", severity: "critical", mapping: "等保2.0" },
    { id: 302, framework_id: 3, control_id: "CSL-NW-02", title: "网络实名制", description: "应要求用户提供真实身份信息", category: "网络安全", severity: "high", mapping: "" },
    { id: 303, framework_id: 3, control_id: "CSL-DS-01", title: "数据分类保护", description: "应对数据实行分类分级保护", category: "数据安全", severity: "critical", mapping: "ISO A.8.2.1" },
    { id: 304, framework_id: 3, control_id: "CSL-DS-02", title: "数据出境评估", description: "向境外提供数据应进行安全评估", category: "数据安全", severity: "critical", mapping: "" },
    { id: 305, framework_id: 3, control_id: "CSL-PI-01", title: "个人信息保护", description: "收集和使用个人信息应遵循合法、正当、必要原则", category: "个人信息保护", severity: "critical", mapping: "GDPR" },
    { id: 306, framework_id: 3, control_id: "CSL-PI-02", title: "用户知情同意", description: "收集个人信息应获得用户明示同意", category: "个人信息保护", severity: "high", mapping: "GDPR Art.7" },
    { id: 307, framework_id: 3, control_id: "CSL-IR-01", title: "安全事件报告", description: "发生安全事件应立即采取补救措施并报告", category: "应急响应", severity: "critical", mapping: "ISO A.16" },
    { id: 308, framework_id: 3, control_id: "CSL-IR-02", title: "应急预案", description: "应制定网络安全事件应急预案", category: "应急响应", severity: "high", mapping: "ISO A.17" },
    { id: 309, framework_id: 3, control_id: "CSL-AU-01", title: "日志留存", description: "应按照规定留存网络日志不少于6个月", category: "安全审计", severity: "high", mapping: "ISO A.12.4" },
    { id: 310, framework_id: 3, control_id: "CSL-AU-02", title: "安全审计制度", description: "应建立安全审计制度并进行定期审计", category: "安全审计", severity: "medium", mapping: "ISO A.18.2" },
  ],
}

const MOCK_ASSESSMENTS: AssessmentItem[] = [
  {
    id: 1,
    framework_id: 1,
    name: "2025年度等保2.0评估",
    assessor: "张伟",
    status: "completed",
    overall_score: 87,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    framework_id: 2,
    name: "ISO 27001年度合规审查",
    assessor: "李娜",
    status: "completed",
    overall_score: 92,
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 1728000000).toISOString(),
  },
  {
    id: 3,
    framework_id: 3,
    name: "网络安全法季度自查",
    assessor: "王芳",
    status: "in_progress",
    overall_score: 65,
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 4,
    framework_id: 1,
    name: "2025上半年等保差距分析",
    assessor: "陈强",
    status: "draft",
    overall_score: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A", color: "text-emerald-600" }
  if (score >= 75) return { grade: "B", color: "text-blue-600" }
  if (score >= 60) return { grade: "C", color: "text-amber-400" }
  return { grade: "D", color: "text-red-600" }
}

function CircularProgress({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const { t } = useLocaleStore()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e4e4e7" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(value)}</span>
        <span className="text-[11px] text-muted-foreground">{t("compliance.score")}</span>
      </div>
    </div>
  )
}

function CreateAssessmentDialog({
  open,
  onOpenChange,
  frameworks,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworks: FrameworkItem[]
  onCreated: () => Promise<void>
}) {
  const { t } = useLocaleStore()
  const [form, setForm] = useState({ framework_id: "", name: "", assessor: "" })
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!form.framework_id || !form.name) return
    setSaving(true)
    try {
      await api.post("/compliance/assessments", {
        framework_id: Number(form.framework_id),
        name: form.name,
        assessor: form.assessor || null,
      })
      onOpenChange(false)
      setForm({ framework_id: "", name: "", assessor: "" })
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("compliance.createAssessment")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("compliance.createAssessmentDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessment-framework">{t("compliance.complianceFramework")}</Label>
            <Select value={form.framework_id} onValueChange={(v) => v && setForm((p) => ({ ...p, framework_id: v }))}>
              <SelectTrigger className={`w-full ${inputClass}`}>
                <SelectValue placeholder={t("compliance.selectFramework")} />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((fw) => (
                  <SelectItem key={fw.id} value={String(fw.id)}>
                    {fw.name} ({fw.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-name">{t("compliance.assessmentName")}</Label>
            <Input
              id="assessment-name"
              name="name"
              autoComplete="off"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("compliance.assessmentNamePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-assessor">{t("compliance.assessor")}</Label>
            <Input
              id="assessment-assessor"
              name="assessor"
              autoComplete="off"
              value={form.assessor}
              onChange={(e) => setForm((p) => ({ ...p, assessor: e.target.value }))}
              placeholder={t("compliance.assessorPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.framework_id || !form.name}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? t("compliance.creating") : t("compliance.createAssessment")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResultEditDialog({
  open,
  onOpenChange,
  result,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: ResultItem | null
  onSaved: () => Promise<void>
}) {
  const { t } = useLocaleStore()
  const [form, setForm] = useState({ status: "", findings: "", remediation: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (result && open) {
      const nextForm = {
        status: result.status || "not_assessed",
        findings: result.findings || "",
        remediation: result.remediation || "",
      }
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => setForm(nextForm))
      } else {
        Promise.resolve().then(() => setForm(nextForm))
      }
    }
  }, [result, open])

  async function handleSave() {
    if (!result || !form.status) return
    setSaving(true)
    try {
      await api.put(`/compliance/results/${result.id}`, {
        status: form.status,
        findings: form.findings || null,
        remediation: form.remediation || null,
      })
      onOpenChange(false)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("compliance.updateResult")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {result?.control ? `${result.control.control_id} - ${result.control.title}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("compliance.complianceStatus")}</Label>
            <Select value={form.status} onValueChange={(v) => v && setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger className={`w-full ${inputClass}`}>
                <SelectValue placeholder={t("compliance.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliant">{t("compliance.compliant")}</SelectItem>
                <SelectItem value="partially_compliant">{t("compliance.partiallyCompliant")}</SelectItem>
                <SelectItem value="non_compliant">{t("compliance.nonCompliant")}</SelectItem>
                <SelectItem value="not_assessed">{t("compliance.notAssessed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-findings">{t("compliance.findings")}</Label>
            <Input
              id="result-findings"
              name="findings"
              autoComplete="off"
              value={form.findings}
              onChange={(e) => setForm((p) => ({ ...p, findings: e.target.value }))}
              placeholder={t("compliance.findingsPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-remediation">{t("compliance.remediation")}</Label>
            <Input
              id="result-remediation"
              name="remediation"
              autoComplete="off"
              value={form.remediation}
              onChange={(e) => setForm((p) => ({ ...p, remediation: e.target.value }))}
              placeholder={t("compliance.remediationPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? t("compliance.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ViewMode = "frameworks" | "controls" | "assessment-results" | "report"

export function CompliancePage() {
  const { t } = useLocaleStore()

  const [frameworks, setFrameworks] = useState<FrameworkItem[]>([])
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState("")

  const [viewMode, setViewMode] = useState<ViewMode>("frameworks")
  const [selectedFramework, setSelectedFramework] = useState<FrameworkItem | null>(null)
  const [controls, setControls] = useState<ControlItem[]>([])
  const [controlsLoading, setControlsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentItem | null>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editResult, setEditResult] = useState<ResultItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const loadFrameworks = useCallback(async () => {
    try {
      const res = await api.get("/compliance/frameworks")
      setFrameworks(res.data.length > 0 ? res.data : MOCK_FRAMEWORKS)
    } catch {
      setFrameworks(MOCK_FRAMEWORKS)
    }
  }, [])

  const loadAssessments = useCallback(async () => {
    try {
      const res = await api.get("/compliance/assessments")
      setAssessments(res.data.length > 0 ? res.data : MOCK_ASSESSMENTS)
    } catch {
      setAssessments(MOCK_ASSESSMENTS)
    }
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([loadFrameworks(), loadAssessments()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadAll()
    })
  }, [])

  async function handleSeed() {
    setSeeding(true)
    setSeedMessage("")
    try {
      const res = await api.post("/compliance/seed")
      setSeedMessage(res.data?.message || t("compliance.initComplete"))
      await loadAll()
    } catch {
      setSeedMessage(t("compliance.initFailed"))
    } finally {
      setSeeding(false)
      setTimeout(() => setSeedMessage(""), 3000)
    }
  }

  async function handleViewControls(fw: FrameworkItem) {
    setSelectedFramework(fw)
    setViewMode("controls")
    setControlsLoading(true)
    setCategoryFilter("")
    setSeverityFilter("")
    setCurrentPage(1)
    try {
      const res = await api.get(`/compliance/frameworks/${fw.id}/controls`)
      setControls(res.data.length > 0 ? res.data : (MOCK_CONTROLS_BY_FRAMEWORK[fw.id] || []))
    } catch {
      setControls(MOCK_CONTROLS_BY_FRAMEWORK[fw.id] || [])
    } finally {
      setControlsLoading(false)
    }
  }

  async function handleStartAssessment() {
    setCreateDialogOpen(true)
  }

  async function handleViewAssessment(assessment: AssessmentItem) {
    setSelectedAssessment(assessment)
    setViewMode("assessment-results")
    setAssessmentLoading(true)
    try {
      const res = await api.get(`/compliance/assessments/${assessment.id}`)
      setSelectedAssessment(res.data)
    } catch {
      setSelectedAssessment(assessment)
    } finally {
      setAssessmentLoading(false)
    }
  }

  async function handleAutoGenerate() {
    if (!selectedAssessment) return
    setGenerating(true)
    try {
      await api.post(`/compliance/assessments/${selectedAssessment.id}/generate`)
      const res = await api.get(`/compliance/assessments/${selectedAssessment.id}`)
      setSelectedAssessment(res.data)
    } catch {
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateReport() {
    if (!selectedFramework) return
    setReportLoading(true)
    try {
      const res = await api.get(`/compliance/frameworks/${selectedFramework.id}/report`)
      setReportData(res.data)
      setViewMode("report")
    } catch {
      setReportData(null)
    } finally {
      setReportLoading(false)
    }
  }

  async function handleRefreshAssessment() {
    if (!selectedAssessment) return
    setAssessmentLoading(true)
    try {
      const res = await api.get(`/compliance/assessments/${selectedAssessment.id}`)
      setSelectedAssessment(res.data)
    } catch {
    } finally {
      setAssessmentLoading(false)
    }
  }

  const filteredControls = useMemo(() => {
    let filtered = controls
    if (categoryFilter) {
      filtered = filtered.filter((c) => c.category === categoryFilter)
    }
    if (severityFilter) {
      filtered = filtered.filter((c) => c.severity === severityFilter)
    }
    if (searchQuery && viewMode === "controls") {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.control_id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
      )
    }
    return filtered
  }, [controls, categoryFilter, severityFilter, searchQuery, viewMode])

  const totalPages = Math.max(1, Math.ceil(filteredControls.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedControls = filteredControls.slice((safePage - 1) * pageSize, safePage * pageSize)

  const categories = useMemo(() => {
    const set = new Set(controls.map((c) => c.category))
    return Array.from(set)
  }, [controls])

  const stats = useMemo(
    () => ({
      frameworks: frameworks.length,
      totalControls: frameworks.reduce((sum, fw) => sum + (fw.controls_count || 0), 0),
      assessments: assessments.length,
      completed: assessments.filter((a) => a.status === "completed").length,
    }),
    [frameworks, assessments]
  )

  const assessmentStats = useMemo(() => {
    if (!selectedAssessment?.results) return null
    const results = selectedAssessment.results
    return {
      compliant: results.filter((r) => r.status === "compliant").length,
      partially: results.filter((r) => r.status === "partially_compliant").length,
      nonCompliant: results.filter((r) => r.status === "non_compliant").length,
      notAssessed: results.filter((r) => r.status === "not_assessed" || !r.status).length,
      total: results.length,
    }
  }, [selectedAssessment])

  function goBack() {
    if (viewMode === "controls" || viewMode === "report") {
      setViewMode("frameworks")
      setSelectedFramework(null)
    } else if (viewMode === "assessment-results") {
      setViewMode("frameworks")
      setSelectedAssessment(null)
      setSelectedFramework(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShieldCheck}
        title={t("compliance.title")}
        subtitle={
          viewMode === "controls" && selectedFramework ? (
            <span className="flex items-center gap-1">
              <Link href="/system/compliance" onClick={goBack} className="hover:text-cyan-600 transition-colors">{t("compliance.frameworks")}</Link>
              <ChevronRight className="size-3.5" />
              {selectedFramework.name}
            </span>
          ) : viewMode === "assessment-results" && selectedAssessment ? (
            <span className="flex items-center gap-1">
              <Link href="/system/compliance" onClick={goBack} className="hover:text-cyan-600 transition-colors">{t("compliance.frameworks")}</Link>
              <ChevronRight className="size-3.5" />
              {selectedAssessment.name}
            </span>
          ) : viewMode === "report" ? (
            <span className="flex items-center gap-1">
              <Link href="/system/compliance" onClick={goBack} className="hover:text-cyan-600 transition-colors">{t("compliance.frameworks")}</Link>
              <ChevronRight className="size-3.5" />
              {t("compliance.complianceReport")}
            </span>
          ) : (
            <span>{t("compliance.subtitle")}</span>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {viewMode !== "frameworks" && (
              <Button variant="outline" onClick={goBack} className="gap-1.5">
                <ArrowLeft className="size-3.5" />
                {t("common.back")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSeed}
              disabled={seeding}
              className="gap-1.5"
            >
              {seeding ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              {seeding ? t("compliance.initializing") : t("compliance.initData")}
            </Button>
          </div>
        }
      />

      {seedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          <CheckCircle2 className="size-4" />
          {seedMessage}
        </div>
      )}

      {viewMode === "frameworks" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { labelKey: "compliance.complianceFramework", value: stats.frameworks, icon: ShieldCheck, color: "cyan" },
              { labelKey: "compliance.totalControls", value: stats.totalControls, icon: ClipboardCheck, color: "violet" },
              { labelKey: "compliance.assessmentTasks", value: stats.assessments, icon: FileCheck, color: "blue" },
              { labelKey: "compliance.completedAssessments", value: stats.completed, icon: CheckCircle2, color: "emerald" },
            ].map((item) => (
              <div key={item.labelKey} className={`${softCardClass} p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${subtleTextClass}`}>{t(item.labelKey)}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
                  </div>
                  <span className={`rounded-lg ${severityColorMap[item.color] ?? "bg-background text-foreground"} p-2`}>
                    <item.icon className="size-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="frameworks">
            <TabsList variant="line">
              <TabsTrigger value="frameworks">
                <ShieldCheck className="size-3.5 mr-1" />
                {t("compliance.frameworks")}
              </TabsTrigger>
              <TabsTrigger value="assessments">
                <FileCheck className="size-3.5 mr-1" />
                {t("compliance.assessmentManagement")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frameworks" className="mt-4 space-y-4">
              {loading ? (
                <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>
              ) : frameworks.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  {t("compliance.noFrameworkData")}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {frameworks.map((fw) => (
                    <Card key={fw.id} className={CARD.elevated}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex size-10 shrink-0 items-center justify-center ${RADIUS.lg} bg-cyan-500/15 text-primary`}>
                            <Shield className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">{fw.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="rounded bg-zinc-500/15 px-1.5 py-0.5 text-[11px] text-primary font-mono">
                                {fw.code}
                              </code>
                              <span className={`text-[11px] ${subtleTextClass}`}>v{fw.version}</span>
                            </div>
                          </div>
                        </div>
                        <p className={`text-xs ${subtleTextClass} line-clamp-2`}>
                          {fw.description || t("compliance.noDescription")}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs ${subtleTextClass}`}>{t("compliance.controlItem")}</span>
                            <span className="text-sm font-semibold text-foreground">{fw.controls_count}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(fw.categories || []).slice(0, 3).map((cat) => (
                              <Badge
                                key={cat}
                                variant="outline"
                                className="border-border bg-background text-muted-foreground text-[11px]"
                              >
                                {cat}
                              </Badge>
                            ))}
                            {(fw.categories || []).length > 3 && (
                              <Badge
                                variant="outline"
                                className="border-border bg-background text-muted-foreground text-[11px]"
                              >
                                +{fw.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => handleViewControls(fw)}
                          >
                            <ClipboardCheck className="size-3.5" />
                            {t("compliance.viewControls")}
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                              setSelectedFramework(fw)
                              handleStartAssessment()
                            }}
                          >
                            <FileCheck className="size-3.5" />
                            {t("compliance.startAssessment")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assessments" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label={t("compliance.searchAssessments")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("compliance.searchAssessments")}
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-1 size-4" />
                  {t("compliance.createAssessment")}
                </Button>
              </div>

              {loading ? (
                <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>
              ) : assessments.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  {t("compliance.noAssessmentData")}
                </div>
              ) : (
                <div className="space-y-2">
                  {assessments
                    .filter((a) => {
                      if (!searchQuery) return true
                      return a.name.toLowerCase().includes(searchQuery.toLowerCase())
                    })
                    .map((assessment) => {
                      const fw = frameworks.find((f) => f.id === assessment.framework_id)
                      const statusCfg = assessmentStatusConfig[assessment.status] || assessmentStatusConfig.draft
                      return (
                        <Card key={assessment.id} className={pageCardClass}>
                          <CardContent className="p-0">
                            <button
                              type="button"
                              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                              onClick={() => handleViewAssessment(assessment)}
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
                                <FileCheck className="size-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">{assessment.name}</span>
                                  <Badge variant="outline" className={statusCfg.className}>
                                    {t(statusCfg.labelKey)}
                                  </Badge>
                                </div>
                                <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                                  {fw ? `${fw.name} (${fw.code})` : `${t("compliance.frameworks")} #${assessment.framework_id}`}
                                  {assessment.assessor && ` · ${t("compliance.assessorLabel")} ${assessment.assessor}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {assessment.overall_score !== null && (
                                  <div className="text-right">
                                    <p className={`text-xs ${subtleTextClass}`}>{t("compliance.scoreLabel")}</p>
                                    <p className="text-sm font-semibold text-foreground">{assessment.overall_score}</p>
                                  </div>
                                )}
                                <ChevronRight className="size-4 text-muted-foreground" />
                              </div>
                            </button>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {viewMode === "controls" && selectedFramework && (
        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-500/15 text-primary`}>
                  <Shield className="size-5" />
                </div>
                <div>
                  <h2 className={String(TYPOGRAPHY.h2)}>{selectedFramework.name}</h2>
                  <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                    {selectedFramework.code} · v{selectedFramework.version} · {controls.length} {t("compliance.controlCount")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={categoryFilter} onValueChange={(v) => { v && setCategoryFilter(v === "__all__" ? "" : v); setCurrentPage(1) }}>
                  <SelectTrigger className={`w-40 ${inputClass}`}>
                    <SelectValue placeholder={t("compliance.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("compliance.allCategories")}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={(v) => { v && setSeverityFilter(v === "__all__" ? "" : v); setCurrentPage(1) }}>
                  <SelectTrigger className={`w-32 ${inputClass}`}>
                    <SelectValue placeholder={t("compliance.allSeverities")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("compliance.allSeverities")}</SelectItem>
                    {Object.entries(severityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{t(cfg.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label={t("compliance.searchControls")}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                    placeholder={t("compliance.searchControls")}
                    className={`pl-9 ${inputClass}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {controlsLoading ? (
            <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>
          ) : filteredControls.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">{t("compliance.noMatchingControls")}</div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm" aria-label={t("compliance.controls")}>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.controlId")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.titleCol")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.category")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.severityLevel")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.mapping")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedControls.map((ctrl) => {
                      const sevCfg = severityConfig[ctrl.severity] || severityConfig.medium
                      return (
                        <tr key={ctrl.id} className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0">
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <code className="rounded bg-zinc-500/15 px-1.5 py-0.5 text-xs text-primary font-mono">
                              {ctrl.control_id}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap text-foreground">{ctrl.title}</td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <Badge variant="outline" className="border-border bg-background text-muted-foreground text-[11px]">
                              {ctrl.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <Badge variant="outline" className={sevCfg.className}>
                              {t(sevCfg.labelKey)}
                            </Badge>
                          </td>
                          <td className={`px-4 py-2.5 align-middle whitespace-nowrap text-xs ${subtleTextClass}`}>
                            {ctrl.mapping || "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                totalItems={filteredControls.length}
                pageSize={pageSize}
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                resultsLabel={t("compliance.resultsCount")}
                perPageLabel={t("compliance.paginationPerPage")}
              />
            </div>
          )}
        </div>
      )}

      {viewMode === "assessment-results" && selectedAssessment && (
        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-blue-500/10 text-primary`}>
                    <FileCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>{selectedAssessment.name}</h2>
                    <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                      {selectedAssessment.assessor ? `${t("compliance.assessorLabel")} ${selectedAssessment.assessor}` : ""}
                      {selectedAssessment.status && ` · ${t("compliance.statusLabel")} ${t(assessmentStatusConfig[selectedAssessment.status]?.labelKey || "compliance.statusDraft")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleAutoGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5" />
                    )}
                    {generating ? t("compliance.assessing") : t("compliance.autoAssess")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                  >
                    {reportLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    {reportLoading ? t("compliance.generating") : t("compliance.generateReport")}
                  </Button>
                </div>
              </div>

              {selectedAssessment.overall_score !== null && (
                <div className="flex items-center gap-8 mt-6">
                  <CircularProgress value={selectedAssessment.overall_score} />
                  {assessmentStats && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                      {[
                        { labelKey: "compliance.compliant", count: assessmentStats.compliant, color: "bg-emerald-500", textColor: "text-emerald-300" },
                        { labelKey: "compliance.partiallyCompliant", count: assessmentStats.partially, color: "bg-amber-500", textColor: "text-amber-400" },
                        { labelKey: "compliance.nonCompliant", count: assessmentStats.nonCompliant, color: "bg-red-500", textColor: "text-red-600" },
                        { labelKey: "compliance.notAssessed", count: assessmentStats.notAssessed, color: "bg-zinc-500", textColor: "text-muted-foreground" },
                      ].map((item) => (
                        <div key={item.labelKey} className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${item.color}`} />
                          <span className={`text-xs ${subtleTextClass}`}>{t(item.labelKey)}</span>
                          <span className={`text-sm font-semibold ${item.textColor}`}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {assessmentLoading ? (
            <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>
          ) : !selectedAssessment.results || selectedAssessment.results.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              {t("compliance.noResults")}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm" aria-label={t("compliance.resultTable")}>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.controlId")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.titleCol")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("common.status")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.findings")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("compliance.remediation")}</th>
                      <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssessment.results.map((result) => {
                      const statusCfg = statusConfig[result.status] || statusConfig.not_assessed
                      return (
                        <tr key={result.id} className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0">
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <code className="rounded bg-zinc-500/15 px-1.5 py-0.5 text-xs text-primary font-mono">
                              {result.control?.control_id || `#${result.control_id}`}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap text-foreground">
                            {result.control?.title || "-"}
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <Badge variant="outline" className={statusCfg.className}>
                              <span className={`size-1.5 rounded-full ${statusCfg.dotClass}`} />
                              {t(statusCfg.labelKey)}
                            </Badge>
                          </td>
                          <td className={`px-4 py-2.5 align-middle whitespace-nowrap text-xs max-w-[200px] truncate ${subtleTextClass}`}>
                            {result.findings || "-"}
                          </td>
                          <td className={`px-4 py-2.5 align-middle whitespace-nowrap text-xs max-w-[200px] truncate ${subtleTextClass}`}>
                            {result.remediation || "-"}
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-cyan-600 hover:text-primary hover:bg-primary/10"
                              onClick={() => setEditResult(result)}
                            >
                              {t("common.edit")}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === "report" && reportData && (
        <div className="space-y-4">
          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-500/15 text-primary`}>
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>{reportData.framework.name}</h2>
                    <p className={`text-xs ${subtleTextClass} mt-0.5`}>
                      {reportData.framework.code} · v{reportData.framework.version}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                  {t("compliance.complianceReport")}
                </Badge>
              </div>

              <div className="flex items-center gap-8 mt-6">
                <div className="flex flex-col items-center">
                  <CircularProgress value={reportData.overall_score} size={140} strokeWidth={12} />
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-3xl font-bold ${getGrade(reportData.overall_score).color}`}>
                      {getGrade(reportData.overall_score).grade}
                    </span>
                    <span className={`text-xs ${subtleTextClass}`}>{t("compliance.grade")}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className={`text-xs font-medium text-muted-foreground mb-2`}>{t("compliance.controlResultSummary")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { labelKey: "compliance.compliant", count: reportData.summary.compliant, total: reportData.summary.total, color: "bg-emerald-500", bg: "bg-emerald-500/15", textColor: "text-emerald-300" },
                        { labelKey: "compliance.partiallyCompliant", count: reportData.summary.partially_compliant, total: reportData.summary.total, color: "bg-amber-500", bg: "bg-amber-500/15", textColor: "text-amber-400" },
                        { labelKey: "compliance.nonCompliant", count: reportData.summary.non_compliant, total: reportData.summary.total, color: "bg-red-500", bg: "bg-red-500/15", textColor: "text-red-600" },
                        { labelKey: "compliance.notAssessed", count: reportData.summary.not_assessed, total: reportData.summary.total, color: "bg-zinc-500", bg: "bg-zinc-500/15", textColor: "text-muted-foreground" },
                      ].map((item) => (
                        <div key={item.labelKey} className={`${item.bg} rounded-lg px-3 py-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`size-2 rounded-full ${item.color}`} />
                              <span className={`text-xs ${item.textColor}`}>{t(item.labelKey)}</span>
                            </div>
                            <span className={`text-sm font-semibold ${item.textColor}`}>{item.count}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-muted/50">
                            <div
                              className={`h-full rounded-full ${item.color} transition-colors duration-500`}
                              style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {reportData.category_breakdown && reportData.category_breakdown.length > 0 && (
            <Card className={pageCardClass}>
              <CardContent className="p-5">
                <h3 className={String(TYPOGRAPHY.h3) + " mb-4"}>{t("compliance.categoryBreakdown")}</h3>
                <div className="space-y-3">
                  {reportData.category_breakdown.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-4">
                      <span className="text-sm text-foreground w-32 shrink-0 truncate">{cat.category}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-500/15">
                        <div
                          className={`h-full rounded-full transition-colors duration-500 ${
                            cat.score >= 75 ? "bg-emerald-500" : cat.score >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-foreground">{Math.round(cat.score)}%</span>
                        <span className={`text-xs ${subtleTextClass}`}>
                          ({cat.compliant}/{cat.total})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreateAssessmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        frameworks={frameworks}
        onCreated={loadAssessments}
      />

      <ResultEditDialog
        open={!!editResult}
        onOpenChange={(open) => { if (!open) setEditResult(null) }}
        result={editResult}
        onSaved={handleRefreshAssessment}
      />
    </div>
  )
}
