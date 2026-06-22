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
import { useLocaleStore } from '@/store/locale-store'

const ONBOARDING_KEY = 'secmind-onboarding-wizard-completed'

interface IntegrationItem {
  id: string
  nameKey: string
  icon: React.ElementType
  descriptionKey: string
  color: string
}

const availableIntegrations: IntegrationItem[] = [
  { id: 'siem', nameKey: 'onboarding.siemPlatform', icon: Database, descriptionKey: 'onboarding.siemPlatformDesc', color: '#3b82f6' },
  { id: 'edr', nameKey: 'onboarding.edrEndpoint', icon: Shield, descriptionKey: 'onboarding.edrEndpointDesc', color: '#ef4444' },
  { id: 'firewall', nameKey: 'onboarding.firewall', icon: Lock, descriptionKey: 'onboarding.firewallDesc', color: '#f97316' },
  { id: 'vpn', nameKey: 'onboarding.vpnGateway', icon: Wifi, descriptionKey: 'onboarding.vpnGatewayDesc', color: '#22c55e' },
  { id: 'email', nameKey: 'onboarding.emailGateway', icon: Mail, descriptionKey: 'onboarding.emailGatewayDesc', color: '#8b5cf6' },
  { id: 'waf', nameKey: 'onboarding.waf', icon: Globe, descriptionKey: 'onboarding.wafDesc', color: '#eab308' },
  { id: 'ad', nameKey: 'onboarding.adDomain', icon: Server, descriptionKey: 'onboarding.adDomainDesc', color: '#06b6d4' },
  { id: 'dlp', nameKey: 'onboarding.dlpSystem', icon: Eye, descriptionKey: 'onboarding.dlpSystemDesc', color: '#ec4899' },
]

interface WizardStep {
  id: number
  titleKey: string
  subtitleKey: string
  icon: React.ElementType
}

const steps: WizardStep[] = [
  { id: 1, titleKey: 'onboarding.stepWelcome', subtitleKey: 'onboarding.stepWelcomeSubtitle', icon: Sparkles },
  { id: 2, titleKey: 'onboarding.stepConnectData', subtitleKey: 'onboarding.stepConnectDataSubtitle', icon: Database },
  { id: 3, titleKey: 'onboarding.stepAiDemo', subtitleKey: 'onboarding.stepAiDemoSubtitle', icon: Brain },
  { id: 4, titleKey: 'onboarding.stepViewReport', subtitleKey: 'onboarding.stepViewReportSubtitle', icon: FileText },
  { id: 5, titleKey: 'onboarding.stepInviteTeam', subtitleKey: 'onboarding.stepInviteTeamSubtitle', icon: Users },
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
  const { t } = useLocaleStore()
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
      toast(t('onboarding.onboardingComplete'), 'success')
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
      toast(t('onboarding.aiDemoComplete'), 'success')
    }, 3000)
  }

  const handleInvite = () => {
    setInvited(true)
    toast(t('onboarding.inviteSent'), 'success')
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
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-border bg-card shadow-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500">
              <Shield className="size-4 text-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('onboarding.onboardingGuide')}</h2>
              <p className="text-xs text-muted-foreground">{t('onboarding.stepProgress')} {currentStep + 1} / {steps.length}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            {t('onboarding.skipAll')}
            <SkipForward className="size-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-4">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  idx <= currentStep ? 'bg-cyan-400' : 'bg-muted/50'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-cyan-500/30">
              <StepIcon className="size-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t(step.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(step.subtitleKey)}</p>
            </div>
          </div>

          <div className="min-h-[200px]">
            {currentStep === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('onboarding.welcomeTitle')} {t('onboarding.welcomeDesc')}
                </p>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t('onboarding.yourNameLabel')}</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={t('onboarding.yourNamePlaceholder')}
                    className="h-11 border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  />
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-primary/10 p-3">
                  <p className="text-xs text-primary leading-relaxed">
                    {t('onboarding.trialActivated')}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('onboarding.selectDataSources')}
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
                            ? 'border-cyan-400 bg-primary/10 ring-1 ring-cyan-500/30'
                            : 'border-border bg-muted/30 hover:border-border'
                        }`}
                      >
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${integration.color}15` }}
                        >
                          <Icon className="size-4" style={{ color: integration.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{t(integration.nameKey)}</p>
                          <p className="text-xs text-muted-foreground truncate">{t(integration.descriptionKey)}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="size-4 text-cyan-500 shrink-0 mt-1" />
                        )}
                      </div>
                    )
                  })}
                </div>
                {selectedIntegrations.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.selectedCountPrefix')} {selectedIntegrations.length} {t('onboarding.selectedCountSuffix')}
                  </p>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('onboarding.aiDemoTitle')}
                </p>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-cyan-600" />
                    <span className="text-sm font-semibold text-foreground">{t('onboarding.demoScenario')}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      <span className="text-muted-foreground">{t('onboarding.demoStep1')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      <span className="text-muted-foreground">{t('onboarding.demoStep2')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {demoRunning ? (
                        <>
                          <div className="size-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                          <span className="text-amber-600">{t('onboarding.demoStep3Running')}</span>
                        </>
                      ) : demoComplete ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span className="text-muted-foreground">{t('onboarding.demoStep3Done')}</span>
                        </>
                      ) : (
                        <>
                          <div className="size-3 rounded-full bg-zinc-600" />
                          <span className="text-muted-foreground">{t('onboarding.demoStep3Default')}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {demoComplete ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span className="text-muted-foreground">{t('onboarding.demoStep4')}</span>
                        </>
                      ) : (
                        <>
                          <div className="size-3 rounded-full bg-zinc-600" />
                          <span className="text-muted-foreground">{t('onboarding.demoStep4Default')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!demoComplete && (
                  <Button
                    onClick={runDemo}
                    disabled={demoRunning}
                    className="w-full rounded-xl bg-cyan-600 text-foreground shadow-[0_10px_26px_rgba(6,182,212,0.30)]"
                  >
                    {demoRunning ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-muted-foreground/60 border-t-foreground animate-spin mr-2" />
                        {t('onboarding.aiInvestigating')}
                      </>
                    ) : (
                      <>
                        {t('onboarding.runAiDemo')}
                        <ArrowRight className="size-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}

                {demoComplete && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs text-emerald-300 leading-relaxed">
                      {t('onboarding.aiInvestigationComplete')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('onboarding.aiReportDesc')}
                </p>
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{t('onboarding.reportPreview')}</span>
                    <span className="text-xs text-muted-foreground">2026-05-16 14:35</span>
                  </div>
                  <div className="h-px bg-muted/50" />
                  <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-red-600" />
                        <span className="text-muted-foreground">{t('onboarding.threatLevel')}：<strong className="text-red-600">{t('onboarding.threatLevelCritical')}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="size-4 text-cyan-600" />
                        <span className="text-muted-foreground">{t('onboarding.aiConfidence')}：<strong className="text-cyan-600">96.8%</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="size-4 text-orange-600" />
                        <span className="text-muted-foreground">{t('onboarding.attackType')}：<strong>{t('onboarding.spearPhishing')}</strong></span>
                      </div>
                    </div>
                    <div className="h-px bg-muted/50" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('onboarding.disposalSuggestion')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-cyan-500/30 text-cyan-600"
                  onClick={() => router.push('/dashboard')}
                >
                  {t('onboarding.viewFullReport')}
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('onboarding.inviteTeamDesc')}
                </p>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t('onboarding.inviteEmailLabel')}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={teamEmails}
                      onChange={(e) => setTeamEmails(e.target.value)}
                      placeholder="colleague@company.com, analyst@company.com"
                      className="h-11 border-border bg-muted/30 pl-10 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      disabled={invited}
                    />
                  </div>
                </div>
                {!invited ? (
                  <Button
                    onClick={handleInvite}
                    className="w-full rounded-xl bg-cyan-600 text-foreground shadow-[0_10px_26px_rgba(6,182,212,0.30)]"
                  >
                    <UserPlus className="size-4 mr-1" />
                    {t('onboarding.sendInvite')}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs text-emerald-300 leading-relaxed flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      {t('onboarding.inviteSentDesc')}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.inviteLater')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border/70 bg-muted/30 rounded-b-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-muted-foreground text-xs"
          >
            {t('onboarding.skip')}
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-muted-foreground hover:text-foreground gap-1"
              >
                <ChevronLeft className="size-3.5" />
                {t('onboarding.previous')}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-cyan-600 font-semibold text-foreground hover:bg-cyan-700 gap-1 rounded-lg"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  {t('onboarding.completeGuide')}
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
      </div>
    </div>
  )
}
