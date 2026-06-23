"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  KeyRound,
  Plug,
  Workflow,
  Shield,
  Cpu,
  Bell,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  Settings,
  Users,
  Building2,
  CreditCard,
  ShieldCheck,
  FileText,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { softCardClass } from "@/lib/admin-ui"
import { PageHeader } from "@/components/layout/page-header"
import { SettingsLayout, type SettingsMenuGroup } from "@/components/layout/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocaleStore } from "@/store/locale-store"
import { usePageTitle } from "@/hooks/use-page-title"

// 全局配置（轻量组件，直接导入）
import { SecuritySettings } from "./components/security-settings"
import { AIEngineSettings } from "./components/ai-engine-settings"
import { NotificationSettings } from "./components/notification-settings"
import { DataRetentionSettings } from "./components/data-retention-settings"

// AI 配置 — 懒加载
const MCPPage = dynamic(() => import("./mcp/page-content").then((m) => m.MCPPage), { ssr: false })
const ProvidersPage = dynamic(() => import("./providers/page-content").then((m) => m.ProvidersPage), { ssr: false })
const SkillsPage = dynamic(() => import("./skills/page-content").then((m) => m.SkillsPage), { ssr: false })

// 数据接入 — 懒加载
const DataSourcePage = dynamic(() => import("@/app/(dashboard)/datasource/page-content").then((m) => m.DataSourcePage), { ssr: false })
const IntegrationsPage = dynamic(() => import("@/app/(dashboard)/integrations/page-content").then((m) => m.IntegrationsPage), { ssr: false })

// 组织与权限 — 懒加载
const UsersPage = dynamic(() => import("@/app/(dashboard)/users/page-content").then((m) => m.UsersPage), { ssr: false })
const RbacPage = dynamic(() => import("@/app/(dashboard)/system/rbac/page-content").then((m) => m.RbacPage), { ssr: false })
const TenantsPage = dynamic(() => import("@/app/(dashboard)/system/tenants/page-content").then((m) => m.TenantsPage), { ssr: false })

// 安全合规 — 懒加载
const CompliancePage = dynamic(() => import("@/app/(dashboard)/system/compliance/page-content").then((m) => m.CompliancePage), { ssr: false })
const AuditPage = dynamic(() => import("@/app/(dashboard)/audit/page-content").then((m) => m.AuditPage), { ssr: false })

// 运营 — 懒加载
const ReportsPage = dynamic(() => import("@/app/(dashboard)/reports/page-content").then((m) => m.ReportsPage), { ssr: false })
const BillingPage = dynamic(() => import("@/app/(dashboard)/system/billing/page-content").then((m) => m.BillingPage), { ssr: false })

// ==================== 系统设置状态类型 ====================

interface SystemSettings {
  autoBlock: boolean
  mfaEnabled: boolean
  sessionTimeout: string
  passwordPolicy: string
  aiModel: string
  confidenceThreshold: string
  autoRemediation: boolean
  maxConcurrentAnalysis: string
  emailNotifications: boolean
  criticalAlerts: boolean
  highAlerts: boolean
  mediumAlerts: boolean
  dailyReport: boolean
  alertRetention: string
  logRetention: string
  caseRetention: string
  autoCleanup: boolean
}

const DEFAULT_SETTINGS: SystemSettings = {
  autoBlock: true,
  mfaEnabled: true,
  sessionTimeout: "30",
  passwordPolicy: "strong",
  aiModel: "secmind-lm-72b",
  confidenceThreshold: "85",
  autoRemediation: true,
  maxConcurrentAnalysis: "10",
  emailNotifications: true,
  criticalAlerts: true,
  highAlerts: true,
  mediumAlerts: false,
  dailyReport: true,
  alertRetention: "90",
  logRetention: "180",
  caseRetention: "365",
  autoCleanup: false,
}

// ==================== 主页面 ====================

export default function SettingsPage() {
  usePageTitle("settings")
  const { t } = useLocaleStore()
  const [activeId, setActiveId] = useState("providers")
  const [settings, setSettings] = useState<SystemSettings>({ ...DEFAULT_SETTINGS })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // ---------- 菜单定义 ----------

  const MENU_GROUPS: SettingsMenuGroup[] = useMemo(() => [
    {
      label: t("settings.aiConfigGroup"),
      items: [
        { id: "providers", label: t("settings.providerConfig"), icon: KeyRound, href: "/settings/providers" },
        { id: "mcp", label: t("settings.mcpManagement"), icon: Plug },
        { id: "skills", label: t("settings.skillManagement"), icon: Workflow, href: "/settings/skills" },
      ],
    },
    {
      label: t("settings.globalConfigGroup"),
      items: [
        { id: "security", label: t("settings.security"), icon: Shield },
        { id: "ai-engine", label: t("settings.aiEngine"), icon: Cpu },
        { id: "notification", label: t("settings.notification"), icon: Bell },
        { id: "data-retention", label: t("settings.dataRetention"), icon: Database },
      ],
    },
    {
      label: t("settings.dataAccessGroup"),
      items: [
        { id: "datasource", label: t("nav.tabDataSource") || "数据源", icon: Database },
        { id: "integrations", label: t("nav.integrations") || "集成", icon: Plug },
      ],
    },
    {
      label: t("settings.orgPermissionsGroup"),
      items: [
        { id: "users", label: t("nav.users") || "用户管理", icon: Users },
        { id: "rbac", label: t("settings.rbacManagement"), icon: Shield },
        { id: "tenants", label: t("settings.tenantManagement"), icon: Building2 },
      ],
    },
    {
      label: t("settings.securityComplianceGroup"),
      items: [
        { id: "compliance", label: t("settings.complianceManagement"), icon: ShieldCheck },
        { id: "audit", label: t("nav.audit") || "审计日志", icon: FileText },
      ],
    },
    {
      label: t("settings.operationsGroup"),
      items: [
        // { id: "reports", label: t("nav.reports") || "报告", icon: FileText },
        { id: "billing", label: t("settings.billingSubscription"), icon: CreditCard },
      ],
    },
  ], [t])

  // ---------- 加载系统设置 ----------

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get("/system-settings")
      const data = res.data
      if (data) {
        setSettings({
          autoBlock: data.auto_response_threshold != null ? data.auto_response_threshold >= 0.9 : true,
          mfaEnabled: data.mfa_enabled ?? true,
          sessionTimeout: String(data.session_timeout ?? 30),
          passwordPolicy: data.password_min_length >= 16 ? "strong" : data.password_min_length >= 12 ? "medium" : "basic",
          aiModel: data.ai_model ?? "secmind-lm-72b",
          confidenceThreshold: String(Math.round((data.ai_temperature ?? 0.85) * 100)),
          autoRemediation: data.auto_response_threshold != null ? data.auto_response_threshold >= 0.8 : true,
          maxConcurrentAnalysis: String(data.ai_max_tokens ? Math.round(data.ai_max_tokens / 400) : 10),
          emailNotifications: true,
          criticalAlerts: true,
          highAlerts: true,
          mediumAlerts: false,
          dailyReport: true,
          alertRetention: String(data.log_retention ?? 90),
          logRetention: String(data.log_retention ?? 180),
          caseRetention: "365",
          autoCleanup: false,
        })
      }
    } catch {
      // use defaults
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => { void loadSettings() })
  }, [loadSettings])

  // ---------- 系统设置变更 ----------

  function updateSettings(patch: Partial<SystemSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put("/system-settings", {
        system_name: "SecMind",
        session_timeout: Number(settings.sessionTimeout),
        ip_whitelist: "",
        log_retention: Number(settings.logRetention),
        mfa_enabled: settings.mfaEnabled,
        password_min_length: settings.passwordPolicy === "strong" ? 16 : settings.passwordPolicy === "medium" ? 12 : 8,
        ai_model: settings.aiModel,
        ai_temperature: Number(settings.confidenceThreshold) / 100,
        ai_max_tokens: Number(settings.maxConcurrentAnalysis) * 400,
        rag_enabled: true,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    try {
      await api.put("/system-settings", {
        system_name: "SecMind",
        session_timeout: 30,
        ip_whitelist: "",
        log_retention: 90,
        mfa_enabled: true,
        password_min_length: 16,
        ai_model: "gpt-4o",
        ai_temperature: 0.7,
        ai_max_tokens: 4096,
        rag_enabled: true,
      })
      await loadSettings()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  // ---------- 判断当前是否为系统设置分区 ----------

  const isSystemSection = ["security", "ai-engine", "notification", "data-retention"].includes(activeId)

  // ==================== 渲染 ====================

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Settings}
        title={t("settings.settingsTitle")}
        subtitle={t("settings.settingsSubtitle")}
        actions={
          isSystemSection ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReset} disabled={saving}>
                <RotateCcw className="size-4" />
                {t("settings.resetDefault")}
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={saving}>
                {saved ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    {t("settings.saved")}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {t("settings.saveChanges")}
                  </>
                )}
              </Button>
            </div>
          ) : undefined
        }
      />

      <SettingsLayout
        groups={MENU_GROUPS}
        activeId={activeId}
        onNavigate={setActiveId}
      >
        {/* AI 配置 */}
        {activeId === "providers" && <ProvidersPage />}
        {activeId === "mcp" && <MCPPage />}
        {activeId === "skills" && <SkillsPage />}

        {/* 全局配置 */}
        {activeId === "security" && (
          <SecuritySettings settings={settings} onChange={updateSettings} />
        )}
        {activeId === "ai-engine" && (
          <AIEngineSettings settings={settings} onChange={updateSettings} />
        )}
        {activeId === "notification" && (
          <NotificationSettings settings={settings} onChange={updateSettings} />
        )}
        {activeId === "data-retention" && (
          <DataRetentionSettings settings={settings} onChange={updateSettings} />
        )}

        {/* 数据接入 */}
        {activeId === "datasource" && <DataSourcePage />}
        {activeId === "integrations" && <IntegrationsPage />}

        {/* 组织与权限 */}
        {activeId === "users" && <UsersPage />}
        {activeId === "rbac" && <RbacPage />}
        {activeId === "tenants" && <TenantsPage />}

        {/* 安全合规 */}
        {activeId === "compliance" && <CompliancePage />}
        {activeId === "audit" && <AuditPage />}

        {/* 运营 */}
        {activeId === "reports" && <ReportsPage />}
        {activeId === "billing" && <BillingPage />}

        {/* 全局配置底部操作栏 */}
        {isSystemSection && (
          <Card className={cn(softCardClass, "mt-6")}>
            <CardContent className="p-5 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("settings.changeWarning")}
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={handleReset} disabled={saving}>
                  <RotateCcw className="size-4" />
                  {t("settings.resetDefault")}
                </Button>
                <Button onClick={handleSave} className="gap-2" disabled={saving}>
                  {saved ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      {t("settings.saved")} ✓
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      {t("settings.saveChanges")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </SettingsLayout>
    </div>
  )
}
