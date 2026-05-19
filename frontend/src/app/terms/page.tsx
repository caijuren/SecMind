import Link from "next/link"

export default function TermsPage() {
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
          <h1 className="mb-4 text-4xl font-bold text-zinc-100">服务条款</h1>
          <p className="mb-12 text-sm text-zinc-500">最后更新：2026年5月12日</p>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">1. 服务说明</h2>
            <p className="mb-3 text-sm leading-relaxed text-zinc-500">
              SecMind（“服务”）是一个AI驱动的安全运营平台。本条款构成您与SecMind Technology Co., Ltd.（“我们”）之间的法律协议。使用我们的服务即表示您同意受本条款约束。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">2. 账户注册与使用</h2>
            <ul className="ml-4 list-disc list-inside space-y-2 text-sm text-zinc-500">
              <li>您必须提供真实、准确、完整的注册信息</li>
              <li>您有责任保管好账户密码，并对账户下的所有活动负责</li>
              <li>您不得将账户转让或出借给第三方使用</li>
              <li>您应立即通知我们任何未经授权的使用情况</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">3. 可接受使用政策</h2>
            <p className="mb-2 text-sm font-medium text-zinc-300">在使用SecMind服务时，您同意不会：</p>
            <ul className="ml-4 list-disc list-inside space-y-2 text-sm text-zinc-500">
              <li>违反任何适用的法律法规</li>
              <li>利用服务进行任何非法活动</li>
              <li>干扰或破坏服务的正常运行</li>
              <li>尝试逆向工程、反编译或提取源代码</li>
              <li>上传恶意代码、病毒或有害内容</li>
              <li>探测、扫描或测试系统漏洞（经授权的安全测试除外）</li>
              <li>超出授权范围访问或使用他人的数据和账户</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">4. 知识产权</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              SecMind平台及其所有内容（包括但不限于软件、界面设计、文档、商标、Logo）的知识产权归SecMind所有。未经事先书面许可，您不得复制、修改、分发或创建衍生作品。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">5. 付费服务</h2>
            <ul className="ml-4 list-disc list-inside space-y-2 text-sm text-zinc-500">
              <li>部分功能需要付费订阅方可使用，具体以定价页面为准</li>
              <li>所有费用均不退款，除非适用法律另有规定</li>
              <li>我们保留随时调整价格的权利，已付费用户在当前计费周期内不受影响</li>
              <li>逾期未付款可能导致服务中断或账户暂停</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">6. 免责声明</h2>
            <p className="mb-3 text-sm leading-relaxed text-zinc-500">
              SecMind的服务按“现状”和“可用”基础提供。我们不保证：
            </p>
            <ul className="ml-4 list-disc list-inside space-y-2 text-sm text-zinc-500">
              <li>服务将不间断或无错误地运行</li>
              <li>AI研判结果100%准确（AI建议需人工复核）</li>
              <li>自动处置操作不会产生误报（已内置安全护栏和审批机制）</li>
              <li>服务能够满足您的全部安全需求</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              在法律允许的最大范围内，我们对因使用或无法使用服务而导致的任何间接、附带、特殊或惩罚性损害不承担责任。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">7. 终止</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              我们有权在以下情况下暂停或终止您的账户：(a) 违反本条款；(b) 长期未活跃；(c) 未支付费用；(d) 法律法规要求。终止后，您可能无法访问存储在账户中的数据。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">8. 适用法律与争议解决</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              本条款受中华人民共和国法律管辖。因本条款引起的争议，双方应首先通过友好协商解决；协商不成的，任何一方可向SecMind所在地有管辖权的人民法院提起诉讼。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">9. 条款变更</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              我们可能会不时更新本条款。重大变更将通过邮件或在平台内通知。继续使用服务即表示您接受修订后的条款。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">10. 联系我们</h2>
            <div className="mt-3 rounded-lg border border-white/8 bg-[#131316] p-4 text-sm text-zinc-500">
              <p>📧 法律咨询：legal@secmind.com</p>
              <p>🏢 公司名称：SecMind Technology Co., Ltd.</p>
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
