from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Literal

from app.services.report_engine import report_engine, REPORT_TEMPLATES
from app.database import get_db

router = APIRouter(prefix="/reports", tags=["报表"])


class GenerateReportRequest(BaseModel):
    template_id: str
    title: Optional[str] = None
    params: Optional[dict] = None


class GenerateComplianceReportRequest(BaseModel):
    framework: Literal["mlps", "gdpr", "iso27001"]
    title: Optional[str] = None


class ExportReportRequest(BaseModel):
    template_id: str
    format: Literal["json", "csv"] = "json"
    params: Optional[dict] = None


COMPLIANCE_TEMPLATE_MAP = {
    "mlps": "mlps_compliance",
    "gdpr": "gdpr_compliance",
    "iso27001": "iso27001_compliance",
}


@router.get("/compliance/templates")
def list_compliance_templates():
    compliance_template_ids = ["mlps_compliance", "gdpr_compliance", "iso27001_compliance"]
    all_templates = report_engine.list_templates()
    compliance_templates = [t for t in all_templates if t["id"] in compliance_template_ids]
    return {"templates": compliance_templates}


@router.post("/compliance/generate")
async def generate_compliance_report(body: GenerateComplianceReportRequest, db: Session = Depends(get_db)):
    template_id = COMPLIANCE_TEMPLATE_MAP.get(body.framework)
    if not template_id:
        raise HTTPException(
            status_code=400,
            detail=f"未知合规框架: {body.framework}，可用框架: {list(COMPLIANCE_TEMPLATE_MAP.keys())}",
        )

    params = {}
    if body.title:
        params["title"] = body.title

    report = await report_engine.generate_report(template_id, params, db)

    if "error" in report:
        raise HTTPException(status_code=400, detail=report["error"])

    return {
        "id": report["id"],
        "template_id": report["template_id"],
        "template_name": report["template_name"],
        "title": report["title"],
        "framework": body.framework,
        "status": report["status"],
        "generated_at": report["generated_at"],
        "data": report["data"],
        "download_url": f"/api/v1/reports/{report['id']}/download",
    }


@router.get("/templates")
def list_templates():
    templates = report_engine.list_templates()
    return {"templates": templates}


@router.post("/generate")
async def generate_report(body: GenerateReportRequest, db: Session = Depends(get_db)):
    if body.template_id not in report_engine.TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"未知模板: {body.template_id}，可用模板: {list(report_engine.TEMPLATES.keys())}",
        )

    params = body.params or {}
    if body.title:
        params["title"] = body.title

    report = await report_engine.generate_report(body.template_id, params, db)

    if "error" in report:
        raise HTTPException(status_code=400, detail=report["error"])

    return {
        "id": report["id"],
        "template_id": report["template_id"],
        "title": report["title"],
        "status": report["status"],
        "generated_at": report["generated_at"],
        "data": report["data"],
        "download_url": f"/api/v1/reports/{report['id']}/download",
    }


@router.get("/list")
def list_reports(limit: int = 20, offset: int = 0):
    return report_engine.get_report_history(limit=limit, offset=offset)


@router.get("/{report_id}")
async def get_report(report_id: str):
    report = await report_engine.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报表不存在")

    return {
        "id": report["id"],
        "template_id": report["template_id"],
        "template_name": report["template_name"],
        "title": report["title"],
        "status": report["status"],
        "generated_at": report["generated_at"],
        "params": report.get("params", {}),
        "data": report["data"],
        "download_url": f"/api/v1/reports/{report['id']}/download",
    }


@router.get("/{report_id}/download")
async def download_report(report_id: str):
    report = await report_engine.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报表不存在")

    pdf_bytes = await report_engine.export_pdf(report_id)
    if pdf_bytes:
        filename = f"{report['title']}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
        )

    html_content = report["html_content"]
    filename = f"{report['title']}.html"
    return Response(
        content=html_content,
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.get("/export/{report_id}")
async def export_report_by_id(
    report_id: str,
    format: str = Query("json", description="导出格式: json 或 csv"),
):
    report = await report_engine.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报表不存在")

    if format == "csv" and "raw_data" in report:
        csv_parts = []
        for section_name, section_data in report.get("sections", {}).items():
            if isinstance(section_data, dict):
                csv_parts.append(f"# {section_data.get('title', section_name)}")
                for ref_name, ref_data in section_data.get("data", {}).items():
                    if isinstance(ref_data, list) and len(ref_data) > 0:
                        headers = list(ref_data[0].keys())
                        csv_parts.append(",".join(headers))
                        for row in ref_data:
                            csv_parts.append(",".join(str(v) for v in row.values()))
                    elif isinstance(ref_data, dict):
                        csv_parts.append(",".join(ref_data.keys()))
                        csv_parts.append(",".join(str(v) for v in ref_data.values()))
                    elif ref_data is not None:
                        csv_parts.append(f"{ref_name},{ref_data}")
                csv_parts.append("")
        csv_content = "\n".join(csv_parts)
        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{report.get('title', 'report')}.csv"},
        )

    return {
        "report_id": report["id"],
        "template_id": report.get("template_id"),
        "template_name": report.get("template_name"),
        "title": report.get("title"),
        "generated_at": report.get("generated_at"),
        "format": "json",
        "chart_config": report.get("chart_config", {}),
        "sections": report.get("sections", []),
        "raw_data": report.get("raw_data", {}),
    }


@router.post("/export")
async def export_report_direct(
    body: ExportReportRequest,
    db: Session = Depends(get_db),
):
    if body.template_id not in REPORT_TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"未知模板: {body.template_id}，可用模板: {list(REPORT_TEMPLATES.keys())}",
        )

    result = report_engine.export_report(
        db=db,
        template_name=body.template_id,
        format=body.format,
        params=body.params,
    )

    if result and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    if body.format == "csv":
        csv_content = result.get("csv_content", "")
        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{body.template_id}_report.csv"
            },
        )

    return result
