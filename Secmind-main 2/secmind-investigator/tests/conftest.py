"""Shared pytest fixtures."""
import pytest
import structlog

from secmind_investigator.core.context import ExecutionContext


def pytest_sessionfinish(session, exitstatus: int) -> int | None:
    """Convert pytest exit code 5 (NO_TESTS_COLLECTED) to 0 during scaffold phase.

    Remove once real tests exist in the suite.
    """
    if exitstatus == 5:
        session.exitstatus = 0
    return None


@pytest.fixture
def empty_context() -> ExecutionContext:
    return ExecutionContext.empty()


@pytest.fixture
def caplog_structlog():
    """Capture structlog events emitted during the test."""
    captured: list[dict] = []

    def _capture(logger, method_name, event_dict):
        captured.append(dict(event_dict))
        raise structlog.DropEvent()

    structlog.configure(processors=[_capture])
    yield captured
    structlog.reset_defaults()
