import type { Hypothesis, Evidence, EvidenceDirection } from './types'

const DIRECTION_WEIGHT: Record<EvidenceDirection, number> = {
  supports: 1.0,
  contradicts: -1.0,
  neutral: 0.0,
}

const TIME_DECAY_HALF_LIFE_HOURS = 72

function timeDecayFactor(eventTimestamp: string, now: Date = new Date()): number {
  const eventTime = new Date(eventTimestamp).getTime()
  const hoursSince = (now.getTime() - eventTime) / (1000 * 60 * 60)
  if (hoursSince <= 0) return 1.0
  return Math.exp(-0.693 * hoursSince / TIME_DECAY_HALF_LIFE_HOURS)
}

function evidenceCorrelationBonus(evidence: Evidence[]): number {
  const categoryCount = new Set(evidence.map((e) => e.category))
  const uniqueCategories = categoryCount.size
  if (uniqueCategories >= 4) return 0.1
  if (uniqueCategories >= 3) return 0.05
  if (uniqueCategories >= 2) return 0.02
  return 0
}

function contradictionPenalty(evidence: Evidence[]): number {
  const contradicts = evidence.filter((e) => e.direction === 'contradicts')
  if (contradicts.length === 0) return 0
  const totalContradictWeight = contradicts.reduce((sum, e) => sum + e.weight, 0)
  return -0.15 * totalContradictWeight
}

export function computeConfidence(hypothesis: Hypothesis): number {
  if (hypothesis.evidence.length === 0) return 0.05

  let weightedSum = 0
  let totalWeight = 0

  for (const evi of hypothesis.evidence) {
    const decay = timeDecayFactor(evi.id.includes('EVI') ? new Date().toISOString() : new Date().toISOString())
    const directionMultiplier = DIRECTION_WEIGHT[evi.direction]
    const effectiveWeight = evi.weight * decay * directionMultiplier
    weightedSum += effectiveWeight
    totalWeight += evi.weight * decay
  }

  if (totalWeight === 0) return 0.05

  const baseScore = weightedSum / totalWeight

  const correlationBonus = evidenceCorrelationBonus(hypothesis.evidence)
  const penalty = contradictionPenalty(hypothesis.evidence)

  const attackPathBonus = hypothesis.attackPaths.length > 0 ? 0.08 : 0

  const rawScore = baseScore + correlationBonus + penalty + attackPathBonus

  const clamped = Math.max(0.05, Math.min(0.99, rawScore))

  return Math.round(clamped * 100) / 100
}

export function rankHypotheses(hypotheses: Hypothesis[]): Hypothesis[] {
  const scored = hypotheses.map((h) => ({
    hypothesis: h,
    confidence: computeConfidence(h),
  }))

  scored.sort((a, b) => b.confidence - a.confidence)

  return scored.map((s, index) => {
    const updated = { ...s.hypothesis, confidence: s.confidence }
    if (index === 0 && updated.status !== 'rejected') {
      updated.status = 'primary'
    } else if (index === 1 && updated.status !== 'rejected') {
      updated.status = 'alternative'
    } else if (updated.status !== 'rejected') {
      updated.status = 'low_probability'
    }
    return updated
  })
}

export function explainConfidence(hypothesis: Hypothesis): string {
  const supports = hypothesis.evidence.filter((e) => e.direction === 'supports')
  const contradicts = hypothesis.evidence.filter((e) => e.direction === 'contradicts')
  const neutral = hypothesis.evidence.filter((e) => e.direction === 'neutral')

  const parts: string[] = []

  if (supports.length > 0) {
    const totalWeight = supports.reduce((s, e) => s + e.weight, 0).toFixed(2)
    parts.push(`${supports.length}条支持证据(权重${totalWeight})`)
  }

  if (contradicts.length > 0) {
    const totalWeight = contradicts.reduce((s, e) => s + e.weight, 0).toFixed(2)
    parts.push(`${contradicts.length}条反对证据(权重${totalWeight})`)
  }

  if (neutral.length > 0) {
    parts.push(`${neutral.length}条中性证据`)
  }

  if (hypothesis.attackPaths.length > 0) {
    parts.push(`${hypothesis.attackPaths.length}条攻击路径`)
  }

  const categoryCount = new Set(hypothesis.evidence.map((e) => e.category)).size
  if (categoryCount >= 3) {
    parts.push(`${categoryCount}种事件类型交叉验证`)
  }

  return parts.join('，') + ` → 置信度 ${(hypothesis.confidence * 100).toFixed(0)}%`
}
