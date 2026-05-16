# 实时更新 (WebSocket Realtime)

## 功能概述

- **WebSocket 实时通信定位**：毫秒级数据推送，确保安全事件第一时间触达
- **核心价值**：无需手动刷新，数据自动更新，告别 F5 时代

## 技术架构

| 项目 | 说明 |
|------|------|
| 协议 | WebSocket (`wss://`) |
| 认证 | JWT Token 查询参数 |
| 心跳 | 每 30 秒 ping/pong |
| 重连 | 指数退避（1.5 倍递增，最大 30 秒） |

### 连接流程

1. 客户端携带 JWT Token 发起 WebSocket 连接请求
2. 服务端校验 Token 合法性，校验通过后建立连接
3. 连接建立后，每 30 秒进行一次心跳探测
4. 若连接断开，客户端按指数退避策略自动重连

### 重连策略

- 首次重连等待时间：1 秒
- 后续每次等待时间 ×1.5
- 最大等待时间上限：30 秒
- 超过上限后固定为 30 秒间隔

## 实时事件

### 告警事件

| 事件类型 | 说明 | 触发场景 |
|----------|------|----------|
| `new_alert` | 新告警到达 | 安全检测引擎产生新告警时推送 |
| `alert_update` | 告警状态变更 | 告警被确认、关闭、升级等状态变化 |
| `alert_status` | 告警批量状态 | 批量操作后返回的告警状态汇总 |

**事件示例：**

```json
{
  "type": "new_alert",
  "data": {
    "id": "alert_xxxxx",
    "title": "检测到异常登录行为",
    "severity": "high",
    "timestamp": "2026-05-16T10:30:00Z"
  }
}
```

### 处置事件

| 事件类型 | 说明 | 触发场景 |
|----------|------|----------|
| `action_update` | 处置动作状态变更 | 处置任务进度更新、完成或失败 |
| `action_status` | 处置批量状态 | 批量处置操作后的状态汇总 |

### 通知事件

| 事件类型 | 说明 | 触发场景 |
|----------|------|----------|
| `notification` | 系统通知 | 系统公告、任务提醒、审批通知等 |

**通知能力：**

- **桌面通知**：通过浏览器 Notification API 弹出原生桌面通知
- **未读计数**：实时更新文档标题上的未读消息数量徽标
- **通知中心**：侧边栏通知列表实时刷新

### 态势事件

| 事件类型 | 说明 | 触发场景 |
|----------|------|----------|
| `situation_update` | 态势数据更新 | 安全态势大盘数据周期性刷新 |
| `score_change` | 安全评分变更 | 安全评分因告警处置产生变化时推送 |

## 前端 Hook

### useWebSocket

核心 WebSocket 连接管理 Hook，负责底层连接的生命周期管理。

| 能力 | 说明 |
|------|------|
| 自动连接/重连 | 登录成功后自动建立连接，断线后按指数退略自动重连 |
| 消息类型路由 | 根据消息 `type` 字段自动分发到对应的处理函数 |
| 连接状态管理 | 提供 `connected`、`connecting`、`disconnected` 三种状态 |
| 心跳保活 | 内置 30 秒心跳机制，自动维持连接 |

```typescript
const { status, connect, disconnect } = useWebSocket()
```

### useRealtimeAlerts

实时告警订阅 Hook，与告警 Store 深度集成。

| 能力 | 说明 |
|------|------|
| 订阅实时告警 | 监听 `new_alert` 和 `alert_update` 事件 |
| 自动写入告警 Store | 新告警自动追加到全局告警状态中 |
| 新告警计数 | 维护未读新告警数量，支持角标展示 |

```typescript
const { unreadCount, alerts } = useRealtimeAlerts()
```

### useNotifications

实时通知订阅 Hook，融合浏览器原生通知能力。

| 能力 | 说明 |
|------|------|
| 订阅实时通知 | 监听 `notification` 事件并解析通知内容 |
| 浏览器桌面通知 | 调用 Notification API 弹出系统级通知（需用户授权） |
| 文档标题未读计数 | 在页面标题上动态显示未读通知数量 |
| 标记已读 | 支持单条和批量标记通知为已读状态 |

```typescript
const { notify, markAsRead, markAllAsRead } = useNotifications()
```

## 使用方式

- **无需配置**：用户登录后系统自动建立 WebSocket 连接，零额外操作
- **连接状态指示器**：页面顶部提供三色状态灯

| 状态 | 颜色 | 说明 |
|------|------|------|
| 已连接 | 🟢 绿色 | WebSocket 连接正常 |
| 连接中 | 🟡 黄色 | 正在建立或重连中 |
| 断开 | 🔴 红色 | 连接已断开，正在自动重连 |

- **断线自动重连**：无需人工干预，系统按指数退避策略持续尝试恢复连接

## 最佳实践

- **确保 WebSocket 端口可访问**：检查防火墙和安全组策略，确保 WebSocket 通信端口未被拦截
- **反向代理需支持 WebSocket**：Nginx 等反向代理需配置 `Upgrade` 和 `Connection` 头透传，示例如下：

```nginx
location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

- **负载均衡需配置会话亲和性**：WebSocket 为长连接，负载均衡需开启会话保持（sticky session），避免连接漂移导致频繁重连
- **生产环境务必使用 WSS**：`wss://` 协议提供 TLS 加密传输，防止数据在传输过程中被窃听或篡改
- **监控连接健康度**：建议对 WebSocket 连接成功率、重连次数、消息延迟等指标进行监控，及时发现网络或服务异常