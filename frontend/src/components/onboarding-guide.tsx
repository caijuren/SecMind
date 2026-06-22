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
  Brain,
  Zap,
  Crosshair,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocaleStore } from '@/store/locale-store'

interface OnboardingStep {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  titleKey: string
  descriptionKey: string
  action?: { labelKey: string; href: string }
}

const steps: OnboardingStep[] = [
  {
    icon: Shield,
    iconBg: 'bg-primary/10',
    iconColor: 'text-cyan-600',
    titleKey: 'onboarding.guideWelcomeTitle',
    descriptionKey: 'onboarding.guideWelcomeDesc',
  },
  {
    icon: Radio,
    iconBg: 'bg-primary/10',
    iconColor: 'text-cyan-600',
    titleKey: 'onboarding.guideSignalTitle',
    descriptionKey: 'onboarding.guideSignalDesc',
    action: { labelKey: 'onboarding.guideSignalAction', href: '/signals' },
  },
  {
    icon: Crosshair,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    titleKey: 'onboarding.guideInvestigateTitle',
    descriptionKey: 'onboarding.guideInvestigateDesc',
    action: { labelKey: 'onboarding.guideInvestigateAction', href: '/investigate' },
  },
  {
    icon: Inbox,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    titleKey: 'onboarding.guideEvidenceTitle',
    descriptionKey: 'onboarding.guideEvidenceDesc',
    action: { labelKey: 'onboarding.guideEvidenceAction', href: '/investigate' },
  },
  {
    icon: Zap,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    titleKey: 'onboarding.guideResponseTitle',
    descriptionKey: 'onboarding.guideResponseDesc',
    action: { labelKey: 'onboarding.guideResponseAction', href: '/response' },
  },
  {
    icon: Brain,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    titleKey: 'onboarding.guideLearningTitle',
    descriptionKey: 'onboarding.guideLearningDesc',
    action: { labelKey: 'onboarding.guideLearningAction', href: '/learning' },
  },
]

interface OnboardingGuideProps {
  onComplete: () => void
}

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const { t } = useLocaleStore()

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
        <button
          onClick={onComplete}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-muted-foreground"
          aria-label={t('onboarding.closeGuide')}
        >
          <X className="size-5" />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center space-y-5">
            <div className={`flex size-16 items-center justify-center rounded-2xl ${step.iconBg}`}>
              <Icon className={`size-8 ${step.iconColor}`} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{t(step.titleKey)}</h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t(step.descriptionKey)}
              </p>
            </div>

            {step.action && (
              <button
                onClick={handleAction}
                className="inline-flex items-center gap-1 text-sm text-cyan-600/70 transition-colors hover:text-cyan-600"
              >
                {t(step.action.labelKey)}
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-border px-8 py-4">
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
                        : 'w-1.5 bg-muted'
                  }`}
                  {...(idx === currentStep ? { 'aria-current': 'step' as const } : {})}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="gap-1 text-muted-foreground hover:text-muted-foreground"
                >
                  <ChevronLeft className="size-3.5" />
                  {t('onboarding.previous')}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-cyan-600 font-semibold text-foreground hover:bg-cyan-700 gap-1"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    {t('onboarding.startUsing')}
                  </>
                ) : (
                  <>
                    {t('onboarding.next')}
                    <ChevronRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </p>
        </div>
      </div>
    </div>
  )
}
