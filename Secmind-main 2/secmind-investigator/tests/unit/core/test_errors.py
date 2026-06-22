"""Tests for error handling and partial-result degradation in AtomicCapability.run()."""
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
    value: str = ""


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
    assert any("DS-EDR" in r for r in res.partial_reasons)
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


async def test_partial_with_dict_payload(empty_context: ExecutionContext) -> None:
    """PartialResult should accept a raw dict payload (escape hatch)."""

    class _CapDictPartial(AtomicCapability[_In, _Out]):
        namespace = "investigate.test.dict_partial"
        input_model = _In
        output_payload_model = _Out

        async def execute(self, inp: _In, ctx: ExecutionContext) -> _Out:
            raise PartialResult(
                payload={"raw_field_a": 1, "raw_field_b": "x"},
                reasons=["fell back to raw dict"],
                confidence=0.3,
            )

    res = await _CapDictPartial().run({}, empty_context)
    assert res.partial is True
    assert res.payload == {"raw_field_a": 1, "raw_field_b": "x"}


def test_partial_result_rejects_out_of_range_confidence() -> None:
    with pytest.raises(ValueError, match="confidence"):
        PartialResult(payload=_Out(), reasons=[], confidence=1.5)
    with pytest.raises(ValueError, match="confidence"):
        PartialResult(payload=_Out(), reasons=[], confidence=-0.1)


def test_partial_result_copies_reasons() -> None:
    reasons = ["a"]
    pr = PartialResult(payload=_Out(), reasons=reasons, confidence=0.5)
    reasons.append("b")
    assert pr.reasons == ["a"]
