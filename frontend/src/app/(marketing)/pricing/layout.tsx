import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "定价 - SecMind AI安全运营平台",
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}