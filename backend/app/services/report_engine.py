import uuid
import json
import shutil
import subprocess
import tempfile
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.models.alert import Alert
from app.models.device import Device
from app.models.itsm import ITSMTicket
from app.models.response_action import ResponseAction
from app.models.hunting_hypothesis import HuntingHypothesis
from app.models.compliance import ComplianceFramework, ComplianceAssessment, ComplianceResult, ComplianceControl
from app.models.strategy import Strategy


REPORT_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "daily_security_overview": {
        "name": "每日安全概览",
        "description": "今日告警、事件、响应动作汇总，快速了解当日安全态势",
        "sql_queries": [
            {
                "name": "today_alerts_total",
                "query": text(
                    "SELECT COUNT(*) as total FROM alerts "
                    "WHERE date(timestamp) = date(:today)"
                ),
            },
            {
                "name": "today_alerts_by_level",
                "query": text(
                    "SELECT risk_level, COUNT(*) as cnt FROM alerts "
                    "WHERE date(timestamp) = date(:today) "
                    "GROUP BY risk_level"
                ),
            },
            {
                "name": "today_alerts_by_type",
                "query": text(
                    "SELECT type, COUNT(*) as cnt FROM alerts "
                    "WHERE date(timestamp) = date(:today) "
                    "GROUP BY type"
                ),
            },
            {
                "name": "today_response_actions",
                "query": text(
                    "SELECT status, COUNT(*) as cnt FROM response_actions "
                    "WHERE date(created_at) = date(:today) "
                    "GROUP BY status"
                ),
            },
            {
                "name": "today_incidents",
                "query": text(
                    "SELECT risk_level, COUNT(*) as cnt FROM alerts "
                    "WHERE date(timestamp) = date(:today) AND risk_level IN ('严重', '高')"
                ),
            },
            {
                "name": "today_resolved",
                "query": text(
                    "SELECT COUNT(*) as cnt FROM alerts "
                    "WHERE date(timestamp) = date(:today) AND status = '已解决'"
                ),
            },
            {
                "name": "today_actions_by_type",
                "query": text(
                    "SELECT action_type, COUNT(*) as cnt FROM response_actions "
                    "WHERE date(created_at) = date(:today) "
                    "GROUP BY action_type"
                ),
            },
        ],
        "chart_config": {
            "main_chart": {
                "type": "bar",
                "title": "今日告警风险等级分布",
                "options": {
                    "x_axis": "risk_level",
                    "y_axis": "count",
                    "color_scheme": ["#e94560", "#f57c00", "#f5a623", "#28a745"],
                },
            },
            "secondary_chart": {
                "type": "pie",
                "title": "今日告警类型占比",
                "options": {
                    "label_field": "type",
                    "value_field": "cnt",
                },
            },
            "response_chart": {
                "type": "doughnut",
                "title": "今日响应动作状态",
                "options": {
                    "label_field": "status",
                    "value_field": "cnt",
                    "colors": {
                        "pending": "#f5a623",
                        "executing": "#1976d2",
                        "completed": "#28a745",
                        "failed": "#e94560",
                    },
                },
            },
        },
        "sections": [
            {
                "title": "关键指标概览",
                "description": "当日告警总数、严重告警数、已解决数和响应动作统计",
                "query_refs": ["today_alerts_total", "today_incidents", "today_resolved", "today_response_actions"],
            },
            {
                "title": "告警风险等级分布",
                "description": "按严重、高、中、低等级展示今日告警分布情况",
                "query_refs": ["today_alerts_by_level"],
            },
            {
                "title": "告警类型分析",
                "description": "今日告警按攻击类型分类统计，识别主要威胁类型",
                "query_refs": ["today_alerts_by_type"],
            },
            {
                "title": "响应处置概况",
                "description": "当日响应动作的执行状态和类型分布",
                "query_refs": ["today_actions_by_type"],
            },
        ],
    },
    "weekly_security_report": {
        "name": "每周安全报告",
        "description": "本周安全趋势、TOP威胁类型、MTTR/MTTD指标综合分析",
        "description_en": "Weekly trends, top threats, MTTR/MTTD metrics",
        "sql_queries": [
            {
                "name": "weekly_alerts_total",
                "query": text(
                    "SELECT COUNT(*) as total FROM alerts "
                    "WHERE timestamp >= date(:week_start) AND timestamp < date(:week_end, '+1 day')"
                ),
            },
            {
                "name": "weekly_alerts_by_level",
                "query": text(
                    "SELECT risk_level, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:week_start) AND timestamp < date(:week_end, '+1 day') "
                    "GROUP BY risk_level"
                ),
            },
            {
                "name": "weekly_alerts_by_type",
                "query": text(
                    "SELECT type, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:week_start) AND timestamp < date(:week_end, '+1 day') "
                    "GROUP BY type ORDER BY cnt DESC"
                ),
            },
            {
                "name": "weekly_top_threats",
                "query": text(
                    "SELECT type, risk_level, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:week_start) AND timestamp < date(:week_end, '+1 day') "
                    "AND risk_level IN ('严重', '高') "
                    "GROUP BY type, risk_level ORDER BY cnt DESC LIMIT 10"
                ),
            },
            {
                "name": "weekly_response_stats",
                "query": text(
                    "SELECT status, COUNT(*) as cnt FROM response_actions "
                    "WHERE created_at >= date(:week_start) AND created_at < date(:week_end, '+1 day') "
                    "GROUP BY status"
                ),
            },
            {
                "name": "weekly_daily_trend",
                "query": text(
                    "SELECT date(timestamp) as day, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:week_start) AND timestamp < date(:week_end, '+1 day') "
                    "GROUP BY date(timestamp) ORDER BY day"
                ),
            },
            {
                "name": "mttr_data",
                "query": text(
                    "SELECT AVG(strftime('%s', completed_at) - strftime('%s', created_at)) as avg_seconds "
                    "FROM response_actions "
                    "WHERE status = 'completed' AND completed_at IS NOT NULL "
                    "AND created_at >= date(:week_start) AND created_at < date(:week_end, '+1 day')"
                ),
            },
            {
                "name": "mttd_data",
                "query": text(
                    "SELECT AVG(strftime('%s', timestamp) - strftime('%s', 'now')) as avg_detect "
                    "FROM alerts "
                    "WHERE timestamp >= date(:week_start) AND timestamp < date(:week_end, '+1 day')"
                ),
            },
        ],
        "chart_config": {
            "trend_chart": {
                "type": "line",
                "title": "本周每日告警趋势",
                "options": {
                    "x_axis": "day",
                    "y_axis": "cnt",
                    "line_color": "#1976d2",
                    "fill_area": True,
                },
            },
            "threat_pie": {
                "type": "pie",
                "title": "本周告警类型分布",
                "options": {
                    "label_field": "type",
                    "value_field": "cnt",
                },
            },
            "risk_bar": {
                "type": "bar",
                "title": "本周告警风险等级",
                "options": {
                    "x_axis": "risk_level",
                    "y_axis": "cnt",
                    "color_scheme": ["#e94560", "#f57c00", "#f5a623", "#28a745"],
                },
            },
            "mttr_gauge": {
                "type": "gauge",
                "title": "MTTR 平均响应时间",
                "options": {
                    "unit": "分钟",
                    "max": 1440,
                    "thresholds": {"green": 30, "yellow": 120, "red": 480},
                },
            },
        },
        "sections": [
            {
                "title": "本周安全态势总览",
                "description": "展示本周告警总数、严重告警趋势和整体风险概况",
                "query_refs": ["weekly_alerts_total", "weekly_alerts_by_level"],
            },
            {
                "title": "每日告警趋势",
                "description": "本周每日告警数量变化趋势，识别异常波动",
                "query_refs": ["weekly_daily_trend"],
            },
            {
                "title": "TOP 威胁类型分析",
                "description": "本周高危告警的攻击类型排行，识别主要安全威胁",
                "query_refs": ["weekly_top_threats", "weekly_alerts_by_type"],
            },
            {
                "title": "MTTR/MTTD 响应效率指标",
                "description": "平均响应时间(MTTR)和平均检测时间(MTTD)分析",
                "query_refs": ["mttr_data", "mttd_data"],
            },
            {
                "title": "响应处置统计",
                "description": "本周响应动作执行状态汇总",
                "query_refs": ["weekly_response_stats"],
            },
        ],
    },
    "monthly_security_report": {
        "name": "每月安全报告",
        "description": "月度安全总结、趋势分析及改进建议",
        "description_en": "Monthly summary, trend analysis, recommendations",
        "sql_queries": [
            {
                "name": "monthly_alerts_total",
                "query": text(
                    "SELECT COUNT(*) as total FROM alerts "
                    "WHERE timestamp >= date(:month_start) AND timestamp < date(:month_start, '+1 month')"
                ),
            },
            {
                "name": "monthly_alerts_by_level",
                "query": text(
                    "SELECT risk_level, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:month_start) AND timestamp < date(:month_start, '+1 month') "
                    "GROUP BY risk_level"
                ),
            },
            {
                "name": "monthly_alerts_by_type",
                "query": text(
                    "SELECT type, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:month_start) AND timestamp < date(:month_start, '+1 month') "
                    "GROUP BY type ORDER BY cnt DESC"
                ),
            },
            {
                "name": "monthly_weekly_trend",
                "query": text(
                    "SELECT strftime('%W', timestamp) as week_num, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:month_start) AND timestamp < date(:month_start, '+1 month') "
                    "GROUP BY week_num ORDER BY week_num"
                ),
            },
            {
                "name": "monthly_resolved_rate",
                "query": text(
                    "SELECT "
                    "  COUNT(CASE WHEN status = '已解决' THEN 1 END) * 100.0 / COUNT(*) as resolution_rate "
                    "FROM alerts "
                    "WHERE timestamp >= date(:month_start) AND timestamp < date(:month_start, '+1 month')"
                ),
            },
            {
                "name": "monthly_response_efficiency",
                "query": text(
                    "SELECT action_type, "
                    "  COUNT(*) as total, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed "
                    "FROM response_actions "
                    "WHERE created_at >= date(:month_start) AND created_at < date(:month_start, '+1 month') "
                    "GROUP BY action_type"
                ),
            },
            {
                "name": "monthly_risk_comparison",
                "query": text(
                    "SELECT "
                    "  COUNT(CASE WHEN risk_level = '严重' THEN 1 END) as critical, "
                    "  COUNT(CASE WHEN risk_level = '高' THEN 1 END) as high, "
                    "  COUNT(CASE WHEN risk_level = '中' THEN 1 END) as medium, "
                    "  COUNT(CASE WHEN risk_level = '低' THEN 1 END) as low "
                    "FROM alerts "
                    "WHERE timestamp >= date(:month_start) AND timestamp < date(:month_start, '+1 month')"
                ),
            },
        ],
        "chart_config": {
            "trend_line": {
                "type": "line",
                "title": "本月每周告警趋势",
                "options": {
                    "x_axis": "week_num",
                    "y_axis": "cnt",
                    "line_color": "#1976d2",
                    "fill_area": True,
                },
            },
            "risk_distribution": {
                "type": "doughnut",
                "title": "本月风险等级分布",
                "options": {
                    "label_field": "risk_level",
                    "value_field": "cnt",
                    "color_scheme": ["#e94560", "#f57c00", "#f5a623", "#28a745"],
                },
            },
            "type_bar": {
                "type": "horizontal_bar",
                "title": "本月告警类型排行",
                "options": {
                    "x_axis": "cnt",
                    "y_axis": "type",
                },
            },
            "efficiency_radar": {
                "type": "radar",
                "title": "响应处置效率雷达图",
                "options": {
                    "dimensions": ["action_type"],
                    "metrics": ["completed_rate", "total"],
                },
            },
        },
        "sections": [
            {
                "title": "月度安全态势总览",
                "description": "本月安全告警整体情况，包括总数、风险分布和解决率",
                "query_refs": ["monthly_alerts_total", "monthly_alerts_by_level", "monthly_resolved_rate"],
            },
            {
                "title": "每周趋势分析",
                "description": "本月各周告警数量变化趋势，分析安全态势走向",
                "query_refs": ["monthly_weekly_trend"],
            },
            {
                "title": "威胁类型深度分析",
                "description": "本月主要攻击类型统计和对比分析",
                "query_refs": ["monthly_alerts_by_type", "monthly_risk_comparison"],
            },
            {
                "title": "响应处置效率评估",
                "description": "本月各类响应动作的执行效率和成功率分析",
                "query_refs": ["monthly_response_efficiency"],
            },
            {
                "title": "改进建议与下月计划",
                "description": "基于本月数据分析，提出安全改进建议和下月重点关注事项",
                "query_refs": [],
            },
        ],
    },
    "attack_type_distribution": {
        "name": "攻击类型分布",
        "description": "攻击类型饼图/柱状图数据，直观展示威胁构成",
        "description_en": "Pie/bar chart data for attack types",
        "sql_queries": [
            {
                "name": "attack_type_overall",
                "query": text(
                    "SELECT type, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:start_date) AND timestamp <= date(:end_date) "
                    "GROUP BY type ORDER BY cnt DESC"
                ),
            },
            {
                "name": "attack_type_by_risk",
                "query": text(
                    "SELECT type, risk_level, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:start_date) AND timestamp <= date(:end_date) "
                    "GROUP BY type, risk_level ORDER BY cnt DESC"
                ),
            },
            {
                "name": "attack_source_distribution",
                "query": text(
                    "SELECT source, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:start_date) AND timestamp <= date(:end_date) "
                    "AND source IS NOT NULL AND source != '' "
                    "GROUP BY source ORDER BY cnt DESC LIMIT 20"
                ),
            },
            {
                "name": "attack_ip_top",
                "query": text(
                    "SELECT source_ip, type, COUNT(*) as cnt FROM alerts "
                    "WHERE timestamp >= date(:start_date) AND timestamp <= date(:end_date) "
                    "AND source_ip IS NOT NULL AND source_ip != '' "
                    "GROUP BY source_ip ORDER BY cnt DESC LIMIT 20"
                ),
            },
        ],
        "chart_config": {
            "type_pie": {
                "type": "pie",
                "title": "攻击类型占比",
                "options": {
                    "label_field": "type",
                    "value_field": "cnt",
                    "show_legend": True,
                    "show_percentage": True,
                },
            },
            "type_bar": {
                "type": "bar",
                "title": "攻击类型数量排行",
                "options": {
                    "x_axis": "type",
                    "y_axis": "cnt",
                    "sort_descending": True,
                },
            },
            "risk_heatmap": {
                "type": "heatmap",
                "title": "攻击类型-风险等级热力图",
                "options": {
                    "x_axis": "risk_level",
                    "y_axis": "type",
                    "value_field": "cnt",
                },
            },
            "source_treemap": {
                "type": "treemap",
                "title": "攻击来源分布",
                "options": {
                    "label_field": "source",
                    "value_field": "cnt",
                },
            },
        },
        "sections": [
            {
                "title": "攻击类型总体分布",
                "description": "展示所选时间段内所有攻击类型的数量和占比",
                "query_refs": ["attack_type_overall"],
            },
            {
                "title": "攻击类型与风险等级交叉分析",
                "description": "按攻击类型和风险等级交叉统计，识别高危攻击类型",
                "query_refs": ["attack_type_by_risk"],
            },
            {
                "title": "攻击来源分析",
                "description": "统计攻击来源分布，识别主要攻击来源",
                "query_refs": ["attack_source_distribution"],
            },
            {
                "title": "TOP 攻击源IP",
                "description": "高频攻击源IP排行，辅助封禁决策",
                "query_refs": ["attack_ip_top"],
            },
        ],
    },
    "mttr_analysis": {
        "name": "MTTR 响应时间分析",
        "description": "平均响应时间(Mean Time to Respond)分析，评估处置效率",
        "description_en": "Mean time to respond analysis",
        "sql_queries": [
            {
                "name": "mttr_overall",
                "query": text(
                    "SELECT "
                    "  AVG(strftime('%s', completed_at) - strftime('%s', created_at)) as avg_seconds, "
                    "  MIN(strftime('%s', completed_at) - strftime('%s', created_at)) as min_seconds, "
                    "  MAX(strftime('%s', completed_at) - strftime('%s', created_at)) as max_seconds, "
                    "  COUNT(*) as total_completed "
                    "FROM response_actions "
                    "WHERE status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL"
                ),
            },
            {
                "name": "mttr_by_type",
                "query": text(
                    "SELECT action_type, "
                    "  AVG(strftime('%s', completed_at) - strftime('%s', created_at)) as avg_seconds, "
                    "  COUNT(*) as cnt "
                    "FROM response_actions "
                    "WHERE status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL "
                    "GROUP BY action_type"
                ),
            },
            {
                "name": "mttr_by_priority",
                "query": text(
                    "SELECT priority, "
                    "  AVG(strftime('%s', completed_at) - strftime('%s', created_at)) as avg_seconds, "
                    "  COUNT(*) as cnt "
                    "FROM response_actions "
                    "WHERE status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL "
                    "GROUP BY priority"
                ),
            },
            {
                "name": "mttr_trend",
                "query": text(
                    "SELECT date(created_at) as day, "
                    "  AVG(strftime('%s', completed_at) - strftime('%s', created_at)) as avg_seconds, "
                    "  COUNT(*) as cnt "
                    "FROM response_actions "
                    "WHERE status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL "
                    "AND created_at >= date(:start_date) AND created_at <= date(:end_date) "
                    "GROUP BY date(created_at) ORDER BY day"
                ),
            },
            {
                "name": "mttr_by_status_transition",
                "query": text(
                    "SELECT "
                    "  COUNT(*) as total_actions, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed, "
                    "  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending "
                    "FROM response_actions"
                ),
            },
        ],
        "chart_config": {
            "mttr_gauge": {
                "type": "gauge",
                "title": "总体平均响应时间 (MTTR)",
                "options": {
                    "unit": "分钟",
                    "max": 1440,
                    "thresholds": {"green": 30, "yellow": 120, "red": 480},
                },
            },
            "mttr_by_type_bar": {
                "type": "horizontal_bar",
                "title": "各类型响应时间对比",
                "options": {
                    "x_axis": "avg_minutes",
                    "y_axis": "action_type",
                    "sort_descending": False,
                },
            },
            "mttr_trend_line": {
                "type": "line",
                "title": "MTTR 每日趋势",
                "options": {
                    "x_axis": "day",
                    "y_axis": "avg_minutes",
                    "line_color": "#e94560",
                },
            },
            "priority_radar": {
                "type": "radar",
                "title": "不同优先级响应时间",
                "options": {
                    "dimensions": ["priority"],
                    "metrics": ["avg_minutes"],
                },
            },
        },
        "sections": [
            {
                "title": "MTTR 总体指标",
                "description": "平均响应时间、最小/最大响应时间等核心指标概览",
                "query_refs": ["mttr_overall"],
            },
            {
                "title": "按响应类型分析",
                "description": "不同响应动作类型的平均响应时间对比",
                "query_refs": ["mttr_by_type"],
            },
            {
                "title": "按优先级分析",
                "description": "不同优先级响应动作的平均响应时间",
                "query_refs": ["mttr_by_priority"],
            },
            {
                "title": "MTTR 趋势变化",
                "description": "每日MTTR变化趋势，评估响应效率是否改善",
                "query_refs": ["mttr_trend"],
            },
        ],
    },
    "disposal_efficiency": {
        "name": "处置效率分析",
        "description": "响应动作执行效率指标分析，评估安全运营处置能力",
        "description_en": "Response action efficiency metrics",
        "sql_queries": [
            {
                "name": "efficiency_overview",
                "query": text(
                    "SELECT "
                    "  COUNT(*) as total_actions, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed, "
                    "  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending, "
                    "  COUNT(CASE WHEN status = 'executing' THEN 1 END) as executing, "
                    "  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) as success_rate "
                    "FROM response_actions"
                ),
            },
            {
                "name": "efficiency_by_type",
                "query": text(
                    "SELECT action_type, "
                    "  COUNT(*) as total, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed, "
                    "  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) as success_rate, "
                    "  AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL "
                    "    THEN strftime('%s', completed_at) - strftime('%s', created_at) END) as avg_seconds "
                    "FROM response_actions "
                    "GROUP BY action_type"
                ),
            },
            {
                "name": "efficiency_daily",
                "query": text(
                    "SELECT date(created_at) as day, "
                    "  COUNT(*) as total, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed "
                    "FROM response_actions "
                    "WHERE created_at >= date(:start_date) AND created_at <= date(:end_date) "
                    "GROUP BY date(created_at) ORDER BY day"
                ),
            },
            {
                "name": "efficiency_by_priority",
                "query": text(
                    "SELECT priority, "
                    "  COUNT(*) as total, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed, "
                    "  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) as success_rate "
                    "FROM response_actions "
                    "GROUP BY priority"
                ),
            },
            {
                "name": "alert_resolution_rate",
                "query": text(
                    "SELECT "
                    "  COUNT(*) as total_alerts, "
                    "  COUNT(CASE WHEN status = '已解决' THEN 1 END) as resolved, "
                    "  COUNT(CASE WHEN status = '待处理' THEN 1 END) as pending, "
                    "  COUNT(CASE WHEN status = '处理中' THEN 1 END) as processing, "
                    "  ROUND(COUNT(CASE WHEN status = '已解决' THEN 1 END) * 100.0 / COUNT(*), 1) as resolution_rate "
                    "FROM alerts"
                ),
            },
            {
                "name": "efficiency_ai_vs_manual",
                "query": text(
                    "SELECT "
                    "  CASE WHEN requested_by = 'AI引擎' THEN 'AI自动' ELSE '人工处置' END as source, "
                    "  COUNT(*) as total, "
                    "  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed, "
                    "  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) as success_rate "
                    "FROM response_actions "
                    "GROUP BY CASE WHEN requested_by = 'AI引擎' THEN 'AI自动' ELSE '人工处置' END"
                ),
            },
        ],
        "chart_config": {
            "success_gauge": {
                "type": "gauge",
                "title": "总体处置成功率",
                "options": {
                    "unit": "%",
                    "max": 100,
                    "thresholds": {"green": 90, "yellow": 70, "red": 50},
                },
            },
            "type_efficiency_bar": {
                "type": "bar",
                "title": "各类型处置成功率",
                "options": {
                    "x_axis": "action_type",
                    "y_axis": "success_rate",
                    "color_by_value": True,
                },
            },
            "daily_trend_line": {
                "type": "line",
                "title": "每日处置完成/失败趋势",
                "options": {
                    "x_axis": "day",
                    "y_axis": ["completed", "failed"],
                    "multi_series": True,
                },
            },
            "ai_vs_manual_pie": {
                "type": "pie",
                "title": "AI自动 vs 人工处置占比",
                "options": {
                    "label_field": "source",
                    "value_field": "total",
                },
            },
        },
        "sections": [
            {
                "title": "处置效率总览",
                "description": "总体处置成功率、完成数、失败数等关键效率指标",
                "query_refs": ["efficiency_overview"],
            },
            {
                "title": "按处置类型效率分析",
                "description": "不同处置类型的成功率和平均响应时间对比",
                "query_refs": ["efficiency_by_type"],
            },
            {
                "title": "告警解决率",
                "description": "告警整体解决情况，评估安全运营团队的处置能力",
                "query_refs": ["alert_resolution_rate"],
            },
            {
                "title": "AI自动 vs 人工处置对比",
                "description": "AI自动处置和人工处置的效率和成功率对比",
                "query_refs": ["efficiency_ai_vs_manual"],
            },
            {
                "title": "每日处置趋势",
                "description": "每日处置完成和失败的趋势变化",
                "query_refs": ["efficiency_daily"],
            },
        ],
    },
}


_report_cache: Dict[str, dict] = {}


class ReportEngine:

    TEMPLATES = {
        "security_overview": "安全概览报表",
        "threat_analysis": "威胁分析报表",
        "incident_response": "事件响应报表",
        "compliance_status": "合规状态报表",
        "vulnerability_summary": "漏洞汇总报表",
        "executive_summary": "高管摘要报表",
        "mlps_compliance": "等保2.0合规报表",
        "gdpr_compliance": "GDPR合规报表",
        "iso27001_compliance": "ISO 27001合规报表",
        "cis_compliance": "CIS Controls v8合规报表",
        "daily_security_overview": "每日安全概览",
        "weekly_security_report": "每周安全报告",
        "monthly_security_report": "每月安全报告",
        "attack_type_distribution": "攻击类型分布",
        "mttr_analysis": "MTTR响应时间分析",
        "disposal_efficiency": "处置效率分析",
    }

    TEMPLATE_DESCRIPTIONS = {
        "security_overview": "全面展示安全运营态势，包括告警统计、设备状态、风险分布等关键指标",
        "threat_analysis": "深度分析威胁情报，涵盖攻击类型、IOC指标、狩猎假设等威胁信息",
        "incident_response": "汇总事件响应情况，包括响应动作、工单处理、处置效率等运营数据",
        "compliance_status": "呈现合规评估状态，包括各框架合规得分、控制项达标情况等",
        "vulnerability_summary": "梳理漏洞风险概况，按风险等级、类型、状态分类展示漏洞信息",
        "executive_summary": "面向管理层的精简摘要，聚焦核心KPI、关键风险和改进建议",
        "mlps_compliance": "等保2.0合规评估报表，涵盖物理环境、通信网络、区域边界等九大控制域合规状态及整改建议",
        "gdpr_compliance": "GDPR合规评估报表，涵盖数据处理活动、数据主体权利、跨境传输等合规要求及违规记录",
        "iso27001_compliance": "ISO 27001合规评估报表，涵盖Annex A控制措施、风险评估结果、适用性声明及改进机会",
        "cis_compliance": "CIS Controls v8合规评估报表，涵盖18个关键安全控制措施在IG1/IG2/IG3三个实施组中的合规状态和成熟度评估",
        "daily_security_overview": "今日告警、事件、响应动作汇总，快速了解当日安全态势",
        "weekly_security_report": "本周安全趋势、TOP威胁类型、MTTR/MTTD指标综合分析",
        "monthly_security_report": "月度安全总结、趋势分析及改进建议",
        "attack_type_distribution": "攻击类型饼图/柱状图数据，直观展示威胁构成",
        "mttr_analysis": "平均响应时间(MTTR)分析，评估处置效率",
        "disposal_efficiency": "响应动作执行效率指标分析，评估安全运营处置能力",
    }

    @staticmethod
    def get_templates() -> List[Dict[str, Any]]:
        """返回所有可用的报表模板，包含名称、描述、SQL查询、图表配置和分区信息"""
        result = []
        for template_id, template in REPORT_TEMPLATES.items():
            result.append({
                "id": template_id,
                "name": template["name"],
                "description": template["description"],
                "sql_queries": [
                    {"name": q["name"], "query_str": str(q["query"])}
                    for q in template["sql_queries"]
                ],
                "chart_config": template["chart_config"],
                "sections": template["sections"],
            })
        return result

    @staticmethod
    def get_template(template_name: str) -> Optional[Dict[str, Any]]:
        """获取单个模板定义"""
        return REPORT_TEMPLATES.get(template_name)

    @staticmethod
    def generate_report(
        db: Session,
        template_name: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """根据模板名称和参数执行SQL查询并构建报表数据"""
        template = REPORT_TEMPLATES.get(template_name)
        if not template:
            return {
                "error": f"未知模板: {template_name}",
                "available": list(REPORT_TEMPLATES.keys()),
            }

        params = params or {}
        report_id = str(uuid.uuid4())
        now = datetime.now()

        query_results: Dict[str, Any] = {}
        default_params = ReportEngine._build_default_params(template_name, now)

        for sql_query in template["sql_queries"]:
            query_name = sql_query["name"]
            try:
                merged_params = {**default_params, **params}
                query_params = {
                    k: v for k, v in merged_params.items()
                    if f":{k}" in str(sql_query["query"])
                }

                result = db.execute(sql_query["query"], query_params)
                rows = result.fetchall()
                columns = list(result.keys())

                if len(rows) == 1 and len(columns) == 1:
                    query_results[query_name] = rows[0][0]
                elif len(rows) == 1:
                    query_results[query_name] = dict(zip(columns, rows[0]))
                else:
                    query_results[query_name] = [
                        dict(zip(columns, row)) for row in rows
                    ]
            except Exception as e:
                query_results[query_name] = {"error": str(e)}

        sections_data = []
        for section in template["sections"]:
            section_data = {
                "title": section["title"],
                "description": section["description"],
                "data": {
                    ref: query_results.get(ref)
                    for ref in section.get("query_refs", [])
                },
            }
            sections_data.append(section_data)

        report = {
            "id": report_id,
            "template_id": template_name,
            "template_name": template["name"],
            "title": params.get("title", template["name"]),
            "params": params,
            "generated_at": now.isoformat(),
            "chart_config": template["chart_config"],
            "sections": sections_data,
            "raw_data": query_results,
            "status": "completed",
        }

        _report_cache[report_id] = report
        return report

    @staticmethod
    def export_report(
        db: Session,
        template_name: str,
        format: str = "json",
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """导出报表数据为指定格式，当前支持 JSON（PDF/CSV 由前端处理）"""
        if format not in ("json", "csv"):
            return {"error": f"不支持的导出格式: {format}，支持: json, csv"}

        report = ReportEngine.generate_report(db, template_name, params)
        if "error" in report:
            return report

        if format == "json":
            export_data = {
                "report_id": report["id"],
                "template_id": report["template_id"],
                "template_name": report["template_name"],
                "generated_at": report["generated_at"],
                "format": "json",
                "data": {
                    "chart_config": report["chart_config"],
                    "sections": report["sections"],
                    "raw_data": report["raw_data"],
                },
            }
            return export_data

        if format == "csv":
            csv_parts = []
            for section in report["sections"]:
                csv_parts.append(f"# {section['title']}")
                csv_parts.append(f"# {section['description']}")
                for ref_name, ref_data in section.get("data", {}).items():
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
            return {
                "report_id": report["id"],
                "format": "csv",
                "csv_content": "\n".join(csv_parts),
            }

        return report

    @staticmethod
    def _build_default_params(template_name: str, now: datetime) -> Dict[str, Any]:
        """根据模板名称构建默认时间参数"""
        today = now.strftime("%Y-%m-%d")
        today_date = now.date()

        if template_name == "daily_security_overview":
            return {"today": today}

        if template_name == "weekly_security_report":
            week_start = today_date - timedelta(days=today_date.weekday())
            return {
                "week_start": week_start.strftime("%Y-%m-%d"),
                "week_end": (week_start + timedelta(days=6)).strftime("%Y-%m-%d"),
            }

        if template_name == "monthly_security_report":
            month_start = today_date.replace(day=1)
            return {"month_start": month_start.strftime("%Y-%m-%d")}

        if template_name in ("attack_type_distribution",):
            return {
                "start_date": (today_date - timedelta(days=30)).strftime("%Y-%m-%d"),
                "end_date": today,
            }

        if template_name == "mttr_analysis":
            return {
                "start_date": (today_date - timedelta(days=30)).strftime("%Y-%m-%d"),
                "end_date": today,
            }

        if template_name == "disposal_efficiency":
            return {
                "start_date": (today_date - timedelta(days=30)).strftime("%Y-%m-%d"),
                "end_date": today,
            }

        return {"start_date": today, "end_date": today}

    async def generate_report(self, template_id: str, params: dict, db: Session) -> dict:
        if template_id not in self.TEMPLATES:
            return {"error": f"未知模板: {template_id}", "available": list(self.TEMPLATES.keys())}

        if template_id in REPORT_TEMPLATES:
            merged_params = params or {}
            if "title" in merged_params:
                merged_params.pop("title")
            report = self.generate_report(db, template_id, merged_params)
            if "error" not in report:
                title = (params or {}).get("title")
                if title:
                    report["title"] = title
                return report

        data = await self._collect_data(template_id, db)
        title = params.get("title") if params else None
        report_title = title or self.TEMPLATES[template_id]

        report_id = str(uuid.uuid4())
        now = datetime.now()

        html_content = self._render_html(template_id, report_title, data, now)

        report = {
            "id": report_id,
            "template_id": template_id,
            "template_name": self.TEMPLATES[template_id],
            "title": report_title,
            "params": params or {},
            "generated_at": now.isoformat(),
            "html_content": html_content,
            "data": data,
            "status": "completed",
        }

        _report_cache[report_id] = report
        return report

    async def export_pdf(self, report_id: str) -> Optional[bytes]:
        report = _report_cache.get(report_id)
        if not report:
            return None

        html_content = report["html_content"]
        return self._html_to_pdf(html_content)

    def list_templates(self) -> List[dict]:
        return [
            {
                "id": tid,
                "name": name,
                "description": self.TEMPLATE_DESCRIPTIONS.get(tid, ""),
            }
            for tid, name in self.TEMPLATES.items()
        ]

    async def get_report(self, report_id: str) -> Optional[dict]:
        return _report_cache.get(report_id)

    def get_report_history(self, limit: int = 20, offset: int = 0) -> dict:
        reports = sorted(_report_cache.values(), key=lambda r: r["generated_at"], reverse=True)
        total = len(reports)
        page = reports[offset: offset + limit]
        return {
            "total": total,
            "items": [
                {
                    "id": r["id"],
                    "template_id": r["template_id"],
                    "template_name": r["template_name"],
                    "title": r["title"],
                    "generated_at": r["generated_at"],
                    "status": r["status"],
                }
                for r in page
            ],
        }

    async def _collect_data(self, template_id: str, db: Session) -> dict:
        collectors = {
            "security_overview": self._collect_security_overview,
            "threat_analysis": self._collect_threat_analysis,
            "incident_response": self._collect_incident_response,
            "compliance_status": self._collect_compliance_status,
            "vulnerability_summary": self._collect_vulnerability_summary,
            "executive_summary": self._collect_executive_summary,
            "mlps_compliance": self._collect_mlps_data,
            "gdpr_compliance": self._collect_gdpr_data,
            "iso27001_compliance": self._collect_iso27001_data,
            "cis_compliance": self._collect_cis_data,
        }
        collector = collectors.get(template_id)
        if collector:
            return await collector(db)
        return {}

    async def _collect_security_overview(self, db: Session) -> dict:
        total_alerts = db.query(func.count(Alert.id)).scalar() or 0
        critical_alerts = db.query(func.count(Alert.id)).filter(Alert.risk_level == "严重").scalar() or 0
        high_alerts = db.query(func.count(Alert.id)).filter(Alert.risk_level == "高").scalar() or 0
        medium_alerts = db.query(func.count(Alert.id)).filter(Alert.risk_level == "中").scalar() or 0
        low_alerts = db.query(func.count(Alert.id)).filter(Alert.risk_level == "低").scalar() or 0
        pending_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "待处理").scalar() or 0
        processing_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "处理中").scalar() or 0
        resolved_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "已解决").scalar() or 0

        total_devices = db.query(func.count(Device.id)).scalar() or 0
        online_devices = db.query(func.count(Device.id)).filter(Device.status == "online").scalar() or 0
        offline_devices = total_devices - online_devices

        alert_by_type = {}
        for row in db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all():
            if row[0]:
                alert_by_type[row[0]] = row[1]

        recent_alerts = db.query(Alert).order_by(Alert.id.desc()).limit(10).all()

        return {
            "alert_stats": {
                "total": total_alerts,
                "by_risk_level": {"严重": critical_alerts, "高": high_alerts, "中": medium_alerts, "低": low_alerts},
                "by_status": {"待处理": pending_alerts, "处理中": processing_alerts, "已解决": resolved_alerts},
                "by_type": alert_by_type,
            },
            "device_stats": {
                "total": total_devices,
                "online": online_devices,
                "offline": offline_devices,
            },
            "recent_alerts": [
                {
                    "id": a.id,
                    "title": a.title,
                    "risk_level": a.risk_level,
                    "status": a.status,
                    "type": a.type,
                    "timestamp": a.timestamp.isoformat() if a.timestamp else None,
                }
                for a in recent_alerts
            ],
        }

    async def _collect_threat_analysis(self, db: Session) -> dict:
        alert_by_type = {}
        for row in db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all():
            if row[0]:
                alert_by_type[row[0]] = row[1]

        alert_by_source = {}
        for row in db.query(Alert.source, func.count(Alert.id)).group_by(Alert.source).all():
            if row[0]:
                alert_by_source[row[0]] = row[1]

        hypotheses = db.query(HuntingHypothesis).order_by(HuntingHypothesis.id.desc()).limit(20).all()
        hypothesis_by_status = {}
        for row in db.query(HuntingHypothesis.status, func.count(HuntingHypothesis.id)).group_by(HuntingHypothesis.status).all():
            if row[0]:
                hypothesis_by_status[row[0]] = row[1]

        tactic_dist = {}
        for row in db.query(HuntingHypothesis.tactic, func.count(HuntingHypothesis.id)).group_by(HuntingHypothesis.tactic).all():
            if row[0]:
                tactic_dist[row[0]] = row[1]

        critical_alerts = db.query(Alert).filter(Alert.risk_level.in_(["严重", "高"])).order_by(Alert.id.desc()).limit(15).all()

        return {
            "alert_type_distribution": alert_by_type,
            "alert_source_distribution": alert_by_source,
            "hypothesis_stats": {
                "total": len(hypotheses),
                "by_status": hypothesis_by_status,
                "by_tactic": tactic_dist,
            },
            "hypotheses": [
                {
                    "id": h.id,
                    "name": h.name,
                    "tactic": h.tactic,
                    "technique": h.technique,
                    "status": h.status,
                    "confidence": h.confidence,
                    "ioc_count": h.ioc_count,
                }
                for h in hypotheses
            ],
            "critical_alerts": [
                {
                    "id": a.id,
                    "title": a.title,
                    "risk_level": a.risk_level,
                    "source": a.source,
                    "source_ip": a.source_ip,
                    "destination_ip": a.destination_ip,
                    "type": a.type,
                }
                for a in critical_alerts
            ],
        }

    async def _collect_incident_response(self, db: Session) -> dict:
        total_actions = db.query(func.count(ResponseAction.id)).scalar() or 0
        completed_actions = db.query(func.count(ResponseAction.id)).filter(ResponseAction.status == "completed").scalar() or 0
        failed_actions = db.query(func.count(ResponseAction.id)).filter(ResponseAction.status == "failed").scalar() or 0
        pending_actions = db.query(func.count(ResponseAction.id)).filter(ResponseAction.status == "pending").scalar() or 0
        executing_actions = db.query(func.count(ResponseAction.id)).filter(ResponseAction.status == "executing").scalar() or 0

        action_by_type = {}
        for row in db.query(ResponseAction.action_type, func.count(ResponseAction.id)).group_by(ResponseAction.action_type).all():
            if row[0]:
                action_by_type[row[0]] = row[1]

        total_tickets = db.query(func.count(ITSMTicket.id)).scalar() or 0
        pending_tickets = db.query(func.count(ITSMTicket.id)).filter(ITSMTicket.status == "待处理").scalar() or 0
        resolved_tickets = db.query(func.count(ITSMTicket.id)).filter(ITSMTicket.status == "已解决").scalar() or 0

        ticket_by_priority = {}
        for row in db.query(ITSMTicket.priority, func.count(ITSMTicket.id)).group_by(ITSMTicket.priority).all():
            if row[0]:
                ticket_by_priority[row[0]] = row[1]

        recent_actions = db.query(ResponseAction).order_by(ResponseAction.id.desc()).limit(15).all()
        recent_tickets = db.query(ITSMTicket).order_by(ITSMTicket.id.desc()).limit(15).all()

        success_rate = (completed_actions / total_actions * 100) if total_actions > 0 else 0

        return {
            "response_stats": {
                "total_actions": total_actions,
                "completed": completed_actions,
                "failed": failed_actions,
                "pending": pending_actions,
                "executing": executing_actions,
                "success_rate": round(success_rate, 1),
                "by_type": action_by_type,
            },
            "ticket_stats": {
                "total": total_tickets,
                "pending": pending_tickets,
                "resolved": resolved_tickets,
                "by_priority": ticket_by_priority,
            },
            "recent_actions": [
                {
                    "id": a.id,
                    "name": a.name,
                    "action_type": a.action_type,
                    "status": a.status,
                    "priority": a.priority,
                    "requested_by": a.requested_by,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in recent_actions
            ],
            "recent_tickets": [
                {
                    "id": t.id,
                    "title": t.title,
                    "status": t.status,
                    "priority": t.priority,
                    "assignee": t.assignee,
                }
                for t in recent_tickets
            ],
        }

    async def _collect_compliance_status(self, db: Session) -> dict:
        frameworks = db.query(ComplianceFramework).all()
        framework_list = []
        for fw in frameworks:
            latest_assessment = (
                db.query(ComplianceAssessment)
                .filter(ComplianceAssessment.framework_id == fw.id)
                .order_by(ComplianceAssessment.id.desc())
                .first()
            )
            controls = db.query(ComplianceControl).filter(ComplianceControl.framework_id == fw.id).all()

            control_summary = {"compliant": 0, "partially_compliant": 0, "non_compliant": 0, "not_assessed": len(controls)}

            if latest_assessment:
                results = db.query(ComplianceResult).filter(ComplianceResult.assessment_id == latest_assessment.id).all()
                control_summary = {
                    "compliant": sum(1 for r in results if r.status == "compliant"),
                    "partially_compliant": sum(1 for r in results if r.status == "partially_compliant"),
                    "non_compliant": sum(1 for r in results if r.status == "non_compliant"),
                    "not_assessed": sum(1 for r in results if r.status == "not_assessed"),
                }

            framework_list.append({
                "id": fw.id,
                "name": fw.name,
                "code": fw.code,
                "version": fw.version,
                "total_controls": fw.total_controls,
                "overall_score": latest_assessment.overall_score if latest_assessment else None,
                "assessment_status": latest_assessment.status if latest_assessment else "未评估",
                "control_summary": control_summary,
            })

        return {
            "frameworks": framework_list,
            "total_frameworks": len(frameworks),
        }

    async def _collect_vulnerability_summary(self, db: Session) -> dict:
        total_alerts = db.query(func.count(Alert.id)).scalar() or 0
        critical = db.query(func.count(Alert.id)).filter(Alert.risk_level == "严重").scalar() or 0
        high = db.query(func.count(Alert.id)).filter(Alert.risk_level == "高").scalar() or 0
        medium = db.query(func.count(Alert.id)).filter(Alert.risk_level == "中").scalar() or 0
        low = db.query(func.count(Alert.id)).filter(Alert.risk_level == "低").scalar() or 0

        pending = db.query(func.count(Alert.id)).filter(Alert.status == "待处理").scalar() or 0
        processing = db.query(func.count(Alert.id)).filter(Alert.status == "处理中").scalar() or 0
        resolved = db.query(func.count(Alert.id)).filter(Alert.status == "已解决").scalar() or 0

        by_type = {}
        for row in db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all():
            if row[0]:
                by_type[row[0]] = row[1]

        by_source = {}
        for row in db.query(Alert.source, func.count(Alert.id)).group_by(Alert.source).all():
            if row[0]:
                by_source[row[0]] = row[1]

        unresolved_critical = db.query(Alert).filter(
            Alert.risk_level.in_(["严重", "高"]),
            Alert.status.in_(["待处理", "处理中"]),
        ).order_by(Alert.id.desc()).limit(20).all()

        resolution_rate = (resolved / total_alerts * 100) if total_alerts > 0 else 0

        return {
            "overview": {
                "total": total_alerts,
                "resolution_rate": round(resolution_rate, 1),
            },
            "by_risk_level": {"严重": critical, "高": high, "中": medium, "低": low},
            "by_status": {"待处理": pending, "处理中": processing, "已解决": resolved},
            "by_type": by_type,
            "by_source": by_source,
            "unresolved_critical": [
                {
                    "id": a.id,
                    "title": a.title,
                    "risk_level": a.risk_level,
                    "status": a.status,
                    "type": a.type,
                    "source": a.source,
                    "source_ip": a.source_ip,
                }
                for a in unresolved_critical
            ],
        }

    async def _collect_executive_summary(self, db: Session) -> dict:
        total_alerts = db.query(func.count(Alert.id)).scalar() or 0
        critical_alerts = db.query(func.count(Alert.id)).filter(Alert.risk_level == "严重").scalar() or 0
        high_alerts = db.query(func.count(Alert.id)).filter(Alert.risk_level == "高").scalar() or 0
        pending_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "待处理").scalar() or 0

        total_devices = db.query(func.count(Device.id)).scalar() or 0
        online_devices = db.query(func.count(Device.id)).filter(Device.status == "online").scalar() or 0

        total_actions = db.query(func.count(ResponseAction.id)).scalar() or 0
        completed_actions = db.query(func.count(ResponseAction.id)).filter(ResponseAction.status == "completed").scalar() or 0
        success_rate = (completed_actions / total_actions * 100) if total_actions > 0 else 0

        total_tickets = db.query(func.count(ITSMTicket.id)).scalar() or 0
        pending_tickets = db.query(func.count(ITSMTicket.id)).filter(ITSMTicket.status == "待处理").scalar() or 0

        fw_count = db.query(func.count(ComplianceFramework.id)).scalar() or 0
        latest_assessment = db.query(ComplianceAssessment).order_by(ComplianceAssessment.id.desc()).first()
        compliance_score = latest_assessment.overall_score if latest_assessment else None

        active_strategies = db.query(func.count(Strategy.id)).filter(Strategy.is_active == True).scalar() or 0

        return {
            "key_metrics": {
                "total_alerts": total_alerts,
                "critical_alerts": critical_alerts,
                "high_alerts": high_alerts,
                "pending_alerts": pending_alerts,
                "total_devices": total_devices,
                "online_devices": online_devices,
                "response_success_rate": round(success_rate, 1),
                "total_tickets": total_tickets,
                "pending_tickets": pending_tickets,
                "compliance_frameworks": fw_count,
                "compliance_score": compliance_score,
                "active_strategies": active_strategies,
            },
            "risk_assessment": {
                "level": "高" if critical_alerts > 5 else ("中" if high_alerts > 10 else "低"),
                "critical_count": critical_alerts,
                "high_count": high_alerts,
                "pending_count": pending_alerts,
            },
            "recommendations": [],
        }

    MLPS_CONTROL_DOMAINS = [
        {"key": "physical_security", "name": "安全物理环境", "standard_ref": "GB/T 22239-2019 第8.1条", "controls": [
            {"id": "L1-P-01", "name": "物理位置的选择", "requirement": "机房场地应选择在具有防震、防风和防雨等能力的建筑内"},
            {"id": "L1-P-02", "name": "物理访问控制", "requirement": "机房出入口应配置电子门禁系统，控制、鉴别和记录进入的人员"},
            {"id": "L1-P-03", "name": "防盗窃和防破坏", "requirement": "应将主要设备放置在机房内，并设置明显标记"},
            {"id": "L1-P-04", "name": "防雷击", "requirement": "机房应设置防雷保安器，防止雷击产生电磁干扰"},
            {"id": "L1-P-05", "name": "防火", "requirement": "机房应设置火灾自动消防系统，自动检测火情并报警"},
            {"id": "L1-P-06", "name": "防水和防潮", "requirement": "应采取措施防止雨水渗入机房，防止机房内水蒸气结露"},
            {"id": "L1-P-07", "name": "防静电", "requirement": "应采用防静电地板或防静电工作台，对关键设备实施接地保护"},
            {"id": "L1-P-08", "name": "温湿度控制", "requirement": "应设置温湿度自动调节系统，确保机房温湿度在设备允许范围内"},
            {"id": "L1-P-09", "name": "电力供应", "requirement": "应在机房供电线路上配置稳压器和过电压防护设备，提供短期的备用电力供应"},
        ]},
        {"key": "network_security", "name": "安全通信网络", "standard_ref": "GB/T 22239-2019 第8.2条", "controls": [
            {"id": "L1-N-01", "name": "网络架构", "requirement": "应保证网络设备的业务处理能力满足业务高峰期需要"},
            {"id": "L1-N-02", "name": "通信传输", "requirement": "应采用校验技术或密码技术保证通信过程中数据的完整性"},
            {"id": "L1-N-03", "name": "可信接入", "requirement": "可基于可信根对通信双方进行验证和认证"},
            {"id": "L1-N-04", "name": "通信保密性", "requirement": "应采用密码技术保证通信过程中敏感信息字段或整个报文的保密性"},
            {"id": "L1-N-05", "name": "网络性能监控", "requirement": "应监控网络带宽、延迟等关键性能指标，确保通信网络服务质量"},
        ]},
        {"key": "boundary_security", "name": "安全区域边界", "standard_ref": "GB/T 22239-2019 第8.3条", "controls": [
            {"id": "L1-B-01", "name": "边界防护", "requirement": "应保证跨越边界的访问和数据流通过边界设备提供的受控接口进行通信"},
            {"id": "L1-B-02", "name": "访问控制", "requirement": "应在网络边界或区域之间根据访问控制策略设置访问控制规则"},
            {"id": "L1-B-03", "name": "入侵防范", "requirement": "应在关键网络节点处监视网络攻击行为"},
            {"id": "L1-B-04", "name": "恶意代码和垃圾邮件防范", "requirement": "应在关键网络节点处对恶意代码进行检测和清除"},
            {"id": "L1-B-05", "name": "安全审计", "requirement": "应在网络边界对进出网络的数据流进行审计记录"},
            {"id": "L1-B-06", "name": "可信验证", "requirement": "可基于可信根对边界设备的系统引导程序、系统程序等进行可信验证"},
        ]},
        {"key": "compute_security", "name": "安全计算环境", "standard_ref": "GB/T 22239-2019 第8.4条", "controls": [
            {"id": "L1-C-01", "name": "身份鉴别", "requirement": "应对登录的用户进行身份标识和鉴别，身份标识具有唯一性"},
            {"id": "L1-C-02", "name": "访问控制", "requirement": "应根据管理用户的角色分配权限，实现管理用户的权限分离"},
            {"id": "L1-C-03", "name": "安全审计", "requirement": "应启用安全审计功能，审计覆盖到每个用户"},
            {"id": "L1-C-04", "name": "入侵防范", "requirement": "应能够检测到对重要节点进行入侵的行为"},
            {"id": "L1-C-05", "name": "数据完整性", "requirement": "应采用校验技术或密码技术保证重要数据在传输和存储过程中的完整性"},
            {"id": "L1-C-06", "name": "数据保密性", "requirement": "应采用密码技术保证重要数据在传输和存储过程中的保密性"},
            {"id": "L1-C-07", "name": "数据备份恢复", "requirement": "应提供重要数据的本地数据备份与恢复功能"},
            {"id": "L1-C-08", "name": "剩余信息保护", "requirement": "应保证鉴别信息所在的存储空间被释放或重新分配前得到完全清除"},
            {"id": "L1-C-09", "name": "个人信息保护", "requirement": "应仅采集和保存业务必需的用户个人信息"},
            {"id": "L1-C-10", "name": "可信验证", "requirement": "可基于可信根对计算设备的系统引导程序、操作系统等进行可信验证"},
            {"id": "L1-C-11", "name": "恶意代码防范", "requirement": "应安装防恶意代码软件并定期更新，对恶意代码进行实时检测和清除"},
        ]},
        {"key": "management_center", "name": "安全管理中心", "standard_ref": "GB/T 22239-2019 第8.5条", "controls": [
            {"id": "L1-M-01", "name": "系统管理", "requirement": "应对系统管理员进行身份鉴别，只允许其通过特定的命令或操作界面进行系统管理操作"},
            {"id": "L1-M-02", "name": "审计管理", "requirement": "应对审计管理员进行身份鉴别，只允许其通过特定的命令或操作界面进行审计管理操作"},
            {"id": "L1-M-03", "name": "安全管理", "requirement": "应对安全管理员进行身份鉴别，只允许其通过特定的命令或操作界面进行安全管理操作"},
            {"id": "L1-M-04", "name": "集中管控", "requirement": "应划分出特定的管理区域，对分布在网络中的安全设备或安全组件进行管控"},
            {"id": "L1-M-05", "name": "安全事件统一管理", "requirement": "应对网络中发生的安全事件进行集中收集、分析和告警"},
        ]},
        {"key": "policy_management", "name": "安全管理制度", "standard_ref": "GB/T 22239-2019 第9.1条", "controls": [
            {"id": "L1-PM-01", "name": "安全策略", "requirement": "应制定网络安全工作的总体方针和安全策略"},
            {"id": "L1-PM-02", "name": "管理制度", "requirement": "应建立安全管理制度体系，包括制定各项安全管理制度"},
            {"id": "L1-PM-03", "name": "制定和发布", "requirement": "应指定或授权专门的部门或人员负责安全管理制度的制定和发布"},
            {"id": "L1-PM-04", "name": "评审和修订", "requirement": "应定期对安全管理制度的合理性和适用性进行论证和审定"},
        ]},
        {"key": "org_management", "name": "安全管理机构", "standard_ref": "GB/T 22239-2019 第9.2条", "controls": [
            {"id": "L1-ORG-01", "name": "岗位设置", "requirement": "应设立信息安全管理工作的职能部门，设立安全主管、安全管理等岗位"},
            {"id": "L1-ORG-02", "name": "人员配备", "requirement": "应配备专职安全管理员，明确各岗位的安全职责"},
            {"id": "L1-ORG-03", "name": "授权和审批", "requirement": "应明确安全管理的授权和审批流程，对关键活动执行审批"},
            {"id": "L1-ORG-04", "name": "沟通和合作", "requirement": "应建立与外部组织（如监管机构、供应商）的安全沟通合作机制"},
            {"id": "L1-ORG-05", "name": "审核和检查", "requirement": "应定期进行安全检查，检查内容包括安全制度执行情况和系统安全状况"},
        ]},
        {"key": "personnel_management", "name": "安全管理人员", "standard_ref": "GB/T 22239-2019 第9.3条", "controls": [
            {"id": "L1-HR-01", "name": "人员录用", "requirement": "应指定或授权专门的部门或人员负责人员录用"},
            {"id": "L1-HR-02", "name": "人员离岗", "requirement": "应及时终止离岗人员的所有访问权限"},
            {"id": "L1-HR-03", "name": "安全意识教育和培训", "requirement": "应对各类人员进行安全意识教育和岗位技能培训"},
            {"id": "L1-HR-04", "name": "外部人员访问管理", "requirement": "应在外部人员访问受控区域前提出书面申请"},
            {"id": "L1-HR-05", "name": "保密协议", "requirement": "应与关键岗位人员签署保密协议，明确安全责任和违规处罚"},
        ]},
        {"key": "build_management", "name": "安全建设管理", "standard_ref": "GB/T 22239-2019 第9.4条", "controls": [
            {"id": "L1-BD-01", "name": "定级和备案", "requirement": "应以书面的形式说明保护对象的安全保护等级及确定等级的方法"},
            {"id": "L1-BD-02", "name": "安全方案设计", "requirement": "应根据安全保护等级选择基本安全措施，制定安全方案"},
            {"id": "L1-BD-03", "name": "产品采购和使用", "requirement": "应确保网络安全产品采购和使用符合国家的有关规定"},
            {"id": "L1-BD-04", "name": "自行软件开发", "requirement": "应将开发环境与实际运行环境严格分开"},
            {"id": "L1-BD-05", "name": "外包软件开发", "requirement": "应要求开发单位提供软件设计文档和使用指南，并开展代码安全审查"},
            {"id": "L1-BD-06", "name": "工程实施", "requirement": "应指定或授权专门的部门或人员负责工程实施过程的管理"},
            {"id": "L1-BD-07", "name": "测试验收", "requirement": "应进行安全性测试验收"},
            {"id": "L1-BD-08", "name": "系统交付", "requirement": "应制定系统交付清单，并根据交付清单对交接内容进行符合性审查"},
        ]},
        {"key": "ops_management", "name": "安全运维管理", "standard_ref": "GB/T 22239-2019 第9.5条", "controls": [
            {"id": "L1-OP-01", "name": "环境管理", "requirement": "应指定专门的部门或人员负责机房安全"},
            {"id": "L1-OP-02", "name": "资产管理", "requirement": "应编制并保存与保护对象相关的资产清单"},
            {"id": "L1-OP-03", "name": "介质管理", "requirement": "应将介质存放在介质库或档案室中，并实施介质管理"},
            {"id": "L1-OP-04", "name": "设备维护管理", "requirement": "应对配套设施、软硬件设备等进行维护管理"},
            {"id": "L1-OP-05", "name": "漏洞和风险管理", "requirement": "应采取必要的措施识别安全漏洞和隐患"},
            {"id": "L1-OP-06", "name": "网络和系统安全管理", "requirement": "应划分不同的管理员角色进行网络和系统的运维管理"},
            {"id": "L1-OP-07", "name": "恶意代码防范管理", "requirement": "应提高所有用户的防病毒意识，及时更新防病毒软件版本"},
            {"id": "L1-OP-08", "name": "配置管理", "requirement": "应记录和保存基本配置信息，包括网络拓扑结构"},
            {"id": "L1-OP-09", "name": "密码管理", "requirement": "应使用符合国家密码管理规定的密码技术和产品"},
            {"id": "L1-OP-10", "name": "变更管理", "requirement": "应明确变更需求，变更前根据变更方案进行审批"},
            {"id": "L1-OP-11", "name": "备份与恢复管理", "requirement": "应识别需要定期备份的重要业务信息、系统数据及软件系统"},
            {"id": "L1-OP-12", "name": "安全事件处置", "requirement": "应及时向安全管理部门报告所发现的安全弱点和可疑事件"},
            {"id": "L1-OP-13", "name": "应急预案管理", "requirement": "应制定重要事件的应急预案"},
            {"id": "L1-OP-14", "name": "外包运维管理", "requirement": "应确保外包运维服务商在服务过程中遵守安全管理规定"},
            {"id": "L1-OP-15", "name": "持续监控", "requirement": "应建立安全监控机制，对安全设备的运行状态进行持续监控"},
        ]},
    ]

    GDPR_CONTROL_DOMAINS = [
        {"key": "data_processing", "name": "Data Processing Activities", "controls": [
            {"id": "Art.5", "name": "Principles Relating to Processing", "requirement": "Personal data shall be processed lawfully, fairly and transparently; collected for specified purposes; adequate and relevant; accurate; kept no longer than necessary; and processed securely"},
            {"id": "Art.6", "name": "Lawfulness of Processing", "requirement": "Processing shall be lawful only if and to the extent that at least one of the legal bases applies"},
            {"id": "Art.7", "name": "Conditions for Consent", "requirement": "The controller shall be able to demonstrate that the data subject has consented to processing"},
            {"id": "Art.9", "name": "Processing Special Categories", "requirement": "Processing of special categories of personal data shall be prohibited unless specific conditions are met"},
            {"id": "Art.24", "name": "Responsibility of the Controller", "requirement": "The controller shall implement appropriate technical and organisational measures to ensure and demonstrate compliance"},
            {"id": "Art.25", "name": "Data Protection by Design and by Default", "requirement": "The controller shall implement appropriate technical and organisational measures both at the time of determination and processing"},
            {"id": "Art.28", "name": "Processor Obligations", "requirement": "Processing by a processor shall be governed by a contract binding the processor to the controller"},
            {"id": "Art.30", "name": "Records of Processing Activities", "requirement": "Each controller and processor shall maintain a record of processing activities under their responsibility"},
        ]},
        {"key": "data_subject_rights", "name": "Data Subject Rights", "controls": [
            {"id": "Art.12", "name": "Transparent Information", "requirement": "The controller shall take appropriate measures to provide information relating to processing in a concise and transparent form"},
            {"id": "Art.13", "name": "Information at Collection", "requirement": "Where personal data are collected from the data subject, the controller shall provide specified information at the time of collection"},
            {"id": "Art.14", "name": "Information Not Obtained from Subject", "requirement": "Where personal data have not been obtained from the data subject, the controller shall provide specified information"},
            {"id": "Art.15", "name": "Right of Access", "requirement": "The data subject shall have the right to obtain confirmation and access to personal data"},
            {"id": "Art.16", "name": "Right to Rectification", "requirement": "The data subject shall have the right to obtain rectification of inaccurate personal data"},
            {"id": "Art.17", "name": "Right to Erasure", "requirement": "The data subject shall have the right to obtain erasure of personal data (Right to be Forgotten)"},
            {"id": "Art.18", "name": "Right to Restriction", "requirement": "The data subject shall have the right to obtain restriction of processing"},
            {"id": "Art.19", "name": "Notification of Rectification/Erasure", "requirement": "The controller shall communicate any rectification or erasure of personal data to each recipient"},
            {"id": "Art.20", "name": "Right to Data Portability", "requirement": "The data subject shall have the right to receive personal data in a structured, commonly used and machine-readable format"},
            {"id": "Art.21", "name": "Right to Object", "requirement": "The data subject shall have the right to object to processing of personal data including profiling"},
            {"id": "Art.22", "name": "Automated Decision-Making", "requirement": "The data subject shall have the right not to be subject to a decision based solely on automated processing"},
            {"id": "Art.23", "name": "Restrictions", "requirement": "Union or Member State law may restrict the scope of obligations and rights by way of a legislative measure"},
        ]},
        {"key": "dpia", "name": "Data Protection Impact Assessment", "controls": [
            {"id": "Art.35", "name": "Data Protection Impact Assessment", "requirement": "A DPIA shall be carried out when processing is likely to result in a high risk to rights and freedoms; including systematic evaluation, large-scale special categories, or systematic monitoring"},
            {"id": "Art.36", "name": "Prior Consultation", "requirement": "The controller shall consult the supervisory authority prior to processing where DPIA indicates high risk without mitigating measures"},
            {"id": "Art.37", "name": "Data Protection Officer", "requirement": "The controller and processor shall designate a DPO where processing is carried out by a public authority, or requires regular and systematic monitoring on a large scale"},
        ]},
        {"key": "cross_border", "name": "Cross-Border Data Transfers", "controls": [
            {"id": "Art.44", "name": "General Principle for Transfers", "requirement": "Any transfer shall only take place if conditions laid down are met and the level of protection is not undermined"},
            {"id": "Art.45", "name": "Transfers Based on Adequacy Decision", "requirement": "A transfer may take place where the Commission has decided that a third country ensures an adequate level of protection"},
            {"id": "Art.46", "name": "Transfers Subject to Appropriate Safeguards", "requirement": "A transfer may take place provided appropriate safeguards are provided, including standard contractual clauses"},
            {"id": "Art.47", "name": "Binding Corporate Rules", "requirement": "The competent supervisory authority shall approve binding corporate rules for transfers within a group of enterprises"},
            {"id": "Art.49", "name": "Derogations for Specific Situations", "requirement": "In the absence of an adequacy decision or appropriate safeguards, a transfer may take place under specific derogations"},
        ]},
        {"key": "breach_notification", "name": "Breach Notification & Security", "controls": [
            {"id": "Art.32", "name": "Security of Processing", "requirement": "The controller and processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk"},
            {"id": "Art.33", "name": "Notification to Supervisory Authority", "requirement": "The controller shall notify the supervisory authority within 72 hours of becoming aware of a personal data breach"},
            {"id": "Art.34", "name": "Communication to Data Subject", "requirement": "The controller shall communicate a personal data breach to the data subject without undue delay when high risk exists"},
        ]},
    ]

    ISO27001_CONTROL_DOMAINS = [
        {"key": "organizational", "name": "组织控制措施 (A.5)", "annex_ref": "Annex A.5", "controls": [
            {"id": "A.5.1", "name": "信息安全策略", "requirement": "管理层应定义并批准信息安全策略"},
            {"id": "A.5.2", "name": "信息安全角色和职责", "requirement": "应定义并分配信息安全角色和职责"},
            {"id": "A.5.3", "name": "职责分离", "requirement": "应分离冲突的职责和责任领域"},
            {"id": "A.5.4", "name": "管理职责", "requirement": "管理层应要求人员按照信息安全策略适用安全要求"},
            {"id": "A.5.5", "name": "与任职/雇佣条款一致", "requirement": "应在任职或雇佣协议中包含信息安全职责"},
            {"id": "A.5.6", "name": "信息披露", "requirement": "应正式定义、控制和监测信息披露要求"},
            {"id": "A.5.7", "name": "威胁情报", "requirement": "应收集和分析威胁情报相关信息"},
            {"id": "A.5.8", "name": "信息安全在项目管理中", "requirement": "应将信息安全集成到项目管理中"},
            {"id": "A.5.9", "name": "信息及其他关联资产清单", "requirement": "应编制和维护信息和其他关联资产的清单"},
            {"id": "A.5.10", "name": "信息和其它关联资产的可接受使用", "requirement": "应识别、记录和实施信息和其他关联资产的可接受使用规则"},
            {"id": "A.5.11", "name": "资产返还", "requirement": "人员应在变更或终止任职时返还组织的所有资产"},
            {"id": "A.5.12", "name": "信息分类", "requirement": "应根据信息安全需求对信息进行分类"},
            {"id": "A.5.13", "name": "信息标记", "requirement": "应根据组织采用的信息分类方案开发一套信息标记程序"},
            {"id": "A.5.14", "name": "信息传递", "requirement": "组织内部及与其他方之间的信息传递应具有信息传递规则"},
            {"id": "A.5.15", "name": "访问控制", "requirement": "应基于业务和信息安全要求建立、记录和评审访问控制规则"},
            {"id": "A.5.16", "name": "身份管理", "requirement": "应管理身份的完整生命周期"},
            {"id": "A.5.17", "name": "认证信息", "requirement": "应正式管理认证信息的分配和使用"},
            {"id": "A.5.18", "name": "访问权限", "requirement": "应根据访问控制策略提供、评审和调整访问权限"},
            {"id": "A.5.19", "name": "供应商关系中的信息安全", "requirement": "应定义和实施管理供应商使用组织信息相关风险的过程和控制措施"},
            {"id": "A.5.20", "name": "在供应商协议中处理信息安全", "requirement": "应根据供应商类型建立和协商相关的信息安全要求"},
            {"id": "A.5.21", "name": "管理ICT供应链中的信息安全", "requirement": "应定义和实施管理ICT产品和服务供应链中的信息安全风险的过程"},
            {"id": "A.5.22", "name": "供应商服务的监控、评审和变更管理", "requirement": "应定期监控、评审和管理供应商信息安全实践和服务交付的变更"},
            {"id": "A.5.23", "name": "云服务使用的信息安全", "requirement": "应建立获取、使用、管理和退出云服务的过程"},
            {"id": "A.5.24", "name": "信息安全事件管理规划和准备", "requirement": "组织应规划并准备信息安全事件管理"},
            {"id": "A.5.25", "name": "信息安全事件的评估和决策", "requirement": "组织应评估信息安全事件并决策是否将其分类为信息安全事件"},
            {"id": "A.5.26", "name": "信息安全事件响应", "requirement": "应根据已记录的程序响应信息安全事件"},
            {"id": "A.5.27", "name": "从信息安全事件中学习", "requirement": "应运用从信息安全事件中获得的知识来加强和改进信息安全控制"},
            {"id": "A.5.28", "name": "证据收集", "requirement": "组织应建立和实施信息安全事件相关证据的识别、收集、获取和保存程序"},
            {"id": "A.5.29", "name": "中断期间的信息安全", "requirement": "组织应规划如何在中断期间将信息安全维持在适当水平"},
            {"id": "A.5.30", "name": "ICT业务连续性准备", "requirement": "应基于业务连续性目标和ICT连续性要求规划ICT准备"},
            {"id": "A.5.31", "name": "法律、法规和合同要求", "requirement": "应识别并记录信息安全相关的法律、法规和合同要求"},
            {"id": "A.5.32", "name": "知识产权", "requirement": "应实施适当程序保护知识产权"},
            {"id": "A.5.33", "name": "记录保护", "requirement": "应保护记录免于丢失、破坏、伪造、未授权访问和未授权发布"},
            {"id": "A.5.34", "name": "PII的隐私和保护", "requirement": "应根据适用的法律、法规和合同要求识别并满足有关PII保护的要求"},
            {"id": "A.5.35", "name": "信息安全的独立评审", "requirement": "应按照计划的间隔或在发生重大变更时，对信息安全管理进行独立评审"},
            {"id": "A.5.36", "name": "信息安全策略的符合性", "requirement": "应定期评审对信息安全策略和规则的符合性"},
            {"id": "A.5.37", "name": "文件化的操作规程", "requirement": "信息处理设施的操作规程应文件化并可供需要的人员使用"},
        ]},
        {"key": "people", "name": "人员控制措施 (A.6)", "annex_ref": "Annex A.6", "controls": [
            {"id": "A.6.1", "name": "筛选", "requirement": "应对所有求职者进行背景验证筛选，并与相关法律法规保持一致"},
            {"id": "A.6.2", "name": "任职条款和条件", "requirement": "任职合同协议应陈述人员和组织的安全职责"},
            {"id": "A.6.3", "name": "信息安全意识、教育和培训", "requirement": "组织的人员和相关方应接受适当的信息安全意识教育以及组织策略和程序的定期更新"},
            {"id": "A.6.4", "name": "纪律过程", "requirement": "纪律过程应正式化并传达，以对违反信息安全策略的人员采取措施"},
            {"id": "A.6.5", "name": "终止或变更任职后的职责", "requirement": "应定义、执行和传达终止或变更任职后仍然有效的信息安全职责"},
            {"id": "A.6.6", "name": "保密或不泄露协议", "requirement": "反映组织信息保护需求的保密或不泄露协议应予以识别、文件化并定期评审"},
            {"id": "A.6.7", "name": "远程工作", "requirement": "当人员远程工作时，应采取安全措施保护在组织场所外访问、处理或存储的信息"},
            {"id": "A.6.8", "name": "信息安全事件报告", "requirement": "组织应提供一种机制，供人员通过适当渠道报告观察到的或可疑的信息安全事件"},
        ]},
        {"key": "physical", "name": "物理控制措施 (A.7)", "annex_ref": "Annex A.7", "controls": [
            {"id": "A.7.1", "name": "物理安全周界", "requirement": "应定义并使用安全周界保护包含信息和其他关联资产的区域"},
            {"id": "A.7.2", "name": "物理入口", "requirement": "应通过适当的入口控制和访问点来保护安全区域"},
            {"id": "A.7.3", "name": "保护办公室、房间和设施", "requirement": "应为办公室、房间和设施设计并实施物理安全"},
            {"id": "A.7.4", "name": "物理安全监控", "requirement": "应对场所进行持续监控，防止未授权物理访问"},
            {"id": "A.7.5", "name": "防范物理和环境威胁", "requirement": "应设计和实施针对物理和环境威胁（如自然灾害和人为威胁）的保护措施"},
            {"id": "A.7.6", "name": "在安全区域中工作", "requirement": "应为在安全区域中工作设计并实施安全措施"},
            {"id": "A.7.7", "name": "桌面清理和屏幕清空", "requirement": "应为纸张和可移动存储介质定义桌面清理规则，为信息处理设施定义屏幕清空规则"},
            {"id": "A.7.8", "name": "设备放置和保护", "requirement": "应放置和保护设备，以降低来自环境威胁和未授权访问的风险"},
            {"id": "A.7.9", "name": "场外资产安全", "requirement": "应保护场外资产，考虑在组织场所外工作的不同风险"},
            {"id": "A.7.10", "name": "存储介质", "requirement": "应根据组织的分类方案和处理要求，通过获取、使用、传输和处置的全生命周期管理存储介质"},
            {"id": "A.7.11", "name": "支持性设施", "requirement": "应保护信息处理设施免受因支持性设施失效而引起的电源中断和其他中断"},
            {"id": "A.7.12", "name": "布线安全", "requirement": "应保护承载电力、数据或支持信息服务的线缆免受截获、干扰或损坏"},
            {"id": "A.7.13", "name": "设备维护", "requirement": "应正确维护设备，以确保信息的可用性、完整性和保密性"},
            {"id": "A.7.14", "name": "设备的安全处置或重用", "requirement": "应验证包含存储介质的设备在处置或重用前，任何敏感数据和许可软件已被清除"},
        ]},
        {"key": "technological", "name": "技术控制措施 (A.8)", "annex_ref": "Annex A.8", "controls": [
            {"id": "A.8.1", "name": "用户终端设备", "requirement": "应保护存储在用户终端设备上的信息，并管理用户终端设备"},
            {"id": "A.8.2", "name": "特权访问权限", "requirement": "应限制和管理特权访问权限的分配和使用"},
            {"id": "A.8.3", "name": "信息访问限制", "requirement": "应根据访问控制策略限制对信息和其他关联资产的访问"},
            {"id": "A.8.4", "name": "源代码访问", "requirement": "应管理对源代码、开发工具和软件库的读写访问"},
            {"id": "A.8.5", "name": "安全认证", "requirement": "应使用安全认证技术和程序实现安全认证"},
            {"id": "A.8.6", "name": "容量管理", "requirement": "应根据当前和预期的容量要求监视和调整资源使用"},
            {"id": "A.8.7", "name": "防恶意软件", "requirement": "应实施防恶意软件保护，并通过适当的用户意识予以支持"},
            {"id": "A.8.8", "name": "技术漏洞管理", "requirement": "应及时获取使用中的信息系统的技术漏洞信息，评估暴露程度并采取适当措施"},
            {"id": "A.8.9", "name": "配置管理", "requirement": "应建立、记录、实施、监视和评审硬件、软件、服务和网络的配置"},
            {"id": "A.8.10", "name": "信息删除", "requirement": "应删除信息系统、设备或其他存储介质中不再需要的信息"},
            {"id": "A.8.11", "name": "数据脱敏", "requirement": "应根据组织的访问控制策略和其他相关主题特定策略使用数据脱敏"},
            {"id": "A.8.12", "name": "数据防泄漏", "requirement": "应对处理、存储或传输敏感信息的系统、网络和设备应用数据防泄漏措施"},
            {"id": "A.8.13", "name": "信息备份", "requirement": "应维护并定期测试信息和软件的备份副本"},
            {"id": "A.8.14", "name": "信息处理设施的冗余", "requirement": "应实施具有足够冗余的信息处理设施以满足可用性要求"},
            {"id": "A.8.15", "name": "日志记录", "requirement": "应产生、存储、保护和分析记录活动、异常、故障等事件的日志"},
            {"id": "A.8.16", "name": "监控活动", "requirement": "应监视网络、系统和应用程序的异常行为，并采取适当行动评估潜在的信息安全事件"},
            {"id": "A.8.17", "name": "时钟同步", "requirement": "组织使用的信息处理设施内的时钟应同步到批准的时钟源"},
            {"id": "A.8.18", "name": "特权实用程序的使用", "requirement": "应限制并严格控制可能超越系统和应用程序控制的实用程序的使用"},
            {"id": "A.8.19", "name": "运行系统软件的安装", "requirement": "应建立和实施在运行系统中安装软件的程序"},
            {"id": "A.8.20", "name": "网络安全", "requirement": "应管理和控制网络及网络设备以保护系统和应用程序中的信息"},
            {"id": "A.8.21", "name": "网络服务的安全", "requirement": "应识别、实施和监视网络服务的安全机制、服务等级和服务要求"},
            {"id": "A.8.22", "name": "网络隔离", "requirement": "应根据信息分类和业务需求在网络上隔离信息服务组、用户组和信息系统组"},
            {"id": "A.8.23", "name": "Web过滤", "requirement": "应管理对外部网站的访问，以减少恶意内容暴露的风险"},
            {"id": "A.8.24", "name": "密码使用", "requirement": "应定义和实施包括密码密钥管理在内的密码有效使用规则"},
            {"id": "A.8.25", "name": "安全开发生命周期", "requirement": "应为系统和软件的开发建立和应用安全开发生命周期规则"},
            {"id": "A.8.26", "name": "应用安全要求", "requirement": "在开发或获取应用程序时应识别、规定和批准信息安全要求"},
            {"id": "A.8.27", "name": "安全系统架构和工程原理", "requirement": "应建立、记录、维护和应用安全系统工程的原理，并将其应用于所有信息系统开发活动"},
            {"id": "A.8.28", "name": "安全编码", "requirement": "应将安全编码原则应用于软件开发"},
            {"id": "A.8.29", "name": "开发和验收中的安全测试", "requirement": "应在开发生命周期中定义并实施安全测试过程"},
            {"id": "A.8.30", "name": "外包开发", "requirement": "组织应指导、监视和评审与外包系统开发相关的活动"},
            {"id": "A.8.31", "name": "开发、测试和生产环境的分离", "requirement": "应分离并保护开发、测试和生产环境"},
            {"id": "A.8.32", "name": "变更管理", "requirement": "应通过变更管理程序控制对信息处理设施和信息系统的变更"},
            {"id": "A.8.33", "name": "测试信息", "requirement": "应适当选择、保护和管理测试信息"},
            {"id": "A.8.34", "name": "审计期间信息系统的保护", "requirement": "规划和协商影响运行系统的审计活动及测试应最小化对业务过程的干扰"},
        ]},
    ]

    CIS_CONTROL_DOMAINS = [
        {"key": "ig1", "name": "CIS Controls - IG1 (基础网络卫生)", "ig_level": 1, "controls": [
            {"id": "CIS-01", "name": "企业资产的清单和控制", "requirement": "积极管理（盘点、跟踪和纠正）所有连接到企业基础设施的硬件设备"},
            {"id": "CIS-02", "name": "软件资产的清单和控制", "requirement": "积极管理（盘点、跟踪和纠正）操作系统和应用程序中的所有软件"},
            {"id": "CIS-03", "name": "数据保护", "requirement": "开发并维护数据管理流程，以识别、分类、安全处理、保留和处置数据"},
            {"id": "CIS-04", "name": "企业资产和软件的安全配置", "requirement": "通过配置管理建立和维护企业资产和软件的安全配置"},
            {"id": "CIS-05", "name": "账户管理", "requirement": "使用流程和工具来分配和管理授权，以获取企业资产和软件的凭证"},
            {"id": "CIS-06", "name": "访问控制管理", "requirement": "使用流程和工具来创建、分配、管理和撤销访问凭据和权限"},
            {"id": "CIS-07", "name": "持续漏洞管理", "requirement": "制定计划以持续评估和追踪企业资产和软件上的漏洞"},
            {"id": "CIS-08", "name": "审计日志管理", "requirement": "收集、告警、审查和保留事件的审计日志"},
            {"id": "CIS-09", "name": "电子邮件和Web浏览器保护", "requirement": "改进对来自电子邮件和Web向量的威胁的防护和检测"},
            {"id": "CIS-10", "name": "恶意软件防护", "requirement": "防止或控制恶意代码的安装、传播和执行"},
            {"id": "CIS-11", "name": "数据恢复", "requirement": "建立和维护数据恢复实践以恢复企业资产"},
            {"id": "CIS-12", "name": "网络基础设施管理", "requirement": "建立、实施和积极管理网络设备以防止攻击者利用网络服务"},
            {"id": "CIS-13", "name": "网络监控和防御", "requirement": "运行流程和工具以建立和维护全面的网络监控和防御"},
            {"id": "CIS-14", "name": "安全意识与技能培训", "requirement": "建立和维护安全意识计划，以影响员工的行为"},
            {"id": "CIS-15", "name": "服务提供商管理", "requirement": "制定评估持有敏感数据或负责关键IT平台的服务提供商的过程"},
            {"id": "CIS-16", "name": "应用软件安全", "requirement": "管理内部开发、托管或获取的软件的安全生命周期"},
            {"id": "CIS-17", "name": "事件响应管理", "requirement": "建立和维护事件响应能力以准备、检测和快速响应攻击"},
            {"id": "CIS-18", "name": "渗透测试", "requirement": "通过模拟攻击者的技术和过程来测试企业防御的有效性"},
        ]},
        {"key": "ig2", "name": "CIS Controls - IG2 (扩展网络卫生)", "ig_level": 2, "controls": [
            {"id": "CIS-01-IG2", "name": "企业资产的清单和控制 (IG2增强)", "requirement": "实施自动化资产发现，维护完整的硬件资产清单"},
            {"id": "CIS-02-IG2", "name": "软件资产的清单和控制 (IG2增强)", "requirement": "实施软件许可管理，维护授权和未授权软件清单"},
            {"id": "CIS-03-IG2", "name": "数据保护 (IG2增强)", "requirement": "实施数据分类方案，对静态和传输中的敏感数据进行加密"},
            {"id": "CIS-04-IG2", "name": "安全配置 (IG2增强)", "requirement": "对所有资产应用标准化的安全配置模板，实施配置合规性检查"},
            {"id": "CIS-05-IG2", "name": "账户管理 (IG2增强)", "requirement": "实施多因素认证，定期审查和清理特权账户"},
            {"id": "CIS-06-IG2", "name": "访问控制管理 (IG2增强)", "requirement": "实施基于角色的访问控制(RBAC)，采用最小权限原则"},
            {"id": "CIS-07-IG2", "name": "持续漏洞管理 (IG2增强)", "requirement": "实施自动化漏洞扫描，建立漏洞修复SLA"},
            {"id": "CIS-08-IG2", "name": "审计日志管理 (IG2增强)", "requirement": "实施集中化日志管理，建立日志审查和告警机制"},
            {"id": "CIS-09-IG2", "name": "电子邮件和Web浏览器保护 (IG2增强)", "requirement": "部署高级邮件安全网关，实施DNS过滤和Web内容过滤"},
            {"id": "CIS-10-IG2", "name": "恶意软件防护 (IG2增强)", "requirement": "部署端点检测与响应(EDR)解决方案，实施行为分析"},
            {"id": "CIS-11-IG2", "name": "数据恢复 (IG2增强)", "requirement": "实施自动化备份验证，定期测试恢复流程"},
            {"id": "CIS-12-IG2", "name": "网络基础设施管理 (IG2增强)", "requirement": "实施网络分段，部署网络访问控制(NAC)"},
            {"id": "CIS-13-IG2", "name": "网络监控和防御 (IG2增强)", "requirement": "部署入侵检测/防御系统(IDS/IPS)，实施流量分析"},
            {"id": "CIS-14-IG2", "name": "安全意识与技能培训 (IG2增强)", "requirement": "建立角色化安全培训体系，开展钓鱼模拟演练"},
            {"id": "CIS-15-IG2", "name": "服务提供商管理 (IG2增强)", "requirement": "实施供应商安全评估流程，定期审计第三方访问权限"},
            {"id": "CIS-16-IG2", "name": "应用软件安全 (IG2增强)", "requirement": "实施安全代码审查，部署Web应用防火墙(WAF)"},
            {"id": "CIS-17-IG2", "name": "事件响应管理 (IG2增强)", "requirement": "建立正式的事件响应团队和流程，定期开展演练"},
            {"id": "CIS-18-IG2", "name": "渗透测试 (IG2增强)", "requirement": "定期开展内部和外部渗透测试，建立漏洞修复跟踪机制"},
        ]},
        {"key": "ig3", "name": "CIS Controls - IG3 (高级安全实践)", "ig_level": 3, "controls": [
            {"id": "CIS-01-IG3", "name": "企业资产的清单和控制 (IG3增强)", "requirement": "实施实时资产监控，建立资产全生命周期管理"},
            {"id": "CIS-02-IG3", "name": "软件资产的清单和控制 (IG3增强)", "requirement": "实施软件物料清单(SBOM)管理，建立软件供应链安全"},
            {"id": "CIS-03-IG3", "name": "数据保护 (IG3增强)", "requirement": "实施数据防泄漏(DLP)解决方案，建立数据分类自动标记"},
            {"id": "CIS-04-IG3", "name": "安全配置 (IG3增强)", "requirement": "实施基础设施即代码(IaC)安全扫描，建立配置漂移检测"},
            {"id": "CIS-05-IG3", "name": "账户管理 (IG3增强)", "requirement": "实施特权访问管理(PAM)，建立实时会话监控和审计"},
            {"id": "CIS-06-IG3", "name": "访问控制管理 (IG3增强)", "requirement": "实施零信任架构，部署动态访问控制策略"},
            {"id": "CIS-07-IG3", "name": "持续漏洞管理 (IG3增强)", "requirement": "实施威胁情报驱动的漏洞优先级排序，建立自动化修复流水线"},
            {"id": "CIS-08-IG3", "name": "审计日志管理 (IG3增强)", "requirement": "部署SIEM/SOAR平台，实施UEBA用户行为分析"},
            {"id": "CIS-09-IG3", "name": "电子邮件和Web浏览器保护 (IG3增强)", "requirement": "实施浏览器隔离技术，部署AI驱动的威胁检测"},
            {"id": "CIS-10-IG3", "name": "恶意软件防护 (IG3增强)", "requirement": "部署XDR扩展检测与响应，实施威胁狩猎"},
            {"id": "CIS-11-IG3", "name": "数据恢复 (IG3增强)", "requirement": "实施不可变备份和异地容灾，建立业务连续性计划"},
            {"id": "CIS-12-IG3", "name": "网络基础设施管理 (IG3增强)", "requirement": "实施软件定义网络(SDN)安全，部署微分段"},
            {"id": "CIS-13-IG3", "name": "网络监控和防御 (IG3增强)", "requirement": "部署网络检测与响应(NDR)，实施加密流量分析"},
            {"id": "CIS-14-IG3", "name": "安全意识与技能培训 (IG3增强)", "requirement": "建立安全文化度量体系，实施持续性安全意识评估"},
            {"id": "CIS-15-IG3", "name": "服务提供商管理 (IG3增强)", "requirement": "建立供应商风险管理框架，实施持续性安全监控"},
            {"id": "CIS-16-IG3", "name": "应用软件安全 (IG3增强)", "requirement": "实施DevSecOps流水线，部署运行时应用自保护(RASP)"},
            {"id": "CIS-17-IG3", "name": "事件响应管理 (IG3增强)", "requirement": "建立安全编排自动化与响应(SOAR)能力，实施威胁情报共享"},
            {"id": "CIS-18-IG3", "name": "渗透测试 (IG3增强)", "requirement": "实施持续性红队演练，建立攻击模拟(BAS)平台"},
        ]},
    ]

    def _get_framework_data(self, db: Session, framework_code: str) -> dict:
        fw = db.query(ComplianceFramework).filter(ComplianceFramework.code == framework_code).first()
        if not fw:
            return {"framework": None, "assessment": None, "controls": [], "results": []}

        latest_assessment = (
            db.query(ComplianceAssessment)
            .filter(ComplianceAssessment.framework_id == fw.id)
            .order_by(ComplianceAssessment.id.desc())
            .first()
        )

        controls = db.query(ComplianceControl).filter(ComplianceControl.framework_id == fw.id).all()

        results = []
        if latest_assessment:
            results = db.query(ComplianceResult).filter(ComplianceResult.assessment_id == latest_assessment.id).all()

        return {
            "framework": fw,
            "assessment": latest_assessment,
            "controls": controls,
            "results": results,
        }

    async def _collect_mlps_data(self, db: Session) -> dict:
        fw_data = self._get_framework_data(db, "mlps")
        fw = fw_data["framework"]
        assessment = fw_data["assessment"]
        db_controls = fw_data["controls"]
        db_results = fw_data["results"]

        result_map = {}
        if assessment:
            for r in db_results:
                ctrl = db.query(ComplianceControl).filter(ComplianceControl.id == r.control_id).first()
                if ctrl:
                    result_map[ctrl.control_id] = {
                        "status": r.status,
                        "findings": r.findings,
                        "remediation": r.remediation,
                    }

        domains = []
        total_compliant = 0
        total_partial = 0
        total_non_compliant = 0
        total_not_assessed = 0
        total_controls = 0
        non_compliant_items = []

        for domain_def in self.MLPS_CONTROL_DOMAINS:
            domain_controls = []
            domain_compliant = 0
            domain_partial = 0
            domain_non_compliant = 0
            domain_not_assessed = 0

            for ctrl_def in domain_def["controls"]:
                total_controls += 1
                result = result_map.get(ctrl_def["id"])
                if result:
                    status = result["status"]
                    if status == "compliant":
                        domain_compliant += 1
                        total_compliant += 1
                    elif status == "partially_compliant":
                        domain_partial += 1
                        total_partial += 1
                    elif status == "non_compliant":
                        domain_non_compliant += 1
                        total_non_compliant += 1
                        non_compliant_items.append({
                            "domain": domain_def["name"],
                            "control_id": ctrl_def["id"],
                            "control_name": ctrl_def["name"],
                            "requirement": ctrl_def["requirement"],
                            "findings": result.get("findings", ""),
                            "remediation": result.get("remediation", ""),
                        })
                    else:
                        domain_not_assessed += 1
                        total_not_assessed += 1
                else:
                    domain_not_assessed += 1
                    total_not_assessed += 1

                domain_controls.append({
                    "id": ctrl_def["id"],
                    "name": ctrl_def["name"],
                    "requirement": ctrl_def["requirement"],
                    "status": result["status"] if result else "not_assessed",
                    "findings": result.get("findings", "") if result else "",
                    "remediation": result.get("remediation", "") if result else "",
                })

            domain_total = len(domain_def["controls"])
            domain_rate = ((domain_compliant + domain_partial * 0.5) / domain_total * 100) if domain_total > 0 else 0

            domains.append({
                "key": domain_def["key"],
                "name": domain_def["name"],
                "standard_ref": domain_def["standard_ref"],
                "total_controls": domain_total,
                "compliant": domain_compliant,
                "partially_compliant": domain_partial,
                "non_compliant": domain_non_compliant,
                "not_assessed": domain_not_assessed,
                "compliance_rate": round(domain_rate, 1),
                "controls": domain_controls,
            })

        overall_rate = ((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0
        if overall_rate >= 90:
            grade = "优秀"
        elif overall_rate >= 75:
            grade = "良好"
        elif overall_rate >= 60:
            grade = "一般"
        elif overall_rate >= 40:
            grade = "较差"
        else:
            grade = "不合格"

        has_real_data = fw is not None and assessment is not None and len(db_results) > 0

        return {
            "has_real_data": has_real_data,
            "framework_info": {
                "name": fw.name if fw else "信息安全技术 网络安全等级保护基本要求",
                "code": fw.code if fw else "mlps",
                "version": fw.version if fw else "2.0",
                "standard_ref": "GB/T 22239-2019",
            },
            "assessment_info": {
                "name": assessment.name if assessment else "等保2.0合规评估",
                "status": assessment.status if assessment else "completed",
                "assessor": assessment.assessor if assessment else "-",
                "overall_score": assessment.overall_score if assessment and assessment.overall_score else round(overall_rate, 1),
                "completed_at": assessment.completed_at.isoformat() if assessment and assessment.completed_at else None,
            },
            "overview": {
                "total_controls": total_controls,
                "compliant": total_compliant,
                "partially_compliant": total_partial,
                "non_compliant": total_non_compliant,
                "not_assessed": total_not_assessed,
                "compliance_rate": round(overall_rate, 1),
                "grade": grade,
            },
            "domains": domains,
            "non_compliant_items": non_compliant_items,
            "remediation_suggestions": self._generate_mlps_remediations(non_compliant_items),
        }

    def _generate_mlps_remediations(self, non_compliant_items: list) -> list:
        if not non_compliant_items:
            return [{"priority": "信息", "suggestion": "当前所有控制点均已合规，建议持续保持并定期复查"}]

        suggestions = []
        for item in non_compliant_items[:10]:
            if item.get("remediation"):
                suggestions.append({
                    "priority": "高" if item["domain"] in ["安全计算环境", "安全通信网络"] else "中",
                    "domain": item["domain"],
                    "control": item["control_name"],
                    "suggestion": item["remediation"],
                })
            else:
                suggestions.append({
                    "priority": "高" if item["domain"] in ["安全计算环境", "安全通信网络"] else "中",
                    "domain": item["domain"],
                    "control": item["control_name"],
                    "suggestion": f"针对「{item['control_name']}」控制点，建议按照等保2.0要求（{item.get('requirement', '')}）进行整改，确保满足合规要求",
                })
        return suggestions

    async def _collect_gdpr_data(self, db: Session) -> dict:
        fw_data = self._get_framework_data(db, "gdpr")
        fw = fw_data["framework"]
        assessment = fw_data["assessment"]
        db_controls = fw_data["controls"]
        db_results = fw_data["results"]

        result_map = {}
        if assessment:
            for r in db_results:
                ctrl = db.query(ComplianceControl).filter(ComplianceControl.id == r.control_id).first()
                if ctrl:
                    result_map[ctrl.control_id] = {
                        "status": r.status,
                        "findings": r.findings,
                        "remediation": r.remediation,
                    }

        domains = []
        total_compliant = 0
        total_partial = 0
        total_non_compliant = 0
        total_not_assessed = 0
        total_controls = 0
        breach_events = []

        for domain_def in self.GDPR_CONTROL_DOMAINS:
            domain_controls = []
            domain_compliant = 0
            domain_partial = 0
            domain_non_compliant = 0
            domain_not_assessed = 0

            for ctrl_def in domain_def["controls"]:
                total_controls += 1
                result = result_map.get(ctrl_def["id"])
                if result:
                    status = result["status"]
                    if status == "compliant":
                        domain_compliant += 1
                        total_compliant += 1
                    elif status == "partially_compliant":
                        domain_partial += 1
                        total_partial += 1
                    elif status == "non_compliant":
                        domain_non_compliant += 1
                        total_non_compliant += 1
                        if domain_def["key"] == "breach_notification":
                            breach_events.append({
                                "article": ctrl_def["id"],
                                "control_name": ctrl_def["name"],
                                "findings": result.get("findings", ""),
                                "remediation": result.get("remediation", ""),
                            })
                    else:
                        domain_not_assessed += 1
                        total_not_assessed += 1
                else:
                    domain_not_assessed += 1
                    total_not_assessed += 1

                domain_controls.append({
                    "id": ctrl_def["id"],
                    "name": ctrl_def["name"],
                    "requirement": ctrl_def["requirement"],
                    "status": result["status"] if result else "not_assessed",
                    "findings": result.get("findings", "") if result else "",
                    "remediation": result.get("remediation", "") if result else "",
                })

            domain_total = len(domain_def["controls"])
            domain_rate = ((domain_compliant + domain_partial * 0.5) / domain_total * 100) if domain_total > 0 else 0

            domains.append({
                "key": domain_def["key"],
                "name": domain_def["name"],
                "total_controls": domain_total,
                "compliant": domain_compliant,
                "partially_compliant": domain_partial,
                "non_compliant": domain_non_compliant,
                "not_assessed": domain_not_assessed,
                "compliance_rate": round(domain_rate, 1),
                "controls": domain_controls,
            })

        overall_rate = ((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0

        has_real_data = fw is not None and assessment is not None and len(db_results) > 0

        return {
            "has_real_data": has_real_data,
            "framework_info": {
                "name": fw.name if fw else "General Data Protection Regulation",
                "code": fw.code if fw else "gdpr",
                "version": fw.version if fw else "2016/679",
                "standard_ref": "Regulation (EU) 2016/679",
            },
            "assessment_info": {
                "name": assessment.name if assessment else "GDPR Compliance Assessment",
                "status": assessment.status if assessment else "completed",
                "assessor": assessment.assessor if assessment else "-",
                "overall_score": assessment.overall_score if assessment and assessment.overall_score else round(overall_rate, 1),
                "completed_at": assessment.completed_at.isoformat() if assessment and assessment.completed_at else None,
            },
            "overview": {
                "total_controls": total_controls,
                "compliant": total_compliant,
                "partially_compliant": total_partial,
                "non_compliant": total_non_compliant,
                "not_assessed": total_not_assessed,
                "compliance_rate": round(overall_rate, 1),
            },
            "domains": domains,
            "breach_events": breach_events,
        }

    async def _collect_iso27001_data(self, db: Session) -> dict:
        fw_data = self._get_framework_data(db, "iso27001")
        fw = fw_data["framework"]
        assessment = fw_data["assessment"]
        db_controls = fw_data["controls"]
        db_results = fw_data["results"]

        result_map = {}
        if assessment:
            for r in db_results:
                ctrl = db.query(ComplianceControl).filter(ComplianceControl.id == r.control_id).first()
                if ctrl:
                    result_map[ctrl.control_id] = {
                        "status": r.status,
                        "findings": r.findings,
                        "remediation": r.remediation,
                    }

        domains = []
        total_compliant = 0
        total_partial = 0
        total_non_compliant = 0
        total_not_assessed = 0
        total_controls = 0
        improvement_opportunities = []

        for domain_def in self.ISO27001_CONTROL_DOMAINS:
            domain_controls = []
            domain_compliant = 0
            domain_partial = 0
            domain_non_compliant = 0
            domain_not_assessed = 0

            for ctrl_def in domain_def["controls"]:
                total_controls += 1
                result = result_map.get(ctrl_def["id"])
                if result:
                    status = result["status"]
                    if status == "compliant":
                        domain_compliant += 1
                        total_compliant += 1
                    elif status == "partially_compliant":
                        domain_partial += 1
                        total_partial += 1
                        improvement_opportunities.append({
                            "control_id": ctrl_def["id"],
                            "control_name": ctrl_def["name"],
                            "current_status": "部分合规",
                            "suggestion": result.get("remediation", "") or f"建议完善「{ctrl_def['name']}」控制措施，使其完全满足ISO 27001要求",
                        })
                    elif status == "non_compliant":
                        domain_non_compliant += 1
                        total_non_compliant += 1
                        improvement_opportunities.append({
                            "control_id": ctrl_def["id"],
                            "control_name": ctrl_def["name"],
                            "current_status": "不合规",
                            "suggestion": result.get("remediation", "") or f"需立即实施「{ctrl_def['name']}」控制措施以满足ISO 27001要求",
                        })
                    else:
                        domain_not_assessed += 1
                        total_not_assessed += 1
                else:
                    domain_not_assessed += 1
                    total_not_assessed += 1

                domain_controls.append({
                    "id": ctrl_def["id"],
                    "name": ctrl_def["name"],
                    "requirement": ctrl_def["requirement"],
                    "status": result["status"] if result else "not_assessed",
                    "findings": result.get("findings", "") if result else "",
                    "remediation": result.get("remediation", "") if result else "",
                })

            domain_total = len(domain_def["controls"])
            domain_rate = ((domain_compliant + domain_partial * 0.5) / domain_total * 100) if domain_total > 0 else 0

            domains.append({
                "key": domain_def["key"],
                "name": domain_def["name"],
                "annex_ref": domain_def["annex_ref"],
                "total_controls": domain_total,
                "compliant": domain_compliant,
                "partially_compliant": domain_partial,
                "non_compliant": domain_non_compliant,
                "not_assessed": domain_not_assessed,
                "compliance_rate": round(domain_rate, 1),
                "controls": domain_controls,
            })

        overall_rate = ((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0

        risk_items = []
        for domain in domains:
            for ctrl in domain.get("controls", []):
                if ctrl["status"] in ("non_compliant", "partially_compliant"):
                    risk_items.append({
                        "control_id": ctrl["id"],
                        "control_name": ctrl["name"],
                        "risk_level": "高" if ctrl["status"] == "non_compliant" else "中",
                        "description": ctrl.get("findings", "") or f"控制措施「{ctrl['name']}」未满足要求",
                    })

        has_real_data = fw is not None and assessment is not None and len(db_results) > 0

        soa_entries = []
        for domain in domains:
            for ctrl in domain.get("controls", []):
                soa_entries.append({
                    "control_id": ctrl["id"],
                    "control_name": ctrl["name"],
                    "applicability": "适用" if ctrl["status"] != "not_assessed" else "待评估",
                    "justification": "" if ctrl["status"] != "not_assessed" else "尚未进行评估",
                    "implementation_status": {
                        "compliant": "已实施",
                        "partially_compliant": "部分实施",
                        "non_compliant": "未实施",
                        "not_assessed": "未评估",
                    }.get(ctrl["status"], "未评估"),
                })

        return {
            "has_real_data": has_real_data,
            "framework_info": {
                "name": fw.name if fw else "ISO/IEC 27001 信息安全管理体系",
                "code": fw.code if fw else "iso27001",
                "version": fw.version if fw else "2022",
                "standard_ref": "ISO/IEC 27001:2022",
            },
            "assessment_info": {
                "name": assessment.name if assessment else "ISO 27001合规评估",
                "status": assessment.status if assessment else "completed",
                "assessor": assessment.assessor if assessment else "-",
                "overall_score": assessment.overall_score if assessment and assessment.overall_score else round(overall_rate, 1),
                "completed_at": assessment.completed_at.isoformat() if assessment and assessment.completed_at else None,
            },
            "overview": {
                "total_controls": total_controls,
                "compliant": total_compliant,
                "partially_compliant": total_partial,
                "non_compliant": total_non_compliant,
                "not_assessed": total_not_assessed,
                "compliance_rate": round(overall_rate, 1),
            },
            "domains": domains,
            "risk_assessment": risk_items,
            "soa": soa_entries,
            "improvement_opportunities": improvement_opportunities,
        }

    async def _collect_cis_data(self, db: Session) -> dict:
        fw_data = self._get_framework_data(db, "cis")
        fw = fw_data["framework"]
        assessment = fw_data["assessment"]
        db_controls = fw_data["controls"]
        db_results = fw_data["results"]

        result_map = {}
        if assessment:
            for r in db_results:
                ctrl = db.query(ComplianceControl).filter(ComplianceControl.id == r.control_id).first()
                if ctrl:
                    result_map[ctrl.control_id] = {
                        "status": r.status,
                        "findings": r.findings,
                        "remediation": r.remediation,
                    }

        ig_domains = []
        total_compliant = 0
        total_partial = 0
        total_non_compliant = 0
        total_not_assessed = 0
        total_controls = 0

        for ig_def in self.CIS_CONTROL_DOMAINS:
            ig_controls = []
            ig_compliant = 0
            ig_partial = 0
            ig_non_compliant = 0
            ig_not_assessed = 0

            for ctrl_def in ig_def["controls"]:
                total_controls += 1
                result = result_map.get(ctrl_def["id"])
                if result:
                    status = result["status"]
                    if status == "compliant":
                        ig_compliant += 1
                        total_compliant += 1
                    elif status == "partially_compliant":
                        ig_partial += 1
                        total_partial += 1
                    elif status == "non_compliant":
                        ig_non_compliant += 1
                        total_non_compliant += 1
                    else:
                        ig_not_assessed += 1
                        total_not_assessed += 1
                else:
                    ig_not_assessed += 1
                    total_not_assessed += 1

                ig_controls.append({
                    "id": ctrl_def["id"],
                    "name": ctrl_def["name"],
                    "requirement": ctrl_def["requirement"],
                    "status": result["status"] if result else "not_assessed",
                    "findings": result.get("findings", "") if result else "",
                    "remediation": result.get("remediation", "") if result else "",
                })

            ig_total = len(ig_def["controls"])
            ig_rate = ((ig_compliant + ig_partial * 0.5) / ig_total * 100) if ig_total > 0 else 0

            maturity_level = "基础级"
            if ig_rate >= 80:
                maturity_level = "高级"
            elif ig_rate >= 50:
                maturity_level = "中级"

            ig_domains.append({
                "key": ig_def["key"],
                "name": ig_def["name"],
                "ig_level": ig_def["ig_level"],
                "total_controls": ig_total,
                "compliant": ig_compliant,
                "partially_compliant": ig_partial,
                "non_compliant": ig_non_compliant,
                "not_assessed": ig_not_assessed,
                "compliance_rate": round(ig_rate, 1),
                "maturity_level": maturity_level,
                "controls": ig_controls,
            })

        overall_rate = ((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0

        if overall_rate >= 90:
            overall_maturity = "成熟级 (Mature)"
        elif overall_rate >= 70:
            overall_maturity = "优化级 (Optimizing)"
        elif overall_rate >= 50:
            overall_maturity = "定义级 (Defined)"
        elif overall_rate >= 30:
            overall_maturity = "初始级 (Initial)"
        else:
            overall_maturity = "未评级 (Unrated)"

        has_real_data = fw is not None and assessment is not None and len(db_results) > 0

        return {
            "has_real_data": has_real_data,
            "framework_info": {
                "name": fw.name if fw else "CIS Critical Security Controls",
                "code": fw.code if fw else "cis",
                "version": fw.version if fw else "v8",
                "standard_ref": "CIS Controls v8",
            },
            "assessment_info": {
                "name": assessment.name if assessment else "CIS Controls v8 Assessment",
                "status": assessment.status if assessment else "completed",
                "assessor": assessment.assessor if assessment else "-",
                "overall_score": assessment.overall_score if assessment and assessment.overall_score else round(overall_rate, 1),
                "completed_at": assessment.completed_at.isoformat() if assessment and assessment.completed_at else None,
            },
            "overview": {
                "total_controls": total_controls,
                "compliant": total_compliant,
                "partially_compliant": total_partial,
                "non_compliant": total_non_compliant,
                "not_assessed": total_not_assessed,
                "compliance_rate": round(overall_rate, 1),
                "maturity_level": overall_maturity,
            },
            "ig_domains": ig_domains,
        }

    def _render_html(self, template_id: str, title: str, data: dict, generated_at: datetime) -> str:
        renderers = {
            "security_overview": self._render_security_overview,
            "threat_analysis": self._render_threat_analysis,
            "incident_response": self._render_incident_response,
            "compliance_status": self._render_compliance_status,
            "vulnerability_summary": self._render_vulnerability_summary,
            "executive_summary": self._render_executive_summary,
            "mlps_compliance": self._render_mlps_compliance,
            "gdpr_compliance": self._render_gdpr_compliance,
            "iso27001_compliance": self._render_iso27001_compliance,
            "cis_compliance": self._render_cis_compliance,
        }
        renderer = renderers.get(template_id)
        body = renderer(data) if renderer else "<p>未知模板</p>"
        return self._wrap_html(title, body, generated_at)

    def _wrap_html(self, title: str, body: str, generated_at: datetime) -> str:
        return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  @page {{ size: A4; margin: 20mm; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; font-size: 14px; }}
  .report-header {{ background: linear-gradient(135deg, #0f3460, #16213e); color: #fff; padding: 32px 40px; margin: -20mm -20mm 24px -20mm; }}
  .report-header h1 {{ font-size: 26px; font-weight: 700; margin-bottom: 8px; }}
  .report-header .meta {{ font-size: 13px; opacity: 0.85; }}
  .section {{ margin-bottom: 28px; }}
  .section-title {{ font-size: 18px; font-weight: 700; color: #0f3460; border-left: 4px solid #e94560; padding-left: 12px; margin-bottom: 16px; }}
  .metric-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }}
  .metric-card {{ background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e9ecef; }}
  .metric-card .value {{ font-size: 28px; font-weight: 700; color: #0f3460; }}
  .metric-card .label {{ font-size: 12px; color: #6c757d; margin-top: 4px; }}
  .metric-card.danger .value {{ color: #e94560; }}
  .metric-card.warning .value {{ color: #f5a623; }}
  .metric-card.success .value {{ color: #28a745; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }}
  th {{ background: #0f3460; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }}
  td {{ padding: 9px 12px; border-bottom: 1px solid #dee2e6; }}
  tr:nth-child(even) {{ background: #f8f9fa; }}
  .badge {{ display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }}
  .badge-critical {{ background: #ffe0e6; color: #e94560; }}
  .badge-high {{ background: #fff3e0; color: #f57c00; }}
  .badge-medium {{ background: #fff8e1; color: #f5a623; }}
  .badge-low {{ background: #e8f5e9; color: #28a745; }}
  .badge-pending {{ background: #fff3e0; color: #f57c00; }}
  .badge-processing {{ background: #e3f2fd; color: #1976d2; }}
  .badge-resolved {{ background: #e8f5e9; color: #28a745; }}
  .bar-chart {{ margin: 12px 0; }}
  .bar-row {{ display: flex; align-items: center; margin-bottom: 8px; }}
  .bar-label {{ width: 100px; font-size: 13px; color: #495057; text-align: right; padding-right: 12px; }}
  .bar-track {{ flex: 1; background: #e9ecef; border-radius: 4px; height: 22px; overflow: hidden; }}
  .bar-fill {{ height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 8px; font-size: 11px; color: #fff; font-weight: 600; min-width: 30px; }}
  .bar-fill.critical {{ background: #e94560; }}
  .bar-fill.high {{ background: #f57c00; }}
  .bar-fill.medium {{ background: #f5a623; }}
  .bar-fill.low {{ background: #28a745; }}
  .bar-fill.blue {{ background: #1976d2; }}
  .score-circle {{ width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; margin: 0 auto 8px; }}
  .score-high {{ background: #e8f5e9; color: #28a745; border: 3px solid #28a745; }}
  .score-medium {{ background: #fff8e1; color: #f5a623; border: 3px solid #f5a623; }}
  .score-low {{ background: #ffe0e6; color: #e94560; border: 3px solid #e94560; }}
  .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
  .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; text-align: center; }}
</style>
</head>
<body>
<div class="report-header">
  <h1>{title}</h1>
  <div class="meta">生成时间：{generated_at.strftime('%Y-%m-%d %H:%M:%S')} | SecMind AI安全运营平台</div>
</div>
{body}
<div class="footer">本报表由 SecMind AI安全运营平台自动生成 | {generated_at.strftime('%Y-%m-%d %H:%M:%S')}</div>
</body>
</html>"""

    def _risk_badge(self, level: str) -> str:
        cls_map = {"严重": "critical", "高": "high", "中": "medium", "低": "low"}
        cls = cls_map.get(level, "low")
        return f'<span class="badge badge-{cls}">{level}</span>'

    def _status_badge(self, status: str) -> str:
        cls_map = {"待处理": "pending", "处理中": "processing", "已解决": "resolved", "completed": "resolved", "pending": "pending", "executing": "processing", "failed": "critical"}
        cls = cls_map.get(status, "low")
        return f'<span class="badge badge-{cls}">{status}</span>'

    def _bar(self, label: str, value: int, max_val: int, color_cls: str = "blue") -> str:
        pct = (value / max_val * 100) if max_val > 0 else 0
        return f'<div class="bar-row"><div class="bar-label">{label}</div><div class="bar-track"><div class="bar-fill {color_cls}" style="width:{pct:.1f}%">{value}</div></div></div>'

    def _render_security_overview(self, data: dict) -> str:
        alert_stats = data.get("alert_stats", {})
        device_stats = data.get("device_stats", {})
        by_risk = alert_stats.get("by_risk_level", {})
        by_status = alert_stats.get("by_status", {})
        by_type = alert_stats.get("by_type", {})
        recent = data.get("recent_alerts", [])

        max_risk = max(by_risk.values()) if by_risk else 1
        max_type = max(by_type.values()) if by_type else 1

        parts = []
        parts.append(f"""
<div class="section">
  <div class="section-title">关键指标</div>
  <div class="metric-grid">
    <div class="metric-card danger"><div class="value">{alert_stats.get('total', 0)}</div><div class="label">告警总数</div></div>
    <div class="metric-card danger"><div class="value">{by_risk.get('严重', 0)}</div><div class="label">严重告警</div></div>
    <div class="metric-card warning"><div class="value">{by_status.get('待处理', 0)}</div><div class="label">待处理</div></div>
    <div class="metric-card success"><div class="value">{device_stats.get('online', 0)}/{device_stats.get('total', 0)}</div><div class="label">在线设备</div></div>
  </div>
</div>""")

        parts.append(f"""
<div class="section">
  <div class="section-title">风险等级分布</div>
  <div class="bar-chart">
    {self._bar('严重', by_risk.get('严重', 0), max_risk, 'critical')}
    {self._bar('高', by_risk.get('高', 0), max_risk, 'high')}
    {self._bar('中', by_risk.get('中', 0), max_risk, 'medium')}
    {self._bar('低', by_risk.get('低', 0), max_risk, 'low')}
  </div>
</div>""")

        if by_type:
            type_bars = "".join(self._bar(k, v, max_type, "blue") for k, v in by_type.items())
            parts.append(f"""
<div class="section">
  <div class="section-title">告警类型分布</div>
  <div class="bar-chart">{type_bars}</div>
</div>""")

        if recent:
            rows = "".join(
                f'<tr><td>{a["id"]}</td><td>{a.get("title", "")}</td><td>{self._risk_badge(a.get("risk_level", ""))}</td><td>{self._status_badge(a.get("status", ""))}</td><td>{a.get("type", "")}</td><td>{a.get("timestamp", "-")}</td></tr>'
                for a in recent
            )
            parts.append(f"""
<div class="section">
  <div class="section-title">最近告警</div>
  <table><tr><th>ID</th><th>标题</th><th>风险</th><th>状态</th><th>类型</th><th>时间</th></tr>{rows}</table>
</div>""")

        return "".join(parts)

    def _render_threat_analysis(self, data: dict) -> str:
        type_dist = data.get("alert_type_distribution", {})
        source_dist = data.get("alert_source_distribution", {})
        hyp_stats = data.get("hypothesis_stats", {})
        hypotheses = data.get("hypotheses", [])
        critical = data.get("critical_alerts", [])

        max_type = max(type_dist.values()) if type_dist else 1
        max_source = max(source_dist.values()) if source_dist else 1

        parts = []
        parts.append(f"""
<div class="section">
  <div class="section-title">威胁概览</div>
  <div class="metric-grid">
    <div class="metric-card"><div class="value">{hyp_stats.get("total", 0)}</div><div class="label">狩猎假设</div></div>
    <div class="metric-card danger"><div class="value">{len(critical)}</div><div class="label">严重/高告警</div></div>
    <div class="metric-card"><div class="value">{len(type_dist)}</div><div class="label">威胁类型</div></div>
    <div class="metric-card"><div class="value">{len(source_dist)}</div><div class="label">告警来源</div></div>
  </div>
</div>""")

        if type_dist:
            type_bars = "".join(self._bar(k, v, max_type, "blue") for k, v in type_dist.items())
            parts.append(f"""
<div class="section">
  <div class="section-title">告警类型分布</div>
  <div class="bar-chart">{type_bars}</div>
</div>""")

        if source_dist:
            src_bars = "".join(self._bar(k, v, max_source, "medium") for k, v in source_dist.items())
            parts.append(f"""
<div class="section">
  <div class="section-title">告警来源分布</div>
  <div class="bar-chart">{src_bars}</div>
</div>""")

        if hypotheses:
            rows = "".join(
                f'<tr><td>{h["id"]}</td><td>{h.get("name", "")}</td><td>{h.get("tactic", "")}</td><td>{h.get("technique", "")}</td><td>{self._status_badge(h.get("status", ""))}</td><td>{h.get("confidence", 0)}%</td><td>{h.get("ioc_count", 0)}</td></tr>'
                for h in hypotheses[:15]
            )
            parts.append(f"""
<div class="section">
  <div class="section-title">狩猎假设</div>
  <table><tr><th>ID</th><th>名称</th><th>战术</th><th>技术</th><th>状态</th><th>置信度</th><th>IOC数</th></tr>{rows}</table>
</div>""")

        if critical:
            rows = "".join(
                f'<tr><td>{a["id"]}</td><td>{a.get("title", "")}</td><td>{self._risk_badge(a.get("risk_level", ""))}</td><td>{a.get("source", "")}</td><td>{a.get("source_ip", "-")}</td><td>{a.get("destination_ip", "-")}</td></tr>'
                for a in critical[:15]
            )
            parts.append(f"""
<div class="section">
  <div class="section-title">严重/高危告警详情</div>
  <table><tr><th>ID</th><th>标题</th><th>风险</th><th>来源</th><th>源IP</th><th>目标IP</th></tr>{rows}</table>
</div>""")

        return "".join(parts)

    def _render_incident_response(self, data: dict) -> str:
        resp = data.get("response_stats", {})
        ticket = data.get("ticket_stats", {})
        actions = data.get("recent_actions", [])
        tickets = data.get("recent_tickets", [])
        by_type = resp.get("by_type", {})
        by_priority = ticket.get("by_priority", {})

        max_type = max(by_type.values()) if by_type else 1
        max_pri = max(by_priority.values()) if by_priority else 1

        parts = []
        parts.append(f"""
<div class="section">
  <div class="section-title">响应概览</div>
  <div class="metric-grid">
    <div class="metric-card"><div class="value">{resp.get("total_actions", 0)}</div><div class="label">响应动作总数</div></div>
    <div class="metric-card success"><div class="value">{resp.get("success_rate", 0)}%</div><div class="label">执行成功率</div></div>
    <div class="metric-card"><div class="value">{ticket.get("total", 0)}</div><div class="label">工单总数</div></div>
    <div class="metric-card warning"><div class="value">{ticket.get("pending", 0)}</div><div class="label">待处理工单</div></div>
  </div>
</div>""")

        parts.append(f"""
<div class="section">
  <div class="section-title">响应动作统计</div>
  <div class="two-col">
    <div class="bar-chart">
      <div style="font-weight:600;margin-bottom:8px">按类型</div>
      {"".join(self._bar(k, v, max_type, "blue") for k, v in by_type.items()) if by_type else "<p>暂无数据</p>"}
    </div>
    <div class="bar-chart">
      <div style="font-weight:600;margin-bottom:8px">工单按优先级</div>
      {"".join(self._bar(k, v, max_pri, "medium") for k, v in by_priority.items()) if by_priority else "<p>暂无数据</p>"}
    </div>
  </div>
</div>""")

        if actions:
            rows = "".join(
                f'<tr><td>{a["id"]}</td><td>{a.get("name", "")}</td><td>{a.get("action_type", "")}</td><td>{self._status_badge(a.get("status", ""))}</td><td>{a.get("priority", "")}</td><td>{a.get("requested_by", "")}</td></tr>'
                for a in actions[:15]
            )
            parts.append(f"""
<div class="section">
  <div class="section-title">最近响应动作</div>
  <table><tr><th>ID</th><th>名称</th><th>类型</th><th>状态</th><th>优先级</th><th>请求者</th></tr>{rows}</table>
</div>""")

        if tickets:
            rows = "".join(
                f'<tr><td>{t["id"]}</td><td>{t.get("title", "")}</td><td>{self._status_badge(t.get("status", ""))}</td><td>{t.get("priority", "")}</td><td>{t.get("assignee", "-")}</td></tr>'
                for t in tickets[:15]
            )
            parts.append(f"""
<div class="section">
  <div class="section-title">最近工单</div>
  <table><tr><th>ID</th><th>标题</th><th>状态</th><th>优先级</th><th>负责人</th></tr>{rows}</table>
</div>""")

        return "".join(parts)

    def _render_compliance_status(self, data: dict) -> str:
        frameworks = data.get("frameworks", [])

        parts = []
        parts.append(f"""
<div class="section">
  <div class="section-title">合规概览</div>
  <div class="metric-grid">
    <div class="metric-card"><div class="value">{data.get("total_frameworks", 0)}</div><div class="label">合规框架</div></div>
  </div>
</div>""")

        for fw in frameworks:
            score = fw.get("overall_score")
            if score is not None:
                score_cls = "score-high" if score >= 80 else ("score-medium" if score >= 50 else "score-low")
                score_display = f"{score:.0f}"
            else:
                score_cls = "score-low"
                score_display = "N/A"

            cs = fw.get("control_summary", {})
            total_controls = sum(cs.values())

            parts.append(f"""
<div class="section">
  <div class="section-title">{fw.get("name", "")} ({fw.get("code", "")} v{fw.get("version", "")})</div>
  <div class="two-col">
    <div style="text-align:center">
      <div class="score-circle {score_cls}">{score_display}</div>
      <div style="font-size:13px;color:#6c757d">合规得分</div>
      <div style="margin-top:8px;font-size:13px">评估状态：{self._status_badge(fw.get("assessment_status", ""))}</div>
    </div>
    <div class="bar-chart">
      {self._bar("合规", cs.get("compliant", 0), total_controls or 1, "low")}
      {self._bar("部分合规", cs.get("partially_compliant", 0), total_controls or 1, "medium")}
      {self._bar("不合规", cs.get("non_compliant", 0), total_controls or 1, "critical")}
      {self._bar("未评估", cs.get("not_assessed", 0), total_controls or 1, "high")}
    </div>
  </div>
</div>""")

        return "".join(parts)

    def _render_vulnerability_summary(self, data: dict) -> str:
        overview = data.get("overview", {})
        by_risk = data.get("by_risk_level", {})
        by_status = data.get("by_status", {})
        by_type = data.get("by_type", {})
        by_source = data.get("by_source", {})
        unresolved = data.get("unresolved_critical", [])

        max_risk = max(by_risk.values()) if by_risk else 1
        max_type = max(by_type.values()) if by_type else 1

        parts = []
        parts.append(f"""
<div class="section">
  <div class="section-title">漏洞概览</div>
  <div class="metric-grid">
    <div class="metric-card"><div class="value">{overview.get("total", 0)}</div><div class="label">告警总数</div></div>
    <div class="metric-card danger"><div class="value">{by_risk.get("严重", 0)}</div><div class="label">严重</div></div>
    <div class="metric-card warning"><div class="value">{by_risk.get("高", 0)}</div><div class="label">高危</div></div>
    <div class="metric-card success"><div class="value">{overview.get("resolution_rate", 0)}%</div><div class="label">解决率</div></div>
  </div>
</div>""")

        parts.append(f"""
<div class="section">
  <div class="section-title">风险等级分布</div>
  <div class="bar-chart">
    {self._bar("严重", by_risk.get("严重", 0), max_risk, "critical")}
    {self._bar("高", by_risk.get("高", 0), max_risk, "high")}
    {self._bar("中", by_risk.get("中", 0), max_risk, "medium")}
    {self._bar("低", by_risk.get("低", 0), max_risk, "low")}
  </div>
</div>""")

        if by_type:
            type_bars = "".join(self._bar(k, v, max_type, "blue") for k, v in by_type.items())
            parts.append(f"""
<div class="section">
  <div class="section-title">类型分布</div>
  <div class="bar-chart">{type_bars}</div>
</div>""")

        if unresolved:
            rows = "".join(
                f'<tr><td>{a["id"]}</td><td>{a.get("title", "")}</td><td>{self._risk_badge(a.get("risk_level", ""))}</td><td>{self._status_badge(a.get("status", ""))}</td><td>{a.get("type", "")}</td><td>{a.get("source_ip", "-")}</td></tr>'
                for a in unresolved[:20]
            )
            parts.append(f"""
<div class="section">
  <div class="section-title">未解决严重/高危告警</div>
  <table><tr><th>ID</th><th>标题</th><th>风险</th><th>状态</th><th>类型</th><th>源IP</th></tr>{rows}</table>
</div>""")

        return "".join(parts)

    def _render_executive_summary(self, data: dict) -> str:
        metrics = data.get("key_metrics", {})
        risk = data.get("risk_assessment", {})

        risk_level = risk.get("level", "低")
        risk_cls = "danger" if risk_level == "高" else ("warning" if risk_level == "中" else "success")

        parts = []
        parts.append(f"""
<div class="section">
  <div class="section-title">核心指标</div>
  <div class="metric-grid">
    <div class="metric-card {risk_cls}"><div class="value">{metrics.get("total_alerts", 0)}</div><div class="label">告警总数</div></div>
    <div class="metric-card danger"><div class="value">{metrics.get("critical_alerts", 0)}</div><div class="label">严重告警</div></div>
    <div class="metric-card success"><div class="value">{metrics.get("response_success_rate", 0)}%</div><div class="label">响应成功率</div></div>
    <div class="metric-card"><div class="value">{metrics.get("compliance_score", "N/A")}</div><div class="label">合规得分</div></div>
  </div>
  <div class="metric-grid">
    <div class="metric-card"><div class="value">{metrics.get("online_devices", 0)}/{metrics.get("total_devices", 0)}</div><div class="label">在线设备</div></div>
    <div class="metric-card warning"><div class="value">{metrics.get("pending_alerts", 0)}</div><div class="label">待处理告警</div></div>
    <div class="metric-card"><div class="value">{metrics.get("pending_tickets", 0)}</div><div class="label">待处理工单</div></div>
    <div class="metric-card"><div class="value">{metrics.get("active_strategies", 0)}</div><div class="label">活跃策略</div></div>
  </div>
</div>""")

        risk_badge = self._risk_badge(risk_level)
        parts.append(f"""
<div class="section">
  <div class="section-title">风险评估</div>
  <div class="two-col">
    <div>
      <p style="font-size:16px;margin-bottom:12px">当前风险等级：{risk_badge}</p>
      <p>严重告警：<strong>{risk.get("critical_count", 0)}</strong> 个</p>
      <p>高危告警：<strong>{risk.get("high_count", 0)}</strong> 个</p>
      <p>待处理告警：<strong>{risk.get("pending_count", 0)}</strong> 个</p>
    </div>
    <div>
      <p style="font-size:16px;margin-bottom:12px;font-weight:600">改进建议</p>
      <ul style="padding-left:20px;font-size:13px;line-height:2">
        <li>优先处理严重和高危告警，降低整体风险</li>
        <li>加强设备监控覆盖率，确保关键资产在线</li>
        <li>定期执行合规评估，保持合规得分</li>
        <li>优化响应策略，提升自动化处置比例</li>
      </ul>
    </div>
  </div>
</div>""")

        return "".join(parts)

    def _compliance_status_badge(self, status: str, lang: str = "zh") -> str:
        if lang == "en":
            cls_map = {"compliant": "low", "partially_compliant": "medium", "non_compliant": "critical", "not_assessed": "high"}
            label_map = {"compliant": "Compliant", "partially_compliant": "Partial", "non_compliant": "Non-Compliant", "not_assessed": "Not Assessed"}
        else:
            cls_map = {"compliant": "low", "partially_compliant": "medium", "non_compliant": "critical", "not_assessed": "high"}
            label_map = {"compliant": "合规", "partially_compliant": "部分合规", "non_compliant": "不合规", "not_assessed": "未评估"}
        cls = cls_map.get(status, "high")
        label = label_map.get(status, status)
        return f'<span class="badge badge-{cls}">{label}</span>'

    def _render_mlps_compliance(self, data: dict) -> str:
        overview = data.get("overview", {})
        fw_info = data.get("framework_info", {})
        assessment_info = data.get("assessment_info", {})
        domains = data.get("domains", [])
        non_compliant = data.get("non_compliant_items", [])
        remediations = data.get("remediation_suggestions", [])

        rate = overview.get("compliance_rate", 0)
        grade = overview.get("grade", "-")
        score_cls = "score-high" if rate >= 80 else ("score-medium" if rate >= 50 else "score-low")

        parts = []

        parts.append(f"""
<div class="section">
  <div class="section-title">合规总览</div>
  <div class="metric-grid">
    <div style="text-align:center">
      <div class="score-circle {score_cls}">{rate:.0f}%</div>
      <div style="font-size:13px;color:#6c757d">总体合规率</div>
    </div>
    <div class="metric-card success"><div class="value">{overview.get("compliant", 0)}</div><div class="label">合规项</div></div>
    <div class="metric-card warning"><div class="value">{overview.get("partially_compliant", 0)}</div><div class="label">部分合规</div></div>
    <div class="metric-card danger"><div class="value">{overview.get("non_compliant", 0)}</div><div class="label">不合规项</div></div>
  </div>
  <div style="text-align:center;margin-top:8px;font-size:15px">
    合规等级：<strong style="font-size:18px;color:{'#28a745' if rate >= 75 else '#f5a623' if rate >= 50 else '#e94560'}">{grade}</strong>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    标准依据：{fw_info.get("standard_ref", "")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    评估人：{assessment_info.get("assessor", "-")}
  </div>
</div>""")

        if domains:
            domain_rows = ""
            for d in domains:
                d_rate = d.get("compliance_rate", 0)
                rate_cls = "low" if d_rate >= 80 else ("medium" if d_rate >= 50 else "critical")
                domain_rows += f"""<tr>
  <td>{d.get("name", "")}</td>
  <td style="font-size:12px;color:#6c757d">{d.get("standard_ref", "")}</td>
  <td style="text-align:center">{d.get("total_controls", 0)}</td>
  <td style="text-align:center;color:#28a745">{d.get("compliant", 0)}</td>
  <td style="text-align:center;color:#f5a623">{d.get("partially_compliant", 0)}</td>
  <td style="text-align:center;color:#e94560">{d.get("non_compliant", 0)}</td>
  <td style="text-align:center;color:#6c757d">{d.get("not_assessed", 0)}</td>
  <td style="text-align:center"><span class="badge badge-{rate_cls}">{d_rate:.1f}%</span></td>
</tr>"""

            parts.append(f"""
<div class="section">
  <div class="section-title">各控制域合规状态</div>
  <table>
    <tr><th>控制域</th><th>标准条款</th><th>控制点数</th><th>合规</th><th>部分合规</th><th>不合规</th><th>未评估</th><th>合规率</th></tr>
    {domain_rows}
  </table>
</div>""")

        for d in domains:
            controls = d.get("controls", [])
            if not controls:
                continue
            ctrl_rows = ""
            for c in controls:
                ctrl_rows += f"""<tr>
  <td>{c.get("id", "")}</td>
  <td>{c.get("name", "")}</td>
  <td style="font-size:12px">{c.get("requirement", "")}</td>
  <td>{self._compliance_status_badge(c.get("status", "not_assessed"))}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">{d.get("name", "")} 控制点详情</div>
  <table>
    <tr><th>编号</th><th>控制点</th><th>合规要求</th><th>状态</th></tr>
    {ctrl_rows}
  </table>
</div>""")

        if non_compliant:
            nc_rows = ""
            for item in non_compliant:
                nc_rows += f"""<tr>
  <td>{item.get("domain", "")}</td>
  <td>{item.get("control_id", "")}</td>
  <td>{item.get("control_name", "")}</td>
  <td style="font-size:12px">{item.get("requirement", "")}</td>
  <td style="font-size:12px">{item.get("findings", "-")}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">不合规项清单</div>
  <table>
    <tr><th>控制域</th><th>编号</th><th>控制点</th><th>合规要求</th><th>发现</th></tr>
    {nc_rows}
  </table>
</div>""")

        if remediations:
            rem_rows = ""
            for r in remediations:
                pri_cls = "critical" if r.get("priority") == "高" else ("medium" if r.get("priority") == "中" else "low")
                rem_rows += f"""<tr>
  <td><span class="badge badge-{pri_cls}">{r.get("priority", "")}</span></td>
  <td>{r.get("domain", "")}</td>
  <td>{r.get("control", "")}</td>
  <td style="font-size:12px">{r.get("suggestion", "")}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">整改建议</div>
  <table>
    <tr><th>优先级</th><th>控制域</th><th>控制点</th><th>建议</th></tr>
    {rem_rows}
  </table>
</div>""")

        return "".join(parts)

    def _render_gdpr_compliance(self, data: dict) -> str:
        overview = data.get("overview", {})
        fw_info = data.get("framework_info", {})
        assessment_info = data.get("assessment_info", {})
        domains = data.get("domains", [])
        breach_events = data.get("breach_events", [])

        rate = overview.get("compliance_rate", 0)
        score_cls = "score-high" if rate >= 80 else ("score-medium" if rate >= 50 else "score-low")

        parts = []

        parts.append(f"""
<div class="section">
  <div class="section-title">Compliance Overview</div>
  <div class="metric-grid">
    <div style="text-align:center">
      <div class="score-circle {score_cls}">{rate:.0f}%</div>
      <div style="font-size:13px;color:#6c757d">Overall Compliance Rate</div>
    </div>
    <div class="metric-card success"><div class="value">{overview.get("compliant", 0)}</div><div class="label">Compliant</div></div>
    <div class="metric-card warning"><div class="value">{overview.get("partially_compliant", 0)}</div><div class="label">Partially Compliant</div></div>
    <div class="metric-card danger"><div class="value">{overview.get("non_compliant", 0)}</div><div class="label">Non-Compliant</div></div>
  </div>
  <div style="text-align:center;margin-top:8px;font-size:14px">
    Regulation: {fw_info.get("standard_ref", "")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Assessor: {assessment_info.get("assessor", "-")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Total Controls: {overview.get("total_controls", 0)}
  </div>
</div>""")

        if domains:
            domain_rows = ""
            for d in domains:
                d_rate = d.get("compliance_rate", 0)
                rate_cls = "low" if d_rate >= 80 else ("medium" if d_rate >= 50 else "critical")
                domain_rows += f"""<tr>
  <td>{d.get("name", "")}</td>
  <td style="text-align:center">{d.get("total_controls", 0)}</td>
  <td style="text-align:center;color:#28a745">{d.get("compliant", 0)}</td>
  <td style="text-align:center;color:#f5a623">{d.get("partially_compliant", 0)}</td>
  <td style="text-align:center;color:#e94560">{d.get("non_compliant", 0)}</td>
  <td style="text-align:center;color:#6c757d">{d.get("not_assessed", 0)}</td>
  <td style="text-align:center"><span class="badge badge-{rate_cls}">{d_rate:.1f}%</span></td>
</tr>"""

            parts.append(f"""
<div class="section">
  <div class="section-title">Compliance Status by Domain</div>
  <table>
    <tr><th>Domain</th><th>Controls</th><th>Compliant</th><th>Partial</th><th>Non-Compliant</th><th>Not Assessed</th><th>Rate</th></tr>
    {domain_rows}
  </table>
</div>""")

        for d in domains:
            controls = d.get("controls", [])
            if not controls:
                continue
            ctrl_rows = ""
            for c in controls:
                ctrl_rows += f"""<tr>
  <td>{c.get("id", "")}</td>
  <td>{c.get("name", "")}</td>
  <td style="font-size:12px">{c.get("requirement", "")}</td>
  <td>{self._compliance_status_badge(c.get("status", "not_assessed"), "en")}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">{d.get("name", "")}</div>
  <table>
    <tr><th>Article</th><th>Control</th><th>Requirement</th><th>Status</th></tr>
    {ctrl_rows}
  </table>
</div>""")

        if breach_events:
            be_rows = ""
            for be in breach_events:
                be_rows += f"""<tr>
  <td>{be.get("article", "")}</td>
  <td>{be.get("control_name", "")}</td>
  <td style="font-size:12px">{be.get("findings", "-")}</td>
  <td style="font-size:12px">{be.get("remediation", "-")}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">Breach Event Records</div>
  <table>
    <tr><th>Article</th><th>Control</th><th>Findings</th><th>Remediation</th></tr>
    {be_rows}
  </table>
</div>""")
        else:
            parts.append(f"""
<div class="section">
  <div class="section-title">Breach Event Records</div>
  <p style="text-align:center;color:#28a745;padding:16px;font-weight:600">No breach events recorded. All breach notification requirements are compliant.</p>
</div>""")

        return "".join(parts)

    def _render_iso27001_compliance(self, data: dict) -> str:
        overview = data.get("overview", {})
        fw_info = data.get("framework_info", {})
        assessment_info = data.get("assessment_info", {})
        domains = data.get("domains", [])
        risk_assessment = data.get("risk_assessment", [])
        soa = data.get("soa", [])
        improvements = data.get("improvement_opportunities", [])

        rate = overview.get("compliance_rate", 0)
        score_cls = "score-high" if rate >= 80 else ("score-medium" if rate >= 50 else "score-low")

        parts = []

        parts.append(f"""
<div class="section">
  <div class="section-title">合规总览</div>
  <div class="metric-grid">
    <div style="text-align:center">
      <div class="score-circle {score_cls}">{rate:.0f}%</div>
      <div style="font-size:13px;color:#6c757d">总体合规率</div>
    </div>
    <div class="metric-card success"><div class="value">{overview.get("compliant", 0)}</div><div class="label">合规项</div></div>
    <div class="metric-card warning"><div class="value">{overview.get("partially_compliant", 0)}</div><div class="label">部分合规</div></div>
    <div class="metric-card danger"><div class="value">{overview.get("non_compliant", 0)}</div><div class="label">不合规项</div></div>
  </div>
  <div style="text-align:center;margin-top:8px;font-size:14px">
    标准依据：{fw_info.get("standard_ref", "")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    评估人：{assessment_info.get("assessor", "-")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    控制措施总数：{overview.get("total_controls", 0)}
  </div>
</div>""")

        if domains:
            domain_rows = ""
            for d in domains:
                d_rate = d.get("compliance_rate", 0)
                rate_cls = "low" if d_rate >= 80 else ("medium" if d_rate >= 50 else "critical")
                domain_rows += f"""<tr>
  <td>{d.get("name", "")}</td>
  <td style="font-size:12px;color:#6c757d">{d.get("annex_ref", "")}</td>
  <td style="text-align:center">{d.get("total_controls", 0)}</td>
  <td style="text-align:center;color:#28a745">{d.get("compliant", 0)}</td>
  <td style="text-align:center;color:#f5a623">{d.get("partially_compliant", 0)}</td>
  <td style="text-align:center;color:#e94560">{d.get("non_compliant", 0)}</td>
  <td style="text-align:center;color:#6c757d">{d.get("not_assessed", 0)}</td>
  <td style="text-align:center"><span class="badge badge-{rate_cls}">{d_rate:.1f}%</span></td>
</tr>"""

            parts.append(f"""
<div class="section">
  <div class="section-title">Annex A 控制措施合规状态</div>
  <table>
    <tr><th>控制域</th><th>Annex参考</th><th>控制措施数</th><th>合规</th><th>部分合规</th><th>不合规</th><th>未评估</th><th>合规率</th></tr>
    {domain_rows}
  </table>
</div>""")

        for d in domains:
            controls = d.get("controls", [])
            if not controls:
                continue
            ctrl_rows = ""
            for c in controls:
                ctrl_rows += f"""<tr>
  <td>{c.get("id", "")}</td>
  <td>{c.get("name", "")}</td>
  <td style="font-size:12px">{c.get("requirement", "")}</td>
  <td>{self._compliance_status_badge(c.get("status", "not_assessed"))}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">{d.get("name", "")} 控制措施详情</div>
  <table>
    <tr><th>编号</th><th>控制措施</th><th>要求</th><th>状态</th></tr>
    {ctrl_rows}
  </table>
</div>""")

        if risk_assessment:
            risk_rows = ""
            for r in risk_assessment:
                risk_cls = "critical" if r.get("risk_level") == "高" else "medium"
                risk_rows += f"""<tr>
  <td>{r.get("control_id", "")}</td>
  <td>{r.get("control_name", "")}</td>
  <td><span class="badge badge-{risk_cls}">{r.get("risk_level", "")}</span></td>
  <td style="font-size:12px">{r.get("description", "")}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">风险评估结果</div>
  <table>
    <tr><th>控制措施编号</th><th>控制措施名称</th><th>风险等级</th><th>描述</th></tr>
    {risk_rows}
  </table>
</div>""")
        else:
            parts.append(f"""
<div class="section">
  <div class="section-title">风险评估结果</div>
  <p style="text-align:center;color:#28a745;padding:16px;font-weight:600">所有控制措施均已合规，无风险项</p>
</div>""")

        if soa:
            soa_rows = ""
            for s in soa:
                impl_cls = {"已实施": "low", "部分实施": "medium", "未实施": "critical", "未评估": "high"}.get(s.get("implementation_status", ""), "high")
                soa_rows += f"""<tr>
  <td>{s.get("control_id", "")}</td>
  <td>{s.get("control_name", "")}</td>
  <td style="text-align:center">{s.get("applicability", "")}</td>
  <td style="font-size:12px">{s.get("justification", "-")}</td>
  <td style="text-align:center"><span class="badge badge-{impl_cls}">{s.get("implementation_status", "")}</span></td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">适用性声明（Statement of Applicability）</div>
  <table>
    <tr><th>控制措施编号</th><th>控制措施名称</th><th>适用性</th><th>理由</th><th>实施状态</th></tr>
    {soa_rows}
  </table>
</div>""")

        if improvements:
            imp_rows = ""
            for imp in improvements:
                status_cls = "critical" if imp.get("current_status") == "不合规" else "medium"
                imp_rows += f"""<tr>
  <td>{imp.get("control_id", "")}</td>
  <td>{imp.get("control_name", "")}</td>
  <td><span class="badge badge-{status_cls}">{imp.get("current_status", "")}</span></td>
  <td style="font-size:12px">{imp.get("suggestion", "")}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">改进机会</div>
  <table>
    <tr><th>控制措施编号</th><th>控制措施名称</th><th>当前状态</th><th>改进建议</th></tr>
    {imp_rows}
  </table>
</div>""")
        else:
            parts.append(f"""
<div class="section">
  <div class="section-title">改进机会</div>
  <p style="text-align:center;color:#28a745;padding:16px;font-weight:600">所有控制措施均已合规，暂无改进机会</p>
</div>""")

        return "".join(parts)

    def _render_cis_compliance(self, data: dict) -> str:
        overview = data.get("overview", {})
        fw_info = data.get("framework_info", {})
        assessment_info = data.get("assessment_info", {})
        ig_domains = data.get("ig_domains", [])

        rate = overview.get("compliance_rate", 0)
        score_cls = "score-high" if rate >= 80 else ("score-medium" if rate >= 50 else "score-low")
        maturity = overview.get("maturity_level", "未评级")

        parts = []

        parts.append(f"""
<div class="section">
  <div class="section-title">CIS Controls v8 合规总览</div>
  <div class="metric-grid">
    <div style="text-align:center">
      <div class="score-circle {score_cls}">{rate:.0f}%</div>
      <div style="font-size:13px;color:#6c757d">总体合规率</div>
    </div>
    <div class="metric-card success"><div class="value">{overview.get("compliant", 0)}</div><div class="label">合规项</div></div>
    <div class="metric-card warning"><div class="value">{overview.get("partially_compliant", 0)}</div><div class="label">部分合规</div></div>
    <div class="metric-card danger"><div class="value">{overview.get("non_compliant", 0)}</div><div class="label">不合规项</div></div>
  </div>
  <div style="text-align:center;margin-top:8px;font-size:14px">
    框架标准：{fw_info.get("standard_ref", "")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    评估人：{assessment_info.get("assessor", "-")}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    成熟度等级：<strong>{maturity}</strong>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    控制措施总数：{overview.get("total_controls", 0)}
  </div>
</div>""")

        if ig_domains:
            ig_rows = ""
            for ig in ig_domains:
                ig_rate = ig.get("compliance_rate", 0)
                rate_cls = "low" if ig_rate >= 80 else ("medium" if ig_rate >= 50 else "critical")
                ig_rows += f"""<tr>
  <td>IG{ig.get("ig_level", 1)}</td>
  <td>{ig.get("name", "")}</td>
  <td style="text-align:center">{ig.get("total_controls", 0)}</td>
  <td style="text-align:center;color:#28a745">{ig.get("compliant", 0)}</td>
  <td style="text-align:center;color:#f5a623">{ig.get("partially_compliant", 0)}</td>
  <td style="text-align:center;color:#e94560">{ig.get("non_compliant", 0)}</td>
  <td style="text-align:center;color:#6c757d">{ig.get("not_assessed", 0)}</td>
  <td style="text-align:center"><span class="badge badge-{rate_cls}">{ig_rate:.1f}%</span></td>
  <td style="text-align:center"><span class="badge badge-{'low' if ig.get('maturity_level') == '高级' else ('medium' if ig.get('maturity_level') == '中级' else 'high')}">{ig.get("maturity_level", "")}</span></td>
</tr>"""

            parts.append(f"""
<div class="section">
  <div class="section-title">实施组(IG)合规状态</div>
  <table>
    <tr><th>实施组</th><th>描述</th><th>控制措施数</th><th>合规</th><th>部分合规</th><th>不合规</th><th>未评估</th><th>合规率</th><th>成熟度</th></tr>
    {ig_rows}
  </table>
</div>""")

        for ig in ig_domains:
            controls = ig.get("controls", [])
            if not controls:
                continue
            ctrl_rows = ""
            for c in controls:
                ctrl_rows += f"""<tr>
  <td>{c.get("id", "")}</td>
  <td>{c.get("name", "")}</td>
  <td style="font-size:12px">{c.get("requirement", "")}</td>
  <td>{self._compliance_status_badge(c.get("status", "not_assessed"))}</td>
</tr>"""
            parts.append(f"""
<div class="section">
  <div class="section-title">{ig.get("name", "")} 控制措施详情</div>
  <table>
    <tr><th>编号</th><th>控制措施</th><th>要求</th><th>状态</th></tr>
    {ctrl_rows}
  </table>
</div>""")

        parts.append(f"""
<div class="section">
  <div class="section-title">实施组说明</div>
  <div class="two-col">
    <div>
      <p style="font-weight:600;margin-bottom:8px">IG1 - 基础网络卫生</p>
      <p style="font-size:13px;color:#495057">适用于所有企业，涵盖最基本的网络安全控制措施，帮助组织抵御常见攻击</p>
    </div>
    <div>
      <p style="font-weight:600;margin-bottom:8px">IG2 - 扩展网络卫生</p>
      <p style="font-size:13px;color:#495057">适用于管理敏感信息的中型企业，增加了更高级的安全控制要求</p>
    </div>
  </div>
  <div style="margin-top:12px">
    <p style="font-weight:600;margin-bottom:8px">IG3 - 高级安全实践</p>
    <p style="font-size:13px;color:#495057">适用于面临高级威胁的大型企业，要求最严格的安全控制措施和高级威胁防护能力</p>
  </div>
</div>""")

        return "".join(parts)

    def generate_compliance_report(
        self, db: Session, framework: str, tenant_id: Optional[int] = None
    ) -> dict:
        """生成完整的合规评估报告

        Args:
            db: 数据库会话
            framework: 合规框架代码 (mlps/gdpr/iso27001/cis)
            tenant_id: 租户ID（可选）

        Returns:
            包含完整合规评估数据的字典
        """
        framework_map = {
            "mlps": ("mlps_compliance", self._collect_mlps_data),
            "gdpr": ("gdpr_compliance", self._collect_gdpr_data),
            "iso27001": ("iso27001_compliance", self._collect_iso27001_data),
            "cis": ("cis_compliance", self._collect_cis_data),
        }

        if framework not in framework_map:
            return {"error": f"不支持的合规框架: {framework}，支持: mlps, gdpr, iso27001, cis"}

        template_id, collector = framework_map[framework]

        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(lambda: asyncio.run(collector(db)))
                    data = future.result()
            else:
                data = asyncio.run(collector(db))
        except RuntimeError:
            data = asyncio.run(collector(db))

        now = datetime.now()
        report_title = self.TEMPLATES.get(template_id, f"{framework} 合规报告")
        html_content = self._render_html(template_id, report_title, data, now)

        report_id = str(uuid.uuid4())
        report = {
            "id": report_id,
            "template_id": template_id,
            "template_name": self.TEMPLATES.get(template_id, report_title),
            "title": report_title,
            "framework": framework,
            "tenant_id": tenant_id,
            "generated_at": now.isoformat(),
            "html_content": html_content,
            "data": data,
            "status": "completed",
        }

        _report_cache[report_id] = report
        return report

    def calculate_compliance_score(
        self, db: Session, framework: str, tenant_id: Optional[int] = None
    ) -> dict:
        """计算合规框架的总体得分

        Args:
            db: 数据库会话
            framework: 合规框架代码 (mlps/gdpr/iso27001/cis)
            tenant_id: 租户ID（可选）

        Returns:
            包含评分详情的字典
        """
        framework_map = {
            "mlps": self._collect_mlps_data,
            "gdpr": self._collect_gdpr_data,
            "iso27001": self._collect_iso27001_data,
            "cis": self._collect_cis_data,
        }

        if framework not in framework_map:
            return {"error": f"不支持的合规框架: {framework}，支持: mlps, gdpr, iso27001, cis"}

        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(lambda: asyncio.run(framework_map[framework](db)))
                    data = future.result()
            else:
                data = asyncio.run(framework_map[framework](db))
        except RuntimeError:
            data = asyncio.run(framework_map[framework](db))

        overview = data.get("overview", {})
        domains = data.get("domains", []) or data.get("ig_domains", [])
        assessment_info = data.get("assessment_info", {})
        fw_info = data.get("framework_info", {})

        total = overview.get("total_controls", 0)
        compliant = overview.get("compliant", 0)
        partial = overview.get("partially_compliant", 0)
        non_compliant = overview.get("non_compliant", 0)
        not_assessed = overview.get("not_assessed", 0)
        overall_rate = overview.get("compliance_rate", 0)

        domain_scores = []
        for d in domains:
            domain_total = d.get("total_controls", 0)
            domain_scores.append({
                "domain": d.get("name", ""),
                "total_controls": domain_total,
                "compliant": d.get("compliant", 0),
                "partially_compliant": d.get("partially_compliant", 0),
                "non_compliant": d.get("non_compliant", 0),
                "not_assessed": d.get("not_assessed", 0),
                "score": d.get("compliance_rate", 0),
            })

        grade = "A"
        if overall_rate < 60:
            grade = "D"
        elif overall_rate < 75:
            grade = "C"
        elif overall_rate < 90:
            grade = "B"

        return {
            "framework": fw_info.get("name", framework),
            "code": fw_info.get("code", framework),
            "version": fw_info.get("version", ""),
            "standard_ref": fw_info.get("standard_ref", ""),
            "assessment_name": assessment_info.get("name", ""),
            "assessor": assessment_info.get("assessor", "-"),
            "total_controls": total,
            "compliant": compliant,
            "partially_compliant": partial,
            "non_compliant": non_compliant,
            "not_assessed": not_assessed,
            "overall_score": round(overall_rate, 1),
            "grade": grade,
            "domain_scores": domain_scores,
            "tenant_id": tenant_id,
        }

    def get_gap_analysis(
        self, db: Session, framework: str, tenant_id: Optional[int] = None
    ) -> dict:
        """识别合规差距并提供整改建议

        Args:
            db: 数据库会话
            framework: 合规框架代码 (mlps/gdpr/iso27001/cis)
            tenant_id: 租户ID（可选）

        Returns:
            包含差距分析和整改建议的字典
        """
        framework_map = {
            "mlps": self._collect_mlps_data,
            "gdpr": self._collect_gdpr_data,
            "iso27001": self._collect_iso27001_data,
            "cis": self._collect_cis_data,
        }

        if framework not in framework_map:
            return {"error": f"不支持的合规框架: {framework}，支持: mlps, gdpr, iso27001, cis"}

        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(lambda: asyncio.run(framework_map[framework](db)))
                    data = future.result()
            else:
                data = asyncio.run(framework_map[framework](db))
        except RuntimeError:
            data = asyncio.run(framework_map[framework](db))

        domains = data.get("domains", []) or data.get("ig_domains", [])
        overview = data.get("overview", {})

        gaps = []
        for domain in domains:
            domain_gaps = []
            for ctrl in domain.get("controls", []):
                status = ctrl.get("status", "not_assessed")
                if status in ("non_compliant", "partially_compliant", "not_assessed"):
                    severity = "严重" if status == "non_compliant" else ("中等" if status == "partially_compliant" else "低")
                    domain_gaps.append({
                        "control_id": ctrl.get("id", ""),
                        "control_name": ctrl.get("name", ""),
                        "requirement": ctrl.get("requirement", ""),
                        "current_status": status,
                        "findings": ctrl.get("findings", ""),
                        "remediation": ctrl.get("remediation", ""),
                        "severity": severity,
                    })
            if domain_gaps:
                gaps.append({
                    "domain": domain.get("name", ""),
                    "total_gaps": len(domain_gaps),
                    "critical_gaps": sum(1 for g in domain_gaps if g["severity"] == "严重"),
                    "items": domain_gaps,
                })

        total_gaps = sum(g["total_gaps"] for g in gaps)
        total_critical = sum(g["critical_gaps"] for g in gaps)

        priority_summary = {
            "immediate": [g for g in gaps for i in g["items"] if i["severity"] == "严重"][:5],
            "planned": [g for g in gaps for i in g["items"] if i["severity"] == "中等"][:10],
            "monitor": [g for g in gaps for i in g["items"] if i["severity"] == "低"][:5],
        }

        return {
            "framework": framework,
            "tenant_id": tenant_id,
            "overall_compliance_rate": overview.get("compliance_rate", 0),
            "total_controls": overview.get("total_controls", 0),
            "compliant": overview.get("compliant", 0),
            "total_gaps": total_gaps,
            "total_critical_gaps": total_critical,
            "domains_with_gaps": gaps,
            "priority_actions": priority_summary,
            "summary": f"共发现 {total_gaps} 个合规差距，其中 {total_critical} 个需要立即处理",
        }

    def export_compliance_report(
        self, db: Session, framework: str, format: str = "json",
        tenant_id: Optional[int] = None
    ) -> dict:
        """导出合规报告为指定格式

        Args:
            db: 数据库会话
            framework: 合规框架代码
            format: 导出格式 (json/html/pdf)
            tenant_id: 租户ID（可选）

        Returns:
            包含导出数据的字典
        """
        if format not in ("json", "html"):
            return {"error": f"不支持的导出格式: {format}，支持: json, html"}

        report = self.generate_compliance_report(db, framework, tenant_id)
        if "error" in report:
            return report

        export = {
            "report_id": report["id"],
            "framework": report["framework"],
            "template_id": report["template_id"],
            "template_name": report["template_name"],
            "generated_at": report["generated_at"],
            "format": format,
        }

        if format == "json":
            export["data"] = report["data"]
            export["score"] = self.calculate_compliance_score(db, framework, tenant_id)
            export["gap_analysis"] = self.get_gap_analysis(db, framework, tenant_id)

        if format == "html":
            export["html_content"] = report.get("html_content", "")

        return export

    def _html_to_pdf(self, html_content: str) -> Optional[bytes]:
        try:
            result = subprocess.run(
                ["which", "wkhtmltopdf"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode != 0:
                return None
        except Exception:
            return None

        try:
            with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
                f.write(html_content)
                html_path = f.name

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
                pdf_path = f.name

            result = subprocess.run(
                [
                    "wkhtmltopdf",
                    "--encoding", "utf-8",
                    "--page-size", "A4",
                    "--margin-top", "20mm",
                    "--margin-bottom", "20mm",
                    "--margin-left", "20mm",
                    "--margin-right", "20mm",
                    "--enable-local-file-access",
                    html_path,
                    pdf_path,
                ],
                capture_output=True,
                timeout=30,
            )

            if result.returncode == 0:
                with open(pdf_path, "rb") as f:
                    pdf_bytes = f.read()
                return pdf_bytes

            return None
        except Exception:
            return None
        finally:
            try:
                import os as _os
                _os.unlink(html_path)
            except Exception:
                pass
            try:
                import os as _os
                _os.unlink(pdf_path)
            except Exception:
                pass


report_engine = ReportEngine()