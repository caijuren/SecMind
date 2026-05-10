"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between h-9">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
        <h1 className="text-base font-semibold text-white truncate">{title}</h1>
        {subtitle && (
          <div className="flex items-center gap-1.5 text-xs text-white/30 truncate">
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
