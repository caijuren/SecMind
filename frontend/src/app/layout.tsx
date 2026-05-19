import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecMind - AI自主安全研判平台",
  description: "AI自主安全研判平台 — 信号感知、攻击推理、案件研判、自动处置",
  other: {
    "color-scheme": "dark light",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:top-2 focus:left-2">跳到主要内容</a>
        <main id="main-content" className="contents">
          {children}
        </main>
      </body>
    </html>
  );
}
