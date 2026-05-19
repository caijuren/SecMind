import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "文档中心 - SecMind AI安全运营平台",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}