from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.alert import Alert
from app.models.device import Device
from app.models.itsm import ITSMTicket
from app.models.ai_analysis import AIAnalysis
from app.models.system_setting import SystemSetting
from app.models.integration import IntegrationApp, Webhook
from app.services.auth_service import get_password_hash

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed_users():
    users = [
        User(
            id=1,
            name="张伟",
            department="技术部",
            position="高级工程师",
            level="P7",
            manager="李明",
            is_sensitive=False,
            office="北京总部",
            recent_login_location="北京",
            is_on_leave=False,
            is_resigned=False,
            email="zhangwei@secmind.com",
            phone="13800010011",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            status="active",
            last_login=datetime.now(),
        ),
        User(
            id=2,
            name="李娜",
            department="财务部",
            position="财务经理",
            level="P8",
            manager="王芳",
            is_sensitive=True,
            office="上海分部",
            recent_login_location="上海",
            is_on_leave=False,
            is_resigned=False,
            email="lina@secmind.com",
            phone="13800010012",
            hashed_password=get_password_hash("secmind123"),
            role="user",
            status="active",
            last_login=datetime.now() - timedelta(days=1),
        ),
        User(
            id=3,
            name="王强",
            department="运维部",
            position="运维工程师",
            level="P6",
            manager="赵刚",
            is_sensitive=False,
            office="北京总部",
            recent_login_location="北京",
            is_on_leave=True,
            is_resigned=False,
            email="wangqiang@secmind.com",
            phone="13800010013",
            hashed_password=get_password_hash("secmind123"),
            role="user",
            status="active",
            last_login=datetime.now() - timedelta(hours=8),
        ),
        User(
            id=4,
            name="刘洋",
            department="研发部",
            position="开发工程师",
            level="P5",
            manager="张伟",
            is_sensitive=False,
            office="深圳分部",
            recent_login_location="深圳",
            is_on_leave=False,
            is_resigned=False,
            email="liuyang@secmind.com",
            phone="13800010014",
            hashed_password=get_password_hash("secmind123"),
            role="user",
            status="disabled",
            last_login=datetime.now() - timedelta(days=3),
        ),
        User(
            id=5,
            name="陈静",
            department="人事部",
            position="HR主管",
            level="P7",
            manager="周丽",
            is_sensitive=True,
            office="北京总部",
            recent_login_location="北京",
            is_on_leave=False,
            is_resigned=False,
            email="chenjing@secmind.com",
            phone="13800010015",
            hashed_password=get_password_hash("secmind123"),
            role="user",
            status="active",
            last_login=datetime.now() - timedelta(hours=20),
        ),
        User(
            id=6,
            name="赵磊",
            department="安全部",
            position="安全分析师",
            level="P7",
            manager="孙鹏",
            is_sensitive=True,
            office="北京总部",
            recent_login_location="北京",
            is_on_leave=False,
            is_resigned=False,
            email="zhaolei@secmind.com",
            phone="13800010016",
            hashed_password=get_password_hash("secmind123"),
            role="analyst",
            status="active",
            last_login=datetime.now() - timedelta(hours=2),
        ),
        User(
            id=7,
            name="孙悦",
            department="市场部",
            position="市场专员",
            level="P5",
            manager="吴涛",
            is_sensitive=False,
            office="上海分部",
            recent_login_location="上海",
            is_on_leave=False,
            is_resigned=True,
            email="sunyue@secmind.com",
            phone="13800010017",
            hashed_password=get_password_hash("viewer123"),
            role="user",
            status="disabled",
            last_login=datetime.now() - timedelta(days=15),
        ),
        User(
            id=8,
            name="周明",
            department="技术部",
            position="架构师",
            level="P9",
            manager="黄磊",
            is_sensitive=True,
            office="北京总部",
            recent_login_location="北京",
            is_on_leave=False,
            is_resigned=False,
            email="zhouming@secmind.com",
            phone="13800010018",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            status="active",
            last_login=datetime.now() - timedelta(minutes=35),
        ),
        User(
            id=9,
            name="系统管理员",
            department="安全运营中心",
            position="平台管理员",
            level="P9",
            manager="CTO",
            is_sensitive=True,
            office="北京总部",
            recent_login_location="北京",
            is_on_leave=False,
            is_resigned=False,
            email="admin@secmind.com",
            phone="13800019999",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            status="active",
            last_login=datetime.now(),
        ),
    ]
    for u in users:
        db.merge(u)
    db.commit()
    print(f"  ✓ 用户表：{len(users)} 条记录")

def seed_alerts():
    alerts = [
        Alert(
            id=1,
            type="暴力破解",
            title="SSH暴力破解攻击检测",
            description="检测到来自外部IP的SSH暴力破解攻击，目标服务器为生产环境数据库服务器，5分钟内尝试登录超过200次",
            risk_level="高",
            status="待处理",
            source="IDS",
            source_ip="203.0.113.45",
            destination_ip="10.0.1.100",
            user_id=None,
            user_name=None,
            timestamp=datetime.now() - timedelta(minutes=15),
            raw_log="May 09 10:15:23 db-server sshd[12345]: Failed password for root from 203.0.113.45 port 54321 ssh2",
            tags=["暴力破解", "SSH", "生产环境"],
            ai_score=85.5,
            ai_summary="检测到针对生产数据库服务器的SSH暴力破解攻击，攻击者使用字典攻击方式尝试获取root权限",
            ai_recommendation="建议立即封禁源IP，检查数据库服务器是否存在弱密码，启用双因素认证",
        ),
        Alert(
            id=2,
            type="异常登录",
            title="异常登录行为检测",
            description="用户李娜在非常规时间（凌晨3:00）从异地IP登录财务系统，与历史登录行为不符",
            risk_level="高",
            status="处理中",
            source="UEBA",
            source_ip="198.51.100.23",
            destination_ip="10.0.2.50",
            user_id=2,
            user_name="李娜",
            timestamp=datetime.now() - timedelta(hours=2),
            raw_log="2026-05-09 03:00:15 LOGIN finance-system user=lina ip=198.51.100.23 location=unknown",
            tags=["异常登录", "财务系统", "异地登录"],
            ai_score=78.3,
            ai_summary="财务部敏感用户在凌晨异地登录，存在账号被盗用风险，需确认是否为本人操作",
            ai_recommendation="建议立即联系用户确认，暂时冻结账号，检查财务数据是否被异常访问",
        ),
        Alert(
            id=3,
            type="数据泄露",
            title="敏感数据外传告警",
            description="检测到大量敏感文件通过邮件外发，发送人刘洋，包含客户数据和财务报表",
            risk_level="严重",
            status="待处理",
            source="DLP",
            source_ip="10.0.3.25",
            destination_ip="smtp.external.com",
            user_id=4,
            user_name="刘洋",
            timestamp=datetime.now() - timedelta(hours=5),
            raw_log="DLP Alert: user=liuyang action=email_send files=5 sensitivity=high destination=external",
            tags=["数据泄露", "邮件外发", "敏感数据"],
            ai_score=92.1,
            ai_summary="研发部员工通过邮件大量外传敏感数据，包含客户信息和财务报表，存在严重数据泄露风险",
            ai_recommendation="建议立即阻断该用户的邮件外发权限，启动数据泄露应急响应流程，调查外传数据范围",
        ),
        Alert(
            id=4,
            type="恶意软件",
            title="恶意软件检测告警",
            description="终端检测到可疑进程运行，疑似挖矿木马，占用大量CPU资源",
            risk_level="中",
            status="已处理",
            source="EDR",
            source_ip="10.0.4.80",
            destination_ip=None,
            user_id=3,
            user_name="王强",
            timestamp=datetime.now() - timedelta(days=1),
            raw_log="EDR Alert: endpoint=PC-WANGQIANG process=crypto_miner.exe cpu_usage=95% signature=Trojan.CryptoMiner",
            tags=["恶意软件", "挖矿木马", "终端安全"],
            ai_score=65.0,
            ai_summary="运维部员工终端感染挖矿木马，该木马通过钓鱼邮件传播，已建立C2通信",
            ai_recommendation="隔离受感染终端，检查钓鱼邮件来源，排查其他可能受感染的终端",
        ),
        Alert(
            id=5,
            type="权限提升",
            title="可疑权限提升行为",
            description="检测到用户张伟在非工作时间通过sudo提权执行敏感操作",
            risk_level="高",
            status="处理中",
            source="SIEM",
            source_ip="10.0.1.10",
            destination_ip="10.0.1.100",
            user_id=1,
            user_name="张伟",
            timestamp=datetime.now() - timedelta(hours=8),
            raw_log="sudo: zhangwei : TTY=pts/0 ; PWD=/home/zhangwei ; USER=root ; COMMAND=/bin/cat /etc/shadow",
            tags=["权限提升", "sudo", "敏感操作"],
            ai_score=72.8,
            ai_summary="管理员在非工作时间执行shadow文件读取操作，虽然该用户有管理员权限，但操作时间异常",
            ai_recommendation="确认操作是否为计划内维护，检查是否存在账号被盗用的可能",
        ),
        Alert(
            id=6,
            type="网络扫描",
            title="内网端口扫描行为",
            description="检测到内网中存在端口扫描行为，源IP为10.0.5.20，扫描范围覆盖整个C段",
            risk_level="中",
            status="待处理",
            source="IDS",
            source_ip="10.0.5.20",
            destination_ip="10.0.5.0/24",
            user_id=None,
            user_name=None,
            timestamp=datetime.now() - timedelta(hours=12),
            raw_log="IDS Alert: port_scan src=10.0.5.20 dst=10.0.5.0/24 ports=1-65535 speed=1000pps",
            tags=["网络扫描", "内网渗透", "侦察"],
            ai_score=58.5,
            ai_summary="内网中检测到端口扫描行为，可能是攻击者进行内网渗透的侦察阶段",
            ai_recommendation="定位扫描源设备，检查是否已被入侵，加强内网访问控制策略",
        ),
        Alert(
            id=7,
            type="钓鱼攻击",
            title="钓鱼邮件攻击告警",
            description="多名员工收到伪装为IT部门的钓鱼邮件，诱导点击恶意链接",
            risk_level="高",
            status="处理中",
            source="邮件网关",
            source_ip="185.220.101.35",
            destination_ip="10.0.0.0/16",
            user_id=None,
            user_name=None,
            timestamp=datetime.now() - timedelta(hours=3),
            raw_log="Email Gateway: from=it-support@secm1nd.com subject=密码重置 links=malware-domain.com recipients=15",
            tags=["钓鱼攻击", "邮件安全", "社会工程"],
            ai_score=81.2,
            ai_summary="大规模钓鱼攻击，伪装为IT部门发送密码重置邮件，已有多名员工可能点击了恶意链接",
            ai_recommendation="立即隔离所有相关邮件，通知可能受影响的员工修改密码，检查恶意链接访问日志",
        ),
        Alert(
            id=8,
            type="VPN异常",
            title="VPN异常连接告警",
            description="检测到用户陈静的VPN账号在短时间内从多个不同地理位置登录",
            risk_level="高",
            status="待处理",
            source="VPN网关",
            source_ip="多个异地IP",
            destination_ip="10.0.0.1",
            user_id=5,
            user_name="陈静",
            timestamp=datetime.now() - timedelta(minutes=30),
            raw_log="VPN: user=chenjing connections=3 locations=北京,上海,广州 within=30min",
            tags=["VPN异常", "多地登录", "账号安全"],
            ai_score=76.9,
            ai_summary="HR主管VPN账号在30分钟内从3个不同城市登录，物理上不可能，极大概率账号被盗用",
            ai_recommendation="立即冻结VPN账号，联系用户确认，检查通过该VPN账号的所有操作记录",
        ),
    ]
    for a in alerts:
        db.merge(a)
    db.commit()
    print(f"  ✓ 告警表：{len(alerts)} 条记录")


def seed_devices():
    devices = [
        Device(
            id=1,
            name="核心防火墙-北京",
            type="防火墙",
            brand="深信服",
            model="AF-2000",
            ip="10.0.0.1",
            port=514,
            protocol="Syslog",
            status="online",
            last_sync=datetime.now(),
            log_format="CEF",
            vendor="深信服",
            log_level="all",
            direction="push",
            daily_volume=230000,
            health=99,
            protocol_config={"transport": "UDP", "syslogFormat": "RFC5424"},
        ),
        Device(
            id=2,
            name="VPN网关-主",
            type="VPN网关",
            brand="深信服",
            model="SSL VPN",
            ip="10.0.0.5",
            port=443,
            protocol="API",
            status="online",
            last_sync=datetime.now(),
            log_format="JSON",
            vendor="深信服",
            log_level="alert",
            direction="pull",
            daily_volume=45000,
            health=98,
            protocol_config={"apiUrl": "https://10.0.0.5/api/v1/logs", "authType": "Token", "pollInterval": "30s"},
        ),
        Device(
            id=3,
            name="NAC准入控制",
            type="NAC",
            brand="深信服",
            model="AC-1000",
            ip="10.0.5.5",
            port=161,
            protocol="SNMP",
            status="offline",
            last_sync=datetime.now() - timedelta(hours=2),
            log_format="原生",
            vendor="深信服",
            log_level="all",
            direction="pull",
            daily_volume=0,
            health=0,
            protocol_config={"snmpVersion": "v2c", "trapPort": "162"},
        ),
    ]
    for device in devices:
        db.merge(device)
    db.commit()
    print(f"  ✓ 设备表：{len(devices)} 条记录")


def seed_system_settings():
    settings = SystemSetting(
        id=1,
        system_name="SecMind",
        session_timeout=30,
        ip_whitelist="",
        log_retention=90,
        mfa_enabled=True,
        password_min_length=12,
        ai_model="gpt-4o",
        ai_temperature=0.3,
        ai_max_tokens=4096,
        rag_enabled=True,
    )
    db.merge(settings)
    db.commit()
    print("  ✓ 系统设置表：1 条记录")


def seed_integrations():
    apps = [
        IntegrationApp(id=1, slug="jira", name="Jira", description="工单与项目管理集成，自动创建安全工单", status="connected", color="#2684ff", last_sync="2026-05-10 14:22", sync_frequency="15min", source="integrated"),
        IntegrationApp(id=2, slug="servicenow", name="ServiceNow", description="IT服务管理平台，同步事件与变更", status="connected", color="#81b5a1", last_sync="2026-05-10 13:45", sync_frequency="30min", source="integrated"),
        IntegrationApp(id=3, slug="feishu", name="飞书", description="即时通讯与协作，告警推送与通知", status="connected", color="#3370ff", last_sync="2026-05-10 14:30", sync_frequency="5min", source="integrated"),
        IntegrationApp(id=4, slug="slack", name="Slack", description="团队协作与即时通讯，安全告警频道推送", category="协作", status="disconnected", color="#06b6d4", sync_frequency="15min", source="marketplace"),
        IntegrationApp(id=5, slug="pagerduty", name="PagerDuty", description="事件响应与告警升级，自动分派值班", category="响应", status="disconnected", color="#f59e0b", sync_frequency="15min", source="marketplace"),
    ]
    webhooks = [
        Webhook(id=1, name="告警通知", url="https://api.example.com/webhook/alerts", events=["告警创建", "告警升级"], active=True, created_at="2026-03-15"),
        Webhook(id=2, name="案件同步", url="https://soc.internal.com/hooks/cases", events=["案件状态变更"], active=True, created_at="2026-04-02"),
        Webhook(id=3, name="周报回调", url="https://dashboard.corp.com/hooks/metrics", events=["日报生成", "周报生成"], active=False, created_at="2026-05-08"),
    ]
    for app in apps:
        db.merge(app)
    for webhook in webhooks:
        db.merge(webhook)
    db.commit()
    print(f"  ✓ 集成表：{len(apps)} 条记录")
    print(f"  ✓ Webhook表：{len(webhooks)} 条记录")

def seed_tickets():
    tickets = [
        ITSMTicket(id=1, title="SSH暴力破解攻击处理", description="针对生产数据库服务器的SSH暴力破解攻击，需要紧急处理", status="处理中", priority="紧急", assignee="赵磊", alert_id=1, created_at=datetime.now() - timedelta(minutes=15), updated_at=datetime.now() - timedelta(minutes=10)),
        ITSMTicket(id=2, title="异常登录行为调查", description="财务部李娜凌晨异地登录财务系统，需确认是否为本人操作", status="处理中", priority="高", assignee="赵磊", alert_id=2, created_at=datetime.now() - timedelta(hours=2), updated_at=datetime.now() - timedelta(hours=1)),
        ITSMTicket(id=3, title="数据泄露应急响应", description="检测到研发部刘洋大量外传敏感数据，启动应急响应流程", status="待处理", priority="紧急", assignee=None, alert_id=3, created_at=datetime.now() - timedelta(hours=5), updated_at=datetime.now() - timedelta(hours=5)),
        ITSMTicket(id=4, title="终端恶意软件清除", description="运维部王强终端感染挖矿木马，已隔离处理", status="已关闭", priority="中", assignee="张伟", alert_id=4, created_at=datetime.now() - timedelta(days=1), updated_at=datetime.now() - timedelta(hours=12), resolution="已隔离受感染终端，清除挖矿木马，更新终端安全策略"),
    ]
    for t in tickets:
        db.merge(t)
    db.commit()
    print(f"  ✓ 工单表：{len(tickets)} 条记录")

def seed_analyses():
    analyses = [
        AIAnalysis(
            id=1, alert_id=1,
            conclusion="确认SSH暴力破解攻击，攻击者使用自动化工具进行字典攻击，目标为生产数据库服务器root账户",
            risk_score=85.5, risk_level="高",
            attack_chain=[{"step": 1, "action": "端口扫描", "detail": "扫描目标22端口确认SSH服务开放"}, {"step": 2, "action": "暴力破解", "detail": "使用字典文件尝试200+次登录"}, {"step": 3, "action": "权限获取", "detail": "尝试获取root权限访问系统"}],
            recommendations=["立即封禁源IP 203.0.113.45", "检查数据库服务器是否存在弱密码", "启用SSH双因素认证", "配置fail2ban防止暴力破解"],
            related_events=[{"id": 101, "type": "端口扫描", "timestamp": "2026-05-09 10:10:00"}, {"id": 102, "type": "登录失败", "timestamp": "2026-05-09 10:12:00"}],
            user_context=None,
            timestamp=datetime.now() - timedelta(minutes=14),
            agent_type="综合分析",
        ),
        AIAnalysis(
            id=2, alert_id=2,
            conclusion="财务部敏感用户在凌晨异地登录财务系统，登录行为与历史模式严重不符，存在账号被盗用风险",
            risk_score=78.3, risk_level="高",
            attack_chain=[{"step": 1, "action": "凭证获取", "detail": "攻击者可能通过钓鱼邮件获取用户凭证"}, {"step": 2, "action": "异地登录", "detail": "使用窃取的凭证从异地IP登录财务系统"}, {"step": 3, "action": "数据访问", "detail": "访问财务敏感数据"}],
            recommendations=["立即联系用户李娜确认是否为本人操作", "暂时冻结该账号的登录权限", "检查财务系统访问日志确认数据是否被异常访问", "强制该用户修改密码并启用MFA"],
            related_events=[{"id": 201, "type": "钓鱼邮件", "timestamp": "2026-05-08 14:00:00"}, {"id": 202, "type": "密码修改", "timestamp": "2026-05-08 15:30:00"}],
            user_context="李娜，财务部经理，P8级别，敏感岗位人员，近期无出差计划",
            timestamp=datetime.now() - timedelta(hours=1),
            agent_type="用户行为分析",
        ),
        AIAnalysis(
            id=3, alert_id=3,
            conclusion="研发部员工通过邮件大量外传敏感数据，包含客户信息和财务报表，属于严重数据泄露事件",
            risk_score=92.1, risk_level="严重",
            attack_chain=[{"step": 1, "action": "数据收集", "detail": "从内部系统下载客户数据和财务报表"}, {"step": 2, "action": "数据外传", "detail": "通过邮件将5份敏感文件发送至外部邮箱"}, {"step": 3, "action": "数据泄露", "detail": "敏感数据已到达外部不可控环境"}],
            recommendations=["立即阻断该用户的邮件外发权限", "启动数据泄露应急响应流程", "调查外传数据的具体范围和内容", "联系邮件接收方要求删除敏感数据", "评估是否需要向监管机构报告"],
            related_events=[{"id": 301, "type": "文件下载", "timestamp": "2026-05-09 05:00:00"}, {"id": 302, "type": "邮件发送", "timestamp": "2026-05-09 05:15:00"}],
            user_context="刘洋，研发部开发工程师，P5级别，非敏感岗位，近期有离职意向",
            timestamp=datetime.now() - timedelta(hours=4),
            agent_type="数据泄露分析",
        ),
    ]
    for a in analyses:
        db.merge(a)
    db.commit()
    print(f"  ✓ AI分析表：{len(analyses)} 条记录")

def main():
    print("\n开始初始化数据库...")
    print("=" * 40)

    try:
        seed_users()
        seed_alerts()
        seed_devices()
        seed_system_settings()
        seed_integrations()
        seed_tickets()
        seed_analyses()

        print("=" * 40)
        total = (
            db.query(User).count()
            + db.query(Alert).count()
            + db.query(Device).count()
            + db.query(SystemSetting).count()
            + db.query(IntegrationApp).count()
            + db.query(Webhook).count()
            + db.query(ITSMTicket).count()
            + db.query(AIAnalysis).count()
        )
        print(f"\n✅ 数据库初始化完成！共导入 {total} 条记录")
    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
