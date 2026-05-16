import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import User
from app.services.auth_service import get_password_hash

TEST_DB_URL = "sqlite:///./test_smoke.db"

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

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    app.state.limiter = Limiter(key_func=get_remote_address, enabled=False)
except Exception:
    pass

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
    existing = db.query(User).filter(User.email == "smoke@test.com").first()
    if not existing:
        user = User(
            name="冒烟测试管理员",
            email="smoke@test.com",
            hashed_password=get_password_hash("test123"),
            role="admin",
            status="active",
        )
        db.add(user)
        db.commit()
    db.close()

    r = client.post("/api/v1/auth/login", json={"email": "smoke@test.com", "password": "test123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    _admin_token = r.json()["access_token"]
    return _admin_token


def _headers():
    return {"Authorization": f"Bearer {_get_admin_token()}"}


class TestHealthEndpoints:
    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["version"] == "2.2.0"

    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"


class TestResponseActions:
    def test_create_action(self):
        h = _headers()
        r = client.post("/api/v1/response/actions", headers=h, json={
            "name": "冻结账号",
            "action_type": "account_freeze",
            "target": "user-zhangsan",
            "priority": "high",
            "requested_by": "AI引擎",
            "ai_reasoning": "检测到账号失陷，置信度96%",
        })
        assert r.status_code in (200, 201)
        assert r.json()["name"] == "冻结账号"
        assert r.json()["status"] == "pending"

    def test_list_actions(self):
        h = _headers()
        r = client.get("/api/v1/response/actions", headers=h)
        assert r.status_code == 200
        assert "items" in r.json()

    def test_execute_action(self):
        h = _headers()
        create_r = client.post("/api/v1/response/actions", headers=h, json={
            "name": "隔离设备",
            "action_type": "device_isolation",
            "target": "host-192.168.1.100",
            "priority": "critical",
        })
        action_id = create_r.json()["id"]

        r = client.post(f"/api/v1/response/actions/{action_id}/execute", headers=h)
        assert r.status_code == 200
        assert r.json()["status"] in ("executing", "completed")

    def test_submit_approval_then_approve(self):
        h = _headers()
        create_r = client.post("/api/v1/response/actions", headers=h, json={
            "name": "封禁IP",
            "action_type": "ip_block",
            "target": "1.2.3.4",
            "priority": "medium",
        })
        action_id = create_r.json()["id"]

        submit_r = client.post(f"/api/v1/response/actions/{action_id}/submit-approval", headers=h)
        assert submit_r.status_code == 200
        assert submit_r.json()["status"] == "awaiting_approval"

        r = client.post(f"/api/v1/response/actions/{action_id}/approve", headers=h, json={
            "approved_by": "admin"
        })
        assert r.status_code == 200
        assert r.json()["status"] == "approved"

    def test_cancel_action(self):
        h = _headers()
        create_r = client.post("/api/v1/response/actions", headers=h, json={
            "name": "重置密码",
            "action_type": "password_reset",
            "target": "user-lisi",
            "priority": "low",
        })
        action_id = create_r.json()["id"]

        r = client.post(f"/api/v1/response/actions/{action_id}/cancel", headers=h, json={
            "cancelled_by": "admin",
            "reason": "误报"
        })
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"

    def test_action_stats(self):
        h = _headers()
        r = client.get("/api/v1/response/actions/stats", headers=h)
        assert r.status_code == 200


class TestHunting:
    def test_create_hypothesis(self):
        h = _headers()
        r = client.post("/api/v1/hunting/hypotheses", headers=h, json={
            "name": "账号入侵假设",
            "tactic": "Initial Access",
            "technique": "Phishing",
            "technique_id": "T1566.001",
            "description": "通过钓鱼邮件获取凭证",
            "confidence": 78.5,
            "created_by": "AI引擎",
        })
        assert r.status_code in (200, 201)
        assert r.json()["name"] == "账号入侵假设"
        assert r.json()["status"] in ("active", "验证中")

    def test_list_hypotheses(self):
        h = _headers()
        r = client.get("/api/v1/hunting/hypotheses", headers=h)
        assert r.status_code == 200
        assert "items" in r.json()

    def test_update_hypothesis(self):
        h = _headers()
        create_r = client.post("/api/v1/hunting/hypotheses", headers=h, json={
            "name": "内部威胁假设",
            "tactic": "Persistence",
            "technique_id": "T1134",
            "confidence": 45.0,
        })
        hid = create_r.json()["id"]

        r = client.put(f"/api/v1/hunting/hypotheses/{hid}", headers=h, json={
            "confidence": 65.0,
            "status": "strengthened",
        })
        assert r.status_code == 200
        assert r.json()["confidence"] == 65.0

    def test_delete_hypothesis(self):
        h = _headers()
        create_r = client.post("/api/v1/hunting/hypotheses", headers=h, json={
            "name": "待删除假设",
            "tactic": "Defense Evasion",
        })
        hid = create_r.json()["id"]

        r = client.delete(f"/api/v1/hunting/hypotheses/{hid}", headers=h)
        assert r.status_code in (200, 204)

    def test_hypothesis_stats(self):
        h = _headers()
        r = client.get("/api/v1/hunting/hypotheses/stats", headers=h)
        assert r.status_code == 200


class TestPlaybooks:
    def test_create_playbook(self):
        h = _headers()
        r = client.post("/api/v1/playbooks", headers=h, json={
            "name": "勒索软件应急响应",
            "description": "针对勒索软件攻击的自动化响应流程",
            "trigger": "alert_type:ransomware",
            "definition": {
                "nodes": [
                    {"id": "n1", "type": "trigger", "label": "检测到勒索软件"},
                    {"id": "n2", "type": "action", "label": "隔离受感染主机"},
                ],
                "edges": [{"from": "n1", "to": "n2"}],
            },
        })
        assert r.status_code in (200, 201)
        assert r.json()["name"] == "勒索软件应急响应"

    def test_list_playbooks(self):
        h = _headers()
        r = client.get("/api/v1/playbooks", headers=h)
        assert r.status_code == 200
        assert "items" in r.json()

    def test_toggle_playbook(self):
        h = _headers()
        create_r = client.post("/api/v1/playbooks", headers=h, json={
            "name": "钓鱼邮件处置",
            "description": "自动处置钓鱼邮件",
            "trigger": "alert_type:phishing",
        })
        pid = create_r.json()["id"]

        r = client.post(f"/api/v1/playbooks/{pid}/toggle", headers=h)
        assert r.status_code == 200

    def test_playbook_stats(self):
        h = _headers()
        r = client.get("/api/v1/playbooks/stats", headers=h)
        assert r.status_code == 200


class TestContacts:
    def test_submit_contact(self):
        r = client.post("/api/v1/contacts", json={
            "name": "张三",
            "company": "测试公司",
            "email": "zhangsan@test.com",
            "phone": "13800138000",
            "message": "想了解SecMind产品",
        })
        assert r.status_code == 201
        assert r.json()["name"] == "张三"

    def test_list_contacts(self):
        r = client.get("/api/v1/contacts")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestCollaboration:
    def test_create_comment(self):
        h = _headers()
        r = client.post("/api/v1/collaboration/comments", headers=h, json={
            "content": "这个案件需要进一步调查VPN异常",
        })
        assert r.status_code in (200, 201)

    def test_list_comments(self):
        h = _headers()
        r = client.get("/api/v1/collaboration/comments", headers=h)
        assert r.status_code == 200

    def test_notifications(self):
        h = _headers()
        r = client.get("/api/v1/collaboration/notifications", headers=h)
        assert r.status_code == 200

    def test_notification_stats(self):
        h = _headers()
        r = client.get("/api/v1/collaboration/notifications/stats", headers=h)
        assert r.status_code == 200


class TestAIChat:
    def test_create_session(self):
        h = _headers()
        r = client.post("/api/v1/ai-chat/sessions", headers=h, json={
            "title": "VPN异常调查",
        })
        assert r.status_code in (200, 201)

    def test_list_sessions(self):
        h = _headers()
        r = client.get("/api/v1/ai-chat/sessions", headers=h)
        assert r.status_code == 200

    def test_send_message(self):
        h = _headers()
        create_r = client.post("/api/v1/ai-chat/sessions", headers=h, json={
            "title": "钓鱼邮件分析",
        })
        sid = create_r.json()["id"]

        r = client.post(f"/api/v1/ai-chat/sessions/{sid}/messages", headers=h, json={
            "content": "帮我分析最近的钓鱼邮件告警",
        })
        assert r.status_code == 200

    def test_list_tools(self):
        h = _headers()
        r = client.get("/api/v1/ai-chat/tools", headers=h)
        assert r.status_code == 200


class TestIntegrationAdapters:
    def test_list_adapters(self):
        h = _headers()
        r = client.get("/api/v1/integrations/adapters", headers=h)
        assert r.status_code == 200

    def test_create_adapter(self):
        h = _headers()
        r = client.post("/api/v1/integrations/adapters", headers=h, json={
            "name": "Splunk SIEM",
            "adapter_type": "siem",
            "config": {"host": "splunk.local", "port": 8089},
        })
        assert r.status_code in (200, 201)

    def test_webhook_receive(self):
        r = client.post("/api/v1/integrations/webhooks/inbound", json={
            "source": "splunk",
            "event_type": "alert",
            "payload": {
                "severity": "high",
                "source_ip": "10.0.0.1",
                "description": "Suspicious login detected",
            },
        })
        assert r.status_code in (200, 201)


class TestAIAnalysis:
    def test_submit_alert(self):
        h = _headers()
        r = client.post("/api/v1/api/ai-analysis/events", headers=h, json={
            "title": "VPN异常登录",
            "type": "vpn",
            "severity": "critical",
            "source": "VPN网关",
            "description": "检测到异常地理位置登录",
            "username": "admin_zhang",
            "source_ip": "91.234.56.78",
            "location": "俄罗斯·莫斯科",
        })
        assert r.status_code == 200

    def test_analysis_stats(self):
        r = client.get("/api/v1/api/ai-analysis/stats")
        assert r.status_code == 200

    def test_analysis_status(self):
        r = client.get("/api/v1/api/ai-analysis/status")
        assert r.status_code == 200

    def test_analysis_health(self):
        r = client.get("/api/v1/api/ai-analysis/health")
        assert r.status_code == 200


class TestSystemSettings:
    def test_get_settings(self):
        h = _headers()
        r = client.get("/api/v1/system-settings", headers=h)
        assert r.status_code == 200

    def test_update_settings(self):
        h = _headers()
        r = client.put("/api/v1/system-settings", headers=h, json={
            "system_name": "SecMind测试环境",
            "session_timeout": 60,
            "ip_whitelist": "",
            "log_retention": 90,
            "mfa_enabled": False,
            "password_min_length": 8,
            "ai_model": "gpt-4o",
            "ai_temperature": 0.7,
            "ai_max_tokens": 4096,
            "rag_enabled": True,
        })
        assert r.status_code == 200


class TestDevices:
    def test_list_devices(self):
        h = _headers()
        r = client.get("/api/v1/devices", headers=h)
        assert r.status_code == 200


class TestUsers:
    def test_list_users(self):
        h = _headers()
        r = client.get("/api/v1/users", headers=h)
        assert r.status_code == 200
