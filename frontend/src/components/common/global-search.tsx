"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Bell,
  BookOpen,
  User,
} from "lucide-react";
import { useLocaleStore } from "@/store/locale-store";

interface SearchResult {
  id: string;
  type: "alert" | "knowledge" | "user";
  title: string;
  subtitle: string;
  url: string;
}

const typeIcons: Record<string, React.ElementType> = {
  alert: Bell,
  knowledge: BookOpen,
  user: User,
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLocaleStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const searchData = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchData(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchData]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("globalSearch.dialogLabel")}
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-primary/10 bg-card shadow-2xl shadow-primary/5">
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={t("globalSearch.placeholder")}
            className="flex h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <kbd className="ml-2 hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
            Esc
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("globalSearch.searching")}
            </div>
          )}
          {!loading && query.length > 0 && results.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {t("globalSearch.noResults")}
            </Command.Empty>
          )}
          {!loading && query.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("globalSearch.startSearch")}
            </div>
          )}
          {results.map((result) => {
            const Icon = typeIcons[result.type] || Search;
            return (
              <Command.Item
                key={result.id}
                value={result.title}
                onSelect={() => {
                  router.push(result.url);
                  onOpenChange(false);
                  setQuery("");
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm aria-selected:bg-muted/50"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-foreground">{result.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {result.subtitle}
                  </span>
                </div>
                <span className="ml-auto shrink-0 text-[10px] uppercase text-muted-foreground/60">
                  {result.type === "alert"
                    ? t("globalSearch.typeAlert")
                    : result.type === "knowledge"
                      ? t("globalSearch.typeKnowledge")
                      : t("globalSearch.typeUser")}
                </span>
              </Command.Item>
            );
          })}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}