"use client"

import { useEffect, useState, useCallback } from "react"
import {
  CreditCard,
  Receipt,
  Clock,
  ArrowUpCircle,
  Plus,
  FileText,
  XCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"
import { api, formatDateTime } from "@/lib/api"
import { inputClass, softCardClass } from "@/lib/admin-ui"
import {
  TYPOGRAPHY,
  CARD,
  RADIUS,
} from "@/lib/design-system"
import { SubscriptionTab } from "./subscription-tab"
import { FunnelTab } from "./funnel-tab"

const TENANT_ID = 1

const PLAN_LABELS: Record<string, string> = {
  free: "免费版",
  starter: "入门版",
  professional: "专业版",
  enterprise: "企业版",
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 299,
  professional: 999,
  enterprise: 2999,
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "待支付", className: "border-amber-200 bg-amber-50 text-amber-700" },
  paid: { label: "已支付", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  cancelled: { label: "已取消", className: "border-slate-200 bg-slate-50 text-slate-500" },
}

const INVOICE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  issued: { label: "已开具", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  pending: { label: "开具中", className: "border-amber-200 bg-amber-50 text-amber-700" },
}

interface TrialStatusData {
  is_trial: boolean
  trial_ends_at: string | null
  days_remaining: number
  is_expired: boolean
  plan: string
}

interface ConversionPreviewData {
  current_plan: string
  target_plan: string
  current_price: number
  target_price: number
  proration_days: number
  proration_amount: number
  total_amount: number
}

interface OrderItem {
  id: number
  tenant_id: number
  order_no: string
  plan: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  paid_at: string | null
  created_at: string | null
}

interface InvoiceItem {
  id: number
  tenant_id: number
  order_id: number
  invoice_no: string
  title: string
  amount: number
  tax_rate: number
  tax_amount: number | null
  total_amount: number | null
  status: string
  buyer_name: string | null
  buyer_tax_no: string | null
  issued_at: string | null
  created_at: string | null
}

function InvoiceRequestDialog({
  open,
  onOpenChange,
  orderId,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number | null
  onDone: () => Promise<void>
}) {
  const [form, setForm] = useState({ title: "", buyer_name: "", buyer_tax_no: "" })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!orderId) return
    setSaving(true)
    try {
      await api.post(`/billing/orders/${orderId}/invoice`, form)
      onOpenChange(false)
      setForm({ title: "", buyer_name: "", buyer_tax_no: "" })
      await onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>申请发票</DialogTitle>
          <DialogDescription className="text-slate-500">为已支付的订单申请开具发票，信息将用于增值税发票。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-title">发票抬头</Label>
            <Input
              id="invoice-title"
              name="title"
              autoComplete="organization"
              spellCheck={false}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="如：某某科技有限公司"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-buyer-name">购买方名称</Label>
            <Input
              id="invoice-buyer-name"
              name="buyer_name"
              autoComplete="organization"
              spellCheck={false}
              value={form.buyer_name}
              onChange={(e) => setForm((p) => ({ ...p, buyer_name: e.target.value }))}
              placeholder="企业全称"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-buyer-tax-no">纳税人识别号</Label>
            <Input
              id="invoice-buyer-tax-no"
              name="buyer_tax_no"
              autoComplete="off"
              spellCheck={false}
              value={form.buyer_tax_no}
              onChange={(e) => setForm((p) => ({ ...p, buyer_tax_no: e.target.value }))}
              placeholder="统一社会信用代码"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-cyan-600 text-white hover:bg-cyan-700">
              {saving ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function BillingPage() {
  useLocaleStore()

  const [trialStatus, setTrialStatus] = useState<TrialStatusData | null>(null)
  const [conversionPreview, setConversionPreview] = useState<ConversionPreviewData | null>(null)
  const [targetPlan, setTargetPlan] = useState("professional")
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)

  const [newOrderPlan, setNewOrderPlan] = useState("professional")
  const [newOrderPayment, setNewOrderPayment] = useState("alipay")
  const [creating, setCreating] = useState(false)

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceOrderId, setInvoiceOrderId] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<"subscription" | "orders" | "invoices" | "funnel">("subscription")

  const loadTrialStatus = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/trial-status`)
      setTrialStatus(res.data)
    } catch {}
  }, [])

  const loadConversionPreview = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/conversion-preview`, {
        params: { target_plan: targetPlan },
      })
      setConversionPreview(res.data)
    } catch {}
  }, [targetPlan])

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/orders`)
      setOrders(res.data)
    } catch {}
  }, [])

  const loadInvoices = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/invoices`)
      setInvoices(res.data)
    } catch {}
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadTrialStatus(), loadOrders(), loadInvoices()])
    setLoading(false)
  }, [loadTrialStatus, loadOrders, loadInvoices])

  useEffect(() => {
    Promise.resolve().then(() => { void loadAll() })
  }, [loadAll])

  useEffect(() => {
    Promise.resolve().then(() => { void loadConversionPreview() })
  }, [loadConversionPreview])

  async function handleCreateOrder() {
    setCreating(true)
    try {
      await api.post(`/billing/tenants/${TENANT_ID}/orders`, {
        plan: newOrderPlan,
        payment_method: newOrderPayment,
      })
      await loadOrders()
    } finally {
      setCreating(false)
    }
  }

  async function handlePayOrder(orderId: number) {
    setPayingOrderId(orderId)
    try {
      await api.post(`/billing/orders/${orderId}/pay`)
      await Promise.all([loadOrders(), loadTrialStatus()])
    } finally {
      setPayingOrderId(null)
    }
  }

  async function handleCancelOrder(orderId: number) {
    setCancellingOrderId(orderId)
    try {
      await api.post(`/billing/orders/${orderId}/cancel`)
      await loadOrders()
    } finally {
      setCancellingOrderId(null)
    }
  }

  function openInvoiceDialog(orderId: number) {
    setInvoiceOrderId(orderId)
    setInvoiceDialogOpen(true)
  }

  const trialProgress = trialStatus
    ? Math.max(0, Math.min(100, ((30 - trialStatus.days_remaining) / 30) * 100))
    : 0

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        icon={CreditCard}
        title="订阅与账单"
        subtitle="管理订阅计划、订单和发票"
      />

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "subscription"}
          onClick={() => setActiveTab("subscription")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "subscription" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          订阅管理
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          订单列表
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "invoices"}
          onClick={() => setActiveTab("invoices")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "invoices" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          发票列表
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "funnel"}
          onClick={() => setActiveTab("funnel")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "funnel" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          转化漏斗
        </button>
      </div>

      {activeTab === "subscription" && <SubscriptionTab />}

      {activeTab === "funnel" && <FunnelTab />}

      {activeTab !== "subscription" && activeTab !== "funnel" && loading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="mr-2 size-5 animate-spin" />
          加载中...
        </div>
      )}

      {activeTab !== "subscription" && activeTab !== "funnel" && !loading && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={CARD.elevated}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 ring-1 ring-cyan-200/50`}>
                    <Clock className="size-5 text-cyan-700" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>试用状态</h2>
                    <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>当前计划：{PLAN_LABELS[trialStatus?.plan ?? "free"] ?? trialStatus?.plan}</p>
                  </div>
                </div>

                {trialStatus?.is_trial && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.body, "text-slate-700")}>试用剩余天数</span>
                      <span className={cn(TYPOGRAPHY.h2, "font-bold font-mono", trialStatus.is_expired ? "text-red-600" : "text-slate-900")}>
                        {trialStatus.is_expired ? "已过期" : `${trialStatus.days_remaining} 天`}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-500",
                          trialStatus.is_expired ? "bg-red-500" : trialStatus.days_remaining <= 7 ? "bg-amber-500" : "bg-cyan-500"
                        )}
                        style={{ width: `${trialProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {trialStatus.is_expired ? (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600">
                          <AlertTriangle className="mr-1 size-3" />
                          试用已过期
                        </Badge>
                      ) : trialStatus.days_remaining <= 7 ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          <AlertTriangle className="mr-1 size-3" />
                          即将到期
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                          <CheckCircle2 className="mr-1 size-3" />
                          试用中
                        </Badge>
                      )}
                      {trialStatus.trial_ends_at && (
                        <span className={cn(TYPOGRAPHY.micro, "text-slate-500")}>
                          到期日：{formatDateTime(trialStatus.trial_ends_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!trialStatus?.is_trial && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="mr-1 size-3" />
                      正式订阅
                    </Badge>
                    <span className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
                      当前为正式订阅用户
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={CARD.elevated}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 ring-1 ring-cyan-200/50`}>
                    <ArrowUpCircle className="size-5 text-cyan-700" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>升级预览</h2>
                    <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>查看计划变更的费用明细</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className={cn(TYPOGRAPHY.caption, "text-slate-500")}>目标计划</Label>
                    <Select value={targetPlan} onValueChange={(v) => setTargetPlan(v ?? "professional")}>
                      <SelectTrigger className={`w-full ${inputClass}`}>
                        <SelectValue placeholder="选择目标计划" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">入门版 - ¥{PLAN_PRICES.starter}/月</SelectItem>
                        <SelectItem value="professional">专业版 - ¥{PLAN_PRICES.professional}/月</SelectItem>
                        <SelectItem value="enterprise">企业版 - ¥{PLAN_PRICES.enterprise}/月</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {conversionPreview && (
                    <div className={`${softCardClass} p-4 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>当前计划</span>
                        <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-900")}>{PLAN_LABELS[conversionPreview.current_plan]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>目标计划</span>
                        <span className={cn(TYPOGRAPHY.body, "font-medium text-slate-900")}>{PLAN_LABELS[conversionPreview.target_plan]}</span>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>当前价格</span>
                        <span className={cn(TYPOGRAPHY.body, "font-mono text-slate-900")}>¥{conversionPreview.current_price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>目标价格</span>
                        <span className={cn(TYPOGRAPHY.body, "font-mono text-slate-900")}>¥{conversionPreview.target_price}</span>
                      </div>
                      {conversionPreview.proration_days > 0 && (
                        <div className="flex items-center justify-between">
                          <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>按天折算（{conversionPreview.proration_days}天）</span>
                          <span className={cn(TYPOGRAPHY.body, "font-mono", conversionPreview.proration_amount >= 0 ? "text-amber-600" : "text-emerald-600")}>
                            {conversionPreview.proration_amount >= 0 ? "+" : ""}¥{conversionPreview.proration_amount}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-slate-200" />
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.h3, "font-semibold text-slate-900")}>应付总额</span>
                        <span className={cn(TYPOGRAPHY.h2, "font-bold font-mono text-cyan-700")}>¥{conversionPreview.total_amount}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-emerald-50 ring-1 ring-emerald-200/50`}>
                  <Plus className="size-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className={String(TYPOGRAPHY.h2)}>创建订单</h2>
                  <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>选择计划与支付方式，创建新订单</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className={cn(TYPOGRAPHY.caption, "text-slate-500")}>订阅计划</Label>
                  <Select value={newOrderPlan} onValueChange={(v) => setNewOrderPlan(v ?? "professional")}>
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">入门版 - ¥{PLAN_PRICES.starter}/月</SelectItem>
                      <SelectItem value="professional">专业版 - ¥{PLAN_PRICES.professional}/月</SelectItem>
                      <SelectItem value="enterprise">企业版 - ¥{PLAN_PRICES.enterprise}/月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={cn(TYPOGRAPHY.caption, "text-slate-500")}>支付方式</Label>
                  <Select value={newOrderPayment} onValueChange={(v) => setNewOrderPayment(v ?? "alipay")}>
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="wechat">微信支付</SelectItem>
                      <SelectItem value="bank_transfer">银行转账</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={creating}
                    className="w-full bg-cyan-600 text-white hover:bg-cyan-700 gap-2"
                  >
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    {creating ? "创建中..." : "创建订单"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-amber-50 ring-1 ring-amber-200/50`}>
                  <FileText className="size-5 text-amber-700" />
                </div>
                <div>
                  <h2 className={String(TYPOGRAPHY.h2)}>订单与发票</h2>
                  <p className={cn(TYPOGRAPHY.caption, "text-slate-500")}>查看订单记录和管理发票</p>
                </div>
              </div>

              {activeTab === "orders" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="订单列表">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-slate-500">订单号</th>
                        <th className="px-4 py-3 text-left text-slate-500">计划</th>
                        <th className="px-4 py-3 text-left text-slate-500">金额</th>
                        <th className="px-4 py-3 text-left text-slate-500">状态</th>
                        <th className="px-4 py-3 text-left text-slate-500">创建时间</th>
                        <th className="px-4 py-3 text-right text-slate-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, className: "" }
                        return (
                          <tr key={order.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-4">
                              <span className="font-mono text-slate-900">{order.order_no}</span>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                                {PLAN_LABELS[order.plan] ?? order.plan}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-mono font-semibold text-slate-900">¥{order.amount}</span>
                              <span className="ml-1 text-slate-500">{order.currency}</span>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {formatDateTime(order.created_at)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                {order.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePayOrder(order.id)}
                                      disabled={payingOrderId === order.id}
                                      className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    >
                                      {payingOrderId === order.id ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                      ) : (
                                        <CreditCard className="size-3.5" />
                                      )}
                                      支付
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelOrder(order.id)}
                                      disabled={cancellingOrderId === order.id}
                                      className="gap-1 border-slate-200 text-slate-500 hover:bg-slate-50"
                                    >
                                      <XCircle className="size-3.5" />
                                      取消
                                    </Button>
                                  </>
                                )}
                                {order.status === "paid" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openInvoiceDialog(order.id)}
                                    className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                                  >
                                    <Receipt className="size-3.5" />
                                    开票
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                            暂无订单记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "invoices" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="发票列表">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-slate-500">发票号</th>
                        <th className="px-4 py-3 text-left text-slate-500">抬头</th>
                        <th className="px-4 py-3 text-left text-slate-500">金额</th>
                        <th className="px-4 py-3 text-left text-slate-500">税额</th>
                        <th className="px-4 py-3 text-left text-slate-500">价税合计</th>
                        <th className="px-4 py-3 text-left text-slate-500">状态</th>
                        <th className="px-4 py-3 text-left text-slate-500">开具时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => {
                        const statusCfg = INVOICE_STATUS_CONFIG[inv.status] ?? { label: inv.status, className: "" }
                        return (
                          <tr key={inv.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-4 py-4">
                              <span className="font-mono text-slate-900">{inv.invoice_no}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-700">{inv.title}</td>
                            <td className="px-4 py-4 font-mono text-slate-900">¥{inv.amount}</td>
                            <td className="px-4 py-4 font-mono text-slate-500">¥{inv.tax_amount ?? "-"}</td>
                            <td className="px-4 py-4 font-mono font-semibold text-slate-900">¥{inv.total_amount ?? "-"}</td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-slate-500">{formatDateTime(inv.issued_at)}</td>
                          </tr>
                        )
                      })}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                            暂无发票记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <InvoiceRequestDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        orderId={invoiceOrderId}
        onDone={loadInvoices}
      />
    </div>
  )
}
