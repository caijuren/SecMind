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
import { ConfirmDialog } from "@/components/common/confirm-dialog"

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
  cyan: "bg-cyan-500/10 text-cyan-400",
  amber: "bg-amber-500/10 text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  violet: "bg-violet-500/10 text-violet-400",
}

const MOCK_PERMISSIONS: PermissionItem[] = [
  { id: 1, resource: "alert", action: "read", description: "查看告警列表和详情" },
  { id: 2, resource: "alert", action: "write", description: "创建、编辑、删除告警规则" },
  { id: 3, resource: "alert", action: "execute", description: "执行告警响应操作" },
  { id: 4, resource: "response", action: "read", description: "查看响应记录" },
  { id: 5, resource: "response", action: "write", description: "编辑响应策略" },
  { id: 6, resource: "response", action: "execute", description: "执行响应动作" },
  { id: 7, resource: "response", action: "approve", description: "审批响应操作" },
  { id: 8, resource: "hunting", action: "read", description: "查看威胁狩猎结果" },
  { id: 9, resource: "hunting", action: "execute", description: "执行威胁狩猎任务" },
  { id: 10, resource: "investigate", action: "read", description: "查看安全调查" },
  { id: 11, resource: "investigate", action: "write", description: "编辑安全调查" },
  { id: 12, resource: "dashboard", action: "read", description: "查看仪表盘" },
  { id: 13, resource: "report", action: "read", description: "查看报表" },
  { id: 14, resource: "report", action: "write", description: "创建和编辑报表" },
  { id: 15, resource: "playbook", action: "read", description: "查看剧本" },
  { id: 16, resource: "playbook", action: "write", description: "编辑剧本" },
  { id: 17, resource: "playbook", action: "execute", description: "执行剧本" },
  { id: 18, resource: "user", action: "read", description: "查看用户列表" },
  { id: 19, resource: "user", action: "write", description: "管理用户" },
  { id: 20, resource: "system", action: "read", description: "查看系统设置" },
  { id: 21, resource: "system", action: "write", description: "修改系统设置" },
  { id: 22, resource: "integration", action: "read", description: "查看集成配置" },
  { id: 23, resource: "integration", action: "write", description: "管理集成" },
  { id: 24, resource: "*", action: "*", description: "超级管理员权限" },
]

const MOCK_ROLES: RoleItem[] = [
  {
    id: 1,
    name: "super_admin",
    display_name: "超级管理员",
    description: "拥有系统所有权限，可执行任何操作",
    is_system: 1,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    permissions: MOCK_PERMISSIONS,
  },
  {
    id: 2,
    name: "security_analyst",
    display_name: "安全分析师",
    description: "负责安全告警分析、威胁狩猎和事件调查",
    is_system: 1,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    permissions: MOCK_PERMISSIONS.filter(p => ["alert", "response", "hunting", "investigate", "dashboard", "report", "playbook"].includes(p.resource)),
  },
  {
    id: 3,
    name: "soc_operator",
    display_name: "SOC操作员",
    description: "负责日常安全运营，处理告警和响应事件",
    is_system: 0,
    created_at: new Date(Date.now() - 1728000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    permissions: MOCK_PERMISSIONS.filter(p => ["alert", "response", "dashboard", "report"].includes(p.resource)),
  },
  {
    id: 4,
    name: "auditor",
    display_name: "合规审计员",
    description: "负责合规审计和安全报告的查看",
    is_system: 1,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    permissions: MOCK_PERMISSIONS.filter(p => p.action === "read" && ["alert", "response", "investigate", "dashboard", "report", "user", "system"].includes(p.resource)),
  },
  {
    id: 5,
    name: "readonly_viewer",
    display_name: "只读观察者",
    description: "仅可查看仪表盘和告警信息",
    is_system: 1,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    permissions: MOCK_PERMISSIONS.filter(p => p.action === "read" && ["alert", "dashboard"].includes(p.resource)),
  },
]

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
      <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100 sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建角色</DialogTitle>
          <DialogDescription className="text-zinc-500">
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
            <div className="max-h-48 overflow-y-auto rounded-lg border border-white/[0.06] p-3 space-y-3">
              {Array.from(grouped.entries()).map(([resource, perms]) => (
                <div key={resource}>
                  <p className={`text-xs font-medium text-zinc-500 mb-1.5`}>
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
                            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                            : "border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-white/[0.1]"
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
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
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
  const { t } = useLocaleStore()
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
      <DialogContent className="border-white/[0.06] bg-[#131316] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rbac.assignRole")}</DialogTitle>
          <DialogDescription className="text-zinc-500">
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
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      : "border-white/[0.06] bg-white/[0.03] text-zinc-300 hover:border-white/[0.1]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5" />
                    <span className="font-medium">{role.display_name}</span>
                    {role.is_system === 1 && (
                      <Badge variant="outline" className="border-amber-500/25 bg-amber-500/10 text-amber-400 text-[10px] px-1">
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
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="size-4" />
                分配成功
              </div>
              <p className={`text-xs text-emerald-400`}>
                角色: {result.roles.join(", ") || "无"}
              </p>
              <p className={`text-xs text-emerald-400`}>
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
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
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
            <p className={String(TYPOGRAPHY.caption) + " text-zinc-500 mt-0.5"}>
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
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all shrink-0"
          >
            {loading ? "查询中…" : "查询"}
          </Button>
        </div>
        {error && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-4 text-zinc-500" />
                <span className={`text-sm font-medium text-zinc-300`}>
                  用户 #{result.user_id} 的角色
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.roles.length > 0 ? (
                  result.roles.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="border-cyan-500/25 bg-cyan-500/10 text-cyan-400"
                    >
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className={`text-xs ${subtleTextClass}`}>暂无角色</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="size-4 text-zinc-500" />
                <span className={`text-sm font-medium text-zinc-300`}>
                  权限列表 ({result.permissions.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.permissions.length > 0 ? (
                  result.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant="outline"
                      className="border-white/[0.08] bg-white/[0.03] text-zinc-400 text-[11px]"
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
  const { t } = useLocaleStore()

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{roleId: number, name: string} | null>(null)

  const loadRoles = useCallback(async () => {
    try {
      const res = await api.get("/rbac/roles")
      setRoles(res.data.length > 0 ? res.data : MOCK_ROLES)
    } catch {
      setRoles(MOCK_ROLES)
    }
  }, [])

  const loadPermissions = useCallback(async () => {
    try {
      const res = await api.get("/rbac/permissions")
      setPermissions(res.data.length > 0 ? res.data : MOCK_PERMISSIONS)
    } catch {
      setPermissions(MOCK_PERMISSIONS)
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
        title={t("rbac.title")}
        subtitle={<span>{t("settings.rbacSubtitle")}</span>}
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
              {seeding ? t("common.seeding") : t("rbac.seedBtn")}
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-1 size-4" />
              创建角色
            </Button>
          </div>
        }
      />

      {seedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          <CheckCircle2 className="size-4" />
          {seedMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "角色总数", value: stats.total, icon: Shield, color: "cyan" },
          { label: t("rbac.systemRoles"), value: stats.system, icon: Lock, color: "amber" },
          { label: t("rbac.customRole"), value: stats.custom, icon: Users, color: "emerald" },
          { label: t("rbac.allPermissions"), value: stats.totalPermissions, icon: Key, color: "violet" },
        ].map((item) => (
          <div key={item.label} className={`${softCardClass} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${subtleTextClass}`}>{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{item.value}</p>
              </div>
              <span
                className={`rounded-lg ${rbacColorMap[item.color] ?? "bg-white/[0.03] text-zinc-300"} p-2`}
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
            {t("rbac.roles")}
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="size-3.5 mr-1" />
            {t("rbac.permissions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4 space-y-4">
          <div className={`${softCardClass} flex items-center gap-3 p-4`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("rbac.searchRoles")}
                className={`pl-9 ${inputClass}`}
              />
            </div>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setAssignDialogOpen(true)}
            >
              <UserCog className="size-3.5" />
              {t("rbac.assignRole")}
            </Button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-zinc-500">加载中…</div>
          ) : filteredRoles.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
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
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                      onClick={() =>
                        setExpandedRoleId(expandedRoleId === role.id ? null : role.id)
                      }
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Shield className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold text-zinc-100`}>
                            {role.display_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-white/[0.08] bg-white/[0.03] text-zinc-500 text-[11px]"
                          >
                            {role.name}
                          </Badge>
                          {role.is_system === 1 && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/25 bg-amber-500/10 text-amber-400 text-[11px]"
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
                          <p className="text-sm font-semibold tabular-nums text-zinc-100">
                            {role.permissions?.length || 0}
                          </p>
                        </div>
                        {expandedRoleId === role.id ? (
                          <ChevronDown className="size-4 text-zinc-500" />
                        ) : (
                          <ChevronRight className="size-4 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {expandedRoleId === role.id && (
                      <div className="border-t border-white/[0.04] px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-xs font-medium text-zinc-500`}>
                            角色权限列表
                          </p>
                          {role.is_system === 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/25 text-red-400 hover:bg-red-500/10"
                              onClick={() => setDeleteTarget({roleId: role.id, name: role.display_name})}
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
                                className="border-cyan-500/25 bg-cyan-500/10 text-cyan-400 text-[11px]"
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
            <div className="p-10 text-center text-zinc-500">加载中…</div>
          ) : permissions.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              暂无权限数据，请先点击「初始化权限」
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(groupedPermissions.entries()).map(([resource, perms]) => (
                <Card key={resource} className={pageCardClass}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-zinc-400">
                        <Lock className="size-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold text-zinc-100`}>
                          {resourceLabelMap[resource] || resource}
                        </p>
                        <p className={`text-xs ${subtleTextClass}`}>
                          {resource} · {perms.length} 项操作
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white/[0.03]">
                          <tr className="border-b border-white/[0.06]">
                            <th scope="col" className="px-5 py-2.5 text-left text-xs text-zinc-500">
                              操作
                            </th>
                            <th scope="col" className="px-5 py-2.5 text-left text-xs text-zinc-500">
                              权限代码
                            </th>
                            <th scope="col" className="px-5 py-2.5 text-left text-xs text-zinc-500">
                              说明
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {perms.map((p) => (
                            <tr
                              key={p.id}
                              className="border-b border-white/[0.04] last:border-b-0"
                            >
                              <td className="px-5 py-2.5">
                                <Badge
                                  variant="outline"
                                  className="border-white/[0.08] bg-white/[0.03] text-zinc-300"
                                >
                                  {actionLabelMap[p.action] || p.action}
                                </Badge>
                              </td>
                              <td className="px-5 py-2.5">
                                <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-cyan-400 font-mono">
                                  {p.resource}:{p.action}
                                </code>
                              </td>
                              <td className={`px-5 py-2.5 text-zinc-500`}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="删除角色"
        description={`确定要删除角色 ${deleteTarget?.name} 吗？此操作不可撤销。`}
        level="critical"
        onConfirm={() => {
          if (deleteTarget) {
            handleDeleteRole(deleteTarget.roleId)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
