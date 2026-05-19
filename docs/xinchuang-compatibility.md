# SecMind 信创兼容性改造方案

## 一、信创背景

信创（信息技术应用创新）要求核心软硬件实现自主可控。SecMind 作为安全运营平台，需要适配国产 CPU、操作系统、数据库和中间件。

## 二、当前技术栈与信创替代方案

| 组件 | 当前方案 | 信创替代方案 | 兼容难度 |
|------|---------|-------------|:---:|
| **CPU** | x86_64 | ARM64 (鲲鹏/飞腾) | 低 |
| **操作系统** | Ubuntu/CentOS | openEuler、麒麟 V10、UOS | 中 |
| **数据库** | PostgreSQL 14 | 人大金仓 KingbaseES、达梦 DM8、GaussDB | 高 |
| **缓存** | Redis 6+ | Redis（已支持 ARM64） | 低 |
| **Python** | 3.10+ | 3.10+（信创系统原生支持） | 低 |
| **Node.js** | 20+ | 20+（信创系统需单独安装） | 低 |
| **Web 服务器** | Uvicorn | Uvicorn + Gunicorn | 低 |
| **反向代理** | Nginx | Nginx / TongHttpServer | 低 |

## 三、改造路线图

### 第一阶段：操作系统适配（优先级 P0）

**目标**：在 openEuler / 麒麟 V10 上正常运行

**改造内容**：
1. 编写信创系统依赖安装脚本
2. 适配 systemd 服务单元文件
3. 测试 Python/Node.js 运行时兼容性
4. 调整文件路径（信创系统目录结构差异）

**关键步骤**：
```bash
# openEuler 依赖安装
dnf install -y python3.10 python3.10-devel gcc gcc-c++ make
dnf install -y postgresql14 postgresql14-devel redis
dnf install -y nodejs

# 麒麟 V10 依赖安装  
apt install -y python3.10 python3.10-dev build-essential
apt install -y postgresql-14 postgresql-server-dev-14 redis-server
apt install -y nodejs npm
```

### 第二阶段：数据库适配（优先级 P1）

**目标**：支持人大金仓 / 达梦数据库

**改造内容**：
1. 抽象数据库连接层，支持多数据库驱动
2. SQL 方言适配（KingbaseES 兼容 PostgreSQL，改动较小）
3. 达梦 DM8 ORM 驱动适配（需重写部分 SQLAlchemy 代码）
4. 迁移脚本编写

**推荐方案**：优先适配 KingbaseES（PostgreSQL 兼容模式），改动量最小。

```python
# 数据库连接适配示例
# config.py
DB_TYPE = os.getenv("DB_TYPE", "postgresql")  # postgresql | kingbase | dm8

DATABASE_URLS = {
    "postgresql": "postgresql://user:pass@host:5432/db",
    "kingbase": "kingbase+psycopg2://user:pass@host:54321/db",
    "dm8": "dm+dmPython://user:pass@host:5236/db",
}
```

### 第三阶段：全栈信创验证（优先级 P2）

**目标**：完整的信创环境部署验证

**验证环境**：
| 组件 | 信创方案 |
|------|---------|
| CPU | 鲲鹏 920 (ARM64) |
| 操作系统 | openEuler 22.03 LTS |
| 数据库 | KingbaseES V8 |
| 缓存 | Redis 6.2 |
| Web 服务 | TongHttpServer / Nginx |

## 四、Docker Compose 信创版

```yaml
version: "3.8"
services:
  db:
    image: kingbase/kb:v8r6
    environment:
      DB_MODE: pg
      DB_USER: secmind
      DB_PASSWORD: ${DB_PASSWORD:?必须设置 DB_PASSWORD}
    ports:
      - "54321:54321"
    volumes:
      - kingbase_data:/home/kingbase/userdata

  redis:
    image: redis:6.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:?必须设置 REDIS_PASSWORD}
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    platform: linux/arm64
    environment:
      DATABASE_URL: kingbase+psycopg2://secmind:${DB_PASSWORD}@db:54321/secmind
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    platform: linux/arm64
    ports:
      - "3000:3000"

volumes:
  kingbase_data:
```

## 五、兼容性测试矩阵

| 操作系统 | 数据库 | CPU 架构 | 状态 |
|---------|--------|---------|:---:|
| openEuler 22.03 | KingbaseES V8 | ARM64 | 待验证 |
| 麒麟 V10 SP3 | KingbaseES V8 | ARM64 | 待验证 |
| 麒麟 V10 SP3 | 达梦 DM8 | x86_64 | 待验证 |
| UOS 20 | KingbaseES V8 | ARM64 | 待验证 |
| openEuler 22.03 | PostgreSQL 14 | ARM64 | 待验证 |

## 六、注意事项

1. **Python 依赖编译**：部分 Python 包（如 psycopg2）需要 C 编译器，信创系统需确保 gcc 可用
2. **ARM64 容器镜像**：Docker 构建需指定 `platform: linux/arm64`
3. **SSL 证书**：信创系统可能使用国密 SM2 证书，需适配 Python ssl 模块
4. **时区配置**：信创系统需正确配置 Asia/Shanghai 时区
5. **日志编码**：信创系统默认编码可能为 GBK/GB2312，Python 需确保 UTF-8 输出
6. **性能基准**：ARM64 架构下 Python 性能可能有 5-10% 差异，需重新压测

## 七、参考资源

- openEuler 官方文档：https://www.openeuler.org/
- 人大金仓适配指南：https://www.kingbase.com.cn/
- 达梦数据库开发指南：https://www.dameng.com/
- 麒麟软件适配中心：https://www.kylinos.cn/