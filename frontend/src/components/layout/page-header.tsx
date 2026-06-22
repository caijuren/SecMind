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
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <>
              <span className="h-4 w-px bg-border shrink-0" />
              <span className="truncate text-sm text-muted-foreground">{subtitle}</span>
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
