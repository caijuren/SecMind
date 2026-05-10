'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Phone, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'

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

const MOCK_ACCOUNTS = [
  { email: 'admin@secmind.com', password: 'admin123', name: '管理员', role: 'admin' as const, id: 'U001' },
  { email: 'qianjin@secmind.com', password: 'secmind123', name: '钱进', role: 'soc_manager' as const, id: 'U024' },
  { email: 'zhaomin@secmind.com', password: 'secmind123', name: '赵敏', role: 'analyst' as const, id: 'U006' },
  { email: 'viewer@secmind.com', password: 'viewer123', name: '观察员', role: 'viewer' as const, id: 'U036' },
]

const SSO_PROVIDERS = [
  { id: 'wecom', name: '企微', color: 'hover:border-[#07c160]/40 hover:bg-[#07c160]/[0.06] hover:text-[#07c160]' },
  { id: 'dingtalk', name: '钉钉', color: 'hover:border-blue-400/40 hover:bg-blue-400/[0.06] hover:text-blue-400' },
  { id: 'feishu', name: '飞书', color: 'hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-400' },
  { id: 'microsoft', name: 'MS', color: 'hover:border-sky-400/40 hover:bg-sky-400/[0.06] hover:text-sky-400' },
]

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [mode, setMode] = useState<LoginMode>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const { countdown, isCounting, start: startCountdown } = useCountdown(60)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSendCode = async () => {
    if (!phone || phone.length < 11 || isCounting) return
    await new Promise((r) => setTimeout(r, 500))
    startCountdown()
  }

  const handlePhoneLogin = async () => {
    if (!phone || !smsCode) return
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    if (smsCode.length < 4) {
      setError('验证码格式不正确，请输入4-6位数字验证码')
      setLoading(false)
      return
    }

    login(
      {
        id: `U-${Date.now()}`,
        name: `用户${phone.slice(-4)}`,
        email: `${phone}@phone.secmind.com`,
        phone,
        role: 'analyst',
        isNewUser: true,
      },
      'mock-jwt-token-phone'
    )
    router.push('/investigate')
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
    await new Promise((r) => setTimeout(r, 800))

    const account = MOCK_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    )

    if (!account) {
      setError('邮箱或密码错误，请检查后重试')
      setLoading(false)
      return
    }

    login(
      {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
      },
      'mock-jwt-token-secmind'
    )
    router.push('/investigate')
  }

  const handleDemoLogin = async () => {
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    login(
      {
        id: 'DEMO001',
        name: '体验用户',
        email: 'demo@secmind.com',
        role: 'viewer',
        isDemo: true,
        isNewUser: true,
      },
      'mock-jwt-token-demo'
    )
    router.push('/investigate')
  }

  const handleSSOLogin = (provider: string) => {
    router.push(`/auth/callback?provider=${provider}`)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-white">
          欢迎回到 SecMind
        </h1>
        <p className="text-sm text-white/40">
          AI自主安全研判，从登录开始
        </p>
      </div>

      <div className="flex rounded-lg bg-white/[0.04] p-1">
        <button
          onClick={() => { setMode('email'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'email'
              ? 'bg-cyan-500/15 text-cyan-300 shadow-sm'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Mail className="size-3.5" />
          邮箱登录
        </button>
        <button
          onClick={() => { setMode('phone'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'phone'
              ? 'bg-cyan-500/15 text-cyan-300 shadow-sm'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Phone className="size-3.5" />
          手机号登录
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-white/60">手机号</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
              <Input
                className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                placeholder="请输入手机号"
                type="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-white/60">验证码</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
                <Input
                  className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  placeholder="请输入6位验证码"
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '')); setError('') }}
                />
              </div>
              <Button
                variant="outline"
                className="h-11 shrink-0 px-4 border-cyan-500/25 bg-cyan-500/[0.04] text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendCode}
                disabled={isCounting || phone.length < 11}
              >
                {isCounting ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </div>

          <Button
            className="h-11 w-full bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110"
            onClick={handlePhoneLogin}
            disabled={loading || !phone || !smsCode}
          >
            {loading ? '登录中...' : '登 录'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-white/60">邮箱</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
              <Input
                className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailLogin() }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white/60">密码</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-400/60 transition-colors hover:text-cyan-400"
              >
                忘记密码？
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
              <Input
                type="password"
                className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailLogin() }}
              />
            </div>
          </div>

          <Button
            className="h-11 w-full bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110"
            onClick={handleEmailLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录'}
          </Button>
        </div>
      )}

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-white/8" />
        <span className="px-3 text-xs text-white/25">其他方式</span>
        <div className="flex-1 border-t border-white/8" />
      </div>

      <div className="flex items-center gap-2">
        {SSO_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleSSOLogin(provider.id)}
            className={`flex-1 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] py-2.5 text-sm font-medium text-white/40 transition-all ${provider.color}`}
          >
            {provider.name}
          </button>
        ))}
        <Button
          variant="outline"
          className="flex-1 h-[42px] border-cyan-500/25 bg-cyan-500/[0.04] text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 font-medium text-sm"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          免费体验
          <ArrowRight className="size-3.5 ml-1" />
        </Button>
      </div>

      <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
        <p className="text-[11px] text-white/25 mb-2">演示账号</p>
        <div className="space-y-1.5">
          {MOCK_ACCOUNTS.map((account) => (
            <div key={account.email} className="flex items-center justify-between text-[11px]">
              <span className="text-white/30 font-mono">{account.email}</span>
              <span className="text-white/20 font-mono">{account.password}</span>
              <span className="text-cyan-400/30">{account.name}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-white/30">
        还没有账号？{' '}
        <Link
          href="/register"
          className="text-cyan-400/70 transition-colors hover:text-cyan-400"
        >
          立即注册
        </Link>
      </p>
    </div>
  )
}
