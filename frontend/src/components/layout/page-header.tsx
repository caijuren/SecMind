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
    <div className="flex h-12 items-center justify-between gap-4 rounded-lg border border-slate-200/80 bg-white/90 px-4 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-700 shadow-sm ring-1 ring-cyan-200/50">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && (
            <>
              <span className="h-4 w-px bg-slate-200 shrink-0" />
              <span className="truncate text-sm text-slate-500">{subtitle}</span>
            </>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
