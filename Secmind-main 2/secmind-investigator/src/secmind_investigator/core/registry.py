"""Capability registry: namespace → AtomicCapability class."""
from __future__ import annotations

from typing import Any

from secmind_investigator.core.capability import AtomicCapability


class CapabilityRegistry:
    """Registry mapping a namespace string to an AtomicCapability class."""

    def __init__(self) -> None:
        self._caps: dict[str, type[AtomicCapability[Any, Any]]] = {}

    def register(
        self, cap_cls: type[AtomicCapability[Any, Any]]
    ) -> type[AtomicCapability[Any, Any]]:
        ns = cap_cls.namespace
        if ns in self._caps:
            raise ValueError(f"capability {ns!r} already registered")
        self._caps[ns] = cap_cls
        return cap_cls

    def lookup(self, namespace: str) -> type[AtomicCapability[Any, Any]] | None:
        return self._caps.get(namespace)

    def list_namespaces(self, prefix: str = "") -> list[str]:
        return sorted(ns for ns in self._caps if ns.startswith(prefix))


default_registry = CapabilityRegistry()
