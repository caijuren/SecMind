"""F4: Rule-based IOC extraction via recursive walk of evidence payloads."""
from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import BaseModel, Field

from secmind_investigator.core.capability import AtomicCapability
from secmind_investigator.core.context import ExecutionContext

# ---------------------------------------------------------------------------
# Regex patterns (priority order: IP → Hash → URL → Email → Domain)
# ---------------------------------------------------------------------------
IP_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
SHA256_RE = re.compile(r"^[a-fA-F0-9]{64}$")
SHA1_RE = re.compile(r"^[a-fA-F0-9]{40}$")
MD5_RE = re.compile(r"^[a-fA-F0-9]{32}$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
DOMAIN_RE = re.compile(
    r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$",
    re.IGNORECASE,
)

IocType = Literal["ip", "domain", "hash", "url", "email"]

_DEFAULT_CONFIDENCE = 0.7
_DEFAULT_TTL_HOURS = 72


class IocItem(BaseModel):
    type: IocType
    value: str
    confidence: float = _DEFAULT_CONFIDENCE
    ttl_hours: int = _DEFAULT_TTL_HOURS
    sources: list[str] = Field(default_factory=list)


class IocExtractPayload(BaseModel):
    iocs: list[IocItem] = Field(default_factory=list)


class IocExtractInput(BaseModel):
    evidence_set: list[dict[str, Any]]


def _classify(s: str) -> IocType | None:
    """Return the IOC type for string s, or None if not an IOC."""
    if IP_RE.match(s):
        return "ip"
    if SHA256_RE.match(s) or SHA1_RE.match(s) or MD5_RE.match(s):
        return "hash"
    if URL_RE.match(s):
        return "url"
    if EMAIL_RE.match(s):
        return "email"
    # Strip leading wildcard / path before domain check
    candidate = s.lstrip("*").split("/")[0]
    if DOMAIN_RE.match(candidate):
        return "domain"
    return None


def _walk(node: Any, seen: set[tuple[str, str]], out: list[IocItem]) -> None:
    """Depth-first walk; classify every leaf string."""
    if isinstance(node, dict):
        for v in node.values():
            _walk(v, seen, out)
    elif isinstance(node, list):
        for v in node:
            _walk(v, seen, out)
    elif isinstance(node, str):
        ioc_type = _classify(node)
        if ioc_type is not None:
            key = (ioc_type, node.lower())
            if key not in seen:
                seen.add(key)
                out.append(IocItem(type=ioc_type, value=node))


class IocExtractCapability(
    AtomicCapability[IocExtractInput, IocExtractPayload]
):
    """F4: recursively extract and deduplicate IOCs from a set of CapabilityResult dicts."""

    namespace = "investigate.verdict.ioc_extract"
    input_model = IocExtractInput
    output_payload_model = IocExtractPayload

    async def execute(
        self, inp: IocExtractInput, ctx: ExecutionContext
    ) -> IocExtractPayload:
        seen: set[tuple[str, str]] = set()
        iocs: list[IocItem] = []
        for evidence in inp.evidence_set:
            _walk(evidence, seen, iocs)
        return IocExtractPayload(iocs=iocs)
