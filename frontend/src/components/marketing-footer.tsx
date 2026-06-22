"use client";

import Link from "next/link";
import { Shield, Globe, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { useLocaleStore } from "@/store/locale-store";

export function MarketingFooter() {
  const t = useLocaleStore((s) => s.t);

  return (
    <footer className="relative border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-8 rounded-lg border border-primary/20 bg-primary/10">
                <Shield className="size-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">
                SecMind
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {t("marketing.footer.description")}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-colors">
                <Globe className="size-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-colors">
                <MessageCircle className="size-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-colors">
                <ExternalLink className="size-4" />
              </a>
              <a href="mailto:contact@secmind.com" className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-colors">
                <Mail className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">{t("marketing.footer.product")}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/solutions" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  {t("marketing.footer.solutions")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  {t("marketing.footer.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  {t("marketing.footer.changelog")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">{t("marketing.footer.resources")}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  {t("marketing.footer.docs")}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  {t("marketing.footer.apiRef")}
                </Link>
              </li>
              <li>
                <Link href="mailto:contact@secmind.com" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  {t("marketing.footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">{t("marketing.footer.about")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("marketing.footer.aboutDesc")}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">
            © 2026 SecMind. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-blue-600 transition-colors">
              {t("marketing.footer.privacy")}
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-blue-600 transition-colors">
              {t("marketing.footer.terms")}
            </Link>
            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-blue-600 transition-colors">
              {t("marketing.footer.cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
