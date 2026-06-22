"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileSearch, Inbox, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useLocaleStore } from "@/store/locale-store"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border">
        <Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-base font-medium text-muted-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "skeleton-card"
  lines?: number
  className?: string
  text?: string
}

export function LoadingState({
  variant = "spinner",
  lines = 3,
  className,
  text,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3 py-8 px-4", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-muted/50"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
    )
  }

  if (variant === "skeleton-card") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 animate-pulse"
          >
            <div className="h-3 w-20 rounded bg-muted/50" />
            <div className="mt-3 h-5 w-16 rounded bg-muted/50" />
            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-full rounded bg-muted/30" />
              <div className="h-2.5 w-3/4 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/30" />
      </div>
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const { t } = useLocaleStore()
  const resolvedTitle = title ?? t("error.generic")
  const resolvedDescription = description ?? t("error.networkError")
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff2d55]/[0.06] ring-1 ring-[#ff2d55]/[0.12]">
        <AlertTriangle className="h-7 w-7 text-[#ff2d55]" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-base font-medium text-muted-foreground">{resolvedTitle}</h3>
      {resolvedDescription && (
        <p className="mt-1.5 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          {resolvedDescription}
        </p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={onRetry}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  )
}

export function TableEmptyState({
  colSpan,
  message,
}: {
  colSpan: number
  message?: string
}) {
  const { t } = useLocaleStore()
  const resolvedMessage = message ?? t("common.noData")
  return (
    <tr>
      <td colSpan={colSpan} className="py-16">
        <div className="flex flex-col items-center justify-center">
          <FileSearch className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted-foreground">{resolvedMessage}</p>
        </div>
      </td>
    </tr>
  )
}