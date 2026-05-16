# 性能调优指南

## 概述

本文档面向 SecMind v3.0 的运维人员和开发者，提供系统性的性能调优方法。目标是在保证系统稳定性的前提下，最大化吞吐量并降低响应延迟。

### 性能指标目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| API P50 响应时间 | < 100ms | 半数请求在此时间内完成 |
| API P95 响应时间 | < 300ms | 95% 请求在此时间内完成 |
| API P99 响应时间 | < 500ms | 99% 请求在此时间内完成 |
| 吞吐量 | > 2000 RPS | 单节点每秒请求数 |
| 系统可用性 | > 99.9% | 年度可用性目标 |
| 并发用户数 | > 10000 | 同时在线用户支持 |

### 调优前基线测量

在进行任何调优操作之前，必须建立性能基线，以便后续对比调优效果。

```bash
# 使用 locust 进行压力测试
locust -f tests/load/locustfile.py --headless \
  -u 1000 -r 100 --run-time 5m \
  --host https://staging.secmind.local

# 记录关键指标
# - 平均响应时间
# - P50/P95/P99 延迟
# - 错误率
# - CPU/内存使用率
```

建议将基线结果导出为 JSON 存档：

```bash
locust -f tests/load/locustfile.py --headless \
  -u 1000 -r 100 --run-time 5m \
  --host https://staging.secmind.local \
  --csv=baseline_pre_tuning
```

---

## 数据库优化

数据库是大多数性能瓶颈的根源。本节涵盖连接池、索引和查询三个层面的优化策略。

### 连接池配置

合理的连接池配置可避免频繁创建/销毁连接的开销，同时防止数据库连接耗尽。

推荐配置（[database.py](file:///Users/grubby/Desktop/SecMind/app/core/database.py)）：

```python
# database.py 配置
pool_size=20        # 最小连接数
max_overflow=40     # 最大额外连接数
pool_recycle=3600   # 连接回收时间（秒）
pool_pre_ping=True  # 每次连接前检查健康状态
```

参数说明：

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `pool_size` | 20 | 连接池保持的常驻连接数。根据应用并发度调整，过高会浪费数据库资源 |
| `max_overflow` | 40 | 超过 `pool_size` 后最多可创建的额外连接数。峰值流量时使用，上限受数据库 `max_connections` 限制 |
| `pool_recycle` | 3600 | 连接最大存活时间（秒）。建议小于数据库的 `wait_timeout`，防止连接被数据库端回收 |
| `pool_pre_ping` | True | 每次从池中取出连接时执行 `SELECT 1` 检测，避免使用已断开的连接 |

调整建议：

- **低并发场景**（< 500 RPS）：`pool_size=10, max_overflow=20`
- **高并发场景**（> 2000 RPS）：`pool_size=40, max_overflow=60`
- 确保 `pool_size + max_overflow` < 数据库 `max_connections` × 0.8

### 索引优化

#### 已创建的复合索引列表

| 表名 | 索引字段 | 类型 | 说明 |
|------|----------|------|------|
| `threat_intel` | `(type, severity, created_at)` | 复合索引 | 威胁情报查询 |
| `token_usage` | `(user_id, period)` | 复合索引 | 用户配额统计 |
| `audit_log` | `(user_id, action, timestamp)` | 复合索引 | 审计日志查询 |
| `alerts` | `(status, priority, created_at)` | 复合索引 | 告警列表查询 |
| `rules` | `(enabled, updated_at)` | 复合索引 | 规则同步查询 |

#### 查询计划分析

使用 `EXPLAIN ANALYZE` 排查慢查询：

```sql
EXPLAIN ANALYZE
SELECT * FROM threat_intel
WHERE type = 'ip'
  AND severity = 'high'
ORDER BY created_at DESC
LIMIT 20;
```

关注以下信号：

- **Seq Scan（全表扫描）**：大表上出现全表扫描通常是索引缺失的信号
- **Index Scan 预估行数偏差大**：统计信息过时，执行 `ANALYZE` 更新
- **Sort 操作消耗大**：考虑为 `ORDER BY` 字段建立索引
- **Nested Loop 循环次数过多**：可能缺少连接字段的索引

```bash
# 开启慢查询日志（PostgreSQL）
ALTER SYSTEM SET log_min_duration_statement = 200;  -- 记录超过 200ms 的查询
ALTER SYSTEM SET log_connections = on;
SELECT pg_reload_conf();
```

#### 慢查询排查

```python
# app/core/database.py 中配置慢查询日志
import logging
from sqlalchemy import event
from sqlalchemy.engine import Engine

logging.basicConfig()
logger = logging.getLogger("sqlalchemy.engine")
logger.setLevel(logging.WARN)

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info["query_start_time"].pop()
    if total > 0.2:  # 超过 200ms 记录警告
        logger.warning(f"慢查询 ({total:.2f}s): {statement[:200]}")
```

### 查询优化

#### 使用 cursor 分页替代 offset 分页

`OFFSET` 分页在大偏移量时性能急剧下降，因为数据库需要扫描并丢弃前面的行。推荐使用 **cursor 分页**（基于游标的分页）。

**反模式（OFFSET 分页）：**

```python
# ❌ 不推荐：OFFSET 越大越慢
page = request.query_params.get("page", 1)
page_size = 20
results = await db.execute(
    select(Alert).order_by(Alert.id).offset((page - 1) * page_size).limit(page_size)
)
```

**推荐做法（Cursor 分页）：**

```python
# ✅ 推荐：基于游标的分页
# 使用上一页最后一条记录的 ID 作为起点
last_id = request.query_params.get("cursor")  # 上一页最后一条的 ID
page_size = 20

query = select(Alert).order_by(Alert.id).limit(page_size)
if last_id:
    query = query.where(Alert.id > last_id)

results = await db.execute(query)
```

#### N+1 查询检测

N+1 查询是 ORM 中最常见的性能问题：查询主记录后，逐条查询关联记录。

**问题代码：**

```python
# ❌ N+1 查询：查询 10 条告警会额外产生 10 次用户查询
alerts = await db.execute(select(Alert).limit(10))
for alert in alerts.scalars():
    print(alert.user.name)  # 每次访问关联对象都会触发查询
```

**解决方法——使用 eager loading：**

```python
# ✅ 使用 joined loading 一次性加载关联数据
from sqlalchemy.orm import joinedload

alerts = await db.execute(
    select(Alert)
    .options(joinedload(Alert.user))
    .limit(10)
)
```

**检测工具：**

```python
# 开发环境启用 N+1 检测
from sqlalchemy import event
from sqlalchemy.engine import Engine

query_count = {"count": 0}

@event.listens_for(Engine, "before_cursor_execute")
def count_queries(conn, cursor, statement, parameters, context, executemany):
    query_count["count"] += 1

# 在测试中验证
async def test_no_n_plus_one():
    query_count["count"] = 0
    alerts = await get_alerts_with_users()
    assert query_count["count"] <= 3  # 不应超过预期查询次数
```

#### 批量操作使用 bulk 方法

**反模式（逐条操作）：**

```python
# ❌ 逐条插入：每次操作都产生一次数据库往返
for intel in batch_intel:
    db.add(ThreatIntel(**intel))
await db.commit()  # 仍然逐条发送 INSERT
```

**推荐做法（批量操作）：**

```python
# ✅ 使用 bulk_insert_mappings 批量插入
from sqlalchemy.dialects.postgresql import insert as pg_insert

# 方法一：bulk_insert_mappings
await db.execute(
    db.insert(ThreatIntel),
    batch_intel  # 列表字典
)
await db.commit()

# 方法二：ON CONFLICT 批量更新（upsert）
stmt = pg_insert(ThreatIntel).values(batch_intel)
stmt = stmt.on_conflict_do_update(
    index_elements=["id"],
    set_={
        "type": stmt.excluded.type,
        "severity": stmt.excluded.severity,
        "updated_at": func.now()
    }
)
await db.execute(stmt)
await db.commit()
```

---

## 缓存策略

### 多级缓存

SecMind 采用三级缓存架构，逐级回退，在性能和一致性之间取得平衡。

```
┌─────────────────────────────────────────────────┐
│                 客户端请求                         │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
         ┌───────────────────┐
         │  L1: 内存缓存      │  响应时间：< 1ms
         │  (进程内缓存)      │  容量：有限（受内存限制）
         └────────┬──────────┘
                  │ 未命中
                  ▼
         ┌───────────────────┐
         │  L2: Redis 缓存    │  响应时间：1-5ms
         │  (分布式缓存)      │  容量：受 Redis 内存限制
         └────────┬──────────┘
                  │ 未命中
                  ▼
         ┌───────────────────┐
         │  L3: 数据库        │  响应时间：10-200ms
         │  (持久化存储)      │  容量：无限（受磁盘限制）
         └───────────────────┘
```

**L1 内存缓存配置（[app/core/cache.py](file:///Users/grubby/Desktop/SecMind/app/core/cache.py)）：**

```python
from cachetools import TTLCache

# 本地内存缓存：适用于频繁访问、一致性要求不高的数据
l1_cache = TTLCache(
    maxsize=1024,       # 最大条目数
    ttl=60              # 过期时间（秒）
)
```

**L2 Redis 缓存配置：**

```python
import redis.asyncio as redis

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
    retry_on_timeout=True,
    health_check_interval=30,
)
```

### 缓存配置

| 数据类型 | 缓存位置 | TTL | 说明 |
|----------|----------|-----|------|
| IOC 查询 | L2 (Redis) | 1h | 威胁情报查询结果，变化频率低 |
| Token 用量 | L2 (Redis) | 48h | 用户配额管理，需持久化 |
| 权限数据 | L2 (Redis) | 60s | RBAC 权限缓存，变化时需及时失效 |
| 静态资源 | CDN | 1h | 前端 JS/CSS/图片资源 |
| 配置项 | L1 (内存) | 300s | 系统配置，读取频繁 |
| Session | L2 (Redis) | 24h | 用户会话状态 |

**缓存失效策略：**

```python
# 数据更新时主动清除缓存
async def update_threat_intel(intel_id: int, data: dict):
    # 1. 更新数据库
    await db.execute(
        update(ThreatIntel).where(ThreatIntel.id == intel_id).values(**data)
    )
    await db.commit()

    # 2. 清除相关缓存
    cache_key = f"threat_intel:{intel_id}"
    await redis_client.delete(cache_key)
    await redis_client.delete("threat_intel:list:*")  # 通配符清除列表缓存

    # 3. 发送缓存失效事件（多实例场景）
    await redis_client.publish("cache:invalidate", cache_key)
```

---

## API 优化

### 响应时间目标

| 分位 | 目标 | 监控颜色 |
|------|------|----------|
| P50 | < 100ms | 🟢 正常 |
| P95 | < 300ms | 🟡 警告 |
| P99 | < 500ms | 🔴 告警 |
| Max | < 1000ms | 🚨 严重 |

### 慢请求排查

#### X-Response-Time 头

所有 API 响应默认包含 `X-Response-Time` 头，用于客户端侧排查：

```python
# app/middleware/performance.py
import time
from starlette.middleware.base import BaseHTTPMiddleware

class ResponseTimeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start_time
        response.headers["X-Response-Time"] = f"{elapsed*1000:.0f}ms"
        return response
```

```bash
# 使用 curl 查看响应时间
curl -sI -w "\n%{http_code} %{time_total}s\n" -o /dev/null \
  https://api.secmind.local/v1/threat-intel?type=ip
```

#### 性能监控端点

启用内置的性能监控端点（仅管理员可访问）：

| 端点 | 说明 |
|------|------|
| `GET /admin/metrics` | Prometheus 格式的性能指标 |
| `GET /admin/slow-queries` | 近期慢查询列表 |
| `GET /admin/cache-stats` | 缓存命中率统计 |
| `GET /admin/health` | 各组件健康状态 |

```bash
# 获取 Prometheus 指标
curl -s https://api.secmind.local/admin/metrics | grep -E "http_request_duration_seconds"

# 输出示例
# http_request_duration_seconds_bucket{method="GET",path="/v1/threat-intel",le="0.1"} 1250
# http_request_duration_seconds_bucket{method="GET",path="/v1/threat-intel",le="0.3"} 1420
# http_request_duration_seconds_bucket{method="GET",path="/v1/threat-intel",le="0.5"} 1440
# http_request_duration_seconds_count{method="GET",path="/v1/threat-intel"} 1450
```

#### 慢查询日志

应用层慢查询日志配置：

```python
# app/core/logging_config.py
LOGGING_CONFIG = {
    "version": 1,
    "handlers": {
        "slow_query_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/slow_queries.log",
            "maxBytes": 100 * 1024 * 1024,  # 100MB
            "backupCount": 5,
            "formatter": "json",
        }
    },
    "loggers": {
        "slow_query": {
            "handlers": ["slow_query_file"],
            "level": "WARNING",
        }
    },
}
```

---

## 前端优化

### 构建优化

#### 代码分割

使用 Next.js 的动态导入实现路由级别和组件级别的代码分割：

```typescript
// ✅ 路由级代码分割（Next.js App Router 默认支持）
// app/threat-intel/page.tsx - 自动分割

// ✅ 组件级代码分割
import dynamic from "next/dynamic";

const ThreatMap = dynamic(() => import("@/components/ThreatMap"), {
  loading: () => <div className="skeleton h-[400px]" />,
  ssr: false,  // 地图组件不需要 SSR
});
```

#### 图片懒加载

```tsx
import Image from "next/image";

// ✅ 使用 Next.js Image 组件自动实现懒加载
<Image
  src="/screenshots/dashboard.png"
  alt="Dashboard Preview"
  width={800}
  height={450}
  loading="lazy"       // 浏览器原生懒加载
  priority={false}     // 非首屏图片
  placeholder="blur"   // 模糊占位
/>
```

#### Bundle 分析

```bash
# 分析打包后的 JavaScript 体积
npm run analyze
# 或
ANALYZE=true npm run build

# 重点关注
# - @ant-design/icons: 按需引入而非全量导入
# - moment.js: 替换为 dayjs（已内置在项目中）
# - lodash: 使用 lodash-es 支持 tree-shaking
```

**避免常见的 Bundle 陷阱：**

```typescript
// ❌ 不推荐：全量导入
import { Button, Table, DatePicker } from "antd";

// ✅ 推荐：按需导入（配合 babel-plugin-import 或 unplugin-auto-import）
import Button from "antd/es/button";
import Table from "antd/es/table";
```

### 渲染优化

#### ISR/SSR 策略

| 页面类型 | 策略 | 说明 |
|----------|------|------|
| 仪表盘 | ISR (revalidate=60) | 静态生成 + 60 秒增量更新 |
| 威胁情报详情 | ISR (revalidate=300) | 静态生成 + 5 分钟增量更新 |
| 用户个人页 | SSR | 需要实时用户数据 |
| 配置管理 | SSR | 需要实时权限校验 |
| 帮助文档 | SSG | 完全静态生成 |

```typescript
// app/threat-intel/page.tsx - ISR 示例
export const revalidate = 60;  // 每 60 秒重新生成

async function getThreatIntel() {
  const res = await fetch(`${process.env.API_URL}/v1/threat-intel`, {
    next: { tags: ["threat-intel"] },  // 按需重新验证
  });
  return res.json();
}

export default async function ThreatIntelPage() {
  const data = await getThreatIntel();
  return <ThreatIntelList data={data} />;
}
```

#### 虚拟列表

处理大量数据列表时使用虚拟滚动，仅渲染可见区域：

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function AlertList({ alerts }: { alerts: Alert[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: alerts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,  // 每项高度
    overscan: 5,             // 额外渲染的行数
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {alerts[virtualItem.index].title}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 防抖/节流

```typescript
import { useMemo } from "react";
import debounce from "lodash-es/debounce";

// ✅ 搜索输入防抖：用户停止输入 300ms 后再发起请求
function ThreatSearch() {
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        const results = await searchThreats(query);
        setResults(results);
      }, 300),
    []
  );

  return (
    <Input
      placeholder="搜索威胁情报..."
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
}
```

```typescript
// ✅ 滚动事件节流：每 100ms 最多触发一次
import throttle from "lodash-es/throttle";

useEffect(() => {
  const handleScroll = throttle(() => {
    setScrollY(window.scrollY);
  }, 100);

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

---

## 监控告警

### 性能指标采集

使用 Prometheus 采集以下关键指标：

```yaml
# prometheus.yml - 采集配置
scrape_configs:
  - job_name: "secmind-api"
    metrics_path: "/admin/metrics"
    scrape_interval: 15s
    static_configs:
      - targets: ["localhost:8000"]
```

**关键监控指标：**

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `http_request_duration_seconds` | Histogram | API 响应时间分布 |
| `http_requests_total` | Counter | 总请求数（按状态码/路径） |
| `db_query_duration_seconds` | Histogram | 数据库查询耗时 |
| `db_connection_pool_size` | Gauge | 连接池使用量 |
| `cache_hit_ratio` | Gauge | 缓存命中率 |
| `redis_operation_duration_seconds` | Histogram | Redis 操作耗时 |
| `active_users` | Gauge | 当前活跃用户数 |

### 阈值告警

```yaml
# alertmanager.yml - 告警规则
groups:
  - name: secmind-performance
    rules:
      - alert: HighAPILatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 0.3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API P95 延迟超过 300ms"

      - alert: CriticalAPILatency
        expr: |
          histogram_quantile(0.99,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 0.5
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "API P99 延迟超过 500ms"

      - alert: LowCacheHitRate
        expr: |
          rate(cache_hit_total[5m])
          / (rate(cache_hit_total[5m]) + rate(cache_miss_total[5m]))
          < 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "缓存命中率低于 80%"

      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m])
          / rate(http_requests_total[5m])
          > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "错误率超过 1%"

      - alert: DatabaseConnectionExhaustion
        expr: |
          db_connection_pool_size / db_connection_pool_max > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "数据库连接池使用率超过 80%"
```

### 自动扩缩容建议

基于性能指标配置 HPA（Horizontal Pod Autoscaler）：

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: secmind-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: secmind-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 1000  # 每个 Pod 目标 1000 RPS
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # 缩容等待 5 分钟，防止抖动
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

**手动扩缩容决策参考：**

| 指标 | 阈值 | 建议动作 |
|------|------|----------|
| CPU 使用率 > 70% | 持续 5 分钟 | 增加 2 个副本 |
| CPU 使用率 > 85% | 持续 3 分钟 | 增加 4 个副本 |
| P95 延迟 > 300ms | 持续 5 分钟 | 检查慢查询和缓存命中率 |
| P95 延迟 > 500ms | 持续 3 分钟 | 立即扩容 + 排查瓶颈 |
| 缓存命中率 < 80% | 持续 10 分钟 | 检查 TTL 配置和缓存预热 |
| 连接池使用率 > 80% | 持续 5 分钟 | 扩容或调整 `pool_size` |

---

> **注意**：性能调优是一个持续迭代的过程。每次调整后应重新测量，对比基线数据验证优化效果。建议将调优记录保存在 `docs/performance-tuning-log.md` 中，便于追溯和团队协作。