'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, AlertTriangle, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

function getMessage(daysLeft: number): {
  title: string
  subtitle: string
  variant: 'info' | 'warning' | 'urgent'
} {
  if (daysLeft <= 0) {
    return {
      title: '试用已到期',
      subtitle: '您的免费试用已结束，请升级以继续使用 SecMind',
      variant: 'urgent',
    }
  }
  if (daysLeft <= 1) {
    return {
      title: `试用仅剩 ${daysLeft} 天`,
      subtitle: '您的试用即将到期，请尽快升级以保留所有数据',
      variant: 'urgent',
    }
  }
  if (daysLeft <= 3) {
    return {
      title: `试用剩余 ${daysLeft} 天`,
      subtitle: '试用期即将结束，升级专业版解锁全部功能',
      variant: 'warning',
    }
  }
  if (daysLeft <= 7) {
    return {
      title: `试用剩余 ${daysLeft} 天`,
      subtitle: '考虑升级专业版以获得更多功能和支持',
      variant: 'info',
    }
  }
  return {
    title: `${daysLeft} 天试用剩余`,
    subtitle: '专业版功能全量开放中',
    variant: 'info',
  }
}

const variantStyles = {
  info: {
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-500',
    button: 'bg-cyan-600 text-white hover:bg-cyan-700',
  },
  warning: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    button: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  urgent: {
    bg: 'bg-red-50/80',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
    button: 'bg-red-600 text-white hover:bg-red-700',
  },
}

interface TrialBannerProps {
  className?: string
  onDismiss?: () => void
}

export function TrialBanner({ className, onDismiss }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    const dismissedAt = localStorage.getItem('secmind-trial-banner-dismissed')
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const now = new Date()
      if (now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000) {
        return true
      }
    }
    return false
  })
  const [daysLeft] = useState(() => getTrialInfo().daysLeft)

  if (dismissed) return null

  const message = getMessage(daysLeft)
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
          <span className="hidden sm:inline text-xs text-slate-500 truncate">
            {message.subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link href="/pricing">
          <Button
            size="sm"
            className={cn('text-xs font-semibold rounded-lg h-7 px-3', style.button)}
          >
            立即升级
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </Link>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="关闭"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}