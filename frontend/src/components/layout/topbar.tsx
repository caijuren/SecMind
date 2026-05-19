"use client"

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
import { GlobalSearch } from "@/components/common/global-search"

const pathKeyMap: Record<string, string> = {
  dashboard: "nav.dashboard",
  screen: "topbar.breadcrumb.dashboard",
  signals: "topbar.breadcrumb.signals",
  investigate: "nav.cases",
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
}

const searchPlaceholderMap: Record<string, string> = {
  "/dashboard": "搜索运营指标、统计数据...",
  "/signals": "搜索告警事件、异常活动、来源系统...",
  "/cases": "搜索AI研判、攻击链、证据与处置建议...",
  "/investigate": "搜索AI研判、攻击链、证据与处置建议...",
  "/response": "搜索响应处置、审批、回滚记录...",
  "/notifications": "搜索告警标题、来源、级别...",
  "/hunting": "搜索狩猎假设、IOC指标...",
  "/learning": "搜索学习记录、反馈...",
  "/knowledge": "搜索知识文章、标签...",
  "/workflows": "搜索剧本名称、描述...",
  "/metrics": "搜索运营指标、趋势...",
  "/datasource": "搜索数据源、设备...",
  "/assets": "搜索资产名称、IP地址...",
  "/users": "搜索用户、部门...",
  "/reports": "搜索报告、模板...",
  "/audit": "搜索审计日志、操作人...",
  "/integrations": "搜索集成、Webhook...",
  "/system": "搜索系统配置...",
}

function Breadcrumb() {
  const pathname = usePathname()
  const { t } = useLocaleStore()
  const segments = pathname.split("/").filter((s) => s && !s.startsWith("("))

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <span className="text-zinc-500">SecMind</span>
      {segments.map((segment, index) => {
        const key = pathKeyMap[segment]
        const label = key ? t(key) : segment
        const isLast = index === segments.length - 1
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-zinc-600" />
            <span
              className={cn(
                isLast
                  ? "text-zinc-200"
                  : "text-zinc-500"
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
  const pathname = usePathname()
  const router = useRouter()
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('secmind-theme') === 'light'
    }
    return false
  })
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : "U"

  const searchPlaceholder = searchPlaceholderMap[pathname] || "搜索..."

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
      html.classList.remove("dark")
      html.classList.add("light")
    } else {
      html.classList.add("dark")
      html.classList.remove("light")
    }
    localStorage.setItem('secmind-theme', newMode ? 'light' : 'dark')
    setIsLightMode(newMode)
  }

  useEffect(() => {
    const saved = localStorage.getItem('secmind-theme')
    if (saved === 'light' && !isLightMode) {
      setIsLightMode(true)
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0c0c10]/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMenuClick}
          className="md:hidden text-zinc-500 hover:text-zinc-300"
          aria-label="打开菜单"
        >
          <Menu className="size-[18px]" />
        </Button>
        <Breadcrumb />
      </div>

      <div className="flex flex-1 min-w-0 max-w-80 items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            name="q"
            autoComplete="off"
            placeholder={searchPlaceholder}
            readOnly
            onClick={() => setGlobalSearchOpen(true)}
            className="h-9 border-white/8 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label={isLightMode ? "切换到暗色模式" : "切换到浅色模式"}
        >
          {isLightMode ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center justify-center rounded-md h-8 w-8 text-zinc-500 hover:text-blue-400 hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="切换语言"
            render={
              <button type="button">
                <Globe className="size-[18px]" />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-40 border-white/8 bg-[#18181b] text-zinc-300 shadow-xl"
          >
            {locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                className="cursor-pointer justify-between focus:bg-white/5 focus:text-blue-400"
                onClick={() => setLocale(loc)}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && <Check className="size-4 text-blue-400" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-zinc-500 hover:text-blue-400"
          onClick={() => router.push("/notifications")}
          aria-label="通知 (5条未读)"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          <Badge className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-blue-500 p-0 text-[10px] font-bold text-white" aria-hidden="true">
            5
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-zinc-500 hover:text-violet-400"
          aria-label="AI 助手"
        >
          <Sparkles className="size-[18px]" aria-hidden="true" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
            aria-label="用户菜单"
            render={
              <button type="button" className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden bg-blue-500/20 text-blue-300 text-xs font-medium ring-1 ring-blue-500/30">
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user?.name ?? "用户头像"} width={32} height={32} className="h-full w-full object-cover" unoptimized />
                ) : (
                  initials
                )}
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-52 border-white/8 bg-[#18181b] text-zinc-300 shadow-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-400">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-zinc-100">
                    {user?.name ?? t("topbar.defaultUserName")}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {user ? roleKeyMap[user.role] ? t(roleKeyMap[user.role]) : user.role : ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/6" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/5 focus:text-blue-400"
                onClick={() => setAccountDialogOpen(true)}
              >
                <User className="size-4" />
                {t("topbar.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/5 focus:text-blue-400"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Camera className="size-4" />
                {t("topbar.changeAvatar")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/5 focus:text-blue-400"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Pencil className="size-4" />
                {t("topbar.changeNickname")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/5 focus:text-blue-400"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Lock className="size-4" />
                {t("topbar.changePassword")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/6" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
              onClick={() => { logout(); router.push('/login') }}
            >
              <LogOut className="size-4" />
              {t("topbar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AccountDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} />
      <GlobalSearch open={globalSearchOpen} onOpenChange={setGlobalSearchOpen} />
    </header>
  )
}