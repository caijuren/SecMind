'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Shield,
  Database,
  Brain,
  FileText,
  Users,
  Globe,
  Server,
  Wifi,
  Lock,
  Eye,
  Activity,
  UserPlus,
  Mail,
  ArrowRight,
  SkipForward,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/toast'

const ONBOARDING_KEY = 'secmind-onboarding-wizard-completed'

interface IntegrationItem {
  id: string
  name: string
  icon: React.ElementType
  description: string
  color: string
}

const availableIntegrations: IntegrationItem[] = [
  { id: 'siem', name: 'SIEM 平台', icon: Database, description: '接入 Splunk、Elastic、QRadar 等 SIEM 平台', color: '#3b82f6' },
  { id: 'edr', name: 'EDR 终端', icon: Shield, description: '接入 CrowdStrike、SentinelOne 等 EDR', color: '#ef4444' },
  { id: 'firewall', name: '防火墙', icon: Lock, description: '接入 Palo Alto、Fortinet 等防火墙日志', color: '#f97316' },
  { id: 'vpn', name: 'VPN 网关', icon: Wifi, description: '接入 VPN 访问日志和认证记录', color: '#22c55e' },
  { id: 'email', name: '邮件网关', icon: Mail, description: '接入 M365、Exchange 邮件安全日志', color: '#8b5cf6' },
  { id: 'waf', name: 'WAF', icon: Globe, description: '接入 Cloudflare、AWS WAF 等', color: '#eab308' },
  { id: 'ad', name: 'AD 域控', icon: Server, description: '接入 Active Directory 安全事件', color: '#06b6d4' },
  { id: 'dlp', name: 'DLP 系统', icon: Eye, description: '接入数据防泄漏系统告警', color: '#ec4899' },
]

interface WizardStep {
  id: number
  title: string
  subtitle: string
  icon: React.ElementType
}

const steps: WizardStep[] = [
  { id: 1, title: '欢迎', subtitle: '基本信息设置', icon: Sparkles },
  { id: 2, title: '连接数据源', subtitle: '接入安全数据', icon: Database },
  { id: 3, title: 'AI 调查演示', subtitle: '体验自主研判', icon: Brain },
  { id: 4, title: '查看报告', subtitle: '了解分析结果', icon: FileText },
  { id: 5, title: '邀请团队', subtitle: '协作安全运营', icon: Users },
]

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [companyName, setCompanyName] = useState(() => user?.name || '')
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoComplete, setDemoComplete] = useState(false)
  const [teamEmails, setTeamEmails] = useState('')
  const [invited, setInvited] = useState(false)

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    onComplete()
  }

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      localStorage.setItem(ONBOARDING_KEY, '1')
      toast('新手引导完成！', 'success')
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const toggleIntegration = (id: string) => {
    setSelectedIntegrations((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const runDemo = () => {
    setDemoRunning(true)
    setTimeout(() => {
      setDemoRunning(false)
      setDemoComplete(true)
      toast('AI 调查演示完成！', 'success')
    }, 3000)
  }

  const handleInvite = () => {
    setInvited(true)
    toast('邀请已发送！', 'success')
  }

  const isLast = currentStep === steps.length - 1
  const step = steps[currentStep]
  const StepIcon = step.icon

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return companyName.trim().length > 0
      case 1: return selectedIntegrations.length > 0
      case 2: return demoComplete
      case 3: return true
      case 4: return invited || teamEmails.trim().length > 0
      default: return true
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/[0.06] bg-[#18181b] shadow-2xl shadow-black/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500">
              <Shield className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">新手引导</h2>
              <p className="text-xs text-zinc-500">步骤 {currentStep + 1} / {steps.length}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            跳过全部
            <SkipForward className="size-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-4">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  idx <= currentStep ? 'bg-cyan-400' : 'bg-white/[0.06]'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <StepIcon className="size-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">{step.title}</h3>
              <p className="text-sm text-zinc-500">{step.subtitle}</p>
            </div>
          </div>

          <div className="min-h-[200px]">
            {currentStep === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  欢迎使用 SecMind！AI 自主安全研判平台将帮助您自动完成安全调查、攻击关联、风险推理与处置建议。
                </p>
                <div className="space-y-1.5">
                  <Label className="text-sm text-zinc-400">您的姓名 / 团队名称</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="请输入您的姓名或团队名称"
                    className="h-11 border-white/[0.06] bg-white/[0.03] text-zinc-100 placeholder:text-zinc-500 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  />
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                  <p className="text-xs text-cyan-300 leading-relaxed">
                    您的 14 天专业版免费试用已开启，所有功能均可使用
                  </p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  选择您需要接入的安全数据源，AI 将自动聚合和分析来自这些系统的安全信号。
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableIntegrations.map((integration) => {
                    const Icon = integration.icon
                    const isSelected = selectedIntegrations.includes(integration.id)
                    return (
                      <div
                        key={integration.id}
                        onClick={() => toggleIntegration(integration.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                            : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.08]'
                        }`}
                      >
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${integration.color}15` }}
                        >
                          <Icon className="size-4" style={{ color: integration.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-100">{integration.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{integration.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="size-4 text-cyan-500 shrink-0 mt-1" />
                        )}
                      </div>
                    )
                  })}
                </div>
                {selectedIntegrations.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    已选择 {selectedIntegrations.length} 个数据源
                  </p>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  观看 AI 如何自动完成一次完整的安全调查：从告警接收、信号聚合、攻击链构建到结论生成。
                </p>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-zinc-100">演示场景：钓鱼邮件攻击调查</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      <span className="text-zinc-400">步骤 1: 接收邮件网关告警</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      <span className="text-zinc-400">步骤 2: AI 提取 IOC 并查询威胁情报</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {demoRunning ? (
                        <>
                          <div className="size-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                          <span className="text-amber-400">步骤 3: AI 构建攻击链...</span>
                        </>
                      ) : demoComplete ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          <span className="text-zinc-400">步骤 3: AI 构建攻击链 - 完成</span>
                        </>
                      ) : (
                        <>
                          <div className="size-3 rounded-full bg-zinc-600" />
                          <span className="text-zinc-500">步骤 3: AI 构建攻击链</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {demoComplete ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          <span className="text-zinc-400">步骤 4: 生成结论报告</span>
                        </>
                      ) : (
                        <>
                          <div className="size-3 rounded-full bg-zinc-600" />
                          <span className="text-zinc-500">步骤 4: 生成结论报告</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!demoComplete && (
                  <Button
                    onClick={runDemo}
                    disabled={demoRunning}
                    className="w-full rounded-xl bg-cyan-600 text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)]"
                  >
                    {demoRunning ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                        AI 正在调查中...
                      </>
                    ) : (
                      <>
                        运行 AI 调查演示
                        <ArrowRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}

                {demoComplete && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs text-emerald-300 leading-relaxed">
                      AI 调查完成！检测到 3 个恶意 IOC，识别为 APT-41 关联攻击，可信度 96.8%
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  AI 完成调查后会自动生成详细报告，包含攻击画像、推理过程、处置建议。
                </p>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-100">报告预览</span>
                    <span className="text-xs text-zinc-500">2026-05-16 14:35</span>
                  </div>
                  <div className="h-px bg-white/[0.04]" />
                  <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-red-400" />
                        <span className="text-zinc-300">威胁等级：<strong className="text-red-400">严重</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="size-4 text-cyan-400" />
                        <span className="text-zinc-300">AI 可信度：<strong className="text-cyan-400">96.8%</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="size-4 text-orange-400" />
                        <span className="text-zinc-300">攻击类型：<strong>鱼叉式钓鱼攻击</strong></span>
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.04]" />
                    <p className="text-xs text-zinc-500 leading-relaxed">
                    处置建议：立即隔离受影响终端 WIN-DESK-15，重置受影响用户凭证，封禁 IOC 中涉及的 IP 和域名。
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-cyan-500/30 text-cyan-400"
                  onClick={() => router.push('/dashboard')}
                >
                  查看完整报告
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  邀请团队成员加入，共同进行安全运营协作。
                </p>
                <div className="space-y-1.5">
                  <Label className="text-sm text-zinc-400">邀请邮箱（多个用逗号分隔）</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      value={teamEmails}
                      onChange={(e) => setTeamEmails(e.target.value)}
                      placeholder="colleague@company.com, analyst@company.com"
                      className="h-11 border-white/[0.06] bg-white/[0.03] pl-10 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      disabled={invited}
                    />
                  </div>
                </div>
                {!invited ? (
                  <Button
                    onClick={handleInvite}
                    className="w-full rounded-xl bg-cyan-600 text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)]"
                  >
                    <UserPlus className="size-4 mr-1" />
                    发送邀请
                  </Button>
                ) : (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs text-emerald-300 leading-relaxed flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      邀请已发送，团队成员将收到注册邮件
                    </p>
                  </div>
                )}
                <p className="text-xs text-zinc-500">
                  您也可以稍后在团队管理中邀请更多成员
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-700 text-xs"
          >
            跳过
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-slate-600 hover:text-slate-900 gap-1"
              >
                <ChevronLeft className="size-3.5" />
                上一步
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-cyan-600 font-semibold text-white hover:bg-cyan-700 gap-1 rounded-lg"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  完成引导
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}