# AI Security Analysis API - 使用指南

独立的AI安全分析模块，提供完整的事件分析、Agent协作、证据链生成等功能。

## 🚀 快速启动

### 1. 启动后端服务
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. 启动前端开发服务器
```bash
cd frontend
npm run dev
```

### 3. 访问工作台
打开浏览器访问: http://localhost:3000/ai-analysis

## 📡 API使用示例

### 提交钓鱼邮件告警进行分析

```bash
curl -X POST "http://localhost:8000/api/v1/api-analysis/events" \
-H "Content-Type: application/json" \
-d '{
  "title": "高仿OA系统钓鱼邮件",
  "type": "phishing",
  "severity": "critical",
  "source": "邮件网关",
  "description": "检测到针对财务部门的钓鱼攻击",
  "sender": "it-support@secm1nd.com",
  "recipients": "财务部全员(23人)",
  "spoofed_domain": "secm1nd.com",
  "attachment": "fake-oa-update.exe",
  "user": {
    "name": "王芳",
    "department": "财务部",
    "position": "HRBP"
  }
}'
```

### 批量提交多个告警

```bash
curl -X POST "http://localhost:8000/api/v1/api-analysis/events/batch" \
-H "Content-Type: application/json" \
-d '{
  "alerts": [
    {
      "title": "VPN异地登录",
      "type": "vpn",
      "severity": "critical",
      "source": "VPN网关",
      "username": "admin_zhang",
      "source_ip": "91.234.56.78",
      "location": "俄罗斯·莫斯科"
    },
    {
      "title": "恶意软件检测",
      "type": "malware",
      "severity": "high",
      "source": "EDR终端",
      "hostname": "PC-MARKETING-012",
      "process_name": "microsoft_update.exe",
      "malware_family": "Cobalt Strike"
    }
  ]
}'
```

### 获取所有待分析事件

```bash
curl "http://localhost:8000/api/v1/api-analysis/events?limit=10&severity=critical"
```

### 生成模拟数据（用于测试）

```bash
curl -X POST "http://localhost:8000/api/v1/api-analysis/simulate/generate-sample-events?count=5"
```

### 查看统计信息

```bash
curl "http://localhost:8000/api/v1/api-analysis/stats"
```

### 健康检查

```bash
curl "http://localhost:8000/api/v1/api-analysis/health"
```

## 🎯 前端集成方式

### 方式1：REST API轮询（当前实现）

前端通过 `fetch` 定期调用API获取新事件。

**优点：** 简单易用，兼容性好  
**缺点：** 有延迟（取决于轮询间隔）

### 方式2：WebSocket实时推送（推荐生产环境）

后续可升级为WebSocket，实现真正的实时推送。

**优点：** 实时性强，节省带宽  
**缺点：** 实现复杂度稍高

## 🏗️ 架构设计

### 数据流

```
┌─────────────┐     HTTP/WebSocket      ┌──────────────────┐
│   前端UI    │ ◄───────────────────► │   后端API        │
│ (工作台)    │                        │ (ai_analysis)    │
└─────────────┘                        └────────┬─────────┘
                                               │
                                               ▼
                                        ┌──────────────────┐
                                        │  AI分析引擎       │
                                        │ (analysis_engine) │
                                        └────────┬─────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    ▼            ▼            ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ SOC Agent│ │Identity  │ │Threat    │
                              │          │ │ Agent    │ │Intel     │
                              └──────────┘ └──────────┘ │Agent    │
                                                    └──────────┘
```

### 核心组件

1. **ai_analysis_engine.py** - AI引擎核心
   - 多Agent协作逻辑
   - 推理步骤生成
   - 证据链构建
   - 结论生成

2. **ai_analysis.py** - API路由层
   - RESTful接口
   - 数据验证
   - 错误处理
   - 统计和监控

3. **前端 page.tsx** - UI展示层
   - 双模式支持（演示/真实）
   - 动画效果
   - 错误处理
   - 用户体验优化

## 🔧 配置说明

### 环境变量（可选）

在 `.env` 中添加：
```env
# AI分析配置
AI_ANALYSIS_MAX_EVENTS=100          # 内存中最大存储事件数
AI_ANALYSIS_AUTO_GENERATE=true      # 是否自动生成示例数据
AI_ANALYSIS_INTERVAL_MS=2500         # 分析步骤间隔时间
```

## 📊 监控指标

通过 `/stats` 接口可获取：
- 总分析事件数
- 按严重程度分布
- 按来源分布
- 平均置信度
- 平均风险评分

## ⚠️ 注意事项

1. **内存限制**: 当前版本使用内存存储，重启会丢失数据。生产环境应使用Redis或数据库。

2. **并发控制**: 未实现并发锁，高频提交可能导致竞争条件。建议添加队列机制。

3. **AI模型**: 当前为模拟逻辑，可替换为真实LLM调用（如OpenAI、本地模型）。

4. **安全性**: API未添加认证中间件，生产环境需配合JWT/OAuth2使用。

## 🎨 自定义扩展

### 添加新的告警类型

在 `ai_analysis_engine.py` 的 `analyze_alert()` 方法中添加新的分支：

```python
elif "ransomware" in alert_type:
    steps = cls._analyze_ransomware_alert(alert)
    source_icon = "ShieldAlert"
    source_color = "#ef4444"
    category = "勒索软件"
```

### 添加新的Agent

在 `AGENTS` 字典中注册：

```python
"new_agent": {
    "name": "New Agent",
    icon: "NewIcon",  # lucide-react图标名
    color: "#hexcolor",
    "role": "Agent职责描述"
}
```

## 📞 技术支持

如有问题，请查看：
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/v1/api-analysis/health
- 日志输出: 终端console

## 📝 更新日志

### v3.0.0 (2026-05-11)
- ✅ 初始版本发布
- ✅ 独立API模块
- ✅ 多Agent协作分析
- ✅ 前端双模式支持
- ✅ 完整的CRUD接口
- ✅ 示例数据生成
