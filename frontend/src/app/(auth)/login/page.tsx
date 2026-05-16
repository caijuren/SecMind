'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Phone, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

type LoginMode = 'phone' | 'email'

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

const SSO_PROVIDERS = [
  { id: 'wecom', name: '企微', color: 'hover:border-[#07c160]/40 hover:bg-[#07c160]/[0.06] hover:text-[#07c160]' },
  { id: 'dingtalk', name: '钉钉', color: 'hover:border-blue-400/40 hover:bg-blue-400/[0.06] hover:text-blue-400' },
  { id: 'feishu', name: '飞书', color: 'hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-400' },
  { id: 'microsoft', name: 'MS', color: 'hover:border-sky-400/40 hover:bg-sky-400/[0.06] hover:text-sky-400' },
]

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const { toast } = useToast()

  const [mode, setMode] = useState<LoginMode>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const { countdown, isCounting, start: startCountdown } = useCountdown(60)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const emailInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'email') {
      emailInputRef.current?.focus()
    } else {
      phoneInputRef.current?.focus()
    }
  }, [mode])

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) {
      setEmailError('邮箱格式不正确')
    } else {
      setEmailError('')
    }
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('')
      return
    }
    if (value.length < 6) {
      setPasswordError('密码长度不能少于6位')
    } else {
      setPasswordError('')
    }
  }

  const handleSendCode = async () => {
    if (!phone || phone.length < 11 || isCounting) return
    setError('')
    try {
      await api.post('/auth/send-sms-code', { phone })
      startCountdown()
    } catch (err) {
      const message = (err as any)?.response?.data?.detail || '验证码发送失败'
      setError(message)
      toast(message, 'error')
    }
  }

  const handlePhoneLogin = async () => {
    if (!phone || !smsCode) return
    setError('')
    setLoading(true)
    try {
      const loginResponse = await api.post('/auth/phone-login', {
        phone,
        sms_code: smsCode,
      })

      const profileResponse = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${loginResponse.data.access_token}`,
        },
      })

      const account = profileResponse.data

      login(
        {
          id: String(account.id),
          name: account.name || `用户${phone.slice(-4)}`,
          email: account.email || `${phone}@phone.secmind.com`,
          phone,
          role: account.role === 'admin' ? 'admin' : account.role === 'analyst' ? 'analyst' : 'viewer',
          avatarUrl: account.avatar_url ?? undefined,
        },
        loginResponse.data.access_token,
        rememberMe,
        loginResponse.data.refresh_token ?? null
      )
      toast('登录成功', 'success')
      router.push('/investigate')
    } catch (err) {
      const message = (err as any)?.response?.data?.detail || '登录失败，请稍后重试'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setError('')

    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('邮箱格式不正确，请输入有效的邮箱地址')
      return
    }

    if (!password) {
      setError('请输入密码')
      return
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位')
      return
    }

    setLoading(true)
    try {
      const loginResponse = await api.post('/auth/login', {
        email: email.trim(),
        password,
      })

      const profileResponse = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${loginResponse.data.access_token}`,
        },
      })

      const account = profileResponse.data

      login(
        {
          id: String(account.id),
          name: account.name,
          email: account.email,
          phone: account.phone ?? undefined,
          role: account.role === 'admin' ? 'admin' : account.role === 'analyst' ? 'analyst' : 'viewer',
          avatarUrl: account.avatar_url ?? undefined,
        },
        loginResponse.data.access_token,
        rememberMe,
        loginResponse.data.refresh_token ?? null
      )
      toast('登录成功', 'success')
      router.push('/investigate')
    } catch (err) {
      const message = (err as any)?.response?.data?.detail || '登录失败，请稍后重试'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    setLoading(true)
    try {
      login(
        {
          id: 'DEMO001',
          name: '体验用户',
          email: 'demo@secmind.com',
          role: 'viewer',
          isDemo: true,
          isNewUser: true,
        },
        'mock-jwt-token-demo',
        rememberMe
      )
      toast('登录成功', 'success')
      router.push('/investigate')
    } catch (err) {
      const message = (err as any)?.response?.data?.detail || '登录失败，请稍后重试'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = (provider: string) => {
    router.push(`/auth/callback?provider=${provider}`)
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-900">
          欢迎回到 SecMind
        </h1>
        <p className="text-sm text-slate-500">
          AI自主安全研判，从登录开始
        </p>
      </div>

      <div className="flex rounded-lg bg-slate-100 p-1" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'email'}
          onClick={() => { setMode('email'); setError(''); setEmailError(''); setPasswordError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'email'
              ? 'bg-cyan-100 text-cyan-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail className="size-3.5" />
          邮箱登录
        </button>
        <button
          role="tab"
          aria-selected={mode === 'phone'}
          onClick={() => { setMode('phone'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'phone'
              ? 'bg-cyan-100 text-cyan-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Phone className="size-3.5" />
          手机号登录
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-600">手机号</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={phoneInputRef}
                name="phone"
                autoComplete="tel"
                className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                placeholder="请输入手机号"
                type="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePhoneLogin() }}
              />
            </div>
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
                  onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '')); setError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePhoneLogin() }}
                />
              </div>
              <Button
                variant="outline"
                className="h-11 shrink-0 px-4 border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendCode}
                disabled={isCounting || phone.length < 11}
              >
                {isCounting ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </div>

          <Button
            className="h-11 w-full rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)] transition-all hover:shadow-[0_14px_32px_rgba(6,182,212,0.38)] hover:-translate-y-0.5"
            onClick={handlePhoneLogin}
            disabled={loading || !phone || !smsCode}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : '登 录'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-600">邮箱</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                className="h-11 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); validateEmail(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailLogin() }}
              />
            </div>
            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-600">密码</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-700/80 transition-colors hover:text-cyan-700"
              >
                忘记密码？
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                className="h-11 border-slate-200 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); validatePassword(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailLogin() }}
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
            {passwordError && (
              <p className="text-xs text-red-500 mt-1">{passwordError}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20 focus:ring-2 focus:ring-offset-0"
            />
            <Label htmlFor="remember-me" className="text-sm text-slate-600 cursor-pointer select-none">
              记住我
            </Label>
          </div>

          <Button
            className="h-11 w-full rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-[0_10px_26px_rgba(6,182,212,0.30)] transition-all hover:shadow-[0_14px_32px_rgba(6,182,212,0.38)] hover:-translate-y-0.5"
            onClick={handleEmailLogin}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : '登 录'}
          </Button>
        </div>
      )}

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-slate-200" />
        <span className="px-3 text-xs text-slate-400">其他方式</span>
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
        <Button
          variant="outline"
          className="flex-1 h-[42px] rounded-lg border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 font-medium text-sm"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          免费体验
          <ArrowRight className="size-3.5 ml-1" />
        </Button>
      </div>

      <p className="text-center text-sm text-slate-500">
        还没有账号？{' '}
        <Link
          href="/register"
          className="text-cyan-700 transition-colors hover:text-cyan-800"
        >
          立即注册
        </Link>
      </p>

    </div>
  )
}