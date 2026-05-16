'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Building2, Phone, ShieldCheck, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/toast'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { api } from '@/lib/api'

type RegisterMode = 'phone' | 'email'

function useCountdown(initial: number = 60) {
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const start = useCallback(() => setCountdown(initial), [initial])

  return { countdown, isCounting: countdown > 0, start }
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; barColor: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: '弱', color: 'text-red-500', barColor: 'bg-red-500' }
  if (score === 2) return { score, label: '中', color: 'text-amber-500', barColor: 'bg-amber-500' }
  if (score === 3 || score === 4) return { score, label: '强', color: 'text-green-500', barColor: 'bg-green-500' }
  return { score, label: '非常强', color: 'text-emerald-500', barColor: 'bg-emerald-500' }
}

const SSO_PROVIDERS = [
  { id: 'wecom', name: '企微', color: 'hover:border-[#07c160]/40 hover:bg-[#07c160]/[0.06] hover:text-[#07c160]' },
  { id: 'dingtalk', name: '钉钉', color: 'hover:border-blue-400/40 hover:bg-blue-400/[0.06] hover:text-blue-400' },
  { id: 'feishu', name: '飞书', color: 'hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-400' },
  { id: 'microsoft', name: 'MS', color: 'hover:border-sky-400/40 hover:bg-sky-400/[0.06] hover:text-sky-400' },
]

export default function RegisterPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const { toast } = useToast()

  const companyRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<RegisterMode>('email')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const { countdown, isCounting, start: startCountdown } = useCountdown(60)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [registeredEmail, setRegisteredEmail] = useState('')

  useEffect(() => {
    companyRef.current?.focus()
  }, [])

  const emailError = touched.email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? '请输入有效的邮箱地址'
    : ''
  const passwordStrength = getPasswordStrength(password)
  const passwordError = touched.password && password.length > 0 && password.length < 6
    ? '密码长度至少6位'
    : ''
  const confirmPasswordError = touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword
    ? '两次输入的密码不一致'
    : ''
  const phoneError = touched.phone && phone.length > 0 && !/^1[3-9]\d{9}$/.test(phone)
    ? '请输入有效的11位手机号'
    : ''

  const createTrialTenant = async (token: string) => {
    try {
      await api.post('/tenants', {
        name: company || '默认租户',
        plan: 'free',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // trial tenant creation is best-effort
    }
  }

  const handleSendCode = async () => {
    if (!phone || phone.length < 11 || isCounting) return
    await new Promise((r) => setTimeout(r, 500))
    startCountdown()
  }

  const handlePhoneRegister = async () => {
    setError('')
    if (!company || !phone || !smsCode) {
      setError('请填写所有字段')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的11位手机号')
      return
    }
    if (smsCode.length < 4) {
      setError('验证码格式不正确，请输入4-6位数字验证码')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: company,
        phone,
        email: `${phone}@phone.secmind.com`,
        password: `sm_${phone.slice(-6)}`,
      })

      login(
        {
          id: String(res.data.id),
          name: res.data.name || `用户${phone.slice(-4)}`,
          email: res.data.email || `${phone}@phone.secmind.com`,
          phone,
          role: res.data.role === 'admin' ? 'admin' : 'analyst',
          isNewUser: true,
        },
        res.data.access_token,
        false,
        res.data.refresh_token ?? null
      )

      await createTrialTenant(res.data.access_token)
      localStorage.setItem('secmind-trial-start', String(Date.now()))
      setRegisteredEmail(res.data.email || phone)
    } catch (err: any) {
      const message = err?.response?.data?.detail || '注册失败，请稍后重试'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailRegister = async () => {
    setError('')
    if (!company || !email || !password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: company,
        email: email.trim(),
        password,
      })

      login(
        {
          id: String(res.data.id),
          name: res.data.name || email.split('@')[0],
          email: res.data.email || email.trim(),
          role: res.data.role === 'admin' ? 'admin' : 'analyst',
          isNewUser: true,
        },
        res.data.access_token,
        false,
        res.data.refresh_token ?? null
      )

      await createTrialTenant(res.data.access_token)
      localStorage.setItem('secmind-trial-start', String(Date.now()))
      setRegisteredEmail(email.trim())
    } catch (err: any) {
      const message = err?.response?.data?.detail || '注册失败，请稍后重试'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = (provider: string) => {
    router.push(`/auth/callback?provider=${provider}`)
  }

  const handleSubmit = () => {
    if (mode === 'phone') {
      handlePhoneRegister()
    } else {
      handleEmailRegister()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
      {registeredEmail ? (
        <div className="flex flex-col items-center text-center py-6 gap-5">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_24px_rgba(0,212,255,0.3)]">
            <Sparkles className="size-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">注册成功！</h1>
            <p className="text-sm text-slate-500">
              欢迎加入 SecMind，您的 14 天免费试用已开启
            </p>
            <p className="text-xs text-slate-400">
              账号：{registeredEmail}
            </p>
          </div>
          <div className="space-y-2 w-full max-w-xs">
            <div className="rounded-lg border border-cyan-200 bg-cyan-50/60 p-3">
              <p className="text-xs text-cyan-700 leading-relaxed">
                <strong>接下来：</strong>完成新手引导，连接您的安全数据源，体验 AI 自主研判
              </p>
            </div>
            <Button
              className="h-11 w-full rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)] transition-all hover:shadow-[0_14px_32px_rgba(6,182,212,0.38)] hover:-translate-y-0.5"
              onClick={() => router.push('/dashboard')}
            >
              进入工作台
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900">
              创建 SecMind 账号
            </h1>
            <p className="text-sm text-slate-500">
              开启AI自主安全研判之旅
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-100 p-1" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'email'}
              onClick={() => setMode('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
                mode === 'email'
                  ? 'bg-cyan-500/15 text-cyan-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Mail className="size-3.5" />
              邮箱注册
            </button>
            <button
              role="tab"
              aria-selected={mode === 'phone'}
              onClick={() => setMode('phone')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
                mode === 'phone'
                  ? 'bg-cyan-500/15 text-cyan-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Phone className="size-3.5" />
              手机号注册
            </button>
          </div>

          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">企业名称</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={companyRef}
                  className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  placeholder="请输入企业名称"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            {mode === 'phone' ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">手机号</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      name="phone"
                      autoComplete="tel"
                      className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      placeholder="请输入手机号"
                      type="tel"
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-xs text-red-400">{phoneError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">验证码</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                        placeholder="请输入6位验证码"
                        type="text"
                        maxLength={6}
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="h-11 shrink-0 px-4 border-cyan-500/25 bg-cyan-500/[0.04] text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSendCode}
                      disabled={isCounting || phone.length < 11}
                    >
                      {isCounting ? `${countdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">邮箱</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      name="email"
                      autoComplete="email"
                      spellCheck={false}
                      className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      placeholder="请输入邮箱地址"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-400">{emailError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">密码</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      className="h-11 border-slate-200 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      placeholder="至少6位字符"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <Progress value={passwordStrength.score * 20} className="flex-wrap gap-1">
                        <ProgressTrack className="h-1.5">
                          <ProgressIndicator className={passwordStrength.barColor} />
                        </ProgressTrack>
                      </Progress>
                      <div className="flex justify-between">
                        <span className={`text-xs ${passwordStrength.color}`}>
                          密码强度：{passwordStrength.label}
                        </span>
                        {password.length < 6 && touched.password && (
                          <span className="text-xs text-red-400">至少6位字符</span>
                        )}
                      </div>
                    </div>
                  )}
                  {passwordError && (
                    <p className="text-xs text-red-400">{passwordError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-600">确认密码</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="h-11 border-slate-200 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="text-xs text-red-400">{confirmPasswordError}</p>
                  )}
                </div>
              </>
            )}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30"
              />
              <Label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                我已阅读并同意{' '}
                <Link href="/terms" className="text-cyan-700 hover:text-cyan-700 transition-colors">《服务条款》</Link>
                {' '}和{' '}
                <Link href="/privacy" className="text-cyan-700 hover:text-cyan-700 transition-colors">《隐私政策》</Link>
              </Label>
            </div>

            {error && (
              <p className="text-center text-sm text-red-400" role="alert">{error}</p>
            )}

            <Button
              className="h-11 w-full rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)] transition-all hover:shadow-[0_14px_32px_rgba(6,182,212,0.38)] hover:-translate-y-0.5"
              onClick={handleSubmit}
              disabled={loading || !acceptedTerms}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : '注 册'}
            </Button>
          </div>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs text-slate-400">SSO 注册</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <div className="flex items-center gap-2">
            {SSO_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                aria-label={
                  provider.id === 'wecom' ? '企业微信登录'
                    : provider.id === 'dingtalk' ? '钉钉登录'
                    : provider.id === 'feishu' ? '飞书登录'
                    : 'Microsoft登录'
                }
                onClick={() => handleSSOLogin(provider.id)}
                className={`flex-1 flex items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-500 transition-all ${provider.color}`}
              >
                {provider.name}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
            已有账号？{' '}
            <Link
              href="/login"
              className="text-cyan-700 transition-colors hover:text-cyan-700"
            >
              立即登录
            </Link>
          </p>
        </>
      )}
    </div>
  )
}