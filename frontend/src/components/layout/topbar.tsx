"use client"

import { useState } from "react"
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
  "/signals": "搜索原始信号、异常活动、来源系统...",
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
      <span className="text-slate-400">SecMind</span>
      {segments.map((segment, index) => {
        const key = pathKeyMap[segment]
        const label = key ? t(key) : segment
        const isLast = index === segments.length - 1
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-slate-300" />
            <span
              className={cn(
                isLast
                  ? "text-slate-800"
                  : "text-slate-400"
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

export function Topbar() {
  const { user, logout } = useAuthStore()
  const { locale, setLocale, t } = useLocaleStore()
  const pathname = usePathname()
  const router = useRouter()
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 shadow-sm shadow-slate-200/40 backdrop-blur-xl">
      <Breadcrumb />

      <div className="flex flex-1 min-w-0 max-w-80 items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            autoComplete="off"
            placeholder={searchPlaceholder}
            className="h-9 border-slate-200 bg-slate-50 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center justify-center rounded-md h-8 w-8 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="切换语言"
            render={
              <button type="button">
                <Globe className="size-[18px]" />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-40 border-slate-200 bg-white text-slate-700 shadow-lg"
          >
            {locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                className="cursor-pointer justify-between focus:bg-slate-50 focus:text-cyan-600"
                onClick={() => setLocale(loc)}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && <Check className="size-4 text-cyan-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-slate-500 hover:text-cyan-600"
          onClick={() => router.push("/notifications")}
          aria-label="通知 (5条未读)"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          <Badge className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-cyan-500 p-0 text-[10px] font-bold text-white" aria-hidden="true">
            5
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-500 hover:text-cyan-600"
          aria-label="AI 助手"
        >
          <Sparkles className="size-[18px]" aria-hidden="true" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 cursor-pointer"
            aria-label="用户菜单"
            render={
              <button type="button" className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden bg-cyan-100 text-cyan-700 text-xs font-medium">
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
            className="w-52 border-slate-200 bg-white text-slate-700 shadow-lg"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-slate-500">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-900">
                    {user?.name ?? t("topbar.defaultUserName")}
                  </span>
                  <span className="text-xs text-slate-400">
                    {user ? roleKeyMap[user.role] ? t(roleKeyMap[user.role]) : user.role : ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-slate-50 focus:text-cyan-600"
                onClick={() => setAccountDialogOpen(true)}
              >
                <User className="size-4" />
                {t("topbar.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-slate-50 focus:text-cyan-600"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Camera className="size-4" />
                {t("topbar.changeAvatar")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-slate-50 focus:text-cyan-600"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Pencil className="size-4" />
                {t("topbar.changeNickname")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-slate-50 focus:text-cyan-600"
                onClick={() => setAccountDialogOpen(true)}
              >
                <Lock className="size-4" />
                {t("topbar.changePassword")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-500 focus:bg-red-50 focus:text-red-500"
              onClick={logout}
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
