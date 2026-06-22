"use client"

import { useState } from "react"
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  Shield,
  Wallet,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocaleStore } from "@/store/locale-store"
import { api } from "@/lib/api"
import { TYPOGRAPHY, RADIUS } from "@/lib/design-system"
import { inputClass, softCardClass } from "@/lib/admin-ui"

const TENANT_ID = 1

const PLAN_LABELS: Record<string, string> = {
  free: "payment.planFree",
  starter: "payment.planStarter",
  professional: "payment.planProfessional",
  enterprise: "payment.planEnterprise",
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 299,
  professional: 2999,
  enterprise: 9999,
}

const PAYMENT_METHODS = [
  { id: "alipay", nameKey: "payment.methodAlipay", icon: Wallet, descriptionKey: "payment.methodAlipayDesc" },
  { id: "wechat", nameKey: "payment.methodWechat", icon: CreditCard, descriptionKey: "payment.methodWechatDesc" },
  { id: "bank_transfer", nameKey: "payment.methodBankTransfer", icon: Building2, descriptionKey: "payment.methodBankTransferDesc" },
]

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: string
  onSuccess?: () => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: PaymentDialogProps) {
  const { t } = useLocaleStore()

  const [paymentMethod, setPaymentMethod] = useState("alipay")
  const [step, setStep] = useState<"confirm" | "paying" | "success">("confirm")
  const [couponCode, setCouponCode] = useState("")

  const planName = t(PLAN_LABELS[plan]) ?? plan
  const planPrice = PLAN_PRICES[plan] ?? 0

  async function handlePay() {
    setStep("paying")
    try {
      await api.post(`/billing/tenants/${TENANT_ID}/orders`, {
        plan,
        payment_method: paymentMethod,
      })
      setStep("success")
      onSuccess?.()
    } catch {
      setStep("confirm")
    }
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep("confirm")
      setCouponCode("")
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        {step === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="size-7 text-emerald-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className={cn(TYPOGRAPHY.h2, "text-foreground")}>{t("payment.orderCreated")}</h3>
              <p className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>
                {t("payment.orderCreatedDesc").replace("{plan}", planName)}
              </p>
            </div>
            <Button
              className="mt-2 bg-cyan-600 text-foreground hover:bg-cyan-700"
              onClick={handleClose}
            >
              {t("payment.done")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`flex size-8 items-center justify-center ${RADIUS.md} bg-primary/10`}>
                  <CreditCard className="size-4 text-cyan-600" />
                </div>
                {t("payment.confirmSubscription")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("payment.confirmDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              <div className={`${softCardClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("payment.subscriptionPlan")}</span>
                  <Badge variant="outline" className="border-cyan-500/30 bg-primary/10 text-cyan-600">
                    {planName}
                  </Badge>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("payment.monthlyFee")}</span>
                  <span className={cn(TYPOGRAPHY.h2, "font-bold font-mono text-cyan-600")}>
                    {planPrice === 0 ? t("payment.free") : `¥${planPrice.toLocaleString()}`}
                  </span>
                </div>
                {planPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("payment.billingCycle")}</span>
                    <span className={cn(TYPOGRAPHY.body, "text-foreground")}>{t("payment.monthlyBilling")}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("payment.paymentMethod")}</Label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const MethodIcon = method.icon
                    const isSelected = paymentMethod === method.id
                    return (
                      <div
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? "border border-cyan-400 bg-primary/10 ring-1 ring-cyan-500/30"
                            : "border border-border bg-card hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg",
                          isSelected ? "bg-cyan-500/15" : "bg-muted/50"
                        )}>
                          <MethodIcon className={cn("size-4", isSelected ? "text-cyan-600" : "text-muted-foreground")} />
                        </div>
                        <div className="flex-1">
                          <p className={cn(TYPOGRAPHY.h3, "text-foreground")}>{t(method.nameKey)}</p>
                          <p className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>{t(method.descriptionKey)}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="size-4 text-cyan-500 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("payment.couponCode")}</Label>
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t("payment.couponPlaceholder")}
                  className={inputClass}
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className={cn(TYPOGRAPHY.micro, "text-amber-300")}>
                  {t("payment.securityNotice")}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  {t("payment.cancel")}
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={step === "paying"}
                  className="bg-cyan-600 text-foreground hover:bg-cyan-700 gap-1.5"
                >
                  {step === "paying" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("payment.processing")}
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      {t("payment.confirmPay")} {planPrice > 0 ? `¥${planPrice.toLocaleString()}` : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
