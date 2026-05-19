"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useLocaleStore } from "@/store/locale-store";

export function MarketingFooter() {
  const t = useLocaleStore((s) => s.t);

  return (
    <footer className="relative border-t border-white/5 bg-[#0c0c10]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="size-6 text-blue-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                SecMind
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {t("marketing.footer.description")}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">{t("marketing.footer.product")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/solutions" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                  {t("marketing.footer.solutions")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                  {t("marketing.footer.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                  {t("marketing.footer.changelog")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">{t("marketing.footer.resources")}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                  {t("marketing.footer.docs")}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                  {t("marketing.footer.apiRef")}
                </Link>
              </li>
              <li>
                <Link href="mailto:contact@secmind.com" className="text-sm text-zinc-500 hover:text-blue-400 transition-colors">
                  {t("marketing.footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">{t("marketing.footer.about")}</h4>
            <p className="text-sm text-zinc-500">
              {t("marketing.footer.aboutDesc")}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 SecMind. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
              {t("marketing.footer.privacy")}
            </Link>
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
              {t("marketing.footer.terms")}
            </Link>
            <Link href="/cookies" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
              {t("marketing.footer.cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}