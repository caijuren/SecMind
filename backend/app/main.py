from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import auth, alerts, dashboard, devices, users, itsm, ai, email, vpn, brute_force
from app.routers import system_settings, integrations
from app.routers import ai_analysis

app = FastAPI(
    title="SecMind AI安全运营平台",
    description="SecMind AI安全运营平台后端API",
    version="1.0.0",
)

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


@app.get("/")
def root():
    return {"message": "SecMind AI安全运营平台 API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
