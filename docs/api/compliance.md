# 合规管理 API

合规管理 API 提供合规框架管理、控制项维护、合规评估和报告生成接口，帮助组织持续监控和提升安全合规水平。

## 概述

SecMind 合规管理系统支持多框架、多标准的合规评估，覆盖主流的安全合规与审计标准。系统通过自动化的控制项映射、证据采集和评估打分，简化合规管理工作流程。

### 核心能力

- **框架管理**：定义和管理合规框架及其控制要求
- **控制项映射**：将安全控制项映射到具体的检测与响应能力
- **自动化评估**：基于实际安全态势自动评估控制项符合程度
- **合规报告**：生成符合审计要求的合规报告

## 支持的合规框架

| 框架 | 标识符 | 版本 | 控制项数量 | 说明 |
|------|--------|------|-----------|------|
| 等保 2.0 | `djcp_2_0` | GB/T 22239-2019 | 85 | 中国网络安全等级保护基本要求 |
| GDPR | `gdpr` | EU 2016/679 | 42 | 欧盟通用数据保护条例 |
| ISO 27001 | `iso_27001` | ISO/IEC 27001:2022 | 93 | 信息安全管理体系标准 |
| CIS Controls | `cis_v8` | CIS Controls v8 | 69 | 互联网安全中心关键安全控制措施 |

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/compliance/frameworks` | 获取合规框架列表 |
| GET | `/api/v1/compliance/frameworks/{id}` | 获取框架详情 |
| POST | `/api/v1/compliance/frameworks` | 创建框架 |
| GET | `/api/v1/compliance/controls` | 获取控制项列表 |
| GET | `/api/v1/compliance/controls/{id}` | 获取控制项详情 |
| POST | `/api/v1/compliance/assessments` | 创建评估 |
| GET | `/api/v1/compliance/assessments/{id}` | 获取评估详情 |
| GET | `/api/v1/compliance/assessments/{id}/results` | 获取评估结果 |
| GET | `/api/v1/compliance/reports/{framework_id}` | 生成合规报告 |

## 获取合规框架列表

```bash
GET /api/v1/compliance/frameworks
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 状态：active, deprecated, draft |
| `category` | string | 否 | 分类：regulation, standard, framework |
| `search` | string | 否 | 关键词搜索 |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/frameworks?status=active&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": "djcp_2_0",
      "name": "等保 2.0",
      "version": "GB/T 22239-2019",
      "category": "regulation",
      "description": "中国网络安全等级保护基本要求",
      "status": "active",
      "total_controls": 85,
      "compliant_controls": 62,
      "non_compliant_controls": 15,
      "not_assessed_controls": 8,
      "overall_score": 72.9,
      "last_assessment_at": "2024-01-10T08:00:00Z",
      "created_at": "2023-06-01T00:00:00Z",
      "updated_at": "2024-01-10T08:00:00Z"
    },
    {
      "id": "iso_27001",
      "name": "ISO 27001",
      "version": "ISO/IEC 27001:2022",
      "category": "standard",
      "description": "信息安全管理体系标准",
      "status": "active",
      "total_controls": 93,
      "compliant_controls": 78,
      "non_compliant_controls": 10,
      "not_assessed_controls": 5,
      "overall_score": 83.9,
      "last_assessment_at": "2024-01-12T14:00:00Z",
      "created_at": "2023-06-01T00:00:00Z",
      "updated_at": "2024-01-12T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 4,
    "total_pages": 1
  }
}
```

## 获取框架详情

```bash
GET /api/v1/compliance/frameworks/{id}
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 框架标识符，如 `djcp_2_0` |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/frameworks/djcp_2_0" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": "djcp_2_0",
    "name": "等保 2.0",
    "version": "GB/T 22239-2019",
    "category": "regulation",
    "description": "中国网络安全等级保护基本要求",
    "status": "active",
    "total_controls": 85,
    "compliant_controls": 62,
    "non_compliant_controls": 15,
    "not_assessed_controls": 8,
    "overall_score": 72.9,
    "domains": [
      {
        "id": "djcp_physical",
        "name": "物理安全",
        "control_count": 12,
        "compliant_count": 10,
        "score": 83.3
      },
      {
        "id": "djcp_network",
        "name": "网络安全",
        "control_count": 18,
        "compliant_count": 14,
        "score": 77.8
      },
      {
        "id": "djcp_host",
        "name": "主机安全",
        "control_count": 15,
        "compliant_count": 11,
        "score": 73.3
      },
      {
        "id": "djcp_app",
        "name": "应用安全",
        "control_count": 14,
        "compliant_count": 10,
        "score": 71.4
      },
      {
        "id": "djcp_data",
        "name": "数据安全",
        "control_count": 10,
        "compliant_count": 6,
        "score": 60.0
      },
      {
        "id": "djcp_mgmt",
        "name": "管理安全",
        "control_count": 16,
        "compliant_count": 11,
        "score": 68.8
      }
    ],
    "last_assessment_at": "2024-01-10T08:00:00Z",
    "created_at": "2023-06-01T00:00:00Z",
    "updated_at": "2024-01-10T08:00:00Z"
  }
}
```

## 创建框架

```bash
POST /api/v1/compliance/frameworks
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 框架名称 |
| `version` | string | 是 | 框架版本号 |
| `category` | string | 是 | 分类：regulation, standard, framework |
| `description` | string | 否 | 框架描述 |
| `domains` | array | 否 | 框架领域/章节定义 |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/compliance/frameworks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "自定义安全框架",
    "version": "1.0",
    "category": "framework",
    "description": "企业自定义安全合规框架",
    "domains": [
      {
        "name": "访问控制",
        "description": "身份认证与访问权限管理"
      },
      {
        "name": "数据保护",
        "description": "静态与传输中的数据加密保护"
      }
    ]
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "custom_fw_001",
    "name": "自定义安全框架",
    "version": "1.0",
    "category": "framework",
    "description": "企业自定义安全合规框架",
    "status": "draft",
    "total_controls": 0,
    "domains": [
      {
        "id": "domain_access_control",
        "name": "访问控制",
        "description": "身份认证与访问权限管理"
      },
      {
        "id": "domain_data_protection",
        "name": "数据保护",
        "description": "静态与传输中的数据加密保护"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

## 获取控制项列表

```bash
GET /api/v1/compliance/controls
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `framework_id` | string | 否 | 按框架筛选 |
| `domain_id` | string | 否 | 按领域筛选 |
| `status` | string | 否 | 符合状态：compliant, non_compliant, not_assessed, partially_compliant |
| `severity` | string | 否 | 严重级别：high, medium, low |
| `search` | string | 否 | 关键词搜索 |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/controls?framework_id=djcp_2_0&status=non_compliant&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": [
    {
      "id": "ctrl_djcp_032",
      "framework_id": "djcp_2_0",
      "domain_id": "djcp_data",
      "control_id": "8.1.3",
      "title": "数据加密传输",
      "description": "应采用加密技术对传输过程中的数据进行保护",
      "severity": "high",
      "status": "non_compliant",
      "score": 35.0,
      "evidence_count": 2,
      "last_assessed_at": "2024-01-10T08:00:00Z",
      "mapped_capabilities": [
        {
          "capability_id": "cap_tls_mgmt",
          "name": "TLS 证书管理",
          "coverage": 60.0
        },
        {
          "capability_id": "cap_vpn",
          "name": "VPN 网关",
          "coverage": 30.0
        }
      ]
    },
    {
      "id": "ctrl_djcp_033",
      "framework_id": "djcp_2_0",
      "domain_id": "djcp_data",
      "control_id": "8.1.4",
      "title": "数据备份恢复",
      "description": "应建立数据备份与恢复机制",
      "severity": "high",
      "status": "compliant",
      "score": 92.0,
      "evidence_count": 5,
      "last_assessed_at": "2024-01-10T08:00:00Z",
      "mapped_capabilities": [
        {
          "capability_id": "cap_backup",
          "name": "自动备份系统",
          "coverage": 95.0
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

## 获取控制项详情

```bash
GET /api/v1/compliance/controls/{id}
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 控制项 ID |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/controls/ctrl_djcp_032" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": "ctrl_djcp_032",
    "framework_id": "djcp_2_0",
    "domain_id": "djcp_data",
    "domain_name": "数据安全",
    "control_id": "8.1.3",
    "title": "数据加密传输",
    "description": "应采用加密技术对传输过程中的数据进行保护",
    "severity": "high",
    "status": "non_compliant",
    "score": 35.0,
    "requirements": [
      "传输通道应采用 TLS 1.2 及以上协议",
      "证书应由受信任的 CA 签发",
      "密钥长度不低于 2048 位"
    ],
    "evidence": [
      {
        "id": "evi_010",
        "type": "scan_result",
        "source": "TLS Scanner",
        "summary": "发现 3 台服务器使用 TLS 1.0 协议",
        "collected_at": "2024-01-10T07:30:00Z"
      },
      {
        "id": "evi_011",
        "type": "config_check",
        "source": "Config Audit",
        "summary": "2 个服务未配置证书自动轮换",
        "collected_at": "2024-01-10T07:30:00Z"
      }
    ],
    "mapped_capabilities": [
      {
        "capability_id": "cap_tls_mgmt",
        "name": "TLS 证书管理",
        "coverage": 60.0,
        "gap_analysis": "缺少证书到期自动告警和自动续签能力"
      },
      {
        "capability_id": "cap_vpn",
        "name": "VPN 网关",
        "coverage": 30.0,
        "gap_analysis": "远程访问未全部强制使用 VPN"
      }
    ],
    "recommendations": [
      "将所有 TLS 服务升级至 TLS 1.2 及以上版本",
      "部署证书生命周期管理平台",
      "强制远程访问通过 VPN 进行"
    ],
    "last_assessed_at": "2024-01-10T08:00:00Z",
    "created_at": "2023-06-01T00:00:00Z",
    "updated_at": "2024-01-10T08:00:00Z"
  }
}
```

## 创建评估

```bash
POST /api/v1/compliance/assessments
```

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `framework_id` | string | 是 | 待评估的框架标识符 |
| `name` | string | 是 | 评估名称 |
| `description` | string | 否 | 评估描述 |
| `scope` | object | 否 | 评估范围限定 |
| `schedule_type` | string | 否 | 调度方式：manual, scheduled |

### 请求示例

```bash
curl -X POST "https://api.secmind.example.com/api/v1/compliance/assessments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "framework_id": "djcp_2_0",
    "name": "2024 年第一季度等保合规评估",
    "description": "针对等保 2.0 二级要求的全面合规评估",
    "scope": {
      "domain_ids": ["djcp_network", "djcp_host", "djcp_app", "djcp_data"],
      "severity": ["high", "medium"]
    },
    "schedule_type": "manual"
  }'
```

### 响应示例

```json
{
  "data": {
    "id": "assess_001",
    "framework_id": "djcp_2_0",
    "name": "2024 年第一季度等保合规评估",
    "description": "针对等保 2.0 二级要求的全面合规评估",
    "status": "in_progress",
    "progress": {
      "total_controls": 57,
      "assessed_controls": 0,
      "percentage": 0.0
    },
    "created_by": {
      "id": "usr_001",
      "name": "李安全"
    },
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
}
```

## 获取评估详情

```bash
GET /api/v1/compliance/assessments/{id}
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 评估 ID |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/assessments/assess_001" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "id": "assess_001",
    "framework_id": "djcp_2_0",
    "framework_name": "等保 2.0",
    "name": "2024 年第一季度等保合规评估",
    "description": "针对等保 2.0 二级要求的全面合规评估",
    "status": "completed",
    "progress": {
      "total_controls": 57,
      "assessed_controls": 57,
      "percentage": 100.0
    },
    "summary": {
      "overall_score": 72.9,
      "compliant": 40,
      "partially_compliant": 10,
      "non_compliant": 7,
      "not_assessed": 0
    },
    "domain_scores": [
      {
        "domain_id": "djcp_network",
        "domain_name": "网络安全",
        "score": 77.8,
        "control_count": 18,
        "compliant_count": 14
      },
      {
        "domain_id": "djcp_host",
        "domain_name": "主机安全",
        "score": 73.3,
        "control_count": 15,
        "compliant_count": 11
      },
      {
        "domain_id": "djcp_app",
        "domain_name": "应用安全",
        "score": 71.4,
        "control_count": 14,
        "compliant_count": 10
      },
      {
        "domain_id": "djcp_data",
        "domain_name": "数据安全",
        "score": 60.0,
        "control_count": 10,
        "compliant_count": 5
      }
    ],
    "scope": {
      "domain_ids": ["djcp_network", "djcp_host", "djcp_app", "djcp_data"],
      "severity": ["high", "medium"]
    },
    "created_by": {
      "id": "usr_001",
      "name": "李安全"
    },
    "started_at": "2024-01-15T09:00:00Z",
    "completed_at": "2024-01-15T09:15:30Z",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:15:30Z"
  }
}
```

## 获取评估结果

```bash
GET /api/v1/compliance/assessments/{id}/results
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 评估 ID |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 按符合状态筛选：compliant, non_compliant, partially_compliant |
| `severity` | string | 否 | 按严重级别筛选：high, medium, low |
| `domain_id` | string | 否 | 按领域筛选 |
| `page` | integer | 否 | 页码（默认 1） |
| `page_size` | integer | 否 | 每页数量（默认 20，最大 100） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/assessments/assess_001/results?status=non_compliant&severity=high&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "assessment_id": "assess_001",
    "framework_id": "djcp_2_0",
    "results": [
      {
        "control_id": "ctrl_djcp_032",
        "domain_id": "djcp_data",
        "domain_name": "数据安全",
        "control_ref": "8.1.3",
        "title": "数据加密传输",
        "severity": "high",
        "status": "non_compliant",
        "score": 35.0,
        "findings": [
          {
            "type": "vulnerability",
            "description": "3 台服务器仍使用 TLS 1.0 协议",
            "source": "TLS Scanner",
            "severity": "high"
          },
          {
            "type": "misconfiguration",
            "description": "2 个 Web 服务未启用 HSTS",
            "source": "Config Audit",
            "severity": "medium"
          }
        ],
        "recommendations": [
          "禁用 TLS 1.0/1.1，强制使用 TLS 1.2 及以上",
          "为所有 Web 服务启用 HSTS"
        ]
      },
      {
        "control_id": "ctrl_djcp_035",
        "domain_id": "djcp_data",
        "domain_name": "数据安全",
        "control_ref": "8.2.1",
        "title": "数据脱敏处理",
        "severity": "high",
        "status": "non_compliant",
        "score": 20.0,
        "findings": [
          {
            "type": "policy_gap",
            "description": "未建立正式的数据脱敏策略",
            "source": "Policy Review",
            "severity": "high"
          },
          {
            "type": "capability_gap",
            "description": "生产环境数据在非生产环境未脱敏",
            "source": "Data Discovery",
            "severity": "high"
          }
        ],
        "recommendations": [
          "制定并发布数据脱敏管理制度",
          "部署动态数据脱敏工具",
          "对非生产环境数据进行定期脱敏处理"
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 7,
      "total_pages": 1
    }
  }
}
```

## 生成合规报告

```bash
GET /api/v1/compliance/reports/{framework_id}
```

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `framework_id` | string | 是 | 框架标识符 |

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `assessment_id` | string | 否 | 指定评估报告的版本，默认使用最新评估 |
| `format` | string | 否 | 输出格式：json, pdf（默认 json） |
| `include_evidence` | boolean | 否 | 是否包含证据详情（默认 false） |
| `include_recommendations` | boolean | 否 | 是否包含改进建议（默认 true） |

### 请求示例

```bash
curl -X GET "https://api.secmind.example.com/api/v1/compliance/reports/djcp_2_0?format=json&include_evidence=true&include_recommendations=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "report_id": "rpt_001",
    "framework": {
      "id": "djcp_2_0",
      "name": "等保 2.0",
      "version": "GB/T 22239-2019",
      "category": "regulation"
    },
    "assessment": {
      "id": "assess_001",
      "name": "2024 年第一季度等保合规评估",
      "completed_at": "2024-01-15T09:15:30Z"
    },
    "executive_summary": {
      "overall_score": 72.9,
      "total_controls": 57,
      "compliant_percentage": 70.2,
      "risk_level": "medium",
      "summary": "本次评估覆盖等保 2.0 四个安全领域的 57 个控制项，整体合规率为 70.2%。数据安全领域得分最低（60.0%），主要缺口集中在数据加密传输和数据脱敏方面。建议优先修复高严重性不合规项。"
    },
    "domain_summaries": [
      {
        "domain_id": "djcp_network",
        "domain_name": "网络安全",
        "score": 77.8,
        "control_count": 18,
        "compliant_count": 14,
        "non_compliant_count": 2,
        "partially_compliant_count": 2
      },
      {
        "domain_id": "djcp_host",
        "domain_name": "主机安全",
        "score": 73.3,
        "control_count": 15,
        "compliant_count": 11,
        "non_compliant_count": 2,
        "partially_compliant_count": 2
      },
      {
        "domain_id": "djcp_app",
        "domain_name": "应用安全",
        "score": 71.4,
        "control_count": 14,
        "compliant_count": 10,
        "non_compliant_count": 2,
        "partially_compliant_count": 2
      },
      {
        "domain_id": "djcp_data",
        "domain_name": "数据安全",
        "score": 60.0,
        "control_count": 10,
        "compliant_count": 5,
        "non_compliant_count": 3,
        "partially_compliant_count": 2
      }
    ],
    "non_compliant_highlights": [
      {
        "control_id": "ctrl_djcp_032",
        "title": "数据加密传输",
        "severity": "high",
        "score": 35.0,
        "findings_summary": "3 台服务器使用 TLS 1.0，2 个服务未配置 HSTS"
      },
      {
        "control_id": "ctrl_djcp_035",
        "title": "数据脱敏处理",
        "severity": "high",
        "score": 20.0,
        "findings_summary": "缺少正式数据脱敏策略，非生产环境数据未脱敏"
      }
    ],
    "recommendations": [
      {
        "priority": "critical",
        "control_id": "ctrl_djcp_032",
        "title": "修复数据加密传输",
        "action": "升级 TLS 协议版本并配置 HSTS",
        "expected_impact": "提升数据安全领域评分约 15 个百分点"
      },
      {
        "priority": "critical",
        "control_id": "ctrl_djcp_035",
        "title": "建立数据脱敏机制",
        "action": "制定脱敏策略并部署脱敏工具",
        "expected_impact": "提升数据安全领域评分约 20 个百分点"
      },
      {
        "priority": "high",
        "control_id": "ctrl_djcp_028",
        "title": "完善日志审计",
        "action": "启用所有关键系统的审计日志并集中存储",
        "expected_impact": "提升应用安全领域评分约 10 个百分点"
      }
    ],
    "generated_at": "2024-01-15T09:20:00Z"
  }
}
```

## 合规评分方法论

### 控制项评分

每个控制项的评分基于以下维度的加权计算：

| 维度 | 权重 | 说明 |
|------|------|------|
| 能力覆盖度 | 50% | 已部署的安全能力对控制要求的覆盖比例 |
| 证据充分性 | 25% | 可提供的合规证据的完整性和时效性 |
| 有效性验证 | 25% | 通过测试或审计验证控制措施的实际有效性 |

### 符合状态判定

| 状态 | 分值范围 | 判定条件 |
|------|---------|---------|
| compliant | 80-100 | 控制要求全部满足，证据充分且有效 |
| partially_compliant | 50-79 | 控制要求部分满足，存在轻微差距 |
| non_compliant | 0-49 | 控制要求未满足，存在重大差距 |
| not_assessed | - | 尚未进行评估 |

### 领域/整体评分

领域评分和整体合规评分为该范围内所有控制项得分的加权平均值：

```text
领域评分 = Σ(控制项得分 × 控制项权重) / Σ(控制项权重) × 100
整体评分 = Σ(领域评分 × 领域控制项数量) / 总控制项数量
```

### 风险等级

| 整体评分 | 风险等级 | 说明 |
|---------|---------|------|
| 90-100 | low | 合规状况良好，需持续维护 |
| 70-89 | medium | 存在部分合规差距，需制定改进计划 |
| 50-69 | high | 存在较多合规差距，需优先整改 |
| 0-49 | critical | 存在严重合规问题，需立即采取行动 |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 框架、控制项或评估不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作该资源 |
| `FRAMEWORK_IN_USE` | 409 | 框架下存在关联评估，无法删除 |
| `ASSESSMENT_IN_PROGRESS` | 409 | 该框架下已有进行中的评估 |
| `REPORT_GENERATION_FAILED` | 500 | 报告生成失败 |
| `EVIDENCE_COLLECTION_FAILED` | 503 | 证据收集服务暂不可用 |
| `FRAMEWORK_NOT_SUPPORTED` | 400 | 不支持的合规框架标识符 |
| `DUPLICATE_CONTROL_ID` | 409 | 控制项标识符重复 |