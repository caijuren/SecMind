"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  Hash,
} from "lucide-react";

const sidebarSections = [
  {
    id: "intro",
    icon: "\u{1F4D6}",
    label: "平台简介",
    items: [
      { id: "intro-overview", label: "关于 SecMind" },
      { id: "intro-core", label: "核心功能" },
    ],
  },
  {
    id: "quickstart",
    icon: "\u{1F680}",
    label: "快速入门",
    items: [
      { id: "qs-login", label: "登录与注册" },
      { id: "qs-wizard", label: "新手引导流程" },
      { id: "qs-nav", label: "界面导览" },
    ],
  },
  {
    id: "dashboard",
    icon: "\u{1F4CA}",
    label: "运营总览",
    items: [
      { id: "dash-hub", label: "运营总览" },
      { id: "dash-board", label: "运营看板" },
      { id: "dash-screen", label: "态势大屏" },
      { id: "dash-metrics", label: "运营指标" },
    ],
  },
  {
    id: "alerts",
    icon: "\u{1F6A8}",
    label: "告警管理",
    items: [
      { id: "alert-center", label: "告警中心" },
      { id: "alert-signals", label: "信号管理" },
      { id: "alert-triage", label: "告警处理流程" },
    ],
  },
  {
    id: "ai",
    icon: "\u{1F916}",
    label: "AI 智能分析",
    items: [
      { id: "ai-chat", label: "AI 调查助手" },
      { id: "ai-investigate", label: "AI 研判" },
      { id: "ai-work", label: "AI 工作台" },
    ],
  },
  {
    id: "response",
    icon: "\u{26A1}",
    label: "响应处置",
    items: [
      { id: "resp-auto", label: "自动处置" },
      { id: "resp-strategy", label: "处置策略" },
      { id: "resp-records", label: "执行记录" },
    ],
  },
  {
    id: "hunting",
    icon: "\u{1F3AF}",
    label: "威胁狩猎",
    items: [
      { id: "hunt-overview", label: "威胁狩猎概览" },
      { id: "hunt-hypothesis", label: "创建假设" },
      { id: "hunt-ioc", label: "IOC 批量查询" },
    ],
  },
  {
    id: "playbook",
    icon: "\u{1F527}",
    label: "自动化编排",
    items: [
      { id: "pb-overview", label: "剧本管理" },
      { id: "pb-editor", label: "可视化编辑器" },
      { id: "pb-nodes", label: "节点类型说明" },
    ],
  },
  {
    id: "admin",
    icon: "\u{1F465}",
    label: "用户与权限",
    items: [
      { id: "admin-users", label: "用户管理" },
      { id: "admin-rbac", label: "角色权限 (RBAC)" },
      { id: "admin-audit", label: "审计日志" },
    ],
  },
  {
    id: "system",
    icon: "\u{2699}\u{FE0F}",
    label: "系统管理",
    items: [
      { id: "sys-settings", label: "系统设置" },
      { id: "sys-datasource", label: "数据源管理" },
      { id: "sys-assets", label: "资产管理" },
    ],
  },
  {
    id: "tenant",
    icon: "\u{1F3E2}",
    label: "租户与计费",
    items: [
      { id: "tenant-mgmt", label: "租户管理" },
      { id: "tenant-billing", label: "订阅与账单" },
    ],
  },
  {
    id: "compliance",
    icon: "\u{1F4CB}",
    label: "合规管理",
    items: [
      { id: "comp-framework", label: "合规框架" },
      { id: "comp-assessment", label: "评估管理" },
    ],
  },
  {
    id: "integrations",
    icon: "\u{1F50C}",
    label: "集成与知识",
    items: [
      { id: "int-integrations", label: "集成中心" },
      { id: "int-knowledge", label: "知识库" },
    ],
  },
  {
    id: "faq",
    icon: "\u{2753}",
    label: "附录",
    items: [
      { id: "faq-common", label: "常见问题" },
      { id: "faq-keys", label: "快捷键" },
    ],
  },
];

export default function GuidePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState("intro-overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("secmind-guide-theme");
    if (saved === "light" || saved === "dark") {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => setTheme(saved));
      } else {
        Promise.resolve().then(() => setTheme(saved));
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("secmind-guide-theme", next);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
        if (input) input.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filteredSections = searchQuery.trim()
    ? sidebarSections
        .map((s) => ({
          ...s,
          items: s.items.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((s) => s.items.length > 0)
    : sidebarSections;

  const cssVars =
    theme === "dark"
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
          "--accent": "#635BFF",
          "--accent-hover": "#7A73FF",
          "--accent-glow": "rgba(99,91,255,0.15)",
          "--accent-subtle": "rgba(99,91,255,0.08)",
          "--badge-bg": "rgba(99,91,255,0.12)",
          "--badge-text": "#9b95ff",
          "--tag-bg": "rgba(99,91,255,0.1)",
          "--shadow-lg": "0 8px 32px rgba(0,0,0,0.4)",
          "--step-bg": "rgba(99,91,255,0.1)",
          "--step-text": "#9b95ff",
          "--tip-bg": "rgba(34,197,94,0.08)",
          "--tip-border": "rgba(34,197,94,0.2)",
          "--tip-text": "#4ade80",
          "--warn-bg": "rgba(245,158,11,0.08)",
          "--warn-border": "rgba(245,158,11,0.2)",
          "--warn-text": "#fbbf24",
          "--table-stripe": "rgba(255,255,255,0.02)",
          "--table-hover": "rgba(99,91,255,0.04)",
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
          "--accent": "#635BFF",
          "--accent-hover": "#7A73FF",
          "--accent-glow": "rgba(99,91,255,0.15)",
          "--accent-subtle": "rgba(99,91,255,0.08)",
          "--badge-bg": "rgba(99,91,255,0.08)",
          "--badge-text": "#635BFF",
          "--tag-bg": "rgba(99,91,255,0.06)",
          "--shadow-lg": "0 8px 32px rgba(0,0,0,0.08)",
          "--step-bg": "rgba(99,91,255,0.08)",
          "--step-text": "#635BFF",
          "--tip-bg": "rgba(34,197,94,0.06)",
          "--tip-border": "rgba(34,197,94,0.15)",
          "--tip-text": "#16a34a",
          "--warn-bg": "rgba(245,158,11,0.06)",
          "--warn-border": "rgba(245,158,11,0.15)",
          "--warn-text": "#d97706",
          "--table-stripe": "rgba(0,0,0,0.015)",
          "--table-hover": "rgba(99,91,255,0.03)",
        };

  const baseStyle: React.CSSProperties = {
    ...(cssVars as Record<string, string>),
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', Roboto, Helvetica, Arial, sans-serif",
    lineHeight: 1.6,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  };

  return (
    <div style={{ ...baseStyle, minHeight: "100vh", overflow: "hidden" }}>
      {/* Top Bar */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 100,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              border: "1px solid var(--border-color)",
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 18,
            }}
            aria-label="Toggle navigation"
          >
            <Menu size={18} />
          </button>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #635BFF, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span style={{ color: "var(--text-primary)" }}>SecMind AI</span>
          <span
            style={{
              color: "var(--text-tertiary)",
              fontWeight: 400,
              fontSize: 13,
              marginLeft: 8,
            }}
          >
            用户操作手册
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              padding: "6px 14px",
              color: "var(--text-tertiary)",
              fontSize: 13,
              width: 240,
              transition: "all 0.2s ease",
            }}
          >
            <Search size={14} />
            <input
              type="text"
              placeholder="搜索操作指南..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 13,
                width: "100%",
                fontFamily: "inherit",
              }}
            />
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--bg-hover)",
                color: "var(--text-tertiary)",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}
            >
              ⌘K
            </span>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              fontSize: 18,
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Layout */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 56px)",
          marginTop: 56,
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: 250,
            minWidth: 250,
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-color)",
            overflowY: "auto",
            padding: "16px 0",
          }}
        >
          {filteredSections.map((section) => (
            <div key={section.id} style={{ marginBottom: 4 }}>
              <div
                onClick={() => toggleSection(section.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 18px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: 12.5,
                  letterSpacing: 0.2,
                  userSelect: "none",
                  transition: "color 0.2s ease",
                }}
              >
                <span>
                  {section.icon} {section.label}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "var(--text-tertiary)",
                    transform: collapsedSections.has(section.id)
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                  }}
                />
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: collapsedSections.has(section.id)
                    ? "none"
                    : "block",
                }}
              >
                {section.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 18px 6px 30px",
                        color:
                          activeSection === item.id
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                        fontSize: 13.5,
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                        borderLeft:
                          activeSection === item.id
                            ? "2px solid var(--accent)"
                            : "2px solid transparent",
                        background:
                          activeSection === item.id
                            ? "var(--accent-subtle)"
                            : "transparent",
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Main Content */}
        <main
          ref={mainContentRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "40px 48px",
            maxWidth: 860,
          }}
        >
          <IntroOverviewSection />
          <IntroCoreSection />
          <DocDivider />

          <QuickStartLoginSection />
          <QuickStartWizardSection />
          <QuickStartNavSection />
          <DocDivider />

          <DashboardHubSection />
          <DashboardBoardSection />
          <DashboardScreenSection />
          <DashboardMetricsSection />
          <DocDivider />

          <AlertCenterSection />
          <AlertSignalsSection />
          <AlertTriageSection />
          <DocDivider />

          <AiChatSection />
          <AiInvestigateSection />
          <AiWorkSection />
          <DocDivider />

          <ResponseAutoSection />
          <ResponseStrategySection />
          <ResponseRecordsSection />
          <DocDivider />

          <HuntOverviewSection />
          <HuntHypothesisSection />
          <HuntIocSection />
          <DocDivider />

          <PlaybookOverviewSection />
          <PlaybookEditorSection />
          <PlaybookNodesSection />
          <DocDivider />

          <AdminUsersSection />
          <AdminRbacSection />
          <AdminAuditSection />
          <DocDivider />

          <SysSettingsSection />
          <SysDatasourceSection />
          <SysAssetsSection />
          <DocDivider />

          <TenantMgmtSection />
          <TenantBillingSection />
          <DocDivider />

          <CompFrameworkSection />
          <CompAssessmentSection />
          <DocDivider />

          <IntIntegrationsSection />
          <IntKnowledgeSection />
          <DocDivider />

          <FaqCommonSection />
          <FaqKeysSection />

          <div style={{ height: 40 }} />
        </main>

        {/* Right Info Panel */}
        <aside
          style={{
            width: 380,
            minWidth: 380,
            background: "var(--bg-secondary)",
            borderLeft: "1px solid var(--border-color)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-color)",
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "var(--text-primary)",
              }}
            >
              📌 快速参考
            </h3>
          </div>
          <div style={{ padding: 20 }}>
            <InfoTip
              title="首次使用？"
              content={
                <>
                  跟随新手引导完成：选择套餐 → 连接数据源 → 邀请团队成员 →
                  开始使用。
                  <br />
                  <a
                    href="#qs-wizard"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("qs-wizard");
                    }}
                    style={{ color: "var(--accent)", fontSize: 13 }}
                  >
                    查看新手引导 →
                  </a>
                </>
              }
            />
            <InfoTip
              title="告警处理流程"
              content={
                <>
                  发现 → AI 研判 → 响应处置 → 闭环确认。
                  <br />
                  <a
                    href="#alert-triage"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("alert-triage");
                    }}
                    style={{ color: "var(--accent)", fontSize: 13 }}
                  >
                    查看完整流程 →
                  </a>
                </>
              }
            />
            <InfoTip
              title="常用入口"
              content={
                <>
                  <a
                    href="#dash-hub"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("dash-hub");
                    }}
                    style={{ color: "var(--accent)" }}
                  >
                    📊 运营总览
                  </a>
                  <br />
                  <a
                    href="#alert-center"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("alert-center");
                    }}
                    style={{ color: "var(--accent)" }}
                  >
                    🚨 告警中心
                  </a>
                  <br />
                  <a
                    href="#ai-chat"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("ai-chat");
                    }}
                    style={{ color: "var(--accent)" }}
                  >
                    💬 AI 调查助手
                  </a>
                  <br />
                  <a
                    href="#resp-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("resp-auto");
                    }}
                    style={{ color: "var(--accent)" }}
                  >
                    ⚡ 响应处置
                  </a>
                  <br />
                  <a
                    href="#hunt-overview"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("hunt-overview");
                    }}
                    style={{ color: "var(--accent)" }}
                  >
                    🎯 威胁狩猎
                  </a>
                </>
              }
            />
            <InfoTip
              title="用户角色说明"
              content={
                <>
                  <Badge variant="purple" style={{ marginRight: 4 }}>
                    管理员
                  </Badge>{" "}
                  全部权限
                  <br />
                  <Badge variant="green" style={{ marginRight: 4 }}>
                    分析师
                  </Badge>{" "}
                  安全运营操作
                  <br />
                  <Badge variant="yellow" style={{ marginRight: 4 }}>
                    观察者
                  </Badge>{" "}
                  只读查看
                </>
              }
            />
            <InfoTip
              title="告警风险等级"
              content={
                <>
                  <Badge variant="red" style={{ marginRight: 4 }}>
                    P0 紧急
                  </Badge>{" "}
                  立即处理
                  <br />
                  <Badge variant="yellow" style={{ marginRight: 4 }}>
                    P1 高危
                  </Badge>{" "}
                  尽快处理
                  <br />
                  <Badge variant="purple" style={{ marginRight: 4 }}>
                    P2 中危
                  </Badge>{" "}
                  常规处理
                  <br />
                  <Badge
                    style={{
                      background: "var(--text-muted)",
                      color: "#fff",
                      marginRight: 4,
                    }}
                  >
                    P3 低危
                  </Badge>{" "}
                  观察记录
                </>
              }
            />
            <InfoTip
              title="套餐概览"
              content="入门版 299元/月 · 专业版 999元/月\n企业版 2999元/月 · 免费试用 14天"
            />
            <InfoTip
              title="快捷键"
              content={
                <>
                  <InlineCode>⌘K</InlineCode> 搜索 ·{" "}
                  <InlineCode>⌘S</InlineCode> 保存
                  <br />
                  <InlineCode>Delete</InlineCode> 删除节点
                </>
              }
            />
          </div>
        </aside>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 80,
          }}
        />
      )}
    </div>
  );
}

/* ===== Reusable Components ===== */

function DocDivider() {
  return (
    <div
      style={{ height: 1, background: "var(--border-color)", margin: "40px 0" }}
    />
  );
}

function SectionTitle({
  anchorId,
  children,
}: {
  anchorId?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      style={{
        fontSize: 20,
        fontWeight: 650,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border-color)",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {anchorId && (
        <Hash
          size={16}
          style={{
            color: "var(--accent)",
            opacity: 0,
            transition: "opacity 0.2s ease",
          }}
          className="section-anchor"
        />
      )}
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 12,
        marginTop: 28,
        color: "var(--text-primary)",
      }}
    >
      {children}
    </h3>
  );
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        fontSize: 14.5,
        color: "var(--text-secondary)",
        marginBottom: 16,
        lineHeight: 1.7,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: 13,
        background: "var(--tag-bg)",
        color: "var(--accent)",
        padding: "1px 6px",
        borderRadius: 4,
      }}
    >
      {children}
    </code>
  );
}

function FeatureCard({
  emoji,
  title,
  children,
}: {
  emoji?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        transition: "border-color 0.2s ease",
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginTop: 0,
            marginBottom: 12,
            color: "var(--text-primary)",
          }}
        >
          {emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function StepList({
  steps,
}: {
  steps: { num: string; text: React.ReactNode }[];
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: "12px 0",
        counterReset: "step",
      }}
    >
      {steps.map((step, i) => (
        <StepItem key={i} num={step.num}>
          {step.text}
        </StepItem>
      ))}
    </ul>
  );
}

function StepItem({
  num,
  children,
}: {
  num: string;
  children: React.ReactNode;
}) {
  return (
    <li
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--border-color)",
        fontSize: 14,
        color: "var(--text-secondary)",
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--step-bg)",
          color: "var(--step-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {num}
      </span>
      <span>{children}</span>
    </li>
  );
}

function TipBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 13.5,
        margin: "16px 0",
        lineHeight: 1.6,
        background: "var(--tip-bg)",
        border: "1px solid var(--tip-border)",
        color: "var(--tip-text)",
        ...style,
      }}
    >
      <strong>💡 提示：</strong>
      {children}
    </div>
  );
}

function FeatTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
        fontSize: 13.5,
        marginTop: 12,
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <thead>
        <tr style={{ background: "var(--bg-tertiary)" }}>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            style={{
              background: i % 2 === 1 ? "var(--table-stripe)" : undefined,
            }}
          >
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  padding: "10px 14px",
                  color:
                    j === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                  borderBottom:
                    i === rows.length - 1
                      ? "none"
                      : "1px solid var(--border-color)",
                  verticalAlign: "top",
                  fontWeight: j === 0 ? 500 : undefined,
                  whiteSpace: j === 0 ? "nowrap" : undefined,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Badge({
  children,
  variant = "purple",
  style,
}: {
  children: React.ReactNode;
  variant?: "purple" | "green" | "red" | "yellow";
  style?: React.CSSProperties;
}) {
  const colors: Record<string, { bg: string; color: string }> = {
    purple: { bg: "var(--badge-bg)", color: "var(--badge-text)" },
    green: { bg: "rgba(34,197,94,0.1)", color: "#22c55e" },
    red: { bg: "rgba(239,68,68,0.08)", color: "#ef4444" },
    yellow: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: colors[variant].bg,
        color: colors[variant].color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function InfoCard({
  label,
  value,
  desc,
}: {
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-tertiary)",
        padding: 14,
        borderRadius: 8,
        border: "1px solid var(--border-color)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: 0.3,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          marginTop: 2,
        }}
      >
        {desc}
      </div>
    </div>
  );
}

function InfoTip({
  title,
  content,
  children,
}: {
  title: string;
  content?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
        color: "var(--text-secondary)",
        lineHeight: 1.6,
      }}
    >
      <strong style={{ color: "var(--accent)" }}>{title}</strong>
      <br />
      {content || children}
    </div>
  );
}

function Ul({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <ul
      style={{
        color: "var(--text-secondary)",
        fontSize: 14,
        lineHeight: 1.8,
        paddingLeft: 18,
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

/* ===== Content Sections ===== */

function IntroOverviewSection() {
  return (
    <div className="section" id="intro-overview" style={{ marginBottom: 56 }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 12,
          letterSpacing: -0.5,
          color: "var(--text-primary)",
        }}
      >
        SecMind AI 安全运营平台
      </h1>
      <P>
        SecMind 是一款 AI 驱动的安全运营平台（AI Security Operations
        Platform），致力于通过人工智能技术提升安全运营效率。平台覆盖告警管理、AI
        智能分析、威胁狩猎、自动化响应（SOAR）、多租户管理等核心安全运营场景。
      </P>
      <P>
        平台采用 AI Agent 多智能体架构，7 个 AI
        角色协同工作——从 SOC 分析员到取证分析员、从威胁情报员到推理引擎——实现安全事件的自动研判、处置建议生成和威胁追踪。
      </P>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <InfoCard label="版本" value="v2.2" desc="SecMind AI SOC Platform" />
        <InfoCard label="架构" value="FastAPI + Next.js" desc="前后端分离" />
        <InfoCard label="AI 引擎" value="多 Agent 协同" desc="7 个 AI 智能体" />
        <InfoCard label="部署方式" value="私有化 / SaaS" desc="支持多租户" />
      </div>
    </div>
  );
}

function IntroCoreSection() {
  return (
    <div className="section" id="intro-core" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="intro-core">核心功能一览</SectionTitle>
      <FeatTable
        headers={["模块", "功能说明", "适用角色"]}
        rows={[
          ["运营总览", "一体化运营看板，展示告警趋势、KPI、AI 分析能力概览", "所有用户"],
          ["告警管理", "多维度过滤、状态跟踪、通知通道配置", "分析师、管理员"],
          ["AI 智能分析", "对话式安全助手 + 自动研判 + 置信度评分", "分析师"],
          ["响应处置", "AI 驱动的自动响应、审批流、执行跟踪、回滚", "分析师、SOC 经理"],
          ["威胁狩猎", "基于 MITRE ATT&CK 的假设驱动威胁发现", "高级分析师"],
          ["自动化编排", "可视化 DAG 剧本编辑器，支持条件/动作/审批节点", "管理员"],
          ["态势大屏", "实时攻击地图、安全评分、MITRE 矩阵、威胁跑马灯", "所有用户"],
          ["系统管理", "用户、RBAC、审计、数据源、系统设置", "管理员"],
          ["租户与计费", "多租户管理、套餐订阅、订单发票", "管理员"],
          ["合规管理", "合规框架评估、控制项管理、报告生成", "合规人员、管理员"],
        ]}
      />
    </div>
  );
}

function QuickStartLoginSection() {
  return (
    <div className="section" id="qs-login" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="qs-login">快速入门</SectionTitle>
      <H3>登录与注册</H3>
      <StepList
        steps={[
          {
            num: "1",
            text: (
              <>
                访问平台地址，进入<strong>登录页面</strong>
                。支持邮箱密码登录或手机号 + 短信验证码登录。
              </>
            ),
          },
          {
            num: "2",
            text: (
              <>
                首次使用点击<strong>「注册」</strong>
                ，填写邮箱、密码、姓名、手机号完成注册，系统自动返回令牌并登录。
              </>
            ),
          },
          {
            num: "3",
            text: (
              <>
                若忘记密码，点击<strong>「忘记密码」</strong>
                通过邮箱重置。
              </>
            ),
          },
          {
            num: "4",
            text: (
              <>
                登录后进入<strong>运营总览</strong>
                页面。顶部栏右侧显示用户头像、角色、通知铃铛和主题切换。
              </>
            ),
          },
        ]}
      />
      <TipBox>连续 5 次登录失败将触发账户锁定，请联系管理员解锁。</TipBox>
    </div>
  );
}

function QuickStartWizardSection() {
  return (
    <div className="section" id="qs-wizard" style={{ marginBottom: 56 }}>
      <H3>新手引导流程</H3>
      <P>
        首次使用时，建议跟随<strong>新手引导</strong>
        快速完成初始化配置：
      </P>
      <StepList
        steps={[
          {
            num: "1",
            text: (
              <>
                <strong>选择套餐：</strong>
                免费试用（14 天 / 5 用户 / 100 条告警/天）或付费套餐。
              </>
            ),
          },
          {
            num: "2",
            text: (
              <>
                <strong>连接数据源：</strong>
                添加防火墙、EDR、VPN
                等安全设备，配置 IP、端口、协议（Syslog/API/Kafka）。
              </>
            ),
          },
          {
            num: "3",
            text: (
              <>
                <strong>邀请团队成员：</strong>
                添加用户并分配角色（管理员 / 分析师 / 观察者）。
              </>
            ),
          },
          {
            num: "4",
            text: (
              <>
                <strong>开始使用：</strong>
                进入工作台，查看实时告警和数据流。
              </>
            ),
          },
        ]}
      />
      <TipBox>
        新手引导可在顶部栏用户菜单的「新手引导」入口重新打开。
      </TipBox>
    </div>
  );
}

function QuickStartNavSection() {
  return (
    <div className="section" id="qs-nav" style={{ marginBottom: 56 }}>
      <H3>界面导览</H3>
      <P>平台界面分为三个主要区域：</P>
      <Ul>
        <Li>
          <strong>左侧导航栏：</strong>
          可折叠，包含运营看板、AI 分析、告警通知、安全调查、响应处置、威胁狩猎、自动化编排等核心模块入口。底部有收缩/展开按钮。
        </Li>
        <Li>
          <strong>顶部栏：</strong>
          面包屑导航、上下文搜索框、主题切换、语言切换（中/英）、通知铃铛和用户菜单。
        </Li>
        <Li>
          <strong>中间主内容区：</strong>
          根据当前功能模块显示对应的操作界面。
        </Li>
      </Ul>
      <P>
        页面上方搜索框支持按关键词搜索告警、案件、资源等。快捷键{" "}
        <InlineCode>⌘K</InlineCode> 可快速聚焦搜索。
      </P>
    </div>
  );
}

function DashboardHubSection() {
  return (
    <div className="section" id="dash-hub" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="dash-hub">运营总览</SectionTitle>
      <FeatureCard emoji="📊" title="运营总览（Dashboard Hub）">
        <P>首页入口，提供平台的整体态势概览。包含三个标签页：</P>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          运营概览
        </h4>
        <Ul>
          <Li>
            <strong>KPI 卡片：</strong>
            待处理告警、进行中案件、活跃威胁、AI
            新发现，含环比变化和状态提示。
          </Li>
          <Li>
            <strong>紧急告警区域：</strong>
            高亮显示最紧急的 3
            条告警，每条显示风险等级、时间、来源、摘要和 AI 分析状态。
          </Li>
          <Li>
            <strong>实时告警流：</strong>
            WebSocket 实时推送最新告警。
          </Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          态势大屏
        </h4>
        <Ul>
          <Li>
            今日告警数、设备在线率、MTTD（平均检测时间）、自动处置率等关键指标。
          </Li>
          <Li>
            告警趋势柱状图、攻击类型分布、系统健康状态、实时事件流。
          </Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          运营指标
        </h4>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            6 大效率指标：MTTD、MTTR（平均响应时间）、告警疲劳指数、误报率、自动处置率、知识库命中率。
          </Li>
          <Li>行业基准对比、改进建议、团队绩效排名。</Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function DashboardBoardSection() {
  return (
    <div className="section" id="dash-board" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📈" title="运营看板">
        <P>
          <strong>入口：</strong>
          左侧导航「运营看板」
        </P>
        <P>
          提供实时态势感知。支持时间范围筛选（最近1小时 / 6小时 / 今天 /
          本周）。
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>实时告警横幅：</strong>
            显示新告警数量，点击确认。
          </Li>
          <Li>
            <strong>AI 能力概览：</strong>
            推理次数、处置率、准确率、响应时间。点击「查看AI分析详情」进入
            AI 工作台。
          </Li>
          <Li>
            <strong>AI 能力展示（三标签）：</strong>
            数据输入流（数据源状态）、AI 分析结果（多智能体分析流水线）、AI
            协作（7 个 AI 智能体角色）。
          </Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function DashboardScreenSection() {
  return (
    <div className="section" id="dash-screen" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="🖥️" title="态势大屏">
        <P>
          <strong>入口：</strong>
          左侧导航「态势大屏」
        </P>
        <P>
          安全运营中心（SOC）大屏展示模式，适合投屏或大屏显示器。包含：
        </P>
        <Ul>
          <Li>
            <strong>全球攻击态势地图：</strong>
            展示攻击源和目标的地理分布。
          </Li>
          <Li>
            <strong>安全评分仪表盘：</strong>
            动画仪表盘 0-100 分，综合安全态势评分。
          </Li>
          <Li>
            <strong>威胁统计：</strong>
            KPI 卡片组。
          </Li>
          <Li>
            <strong>24 小时告警趋势图：</strong>
            折线图展示过去 24 小时告警数量变化。
          </Li>
          <Li>
            <strong>MITRE ATT&CK 矩阵：</strong>
            攻击技术热力图。
          </Li>
          <Li>
            <strong>攻击类型分布 TOP5：</strong>
            饼图/柱状图。
          </Li>
          <Li>
            <strong>实时威胁跑马灯：</strong>
            底部滚动显示最新威胁事件，支持演示模式全屏展示。
          </Li>
        </Ul>
        <TipBox style={{ marginBottom: 0 }}>
          点击「演示模式」可切换全屏展示，适合在监控大屏上持续显示。页面每 5
          秒自动刷新。
        </TipBox>
      </FeatureCard>
    </div>
  );
}

function DashboardMetricsSection() {
  return (
    <div className="section" id="dash-metrics" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📉" title="运营指标">
        <P>
          <strong>入口：</strong>
          左侧导航「运营指标」
        </P>
        <P>
          安全运营效率指标分析页面，包含所有 KPI 的详细图表和历史趋势。
        </P>
      </FeatureCard>
    </div>
  );
}

function AlertCenterSection() {
  return (
    <div className="section" id="alert-center" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="alert-center">告警管理</SectionTitle>
      <FeatureCard emoji="🔔" title="告警中心">
        <P>
          <strong>入口：</strong>
          左侧导航「告警通知」
        </P>
        <P>集中管理所有安全告警，支持多维度筛选和批量操作。</P>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          筛选与搜索
        </h4>
        <Ul>
          <Li>
            <strong>风险等级快速过滤：</strong>
            P0 紧急 / P1 高危 / P2 中危 / P3
            低危 — 点击卡片即可过滤，同时显示该等级告警数量。
          </Li>
          <Li>
            <strong>搜索框：</strong>
            按告警标题、描述或 ID 搜索。
          </Li>
          <Li>
            <strong>来源筛选：</strong>
            防火墙 / IDS / EDR / SIEM / 态势感知。
          </Li>
          <Li>
            <strong>状态筛选：</strong>
            待处理 / 处理中 / 已确认 / 已静默。
          </Li>
          <Li>支持「清除筛选」一键重置所有筛选项。</Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          告警卡片操作
        </h4>
        <P>每条告警显示：时间、风险等级标签、来源标签、状态标签、标题和描述摘要。</P>
        <P>支持的操作按钮：</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <Badge variant="purple">确认</Badge> — 标记为已确认，交由 AI 或分析师跟进
          </Li>
          <Li>
            <Badge variant="yellow">静默</Badge> — 临时静音，不再重复告警
          </Li>
          <Li>
            <Badge variant="green">查看</Badge> — 展开详情或跳转到 AI 研判
          </Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          通知通道配置
        </h4>
        <P>告警中心下方展示各通知通道的状态：</P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>邮件通知：</strong>
            已启用，P0/P1 实时推送
          </Li>
          <Li>
            <strong>企微通知：</strong>
            已启用，P0 @all
          </Li>
          <Li>
            <strong>钉钉通知：</strong>
            可启用
          </Li>
          <Li>
            <strong>短信通知：</strong>
            已启用，P0 级别手机短信告警
          </Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function AlertSignalsSection() {
  return (
    <div className="section" id="alert-signals" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📡" title="信号管理">
        <P>
          <strong>入口：</strong>
          左侧导航「原始信号」
        </P>
        <P>
          实时信号流处理页面。信号来自 6 种数据源（EDR、VPN、IAM、邮件、防火墙、DNS）。
        </P>
        <P>包含三个标签页：</P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>实时信号：</strong>
            左侧展示最近 20 条信号流，右侧展示信号详情和 AI
            分析结果。KPI 卡片显示：总事件量、AI 去噪后、异常行为、风险事件。
          </Li>
          <Li>
            <strong>异常行为：</strong>
            按来源和风险等级过滤的异常行为列表，每条附带 AI
            评估和推理证据。
          </Li>
          <Li>
            <strong>风险聚合：</strong>
            风险聚类归并，展示 APT 攻击链和关联事件。
          </Li>
        </Ul>
        <TipBox style={{ marginBottom: 0 }}>
          点击任意信号可查看 AI 研判详情。点击「AI 研判」按钮跳转到安全调查页面。点击「数据源管理」链接可配置数据来源。
        </TipBox>
      </FeatureCard>
    </div>
  );
}

function AlertTriageSection() {
  return (
    <div className="section" id="alert-triage" style={{ marginBottom: 56 }}>
      <H3>告警处理标准流程</H3>
      <StepList
        steps={[
          {
            num: "1",
            text: (
              <>
                <strong>发现：</strong>
                在告警中心或运营总览中识别新告警。告警实时推送至顶部栏通知铃铛。
              </>
            ),
          },
          {
            num: "2",
            text: (
              <>
                <strong>研判：</strong>
                点击「查看」跳转到 AI
                研判页面，AI 自动分析威胁并给出置信度评分和处理建议。
              </>
            ),
          },
          {
            num: "3",
            text: (
              <>
                <strong>处置：</strong>
                根据 AI
                建议，在响应处置页面选择「执行」自动响应，或手动输入处置方案。
              </>
            ),
          },
          {
            num: "4",
            text: (
              <>
                <strong>闭环：</strong>
                确认告警已解决后，在告警中心更新状态为「已确认」或「已处理」。
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

function AiChatSection() {
  return (
    <div className="section" id="ai-chat" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="ai-chat">AI 智能分析</SectionTitle>
      <FeatureCard emoji="💬" title="AI 调查助手">
        <P>
          <strong>入口：</strong>
          左侧导航「AI 调查助手」
        </P>
        <P>
          自然语言驱动的安全分析助手。通过对话完成告警分析、威胁查询、日志追溯等任务。
        </P>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          界面布局
        </h4>
        <Ul>
          <Li>
            <strong>左侧：</strong>
            对话历史列表 + 「新建对话」按钮
          </Li>
          <Li>
            <strong>中间：</strong>
            对话消息区 + 快速提问按钮
          </Li>
          <Li>
            <strong>右侧：</strong>
            数据范围面板（告警数据近30天 / 威胁情报实时 / 资产数据全量 /
            审计日志近90天）
          </Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          快速提问
        </h4>
        <P>预设 6 个常用问题，一键发起分析：</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>分析最新告警</Li>
          <Li>账号行为分析</Li>
          <Li>IP 威胁查询</Li>
          <Li>文件访问追溯</Li>
          <Li>横向移动检测</Li>
          <Li>今日安全态势</Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          AI 回复格式
        </h4>
        <P>支持多种富格式输出：</P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>文本消息 + 证据列表（支持/反对/中性标签）</Li>
          <Li>工具调用卡片（可折叠展开，显示输入/输出）</Li>
          <Li>置信度更新条（分析前 vs 分析后）</Li>
          <Li>建议追问按钮</Li>
          <Li>消息支持复制、点赞/点踩</Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function AiInvestigateSection() {
  return (
    <div className="section" id="ai-investigate" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="🔍" title="AI 研判">
        <P>
          <strong>入口：</strong>
          左侧导航「安全调查」
        </P>
        <P>
          安全事件的 AI 自动研判中心。支持分析事件单条或批量提交 AI
          分析，追踪证据链和置信度变化。
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>查看 AI 分析结果：威胁评分、处置建议、关联 IOC</Li>
          <Li>推理链可视化：展示 AI 的分析推理过程</Li>
          <Li>一键生成安全调查报告</Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function AiWorkSection() {
  return (
    <div className="section" id="ai-work" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="⚙️" title="AI 工作台">
        <P>
          <strong>入口：</strong>
          左侧导航「工作台」
        </P>
        <P>AI 分析的统一工作入口，聚合展示所有 AI 分析能力。</P>
      </FeatureCard>
    </div>
  );
}

function ResponseAutoSection() {
  return (
    <div className="section" id="resp-auto" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="resp-auto">响应处置</SectionTitle>
      <FeatureCard emoji="⚡" title="自动处置">
        <P>
          <strong>入口：</strong>
          左侧导航「响应处置」
        </P>
        <P>AI 自动生成处置动作并推送到执行队列。支持以下操作：</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>KPI 卡片：</strong>
            待执行 / 已执行 / 待审批 / 失败。
          </Li>
          <Li>
            <strong>动作卡片：</strong>
            每条动作展示 AI 推理依据、证据链、安全围栏（审批/影响/回滚/审计）、关联假设。
          </Li>
        </Ul>
        <FeatTable
          headers={["动作类型", "说明"]}
          rows={[
            ["freezeAccount", "冻结失陷账号"],
            ["isolateHost", "隔离失陷主机"],
            ["blockIp", "封锁恶意 IP"],
            ["resetVpnCredentials", "重置 VPN 凭据"],
            ["notifySecurityTeam", "通知安全团队"],
            ["preserveForensicData", "保存取证数据"],
            ["monitorUserActivity", "监控用户活动"],
            ["reviewAccessLogs", "审查访问日志"],
          ]}
        />
        <P>每个动作可执行的操作：</P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <Badge variant="purple">执行</Badge> — 直接执行该响应动作
          </Li>
          <Li>
            <Badge variant="green">审批</Badge> — 提交审批（需要审批权限）
          </Li>
          <Li>
            <Badge variant="red">取消</Badge> — 取消待执行的动作
          </Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function ResponseStrategySection() {
  return (
    <div className="section" id="resp-strategy" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📋" title="处置策略">
        <P>4 条 AI 预设的自动处置策略（触发条件达标后自动执行）：</P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>账号失陷自动处置：</strong>
            置信度 ≥ 85% 时触发冻结
          </Li>
          <Li>
            <strong>C2 通信自动阻断：</strong>
            置信度 ≥ 90% 时触发阻断 IP
          </Li>
          <Li>
            <strong>暴力破解自动防御：</strong>
            失败尝试 ≥ 50 次时触发封锁
          </Li>
          <Li>
            <strong>数据外泄自动遏制：</strong>
            外泄数据 ≥ 100MB 时触发隔离
          </Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function ResponseRecordsSection() {
  return (
    <div className="section" id="resp-records" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📝" title="执行记录">
        <P>
          时间线展示所有响应动作的执行记录，包括执行状态、操作人、操作时间。支持查看回滚记录。
        </P>
      </FeatureCard>
    </div>
  );
}

function HuntOverviewSection() {
  return (
    <div className="section" id="hunt-overview" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="hunt-overview">威胁狩猎</SectionTitle>
      <FeatureCard emoji="🎯" title="威胁狩猎概览">
        <P>
          <strong>入口：</strong>
          左侧导航「威胁狩猎」
        </P>
        <P>
          基于 MITRE ATT&CK 框架的主动威胁发现工具，支持假设驱动的狩猎模式。
        </P>
        <P>页面布局分为左右两栏：</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>左侧（2/3 宽度）：</strong>
            假设列表，每个假设显示 ID、名称、ATT&CK 战术/技术标签、状态、置信度进度条。
          </Li>
          <Li>
            <strong>右侧（1/3 宽度）：</strong>
            IOC 批量查询面板。
          </Li>
        </Ul>
        <P>
          顶部过滤卡片：全部假设 / 验证中 / 已确认 / 已排除。
        </P>
      </FeatureCard>
    </div>
  );
}

function HuntHypothesisSection() {
  return (
    <div className="section" id="hunt-hypothesis" style={{ marginBottom: 56 }}>
      <FeatureCard title="创建假设">
        <StepList
          steps={[
            {
              num: "1",
              text: (
                <>
                  点击「<strong>新建假设</strong>」按钮，弹出创建对话框。
                </>
              ),
            },
            {
              num: "2",
              text: (
                <>
                  填写<strong>假设名称</strong>
                  和<strong>描述</strong>
                  。
                </>
              ),
            },
            {
              num: "3",
              text: (
                <>
                  选择 ATT&CK <strong>战术</strong>
                  （14 种，从侦察到影响）和<strong>技术</strong>
                  。
                </>
              ),
            },
            {
              num: "4",
              text: (
                <>
                  填写关联 IOC（IP / 域名 / Hash 等）。
                </>
              ),
            },
            {
              num: "5",
              text: (
                <>
                  提交后假设出现在列表中，AI 将自动分析并逐步更新置信度。
                </>
              ),
            },
          ]}
        />
      </FeatureCard>
    </div>
  );
}

function HuntIocSection() {
  return (
    <div className="section" id="hunt-ioc" style={{ marginBottom: 56 }}>
      <FeatureCard title="IOC 批量查询">
        <P>
          在右侧面板中，粘贴 IP、域名、Hash 或 URL（每行一个），点击「批量查询」。
        </P>
        <P>
          查询结果包含：风险评分、情报来源、标签、缓存状态。
        </P>
        <P>
          系统自动识别 IOC 类型，集成 VirusTotal、AbuseIPDB、ThreatFox
          三个情报源。
        </P>
      </FeatureCard>
    </div>
  );
}

function PlaybookOverviewSection() {
  return (
    <div className="section" id="pb-overview" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="pb-overview">自动化编排</SectionTitle>
      <FeatureCard emoji="🔧" title="剧本管理">
        <P>
          <strong>入口：</strong>
          左侧导航「自动化编排」
        </P>
        <P>
          安全响应剧本（Playbook）的管理中心。支持创建、编辑、启停剧本。
        </P>
        <P>
          页面布局：左侧为剧本卡片列表（含搜索和过滤），右侧为选中剧本的详情（流程图 +
          执行历史）。
        </P>
        <P>
          <strong>触发类型：</strong>
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>AI 研判置信度触发</Li>
          <Li>阈值触发（如 5 分钟内失败登录超过 N 次）</Li>
          <Li>特征匹配触发</Li>
          <Li>行为检测触发</Li>
          <Li>定时调度触发</Li>
        </Ul>
        <TipBox style={{ marginBottom: 0 }}>
          点击「创建剧本」新建，点击「可视化编辑器」进入 DAG 编辑器页面。
        </TipBox>
      </FeatureCard>
    </div>
  );
}

function PlaybookEditorSection() {
  return (
    <div className="section" id="pb-editor" style={{ marginBottom: 56 }}>
      <FeatureCard title="可视化编辑器">
        <P>三栏布局的 DAG 编辑环境：</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>左侧节点面板：</strong>
            按分类展示可用节点模板。
          </Li>
          <Li>
            <strong>中间画布：</strong>
            拖拽式编排工作流，节点以有向连线连接。
          </Li>
          <Li>
            <strong>右侧属性面板：</strong>
            选中节点后编辑其配置参数。
          </Li>
        </Ul>
        <P>
          <strong>键盘快捷键：</strong>
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <InlineCode>Delete/Backspace</InlineCode> — 删除选中节点
          </Li>
          <Li>
            <InlineCode>Escape</InlineCode> — 取消选中
          </Li>
          <Li>
            <InlineCode>Cmd/Ctrl + S</InlineCode> — 保存剧本
          </Li>
        </Ul>
        <TipBox style={{ marginBottom: 0 }}>
          编辑完成后点击「测试运行」验证 DAG 逻辑，通过后保存启用。
        </TipBox>
      </FeatureCard>
    </div>
  );
}

function PlaybookNodesSection() {
  return (
    <div className="section" id="pb-nodes" style={{ marginBottom: 56 }}>
      <FeatureCard title="节点类型说明">
        <FeatTable
          headers={["节点类型", "颜色标识", "说明"]}
          rows={[
            [
              "Trigger（触发器）",
              <Badge key="t" variant="red">
                红色
              </Badge>,
              "剧本的起始节点，定义触发条件",
            ],
            [
              "Condition（条件）",
              <Badge key="c" variant="yellow">
                黄色
              </Badge>,
              "分支判断，根据条件走向不同路径",
            ],
            [
              "Action（动作）",
              <Badge key="a" variant="purple">
                紫色
              </Badge>,
              "执行具体的响应操作",
            ],
            [
              "Approval（审批）",
              <Badge key="ap" variant="green">
                绿色
              </Badge>,
              "需要人工审批的节点",
            ],
            ["Notify（通知）", "—", "发送通知（邮件/企微/钉钉等）"],
            ["Delay（延迟）", "—", "等待指定时间后再继续"],
          ]}
        />
      </FeatureCard>
    </div>
  );
}

function AdminUsersSection() {
  return (
    <div className="section" id="admin-users" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="admin-users">用户与权限</SectionTitle>
      <FeatureCard emoji="👥" title="用户管理">
        <P>
          <strong>入口：</strong>
          左侧导航「用户管理」
        </P>
        <P>管理平台所有用户账户。</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>统计卡片：</strong>
            全部用户 / 活跃用户 / 已禁用。
          </Li>
          <Li>
            <strong>搜索：</strong>
            按姓名、邮箱、部门、手机号搜索。
          </Li>
        </Ul>
        <FeatTable
          headers={["字段", "说明"]}
          rows={[
            ["用户", "头像 + 姓名 + ID"],
            ["联系方式", "邮箱 + 手机号"],
            [
              "角色/部门",
              "角色标签（管理员/分析师/观察者）+ 部门",
            ],
            [
              "状态",
              <>
                <Badge variant="green">活跃</Badge> /{" "}
                <Badge variant="red">禁用</Badge>
              </>,
            ],
            ["最后登录", "最近一次登录时间"],
          ]}
        />
        <P>
          操作：点击「添加用户」填写姓名、邮箱、手机号、角色（管理员/分析师/观察者）、部门（默认安全运营中心）。可对用户启用/禁用或删除。
        </P>
      </FeatureCard>
    </div>
  );
}

function AdminRbacSection() {
  return (
    <div className="section" id="admin-rbac" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="🛡️" title="角色权限 (RBAC)">
        <P>
          <strong>入口：</strong>
          侧栏「权限管理」
        </P>
        <P>基于角色的访问控制，管理角色与权限分配。</P>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          两个标签页
        </h4>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>角色管理：</strong>
            搜索角色、创建角色（填写名称/显示名/描述/选择权限）。系统角色不可删除，自定义角色可删除。展开角色可查看其权限列表。
          </Li>
          <Li>
            <strong>权限列表：</strong>
            按资源分组的权限表，展示操作标签、权限代码和说明。
          </Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          资源权限一览
        </h4>
        <FeatTable
          headers={["资源", "可用操作"]}
          rows={[
            ["告警管理", "查看 / 编辑"],
            ["响应处置", "查看 / 编辑 / 执行 / 审批 / 取消"],
            ["威胁狩猎", "查看 / 编辑"],
            ["安全调查", "查看 / 编辑"],
            ["仪表盘", "查看"],
            ["报表分析", "查看 / 编辑"],
            ["剧本管理", "查看 / 编辑"],
            ["用户管理", "查看 / 编辑"],
            ["系统设置", "查看 / 编辑"],
            ["集成管理", "查看 / 编辑"],
          ]}
        />
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          为用户分配角色
        </h4>
        <StepList
          steps={[
            { num: "1", text: "点击「用户角色分配」按钮。" },
            { num: "2", text: "输入用户 ID，选择要分配的角色。" },
            { num: "3", text: "提交后即可生效。" },
          ]}
        />
        <TipBox>
          首次使用需点击「初始化权限」按钮填充默认权限数据。
        </TipBox>
      </FeatureCard>
    </div>
  );
}

function AdminAuditSection() {
  return (
    <div className="section" id="admin-audit" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📜" title="审计日志">
        <P>
          <strong>入口：</strong>
          左侧导航「审计日志」
        </P>
        <P>
          记录所有用户操作、系统变更和数据访问行为，支持导出。
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>分类过滤卡片：</strong>
            用户操作 / 系统变更 / 数据访问（显示各分类数量）
          </Li>
          <Li>
            <strong>搜索：</strong>
            按操作人、操作对象、详情、IP 搜索
          </Li>
          <Li>
            <strong>操作类型：</strong>
            全部 / 登录 / 查询 / 修改 / 删除 / 导出
          </Li>
          <Li>
            <strong>时间范围：</strong>
            今天 / 近7天 / 近30天 / 近90天
          </Li>
          <Li>
            <strong>导出：</strong>
            支持 CSV 和 PDF
          </Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function SysSettingsSection() {
  return (
    <div className="section" id="sys-settings" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="sys-settings">系统管理</SectionTitle>
      <FeatureCard emoji="⚙️" title="系统设置">
        <P>
          <strong>入口：</strong>
          左侧导航「系统设置」
        </P>
        <P>平台全局配置，包含四个配置区域：</P>
        <FeatTable
          headers={["配置区域", "可设置项"]}
          rows={[
            [
              "安全设置",
              "自动封锁（开关）、多因素认证（开关）、会话超时（15/30/60/120/480分钟）、密码策略（基础/中等/严格）",
            ],
            [
              "AI 引擎配置",
              "AI 模型选择、置信度阈值（50-99%）、自动修复（开关）、最大并发分析数（1-50）",
            ],
            [
              "通知设置",
              "邮件通知、P0/P1/P2/P3 各级别告警通知开关、日报推送",
            ],
            [
              "数据保留",
              "告警保留天数（30-730）、日志保留天数（30-1095）、案件保留天数（90-1825）、自动清理（开关）",
            ],
          ]}
        />
        <P>底部按钮：「恢复默认」+「保存更改」</P>
      </FeatureCard>
    </div>
  );
}

function SysDatasourceSection() {
  return (
    <div className="section" id="sys-datasource" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📡" title="数据源管理">
        <P>
          <strong>入口：</strong>
          左侧导航「数据源管理」
        </P>
        <P>管理所有接入的安全设备和日志源。</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>统计卡片：</strong>
            在线设备 / 离线设备 / 日均日志量。
          </Li>
          <Li>
            <strong>设备卡片：</strong>
            名称、品牌/型号、在线/离线状态、类型/协议/日志格式标签、IP:端口、日志方向、日志级别、最后同步时间。
          </Li>
        </Ul>
        <P>
          <strong>添加数据源：</strong>
          点击「添加数据源」，填写：
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            设备名称、设备类型（防火墙 / VPN 网关 / WAF / IDS-IPS / EDR / NAC / SIEM /
            邮件网关 / DLP）
          </Li>
          <Li>
            品牌、型号、IP、端口（默认 514）、协议（Syslog / API / SNMP / Kafka）
          </Li>
          <Li>日志格式（CEF / JSON / LEEF / 原生）</Li>
          <Li>支持「测试连接」验证连通性</Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function SysAssetsSection() {
  return (
    <div className="section" id="sys-assets" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="💻" title="资产管理">
        <P>
          <strong>入口：</strong>
          左侧导航「资产管理」
        </P>
        <P>
          管理组织内的 IT 资产，包括服务器、网络设备、安全设备、终端、数据库、云资源。根据资产类型展示各自的风险等级。
        </P>
      </FeatureCard>
    </div>
  );
}

function TenantMgmtSection() {
  return (
    <div className="section" id="tenant-mgmt" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="tenant-mgmt">租户与计费</SectionTitle>
      <FeatureCard emoji="🏢" title="租户管理">
        <P>
          <strong>入口：</strong>
          侧栏「租户管理」
        </P>
        <P>管理所有租户组织、配额和订阅。</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>统计卡片：</strong>
            全部租户 / 活跃 / 试用中 / 已过期。
          </Li>
          <Li>
            <strong>租户列表：</strong>
            名称、标识、套餐标签（免费版/入门版/专业版/企业版）、状态标签（活跃/试用/过期/暂停）、所有者邮箱、最大用户数、过期时间。
          </Li>
        </Ul>
        <P>
          <strong>创建租户：</strong>
          填写租户名称、唯一标识 slug、套餐、管理员邮箱。
        </P>
        <P>
          <strong>租户详情（点击任意行进入）：</strong>
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>配额用量：</strong>
            用户数 / 今日告警 / 今日 API 调用 — 进度条展示使用率
          </Li>
          <Li>
            <strong>成员管理：</strong>
            成员列表，支持添加/移除
          </Li>
          <Li>
            <strong>订阅信息：</strong>
            套餐、状态、计费周期
          </Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function TenantBillingSection() {
  return (
    <div className="section" id="tenant-billing" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="💳" title="订阅与账单">
        <P>
          <strong>入口：</strong>
          侧栏「账单订阅」
        </P>
        <P>管理订阅计划、订单和发票。</P>
        <FeatTable
          headers={["套餐", "价格"]}
          rows={[
            ["入门版", "299 元/月"],
            ["专业版", "999 元/月"],
            ["企业版", "2999 元/月"],
          ]}
        />
        <P>
          <strong>四个标签页：</strong>
        </P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>
            <strong>订阅管理：</strong>
            展示试用状态（剩余天数/进度条）、套餐升级预览（按比例计价）
          </Li>
          <Li>
            <strong>订单列表：</strong>
            订单号、套餐、金额、状态（待支付/已支付/已取消）、操作（支付/取消/开票）
          </Li>
          <Li>
            <strong>发票列表：</strong>
            发票号、金额、税金、总金额、状态（已开具/开具中）、开票日期
          </Li>
          <Li>
            <strong>转化漏斗：</strong>
            套餐转化数据分析
          </Li>
        </Ul>
        <P>支付方式：支付宝 / 微信支付 / 银行转账。</P>
      </FeatureCard>
    </div>
  );
}

function CompFrameworkSection() {
  return (
    <div className="section" id="comp-framework" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="comp-framework">合规管理</SectionTitle>
      <FeatureCard emoji="📋" title="合规框架">
        <P>
          <strong>入口：</strong>
          侧栏「合规管理」
        </P>
        <P>合规管理模块支持合规框架的初始化和评估管理。</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>统计卡片：</strong>
            合规框架数 / 控制项总数 / 评估任务 / 已完成评估
          </Li>
          <Li><strong>两个标签页：</strong></Li>
        </Ul>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          合规框架
        </h4>
        <P>
          框架卡片网格展示，每张卡片包含：名称、编码、版本、描述、控制项数量、分类。操作：「查看控制项」「开始评估」。
        </P>
        <h4
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          评估管理
        </h4>
        <P>评估列表，支持搜索和「创建评估」。</P>
        <P>
          <strong>控制项查看：</strong>
          表格展示，支持按分类、严重程度过滤。严重程度：严重 / 高 / 中 /
          低。
        </P>
        <P>
          <strong>评估结果：</strong>
          评分圆圈、状态分布（合规 / 部分合规 / 不合规 / 未评估）、结果编辑。
        </P>
        <P>
          <strong>合规报告：</strong>
          总体评分 + 等级（A/B/C/D）+ 分类得分柱状图。
        </P>
      </FeatureCard>
    </div>
  );
}

function CompAssessmentSection() {
  return (
    <div className="section" id="comp-assessment" style={{ marginBottom: 56 }}>
      <H3>创建评估流程</H3>
      <StepList
        steps={[
          { num: "1", text: "选择一个合规框架，点击「开始评估」。" },
          { num: "2", text: "填写评估名称，系统自动评估各控制项状态。" },
          {
            num: "3",
            text: "对不合规项手动编辑整改措施和发现。",
          },
          {
            num: "4",
            text: "生成合规报告，查看整体得分和分类分析。",
          },
        ]}
      />
    </div>
  );
}

function IntIntegrationsSection() {
  return (
    <div className="section" id="int-integrations" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="int-integrations">集成与知识</SectionTitle>
      <FeatureCard emoji="🔌" title="集成中心">
        <P>
          <strong>入口：</strong>
          左侧导航「集成中心」
        </P>
        <P>管理系统集成和 Webhook。</P>
        <Ul style={{ marginBottom: 12 }}>
          <Li>
            <strong>已集成：</strong>
            已配置的第三方应用，展示名称、说明、连接状态、最后同步时间。操作：「配置」
          </Li>
          <Li>
            <strong>集成市场：</strong>
            可接入的应用列表。操作：「接入」
          </Li>
          <Li>
            <strong>Webhook：</strong>
            管理 Webhook 端点，支持启用/禁用和测试。
          </Li>
        </Ul>
        <P>
          <strong>配置集成：</strong>
          API URL、API Key/Token、同步频率（5 分钟 / 15 分钟 / 30 分钟 /
          1 小时）。
        </P>
      </FeatureCard>
    </div>
  );
}

function IntKnowledgeSection() {
  return (
    <div className="section" id="int-knowledge" style={{ marginBottom: 56 }}>
      <FeatureCard emoji="📚" title="知识库">
        <P>
          <strong>入口：</strong>
          左侧导航「知识库」
        </P>
        <P>安全知识管理平台，包含 5 个分类：</P>
        <Ul style={{ marginBottom: 0 }}>
          <Li>威胁情报（Threat Intelligence）</Li>
          <Li>应急响应（Incident Response）</Li>
          <Li>安全基线（Security Baseline）</Li>
          <Li>合规要求（Compliance）</Li>
          <Li>漏洞库（Vulnerability Database）</Li>
        </Ul>
      </FeatureCard>
    </div>
  );
}

function FaqCommonSection() {
  const faqs = [
    {
      q: "Q: 如何重置密码？",
      a: "在登录页面点击「忘记密码」，输入注册邮箱，系统发送重置链接。如果无法收到邮件，联系系统管理员。",
    },
    {
      q: "Q: 账户被锁定怎么办？",
      a: "连续 5 次输入错误密码后账户将被锁定。请联系管理员在用户管理中解锁，或等待锁定时间到期。",
    },
    {
      q: "Q: 为什么看不到某些页面？",
      a: "SecMind 使用 RBAC 权限控制。如果某个页面或按钮不可见，说明当前角色缺少对应资源的权限。联系管理员在权限管理中分配。",
    },
    {
      q: "Q: 如何接入安全设备数据？",
      a: "在「数据源管理」中点击「添加数据源」，配置设备 IP、端口、协议和日志格式。支持 Syslog、API、SNMP、Kafka 四种协议。",
    },
    {
      q: "Q: 如何切换语言？",
      a: "点击顶部栏右侧的地球图标，可在中文和英文间切换。",
    },
    {
      q: "Q: 数据保留多久？",
      a: "可在「系统设置」→「数据保留」中自定义：告警 30-730 天、日志 30-1095 天、案件 90-1825 天。",
    },
  ];
  return (
    <div className="section" id="faq-common" style={{ marginBottom: 56 }}>
      <SectionTitle anchorId="faq-common">附录</SectionTitle>
      <H3>常见问题</H3>
      {faqs.map((faq, i) => (
        <FeatureCard key={i}>
          <P style={{ marginBottom: 8 }}>
            <strong>{faq.q}</strong>
          </P>
          <P style={{ marginBottom: 0 }}>{faq.a}</P>
        </FeatureCard>
      ))}
    </div>
  );
}

function FaqKeysSection() {
  return (
    <div className="section" id="faq-keys" style={{ marginBottom: 56 }}>
      <H3>快捷键参考</H3>
      <FeatTable
        headers={["快捷键", "功能"]}
        rows={[
          [<InlineCode key="k1">⌘K</InlineCode>, "聚焦搜索框"],
          [<InlineCode key="k2">⌘S</InlineCode>, "保存编辑（剧本编辑器）"],
          [
            <>
              <InlineCode>Delete</InlineCode> /{" "}
              <InlineCode>Backspace</InlineCode>
            </>,
            "删除选中节点（剧本编辑器）",
          ],
          [<InlineCode key="k4">Escape</InlineCode>, "取消选中（剧本编辑器）"],
        ]}
      />
    </div>
  );
}
