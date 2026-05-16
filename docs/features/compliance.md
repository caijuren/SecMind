# 合规管理

SecMind 的合规管理功能帮助组织满足安全合规要求，实现自动化合规检查与证据管理。

## 功能概述

合规管理模块提供以下核心能力：

- **合规框架**：内置多种安全合规框架模板
- **自动化检查**：基于规则的自动合规检查
- **证据收集**：自动收集和关联合规证据
- **差距分析**：识别合规差距并生成改进建议
- **合规报告**：生成标准化的合规审计报告

## 使用方式

### 选择合规框架

SecMind 内置以下合规框架：

| 框架 | 说明 |
|------|------|
| 等保 2.0 | 中国网络安全等级保护 2.0 标准 |
| ISO 27001 | 信息安全管理体系国际标准 |
| GDPR | 欧盟通用数据保护条例 |
| PCI DSS | 支付卡行业数据安全标准 |
| SOC 2 | 服务组织控制报告 |
| NIST CSF | 美国国家网络安全框架 |

<!-- 截图占位符：合规框架选择 -->

```
[截图：合规管理 - 合规框架选择界面]
```

### 合规检查

选择框架后，系统会自动执行合规检查：

```python
# 触发合规检查
POST /api/compliance/assessments
{
  "framework": "mlps_2.0",
  "scope": "full",
  "include_evidence": true
}
```

检查结果示例：

```json
{
  "assessment_id": "assess_001",
  "framework": "mlps_2.0",
  "overall_score": 78,
  "total_controls": 135,
  "compliant": 105,
  "partial": 18,
  "non_compliant": 12,
  "categories": [
    {
      "name": "安全物理环境",
      "score": 92,
      "controls": 15,
      "compliant": 14
    },
    {
      "name": "安全通信网络",
      "score": 85,
      "controls": 20,
      "compliant": 17
    },
    {
      "name": "安全区域边界",
      "score": 70,
      "controls": 25,
      "compliant": 18
    }
  ]
}
```

<!-- 截图占位符：合规检查结果 -->

```
[截图：合规管理 - 合规检查结果仪表盘]
```

### 证据管理

为每个合规控制项关联证据：

```python
# 添加合规证据
POST /api/compliance/evidence
{
  "control_id": "MLPS-2.0-NET-01",
  "evidence_type": "configuration",
  "source": "firewall_config_export",
  "data": {
    "firewall_rules": "...",
    "last_updated": "2024-01-10T08:00:00Z"
  },
  "collection_method": "automated",
  "valid_until": "2024-04-10T00:00:00Z"
}
```

### 差距分析

```python
# 执行差距分析
POST /api/compliance/gap-analysis
{
  "framework": "mlps_2.0",
  "current_assessment_id": "assess_001"
}
```

差距分析结果会生成改进建议：

```json
{
  "gaps": [
    {
      "control_id": "MLPS-2.0-NET-05",
      "control_name": "网络入侵防范",
      "current_status": "partial",
      "gap_description": "缺少网络入侵检测系统的集中管理",
      "recommendation": "部署网络 IDS/IPS 并接入 SecMind 平台",
      "priority": "high",
      "estimated_effort": "2 周"
    }
  ]
}
```

## 配置选项

### 检查策略配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `auto_assessment` | 是否自动执行合规检查 | `true` |
| `assessment_interval_days` | 自动检查间隔（天） | `30` |
| `evidence_retention_days` | 证据保留天数 | `365` |
| `notification_on_gap` | 发现差距时是否通知 | `true` |
| `notification_channels` | 通知渠道 | `email` |

### 自定义合规框架

```python
# 创建自定义合规框架
POST /api/compliance/frameworks
{
  "name": "企业安全基线",
  "version": "1.0",
  "categories": [
    {
      "name": "访问控制",
      "controls": [
        {
          "id": "AC-001",
          "name": "多因素认证",
          "description": "所有远程访问必须启用多因素认证",
          "check_type": "automated",
          "check_query": "SELECT * FROM users WHERE mfa_enabled = false AND remote_access = true"
        }
      ]
    }
  ]
}
```

## 最佳实践

1. **定期评估**：建议每月执行一次合规评估，及时发现问题
2. **自动化证据收集**：尽量使用自动化方式收集证据，减少人工操作
3. **持续监控**：启用自动合规检查，实现持续合规监控
4. **差距闭环**：对发现的合规差距制定整改计划并跟踪闭环
