'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Radio,
  Inbox,
  Sparkles,
  Brain,
  Zap,
  Crosshair,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingStep {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
  action?: { label: string; href: string }
}

const steps: OnboardingStep[] = [
  {
    icon: Shield,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    title: '欢迎来到 SecMind',
    description: 'SecMind 是AI自主安全研判平台。AI自动完成安全调查、攻击关联、风险推理与处置建议，您只需监督确认。',
  },
  {
    icon: Radio,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    title: '信号 — AI感知输入层',
    description: '安全设备（防火墙、VPN、EDR等）的信号会实时流入。AI自动去噪、聚合、补全上下文，将原始日志转化为攻击行为。',
    action: { label: '查看实时信号', href: '/signals' },
  },
  {
    icon: Crosshair,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    title: '调查 — AI自主推理',
    description: 'AI自动构建攻击链、关联行为、生成推理过程。您可以查看AI的完整思考链路，理解每一步判断依据。',
    action: { label: '进入调查工作台', href: '/investigate' },
  },
  {
    icon: Inbox,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    title: '案件 — AI结论等您确认',
    description: 'AI完成调查后形成案件，包含攻击研判、可信度、处置建议。您只需确认或驳回，无需手动调查。',
    action: { label: '查看案件', href: '/cases' },
  },
  {
    icon: Zap,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    title: '响应 — AI自动处置',
    description: 'AI根据调查结果自动执行响应动作（如隔离设备、冻结账号），从决策到执行形成闭环。',
    action: { label: '查看响应中心', href: '/response' },
  },
  {
    icon: Brain,
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    title: '学习 — AI持续进化',
    description: '您的每次确认和驳回都会反馈给AI，让它持续学习进化，越来越准确。这是AI认知闭环的关键。',
    action: { label: '查看AI学习', href: '/learning' },
  },
]

interface OnboardingGuideProps {
  onComplete: () => void
}

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const step = steps[currentStep]
  const Icon = step.icon
  const isLast = currentStep === steps.length - 1
  const isFirst = currentStep === 0

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleAction = () => {
    if (step.action) {
      onComplete()
      router.push(step.action.href)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#0a1628] shadow-2xl shadow-cyan-500/10">
        <button
          onClick={onComplete}
          className="absolute right-4 top-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className={`flex size-16 items-center justify-center rounded-2xl ${step.iconBg}`}>
              <Icon className={`size-8 ${step.iconColor}`} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
              <p className="text-sm text-white/40 leading-relaxed max-w-sm">
                {step.description}
              </p>
            </div>

            {step.action && (
              <button
                onClick={handleAction}
                className="text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
              >
                {step.action.label}
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-cyan-400'
                      : idx < currentStep
                        ? 'w-1.5 bg-cyan-400/40'
                        : 'w-1.5 bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="text-white/40 hover:text-white/60 gap-1"
                >
                  <ChevronLeft className="size-3.5" />
                  上一步
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-[#020a1a] hover:brightness-110 gap-1"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    开始使用
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

          <p className="text-[10px] text-white/15 text-center mt-3">
            {currentStep + 1} / {steps.length}
          </p>
        </div>
      </div>
    </div>
  )
}
