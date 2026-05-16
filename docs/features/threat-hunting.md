# 威胁狩猎

SecMind 的威胁狩猎功能提供假设驱动的主动威胁发现能力，支持安全团队主动搜索潜伏威胁。

## 功能概述

威胁狩猎模块提供以下核心能力：

- **假设管理**：创建、追踪和验证威胁假设
- **多源数据查询**：跨 SIEM、EDR、日志等多源数据进行关联查询
- **攻击链还原**：基于证据链自动还原攻击路径
- **假设演化**：AI 辅助的假设自动演化和扩展
- **协作狩猎**：支持多人协作的威胁狩猎工作流

## 使用方式

### 创建狩猎假设

1. 进入「威胁狩猎」模块
2. 点击「新建假设」
3. 填写假设信息：

```python
# 通过 API 创建狩猎假设
POST /api/hunting/hypotheses
{
  "title": "疑似 APT29 鱼叉钓鱼活动",
  "description": "基于近期情报，怀疑 APT29 组织通过鱼叉钓鱼邮件针对我司发起攻击",
  "hypothesis_type": "threat_actor",
  "severity": "high",
  "indicators": [
    {
      "type": "email_subject",
      "value": "Q3 财务报告更新",
      "ioc_type": "pattern"
    },
    {
      "type": "sender_domain",
      "value": "finnce-secure.com",
      "ioc_type": "domain"
    }
  ],
  "data_sources": ["email_logs", "edr_events", "proxy_logs"]
}
```

<!-- 截图占位符：创建假设界面 -->

```
[截图：威胁狩猎 - 创建假设界面]
```

### 执行狩猎查询

基于假设，在多源数据中执行搜索：

```bash
# 在 SIEM 中搜索相关邮件事件
curl -X POST /api/hunting/query \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "hypothesis_id": "hyp_001",
    "query": {
      "data_source": "email_logs",
      "time_range": "7d",
      "filters": {
        "subject": "Q3 财务报告更新",
        "sender_domain": "finnce-secure.com"
      }
    }
  }'
```

### 证据收集与关联

发现可疑线索后，收集证据并建立关联：

```python
# 添加证据到假设
POST /api/hunting/hypotheses/hyp_001/evidence
{
  "evidence_type": "email",
  "source": "exchange_logs",
  "data": {
    "message_id": "<20240115.finnce-secure.com>",
    "sender": "cfo@finnce-secure.com",
    "recipients": ["employee@company.com"],
    "attachment": "Q3_Report.xlsx",
    "attachment_hash": "sha256:abc123..."
  },
  "confidence": 0.85,
  "notes": "附件包含恶意宏代码"
}
```

### 假设演化

AI 辅助的假设自动演化，基于已收集的证据扩展搜索范围：

```python
# 触发假设演化
POST /api/hunting/hypotheses/hyp_001/evolve
{
  "evolution_strategy": "expand",
  "direction": "lateral",
  "max_depth": 3
}
```

<!-- 截图占位符：假设演化图 -->

```
[截图：威胁狩猎 - 假设演化关系图]
```

## 配置选项

### 狩猎引擎配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `max_active_hypotheses` | 最大活跃假设数 | `50` |
| `evidence_retention_days` | 证据保留天数 | `90` |
| `auto_evolve` | 是否自动演化假设 | `true` |
| `evolve_interval_minutes` | 自动演化间隔（分钟） | `30` |
| `confidence_threshold` | 确认假设的置信度阈值 | `0.8` |

### 数据源配置

```json
{
  "data_sources": [
    {
      "name": "Splunk",
      "type": "splunk",
      "query_language": "SPL",
      "max_results": 10000,
      "timeout_seconds": 60
    },
    {
      "name": "Elasticsearch",
      "type": "elasticsearch",
      "query_language": "KQL",
      "max_results": 10000,
      "timeout_seconds": 30
    }
  ]
}
```

## 最佳实践

1. **从情报驱动开始**：基于最新威胁情报创建假设，提高狩猎命中率
2. **渐进式扩展**：先从小范围查询开始，逐步扩大搜索范围
3. **记录推理过程**：详细记录每一步推理和判断依据
4. **定期回顾**：定期回顾未确认的假设，评估是否需要调整方向
