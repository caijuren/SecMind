"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo } from "react"
import {
  Shield,
  Radio,
  Crosshair,
  Inbox,
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
  Bell,
  FileText,
  Users,
  Server,
  Workflow,
  Target,
  TrendingUp,
  Plug,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useLocaleStore } from "@/store/locale-store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  accent: string
}

interface NavGroup {
  label: string
  icon: React.ElementType
  accent: string
  items: NavItem[]
  defaultOpen?: boolean
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLocaleStore()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    awareness: true,
    operations: false,
    ai_engine: false,
    management: false,
  })

  const navGroups: NavGroup[] = useMemo(() => [
    {
      label: "态势感知",
      icon: Monitor,
      accent: "#22d3ee",
      defaultOpen: true,
      items: [
        { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard, accent: "#22d3ee" },
        { label: t("nav.screen"), href: "/screen", icon: Monitor, accent: "#06b6d4" },
        { label: t("nav.notifications"), href: "/notifications", icon: Bell, accent: "#ef4444" },
        { label: t("nav.metrics"), href: "/metrics", icon: TrendingUp, accent: "#22c55e" },
      ],
    },
    {
      label: "安全运营",
      icon: Shield,
      accent: "#f97316",
      items: [
        { label: t("nav.signals"), href: "/signals", icon: Radio, accent: "#22d3ee" },
        { label: t("nav.investigate"), href: "/investigate", icon: Crosshair, accent: "#06b6d4" },
        { label: t("nav.cases"), href: "/cases", icon: Inbox, accent: "#f59e0b" },
        { label: t("nav.response"), href: "/response", icon: Zap, accent: "#f97316" },
        { label: t("nav.hunting"), href: "/hunting", icon: Target, accent: "#a855f7" },
      ],
    },
    {
      label: "AI引擎",
      icon: GraduationCap,
      accent: "#a78bfa",
      items: [
        { label: t("nav.learning"), href: "/learning", icon: GraduationCap, accent: "#a78bfa" },
        { label: t("nav.tabAiKnowledge"), href: "/knowledge", icon: BookOpen, accent: "#818cf8" },
        { label: t("nav.workflows"), href: "/workflows", icon: Workflow, accent: "#f59e0b" },
      ],
    },
    {
      label: "平台管理",
      icon: Settings,
      accent: "#64748b",
      items: [
        { label: t("nav.tabDataSource"), href: "/datasource", icon: Database, accent: "#34d399" },
        { label: t("nav.assets"), href: "/assets", icon: Server, accent: "#06b6d4" },
        { label: t("nav.users"), href: "/users", icon: Users, accent: "#3b82f6" },
        { label: t("nav.reports"), href: "/reports", icon: FileText, accent: "#8b5cf6" },
        { label: t("nav.audit"), href: "/audit", icon: FileText, accent: "#64748b" },
        { label: t("nav.integrations"), href: "/integrations", icon: Plug, accent: "#14b8a6" },
        { label: t("nav.system"), href: "/system", icon: Settings, accent: "#64748b" },
      ],
    },
  ], [t])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => isActive(item.href))

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }))
  }

  return (
    <TooltipProvider delay={200}>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-56"
        )}
        style={{
          borderColor: "rgba(34,211,238,0.08)",
          background: "linear-gradient(180deg, #020a1a 0%, #061024 50%, #020a1a 100%)",
        }}
      >
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="relative flex size-8 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/25 to-teal-500/15 blur-[2px]" />
            <Hexagon className="size-7 text-cyan-400 relative" strokeWidth={1.5} />
            <Shield className="size-3.5 text-cyan-300 absolute" strokeWidth={2} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-wider text-white" style={{ textShadow: "0 0 12px rgba(34,211,238,0.3)" }}>
                SecMind
              </span>
              <span className="text-[9px] font-medium tracking-[0.2em] text-cyan-400/40 uppercase">
                AI Security
              </span>
            </div>
          )}
        </div>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
          {navGroups.map((group, gi) => {
            const groupActive = isGroupActive(group)
            const isExpanded = expandedGroups[group.label] !== false
            const GroupIcon = group.icon

            if (collapsed) {
              return (
                <div key={gi} className="mb-1">
                  <div className="mx-3 my-2 h-px bg-white/[0.04]" />
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          "group/item flex items-center justify-center rounded-lg py-2 text-[13px] font-medium transition-all duration-200",
                          active ? "text-white" : "text-white/40 hover:text-white/70"
                        )}
                        style={active ? {
                          background: `linear-gradient(135deg, ${item.accent}18, ${item.accent}08)`,
                          boxShadow: `inset 0 0 0 1px ${item.accent}25, 0 0 12px ${item.accent}08`,
                        } : undefined}
                      >
                        <div
                          className={cn("flex size-7 items-center justify-center rounded-md transition-all duration-200", active ? "" : "group-hover/item:bg-white/[0.04]")}
                          style={active ? { backgroundColor: `${item.accent}20`, boxShadow: `0 0 8px ${item.accent}20` } : undefined}
                        >
                          <item.icon className={cn("size-[15px] transition-all duration-200", active ? "" : "group-hover/item:scale-110")} style={{ color: active ? item.accent : undefined }} />
                        </div>
                      </Link>
                    )
                    return (
                      <div key={item.href} className="px-2">
                        <Tooltip>
                          <TooltipTrigger className="w-full" render={linkContent} />
                          <TooltipContent side="right" className="border-white/10 bg-[#0a1628] text-white/80">
                            <div className="text-[10px] text-white/30 mb-0.5">{group.label}</div>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div key={gi} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "group/group flex w-full items-center gap-3 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200",
                    groupActive ? "text-white/70" : "text-white/30 hover:text-white/50"
                  )}
                >
                  <div className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md transition-all duration-200",
                    groupActive ? "" : "group-hover/group:bg-white/[0.04]"
                  )} style={groupActive ? { backgroundColor: `${group.accent}15` } : undefined}>
                    <GroupIcon className="size-[15px]" style={{ color: groupActive ? group.accent : undefined }} />
                  </div>
                  <span className="truncate flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 text-white/20 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
                {isExpanded && (
                  <ul className="flex flex-col gap-0.5 px-2">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "group/item flex items-center gap-3 rounded-lg pl-10 pr-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                              active ? "text-white" : "text-white/40 hover:text-white/70"
                            )}
                            style={active ? {
                              background: `linear-gradient(135deg, ${item.accent}18, ${item.accent}08)`,
                              boxShadow: `inset 0 0 0 1px ${item.accent}25, 0 0 12px ${item.accent}08`,
                            } : undefined}
                          >
                            <item.icon className={cn("size-[14px] shrink-0 transition-all duration-200", active ? "" : "group-hover/item:scale-110")} style={{ color: active ? item.accent : undefined }} />
                            <span className="truncate" style={active ? { textShadow: `0 0 8px ${item.accent}40` } : undefined}>{item.label}</span>
                            {active && <div className="ml-auto h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: item.accent, boxShadow: `0 0 6px ${item.accent}60` }} />}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />

        <div className="p-3">
          <div className={cn("flex items-center", collapsed && "justify-center")}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              className="text-white/15 hover:text-cyan-400/60 transition-colors"
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
    </TooltipProvider>
  )
}
