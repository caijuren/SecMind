"use client"

import { cn } from "@/lib/utils"
import { CARD, RADIUS, TYPOGRAPHY } from "@/lib/design-system"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

/** 简单的Toggle开关 */
export function SimpleToggle({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-muted/60"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-card shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

/** 设置行组件 */
export function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-border/50 last:border-b-0">
      <div className="flex-1 pr-6">
        <Label className={String(TYPOGRAPHY.h3) + " text-foreground cursor-pointer"}>{label}</Label>
        {description && (
          <p className={String(TYPOGRAPHY.caption) + " text-muted-foreground mt-1"}>{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** 设置区块组件 */
export function SettingSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className={CARD.elevated}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-primary/10`}>
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <h2 className={String(TYPOGRAPHY.h2)}>{title}</h2>
            {description && (
              <p className={String(TYPOGRAPHY.caption) + " text-muted-foreground mt-0.5"}>{description}</p>
            )}
          </div>
        </div>
        <div className="divide-y divide-muted/50">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
