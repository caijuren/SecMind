"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import {
  Radio,
  GraduationCap,
  BookOpen,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Brain,
  FolderKanban,
  Server,
  FileBarChart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"
import { useAuthStore } from "@/store/auth-store"

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
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => setMounted(true))
      return
    }

    Promise.resolve().then(() => setMounted(true))
  }, [])

  const mainNavGroups: NavGroup[] = useMemo(() => [
    {
      label: t("nav.groupMonitor"),
      items: [
        { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard, accent: "#3b82f6", permission: "dashboard_overview:read" },
      ],
    },
    {
      label: t("nav.groupAlert"),
      items: [
        { label: t("nav.signals"), href: "/signals", icon: Radio, accent: "#ef4444", permission: "alerts:read" },
        { label: t("nav.workbench"), href: "/workbench", icon: Brain, accent: "#06b6d4", permission: "alerts:read" },
        { label: t("nav.cases"), href: "/cases", icon: FolderKanban, accent: "#22c55e", permission: "alerts:read" },
      ],
    },
    {
      label: t("nav.groupAi"),
      items: [
        { label: t("nav.aiChat"), href: "/ai-chat", icon: Brain, accent: "#8b5cf6", permission: "ai:read" },
        { label: t("nav.tabAiKnowledge"), href: "/knowledge", icon: BookOpen, accent: "#8b5cf6", permission: "ai:read" },
        { label: t("nav.learning"), href: "/learning", icon: GraduationCap, accent: "#8b5cf6", permission: "ai:read" },
      ],
    },
    {
      label: t("nav.groupResources"),
      items: [
        { label: t("nav.assets"), href: "/assets", icon: Server, accent: "#06b6d4", permission: "assets:read" },
        { label: t("nav.reports"), href: "/reports", icon: FileBarChart, accent: "#8b5cf6", permission: "reports:read" },
      ],
    },
    {
      label: t("nav.groupSystem"),
      items: [
        { label: t("nav.settings"), href: "/settings", icon: Settings, accent: "#71717a", permission: "settings:read" },
      ],
    },
  ], [t])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (!mounted) return true
      if (user?.role === "admin" || user?.isDemo) return true
      return !item.permission || hasPermission(item.permission)
    })

  const renderNavItem = (item: NavItem, indent = false) => {
    const active = isActive(item.href)

    if (collapsed) {
      return (
        <div key={item.href} className="group/tooltip relative px-2">
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center rounded-lg py-2 text-[13px] font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary ring-1 ring-primary/15"
                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            )}
          >
            <div className={cn("flex size-7 items-center justify-center rounded-md transition-all duration-200", active ? "" : "group-hover/item:bg-sidebar-accent")}>
              <item.icon className={cn("size-4 transition-all duration-200")} />
            </div>
          </Link>
          <div className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 z-50">
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
            active
              ? "bg-primary/10 text-primary ring-1 ring-primary/15"
              : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
          )}
        >
          <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-md transition-all duration-200")}>
            <item.icon className={cn("size-4 transition-all duration-200")} />
          </div>
          <span className="truncate flex-1 text-[13px]">{item.label}</span>
          {active && (
            <div className="ml-auto h-4 w-0.5 rounded-full shrink-0 bg-primary" />
          )}
        </Link>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Subtle texture gives the rail depth without competing with content. */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <Link
        href="/dashboard"
        aria-label="返回运营概览"
        className="relative flex h-16 items-center gap-2.5 px-4 transition-colors hover:bg-sidebar-accent/60"
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            className="relative size-9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-stroke" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--primary)" />
                <stop offset="1" stopColor="var(--primary)" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path
              d="M16 2.5 L27 8 V18 C27 24 22 28.5 16 30 C10 28.5 5 24 5 18 V8 Z"
              stroke="url(#logo-stroke)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="16" cy="15" r="2.5" fill="var(--primary)" />
            <circle cx="10" cy="11" r="1.3" fill="var(--primary)" fillOpacity="0.55" />
            <circle cx="22" cy="11" r="1.3" fill="var(--primary)" fillOpacity="0.55" />
            <circle cx="10" cy="20" r="1.3" fill="var(--primary)" fillOpacity="0.55" />
            <circle cx="22" cy="20" r="1.3" fill="var(--primary)" fillOpacity="0.55" />
            <path
              d="M16 15 L10 11 M16 15 L22 11 M16 15 L10 20 M16 15 L22 20"
              stroke="var(--primary)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground font-[family-name:var(--font-space-grotesk)]">
              Sec<span className="text-primary">Mind</span>
            </span>
          </div>
        )}
      </Link>

      <div className="relative mx-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {mainNavGroups.map((group) => {
          const filteredItems = filterItems(group.items)
          if (filteredItems.length === 0) return null
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
              )}
              {filteredItems.map((item) => renderNavItem(item))}
            </div>
          )
        })}
      </nav>

      <div className="relative mx-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

      <div className="relative p-3">
        <div className={cn("flex items-center", collapsed && "justify-center")}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            className="inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-primary"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
