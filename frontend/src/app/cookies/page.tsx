import Link from "next/link"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#09090b]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500">
              <span className="text-sm font-bold text-white" aria-label="SecMind">S</span>
            </div>
            <span className="text-lg font-bold text-zinc-100">SecMind</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/" className="transition-colors hover:text-cyan-400">首页</Link>
            <Link href="/solutions" className="transition-colors hover:text-cyan-400">解决方案</Link>
            <Link href="/pricing" className="transition-colors hover:text-cyan-400">定价</Link>
            <Link href="/login" className="transition-colors hover:text-cyan-400">登录</Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold text-zinc-100">Cookie 政策</h1>
          <p className="mb-12 text-sm text-zinc-500">最后更新：2026年5月12日</p>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">什么是 Cookie？</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              Cookie 是存储在您设备上的小型文本文件，用于在您浏览网站时识别您的浏览器。它们被广泛用于使网站正常工作、提升效率以及提供信息给网站所有者。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">我们使用的 Cookie 类型</h2>
            <div className="space-y-4 mt-4">
              {[
                { name: "必要 Cookie", desc: "这些 Cookie 是网站正常运行所必需的，例如保持您的登录状态。", required: true },
                { name: "功能 Cookie", desc: "记住您的偏好设置（如语言选择、界面布局），提供增强功能。", required: false },
                { name: "分析 Cookie", desc: "帮助我们了解访客如何使用我们的网站，以便改进用户体验。", required: false },
                { name: "安全 Cookie", desc: "用于检测和预防安全威胁（如跨站请求伪造）。", required: true },
              ].map((cookie) => (
                <div key={cookie.name} className="rounded-lg border border-white/8 bg-[#131316] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-zinc-100">{cookie.name}</span>
                    {cookie.required && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">必需</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{cookie.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">如何管理 Cookie</h2>
            <p className="mb-3 text-sm leading-relaxed text-zinc-500">
              您可以通过浏览器设置管理或删除 Cookie。请注意，禁用某些 Cookie 可能会影响网站的正常功能。
            </p>
            <ul className="ml-4 list-disc list-inside space-y-2 text-sm text-zinc-500">
              <li><strong>Chrome</strong>：设置 → 隐私和安全 → Cookie 和其他站点数据</li>
              <li><strong>Firefox</strong>：设置 → 隐私与安全 → Cookie 和站点数据</li>
              <li><strong>Safari</strong>：偏好设置 → 隐私 → 管理网站数据</li>
              <li><strong>Edge</strong>：设置 → 隐私、搜索和服务 → Cookie</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">第三方 Cookie</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              我们可能允许某些可信的第三方服务在我们的网站上使用 Cookie。这些第三方包括：
            </p>
            <ul className="ml-4 mt-3 list-disc list-inside space-y-2 text-sm text-zinc-500">
              <li>分析服务提供商 — 用于收集匿名使用统计数据</li>
              <li>云服务提供商 — 用于内容分发和应用托管</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              这些第三方受各自隐私政策的约束。我们建议您查阅其各自的 Cookie 政策。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">更新记录</h2>
            <div className="overflow-x-auto rounded-lg border border-white/8">
              <table className="w-full text-sm" aria-label="Cookie 政策更新记录">
                <thead className="bg-[#131316]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">日期</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-500">变更内容</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  <tr>
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-500">2026-05-12</td>
                    <td className="px-4 py-2 text-zinc-500">初始版本发布</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/8 bg-[#131316] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-zinc-500">
          © 2026 SecMind. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
