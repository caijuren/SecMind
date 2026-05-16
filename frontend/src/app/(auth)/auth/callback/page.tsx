'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

const SSO_PROVIDER_MAP: Record<string, { name: string; icon: string; mockUser: { name: string; email: string } }> = {
  wecom: {
    name: '企业微信',
    icon: '💬',
    mockUser: { name: '张明', email: 'zhangming@wecom.secmind.com' },
  },
  dingtalk: {
    name: '钉钉',
    icon: '🔷',
    mockUser: { name: '李伟', email: 'liwei@dingtalk.secmind.com' },
  },
  feishu: {
    name: '飞书',
    icon: '🐦',
    mockUser: { name: '王芳', email: 'wangfang@feishu.secmind.com' },
  },
  microsoft: {
    name: 'Microsoft',
    icon: '🪟',
    mockUser: { name: 'Chen Wei', email: 'chenwei@microsoft.secmind.com' },
  },
}

type CallbackStatus = 'loading' | 'success' | 'error'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((s) => s.login)

  const provider = searchParams.get('provider') || ''
  const providerInfo = SSO_PROVIDER_MAP[provider]

  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!providerInfo) {
      setStatus('error')
      setErrorMsg(`不支持的登录方式: ${provider || '未指定'}`)
      return
    }

    const timer = setTimeout(() => {
      try {
        login(
          {
            id: `SSO-${provider}-${Date.now()}`,
            name: providerInfo.mockUser.name,
            email: providerInfo.mockUser.email,
            role: 'analyst',
            isNewUser: true,
          },
          `mock-jwt-token-sso-${provider}`
        )
        setStatus('success')
        setTimeout(() => {
          router.push('/investigate')
        }, 800)
      } catch {
        setStatus('error')
        setErrorMsg('SSO 登录失败，请重试')
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [provider, providerInfo, login, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex flex-col items-center gap-4">
        {status === 'loading' && (
          <>
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06]">
                {providerInfo ? (
                  <span className="text-2xl" role="img" aria-label={providerInfo.name}>{providerInfo.icon}</span>
                ) : (
                  <Shield className="size-7 text-cyan-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#0a1628] border border-white/10">
                <Loader2 className="size-3.5 text-cyan-400 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-white">
                正在通过{providerInfo?.name || 'SSO'}登录
              </h2>
              <p className="text-sm text-white/40">
                正在验证身份信息，请稍候...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06]">
                <CheckCircle2 className="size-8 text-emerald-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-white">
                登录成功
              </h2>
              <p className="text-sm text-white/40">
                正在跳转到工作台...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.06]">
                <XCircle className="size-8 text-red-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-white">
                登录失败
              </h2>
              <p className="text-sm text-white/40">{errorMsg}</p>
            </div>
            <Link
              href="/login"
              className="mt-2 text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors"
            >
              返回登录
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="size-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-white/40">加载中…</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
