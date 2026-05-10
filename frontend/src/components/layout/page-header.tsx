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
    <div className="flex min-h-10 items-center justify-between gap-4 rounded-lg border border-slate-200/80 bg-white/75 px-3 py-2 shadow-sm shadow-slate-200/50 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
          <Icon className="h-4 w-4" />
        </span>
        <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <div className="hidden items-center gap-1.5 truncate text-xs text-slate-500 md:flex">
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
