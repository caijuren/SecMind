'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Building2, Phone, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'

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

const SSO_PROVIDERS = [
  { id: 'wecom', name: '企微', color: 'hover:border-[#07c160]/40 hover:bg-[#07c160]/[0.06] hover:text-[#07c160]' },
  { id: 'dingtalk', name: '钉钉', color: 'hover:border-blue-400/40 hover:bg-blue-400/[0.06] hover:text-blue-400' },
  { id: 'feishu', name: '飞书', color: 'hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-400' },
  { id: 'microsoft', name: 'MS', color: 'hover:border-sky-400/40 hover:bg-sky-400/[0.06] hover:text-sky-400' },
]

export default function RegisterPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [mode, setMode] = useState<RegisterMode>('email')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const { countdown, isCounting, start: startCountdown } = useCountdown(60)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
    if (phone.length < 11) {
      setError('请输入正确的手机号')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    login(
      {
        id: `U-${Date.now()}`,
        name: `用户${phone.slice(-4)}`,
        email: `${phone}@phone.secmind.com`,
        phone,
        role: 'analyst',
        isNewUser: true,
      },
      'mock-jwt-token-new-user'
    )
    router.push('/investigate')
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
    await new Promise((r) => setTimeout(r, 800))
    login(
      {
        id: `U-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'analyst',
        isNewUser: true,
      },
      'mock-jwt-token-new-user'
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
          创建 SecMind 账号
        </h1>
        <p className="text-sm text-white/40">
          开启AI自主安全研判之旅
        </p>
      </div>

      <div className="flex rounded-lg bg-white/[0.04] p-1">
        <button
          onClick={() => setMode('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'email'
              ? 'bg-cyan-500/15 text-cyan-300 shadow-sm'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Mail className="size-3.5" />
          邮箱注册
        </button>
        <button
          onClick={() => setMode('phone')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'phone'
              ? 'bg-cyan-500/15 text-cyan-300 shadow-sm'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Phone className="size-3.5" />
          手机号注册
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm text-white/60">企业名称</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
            <Input
              className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
              placeholder="请输入企业名称"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>

        {mode === 'phone' ? (
          <>
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
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
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
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
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
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm text-white/60">邮箱</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
                <Input
                  className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  placeholder="请输入邮箱地址"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-white/60">密码</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
                <Input
                  type="password"
                  className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  placeholder="至少6位字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-white/60">确认密码</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
                <Input
                  type="password"
                  className="h-11 border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-white/20 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <Button
          className="h-11 w-full bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110"
          onClick={mode === 'phone' ? handlePhoneRegister : handleEmailRegister}
          disabled={loading}
        >
          {loading ? '注册中...' : '注 册'}
        </Button>
      </div>

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-white/8" />
        <span className="px-3 text-xs text-white/25">SSO 注册</span>
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
      </div>

      <p className="text-center text-sm text-white/30">
        已有账号？{' '}
        <Link
          href="/login"
          className="text-cyan-400/70 transition-colors hover:text-cyan-400"
        >
          立即登录
        </Link>
      </p>
    </div>
  )
}
