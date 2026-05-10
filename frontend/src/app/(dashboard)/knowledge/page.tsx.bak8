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
      <DialogContent className="sm:max-w-lg bg-[#0a1628] border-cyan-500/20 text-white shadow-[0_0_40px_rgba(0,212,255,0.12)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15">
              <Upload className="size-4 text-cyan-400" />
            </div>
            导入知识
          </DialogTitle>
          <DialogDescription className="text-white/40">
            手动录入或粘贴知识内容到AI知识库
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">知识标题 <span className="text-red-400">*</span></Label>
              <Input
                required
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="如：XX漏洞分析报告"
                className="h-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:ring-cyan-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">所属分类 <span className="text-red-400">*</span></Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v ?? "")}>
                <SelectTrigger className="h-10 bg-white/[0.04] border-white/10 text-white text-sm">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-[#0c1a3a] border-cyan-500/15 text-white">
                  {knowledgeCategories.map((cat) => (
                    <SelectItem key={cat.nameKey} value={cat.nameKey}>{t0(cat.nameKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">标签</Label>
            <Input
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="多个标签用逗号分隔，如：APT, 钓鱼, CVE"
              className="h-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:ring-cyan-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">知识内容 <span className="text-red-400">*</span></Label>
            <Textarea
              required
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="支持Markdown格式，粘贴知识正文内容..."
              className="min-h-[160px] bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:ring-cyan-500/20 resize-none text-sm"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-semibold gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#020a1a] shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] hover:brightness-110"
          >
            <Upload className="size-4" />
            导入知识库
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
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
      summary: article.content.slice(0, 80) + "...",
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

        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">{selectedArticle.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
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
              <span className="flex items-center gap-1 text-cyan-400/50">
                <Brain className="size-3" />
                AI引用 {selectedArticle.citedByAI}次
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
                  <Tag className="size-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/8 pt-4">
            <p className="text-sm text-white/50 italic mb-4">{selectedArticle.summary}</p>
            <div className="prose prose-invert prose-sm max-w-none text-white/70 space-y-3">
              {selectedArticle.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return <h3 key={i} className="text-base font-semibold text-white/90 mt-6 mb-2">{block.replace("## ", "")}</h3>
                }
                if (block.startsWith("### ")) {
                  return <h4 key={i} className="text-sm font-semibold text-white/80 mt-4 mb-1">{block.replace("### ", "")}</h4>
                }
                if (block.startsWith("| ")) {
                  const rows = block.split("\n").filter((r) => r.startsWith("|") && !r.startsWith("|--"))
                  return (
                    <div key={i} className="overflow-x-auto my-3">
                      <table className="w-full text-xs border border-white/10">
                        <tbody>
                          {rows.map((row, ri) => {
                            const cells = row.split("|").filter(Boolean).map((c) => c.trim())
                            return (
                              <tr key={ri} className={ri === 0 ? "bg-white/[0.04]" : ""}>
                                {cells.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-1.5 border border-white/5 text-white/60">{cell}</td>
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
                        <li key={j} className="text-sm text-white/60 flex items-start gap-2">
                          <span className="mt-1.5 size-1 rounded-full bg-cyan-400/40 shrink-0" />
                          <span dangerouslySetInnerHTML={{ __html: item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/80">$1</strong>') }} />
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
                        <li key={j} className="text-sm text-white/60 pl-1" dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/80">$1</strong>') }} />
                      ))}
                    </ol>
                  )
                }
                return <p key={i} className="text-sm text-white/60 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/80">$1</strong>') }} />
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
          <Button variant="outline" size="sm" className="gap-1.5 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            {t("settings.importKnowledge")}
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          placeholder={t("settings.searchKnowledge")}
          value={knowledgeSearch}
          onChange={(e) => setKnowledgeSearch(e.target.value)}
          className="pl-10 h-10 bg-white/5 border-cyan-500/15 text-white placeholder:text-white/30 focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
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
                "rounded-xl border p-5 text-center space-y-2 cursor-pointer transition-all",
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
              <p className="text-xs text-white/30">{articles.filter((a) => a.categoryKey === cat.nameKey).length} {t("settings.articles")}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            {selectedCategory ? `${t0(selectedCategory)}知识` : "AI最近引用"}
          </h2>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1 transition-colors"
              >
                <X className="size-3" />
                清除筛选
              </button>
            )}
            <span className="text-xs text-white/30">{filteredArticles.length} {t("settings.articles")}</span>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {pagedArticles.map((article) => {
            const cat = knowledgeCategories.find((c) => c.nameKey === article.categoryKey)
            return (
              <div
                key={article.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80 group-hover:text-cyan-300 transition-colors truncate">
                      {article.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-white/30">
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
                    <span className="hidden sm:inline text-white/20 truncate max-w-[200px]">{article.summary}</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-white/10 group-hover:text-cyan-400 transition-colors shrink-0" />
              </div>
            )
          })}
          {filteredArticles.length === 0 && (
            <div className="py-12 text-center text-sm text-white/30">{t("settings.noMatchingArticles")}</div>
          )}
        </div>
        {filteredArticles.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
            <span className="text-xs text-white/30">共 {filteredArticles.length} 篇</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="text-white/40">上一页</Button>
              <span className="text-xs text-white/50">{currentPage} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="text-white/40">下一页</Button>
            </div>
          </div>
        )}
      </div>

      <ImportKnowledgeDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport} />
    </div>
  )
}
