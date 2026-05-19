'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Phone, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { api, isAxiosError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { startAdminSession, startDemoSession } from '@/lib/demo-session'

type LoginMode = 'phone' | 'email'

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const detail = error.response?.data
    if (typeof detail === 'object' && detail && 'detail' in detail && typeof detail.detail === 'string') {
      return detail.detail
    }
  }

  return fallback
}

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

const ADMIN_IDENTIFIERS = new Set(["admin", "admin@secmind.com", "admin@example.com"])

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
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
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => setMounted(true))
    } else {
      Promise.resolve().then(() => setMounted(true))
    }
  }, [])

  useEffect(() => {
    if (mode === 'email') {
      emailInputRef.current?.focus()
    } else {
      phoneInputRef.current?.focus()
    }
  }, [mode])

  const navigateToWorkspace = useCallback(() => {
    router.replace('/investigate')

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (window.location.pathname === '/login') {
          window.location.assign('/investigate')
        }
      }, 150)
    }
  }, [router])

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
      const message = getErrorMessage(err, '验证码发送失败')
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

      const permResponse = await api.get(`/rbac/users/${account.id}/permissions`, {
        headers: {
          Authorization: `Bearer ${loginResponse.data.access_token}`,
        },
      })
      const roles = permResponse.data.roles || []
      const permissions = permResponse.data.permissions || []

      login(
        {
          id: String(account.id),
          name: account.name || `用户${phone.slice(-4)}`,
          email: account.email || `${phone}@phone.secmind.com`,
          phone,
          role: roles.includes('admin') ? 'admin' : roles.includes('soc_manager') ? 'soc_manager' : roles.includes('analyst') ? 'analyst' : 'viewer',
          avatarUrl: account.avatar_url ?? undefined,
        },
        loginResponse.data.access_token,
        rememberMe,
        loginResponse.data.refresh_token ?? null
      )
      useAuthStore.getState().setPermissions(permissions)
      toast('登录成功', 'success')
      navigateToWorkspace()
    } catch (err) {
      // 后端不可用时，对已知演示账号降级为本地 mock 登录
      if (!isAxiosError(err) && email.trim() === 'admin@secmind.com' && password === 'admin123') {
        login(
          {
            id: 'ADMIN001',
            name: '系统管理员',
            email: 'admin@secmind.com',
            role: 'admin',
            isDemo: true,
          },
          'mock-jwt-token-admin',
          rememberMe
        )
        useAuthStore.getState().setPermissions(['*:*'])
        toast('登录成功（离线演示模式）', 'success')
        navigateToWorkspace()
        return
      }
      const message = getErrorMessage(err, '登录失败，请稍后重试')
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setError('')
    const normalizedEmail = email.trim().toLowerCase()
    const isBuiltinAdmin = ADMIN_IDENTIFIERS.has(normalizedEmail)

    if (!normalizedEmail) {
      setError('请输入邮箱地址')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!isBuiltinAdmin && !emailRegex.test(normalizedEmail)) {
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
        email: isBuiltinAdmin && normalizedEmail === 'admin' ? 'admin@secmind.com' : normalizedEmail,
        password,
      })

      const profileResponse = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${loginResponse.data.access_token}`,
        },
      })

      const account = profileResponse.data

      const permResponse = await api.get(`/rbac/users/${account.id}/permissions`, {
        headers: {
          Authorization: `Bearer ${loginResponse.data.access_token}`,
        },
      })
      const roles = permResponse.data.roles || []
      const permissions = permResponse.data.permissions || []

      login(
        {
          id: String(account.id),
          name: account.name,
          email: account.email,
          phone: account.phone ?? undefined,
          role: roles.includes('admin') ? 'admin' : roles.includes('soc_manager') ? 'soc_manager' : roles.includes('analyst') ? 'analyst' : 'viewer',
          avatarUrl: account.avatar_url ?? undefined,
        },
        loginResponse.data.access_token,
        rememberMe,
        loginResponse.data.refresh_token ?? null
      )
      useAuthStore.getState().setPermissions(roles.includes('admin') || permissions.length === 0 ? ['*:*'] : permissions)
      toast('登录成功', 'success')
      navigateToWorkspace()
    } catch (err) {
      if (isBuiltinAdmin && password === 'admin123') {
        startAdminSession(normalizedEmail === 'admin' ? 'admin@secmind.com' : normalizedEmail)
        toast('登录成功（本地管理员模式）', 'success')
        navigateToWorkspace()
        return
      }
      const message = getErrorMessage(err, '登录失败，请稍后重试')
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = (provider: string) => {
    router.push(`/auth/callback?provider=${provider}`)
  }

  if (!mounted) {
    return (
      <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-[#131316] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-white">欢迎回到 SecMind</h1>
          <p className="text-sm text-zinc-400">AI自主安全研判，从登录开始</p>
        </div>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-cyan-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-[#131316] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-white">
          欢迎回到 SecMind
        </h1>
        <p className="text-sm text-zinc-400">
          AI自主安全研判，从登录开始
        </p>
      </div>

      <div className="flex rounded-lg bg-white/[0.04] p-1" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'email'}
          onClick={() => { setMode('email'); setError(''); setEmailError(''); setPasswordError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'email'
              ? 'bg-blue-500/15 text-blue-300 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
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
              ? 'bg-blue-500/15 text-blue-300 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Phone className="size-3.5" />
          手机号登录
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 text-sm text-red-400" role="alert">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'phone' ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handlePhoneLogin()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-sm text-zinc-400">手机号</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                ref={phoneInputRef}
                name="phone"
                autoComplete="tel"
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
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
            <Label className="text-sm text-zinc-400">验证码</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                  placeholder="请输入6位验证码"
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '')); setError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePhoneLogin() }}
                />
              </div>
              <button
                type="button"
                className="h-11 shrink-0 rounded-lg border border-blue-500/25 bg-blue-500/[0.04] px-4 text-blue-300 transition-colors hover:bg-blue-500/10 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSendCode}
                disabled={isCounting || phone.length < 11}
              >
                {isCounting ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-600 to-violet-600 font-semibold text-white shadow-[0_10px_26px_rgba(59,130,246,0.30)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(59,130,246,0.38)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || !phone || !smsCode}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : '登 录'}
          </button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleEmailLogin()
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-sm text-zinc-400">邮箱</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); validateEmail(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailLogin() }}
              />
            </div>
            {emailError && (
              <p className="text-xs text-red-400 mt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-zinc-400">密码</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400/80 transition-colors hover:text-blue-400"
              >
                忘记密码？
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                className="h-11 border-white/[0.08] bg-white/[0.04] pl-10 pr-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); validatePassword(e.target.value) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailLogin() }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-400 mt-1">{passwordError}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-white/[0.12] bg-white/[0.04] text-blue-600 focus:ring-blue-500/20 focus:ring-2 focus:ring-offset-0"
            />
            <Label htmlFor="remember-me" className="text-sm text-zinc-400 cursor-pointer select-none">
              记住我
            </Label>
          </div>

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-600 to-violet-600 font-semibold text-white shadow-[0_10px_26px_rgba(59,130,246,0.30)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(59,130,246,0.38)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : '登 录'}
          </button>
        </form>
      )}

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-white/[0.06]" />
        <span className="px-3 text-xs text-zinc-500">其他方式</span>
        <div className="flex-1 border-t border-white/[0.06]" />
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
            className={`flex-1 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-400 transition-all ${provider.color}`}
          >
            {provider.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            startDemoSession()
            navigateToWorkspace()
          }}
          className="flex h-[42px] flex-1 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/[0.04] text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/10 hover:text-blue-200"
        >
          免费体验
          <ArrowRight className="size-3.5 ml-1" />
        </button>
      </div>

      <p className="text-center text-sm text-zinc-500">
        还没有账号？{' '}
        <Link
          href="/register"
          className="text-blue-400 transition-colors hover:text-blue-300"
        >
          立即注册
        </Link>
      </p>

    </div>
  )
}
