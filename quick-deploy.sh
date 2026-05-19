#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 docker，请先安装 Docker。"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未检测到 docker compose 插件，请先安装 docker compose。"
  exit 1
fi

PUBLIC_IP="${1:-}"
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP="$(hostname -I | awk '{print $1}')"
fi

ENV_FILE="$ROOT_DIR/.env"

generate_secret() {
  python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
}

if [ ! -f "$ENV_FILE" ]; then
  echo "未找到 .env，正在自动生成..."
  cat > "$ENV_FILE" <<EOF
APP_VERSION=2.3.0
FRONTEND_PORT=3002
BACKEND_PORT=8001
NEXT_PUBLIC_API_BASE_URL=http://${PUBLIC_IP}:8001/api/v1
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:8001/api/v1
CORS_ORIGINS=http://${PUBLIC_IP}:3002
POSTGRES_PASSWORD=$(generate_secret)
REDIS_PASSWORD=$(generate_secret)
SECRET_KEY=$(generate_secret)
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
EOF
  echo "已生成 .env"
fi

echo "开始构建并启动 SecMind..."
docker compose -f docker-compose.prod.yml up -d --build

echo "等待后端健康检查..."
for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:8001/health" >/dev/null 2>&1; then
    echo "后端已就绪"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "后端启动超时，请执行：docker compose -f docker-compose.prod.yml logs -f backend"
    exit 1
  fi
  sleep 2
done

echo ""
echo "部署完成："
echo "前端访问地址: http://${PUBLIC_IP}:3002"
echo "后端健康检查: http://${PUBLIC_IP}:8001/health"
echo ""
echo "常用命令："
echo "查看状态: docker compose -f docker-compose.prod.yml ps"
echo "查看日志: docker compose -f docker-compose.prod.yml logs -f"
echo "停止服务: docker compose -f docker-compose.prod.yml down"
