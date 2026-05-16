# AI 聊天 API

AI 聊天 API 提供智能对话、安全分析辅助和调查报告生成功能，支持与 AI 安全助手的交互式会话。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/ai-chat/sessions` | 获取会话列表 |
| POST | `/api/v1/ai-chat/sessions` | 创建新会话 |
| GET | `/api/v1/ai-chat/sessions/{id}` | 获取会话详情 |
| DELETE | `/api/v1/ai-chat/sessions/{id}` | 删除会话 |
| POST | `/api/v1/ai-chat/sessions/{id}/messages` | 发送消息 |
| GET | `/api/v1/ai-chat/tools` | 获取可用工具列表 |
| POST | `/api/v1/ai-chat/sessions/{id}/report` | 生成调查报告 |
| GET | `/api/v1/ai-chat/reports` | 获取报告列表 |
| POST | `/api/v1/ai-chat/reports` | 创建报告 |
| GET | `/api/v1/ai-chat/reports/{id}` | 获取报告详情 |
| PUT | `/api/v1/ai-chat/reports/{id}` | 更新报告 |
| DELETE | `/api/v1/ai-chat/reports/{id}` | 删除报告 |

## 获取会话列表

```bash
GET /api/v1/ai-chat/sessions
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 会话状态：active, archived |
| `search` | string | 否 | 关键词搜索（匹配标题） |
| `created_after` | string | 否 | 创建时间起始（ISO 8601） |
| `created_before` | string | 否 | 创建时间截止（ISO 8601） |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-chat/sessions?status=active&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": "sess_001",
      "title": "C2 通信分析",
      "status": "active",
      "message_count": 15,
      "tool_calls": 8,
      "summary": "分析了可疑 IP 45.33.32.156 的 C2 通信特征",
      "created_at": "2024-01-15T08:23:45Z",
      "updated_at": "2024-01-15T09:10:00Z"
    },
    {
      "id": "sess_002",
      "title": "告警研判 - 钓鱼邮件",
      "status": "active",
      "message_count": 7,
      "tool_calls": 3,
      "summary": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:15:30Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 2,
    "total_pages": 1
  }
}
```

## 创建新会话

```bash
POST /api/v1/ai-chat/sessions
```

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 会话标题（自动生成如未提供） |
| `context` | object | 否 | 初始上下文信息 |
| `context.alert_id` | string | 否 | 关联的告警 ID |
| `context.incident_id` | string | 否 | 关联的事件 ID |
| `context.ioc_values` | array | 否 | 关联的 IOC 值列表 |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-chat/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "C2 通信分析",
    "context": {
      "alert_id": "alt_001",
      "ioc_values": ["45.33.32.156", "evil.c2-domain.com"]
    }
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "sess_003",
    "title": "C2 通信分析",
    "status": "active",
    "context": {
      "alert_id": "alt_001",
      "incident_id": null,
      "ioc_values": ["45.33.32.156", "evil.c2-domain.com"]
    },
    "message_count": 0,
    "tool_calls": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## 获取会话详情

```bash
GET /api/v1/ai-chat/sessions/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 会话 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `include_messages` | boolean | 否 | 是否包含消息列表（默认 true） |
| `page` | integer | 否 | 消息页码（默认 1） |
| `page_size` | integer | 否 | 每页消息数量（默认 50，最大 200） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-chat/sessions/sess_001?include_messages=true&page=1&page_size=50" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": "sess_001",
    "title": "C2 通信分析",
    "status": "active",
    "context": {
      "alert_id": "alt_001",
      "incident_id": null,
      "ioc_values": ["45.33.32.156"]
    },
    "message_count": 15,
    "tool_calls": 8,
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "请分析 IP 45.33.32.156 的威胁情报",
        "created_at": "2024-01-15T08:23:45Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "IP 45.33.32.156 具有以下威胁特征：\n\n1. **威胁情报匹配**\n   - VirusTotal：52/70 引擎标记为恶意\n   - OTX：标记为已知 C2 服务器\n   - 关联家族：Cobalt Strike\n\n2. **历史行为**\n   - 过去 30 天与 15 个内部主机通信\n   - 通信协议：HTTPS（端口 443）\n\n3. **风险评分**：95/100（极高）",
        "tool_calls": [
          {
            "tool": "threat_intel_lookup",
            "parameters": {
              "value": "45.33.32.156",
              "type": "ip"
            },
            "result": "vt_malicious:52/70, otx:known_c2"
          }
        ],
        "created_at": "2024-01-15T08:24:10Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total": 15,
      "total_pages": 1
    },
    "created_at": "2024-01-15T08:23:45Z",
    "updated_at": "2024-01-15T09:10:00Z"
  }
}
```

## 删除会话

```bash
DELETE /api/v1/ai-chat/sessions/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 会话 ID |

### 请求示例

```bash
curl -X DELETE "https://api.secmind.example.com/api/v1/ai-chat/sessions/sess_001" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

状态码：`204 No Content`，无返回内容。

## 发送消息

```bash
POST /api/v1/ai-chat/sessions/{id}/messages
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 会话 ID |

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 消息内容 |
| `attachments` | array | 否 | 附件列表 |
| `attachments[].type` | string | 否 | 附件类型：ioc, log, file, image |
| `attachments[].value` | string | 否 | 附件值或引用 |
| `attachments[].name` | string | 否 | 附件名称 |
| `model` | string | 否 | 模型选择（默认使用会话模型） |
| `stream` | boolean | 否 | 是否启用流式响应（默认 false） |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-chat/sessions/sess_001/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "请检查这个域名是否与已知恶意软件家族关联：evil.c2-domain.com",
    "attachments": [
      {
        "type": "ioc",
        "value": "evil.c2-domain.com",
        "name": "可疑域名"
      }
    ]
  }'
```

### 响应示例（非流式）

```json
{
  "data": {
    "id": "msg_016",
    "role": "assistant",
    "content": "已对域名 evil.c2-domain.com 完成分析：\n\n## 域名信息\n- **域名**：evil.c2-domain.com\n- **注册时间**：2023-11-20\n- **注册商**：GoDaddy\n- **注册邮箱**：`admin@privacy-protection.org`\n\n## 威胁关联\n| 恶意软件家族 | 置信度 | 证据 |\n|------------|--------|------|\n| Cobalt Strike | 高 | 证书指纹、JA3 签名匹配 |\n| RedLine Stealer | 中 | 域名模式相似度 78% |\n\n## 建议\n该域名高度可疑，建议在防火墙和 DNS 层面进行封锁。",
    "tool_calls": [
      {
        "tool": "domain_reputation",
        "parameters": {
          "domain": "evil.c2-domain.com"
        },
        "result": "cobalt_strike:high_confidence"
      },
      {
        "tool": "whois_lookup",
        "parameters": {
          "domain": "evil.c2-domain.com"
        },
        "result": "registered:2023-11-20, registrar:GoDaddy"
      }
    ],
    "created_at": "2024-01-15T09:15:00Z"
  }
}
```

### 流式响应

当 `stream` 参数为 `true` 时，响应采用 Server-Sent Events (SSE) 格式：

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-chat/sessions/sess_001/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "content": "分析一下这个域名的威胁情况",
    "stream": true
  }'
```

```
event: message_start
data: {"message_id": "msg_016", "session_id": "sess_001"}

event: content_delta
data: {"delta": "已对域名 "}

event: content_delta
data: {"delta": "evil.c2-domain.com"}

event: content_delta
data: {"delta": " 完成分析"}

event: tool_call_start
data: {"tool": "domain_reputation", "parameters": {"domain": "evil.c2-domain.com"}}

event: tool_call_result
data: {"tool": "domain_reputation", "result": "cobalt_strike:high_confidence"}

event: content_delta
data: {"delta": "\n\n该域名与 Cobalt Strike 关联。"}

event: message_done
data: {"message_id": "msg_016", "usage": {"prompt_tokens": 120, "completion_tokens": 45, "total_tokens": 165}}

event: done
```

## 获取可用工具列表

```bash
GET /api/v1/ai-chat/tools
```

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-chat/tools" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "name": "threat_intel_lookup",
      "display_name": "威胁情报查询",
      "description": "查询 IP、域名、哈希等 IOC 的威胁情报信息",
      "parameters": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "要查询的 IOC 值"
          },
          "type": {
            "type": "string",
            "enum": ["ip", "domain", "hash", "url", "email"],
            "description": "IOC 类型"
          }
        },
        "required": ["value", "type"]
      },
      "category": "threat_intel",
      "requires_permission": false
    },
    {
      "name": "log_search",
      "display_name": "日志搜索",
      "description": "搜索安全日志和事件数据",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "搜索查询语句（支持 Lucene 语法）"
          },
          "time_range": {
            "type": "string",
            "description": "时间范围，如 1h, 24h, 7d"
          },
          "limit": {
            "type": "integer",
            "description": "返回结果数量上限"
          }
        },
        "required": ["query"]
      },
      "category": "search",
      "requires_permission": true
    },
    {
      "name": "alert_query",
      "display_name": "告警查询",
      "description": "查询和检索安全告警",
      "parameters": {
        "type": "object",
        "properties": {
          "filters": {
            "type": "object",
            "description": "告警筛选条件"
          },
          "limit": {
            "type": "integer",
            "description": "返回结果数量上限"
          }
        },
        "required": ["filters"]
      },
      "category": "alert",
      "requires_permission": false
    },
    {
      "name": "whois_lookup",
      "display_name": "WHOIS 查询",
      "description": "查询域名的 WHOIS 注册信息",
      "parameters": {
        "type": "object",
        "properties": {
          "domain": {
            "type": "string",
            "description": "要查询的域名"
          }
        },
        "required": ["domain"]
      },
      "category": "threat_intel",
      "requires_permission": false
    },
    {
      "name": "domain_reputation",
      "display_name": "域名信誉查询",
      "description": "查询域名的安全信誉评分和关联威胁",
      "parameters": {
        "type": "object",
        "properties": {
          "domain": {
            "type": "string",
            "description": "要查询的域名"
          }
        },
        "required": ["domain"]
      },
      "category": "threat_intel",
      "requires_permission": false
    },
    {
      "name": "code_analyze",
      "display_name": "代码分析",
      "description": "分析样本代码或脚本的安全性",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "代码内容"
          },
          "language": {
            "type": "string",
            "description": "编程语言"
          }
        },
        "required": ["code"]
      },
      "category": "analysis",
      "requires_permission": true
    }
  ]
}
```

## 生成调查报告

```bash
POST /api/v1/ai-chat/sessions/{id}/report
```

基于当前会话内容自动生成调查报告。

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 会话 ID |

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 报告标题（默认使用会话标题） |
| `template` | string | 否 | 报告模板：standard, detailed, executive（默认 standard） |
| `include_tool_results` | boolean | 否 | 是否包含工具调用结果（默认 true） |
| `format` | string | 否 | 输出格式：json, markdown（默认 json） |
| `sections` | array | 否 | 自定义报告章节配置 |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-chat/sessions/sess_001/report" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "C2 通信分析调查报告",
    "template": "detailed",
    "include_tool_results": true,
    "sections": ["summary", "ioc_list", "timeline", "recommendations"]
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "rpt_001",
    "session_id": "sess_001",
    "title": "C2 通信分析调查报告",
    "status": "completed",
    "template": "detailed",
    "format": "json",
    "content": {
      "summary": {
        "overview": "本报告基于对 IP 45.33.32.156 的威胁情报分析，确认其为 Cobalt Strike C2 服务器，与内部主机 192.168.1.105 存在恶意通信。",
        "severity": "critical",
        "confidence": 0.95
      },
      "ioc_list": [
        {
          "type": "ip",
          "value": "45.33.32.156",
          "verdict": "malicious",
          "tags": ["cobalt-strike", "c2"]
        },
        {
          "type": "domain",
          "value": "evil.c2-domain.com",
          "verdict": "malicious",
          "tags": ["cobalt-strike", "c2"]
        }
      ],
      "timeline": [
        {
          "timestamp": "2024-01-15T08:00:00Z",
          "event": "首次通信",
          "description": "主机 192.168.1.105 首次连接 C2 服务器"
        },
        {
          "timestamp": "2024-01-15T08:23:45Z",
          "event": "告警触发",
          "description": "EDR 系统检测到异常通信并生成告警"
        },
        {
          "timestamp": "2024-01-15T08:24:10Z",
          "event": "AI 分析完成",
          "description": "AI 自动研判确认 C2 通信行为"
        }
      ],
      "recommendations": [
        {
          "priority": "critical",
          "action": "立即隔离主机 192.168.1.105",
          "details": "切断与 C2 服务器的网络通信，防止数据外泄"
        },
        {
          "priority": "high",
          "action": "全网排查相同通信特征",
          "details": "搜索相同 JA3 指纹和域名请求的其他主机"
        },
        {
          "priority": "medium",
          "action": "收集取证样本",
          "details": "收集主机内存镜像和磁盘快照进行深度分析"
        }
      ]
    },
    "metadata": {
      "message_count": 15,
      "tool_calls": 8,
      "generated_by": "ai",
      "generated_at": "2024-01-15T09:20:00Z"
    },
    "created_at": "2024-01-15T09:20:00Z",
    "updated_at": "2024-01-15T09:20:00Z"
  }
}
```

## 获取报告列表

```bash
GET /api/v1/ai-chat/reports
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 报告状态：draft, completed, archived |
| `search` | string | 否 | 关键词搜索（匹配标题） |
| `session_id` | string | 否 | 按会话 ID 筛选 |
| `created_after` | string | 否 | 创建时间起始（ISO 8601） |
| `created_before` | string | 否 | 创建时间截止（ISO 8601） |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-chat/reports?status=completed&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": "rpt_001",
      "session_id": "sess_001",
      "title": "C2 通信分析调查报告",
      "status": "completed",
      "template": "detailed",
      "summary": "确认 IP 45.33.32.156 为 Cobalt Strike C2 服务器",
      "severity": "critical",
      "created_at": "2024-01-15T09:20:00Z",
      "updated_at": "2024-01-15T09:20:00Z"
    },
    {
      "id": "rpt_002",
      "session_id": "sess_002",
      "title": "钓鱼邮件分析报告",
      "status": "draft",
      "template": "standard",
      "summary": null,
      "severity": "high",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 2,
    "total_pages": 1
  }
}
```

## 创建报告

```bash
POST /api/v1/ai-chat/reports
```

手动创建空白报告或基于模板创建报告。

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 报告标题 |
| `session_id` | string | 否 | 关联的会话 ID |
| `template` | string | 否 | 报告模板：standard, detailed, executive（默认 standard） |
| `severity` | string | 否 | 严重级别：low, medium, high, critical |
| `tags` | array | 否 | 标签列表 |
| `content` | object | 否 | 初始报告内容 |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/ai-chat/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "钓鱼邮件分析报告",
    "session_id": "sess_002",
    "template": "standard",
    "severity": "high",
    "tags": ["phishing", "email", "social-engineering"]
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "rpt_003",
    "session_id": "sess_002",
    "title": "钓鱼邮件分析报告",
    "status": "draft",
    "template": "standard",
    "severity": "high",
    "tags": ["phishing", "email", "social-engineering"],
    "content": {
      "summary": null,
      "details": null,
      "recommendations": null
    },
    "metadata": {
      "message_count": 0,
      "tool_calls": 0,
      "generated_by": "manual",
      "generated_at": null
    },
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

## 获取报告详情

```bash
GET /api/v1/ai-chat/reports/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 报告 ID |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/ai-chat/reports/rpt_001" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": "rpt_001",
    "session_id": "sess_001",
    "title": "C2 通信分析调查报告",
    "status": "completed",
    "template": "detailed",
    "severity": "critical",
    "tags": ["c2", "cobalt-strike", "malware"],
    "content": {
      "summary": {
        "overview": "本报告基于对 IP 45.33.32.156 的威胁情报分析，确认其为 Cobalt Strike C2 服务器，与内部主机 192.168.1.105 存在恶意通信。",
        "severity": "critical",
        "confidence": 0.95
      },
      "ioc_list": [
        {
          "type": "ip",
          "value": "45.33.32.156",
          "verdict": "malicious",
          "tags": ["cobalt-strike", "c2"]
        },
        {
          "type": "domain",
          "value": "evil.c2-domain.com",
          "verdict": "malicious",
          "tags": ["cobalt-strike", "c2"]
        }
      ],
      "timeline": [
        {
          "timestamp": "2024-01-15T08:00:00Z",
          "event": "首次通信",
          "description": "主机 192.168.1.105 首次连接 C2 服务器"
        },
        {
          "timestamp": "2024-01-15T08:23:45Z",
          "event": "告警触发",
          "description": "EDR 系统检测到异常通信并生成告警"
        },
        {
          "timestamp": "2024-01-15T08:24:10Z",
          "event": "AI 分析完成",
          "description": "AI 自动研判确认 C2 通信行为"
        }
      ],
      "recommendations": [
        {
          "priority": "critical",
          "action": "立即隔离主机 192.168.1.105",
          "details": "切断与 C2 服务器的网络通信，防止数据外泄"
        },
        {
          "priority": "high",
          "action": "全网排查相同通信特征",
          "details": "搜索相同 JA3 指纹和域名请求的其他主机"
        },
        {
          "priority": "medium",
          "action": "收集取证样本",
          "details": "收集主机内存镜像和磁盘快照进行深度分析"
        }
      ]
    },
    "metadata": {
      "message_count": 15,
      "tool_calls": 8,
      "generated_by": "ai",
      "generated_at": "2024-01-15T09:20:00Z"
    },
    "created_at": "2024-01-15T09:20:00Z",
    "updated_at": "2024-01-15T09:20:00Z"
  }
}
```

## 更新报告

```bash
PUT /api/v1/ai-chat/reports/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 报告 ID |

### 请求体

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 报告标题 |
| `status` | string | 否 | 报告状态：draft, completed, archived |
| `severity` | string | 否 | 严重级别：low, medium, high, critical |
| `tags` | array | 否 | 标签列表 |
| `content` | object | 否 | 报告内容 |

### 请求示例

```bash
curl -X PUT "https://api.secmind.example.com/api/v1/ai-chat/reports/rpt_003" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "severity": "high",
    "tags": ["phishing", "email", "social-engineering", "spear-phishing"],
    "content": {
      "summary": {
        "overview": "本次钓鱼邮件攻击针对财务部门，冒充 CEO 要求紧急转账。",
        "severity": "high",
        "confidence": 0.88
      },
      "recommendations": [
        {
          "priority": "high",
          "action": "通知全体员工警惕类似钓鱼邮件",
          "details": "发布安全公告，描述此次钓鱼邮件的特征"
        },
        {
          "priority": "high",
          "action": "检查邮件网关规则",
          "details": "更新邮件过滤规则，拦截发件人域名"
        }
      ]
    }
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "rpt_003",
    "session_id": "sess_002",
    "title": "钓鱼邮件分析报告",
    "status": "completed",
    "template": "standard",
    "severity": "high",
    "tags": ["phishing", "email", "social-engineering", "spear-phishing"],
    "content": {
      "summary": {
        "overview": "本次钓鱼邮件攻击针对财务部门，冒充 CEO 要求紧急转账。",
        "severity": "high",
        "confidence": 0.88
      },
      "details": null,
      "recommendations": [
        {
          "priority": "high",
          "action": "通知全体员工警惕类似钓鱼邮件",
          "details": "发布安全公告，描述此次钓鱼邮件的特征"
        },
        {
          "priority": "high",
          "action": "检查邮件网关规则",
          "details": "更新邮件过滤规则，拦截发件人域名"
        }
      ]
    },
    "metadata": {
      "message_count": 0,
      "tool_calls": 0,
      "generated_by": "manual",
      "generated_at": null
    },
    "updated_at": "2024-01-15T11:30:00Z"
  }
}
```

## 删除报告

```bash
DELETE /api/v1/ai-chat/reports/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 报告 ID |

### 请求示例

```bash
curl -X DELETE "https://api.secmind.example.com/api/v1/ai-chat/reports/rpt_003" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

状态码：`204 No Content`，无返回内容。

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 会话或报告不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该资源 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `SESSION_CLOSED` | 400 | 会话已关闭，无法发送消息 |
| `MESSAGE_TOO_LONG` | 400 | 消息内容超出长度限制（10000 字符） |
| `LLM_SERVICE_ERROR` | 503 | AI 模型服务暂时不可用 |
| `TOOL_EXECUTION_ERROR` | 500 | 工具调用执行失败 |
| `REPORT_GENERATION_FAILED` | 500 | 报告生成失败 |
| `SESSION_LIMIT_EXCEEDED` | 429 | 超过最大并发会话数限制 |

## 速率限制

AI 聊天 API 实施独立的速率限制策略：

| 级别 | 限制 | 窗口 |
|------|------|------|
| 会话操作（列表/创建/删除） | 60 次 | 每分钟 |
| 消息发送（非流式） | 30 次 | 每分钟 |
| 消息发送（流式） | 15 次 | 每分钟 |
| 报告生成 | 10 次 | 每分钟 |
| 报告 CRUD | 60 次 | 每分钟 |
| 工具列表查询 | 120 次 | 每分钟 |

超出限制时返回 `429` 状态码，响应头包含：

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705312200
Retry-After: 30
```