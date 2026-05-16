"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Radio,
  Server,
  Users,
  Sparkles,
  Zap,
  Lock,
  Eye,
  Monitor,
  Flame,
  Loader2,
  Mail,
  Plus,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"
import { api } from "@/lib/api"
import { CARD, TYPOGRAPHY, RADIUS } from "@/lib/design-system"
import { inputClass } from "@/lib/admin-ui"

const TENANT_ID = 1

const PLANS = [
  {
    id: "free",
    name: "免费试用",
    price: "免费",
    period: "14天",
    description: "体验核心功能，快速上手",
    features: ["5个用户", "100条告警/天", "基础AI分析", "社区支持"],
    icon: Sparkles,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    borderColor: "border-slate-200",
    selectedBorder: "border-cyan-400",
    selectedBg: "bg-cyan-50/50",
  },
  {
    id: "professional",
    name: "专业版",
    price: "¥2,999",
    period: "/月",
    description: "团队安全运营的最佳选择",
    features: ["20个用户", "无限告警", "高级AI分析", "处置自动化", "7x12技术支持"],
    icon: Zap,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-700",
    borderColor: "border-slate-200",
    selectedBorder: "border-cyan-400",
    selectedBg: "bg-cyan-50/50",
    recommended: true,
  },
  {
    id: "enterprise",
    name: "企业版",
    price: "¥9,999",
    period: "/月",
    description: "大规模安全运营的完整方案",
    features: ["无限用户", "无限告警", "全部功能", "专属支持", "私有化部署", "定制AI模型"],
    icon: Lock,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    borderColor: "border-slate-200",
    selectedBorder: "border-cyan-400",
    selectedBg: "bg-cyan-50/50",
  },
]

const SECURITY_SOURCES = [
  { id: "siem", name: "SIEM", description: "安全信息与事件管理", icon: Monitor },
  { id: "edr", name: "EDR", description: "终端检测与响应", icon: Shield },
  { id: "firewall", name: "防火墙", description: "网络流量过滤与控制", icon: Flame },
  { id: "waf", name: "WAF", description: "Web应用防火墙", icon: Lock },
  { id: "ids", name: "IDS/IPS", description: "入侵检测与防御", icon: Eye },
  { id: "proxy", name: "代理网关", description: "网络代理与流量分析", icon: Server },
]

const STEPS = [
  { key: "plan", label: "选择套餐", icon: Sparkles },
  { key: "sources", label: "配置安全源", icon: Radio },
  { key: "team", label: "邀请团队", icon: Users },
  { key: "done", label: "完成", icon: CheckCircle2 },
]

export default function OnboardingPage() {
  useLocaleStore()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState("free")
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [inviteEmails, setInviteEmails] = useState<string[]>([])
  const [inviteInput, setInviteInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function addInviteEmail() {
    const trimmed = inviteInput.trim()
    if (trimmed && !inviteEmails.includes(trimmed) && trimmed.includes("@")) {
      setInviteEmails((prev) => [...prev, trimmed])
      setInviteInput("")
    }
  }

  function removeInviteEmail(email: string) {
    setInviteEmails((prev) => prev.filter((e) => e !== email))
  }

  async function handleComplete() {
    setSubmitting(true)
    try {
      if (selectedPlan !== "free") {
        await api.post(`/billing/tenants/${TENANT_ID}/orders`, {
          plan: selectedPlan,
          payment_method: "alipay",
        })
      }
      localStorage.setItem("secmind-onboarded", "1")
      router.push("/dashboard")
    } catch {
      localStorage.setItem("secmind-onboarded", "1")
      router.push("/dashboard")
    } finally {
      setSubmitting(false)
    }
  }

  function handleNext() {
    if (isLast) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handlePrev() {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        icon={Shield}
        title="初始配置"
        subtitle="完成以下步骤，开始使用 SecMind"
      />

      <div className="flex items-center gap-2 px-1">
        {STEPS.map((s, idx) => {
          const StepIcon = s.icon
          const isActive = idx === currentStep
          const isCompleted = idx < currentStep
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isActive
                    ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/60"
                    : isCompleted
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-500"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <StepIcon className="size-4" />
                )}
                <span className={cn(TYPOGRAPHY.caption, "font-medium hidden sm:inline")}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 min-w-4",
                    isCompleted ? "bg-emerald-300" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {currentStep === 0 && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className={`flex size-14 items-center justify-center ${RADIUS.xl} bg-cyan-50 ring-1 ring-cyan-200/50 mx-auto mb-4`}>
              <Sparkles className="size-7 text-cyan-700" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h1, "text-slate-900")}>欢迎来到 SecMind</h2>
            <p className={cn(TYPOGRAPHY.body, "text-slate-500 mt-2")}>
              选择适合您团队的方案，所有付费方案均提供14天免费试用
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const PlanIcon = plan.icon
              const isSelected = selectedPlan === plan.id
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "cursor-pointer transition-all hover:-translate-y-0.5 relative",
                    isSelected
                      ? `${plan.selectedBorder} ${plan.selectedBg} ring-1 shadow-md`
                      : `${plan.borderColor} bg-white shadow-sm hover:shadow-md`
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.recommended && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0 px-2 py-0 text-[10px] font-semibold shadow-sm">
                        推荐
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex size-9 items-center justify-center ${RADIUS.md} ${plan.iconBg}`}>
                        <PlanIcon className={`size-4.5 ${plan.iconColor}`} />
                      </div>
                      <div>
                        <h3 className={cn(TYPOGRAPHY.h3, "text-slate-900")}>{plan.name}</h3>
                        <p className={cn(TYPOGRAPHY.micro, "text-slate-500")}>{plan.description}</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className={cn(TYPOGRAPHY.h1, "font-bold", isSelected ? "text-cyan-700" : "text-slate-900")}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={cn(TYPOGRAPHY.caption, "text-slate-500")}>{plan.period}</span>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className={cn("size-3.5 shrink-0", isSelected ? "text-cyan-500" : "text-slate-500")} />
                          <span className={cn(TYPOGRAPHY.caption, "text-slate-600")}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-cyan-200/60">
                        <div className="flex items-center justify-center gap-1.5 text-cyan-700">
                          <CheckCircle2 className="size-3.5" />
                          <span className={cn(TYPOGRAPHY.caption, "font-medium")}>已选择</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className={`flex size-14 items-center justify-center ${RADIUS.xl} bg-cyan-50 ring-1 ring-cyan-200/50 mx-auto mb-4`}>
              <Radio className="size-7 text-cyan-700" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h1, "text-slate-900")}>配置安全源</h2>
            <p className={cn(TYPOGRAPHY.body, "text-slate-500 mt-2")}>
              选择您当前使用的安全设备和系统，SecMind 将自动接入数据
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_SOURCES.map((source) => {
              const SourceIcon = source.icon
              const isSelected = selectedSources.includes(source.id)
              return (
                <Card
                  key={source.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected
                      ? "border-cyan-400 bg-cyan-50/50 ring-1 ring-cyan-200/60 shadow-sm"
                      : "border-slate-200 bg-white hover:shadow-sm"
                  )}
                  onClick={() => toggleSource(source.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      isSelected ? "bg-cyan-100" : "bg-slate-50"
                    )}>
                      <SourceIcon className={cn("size-5", isSelected ? "text-cyan-700" : "text-slate-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(TYPOGRAPHY.h3, "text-slate-900")}>{source.name}</h4>
                      <p className={cn(TYPOGRAPHY.micro, "text-slate-500")}>{source.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-5 text-cyan-500 shrink-0" />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedSources.length > 0 && (
            <p className={cn(TYPOGRAPHY.caption, "text-slate-500 text-center")}>
              已选择 {selectedSources.length} 个安全源，可在后续随时调整
            </p>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className={`flex size-14 items-center justify-center ${RADIUS.xl} bg-cyan-50 ring-1 ring-cyan-200/50 mx-auto mb-4`}>
              <Users className="size-7 text-cyan-700" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h1, "text-slate-900")}>邀请团队成员</h2>
            <p className={cn(TYPOGRAPHY.body, "text-slate-500 mt-2")}>
              邀请同事加入您的安全团队，协作更高效
            </p>
          </div>

          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <Input
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addInviteEmail()
                        }
                      }}
                      placeholder="输入邮箱地址，按回车添加"
                      className={`pl-9 ${inputClass}`}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={addInviteEmail}
                    disabled={!inviteInput.trim() || !inviteInput.includes("@")}
                    className="gap-1 border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                  >
                    <Plus className="size-3.5" />
                    添加
                  </Button>
                </div>

                {inviteEmails.length > 0 && (
                  <div className="space-y-2">
                    <Label className={cn(TYPOGRAPHY.caption, "text-slate-500")}>
                      已添加 {inviteEmails.length} 位成员
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {inviteEmails.map((email) => (
                        <Badge
                          key={email}
                          variant="outline"
                          className="border-cyan-200 bg-cyan-50 text-cyan-700 gap-1 py-1 px-2.5"
                        >
                          {email}
                          <button onClick={() => removeInviteEmail(email)} className="hover:text-red-500 transition-colors">
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {inviteEmails.length === 0 && (
                  <p className={cn(TYPOGRAPHY.caption, "text-slate-500 text-center py-4")}>
                    可以跳过此步骤，稍后在团队管理中邀请
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/50 mx-auto mb-4">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h2 className={cn(TYPOGRAPHY.h1, "text-slate-900")}>配置完成</h2>
            <p className={cn(TYPOGRAPHY.body, "text-slate-500 mt-2 max-w-md mx-auto")}>
              您已完成初始配置，SecMind 已准备就绪
            </p>
          </div>

          <Card className={CARD.elevated}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>选择套餐</span>
                  <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                    {PLANS.find((p) => p.id === selectedPlan)?.name ?? selectedPlan}
                  </Badge>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between py-2">
                  <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>安全源</span>
                  <span className={cn(TYPOGRAPHY.body, "text-slate-900 font-medium")}>
                    {selectedSources.length > 0
                      ? `${selectedSources.length} 个已选择`
                      : "暂未配置"}
                  </span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between py-2">
                  <span className={cn(TYPOGRAPHY.body, "text-slate-600")}>团队成员</span>
                  <span className={cn(TYPOGRAPHY.body, "text-slate-900 font-medium")}>
                    {inviteEmails.length > 0
                      ? `${inviteEmails.length} 人已邀请`
                      : "暂未邀请"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
        {!isFirst ? (
          <Button
            variant="ghost"
            onClick={handlePrev}
            className="text-slate-500 hover:text-slate-700 gap-1"
          >
            <ChevronLeft className="size-4" />
            上一步
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <span className={cn(TYPOGRAPHY.micro, "text-slate-500")}>
            {currentStep + 1} / {STEPS.length}
          </span>
          <Button
            onClick={handleNext}
            disabled={submitting}
            className="bg-cyan-600 text-white hover:bg-cyan-700 gap-1"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                提交中...
              </>
            ) : isLast ? (
              <>
                <CheckCircle2 className="size-4" />
                开始使用
              </>
            ) : (
              <>
                下一步
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
