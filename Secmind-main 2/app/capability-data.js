export const CAPABILITY_DETAILS = {
  "A1": {
    purpose: "给定账户标识（username/email/uid/SID），输出该账户的身份、组织、状态、风险标签全景。",
    inputs: [
      { field: "principal", required: true, desc: "username / email / uid / SID 任一" },
      { field: "time_window", required: false, desc: "行为聚合窗口，默认 30d" },
    ],
    dataQueries: [
      { order: 1, source: "DS-HR", look: "姓名、工号、部门、岗位、汇报线、入职日、在职状态、离职倒计时", keys: "employee_id, status" },
      { order: 2, source: "DS-IDP", look: "UPN、SID、组成员、最近改密时间、MFA 状态、锁定状态、近 30d 登录次数", keys: "upn, sid, groups" },
      { order: 3, source: "DS-CMDB", look: "该用户名下绑定的主机/资产清单（Owner 关系）", keys: "owner→asset[]" },
      { order: 4, source: "DS-PAM", look: "是否特权账户、可申领的角色、近 N 天申领记录", keys: "role_assignments" },
      { order: 5, source: "DS-EMAIL", look: "主邮箱、别名、邮箱转发规则、外发自动转发设置", keys: "aliases, forwarding_rules" },
      { order: 6, source: "DS-KB", look: "该账户历史命中告警数 / 类型分布 / 最近一次", keys: "prior_alerts" },
      { order: 7, source: "内部观察名单", look: "是否在威胁/合规/离职观察名单", keys: "watchlist_tags" },
    ],
    outputs: [
      { field: "identity", desc: "{ display_name, employee_id, department, manager, hire_date, status, leaving_date? }" },
      { field: "auth", desc: "{ upn, sid, groups[], mfa_enabled, last_password_change, locked }" },
      { field: "privilege", desc: "{ is_privileged, roles[], pam_assignments[] }" },
      { field: "assets", desc: "[ { asset_id, role: owner|user|admin } ]" },
      { field: "email", desc: "{ primary, aliases[], forwarding_rules[] }" },
      { field: "risk_tags", desc: "[ leaver_30d | watchlist | dormant_active | priv_no_mfa | ... ]" },
      { field: "prior_alerts_30d", desc: "count" },
      { field: "confidence / partial / evidence_refs", desc: "通用元字段" },
    ],
    triggers: [`任何含"用户"实体的告警必调用。`],
    notes: [
      `HR 数据通常 T+1，离职当天告警要标注"HR 可能尚未同步"`,
      "邮件转发规则是 BEC 持久化经典点，必须查",
      `"在职但 90 天未活跃账户突然活跃" = 高优风险标签`,
    ],
    relatedCapabilities: [],
  },
  "A2": {
    purpose: "给定主机标识（hostname/AgentID/asset_id），输出该终端的资产属性、运行状态、安全配置、关联人。",
    inputs: [
      { field: "host", required: true, desc: "hostname / agent_id / asset_id / MAC / 当前 IP" },
      { field: "time_window", required: false, desc: "默认 7d" },
    ],
    dataQueries: [
      { order: 1, source: "DS-CMDB", look: "asset_id、Owner、使用人、业务线、重要性等级、所在 IDC/办公区、生命周期阶段", keys: "asset_id, owner" },
      { order: 2, source: "DS-EDR", look: "OS、内核版本、Agent 版本、最近在线时间、当前用户、当前外网 IP", keys: "agent_id, host" },
      { order: 3, source: "DS-IPAM", look: "当前/历史 IP-MAC 绑定", keys: "ip, mac, host" },
      { order: 4, source: "DS-VULN", look: "已知 CVE 列表、暴露面（端口/服务）、上次扫描时间", keys: "asset_id, cve_id" },
      { order: 5, source: "DS-AV", look: "引擎状态、特征库版本、最近查杀历史", keys: "host" },
      { order: 6, source: "DS-TICKET", look: "关联工单（维护中？变更窗口？）", keys: "asset_id" },
      { order: 7, source: "DS-KB", look: "该主机历史告警", keys: "host" },
      { order: 8, source: "DS-MOBILE", look: "若为移动设备：MDM 合规状态、越狱/Root、加密状态", keys: "device_id" },
    ],
    outputs: [
      { field: "asset", desc: "{ id, owner, business_unit, criticality, location, lifecycle }" },
      { field: "system", desc: "{ os, kernel, edr_agent_version, last_seen, current_user, current_ip }" },
      { field: "security_posture", desc: "{ vuln_count, critical_cves[], av_status, edr_health }" },
      { field: "change_context", desc: "{ active_ticket?, in_maintenance_window? }" },
      { field: "prior_alerts_30d", desc: "count" },
    ],
    triggers: [`任何"主机/终端"告警必调用。`],
    notes: [
      `"重要性" 字段对优先级影响巨大，CMDB 缺失或不准时上层应降级判定`,
      "维护窗内的告警优先级应自动下调，但仍需调查（防止假借维护）",
    ],
    relatedCapabilities: [],
  },
  "A3": {
    purpose: "A2 的服务器特化版，关注业务暴露面。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-CMDB", look: "服务器组、业务系统、上下游依赖、面向公网/内网", keys: "asset_id, business_unit" },
      { order: 2, source: "DS-EDR / 主机", look: "运行的服务/端口、关键进程、SSH key 列表、最近重启", keys: "host" },
      { order: 3, source: "DS-VULN", look: "暴露端口及对应 CVE", keys: "asset_id, port, cve_id" },
      { order: 4, source: "DS-FW", look: "入向访问策略（谁能连）", keys: "dst_ip, dst_port" },
      { order: 5, source: "DS-TICKET", look: "配置变更/上线工单", keys: "asset_id" },
      { order: 6, source: "DS-WAF", look: "若是 Web 服务器：近 N 天 WAF 拦截趋势", keys: "server_ip" },
    ],
    outputs: [
      { field: "扩展 A2", desc: "包含 A2 全部输出字段" },
      { field: "exposure", desc: "{ internet_facing, ports[], upstream_systems[] }" },
    ],
    triggers: [
      "公网暴露服务器相关告警（WAF/漏洞扫描/Web 入侵）→ 立刻调用",
      "A4 IP 反查归属为服务器 → 下钻调用",
    ],
    notes: [
      "internet_facing=true 时 F2 严重性应额外加权",
      "CMDB 上下游依赖缺失时，爆炸半径估算会严重低估",
    ],
    relatedCapabilities: ["A2"],
  },
  "A4": {
    purpose: `给定 IP，回答"它是谁、来自哪里、有没有问题、组织内有什么关联"。`,
    inputs: [
      { field: "ip", required: true, desc: "IPv4/IPv6" },
      { field: "time_window", required: false, desc: "默认 ±24h" },
    ],
    dataQueries: [
      { order: 1, source: "内网 CIDR 表 / DS-CMDB", look: "是否内网、归属网段、Owner 部门", keys: "cidr, owner" },
      { order: 2, source: "DS-IPAM", look: "内网 IP↔MAC↔主机映射", keys: "ip, mac, host" },
      { order: 3, source: "DS-IPAM (DHCP)", look: "时间窗内该 IP 分配给哪台 MAC/主机", keys: "ip, mac, ts" },
      { order: 4, source: "DS-VPN", look: "是否远程接入分配 IP（VPN/SDP/ZTNA）", keys: "assigned_ip, user" },
      { order: 5, source: "DS-IPAM (NAT)", look: "出向 NAT 后映射到内网哪个源（反向还原）", keys: "nat_ip, src_ip" },
      { order: 6, source: "DS-FW / DS-NDR", look: "时间窗内连接量、对端分布、协议分布", keys: "src_ip, dst_ip, proto" },
      { order: 7, source: "DS-DNS", look: "该 IP 被哪些域名解析过（反向 PTR）/ 它发出的查询", keys: "ip, domain" },
      { order: 8, source: "DS-TI", look: "多源信誉、关联恶意标签、首次/最近见到时间", keys: "ip" },
      { order: 9, source: "DS-WHOIS", look: "WHOIS：持有人、注册国、ASN", keys: "ip, asn" },
      { order: 10, source: "DS-WHOIS (CT)", look: "关联证书 SAN", keys: "ip, cert_san" },
      { order: 11, source: "DS-KB", look: "该 IP 历史告警次数", keys: "ip" },
    ],
    outputs: [
      { field: "classification", desc: "internal / external / vpn / cloud_egress / cdn / tor / unknown" },
      { field: "internal_resolution", desc: "{ host, mac, owner, env } | null" },
      { field: "reputation", desc: "{ score, verdict, sources[], tags[] }" },
      { field: "asn", desc: "{ number, org, country }" },
      { field: "activity_summary", desc: "{ conn_count, top_peers[], first_seen, last_seen }" },
      { field: "related_entities", desc: "{ users[], hosts[], domains[] }" },
    ],
    triggers: [
      "任何外联/被扫描类告警 → 立刻调用",
      "横向移动假设 → 用于内网 IP 还原回主机",
    ],
    notes: [`DHCP/VPN/NAT 是内网 IP 还原"必查三件套"，缺一会断链。`],
    relatedCapabilities: [],
  },
  "A5": {
    purpose: "给定域名，输出域名的注册信息、信誉、解析历史、证书历史、内部暴露情况及仿冒分析。",
    inputs: [
      { field: "domain", required: true, desc: "域名" },
      { field: "time_window", required: false, desc: "查询时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-WHOIS", look: "注册商、注册时间（域名年龄）、注册人、隐私保护", keys: "domain, registrar, created" },
      { order: 2, source: "DS-WHOIS (pDNS)", look: "历史解析 IP、解析变化频率", keys: "domain, ip, ts" },
      { order: 3, source: "DS-WHOIS (CT)", look: "证书历史、SAN 关联子域名", keys: "domain, cert_sha256, san" },
      { order: 4, source: "DS-TI", look: "信誉、分类（钓鱼/C2/挖矿/...）、关联家族", keys: "domain" },
      { order: 5, source: "DS-DNS", look: "内部解析次数、解析它的主机/用户", keys: "domain, host, user" },
      { order: 6, source: "DS-PROXY", look: "访问该域名的内部用户/会话", keys: "domain, user, session" },
      { order: 7, source: "字形相似算法", look: "与组织品牌域/常用 SaaS 域的相似度（钓鱼仿冒）", keys: "domain, brand_domain, score" },
      { order: 8, source: "DS-EMAIL", look: "近 N 天收到来自该域的邮件", keys: "sender_domain, count" },
    ],
    outputs: [
      { field: "whois", desc: "{ registrar, created, age_days, registrant, privacy }" },
      { field: "reputation", desc: "{ verdict, categories[], tags[] }" },
      { field: "dns_history", desc: "[ {ip, first_seen, last_seen} ]" },
      { field: "cert_history", desc: "[ {sha256, sans, issuer} ]" },
      { field: "internal_exposure", desc: "{ queried_by_hosts[], visited_by_users[], received_emails[] }" },
      { field: "lookalike", desc: "{ brand?, similarity_score, technique: punycode|typo|... }" },
    ],
    triggers: ["钓鱼/C2/DNS 隧道/挖矿类告警必调用。"],
    notes: ["域名年龄 < 30d 是高风险信号（DGA / 新注册攻击基础设施）。"],
    relatedCapabilities: [],
  },
  "A6": {
    purpose: "给定 URL，输出解析结构、信誉、沙箱分析及内部访问情况。",
    inputs: [
      { field: "url", required: true, desc: "完整 URL" },
      { field: "time_window", required: false, desc: "查询时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-TI", look: "URL 信誉、分类", keys: "url" },
      { order: 2, source: "DS-SANDBOX", look: "URL 动态引爆：页面截图、跳转链、加载资源、表单字段", keys: "url" },
      { order: 3, source: "DS-WHOIS", look: "子域所属主域 → A5", keys: "host, domain" },
      { order: 4, source: "DS-PROXY", look: "内部访问历史（谁/几次/几台机器）", keys: "url, user, host" },
      { order: 5, source: "DS-WAF", look: "若指向自家域：相关拦截记录", keys: "url" },
      { order: 6, source: "URL 解析", look: "提取参数、解码 base64/URL-encoded、识别 redirect/exfil 模式", keys: "url, params" },
    ],
    outputs: [
      { field: "parsed", desc: "{ scheme, host, path, query_params, decoded_params }" },
      { field: "reputation", desc: "{ verdict, categories[] }" },
      { field: "sandbox", desc: "{ screenshot, final_url, resources[], forms[] }" },
      { field: "internal_exposure", desc: "{ visits[], hosts[], users[] }" },
    ],
    triggers: [
      "邮件/钓鱼告警中出现可疑链接 → 立刻调用",
      "WAF 拦截到指向自家域的异常 URL → 调用",
    ],
    notes: [
      "信誉未知时必须走沙箱（E5），勿直接跳过",
      "base64/重定向链 URL 须先解码再入 TI 查询",
    ],
    relatedCapabilities: [],
  },
  "A7": {
    purpose: "给定文件哈希或文件路径，输出文件的静态分析、信誉、沙箱行为及内部传播范围。",
    inputs: [
      { field: "hash", required: false, desc: "MD5/SHA1/SHA256" },
      { field: "file_path + host", required: false, desc: "文件路径与主机" },
      { field: "file_bytes", required: false, desc: "文件字节流" },
    ],
    dataQueries: [
      { order: 1, source: "DS-TI", look: "多源 Hash 信誉、家族、首次曝光时间", keys: "hash" },
      { order: 2, source: "DS-SANDBOX", look: "动态行为：网络/文件/注册表/进程/注入", keys: "hash, file" },
      { order: 3, source: "DS-EDR", look: "本组织内该 Hash 的传播范围（哪些机器/用户/时间）", keys: "hash, host, user" },
      { order: 4, source: "DS-EDR", look: "签名信息：签名者、证书链、吊销状态", keys: "hash, signer" },
      { order: 5, source: "静态分析", look: "文件类型、节区、导入表、字符串、PE/ELF/Macro/JS 特征", keys: "file" },
      { order: 6, source: "YARA / Sigma", look: "规则匹配", keys: "file, hash" },
      { order: 7, source: "DS-AV", look: "各 AV 引擎命中", keys: "hash" },
      { order: 8, source: "DS-EMAIL", look: "是否作为附件出现过、收件人列表", keys: "hash, recipients" },
    ],
    outputs: [
      { field: "hashes", desc: "{ md5, sha1, sha256 }" },
      { field: "static", desc: "{ type, size, signature, sections[], imports[], strings_of_interest[] }" },
      { field: "reputation", desc: "{ verdict, family?, sources[] }" },
      { field: "sandbox", desc: "{ dropped_files[], net_iocs[], registry_changes[], spawned_procs[], mitre_ttps[] }" },
      { field: "internal_spread", desc: "{ hosts[], first_seen, last_seen }" },
      { field: "yara_hits", desc: "[...]" },
      { field: "av_hits", desc: "[...]" },
    ],
    triggers: ["恶意软件 / 可疑文件落地 / 邮件附件类告警。"],
    notes: [
      "本地不存在的 Hash 必须先 TI 再沙箱（沙箱昂贵）",
      "签名合法 ≠ 安全（已被吊销、伪造、白利用）",
    ],
    relatedCapabilities: [],
  },
  "A8": {
    purpose: "给定进程标识，输出进程的身份信息、签名、父进程、行为摘要及可疑评分。",
    inputs: [
      { field: "process_guid", required: false, desc: "进程全局唯一标识" },
      { field: "host, pid, start_time", required: false, desc: "主机 + 进程 ID + 启动时间" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "进程名、命令行（完整）、父进程、用户上下文、完整性等级", keys: "process_guid, pid, ppid" },
      { order: 2, source: "DS-EDR", look: "镜像路径、SHA256、签名状态", keys: "process_guid, image_path, hash" },
      { order: 3, source: "DS-EDR", look: "加载的模块/DLL、注入痕迹", keys: "process_guid, modules" },
      { order: 4, source: "DS-EDR", look: "该进程的网络连接 / 文件操作 / 注册表操作（联动 B 类）", keys: "process_guid" },
      { order: 5, source: "命令行解析", look: "base64、PowerShell -enc、LOLBin 模式、参数混淆", keys: "cmdline" },
      { order: 6, source: "DS-TI", look: "镜像 Hash 信誉 → A7", keys: "hash" },
      { order: 7, source: "路径黑名单", look: "%TEMP% / %APPDATA% / Public / Recycle Bin 等可疑路径", keys: "image_path" },
    ],
    outputs: [
      { field: "identity", desc: "{ pid, ppid, name, cmdline, image_path, hash, user, integrity }" },
      { field: "signature", desc: "{ signed, signer, valid, revoked }" },
      { field: "parent", desc: "{ name, cmdline, user } （往上一层）" },
      { field: "behavior_summary", desc: "{ net_conn_count, file_op_count, reg_op_count, modules_loaded[] }" },
      { field: "decoded_cmdline", desc: "{ raw, decoded_layers[], suspicious_patterns[] }" },
      { field: "suspicion_score", desc: "0-100 + 原因列表" },
    ],
    triggers: [
      "B3 进程树出现高 suspicion 节点 → 下钻调用",
      "EDR 进程告警直接携带 process_guid → 调用",
    ],
    notes: [
      "命令行解码层数 > 1 是强混淆信号，单独记录每层",
      "%TEMP%/%APPDATA% 路径执行 + 无签名 = 高优先级",
    ],
    relatedCapabilities: [],
  },
  "A9": {
    purpose: "给定邮件地址，输出是否内部员工、收发量、认证通过率、域名画像及仿冒分析。",
    inputs: [
      { field: "email_address", required: true, desc: "邮件地址" },
      { field: "time_window", required: false, desc: "查询时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-HR / DS-IDP", look: "是否内部员工 → 联动 A1", keys: "email, employee_id" },
      { order: 2, source: "DS-EMAIL", look: "收发历史、过去 30d 邮件量、典型收件人模式", keys: "email, ts, volume" },
      { order: 3, source: "DS-EMAIL", look: "SPF/DKIM/DMARC 历史通过率", keys: "email, auth_result" },
      { order: 4, source: "DS-WHOIS", look: "域名画像 → A5", keys: "domain" },
      { order: 5, source: "DS-TI", look: "该邮箱/域是否在恶意名单", keys: "email, domain" },
      { order: 6, source: "暗网/泄露库", look: "该邮箱是否出现在已知泄露数据", keys: "email" },
      { order: 7, source: "字形相似", look: "是否仿冒高管/财务/合作方邮箱（CEO Fraud 检测）", keys: "email, target" },
    ],
    outputs: [
      { field: "internal", desc: "bool / employee_ref?" },
      { field: "volume_30d", desc: "{ sent, received }" },
      { field: "auth_pass_rate", desc: "{ spf, dkim, dmarc }" },
      { field: "domain_profile", desc: "ref → A5" },
      { field: "breach_exposure", desc: "[ { source, date } ]" },
      { field: "lookalike_of", desc: "employee? brand?" },
    ],
    triggers: [
      "B8 邮件发件人/收件人地址需要核实身份 → 调用",
      "钓鱼/BEC 告警中出现外部邮箱 → 调用",
    ],
    notes: [
      "SPF/DKIM/DMARC 全过率低于 80% 是伪造高危信号",
      "暗网泄露库查询依赖外部接口，延迟较高，可并行触发",
    ],
    relatedCapabilities: ["A5", "A1"],
  },
  "A10": {
    purpose: "给定证书哈希或主机端口，输出证书颁发者、有效期、SAN、内网出现情况及信誉。",
    inputs: [
      { field: "cert_sha256", required: false, desc: "证书 SHA256" },
      { field: "host, port", required: false, desc: "主机与端口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-WHOIS (CT)", look: "颁发者、有效期、SAN、签发历史", keys: "cert_sha256, san, issuer" },
      { order: 2, source: "DS-NDR / 探针", look: "该证书在内网哪些会话出现过", keys: "cert_sha256, session" },
      { order: 3, source: "DS-TI", look: "是否在恶意证书清单（C2 常用、过期重用）", keys: "cert_sha256" },
      { order: 4, source: "JA3/JA3S", look: "客户端/服务端 TLS 指纹关联", keys: "ja3, ja3s, cert_sha256" },
    ],
    outputs: [],
    triggers: [
      "B4 发现可疑 TLS 会话 / NDR 异常 JA3 → 调用",
      "A5 域名画像发现关联证书需要深挖 → 调用",
    ],
    notes: [
      "自签名 + 过期证书被 C2 框架复用是常见特征",
      "JA3 指纹匹配需维护本地已知 C2 指纹库",
    ],
    relatedCapabilities: [],
  },
  "A11": {
    purpose: "给定云资源标识，输出资源类型、IAM 策略、公网暴露情况及近期 API 活动。",
    inputs: [
      { field: "arn / resource_id", required: true, desc: "云资源 ARN 或 ID" },
      { field: "cloud_provider", required: true, desc: "云厂商" },
    ],
    dataQueries: [
      { order: 1, source: "DS-CLOUD (Config/Resource)", look: "资源类型、Tag、所属账户、创建时间、创建者", keys: "arn, account, tags" },
      { order: 2, source: "DS-CLOUD (IAM)", look: "关联角色/策略、可访问主体", keys: "arn, policy, role" },
      { order: 3, source: "DS-CLOUD (Audit)", look: "近 N 天该资源的 API 操作记录", keys: "arn, event_name, caller" },
      { order: 4, source: "DS-CMDB", look: "关联业务系统、Owner", keys: "arn, owner, business" },
      { order: 5, source: "DS-VULN", look: "公网暴露面（开放端口/桶 ACL）", keys: "arn, port, acl" },
      { order: 6, source: "DS-CLOUD (Cost)", look: "异常成本（挖矿/数据外传特征）", keys: "account, cost_spike" },
    ],
    outputs: [
      { field: "resource", desc: "{ type, arn, account, region, created_by, created_at, tags }" },
      { field: "iam", desc: "{ attached_policies[], assumable_by[] }" },
      { field: "exposure", desc: "{ public, ports[], acl_public_read?, acl_public_write? }" },
      { field: "recent_activity", desc: "top API calls 摘要" },
    ],
    triggers: [
      "B9 云 API 告警的目标 resource_id → 调用",
      "DS-CLOUD 暴露面扫描发现公开桶/端口 → 调用",
    ],
    notes: [
      "acl_public_read + 含 PII 数据 = 立即上报 P0",
      "DS-CLOUD Cost 异常（挖矿/外传）保留期短，需尽快取证",
    ],
    relatedCapabilities: [],
  },
  "A12": {
    purpose: "给定服务账户或 API Key，输出所属主体、权限范围、使用基线及泄露风险。",
    inputs: [
      { field: "key_id / access_key / service_principal_id / token_hash", required: true, desc: "凭据标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-IDP / DS-CLOUD IAM", look: "所属主体、创建时间、最近使用时间、权限范围", keys: "key_id, principal, scopes" },
      { order: 2, source: "DS-CMDB", look: "绑定应用 / Owner", keys: "key_id, app, owner" },
      { order: 3, source: "DS-CLOUD (Audit)", look: "调用频次、典型来源 IP/区域、典型 API 模式", keys: "key_id, src_ip, api" },
      { order: 4, source: "DS-CODE", look: "是否在代码仓库被泄露（Secret Scanning）", keys: "key_id" },
      { order: 5, source: "DS-TI", look: "是否在已泄露凭据库", keys: "key_id" },
      { order: 6, source: "DS-KB", look: "历史使用基线（地点/UA/API 类型）", keys: "key_id" },
    ],
    outputs: [
      { field: "identity", desc: "{ id, owner, created, last_used, scopes[] }" },
      { field: "usage_baseline", desc: "{ typical_ips[], typical_apis[], typical_hours }" },
      { field: "exposure", desc: "{ code_leak?, breach_db? }" },
    ],
    triggers: [
      "B9 云 API 异常 caller 使用 access_key → 调用",
      "DS-CODE Secret Scanning 发现密钥泄露 → 立刻调用",
    ],
    notes: [`服务账户的"无 MFA + 长期密钥 + 高权限"三件套是最危险画像。`],
    relatedCapabilities: [],
  },
  "A13": {
    purpose: "给定移动设备标识，输出设备合规状态、绑定账户及 SaaS 访问记录。",
    inputs: [
      { field: "device_id / IMEI / UDID", required: true, desc: "移动设备标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-MOBILE", look: "OS 版本、合规状态、加密、越狱/Root、Owner", keys: "device_id, compliance" },
      { order: 2, source: "DS-IDP", look: "绑定账户、登录历史", keys: "device_id, user" },
      { order: 3, source: "DS-EMAIL", look: "邮件客户端关联、ActiveSync 设备", keys: "device_id, email" },
      { order: 4, source: "DS-CASB", look: "SaaS 访问记录", keys: "device_id, app" },
    ],
    outputs: [],
    triggers: [
      "MDM 告警（越狱/不合规/丢失）→ 立刻调用",
      "IDP 检测到异常设备登录 → 调用绑定设备画像",
    ],
    notes: [
      "DS-MOBILE 保留期约 90d，设备合规状态可能滞后实际",
      "越狱设备接入企业 SaaS 应立即触发 F8 隔离建议",
    ],
    relatedCapabilities: [],
  },
  "A14": {
    purpose: "给定数据库账户或对象，输出权限、典型查询模式及敏感分级。",
    inputs: [
      { field: "db_instance, db_account", required: false, desc: "数据库实例与账户" },
      { field: "db_instance, schema.table", required: false, desc: "数据库实例与表对象" },
    ],
    dataQueries: [
      { order: 1, source: "DS-DAM", look: "账户权限、典型查询模式、历史访问 IP/应用", keys: "db_account, db_instance" },
      { order: 2, source: "DS-CMDB", look: "数据库实例 Owner、业务系统、数据敏感分级", keys: "db_instance, sensitivity" },
      { order: 3, source: "DS-DAM", look: "对象的访问频率基线、典型访问者", keys: "schema_table, access_count" },
      { order: 4, source: "DS-DLP", look: "是否含已识别敏感数据", keys: "schema_table, dlp_label" },
    ],
    outputs: [],
    triggers: [
      "B10 数据访问告警命中数据库对象 → 调用",
      "DAM 检测到异常 SQL 查询 → 调用涉及表/账户画像",
    ],
    notes: [
      "敏感分级（PII/SECRET）来自 DS-CMDB+DS-DLP，两者均缺时降级判定",
      "DS-DAM 保留期 90-180d，超期历史行为基线不可用",
    ],
    relatedCapabilities: [],
  },
  "B1": {
    purpose: "调查指定主体、主机或源 IP 的登录活动，检测异常模式。",
    inputs: [
      { field: "principal", required: false, desc: "账户标识" },
      { field: "host, time_window", required: false, desc: "主机与时间窗口" },
      { field: "source_ip", required: false, desc: "源 IP" },
    ],
    dataQueries: [
      { order: 1, source: "DS-IDP", look: "登录事件（成功/失败）、登录方式（密码/MFA/SSO/PassKey）、源 IP、UA、设备", keys: "principal, src_ip, ts" },
      { order: 2, source: "DS-VPN", look: "VPN 接入会话", keys: "principal, session_ip" },
      { order: 3, source: "DS-CLOUD", look: "云控制台登录、Console Sign-in 事件", keys: "principal, event" },
      { order: 4, source: "DS-PAM", look: "堡垒机登录", keys: "principal, session" },
      { order: 5, source: "DS-CASB", look: "SaaS 登录", keys: "principal, app" },
      { order: 6, source: "DS-EDR", look: "终端本地登录（Windows EventID 4624/4625/4634/4648）", keys: "host, event_id" },
      { order: 7, source: "地理位置库", look: "源 IP 地理位置、不可能旅行计算", keys: "src_ip, geo" },
    ],
    outputs: [
      { field: "events", desc: "[ { ts, type, result, src_ip, ua, device, geo, mfa_used } ]" },
      { field: "summary", desc: "{ success, failure, distinct_src_ips, distinct_geos, mfa_pass_rate }" },
      { field: "anomalies", desc: "[ impossible_travel | new_geo | new_device | brute_force_pattern | mfa_fatigue ]" },
    ],
    triggers: ["账户安全告警、暴破、异地登录、MFA 疲劳攻击。"],
    notes: [
      "DS-IDP 保留期 90-365d，超期无法回溯历史登录模式",
      "mfa_fatigue 告警需同时检查同 IP 的 push 频次",
    ],
    relatedCapabilities: [],
  },
  "B2": {
    purpose: "调查指定主体或资源的权限变更事件，识别未授权提权操作。",
    inputs: [
      { field: "principal", required: false, desc: "账户标识" },
      { field: "resource, time_window", required: false, desc: "资源与时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-IDP", look: "组成员变更、角色赋予、特别是高权限组（Domain Admins 等）", keys: "principal, group, ts" },
      { order: 2, source: "DS-CLOUD (IAM)", look: "IAM 策略变更、AssumeRole、CreateAccessKey", keys: "principal, action, resource" },
      { order: 3, source: "DS-PAM", look: "特权角色申领、紧急授权", keys: "principal, role" },
      { order: 4, source: "DS-TICKET", look: "是否有对应的授权变更工单", keys: "principal, ticket_id" },
      { order: 5, source: "DS-EDR", look: "本地用户/组变更（NetUserAdd / 添加到本地管理员组）", keys: "host, event_id, user" },
    ],
    outputs: [
      { field: "changes", desc: "[ { ts, actor, target_principal, change_type, before, after, source_ip } ]" },
      { field: "unauthorized_changes", desc: "无对应工单的变更" },
      { field: "high_risk_changes", desc: "提权到高敏感组的变更" },
    ],
    triggers: [
      "IDP 高权限组变更告警 / CloudTrail IAM 变更事件 → 调用",
      "B16 凭据访问后怀疑提权 → 调用验证是否新增组成员",
    ],
    notes: [
      "无对应工单的提权变更是强 TP 信号，优先级应自动提升",
      "Domain Admins / Global Admins 变更必须触发 G8 升级",
    ],
    relatedCapabilities: [],
  },
  "B3": {
    purpose: "调查指定主机或进程的执行活动，还原进程树并识别可疑行为。",
    inputs: [
      { field: "host, time_window", required: false, desc: "主机与时间窗口" },
      { field: "process_guid", required: false, desc: "进程全局唯一标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "进程树（父子链）、命令行、镜像 Hash、签名、用户上下文", keys: "host, process_guid, cmdline" },
      { order: 2, source: "DS-EDR (Sysmon/审计)", look: "EventID 1/3/7/10/11/22（进程/网络/模块/句柄/文件/DNS）", keys: "host, event_id" },
      { order: 3, source: "DS-EDR", look: "AppLocker/WDAC 拦截/允许记录", keys: "host, policy_action" },
      { order: 4, source: "命令行解析", look: "base64 / PowerShell -enc / LOLBin / mshta / regsvr32 模式", keys: "cmdline" },
      { order: 5, source: "路径策略", look: "可疑路径执行（%TEMP%、Recycle Bin、UNC 路径）", keys: "image_path" },
      { order: 6, source: "DS-TI", look: "镜像 Hash 信誉 → A7", keys: "hash" },
      { order: 7, source: "DS-EDR", look: "内存注入/反射加载/空进程检测", keys: "process_guid, injection" },
    ],
    outputs: [
      { field: "进程树", desc: "每节点含 benign/suspicious/malicious 判定 + 原因 + ATT&CK ID" },
      { field: "IOC 列表", desc: "从进程树中提取的 IOC" },
    ],
    triggers: ["EDR 检测、横向移动假设（找 psexec/wmic/winrm）、持久化假设（找 schtasks/regsvr32）。"],
    notes: [
      "DS-EDR 保留期 30-90d，超期进程树不可还原，尽早取证",
      "AppLocker 拦截记录可证明攻击尝试但未成功，不要忽略",
    ],
    relatedCapabilities: [],
  },
  "B4": {
    purpose: "调查指定主机、IP 对或进程的网络连接，识别外联异常和信标行为。",
    inputs: [
      { field: "host, time_window", required: false, desc: "主机与时间窗口" },
      { field: "src_ip, dst_ip, time_window", required: false, desc: "IP 对与时间窗口" },
      { field: "process_guid", required: false, desc: "进程全局唯一标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "进程级出向/入向连接（带 PID 关联）", keys: "process_guid, dst_ip, port" },
      { order: 2, source: "DS-FW / DS-NDR", look: "五元组流、会话时长、字节数", keys: "src_ip, dst_ip, proto, port, bytes" },
      { order: 3, source: "DS-PROXY", look: "HTTP/HTTPS 出向（URL、UA、Referer、SSL SNI）", keys: "src_ip, url, sni, ua" },
      { order: 4, source: "DS-NDR", look: "协议异常（端口与协议不匹配、ICMP 隧道、DNS 隧道）", keys: "proto, port, anomaly" },
      { order: 5, source: "JA3/JA3S 库", look: "TLS 指纹比对 C2 已知", keys: "ja3, ja3s" },
      { order: 6, source: "信标行为分析", look: "周期性连接（Beacon 检测）", keys: "dst_ip, interval, jitter" },
    ],
    outputs: [
      { field: "connections", desc: "[ { ts, src, dst, proto, port, bytes_in, bytes_out, duration, sni, ua, ja3 } ]" },
      { field: "top_destinations", desc: "聚合排序" },
      { field: "external_summary", desc: "{ unique_external_ips, unique_external_domains }" },
      { field: "anomalies", desc: "[ beacon_detected | port_mismatch | tunnel_indicator | new_external_peer ]" },
    ],
    triggers: [
      "C2 外联告警 / 可疑域名连接 / EDR 进程异常外联 → 调用",
      "B3 发现可疑进程且有网络连接 → 以 process_guid 调用",
    ],
    notes: [
      "Beacon 检测需至少 5 个周期样本，时间窗 < 30min 可能漏判",
      "DS-FW 保留期仅 7-30d，C2 信标需及时取证",
    ],
    relatedCapabilities: [],
  },
  "B5": {
    purpose: "调查指定主机或用户的 DNS 查询历史，检测 DGA 和 DNS 隧道。",
    inputs: [
      { field: "host|user, time_window", required: false, desc: "主机或用户与时间窗口" },
      { field: "domain", required: false, desc: "特定域名" },
    ],
    dataQueries: [
      { order: 1, source: "DS-DNS", look: "该主机/用户的查询历史、查询频次", keys: "host, domain, count" },
      { order: 2, source: "DS-NDR", look: "53 端口流量 / DoH/DoT 检测", keys: "host, port, proto" },
      { order: 3, source: "域名熵分析", look: "DGA 检测（高熵子域名）", keys: "domain, entropy" },
      { order: 4, source: "子域长度/字符", look: "DNS 隧道检测（超长 TXT/A 记录）", keys: "subdomain, length" },
      { order: 5, source: "DS-TI", look: "查询过的域名信誉", keys: "domain" },
    ],
    outputs: [
      { field: "queries", desc: "按域名聚合次数、首次/最近时间" },
      { field: "anomalies", desc: "[ dga_pattern | tunnel_pattern | doh_bypass | newly_observed_domain ]" },
    ],
    triggers: [
      "NDR DNS 异常告警 / 主机出现大量高熵子域名查询 → 调用",
      "B4 发现 DNS 隧道指标 → 以 host 调用确认",
    ],
    notes: [
      "DS-DNS 保留期 30-90d，DGA 追溯窗口有限",
      "DoH/DoT 绕过内部 DNS 会造成盲区，需 NDR 协议检测补充",
    ],
    relatedCapabilities: [],
  },
  "B6": {
    purpose: "调查指定主机、路径或进程的文件操作事件，检测勒索加密和持久化路径写入。",
    inputs: [
      { field: "host, time_window", required: false, desc: "主机与时间窗口" },
      { field: "path, time_window", required: false, desc: "路径与时间窗口" },
      { field: "process_guid", required: false, desc: "进程全局唯一标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "文件创建/修改/删除/重命名事件（含 PID/用户）", keys: "host, path, process_guid, ts" },
      { order: 2, source: "DS-FILE", look: "网络共享/NAS 文件审计", keys: "path, user, op" },
      { order: 3, source: "DS-CLOUD (Object Storage Audit)", look: "S3/OSS/Blob 的对象操作", keys: "bucket, key, op" },
      { order: 4, source: "加密熵检测", look: "短时间大量高熵改写（勒索特征）", keys: "path, entropy, count" },
      { order: 5, source: "关键路径监控", look: "启动项、计划任务目录、注册表持久化键", keys: "path" },
    ],
    outputs: [
      { field: "events", desc: "[ { ts, op, path, process, user, src_ip? } ]" },
      { field: "anomalies", desc: "[ mass_encrypt | persistence_path_write | sensitive_file_read ]" },
    ],
    triggers: [
      "EDR 勒索/加密行为告警 → 立刻调用检测 mass_encrypt",
      "B3 发现写入启动项/计划任务路径的进程 → 调用",
    ],
    notes: [
      "mass_encrypt 需短时间窗（5-10min）高频采样，窗口太大会淹没信号",
      "DS-CLOUD Object Storage 审计保留期较短，需尽快拉取",
    ],
    relatedCapabilities: [],
  },
  "B7": {
    purpose: "调查指定主机的注册表和系统配置变更，识别持久化技术。",
    inputs: [
      { field: "host, time_window", required: true, desc: "主机与时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "注册表 Run/RunOnce、Services、Image File Execution Options、AppInit_DLLs", keys: "host, reg_key, ts" },
      { order: 2, source: "DS-EDR", look: "启动项、计划任务、WMI 订阅、BITS 作业", keys: "host, task_name, ts" },
      { order: 3, source: "系统审计（Linux）", look: "crontab、systemd、/etc/rc.local、~/.bashrc、SSH authorized_keys", keys: "host, path, user" },
      { order: 4, source: "DS-EDR", look: "安全配置变更（防火墙规则、安全策略、UAC）", keys: "host, config_key, ts" },
      { order: 5, source: "macOS", look: "LaunchAgents/LaunchDaemons、Login Items", keys: "host, plist_path" },
    ],
    outputs: [
      { field: "变更事件", desc: "变更列表" },
      { field: "persistence_hits", desc: "命中已知持久化技术（MITRE T1547 系列）" },
    ],
    triggers: [
      "EDR 注册表/启动项变更告警 → 调用",
      "B15 持久化点变更的细化查询 → 调用",
    ],
    notes: [
      "WMI Event Subscription 是无文件持久化盲点，须专项检测",
      "Linux authorized_keys 变更在 DS-EDR 覆盖不完整时易漏",
    ],
    relatedCapabilities: [],
  },
  "B8": {
    purpose: "调查指定邮箱或邮件消息的收发活动，检测钓鱼、转发规则和批量发送。",
    inputs: [
      { field: "mailbox|address, time_window", required: false, desc: "邮箱或地址与时间窗口" },
      { field: "message_id", required: false, desc: "邮件唯一 ID" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EMAIL", look: "收发记录、附件、链接、Subject、Header（含 Received 链）", keys: "message_id, sender, recipients" },
      { order: 2, source: "DS-EMAIL", look: "SPF/DKIM/DMARC 结果", keys: "message_id, auth_result" },
      { order: 3, source: "DS-EMAIL", look: "邮件规则变更（外发转发、自动删除）", keys: "mailbox, rule_type" },
      { order: 4, source: "DS-EMAIL", look: "群发模式（同时收件人数、相似主题）", keys: "subject, recipients_count" },
      { order: 5, source: "附件 → A7", look: "附件 Hash 画像", keys: "attachment_hash" },
      { order: 6, source: "链接 → A6", look: "URL 画像与沙箱", keys: "url" },
      { order: 7, source: "DS-EMAIL", look: "用户点击/打开 telemetry（如有）", keys: "message_id, user_action" },
    ],
    outputs: [
      { field: "messages", desc: "[ { ts, sender, recipients, subject, attachments[], links[], auth_results } ]" },
      { field: "forwarding_rules_changes", desc: "关键：邮件转发规则变更" },
      { field: "mass_send_indicator", desc: "批量发送特征" },
      { field: "phishing_signals", desc: "{ lookalike_sender, suspicious_link, urgency_keywords, ... }" },
    ],
    triggers: [
      "邮件网关钓鱼告警 / A1 检出 external_forwarding → 调用",
      "用户举报可疑邮件 / message_id 已知 → 调用",
    ],
    notes: [
      "DS-EMAIL 保留期 90-365d，邮件规则变更历史须重点留存",
      "forwarding_rules_changes 是 BEC 持久化核心证据，必须单独标注",
    ],
    relatedCapabilities: [],
  },
  "B9": {
    purpose: "调查指定主体或资源的云控制面 API 调用，识别异常访问模式。",
    inputs: [
      { field: "principal|access_key, time_window", required: false, desc: "主体或访问密钥与时间窗口" },
      { field: "resource, time_window", required: false, desc: "资源与时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-CLOUD (Audit)", look: "全部 API 调用：EventName、Source IP、UA、Region、Error", keys: "principal, event_name, src_ip" },
      { order: 2, source: "DS-CLOUD (Audit)", look: "是否使用 AssumeRole 链（角色跳跃）", keys: "principal, role_chain" },
      { order: 3, source: "基线 → D", look: "历史 API 模式、典型来源 IP/区域", keys: "principal, baseline" },
      { order: 4, source: "敏感 API 清单", look: "CreateUser/AttachUserPolicy/PutBucketAcl/Get-Secret 等", keys: "event_name" },
      { order: 5, source: "DS-TI", look: "来源 IP 信誉", keys: "src_ip" },
    ],
    outputs: [
      { field: "events", desc: "按 API 聚合" },
      { field: "sensitive_calls", desc: "高敏感 API 命中" },
      { field: "anomalies", desc: "[ new_region | new_ua | new_src_ip | role_chain_unusual | enumeration_burst ]" },
    ],
    triggers: [
      "云控制台异常 API 告警 / A12 服务账户疑似泄露 → 调用",
      "CloudTrail 出现 CreateUser/PutBucketAcl 等敏感 API → 调用",
    ],
    notes: [
      "AssumeRole 链超过 2 跳是强异常信号",
      "DS-CLOUD Audit 保留期 90-365d，跨区域操作需额外关注",
    ],
    relatedCapabilities: [],
  },
  "B10": {
    purpose: "调查指定主体或数据对象的数据访问行为，检测大量查询和外传。",
    inputs: [
      { field: "principal|object, time_window", required: true, desc: "主体或对象与时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-DAM", look: "SQL 流水：SELECT 行数、表、Where、应用名", keys: "principal, table, row_count" },
      { order: 2, source: "DS-DLP", look: "敏感数据流出事件（邮件/USB/HTTP/IM）", keys: "principal, channel, data_label" },
      { order: 3, source: "DS-CASB", look: "SaaS 下载量（OneDrive/Google Drive/飞书云文档）", keys: "principal, app, bytes" },
      { order: 4, source: "DS-FILE", look: "文件服务器大批量下载", keys: "principal, path, count" },
      { order: 5, source: "DS-CLOUD (S3/OSS Audit)", look: "对象读取量、List 操作激增", keys: "principal, bucket, op_count" },
      { order: 6, source: "DS-PROXY", look: "大量上传到外部存储（pastebin / wetransfer / 网盘）", keys: "principal, dst_url, bytes_out" },
    ],
    outputs: [
      { field: "volume", desc: "{ rows, files, bytes } per channel" },
      { field: "sensitive_hits", desc: "DLP 命中详情" },
      { field: "anomalies", desc: "[ mass_select | mass_download | external_upload_spike ]" },
    ],
    triggers: [
      "DLP 告警 / DAM 异常 SQL / CASB 大量下载 → 调用",
      "离职员工调查需全渠道核查数据外传 → 调用",
    ],
    notes: [
      "外传渠道多路并发（邮件+USB+云盘），需同时触发 B8/B11/B13",
      "DS-DLP 保留期 90d，超期无法还原外传详情",
    ],
    relatedCapabilities: [],
  },
  "B11": {
    purpose: "调查指定主机的 USB 和可移动介质使用情况，检测数据写入事件。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "USB 插拔事件、设备 VID/PID、序列号", keys: "host, device_sn, ts" },
      { order: 2, source: "DS-DLP", look: "USB 数据写入告警", keys: "host, path, bytes" },
      { order: 3, source: "DS-EDR", look: "从 USB 启动的进程", keys: "host, image_path" },
    ],
    outputs: [],
    triggers: [
      "DLP USB 写入告警 / 离职员工调查 → 调用",
      "B10 检测到数据外传，需排查 USB 渠道 → 调用",
    ],
    notes: [
      "USB VID/PID+序列号可关联设备历史使用记录",
      "从 USB 启动的进程是固件攻击/BadUSB 的关键证据",
    ],
    relatedCapabilities: [],
  },
  "B12": {
    purpose: "调查指定用户的浏览器活动，追踪访问历史、下载文件及 OAuth 授权。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-PROXY", look: "完整 URL 历史", keys: "user, url, ts" },
      { order: 2, source: "DS-EDR", look: "浏览器进程下载文件、扩展安装", keys: "host, process, file_path" },
      { order: 3, source: "DS-EDR", look: "浏览器凭据存储访问（LSASS 类同等）", keys: "host, process_guid" },
      { order: 4, source: "DS-CASB", look: "OAuth 授权（第三方应用接入企业账户）", keys: "user, app_id, scope" },
    ],
    outputs: [],
    triggers: [
      "钓鱼告警追踪受害者是否点击链接 → 以 user+时间窗调用",
      "OAuth 滥用排查 / B10 发现 CASB 大量下载 → 调用",
    ],
    notes: [
      "浏览器凭据库访问（DS-EDR）与 LSASS 访问同等级别威胁",
      "DS-PROXY 保留期 30-90d，点击事件需及时取证",
    ],
    relatedCapabilities: [],
  },
  "B13": {
    purpose: "调查指定用户的 SaaS 和 OAuth 授权情况，识别异常应用授权。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP", look: "OAuth 授权事件、Application Consent", keys: "user, app_id, scope" },
      { order: 2, source: "DS-CASB", look: "SaaS API 调用", keys: "user, app, api_call" },
      { order: 3, source: "DS-IDP", look: "异常 OAuth 应用（新创建、罕见、权限过大）", keys: "app_id, created, permission" },
    ],
    outputs: [],
    triggers: [
      "IDP OAuth 异常授权告警 / BEC 调查需排查持久化手段 → 调用",
      "B12 发现 CASB OAuth 授权新应用 → 调用确认权限范围",
    ],
    notes: ["恶意 OAuth 应用授权是 BEC 持久化新型手段（无需密码、绕过 MFA）。"],
    relatedCapabilities: [],
  },
  "B14": {
    purpose: "调查指定集群或容器的 Kubernetes 活动，检测异常 exec、镜像和容器内行为。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "K8s Audit Log (DS-CLOUD/自研)", look: "Pod 创建、exec、port-forward、ServiceAccount 变更", keys: "cluster, namespace, pod" },
      { order: 2, source: "容器镜像仓库审计", look: "拉取/推送、镜像签名", keys: "image, digest, user" },
      { order: 3, source: "DS-EDR (容器化)", look: "容器内进程/网络", keys: "container_id, process" },
      { order: 4, source: "镜像扫描 (DS-VULN)", look: "镜像 CVE / 恶意层", keys: "image, cve_id" },
    ],
    outputs: [],
    triggers: [
      "K8s Audit 告警（异常 exec/port-forward）→ 调用",
      "容器逃逸 EDR 告警 → 调用定位容器内行为",
    ],
    notes: [
      "容器内进程/网络覆盖依赖 DS-EDR 容器化探针，未部署则盲区大",
      "镜像签名缺失或 CVE 严重时应阻断 Pod 启动而非仅告警",
    ],
    relatedCapabilities: [],
  },
  "B15": {
    purpose: `B7 的"已知持久化技术"特化视图，覆盖 ATT&CK Persistence (TA0003)。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "服务安装、计划任务、Run 键、Logon 脚本、AppInit_DLLs", keys: "host, key, ts" },
      { order: 2, source: "DS-EDR", look: "WMI Event Subscription", keys: "host, wmi_filter, consumer" },
      { order: 3, source: "DS-EDR", look: "BITS Job", keys: "host, job_name" },
      { order: 4, source: "DS-EDR", look: "DLL Search Order Hijack 候选", keys: "host, dll_path" },
      { order: 5, source: "DS-IDP", look: "Logon Script / Group Policy 修改", keys: "gpo_name, change_ts" },
      { order: 6, source: "DS-EMAIL", look: "邮件规则、外发转发", keys: "mailbox, rule_type" },
      { order: 7, source: "Linux/macOS", look: "crontab、systemd、launchd、authorized_keys、shell rc", keys: "host, path" },
    ],
    outputs: [],
    triggers: [
      "EDR 持久化告警 / B17 防御规避后追查是否留后门 → 调用",
      "横向移动调查确认驻留前的持久化动作 → 调用",
    ],
    notes: [
      "WMI 订阅和 BITS 作业是无文件持久化，DS-EDR 需专项规则覆盖",
      "邮件转发规则（DS-EMAIL）是 BEC 持久化必查点，不要漏",
    ],
    relatedCapabilities: ["B7"],
  },
  "B16": {
    purpose: "调查指定主机的凭据访问行为，检测 LSASS、SAM dump、Kerberoasting 等手段。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "LSASS 访问（特别是非系统进程）", keys: "host, process_guid, target_pid" },
      { order: 2, source: "DS-EDR", look: "SAM/SECURITY/SYSTEM 注册表导出", keys: "host, reg_key, process_guid" },
      { order: 3, source: "DS-EDR", look: "NTDS.dit / shadow 访问", keys: "host, path" },
      { order: 4, source: "DS-EDR", look: "Mimikatz / ProcDump / comsvcs.dll 特征", keys: "host, cmdline, hash" },
      { order: 5, source: "DS-EDR", look: "浏览器凭据库访问、Keychain 访问", keys: "host, process_guid" },
      { order: 6, source: "DS-EDR", look: "Kerberoasting / AS-REP Roasting 特征", keys: "host, spn, event_id" },
      { order: 7, source: "DS-IDP", look: "Golden/Silver Ticket 异常（KRBTGT 使用、TGT 异常生命周期）", keys: "principal, tgt_lifetime, event_id" },
    ],
    outputs: [],
    triggers: [
      "EDR 检测到 LSASS 访问 / Mimikatz 特征 / Kerberoasting → 立刻调用",
      "横向移动调查前置步骤，找凭据来源 → 调用",
    ],
    notes: [
      "LSASS 访问者非系统进程即高危，需立即下钻 A8",
      "Golden Ticket 需重置 KRBTGT 两次才能完全失效",
    ],
    relatedCapabilities: [],
  },
  "B17": {
    purpose: "调查指定主机的防御规避行为，检测日志清除、AV/EDR 停止及安全配置修改。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-EDR / DS-SIEM", look: "日志清除事件（EventID 1102/104）", keys: "host, event_id, ts" },
      { order: 2, source: "DS-AV / DS-EDR", look: "AV/EDR 服务停止、卸载、驱动卸载", keys: "host, service, action" },
      { order: 3, source: "DS-EDR", look: "Defender 排除项添加、AMSI Bypass 模式", keys: "host, exclusion_path, cmdline" },
      { order: 4, source: "DS-FW / DS-EDR", look: "安全策略关闭、防火墙规则放通", keys: "host, policy_change" },
      { order: 5, source: "DS-EDR", look: "时间戳篡改 (Timestomp)、文件隐藏", keys: "host, file_path, ts_before, ts_after" },
    ],
    outputs: [],
    triggers: [
      "EDR/AV 自身被关停告警 / 日志清除事件 1102 → 立刻调用",
      "任何告警前置时段出现防御规避行为 → 调用",
    ],
    notes: [
      "防御规避是 TP 强信号，出现即应触发 G8 升级评估",
      "Timestomp 篡改会破坏时间线重建，需用多源时间戳交叉验证",
    ],
    relatedCapabilities: [],
  },
  "C1": {
    purpose: "给定一个锚点事件，找出 ±N 时间窗内与之相关的事件（同主机/同用户/同 IP/同进程链）。",
    inputs: [
      { field: "anchor_event", required: true, desc: "锚点事件" },
      { field: "window", required: true, desc: "时间窗口" },
      { field: "pivot_keys[]", required: false, desc: "关联键，默认 host, user, ip" },
    ],
    dataQueries: [
      { order: 1, source: "DS-SIEM", look: "全文 + 字段聚合查询，按 pivot key 关联", keys: "host, user, ip, ts" },
      { order: 2, source: "DS-EDR", look: "同主机时间窗事件", keys: "host, ts" },
      { order: 3, source: "DS-NDR", look: "同会话/同对端时间窗事件", keys: "session, peer, ts" },
      { order: 4, source: "多告警库 (DS-KB)", look: "同时间窗其他告警", keys: "ts, host, user" },
    ],
    outputs: [
      { field: "related_events", desc: "相关事件按时间排序的列表 + pivot key 分组聚合" },
    ],
    triggers: [
      "任何告警需要扩展上下文、找关联线索 → 以告警 ts±window 调用",
      "F6 时间线重建的底层原语，调查中后期必调用",
    ],
    notes: [
      "pivot_keys 选择影响噪声量，优先用 process_guid > host > user > ip",
      "DS-SIEM 全文检索延迟较高，窗口宽度建议不超过 1h",
    ],
    relatedCapabilities: [],
  },
  "C2": {
    purpose: "从一个核心实体出发，扩展 N-hop 邻居图（user↔host↔ip↔process↔file↔domain）。",
    inputs: [
      { field: "seed_entity", required: true, desc: "核心实体" },
      { field: "depth", required: false, desc: "扩展深度，默认 2" },
      { field: "edge_types[]", required: false, desc: "边类型过滤" },
    ],
    dataQueries: [
      { order: 1, source: "DS-IDP", look: "user → group, user → host (logon)", keys: "user, group, host" },
      { order: 2, source: "DS-CMDB", look: "user ↔ host (owner), host ↔ business", keys: "user, host, business" },
      { order: 3, source: "DS-EDR", look: "host → process → file/hash, host → ip", keys: "host, process, file, ip" },
      { order: 4, source: "DS-IPAM", look: "ip ↔ host (时间窗)", keys: "ip, host, ts" },
      { order: 5, source: "DS-DNS", look: "host → domain → ip", keys: "host, domain, ip" },
      { order: 6, source: "DS-EMAIL", look: "user → email_address → external_email", keys: "user, email, external" },
    ],
    outputs: [
      { field: "nodes + edges", desc: "每条边含证据 ref" },
    ],
    triggers: [
      "已锁定核心实体，需评估爆炸半径 / 扩展关联实体 → 调用",
      "F2 影响评估前置，需要完整实体图 → 调用",
    ],
    notes: [
      "depth > 3 时图节点数可能爆炸，建议限制 edge_types 过滤",
      "跨数据源 join 时延较高，建议异步并行拉取各源后合并",
    ],
    relatedCapabilities: [],
  },
  "C3": {
    purpose: "给定进程，向上回溯到 root 并向下展开所有子孙，输出完整进程血缘树。",
    inputs: [
      { field: "process_guid", required: true, desc: "进程全局唯一标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "向上回溯到 root/wininit/systemd；向下展开所有子孙", keys: "process_guid, ppid, pid" },
    ],
    outputs: [
      { field: "lineage_tree", desc: "完整 lineage tree" },
    ],
    triggers: [
      "B3/A8 发现高 suspicion 进程，需还原完整血缘 → 调用",
      "需定位初始入口点（root 进程）→ 调用",
    ],
    notes: [
      "DS-EDR 进程树保留期 30-90d，超期无法回溯根节点",
      "root 进程通常是初始 access vector（文档/脚本/服务），是关键证据",
    ],
    relatedCapabilities: [],
  },
  "C4": {
    purpose: "基于已收集的所有证据，定位攻击在 Lockheed Kill-Chain 与 MITRE ATT&CK 中的阶段。",
    inputs: [
      { field: "evidence_set[]", required: true, desc: "证据集合" },
    ],
    dataQueries: [
      { order: 1, source: "MITRE ATT&CK 知识库", look: "TTP 映射、Tactic 分类", keys: "technique_id, tactic" },
      { order: 2, source: "已收集证据", look: "命令行/工具/行为 → TTP 推断", keys: "cmdline, behavior" },
      { order: 3, source: "DS-KB", look: "类似 TTP 组合的历史攻击家族", keys: "ttp_set, family" },
    ],
    outputs: [
      { field: "kill_chain_phases", desc: "Kill-chain 阶段列表" },
      { field: "mitre_ttps", desc: "MITRE ATT&CK TTP 列表" },
      { field: "attribution_hint", desc: "疑似攻击家族" },
    ],
    triggers: [
      "证据收集完成，需定位 Kill-chain 阶段 → 调用",
      "F3 攻击阶段总结的底层依赖 → 调用",
    ],
    notes: [
      "TTP 映射置信度受证据完整性影响，partial 时需标注缺口阶段",
      "单一 TTP 不足以定阶段，需至少 2 个相互印证的证据",
    ],
    relatedCapabilities: [],
  },
  "C5": {
    purpose: `还原"从哪台机器走到了哪台机器"，输出横向移动路径图。`,
    inputs: [
      { field: "seed_host", required: true, desc: "种子主机" },
      { field: "direction", required: true, desc: "forward|backward|both" },
      { field: "time_window", required: true, desc: "时间窗口" },
    ],
    dataQueries: [
      { order: 1, source: "DS-IDP", look: "Logon EventID 4624 Type 3 (Network) / 10 (RDP) / 7 (Unlock)", keys: "host, principal, event_id, ts" },
      { order: 2, source: "DS-EDR", look: "psexec / WMI / WinRM / SSH / SMB 调用", keys: "host, cmdline, dst_host" },
      { order: 3, source: "DS-EDR", look: "凭据派生：使用同一账户在多机登录", keys: "principal, host, ts" },
      { order: 4, source: "DS-NDR", look: "RDP/SMB/WinRM/SSH 横向会话", keys: "src_ip, dst_ip, proto, port" },
      { order: 5, source: "DS-IDP", look: "Pass-the-Hash / Overpass-the-Hash 特征（NTLM 异常）", keys: "principal, ntlm_event, ts" },
    ],
    outputs: [
      { field: "movement_path", desc: "移动路径图 + 每跳证据" },
    ],
    triggers: [
      "EDR/IDP 异常远程登录 / B16 凭据访问命中 → 调用",
      "已确认 TP 后评估扩散范围 → 以 seed_host 双向调用",
    ],
    notes: [
      "Pass-the-Hash 特征依赖 DS-IDP NTLM 事件，Kerberos 环境覆盖弱",
      "每跳需关联凭据来源，避免误判正常管理员批量登录",
    ],
    relatedCapabilities: [],
  },
  "C6": {
    purpose: `识别"一个实体辐射到多个"或"多个实体汇聚到一个"的异常模式。`,
    inputs: [
      { field: "pivot_entity", required: true, desc: "pivot 实体" },
      { field: "direction", required: true, desc: "fanout|fanin" },
      { field: "threshold", required: false, desc: "触发阈值" },
    ],
    dataQueries: [
      { order: 1, source: "DS-SIEM/DS-NDR/DS-IDP", look: "按 pivot 聚合计数", keys: "pivot, target, count" },
    ],
    outputs: [],
    triggers: [
      "暴破/凭据填充告警，单 IP → 多账户或多 IP → 单账户 → 调用",
      "C2 告警疑似多主机汇聚同一外部 IP → 以 fanin 调用",
    ],
    notes: [
      "threshold 需根据环境正常基线校准，避免批量管理操作误报",
      "fanout 模式（1 源→N 目标）是扫描/暴破特征；fanin（N 源→1 目标）是 C2 汇聚特征",
    ],
    relatedCapabilities: [],
  },
  "C7": {
    purpose: `基于 IOC/TTP/Source，聚合"同一波攻击"的事件。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-KB / DS-SIEM", look: "按 IOC 集合检索", keys: "ioc, alert_id, ts" },
    ],
    outputs: [],
    triggers: [
      "F4 IOC 提取后，回查同套 IOC 是否历史多次出现 → 调用",
      "高严重性事件需判断是否同一持续攻击活动 → 调用",
    ],
    notes: [
      "IOC 集合相似度匹配需注意 TI 老化：90d+ 的 IOC 重用率低",
      "同源聚合结果可直接输入 E9 APT 归因",
    ],
    relatedCapabilities: [],
  },
  "C8": {
    purpose: "将 EDR / NDR / IdP / Cloud 事件按时间戳与共享 key 拼接成一条完整故事。",
    inputs: [
      { field: "time_window", required: true, desc: "时间窗口" },
      { field: "join_keys[]", required: false, desc: "默认 [user, host, ip, process]" },
    ],
    dataQueries: [],
    outputs: [
      { field: "归一化时间线", desc: "同一秒内事件按数据源排序" },
    ],
    triggers: [
      "F6 时间线重建需要跨源拼接 → 调用",
      "调查报告生成前，需要统一多源时间戳 → 调用",
    ],
    notes: ["时钟漂移是常见坑，能力应主动补偿（±N 秒模糊匹配）。"],
    relatedCapabilities: [],
  },
  "C9": {
    purpose: `基于已知 IOC/TTP，找出"还有谁也被打了"。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-EDR", look: "同 Hash 出现的所有主机", keys: "hash, host" },
      { order: 2, source: "DS-NDR / DS-PROXY", look: "访问过同一恶意域/IP 的所有主机", keys: "domain, ip, host" },
      { order: 3, source: "DS-EMAIL", look: "收到同模板钓鱼邮件的所有员工", keys: "subject_pattern, recipient" },
      { order: 4, source: "DS-IDP", look: "同源 IP 登录尝试过的所有账户", keys: "src_ip, principal" },
    ],
    outputs: [],
    triggers: [
      "F4 IOC 提取后，扩展受影响范围 → 调用",
      "钓鱼/挖矿/勒索告警确认 TP 后，批量处置前 → 调用",
    ],
    notes: [
      "DS-EMAIL 受害者扩展依赖主题模式匹配，需防止过宽匹配产生误报",
      "同源 IP 登录扩展时需排除合法 NAT/VPN 出口 IP",
    ],
    relatedCapabilities: [],
  },
  "C10": {
    purpose: `基于图算法识别"罕见但有效"的连接路径（如财务账户通过 jump host 访问研发代码库）。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP / DS-CMDB", look: "构建访问图，与历史 30/90 天基线对比", keys: "user, host, resource, ts" },
    ],
    outputs: [],
    triggers: [
      "敏感资产被陌生来源主体访问（特别是跨业务线） → 调用",
      "内部威胁假设需要验证「能力 + 访问路径」组合是否离群 → 调用",
    ],
    notes: [
      "需要 30/90 天历史访问图作为基线，前置数据保留期不足时不可用",
      "图算法依赖 DS-IDP 会话与 DS-CMDB Owner 关系完整，缺一会断链或误报",
    ],
    relatedCapabilities: [],
  },
  "D1": {
    purpose: `回答"这台资产对业务多重要、出问题影响多大"。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-CMDB", look: "业务系统、所属业务线、重要性等级（C/B/A/S）、SLA", keys: "asset_id, business_unit, criticality, sla" },
      { order: 2, source: "DS-CMDB", look: "上下游依赖关系、影响半径估算", keys: "asset_id, depends_on, dependents" },
      { order: 3, source: "DS-TICKET", look: "当前是否在维护窗、有无关联变更", keys: "asset_id, maintenance_window" },
    ],
    outputs: [
      { field: "business_unit", desc: "所属业务线" },
      { field: "criticality", desc: "重要性等级" },
      { field: "sla", desc: "SLA 要求" },
      { field: "dependencies[]", desc: "上下游依赖" },
      { field: "in_maintenance", desc: "是否在维护窗" },
    ],
    triggers: [
      "A2/A3 主机画像之后，F2/F8 决策前需评估业务影响 → 调用",
      "处置前确认是否 critical 资产、是否在维护窗 → 调用",
    ],
    notes: [
      "CMDB 资产重要性字段不准时，上层应降级判定并标注 partial",
      "in_maintenance=true 不等于 BP，仍需调查（防假借维护攻击）",
    ],
    relatedCapabilities: [],
  },
  "D2": {
    purpose: `回答"这个用户是谁、当前状态如何"，重点关注离职倒计时和高风险身份。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-HR", look: "在职/离职/试用期、入职日、（计划）离职日", keys: "employee_id, status, leaving_date" },
      { order: 2, source: "DS-HR", look: "部门、岗位、汇报线、是否高管/VIP", keys: "employee_id, department, role, is_vip" },
      { order: 3, source: "DS-HR", look: "是否合同工/外包/实习生", keys: "employee_id, employment_type" },
      { order: 4, source: "DS-IDP", look: "账户类型（员工/服务/外部协作）", keys: "upn, account_type" },
      { order: 5, source: "观察名单", look: "离职倒计时 30d 名单、合规观察名单", keys: "employee_id, watchlist_tag" },
    ],
    outputs: [
      { field: "status", desc: "在职状态" },
      { field: "leaving_in_days?", desc: "离职倒计时（天）" },
      { field: "role_class", desc: "full_time|contractor|intern|vendor" },
      { field: "vip", desc: "是否为 VIP/高管" },
      { field: "watchlist[]", desc: "观察名单标签" },
    ],
    triggers: [
      "任何含用户实体的告警，A1 画像后需补充身份上下文 → 调用",
      "F1/F2 判定前需确认是否 VIP/离职/合同工 → 调用",
    ],
    notes: ["离职倒计时 30d 是 Insider Threat 高发窗口。"],
    relatedCapabilities: [],
  },
  "D3": {
    purpose: `回答"这台资产有哪些已知漏洞、是否已被在野利用"。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-VULN", look: "主机/资产的 CVE 清单（含 CVSS、EPSS）", keys: "asset_id, cve_id, cvss, epss" },
      { order: 2, source: "DS-VULN", look: "是否暴露公网", keys: "asset_id, internet_facing" },
      { order: 3, source: "DS-TI", look: "命中已知在野利用 EXP 的 CVE", keys: "cve_id, exploit_in_wild" },
      { order: 4, source: "DS-TICKET", look: "修复工单状态", keys: "cve_id, patch_status" },
    ],
    outputs: [
      { field: "critical_cves[]", desc: "高危 CVE 列表" },
      { field: "exploitable_in_wild[]", desc: "已有在野利用的 CVE" },
      { field: "internet_facing", desc: "是否暴露公网" },
      { field: "patch_status", desc: "修复工单状态" },
    ],
    triggers: [
      "A2/A3 主机画像发现漏洞暴露面 / 漏洞利用告警 → 调用",
      "D3 发现在野利用 CVE + internet_facing → 立刻触发 F2 P0 评估",
    ],
    notes: [
      "EPSS > 0.5 且 internet_facing=true 即视为紧急，无需等 CVSS 9+",
      "DS-VULN 扫描频率通常周级，告警时漏洞信息可能已过时",
    ],
    relatedCapabilities: [],
  },
  "D4": {
    purpose: "查询资产的补丁状态和合规基线情况。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-EDR (补丁清单)、DS-MOBILE、DS-VULN、合规扫描", look: "补丁列表、OS 版本、合规基线得分", keys: "asset_id, kb_id, compliance_score" },
    ],
    outputs: [
      { field: "os_patch_age_days", desc: "OS 最新补丁距今天数" },
      { field: "missing_kbs[]", desc: "缺失补丁列表" },
      { field: "compliance_score", desc: "合规得分" },
      { field: "failed_baselines[]", desc: "未通过的基线项" },
    ],
    triggers: [
      `告警涉及主机"补丁未打"假设 / 合规扫描发现不合规设备 → 调用`,
      "F8 处置建议 enforce_patch 前确认当前补丁状态 → 调用",
    ],
    notes: [
      "compliance_score < 60 建议强制隔离后再修复",
      "DS-MOBILE 补丁状态依赖 MDM 上报，设备离线时数据陈旧",
    ],
    relatedCapabilities: [],
  },
  "D5": {
    purpose: `构建该实体（用户/主机/账户）在过去 30/90 天的"正常"画像，提供偏离度基线。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP", look: "hour-of-day 直方图（登录时段）", keys: "principal, hour, count" },
      { order: 2, source: "DS-IDP", look: "top countries/cities（登录地点）", keys: "principal, country, city" },
      { order: 3, source: "DS-IDP", look: "top devices/UAs（登录设备）", keys: "principal, device_id, ua" },
      { order: 4, source: "DS-CASB/DS-IDP", look: "top apps（访问应用）", keys: "principal, app" },
      { order: 5, source: "DS-EDR", look: "该主机典型进程白名单（进程基线）", keys: "host, process_name" },
      { order: 6, source: "DS-NDR", look: "该主机典型外联目标（网络对端）", keys: "host, dst_ip, dst_domain" },
      { order: 7, source: "DS-DAM/DS-DLP", look: "典型查询/下载量（数据量）", keys: "principal, bytes, row_count" },
    ],
    outputs: [
      { field: "每维度基线统计", desc: "每个维度的基线统计" },
      { field: "deviation", desc: "当前事件相对基线的偏离度" },
    ],
    triggers: [
      "B1/B3/B4/B9/B10 检出 anomaly，需量化偏离程度 → 调用",
      "F1 判定证据不足时补充基线偏离度 → 调用",
    ],
    notes: [
      "基线窗口建议 30d（短期）和 90d（长期）双口径，各有用途",
      "新员工/新设备 < 14d 时基线不稳定，偏离度参考价值低",
    ],
    relatedCapabilities: [],
  },
  "D6": {
    purpose: `把该实体与"同部门/同岗位/同主机组"对比，输出偏离度 z-score。`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP/DS-EDR/DS-CASB 等（与 D5 同源）", look: "对同组聚合而非个体", keys: "group, dimension, zscore" },
    ],
    outputs: [
      { field: "deviation", desc: "偏离度（z-score / percentile）" },
    ],
    triggers: [
      "D5 自身基线显示偏离后，需二次验证是否同组也如此 → 调用",
      "内幕威胁调查中排查行为是否在部门内独特 → 调用",
    ],
    notes: [
      "组规模 < 5 人时 z-score 统计意义弱，需降权处理",
      "财务/研发等高敏感岗位对 GitHub/代码库的访问差异尤为有价值",
    ],
    relatedCapabilities: ["D5"],
  },
  "D7": {
    purpose: `"这件事在全公司过去 N 天发生过几次？"`,
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-SIEM", look: "全量聚合，模式命中计数", keys: "pattern, count, window" },
    ],
    outputs: [],
    triggers: [
      "B3 出现罕见命令行模式，需量化全组织发生频率 → 调用",
      "F1 判定前需要全局罕见度作为加权证据 → 调用",
    ],
    notes: [
      "DS-SIEM 全量聚合耗时，建议预计算热门模式的 30/90d 计数",
      "global_count = 0 是极高优先级信号，应自动触发告警升级",
    ],
    relatedCapabilities: [],
  },
  "D8": {
    purpose: "判断事件发生时是否在业务工作时间或维护窗口内。",
    inputs: [
      { field: "actor", required: true, desc: "操作者" },
      { field: "event_time", required: true, desc: "事件时间" },
    ],
    dataQueries: [
      { order: 1, source: "DS-HR (work_schedule)、DS-CMDB (maintenance_window)", look: "工作时间表、维护窗口", keys: "actor, work_schedule, maintenance_window" },
    ],
    outputs: [
      { field: "is_work_hour", desc: "是否工作时间" },
      { field: "is_maintenance_window", desc: "是否维护窗口" },
      { field: "work_schedule_class", desc: "工作时间类别" },
    ],
    triggers: [
      `任何"非工作时间敏感操作"假设 → 调用`,
      "F1 判定前需区分 BP（计划维护）vs TP（凌晨异常操作）→ 调用",
    ],
    notes: [
      "DS-HR work_schedule 通常 T+1，轮班/弹性工时员工需特殊处理",
      "跨时区员工的工作时间判断需基于其本地时区而非服务器时区",
    ],
    relatedCapabilities: [],
  },
  "D9": {
    purpose: "基于用户登录历史，建立地理位置基线并检测不可能旅行。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP、地理位置库", look: "当前登录地理位置、历史地理分布、不可能旅行计算", keys: "principal, src_ip, geo, ts" },
    ],
    outputs: [
      { field: "current_geo", desc: "当前地理位置" },
      { field: "baseline_geos[]", desc: "历史常用地理位置" },
      { field: "impossible_travel", desc: "{ prev_event, distance_km, hours_apart, max_feasible_speed }" },
    ],
    triggers: [
      "B1 登录异常告警 / 账户安全调查需验证地理位置 → 调用",
      "impossible_travel 假设 → 立刻调用确认",
    ],
    notes: [
      "VPN/Tor 出口 IP 会造成虚假地理位置，需先用 D11 排除",
      "不可能旅行阈值建议用飞行速度上限（900km/h）而非直线距离",
    ],
    relatedCapabilities: [],
  },
  "D10": {
    purpose: "基于用户历史登录设备，建立设备指纹基线并检测新设备登录。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP (UA, device_id)、DS-MOBILE", look: "当前设备/UA、历史设备列表、新设备标记", keys: "principal, device_id, ua, is_new" },
    ],
    outputs: [
      { field: "device", desc: "当前设备标识" },
      { field: "ua", desc: "User Agent" },
      { field: "is_new_device", desc: "是否新设备" },
      { field: "is_new_ua", desc: "是否新 UA" },
      { field: "baseline_devices[]", desc: "历史常用设备列表" },
    ],
    triggers: [
      "B1 登录异常 / IDP 新设备登录告警 → 调用",
      "D9 地理基线发现异常后补充设备维度交叉验证 → 调用",
    ],
    notes: [
      "新设备 + 新地理 + 非工作时间三者同时出现是强 TP 组合",
      "DS-IDP device_id 在企业内可能不唯一，需结合 UA 指纹",
    ],
    relatedCapabilities: [],
  },
  "D11": {
    purpose: "基于用户历史访问 ASN，建立网络位置基线并标记 VPN/Tor/代理。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-IDP / DS-VPN / DS-CASB", look: "源 IP/ASN 历史、VPN/代理/Tor 标记", keys: "principal, src_asn, vpn_flag, tor_flag" },
    ],
    outputs: [
      { field: "src_asn", desc: "当前 ASN" },
      { field: "baseline_asns[]", desc: "历史常用 ASN" },
      { field: "is_new_asn", desc: "是否新 ASN" },
      { field: "vpn_proxy_tor_flags", desc: "VPN/代理/Tor 标记" },
    ],
    triggers: [
      "B1 登录异常告警 / 远程接入审计需验证网络来源 → 调用",
      "D9 不可能旅行排查前需先过滤 VPN/Tor IP → 调用",
    ],
    notes: [
      "Tor/代理出口 IP 需配合 DS-TI 信誉二次确认，单一标记不足定论",
      "DS-VPN 保留期约 90d，超期远程接入历史不可追溯",
    ],
    relatedCapabilities: [],
  },
  "E1": {
    purpose: "查询 IP 地址的多源信誉，输出判定、评分及来源详情。",
    inputs: [
      { field: "ip", required: true, desc: "IP 地址" },
    ],
    dataQueries: [
      { order: 1, source: "DS-TI（多源聚合）、本地黑/白名单、社区/OSINT", look: "多源信誉、关联恶意标签、首次/最近见到时间", keys: "ip, verdict, score, tags" },
    ],
    outputs: [
      { field: "verdict", desc: "判定结论" },
      { field: "score", desc: "信誉评分" },
      { field: "sources", desc: "[ {name, verdict, tags, last_seen} ]" },
      { field: "asn_reputation", desc: "ASN 信誉" },
      { field: "geo_reputation", desc: "地理位置信誉" },
    ],
    triggers: [
      "A4 IP 画像确认为外部 IP → 立刻调用补充信誉",
      "B4 外联 IP / 防火墙告警目标 IP → 调用",
    ],
    notes: ["多源不一致时返回所有源结论；上层做加权决策。"],
    relatedCapabilities: [],
  },
  "E2": {
    purpose: "查询域名或 URL 的信誉分类，输出判定、类别及年龄信息。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-TI、域名分类引擎、内部黑名单", look: "信誉判定、分类标签、首次见到时间", keys: "domain, url, verdict, category" },
    ],
    outputs: [
      { field: "verdict", desc: "判定结论" },
      { field: "categories", desc: "[ phishing|c2|malware|gambling|... ]" },
      { field: "age_days", desc: "域名年龄（天）" },
      { field: "first_seen", desc: "首次见到时间" },
    ],
    triggers: [
      "B8 邮件链接 / B5 DNS 查询命中可疑域名 → 调用",
      "proxy 日志出现未知 URL → 调用",
    ],
    notes: [
      "age_days < 30 且 verdict=unknown 建议直接触发 E5 沙箱",
      "域名分类引擎存在滞后，新注册域名误判率高需多源校验",
    ],
    relatedCapabilities: [],
  },
  "E3": {
    purpose: "查询文件哈希的多源信誉，输出判定、家族及检测比例。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-TI、本地命中库、AV 引擎聚合", look: "Hash 信誉、恶意家族、首次提交时间、相似样本", keys: "hash, verdict, family, av_ratio" },
    ],
    outputs: [
      { field: "verdict", desc: "判定结论" },
      { field: "family?", desc: "恶意家族（若已知）" },
      { field: "av_detection_ratio", desc: "AV 检测比例" },
      { field: "first_submission", desc: "首次提交时间" },
      { field: "similar_samples[]", desc: "相似样本列表" },
    ],
    triggers: [
      "B3 进程 hash / B8 邮件附件 hash / A7 文件画像 → 调用",
      "EDR 文件事件命中可疑 hash → 调用",
    ],
    notes: [
      "av_detection_ratio > 0.3 可作为 TP 加权证据",
      "首次见到时间早于组织内攻击时间可排除内部制造样本",
    ],
    relatedCapabilities: [],
  },
  "E4": {
    purpose: "查询域名的 WHOIS、pDNS 及 CT 历史，输出注册历史、解析历史及关联域名。",
    inputs: [],
    dataQueries: [
      { order: 1, source: "DS-WHOIS（DomainTools / SecurityTrails / crt.sh / 微步）", look: "注册历史、解析历史、证书历史、关联同注册人/同邮箱的域名", keys: "domain, registrant, cert, pdns" },
    ],
    outputs: [
      { field: "registration_history", desc: "注册历史" },
      { field: "resolution_history", desc: "解析历史" },
      { field: "cert_history", desc: "证书历史" },
      { field: "same_registrant_domains", desc: "同注册人的其他域名" },
    ],
    triggers: [
      "A5 域名画像需要深挖注册历史 / APT 归因调查 → 调用",
      "C7 同源事件聚合需关联同注册人下其他域名 → 调用",
    ],
    notes: [
      "隐私保护注册掩盖了注册人信息，需通过证书/IP 历史交叉关联",
      "DS-WHOIS 为长期保留，但 pDNS 解析历史最长仅数年",
    ],
    relatedCapabilities: [],
  },
  "E5": {
    purpose: "对未知文件或 URL 进行沙箱动态引爆，输出完整行为报告。",
    inputs: [
      { field: "file_bytes", required: false, desc: "文件字节流" },
      { field: "url", required: false, desc: "目标 URL" },
    ],
    dataQueries: [
      { order: 1, source: "DS-SANDBOX", look: "动态行为：进程/文件/注册表/网络/注入/ATT&CK TTP", keys: "file, url, behavior" },
    ],
    outputs: [
      { field: "完整动态行为报告", desc: "进程/文件/注册表/网络/注入/ATT&CK TTP" },
    ],
    triggers: [
      "E3/E2 信誉未知或低置信度 → 触发沙箱引爆",
      "A7/A6 画像显示 verdict=unknown → 调用",
    ],
    notes: ["沙箱昂贵且慢，编排上应先 E3/E2，未知再引爆。"],
    relatedCapabilities: [],
  },
  "E6": {
    purpose: "对文件、进程或日志 artifact 进行 YARA/Sigma 规则匹配，输出命中规则及元数据。",
    inputs: [
      { field: "artifact (file/process/log)", required: true, desc: "待匹配的 artifact" },
      { field: "ruleset?", required: false, desc: "规则集（可选）" },
    ],
    dataQueries: [
      { order: 1, source: "本地 YARA/Sigma 规则库、社区规则", look: "规则匹配", keys: "artifact, rule_id, family, ttp" },
    ],
    outputs: [
      { field: "hits", desc: "命中规则列表 + 规则元数据（家族/TTP/作者）" },
    ],
    triggers: [
      "A7 文件画像 / B3 进程行为日志需要规则覆盖验证 → 调用",
      "E3 信誉低置信度时，YARA 规则命中可作为补充证据 → 调用",
    ],
    notes: [
      "社区规则误报率较高，建议维护内部白名单过滤已知误报",
      "规则库需定期更新，陈旧规则覆盖率随攻击技术演进下降",
    ],
    relatedCapabilities: [],
  },
  "E7": {
    purpose: "将证据集（命令行、行为、IOC）映射到 MITRE ATT&CK TTP，输出带置信度的技术列表。",
    inputs: [
      { field: "evidence_set[]", required: true, desc: "命令行、行为、IOC 证据集" },
    ],
    dataQueries: [
      { order: 1, source: "MITRE ATT&CK 知识库 + 本地映射库", look: "TTP 映射、置信度计算", keys: "technique_id, tactic, confidence" },
    ],
    outputs: [
      { field: "ttps", desc: "[ {id, name, tactic, confidence, evidence_ref} ]" },
    ],
    triggers: [
      "B3 进程列表 / C3 进程链收集完成 → 调用映射 ATT&CK",
      "C4 Kill-chain 阶段定位的前置步骤 → 调用",
    ],
    notes: [
      "单一证据映射多个 TTP 时，取置信度最高者作为主判断",
      "LOLBin 行为映射 TTP 时 false positive 率较高，需结合上下文",
    ],
    relatedCapabilities: [],
  },
  "E8": {
    purpose: "查询指定 CVE 的漏洞情报，输出 CVSS/EPSS 分值、是否在野利用及相关 APT。",
    inputs: [
      { field: "cve_id", required: false, desc: "CVE ID" },
      { field: "product, version", required: false, desc: "产品与版本" },
    ],
    dataQueries: [
      { order: 1, source: "NVD / 微步 / CISA KEV / EPSS / 商业 TI", look: "CVSS、EPSS、KEV 状态、利用工具、补丁、在野利用、关联 APT", keys: "cve_id, cvss, epss, kev, exploit" },
    ],
    outputs: [
      { field: "cvss", desc: "CVSS 评分" },
      { field: "epss", desc: "EPSS 漏洞利用概率" },
      { field: "kev", desc: "是否在 CISA KEV 清单" },
      { field: "exploit_available", desc: "是否有公开 EXP" },
      { field: "patch_available", desc: "是否有补丁" },
      { field: "exploited_in_wild", desc: "是否已被在野利用" },
      { field: "related_apt[]", desc: "关联 APT 组织" },
    ],
    triggers: [
      "A2/A3 暴露面发现 CVE / D3 漏洞上下文需要外部加权 → 调用",
      "F2 影响评估涉及已知在野利用 CVE → 调用确认 KEV 状态",
    ],
    notes: [
      "EPSS 分值每日更新，缓存超过 7d 的 EPSS 需重新拉取",
      "KEV 清单优先级高于 CVSS，KEV=true 即应视为紧急",
    ],
    relatedCapabilities: [],
  },
  "E9": {
    purpose: "基于证据集进行 APT/恶意家族归因，输出候选攻击者及置信度。",
    inputs: [
      { field: "evidence_set[]", required: true, desc: "证据集合" },
    ],
    dataQueries: [
      { order: 1, source: "DS-TI（家族库）、DS-KB（内部历史）", look: "家族匹配、历史攻击 TTP 比对", keys: "ttp, ioc, family" },
    ],
    outputs: [
      { field: "candidate_actors", desc: "[ {name, confidence, matched_ttps[], matched_iocs[]} ]" },
    ],
    triggers: [
      "F4 IOC + E7 TTP 集合汇聚后，高严重性事件需归因尝试 → 调用",
      "C7 同源聚合发现历史多次相同 TTP 组合 → 调用",
    ],
    notes: ["归因谨慎，必须返回置信度而非确定结论。"],
    relatedCapabilities: [],
  },
  "E10": {
    purpose: "查询邮箱、域名或密码哈希是否出现在已知凭据泄露库中。",
    inputs: [
      { field: "email|domain|password_hash", required: true, desc: "查询标识" },
    ],
    dataQueries: [
      { order: 1, source: "DS-TI（HIBP / 微步泄露库 / 暗网监控）", look: "泄露库命中记录", keys: "email, source, date, fields_leaked" },
    ],
    outputs: [
      { field: "found_in_breaches", desc: "[ {source, date, fields_leaked[]} ]" },
    ],
    triggers: [
      "B1 暴破/凭据填充告警 / A12 服务账户疑似泄露 → 调用",
      "A9 邮件画像发现外部邮箱需查泄露记录 → 调用",
    ],
    notes: [
      "泄露库覆盖不完整，found=false 不等于安全，需结合其他信号",
      "DS-TI 暗网监控延迟数天到数周，实时性弱于 HIBP API",
    ],
    relatedCapabilities: [],
  },
  "E11": {
    purpose: "检测域名、邮箱或 URL 是否为品牌/人员仿冒，输出仿冒目标、技术及相似度。",
    inputs: [
      { field: "domain|email|url", required: true, desc: "待检测标识" },
    ],
    dataQueries: [
      { order: 1, source: "字形相似算法 + DS-WHOIS + 内部品牌资产清单", look: "品牌/员工仿冒检测", keys: "target, technique, similarity" },
    ],
    outputs: [
      { field: "targets", desc: "[ brand_or_employee ]" },
      { field: "technique", desc: "punycode|typo|homoglyph|combosquat" },
      { field: "similarity", desc: "相似度分值" },
    ],
    triggers: [
      "A5/A6/A9 检测到仿冒嫌疑 / 钓鱼/BEC 调查 → 调用",
      "邮件发件域与内部品牌域高度相似 → 调用确认仿冒技术",
    ],
    notes: [
      "punycode 同形异义字仿冒视觉上完全相同，需程序化检测",
      "similarity > 0.9 + 新注册域名 = 极高优先级钓鱼基础设施",
    ],
    relatedCapabilities: [],
  },
  "E12": {
    purpose: "查询软件供应商、开源库或包的已知攻陷情况及安全公告。",
    inputs: [
      { field: "vendor|library|package", required: true, desc: "供应商/库/包名" },
    ],
    dataQueries: [
      { order: 1, source: "DS-TI、SBOM、依赖扫描、npm/pypi 等仓库告警", look: "已知攻陷、近期安全公告、版本风险", keys: "package, version, advisory" },
    ],
    outputs: [
      { field: "known_compromises", desc: "已知攻陷记录" },
      { field: "recent_advisories", desc: "近期安全公告" },
      { field: "version_risk", desc: "版本风险等级" },
    ],
    triggers: [
      "CI/CD 告警 / SBOM 扫描出现新 advisory → 调用",
      "D3 漏洞上下文涉及第三方组件 CVE → 调用",
    ],
    notes: [
      "SBOM 不完整时供应链风险会被低估，需定期全量扫描",
      "Advisory feed 存在数小时到数天时延，临近窗的命中需配合 A7/E3 文件实证",
    ],
    relatedCapabilities: [],
  },
  "F1": {
    purpose: "基于收集到的所有原子能力输出，给出判定 + 置信度 + 关键理由 + 反证。",
    inputs: [
      { field: "evidence_set[]", required: true, desc: "证据集合" },
      { field: "policy?", required: false, desc: "判定策略（可选）" },
    ],
    dataQueries: [],
    outputs: [
      { field: "verdict", desc: "TP|FP|BP|INC" },
      { field: "confidence", desc: "置信度 [0.0, 1.0]" },
      { field: "key_reasons[]", desc: "关键判定理由" },
      { field: "counter_evidence[]", desc: "反证（避免单边判定）" },
      { field: "remaining_uncertainties[]", desc: "剩余不确定性" },
    ],
    triggers: ["调查链收口；所有 A/B/C/D/E 类能力跑完后调用一次。"],
    notes: ["BP = Benign Positive（行为确认但合法），INC = Inconclusive（证据不足）。"],
    relatedCapabilities: [],
  },
  "F2": {
    purpose: "综合资产重要性、用户身份、扩散范围、Kill-chain 阶段，输出严重性等级和影响范围。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "severity", desc: "P0-P4" },
      { field: "impact", desc: "{ confidentiality, integrity, availability }" },
      { field: "blast_radius", desc: "{ hosts, users, data }" },
    ],
    triggers: [
      "F1 出 TP/BP 后，需要量化影响范围 → 调用",
      "D1/D2/C2/C9 输入完整后，F8 处置决策前 → 调用",
    ],
    notes: [
      "P0/P1 结果应自动触发 oncall 通知，无需人工判断",
      "blast_radius 依赖 C9 受害者扩展，C9 未跑时结果会低估",
    ],
    relatedCapabilities: ["D1", "D2", "C9", "C4"],
  },
  "F3": {
    purpose: "重构完整 Kill-chain，输出每阶段证据 ref 及当前攻击推进位置。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "完整 Kill-chain 重构", desc: "每阶段证据 ref + 当前推进位置" },
    ],
    triggers: [
      "C4 Kill-chain 阶段定位 + F6 时间线完成后 → 调用收口",
      "高严重性事件需要完整攻击链输出用于报告 → 调用",
    ],
    notes: [
      "阶段间存在证据缺口时需标注，不要补填推断",
      "当前推进位置决定 F8 处置优先级（C2 阶段比 Recon 阶段紧急得多）",
    ],
    relatedCapabilities: ["C4", "F6"],
  },
  "F4": {
    purpose: "从本次调查所有证据中提取 IOC，输出标准化 STIX 2.1/MISP 格式带置信度与 TTL。",
    inputs: [
      { field: "本次调查所有证据", required: true, desc: "所有证据集合" },
    ],
    dataQueries: [],
    outputs: [
      { field: "ioc_set", desc: "标准化 STIX 2.1 / MISP 格式 IOC（IP/域名/Hash/URL/Email/Mutex/Cert/...），带置信度与 TTL" },
    ],
    triggers: [
      "调查确认 TP 后，提取 IOC 用于封锁/共享 → 调用",
      "C9 受害者扩展前需要标准化 IOC 集合 → 调用",
    ],
    notes: [
      "IOC TTL 应按类型差异化：IP 短（7d），Hash 长（180d），域名中（30d）",
      "置信度 < 0.5 的 IOC 不应直接入封锁名单，需人工复核",
    ],
    relatedCapabilities: [],
  },
  "F5": {
    purpose: "基于 TTP 模式和归因证据，构建攻击者画像，输出能力水平和动机倾向。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "ttp_pattern", desc: "TTP 模式" },
      { field: "sophistication", desc: "能力水平" },
      { field: "motivation_hint", desc: "动机倾向" },
      { field: "attribution_candidates[]", desc: "归因候选" },
    ],
    triggers: [
      "E9 归因尝试 + F3 Kill-chain 重构完成后 → 调用",
      "高严重性事件需要攻击者能力评估用于长期防御策略 → 调用",
    ],
    notes: [
      "归因谨慎：所有判断必须返回置信度，禁止输出确定性结论",
      "证据不足时输出 attribution_candidates 空列表，不要为了非空而强行归因",
    ],
    relatedCapabilities: ["E9", "F3"],
  },
  "F6": {
    purpose: "重构标准化时间线（按秒/毫秒排序、跨数据源、含证据 ref）并标注首次活动/关键节点/最新。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "timeline", desc: "标准化时间线（按秒/毫秒排序、跨数据源、含证据 ref）" },
      { field: "key_moments", desc: "首次活动 / 关键节点 / 当前最新" },
    ],
    triggers: [
      "C1 共现 + C8 跨源拼接完成后 → 调用生成时间线",
      "F10 报告生成前需要标准化时间线 → 调用",
    ],
    notes: [
      "时间线依赖 C8 的时钟漂移补偿，未做补偿时事件顺序可能错乱",
      "key_moments 用于管理层报告，full timeline 用于技术报告",
    ],
    relatedCapabilities: ["C1", "C8"],
  },
  "F7": {
    purpose: "汇总所有受影响的实体清单，为批量处置和合规通报提供输入。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "hosts[]", desc: "受影响主机列表" },
      { field: "users[]", desc: "受影响用户列表" },
      { field: "accounts[]", desc: "受影响账户列表" },
      { field: "data_objects[]", desc: "受影响数据对象" },
      { field: "cloud_resources[]", desc: "受影响云资源" },
    ],
    triggers: [
      "C9 受害者扩展完成后汇总所有受影响实体 → 调用",
      "F8 批量处置和 F10 合规通报前需要实体清单 → 调用",
    ],
    notes: [
      "data_objects 含 PII 时须触发 G7 隐私守门后再输出",
      "实体清单需注明发现来源（哪个能力、哪条证据），便于审计",
    ],
    relatedCapabilities: ["C9", "C2"],
  },
  "F8": {
    purpose: "基于判定和影响评估，生成分级处置建议（遏制/根除/恢复/证据保全），仅给建议不执行。",
    inputs: [
      { field: "F1/F2/F7 + 企业处置策略库", required: true, desc: "判定结果、影响评估、受影响实体及策略库" },
    ],
    dataQueries: [],
    outputs: [
      { field: "containment", desc: "[ isolate_host | disable_account | reset_password | revoke_token | block_ip | quarantine_file ]" },
      { field: "eradication", desc: "[ remove_persistence | reimage | patch_cve ]" },
      { field: "recovery", desc: "[ restore_backup | re-enable_account ]" },
      { field: "evidence_preservation", desc: "[ memory_dump | disk_image | log_export ]" },
    ],
    triggers: [
      "F1 出 TP/BP + F2 出 severity 后，调查链最后一步 → 调用",
      "任何 P0/P1 事件需要立即生成处置建议 → 调用",
    ],
    notes: ["原子能力只给建议，是否执行由编排层 + 人决定。"],
    relatedCapabilities: ["F1", "F2", "F7"],
  },
  "F9": {
    purpose: "定位攻击初始入口点，输出初始访问向量和完整证据链。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "initial_access_vector", desc: "phishing|exploit|valid_creds|supply_chain|insider" },
      { field: "evidence_chain[]", desc: "证据链" },
    ],
    triggers: [
      "完整调查链证据收集完成 + C3 进程链 root 已知 → 调用",
      "F10 报告需要根因段落 / F11 检测改进需要入口点 → 调用",
    ],
    notes: [
      "initial_access_vector 不确定时输出 INC，不要猜测填充",
      "钓鱼入口需 B8 邮件证据支撑；漏洞利用需 D3 CVE 证据支撑",
    ],
    relatedCapabilities: ["C3", "B8"],
  },
  "F10": {
    purpose: "生成面向不同受众（管理层/技术/合规/法务）的通报材料。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "管理层版本", desc: "结论 + 影响 + 行动" },
      { field: "技术版本", desc: "完整时间线 + IOC + TTP + 取证证据" },
      { field: "合规版本", desc: "法规要求字段：监管报告、隐私事件通知" },
      { field: "法务取证版本", desc: "证据链与保全说明" },
    ],
    triggers: [
      "所有 F 类输出 + G7 隐私守门完成后 → 调用生成通报材料",
      "合规报告截止或法务介入时 → 调用",
    ],
    notes: [
      "G7 必须先于本能力执行，未脱敏的 PII 不得进入报告",
      "不同受众版本需独立生成，技术版不应直接裁剪为管理层版",
    ],
    relatedCapabilities: ["G7"],
  },
  "F11": {
    purpose: "基于本次调查结论，生成 Sigma/SIEM 规则草案和 EDR 检测策略改进建议。",
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "新增/调整的 Sigma/SIEM 规则草案", desc: "规则草案" },
      { field: "EDR 检测策略建议", desc: "EDR 策略" },
      { field: "基线监控字段建议", desc: "应当加入基线监控的字段" },
      { field: "培训/意识改进点", desc: "如钓鱼演练专题" },
    ],
    triggers: [
      "F1/F9 出结论后，需生成检测改进建议 → 调用",
      "季度复盘时批量回顾已关闭告警 → 调用",
    ],
    notes: [
      "Sigma 规则草案须经测试后再入生产，直接部署误报风险高",
      "根因处补检测优先级最高，不要只改下游规则",
    ],
    relatedCapabilities: [],
  },
  "G1": {
    purpose: "基于已知证据，生成多个对立假设供进一步证伪/证实。",
    inputs: [
      { field: "current_evidence", required: true, desc: "当前证据" },
      { field: "alert_type", required: true, desc: "告警类型" },
    ],
    dataQueries: [],
    outputs: [
      { field: "hypotheses", desc: "[ { hypothesis, supporting_signals[], required_evidence_to_confirm[], required_evidence_to_refute[], prior_probability } ]" },
    ],
    triggers: [
      "告警刚进入调查时生成初始假设集 → 调用",
      "F1 出 INC 后需要新假设驱动下一步 → 调用",
    ],
    notes: [
      "假设应包含对立项（真攻击/红队/误报/用户测试），防止单边调查",
      "prior_probability 应参考 G4 历史相似告警的 FP/TP 比例",
    ],
    relatedCapabilities: [],
  },
  "G2": {
    purpose: `主动寻找"否定当前主假设"的证据，防止确认偏误。`,
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "counter_evidence_list", desc: "与主假设相悖的证据列表" },
    ],
    triggers: [
      "G1 主假设确立后，F1 自信判定前 → 调用防止确认偏误",
      "F1 置信度 > 0.8 时强制调用自我挑战 → 调用",
    ],
    notes: [
      "反证应与主假设独立收集，不要复用同一证据链",
      "找不到反证 ≠ 主假设正确，可能是数据源盲区",
    ],
    relatedCapabilities: [],
  },
  "G3": {
    purpose: "评估当前不确定性，推荐下一步原子能力调用（含成本×价值权衡）。",
    inputs: [
      { field: "current_state", required: true, desc: "当前调查状态" },
    ],
    dataQueries: [],
    outputs: [
      { field: "uncertainty", desc: "high|med|low" },
      { field: "top_missing_evidence[]", desc: "最关键缺失证据" },
      { field: "recommended_next_atomic_calls[]", desc: "推荐下一步原子能力调用（含成本×价值分）" },
    ],
    triggers: [
      "F1 出 verdict=INC，需要确定下一步调查方向 → 调用",
      "Agent 自主调查循环中每轮决策下一步 → 调用",
    ],
    notes: [`每个推荐调用附带"成本（数据源时延/API 限速）× 价值（消除多少不确定性）"分。`],
    relatedCapabilities: [],
  },
  "G4": {
    purpose: "基于当前告警指纹，从知识库检索历史相似告警及其判定结果。",
    inputs: [
      { field: "current_alert_fingerprint", required: true, desc: "当前告警指纹" },
    ],
    dataQueries: [
      { order: 1, source: "DS-KB（向量库 + 关键字 + IOC 集合相似度）", look: "历史相似告警、过往判定及响应", keys: "fingerprint, similarity, past_verdict" },
    ],
    outputs: [
      { field: "similar_alerts", desc: "[ {past_alert_id, similarity, past_verdict, past_response} ]" },
    ],
    triggers: [
      "调查链开始时查先验，减少重复工作 → 调用",
      "F1 出 verdict 后用历史回看校准置信度 → 调用",
    ],
    notes: ["复用过往决策、避免重复劳动、识别长期攻击者。"],
    relatedCapabilities: [],
  },
  "G5": {
    purpose: "在数据源时延/限速 vs 价值之间为 Agent 排序下一步动作。",
    inputs: [
      { field: "候选原子能力列表", required: true, desc: "候选原子能力列表" },
      { field: "当前不确定性", required: true, desc: "当前不确定性状态" },
    ],
    dataQueries: [],
    outputs: [
      { field: "ordered_actions", desc: "排序后的动作序列（贪心 / 启发式）" },
    ],
    triggers: [
      "G3 给出多个候选下一步动作需要排序 → 调用",
      "多个并行假设需要按 ROI 排优先级 → 调用",
    ],
    notes: [
      "成本估算需维护各数据源的 p50/p95 时延台账",
      "数据源限速约束必须纳入排序，否则调度会触发 429",
    ],
    relatedCapabilities: ["G3"],
  },
  "G6": {
    purpose: `在收口前自查"判定是否被证据充分支持"，输出不支持的声明和冲突证据。`,
    inputs: [],
    dataQueries: [],
    outputs: [
      { field: "unsupported_claims[]", desc: "缺乏证据支持的声明" },
      { field: "stale_evidence[]", desc: "过时/可能失效的证据" },
      { field: "conflicting_evidence[]", desc: "相互冲突的证据" },
    ],
    triggers: [
      "F1/F10 收口前的最终自查 → 调用",
      "F1 置信度高但证据链存疑时 → 调用",
    ],
    notes: [
      "stale_evidence 指数据源保留期内但采集时间过早的证据",
      "unsupported_claims 发现后必须触发 G3 补证，不得强行收口",
    ],
    relatedCapabilities: [],
  },
  "G7": {
    purpose: "原子能力输出汇总后，按调用者角色裁剪敏感字段，记录访问审计日志。",
    inputs: [
      { field: "output_payload", required: true, desc: "输出 payload" },
      { field: "caller_role", required: true, desc: "调用者角色" },
      { field: "legal_basis?", required: false, desc: "法律依据（如 GDPR）" },
    ],
    dataQueries: [],
    outputs: [
      { field: "redacted_payload", desc: "脱敏后的 payload" },
      { field: "audit_log", desc: "访问审计日志" },
    ],
    triggers: [
      "F10 报告/跨团队分享前，任何含 PII 字段的输出 → 必须调用",
      "合规通报或外部共享前 → 调用裁剪敏感字段",
    ],
    notes: [
      "caller_role 必须准确传入，错误角色会导致过度或不足脱敏",
      "audit_log 需持久化存储，是 GDPR/隐私审计的关键证据",
    ],
    relatedCapabilities: [],
  },
  "G8": {
    purpose: "满足升级条件时，建议人工介入调查，打包调查上下文并指定升级角色和紧急度。",
    inputs: [
      { field: "current_state", required: true, desc: "当前调查状态" },
    ],
    dataQueries: [],
    outputs: [
      { field: "should_escalate", desc: "bool" },
      { field: "to_role", desc: "升级到的角色" },
      { field: "urgency", desc: "紧急程度" },
      { field: "packaged_context", desc: "打包的调查上下文" },
    ],
    triggers: [
      "F8 涉及高风险处置动作（reimage/disable VIP）→ 调用评估是否需人审",
      "F1 不确定性高且数据源已穷尽 / 涉及法律隐私边界 → 调用",
    ],
    notes: [
      "处置动作涉及高风险（reimage 关键服务器 / disable VIP 账户）时触发",
      "不确定性高且数据源已穷尽时触发",
      "涉及法律/隐私边界时触发",
      `命中"必须人审"规则（如 CEO 账户告警）时触发`,
    ],
    relatedCapabilities: [],
  },
};
