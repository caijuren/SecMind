export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'false_positive' | 'escalated'

export type AlertType = 'phishing' | 'brute_force' | 'vpn_anomaly' | 'malware' | 'data_exfiltration' | 'privilege_escalation' | 'lateral_movement' | 'c2_communication'

export interface User {
  id: string
  name: string
  department: string
  position: string
  level: string
  manager: string
  isSensitive: boolean
  office: string
  recentLoginLocation: string
  isOnLeave: boolean
  isResigned: boolean
  email: string
  avatar?: string
}

export interface Alert {
  id: string
  type: AlertType
  title: string
  description: string
  riskLevel: RiskLevel
  status: AlertStatus
  source: string
  sourceIp: string
  destinationIp: string
  userId?: string
  userName?: string
  timestamp: string
  rawLog: string
  tags: string[]
  aiScore?: number
  aiSummary?: string
  aiRecommendation?: string
  relatedAlerts?: string[]
  timeline?: TimelineEvent[]
}

export interface TimelineEvent {
  id: string
  timestamp: string
  type: 'alert' | 'log' | 'action' | 'ai_analysis'
  title: string
  description: string
  source?: string
}

export interface Device {
  id: string
  name: string
  type: string
  ip: string
  port: number
  protocol: string
  status: 'online' | 'offline' | 'warning'
  lastSync: string
  logFormat: string
  vendor: string
}

export interface ITSMTicket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: RiskLevel
  assignee: string
  alertId?: string
  createdAt: string
  updatedAt: string
  resolution?: string
}

export interface AIAnalysis {
  id: string
  alertId: string
  conclusion: string
  riskScore: number
  riskLevel: RiskLevel
  attackChain: string[]
  recommendations: string[]
  relatedEvents: string[]
  userContext?: string
  timestamp: string
  agentType: string
}

export interface VPNSession {
  id: string
  userId: string
  userName: string
  sourceIp: string
  destinationIp: string
  location: string
  country: string
  connectTime: string
  disconnectTime?: string
  duration: number
  dataTransferred: number
  isAnomaly: boolean
  anomalyReason?: string
}

export interface EmailLog {
  id: string
  sender: string
  recipient: string
  subject: string
  timestamp: string
  hasAttachment: boolean
  attachmentName?: string
  urls: string[]
  isPhishing: boolean
  phishingIndicators?: string[]
  spamScore: number
}

export interface LoginAttempt {
  id: string
  userId: string
  userName: string
  sourceIp: string
  country: string
  city: string
  userAgent: string
  timestamp: string
  success: boolean
  failureReason?: string
}

export interface DashboardStats {
  totalAlerts: number
  criticalAlerts: number
  highAlerts: number
  aiProcessedRate: number
  emailAttacks: number
  vpnAnomalies: number
  bruteForceAttempts: number
  avgResponseTime: number
  alertsTrend: { date: string; count: number }[]
  riskDistribution: { level: string; count: number }[]
  topAttackTypes: { type: string; count: number }[]
}
