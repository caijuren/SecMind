import { create } from 'zustand'
import type { Alert, AlertType, RiskLevel as TypeRiskLevel } from '@/types'
import { useMockDataStore } from '@/store/mock-data-store'
import type { RiskLevel } from '@/lib/risk-config'

// ==================== Signals 页面类型 ====================

export type SignalSource = "EDR" | "VPN" | "IAM" | "Email" | "Firewall" | "DNS"
export type AIPreprocess = "去噪" | "聚合" | "上下文补全" | "风险评分"

export interface LiveSignal {
  id: string
  timestamp: string
  receivedTime: string
  source: SignalSource
  sourceSystemName: string
  rawInput: string
  sourceAnalysis: string
  sourceSuggestion: string
  aiPreprocess: AIPreprocess
  aiPreprocessResult: string
  aiClassification: string
  riskLevel: RiskLevel
}

export interface AnomalousActivity {
  id: string
  behavior: string
  riskScore: number
  riskLevel: RiskLevel
  source: SignalSource
  entities: string[]
  aiAssessment: string
  aiReasoning: string
  timestamp: string
}

export interface RiskCluster {
  id: string
  signalCount: number
  riskScore: number
  riskLevel: RiskLevel
  entities: string[]
  aiAssessment: string
  attackType: string
  lastUpdated: string
}

// ==================== Pipeline 页面类型 ====================

export interface AlertGroup {
  id: string
  title: string
  source: string
  severity: "critical" | "high" | "medium"
  originalCount: number
  processedCount: number
  techniques: string[]
  time: string
  status: "completed" | "processing"
}

// ==================== 映射工具 ====================

const SOURCE_MAP: Record<string, SignalSource> = {
  '邮件网关': 'Email',
  'VPN网关': 'VPN',
  'EDR': 'EDR',
  'SIEM': 'Firewall',
  '防火墙': 'Firewall',
  'DLP': 'Firewall',
  'WAF': 'Firewall',
  'NAC': 'Firewall',
  '堡垒机': 'IAM',
  'HIDS': 'EDR',
}

const TYPE_TO_TECHNIQUE: Record<AlertType, string> = {
  phishing: 'T1566',
  brute_force: 'T1110',
  vpn_anomaly: 'T1078',
  malware: 'T1059',
  data_exfiltration: 'T1041',
  privilege_escalation: 'T1068',
  lateral_movement: 'T1021',
  c2_communication: 'T1071',
}

const TYPE_TO_CLASSIFICATION: Record<AlertType, string> = {
  phishing: '钓鱼攻击',
  brute_force: '暴力破解',
  vpn_anomaly: 'VPN异常',
  malware: '恶意软件',
  data_exfiltration: '数据外泄',
  privilege_escalation: '权限提升',
  lateral_movement: '横向移动',
  c2_communication: 'C2通信',
}

const TYPE_TO_ATTACK_TYPE: Record<AlertType, string> = {
  phishing: '钓鱼攻击',
  brute_force: '暴力破解',
  vpn_anomaly: 'VPN异常登录',
  malware: '恶意软件',
  data_exfiltration: '数据外泄',
  privilege_escalation: '权限提升',
  lateral_movement: '横向移动',
  c2_communication: 'C2通信',
}

const PREPROCESS_OPTIONS: AIPreprocess[] = ['去噪', '聚合', '上下文补全', '风险评分']

function mapRiskLevel(level: TypeRiskLevel): RiskLevel {
  if (level === 'info') return 'low'
  return level as RiskLevel
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

function formatReceivedTime(ts: string): string {
  const d = new Date(ts)
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

// ==================== 派生函数 ====================

function deriveSignals(alerts: Alert[]): LiveSignal[] {
  const sorted = [...alerts].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  return sorted.slice(0, 50).map((alert, idx) => {
    const source = SOURCE_MAP[alert.source] || 'Firewall'
    const preprocess = PREPROCESS_OPTIONS[idx % PREPROCESS_OPTIONS.length]
    return {
      id: `SIG-${String(idx + 1).padStart(3, '0')}`,
      timestamp: formatTimestamp(alert.timestamp),
      receivedTime: formatReceivedTime(alert.timestamp),
      source,
      sourceSystemName: alert.source,
      rawInput: alert.rawLog,
      sourceAnalysis: alert.aiSummary || alert.description,
      sourceSuggestion: alert.aiRecommendation || '建议确认后根据标准操作流程处理。',
      aiPreprocess: preprocess,
      aiPreprocessResult: preprocess === '去噪'
        ? `过滤${Math.floor(Math.random() * 5) + 1}条重复日志，识别${TYPE_TO_CLASSIFICATION[alert.type]}行为`
        : preprocess === '聚合'
        ? `关联同一来源的${Math.floor(Math.random() * 5) + 2}次连接，识别${TYPE_TO_CLASSIFICATION[alert.type]}模式`
        : preprocess === '上下文补全'
        ? `补充用户画像：${alert.userName || '未知用户'}，${TYPE_TO_CLASSIFICATION[alert.type]}首次触发`
        : `风险评分${alert.aiScore || 50}/100，${TYPE_TO_CLASSIFICATION[alert.type]}确认`,
      aiClassification: TYPE_TO_CLASSIFICATION[alert.type],
      riskLevel: mapRiskLevel(alert.riskLevel),
    }
  })
}

function deriveAnomalousActivities(alerts: Alert[]): AnomalousActivity[] {
  const highRisk = alerts.filter(a =>
    a.riskLevel === 'critical' || a.riskLevel === 'high'
  ).slice(0, 15)
  return highRisk.map((alert, idx) => {
    const source = SOURCE_MAP[alert.source] || 'Firewall'
    return {
      id: `ANO-${String(idx + 1).padStart(3, '0')}`,
      behavior: `${alert.title} - ${alert.description.slice(0, 80)}`,
      riskScore: alert.aiScore || 60,
      riskLevel: mapRiskLevel(alert.riskLevel),
      source,
      entities: [alert.userName || '未知', alert.sourceIp, alert.destinationIp].filter(Boolean) as string[],
      aiAssessment: alert.aiSummary || '需进一步分析',
      aiReasoning: alert.aiRecommendation || '建议确认后处理',
      timestamp: formatTimestamp(alert.timestamp),
    }
  })
}

function deriveRiskClusters(alerts: Alert[]): RiskCluster[] {
  const grouped = new Map<AlertType, Alert[]>()
  for (const alert of alerts) {
    const arr = grouped.get(alert.type) || []
    arr.push(alert)
    grouped.set(alert.type, arr)
  }
  const clusters: RiskCluster[] = []
  let idx = 1
  for (const [type, groupAlerts] of grouped) {
    if (groupAlerts.length === 0) continue
    const riskScores = groupAlerts.map(a => a.aiScore || 50)
    const avgScore = Math.round(riskScores.reduce((s, v) => s + v, 0) / riskScores.length)
    const highestRisk = groupAlerts.reduce<RiskLevel>((max, a) => {
      const r = mapRiskLevel(a.riskLevel)
      if (r === 'critical') return 'critical'
      if (r === 'high' && max !== 'critical') return 'high'
      if (r === 'medium' && max !== 'critical' && max !== 'high') return 'medium'
      return max
    }, 'low')
    clusters.push({
      id: `CLUSTER-${String(idx).padStart(3, '0')}`,
      signalCount: groupAlerts.length,
      riskScore: avgScore,
      riskLevel: highestRisk,
      entities: [...new Set(groupAlerts.flatMap(a => [a.sourceIp, a.userName || ''].filter(Boolean)))].slice(0, 5),
      aiAssessment: `${TYPE_TO_CLASSIFICATION[type]}集群，共${groupAlerts.length}条告警，平均风险评分${avgScore}`,
      attackType: TYPE_TO_ATTACK_TYPE[type],
      lastUpdated: formatTimestamp(groupAlerts[0].timestamp),
    })
    idx++
  }
  return clusters.sort((a, b) => b.riskScore - a.riskScore)
}

function deriveAlertGroups(alerts: Alert[]): AlertGroup[] {
  const grouped = new Map<AlertType, Alert[]>()
  for (const alert of alerts) {
    const arr = grouped.get(alert.type) || []
    arr.push(alert)
    grouped.set(alert.type, arr)
  }
  const groups: AlertGroup[] = []
  let idx = 1
  for (const [type, groupAlerts] of grouped) {
    if (groupAlerts.length === 0) continue
    const originalCount = groupAlerts.length
    const processedCount = Math.max(1, Math.floor(originalCount * 0.15))
    const highestRisk = groupAlerts.reduce<"critical" | "high" | "medium">((max, a) => {
      const r = mapRiskLevel(a.riskLevel)
      if (r === 'critical') return 'critical'
      if (r === 'high' && max !== 'critical') return 'high'
      return max
    }, 'medium')
    groups.push({
      id: `ag-${String(idx).padStart(3, '0')}`,
      title: `${TYPE_TO_CLASSIFICATION[type]}集群`,
      source: groupAlerts[0].source,
      severity: highestRisk,
      originalCount,
      processedCount,
      techniques: [TYPE_TO_TECHNIQUE[type], TYPE_TO_CLASSIFICATION[type]],
      time: formatTimestamp(groupAlerts[0].timestamp),
      status: idx % 4 === 0 ? 'processing' : 'completed',
    })
    idx++
  }
  return groups.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 }
    return order[a.severity] - order[b.severity]
  })
}

// ==================== Store ====================

interface UnifiedDataState {
  signals: LiveSignal[]
  anomalousActivities: AnomalousActivity[]
  riskClusters: RiskCluster[]
  alertGroups: AlertGroup[]
  isLoaded: boolean
}

interface UnifiedDataActions {
  initialize: () => void
  refresh: () => void
}

export type UnifiedDataStore = UnifiedDataState & UnifiedDataActions

// ==================== Auto-initialize from mock data ====================

function createInitialData(): Pick<UnifiedDataState, 'signals' | 'anomalousActivities' | 'riskClusters' | 'alertGroups' | 'isLoaded'> {
  const alerts = useMockDataStore.getState().alerts
  if (alerts.length === 0) {
    return { signals: [], anomalousActivities: [], riskClusters: [], alertGroups: [], isLoaded: false }
  }
  return {
    signals: deriveSignals(alerts),
    anomalousActivities: deriveAnomalousActivities(alerts),
    riskClusters: deriveRiskClusters(alerts),
    alertGroups: deriveAlertGroups(alerts),
    isLoaded: true,
  }
}

export const useUnifiedDataStore = create<UnifiedDataStore>()((set, get) => ({
  ...createInitialData(),

  initialize: () => {
    if (get().isLoaded) return
    const alerts = useMockDataStore.getState().alerts
    if (alerts.length === 0) return

    set({
      signals: deriveSignals(alerts),
      anomalousActivities: deriveAnomalousActivities(alerts),
      riskClusters: deriveRiskClusters(alerts),
      alertGroups: deriveAlertGroups(alerts),
      isLoaded: true,
    })
  },

  refresh: () => {
    const alerts = useMockDataStore.getState().alerts
    if (alerts.length === 0) return

    set({
      signals: deriveSignals(alerts),
      anomalousActivities: deriveAnomalousActivities(alerts),
      riskClusters: deriveRiskClusters(alerts),
      alertGroups: deriveAlertGroups(alerts),
      isLoaded: true,
    })
  },
}))
