"use client"

import { Shield } from "lucide-react"
import { inputClass } from "@/lib/admin-ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocaleStore } from "@/store/locale-store"
import { SimpleToggle, SettingRow, SettingSection } from "./shared"

interface SecuritySettingsProps {
  settings: {
    autoBlock: boolean
    mfaEnabled: boolean
    sessionTimeout: string
    passwordPolicy: string
  }
  onChange: (patch: Partial<SecuritySettingsProps["settings"]>) => void
}

export function SecuritySettings({ settings, onChange }: SecuritySettingsProps) {
  const { t } = useLocaleStore()

  return (
    <SettingSection
      icon={Shield}
      title={t("settings.security")}
      description={t("settings.securitySettings")}
    >
      <SettingRow label={t("settings.autoBlock")} description={t("settings.autoBlockDesc")}>
        <SimpleToggle
          checked={settings.autoBlock}
          onCheckedChange={(checked) => onChange({ autoBlock: checked })}
          ariaLabel={t("settings.autoBlock")}
        />
      </SettingRow>

      <SettingRow label={t("settings.mfa")} description={t("settings.mfaDesc")}>
        <SimpleToggle
          checked={settings.mfaEnabled}
          onCheckedChange={(checked) => onChange({ mfaEnabled: checked })}
          ariaLabel={t("settings.mfa")}
        />
      </SettingRow>

      <SettingRow label={t("settings.sessionTimeout")} description={t("settings.sessionTimeoutDesc")}>
        <Select
          value={settings.sessionTimeout}
          onValueChange={(value) => onChange({ sessionTimeout: value ?? "30" })}
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

      <SettingRow label={t("settings.passwordPolicy")} description={t("settings.passwordPolicyDesc")}>
        <Select
          value={settings.passwordPolicy}
          onValueChange={(value) => onChange({ passwordPolicy: value ?? "strong" })}
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
  )
}
