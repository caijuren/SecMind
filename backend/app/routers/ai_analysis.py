"""
AI Security Analysis API Router - 独立模块
提供完整的安全事件AI分析接口
"""

from typing import Optional, List
from datetime import datetime
import random
import json

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel

from app.services.ai_analysis_engine import (
    AIAnalysisEngine,
    SecurityEvent,
    AIAnalysisResponse,
    AnalysisStatus,
)

router = APIRouter(
    prefix="/api/ai-analysis", 
    tags=["AI Security Analysis"],
    responses={404: {"description": "Not found"}},
)


# ==================== 请求/响应模型 ====================

class AlertInput(BaseModel):
    """前端提交的原始告警数据"""
    title: str
    type: str  # phishing, vpn, malware, dlp, etc.
    severity: str = "high"  # low, medium, high, critical
    source: str = "未知系统"
    description: Optional[str] = None
    
    # 可选的用户上下文
    user: Optional[dict] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    location: Optional[str] = None
    
    # 钓鱼邮件特有字段
    sender: Optional[str] = None
    recipients: Optional[str] = None
    spoofed_domain: Optional[str] = None
    attachment: Optional[str] = None
    
    # VPN特有字段
    actual_location: Optional[str] = None
    user_status: Optional[str] = None
    
    # 恶意软件特有字段
    hostname: Optional[str] = None
    process_name: Optional[str] = None
    parent_process: Optional[str] = None
    c2_address: Optional[str] = None
    malware_family: Optional[str] = None


class BatchAnalyzeRequest(BaseModel):
    """批量分析请求"""
    alerts: List[AlertInput]


# ==================== 存储层（模拟）====================

# 内存存储（生产环境应使用Redis/数据库）
analysis_events_store: List[SecurityEvent] = []
analysis_status = AnalysisStatus(
    isAnalyzing=False,
    currentEventIndex=0,
    totalEvents=0,
    currentStep=0,
    totalSteps=0
)


# ==================== API 端点 ====================

@router.get("/events", response_model=AIAnalysisResponse)
async def get_analysis_events(
    limit: int = Query(10, ge=1, le=50, description="返回事件数量"),
    severity: Optional[str] = Query(None, description="按严重程度筛选"),
    status: Optional[str] = Query(None, description="按状态筛选: pending/analyzing/completed"),
    source: Optional[str] = Query(None, description="按来源筛选")
):
    """
    获取待分析的AI安全事件列表
    
    支持多种筛选条件，返回格式与前端完全兼容
    """
    
    try:
        events = analysis_events_store.copy()
        
        # 应用筛选条件
        if severity:
            events = [e for e in events if e.severity == severity.lower()]
        if source:
            events = [e for e in events if e.source == source]
        
        # 限制返回数量
        events = events[:limit]
        
        return AIAnalysisResponse(
            events=events,
            total=len(events),
            hasMore=len(analysis_events_store) > limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取事件失败: {str(e)}")


@router.get("/events/{event_id}", response_model=SecurityEvent)
async def get_event_detail(event_id: str):
    """获取单个事件的详细分析结果"""
    
    for event in analysis_events_store:
        if event.id == event_id or event.eventId == event_id:
            return event
            
    raise HTTPException(status_code=404, detail=f"事件 {event_id} 不存在")


@router.post("/events", response_model=SecurityEvent)
async def submit_alert_for_analysis(alert: AlertInput, background_tasks: BackgroundTasks):
    """
    提交新告警进行AI分析
    
    接收原始告警数据，调用AI引擎生成完整的分析流程
    """
    try:
        # 转换为字典（Pydantic model -> dict）
        alert_dict = alert.model_dump()
        
        # 调用AI分析引擎
        event = await AIAnalysisEngine.analyze_alert(alert_dict)
        
        # 存储到内存（生产环境应存入数据库）
        analysis_events_store.append(event)
        
        # 保持存储上限（避免内存溢出）
        if len(analysis_events_store) > 100:
            analysis_events_store.pop(0)
        
        # 更新全局状态
        global analysis_status
        analysis_status.isAnalyzing = True
        analysis_status.totalEvents = len(analysis_events_store)
        
        return event
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/events/batch", response_model=AIAnalysisResponse)
async def batch_analyze_alerts(request: BatchAnalyzeRequest):
    """
    批量提交多个告警进行分析
    
    适用于批量导入或历史数据回溯分析
    """
    try:
        events = []
        
        for alert in request.alerts:
            alert_dict = alert.model_dump()
            event = await AIAnalysisEngine.analyze_alert(alert_dict)
            events.append(event)
            
            # 存储
            analysis_events_store.append(event)
        
        # 保持存储上限
        while len(analysis_events_store) > 100:
            analysis_events_store.pop(0)
        
        return AIAnalysisResponse(
            events=events,
            total=len(events),
            hasMore=False
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")


@router.get("/status", response_model=AnalysisStatus)
async def get_analysis_status():
    """
    获取当前AI分析状态
    
    用于前端显示进度和状态指示器
    """
    return analysis_status


@router.post("/events/{event_id}/reanalyze", response_model=SecurityEvent)
async def reanalyze_event(event_id: str):
    """
    重新分析某个事件
    
    使用最新的AI模型和情报库重新生成分析结果
    """
    # 查找原事件
    original_event = None
    for i, event in enumerate(analysis_events_store):
        if event.id == event_id or event.eventId == event_id:
            original_event = event
            break
    
    if not original_event:
        raise HTTPException(status_code=404, detail=f"事件 {event_id} 不存在")
    
    try:
        # 从结论中提取基本信息重新构造alert
        alert_data = {
            "title": original_event.title,
            "type": original_event.category,
            "severity": original_event.severity,
            "source": original_event.source,
            "description": original_event.description
        }
        
        # 重新分析
        new_event = await AIAnalysisEngine.analyze_alert(alert_data)
        
        # 替换旧事件
        for i, event in enumerate(analysis_events_store):
            if event.id == event_id or event.eventId == event_id:
                analysis_events_store[i] = new_event
                break
        
        return new_event
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重新分析失败: {str(e)}")


@router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    """
    删除已分析的事件
    
    用于清理测试数据或用户手动删除
    """
    global analysis_events_store
    
    initial_count = len(analysis_events_store)
    analysis_events_store = [
        e for e in analysis_events_store 
        if e.id != event_id and e.eventId != event_id
    ]
    
    if len(analysis_events_store) == initial_count:
        raise HTTPException(status_code=404, detail=f"事件 {event_id} 不存在")
    
    return {
        "success": True,
        "message": f"事件 {event_id} 已删除",
        "remaining": len(analysis_events_store)
    }


@router.get("/stats")
async def get_analysis_statistics():
    """
    获取AI分析统计信息
    
    用于仪表盘展示和分析报告
    """
    if not analysis_events_store:
        return {
            "total_analyzed": 0,
            "by_severity": {},
            "by_source": {},
            "avg_confidence": 0,
            "avg_risk_score": 0,
            "recent_24h": 0
        }
    
    # 统计严重程度分布
    by_severity = {}
    for event in analysis_events_store:
        by_severity[event.severity] = by_severity.get(event.severity, 0) + 1
    
    # 统计来源分布
    by_source = {}
    for event in analysis_events_store:
        by_source[event.source] = by_source.get(event.source, 0) + 1
    
    # 计算平均值
    avg_confidence = sum(e.conclusion.confidence for e in analysis_events_store) / len(analysis_events_store)
    avg_risk_score = sum(e.conclusion.riskScore for e in analysis_events_store) / len(analysis_events_store)
    
    return {
        "total_analyzed": len(analysis_events_store),
        "by_severity": by_severity,
        "by_source": by_source,
        "avg_confidence": round(avg_confidence, 1),
        "avg_risk_score": round(avg_risk_score, 1),
        "recent_24h": len([e for e in analysis_events_store])  # 模拟：假设都是近24小时
    }


@router.post("/simulate/generate-sample-events")
async def generate_sample_events(count: int = Query(5, ge=1, le=20)):
    """
    生成模拟安全事件（用于演示和测试）
    
    自动创建各种类型的真实感告警数据
    """
    sample_alerts = [
        # 钓鱼邮件
        {
            "title": "高仿OA系统钓鱼邮件攻击",
            "type": "phishing",
            "severity": "critical",
            "source": "邮件网关",
            "description": "检测到针对财务部门的大规模钓鱼攻击",
            "sender": "it-support@secm1nd.com",
            "recipients": "财务部全员(23人)",
            "spoofed_domain": "secm1nd.com",
            "attachment": "fake-oa-update.exe",
            "user": {"name": "王芳", "department": "财务部", "position": "HRBP"}
        },
        # VPN异常
        {
            "title": "VPN异常地理位置登录",
            "type": "vpn",
            "severity": "critical",
            "source": "VPN网关",
            "description": "检测到管理员账号从俄罗斯登录",
            "username": "admin_zhang",
            "source_ip": "91.234.56.78",
            "location": "俄罗斯·莫斯科",
            "actual_location": "北京办公室",
            "user_status": "休假中",
            "user": {"name": "张伟", "department": "IT部", "position": "IT总监"}
        },
        # 恶意软件
        {
            "title": "Cobalt Strike Beacon检测",
            "type": "malware",
            "severity": "critical",
            "source": "EDR终端",
            "description": "市场部PC发现APT级别恶意软件",
            "hostname": "PC-MARKETING-012",
            "process_name": "microsoft_update.exe",
            "parent_process": "Word.exe",
            "c2_address": "203.0.113.55:443",
            "malware_family": "Cobalt Strike 4.7",
            "known_c2": True,
            "apt_group": "APT-29"
        },
        # DLP数据泄露
        {
            "title": "敏感代码外传至个人网盘",
            "type": "dlp",
            "severity": "high",
            "source": "DLP系统",
            "description": "研发人员试图外传核心源代码",
            "user": {"name": "李明", "department": "研发中心", "position": "高级工程师"}
        },
        # SSH暴力破解
        {
            "title": "SSH暴力破解尝试",
            "type": "bruteforce",
            "severity": "high",
            "source": "WAF防火墙",
            "description": "生产服务器遭受14,000+次SSH暴力破解",
            "hostname": "prod-server-03"
        }
    ]
    
    created_events = []
    
    for i in range(min(count, len(sample_alerts))):
        alert_data = sample_alerts[i % len(sample_alerts)]
        event = await AIAnalysisEngine.analyze_alert(alert_data)
        analysis_events_store.append(event)
        created_events.append(event)
    
    return {
        "success": True,
        "message": f"成功生成 {len(created_events)} 个模拟事件",
        "events_created": len(created_events),
        "total_in_queue": len(analysis_events_store)
    }


@router.get("/health")
async def health_check():
    """
    健康检查端点
    
    用于监控和负载均衡器探测
    """
    return {
        "status": "healthy",
        "service": "AI Security Analysis Engine",
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat(),
        "events_in_memory": len(analysis_events_store),
        "is_analyzing": analysis_status.isAnalyzing
    }
