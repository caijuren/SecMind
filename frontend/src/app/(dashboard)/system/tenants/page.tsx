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
  pageCardClass,
  softCardClass,
  subtleTextClass,
} from "@/lib/admin-ui"
import { CARD, RADIUS, TYPOGRAPHY } from "@/lib/design-system"
import { useLocaleStore } from "@/store/locale-store"
import { ConfirmDialog } from "@/components/common/confirm-dialog"

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

const planLabelMap: Record<TenantPlan, string> = {
  free: "免费版",
  starter: "入门版",
  professional: "专业版",
  enterprise: "企业版",
}

const planClassMap: Record<TenantPlan, string> = {
  free: "border-white/[0.08] bg-white/[0.03] text-zinc-400",
  starter: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  professional: "border-purple-500/25 bg-purple-500/10 text-purple-400",
  enterprise: "border-amber-500/25 bg-amber-500/10 text-amber-400",
}

const statusLabelMap: Record<TenantStatus, string> = {
  active: "活跃",
  trial: "试用",
  expired: "已过期",
  suspended: "已暂停",
}

const statusClassMap: Record<TenantStatus, string> = {
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  trial: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
  expired: "border-red-500/25 bg-red-500/10 text-red-400",
  suspended: "border-zinc-500/25 bg-zinc-800/30 text-zinc-400",
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
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Icon className="size-4 text-zinc-500" />
          {label}
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {current} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500">
        {pct > 90 ? "即将达到上限" : pct > 70 ? "使用量较高" : `已使用 ${pct.toFixed(0)}%`}
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
      <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建租户</DialogTitle>
          <DialogDescription className="text-zinc-500">
            创建新的租户组织，指定名称、标识和订阅计划。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">租户名称</Label>
            <Input
              id="tenant-name"
              name="name"
              type="text"
              autoComplete="organization"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="例：某某科技有限公司"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-slug">租户标识 (Slug)</Label>
            <Input
              id="tenant-slug"
              name="slug"
              type="text"
              autoComplete="off"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="例：some-company"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-email">所有者邮箱</Label>
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
            <Label>订阅计划</Label>
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
                <SelectItem value="free">免费版</SelectItem>
                <SelectItem value="starter">入门版</SelectItem>
                <SelectItem value="professional">专业版</SelectItem>
                <SelectItem value="enterprise">企业版</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
            >
              {saving ? "创建中…" : "创建租户"}
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
      <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>添加成员</DialogTitle>
          <DialogDescription className="text-zinc-500">
            将用户添加到此租户组织。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-user-id">用户 ID</Label>
            <Input
              id="member-user-id"
              name="user_id"
              type="text"
              autoComplete="off"
              value={form.user_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_id: e.target.value }))
              }
              placeholder="输入用户 ID"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>角色</Label>
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
                <SelectItem value="owner">所有者</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="member">成员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
            >
              {saving ? "添加中…" : "添加成员"}
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
    owner: "所有者",
    admin: "管理员",
    member: "成员",
  }

  const memberRoleClass: Record<string, string> = {
    owner: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    admin: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
    member: "border-white/[0.08] bg-white/[0.03] text-zinc-400",
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/system/tenants" onClick={onBack} className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.04]">
          <ArrowLeft className="mr-1 size-4" />
          返回列表
        </Link>
      </div>

      <Card className={CARD.elevated}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex size-12 items-center justify-center ${RADIUS.lg} bg-cyan-500/10`}>
                <Building2 className="size-6 text-cyan-400" />
              </div>
              <div>
                <h2 className={String(TYPOGRAPHY.h1)}>{tenant.name}</h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm text-zinc-500">{tenant.slug}</span>
                  <Badge variant="outline" className={planClassMap[tenant.plan]}>
                    {planLabelMap[tenant.plan]}
                  </Badge>
                  <Badge variant="outline" className={statusClassMap[tenant.status]}>
                    {statusLabelMap[tenant.status]}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-zinc-500">
              <div className="flex items-center gap-1 justify-end">
                <Mail className="size-3.5" />
                {tenant.owner_email}
              </div>
              <div className="mt-1">到期时间：{formatDateTime(tenant.expires_at)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-10 text-center text-zinc-500">加载中…</div>
      ) : (
        <Tabs defaultValue="quota">
          <TabsList variant="line">
            <TabsTrigger value="quota">
              <Activity className="size-4" />
              配额用量
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="size-4" />
              成员管理
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="size-4" />
              订阅信息
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quota" className="mt-4">
            <Card className={CARD.elevated}>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className={String(TYPOGRAPHY.h2) + " text-zinc-200"}>
                    资源配额
                  </h3>
                  <p className={`mt-1 ${String(TYPOGRAPHY.caption)} text-zinc-500`}>
                    当前租户的资源使用情况
                  </p>
                </div>
                {quota ? (
                  <div className="space-y-6">
                    <QuotaBar
                      label="用户数"
                      current={quota.current_users}
                      max={quota.max_users}
                      icon={Users}
                      color="bg-cyan-500"
                    />
                    <QuotaBar
                      label="今日告警"
                      current={quota.current_alerts_today}
                      max={quota.max_alerts_per_day}
                      icon={Bell}
                      color="bg-purple-500"
                    />
                    <QuotaBar
                      label="今日 API 调用"
                      current={quota.current_api_calls_today}
                      max={quota.max_api_calls_per_day}
                      icon={Zap}
                      color="bg-blue-500"
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500">
                    暂无配额数据
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <Card className={CARD.elevated}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={String(TYPOGRAPHY.h2) + " text-zinc-200"}>
                      成员列表
                    </h3>
                    <p className={`mt-1 ${String(TYPOGRAPHY.caption)} text-zinc-500`}>
                      共 {members.length} 名成员
                    </p>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
                    size="sm"
                    onClick={() => setMemberDialogOpen(true)}
                  >
                    <UserPlus className="mr-1 size-4" />
                    添加成员
                  </Button>
                </div>
                {members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white/[0.03]">
                        <tr className="border-b border-white/[0.06]">
                          <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                            成员
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                            角色
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                            加入时间
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-zinc-500">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr
                            key={member.user_id}
                            className="border-b border-white/[0.04] last:border-b-0"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-cyan-500/10 font-semibold text-cyan-400 text-xs">
                                  {(member.name || member.email).slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-zinc-100">
                                    {member.name || "-"}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
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
                            <td className="px-4 py-3 text-zinc-500">
                              {formatDateTime(member.joined_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/25 text-red-400 hover:bg-red-500/10"
                                  onClick={() => setDeleteTarget({userId: member.user_id, name: member.name || member.email})}
                                  disabled={member.role === "owner"}
                                >
                                  <Trash2 className="mr-1 size-3.5" />
                                  移除
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500">
                    暂无成员
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <h3 className={String(TYPOGRAPHY.h2) + " text-zinc-200"}>
                    订阅信息
                  </h3>
                  <p className={`mt-1 ${String(TYPOGRAPHY.caption)} text-zinc-500`}>
                    当前租户的订阅计划与账单周期
                  </p>
                </div>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>当前计划</p>
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
                        <p className={`text-xs ${subtleTextClass}`}>订阅状态</p>
                        <p className="mt-2 text-sm font-medium text-zinc-100">
                          {subscription.status === "active"
                            ? "生效中"
                            : subscription.status === "canceled"
                              ? "已取消"
                              : subscription.status === "past_due"
                                ? "逾期未付"
                                : subscription.status}
                        </p>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>
                          当前计费周期
                        </p>
                        <p className="mt-2 text-sm font-medium text-zinc-100">
                          {formatDateTime(subscription.current_period_start)} ~{" "}
                          {formatDateTime(subscription.current_period_end)}
                        </p>
                      </div>
                      <div className={`${softCardClass} p-4`}>
                        <p className={`text-xs ${subtleTextClass}`}>
                          周期结束是否取消
                        </p>
                        <p className="mt-2 text-sm font-medium text-zinc-100">
                          {subscription.cancel_at_period_end ? "是" : "否"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500">
                    暂无订阅信息
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
        title="移除成员"
        description={`确定要将 ${deleteTarget?.name} 从该租户中移除吗？此操作不可撤销。`}
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

export default function TenantsPage() {
  const { t } = useLocaleStore()

  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null)

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
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            创建租户
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            key: "total",
            label: "全部租户",
            value: stats.total,
            icon: Building2,
          },
          {
            key: "active",
            label: "活跃",
            value: stats.active,
            icon: Activity,
          },
          {
            key: "trial",
            label: "试用中",
            value: stats.trial,
            icon: Zap,
          },
          {
            key: "expired",
            label: "已过期",
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
                <p className={`text-xs ${subtleTextClass}`}>{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
                  {item.value}
                </p>
              </div>
              <span className={`rounded-lg bg-cyan-500/10 p-2 text-cyan-400 ${RADIUS.md}`}>
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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索租户名称、标识、所有者邮箱…"
            className={`pl-9 ${inputClass}`}
          />
        </div>
        <div className="text-sm text-zinc-500">
          当前显示 {filteredTenants.length} 个租户
        </div>
      </div>

      <Card className={pageCardClass}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03]">
                <tr className="border-b border-white/[0.06]">
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                    租户名称
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">标识</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">计划</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">状态</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                    所有者邮箱
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                    最大用户数
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">
                    到期时间
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="cursor-pointer border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-colors"
                    onClick={() => setSelectedTenant(tenant)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/10 font-semibold text-cyan-400">
                          {tenant.name.slice(0, 1)}
                        </div>
                        <p className="font-medium text-zinc-100">
                          {tenant.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-400 font-mono text-xs">
                      {tenant.slug}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={planClassMap[tenant.plan]}
                      >
                        {planLabelMap[tenant.plan]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={statusClassMap[tenant.status]}
                      >
                        {statusLabelMap[tenant.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-zinc-400">
                      {tenant.owner_email}
                    </td>
                    <td className="px-4 py-4 text-zinc-400">
                      {tenant.max_users}
                    </td>
                    <td className="px-4 py-4 text-zinc-500">
                      {formatDateTime(tenant.expires_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredTenants.length === 0 && (
            <div className="p-10 text-center text-zinc-500">
              没有匹配的租户
            </div>
          )}
          {loading && (
            <div className="p-10 text-center text-zinc-500">加载中…</div>
          )}
        </CardContent>
      </Card>

      <CreateTenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={loadTenants}
      />
    </div>
  )
}
