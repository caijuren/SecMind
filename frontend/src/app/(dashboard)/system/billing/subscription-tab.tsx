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
  free: "免费试用",
  starter: "入门版",
  professional: "专业版",
  enterprise: "企业版",
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 299,
  professional: 2999,
  enterprise: 9999,
}

const PLAN_LIMITS: Record<string, { users: number; alerts: string; storage: string }> = {
  free: { users: 5, alerts: "100/天", storage: "1GB" },
  starter: { users: 10, alerts: "1,000/天", storage: "10GB" },
  professional: { users: 20, alerts: "无限", storage: "100GB" },
  enterprise: { users: Infinity, alerts: "无限", storage: "无限" },
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
  useLocaleStore()

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
      setTrialStatus(res.data)
    } catch {}
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
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        加载中...
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
  const alertPercent = currentLimits.alerts === "无限" ? 0 : Math.min(100, (usage.alerts_today / 100) * 100)
  const storagePercent = currentLimits.storage === "无限" ? 0 : Math.min(100, (usage.storage_used_gb / 1) * 100)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={CARD.elevated}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 ring-1 ring-cyan-200/50`}>
                <Crown className="size-5 text-cyan-700" />
              </div>
              <div>
                <h2 className={String(TYPOGRAPHY.h2)}>当前套餐</h2>
                <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
                  {PLAN_LABELS[currentPlan] ?? currentPlan}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`${softCardClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>套餐名称</span>
                  <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                    {PLAN_LABELS[currentPlan] ?? currentPlan}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>月费</span>
                  <span className={cn(TYPOGRAPHY.h3, "font-bold font-mono text-slate-900")}>
                    {PLAN_PRICES[currentPlan] === 0 ? "免费" : `¥${PLAN_PRICES[currentPlan].toLocaleString()}/月`}
                  </span>
                </div>
                {trialStatus?.is_trial && (
                  <>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>试用到期</span>
                      <span className={cn(TYPOGRAPHY.body, "text-slate-900")}>
                        {trialStatus.trial_ends_at ? formatDateTime(trialStatus.trial_ends_at) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>剩余天数</span>
                      <span className={cn(TYPOGRAPHY.h3, "font-bold", trialStatus.is_expired ? "text-red-600" : trialStatus.days_remaining <= 7 ? "text-amber-600" : "text-slate-900")}>
                        {trialStatus.is_expired ? "已过期" : `${trialStatus.days_remaining} 天`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          trialStatus.is_expired ? "bg-red-500" : trialStatus.days_remaining <= 7 ? "bg-amber-500" : "bg-cyan-500"
                        )}
                        style={{ width: `${trialProgress}%` }}
                      />
                    </div>
                    {trialStatus.is_expired && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200/60">
                        <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                        <span className={cn(TYPOGRAPHY.micro, "text-red-600")}>试用已过期，请升级套餐以继续使用</span>
                      </div>
                    )}
                    {!trialStatus.is_expired && trialStatus.days_remaining <= 7 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200/60">
                        <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                        <span className={cn(TYPOGRAPHY.micro, "text-amber-600")}>试用即将到期，建议尽快升级</span>
                      </div>
                    )}
                  </>
                )}
                {!trialStatus?.is_trial && currentPlan !== "free" && (
                  <>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="mr-1 size-3" />
                        正式订阅
                      </Badge>
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
              <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-emerald-50 ring-1 ring-emerald-200/50`}>
                <HardDrive className="size-5 text-emerald-700" />
              </div>
              <div>
                <h2 className={String(TYPOGRAPHY.h2)}>用量统计</h2>
                <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>当前周期的资源使用情况</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-slate-500" />
                    <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>用户数</span>
                  </div>
                  <span className={cn(TYPOGRAPHY.caption, "text-slate-900 font-medium")}>
                    {usage.users} / {currentLimits.users === Infinity ? "无限" : currentLimits.users}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", userPercent > 80 ? "bg-amber-500" : "bg-cyan-500")}
                    style={{ width: `${userPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="size-3.5 text-slate-500" />
                    <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>今日告警</span>
                  </div>
                  <span className={cn(TYPOGRAPHY.caption, "text-slate-900 font-medium")}>
                    {usage.alerts_today} / {currentLimits.alerts}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", alertPercent > 80 ? "bg-amber-500" : "bg-cyan-500")}
                    style={{ width: `${alertPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-3.5 text-slate-500" />
                    <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>存储用量</span>
                  </div>
                  <span className={cn(TYPOGRAPHY.caption, "text-slate-900 font-medium")}>
                    {usage.storage_used_gb}GB / {currentLimits.storage}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
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
            <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-amber-50 ring-1 ring-amber-200/50`}>
              <ArrowUpCircle className="size-5 text-amber-700" />
            </div>
            <div>
              <h2 className={String(TYPOGRAPHY.h2)}>变更套餐</h2>
              <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>升级获取更多功能，或降级至适合的方案</p>
            </div>
          </div>

          {upgrades.length > 0 && (
            <div className="space-y-3 mb-5">
              <Label className={cn(TYPOGRAPHY.caption, "text-slate-500 font-medium")}>升级选项</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {upgrades.map((planId) => {
                  const price = PLAN_PRICES[planId]
                  return (
                    <div
                      key={planId}
                      className={`${softCardClass} p-4 flex items-center justify-between`}
                    >
                      <div>
                        <p className={cn(TYPOGRAPHY.h3, "text-slate-900")}>{PLAN_LABELS[planId]}</p>
                        <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
                          ¥{price.toLocaleString()}/月
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openUpgradeDialog(planId)}
                        className="gap-1 bg-cyan-600 text-white hover:bg-cyan-700"
                      >
                        <ArrowUpCircle className="size-3.5" />
                        升级
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {downgrades.length > 0 && (
            <div className="space-y-3">
              <Label className={cn(TYPOGRAPHY.caption, "text-slate-500 font-medium")}>降级选项</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {downgrades.map((planId) => {
                  const price = PLAN_PRICES[planId]
                  return (
                    <div
                      key={planId}
                      className={`${softCardClass} p-4 flex items-center justify-between`}
                    >
                      <div>
                        <p className={cn(TYPOGRAPHY.h3, "text-slate-900")}>{PLAN_LABELS[planId]}</p>
                        <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
                          {price === 0 ? "免费" : `¥${price.toLocaleString()}/月`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpgradeDialog(planId)}
                        className="gap-1 border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <ArrowDownCircle className="size-3.5" />
                        降级
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
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <XCircle className="size-5 text-slate-500" />
            <div>
              <p className={cn(TYPOGRAPHY.h3, "text-slate-700")}>取消订阅</p>
              <p className={cn(TYPOGRAPHY.micro, "text-slate-500")}>取消后将降级为免费版，当前周期结束后生效</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancelDialogOpen(true)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            取消订阅
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
        <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center ${RADIUS.md} bg-red-50`}>
                <XCircle className="size-4 text-red-600" />
              </div>
              确认取消订阅
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              取消订阅后将降级为免费版，部分功能将无法使用
            </DialogDescription>
          </DialogHeader>

          <div className={`${softCardClass} p-4 space-y-3 mt-2`}>
            <div className="flex items-center justify-between">
              <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>当前套餐</span>
              <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-900")}>{PLAN_LABELS[currentPlan]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>降级至</span>
              <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-900")}>免费版</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200/60">
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
              <span className={cn(TYPOGRAPHY.micro, "text-amber-600")}>
                降级后：5个用户、100条告警/天、1GB存储
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              保留订阅
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 text-white hover:bg-red-700 gap-1.5"
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <XCircle className="size-4" />
                  确认取消
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
