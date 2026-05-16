# SecMind - AI 驱动的智能安全运营平台

<div align="center">

![SecMind](https://img.shields.io/badge/SecMind-AI%20Security%20Platform-22d3ee?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.2.0-22d3ee?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-22d3ee?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-22d3ee?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-22d3ee?style=for-the-badge)

**SecMind** 是一款将大语言模型与安全运营深度融合的智能安全运营平台，实现从信号接入、AI调查、案件研判到自动处置的全链路智能化安全运营。

[功能介绍](https://github.com/caijuren/SecMind#核心功能) •
[快速开始](https://github.com/caijuren/SecMind#快速开始) •
[文档中心](https://github.com/caijuren/SecMind#文档) •
[版本历史](CHANGELOG.md)

</div>

---

## 🌟 核心功能

### 🤖 AI 智能推理
- 大语言模型驱动，自动分析安全信号
- 推理攻击意图，识别真正威胁
- 基于 MITRE ATT&CK 框架映射攻击链

### ⚡ AI 自动处置
- 基于置信度的自动处置策略
- 支持冻结账号、隔离设备、封禁IP等多种动作
- 完整的回滚机制保障安全

### 🔍 自主调查
- AI 自主完成深度调查
- 生成攻击链与推理结论
- 分析师仅需复核关键决策

### 📊 证据链构建
- 跨数据源自动关联
- 构建完整攻击证据链
- 研判有据可依

### 🔄 案件研判闭环
- 从调查到案件到处置的完整闭环
- 确保每个威胁都可追溯可响应
- 人工反馈驱动持续优化

### 📈 持续学习
- 人工反馈驱动 AI 模型持续优化
- 准确率随使用不断提升
- 运营效率 10 倍提升

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose (可选)

### 安装部署

```bash
# 克隆项目
git clone https://github.com/caijuren/SecMind.git
cd SecMind

# 前端安装和启动
cd frontend
npm install
npm run dev

# 后端安装和启动 (新终端)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker 部署

```bash
cd backend
docker-compose up -d
```

访问 `http://localhost:3000` 查看应用。

---

## 📖 文档

详细的文档中心请访问我们的在线文档：

- **产品介绍** - [https://secMind.ai/docs](https://github.com/caijuren/SecMind/docs)
- **使用指南** - [https://secMind.ai/docs/guide](https://github.com/caijuren/SecMind/docs/guide)

### 文档目录

| 模块 | 说明 |
|------|------|
| [快速入门](docs/guide#快速入门) | 平台概述、快速上手指南 |
| [态势感知](docs/guide#态势感知) | 运营概览、通知中心、运营指标 |
| [安全运营](docs/guide#安全运营) | 信号接入、AI调查、案件管理、AI处置、威胁狩猎 |
| [AI 引擎](docs/guide#ai-引擎) | 反馈学习、AI知识库、工作流编排 |
| [平台管理](docs/guide#平台管理) | 数据源管理、资产管理、用户管理、集成管理、系统设置 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      SecMind Platform                        │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   前端 (Next.js 16)                                             │
│   - 运营概览  - AI调查  - 案件管理  - AI处置  - 反馈学习        │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                      API Gateway (FastAPI)                     │
│   - 认证授权  - 数据聚合  - AI 调度  - 事件处理               │
├─────────────────────────────────────────────────────────────┤
│                    AI Engine (LLM)                            │
│   - 信号推理  - 攻击研判  - 攻击链还原  - 处置建议             │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   数据源接入                                                      │
│   - EDR  - VPN  - 防火墙  - 邮件网关  - DNS  - IAM            │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

---

## 📊 性能指标

| 指标 | 数值 |
|------|------|
| 告警降噪率 | 99% |
| 自动化处置率 | 85% |
| 运营效率提升 | 10x |
| AI 持续监控 | 24/7 |

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 16
- **UI**: React 19, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **状态**: Zustand
- **图标**: Lucide React

### 后端
- **框架**: FastAPI, Python 3.10+
- **数据库**: SQLite (开发), PostgreSQL (生产)
- **AI**: OpenAI GPT-4 / Claude
- **认证**: JWT, OAuth2

---

## 📝 版本历史

查看完整的版本历史和更新日志：[CHANGELOG.md](CHANGELOG.md)

### 最新版本 v2.2.0

- ✅ 完整的文档中心上线
- ✅ AI 信号推理引擎
- ✅ 攻击研判引擎
- ✅ 自主调查系统
- ✅ 证据链自动构建
- ✅ 案件研判闭环
- ✅ AI 自动处置

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📧 联系我们

- **邮箱**: contact@secMind.ai
- **官网**: https://secMind.ai
- **文档**: https://secMind.ai/docs

---

<div align="center">

**让安全运营更智能** 🚀

*Built with ❤️ by SecMind Team*

</div>
