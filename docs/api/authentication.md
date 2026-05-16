# 认证鉴权

SecMind API 使用 JWT（JSON Web Token）进行认证鉴权。

## 认证方式

### JWT Bearer Token

所有 API 请求需要在请求头中携带 JWT Token：

```bash
curl -X GET https://api.secmind.example.com/api/alerts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### API Key

对于服务间调用，支持使用 API Key 认证：

```bash
curl -X GET https://api.secmind.example.com/api/alerts \
  -H "X-API-Key: sk-secmind-xxxxxxxxxxxx"
```

## 获取 Token

### 用户登录

```bash
POST /api/auth/login
```

请求体：

```json
{
  "username": "admin@company.com",
  "password": "your-password"
}
```

成功响应：

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### 刷新 Token

```bash
POST /api/auth/refresh
```

请求体：

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

成功响应：

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### SSO 登录

```bash
POST /api/auth/sso/callback
```

请求体：

```json
{
  "provider": "azure_ad",
  "code": "authorization-code-from-sso",
  "redirect_uri": "https://secmind.example.com/auth/callback"
}
```

成功响应：

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "usr_001",
      "email": "admin@company.com",
      "name": "安全管理员"
    }
  }
}
```

## API Key 管理

### 创建 API Key

```bash
POST /api/auth/api-keys
```

请求体：

```json
{
  "name": "CI/CD 集成",
  "description": "用于自动化流水线的 API Key",
  "permissions": [
    "alerts:read",
    "reports:read",
    "reports:export"
  ],
  "expires_at": "2025-12-31T23:59:59Z"
}
```

成功响应：

```json
{
  "data": {
    "id": "key_001",
    "name": "CI/CD 集成",
    "key": "sk-secmind-xxxxxxxxxxxx",
    "permissions": ["alerts:read", "reports:read", "reports:export"],
    "created_at": "2024-01-15T08:00:00Z",
    "expires_at": "2025-12-31T23:59:59Z"
  }
}
```

::: danger 注意
API Key 仅在创建时显示一次，请妥善保存。
:::

### 列出 API Keys

```bash
GET /api/auth/api-keys
```

### 删除 API Key

```bash
DELETE /api/auth/api-keys/{key_id}
```

## Token 有效期

| Token 类型 | 有效期 | 说明 |
|-----------|--------|------|
| `access_token` | 1 小时 | 访问令牌，用于 API 请求认证 |
| `refresh_token` | 7 天 | 刷新令牌，用于获取新的访问令牌 |
| `api_key` | 自定义 | 服务间调用，可设置过期时间 |

可通过环境变量调整：

```bash
JWT_EXPIRATION_MINUTES=60
REFRESH_TOKEN_EXPIRATION_DAYS=7
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `AUTH_FAILED` | 401 | 用户名或密码错误 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 |
| `TOKEN_INVALID` | 401 | Token 无效 |
| `PERMISSION_DENIED` | 403 | 权限不足 |
| `ACCOUNT_DISABLED` | 403 | 账户已禁用 |
| `SSO_PROVIDER_ERROR` | 400 | SSO 提供商返回错误 |
