# 事件响应

SecMind 的事件响应功能提供结构化的安全事件处置流程，支持自动化响应与人工协同。

## 功能概述

事件响应模块提供以下核心能力：

- **事件管理**：安全事件的创建、分类、追踪和闭环
- **响应动作**：预定义和自定义的响应动作库
- **协同处置**：多人协作的事件响应工作流
- **自动化响应**：基于规则的自动响应执行
- **响应审计**：完整的响应操作审计日志

## 使用方式

### 事件创建与分类

安全事件可通过以下方式创建：

1. **告警升级**：告警研判后升级为安全事件
2. **手动创建**：分析师手动创建事件
3. **自动创建**：基于规则自动创建事件

```python
# 通过 API 创建安全事件
POST /api/response/incidents
{
  "title": "疑似勒索软件感染事件",
  "severity": "critical",
  "category": "malware",
  "description": "终端 EDR 检测到疑似勒索软件行为，多个文件被加密",
  "affected_assets": ["WS-FINANCE-01", "WS-FINANCE-02"],
  "indicators": [
    {
      "type": "file_hash",
      "value": "sha256:def456..."
    },
    {
      "type": "process_name",
      "value": "encryptor.exe"
    }
  ],
  "assigned_to": "analyst@company.com"
}
```

<!-- 截图占位符：事件创建界面 -->

```
[截图：事件响应 - 创建安全事件界面]
```

### 响应动作执行

对事件执行响应动作：

```python
# 执行隔离主机动作
POST /api/response/actions
{
  "incident_id": "inc_001",
  "action_type": "isolate_host",
  "parameters": {
    "host": "WS-FINANCE-01",
    "isolation_level": "full",
    "duration_minutes": 120,
    "allowlist": ["10.0.0.1"]
  },
  "approval_required": true
}
```

#### 内置响应动作

| 动作 | 说明 | 所需权限 |
|------|------|---------|
| `isolate_host` | 隔离受感染主机 | `response:execute` |
| `block_ip` | 封禁 IP 地址 | `response:execute` |
| `block_domain` | 封禁域名 | `response:execute` |
| `disable_user` | 禁用用户账户 | `response:execute` |
| `quarantine_file` | 隔离恶意文件 | `response:execute` |
| `reset_password` | 重置用户密码 | `response:execute:high` |
| `kill_process` | 终止可疑进程 | `response:execute` |
| `add_ioc` | 添加 IOC 到情报库 | `response:execute` |

### 事件状态流转

```
新建 → 确认 → 调查 → 遏制 → 消除 → 恢复 → 关闭
  │                                          │
  └──────────→ 误报 ──────────────────────────┘
```

```python
# 更新事件状态
PATCH /api/response/incidents/inc_001
{
  "status": "containment",
  "notes": "已隔离受感染主机，阻断横向移动路径",
  "timeline_entry": {
    "action": "host_isolated",
    "operator": "analyst@company.com",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

<!-- 截图占位符：事件详情界面 -->

```
[截图：事件响应 - 事件详情与时间线界面]
```

### 协同处置

支持多人协作处理同一事件：

```python
# 添加协作者
POST /api/response/incidents/inc_001/collaborators
{
  "user_id": "responder@company.com",
  "role": "responder",
  "permissions": ["execute_actions", "add_notes"]
}

# 添加处置备注
POST /api/response/incidents/inc_001/notes
{
  "content": "已完成主机隔离，建议下一步进行恶意样本分析",
  "visibility": "team"
}
```

## 配置选项

### 响应策略配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `auto_response` | 是否启用自动响应 | `false` |
| `approval_required` | 响应动作是否需要审批 | `true` |
| `max_response_time_minutes` | 最大响应时间 SLA | `60` |
| `escalation_rules` | 自动升级规则 | 见下文 |
| `notification_channels` | 通知渠道 | `email` |

### 自动升级规则

```json
{
  "escalation_rules": [
    {
      "condition": {
        "severity": "critical",
        "unassigned_minutes": 15
      },
      "action": "escalate_to_team",
      "target": "soc-leads"
    },
    {
      "condition": {
        "severity": "high",
        "unassigned_minutes": 30
      },
      "action": "escalate_to_team",
      "target": "soc-analysts"
    }
  ]
}
```

### 通知配置

```json
{
  "notification_channels": [
    {
      "type": "email",
      "config": {
        "recipients": ["soc@company.com"],
        "template": "incident_notification"
      }
    },
    {
      "type": "webhook",
      "config": {
        "url": "https://hooks.slack.com/services/xxx",
        "method": "POST"
      }
    }
  ]
}
```

## 最佳实践

1. **明确分级标准**：建立清晰的事件严重级别定义和升级标准
2. **预置响应动作**：提前配置常用响应动作，缩短响应时间
3. **定期演练**：通过模拟攻击定期演练响应流程
4. **完整记录**：确保每个响应步骤都有审计记录
