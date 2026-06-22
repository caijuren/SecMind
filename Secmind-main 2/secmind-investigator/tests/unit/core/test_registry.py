"""Tests for CapabilityRegistry."""
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
    with pytest.raises(ValueError, match="already registered"):
        reg.register(_make("ns.x"))


def test_lookup_missing_returns_none() -> None:
    reg = CapabilityRegistry()
    assert reg.lookup("ns.absent") is None


def test_list_by_prefix() -> None:
    reg = CapabilityRegistry()
    reg.register(_make("investigate.entity.user.profile"))
    reg.register(_make("investigate.entity.host.profile"))
    reg.register(_make("investigate.activity.login"))
    found = reg.list_namespaces(prefix="investigate.entity")
    assert found == [
        "investigate.entity.host.profile",
        "investigate.entity.user.profile",
    ]


def test_list_empty_prefix_returns_all_sorted() -> None:
    reg = CapabilityRegistry()
    reg.register(_make("b.ns"))
    reg.register(_make("a.ns"))
    assert reg.list_namespaces() == ["a.ns", "b.ns"]
