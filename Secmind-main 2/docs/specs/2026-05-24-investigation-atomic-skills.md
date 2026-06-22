# 安全告警调查 · 原子能力设计 (v1.0)

---

## 目录

- [1. 抽象数据源清单](#1-抽象数据源清单)
- [2. 原子能力卡片](#2-原子能力卡片)
  - [A. 实体画像类 Entity Profiling](#a-实体画像类)
  - [B. 行为活动类 Activity Investigation](#b-行为活动类)
  - [C. 关联推理类 Relational Reasoning](#c-关联推理类)
  - [D. 上下文与基线类 Context & Baseline](#d-上下文与基线类)
  - [E. 外部情报类 External Intelligence](#e-外部情报类)
  - [F. 判定与产出类 Verdict & Output](#f-判定与产出类)
  - [G. 元能力类 Meta](#g-元能力类)
- [3. 数据源 × 能力依赖矩阵](#3-数据源-能力依赖矩阵)
- [4. 典型告警编排示例](#4-典型告警编排示例)
- [5. 落地路线图（P0/P1/P2）](#5-落地路线图)


---

## 1. 抽象数据源清单

| ID | 抽象数据源 | 典型实际系统 | 数据特征 | 典型保留期 |
|---|---|---|---|---|
| DS-IDP | 身份提供者 | AD / Okta / AzureAD / Ping / 飞书 IM | 账户、组、登录、MFA | 90-365d |
| DS-HR | HR / OA | Workday / SAP / 飞书人事 / 钉钉 / 自研 OA | 在职状态、组织架构、汇报线、离职日 | 长期 |
| DS-CMDB | 资产管理 | ServiceNow CMDB / 自研 | 资产↔Owner↔业务线↔重要性 | 长期 |
| DS-IPAM | IP / DHCP / NAT | Infoblox / DHCP / 防火墙 NAT 表 | IP↔MAC↔主机 还原 | 7-90d |
| DS-VPN | VPN / SDP / ZTNA | AnyConnect / Pulse / 飞连 / SDP | 远程接入会话 | 90d |
| DS-EDR | 终端检测响应 | CrowdStrike / SentinelOne / Defender / 奇安信 / 360 | 进程、文件、注册表、注入 | 30-90d |
| DS-SIEM | 日志聚合 | Splunk / Elastic / Sentinel / QRadar | 跨源日志全文检索 | 90-365d |
| DS-NDR | 网络流量分析 | Zeek / Suricata / Vectra / ExtraHop / Darktrace | L3-L7 会话元数据 | 7-90d |
| DS-FW | 防火墙 | PaloAlto / Fortinet / 华为 / 深信服 | 五元组流日志 | 7-30d |
| DS-PROXY | 代理/上网行为 | BlueCoat / Zscaler / 上网行为审计 | URL / 分类 / SSL 解密 | 30-90d |
| DS-WAF | Web 应用防火墙 | Cloudflare / Akamai / 长亭 / 安恒 | HTTP 攻击告警 | 30-90d |
| DS-EMAIL | 邮件网关 | Mimecast / Proofpoint / Coremail / 飞书邮箱 / Exchange | 邮件元数据、附件、链接 | 90-365d |
| DS-DLP | 数据防泄漏 | Symantec DLP / Forcepoint / 天空卫士 | 敏感数据流出告警 | 90d |
| DS-CASB | 云访问安全 | Netskope / MCAS | SaaS 用量与策略 | 90d |
| DS-CLOUD | 云控制面审计 | CloudTrail / Azure Activity / GCP Audit / 阿里 ActionTrail | API 调用流水 | 90-365d |
| DS-PAM | 特权访问 | CyberArk / BeyondTrust / JumpServer / 堡垒机 | 特权操作 / 录像 | 180-365d |
| DS-DAM | 数据库审计 | Imperva DAM / 安华金和 / 帆思 | SQL 执行流水 | 90-180d |
| DS-VULN | 漏洞管理 | Tenable / Qualys / 绿盟 RSAS / 奇安信 | CVE 暴露面 | 长期 |
| DS-AV | AV / 主防 | 卡巴 / 赛门铁克 / 360 / 火绒 | 病毒命中 | 90d |
| DS-SANDBOX | 沙箱 | 微步 OneSandbox / VMRay / Cuckoo / Joe Sandbox | 动态行为 | 按需 |
| DS-TI | 威胁情报 | 微步 / 奇安信 / VT / Recorded Future / OSINT | IOC 信誉 | 实时 |
| DS-WHOIS | WHOIS/pDNS/CT | DomainTools / SecurityTrails / crt.sh | 域名/证书历史 | 长期 |
| DS-KB | 知识库 / 历史告警 | 自研工单 / ES / 向量库 | 历史决策 | 长期 |
| DS-CODE | 代码托管审计 | GitHub Audit / GitLab Audit / 自研 | 代码访问/外泄 | 90-365d |
| DS-TICKET | 工单 / ITSM | ServiceNow / Jira / 自研 | 变更窗、维护单、授权操作 | 长期 |
| DS-MOBILE | MDM / EMM | Intune / Jamf / 飞书 MDM | 移动设备状态 | 90d |
| DS-FILE | 文件服务器审计 | Windows 文件审计 / NAS 审计 / OneDrive Audit | 共享文件读写 | 90d |
| DS-DNS | DNS 日志 | 内部递归 DNS / 解析器日志 | 主机↔查询的域名 | 30-90d |

> 落地时每家企业需要做一次"DS-X → 实际厂商系统/数据表/查询接口"的映射表。本文档不规定具体厂商。

---

## 2. 原子能力卡片

## A. 实体画像类

### A1 · 用户/账户画像  `investigate.entity.user.profile`

**目的**：给定账户标识（username/email/uid/SID），输出该账户的身份、组织、状态、风险标签全景。

**输入**

| 字段 | 必填 | 说明 |
|---|---|---|
| principal | ✓ | username / email / uid / SID 任一 |
| time_window | | 行为聚合窗口，默认 30d |


| # | 数据源 | 查什么 | 关键字段/关联键 |
|---|---|---|---|
| 1 | DS-HR | 姓名、工号、部门、岗位、汇报线、入职日、在职状态、离职倒计时 | employee_id, status |
| 2 | DS-IDP | UPN、SID、组成员、最近改密时间、MFA 状态、锁定状态、近 30d 登录次数 | upn, sid, groups |
| 3 | DS-CMDB | 该用户名下绑定的主机/资产清单（Owner 关系） | owner→asset[] |
| 4 | DS-PAM | 是否特权账户、可申领的角色、近 N 天申领记录 | role_assignments |
| 5 | DS-EMAIL | 主邮箱、别名、邮箱转发规则、外发自动转发设置 | aliases, forwarding_rules |
| 6 | DS-KB | 该账户历史命中告警数 / 类型分布 / 最近一次 | prior_alerts |
| 7 | 内部观察名单 | 是否在威胁/合规/离职观察名单 | watchlist_tags |

**输出**（核心字段）

- `identity`: { display_name, employee_id, department, manager, hire_date, status, leaving_date? }
- `auth`: { upn, sid, groups[], mfa_enabled, last_password_change, locked }
- `privilege`: { is_privileged, roles[], pam_assignments[] }
- `assets`: [ { asset_id, role: owner|user|admin } ]
- `email`: { primary, aliases[], forwarding_rules[] }
- `risk_tags`: [ leaver_30d | watchlist | dormant_active | priv_no_mfa | ... ]
- `prior_alerts_30d`: count
- `confidence` / `partial` / `evidence_refs`

**典型编排触发**：任何含"用户"实体的告警必调用。

**示例编排**
- **上游**：raw alert 的 `principal/subject_user`；B1 异常登录的命中用户。
- **下游**：D2 用户身份上下文、F2 影响评估、F8 处置建议（按 `auth.mfa_enabled / locked` 选择 reset_password 或 disable_account）。
- 编排片段：
  ```
  user = A1.run(principal=alert.subject_user)
  if "external_forwarding" in user.risk_tags:
      email_act = B8.run(mailbox=user.email.primary, window=7d)
  ctx = D2.run(principal=user.identity.employee_id)
  ```

**备注**
- HR 数据通常 T+1，离职当天告警要标注"HR 可能尚未同步"
- 邮件转发规则是 BEC 持久化经典点，必须查
- "在职但 90 天未活跃账户突然活跃" = 高优风险标签

---

### A2 · 主机/终端画像  `investigate.entity.host.profile`

**目的**：给定主机标识（hostname/AgentID/asset_id），输出该终端的资产属性、运行状态、安全配置、关联人。

**输入**

| 字段 | 必填 | 说明 |
|---|---|---|
| host | ✓ | hostname / agent_id / asset_id / MAC / 当前 IP |
| time_window | | 默认 7d |


| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-CMDB | asset_id、Owner、使用人、业务线、重要性等级、所在 IDC/办公区、生命周期阶段 |
| 2 | DS-EDR | OS、内核版本、Agent 版本、最近在线时间、当前用户、当前外网 IP |
| 3 | DS-IPAM | 当前/历史 IP-MAC 绑定 |
| 4 | DS-VULN | 已知 CVE 列表、暴露面（端口/服务）、上次扫描时间 |
| 5 | DS-AV | 引擎状态、特征库版本、最近查杀历史 |
| 6 | DS-TICKET | 关联工单（维护中？变更窗口？） |
| 7 | DS-KB | 该主机历史告警 |
| 8 | DS-MOBILE | 若为移动设备：MDM 合规状态、越狱/Root、加密状态 |

**输出**
- `asset`: { id, owner, business_unit, criticality, location, lifecycle }
- `system`: { os, kernel, edr_agent_version, last_seen, current_user, current_ip }
- `security_posture`: { vuln_count, critical_cves[], av_status, edr_health }
- `change_context`: { active_ticket?, in_maintenance_window? }
- `prior_alerts_30d`: count

**典型编排触发**：任何"主机/终端"告警必调用。

**备注**
- "重要性" 字段对优先级影响巨大，CMDB 缺失或不准时上层应降级判定
- 维护窗内的告警优先级应自动下调，但仍需调查（防止假借维护）

**示例编排**
- **上游**：raw alert 的 `host_id / endpoint_id / src_ip`；A4 内网 IP 还原后回查。
- **下游**：B3 进程、B4 网络、C3 进程链以 host 为锚点；F2 影响读 `criticality`。
- 编排片段：
  ```
  host = A2.run(host=alert.host_id)
  if host.asset.criticality == "critical":
      procs = B3.run(host=alert.host_id, window=30m)
  ```

---

### A3 · 服务器/服务器组画像  `investigate.entity.server.profile`

**目的**：A2 的服务器特化版，关注业务暴露面。

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-CMDB | 服务器组、业务系统、上下游依赖、面向公网/内网 |
| 2 | DS-EDR / 主机 | 运行的服务/端口、关键进程、SSH key 列表、最近重启 |
| 3 | DS-VULN | 暴露端口及对应 CVE |
| 4 | DS-FW | 入向访问策略（谁能连） |
| 5 | DS-TICKET | 配置变更/上线工单 |
| 6 | DS-WAF | 若是 Web 服务器：近 N 天 WAF 拦截趋势 |

**输出**：扩展 A2 + `exposure: { internet_facing, ports[], upstream_systems[] }`

**示例编排**
- **上游**：服务器告警（公网扫描/Web 入侵）、A4 IP 反查归属。
- **下游**：D3 漏洞上下文、F2 影响（含 internet_facing 加权）、F8 处置（公网暴露走"先封端口再调查"）。
- 编排片段：
  ```
  srv = A3.run(host=alert.target_server)
  if srv.exposure.internet_facing:
      vuln = D3.run(asset_id=srv.asset.id)
  ```

---

### A4 · IP 地址画像  `investigate.entity.ip.profile`

**目的**：给定 IP，回答"它是谁、来自哪里、有没有问题、组织内有什么关联"。

**输入**

| 字段 | 必填 | 说明 |
|---|---|---|
| ip | ✓ | IPv4/IPv6 |
| time_window | | 默认 ±24h |

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | 内网 CIDR 表 / DS-CMDB | 是否内网、归属网段、Owner 部门 |
| 2 | DS-IPAM | 内网 IP↔MAC↔主机映射 |
| 3 | DS-IPAM (DHCP) | 时间窗内该 IP 分配给哪台 MAC/主机 |
| 4 | DS-VPN | 是否远程接入分配 IP（VPN/SDP/ZTNA） |
| 5 | DS-IPAM (NAT) | 出向 NAT 后映射到内网哪个源（反向还原） |
| 6 | DS-FW / DS-NDR | 时间窗内连接量、对端分布、协议分布 |
| 7 | DS-DNS | 该 IP 被哪些域名解析过（反向 PTR）/ 它发出的查询 |
| 8 | DS-TI | 多源信誉、关联恶意标签、首次/最近见到时间 |
| 9 | DS-WHOIS | WHOIS：持有人、注册国、ASN |
| 10 | DS-WHOIS (CT) | 关联证书 SAN |
| 11 | DS-KB | 该 IP 历史告警次数 |

**输出**
- `classification`: internal / external / vpn / cloud_egress / cdn / tor / unknown
- `internal_resolution`: { host, mac, owner, env } | null
- `reputation`: { score, verdict, sources[], tags[] }
- `asn`: { number, org, country }
- `activity_summary`: { conn_count, top_peers[], first_seen, last_seen }
- `related_entities`: { users[], hosts[], domains[] }

**典型编排触发**
- 任何外联/被扫描类告警 → 立刻调用
- 横向移动假设 → 用于内网 IP 还原回主机

**备注**：DHCP/VPN/NAT 是内网 IP 还原"必查三件套"，缺一会断链。

**示例编排**
- **上游**：B1 中 `src_ip`、B4 外联 IP、防火墙告警 `dst_ip`。
- **下游**：内网 IP → A2 主机画像；外网 IP → E1 信誉、C9 victim expansion；C2 实体图以 IP 为边。
- 编排片段：
  ```
  ip = A4.run(ip=alert.src_ip)
  if ip.classification == "internal":
      host = A2.run(host=ip.internal_resolution.host)
  elif ip.reputation.verdict == "malicious":
      ioc = F4.run(evidence=[ip])
  ```

---

### A5 · 域名画像  `investigate.entity.domain.profile`

**输入**：`domain`, `time_window?`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-WHOIS | 注册商、注册时间（域名年龄）、注册人、隐私保护 |
| 2 | DS-WHOIS (pDNS) | 历史解析 IP、解析变化频率 |
| 3 | DS-WHOIS (CT) | 证书历史、SAN 关联子域名 |
| 4 | DS-TI | 信誉、分类（钓鱼/C2/挖矿/...）、关联家族 |
| 5 | DS-DNS | 内部解析次数、解析它的主机/用户 |
| 6 | DS-PROXY | 访问该域名的内部用户/会话 |
| 7 | 字形相似算法 | 与组织品牌域/常用 SaaS 域的相似度（钓鱼仿冒） |
| 8 | DS-EMAIL | 近 N 天收到来自该域的邮件 |

**输出**
- `whois`: { registrar, created, age_days, registrant, privacy }
- `reputation`: { verdict, categories[], tags[] }
- `dns_history`: [ {ip, first_seen, last_seen} ]
- `cert_history`: [ {sha256, sans, issuer} ]
- `internal_exposure`: { queried_by_hosts[], visited_by_users[], received_emails[] }
- `lookalike`: { brand?, similarity_score, technique: punycode|typo|... }

**典型编排触发**：钓鱼/C2/DNS 隧道/挖矿类告警必调用。

**备注**：域名年龄 < 30d 是高风险信号（DGA / 新注册攻击基础设施）。

**示例编排**
- **上游**：B8 邮件里的链接域名、B5 DNS 查询、proxy URL host。
- **下游**：E2 域名/URL 信誉、E11 仿冒情报、F4 IOC。
- 编排片段：
  ```
  dom = A5.run(domain="c0rp-login.com")
  if dom.lookalike.brand or dom.whois.age_days < 30:
      verdict_evidence.append(dom)
  ```

---

### A6 · URL 画像  `investigate.entity.url.profile`

**输入**：`url`, `time_window?`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-TI | URL 信誉、分类 |
| 2 | DS-SANDBOX | URL 动态引爆：页面截图、跳转链、加载资源、表单字段 |
| 3 | DS-WHOIS | 子域所属主域→ A5 |
| 4 | DS-PROXY | 内部访问历史（谁/几次/几台机器） |
| 5 | DS-WAF | 若指向自家域：相关拦截记录 |
| 6 | URL 解析 | 提取参数、解码 base64/URL-encoded、识别 redirect/exfil 模式 |

**输出**
- `parsed`: { scheme, host, path, query_params, decoded_params }
- `reputation`: { verdict, categories[] }
- `sandbox`: { screenshot, final_url, resources[], forms[] }
- `internal_exposure`: { visits[], hosts[], users[] }

**示例编排**
- **上游**：B8 邮件链接、B12 浏览器历史、WAF 告警 URL。
- **下游**：A5 主域画像、E2 信誉、E5 沙箱（未知时引爆）。
- 编排片段：
  ```
  url = A6.run(url=email.links[0])
  if url.reputation.verdict == "unknown":
      sandbox = E5.run(url=url.parsed.full)
  ```

---

### A7 · 文件/哈希画像  `investigate.entity.file.profile`

**输入**：`hash` (MD5/SHA1/SHA256) 或 `file_path + host` 或 `file_bytes`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-TI | 多源 Hash 信誉、家族、首次曝光时间 |
| 2 | DS-SANDBOX | 动态行为：网络/文件/注册表/进程/注入 |
| 3 | DS-EDR | 本组织内该 Hash 的传播范围（哪些机器/用户/时间） |
| 4 | DS-EDR | 签名信息：签名者、证书链、吊销状态 |
| 5 | 静态分析 | 文件类型、节区、导入表、字符串、PE/ELF/Macro/JS 特征 |
| 6 | YARA / Sigma | 规则匹配 |
| 7 | DS-AV | 各 AV 引擎命中 |
| 8 | DS-EMAIL | 是否作为附件出现过、收件人列表 |

**输出**
- `hashes`: { md5, sha1, sha256 }
- `static`: { type, size, signature, sections[], imports[], strings_of_interest[] }
- `reputation`: { verdict, family?, sources[] }
- `sandbox`: { dropped_files[], net_iocs[], registry_changes[], spawned_procs[], mitre_ttps[] }
- `internal_spread`: { hosts[], first_seen, last_seen }
- `yara_hits`: [...]
- `av_hits`: [...]

**典型编排触发**：恶意软件 / 可疑文件落地 / 邮件附件类告警。

**备注**：本地不存在的 Hash 必须先 TI 再沙箱（沙箱昂贵）；签名合法 ≠ 安全（已被吊销、伪造、白利用）。

**示例编排**
- **上游**：B3 进程的 `image_path/hash`、B8 邮件附件、EDR file event。
- **下游**：E3 Hash 信誉、E5 沙箱、C9 沿 `internal_spread.hosts` 横扫。
- 编排片段：
  ```
  f = A7.run(hash=proc.hash)
  if f.reputation.verdict == "malicious":
      affected = C9.run(ioc=f.hashes.sha256)
  ```

---

### A8 · 进程画像  `investigate.entity.process.profile`

**输入**：`process_guid` 或 `(host, pid, start_time)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 进程名、命令行（完整）、父进程、用户上下文、完整性等级 |
| 2 | DS-EDR | 镜像路径、SHA256、签名状态 |
| 3 | DS-EDR | 加载的模块/DLL、注入痕迹 |
| 4 | DS-EDR | 该进程的网络连接 / 文件操作 / 注册表操作（联动 B 类） |
| 5 | 命令行解析 | base64、PowerShell -enc、LOLBin 模式、参数混淆 |
| 6 | DS-TI | 镜像 Hash 信誉 → A7 |
| 7 | 路径黑名单 | %TEMP% / %APPDATA% / Public / Recycle Bin 等可疑路径 |

**输出**
- `identity`: { pid, ppid, name, cmdline, image_path, hash, user, integrity }
- `signature`: { signed, signer, valid, revoked }
- `parent`: { name, cmdline, user } *（往上一层）*
- `behavior_summary`: { net_conn_count, file_op_count, reg_op_count, modules_loaded[] }
- `decoded_cmdline`: { raw, decoded_layers[], suspicious_patterns[] }
- `suspicion_score`: 0-100 + 原因列表

**示例编排**
- **上游**：B3 检出高 suspicion 进程后下钻；EDR 进程告警的 `process_guid`。
- **下游**：A7 镜像 Hash 画像、C3 父子进程链、E7 TTP 映射。
- 编排片段：
  ```
  p = A8.run(process_guid=alert.process_guid)
  if p.suspicion_score >= 70:
      lineage = C3.run(process_guid=p.identity.pid)
      ttps = E7.run(evidence=[{"cmdline": p.identity.cmdline}])
  ```

---

### A9 · 邮件地址画像  `investigate.entity.email.profile`

**输入**：`email_address`, `time_window?`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-HR / DS-IDP | 是否内部员工 → 联动 A1 |
| 2 | DS-EMAIL | 收发历史、过去 30d 邮件量、典型收件人模式 |
| 3 | DS-EMAIL | SPF/DKIM/DMARC 历史通过率 |
| 4 | DS-WHOIS | 域名画像 → A5 |
| 5 | DS-TI | 该邮箱/域是否在恶意名单 |
| 6 | 暗网/泄露库 | 该邮箱是否出现在已知泄露数据 |
| 7 | 字形相似 | 是否仿冒高管/财务/合作方邮箱（CEO Fraud 检测） |

**输出**
- `internal`: bool / employee_ref?
- `volume_30d`: { sent, received }
- `auth_pass_rate`: { spf, dkim, dmarc }
- `domain_profile`: ref → A5
- `breach_exposure`: [ { source, date } ]
- `lookalike_of`: employee? brand?

**示例编排**
- **上游**：B8 邮件 sender / recipient 字段；钓鱼告警。
- **下游**：A5 域名画像（sender domain）、A1 用户画像（若内部）、E11 品牌仿冒。
- 编排片段：
  ```
  ep = A9.run(email_address=msg.sender)
  if ep.lookalike_of:
      dom = A5.run(domain=ep.lookalike_of.brand_domain)
  ```

---

### A10 · 证书画像  `investigate.entity.cert.profile`

**输入**：`cert_sha256` 或 `(host, port)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-WHOIS (CT) | 颁发者、有效期、SAN、签发历史 |
| 2 | DS-NDR / 探针 | 该证书在内网哪些会话出现过 |
| 3 | DS-TI | 是否在恶意证书清单（C2 常用、过期重用） |
| 4 | JA3/JA3S | 客户端/服务端 TLS 指纹关联 |

**示例编排**
- **上游**：B4 中可疑 TLS 会话、NDR 异常 JA3。
- **下游**：A5 域名画像（关联 SAN）、C2 实体图（cert 为边）、E1 信誉。
- 编排片段：
  ```
  cert = A10.run(cert_sha256=ja3_hit.cert_hash)
  for san in cert.sans:
      A5.run(domain=san)
  ```

---

### A11 · 云资源画像  `investigate.entity.cloud_resource.profile`

**输入**：`arn / resource_id`, `cloud_provider`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-CLOUD (Config/Resource) | 资源类型、Tag、所属账户、创建时间、创建者 |
| 2 | DS-CLOUD (IAM) | 关联角色/策略、可访问主体 |
| 3 | DS-CLOUD (Audit) | 近 N 天该资源的 API 操作记录 |
| 4 | DS-CMDB | 关联业务系统、Owner |
| 5 | DS-VULN | 公网暴露面（开放端口/桶 ACL） |
| 6 | DS-CLOUD (Cost) | 异常成本（挖矿/数据外传特征） |

**输出**
- `resource`: { type, arn, account, region, created_by, created_at, tags }
- `iam`: { attached_policies[], assumable_by[] }
- `exposure`: { public, ports[], acl_public_read?, acl_public_write? }
- `recent_activity`: top API calls 摘要

**示例编排**
- **上游**：B9 云 API 告警的 `resource_id`、DS-CLOUD 暴露面扫描。
- **下游**：D1 业务上下文、F2 影响、F8 处置（删 ACL / revoke role）。
- 编排片段：
  ```
  res = A11.run(arn=alert.target_arn, cloud_provider="aws")
  if res.exposure.public:
      F8.run(verdict="TP", recommended=["revoke_public_acl"])
  ```

---

### A12 · 服务账户 / API Key / Token 画像  `investigate.entity.service_account.profile`

**输入**：`key_id` / `access_key` / `service_principal_id` / `token_hash`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-IDP / DS-CLOUD IAM | 所属主体、创建时间、最近使用时间、权限范围 |
| 2 | DS-CMDB | 绑定应用 / Owner |
| 3 | DS-CLOUD (Audit) | 调用频次、典型来源 IP/区域、典型 API 模式 |
| 4 | DS-CODE | 是否在代码仓库被泄露（Secret Scanning） |
| 5 | DS-TI | 是否在已泄露凭据库 |
| 6 | DS-KB | 历史使用基线（地点/UA/API 类型） |

**输出**
- `identity`: { id, owner, created, last_used, scopes[] }
- `usage_baseline`: { typical_ips[], typical_apis[], typical_hours }
- `exposure`: { code_leak?, breach_db? }

**备注**：服务账户的"无 MFA + 长期密钥 + 高权限"三件套是最危险画像。

**示例编排**
- **上游**：B9 云 API 异常 caller、IDP 服务账户告警、代码泄露 webhook。
- **下游**：B9 调用流分析、D5 基线、F8 处置（rotate key / revoke token）。
- 编排片段：
  ```
  sa = A12.run(key_id=alert.access_key)
  if sa.exposure.code_leak or sa.exposure.breach_db:
      F8.run(recommended=["rotate_key"])
  ```

---

### A13 · 移动设备 / BYOD 画像  `investigate.entity.mobile_device.profile`

**输入**：`device_id` / `IMEI` / `UDID`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-MOBILE | OS 版本、合规状态、加密、越狱/Root、Owner |
| 2 | DS-IDP | 绑定账户、登录历史 |
| 3 | DS-EMAIL | 邮件客户端关联、ActiveSync 设备 |
| 4 | DS-CASB | SaaS 访问记录 |

**示例编排**
- **上游**：MDM 告警（越狱/不合规）、IDP 异常设备登录。
- **下游**：A1 绑定用户画像、F8 处置（强制重新合规 / 撤销邮件 ActiveSync）。
- 编排片段：
  ```
  dev = A13.run(device_id=alert.device_id)
  if not dev.mdm.compliant:
      F8.run(recommended=["block_device", "wipe_corp_data"])
  ```

---

### A14 · 数据库账户 / 对象画像  `investigate.entity.db_object.profile`

**输入**：`(db_instance, db_account)` 或 `(db_instance, schema.table)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-DAM | 账户权限、典型查询模式、历史访问 IP/应用 |
| 2 | DS-CMDB | 数据库实例 Owner、业务系统、数据敏感分级 |
| 3 | DS-DAM | 对象的访问频率基线、典型访问者 |
| 4 | DS-DLP | 是否含已识别敏感数据 |

**示例编排**
- **上游**：B10 数据访问告警、DAM 异常 SQL。
- **下游**：D1 业务上下文（敏感分级）、F2 影响（数据泄露 CIA-C 加权）。
- 编排片段：
  ```
  obj = A14.run(db_instance=alert.db, schema_table=alert.table)
  if obj.sensitivity in ("PII","SECRET"):
      F2.run(evidence=[obj], blast="data")
  ```

---

## B. 行为活动类

### B1 · 登录活动调查  `investigate.activity.login`

**输入**：`principal` 或 `(host, time_window)` 或 `source_ip`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-IDP | 登录事件（成功/失败）、登录方式（密码/MFA/SSO/PassKey）、源 IP、UA、设备 |
| 2 | DS-VPN | VPN 接入会话 |
| 3 | DS-CLOUD | 云控制台登录、Console Sign-in 事件 |
| 4 | DS-PAM | 堡垒机登录 |
| 5 | DS-CASB | SaaS 登录 |
| 6 | DS-EDR | 终端本地登录（Windows EventID 4624/4625/4634/4648） |
| 7 | 地理位置库 | 源 IP 地理位置、不可能旅行计算 |

**输出**
- `events`: [ { ts, type, result, src_ip, ua, device, geo, mfa_used } ]
- `summary`: { success, failure, distinct_src_ips, distinct_geos, mfa_pass_rate }
- `anomalies`: [ impossible_travel | new_geo | new_device | brute_force_pattern | mfa_fatigue ]

**典型编排触发**：账户安全告警、暴破、异地登录、MFA 疲劳攻击。

**示例编排**
- **上游**：账户告警（暴破/异地/MFA bypass）；A1 用户画像后置探查。
- **下游**：A4 IP 画像每个 src_ip；D5 基线偏离；D9 地理基线；F1 TP/FP。
- 编排片段：
  ```
  logins = B1.run(principal=user.upn, window=24h)
  for a in logins.anomalies:
      if a.type == "impossible_travel":
          A4.run(ip=a.ip_b)
  ```

---

### B2 · 权限变更调查  `investigate.activity.permission_change`

**输入**：`principal` 或 `(resource, time_window)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-IDP | 组成员变更、角色赋予、特别是高权限组（Domain Admins 等） |
| 2 | DS-CLOUD (IAM) | IAM 策略变更、AssumeRole、CreateAccessKey |
| 3 | DS-PAM | 特权角色申领、紧急授权 |
| 4 | DS-TICKET | 是否有对应的授权变更工单 |
| 5 | DS-EDR | 本地用户/组变更（NetUserAdd / 添加到本地管理员组） |

**输出**
- `changes`: [ { ts, actor, target_principal, change_type, before, after, source_ip } ]
- `unauthorized_changes`: 无对应工单的变更
- `high_risk_changes`: 提权到高敏感组的变更

**示例编排**
- **上游**：IDP 高权限组变更告警、CloudTrail IAM 变更。
- **下游**：D2 用户身份（actor 与 target）、F1 判定（无工单的提权 → 高风险 TP 倾向）。
- 编排片段：
  ```
  ch = B2.run(principal=alert.actor, window=24h)
  if ch.unauthorized_changes:
      F1.run(evidence=[ch])
  ```

---

### B3 · 进程执行调查  `investigate.activity.process.execution`

**输入**：`(host, time_window)` 或 `process_guid`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 进程树（父子链）、命令行、镜像 Hash、签名、用户上下文 |
| 2 | DS-EDR (Sysmon/审计) | EventID 1/3/7/10/11/22（进程/网络/模块/句柄/文件/DNS） |
| 3 | DS-EDR | AppLocker/WDAC 拦截/允许记录 |
| 4 | 命令行解析 | base64 / PowerShell -enc / LOLBin / mshta / regsvr32 模式 |
| 5 | 路径策略 | 可疑路径执行（%TEMP%、Recycle Bin、UNC 路径） |
| 6 | DS-TI | 镜像 Hash 信誉 → A7 |
| 7 | DS-EDR | 内存注入/反射加载/空进程检测 |

**输出**：进程树 + 每节点判定（benign/suspicious/malicious + 原因 + ATT&CK ID）+ IOC 列表

**典型编排触发**：EDR 检测、横向移动假设（找 psexec/wmic/winrm）、持久化假设（找 schtasks/regsvr32）。

**示例编排**
- **上游**：EDR 告警；A2 主机画像产出可疑进程清单；勒索/挖矿/横向调查。
- **下游**：A8 进程画像、C3 进程链、E7 TTP 映射、A7 镜像 Hash。
- 编排片段：
  ```
  procs = B3.run(host=host_id, window=30m)
  for p in procs.tree:
      if p.suspicion >= 70:
          C3.run(process_guid=p.guid)
          E7.run(evidence=[{"cmdline": p.cmdline}])
  ```

---

### B4 · 网络连接调查  `investigate.activity.network.connection`

**输入**：`(host, time_window)` 或 `(src_ip, dst_ip, time_window)` 或 `process_guid`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 进程级出向/入向连接（带 PID 关联） |
| 2 | DS-FW / DS-NDR | 五元组流、会话时长、字节数 |
| 3 | DS-PROXY | HTTP/HTTPS 出向（URL、UA、Referer、SSL SNI） |
| 4 | DS-NDR | 协议异常（端口与协议不匹配、ICMP 隧道、DNS 隧道） |
| 5 | JA3/JA3S 库 | TLS 指纹比对 C2 已知 |
| 6 | 信标行为分析 | 周期性连接（Beacon 检测） |

**输出**
- `connections`: [ { ts, src, dst, proto, port, bytes_in, bytes_out, duration, sni, ua, ja3 } ]
- `top_destinations`: 聚合排序
- `external_summary`: { unique_external_ips, unique_external_domains }
- `anomalies`: [ beacon_detected | port_mismatch | tunnel_indicator | new_external_peer ]

**示例编排**
- **上游**：C2 告警、外联可疑域名、B3 中可疑进程绑定的 PID。
- **下游**：A4 IP / A5 域名 / E1 信誉；C9 受害者扩展。
- 编排片段：
  ```
  conns = B4.run(process_guid=proc.guid, window=60m)
  if any(a.type == "beacon_detected" for a in conns.anomalies):
      for dst in conns.top_destinations[:5]:
          A4.run(ip=dst.ip)
  ```

---

### B5 · DNS 查询调查  `investigate.activity.dns`

**输入**：`(host|user, time_window)` 或 `domain`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-DNS | 该主机/用户的查询历史、查询频次 |
| 2 | DS-NDR | 53 端口流量 / DoH/DoT 检测 |
| 3 | 域名熵分析 | DGA 检测（高熵子域名） |
| 4 | 子域长度/字符 | DNS 隧道检测（超长 TXT/A 记录） |
| 5 | DS-TI | 查询过的域名信誉 |

**输出**
- `queries`: 按域名聚合次数、首次/最近时间
- `anomalies`: [ dga_pattern | tunnel_pattern | doh_bypass | newly_observed_domain ]

**示例编排**
- **上游**：NDR DNS 异常告警；A2 主机基线偏离。
- **下游**：A5 域名画像（查到的 newly_observed_domain）、E2 信誉。
- 编排片段：
  ```
  dns = B5.run(host=host_id, window=24h)
  for d in dns.anomalies:
      if d.type == "dga_pattern":
          A5.run(domain=d.example_domain)
  ```

---

### B6 · 文件操作调查  `investigate.activity.file_op`

**输入**：`(host, time_window)` 或 `(path, time_window)` 或 `process_guid`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 文件创建/修改/删除/重命名事件（含 PID/用户） |
| 2 | DS-FILE | 网络共享/NAS 文件审计 |
| 3 | DS-CLOUD (Object Storage Audit) | S3/OSS/Blob 的对象操作 |
| 4 | 加密熵检测 | 短时间大量高熵改写（勒索特征） |
| 5 | 关键路径监控 | 启动项、计划任务目录、注册表持久化键 |

**输出**
- `events`: [ { ts, op, path, process, user, src_ip? } ]
- `anomalies`: [ mass_encrypt | persistence_path_write | sensitive_file_read ]

**示例编排**
- **上游**：EDR 勒索/数据外传告警；A2 主机告警下钻。
- **下游**：A7 文件 Hash 画像（命中样本）、B15 持久化（持久化路径写入）、F2 影响。
- 编排片段：
  ```
  ops = B6.run(host=host_id, window=10m)
  if "mass_encrypt" in ops.anomalies:
      F2.run(severity_bias="P0")
  ```

---

### B7 · 注册表/系统配置变更  `investigate.activity.config_change`

**输入**：`(host, time_window)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 注册表 Run/RunOnce、Services、Image File Execution Options、AppInit_DLLs |
| 2 | DS-EDR | 启动项、计划任务、WMI 订阅、BITS 作业 |
| 3 | 系统审计（Linux） | crontab、systemd、/etc/rc.local、~/.bashrc、SSH authorized_keys |
| 4 | DS-EDR | 安全配置变更（防火墙规则、安全策略、UAC） |
| 5 | macOS | LaunchAgents/LaunchDaemons、Login Items |

**输出**：变更事件 + 是否命中已知持久化技术（MITRE T1547 系列）

**示例编排**
- **上游**：EDR 注册表/启动项告警；B15 持久化的细化查询。
- **下游**：A8 写入这些键的进程画像、F1 判定（命中 MITRE T1547 加权）。
- 编排片段：
  ```
  cfg = B7.run(host=host_id, window=24h)
  for ch in cfg.persistence_hits:
      A8.run(process_guid=ch.actor_proc)
  ```

---

### B8 · 邮件收发调查  `investigate.activity.email`

**输入**：`(mailbox|address, time_window)` 或 `message_id`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EMAIL | 收发记录、附件、链接、Subject、Header（含 Received 链） |
| 2 | DS-EMAIL | SPF/DKIM/DMARC 结果 |
| 3 | DS-EMAIL | 邮件规则变更（外发转发、自动删除） |
| 4 | DS-EMAIL | 群发模式（同时收件人数、相似主题） |
| 5 | 附件 → A7 | 附件 Hash 画像 |
| 6 | 链接 → A6 | URL 画像与沙箱 |
| 7 | DS-EMAIL | 用户点击/打开 telemetry（如有） |

**输出**
- `messages`: [ { ts, sender, recipients, subject, attachments[], links[], auth_results } ]
- `forwarding_rules_changes`: 关键
- `mass_send_indicator`: 批量发送特征
- `phishing_signals`: { lookalike_sender, suspicious_link, urgency_keywords, ... }

**示例编排**
- **上游**：钓鱼告警、A1 检出 `external_forwarding`、邮件网关上报。
- **下游**：A7 附件 Hash、A6 URL / A5 域名（链接）、F4 IOC。
- 编排片段：
  ```
  emails = B8.run(message_id=alert.message_id)
  for m in emails.messages:
      for l in m.links: A6.run(url=l)
      for a in m.attachments: A7.run(hash=a.hash)
  ```

---

### B9 · 云控制面 API 调查  `investigate.activity.cloud_api`

**输入**：`(principal|access_key, time_window)` 或 `(resource, time_window)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-CLOUD (Audit) | 全部 API 调用：EventName、Source IP、UA、Region、Error |
| 2 | DS-CLOUD (Audit) | 是否使用 AssumeRole 链（角色跳跃） |
| 3 | 基线 → D | 历史 API 模式、典型来源 IP/区域 |
| 4 | 敏感 API 清单 | CreateUser/AttachUserPolicy/PutBucketAcl/Get-Secret 等 |
| 5 | DS-TI | 来源 IP 信誉 |

**输出**
- `events`: 按 API 聚合
- `sensitive_calls`: 高敏感 API 命中
- `anomalies`: [ new_region | new_ua | new_src_ip | role_chain_unusual | enumeration_burst ]

**示例编排**
- **上游**：云控制台异常 API 告警；A12 服务账户告警。
- **下游**：A11 资源画像（被操作 ARN）、D5 基线（caller 历史）、F8 处置（revoke session / block role）。
- 编排片段：
  ```
  api = B9.run(principal=alert.caller, window=24h)
  if api.sensitive_calls or "new_region" in api.anomalies:
      F1.run(evidence=[api])
  ```

---

### B10 · 数据访问调查  `investigate.activity.data_access`

**输入**：`(principal|object, time_window)`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-DAM | SQL 流水：SELECT 行数、表、Where、应用名 |
| 2 | DS-DLP | 敏感数据流出事件（邮件/USB/HTTP/IM） |
| 3 | DS-CASB | SaaS 下载量（OneDrive/Google Drive/飞书云文档） |
| 4 | DS-FILE | 文件服务器大批量下载 |
| 5 | DS-CLOUD (S3/OSS Audit) | 对象读取量、List 操作激增 |
| 6 | DS-PROXY | 大量上传到外部存储（pastebin / wetransfer / 网盘） |

**输出**
- `volume`: { rows, files, bytes } per channel
- `sensitive_hits`: DLP 命中详情
- `anomalies`: [ mass_select | mass_download | external_upload_spike ]

**示例编排**
- **上游**：DLP 告警、DAM 异常 SQL、CASB 大量下载。
- **下游**：A14 数据对象画像、D5/D6 基线、F2 影响（CIA-C）、F8 处置（block_download）。
- 编排片段：
  ```
  access = B10.run(principal=user, window=7d)
  if "mass_select" in access.anomalies:
      A14.run(db_instance=access.top_objects[0])
  ```

---

### B11 · USB / 外设 / 可移动介质  `investigate.activity.removable_media`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | USB 插拔事件、设备 VID/PID、序列号 |
| 2 | DS-DLP | USB 数据写入告警 |
| 3 | DS-EDR | 从 USB 启动的进程 |

**示例编排**
- **上游**：DLP USB 告警；离职员工调查。
- **下游**：D2 离职上下文、F1 判定（结合离职倒计时）、F8 处置（封 USB / 取证）。
- 编排片段：
  ```
  usb = B11.run(host=host_id, window=7d)
  if usb.events and D2.run(principal=user).leaving_in_days < 30:
      F1.run(evidence=[usb])
  ```

---

### B12 · 浏览器活动调查  `investigate.activity.browser`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-PROXY | 完整 URL 历史 |
| 2 | DS-EDR | 浏览器进程下载文件、扩展安装 |
| 3 | DS-EDR | 浏览器凭据存储访问（LSASS 类同等） |
| 4 | DS-CASB | OAuth 授权（第三方应用接入企业账户） |

**示例编排**
- **上游**：钓鱼告警追跟"用户是否点了链接"；OAuth 滥用排查。
- **下游**：B8 收件邮件、A6 URL 画像、B13 OAuth 授权链。
- 编排片段：
  ```
  br = B12.run(user=victim, window=2h)
  if any(c.url in phishing_urls for c in br.clicks):
      F1.run(verdict_bias="TP")
  ```

---

### B13 · SaaS / OAuth 调查  `investigate.activity.saas_oauth`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-IDP | OAuth 授权事件、Application Consent |
| 2 | DS-CASB | SaaS API 调用 |
| 3 | DS-IDP | 异常 OAuth 应用（新创建、罕见、权限过大） |

**备注**：恶意 OAuth 应用授权是 BEC 持久化新型手段（无需密码、绕过 MFA）。

**示例编排**
- **上游**：IDP OAuth 异常授权告警；BEC 调查。
- **下游**：A12 服务账户画像、A1 用户画像（授权方）、F8 处置（revoke consent）。
- 编排片段：
  ```
  oauth = B13.run(user=victim, window=7d)
  for g in oauth.suspicious_grants:
      F8.run(recommended=[{"action":"revoke_oauth","target":g.app_id}])
  ```

---

### B14 · 容器 / Kubernetes 活动  `investigate.activity.container`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | K8s Audit Log (DS-CLOUD/自研) | Pod 创建、exec、port-forward、ServiceAccount 变更 |
| 2 | 容器镜像仓库审计 | 拉取/推送、镜像签名 |
| 3 | DS-EDR (容器化) | 容器内进程/网络 |
| 4 | 镜像扫描 (DS-VULN) | 镜像 CVE / 恶意层 |

**示例编排**
- **上游**：K8s Audit 告警、容器逃逸 EDR 告警。
- **下游**：A11 云资源画像（Pod/Cluster）、B16 凭据访问（容器内 token 窃取）。
- 编排片段：
  ```
  k8s = B14.run(cluster=alert.cluster, window=1h)
  if k8s.exec_in_prod_pod:
      F2.run(severity_bias="+1")
  ```

---

### B15 · 持久化点变更  `investigate.activity.persistence`

**目的**：B7 的"已知持久化技术"特化视图，覆盖 ATT&CK Persistence (TA0003)。

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 服务安装、计划任务、Run 键、Logon 脚本、AppInit_DLLs |
| 2 | DS-EDR | WMI Event Subscription |
| 3 | DS-EDR | BITS Job |
| 4 | DS-EDR | DLL Search Order Hijack 候选 |
| 5 | DS-IDP | Logon Script / Group Policy 修改 |
| 6 | DS-EMAIL | 邮件规则、外发转发 |
| 7 | Linux/macOS | crontab、systemd、launchd、authorized_keys、shell rc |

**示例编排**
- **上游**：EDR 持久化告警；B17 后续追跟"攻击者是否留后门"。
- **下游**：B7 注册表细化、C4 Kill-chain 阶段（Persistence）、F8 处置（清除持久化项）。
- 编排片段：
  ```
  per = B15.run(host=host_id, window=24h)
  if per.hits:
      C4.run(evidence=[per])
  ```

---

### B16 · 凭据访问调查  `investigate.activity.credential_access`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | LSASS 访问（特别是非系统进程） |
| 2 | DS-EDR | SAM/SECURITY/SYSTEM 注册表导出 |
| 3 | DS-EDR | NTDS.dit / shadow 访问 |
| 4 | DS-EDR | Mimikatz / ProcDump / comsvcs.dll 特征 |
| 5 | DS-EDR | 浏览器凭据库访问、Keychain 访问 |
| 6 | DS-EDR | Kerberoasting / AS-REP Roasting 特征 |
| 7 | DS-IDP | Golden/Silver Ticket 异常（KRBTGT 使用、TGT 异常生命周期） |

**示例编排**
- **上游**：EDR LSASS/Mimikatz 告警；横向移动调查前置（找凭据来源）。
- **下游**：C5 横向移动追踪（用 dumped 凭据）、F8 处置（重置受影响账户密码 / KRBTGT）。
- 编排片段：
  ```
  cred = B16.run(host=host_id, window=24h)
  if cred.dumped_accounts:
      C5.run(seed_host=host_id, accounts=cred.dumped_accounts)
  ```

---

### B17 · 防御规避调查  `investigate.activity.defense_evasion`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR / DS-SIEM | 日志清除事件（EventID 1102/104） |
| 2 | DS-AV / DS-EDR | AV/EDR 服务停止、卸载、驱动卸载 |
| 3 | DS-EDR | Defender 排除项添加、AMSI Bypass 模式 |
| 4 | DS-FW / DS-EDR | 安全策略关闭、防火墙规则放通 |
| 5 | DS-EDR | 时间戳篡改 (Timestomp)、文件隐藏 |

**示例编排**
- **上游**：EDR/AV 自身被关停告警、日志清除事件 1102。
- **下游**：F1 判定（防御规避是 TP 强信号）、F2 影响（攻击者已驻留）、G8 escalate。
- 编排片段：
  ```
  ev = B17.run(host=host_id, window=24h)
  if ev.av_killed or ev.log_cleared:
      F1.run(verdict_bias="TP")
  ```

---

## C. 关联推理类

### C1 · 时间窗共现  `investigate.relation.timeline.cooccurrence`

**目的**：给定一个锚点事件，找出 ±N 时间窗内与之相关的事件（同主机/同用户/同 IP/同进程链）。

**输入**：`anchor_event`, `window`, `pivot_keys[]` (default: host, user, ip)

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-SIEM | 全文 + 字段聚合查询，按 pivot key 关联 |
| 2 | DS-EDR | 同主机时间窗事件 |
| 3 | DS-NDR | 同会话/同对端时间窗事件 |
| 4 | 多告警库 (DS-KB) | 同时间窗其他告警 |

**输出**：相关事件按时间排序的列表 + pivot key 分组聚合

**示例编排**
- **上游**：任何"以告警 ts ± window 找其他线索"的步骤；F6 时间线重建的底层原语。
- **下游**：F6 时间线、F1 旁证。
- 编排片段：
  ```
  related = C1.run(anchor={"ts":alert.ts,"host":alert.host},
                   window=600s, pivots=["host","user","ip"])
  ```

---

### C2 · 实体关系图  `investigate.relation.entity_graph`

**目的**：从一个核心实体出发，扩展 N-hop 邻居图（user↔host↔ip↔process↔file↔domain）。

**输入**：`seed_entity`, `depth` (default 2), `edge_types[]`

  

| # | 数据源 | 边类型 |
|---|---|---|
| 1 | DS-IDP | user → group, user → host (logon) |
| 2 | DS-CMDB | user ↔ host (owner), host ↔ business |
| 3 | DS-EDR | host → process → file/hash, host → ip |
| 4 | DS-IPAM | ip ↔ host (时间窗) |
| 5 | DS-DNS | host → domain → ip |
| 6 | DS-EMAIL | user → email_address → external_email |

**输出**：节点 + 边 + 每条边的证据 ref

**示例编排**
- **上游**：调查中后期需要画图评估爆炸半径；F2 影响前置。
- **下游**：F2 影响（按 nodes by kind）、C5 横向路径回溯。
- 编排片段：
  ```
  g = C2.run(seed={"kind":"user","id":alert.user}, depth=2)
  affected_users = [n for n in g.nodes if n.kind=="user"]
  ```

---

### C3 · 父子进程链回溯  `investigate.relation.process_lineage`

**输入**：`process_guid`

**去哪里查**：DS-EDR（向上回溯到 root/wininit/systemd；向下展开所有子孙）

**输出**：完整 lineage tree

**示例编排**
- **上游**：B3 高 suspicion 进程定位；A8 进程画像下钻。
- **下游**：E7 TTP（在 lineage 上识别 LOLBin 链）、F9 根因（推断初始入口）。
- 编排片段：
  ```
  lin = C3.run(process_guid=p.guid)
  root = lin.root  # 通常是文档/脚本/服务，是初始 access vector
  ```

---

### C4 · Kill-chain / ATT&CK 阶段定位  `investigate.relation.killchain_stage`

**目的**：基于已收集的所有证据，定位攻击在 Lockheed Kill-Chain 与 MITRE ATT&CK 中的阶段。

**输入**：`evidence_set[]`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | MITRE ATT&CK 知识库 | TTP 映射、Tactic 分类 |
| 2 | 已收集证据 | 命令行/工具/行为 → TTP 推断 |
| 3 | DS-KB | 类似 TTP 组合的历史攻击家族 |

**输出**：`{ kill_chain_phases: [], mitre_ttps: [], attribution_hint: family? }`

**示例编排**
- **上游**：证据收集完成后；F3 攻击阶段总结的底层。
- **下游**：F3 完整 Kill-chain 输出、E9 归因尝试、F8 处置（按 tactic 分剧本）。
- 编排片段：
  ```
  kc = C4.run(evidence=evidence_set)
  if "C2" in kc.kill_chain_phases:
      F8.run(recommended=["block_ip","isolate_host"])
  ```

---

### C5 · 横向移动路径追踪  `investigate.relation.lateral_movement`

**目的**：还原"从哪台机器走到了哪台机器"。

**输入**：`seed_host`, `direction: forward|backward|both`, `time_window`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-IDP | Logon EventID 4624 Type 3 (Network) / 10 (RDP) / 7 (Unlock) |
| 2 | DS-EDR | psexec / WMI / WinRM / SSH / SMB 调用 |
| 3 | DS-EDR | 凭据派生：使用同一账户在多机登录 |
| 4 | DS-NDR | RDP/SMB/WinRM/SSH 横向会话 |
| 5 | DS-IDP | Pass-the-Hash / Overpass-the-Hash 特征（NTLM 异常） |

**输出**：移动路径图 + 每跳证据

**示例编排**
- **上游**：EDR 异常远程登录、B16 凭据访问命中。
- **下游**：C2 实体图扩展、C9 victim expansion、F2 影响（已扩散主机）、F8 批量隔离。
- 编排片段：
  ```
  lm = C5.run(seed_host=host_id, direction="both", window=24h)
  affected = lm.reached_hosts
  ```

---

### C6 · 扇出/扇入分析  `investigate.relation.fanout_fanin`

**目的**：识别"一个实体辐射到多个" 或 "多个实体汇聚到一个" 的异常模式。

**示例**：单一源 IP → N 个内部用户登录（扫描/暴破）；N 个内部主机 → 单一外部 IP（C2 汇聚）。

**输入**：`pivot_entity`, `direction`, `threshold`

**去哪里查**：DS-SIEM/DS-NDR/DS-IDP 按 pivot 聚合计数

**示例编排**
- **上游**：暴破/凭据填充告警、C2 告警 fan-in 怀疑。
- **下游**：F1 判定（明显 fanout 模式 → TP）、F8 处置（封 pivot 实体）。
- 编排片段：
  ```
  fan = C6.run(pivot=alert.src_ip, direction="fanout", threshold=20)
  if fan.distinct_targets > threshold:
      F8.run(recommended=["block_ip"])
  ```

---

### C7 · 同源事件聚合  `investigate.relation.same_origin`

**目的**：基于 IOC/TTP/Source，聚合"同一波攻击"的事件。

**去哪里查**：DS-KB / DS-SIEM 按 IOC 集合检索

**示例编排**
- **上游**：F4 IOC 提取后，回查"这套 IOC 是否在过去多次出现"。
- **下游**：G4 历史相似告警、E9 APT 归因。
- 编排片段：
  ```
  cluster = C7.run(iocs=ioc_set, window=90d)
  if cluster.alert_count > 5:
      E9.run(evidence=cluster.matched_ttps)
  ```

---

### C8 · 跨数据源拼接  `investigate.relation.cross_source_join`

**目的**：将 EDR / NDR / IdP / Cloud 事件按时间戳与共享 key 拼接成一条完整故事。

**输入**：`time_window`, `join_keys[] = [user, host, ip, process]`

**输出**：归一化时间线（同一秒内事件按数据源排序）

**备注**：时钟漂移是常见坑，能力应主动补偿（±N 秒模糊匹配）。

**示例编排**
- **上游**：F6 时间线重建需要跨源拼接；调查报告前置。
- **下游**：F6 输出、报告生成 F10。
- 编排片段：
  ```
  timeline = C8.run(window=alert.window, join_keys=["user","host"])
  ```

---

### C9 · 受害者集合扩展  `investigate.relation.victim_expansion`

**目的**：基于已知 IOC/TTP，找出"还有谁也被打了"。

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-EDR | 同 Hash 出现的所有主机 |
| 2 | DS-NDR / DS-PROXY | 访问过同一恶意域/IP 的所有主机 |
| 3 | DS-EMAIL | 收到同模板钓鱼邮件的所有员工 |
| 4 | DS-IDP | 同源 IP 登录尝试过的所有账户 |

**示例编排**
- **上游**：F4 IOC 提取后；钓鱼/挖矿/勒索告警都强依赖。
- **下游**：F7 受影响实体清单、F8 批量处置。
- 编排片段：
  ```
  victims = C9.run(iocs=[mal_hash, c2_domain])
  F7.run(victims=victims)
  ```

---

### C10 · 异常路径检测  `investigate.relation.rare_path`

**目的**：基于图算法识别"罕见但有效"的连接路径（如：财务账户 → 通过 jump host → 直接访问研发代码库）。

**去哪里查**：DS-IDP / DS-CMDB 构建访问图，与历史 30/90 天基线对比

**示例编排**
- **上游**：D6 同组基线发现偏离；内幕威胁深度调查。
- **下游**：F1 判定（罕见路径 → 高风险）、G2 反证（这条路径是否有合理业务原因）。
- 编排片段：
  ```
  rp = C10.run(actor=user, window=90d)
  if rp.unusual_paths:
      G2.run(hypothesis="malicious_lateral")
  ```

---

## D. 上下文与基线类

### D1 · 资产业务上下文  `investigate.context.asset_business`

**目的**：回答"这台资产对业务多重要、出问题影响多大"。

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-CMDB | 业务系统、所属业务线、重要性等级（C/B/A/S）、SLA |
| 2 | DS-CMDB | 上下游依赖关系、影响半径估算 |
| 3 | DS-TICKET | 当前是否在维护窗、有无关联变更 |

**输出**：`{ business_unit, criticality, sla, dependencies[], in_maintenance }`

**示例编排**
- **上游**：A2 主机画像之后；F2/F8 决策前的"动它损失多大"评估。
- **下游**：F2 影响、F8 处置（critical 资产强制 `requires_approval=true`，避开维护窗）。
- 编排片段：
  ```
  biz = D1.run(asset_id=host.asset.id)
  if biz.in_maintenance:
      verdict_hint = "BP_candidate"
  ```

---

### D2 · 用户身份上下文  `investigate.context.user_identity`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-HR | 在职/离职/试用期、入职日、（计划）离职日 |
| 2 | DS-HR | 部门、岗位、汇报线、是否高管/VIP |
| 3 | DS-HR | 是否合同工/外包/实习生 |
| 4 | DS-IDP | 账户类型（员工/服务/外部协作） |
| 5 | 观察名单 | 离职倒计时 30d 名单、合规观察名单 |

**输出**：`{ status, leaving_in_days?, role_class: full_time|contractor|intern|vendor, vip, watchlist[] }`

**备注**：离职倒计时 30d 是 Insider Threat 高发窗口。

**示例编排**
- **上游**：A1 用户画像产出 principal 后。
- **下游**：F1 加权、F2 严重性提档、F8 选剧本（VIP/离职/普通走不同路径）。
- 编排片段：
  ```
  uctx = D2.run(principal=user.identity.employee_id)
  if uctx.vip or uctx.watchlist:
      severity_bias = "+1"
  ```

---

### D3 · 漏洞暴露上下文  `investigate.context.vulnerability`

  

| # | 数据源 | 查什么 |
|---|---|---|
| 1 | DS-VULN | 主机/资产的 CVE 清单（含 CVSS、EPSS） |
| 2 | DS-VULN | 是否暴露公网 |
| 3 | DS-TI | 命中已知在野利用 EXP 的 CVE |
| 4 | DS-TICKET | 修复工单状态 |

**输出**：`{ critical_cves[], exploitable_in_wild[], internet_facing, patch_status }`

**示例编排**
- **上游**：A2/A3 主机画像后；漏洞利用告警前置。
- **下游**：F2 影响（已知在野利用 + 暴露公网 → 严重性飙升）、F8 处置（紧急打补丁）。
- 编排片段：
  ```
  v = D3.run(asset_id=host.asset.id)
  if v.exploitable_in_wild and v.internet_facing:
      F2.run(severity="P0")
  ```

---

### D4 · 补丁 / 合规状态  `investigate.context.compliance`

**去哪里查**：DS-EDR (补丁清单)、DS-MOBILE、DS-VULN、合规扫描

**输出**：`{ os_patch_age_days, missing_kbs[], compliance_score, failed_baselines[] }`

**示例编排**
- **上游**：合规扫描周期任务；告警涉及"补丁未打"假设时。
- **下游**：F8 处置（强制补丁/隔离不合规设备）、F11 检测改进（基线监控点）。
- 编排片段：
  ```
  comp = D4.run(asset_id=host.asset.id)
  if comp.compliance_score < 60:
      F8.run(recommended=["enforce_patch"])
  ```

---

### D5 · 自身历史基线  `investigate.context.baseline.self`

**目的**：该实体（用户/主机/账户）在过去 30/90 天的"正常"画像。

  

| 维度 | 数据源 | 查什么 |
|---|---|---|
| 登录时段 | DS-IDP | hour-of-day 直方图 |
| 登录地点 | DS-IDP | top countries/cities |
| 登录设备 | DS-IDP | top devices/UAs |
| 访问应用 | DS-CASB/DS-IDP | top apps |
| 进程基线 | DS-EDR | 该主机典型进程白名单 |
| 网络对端 | DS-NDR | 该主机典型外联目标 |
| 数据量 | DS-DAM/DS-DLP | 典型查询/下载量 |

**输出**：每个维度的基线统计 + 当前事件偏离度

**示例编排**
- **上游**：B1/B3/B4/B9/B10 检出 anomaly 后；F1 不确定时补证据。
- **下游**：F1 用 deviation 加权；G1 假设生成。
- 编排片段：
  ```
  base = D5.run(entity={"kind":"user","id":user}, dimensions=["geo","hour","device"])
  if base.geo.deviation > 3.0:
      F1.run(evidence_with="new_geo")
  ```

---

### D6 · 同组对等基线  `investigate.context.baseline.peer`

**目的**：把该实体与"同部门/同岗位/同主机组"对比。

**去哪里查**：D5 同源，但对组聚合而非个体

**输出**：偏离度（z-score / percentile）

**示例**：财务部所有人都不访问 GitHub，唯独此人访问——异常。

**示例编排**
- **上游**：D5 自身基线显示偏离后，二次验证；内幕威胁调查。
- **下游**：F1 判定（同组都不做、唯独此人做 → 强 TP 信号）。
- 编排片段：
  ```
  peer = D6.run(actor=user, dim="github_access")
  if peer.zscore > 3:
      F1.run(evidence=[peer])
  ```

---

### D7 · 全组织罕见度  `investigate.context.rarity_global`

**目的**："这件事在全公司过去 N 天发生过几次？"

**去哪里查**：DS-SIEM 全量聚合

**示例**：执行 `rundll32 javascript:...` 这种命令行模式 → 90 天全公司 0 次 → 极罕见 → 高优。

**示例编排**
- **上游**：B3 出现罕见命令行后；判定前置。
- **下游**：F1 判定（90 天全公司 0 次 → 极罕见 → 高优）。
- 编排片段：
  ```
  rar = D7.run(pattern="rundll32 javascript:", window=90d)
  if rar.global_count == 0:
      F1.run(rarity_bias="high")
  ```

---

### D8 · 业务时间窗  `investigate.context.business_hours`

**输入**：`actor`, `event_time`

**去哪里查**：DS-HR (work_schedule)、DS-CMDB (maintenance_window)

**输出**：`{ is_work_hour, is_maintenance_window, work_schedule_class }`

**示例编排**
- **上游**：任何"非工作时间操作"假设；F1 判定前置。
- **下游**：F1 加权（非工作时间 + 敏感操作 → TP 倾向；维护窗 → BP 倾向）。
- 编排片段：
  ```
  bh = D8.run(actor=user, event_time=alert.ts)
  if not bh.is_work_hour:
      F1.run(time_bias="off_hours")
  ```

---

### D9 · 地理位置基线  `investigate.context.geo`

**去哪里查**：DS-IDP、地理位置库

**输出**：`{ current_geo, baseline_geos[], impossible_travel: {prev_event, distance_km, hours_apart, max_feasible_speed} }`

**示例编排**
- **上游**：B1 登录异常告警；账户安全调查。
- **下游**：F1 不可能旅行 → 强 TP 信号、F8（强制 MFA/重置）。
- 编排片段：
  ```
  geo = D9.run(principal=user, event_time=alert.ts)
  if geo.impossible_travel:
      F1.run(verdict_bias="TP")
  ```

---

### D10 · 设备指纹基线  `investigate.context.device_fingerprint`

**去哪里查**：DS-IDP (UA, device_id)、DS-MOBILE

**输出**：`{ device, ua, is_new_device, is_new_ua, baseline_devices[] }`

**示例编排**
- **上游**：B1 登录异常告警、IDP 新设备登录告警。
- **下游**：F1 加权（新设备 + 异地 → TP）、F8（强制重新认证）。
- 编排片段：
  ```
  dev = D10.run(principal=user, event_time=alert.ts)
  if dev.is_new_device and dev.is_new_ua:
      F8.run(recommended=["force_reauth"])
  ```

---

### D11 · 网络位置基线  `investigate.context.network_origin`

**去哪里查**：DS-IDP / DS-VPN / DS-CASB 中的源 IP/ASN 历史

**输出**：`{ src_asn, baseline_asns[], is_new_asn, vpn_proxy_tor_flags }`

**示例编排**
- **上游**：B1 登录异常告警；远程接入审计。
- **下游**：F1 加权（VPN/Tor/代理 IP + 敏感账户 → TP）。
- 编排片段：
  ```
  net = D11.run(principal=user, event_time=alert.ts)
  if net.vpn_proxy_tor_flags.tor:
      F1.run(verdict_bias="TP")
  ```

---

## E. 外部情报类

### E1 · IP 信誉  `investigate.intel.ip.reputation`

**输入**：`ip`

**去哪里查**：DS-TI（多源聚合）、本地黑/白名单、社区/OSINT

**输出**：`{ verdict, score, sources: [{name, verdict, tags, last_seen}], asn_reputation, geo_reputation }`

**备注**：多源不一致时返回所有源结论；上层做加权决策。

**示例编排**
- **上游**：A4 IP 画像确定 IP 为外部；B4 外联 IP。
- **下游**：F1 判定、F4 IOC。
- 编排片段：
  ```
  rep = E1.run(ip="1.2.3.4")
  if rep.verdict in {"malicious","suspicious"}:
      evidence.append(rep)
  ```

---

### E2 · 域名/URL 信誉  `investigate.intel.domain_url.reputation`

**去哪里查**：DS-TI、域名分类引擎、内部黑名单

**输出**：`{ verdict, categories: [phishing|c2|malware|gambling|...], age_days, first_seen }`

**示例编排**
- **上游**：B8 邮件链接、B5 DNS 查询、proxy 日志 URL。
- **下游**：F1 判定、F4 IOC。
- 编排片段：
  ```
  r = E2.run(target=url, kind="url")
  if r.verdict == "malicious":
      ioc_set.add(url)
  ```

---

### E3 · 文件 Hash 信誉  `investigate.intel.hash.reputation`

**去哪里查**：DS-TI、本地命中库、AV 引擎聚合

**输出**：`{ verdict, family?, av_detection_ratio, first_submission, similar_samples[] }`

**示例编排**
- **上游**：B3 进程 hash、B8 邮件附件 hash、A7 文件画像。
- **下游**：F1 判定、F4 IOC、E5 沙箱（family 未知再 detonate）。
- 编排片段：
  ```
  hr = E3.run(hash=h)
  if hr.av_detection_ratio > 0.3:
      evidence.append(hr)
  ```

---

### E4 · WHOIS / pDNS / CT 历史  `investigate.intel.domain.history`

**去哪里查**：DS-WHOIS（DomainTools / SecurityTrails / crt.sh / 微步）

**输出**：注册历史、解析历史、证书历史、关联同注册人/同邮箱的域名

**示例编排**
- **上游**：A5 域名画像深挖；APT 归因调查。
- **下游**：E9 归因、C7 同源事件（同注册人下其他域名）。
- 编排片段：
  ```
  hist = E4.run(domain="evil.com")
  for d in hist.same_registrant_domains:
      A5.run(domain=d)
  ```

---

### E5 · 沙箱动态分析  `investigate.intel.sandbox.detonate`

**输入**：`file_bytes` 或 `url`

**去哪里查**：DS-SANDBOX

**输出**：完整动态行为报告（进程/文件/注册表/网络/注入/ATT&CK TTP）

**备注**：沙箱昂贵且慢，编排上应先 E3/E2，未知再引爆。

**示例编排**
- **上游**：A7/A6/E3/E2 显示未知或低置信度时。
- **下游**：F4 IOC（从沙箱报告提取 net_iocs / dropped_files）、E7 TTP。
- 编排片段：
  ```
  if e3_result.verdict == "unknown":
      box = E5.run(file=sample_bytes)
      F4.run(evidence=[box])
  ```

---

### E6 · YARA / Sigma 规则回查  `investigate.intel.rule.match`

**输入**：`artifact (file/process/log)`, `ruleset?`

**去哪里查**：本地 YARA/Sigma 规则库、社区规则

**输出**：命中规则列表 + 规则元数据（家族/TTP/作者）

**示例编排**
- **上游**：A7 文件画像、B3 进程行为日志。
- **下游**：F1 判定（YARA 命中 + 行为 → 强 TP 信号）、E9 家族归因。
- 编排片段：
  ```
  hits = E6.run(artifact=file_bytes, ruleset="malware")
  if hits:
      F1.run(evidence=hits)
  ```

---

### E7 · TTP → MITRE ATT&CK 映射  `investigate.intel.ttp.mitre`

**输入**：`evidence_set[]`（命令行、行为、IOC）

**去哪里查**：MITRE ATT&CK 知识库 + 本地映射库

**输出**：`{ ttps: [{id, name, tactic, confidence, evidence_ref}] }`

**示例编排**
- **上游**：B3 进程列表 / C3 进程链。
- **下游**：C4 Kill-chain 阶段、F1 判定、F8（按 tactic 选剧本）。
- 编排片段：
  ```
  ttps = E7.run(evidence=[{"cmdline": p.cmdline} for p in procs.tree])
  tactics = {t.tactic for t in ttps.ttps}
  ```

---

### E8 · 漏洞情报  `investigate.intel.cve`

**输入**：`cve_id` 或 `(product, version)`

**去哪里查**：NVD / 微步 / CISA KEV / EPSS / 商业 TI

**输出**：`{ cvss, epss, kev: bool, exploit_available, patch_available, exploited_in_wild, related_apt[] }`

**示例编排**
- **上游**：A2/A3 暴露面发现 CVE；D3 漏洞上下文需要外部加权。
- **下游**：F2 影响（KEV/在野利用 → P0/P1）、F8 处置（紧急补丁/隔离）。
- 编排片段：
  ```
  cve = E8.run(cve_id="CVE-2024-XXXX")
  if cve.kev or cve.exploited_in_wild:
      F2.run(severity="P0")
  ```

---

### E9 · APT / 家族归因  `investigate.intel.attribution`

**输入**：`evidence_set[]`

**去哪里查**：DS-TI（家族库）、DS-KB（内部历史）

**输出**：`{ candidate_actors: [{name, confidence, matched_ttps[], matched_iocs[]}] }`

**备注**：归因谨慎，必须返回置信度而非确定结论。

**示例编排**
- **上游**：F4 IOC 提取 + E7 TTP 集合后；高严重性事件复盘。
- **下游**：F5 攻击者画像、F10 报告（含归因段落，标注置信度）、G8 escalate。
- 编排片段：
  ```
  attr = E9.run(evidence=evidence_set)
  if attr.candidate_actors and attr.candidate_actors[0].confidence > 0.7:
      F10.run(include="attribution")
  ```

---

### E10 · 凭据/数据泄露查询  `investigate.intel.breach`

**输入**：`email|domain|password_hash`

**去哪里查**：DS-TI（HIBP / 微步泄露库 / 暗网监控）

**输出**：`{ found_in_breaches: [{source, date, fields_leaked[]}] }`

**示例编排**
- **上游**：B1 暴破告警、A12 服务账户疑似泄露、A9 邮件画像。
- **下游**：F1 判定（在已知泄露库 → 凭据填充嫌疑）、F8（强制重置）。
- 编排片段：
  ```
  br = E10.run(email=user.email)
  if br.found_in_breaches:
      F8.run(recommended=["force_password_reset"])
  ```

---

### E11 · 品牌/钓鱼仿冒情报  `investigate.intel.brand_lookalike`

**输入**：`domain|email|url`

**去哪里查**：字形相似算法 + DS-WHOIS + 内部品牌资产清单

**输出**：`{ targets: [brand_or_employee], technique: punycode|typo|homoglyph|combosquat, similarity }`

**示例编排**
- **上游**：A5/A6/A9 检测仿冒；钓鱼/BEC 调查。
- **下游**：F1 判定（高仿冒分 + 新域 → 强 TP）、F4 IOC、F8（屏蔽仿冒域）。
- 编排片段：
  ```
  look = E11.run(domain="c0rp-login.com")
  if look.targets and look.similarity > 0.9:
      F8.run(recommended=["block_domain"])
  ```

---

### E12 · 供应链 / 第三方风险情报  `investigate.intel.supply_chain`

**输入**：`vendor|library|package`

**去哪里查**：DS-TI、SBOM、依赖扫描、npm/pypi 等仓库告警

**输出**：`{ known_compromises, recent_advisories, version_risk }`

**示例编排**
- **上游**：CI/CD 告警、SBOM 扫描出新 advisory。
- **下游**：D3 漏洞上下文、F8（升级/回滚组件）、F11 检测改进（添加供应链监控）。
- 编排片段：
  ```
  sc = E12.run(package="left-pad", version="1.3.0")
  if sc.known_compromises:
      F8.run(recommended=["pin_version", "audit_usage"])
  ```

---

## F. 判定与产出类

### F1 · 真/假阳性判定  `investigate.verdict.tp_fp`

**输入**：`evidence_set[]`, `policy?`

**逻辑**：基于收集到的所有原子能力输出，给出判定 + 置信度 + 关键理由 + 反证（避免单边判定）。

**输出**：`{ verdict: TP|FP|BP|INC, confidence, key_reasons[], counter_evidence[], remaining_uncertainties[] }`

**备注**：BP = Benign Positive（行为确认但合法），INC = Inconclusive（证据不足）。

**示例编排**
- **上游**：调查链收口；所有 A/B/C/D/E 类能力跑完后调用一次。
- **下游**：F2/F4/F8/G4 都依赖本结果；INC 时回到 G3 推下一步。
- 编排片段：
  ```
  v = F1.run(evidence=[u, e, r, p])
  if v.verdict == "INC":
      nxt = G3.run(current_state=state)
  ```

---

### F2 · 严重性 / 影响范围评估  `investigate.verdict.impact`

**逻辑**：综合资产重要性（D1）、用户身份（D2）、扩散范围（C9）、Kill-chain 阶段（C4）。

**输出**：`{ severity: P0-P4, impact: { confidentiality, integrity, availability }, blast_radius: {hosts, users, data} }`

**示例编排**
- **上游**：F1 出 TP/BP 后；D1/D2/C2/C9 输入完整后。
- **下游**：F8（按 severity 决定 `requires_approval` / 通知 oncall）、F10 报告。
- 编排片段：
  ```
  imp = F2.run(verdict=v.payload, asset_ctx=biz, user_ctx=uctx,
               affected=graph.nodes)
  if imp.severity in {"P0","P1"}: page_oncall()
  ```

---

### F3 · 攻击阶段总结  `investigate.verdict.kill_chain`

**输出**：完整 Kill-chain 重构 + 每阶段证据 ref + 当前推进位置

**示例编排**
- **上游**：C4 Kill-chain 阶段定位 + F6 时间线后。
- **下游**：F10 报告、F11 检测改进（针对薄弱阶段加规则）。
- 编排片段：
  ```
  kc = F3.run(evidence=evidence_set)
  F11.run(weak_stages=[s for s in kc.phases if s.detection_gap])
  ```

---

### F4 · IOC 提取与标准化  `investigate.verdict.ioc_extract`

**输入**：本次调查所有证据

**输出**：标准化 STIX 2.1 / MISP 格式 IOC 集合（IP/域名/Hash/URL/Email/Mutex/Cert/...），带置信度与 TTL。

**示例编排**
- **上游**：所有产生外部 artifact 的能力（A4/A5/A7/B3/B4/B8）。
- **下游**：F8 `block_ip`/`block_domain`、外部 TI 平台共享、C9 victim expansion。
- 编排片段：
  ```
  iocs = F4.run(evidence=[u, email, url])
  push_to_blocklist(iocs)
  ```

---

### F5 · 攻击者画像  `investigate.verdict.actor_profile`

**输出**：`{ ttp_pattern, sophistication, motivation_hint, attribution_candidates[] }`

**示例编排**
- **上游**：E9 归因尝试 + F3 kill-chain 重构后。
- **下游**：F10 报告、E9 加权、长期检测策略。
- 编排片段：
  ```
  actor = F5.run(evidence=evidence_set, attribution=attr)
  F10.run(actor_profile=actor)
  ```

---

### F6 · 时间线重构  `investigate.verdict.timeline_reconstruction`

**输出**：标准化时间线（按秒/毫秒排序、跨数据源、含证据 ref）+ "首次活动 / 关键节点 / 当前最新"

**示例编排**
- **上游**：C1 共现 + C8 跨源拼接的输出。
- **下游**：F10 报告（管理层版用关键节点；技术版用全时间线）、F11 检测改进。
- 编排片段：
  ```
  tl = F6.run(evidence=evidence_set)
  report_sections["timeline"] = tl.key_moments
  ```

---

### F7 · 受影响实体清单  `investigate.verdict.affected_entities`

**输出**：`{ hosts[], users[], accounts[], data_objects[], cloud_resources[] }` 含命中证据。

**示例编排**
- **上游**：C9 受害者扩展、C2 实体图。
- **下游**：F8 处置（按实体批量动作）、F10 合规通报（含受影响数据主体清单）。
- 编排片段：
  ```
  aff = F7.run(evidence=evidence_set)
  for h in aff.hosts: F8.run(target=h, action="isolate_host")
  ```

---

### F8 · 处置建议生成  `investigate.verdict.response_recommendation`

**输入**：F1/F2/F7 + 企业处置策略库

**输出**（分级）
- `containment`: [ isolate_host | disable_account | reset_password | revoke_token | block_ip | quarantine_file ]
- `eradication`: [ remove_persistence | reimage | patch_cve ]
- `recovery`: [ restore_backup | re-enable_account ]
- `evidence_preservation`: [ memory_dump | disk_image | log_export ]

每项含：目标实体、命令/接口预览、预估业务影响、风险/不确定性、是否需要审批。

**备注**：原子能力**只给建议**，是否执行由编排层 + 人决定。

**示例编排**
- **上游**：F1 出 TP/BP + F2 出 severity 后；调查链最后一步。
- **下游**：SOAR / 工单消费 actions；高 severity 触发审批工作流。
- 编排片段：
  ```
  resp = F8.run(verdict=v, impact=imp, affected={"users":[u],"hosts":[h]})
  for a in resp.containment:
      send_for_approval(a) if a.requires_approval else soar.execute(a)
  ```

---

### F9 · 根因 / 初始入口点定位  `investigate.verdict.root_cause`

**输出**：`{ initial_access_vector: phishing|exploit|valid_creds|supply_chain|insider, evidence_chain[] }`

**示例编排**
- **上游**：完整调查链证据 + C3 进程链 root + B8 邮件入口。
- **下游**：F10 报告（含根因段落）、F11 检测改进（在根因处补检测）。
- 编排片段：
  ```
  rc = F9.run(evidence=evidence_set)
  if rc.initial_access_vector == "phishing":
      F11.run(uplift_area="email_gateway")
  ```

---

### F10 · 通报材料生成  `investigate.verdict.report`

**输出**：
- 管理层版本（结论 + 影响 + 行动）
- 技术版本（完整时间线 + IOC + TTP + 取证证据）
- 合规版本（法规要求字段：监管报告、隐私事件通知）
- 法务取证版本（证据链与保全说明）

**示例编排**
- **上游**：所有 F 类输出 + G7 隐私守门后。
- **下游**：法务/管理层/合规通报对应渠道；G7 必先于本节生效。
- 编排片段：
  ```
  redacted = G7.run(payload=full_state, caller_role="exec")
  rep = F10.run(state=redacted, audience="executive")
  ```

---

### F11 · 检测改进建议  `investigate.verdict.detection_uplift`

**输出**：
- 新增/调整的 Sigma/SIEM 规则草案
- EDR 检测策略建议
- 应当加入基线监控的字段
- 培训/意识改进点（如钓鱼演练专题）

**示例编排**
- **上游**：F1/F9 出结论后；季度复盘时批量回顾。
- **下游**：检测平台（Sigma/SIEM/EDR 规则）、基线监控配置。
- 编排片段：
  ```
  up = F11.run(closed_alert=v, root_cause=rc)
  open_pr(target="sigma-repo", rules=up.proposed_sigma)
  ```

---

## G. 元能力类

### G1 · 假设生成  `investigate.meta.hypothesis.generate`

**目的**：基于已知证据，生成多个对立假设供进一步证伪/证实。

**输入**：`current_evidence`, `alert_type`

**输出**：`[ { hypothesis, supporting_signals[], required_evidence_to_confirm[], required_evidence_to_refute[], prior_probability } ]`

**典型**：恶意软件告警可能假设 = { 真攻击, 红队演练, 安全软件误报, 用户主动测试工具 }

**示例编排**
- **上游**：告警刚进入调查时；F1 出 INC 后需要新假设。
- **下游**：G2 反证、G3 下一步、按假设并行调用 A/B/C/D/E 类能力。
- 编排片段：
  ```
  hyps = G1.run(current_evidence=ev, alert_type=alert.type)
  for h in hyps:
      schedule(h.required_evidence_to_confirm + h.required_evidence_to_refute)
  ```

---

### G2 · 反证维护  `investigate.meta.counter_evidence`

**目的**：主动寻找"否定当前主假设"的证据，防止确认偏误。

**输出**：与主假设相悖的证据列表

**示例编排**
- **上游**：G1 主假设确立后；F1 自信判定前的"自我挑战"。
- **下游**：F1 收口（含 counter_evidence 字段）、G6 证据链完整性。
- 编排片段：
  ```
  cnt = G2.run(main_hypothesis=h_main, evidence=ev)
  F1.run(evidence=ev, counter_evidence=cnt)
  ```

---

### G3 · 不确定性评估与下一步  `investigate.meta.next_step`

**输入**：`current_state`

**输出**：`{ uncertainty: high|med|low, top_missing_evidence[], recommended_next_atomic_calls[] }`

**备注**：每个推荐调用附带"成本（数据源时延/API 限速）× 价值（消除多少不确定性）"分。

**示例编排**
- **上游**：F1 出 `verdict=INC`；Agent 自主调查中需"下一步去查什么"。
- **下游**：Agent 按 `recommended_next_atomic_calls` 决定下一次能力调用。
- 编排片段：
  ```
  while v.verdict == "INC" and i < MAX:
      nxt = G3.run(current_state=state)
      best = nxt.recommended_next_atomic_calls[0]
      new_ev = call(best.namespace, best.expected_input)
      state.evidence.append(new_ev)
      v = F1.run(evidence=state.evidence)
  ```

---

### G4 · 历史相似告警回查  `investigate.meta.kb_lookup`

**输入**：`current_alert_fingerprint`

**去哪里查**：DS-KB（向量库 + 关键字 + IOC 集合相似度）

**输出**：`[ {past_alert_id, similarity, past_verdict, past_response} ]`

**用途**：复用过往决策、避免重复劳动、识别长期攻击者。

**示例编排**
- **上游**：调查链开始（找先验）或 F1 出 verdict 后（用历史回看校准）。
- **下游**：F1 加权（"过去 5 次同类全是 FP"是强先验）、F8 借鉴 past_response。
- 编排片段：
  ```
  sim = G4.run(fingerprint={"type":alert.type, "iocs":ioc_set, "ttps":ttps})
  if sim and sim[0].similarity > 0.8:
      F1.run(prior_verdict_bias=sim[0].past_verdict)
  ```

---

### G5 · 调查路径优化  `investigate.meta.path_optimizer`

**目的**：在数据源时延/限速 vs 价值之间为 Agent 排序下一步动作。

**输入**：候选原子能力列表 + 当前不确定性

**输出**：排序后的动作序列（贪心 / 启发式）

**示例编排**
- **上游**：G3 给出多个候选下一步动作时；多个并行假设需要排序。
- **下游**：实际调度器按本能力输出顺序触发能力调用。
- 编排片段：
  ```
  order = G5.run(candidates=g3_result.recommended, uncertainty=state.uncertainty)
  for step in order: dispatch(step)
  ```

---

### G6 · 证据链完整性自检  `investigate.meta.evidence_integrity`

**目的**：在收口前自查"判定是否被证据充分支持"。

**输出**：`{ unsupported_claims[], stale_evidence[], conflicting_evidence[] }`

**示例编排**
- **上游**：F1/F10 收口前的"自查"。
- **下游**：G2 补反证、G3 补证据、必要时回到 G8 升级。
- 编排片段：
  ```
  chk = G6.run(verdict=v, evidence=ev)
  if chk.unsupported_claims: G3.run(current_state=state)
  ```

---

### G7 · PII / 合规边界检查  `investigate.meta.privacy_guard`

**目的**：原子能力输出汇总后，按调用者角色裁剪敏感字段，记录访问审计。

**输入**：`output_payload`, `caller_role`, `legal_basis?`

**输出**：脱敏后的 payload + 审计日志

**示例编排**
- **上游**：F10 报告 / 跨团队分享前；任何 PII 字段下发前。
- **下游**：管理层报告、合规通报、外部共享均必经此层。
- 编排片段：
  ```
  red = G7.run(payload=full_payload, caller_role="auditor", legal_basis="GDPR-Art6")
  log_audit(red.audit_log)
  ```

---

### G8 · 人在环路升级  `investigate.meta.escalate`

**输入**：`current_state`

**逻辑**：满足任一条件即建议人介入：
- 处置动作涉及高风险（reimage 关键服务器 / disable VIP 账户）
- 不确定性高且数据源已穷尽
- 涉及法律/隐私边界
- 命中"必须人审"规则（如 CEO 账户告警）

**输出**：`{ should_escalate: bool, to_role, urgency, packaged_context }`

**示例编排**
- **上游**：F8 涉及高风险动作时；F1 不确定性高 + 数据源已穷尽。
- **下游**：人工接管、通知 oncall / 主管 / 法务。
- 编排片段：
  ```
  esc = G8.run(current_state=state)
  if esc.should_escalate:
      page(role=esc.to_role, urgency=esc.urgency, ctx=esc.packaged_context)
  ```

---

## 3. 数据源 × 能力依赖矩阵

> ● = 必需   ○ = 可选/增强   空 = 无关
> （仅列关键能力，完整矩阵可生成）

| 能力 \ 数据源 | IDP | HR | CMDB | IPAM | VPN | EDR | SIEM | NDR | FW | PROXY | WAF | EMAIL | DLP | CASB | CLOUD | PAM | DAM | VULN | AV | SANDBOX | TI | WHOIS | KB | CODE | TICKET | MOBILE | FILE | DNS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| A1 用户画像 | ● | ● | ○ |  |  |  | ○ |  |  |  |  | ● |  |  |  | ○ |  |  |  |  |  | | ● | | ○ | ○ | | |
| A2 主机画像 |  |  | ● | ○ |  | ● | ○ |  |  |  |  |  |  |  |  |  |  | ● | ○ |  |  | | ● | | ○ | ○ | | |
| A4 IP 画像 |  |  | ○ | ● | ● |  |  | ● | ● |  |  |  |  |  | ○ |  |  |  |  |  | ● | ● | ● | | | | | ○ |
| A5 域名画像 |  |  |  |  |  |  |  |  |  | ○ |  | ○ |  |  |  |  |  |  |  |  | ● | ● | ○ | | | | | ● |
| A7 文件画像 |  |  |  |  |  | ● |  |  |  |  |  | ○ |  |  |  |  |  |  | ○ | ● | ● | | ○ | | | | | |
| B3 进程执行 |  |  |  |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ○ | | | | | | | |
| B4 网络连接 |  |  |  |  |  | ● |  | ● | ● | ● |  |  |  |  |  |  |  |  |  |  | ○ | | | | | | | |
| B8 邮件 |  |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |  |  |  |  | ○ | ○ | ○ | | | | | | |
| B9 云 API | ○ |  |  |  |  |  |  |  |  |  |  |  |  | ○ | ● |  |  |  |  |  | ○ | | | | | | | |
| B10 数据访问 |  |  |  |  |  |  |  |  |  | ○ |  | ○ | ● | ● | ○ |  | ● |  |  |  |  | | | | | | ○ | |
| B16 凭据访问 | ○ |  |  |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | | | | | | | |
| C5 横向移动 | ● |  |  |  |  | ● |  | ● |  |  |  |  |  |  |  | ○ |  |  |  |  |  | | | | | | | |
| D1 业务上下文 |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | | | | ● | | | |
| D2 身份上下文 | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | | | | | | | |
| D3 漏洞上下文 |  |  | ○ |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ● |  |  | ○ | | | | ○ | | | |
| D5 自身基线 | ● |  |  |  |  | ● |  | ● |  | ○ |  |  | ○ | ○ | ○ |  | ○ |  |  |  |  | | ● | | | | | |
| E1-E11 情报 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ● | ● | ● | | | | | | |

---

## 4. 典型告警编排示例

> 以下示例展示"上层 Agent 如何串联原子能力"，不是固定 Playbook。Agent 应根据中间结果动态调整。

### 4.1 钓鱼邮件告警

```
入口: EMAIL 网关告警 "外部邮件含可疑链接"
1.  A9 邮件地址画像(sender) + A1 用户画像(recipient)
2.  B8 邮件收发调查(message_id) — 完整 header / 附件 / 链接
3.  A6 URL 画像(link) + E2 信誉(link) → 若未知则 E5 沙箱
4.  A7 附件 Hash 画像 + E3 信誉 → 若未知则 E5 沙箱
5.  D9 地理基线(sender_ip) + E11 仿冒情报(sender_domain)
6.  C9 受害者扩展: 同模板/同发件人邮件触达的全员
7.  B12 浏览器活动(recipient): 收件人是否点击 / 凭据填充
8.  C1 时间窗共现(recipient, ±2h): 是否产生异常登录/进程
9.  F1 判定 → F4 IOC 提取 → F8 处置建议(隔离邮件/重置凭据/封禁链接)
10. G4 历史相似告警回查: 是否同一钓鱼活动持续
```

### 4.2 勒索软件告警

```
入口: EDR 告警 "可疑加密行为"
1.  A2 主机画像(host) + A1 用户画像(user)
2.  A8 进程画像(proc) + A7 镜像 Hash 画像
3.  B3 进程执行(host, ±10min) — 进程树完整还原
4.  B6 文件操作: 检测大量加密改写、勒索信落地
5.  B17 防御规避: 是否关闭 AV/EDR、清除影子副本(vssadmin)
6.  B15 持久化: 是否安装服务/计划任务
7.  C5 横向移动(host, both): 已扩散到哪些机器
8.  C9 受害者扩展: 同 Hash 在多少主机
9.  D1 业务上下文: 影响业务等级
10. F4 IOC 提取 → F8 处置建议(立即隔离主机 / 全网封禁 IOC / 启动 IR 流程)
11. G8 escalate: 必定升级
```

### 4.3 数据外传告警

```
入口: DLP 告警 "敏感数据外传"
1.  A1 用户画像 + D2 身份上下文(尤其离职倒计时)
2.  B10 数据访问(user, 7d): 近 7 天访问敏感数据的全貌
3.  B8 邮件 + B12 浏览器 + B11 USB + B13 SaaS OAuth: 全渠道外传可能
4.  A4 外部 IP 画像 + A6 URL 画像: 流向何方
5.  D5 自身基线 + D6 同组基线: 该用户数据下载是否离群
6.  C1 时间窗共现: 临近时间是否有简历投递 / 求职网站访问(可选)
7.  F1 判定(Insider vs 误操作 vs 外部入侵窃取)
8.  F8 处置: 暂停账户 / 取消外发权限 / 收集证据保全 / 法务介入
9.  G7 隐私守门: 报告生成前裁剪员工隐私字段
```

### 4.4 加密货币挖矿告警

```
入口: NDR 告警 "矿池连接"
1.  A4 IP 画像(remote) + E1 信誉(矿池库)
2.  A2 主机画像 + A8 进程画像
3.  B3 进程执行: 找挖矿进程(xmrig 等)、父进程
4.  B4 网络连接: 矿池协议(Stratum)特征
5.  D7 全组织罕见度: 全公司有几台机器有相同连接
6.  C9 受害者扩展: 同矿池连接的所有主机
7.  F9 根因: Web 漏洞利用 / 容器逃逸 / 内部植入?
8.  F8 处置: 隔离主机 + 封禁矿池 + 补丁修复
```

### 4.5 暴力破解 / 凭据填充

```
入口: IDP 告警 "异常登录失败激增"
1.  A1 用户画像(每个被尝试账户) + A4 源 IP 画像
2.  B1 登录活动(±24h): 成功/失败分布、是否有"99 失败 1 成功"
3.  D9 地理基线 + D11 网络基线
4.  E10 凭据泄露: 被尝试账户是否在已知泄露库
5.  C6 扇出: 单 IP → 多账户(暴破) 或 多 IP → 单账户(凭据填充)
6.  C1 时间窗: 登录成功后是否立刻产生异常操作
7.  D2 身份上下文: 是否触及高权限/VIP 账户
8.  F8 处置: 临时封 IP / 强制重置受影响账户密码 / 强制 MFA
```

### 4.6 横向移动 / 内网渗透

```
入口: EDR/IDP 告警 "异常远程登录" 或 "可疑工具执行(psexec/mimikatz)"
1.  A2 源/目的主机画像 + A1 操作账户画像
2.  B16 凭据访问: LSASS / SAM 访问、Mimikatz 特征
3.  B3 进程执行: psexec/wmic/winrm/ssh 命令链
4.  C3 父子进程链回溯
5.  C5 横向移动追踪(both): 完整路径
6.  C2 实体关系图: 已经触达多少机器/账户
7.  C4 ATT&CK 阶段定位 + E9 归因尝试
8.  F2 影响评估(基于已扩散资产重要性)
9.  F8 处置: 批量隔离 / 重置 KRBTGT (若 Golden Ticket) / 取证保全
10. G8 escalate: 必升级
```

---

## 5. 落地路线图

### P0 (MVP · 第一阶段，必须有)

> 目标：能闭环最常见的 3 类告警（钓鱼、恶意软件、异常登录）

**实体画像**：A1, A2, A4, A5, A7
**行为活动**：B1, B3, B4, B8
**关联推理**：C1, C2, C3
**上下文/基线**：D1, D2, D5
**外部情报**：E1, E2, E3, E7
**判定产出**：F1, F2, F4, F8
**元能力**：G3, G4

依赖数据源：DS-IDP / DS-HR / DS-CMDB / DS-EDR / DS-SIEM / DS-EMAIL / DS-FW / DS-TI / DS-KB

### P1 (第二阶段 · 高价值扩展)

> 目标：覆盖云、数据外传、勒索、横向移动

**新增能力**：A8, A11, A12, B2, B5, B6, B9, B10, B15, B16, B17, C4, C5, C6, C9, D3, D7, D9, E5, E6, E8, F3, F6, F7, F9, G1, G2

新增依赖：DS-CLOUD / DS-DLP / DS-CASB / DS-NDR / DS-DAM / DS-PAM / DS-SANDBOX / DS-VULN / DS-WHOIS

### P2 (第三阶段 · 锦上添花)

> 目标：归因、供应链、内幕威胁深度调查、合规级取证报告

**新增能力**：A3, A6, A9, A10, A13, A14, B7, B11, B12, B13, B14, C7, C8, C10, D4, D6, D8, D10, D11, E4, E9, E10, E11, E12, F5, F10, F11, G5, G6, G7, G8

新增依赖：DS-CODE / DS-MOBILE / DS-DNS / DS-FILE / DS-WAF / DS-VPN / DS-PROXY / DS-TICKET / DS-AV / DS-IPAM

### 依赖顺序

```
DS-CMDB / DS-HR / DS-IDP  ─┐
DS-EDR / DS-SIEM           ├─ 必须先就位（A/B/D 类基础）
DS-EMAIL / DS-FW           ─┘
        ↓
DS-TI / DS-KB              ─── 接入 E 类
        ↓
DS-NDR / DS-CLOUD / DS-DLP ─── 接入云/网络/数据扩展
        ↓
DS-SANDBOX / DS-WHOIS      ─── 高级情报
```

---

## 附录 A · 命名空间速查

```
investigate.entity.user.profile          (A1)
investigate.entity.host.profile          (A2)
investigate.entity.server.profile        (A3)
investigate.entity.ip.profile            (A4)
investigate.entity.domain.profile        (A5)
investigate.entity.url.profile           (A6)
investigate.entity.file.profile          (A7)
investigate.entity.process.profile       (A8)
investigate.entity.email.profile         (A9)
investigate.entity.cert.profile          (A10)
investigate.entity.cloud_resource.profile(A11)
investigate.entity.service_account.profile(A12)
investigate.entity.mobile_device.profile (A13)
investigate.entity.db_object.profile     (A14)

investigate.activity.login                       (B1)
investigate.activity.permission_change           (B2)
investigate.activity.process.execution           (B3)
investigate.activity.network.connection          (B4)
investigate.activity.dns                         (B5)
investigate.activity.file_op                     (B6)
investigate.activity.config_change               (B7)
investigate.activity.email                       (B8)
investigate.activity.cloud_api                   (B9)
investigate.activity.data_access                 (B10)
investigate.activity.removable_media             (B11)
investigate.activity.browser                     (B12)
investigate.activity.saas_oauth                  (B13)
investigate.activity.container                   (B14)
investigate.activity.persistence                 (B15)
investigate.activity.credential_access           (B16)
investigate.activity.defense_evasion             (B17)

investigate.relation.timeline.cooccurrence       (C1)
investigate.relation.entity_graph                (C2)
investigate.relation.process_lineage             (C3)
investigate.relation.killchain_stage             (C4)
investigate.relation.lateral_movement            (C5)
investigate.relation.fanout_fanin                (C6)
investigate.relation.same_origin                 (C7)
investigate.relation.cross_source_join           (C8)
investigate.relation.victim_expansion            (C9)
investigate.relation.rare_path                   (C10)

investigate.context.asset_business               (D1)
investigate.context.user_identity                (D2)
investigate.context.vulnerability                (D3)
investigate.context.compliance                   (D4)
investigate.context.baseline.self                (D5)
investigate.context.baseline.peer                (D6)
investigate.context.rarity_global                (D7)
investigate.context.business_hours               (D8)
investigate.context.geo                          (D9)
investigate.context.device_fingerprint           (D10)
investigate.context.network_origin               (D11)

investigate.intel.ip.reputation                  (E1)
investigate.intel.domain_url.reputation          (E2)
investigate.intel.hash.reputation                (E3)
investigate.intel.domain.history                 (E4)
investigate.intel.sandbox.detonate               (E5)
investigate.intel.rule.match                     (E6)
investigate.intel.ttp.mitre                      (E7)
investigate.intel.cve                            (E8)
investigate.intel.attribution                    (E9)
investigate.intel.breach                         (E10)
investigate.intel.brand_lookalike                (E11)
investigate.intel.supply_chain                   (E12)

investigate.verdict.tp_fp                        (F1)
investigate.verdict.impact                       (F2)
investigate.verdict.kill_chain                   (F3)
investigate.verdict.ioc_extract                  (F4)
investigate.verdict.actor_profile                (F5)
investigate.verdict.timeline_reconstruction      (F6)
investigate.verdict.affected_entities            (F7)
investigate.verdict.response_recommendation      (F8)
investigate.verdict.root_cause                   (F9)
investigate.verdict.report                       (F10)
investigate.verdict.detection_uplift             (F11)

investigate.meta.hypothesis.generate             (G1)
investigate.meta.counter_evidence                (G2)
investigate.meta.next_step                       (G3)
investigate.meta.kb_lookup                       (G4)
investigate.meta.path_optimizer                  (G5)
investigate.meta.evidence_integrity              (G6)
investigate.meta.privacy_guard                   (G7)
investigate.meta.escalate                        (G8)
```

---

## 附录 B · 给算法工程师的实施提示

1. **从 schema 开始**：先把"统一能力卡 schema"（0.4 节）做成代码层接口（TypeScript/Python TypedDict），所有能力实现都要符合。
2. **数据源适配层**：在原子能力下方挂一层 DataSource Adapter（`DS-EDR.query(...)` 抽象接口）。同一抽象接口可有 Splunk / Elastic / CrowdStrike 多实现。
3. **能力组合不要硬编码**：上层编排是 LLM Agent 的工作，原子能力之间互不调用（除非声明在"依赖原子能力"字段中）。
4. **输出 JSON 必须自描述**：每个原子能力输出 `partial`、`confidence`、`evidence_refs`、`source_hits`，便于上层做证据链。
5. **限速与时延感知**：每个能力声明典型时延（p50/p95）与限速边界，让 G5 路径优化器可用。
6. **可观测**：每次调用记录 trace（输入哈希、调用数据源列表、耗时、命中率），便于后期评估"哪些原子能力 ROI 最高"。
7. **测试数据集**：每个原子能力配套至少一组"已知输入 → 期望输出"的回归用例（建议从公开数据集如 Atomic Red Team、Mordor Dataset、SecRepo 起步）。

---

*文档结束*
