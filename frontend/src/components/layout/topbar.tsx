"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search,
  Bell,
  Sparkles,
  ChevronRight,
  LogOut,
  User,
  Camera,
  Pencil,
  Lock,
  Globe,
  Check,
  Sun,
  Moon,
  Menu,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useLocaleStore } from "@/store/locale-store"
import type { Locale } from "@/i18n/types"
import { localeNames } from "@/i18n/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { AccountDialog } from "@/components/layout/account-dialog"

const pathKeyMap: Record<string, string> = {
  dashboard: "nav.dashboard",
  screen: "nav.screen",
  "situation-room": "nav.screen",
  signals: "topbar.breadcrumb.signals",
  investigate: "nav.investigate",
  cases: "topbar.breadcrumb.cases",
  response: "topbar.breadcrumb.response",
  learning: "topbar.breadcrumb.learning",
  notifications: "nav.notifications",
  audit: "nav.audit",
  reports: "nav.reports",
  users: "nav.users",
  assets: "nav.assets",
  workflows: "nav.workflows",
  hunting: "nav.hunting",
  metrics: "nav.metrics",
  integrations: "nav.integrations",
  knowledge: "nav.tabAiKnowledge",
  datasource: "nav.tabDataSource",
  system: "topbar.breadcrumb.system",
  settings: "nav.settings",
  providers: "settings.providerConfig",
  mcp: "settings.mcpManagement",
  skills: "settings.skillManagement",
  billing: "billing.title",
  compliance: "compliance.title",
  rbac: "rbac.title",
  tenants: "tenants.title",
  workbench: "nav.workbench",
  "ai-chat": "nav.aiChat",
  "ai-analysis": "nav.aiAnalysis",
  pipeline: "nav.pipeline",
  playbooks: "nav.workflows",
  editor: "nav.workflows",
}

function Breadcrumb() {
  const pathname = usePathname()
  const { t } = useLocaleStore()
  const segments = pathname.split("/").filter((s) => s && !s.startsWith("("))

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <span className="font-medium text-muted-foreground">SecMind</span>
      {segments.map((segment, index) => {
        const key = pathKeyMap[segment]
        const label = key ? t(key) : segment
        const isLast = index === segments.length - 1
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-muted-foreground/50" />
            <span
              className={cn(
                isLast
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

const locales: Locale[] = ["zh-CN", "en"]

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuthStore()
  const { locale, setLocale, t } = useLocaleStore()
  const router = useRouter()
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('secmind-theme')
      return saved !== 'dark'
    }
    return true
  })
  const [searchQuery, setSearchQuery] = useState("")
  const unreadCount = 0
  const [isRefreshing, setIsRefreshing] = useState(false)
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : "U"

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/signals?q=${encodeURIComponent(q)}`)
  }

  const roleKeyMap: Record<string, string> = {
    admin: "roles.admin",
    analyst: "roles.analyst",
    viewer: "roles.viewer",
    soc_manager: "roles.socManager",
  }

  const toggleTheme = () => {
    const html = document.documentElement
    const newMode = !isLightMode
    if (newMode) {
      // 切换到浅色模式：移除 .dark class
      html.classList.remove("dark")
    } else {
      // 切换到暗色模式：添加 .dark class
      html.classList.add("dark")
    }
    localStorage.setItem('secmind-theme', newMode ? 'light' : 'dark')
    setIsLightMode(newMode)
  }

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    router.refresh()
    window.setTimeout(() => setIsRefreshing(false), 800)
  }

  useEffect(() => {
    const saved = localStorage.getItem('secmind-theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMenuClick}
          className="md:hidden text-muted-foreground hover:text-foreground"
          aria-label={t("topbar.openMenu")}
        >
          <Menu className="size-[18px]" />
        </Button>
        <Breadcrumb />
      </div>

      <div className="flex flex-1 min-w-0 max-w-80 items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full group">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            name="q"
            autoComplete="off"
            value={searchQuery}
            placeholder={t("globalSearch.placeholder")}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-lg border-border bg-card pl-9 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-primary/15"
          />
        </form>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label={t("topbar.refreshPage")}
        >
          <RefreshCw className={cn("size-[18px]", isRefreshing && "animate-spin")} />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label={isLightMode ? t("topbar.switchToDark") : t("topbar.switchToLight")}
        >
          {isLightMode ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-colors cursor-pointer"
            aria-label={t("topbar.switchLanguage")}
            render={
              <button type="button">
                <Globe className="size-[18px]" />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-40 border-border bg-popover text-popover-foreground shadow-lg"
          >
            {locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                className="cursor-pointer justify-between focus:bg-accent focus:text-accent-foreground"
                onClick={() => setLocale(loc)}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/notifications"
          aria-label={t("topbar.notifications").replace("{count}", String(unreadCount))}
          className="relative inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground" aria-hidden="true">
              {unreadCount}
            </Badge>
          )}
        </Link>

        <Link
          href="/ai-chat"
          aria-label={t("topbar.aiAssistant")}
          className="inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Sparkles className="size-[18px]" aria-hidden="true" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
            aria-label={t("topbar.userMenu")}
            render={
              <button type="button" className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden bg-primary/10 text-primary text-xs font-medium">
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={t("common.userAvatar")} width={32} height={32} className="h-full w-full object-cover" unoptimized />
                ) : (
                  initials
                )}
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-52 border-border bg-popover text-popover-foreground shadow-lg"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {user?.name ?? t("topbar.defaultUserName")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user ? roleKeyMap[user.role] ? t(roleKeyMap[user.role]) : user.role : ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground"
                onClick={() => setAccountDialogOpen(true)}
              >
                <User className="size-4" />
                {t("topbar.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Camera className="size-4" />
                {t("topbar.changeAvatar")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Pencil className="size-4" />
                {t("topbar.changeNickname")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-accent focus:text-accent-foreground"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Lock className="size-4" />
                {t("topbar.changePassword")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => { logout(); router.push('/login') }}
            >
              <LogOut className="size-4" />
              {t("topbar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AccountDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} />
    </header>
  )
}
