# SecMind AI安全运营平台 · 信创改造实施方案

> 文档版本：v1.0  
> 编制日期：2026-05-18  
> 密级：内部

---

## 目录

1. [项目背景与改造目标](#一项目背景与改造目标)
2. [当前技术栈全景分析](#二当前技术栈全景分析)
3. [信创改造总体架构](#三信创改造总体架构)
4. [数据库国产化迁移方案（核心难点）](#四数据库国产化迁移方案核心难点)
5. [AI模型国产化适配方案](#五ai模型国产化适配方案)
6. [操作系统与CPU架构适配](#六操作系统与cpu架构适配)
7. [国密改造方案](#七国密改造方案)
8. [中间件与容器化部署调整](#八中间件与容器化部署调整)
9. [前后端代码改造清单](#九前后端代码改造清单)
10. [测试验证方案](#十测试验证方案)
11. [改造路线图与里程碑](#十一改造路线图与里程碑)
12. [风险评估与应对措施](#十二风险评估与应对措施)
13. [附录](#十三附录)

---

## 一、项目背景与改造目标

### 1.1 项目概述

SecMind 是一款AI驱动的智能安全运营平台（AI-Native SOC Platform），将大语言模型（LLM）深度融入安全运营全流程，实现从信号接入、AI调查、案件研判到自动处置的全链路智能化安全运营闭环。当前版本为 **2.3.0**。

### 1.2 信创改造目标

| 目标维度 | 具体目标 | 验收标准 |
|---------|---------|---------|
| **自主可控** | 核心软硬件实现国产化替代 | 所有组件通过信创目录认证 |
| **业务连续** | 改造后全部37个API端点、22+前端页面功能正常 | 功能回归测试通过率100% |
| **性能达标** | 信创环境下核心业务性能不低于原环境的85% | 压测报告，P99响应时间 < 600ms |
| **安全合规** | 满足等保2.0三级要求 | 通过等保测评 |
| **AI能力保持** | 国产AI模型在安全场景推理效果不低于原有方案 | 精确率 ≥ 92%、召回率 ≥ 88% |

### 1.3 改造范围界定

本次信创改造涵盖以下五大领域：

```
┌───────────────────────────────────────────────────── 信创改造范围 ──────────────────────────────────────┐
│                                                         │
│  ① 基础设施层：CPU / OS / 容器平台 / 网络               │
│  ② 数据层：   数据库 / 缓存 / 文件存储                  │
│  ③ 应用层：   后端框架 / 中间件 / 运行时               │
│  ④ AI能力层： LLM模型 / 推理引擎                        │
│  ⑤ 安全合规层： 国密 / 等保 / 审计                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 二、当前技术栈全景分析

### 2.1 技术栈总览

| 层级 | 组件 | 当前方案 | 版本 |
|------|------|---------|------|
| **CPU架构** | 服务器 | x86_64 | - |
| **操作系统** | 服务器OS | Ubuntu / CentOS | 22.04 / 7 |
| **容器编排** | Docker | Docker + Docker Compose | 24+ |
| **数据库** | 关系型 | PostgreSQL | 15 |
| **数据库** | 开发 | SQLite | - |
| **缓存** | 内存库 | Redis | 7.x |
| **后端框架** | Web框架 | FastAPI | 0.115.6 |
| **后端语言** | 运行时 | Python | 3.10+ |
| **前端框架** | Web框架 | Next.js | 16.2.6 |
| **前端语言** | 运行时 | Node.js (TypeScript) | 20+ |
| **ORM** | 数据层 | SQLAlchemy | 2.0.36 |
| **迁移工具** | 数据库迁移 | Alembic | 1.14.0 |
| **AI模型** | 主推理 | OpenAI GPT-4o | - |
| **AI模型** | 备用推理 | Anthropic Claude | - |
| **AI模型** | 国产已适配 | DeepSeek / 通义千问 | - |
| **反向代理** | 网关 | Nginx | - |
| **监控** | 性能 | Prometheus (部分) | - |

### 2.2 数据库依赖分析（关键）

当前代码库中 PostgreSQL 特有功能的分布情况：

| 功能 | 涉及范围 | 文件/模块数 | 改造影响 |
|------|---------|------------|---------|
| **SQLAlchemy ORM模型** | 23个ORM模型 | `app/models/*.py` | 中 |
| **JSONB字段** | 存储配置、元数据、AI推理结果等 | ~15个模型 | 中 |
| **ARRAY字段** | 标签、规则列表、IP列表等 | ~5个模型 | 低 |
| **ENUM类型** | 状态、类型枚举 | ~8个模型 | 低 |
| **PostgreSQL RLS行级安全** | 多租户数据隔离 | `app/middleware/tenant.py` + SQL | 高 |
| **Alembic迁移脚本** | 20个迁移版本 | `alembic/versions/*.py` | 高 |
| **全文检索** | 告警/案件搜索 | `app/services/search.py` | 中 |
| **窗口函数 / CTE** | 分析查询 | `app/services/analytics.py` | 低 |
| **存储过程** | 0（未使用） | - | 无 |

### 2.3 AI模型依赖分析

| AI Provider | 代码位置 | 调用方式 | 状态 |
|------------|---------|---------|------|
| OpenAI | `app/ai/providers/openai_provider.py` | 官方SDK | ❌ 需替换 |
| Anthropic | `app/ai/providers/anthropic_provider.py` | 官方SDK | ❌ 需替换 |
| DeepSeek | `app/ai/providers/deepseek_provider.py` | 兼容层 | ✅ 已适配，可扩展 |
| 通义千问 | `app/ai/providers/tongyi_provider.py` | 兼容层 | ✅ 已适配，可扩展 |
| Ollama本地 | `app/ai/providers/ollama_provider.py` | HTTP | ✅ 可作为过渡方案 |

---

## 三、信创改造总体架构

### 3.1 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                      信创目标架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────┐    ┌───────────┐    ┌───────────────────┐       │
│  │ 浏览器 │───▶│ Nginx/    │───▶│ Frontend          │       │
│  │(国产)  │    │ TongHttp  │    │ Next.js 16 SSR    │       │
│  └───────┘    └───────────┘    └────────┬──────────┘       │
│                                         │                    │
│  ┌───────┐    ┌───────────┐    ┌────────▼──────────┐       │
│  │国密    │    │  API网关   │    │ Backend           │       │
│  │SSL网关 │    │ 限流/审计  │    │ FastAPI + Uvicorn │       │
│  └───────┘    └───────────┘    └────────┬──────────┘       │
│                                         │                    │
│  ┌──────────────────────────────────────▼────────────────┐  │
│  │                  数据层                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ 人大金仓     │  │ Redis        │  │ 对象存储     │ │  │
│  │  │ KingbaseES V8│  │ 7.x (ARM64)  │  │ MinIO/华为OBS│ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               AI能力层                                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │  │
│  │  │ DeepSeek │ │ 通义千问  │ │ GLM-4    │ │ 文心   │  │  │
│  │  │ V3/R1    │ │ Qwen-Max │ │ (新增)   │ │ ERNIE  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              基础设施层（信创硬件）                     │  │
│  │        鲲鹏920 / 飞腾S2500 / 海光C86                  │  │
│  │        麒麟V10 / 统信UOS / openEuler                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 推荐选型组合

| 组合 | CPU | OS | 数据库 | AI模型 | 推荐指数 | 适用场景 |
|-----|-----|----|--------|-------|---------|---------|
| **⭐ 组合A（推荐）** | 鲲鹏920(ARM) | openEuler 22.03 | KingbaseES V8 | DeepSeek + 通义千问 | ⭐⭐⭐⭐⭐ | 政务云/公有云部署 |
| **组合B** | 飞腾S2500(ARM) | 麒麟V10 SP3 | KingbaseES V8 | DeepSeek + GLM-4 | ⭐⭐⭐⭐ | 涉密/党政内网 |
| **组合C** | 海光C86(x86) | 统信UOS 20 | 达梦DM8 | 通义千问 + 文心ERNIE | ⭐⭐⭐⭐ | 金融/国企 |
| **组合D（最低成本）** | 海光C86(x86) | openEuler | PostgreSQL（暂不改） | DeepSeek | ⭐⭐⭐ | 过渡期/开发阶段 |

---

## 四、数据库国产化迁移方案（核心难点）

### 4.1 选型建议

| 评估维度 | KingbaseES V8 | 达梦DM8 | GaussDB |
|---------|:------------:|:-------:|:-------:|
| PostgreSQL兼容度 | ★★★★★（兼容模式） | ★★★★ | ★★★ |
| SQLAlchemy支持 | ★★★★★（psycopg2驱动） | ★★★（dmPython） | ★★★ |
| Alembic兼容 | ★★★★★ | ★★★ | ★★★ |
| RLS行级安全 | ★★★（模拟实现） | ★★★ | ★★★★ |
| JSONB支持 | ★★★★ | ★★★★ | ★★★★★ |
| ARM64支持 | ★★★★★ | ★★★★ | ★★★★★ |
| 信创目录认证 | ✅ | ✅ | ✅ |
| 商务成本 | 中高 | 中 | 高 |
| 售后支持 | 好 | 好 | 非常好（华为） |

**推荐排序**：KingbaseES V8（PG兼容模式）> 达梦DM8 > GaussDB

### 4.2 迁移实施步骤

#### Step 1：数据库连接抽象层改造

```python
# backend/app/config.py 改造示例

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 数据库类型：pg | kingbase | dm8 | gaussdb
    DB_TYPE: str = "kingbase"

    @property
    def database_url(self) -> str:
        urls = {
            "pg": f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}",
            "kingbase": f"kingbase+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:54321/{self.DB_NAME}",
            "dm8": f"dm+dmPython://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:5236/{self.DB_NAME}",
            "gaussdb": f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:8000/{self.DB_NAME}",
        }
        return urls.get(self.DB_TYPE, urls["pg"])

    DB_DRIVER: Optional[str] = None  # 驱动类型覆盖

    @property
    def sqlalchemy_connect_args(self) -> dict:
        if self.DB_TYPE == "kingbase":
            return {"options": "-c search_path=public"}
        return {}
```

#### Step 2：ORM模型改造

需检查并调整以下 PostgreSQL 特有的字段类型：

```python
# 改造前 (PostgreSQL)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID, ENUM

class Alert(Base):
    id = Column(UUID(as_uuid=True), primary_key=True)
    tags = Column(ARRAY(String))  # ARRAY -> 需要改造
    metadata = Column(JSONB)  # JSONB -> 需要改造
    status = Column(ENUM('open', 'closed', name='alert_status'))  # ENUM -> 需要改造

# 改造后 (兼容 KingbaseES / 达梦)
import uuid
from sqlalchemy import JSON, String, Text, Enum as SAEnum

class Alert(Base):
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tags = Column(Text)  # 改为 JSON 字符串存储
    metadata = Column(JSON)  # JSON 是跨数据库兼容的
    status = Column(SAEnum('open', 'closed', name='alert_status'))
```

#### Step 3：RLS行级安全改造

PostgreSQL RLS 是原生功能，国产数据库可能不支持。建议采用 **应用层过滤**：

```python
# backend/app/middleware/tenant.py 改造前：依赖 PostgreSQL RLS

# 改造后：应用层行级过滤
class TenantFilter:
    def apply(self, query: Select, tenant_id: str) -> Select:
        return query.where(self.model.tenant_id == tenant_id)

# 在 Service 层统一注入
class BaseService:
    def _apply_tenant_filter(self, query):
        tenant_id = get_current_tenant_id()
        if tenant_id:
            return query.where(self.model.tenant_id == tenant_id)
        return query
```

#### Step 4：Alembic迁移脚本重写

20个迁移脚本需要逐个审查和适配：

| 迁移版本 | 涉及变更 | 重点检查项 |
|---------|---------|-----------|
| `001_initial.py` | 基础表创建 | UUID -> String(36), JSONB -> JSON |
| `002_add_tenant.py` | 多租户字段 | RLS策略移除 |
| `003_add_alert_index.py` | 索引 | fulltext index -> GIN index |
| ... | ... | ... |
| `020_xxx.py` | 最新迁移 | 确认无PG特有语法 |

**重写策略**：
- 不需要修改迁移逻辑，只修改字段类型定义
- 依赖 `config.py` 中的 `DB_TYPE` 做条件分支
- 新增 `common_types.py` 统一管理跨数据库类型映射

#### Step 5：全文检索改造

```python
# 改造前：PostgreSQL tsvector
from sqlalchemy import func
query = func.to_tsvector('chinese', Alert.description).op('@@')(func.to_tsquery('chinese', keyword))

# 改造后：使用 LIKE 或数据库扩展
# 方案A：KingbaseES 兼容模式支持 tsvector
# 方案B：降级为 ILIKE
query = Alert.description.ilike(f'%{keyword}%')

# 方案C：使用 Elasticsearch 作为专用搜索引擎（推荐，但增加架构复杂度）
```

### 4.3 数据迁移脚本

```bash
#!/bin/bash
# scripts/migrate_to_kingbase.sh

set -e

PG_HOST="localhost"
KB_HOST="localhost"
KB_PORT="54321"
DB_NAME="secmind"

echo "=== 步骤1: 从 PostgreSQL 导出数据 ==="
pg_dump -h $PG_HOST -U secmind --data-only --format=custom -f /tmp/secmind_data.dump $DB_NAME

echo "=== 步骤2: 在 KingbaseES 中创建 schema ==="
ksql -h $KB_HOST -p $KB_PORT -U system -d $DB_NAME -f backend/alembic/kingbase_init.sql

echo "=== 步骤3: 数据导入 KingbaseES ==="
# 使用 KingbaseES 提供的迁移工具
kb_migrate --source postgresql://secmind@$PG_HOST/$DB_NAME \
           --target kingbase://system@$KB_HOST:$KB_PORT/$DB_NAME

echo "=== 步骤4: 验证数据完整性 ==="
python scripts/verify_data.py --source pg --target kingbase
```

---

## 五、AI模型国产化适配方案

### 5.1 模型选型

| 国产模型 | 支持状态 | 安全领域表现 | 适配工作 | 成本 |
|---------|---------|-------------|---------|------|
| **DeepSeek V3/R1** | ✅ 已有Provider | ★★★★ | 优化Prompt | 低 |
| **通义千问 Qwen-Max** | ✅ 已有Provider | ★★★★ | 优化Prompt | 中 |
| **智谱GLM-4** | ❌ 需新增 | ★★★★ | 新增Provider模块 | 中 |
| **百度文心ERNIE 4.0** | ❌ 需新增 | ★★★ | 新增Provider模块 | 中 |
| **百川 Baichuan2 | ❌ 需新增 | ★★★ | 新增Provider模块 | 低 |
| 月之暗面Moonshot | ❌ 需新增 | ★★★ | 新增Provider模块 | 中 |

### 5.2 新增Provider开发

以新增 智谱GLM-4 Provider 为例：

```python
# backend/app/ai/providers/glm_provider.py

from typing import AsyncIterator
import httpx
from .base import AIProvider, AIProviderConfig, AIResponse

class GLMProvider(AIProvider):
    """智谱 GLM-4 Provider"""

    def __init__(self, config: AIProviderConfig):
        self.api_key = config.api_key = config.api_key
        self.api.model = config.model or "glm-4-plus"
        self.api.base_url = config.base_url or "https://open.bigmodel.cn/api/paas/v4"

    async def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.1,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> AIResponse | AsyncIterator[str]:
        # 实现 GLM-4 的 chat completion API
        ...

    async def analyze_security_alert(self, alert_data: dict) -> AIResponse:
        prompt = self._build_security_prompt(alert_data)
        return await self.chat_completion(prompt)
```

### 5.3 Provider路由策略

```python
# backend/app/ai/router.py

class ModelRouter:
    """智能路由：按场景选择最优模型"""

    ROUTING_RULES = {
        "alert_triage": {
            "primary": "deepseek",      # 高性价比
            "fallback": "tongyi",       # 备用
            "require_confidence": 0.85,
        },
        "deep_investigation": {
            "glm-4",  # 长上下文任务
        "incident_report": {
            "primary": "tongyi",
            "require_cn_output": True,  # 需要中文输出
        },
        "threat_hunting": "deepseek",
        "compliance_check": "glm-4",
    }

    async def route(self, task_type: str, context: dict) -> AIResponse:
        rule = self.ROUTING_RULES.get(task_type, {})
        primary = rule.get("primary", "deepseek")
        fallback = rule.get("fallback", "")

        # 重试策略：primary -> fallback -> last resort
        for provider_name in [primary, fallback, "deepseek"]:
            try:
                provider = self.get_provider(provider_name)
                result = await provider.process(context)
                if result.confidence >= rule.get("require_confidence", 0):
                    return result
            except Exception:
                continue

        raise AIFallbackError("所有国产模型均失败")
```

### 5.4 效果验证

| 测试

需要设计专门的安全场景测试集，对比国产模型与原GPT-4o的效果：

| 测试场景 | 测试样本数 | 评估指标 | 基准 (GPT-4o) | 目标 (国产模型) |
|---------|-----------|---------|--------------|---------------|
| 告警误报判断 | 500 | 精确率/召回率 | 95%/92% | ≥90%/≥88% |
| 攻击链还原 | 200 | 准确率 | 93% | ≥88% |
| 处置建议质量 | 300 | 人工评分(1-5) | 4.5 | ≥4.0 |
| IOC提取精度 | 400 | F1 Score | 0.97 | ≥0.93 |
| 多语言告警分析 | 200 | 准确率 | 94% | ≥92%（中文场景） |

---

## 六、操作系统与CPU架构适配

### 6.1 基础环境配置

```bash
# ==========
==== 麒麟V10 环境初始化脚本 ===
# scripts/init_kylin.sh

# Python 环境
yum install -y python3.10 python3.10-devel python3.10-pip
python3.10 -m pip install --upgrade pip

# Node.js 环境
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 构建工具
yum install -y gcc gcc-c++ make cmake
yum install -y openssl-devel bzip2-devel libffi-devel

# Redis
yum install -y redis
systemctl enable redis

# PostgreSQL 客户端（pg_dump 用于数据迁移）
yum install -y postgresql14
```

### 6.2 Docker 镜像适配

```dockerfile
# backend/Dockerfile.kylin

FROM openeuler/openeuler:22.03-lts AS builder

RUN dnf install -y python3.10 python3.10-devel gcc gcc-c++ make
COPY requirements.txt .
RUN pip3.10 install --user -r requirements.txt

FROM openeuler/openeuler:22.03-lts
RUN dnf install -y python3.10 && \
    dnf clean all
COPY --from=builder /root/.local /root/.local
COPY ./app /app
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.3 ARM64 兼容性确认

| 依赖 | PyPI wheel | 说明 | ARM64 兼容性 |
|------|---------|-------------|
| `cryptography` | 有ARM64 wheel ✅ | ✅ |
| `psycopg2-binary` | 需从源码编译（ARM64） | ⚠️ 建议使用 `psycopg2`（源码安装） |
| `numpy` | 有ARM64 wheel ✅ | ✅ |
| `orjson` | 纯Python fallback | ✅ 性能下降约20% |
| `httpx` | 纯Python | ✅ |
| `openai` | 纯Python | ✅ |
| `jose` | 纯Python | ✅ |

---

## 七、国密改造方案

### 7.1 改造范围

| 安全需求 | 国际算法 | 国密算法 | 涉及模块 |
|---------|---------|---------|---------|
| HTTPS证书 | RSA/ECC | SM2 | Nginx/反向代理层 |
| 密码存储 | bcrypt | SM3 + SM4 | `app/core/security.py` |
| 数据库加密列 | AES-256 | SM4-CBC | `app/models/encrypted_fields.py` |
| JWT令牌 | RS256/HS256 | SM2 + SM3 | `app/core/auth.py` |
| API签名 | HMAC-SHA256 | SM3-HMAC | `app/middleware/signature.py` |
| 通信加密 | TLS 1.3 | TLCP (GMT 0024) | Nginx国密版 |

### 7.2 国密密码库选型

```python
# 推荐使用 gmssl-python（国密标准库的Python封装）

# backend/app/core/sm_crypto.py

from gmssl import sm2, sm3, sm4
import base64


class SM2Crypto:
    """SM2 非对称加密（用于JWT签）"""

    def __init__(self, private_key: str, public_key: str):
        self.private_key = private_key
        self.public_key = public_key
        self.crypt = sm2.CryptSM2(public_key, private_key)

    def sign(self, data: str) -> str:
        """SM2 签名"""
        sign = self.crypt.sign(data.encode(), "1234567812345678")
        return base64.b64encode(sign).decode()

    def verify(self, data: str, signature: str) -> bool:
        """验证 SM2 签名"""
        sign = base64.b64decode(signature)
        return self.crypt.verify(sign, data.encode())


class SM3Hash:
    """SM3 摘要算法（用于密码哈希）"""

    @staticmethod
    def hash(password: str, salt: str = "") -> str:
        """SM3 哈希"""
        data = (password + salt).encode()
        return sm3.sm3_hash(list(data))


class SM4Crypto:
    """SM4 对称加密（用于数据库加密字段）"""

    def __init__(self, key: str):
        self.key = key.encode()
        self.crypt = sm4.CryptSM4()

    def encrypt(self, plaintext: str) -> str:
        self.crypt.set_key(self.key, sm4.SM4_ENCRYPT)
        encrypted = self.crypt.crypt_ecb(plaintext.encode())
        return base64.b64encode(bytes(encrypted)).decode()

    def decrypt(self, ciphertext: str) -> str:
        self.crypt.set_key(self.key, sm4.SM4_DECRYPT)
        data = base64.b64decode(ciphertext)
        decrypted = self.crypt.crypt_ecb(list(data))
        return bytes(decrypted).decode().rstrip('\x00')
```

### 7.3 JWT国密改造

```python
# backend/app/core/auth.py

from datetime import datetime, timedelta
from .sm_crypto import SM2Crypto


class AuthService:
    """基于 SM2 的 JWT 认证"""

    def __init__(self):
        self.sm2 = SM2Crypto(
            private_key=settings.SM2_PRIVATE_KEY,
            public_key=settings.SM2_PUBLIC_KEY,
        )

    def   create_access_token(self, data: dict):
        payload = {
            "sub": data.get("user_id"),
            "role": data.get("role"),
            "exp": datetime.utcnow() + timedelta(hours=24),
        }
        header = {"alg": "SM2", "typ": "JWT"}
        token_parts = [
            base64url_encode(json.dumps(header)),
            base64url_encode(json.dumps(payload)),
        ]
        signature = self.sm2.sign(".".join(token_parts))
        token_parts.append(base64url_encode(signature))
        return ".".join(token_parts)
```

### 7.4 Nginx国密SSL配置

```nginx
# nginx/conf/secmind_ssl.conf
# 国密双证书配置（同时支持国际TLS和国密TLCP）

server {
    listen 443 ssl;
    server_name secmind.example.com;

    # 国际TLS证书（RSA）
    ssl_certificate     /etc/ssl/certs/international.crt;
    ssl_certificate_key /etc/ssl/private/international.key;

    # 国密TLCP证书（SM2）
    # 需要使用支持国密的 nginx 版本（如 TongHttpServer）
    ssl_certificate_sm2     /etc/ssl/certs/gm_cert.pem;
    ssl_certificate_key_sm2 /etc/ssl/private/gm_key.pem;
    ssl_ciphers_sm2         "ECC-SM2-SM4-CBC-SM3:ECDHE-SM2-SM4-CBC-SM3";

    location / {
        proxy_pass http://backend:8000;
    }
}
```

---

## 八、中间件与容器化部署调整

### 8.1 Docker Compose 信创版

```yaml
# docker-compose.xinchuang.yml

services:
  kingbase:
    image: kingbase/kb:v8r6-arm64
    platform: linux/arm64
    environment:
      DB_MODE: pg
      DB_USER: ${DB_USER:-secmind}
      DB_PASSWORD: ${DB_PASSWORD:?必须设置 DB_PASSWORD}
      DB_NAME: secmind
    ports:
      - "54321:54321"
    volumes:
      - kingbase_data:/home/kingbase/userdata
    healthcheck:
      test: ["CMD", "ksql", "-U", "system", "-c", "SELECT 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    platform: linux/arm64
    command: redis-server --requirepass ${REDIS_PASSWORD:?必须设置 REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.kylin
    platform: linux/arm64
    environment:
      DB_TYPE: kingbase
      DATABASE_URL: kingbase+psycopg2://${DB_USER}:${DB_PASSWORD}@kingbase:54321/secmind
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      AI_MODEL_PROVIDER: deepseek
    depends_on:
      kingbase:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build: ./frontend
    platform: linux/arm64
    environment:
      NEXT_PUBLIC_API_URL: https://api.secmind.cn
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  kingbase_data:
  redis_data:
```

### 8.2 部署脚本适配

```bash
# scripts/deploy_xinchuang.sh

set -e

ENV=${1:-production}
PLATFORM=${2:-arm64}

echo "=== 信创环境部署脚本 ==="
echo "环境: $ENV | 架构: $PLATFORM"

# 1. 检查环境
command -v docker >/dev/null 2>&1 || { echo "需要安装 Docker"; exit 1; }

# 2. 配置环境变量
cp .env.example .env

# 3. 构建镜像
docker compose -f docker-compose.xinchuang.yml build

# 4. 启动服务
docker compose -f docker-compose.xinchuang.yml up -d

# 5. 执行数据库迁移
docker compose -f docker-compose.xinchuang.yml exec backend \
    alembic upgrade head

# 6. 健康检查
echo "等待服务就绪..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health | grep -q "ok"; then
        echo "✓ 后端就绪"
        break
    fi
    sleep 2
done
```

---

## 九、前后端代码改造清单

### 9.1 后端代码改动

| 模块 | 文件 | 改动内容 | 工作量 |
|------|-----|---------|-------|
| 配置 | `app/config.py` | 增加数据库类型选择、国密配置 | 1天 |
| 数据库 | `app/database.py` | 支持多数据库驱动启动 | 1天 |
| 公共类型 | `app/core/db_types.py` | **新增**：跨数据库兼容类型定义 | 1天 |
| 认证 | `app/core/auth.py` | 国密SM2 JWT改造 | 2天 |
| 安全 | `app/core/security.py` | SM3密码哈希替换bcrypt | 1天 |
| 多租户 | `app/middleware/tenant.py` | RLS改为应用层过滤 | 2天 |
| 搜索 | `app/services/search.py` | 全文检索降级为ILIKE/ES | 2天 |
| 迁移脚本 | `alembic/versions/*.py` | 20个脚本逐个审查和适配 | 3-5天 |
| 模型文件 | `app/models/*.py` | 23个ORM模型字段类型更正 | 2天 |
| AI提供者 | `app/ai/providers/glm_provider.py` | **新增**：智谱GLM-4 | 1天 |
| AI提供者 | `app/ai/providers/ernie_provider.py` | **新增**：百度文心ERNIE | 1天 |
| AI路由 | `app/ai/router.py` | 国产模型优先级路由策略 | 1天 |
| 国密工具 | `app/core/sm_crypto.py` | **新增**：SM2/SM3/SM4封装 | 2天 |

### 9.2 前端代码改动

| 变更项 | 说明 | 工作量 |
|--------|------|-------|
| 国产浏览器兼容性测试和修复 | 360安全浏览器、奇安信可信浏览器 | 1天 |
| 国际化配置确认 | 默认语言为中文 | 0.5天 |
| 图表库兼容 | ECharts 在国产浏览器上验证 | 0.5天 |
| AI模型选择UI | 新增国产模型下拉选项 | 0.5天 |
| 国密证书到期提示 | 前端展示SSL证书状态 | 1天 |

### 9.3 Docker/部署改动

| 变更项 | 工作量 |
|--------|-------|
| `Dockerfile.kylin` | 1天 |
| `docker-compose.xinchuang.yml` | 0.5天 |
| `nginx/xinchuang_ssl.conf` | 0.5天 |
| `scripts/init_kylin.sh` | 0.5天 |
| `scripts/migrate_to_kingbase.sh` | 1天 |
| `scripts/deploy_xinchuang.sh` | 0.5天 |

---

## 十、测试验证方案

### 10.1 测试矩阵

| 测试大类 | 子项 | 环境要求 | 责任人 |
|---------|------|---------|-------|
| **基础设施** | 国产OS安装与配置 | 麒麟V10 / UOS | 运维 |
| **基础设施** | Docker运行与容器化部署 | ARM64 Docker | 运维 |
| **基础设施** | Redis运行与连接 | ARM64 Redis | 运维 |
| **数据库** | KingbaseES安装与配置 | 国产OS + ARM64 | DBA |
| **数据库** | 数据迁移验证 | 数据完整性校验 | DBA |
| **数据库** | ORM兼容性（23个模型） | SQLAlchemy + Kingbase | 后端 |
| **数据库** | Alembic迁移（20个版本） | 全量迁移回放 | 后端 |
| **数据库** | 多租户行级过滤 | 应用层过滤 | 后端 |
| **数据库** | 查询性能测试 | 100万+数据量 | QA |
| **AI模型** | DeepSeek推理质量 | 安全场景集 | AI |
| **AI模型** | 通义千问推理质量 | 安全场景集 | AI |
| **AI模型** | 新增GLM-4集成测试 | Provider接口 | 后端 |
| **AI模型** | 模型路由与故障转移 | Primary/Fallback | 后端 |
| **国密** | SM2签名与验证 | 单元测试 | 后端 |
| **国密** | SM3密码哈希 | 用户认证流程 | 后端 |
| **国密** | SM4加解密 | 敏感字段读写 | 后端 |
| **国密** | HTTPS双证书 | 浏览器访问验证 | 运维 |
| **性能** | API响应时间（P99） | 信创环境压测 | QA |
| **性能** | 并发用户数（200虚拟用户） | 信创环境压测 | QA |
| **浏览器** | 360安全浏览器 | 全部22+页面 | QA |
| **浏览器** | 奇安信可信浏览器 | 核心功能 | QA |

### 10.2 测试数据生成

```python
# tests/test_xinchuang_migration.py

import pytest
from app.database import get_db
from app.models.alert import Alert


@pytest.mark.xinchuang
class TestDataMigration:
    """数据迁移完整性验证"""

    def test_record_count_match(self, source_db, target_db):
        """验证源库和目标库记录数一致"""
        source_count = source_db.query(Alert).count()
        target_count = target_db.query(Alert).count()
        assert source_count == target_count, \
            f"记录数不匹配: {source_count} vs {target_count}"

    def test_data_integrity_spot_check(self, source_db, target_db):
        """随机抽检100条记录的数据完整性"""
        sample_ids = source_db.query(Alert.id).limit(100).all()
        for (alert_id,) in sample_ids:
            source = source_db.query(Alert).get(alert_id)
            target = target_db target = target.query(Alert).get(alert_id)
            assert source.title == target.title
            assert source.severity == target.severity
            # JSONB 字段对比
            assert json.loads(source.metadata) == json.loads(target.metadata)

    def test_special_chars(

    def test_special_chars(self, source_db, target_db):
        """验证中文字符、特殊字符的完整性"""
        chars = ['中文', '!@#$%', '\\n\\t', '👾emoji']
        for char in chars:
            alert_id = source_db.query(Alert.id).filter(
                Alert.title.contains(char)
            ).first()
            if alert_id:
                target_alert = target_db.query(Alert).get(alert_id[0])
                assert target_alert is not None
                assert char in target_alert.title
```

---

## 十一、改造路线图与里程碑

### 11.1 总体路线

```
Phase 1        Phase 2        Phase 3         Phase 4         Phase 5
┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐
│ 评估选型  │→│ 基础环境  │→│ 数据库迁移  │→│ 应用适配   │→│ 测试验收  │
│ 2-4周    │  │ 4-6周     │  │ 6-8周     │  │ 4-6周    │  │ 4-6周    │
└──────────┘  └──────────┘  └───────────┘  └───────────┘  └──────────┘
     │             │              │              │              │
     ▼             ▼              ▼              ▼              ▼
  方案评审      环境就绪      数据层完成      应用适配      验收通过
```

### 11.2 详细里程碑

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|---------|
| **M1：方案评审通过** | 第2-4周 | 信创改造方案、选型报告 | 评审会通过 |
| **M2：基础环境就绪** | 第6-10周 | 信创硬件/OS/中间件部署完毕 | 麒麟V10+KingbaseES运行正常 |
| **M3：数据库迁移完成** | 第12-18周 | 20个Alembic迁移通过、数据迁移验证报告 | 全量数据完整性校验通过 |
| **M4：应用层适配完成** | 第18-24周 | 国密改造、AI模型适配、代码合并 | 功能回归测试通过率100% |
| **M5：性能达标** | 第24-28周 | 性能测试报告、调优记录 | P99 < 600ms |
| **M6：验收交付** | 第28-30周 | 等保测评报告、验收报告 | 客户签字确认 |

### 11.3 按优先级切分的滚动实施计划

#### 第一期（P0，2个月）—— 快速验证

```
目标：跑通最小信创闭环
- 选海光(x86)规避CPU适配问题
- 选KingbaseES(PG兼容模式)降低数据库迁移难度
- 使用DeepSeek（已有Provider）
- 跳过国密改造
```

#### 第二期（P1，2个月）—— 核心改造

```
目标：完成关键信创要素
- 迁移到ARM64（鲲鹏/飞腾）
- 全面数据库迁移完成
- 全量国产模型适配
- 国密SM2/SM3改造
```

#### 第三期（P2，2个月）—— 全面达标

```
目标：全栈信创认证
- 通过等保2.0三级测评
- 国密HTTPS + 全站国密
- 国产浏览器全兼容
- 获取信创适配证书
```

---

## 十二、风险评估与应对措施

### 12.1 风险矩阵

| 风险 | 概率 | 影响 | 等级 | 应对措施 |
|------|:---:|:----:|:----:|---------|
| KingbaseES兼容性问题导致部分SQL不可用 | 中 | 高 | 🔴 | 预留达梦DM8作为备选；先在测试环境做全量SQL兼容性扫描 |
| 国产AI模型在安全领域推理质量显著低于GPT-4o | 高 | 高 | 🔴 | 提前做安全场景基准测试；使用"级联模式"（国产模型初筛 -> 人工复核） |
| ARM64架构下Python包编译失败 | 中 | 中 | 🟡 | 预留海光x86兜底；提前列出所有C扩展依赖的ARM64兼容性 |
| 国密算法性能不达标（SM2签名比RSA慢10-100倍） | 高 | 中 | 🟡 | JWT token缓存机制减少签名次数；敏感操作才使用SM2签名 |
| 20个Alembic迁移脚本中部分SQL无法在Kingbase运行 | 中 | 高 | 🔴 | 迁移脚本变更为"按数据库类型条件分支"；开发兼容性扫描工具 |
| 国产浏览器面渲染兼容性问题 | 低 | 中 | 🟢 | 提前布局适配（360浏览器使用Chromium内核，兼容性总体良好） |
| 信创硬件采购周期长 | 高 | 中 | 🟡 | 优先使用云上的信创环境（华为云鲲鹏、阿里云ARM） |
| KingbaseES授权费用超预算 | 中 | 中 | 🟡 | 考虑使用openGauss（华为开源版，无授权费） |

### 12.2 预案

| 场景 | 预案 |
|------|------|
| KingbaseES迁移受阻 | 降级方案：继续使用PostgreSQL，通过中间件层做信创数据库抽象，逐步切换 |
| 国产模型AI效果不达标 | 保留OpenAI作为远程备用，在国产模型置信度低于阈值时人工介入或使用备用模型 |
| 国密性能瓶颈 | 仅在核心用户认证和数据加密环节使用国密，非关键路径使用国际算法（等保通过后逐步补齐） |
| 验收时间紧张 | 采用"信创就绪"策略：先适配国产OS+CPU，数据库和AI模型作为可选项，分阶段认证 |

---

## 十三、附录

### 附录A：改造工作量总表

| 类别 | 子项 | 预估人天 |
|------|------|:-------:|
| **项目管理** | 方案编制、沟通协调、评审 | 15天 |
| **后端开发** | 数据库抽象层、ORM改造、迁移脚本 | 25天 |
| **后端开发** | 国密SM2/SM3/SM4 | 10天 |
| **后端开发** | AI Provider新增 | 8天 |
| **后端开发** | AI路由策略 | 3天 |
| **后端开发** | 多租户RLS改造 | 5天 |
| **前端开发** | 兼容性调整 | 5天 |
| **运维** | 信创环境搭建、镜像构建 | 10天 |
| **运维** | 数据迁移 | 5天 |
| **测试** | 功能测试、性能测试、兼容性测试 | 20天 |
| **AI** | 国产模型效果评估和Prompt优化 | 15天 |
| **安全测评** | 等保2.0测评配合 | 10天 |
| **合计** | | **~131人天（≈6-7人月）** |

### 附录B：推荐信创厂商清单

| 类别 | 推荐厂商 | 产品 | 官网 |
|------|---------|------|------|
| CPU | 华为 | 鲲鹏服务器 | CPU | https://www.huaweicloud.com/kunpeng |
| CPU | 飞腾 | 飞腾腾锐S2500 | https://www.phyt.comwww.phytium.com. |
| CPU | 海光 | 海光C86 | https://www.hygon.cn |
| OS | 麒麟软件 | 麒麟V10 SP3 | https://www.kylinos.cn |
| OS | 统信软件 | 统信UOS 20 | https://www.uniontech.com |
| 数据库 | 人大金仓 | KingbaseES V8 | https://www.kingbase.com.cn |
| 数据库 | 达梦 | DM8 | https://www.dameng.com |
| 数据库 | 华为 | GaussDB | https://www.huaweicloud.com/product/gaussdb.html |
| 数据库 | 开源 | openGauss | https://www.opengauss.org |
| AI模型 | DeepSeek | DeepSeek V3/R1 | https://www.deepseek.com |
| AI模型 | 阿里云 | 通义千问 Qwen-Max | https://tongyi.aliyun.com |
| AI模型 | 智谱AI | GLM-4 | https://www.zhipuai.cn |
| AI模型 | 百度 | 文心一言 ERNIE 4.0 | https://yiyan.baidu.com |
| 中间件 | 东方通 | TongHttpServer | https://www.tongtech.com |
| 国密 | 数安时代 | GMSSL | https://www.gmssl.cn |
| 服务器 | 华为 | TaiShan (ARM) | https://www.huawei.com |
| 服务器 | 浪潮 | 信创系列 | https://www.inspur.com |

### 附录C：缩略语

| 缩略语 | 全称 | 说明 |
|--------|------|------|
| 信创 | 信息技术应用创新 | 国产化替代战略 |
| KingbaseES | 人大金仓数据库 | 国产关系型数据库 |
| DM8 | 达梦数据库8 | 武汉达梦数据库 |
| RLS | Row-Level Security | PostgreSQL 行级安全 |
| SM2/SM3/SM4 | 国密算法 | 中国国家密码标准 |
| TLCP | Transport Layer Cryptography Protocol | 国密传输层协议 |
| 等保2.0 | 网络安全等级保护2.0 | 中国信息安全标准 |

---

> **文档审批**
>
> | 角色 | 姓名 | 日期 | 签字 |
> |------|------|------|------|
> | 编制 | | | |
> | 审核 | | | |
> | 批准 | | | |
>
> **修订记录**
>
> | 版本 | 日期 | 修订内容 | 修订人 |
> |------|------|---------|-------|
> | v1.0 | 2026-05-18 | 初稿 | - |