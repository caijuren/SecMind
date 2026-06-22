"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  CreditCard,
  Mail,
  Plus,
  Search,
  Trash2,
  ArrowLeft,
  Users,
  UserPlus,
  Activity,
  Zap,
  Bell,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, formatDateTime } from "@/lib/api"
import {
  inputClass,
  softCardClass,
  subtleTextClass,
} from "@/lib/admin-ui"
import { CARD, RADIUS, TYPOGRAPHY } from "@/lib/design-system"
import { useLocaleStore } from "@/store/locale-store"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { TablePagination } from "@/components/layout/table-pagination"

type TenantPlan = "free" | "starter" | "professional" | "enterprise"
type TenantStatus = "active" | "trial" | "expired" | "suspended"

interface TenantItem {
  id: string
  name: string
  slug: string
  plan: TenantPlan
  status: TenantStatus
  owner_email: string
  max_users: number
  expires_at: string | null
  created_at: string
}

interface QuotaData {
  plan: TenantPlan
  max_users: number
  current_users: number
  max_alerts_per_day: number
  current_alerts_today: number
  max_api_calls_per_day: number
  current_api_calls_today: number
}

interface MemberItem {
  user_id: string
  email: string
  name: string
  role: string
  joined_at: string
}

interface SubscriptionData {
  plan: TenantPlan
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

function getPlanLabelMap(t: (key: string) => string): Record<TenantPlan, string> {
  return {
    free: t("tenant.planFree"),
    starter: t("tenant.planStarter"),
    professional: t("tenant.planProfessional"),
    enterprise: t("tenant.planEnterprise"),
  }
}

const planClassMap: Record<TenantPlan, string> = {
  free: "border-border bg-muted/50 text-muted-foreground",
  starter: "border-blue-500/25 bg-blue-500/10 text-blue-600",
  professional: "border-purple-500/25 bg-purple-500/10 text-purple-600",
  enterprise: "border-amber-500/25 bg-amber-500/10 text-amber-600",
}

function getStatusLabelMap(t: (key: string) => string): Record<TenantStatus, string> {
  return {
    active: t("tenant.active"),
    trial: t("tenant.trial"),
    expired: t("tenant.expired"),
    suspended: t("tenant.suspended"),
  }
}

const statusClassMap: Record<TenantStatus, string> = {
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
  trial: "border-cyan-500/25 bg-cyan-500/10 text-cyan-600",
  expired: "border-red-500/25 bg-red-500/10 text-red-600",
  suspended: "border-zinc-500/25 bg-muted text-muted-foreground",
}

const MOCK_TENANTS: TenantItem[] = [
  { id: "t-001", name: "某大型银行总行", slug: "big-bank-hq", plan: "enterprise", status: "active", owner_email: "admin@bigbank.com", max_users: 200, expires_at: new Date(Date.now() + 31536000000).toISOString(), created_at: new Date(Date.now() - 31536000000).toISOString() },
  { id: "t-002", name: "XX证券股份有限公司", slug: "xx-securities", plan: "professional", status: "active", owner_email: "secops@xxsecurities.com", max_users: 50, expires_at: new Date(Date.now() + 18000000000).toISOString(), created_at: new Date(Date.now() - 18000000000).toISOString() },
  { id: "t-003", name: "顺丰科技有限公司", slug: "sf-tech", plan: "professional", status: "active", owner_email: "devops@sftech.com", max_users: 30, expires_at: new Date(Date.now() + 25000000000).toISOString(), created_at: new Date(Date.now() - 12000000000).toISOString() },
  { id: "t-004", name: "华润集团信息部", slug: "crc-it", plan: "enterprise", status: "active", owner_email: "itsec@crc.com", max_users: 150, expires_at: new Date(Date.now() + 40000000000).toISOString(), created_at: new Date(Date.now() - 20000000000).toISOString() },
  { id: "t-005", name: "美团安全团队", slug: "meituan-sec", plan: "starter", status: "trial", owner_email: "security@meituan.com", max_users: 10, expires_at: new Date(Date.now() + 1209600000).toISOString(), created_at: new Date(Date.now() - 1209600000).toISOString() },
  { id: "t-006", name: "字节跳动SOC", slug: "bytedance-soc", plan: "enterprise", status: "active", owner_email: "soc@bytedance.com", max_users: 500, expires_at: new Date(Date.now() + 50000000000).toISOString(), created_at: new Date(Date.now() - 25000000000).toISOString() },
  { id: "t-007", name: "滴滴出行安全部", slug: "didi-security", plan: "professional", status: "active", owner_email: "infosec@didiglobal.com", max_users: 40, expires_at: new Date(Date.now() + 22000000000).toISOString(), created_at: new Date(Date.now() - 15000000000).toISOString() },
  { id: "t-008", name: "京东科技集团", slug: "jd-tech", plan: "enterprise", status: "active", owner_email: "cirt@jd.com", max_users: 300, expires_at: new Date(Date.now() + 35000000000).toISOString(), created_at: new Date(Date.now() - 30000000000).toISOString() },
  { id: "t-009", name: "某创业科技公司", slug: "startup-tech", plan: "free", status: "expired", owner_email: "cto@startup-demo.com", max_users: 5, expires_at: new Date(Date.now() - 864000000).toISOString(), created_at: new Date(Date.now() - 5184000000).toISOString() },
  { id: "t-010", name: "新希望集团", slug: "newhope-group", plan: "professional", status: "trial", owner_email: "it@newhope.cn", max_users: 20, expires_at: new Date(Date.now() + 2592000000).toISOString(), created_at: new Date(Date.now() - 604800000).toISOString() },
  { id: "t-011", name: "上海浦东发展银行", slug: "spdb", plan: "enterprise", status: "active", owner_email: "soc@spdb.com.cn", max_users: 250, expires_at: new Date(Date.now() + 38000000000).toISOString(), created_at: new Date(Date.now() - 28000000000).toISOString() },
  { id: "t-012", name: "小米科技安全部", slug: "xiaomi-sec", plan: "professional", status: "suspended", owner_email: "sec@xiaomi.com", max_users: 60, expires_at: new Date(Date.now() - 864000000).toISOString(), created_at: new Date(Date.now() - 14000000000).toISOString() },
]

function QuotaBar({
  label,
  current,
  max,
  icon: Icon,
  color,
}: {
  label: string
  current: number
  max: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const { t } = useLocaleStore()
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const barColor =
    pct > 90
      ? "bg-red-500"
      : pct > 70
        ? "bg-amber-500"
        : color

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </div>
        <span className="text-sm font-medium text-foreground">
          {current} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {pct > 90 ? t("tenant.quotaNearLimit") : pct > 70 ? t("tenant.quotaHighUsage") : t("tenant.quotaUsed") + pct.toFixed(0) + "%"}
      </p>
    </div>
  )
}

function CreateTenantDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void>
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    owner_email: "",
    plan: "free" as TenantPlan,
  })
  const [saving, setSaving] = useState(false)
  const { t } = useLocaleStore()
  const planLabelMap = getPlanLabelMap(t)

  async function handleCreate() {
    if (!form.name || !form.slug || !form.owner_email) return
    setSaving(true)
    try {
      await api.post("/tenants", form)
      onOpenChange(false)
      setForm({ name: "", slug: "", owner_email: "", plan: "free" })
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("tenant.createTenant")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("tenant.createTenantDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">{t("tenant.name")}</Label>
            <Input
              id="tenant-name"
              name="name"
              type="text"
              autoComplete="organization"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t("tenant.tenantNamePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-slug">{t("tenant.tenantSlugLabel")}</Label>
            <Input
              id="tenant-slug"
              name="slug"
              type="text"
              autoComplete="off"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder={t("tenant.tenantSlugPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-email">{t("tenant.ownerEmail")}</Label>
            <Input
              id="tenant-email"
              name="owner_email"
              type="email"
              autoComplete="email"
              value={form.owner_email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, owner_email: e.target.value }))
              }
              placeholder="admin@example.com"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("tenant.subscriptionPlan")}</Label>
            <Select
              value={form.plan}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, plan: value as TenantPlan }))
              }
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{planLabelMap.free}</SelectItem>
                <SelectItem value="starter">{planLabelMap.starter}</SelectItem>
                <SelectItem value="professional">{planLabelMap.professional}</SelectItem>
                <SelectItem value="enterprise">{planLabelMap.enterprise}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? t("tenant.creating") : t("tenant.createTenant")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddMemberDialog({
  open,
  onOpenChange,
  tenantId,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onAdded: () => Promise<void>
}) {
  const [form, setForm] = useState({ user_id: "", role: "member" })
  const [saving, setSaving] = useState(false)
  const { t } = useLocaleStore()

  async function handleAdd() {
    if (!form.user_id) return
    setSaving(true)
    try {
      await api.post(`/tenants/${tenantId}/members`, form)
      onOpenChange(false)
      setForm({ user_id: "", role: "member" })
      await onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("tenant.addMember")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("tenant.addMemberDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-user-id">{t("tenant.userId")}</Label>
            <Input
              id="member-user-id"
              name="user_id"
              type="text"
              autoComplete="off"
              value={form.user_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_id: e.target.value }))
              }
              placeholder={t("tenant.userIdPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("tenant.role")}</Label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, role: value ?? "member" }))
              }
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">{t("tenant.roleOwner")}</SelectItem>
                <SelectItem value="admin">{t("tenant.roleAdmin")}</SelectItem>
                <SelectItem value="member">{t("tenant.roleMember")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? t("tenant.adding") : t("tenant.addMember")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TenantDetailView({
  tenant,
  onBack,
}: {
  tenant: TenantItem
  onBack: () => void
}) {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{userId: string, name: string} | null>(null)
  const { t } = useLocaleStore()
  const planLabelMap = getPlanLabelMap(t)
  const statusLabelMap = getStatusLabelMap(t)

  async function loadQuota() {
    try {
      const res = await api.get(`/tenants/${tenant.id}/quota`)
      setQuota(res.data)
    } catch {
      setQuota(null)
    }
  }

  async function loadMembers() {
    try {
      const res = await api.get(`/tenants/${tenant.id}/members`)
      setMembers(res.data.items ?? res.data ?? [])
    } catch {
      setMembers([])
    }
  }

  async function loadSubscription() {
    try {
      const res = await api.get(`/tenants/${tenant.id}/subscription`)
      setSubscription(res.data)
    } catch {
      setSubscription(null)
    }
  }

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([loadQuota(), loadMembers(), loadSubscription()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadAll()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id])

  async function removeMember(userId: string) {
    await api.delete(`/tenants/${tenant.id}/members/${userId}`)
    await loadMembers()
  }

  const memberRoleLabel: Record<string, string> = {
    owner: t("tenant.roleOwner"),
    admin: t("tenant.roleAdmin"),
    member: t("tenant.roleMember"),
  }

  const memberRoleClass: Record<string, string> = {
    owner: "border-amber-500/25 bg-amber-500/10 text-amber-600",
    admin: "border-cyan-500/25 bg-cyan-500/10 text-cyan-600",
    member: "border-border bg-muted/50 text-muted-foreground",
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/system/tenants" onClick={onBack} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          <ArrowLeft className="mr-1 size-4" />
          {t("tenant.backToList")}
        </Link>
      </div>

      <Card className={CARD.elevated}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex size-12 items-center justify-center ${RADIUS.lg} bg-cyan-500/10`}>
                <Building2 className="size-6 text-cyan-600" />
              </div>
              <div>
                <h2 className={String(TYPOGRAPHY.h1)}>{tenant.name}</h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{tenant.slug}</span>
                  <Badge variant="outline" className={planClassMap[tenant.plan]}>
                    {planLabelMap[tenant.plan]}
                  </Badge>
                  <Badge variant="outline" className={statusClassMap[tenant.status]}>
                    {statusLabelMap[tenant.status]}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1 justify-end">
                <Mail className="size-3.5" />
                {tenant.owner_email}
              </div>
              <div className="mt-1">{t("tenant.expiresAtColon")}{formatDateTime(tenant.expires_at)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <Tabs defaultValue="quota">
          <TabsList variant="line">
            <TabsTrigger value="quota">
              <Activity className="size-4" />
              {t("tenant.quotaUsage")}
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="size-4" />
              {t("tenant.memberManagement")}
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="size-4" />
              {t("tenant.subscriptionInfo")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quota" className="mt-4">
            <Card className={CARD.elevated}>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className={String(TYPOGRAPHY.h2) + " text-foreground"}>
                    {t("tenant.resourceQuota")}
                  </h3>
                  <p className={`mt-1 ${String(TYPOGRAPHY.caption)} text-muted-foreground`}>
                    {t("tenant.resourceQuotaDesc")}
                  </p>
                </div>
                {quota ? (
                  <div className="space-y-6">
                    <QuotaBar
                      label={t("tenant.userCount")}
                      current={quota.current_users}
                      max={quota.max_users}
                      icon={Users}
                      color="bg-cyan-500"
                    />
                    <QuotaBar
                      label={t("tenant.todayAlerts")}
                      current={quota.current_alerts_today}
                      max={quota.max_alerts_per_day}
                      icon={Bell}
                      color="bg-purple-500"
                    />
                    <QuotaBar
                      label={t("tenant.todayApiCalls")}
                      current={quota.current_api_calls_today}
                      max={quota.max_api_calls_per_day}
                      icon={Zap}
                      color="bg-blue-500"
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    {t("tenant.noQuotaData")}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-4 pb-0">
                <div>
                  <h3 className={String(TYPOGRAPHY.h2) + " text-foreground"}>
                    {t("tenant.memberList")}
                  </h3>
                  <p className={`mt-1 ${String(TYPOGRAPHY.caption)} text-muted-foreground`}>
                    {t("tenant.memberCountPrefix") + members.length + t("tenant.memberCountSuffix")}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setMemberDialogOpen(true)}
                >
                  <UserPlus className="mr-1 size-4" />
                  {t("tenant.addMember")}
                </Button>
              </div>
                {members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {t("tenant.memberHeader")}
                          </th>
                          <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {t("tenant.role")}
                          </th>
                          <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {t("tenant.joinedAt")}
                          </th>
                          <th scope="col" className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {t("common.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr
                            key={member.user_id}
                            className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0"
                          >
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-cyan-500/10 font-semibold text-cyan-600 text-xs">
                                  {(member.name || member.email).slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {member.name || "-"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={
                                  memberRoleClass[member.role] ??
                                  memberRoleClass.member
                                }
                              >
                                {memberRoleLabel[member.role] ?? member.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">
                              {formatDateTime(member.joined_at)}
                            </td>
                            <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/25 text-red-600 hover:bg-red-500/10"
                                  onClick={() => setDeleteTarget({userId: member.user_id, name: member.name || member.email})}
                                  disabled={member.role === "owner"}
                                >
                                  <Trash2 className="mr-1 size-3.5" />
                                  {t("tenant.remove")}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    {t("tenant.noMembers")}
                  </div>
                )}
            </div>
            <AddMemberDialog
              open={memberDialogOpen}
              onOpenChange={setMemberDialogOpen}
              tenantId={tenant.id}
              onAdded={loadMembers}
            />
          </TabsContent>

          <TabsContent value="subscription" className="mt-4">
            <Card className={CARD.elevated}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className={String(TYPOGRAPHY.h2) + " text-foreground"}>
                    {t("tenant.subscriptionInfo")}
                  </h3>
                  <p className={`mt-1 ${String(TYPOGRAPHY.caption)} text-muted-foreground`}>
                    {t("tenant.subscriptionInfoDesc")}
                  </p>
                </div>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>{t("tenant.currentPlan")}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={planClassMap[subscription.plan]}
                          >
                            {planLabelMap[subscription.plan]}
                          </Badge>
                        </div>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>{t("tenant.subscriptionStatus")}</p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {subscription.status === "active"
                            ? t("tenant.statusActive")
                            : subscription.status === "canceled"
                              ? t("tenant.statusCanceled")
                              : subscription.status === "past_due"
                                ? t("tenant.statusPastDue")
                                : subscription.status}
                        </p>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>
                          {t("tenant.currentBillingCycle")}
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {formatDateTime(subscription.current_period_start)} ~{" "}
                          {formatDateTime(subscription.current_period_end)}
                        </p>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>
                          {t("tenant.cancelAtPeriodEnd")}
                        </p>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {subscription.cancel_at_period_end ? t("common.yes") : t("common.no")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    {t("tenant.noSubscriptionData")}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={t("tenant.removeMember")}
        description={t("tenant.removeMemberConfirmPrefix") + (deleteTarget?.name ?? "") + t("tenant.removeMemberConfirmSuffix")}
        level="danger"
        onConfirm={() => {
          if (deleteTarget) {
            removeMember(deleteTarget.userId)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}

export function TenantsPage() {
  const { t } = useLocaleStore()
  const planLabelMap = getPlanLabelMap(t)
  const statusLabelMap = getStatusLabelMap(t)

  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function loadTenants() {
    setLoading(true)
    try {
      const response = await api.get("/tenants")
      const data = response.data.items ?? response.data ?? []
      setTenants(data.length > 0 ? data : MOCK_TENANTS)
    } catch {
      setTenants(MOCK_TENANTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadTenants()
    })
  }, [])

  const filteredTenants = useMemo(() => {
    if (!searchQuery) return tenants
    const q = searchQuery.toLowerCase()
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.owner_email.toLowerCase().includes(q)
    )
  }, [searchQuery, tenants])

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedTenants = filteredTenants.slice((safePage - 1) * pageSize, safePage * pageSize)

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    trial: tenants.filter((t) => t.status === "trial").length,
    expired: tenants.filter((t) => t.status === "expired").length,
  }

  if (selectedTenant) {
    return (
      <div className="space-y-5">
        <PageHeader
          icon={Building2}
          title={t("tenant.title")}
          subtitle={t("tenant.tenantDetail")}
        />
        <TenantDetailView
          tenant={selectedTenant}
          onBack={() => setSelectedTenant(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Building2}
        title={t("tenant.title")}
        subtitle={<span>{t("settings.tenantSubtitle")}</span>}
        actions={
          <Button
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            {t("tenant.createTenant")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            key: "total",
            labelKey: "tenant.allTenants",
            value: stats.total,
            icon: Building2,
          },
          {
            key: "active",
            labelKey: "tenant.active",
            value: stats.active,
            icon: Activity,
          },
          {
            key: "trial",
            labelKey: "tenant.trialActive",
            value: stats.trial,
            icon: Zap,
          },
          {
            key: "expired",
            labelKey: "tenant.expired",
            value: stats.expired,
            icon: CreditCard,
          },
        ].map((item) => (
          <div
            key={item.key}
            className={`${softCardClass} p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${subtleTextClass}`}>{t(item.labelKey)}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {item.value}
                </p>
              </div>
              <span className={`rounded-lg bg-cyan-500/10 p-2 text-cyan-600 ${RADIUS.md}`}>
                <item.icon className="size-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`${softCardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder={t("tenant.searchPlaceholder")}
            className={`pl-9 ${inputClass}`}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {t("tenant.showingTenantsPrefix") + filteredTenants.length + t("tenant.showingTenantsSuffix")}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("tenant.name")}
                  </th>
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("tenant.identifier")}</th>
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("tenant.plan")}</th>
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("tenant.status")}</th>
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("tenant.ownerEmail")}
                  </th>
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("tenant.maxUsers")}
                  </th>
                  <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("tenant.expiresAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="group relative cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0"
                    onClick={() => setSelectedTenant(tenant)}
                  >
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 font-semibold text-cyan-600">
                          {tenant.name.slice(0, 1)}
                        </div>
                        <p className="font-medium text-foreground">
                          {tenant.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {tenant.slug}
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={planClassMap[tenant.plan]}
                      >
                        {planLabelMap[tenant.plan]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={statusClassMap[tenant.status]}
                      >
                        {statusLabelMap[tenant.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">
                      {tenant.owner_email}
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">
                      {tenant.max_users}
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">
                      {formatDateTime(tenant.expires_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredTenants.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              {t("tenant.noMatchingTenants")}
            </div>
          )}
          {loading && (
            <div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div>
          )}
          <TablePagination
            totalItems={filteredTenants.length}
            pageSize={pageSize}
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
            resultsLabel={t("tenant.resultsCount")}
            perPageLabel={t("tenant.paginationPerPage")}
          />
      </div>

      <CreateTenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={loadTenants}
      />
    </div>
  )
}
