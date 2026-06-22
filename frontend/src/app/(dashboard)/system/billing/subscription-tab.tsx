"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  Users,
  Bell,
  HardDrive,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useLocaleStore } from "@/store/locale-store"
import { api, formatDateTime } from "@/lib/api"
import { DynamicPaymentDialog } from "@/components/dynamic-imports"
import { CARD, TYPOGRAPHY, RADIUS } from "@/lib/design-system"
import { softCardClass } from "@/lib/admin-ui"

const TENANT_ID = 1

const PLAN_LABELS: Record<string, string> = {
  free: "billing.planFreeTrial",
  starter: "billing.planStarter",
  professional: "billing.planProfessional",
  enterprise: "billing.planEnterprise",
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 299,
  professional: 2999,
  enterprise: 9999,
}

const PLAN_LIMITS: Record<string, { users: number; alertsPerDay: number; storageGB: number }> = {
  free: { users: 5, alertsPerDay: 100, storageGB: 1 },
  starter: { users: 10, alertsPerDay: 1000, storageGB: 10 },
  professional: { users: 20, alertsPerDay: Infinity, storageGB: 100 },
  enterprise: { users: Infinity, alertsPerDay: Infinity, storageGB: Infinity },
}

interface TrialStatusData {
  is_trial: boolean
  trial_ends_at: string | null
  days_remaining: number
  is_expired: boolean
  plan: string
}

interface UsageData {
  users: number
  alerts_today: number
  storage_used_gb: number
}

function getAvailablePlans(currentPlan: string) {
  const planOrder = ["free", "starter", "professional", "enterprise"]
  const currentIndex = planOrder.indexOf(currentPlan)
  const upgrades = planOrder.slice(currentIndex + 1)
  const downgrades = planOrder.slice(0, currentIndex)
  return { upgrades, downgrades }
}

export function SubscriptionTab() {
  const { t } = useLocaleStore()

  const [trialStatus, setTrialStatus] = useState<TrialStatusData | null>(null)
  const [usage] = useState<UsageData>({ users: 3, alerts_today: 42, storage_used_gb: 0.8 })
  const [loading, setLoading] = useState(true)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("professional")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const loadTrialStatus = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/trial-status`)
      if (res.data) {
        setTrialStatus(res.data)
      } else {
        setTrialStatus({
          is_trial: true,
          trial_ends_at: new Date(Date.now() + 1296000000).toISOString(),
          days_remaining: 15,
          is_expired: false,
          plan: "professional",
        })
      }
    } catch {
      setTrialStatus({
        is_trial: true,
        trial_ends_at: new Date(Date.now() + 1296000000).toISOString(),
        days_remaining: 15,
        is_expired: false,
        plan: "professional",
      })
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(async () => {
      setLoading(true)
      await loadTrialStatus()
      setLoading(false)
    })
  }, [loadTrialStatus])

  async function handleCancelSubscription() {
    setCancelling(true)
    try {
      await api.post(`/billing/tenants/${TENANT_ID}/orders`, {
        plan: "free",
        payment_method: null,
      })
      await loadTrialStatus()
      setCancelDialogOpen(false)
    } catch {} finally {
      setCancelling(false)
    }
  }

  function openUpgradeDialog(plan: string) {
    setSelectedPlan(plan)
    setPaymentDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        {t("billing.loading")}
      </div>
    )
  }

  const currentPlan = trialStatus?.plan ?? "free"
  const currentLimits = PLAN_LIMITS[currentPlan] ?? PLAN_LIMITS.free
  const { upgrades, downgrades } = getAvailablePlans(currentPlan)

  const trialProgress = trialStatus
    ? Math.max(0, Math.min(100, ((30 - trialStatus.days_remaining) / 30) * 100))
    : 0

  const userPercent = currentLimits.users === Infinity ? 0 : Math.min(100, (usage.users / currentLimits.users) * 100)
  const alertPercent = currentLimits.alertsPerDay === Infinity ? 0 : Math.min(100, (usage.alerts_today / currentLimits.alertsPerDay) * 100)
  const storagePercent = currentLimits.storageGB === Infinity ? 0 : Math.min(100, (usage.storage_used_gb / currentLimits.storageGB) * 100)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={CARD.elevated}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-500/15 ring-1 ring-cyan-500/20`}>
                <Crown className="size-5 text-primary" />
              </div>
              <div>
                <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.currentPlan")}</h2>
                <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>
                  {t(PLAN_LABELS[currentPlan] ?? currentPlan)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`${softCardClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.planName")}</span>
                  <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/15 text-primary">
                    {t(PLAN_LABELS[currentPlan] ?? currentPlan)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.monthlyFee")}</span>
                  <span className={cn(TYPOGRAPHY.h3, "font-bold font-mono text-foreground")}>
                    {PLAN_PRICES[currentPlan] === 0 ? t("billing.free") : `¥${PLAN_PRICES[currentPlan].toLocaleString()}${t("billing.planPerMonth")}`}
                  </span>
                </div>
                {trialStatus?.is_trial && (
                  <>
                    <div className="h-px bg-muted/60" />
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.trialExpiry")}</span>
                      <span className={cn(TYPOGRAPHY.body, "text-foreground")}>
                        {trialStatus.trial_ends_at ? formatDateTime(trialStatus.trial_ends_at) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.remainingDays")}</span>
                      <span className={cn(TYPOGRAPHY.h3, "font-bold", trialStatus.is_expired ? "text-red-600" : trialStatus.days_remaining <= 7 ? "text-amber-600" : "text-foreground")}>
                        {trialStatus.is_expired ? t("billing.expired") : `${trialStatus.days_remaining}${t("billing.days")}`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          trialStatus.is_expired ? "bg-red-500" : trialStatus.days_remaining <= 7 ? "bg-amber-500" : "bg-cyan-500"
                        )}
                        style={{ width: `${trialProgress}%` }}
                      />
                    </div>
                    {trialStatus.is_expired && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="size-3.5 text-red-600 shrink-0" />
                        <span className={cn(TYPOGRAPHY.micro, "text-red-600")}>{t("billing.trialExpiredUpgrade")}</span>
                      </div>
                    )}
                    {!trialStatus.is_expired && trialStatus.days_remaining <= 7 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                        <span className={cn(TYPOGRAPHY.micro, "text-amber-600")}>{t("billing.trialAlmostExpiredUpgrade")}</span>
                      </div>
                    )}
                  </>
                )}
                {!trialStatus?.is_trial && currentPlan !== "free" && (
                  <>
                    <div className="h-px bg-muted/60" />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-500/10 text-emerald-300">
                        <CheckCircle2 className="mr-1 size-3" />
                        {t("billing.activeSubscription")}
                      </Badge>
                      <p className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>
                        {t("billing.activeSubscriptionDesc")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={CARD.elevated}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-emerald-500/10 ring-1 ring-emerald-500/20`}>
                <HardDrive className="size-5 text-emerald-300" />
              </div>
              <div>
                <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.usageStatistics")}</h2>
                <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.currentPeriodUsage")}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.userCount")}</span>
                  </div>
                  <span className={cn(TYPOGRAPHY.caption, "text-foreground font-medium")}>
                    {usage.users} / {currentLimits.users === Infinity ? t("billing.unlimited") : currentLimits.users}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", userPercent > 80 ? "bg-amber-500" : "bg-cyan-500")}
                    style={{ width: `${userPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="size-3.5 text-muted-foreground" />
                    <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.todayAlerts")}</span>
                  </div>
                  <span className={cn(TYPOGRAPHY.caption, "text-foreground font-medium")}>
                    {usage.alerts_today} / {currentLimits.alertsPerDay === Infinity ? t("billing.unlimited") : `${currentLimits.alertsPerDay.toLocaleString()}${t("billing.perDay")}`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", alertPercent > 80 ? "bg-amber-500" : "bg-cyan-500")}
                    style={{ width: `${alertPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-3.5 text-muted-foreground" />
                    <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.storageUsage")}</span>
                  </div>
                  <span className={cn(TYPOGRAPHY.caption, "text-foreground font-medium")}>
                    {usage.storage_used_gb}GB / {currentLimits.storageGB === Infinity ? t("billing.unlimited") : `${currentLimits.storageGB}GB`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", storagePercent > 80 ? "bg-amber-500" : "bg-cyan-500")}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={CARD.elevated}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-amber-500/10 ring-1 ring-amber-500/20`}>
              <ArrowUpCircle className="size-5 text-amber-300" />
            </div>
            <div>
              <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.changePlan")}</h2>
              <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.changePlanDesc")}</p>
            </div>
          </div>

          {upgrades.length > 0 && (
            <div className="space-y-3 mb-5">
              <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground font-medium")}>{t("billing.upgradeOptions")}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {upgrades.map((planId) => {
                  const price = PLAN_PRICES[planId]
                  return (
                    <div
                      key={planId}
                      className={`${softCardClass} p-4 flex items-center justify-between`}
                    >
                      <div>
                        <p className={cn(TYPOGRAPHY.h3, "text-foreground")}>{t(PLAN_LABELS[planId] ?? planId)}</p>
                        <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>
                          ¥{price.toLocaleString()}{t("billing.planPerMonth")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openUpgradeDialog(planId)}
                        className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ArrowUpCircle className="size-3.5" />
                        {t("billing.upgrade")}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {downgrades.length > 0 && (
            <div className="space-y-3">
              <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground font-medium")}>{t("billing.downgradeOptions")}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {downgrades.map((planId) => {
                  const price = PLAN_PRICES[planId]
                  return (
                    <div
                      key={planId}
                      className={`${softCardClass} p-4 flex items-center justify-between`}
                    >
                      <div>
                        <p className={cn(TYPOGRAPHY.h3, "text-foreground")}>{t(PLAN_LABELS[planId] ?? planId)}</p>
                        <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>
                          {price === 0 ? t("billing.free") : `¥${price.toLocaleString()}${t("billing.planPerMonth")}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpgradeDialog(planId)}
                        className="gap-1 border-border text-muted-foreground hover:bg-muted/50"
                      >
                        <ArrowDownCircle className="size-3.5" />
                        {t("billing.downgrade")}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {currentPlan !== "free" && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <XCircle className="size-5 text-muted-foreground" />
            <div>
              <p className={cn(TYPOGRAPHY.h3, "text-foreground")}>{t("billing.cancelSubscription")}</p>
              <p className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>{t("billing.cancelSubscriptionDesc")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancelDialogOpen(true)}
            className="text-red-600 hover:text-red-300 hover:bg-red-500/10"
          >
{t("billing.cancelSubscription")}
          </Button>
        </div>
      )}

      <DynamicPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        plan={selectedPlan}
        onSuccess={loadTrialStatus}
      />

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("billing.confirmCancelSubscription")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("billing.confirmCancelSubscriptionDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className={`${softCardClass} p-4 space-y-3 mt-2`}>
            <div className="flex items-center justify-between">
              <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.currentPlan")}</span>
              <span className={cn(TYPOGRAPHY.body, "font-medium text-foreground")}>{t(PLAN_LABELS[currentPlan] ?? currentPlan)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.downgradeTo")}</span>
              <span className={cn(TYPOGRAPHY.body, "font-medium text-foreground")}>{t("billing.planFree")}</span>
            </div>
            <div className="h-px bg-muted/60" />
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
              <span className={cn(TYPOGRAPHY.micro, "text-amber-600")}>
                {t("billing.downgradeLimits")}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("billing.keepSubscription")}
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 text-foreground hover:bg-red-700 gap-1.5"
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("billing.processing")}
                </>
              ) : (
                <>
                  <XCircle className="size-4" />
                  {t("billing.confirmCancel")}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={className} {...props} />
}
