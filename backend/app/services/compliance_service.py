from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from app.models.compliance import (
    ComplianceFramework,
    ComplianceControl,
    ComplianceAssessment,
    ComplianceResult,
)

MLPS_CONTROLS = [
    {"control_id": "L3-PS-01", "title": "物理访问控制", "description": "机房应设置电子门禁系统，对进入机房的人员进行身份鉴别和记录", "category": "物理安全", "severity": "high", "mapping": {"feature": "access_control", "coverage": 0.7}},
    {"control_id": "L3-PS-02", "title": "防盗窃和防破坏", "description": "机房应设置防盗报警系统和视频监控系统", "category": "物理安全", "severity": "medium", "mapping": {"feature": "physical_monitoring", "coverage": 0.3}},
    {"control_id": "L3-PS-03", "title": "防雷击和防火", "description": "机房应设置防雷保安器和火灾自动消防系统", "category": "物理安全", "severity": "medium", "mapping": {"feature": None, "coverage": 0.0}},
    {"control_id": "L3-NS-01", "title": "网络架构安全", "description": "应划分不同的网络区域并设置访问控制策略", "category": "网络安全", "severity": "critical", "mapping": {"feature": "network_segmentation", "coverage": 0.8}},
    {"control_id": "L3-NS-02", "title": "通信传输安全", "description": "应采用校验技术或密码技术保证通信过程中数据的完整性", "category": "网络安全", "severity": "high", "mapping": {"feature": "encryption", "coverage": 0.9}},
    {"control_id": "L3-NS-03", "title": "边界防护", "description": "应在网络边界部署访问控制设备并启用访问控制策略", "category": "网络安全", "severity": "critical", "mapping": {"feature": "firewall", "coverage": 0.85}},
    {"control_id": "L3-NS-04", "title": "入侵防范", "description": "应在关键网络节点处检测、防止或限制从外部发起的网络攻击", "category": "网络安全", "severity": "critical", "mapping": {"feature": "ids_ips", "coverage": 0.9}},
    {"control_id": "L3-HS-01", "title": "身份鉴别", "description": "应对登录的用户进行身份标识和鉴别，身份标识具有唯一性", "category": "主机安全", "severity": "critical", "mapping": {"feature": "authentication", "coverage": 0.95}},
    {"control_id": "L3-HS-02", "title": "访问控制", "description": "应根据管理用户的角色分配权限，实现管理用户的权限分离", "category": "主机安全", "severity": "high", "mapping": {"feature": "rbac", "coverage": 0.9}},
    {"control_id": "L3-HS-03", "title": "安全审计", "description": "应启用安全审计功能，审计记录应包括事件日期、时间、用户、事件类型等信息", "category": "主机安全", "severity": "high", "mapping": {"feature": "audit_log", "coverage": 0.85}},
    {"control_id": "L3-AS-01", "title": "应用安全审计", "description": "应用系统应对重要用户操作和运行状态进行审计记录", "category": "应用安全", "severity": "high", "mapping": {"feature": "audit_log", "coverage": 0.85}},
    {"control_id": "L3-AS-02", "title": "通信完整性", "description": "应采用密码技术保证通信过程中数据的完整性", "category": "应用安全", "severity": "high", "mapping": {"feature": "encryption", "coverage": 0.9}},
    {"control_id": "L3-AS-03", "title": "漏洞扫描与修复", "description": "应定期对应用系统进行漏洞扫描，及时修复发现的漏洞", "category": "应用安全", "severity": "critical", "mapping": {"feature": "vulnerability_scan", "coverage": 0.8}},
    {"control_id": "L3-DS-01", "title": "数据完整性", "description": "应采用校验技术或密码技术保证重要数据在传输和存储过程中的完整性", "category": "数据安全", "severity": "critical", "mapping": {"feature": "data_integrity", "coverage": 0.85}},
    {"control_id": "L3-DS-02", "title": "数据保密性", "description": "应采用密码技术保证重要数据在传输和存储过程中的保密性", "category": "数据安全", "severity": "critical", "mapping": {"feature": "encryption", "coverage": 0.9}},
    {"control_id": "L3-DS-03", "title": "数据备份恢复", "description": "应提供重要数据的本地数据备份与恢复功能", "category": "数据安全", "severity": "high", "mapping": {"feature": "backup_recovery", "coverage": 0.6}},
    {"control_id": "L3-DS-04", "title": "个人信息保护", "description": "应仅采集和保存业务必需的用户个人信息，并采取保护措施", "category": "数据安全", "severity": "high", "mapping": {"feature": "data_privacy", "coverage": 0.7}},
]

GDPR_CONTROLS = [
    {"control_id": "GDPR-01", "title": "合法数据处理依据", "description": "个人数据处理必须有合法依据，如同意、合同履行、合法利益等", "category": "数据处理", "severity": "critical", "mapping": {"feature": "data_processing_basis", "coverage": 0.7}},
    {"control_id": "GDPR-02", "title": "数据处理透明性", "description": "数据控制者应向数据主体提供清晰易懂的隐私政策", "category": "数据处理", "severity": "high", "mapping": {"feature": "privacy_policy", "coverage": 0.6}},
    {"control_id": "GDPR-03", "title": "数据最小化原则", "description": "个人数据的处理应限于实现处理目的所必需的最小范围", "category": "数据处理", "severity": "high", "mapping": {"feature": "data_minimization", "coverage": 0.5}},
    {"control_id": "GDPR-04", "title": "同意管理", "description": "数据主体同意必须是自由作出、具体、知情和不含糊的", "category": "同意", "severity": "critical", "mapping": {"feature": "consent_management", "coverage": 0.4}},
    {"control_id": "GDPR-05", "title": "同意撤回", "description": "数据主体应能随时撤回同意，撤回应与给出同意同样容易", "category": "同意", "severity": "high", "mapping": {"feature": "consent_withdrawal", "coverage": 0.4}},
    {"control_id": "GDPR-06", "title": "数据泄露通知", "description": "数据泄露应在72小时内通知监管机构", "category": "泄露通知", "severity": "critical", "mapping": {"feature": "breach_notification", "coverage": 0.7}},
    {"control_id": "GDPR-07", "title": "数据泄露通知数据主体", "description": "当数据泄露可能对数据主体造成高风险时应通知数据主体", "category": "泄露通知", "severity": "high", "mapping": {"feature": "breach_notification_subject", "coverage": 0.5}},
    {"control_id": "GDPR-08", "title": "数据保护官", "description": "在特定情况下应指定数据保护官(DPO)", "category": "DPO", "severity": "high", "mapping": {"feature": "dpo_management", "coverage": 0.3}},
    {"control_id": "GDPR-09", "title": "数据访问权", "description": "数据主体有权获取其个人数据的副本", "category": "数据主体权利", "severity": "high", "mapping": {"feature": "data_subject_access", "coverage": 0.5}},
    {"control_id": "GDPR-10", "title": "数据删除权", "description": "数据主体有权要求删除其个人数据（被遗忘权）", "category": "数据主体权利", "severity": "critical", "mapping": {"feature": "data_deletion", "coverage": 0.4}},
    {"control_id": "GDPR-11", "title": "数据可携带权", "description": "数据主体有权以结构化格式接收其个人数据并转移给其他控制者", "category": "数据主体权利", "severity": "medium", "mapping": {"feature": "data_portability", "coverage": 0.3}},
]

NIST_CSF_CONTROLS = [
    {"control_id": "ID.AM-01", "title": "资产管理-物理设备", "description": "组织内的物理设备和系统被清点和管理", "category": "识别(Identify)", "severity": "high", "mapping": {"feature": "asset_management", "coverage": 0.8}},
    {"control_id": "ID.AM-02", "title": "资产管理-软件平台", "description": "组织内的软件平台和应用程序被清点和管理", "category": "识别(Identify)", "severity": "high", "mapping": {"feature": "asset_management", "coverage": 0.75}},
    {"control_id": "ID.GV-01", "title": "治理-网络安全策略", "description": "组织的网络安全策略已制定并获得管理层批准", "category": "识别(Identify)", "severity": "critical", "mapping": {"feature": "security_policy", "coverage": 0.6}},
    {"control_id": "ID.RA-01", "title": "风险评估", "description": "定期评估组织面临的网络安全风险", "category": "识别(Identify)", "severity": "critical", "mapping": {"feature": "risk_assessment", "coverage": 0.7}},
    {"control_id": "PR.AC-01", "title": "访问控制-身份管理", "description": "对组织内的系统和资产进行身份鉴别和授权管理", "category": "保护(Protect)", "severity": "critical", "mapping": {"feature": "authentication", "coverage": 0.95}},
    {"control_id": "PR.AC-02", "title": "访问控制-最小权限", "description": "实施最小权限原则，仅授予完成任务所需的最低权限", "category": "保护(Protect)", "severity": "high", "mapping": {"feature": "rbac", "coverage": 0.9}},
    {"control_id": "PR.DS-01", "title": "数据安全-静态数据保护", "description": "保护静态数据免受未授权访问", "category": "保护(Protect)", "severity": "critical", "mapping": {"feature": "encryption", "coverage": 0.9}},
    {"control_id": "DE.CM-01", "title": "安全监控-网络", "description": "监控网络以检测潜在的网络安全事件", "category": "检测(Detect)", "severity": "critical", "mapping": {"feature": "network_monitoring", "coverage": 0.9}},
    {"control_id": "DE.AE-01", "title": "异常事件分析", "description": "建立和分析安全事件的基线以识别潜在异常", "category": "检测(Detect)", "severity": "high", "mapping": {"feature": "anomaly_detection", "coverage": 0.85}},
    {"control_id": "RS.RP-01", "title": "响应计划", "description": "在检测到安全事件时执行响应计划", "category": "响应(Respond)", "severity": "critical", "mapping": {"feature": "incident_response", "coverage": 0.8}},
    {"control_id": "RS.CO-01", "title": "响应协调", "description": "与内外部利益相关方协调安全事件响应活动", "category": "响应(Respond)", "severity": "high", "mapping": {"feature": "collaboration", "coverage": 0.7}},
    {"control_id": "RC.RP-01", "title": "恢复计划", "description": "执行恢复计划以恢复受影响系统和服务", "category": "恢复(Recover)", "severity": "high", "mapping": {"feature": "backup_recovery", "coverage": 0.6}},
]


def seed_compliance(db: Session) -> Dict[str, Any]:
    existing = db.query(ComplianceFramework).count()
    if existing > 0:
        return {"message": "合规框架已存在，跳过初始化", "frameworks": existing}

    frameworks_data = [
        {
            "name": "等保2.0三级",
            "code": "mlps",
            "description": "信息安全等级保护基本要求（第三级），适用于涉及国家安全、社会秩序和公共利益的信息系统",
            "version": "2.0",
            "category": ["物理安全", "网络安全", "主机安全", "应用安全", "数据安全"],
            "controls": MLPS_CONTROLS,
        },
        {
            "name": "GDPR",
            "code": "gdpr",
            "description": "欧盟通用数据保护条例，规范个人数据的处理和保护",
            "version": "2016/679",
            "category": ["数据处理", "同意", "泄露通知", "DPO", "数据主体权利"],
            "controls": GDPR_CONTROLS,
        },
        {
            "name": "NIST CSF",
            "code": "nist_csf",
            "description": "美国国家标准与技术研究院网络安全框架，提供网络安全风险管理的自愿性指导",
            "version": "2.0",
            "category": ["识别(Identify)", "保护(Protect)", "检测(Detect)", "响应(Respond)", "恢复(Recover)"],
            "controls": NIST_CSF_CONTROLS,
        },
    ]

    created_frameworks = 0
    created_controls = 0

    for fw_data in frameworks_data:
        controls_list = fw_data.pop("controls")
        framework = ComplianceFramework(
            **fw_data,
            total_controls=len(controls_list),
        )
        db.add(framework)
        db.flush()

        for ctrl_data in controls_list:
            control = ComplianceControl(
                framework_id=framework.id,
                **ctrl_data,
            )
            db.add(control)
            created_controls += 1

        created_frameworks += 1

    db.commit()
    return {
        "message": "合规框架初始化完成",
        "frameworks": created_frameworks,
        "controls": created_controls,
    }


def get_frameworks(db: Session, active_only: bool = False) -> List[ComplianceFramework]:
    query = db.query(ComplianceFramework).options(joinedload(ComplianceFramework.controls))
    if active_only:
        query = query.filter(ComplianceFramework.is_active == True)
    return query.order_by(ComplianceFramework.id).all()


def get_framework(db: Session, framework_id: int) -> Optional[ComplianceFramework]:
    return db.query(ComplianceFramework).filter(ComplianceFramework.id == framework_id).first()


def get_controls(db: Session, framework_id: int, category: Optional[str] = None) -> List[ComplianceControl]:
    query = db.query(ComplianceControl).filter(ComplianceControl.framework_id == framework_id)
    if category:
        query = query.filter(ComplianceControl.category == category)
    return query.order_by(ComplianceControl.id).all()


def create_assessment(db: Session, framework_id: int, name: str, assessor: Optional[str] = None) -> ComplianceAssessment:
    assessment = ComplianceAssessment(
        framework_id=framework_id,
        name=name,
        status="draft",
        assessor=assessor,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def get_assessments(db: Session, framework_id: Optional[int] = None) -> List[ComplianceAssessment]:
    query = db.query(ComplianceAssessment)
    if framework_id:
        query = query.filter(ComplianceAssessment.framework_id == framework_id)
    return query.order_by(ComplianceAssessment.id.desc()).all()


def get_assessment(db: Session, assessment_id: int) -> Optional[ComplianceAssessment]:
    return db.query(ComplianceAssessment).options(joinedload(ComplianceAssessment.results)).filter(ComplianceAssessment.id == assessment_id).first()


def generate_assessment(db: Session, assessment_id: int) -> Optional[ComplianceAssessment]:
    assessment = db.query(ComplianceAssessment).filter(ComplianceAssessment.id == assessment_id).first()
    if not assessment:
        return None

    framework = db.query(ComplianceFramework).filter(ComplianceFramework.id == assessment.framework_id).first()
    if not framework:
        return None

    controls = db.query(ComplianceControl).filter(ComplianceControl.framework_id == framework.id).all()

    db.query(ComplianceResult).filter(ComplianceResult.assessment_id == assessment_id).delete()
    db.flush()

    now = datetime.now()
    for control in controls:
        mapping = control.mapping or {}
        coverage = mapping.get("coverage", 0.0)
        feature = mapping.get("feature")

        if not feature or coverage == 0.0:
            result_status = "not_assessed"
            findings_text = "平台暂无对应功能覆盖此控制项"
            remediation_text = "需通过第三方工具或人工方式实现合规"
        elif coverage >= 0.8:
            result_status = "compliant"
            findings_text = f"平台功能 '{feature}' 覆盖度 {int(coverage * 100)}%，满足合规要求"
            remediation_text = None
        elif coverage >= 0.5:
            result_status = "partially_compliant"
            findings_text = f"平台功能 '{feature}' 覆盖度 {int(coverage * 100)}%，部分满足合规要求"
            remediation_text = "建议补充相关功能或配合第三方工具完善合规覆盖"
        else:
            result_status = "non_compliant"
            findings_text = f"平台功能 '{feature}' 覆盖度仅 {int(coverage * 100)}%，未满足合规要求"
            remediation_text = "需优先实现相关功能或引入外部合规工具"

        result = ComplianceResult(
            assessment_id=assessment_id,
            control_id=control.id,
            status=result_status,
            evidence=mapping if mapping else None,
            findings=findings_text,
            remediation=remediation_text,
            assessed_at=now,
            assessed_by="系统自动评估",
        )
        db.add(result)

    assessment.status = "in_progress"
    assessment.started_at = now
    db.flush()

    all_results = db.query(ComplianceResult).filter(ComplianceResult.assessment_id == assessment_id).all()
    total = len(all_results)
    if total > 0:
        compliant_count = sum(1 for r in all_results if r.status == "compliant")
        partial_count = sum(1 for r in all_results if r.status == "partially_compliant")
        non_compliant_count = sum(1 for r in all_results if r.status == "non_compliant")
        score = (compliant_count * 100 + partial_count * 50) / total
        assessment.overall_score = round(score, 2)

        if non_compliant_count == 0 and partial_count == 0:
            assessment.status = "completed"
        elif non_compliant_count == 0:
            assessment.status = "in_progress"
        else:
            assessment.status = "in_progress"

        assessment.completed_at = now

    db.commit()
    db.refresh(assessment)
    return assessment


def update_result(db: Session, result_id: int, status: Optional[str] = None, evidence: Optional[Any] = None, findings: Optional[str] = None, remediation: Optional[str] = None, assessed_by: Optional[str] = None) -> Optional[ComplianceResult]:
    result = db.query(ComplianceResult).filter(ComplianceResult.id == result_id).first()
    if not result:
        return None

    if status is not None:
        result.status = status
    if evidence is not None:
        result.evidence = evidence
    if findings is not None:
        result.findings = findings
    if remediation is not None:
        result.remediation = remediation
    if assessed_by is not None:
        result.assessed_by = assessed_by
    result.assessed_at = datetime.now()

    db.flush()

    assessment = db.query(ComplianceAssessment).filter(ComplianceAssessment.id == result.assessment_id).first()
    if assessment:
        all_results = db.query(ComplianceResult).filter(ComplianceResult.assessment_id == assessment.id).all()
        total = len(all_results)
        if total > 0:
            compliant_count = sum(1 for r in all_results if r.status == "compliant")
            partial_count = sum(1 for r in all_results if r.status == "partially_compliant")
            score = (compliant_count * 100 + partial_count * 50) / total
            assessment.overall_score = round(score, 2)

    db.commit()
    db.refresh(result)
    return result


def get_assessment_report(db: Session, framework_id: int) -> Optional[Dict[str, Any]]:
    framework = db.query(ComplianceFramework).options(
        joinedload(ComplianceFramework.controls)
    ).filter(ComplianceFramework.id == framework_id).first()
    if not framework:
        return None

    assessment = (
        db.query(ComplianceAssessment)
        .filter(ComplianceAssessment.framework_id == framework_id)
        .order_by(ComplianceAssessment.id.desc())
        .first()
    )

    controls = framework.controls

    if not assessment:
        categories_data = {}
        for ctrl in controls:
            cat = ctrl.category or "未分类"
            if cat not in categories_data:
                categories_data[cat] = {"total": 0}
            categories_data[cat]["total"] += 1

        categories = []
        for cat_name, cat_data in categories_data.items():
            categories.append({
                "category": cat_name,
                "total": cat_data["total"],
                "compliant": 0,
                "partially_compliant": 0,
                "non_compliant": 0,
                "not_assessed": cat_data["total"],
                "score": 0.0,
            })

        return {
            "framework": framework,
            "assessment": None,
            "overall_score": 0.0,
            "total_controls": len(controls),
            "compliant": 0,
            "partially_compliant": 0,
            "non_compliant": 0,
            "not_assessed": len(controls),
            "categories": categories,
            "results": [],
        }

    results = db.query(ComplianceResult).filter(ComplianceResult.assessment_id == assessment.id).all()

    result_by_control = {r.control_id: r for r in results}

    compliant_count = sum(1 for r in results if r.status == "compliant")
    partial_count = sum(1 for r in results if r.status == "partially_compliant")
    non_compliant_count = sum(1 for r in results if r.status == "non_compliant")
    not_assessed_count = sum(1 for r in results if r.status == "not_assessed")

    categories_data: Dict[str, Dict[str, int]] = {}
    for ctrl in controls:
        cat = ctrl.category or "未分类"
        if cat not in categories_data:
            categories_data[cat] = {"total": 0, "compliant": 0, "partially_compliant": 0, "non_compliant": 0, "not_assessed": 0}
        categories_data[cat]["total"] += 1
        r = result_by_control.get(ctrl.id)
        if r:
            if r.status in categories_data[cat]:
                categories_data[cat][r.status] += 1
            else:
                categories_data[cat]["not_assessed"] += 1
        else:
            categories_data[cat]["not_assessed"] += 1

    categories = []
    for cat_name, cat_data in categories_data.items():
        cat_total = cat_data["total"]
        cat_score = (cat_data["compliant"] * 100 + cat_data["partially_compliant"] * 50) / cat_total if cat_total > 0 else 0.0
        categories.append({
            "category": cat_name,
            "total": cat_total,
            "compliant": cat_data["compliant"],
            "partially_compliant": cat_data["partially_compliant"],
            "non_compliant": cat_data["non_compliant"],
            "not_assessed": cat_data["not_assessed"],
            "score": round(cat_score, 2),
        })

    overall_score = assessment.overall_score or 0.0

    return {
        "framework": framework,
        "assessment": assessment,
        "overall_score": overall_score,
        "total_controls": len(controls),
        "compliant": compliant_count,
        "partially_compliant": partial_count,
        "non_compliant": non_compliant_count,
        "not_assessed": not_assessed_count,
        "categories": categories,
        "results": results,
    }
