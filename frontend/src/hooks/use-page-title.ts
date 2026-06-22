"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/store/locale-store";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  signals: "Signals",
  investigate: "AI Investigation",
  cases: "Cases",
  response: "Response",
  learning: "Learning",
  hunting: "Threat Hunting",
  knowledge: "Knowledge",
  notifications: "Notifications",
  settings: "Settings",
  assets: "Assets",
  datasource: "Data Sources",
  workflows: "Workflows",
  reports: "Reports",
  audit: "Audit",
  users: "Users",
  "ai-chat": "AI Assistant",
  "ai-analysis": "AI Analysis",
  workbench: "Workbench",
  screen: "Situation Screen",
  "situation-room": "Situation Room",
  metrics: "Metrics",
  integrations: "Integrations",
  onboarding: "Onboarding",
  playbooks: "Playbooks",
  system: "System",
};

export function usePageTitle(pageKey: string) {
  const { locale } = useLocaleStore();

  useEffect(() => {
    const pageTitle = PAGE_TITLES[pageKey] || pageKey;
    document.title = `${pageTitle} - SecMind`;
    return () => {
      document.title = "SecMind";
    };
  }, [pageKey, locale]);
}
