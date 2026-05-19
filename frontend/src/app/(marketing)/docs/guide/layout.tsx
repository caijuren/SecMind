import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "使用指南 - SecMind AI安全运营平台",
}

export default function DocsGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}