# WebSocket API

WebSocket API 提供实时消息推送能力，支持告警通知、事件更新和态势感知数据的主动推送。

## 连接信息

| 项目 | 说明 |
|------|------|
| 端点 | `wss://{host}/ws/notifications?token={jwt_token}` |
| 协议 | WebSocket（RFC 6455） |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 认证方式

WebSocket 连接通过查询参数传递 JWT Token 进行认证：

```bash
wss://api.secmind.example.com/ws/notifications?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT Token 与 REST API 的 `access_token` 共用同一套令牌体系，有效期同样为 1 小时。连接建立后，服务端验证 Token 有效性，认证通过后即建立持久连接。

## 心跳机制

WebSocket 连接使用心跳机制保持连接活跃并检测断连：

| 方向 | 消息 | 间隔 |
|------|------|------|
| 客户端 → 服务端 | `{"type": "ping"}` | 每 30 秒 |
| 服务端 → 客户端 | `{"type": "pong"}` | 收到 ping 后立即响应 |

### 断连检测

- 客户端每 30 秒发送一次 `ping`
- 服务端在收到 `ping` 后立即回复 `pong`
- 若客户端连续 3 次未收到 `pong` 响应（即 90 秒无响应），则判定连接断开并触发重连

### 心跳流程示例

```json
// 客户端发送（每 30 秒）
{"type": "ping"}

// 服务端响应
{"type": "pong"}
```

## 消息格式

所有消息均为 JSON 格式，包含一个 `type` 字段标识消息类型。

### 服务端 → 客户端

#### `new_alert`

新告警通知，当系统检测到新的安全告警时推送。

```json
{
  "type": "new_alert",
  "alert": {
    "id": "alt_001",
    "title": "疑似 Cobalt Strike C2 通信",
    "severity": "critical",
    "category": "intrusion",
    "source": "edr_sensor",
    "status": "new",
    "risk_level": "high",
    "description": "检测到主机 192.168.1.105 与已知恶意 IP 建立通信",
    "source_ip": "192.168.1.105",
    "destination_ip": "203.0.113.45",
    "detected_at": "2024-01-15T08:23:45Z",
    "match_count": 1
  },
  "timestamp": "2024-01-15T08:23:45Z"
}
```

#### `alert_update`

告警状态更新通知。

```json
{
  "type": "alert_update",
  "alert_id": "alt_001",
  "status": "investigating",
  "severity": "critical",
  "assigned_to": {
    "id": "usr_005",
    "name": "李安全"
  },
  "updated_at": "2024-01-15T08:35:00Z"
}
```

#### `action_update`

响应动作执行状态更新通知。

```json
{
  "type": "action_update",
  "action": {
    "id": "act_001",
    "type": "isolate_host",
    "status": "completed",
    "target": "192.168.1.105",
    "initiated_by": {
      "id": "usr_005",
      "name": "李安全"
    },
    "result": "success",
    "message": "主机 192.168.1.105 已成功隔离",
    "started_at": "2024-01-15T08:40:00Z",
    "completed_at": "2024-01-15T08:40:15Z"
  },
  "timestamp": "2024-01-15T08:40:15Z"
}
```

#### `notification`

系统通知消息。

```json
{
  "type": "notification",
  "notification": {
    "id": "notif_001",
    "title": "情报更新",
    "category": "threat_intel",
    "message": "已检测到新的 APT29 相关 IOC，共 15 条",
    "priority": "medium",
    "link": "/ioc?source=apt29",
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

#### `situation_update`

态势感知数据更新通知。

```json
{
  "type": "situation_update",
  "data": {
    "score": 72.5,
    "level": "guarded",
    "threats": {
      "critical": 3,
      "high": 12,
      "medium": 28,
      "low": 45
    },
    "new_alerts_last_hour": 8,
    "active_incidents": 2,
    "top_threat_types": [
      {"type": "malware", "count": 15},
      {"type": "phishing", "count": 12},
      {"type": "intrusion", "count": 8}
    ],
    "updated_at": "2024-01-15T09:00:00Z"
  }
}
```

### 客户端 → 服务端

#### `ping`

心跳检测消息。

```json
{
  "type": "ping"
}
```

## 事件类型表

| 事件类型 | 方向 | 说明 | 关键字段 |
|---------|------|------|---------|
| `ping` | 客户端 → 服务端 | 心跳检测 | `type` |
| `pong` | 服务端 → 客户端 | 心跳响应 | `type` |
| `new_alert` | 服务端 → 客户端 | 新告警通知 | `alert.id`, `alert.severity`, `alert.title` |
| `alert_update` | 服务端 → 客户端 | 告警状态变更 | `alert_id`, `status` |
| `action_update` | 服务端 → 客户端 | 响应动作状态更新 | `action.id`, `action.status` |
| `notification` | 服务端 → 客户端 | 系统通知 | `notification.id`, `notification.title` |
| `situation_update` | 服务端 → 客户端 | 态势数据更新 | `data.score`, `data.level` |

### 事件 payload 结构

#### `new_alert`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `new_alert` |
| `alert.id` | string | 是 | 告警唯一标识 |
| `alert.title` | string | 是 | 告警标题 |
| `alert.severity` | string | 是 | 严重级别：`low`, `medium`, `high`, `critical` |
| `alert.category` | string | 是 | 告警分类 |
| `alert.source` | string | 是 | 告警来源 |
| `alert.status` | string | 是 | 告警状态 |
| `alert.risk_level` | string | 是 | 风险等级 |
| `alert.description` | string | 否 | 告警描述 |
| `alert.detected_at` | string | 是 | 检测时间（ISO 8601） |
| `timestamp` | string | 是 | 推送时间（ISO 8601） |

#### `alert_update`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `alert_update` |
| `alert_id` | string | 是 | 告警唯一标识 |
| `status` | string | 是 | 更新后状态：`new`, `investigating`, `resolved`, `false_positive` |
| `severity` | string | 否 | 更新后严重级别 |
| `assigned_to` | object | 否 | 负责人信息 |
| `updated_at` | string | 是 | 更新时间（ISO 8601） |

#### `action_update`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `action_update` |
| `action.id` | string | 是 | 动作唯一标识 |
| `action.type` | string | 是 | 动作类型：`isolate_host`, `block_ip`, `kill_process`, `collect_forensics` 等 |
| `action.status` | string | 是 | 执行状态：`pending`, `running`, `completed`, `failed` |
| `action.target` | string | 是 | 动作目标 |
| `action.result` | string | 否 | 执行结果：`success`, `failure` |
| `action.message` | string | 否 | 结果描述 |
| `timestamp` | string | 是 | 推送时间（ISO 8601） |

#### `notification`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `notification` |
| `notification.id` | string | 是 | 通知唯一标识 |
| `notification.title` | string | 是 | 通知标题 |
| `notification.category` | string | 是 | 通知分类：`threat_intel`, `system`, `report`, `compliance` |
| `notification.message` | string | 是 | 通知内容 |
| `notification.priority` | string | 是 | 优先级：`low`, `medium`, `high` |
| `notification.link` | string | 否 | 跳转链接 |
| `notification.created_at` | string | 是 | 创建时间（ISO 8601） |

#### `situation_update`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `situation_update` |
| `data.score` | number | 是 | 安全态势评分（0-100） |
| `data.level` | string | 是 | 态势等级：`safe`, `guarded`, `elevated`, `high`, `severe` |
| `data.threats` | object | 是 | 各威胁等级数量统计 |
| `data.new_alerts_last_hour` | integer | 是 | 过去一小时新告警数 |
| `data.active_incidents` | integer | 是 | 活跃事件数 |
| `data.top_threat_types` | array | 否 | 主要威胁类型排行 |
| `data.updated_at` | string | 是 | 更新时间（ISO 8601） |

## 重连策略

当 WebSocket 连接意外断开时，客户端应按照以下策略自动重连：

| 参数 | 值 |
|------|-----|
| 初始重连延迟 | 1 秒 |
| 重连延迟增长 | 指数退避（1.5 倍） |
| 最大重连延迟 | 30 秒 |
| 最大重试次数 | 5 次 |

### 重连延迟计算

```
第 1 次重试：1s
第 2 次重试：1.5s
第 3 次重试：2.25s
第 4 次重试：3.375s
第 5 次重试：5.0625s
...（上限 30s，超过后固定为 30s）
```

### 重连流程

1. 检测到连接关闭或心跳超时
2. 根据重连延迟等待
3. 使用当前有效的 JWT Token 重新建立连接
4. 若 Token 已过期，先调用刷新接口获取新 Token
5. 连接成功后重新订阅消息
6. 若 5 次重试均失败，停止自动重连，上报连接失败状态

## 错误处理

服务端通过 WebSocket Close Frame 的 Close Code 传递错误信息：

| Close Code | 说明 | 处理方式 |
|-----------|------|---------|
| 4001 | 认证失败（Authentication failed） | 检查 JWT Token 是否正确 |
| 4002 | Token 过期（Token expired） | 刷新 Token 后重连 |
| 4003 | 频率限制（Rate limited） | 等待后重试 |
| 4004 | 无效消息格式（Invalid message format） | 检查消息格式是否符合规范 |

### 错误处理建议

| 错误码 | 建议操作 |
|--------|---------|
| 4001 | 检查 `token` 参数是否正确，或重新登录获取新的 JWT Token |
| 4002 | 调用 `/api/auth/refresh` 接口刷新 Token，使用新 Token 重连 |
| 4003 | 减少消息发送频率，等待 30 秒后重试 |
| 4004 | 确认消息为合法 JSON 且包含正确的 `type` 字段 |

## 代码示例

### JavaScript / TypeScript WebSocket 客户端

```typescript
type MessageHandler = (data: any) => void

interface WebSocketOptions {
  url: string
  token: string
  onMessage?: MessageHandler
  onError?: (error: Event) => void
  onClose?: (code: number) => void
}

class SecMindWebSocket {
  private ws: WebSocket | null = null
  private options: WebSocketOptions
  private pingInterval: number | null = null
  private pongTimeout: number | null = null
  private reconnectAttempts: number = 0
  private reconnectTimer: number | null = null
  private missedPongs: number = 0
  private handlers: Map<string, MessageHandler[]> = new Map()
  private destroyed: boolean = false

  private static readonly MAX_RECONNECT_ATTEMPTS = 5
  private static readonly PING_INTERVAL = 30000
  private static readonly MAX_MISSED_PONGS = 3
  private static readonly BASE_RECONNECT_DELAY = 1000
  private static readonly RECONNECT_BACKOFF = 1.5
  private static readonly MAX_RECONNECT_DELAY = 30000

  constructor(options: WebSocketOptions) {
    this.options = options
    this.connect()
  }

  private connect(): void {
    if (this.destroyed) return

    const wsUrl = `${this.options.url}?token=${this.options.token}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.missedPongs = 0
      this.startHeartbeat()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        this.routeMessage(data)
      } catch {
        console.error('Failed to parse WebSocket message')
      }
    }

    this.ws.onerror = (error: Event) => {
      this.options.onError?.(error)
    }

    this.ws.onclose = (event: CloseEvent) => {
      this.stopHeartbeat()
      this.options.onClose?.(event.code)

      if (event.code === 4001 || event.code === 4002) {
        console.error('Authentication failed, stopping reconnection')
        return
      }

      if (event.code === 4003) {
        setTimeout(() => this.reconnect(), 30000)
        return
      }

      this.scheduleReconnect()
    }
  }

  private routeMessage(data: any): void {
    const { type } = data

    if (type === 'pong') {
      this.missedPongs = 0
      return
    }

    this.options.onMessage?.(data)

    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  on(eventType: string, handler: MessageHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  off(eventType: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private startHeartbeat(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
        this.missedPongs++

        if (this.missedPongs >= SecMindWebSocket.MAX_MISSED_PONGS) {
          console.warn('Missed 3 pongs, disconnecting')
          this.ws.close()
        }
      }
    }, SecMindWebSocket.PING_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.pongTimeout !== null) {
      clearTimeout(this.pongTimeout)
      this.pongTimeout = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= SecMindWebSocket.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached')
      return
    }

    const delay = Math.min(
      SecMindWebSocket.BASE_RECONNECT_DELAY *
        Math.pow(SecMindWebSocket.RECONNECT_BACKOFF, this.reconnectAttempts),
      SecMindWebSocket.MAX_RECONNECT_DELAY
    )

    this.reconnectAttempts++
    this.reconnectTimer = window.setTimeout(() => this.reconnect(), delay)
  }

  private reconnect(): void {
    if (this.destroyed) return
    this.connect()
  }

  async refreshToken(newToken: string): Promise<void> {
    this.options.token = newToken
    if (this.ws) {
      this.ws.close()
    }
  }

  destroy(): void {
    this.destroyed = true
    this.stopHeartbeat()
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
```

### 使用示例

```typescript
const client = new SecMindWebSocket({
  url: 'wss://api.secmind.example.com/ws/notifications',
  token: 'your-jwt-token',
  onMessage: (data) => {
    console.log('收到消息:', data)
  },
  onError: (error) => {
    console.error('连接错误:', error)
  },
  onClose: (code) => {
    console.log('连接关闭, code:', code)
  }
})

// 订阅告警事件
client.on('new_alert', (data) => {
  const { alert } = data
  console.log(`新告警 [${alert.severity}]: ${alert.title}`)
  showAlertNotification(alert)
})

// 订阅告警更新
client.on('alert_update', (data) => {
  console.log(`告警 ${data.alert_id} 状态变更为: ${data.status}`)
  updateAlertStatus(data.alert_id, data.status)
})

// 订阅动作更新
client.on('action_update', (data) => {
  const { action } = data
  console.log(`动作 ${action.type} 状态: ${action.status}`)
  updateActionStatus(action.id, action.status)
})

// 订阅系统通知
client.on('notification', (data) => {
  const { notification } = data
  console.log(`通知: ${notification.title} - ${notification.message}`)
  showSystemNotification(notification)
})

// 订阅态势更新
client.on('situation_update', (data) => {
  console.log(`态势评分: ${data.data.score}, 等级: ${data.data.level}`)
  updateSituationDashboard(data.data)
})

// Token 过期时刷新
async function handleTokenRefresh() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${oldToken}` }
  })
  const { access_token } = await response.json()
  await client.refreshToken(access_token)
}

// 页面卸载时销毁连接
window.addEventListener('beforeunload', () => {
  client.destroy()
})
```

### 连接状态管理

```typescript
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

class ConnectionMonitor {
  private state: ConnectionState = ConnectionState.DISCONNECTED
  private listeners: Array<(state: ConnectionState) => void> = []

  setState(state: ConnectionState): void {
    this.state = state
    this.listeners.forEach(listener => listener(state))
  }

  getState(): ConnectionState {
    return this.state
  }

  onChange(listener: (state: ConnectionState) => void): void {
    this.listeners.push(listener)
  }

  connect(client: SecMindWebSocket): void {
    this.setState(ConnectionState.CONNECTING)

    client.on('pong', () => {
      this.setState(ConnectionState.CONNECTED)
    })
  }
}

// 使用示例
const monitor = new ConnectionMonitor()
monitor.onChange((state) => {
  switch (state) {
    case ConnectionState.CONNECTING:
      showStatus('正在连接...', 'yellow')
      break
    case ConnectionState.CONNECTED:
      showStatus('已连接', 'green')
      break
    case ConnectionState.DISCONNECTED:
      showStatus('已断开', 'red')
      break
    case ConnectionState.RECONNECTING:
      showStatus('正在重连...', 'orange')
      break
    case ConnectionState.FAILED:
      showStatus('连接失败', 'red')
      break
  }
})
```

## 注意事项

- WebSocket 连接继承 JWT Token 的权限范围，仅能接收到权限允许的事件推送
- 同一用户支持多个 WebSocket 连接，每个连接独立接收消息
- 建议在页面卸载或组件销毁时调用 `destroy()` 方法主动关闭连接，避免资源泄漏
- 生产环境中建议结合 `navigator.onLine` 事件监听网络状态变化，在网络恢复时主动触发重连