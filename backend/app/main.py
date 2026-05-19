from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from scalar_fastapi import get_scalar_api_reference
from contextlib import asynccontextmanager
import os

from app.routers import auth, alerts, dashboard, devices, users, itsm, ai, email, vpn, brute_force, demo
from app.routers import system_settings, integrations
from app.routers import ai_analysis, response, hunting, playbooks, contacts, rbac, collaboration
from app.routers import ai_chat, ws, integration_adapters, tenants, billing, documents, i18n, system_monitor, ai_models, strategies, playbook_editor, situation, compliance, ioc, execution, dag, reports, funnel, model_router, strategy_evolution, search, audit
from app.middleware.performance import PerformanceMiddleware, get_perf_stats
from app.middleware.cache_middleware import CacheControlMiddleware
from app.middleware.rbac import RBACMiddleware
from app.middleware.tenant_isolation import TenantIsolationMiddleware


def _read_version() -> str:
    env_version = os.getenv("APP_VERSION")
    if env_version:
        return env_version
    version_file = os.path.join(os.path.dirname(__file__), "..", "..", "VERSION")
    try:
        with open(version_file) as f:
            return f.read().strip()
    except FileNotFoundError:
        return "0.0.0"


APP_VERSION = _read_version()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.scheduler import init_scheduler, shutdown_scheduler
    init_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="SecMind AI安全运营平台",
    description="SecMind AI安全运营平台后端API",
    version=APP_VERSION,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误，请稍后重试"},
    )

app.add_middleware(CacheControlMiddleware)
app.add_middleware(PerformanceMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(RBACMiddleware)

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

api_prefix = "/api/v1"

app.include_router(auth.router, prefix=api_prefix)
app.include_router(demo.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(devices.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(itsm.router, prefix=api_prefix)
app.include_router(ai.router, prefix=api_prefix)
app.include_router(email.router, prefix=api_prefix)
app.include_router(vpn.router, prefix=api_prefix)
app.include_router(brute_force.router, prefix=api_prefix)
app.include_router(system_settings.router, prefix=api_prefix)
app.include_router(integrations.router, prefix=api_prefix)
app.include_router(ai_analysis.router, prefix=api_prefix)
app.include_router(response.router, prefix=api_prefix)
app.include_router(hunting.router, prefix=api_prefix)
app.include_router(playbooks.router, prefix=api_prefix)
app.include_router(contacts.router, prefix=api_prefix)
app.include_router(rbac.router, prefix=api_prefix)
app.include_router(collaboration.router, prefix=api_prefix)
app.include_router(ai_chat.router, prefix=api_prefix)
app.include_router(ws.router)
app.include_router(integration_adapters.router, prefix=api_prefix)
app.include_router(tenants.router, prefix=api_prefix)
app.include_router(billing.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(i18n.router, prefix=api_prefix)
app.include_router(system_monitor.router, prefix=api_prefix)
app.include_router(ai_models.router, prefix=api_prefix)
app.include_router(strategies.router, prefix=api_prefix)
app.include_router(playbook_editor.router, prefix=api_prefix)
app.include_router(situation.router, prefix=api_prefix)
app.include_router(compliance.router, prefix=api_prefix)
app.include_router(ioc.router, prefix=api_prefix)
app.include_router(execution.router, prefix=api_prefix)
app.include_router(dag.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(funnel.router, prefix=api_prefix)
app.include_router(model_router.router, prefix=api_prefix)
app.include_router(strategy_evolution.router, prefix=api_prefix)
app.include_router(search.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)


@app.get("/")
def root():
    return {"message": "SecMind AI安全运营平台 API", "version": APP_VERSION}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get(f"{api_prefix}/system/performance")
def performance_endpoint():
    return get_perf_stats()


@app.get("/api", include_in_schema=False)
async def scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="SecMind API 文档",
    )
