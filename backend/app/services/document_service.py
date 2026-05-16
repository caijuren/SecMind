from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.document import Document

SEED_DOCUMENTS = [
    {
        "title": "API 认证",
        "slug": "api-auth",
        "category": "api-reference",
        "content": """# API 认证

SecMind API 使用 JWT (JSON Web Token) 进行身份认证。

## 获取 Token

```
POST /api/v1/auth/login
```

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**响应：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

## 使用 Token

在请求头中携带 Token：

```
Authorization: Bearer <access_token>
```

## Token 有效期

- Access Token 有效期：24小时
- 过期后需要重新登录获取新 Token
""",
        "format": "markdown",
        "order": 1,
        "status": "published",
        "author": "system",
        "tags": ["api", "authentication"],
    },
    {
        "title": "告警 API",
        "slug": "api-alerts",
        "category": "api-reference",
        "content": """# 告警 API

## 获取告警列表

```
GET /api/v1/alerts
```

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| skip | int | 跳过记录数 |
| limit | int | 返回记录数 |
| severity | string | 严重级别过滤 |
| source | string | 来源过滤 |

## 获取单个告警

```
GET /api/v1/alerts/{alert_id}
```

## 创建告警

```
POST /api/v1/alerts
```

**请求体：**
```json
{
  "title": "异常登录检测",
  "severity": "high",
  "source": "EDR",
  "description": "检测到异常登录行为"
}
```
""",
        "format": "markdown",
        "order": 2,
        "status": "published",
        "author": "system",
        "tags": ["api", "alerts"],
    },
    {
        "title": "RBAC 权限 API",
        "slug": "api-rbac",
        "category": "api-reference",
        "content": """# RBAC 权限 API

## 初始化权限系统

```
POST /api/v1/rbac/seed
```

首次使用需要初始化权限系统，创建4个系统角色和25个权限。

## 角色管理

```
GET    /api/v1/rbac/roles          # 获取角色列表
POST   /api/v1/rbac/roles          # 创建角色
PUT    /api/v1/rbac/roles/{id}     # 更新角色
```

## 权限查询

```
GET /api/v1/rbac/permissions       # 获取权限列表
GET /api/v1/rbac/users/{id}/permissions  # 获取用户权限
```

## 系统角色

| 角色 | 说明 | 权限数 |
|------|------|--------|
| admin | 超级管理员 | 25 (全部) |
| soc_manager | SOC经理 | 17 |
| analyst | 安全分析师 | 13 |
| viewer | 只读用户 | 7 |

## 权限格式

权限格式为 `resource:action`，如 `alerts:read`、`alerts:write`。
支持通配符：`*:*` 表示所有权限，`alerts:*` 表示告警模块所有权限。
""",
        "format": "markdown",
        "order": 3,
        "status": "published",
        "author": "system",
        "tags": ["api", "rbac"],
    },
    {
        "title": "多租户 API",
        "slug": "api-tenants",
        "category": "api-reference",
        "content": """# 多租户 API

## 租户管理

```
GET    /api/v1/tenants                    # 租户列表
POST   /api/v1/tenants                    # 创建租户
GET    /api/v1/tenants/{id}               # 获取租户
PUT    /api/v1/tenants/{id}               # 更新租户
```

## 配额查询

```
GET /api/v1/tenants/{id}/quota
```

返回当前用量和配额上限。

## 成员管理

```
GET    /api/v1/tenants/{id}/members       # 成员列表
POST   /api/v1/tenants/{id}/members       # 添加成员
DELETE /api/v1/tenants/{id}/members/{uid} # 移除成员
```

## 订阅管理

```
GET  /api/v1/tenants/{id}/subscription    # 获取订阅
POST /api/v1/tenants/{id}/subscription    # 创建订阅
```

## 套餐说明

| 套餐 | 价格/月 | 用户数 | 告警/天 | API调用/天 |
|------|---------|--------|---------|------------|
| free | 免费 | 5 | 100 | 1,000 |
| starter | ¥299 | 20 | 1,000 | 10,000 |
| professional | ¥999 | 100 | 10,000 | 100,000 |
| enterprise | ¥4,999 | 无限 | 无限 | 无限 |
""",
        "format": "markdown",
        "order": 4,
        "status": "published",
        "author": "system",
        "tags": ["api", "tenants"],
    },
    {
        "title": "账单与转化 API",
        "slug": "api-billing",
        "category": "api-reference",
        "content": """# 账单与转化 API

## 试用状态

```
GET /api/v1/billing/tenants/{id}/trial-status
```

返回试用状态、剩余天数、是否过期。

## 转化预览

```
GET /api/v1/billing/tenants/{id}/conversion-preview?target_plan=professional
```

返回升级费用预览，包含按天折算金额。

## 订单管理

```
POST  /api/v1/billing/tenants/{id}/orders   # 创建订单
GET   /api/v1/billing/tenants/{id}/orders   # 订单列表
GET   /api/v1/billing/orders/{id}           # 订单详情
POST  /api/v1/billing/orders/{id}/pay       # 模拟支付
POST  /api/v1/billing/orders/{id}/cancel    # 取消订单
```

## 发票管理

```
POST /api/v1/billing/orders/{id}/invoice    # 申请发票
GET  /api/v1/billing/tenants/{id}/invoices  # 发票列表
```

发票包含6%增值税，自动计算税额和总额。
""",
        "format": "markdown",
        "order": 5,
        "status": "published",
        "author": "system",
        "tags": ["api", "billing"],
    },
    {
        "title": "WebSocket 通知",
        "slug": "api-websocket",
        "category": "api-reference",
        "content": """# WebSocket 通知

## 连接

```
ws://localhost:8000/api/v1/ws/notifications?token=<jwt_token>
```

通过 JWT Token 进行身份认证。

## 消息格式

服务端推送消息格式：

```json
{
  "type": "notification",
  "data": {
    "id": 1,
    "type": "alert",
    "title": "新告警",
    "content": "检测到异常登录行为",
    "is_read": false
  }
}
```

## 心跳

服务端每30秒发送 ping，客户端需回复 pong 保持连接。

## 消息类型

| 类型 | 说明 |
|------|------|
| notification | 新通知 |
| alert | 安全告警 |
| system | 系统消息 |
""",
        "format": "markdown",
        "order": 6,
        "status": "published",
        "author": "system",
        "tags": ["api", "websocket"],
    },
]


def seed_documents(db: Session) -> int:
    count = 0
    for doc_data in SEED_DOCUMENTS:
        existing = db.query(Document).filter(Document.slug == doc_data["slug"]).first()
        if not existing:
            doc = Document(**doc_data)
            db.add(doc)
            count += 1
    db.commit()
    return count


def get_documents(db: Session, category: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    query = db.query(Document)
    if category:
        query = query.filter(Document.category == category)
    if status:
        query = query.filter(Document.status == status)
    total = query.count()
    items = query.order_by(Document.order, Document.id).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


def get_document_by_slug(db: Session, slug: str) -> Optional[Document]:
    return db.query(Document).filter(Document.slug == slug).first()


def get_document_by_id(db: Session, doc_id: int) -> Optional[Document]:
    return db.query(Document).filter(Document.id == doc_id).first()


def create_document(db: Session, data: dict) -> Document:
    doc = Document(**data)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def update_document(db: Session, doc_id: int, data: dict) -> Optional[Document]:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(doc, key, value)
    doc.version = (doc.version or 0) + 1
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, doc_id: int) -> bool:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True


def search_documents(db: Session, query: str, limit: int = 20) -> List[Document]:
    return db.query(Document).filter(
        Document.status == "published",
        or_(
            Document.title.contains(query),
            Document.content.contains(query),
        )
    ).order_by(Document.order).limit(limit).all()


def get_categories(db: Session) -> List[Dict[str, Any]]:
    results = db.query(Document.category).filter(Document.status == "published").distinct().all()
    return [{"name": r[0]} for r in results]
