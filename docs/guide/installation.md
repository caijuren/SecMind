# 安装部署

本文档介绍 SecMind 平台的多种部署方式，包括 Docker 部署和手动部署。

## 环境要求

| 项目 | 要求 |
|:----|:-----|
| 操作系统 | Linux (Ubuntu 20.04+ / CentOS 7+) |
| Docker | 20.10+（推荐 24.0+） |
| Docker Compose | 2.0+（推荐 2.20+） |
| CPU | 2 核+ |
| 内存 | 4 GB+ |
| 磁盘 | 20 GB+ |

## Docker 部署（推荐）

Docker 部署是最简便的方式，适合开发、测试和生产环境。

### 方式一：一键初始化（推荐）

```bash
# 下载脚本
curl -fsSL -o init-server.sh \
  https://raw.githubusercontent.com/your-org/secmind/main/scripts/init-server.sh

# 运行（交互式配置）
bash init-server.sh
```

脚本会自动完成：安装 Docker → 配置环境变量 → 拉取镜像 → 启动服务 → 执行数据库迁移。

### 方式二：手动部署

#### 1. 准备配置文件

```bash
# 克隆项目
git clone https://github.com/secmind/secmind.git
cd secmind

# 复制环境变量模板
cp backend/.env.example backend/.env
```

#### 2. 配置环境变量

编辑 `backend/.env` 文件，根据实际情况修改以下关键配置：

```bash
# 数据库配置
DATABASE_URL=postgresql://secmind:your_password@postgres:5432/secmind

# Redis 配置
REDIS_URL=redis://redis:6379/0

# LLM 配置
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4

# 安全配置
SECRET_KEY=your-secret-key-change-this
JWT_SECRET=your-jwt-secret-change-this

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker compose -f backend/docker-compose.yml up -d --build

# 查看服务状态
docker compose -f backend/docker-compose.yml ps

# 查看日志
docker compose -f backend/docker-compose.yml logs -f
```

#### 4. 初始化

```bash
# 执行数据库迁移
docker compose -f backend/docker-compose.yml exec backend alembic upgrade head

# 初始化管理员账号和种子数据
docker compose -f backend/docker-compose.yml exec backend python seed_db.py
```

### 服务架构

Docker Compose 会启动以下服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| backend | 8000 | FastAPI 后端服务 |
| frontend | 3000 | Next.js 前端服务 |
| postgres | 5432 | PostgreSQL 数据库 |
| redis | 6379 | Redis 缓存 |

### 生产环境优化

```bash
# 使用生产环境配置启动
docker compose -f backend/docker-compose.yml -f backend/docker-compose.prod.yml up -d
```

生产环境配置包含：
- Nginx 反向代理与 SSL 终止
- 数据库连接池优化
- 日志持久化与轮转
- 健康检查与自动重启
- 资源限制配置

## 手动部署

手动部署适合需要精细控制的环境，或无法使用 Docker 的场景。

### 后端部署

#### 1. 安装 Python 依赖

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### 2. 配置数据库

```bash
# 创建 PostgreSQL 数据库
createdb -U postgres secmind

# 执行数据库迁移
alembic upgrade head
```

#### 3. 启动后端服务

```bash
# 开发模式
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式（使用 Gunicorn + Uvicorn workers）
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 前端部署

#### 1. 安装依赖并构建

```bash
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build
```

#### 2. 启动前端服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run start
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name secmind.example.com;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 版本升级

### 自动升级（有 CI/CD）

```bash
# 本地开发机操作
echo "2.3.0" > VERSION
git add VERSION && git commit -m "chore: bump version to 2.3.0"
git tag v2.3.0
git push && git push --tags
```

GitHub Actions 自动完成：构建镜像 → 推送到 Docker Hub → SSH 到服务器 → 拉取新镜像 → 重启容器 → 数据库迁移。

### 手动升级（无 CI/CD）

```bash
# 服务器上操作
cd /opt/secmind
./deploy.sh v2.3.0
```

## 回滚

### 方式一：部署脚本回滚

```bash
cd /opt/secmind
./deploy.sh v2.2.0 rollback
```

脚本会自动：拉取旧版本镜像 → 重启容器 → 等待就绪。

### 方式二：Git 回退

```bash
# 1. 回退代码
git revert v2.3.0
git push

# 2. 服务器上重新部署
cd /opt/secmind
docker compose pull
docker compose up -d
```

### 方式三：数据库回滚

如果版本升级涉及数据库 schema 变更，需要额外回滚数据库：

```bash
# 查看迁移历史
docker exec secmind-backend alembic history

# 回退一级
docker exec secmind-backend alembic downgrade -1

# 回退到指定版本
docker exec secmind-backend alembic downgrade <revision_id>
```

> **注意**：回滚数据库是破坏性操作，可能导致数据丢失。建议先备份：
> ```bash
> docker exec secmind-postgres pg_dump -U secmind secmind > backup_$(date +%Y%m%d).sql
> ```

## 日常运维

### 查看状态

```bash
# 容器状态
docker compose ps

# 实时日志
docker compose logs -f

# 单个服务日志
docker compose logs -f backend
docker compose logs -f frontend
```

### 启停服务

```bash
docker compose stop       # 停止
docker compose start      # 启动
docker compose restart    # 重启
docker compose down       # 停止并删除容器（数据卷保留）
```

### 备份与恢复

```bash
# 备份数据库
docker exec secmind-postgres pg_dump -U secmind secmind > backup.sql

# 恢复数据库
cat backup.sql | docker exec -i secmind-postgres psql -U secmind secmind
```

### 查看版本

```bash
curl http://localhost:8000/
# 返回: {"message":"SecMind AI安全运营平台 API","version":"2.2.0"}
```

## 端口冲突处理

如果服务器上已有其他应用占用了默认端口，修改 `.env` 文件：

```bash
# /opt/secmind/.env
FRONTEND_PORT=3005     # 前端换到 3005
BACKEND_PORT=8005      # 后端换到 8005
```

修改后重启：

```bash
docker compose down
docker compose up -d
```

## 环境变量说明

### 核心配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | 是 | - | PostgreSQL 连接字符串 |
| `REDIS_URL` | 是 | - | Redis 连接字符串 |
| `SECRET_KEY` | 是 | - | 应用密钥，用于加密签名 |
| `JWT_SECRET` | 是 | - | JWT 令牌签名密钥 |
| `JWT_EXPIRATION_MINUTES` | 否 | 60 | JWT 令牌过期时间（分钟） |
| `DOCKER_USERNAME` | 否 | - | Docker Hub 用户名（用于拉取私有镜像） |
| `POSTGRES_PASSWORD` | 否 | - | PostgreSQL 数据库密码（自动生成） |
| `FRONTEND_PORT` | 否 | 3000 | 前端服务映射端口 |
| `BACKEND_PORT` | 否 | 8000 | 后端服务映射端口 |

### LLM 配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `LLM_PROVIDER` | 是 | - | LLM 提供商：openai / azure / local |
| `OPENAI_API_KEY` | 条件 | - | OpenAI API Key |
| `OPENAI_MODEL` | 否 | gpt-4 | 使用的模型名称 |
| `OPENAI_BASE_URL` | 否 | - | 自定义 API 端点 |
| `AZURE_OPENAI_ENDPOINT` | 条件 | - | Azure OpenAI 端点 |
| `AZURE_OPENAI_KEY` | 条件 | - | Azure OpenAI API Key |
| `LOCAL_LLM_URL` | 条件 | - | 本地模型服务地址 |

### 安全设备集成

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `SIEM_URL` | 否 | - | SIEM 平台地址 |
| `SIEM_API_KEY` | 否 | - | SIEM API 密钥 |
| `EDR_URL` | 否 | - | EDR 平台地址 |
| `EDR_API_KEY` | 否 | - | EDR API 密钥 |
| `FIREWALL_API_URL` | 否 | - | 防火墙 API 地址 |

### 日志与监控

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `LOG_LEVEL` | 否 | INFO | 日志级别 |
| `SENTRY_DSN` | 否 | - | Sentry 错误追踪 DSN |
| `PROMETHEUS_PORT` | 否 | 9090 | Prometheus 指标端口 |

## 健康检查

部署完成后，可通过以下方式验证服务状态：

```bash
# 检查后端健康状态
curl http://localhost:8000/health

# 检查前端是否响应
curl -I http://localhost:3000

# 检查数据库连接
docker compose -f backend/docker-compose.yml exec backend python -c \
  "from app.database import engine; engine.connect(); print('DB OK')"
```

## 常见问题

### 容器启动后马上退出

```bash
docker compose logs backend
# 查看是否有数据库连接错误或配置错误
```

### 数据库迁移失败

```bash
# 检查迁移历史
docker exec secmind-backend alembic history

# 手动执行迁移
docker exec secmind-backend alembic upgrade head
```

### 镜像拉取失败

检查 Docker Hub 登录状态和网络：

```bash
docker logout
docker login
docker compose pull
```

### 前端访问报错

检查后端是否正常、前端环境变量是否配置正确：

```bash
# 确认后端可访问
curl http://localhost:8000/health

# 查看前端日志
docker compose logs frontend
```