/**
 * SecMind 邮件日志查询 MCP 服务器
 * 数据源：Resend 事务型邮件 API（https://api.resend.com）
 * 字段规范：邮件原子能力 1.1 ~ 1.7
 *
 * 启动：node server.js（Claude Desktop 自动管理）
 * 环境变量：RESEND_API_KEY=re_xxx
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const RESEND_BASE = 'https://api.resend.com';

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function apiKey() {
  const k = process.env.RESEND_API_KEY || '';
  if (!k) throw new Error('RESEND_API_KEY 环境变量未设置，请在 claude_desktop_config.json 的 env 字段中配置');
  return k;
}

function authHeaders() {
  return { 'Authorization': `Bearer ${apiKey()}`, 'Content-Type': 'application/json' };
}

function parseAuthResults(authStr = '') {
  const extract = (key) => {
    const m = authStr.match(new RegExp(key + '=(\\w+)', 'i'));
    return m ? m[1].toLowerCase() : 'none';
  };
  return { spf: extract('spf'), dkim: extract('dkim'), dmarc: extract('dmarc') };
}

function extractSenderIp(receivedChain) {
  if (!receivedChain) return '';
  const chain = Array.isArray(receivedChain) ? receivedChain : [receivedChain];
  // 最后一跳是最初来源
  const last = chain[chain.length - 1] || '';
  const m = last.match(/\[(\d{1,3}(?:\.\d{1,3}){3})\]/);
  return m ? m[1] : '';
}

function extractUrls(html = '', text = '') {
  const combined = html + ' ' + text;
  const raw = [...combined.matchAll(/https?:\/\/[^\s"'<>）\]]+/g)].map(m => m[0].replace(/[.,;)]+$/, ''));
  return [...new Set(raw)];
}

function parseReceived(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return [raw]; }
}

function normalizeEmail(raw) {
  const headers = raw.headers || {};

  // --- 认证 ---
  const auth = parseAuthResults(headers['authentication-results'] || '');
  // SPF 回退到 received-spf 头
  if (auth.spf === 'none' && headers['received-spf']) {
    const m = headers['received-spf'].match(/^(\w+)/);
    if (m) auth.spf = m[1].toLowerCase();
  }

  // --- Received 链 ---
  const receivedChain = parseReceived(headers['received']);

  // --- 发件人 ---
  const fromRaw = raw.from || '';
  const fromMatch = fromRaw.match(/<([^>]+)>/);
  const fromEmail = fromMatch ? fromMatch[1] : fromRaw.trim();
  const fromDomain = fromEmail.includes('@') ? fromEmail.split('@').pop() : '';

  // --- 正文 ---
  const textBody = (raw.text || '').trim();
  const htmlBody = raw.html || '';

  // --- URL ---
  const urls = extractUrls(htmlBody, textBody);

  // --- 投递状态映射 ---
  const lastEvent = raw.last_event || '';
  const DELIVERY_MAP = { received: 'delivered', delivered: 'delivered', opened: 'delivered', clicked: 'delivered', bounced: 'bounced', complained: 'complained' };
  const deliveryStatus = DELIVERY_MAP[lastEvent] || lastEvent;

  return {
    // ── 1.1 邮件网关日志 ──────────────────────────────────────
    mail_from_address:      fromEmail,
    mail_from_display_name: headers['from'] || fromRaw,
    mail_from_domain:       fromDomain,
    mail_sender_ip:         extractSenderIp(receivedChain),
    mail_received_chain:    receivedChain,
    mail_spf_result:        auth.spf,
    mail_dkim_result:       auth.dkim,
    mail_dmarc_result:      auth.dmarc,
    mail_subject:           raw.subject || headers['subject'] || '',
    mail_body_summary:      textBody.slice(0, 500),
    mail_to_addresses:      raw.to || [],
    mail_cc_addresses:      raw.cc || [],
    mail_bcc_addresses:     raw.bcc || [],
    mail_reply_to:          raw.reply_to || [],
    mail_attachments:       [],           // Resend API 不在 email 对象中暴露附件列表
    mail_attachment_count:  0,
    mail_urls:              urls,
    mail_sent_datetime:     headers['date'] || raw.created_at || '',
    mail_received_datetime: raw.created_at || '',
    mail_size_bytes:        Buffer.byteLength(JSON.stringify(raw), 'utf8'),
    mail_direction:         'inbound',
    mail_disposition:       deliveryStatus,
    mail_x_mailer:          headers['x-mailer'] || '',
    mail_message_id:        raw.message_id || headers['message-id'] || '',
    mail_classification:    '',
    // ── 1.2 邮件投递记录 ──────────────────────────────────────
    mail_delivery_status:         deliveryStatus,
    mail_delivered_datetime:      raw.created_at || '',
    mail_delivery_failure_reason: deliveryStatus === 'delivered' ? '' : lastEvent,
    // ── 元数据 ────────────────────────────────────────────────
    _id:     raw.id || '',
    _source: 'resend',
  };
}

async function apiFetch(path, params = {}) {
  const url = new URL(RESEND_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const resp = await fetch(url.toString(), { headers: authHeaders() });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend API ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function listEmails(limit = 10, offset = 0) {
  const data = await apiFetch('/emails', { limit: Math.min(limit, 100), offset });
  const arr = Array.isArray(data) ? data : (data.data || []);
  return arr;
}

async function fetchEmail(id) {
  return apiFetch(`/emails/${id}`);
}

function ok(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

// ── MCP 服务器 ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'secmind-email-logs',
  version: '1.0.0',
});

// 工具 1：列出邮件
server.tool(
  'list_emails',
  '列出最近收到/发出的邮件，返回归一化邮件原子字段列表',
  {
    limit:  z.number().int().min(1).max(100).default(10).describe('返回数量上限，默认 10'),
    offset: z.number().int().min(0).default(0).describe('分页偏移，默认 0'),
  },
  async ({ limit, offset }) => {
    const emails = await listEmails(limit, offset);
    const result = emails.map(normalizeEmail);
    return ok({ total: result.length, emails: result });
  }
);

// 工具 2：按 ID 查询单封邮件
server.tool(
  'get_email',
  '按邮件 ID 查询单封邮件的完整原子字段及原始数据',
  { email_id: z.string().describe('Resend 邮件 ID（UUID 格式）') },
  async ({ email_id }) => {
    const raw = await fetchEmail(email_id);
    return ok({ normalized: normalizeEmail(raw), raw });
  }
);

// 工具 3：安全认证字段查询
server.tool(
  'query_email_security',
  '查询指定邮件的认证安全字段：SPF/DKIM/DMARC 结果、发件 IP、Received 链、SES 裁决。用于钓鱼邮件调查、发件人伪造分析',
  { email_id: z.string().describe('Resend 邮件 ID') },
  async ({ email_id }) => {
    const raw = await fetchEmail(email_id);
    const n = normalizeEmail(raw);
    const headers = raw.headers || {};
    return ok({
      mail_from_address:        n.mail_from_address,
      mail_from_domain:         n.mail_from_domain,
      mail_sender_ip:           n.mail_sender_ip,
      mail_spf_result:          n.mail_spf_result,
      mail_dkim_result:         n.mail_dkim_result,
      mail_dmarc_result:        n.mail_dmarc_result,
      mail_subject:             n.mail_subject,
      mail_message_id:          n.mail_message_id,
      mail_received_datetime:   n.mail_received_datetime,
      mail_received_chain:      n.mail_received_chain,
      ses_spam_verdict:         headers['x-ses-spam-verdict'] || '',
      ses_virus_verdict:        headers['x-ses-virus-verdict'] || '',
      received_spf_raw:         headers['received-spf'] || '',
      auth_results_raw:         headers['authentication-results'] || '',
    });
  }
);

// 工具 4：提取邮件 URL
server.tool(
  'extract_email_urls',
  '提取指定邮件 HTML 和纯文本正文中的所有 URL（mail_urls 字段）。用于检测恶意链接、钓鱼 URL',
  { email_id: z.string().describe('Resend 邮件 ID') },
  async ({ email_id }) => {
    const raw = await fetchEmail(email_id);
    const html = raw.html || '';
    const text = raw.text || '';
    const urls = extractUrls(html, text);
    return ok({
      email_id,
      mail_subject: raw.subject || '',
      mail_from:    raw.from || '',
      mail_urls:    urls,
      url_count:    urls.length,
    });
  }
);

// 工具 5：按发件人搜索
server.tool(
  'search_emails_by_sender',
  '按发件人邮箱地址或域名筛选邮件（mail_from_address / mail_from_domain）',
  {
    sender_email:  z.string().default('').describe('完整发件人邮箱，如 attacker@evil.com'),
    sender_domain: z.string().default('').describe('发件人域名，如 evil.com'),
    limit:         z.number().int().min(1).max(100).default(20).describe('最大返回数量'),
  },
  async ({ sender_email, sender_domain, limit }) => {
    if (!sender_email && !sender_domain) {
      return ok({ error: 'sender_email 和 sender_domain 至少提供一个' });
    }
    const emails = await listEmails(Math.min(limit * 5, 100), 0);
    const results = [];
    for (const e of emails) {
      const frm = (e.from || '').toLowerCase();
      if (sender_email && frm.includes(sender_email.toLowerCase())) results.push(normalizeEmail(e));
      else if (sender_domain && frm.endsWith('@' + sender_domain.toLowerCase())) results.push(normalizeEmail(e));
      if (results.length >= limit) break;
    }
    return ok({ query: { sender_email, sender_domain }, total: results.length, emails: results });
  }
);

// 工具 6：获取邮件正文
server.tool(
  'get_email_body',
  '获取邮件完整正文内容（mail_body_summary 字段返回前500字，此工具返回全文）',
  {
    email_id: z.string().describe('Resend 邮件 ID'),
    format:   z.enum(['text', 'html']).default('text').describe('text（纯文本）或 html'),
  },
  async ({ email_id, format }) => {
    const raw = await fetchEmail(email_id);
    const body = format === 'html' ? (raw.html || '') : (raw.text || '');
    return ok({
      email_id,
      mail_subject: raw.subject || '',
      mail_from:    raw.from || '',
      format,
      body,
      char_count:   body.length,
    });
  }
);

// 工具 7：获取原始邮件头
server.tool(
  'get_email_headers',
  '获取邮件完整原始头部，包含 X-SES-Receipt、DKIM-Signature、Feedback-ID 等扩展头',
  { email_id: z.string().describe('Resend 邮件 ID') },
  async ({ email_id }) => {
    const raw = await fetchEmail(email_id);
    return ok({ email_id, mail_subject: raw.subject || '', headers: raw.headers || {} });
  }
);

// 工具 8：批量安全审计
server.tool(
  'batch_security_audit',
  '批量拉取最近邮件并输出安全概览：发件人、SPF/DKIM/DMARC、发件 IP、SES 裁决。快速发现批量钓鱼、伪造发件人等异常',
  { limit: z.number().int().min(1).max(100).default(20).describe('审计邮件数量，默认 20') },
  async ({ limit }) => {
    const emails = await listEmails(limit, 0);
    const rows = emails.map(e => {
      const n = normalizeEmail(e);
      const h = e.headers || {};
      return {
        id:            n._id,
        mail_from:     n.mail_from_address,
        mail_subject:  n.mail_subject.slice(0, 80),
        mail_received: n.mail_received_datetime,
        spf:           n.mail_spf_result,
        dkim:          n.mail_dkim_result,
        dmarc:         n.mail_dmarc_result,
        sender_ip:     n.mail_sender_ip,
        spam_verdict:  h['x-ses-spam-verdict'] || '',
        virus_verdict: h['x-ses-virus-verdict'] || '',
        last_event:    e.last_event || '',
        url_count:     n.mail_urls.length,
      };
    });

    const summary = {
      total_emails:    rows.length,
      spf_fail_count:  rows.filter(r => r.spf  !== 'pass').length,
      dkim_fail_count: rows.filter(r => r.dkim !== 'pass').length,
      dmarc_fail_count:rows.filter(r => r.dmarc !== 'pass').length,
      spam_fail_count: rows.filter(r => r.spam_verdict === 'FAIL').length,
    };

    return ok({ summary, emails: rows });
  }
);

// ── 启动 ──────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
