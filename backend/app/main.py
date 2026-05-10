from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, alerts, dashboard, devices, users, itsm, ai, email, vpn, brute_force

app = FastAPI(
    title="SecMind AI安全运营平台",
    description="SecMind AI安全运营平台后端API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/")
def root():
    return {"message": "SecMind AI安全运营平台 API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
