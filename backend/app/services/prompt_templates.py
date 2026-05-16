"""
安全运营提示词模板库

提供事件分类、证据关联、攻击推理、处置决策、报告生成和安全问答等
核心安全运营场景的结构化提示词模板。所有提示词均使用中文，面向中文安全分析师。

Usage:
    from app.services.prompt_templates import prompt_templates

    messages = prompt_templates.event_classification(event_data)
    messages = prompt_templates.evidence_correlation(evidence_list)
    messages = prompt_templates.attack_reasoning(event_data, evidence)
    messages = prompt_templates.disposal_decision(analysis_result)
    messages = prompt_templates.report_generation(analysis_data)
    messages = prompt_templates.security_qa(question, context)
"""

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class PromptTemplate:
    """
    安全运营提示词模板库

    每个方法返回标准的 messages 列表，可直接传递给 LLM 客户端。
    包含 system prompt（角色定义 + 输出格式）和 user prompt（具体数据 + few-shot 示例）。
    """

    # ========================================================================
    # 事件分类
    # ========================================================================

    @staticmethod
    def event_classification(event_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        将安全事件分类为预定义类别。

        Args:
            event_data: 包含事件标题、描述、来源、原始日志等信息

        Returns:
            messages 列表，包含 system 和 user 角色消息

        支持类别:
            - phishing: 钓鱼攻击
            - vpn_anomaly: VPN异常登录
            - malware: 恶意软件/病毒
            - brute_force: 暴力破解
            - data_exfil: 数据泄露/外传
            - lateral_movement: 横向移动
            - privilege_escalation: 权限提升
            - c2_communication: C2通信
            - insider_threat: 内部威胁
            - reconnaissance: 侦察扫描
            - policy_violation: 策略违规
            - other: 其他类型
        """
        system_prompt = (
            "你是一位资深的安全运营中心（SOC）分析专家，精通安全事件分类和优先级排序。\n\n"
            "你的任务是对安全事件进行分类，判断其所属的攻击类型和严重程度。\n\n"
            "分类规则：\n"
            "1. phishing - 钓鱼攻击：包含伪造邮件、虚假链接、域名欺骗等特征\n"
            "2. vpn_anomaly - VPN异常：异地登录、非工作时间登录、异常地理位置\n"
            "3. malware - 恶意软件：病毒、木马、勒索软件、挖矿程序等\n"
            "4. brute_force - 暴力破解：大量失败登录、密码喷洒、凭证猜测\n"
            "5. data_exfil - 数据泄露：异常数据外传、大量数据下载、敏感文件访问\n"
            "6. lateral_movement - 横向移动：RDP连接、SMB共享访问、远程执行\n"
            "7. privilege_escalation - 权限提升：新增管理员、提权操作、sudo滥用\n"
            "8. c2_communication - C2通信：异常外联、DNS隧道、加密心跳包\n"
            "9. insider_threat - 内部威胁：权限滥用、数据窃取、异常行为偏离\n"
            "10. reconnaissance - 侦察扫描：端口扫描、漏洞扫描、信息收集\n"
            "11. policy_violation - 策略违规：违反安全策略的操作行为\n"
            "12. other - 其他类型：无法归入以上类别的事件\n\n"
            "严重程度判定标准：\n"
            "- critical（严重）：正在发生的攻击，已确认造成实际损害\n"
            "- high（高）：高度疑似攻击行为，需要立即响应\n"
            "- medium（中）：可疑行为，需要进一步调查\n"
            "- low（低）：信息性告警，常规监控即可\n\n"
            "你必须以严格的JSON格式返回结果，格式如下：\n"
            "{\n"
            '  "category": "分类名称（使用英文标识）",\n'
            '  "category_name": "分类中文名称",\n'
            '  "severity": "严重程度（critical/high/medium/low）",\n'
            '  "confidence": 0-100的置信度整数,\n'
            '  "reasoning": "分类推理过程的简要说明",\n'
            '  "key_indicators": ["关键指标1", "关键指标2", ...],\n'
            '  "related_categories": ["可能相关的其他类别1", ...],\n'
            '  "priority_score": 0-100的优先级评分\n'
            "}\n\n"
            "只返回JSON，不要返回任何其他内容。"
        )

        event_json = json.dumps(event_data, ensure_ascii=False, default=str)

        user_prompt = (
            f"请对以下安全事件进行分类：\n\n"
            f"```json\n{event_json}\n```\n\n"
            "--- 分类示例（Few-Shot） ---\n\n"
            "示例1：\n"
            "输入：{"
            '"title": "用户收到来自support@micr0soft.com的邮件，要求验证账户密码", '
            '"source": "邮件网关", '
            '"description": "发件域名micr0soft.com与官方域名microsoft.com高度相似，邮件包含一个指向伪造登录页面的链接"'
            "}\n"
            "输出：{\n"
            '  "category": "phishing",\n'
            '  "category_name": "钓鱼攻击",\n'
            '  "severity": "high",\n'
            '  "confidence": 95,\n'
            '  "reasoning": "发件域名与官方域名高度相似（域名欺骗），包含指向伪造登录页面的链接，符合典型钓鱼攻击特征",\n'
            '  "key_indicators": ["域名欺骗", "伪造登录页面", "社会工程学诱导"],\n'
            '  "related_categories": ["credential_theft"],\n'
            '  "priority_score": 88\n'
            "}\n\n"
            "示例2：\n"
            "输入：{"
            '"title": "用户zhangsan从俄罗斯IP 91.234.56.78登录VPN", '
            '"source": "VPN网关", '
            '"description": "该用户通常在北京登录，此次登录地为莫斯科，登录时间为凌晨3点（非工作时间）"'
            "}\n"
            "输出：{\n"
            '  "category": "vpn_anomaly",\n'
            '  "category_name": "VPN异常登录",\n'
            '  "severity": "critical",\n'
            '  "confidence": 92,\n'
            '  "reasoning": "地理位置异常（不可能旅行），非工作时间登录，与历史行为基线严重偏离",\n'
            '  "key_indicators": ["不可能旅行", "非工作时间", "高风险地区IP"],\n'
            '  "related_categories": ["credential_theft", "lateral_movement"],\n'
            '  "priority_score": 95\n'
            "}\n\n"
            "示例3：\n"
            "输入：{"
            '"title": "服务器192.168.1.100在5分钟内遭受500次SSH登录失败", '
            '"source": "HIDS", '
            '"description": "来自单一IP 10.0.0.50的大量SSH登录尝试，使用了不同的用户名"'
            "}\n"
            "输出：{\n"
            '  "category": "brute_force",\n'
            '  "category_name": "暴力破解",\n'
            '  "severity": "high",\n'
            '  "confidence": 98,\n'
            '  "reasoning": "短时间内大量登录失败（500次/5分钟），使用多用户名尝试，典型暴力破解模式",\n'
            '  "key_indicators": ["高频登录失败", "多用户名尝试", "单一攻击源"],\n'
            '  "related_categories": ["initial_access"],\n'
            '  "priority_score": 90\n'
            "}\n\n"
            "请严格遵循上述JSON格式输出分类结果。"
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    # ========================================================================
    # 证据关联
    # ========================================================================

    @staticmethod
    def evidence_correlation(evidence_list: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        跨数据源关联证据，构建完整攻击证据链。

        Args:
            evidence_list: 来自不同数据源的证据列表，每项包含 source、timestamp、detail、type 等

        Returns:
            messages 列表，包含 system 和 user 角色消息
        """
        system_prompt = (
            "你是一位资深的安全取证分析专家，擅长跨数据源关联证据，构建完整的攻击证据链。\n\n"
            "你的任务是将来自不同安全系统（VPN网关、EDR、邮件网关、AD域控、防火墙、SIEM、"
            "威胁情报、UEBA等）的孤立证据进行关联分析，发现它们之间的因果和时序关系。\n\n"
            "关联分析方法：\n"
            "1. 时序关联：按时间顺序排列证据，构建攻击时间线\n"
            "2. 因果关联：分析证据之间的因果关系（A导致B，B触发C）\n"
            "3. 实体关联：通过IP、用户、主机、进程等实体串联证据\n"
            "4. 模式关联：将证据与已知攻击模式（TTP）匹配\n\n"
            "你必须以严格的JSON格式返回结果，格式如下：\n"
            "{\n"
            '  "correlation_id": "关联分析唯一标识",\n'
            '  "timeline": [\n'
            '    {"time": "时间", "event": "事件描述", "source": "数据源", "entity": "关联实体", "significance": "重要性评分0-100"},\n'
            '    ...\n'
            "  ],\n"
            '  "causal_links": [\n'
            '    {"from": "前因事件", "to": "后果事件", "relationship": "关系类型", "confidence": 置信度0-100},\n'
            '    ...\n'
            "  ],\n"
            '  "key_entities": {\n'
            '    "ips": ["相关IP列表"],\n'
            '    "users": ["相关用户列表"],\n'
            '    "hosts": ["相关主机列表"],\n'
            '    "processes": ["相关进程列表"],\n'
            '    "domains": ["相关域名列表"]\n'
            "  },\n"
            '  "attack_stage": "当前攻击阶段（使用MITRE ATT&CK阶段描述）",\n'
            '  "evidence_strength": "证据强度（strong/moderate/weak）",\n'
            '  "confidence": 0-100的总体置信度,\n'
            '  "gaps": ["证据链中的缺口或待确认信息"],\n'
            '  "summary": "关联分析总结（中文）"\n'
            "}\n\n"
            "只返回JSON，不要返回任何其他内容。"
        )

        evidence_json = json.dumps(evidence_list, ensure_ascii=False, default=str)

        user_prompt = (
            f"请对以下来自多个数据源的证据进行关联分析：\n\n"
            f"```json\n{evidence_json}\n```\n\n"
            "--- 关联分析示例（Few-Shot） ---\n\n"
            "示例输入：\n"
            "[\n"
            '  {"source": "邮件网关", "timestamp": "2024-01-15T09:30:00", "detail": "用户wangwu收到钓鱼邮件，发件人伪装为IT部门", "type": "phishing_email"},\n'
            '  {"source": "EDR", "timestamp": "2024-01-15T09:35:00", "detail": "主机WKSTN-023上检测到可疑PowerShell进程执行下载命令", "type": "suspicious_process"},\n'
            '  {"source": "防火墙", "timestamp": "2024-01-15T09:36:00", "detail": "主机WKSTN-023向外部IP 203.0.113.55:443发起加密连接", "type": "c2_connection"},\n'
            '  {"source": "AD域控", "timestamp": "2024-01-15T09:40:00", "detail": "用户wangwu的账户被用于访问敏感文件服务器", "type": "credential_use"},\n'
            '  {"source": "威胁情报", "timestamp": "2024-01-15T09:45:00", "detail": "IP 203.0.113.55关联APT-29组织", "type": "threat_intel"}\n'
            "]\n\n"
            "示例输出：\n"
            "{\n"
            '  "correlation_id": "CORR-20240115-001",\n'
            '  "timeline": [\n'
            '    {"time": "09:30", "event": "钓鱼邮件投递", "source": "邮件网关", "entity": "wangwu", "significance": 95},\n'
            '    {"time": "09:35", "event": "恶意PowerShell执行", "source": "EDR", "entity": "WKSTN-023", "significance": 90},\n'
            '    {"time": "09:36", "event": "C2加密连接建立", "source": "防火墙", "entity": "203.0.113.55", "significance": 95},\n'
            '    {"time": "09:40", "event": "凭证窃取后横向访问", "source": "AD域控", "entity": "wangwu", "significance": 90},\n'
            '    {"time": "09:45", "event": "C2 IP确认归属APT组织", "source": "威胁情报", "entity": "203.0.113.55", "significance": 85}\n'
            "  ],\n"
            '  "causal_links": [\n'
            '    {"from": "钓鱼邮件投递", "to": "恶意PowerShell执行", "relationship": "用户点击恶意链接触发下载", "confidence": 90},\n'
            '    {"from": "恶意PowerShell执行", "to": "C2加密连接建立", "relationship": "载荷执行后回连C2", "confidence": 95},\n'
            '    {"from": "C2加密连接建立", "to": "凭证窃取后横向访问", "relationship": "C2通道下发横向移动指令", "confidence": 85},\n'
            '    {"from": "C2加密连接建立", "to": "C2 IP确认归属APT组织", "relationship": "C2基础设施归因", "confidence": 80}\n'
            "  ],\n"
            '  "key_entities": {\n'
            '    "ips": ["203.0.113.55"],\n'
            '    "users": ["wangwu"],\n'
            '    "hosts": ["WKSTN-023"],\n'
            '    "processes": ["powershell.exe"],\n'
            '    "domains": []\n'
            "  },\n"
            '  "attack_stage": "Initial Access → Execution → C2 → Lateral Movement",\n'
            '  "evidence_strength": "strong",\n'
            '  "confidence": 92,\n'
            '  "gaps": ["钓鱼邮件具体载荷未确认", "横向移动的目标范围需进一步排查"],\n'
            '  "summary": "基于多源证据的时序和因果关联分析，确认这是一起以钓鱼邮件为初始入口的APT攻击链。攻击者在获取初始访问权限后，通过C2通道下发指令，利用窃取的凭证进行横向移动。证据链完整度较高，关键环节均有独立数据源交叉验证。"\n'
            "}\n\n"
            "请严格遵循上述JSON格式输出关联分析结果。"
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    # ========================================================================
    # 攻击推理（MITRE ATT&CK）
    # ========================================================================

    @staticmethod
    def attack_reasoning(
        event_data: Dict[str, Any],
        evidence: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, str]]:
        """
        使用MITRE ATT&CK框架推理攻击链，分析攻击者的战术、技术和过程（TTP）。

        Args:
            event_data: 事件基本信息
            evidence: 可选，已收集的证据列表

        Returns:
            messages 列表，包含 system 和 user 角色消息
        """
        system_prompt = (
            "你是一位资深的安全威胁分析专家，精通MITRE ATT&CK框架和攻击链推理。\n\n"
            "你的任务是：\n"
            "1. 基于安全事件和证据，推理完整的攻击链\n"
            "2. 将每个攻击步骤映射到MITRE ATT&CK框架的战术（Tactic）和技术（Technique）\n"
            "3. 评估攻击者的能力水平和攻击目标\n"
            "4. 预测攻击者的下一步可能行动\n\n"
            "MITRE ATT&CK 企业版战术阶段：\n"
            "- Reconnaissance（侦察）\n"
            "- Resource Development（资源开发）\n"
            "- Initial Access（初始访问）\n"
            "- Execution（执行）\n"
            "- Persistence（持久化）\n"
            "- Privilege Escalation（权限提升）\n"
            "- Defense Evasion（防御规避）\n"
            "- Credential Access（凭证访问）\n"
            "- Discovery（发现）\n"
            "- Lateral Movement（横向移动）\n"
            "- Collection（收集）\n"
            "- Command and Control（命令与控制）\n"
            "- Exfiltration（数据渗出）\n"
            "- Impact（影响）\n\n"
            "你必须以严格的JSON格式返回结果，格式如下：\n"
            "{\n"
            '  "attack_summary": "攻击概述（中文）",\n'
            '  "attack_chain": [\n'
            '    {\n'
            '      "step": 步骤序号,\n'
            '      "tactic": "战术名称（英文）",\n'
            '      "tactic_name": "战术中文名称",\n'
            '      "technique_id": "MITRE技术ID（如T1566）",\n'
            '      "technique_name": "技术名称",\n'
            '      "description": "该步骤的具体描述",\n'
            '      "evidence": ["支撑该步骤的证据1", ...],\n'
            '      "confidence": 该步骤置信度0-100,\n'
            '      "status": "confirmed/suspected/hypothetical"\n'
            "    },\n"
            '    ...\n'
            "  ],\n"
            '  "attacker_profile": {\n'
            '    "sophistication": "攻击者能力水平（low/medium/high/apt）",\n'
            '    "motivation": "攻击动机分析",\n'
            '    "likely_actor": "可能的攻击组织（如有情报支撑）",\n'
            '    "tools_used": ["使用的工具列表"]\n'
            "  },\n"
            '  "next_steps_prediction": ["攻击者下一步可能行动1", ...],\n'
            '  "overall_confidence": 整体推理置信度0-100,\n'
            '  "reasoning_gaps": ["推理链中的不确定性或需要验证的假设"],\n'
            '  "mitre_attack_flow": "MITRE ATT&CK攻击流描述（如 T1566 → T1059 → T1071）"\n'
            "}\n\n"
            "只返回JSON，不要返回任何其他内容。"
        )

        event_json = json.dumps(event_data, ensure_ascii=False, default=str)
        evidence_json = json.dumps(evidence or [], ensure_ascii=False, default=str)

        user_prompt = (
            f"请基于以下安全事件进行MITRE ATT&CK攻击链推理：\n\n"
            f"## 事件信息\n```json\n{event_json}\n```\n\n"
            f"## 已有证据\n```json\n{evidence_json}\n```\n\n"
            "--- 攻击推理示例（Few-Shot） ---\n\n"
            "示例输入：\n"
            "事件：勒索软件感染事件，某财务部门终端文件被加密，文件名被修改为.locked后缀，"
            "桌面出现勒索信息文本。该终端此前收到一份伪装成发票的钓鱼邮件附件。\n\n"
            "示例输出：\n"
            "{\n"
            '  "attack_summary": "攻击者通过钓鱼邮件投递恶意文档，利用宏代码执行PowerShell下载勒索软件载荷，加密终端文件后留下勒索信息。攻击链涵盖初始访问、执行、防御规避和影响四个阶段。",\n'
            '  "attack_chain": [\n'
            '    {\n'
            '      "step": 1,\n'
            '      "tactic": "Initial Access",\n'
            '      "tactic_name": "初始访问",\n'
            '      "technique_id": "T1566.001",\n'
            '      "technique_name": "Spearphishing Attachment",\n'
            '      "description": "攻击者发送伪装成发票的钓鱼邮件，附件为包含恶意宏的Office文档",\n'
            '      "evidence": ["邮件网关日志显示收到可疑附件", "用户确认打开了该附件"],\n'
            '      "confidence": 90,\n'
            '      "status": "confirmed"\n'
            "    },\n"
            '    {\n'
            '      "step": 2,\n'
            '      "tactic": "Execution",\n'
            '      "tactic_name": "执行",\n'
            '      "technique_id": "T1059.001",\n'
            '      "technique_name": "PowerShell",\n'
            '      "description": "恶意宏代码调用PowerShell从远程服务器下载勒索软件载荷",\n'
            '      "evidence": ["EDR检测到PowerShell下载行为", "网络日志显示对外HTTP下载连接"],\n'
            '      "confidence": 85,\n'
            '      "status": "confirmed"\n'
            "    },\n"
            '    {\n'
            '      "step": 3,\n'
            '      "tactic": "Defense Evasion",\n'
            '      "tactic_name": "防御规避",\n'
            '      "technique_id": "T1027",\n'
            '      "technique_name": "Obfuscated Files or Information",\n'
            '      "description": "勒索软件载荷经过混淆处理，绕过杀毒软件检测",\n'
            '      "evidence": ["杀毒软件未触发告警", "载荷哈希值未在已知库中匹配"],\n'
            '      "confidence": 70,\n'
            '      "status": "suspected"\n'
            "    },\n"
            '    {\n'
            '      "step": 4,\n'
            '      "tactic": "Impact",\n'
            '      "tactic_name": "影响",\n'
            '      "technique_id": "T1486",\n'
            '      "technique_name": "Data Encrypted for Impact",\n'
            '      "description": "勒索软件加密终端文件，修改文件扩展名为.locked，留下勒索信息",\n'
            '      "evidence": ["文件扩展名批量变更", "勒索信息文本文件出现在桌面", "文件无法正常打开"],\n'
            '      "confidence": 95,\n'
            '      "status": "confirmed"\n'
            "    }\n"
            "  ],\n"
            '  "attacker_profile": {\n'
            '    "sophistication": "medium",\n'
            '    "motivation": "经济利益，通过勒索获取赎金",\n'
            '    "likely_actor": "未知勒索软件团伙（可能为LockBit变种）",\n'
            '    "tools_used": ["恶意Office文档", "混淆PowerShell脚本", "勒索软件载荷"]\n'
            "  },\n"
            '  "next_steps_prediction": [\n'
            '    "攻击者可能尝试横向移动到其他高价值终端",\n'
            '    "可能利用已窃取的凭证访问共享文件服务器",\n'
            '    "可能在暗网泄露已窃取的数据（双重勒索）"\n'
            "  ],\n"
            '  "overall_confidence": 88,\n'
            '  "reasoning_gaps": ["勒索软件具体家族需进一步逆向分析确认", "载荷下载源IP需威胁情报交叉验证", "是否发生数据窃取待确认"],\n'
            '  "mitre_attack_flow": "T1566.001 → T1059.001 → T1027 → T1486"\n'
            "}\n\n"
            "请严格遵循上述JSON格式输出攻击推理结果。"
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    # ========================================================================
    # 处置决策
    # ========================================================================

    @staticmethod
    def disposal_decision(analysis_result: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        基于分析结果，推荐安全处置响应动作及置信度。

        Args:
            analysis_result: 包含事件分类、攻击推理、证据关联等综合分析结果

        Returns:
            messages 列表，包含 system 和 user 角色消息
        """
        system_prompt = (
            "你是一位资深的安全应急响应（IR）专家，擅长制定安全事件的处置决策方案。\n\n"
            "你的任务是基于安全分析结果，推荐最优的处置响应策略。\n\n"
            "处置动作类型：\n"
            "- isolate_host: 隔离主机（断网）\n"
            "- disable_account: 禁用账号\n"
            "- force_password_reset: 强制重置密码\n"
            "- revoke_sessions: 注销所有会话\n"
            "- block_ip: 封禁IP地址\n"
            "- block_domain: 封禁域名\n"
            "- quarantine_file: 隔离文件\n"
            "- kill_process: 终止进程\n"
            "- enable_mfa: 启用多因素认证\n"
            "- notify_user: 通知用户\n"
            "- escalate_to_tier2: 升级到二线分析师\n"
            "- escalate_to_management: 升级到管理层\n"
            "- start_forensic: 启动数字取证\n"
            "- collect_logs: 收集日志\n"
            "- update_firewall_rule: 更新防火墙规则\n"
            "- deploy_edr_policy: 部署EDR策略\n"
            "- restore_backup: 从备份恢复\n"
            "- monitor_enhanced: 加强监控\n"
            "- no_action: 无需处置\n\n"
            "决策原则：\n"
            "1. 高置信度 + 高风险 → 自动化处置（auto）\n"
            "2. 中置信度 + 中风险 → 半自动处置（需要人工确认，semi-auto）\n"
            "3. 低置信度 + 低风险 → 人工处置（manual）\n"
            "4. 处置动作应符合最小权限和业务影响最小化原则\n\n"
            "你必须以严格的JSON格式返回结果，格式如下：\n"
            "{\n"
            '  "decision_id": "处置决策唯一标识",\n'
            '  "overall_assessment": "综合评估（中文）",\n'
            '  "risk_level": "综合风险等级（critical/high/medium/low）",\n'
            '  "actions": [\n'
            '    {\n'
            '      "action": "处置动作类型",\n'
            '      "action_name": "处置动作中文描述",\n'
            '      "target": "处置目标（IP/用户/主机/文件等）",\n'
            '      "priority": "优先级（P0/P1/P2/P3）",\n'
            '      "execution_mode": "执行方式（auto/semi-auto/manual）",\n'
            '      "expected_effect": "预期效果描述",\n'
            '      "risk_of_action": "执行该动作可能带来的风险",\n'
            '      "confidence": 该动作的推荐置信度0-100,\n'
            '      "timeframe": "建议执行时间窗口（immediate/1h/4h/24h/72h）"\n'
            "    },\n"
            '    ...\n'
            "  ],\n"
            '  "do_not_actions": ["不建议执行的处置动作及原因"],\n'
            '  "escalation_required": true/false,\n'
            '  "escalation_reason": "升级原因（如需升级）",\n'
            '  "recovery_steps": ["恢复步骤1", ...],\n'
            '  "prevention_measures": ["预防措施1", ...],\n'
            '  "decision_confidence": 整体决策置信度0-100\n'
            "}\n\n"
            "只返回JSON，不要返回任何其他内容。"
        )

        analysis_json = json.dumps(analysis_result, ensure_ascii=False, default=str)

        user_prompt = (
            f"请基于以下安全分析结果制定处置决策方案：\n\n"
            f"```json\n{analysis_json}\n```\n\n"
            "--- 处置决策示例（Few-Shot） ---\n\n"
            "示例输入：\n"
            "{\n"
            '  "event_type": "phishing",\n'
            '  "severity": "critical",\n'
            '  "confidence": 95,\n'
            '  "attack_chain": [\n'
            '    {"tactic": "Initial Access", "technique": "T1566", "description": "钓鱼邮件投递"},\n'
            '    {"tactic": "Execution", "technique": "T1204", "description": "用户执行恶意附件"},\n'
            '    {"tactic": "C2", "technique": "T1071", "description": "恶意软件回连C2"}\n'
            "  ],\n"
            '  "affected_entities": {"users": ["zhangsan", "lisi"], "hosts": ["WKSTN-015", "WKSTN-022"], "ips": ["185.220.101.34"]},\n'
            '  "evidence_strength": "strong"\n'
            "}\n\n"
            "示例输出：\n"
            "{\n"
            '  "decision_id": "DEC-20240115-001",\n'
            '  "overall_assessment": "确认一起高级钓鱼攻击事件，2台终端已被感染并建立C2通信。攻击处于活跃状态，需立即启动应急响应。",\n'
            '  "risk_level": "critical",\n'
            '  "actions": [\n'
            '    {\n'
            '      "action": "isolate_host",\n'
            '      "action_name": "隔离受感染主机",\n'
            '      "target": "WKSTN-015, WKSTN-022",\n'
            '      "priority": "P0",\n'
            '      "execution_mode": "auto",\n'
            '      "expected_effect": "阻断C2通信和横向移动，防止攻击扩散",\n'
            '      "risk_of_action": "可能中断用户正常工作，建议提前通知",\n'
            '      "confidence": 95,\n'
            '      "timeframe": "immediate"\n'
            "    },\n"
            '    {\n'
            '      "action": "disable_account",\n'
            '      "action_name": "禁用受影响用户账号",\n'
            '      "target": "zhangsan, lisi",\n'
            '      "priority": "P0",\n'
            '      "execution_mode": "auto",\n'
            '      "expected_effect": "防止攻击者继续使用窃取的凭证",\n'
            '      "risk_of_action": "用户无法正常工作，需配合临时账号",\n'
            '      "confidence": 92,\n'
            '      "timeframe": "immediate"\n'
            "    },\n"
            '    {\n'
            '      "action": "block_ip",\n'
            '      "action_name": "封禁C2通信IP",\n'
            '      "target": "185.220.101.34",\n'
            '      "priority": "P0",\n'
            '      "execution_mode": "auto",\n'
            '      "expected_effect": "阻断恶意软件与C2服务器的通信",\n'
            '      "risk_of_action": "低风险，但需确认无合法业务依赖此IP",\n'
            '      "confidence": 90,\n'
            '      "timeframe": "immediate"\n'
            "    },\n"
            '    {\n'
            '      "action": "start_forensic",\n'
            '      "action_name": "启动数字取证",\n'
            '      "target": "WKSTN-015, WKSTN-022",\n'
            '      "priority": "P1",\n'
            '      "execution_mode": "semi-auto",\n'
            '      "expected_effect": "获取完整攻击证据，确认攻击范围和影响",\n'
            '      "risk_of_action": "低风险",\n'
            '      "confidence": 85,\n'
            '      "timeframe": "4h"\n'
            "    },\n"
            '    {\n'
            '      "action": "force_password_reset",\n'
            '      "action_name": "强制重置受影响用户密码",\n'
            '      "target": "zhangsan, lisi",\n'
            '      "priority": "P1",\n'
            '      "execution_mode": "semi-auto",\n'
            '      "expected_effect": "使已泄露的凭证失效",\n'
            '      "risk_of_action": "用户需重新设置密码，影响有限",\n'
            '      "confidence": 88,\n'
            '      "timeframe": "1h"\n'
            "    },\n"
            '    {\n'
            '      "action": "escalate_to_management",\n'
            '      "action_name": "升级到管理层",\n'
            '      "target": "信息安全负责人、IT部门负责人",\n'
            '      "priority": "P1",\n'
            '      "execution_mode": "semi-auto",\n'
            '      "expected_effect": "确保管理层知情并协调资源",\n'
            '      "risk_of_action": "无风险",\n'
            '      "confidence": 90,\n'
            '      "timeframe": "1h"\n'
            "    }\n"
            "  ],\n"
            '  "do_not_actions": [\n'
            '    "不要立即删除钓鱼邮件（需保留作为取证证据）",\n'
            '    "不要直接在受感染主机上运行杀毒扫描（可能触发反取证机制）"\n'
            "  ],\n"
            '  "escalation_required": true,\n'
            '  "escalation_reason": "事件影响多个用户和主机，涉及C2通信，属于高级威胁事件，需管理层协调跨部门响应",\n'
            '  "recovery_steps": [\n'
            '    "对受感染主机进行格式化重装",\n'
            '    "从干净备份恢复用户数据",\n'
            '    "部署EDR策略加强终端防护",\n'
            '    "对受影响用户进行安全意识培训"\n'
            "  ],\n"
            '  "prevention_measures": [\n'
            '    "加强邮件网关过滤规则",\n'
            '    "部署邮件附件沙箱检测",\n'
            '    "启用宏安全策略（默认禁用外部宏）",\n'
            '    "加强用户安全意识培训频率"\n'
            "  ],\n"
            '  "decision_confidence": 92\n'
            "}\n\n"
            "请严格遵循上述JSON格式输出处置决策结果。"
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    # ========================================================================
    # 报告生成
    # ========================================================================

    @staticmethod
    def report_generation(analysis_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        生成结构化的安全事件调查分析报告。

        Args:
            analysis_data: 包含事件信息、分析过程、证据链、处置记录等完整数据

        Returns:
            messages 列表，包含 system 和 user 角色消息
        """
        system_prompt = (
            "你是一位资深的安全运营报告撰写专家，擅长将复杂的安全事件分析转化为"
            "结构清晰、易于理解的专业安全报告。\n\n"
            "你的任务是基于安全事件的全量分析数据，生成一份完整的调查分析报告。"
            "报告应面向不同读者群体（管理层、技术团队、合规审计），包含不同层次的详细信息。\n\n"
            "报告要求：\n"
            "1. 执行摘要：面向管理层，简明扼要（300字以内）\n"
            "2. 技术分析：面向技术团队，包含完整攻击链和MITRE ATT&CK映射\n"
            "3. 时间线：以表格形式展示关键事件时间线\n"
            "4. 影响评估：量化分析业务影响\n"
            "5. 处置总结：已执行和待执行的处置措施\n"
            "6. 改进建议：短期和长期的改进措施\n\n"
            "你必须以严格的JSON格式返回结果，格式如下：\n"
            "{\n"
            '  "report_id": "报告唯一标识",\n'
            '  "report_title": "报告标题",\n'
            '  "generated_at": "生成时间（ISO格式）",\n'
            '  "classification": "报告密级（public/internal/confidential/secret）",\n'
            '  "executive_summary": {\n'
            '    "overview": "事件概述（面向管理层，简明扼要）",\n'
            '    "impact": "业务影响总结",\n'
            '    "current_status": "当前状态",\n'
            '    "key_findings": ["关键发现1", "关键发现2", ...],\n'
            '    "recommendation_summary": "管理层建议摘要"\n'
            "  },\n"
            '  "technical_analysis": {\n'
            '    "event_detail": {\n'
            '      "title": "事件标题",\n'
            '      "type": "事件类型",\n'
            '      "severity": "严重程度",\n'
            '      "detection_time": "检测时间",\n'
            '      "detection_method": "检测方式",\n'
            '      "source_system": "来源系统"\n'
            "    },\n"
            '    "attack_chain": [\n'
            '      {"phase": "攻击阶段", "technique": "技术描述", "mitre_id": "MITRE ID", "detail": "详细分析"},\n'
            '      ...\n'
            "    ],\n"
            '    "iocs": {\n'
            '      "ips": ["恶意IP列表"],\n'
            '      "domains": ["恶意域名列表"],\n'
            '      "hashes": ["恶意文件哈希列表"],\n'
            '      "urls": ["恶意URL列表"],\n'
            '      "emails": ["恶意邮箱列表"]\n'
            "    },\n"
            '    "affected_assets": [\n'
            '      {"asset": "资产标识", "type": "资产类型", "impact": "影响描述"},\n'
            '      ...\n'
            "    ],\n"
            '    "root_cause": "根本原因分析"\n'
            "  },\n"
            '  "timeline": [\n'
            '    {"time": "时间", "event": "事件描述", "source": "数据来源", "category": "事件类别"},\n'
            '    ...\n'
            "  ],\n"
            '  "impact_assessment": {\n'
            '    "confidentiality_impact": "机密性影响（none/low/medium/high/critical）",\n'
            '    "integrity_impact": "完整性影响（none/low/medium/high/critical）",\n'
            '    "availability_impact": "可用性影响（none/low/medium/high/critical）",\n'
            '    "financial_impact_estimate": "财务影响估算（中文描述）",\n'
            '    "data_compromised": "可能泄露的数据类型",\n'
            '    "affected_users_count": "受影响用户数量"\n'
            "  },\n"
            '  "response_summary": {\n'
            '    "actions_taken": ["已执行的处置动作列表"],\n'
            '    "actions_pending": ["待执行的处置动作列表"],\n'
            '    "containment_status": "遏制状态（contained/partial/uncontained）",\n'
            '    "eradication_status": "清除状态（complete/in_progress/not_started）",\n'
            '    "recovery_status": "恢复状态（complete/in_progress/not_started）"\n'
            "  },\n"
            '  "recommendations": {\n'
            '    "immediate": ["立即执行的建议"],\n'
            '    "short_term": ["短期建议（1-4周）"],\n'
            '    "long_term": ["长期建议（1-6个月）"]\n'
            "  },\n"
            '  "appendix": {\n'
            '    "references": ["参考链接或文档"],\n'
            '    "glossary": [{"term": "术语", "definition": "定义"}]\n'
            "  }\n"
            "}\n\n"
            "只返回JSON，不要返回任何其他内容。"
        )

        analysis_json = json.dumps(analysis_data, ensure_ascii=False, default=str)

        user_prompt = (
            f"请基于以下安全分析数据生成完整的调查分析报告：\n\n"
            f"```json\n{analysis_json}\n```\n\n"
            "--- 报告生成示例（Few-Shot，部分字段） ---\n\n"
            "示例输出片段（执行摘要部分）：\n"
            "{\n"
            '  "executive_summary": {\n'
            '    "overview": "2024年1月15日09:30，安全运营中心检测到一起针对财务部门的定向钓鱼攻击事件。攻击者伪装为IT部门发送钓鱼邮件，诱导2名员工点击恶意链接，导致其终端被植入远控木马并建立C2通信。安全团队于09:45启动应急响应，于10:30完成事件遏制。",\n'
            '    "impact": "2台终端被感染，2个用户凭证可能泄露，敏感财务数据存在被访问风险。目前未发现数据外传的确凿证据，但无法完全排除。业务影响：受影响用户在4小时内无法正常使用终端，财务部门部分工作受到延误。",\n'
            '    "current_status": "事件已遏制，受感染终端已隔离，用户凭证已重置。正在进行深度取证分析以确认数据是否外泄。预计24小时内完成全部恢复工作。",\n'
            '    "key_findings": [\n'
            '      "攻击者使用域名欺骗技术（micr0soft.com），高度仿真IT部门邮件",\n'
            '      "恶意载荷通过PowerShell下载，绕过了邮件网关的静态检测",\n'
            '      "C2通信使用HTTPS加密，增加了流量检测难度",\n'
            '      "威胁情报关联显示C2基础设施与APT-29组织存在关联"\n'
            '    ],\n'
            '    "recommendation_summary": "建议立即加强邮件安全网关的高级威胁检测能力，对所有员工进行钓鱼邮件识别培训，并部署EDR的终端行为检测策略以增强类似攻击的检测能力。"\n'
            "  }\n"
            "}\n\n"
            "请严格遵循上述JSON格式输出完整报告。"
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    # ========================================================================
    # 安全问答
    # ========================================================================

    @staticmethod
    def security_qa(
        question: str,
        context: str = "",
    ) -> List[Dict[str, str]]:
        """
        回答一般性安全运营问题，支持带上下文和不带上下文两种模式。

        Args:
            question: 用户提出的安全相关问题
            context: 可选，额外的上下文信息（如当前告警列表、系统状态等）

        Returns:
            messages 列表，包含 system 和 user 角色消息
        """
        system_prompt = (
            "你是 SecMind 安全运营平台的 AI 安全助手，专门为安全分析师提供专业支持。\n\n"
            "你的能力范围包括：\n"
            "1. 安全事件分析：解释安全告警含义、分析攻击手法、评估威胁等级\n"
            "2. MITRE ATT&CK 框架：解释攻击战术和技术、提供检测和缓解建议\n"
            "3. 安全运营最佳实践：SIEM规则编写、告警调优、应急响应流程\n"
            "4. 威胁情报：IOC解读、攻击组织分析、威胁趋势\n"
            "5. 日志分析：帮助理解各类安全日志（防火墙、EDR、VPN、AD等）\n"
            "6. 处置建议：针对特定安全场景提供处置步骤\n"
            "7. 合规与标准：ISO 27001、等保2.0、GDPR等相关问题\n\n"
            "回答原则：\n"
            "- 回答应专业、准确、简洁\n"
            "- 涉及具体操作时，提供可执行的步骤\n"
            "- 如问题超出你的知识范围，诚实说明并建议其他资源\n"
            "- 使用中文回答\n"
            "- 涉及MITRE ATT&CK时，提供具体的战术和技术ID\n"
            "- 涉及安全配置时，说明适用场景和潜在风险\n\n"
            "你必须以严格的JSON格式返回结果，格式如下：\n"
            "{\n"
            '  "answer_type": "回答类型（technical_analysis/operational_guidance/threat_intel/best_practice/general_knowledge/compliance）",\n'
            '  "summary": "回答摘要（一句话）",\n'
            '  "detailed_answer": "详细回答内容",\n'
            '  "key_points": ["要点1", "要点2", ...],\n'
            '  "actionable_steps": ["可执行步骤1", "可执行步骤2", ...],\n'
            '  "related_topics": ["相关主题1", "相关主题2", ...],\n'
            '  "references": ["参考来源1", ...],\n'
            '  "confidence": 回答置信度0-100\n'
            "}\n\n"
            "只返回JSON，不要返回任何其他内容。"
        )

        context_section = ""
        if context:
            context_section = f"## 当前上下文信息\n{context}\n\n"

        user_prompt = (
            f"{context_section}"
            f"## 用户问题\n{question}\n\n"
            "--- 安全问答示例（Few-Shot） ---\n\n"
            "示例1：\n"
            "问题：如何判断一条VPN异地登录告警是否为真实威胁？\n\n"
            "回答：\n"
            "{\n"
            '  "answer_type": "operational_guidance",\n'
            '  "summary": "通过多维指标交叉验证VPN异地登录告警的真伪，核心是计算不可能旅行时间和行为基线偏离度。",\n'
            '  "detailed_answer": "判断VPN异地登录是否为真实威胁，需要从以下维度进行交叉验证：\\n\\n1. 不可能旅行分析：计算用户上次登录地点与本次登录地点的地理距离，结合两次登录的时间间隔，判断是否可能通过正常旅行完成。例如，用户1小时前在北京登录，1小时后在纽约登录，这在物理上不可能，高度可疑。\\n\\n2. 行为基线偏离：分析用户的历史登录模式（常用时间段、常用IP段、常用设备），计算当前登录行为与基线的偏离度。偏离度超过阈值（通常80%）则高度可疑。\\n\\n3. 多源数据关联：将VPN日志与AD域控日志、终端日志、威胁情报进行关联。例如，同一IP是否同时尝试RDP连接、是否有暴力破解痕迹、IP是否在威胁情报库中标记为恶意。\\n\\n4. 用户上下文：检查用户是否在休假、是否提交了出差申请、是否有特殊工作安排。这些上下文信息可以从HR系统或用户确认获得。\\n\\n5. MFA状态：检查多因素认证是否被触发、是否被绕过。MFA被绕过是账号失陷的强信号。",\n'
            '  "key_points": [\n'
            '    "不可能旅行分析是最直观的判断指标",\n'
            '    "行为基线偏离度需要历史数据支撑",\n'
            '    "多源数据关联可大幅降低误报率",\n'
            '    "MFA绕过是账号失陷的强信号"\n'
            "  ],\n"
            '  "actionable_steps": [\n'
            '    "1. 查询VPN日志，获取源IP和登录时间戳",\n'
            '    "2. 查询该用户最近24小时的登录历史，计算不可能旅行",\n'
            '    "3. 查询UEBA系统的用户行为基线偏离度",\n'
            '    "4. 在威胁情报平台查询源IP信誉",\n'
            '    "5. 检查AD域控日志，确认MFA状态和是否有异常认证",\n'
            '    "6. 如确认为真实威胁，立即禁用账号并强制注销所有会话"\n'
            "  ],\n"
            '  "related_topics": ["暴力破解检测", "凭证泄露响应", "零信任架构", "UEBA配置"],\n'
            '  "references": ["MITRE ATT&CK T1078 - Valid Accounts", "NIST SP 800-63B - Digital Identity Guidelines"],\n'
            '  "confidence": 95\n'
            "}\n\n"
            "示例2：\n"
            "问题：什么是MITRE ATT&CK中的T1059，如何检测和防御？\n\n"
            "回答：\n"
            "{\n"
            '  "answer_type": "technical_analysis",\n'
            '  "summary": "T1059是命令和脚本解释器技术，攻击者利用PowerShell、Python、Bash等脚本语言执行恶意命令。检测关键在于监控脚本引擎的异常调用行为。",\n'
            '  "detailed_answer": "MITRE ATT&CK T1059 - Command and Scripting Interpreter 是攻击者在执行阶段最常用的技术之一。\\n\\n技术原理：攻击者利用操作系统内置的脚本解释器（PowerShell、cmd、Python、Bash、VBScript等）执行恶意代码，因为脚本引擎是合法系统组件，不易被杀毒软件拦截。\\n\\n常见子技术：\\n- T1059.001 PowerShell：最常用的子技术，支持无文件攻击\\n- T1059.003 Windows Command Shell：利用cmd.exe执行批处理命令\\n- T1059.005 Visual Basic：利用VBA宏在Office文档中执行\\n- T1059.006 Python：利用Python解释器执行恶意脚本\\n- T1059.004 Unix Shell：针对Linux/macOS系统的攻击\\n\\n检测方法：\\n1. 监控PowerShell的命令行参数（-EncodedCommand、-ExecutionPolicy Bypass、-WindowStyle Hidden）\\n2. 监控脚本引擎进程的父子关系（如Word.exe启动PowerShell.exe）\\n3. 监控脚本引擎的网络连接（PowerShell发起对外HTTP请求）\\n4. 启用PowerShell脚本块日志记录（Script Block Logging）\\n5. 监控WMI和COM对象的异常调用\\n\\n防御措施：\\n1. 启用PowerShell约束语言模式（Constrained Language Mode）\\n2. 配置AppLocker或WDAC限制脚本执行\\n3. 禁用不必要的脚本解释器\\n4. 部署EDR解决方案进行行为检测",\n'
            '  "key_points": [\n'
            '    "T1059涵盖多种脚本解释器，PowerShell是最常用的子技术",\n'
            '    "攻击者利用脚本引擎的白名单特性绕过传统杀毒软件",\n'
            '    "检测重点在于脚本引擎的异常调用模式而非静态签名",\n'
            '    "启用PowerShell日志记录是性价比最高的检测手段"\n'
            "  ],\n"
            '  "actionable_steps": [\n'
            '    "1. 在域控上通过GPO启用PowerShell脚本块日志记录",\n'
            '    "2. 配置SIEM规则监控PowerShell的EncodedCommand参数",\n'
            '    "3. 创建EDR检测规则：非交互式脚本引擎进程发起网络连接",\n'
            '    "4. 评估业务需求后，考虑启用PowerShell约束语言模式",\n'
            '    "5. 定期审计脚本执行日志，建立正常行为基线"\n'
            "  ],\n"
            '  "related_topics": ["T1055 进程注入", "T1027 混淆文件或信息", "T1562 削弱防御", "无文件攻击"],\n'
            '  "references": ["https://attack.mitre.org/techniques/T1059/", "Microsoft PowerShell Security Best Practices"],\n'
            '  "confidence": 98\n'
            "}\n\n"
            "请严格遵循上述JSON格式回答用户问题。"
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    # ========================================================================
    # 便捷方法：构建带上下文的安全问答
    # ========================================================================

    @classmethod
    def security_qa_with_alerts(
        cls,
        question: str,
        alerts: List[Dict[str, Any]],
        system_status: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, str]]:
        """
        结合当前告警和系统状态回答安全问题的便捷方法。

        Args:
            question: 用户问题
            alerts: 当前告警列表
            system_status: 可选，系统状态信息

        Returns:
            messages 列表
        """
        context_parts = []

        if alerts:
            alert_summaries = []
            for alert in alerts[:10]:
                alert_summaries.append(
                    f"- [{alert.get('severity', 'unknown').upper()}] "
                    f"{alert.get('title', '未命名告警')} "
                    f"(ID: {alert.get('id', 'N/A')}, "
                    f"来源: {alert.get('source', '未知')})"
                )
            context_parts.append(f"## 当前活跃告警\n" + "\n".join(alert_summaries))

        if system_status:
            context_parts.append(
                f"## 系统状态\n{json.dumps(system_status, ensure_ascii=False)}"
            )

        context = "\n\n".join(context_parts) if context_parts else ""
        return cls.security_qa(question, context)


prompt_templates = PromptTemplate()