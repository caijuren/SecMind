"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Zap,
  Clock,
  Shield,
  RotateCcw,
  Trophy,
  Radar,
  LineChart,
  Radio,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useLocaleStore } from "@/store/locale-store"
import { PageHeader } from "@/components/layout/page-header"
import { pageCardClass, softCardClass } from "@/lib/admin-ui"
import ReactEChartsCore from "echarts-for-react/lib/core"
import * as echarts from "echarts/core"
import { LineChart as ELineChart, BarChart as EBarChart } from "echarts/charts"
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([
  ELineChart,
  EBarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])

type LearningTab = "knowledge_feedback" | "feedback_learning" | "reasoning_correction" | "ai_growth"

interface FeedbackItem {
  id: string
  caseId: string
  attackType: string
  humanAction: string
  beforeConfidence: number
  afterConfidence: number
  timestamp: string
}

interface FeedbackLearningItem {
  id: string
  caseId: string
  attackProfile: string
  originalAssessment: string
  originalConfidence: number
  humanCorrection: string
  aiLearningOutcome: string
  type: "confirmed" | "disputed"
  comment: string
  timestamp: string
}

interface ReasoningCorrection {
  id: string
  ruleName: string
  beforeWeight: number
  afterWeight: number
  pattern: string
  improvement: string
  beforeConfidence: number
  afterConfidence: number
  timestamp: string
}

interface Milestone {
  id: string
  title: string
  description: string
  date: string
  icon: typeof Trophy
}

const TABS: { value: LearningTab; labelKey: string }[] = [
  { value: "knowledge_feedback", labelKey: "nav.tabKnowledgeFeedback" },
  { value: "feedback_learning", labelKey: "nav.tabFeedbackLearning" },
  { value: "reasoning_correction", labelKey: "nav.tabReasoningCorrection" },
  { value: "ai_growth", labelKey: "nav.tabAiGrowth" },
]

const mockFeedbackItems: FeedbackItem[] = [
  {
    id: "FB-001",
    caseId: "CASE-2026-0042",
    attackType: "alerts.typeCredential",
    humanAction: "learning.humanConfirmAttack",
    beforeConfidence: 78,
    afterConfidence: 92,
    timestamp: "2026-05-09 08:45",
  },
  {
    id: "FB-002",
    caseId: "CASE-2026-0043",
    attackType: "alerts.typeExfiltration",
    humanAction: "learning.humanConfirmAttack",
    beforeConfidence: 72,
    afterConfidence: 88,
    timestamp: "2026-05-09 09:12",
  },
  {
    id: "FB-003",
    caseId: "CASE-2026-0045",
    attackType: "alerts.typePhishing",
    humanAction: "learning.humanConfirmAttack",
    beforeConfidence: 65,
    afterConfidence: 85,
    timestamp: "2026-05-09 07:55",
  },
  {
    id: "FB-004",
    caseId: "CASE-2026-0050",
    attackType: "alerts.typeC2",
    humanAction: "learning.humanConfirmAttack",
    beforeConfidence: 80,
    afterConfidence: 91,
    timestamp: "2026-05-09 11:20",
  },
  {
    id: "FB-005",
    caseId: "CASE-2026-0052",
    attackType: "alerts.typeExfiltration",
    humanAction: "learning.humanConfirmAttack",
    beforeConfidence: 82,
    afterConfidence: 95,
    timestamp: "2026-05-09 03:30",
  },
]

const mockFeedbackLearning: FeedbackLearningItem[] = [
  {
    id: "FL-001",
    caseId: "CASE-2026-0042",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "账号凭证被盗用，攻击者通过VPN异地登录并横向移动至核心服务器",
    originalConfidence: 92,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "确认是凭证泄露，zhang.wei的账号在凌晨3点从境外IP登录VPN，随后RDP到ADM-SRV01，行为基线偏离度确实异常",
    timestamp: "2026-05-09 08:50",
  },
  {
    id: "FL-002",
    caseId: "CASE-2026-0043",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "APT攻击战役，攻击者已建立持久化并开始数据外泄",
    originalConfidence: 88,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "确实是APT，OAuth应用创建的邮件转发规则已确认，cfo.wang的邮箱有大量财务附件被转发到外部存储",
    timestamp: "2026-05-09 09:15",
  },
  {
    id: "FL-003",
    caseId: "CASE-2026-0049",
    attackProfile: "alerts.typePrivEsc",
    originalAssessment: "云平台权限提升攻击，疑似IAM配置被恶意篡改",
    originalConfidence: 45,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "这不是攻击，是运维团队周五晚上的例行IAM策略调整，lambda-exec-role的权限变更是按照变更工单IT-2026-0418执行的",
    timestamp: "2026-05-09 04:30",
  },
  {
    id: "FL-004",
    caseId: "CASE-2026-0046",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "内部横向移动攻击，SMB协议异常传播",
    originalConfidence: 71,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.authorizedActivityLearned",
    type: "confirmed",
    comment: "已确认是授权的渗透测试，pentest.svc账号是安全团队4月申请的红队演练账号，SMB横向移动在授权范围内",
    timestamp: "2026-05-09 06:40",
  },
  {
    id: "FL-005",
    caseId: "CASE-2026-0052",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "BEC诈骗团伙，已通过OAuth应用窃取财务数据",
    originalConfidence: 95,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.supplyChainPatternLearned",
    type: "confirmed",
    comment: "BEC判断完全正确，O365-APP-77是伪造的邮件审计应用，已撤销并隔离EXCH-01，cfo.wang的邮箱规则已清除",
    timestamp: "2026-05-09 04:00",
  },
  {
    id: "FL-006",
    caseId: "CASE-2026-0050",
    attackProfile: "alerts.typeC2",
    originalAssessment: "C2通信检测，受控设备正在与外部命令控制服务器通信",
    originalConfidence: 91,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "确认是C2，dev.zhou的设备通过DNS隧道与blob.store.core通信，JA3指纹匹配Cobalt Strike Beacon，已阻断并隔离",
    timestamp: "2026-05-09 11:20",
  },
  {
    id: "FL-007",
    caseId: "CASE-2026-0045",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "定向钓鱼攻击，攻击者通过恶意邮件获取初始访问权限",
    originalConfidence: 85,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "钓鱼邮件确认，hr.zhang点击了伪装成HR系统的链接，设备WS-HR-08已执行PowerShell下载脚本，已隔离并重置密码",
    timestamp: "2026-05-09 08:10",
  },
  {
    id: "FL-008",
    caseId: "CASE-2026-0048",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "垃圾钓鱼邮件，无用户点击，风险已消除",
    originalConfidence: 83,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "确认无用户点击，邮件网关已拦截，已更新过滤规则屏蔽该发件域",
    timestamp: "2026-05-09 05:30",
  },
  {
    id: "FL-009",
    caseId: "CASE-2026-0047",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "USB投放恶意软件，键盘记录器活跃",
    originalConfidence: 62,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "确认是键盘记录器，hr.chen的设备通过USB感染，EDR已清除恶意进程，USB策略已加固禁止非授权设备",
    timestamp: "2026-05-09 10:30",
  },
  {
    id: "FL-010",
    caseId: "CASE-2026-0053",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "供应链攻击，后门植入CI/CD管道",
    originalConfidence: 65,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，CI-PIPELINE的异常构建是开发团队凌晨部署v3.2.1版本，构建日志中的可疑代码注入是新的配置热加载模块，已确认安全",
    timestamp: "2026-05-09 10:30",
  },
  {
    id: "FL-011",
    caseId: "CASE-2026-0054",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "VPN凭证泄露，攻击者从境外IP登录内网",
    originalConfidence: 89,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "确认凭证泄露，运维人员liu.ming的VPN账号在2小时内从上海和纽约同时登录，已冻结账号并重置MFA",
    timestamp: "2026-05-08 22:15",
  },
  {
    id: "FL-012",
    caseId: "CASE-2026-0055",
    attackProfile: "alerts.typeBruteForce",
    originalAssessment: "RDP暴力破解，疑似勒索软件侦察阶段",
    originalConfidence: 76,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "确实是勒索软件前序侦察，攻击者通过RDP爆破获取workstation.svc权限后部署了Cobalt Strike Beacon",
    timestamp: "2026-05-08 19:40",
  },
  {
    id: "FL-013",
    caseId: "CASE-2026-0056",
    attackProfile: "alerts.typeC2",
    originalAssessment: "DNS隧道通信，疑似数据外传通道",
    originalConfidence: 84,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "DNS隧道确认，dev.zhou的设备每5分钟向update.svc-node.com发送TXT查询，解码后发现包含系统信息采集数据",
    timestamp: "2026-05-08 16:20",
  },
  {
    id: "FL-014",
    caseId: "CASE-2026-0057",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "Pass-the-Hash横向移动，攻击者利用窃取的哈希值在内网扩散",
    originalConfidence: 87,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "PtH攻击确认，攻击者利用admin.svc的NTLM哈希从WS-FLOOR3-12横向移动到DC-PRIMARY，已启用Credential Guard",
    timestamp: "2026-05-08 14:05",
  },
  {
    id: "FL-015",
    caseId: "CASE-2026-0058",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "鱼叉钓鱼攻击，针对财务部门的定向邮件",
    originalConfidence: 91,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "鱼叉钓鱼确认，攻击者伪装CFO发送紧急转账邮件给财务主管，附件是带宏的Excel文件，已拦截并通知全员",
    timestamp: "2026-05-08 11:30",
  },
  {
    id: "FL-016",
    caseId: "CASE-2026-0059",
    attackProfile: "alerts.typePrivEsc",
    originalAssessment: "云平台特权提升，可疑的IAM角色变更",
    originalConfidence: 52,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是Terraform自动化部署导致的IAM角色更新，变更记录在GitLab MR-2847中，已审核通过",
    timestamp: "2026-05-08 09:45",
  },
  {
    id: "FL-017",
    caseId: "CASE-2026-0060",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "大量数据外传，疑似通过HTTPS加密通道窃取数据库内容",
    originalConfidence: 93,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "数据外泄确认，FIN-DB-01在非工作时间向海外IP传输了2.3GB数据，流量解密后确认为客户财务记录",
    timestamp: "2026-05-08 03:15",
  },
  {
    id: "FL-018",
    caseId: "CASE-2026-0061",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "WebShell上传，攻击者通过文件上传漏洞植入后门",
    originalConfidence: 86,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "WebShell确认，攻击者利用Apache文件上传漏洞上传了JSP一句话木马，已删除并修补漏洞CVE-2026-1234",
    timestamp: "2026-05-07 21:50",
  },
  {
    id: "FL-019",
    caseId: "CASE-2026-0062",
    attackProfile: "alerts.typeBruteForce",
    originalAssessment: "SSH暴力破解，针对Linux服务器的凭证攻击",
    originalConfidence: 78,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "SSH爆破确认，源IP 198.51.100.23在30分钟内尝试了12000次登录，成功获取deploy.svc低权限账户",
    timestamp: "2026-05-07 18:30",
  },
  {
    id: "FL-020",
    caseId: "CASE-2026-0063",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "OAuth令牌滥用，可疑的第三方应用授权",
    originalConfidence: 58,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是公司新上线的Salesforce集成应用，OAuth授权范围经过安全团队审批，审批单号SEC-2026-0089",
    timestamp: "2026-05-07 15:20",
  },
  {
    id: "FL-021",
    caseId: "CASE-2026-0064",
    attackProfile: "alerts.typeC2",
    originalAssessment: "可疑HTTPS通信，流量特征匹配Cobalt Strike",
    originalConfidence: 82,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "C2确认，JA3/JA3S指纹匹配Cobalt Strike Malleable C2配置，心跳间隔60秒带Jitter 0.3，已封禁C2域名",
    timestamp: "2026-05-07 12:10",
  },
  {
    id: "FL-022",
    caseId: "CASE-2026-0065",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "WMI远程命令执行，攻击者利用WMI在内网横向移动",
    originalConfidence: 80,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "WMI横向移动确认，攻击者通过WMI在3台服务器上执行PowerShell载荷，已阻断并清理恶意WMI订阅",
    timestamp: "2026-05-07 09:40",
  },
  {
    id: "FL-023",
    caseId: "CASE-2026-0066",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "商务邮件诈骗，攻击者冒充高管发送转账指令",
    originalConfidence: 94,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "BEC确认，攻击者注册了仿冒域名ceo-wang.com发送转账邮件，财务部已拦截3笔共计480万元的异常转账",
    timestamp: "2026-05-07 07:25",
  },
  {
    id: "FL-024",
    caseId: "CASE-2026-0067",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "异常DNS查询，疑似DNS隧道数据外传",
    originalConfidence: 48,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是网络监控系统的DNS健康检查功能，每10秒发送TXT查询到monitor.internal.corp，属正常行为",
    timestamp: "2026-05-07 04:15",
  },
  {
    id: "FL-025",
    caseId: "CASE-2026-0068",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "勒索软件加密行为，文件批量重命名检测",
    originalConfidence: 96,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "勒索软件确认，LockBit 3.0变种在WS-FLOOR3-12上加密了12000个文件，已隔离设备并从备份恢复数据",
    timestamp: "2026-05-06 23:50",
  },
  {
    id: "FL-026",
    caseId: "CASE-2026-0069",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "Kerberoasting攻击，攻击者请求服务票据进行离线破解",
    originalConfidence: 85,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "Kerberoasting确认，攻击者请求了MSSQLSvc和HTTP服务票据，RC4加密类型，已在AD中禁用RC4并监控票据请求",
    timestamp: "2026-05-06 20:30",
  },
  {
    id: "FL-027",
    caseId: "CASE-2026-0070",
    attackProfile: "alerts.typeBruteForce",
    originalAssessment: "暴力破解VPN网关，大量失败登录尝试",
    originalConfidence: 73,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "VPN爆破确认，源IP段103.x.x.x在1小时内尝试了8000次VPN登录，已封禁IP段并启用MFA强制策略",
    timestamp: "2026-05-06 17:45",
  },
  {
    id: "FL-028",
    caseId: "CASE-2026-0071",
    attackProfile: "alerts.typePrivEsc",
    originalAssessment: "容器逃逸攻击，可疑的特权容器运行",
    originalConfidence: 55,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是运维团队的日志采集器DaemonSet，需要privileged模式访问宿主机日志，已加入白名单",
    timestamp: "2026-05-06 14:20",
  },
  {
    id: "FL-029",
    caseId: "CASE-2026-0072",
    attackProfile: "alerts.typeC2",
    originalAssessment: "可疑PowerShell反向Shell连接",
    originalConfidence: 90,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "反向Shell确认，攻击者通过PowerShell Empire建立C2通道，进程树显示powershell.exe从cmd.exe异常启动",
    timestamp: "2026-05-06 11:05",
  },
  {
    id: "FL-030",
    caseId: "CASE-2026-0073",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "DCSync攻击，攻击者复制域控制器凭据",
    originalConfidence: 97,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "DCSync确认，攻击者利用已获取的域管权限执行DCSync导出所有域用户哈希，已重置krbtgt并启用审计",
    timestamp: "2026-05-06 08:30",
  },
  {
    id: "FL-031",
    caseId: "CASE-2026-0074",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "云存储异常访问，大量数据上传至外部对象存储",
    originalConfidence: 67,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是数据团队每日的ETL数据同步任务，将处理后的数据上传至AWS S3数据湖，已在防火墙添加规则白名单",
    timestamp: "2026-05-05 22:10",
  },
  {
    id: "FL-032",
    caseId: "CASE-2026-0075",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "DLL侧加载攻击，合法进程加载恶意DLL",
    originalConfidence: 88,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "DLL侧加载确认，svchost.exe加载了非系统目录的version.dll，经分析为APT41组织的后门组件",
    timestamp: "2026-05-05 19:45",
  },
  {
    id: "FL-033",
    caseId: "CASE-2026-0076",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "带宏恶意文档，用户下载并启用了Excel宏",
    originalConfidence: 81,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "宏病毒确认，Excel文档中的VBA宏执行了PowerShell下载脚本，已在Office组策略中禁用宏执行",
    timestamp: "2026-05-05 16:30",
  },
  {
    id: "FL-034",
    caseId: "CASE-2026-0077",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "黄金票据攻击，检测到伪造的Kerberos TGT",
    originalConfidence: 93,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "黄金票据确认，攻击者利用krbtgt哈希伪造了域管TGT，票据有效期设置为10年，已重置krbtgt两次",
    timestamp: "2026-05-05 13:15",
  },
  {
    id: "FL-035",
    caseId: "CASE-2026-0078",
    attackProfile: "alerts.typeBruteForce",
    originalAssessment: "FTP暴力破解，针对文件服务器的凭证攻击",
    originalConfidence: 42,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是旧版ERP系统的批量文件上传功能，使用固定服务账号ftp-upload进行并发连接，已标记为已知行为",
    timestamp: "2026-05-05 10:00",
  },
  {
    id: "FL-036",
    caseId: "CASE-2026-0079",
    attackProfile: "alerts.typeC2",
    originalAssessment: "HTTPS Beacon心跳通信，流量模式匹配C2框架",
    originalConfidence: 86,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "C2心跳确认，受控主机每45秒向cdn.cloudfront-proxy.net发送POST请求，响应体包含Base64编码指令",
    timestamp: "2026-05-05 07:20",
  },
  {
    id: "FL-037",
    caseId: "CASE-2026-0080",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "PsExec远程执行，攻击者利用PsExec在内网部署工具",
    originalConfidence: 79,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "PsExec横向移动确认，攻击者在5台终端上部署了Mimikatz凭证转储工具，已清除并重置所有受影响账号",
    timestamp: "2026-05-04 23:40",
  },
  {
    id: "FL-038",
    caseId: "CASE-2026-0081",
    attackProfile: "alerts.typePrivEsc",
    originalAssessment: "SUID提权，Linux服务器上的可疑SUID二进制文件",
    originalConfidence: 61,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是系统管理员安装的sudo-wrapper工具，用于审计特权命令执行，SUID位是功能需要，已加入基线白名单",
    timestamp: "2026-05-04 20:15",
  },
  {
    id: "FL-039",
    caseId: "CASE-2026-0082",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "邮件自动转发规则异常，疑似数据外泄通道",
    originalConfidence: 92,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "邮件转发确认，攻击者为cfo.wang创建了隐藏转发规则，将含附件的邮件自动转发到外部Gmail，已清除规则",
    timestamp: "2026-05-04 17:05",
  },
  {
    id: "FL-040",
    caseId: "CASE-2026-0083",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "Rootkit内核模块加载，系统底层被篡改",
    originalConfidence: 89,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "Rootkit确认，检测到Reptile Rootkit的内核模块，隐藏了攻击者的网络连接和进程，已从干净镜像恢复系统",
    timestamp: "2026-05-04 14:30",
  },
  {
    id: "FL-041",
    caseId: "CASE-2026-0084",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "二维码钓鱼，邮件中嵌入恶意二维码诱导扫码",
    originalConfidence: 77,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "二维码钓鱼确认，邮件中的二维码指向仿冒的MFA认证页面，3名员工已扫码输入凭证，已重置密码并通知全员",
    timestamp: "2026-05-04 11:20",
  },
  {
    id: "FL-042",
    caseId: "CASE-2026-0085",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "哈希传递攻击，利用窃取的NTLM哈希进行认证",
    originalConfidence: 91,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "PtH确认，攻击者利用从LSASS转储的admin.svc哈希访问了DC-PRIMARY，已启用Credential Guard和受限RDP",
    timestamp: "2026-05-04 08:45",
  },
  {
    id: "FL-043",
    caseId: "CASE-2026-0086",
    attackProfile: "alerts.typeC2",
    originalAssessment: "域前置通信，攻击者利用CDN域前置隐藏C2流量",
    originalConfidence: 83,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "域前置确认，TLS SNI指向合法CDN域名但HTTP Host头指向C2服务器，已与CDN厂商协作封禁域前置请求",
    timestamp: "2026-05-03 22:30",
  },
  {
    id: "FL-044",
    caseId: "CASE-2026-0087",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "RDP会话劫持，攻击者接管了活跃的RDP会话",
    originalConfidence: 50,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是IT部门的远程支持操作，使用tscon.exe切换用户会话进行故障排查，操作已记录在IT工单系统中",
    timestamp: "2026-05-03 19:10",
  },
  {
    id: "FL-045",
    caseId: "CASE-2026-0088",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "云API异常调用，大量数据通过API接口下载",
    originalConfidence: 75,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是数据团队使用Python脚本批量导出月度报表，API调用频率触发告警阈值，已调整API限流策略",
    timestamp: "2026-05-03 15:40",
  },
  {
    id: "FL-046",
    caseId: "CASE-2026-0089",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "无文件攻击，PowerShell内存执行恶意代码",
    originalConfidence: 87,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "无文件攻击确认，PowerShell从内存中执行了Shellcode，AMSI日志显示绕过尝试，已更新AMSI防护规则",
    timestamp: "2026-05-03 12:25",
  },
  {
    id: "FL-047",
    caseId: "CASE-2026-0090",
    attackProfile: "alerts.typeBruteForce",
    originalAssessment: "数据库暴力破解，针对MySQL的凭证攻击",
    originalConfidence: 69,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "MySQL爆破确认，攻击者从跳板机对FIN-DB-01进行了字典攻击，成功获取readonly账户，已封禁并重置密码",
    timestamp: "2026-05-03 09:00",
  },
  {
    id: "FL-048",
    caseId: "CASE-2026-0091",
    attackProfile: "alerts.typePrivEsc",
    originalAssessment: "sudo提权漏洞利用，攻击者获取root权限",
    originalConfidence: 84,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "sudo提权确认，攻击者利用CVE-2026-9012（Baron Samedit）从普通用户提权到root，已修补sudo版本",
    timestamp: "2026-05-02 21:30",
  },
  {
    id: "FL-049",
    caseId: "CASE-2026-0092",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "语音钓鱼，攻击者冒充IT部门电话套取VPN密码",
    originalConfidence: 63,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "无法确认，前台接到自称IT部门的电话要求提供VPN密码，但无法确认是否为真实攻击，已标记为安全意识培训案例",
    timestamp: "2026-05-02 18:15",
  },
  {
    id: "FL-050",
    caseId: "CASE-2026-0093",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "影子管理员账户创建，攻击者建立持久化后门",
    originalConfidence: 95,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "影子管理员确认，攻击者在AD中创建了sysadmin$.svc隐藏账户并加入Domain Admins组，已删除并审计组成员变更",
    timestamp: "2026-05-02 15:00",
  },
  {
    id: "FL-051",
    caseId: "CASE-2026-0094",
    attackProfile: "alerts.typeC2",
    originalAssessment: "ICMP隧道通信，攻击者利用ICMP协议建立C2通道",
    originalConfidence: 78,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "ICMP隧道确认，检测到异常大小的ICMP Echo Request/Reply（载荷超1000字节），包含加密C2指令",
    timestamp: "2026-05-02 12:30",
  },
  {
    id: "FL-052",
    caseId: "CASE-2026-0095",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "WebDAV数据外传，攻击者利用WebDAV协议传输数据",
    originalConfidence: 71,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "WebDAV外传确认，攻击者通过WebDAV PUT请求将压缩的数据库备份上传至外部WebDAV服务器，已封禁并阻断",
    timestamp: "2026-05-02 09:15",
  },
  {
    id: "FL-053",
    caseId: "CASE-2026-0096",
    attackProfile: "alerts.typeLateral",
    originalAssessment: "DCOM横向移动，攻击者利用DCOM远程执行命令",
    originalConfidence: 82,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "DCOM横向移动确认，攻击者通过MMC20.Application DCOM对象在远程主机执行命令，已禁用远程DCOM激活",
    timestamp: "2026-05-01 20:45",
  },
  {
    id: "FL-054",
    caseId: "CASE-2026-0097",
    attackProfile: "alerts.typeMalware",
    originalAssessment: "挖矿木马感染，服务器CPU异常占用",
    originalConfidence: 90,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "挖矿木马确认，STAGING-DB上运行了XMRig挖矿程序，通过cron持久化，已清除并加固cron权限",
    timestamp: "2026-05-01 17:30",
  },
  {
    id: "FL-055",
    caseId: "CASE-2026-0098",
    attackProfile: "alerts.typeBruteForce",
    originalAssessment: "API密钥暴力枚举，针对REST API的凭证探测",
    originalConfidence: 46,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是第三方安全扫描器在进行授权的API安全评估，扫描任务已提前在安全团队备案，工单号VULN-2026-0156",
    timestamp: "2026-05-01 14:20",
  },
  {
    id: "FL-056",
    caseId: "CASE-2026-0099",
    attackProfile: "alerts.typePrivEsc",
    originalAssessment: "注册表提权，攻击者利用注册表漏洞提升权限",
    originalConfidence: 86,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "注册表提权确认，攻击者利用AlwaysInstallElevated策略通过MSI安装包获取SYSTEM权限，已禁用该策略",
    timestamp: "2026-05-01 11:00",
  },
  {
    id: "FL-057",
    caseId: "CASE-2026-0100",
    attackProfile: "alerts.typeCredential",
    originalAssessment: "LSASS凭证转储，攻击者从内存中提取凭据",
    originalConfidence: 94,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "LSASS转储确认，攻击者使用comsvcs.dll的MiniDump函数转储LSASS进程，获取了15个域用户哈希",
    timestamp: "2026-04-30 22:40",
  },
  {
    id: "FL-058",
    caseId: "CASE-2026-0101",
    attackProfile: "alerts.typePhishing",
    originalAssessment: "钓鱼网站仿冒，检测到与公司登录页面高度相似的钓鱼站点",
    originalConfidence: 88,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.patternReinforced",
    type: "confirmed",
    comment: "钓鱼站点确认，仿冒SSO登录页面的域名sso-company-auth.com已上线3天，12名员工已输入凭证，已通知域名注册商下线",
    timestamp: "2026-04-30 19:15",
  },
  {
    id: "FL-059",
    caseId: "CASE-2026-0102",
    attackProfile: "alerts.typeC2",
    originalAssessment: "GitHub C2通道，攻击者利用GitHub Issue作为C2通信媒介",
    originalConfidence: 73,
    humanCorrection: "learning.aiWasRight",
    aiLearningOutcome: "learning.weightIncreased",
    type: "confirmed",
    comment: "GitHub C2确认，攻击者在私有仓库的Issue中发布Base64编码指令，受控主机每5分钟轮询获取命令",
    timestamp: "2026-04-30 16:00",
  },
  {
    id: "FL-060",
    caseId: "CASE-2026-0103",
    attackProfile: "alerts.typeExfiltration",
    originalAssessment: "蓝牙数据外传，攻击者利用蓝牙协议传输敏感文件",
    originalConfidence: 33,
    humanCorrection: "learning.aiWasWrong",
    aiLearningOutcome: "learning.falsePositiveLearned",
    type: "disputed",
    comment: "误报，是员工使用蓝牙耳机连接办公电脑，蓝牙文件传输功能未启用，告警由蓝牙适配器频繁扫描触发",
    timestamp: "2026-04-30 12:45",
  },
]

const mockCorrections: ReasoningCorrection[] = [
  {
    id: "RC-001",
    ruleName: "learning.vpnAnomalyWeight",
    beforeWeight: 0.65,
    afterWeight: 0.82,
    pattern: "learning.vpnAnomalyPattern",
    improvement: "learning.vpnAnomalyImprovement",
    beforeConfidence: 72,
    afterConfidence: 89,
    timestamp: "2026-05-09 08:50",
  },
  {
    id: "RC-002",
    ruleName: "learning.lateralMovementWeight",
    beforeWeight: 0.58,
    afterWeight: 0.75,
    pattern: "learning.lateralMovementPattern",
    improvement: "learning.lateralMovementImprovement",
    beforeConfidence: 65,
    afterConfidence: 82,
    timestamp: "2026-05-09 09:15",
  },
  {
    id: "RC-003",
    ruleName: "learning.cloudIAMWeight",
    beforeWeight: 0.72,
    afterWeight: 0.45,
    pattern: "learning.cloudIAMPattern",
    improvement: "learning.cloudIAMImprovement",
    beforeConfidence: 45,
    afterConfidence: 68,
    timestamp: "2026-05-09 04:30",
  },
  {
    id: "RC-004",
    ruleName: "learning.c2DetectionWeight",
    beforeWeight: 0.70,
    afterWeight: 0.88,
    pattern: "learning.c2DetectionPattern",
    improvement: "learning.c2DetectionImprovement",
    beforeConfidence: 80,
    afterConfidence: 91,
    timestamp: "2026-05-09 11:20",
  },
]

const mockMilestones: Milestone[] = [
  {
    id: "MS-001",
    title: "learning.milestoneAccuracyTitle",
    description: "learning.milestoneAccuracyDesc",
    date: "2026-04-15",
    icon: Trophy,
  },
  {
    id: "MS-002",
    title: "learning.milestoneFalsePositiveTitle",
    description: "learning.milestoneFalsePositiveDesc",
    date: "2026-04-22",
    icon: Shield,
  },
  {
    id: "MS-003",
    title: "learning.milestoneCoverageTitle",
    description: "learning.milestoneCoverageDesc",
    date: "2026-05-01",
    icon: Target,
  },
  {
    id: "MS-004",
    title: "learning.milestoneSpeedTitle",
    description: "learning.milestoneSpeedDesc",
    date: "2026-05-08",
    icon: Zap,
  },
]

const ACCURACY_DATA = [
  { month: "2025-12", value: 72 },
  { month: "2026-01", value: 76 },
  { month: "2026-02", value: 79 },
  { month: "2026-03", value: 83 },
  { month: "2026-04", value: 87 },
  { month: "2026-05", value: 91 },
]

const FALSE_POSITIVE_DATA = [
  { month: "2025-12", value: 28 },
  { month: "2026-01", value: 24 },
  { month: "2026-02", value: 21 },
  { month: "2026-03", value: 17 },
  { month: "2026-04", value: 13 },
  { month: "2026-05", value: 9 },
]

const RADAR_DIMENSIONS = [
  { key: "attack_recognition", labelKey: "learning.attackRecognition", value: 92 },
  { key: "correlation_reasoning", labelKey: "learning.correlationReasoning", value: 85 },
  { key: "attack_chain_restore", labelKey: "learning.attackChainRestore", value: 88 },
  { key: "disposal_suggestion", labelKey: "learning.disposalSuggestionRadar", value: 79 },
  { key: "false_positive_ident", labelKey: "learning.falsePositiveIdent", value: 83 },
]

function ConfidenceDelta({ before, after }: { before: number; after: number }) {
  const delta = after - before
  const isPositive = delta > 0
  const color = isPositive ? "#22c55e" : "#ff4d4f"
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-slate-400">{before}%</span>
      <ArrowRight className="h-3 w-3 text-slate-300" />
      <span
        className="font-mono text-xs font-bold"
        style={{ color }}
      >
        {after}%
      </span>
      <span
        className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold"
        style={{
          backgroundColor: `${color}15`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <span>↓</span>}
        {isPositive ? "+" : ""}{delta}%
      </span>
    </div>
  )
}

function MiniBar({ value, max = 100, color = "#22d3ee" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-colors"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}

function KnowledgeFeedbackTab() {
  const { t } = useLocaleStore()

  return (
    <div className="space-y-6">
      <div
        className={`${pageCardClass} p-6`}
      >
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-4 w-4 text-cyan-600" />
          <h3 className="text-sm font-semibold text-slate-700">{t("learning.feedbackFlow")}</h3>
        </div>
        <div className="flex items-center justify-center gap-4 py-6">
          <div
            className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4"
          >
            <Shield className="h-6 w-6 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">{t("learning.humanConfirmAttack")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-px w-8 bg-slate-200" />
            <ArrowRight className="h-4 w-4 text-cyan-500" />
            <div className="h-px w-8 bg-slate-200" />
          </div>
          <div
            className="flex flex-col items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-6 py-4"
          >
            <Brain className="h-6 w-6 text-cyan-600" />
            <span className="text-xs font-medium text-cyan-700">{t("learning.aiUpdateWeight")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-px w-8 bg-slate-200" />
            <ArrowRight className="h-4 w-4 text-emerald-500" />
            <div className="h-px w-8 bg-slate-200" />
          </div>
          <div
            className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4"
          >
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">{t("learning.futureMoreAccurate")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${softCardClass} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15">
              <Activity className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.feedbackTotal")}</p>
              <p className="text-2xl font-bold tabular-nums text-slate-900">1,847</p>
            </div>
          </div>
        </div>
        <div className={`${softCardClass} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.accuracyImprovement")}</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">+19%</p>
            </div>
          </div>
        </div>
        <div className={`${softCardClass} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.falsePositiveReduction")}</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600">-68%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-600" />
          {t("learning.recentFeedback")}
        </h3>
        {mockFeedbackItems.map((item) => (
          <div
            key={item.id}
            className={`${softCardClass} p-4 hover:border-cyan-200 transition-colors`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-cyan-700">{item.caseId}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "#22d3ee15",
                    color: "#22d3ee",
                    border: "1px solid #22d3ee30",
                  }}
                >
                  {t(item.attackType)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[11px] text-amber-700">{t(item.humanAction)}</span>
              </div>
              <div className="flex-1" />
              <ConfidenceDelta before={item.beforeConfidence} after={item.afterConfidence} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeedbackLearningTab() {
  const { t } = useLocaleStore()
  const [filter, setFilter] = useState<"all" | "confirmed" | "disputed">("all")

  const filtered = useMemo(() => {
    if (filter === "all") return mockFeedbackLearning
    return mockFeedbackLearning.filter((i) => i.type === filter)
  }, [filter])

  const confirmedCount = mockFeedbackLearning.filter((i) => i.type === "confirmed").length
  const disputedCount = mockFeedbackLearning.filter((i) => i.type === "disputed").length
  const totalFeedbackCount = 178
  const totalThumbsUp = 158
  const totalThumbsDown = 20

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className={`rounded-xl border p-5 cursor-pointer transition-colors ${
            filter === "all"
              ? "border-cyan-200 bg-cyan-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-cyan-200"
          }`}
          onClick={() => setFilter("all")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("common.all")}</p>
              <p className="text-2xl font-bold tabular-nums text-cyan-700">{totalFeedbackCount}</p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-xl border p-5 cursor-pointer transition-colors ${
            filter === "confirmed"
              ? "border-emerald-200 bg-emerald-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-emerald-200"
          }`}
          onClick={() => setFilter(filter === "confirmed" ? "all" : "confirmed")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
              <ThumbsUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.thumbsUpCases")}</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">{totalThumbsUp}</p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-xl border p-5 cursor-pointer transition-colors ${
            filter === "disputed"
              ? "border-red-200 bg-red-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-red-200"
          }`}
          onClick={() => setFilter(filter === "disputed" ? "all" : "disputed")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15">
              <ThumbsDown className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.thumbsDownCases")}</p>
              <p className="text-2xl font-bold tabular-nums text-red-600">{totalThumbsDown}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const isConfirmed = item.type === "confirmed"
          const statusColor = isConfirmed ? "#22c55e" : "#ff4d4f"
          const StatusIcon = isConfirmed ? ThumbsUp : ThumbsDown
          return (
            <div
              key={item.id}
              className={`${softCardClass} p-5 hover:border-cyan-200 transition-colors`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-700">{item.caseId}</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: "#22d3ee15",
                      color: "#22d3ee",
                      border: "1px solid #22d3ee30",
                    }}
                  >
                    {t(item.attackProfile)}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${statusColor}20`,
                      color: statusColor,
                      border: `1px solid ${statusColor}40`,
                    }}
                  >
                    <StatusIcon className="h-2.5 w-2.5" />
                    {isConfirmed ? t("learning.thumbsUp") : t("learning.thumbsDown")}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70">
                      {t("learning.originalAssessment")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.originalAssessment}</p>
                  <div className="mt-2">
                    <MiniBar value={item.originalConfidence} color={item.originalConfidence >= 80 ? "#22c55e" : "#faad14"} />
                    <span className="text-[10px] font-mono text-slate-400 mt-1 inline-block">{item.originalConfidence}%</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">
                      {t("learning.userFeedback")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.comment}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
                      {t("learning.learningOutcome")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{t(item.aiLearningOutcome)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReasoningCorrectionTab() {
  const { t } = useLocaleStore()

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-cyan-400" />
          {t("learning.recentCorrections")}
        </h3>
        {mockCorrections.map((correction) => {
          const weightDelta = correction.afterWeight - correction.beforeWeight
          const isIncrease = weightDelta > 0
          const weightColor = isIncrease ? "#22c55e" : "#ff4d4f"
          return (
            <div
              key={correction.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-cyan-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-900">{t(correction.ruleName)}</span>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">{correction.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    {t("learning.weightAdjustment")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-slate-500">{correction.beforeWeight.toFixed(2)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: weightColor }}
                    >
                      {correction.afterWeight.toFixed(2)}
                    </span>
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${weightColor}15`,
                        color: weightColor,
                        border: `1px solid ${weightColor}30`,
                      }}
                    >
                      {isIncrease ? "+" : ""}{weightDelta.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    {t("learning.beforeAfter")}
                  </span>
                  <ConfidenceDelta before={correction.beforeConfidence} after={correction.afterConfidence} />
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="h-3 w-3 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70">
                    {t("learning.patternRecognition")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{t(correction.pattern)}</p>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
                    {t("learning.improvement")}
                  </span>
                  <span className="text-xs text-emerald-300/80">{t(correction.improvement)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AiGrowthTab() {
  const { t } = useLocaleStore()

  const maxAccuracy = Math.max(...ACCURACY_DATA.map((d) => d.value))
  const minFP = Math.min(...FALSE_POSITIVE_DATA.map((d) => d.value))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15">
              <Target className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.currentAccuracy")}</p>
              <p className="text-2xl font-bold tabular-nums text-cyan-600">91.3%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.monthlyLearningCount")}</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">347</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.falsePositiveDecline")}</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600">-68%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t("learning.coveredAttackTypes")}</p>
              <p className="text-2xl font-bold tabular-nums text-purple-600">24</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-700">{t("learning.accuracyTrend")}</h3>
          </div>
          <ReactEChartsCore
            echarts={echarts}
            option={{
              grid: { top: 30, right: 20, bottom: 30, left: 45 },
              xAxis: {
                type: "category",
                data: ACCURACY_DATA.map((d) => d.month.slice(5)),
                axisLine: { lineStyle: { color: "#e2e8f0" } },
                axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
                axisTick: { show: false },
              },
              yAxis: {
                type: "value",
                min: 60,
                max: 100,
                splitLine: { lineStyle: { color: "#f1f5f9" } },
                axisLabel: { color: "#94a3b8", fontSize: 10, formatter: "{value}%" },
                axisLine: { show: false },
                axisTick: { show: false },
              },
              tooltip: {
                trigger: "axis",
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                textStyle: { color: "#1e293b", fontSize: 12 },
                formatter: (params: any) => {
                  const p = params[0]
                  return `${p.name}<br/><span style="color:#0891b2;font-weight:bold">${p.value}%</span>`
                },
              },
              series: [
                {
                  type: "line",
                  data: ACCURACY_DATA.map((d) => d.value),
                  smooth: true,
                  symbol: "circle",
                  symbolSize: 6,
                  lineStyle: { color: "#0891b2", width: 2.5 },
                  itemStyle: { color: "#0891b2", borderColor: "#ffffff", borderWidth: 2 },
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: "rgba(8,145,178,0.15)" },
                      { offset: 1, color: "rgba(8,145,178,0.02)" },
                    ]),
                  },
                  markPoint: {
                    data: [{ type: "max", name: "Max" }],
                    symbol: "pin",
                    symbolSize: 36,
                    itemStyle: { color: "#0891b2" },
                    label: { color: "#ffffff", fontSize: 10, fontWeight: "bold", formatter: "{c}%" },
                  },
                },
              ],
            }}
            style={{ height: "220px", width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </div>

        <div
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-700">{t("learning.falsePositiveTrend")}</h3>
          </div>
          <ReactEChartsCore
            echarts={echarts}
            option={{
              grid: { top: 30, right: 20, bottom: 30, left: 45 },
              xAxis: {
                type: "category",
                data: FALSE_POSITIVE_DATA.map((d) => d.month.slice(5)),
                axisLine: { lineStyle: { color: "#e2e8f0" } },
                axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
                axisTick: { show: false },
              },
              yAxis: {
                type: "value",
                min: 0,
                max: 35,
                splitLine: { lineStyle: { color: "#f1f5f9" } },
                axisLabel: { color: "#94a3b8", fontSize: 10, formatter: "{value}%" },
                axisLine: { show: false },
                axisTick: { show: false },
              },
              tooltip: {
                trigger: "axis",
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                textStyle: { color: "#1e293b", fontSize: 12 },
                formatter: (params: any) => {
                  const p = params[0]
                  return `${p.name}<br/><span style="color:#059669;font-weight:bold">${p.value}%</span>`
                },
              },
              series: [
                {
                  type: "bar",
                  data: FALSE_POSITIVE_DATA.map((d, i) => ({
                    value: d.value,
                    itemStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: i === FALSE_POSITIVE_DATA.length - 1 ? "#059669" : "#34d399" },
                        { offset: 1, color: i === FALSE_POSITIVE_DATA.length - 1 ? "#05966980" : "#34d39950" },
                      ]),
                      borderRadius: [3, 3, 0, 0],
                    },
                  })),
                  barWidth: "40%",
                  label: {
                    show: true,
                    position: "top",
                    color: "#059669",
                    fontSize: 10,
                    fontFamily: "monospace",
                    formatter: "{c}%",
                  },
                },
                {
                  type: "line",
                  data: FALSE_POSITIVE_DATA.map((d) => d.value),
                  smooth: true,
                  symbol: "circle",
                  symbolSize: 5,
                  lineStyle: { color: "#059669", width: 2, type: "dashed" },
                  itemStyle: { color: "#059669", borderColor: "#ffffff", borderWidth: 2 },
                },
              ],
            }}
            style={{ height: "220px", width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </div>
      </div>

      <div
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Radar className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-700">{t("learning.capabilityRadar")}</h3>
        </div>
        <div className="flex flex-col gap-4">
          {RADAR_DIMENSIONS.map((dim) => {
            const color = dim.value >= 90 ? "#22d3ee" : dim.value >= 80 ? "#22c55e" : "#faad14"
            return (
              <div key={dim.key} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 w-24 shrink-0">{t(dim.labelKey)}</span>
                <div className="flex-1">
                  <MiniBar value={dim.value} color={color} />
                </div>
                <span
                  className="font-mono text-xs font-bold w-10 text-right"
                  style={{
                    color,
                  }}
                >
                  {dim.value}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          {t("learning.learningMilestones")}
        </h3>
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />
          <div className="space-y-4">
            {mockMilestones.map((milestone) => {
              const Icon = milestone.icon
              return (
                <div key={milestone.id} className="relative flex items-start gap-4 pl-10">
                  <div
                    className="absolute left-0 top-1 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-amber-100 border border-amber-300"
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div
                    className="flex-1 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-900">{t(milestone.title)}</span>
                      <span className="text-[10px] text-slate-300 font-mono">{milestone.date}</span>
                    </div>
                    <p className="text-xs text-slate-400">{t(milestone.description)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LearningPage() {
  const { t } = useLocaleStore()
  const [activeTab, setActiveTab] = useState<LearningTab>("knowledge_feedback")

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Brain}
        title={t("learning.title")}
        actions={
          <Link
            className="inline-flex items-center gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700 h-9 px-4 py-2 rounded-md text-sm font-medium"
            href="/signals?from=learning"
          >
            <Radio className="h-4 w-4" />
            查看新信号
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LearningTab)} className="gap-5">
        <TabsList variant="line" className="border-b border-slate-200 w-full justify-start gap-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-slate-500 data-active:text-cyan-400"
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="knowledge_feedback">
          <KnowledgeFeedbackTab />
        </TabsContent>
        <TabsContent value="feedback_learning">
          <FeedbackLearningTab />
        </TabsContent>
        <TabsContent value="reasoning_correction">
          <ReasoningCorrectionTab />
        </TabsContent>
        <TabsContent value="ai_growth">
          <AiGrowthTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
