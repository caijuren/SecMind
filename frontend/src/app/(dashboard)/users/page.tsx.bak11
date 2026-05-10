"use client"

import { useState, useMemo } from "react"
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Pencil,
  Ban,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2,
  Mail,
  Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Separator } from "@/components/ui/separator"
import { useLocaleStore } from "@/store/locale-store"

type UserRole = "管理员" | "分析师" | "观察者"
type UserStatus = "活跃" | "禁用"

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  department: string
  status: UserStatus
  lastLogin: string
}

interface DepartmentNode {
  name: string
  children?: DepartmentNode[]
}

const departments: DepartmentNode[] = [
  { name: "总裁办" },
  {
    name: "安全运营中心",
    children: [
      { name: "SOC组" },
      { name: "威胁情报组" },
      { name: "应急响应组" },
    ],
  },
  { name: "技术研发部" },
  { name: "运维部" },
]

const allDepartments = [
  "总裁办",
  "安全运营中心",
  "SOC组",
  "威胁情报组",
  "应急响应组",
  "技术研发部",
  "运维部",
]

const mockUsers: UserData[] = [
  { id: "1", name: "钱进", email: "qianjin@corp.com", phone: "13800010001", role: "管理员", department: "总裁办", status: "活跃", lastLogin: "2026-05-10 09:12" },
  { id: "2", name: "黄强", email: "huangqiang@corp.com", phone: "13800010002", role: "管理员", department: "安全运营中心", status: "活跃", lastLogin: "2026-05-10 08:45" },
  { id: "3", name: "赵敏", email: "zhaomin@corp.com", phone: "13800010003", role: "分析师", department: "SOC组", status: "活跃", lastLogin: "2026-05-09 17:30" },
  { id: "4", name: "卫东", email: "weidong@corp.com", phone: "13800010004", role: "分析师", department: "SOC组", status: "活跃", lastLogin: "2026-05-10 07:55" },
  { id: "5", name: "秦明", email: "qinming@corp.com", phone: "13800010005", role: "分析师", department: "威胁情报组", status: "活跃", lastLogin: "2026-05-09 16:20" },
  { id: "6", name: "马骏", email: "majun@corp.com", phone: "13800010006", role: "分析师", department: "应急响应组", status: "活跃", lastLogin: "2026-05-10 10:05" },
  { id: "7", name: "冯涛", email: "fengtao@corp.com", phone: "13800010007", role: "分析师", department: "SOC组", status: "禁用", lastLogin: "2026-04-28 14:33" },
  { id: "8", name: "杨帆", email: "yangfan@corp.com", phone: "13800010008", role: "分析师", department: "威胁情报组", status: "活跃", lastLogin: "2026-05-10 09:40" },
  { id: "9", name: "吕峰", email: "lvfeng@corp.com", phone: "13800010009", role: "观察者", department: "技术研发部", status: "活跃", lastLogin: "2026-05-09 11:15" },
  { id: "10", name: "蒋华", email: "jianghua@corp.com", phone: "13800010010", role: "观察者", department: "技术研发部", status: "活跃", lastLogin: "2026-05-08 16:50" },
  { id: "11", name: "张伟", email: "zhangwei@corp.com", phone: "13800010011", role: "观察者", department: "运维部", status: "活跃", lastLogin: "2026-05-10 08:20" },
  { id: "12", name: "李娜", email: "lina@corp.com", phone: "13800010012", role: "观察者", department: "运维部", status: "活跃", lastLogin: "2026-05-09 13:45" },
  { id: "13", name: "王芳", email: "wangfang@corp.com", phone: "13800010013", role: "观察者", department: "技术研发部", status: "禁用", lastLogin: "2026-04-15 10:00" },
  { id: "14", name: "陈刚", email: "chengang@corp.com", phone: "13800010014", role: "分析师", department: "应急响应组", status: "活跃", lastLogin: "2026-05-10 11:30" },
  { id: "15", name: "刘洋", email: "liuyang@corp.com", phone: "13800010015", role: "观察者", department: "总裁办", status: "活跃", lastLogin: "2026-05-09 09:10" },
  { id: "16", name: "孙浩", email: "sunhao@corp.com", phone: "13800010016", role: "分析师", department: "SOC组", status: "活跃", lastLogin: "2026-05-10 07:30" },
  { id: "17", name: "周静", email: "zhoujing@corp.com", phone: "13800010017", role: "观察者", department: "运维部", status: "活跃", lastLogin: "2026-05-09 15:20" },
  { id: "18", name: "吴强", email: "wuqiang@corp.com", phone: "13800010018", role: "观察者", department: "技术研发部", status: "活跃", lastLogin: "2026-05-08 14:00" },
  { id: "19", name: "郑丽", email: "zhengli@corp.com", phone: "13800010019", role: "分析师", department: "威胁情报组", status: "活跃", lastLogin: "2026-05-10 10:50" },
  { id: "20", name: "韩超", email: "hanchao@corp.com", phone: "13800010020", role: "观察者", department: "运维部", status: "活跃", lastLogin: "2026-05-09 08:40" },
  { id: "21", name: "朱婷", email: "zhuting@corp.com", phone: "13800010021", role: "观察者", department: "技术研发部", status: "活跃", lastLogin: "2026-05-10 12:15" },
  { id: "22", name: "何欣", email: "hexin@corp.com", phone: "13800010022", role: "分析师", department: "应急响应组", status: "活跃", lastLogin: "2026-05-09 17:00" },
  { id: "23", name: "沈雪", email: "shenxue@corp.com", phone: "13800010023", role: "观察者", department: "SOC组", status: "禁用", lastLogin: "2026-03-20 09:30" },
  { id: "24", name: "许佳", email: "xujia@corp.com", phone: "13800010024", role: "观察者", department: "威胁情报组", status: "活跃", lastLogin: "2026-05-10 06:50" },
  { id: "25", name: "褚琳", email: "chulin@corp.com", phone: "13800010025", role: "观察者", department: "总裁办", status: "活跃", lastLogin: "2026-05-09 14:25" },
]

const roleColorMap: Record<UserRole, string> = {
  "管理员": "#ef4444",
  "分析师": "#06b6d4",
  "观察者": "#64748b",
}

const filterCards = [
  { key: "all", label: "全部用户", icon: Users, color: "#06b6d4" },
  { key: "active", label: "活跃用户", icon: UserCheck, color: "#22c55e" },
  { key: "disabled", label: "已禁用", icon: UserX, color: "#ef4444" },
]

function DepartmentTree({
  nodes,
  selected,
  onSelect,
  depth = 0,
}: {
  nodes: DepartmentNode[]
  selected: string | null
  onSelect: (name: string) => void
  depth?: number
}) {
  return (
    <div className={cn(depth > 0 && "ml-4")}>
      {nodes.map((node) => {
        const [expanded, setExpanded] = useState(true)
        const hasChildren = node.children && node.children.length > 0
        const isSelected = selected === node.name
        return (
          <div key={node.name}>
            <div
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-sm transition-all",
                isSelected
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white/80 border border-transparent"
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => onSelect(node.name)}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="flex items-center justify-center size-4 rounded hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(!expanded)
                  }}
                >
                  {expanded ? (
                    <ChevronDown className="size-3.5 text-white/40" />
                  ) : (
                    <ChevronRight className="size-3.5 text-white/40" />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <Building2 className="size-3.5 shrink-0" style={{ color: isSelected ? "#06b6d4" : undefined }} />
              <span className="truncate">{node.name}</span>
            </div>
            {hasChildren && expanded && (
              <DepartmentTree
                nodes={node.children!}
                selected={selected}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function AddUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "分析师" as UserRole,
    department: "SOC组",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a1628] border-cyan-500/20 text-white shadow-[0_0_40px_rgba(0,212,255,0.12)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30">
              <Plus className="size-4 text-cyan-400" />
            </div>
            添加用户
          </DialogTitle>
          <DialogDescription className="text-white/40">
            填写以下信息创建新用户账号
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">姓名</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="请输入姓名"
              className="h-8 bg-white/5 border-cyan-500/15 text-white text-sm placeholder:text-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">邮箱</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="请输入邮箱"
              className="h-8 bg-white/5 border-cyan-500/15 text-white text-sm placeholder:text-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">手机号</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入手机号"
              className="h-8 bg-white/5 border-cyan-500/15 text-white text-sm placeholder:text-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">角色</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: (v ?? "分析师") as UserRole })}
            >
              <SelectTrigger className="w-full h-8 border-cyan-500/15 bg-white/5 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-white">
                <SelectItem value="管理员">管理员</SelectItem>
                <SelectItem value="分析师">分析师</SelectItem>
                <SelectItem value="观察者">观察者</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">部门</Label>
            <Select
              value={form.department}
              onValueChange={(v) => setForm({ ...form, department: v ?? "SOC组" })}
            >
              <SelectTrigger className="w-full h-8 border-cyan-500/15 bg-white/5 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-white">
                {allDepartments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              className="border-white/10 text-white/50 hover:bg-white/[0.04] hover:text-white/70"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              onClick={() => onOpenChange(false)}
            >
              创建用户
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const { t } = useLocaleStore()
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    let result = mockUsers
    if (activeFilter === "active") result = result.filter((u) => u.status === "活跃")
    if (activeFilter === "disabled") result = result.filter((u) => u.status === "禁用")
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      )
    }
    return result
  }, [activeFilter, searchQuery])

  const deptMembers = useMemo(() => {
    if (!selectedDept) return []
    return mockUsers.filter((u) => u.department === selectedDept)
  }, [selectedDept])

  const counts = useMemo(() => ({
    all: mockUsers.length,
    active: mockUsers.filter((u) => u.status === "活跃").length,
    disabled: mockUsers.filter((u) => u.status === "禁用").length,
  }), [])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20"
          style={{
            background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))",
            boxShadow: "0 0 16px rgba(34,211,238,0.15)",
          }}
        >
          <Users className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">用户管理</h1>
          <p className="text-xs text-white/40">组织架构与用户权限管理</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filterCards.map((card) => {
          const Icon = card.icon
          const isActive = activeFilter === card.key
          const count = counts[card.key as keyof typeof counts]
          return (
            <div
              key={card.key}
              className={cn(
                "rounded-xl border p-4 cursor-pointer transition-all",
              )}
              style={{
                borderColor: isActive ? `${card.color}60` : `${card.color}25`,
                backgroundColor: isActive ? `${card.color}12` : `${card.color}08`,
                boxShadow: isActive ? `0 0 20px ${card.color}15` : "none",
              }}
              onClick={() => setActiveFilter(card.key)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <Icon className="size-4.5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-xs text-white/40">{card.label}</p>
                  <p className="text-xl font-bold" style={{ color: card.color }}>{count}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用户姓名、邮箱或部门..."
            className="h-9 border-white/[0.08] bg-white/[0.04] pl-9 text-sm text-slate-300 placeholder:text-white/20 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20"
          />
        </div>
        <Button
          className="bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] gap-1.5"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="size-4" />
          添加用户
        </Button>
      </div>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/30">用户</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/30">邮箱</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/30">角色</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/30">部门</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/30">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/30">最后登录</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-white/30">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleColor = roleColorMap[user.role]
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex size-8 items-center justify-center rounded-full text-xs font-semibold shrink-0"
                            style={{
                              backgroundColor: `${roleColor}20`,
                              color: roleColor,
                              border: `1px solid ${roleColor}30`,
                            }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-white/80 font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/40">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{
                            borderColor: `${roleColor}40`,
                            backgroundColor: `${roleColor}15`,
                            color: roleColor,
                          }}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white/50">{user.department}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{
                            borderColor: user.status === "活跃" ? "#22c55e40" : "#ef444440",
                            backgroundColor: user.status === "活跃" ? "#22c55e15" : "#ef444415",
                            color: user.status === "活跃" ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white/30 text-xs">{user.lastLogin}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-white/30 hover:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Ban className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-white/30 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-sm text-white/30">未找到匹配的用户</div>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-white/[0.06]" />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="size-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white/80">组织架构</h2>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-4 border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="p-3">
              <div className="mb-2 px-2 py-1.5">
                <span className="text-xs font-medium text-white/40">部门列表</span>
              </div>
              <DepartmentTree
                nodes={departments}
                selected={selectedDept}
                onSelect={setSelectedDept}
              />
            </CardContent>
          </Card>

          <Card className="col-span-8 border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <CardContent className="p-4">
              {selectedDept ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/20">
                        <Building2 className="size-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white/80">{selectedDept}</h3>
                        <p className="text-xs text-white/30">{deptMembers.length} 名成员</p>
                      </div>
                    </div>
                  </div>
                  {deptMembers.length > 0 ? (
                    <div className="space-y-2">
                      {deptMembers.map((member) => {
                        const roleColor = roleColorMap[member.role]
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex size-8 items-center justify-center rounded-full text-xs font-semibold shrink-0"
                                style={{
                                  backgroundColor: `${roleColor}20`,
                                  color: roleColor,
                                  border: `1px solid ${roleColor}30`,
                                }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm text-white/80 font-medium">{member.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1 text-xs text-white/30">
                                    <Mail className="size-3" />
                                    {member.email}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-white/30">
                                    <Phone className="size-3" />
                                    {member.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                                style={{
                                  borderColor: `${roleColor}40`,
                                  backgroundColor: `${roleColor}15`,
                                  color: roleColor,
                                }}
                              >
                                {member.role}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                                style={{
                                  borderColor: member.status === "活跃" ? "#22c55e40" : "#ef444440",
                                  backgroundColor: member.status === "活跃" ? "#22c55e15" : "#ef444415",
                                  color: member.status === "活跃" ? "#22c55e" : "#ef4444",
                                }}
                              >
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-white/30">该部门暂无成员</div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-sm text-white/30">请从左侧选择部门查看成员</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  )
}
