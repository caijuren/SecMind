# SecMind 发版规范（开发人员）

## 版本号规范

采用语义化版本（Semantic Versioning）：**`v主版本.次版本.补丁`**

| 版本位 | 何时 +1 | 示例 |
|:------|:--------|:-----|
| **主版本** | 重大架构重构、不兼容的 API 变更、产品方向调整 | `v2.0.0` → `v3.0.0` |
| **次版本** | 新功能上线、现有功能增强、UI 改版 | `v2.2.0` → `v2.3.0` |
| **补丁** | Bug 修复、安全修复、性能优化 | `v2.2.0` → `v2.2.1` |

预发布版本加后缀：

| 后缀 | 含义 | 示例 |
|:----|:-----|:-----|
| `-rc.1` | 发布候选（Release Candidate） | `v2.3.0-rc.1` |
| `-beta.1` | 公测版本 | `v2.3.0-beta.1` |
| `-alpha.1` | 内测版本 | `v2.3.0-alpha.1` |

---

## 分支策略

采用简化版 Git Flow：

```
main  ────── v2.2.0 ──────────── v2.3.0 ──────── （生产分支）
                \                 /
develop  ─────── x ── x ── x ── x ────────────── （开发分支）
                    \         /
feature/xxx  ─────── x ── x ──                     （功能分支）
                                    \         /
                         hotfix/xxx ── x ── x ──    （紧急修复分支）
```

| 分支 | 命名规则 | 用途 | 合并目标 |
|:----|:--------|:-----|:--------|
| `main` | — | 生产环境代码 | 只接受 tag |
| `develop` | — | 日常开发集成分支 | `main` |
| `feature/*` | `feature/xxx` | 新功能开发 | `develop` |
| `hotfix/*` | `hotfix/xxx` | 紧急 Bug 修复 | `main` + `develop` |

---

## 变更日志规范

遵循 [Keep a Changelog](https://keepachangelog.com/) 格式，每个版本包含以下分类：

```markdown
## [2.3.0] - 2026-06-01

### 新增
- AI 对话式调查新增多轮工具调用
- 报表引擎支持自定义模板

### 优化
- 提升大屏态势感知加载速度
- 优化剧本编辑器拖拽体验

### 修复
- 修复 RBAC 中间件未覆盖部分路由的问题
- 修复 WebSocket 断线重连超时问题

### 安全
- 升级依赖库修复 CVE-2026-XXXX

### 废弃
- 旧版告警列表接口标记为废弃（将在 v3.0 移除）
```

**变更类型说明**：

| 类型 | 对读者含义 | 对版本号影响 |
|:----|:----------|:-----------|
| 新增 | 以前没有的东西，现在有了 | 次版本 +1 |
| 优化 | 已有功能变好了，但用法没变 | 次版本 +1 |
| 修复 | 修了一个 Bug，功能恢复正常 | 补丁 +1 |
| 安全 | 修了一个安全漏洞 | 补丁 +1 |
| 废弃 | 某个功能准备下个大版本删掉 | 次版本 +1 |
| 移除 | 废弃的功能真的删掉了 | 主版本 +1 |

---

## 发版流程

### 常规发版（次版本/补丁）

```
Step 1: 确认 develop 分支功能完整、测试通过
    │
    ▼
Step 2: 更新版本号
    echo "2.3.0" > VERSION
    npm version 2.3.0 --no-git-tag-version --allow-same-version（自动同步前端）
    │
    ▼
Step 3: 更新 CHANGELOG.md
    └─ 在文件顶部插入新版本的变更日志
    │
    ▼
Step 4: 合并到 main
    git checkout main
    git merge develop
    │
    ▼
Step 5: 打标签并推送
    git tag v2.3.0
    git push && git push --tags
    │
    ▼
Step 6: 等待 CI/CD 完成
    └─ GitHub Actions 自动: 构建镜像 → 推送到 Docker Hub → 部署到服务器
    │
    ▼
Step 7: 验证生产环境
    └─ 访问前端页面确认功能正常
    └─ 确认 API 文档可访问
```

### 紧急修复（hotfix）

```
Step 1: 从 main 创建 hotfix 分支
    git checkout main
    git checkout -b hotfix/login-crash
    │
    ▼
Step 2: 修复 Bug + 更新版本号
    # 修代码...
    echo "2.2.1" > VERSION
    │
    ▼
Step 3: 合并到 main 和 develop
    git checkout main
    git merge hotfix/login-crash
    git tag v2.2.1
    git push && git push --tags
    │
    ▼
Step 4: 同步到 develop
    git checkout develop
    git merge hotfix/login-crash
    git push
    │
    ▼
Step 5: 删除 hotfix 分支
    git branch -d hotfix/login-crash
```

### 预发布版本

```bash
# 打 RC 标签（不会触发自动部署到生产）
git tag v2.3.0-rc.1
git push --tags

# 验证通过后，移除 RC 后缀正式发布
git tag v2.3.0
git push --tags
```

---

## 发版检查清单

发版前逐项确认：

### 代码质量
- [ ] 所有测试通过（`npm test` + `pytest`）
- [ ] 前后端构建无报错（`npm run build`）
- [ ] 代码 Review 已完成
- [ ] 无已知 P0/P1 Bug

### 版本管理
- [ ] `VERSION` 文件已更新
- [ ] `CHANGELOG.md` 已更新
- [ ] `frontend/package.json` 版本号与 `VERSION` 一致
- [ ] Git tag 已打

### 数据库
- [ ] 新迁移脚本已生成（`alembic revision --autogenerate`）
- [ ] 迁移脚本已测试（先 upgrade 再 downgrade 验证可回滚）
- [ ] 迁移脚本已提交到代码仓库

### 部署
- [ ] Docker 镜像构建成功
- [ ] 预发布环境验证通过
- [ ] 生产环境备份已完成

---

## 回滚决策标准

出现以下情况应立即回滚：

| 场景 | 严重程度 | 响应时间 |
|:----|:--------|:--------|
| 用户无法登录/注册 | 🔴 P0 | 30 分钟内 |
| 核心功能（告警/处置）不可用 | 🔴 P0 | 30 分钟内 |
| 数据库数据丢失或损坏 | 🔴 P0 | 立即 |
| 页面白屏/500 错误 | 🟠 P1 | 2 小时内 |
| 某个非核心功能异常 | 🟡 P2 | 24 小时内 |

---

## 版本号与分支对应关系

```bash
v2.2.0 ─── main ─── 当前生产版本
    │
    ├── hotfix/v2.2.1 ─── 紧急修复分支
    │
    └── develop ─── v2.3.0 开发中
            │
            ├── feature/ai-chat-enhance
            ├── feature/report-engine
            └── feature/rbac-enforce
```