export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-bold text-slate-900">SecMind</span>
          </a>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="/" className="hover:text-cyan-700 transition-colors">首页</a>
            <a href="/solutions" className="hover:text-cyan-700 transition-colors">解决方案</a>
            <a href="/pricing" className="hover:text-cyan-700 transition-colors">定价</a>
            <a href="/login" className="hover:text-cyan-700 transition-colors">登录</a>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">隐私政策</h1>
          <p className="text-sm text-slate-500 mb-12">最后更新：2026年5月12日</p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">1. 信息收集</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              SecMind（以下简称「我们」）在您使用我们的服务时，可能收集以下类型的信息：
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
              <li>账户信息：用户名、邮箱地址、公司名称、联系方式（仅在您主动提供时收集）</li>
              <li>使用数据：登录时间/IP地址、操作日志、功能使用记录</li>
              <li>安全数据：您通过平台提交的告警信息、调查结论、处置记录等业务数据</li>
              <li>技术数据：浏览器类型、操作系统、设备标识符等自动收集的技术信息</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">2. 信息使用</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">我们收集的信息将用于以下目的：</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
              <li>提供、维护和改进我们的AI安全运营平台服务</li>
              <li>处理您的安全分析请求和AI研判任务</li>
              <li>保障平台安全和防止欺诈行为</li>
              <li>遵守法律法规要求</li>
              <li>发送服务通知和产品更新信息</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">3. 信息保护</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              我们采取行业标准的加密和安全措施来保护您的信息：
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
              <li>传输中数据采用 TLS 1.3 加密</li>
              <li>敏感数据（如API密钥、密码）采用 AES-256 加密存储</li>
              <li>数据库访问基于最小权限原则</li>
              <li>定期进行安全审计和渗透测试</li>
              <li>员工需签署保密协议并接受安全培训</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">4. 信息共享</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              除以下情况外，我们不会向第三方共享您的个人信息：
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
              <li>获得您的明确同意</li>
              <li>法律法规要求</li>
              <li>保护SecMind或公众的权益或安全所必需</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">5. 您的权利</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">您对您的个人信息享有以下权利：</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 ml-4">
              <li><strong>访问权</strong> — 查看我们持有的关于您的信息</li>
              <li><strong>更正权</strong> — 更正不准确或不完整的信息</li>
              <li><strong>删除权</strong> — 要求删除您的账户及相关数据（受法律法规保留要求的限制除外）</li>
              <li><strong>可携带权</strong> — 以结构化格式导出您的数据</li>
              <li><strong>撤回同意权</strong> — 随时撤回之前给予的任何同意</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">6. 数据保留</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              我们仅在实现本政策所述目的所需的期限内保留您的个人信息。当您删除账户后，我们将在30天内删除或匿名化您的个人数据，除非法律法规要求更长的保留期限。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">7. 儿童隐私</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。如果您认为我们可能收集了您孩子的信息，请立即联系我们。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">8. 联系我们</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p>📧 邮箱：privacy@secmind.com</p>
              <p>🏢 公司名称：SecMind Technology Co., Ltd.</p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400">
          © 2026 SecMind. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
