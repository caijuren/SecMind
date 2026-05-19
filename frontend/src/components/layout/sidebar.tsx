"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import {
  Shield,
  Radio,
  Zap,
  GraduationCap,
  BookOpen,
  Database,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Hexagon,
  Monitor,
  LayoutDashboard,
  FileText,
  Users,
  Server,
  Workflow,
  Target,
  TrendingUp,
  Plug,
  GitBranch,
  Brain,
  Building2,
  CreditCard,
  ShieldCheck,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  accent: string
  permission?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLocaleStore()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const [mounted, setMounted] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mainNavGroups: NavGroup[] = useMemo(() => [
    {
      label: "监控中心",
      items: [
        { label: "运营看板", href: "/dashboard", icon: LayoutDashboard, accent: "#3b82f6", permission: "dashboard_overview:read" },
        { label: "态势大屏", href: "/screen", icon: Monitor, accent: "#06b6d4", permission: "dashboard_situation:read" },
        { label: "运营指标", href: "/metrics", icon: TrendingUp, accent: "#22c55e", permission: "dashboard_metrics:read" },
      ],
    },
    {
      label: "告警处置",
      items: [
        { label: "告警事件", href: "/signals", icon: Radio, accent: "#ef4444", permission: "alerts:read" },
        { label: "智能研判", href: "/investigate", icon: GitBranch, accent: "#3b82f6", permission: "alerts:read" },
        { label: "AI处置中心", href: "/response", icon: Zap, accent: "#f97316", permission: "response:read" },
      ],
    },
    {
      label: "AI 能力",
      items: [
        { label: t("nav.aiAnalysis") || "工作台", href: "/ai-analysis", icon: Brain, accent: "#8b5cf6", permission: "ai:read" },
        { label: t("nav.aiChat") || "AI会话助手", href: "/ai-chat", icon: Brain, accent: "#8b5cf6", permission: "ai:read" },
        { label: t("nav.tabAiKnowledge"), href: "/knowledge", icon: BookOpen, accent: "#8b5cf6", permission: "ai:read" },
        { label: t("nav.learning"), href: "/learning", icon: GraduationCap, accent: "#8b5cf6", permission: "ai:read" },
      ],
    },
    {
      label: "威胁分析",
      items: [
        { label: t("nav.hunting"), href: "/hunting", icon: Target, accent: "#8b5cf6", permission: "hunting:read" },
        { label: t("nav.workflows"), href: "/workflows", icon: Workflow, accent: "#8b5cf6", permission: "playbooks:read" },
      ],
    },
  ], [t])

  const settingsNavItems: NavItem[] = useMemo(() => [
    { label: t("nav.tabDataSource"), href: "/datasource", icon: Database, accent: "#71717a", permission: "settings:read" },
    { label: t("nav.assets"), href: "/assets", icon: Server, accent: "#71717a", permission: "devices:read" },
    { label: t("nav.users"), href: "/users", icon: Users, accent: "#71717a", permission: "users:read" },
    { label: "权限管理", href: "/system/rbac", icon: Shield, accent: "#71717a", permission: "rbac:read" },
    { label: "租户管理", href: "/system/tenants", icon: Building2, accent: "#71717a", permission: "tenants:read" },
    { label: "账单订阅", href: "/system/billing", icon: CreditCard, accent: "#71717a", permission: "billing:read" },
    { label: "合规管理", href: "/system/compliance", icon: ShieldCheck, accent: "#71717a", permission: "compliance:read" },
    { label: t("nav.integrations"), href: "/integrations", icon: Plug, accent: "#71717a", permission: "integrations:read" },
    { label: t("nav.reports"), href: "/reports", icon: FileText, accent: "#71717a", permission: "reports:read" },
    { label: t("nav.audit"), href: "/audit", icon: FileText, accent: "#71717a", permission: "settings:read" },
    { label: t("nav.system"), href: "/system", icon: Settings, accent: "#71717a", permission: "settings:read" },
  ], [t])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !mounted || !item.permission || hasPermission(item.permission))

  const renderNavItem = (item: NavItem, indent = false) => {
    const active = isActive(item.href)

    if (collapsed) {
      return (
        <div key={item.href} className="group/tooltip relative px-2">
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center rounded-lg py-2 text-[13px] font-medium transition-all duration-200",
              active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
            style={active ? {
              background: `linear-gradient(135deg, ${item.accent}15, ${item.accent}08)`,
              boxShadow: `inset 0 0 0 1px ${item.accent}25`,
            } : undefined}
          >
            <div
              className={cn("flex size-7 items-center justify-center rounded-md transition-all duration-200", active ? "" : "group-hover/item:bg-white/5")}
              style={active ? { backgroundColor: `${item.accent}18` } : undefined}
            >
              <item.icon className={cn("size-[15px] transition-all duration-200")} style={{ color: active ? item.accent : undefined }} />
            </div>
          </Link>
          <div className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/8 bg-[#18181b] px-3 py-1.5 text-xs text-zinc-300 shadow-xl opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 z-50">
            {item.label}
          </div>
        </div>
      )
    }

    return (
      <div key={item.href} className="px-2">
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg py-1.5 text-[13px] font-medium transition-all duration-200",
            indent ? "pl-11 pr-3" : "px-3",
            active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          )}
          style={active ? {
            background: `linear-gradient(135deg, ${item.accent}12, ${item.accent}06)`,
            boxShadow: `inset 0 0 0 1px ${item.accent}20`,
          } : undefined}
        >
          <div
            className={cn("flex size-6 shrink-0 items-center justify-center rounded-md transition-all duration-200")}
            style={active ? { backgroundColor: `${item.accent}18` } : undefined}
          >
            <item.icon className={cn("size-[13px] transition-all duration-200")} style={{ color: active ? item.accent : undefined }} />
          </div>
          <span className="truncate flex-1 text-[12px]">{item.label}</span>
          {active && (
            <div
              className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: item.accent,
                boxShadow: `0 0 6px ${item.accent}60`,
              }}
            />
          )}
        </Link>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-white/5 bg-[#0c0c10]/85 backdrop-blur-xl transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/15 blur-[2px]" />
          <Hexagon className="size-7 text-blue-400 relative" strokeWidth={1.5} />
          <Shield className="size-3.5 text-blue-300 absolute" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wider text-zinc-100">
              SecMind
            </span>
            <span className="text-[9px] font-medium tracking-[0.2em] text-blue-400/60 uppercase">
              AI Security
            </span>
          </div>
        )}
      </div>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {mainNavGroups.map((group) => {
          const filteredItems = filterItems(group.items)
          if (filteredItems.length === 0) return null
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {group.label}
                </div>
              )}
              {filteredItems.map((item) => renderNavItem(item))}
            </div>
          )
        })}

        {!collapsed && (
          <>
            <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all duration-200"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md">
                <Settings className="size-[13px]" />
              </div>
              <span className="truncate flex-1 text-left text-[12px]">系统设置</span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  settingsExpanded && "rotate-180"
                )}
              />
            </button>
            {settingsExpanded && filterItems(settingsNavItems).map((item) => renderNavItem(item, true))}
          </>
        )}

        {collapsed && (
          <div className="px-2 mt-1">
            <Link
              href="/system"
              className="flex items-center justify-center rounded-lg py-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-300 transition-all duration-200"
            >
              <Settings className="size-[15px]" />
            </Link>
          </div>
        )}
      </nav>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="p-3">
        <div className={cn("flex items-center", collapsed && "justify-center")}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            className="text-zinc-500 hover:text-blue-400 transition-colors"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}