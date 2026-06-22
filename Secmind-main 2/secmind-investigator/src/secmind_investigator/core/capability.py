"""Base class for every atomic investigation capability."""
from __future__ import annotations

import inspect
import time
from abc import ABC, abstractmethod
from typing import ClassVar, Generic, TypeVar

from pydantic import BaseModel

from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.core.errors import (
    CapabilityFatal,
    DataSourceUnavailable,
    PartialResult,
)
from secmind_investigator.core.schema import CapabilityResult
from secmind_investigator.observability import metrics
from secmind_investigator.observability.tracing import log

TIn = TypeVar("TIn", bound=BaseModel)
TOut = TypeVar("TOut", bound=BaseModel)


class AtomicCapability(ABC, Generic[TIn, TOut]):
    """One investigation action. Single responsibility, no internal orchestration.

    Subclasses MUST satisfy: ``input_model`` is the runtime class corresponding
    to the generic parameter ``TIn``, and ``output_payload_model`` corresponds
    to ``TOut``. The type system cannot enforce this — it is a manual invariant
    that subclass authors are responsible for preserving.
    """

    namespace: ClassVar[str]
    input_model: ClassVar[type[BaseModel]]
    output_payload_model: ClassVar[type[BaseModel]]

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if inspect.isabstract(cls):
            return
        for attr in ("namespace", "input_model", "output_payload_model"):
            if not hasattr(cls, attr):
                raise TypeError(
                    f"{cls.__name__} must declare class attribute {attr!r}"
                )

    @abstractmethod
    async def execute(self, inp: TIn, ctx: ExecutionContext) -> TOut: ...

    async def run(
        self, raw_input: dict[str, object], ctx: ExecutionContext
    ) -> CapabilityResult:
        inp = self.input_model.model_validate(raw_input)
        metrics.incr(f"capability.run.total[{self.namespace}]")
        start = time.perf_counter()
        partial = False
        confidence = 1.0
        reasons: list[str] = []
        payload: dict[str, object] = {}
        try:
            # Task 4 wraps this in try/except for PartialResult / DataSourceUnavailable.
            out = await self.execute(inp, ctx)  # type: ignore[arg-type]
            payload = out.model_dump(mode="json")
        except PartialResult as pr:
            try:
                payload = (
                    pr.payload.model_dump(mode="json")
                    if isinstance(pr.payload, BaseModel)
                    else dict(pr.payload)
                )
            except Exception as dump_err:
                raise CapabilityFatal(
                    f"PartialResult payload is not serializable: {dump_err}"
                ) from pr
            partial = True
            confidence = pr.confidence
            reasons = pr.reasons
        except DataSourceUnavailable as e:
            partial = True
            confidence = 0.0
            reasons = [str(e)]
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000)
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
            cost_credits=None,
        )
