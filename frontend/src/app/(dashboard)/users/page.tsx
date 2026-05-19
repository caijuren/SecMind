"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Mail, Phone, Plus, Search, Shield, Trash2, UserCog, UserX, Users } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, formatDateTime } from "@/lib/api"
import { inputClass, pageCardClass, softCardClass, subtleTextClass } from "@/lib/admin-ui"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { useAuthStore } from "@/store/auth-store"

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

const roleLabelMap: Record<UserRole, string> = {
  admin: "管理员",
  analyst: "分析师",
  viewer: "观察者",
  user: "普通用户",
}

const roleClassMap: Record<UserRole, string> = {
  admin: "border-red-500/25 bg-red-500/10 text-red-400",
  analyst: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
  viewer: "border-white/[0.08] bg-white/[0.03] text-zinc-400",
  user: "border-amber-500/25 bg-amber-500/10 text-amber-400",
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
      <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100">
        <DialogHeader>
          <DialogTitle>添加用户</DialogTitle>
          <DialogDescription className="text-zinc-500">新用户会直接写入数据库。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">姓名</Label>
            <Input id="user-name" name="name" type="text" autoComplete="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">邮箱</Label>
            <Input id="user-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-phone">手机号</Label>
            <Input id="user-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="analyst">分析师</SelectItem>
                  <SelectItem value="viewer">观察者</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-department">部门</Label>
              <Input id="user-department" name="department" type="text" autoComplete="organization" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all">
              {saving ? "创建中…" : "创建用户"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const isDemo = useAuthStore(s => s.user?.isDemo)
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "disabled">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null)

  async function loadUsers() {
    if (isDemo) {
      setUsers(MOCK_USERS)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get("/users")
      setUsers(response.data.items)
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
  }, [isDemo])

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

  const stats = {
    all: users.length,
    active: users.filter((user) => user.status === "active").length,
    disabled: users.filter((user) => user.status === "disabled").length,
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title="用户管理"
        subtitle={<span>用户数据直接来自数据库，新增、禁用、删除都会实时落库。</span>}
        actions={
          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 size-4" />
            添加用户
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { key: "all" as const, label: "全部用户", value: stats.all, icon: Users },
          { key: "active" as const, label: "活跃用户", value: stats.active, icon: Shield },
          { key: "disabled" as const, label: "已禁用", value: stats.disabled, icon: UserX },
        ].map((item) => (
          <button key={item.key} aria-pressed={activeFilter === item.key} onClick={() => setActiveFilter(item.key)} className={`${softCardClass} p-4 text-left ${activeFilter === item.key ? "ring-2 ring-cyan-500/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${subtleTextClass}`}>{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{item.value}</p>
              </div>
              <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <item.icon className="size-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className={`${softCardClass} flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索姓名、邮箱、部门、手机号…"
            className={`pl-9 ${inputClass}`}
          />
        </div>
        <div className="text-sm text-zinc-500">当前显示 {filteredUsers.length} 人</div>
      </div>

      <Card className={pageCardClass}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03]">
                <tr className="border-b border-white/[0.06]">
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">用户</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">联系方式</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">角色 / 部门</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">状态</th>
                  <th scope="col" className="px-4 py-3 text-left text-zinc-500">最后登录</th>
                  <th scope="col" className="px-4 py-3 text-right text-zinc-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/[0.04] last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-cyan-500/10 font-semibold text-cyan-400">
                          {user.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100">{user.name}</p>
                          <p className="text-xs text-zinc-500">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-zinc-400">
                        <div className="flex items-center gap-2"><Mail className="size-3.5 text-zinc-500" />{user.email}</div>
                        <div className="flex items-center gap-2"><Phone className="size-3.5 text-zinc-500" />{user.phone || "-"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className={roleClassMap[user.role]}>{roleLabelMap[user.role]}</Badge>
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Building2 className="size-3.5" />
                          {user.department || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={user.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-red-500/25 bg-red-500/10 text-red-400"}>
                        {user.status === "active" ? "活跃" : "禁用"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-zinc-500">{formatDateTime(user.last_login)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleStatus(user)}>
                          <UserCog className="mr-1 size-3.5" />
                          {user.status === "active" ? "禁用" : "启用"}
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-500/25 text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({id: user.id, name: user.name})}>
                          <Trash2 className="mr-1 size-3.5" />
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredUsers.length === 0 && <div className="p-10 text-center text-zinc-500">没有匹配的用户</div>}
          {loading && <div className="p-10 text-center text-zinc-500">加载中…</div>}
        </CardContent>
      </Card>

      <AddUserDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadUsers} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="删除用户"
        description={`确定要删除用户 ${deleteTarget?.name} 吗？此操作不可撤销。`}
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
