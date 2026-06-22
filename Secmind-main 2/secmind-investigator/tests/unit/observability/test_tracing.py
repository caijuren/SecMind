"""Tests for capability.run observability emissions."""
from pydantic import BaseModel

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext
from secmind_investigator.observability import metrics


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


async def test_run_emits_structured_log_with_required_fields(
    caplog_structlog: list[dict],
) -> None:
    ctx = ExecutionContext.new()
    await _Cap().run({}, ctx)
    rec = next(
        (e for e in caplog_structlog if e.get("event") == "capability.run"), None
    )
    assert rec is not None, f"expected capability.run event, got: {caplog_structlog}"
    assert rec["capability_ns"] == "investigate.test.observable"
    assert rec["trace_id"] == ctx.trace_id
    assert "duration_ms" in rec
    assert rec["partial"] is False
    assert rec["confidence"] == 1.0


async def test_run_increments_metrics() -> None:
    metrics.reset()
    await _Cap().run({}, ExecutionContext.new())
    snap = metrics.snapshot()
    assert snap.get("capability.run.total[investigate.test.observable]") == 1
