import type { Evidence, Hypothesis, HypothesisEngineResult, HypothesisStatus, HypothesisType, SecurityEvent, EventCategory, AttackPath, ReasoningStep, EvidenceDirection } from './types'

interface PatternRule {
  id: string
  name: string
  requiredCategories: EventCategory[]
  requiredRiskLevels: Array<'critical' | 'high' | 'medium' | 'low' | 'info'>
  actorConstraints?: { isOnLeave?: boolean; isSensitive?: boolean; locationMismatch?: boolean }
  generateHypothesis: (events: SecurityEvent[], matched: SecurityEvent[]) => {
    name: string
    description: string
    status: HypothesisStatus
  }
}

const patternRules: PatternRule[] = [
  {
    id: 'RULE-001',
    name: 'Account Compromise via Phishing',
    requiredCategories: ['vpn_anomaly', 'email_click'],
    requiredRiskLevels: ['high', 'critical'],
    actorConstraints: { isOnLeave: true, locationMismatch: true },
    generateHypothesis: (events, matched) => ({
      name: 'Account Compromise',
      description: `用户${matched[0]?.actor.name ?? ''}的账号可能已失陷。攻击者通过钓鱼邮件获取凭证后，从境外异常位置登录VPN。用户当前处于休假状态，不存在境外登录合理性。`,
      status: 'primary',
    }),
  },
  {
    id: 'RULE-002',
    name: 'Account Compromise via Brute Force',
    requiredCategories: ['brute_force'],
    requiredRiskLevels: ['critical', 'high'],
    generateHypothesis: (events, matched) => ({
      name: 'Credential Stuffing / Brute Force',
      description: `检测到针对${matched[0]?.target.name ?? ''}的暴力破解攻击。短时间大量失败登录后出现成功登录，可能已获取有效凭证。`,
      status: 'primary',
    }),
  },
  {
    id: 'RULE-003',
    name: 'Full Kill Chain',
    requiredCategories: ['email_click', 'malware_execution', 'c2_communication'],
    requiredRiskLevels: ['high', 'critical'],
    generateHypothesis: (events, matched) => ({
      name: 'Full Kill Chain Attack',
      description: `检测到完整攻击链：钓鱼邮件→恶意软件执行→C2通信。攻击者已建立持久化控制通道。`,
      status: 'primary',
    }),
  },
  {
    id: 'RULE-004',
    name: 'Insider Threat',
    requiredCategories: ['lateral_movement', 'data_exfiltration'],
    requiredRiskLevels: ['high', 'critical'],
    actorConstraints: { isSensitive: true },
    generateHypothesis: (events, matched) => ({
      name: 'Insider Threat',
      description: `敏感岗位用户${matched[0]?.actor.name ?? ''}出现横向移动和数据外传行为，可能存在内部威胁。`,
      status: 'alternative',
    }),
  },
  {
    id: 'RULE-005',
    name: 'False Positive - Single Anomaly',
    requiredCategories: ['vpn_anomaly'],
    requiredRiskLevels: ['medium'],
    generateHypothesis: (events, matched) => ({
      name: 'False Positive',
      description: `单一VPN异常事件，无后续关联行为。可能是员工出差或VPN节点切换导致。`,
      status: 'alternative',
    }),
  },
  {
    id: 'RULE-006',
    name: 'False Positive - Policy Violation',
    requiredCategories: ['policy_violation'],
    requiredRiskLevels: ['low', 'medium'],
    generateHypothesis: (events, matched) => ({
      name: 'Policy Violation (Non-malicious)',
      description: `策略违规事件，无恶意行为特征。可能是员工误操作或合规培训不足。`,
      status: 'low_probability',
    }),
  },
]

function matchRule(rule: PatternRule, events: SecurityEvent[]): SecurityEvent[] | null {
  const matched: SecurityEvent[] = []
  for (const category of rule.requiredCategories) {
    const event = events.find(
      (e) => e.category === category && rule.requiredRiskLevels.includes(e.riskLevel)
    )
    if (!event) return null
    matched.push(event)
  }
  return matched
}

function generateEvidence(
  hypothesisId: string,
  events: SecurityEvent[],
  matchedEvents: SecurityEvent[],
  rule: PatternRule
): { evidence: Evidence[]; reasoningSteps: ReasoningStep[] } {
  const evidence: Evidence[] = []
  const reasoningSteps: ReasoningStep[] = []
  let evidenceIdx = 0

  for (const evt of matchedEvents) {
    evidence.push({
      id: `EVI-${hypothesisId}-${evidenceIdx++}`,
      eventId: evt.id,
      hypothesisId,
      direction: 'supports',
      weight: evt.riskLevel === 'critical' ? 0.9 : evt.riskLevel === 'high' ? 0.7 : 0.4,
      description: `${evt.action} (${evt.source}: ${evt.actor.name} → ${evt.target.name})`,
      category: evt.category,
    })
  }

  const unmatched = events.filter((e) => !matchedEvents.includes(e))
  for (const evt of unmatched) {
    if (evt.riskLevel === 'low' || evt.riskLevel === 'info') {
      evidence.push({
        id: `EVI-${hypothesisId}-${evidenceIdx++}`,
        eventId: evt.id,
        hypothesisId,
        direction: 'neutral',
        weight: 0.1,
        description: `${evt.action} - 无直接关联`,
        category: evt.category,
      })
    }
  }

  const agentMap: Record<EventCategory, string> = {
    vpn_anomaly: 'VPN Agent',
    email_click: 'Email Agent',
    malware_execution: 'EDR Agent',
    brute_force: 'Auth Agent',
    lateral_movement: 'Network Agent',
    data_exfiltration: 'DLP Agent',
    c2_communication: 'Threat Intel Agent',
    privilege_escalation: 'IAM Agent',
    policy_violation: 'Compliance Agent',
  }

  for (const evt of matchedEvents) {
    reasoningSteps.push({
      id: `RS-${hypothesisId}-${reasoningSteps.length}`,
      hypothesisId,
      agent: agentMap[evt.category] ?? 'SOC Agent',
      step: `分析${evt.category}事件`,
      conclusion: `${evt.actor.name} ${evt.action} → ${evt.target.name}`,
      timestamp: evt.timestamp,
      evidenceIds: evidence.filter((e) => e.eventId === evt.id).map((e) => e.id),
    })
  }

  reasoningSteps.push({
    id: `RS-${hypothesisId}-conclusion`,
    hypothesisId,
    agent: 'SOC Agent',
    step: '综合研判',
    conclusion: `基于${matchedEvents.length}条关键证据，${rule.name}`,
    timestamp: new Date().toISOString(),
    evidenceIds: evidence.filter((e) => e.direction === 'supports').map((e) => e.id),
  })

  return { evidence, reasoningSteps }
}

function generateAttackPath(
  hypothesisId: string,
  matchedEvents: SecurityEvent[],
  isPrimary: boolean
): AttackPath | null {
  if (matchedEvents.length < 2) return null

  const mitreMap: Record<EventCategory, { tactic: string; technique: string }> = {
    vpn_anomaly: { tactic: 'Initial Access', technique: 'T1133' },
    email_click: { tactic: 'Initial Access', technique: 'T1566.001' },
    malware_execution: { tactic: 'Execution', technique: 'T1204.002' },
    brute_force: { tactic: 'Credential Access', technique: 'T1110.001' },
    lateral_movement: { tactic: 'Lateral Movement', technique: 'T1021' },
    data_exfiltration: { tactic: 'Exfiltration', technique: 'T1048' },
    c2_communication: { tactic: 'Command and Control', technique: 'T1071' },
    privilege_escalation: { tactic: 'Privilege Escalation', technique: 'T1134' },
    policy_violation: { tactic: 'Discovery', technique: 'T1082' },
  }

  const sorted = [...matchedEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return {
    id: `PATH-${hypothesisId}`,
    hypothesisId,
    label: isPrimary ? '主攻击路径' : '备选路径',
    stages: sorted.map((evt) => ({
      eventCategory: evt.category,
      description: evt.action,
      eventId: evt.id,
      mitreTactic: mitreMap[evt.category]?.tactic ?? 'Unknown',
      mitreTechnique: mitreMap[evt.category]?.technique ?? 'T0000',
    })),
    isPrimary,
  }
}

export function runHypothesisEngine(
  events: SecurityEvent[],
  incidentId: string
): HypothesisEngineResult {
  const hypotheses: Hypothesis[] = []
  const reasoningTrace: string[] = []
  const usedRuleIds = new Set<string>()

  reasoningTrace.push(`[${new Date().toISOString()}] Hypothesis Engine 启动，输入 ${events.length} 条事件`)

  const sortedRules = [...patternRules].sort(
    (a, b) => b.requiredCategories.length - a.requiredCategories.length
  )

  for (const rule of sortedRules) {
    const matched = matchRule(rule, events)
    if (!matched) continue
    if (usedRuleIds.has(rule.id)) continue

    reasoningTrace.push(`[${rule.id}] 模式匹配成功: ${rule.name}`)

    const hypothesisId = `HYP-${incidentId}-${hypotheses.length + 1}`
    const { evidence, reasoningSteps } = generateEvidence(
      hypothesisId,
      events,
      matched,
      rule
    )

    const hypothesisDef = rule.generateHypothesis(events, matched)

    const attackPath = generateAttackPath(
      hypothesisId,
      matched,
      hypothesisDef.status === 'primary'
    )

    hypotheses.push({
      id: hypothesisId,
      incidentId,
      name: hypothesisDef.name,
      type: 'unknown' as HypothesisType,
      description: hypothesisDef.description,
      status: hypothesisDef.status,
      confidence: 0,
      evidence,
      reasoningSteps,
      attackPaths: attackPath ? [attackPath] : [],
      lifecycle: [],
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    usedRuleIds.add(rule.id)
  }

  if (hypotheses.length === 0) {
    reasoningTrace.push('[DEFAULT] 无模式匹配，生成默认假设')
    const hypothesisId = `HYP-${incidentId}-1`
    hypotheses.push({
      id: hypothesisId,
      incidentId,
      name: 'Unknown Activity',
      type: 'unknown' as HypothesisType,
      description: '当前事件不足以匹配已知攻击模式，需要进一步调查。',
      status: 'low_probability',
      confidence: 0,
      lifecycle: [],
      evidence: events.slice(0, 3).map((evt, i) => ({
        id: `EVI-${hypothesisId}-${i}`,
        eventId: evt.id,
        hypothesisId,
        direction: 'neutral' as EvidenceDirection,
        weight: 0.2,
        description: evt.action,
        category: evt.category,
      })),
      reasoningSteps: [{
        id: `RS-${hypothesisId}-1`,
        hypothesisId,
        agent: 'SOC Agent',
        step: '初步评估',
        conclusion: '事件模式不明确，建议人工调查',
        timestamp: new Date().toISOString(),
        evidenceIds: [],
      }],
      attackPaths: [],
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  reasoningTrace.push(`生成 ${hypotheses.length} 个假设，开始置信度计算`)

  return { hypotheses, reasoningTrace }
}
