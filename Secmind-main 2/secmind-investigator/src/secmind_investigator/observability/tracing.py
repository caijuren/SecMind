"""Structured logging entry point for the investigator package."""
from __future__ import annotations

import structlog

log = structlog.get_logger("secmind_investigator")
