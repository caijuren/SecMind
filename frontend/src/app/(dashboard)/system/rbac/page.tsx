"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCog,
  Users,
  Zap,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { inputClass, pageCardClass, softCardClass, subtleTextClass } from "@/lib/admin-ui"
import { CARD, RADIUS, TYPOGRAPHY } from "@/lib/design-system"
import { useLocaleStore } from "@/store/locale-store"

interface PermissionItem {
  id: number
  resource: string
  action: string
  description: string | null
}

interface RoleItem {
  id: number
  name: string
  display_name: string
  description: string | null
  is_system: number
  created_at: string | null
  updated_at: string | null
  permissions: PermissionItem[]
}

interface UserPermissionsResult {
  user_id: number
  roles: string[]
  permissions: string[]
}

const resourceLabelMap: Record<string, string> = {
  alert: "告警管理",
  response: "响应处置",
  hunting: "威胁狩猎",
  investigate: "安全调查",
  dashboard: "仪表盘",
  report: "报表分析",
  playbook: "剧本管理",
  user: "用户管理",
  system: "系统设置",
  integration: "集成管理",
  contact: "联系表单",
  "*": "超级权限",
}

const actionLabelMap: Record<string, string> = {
  read: "查看",
  write: "编辑",
  execute: "执行",
  approve: "审批",
  cancel: "取消",
  "*": "全部",
}

const rbacColorMap: Record<string, string> = {
  cyan: "bg-cyan-50 text-cyan-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
}

function CreateRoleDialog({
  open,
  onOpenChange,
  permissions,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissions: PermissionItem[]
  onCreated: () => Promise<void>
}) {
  const [form, setForm] = useState({ name: "", display_name: "", description: "" })
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!form.name || !form.display_name) return
    setSaving(true)
    try {
      await api.post("/rbac/roles", {
        name: form.name,
        display_name: form.display_name,
        description: form.description || null,
        permission_ids: selectedPermIds,
      })
      onOpenChange(false)
      setForm({ name: "", display_name: "", description: "" })
      setSelectedPermIds([])
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(id: number) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>()
    for (const p of permissions) {
      const list = map.get(p.resource) || []
      list.push(p)
      map.set(p.resource, list)
    }
    return map
  }, [permissions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建角色</DialogTitle>
          <DialogDescription className="text-slate-500">
            创建自定义角色并分配权限，非系统角色可随时编辑和删除。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">角色标识</Label>
            <Input
              id="role-name"
              name="name"
              autoComplete="off"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="如: soc_operator"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-display-name">显示名称</Label>
            <Input
              id="role-display-name"
              name="display_name"
              autoComplete="off"
              value={form.display_name}
              onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
              placeholder="如: SOC操作员"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">描述</Label>
            <Input
              id="role-description"
              name="description"
              autoComplete="off"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="角色描述（可选）"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>选择权限</Label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-3">
              {Array.from(grouped.entries()).map(([resource, perms]) => (
                <div key={resource}>
                  <p className={`text-xs font-medium text-slate-500 mb-1.5`}>
                    {resourceLabelMap[resource] || resource}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={selectedPermIds.includes(p.id)}
                        onClick={() => togglePermission(p.id)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors ${
                          selectedPermIds.includes(p.id)
                            ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {p.action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-xs ${subtleTextClass}`}>
              已选择 {selectedPermIds.length} 项权限
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {saving ? "创建中…" : "创建角色"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AssignRoleDialog({
  open,
  onOpenChange,
  roles,
  onAssigned,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleItem[]
  onAssigned: () => void
}) {
  const [userId, setUserId] = useState("")
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<UserPermissionsResult | null>(null)

  async function handleAssign() {
    if (!userId || selectedRoleIds.length === 0) return
    setSaving(true)
    try {
      const res = await api.put(`/rbac/users/${userId}/roles`, {
        role_ids: selectedRoleIds,
      })
      setResult(res.data)
      onAssigned()
    } catch {
      setResult(null)
    } finally {
      setSaving(false)
    }
  }

  function toggleRole(id: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  function handleClose(open: boolean) {
    if (!open) {
      setUserId("")
      setSelectedRoleIds([])
      setResult(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>用户角色分配</DialogTitle>
          <DialogDescription className="text-slate-500">
            为指定用户分配角色，分配后将覆盖该用户的所有角色。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assign-user-id">用户 ID</Label>
            <Input
              id="assign-user-id"
              name="user_id"
              autoComplete="off"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入用户ID"
              type="number"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>选择角色</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  aria-pressed={selectedRoleIds.includes(role.id)}
                  onClick={() => toggleRole(role.id)}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedRoleIds.includes(role.id)
                      ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5" />
                    <span className="font-medium">{role.display_name}</span>
                    {role.is_system === 1 && (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 text-[10px] px-1">
                        系统
                      </Badge>
                    )}
                  </div>
                  <span className={`text-xs ${subtleTextClass}`}>{role.name}</span>
                </button>
              ))}
            </div>
          </div>
          {result && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                分配成功
              </div>
              <p className={`text-xs text-emerald-600`}>
                角色: {result.roles.join(", ") || "无"}
              </p>
              <p className={`text-xs text-emerald-600`}>
                权限数: {result.permissions.length}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              取消
            </Button>
            <Button
              onClick={handleAssign}
              disabled={saving || !userId || selectedRoleIds.length === 0}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {saving ? "分配中…" : "确认分配"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UserPermissionLookup() {
  const [userId, setUserId] = useState("")
  const [result, setResult] = useState<UserPermissionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLookup() {
    if (!userId) return
    setLoading(true)
    setError("")
    try {
      const res = await api.get(`/rbac/users/${userId}/permissions`)
      setResult(res.data)
    } catch {
      setError("查询失败，请检查用户ID是否正确")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={CARD.elevated}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex size-10 items-center justify-center ${RADIUS.lg} bg-primary/10`}>
            <UserCog className="size-5 text-primary" />
          </div>
          <div>
            <h2 className={String(TYPOGRAPHY.h2)}>用户权限查询</h2>
            <p className={String(TYPOGRAPHY.caption) + " text-slate-500 mt-0.5"}>
              输入用户ID查看其角色和权限
            </p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            id="lookup-user-id"
            name="lookup_user_id"
            autoComplete="off"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="输入用户ID"
            type="number"
            className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
          <Button
            onClick={handleLookup}
            disabled={loading || !userId}
            className="bg-cyan-600 text-white hover:bg-cyan-700 shrink-0"
          >
            {loading ? "查询中…" : "查询"}
          </Button>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-4 text-slate-500" />
                <span className={`text-sm font-medium text-slate-700`}>
                  用户 #{result.user_id} 的角色
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.roles.length > 0 ? (
                  result.roles.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="border-cyan-200 bg-cyan-50 text-cyan-700"
                    >
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className={`text-xs ${subtleTextClass}`}>暂无角色</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="size-4 text-slate-500" />
                <span className={`text-sm font-medium text-slate-700`}>
                  权限列表 ({result.permissions.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.permissions.length > 0 ? (
                  result.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600 text-[11px]"
                    >
                      {perm}
                    </Badge>
                  ))
                ) : (
                  <span className={`text-xs ${subtleTextClass}`}>暂无权限</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function RbacPage() {
  useLocaleStore()

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const loadRoles = useCallback(async () => {
    try {
      const res = await api.get("/rbac/roles")
      setRoles(res.data)
    } catch {
      setRoles([])
    }
  }, [])

  const loadPermissions = useCallback(async () => {
    try {
      const res = await api.get("/rbac/permissions")
      setPermissions(res.data)
    } catch {
      setPermissions([])
    }
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([loadRoles(), loadPermissions()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadAll()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSeed() {
    setSeeding(true)
    setSeedMessage("")
    try {
      const res = await api.post("/rbac/seed")
      setSeedMessage(res.data?.message || "初始化完成")
      await loadAll()
    } catch {
      setSeedMessage("初始化失败，请检查后端服务")
    } finally {
      setSeeding(false)
      setTimeout(() => setSeedMessage(""), 3000)
    }
  }

  async function handleDeleteRole(roleId: number) {
    try {
      await api.delete(`/rbac/roles/${roleId}`)
      await loadRoles()
    } catch {
      // ignore
    }
  }

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionItem[]>()
    for (const p of permissions) {
      const list = map.get(p.resource) || []
      list.push(p)
      map.set(p.resource, list)
    }
    return map
  }, [permissions])

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles
    const q = searchQuery.toLowerCase()
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.display_name.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
    )
  }, [roles, searchQuery])

  const stats = useMemo(
    () => ({
      total: roles.length,
      system: roles.filter((r) => r.is_system === 1).length,
      custom: roles.filter((r) => r.is_system === 0).length,
      totalPermissions: permissions.length,
    }),
    [roles, permissions]
  )

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Shield}
        title="权限管理"
        subtitle={<span>基于角色的访问控制（RBAC），管理角色与权限分配</span>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSeed}
              disabled={seeding}
              className="gap-1.5"
            >
              {seeding ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              {seeding ? "初始化中…" : "初始化权限"}
            </Button>
            <Button
              className="bg-cyan-600 text-white hover:bg-cyan-700"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-1 size-4" />
              创建角色
            </Button>
          </div>
        }
      />

      {seedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {seedMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "角色总数", value: stats.total, icon: Shield, color: "cyan" },
          { label: "系统角色", value: stats.system, icon: Lock, color: "amber" },
          { label: "自定义角色", value: stats.custom, icon: Users, color: "emerald" },
          { label: "权限总数", value: stats.totalPermissions, icon: Key, color: "violet" },
        ].map((item) => (
          <div key={item.label} className={`${softCardClass} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${subtleTextClass}`}>{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{item.value}</p>
              </div>
              <span
                className={`rounded-lg ${rbacColorMap[item.color] ?? "bg-slate-50 text-slate-700"} p-2`}
              >
                <item.icon className="size-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="roles">
        <TabsList variant="line">
          <TabsTrigger value="roles">
            <Shield className="size-3.5 mr-1" />
            角色管理
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="size-3.5 mr-1" />
            权限列表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4 space-y-4">
          <div className={`${softCardClass} flex items-center gap-3 p-4`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索角色名称或描述…"
                className={`pl-9 ${inputClass}`}
              />
            </div>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setAssignDialogOpen(true)}
            >
              <UserCog className="size-3.5" />
              用户角色分配
            </Button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">加载中…</div>
          ) : filteredRoles.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              {searchQuery ? "没有匹配的角色" : "暂无角色数据，请先点击「初始化权限」"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRoles.map((role) => (
                <Card key={role.id} className={pageCardClass}>
                  <CardContent className="p-0">
                    <button
                      type="button"
                      aria-expanded={expandedRoleId === role.id}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
                      onClick={() =>
                        setExpandedRoleId(expandedRoleId === role.id ? null : role.id)
                      }
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                        <Shield className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold text-slate-900`}>
                            {role.display_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-slate-500 text-[11px]"
                          >
                            {role.name}
                          </Badge>
                          {role.is_system === 1 && (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-600 text-[11px]"
                            >
                              系统角色
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs ${subtleTextClass} mt-0.5 truncate`}>
                          {role.description || "无描述"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className={`text-xs ${subtleTextClass}`}>权限数</p>
                          <p className="text-sm font-semibold tabular-nums text-slate-900">
                            {role.permissions?.length || 0}
                          </p>
                        </div>
                        {expandedRoleId === role.id ? (
                          <ChevronDown className="size-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="size-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {expandedRoleId === role.id && (
                      <div className="border-t border-slate-100 px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-xs font-medium text-slate-500`}>
                            角色权限列表
                          </p>
                          {role.is_system === 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="mr-1 size-3.5" />
                              删除角色
                            </Button>
                          )}
                        </div>
                        {role.permissions && role.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map((p) => (
                              <Badge
                                key={p.id}
                                variant="outline"
                                className="border-cyan-200 bg-cyan-50 text-cyan-700 text-[11px]"
                              >
                                {p.resource}:{p.action}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-xs ${subtleTextClass}`}>该角色暂无权限</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="mt-4 space-y-4">
          {loading ? (
            <div className="p-10 text-center text-slate-500">加载中…</div>
          ) : permissions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              暂无权限数据，请先点击「初始化权限」
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(groupedPermissions.entries()).map(([resource, perms]) => (
                <Card key={resource} className={pageCardClass}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        <Lock className="size-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold text-slate-900`}>
                          {resourceLabelMap[resource] || resource}
                        </p>
                        <p className={`text-xs ${subtleTextClass}`}>
                          {resource} · {perms.length} 项操作
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr className="border-b border-slate-200">
                            <th scope="col" className="px-5 py-2.5 text-left text-xs text-slate-500">
                              操作
                            </th>
                            <th scope="col" className="px-5 py-2.5 text-left text-xs text-slate-500">
                              权限代码
                            </th>
                            <th scope="col" className="px-5 py-2.5 text-left text-xs text-slate-500">
                              说明
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {perms.map((p) => (
                            <tr
                              key={p.id}
                              className="border-b border-slate-100 last:border-b-0"
                            >
                              <td className="px-5 py-2.5">
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-white text-slate-700"
                                >
                                  {actionLabelMap[p.action] || p.action}
                                </Badge>
                              </td>
                              <td className="px-5 py-2.5">
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-cyan-700 font-mono">
                                  {p.resource}:{p.action}
                                </code>
                              </td>
                              <td className={`px-5 py-2.5 text-slate-500`}>
                                {p.description || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UserPermissionLookup />

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        permissions={permissions}
        onCreated={loadRoles}
      />

      <AssignRoleDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        roles={roles}
        onAssigned={() => {}}
      />
    </div>
  )
}
