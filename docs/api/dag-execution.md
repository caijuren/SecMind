# DAG 与执行引擎 API

DAG（有向无环图）执行引擎是 SecMind v3.0 的核心编排组件，支持将安全响应流程建模为可执行的 DAG 图结构。每个节点代表一个执行步骤，边定义步骤间的依赖与执行顺序，从而实现自动化、可编排的安全处置工作流。

## DAG 执行引擎概述

DAG 执行引擎的核心能力：

- **可视化编排**：将安全响应流程拆解为多个节点，通过拖拽式或 API 方式构建执行流程
- **条件分支**：支持条件节点，根据上游执行结果动态选择执行路径
- **人工审批**：支持审批节点，在关键处置环节前暂停等待人工确认
- **延迟执行**：支持延时节点，满足时间窗口等待需求
- **并行执行**：无依赖关系的节点自动并行执行，提升处置效率
- **全流程回溯**：记录每个节点的执行状态、输入输出，支持完整的执行追溯
- **回滚支持**：支持按节点维度回滚已执行的处置动作

## 节点类型

| 节点类型 | 标识符 | 说明 |
|---------|--------|------|
| 触发节点 | `trigger` | DAG 的入口节点，定义触发条件和入参映射 |
| 动作节点 | `action` | 执行具体的处置动作，如 IP 封禁、主机隔离等 |
| 条件节点 | `condition` | 根据上游输出进行条件判断，支持多分支路由 |
| 延迟节点 | `delay` | 等待指定时间后继续执行后续节点 |
| 通知节点 | `notify` | 发送通知消息（邮件、即时消息等） |
| 审批节点 | `approval` | 暂停执行流程，等待人工审批通过后继续 |

## 动作能力

| 动作类型 | 标识符 | 说明 |
|---------|--------|------|
| IP 封禁 | `ip_block` | 在防火墙/WAF 上封禁指定 IP 地址 |
| 主机隔离 | `device_isolation` | 隔离终端设备，阻止网络通信 |
| 账号冻结 | `account_freeze` | 冻结用户账号，禁止登录访问 |
| 进程终止 | `process_kill` | 在终端上终止指定进程 |
| 文件隔离 | `file_quarantine` | 将可疑文件隔离至安全目录 |
| 域名拦截 | `domain_block` | 在 DNS/代理层面拦截恶意域名 |
| 会话失效 | `session_revoke` | 吊销用户会话 Token |
| 端口封禁 | `port_block` | 在防火墙上封禁指定端口 |
| 邮件删除 | `email_purge` | 删除指定邮件（需审批） |
| 沙箱提交 | `sandbox_submit` | 提交样本至沙箱进行分析 |

## DAG 验证规则

提交 DAG 结构时，系统执行以下验证：

| 规则 | 说明 |
|------|------|
| 有向无环 | DAG 中不得存在循环依赖 |
| 唯一入口 | DAG 必须有且仅有一个 `trigger` 类型的入口节点 |
| 节点可达 | 所有非入口节点必须至少有一个上游依赖节点 |
| 连通性 | DAG 中不得存在孤立节点 |
| 参数完整性 | 所有节点必须提供其类型所需的必填参数 |
| 条件分支完备 | 条件节点的所有出边必须覆盖 true/false 两条分支 |
| 动作能力检查 | action 节点的 `action_type` 必须在支持的动作能力列表中 |
| 审批超时 | approval 节点必须设置 `timeout_seconds`，取值范围 60~86400 |

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/dag/validate` | 验证 DAG 结构 |
| POST | `/api/v1/dag/execute/{playbook_id}` | 执行剧本 DAG |
| GET | `/api/v1/dag/status/{execution_id}` | 查询 DAG 执行状态 |
| GET | `/api/v1/dag/history` | 查询 DAG 执行历史 |
| POST | `/api/v1/execution/execute` | 执行处置动作 |
| POST | `/api/v1/execution/rollback/{execution_id}` | 回滚处置动作 |
| GET | `/api/v1/execution/status/{execution_id}` | 查询处置执行状态 |
| GET | `/api/v1/execution/capabilities` | 列出支持的动作能力 |
| GET | `/api/v1/execution/history` | 查询处置执行历史 |

---

## DAG 端点

### 验证 DAG 结构

```bash
POST /api/v1/dag/validate
```

验证 DAG 图结构的合法性，包括循环检测、节点连通性、参数完整性等。验证通过不保证执行成功，仅确保结构合法。

#### 请求体

```json
{
  "nodes": [
    {
      "id": "node_trigger",
      "type": "trigger",
      "label": "事件触发",
      "config": {
        "event_types": ["incident.created", "alert.fired"]
      }
    },
    {
      "id": "node_condition",
      "type": "condition",
      "label": "严重级别判断",
      "config": {
        "expression": "{{trigger.severity}} == 'critical'"
      }
    },
    {
      "id": "node_block_ip",
      "type": "action",
      "label": "封禁恶意 IP",
      "config": {
        "action_type": "ip_block",
        "parameters": {
          "ip": "{{trigger.src_ip}}",
          "duration_minutes": 1440
        }
      }
    },
    {
      "id": "node_isolate",
      "type": "action",
      "label": "隔离受影响主机",
      "config": {
        "action_type": "device_isolation",
        "parameters": {
          "device_id": "{{trigger.asset_id}}",
          "isolation_level": "full"
        }
      }
    },
    {
      "id": "node_notify",
      "type": "notify",
      "label": "通知安全团队",
      "config": {
        "channels": ["email", "webhook"],
        "template_id": "tmpl_incident_critical",
        "recipients": ["soc@company.com"]
      }
    }
  ],
  "edges": [
    {"source": "node_trigger", "target": "node_condition"},
    {"source": "node_condition", "target": "node_block_ip", "label": "true"},
    {"source": "node_condition", "target": "node_notify", "label": "false"},
    {"source": "node_block_ip", "target": "node_isolate"},
    {"source": "node_isolate", "target": "node_notify"}
  ],
  "playbook_id": "pb_001"
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nodes` | array | 是 | DAG 节点列表 |
| `nodes[].id` | string | 是 | 节点唯一标识符 |
| `nodes[].type` | string | 是 | 节点类型：trigger, action, condition, delay, notify, approval |
| `nodes[].label` | string | 否 | 节点显示名称 |
| `nodes[].config` | object | 是 | 节点配置，根据类型不同而不同 |
| `edges` | array | 是 | DAG 边列表，定义节点间的依赖关系 |
| `edges[].source` | string | 是 | 上游节点 ID |
| `edges[].target` | string | 是 | 下游节点 ID |
| `edges[].label` | string | 否 | 边的标签，条件节点必须为 `true` 或 `false` |
| `playbook_id` | string | 否 | 关联的剧本 ID |

#### 响应示例 — 验证通过

```json
{
  "data": {
    "valid": true,
    "playbook_id": "pb_001",
    "node_count": 5,
    "edge_count": 5,
    "checks": {
      "acyclic": {"passed": true},
      "single_entry": {"passed": true},
      "node_reachability": {"passed": true},
      "connectivity": {"passed": true},
      "param_completeness": {"passed": true},
      "condition_branches": {"passed": true},
      "action_capability": {"passed": true}
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

#### 响应示例 — 验证失败

```json
{
  "data": {
    "valid": false,
    "playbook_id": "pb_001",
    "node_count": 5,
    "edge_count": 4,
    "checks": {
      "acyclic": {"passed": true},
      "single_entry": {"passed": true},
      "node_reachability": {"passed": true},
      "connectivity": {"passed": false, "errors": ["节点 'node_isolate' 为孤立节点，缺少上游依赖"]},
      "param_completeness": {"passed": true},
      "condition_branches": {"passed": false, "errors": ["条件节点 'node_condition' 缺少 'false' 分支"]},
      "action_capability": {"passed": true}
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

---

### 执行剧本 DAG

```bash
POST /api/v1/dag/execute/{playbook_id}
```

提交 DAG 执行请求。系统会先验证 DAG 结构，验证通过后异步执行。返回 `execution_id` 用于后续状态查询。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `playbook_id` | string | 是 | 剧本 ID |

#### 请求体

```json
{
  "input": {
    "trigger": {
      "severity": "critical",
      "src_ip": "45.33.32.156",
      "asset_id": "WS-FINANCE-01",
      "alert_ids": ["alt_001", "alt_002"]
    }
  },
  "parameters": {
    "block_duration": 1440,
    "notify_soc": true
  },
  "reason": "检测到疑似勒索软件活动，自动执行隔离和封禁流程",
  "async": true
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `input` | object | 是 | DAG 执行输入数据，作为模板变量的上下文 |
| `parameters` | object | 否 | 覆盖剧本中的默认参数 |
| `reason` | string | 否 | 执行原因说明 |
| `async` | boolean | 否 | 是否异步执行，默认 `true` |

#### 响应示例

```json
{
  "data": {
    "execution_id": "exec_001",
    "playbook_id": "pb_001",
    "status": "running",
    "node_count": 5,
    "current_node": "node_condition",
    "started_at": "2024-01-15T08:30:00Z",
    "estimated_completion": "2024-01-15T08:32:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

---

### 查询 DAG 执行状态

```bash
GET /api/v1/dag/status/{execution_id}
```

查询指定 DAG 执行的完整状态，包括每个节点的执行详情。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `execution_id` | string | 是 | 执行 ID |

#### 响应示例

```json
{
  "data": {
    "execution_id": "exec_001",
    "playbook_id": "pb_001",
    "status": "completed",
    "progress": {
      "total_nodes": 5,
      "completed_nodes": 5,
      "failed_nodes": 0,
      "pending_nodes": 0,
      "skipped_nodes": 1
    },
    "nodes": [
      {
        "node_id": "node_trigger",
        "type": "trigger",
        "status": "completed",
        "started_at": "2024-01-15T08:30:00Z",
        "completed_at": "2024-01-15T08:30:01Z",
        "duration_ms": 1200,
        "output": {
          "severity": "critical",
          "src_ip": "45.33.32.156",
          "asset_id": "WS-FINANCE-01"
        }
      },
      {
        "node_id": "node_condition",
        "type": "condition",
        "status": "completed",
        "started_at": "2024-01-15T08:30:01Z",
        "completed_at": "2024-01-15T08:30:01Z",
        "duration_ms": 50,
        "output": {
          "result": true,
          "selected_branch": "true"
        }
      },
      {
        "node_id": "node_block_ip",
        "type": "action",
        "status": "completed",
        "started_at": "2024-01-15T08:30:01Z",
        "completed_at": "2024-01-15T08:30:05Z",
        "duration_ms": 4200,
        "action_type": "ip_block",
        "output": {
          "action_id": "act_001",
          "target": "45.33.32.156",
          "device": "firewall-01",
          "status": "blocked"
        }
      },
      {
        "node_id": "node_isolate",
        "type": "action",
        "status": "completed",
        "started_at": "2024-01-15T08:30:05Z",
        "completed_at": "2024-01-15T08:30:08Z",
        "duration_ms": 3100,
        "action_type": "device_isolation",
        "output": {
          "action_id": "act_002",
          "target": "WS-FINANCE-01",
          "isolation_active": true,
          "isolated_at": "2024-01-15T08:30:07Z"
        }
      },
      {
        "node_id": "node_notify",
        "type": "notify",
        "status": "completed",
        "started_at": "2024-01-15T08:30:08Z",
        "completed_at": "2024-01-15T08:30:09Z",
        "duration_ms": 800,
        "output": {
          "channels": ["email", "webhook"],
          "delivery_status": "sent"
        }
      }
    ],
    "started_at": "2024-01-15T08:30:00Z",
    "completed_at": "2024-01-15T08:30:10Z",
    "total_duration_ms": 10150,
    "triggered_by": "usr_005"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:10Z"
  }
}
```

#### 执行状态枚举

| 状态 | 说明 |
|------|------|
| `pending` | 等待执行 |
| `running` | 执行中 |
| `completed` | 执行完成（全部节点完成或跳过） |
| `failed` | 执行失败 |
| `paused` | 已暂停（等待审批节点） |
| `cancelled` | 已取消 |
| `rollback_pending` | 等待回滚 |
| `rollback_in_progress` | 回滚中 |
| `rollback_completed` | 回滚完成 |
| `rollback_failed` | 回滚失败 |

---

### 查询 DAG 执行历史

```bash
GET /api/v1/dag/history
```

查询 DAG 剧本的执行历史记录。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `playbook_id` | string | 否 | 按剧本 ID 筛选 |
| `status` | string | 否 | 按执行状态筛选 |
| `triggered_by` | string | 否 | 按执行人筛选 |
| `created_after` | string | 否 | 起始时间 |
| `created_before` | string | 否 | 结束时间 |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页数量 |

#### 响应示例

```json
{
  "data": [
    {
      "execution_id": "exec_001",
      "playbook_id": "pb_001",
      "playbook_name": "勒索软件自动处置",
      "status": "completed",
      "node_count": 5,
      "completed_nodes": 5,
      "failed_nodes": 0,
      "started_at": "2024-01-15T08:30:00Z",
      "completed_at": "2024-01-15T08:30:10Z",
      "total_duration_ms": 10150,
      "triggered_by": "usr_005",
      "reason": "检测到疑似勒索软件活动"
    },
    {
      "execution_id": "exec_002",
      "playbook_id": "pb_001",
      "playbook_name": "勒索软件自动处置",
      "status": "failed",
      "node_count": 5,
      "completed_nodes": 3,
      "failed_nodes": 1,
      "started_at": "2024-01-14T14:00:00Z",
      "completed_at": "2024-01-14T14:00:15Z",
      "total_duration_ms": 15200,
      "triggered_by": "system",
      "reason": "自动触发：严重告警关联",
      "error": "节点 'node_isolate' 执行失败：目标设备离线"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 15,
    "total_pages": 1
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T09:00:00Z"
  }
}
```

---

## 执行端点

### 执行处置动作

```bash
POST /api/v1/execution/execute
```

执行单个处置动作，不依赖 DAG 编排流程。适用于需要快速执行单一处置操作的场景。

#### 请求体

```json
{
  "action_type": "ip_block",
  "target": {
    "ip": "45.33.32.156",
    "device_id": "fw-001"
  },
  "parameters": {
    "duration_minutes": 1440,
    "reason": "检测到与 C2 服务器通信"
  },
  "incident_id": "inc_001",
  "approval_required": false,
  "async": true
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action_type` | string | 是 | 动作类型，必须是支持的动作能力之一 |
| `target` | object | 是 | 动作目标 |
| `target.ip` | string | 条件 | 目标 IP（ip_block/domain_block 时必填） |
| `target.device_id` | string | 条件 | 目标设备 ID（device_isolation 时必填） |
| `target.account` | string | 条件 | 目标账号（account_freeze 时必填） |
| `target.host` | string | 条件 | 目标主机（process_kill/file_quarantine 时必填） |
| `target.port` | integer | 条件 | 目标端口（port_block 时必填） |
| `parameters` | object | 否 | 动作参数，根据 action_type 不同而不同 |
| `incident_id` | string | 否 | 关联的事件 ID |
| `approval_required` | boolean | 否 | 是否需要审批，默认 `false` |
| `async` | boolean | 否 | 是否异步执行，默认 `true` |

#### 响应示例

```json
{
  "data": {
    "execution_id": "exec_exec_001",
    "action_type": "ip_block",
    "target": {
      "ip": "45.33.32.156",
      "device_id": "fw-001"
    },
    "status": "running",
    "approval_required": false,
    "created_at": "2024-01-15T08:30:00Z",
    "incident_id": "inc_001"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

---

### 回滚处置动作

```bash
POST /api/v1/execution/rollback/{execution_id}
```

回滚指定的处置动作。并非所有动作都支持回滚，具体取决于动作类型的实现。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `execution_id` | string | 是 | 处置执行 ID |

#### 请求体

```json
{
  "reason": "误报，目标 IP 为合法业务地址",
  "force": false
}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reason` | string | 是 | 回滚原因说明 |
| `force` | boolean | 否 | 是否强制回滚，即使原始动作已过期 |

#### 响应示例

```json
{
  "data": {
    "rollback_id": "rb_001",
    "execution_id": "exec_exec_001",
    "action_type": "ip_block",
    "status": "rollback_in_progress",
    "reason": "误报，目标 IP 为合法业务地址",
    "original_action": {
      "target": "45.33.32.156",
      "executed_at": "2024-01-15T08:30:00Z",
      "expires_at": "2024-01-16T08:30:00Z"
    },
    "started_at": "2024-01-15T09:15:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T09:15:00Z"
  }
}
```

---

### 查询处置执行状态

```bash
GET /api/v1/execution/status/{execution_id}
```

查询单个处置动作的执行状态。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `execution_id` | string | 是 | 处置执行 ID |

#### 响应示例

```json
{
  "data": {
    "execution_id": "exec_exec_001",
    "action_type": "ip_block",
    "status": "completed",
    "target": {
      "ip": "45.33.32.156",
      "device_id": "fw-001"
    },
    "result": {
      "device": "firewall-01",
      "rule_id": "acl_98765",
      "action": "block",
      "blocked_at": "2024-01-15T08:30:03Z",
      "expires_at": "2024-01-16T08:30:00Z"
    },
    "approved_by": null,
    "executed_by": "system",
    "incident_id": "inc_001",
    "created_at": "2024-01-15T08:30:00Z",
    "completed_at": "2024-01-15T08:30:05Z",
    "duration_ms": 5000
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:05Z"
  }
}
```

#### 处置状态枚举

| 状态 | 说明 |
|------|------|
| `pending` | 等待执行 |
| `pending_approval` | 等待审批 |
| `running` | 执行中 |
| `completed` | 执行成功 |
| `failed` | 执行失败 |
| `cancelled` | 已取消 |
| `rollback_pending` | 等待回滚 |
| `rollback_in_progress` | 回滚中 |
| `rollback_completed` | 回滚完成 |
| `rollback_failed` | 回滚失败 |
| `expired` | 处置已过期 |

---

### 列出支持的动作能力

```bash
GET /api/v1/execution/capabilities
```

查询系统当前支持的所有处置动作类型及其配置参数。

#### 响应示例

```json
{
  "data": [
    {
      "action_type": "ip_block",
      "name": "IP 封禁",
      "description": "在防火墙或 WAF 上封禁指定 IP 地址",
      "supported_devices": ["firewall", "waf", "ips"],
      "parameters": {
        "required": ["ip", "duration_minutes"],
        "optional": [
          {"name": "direction", "type": "string", "default": "both", "enum": ["inbound", "outbound", "both"]},
          {"name": "reason", "type": "string"},
          {"name": "rule_name", "type": "string"}
        ]
      },
      "supports_rollback": true,
      "approval_required": false,
      "timeout_seconds": 30
    },
    {
      "action_type": "device_isolation",
      "name": "主机隔离",
      "description": "隔离终端设备，阻止其与网络中其他设备通信",
      "supported_devices": ["edr", "nac"],
      "parameters": {
        "required": ["device_id"],
        "optional": [
          {"name": "isolation_level", "type": "string", "default": "full", "enum": ["full", "partial", "network_only"]},
          {"name": "duration_minutes", "type": "integer", "default": 120},
          {"name": "allowlist", "type": "array"}
        ]
      },
      "supports_rollback": true,
      "approval_required": true,
      "timeout_seconds": 60
    },
    {
      "action_type": "account_freeze",
      "name": "账号冻结",
      "description": "冻结用户账号，禁止登录和访问系统资源",
      "supported_devices": ["iam", "ad", "sso"],
      "parameters": {
        "required": ["account"],
        "optional": [
          {"name": "duration_minutes", "type": "integer", "default": 1440},
          {"name": "reason", "type": "string"},
          {"name": "notify_user", "type": "boolean", "default": false}
        ]
      },
      "supports_rollback": true,
      "approval_required": true,
      "timeout_seconds": 30
    },
    {
      "action_type": "process_kill",
      "name": "进程终止",
      "description": "在终端上终止指定进程",
      "supported_devices": ["edr"],
      "parameters": {
        "required": ["host", "pid"],
        "optional": [
          {"name": "process_name", "type": "string"},
          {"name": "force", "type": "boolean", "default": false}
        ]
      },
      "supports_rollback": false,
      "approval_required": true,
      "timeout_seconds": 30
    },
    {
      "action_type": "file_quarantine",
      "name": "文件隔离",
      "description": "将可疑文件隔离至安全目录，阻止其继续执行",
      "supported_devices": ["edr"],
      "parameters": {
        "required": ["host", "file_path"],
        "optional": [
          {"name": "quarantine_dir", "type": "string"},
          {"name": "delete_original", "type": "boolean", "default": false}
        ]
      },
      "supports_rollback": true,
      "approval_required": false,
      "timeout_seconds": 30
    },
    {
      "action_type": "domain_block",
      "name": "域名拦截",
      "description": "在 DNS 或代理层面拦截恶意域名",
      "supported_devices": ["dns", "proxy", "waf"],
      "parameters": {
        "required": ["domain"],
        "optional": [
          {"name": "duration_minutes", "type": "integer", "default": 1440},
          {"name": "scope", "type": "string", "default": "global", "enum": ["global", "vlan", "user_group"]}
        ]
      },
      "supports_rollback": true,
      "approval_required": false,
      "timeout_seconds": 30
    },
    {
      "action_type": "session_revoke",
      "name": "会话失效",
      "description": "吊销用户的登录会话 Token，强制重新认证",
      "supported_devices": ["iam", "sso"],
      "parameters": {
        "required": ["account"],
        "optional": [
          {"name": "revoke_all_sessions", "type": "boolean", "default": true}
        ]
      },
      "supports_rollback": false,
      "approval_required": true,
      "timeout_seconds": 15
    },
    {
      "action_type": "port_block",
      "name": "端口封禁",
      "description": "在防火墙上封禁指定端口，阻止特定协议的通信",
      "supported_devices": ["firewall"],
      "parameters": {
        "required": ["port", "protocol"],
        "optional": [
          {"name": "direction", "type": "string", "default": "inbound", "enum": ["inbound", "outbound", "both"]},
          {"name": "source_ip", "type": "string"},
          {"name": "duration_minutes", "type": "integer", "default": 1440}
        ],
        "protocol_enum": ["tcp", "udp", "both"]
      },
      "supports_rollback": true,
      "approval_required": false,
      "timeout_seconds": 30
    },
    {
      "action_type": "email_purge",
      "name": "邮件删除",
      "description": "从用户邮箱中删除指定邮件（通常需要审批）",
      "supported_devices": ["exchange", "email_gateway"],
      "parameters": {
        "required": ["message_id", "mailbox"],
        "optional": [
          {"name": "purge_from_all", "type": "boolean", "default": true},
          {"name": "notify_recipients", "type": "boolean", "default": false}
        ]
      },
      "supports_rollback": false,
      "approval_required": true,
      "timeout_seconds": 60
    },
    {
      "action_type": "sandbox_submit",
      "name": "沙箱提交",
      "description": "提交样本文件至沙箱环境进行动态分析",
      "supported_devices": ["sandbox"],
      "parameters": {
        "required": ["file_hash", "file_name"],
        "optional": [
          {"name": "platform", "type": "string", "default": "windows_10", "enum": ["windows_10", "windows_11", "ubuntu"]},
          {"name": "timeout_minutes", "type": "integer", "default": 5},
          {"name": "tags", "type": "array"}
        ]
      },
      "supports_rollback": false,
      "approval_required": false,
      "timeout_seconds": 120
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

---

### 查询处置执行历史

```bash
GET /api/v1/execution/history
```

查询处置动作的执行历史记录。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action_type` | string | 否 | 按动作类型筛选 |
| `status` | string | 否 | 按执行状态筛选 |
| `target_ip` | string | 否 | 按目标 IP 筛选 |
| `target_device` | string | 否 | 按目标设备筛选 |
| `incident_id` | string | 否 | 按关联事件 ID 筛选 |
| `executed_by` | string | 否 | 按执行人筛选 |
| `created_after` | string | 否 | 起始时间 |
| `created_before` | string | 否 | 结束时间 |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页数量 |

#### 响应示例

```json
{
  "data": [
    {
      "execution_id": "exec_exec_001",
      "action_type": "ip_block",
      "status": "completed",
      "target": {
        "ip": "45.33.32.156",
        "device_id": "fw-001"
      },
      "result_summary": "防火墙 fw-001 已封禁 45.33.32.156，有效期至 2024-01-16T08:30:00Z",
      "incident_id": "inc_001",
      "executed_by": "system",
      "created_at": "2024-01-15T08:30:00Z",
      "completed_at": "2024-01-15T08:30:05Z",
      "duration_ms": 5000
    },
    {
      "execution_id": "exec_exec_002",
      "action_type": "device_isolation",
      "status": "failed",
      "target": {
        "device_id": "WS-FINANCE-02"
      },
      "result_summary": "目标设备 WS-FINANCE-02 当前离线，无法执行隔离",
      "incident_id": "inc_001",
      "executed_by": "usr_005",
      "created_at": "2024-01-15T08:35:00Z",
      "completed_at": "2024-01-15T08:35:03Z",
      "duration_ms": 3000,
      "error": "设备离线"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 42,
    "total_pages": 3
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T09:00:00Z"
  }
}
```

---

## 错误码

### DAG 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `DAG_VALIDATION_ERROR` | 400 | DAG 结构验证失败 |
| `DAG_CYCLE_DETECTED` | 400 | DAG 中存在循环依赖 |
| `DAG_INVALID_ENTRY` | 400 | 缺少入口节点或多个入口节点 |
| `DAG_DISCONNECTED_NODE` | 400 | 存在孤立节点 |
| `DAG_CONDITION_INCOMPLETE` | 400 | 条件节点分支不完整 |
| `DAG_PARAM_MISSING` | 400 | 节点缺少必填参数 |
| `PLAYBOOK_NOT_FOUND` | 404 | 剧本不存在 |
| `PLAYBOOK_EXECUTION_ERROR` | 500 | 剧本执行异常 |

### 执行错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `EXECUTION_NOT_FOUND` | 404 | 执行记录不存在 |
| `ACTION_TYPE_UNSUPPORTED` | 400 | 不支持的处置动作类型 |
| `ACTION_TARGET_INVALID` | 400 | 动作目标参数无效 |
| `ACTION_EXECUTION_FAILED` | 500 | 处置动作执行失败 |
| `ACTION_ROLLBACK_FAILED` | 500 | 回滚操作失败 |
| `ACTION_ROLLBACK_UNSUPPORTED` | 400 | 该动作类型不支持回滚 |
| `ACTION_ALREADY_ROLLED_BACK` | 409 | 该处置已被回滚 |
| `APPROVAL_REQUIRED` | 202 | 需要审批后才能执行 |
| `APPROVAL_TIMEOUT` | 408 | 审批超时 |
| `DEVICE_UNAVAILABLE` | 503 | 目标设备不可用 |
| `CAPABILITY_QUERY_FAILED` | 500 | 查询动作能力列表失败 |

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `PERMISSION_DENIED` | 403 | 权限不足 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTEGRATION_ERROR` | 502 | 外部集成系统异常 |