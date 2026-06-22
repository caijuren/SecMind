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
import { TablePagination } from "@/components/layout/table-pagination"
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
  free: "billing.planFree",
  starter: "billing.planStarter",
  professional: "billing.planProfessional",
  enterprise: "billing.planEnterprise",
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 299,
  professional: 999,
  enterprise: 2999,
}

const STATUS_CONFIG: Record<string, { labelKey: string; className: string }> = {
  pending: { labelKey: "billing.pending", className: "border-amber-200 bg-amber-50 text-amber-700" },
  paid: { labelKey: "billing.paid", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  cancelled: { labelKey: "billing.cancelled", className: "border-border bg-background text-muted-foreground" },
}

const INVOICE_STATUS_CONFIG: Record<string, { labelKey: string; className: string }> = {
  issued: { labelKey: "billing.invoiceIssued", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  pending: { labelKey: "billing.invoiceIssuing", className: "border-amber-200 bg-amber-50 text-amber-700" },
}

const MOCK_TRIAL_STATUS: TrialStatusData = {
  is_trial: true,
  trial_ends_at: new Date(Date.now() + 1296000000).toISOString(),
  days_remaining: 15,
  is_expired: false,
  plan: "professional",
}

const MOCK_CONVERSION_PREVIEW: ConversionPreviewData = {
  current_plan: "professional",
  target_plan: "enterprise",
  current_price: 999,
  target_price: 2999,
  proration_days: 15,
  proration_amount: 1000,
  total_amount: 2000,
}

const MOCK_ORDERS: OrderItem[] = [
  { id: 1, tenant_id: 1, order_no: "ORD-20250519-001", plan: "professional", amount: 999, currency: "CNY", status: "paid", payment_method: "alipay", paid_at: new Date(Date.now() - 1296000000).toISOString(), created_at: new Date(Date.now() - 1382400000).toISOString() },
  { id: 2, tenant_id: 1, order_no: "ORD-20250519-002", plan: "enterprise", amount: 2999, currency: "CNY", status: "pending", payment_method: "wechat", paid_at: null, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, tenant_id: 1, order_no: "ORD-20250401-003", plan: "starter", amount: 299, currency: "CNY", status: "paid", payment_method: "bank_transfer", paid_at: new Date(Date.now() - 4147200000).toISOString(), created_at: new Date(Date.now() - 4233600000).toISOString() },
  { id: 4, tenant_id: 1, order_no: "ORD-20250315-004", plan: "starter", amount: 299, currency: "CNY", status: "cancelled", payment_method: "alipay", paid_at: null, created_at: new Date(Date.now() - 5616000000).toISOString() },
  { id: 5, tenant_id: 1, order_no: "ORD-20250301-005", plan: "professional", amount: 999, currency: "CNY", status: "paid", payment_method: "alipay", paid_at: new Date(Date.now() - 6825600000).toISOString(), created_at: new Date(Date.now() - 6912000000).toISOString() },
]

const MOCK_INVOICES: InvoiceItem[] = [
  { id: 1, tenant_id: 1, order_id: 1, invoice_no: "INV-20250501-001", title: "某大型银行总行", amount: 999, tax_rate: 6, tax_amount: 56.55, total_amount: 1055.55, status: "issued", buyer_name: "某大型银行总行", buyer_tax_no: "91110000MA12345678", issued_at: new Date(Date.now() - 1209600000).toISOString(), created_at: new Date(Date.now() - 1296000000).toISOString() },
  { id: 2, tenant_id: 1, order_id: 3, invoice_no: "INV-20250402-002", title: "某大型银行总行", amount: 299, tax_rate: 6, tax_amount: 16.98, total_amount: 315.98, status: "issued", buyer_name: "某大型银行总行", buyer_tax_no: "91110000MA12345678", issued_at: new Date(Date.now() - 4147200000).toISOString(), created_at: new Date(Date.now() - 4233600000).toISOString() },
  { id: 3, tenant_id: 1, order_id: 5, invoice_no: "INV-20250302-003", title: "某大型银行总行", amount: 999, tax_rate: 6, tax_amount: 56.55, total_amount: 1055.55, status: "issued", buyer_name: "某大型银行总行", buyer_tax_no: "91110000MA12345678", issued_at: new Date(Date.now() - 6739200000).toISOString(), created_at: new Date(Date.now() - 6825600000).toISOString() },
  { id: 4, tenant_id: 1, order_id: 2, invoice_no: "INV-20250520-004", title: "某大型银行总行", amount: 2999, tax_rate: 6, tax_amount: null, total_amount: null, status: "pending", buyer_name: "某大型银行总行", buyer_tax_no: "91110000MA12345678", issued_at: null, created_at: new Date(Date.now() - 86400000).toISOString() },
]

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
  const { t } = useLocaleStore()
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
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("billing.requestInvoice")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t("billing.invoiceRequestDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-title">{t("billing.invoiceTitle")}</Label>
            <Input
              id="invoice-title"
              name="title"
              autoComplete="organization"
              spellCheck={false}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder={t("billing.invoiceTitlePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-buyer-name">{t("billing.buyerName")}</Label>
            <Input
              id="invoice-buyer-name"
              name="buyer_name"
              autoComplete="organization"
              spellCheck={false}
              value={form.buyer_name}
              onChange={(e) => setForm((p) => ({ ...p, buyer_name: e.target.value }))}
              placeholder={t("billing.buyerNamePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-buyer-tax-no">{t("billing.buyerTaxNo")}</Label>
            <Input
              id="invoice-buyer-tax-no"
              name="buyer_tax_no"
              autoComplete="off"
              spellCheck={false}
              value={form.buyer_tax_no}
              onChange={(e) => setForm((p) => ({ ...p, buyer_tax_no: e.target.value }))}
              placeholder={t("billing.buyerTaxNoPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("billing.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? t("billing.submitting") : t("billing.submitRequest")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function BillingPage() {
  const { t } = useLocaleStore()

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

  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [invoicesPage, setInvoicesPage] = useState(1)
  const [invoicesPageSize, setInvoicesPageSize] = useState(10)

  const loadTrialStatus = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/trial-status`)
      setTrialStatus(res.data)
    } catch {
      setTrialStatus(MOCK_TRIAL_STATUS)
    }
  }, [])

  const loadConversionPreview = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/conversion-preview`, {
        params: { target_plan: targetPlan },
      })
      setConversionPreview(res.data)
    } catch {
      setConversionPreview({
        ...MOCK_CONVERSION_PREVIEW,
        target_plan: targetPlan,
        target_price: PLAN_PRICES[targetPlan] ?? 999,
      })
    }
  }, [targetPlan])

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/orders`)
      setOrders(res.data)
    } catch {
      setOrders(MOCK_ORDERS)
    }
  }, [])

  const loadInvoices = useCallback(async () => {
    try {
      const res = await api.get(`/billing/tenants/${TENANT_ID}/invoices`)
      setInvoices(res.data)
    } catch {
      setInvoices(MOCK_INVOICES)
    }
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

  const ordersTotalPages = Math.max(1, Math.ceil(orders.length / ordersPageSize))
  const ordersSafePage = Math.min(ordersPage, ordersTotalPages)
  const paginatedOrders = orders.slice((ordersSafePage - 1) * ordersPageSize, ordersSafePage * ordersPageSize)

  const invoicesTotalPages = Math.max(1, Math.ceil(invoices.length / invoicesPageSize))
  const invoicesSafePage = Math.min(invoicesPage, invoicesTotalPages)
  const paginatedInvoices = invoices.slice((invoicesSafePage - 1) * invoicesPageSize, invoicesSafePage * invoicesPageSize)

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        icon={CreditCard}
        title={t("billing.title")}
        subtitle={t("settings.billingSubtitle")}
      />

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "subscription"}
          onClick={() => setActiveTab("subscription")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "subscription" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("billing.subscriptionTab")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("billing.orderList")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "invoices"}
          onClick={() => setActiveTab("invoices")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "invoices" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("billing.invoiceList")}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "funnel"}
          onClick={() => setActiveTab("funnel")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "funnel" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("billing.funnelTab")}
        </button>
      </div>

      {activeTab === "subscription" && <SubscriptionTab />}

      {activeTab === "funnel" && <FunnelTab />}

      {activeTab !== "subscription" && activeTab !== "funnel" && loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          {t("billing.loading")}
        </div>
      )}

      {activeTab !== "subscription" && activeTab !== "funnel" && !loading && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={CARD.elevated}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 ring-1 ring-cyan-200/50`}>
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.trialStatus")}</h2>
                    <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.currentPlanColon")}{t(PLAN_LABELS[trialStatus?.plan ?? "free"] ?? "")}</p>
                  </div>
                </div>

                {trialStatus?.is_trial && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={cn(TYPOGRAPHY.body, "text-foreground")}>{t("billing.trialDaysRemaining")}</span>
                      <span className={cn(TYPOGRAPHY.h2, "font-bold font-mono", trialStatus.is_expired ? "text-red-600" : "text-foreground")}>
                        {trialStatus.is_expired ? t("billing.expired") : `${trialStatus.days_remaining}${t("billing.days")}`}
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
                          {t("billing.trialExpired")}
                        </Badge>
                      ) : trialStatus.days_remaining <= 7 ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          <AlertTriangle className="mr-1 size-3" />
                          {t("billing.trialAlmostUp")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-primary">
                          <CheckCircle2 className="mr-1 size-3" />
                          {t("billing.trialActive")}
                        </Badge>
                      )}
                      {trialStatus.trial_ends_at && (
                        <span className={cn(TYPOGRAPHY.micro, "text-muted-foreground")}>
                          {t("billing.expiryDateColon")}{formatDateTime(trialStatus.trial_ends_at)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!trialStatus?.is_trial && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="mr-1 size-3" />
                      {t("billing.activeSubscription")}
                    </Badge>
                    <span className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>
                      {t("billing.activeSubscriptionDesc")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={CARD.elevated}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-cyan-50 ring-1 ring-cyan-200/50`}>
                    <ArrowUpCircle className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.upgradePreview")}</h2>
                    <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.viewPlanChangeDetails")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.targetPlan")}</Label>
                    <Select value={targetPlan} onValueChange={(v) => setTargetPlan(v ?? "professional")}>
                      <SelectTrigger className={`w-full ${inputClass}`}>
                        <SelectValue placeholder={t("billing.selectTargetPlan")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">{t("billing.planStarter")} - ¥{PLAN_PRICES.starter}{t("billing.planPerMonth")}</SelectItem>
                        <SelectItem value="professional">{t("billing.planProfessional")} - ¥{PLAN_PRICES.professional}{t("billing.planPerMonth")}</SelectItem>
                        <SelectItem value="enterprise">{t("billing.planEnterprise")} - ¥{PLAN_PRICES.enterprise}{t("billing.planPerMonth")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {conversionPreview && (
                    <div className={`${softCardClass} p-4 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.currentPlan")}</span>
                        <span className={cn(TYPOGRAPHY.body, "font-medium text-foreground")}>{t(PLAN_LABELS[conversionPreview.current_plan] ?? conversionPreview.current_plan)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.targetPlan")}</span>
                        <span className={cn(TYPOGRAPHY.body, "font-medium text-foreground")}>{t(PLAN_LABELS[conversionPreview.target_plan] ?? conversionPreview.target_plan)}</span>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.currentPrice")}</span>
                        <span className={cn(TYPOGRAPHY.body, "font-mono text-foreground")}>¥{conversionPreview.current_price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.targetPrice")}</span>
                        <span className={cn(TYPOGRAPHY.body, "font-mono text-foreground")}>¥{conversionPreview.target_price}</span>
                      </div>
                      {conversionPreview.proration_days > 0 && (
                        <div className="flex items-center justify-between">
                          <span className={cn(TYPOGRAPHY.body, "text-muted-foreground")}>{t("billing.prorationPrefix")}{conversionPreview.proration_days}{t("billing.days")}{t("billing.prorationSuffix")}</span>
                          <span className={cn(TYPOGRAPHY.body, "font-mono", conversionPreview.proration_amount >= 0 ? "text-amber-600" : "text-emerald-600")}>
                            {conversionPreview.proration_amount >= 0 ? "+" : ""}¥{conversionPreview.proration_amount}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-slate-200" />
                      <div className="flex items-center justify-between">
                        <span className={cn(TYPOGRAPHY.h3, "font-semibold text-foreground")}>{t("billing.amountDue")}</span>
                        <span className={cn(TYPOGRAPHY.h2, "font-bold font-mono text-primary")}>¥{conversionPreview.total_amount}</span>
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
                  <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.createOrder")}</h2>
                  <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.selectPlanAndPayment")}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.subscriptionPlan")}</Label>
                  <Select value={newOrderPlan} onValueChange={(v) => setNewOrderPlan(v ?? "professional")}>
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">{t("billing.planStarter")} - ¥{PLAN_PRICES.starter}{t("billing.planPerMonth")}</SelectItem>
                      <SelectItem value="professional">{t("billing.planProfessional")} - ¥{PLAN_PRICES.professional}{t("billing.planPerMonth")}</SelectItem>
                      <SelectItem value="enterprise">{t("billing.planEnterprise")} - ¥{PLAN_PRICES.enterprise}{t("billing.planPerMonth")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.paymentMethod")}</Label>
                  <Select value={newOrderPayment} onValueChange={(v) => setNewOrderPayment(v ?? "alipay")}>
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alipay">{t("billing.alipay")}</SelectItem>
                      <SelectItem value="wechat">{t("billing.wechat")}</SelectItem>
                      <SelectItem value="bank_transfer">{t("billing.bankTransfer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={creating}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    {creating ? t("billing.creating") : t("billing.createOrder")}
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
                  <h2 className={String(TYPOGRAPHY.h2)}>{t("billing.ordersAndInvoices")}</h2>
                  <p className={cn(TYPOGRAPHY.caption, "text-muted-foreground")}>{t("billing.viewOrdersAndInvoices")}</p>
                </div>
              </div>

              {activeTab === "orders" && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <table className="w-full caption-bottom text-sm" aria-label={t("billing.orderList")}>
                    <thead>
                      <tr className="border-b border-border">
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.orderNo")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.plan")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.amount")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.status")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.createdAt")}</th>
                        <th className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order) => {
                        const statusCfg = STATUS_CONFIG[order.status] ?? { labelKey: order.status, className: "" }
                        return (
                          <tr key={order.id} className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0">
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <span className="font-mono text-foreground">{order.order_no}</span>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-primary">
                                {t(PLAN_LABELS[order.plan] ?? order.plan)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <span className="font-mono font-semibold text-foreground">¥{order.amount}</span>
                              <span className="ml-1 text-muted-foreground">{order.currency}</span>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <Badge variant="outline" className={statusCfg.className}>
                                {t(statusCfg.labelKey)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">
                              {formatDateTime(order.created_at)}
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
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
                                      {t("billing.pay")}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelOrder(order.id)}
                                      disabled={cancellingOrderId === order.id}
                                      className="gap-1 border-border text-muted-foreground hover:bg-muted/50"
                                    >
                                      <XCircle className="size-3.5" />
                                      {t("billing.cancel")}
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
                                    {t("billing.issueInvoice")}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                            {t("billing.noOrders")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <TablePagination
                    totalItems={orders.length}
                    pageSize={ordersPageSize}
                    currentPage={ordersSafePage}
                    totalPages={ordersTotalPages}
                    onPageChange={setOrdersPage}
                    onPageSizeChange={(size) => { setOrdersPageSize(size); setOrdersPage(1) }}
                    resultsLabel={t("billing.resultsCount")}
                    perPageLabel={t("billing.paginationPerPage")}
                  />
                </div>
              )}

              {activeTab === "invoices" && (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <table className="w-full caption-bottom text-sm" aria-label={t("billing.invoiceList")}>
                    <thead>
                      <tr className="border-b border-border">
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.invoiceNo")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.invoiceTitleLabel")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.amount")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.taxAmount")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.totalWithTax")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.status")}</th>
                        <th className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("billing.issuedAt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((inv) => {
                        const statusCfg = INVOICE_STATUS_CONFIG[inv.status] ?? { labelKey: inv.status, className: "" }
                        return (
                          <tr key={inv.id} className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0">
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <span className="font-mono text-foreground">{inv.invoice_no}</span>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap text-foreground">{inv.title}</td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono text-foreground">¥{inv.amount}</td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono text-muted-foreground">¥{inv.tax_amount ?? "-"}</td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap font-mono font-semibold text-foreground">¥{inv.total_amount ?? "-"}</td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <Badge variant="outline" className={statusCfg.className}>
                                {t(statusCfg.labelKey)}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">{formatDateTime(inv.issued_at)}</td>
                          </tr>
                        )
                      })}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                            {t("billing.noInvoices")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <TablePagination
                    totalItems={invoices.length}
                    pageSize={invoicesPageSize}
                    currentPage={invoicesSafePage}
                    totalPages={invoicesTotalPages}
                    onPageChange={setInvoicesPage}
                    onPageSizeChange={(size) => { setInvoicesPageSize(size); setInvoicesPage(1) }}
                    resultsLabel={t("billing.resultsCount")}
                    perPageLabel={t("billing.paginationPerPage")}
                  />
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
