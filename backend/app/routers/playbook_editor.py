from fastapi import APIRouter

router = APIRouter(prefix="/playbook-editor", tags=["剧本编辑器"])

NODE_TEMPLATES = [
    {
        "type": "trigger",
        "label": "信号触发",
        "icon": "trigger",
        "category": "触发器",
        "description": "当满足条件时启动剧本",
        "templates": [
            {"id": "trigger-alert", "label": "告警触发", "detail": "当新告警产生时触发", "icon": "trigger"},
            {"id": "trigger-schedule", "label": "定时触发", "detail": "按计划时间周期触发", "icon": "trigger"},
            {"id": "trigger-webhook", "label": "Webhook触发", "detail": "外部系统推送触发", "icon": "trigger"},
            {"id": "trigger-manual", "label": "手动触发", "detail": "人工手动启动剧本", "icon": "trigger"},
        ],
    },
    {
        "type": "condition",
        "label": "条件判断",
        "icon": "condition",
        "category": "逻辑",
        "description": "基于条件分支选择不同处理路径",
        "templates": [
            {"id": "cond-severity", "label": "严重级别判断", "detail": "根据告警严重级别分支", "icon": "condition"},
            {"id": "cond-confidence", "label": "置信度判断", "detail": "根据AI置信度分支", "icon": "condition"},
            {"id": "cond-type", "label": "攻击类型判断", "detail": "根据攻击类型分支", "icon": "condition"},
            {"id": "cond-source", "label": "来源判断", "detail": "根据信号来源分支", "icon": "condition"},
        ],
    },
    {
        "type": "action",
        "label": "执行动作",
        "icon": "action",
        "category": "动作",
        "description": "自动执行安全响应动作",
        "templates": [
            {"id": "act-freeze", "label": "冻结账号", "detail": "禁用被盗用的用户账号", "icon": "action"},
            {"id": "act-isolate", "label": "隔离设备", "detail": "将受控设备从网络隔离", "icon": "action"},
            {"id": "act-block-ip", "label": "封禁IP", "detail": "在防火墙封禁攻击源IP", "icon": "action"},
            {"id": "act-reset-pwd", "label": "重置凭证", "detail": "重置VPN密码/MFA令牌", "icon": "action"},
            {"id": "act-forensic", "label": "保全取证", "detail": "远程采集内存镜像和日志", "icon": "action"},
        ],
    },
    {
        "type": "approval",
        "label": "人工审批",
        "icon": "approval",
        "category": "审批",
        "description": "需要人工审批后才能继续",
        "templates": [
            {"id": "approve-soc", "label": "SOC经理审批", "detail": "SOC经理审核后执行", "icon": "approval"},
            {"id": "approve-admin", "label": "管理员审批", "detail": "系统管理员审核后执行", "icon": "approval"},
        ],
    },
    {
        "type": "notify",
        "label": "通知",
        "icon": "notify",
        "category": "通知",
        "description": "发送通知给相关人员",
        "templates": [
            {"id": "notify-email", "label": "邮件通知", "detail": "发送邮件通知", "icon": "notify"},
            {"id": "notify-dingtalk", "label": "钉钉通知", "detail": "钉钉机器人推送", "icon": "notify"},
            {"id": "notify-webhook", "label": "Webhook通知", "detail": "推送到外部系统", "icon": "notify"},
        ],
    },
    {
        "type": "delay",
        "label": "延时等待",
        "icon": "delay",
        "category": "控制",
        "description": "等待指定时间后继续",
        "templates": [
            {"id": "delay-minutes", "label": "等待N分钟", "detail": "等待指定分钟后继续", "icon": "delay"},
        ],
    },
]


@router.get("/templates")
def get_templates():
    return NODE_TEMPLATES


@router.get("/templates/{category}")
def get_templates_by_category(category: str):
    for group in NODE_TEMPLATES:
        if group["type"] == category:
            return group
    return {"type": category, "templates": []}
