"use client"

import { Cpu } from "lucide-react"
import { inputClass } from "@/lib/admin-ui"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocaleStore } from "@/store/locale-store"
import { SimpleToggle, SettingRow, SettingSection } from "./shared"

interface AIEngineSettingsProps {
  settings: {
    aiModel: string
    confidenceThreshold: string
    autoRemediation: boolean
    maxConcurrentAnalysis: string
  }
  onChange: (patch: Partial<AIEngineSettingsProps["settings"]>) => void
}

export function AIEngineSettings({ settings, onChange }: AIEngineSettingsProps) {
  const { t } = useLocaleStore()

  return (
    <SettingSection
      icon={Cpu}
      title={t("settings.aiEngine")}
      description={t("settings.aiEngineDesc")}
    >
      <SettingRow label={t("settings.aiModel")} description={t("settings.aiModelDesc")}>
        <Select
          value={settings.aiModel}
          onValueChange={(value) => onChange({ aiModel: value ?? "secmind-lm-72b" })}
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

      <SettingRow label={t("settings.confidenceThreshold")} description={t("settings.confidenceThresholdDesc")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            autoComplete="off"
            min="50"
            max="99"
            value={settings.confidenceThreshold}
            onChange={(e) => onChange({ confidenceThreshold: e.target.value })}
            className={`w-20 ${inputClass}`}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </SettingRow>

      <SettingRow label={t("settings.autoRemediation")} description={t("settings.autoRemediationDesc")}>
        <SimpleToggle
          checked={settings.autoRemediation}
          onCheckedChange={(checked) => onChange({ autoRemediation: checked })}
          ariaLabel={t("settings.autoRemediation")}
        />
      </SettingRow>

      <SettingRow label={t("settings.maxConcurrentAnalysis")} description={t("settings.maxConcurrentAnalysisDesc")}>
        <Input
          type="number"
          autoComplete="off"
          min="1"
          max="50"
          value={settings.maxConcurrentAnalysis}
          onChange={(e) => onChange({ maxConcurrentAnalysis: e.target.value })}
          className={`w-20 ${inputClass}`}
        />
      </SettingRow>
    </SettingSection>
  )
}
