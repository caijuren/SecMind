import type { SecurityEvent, EventCategory } from './types'
import type { Alert, VPNSession, EmailLog, LoginAttempt } from '@/types'

function mapAlertType(type: Alert['type']): EventCategory {
  const map: Record<Alert['type'], EventCategory> = {
    phishing: 'email_click',
    brute_force: 'brute_force',
    vpn_anomaly: 'vpn_anomaly',
    malware: 'malware_execution',
    data_exfiltration: 'data_exfiltration',
    privilege_escalation: 'privilege_escalation',
    lateral_movement: 'lateral_movement',
    c2_communication: 'c2_communication',
  }
  return map[type]
}

export function alertToEvent(alert: Alert): SecurityEvent {
  return {
    id: alert.id,
    timestamp: alert.timestamp,
    category: mapAlertType(alert.type),
    actor: { id: alert.userId ?? 'unknown', type: 'user', name: alert.userName ?? 'Unknown' },
    target: { id: alert.destinationIp, type: 'ip', name: alert.destinationIp },
    action: alert.title,
    raw: alert.rawLog,
    riskLevel: alert.riskLevel,
    source: alert.source,
    metadata: { type: alert.type, tags: alert.tags.join(',') },
  }
}

export function vpnToEvent(vpn: VPNSession): SecurityEvent {
  return {
    id: vpn.id,
    timestamp: vpn.connectTime,
    category: 'vpn_anomaly',
    actor: { id: vpn.userId, type: 'user', name: vpn.userName },
    target: { id: vpn.destinationIp, type: 'ip', name: vpn.destinationIp },
    action: `VPN异常登录 from ${vpn.location}`,
    raw: `VPN session from ${vpn.sourceIp} to ${vpn.destinationIp}, location=${vpn.location}, anomaly=${vpn.anomalyReason ?? 'unknown'}`,
    riskLevel: 'high',
    source: 'VPN Gateway',
    metadata: {
      sourceIp: vpn.sourceIp,
      location: vpn.location,
      country: vpn.country,
      duration: String(vpn.duration),
      dataTransferred: String(vpn.dataTransferred),
      anomalyReason: vpn.anomalyReason ?? '',
    },
  }
}

export function emailToEvent(email: EmailLog): SecurityEvent {
  return {
    id: email.id,
    timestamp: email.timestamp,
    category: 'email_click',
    actor: { id: email.sender, type: 'user', name: email.sender },
    target: { id: email.recipient, type: 'account', name: email.recipient },
    action: `Phishing email: ${email.subject}`,
    raw: `From=${email.sender} To=${email.recipient} Subject=${email.subject} Attachments=${email.hasAttachment} URLs=${email.urls.join(';')}`,
    riskLevel: email.spamScore > 0.8 ? 'critical' : email.spamScore > 0.5 ? 'high' : 'medium',
    source: 'Email Gateway',
    metadata: {
      subject: email.subject,
      hasAttachment: String(email.hasAttachment),
      attachmentName: email.attachmentName ?? '',
      urls: email.urls.join(';'),
      phishingIndicators: email.phishingIndicators?.join(';') ?? '',
      spamScore: String(email.spamScore),
    },
  }
}

export function loginToEvent(login: LoginAttempt): SecurityEvent {
  return {
    id: login.id,
    timestamp: login.timestamp,
    category: 'brute_force',
    actor: { id: login.sourceIp, type: 'host', name: login.sourceIp },
    target: { id: login.userId, type: 'account', name: login.userName },
    action: `Failed login attempt for ${login.userName} from ${login.city}, ${login.country}`,
    raw: `User=${login.userId} IP=${login.sourceIp} Location=${login.city}, ${login.country} UA=${login.userAgent} Reason=${login.failureReason ?? 'unknown'}`,
    riskLevel: 'high',
    source: 'Authentication System',
    metadata: {
      sourceIp: login.sourceIp,
      country: login.country,
      city: login.city,
      userAgent: login.userAgent,
      failureReason: login.failureReason ?? '',
    },
  }
}

export function allEventsFromMockData(data: {
  alerts: Alert[]
  vpnSessions: VPNSession[]
  emailLogs: EmailLog[]
  loginAttempts: LoginAttempt[]
}): SecurityEvent[] {
  return [
    ...data.alerts.map(alertToEvent),
    ...data.vpnSessions.filter(v => v.isAnomaly).map(vpnToEvent),
    ...data.emailLogs.filter(e => e.isPhishing).map(emailToEvent),
    ...data.loginAttempts.filter(l => !l.success).map(loginToEvent),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
