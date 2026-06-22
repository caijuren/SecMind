'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, AlertTriangle, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocaleStore } from '@/store/locale-store'

function getTrialInfo(): { daysLeft: number; trialEnd: string } {
  if (typeof window === 'undefined') return { daysLeft: 14, trialEnd: '' }
  try {
    const trialStart = localStorage.getItem('secmind-trial-start')
    if (!trialStart) {
      const now = Date.now()
      localStorage.setItem('secmind-trial-start', String(now))
      return { daysLeft: 14, trialEnd: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString() }
    }
    const start = Number(trialStart)
    const trialDuration = 14 * 24 * 60 * 60 * 1000
    const trialEnd = start + trialDuration
    const remaining = trialEnd - Date.now()
    const daysLeft = Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
    return { daysLeft, trialEnd: new Date(trialEnd).toISOString() }
  } catch {
    return { daysLeft: 14, trialEnd: '' }
  }
}

function getMessage(daysLeft: number, t: (key: string) => string): {
  title: string
  subtitle: string
  variant: 'info' | 'warning' | 'urgent'
} {
  if (daysLeft <= 0) {
    return {
      title: t("billing.trialExpired"),
      subtitle: t("billing.trialExpiredSubtitle"),
      variant: 'urgent',
    }
  }
  if (daysLeft <= 1) {
    return {
      title: t("billing.trialAlmostUp") + " " + daysLeft + " " + t("billing.trialDaysLeft"),
      subtitle: t("billing.trialAlmostUpSubtitle"),
      variant: 'urgent',
    }
  }
  if (daysLeft <= 3) {
    return {
      title: t("billing.trialRemaining") + " " + daysLeft + " " + t("billing.trialDaysLeft"),
      subtitle: t("billing.trialEndingSubtitle"),
      variant: 'warning',
    }
  }
  if (daysLeft <= 7) {
    return {
      title: t("billing.trialRemaining") + " " + daysLeft + " " + t("billing.trialDaysLeft"),
      subtitle: t("billing.trialConsiderUpgradeSubtitle"),
      variant: 'info',
    }
  }
  return {
    title: daysLeft + " " + t("billing.trialDaysLeft"),
    subtitle: t("billing.trialProFeaturesSubtitle"),
    variant: 'info',
  }
}

const variantStyles = {
  info: {
    bg: 'bg-primary/10',
    border: 'border-cyan-500/30',
    text: 'text-primary',
    icon: 'text-cyan-600',
    button: 'bg-cyan-600 text-foreground hover:bg-cyan-700',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    icon: 'text-amber-600',
    button: 'bg-amber-600 text-foreground hover:bg-amber-700',
  },
  urgent: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: 'text-red-600',
    button: 'bg-red-600 text-foreground hover:bg-red-700',
  },
}

interface TrialBannerProps {
  className?: string
  onDismiss?: () => void
}

export function TrialBanner({ className, onDismiss }: TrialBannerProps) {
  const { t } = useLocaleStore()
  const [dismissed, setDismissed] = useState(false)
  const [daysLeft, setDaysLeft] = useState(14)

  useEffect(() => {
    const dismissedAt = localStorage.getItem('secmind-trial-banner-dismissed')
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()
      if (now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000) {
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(() => setDismissed(true))
        } else {
          Promise.resolve().then(() => setDismissed(true))
        }
      }
    }

    const nextDaysLeft = getTrialInfo().daysLeft
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => setDaysLeft(nextDaysLeft))
    } else {
      Promise.resolve().then(() => setDaysLeft(nextDaysLeft))
    }
  }, [])

  if (dismissed) return null

  const message = getMessage(daysLeft, t)
  const style = variantStyles[message.variant]

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('secmind-trial-banner-dismissed', new Date().toISOString())
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2.5 border-b',
        style.bg,
        style.border,
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {daysLeft <= 1 ? (
          <AlertTriangle className={cn('size-4 shrink-0 animate-pulse', style.icon)} />
        ) : (
          <Clock className={cn('size-4 shrink-0', style.icon)} />
        )}
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('text-sm font-semibold shrink-0', style.text)}>
            {message.title}
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">
            {message.subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/pricing"
          className={cn(
            'inline-flex h-7 items-center rounded-lg px-3 text-xs font-semibold transition-colors',
            style.button
          )}
        >
          {t("billing.upgradeNow")}
          <ArrowRight className="size-3 ml-1" />
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-muted-foreground transition-colors"
          aria-label={t("billing.dismiss")}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
