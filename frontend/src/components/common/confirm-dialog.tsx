"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, ShieldOff } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/store/locale-store"

type DangerLevel = "warning" | "danger" | "critical"

const dangerConfig: Record<
  DangerLevel,
  {
    icon: LucideIcon
    iconBg: string
    iconColor: string
    buttonVariant: "outline" | "destructive"
  }
> = {
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/[0.08] ring-amber-500/[0.15]",
    iconColor: "text-amber-600",
    buttonVariant: "outline",
  },
  danger: {
    icon: Trash2,
    iconBg: "bg-red-500/[0.08] ring-red-500/[0.15]",
    iconColor: "text-red-600",
    buttonVariant: "destructive",
  },
  critical: {
    icon: ShieldOff,
    iconBg: "bg-red-600/[0.10] ring-red-500/[0.20]",
    iconColor: "text-red-600",
    buttonVariant: "destructive",
  },
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  level?: DangerLevel
  onConfirm: () => void
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  level = "danger",
  onConfirm,
  loading = false,
  children,
}: ConfirmDialogProps) {
  const { t } = useLocaleStore()
  const resolvedConfirmLabel = confirmLabel ?? t("common.confirm")
  const resolvedCancelLabel = cancelLabel ?? t("common.cancel")
  const config = dangerConfig[level]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                config.iconBg
              )}
            >
              <config.icon className={cn("h-5 w-5", config.iconColor)} strokeWidth={1.5} />
            </div>
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-base text-foreground">{title}</DialogTitle>
              <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("common.loading") : resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}