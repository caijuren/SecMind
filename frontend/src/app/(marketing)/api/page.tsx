"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Moon,
  Sun,
  Copy,
  Check,
  Menu,
} from "lucide-react";

const CODE_PY_LOGIN = `import requests

BASE_URL = "https://api.secmind.com/api/v1"

# Step 1: 登录获取令牌
resp = requests.post(f"{BASE_URL}/auth/login",
    json={
        "email": "admin@example.com",
        "password": "your-password"
    })
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Step 2: 获取告警列表
alerts = requests.get(f"{BASE_URL}/alerts",
    params={"risk_level": "high", "limit": 10},
    headers=headers).json()
print(f"获取到 {alerts['total']} 条高危告警")`;

const CODE_PY_AI = `import requests

BASE = "https://api.secmind.com/api/v1"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# 提交告警进行 AI 分析
analysis = requests.post(f"{BASE}/ai-analysis/events",
    json={"alert_id": 123}, headers=headers).json()

# 查询分析结果
result = requests.get(
    f"{BASE}/ai-analysis/events/{analysis['id']}",
    headers=headers).json()

print("威胁评分:", result.get("ai_score"))
print("处置建议:", result.get("ai_recommendation"))`;

const CODE_PY_IOC = `import requests

BASE = "https://api.secmind.com/api/v1"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# 查询单个 IOC
ioc_data = requests.get(
    f"{BASE}/ioc/lookup/8.8.8.8",
    headers=headers).json()

# 批量查询
batch = requests.post(f"{BASE}/ioc/batch",
    json={"iocs": ["8.8.8.8", "example.com"]},
    headers=headers).json()`;

const CODE_PY_CHAT = `import requests

BASE = "https://api.secmind.com/api/v1"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# 创建对话会话
session = requests.post(f"{BASE}/ai-chat/sessions",
    json={"title": "告警 #123 调查", "alert_id": 123},
    headers=headers).json()

# 发送消息
reply = requests.post(
    f"{BASE}/ai-chat/sessions/{session['id']}/messages",
    json={"content": "分析这个告警的 MITRE ATT&CK 战术"},
    headers=headers).json()

print(reply["content"])`;

const CODE_PY_RESP = `{
  "items": [
    {
      "id": 1,
      "type": "intrusion",
      "title": "可疑 SSH 暴力破解尝试",
      "risk_level": "high",
      "status": "open",
      "source_ip": "203.0.113.42",
      "timestamp": "2026-05-17T01:00:00Z",
      "ai_score": 0.92,
      "ai_summary": "检测到来自外部 IP 的 SSH 暴力破解，已成功登录 3 次",
      "ai_recommendation": "建议立即封锁源 IP 并检查被访问账户的登录记录"
    }
  ],
  "total": 47,
  "skip": 0,
  "limit": 10
}`;

const CODE_JS_LOGIN = 'const BASE_URL = "https://api.secmind.com/api/v1";\\n\\n// 登录获取令牌\\nconst loginResp = await fetch(`${BASE_URL}/auth/login`, {\\n  method: "POST",\\n  headers: { "Content-Type": "application/json" },\\n  body: JSON.stringify({\\n    email: "admin@example.com",\\n    password: "your-password"\\n  })\\n});\\nconst { access_token } = await loginResp.json();\\n\\n// 获取高危告警\\nconst alertsResp = await fetch(\\n  `${BASE_URL}/alerts?risk_level=high&limit=10`,\\n  { headers: { "Authorization": `Bearer ${access_token}` } }\\n);\\nconst alerts = await alertsResp.json();\\nconsole.log(`获取到 ${alerts.total} 条高危告警`)';

const CODE_JS_CHAT = `const BASE = "https://api.secmind.com/api/v1";
const headers = {
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
};

// 创建会话并发送消息
const session = await fetch(\`\${BASE}/ai-chat/sessions\`, {
  method: "POST",
  headers,
  body: JSON.stringify({ title: "IOC 调查" })
}).then(r => r.json());

const reply = await fetch(
  \`\${BASE}/ai-chat/sessions/\${session.id}/messages\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    content: "查询 IP 203.0.113.42 的威胁情报"
  })
}).then(r => r.json());

console.log(reply.content)`;

const CODE_JS_RESP = `{
  "id": 42,
  "alert_id": 123,
  "status": "completed",
  "ai_score": 0.87,
  "ai_summary": "检测到异常登录行为，关联到已知攻击 IP",
  "ai_recommendation": "建议: 1) 立即隔离受影响资产 2) 重置相关账户密码 3) 开启 MFA",
  "analysis_time_ms": 2340,
  "sources_checked": ["virustotal", "abuseipdb", "threatfox"]
}`;

const CODE_CURL_LOGIN = `# 1. 登录获取令牌
curl -s https://api.secmind.com/api/v1/auth/login \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@example.com", "password": "your-password"}'

# 2. 获取高危告警
curl -s https://api.secmind.com/api/v1/alerts \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -G -d risk_level=high -d limit=10`;

const CODE_CURL_AI = `# 3. 提交 AI 分析
curl -s https://api.secmind.com/api/v1/ai-analysis/events \\
  -X POST \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"alert_id": 123}'

# 4. 批量 IOC 查询
curl -s https://api.secmind.com/api/v1/ioc/batch \\
  -X POST \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"iocs": ["203.0.113.42", "malware.example.com"]}'

# 5. 执行响应动作
curl -s https://api.secmind.com/api/v1/response/actions/5/execute \\
  -X POST \\
  -H "Authorization: Bearer YOUR_TOKEN"`;

const CODE_CURL_RESP = `{
  "execution_id": "dag-exec-abc123",
  "playbook_id": 7,
  "status": "running",
  "progress": 0.45,
  "current_node": "block_ip",
  "nodes_completed": ["detect_anomaly", "query_ioc"],
  "started_at": "2026-05-17T01:28:00Z",
  "estimated_remaining_seconds": 12
}`;

const sidebarSections = [
  {
    id: "introduction",
    icon: "📖",
    label: "简介",
    items: [
      { id: "intro-overview", label: "平台概述" },
      { id: "intro-quickstart", label: "快速开始" },
    ],
  },
  {
    id: "auth",
    icon: "🔑",
    label: "认证",
    items: [
      { id: "auth-login", label: "登录", method: "post" },
      { id: "auth-register", label: "注册", method: "post" },
      { id: "auth-refresh", label: "刷新令牌", method: "post" },
      { id: "auth-sms", label: "短信登录", method: "post" },
      { id: "auth-captcha", label: "验证码", method: "get" },
    ],
  },
  {
    id: "alerts",
    icon: "🚨",
    label: "告警 & AI 分析",
    items: [
      { id: "alerts-list", label: "告警列表", method: "get" },
      { id: "alerts-detail", label: "告警详情", method: "get" },
      { id: "alerts-update-status", label: "更新状态", method: "put" },
      { id: "ai-analysis", label: "AI 分析", method: "post" },
    ],
  },
  {
    id: "chat",
    icon: "💬",
    label: "AI 对话",
    items: [
      { id: "chat-sessions", label: "会话列表", method: "get" },
      { id: "chat-create", label: "创建会话", method: "post" },
      { id: "chat-message", label: "发送消息", method: "post" },
      { id: "chat-report", label: "生成报告", method: "post" },
    ],
  },
  {
    id: "response",
    icon: "⚡",
    label: "安全运营",
    items: [
      { id: "response-actions", label: "响应动作", method: "get" },
      { id: "response-execute", label: "执行动作", method: "post" },
      { id: "hunting", label: "威胁狩猎", method: "get" },
      { id: "playbooks", label: "剧本列表", method: "get" },
    ],
  },
  {
    id: "system",
    icon: "⚙️",
    label: "系统管理",
    items: [
      { id: "users", label: "用户管理", method: "get" },
      { id: "rbac", label: "角色权限", method: "get" },
      { id: "tenants", label: "租户管理", method: "get" },
      { id: "settings", label: "系统设置", method: "get" },
    ],
  },
  {
    id: "intel",
    icon: "🔍",
    label: "情报 & 集成",
    items: [
      { id: "ioc", label: "IOC 查询", method: "get" },
      { id: "integrations", label: "集成应用", method: "get" },
    ],
  },
  {
    id: "errors",
    icon: "⚠️",
    label: "错误处理",
    items: [
      { id: "errors-codes", label: "错误码" },
      { id: "errors-retry", label: "重试策略" },
    ],
  },
];

const methodColors: Record<string, string> = {
  get: "#22c55e",
  post: "#635BFF",
  put: "#f59e0b",
  delete: "#ef4444",
  patch: "#f59e0b",
};

export default function ApiDocsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState("intro-overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCodeTab, setActiveCodeTab] = useState<"python" | "javascript" | "curl">("python");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("secmind-api-docs-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("secmind-api-docs-theme", next);
  };

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el && mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    }
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const el = mainContentRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollPos = el.scrollTop + 120;
      let currentId = "";
      const sections = el.querySelectorAll(".section[id]");
      sections.forEach((section) => {
        if ((section as HTMLElement).offsetTop <= scrollPos) {
          currentId = section.id;
        }
      });
      if (currentId) setActiveSection(currentId);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const copyCode = async (codeId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(codeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSections = searchQuery.trim()
    ? sidebarSections.map((s) => ({
        ...s,
        items: s.items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase())),
      })).filter((s) => s.items.length > 0)
    : sidebarSections;

  const cssVars = theme === "dark"
    ? {
        "--bg-primary": "#0a0a0f",
        "--bg-secondary": "#111118",
        "--bg-tertiary": "#1a1a24",
        "--bg-elevated": "#1e1e2a",
        "--bg-hover": "#252535",
        "--border-color": "#2a2a3a",
        "--border-light": "#33334a",
        "--text-primary": "#e8e8f0",
        "--text-secondary": "#9494b0",
        "--text-tertiary": "#6b6b85",
        "--text-muted": "#55556a",
        "--code-bg": "#13131e",
        "--code-border": "#222233",
        "--accent": "#635BFF",
        "--accent-subtle": "rgba(99,91,255,0.08)",
        "--badge-bg": "rgba(99,91,255,0.12)",
        "--badge-text": "#9b95ff",
        "--required-bg": "rgba(239,68,68,0.12)",
        "--required-text": "#ef4444",
        "--table-stripe": "rgba(255,255,255,0.02)",
        "--table-hover": "rgba(99,91,255,0.04)",
        "--syntax-keyword": "#ff79c6",
        "--syntax-string": "#f1fa8c",
        "--syntax-function": "#50fa7b",
        "--syntax-number": "#bd93f9",
        "--syntax-comment": "#6272a4",
        "--syntax-builtin": "#8be9fd",
        "--syntax-attr": "#f8c555",
      }
    : {
        "--bg-primary": "#fafafa",
        "--bg-secondary": "#f5f5f8",
        "--bg-tertiary": "#eeeef4",
        "--bg-elevated": "#ffffff",
        "--bg-hover": "#eaeaef",
        "--border-color": "#dcdce6",
        "--border-light": "#e8e8f0",
        "--text-primary": "#1a1a2e",
        "--text-secondary": "#555570",
        "--text-tertiary": "#8888a0",
        "--text-muted": "#aaaac0",
        "--code-bg": "#f5f5fa",
        "--code-border": "#e5e5f0",
        "--accent": "#635BFF",
        "--accent-subtle": "rgba(99,91,255,0.08)",
        "--badge-bg": "rgba(99,91,255,0.08)",
        "--badge-text": "#635BFF",
        "--required-bg": "rgba(239,68,68,0.06)",
        "--required-text": "#dc2626",
        "--table-stripe": "rgba(0,0,0,0.015)",
        "--table-hover": "rgba(99,91,255,0.03)",
        "--syntax-keyword": "#d63384",
        "--syntax-string": "#056f00",
        "--syntax-function": "#0550ae",
        "--syntax-number": "#0a0a0a",
        "--syntax-comment": "#8b949e",
        "--syntax-builtin": "#8250df",
        "--syntax-attr": "#953800",
      };

  return (
    <div className="min-h-screen" style={{ ...(cssVars as Record<string, string>), background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* Top Bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 100, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", borderRadius: 6, cursor: "pointer", fontSize: 18 }} aria-label="Toggle navigation">
            <Menu size={18} />
          </button>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #635BFF, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>S</div>
          <span style={{ color: "var(--text-primary)" }}>SecMind</span>
          <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 13, marginLeft: 8 }}>API 参考</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: 6, padding: "6px 14px", color: "var(--text-tertiary)", fontSize: 13, width: 240, transition: "all 0.2s ease" }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, width: "100%", fontFamily: "inherit" }}
            />
            <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "var(--bg-hover)", color: "var(--text-tertiary)", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>⌘K</span>
          </div>
          <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", fontSize: 18 }} aria-label="Toggle theme">
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", height: "calc(100vh - 56px)", marginTop: 56 }}>
        {/* Sidebar */}
        <nav style={{
          width: 260, minWidth: 260, background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-color)", overflowY: "auto", padding: "16px 0",
          position: "relative",
          ...(typeof window !== "undefined" && window.innerWidth < 1024 ? {
            position: "fixed", top: 56, left: 0, bottom: 0, zIndex: 90,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease",
          } : {}),
        }}>
          {filteredSections.map((section) => (
            <div key={section.id} style={{ marginBottom: 4 }}>
              <div
                onClick={() => toggleSection(section.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 20px", cursor: "pointer", color: "var(--text-primary)",
                  fontWeight: 600, fontSize: 13, letterSpacing: 0.3, userSelect: "none",
                  transition: "color 0.2s ease",
                }}
              >
                <span>{section.icon} {section.label}</span>
                <ChevronDown size={12} style={{ color: "var(--text-tertiary)", transform: collapsedSections.has(section.id) ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }} />
              </div>
              <ul style={{ listStyle: "none", display: collapsedSections.has(section.id) ? "none" : "block" }}>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 20px 7px 32px", color: activeSection === item.id ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: 14, textDecoration: "none", transition: "all 0.2s ease",
                        borderLeft: activeSection === item.id ? `2px solid var(--accent)` : "2px solid transparent",
                        background: activeSection === item.id ? "var(--accent-subtle)" : "transparent",
                      }}
                    >
                      {"method" in item && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: methodColors[item.method] || "#888" }} />
                      )}
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Main Content */}
        <main ref={mainContentRef} style={{ flex: 1, overflowY: "auto", padding: "40px 48px", maxWidth: 860 }}>
          {/* Overview Section */}
          <div className="section" id="intro-overview" style={{ marginBottom: 56 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, letterSpacing: -0.5, color: "var(--text-primary)" }}>SecMind API 参考</h1>
            <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
              SecMind 是一款 AI 驱动的安全运营平台 (AI Security Operations Platform)，提供
              告警管理、AI 智能分析、威胁狩猎、自动化剧本响应、多租户管理等核心能力。
              所有 API 请求均通过 HTTPS 发送至 <code style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>https://api.secmind.com/api/v1</code>。
            </p>
            <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
              平台基于 <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>FastAPI</strong> 构建，采用 JWT Bearer Token 鉴权，支持
              RBAC 细粒度权限控制。以下文档覆盖所有公开 API 端点。
            </p>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24, marginTop: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>Base URL</div>
                <code style={{ fontSize: 14, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>https://api.secmind.com/api/v1</code>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>认证方式</div>
                <code style={{ fontSize: 14, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>Bearer Token (JWT)</code>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>版本</div>
                <code style={{ fontSize: 14, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>v1</code>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="section" id="intro-quickstart" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
              快速开始
            </h2>
            <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
              使用 API 前，首先需要注册账户并获取 API 密钥。所有受保护的端点要求在请求头中携带
              <code style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>Authorization: Bearer &lt;token&gt;</code>。
            </p>
            <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
              开发者可通过 <code style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>GET /api/v1/health</code> 检测服务状态，或访问 <code style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>GET /api/v1/api</code> 查看 Scalar 交互式 API 文档。
            </p>
          </div>

          <Divider />

          {/* Auth Section */}
          <AuthSection />
          <Divider />

          {/* Alerts Section */}
          <AlertsSection />
          <Divider />

          {/* Chat Section */}
          <ChatSection />
          <Divider />

          {/* Response Section */}
          <ResponseSection />
          <Divider />

          {/* System Section */}
          <SystemSection />
          <Divider />

          {/* Intel Section */}
          <IntelSection />
          <Divider />

          {/* Errors Section */}
          <ErrorsSection />

          <div style={{ height: 40 }} />
        </main>

        {/* Right Code Panel */}
        <aside style={{ width: 400, minWidth: 400, background: "var(--bg-secondary)", borderLeft: "1px solid var(--border-color)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: 0.4 }}>代码示例</h3>
            <div style={{ display: "flex", gap: 2, background: "var(--bg-tertiary)", borderRadius: 6, padding: 2 }}>
              {(["python", "javascript", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveCodeTab(lang)}
                  style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 500, border: "none",
                    color: activeCodeTab === lang ? "var(--text-primary)" : "var(--text-tertiary)",
                    cursor: "pointer", borderRadius: 4, transition: "all 0.2s ease",
                    background: activeCodeTab === lang ? "var(--bg-hover)" : "none",
                    fontFamily: "inherit",
                  }}
                >
                  {lang === "python" ? "Python" : lang === "javascript" ? "JavaScript" : "cURL"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {activeCodeTab === "python" && <PythonExamples onCopy={copyCode} copiedId={copiedId} />}
            {activeCodeTab === "javascript" && <JSExamples onCopy={copyCode} copiedId={copiedId} />}
            {activeCodeTab === "curl" && <CurlExamples onCopy={copyCode} copiedId={copiedId} />}
          </div>
        </aside>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && typeof window !== "undefined" && window.innerWidth < 1024 && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 80 }}
        />
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border-color)", margin: "40px 0" }} />;
}

function EndpointCard({ method, path, desc, children }: { method: string; path: string; desc?: string; children?: React.ReactNode }) {
  const bgColors: Record<string, string> = {
    get: "rgba(34,197,94,0.12)",
    post: "rgba(99,91,255,0.12)",
    put: "rgba(245,158,11,0.12)",
    delete: "rgba(239,68,68,0.12)",
  };
  const textColors: Record<string, string> = {
    get: "#22c55e",
    post: "#9b95ff",
    put: "#f59e0b",
    delete: "#ef4444",
  };
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5, background: bgColors[method] || "var(--badge-bg)", color: textColors[method] || "var(--badge-text)" }}>
          {method.toUpperCase()}
        </span>
        <span style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{path}</span>
        {desc && <span style={{ fontSize: 14, color: "var(--text-secondary)", width: "100%", marginTop: 4 }}>{desc}</span>}
      </div>
      {children}
    </div>
  );
}

function ParamTable({ headers, rows }: { headers: string[]; rows: { cells: React.ReactNode[]; key?: string }[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13.5, marginTop: 12, border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden" }}>
      <thead>
        <tr style={{ background: "var(--bg-tertiary)" }}>
          {headers.map((h) => (
            <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.key ?? i} style={{ background: i % 2 === 1 ? "var(--table-stripe)" : undefined }}>
            {row.cells.map((cell, j) => (
              <td key={j} style={{ padding: "10px 14px", color: "var(--text-secondary)", borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border-color)", verticalAlign: "top" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuthSection() {
  return (
    <>
      <div className="section" id="auth-login" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>认证</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          平台使用 JWT (HS256) 进行鉴权。访问令牌有效期 60 分钟，过期后可使用刷新令牌获取新的访问令牌。
          连续登录失败 5 次将触发账户锁定。
        </p>
        <EndpointCard method="post" path="/auth/login" desc="使用邮箱和密码登录，返回访问令牌和刷新令牌">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<code key="n" style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>email</code>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>用户注册邮箱</>] },
            { cells: [<code key="n" style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>password</code>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>用户密码</>] },
          ]} />
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)" }}><strong>频率限制:</strong> 5 次/分钟 · <strong>响应:</strong> <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>Token</code> (access_token, refresh_token, token_type)</p>
        </EndpointCard>
      </div>

      <div className="section" id="auth-register" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/auth/register" desc="注册新用户，自动返回令牌">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>email</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>用户邮箱</>] },
            { cells: [<>password</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>密码</>] },
            { cells: [<>name</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>用户姓名</>] },
            { cells: [<>phone</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>手机号</>] },
          ]} />
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)" }}><strong>频率限制:</strong> 3 次/分钟 · <strong>响应:</strong> <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>RegisterResponse</code></p>
        </EndpointCard>
      </div>

      <div className="section" id="auth-refresh" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/auth/refresh" desc="使用刷新令牌获取新的访问令牌">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>refresh_token</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>登录时获得的刷新令牌</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="auth-sms" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/auth/send-sms-code" desc="发送短信验证码">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>phone</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>手机号</>] },
          ]} />
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)" }}><strong>频率限制:</strong> 3 次/分钟 · 验证码发送后可使用 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>POST /auth/phone-login</code> 登录</p>
        </EndpointCard>
      </div>

      <div className="section" id="auth-captcha" style={{ marginBottom: 56 }}>
        <EndpointCard method="get" path="/auth/captcha" desc="获取数学验证码图片">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            返回一张包含数学题目的图片。用户需通过 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>POST /auth/verify-captcha</code> 提交答案进行验证。
          </p>
        </EndpointCard>
        <EndpointCard method="get" path="/auth/me" desc="获取当前登录用户信息">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            需要 Bearer 令牌。返回 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>UserRead</code>，包含 id、name、email、phone、department、position、avatar_url 等字段。
          </p>
        </EndpointCard>
      </div>
    </>
  );
}

function AlertsSection() {
  return (
    <>
      <div className="section" id="alerts-list" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>告警 & AI 分析</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          告警管理是 SecMind 的核心能力。平台支持多维度过滤告警、AI 自动分析研判、风险评分与处置建议。
        </p>
        <EndpointCard method="get" path="/alerts" desc="获取告警列表，支持多维度筛选">
          <p style={{ marginTop: 0, marginBottom: 12, fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>查询参数</p>
          <ParamTable headers={["参数", "类型", "默认", "描述"]} rows={[
            { cells: [<>type</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <><code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12 }}>null</code></>, <>告警类型过滤</>] },
            { cells: [<>risk_level</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <><code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12 }}>null</code></>, <>风险等级过滤（critical / high / medium / low）</>] },
            { cells: [<>status</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <><code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12 }}>null</code></>, <>状态过滤（open / investigating / resolved / closed）</>] },
            { cells: [<>search</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <><code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12 }}>null</code></>, <>搜索关键词（匹配标题和描述）</>] },
            { cells: [<>skip</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>integer</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <><code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12 }}>0</code></>, <>分页偏移量</>] },
            { cells: [<>limit</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>integer</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <><code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12 }}>20</code></>, <>每页数量</>] },
          ]} />
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)" }}><strong>响应:</strong> <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>AlertListResponse</code> — 包含 items (AlertRead[])、total、skip、limit</p>
        </EndpointCard>
      </div>

      <div className="section" id="alerts-detail" style={{ marginBottom: 56 }}>
        <EndpointCard method="get" path="/alerts/{alert_id}" desc="获取单条告警详情">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            返回完整的告警对象，包含 type、title、description、risk_level、status、source_ip、destination_ip、timestamp、ai_score、ai_summary、ai_recommendation 等字段。
          </p>
        </EndpointCard>
      </div>

      <div className="section" id="alerts-update-status" style={{ marginBottom: 56 }}>
        <EndpointCard method="put" path="/alerts/{alert_id}/status" desc="更新告警处理状态">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>status</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>新状态：open / investigating / resolved / closed</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="ai-analysis" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>AI 智能分析</h3>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          AI 分析模块对告警进行自动化研判，支持单条分析和批量提交。分析结果包含威胁评分、处置建议、证据链等信息。
        </p>
        <EndpointCard method="get" path="/ai-analysis/events" desc="获取分析事件列表">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>limit</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>integer</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>返回数量，默认 20</>] },
            { cells: [<>severity</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>严重程度过滤</>] },
            { cells: [<>status</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>分析状态过滤</>] },
            { cells: [<>source</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>数据来源过滤</>] },
          ]} />
        </EndpointCard>
        <EndpointCard method="post" path="/ai-analysis/events" desc="提交告警进行 AI 分析">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>alert_id</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>integer</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>要分析的告警 ID</>] },
          ]} />
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)" }}>也支持批量提交：<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>POST /ai-analysis/events/batch</code>，请求体为 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>BatchAnalyzeRequest</code></p>
        </EndpointCard>
        <EndpointCard method="get" path="/ai-analysis/stats" desc="获取 AI 分析统计概览">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>返回分析总量、各严重程度分布、平均响应时间等统计数据。</p>
        </EndpointCard>
      </div>
    </>
  );
}

function ChatSection() {
  return (
    <>
      <div className="section" id="chat-sessions" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>AI 对话</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          AI 对话模块提供安全助手功能：通过与 LLM 交互进行告警调查分析、生成研判报告、查询 IOC 信息等。所有对话记录持久化保存。
        </p>
        <EndpointCard method="get" path="/ai-chat/sessions" desc="获取当前用户的对话会话列表">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            需要 Bearer 令牌。返回按更新时间倒序排列的会话列表，每个会话包含 id、title、context、alert_id。
          </p>
        </EndpointCard>
      </div>

      <div className="section" id="chat-create" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/ai-chat/sessions" desc="创建新的对话会话">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>title</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>会话标题</>] },
            { cells: [<>alert_id</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>integer</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>关联的告警 ID（可选）</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="chat-message" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/ai-chat/sessions/{session_id}/messages" desc="在指定会话中发送消息">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>content</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>用户输入的消息内容</>] },
            { cells: [<>tool_calls</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>object</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>触发 AI 工具的调用配置</>] },
          ]} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>
            AI 返回的消息包含 role、content、tool_calls、tool_results、confidence 等字段。可用的 AI 工具列表通过 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>GET /ai-chat/tools</code> 获取。
          </p>
        </EndpointCard>
      </div>

      <div className="section" id="chat-report" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/ai-chat/sessions/{session_id}/report" desc="基于会话内容生成安全调查报告">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            自动将对话内容整理为结构化报告。完整的报告管理还包括：<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>GET /ai-chat/reports</code>（报告列表）、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>POST /ai-chat/reports</code>（创建报告）、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>PUT /ai-chat/reports/{'{'}report_id{'}'}</code>（更新报告）。
          </p>
        </EndpointCard>
      </div>
    </>
  );
}

function ResponseSection() {
  return (
    <>
      <div className="section" id="response-actions" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>安全运营</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          安全运营模块覆盖响应动作执行、威胁狩猎、自动化剧本编排（DAG 引擎）等核心 SOAR 能力。
        </p>
        <EndpointCard method="get" path="/response/actions" desc="获取响应动作列表，支持过滤">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>status</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>过滤：pending / approved / executing / completed / failed / cancelled</>] },
            { cells: [<>action_type</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>动作类型过滤</>] },
            { cells: [<>priority</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>优先级过滤</>] },
          ]} />
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)" }}><strong>响应:</strong> 每个动作包含 action_type、target、status、priority、alert_id、ai_reasoning、reasoning_chain、evidence_summary、guardrails 等字段</p>
        </EndpointCard>
      </div>

      <div className="section" id="response-execute" style={{ marginBottom: 56 }}>
        <EndpointCard method="post" path="/response/actions/{action_id}/execute" desc="执行指定的响应动作" />
        <EndpointCard method="post" path="/response/actions/{action_id}/approve" desc="审批响应动作" />
      </div>

      <div className="section" id="hunting" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>威胁狩猎</h3>
        <EndpointCard method="get" path="/hunting/hypotheses" desc="获取威胁狩猎假设列表">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>status</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>过滤：draft / active / validated / invalidated</>] },
            { cells: [<>tactic</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>MITRE ATT&CK 战术编号</>] },
            { cells: [<>confidence</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>number</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>最低置信度阈值</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="playbooks" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>自动化剧本 (DAG 引擎)</h3>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          剧本编辑器支持可视化编排安全响应流程，基于 DAG（有向无环图）引擎执行。每个剧本由 nodes（节点）和 edges（连线）定义。
        </p>
        <EndpointCard method="get" path="/playbooks" desc="获取剧本列表" />
        <EndpointCard method="post" path="/dag/validate" desc="验证 DAG 定义（节点和边）的正确性" />
        <EndpointCard method="post" path="/dag/execute/{playbook_id}" desc="执行指定剧本的 DAG 流程">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>执行状态可通过 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>GET /dag/status/{'{'}execution_id{'}'}</code> 实时查询。</p>
        </EndpointCard>
        <EndpointCard method="get" path="/playbook-editor/templates" desc="获取节点模板列表，按分类组织" />
      </div>
    </>
  );
}

function SystemSection() {
  return (
    <>
      <div className="section" id="users" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>系统管理</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          系统管理模块提供用户、角色权限（RBAC）、多租户、计费、合规等管理能力。需要对应权限（如 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>users:read</code>、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>rbac:write</code>）。
        </p>
        <EndpointCard method="get" path="/users" desc="获取用户列表（需要 users:read 权限）" />
        <EndpointCard method="post" path="/users" desc="创建新用户（需要 users:write 权限）">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>name</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>用户名</>] },
            { cells: [<>email</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>邮箱</>] },
            { cells: [<>password</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>密码</>] },
            { cells: [<>department</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>所属部门</>] },
            { cells: [<>position</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>职位</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="rbac" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>RBAC 权限管理</h3>
        <EndpointCard method="get" path="/rbac/roles" desc="获取所有角色列表" />
        <EndpointCard method="get" path="/rbac/permissions" desc="获取所有权限定义" />
        <EndpointCard method="put" path="/rbac/users/{user_id}/roles" desc="为用户分配角色">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>role_ids</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>array[integer]</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>要分配的角色 ID 列表</>] },
          ]} />
        </EndpointCard>
        <p style={{ marginTop: 16, fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          支持的资源权限前缀示例：<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>alerts:read</code>、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>alerts:write</code>、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>response:execute</code>、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>playbooks:write</code>、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>tenants:read</code>、<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>billing:read</code> 等 20+ 个资源类别。
        </p>
      </div>

      <div className="section" id="tenants" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>多租户管理</h3>
        <EndpointCard method="post" path="/tenants" desc="创建新租户">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>name</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>租户名称</>] },
            { cells: [<>slug</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>唯一标识符</>] },
            { cells: [<>plan</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>套餐：starter / pro / enterprise</>] },
            { cells: [<>owner_email</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>租户管理员邮箱</>] },
          ]} />
        </EndpointCard>
        <EndpointCard method="get" path="/tenants/{tenant_id}/quota" desc="获取租户配额使用情况" />
        <EndpointCard method="post" path="/tenants/{tenant_id}/members" desc="添加租户成员">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>user_id</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>integer</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>用户 ID</>] },
            { cells: [<>role</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>成员角色：admin / member / viewer</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="settings" style={{ marginBottom: 56 }}>
        <EndpointCard method="get" path="/system-settings" desc="读取系统全局设置" />
        <EndpointCard method="get" path="/system/perf" desc="获取系统性能统计">
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>缓存周期 30 秒。返回 CPU 使用率、内存使用量、请求计数、平均响应时间等指标。</p>
        </EndpointCard>
      </div>
    </>
  );
}

function IntelSection() {
  return (
    <>
      <div className="section" id="ioc" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>情报 & 集成</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          IOC 查询模块集成 VirusTotal、AbuseIPDB、ThreatFox 等外部情报源，支持 IP、域名、Hash、URL 等多种 IOC 类型的自动识别与批量查询。
        </p>
        <EndpointCard method="get" path="/ioc/lookup/{ioc_value}" desc="查询 IOC 威胁情报">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>ioc_value</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>IOC 值（IP / 域名 / Hash / URL），系统自动识别类型</>] },
            { cells: [<>ioc_type</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>string</span> <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--badge-text)" }}>optional</span></>, <>手动指定 IOC 类型：ip / domain / hash / url</>] },
          ]} />
        </EndpointCard>
        <EndpointCard method="post" path="/ioc/batch" desc="批量 IOC 查询">
          <ParamTable headers={["参数", "类型", "描述"]} rows={[
            { cells: [<>iocs</>, <><span style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, color: "var(--text-tertiary)", background: "var(--badge-bg)", padding: "1px 8px", borderRadius: 4 }}>array[string]</span> <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 4, background: "var(--required-bg)", color: "var(--required-text)" }}>required</span></>, <>最多 100 个 IOC 值</>] },
          ]} />
        </EndpointCard>
      </div>

      <div className="section" id="integrations" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>集成管理</h3>
        <EndpointCard method="get" path="/integrations/apps" desc="获取已配置的集成应用列表" />
        <EndpointCard method="get" path="/integrations/adapters" desc="获取集成适配器列表" />
        <EndpointCard method="post" path="/integrations/webhooks/inbound" desc="接收外部系统入站 Webhook" />
      </div>
    </>
  );
}

function ErrorsSection() {
  return (
    <>
      <div className="section" id="errors-codes" style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" }}>错误处理</h2>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          API 返回标准 HTTP 状态码和 JSON 错误体。每个错误包含 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>detail</code> 字段（中文描述），部分错误还包含 <code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>param</code> 指明导致错误的参数字段。
        </p>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <ParamTable headers={["状态码", "说明", "常见原因"]} rows={[
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>200</span></>, <>请求成功</>, <>正常返回数据</>] },
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>400</span></>, <>请求参数错误</>, <>缺少必填参数、参数格式错误、数据已存在</>] },
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>401</span></>, <>未授权</>, <>缺少或无效的 Bearer Token、令牌过期</>] },
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>403</span></>, <>权限不足</>, <>当前角色缺少对应资源的操作权限</>] },
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>404</span></>, <>资源不存在</>, <>请求的资源 ID 不存在</>] },
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>429</span></>, <>请求频率超限</>, <>超过速率限制，检查 Retry-After 响应头</>] },
            { cells: [<><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>500</span></>, <>服务器内部错误</>, <>服务器内部错误，请稍后重试</>] },
          ]} />
        </div>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>错误响应示例</h3>
          <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "14px 18px", fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, color: "var(--text-secondary)", overflowX: "auto" }}>
{`{ "detail": "邮箱或密码错误" }`}
          </pre>
        </div>
      </div>

      <div className="section" id="errors-retry" style={{ marginBottom: 56 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28, color: "var(--text-primary)" }}>重试策略</h3>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
          针对 <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>429</strong> 和 <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>5xx</strong> 错误，建议使用指数退避 + 随机抖动（jitter）：
        </p>
        <ul style={{ color: "var(--text-secondary)", fontSize: 14.5, lineHeight: 2, paddingLeft: 20, marginBottom: 16, listStyle: "disc" }}>
          <li>第一次重试：等待 1 秒</li>
          <li>第二次重试：等待 2 秒</li>
          <li>第三次重试：等待 4 秒</li>
          <li>第四次重试：等待 8 秒</li>
          <li>最多重试 5 次，之后优雅降级</li>
        </ul>
        <p style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          对于 429 响应，<code style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 13, background: "var(--badge-bg)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>Retry-After</code> 响应头优先级高于默认退避策略。
        </p>
      </div>
    </>
  );
}

/* ===== Code Examples ===== */

function CodeBlock({ title, codeId, code, onCopy, copiedId, isResponse = false }: { title: string; codeId: string; code: string; onCopy: (id: string, text: string) => void; copiedId: string | null; isResponse?: boolean }) {
  const isCopied = copiedId === codeId;
  return (
    <div style={{ position: "relative", margin: 0, fontSize: 13, lineHeight: 1.6, background: "var(--code-bg)", overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", background: "var(--bg-tertiary)", borderBottom: isResponse ? "1px solid var(--border-color)" : "1px solid var(--border-color)", fontSize: 11, color: isResponse ? "#22c55e" : "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.3 }}>
        <span>{title}</span>
        <button
          onClick={() => onCopy(codeId, code)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid var(--border-color)", color: isCopied ? "#22c55e" : "var(--text-tertiary)", fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer", transition: "all 0.2s ease", fontFamily: "inherit" }}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          {isCopied ? " 已复制!" : " Copy"}
        </button>
      </div>
      <pre style={{ padding: 16, margin: 0, overflowX: "auto", fontFamily: "'SF Mono','Fira Code','JetBrains Mono',Menlo,Consolas,monospace", fontSize: 13, lineHeight: 1.6, tabSize: 2 }}>
        <HighlightedCode code={code} />
      </pre>
    </div>
  );
}

function HighlightedCode({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>
          <HighlightLine line={line} />
        </div>
      ))}
    </>
  );
}

function HighlightLine({ line }: { line: string }) {
  const isJSON = line.includes('"id"') || line.includes('"alert_id"') || line.includes('"items"') || line.includes('"status"');
  if (isJSON) return <span suppressHydrationWarning dangerouslySetInnerHTML={{ __html: highlightJSON(line) }} />;
  return <span suppressHydrationWarning dangerouslySetInnerHTML={{ __html: highlightGeneric(line) }} />;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJSON(line: string): string {
  let html = escapeHtml(line);
  html = html.replace(/(&quot;)(\w+)(&quot;)(\s*:)/g, '<span style="color:var(--syntax-attr)">$1$2$3</span>$4');
  html = html.replace(/(:\s*)(&quot;)([^&]*?)(&quot;)/g, '$1<span style="color:var(--syntax-string)">$2$3$4</span>');
  html = html.replace(/(:\s*)(\d+\.?\d*)/g, '$1<span style="color:var(--syntax-number)">$2</span>');
  html = html.replace(/(:\s*)(true|false)/g, '$1<span style="color:#ff79c6">$2</span>');
  html = html.replace(/(:\s*)(null)/g, '$1<span style="color:#6272a4">$2</span>');
  return html;
}

function highlightGeneric(line: string): string {
  let html = escapeHtml(line);
  if (/^\s*#/.test(html) || /^\s*\/\//.test(html)) {
    html = `<span style="color:var(--syntax-comment);font-style:italic">${html}</span>`;
    return html;
  }
  html = html.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span style="color:var(--syntax-string)">$&</span>');
  const keywords = /\b(import|from|def|class|return|if|else|elif|for|while|break|continue|try|except|finally|with|as|pass|raise|and|or|not|in|is|lambda|yield|async|await|const|let|var|function|export|default|new|typeof|throw|catch|switch|case)\b/g;
  html = html.replace(keywords, '<span style="color:var(--syntax-keyword)">$1</span>');
  html = html.replace(/\b(print|console|JSON|Math|Array|Object|String|Number|fetch|require|setTimeout|setInterval|Promise|requests)\b/g, '<span style="color:var(--syntax-builtin)">$1</span>');
  html = html.replace(/\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, '<span style="color:var(--syntax-function)">$1</span>');
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:var(--syntax-number)">$1</span>');
  return html;
}

function PythonExamples({ onCopy, copiedId }: { onCopy: (id: string, text: string) => void; copiedId: string | null }) {
  return (
    <div>
      <CodeBlock title="login.py" codeId="py-login" code={CODE_PY_LOGIN} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="ai_analysis.py" codeId="py-ai" code={CODE_PY_AI} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="ioc_lookup.py" codeId="py-ioc" code={CODE_PY_IOC} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="ai_chat.py" codeId="py-chat" code={CODE_PY_CHAT} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="Response: Alerts List" codeId="py-resp" code={CODE_PY_RESP} onCopy={onCopy} copiedId={copiedId} isResponse />
    </div>
  );
}

function JSExamples({ onCopy, copiedId }: { onCopy: (id: string, text: string) => void; copiedId: string | null }) {
  return (
    <div>
      <CodeBlock title="login.js" codeId="js-login" code={CODE_JS_LOGIN} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="ai_chat.js" codeId="js-chat" code={CODE_JS_CHAT} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="Response: AI Analysis" codeId="js-resp" code={CODE_JS_RESP} onCopy={onCopy} copiedId={copiedId} isResponse />
    </div>
  );
}

function CurlExamples({ onCopy, copiedId }: { onCopy: (id: string, text: string) => void; copiedId: string | null }) {
  return (
    <div>
      <CodeBlock title="terminal" codeId="curl-login" code={CODE_CURL_LOGIN} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="terminal" codeId="curl-ai" code={CODE_CURL_AI} onCopy={onCopy} copiedId={copiedId} />
      <CodeBlock title="Response: DAG Execution Status" codeId="curl-resp" code={CODE_CURL_RESP} onCopy={onCopy} copiedId={copiedId} isResponse />
    </div>
  );
}
