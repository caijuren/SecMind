"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Brain,
  BookOpen,
  Search,
  Shield,
  Zap,
  Ruler,
  Scale,
  Bug,
  Upload,
  ArrowRight,
  ArrowLeft,
  Tag,
  Sparkles,
  FileText,
  Hash,
  Calendar,
  User,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePageTitle } from "@/hooks/use-page-title"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useLocaleStore } from "@/store/locale-store"
import { getAllArticles } from "@/data/knowledge"
import { CK } from "@/data/knowledge/types"
import { EmptyState } from "@/components/common/state-components"
import { PageHeader } from "@/components/layout/page-header"
import { TablePagination } from "@/components/layout/table-pagination"

// ==================== 常量 ====================

const knowledgeCategories = [
  { nameKey: "knowledgeCategories.threatIntelligence", icon: Shield, color: "#ef4444", short: "TI" },
  { nameKey: "knowledgeCategories.incidentResponse", icon: Zap, color: "#f97316", short: "IR" },
  { nameKey: "knowledgeCategories.securityBaseline", icon: Ruler, color: "#06b6d4", short: "SB" },
  { nameKey: "knowledgeCategories.compliance", icon: Scale, color: "#3b82f6", short: "CP" },
  { nameKey: "knowledgeCategories.vulnerabilityDatabase", icon: Bug, color: "#a855f7", short: "VD" },
  { nameKey: "knowledgeCategories.playbook", icon: BookOpen, color: "#22c55e", short: "PB" },
]

const initialKnowledgeArticles = getAllArticles()

// ==================== 导入对话框 ====================

function ImportKnowledgeDialog({ open, onOpenChange, onImport, t }: { open: boolean; onOpenChange: (v: boolean) => void; onImport: (article: { title: string; categoryKey: string; content: string; tags: string[] }) => void; t: (key: string) => string }) {
  const [form, setForm] = useState({ title: "", category: "", content: "", tags: "" })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onImport({
      title: form.title,
      categoryKey: form.category,
      content: form.content,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    })
    onOpenChange(false)
    setForm({ title: "", category: "", content: "", tags: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-sm font-semibold">
            <Upload className="size-4 text-primary" />
            {t("knowledge.importTitle")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60 text-xs">
            {t("knowledge.importDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="import-title" className="text-muted-foreground text-[11px]">{t("knowledge.titleLabel")} *</Label>
              <Input required id="import-title" value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder={t("knowledge.titlePlaceholder")} className="h-9 bg-background border-border text-foreground text-sm placeholder:text-muted-foreground/70" name="title" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="import-category" className="text-muted-foreground text-[11px]">{t("knowledge.categoryLabel")} *</Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v ?? "")}>
                <SelectTrigger id="import-category" className="h-9 bg-background border-border text-foreground text-sm">
                  <SelectValue placeholder={t("knowledge.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {knowledgeCategories.map((cat) => (
                    <SelectItem key={cat.nameKey} value={cat.nameKey}>{t(cat.nameKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="import-tags" className="text-muted-foreground text-[11px]">{t("knowledge.tagsLabel")}</Label>
            <Input id="import-tags" value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} placeholder={t("knowledge.tagsPlaceholder")} className="h-9 bg-background border-border text-foreground text-sm placeholder:text-muted-foreground/70" name="tags" autoComplete="off" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="import-content" className="text-muted-foreground text-[11px]">{t("knowledge.contentLabel")} *</Label>
            <Textarea required id="import-content" value={form.content} onChange={(e) => handleChange("content", e.target.value)} placeholder={t("knowledge.contentPlaceholder")} className="min-h-[140px] bg-background border-border text-foreground text-sm placeholder:text-muted-foreground/70 resize-none" name="content" autoComplete="off" />
          </div>

          <Button type="submit" className="w-full h-9 text-sm font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="size-3.5" />
            {t("knowledge.submitButton")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Markdown 渲染 ====================

function renderMarkdownText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ==================== 主页面 ====================

export default function KnowledgePage() {
  const { t } = useLocaleStore()
  usePageTitle("knowledge")
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [articles, setArticles] = useState(initialKnowledgeArticles)
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleImport = (article: { title: string; categoryKey: string; content: string; tags: string[] }) => {
    const newArticle = {
      id: articles.length + 1,
      title: article.title,
      categoryKey: article.categoryKey,
      date: new Date().toISOString().split("T")[0],
      citedByAI: 0,
      author: "当前用户",
      tags: article.tags,
      summary: article.content.slice(0, 80) + "…",
      content: article.content,
    }
    setArticles((prev) => [newArticle, ...prev])
    setSelectedArticle(newArticle)
  }

  const filteredArticles = useMemo(() => {
    let filtered = articles
    if (selectedCategory) filtered = filtered.filter((a) => a.categoryKey === selectedCategory)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        a.summary.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [search, selectedCategory, articles])

  useEffect(() => {
    if (typeof queueMicrotask === "function") queueMicrotask(() => setCurrentPage(1))
    else Promise.resolve().then(() => setCurrentPage(1))
  }, [search, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = useMemo(() => filteredArticles.slice((safePage - 1) * pageSize, safePage * pageSize), [filteredArticles, safePage, pageSize])

  // 分类计数
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of articles) counts[a.categoryKey] = (counts[a.categoryKey] || 0) + 1
    return counts
  }, [articles])

  // ==================== 详情视图 ====================
  if (selectedArticle) {
    const cat = knowledgeCategories.find((c) => c.nameKey === selectedArticle.categoryKey)
    const relatedArticles = articles.filter((a) => a.id !== selectedArticle.id && a.categoryKey === selectedArticle.categoryKey).slice(0, 5)
    const relevanceScore = Math.min(95, 60 + selectedArticle.citedByAI * 0.8)

    return (
      <div className="space-y-4">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-[11px]">
          <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-1 text-muted-foreground/80 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3" />
            {t("knowledge.backToList")}
          </button>
          <span className="text-muted-foreground/80">/</span>
          {cat && <span style={{ color: cat.color }}>{t(cat.nameKey)}</span>}
          <span className="text-muted-foreground/80">/</span>
          <span className="text-foreground/80 truncate max-w-[300px]">{selectedArticle.title}</span>
        </div>

        {/* 双栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          {/* 左栏：文档正文 */}
          <article className="rounded-lg border border-border/50 bg-card">
            {/* 文档头 */}
            <div className="px-6 pt-5 pb-4 border-b border-border/60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground leading-snug">{selectedArticle.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] text-muted-foreground/80">
                    {cat && (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium" style={{ backgroundColor: `${cat.color}14`, color: cat.color }}>
                        <cat.icon className="size-3" />
                        {t(cat.nameKey)}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Calendar className="size-3" />{selectedArticle.date}</span>
                    <span className="flex items-center gap-1"><User className="size-3" />{selectedArticle.author}</span>
                    <span className="flex items-center gap-1"><Brain className="size-3 text-primary/60" />AI 引用 {selectedArticle.citedByAI} 次</span>
                  </div>
                </div>
              </div>
              {/* 标签 */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedArticle.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded border border-border/70 bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground/60 font-medium">
                    <Tag className="size-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 摘要 */}
            <div className="px-6 py-3 bg-muted/15 border-b border-border/50">
              <p className="text-xs text-muted-foreground/70 leading-relaxed italic border-l-2 border-primary/25 pl-3">
                {selectedArticle.summary}
              </p>
            </div>

            {/* 正文 */}
            <div className="px-6 py-5 space-y-3">
              {selectedArticle.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <div key={i} className="mt-6 mb-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="size-1 rounded-full bg-primary/40" />
                        {block.replace("## ", "")}
                      </h3>
                      <div className="mt-1 h-px bg-border/60" />
                    </div>
                  )
                }
                if (block.startsWith("### ")) {
                  return <h4 key={i} className="text-xs font-bold text-foreground/80 mt-4 mb-1.5 uppercase tracking-wider">{block.replace("### ", "")}</h4>
                }
                if (block.startsWith("| ")) {
                  const rows = block.split("\n").filter((r) => r.startsWith("|") && !r.startsWith("|--"))
                  const headerCells = rows[0]?.split("|").filter(Boolean).map((c) => c.trim()) ?? []
                  return (
                    <div key={i} className="overflow-x-auto my-2 rounded border border-border/70">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-muted/25 border-b border-border/60">
                            {headerCells.map((cell, ci) => (
                              <th key={ci} className="px-3 py-1.5 text-left font-semibold text-foreground/70">{cell}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(1).map((row, ri) => {
                            const cells = row.split("|").filter(Boolean).map((c) => c.trim())
                            return (
                              <tr key={ri} className="border-b border-border/70 last:border-0 hover:bg-muted/10">
                                {cells.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-1.5 text-muted-foreground">{renderMarkdownText(cell)}</td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                }
                if (block.startsWith("- ")) {
                  const items = block.split("\n").filter((l) => l.startsWith("- "))
                  return (
                    <ul key={i} className="space-y-0.5 ml-1">
                      {items.map((item, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-2 py-0.5">
                          <span className="mt-1 size-1 rounded-full bg-primary/30 shrink-0" />
                          <span>{renderMarkdownText(item.replace("- ", ""))}</span>
                        </li>
                      ))}
                    </ul>
                  )
                }
                if (block.match(/^\d+\./)) {
                  const items = block.split("\n").filter((l) => l.match(/^\d+\./))
                  return (
                    <ol key={i} className="space-y-0.5 ml-1">
                      {items.map((item, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-2 py-0.5">
                          <span className="text-primary/50 font-mono text-[10px] mt-0.5 shrink-0 w-4 text-right">{String(j + 1).padStart(2, "0")}</span>
                          <span>{renderMarkdownText(item.replace(/^\d+\.\s*/, ""))}</span>
                        </li>
                      ))}
                    </ol>
                  )
                }
                return <p key={i} className="text-xs text-muted-foreground leading-relaxed">{renderMarkdownText(block)}</p>
              })}
            </div>
          </article>

          {/* 右栏：元数据侧边栏 */}
          <aside className="space-y-3">
            {/* 文档属性 */}
            <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-border/60 bg-muted/15">
                <h3 className="text-[11px] font-semibold text-foreground/70 flex items-center gap-1.5">
                  <FileText className="size-3 text-muted-foreground/70" />
                  文档属性
                </h3>
              </div>
              <dl className="divide-y divide-border/70">
                {[
                  { label: "ID", value: <span className="font-mono text-[10px] text-muted-foreground/70">DOC-{String(selectedArticle.id).padStart(4, "0")}</span> },
                  { label: "分类", value: cat ? <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: cat.color }}><cat.icon className="size-2.5" />{t(cat.nameKey)}</span> : null },
                  { label: "作者", value: <span className="text-[11px]">{selectedArticle.author}</span> },
                  { label: "日期", value: <span className="font-mono text-[11px]">{selectedArticle.date}</span> },
                  { label: "AI引用", value: <span className="text-primary font-semibold text-[11px]">{selectedArticle.citedByAI} 次</span> },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-3 py-2">
                    <dt className="text-[10px] text-muted-foreground/70 font-medium">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* AI 评估 */}
            <div className="rounded-lg border border-primary/15 bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-primary/10 bg-primary/[0.02]">
                <h3 className="text-[11px] font-semibold text-primary/80 flex items-center gap-1.5">
                  <Sparkles className="size-3" />
                  AI 评估
                </h3>
              </div>
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/70">相关性</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${relevanceScore}%` }} />
                    </div>
                    <span className="text-[10px] text-primary font-mono font-semibold">{relevanceScore.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/70">引用频率</span>
                  <span className={cn("text-[10px] font-medium", selectedArticle.citedByAI > 30 ? "text-[#ef4444]" : selectedArticle.citedByAI > 10 ? "text-[#f97316]" : "text-muted-foreground/80")}>
                    {selectedArticle.citedByAI > 30 ? "高频" : selectedArticle.citedByAI > 10 ? "中频" : "低频"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/70">时效性</span>
                  <span className="text-[10px] text-[#22c55e] font-medium">最新</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/70">类型</span>
                  <span className="text-[10px] text-foreground/70 font-medium">
                    {selectedArticle.categoryKey === CK.ti ? "威胁情报" : selectedArticle.categoryKey === CK.ir ? "应急响应" : selectedArticle.categoryKey === CK.sb ? "安全基线" : selectedArticle.categoryKey === CK.cp ? "合规" : selectedArticle.categoryKey === CK.vd ? "漏洞库" : "处置手册"}
                  </span>
                </div>
              </div>
            </div>

            {/* 关联文档 */}
            {relatedArticles.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
                <div className="px-3 py-2 border-b border-border/60 bg-muted/15">
                  <h3 className="text-[11px] font-semibold text-foreground/70 flex items-center gap-1.5">
                    <Link2 className="size-3 text-muted-foreground/70" />
                    关联文档
                    <span className="ml-auto text-[9px] text-muted-foreground/60">{relatedArticles.length}</span>
                  </h3>
                </div>
                <div className="divide-y divide-border/70">
                  {relatedArticles.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => { setSelectedArticle(related); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/10 transition-colors group"
                    >
                      <div className="text-[11px] font-medium text-muted-foreground/60 group-hover:text-foreground transition-colors truncate leading-snug">
                        {related.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground/60">
                        <span>{related.date}</span>
                        <span className="flex items-center gap-0.5"><Brain className="size-2" />{related.citedByAI}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    )
  }

  // ==================== 列表视图 ====================
  return (
    <div className="space-y-4">
      {/* ===== 顶部工具栏 ===== */}
      <PageHeader
        icon={Brain}
        title={t("nav.tabAiKnowledge")}
        subtitle={`${articles.length} 篇文档`}
        actions={
          <>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
              <Input
                placeholder={t("settings.searchKnowledge")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-16 h-8 bg-background border-border/60 text-foreground text-xs placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-0"
                name="search"
                type="search"
                autoComplete="off"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] text-muted-foreground/50 font-mono">
                <Sparkles className="size-2.5 text-primary/50" />
                AI 语义
              </span>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-primary/8 text-primary hover:bg-primary/15 border border-primary/15 text-xs font-medium"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="size-3" />
              {t("settings.importKnowledge")}
            </Button>
          </>
        }
      />

      {/* ===== 分类过滤条 ===== */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-lg border border-border bg-card p-2 shadow-sm">
        <button
          onClick={() => setSelectedCategory(null)}
          aria-label="显示全部分类"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors border",
            !selectedCategory
              ? "bg-foreground/5 text-foreground border-foreground/15"
              : "bg-transparent text-muted-foreground/80 border-transparent hover:text-foreground/70 hover:border-border/50"
          )}
        >
          <Hash className="size-3" />
          全部
          <span className="text-[9px] text-muted-foreground/60 ml-0.5">{articles.length}</span>
        </button>
        {knowledgeCategories.map((cat) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.nameKey
          const count = categoryCounts[cat.nameKey] || 0
          return (
            <button
              key={cat.nameKey}
              onClick={() => setSelectedCategory(isSelected ? null : cat.nameKey)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors border",
                isSelected
                  ? "text-foreground border-foreground/15"
                  : "bg-transparent text-muted-foreground/80 border-transparent hover:text-foreground/70 hover:border-border/50"
              )}
              style={isSelected ? { backgroundColor: `${cat.color}12`, borderColor: `${cat.color}30`, color: cat.color } : undefined}
            >
              <Icon className="size-3" />
              {t(cat.nameKey)}
              <span className="text-[9px] opacity-40 ml-0.5">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ===== 文章表格 ===== */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        {/* 表头 */}
        <div className="grid grid-cols-[40px_1fr_96px_96px_72px_40px] items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span />
          <span>标题</span>
          <span>分类</span>
          <span>日期</span>
          <span className="text-center">引用</span>
          <span />
        </div>

        {/* 行 */}
        <div className="divide-y divide-border/50">
          {paginatedItems.map((article) => {
            const cat = knowledgeCategories.find((c) => c.nameKey === article.categoryKey)
            return (
              <div
                key={article.id}
                className="grid grid-cols-[40px_1fr_96px_96px_72px_40px] items-center gap-3 px-4 py-3 hover:bg-muted/25 transition-colors cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
              >
                {/* 类型图标 */}
                <div className="flex items-center justify-center">
                  {cat ? (
                    <div className="flex size-7 items-center justify-center rounded-md border border-border/60" style={{ backgroundColor: `${cat.color}10` }}>
                      <cat.icon className="size-3" style={{ color: cat.color }} />
                    </div>
                  ) : (
                    <FileText className="size-3 text-muted-foreground/60" />
                  )}
                </div>

                {/* 标题 + 摘要 */}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                    {article.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1 leading-tight">
                    {article.summary}
                  </div>
                </div>

                {/* 分类 */}
                <div>
                  {cat && (
                    <span className="inline-flex items-center gap-0.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${cat.color}10`, borderColor: `${cat.color}24`, color: cat.color }}>
                      {cat.short}
                    </span>
                  )}
                </div>

                {/* 日期 */}
                <span className="text-xs text-muted-foreground font-mono">{article.date}</span>

                {/* AI 引用 */}
                <div className="flex items-center justify-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold",
                    article.citedByAI > 30 ? "text-[#ef4444]" : article.citedByAI > 10 ? "text-[#f97316]" : "text-muted-foreground/60"
                  )}>
                    <Brain className="size-2.5" />
                    {article.citedByAI}
                  </span>
                </div>

                {/* 箭头 */}
                <ArrowRight className="size-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            )
          })}
        </div>

        {/* 空状态 */}
        {filteredArticles.length === 0 && (
          <div className="py-16">
            <EmptyState title={t("knowledge.noMatchingDocs")} description={t("knowledge.noMatchingDocsDesc")} icon={Search} />
          </div>
        )}

        {/* 分页 */}
        <TablePagination
          totalItems={filteredArticles.length}
          pageSize={pageSize}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
          resultsLabel={t("knowledge.resultsCount")}
          perPageLabel={t("knowledge.paginationPerPage")}
        />
      </div>

      <ImportKnowledgeDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport} t={t} />
    </div>
  )
}
