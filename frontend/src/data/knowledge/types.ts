export interface KnowledgeArticle {
  id: number
  title: string
  categoryKey: string
  date: string
  citedByAI: number
  author: string
  tags: string[]
  summary: string
  content: string
}

export const CK = {
  ti: "knowledgeCategories.threatIntelligence",
  ir: "knowledgeCategories.incidentResponse",
  sb: "knowledgeCategories.securityBaseline",
  cp: "knowledgeCategories.compliance",
  vd: "knowledgeCategories.vulnerabilityDatabase",
  pb: "knowledgeCategories.playbook",
} as const

let _nextId = 1
export function nextId() {
  return _nextId++
}
export function resetId(start: number) {
  _nextId = start
}
