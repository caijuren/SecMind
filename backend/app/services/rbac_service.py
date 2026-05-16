from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.rbac import Role, Permission, role_permissions, user_roles
from app.models.user import User


SYSTEM_ROLES = [
    {"name": "admin", "display_name": "管理员", "description": "系统管理员，拥有所有权限", "permissions": ["*:*"]},
    {"name": "analyst", "display_name": "安全分析师", "description": "可调查分析、执行处置", "permissions": [
        "alerts:read", "alerts:write",
        "response:read", "response:write", "response:execute",
        "hunting:read", "hunting:write",
        "dashboard:read", "dashboard:write",
        "reports:read", "reports:write",
        "playbooks:read", "playbooks:write",
        "users:read",
        "settings:read",
        "integrations:read",
        "ioc:read", "ioc:write",
        "ai:read", "ai:write",
        "email:read", "vpn:read", "brute_force:read",
        "devices:read",
        "tickets:read", "tickets:write",
        "compliance:read",
        "strategies:read",
        "collaboration:read", "collaboration:write",
        "documents:read",
    ]},
    {"name": "viewer", "display_name": "只读观察者", "description": "仅可查看数据，不可操作", "permissions": [
        "alerts:read",
        "response:read",
        "hunting:read",
        "dashboard:read",
        "reports:read",
        "playbooks:read",
        "users:read",
        "settings:read",
        "integrations:read",
        "ioc:read",
        "ai:read",
        "email:read", "vpn:read", "brute_force:read",
        "devices:read",
        "tickets:read",
        "compliance:read",
        "strategies:read",
        "collaboration:read",
        "documents:read",
    ]},
    {"name": "soc_manager", "display_name": "SOC主管", "description": "可管理团队和审批处置", "permissions": [
        "alerts:read", "alerts:write",
        "response:read", "response:write", "response:execute",
        "hunting:read", "hunting:write",
        "dashboard:read", "dashboard:write",
        "reports:read", "reports:write",
        "playbooks:read", "playbooks:write",
        "users:read", "users:write",
        "settings:read", "settings:write",
        "integrations:read", "integrations:write",
        "ioc:read", "ioc:write",
        "ai:read", "ai:write",
        "email:read", "vpn:read", "brute_force:read",
        "devices:read", "devices:write",
        "tickets:read", "tickets:write",
        "compliance:read", "compliance:write",
        "strategies:read", "strategies:write",
        "collaboration:read", "collaboration:write",
        "documents:read", "documents:write",
        "rbac:read", "tenants:read", "billing:read",
    ]},
]

RESOURCE_ACTIONS = [
    ("alerts", "read", "查看告警"), ("alerts", "write", "编辑告警"),
    ("response", "read", "查看处置"), ("response", "write", "编辑处置"), ("response", "execute", "执行处置"),
    ("hunting", "read", "查看狩猎"), ("hunting", "write", "创建/编辑假设"),
    ("dashboard", "read", "查看仪表盘"), ("dashboard", "write", "编辑仪表盘"),
    ("reports", "read", "查看报表"), ("reports", "write", "创建/编辑报表"),
    ("playbooks", "read", "查看剧本"), ("playbooks", "write", "创建/编辑剧本"),
    ("users", "read", "查看用户"), ("users", "write", "编辑用户"),
    ("settings", "read", "查看系统设置"), ("settings", "write", "修改系统设置"),
    ("integrations", "read", "查看集成"), ("integrations", "write", "配置集成"),
    ("contacts", "read", "查看联系表单"), ("contacts", "write", "提交联系表单"),
    ("devices", "read", "查看设备"), ("devices", "write", "编辑设备"),
    ("tickets", "read", "查看工单"), ("tickets", "write", "编辑工单"),
    ("email", "read", "查看邮件日志"),
    ("vpn", "read", "查看VPN日志"),
    ("brute_force", "read", "查看暴力破解日志"),
    ("ioc", "read", "查看威胁情报"), ("ioc", "write", "编辑威胁情报"),
    ("ai", "read", "查看AI分析"), ("ai", "write", "执行AI分析"),
    ("compliance", "read", "查看合规"), ("compliance", "write", "编辑合规"),
    ("strategies", "read", "查看策略"), ("strategies", "write", "编辑策略"),
    ("collaboration", "read", "查看协作"), ("collaboration", "write", "编辑协作"),
    ("documents", "read", "查看文档"), ("documents", "write", "编辑文档"),
    ("rbac", "read", "查看权限"), ("rbac", "write", "管理权限"),
    ("tenants", "read", "查看租户"), ("tenants", "write", "管理租户"),
    ("billing", "read", "查看账单"), ("billing", "write", "管理账单"),
    ("*", "*", "超级权限"),
]


def seed_rbac(db: Session) -> None:
    existing_perms = db.query(Permission).count()
    if existing_perms > 0:
        return

    perm_map: Dict[str, Permission] = {}
    for resource, action, desc in RESOURCE_ACTIONS:
        p = Permission(resource=resource, action=action, description=desc)
        db.add(p)
        perm_map[f"{resource}:{action}"] = p

    db.flush()

    for role_def in SYSTEM_ROLES:
        role = Role(
            name=role_def["name"],
            display_name=role_def["display_name"],
            description=role_def["description"],
            is_system=1,
        )
        db.add(role)
        db.flush()

        for perm_code in role_def["permissions"]:
            if perm_code == "*:*":
                all_perms = db.query(Permission).all()
                role.permissions.extend(all_perms)
            elif perm_code in perm_map:
                role.permissions.append(perm_map[perm_code])

    db.commit()


def get_roles(db: Session, skip: int = 0, limit: int = 50) -> List[Role]:
    return db.query(Role).options(joinedload(Role.permissions)).order_by(Role.id.asc()).offset(skip).limit(limit).all()


def get_role_by_id(db: Session, role_id: int) -> Optional[Role]:
    return db.query(Role).filter(Role.id == role_id).first()


def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    return db.query(Role).filter(Role.name == name).first()


def create_role(db: Session, name: str, display_name: str, description: Optional[str] = None, permission_ids: Optional[List[int]] = None) -> Role:
    role = Role(name=name, display_name=display_name, description=description, is_system=0)
    if permission_ids:
        perms = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        role.permissions.extend(perms)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(db: Session, role_id: int, update_data: dict) -> Optional[Role]:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return None
    if "display_name" in update_data and update_data["display_name"] is not None:
        role.display_name = update_data["display_name"]
    if "description" in update_data and update_data["description"] is not None:
        role.description = update_data["description"]
    if "permission_ids" in update_data and update_data["permission_ids"] is not None:
        role.permissions = []
        db.flush()
        perms = db.query(Permission).filter(Permission.id.in_(update_data["permission_ids"])).all()
        role.permissions.extend(perms)
    db.commit()
    db.refresh(role)
    return role


def delete_role(db: Session, role_id: int) -> bool:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role or role.is_system:
        return False
    db.delete(role)
    db.commit()
    return True


def get_permissions(db: Session) -> List[Permission]:
    return db.query(Permission).order_by(Permission.resource, Permission.action).all()


def assign_user_roles(db: Session, user_id: int, role_ids: List[int]) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    user.roles = roles
    db.commit()
    db.refresh(user)
    return user


def get_user_permissions(db: Session, user_id: int) -> Dict[str, Any]:
    user = db.query(User).options(
        joinedload(User.roles).joinedload(Role.permissions)
    ).filter(User.id == user_id).first()
    if not user:
        return {"user_id": user_id, "roles": [], "permissions": []}

    role_names = [r.name for r in user.roles]
    perm_codes = set()
    for role in user.roles:
        for perm in role.permissions:
            if perm.resource == "*" and perm.action == "*":
                perm_codes.add("*:*")
            else:
                perm_codes.add(f"{perm.resource}:{perm.action}")

    return {
        "user_id": user_id,
        "roles": role_names,
        "permissions": sorted(perm_codes),
    }


def check_permission(db: Session, user_id: int, resource: str, action: str) -> bool:
    perms = get_user_permissions(db, user_id)
    if "*:*" in perms["permissions"]:
        return True
    return f"{resource}:{action}" in perms["permissions"] or f"{resource}:*" in perms["permissions"]
