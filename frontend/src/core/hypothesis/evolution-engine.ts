import type { Evidence, EvidenceDirection, EventCategory, Hypothesis, HypothesisSnapshot, HypothesisStatus, HypothesisType, SecurityEvent, SnapshotTrigger, EvidenceImpact } from './types'

interface CategoryAffinity {
  supports: HypothesisType[]
  contradicts: HypothesisType[]
  weight: number
}

const categoryAffinities: Record<EventCategory, CategoryAffinity> = {
  vpn_anomaly: { supports: ['compromise'], contradicts: ['false_positive'], weight: 0.18 },
  email_click: { supports: ['compromise'], contradicts: ['false_positive', 'misconfig'], weight: 0.15 },
  malware_execution: { supports: ['compromise'], contradicts: ['false_positive'], weight: 0.25 },
  brute_force: { supports: ['compromise'], contradicts: ['misconfig'], weight: 0.20 },
  lateral_movement: { supports: ['compromise', 'insider'], contradicts: ['false_positive'], weight: 0.22 },
  data_exfiltration: { supports: ['compromise', 'insider'], contradicts: ['false_positive'], weight: 0.25 },
  c2_communication: { supports: ['compromise'], contradicts: ['false_positive', 'misconfig'], weight: 0.28 },
  privilege_escalation: { supports: ['compromise', 'insider'], contradicts: ['false_positive'], weight: 0.20 },
  policy_violation: { supports: ['misconfig', 'insider'], contradicts: ['compromise'], weight: 0.08 },
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function sumByDirection(evidence: Evidence[], direction: EvidenceDirection): number {
  return evidence
    .filter((e) => e.direction === direction)
    .reduce((sum, e) => sum + e.weight, 0)
}

export class HypothesisEvolutionEngine {
  evolve(hypotheses: Hypothesis[], newEvent: SecurityEvent): {
    hypotheses: Hypothesis[]
    impact: EvidenceImpact
  } {
    const updatedHypotheses = hypotheses.map((h) =>
      this.updateHypothesis(h, newEvent)
    )

    const ranked = this.rankHypotheses(updatedHypotheses)

    const impact: EvidenceImpact = {
      eventId: newEvent.id,
      eventAction: newEvent.action,
      eventCategory: newEvent.category,
      impacts: ranked.map((h) => {
        const snapshot = h.lifecycle[h.lifecycle.length - 1]
        return {
          hypothesisId: h.id,
          hypothesisName: h.name,
          delta: snapshot?.delta ?? 0,
          direction: (snapshot?.delta ?? 0) > 0.01
            ? 'strengthened'
            : (snapshot?.delta ?? 0) < -0.01
              ? 'weakened'
              : 'neutral',
        }
      }),
    }

    return { hypotheses: ranked, impact }
  }

  evolveBatch(hypotheses: Hypothesis[], events: SecurityEvent[]): {
    hypotheses: Hypothesis[]
    impacts: EvidenceImpact[]
  } {
    let current = [...hypotheses]
    const impacts: EvidenceImpact[] = []

    for (const event of events) {
      const result = this.evolve(current, event)
      current = result.hypotheses
      impacts.push(result.impact)
    }

    return { hypotheses: current, impacts }
  }

  private updateHypothesis(h: Hypothesis, event: SecurityEvent): Hypothesis {
    const impact = this.evaluateEventImpact(h, event)
    const updatedEvidence = this.updateEvidence(h.evidence, impact, h.id, event)
    const newConfidence = this.calculateConfidence(updatedEvidence)
    const newStatus = this.determineStatus(newConfidence)
    const delta = newConfidence - h.confidence

    const snapshot: HypothesisSnapshot = {
      timestamp: event.timestamp,
      confidence: newConfidence,
      evidenceScore: sumByDirection(updatedEvidence, 'supports'),
      contradictionScore: sumByDirection(updatedEvidence, 'contradicts'),
      status: newStatus,
      triggeredBy: {
        eventId: event.id,
        type: 'new_event' as SnapshotTrigger,
      },
      delta: Math.round(delta * 1000) / 1000,
    }

    return {
      ...h,
      confidence: Math.round(newConfidence * 100) / 100,
      status: newStatus,
      evidence: updatedEvidence,
      lifecycle: [...h.lifecycle, snapshot],
      updatedAt: event.timestamp,
    }
  }

  private evaluateEventImpact(
    h: Hypothesis,
    event: SecurityEvent
  ): { direction: EvidenceDirection; weight: number; reason: string } {
    const affinity = categoryAffinities[event.category]
    if (!affinity) {
      return { direction: 'neutral', weight: 0, reason: '未知事件类型' }
    }

    const riskMultiplier =
      event.riskLevel === 'critical'
        ? 1.3
        : event.riskLevel === 'high'
          ? 1.0
          : event.riskLevel === 'medium'
            ? 0.6
            : 0.3

    if (affinity.supports.includes(h.type)) {
      return {
        direction: 'supports',
        weight: affinity.weight * riskMultiplier,
        reason: `${event.category} 支持 ${h.type} 假设`,
      }
    }

    if (affinity.contradicts.includes(h.type)) {
      return {
        direction: 'contradicts',
        weight: affinity.weight * riskMultiplier * 0.7,
        reason: `${event.category} 削弱 ${h.type} 假设`,
      }
    }

    return { direction: 'neutral', weight: 0.02, reason: '无直接关联' }
  }

  private updateEvidence(
    existing: Evidence[],
    impact: { direction: EvidenceDirection; weight: number; reason: string },
    hypothesisId: string,
    event: SecurityEvent
  ): Evidence[] {
    const newEvidence: Evidence = {
      id: `EVI-${hypothesisId}-${existing.length}`,
      eventId: event.id,
      hypothesisId,
      direction: impact.direction,
      weight: impact.weight,
      description: impact.reason,
      category: event.category,
    }

    return [...existing, newEvidence]
  }

  private calculateConfidence(evidence: Evidence[]): number {
    const support = sumByDirection(evidence, 'supports')
    const contradict = sumByDirection(evidence, 'contradicts')
    const raw = support - contradict * 1.2
    return sigmoid(raw * 2)
  }

  private determineStatus(confidence: number): HypothesisStatus {
    if (confidence > 0.8) return 'primary'
    if (confidence > 0.65) return 'strengthened'
    if (confidence > 0.5) return 'active'
    if (confidence > 0.35) return 'weakened'
    if (confidence > 0.2) return 'alternative'
    return 'rejected'
  }

  private rankHypotheses(hypotheses: Hypothesis[]): Hypothesis[] {
    return [...hypotheses].sort((a, b) => b.confidence - a.confidence)
  }

  explainConfidenceChange(h: Hypothesis): string {
    if (h.lifecycle.length < 2) return '初始假设，尚未演化'

    const latest = h.lifecycle[h.lifecycle.length - 1]
    const previous = h.lifecycle[h.lifecycle.length - 2]
    const delta = latest.confidence - previous.confidence

    if (Math.abs(delta) < 0.01) {
      return `置信度稳定在 ${(h.confidence * 100).toFixed(0)}%，无显著变化`
    }

    const direction = delta > 0 ? '上升' : '下降'
    const trigger = latest.triggeredBy

    return `置信度${direction} ${Math.abs(delta * 100).toFixed(1)}% → ${(h.confidence * 100).toFixed(0)}%，由事件 ${trigger.eventId} 触发`
  }

  explainRejection(h: Hypothesis): string {
    if (h.status !== 'rejected') return ''

    const weakeningSteps = h.lifecycle.filter((s) => s.delta < -0.02)
    const contradictions = h.evidence.filter((e) => e.direction === 'contradicts')

    const reasons: string[] = []

    if (contradictions.length > 0) {
      reasons.push(
        `${contradictions.length}条反对证据: ${contradictions.map((e) => e.description).join(', ')}`
      )
    }

    if (weakeningSteps.length > 0) {
      reasons.push(`${weakeningSteps.length}次置信度下降`)
    }

    const supportCount = h.evidence.filter((e) => e.direction === 'supports').length
    if (supportCount === 0) {
      reasons.push('无支持证据')
    }

    return reasons.length > 0 ? `假设被排除: ${reasons.join('；')}` : '假设因置信度过低被排除'
  }

  findRankingCrossover(hypotheses: Hypothesis[]): {
    eventId: string
    description: string
  } | null {
    for (const h of hypotheses) {
      for (let i = 1; i < h.lifecycle.length; i++) {
        const prev = h.lifecycle[i - 1]
        const curr = h.lifecycle[i]
        if (prev.status !== 'primary' && curr.status === 'primary') {
          return {
            eventId: curr.triggeredBy.eventId,
            description: `${h.name} 在事件 ${curr.triggeredBy.eventId} 后成为主假设`,
          }
        }
      }
    }
    return null
  }
}

export const evolutionEngine = new HypothesisEvolutionEngine()
