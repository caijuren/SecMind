import { create } from 'zustand'
import type { RiskLevel } from '@/lib/risk-config'
import type {
  InvestigationRecord,
  InvestigationStatus,
  SourceEvent,
  AIReasoningStep,
} from '@/data/investigations'

// ==================== Types ====================

export interface SignalInvestigationStatus {
  signalId: string
  investigationId: string | null
  status: InvestigationStatus | 'new'  // 'new' means not yet investigated
  quickActions: QuickAction[]  // quick response actions from signals page
}

export interface QuickAction {
  id: string
  action: string  // e.g. "隔离主机", "阻断IP"
  target: string  // e.g. "SRV-DB-01", "103.45.67.89"
  timestamp: string
  source: 'signal' | 'workbench'  // where the action was initiated
}

interface WorkbenchBridgeState {
  // Signal → Investigation mapping
  signalStatusMap: Record<string, SignalInvestigationStatus>

  // All investigation records (including dynamically created ones)
  investigationRecords: InvestigationRecord[]

  // Actions
  createInvestigationFromSignal: (params: CreateInvestigationParams) => InvestigationRecord
  updateInvestigationStatus: (investigationId: string, status: InvestigationStatus) => void
  addQuickAction: (signalId: string, action: QuickAction) => void
  getInvestigationBySignalId: (signalId: string) => InvestigationRecord | undefined
  getSignalStatus: (signalId: string) => SignalInvestigationStatus | undefined
}

export interface CreateInvestigationParams {
  signalId: string
  source: string
  sourceSystemName: string
  classification: string
  riskLevel: RiskLevel
  rawInput: string
  receivedTime: string
  triggerType: 'auto' | 'manual'
}

// ==================== Helper: Generate mock reasoning steps ====================

function generateReasoningSteps(params: CreateInvestigationParams): AIReasoningStep[] {
  const now = new Date()
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  const confidence = params.riskLevel === 'critical' ? 85 + Math.floor(Math.random() * 10) :
    params.riskLevel === 'high' ? 65 + Math.floor(Math.random() * 20) :
    params.riskLevel === 'medium' ? 40 + Math.floor(Math.random() * 25) :
    20 + Math.floor(Math.random() * 20)

  return [
    {
      time: ts,
      step: '信号发现',
      detail: `AI检测到${params.source}来源的${params.classification}事件`,
      type: 'discover' as const,
      confidenceContribution: Math.floor(confidence * 0.4),
      reasoning: `来源系统${params.sourceSystemName}上报安全事件，原始内容：${params.rawInput.slice(0, 80)}...`,
      evidence: [
        {
          source: params.sourceSystemName,
          type: 'log' as const,
          content: params.rawInput,
          severity: params.riskLevel === 'critical' ? 'critical' as const : params.riskLevel === 'high' ? 'high' as const : 'medium' as const,
          timestamp: params.receivedTime,
        },
      ],
    },
    {
      time: ts,
      step: 'AI初步分析',
      detail: `正在进行多维度关联分析，置信度评估中...`,
      type: 'correlate' as const,
      confidenceContribution: Math.floor(confidence * 0.3),
      reasoning: 'AI正在关联威胁情报、历史基线、资产信息等多维度数据进行综合研判',
      evidence: [],
    },
    {
      time: ts,
      step: '等待研判',
      detail: 'AI推理链路构建中，请稍候查看完整研判结果',
      type: 'judge' as const,
      confidenceContribution: Math.floor(confidence * 0.3),
      reasoning: '等待更多关联数据和证据收集完成',
      evidence: [],
    },
  ]
}

// ==================== Store ====================

export const useWorkbenchBridgeStore = create<WorkbenchBridgeState>((set, get) => ({
  signalStatusMap: {},
  investigationRecords: [],

  createInvestigationFromSignal: (params: CreateInvestigationParams) => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const ts = `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const invId = `INV-${now.getFullYear()}-${String(get().investigationRecords.length + 100).padStart(4, '0')}`

    const confidence = params.riskLevel === 'critical' ? 85 + Math.floor(Math.random() * 10) :
      params.riskLevel === 'high' ? 65 + Math.floor(Math.random() * 20) :
      params.riskLevel === 'medium' ? 40 + Math.floor(Math.random() * 25) :
      20 + Math.floor(Math.random() * 20)

    // Extract asset from raw input
    const hostMatch = params.rawInput.match(/HOST=(\S+)/)
    const srcMatch = params.rawInput.match(/SRC=(\S+)/)
    const userMatch = params.rawInput.match(/USER=(\S+)/)
    const asset = hostMatch?.[1] || srcMatch?.[1] || params.source

    const sourceEvent: SourceEvent = {
      eventId: params.signalId,
      source: params.source,
      sourceSystemName: params.sourceSystemName,
      classification: params.classification,
      riskLevel: params.riskLevel,
      rawInput: params.rawInput,
      receivedTime: params.receivedTime,
    }

    const record: InvestigationRecord = {
      id: invId,
      title: params.classification,
      description: `来自${params.sourceSystemName}的${params.riskLevel === 'critical' ? '严重' : params.riskLevel === 'high' ? '高危' : params.riskLevel === 'medium' ? '中危' : '低危'}安全事件，AI正在研判中`,
      asset,
      status: 'investigating',
      sourceEvent,
      triggerType: params.triggerType,
      aiReasoningSteps: generateReasoningSteps(params),
      confidence,
      aiConclusion: null,
      disposalSuggestion: null,
      entities: [asset, userMatch?.[1]].filter(Boolean) as string[],
      involvedAssets: [asset],
      involvedAccounts: userMatch ? [userMatch[1]] : [],
      createdAt: ts,
      updatedAt: ts,
    }

    set((state) => ({
      investigationRecords: [record, ...state.investigationRecords],
      signalStatusMap: {
        ...state.signalStatusMap,
        [params.signalId]: {
          signalId: params.signalId,
          investigationId: invId,
          status: 'investigating',
          quickActions: [],
        },
      },
    }))

    return record
  },

  updateInvestigationStatus: (investigationId: string, status: InvestigationStatus) => {
    set((state) => {
      const updatedRecords = state.investigationRecords.map(r =>
        r.id === investigationId ? { ...r, status, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') } : r
      )

      // Find signal ID for this investigation
      const signalEntry = Object.entries(state.signalStatusMap).find(([_, v]) => v.investigationId === investigationId)
      const signalId = signalEntry?.[0]

      const updatedMap = signalId ? {
        ...state.signalStatusMap,
        [signalId]: { ...state.signalStatusMap[signalId], status },
      } : state.signalStatusMap

      return { investigationRecords: updatedRecords, signalStatusMap: updatedMap }
    })
  },

  addQuickAction: (signalId: string, action: QuickAction) => {
    set((state) => {
      const existing = state.signalStatusMap[signalId]
      if (!existing) return state

      return {
        signalStatusMap: {
          ...state.signalStatusMap,
          [signalId]: {
            ...existing,
            quickActions: [...existing.quickActions, action],
          },
        },
      }
    })
  },

  getInvestigationBySignalId: (signalId: string) => {
    const state = get()
    const entry = state.signalStatusMap[signalId]
    if (!entry?.investigationId) return undefined
    return state.investigationRecords.find(r => r.id === entry.investigationId)
  },

  getSignalStatus: (signalId: string) => {
    return get().signalStatusMap[signalId]
  },
}))
