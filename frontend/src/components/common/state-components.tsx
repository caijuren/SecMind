"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileSearch, Inbox, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"

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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
        <Icon className="h-7 w-7 text-zinc-500" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-base font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-center text-sm leading-relaxed text-zinc-500">
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
            className="h-4 animate-pulse rounded bg-white/[0.04]"
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
            className="rounded-xl border border-white/[0.06] bg-[#131316] p-5 animate-pulse"
          >
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
            <div className="mt-3 h-5 w-16 rounded bg-white/[0.06]" />
            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-full rounded bg-white/[0.03]" />
              <div className="h-2.5 w-3/4 rounded bg-white/[0.03]" />
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
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-400 border-r-blue-400/30" />
      </div>
      {text && (
        <p className="mt-4 text-sm text-zinc-500">{text}</p>
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
  title = "加载失败",
  description = "请检查网络连接后重试",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/[0.06] ring-1 ring-red-500/[0.12]">
        <AlertTriangle className="h-7 w-7 text-red-400" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-base font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-center text-sm leading-relaxed text-zinc-500">
          {description}
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
          重试
        </Button>
      )}
    </div>
  )
}

export function TableEmptyState({
  colSpan,
  message = "暂无数据",
}: {
  colSpan: number
  message?: string
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16">
        <div className="flex flex-col items-center justify-center">
          <FileSearch className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-zinc-500">{message}</p>
        </div>
      </td>
    </tr>
  )
}