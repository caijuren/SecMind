"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/store/locale-store";

const navItems = [
  { labelKey: "marketing.nav.home", href: "/" },
  { labelKey: "marketing.nav.solutions", href: "/solutions" },
  { labelKey: "marketing.nav.docs", href: "/docs" },
  { labelKey: "marketing.nav.api", href: "/api", external: true },
  { labelKey: "marketing.nav.pricing", href: "/pricing" },
];

export function MarketingNav() {
  const { t } = useLocaleStore();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => setMounted(true));
    } else {
      Promise.resolve().then(() => setMounted(true));
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      scrolled ? "bg-background/95 border-b border-border/70" : "bg-background border-b border-border/50"
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg border border-primary/20 bg-primary/10">
            <Shield className="size-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground tracking-tight">
              SecMind
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600">
              <Sparkles className="size-2.5" />
              {t("marketing.nav.aiPlatform")}
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.labelKey}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex items-center gap-1"
              >
                {t(item.labelKey)}
                <svg className="size-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <Link
                key={item.labelKey}
                href={item.href}
                className={`relative px-4 py-2 text-sm transition-colors duration-200 rounded-lg ${
                  mounted && pathname === item.href
                    ? "text-blue-600 bg-blue-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
          <div className="w-px h-5 bg-border mx-2" />
          <Link href="/login">
            <Button
              variant="ghost"
              size="default"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 text-sm h-9 px-5"
            >
              {t("marketing.nav.login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="default"
              className="text-sm h-9 px-5"
            >
              {t("marketing.nav.startTrial")}
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-muted-foreground hover:text-blue-600 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t("marketing.nav.openNav")}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-4 py-4 space-y-1">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.labelKey}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm rounded-md px-3 py-2.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex items-center gap-1.5"
              >
                {t(item.labelKey)}
                <svg className="size-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <Link
                key={item.labelKey}
                href={item.href}
                className={`block text-sm rounded-md px-3 py-2.5 transition-colors ${
                  mounted && pathname === item.href
                    ? "text-blue-600 bg-blue-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
          <div className="flex gap-2 pt-3 border-t border-border/50 mt-2">
            <Link href="/login" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                {t("marketing.nav.login")}
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button
                size="sm"
                className="w-full"
              >
                {t("marketing.nav.startTrial")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
