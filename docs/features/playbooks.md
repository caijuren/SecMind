# 剧本自动化

SecMind 的剧本自动化功能提供可视化剧本编排引擎，支持复杂安全运营流程的自动化执行。

## 功能概述

剧本自动化模块提供以下核心能力：

- **可视化编排**：拖拽式剧本编辑器，支持 DAG 工作流设计
- **丰富节点**：内置多种动作节点和逻辑控制节点
- **条件分支**：基于条件的动态分支执行
- **并行执行**：支持多分支并行执行
- **人工审批**：支持在关键步骤插入人工审批节点
- **异常处理**：完善的超时、重试和异常处理机制

## 使用方式

### 创建剧本

1. 进入「剧本管理」模块
2. 点击「新建剧本」
3. 在可视化编辑器中编排工作流

<!-- 截图占位符：剧本编辑器 -->

```
[截图：剧本自动化 - 可视化剧本编辑器界面]
```

### 剧本结构

一个剧本由以下元素组成：

```python
# 通过 API 创建剧本
POST /api/playbooks
{
  "name": "勒索软件应急响应",
  "description": "针对勒索软件攻击的标准化应急响应流程",
  "trigger": {
    "type": "alert_match",
    "conditions": {
      "category": "malware",
      "severity": ["high", "critical"],
      "malware_type": "ransomware"
    }
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "action",
      "name": "隔离受感染主机",
      "action": "isolate_host",
      "parameters": {
        "isolation_level": "full"
      },
      "next": ["node_2", "node_3"]
    },
    {
      "id": "node_2",
      "type": "action",
      "name": "收集恶意样本",
      "action": "collect_forensics",
      "parameters": {
        "evidence_types": ["memory_dump", "disk_image"]
      }
    },
    {
      "id": "node_3",
      "type": "action",
      "name": "封禁 C2 通信",
      "action": "block_ip",
      "parameters": {
        "source": "alert.indicators.c2_ips"
      }
    },
    {
      "id": "node_4",
      "type": "approval",
      "name": "确认恢复操作",
      "approvers": ["soc-lead@company.com"],
      "timeout_minutes": 30,
      "next": ["node_5"]
    },
    {
      "id": "node_5",
      "type": "action",
      "name": "恢复主机",
      "action": "restore_host",
      "parameters": {
        "restore_point": "latest_clean"
      }
    }
  ]
}
```

### 节点类型

#### 动作节点

执行具体的响应操作：

| 节点 | 说明 | 参数示例 |
|------|------|---------|
| `isolate_host` | 隔离主机 | `{ "host": "{{alert.source_ip}}" }` |
| `block_ip` | 封禁 IP | `{ "ip": "{{alert.indicators.ip}}", "duration": 3600 }` |
| `block_domain` | 封禁域名 | `{ "domain": "{{alert.indicators.domain}}" }` |
| `send_notification` | 发送通知 | `{ "channel": "email", "recipients": ["soc@co.com"] }` |
| `run_script` | 执行脚本 | `{ "script": "custom_check.py", "timeout": 60 }` |
| `ai_analysis` | AI 分析 | `{ "prompt": "分析此告警...", "model": "gpt-4" }` |

#### 逻辑控制节点

| 节点 | 说明 |
|------|------|
| `condition` | 条件判断，根据条件走不同分支 |
| `parallel` | 并行执行多个分支 |
| `loop` | 循环执行，支持迭代列表数据 |
| `delay` | 延迟等待 |
| `approval` | 人工审批，等待审批人确认 |

### 触发方式

剧本支持多种触发方式：

```python
# 告警匹配触发
"trigger": {
  "type": "alert_match",
  "conditions": {
    "category": "malware",
    "severity": ["high", "critical"]
  }
}

# 定时触发
"trigger": {
  "type": "schedule",
  "cron": "0 9 * * 1-5"
}

# 手动触发
"trigger": {
  "type": "manual"
}

# Webhook 触发
"trigger": {
  "type": "webhook",
  "path": "/webhooks/custom-trigger"
}
```

### 执行与监控

```bash
# 手动触发剧本执行
curl -X POST /api/playbooks/pb_001/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "parameters": {
      "alert_id": "alert_12345"
    }
  }'
```

<!-- 截图占位符：剧本执行监控 -->

```
[截图：剧本自动化 - 执行监控界面，展示各节点执行状态]
```

## 配置选项

### 执行引擎配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `max_concurrent_executions` | 最大并发执行数 | `10` |
| `default_timeout_minutes` | 默认超时时间 | `60` |
| `retry_attempts` | 失败重试次数 | `3` |
| `retry_delay_seconds` | 重试间隔 | `30` |
| `approval_timeout_minutes` | 审批超时时间 | `120` |
| `approval_timeout_action` | 审批超时动作 | `cancel` |

### 变量与模板

剧本支持变量引用和模板语法：

```json
{
  "variables": {
    "alert_id": "{{trigger.alert_id}}",
    "source_ip": "{{trigger.alert.source_ip}}",
    "severity": "{{trigger.alert.severity}}"
  },
  "templates": {
    "notification_subject": "安全事件：{{severity}} - {{alert_id}}",
    "notification_body": "检测到来自 {{source_ip}} 的可疑活动..."
  }
}
```

## 最佳实践

1. **模块化设计**：将常用流程封装为子剧本，提高复用性
2. **设置超时**：为每个节点设置合理的超时时间，避免流程卡住
3. **异常处理**：为关键节点配置异常处理分支
4. **审批节点**：在高风险操作前插入人工审批节点
5. **版本管理**：剧本变更时保留历史版本，便于回滚
