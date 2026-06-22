"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Mail, Phone, Plus, Search, Shield, Trash2, UserCog, UserX, Users } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, formatDateTime } from "@/lib/api"
import { inputClass, softCardClass, subtleTextClass } from "@/lib/admin-ui"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { TablePagination } from "@/components/layout/table-pagination"
import { useLocaleStore } from "@/store/locale-store"

type UserRole = "admin" | "analyst" | "viewer" | "user"
type UserStatus = "active" | "disabled"

interface UserItem {
  id: number
  name: string
  email: string
  phone?: string | null
  role: UserRole
  department?: string | null
  status: UserStatus
  last_login?: string | null
}

const roleLabelKeyMap: Record<UserRole, string> = {
  admin: "users.roleAdmin",
  analyst: "users.roleAnalyst",
  viewer: "users.roleViewer",
  user: "users.roleUser",
}

const roleClassMap: Record<UserRole, string> = {
  admin: "border-red-500/25 bg-red-500/10 text-red-600",
  analyst: "border-cyan-500/25 bg-primary/10 text-cyan-600",
  viewer: "border-border bg-muted/50 text-muted-foreground",
  user: "border-amber-500/25 bg-amber-500/10 text-amber-600",
}

const MOCK_USERS: UserItem[] = [
  { id: 1, name: "张伟", email: "zhangwei@secmind.com", phone: "13800000001", role: "admin", department: "安全运营中心", status: "active", last_login: new Date(Date.now() - 300000).toISOString() },
  { id: 2, name: "李娜", email: "lina@secmind.com", phone: "13800000002", role: "analyst", department: "安全分析组", status: "active", last_login: new Date(Date.now() - 900000).toISOString() },
  { id: 3, name: "王芳", email: "wangfang@secmind.com", phone: "13800000003", role: "analyst", department: "威胁情报组", status: "active", last_login: new Date(Date.now() - 1800000).toISOString() },
  { id: 4, name: "赵磊", email: "zhaolei@secmind.com", phone: "13800000004", role: "viewer", department: "合规审计部", status: "active", last_login: new Date(Date.now() - 3600000).toISOString() },
  { id: 5, name: "孙婷", email: "sunting@secmind.com", phone: "13800000005", role: "analyst", department: "安全运营中心", status: "active", last_login: new Date(Date.now() - 600000).toISOString() },
  { id: 6, name: "周杰", email: "zhoujie@secmind.com", phone: "13800000006", role: "viewer", department: "IT运维部", status: "active", last_login: new Date(Date.now() - 7200000).toISOString() },
  { id: 7, name: "吴敏", email: "wumin@secmind.com", phone: "13800000007", role: "user", department: "研发部", status: "disabled", last_login: new Date(Date.now() - 86400000).toISOString() },
  { id: 8, name: "陈强", email: "chenqiang@secmind.com", phone: "13800000008", role: "analyst", department: "安全分析组", status: "active", last_login: new Date(Date.now() - 1500000).toISOString() },
]

function AddUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void>
}) {
  const { t } = useLocaleStore()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "安全运营中心",
    role: "analyst" as UserRole,
  })
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      await api.post("/users", {
        ...form,
        password: "",
        status: "active",
      })
      onOpenChange(false)
      setForm({ name: "", email: "", phone: "", department: "安全运营中心", role: "analyst" })
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{t("users.addUserTitle")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t("users.addUserDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">{t("users.labelName")}</Label>
            <Input id="user-name" name="name" type="text" autoComplete="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">{t("users.labelEmail")}</Label>
            <Input id="user-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-phone">{t("users.labelPhone")}</Label>
            <Input id="user-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("users.labelRole")}</Label>
              <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("users.roleAdmin")}</SelectItem>
                  <SelectItem value="analyst">{t("users.roleAnalyst")}</SelectItem>
                  <SelectItem value="viewer">{t("users.roleViewer")}</SelectItem>
                  <SelectItem value="user">{t("users.roleUser")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-department">{t("users.labelDepartment")}</Label>
              <Input id="user-department" name="department" type="text" autoComplete="organization" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("users.cancel")}</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? t("users.creating") : t("users.createUser")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function UsersPage() {
  const { t } = useLocaleStore()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "disabled">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function loadUsers() {
    setLoading(true)
    try {
      const response = await api.get("/users")
      setUsers(response.data.items?.length > 0 ? response.data.items : MOCK_USERS)
    } catch {
      setUsers(MOCK_USERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        void loadUsers()
      })
    } else {
      Promise.resolve().then(() => loadUsers())
    }
  }, [])

  async function toggleStatus(user: UserItem) {
    await api.put(`/users/${user.id}`, {
      status: user.status === "active" ? "disabled" : "active",
    })
    await loadUsers()
  }

  async function deleteUser(id: number) {
    await api.delete(`/users/${id}`)
    await loadUsers()
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (activeFilter !== "all" && user.status !== activeFilter) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return [user.name, user.email, user.department ?? "", user.phone ?? ""].some((value) =>
        value.toLowerCase().includes(q)
      )
    })
  }, [activeFilter, searchQuery, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize)

  const stats = {
    all: users.length,
    active: users.filter((user) => user.status === "active").length,
    disabled: users.filter((user) => user.status === "disabled").length,
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={t("users.pageTitle")}
        subtitle={<span>{t("users.pageSubtitle")}</span>}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 size-4" />
            {t("users.addUser")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { key: "all" as const, labelKey: "users.allUsers", value: stats.all, icon: Users },
          { key: "active" as const, labelKey: "users.activeUsers", value: stats.active, icon: Shield },
          { key: "disabled" as const, labelKey: "users.disabledUsers", value: stats.disabled, icon: UserX },
        ].map((item) => (
          <button key={item.key} aria-pressed={activeFilter === item.key} onClick={() => { setActiveFilter(item.key); setCurrentPage(1) }} className={`${softCardClass} p-4 text-left ${activeFilter === item.key ? "ring-2 ring-cyan-500/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${subtleTextClass}`}>{t(item.labelKey)}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{item.value}</p>
              </div>
              <span className="rounded-lg bg-primary/10 p-2 text-cyan-600">
                <item.icon className="size-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className={`${softCardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder={t("users.searchPlaceholder")}
            className={`pl-9 ${inputClass}`}
          />
        </div>
        <div className="text-sm text-muted-foreground">{t("users.currentDisplay")} {filteredUsers.length} {t("users.peopleUnit")}</div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("users.thUser")}</th>
                <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("users.thContact")}</th>
                <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("users.thRoleDept")}</th>
                <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("users.thStatus")}</th>
                <th scope="col" className="h-10 px-4 text-left align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("users.thLastLogin")}</th>
                <th scope="col" className="h-10 px-4 text-right align-middle font-medium whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("users.thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="group relative border-b border-border/40 transition-colors hover:bg-muted/40 last:border-b-0">
                  <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-cyan-600">
                          {user.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" />{user.email}</div>
                        <div className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" />{user.phone || "-"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <div className="space-y-2">
                        <Badge variant="outline" className={roleClassMap[user.role]}>{t(roleLabelKeyMap[user.role])}</Badge>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="size-3.5" />
                          {user.department || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <Badge variant="outline" className={user.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600" : "border-red-500/25 bg-red-500/10 text-red-600"}>
                        {user.status === "active" ? t("users.statusActive") : t("users.statusDisabled")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap text-muted-foreground">{formatDateTime(user.last_login)}</td>
                    <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleStatus(user)}>
                          <UserCog className="mr-1 size-3.5" />
                          {user.status === "active" ? t("users.statusDisabled") : t("users.enable")}
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-500/25 text-red-600 hover:bg-red-500/10" onClick={() => setDeleteTarget({id: user.id, name: user.name})}>
                          <Trash2 className="mr-1 size-3.5" />
                          {t("users.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredUsers.length === 0 && <div className="p-10 text-center text-muted-foreground">{t("users.noMatch")}</div>}
          {loading && <div className="p-10 text-center text-muted-foreground">{t("users.loading")}</div>}
          <TablePagination
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
            resultsLabel={t("users.resultsCount")}
            perPageLabel={t("users.paginationPerPage")}
          />
      </div>

      <AddUserDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadUsers} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={t("users.deleteUserTitle")}
        description={t("users.deleteUserDescriptionPrefix") + deleteTarget?.name + t("users.deleteUserDescriptionSuffix")}
        level="danger"
        onConfirm={() => {
          if (deleteTarget) {
            deleteUser(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
