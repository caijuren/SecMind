"""Execution context: per-run state for AtomicCapability.run()."""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExecutionContext:
    """Holds data source handles and tracing context for one capability run."""

    datasources: dict[str, Any] = field(default_factory=dict)
    trace_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    caller_role: str | None = None

    @classmethod
    def empty(cls) -> ExecutionContext:
        return cls()

    @classmethod
    def new(cls, **kwargs: Any) -> ExecutionContext:
        return cls(**kwargs)
