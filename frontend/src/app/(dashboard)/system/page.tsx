"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Settings,
  Shield,
  Database,
  Bell,
  Key,
  Globe,
  Users,
  Cpu,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"
import { api } from "@/lib/api"
import { inputClass } from "@/lib/admin-ui"
import {
  TYPOGRAPHY,
  CARD,
  RADIUS,
} from "@/lib/design-system"

// ==================== 组件 ====================

/** 简单的Toggle开关 - 替代不存在的Switch组件 */
function SimpleToggle({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}
function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-b-0">
      <div className="flex-1 pr-6">
        <Label className={String(TYPOGRAPHY.h3) + " text-slate-800 cursor-pointer"}>{label}</Label>
        {description && (
          <p className={String(TYPOGRAPHY.caption) + " text-slate-500 mt-1"}>{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** 设置区块组件 */
function SettingSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className={CARD.elevated}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-primary/10`}>
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <h2 className={String(TYPOGRAPHY.h2)}>{title}</h2>
            {description && (
              <p className={String(TYPOGRAPHY.caption) + "text-slate-500 mt-0.5"}>{description}</p>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== 主页面 ====================

export default function SystemPage() {
  const { t } = useLocaleStore()
  
  const [settings, setSettings] = useState({
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
  })

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => { void loadSettings() })
  }, [loadSettings])

  const handleSave = async () => {
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

  const handleReset = async () => {
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 页面标题 */}
      <PageHeader
        icon={Settings}
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        actions={
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
        }
      />

      {/* 安全设置 */}
      <SettingSection
        icon={Shield}
        title={t("settings.security")}
        description={t("settings.securitySettings")}
      >
        <SettingRow
          label={t("settings.autoBlock")}
          description={t("settings.autoBlockDesc")}
        >
          <SimpleToggle
            checked={settings.autoBlock}
            onCheckedChange={(checked) => setSettings({ ...settings, autoBlock: checked })}
            ariaLabel={t("settings.autoBlock")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.mfa")}
          description={t("settings.mfaDesc")}
        >
          <SimpleToggle
            checked={settings.mfaEnabled}
            onCheckedChange={(checked) => setSettings({ ...settings, mfaEnabled: checked })}
            ariaLabel={t("settings.mfa")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.sessionTimeout")}
          description={t("settings.sessionTimeoutDesc")}
        >
          <Select
            value={settings.sessionTimeout}
            onValueChange={(value) => setSettings({ ...settings, sessionTimeout: value ?? "30" })}
          >
            <SelectTrigger size="sm" className={`w-32 ${inputClass}`}>
              <SelectValue placeholder={t("settings.selectTime")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">{t("settings.minutes15")}</SelectItem>
              <SelectItem value="30">{t("settings.minutes30")}</SelectItem>
              <SelectItem value="60">{t("settings.hour1")}</SelectItem>
              <SelectItem value="120">{t("settings.hour2")}</SelectItem>
              <SelectItem value="480">{t("settings.hour8")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label={t("settings.passwordPolicy")}
          description={t("settings.passwordPolicyDesc")}
        >
          <Select
            value={settings.passwordPolicy}
            onValueChange={(value) => setSettings({ ...settings, passwordPolicy: value ?? "strong" })}
          >
            <SelectTrigger size="sm" className={`w-36 ${inputClass}`}>
              <SelectValue placeholder={t("settings.selectPolicy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">{t("settings.passwordBasic")}</SelectItem>
              <SelectItem value="medium">{t("settings.passwordMedium")}</SelectItem>
              <SelectItem value="strong">{t("settings.passwordStrong")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingSection>

      {/* AI引擎配置 */}
      <SettingSection
        icon={Cpu}
        title={t("settings.aiEngine")}
        description={t("settings.aiEngineDesc")}
      >
        <SettingRow
          label={t("settings.aiModel")}
          description={t("settings.aiModelDesc")}
        >
          <Select
            value={settings.aiModel}
            onValueChange={(value) => setSettings({ ...settings, aiModel: value ?? "secmind-lm-72b" })}
          >
            <SelectTrigger size="sm" className={`w-48 ${inputClass}`}>
              <SelectValue placeholder={t("settings.selectModel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="secmind-lm-72b">{t("settings.modelSecMind72b")}</SelectItem>
              <SelectItem value="secmind-lm-13b">{t("settings.modelSecMind13b")}</SelectItem>
              <SelectItem value="gpt-4-turbo">{t("settings.modelGpt4Turbo")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label={t("settings.confidenceThreshold")}
          description={t("settings.confidenceThresholdDesc")}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="confidenceThreshold"
              autoComplete="off"
              min="50"
              max="99"
              value={settings.confidenceThreshold}
              onChange={(e) => setSettings({ ...settings, confidenceThreshold: e.target.value })}
              className={`w-20 ${inputClass}`}
            />
            <span className={String(TYPOGRAPHY.caption) + "text-slate-500"}>%</span>
          </div>
        </SettingRow>

        <SettingRow
          label={t("settings.autoRemediation")}
          description={t("settings.autoRemediationDesc")}
        >
          <SimpleToggle
            checked={settings.autoRemediation}
            onCheckedChange={(checked) => setSettings({ ...settings, autoRemediation: checked })}
            ariaLabel={t("settings.autoRemediation")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.maxConcurrentAnalysis")}
          description={t("settings.maxConcurrentAnalysisDesc")}
        >
          <Input
            type="number"
            name="maxConcurrentAnalysis"
            autoComplete="off"
            min="1"
            max="50"
            value={settings.maxConcurrentAnalysis}
            onChange={(e) => setSettings({ ...settings, maxConcurrentAnalysis: e.target.value })}
            className={`w-20 ${inputClass}`}
          />
        </SettingRow>
      </SettingSection>

      {/* 通知设置 */}
      <SettingSection
        icon={Bell}
        title={t("settings.notification")}
        description={t("settings.notificationDesc")}
      >
        <SettingRow
          label={t("settings.emailNotification")}
          description={t("settings.emailNotifDesc")}
        >
          <SimpleToggle
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            ariaLabel={t("settings.emailNotification")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.criticalAlerts")}
          description={t("settings.criticalAlertsDesc")}
        >
          <SimpleToggle
            checked={settings.criticalAlerts}
            onCheckedChange={(checked) => setSettings({ ...settings, criticalAlerts: checked })}
            ariaLabel={t("settings.criticalAlerts")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.highAlerts")}
          description={t("settings.highAlertsDesc")}
        >
          <SimpleToggle
            checked={settings.highAlerts}
            onCheckedChange={(checked) => setSettings({ ...settings, highAlerts: checked })}
            ariaLabel={t("settings.highAlerts")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.mediumAlerts")}
          description={t("settings.mediumAlertsDesc")}
        >
          <SimpleToggle
            checked={settings.mediumAlerts}
            onCheckedChange={(checked) => setSettings({ ...settings, mediumAlerts: checked })}
            ariaLabel={t("settings.mediumAlerts")}
          />
        </SettingRow>

        <SettingRow
          label={t("settings.dailyReport")}
          description={t("settings.dailyReportDesc")}
        >
          <SimpleToggle
            checked={settings.dailyReport}
            onCheckedChange={(checked) => setSettings({ ...settings, dailyReport: checked })}
            ariaLabel={t("settings.dailyReport")}
          />
        </SettingRow>
      </SettingSection>

      {/* 数据保留设置 */}
      <SettingSection
        icon={Database}
        title={t("settings.dataRetention")}
        description={t("settings.dataRetentionDesc")}
      >
        <SettingRow
          label={t("settings.alertRetention")}
          description={t("settings.alertRetentionDesc")}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="alertRetention"
              autoComplete="off"
              min="30"
              max="730"
              value={settings.alertRetention}
              onChange={(e) => setSettings({ ...settings, alertRetention: e.target.value })}
              className={`w-20 ${inputClass}`}
            />
            <span className={String(TYPOGRAPHY.caption) + "text-slate-500"}>{t("settings.days")}</span>
          </div>
        </SettingRow>

        <SettingRow
          label={t("settings.logRetentionLabel")}
          description={t("settings.logRetentionDesc")}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="logRetention"
              autoComplete="off"
              min="30"
              max="1095"
              value={settings.logRetention}
              onChange={(e) => setSettings({ ...settings, logRetention: e.target.value })}
              className={`w-20 ${inputClass}`}
            />
            <span className={String(TYPOGRAPHY.caption) + "text-slate-500"}>{t("settings.days")}</span>
          </div>
        </SettingRow>

        <SettingRow
          label={t("settings.caseRetention")}
          description={t("settings.caseRetentionDesc")}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              name="caseRetention"
              autoComplete="off"
              min="90"
              max="1825"
              value={settings.caseRetention}
              onChange={(e) => setSettings({ ...settings, caseRetention: e.target.value })}
              className={`w-20 ${inputClass}`}
            />
            <span className={String(TYPOGRAPHY.caption) + "text-slate-500"}>{t("settings.days")}</span>
          </div>
        </SettingRow>

        <SettingRow
          label={t("settings.autoCleanup")}
          description={t("settings.autoCleanupDesc")}
        >
          <SimpleToggle
            checked={settings.autoCleanup}
            onCheckedChange={(checked) => setSettings({ ...settings, autoCleanup: checked })}
            ariaLabel={t("settings.autoCleanup")}
          />
        </SettingRow>
      </SettingSection>

      {/* 底部操作栏 */}
      <Card className={CARD.default}>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className={String(TYPOGRAPHY.body) + "text-slate-600"}>
              {t("settings.changeWarning")}
            </p>
          </div>
          
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
    </div>
  )
}
