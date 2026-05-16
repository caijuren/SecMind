# 报告生成 API

报告生成 API 提供报告模板管理、报告生成和定时推送接口。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reports` | 获取报告列表 |
| POST | `/api/reports/generate` | 生成报告 |
| GET | `/api/reports/{report_id}` | 获取报告详情 |
| GET | `/api/reports/{report_id}/download` | 下载报告文件 |
| DELETE | `/api/reports/{report_id}` | 删除报告 |
| GET | `/api/reports/templates` | 获取模板列表 |
| POST | `/api/reports/templates` | 创建报告模板 |
| GET | `/api/reports/templates/{template_id}` | 获取模板详情 |
| PUT | `/api/reports/templates/{template_id}` | 更新报告模板 |
| DELETE | `/api/reports/templates/{template_id}` | 删除报告模板 |
| GET | `/api/reports/schedules` | 获取定时任务列表 |
| POST | `/api/reports/schedules` | 创建定时推送任务 |
| DELETE | `/api/reports/schedules/{schedule_id}` | 删除定时推送任务 |

## 生成报告

```bash
POST /api/reports/generate
```

### 请求体

```json
{
  "template_id": "weekly_security_report",
  "title": "2024年第3周安全运营周报",
  "time_range": {
    "start": "2024-01-15T00:00:00Z",
    "end": "2024-01-21T23:59:59Z"
  },
  "sections": [
    "executive_summary",
    "alert_statistics",
    "incident_summary",
    "threat_intelligence",
    "compliance_status",
    "recommendations"
  ],
  "format": "pdf",
  "parameters": {
    "include_charts": true,
    "chart_dpi": 150,
    "watermark": "CONFIDENTIAL"
  }
}
```

### 响应示例

```json
{
  "data": {
    "id": "rpt_001",
    "title": "2024年第3周安全运营周报",
    "template_id": "weekly_security_report",
    "status": "generating",
    "format": "pdf",
    "created_at": "2024-01-22T09:00:00Z",
    "estimated_completion": "2024-01-22T09:02:00Z"
  }
}
```

## 获取报告详情

```bash
GET /api/reports/{report_id}
```

### 响应示例

```json
{
  "data": {
    "id": "rpt_001",
    "title": "2024年第3周安全运营周报",
    "template_id": "weekly_security_report",
    "status": "completed",
    "format": "pdf",
    "file_size": 2048576,
    "time_range": {
      "start": "2024-01-15T00:00:00Z",
      "end": "2024-01-21T23:59:59Z"
    },
    "sections": [
      {
        "id": "executive_summary",
        "title": "执行摘要",
        "status": "completed"
      },
      {
        "id": "alert_statistics",
        "title": "告警统计",
        "status": "completed"
      }
    ],
    "generated_by": {
      "id": "usr_005",
      "name": "张安全"
    },
    "created_at": "2024-01-22T09:00:00Z",
    "completed_at": "2024-01-22T09:01:45Z"
  }
}
```

## 下载报告文件

```bash
GET /api/reports/{report_id}/download?format=pdf
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `format` | string | 否 | 下载格式：pdf, docx, html, xlsx（默认使用生成时的格式） |

### 响应

成功时返回文件流，Content-Type 根据格式设置：

| 格式 | Content-Type |
|------|-------------|
| pdf | `application/pdf` |
| docx | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| html | `text/html` |
| xlsx | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

## 创建报告模板

```bash
POST /api/reports/templates
```

### 请求体

```json
{
  "name": "月度安全简报",
  "description": "面向管理层的月度安全运营简报",
  "sections": [
    {
      "id": "summary",
      "title": "安全态势概览",
      "type": "markdown",
      "content": "本月共处理告警 {{alert_count}} 条，其中高危 {{high_count}} 条..."
    },
    {
      "id": "alert_chart",
      "title": "告警趋势",
      "type": "chart",
      "chart_type": "line",
      "data_source": "alerts",
      "group_by": "day",
      "metrics": ["count", "high_count", "critical_count"]
    },
    {
      "id": "top_threats",
      "title": "Top 威胁",
      "type": "table",
      "data_source": "threats",
      "columns": ["threat_type", "count", "severity", "status"],
      "sort_by": "count",
      "limit": 10
    }
  ],
  "default_format": "pdf"
}
```

### 响应示例

```json
{
  "data": {
    "id": "tpl_003",
    "name": "月度安全简报",
    "description": "面向管理层的月度安全运营简报",
    "sections_count": 3,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## 创建定时推送任务

```bash
POST /api/reports/schedules
```

### 请求体

```json
{
  "name": "每周安全周报推送",
  "template_id": "weekly_security_report",
  "schedule": {
    "cron": "0 9 * * 1",
    "timezone": "Asia/Shanghai"
  },
  "time_range_template": "last_7_days",
  "delivery": [
    {
      "type": "email",
      "recipients": ["ciso@company.com", "soc-lead@company.com"],
      "subject": "安全运营周报 - {{date_range}}"
    },
    {
      "type": "webhook",
      "url": "https://hooks.slack.com/services/xxx",
      "method": "POST"
    }
  ],
  "format": "pdf",
  "enabled": true
}
```

### 响应示例

```json
{
  "data": {
    "id": "sch_001",
    "name": "每周安全周报推送",
    "template_id": "weekly_security_report",
    "schedule": {
      "cron": "0 9 * * 1",
      "timezone": "Asia/Shanghai",
      "next_run": "2024-01-22T09:00:00+08:00"
    },
    "enabled": true,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

## 获取报告列表

```bash
GET /api/reports
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 状态：generating, completed, failed |
| `template_id` | string | 否 | 模板 ID |
| `format` | string | 否 | 格式：pdf, docx, html, xlsx |
| `created_after` | string | 否 | 创建时间起始 |
| `page` | integer | 否 | 页码 |
| `page_size` | integer | 否 | 每页数量 |

### 响应示例

```json
{
  "data": [
    {
      "id": "rpt_001",
      "title": "2024年第3周安全运营周报",
      "status": "completed",
      "format": "pdf",
      "file_size": 2048576,
      "created_at": "2024-01-22T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `RESOURCE_NOT_FOUND` | 404 | 报告或模板不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `PERMISSION_DENIED` | 403 | 无权操作 |
| `REPORT_GENERATION_FAILED` | 500 | 报告生成失败 |
| `TEMPLATE_INVALID` | 400 | 模板配置无效 |
| `FORMAT_NOT_SUPPORTED` | 400 | 不支持的导出格式 |
