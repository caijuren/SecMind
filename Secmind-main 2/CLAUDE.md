# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

Two co-located projects, talking over stdin/stdout JSON:

- **Next.js 16 prototype UI** at the repo root (`app/`, `package.json`). Pure client-rendered SPA.
- **`secmind-investigator/`** — Python 3.11+ package (uv + hatchling) that implements the "atomic security investigation capabilities". This is the real product; the UI is a demo shell.

The UI exposes a "试运行" (try-run) button for P0 capabilities. The Next API routes in `app/api/capabilities/` spawn `python -m secmind_investigator.runner` as a subprocess. There is no HTTP layer between them — JSON in on stdin, one JSON object out on stdout, structlog/logging diverted to stderr.

## Common commands

### Frontend (repo root)
```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
```
No lint/test scripts are wired up at the JS layer.

### Python investigator (`secmind-investigator/`)
The Makefile assumes `uv` is available and creates `.venv/` on first use.
```bash
make install     # uv venv + uv pip install -e ".[dev]"
make test        # pytest with coverage (asyncio_mode=auto, --strict-markers)
make lint        # ruff check + mypy --strict
make format      # ruff check --fix + ruff format
```
Run a single test:
```bash
cd secmind-investigator && .venv/bin/pytest tests/unit/core/test_capability.py::test_name -x
```
The Next API routes hard-code `secmind-investigator/.venv/bin/python` (see `app/api/capabilities/*/route.js`) — `make install` must have been run for the UI's run/scenarios endpoints to work.

## Architecture

### Atomic capability model (`secmind-investigator/src/secmind_investigator/`)

Every investigation action is an `AtomicCapability` subclass (`core/capability.py`). Subclasses declare three ClassVars and one async method:

```python
class FooCapability(AtomicCapability[InputModel, OutputModel]):
    namespace: ClassVar[str] = "investigate.<category>.<entity|activity>.<action>"
    input_model = InputModel            # pydantic BaseModel
    output_payload_model = OutputModel  # pydantic BaseModel

    async def execute(self, inp, ctx: ExecutionContext) -> OutputModel: ...
```

`AtomicCapability.run()` is the public entry point. It validates inputs, times the call, catches `PartialResult` / `DataSourceUnavailable`, and always returns a `CapabilityResult` (`core/schema.py`) with `payload / confidence / partial / partial_reasons / duration_ms`. Capabilities must never raise on data-source outages — they degrade to partial.

Concrete capabilities live under `capabilities/<category>/` (currently `activity/`, `entity/`, `intel/`, `verdict/`). Categories map to the namespace taxonomy (A=entity, B=activity, C=relation, D=context, E=intel, F=verdict, G=meta) defined in `docs/specs/2026-05-24-investigation-atomic-skills.md`.

### Data sources

Capabilities depend on **abstract** data sources (`DS-HR`, `DS-IDP`, `DS-EDR`, `DS-EMAIL`, `DS-CMDB`, `DS-TI`, `DS-KB`, `DS-FW`, …) defined under `datasources/`. Each has a real interface in `datasources/<ds>.py` and a deterministic in-memory `Mock<X>DataSource` in `datasources/mocks.py`. `ExecutionContext.datasources` is just `dict[str, Any]` indexed by the DS-* id. Capabilities never import vendor SDKs directly.

### Runner bridge

`runner.py` is the only entry point exposed to the UI:

- `python -m secmind_investigator.runner --list` → preset scenario catalog (used by `app/api/capabilities/scenarios/route.js`).
- `python -m secmind_investigator.runner` reading `{capability_id, scenario_id?, custom_inputs?, custom_datasources?}` on stdin → single JSON object on stdout (used by `app/api/capabilities/run/route.js`).

`runner.CAPABILITY_REGISTRY` and the SCENARIOS dict define which capabilities are runnable from the UI. The set is mirrored in `app/SecmindApp.jsx` as `RUNNABLE_CAPABILITIES` (currently `A1, B8, E2, F1, F4, F8`). **Both sides must be updated together when adding a runnable capability.** The full 83-card catalog (purpose/inputs/dataQueries/outputs/triggers/notes) is rendered from `app/capability-data.js` regardless of whether the capability is implemented in Python yet.

Placeholder strings like `<NOW_MINUS_1_HOUR>` in scenario fixtures are resolved at runtime by `_resolve_timestamps()` — use them in new scenarios rather than baking in absolute timestamps.

### Frontend layout

- `app/layout.jsx` + `app/page.jsx` + `app/[...slug]/page.jsx` — both routes dynamically import `SecmindApp` with `ssr: false`. The entire app is one client component that does its own routing via `usePathname` / `useRouter`.
- `app/SecmindApp.jsx` (~5k lines) holds every view: dashboard, alert list/board, investigation report graphs, settings, and `AtomicCapabilitiesPage` (the capability browser/try-runner). Inline SVG icon set at the top; shadcn-style primitives below it. Edits here will be large; prefer targeted `Edit` calls anchored to nearby identifiers.
- `app/capability-data.js` — the source of truth for capability display metadata (`CAPABILITY_DETAILS["A1"]` etc.). Keep schema consistent across cards: `purpose / inputs / dataQueries / outputs / triggers / notes / relatedCapabilities`.

### Observability

`observability/tracing.py` exposes a `log` (structlog) and `observability/metrics.py` a process-local counter. `runner.py` redirects logging+structlog to stderr so stdout stays a single JSON document — keep that invariant when adding logging.

## Working in this repo

- The Python project is **mypy strict** and ruff-enforced (`E F I B UP SIM RUF`). Type every public signature; prefer `from __future__ import annotations`.
- Tests are `pytest-asyncio` with `asyncio_mode=auto` — async test functions don't need a decorator. Coverage is collected on `secmind_investigator` by default.
- The integration test `tests/integration/test_phishing_orchestration.py` chains six capabilities end-to-end. When adding new capabilities or changing `CapabilityResult` shape, re-check it.
- Capability spec doc: `docs/specs/2026-05-24-investigation-atomic-skills.md`. Implementation plan: `docs/plans/2026-05-24-investigation-atomic-skills-implementation*.md`. Read these before adding capabilities — the "seven iron laws" (atomic, composable, DS-decoupled, partial-degradable, structured-output, privacy-explicit, baseline-first) are non-negotiable design constraints.
- `index.html` at repo root is a legacy single-file mockup, not used by Next.

## Conventions

- Git: do **not** add `Co-Authored-By` lines or `🤖 Generated with [Claude Code]` markers in commits or PR bodies (per global config).
- Commits in recent history are conventional (`feat(ui):`, `fix(ui):`, `test(integration):`, `chore:`).
