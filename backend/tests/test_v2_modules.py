import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import User
from app.services.auth_service import get_password_hash

TEST_DB_URL = "sqlite:///./test_v2.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

from slowapi import Limiter
from slowapi.util import get_remote_address
app.state.limiter = Limiter(key_func=get_remote_address, enabled=False)

client = TestClient(app)

_admin_token = None


def _get_admin_token():
    global _admin_token
    if _admin_token:
        try:
            from app.services.auth_service import decode_access_token
            payload = decode_access_token(_admin_token)
            if payload:
                return _admin_token
        except Exception:
            pass

    db = TestSessionLocal()
    existing = db.query(User).filter(User.email == "admin@test.com").first()
    if not existing:
        user = User(
            name="管理员",
            email="admin@test.com",
            hashed_password=get_password_hash("test123"),
            role="admin",
            status="active",
        )
        db.add(user)
        db.commit()
    db.close()

    r = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "test123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    _admin_token = r.json()["access_token"]
    return _admin_token


def _headers():
    return {"Authorization": f"Bearer {_get_admin_token()}"}


class TestRBAC:
    def test_seed_and_list_roles(self):
        h = _headers()
        r = client.post("/api/v1/rbac/seed", headers=h)
        assert r.status_code in (200, 201)

        r = client.get("/api/v1/rbac/roles", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_list_permissions(self):
        h = _headers()
        client.post("/api/v1/rbac/seed", headers=h)
        r = client.get("/api/v1/rbac/permissions", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 20


class TestTenants:
    def test_create_and_list_tenants(self):
        h = _headers()
        r = client.post("/api/v1/tenants", headers=h, json={
            "name": "测试公司", "slug": "test-co", "owner_email": "admin@test.com", "plan": "free"
        })
        assert r.status_code == 201
        assert r.json()["name"] == "测试公司"

        r = client.get("/api/v1/tenants", headers=h)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_tenant_quota(self):
        h = _headers()
        r = client.post("/api/v1/tenants", headers=h, json={
            "name": "配额测试", "slug": "quota-test", "owner_email": "admin@test.com", "plan": "starter"
        })
        tid = r.json()["id"]
        r = client.get(f"/api/v1/tenants/{tid}/quota", headers=h)
        assert r.status_code == 200
        assert "max_users" in r.json()


class TestBilling:
    def test_trial_status(self):
        h = _headers()
        r = client.post("/api/v1/tenants", headers=h, json={
            "name": "账单测试", "slug": "bill-test", "owner_email": "admin@test.com", "plan": "free"
        })
        tid = r.json()["id"]
        r = client.get(f"/api/v1/billing/tenants/{tid}/trial-status", headers=h)
        assert r.status_code == 200
        assert "is_trial" in r.json()

    def test_create_and_pay_order(self):
        h = _headers()
        r = client.post("/api/v1/tenants", headers=h, json={
            "name": "订单测试", "slug": "order-test", "owner_email": "admin@test.com", "plan": "free"
        })
        tid = r.json()["id"]
        r = client.post(f"/api/v1/billing/tenants/{tid}/orders", headers=h, json={
            "plan": "professional", "payment_method": "alipay"
        })
        assert r.status_code == 201
        oid = r.json()["id"]
        assert r.json()["status"] == "pending"

        r = client.post(f"/api/v1/billing/orders/{oid}/pay", headers=h)
        assert r.status_code == 200
        assert r.json()["status"] == "paid"


class TestDocuments:
    def test_seed_and_list(self):
        h = _headers()
        r = client.post("/api/v1/docs/seed", headers=h)
        assert r.status_code in (200, 201)

        r = client.get("/api/v1/docs", headers=h, params={"status": "published"})
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_search(self):
        h = _headers()
        client.post("/api/v1/docs/seed", headers=h)
        r = client.get("/api/v1/docs/search", headers=h, params={"q": "API"})
        assert r.status_code == 200
        assert r.json()["total"] >= 1


class TestAIModels:
    def test_seed_and_list(self):
        h = _headers()
        r = client.post("/api/v1/ai-models/seed", headers=h)
        assert r.status_code in (200, 201)

        r = client.get("/api/v1/ai-models", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_route_request(self):
        h = _headers()
        client.post("/api/v1/ai-models/seed", headers=h)
        r = client.post("/api/v1/ai-models/route", headers=h, json={
            "task_type": "threat_analysis", "input_text": "检测到异常VPN登录"
        })
        assert r.status_code == 200
        assert "model_name" in r.json()
        assert "output" in r.json()


class TestStrategies:
    def test_seed_and_list(self):
        h = _headers()
        r = client.post("/api/v1/strategies/seed", headers=h)
        assert r.status_code in (200, 201)

        r = client.get("/api/v1/strategies", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_feedback_and_evolve(self):
        h = _headers()
        client.post("/api/v1/strategies/seed", headers=h)
        sid = 1
        for i in range(8):
            client.post("/api/v1/strategies/feedback", headers=h, json={
                "strategy_id": sid, "outcome": "success" if i % 3 == 0 else "failure", "reward": 1.0 if i % 3 == 0 else -0.5
            })
        r = client.post("/api/v1/strategies/evolve", headers=h, json={"strategy_id": sid})
        assert r.status_code == 200
        assert "evolved" in r.json()


class TestCompliance:
    def test_seed_and_list_frameworks(self):
        h = _headers()
        r = client.post("/api/v1/compliance/seed", headers=h)
        assert r.status_code in (200, 201)

        r = client.get("/api/v1/compliance/frameworks", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_create_assessment_and_generate(self):
        h = _headers()
        client.post("/api/v1/compliance/seed", headers=h)
        r = client.post("/api/v1/compliance/assessments", headers=h, json={
            "framework_id": 1, "name": "测试评估", "assessor": "admin"
        })
        assert r.status_code == 201
        aid = r.json()["id"]

        r = client.post(f"/api/v1/compliance/assessments/{aid}/generate", headers=h)
        assert r.status_code == 200
        assert "overall_score" in r.json()


class TestSituation:
    def test_overview(self):
        h = _headers()
        r = client.get("/api/v1/situation/overview", headers=h)
        assert r.status_code == 200
        assert "summary" in r.json()

    def test_threat_map(self):
        h = _headers()
        r = client.get("/api/v1/situation/threat-map", headers=h)
        assert r.status_code == 200
        assert "regions" in r.json()

    def test_realtime_feed(self):
        h = _headers()
        r = client.get("/api/v1/situation/realtime-feed", headers=h)
        assert r.status_code == 200
        assert "events" in r.json()


class TestI18N:
    def test_locales(self):
        r = client.get("/api/v1/i18n/locales")
        assert r.status_code == 200
        assert len(r.json()["locales"]) >= 2


class TestPlaybookEditor:
    def test_templates(self):
        h = _headers()
        r = client.get("/api/v1/playbook-editor/templates", headers=h)
        assert r.status_code == 200
        assert len(r.json()) >= 6


class TestSystemMonitor:
    def test_perf_stats(self):
        r = client.get("/api/v1/system/perf")
        assert r.status_code == 200
        assert "total_requests" in r.json()
