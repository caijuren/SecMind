'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Phone, ShieldCheck, CheckCircle2, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

type ResetMode = 'phone' | 'email'

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
  { id: 'dingtalk', name: '钉钉', color: 'hover:border-blue-400/40 hover:bg-blue-400/[0.06] hover:text-blue-600' },
  { id: 'feishu', name: '飞书', color: 'hover:border-purple-400/40 hover:bg-purple-400/[0.06] hover:text-purple-600' },
  { id: 'microsoft', name: 'MS', color: 'hover:border-sky-400/40 hover:bg-sky-400/[0.06] hover:text-sky-400' },
]

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [mode, setMode] = useState<ResetMode>('phone')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { countdown, isCounting, start: startCountdown } = useCountdown(60)

  const [email, setEmail] = useState('')

  const phoneInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'email') {
      emailInputRef.current?.focus()
    } else {
      phoneInputRef.current?.focus()
    }
  }, [mode])

  const handleSendCode = async () => {
    if (!phone || phone.length < 11 || isCounting) return
    await new Promise((r) => setTimeout(r, 500))
    startCountdown()
  }

  const handlePhoneReset = async () => {
    if (!phone || !smsCode || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setSuccess(true)
    toast('密码重置成功', 'success')
  }

  const [error, setError] = useState('')

  const handleEmailReset = async () => {
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
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setSuccess(true)
    toast('重置链接已发送到您的邮箱', 'success')
  }

  const handleSSOLogin = (provider: string) => {
    router.push(`/auth/callback?provider=${provider}`)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {mode === 'phone' ? '密码重置成功' : '重置链接已发送'}
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {mode === 'phone'
            ? '您的密码已重置，请使用新密码登录'
            : '请查看您的邮箱，点击链接重置密码'}
        </p>
        <Link href="/login">
          <Button className="mt-2 rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            返回登录
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-foreground">
          重置密码
        </h1>
        <p className="text-sm text-muted-foreground">
          通过手机号或邮箱验证身份后重置密码
        </p>
      </div>

      <div className="flex rounded-lg bg-muted/50 p-1" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'phone'}
          onClick={() => setMode('phone')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'phone'
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-muted-foreground'
          }`}
        >
          <Phone className="size-3.5" />
          手机号重置
        </button>
        <button
          role="tab"
          aria-selected={mode === 'email'}
          onClick={() => setMode('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'email'
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-muted-foreground'
          }`}
        >
          <Mail className="size-3.5" />
          邮箱重置
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 text-sm text-red-600" role="alert">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">手机号</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={phoneInputRef}
                name="phone"
                autoComplete="tel"
                className="h-11 border-border bg-muted/40 pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                placeholder="请输入注册时的手机号"
                type="tel"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">验证码</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  className="h-11 border-border bg-muted/40 pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                  placeholder="请输入6位验证码"
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button
                variant="outline"
                className="h-11 shrink-0 px-4 border-primary/25 bg-primary/[0.04] text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendCode}
                disabled={isCounting || phone.length < 11}
              >
                {isCounting ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">新密码</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="h-11 border-border bg-muted/40 pl-10 pr-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                placeholder="至少6位字符"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showNewPassword ? '隐藏密码' : '显示密码'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">确认新密码</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="h-11 border-border bg-muted/40 pl-10 pr-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            onClick={handlePhoneReset}
            disabled={loading || !phone || !smsCode || !newPassword || newPassword !== confirmPassword}
          >
            {loading ? '重置中…' : '重置密码'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">邮箱地址</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={emailInputRef}
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                className="h-11 border-border bg-muted/40 pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                placeholder="请输入注册时的邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            onClick={handleEmailReset}
            disabled={loading || !email}
          >
            {loading ? '发送中…' : '发送重置链接'}
          </Button>
        </div>
      )}

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-xs text-muted-foreground">SSO 登录</span>
        <div className="flex-1 border-t border-border" />
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
            className={`flex-1 flex items-center justify-center rounded-lg border border-border bg-muted/50 py-2.5 text-sm font-medium text-muted-foreground transition-all ${provider.color}`}
          >
            {provider.name}
          </button>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="size-3.5" />
          返回登录
        </Link>
      </div>
    </div>
  )
}