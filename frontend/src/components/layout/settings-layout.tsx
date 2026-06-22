"use client"

import { usePathname, useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SettingsMenuItem {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  description?: string
}

export interface SettingsMenuGroup {
  label: string
  items: SettingsMenuItem[]
}

interface SettingsLayoutProps {
  groups: SettingsMenuGroup[]
  activeId: string
  onNavigate?: (id: string) => void
  children: React.ReactNode
}

export function SettingsLayout({ groups, activeId, onNavigate, children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  function handleItemClick(item: SettingsMenuItem) {
    if (item.href && item.href !== pathname) {
      router.push(item.href)
    } else if (onNavigate) {
      onNavigate(item.id)
    }
  }

  return (
    <div className="flex gap-5">
      {/* 左侧菜单 */}
      <nav className="w-48 shrink-0">
        {groups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-5")}>
            <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-px">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-primary/8 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 分隔线 */}
      <div className="w-px shrink-0 bg-border/60" />

      {/* 右侧内容区 */}
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  )
}
