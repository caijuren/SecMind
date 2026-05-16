import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import User, Alert
from app.services.auth_service import get_password_hash

TEST_DB_URL = "sqlite:///./test_secmind.db"

# Remove old test database to ensure schema is up to date
db_path = "./test_secmind.db"
if os.path.exists(db_path):
    os.remove(db_path)

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

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.create_all(bind=engine)
    yield
    with engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(text(f"DELETE FROM {table.name}"))
        conn.commit()
    Base.metadata.drop_all(bind=engine)


def _create_test_user(db):
    user = User(
        name="测试用户",
        email="test@secmind.com",
        hashed_password=get_password_hash("test123456"),
        role="admin",
        status="active",
        department="技术部",
        position="工程师",
        level="P7",
        manager="CTO",
        office="北京",
        recent_login_location="北京",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _get_auth_token():
    db = TestSessionLocal()
    _create_test_user(db)
    db.close()

    resp = client.post("/api/v1/auth/login", json={
        "email": "test@secmind.com",
        "password": "test123456",
    })
    return resp.json()["access_token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    def test_register_success(self):
        resp = client.post("/api/v1/auth/register", json={
            "email": "newuser@secmind.com",
            "password": "secure123",
            "name": "新用户",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "newuser@secmind.com"
        assert "id" in data

    def test_register_duplicate_email(self):
        client.post("/api/v1/auth/register", json={
            "email": "dup@secmind.com",
            "password": "secure123",
            "name": "用户1",
        })
        resp = client.post("/api/v1/auth/register", json={
            "email": "dup@secmind.com",
            "password": "secure456",
            "name": "用户2",
        })
        assert resp.status_code == 400

    def test_login_success(self):
        client.post("/api/v1/auth/register", json={
            "email": "login@secmind.com",
            "password": "secure123",
            "name": "登录用户",
        })
        resp = client.post("/api/v1/auth/login", json={
            "email": "login@secmind.com",
            "password": "secure123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self):
        client.post("/api/v1/auth/register", json={
            "email": "wrong@secmind.com",
            "password": "secure123",
            "name": "密码用户",
        })
        resp = client.post("/api/v1/auth/login", json={
            "email": "wrong@secmind.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_get_me(self):
        token = _get_auth_token()
        resp = client.get("/api/v1/auth/me", headers=_auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@secmind.com"


class TestAlerts:
    def test_list_alerts_empty(self):
        token = _get_auth_token()
        resp = client.get("/api/v1/alerts", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_create_and_get_alert(self):
        db = TestSessionLocal()
        alert = Alert(
            type="暴力破解",
            title="测试告警",
            description="测试描述",
            risk_level="高",
            status="待处理",
            source="IDS",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alert_id = alert.id
        db.close()

        token = _get_auth_token()
        resp = client.get(f"/api/v1/alerts/{alert_id}", headers=_auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["title"] == "测试告警"

    def test_update_alert_status(self):
        db = TestSessionLocal()
        alert = Alert(
            type="异常登录",
            title="状态更新测试",
            risk_level="中",
            status="待处理",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alert_id = alert.id
        db.close()

        token = _get_auth_token()
        resp = client.put(
            f"/api/v1/alerts/{alert_id}/status",
            json={"status": "处理中"},
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "处理中"

    def test_alert_not_found(self):
        token = _get_auth_token()
        resp = client.get("/api/v1/alerts/99999", headers=_auth_headers(token))
        assert resp.status_code == 404

    def test_alert_filter_by_risk_level(self):
        db = TestSessionLocal()
        db.add(Alert(type="测试", title="高危告警", risk_level="高", status="待处理"))
        db.add(Alert(type="测试", title="低危告警", risk_level="低", status="待处理"))
        db.commit()
        db.close()

        token = _get_auth_token()
        resp = client.get("/api/v1/alerts?risk_level=高", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["risk_level"] == "高"


class TestDashboard:
    def test_stats(self):
        token = _get_auth_token()
        resp = client.get("/api/v1/dashboard/stats", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "alert_stats" in data
        assert "device_stats" in data
        assert "overview" in data

    def test_trends(self):
        token = _get_auth_token()
        resp = client.get("/api/v1/dashboard/trends", headers=_auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "daily_trend" in data
        assert "hourly_trend" in data
        assert "type_distribution" in data


class TestHealthCheck:
    def test_root(self):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_health(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
