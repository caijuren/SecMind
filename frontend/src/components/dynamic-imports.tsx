"use client"

import dynamic from "next/dynamic"

export const DynamicECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[200px]" role="status" aria-label="加载中">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">加载图表...</span>
      </div>
    </div>
  ),
})

export const DynamicPlaybookEditor = dynamic(
  () => import("@/components/playbook-editor").then((mod) => mod.PlaybookEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[400px]" role="status" aria-label="加载中">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">加载编辑器...</span>
        </div>
      </div>
    ),
  }
)

export const DynamicOnboardingGuide = dynamic(
  () => import("@/components/onboarding-guide").then((mod) => mod.OnboardingGuide),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[300px]" role="status" aria-label="加载中">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">加载引导...</span>
        </div>
      </div>
    ),
  }
)

export const DynamicContactFormDialog = dynamic(
  () => import("@/components/contact-form-dialog").then((mod) => mod.ContactFormDialog),
  {
    ssr: false,
  }
)

export const DynamicPaymentDialog = dynamic(
  () => import("@/components/payment-dialog").then((mod) => mod.PaymentDialog),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[200px]" role="status" aria-label="加载中">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">加载支付...</span>
        </div>
      </div>
    ),
  }
)
