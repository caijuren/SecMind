"use client"

import { useState, useMemo } from "react"
import {
  Settings,
  Globe,
  Lock,
  Brain,
  Users,
  ShieldCheck,
  CheckCircle2,
  Pencil,
  Cog,
  KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import { useLocaleStore } from "@/store/locale-store"
import { PageHeader } from "@/components/layout/page-header"

const systemCategories = [
  { key: "permissions", label: "权限管理", icon: ShieldCheck, color: "#ef4444", desc: "角色与权限配置" },
  { key: "config", label: "系统配置", icon: Cog, color: "#06b6d4", desc: "通用与安全设置" },
  { key: "license", label: "授权管理", icon: KeyRound, color: "#a855f7", desc: "许可证与版本信息" },
]

const roles = [
  {
    name: "管理员",
    nameKey: "roles.admin",
    count: 2,
    permissions: ["全部功能", "系统配置", "用户管理", "AI引擎配置", "处置审批", "知识管理"],
    color: "#ef4444",
    users: [
      { name: "钱进", email: "qianjin@corp.com", status: "active" },
      { name: "黄强", email: "huangqiang@corp.com", status: "active" },
    ],
  },
  {
    name: "分析师",
    nameKey: "roles.analyst",
    count: 8,
    permissions: ["案件复核", "调查工作台", "AI推理查看", "处置审批", "知识查阅", "报告导出"],
    color: "#06b6d4",
    users: [
      { name: "赵敏", email: "zhaomin@corp.com", status: "active" },
      { name: "卫东", email: "weidong@corp.com", status: "active" },
      { name: "秦明", email: "qinming@corp.com", status: "active" },
      { name: "马骏", email: "majun@corp.com", status: "active" },
      { name: "冯涛", email: "fengtao@corp.com", status: "inactive" },
      { name: "杨帆", email: "yangfan@corp.com", status: "active" },
      { name: "吕峰", email: "lvfeng@corp.com", status: "active" },
      { name: "蒋华", email: "jianghua@corp.com", status: "active" },
    ],
  },
  {
    name: "观察者",
    nameKey: "roles.viewer",
    count: 15,
    permissions: ["只读访问", "查看报告", "查看攻击态势"],
    color: "#64748b",
    users: [
      { name: "张伟", email: "zhangwei@corp.com", status: "active" },
      { name: "李娜", email: "lina@corp.com", status: "active" },
      { name: "王芳", email: "wangfang@corp.com", status: "inactive" },
      { name: "陈刚", email: "chengang@corp.com", status: "active" },
      { name: "刘洋", email: "liuyang@corp.com", status: "active" },
      { name: "孙浩", email: "sunhao@corp.com", status: "active" },
      { name: "周静", email: "zhoujing@corp.com", status: "active" },
      { name: "吴强", email: "wuqiang@corp.com", status: "active" },
      { name: "郑丽", email: "zhengli@corp.com", status: "active" },
      { name: "褚琳", email: "chulin@corp.com", status: "active" },
      { name: "沈雪", email: "shenxue@corp.com", status: "inactive" },
      { name: "韩超", email: "hanchao@corp.com", status: "active" },
      { name: "朱婷", email: "zhuting@corp.com", status: "active" },
      { name: "何欣", email: "hexin@corp.com", status: "active" },
      { name: "许佳", email: "xujia@corp.com", status: "active" },
    ],
  },
]

const allPermissions = [
  "全部功能", "系统配置", "用户管理", "AI引擎配置", "处置审批", "知识管理",
  "案件复核", "调查工作台", "AI推理查看", "知识查阅", "报告导出",
  "只读访问", "查看报告", "查看攻击态势",
]

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-white/80">{label}</p>
        {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        checked ? "bg-cyan-600" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  )
}

function EditPermissionsDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (v: boolean) => void; role: typeof roles[0] | null }) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  useMemo(() => {
    if (role) {
      setSelectedPermissions([...role.permissions])
    }
  }, [role])

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a1628] border-cyan-500/20 text-white shadow-[0_0_40px_rgba(0,212,255,0.12)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${role?.color}15`, border: `1px solid ${role?.color}30` }}>
              <ShieldCheck className="size-4" style={{ color: role?.color }} />
            </div>
            编辑权限 — {role?.name}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            为「{role?.name}」角色分配功能权限
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="flex flex-wrap gap-2">
            {allPermissions.map((perm) => {
              const isSelected = selectedPermissions.includes(perm)
              return (
                <button
                  key={perm}
                  type="button"
                  onClick={() => togglePermission(perm)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    isSelected
                      ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                      : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60"
                  )}
                >
                  {isSelected && <CheckCircle2 className="size-3 mr-1 inline" />}
                  {perm}
                </button>
              )
            })}
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
              保存权限
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PermissionsTab({ t }: { t: (key: string) => string }) {
  const [editRole, setEditRole] = useState<typeof roles[0] | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEdit = (role: typeof roles[0]) => {
    setEditRole(role)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <Card
          key={role.name}
          className="border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-cyan-500/20 transition-colors"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                  style={{
                    backgroundColor: `${role.color}15`,
                    border: `1px solid ${role.color}30`,
                  }}
                >
                  <ShieldCheck className="h-4 w-4" style={{ color: role.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{t(role.nameKey)}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-white/40">{role.count}人</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/[0.04]"
                onClick={() => handleEdit(role)}
              >
                <Pencil className="size-3" />
                编辑权限
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {role.permissions.map((perm) => (
                <Badge
                  key={perm}
                  variant="outline"
                  className="text-[10px] border-white/10 text-white/40"
                >
                  {perm}
                </Badge>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3">
              <div className="flex flex-wrap gap-2">
                {role.users.map((user) => (
                  <span
                    key={user.name}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs border",
                      user.status === "active"
                        ? "text-white/60 bg-white/[0.04] border-white/[0.06]"
                        : "text-white/30 bg-white/[0.02] border-white/[0.04] line-through"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full flex items-center justify-center",
                      user.status === "active" ? "bg-cyan-500/20" : "bg-white/10"
                    )}>
                      <span className={cn(
                        "text-[8px] font-medium",
                        user.status === "active" ? "text-cyan-400" : "text-white/30"
                      )}>{user.name.charAt(0)}</span>
                    </div>
                    {user.name}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <EditPermissionsDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} role={editRole} />
    </div>
  )
}

function SystemConfigTab({ t }: { t: (key: string) => string }) {
  const [general, setGeneral] = useState({
    systemName: "SecMind",
    sessionTimeout: 30,
    ipWhitelist: "",
    logRetention: 90,
  })
  const [security, setSecurity] = useState({
    mfaEnabled: true,
    passwordMinLength: 12,
  })
  const [ai, setAi] = useState({
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 4096,
    ragEnabled: true,
  })

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            {t("settings.generalSettings")}
          </h3>
          <SettingRow label={t("settings.systemName")} desc={t("settings.systemNameDesc")}>
            <Input
              value={general.systemName}
              onChange={(e) => setGeneral({ ...general, systemName: e.target.value })}
              className="w-48 h-8 bg-white/5 border-cyan-500/15 text-white text-sm"
            />
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label={t("settings.sessionTimeout")} desc={t("settings.sessionTimeoutDesc")}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={general.sessionTimeout}
                onChange={(e) => setGeneral({ ...general, sessionTimeout: Number(e.target.value) })}
                className="w-24 h-8 bg-white/5 border-cyan-500/15 text-white text-sm"
              />
              <span className="text-xs text-white/30">min</span>
            </div>
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label={t("settings.ipWhitelist")} desc={t("settings.ipWhitelistDesc")}>
            <Input
              value={general.ipWhitelist}
              onChange={(e) => setGeneral({ ...general, ipWhitelist: e.target.value })}
              placeholder={t("settings.ipWhitelistPlaceholder")}
              className="w-48 h-8 bg-white/5 border-cyan-500/15 text-white text-sm placeholder:text-white/20"
            />
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label="日志保留天数" desc="系统日志保留时间（天）">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={general.logRetention}
                onChange={(e) => setGeneral({ ...general, logRetention: Number(e.target.value) })}
                className="w-24 h-8 bg-white/5 border-cyan-500/15 text-white text-sm"
              />
              <span className="text-xs text-white/30">天</span>
            </div>
          </SettingRow>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            {t("settings.securitySettings")}
          </h3>
          <SettingRow label={t("settings.mfa")} desc={t("settings.mfaDesc")}>
            <Toggle checked={security.mfaEnabled} onChange={(v) => setSecurity({ ...security, mfaEnabled: v })} />
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label={t("settings.passwordMinLength")} desc={t("settings.passwordMinLengthDesc")}>
            <Input
              type="number"
              value={security.passwordMinLength}
              onChange={(e) => setSecurity({ ...security, passwordMinLength: Number(e.target.value) })}
              className="w-24 h-8 bg-white/5 border-cyan-500/15 text-white text-sm"
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-cyan-400" />
            {t("settings.aiEngineConfig")}
          </h3>
          <SettingRow label={t("settings.llmModel")} desc={t("settings.llmModelDesc")}>
            <Select value={ai.model} onValueChange={(v) => setAi({ ...ai, model: v ?? "" })}>
              <SelectTrigger className="w-48 h-8 border-cyan-500/15 bg-white/5 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-white">
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="deepseek-v3">DeepSeek V3</SelectItem>
                <SelectItem value="qwen-max">Qwen Max</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label={t("settings.temperature")} desc={t("settings.temperatureDesc")}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={ai.temperature}
                onChange={(e) => setAi({ ...ai, temperature: Number(e.target.value) })}
                className="w-20 h-8 bg-white/5 border-cyan-500/15 text-white text-sm"
              />
              <span className="text-xs text-white/30">{t("settings.temperatureHint")}</span>
            </div>
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label={t("settings.maxTokens")} desc={t("settings.maxTokensDesc")}>
            <Select value={String(ai.maxTokens)} onValueChange={(v) => setAi({ ...ai, maxTokens: Number(v ?? "4096") })}>
              <SelectTrigger className="w-48 h-8 border-cyan-500/15 bg-white/5 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-white">
                <SelectItem value="2048">2048</SelectItem>
                <SelectItem value="4096">4096</SelectItem>
                <SelectItem value="8192">8192</SelectItem>
                <SelectItem value="16384">16384</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator className="bg-white/5" />
          <SettingRow label={t("settings.ragKnowledge")} desc={t("settings.ragKnowledgeDesc")}>
            <Toggle checked={ai.ragEnabled} onChange={(v) => setAi({ ...ai, ragEnabled: v })} />
          </SettingRow>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-cyan-600 text-white hover:bg-cyan-700">{t("settings.saveSettings")}</Button>
      </div>
    </div>
  )
}

function LicenseTab() {
  const licenseInfo = {
    type: "企业版",
    status: "已激活",
    licensee: "北京安全科技有限公司",
    licenseKey: "SM-ENT-2026-XXXX-XXXX-XXXX",
    expiresAt: "2027-12-31",
    maxUsers: 100,
    currentUsers: 25,
    maxAssets: 500,
    currentAssets: 156,
    modules: ["AI推理引擎", "威胁情报", "自动化编排", "报告中心", "集成市场", "审计日志"],
    version: "1.0.0",
    buildDate: "2026-05-10",
    supportExpiry: "2027-06-30",
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-purple-400" />
            授权信息
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-white/30">授权类型</p>
              <p className="text-sm text-white/80 font-medium">{licenseInfo.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/30">授权状态</p>
              <p className="text-sm text-green-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                {licenseInfo.status}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/30">授权方</p>
              <p className="text-sm text-white/80">{licenseInfo.licensee}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/30">授权密钥</p>
              <p className="text-sm text-white/60 font-mono">{licenseInfo.licenseKey}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/30">到期时间</p>
              <p className="text-sm text-white/80">{licenseInfo.expiresAt}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/30">技术支持到期</p>
              <p className="text-sm text-white/80">{licenseInfo.supportExpiry}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            使用配额
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/40">用户数</span>
                <span className="text-xs text-white/60">{licenseInfo.currentUsers} / {licenseInfo.maxUsers}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500/60" style={{ width: `${(licenseInfo.currentUsers / licenseInfo.maxUsers) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/40">资产数</span>
                <span className="text-xs text-white/60">{licenseInfo.currentAssets} / {licenseInfo.maxAssets}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${(licenseInfo.currentAssets / licenseInfo.maxAssets) * 100}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-cyan-400" />
            已授权模块
          </h3>
          <div className="flex flex-wrap gap-2">
            {licenseInfo.modules.map((mod) => (
              <Badge key={mod} variant="outline" className="text-xs border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-300">
                <CheckCircle2 className="size-3 mr-1" />
                {mod}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-cyan-400" />
            版本信息
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-white/30">当前版本</p>
              <p className="text-sm text-white/80 font-mono">v{licenseInfo.version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/30">构建日期</p>
              <p className="text-sm text-white/80">{licenseInfo.buildDate}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/30">检查更新</span>
            <Button variant="outline" size="sm" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
              检查更新
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SystemPage() {
  const { t } = useLocaleStore()
  const [activeTab, setActiveTab] = useState<string | null>("permissions")

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Settings}
        title={t("settings.title")}
      />

      <div className="grid grid-cols-3 gap-4">
        {systemCategories.map((cat) => {
          const Icon = cat.icon
          const isSelected = activeTab === cat.key
          return (
            <div
              key={cat.key}
              className={cn(
                "rounded-xl border p-5 text-center space-y-2 cursor-pointer transition-all",
              )}
              style={{
                borderColor: isSelected ? `${cat.color}60` : `${cat.color}25`,
                backgroundColor: isSelected ? `${cat.color}12` : `${cat.color}08`,
              }}
              onClick={() => setActiveTab(isSelected ? null : cat.key)}
            >
              <div className="flex size-10 mx-auto items-center justify-center rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                <Icon className="size-5" style={{ color: cat.color }} />
              </div>
              <h3 className="text-sm font-medium" style={{ color: `${cat.color}cc` }}>{cat.label}</h3>
              <p className="text-xs text-white/30">{cat.desc}</p>
            </div>
          )
        })}
      </div>

      {activeTab === "permissions" && <PermissionsTab t={t} />}
      {activeTab === "config" && <SystemConfigTab t={t} />}
      {activeTab === "license" && <LicenseTab />}
    </div>
  )
}
