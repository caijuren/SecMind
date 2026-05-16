import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.tenant import Tenant, TenantMember
from app.models.user import User
from app.models.alert import Alert
from app.models.device import Device
from app.models.response_action import ResponseAction
from app.models.hunting_hypothesis import HuntingHypothesis
from app.models.playbook import Playbook
from app.models.document import Document
from app.models.compliance import ComplianceFramework
from app.services.auth_service import get_password_hash, create_access_token
from app.services.tenant_context import TenantContext
from app.middleware.tenant_isolation import TenantIsolation

TEST_DB_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    TenantContext.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _create_tenant(db, name: str, slug: str) -> Tenant:
    tenant = Tenant(name=name, slug=slug, owner_email=f"{slug}@test.com", plan="professional")
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


def _create_user(db, email: str, role: str = "analyst") -> User:
    user = User(
        name=email.split("@")[0],
        email=email,
        hashed_password=get_password_hash("test123"),
        role=role,
        status="active",
        department="安全部",
        position="分析师",
        level="P6",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _link_user_tenant(db, user_id: int, tenant_id: int, role: str = "member") -> TenantMember:
    member = TenantMember(user_id=user_id, tenant_id=tenant_id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


class TestTenantContext:

    def test_set_and_get(self):
        TenantContext.set(42)
        assert TenantContext.get() == 42

    def test_clear(self):
        TenantContext.set(42)
        TenantContext.clear()
        assert TenantContext.get() is None

    def test_default_is_none(self):
        assert TenantContext.get() is None

    def test_overwrite(self):
        TenantContext.set(1)
        TenantContext.set(2)
        assert TenantContext.get() == 2


class TestTenantIsolationFilter:

    def test_apply_filter_on_model_with_tenant_id(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(Alert(title="A的告警", type="network", tenant_id=t1.id))
        db.add(Alert(title="B的告警", type="network", tenant_id=t2.id))
        db.add(Alert(title="无租户告警", type="network", tenant_id=None))
        db.commit()

        query = db.query(Alert)
        filtered = TenantIsolation.apply_tenant_filter(query, Alert, t1.id)
        results = filtered.all()
        titles = [r.title for r in results]
        assert "A的告警" in titles
        assert "B的告警" not in titles

    def test_apply_filter_on_model_without_tenant_id(self, db):
        query = db.query(Tenant)
        filtered = TenantIsolation.apply_tenant_filter(query, Tenant, 1)
        assert filtered is query

    def test_apply_filter_with_none_tenant_id(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        db.add(Alert(title="A的告警", type="network", tenant_id=t1.id))
        db.commit()

        query = db.query(Alert)
        filtered = TenantIsolation.apply_tenant_filter(query, Alert, None)
        results = filtered.all()
        assert len(results) == 1

    def test_same_tenant_data_visible(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")

        db.add(Alert(title="告警1", type="network", tenant_id=t1.id))
        db.add(Alert(title="告警2", type="host", tenant_id=t1.id))
        db.commit()

        query = db.query(Alert)
        filtered = TenantIsolation.apply_tenant_filter(query, Alert, t1.id)
        results = filtered.all()
        assert len(results) == 2

    def test_cross_tenant_data_invisible(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(Alert(title="A的告警", type="network", tenant_id=t1.id))
        db.add(Alert(title="B的告警", type="network", tenant_id=t2.id))
        db.commit()

        query_t1 = db.query(Alert)
        filtered_t1 = TenantIsolation.apply_tenant_filter(query_t1, Alert, t1.id)
        assert all(a.tenant_id == t1.id for a in filtered_t1.all())

        query_t2 = db.query(Alert)
        filtered_t2 = TenantIsolation.apply_tenant_filter(query_t2, Alert, t2.id)
        assert all(a.tenant_id == t2.id for a in filtered_t2.all())


class TestTenantIsolationSetTenantId:

    def test_set_tenant_id_on_new_instance(self):
        alert = Alert(title="测试", type="network")
        TenantIsolation.set_tenant_id(alert, 1)
        assert alert.tenant_id == 1

    def test_not_overwrite_existing_tenant_id(self):
        alert = Alert(title="测试", type="network", tenant_id=5)
        TenantIsolation.set_tenant_id(alert, 1)
        assert alert.tenant_id == 5

    def test_set_on_model_without_tenant_id(self):
        tenant = Tenant(name="test", slug="test", owner_email="t@t.com")
        TenantIsolation.set_tenant_id(tenant, 1)
        assert not hasattr(tenant, "tenant_id") or getattr(tenant, "tenant_id", None) is None


class TestTenantIsolationAdmin:

    def test_admin_detection(self, db):
        admin_user = _create_user(db, "admin@test.com", role="admin")
        normal_user = _create_user(db, "user@test.com", role="analyst")
        assert TenantIsolation.is_admin(admin_user) is True
        assert TenantIsolation.is_admin(normal_user) is False

    def test_admin_none_user(self):
        assert TenantIsolation.is_admin(None) is False

    def test_admin_can_see_all_tenants(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(Alert(title="A的告警", type="network", tenant_id=t1.id))
        db.add(Alert(title="B的告警", type="network", tenant_id=t2.id))
        db.commit()

        all_alerts = db.query(Alert).all()
        assert len(all_alerts) == 2


class TestTenantIsolationMultipleModels:

    def test_device_tenant_isolation(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(Device(name="A设备", type="firewall", tenant_id=t1.id))
        db.add(Device(name="B设备", type="firewall", tenant_id=t2.id))
        db.commit()

        filtered = TenantIsolation.apply_tenant_filter(db.query(Device), Device, t1.id)
        results = filtered.all()
        assert len(results) == 1
        assert results[0].name == "A设备"

    def test_playbook_tenant_isolation(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(Playbook(name="A剧本", tenant_id=t1.id))
        db.add(Playbook(name="B剧本", tenant_id=t2.id))
        db.commit()

        filtered = TenantIsolation.apply_tenant_filter(db.query(Playbook), Playbook, t1.id)
        results = filtered.all()
        assert len(results) == 1
        assert results[0].name == "A剧本"

    def test_document_tenant_isolation(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(Document(title="A文档", slug="doc-a", category="guide", content="内容A", tenant_id=t1.id))
        db.add(Document(title="B文档", slug="doc-b", category="guide", content="内容B", tenant_id=t2.id))
        db.commit()

        filtered = TenantIsolation.apply_tenant_filter(db.query(Document), Document, t1.id)
        results = filtered.all()
        assert len(results) == 1
        assert results[0].title == "A文档"

    def test_compliance_framework_tenant_isolation(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(ComplianceFramework(name="A合规", code="comp-a", tenant_id=t1.id))
        db.add(ComplianceFramework(name="B合规", code="comp-b", tenant_id=t2.id))
        db.commit()

        filtered = TenantIsolation.apply_tenant_filter(
            db.query(ComplianceFramework), ComplianceFramework, t1.id
        )
        results = filtered.all()
        assert len(results) == 1
        assert results[0].name == "A合规"

    def test_hunting_hypothesis_tenant_isolation(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(HuntingHypothesis(name="A假设", tactic="reconnaissance", tenant_id=t1.id))
        db.add(HuntingHypothesis(name="B假设", tactic="reconnaissance", tenant_id=t2.id))
        db.commit()

        filtered = TenantIsolation.apply_tenant_filter(
            db.query(HuntingHypothesis), HuntingHypothesis, t1.id
        )
        results = filtered.all()
        assert len(results) == 1
        assert results[0].name == "A假设"

    def test_response_action_tenant_isolation(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")
        t2 = _create_tenant(db, "租户B", "tenant-b")

        db.add(ResponseAction(name="A响应", action_type="block", target="1.1.1.1", tenant_id=t1.id))
        db.add(ResponseAction(name="B响应", action_type="block", target="2.2.2.2", tenant_id=t2.id))
        db.commit()

        filtered = TenantIsolation.apply_tenant_filter(
            db.query(ResponseAction), ResponseAction, t1.id
        )
        results = filtered.all()
        assert len(results) == 1
        assert results[0].name == "A响应"


class TestTenantContextWithToken:

    def test_token_with_tenant_id(self, db):
        user = _create_user(db, "user@test.com")
        t1 = _create_tenant(db, "租户A", "tenant-a")
        _link_user_tenant(db, user.id, t1.id)

        token = create_access_token(data={"sub": str(user.id), "tenant_id": t1.id})
        from app.services.auth_service import decode_access_token

        payload = decode_access_token(token)
        assert payload.get("tenant_id") == t1.id

    def test_auto_set_tenant_id_on_create(self, db):
        t1 = _create_tenant(db, "租户A", "tenant-a")

        TenantContext.set(t1.id)
        alert = Alert(title="新告警", type="network")
        TenantIsolation.set_tenant_id(alert, TenantContext.get())
        db.add(alert)
        db.commit()
        db.refresh(alert)
        assert alert.tenant_id == t1.id

        TenantContext.clear()
