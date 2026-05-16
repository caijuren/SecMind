# 系统监控 API

系统监控 API 提供 SecMind 平台运行状态的可观测性接口，支持健康检查、性能统计和系统指标采集，用于日常运维监控和故障排查。

## 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/system-monitor/health` | 系统健康检查 |
| GET | `/api/v1/system-monitor/performance` | 性能统计数据 |
| GET | `/api/v1/system-monitor/metrics` | 系统指标（内存/CPU/连接数） |

## 系统健康检查

```bash
GET /api/v1/system-monitor/health
```

健康检查端点用于检测系统各组件的运行状态，适用于负载均衡器健康探测、容器编排平台存活检查以及运维监控系统的定时拨测。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deep` | boolean | 否 | 是否执行深度检查（默认 false）。深度检查将额外验证数据库连接、缓存服务和 LLM 服务的可用性 |

### 健康检查响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | string | 整体健康状态：`healthy`（正常）、`degraded`（降级）、`unhealthy`（异常） |
| `version` | string | 当前 SecMind 版本号 |
| `uptime` | integer | 系统启动以来的运行时间（秒） |
| `timestamp` | string | 检查时间（ISO 8601） |
| `checks` | array | 各组件健康检查结果列表 |
| `checks[].name` | string | 组件名称 |
| `checks[].status` | string | 组件状态：`up`（正常）、`down`（异常）、`degraded`（降级） |
| `checks[].latency_ms` | integer | 组件响应延迟（毫秒） |
| `checks[].message` | string | 状态描述信息 |
| `checks[].last_error` | string | 最近一次错误信息（仅异常时返回） |

### 请求示例

```bash
# 基础健康检查
curl -X GET "https://api.secmind.example.com/api/v1/system-monitor/health" \
  -H "Authorization: Bearer $TOKEN"

# 深度健康检查
curl -X GET "https://api.secmind.example.com/api/v1/system-monitor/health?deep=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "status": "healthy",
    "version": "3.0.0",
    "uptime": 864000,
    "timestamp": "2026-05-16T08:00:00Z",
    "checks": [
      {
        "name": "api_server",
        "status": "up",
        "latency_ms": 2,
        "message": "API server is running normally"
      },
      {
        "name": "database",
        "status": "up",
        "latency_ms": 5,
        "message": "PostgreSQL connection pool is healthy"
      },
      {
        "name": "redis",
        "status": "up",
        "latency_ms": 1,
        "message": "Redis cache service is responsive"
      },
      {
        "name": "llm_service",
        "status": "up",
        "latency_ms": 120,
        "message": "LLM service is operational"
      },
      {
        "name": "message_queue",
        "status": "up",
        "latency_ms": 3,
        "message": "RabbitMQ connection established"
      }
    ]
  }
}
```

## 性能统计数据

```bash
GET /api/v1/system-monitor/performance
```

性能统计端点提供 API 请求延迟分布、吞吐量和错误率的聚合数据，用于评估系统响应能力和识别性能瓶颈。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time_range` | string | 否 | 时间范围：`5m`（最近 5 分钟）、`15m`（最近 15 分钟）、`1h`（最近 1 小时）、`6h`（最近 6 小时）、`24h`（最近 24 小时）。默认值 `15m` |
| `granularity` | string | 否 | 聚合粒度：`raw`（原始值）、`avg`（平均值）、`p50`（中位数）、`p95`（95 分位）、`p99`（99 分位）。默认值 `avg` |

### 性能指标解读

| 指标 | 说明 |
|------|------|
| `requests.total` | 时间范围内总请求数 |
| `requests.per_second` | 平均每秒请求数（RPS） |
| `latency.avg` | 平均响应延迟 |
| `latency.p95` | 95 分位响应延迟，表示 95% 的请求在该值以内完成 |
| `latency.p99` | 99 分位响应延迟，用于识别尾部延迟问题 |
| `error_rate` | 错误率 = 4xx/5xx 响应数 / 总请求数 |
| `by_endpoint` | 按 API 端点维度的性能分解 |
| `slowest_endpoints` | 延迟最高的前 5 个端点 |

### 请求示例

```bash
# 获取最近 15 分钟的平均性能统计
curl -X GET "https://api.secmind.example.com/api/v1/system-monitor/performance?time_range=15m&granularity=avg" \
  -H "Authorization: Bearer $TOKEN"

# 获取最近 1 小时的 P95 性能统计
curl -X GET "https://api.secmind.example.com/api/v1/system-monitor/performance?time_range=1h&granularity=p95" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "time_range": "15m",
    "granularity": "avg",
    "requests": {
      "total": 2847,
      "per_second": 3.16
    },
    "latency": {
      "avg": 45,
      "p50": 32,
      "p95": 128,
      "p99": 356,
      "max": 1200
    },
    "error_rate": 0.008,
    "status_codes": {
      "2xx": 2750,
      "4xx": 82,
      "5xx": 15
    },
    "by_endpoint": [
      {
        "path": "/api/v1/alerts",
        "method": "GET",
        "requests": 892,
        "latency_avg": 38,
        "error_rate": 0.005
      },
      {
        "path": "/api/v1/alerts/{alert_id}/analyze",
        "method": "POST",
        "requests": 156,
        "latency_avg": 3200,
        "error_rate": 0.032
      },
      {
        "path": "/api/v1/hunting/query",
        "method": "POST",
        "requests": 234,
        "latency_avg": 1850,
        "error_rate": 0.021
      },
      {
        "path": "/api/v1/ioc",
        "method": "GET",
        "requests": 645,
        "latency_avg": 22,
        "error_rate": 0.003
      },
      {
        "path": "/api/v1/response/incidents",
        "method": "GET",
        "requests": 420,
        "latency_avg": 45,
        "error_rate": 0.007
      }
    ],
    "slowest_endpoints": [
      {
        "path": "/api/v1/alerts/{alert_id}/analyze",
        "method": "POST",
        "latency_p95": 5800
      },
      {
        "path": "/api/v1/hunting/query",
        "method": "POST",
        "latency_p95": 4200
      },
      {
        "path": "/api/v1/reports/generate",
        "method": "POST",
        "latency_p95": 3500
      },
      {
        "path": "/api/v1/hunting/hypotheses/{id}/evolve",
        "method": "POST",
        "latency_p95": 2800
      },
      {
        "path": "/api/v1/alerts/stats",
        "method": "GET",
        "latency_p95": 850
      }
    ]
  }
}
```

## 系统指标

```bash
GET /api/v1/system-monitor/metrics
```

系统指标端点返回服务器的资源使用情况，包括内存占用、CPU 利用率和各类连接数，用于容量规划和异常检测。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time_range` | string | 否 | 时间范围：`current`（当前值）、`5m`、`15m`、`1h`、`6h`、`24h`。默认值 `current` |
| `include_history` | boolean | 否 | 是否返回历史趋势数据（默认 false）。仅当 `time_range` 不为 `current` 时生效 |

### 请求示例

```bash
# 获取当前系统指标
curl -X GET "https://api.secmind.example.com/api/v1/system-monitor/metrics" \
  -H "Authorization: Bearer $TOKEN"

# 获取最近 1 小时的历史指标
curl -X GET "https://api.secmind.example.com/api/v1/system-monitor/metrics?time_range=1h&include_history=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 响应示例

```json
{
  "data": {
    "time_range": "current",
    "memory": {
      "total_mb": 32768,
      "used_mb": 20480,
      "free_mb": 12288,
      "usage_percent": 62.5,
      "heap": {
        "jvm_heap_used_mb": 8192,
        "jvm_heap_max_mb": 16384,
        "jvm_heap_percent": 50.0
      },
      "non_heap": {
        "jvm_non_heap_used_mb": 512,
        "jvm_non_heap_max_mb": 1024
      }
    },
    "cpu": {
      "usage_percent": 45.2,
      "system_load": 2.8,
      "available_cores": 16,
      "thread_count": 128
    },
    "connections": {
      "database": {
        "active": 12,
        "idle": 18,
        "max": 50,
        "pending_requests": 0
      },
      "redis": {
        "active": 4,
        "max": 20
      },
      "http": {
        "active_requests": 23,
        "total_connections": 156,
        "connections_per_second": 12.5
      },
      "websocket": {
        "active_sessions": 8,
        "total_sessions": 156
      }
    },
    "history": [
      {
        "timestamp": "2026-05-16T07:00:00Z",
        "memory_usage_percent": 58.2,
        "cpu_usage_percent": 32.1,
        "active_connections": 18
      },
      {
        "timestamp": "2026-05-16T07:15:00Z",
        "memory_usage_percent": 59.8,
        "cpu_usage_percent": 38.5,
        "active_connections": 21
      },
      {
        "timestamp": "2026-05-16T07:30:00Z",
        "memory_usage_percent": 61.0,
        "cpu_usage_percent": 42.7,
        "active_connections": 25
      },
      {
        "timestamp": "2026-05-16T07:45:00Z",
        "memory_usage_percent": 62.5,
        "cpu_usage_percent": 45.2,
        "active_connections": 23
      }
    ]
  }
}
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `SERVICE_UNAVAILABLE` | 503 | 系统健康检查失败，服务暂不可用 |
| `DEEP_CHECK_TIMEOUT` | 504 | 深度健康检查超时，部分组件未响应 |
| `METRICS_COLLECTION_ERROR` | 500 | 系统指标采集失败 |
| `PERFORMANCE_DATA_UNAVAILABLE` | 503 | 性能统计数据暂时不可用 |
| `INVALID_TIME_RANGE` | 400 | 无效的时间范围参数，支持的取值：`5m`、`15m`、`1h`、`6h`、`24h` |
| `INVALID_GRANULARITY` | 400 | 无效的聚合粒度参数，支持的取值：`raw`、`avg`、`p50`、`p95`、`p99` |
| `RATE_LIMIT_EXCEEDED` | 429 | 监控 API 请求频率超限，每分钟最多 60 次 |