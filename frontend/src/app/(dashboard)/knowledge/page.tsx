"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Brain,
  BookOpen,
  Plus,
  Clock,
  Search,
  Shield,
  Zap,
  Ruler,
  Scale,
  Bug,
  Upload,
  ArrowRight,
  ArrowLeft,
  X,
  Tag,
  Calendar,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
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
import { inputClass, pageCardClass } from "@/lib/admin-ui"

const knowledgeCategories = [
  { nameKey: "knowledgeCategories.threatIntelligence", icon: Shield, color: "#ef4444" },
  { nameKey: "knowledgeCategories.incidentResponse", icon: Zap, color: "#f97316" },
  { nameKey: "knowledgeCategories.securityBaseline", icon: Ruler, color: "#06b6d4" },
  { nameKey: "knowledgeCategories.compliance", icon: Scale, color: "#3b82f6" },
  { nameKey: "knowledgeCategories.vulnerabilityDatabase", icon: Bug, color: "#a855f7" },
  { nameKey: "knowledgeCategories.playbook", icon: BookOpen, color: "#22c55e" },
]

const initialKnowledgeArticles = getAllArticles()

function t0(key: string): string {
  const map: Record<string, string> = {
    "knowledgeCategories.threatIntelligence": "威胁情报",
    "knowledgeCategories.incidentResponse": "应急响应",
    "knowledgeCategories.securityBaseline": "安全基线",
    "knowledgeCategories.compliance": "合规要求",
    "knowledgeCategories.vulnerabilityDatabase": "漏洞库",
    "knowledgeCategories.playbook": "处置手册",
  }
  return map[key] || key
}

function ImportKnowledgeDialog({ open, onOpenChange, onImport }: { open: boolean; onOpenChange: (v: boolean) => void; onImport: (article: { title: string; categoryKey: string; content: string; tags: string[] }) => void }) {
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
      <DialogContent className="sm:max-w-lg bg-white border-cyan-300 text-slate-900 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15">
              <Upload className="size-4 text-cyan-400" />
            </div>
            导入知识
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            手动录入或粘贴知识内容到AI知识库
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="import-title" className="text-slate-500 text-xs">知识标题 <span className="text-red-400">*</span></Label>
              <Input
                required
                id="import-title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="如：XX漏洞分析报告"
                className="h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-200"
                name="title"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="import-category" className="text-slate-500 text-xs">所属分类 <span className="text-red-400">*</span></Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v ?? "")}>
                <SelectTrigger id="import-category" className="h-10 bg-white border-slate-200 text-slate-900 text-sm">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-white border-cyan-200 text-slate-900">
                  {knowledgeCategories.map((cat) => (
                    <SelectItem key={cat.nameKey} value={cat.nameKey}>{t0(cat.nameKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import-tags" className="text-slate-500 text-xs">标签</Label>
            <Input
              id="import-tags"
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="多个标签用逗号分隔，如：APT, 钓鱼, CVE"
              className="h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-200"
              name="tags"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import-content" className="text-slate-500 text-xs">知识内容 <span className="text-red-400">*</span></Label>
            <Textarea
              required
              id="import-content"
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="支持Markdown格式，粘贴知识正文内容…"
              className="min-h-[160px] bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-200 resize-none text-sm"
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
      return <strong key={i} className="text-slate-700">{part.slice(2, -2)}</strong>
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
          title={t("nav.tabAiKnowledge")}
        />

        <div className={`${pageCardClass} p-6 space-y-4`}>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">{selectedArticle.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {cat && (
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 font-medium"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  {t(cat.nameKey)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {selectedArticle.date}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-3" />
                {selectedArticle.author}
              </span>
              <span className="flex items-center gap-1 text-cyan-700/70">
                <Brain className="size-3" />
                AI引用 {selectedArticle.citedByAI}次
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                  <Tag className="size-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-400 italic mb-4">{selectedArticle.summary}</p>
            <div className="prose prose prose-sm max-w-none text-slate-600 space-y-3">
              {selectedArticle.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return <h3 key={i} className="text-base font-semibold text-slate-800 mt-6 mb-2">{block.replace("## ", "")}</h3>
                }
                if (block.startsWith("### ")) {
                  return <h4 key={i} className="text-sm font-semibold text-slate-700 mt-4 mb-1">{block.replace("### ", "")}</h4>
                }
                if (block.startsWith("| ")) {
                  const rows = block.split("\n").filter((r) => r.startsWith("|") && !r.startsWith("|--"))
                  return (
                    <div key={i} className="overflow-x-auto my-3">
                      <table className="w-full text-xs border border-slate-200">
                        <tbody>
                          {rows.map((row, ri) => {
                            const cells = row.split("|").filter(Boolean).map((c) => c.trim())
                            return (
                              <tr key={ri} className={ri === 0 ? "bg-slate-50/50" : ""}>
                                {cells.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-1.5 border border-slate-100 text-slate-500">{cell}</td>
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
                        <li key={j} className="text-sm text-slate-500 flex items-start gap-2">
                          <span className="mt-1.5 size-1 rounded-full bg-cyan-400/40 shrink-0" />
                          <span className="text-slate-500">{renderMarkdownText(item.replace("- ", ""))}</span>
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
                        <li key={j} className="text-sm text-slate-500 pl-1">{renderMarkdownText(item.replace(/^\d+\.\s*/, ""))}</li>
                      ))}
                    </ol>
                  )
                }
                return <p key={i} className="text-sm text-slate-500 leading-relaxed">{renderMarkdownText(block)}</p>
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
          <Button variant="outline" size="sm" className="gap-1.5 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            {t("settings.importKnowledge")}
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={t("settings.searchKnowledge")}
          value={knowledgeSearch}
          onChange={(e) => setKnowledgeSearch(e.target.value)}
          className={`pl-10 h-10 ${inputClass}`}
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
                "rounded-xl border p-5 text-center space-y-2 cursor-pointer transition-colors",
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
              <p className="text-xs text-slate-500">{articles.filter((a) => a.categoryKey === cat.nameKey).length} {t("settings.articles")}</p>
            </div>
          )
        })}
      </div>

      <div className={pageCardClass}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            {selectedCategory ? `${t0(selectedCategory)}知识` : "AI最近引用"}
          </h2>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <X className="size-3" />
                清除筛选
              </button>
            )}
            <span className="text-xs text-slate-500">{filteredArticles.length} {t("settings.articles")}</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {pagedArticles.map((article) => {
            const cat = knowledgeCategories.find((c) => c.nameKey === article.categoryKey)
            return (
              <div
                key={article.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 group-hover:text-cyan-700 transition-colors truncate">
                      {article.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
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
                    <span className="hidden sm:inline text-slate-300 truncate max-w-[200px]">{article.summary}</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-cyan-600 transition-colors shrink-0" />
              </div>
            )
          })}
          {filteredArticles.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-300">{t("settings.noMatchingArticles")}</div>
          )}
        </div>
        {filteredArticles.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
            <span className="text-xs text-slate-300">共 {filteredArticles.length} 篇</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="text-slate-400">上一页</Button>
              <span className="text-xs text-slate-400">{currentPage} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="text-slate-400">下一页</Button>
            </div>
          </div>
        )}
      </div>

      <ImportKnowledgeDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport} />
    </div>
  )
}
