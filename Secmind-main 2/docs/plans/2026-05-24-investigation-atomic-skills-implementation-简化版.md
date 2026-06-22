# 安全告警调查 · 原子能力实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: 把 [`docs/specs/2026-05-24-investigation-atomic-skills.md`](../specs/2026-05-24-investigation-atomic-skills.md) 落地为一个可被 LLM Agent 调用的 Python 库 + 数据源适配层，分 P0/P1/P2 三阶段交付。

**Architecture**: 三层结构 —
1. **Core**：统一 Schema、AtomicCapability 基类、Registry、错误/降级语义、Observability。
2. **DataSource Adapter**：每类抽象数据源（DS-EDR、DS-IDP、...）一份接口，每接口可挂多家具体厂商实现。本仓库只提供接口 + Mock + 1 个参考实现（按企业落地切换）。
3. **Capability**：每个原子能力一个独立类，单一职责，不互相调用（除非显式声明依赖）。

**Tech Stack**:
- Python 3.11+ / Pydantic v2 / asyncio
- pytest + pytest-asyncio + pytest-cov + hypothesis（属性测试）
- structlog（结构化日志）+ OpenTelemetry（trace/metric）
- ruff + black + mypy --strict
- 包管理：uv（或 poetry）
- 项目骨架：单仓库 `secmind-investigator/`，作为 Secmind 主仓的子包

---

## Scope Note

本计划详细到 step-level 仅覆盖 **P0** 的 ~30 个 task。**P1 / P2** 章节给出 milestone-level 路线图（带依赖/验收/数据源），当 P0 完成后应针对 P1 重新跑一次 `writing-plans` 展开到 step-level。理由：

1. P0 阶段会沉淀 Capability/Adapter 模板，后续按模板复制能极大压缩 P1/P2 的 plan 体量。
2. P0 的运行经验会反向修正 P1/P2 的能力优先级（哪个能力实际查得到、查得快、ROI 高）。
3. 一次写完 100+ task 的细节既无价值也容易腐烂。

---

## File Structure (P0)

```
Secmind/secmind-investigator/
├── pyproject.toml
├── README.md
├── src/secmind_investigator/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── schema.py          # CapabilityResult, EvidenceRef, PIIField 等
│   │   ├── capability.py      # AtomicCapability ABC
│   │   ├── registry.py        # 能力注册 + 命名空间路由
│   │   ├── errors.py          # DataSourceUnavailable / PartialResult / ...
│   │   └── context.py         # ExecutionContext (持有数据源句柄、trace)
│   ├── datasources/
│   │   ├── __init__.py
│   │   ├── base.py            # DataSource ABC + 健康检查 + 限速
│   │   ├── idp.py             # DS-IDP
│   │   ├── hr.py              # DS-HR
│   │   ├── cmdb.py            # DS-CMDB
│   │   ├── edr.py             # DS-EDR
│   │   ├── siem.py            # DS-SIEM
│   │   ├── email.py           # DS-EMAIL
│   │   ├── fw.py              # DS-FW
│   │   ├── ti.py              # DS-TI
│   │   ├── kb.py              # DS-KB
│   │   └── mocks.py           # 内存 mock 实现（供测试与 demo）
│   ├── capabilities/
│   │   ├── __init__.py
│   │   ├── entity/
│   │   │   ├── user_profile.py        # A1
│   │   │   ├── host_profile.py        # A2
│   │   │   ├── ip_profile.py          # A4
│   │   │   ├── domain_profile.py      # A5
│   │   │   └── file_profile.py        # A7
│   │   ├── activity/
│   │   │   ├── login.py               # B1
│   │   │   ├── process_execution.py   # B3
│   │   │   ├── network_connection.py  # B4
│   │   │   └── email.py               # B8
│   │   ├── relation/
│   │   │   ├── cooccurrence.py        # C1
│   │   │   ├── entity_graph.py        # C2
│   │   │   └── process_lineage.py     # C3
│   │   ├── context/
│   │   │   ├── asset_business.py      # D1
│   │   │   ├── user_identity.py       # D2
│   │   │   └── baseline_self.py       # D5
│   │   ├── intel/
│   │   │   ├── ip_reputation.py       # E1
│   │   │   ├── domain_url_reputation.py # E2
│   │   │   ├── hash_reputation.py     # E3
│   │   │   └── ttp_mitre.py           # E7
│   │   ├── verdict/
│   │   │   ├── tp_fp.py               # F1
│   │   │   ├── impact.py              # F2
│   │   │   ├── ioc_extract.py         # F4
│   │   │   └── response_recommendation.py # F8
│   │   └── meta/
│   │       ├── next_step.py           # G3
│   │       └── kb_lookup.py           # G4
│   ├── observability/
│   │   ├── tracing.py
│   │   └── metrics.py
│   └── privacy/
│       └── redactor.py
└── tests/
    ├── conftest.py
    ├── unit/
    │   ├── core/
    │   ├── datasources/
    │   └── capabilities/
    ├── integration/
    │   └── test_phishing_orchestration.py
    └── fixtures/
        └── *.json
```

**为什么这么切**：
- `core/` 只放跨能力共享的最小抽象，不允许引入业务字段。
- `datasources/` 与 `capabilities/` 严格单向依赖：capability 依赖 datasource，反之不可。
- `capabilities/<category>/<name>.py` 单文件单能力，便于 LLM Agent 通过命名空间动态发现。
- 测试镜像源目录结构，方便定位。

---

## P0 Task 总览

| # | Task | 类别 | 依赖 |
|---|---|---|---|
| 1 | 项目骨架与工程化 | Foundation | - |
| 2 | 统一 Schema | Foundation | 1 |
| 3 | AtomicCapability 基类 | Foundation | 2 |
| 4 | 错误与降级语义 | Foundation | 2 |
| 5 | CapabilityRegistry | Foundation | 3 |
| 6 | ExecutionContext + Observability 接入 | Foundation | 3, 5 |
| 7 | DataSource 抽象基类 | Foundation | 4, 6 |
| 8 | DS-IDP adapter + mock | Adapter | 7 |
| 9 | DS-HR adapter + mock | Adapter | 7 |
| 10 | DS-CMDB adapter + mock | Adapter | 7 |
| 11 | DS-EDR adapter + mock | Adapter | 7 |
| 12 | DS-SIEM adapter + mock | Adapter | 7 |
| 13 | DS-EMAIL adapter + mock | Adapter | 7 |
| 14 | DS-FW adapter + mock | Adapter | 7 |
| 15 | DS-TI adapter + mock | Adapter | 7 |
| 16 | DS-KB adapter + mock | Adapter | 7 |
| 17 | A1 用户/账户画像 | Capability | 8, 9, 10, 13 |
| 18 | A2 主机/终端画像 | Capability | 10, 11 |
| 19 | A4 IP 地址画像 | Capability | 10, 11, 14, 15, 16 |
| 20 | A5 域名画像 | Capability | 15, 16 |
| 21 | A7 文件/哈希画像 | Capability | 11, 13, 15, 16 |
| 22 | B1 登录活动 | Capability | 8 |
| 23 | B3 进程执行 | Capability | 11, 15 |
| 24 | B4 网络连接 | Capability | 11, 14 |
| 25 | B8 邮件收发 | Capability | 13, 21 (A7), 20 (A5) |
| 26 | C1 时间窗共现 | Capability | 12 |
| 27 | C2 实体关系图 | Capability | 8, 10, 11 |
| 28 | C3 父子进程链 | Capability | 11 |
| 29 | D1 资产业务上下文 | Capability | 10 |
| 30 | D2 用户身份上下文 | Capability | 8, 9 |
| 31 | D5 自身历史基线 | Capability | 8, 11, 12 |
| 32 | E1 IP 信誉 | Capability | 15 |
| 33 | E2 域名/URL 信誉 | Capability | 15 |
| 34 | E3 文件 Hash 信誉 | Capability | 15 |
| 35 | E7 TTP → MITRE 映射 | Capability | (本地 ATT&CK 知识库) |
| 36 | F1 TP/FP 判定 | Capability | (聚合所有上游) |
| 37 | F2 严重性/影响评估 | Capability | 29 (D1), 30 (D2) |
| 38 | F4 IOC 提取与标准化 | Capability | - |
| 39 | F8 处置建议 | Capability | 36, 37, 38 |
| 40 | G3 不确定性与下一步 | Capability | 5 (Registry) |
| 41 | G4 历史相似告警回查 | Capability | 16 |
| 42 | 钓鱼场景端到端集成测试 | Integration | 17, 22, 25, 33, 36, 39 |
| 43 | README / dev docs / Quick Start | Docs | All P0 |

---

## P0 Tasks (Detailed)

### Task 1: 项目骨架与工程化

**Files:**
- Create: `Secmind/secmind-investigator/pyproject.toml`
- Create: `Secmind/secmind-investigator/src/secmind_investigator/__init__.py`
- Create: `Secmind/secmind-investigator/tests/conftest.py`
- Create: `Secmind/secmind-investigator/.gitignore`
- Create: `Secmind/secmind-investigator/Makefile`

**Dependencies:** none

**Acceptance criteria:**
- `make install && make test` 在干净环境通过（即便此时没有真实测试）
- `make lint` 通过 ruff + mypy --strict
- `pyproject.toml` 锁定 Python 3.11+

- [ ] **Step 1: 创建 pyproject.toml**

```toml
[project]
name = "secmind-investigator"
version = "0.0.1"
description = "Atomic security investigation capabilities for Secmind"
requires-python = ">=3.11"
dependencies = [
    "pydantic>=2.6",
    "structlog>=24.1",
    "opentelemetry-api>=1.24",
    "opentelemetry-sdk>=1.24",
    "httpx>=0.27",
    "anyio>=4.3",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=4.1",
    "hypothesis>=6.100",
    "ruff>=0.4",
    "mypy>=1.9",
    "black>=24.3",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
asyncio_mode = "auto"
addopts = "-ra --strict-markers --cov=secmind_investigator --cov-report=term-missing"
testpaths = ["tests"]

[tool.mypy]
strict = true
python_version = "3.11"

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM", "RUF"]
```

- [ ] **Step 2: 创建 Makefile**

```makefile
.PHONY: install test lint format

install:
	uv pip install -e ".[dev]"

test:
	pytest

lint:
	ruff check src tests
	mypy src

format:
	ruff check --fix src tests
	black src tests
```

- [ ] **Step 3: 创建 __init__.py 与 conftest.py 占位**

`src/secmind_investigator/__init__.py`:
```python
"""Secmind atomic investigation capabilities."""
__version__ = "0.0.1"
```

`tests/conftest.py`:
```python
"""Shared pytest fixtures."""
import pytest


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
```

- [ ] **Step 4: 验证空仓库工程链路**

Run:
```bash
cd Secmind/secmind-investigator
uv venv && source .venv/bin/activate
make install
make test
make lint
```

Expected: 4 条命令 exit 0；`pytest` 报告 "no tests ran"。

- [ ] **Step 5: Commit**

```bash
git add Secmind/secmind-investigator
git commit -m "feat(investigator): scaffold project with pyproject, makefile, conftest"
```

---

### Task 2: 统一 Schema

**Files:**
- Create: `src/secmind_investigator/core/schema.py`
- Create: `tests/unit/core/test_schema.py`

**Dependencies:** Task 1

**Acceptance criteria:**
- `CapabilityResult` 必含 `confidence`, `partial`, `evidence_refs`, `pii_fields`
- `EvidenceRef` 可序列化为 JSON 且回环相等
- PII 字段在 dump 时可被 redactor 识别

- [ ] **Step 1: 写测试**

`tests/unit/core/test_schema.py`:
```python
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from secmind_investigator.core.schema import (
    CapabilityResult,
    EvidenceRef,
    PIIMarker,
)


def test_evidence_ref_roundtrip() -> None:
    ref = EvidenceRef(
        source="DS-EDR",
        query="host=foo time=2026-05-24T10:00:00Z",
        record_id="evt-001",
        captured_at=datetime(2026, 5, 24, 10, 0, tzinfo=UTC),
    )
    data = ref.model_dump_json()
    restored = EvidenceRef.model_validate_json(data)
    assert restored == ref


def test_capability_result_requires_confidence_and_partial_flag() -> None:
    with pytest.raises(ValidationError):
        CapabilityResult(payload={})  # type: ignore[call-arg]


def test_capability_result_default_partial_false() -> None:
    res = CapabilityResult(payload={"k": "v"}, confidence=0.9)
    assert res.partial is False
    assert res.evidence_refs == []
    assert res.pii_fields == []


def test_pii_marker_carries_jsonpath() -> None:
    marker = PIIMarker(json_path="$.identity.email", classification="email")
    assert marker.json_path.startswith("$")
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pytest tests/unit/core/test_schema.py -v`
Expected: `ModuleNotFoundError: No module named 'secmind_investigator.core.schema'`

- [ ] **Step 3: 实现 Schema**

`src/secmind_investigator/core/schema.py`:
```python
"""Core Pydantic schemas shared by all atomic capabilities."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

PIIClassification = Literal[
    "name", "email", "phone", "id_number", "address", "ip", "device_id", "other"
]


class PIIMarker(BaseModel):
    """Marks a JSON path in a payload as containing PII for downstream redaction."""

    model_config = ConfigDict(frozen=True)
    json_path: str = Field(..., description="JSONPath into the payload")
    classification: PIIClassification


class EvidenceRef(BaseModel):
    """A pointer back to the original record that supports a finding."""

    model_config = ConfigDict(frozen=True)
    source: str = Field(..., description="Abstract data source id, e.g. DS-EDR")
    query: str = Field(..., description="Query string or descriptor used")
    record_id: str | None = None
    captured_at: datetime


class CapabilityResult(BaseModel):
    """Uniform envelope for every atomic capability output."""

    payload: dict[str, Any]
    confidence: float = Field(..., ge=0.0, le=1.0)
    partial: bool = False
    partial_reasons: list[str] = Field(default_factory=list)
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    pii_fields: list[PIIMarker] = Field(default_factory=list)
    duration_ms: int | None = None
    cost_units: float | None = None
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pytest tests/unit/core/test_schema.py -v`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/core/schema.py tests/unit/core/test_schema.py
git commit -m "feat(core): add CapabilityResult / EvidenceRef / PIIMarker schemas"
```

---

### Task 3: AtomicCapability 基类

**Files:**
- Create: `src/secmind_investigator/core/capability.py`
- Create: `tests/unit/core/test_capability.py`

**Dependencies:** Task 2

**Acceptance criteria:**
- 抽象类无法直接实例化
- 子类必须声明 `namespace`, `input_model`, `output_payload_model`
- `run()` 自动包裹耗时统计与错误捕获，输出 `CapabilityResult`

- [ ] **Step 1: 写测试**

`tests/unit/core/test_capability.py`:
```python
import pytest
from pydantic import BaseModel

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.schema import CapabilityResult


class _DummyIn(BaseModel):
    name: str


class _DummyOut(BaseModel):
    greeting: str


class _DummyCap(AtomicCapability[_DummyIn, _DummyOut]):
    namespace = "investigate.test.dummy"
    input_model = _DummyIn
    output_payload_model = _DummyOut

    async def execute(self, inp: _DummyIn, ctx: ExecutionContext) -> _DummyOut:
        return _DummyOut(greeting=f"hello {inp.name}")


async def test_run_returns_capability_result(empty_context: ExecutionContext) -> None:
    cap = _DummyCap()
    result = await cap.run({"name": "alice"}, empty_context)
    assert isinstance(result, CapabilityResult)
    assert result.payload == {"greeting": "hello alice"}
    assert result.confidence == 1.0
    assert result.partial is False
    assert result.duration_ms is not None and result.duration_ms >= 0


async def test_run_validates_input(empty_context: ExecutionContext) -> None:
    cap = _DummyCap()
    with pytest.raises(ValueError):
        await cap.run({"wrong_field": 1}, empty_context)


def test_subclass_must_declare_namespace() -> None:
    with pytest.raises(TypeError):

        class _Bad(AtomicCapability):  # type: ignore[misc]
            input_model = _DummyIn
            output_payload_model = _DummyOut
            # missing namespace
```

`tests/conftest.py` 追加：
```python
from secmind_investigator.core.context import ExecutionContext


@pytest.fixture
def empty_context() -> ExecutionContext:
    return ExecutionContext.empty()
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pytest tests/unit/core/test_capability.py -v`
Expected: ModuleNotFoundError

- [ ] **Step 3: 实现 Capability 与 ExecutionContext (最小版本)**

`src/secmind_investigator/core/context.py`:
```python
"""Execution context: holds data source handles and tracing for one capability run."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExecutionContext:
    """Per-run state passed to AtomicCapability.execute()."""

    datasources: dict[str, Any] = field(default_factory=dict)
    trace_id: str | None = None
    caller_role: str | None = None  # for privacy redaction

    @classmethod
    def empty(cls) -> "ExecutionContext":
        return cls()
```

`src/secmind_investigator/core/capability.py`:
```python
"""Base class for every atomic investigation capability."""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import ClassVar, Generic, TypeVar

from pydantic import BaseModel

from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.schema import CapabilityResult

TIn = TypeVar("TIn", bound=BaseModel)
TOut = TypeVar("TOut", bound=BaseModel)


class AtomicCapability(ABC, Generic[TIn, TOut]):
    """One investigation action. Single responsibility, no internal orchestration."""

    namespace: ClassVar[str]
    input_model: ClassVar[type[BaseModel]]
    output_payload_model: ClassVar[type[BaseModel]]

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if ABC in cls.__bases__:
            return
        for attr in ("namespace", "input_model", "output_payload_model"):
            if not hasattr(cls, attr):
                raise TypeError(f"{cls.__name__} must declare class attribute {attr!r}")

    @abstractmethod
    async def execute(self, inp: TIn, ctx: ExecutionContext) -> TOut: ...

    async def run(self, raw_input: dict[str, object], ctx: ExecutionContext) -> CapabilityResult:
        inp = self.input_model.model_validate(raw_input)  # raises ValueError on bad input
        start = time.perf_counter()
        out = await self.execute(inp, ctx)  # type: ignore[arg-type]
        duration_ms = int((time.perf_counter() - start) * 1000)
        return CapabilityResult(
            payload=out.model_dump(mode="json"),
            confidence=1.0,
            partial=False,
            duration_ms=duration_ms,
        )
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pytest tests/unit/core/test_capability.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/core/{capability,context}.py tests/unit/core/test_capability.py tests/conftest.py
git commit -m "feat(core): AtomicCapability ABC + ExecutionContext"
```

---

### Task 4: 错误与降级语义

**Files:**
- Create: `src/secmind_investigator/core/errors.py`
- Modify: `src/secmind_investigator/core/capability.py` — `run()` 捕获 `DataSourceUnavailable`，转 `partial=True` 而非异常
- Create: `tests/unit/core/test_errors.py`

**Dependencies:** Task 3

**Acceptance criteria:**
- `DataSourceUnavailable("DS-EDR", "timeout")` 在 `run()` 中转化为 `partial=True, partial_reasons=["DS-EDR: timeout"]`，不抛
- `CapabilityFatal` 仍然抛出（让上层编排决定）
- `PartialResult` 可由 capability 主动 raise 携带已收集的部分数据

- [ ] **Step 1: 写测试**

```python
# tests/unit/core/test_errors.py
import pytest
from pydantic import BaseModel

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import (
    CapabilityFatal,
    DataSourceUnavailable,
    PartialResult,
)


class _In(BaseModel):
    pass


class _Out(BaseModel):
    value: str


class _CapDSDown(AtomicCapability[_In, _Out]):
    namespace = "investigate.test.dsdown"
    input_model = _In
    output_payload_model = _Out

    async def execute(self, inp: _In, ctx: ExecutionContext) -> _Out:
        raise DataSourceUnavailable("DS-EDR", "timeout after 3s")


class _CapFatal(AtomicCapability[_In, _Out]):
    namespace = "investigate.test.fatal"
    input_model = _In
    output_payload_model = _Out

    async def execute(self, inp: _In, ctx: ExecutionContext) -> _Out:
        raise CapabilityFatal("invariant broken")


class _CapPartial(AtomicCapability[_In, _Out]):
    namespace = "investigate.test.partial"
    input_model = _In
    output_payload_model = _Out

    async def execute(self, inp: _In, ctx: ExecutionContext) -> _Out:
        raise PartialResult(
            payload=_Out(value="have_some"),
            reasons=["DS-TI rate-limited"],
            confidence=0.5,
        )


async def test_ds_unavailable_returns_partial(empty_context: ExecutionContext) -> None:
    res = await _CapDSDown().run({}, empty_context)
    assert res.partial is True
    assert "DS-EDR" in res.partial_reasons[0]
    assert res.payload == {}
    assert res.confidence == 0.0


async def test_fatal_propagates(empty_context: ExecutionContext) -> None:
    with pytest.raises(CapabilityFatal):
        await _CapFatal().run({}, empty_context)


async def test_partial_carries_data(empty_context: ExecutionContext) -> None:
    res = await _CapPartial().run({}, empty_context)
    assert res.partial is True
    assert res.payload == {"value": "have_some"}
    assert res.confidence == 0.5
    assert res.partial_reasons == ["DS-TI rate-limited"]
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pytest tests/unit/core/test_errors.py -v`
Expected: ImportError on `secmind_investigator.core.errors`.

- [ ] **Step 3: 实现**

`src/secmind_investigator/core/errors.py`:
```python
"""Error types and degradation semantics."""
from __future__ import annotations

from pydantic import BaseModel


class CapabilityError(Exception):
    """Base exception for capability layer."""


class DataSourceUnavailable(CapabilityError):
    """A data source could not be reached; capability should degrade to partial."""

    def __init__(self, source: str, reason: str) -> None:
        super().__init__(f"{source}: {reason}")
        self.source = source
        self.reason = reason


class PartialResult(CapabilityError):
    """Raised by capability to surface partial data with explicit confidence."""

    def __init__(self, payload: BaseModel, reasons: list[str], confidence: float) -> None:
        super().__init__("partial result")
        self.payload = payload
        self.reasons = reasons
        self.confidence = confidence


class CapabilityFatal(CapabilityError):
    """Unrecoverable error; orchestrator must surface to operator."""
```

更新 `src/secmind_investigator/core/capability.py` 的 `run()`：
```python
async def run(self, raw_input: dict[str, object], ctx: ExecutionContext) -> CapabilityResult:
    inp = self.input_model.model_validate(raw_input)
    start = time.perf_counter()
    try:
        out = await self.execute(inp, ctx)  # type: ignore[arg-type]
        payload = out.model_dump(mode="json")
        partial = False
        confidence = 1.0
        reasons: list[str] = []
    except PartialResult as pr:
        payload = pr.payload.model_dump(mode="json")
        partial = True
        confidence = pr.confidence
        reasons = pr.reasons
    except DataSourceUnavailable as e:
        payload = {}
        partial = True
        confidence = 0.0
        reasons = [str(e)]
    duration_ms = int((time.perf_counter() - start) * 1000)
    return CapabilityResult(
        payload=payload,
        confidence=confidence,
        partial=partial,
        partial_reasons=reasons,
        duration_ms=duration_ms,
    )
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `pytest tests/unit/core -v`
Expected: 全部 passed（包括 Task 3 的回归）。

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/core/{errors,capability}.py tests/unit/core/test_errors.py
git commit -m "feat(core): error types and partial-result degradation"
```

---

### Task 5: CapabilityRegistry

**Files:**
- Create: `src/secmind_investigator/core/registry.py`
- Create: `tests/unit/core/test_registry.py`

**Dependencies:** Task 3

**Acceptance criteria:**
- 同一 namespace 重复注册抛错
- `lookup(ns)` 命中返回类；未命中返回 `None`
- `list_namespaces()` 按前缀过滤
- 支持装饰器注册：`@registry.register`

- [ ] **Step 1: 写测试**

```python
# tests/unit/core/test_registry.py
import pytest
from pydantic import BaseModel

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.registry import CapabilityRegistry


class _I(BaseModel):
    pass


class _O(BaseModel):
    pass


def _make(ns: str) -> type[AtomicCapability]:
    class _Cap(AtomicCapability[_I, _O]):
        namespace = ns
        input_model = _I
        output_payload_model = _O

        async def execute(self, inp: _I, ctx: ExecutionContext) -> _O:
            return _O()

    return _Cap


def test_register_and_lookup() -> None:
    reg = CapabilityRegistry()
    reg.register(_make("investigate.entity.user.profile"))
    cls = reg.lookup("investigate.entity.user.profile")
    assert cls is not None
    assert cls.namespace == "investigate.entity.user.profile"


def test_duplicate_register_raises() -> None:
    reg = CapabilityRegistry()
    reg.register(_make("ns.x"))
    with pytest.raises(ValueError):
        reg.register(_make("ns.x"))


def test_list_by_prefix() -> None:
    reg = CapabilityRegistry()
    reg.register(_make("investigate.entity.user.profile"))
    reg.register(_make("investigate.entity.host.profile"))
    reg.register(_make("investigate.activity.login"))
    found = reg.list_namespaces(prefix="investigate.entity")
    assert set(found) == {
        "investigate.entity.user.profile",
        "investigate.entity.host.profile",
    }
```

- [ ] **Step 2: 运行测试**

Expected: fail (no module).

- [ ] **Step 3: 实现**

```python
# src/secmind_investigator/core/registry.py
from __future__ import annotations

from secmind_investigator.core.capability import AtomicCapability


class CapabilityRegistry:
    """Registry mapping namespace → AtomicCapability class."""

    def __init__(self) -> None:
        self._caps: dict[str, type[AtomicCapability]] = {}

    def register(self, cap_cls: type[AtomicCapability]) -> type[AtomicCapability]:
        ns = cap_cls.namespace
        if ns in self._caps:
            raise ValueError(f"capability {ns!r} already registered")
        self._caps[ns] = cap_cls
        return cap_cls

    def lookup(self, namespace: str) -> type[AtomicCapability] | None:
        return self._caps.get(namespace)

    def list_namespaces(self, prefix: str = "") -> list[str]:
        return sorted(ns for ns in self._caps if ns.startswith(prefix))


default_registry = CapabilityRegistry()
```

- [ ] **Step 4: 运行测试**

Run: `pytest tests/unit/core/test_registry.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/core/registry.py tests/unit/core/test_registry.py
git commit -m "feat(core): CapabilityRegistry with prefix listing"
```

---

### Task 6: ExecutionContext + Observability 接入

**Files:**
- Modify: `src/secmind_investigator/core/context.py` — 接入 trace_id 生成、structlog
- Create: `src/secmind_investigator/observability/tracing.py`
- Create: `src/secmind_investigator/observability/metrics.py`
- Create: `tests/unit/core/test_context.py`
- Create: `tests/unit/observability/test_tracing.py`

**Dependencies:** Task 3, Task 5

**Acceptance criteria:**
- 每次 `run()` 产生唯一 trace_id 并注入 structlog 上下文
- 每次 `run()` 产生 metric: `capability_run_total`, `capability_duration_ms`, `capability_partial_total`
- 测试通过捕获 structlog 输出验证字段齐全（capability_ns, trace_id, duration_ms, partial）

- [ ] **Step 1: 写测试（捕获 structlog）**

```python
# tests/unit/observability/test_tracing.py
import structlog
from pydantic import BaseModel

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext


class _I(BaseModel):
    pass


class _O(BaseModel):
    pass


class _Cap(AtomicCapability[_I, _O]):
    namespace = "investigate.test.observable"
    input_model = _I
    output_payload_model = _O

    async def execute(self, inp: _I, ctx: ExecutionContext) -> _O:
        return _O()


async def test_log_contains_namespace_and_trace(
    caplog_structlog: list[dict],
) -> None:
    ctx = ExecutionContext.new()
    await _Cap().run({}, ctx)
    matching = [e for e in caplog_structlog if e.get("event") == "capability.run"]
    assert matching, "expected 'capability.run' event"
    rec = matching[0]
    assert rec["capability_ns"] == "investigate.test.observable"
    assert rec["trace_id"] == ctx.trace_id
    assert "duration_ms" in rec
    assert rec["partial"] is False
```

`tests/conftest.py` 追加 fixture：
```python
import structlog

@pytest.fixture
def caplog_structlog():
    captured: list[dict] = []

    def _capture(logger, method_name, event_dict):
        captured.append(dict(event_dict))
        return event_dict

    structlog.configure(processors=[_capture])
    yield captured
    structlog.reset_defaults()
```

- [ ] **Step 2: 运行测试**

Expected: fail.

- [ ] **Step 3: 实现**

`src/secmind_investigator/core/context.py`（覆盖）:
```python
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExecutionContext:
    datasources: dict[str, Any] = field(default_factory=dict)
    trace_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    caller_role: str | None = None

    @classmethod
    def empty(cls) -> "ExecutionContext":
        return cls()

    @classmethod
    def new(cls, **kwargs: Any) -> "ExecutionContext":
        return cls(**kwargs)
```

`src/secmind_investigator/observability/tracing.py`:
```python
from __future__ import annotations

import structlog

log = structlog.get_logger("secmind_investigator")
```

`src/secmind_investigator/observability/metrics.py`:
```python
from __future__ import annotations

from collections import defaultdict
from threading import Lock

# In-memory metrics for now; swap for OTel later.
_counters: dict[str, int] = defaultdict(int)
_lock = Lock()


def incr(name: str, value: int = 1) -> None:
    with _lock:
        _counters[name] += value


def snapshot() -> dict[str, int]:
    with _lock:
        return dict(_counters)
```

修改 `capability.py` 的 `run()`，加日志与指标：
```python
from secmind_investigator.observability import metrics
from secmind_investigator.observability.tracing import log

async def run(self, raw_input: dict[str, object], ctx: ExecutionContext) -> CapabilityResult:
    inp = self.input_model.model_validate(raw_input)
    metrics.incr(f"capability.run.total[{self.namespace}]")
    start = time.perf_counter()
    partial = False
    confidence = 1.0
    reasons: list[str] = []
    payload: dict[str, object] = {}
    try:
        out = await self.execute(inp, ctx)
        payload = out.model_dump(mode="json")
    except PartialResult as pr:
        payload = pr.payload.model_dump(mode="json")
        partial = True
        confidence = pr.confidence
        reasons = pr.reasons
    except DataSourceUnavailable as e:
        partial = True
        confidence = 0.0
        reasons = [str(e)]
    duration_ms = int((time.perf_counter() - start) * 1000)
    if partial:
        metrics.incr(f"capability.partial.total[{self.namespace}]")
    log.info(
        "capability.run",
        capability_ns=self.namespace,
        trace_id=ctx.trace_id,
        duration_ms=duration_ms,
        partial=partial,
        confidence=confidence,
    )
    return CapabilityResult(
        payload=payload,
        confidence=confidence,
        partial=partial,
        partial_reasons=reasons,
        duration_ms=duration_ms,
    )
```

- [ ] **Step 4: 运行测试**

Run: `pytest tests/unit -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/{core/context.py,core/capability.py,observability/} tests
git commit -m "feat(observability): structured tracing + in-memory metrics on capability.run"
```

---

### Task 7: DataSource 抽象基类

**Files:**
- Create: `src/secmind_investigator/datasources/base.py`
- Create: `src/secmind_investigator/datasources/mocks.py`
- Create: `tests/unit/datasources/test_base.py`

**Dependencies:** Task 4, Task 6

**Acceptance criteria:**
- `DataSource` ABC 强制实现 `id`, `healthcheck()`, `close()`
- 限速器装饰器 `@rate_limited(rps=...)` 可工作（hypothesis 验证）
- mock 基类 `InMemoryDataSource` 默认通过 healthcheck

- [ ] **Step 1: 写测试**

```python
# tests/unit/datasources/test_base.py
import pytest

from secmind_investigator.datasources.base import DataSource, rate_limited
from secmind_investigator.datasources.mocks import InMemoryDataSource


async def test_abstract_cannot_instantiate() -> None:
    with pytest.raises(TypeError):
        DataSource()  # type: ignore[abstract]


async def test_inmemory_healthcheck_ok() -> None:
    ds = InMemoryDataSource(id="DS-EDR")
    assert await ds.healthcheck() is True
    await ds.close()


async def test_rate_limit_blocks_excess(monkeypatch) -> None:
    counter = {"n": 0}

    @rate_limited(rps=10)
    async def f() -> int:
        counter["n"] += 1
        return counter["n"]

    import anyio

    async with anyio.create_task_group() as tg:
        for _ in range(5):
            tg.start_soon(f)
    assert counter["n"] == 5  # all completed eventually
```

- [ ] **Step 2: 运行测试**

Expected: fail.

- [ ] **Step 3: 实现**

```python
# src/secmind_investigator/datasources/base.py
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from functools import wraps
from threading import Lock
from typing import TypeVar

T = TypeVar("T")


class DataSource(ABC):
    """Abstract data source. One concrete subclass per DS-XXX vendor implementation."""

    id: str

    @abstractmethod
    async def healthcheck(self) -> bool: ...

    @abstractmethod
    async def close(self) -> None: ...


def rate_limited(rps: float) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """Simple token-bucket-ish rate limiter for one async callable."""
    interval = 1.0 / rps
    last = [0.0]
    lock = Lock()

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(fn)
        async def wrapper(*args: object, **kwargs: object) -> T:
            import anyio

            with lock:
                now = time.monotonic()
                wait = max(0.0, last[0] + interval - now)
                last[0] = max(now, last[0] + interval)
            if wait > 0:
                await anyio.sleep(wait)
            return await fn(*args, **kwargs)

        return wrapper

    return deco
```

```python
# src/secmind_investigator/datasources/mocks.py
from __future__ import annotations

from typing import Any

from secmind_investigator.datasources.base import DataSource


class InMemoryDataSource(DataSource):
    """Base for unit-test mocks; seeds in-memory data and answers queries."""

    def __init__(self, id: str, data: dict[str, Any] | None = None) -> None:
        self.id = id
        self.data = data or {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None
```

- [ ] **Step 4: 测试**

Run: `pytest tests/unit/datasources -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/datasources/{base,mocks}.py tests/unit/datasources/test_base.py
git commit -m "feat(datasources): DataSource ABC + rate_limited + InMemoryDataSource"
```

---

### Tasks 8–16: DataSource Adapters

每个 adapter 同一交付模板。下方先给 **Task 8 (DS-IDP)** 的完整 TDD 作为参考实现，其余 8 个 adapter 复用相同结构，只是查询方法签名与字段不同。

#### Task 8: DS-IDP adapter + mock

**Files:**
- Create: `src/secmind_investigator/datasources/idp.py`
- Modify: `src/secmind_investigator/datasources/mocks.py` — `MockIdpDataSource`
- Create: `tests/unit/datasources/test_idp.py`

**Dependencies:** Task 7

**Acceptance criteria:**
- 定义 4 个接口方法：`get_account(principal)`, `list_logins(principal, since, until)`, `list_groups(principal)`, `list_oauth_grants(principal)`
- Mock 实现支持种子化的字典数据
- 接口签名稳定（后续 A1/B1 都依赖此）

- [ ] **Step 1: 写测试**

```python
# tests/unit/datasources/test_idp.py
from datetime import UTC, datetime, timedelta

from secmind_investigator.datasources.mocks import MockIdpDataSource


async def test_get_account_present() -> None:
    ds = MockIdpDataSource(
        accounts={
            "alice@corp": {
                "upn": "alice@corp",
                "sid": "S-1-5",
                "groups": ["Engineering"],
                "mfa_enabled": True,
                "locked": False,
                "last_password_change": datetime(2026, 1, 1, tzinfo=UTC),
            }
        }
    )
    acct = await ds.get_account("alice@corp")
    assert acct is not None
    assert acct["mfa_enabled"] is True


async def test_get_account_missing_returns_none() -> None:
    ds = MockIdpDataSource(accounts={})
    assert await ds.get_account("bob@corp") is None


async def test_list_logins_window_filter() -> None:
    now = datetime(2026, 5, 24, 10, 0, tzinfo=UTC)
    ds = MockIdpDataSource(
        accounts={"a@c": {}},
        logins={
            "a@c": [
                {"ts": now - timedelta(hours=1), "result": "success", "src_ip": "1.1.1.1"},
                {"ts": now - timedelta(days=5), "result": "failure", "src_ip": "2.2.2.2"},
            ]
        },
    )
    events = await ds.list_logins("a@c", since=now - timedelta(hours=24), until=now)
    assert len(events) == 1
    assert events[0]["result"] == "success"
```

- [ ] **Step 2: 运行测试 → fail**

- [ ] **Step 3: 实现 abstract interface**

```python
# src/secmind_investigator/datasources/idp.py
from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.base import DataSource


class IdpDataSource(DataSource):
    """Abstract IdP. Concrete vendors: AD, Okta, Azure AD, ..."""

    id: str = "DS-IDP"

    @abstractmethod
    async def get_account(self, principal: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list_logins(
        self, principal: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def list_groups(self, principal: str) -> list[str]: ...

    @abstractmethod
    async def list_oauth_grants(self, principal: str) -> list[dict[str, Any]]: ...
```

`mocks.py` 追加：
```python
from datetime import datetime
from typing import Any

from secmind_investigator.datasources.idp import IdpDataSource


class MockIdpDataSource(IdpDataSource):
    def __init__(
        self,
        accounts: dict[str, dict[str, Any]] | None = None,
        logins: dict[str, list[dict[str, Any]]] | None = None,
        groups: dict[str, list[str]] | None = None,
        oauth: dict[str, list[dict[str, Any]]] | None = None,
    ) -> None:
        self.accounts = accounts or {}
        self.logins = logins or {}
        self.groups = groups or {}
        self.oauth = oauth or {}

    async def healthcheck(self) -> bool:
        return True

    async def close(self) -> None:
        return None

    async def get_account(self, principal: str) -> dict[str, Any] | None:
        return self.accounts.get(principal)

    async def list_logins(
        self, principal: str, since: datetime, until: datetime
    ) -> list[dict[str, Any]]:
        events = self.logins.get(principal, [])
        return [e for e in events if since <= e["ts"] <= until]

    async def list_groups(self, principal: str) -> list[str]:
        return self.groups.get(principal, [])

    async def list_oauth_grants(self, principal: str) -> list[dict[str, Any]]:
        return self.oauth.get(principal, [])
```

- [ ] **Step 4: 测试通过**

Run: `pytest tests/unit/datasources/test_idp.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/secmind_investigator/datasources/{idp.py,mocks.py} tests/unit/datasources/test_idp.py
git commit -m "feat(ds-idp): abstract IdpDataSource + MockIdpDataSource with logins/groups/oauth"
```

---

#### Tasks 9-16: 剩余 8 个 DataSource Adapters

**统一交付模板**（每个 Task 独立可交付）：

| Task | 抽象类文件 | 关键接口方法 |
|---|---|---|
| 9 (DS-HR) | `datasources/hr.py` | `get_employee(principal)`, `get_org_path(principal)`, `get_status(principal)`, `get_leaving_date(principal)` |
| 10 (DS-CMDB) | `datasources/cmdb.py` | `get_asset(asset_or_host_or_ip)`, `assets_owned_by(principal)`, `get_business_context(asset_id)` |
| 11 (DS-EDR) | `datasources/edr.py` | `get_host(host_id)`, `list_processes(host, window)`, `get_process_tree(guid)`, `list_network_conns(host, window)`, `list_file_ops(host, window)`, `search_hash(hash)` |
| 12 (DS-SIEM) | `datasources/siem.py` | `search(query, window, limit)`（自由文本/字段查询）、`pivot(field, value, window)` |
| 13 (DS-EMAIL) | `datasources/email.py` | `get_message(message_id)`, `list_sent(mailbox, window)`, `list_received(mailbox, window)`, `get_forwarding_rules(mailbox)` |
| 14 (DS-FW) | `datasources/fw.py` | `list_flows(filter, window)`（filter = src/dst/port/proto） |
| 15 (DS-TI) | `datasources/ti.py` | `lookup_ip(ip)`, `lookup_domain(domain)`, `lookup_url(url)`, `lookup_hash(hash)` |
| 16 (DS-KB) | `datasources/kb.py` | `search_similar_alerts(fingerprint, k)`, `get_alert(id)`, `count_prior(entity_kind, entity_id, window)` |

**每个 Task 都要完成的 5 步**（与 Task 8 相同模式）：

- [ ] Step 1: 在 `tests/unit/datasources/test_<dsname>.py` 写至少 3 个测试（happy path / empty / window-filter）
- [ ] Step 2: 运行测试，确认失败
- [ ] Step 3: 在 `datasources/<dsname>.py` 定义 ABC，在 `mocks.py` 追加 `Mock<DsName>DataSource`
- [ ] Step 4: 运行 `pytest tests/unit/datasources -v`，全部通过
- [ ] Step 5: Commit，message `feat(ds-<name>): abstract + mock with <methods>`

**对每个 DataSource 的具体方法签名详见 spec 文档 §1 与各对应 capability 卡片的"去哪里查"表格。**

**验收（每个）**：mock 能种子化测试用例所需数据；abstract class 不允许部分实现的子类通过 mypy。

---

### Task 17: A1 用户/账户画像 `investigate.entity.user.profile`

**Files:**
- Create: `src/secmind_investigator/capabilities/entity/user_profile.py`
- Create: `tests/unit/capabilities/entity/test_user_profile.py`

**Dependencies:** Tasks 8 (DS-IDP), 9 (DS-HR), 10 (DS-CMDB), 13 (DS-EMAIL), 16 (DS-KB)

**Data sources used (required → optional):** DS-HR● DS-IDP● DS-EMAIL● DS-KB● DS-CMDB○ DS-PAM○

**Input schema:**
```python
class UserProfileInput(BaseModel):
    principal: str  # username / email / sid
    time_window_days: int = 30
```

**Output payload (key fields):**
```python
class UserProfilePayload(BaseModel):
    identity: dict   # display_name, employee_id, department, manager, hire_date, status, leaving_date
    auth: dict       # upn, sid, groups, mfa_enabled, last_password_change, locked
    privilege: dict  # is_privileged, roles, pam_assignments
    assets: list[dict]
    email: dict      # primary, aliases, forwarding_rules
    risk_tags: list[str]
    prior_alerts_30d: int
```

**Acceptance criteria:**
- 给定 mock 种子（员工 + 账户 + 邮箱转发规则）→ 输出对应字段
- 离职倒计时 ≤30d 自动加 `risk_tag = "leaver_30d"`
- 特权账户无 MFA 加 `risk_tag = "priv_no_mfa"`
- 邮箱有外发转发规则加 `risk_tag = "external_forwarding"`
- DS-HR 不可达 → `partial=True, partial_reasons=["DS-HR: ..."]`，其他字段尽量补齐
- 输出标注 `PIIMarker` 于 `identity.display_name`, `email.primary`

**Tests to write (full code):**

```python
# tests/unit/capabilities/entity/test_user_profile.py
from datetime import UTC, datetime, timedelta

import pytest

from secmind_investigator.capabilities.entity.user_profile import UserProfileCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.datasources.mocks import (
    MockCmdbDataSource,
    MockEmailDataSource,
    MockHrDataSource,
    MockIdpDataSource,
    MockKbDataSource,
)


def _ctx(**overrides):
    ds = {
        "DS-HR": MockHrDataSource(),
        "DS-IDP": MockIdpDataSource(),
        "DS-CMDB": MockCmdbDataSource(),
        "DS-EMAIL": MockEmailDataSource(),
        "DS-KB": MockKbDataSource(),
    }
    ds.update(overrides)
    return ExecutionContext(datasources=ds)


async def test_happy_path() -> None:
    hr = MockHrDataSource(
        employees={"alice@corp": {
            "display_name": "Alice",
            "employee_id": "E001",
            "department": "Eng",
            "status": "active",
            "leaving_date": None,
        }}
    )
    idp = MockIdpDataSource(
        accounts={"alice@corp": {"upn": "alice@corp", "mfa_enabled": True, "locked": False}}
    )
    email = MockEmailDataSource(
        mailboxes={"alice@corp": {"aliases": [], "forwarding_rules": []}}
    )
    cap = UserProfileCapability()
    res = await cap.run(
        {"principal": "alice@corp"},
        _ctx({"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert res.partial is False
    assert res.payload["identity"]["display_name"] == "Alice"
    assert res.payload["auth"]["mfa_enabled"] is True
    assert "leaver_30d" not in res.payload["risk_tags"]


async def test_leaver_tag_when_within_30d() -> None:
    leaving = datetime.now(UTC) + timedelta(days=15)
    hr = MockHrDataSource(
        employees={"bob@corp": {
            "display_name": "Bob", "employee_id": "E2",
            "department": "Fin", "status": "active", "leaving_date": leaving,
        }}
    )
    idp = MockIdpDataSource(accounts={"bob@corp": {"upn": "bob@corp", "mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"bob@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "bob@corp"},
        _ctx({"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert "leaver_30d" in res.payload["risk_tags"]


async def test_external_forwarding_tag() -> None:
    hr = MockHrDataSource(employees={"c@corp": {"display_name": "C", "status": "active"}})
    idp = MockIdpDataSource(accounts={"c@corp": {"upn": "c@corp", "mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={
        "c@corp": {
            "aliases": [],
            "forwarding_rules": [{"target": "attacker@evil.com", "external": True}],
        }
    })
    res = await UserProfileCapability().run(
        {"principal": "c@corp"},
        _ctx({"DS-HR": hr, "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert "external_forwarding" in res.payload["risk_tags"]


async def test_hr_unavailable_returns_partial() -> None:
    class _DownHr(MockHrDataSource):
        async def get_employee(self, principal):  # type: ignore[override]
            from secmind_investigator.core.errors import DataSourceUnavailable
            raise DataSourceUnavailable("DS-HR", "timeout")

    idp = MockIdpDataSource(accounts={"d@corp": {"upn": "d@corp", "mfa_enabled": True}})
    email = MockEmailDataSource(mailboxes={"d@corp": {"aliases": [], "forwarding_rules": []}})
    res = await UserProfileCapability().run(
        {"principal": "d@corp"},
        _ctx({"DS-HR": _DownHr(), "DS-IDP": idp, "DS-EMAIL": email}),
    )
    assert res.partial is True
    assert any("DS-HR" in r for r in res.partial_reasons)
```

**Implementation outline:**

```python
# src/secmind_investigator/capabilities/entity/user_profile.py
from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel, Field

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import DataSourceUnavailable, PartialResult


class UserProfileInput(BaseModel):
    principal: str
    time_window_days: int = 30


class UserProfilePayload(BaseModel):
    identity: dict[str, Any] = Field(default_factory=dict)
    auth: dict[str, Any] = Field(default_factory=dict)
    privilege: dict[str, Any] = Field(default_factory=dict)
    assets: list[dict[str, Any]] = Field(default_factory=list)
    email: dict[str, Any] = Field(default_factory=dict)
    risk_tags: list[str] = Field(default_factory=list)
    prior_alerts_30d: int = 0


class UserProfileCapability(AtomicCapability[UserProfileInput, UserProfilePayload]):
    namespace = "investigate.entity.user.profile"
    input_model = UserProfileInput
    output_payload_model = UserProfilePayload

    async def execute(
        self, inp: UserProfileInput, ctx: ExecutionContext
    ) -> UserProfilePayload:
        hr = ctx.datasources.get("DS-HR")
        idp = ctx.datasources.get("DS-IDP")
        email = ctx.datasources.get("DS-EMAIL")
        kb = ctx.datasources.get("DS-KB")
        cmdb = ctx.datasources.get("DS-CMDB")

        async def _safe(coro, source):
            try:
                return await coro, None
            except DataSourceUnavailable as e:
                return None, str(e)

        results = await asyncio.gather(
            _safe(hr.get_employee(inp.principal), "DS-HR") if hr else (None, "DS-HR: not configured"),
            _safe(idp.get_account(inp.principal), "DS-IDP") if idp else (None, "DS-IDP: not configured"),
            _safe(email.get_mailbox(inp.principal), "DS-EMAIL") if email else (None, "DS-EMAIL: not configured"),
            _safe(kb.count_prior("user", inp.principal, timedelta(days=30)), "DS-KB") if kb else (0, None),
            _safe(cmdb.assets_owned_by(inp.principal), "DS-CMDB") if cmdb else ([], None),
        )

        (hr_emp, hr_err), (acct, idp_err), (mbx, em_err), (priors, kb_err), (assets, _) = results

        reasons = [r for r in (hr_err, idp_err, em_err, kb_err) if r]

        risk_tags: list[str] = []
        identity = {}
        if hr_emp:
            identity = {
                "display_name": hr_emp.get("display_name"),
                "employee_id": hr_emp.get("employee_id"),
                "department": hr_emp.get("department"),
                "status": hr_emp.get("status"),
                "leaving_date": hr_emp.get("leaving_date"),
            }
            ld = hr_emp.get("leaving_date")
            if ld and ld - datetime.now(UTC) <= timedelta(days=30):
                risk_tags.append("leaver_30d")

        auth = acct or {}
        if auth.get("is_privileged") and not auth.get("mfa_enabled"):
            risk_tags.append("priv_no_mfa")

        email_info: dict[str, Any] = mbx or {"aliases": [], "forwarding_rules": []}
        if any(r.get("external") for r in email_info.get("forwarding_rules", [])):
            risk_tags.append("external_forwarding")

        payload = UserProfilePayload(
            identity=identity,
            auth=auth,
            privilege={"is_privileged": auth.get("is_privileged", False)},
            assets=assets or [],
            email=email_info,
            risk_tags=risk_tags,
            prior_alerts_30d=priors or 0,
        )

        if reasons:
            raise PartialResult(payload=payload, reasons=reasons, confidence=0.5)
        return payload
```

**Commit:**
```bash
git add src/secmind_investigator/capabilities/entity/user_profile.py tests/unit/capabilities/entity/test_user_profile.py
git commit -m "feat(cap): A1 user profile aggregates HR/IDP/Email/KB with risk tags"
```

---

### Tasks 18-41: 剩余 P0 原子能力

每个 Task 使用**统一交付模板**（Task 17 是该模板的 fully-detailed 范例）。每个 Task 必须独立完成以下 5 步：

1. 写 `tests/unit/capabilities/<category>/test_<name>.py`，至少 4 个测试：
   - happy path（mock 全配，输出关键字段对）
   - 关键风险标签触发（每个 risk_tag 一个测试）
   - 数据源缺失 → partial=True
   - 输入边界（如时间窗 = 0、非法 principal 等）
2. 运行测试确认失败。
3. 实现 `src/secmind_investigator/capabilities/<category>/<name>.py`，遵循 Task 17 的结构：
   - 定义 `<Name>Input` / `<Name>Payload`
   - 子类化 `AtomicCapability`
   - `execute()` 内 `asyncio.gather` 并行查询数据源，`_safe` 包裹每个调用以收集 `partial_reasons`
   - 所有 reason 非空时 `raise PartialResult(...)`
4. 运行测试通过 + `pytest --cov` 覆盖率该文件 ≥ 85%。
5. Commit `feat(cap): <ID> <name>`.

下方为每个 Task 的**核心契约**（必读，决定输入/输出与依赖）：

#### Task 18: A2 主机/终端画像 `investigate.entity.host.profile`
- **DS**: DS-CMDB● DS-EDR● DS-VULN○ DS-AV○ DS-KB○
- **Input**: `host: str (hostname|agent_id|asset_id|MAC|IP)`, `time_window_days=7`
- **Output keys**: `asset{id,owner,business_unit,criticality,location,lifecycle}`, `system{os,kernel,agent_version,last_seen,current_user,current_ip}`, `security_posture{vuln_count,critical_cves,av_status,edr_health}`, `change_context{active_ticket,in_maintenance_window}`, `prior_alerts_30d`
- **Risk tags**: `critical_unpatched_cve`, `edr_offline_24h`, `agent_outdated`
- **Acceptance**: 主机不存在于 CMDB → `partial=True, partial_reasons=["DS-CMDB: host not found"]`。

#### Task 19: A4 IP 地址画像 `investigate.entity.ip.profile`
- **DS**: DS-IPAM● DS-CMDB○ DS-VPN○ DS-FW● DS-NDR○ DS-DNS○ DS-TI● DS-WHOIS○ DS-KB○
- **Input**: `ip: str`, `time_window_hours=24`
- **Output keys**: `classification`(internal/external/vpn/...), `internal_resolution{host,mac,owner,env}|null`, `reputation{score,verdict,sources,tags}`, `asn{number,org,country}`, `activity_summary{conn_count,top_peers,first_seen,last_seen}`, `related_entities{users,hosts,domains}`
- **Logic**: 私网段判定优先 → DHCP/VPN/NAT 还原 → 外部 TI/WHOIS 并行 → 流量聚合。
- **Acceptance**: 内网 IP 必须能还原到 host；外部 IP 至少返回 reputation + asn。

#### Task 20: A5 域名画像 `investigate.entity.domain.profile`
- **DS**: DS-WHOIS● DS-TI● DS-DNS○ DS-PROXY○ DS-EMAIL○
- **Input**: `domain: str`, `time_window_days=30`
- **Output keys**: `whois{registrar,created,age_days,registrant,privacy}`, `reputation{verdict,categories,tags}`, `dns_history`, `cert_history`, `internal_exposure{queried_by_hosts,visited_by_users,received_emails}`, `lookalike{brand,similarity_score,technique}`
- **Risk tags**: `young_domain_<30d`, `dga_indicator`, `brand_lookalike`
- **依赖**: P1 的 `brand_lookalike` 算法可先用 Levenshtein 简化实现。

#### Task 21: A7 文件/哈希画像 `investigate.entity.file.profile`
- **DS**: DS-TI● DS-EDR● DS-SANDBOX○(P1) DS-EMAIL○ DS-AV○ DS-KB○
- **Input**: `hash: str | None`, `file_path: str | None`, `host: str | None`（任一组合）
- **Output keys**: `hashes{md5,sha1,sha256}`, `static{type,size,signature,sections,imports}`, `reputation{verdict,family,sources}`, `internal_spread{hosts,first_seen,last_seen}`, `yara_hits`, `av_hits`
- **Acceptance**: 未提供 hash 但提供 path+host → 必须先调 DS-EDR 取 hash 再后续。

#### Task 22: B1 登录活动 `investigate.activity.login`
- **DS**: DS-IDP● DS-VPN○ DS-CLOUD(P1)○ DS-PAM(P1)○
- **Input**: `principal: str | None`, `source_ip: str | None`, `host: str | None`, `time_window_hours=24`
- **Output keys**: `events[]`, `summary{success,failure,distinct_src_ips,distinct_geos,mfa_pass_rate}`, `anomalies[]`
- **Anomaly detectors (P0 minimum)**: `brute_force_pattern` (N 次失败 + 1 次成功)、`impossible_travel`(距离/时差>飞行速度上限)、`new_geo`、`new_device`
- **Acceptance**: 暴破 pattern 必须能识别（N>=5 失败紧跟 1 成功视为命中）。

#### Task 23: B3 进程执行 `investigate.activity.process.execution`
- **DS**: DS-EDR● DS-TI○
- **Input**: `host: str`, `time_window_minutes=10`, OR `process_guid: str`
- **Output**: `tree[]`（每节点：pid, ppid, name, cmdline, image_path, hash, user, integrity, suspicion_score, reasons, mitre_ttps）+ `iocs[]`
- **Suspicion 规则 (P0)**: 可疑路径执行、签名缺失、base64 cmdline、LOLBin 调用链、空进程、注入指标
- **Acceptance**: 在 `powershell.exe -enc <base64>` 用例上 suspicion_score ≥ 70 且 `mitre_ttps` 含 `T1059.001`。

#### Task 24: B4 网络连接 `investigate.activity.network.connection`
- **DS**: DS-EDR● DS-FW● DS-NDR○ DS-PROXY○
- **Input**: `host: str | None`, `process_guid: str | None`, `src_dst_filter: dict | None`, `time_window_minutes=60`
- **Output**: `connections[]`, `top_destinations[]`, `external_summary{unique_external_ips,unique_external_domains}`, `anomalies[]`
- **Anomaly (P0)**: `beacon_detected` (周期性 ±10% jitter)、`new_external_peer`(过去 30d 未见)、`port_proto_mismatch`
- **Acceptance**: 给定固定间隔 60s±5s 共 20 个连接 → `beacon_detected=true`。

#### Task 25: B8 邮件收发 `investigate.activity.email`
- **DS**: DS-EMAIL● DS-TI○
- **Input**: `mailbox: str | None`, `message_id: str | None`, `time_window_days=7`
- **Output**: `messages[]`, `forwarding_rules_changes[]`, `mass_send_indicator`, `phishing_signals{lookalike_sender,suspicious_link,urgency_keywords}`
- **Acceptance**: 含已知钓鱼模板的 mock 邮件 → 返回非空 phishing_signals。

#### Task 26: C1 时间窗共现 `investigate.relation.timeline.cooccurrence`
- **DS**: DS-SIEM● DS-EDR○ DS-NDR○ DS-KB○
- **Input**: `anchor: dict{ts,entity_kind,entity_id}`, `window_seconds=600`, `pivot_keys=["host","user","ip"]`
- **Output**: `related_events[]`（已按时间排序），`grouped_by_pivot{<key>: [...]}`
- **Acceptance**: mock SIEM 种子化 5 个事件 → window 内的 3 个事件被返回，按 ts 升序。

#### Task 27: C2 实体关系图 `investigate.relation.entity_graph`
- **DS**: DS-IDP● DS-CMDB● DS-EDR● DS-IPAM○ DS-DNS○ DS-EMAIL○
- **Input**: `seed: {kind,id}`, `depth=2`, `edge_types=["owner","logon","conn","query"]`
- **Output**: `nodes[]`, `edges[]`（each: from, to, type, evidence_refs）
- **Acceptance**: depth=2 时节点数 ≤ 50（防爆炸）；返回有 evidence_refs。

#### Task 28: C3 父子进程链 `investigate.relation.process_lineage`
- **DS**: DS-EDR●
- **Input**: `process_guid: str`
- **Output**: `lineage_tree`（含 root 到 leaf 全链）
- **Acceptance**: 给定 4 层链 mock → 完整还原；进程已不存在 → partial。

#### Task 29: D1 资产业务上下文 `investigate.context.asset_business`
- **DS**: DS-CMDB● DS-TICKET○
- **Input**: `asset_id: str`
- **Output**: `{business_unit,criticality,sla,dependencies,in_maintenance}`
- **Acceptance**: maintenance window 内的资产返回 `in_maintenance=true`。

#### Task 30: D2 用户身份上下文 `investigate.context.user_identity`
- **DS**: DS-HR● DS-IDP●
- **Input**: `principal: str`
- **Output**: `{status, leaving_in_days, role_class, vip, watchlist}`
- **Acceptance**: 离职日 = today+15 → `leaving_in_days=15` 且自动加 `watchlist=["leaver_30d"]`。

#### Task 31: D5 自身历史基线 `investigate.context.baseline.self`
- **DS**: DS-IDP● DS-EDR○ DS-SIEM● DS-NDR○
- **Input**: `entity: {kind,id}`, `dimensions=["hour_of_day","geo","device","peers","process_set"]`, `lookback_days=30`
- **Output**: 每维度一份直方图/集合 + 当前事件偏离度（z-score 或 percentile）
- **Acceptance**: 当前事件命中已知模式 → deviation < 1.0；首次出现的维度 → deviation > 3.0。

#### Task 32: E1 IP 信誉 `investigate.intel.ip.reputation`
- **DS**: DS-TI●
- **Input**: `ip: str`
- **Output**: `{verdict, score, sources[{name,verdict,tags,last_seen}], asn_reputation, geo_reputation}`
- **Acceptance**: 多源 verdict 不一致时返回 all sources；TI 不可达 → partial 但仍返回 `verdict="unknown"`。

#### Task 33: E2 域名/URL 信誉 `investigate.intel.domain_url.reputation`
- **DS**: DS-TI●
- **Input**: `target: str` (domain 或 URL), `kind: "domain" | "url"`
- **Output**: `{verdict, categories, age_days, first_seen}`
- **Acceptance**: 新注册（age<30d）+ 不在白名单 → `verdict ≥ suspicious`。

#### Task 34: E3 文件 Hash 信誉 `investigate.intel.hash.reputation`
- **DS**: DS-TI●
- **Input**: `hash: str` (auto-detect MD5/SHA1/SHA256)
- **Output**: `{verdict, family, av_detection_ratio, first_submission, similar_samples}`

#### Task 35: E7 TTP → MITRE 映射 `investigate.intel.ttp.mitre`
- **DS**: 本地 ATT&CK 知识库（打包 JSON）+ DS-KB○
- **Input**: `evidence_set: list[dict]`（每项：kind, content，如 cmdline / behavior）
- **Output**: `ttps[{id,name,tactic,confidence,evidence_ref}]`
- **Acceptance**: cmdline 含 `whoami /priv` → 返回 T1033；含 `vssadmin delete shadows` → 返回 T1490。
- **Implementation note**: P0 用规则映射（dict lookup）；P1 升级为 LLM/分类器。

#### Task 36: F1 TP/FP 判定 `investigate.verdict.tp_fp`
- **DS**: 无（聚合其他 capability 结果）
- **Input**: `evidence_set: list[CapabilityResult]`, `policy: dict | None`
- **Output**: `{verdict: TP|FP|BP|INC, confidence, key_reasons[], counter_evidence[], remaining_uncertainties[]}`
- **Logic (P0)**: 加权评分 + 阈值规则；高 confidence reputation hit + 罕见行为 → TP；维护窗内 + 已知工具 → BP；证据不足 → INC。
- **Acceptance**: 4 个固定场景的金标用例（TP/FP/BP/INC 各一）输出对应 verdict。

#### Task 37: F2 严重性/影响评估 `investigate.verdict.impact`
- **DS**: 无（聚合 D1/D2 + 受影响实体）
- **Input**: `verdict_payload, asset_ctx, user_ctx, affected_entities`
- **Output**: `{severity: P0-P4, impact{c,i,a}, blast_radius{hosts,users,data}}`
- **Logic**: 重要性等级 × 扩散半径 × Kill-chain 阶段 → 严重性矩阵。

#### Task 38: F4 IOC 提取与标准化 `investigate.verdict.ioc_extract`
- **DS**: 无
- **Input**: `evidence_set: list[CapabilityResult]`
- **Output**: `iocs: [{type: ip|domain|hash|url|email|mutex|cert, value, confidence, ttl_hours}]`，符合 STIX 2.1 子集
- **Acceptance**: 输入含 IP + 域名 + Hash 的复合 payload → 提取 ≥3 个 IOC，去重。

#### Task 39: F8 处置建议 `investigate.verdict.response_recommendation`
- **DS**: 企业策略库（本地 YAML）
- **Input**: `verdict, impact, affected_entities`
- **Output**: 分级清单
  - `containment[]`（isolate_host, disable_account, reset_password, revoke_token, block_ip, quarantine_file）
  - `eradication[]`
  - `recovery[]`
  - `evidence_preservation[]`
- 每项含：`target_entity, command_preview, estimated_business_impact, risk, requires_approval`
- **Acceptance**: TP + 关键资产 → 建议 `isolate_host` 且 `requires_approval=true`。

#### Task 40: G3 不确定性与下一步 `investigate.meta.next_step`
- **DS**: 通过 `CapabilityRegistry` 枚举可用能力
- **Input**: `current_state: {evidence_set, hypotheses}`
- **Output**: `{uncertainty: high|med|low, top_missing_evidence[], recommended_next_atomic_calls: [{namespace, expected_input, cost, value}]}`
- **Acceptance**: 给定缺失"用户身份上下文"的状态 → 推荐 `investigate.context.user_identity` 且 cost/value 合理。

#### Task 41: G4 历史相似告警回查 `investigate.meta.kb_lookup`
- **DS**: DS-KB●
- **Input**: `fingerprint: dict`（关键字段：alert_type, primary_iocs, ttps）
- **Output**: `[{past_alert_id, similarity, past_verdict, past_response}]`
- **Acceptance**: 种子化 5 条历史告警 + 1 条与当前 80% 相似 → top-1 命中。

---

### Task 42: 钓鱼场景端到端集成测试

**Files:**
- Create: `tests/integration/test_phishing_orchestration.py`
- Create: `tests/fixtures/phishing_scenario.json`

**Dependencies:** Tasks 17, 22, 25, 33, 36, 38, 39

**Acceptance criteria:**
- 模拟 spec §4.1 完整钓鱼调度链路，跨 ≥6 个原子能力
- 最终输出含 `verdict=TP`, ≥3 个 IOC, 至少一个 `containment` 建议
- 所有数据源用 mock，不需要外部依赖
- 单测运行 < 2 秒

- [ ] **Step 1: 准备 fixture**

`tests/fixtures/phishing_scenario.json`（关键种子数据）:
```json
{
  "victim_user": "alice@corp",
  "alert": {
    "type": "email.suspicious_link",
    "message_id": "msg-001",
    "ts": "2026-05-24T10:00:00Z"
  },
  "phishing_email": {
    "message_id": "msg-001",
    "sender": "ceo@c0rp.com",
    "recipients": ["alice@corp"],
    "subject": "Urgent: wire transfer",
    "links": ["https://c0rp-login.com/login"],
    "auth_results": {"spf": "fail", "dkim": "fail", "dmarc": "fail"}
  },
  "ti_data": {
    "https://c0rp-login.com/login": {"verdict": "malicious", "categories": ["phishing"]}
  },
  "hr_data": {
    "alice@corp": {"display_name": "Alice", "status": "active"}
  }
}
```

- [ ] **Step 2: 写集成测试**

```python
# tests/integration/test_phishing_orchestration.py
import json
from pathlib import Path

from secmind_investigator.capabilities.activity.email import EmailActivityCapability
from secmind_investigator.capabilities.entity.user_profile import UserProfileCapability
from secmind_investigator.capabilities.intel.domain_url_reputation import (
    DomainUrlReputationCapability,
)
from secmind_investigator.capabilities.verdict.ioc_extract import IocExtractCapability
from secmind_investigator.capabilities.verdict.response_recommendation import (
    ResponseRecommendationCapability,
)
from secmind_investigator.capabilities.verdict.tp_fp import TpFpCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.datasources.mocks import (
    MockEmailDataSource,
    MockHrDataSource,
    MockIdpDataSource,
    MockTiDataSource,
    MockKbDataSource,
)


async def test_phishing_end_to_end() -> None:
    scenario = json.loads(Path("tests/fixtures/phishing_scenario.json").read_text())

    ctx = ExecutionContext(datasources={
        "DS-HR": MockHrDataSource(employees=scenario["hr_data"]),
        "DS-IDP": MockIdpDataSource(accounts={u: {"upn": u, "mfa_enabled": True} for u in scenario["hr_data"]}),
        "DS-EMAIL": MockEmailDataSource(
            messages={scenario["phishing_email"]["message_id"]: scenario["phishing_email"]},
            mailboxes={"alice@corp": {"aliases": [], "forwarding_rules": []}},
        ),
        "DS-TI": MockTiDataSource(url_lookups=scenario["ti_data"]),
        "DS-KB": MockKbDataSource(),
    })

    # 1. user profile
    user_res = await UserProfileCapability().run({"principal": scenario["victim_user"]}, ctx)
    # 2. email activity (resolve full message)
    email_res = await EmailActivityCapability().run(
        {"message_id": scenario["alert"]["message_id"]}, ctx
    )
    # 3. URL reputation
    url_res = await DomainUrlReputationCapability().run(
        {"target": scenario["phishing_email"]["links"][0], "kind": "url"}, ctx
    )
    # 4. TP/FP verdict
    verdict_res = await TpFpCapability().run(
        {"evidence_set": [user_res.model_dump(), email_res.model_dump(), url_res.model_dump()]},
        ctx,
    )
    assert verdict_res.payload["verdict"] == "TP"

    # 5. IOC extract
    ioc_res = await IocExtractCapability().run(
        {"evidence_set": [user_res.model_dump(), email_res.model_dump(), url_res.model_dump()]},
        ctx,
    )
    assert len(ioc_res.payload["iocs"]) >= 3

    # 6. Response recommendation
    resp_res = await ResponseRecommendationCapability().run(
        {
            "verdict": verdict_res.payload,
            "impact": {"severity": "P2"},
            "affected_entities": {"users": [scenario["victim_user"]], "hosts": []},
        },
        ctx,
    )
    actions = resp_res.payload["containment"]
    assert any(a["target_entity"] == scenario["victim_user"] for a in actions)
```

- [ ] **Step 3: 运行测试**

Run: `pytest tests/integration -v`
Expected: PASS。失败时往回检查所涉及的 capability 是否产出契约一致。

- [ ] **Step 4: 提交**

```bash
git add tests/integration tests/fixtures/phishing_scenario.json
git commit -m "test(integration): phishing alert end-to-end orchestration across 6 capabilities"
```

---

### Task 43: README / Dev Docs / Quick Start

**Files:**
- Create: `Secmind/secmind-investigator/README.md`
- Create: `Secmind/secmind-investigator/docs/architecture.md`
- Create: `Secmind/secmind-investigator/docs/adding-a-capability.md`
- Create: `Secmind/secmind-investigator/docs/adding-a-datasource.md`

**Acceptance criteria:**
- README 含 quick start: install / run sample / 找命名空间
- architecture.md 用一张图（mermaid）展示 core / datasource / capability 关系
- "adding a capability" 是 step-by-step（参考 Task 17）
- "adding a datasource" 是 step-by-step（参考 Task 8）

- [ ] **Step 1: 写 README.md（最小可执行）**

```markdown
# secmind-investigator

Atomic security investigation capabilities for Secmind. Pluggable LLM-orchestratable building blocks.

## Quick start
\`\`\`bash
make install
make test          # all unit + integration tests
\`\`\`

## Use a capability programmatically
\`\`\`python
from secmind_investigator.capabilities.entity.user_profile import UserProfileCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.datasources.mocks import MockHrDataSource, MockIdpDataSource

ctx = ExecutionContext(datasources={
    "DS-HR": MockHrDataSource(...),
    "DS-IDP": MockIdpDataSource(...),
})
result = await UserProfileCapability().run({"principal": "alice@corp"}, ctx)
print(result.payload)
\`\`\`

## Architecture
See [docs/architecture.md](docs/architecture.md).

## Adding a new capability
See [docs/adding-a-capability.md](docs/adding-a-capability.md).

## Adding a new data source
See [docs/adding-a-datasource.md](docs/adding-a-datasource.md).
```

- [ ] **Step 2: 写 architecture.md**

```markdown
# Architecture

\`\`\`mermaid
flowchart LR
  Agent[LLM Agent] -->|invoke namespace| Registry
  Registry -->|lookup| Cap[AtomicCapability]
  Cap -->|query| DSAbs[DataSource ABC]
  DSAbs --> DSImpl1[Vendor: Splunk]
  DSAbs --> DSImpl2[Vendor: CrowdStrike]
  Cap -->|CapabilityResult| Agent
  Cap --> Trace[Observability]
\`\`\`

- Capabilities are **single-purpose**.
- Agents orchestrate by chaining capabilities; capabilities never call each other (except via declared deps).
- DataSources are abstract; vendor implementations swap in via DI.
```

- [ ] **Step 3: 写 adding-a-capability.md（指向 Task 17 模板）**

略，照搬 Task 17 的 5 步骤模板，把"A1 user profile"换成占位。

- [ ] **Step 4: 写 adding-a-datasource.md（指向 Task 8 模板）**

略，照搬 Task 8 的 5 步骤模板。

- [ ] **Step 5: Commit**

```bash
git add Secmind/secmind-investigator/{README.md,docs/}
git commit -m "docs: README + architecture + adding-capability/datasource guides"
```

---

## P0 验收门禁（所有 P0 task 完成后）

执行以下命令，**全部通过**才算 P0 ship：

```bash
cd Secmind/secmind-investigator
make lint               # ruff + mypy --strict
make test               # 单测 + 集成测试
pytest --cov=secmind_investigator --cov-fail-under=85
python -c "from secmind_investigator.core.registry import default_registry; \
  assert len(default_registry.list_namespaces(prefix='investigate.')) >= 25"
```

---

## P1 Roadmap (Milestone-level)

> 启动 P1 前必须重新跑 `writing-plans` 把以下每个能力展开到 step-level task。

### P1 新增数据源
| DS | 新增任务量估计 | 关键方法 |
|---|---|---|
| DS-NDR | 1d | `list_flows`, `list_sessions`, `get_ja3_indicators` |
| DS-CLOUD | 2d | `list_audit_events(account, region, window)`, `lookup_resource(arn)` |
| DS-DLP | 1d | `list_events(user, window)` |
| DS-CASB | 1d | `list_saas_activity` |
| DS-DAM | 1d | `list_sql(account, window)` |
| DS-PAM | 1d | `list_priv_sessions` |
| DS-VULN | 1d | `host_cves`, `is_in_kev`, `epss_for` |
| DS-SANDBOX | 2d | `detonate(file_or_url)` async + polling |
| DS-WHOIS | 1d | `whois`, `passive_dns`, `cert_history` |

### P1 新增 Capability
| ID | 名称 | 主依赖 DS | 验收摘要 |
|---|---|---|---|
| A3 | server profile | DS-CMDB/DS-VULN | 暴露面 + WAF 拦截趋势 |
| A8 | process profile (deep) | DS-EDR | 注入/反射加载检测 |
| A11 | cloud resource profile | DS-CLOUD | IAM 暴露 + 公网 ACL |
| A12 | service account profile | DS-IDP/DS-CLOUD/DS-CODE | 长期密钥 + 代码泄露 |
| B2 | permission change | DS-IDP/DS-CLOUD/DS-PAM | unauthorized vs authorized |
| B5 | DNS activity | DS-DNS | DGA / 隧道检测 |
| B6 | file op | DS-EDR/DS-FILE/DS-CLOUD | 勒索 mass-encrypt 检测 |
| B9 | cloud API | DS-CLOUD | 敏感 API + role chain |
| B10 | data access | DS-DAM/DS-DLP/DS-CASB | 异常大量下载 |
| B15 | persistence | DS-EDR + Linux/macOS audit | T1547 系列命中 |
| B16 | credential access | DS-EDR/DS-IDP | LSASS / Kerberoasting |
| B17 | defense evasion | DS-EDR/DS-AV | 日志清除 / AV 关闭 |
| C4 | kill-chain stage | Local ATT&CK | Tactic 推断 |
| C5 | lateral movement | DS-IDP/DS-EDR/DS-NDR | 路径还原 |
| C6 | fanout/fanin | DS-SIEM | 单一源辐射检测 |
| C9 | victim expansion | DS-EDR/DS-NDR/DS-EMAIL/DS-IDP | 同 IOC 全量横扫 |
| D3 | vulnerability ctx | DS-VULN/DS-TI | KEV 命中标注 |
| D7 | rarity global | DS-SIEM | 90d 全公司出现次数 |
| D9 | geo baseline | DS-IDP | impossible_travel |
| E5 | sandbox detonate | DS-SANDBOX | 报告聚合 |
| E6 | YARA/Sigma | Local rules | 规则命中 |
| E8 | CVE intel | DS-TI/NVD/KEV/EPSS | 在野利用标注 |
| F3 | kill-chain reconstruction | (聚合) | 完整阶段图 |
| F6 | timeline reconstruction | (聚合) | 秒级排序 |
| F7 | affected entities | (聚合) | 多类实体清单 |
| F9 | root cause | (聚合) | 初始入口推断 |
| G1 | hypothesis generate | Registry | 多假设 + 优先级 |
| G2 | counter evidence | Registry | 反证主假设 |

### P1 验收
- 6 个完整告警编排示例（钓鱼/勒索/数据外传/挖矿/暴破/横向移动）端到端跑通，每个一个集成测试。
- 覆盖率 ≥ 85% （新增代码）。
- 性能：每个 capability p95 < 2s（用 mock 数据源）。

---

## P2 Roadmap (Milestone-level)

### P2 新增数据源
DS-CODE / DS-MOBILE / DS-DNS / DS-FILE / DS-WAF / DS-VPN / DS-PROXY / DS-TICKET / DS-AV / DS-IPAM(完整)

### P2 新增 Capability
A6 / A9 / A10 / A13 / A14 / B7 / B11 / B12 / B13 / B14 / C7 / C8 / C10 / D4 / D6 / D8 / D10 / D11 / E4 / E9 / E10 / E11 / E12 / F5 / F10 / F11 / G5 / G6 / G7 / G8

### P2 关键专题
- **隐私守门（G7）**：实现 PII 字段裁剪策略 + 调用者角色映射，所有 capability 输出经过 redactor。
- **归因与供应链情报（E9/E12）**：接入家族/APT 知识图谱。
- **合规报告（F10）**：法务/监管/管理层三档输出模板。
- **检测改进（F11）**：根据 P0/P1 累积调查输出，自动出 Sigma 规则草案。

### P2 验收
- 全 83 个原子能力上线。
- 命名空间总览页（自动生成）含每个能力当前覆盖的数据源、p95 延迟、近 30d 调用量、partial 率。

---

## Self-Review Notes

> 写完后我自查的发现，留底以便后续修正：

1. **Spec 覆盖度**：spec 中 0-G 七大类共 ~100 能力，P0 选了 25 个；P1/P2 milestone 列表覆盖剩余。✓
2. **占位符**：本计划无 "TBD/TODO"，但 P1/P2 的 step-level 内容刻意省略——已在 Scope Note 显式说明，并要求"启动 P1 前重新跑 writing-plans"。✓
3. **类型一致性**：`CapabilityResult` 字段在 Task 2 定义，Task 3+ 一致使用；`AtomicCapability` 类签名贯穿；`PartialResult` 在 Task 4 引入，被 Task 17 起所有 capability 使用。✓
4. **依赖关系**：每个 capability task 显式列出依赖的 task #。✓
5. **测试代码完整性**：Task 1-7 完整 TDD；Task 8 完整；Task 17 完整；Task 18-41 用统一模板（输入/输出/数据源/验收/必写测试维度），engineer 按 Task 17 模板可独立实现，并未引入未定义符号。✓
6. **可执行性**：P0 全部 task 依赖项均落在 P0 之内；P1 显式声明会再开 plan。✓

---

## 执行选择

Plan complete and saved to `Secmind/docs/plans/2026-05-24-investigation-atomic-skills-implementation.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — 我用 fresh subagent 跑每个 task（特别是 P0 的 25 个 capability 复制粘贴 + 调整非常适合 subagent 并行），每个 task 完成后做两阶段 review，快速迭代。
2. **Inline Execution** — 在当前会话用 executing-plans skill 顺序执行，带 checkpoint 由你 review。

**Which approach?**
