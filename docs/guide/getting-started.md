# 快速开始

本指南帮助你快速搭建 SecMind 平台并完成首次运行。

## 环境要求

在开始安装之前，请确保你的环境满足以下要求：

| 依赖 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Python | 3.10+ | 3.11+ |
| Node.js | 18+ | 20+ |
| PostgreSQL | 14+ | 16+ |
| Redis | 6+ | 7+ |
| Docker | 20.10+ | 24+ |
| Docker Compose | 2.0+ | 2.20+ |

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/secmind/secmind.git
cd secmind
```

### 2. 使用 Docker Compose 启动（推荐）

这是最快速的启动方式，适合快速体验和开发环境：

```bash
# 复制环境变量配置文件
cp backend/.env.example backend/.env

# 编辑 .env 文件，配置必要的环境变量
# 至少需要配置 LLM API Key
vim backend/.env

# 一键启动所有服务
docker compose -f backend/docker-compose.yml up -d
```

### 3. 初始化数据库

```bash
# 进入后端容器
docker compose -f backend/docker-compose.yml exec backend bash

# 执行数据库迁移
alembic upgrade head

# 初始化种子数据（可选）
python seed_db.py
```

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 5. 访问平台

启动完成后，通过浏览器访问：

- 前端界面：`http://localhost:3000`
- 后端 API：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`

## 首次登录

### 默认管理员账号

系统初始化后会创建默认管理员账号：

- 用户名：`admin`
- 密码：`admin123`

::: warning 安全提示
首次登录后请立即修改默认密码，建议启用双因素认证（2FA）。
:::

### 登录步骤

1. 打开浏览器访问 `http://localhost:3000`
2. 输入默认管理员账号和密码
3. 点击「登录」按钮
4. 进入系统后，前往「系统设置 → 用户管理」修改密码
5. 建议在「系统设置 → 安全设置」中启用双因素认证

### 配置 LLM 服务

登录后首先需要配置 LLM 服务，这是 SecMind AI 分析功能的核心依赖：

1. 进入「系统设置 → AI 模型配置」
2. 选择 LLM 提供商（OpenAI / Azure OpenAI / 本地模型）
3. 填入 API Key 或模型服务地址
4. 点击「测试连接」验证配置
5. 保存配置

详细的 LLM 配置说明请参考 [配置说明](/guide/configuration) 页面。

## 下一步

- 📖 阅读 [安装部署](/guide/installation) 了解生产环境部署方案
- ⚙️ 阅读 [配置说明](/guide/configuration) 了解详细配置项
- 🏗️ 阅读 [架构说明](/guide/architecture) 了解系统架构设计
