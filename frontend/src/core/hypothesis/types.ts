export type HypothesisStatus = 'primary' | 'active' | 'strengthened' | 'weakened' | 'alternative' | 'low_probability' | 'rejected'

export type HypothesisType = 'compromise' | 'insider' | 'false_positive' | 'misconfig' | 'unknown'

export type EvidenceDirection = 'supports' | 'contradicts' | 'neutral'

export type EventCategory = 'vpn_anomaly' | 'email_click' | 'malware_execution' | 'brute_force' | 'lateral_movement' | 'data_exfiltration' | 'c2_communication' | 'privilege_escalation' | 'policy_violation'

export type SnapshotTrigger = 'new_event' | 'evidence_update' | 'manual_review' | 'time_decay'

export interface SecurityEvent {
  id: string
  timestamp: string
  category: EventCategory
  actor: { id: string; type: 'user' | 'host'; name: string }
  target: { id: string; type: 'account' | 'ip' | 'host' | 'domain'; name: string }
  action: string
  raw: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'info'
  source: string
  metadata: Record<string, string>
}

export interface Evidence {
  id: string
  eventId: string
  hypothesisId: string
  direction: EvidenceDirection
  weight: number
  description: string
  category: EventCategory
}

export interface ReasoningStep {
  id: string
  hypothesisId: string
  agent: string
  step: string
  conclusion: string
  timestamp: string
  evidenceIds: string[]
}

export interface AttackPath {
  id: string
  hypothesisId: string
  label: string
  stages: {
    eventCategory: EventCategory
    description: string
    eventId: string
    mitreTactic: string
    mitreTechnique: string
  }[]
  isPrimary: boolean
}

export interface HypothesisSnapshot {
  timestamp: string
  confidence: number
  evidenceScore: number
  contradictionScore: number
  status: HypothesisStatus
  triggeredBy: {
    eventId: string
    type: SnapshotTrigger
  }
  delta: number
}

export interface EvidenceImpact {
  eventId: string
  eventAction: string
  eventCategory: EventCategory
  impacts: {
    hypothesisId: string
    hypothesisName: string
    delta: number
    direction: 'strengthened' | 'weakened' | 'neutral'
  }[]
}

export interface Hypothesis {
  id: string
  incidentId: string
  name: string
  type: HypothesisType
  description: string
  status: HypothesisStatus
  confidence: number
  evidence: Evidence[]
  reasoningSteps: ReasoningStep[]
  attackPaths: AttackPath[]
  lifecycle: HypothesisSnapshot[]
  generatedAt: string
  updatedAt: string
}

export interface HypothesisEngineResult {
  hypotheses: Hypothesis[]
  reasoningTrace: string[]
}
