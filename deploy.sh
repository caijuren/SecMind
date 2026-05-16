#!/bin/bash
set -e

# SecMind 部署脚本
# 用法:
#   ./deploy.sh v2.3.0              # 部署指定版本
#   ./deploy.sh v2.2.0 rollback     # 回滚到指定版本
#
# 前置条件:
#   1. 服务器已安装 docker 和 docker-compose
#   2. 已配置 .env 文件（含 DOCKER_USERNAME、POSTGRES_PASSWORD、SECRET_KEY）

if [ -z "$1" ]; then
  echo "用法: ./deploy.sh <版本号> [rollback]"
  echo "示例: ./deploy.sh v2.3.0"
  exit 1
fi

APP_VERSION="${1#v}"
MODE="${2:-deploy}"

# 加载环境变量
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

export APP_VERSION
export DOCKER_USERNAME=${DOCKER_USERNAME:-secmind}
export FRONTEND_PORT=${FRONTEND_PORT:-3000}
export BACKEND_PORT=${BACKEND_PORT:-8000}

echo "=========================================="
if [ "$MODE" = "rollback" ]; then
  echo "  回滚到版本: v${APP_VERSION}"
else
  echo "  部署版本: v${APP_VERSION}"
fi
echo "=========================================="

# 拉取镜像
echo "拉取镜像..."
docker pull ${DOCKER_USERNAME}/secmind-backend:${APP_VERSION}
docker pull ${DOCKER_USERNAME}/secmind-frontend:${APP_VERSION}

# 启动服务
echo "启动服务..."
docker-compose up -d

# 等待后端就绪
echo "等待后端就绪..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ 后端启动超时，请检查日志: docker-compose logs backend"
    exit 1
  fi
  sleep 2
done

# 执行数据库迁移
echo "执行数据库迁移..."
docker exec secmind-backend alembic upgrade head 2>/dev/null || echo "⚠️  数据库迁移跳过（可能是首次部署）"

# 清理旧镜像
echo "清理旧镜像..."
docker image prune -f > /dev/null 2>&1 || true

echo "=========================================="
echo "✅ 部署完成！"
echo "   前端: http://localhost:${FRONTEND_PORT:-3000}"
echo "   后端: http://localhost:${BACKEND_PORT:-8000}"
echo "   API:  http://localhost:${BACKEND_PORT:-8000}/api"
echo "=========================================="