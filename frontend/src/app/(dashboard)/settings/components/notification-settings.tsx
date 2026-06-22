"use client"

import { Bell } from "lucide-react"
import { useLocaleStore } from "@/store/locale-store"
import { SimpleToggle, SettingRow, SettingSection } from "./shared"

interface NotificationSettingsProps {
  settings: {
    emailNotifications: boolean
    criticalAlerts: boolean
    highAlerts: boolean
    mediumAlerts: boolean
    dailyReport: boolean
  }
  onChange: (patch: Partial<NotificationSettingsProps["settings"]>) => void
}

export function NotificationSettings({ settings, onChange }: NotificationSettingsProps) {
  const { t } = useLocaleStore()

  return (
    <SettingSection
      icon={Bell}
      title={t("settings.notification")}
      description={t("settings.notificationDesc")}
    >
      <SettingRow label={t("settings.emailNotification")} description={t("settings.emailNotifDesc")}>
        <SimpleToggle
          checked={settings.emailNotifications}
          onCheckedChange={(checked) => onChange({ emailNotifications: checked })}
          ariaLabel={t("settings.emailNotification")}
        />
      </SettingRow>

      <SettingRow label={t("settings.criticalAlerts")} description={t("settings.criticalAlertsDesc")}>
        <SimpleToggle
          checked={settings.criticalAlerts}
          onCheckedChange={(checked) => onChange({ criticalAlerts: checked })}
          ariaLabel={t("settings.criticalAlerts")}
        />
      </SettingRow>

      <SettingRow label={t("settings.highAlerts")} description={t("settings.highAlertsDesc")}>
        <SimpleToggle
          checked={settings.highAlerts}
          onCheckedChange={(checked) => onChange({ highAlerts: checked })}
          ariaLabel={t("settings.highAlerts")}
        />
      </SettingRow>

      <SettingRow label={t("settings.mediumAlerts")} description={t("settings.mediumAlertsDesc")}>
        <SimpleToggle
          checked={settings.mediumAlerts}
          onCheckedChange={(checked) => onChange({ mediumAlerts: checked })}
          ariaLabel={t("settings.mediumAlerts")}
        />
      </SettingRow>

      <SettingRow label={t("settings.dailyReport")} description={t("settings.dailyReportDesc")}>
        <SimpleToggle
          checked={settings.dailyReport}
          onCheckedChange={(checked) => onChange({ dailyReport: checked })}
          ariaLabel={t("settings.dailyReport")}
        />
      </SettingRow>
    </SettingSection>
  )
}
