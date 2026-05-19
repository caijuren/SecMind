"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Brain,
  BookOpen,
  Clock,
  Search,
  Shield,
  Zap,
  Ruler,
  Scale,
  Bug,
  Upload,
  ArrowRight,
  X,
  Tag,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { PageHeader } from "@/components/layout/page-header"
import { getAllArticles } from "@/data/knowledge"
import { pageCardClass } from "@/lib/admin-ui"
import { EmptyState } from "@/components/common/state-components"

const knowledgeCategories = [
  { nameKey: "knowledgeCategories.threatIntelligence", icon: Shield, color: "#f87171" },
  { nameKey: "knowledgeCategories.incidentResponse", icon: Zap, color: "#fb923c" },
  { nameKey: "knowledgeCategories.securityBaseline", icon: Ruler, color: "#22d3ee" },
  { nameKey: "knowledgeCategories.compliance", icon: Scale, color: "#60a5fa" },
  { nameKey: "knowledgeCategories.vulnerabilityDatabase", icon: Bug, color: "#c084fc" },
  { nameKey: "knowledgeCategories.playbook", icon: BookOpen, color: "#4ade80" },
]

const initialKnowledgeArticles = getAllArticles()

function ImportKnowledgeDialog({ open, onOpenChange, onImport, t }: { open: boolean; onOpenChange: (v: boolean) => void; onImport: (article: { title: string; categoryKey: string; content: string; tags: string[] }) => void; t: (key: string) => string }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
    tags: "",
  })

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
      <DialogContent className="sm:max-w-lg bg-[#131316] border-cyan-500/20 text-zinc-100 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15">
              <Upload className="size-4 text-cyan-400" />
            </div>
            导入知识
          </DialogTitle>
          <DialogDescription className="text-zinc-600">
            手动录入或粘贴知识内容到AI知识库
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-title" className="text-zinc-500 text-xs">知识标题 <span className="text-red-400">*</span></Label>
              <Input
                required
                id="import-title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="如：XX漏洞分析报告"
                className="h-10 bg-[#131316] border-white/[0.06] text-zinc-100 placeholder:text-zinc-700 focus:border-cyan-400 focus:ring-cyan-200"
                name="title"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="import-category" className="text-zinc-500 text-xs">所属分类 <span className="text-red-400">*</span></Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v ?? "")}>
                <SelectTrigger id="import-category" className="h-10 bg-[#131316] border-white/[0.06] text-zinc-100 text-sm">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-[#131316] border-white/[0.06] text-zinc-100">
                  {knowledgeCategories.map((cat) => (
                    <SelectItem key={cat.nameKey} value={cat.nameKey}>{t(cat.nameKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import-tags" className="text-zinc-500 text-xs">标签</Label>
              <Input
                id="import-tags"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="多个标签用逗号分隔，如：APT, 钓鱼, CVE"
                className="h-10 bg-[#131316] border-white/[0.06] text-zinc-100 placeholder:text-zinc-700 focus:border-cyan-400 focus:ring-cyan-200"
              name="tags"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import-content" className="text-zinc-500 text-xs">知识内容 <span className="text-red-400">*</span></Label>
            <Textarea
              required
              id="import-content"
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="支持Markdown格式，粘贴知识正文内容…"
              className="min-h-[160px] bg-[#131316] border-white/[0.06] text-zinc-100 placeholder:text-zinc-700 focus:border-cyan-400 focus:ring-cyan-200 resize-none text-sm"
              name="content"
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-semibold gap-2 bg-cyan-600 text-white hover:bg-cyan-700"
          >
            <Upload className="size-4" />
            导入知识库
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function renderMarkdownText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-zinc-200">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function KnowledgePage() {
  const { t } = useLocaleStore()
  const [knowledgeSearch, setKnowledgeSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [articles, setArticles] = useState(initialKnowledgeArticles)
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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
    if (selectedCategory) {
      filtered = filtered.filter((a) => a.categoryKey === selectedCategory)
    }
    if (knowledgeSearch) {
      const q = knowledgeSearch.toLowerCase()
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        a.summary.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [knowledgeSearch, selectedCategory, articles])

  useEffect(() => {
    setCurrentPage(1)
  }, [knowledgeSearch, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / 20))
  const pagedArticles = useMemo(() => {
    return filteredArticles.slice((currentPage - 1) * 20, currentPage * 20)
  }, [filteredArticles, currentPage])

  if (selectedArticle) {
    const cat = knowledgeCategories.find((c) => c.nameKey === selectedArticle.categoryKey)
    return (
      <div className="space-y-5">
        <PageHeader
          icon={BookOpen}
          title={selectedArticle.title}
          subtitle={`${selectedArticle.date} · ${selectedArticle.author}`}
          actions={
            <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-500 hover:text-zinc-200" onClick={() => setSelectedArticle(null)}>
              <ArrowRight className="size-3.5 rotate-180" />
              返回列表
            </Button>
          }
        />

        <div className={`${pageCardClass} p-6 space-y-4`}>
          <div className="border-b border-white/[0.06] pb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
              {cat && (
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 font-medium"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  {t(cat.nameKey)}
                </span>
              )}
              <span className="flex items-center gap-1 text-cyan-400/60">
                <Brain className="size-3" />
                AI引用 {selectedArticle.citedByAI}次
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-500">
                  <Tag className="size-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-4">
            <p className="text-sm text-zinc-600 italic mb-4">{selectedArticle.summary}</p>
            <div className="prose prose-sm max-w-none text-zinc-400 space-y-3">
              {selectedArticle.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return <h3 key={i} className="text-base font-semibold text-zinc-100 mt-6 mb-2">{block.replace("## ", "")}</h3>
                    }
                    if (block.startsWith("### ")) {
                      return <h4 key={i} className="text-sm font-semibold text-zinc-200 mt-4 mb-1">{block.replace("### ", "")}</h4>
                }
                if (block.startsWith("| ")) {
                  const rows = block.split("\n").filter((r) => r.startsWith("|") && !r.startsWith("|--"))
                  return (
                    <div key={i} className="overflow-x-auto my-3">
                      <table className="w-full text-xs border border-white/[0.06]">
                        <tbody>
                          {rows.map((row, ri) => {
                            const cells = row.split("|").filter(Boolean).map((c) => c.trim())
                            return (
                              <tr key={ri} className={ri === 0 ? "bg-white/[0.03]" : ""}>
                                {cells.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-1.5 border border-white/[0.04] text-zinc-500">{cell}</td>
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
                    <ul key={i} className="space-y-1 ml-4">
                      {items.map((item, j) => (
                        <li key={j} className="text-sm text-zinc-500 flex items-start gap-2">
                          <span className="mt-1.5 size-1 rounded-full bg-cyan-400/40 shrink-0" />
                          <span className="text-zinc-500">{renderMarkdownText(item.replace("- ", ""))}</span>
                        </li>
                      ))}
                    </ul>
                  )
                }
                if (block.match(/^\d+\./)) {
                  const items = block.split("\n").filter((l) => l.match(/^\d+\./))
                  return (
                    <ol key={i} className="space-y-1 ml-4 list-decimal list-outside">
                      {items.map((item, j) => (
                        <li key={j} className="text-sm text-zinc-500 pl-1">{renderMarkdownText(item.replace(/^\d+\.\s*/, ""))}</li>
                      ))}
                    </ol>
                  )
                }
                return <p key={i} className="text-sm text-zinc-500 leading-relaxed">{renderMarkdownText(block)}</p>
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BookOpen}
        title={t("nav.tabAiKnowledge")}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 border-cyan-500/25 bg-cyan-500/[0.04] text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            {t("settings.importKnowledge")}
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-700" />
        <Input
          placeholder={t("settings.searchKnowledge")}
          value={knowledgeSearch}
          onChange={(e) => setKnowledgeSearch(e.target.value)}
          className="pl-10 h-10 bg-[#131316] border-white/[0.06] text-zinc-100 placeholder:text-zinc-700 focus:border-cyan-400 focus:ring-cyan-200"
          name="search"
          type="search"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {knowledgeCategories.map((cat) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.nameKey
          return (
            <div
              key={cat.nameKey}
              className={cn(
                "rounded-xl border p-5 text-center space-y-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md",
              )}
              style={{
                borderColor: isSelected ? `${cat.color}60` : `${cat.color}25`,
                backgroundColor: isSelected ? `${cat.color}12` : `${cat.color}08`,
              }}
              onClick={() => setSelectedCategory(isSelected ? null : cat.nameKey)}
            >
              <div className="flex size-10 mx-auto items-center justify-center rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                <Icon className="size-5" style={{ color: cat.color }} />
              </div>
              <h3 className="text-sm font-medium" style={{ color: `${cat.color}cc` }}>{t(cat.nameKey)}</h3>
              <p className="text-xs text-zinc-600">{articles.filter((a) => a.categoryKey === cat.nameKey).length} {t("settings.articles")}</p>
            </div>
          )
        })}
      </div>

      <div className={pageCardClass}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            {selectedCategory ? `${t(selectedCategory)}知识` : "AI最近引用"}
          </h2>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <X className="size-3" />
                清除筛选
              </button>
            )}
            <span className="text-xs text-zinc-600">{filteredArticles.length} {t("settings.articles")}</span>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {pagedArticles.map((article) => {
            const cat = knowledgeCategories.find((c) => c.nameKey === article.categoryKey)
            return (
              <div
                key={article.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-300 group-hover:text-cyan-400 transition-colors truncate">
                      {article.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-600">
                    {cat && (
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 font-medium"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        {t(cat.nameKey)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400/50">
                      <Brain className="h-2.5 w-2.5" />
                      AI引用 {article.citedByAI}次
                    </span>
                    <span className="hidden sm:inline text-zinc-700 truncate max-w-[200px]">{article.summary}</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-cyan-400 transition-colors shrink-0" />
              </div>
            )
          })}
          {filteredArticles.length === 0 && (
            <EmptyState title="没有匹配的文档" description="尝试调整搜索关键词或筛选条件" icon={Search} />
          )}
        </div>
        {filteredArticles.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-zinc-700">共 {filteredArticles.length} 篇</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="text-zinc-600 hover:text-zinc-300">上一页</Button>
              <span className="text-xs text-zinc-600">{currentPage} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="text-zinc-600 hover:text-zinc-300">下一页</Button>
            </div>
          </div>
        )}
      </div>

      <ImportKnowledgeDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport} t={t} />
    </div>
  )
}
