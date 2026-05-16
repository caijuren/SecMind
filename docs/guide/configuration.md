# 配置说明

本文档详细介绍 SecMind 平台的各项配置，包括 LLM、情报源、安全设备和 RBAC 配置。

## LLM 配置

SecMind 的 AI 分析能力依赖于大语言模型（LLM），支持多种 LLM 提供商。

### OpenAI 配置

```bash
# .env 配置
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，自定义端点
```

### Azure OpenAI 配置

```bash
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-01
```

### 本地模型配置

SecMind 支持通过 OpenAI 兼容 API 接入本地部署的模型：

```bash
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:11434/v1  # Ollama 示例
LOCAL_LLM_MODEL=secmind-qwen2
LOCAL_LLM_API_KEY=optional-key
```

### 模型路由策略

SecMind 支持根据任务类型自动选择最优模型：

```python
# 通过系统设置界面配置，或通过 API 设置
{
  "routing_strategy": "task_based",
  "routes": [
    {
      "task_type": "alert_triage",
      "model": "gpt-4",
      "temperature": 0.1,
      "max_tokens": 2048
    },
    {
      "task_type": "threat_analysis",
      "model": "gpt-4",
      "temperature": 0.3,
      "max_tokens": 4096
    },
    {
      "task_type": "report_generation",
      "model": "gpt-4",
      "temperature": 0.5,
      "max_tokens": 8192
    }
  ]
}
```

## 情报源配置

SecMind 支持集成多种威胁情报源，用于丰富告警上下文和辅助威胁分析。

### 配置方式

进入「系统设置 → 情报源管理」，添加情报源：

#### VirusTotal

```json
{
  "name": "VirusTotal",
  "type": "virustotal",
  "api_key": "your-virustotal-api-key",
  "enabled": true,
  "config": {
    "rate_limit": 4,
    "cache_ttl": 3600
  }
}
```

#### AlienVault OTX

```json
{
  "name": "AlienVault OTX",
  "type": "otx",
  "api_key": "your-otx-api-key",
  "enabled": true,
  "config": {
    "base_url": "https://otx.alienvault.com/api/v1",
    "cache_ttl": 1800
  }
}
```

#### MISP

```json
{
  "name": "MISP",
  "type": "misp",
  "api_key": "your-misp-api-key",
  "enabled": true,
  "config": {
    "base_url": "https://misp.example.com",
    "verify_ssl": true,
    "sync_interval": 300
  }
}
```

#### 自定义情报源

```json
{
  "name": "Custom Threat Feed",
  "type": "custom",
  "api_key": "your-api-key",
  "enabled": true,
  "config": {
    "base_url": "https://feeds.example.com/api",
    "feed_format": "stix2",
    "pull_interval": 600,
    "headers": {
      "X-Custom-Header": "value"
    }
  }
}
```

## 安全设备配置

SecMind 支持与主流安全设备和 SIEM 平台集成，实现告警自动接入和响应联动。

### SIEM 集成

#### Splunk

```json
{
  "name": "Splunk",
  "type": "splunk",
  "config": {
    "host": "splunk.example.com",
    "port": 8089,
    "username": "secmind",
    "password": "encrypted-password",
    "scheme": "https",
    "verify_ssl": true,
    "index": "secmind_alerts"
  }
}
```

#### Elastic SIEM

```json
{
  "name": "Elastic SIEM",
  "type": "elasticsearch",
  "config": {
    "hosts": ["https://elastic.example.com:9200"],
    "api_key": "your-elastic-api-key",
    "verify_ssl": true,
    "index_pattern": "alerts-*",
    "query_interval": 30
  }
}
```

### EDR 集成

#### CrowdStrike Falcon

```json
{
  "name": "CrowdStrike",
  "type": "crowdstrike",
  "config": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "base_url": "https://api.crowdstrike.com",
    "cloud": "us-1"
  }
}
```

#### 微软 Defender

```json
{
  "name": "Microsoft Defender",
  "type": "defender",
  "config": {
    "tenant_id": "your-tenant-id",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "base_url": "https://api.securitycenter.microsoft.com"
  }
}
```

### 防火墙集成

```json
{
  "name": "Palo Alto Firewall",
  "type": "paloalto",
  "config": {
    "host": "firewall.example.com",
    "api_key": "your-api-key",
    "vsys": "vsys1",
    "verify_ssl": true
  }
}
```

## RBAC 配置

SecMind 采用基于角色的访问控制（RBAC）模型，支持细粒度的权限管理。

### 内置角色

| 角色 | 说明 | 权限范围 |
|------|------|---------|
| `super_admin` | 超级管理员 | 全部权限，包括系统管理 |
| `admin` | 管理员 | 除系统管理外的全部权限 |
| `analyst` | 安全分析师 | 告警分析、威胁狩猎、报告查看 |
| `responder` | 响应人员 | 事件响应、剧本执行 |
| `viewer` | 只读用户 | 查看报告和仪表盘 |

### 自定义角色

通过「系统设置 → RBAC 管理」创建自定义角色：

```python
# 通过 API 创建自定义角色
POST /api/rbac/roles
{
  "name": "junior_analyst",
  "display_name": "初级分析师",
  "description": "仅可查看和处理低级别告警",
  "permissions": [
    "alerts:read",
    "alerts:update:low",
    "hunting:read",
    "reports:read"
  ]
}
```

### 权限粒度

SecMind 的权限采用 `资源:操作:范围` 的格式：

```
资源:操作[:范围]

示例：
  alerts:read          - 读取告警
  alerts:update        - 更新告警
  alerts:update:high   - 仅更新高级别告警
  hunting:write        - 创建狩猎任务
  response:execute     - 执行响应动作
  playbooks:manage     - 管理剧本
  reports:export       - 导出报告
  system:admin         - 系统管理
```

### 多租户隔离

SecMind 支持多租户部署，数据在租户间完全隔离：

```bash
# 启用多租户模式
MULTI_TENANT=true

# 租户数据隔离策略
TENANT_ISOLATION=strict  # strict | shared
```

在严格隔离模式下：
- 每个租户拥有独立的数据库 Schema
- 跨租户数据访问被完全禁止
- 系统管理员可切换租户上下文
