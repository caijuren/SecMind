"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "首页", href: "/" },
  { label: "解决方案", href: "/solutions" },
  { label: "文档", href: "/docs" },
  { label: "API", href: "/api", external: true },
  { label: "定价", href: "/pricing" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5" : "bg-[#09090b] border-b border-white/5"
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_0_16px_rgba(59,130,246,0.3)]">
            <Shield className="size-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-zinc-100 tracking-tight">
              SecMind
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              <Sparkles className="size-2.5" />
              AI研判平台
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 inline-flex items-center gap-1"
              >
                {item.label}
                <svg className="size-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg ${
                  mounted && pathname === item.href
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="w-px h-5 bg-white/10 mx-2" />
          <Link href="/login">
            <Button
              variant="ghost"
              size="default"
              className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-sm h-9 px-5"
            >
              登录
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="default"
              className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-[shadow,transform] text-sm h-9 px-5"
            >
              免费体验
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-zinc-400 hover:text-blue-400 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="打开导航菜单"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#09090b] px-4 py-4 space-y-1">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm rounded-md px-3 py-2.5 transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-white/5 inline-flex items-center gap-1.5"
              >
                {item.label}
                <svg className="size-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`block text-sm rounded-md px-3 py-2.5 transition-colors ${
                  mounted && pathname === item.href
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="flex gap-2 pt-3 border-t border-white/5 mt-2">
            <Link href="/login" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              >
                登录
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button
                size="sm"
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold shadow-[0_8px_22px_rgba(59,130,246,0.24)]"
              >
                免费体验
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}