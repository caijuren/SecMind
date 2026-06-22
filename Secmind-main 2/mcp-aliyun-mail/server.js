/**
 * SecMind 阿里云邮件网关日志查询 MCP 服务器 v1.0
 *
 * 数据源：
 *   · 阿里云邮件推送 DirectMail (dm.aliyuncs.com) — 出站事务邮件
 *   · 阿里云企业邮箱管理 API (alimail-cn.aliyuncs.com) — 收发邮件、网关日志
 *
 * 字段规范适配状态：
 *   1.1 邮件网关日志    ✓  (SPF/DKIM/DMARC 企业邮箱侧有独立字段，DirectMail 侧从 header 解析)
 *   1.2 邮件投递记录    ✓
 *   1.3 邮件点击审计    ✗  阿里云无 URL Rewriting 点击追踪
 *   1.4 附件打开日志    ✗  需 EDR 集成，网关不提供
 *   1.5 邮箱审计日志    △  仅企业邮箱管理 API 支持
 *   1.6 出站邮件查询    ✓
 *   1.7 邮件举报日志    ✗  无用户举报 API
 *   1.8 签名/加密日志   △  仅 header 级别，需额外解析
 *
 * 环境变量：
 *   ALIYUN_ACCESS_KEY_ID      必填  AccessKey ID
 *   ALIYUN_ACCESS_KEY_SECRET  必填  AccessKey Secret
 *   ALIYUN_MAIL_MODE          可选  directmail(默认) | enterprise
 *   ALIYUN_ENTERPRISE_ENDPOINT 可选  企业邮箱 endpoint，默认 https://alimail-cn.aliyuncs.com
 *
 * 启动：node server.js（Claude Desktop 自动管理）
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createHmac } from 'crypto';

// ── 模式 & 端点配置 ────────────────────────────────────────────────────────
const MODE = process.env.ALIYUN_MAIL_MODE || 'directmail';

const ENDPOINTS = {
  directmail:  { url: 'https://dm.aliyuncs.com',              version: '2015-11-23' },
  enterprise:  { url: process.env.ALIYUN_ENTERPRISE_ENDPOINT
                      || 'https://alimail-cn.aliyuncs.com',   version: '2021-06-09' },
};
const EP = ENDPOINTS[MODE] || ENDPOINTS.directmail;

// ── 凭证 ──────────────────────────────────────────────────────────────────
function creds() {
  const id  = process.env.ALIYUN_ACCESS_KEY_ID     || '';
  const sec = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
  if (!id || !sec) throw new Error(
    'ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET 环境变量未设置，请在 claude_desktop_config.json 的 env 字段中配置'
  );
  return { id, sec };
}

// ── 阿里云 API 签名 v1（HMAC-SHA1，适用 RPC 风格接口）──────────────────────
function pct(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function buildUrl(action, extra = {}) {
  const { id, sec } = creds();
  const p = {
    Action:           action,
    Format:           'JSON',
    Version:          EP.version,
    AccessKeyId:      id,
    SignatureMethod:  'HMAC-SHA1',
    SignatureNonce:   Math.random().toString(36).slice(2) + Date.now().toString(36),
    Timestamp:        new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    SignatureVersion: '1.0',
    ...extra,
  };
  const canonicalized = Object.keys(p).sort()
    .map(k => `${pct(k)}=${pct(p[k])}`).join('&');
  const stringToSign = `GET&%2F&${pct(canonicalized)}`;
  p.Signature = createHmac('sha1', sec + '&').update(stringToSign).digest('base64');
  return EP.url + '/?' + Object.entries(p)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

async function apiCall(action, params = {}) {
  const resp = await fetch(buildUrl(action, params));
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);
  const data = JSON.parse(text);
  if (data.Code && !['200', 'OK', 'Success'].includes(String(data.Code))) {
    throw new Error(`[${data.Code}] ${data.Message || text}`);
  }
  return data;
}

// ── 投递状态映射 ───────────────────────────────────────────────────────────
// DirectMail Status: 0=待发 1=发送中 2=发送成功 3=失败(垃圾) 4=失败(无效) 5=拦截 9=系统失败
const DSTATUS_MAP = {
  0: 'pending', 1: 'sending', 2: 'delivered',
  3: 'bounced', 4: 'bounced', 5: 'rejected', 9: 'failed',
};

// ── header 解析辅助 ────────────────────────────────────────────────────────
function parseAuthResults(authHeader = '') {
  const extract = key => {
    const m = authHeader.match(new RegExp(key + '[=:\\s]+(\\w+)', 'i'));
    return m ? m[1].toLowerCase() : 'none';
  };
  return {
    spf:  extract('spf'),
    dkim: extract('dkim'),
    dmarc:extract('dmarc'),
  };
}

function extractUrls(html = '', text = '') {
  const combined = html + ' ' + text;
  const raw = [...combined.matchAll(/https?:\/\/[^\s"'<>）\]]+/g)]
    .map(m => m[0].replace(/[.,;)]+$/, ''));
  return [...new Set(raw)];
}

function isOffHours(dt) {
  try { const h = new Date(dt).getHours(); return h < 8 || h >= 22; } catch { return false; }
}
function spanHours(arr, field) {
  const ts = arr.map(m => new Date(m[field] || 0).getTime()).filter(Boolean);
  return ts.length < 2 ? 1 : Math.max(1, (Math.max(...ts) - Math.min(...ts)) / 3_600_000);
}

// ── 字段归一化（邮件原子 1.1 + 1.2 + 阿里云扩展）────────────────────────────
function normMail(r) {
  const from   = r.AccountName || r.FromAddress || r.SenderAddress || '';
  const to     = r.ToAddress   || r.RecipientAddress || '';
  const auth   = parseAuthResults(r.AuthenticationResults || r.AuthResults || '');

  // SPF/DKIM/DMARC：企业邮箱网关侧有独立字段，DirectMail 侧从 header 解析（可能为 none）
  const spf   = r.SpfResult  || r.SpfStatus  || auth.spf  || 'none';
  const dkim  = r.DkimResult || r.DkimStatus || auth.dkim || 'none';
  const dmarc = r.DmarcResult|| r.DmarcStatus|| auth.dmarc|| 'none';

  const htmlBody = r.HtmlBody   || r.BodyHtml || '';
  const textBody = r.TextBody   || r.BodyText || r.Summary || '';
  const urls     = r.UrlList    ? (Array.isArray(r.UrlList) ? r.UrlList : [r.UrlList])
                                : extractUrls(htmlBody, textBody);

  const sentAt = r.UtcCreateTime
    ? new Date(Number(r.UtcCreateTime)).toISOString()
    : (r.CreateTime || r.SendTime || '');

  return {
    // ── 1.1 邮件网关日志 ──────────────────────────────────────────
    mail_from_address:      from,
    mail_from_display_name: r.FromAlias   || r.FromDisplayName || from,
    mail_from_domain:       from.includes('@') ? from.split('@').pop() : '',
    mail_sender_ip:         r.SenderIp    || r.ClientIp    || r.FromIp || '',
    mail_received_chain:    r.ReceivedHeaders
      ? (Array.isArray(r.ReceivedHeaders) ? r.ReceivedHeaders : [r.ReceivedHeaders]) : [],
    mail_spf_result:        spf,
    mail_dkim_result:       dkim,
    mail_dmarc_result:      dmarc,
    mail_subject:           r.Subject || '',
    mail_body_summary:      textBody.slice(0, 500),
    mail_to_addresses:      to ? to.split(',').map(s => s.trim()) : [],
    mail_cc_addresses:      r.CcAddress  ? r.CcAddress.split(',').map(s=>s.trim())  : [],
    mail_bcc_addresses:     r.BccAddress ? r.BccAddress.split(',').map(s=>s.trim()) : [],
    mail_reply_to:          r.ReplyToAddress ? [r.ReplyToAddress] : [],
    mail_attachments:       r.Attachments || [],
    mail_attachment_count:  r.AttachmentCount || 0,
    mail_urls:              urls,
    mail_sent_datetime:     sentAt,
    mail_received_datetime: r.LastUpdateTime || r.ReceiveTime || r.ReceivedTime || sentAt,
    mail_size_bytes:        r.MailSize   || r.Size   || 0,
    mail_direction:         r.Direction  || r.MailType === 'inbound' ? 'inbound' : 'outbound',
    mail_disposition:       DSTATUS_MAP[r.Status] ?? r.StatusStr ?? r.Action ?? '',
    mail_x_mailer:          r.Mailer || (MODE === 'directmail' ? 'Alibaba Cloud DirectMail' : 'Alibaba Cloud Enterprise Mail'),
    mail_message_id:        r.MessageId  || r.MailId  || r.RequestId || '',
    mail_classification:    r.TagName    || r.MailType || r.Classification || '',
    // ── 1.2 邮件投递记录 ──────────────────────────────────────────
    mail_delivery_status:         DSTATUS_MAP[r.Status] ?? r.StatusStr ?? '',
    mail_delivered_datetime:      r.DeliverTime || r.LastUpdateTime || '',
    mail_delivery_server:         r.RelayHost   || r.MailServer    || '',
    mail_delivery_failure_reason: r.ErrMsg      || r.FailReason    || '',
    // ── 阿里云网关扩展字段 ────────────────────────────────────────
    aliyun_spam_score:        r.SpamScore    || r.SpamLevel     || null,
    aliyun_antivirus_result:  r.VirusResult  || r.AntiVirusStat || r.AvResult || '',
    aliyun_rule_action:       r.RuleAction   || r.PolicyAction  || r.HitRule || '',
    aliyun_quarantine_id:     r.QuarantineId || '',
    aliyun_tag:               r.TagName      || '',
    aliyun_status_code:       r.Status       ?? null,
    aliyun_status_str:        r.StatusStr    || '',
    // ── 元数据 ───────────────────────────────────────────────────
    _id:     r.MailId || r.MessageId || r.RequestId || '',
    _source: `aliyun-${MODE}`,
  };
}

// ── 从 API 响应中提取邮件数组（兼容 DirectMail / 企业邮箱不同结构）────────────
function extractMailList(d) {
  const candidates = [
    d?.data?.mailDetail,
    d?.data?.MailDetail,
    d?.data?.list,
    d?.mailDetail,
    d?.MailList,
    d?.data,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }
  if (d?.data && typeof d.data === 'object') return Object.values(d.data);
  return [];
}

function ok(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

// ══════════════════════════════════════════════════════════════════════════════
//  MCP 服务器工具定义
// ══════════════════════════════════════════════════════════════════════════════
const server = new McpServer({ name: 'secmind-aliyun-mail', version: '1.0.0' });

// ── 工具 1：查询邮件日志列表（1.1）────────────────────────────────────────────
server.tool(
  'list_mail_logs',
  '查询最近的邮件日志，返回归一化邮件原子字段列表。支持按发件人账号、投递状态、时间段过滤',
  {
    page_size:    z.number().int().min(1).max(50).default(10).describe('每页记录数，最多50'),
    next_start:   z.string().default('').describe('分页游标，首次请求留空'),
    account_name: z.string().default('').describe('发件账号，如 user@domain.com，留空返回全部'),
    start_time:   z.string().default('').describe('开始时间，格式 yyyy-MM-dd，留空不过滤'),
    end_time:     z.string().default('').describe('结束时间，格式 yyyy-MM-dd，留空不过滤'),
    status: z.number().int().min(-1).max(9).default(-1)
      .describe('-1=全部  0=待发  1=发送中  2=发送成功  3=失败(垃圾)  4=失败(无效地址)  5=拦截  9=系统失败'),
  },
  async ({ page_size, next_start, account_name, start_time, end_time, status }) => {
    const p = { PageSize: page_size };
    if (next_start)   p.NextStart    = next_start;
    if (account_name) p.AccountName  = account_name;
    if (start_time)   p.StartTime    = start_time;
    if (end_time)     p.EndTime      = end_time;
    if (status >= 0)  p.Status       = status;
    const d    = await apiCall('DescSendMailDetail', p);
    const list = extractMailList(d);
    return ok({
      total:      d.TotalCount || list.length,
      next_start: d.NextStart  || '',
      mails:      list.map(normMail),
    });
  }
);

// ── 工具 2：按 ID 查询单封邮件详情（1.1 全字段）─────────────────────────────────
server.tool(
  'get_mail_detail',
  '按邮件 MessageId 查询单封邮件的完整原子字段及原始数据，用于深入分析单封邮件',
  { message_id: z.string().describe('邮件 MessageId（来自 list_mail_logs 返回的 _id 或 mail_message_id）') },
  async ({ message_id }) => {
    // DirectMail 无直接 by-id 查询，用 AccountName=messageId 作 fallback
    const d    = await apiCall('DescSendMailDetail', { AccountName: message_id, PageSize: 10 });
    const list = extractMailList(d);
    const mail = list.find(m => (m.MessageId || m.MailId || m.RequestId) === message_id) || list[0];
    if (!mail) return ok({ error: '未找到指定邮件，请检查 MessageId 是否正确' });
    return ok({ normalized: normMail(mail), raw: mail });
  }
);

// ── 工具 3：查询邮件安全认证字段（SPF / DKIM / DMARC / 反垃圾 / 反病毒）─────────
server.tool(
  'query_mail_security',
  [
    '查询指定邮件的完整安全认证字段：SPF / DKIM / DMARC 认证结果、发件 IP、',
    'Received 路由链、反垃圾评分、反病毒结果、命中策略规则。',
    '用于钓鱼邮件调查、发件人伪造溯源、邮件路由异常分析',
  ].join(''),
  { message_id: z.string().describe('邮件 MessageId') },
  async ({ message_id }) => {
    const d    = await apiCall('DescSendMailDetail', { AccountName: message_id, PageSize: 10 });
    const list = extractMailList(d);
    const mail = list.find(m => (m.MessageId || m.MailId || m.RequestId) === message_id) || list[0];
    if (!mail) return ok({ error: '未找到指定邮件' });
    const n = normMail(mail);
    return ok({
      // ── 1.1 认证字段
      mail_from_address:      n.mail_from_address,
      mail_from_domain:       n.mail_from_domain,
      mail_sender_ip:         n.mail_sender_ip,
      mail_spf_result:        n.mail_spf_result,
      mail_dkim_result:       n.mail_dkim_result,
      mail_dmarc_result:      n.mail_dmarc_result,
      mail_subject:           n.mail_subject,
      mail_message_id:        n.mail_message_id,
      mail_received_chain:    n.mail_received_chain,
      mail_received_datetime: n.mail_received_datetime,
      mail_direction:         n.mail_direction,
      mail_disposition:       n.mail_disposition,
      // ── 阿里云安全扩展字段
      aliyun_spam_score:        n.aliyun_spam_score,
      aliyun_antivirus_result:  n.aliyun_antivirus_result,
      aliyun_rule_action:       n.aliyun_rule_action,
      aliyun_quarantine_id:     n.aliyun_quarantine_id,
      // ── 数据源注记
      _note: spf_note(n),
    });
  }
);

function spf_note(n) {
  const notes = [];
  if (n.mail_spf_result === 'none' && MODE === 'directmail')
    notes.push('SPF/DKIM/DMARC 在 DirectMail 模式下可能为 none，如需真实认证结果请切换至 enterprise 模式');
  return notes.join('; ') || null;
}

// ── 工具 4：提取邮件 URL 列表（1.1 mail_urls 字段）────────────────────────────
server.tool(
  'extract_mail_urls',
  '提取指定邮件正文（HTML 和纯文本）中的所有 URL，用于检测钓鱼链接、恶意域名',
  { message_id: z.string().describe('邮件 MessageId') },
  async ({ message_id }) => {
    const d    = await apiCall('DescSendMailDetail', { AccountName: message_id, PageSize: 10 });
    const list = extractMailList(d);
    const mail = list.find(m => (m.MessageId || m.MailId || m.RequestId) === message_id) || list[0];
    if (!mail) return ok({ error: '未找到指定邮件' });
    const n = normMail(mail);
    return ok({
      message_id,
      mail_subject: n.mail_subject,
      mail_from:    n.mail_from_address,
      mail_urls:    n.mail_urls,
      url_count:    n.mail_urls.length,
    });
  }
);

// ── 工具 5：按发件人搜索邮件（1.1 mail_from_address / mail_from_domain）──────────
server.tool(
  'search_by_sender',
  '按发件人邮箱地址或域名筛选邮件，返回最近匹配记录，用于分析特定发件人的邮件行为模式',
  {
    sender_address: z.string().default('').describe('完整发件人邮箱，如 attacker@evil.com'),
    sender_domain:  z.string().default('').describe('发件人域名，如 evil.com'),
    limit:          z.number().int().min(1).max(50).default(20),
  },
  async ({ sender_address, sender_domain, limit }) => {
    if (!sender_address && !sender_domain)
      return ok({ error: 'sender_address 和 sender_domain 至少提供一个' });
    const d    = await apiCall('DescSendMailDetail', { PageSize: 50 });
    const list = extractMailList(d).map(normMail);
    const results = list.filter(m => {
      if (sender_address) return m.mail_from_address.toLowerCase().includes(sender_address.toLowerCase());
      return m.mail_from_domain.toLowerCase() === sender_domain.toLowerCase().replace(/^@/, '');
    }).slice(0, limit);
    return ok({ query: { sender_address, sender_domain }, total: results.length, mails: results });
  }
);

// ── 工具 6：邮件发送统计（1.6 出站邮件）─────────────────────────────────────────
server.tool(
  'get_mail_statistics',
  '查询指定日期范围内的邮件发送统计：发送总数、送达数、退信数、垃圾邮件拦截数。对应原子字段 1.6 出站邮件查询',
  {
    start_date:   z.string().describe('统计开始日期，格式 YYYYMMDD，如 20240101'),
    end_date:     z.string().describe('统计结束日期，格式 YYYYMMDD，如 20240131'),
    account_name: z.string().default('').describe('发件账号，留空统计全部'),
  },
  async ({ start_date, end_date, account_name }) => {
    const p = { StartTime: start_date, EndTime: end_date };
    if (account_name) p.AccountName = account_name;
    const d = await apiCall('DescMailSendStaticsByDate', p);
    return ok({ period: { start_date, end_date }, statistics: d });
  }
);

// ── 工具 7：批量安全审计 ────────────────────────────────────────────────────
server.tool(
  'batch_security_audit',
  [
    '批量拉取最近邮件并输出安全概览：SPF/DKIM/DMARC 失败计数、拦截/退信统计、',
    '异常发件人 IP 汇总、反垃圾/反病毒命中情况。',
    '快速识别批量钓鱼、发件人伪造、异常发送频率等威胁',
  ].join(''),
  {
    limit: z.number().int().min(1).max(50).default(20).describe('审计邮件数量，默认 20'),
  },
  async ({ limit }) => {
    const d    = await apiCall('DescSendMailDetail', { PageSize: limit });
    const list = extractMailList(d).map(normMail);
    const rows = list.map(m => ({
      id:              m._id,
      from:            m.mail_from_address,
      from_domain:     m.mail_from_domain,
      to:              (m.mail_to_addresses || []).slice(0, 3).join(', '),
      subject:         m.mail_subject.slice(0, 80),
      received:        m.mail_received_datetime,
      direction:       m.mail_direction,
      disposition:     m.mail_disposition,
      spf:             m.mail_spf_result,
      dkim:            m.mail_dkim_result,
      dmarc:           m.mail_dmarc_result,
      sender_ip:       m.mail_sender_ip,
      spam_score:      m.aliyun_spam_score,
      antivirus:       m.aliyun_antivirus_result,
      rule_action:     m.aliyun_rule_action,
      url_count:       m.mail_urls.length,
      attachment_count:m.mail_attachment_count,
    }));
    const summary = {
      total_mails:      rows.length,
      delivered:        rows.filter(r => r.disposition === 'delivered').length,
      rejected:         rows.filter(r => r.disposition === 'rejected').length,
      bounced:          rows.filter(r => r.disposition === 'bounced').length,
      spf_fail_count:   rows.filter(r => r.spf  && r.spf  !== 'pass' && r.spf  !== 'none').length,
      dkim_fail_count:  rows.filter(r => r.dkim && r.dkim !== 'pass' && r.dkim !== 'none').length,
      dmarc_fail_count: rows.filter(r => r.dmarc&& r.dmarc!== 'pass' && r.dmarc!== 'none').length,
      with_urls:        rows.filter(r => r.url_count > 0).length,
      with_attachments: rows.filter(r => r.attachment_count > 0).length,
      unique_sender_ips: [...new Set(rows.map(r => r.sender_ip).filter(Boolean))],
      suspicious: rows.filter(r =>
        r.disposition === 'rejected' ||
        (r.spf && r.spf !== 'pass' && r.spf !== 'none') ||
        (r.antivirus && r.antivirus !== '' && r.antivirus !== 'clean')
      ).map(r => ({ id: r.id, from: r.from, disposition: r.disposition, spf: r.spf, antivirus: r.antivirus })),
    };
    return ok({ summary, mails: rows });
  }
);

// ── 工具 8：查询出站邮件（1.6 出站异常检测）─────────────────────────────────────
server.tool(
  'analyze_outbound',
  [
    '分析指定账号的出站邮件：计算外发收件人数量、非工作时间发送占比、发送频率，',
    '对应原子字段 1.6（mail_outbound_messages / mail_external_recipient_count / ',
    'mail_outbound_send_rate / mail_outbound_off_hours_count）',
  ].join(''),
  {
    account_name: z.string().describe('发件账号（必填），如 user@company.com'),
    limit:        z.number().int().min(1).max(50).default(20),
    start_time:   z.string().default('').describe('开始时间 yyyy-MM-dd'),
    end_time:     z.string().default('').describe('结束时间 yyyy-MM-dd'),
  },
  async ({ account_name, limit, start_time, end_time }) => {
    const p = { AccountName: account_name, PageSize: limit };
    if (start_time) p.StartTime = start_time;
    if (end_time)   p.EndTime   = end_time;
    const d    = await apiCall('DescSendMailDetail', p);
    const list = extractMailList(d).map(normMail);

    const fromDomain  = account_name.includes('@') ? account_name.split('@').pop() : '';
    const external    = list.filter(m =>
      !m.mail_to_addresses.every(addr => addr.toLowerCase().endsWith('@' + fromDomain))
    );
    const offHours    = list.filter(m => isOffHours(m.mail_sent_datetime || m.mail_received_datetime));
    const hourSpan    = spanHours(list, 'mail_sent_datetime');

    return ok({
      account_name,
      // ── 1.6 出站邮件原子字段
      mail_outbound_messages:           list,
      mail_external_recipient_count:    external.reduce((s, m) => s + Math.max(m.mail_to_addresses.length, 1), 0),
      mail_outbound_attachment_size:    0,   // DirectMail API 不暴露附件大小
      mail_outbound_sensitive_keywords: [],  // 需内容检测，网关层不提供
      mail_outbound_send_rate:          list.length > 1 ? +(list.length / hourSpan).toFixed(3) : 0,
      mail_outbound_off_hours_count:    offHours.length,
      // ── 分析摘要
      analysis: {
        total_mails:          list.length,
        external_mails:       external.length,
        off_hours_mails:      offHours.length,
        send_rate_per_hour:   list.length > 1 ? +(list.length / hourSpan).toFixed(3) : 0,
        status_distribution:  list.reduce((acc, m) => {
          acc[m.mail_disposition] = (acc[m.mail_disposition] || 0) + 1; return acc;
        }, {}),
      },
    });
  }
);

// ── 工具 9：查询域名 SPF/DKIM 配置（1.1 辅助）─────────────────────────────────
server.tool(
  'query_domain_config',
  '查询发信域名的 SPF、DKIM 配置状态，验证邮件安全配置是否正确，辅助判断认证失败原因',
  {
    domain: z.string().describe('发信域名，如 company.com'),
  },
  async ({ domain }) => {
    const d = await apiCall('QueryDomainByParam', { KeyWord: domain, PageSize: 5 });
    return ok({ query: domain, result: d });
  }
);

// ── 启动 ──────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
