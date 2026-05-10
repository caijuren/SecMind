import { create } from "zustand"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Locale } from "@/i18n/types"
import { translations } from "@/i18n/translations"

interface LocaleState {
  locale: Locale
}

interface LocaleActions {
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

export type LocaleStore = LocaleState & LocaleActions

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === "string" ? current : path
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    immer((set, get) => ({
      locale: "zh-CN" as Locale,
      setLocale: (locale: Locale) =>
        set((state) => {
          state.locale = locale
        }),
      t: (key: string): string => {
        if (!key) return ""
        const locale = get().locale
        const dict = translations[locale] ?? translations["zh-CN"]
        if (!dict) return key
        return getNestedValue(dict as unknown as Record<string, unknown>, key)
      },
    })),
    {
      name: "secmind-locale",
    }
  )
)
