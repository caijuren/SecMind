"""Tests for AtomicCapability base class."""
import pytest
from pydantic import BaseModel, ValidationError

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
    res = await _DummyCap().run({"name": "alice"}, empty_context)
    assert isinstance(res, CapabilityResult)
    assert res.payload == {"greeting": "hello alice"}
    assert res.confidence == 1.0
    assert res.partial is False
    assert res.duration_ms is not None and res.duration_ms >= 0


async def test_run_validates_input(empty_context: ExecutionContext) -> None:
    with pytest.raises(ValidationError):
        await _DummyCap().run({"wrong_field": 1}, empty_context)


def test_subclass_must_declare_namespace() -> None:
    with pytest.raises(TypeError):

        class _Bad(AtomicCapability):  # type: ignore[misc]
            input_model = _DummyIn
            output_payload_model = _DummyOut
            # missing namespace

            async def execute(self, inp, ctx):  # type: ignore[no-untyped-def]
                return _DummyOut(greeting="x")
