"use client"

import { Database } from "lucide-react"
import { inputClass } from "@/lib/admin-ui"
import { Input } from "@/components/ui/input"
import { useLocaleStore } from "@/store/locale-store"
import { SimpleToggle, SettingRow, SettingSection } from "./shared"

interface DataRetentionSettingsProps {
  settings: {
    alertRetention: string
    logRetention: string
    caseRetention: string
    autoCleanup: boolean
  }
  onChange: (patch: Partial<DataRetentionSettingsProps["settings"]>) => void
}

export function DataRetentionSettings({ settings, onChange }: DataRetentionSettingsProps) {
  const { t } = useLocaleStore()

  return (
    <SettingSection
      icon={Database}
      title={t("settings.dataRetention")}
      description={t("settings.dataRetentionDesc")}
    >
      <SettingRow label={t("settings.alertRetention")} description={t("settings.alertRetentionDesc")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            autoComplete="off"
            min="30"
            max="730"
            value={settings.alertRetention}
            onChange={(e) => onChange({ alertRetention: e.target.value })}
            className={`w-20 ${inputClass}`}
          />
          <span className="text-xs text-muted-foreground">{t("settings.days")}</span>
        </div>
      </SettingRow>

      <SettingRow label={t("settings.logRetentionLabel")} description={t("settings.logRetentionDesc")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            autoComplete="off"
            min="30"
            max="1095"
            value={settings.logRetention}
            onChange={(e) => onChange({ logRetention: e.target.value })}
            className={`w-20 ${inputClass}`}
          />
          <span className="text-xs text-muted-foreground">{t("settings.days")}</span>
        </div>
      </SettingRow>

      <SettingRow label={t("settings.caseRetention")} description={t("settings.caseRetentionDesc")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            autoComplete="off"
            min="90"
            max="1825"
            value={settings.caseRetention}
            onChange={(e) => onChange({ caseRetention: e.target.value })}
            className={`w-20 ${inputClass}`}
          />
          <span className="text-xs text-muted-foreground">{t("settings.days")}</span>
        </div>
      </SettingRow>

      <SettingRow label={t("settings.autoCleanup")} description={t("settings.autoCleanupDesc")}>
        <SimpleToggle
          checked={settings.autoCleanup}
          onCheckedChange={(checked) => onChange({ autoCleanup: checked })}
          ariaLabel={t("settings.autoCleanup")}
        />
      </SettingRow>
    </SettingSection>
  )
}
