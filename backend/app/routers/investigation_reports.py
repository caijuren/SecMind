"""
研判报告 API 路由
提供研判报告的生成、查询和导出接口
"""

import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.investigation_report import InvestigationReportDB
from app.services.investigation_report import (
    investigation_report_service,
    InvestigationReport,
    ImpactAnalysis,
    Conclusion,
    Recommendation,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/investigation-reports", tags=["研判报告"])


# ==================== 请求模型 ====================

class GenerateReportRequest(BaseModel):
    """生成研判报告请求"""
    alert_data: dict = Field(..., description="告警数据")
    analysis_result: dict = Field(default_factory=dict, description="AI分析结果")


class GenerateReportResponse(BaseModel):
    """生成研判报告响应"""
    report: InvestigationReport
    message: str = "研判报告生成成功"


class ReportListResponse(BaseModel):
    """报告列表响应"""
    items: list[dict]
    total: int
    page: int
    page_size: int


class ExportReportResponse(BaseModel):
    """导出报告响应"""
    content: str
    format: str
    filename: str


# ==================== API 端点 ====================

@router.post("/generate", response_model=GenerateReportResponse)
async def generate_report(request: GenerateReportRequest):
    """
    生成新的研判报告

    接收告警数据和AI分析结果，生成包含影响分析、结论判定和处置建议的完整报告。
    """
    try:
        report = await investigation_report_service.generate_report(
            alert_data=request.alert_data,
            analysis_result=request.analysis_result,
        )
        return GenerateReportResponse(report=report)
    except Exception as e:
        logger.error("生成研判报告失败: %s", str(e))
        raise HTTPException(status_code=500, detail=f"生成研判报告失败: {str(e)}")


@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    verdict: Optional[str] = Query(None, description="按判定结果筛选: TP/FP/BP/INC"),
    severity: Optional[str] = Query(None, description="按严重程度筛选"),
    db: Session = Depends(get_db),
):
    """
    获取研判报告列表

    支持分页和按判定结果、严重程度筛选。
    """
    try:
        query = db.query(InvestigationReportDB)

        if verdict:
            query = query.filter(InvestigationReportDB.verdict == verdict)
        if severity:
            query = query.filter(InvestigationReportDB.severity == severity)

        query = query.order_by(InvestigationReportDB.created_at.desc())

        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()

        item_dicts = []
        for item in items:
            item_dicts.append({
                "id": item.id,
                "alert_id": item.alert_id,
                "title": item.title,
                "verdict": item.verdict,
                "severity": item.severity,
                "confidence": item.confidence,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            })

        return ReportListResponse(
            items=item_dicts,
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        logger.error("获取报告列表失败: %s", str(e))
        raise HTTPException(status_code=500, detail=f"获取报告列表失败: {str(e)}")


@router.get("/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """
    获取指定研判报告详情

    返回完整的研判报告，包含影响分析、结论和建议。
    """
    report = db.query(InvestigationReportDB).filter(InvestigationReportDB.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"报告 {report_id} 不存在")

    # 从 report_data 字段返回完整报告
    if report.report_data:
        return report.report_data

    # 如果 report_data 为空，从各字段组装
    return {
        "id": report.id,
        "alert_id": report.alert_id,
        "title": report.title,
        "verdict": report.verdict,
        "severity": report.severity,
        "confidence": report.confidence,
        "impact": report.impact_data,
        "conclusion": report.conclusion_data,
        "recommendations": report.recommendations_data,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


@router.post("/{report_id}/export", response_model=ExportReportResponse)
async def export_report(report_id: int, db: Session = Depends(get_db)):
    """
    导出研判报告为 Markdown 格式

    将报告内容格式化为可读的 Markdown 文本。
    """
    report = db.query(InvestigationReportDB).filter(InvestigationReportDB.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"报告 {report_id} 不存在")

    try:
        # 从数据库记录组装报告数据
        impact_data = report.impact_data or {}
        conclusion_data = report.conclusion_data or {}
        recommendations_data = report.recommendations_data or []

        # 生成 Markdown 内容
        md_lines = []
        md_lines.append(f"# {report.title or '研判报告'}")
        md_lines.append("")
        md_lines.append(f"**报告ID**: {report.id}")
        md_lines.append(f"**关联告警ID**: {report.alert_id or '无'}")
        md_lines.append(f"**生成时间**: {report.created_at.isoformat() if report.created_at else '未知'}")
        md_lines.append(f"**报告版本**: 1.0")
        md_lines.append("")

        # 结论部分
        md_lines.append("---")
        md_lines.append("## 一、研判结论")
        md_lines.append("")
        verdict = conclusion_data.get("verdict", report.verdict or "未知")
        verdict_display = conclusion_data.get("verdict_display", verdict)
        md_lines.append(f"**判定结果**: {verdict_display} ({verdict})")
        md_lines.append(f"**置信度**: {conclusion_data.get('confidence', report.confidence or 0)}%")
        md_lines.append(f"**严重程度**: {conclusion_data.get('severity', report.severity or '未知')}")
        md_lines.append(f"**结论摘要**: {conclusion_data.get('summary', '无')}")
        md_lines.append("")

        key_findings = conclusion_data.get("key_findings", [])
        if key_findings:
            md_lines.append("### 关键发现")
            for i, finding in enumerate(key_findings, 1):
                md_lines.append(f"{i}. {finding}")
            md_lines.append("")

        # 影响分析部分
        md_lines.append("---")
        md_lines.append("## 二、影响分析")
        md_lines.append("")

        affected_systems = impact_data.get("affected_systems", [])
        if affected_systems:
            md_lines.append(f"**受影响系统**: {', '.join(affected_systems)}")
        affected_users = impact_data.get("affected_users", [])
        if affected_users:
            md_lines.append(f"**受影响用户**: {', '.join(affected_users)}")

        md_lines.append(f"**数据泄露风险**: {impact_data.get('data_exposure_risk', '未知')}")
        md_lines.append(f"**业务影响**: {impact_data.get('business_impact', '未知')}")
        md_lines.append(f"**横向移动风险**: {impact_data.get('lateral_movement_risk', '未知')}")
        md_lines.append(f"**爆炸半径**: {impact_data.get('blast_radius_description', '无')}")
        md_lines.append("")

        # 处置建议部分
        md_lines.append("---")
        md_lines.append("## 三、处置建议")
        md_lines.append("")

        category_names = {
            "containment": "遏制",
            "eradication": "根除",
            "recovery": "恢复",
            "evidence_preservation": "证据保全",
        }
        priority_names = {
            "immediate": "立即",
            "high": "高",
            "medium": "中",
            "low": "低",
        }

        for i, rec in enumerate(recommendations_data, 1):
            category = rec.get("category", "containment")
            priority = rec.get("priority", "medium")
            md_lines.append(f"### {i}. {rec.get('action', '未知动作')}")
            md_lines.append(f"- **优先级**: {priority_names.get(priority, priority)}")
            md_lines.append(f"- **类别**: {category_names.get(category, category)}")
            md_lines.append(f"- **描述**: {rec.get('description', '无')}")
            md_lines.append(f"- **负责角色**: {rec.get('responsible_role', '安全运营团队')}")
            md_lines.append("")

        md_lines.append("---")
        md_lines.append(f"*报告由 SecMind AI安全运营平台自动生成*")

        content = "\n".join(md_lines)
        filename = f"investigation_report_{report_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.md"

        return ExportReportResponse(
            content=content,
            format="markdown",
            filename=filename,
        )
    except Exception as e:
        logger.error("导出报告失败: %s", str(e))
        raise HTTPException(status_code=500, detail=f"导出报告失败: {str(e)}")

