import type { SecurityEvent } from './types'

export interface GraphEntity {
  id: string
  type: 'user' | 'host' | 'ip' | 'domain' | 'account'
  name: string
  riskScore: number
  events: string[]
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  type: string
  eventId: string
  timestamp: string
  confidence: number
}

export interface GraphPath {
  entities: GraphEntity[]
  edges: GraphEdge[]
  confidence: number
}

class SecurityGraph {
  private entities: Map<string, GraphEntity> = new Map()
  private edges: GraphEdge[] = []

  loadEvents(events: SecurityEvent[]): void {
    for (const event of events) {
      const actorId = `${event.actor.type}:${event.actor.id}`
      if (!this.entities.has(actorId)) {
        this.entities.set(actorId, {
          id: actorId, type: event.actor.type, name: event.actor.name,
          riskScore: 0, events: [],
        })
      }
      const actor = this.entities.get(actorId)!
      actor.events.push(event.id)
      actor.riskScore = Math.min(1, actor.riskScore + (event.riskLevel === 'critical' ? 0.3 : event.riskLevel === 'high' ? 0.2 : 0.1))

      const targetId = `${event.target.type}:${event.target.id}`
      if (!this.entities.has(targetId)) {
        this.entities.set(targetId, {
          id: targetId, type: event.target.type, name: event.target.name,
          riskScore: 0, events: [],
        })
      }
      const target = this.entities.get(targetId)!
      target.events.push(event.id)

      this.edges.push({
        id: `edge-${this.edges.length}`,
        from: actorId,
        to: targetId,
        type: this.inferEdgeType(event),
        eventId: event.id,
        timestamp: event.timestamp,
        confidence: event.riskLevel === 'critical' ? 0.95 : event.riskLevel === 'high' ? 0.8 : 0.5,
      })
    }
  }

  getNeighbors(entityId: string): GraphEntity[] {
    const neighborIds = new Set<string>()
    for (const edge of this.edges) {
      if (edge.from === entityId) neighborIds.add(edge.to)
      if (edge.to === entityId) neighborIds.add(edge.from)
    }
    return Array.from(neighborIds).map(id => this.entities.get(id)).filter(Boolean) as GraphEntity[]
  }

  getPath(fromId: string, toId: string): GraphPath | null {
    const visited = new Set<string>()
    const queue: { entityId: string; path: { entity: GraphEntity; edge?: GraphEdge }[] }[] = [
      { entityId: fromId, path: [{ entity: this.entities.get(fromId)! }] },
    ]
    visited.add(fromId)

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.entityId === toId) {
        const entities = current.path.map(p => p.entity)
        const edges = current.path.filter(p => p.edge).map(p => p.edge!)
        const confidence = edges.length > 0
          ? edges.reduce((sum, e) => sum + e.confidence, 0) / edges.length
          : 0
        return { entities, edges, confidence }
      }

      for (const edge of this.edges) {
        let nextId: string | undefined
        if (edge.from === current.entityId && !visited.has(edge.to)) nextId = edge.to
        if (edge.to === current.entityId && !visited.has(edge.from)) nextId = edge.from
        if (nextId && this.entities.has(nextId)) {
          visited.add(nextId)
          queue.push({
            entityId: nextId,
            path: [...current.path, { entity: this.entities.get(nextId)!, edge }],
          })
        }
      }
    }
    return null
  }

  getEntity(entityId: string): GraphEntity | undefined {
    return this.entities.get(entityId)
  }

  getEntityByName(name: string): GraphEntity | undefined {
    for (const entity of this.entities.values()) {
      if (entity.name === name) return entity
    }
    return undefined
  }

  getAllEntities(): GraphEntity[] {
    return Array.from(this.entities.values())
  }

  getAllEdges(): GraphEdge[] {
    return [...this.edges]
  }

  private inferEdgeType(event: SecurityEvent): string {
    const map: Record<string, string> = {
      vpn_anomaly: 'login_from',
      email_click: 'access',
      malware_execution: 'execute',
      brute_force: 'login_from',
      lateral_movement: 'access',
      data_exfiltration: 'send',
      c2_communication: 'communicate',
      privilege_escalation: 'access',
      policy_violation: 'access',
    }
    return map[event.category] ?? 'access'
  }
}

export const securityGraph = new SecurityGraph()
