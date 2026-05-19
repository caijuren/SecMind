import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "行业解决方案 - SecMind AI安全运营平台",
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}