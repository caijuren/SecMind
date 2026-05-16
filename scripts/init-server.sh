#!/bin/bash
set -e

# SecMind 服务器初始化脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/你的仓库/SecMind/main/scripts/init-server.sh | bash
# 或者: bash init-server.sh
#
# 作用: 在一台新服务器上一键部署 SecMind

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  SecMind 服务器初始化脚本${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ---------- 检查系统 ----------
if [ "$EUID" -eq 0 ]; then
  log_error "请勿使用 root 用户运行，请用普通用户 + sudo"
  exit 1
fi

OS=""
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
fi

log_info "系统: $OS $(uname -m)"

# ---------- 安装 Docker ----------
install_docker() {
  log_info "检查 Docker..."
  if command -v docker &>/dev/null; then
    DOCKER_VER=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    log_ok "Docker 已安装: v$DOCKER_VER"
  else
    log_info "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sudo bash
    sudo usermod -aG docker $USER
    log_ok "Docker 安装完成（可能需要重新登录生效）"
  fi
}

# ---------- 安装 Docker Compose ----------
install_compose() {
  log_info "检查 Docker Compose..."
  if docker compose version &>/dev/null; then
    COMPOSE_VER=$(docker compose version --short)
    log_ok "Docker Compose 已安装: $COMPOSE_VER"
  else
    log_info "正在安装 Docker Compose..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin || {
      sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose
    }
    log_ok "Docker Compose 安装完成"
  fi
}

# ---------- 检查端口 ----------
check_port() {
  local port=$1
  local name=$2
  if ss -tlnp "sport = :$port" 2>/dev/null | grep -q .; then
    log_warn "端口 $port ($name) 已被占用，请设置 ${name}_PORT 环境变量避开"
    return 1
  fi
  return 0
}

# ---------- 交互式配置 ----------
setup_config() {
  echo ""
  log_info "开始配置 SecMind 环境变量"
  echo ""

  # 部署目录
  DEPLOY_DIR="/opt/secmind"
  read -p "部署目录 [$DEPLOY_DIR]: " input_dir
  DEPLOY_DIR="${input_dir:-$DEPLOY_DIR}"

  # Docker Hub 用户名
  read -p "Docker Hub 用户名: " DOCKER_USERNAME
  while [ -z "$DOCKER_USERNAME" ]; do
    log_error "Docker Hub 用户名不能为空"
    read -p "Docker Hub 用户名: " DOCKER_USERNAME
  done

  # 数据库密码
  POSTGRES_PASSWORD=$(openssl rand -base64 24 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
  log_info "数据库密码已自动生成: $POSTGRES_PASSWORD"

  # Secret Key
  SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 44)
  log_info "JWT密钥已自动生成"

  # 端口
  echo ""
  log_info "检查端口占用..."

  FRONTEND_PORT=3000
  BACKEND_PORT=8000

  if ! check_port 3000 "前端"; then
    read -p "请输入前端端口 [3005]: " input_port
    FRONTEND_PORT="${input_port:-3005}"
  fi
  if ! check_port 8000 "后端"; then
    read -p "请输入后端端口 [8005]: " input_port
    BACKEND_PORT="${input_port:-8005}"
  fi

  # 确认
  echo ""
  echo -e "${CYAN}========================================${NC}"
  echo "部署目录:     $DEPLOY_DIR"
  echo "Docker 用户:   $DOCKER_USERNAME"
  echo "前端端口:     $FRONTEND_PORT"
  echo "后端端口:     $BACKEND_PORT"
  echo -e "${CYAN}========================================${NC}"
  echo ""
  read -p "确认以上配置？(Y/n): " confirm
  if [[ "$confirm" =~ ^[Nn] ]]; then
    log_error "已取消"
    exit 1
  fi
}

# ---------- 部署 ----------
deploy() {
  log_info "创建目录: $DEPLOY_DIR"
  sudo mkdir -p "$DEPLOY_DIR"
  sudo chown $USER:$USER "$DEPLOY_DIR"

  cd "$DEPLOY_DIR"

  # 下载 docker-compose.yml
  log_info "下载 docker-compose.yml..."
  if [ -f "/Users/grubby/Desktop/SecMind/docker-compose.yml" ]; then
    cp /Users/grubby/Desktop/SecMind/docker-compose.yml ./
  else
    curl -fsSL -o docker-compose.yml \
      https://raw.githubusercontent.com/你的仓库/SecMind/main/docker-compose.yml
  fi

  # 下载 deploy.sh
  log_info "下载 deploy.sh..."
  if [ -f "/Users/grubby/Desktop/SecMind/deploy.sh" ]; then
    cp /Users/grubby/Desktop/SecMind/deploy.sh ./
  else
    curl -fsSL -o deploy.sh \
      https://raw.githubusercontent.com/你的仓库/SecMind/main/deploy.sh
  fi
  chmod +x deploy.sh

  # 创建 .env
  log_info "创建 .env 文件..."
  cat > .env << EOF
DOCKER_USERNAME=${DOCKER_USERNAME}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
SECRET_KEY=${SECRET_KEY}
FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}
EOF

  # 拉取镜像
  log_info "拉取最新镜像..."
  docker compose pull

  # 启动
  log_info "启动服务..."
  docker compose up -d

  # 等待就绪
  log_info "等待后端就绪（最多 60 秒）..."
  for i in $(seq 1 30); do
    if curl -sf http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
      log_ok "后端就绪"
      break
    fi
    if [ "$i" -eq 30 ]; then
      log_error "后端启动超时，请检查日志: docker compose logs backend"
      exit 1
    fi
    sleep 2
  done

  # 数据库迁移
  log_info "执行数据库迁移..."
  docker exec secmind-backend alembic upgrade head 2>/dev/null || log_warn "数据库迁移跳过"

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}  ✅ SecMind 部署完成！${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "  前端:  http://localhost:${FRONTEND_PORT}"
  echo "  后端:  http://localhost:${BACKEND_PORT}"
  echo "  API:   http://localhost:${BACKEND_PORT}/api"
  echo ""
  echo "  部署脚本: ./deploy.sh"
  echo "  日志查看: docker compose logs -f"
  echo "  停止服务: docker compose down"
  echo ""
  echo -e "${YELLOW}  首次使用请访问前端地址注册管理员账号${NC}"
  echo ""
}

# ---------- 主流程 ----------
install_docker
install_compose
setup_config
deploy