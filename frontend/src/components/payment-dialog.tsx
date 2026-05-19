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

const PAYMENT_METHODS = [
  { id: "alipay", name: "支付宝", icon: Wallet, description: "使用支付宝扫码支付" },
  { id: "wechat", name: "微信支付", icon: CreditCard, description: "使用微信扫码支付" },
  { id: "bank_transfer", name: "银行转账", icon: Building2, description: "对公银行转账" },
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
  useLocaleStore()

  const [paymentMethod, setPaymentMethod] = useState("alipay")
  const [step, setStep] = useState<"confirm" | "paying" | "success">("confirm")
  const [couponCode, setCouponCode] = useState("")

  const planName = PLAN_LABELS[plan] ?? plan
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
      <DialogContent className="border-white/8 bg-[#131316] text-zinc-100 sm:max-w-md">
        {step === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="size-7 text-emerald-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className={cn(TYPOGRAPHY.h2, "text-zinc-100")}>订单创建成功</h3>
              <p className={cn(TYPOGRAPHY.body, "text-zinc-500")}>
                您的 {planName} 订单已创建，请在订单列表中完成支付
              </p>
            </div>
            <Button
              className="mt-2 bg-cyan-600 text-white hover:bg-cyan-700"
              onClick={handleClose}
            >
              完成
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`flex size-8 items-center justify-center ${RADIUS.md} bg-cyan-500/10`}>
                  <CreditCard className="size-4 text-cyan-400" />
                </div>
                确认订阅
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                确认以下信息并选择支付方式
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              <div className={`${softCardClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-zinc-500")}>订阅套餐</span>
                  <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    {planName}
                  </Badge>
                </div>
                <div className="h-px bg-white/8" />
                <div className="flex items-center justify-between">
                  <span className={cn(TYPOGRAPHY.body, "text-zinc-500")}>月费</span>
                  <span className={cn(TYPOGRAPHY.h2, "font-bold font-mono text-cyan-400")}>
                    {planPrice === 0 ? "免费" : `¥${planPrice.toLocaleString()}`}
                  </span>
                </div>
                {planPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className={cn(TYPOGRAPHY.body, "text-zinc-500")}>计费周期</span>
                    <span className={cn(TYPOGRAPHY.body, "text-zinc-100")}>按月计费</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className={cn(TYPOGRAPHY.caption, "text-zinc-500")}>支付方式</Label>
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
                            ? "border border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                            : "border border-white/8 bg-[#18181b] hover:bg-white/[0.03]"
                        )}
                      >
                        <div className={cn(
                          "flex size-9 items-center justify-center rounded-lg",
                          isSelected ? "bg-cyan-500/15" : "bg-white/[0.04]"
                        )}>
                          <MethodIcon className={cn("size-4", isSelected ? "text-cyan-400" : "text-zinc-500")} />
                        </div>
                        <div className="flex-1">
                          <p className={cn(TYPOGRAPHY.h3, "text-zinc-100")}>{method.name}</p>
                          <p className={cn(TYPOGRAPHY.micro, "text-zinc-500")}>{method.description}</p>
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
                <Label className={cn(TYPOGRAPHY.caption, "text-zinc-500")}>优惠码（可选）</Label>
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="输入优惠码"
                  className={inputClass}
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className={cn(TYPOGRAPHY.micro, "text-amber-300")}>
                  支付安全由平台保障，所有交易数据加密传输。付费后可随时在订阅管理中取消。
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  取消
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={step === "paying"}
                  className="bg-cyan-600 text-white hover:bg-cyan-700 gap-1.5"
                >
                  {step === "paying" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      确认支付 {planPrice > 0 ? `¥${planPrice.toLocaleString()}` : ""}
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
