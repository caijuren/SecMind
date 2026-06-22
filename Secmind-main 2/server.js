/**
 * SecMind — 本地 Webhook 服务器
 * 纯 Node.js 内置模块，无需 npm install
 *
 * 启动：  node server.js
 * 访问：  http://localhost:3000
 *
 * Webhook 接收端点：  POST  http://localhost:3000/webhook/receive
 * 前端轮询接口：      GET   http://localhost:3000/webhook/events
 * 健康检查：          GET   http://localhost:3000/webhook/status
 */

'use strict';
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const mysql = require('mysql2/promise');

/* ── MySQL / MariaDB 连接池 ───────────────────────────────────────────────── */
const DB_CFG = {
  host: '127.0.0.1', port: 3306,
  user: 'secmind', password: 'secmind2026', database: 'secmind',
  waitForConnections: true, connectionLimit: 5, queueLimit: 0,
  charset: 'utf8mb4',
};
let pool = null;

async function getPool() {
  if (pool) return pool;
  try {
    pool = mysql.createPool(DB_CFG);
    // 初始化建表
    const conn = await pool.getConnection();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        source     VARCHAR(64),
        scene      VARCHAR(32),
        severity   VARCHAR(16),
        title      VARCHAR(512),
        body       JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created (created_at),
        INDEX idx_scene   (scene),
        INDEX idx_severity(severity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS investigations (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        alert_id     VARCHAR(64),
        status       VARCHAR(32) DEFAULT 'open',
        summary      TEXT,
        raw_payload  JSON,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_alert  (alert_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        action     VARCHAR(64),
        target     VARCHAR(256),
        operator   VARCHAR(64) DEFAULT 'system',
        detail     JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    conn.release();
    console.log('\x1b[32m[db]\x1b[0m  MySQL 连接成功 · secmind@127.0.0.1:3306');
  } catch(e) {
    console.warn('\x1b[33m[db]\x1b[0m  MySQL 未连接，DB 路由不可用：' + e.message);
    pool = null;
  }
  return pool;
}

// 尝试预热连接（非阻塞）
getPool().catch(() => {});

const PORT      = 3003;
const HTML_FILE = path.join(__dirname, 'index.html');

/* ── In-memory event queue (drained by frontend every 5s) ─────────────── */
const eventQueue = [];

/* ── LLM 配置（UI 保存时同步过来，用于 webhook 告警字段映射） ────────────── */
let llmCfg = null;

const LLM_URL_MAP = {
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  qwen:     'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  glm:      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  kimi:     'https://api.moonshot.cn/v1/chat/completions',
  baichuan: 'https://api.baichuan-ai.com/v1/chat/completions',
  doubao:   'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  hunyuan:  'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
  minimax:  'https://api.minimax.chat/v1/text/chatcompletion_v2',
};

/**
 * 用大模型将任意格式告警映射到 SecMind 标准字段。
 * 成功返回 { title, severity, alertId, sourceSystem, triggeredAt, sceneCategory, entities }
 * 失败返回 null（降级到基础归一化）
 */
async function llmNormalize(rawPayload) {
  if (!llmCfg?.apiKey) return null;
  const apiUrl = llmCfg.url || LLM_URL_MAP[llmCfg.provider] || LLM_URL_MAP.deepseek;
  const model  = llmCfg.model || 'deepseek-chat';

  const prompt = `你是安全告警字段映射专家。将下方原始告警数据映射为 SecMind 标准格式。

只输出 JSON 对象，不要 markdown 代码块，不要任何解释：
{
  "title": "简洁告警名称（不超过80字）",
  "severity": "critical|high|medium|low",
  "alertId": "来源系统中的唯一告警 ID（若无则留空）",
  "sourceSystem": "产生告警的工具或产品名称",
  "triggeredAt": "ISO 8601 时间戳（若无则留空）",
  "sceneCategory": "phishing|endpoint|cloud|identity|insider_threat|network",
  "entities": [{"type":"ip|domain|email|hash|user|file|process|hostname","value":"值"}]
}

severity 映射规则：p0/critical/5 → critical；p1/high/4 → high；p2/medium/3 → medium；p3/low/info/1/2 → low

原始告警数据：
${JSON.stringify(rawPayload, null, 2).slice(0, 4000)}`;

  const body = JSON.stringify({ model, messages:[{ role:'user', content:prompt }], max_tokens:600, temperature:0 });

  return new Promise(resolve => {
    try {
      const u = new URL(apiUrl);
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request({
        method:'POST', hostname:u.hostname, path:u.pathname+u.search,
        port: u.port || (u.protocol==='https:'?443:80), protocol:u.protocol,
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${llmCfg.apiKey}`, 'Content-Length':Buffer.byteLength(body) },
        rejectUnauthorized: false,
      }, res => {
        let d = '';
        res.on('data', c => { d += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            const text = j.choices?.[0]?.message?.content || j.output?.text || '';
            const m = text.match(/\{[\s\S]+\}/);
            if (!m) { resolve(null); return; }
            resolve(JSON.parse(m[0]));
          } catch { resolve(null); }
        });
      });
      req.setTimeout(12000, () => { req.destroy(); resolve(null); });
      req.on('error', () => resolve(null));
      req.write(body); req.end();
    } catch { resolve(null); }
  });
}

/* ── CORS headers ────────────────────────────────────────────────────────── */
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Source, X-Source-Id, X-Webhook-Secret',
};

/* ── Severity normalizer ─────────────────────────────────────────────────── */
function normSeverity(raw) {
  const s = String(raw || '').toLowerCase();
  if (s.match(/crit|p0|5/))   return 'critical';
  if (s.match(/high|p1|4/))   return 'high';
  if (s.match(/med|p2|3/))    return 'medium';
  if (s.match(/low|p3|info/)) return 'low';
  return 'medium';
}

/* ── Scene detector (title + full body) ──────────────────────────────────── */
function detectScene(title, body) {
  const c = (title + JSON.stringify(body)).toLowerCase();
  if (c.match(/phish|钓鱼|spoof|spam|malicious.?link|附件|mail|email/))           return 'phishing';
  if (c.match(/process|exec|inject|malware|ransomware|edr|终端|lateral|dll/))     return 'endpoint';
  if (c.match(/cloud|s3|oss|aws|azure|gcp|k8s|container|serverless|iam|云安全/)) return 'cloud';
  if (c.match(/login|auth|identity|account|credential|password|sso|mfa|身份|认证/)) return 'identity';
  if (c.match(/insider|内部|data.?leak|exfil|dlp|usb|打印/))                     return 'insider_threat';
  return 'network';
}

/* ── Entity extractor ────────────────────────────────────────────────────── */
function extractEntities(raw) {
  const s = JSON.stringify(raw);
  const entities = [];

  const emails  = [...new Set((s.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []))];
  // exclude RFC-1918 / loopback from IPs
  const ips     = [...new Set((s.match(/\b(\d{1,3}\.){3}\d{1,3}\b/g) || []))].filter(ip => {
    const [a, b] = ip.split('.').map(Number);
    return !(a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168));
  });
  const domains = [...new Set((s.match(/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g) || []))].filter(d =>
    !d.match(/^\d/) && !emails.some(e => e.endsWith('@' + d))
  );

  emails.slice(0, 3).forEach(v => entities.push({ type: 'account', value: v }));
  ips.slice(0, 3).forEach(v => entities.push({ type: 'ip', value: v }));
  domains.filter(d => d.split('.').length >= 2).slice(0, 2).forEach(v => entities.push({ type: 'domain', value: v }));

  return entities;
}

/* ── Main normalizer ─────────────────────────────────────────────────────── */
function normalizeWebhook(body, querySource, headers) {
  const r = body;

  const title =
    r.title || r.alert_name || r.alertName || r.name || r.message ||
    r.description || r.summary || r.ruleName || r.display_message ||
    r.finding_title || r.event_type || '未命名告警';

  const severity    = normSeverity(r.severity || r.level || r.priority || r.risk_level || r.criticality);
  const sourceSystem =
    r.source || r.vendor || r.tool || r.product || r.sensor ||
    headers['x-source'] || headers['x-source-id'] ||
    (headers['user-agent'] || '').split('/')[0] ||
    querySource || 'Webhook';

  const triggeredAt =
    r.timestamp || r.created_at || r.event_time || r.occurredAt ||
    r.startedAt  || r.detectedAt || new Date().toISOString();

  const id = 'EVT-WH-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  return {
    id,
    alertId:             r.id || r.alert_id || r.event_id || r.incident_id || id,
    title,
    sceneCategory:       detectScene(title, r),
    priority:            severity,
    severity,
    sourceSystem,
    triggeredAt,
    entities:            extractEntities(r),
    investigationStatus: 'uninvestigated',
    processStatus:       'pending',
    assignee:            null,
    rawData:             r,
    _webhookSourceId:    querySource || '',
  };
}

/* ── Resend API bridge (used by /mcp/email/call) ─────────────────────────── */
function resendFetch(urlPath, apiKey, params = {}) {
  return new Promise((resolve, reject) => {
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    const opts = {
      hostname: 'api.resend.com', path: urlPath + qs, method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`Resend ${res.statusCode}: ${JSON.stringify(parsed)}`));
          else resolve(parsed);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function _authRes(s = '') {
  const ex = k => { const m = s.match(new RegExp(k + '=(\\w+)', 'i')); return m ? m[1].toLowerCase() : 'none'; };
  return { spf: ex('spf'), dkim: ex('dkim'), dmarc: ex('dmarc') };
}
function _urls(html = '', text = '') {
  const raw = [...(html + ' ' + text).matchAll(/https?:\/\/[^\s"'<>）\]]+/g)].map(m => m[0].replace(/[.,;)]+$/, ''));
  return [...new Set(raw)];
}
function _chain(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return [raw]; }
}
function normEmail(raw) {
  const h = raw.headers || {};
  const auth = _authRes(h['authentication-results'] || '');
  if (auth.spf === 'none' && h['received-spf']) {
    const m = h['received-spf'].match(/^(\w+)/); if (m) auth.spf = m[1].toLowerCase();
  }
  const chain = _chain(h['received']);
  const frm = raw.from || '', fm = frm.match(/<([^>]+)>/);
  const fromEmail = fm ? fm[1] : frm.trim();
  const text = (raw.text || '').trim(), html = raw.html || '';
  const lastEvent = raw.last_event || '';
  const DS = { received:'delivered', delivered:'delivered', opened:'delivered', clicked:'delivered', bounced:'bounced', complained:'complained' };
  const senderIp = (() => { if (!chain.length) return ''; const last = chain[chain.length-1]||''; const m = last.match(/\[(\d{1,3}(?:\.\d{1,3}){3})\]/); return m?m[1]:''; })();
  return {
    mail_from_address: fromEmail, mail_from_domain: fromEmail.includes('@')?fromEmail.split('@').pop():'',
    mail_sender_ip: senderIp, mail_received_chain: chain,
    mail_spf_result: auth.spf, mail_dkim_result: auth.dkim, mail_dmarc_result: auth.dmarc,
    mail_subject: raw.subject||h['subject']||'', mail_body_summary: text.slice(0,500),
    mail_to_addresses: raw.to||[], mail_cc_addresses: raw.cc||[], mail_bcc_addresses: raw.bcc||[],
    mail_reply_to: raw.reply_to||[], mail_urls: _urls(html, text),
    mail_sent_datetime: h['date']||raw.created_at||'', mail_received_datetime: raw.created_at||'',
    mail_direction: 'inbound', mail_disposition: DS[lastEvent]||lastEvent,
    mail_message_id: raw.message_id||h['message-id']||'',
    mail_delivery_status: DS[lastEvent]||lastEvent, _id: raw.id||'', _source: 'resend',
  };
}

async function callEmailTool(toolName, args, apiKey) {
  switch (toolName) {
    case 'list_emails': {
      const data = await resendFetch('/emails', apiKey, { limit: Math.min(args.limit||10,100), offset: args.offset||0 });
      const arr = Array.isArray(data) ? data : (data.data||[]);
      return { total: arr.length, emails: arr.map(normEmail) };
    }
    case 'get_email': {
      const raw = await resendFetch(`/emails/${args.email_id}`, apiKey);
      return { normalized: normEmail(raw), raw };
    }
    case 'query_email_security': {
      const raw = await resendFetch(`/emails/${args.email_id}`, apiKey);
      const n = normEmail(raw), h = raw.headers||{};
      return { mail_from_address:n.mail_from_address, mail_from_domain:n.mail_from_domain, mail_sender_ip:n.mail_sender_ip,
        mail_spf_result:n.mail_spf_result, mail_dkim_result:n.mail_dkim_result, mail_dmarc_result:n.mail_dmarc_result,
        mail_subject:n.mail_subject, mail_message_id:n.mail_message_id, mail_received_datetime:n.mail_received_datetime,
        mail_received_chain:n.mail_received_chain, ses_spam_verdict:h['x-ses-spam-verdict']||'',
        ses_virus_verdict:h['x-ses-virus-verdict']||'', received_spf_raw:h['received-spf']||'',
        auth_results_raw:h['authentication-results']||'' };
    }
    case 'extract_email_urls': {
      const raw = await resendFetch(`/emails/${args.email_id}`, apiKey);
      const urls = _urls(raw.html||'', raw.text||'');
      return { email_id:args.email_id, mail_subject:raw.subject||'', mail_from:raw.from||'', mail_urls:urls, url_count:urls.length };
    }
    case 'search_emails_by_sender': {
      const { sender_email='', sender_domain='', limit=20 } = args;
      const data = await resendFetch('/emails', apiKey, { limit: Math.min(limit*5,100) });
      const arr = Array.isArray(data) ? data : (data.data||[]);
      const r = arr.filter(e => {
        const f = (e.from||'').toLowerCase();
        return (sender_email&&f.includes(sender_email.toLowerCase()))||(sender_domain&&f.endsWith('@'+sender_domain.toLowerCase()));
      }).slice(0,limit).map(normEmail);
      return { query:{ sender_email, sender_domain }, total:r.length, emails:r };
    }
    case 'get_email_body': {
      const raw = await resendFetch(`/emails/${args.email_id}`, apiKey);
      const body = args.format==='html'?(raw.html||''):(raw.text||'');
      return { email_id:args.email_id, mail_subject:raw.subject||'', format:args.format||'text', body, char_count:body.length };
    }
    case 'batch_security_audit': {
      const data = await resendFetch('/emails', apiKey, { limit: Math.min(args.limit||20,100) });
      const arr = Array.isArray(data) ? data : (data.data||[]);
      const rows = arr.map(e => {
        const n = normEmail(e), h = e.headers||{};
        return { id:n._id, mail_from:n.mail_from_address, mail_subject:(n.mail_subject||'').slice(0,80),
          mail_received:n.mail_received_datetime, spf:n.mail_spf_result, dkim:n.mail_dkim_result,
          dmarc:n.mail_dmarc_result, sender_ip:n.mail_sender_ip, spam_verdict:h['x-ses-spam-verdict']||'',
          virus_verdict:h['x-ses-virus-verdict']||'', last_event:e.last_event||'', url_count:n.mail_urls.length };
      });
      return { summary:{ total_emails:rows.length, spf_fail_count:rows.filter(r=>r.spf!=='pass').length,
        dkim_fail_count:rows.filter(r=>r.dkim!=='pass').length, dmarc_fail_count:rows.filter(r=>r.dmarc!=='pass').length,
        spam_fail_count:rows.filter(r=>r.spam_verdict==='FAIL').length }, emails:rows };
    }
    default: throw new Error(`未知工具: ${toolName}`);
  }
}

/* ── 阿里云 API bridge (used by /mcp/aliyun-mail/call) ───────────────────── */
const crypto = require('crypto');

function aliyunPct(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g,'%21').replace(/'/g,'%27')
    .replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/\*/g,'%2A');
}

function aliyunBuildUrl(endpoint, version, action, akId, akSecret, extra) {
  const p = {
    Action: action, Format: 'JSON', Version: version,
    AccessKeyId: akId,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: Math.random().toString(36).slice(2) + Date.now().toString(36),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    SignatureVersion: '1.0',
    ...extra,
  };
  const canon = Object.keys(p).sort().map(k => `${aliyunPct(k)}=${aliyunPct(p[k])}`).join('&');
  const sts   = `GET&%2F&${aliyunPct(canon)}`;
  p.Signature = crypto.createHmac('sha1', akSecret + '&').update(sts).digest('base64');
  return endpoint + '/?' + Object.entries(p).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

function aliyunFetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, res => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.Code && !['200','OK','Success'].includes(String(j.Code)))
            reject(new Error(`[${j.Code}] ${j.Message || d}`));
          else resolve(j);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

// 字段归一化（复用 MCP 服务器同一套逻辑）
const _DSTATUS = { 0:'pending',1:'sending',2:'delivered',3:'bounced',4:'bounced',5:'rejected',9:'failed' };
function _parseAuth(s=''){
  const ex = k => { const m=s.match(new RegExp(k+'[=:\\s]+(\\w+)','i')); return m?m[1].toLowerCase():'none'; };
  return { spf:ex('spf'), dkim:ex('dkim'), dmarc:ex('dmarc') };
}
function _extractUrls(html='',text=''){
  const raw=[...(html+' '+text).matchAll(/https?:\/\/[^\s"'<>）\]]+/g)].map(m=>m[0].replace(/[.,;)]+$/,''));
  return [...new Set(raw)];
}
function normAliyunMail(r) {
  const from = r.AccountName||r.FromAddress||r.SenderAddress||'';
  const to   = r.ToAddress||r.RecipientAddress||'';
  const auth = _parseAuth(r.AuthenticationResults||r.AuthResults||'');
  const urls = r.UrlList ? (Array.isArray(r.UrlList)?r.UrlList:[r.UrlList]) : _extractUrls(r.HtmlBody||'',r.TextBody||r.Summary||'');
  const sentAt = r.UtcCreateTime ? new Date(Number(r.UtcCreateTime)).toISOString() : (r.CreateTime||'');
  return {
    mail_from_address:      from,
    mail_from_display_name: r.FromAlias||from,
    mail_from_domain:       from.includes('@')?from.split('@').pop():'',
    mail_sender_ip:         r.SenderIp||r.ClientIp||r.FromIp||'',
    mail_received_chain:    r.ReceivedHeaders?(Array.isArray(r.ReceivedHeaders)?r.ReceivedHeaders:[r.ReceivedHeaders]):[],
    mail_spf_result:        r.SpfResult||r.SpfStatus||auth.spf||'none',
    mail_dkim_result:       r.DkimResult||r.DkimStatus||auth.dkim||'none',
    mail_dmarc_result:      r.DmarcResult||r.DmarcStatus||auth.dmarc||'none',
    mail_subject:           r.Subject||'',
    mail_body_summary:      (r.TextBody||r.BodyText||r.Summary||'').slice(0,500),
    mail_to_addresses:      to?to.split(',').map(s=>s.trim()):[],
    mail_cc_addresses:      r.CcAddress?r.CcAddress.split(',').map(s=>s.trim()):[],
    mail_bcc_addresses:     r.BccAddress?r.BccAddress.split(',').map(s=>s.trim()):[],
    mail_reply_to:          r.ReplyToAddress?[r.ReplyToAddress]:[],
    mail_attachments:       r.Attachments||[],
    mail_attachment_count:  r.AttachmentCount||0,
    mail_urls:              urls,
    mail_sent_datetime:     sentAt,
    mail_received_datetime: r.LastUpdateTime||r.ReceiveTime||sentAt,
    mail_size_bytes:        r.MailSize||r.Size||0,
    mail_direction:         r.Direction||(r.MailType==='inbound'?'inbound':'outbound'),
    mail_disposition:       _DSTATUS[r.Status]??r.StatusStr??r.Action??'',
    mail_x_mailer:          r.Mailer||'Alibaba Cloud Mail',
    mail_message_id:        r.MessageId||r.MailId||r.RequestId||'',
    mail_classification:    r.TagName||r.MailType||'',
    mail_delivery_status:         _DSTATUS[r.Status]??r.StatusStr??'',
    mail_delivered_datetime:      r.DeliverTime||r.LastUpdateTime||'',
    mail_delivery_server:         r.RelayHost||r.MailServer||'',
    mail_delivery_failure_reason: r.ErrMsg||r.FailReason||'',
    aliyun_spam_score:      r.SpamScore||r.SpamLevel||null,
    aliyun_antivirus_result:r.VirusResult||r.AntiVirusStat||r.AvResult||'',
    aliyun_rule_action:     r.RuleAction||r.PolicyAction||r.HitRule||'',
    aliyun_quarantine_id:   r.QuarantineId||'',
    aliyun_tag:             r.TagName||'',
    aliyun_status_code:     r.Status??null,
    aliyun_status_str:      r.StatusStr||'',
    _id:     r.MailId||r.MessageId||r.RequestId||'',
    _source: 'aliyun',
  };
}

function aliyunExtractList(d) {
  for (const c of [d?.data?.mailDetail, d?.data?.MailDetail, d?.data?.list, d?.mailDetail, d?.MailList]) {
    if (Array.isArray(c) && c.length > 0) return c;
  }
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

async function callAliyunTool(toolName, args, akId, akSecret, mode='directmail') {
  const EP  = mode === 'enterprise'
    ? { url: args._endpoint || 'https://alimail-cn.aliyuncs.com', version: '2021-06-09' }
    : { url: 'https://dm.aliyuncs.com', version: '2015-11-23' };
  const call = (action, params) =>
    aliyunFetch(aliyunBuildUrl(EP.url, EP.version, action, akId, akSecret, params));

  switch (toolName) {
    case 'list_mail_logs': {
      const p = { PageSize: Math.min(args.page_size||10, 50) };
      if (args.next_start)   p.NextStart   = args.next_start;
      if (args.account_name) p.AccountName = args.account_name;
      if (args.start_time)   p.StartTime   = args.start_time;
      if (args.end_time)     p.EndTime     = args.end_time;
      if ((args.status??-1) >= 0) p.Status = args.status;
      const d = await call('DescSendMailDetail', p);
      const list = aliyunExtractList(d);
      return { total: d.TotalCount||list.length, next_start: d.NextStart||'', mails: list.map(normAliyunMail) };
    }
    case 'get_mail_detail': {
      const d = await call('DescSendMailDetail', { AccountName: args.message_id, PageSize: 10 });
      const list = aliyunExtractList(d);
      const mail = list.find(m=>(m.MessageId||m.MailId||m.RequestId)===args.message_id) || list[0];
      if (!mail) return { error: '未找到指定邮件' };
      return { normalized: normAliyunMail(mail), raw: mail };
    }
    case 'query_mail_security': {
      const d = await call('DescSendMailDetail', { AccountName: args.message_id, PageSize: 10 });
      const list = aliyunExtractList(d);
      const mail = list.find(m=>(m.MessageId||m.MailId||m.RequestId)===args.message_id) || list[0];
      if (!mail) return { error: '未找到指定邮件' };
      const n = normAliyunMail(mail);
      return { mail_from_address:n.mail_from_address, mail_from_domain:n.mail_from_domain,
        mail_sender_ip:n.mail_sender_ip, mail_spf_result:n.mail_spf_result,
        mail_dkim_result:n.mail_dkim_result, mail_dmarc_result:n.mail_dmarc_result,
        mail_subject:n.mail_subject, mail_message_id:n.mail_message_id,
        mail_received_chain:n.mail_received_chain, mail_received_datetime:n.mail_received_datetime,
        mail_direction:n.mail_direction, mail_disposition:n.mail_disposition,
        aliyun_spam_score:n.aliyun_spam_score, aliyun_antivirus_result:n.aliyun_antivirus_result,
        aliyun_rule_action:n.aliyun_rule_action, aliyun_quarantine_id:n.aliyun_quarantine_id };
    }
    case 'extract_mail_urls': {
      const d = await call('DescSendMailDetail', { AccountName: args.message_id, PageSize: 10 });
      const list = aliyunExtractList(d);
      const mail = list.find(m=>(m.MessageId||m.MailId||m.RequestId)===args.message_id) || list[0];
      if (!mail) return { error: '未找到指定邮件' };
      const n = normAliyunMail(mail);
      return { message_id: args.message_id, mail_subject: n.mail_subject, mail_from: n.mail_from_address,
        mail_urls: n.mail_urls, url_count: n.mail_urls.length };
    }
    case 'search_by_sender': {
      const { sender_address='', sender_domain='', limit=20 } = args;
      if (!sender_address && !sender_domain) return { error: 'sender_address 和 sender_domain 至少提供一个' };
      const d = await call('DescSendMailDetail', { PageSize: 50 });
      const list = aliyunExtractList(d).map(normAliyunMail);
      const r = list.filter(m => {
        if (sender_address) return m.mail_from_address.toLowerCase().includes(sender_address.toLowerCase());
        return m.mail_from_domain.toLowerCase() === sender_domain.toLowerCase().replace(/^@/,'');
      }).slice(0, limit);
      return { query: { sender_address, sender_domain }, total: r.length, mails: r };
    }
    case 'get_mail_statistics': {
      const p = { StartTime: args.start_date, EndTime: args.end_date };
      if (args.account_name) p.AccountName = args.account_name;
      const d = await call('DescMailSendStaticsByDate', p);
      return { period: { start_date: args.start_date, end_date: args.end_date }, statistics: d };
    }
    case 'batch_security_audit': {
      const d = await call('DescSendMailDetail', { PageSize: Math.min(args.limit||20, 50) });
      const list = aliyunExtractList(d).map(normAliyunMail);
      const rows = list.map(m => ({
        id: m._id, from: m.mail_from_address, from_domain: m.mail_from_domain,
        to: (m.mail_to_addresses||[]).slice(0,3).join(', '), subject: (m.mail_subject||'').slice(0,80),
        received: m.mail_received_datetime, direction: m.mail_direction, disposition: m.mail_disposition,
        spf: m.mail_spf_result, dkim: m.mail_dkim_result, dmarc: m.mail_dmarc_result,
        sender_ip: m.mail_sender_ip, spam_score: m.aliyun_spam_score,
        antivirus: m.aliyun_antivirus_result, rule_action: m.aliyun_rule_action,
        url_count: m.mail_urls.length, attachment_count: m.mail_attachment_count,
      }));
      const summary = {
        total_mails:      rows.length,
        delivered:        rows.filter(r=>r.disposition==='delivered').length,
        rejected:         rows.filter(r=>r.disposition==='rejected').length,
        bounced:          rows.filter(r=>r.disposition==='bounced').length,
        spf_fail_count:   rows.filter(r=>r.spf  &&r.spf  !=='pass'&&r.spf  !=='none').length,
        dkim_fail_count:  rows.filter(r=>r.dkim &&r.dkim !=='pass'&&r.dkim !=='none').length,
        dmarc_fail_count: rows.filter(r=>r.dmarc&&r.dmarc!=='pass'&&r.dmarc!=='none').length,
        with_urls:        rows.filter(r=>r.url_count>0).length,
        suspicious:       rows.filter(r=>r.disposition==='rejected'||(r.spf&&r.spf!=='pass'&&r.spf!=='none')||(r.antivirus&&r.antivirus!=='clean')),
      };
      return { summary, mails: rows };
    }
    case 'analyze_outbound': {
      const p = { AccountName: args.account_name, PageSize: Math.min(args.limit||20,50) };
      if (args.start_time) p.StartTime = args.start_time;
      if (args.end_time)   p.EndTime   = args.end_time;
      const d = await call('DescSendMailDetail', p);
      const list = aliyunExtractList(d).map(normAliyunMail);
      const fromDom = (args.account_name||'').includes('@') ? args.account_name.split('@').pop() : '';
      const ext     = list.filter(m=>!m.mail_to_addresses.every(a=>a.toLowerCase().endsWith('@'+fromDom)));
      const ts      = list.map(m=>new Date(m.mail_sent_datetime||0).getTime()).filter(Boolean);
      const spanH   = ts.length>1 ? Math.max(1,(Math.max(...ts)-Math.min(...ts))/3600000) : 1;
      const offH    = list.filter(m=>{ try{ const h=new Date(m.mail_sent_datetime).getHours(); return h<8||h>=22; }catch{return false;} });
      return {
        mail_outbound_messages: list,
        mail_external_recipient_count: ext.reduce((s,m)=>s+Math.max(m.mail_to_addresses.length,1),0),
        mail_outbound_send_rate: list.length>1 ? +(list.length/spanH).toFixed(3) : 0,
        mail_outbound_off_hours_count: offH.length,
        analysis: { total_mails:list.length, external_mails:ext.length, off_hours_mails:offH.length,
          send_rate_per_hour:list.length>1?+(list.length/spanH).toFixed(3):0,
          status_distribution:list.reduce((a,m)=>{ a[m.mail_disposition]=(a[m.mail_disposition]||0)+1;return a; },{}) },
      };
    }
    case 'query_domain_config': {
      const d = await call('QueryDomainByParam', { KeyWord: args.domain, PageSize: 5 });
      return { query: args.domain, result: d };
    }
    default: throw new Error(`未知工具: ${toolName}`);
  }
}

/* ── 日志平台连通性测试 ─────────────────────────────────────────────────────
   支持平台：阿里云 SLS / 腾讯云 CLS / 华为云 LTS / 火山引擎 TLS /
            奇安信 NGSOC / 深信服 SIP / 天融信 TopSAC / 启明星辰泰合 /
            日志易 / 观测云 / Elasticsearch / Splunk / Loki / Kafka / Syslog
   ── 仅测试 endpoint 可达性 + 凭证有效性，不拉取全量日志 */

// 通用 HTTP 请求（支持自签名证书的内网设备）
function httpReq(opts, body) {
  return new Promise((resolve) => {
    const isHttps = (opts.protocol||'https:') === 'https:';
    const lib = isHttps ? https : http;
    const fullOpts = isHttps ? { ...opts, rejectUnauthorized:false } : opts;
    const req = lib.request(fullOpts, (res) => {
      let buf = '';
      res.on('data', c => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: buf }));
    });
    req.on('error', e => resolve({ status:0, error: e.message }));
    req.setTimeout(8000, () => { req.destroy(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// 阿里云通用 RPC 签名（HMAC-SHA1）—— SLS 用的是另一种 Header 签名，这里同时支持
async function testAliyunSLS(cfg) {
  // SLS 测试：GET /logstores/{logstore} 列表
  if (!cfg.accessKeyId || !cfg.accessKeySecret) return { ok:false, msg:'缺少 AccessKey ID / Secret' };
  if (!cfg.project || !cfg.logstore || !cfg.region) return { ok:false, msg:'缺少 Project / Logstore / Region' };
  const host = `${cfg.project}.${cfg.region}.log.aliyuncs.com`;
  const date = new Date().toUTCString();
  const resource = `/logstores/${cfg.logstore}`;
  const headers = {
    'Host': host,
    'Date': date,
    'x-log-apiversion':'0.6.0',
    'x-log-signaturemethod':'hmac-sha1',
    'Content-Length':'0',
  };
  // 签名：VERB+"\n"+CONTENT-MD5+"\n"+CONTENT-TYPE+"\n"+DATE+"\n"+CanonicalizedLOGHeaders+CanonicalizedResource
  const slsHeaders = Object.keys(headers).filter(k=>k.toLowerCase().startsWith('x-log-')||k.toLowerCase().startsWith('x-acs-'))
    .sort().map(k => `${k.toLowerCase()}:${headers[k]}`).join('\n');
  const stringToSign = `GET\n\n\n${date}\n${slsHeaders}\n${resource}`;
  const sig = crypto.createHmac('sha1', cfg.accessKeySecret).update(stringToSign).digest('base64');
  headers['Authorization'] = `LOG ${cfg.accessKeyId}:${sig}`;
  const r = await httpReq({ method:'GET', host, path:resource, headers, port:443, protocol:'https:' });
  if (r.status === 200) return { ok:true,  msg:`阿里云 SLS 连接成功 · Logstore ${cfg.logstore}` };
  if (r.status === 401 || r.status === 403) return { ok:false, msg:`认证失败（${r.status}）· 请检查 AK/SK` };
  if (r.status === 404) return { ok:false, msg:`Project 或 Logstore 不存在（404）` };
  if (r.status === 0)   return { ok:false, msg:`网络无法访问 · ${r.error||'unreachable'}` };
  return { ok:false, msg:`HTTP ${r.status} · ${r.body?.slice(0,200)||''}` };
}

// 腾讯云 CLS：使用 TC3-HMAC-SHA256 调用 SearchLog 简化版（DescribeTopics 更轻量）
async function testTencentCLS(cfg) {
  if (!cfg.accessKeyId || !cfg.accessKeySecret) return { ok:false, msg:'缺少 SecretId / SecretKey' };
  if (!cfg.region) return { ok:false, msg:'缺少 Region' };
  const host = `cls.tencentcloudapi.com`;
  const service = 'cls', action = 'DescribeTopics', version = '2020-10-16';
  const ts = Math.floor(Date.now()/1000);
  const date = new Date(ts*1000).toISOString().slice(0,10);
  const body = '{}';
  const hashedBody = crypto.createHash('sha256').update(body).digest('hex');
  const canonicalReq = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${hashedBody}`;
  const credScope = `${date}/${service}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${ts}\n${credScope}\n${crypto.createHash('sha256').update(canonicalReq).digest('hex')}`;
  const kDate    = crypto.createHmac('sha256', 'TC3'+cfg.accessKeySecret).update(date).digest();
  const kService = crypto.createHmac('sha256', kDate).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest();
  const sig      = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const auth = `TC3-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credScope}, SignedHeaders=content-type;host, Signature=${sig}`;
  const r = await httpReq({
    method:'POST', host, path:'/', port:443, protocol:'https:',
    headers: {
      'Host': host, 'Content-Type':'application/json',
      'Authorization': auth, 'X-TC-Action': action, 'X-TC-Timestamp': String(ts),
      'X-TC-Version': version, 'X-TC-Region': cfg.region,
    },
  }, body);
  if (r.status === 200) {
    try {
      const j = JSON.parse(r.body);
      if (j.Response?.Error) return { ok:false, msg:`腾讯云返回错误：${j.Response.Error.Code} · ${j.Response.Error.Message}` };
      return { ok:true, msg:`腾讯云 CLS 连接成功 · Region ${cfg.region}` };
    } catch { return { ok:true, msg:'腾讯云 CLS 连接成功' }; }
  }
  if (r.status === 0) return { ok:false, msg:`网络无法访问 · ${r.error||'unreachable'}` };
  return { ok:false, msg:`HTTP ${r.status} · ${r.body?.slice(0,200)||''}` };
}

// 华为云 LTS：使用 SDK 签名（V4）—— 简化版仅测试 endpoint 可达 + AK/SK 形式校验
async function testHuaweiLTS(cfg) {
  if (!cfg.accessKeyId || !cfg.accessKeySecret) return { ok:false, msg:'缺少 AK/SK' };
  if (!cfg.region) return { ok:false, msg:'缺少 Region' };
  const host = `lts.${cfg.region}.myhuaweicloud.com`;
  const r = await httpReq({ method:'GET', host, path:'/', port:443, protocol:'https:', headers:{ Host: host } });
  if (r.status === 0) return { ok:false, msg:`网络无法访问 · ${r.error||'unreachable'}` };
  // 401/403 表示 endpoint 可达但未签名，配合 SDK 调用即可成功
  return { ok:true, msg:`华为云 LTS endpoint 可达（${r.status}）· 实际拉取需 SDK 调用 QueryLogs` };
}

// 火山引擎 TLS：endpoint 可达性测试
async function testVolcTLS(cfg) {
  if (!cfg.accessKeyId || !cfg.accessKeySecret) return { ok:false, msg:'缺少 AK/SK' };
  if (!cfg.region) return { ok:false, msg:'缺少 Region' };
  const host = `tls-${cfg.region}.ivolces.com`;
  const r = await httpReq({ method:'GET', host, path:'/', port:443, protocol:'https:', headers:{ Host: host } });
  if (r.status === 0) return { ok:false, msg:`网络无法访问 · ${r.error||'unreachable'}` };
  return { ok:true, msg:`火山引擎 TLS endpoint 可达（${r.status}）` };
}

// 通用 API Key / Bearer 平台测试（奇安信 NGSOC / 深信服 SIP / 天融信 / 日志易 / Splunk / 自定义）
async function testApiKeyEndpoint(cfg) {
  if (!cfg.url) return { ok:false, msg:'缺少 URL' };
  const u = new URL(cfg.url);
  const headers = { Host: u.host };
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  const r = await httpReq({
    method:'GET', host:u.hostname, path: u.pathname + (u.search||''),
    port: u.port || (u.protocol==='https:'?443:80), protocol: u.protocol,
    headers,
  });
  if (r.status === 0)   return { ok:false, msg:`网络无法访问 · ${r.error||'unreachable'}` };
  if (r.status === 401 || r.status === 403) return { ok:false, msg:`认证失败（${r.status}）· 请检查 API Key` };
  if (r.status >= 200 && r.status < 500) return { ok:true,  msg:`endpoint 可达 · HTTP ${r.status}` };
  return { ok:false, msg:`HTTP ${r.status} · ${r.body?.slice(0,200)||''}` };
}

// HTTP Basic 平台（Elasticsearch / Loki）
async function testBasicEndpoint(cfg) {
  if (!cfg.url) return { ok:false, msg:'缺少 URL' };
  const u = new URL(cfg.url);
  const headers = { Host: u.host };
  if (cfg.username) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${cfg.username}:${cfg.password||''}`).toString('base64');
  }
  const path = cfg.index ? `/${cfg.index}/_search?size=0` : '/';
  const r = await httpReq({
    method:'GET', host:u.hostname, path,
    port: u.port || (u.protocol==='https:'?443:80), protocol: u.protocol,
    headers,
  });
  if (r.status === 0)   return { ok:false, msg:`网络无法访问 · ${r.error||'unreachable'}` };
  if (r.status === 401) return { ok:false, msg:'认证失败（401）· 请检查用户名密码' };
  if (r.status >= 200 && r.status < 500) return { ok:true, msg:`endpoint 可达 · HTTP ${r.status}` };
  return { ok:false, msg:`HTTP ${r.status} · ${r.body?.slice(0,200)||''}` };
}

// Syslog / Kafka：仅做 TCP 连通性
function testTcpEndpoint(cfg) {
  return new Promise((resolve) => {
    if (!cfg.url) { resolve({ ok:false, msg:'缺少 URL' }); return; }
    let host = '', port = 514;
    try {
      const m = cfg.url.match(/^[a-z]+:\/\/([^:/]+)(?::(\d+))?/);
      if (m) { host = m[1]; port = m[2] ? +m[2] : (cfg.type==='kafka'?9092:514); }
      else { host = cfg.url; }
    } catch {}
    if (!host) { resolve({ ok:false, msg:'URL 解析失败' }); return; }
    const net = require('net');
    const sock = new net.Socket();
    sock.setTimeout(5000);
    sock.once('connect', () => { sock.destroy(); resolve({ ok:true,  msg:`TCP ${host}:${port} 可达` }); });
    sock.once('timeout', () => { sock.destroy(); resolve({ ok:false, msg:`连接超时 · ${host}:${port}` }); });
    sock.once('error',   (e) => { resolve({ ok:false, msg:`连接失败 · ${e.message}` }); });
    sock.connect(port, host);
  });
}

async function testLogSource(cfg) {
  const p = cfg.platform || 'custom';
  console.log(`\x1b[36m[logsrc]\x1b[0m test ${p} → ${cfg.url||cfg.region||'?'}`);
  switch (p) {
    case 'aliyun-sls':    return testAliyunSLS(cfg);
    case 'tencent-cls':   return testTencentCLS(cfg);
    case 'huawei-lts':    return testHuaweiLTS(cfg);
    case 'volc-tls':      return testVolcTLS(cfg);
    case 'elastic':
    case 'loki':          return testBasicEndpoint(cfg);
    case 'kafka':
    case 'syslog':
    case 'venustech-tac': return testTcpEndpoint(cfg);
    case 'qax-ngsoc':
    case 'sangfor-sip':
    case 'topsec-tsac':
    case 'rizhiyi':
    case 'splunk':
    case 'guance':
    case 'custom':
    default:              return testApiKeyEndpoint(cfg);
  }
}

/* ── 日志源注册表（服务端内存，UI 页面加载时同步） ───────────────────────── */
const logSourceRegistry = {}; // id → cfg（含凭证，不对外暴露）

/* ── 本地上传日志存储 ────────────────────────────────────────────────────── */
let uploadedLogs = []; // 用户上传的原始日志对象数组

// 简单查询匹配：从 Lucene 风格 query 中提取 token，对日志做 OR 全文搜索
function matchUploadedLog(log, query) {
  if (!query || query.trim() === '*' || query.trim() === '') return true;
  const str = JSON.stringify(log).toLowerCase();
  // 提取 field:value 和裸关键词中的实际值
  const tokens = [];
  for (const m of (query + ' ').matchAll(/(?:[\w.]+:)?"?([^\s"()|]+)"?/g)) {
    const v = m[1].replace(/^[\*\(\)]+|[\*\(\)]+$/g, '').toLowerCase().trim();
    if (v && v !== 'and' && v !== 'or' && v !== 'not' && v.length > 1) tokens.push(v);
  }
  if (tokens.length === 0) return true;
  return tokens.some(t => str.includes(t));
}

function queryUploadedLogs({ query = '*', limit = 100 } = {}) {
  if (uploadedLogs.length === 0) return { ok: false, msg: '上传日志为空', logs: [] };
  const matched = uploadedLogs.filter(l => matchUploadedLog(l, query)).slice(0, limit);
  return {
    ok: true,
    logs: matched.map(normLog),
    total: matched.length,
    msg: `上传日志 · 匹配 ${matched.length} 条`,
  };
}

/* ── 本地文件日志查询（从服务器磁盘读取） ───────────────────────────────── */
function parseLogsFromText(text) {
  const cleaned = text.trim();
  // 1. 标准 JSON 数组/对象
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {}
  // 2. 无外层 [] 括号，末尾可能有多余逗号
  try {
    const wrapped = '[' + cleaned.replace(/,\s*$/, '') + ']';
    const parsed = JSON.parse(wrapped);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  // 3. NDJSON：逐行解析，每行可能有末尾逗号
  const lines = cleaned.split('\n');
  const jsonLines = lines.map(l => l.trim().replace(/,$/, '')).filter(l => l.startsWith('{') || l.startsWith('['));
  if (jsonLines.length > 0) {
    const parsed = jsonLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).flat();
    if (parsed.length > 0) return parsed;
  }
  // 4. 每行作为纯文本日志
  return lines.filter(l => l.trim()).map(l => ({ message: l.trim() }));
}

function queryLocalFileLogs(cfg, { query = '*', limit = 100 } = {}) {
  const filePath = cfg.filePath;
  if (!filePath) return { ok: false, msg: '未配置本地文件路径', logs: [] };
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const all = parseLogsFromText(text);
    const matched = all.filter(l => matchUploadedLog(l, query)).slice(0, limit);
    return {
      ok: true,
      logs: matched.map(normLog),
      total: matched.length,
      msg: `本地文件 · 共 ${all.length} 条，匹配 ${matched.length} 条`,
    };
  } catch (e) {
    return { ok: false, msg: `读取文件失败：${e.message}`, logs: [] };
  }
}

/* ── 时间范围解析（支持相对和绝对时间） ──────────────────────────────────── */
function resolveTimeRange(from, to) {
  const now = Math.floor(Date.now() / 1000);
  const parse = s => {
    if (!s || s === 'now') return now;
    const m = String(s).match(/^-(\d+)([smhd])$/);
    if (m) { const mul = { s:1, m:60, h:3600, d:86400 }[m[2]]; return now - parseInt(m[1]) * mul; }
    const t = new Date(s).getTime();
    return isNaN(t) ? now : Math.floor(t / 1000);
  };
  return { fromTs: parse(from) || (now - 3600), toTs: parse(to) || now };
}

/* ── 日志规范化（将原始平台日志提取通用字段） ─────────────────────────────── */
function normLog(raw) {
  const get = (...keys) => { for (const k of keys) { if (raw[k] !== undefined && raw[k] !== '') return raw[k]; } return undefined; };
  return {
    timestamp:  get('@timestamp','time','timestamp','__timestamp','UtcTime','eventTime') || new Date().toISOString(),
    message:    String(get('message','msg','content','log','text','__content','MESSAGE','summary') || JSON.stringify(raw)).slice(0, 500),
    level:      String(get('level','severity','loglevel','Level','Severity') || 'info').toLowerCase(),
    source_ip:  get('src_ip','sourceIp','source_ip','clientIp','client_ip','__source') || '',
    dest_ip:    get('dst_ip','destIp','dest_ip','serverIp','server_ip') || '',
    user:       get('user','username','User','account','AccountName') || '',
    action:     get('action','event_type','eventType','Action','type') || '',
    status:     get('status','result','Status','disposition') || '',
    raw,
  };
}

/* ── 各平台查询实现（opts: { query, fromTs, toTs, limit }）────────────────── */

async function queryAliyunSLS(cfg, opts) {
  if (!cfg.accessKeyId || !cfg.accessKeySecret) return { ok:false, msg:'缺少 AK/SK' };
  if (!cfg.project || !cfg.logstore || !cfg.region) return { ok:false, msg:'缺少 Project / Logstore / Region' };

  const { fromTs, toTs } = opts;
  const resource = `/logstores/${cfg.logstore}/logs`;
  const qs  = `from=${fromTs}&to=${toTs}&query=${encodeURIComponent(opts.query||'*')}&line=${opts.limit}&offset=0`;
  const host = `${cfg.project}.${cfg.region}.log.aliyuncs.com`;
  const date = new Date().toUTCString();
  const hdr  = { Host:host, Date:date, 'x-log-apiversion':'0.6.0', 'x-log-signaturemethod':'hmac-sha1', 'Content-Length':'0' };
  const slsHdrs = Object.keys(hdr).filter(k=>k.toLowerCase().startsWith('x-log-')||k.toLowerCase().startsWith('x-acs-'))
    .sort().map(k=>`${k.toLowerCase()}:${hdr[k]}`).join('\n');
  hdr['Authorization'] = `LOG ${cfg.accessKeyId}:` +
    crypto.createHmac('sha1', cfg.accessKeySecret).update(`GET\n\n\n${date}\n${slsHdrs}\n${resource}`).digest('base64');

  const r = await httpReq({ method:'GET', host, path:`${resource}?${qs}`, headers:hdr, port:443, protocol:'https:' });
  if (r.status !== 200) return { ok:false, msg:`SLS HTTP ${r.status}: ${(r.body||'').slice(0,200)}` };

  let raw = [];
  try {
    const p = JSON.parse(r.body);
    raw = Array.isArray(p) ? p : (p.logs || p.contents || (p ? [p] : []));
  } catch {
    raw = (r.body||'').trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return { __raw:l }; } });
  }
  return { ok:true, logs: raw.map(normLog), total: raw.length };
}

async function queryTencentCLS(cfg, opts) {
  if (!cfg.accessKeyId || !cfg.accessKeySecret) return { ok:false, msg:'缺少 SecretId / SecretKey' };
  if (!cfg.region)  return { ok:false, msg:'缺少 Region' };
  if (!cfg.topicId) return { ok:false, msg:'缺少 TopicId' };

  const { fromTs, toTs } = opts;
  const host = 'cls.tencentcloudapi.com', service = 'cls', action = 'SearchLog', version = '2020-10-16';
  const ts   = Math.floor(Date.now()/1000), date = new Date(ts*1000).toISOString().slice(0,10);
  const bodyObj = {
    TopicId: cfg.topicId,
    StartTime: new Date(fromTs*1000).toISOString().replace('T',' ').slice(0,19),
    EndTime:   new Date(toTs*1000).toISOString().replace('T',' ').slice(0,19),
    Query: opts.query || '*', Limit: opts.limit,
  };
  const body = JSON.stringify(bodyObj);
  const hb   = crypto.createHash('sha256').update(body).digest('hex');
  const cr   = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${hb}`;
  const cs   = `${date}/${service}/tc3_request`;
  const sts  = `TC3-HMAC-SHA256\n${ts}\n${cs}\n${crypto.createHash('sha256').update(cr).digest('hex')}`;
  const kD = crypto.createHmac('sha256','TC3'+cfg.accessKeySecret).update(date).digest();
  const kS = crypto.createHmac('sha256',kD).update(service).digest();
  const kX = crypto.createHmac('sha256',kS).update('tc3_request').digest();
  const sig = crypto.createHmac('sha256',kX).update(sts).digest('hex');
  const auth = `TC3-HMAC-SHA256 Credential=${cfg.accessKeyId}/${cs}, SignedHeaders=content-type;host, Signature=${sig}`;

  const r = await httpReq({ method:'POST', host, path:'/', port:443, protocol:'https:', headers:{
    Host:host, 'Content-Type':'application/json', Authorization:auth,
    'X-TC-Action':action, 'X-TC-Timestamp':String(ts), 'X-TC-Version':version, 'X-TC-Region':cfg.region,
    'Content-Length':String(Buffer.byteLength(body)),
  } }, body);
  if (r.status !== 200) return { ok:false, msg:`CLS HTTP ${r.status}` };
  let raw = [];
  try {
    const j = JSON.parse(r.body);
    if (j.Response?.Error) return { ok:false, msg:`${j.Response.Error.Code}: ${j.Response.Error.Message}` };
    raw = (j.Response?.Results||[]).map(item => {
      const o = {}; (item.LogItems||[]).forEach(kv=>{ o[kv.Key]=kv.Value; });
      if (item.Timestamp) o.__timestamp = item.Timestamp;
      if (item.Source)    o.__source    = item.Source;
      return o;
    });
  } catch(e) { return { ok:false, msg:'解析失败：'+e.message }; }
  return { ok:true, logs: raw.map(normLog), total: raw.length };
}

async function queryElastic(cfg, opts) {
  if (!cfg.url) return { ok:false, msg:'缺少 URL' };
  const { fromTs, toTs } = opts;
  const u = new URL(cfg.url), index = cfg.index || '_all';
  const headers = { Host:u.host, 'Content-Type':'application/json' };
  if (cfg.username) headers['Authorization'] = 'Basic ' + Buffer.from(`${cfg.username}:${cfg.password||''}`).toString('base64');
  else if (cfg.apiKey) headers['Authorization'] = `ApiKey ${cfg.apiKey}`;

  const must = [];
  if (opts.query && opts.query !== '*') must.push({ query_string:{ query:opts.query, default_operator:'AND' } });
  must.push({ range:{ '@timestamp':{ gte:fromTs*1000, lte:toTs*1000, format:'epoch_millis' } } });
  const body = JSON.stringify({ query: must.length>1?{bool:{must}}:must[0], size:opts.limit, sort:[{'@timestamp':{order:'desc'}}] });

  const r = await httpReq({ method:'POST', host:u.hostname, path:`/${index}/_search`,
    port:u.port||(u.protocol==='https:'?443:80), protocol:u.protocol,
    headers:{...headers,'Content-Length':String(Buffer.byteLength(body))} }, body);
  if (r.status===401) return { ok:false, msg:'认证失败（401）' };
  if (r.status!==200) return { ok:false, msg:`ES HTTP ${r.status}: ${(r.body||'').slice(0,200)}` };
  let raw = [];
  try { const j=JSON.parse(r.body); raw=(j.hits?.hits||[]).map(h=>({...h._source,_index:h._index,_id:h._id})); }
  catch(e) { return { ok:false, msg:'解析失败：'+e.message }; }
  return { ok:true, logs: raw.map(normLog), total: raw.length };
}

async function queryLoki(cfg, opts) {
  if (!cfg.url) return { ok:false, msg:'缺少 URL' };
  const { fromTs, toTs } = opts;
  const u   = new URL(cfg.url);
  const start = BigInt(Math.floor(fromTs)) * 1000000000n;
  const end   = BigInt(Math.floor(toTs))   * 1000000000n;
  const qs = `query=${encodeURIComponent(opts.query||'{job=~".+"}')}&start=${start}&end=${end}&limit=${opts.limit}&direction=backward`;
  const headers = { Host:u.host };
  if (cfg.username) headers['Authorization'] = 'Basic ' + Buffer.from(`${cfg.username}:${cfg.password||''}`).toString('base64');
  else if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;

  const r = await httpReq({ method:'GET', host:u.hostname, path:'/loki/api/v1/query_range?'+qs,
    port:u.port||(u.protocol==='https:'?443:80), protocol:u.protocol, headers });
  if (r.status!==200) return { ok:false, msg:`Loki HTTP ${r.status}` };
  let raw = [];
  try {
    const j = JSON.parse(r.body);
    (j.data?.result||[]).forEach(stream => {
      const lbls = stream.stream||{};
      (stream.values||[]).forEach(([ts,line]) => raw.push({...lbls, message:line, __timestamp:ts}));
    });
  } catch(e) { return { ok:false, msg:'解析失败：'+e.message }; }
  return { ok:true, logs: raw.map(normLog), total: raw.length };
}

async function querySplunk(cfg, opts) {
  if (!cfg.url) return { ok:false, msg:'缺少 URL' };
  if (!cfg.apiKey) return { ok:false, msg:'缺少 API Token' };
  const { fromTs, toTs } = opts;
  const u = new URL(cfg.url), port = u.port||(u.protocol==='https:'?443:80);
  const search = opts.query ? `search ${opts.query} earliest=${fromTs} latest=${toTs}`
    : `search index=* earliest=${fromTs} latest=${toTs} | head ${opts.limit}`;
  const body = `search=${encodeURIComponent(search)}&output_mode=json&exec_mode=oneshot&count=${opts.limit}`;
  const headers = { Host:u.host, Authorization:`Bearer ${cfg.apiKey}`, 'Content-Type':'application/x-www-form-urlencoded' };
  const r = await httpReq({ method:'POST', host:u.hostname, path:'/services/search/jobs',
    port, protocol:u.protocol, headers:{...headers,'Content-Length':String(Buffer.byteLength(body))} }, body);
  if (r.status===401||r.status===403) return { ok:false, msg:`认证失败（${r.status}）` };
  if (r.status!==200&&r.status!==201) return { ok:false, msg:`Splunk HTTP ${r.status}` };
  let raw = [];
  try { const j=JSON.parse(r.body); raw=j.results||[]; }
  catch(e) { return { ok:false, msg:'解析失败：'+e.message }; }
  return { ok:true, logs: raw.map(normLog), total: raw.length };
}

/* ── 事件意图映射表（摘自 意图映射表.md） ───────────────────────────────── */
const INTENT_MAP = {
  // TA0043 侦察
  'INT-001': { name:'外部端口/服务扫描探测', tactic:'TA0043·侦察', caps:['4.1','4.2','4.5','8.1','11.3','11.6'] },
  'INT-002': { name:'Web路径/目录枚举',       tactic:'TA0043·侦察', caps:['5.1','5.2','8.1','11.6'] },
  'INT-003': { name:'DNS域名枚举',             tactic:'TA0043·侦察', caps:['4.3','8.2','11.6'] },
  // TA0042 资源开发
  'RES-001': { name:'仿冒域名监测',             tactic:'TA0042·资源开发', caps:['8.2','11.5','12.6'] },
  'RES-002': { name:'企业凭据暗网泄露监测',     tactic:'TA0042·资源开发', caps:['12.4','12.5','2.6','10.2'] },
  // TA0001 初始访问
  'INI-001': { name:'钓鱼邮件投递（恶意链接）', tactic:'TA0001·初始访问', caps:['1.1','1.2','1.3','1.7','8.2','8.4','9.2','11.5'] },
  'INI-002': { name:'钓鱼邮件投递（恶意附件）', tactic:'TA0001·初始访问', caps:['1.1','1.2','1.4','8.3','9.1'] },
  'INI-003': { name:'BEC商业邮件诈骗',         tactic:'TA0001·初始访问', caps:['1.1','1.5','1.6','8.2','10.8','11.5','11.12'] },
  'INI-004': { name:'暴露公网服务漏洞利用',     tactic:'TA0001·初始访问', caps:['5.1','5.2','4.2','8.1','8.5','12.1','10.1'] },
  'INI-005': { name:'凭据滥用登录',             tactic:'TA0001·初始访问', caps:['2.1','2.2','2.3','8.1','11.1','11.3','11.2','10.3','10.2'] },
  'INI-006': { name:'暴力破解/密码喷射',         tactic:'TA0001·初始访问', caps:['2.1','2.2','5.1','8.1','11.6','11.3','2.6'] },
  'INI-007': { name:'MFA疲劳攻击',              tactic:'TA0001·初始访问', caps:['2.3','2.1','11.6','8.1'] },
  'INI-008': { name:'外部远程服务利用（VPN/RDP）', tactic:'TA0001·初始访问', caps:['2.2','4.1','8.1','11.3','2.6'] },
  'INI-009': { name:'移动应用钓鱼/越狱设备访问', tactic:'TA0001·初始访问', caps:['3.10','2.4','2.8'] },
  // TA0002 执行
  'EXE-001': { name:'终端恶意进程执行',          tactic:'TA0002·执行', caps:['3.1','3.2','3.3','8.3','9.1','11.13','3.7'] },
  'EXE-002': { name:'Web应用代码执行/Webshell',  tactic:'TA0002·执行', caps:['5.1','5.2','3.1','3.2','5.7','8.3'] },
  'EXE-003': { name:'容器内异常进程',            tactic:'TA0002·执行', caps:['6.5','6.4','3.1','8.3'] },
  'EXE-004': { name:'脚本语言滥用(PowerShell等)', tactic:'TA0002·执行', caps:['3.1','11.13','3.4','3.3'] },
  // TA0003 持久化
  'PER-001': { name:'注册表启动项植入',           tactic:'TA0003·持久化', caps:['3.4','3.5','3.1','3.2'] },
  'PER-002': { name:'计划任务/服务持久化',         tactic:'TA0003·持久化', caps:['3.5','3.1','3.2','8.3'] },
  'PER-004': { name:'邮件转发规则持久化',          tactic:'TA0003·持久化', caps:['1.5','1.6','2.1','8.1'] },
  'PER-005': { name:'云后门/隐藏IAM角色',          tactic:'TA0003·持久化', caps:['6.3','6.1','2.5'] },
  'PER-006': { name:'Webshell后门',               tactic:'TA0003·持久化', caps:['5.7','5.1','3.2','8.3'] },
  // TA0004 权限提升
  'PRV-001': { name:'终端本地权限提升',            tactic:'TA0004·权限提升', caps:['3.1','3.4','3.8','11.4','12.1'] },
  'PRV-002': { name:'AD域内权限提升',              tactic:'TA0004·权限提升', caps:['2.1','2.5','2.6','3.8'] },
  'PRV-003': { name:'云IAM提权',                  tactic:'TA0004·权限提升', caps:['6.3','6.1','2.5'] },
  // TA0005 防御绕过
  'EVA-001': { name:'安全软件被禁用/卸载',          tactic:'TA0005·防御绕过', caps:['3.7','3.1','3.4','2.1'] },
  'EVA-002': { name:'命令混淆执行',                tactic:'TA0005·防御绕过', caps:['3.1','11.13','3.3'] },
  'EVA-003': { name:'加密通道隐藏C2',              tactic:'TA0005·防御绕过', caps:['4.4','4.6','11.11','8.1'] },
  'EVA-004': { name:'DNS隧道隐藏',                tactic:'TA0005·防御绕过', caps:['4.3','11.6','8.2'] },
  'EVA-005': { name:'日志清除',                    tactic:'TA0005·防御绕过', caps:['3.1','3.7','2.1'] },
  // TA0006 凭据访问
  'CRD-001': { name:'LSASS内存读取',               tactic:'TA0006·凭据访问', caps:['3.8','3.1','3.7'] },
  'CRD-002': { name:'SAM/NTDS数据库导出',          tactic:'TA0006·凭据访问', caps:['3.8','3.2','3.1'] },
  'CRD-003': { name:'Kerberos票据滥用',            tactic:'TA0006·凭据访问', caps:['2.1','3.8','3.1'] },
  'CRD-005': { name:'密码爆破/喷射',               tactic:'TA0006·凭据访问', caps:['2.1','8.1','11.6','12.4'] },
  'CRD-006': { name:'凭据收割页（钓鱼）',           tactic:'TA0006·凭据访问', caps:['1.3','4.4','9.2','8.4','2.1'] },
  'CRD-007': { name:'云访问密钥泄露',              tactic:'TA0006·凭据访问', caps:['6.1','8.1','11.3','11.2','2.5'] },
  // TA0007 发现
  'DSC-001': { name:'AD账号/组枚举',               tactic:'TA0007·发现', caps:['3.9','2.1','3.1'] },
  'DSC-002': { name:'内网主机发现',                tactic:'TA0007·发现', caps:['3.3','4.1','4.11','11.6'] },
  'DSC-003': { name:'系统信息收集',                tactic:'TA0007·发现', caps:['3.1','3.9'] },
  'DSC-004': { name:'云资源枚举',                  tactic:'TA0007·发现', caps:['6.1','8.1','11.6'] },
  // TA0008 横向移动
  'LAT-001': { name:'Pass-the-Hash/Pass-the-Ticket', tactic:'TA0008·横向移动', caps:['2.1','3.8','3.6','4.1','11.7'] },
  'LAT-002': { name:'远程服务利用(PsExec/WMI/WinRM)', tactic:'TA0008·横向移动', caps:['3.1','3.3','2.1','3.6','4.1'] },
  'LAT-003': { name:'RDP/SSH横向',                tactic:'TA0008·横向移动', caps:['3.6','4.1','2.1','2.7','11.2'] },
  // TA0009 收集
  'COL-001': { name:'文件服务器批量读取',           tactic:'TA0009·收集', caps:['5.7','7.1','7.2','11.2','11.12'] },
  'COL-002': { name:'数据库拖库',                  tactic:'TA0009·收集', caps:['5.5','5.6','7.2','11.2','11.6'] },
  // TA0011 命令控制
  'C2-001':  { name:'Beaconing周期性回连',         tactic:'TA0011·命令控制', caps:['4.11','4.4','3.3','8.1','8.2','11.11'] },
  'C2-002':  { name:'DNS隧道C2',                   tactic:'TA0011·命令控制', caps:['4.3','11.6','8.2','11.11'] },
  'C2-004':  { name:'已知C2通信',                  tactic:'TA0011·命令控制', caps:['8.1','8.2','8.7','3.3','4.4'] },
  // TA0010 数据外传
  'EXF-001': { name:'DLP触发的数据外传',           tactic:'TA0010·数据外传', caps:['7.1','7.2','1.6','4.4','7.4','11.12'] },
  'EXF-002': { name:'异常大流量出站',               tactic:'TA0010·数据外传', caps:['4.1','4.5','4.11','3.3','8.1'] },
  'EXF-005': { name:'通过邮件渠道外传',             tactic:'TA0010·数据外传', caps:['1.6','1.5','7.1','11.12'] },
  // TA0040 破坏影响
  'IMP-001': { name:'勒索软件加密',                tactic:'TA0040·破坏影响', caps:['3.2','3.1','3.5','8.3','3.7','8.7'] },
  'IMP-002': { name:'数据破坏/删除',               tactic:'TA0040·破坏影响', caps:['5.5','5.6','6.2','6.3','11.2'] },
  'IMP-003': { name:'DDoS攻击',                   tactic:'TA0040·破坏影响', caps:['4.11','4.2','4.1','8.1','4.5'] },
};

/* ── 原子能力名称索引 ─────────────────────────────────────────────────────── */
const ATOMIC_CAP_NAMES = {
  '0.1':'告警实体提取','0.2':'告警描述分析','0.3':'告警内置字段','0.4':'实体格式校验','0.5':'告警频次聚合',
  '1.1':'邮件网关日志查询','1.2':'邮件投递记录查询','1.3':'邮件点击审计查询','1.4':'邮件附件打开审计',
  '1.5':'邮箱审计日志查询','1.6':'出站邮件查询','1.7':'邮件举报日志查询','1.8':'邮件签名加密查询',
  '2.1':'AD/LDAP认证日志查询','2.2':'VPN登录日志查询','2.3':'MFA系统日志查询','2.4':'SSO日志查询',
  '2.5':'IAM权限变更查询','2.6':'账号属性查询','2.7':'堡垒机日志查询','2.8':'零信任网关查询',
  '3.1':'终端进程日志查询','3.2':'终端文件操作查询','3.3':'终端网络连接查询','3.4':'终端注册表操作查询',
  '3.5':'终端持久化机制扫描','3.6':'终端登录会话查询','3.7':'终端安全软件状态','3.8':'终端凭据访问查询',
  '3.9':'终端账号枚举查询','3.10':'MDM日志查询',
  '4.1':'防火墙流量日志查询','4.2':'IPS/IDS告警查询','4.3':'DNS日志查询','4.4':'Proxy日志查询',
  '4.5':'NetFlow元数据查询','4.6':'全流量回溯查询','4.7':'网络设备配置查询','4.8':'物理链路拓扑',
  '4.9':'NAC准入查询','4.10':'无线网络查询','4.11':'网络流量异常分析',
  '5.1':'Web访问日志查询','5.2':'WAF告警查询','5.3':'应用业务日志查询','5.4':'API网关日志查询',
  '5.5':'数据库审计查询','5.6':'数据库防火墙查询','5.7':'文件服务器审计查询',
  '6.1':'云审计日志查询','6.2':'云对象存储查询','6.3':'云资源变更查询','6.4':'K8s审计查询','6.5':'容器运行时安全',
  '7.1':'DLP日志查询','7.2':'数据分类分级查询','7.4':'USB外设日志查询','7.5':'打印审计查询',
  '8.1':'IP情报查询','8.2':'域名情报查询','8.3':'文件Hash情报查询','8.4':'URL情报查询',
  '8.5':'漏洞情报查询','8.6':'IOC批量查询','8.7':'攻击组织画像查询',
  '9.1':'沙箱文件分析','9.2':'沙箱URL分析',
  '10.1':'资产管理查询','10.2':'HR系统查询','10.3':'OA出差申请查询','10.4':'OA变更工单查询',
  '10.5':'OA权限申请查询','10.6':'ITSM工单查询','10.7':'License到期查询','10.8':'邮件通讯录查询',
  '10.9':'业务系统权限查询','10.10':'业务风控查询',
  '11.1':'ImpossibleTravel计算','11.2':'行为基线偏差计算','11.3':'GeoIP解析',
  '11.5':'实体相似度计算','11.6':'时间窗口聚合','11.7':'实体关联查询',
  '11.11':'网络指纹匹配','11.12':'文本敏感度分类','11.13':'编码与混淆检测',
  '12.1':'漏洞扫描结果查询','12.3':'蜜罐告警查询','12.4':'暗网情报查询','12.5':'社工库查询',
  '12.6':'数字证书查询','12.9':'工控系统日志查询',
};

/* ── 非流式 LLM 调用（供服务端 ReAct 循环使用）─────────────────────────────── */
async function llmCallSync(messages, { maxTokens = 1500, timeout = 45000 } = {}) {
  if (!llmCfg?.apiKey) throw new Error('LLM未配置，请在设置中配置API Key');
  const apiUrl = llmCfg.url || LLM_URL_MAP[llmCfg.provider] || LLM_URL_MAP.deepseek;
  const model  = llmCfg.model || 'deepseek-chat';
  const reqBody = JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.1 });

  return new Promise((resolve, reject) => {
    try {
      const u = new URL(apiUrl);
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request({
        method:'POST', hostname:u.hostname, path:u.pathname+u.search,
        port: u.port || (u.protocol === 'https:' ? 443 : 80), protocol: u.protocol,
        headers: (() => {
          const h = { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(reqBody) };
          const at = llmCfg.authType || 'bearer';
          if (at === 'basic') {
            h['Authorization'] = 'Basic ' + Buffer.from(`${llmCfg.username||''}:${llmCfg.password||''}`).toString('base64');
          } else if (at === 'custom-header' && llmCfg.headerName) {
            h[llmCfg.headerName] = llmCfg.headerValue || '';
          } else if (at !== 'none') {
            h['Authorization'] = `Bearer ${llmCfg.apiKey}`;
          }
          return h;
        })(),
        rejectUnauthorized: false,
      }, (res) => {
        let d = '';
        res.on('data', c => { d += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            const text = j.choices?.[0]?.message?.content || j.output?.text || '';
            // Strip markdown fences if present
            let clean = text;
            const fence = clean.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
            if (fence) clean = fence[1];
            // Brace-balanced JSON extraction (handles nested objects correctly)
            let depth = 0, start = -1;
            for (let i = 0; i < clean.length; i++) {
              if (clean[i] === '{') { if (depth === 0) start = i; depth++; }
              else if (clean[i] === '}' && depth > 0) {
                depth--;
                if (depth === 0 && start !== -1) {
                  try { resolve(JSON.parse(clean.slice(start, i + 1))); return; } catch {}
                  start = -1; // try next candidate
                }
              }
            }
            resolve({ _raw: text, _parseError: true });
          } catch(e) { reject(new Error('LLM响应解析失败: ' + e.message + ' body=' + d.slice(0,200))); }
        });
      });
      req.setTimeout(timeout, () => { req.destroy(new Error('timeout')); });
      req.on('error', e => reject(new Error('LLM调用失败: ' + e.message)));
      req.write(reqBody);
      req.end();
    } catch(e) { reject(e); }
  });
}

/* ── 意图 → MITRE ATT&CK 技术编号映射（用于兜底填充威胁特征） ───────────── */
const INTENT_TO_ATTACK = {
  'INT-001':'T1595 Active Scanning','INT-002':'T1595.002 Vulnerability Scanning','INT-003':'T1595.001 Scanning IP Blocks',
  'RES-001':'T1583.001 Acquire Domains','RES-002':'T1589 Gather Victim Identity Information',
  'INI-001':'T1566.001 Spearphishing Link','INI-002':'T1566.002 Spearphishing Attachment',
  'INI-003':'T1566 BEC / Phishing','INI-004':'T1190 Exploit Public-Facing Application',
  'INI-005':'T1078 Valid Accounts','INI-006':'T1110 Brute Force','INI-007':'T1621 MFA Request Generation',
  'INI-008':'T1133 External Remote Services','INI-009':'T1437 Mobile Application Layer Protocol',
  'EXE-001':'T1059 Command and Scripting Interpreter','EXE-002':'T1505.003 Web Shell',
  'EXE-003':'T1610 Deploy Container','EXE-004':'T1059.001 PowerShell',
  'PER-001':'T1547.001 Registry Run Keys','PER-002':'T1053 Scheduled Task','PER-004':'T1114 Email Collection',
  'PER-005':'T1098 Account Manipulation','PER-006':'T1505.003 Web Shell',
  'PRV-001':'T1068 Exploitation for Privilege Escalation','PRV-002':'T1078.002 Domain Accounts','PRV-003':'T1078.004 Cloud Accounts',
  'EVA-001':'T1562.001 Disable Security Tools','EVA-002':'T1027 Obfuscated Files',
  'EVA-003':'T1573 Encrypted Channel','EVA-004':'T1071.004 DNS','EVA-005':'T1070 Indicator Removal',
  'CRD-001':'T1003.001 LSASS Memory','CRD-002':'T1003.003 NTDS','CRD-003':'T1558 Forge Kerberos Tickets',
  'CRD-005':'T1110 Brute Force','CRD-006':'T1056.003 Web Portal Capture','CRD-007':'T1552.001 Credentials In Files',
  'DSC-001':'T1087 Account Discovery','DSC-002':'T1018 Remote System Discovery',
  'DSC-003':'T1082 System Information Discovery','DSC-004':'T1526 Cloud Service Discovery',
  'LAT-001':'T1550 Use Alternate Authentication Material','LAT-002':'T1021 Remote Services','LAT-003':'T1021.001 RDP / T1021.004 SSH',
  'COL-001':'T1213 Data from Information Repositories','COL-002':'T1213.003 Code Repositories',
  'C2-001':'T1071 Application Layer Protocol','C2-002':'T1071.004 DNS','C2-004':'T1071 Application Layer Protocol',
  'EXF-001':'T1041 Exfiltration Over C2','EXF-002':'T1048 Exfiltration Over Alternative Protocol',
  'EXF-005':'T1048.003 Unencrypted Non-C2 Protocol',
  'IMP-001':'T1486 Data Encrypted for Impact','IMP-002':'T1485 Data Destruction','IMP-003':'T1498 Network Denial of Service',
};

/* ── 给最终报告填充计算兜底字段（LLM 返回空时使用） ─────────────────────── */
function enrichFinalReport(finalReport, ctx) {
  const { stepResults, matchedIntents, intentsDesc, extractedIocs, eventBasic } = ctx;
  const totalLogs = stepResults.reduce((a, r) => a + r.count, 0);
  const highRiskN = stepResults.filter(r => r.risk_level === 'high').length;
  const medRiskN  = stepResults.filter(r => r.risk_level === 'medium').length;
  const hasThreat = highRiskN > 0 || medRiskN > 0;

  // 提取的实体分类
  const ext = (extractedIocs || []).reduce((m, v) => {
    const [t, ...rest] = v.split(':');
    const val = rest.join(':');
    if (!m[t]) m[t] = [];
    m[t].push(val);
    return m;
  }, {});
  const accountsStr = [...(ext.user||[]), ...(ext.email||[])].join('、');
  const hostsStr    = [...(ext.host||[]), ...(ext.ip||[])].join('、');
  const domainsStr  = (ext.domain || []).join('、');
  const affectedStr = [
    accountsStr && `账号 ${accountsStr}`,
    hostsStr && `主机/IP ${hostsStr}`,
    domainsStr && `域名 ${domainsStr}`,
  ].filter(Boolean).join('；') || eventBasic?.id || '当前告警相关资产';

  // ATT&CK 技术
  const attackTechs = matchedIntents.map(id => INTENT_TO_ATTACK[id]).filter(Boolean);

  // 处置建议（根据风险等级分级）
  const intentNames = matchedIntents.map(id => INTENT_MAP[id]?.name || id).join('、');
  const defaultDisposition = {
    immediate: hasThreat
      ? `1. 立即隔离涉事账号/主机，阻断进一步攻击\n2. 重置相关账号密码并强制启用 MFA\n3. 在防火墙/邮件网关阻断告警中标识的恶意 IP、域名、邮件发件人\n4. 通知 SOC 团队进入紧急响应流程，留存全量日志取证`
      : `1. 持续关注告警相关实体的后续行为变化\n2. 验证当前安全策略对该类型威胁的覆盖度\n3. 必要时升级处置等级或转人工深度复核`,
    week_tracking: `1. 监控涉事实体（${affectedStr.slice(0,50)}）后续 7 天异常活动\n2. 复盘攻击路径，检查是否存在遗漏的攻击环节或横移痕迹\n3. 评估告警检测规则有效性，调整阈值\n4. 关注 ${intentNames} 类型同源攻击的复发迹象`,
    long_term: `1. 完善针对 ${intentNames} 类攻击的检测规则与告警阈值\n2. 加强终端/邮件/网络等多源数据的关联分析能力\n3. 推进零信任架构与最小权限原则落地\n4. 定期开展红蓝对抗演练验证防御有效性`,
  };

  // === 兜底合并：LLM 返回值优先，空则用计算值 ===
  finalReport.threat_path = finalReport.threat_path || {};
  if (!finalReport.threat_path.intent_method) finalReport.threat_path.intent_method = intentsDesc;
  if (!finalReport.threat_path.attack_technique && attackTechs.length > 0) finalReport.threat_path.attack_technique = attackTechs.join(', ');
  if (!finalReport.threat_path.threat_intel) finalReport.threat_path.threat_intel = hasThreat ? `已关联 ${highRiskN+medRiskN} 项高/中风险威胁情报` : '已核查，无关联高危情报';

  finalReport.impact = finalReport.impact || {};
  if (!finalReport.impact.affected_assets) finalReport.impact.affected_assets = affectedStr;
  if (!finalReport.impact.description)     finalReport.impact.description = hasThreat
    ? `已确认 ${highRiskN} 项高危行为${medRiskN > 0 ? ` + ${medRiskN} 项中危迹象`:''}，攻击链覆盖 ${matchedIntents.length} 个意图阶段`
    : `获取 ${totalLogs} 条相关日志，未发现明显异常活动`;

  finalReport.final_conclusion = finalReport.final_conclusion || {};
  if (!finalReport.final_conclusion.summary) finalReport.final_conclusion.summary = hasThreat
    ? `调查完成，确认 ${highRiskN} 项高危威胁行为，建议立即按处置建议响应`
    : `调查完成，执行 ${stepResults.length} 步，获取 ${totalLogs} 条日志，未发现明显异常`;
  if (!finalReport.final_conclusion.affected_info) finalReport.final_conclusion.affected_info = affectedStr;
  if (!finalReport.final_conclusion.impact_range)  finalReport.final_conclusion.impact_range = hasThreat
    ? '涉事账号、关联主机及相关业务系统'
    : '当前告警范围内未扩散';

  finalReport.disposition = finalReport.disposition || {};
  if (!finalReport.disposition.immediate)     finalReport.disposition.immediate     = defaultDisposition.immediate;
  if (!finalReport.disposition.week_tracking) finalReport.disposition.week_tracking = defaultDisposition.week_tracking;
  if (!finalReport.disposition.long_term)     finalReport.disposition.long_term     = defaultDisposition.long_term;

  return finalReport;
}

/* ── 兜底日志源选择：优先本地文件 → uploaded → 任意已注册源 ─────────────── */
function pickFallbackLogSource() {
  const all = Object.values(logSourceRegistry);
  if (all.length === 0) return null;
  return all.find(s => s.platform === 'local-file')
      || all.find(s => s.platform === 'uploaded')
      || all[0];
}

/* ── 单步日志解读：ReAct 范式 — 同时输出 reasoning（推理动机）+ observation（观察）+ conclusion（结论） ── */
async function interpretStepLogs(stepR, alertContext, prevSteps) {
  if (!stepR.ok) return null;

  // 构造"已有发现"上下文，让 LLM 的 reasoning 能引用前序步骤
  const prevContext = (prevSteps && prevSteps.length > 0)
    ? '\n\n【已有调查发现（用于 reasoning 衔接前后步骤）】：\n' +
      prevSteps.filter(p => p.ok && p.count > 0).slice(-3).map(p =>
        `  - 步骤${p.step}[${p.capability}·${p.name}]：${(p.ai_interpretation||p.summary||'').slice(0,80)}`
      ).join('\n')
    : '';

  // 【0 日志情况】
  if (stepR.logs.length === 0) {
    try {
      const result = await llmCallSync([
        { role:'system', content:`你是安全分析师。按 ReAct 范式输出"为什么做这次查询/观察到什么/结论"三段：

【本次原子能力】：${stepR.name} [${stepR.capability}]
【查询条件】：${stepR.query || '*'}
【查询结果】：未匹配任何日志${prevContext}

绝对禁止"查询成功"、"未获取到日志"这种废话。

只输出 JSON（不要代码块）：
{"reasoning":"30字内说明：为什么这一步要查这个（基于告警或前序发现的逻辑链）","observation":"30字内说明：观察到日志为空这一事实意味着什么","conclusion":"60字内：基于该能力定位明确说出'未发现X异常'或'查询可能未覆盖'","key_findings":[],"finding_summary":"","risk_level":"none"}` },
        { role:'user', content:`告警背景：${alertContext.slice(0, 400)}` },
      ], { maxTokens: 350, timeout: 15000 });
      return {
        reasoning:   result.reasoning   || `执行 ${stepR.name}，验证该方面是否存在异常`,
        observation: result.observation || `查询返回 0 条记录`,
        conclusion:  result.conclusion  || `${stepR.name} 在该查询条件下未发现相关日志记录，该方面未见异常`,
        key_findings: [],
        finding_summary: '',  // 无日志无威胁，不进关键发现
        risk_level:   'none',
      };
    } catch(e) {
      console.warn(`[inv] 步骤${stepR.step}空结果解读失败:`, e.message);
      return {
        reasoning:   `执行 ${stepR.name}，验证该方面是否存在异常`,
        observation: `查询返回 0 条记录`,
        conclusion:  `${stepR.name} 在指定时间窗口内未查询到匹配日志，该方面未发现异常活动`,
        key_findings: [],
        finding_summary: '',
        risk_level:   'none',
      };
    }
  }

  // 【有日志情况】
  try {
    const logSamples = stepR.logs.slice(0, 5).map(l => JSON.stringify({
      t: (l.timestamp||'').slice(0,19),
      ip: l.source_ip || '',
      user: l.user || '',
      action: l.action || '',
      status: l.status || '',
      msg: (l.message||'').slice(0, 200),
    })).join('\n');

    const result = await llmCallSync([
      { role:'system', content:`你是安全分析师。按 ReAct 范式（Reason→Act→Observe→Conclude）对一次原子能力查询的结果做研判。

【本次原子能力】：${stepR.name} [${stepR.capability}]
【查询条件】：${stepR.query || '*'}
【匹配日志总数】：${stepR.count} 条${prevContext}

【ReAct 三段输出要求】
1. reasoning（推理动机·30字内）：基于告警或前序发现，说明"为什么要做这一步查询"
   - 好例子："告警显示来自陌生IP的登录，需查 AD 日志确认是否成功登录"
   - 好例子："前一步邮件网关确认是伪装邮件，需查邮箱审计日志确认是否被打开"
   - 坏例子（禁止）："分析 X 能力"、"执行 X 查询"
2. observation（观察·30字内）：基于日志样本，描述"观察到的客观事实"，不要含结论判断
   - 好例子："3 条日志显示 SPF/DKIM/DMARC 验证全部失败"
   - 好例子："2 条登录成功记录，时间相隔 4 分钟"
3. conclusion（研判结论·60-100字）：基于观察事实，给出安全研判
4. key_findings（≤5 条，每条 ≤25 字）：精简陈述"什么实体做了什么"
5. finding_summary（一句话故事·≤80字）：把这次发现总结成一句完整的叙事句，像在写报告
   - 必须是完整的陈述句，主语+谓语+宾语，能独立讲清"发生了什么"
   - 好例子："用户点击了伪装成 Microsoft 登录页面的钓鱼链接，并提交了企业凭据"
   - 好例子："钓鱼域名 micros0ft-support.com 注册于事件发生前 48 小时，使用 Cloudflare 隐藏真实 IP"
   - 好例子："凭据提交后 15 分钟，检测到来自荷兰 IP 的成功登录，确认 Impossible Travel"
   - 好例子："攻击者已创建邮件转发规则，将所有财务相关邮件转发至外部邮箱"
   - 坏例子（禁止）："发现 X 异常"、"日志显示..."、"经分析..."、"查询到 N 条..."
6. risk_level：high/medium/low/none

【绝对禁止】
- 禁止说"查询成功"、"获取 X 条日志"
- reasoning 必须体现推理逻辑，不能照抄能力名
- finding_summary 必须是完整叙事句，禁止以"发现"/"查询"/"日志显示"开头

只输出JSON（不要代码块）：
{"reasoning":"...30字...","observation":"...30字...","conclusion":"...60-100字...","key_findings":["发现1","发现2"],"finding_summary":"...一句完整叙事 ≤80字...","risk_level":"high"}` },
      { role:'user', content:`告警背景：${alertContext.slice(0, 400)}\n\n日志样本（最多5条，总${stepR.count}条）：\n${logSamples}` },
    ], { maxTokens: 500, timeout: 20000 });

    const trimmedFindings = (Array.isArray(result.key_findings) ? result.key_findings : [])
      .slice(0, 5)
      .map(f => {
        const s = String(f || '').trim().replace(/[。！？]$/, '');
        return s.length > 30 ? s.slice(0, 28) + '…' : s;
      })
      .filter(Boolean);

    // 兜底：reasoning 和 observation 必须非空，否则用占位
    const fallbackReasoning = `执行 ${stepR.name}，验证 ${stepR.query?.slice(0,40)||'相关行为'}`;
    const fallbackObservation = `共匹配 ${stepR.count} 条日志记录`;

    // finding_summary 兜底：用 conclusion 第一句话，截断到 80 字
    let fSummary = result.finding_summary && String(result.finding_summary).trim();
    if (fSummary && fSummary.length > 90) fSummary = fSummary.slice(0, 88) + '…';
    if (!fSummary) {
      const firstSentence = (result.conclusion || '').split(/[。！？\n]/)[0].trim();
      fSummary = firstSentence.length > 90 ? firstSentence.slice(0, 88) + '…' : firstSentence;
    }

    return {
      reasoning:        (result.reasoning && String(result.reasoning).trim()) || fallbackReasoning,
      observation:      (result.observation && String(result.observation).trim()) || fallbackObservation,
      conclusion:       result.conclusion || `${stepR.name} 解读未生成，请查看下方日志样本人工分析`,
      key_findings:     trimmedFindings,
      finding_summary:  fSummary,
      risk_level:       ['high','medium','low','none'].includes(result.risk_level) ? result.risk_level : 'none',
    };
  } catch(e) {
    console.warn(`[inv] 步骤${stepR.step}解读失败:`, e.message);
    return null;
  }
}

/* ── 威胁路径事件按分钟合并：用 LLM 把同一时间点的多条威胁合并成一句话 ─── */
async function mergeThreatEventsByMinute(events) {
  if (!events || events.length <= 1) return events || [];

  // 按"分钟"分组（取 ISO 时间戳前 16 个字符：YYYY-MM-DDTHH:MM）
  const minuteGroups = new Map();
  events.forEach(e => {
    const key = (e.timestamp || '').slice(0, 16);
    if (!minuteGroups.has(key)) minuteGroups.set(key, []);
    minuteGroups.get(key).push(e);
  });

  const result   = [];
  const llmTasks = []; // 需要 LLM 合并的多事件组
  for (const [key, group] of minuteGroups) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // 占位，等 LLM 合并完成后填入
      llmTasks.push({ key, group, slot: result.length });
      result.push(null);
    }
  }

  // 没有需要合并的组 → 直接返回
  if (llmTasks.length === 0) return result.filter(Boolean);

  // 一次 LLM 调用批量处理所有需要合并的组
  const tasksText = llmTasks.map((t, i) =>
    `组${i+1}（时间 ${t.key.replace('T', ' ')}，共 ${t.group.length} 条同一分钟事件）:\n` +
    t.group.map(e => `  • ${e.event}（来源能力: ${e.capability}）`).join('\n')
  ).join('\n\n');

  const riskOrder = { high:3, medium:2, low:1, none:0 };
  const fallbackMerge = (group) => {
    // 简单 concat fallback：用"；"拼接，截断到 80 字
    let txt = group.map(e => e.event).join('；');
    if (txt.length > 80) txt = txt.slice(0, 78) + '…';
    return txt;
  };

  let mergedTexts = [];
  try {
    const llmResult = await llmCallSync([
      { role:'system', content:`你是安全事件分析师。以下是若干"同一分钟内"发生的多条威胁事件。请将每一组合并为一条更精炼的描述（≤70字），要求：
- 保留所有关键事实（动作、实体类型、影响），避免重复表述
- 合并后是一句通顺的完整叙事，禁止罗列编号
- 直接陈述发生了什么，不要"经分析"、"日志显示"等废话

只输出 JSON（不要代码块）：{"merged":["组1合并后的一句话","组2合并后的一句话",...]}` },
      { role:'user', content: tasksText },
    ], { maxTokens: 600, timeout: 18000 });
    if (Array.isArray(llmResult.merged)) mergedTexts = llmResult.merged;
  } catch(e) {
    console.warn('[inv] 同时间威胁事件合并 LLM 失败:', e.message);
  }

  llmTasks.forEach((t, i) => {
    const earliestTs = t.group.reduce((min, e) =>
      !min || new Date(e.timestamp||0) < new Date(min||0) ? e.timestamp : min, null);
    const highestRisk = t.group.reduce((max, e) =>
      (riskOrder[e.risk_level]||0) > (riskOrder[max]||0) ? e.risk_level : max, 'none');
    const allCaps = [...new Set(t.group.map(e => e.capability))].join(' / ');

    let summary = (mergedTexts[i] && String(mergedTexts[i]).trim()) || fallbackMerge(t.group);
    if (summary.length > 80) summary = summary.slice(0, 78) + '…';

    result[t.slot] = {
      timestamp:  earliestTs,
      event:      summary,
      capability: allCaps,
      capId:      t.group[0].capId,
      risk_level: highestRisk,
      _merged:    true,
      _mergedFrom: t.group.length,
    };
  });

  // 重新按时间排序（合并后的时间戳是组内最早，可能改变相对顺序）
  return result.filter(Boolean).sort((a, b) =>
    new Date(a.timestamp||0) - new Date(b.timestamp||0)
  );
}

/* ── ReAct 调查流水线 ──────────────────────────────────────────────────────── */
async function investigateEventStream(res, alertText) {
  // SSE helper
  const sse = (type, data) => {
    try {
      const line = JSON.stringify({ type, ...data });
      res.write('data: ' + line + '\n\n');
    } catch {}
  };

  // ── Phase 1: 意图匹配 ────────────────────────────────────────────────────
  sse('phase', { phase:'intent_analysis', message:'正在分析事件意图...' });

  const intentList = Object.entries(INTENT_MAP)
    .map(([id, v]) => `${id} | ${v.name} | ${v.tactic}`)
    .join('\n');

  let intentResult = {};
  try {
    intentResult = await llmCallSync([
      { role:'system', content:`你是安全事件意图分析专家。根据告警信息，从以下预定义意图列表中选择最匹配的1-3个意图ID，提取事件基本信息，并提取所有可用于日志查询的关键实体（IOC）。

【强制要求】intents 数组绝对不能为空，必须从下方意图列表中至少选择1个最匹配的 ID（即使告警信息很模糊，也要根据有限线索做出最合理推测）。返回空数组将被视为分析失败。

意图列表（格式：ID | 名称 | 战术）：
${intentList}

只输出JSON对象，不要代码块，不要解释：
{
  "intents": ["INI-001"],
  "reason": "选择原因（1句话）",
  "event_basic": { "source":"来源系统", "type":"事件分类", "id":"事件ID或自动生成SEC-YYYYMMDD-001", "start_time":"事件开始时间ISO8601" },
  "event_summary": { "time":"告警触发时间", "title":"30字以内标题", "content":"告警摘要100字以内", "security_policy":"触发策略留空则空串", "related_assets":"涉及资产" },
  "iocs": ["ip:1.2.3.4", "user:zhang.san@company.com", "domain:evil.com", "hash:abc123", "email:attacker@phish.com"]
}

iocs字段说明：
- 从告警数据中提取所有可用于精准过滤日志的实体值，格式为 "类型:值"
- 类型包括：ip、user、domain、email、hash、host、process、url 等
- 没有明确实体时返回空数组 []` },
      { role:'user', content:`告警数据：\n${alertText.slice(0, 3000)}` },
    ], { maxTokens:900, timeout:30000 });
  } catch(e) {
    console.warn('[inv] 意图分析失败:', e.message, '，使用默认意图');
    intentResult = { intents:[], reason:'意图分析失败', event_basic:{}, event_summary:{} };
  }

  // 【保证】至少匹配到一个有效意图 — 三层兜底
  // 1) 过滤掉不存在于 INTENT_MAP 的非法 ID
  let matchedIntents = Array.isArray(intentResult.intents)
    ? intentResult.intents.filter(id => typeof id === 'string' && INTENT_MAP[id])
    : [];

  // 2) 第一次为空 → 再让 LLM 强制重选一次（更严格的提示）
  if (matchedIntents.length === 0) {
    console.warn('[inv] 首次意图匹配为空或无效，强制重试一次...');
    try {
      const retryResult = await llmCallSync([
        { role:'system', content:`你是安全事件意图分析专家。【绝对强制】从下方列表中必须选出1个最相关的意图ID（不允许返回空数组、不允许编造 ID）。即使告警信息含糊，也要根据关键词（如登录、邮件、扫描、外联、勒索等）做最合理推测。

意图列表（ID | 名称 | 战术）：
${intentList}

只输出JSON：{"intents":["XXX-001"],"reason":"为什么选这个（1句话）"}` },
        { role:'user', content:`告警数据：\n${alertText.slice(0, 2500)}` },
      ], { maxTokens:300, timeout:20000 });
      const retried = Array.isArray(retryResult.intents)
        ? retryResult.intents.filter(id => typeof id === 'string' && INTENT_MAP[id])
        : [];
      if (retried.length > 0) {
        matchedIntents = retried;
        intentResult.reason = retryResult.reason || intentResult.reason || '重试后匹配';
        console.log(`\x1b[33m[inv]\x1b[0m 重试匹配成功：${matchedIntents.join(',')}`);
      }
    } catch(e) { console.warn('[inv] 意图重试失败:', e.message); }
  }

  // 3) 重试仍为空 → 用关键词启发式从告警内容映射一个兜底意图（保证非空）
  if (matchedIntents.length === 0) {
    const t = (alertText || '').toLowerCase();
    let fb = 'INI-001'; // 终极默认：钓鱼初始访问（最常见场景）
    if (/bec|商业邮件|impersonat|ceo.*转账|紧急转账/i.test(alertText))     fb = 'INI-003';
    else if (/钓鱼|phish|spoof|伪装.*邮件/i.test(alertText))               fb = 'INI-001';
    else if (/勒索|ransom|encrypt.*file/i.test(alertText))                  fb = 'IMP-001';
    else if (/爆破|喷射|brute|password.*spray/i.test(alertText))            fb = 'INI-006';
    else if (/mfa.*疲劳|mfa.*fatigue/i.test(alertText))                     fb = 'INI-007';
    else if (/扫描|scan|nmap|port.*scan/i.test(alertText))                  fb = 'INT-001';
    else if (/c2|beacon|外联|command.*control/i.test(alertText))            fb = 'C2-001';
    else if (/横向|lateral|psexec|wmi|pass.*the.*hash/i.test(alertText))    fb = 'LAT-002';
    else if (/外传|exfil|数据泄露|data.*leak/i.test(alertText))             fb = 'EXF-001';
    else if (/恶意进程|malware|trojan|后门|webshell/i.test(alertText))      fb = 'EXE-001';
    else if (/凭据|credential|登录.*失败|abnormal.*login/i.test(alertText)) fb = 'INI-005';
    else if (/dns.*隧道|dns.*tunnel/i.test(alertText))                       fb = 'EVA-004';
    else if (/lsass|sam|ntds/i.test(alertText))                              fb = 'CRD-001';
    // 兜底校验（理论上 fb 必在 INTENT_MAP）
    if (!INTENT_MAP[fb]) fb = Object.keys(INTENT_MAP)[0];
    matchedIntents = [fb];
    const fbReason = `（LLM 未返回有效意图，根据告警关键词自动兜底匹配为 ${fb}·${INTENT_MAP[fb].name}）`;
    intentResult.reason = (intentResult.reason && intentResult.reason !== '意图分析失败')
      ? intentResult.reason + fbReason
      : fbReason;
    console.log(`\x1b[33m[inv]\x1b[0m 关键词兜底匹配：${fb}`);
  }

  const eventBasic      = intentResult.event_basic    || {};
  const eventSummary    = intentResult.event_summary  || {};
  const extractedIocs   = Array.isArray(intentResult.iocs) ? intentResult.iocs.filter(v => typeof v === 'string' && v.includes(':')) : [];

  // Derive query time window from event start_time (±2h around event, capped at now)
  const eventTs  = eventBasic.start_time ? new Date(eventBasic.start_time) : null;
  const validTs  = eventTs && !isNaN(eventTs.getTime()) && eventTs.getTime() < Date.now() + 86400000;
  const queryFrom = validTs ? new Date(eventTs.getTime() - 2 * 3600 * 1000).toISOString() : '-24h';
  const queryTo   = validTs ? new Date(Math.min(eventTs.getTime() + 3 * 3600 * 1000, Date.now())).toISOString() : 'now';

  // 构造意图详情（含名称、战术、可用原子能力数）— 前端用于展示"意图匹配过程"
  const intentDetailsRich = matchedIntents.map(id => {
    const info = INTENT_MAP[id] || {};
    const caps = info.caps || [];
    return {
      id, name: info.name || id, tactic: info.tactic || '',
      caps: caps.map(c => ({ id: c, name: ATOMIC_CAP_NAMES[c] || c })),
    };
  });

  sse('intent_matched', {
    intents: matchedIntents,
    intent_details: intentDetailsRich,
    reason:  intentResult.reason || '',
    event_basic:   eventBasic,
    event_summary: eventSummary,
  });

  // ── Phase 2: 能力规划 ────────────────────────────────────────────────────
  sse('phase', { phase:'capability_plan', message:'正在规划调查能力...' });

  // 如果没有任何已注册日志源，但有上传日志，则自动将上传日志作为唯一日志源
  if (uploadedLogs.length > 0 && !logSourceRegistry['uploaded-local']) {
    logSourceRegistry['uploaded-local'] = {
      id: 'uploaded-local', name: '上传日志（本地文件）', platform: 'uploaded', status: 'active',
    };
  }
  const logSources = Object.values(logSourceRegistry).map(c => ({
    id:c.id, name:c.name, platform:c.platform,
    region:c.region, logstore:c.logstore, index:c.index,
  }));

  const intentDetails = matchedIntents.map(id => {
    const info = INTENT_MAP[id];
    if (!info) return null;
    const caps = info.caps.map(c => `  - ${c} ${ATOMIC_CAP_NAMES[c]||c}`).join('\n');
    return `${id} ${info.name}（${info.tactic}）：\n${caps}`;
  }).filter(Boolean).join('\n\n');

  const sourceList = logSources.length > 0
    ? logSources.map(s => `  - id="${s.id}" name="${s.name}" platform="${s.platform}"`).join('\n')
    : '  （无已注册日志源）';

  const iocSection = extractedIocs.length > 0
    ? `\n【告警关键实体（IOC）— query必须基于以下实体值精准过滤】\n${extractedIocs.map(v => `  ${v}`).join('\n')}`
    : '';

  let planResult = { plan:[] };
  try {
    planResult = await llmCallSync([
      { role:'system', content:`你是安全调查能力规划专家。根据已匹配意图，从对应原子能力中选择最重要的4-6个能力，规划执行顺序。

【绝对规则 — source_id 必填】
- 每个能力都必须查询日志，source_id 必须设置为下方"可用日志源"中的某个真实 id
- 严禁返回 null、严禁使用"无日志源"作为借口跳过执行
- 即使是威胁情报/计算类能力（8.x/11.x），也要去对应日志源中查询关联记录
- 如果只有一个日志源，所有能力的 source_id 都填该日志源的 id

【核心规则 — 关于 query 字段】
1. query 必须包含具体的实体值（IP、用户名、域名、邮箱等），不允许只用 * 或纯行为关键词
2. 若告警提供了 IOC 实体，必须将其作为 query 的主过滤条件
3. 正确示例：
   - "src_ip:185.220.101.34 OR dst_ip:185.220.101.34"
   - "user:zhang.san@company.com OR sender:zhang.san"
   - "domain:micros0ft-support.com OR url:*micros0ft-support*"
   - "email.from:attacker@phish.com AND mail_direction:inbound"
4. 错误示例（禁止）：
   - "*"（纯通配符）
   - "mail_direction:inbound AND suspicious"（无具体实体）
   - "action:login AND failed"（无具体用户/IP）

【其他规则】
- from/to 使用提供的事件时间窗口，不要自行生成
- limit建议50

只输出JSON对象：
{
  "plan": [
    { "step":1, "capability":"1.1", "name":"能力名称", "intent":"INI-001", "query":"src_ip:185.220.101.34", "from":"${queryFrom}", "to":"${queryTo}", "limit":50, "source_id":"${logSources[0]?.id||''}" }
  ]
}` },
      { role:'user', content:`已匹配意图及原子能力：\n${intentDetails||'（无匹配意图）'}\n\n可用日志源：\n${sourceList}${iocSection}\n\n事件时间窗口：from=${queryFrom}  to=${queryTo}\n\n告警摘要：\n${alertText.slice(0,1200)}` },
    ], { maxTokens:1400, timeout:30000 });
  } catch(e) {
    console.warn('[inv] 能力规划失败:', e.message);
    planResult = { plan:[] };
  }

  // Normalize step numbers to 1-based sequential — LLM may skip or duplicate them
  const plan = (Array.isArray(planResult.plan) ? planResult.plan : [])
    .map((s, i) => ({ ...s, step: i + 1 }));
  sse('capability_plan', { steps: plan });

  // ── Phase 3: 日志查询执行 ────────────────────────────────────────────────
  sse('phase', { phase:'log_query', message:`正在执行调查能力（共 ${plan.length} 步）...` });

  const stepResults = [];

  for (const step of plan) {
    const capName = step.name || ATOMIC_CAP_NAMES[step.capability] || step.capability;
    sse('step_start', {
      step:       step.step,
      capability: step.capability,
      name:       capName,
      intent:     step.intent,
      query:      step.query || '*',
    });

    const stepR = {
      step:       step.step,
      capability: step.capability,
      name:       capName,
      intent:     step.intent,
      query:      step.query,
      ok:         false,
      logs:       [],
      count:      0,
      summary:    '',
    };

    // 【强制】每个原子能力都必须查询日志 — 若 LLM 没给/给错 source_id，自动 fallback
    let resolvedSrc = step.source_id && logSourceRegistry[step.source_id]
      ? logSourceRegistry[step.source_id]
      : pickFallbackLogSource();

    if (resolvedSrc) {
      try {
        const qRes = await queryLogSource(resolvedSrc, {
          query: step.query || '*',
          from:  step.from  || '-24h',
          to:    step.to    || 'now',
          limit: Math.min(step.limit || 50, 100),
        });
        stepR.ok    = qRes.ok;
        stepR.logs  = qRes.logs || [];
        stepR.count = stepR.logs.length;
        // summary 只在 fallback 切换 / 失败时给出有意义的提示，成功时留空（由 AI 解读填充）
        const srcNote = (step.source_id && step.source_id !== resolvedSrc.id)
          ? `（自动切换到日志源「${resolvedSrc.name}」）` : '';
        stepR.summary = qRes.ok ? srcNote : ('查询失败: ' + (qRes.msg || '未知错误') + srcNote);
      } catch(e) {
        stepR.summary = '查询异常: ' + e.message;
      }
    } else {
      stepR.ok = false;
      stepR.summary = '没有可用的日志源，请先在「设置 > 日志源」中添加一个本地文件路径日志源';
    }

    stepResults.push(stepR);
    sse('step_result', {
      step:       stepR.step,
      name:       stepR.name,
      capability: stepR.capability,
      ok:         stepR.ok,
      count:      stepR.count,
      summary:    stepR.summary,
      // send first 5 log samples to client for display
      logs: stepR.logs.slice(0, 5).map(l => ({
        timestamp: l.timestamp, source_ip: l.source_ip,
        user: l.user, action: l.action, status: l.status,
        message: l.message.slice(0, 200),
      })),
    });

    // 【按步骤打字机解读】所有成功执行的步骤（无论是否有日志）都做 LLM 解读
    if (stepR.ok) {
      sse('step_interpreting', { step: stepR.step });
      const interp = await interpretStepLogs(stepR, alertText, stepResults.slice(0, -1));
      if (interp) {
        stepR.ai_interpretation = interp.conclusion;
        stepR.key_findings      = interp.key_findings;
        stepR.risk_level        = interp.risk_level;
        stepR.reasoning         = interp.reasoning;
        stepR.observation       = interp.observation;
        stepR.finding_summary   = interp.finding_summary;
        sse('step_interpretation', {
          step:           stepR.step,
          interpretation: interp.conclusion,
          key_findings:   interp.key_findings,
          risk_level:     interp.risk_level,
          reasoning:      interp.reasoning,
          observation:    interp.observation,
          finding_summary: interp.finding_summary,
        });
      } else {
        const fbConclusion = stepR.count > 0
          ? `共获取 ${stepR.count} 条日志，但 AI 解读暂时失败，请展开下方日志样本人工分析`
          : `${stepR.name} 在指定时间窗口内未查询到匹配日志，该方面未发现异常活动`;
        stepR.ai_interpretation = fbConclusion;
        stepR.reasoning         = `执行 ${stepR.name}，验证相关行为`;
        stepR.observation       = stepR.count > 0 ? `共匹配 ${stepR.count} 条日志` : '查询返回 0 条记录';
        sse('step_interpretation', {
          step: stepR.step, interpretation: fbConclusion,
          key_findings: [], risk_level: 'none',
          reasoning: stepR.reasoning, observation: stepR.observation,
        });
      }
    }
  }

  // ── Phase 4: ReAct 评估与补充调查（真正的 LLM 驱动 ReAct 范式）──────────
  const MAX_REACT_ROUNDS = 2;
  for (let reactRound = 1; reactRound <= MAX_REACT_ROUNDS; reactRound++) {
    sse('phase', { phase:'react_eval', message: reactRound === 1 ? '正在评估证据充分性...' : `ReAct 第${reactRound}轮评估...` });

    const totalCount = stepResults.reduce((a, r) => a + r.count, 0);
    const hasLogsNow = stepResults.some(r => r.ok && r.count > 0);

    // 已执行能力集合（避免重复）
    const usedCaps = new Set(stepResults.map(r => r.capability));

    // 当前意图下仍未使用的原子能力
    const availableCaps = matchedIntents
      .flatMap(id => (INTENT_MAP[id]?.caps || []))
      .filter(c => !usedCaps.has(c))
      .filter((c, i, arr) => arr.indexOf(c) === i);

    // 证据摘要（发给 LLM 用于评估）
    const evidenceDigest = stepResults.map(r => {
      const logSample = r.ok && r.logs.length > 0
        ? '\n' + r.logs.slice(0, 2).map(l => `    ${(l.timestamp||'').slice(0,19)} ${(l.message||'').slice(0,130)}`).join('\n')
        : '';
      return `步骤${r.step}[${r.capability}·${r.name}]：${r.ok ? r.count+'条' : '失败·'+r.summary}${logSample}`;
    }).join('\n\n');

    let evalResult = { sufficient: hasLogsNow || logSources.length === 0, reason: '基于现有证据', extra_plan: [] };
    try {
      evalResult = await llmCallSync([
        { role:'system', content:`你是安全调查 ReAct 评估器。评估当前调查证据是否足以得出结论，若不足则给出补充调查计划。

【已匹配意图】：${intentsDesc}

【仍可调用的原子能力（未执行，必须从此列表选择）】：
${availableCaps.length > 0
  ? availableCaps.map(c => `  ${c} · ${ATOMIC_CAP_NAMES[c]||c}`).join('\n')
  : '  （全部相关能力已执行）'}

【可用日志源】：
${logSources.length > 0
  ? logSources.map(s => `  id="${s.id}" name="${s.name}" platform="${s.platform}"`).join('\n')
  : '  （无日志源）'}

评估标准：
- 有效日志≥2条且覆盖核心攻击行为 → sufficient=true
- 日志为空或关键环节缺失且仍有可用能力 → sufficient=false，在extra_plan中给出1-3个补充步骤
- 无可用能力 → sufficient=true（按现有数据分析）

补充计划要求：
- extra_plan中的query必须包含具体实体值（IP/用户/域名/邮箱）
- extra_plan中每一步的 source_id 必须是上方"可用日志源"中的真实 id，严禁填 null

只输出JSON（不要代码块）：
{"sufficient":true,"reason":"评估原因","extra_plan":[]}
或（不足时）：
{"sufficient":false,"reason":"缺少哪方面证据","extra_plan":[{"capability":"X.X","name":"能力名","query":"实体精确查询","source_id":"${logSources[0]?.id||''}","from":"${queryFrom}","to":"${queryTo}","limit":30}]}` },
        { role:'user', content:`告警摘要：${alertText.slice(0,500)}\n\n当前证据（${stepResults.length}步·${totalCount}条日志）：\n${evidenceDigest}` },
      ], { maxTokens: 600, timeout: 20000 });
    } catch(e) {
      console.warn('[inv] ReAct评估失败:', e.message);
      evalResult = { sufficient: hasLogsNow || logSources.length === 0, reason: '评估超时，按现有证据继续', extra_plan: [] };
    }

    const sufficient = evalResult.sufficient ?? (hasLogsNow || logSources.length === 0);
    sse('react_eval', { sufficient, reason: evalResult.reason || '', round: reactRound });

    if (sufficient || !Array.isArray(evalResult.extra_plan) || evalResult.extra_plan.length === 0) break;

    // 执行 LLM 规划的补充能力
    sse('phase', { phase:'log_query', message:`ReAct 第${reactRound}轮：执行补充调查（${evalResult.extra_plan.length}步）...` });

    for (const step of evalResult.extra_plan) {
      const stepNum = stepResults.length + 1;
      const capName = step.name || ATOMIC_CAP_NAMES[step.capability] || step.capability;
      sse('step_start', { step: stepNum, capability: step.capability, name: capName, intent: matchedIntents[0]||'', query: step.query || '*' });

      const stepR = { step: stepNum, capability: step.capability, name: capName, intent: matchedIntents[0]||'', query: step.query, ok: false, logs: [], count: 0, summary: '' };

      // 【强制】ReAct 补充能力也必须查询日志 — 同样支持 fallback
      const srcId = step.source_id && step.source_id !== 'null' ? step.source_id : null;
      let resolvedSrc = srcId && logSourceRegistry[srcId]
        ? logSourceRegistry[srcId]
        : pickFallbackLogSource();

      if (resolvedSrc) {
        try {
          const qRes = await queryLogSource(resolvedSrc, {
            query: step.query || '*', from: step.from || '-24h', to: step.to || 'now',
            limit: Math.min(step.limit || 30, 100),
          });
          stepR.ok    = qRes.ok;
          stepR.logs  = qRes.logs || [];
          stepR.count = stepR.logs.length;
          const srcNote = (srcId && srcId !== resolvedSrc.id) ? `（自动切换到「${resolvedSrc.name}」）` : '';
          stepR.summary = qRes.ok ? srcNote : ('查询失败: ' + (qRes.msg || '') + srcNote);
        } catch(e) { stepR.summary = '查询异常: ' + e.message; }
      } else {
        stepR.ok = false;
        stepR.summary = '没有可用的日志源，请先在「设置 > 日志源」中添加一个本地文件路径日志源';
      }

      stepResults.push(stepR);
      sse('step_result', {
        step: stepR.step, name: stepR.name, capability: stepR.capability,
        ok: stepR.ok, count: stepR.count, summary: stepR.summary,
        logs: stepR.logs.slice(0, 5).map(l => ({ timestamp:l.timestamp, source_ip:l.source_ip, user:l.user, action:l.action, status:l.status, message:l.message.slice(0, 200) })),
      });

      // ReAct 补充步骤同样要做 LLM 解读（无论日志数量），并输出 reasoning/observation/finding_summary
      if (stepR.ok) {
        sse('step_interpreting', { step: stepR.step });
        const interp = await interpretStepLogs(stepR, alertText, stepResults.slice(0, -1));
        if (interp) {
          stepR.ai_interpretation = interp.conclusion;
          stepR.key_findings      = interp.key_findings;
          stepR.risk_level        = interp.risk_level;
          stepR.reasoning         = interp.reasoning;
          stepR.observation       = interp.observation;
          stepR.finding_summary   = interp.finding_summary;
          sse('step_interpretation', {
            step: stepR.step, interpretation: interp.conclusion,
            key_findings: interp.key_findings, risk_level: interp.risk_level,
            reasoning: interp.reasoning, observation: interp.observation,
            finding_summary: interp.finding_summary,
          });
        } else {
          const fbConclusion = stepR.count > 0
            ? `共获取 ${stepR.count} 条日志，但 AI 解读暂时失败，请展开下方日志样本人工分析`
            : `${stepR.name} 在指定时间窗口内未查询到匹配日志，该方面未发现异常活动`;
          stepR.ai_interpretation = fbConclusion;
          stepR.reasoning         = `ReAct 补充：执行 ${stepR.name} 弥补前序证据缺口`;
          stepR.observation       = stepR.count > 0 ? `共匹配 ${stepR.count} 条日志` : '查询返回 0 条记录';
          sse('step_interpretation', {
            step: stepR.step, interpretation: fbConclusion, key_findings: [], risk_level: 'none',
            reasoning: stepR.reasoning, observation: stepR.observation,
          });
        }
      }
    }
  }

  const hasLogs    = stepResults.some(r => r.ok && r.count > 0);
  const successCnt = stepResults.filter(r => r.ok).length;

  // ── Phase 5: 最终研判报告 ─────────────────────────────────────────────────
  sse('phase', { phase:'final_analysis', message:'正在生成研判报告...' });

  const intentsDesc = matchedIntents.map(id => {
    const info = INTENT_MAP[id];
    return info ? `${id}·${info.name}(${info.tactic})` : id;
  }).join('；') || '（未匹配到意图）';

  const planDesc = plan.map((s,i) => `步骤${i+1}·${ATOMIC_CAP_NAMES[s.capability]||s.capability}[${s.capability}]`).join(' → ') || '（无执行计划）';
  const autoId   = 'SEC-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-001';

  // ── 服务端确定性构建"事件调查分析·path"（含实际日志，不依赖 LLM 重构）──
  const pathText = stepResults.map(r => {
    const logLines = r.ok && r.logs.length > 0
      ? r.logs.slice(0, 3).map(l => {
          const ts   = (l.timestamp||'').slice(0, 19);
          const meta = [l.source_ip && `src_ip=${l.source_ip}`, l.user && `user=${l.user}`, l.action && `action=${l.action}`].filter(Boolean).join(' ');
          const msg  = (l.message||'').slice(0, 150);
          return `  ${ts}${meta ? ' '+meta : ''} | ${msg}`;
        }).join('\n')
      : '  （无日志数据）';
    return `【步骤${r.step}：${r.name}[${r.capability}]】\n查询：${r.query||'*'}\n关键日志：\n${logLines}\n结论：${r.summary}`;
  }).join('\n\n');

  // ── 威胁路径还原：基于每步的 key_findings，按时间排序 + 去具体实体 + 去重 ─
  // 用于时间轴节点：把具体实体（邮箱/IP/域名/特定用户名）替换成通用描述，便于去重
  function genericizeFinding(text) {
    let s = String(text || '').trim();
    // 邮箱 → "用户邮箱"
    s = s.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi, '用户邮箱');
    // IPv4 → "IP"
    s = s.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'IP');
    // 域名（剩余的，含点号的字母串）→ "域名"
    s = s.replace(/\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+){1,}\b/gi, '域名');
    // Hash（>20 位 hex）→ "Hash"
    s = s.replace(/\b[a-f0-9]{20,}\b/gi, 'Hash');
    // 收尾：去除连续空格 + 末尾标点
    s = s.replace(/\s+/g, '').replace(/[。！？.,，]$/, '');
    return s;
  }

  const rawEvents = [];
  stepResults.forEach(r => {
    if (!r.ok || r.logs.length === 0) return;
    if (!r.risk_level || r.risk_level === 'none') return;

    const sortedTs = r.logs
      .map(l => new Date(l.timestamp||0).getTime())
      .filter(t => t > 0)
      .sort((a, b) => a - b);
    const repTs = sortedTs[0] ? new Date(sortedTs[0]).toISOString() : '';

    if (r.key_findings && r.key_findings.length > 0) {
      r.key_findings.forEach((finding, i) => {
        const fTs = sortedTs[i] ? new Date(sortedTs[i]).toISOString() : repTs;
        rawEvents.push({
          timestamp: fTs, event: finding, capability: r.name,
          capId: r.capability, risk_level: r.risk_level,
        });
      });
    } else {
      const event = (r.ai_interpretation || '').split(/[。！？\n]/)[0].slice(0, 80) || r.summary || '关键事件';
      rawEvents.push({
        timestamp: repTs, event, capability: r.name,
        capId: r.capability, risk_level: r.risk_level,
      });
    }
  });

  // 按时间排序
  rawEvents.sort((a, b) => new Date(a.timestamp||0) - new Date(b.timestamp||0));

  // 去重：以 genericized 描述为 key，保留最早出现的一条；并把展示文本替换为 generic 版本
  const seen = new Map();   // genericKey → event index
  const dedupedEvents = [];
  rawEvents.forEach(e => {
    const genericText = genericizeFinding(e.event);
    if (!genericText) return;
    if (seen.has(genericText)) return; // 已有相同含义的事件 → 丢弃
    seen.set(genericText, dedupedEvents.length);
    dedupedEvents.push({
      timestamp:  e.timestamp,
      event:      genericText,
      original:   e.event,
      capability: e.capability,
      capId:      e.capId,
      risk_level: e.risk_level,
    });
  });

  // 【LLM 合并】同一分钟内的多条威胁事件 → 合并为一条精炼描述
  const threatEvents = await mergeThreatEventsByMinute(dedupedEvents);

  // 文本格式：time | event | capability | risk_level
  const timelineRaw = threatEvents.slice(0, 15).map(e => {
    const ts = (e.timestamp||'').slice(0, 19);
    return `${ts} | ${e.event} | ${e.capability} | ${e.risk_level}`;
  }).join('\n');

  // ── 证据摘要（发给 LLM） ─────────────────────────────────────────────────
  const evidenceSummary = stepResults.filter(r => r.ok && r.logs.length > 0).map(r => {
    const sample = r.logs.slice(0, 4).map(l =>
      `{"t":"${(l.timestamp||'').slice(0,19)}","ip":"${l.source_ip||''}","user":"${l.user||''}","action":"${l.action||''}","msg":"${(l.message||'').slice(0,140)}"}`
    ).join('\n');
    return `[${r.capability} ${r.name}]\n${sample}`;
  }).join('\n---\n');

  const finalSys = `你是 SecMind AI 安全运营分析助手。已完成 ${stepResults.length} 个调查步骤，共获取 ${stepResults.reduce((a,r)=>a+r.count,0)} 条日志。

已匹配意图：${intentsDesc}

【重要指令】：
1. investigation_analysis.path 字段由系统自动填充，你输出时直接用提供的"调查步骤执行路径"原文，不要修改，用\\n表示换行
2. threat_path.timeline 由系统已构建（基于每步 AI 解读的关键发现按时间排序），你直接用提供的"威胁路径时间轴"原文，不要修改
3. 每步结论（investigation_analysis下的qualitative_conclusion/evidence）要基于实际找到的日志，有日志则引用时间/行为，无日志则说明无法验证
4. 所有字符串值不能包含裸换行，用\\n代替

严格输出JSON，不要代码块，不要解释：
{
  "event_basic": { "source":"来源系统", "type":"事件分类", "id":"${eventBasic.id||autoId}", "start_time":"${eventBasic.start_time||''}", "complete_time":"${new Date().toISOString()}" },
  "event_summary": { "time":"告警时间", "level":"高危/疑似/低", "title":"30字内标题", "content":"100字内摘要", "security_policy":"触发策略", "related_assets":"涉及资产" },
  "ai_reasoning_path": "①意图分析[${matchedIntents.join(',')||'0.1'}] → ②能力规划 → ③${planDesc} → ④ReAct评估 → ⑤研判结论",
  "investigation_analysis": {
    "path": "（此处填入系统提供的调查路径原文，不要修改）",
    "preliminary_verdict": "高危/疑似/低",
    "qualitative_conclusion": "基于实际日志的100字定性描述",
    "evidence": "引用关键日志时间和行为作为证据"
  },
  "threat_path": {
    "timeline": "仅基于实际日志按时间升序，每行：时间 | 事件 | 来源",
    "intent_method": "威胁意图与攻击手段100字",
    "attack_technique": "ATT&CK技术编号如T1566.001",
    "threat_intel": "情报来源说明"
  },
  "impact": { "affected_assets":"受影响账号/主机/系统", "description":"影响描述50字" },
  "final_conclusion": { "summary":"100字最终结论（引用实际日志证据）", "affected_info":"受影响资产详情", "impact_range":"影响范围" },
  "disposition": { "immediate":"立即执行的处置步骤（换行用\\n）", "week_tracking":"7天跟踪建议", "long_term":"长期安全改进建议" }
}`;

  const finalUser = `【告警原始数据】：
${alertText.slice(0, 2000)}

【调查步骤执行路径（直接填入investigation_analysis.path，不要修改）】：
${pathText.slice(0, 3500)}

【威胁路径时间轴（已由系统从每步AI解读的关键发现按时间排序生成，直接填入threat_path.timeline，不要修改）】：
${timelineRaw || '（暂无威胁事件 — 各步骤未发现明显异常）'}

${hasLogs ? `【证据日志详情】：\n${evidenceSummary.slice(0,2000)}` : '注意：无可用日志，仅基于告警字段分析，结论置信度为"低"，务必标注"缺乏日志验证"。'}`;

  let finalReport = null;
  try {
    finalReport = await llmCallSync([
      { role:'system', content: finalSys },
      { role:'user',   content: finalUser },
    ], { maxTokens:3500, timeout:90000 });
  } catch(e) {
    console.warn('[inv] 最终报告生成失败:', e.message);
  }

  // 构建最终结果（fallback）
  if (!finalReport || finalReport._parseError) {
    finalReport = {
      event_basic:    { ...eventBasic, complete_time: new Date().toISOString(), id: eventBasic.id||autoId },
      event_summary:  { ...eventSummary, level:'疑似' },
      ai_reasoning_path: `①意图分析[${matchedIntents.join(',')||'0.1'}] → ②能力规划 → ③${planDesc} → ④ReAct评估 → ⑤研判结论`,
      investigation_analysis: {
        path: pathText,
        preliminary_verdict: '疑似',
        qualitative_conclusion: hasLogs ? `已获取 ${stepResults.reduce((a,r)=>a+r.count,0)} 条日志，综合分析请参见各步骤结果` : '无日志数据，仅基于告警字段分析，结论置信度低',
        evidence: hasLogs ? `通过 ${successCnt} 个步骤收集到相关日志` : '无日志数据',
      },
      threat_path: { timeline: timelineRaw, intent_method: intentsDesc, attack_technique:'', threat_intel:'' },
      impact:      { affected_assets: eventBasic.id||'', description:'' },
      final_conclusion: { summary:`调查完成，执行 ${stepResults.length} 步，获取 ${stepResults.reduce((a,r)=>a+r.count,0)} 条日志`, affected_info:'', impact_range:'' },
      disposition: { immediate:'', week_tracking:'', long_term:'' },
    };
  }

  // 始终用服务端确定性构建的 path 覆盖 LLM 生成的（防止 LLM 遗漏/篡改实际步骤）
  if (!finalReport.investigation_analysis) finalReport.investigation_analysis = {};
  finalReport.investigation_analysis.path = pathText;

  // 始终用服务端基于 key_findings 构建的威胁路径覆盖 LLM 生成的（防止 LLM 篡改时间或捏造事件）
  if (!finalReport.threat_path) finalReport.threat_path = {};
  finalReport.threat_path.timeline = timelineRaw;
  finalReport.threat_path._events  = threatEvents;  // 结构化数据，供前端精细渲染

  // 【兜底】把 LLM 漏填的字段（受影响资产、ATT&CK、处置建议、最终结论...）用计算值补齐
  enrichFinalReport(finalReport, { stepResults, matchedIntents, intentsDesc, extractedIocs, eventBasic });

  // 附加步骤元数据与完整日志样本（UI 用于逐步展示，含 ReAct 三段 + 关键发现总结）
  finalReport._react_steps = stepResults.map(r => ({
    step:r.step, capability:r.capability, name:r.name, intent:r.intent,
    ok:r.ok, count:r.count, summary:r.summary, query: r.query,
    reasoning:         r.reasoning || '',
    observation:       r.observation || '',
    ai_interpretation: r.ai_interpretation || '',
    key_findings:      r.key_findings || [],
    finding_summary:   r.finding_summary || '',
    risk_level:        r.risk_level || 'none',
    logs: r.logs.slice(0, 8).map(l => ({ timestamp:l.timestamp, source_ip:l.source_ip, user:l.user, action:l.action, message:(l.message||'').slice(0,200) })),
  }));
  finalReport._intents         = matchedIntents;
  finalReport._intent_details  = intentDetailsRich;
  finalReport._intent_reason   = intentResult.reason || '';
  // 原始能力规划（不含 ReAct 补充）— 前端用于展示"原子能力挑选与排序过程"
  finalReport._initial_plan    = plan.map(s => ({
    step: s.step, capability: s.capability,
    name: s.name || ATOMIC_CAP_NAMES[s.capability] || s.capability,
    intent: s.intent || '', query: s.query || '', source_id: s.source_id || null,
  }));

  console.log(`\x1b[32m[inv]\x1b[0m 调查完成 · 意图:${matchedIntents.join(',')||'无'} · 步骤:${stepResults.length} · 日志:${stepResults.reduce((a,r)=>a+r.count,0)}条`);
  sse('complete', { result: finalReport });
}

/* ── 统一查询入口 ────────────────────────────────────────────────────────── */
async function queryLogSource(cfg, { query='*', from='-1h', to='now', limit=100 } = {}) {
  const p = cfg.platform || 'custom';
  const opts = { query, limit: Math.min(limit, 1000), ...resolveTimeRange(from, to) };
  console.log(`\x1b[36m[logsrc]\x1b[0m query "${cfg.name||cfg.id}" platform=${p} q="${query}" from=${from}`);
  switch(p) {
    case 'aliyun-sls':  return queryAliyunSLS(cfg, opts);
    case 'tencent-cls': return queryTencentCLS(cfg, opts);
    case 'elastic':     return queryElastic(cfg, opts);
    case 'loki':        return queryLoki(cfg, opts);
    case 'splunk':      return querySplunk(cfg, opts);
    case 'uploaded':    return queryUploadedLogs(opts);
    case 'local-file':  return queryLocalFileLogs(cfg, opts);
    default: return { ok:false, msg:`平台 "${p}" 暂不支持查询接口` };
  }
}

/* ── 拉取：查询后注入事件队列（供「拉取日志」按钮使用） ─────────────────── */
async function pullLogSource(cfg) {
  const result = await queryLogSource(cfg, { from:'-1h', limit:100 });
  if (!result.ok) return result;
  const events = (result.logs||[]).map(log => {
    const id = 'EVT-LOG-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
    return {
      id, alertId:id, title: log.message.slice(0,200),
      sceneCategory: detectScene(log.message, log.raw),
      priority: normSeverity(log.level), severity: normSeverity(log.level),
      sourceSystem: cfg.name||cfg.platform,
      triggeredAt: log.timestamp,
      entities: extractEntities(log.raw),
      investigationStatus:'uninvestigated', processStatus:'pending', assignee:null,
      rawData: log.raw, _logSourceId:cfg.id||'', _logPlatform:cfg.platform,
    };
  });
  events.forEach(e => eventQueue.push(e));
  return { ok:true, count:events.length, msg:`${cfg.name||cfg.platform} · 拉取 ${events.length} 条` };
}

/* ── HTTP server ─────────────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  const u        = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = u.pathname;
  const query    = Object.fromEntries(u.searchParams);

  /* Preflight */
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const json = (code, obj) => {
    res.writeHead(code, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };

  /* ── GET / → serve index.html ──────────────────────────────────────────── */
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      res.writeHead(200, { ...CORS, 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500, CORS);
      res.end('Cannot read index.html: ' + e.message);
    }
    return;
  }

  /* ── POST /api/config/llm — 同步 LLM 配置（UI 保存时调用）────────────── */
  if (req.method === 'POST' && pathname === '/api/config/llm') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      try {
        const cfg = raw ? JSON.parse(raw) : {};
        llmCfg = cfg.apiKey ? cfg : null;
        console.log(`\x1b[36m[llm]\x1b[0m 配置已更新: provider=${cfg.provider||'?'} model=${cfg.model||'?'} key=${cfg.apiKey?'✓':'✗'}`);
        json(200, { ok:true, llmReady: !!llmCfg });
      } catch(e) { json(400, { ok:false, error:e.message }); }
    });
    return;
  }

  /* ── GET /webhook/status — health check ────────────────────────────────── */
  if (req.method === 'GET' && pathname === '/webhook/status') {
    json(200, { ok: true, queued: eventQueue.length, ts: new Date().toISOString() });
    return;
  }

  /* ── POST /webhook/receive — accept incoming webhook ───────────────────── */
  if (req.method === 'POST' && pathname === '/webhook/receive') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      let body;
      try { body = raw ? JSON.parse(raw) : {}; } catch(e) {
        json(400, { ok:false, error:'JSON parse error: ' + e.message }); return;
      }
      // 预生成 ID，先响应，不阻塞发送方
      const eventId = 'EVT-WH-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
      json(200, { ok:true, event_id: eventId });

      // 异步归一化（有 LLM 配置时用 LLM 映射字段，否则用基础规则）
      setImmediate(async () => {
        try {
          let event = normalizeWebhook(body, query.source || '', req.headers);
          event.id = eventId;
          if (event.alertId === event.id || !event.alertId) event.alertId = eventId;

          if (llmCfg?.apiKey) {
            const mapped = await llmNormalize(body);
            if (mapped) {
              if (mapped.title)                        event.title         = String(mapped.title).slice(0,200);
              if (mapped.severity)                     { event.severity = normSeverity(mapped.severity); event.priority = event.severity; }
              if (mapped.alertId)                      event.alertId       = String(mapped.alertId);
              if (mapped.sourceSystem)                 event.sourceSystem  = String(mapped.sourceSystem);
              if (mapped.triggeredAt)                  event.triggeredAt   = mapped.triggeredAt;
              if (mapped.sceneCategory)                event.sceneCategory = mapped.sceneCategory;
              if (Array.isArray(mapped.entities) && mapped.entities.length) event.entities = mapped.entities;
              event._llmNormalized = true;
            }
          }

          eventQueue.push(event);
          const tag = event._llmNormalized ? '[LLM]' : '[rule]';
          console.log(`\x1b[32m[webhook]\x1b[0m ${tag} ${event.sourceSystem} → ${event.title.slice(0,72)}`);
        } catch(e) {
          console.error('\x1b[31m[webhook]\x1b[0m normalize error:', e.message);
        }
      });
    });
    return;
  }

  /* ── GET /webhook/events — frontend drains queue ───────────────────────── */
  if (req.method === 'GET' && pathname === '/webhook/events') {
    const events = eventQueue.splice(0);          // atomic drain
    json(200, { events, ts: new Date().toISOString() });
    return;
  }

  /* ── POST /mcp/email/call — execute email tool via Resend API ─────────── */
  if (req.method === 'POST' && pathname === '/mcp/email/call') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      (async () => {
        try {
          const { tool, args = {}, apiKey } = raw ? JSON.parse(raw) : {};
          if (!apiKey) { json(400, { ok:false, error:'apiKey 必填' }); return; }
          if (!tool)   { json(400, { ok:false, error:'tool 必填'   }); return; }
          const result = await callEmailTool(tool, args, apiKey);
          console.log(`\x1b[36m[mcp]\x1b[0m ${tool} → ok`);
          json(200, { ok:true, tool, result });
        } catch(e) {
          console.error(`\x1b[31m[mcp]\x1b[0m ${e.message}`);
          json(500, { ok:false, error: e.message });
        }
      })();
    });
    return;
  }

  /* ── POST /api/log-source/test — 日志平台连通性测试 ───────────────────── */
  if (req.method === 'POST' && pathname === '/api/log-source/test') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      (async () => {
        try {
          const cfg = raw ? JSON.parse(raw) : {};
          const result = await testLogSource(cfg);
          json(200, result);
        } catch(e) {
          console.error(`\x1b[31m[logsrc]\x1b[0m ${e.message}`);
          json(200, { ok:false, msg:'测试异常：' + e.message });
        }
      })();
    });
    return;
  }

  /* ── POST /api/log-source/pull — 主动拉取日志 ────────────────────────────── */
  if (req.method === 'POST' && pathname === '/api/log-source/pull') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      (async () => {
        try {
          const cfg = raw ? JSON.parse(raw) : {};
          const result = await pullLogSource(cfg);
          json(200, result);
        } catch(e) {
          console.error(`\x1b[31m[logsrc]\x1b[0m pull error: ${e.message}`);
          json(200, { ok:false, msg:'拉取异常：' + e.message });
        }
      })();
    });
    return;
  }

  /* ── POST /api/log-source/register — 注册/更新日志源配置 ─────────────────── */
  if (req.method === 'POST' && pathname === '/api/log-source/register') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      try {
        const list = JSON.parse(raw||'[]');
        const arr  = Array.isArray(list) ? list : [list];
        arr.forEach(cfg => { if (cfg.id) { logSourceRegistry[cfg.id] = cfg; } });
        console.log(`\x1b[36m[logsrc]\x1b[0m registered ${arr.length} source(s)`);
        json(200, { ok:true, count: arr.length });
      } catch(e) { json(400, { ok:false, error:e.message }); }
    });
    return;
  }

  /* ── DELETE /api/log-source/register/:id — 注销 ──────────────────────────── */
  if (req.method === 'DELETE' && pathname.startsWith('/api/log-source/register/')) {
    const id = decodeURIComponent(pathname.slice('/api/log-source/register/'.length));
    delete logSourceRegistry[id];
    json(200, { ok:true });
    return;
  }

  /* ── POST /api/log-source/upload — 上传本地日志文件 ─────────────────────── */
  if (req.method === 'POST' && pathname === '/api/log-source/upload') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const logs = Array.isArray(body.logs) ? body.logs : [];
        if (logs.length === 0) { json(400, { ok:false, error:'日志数组为空' }); return; }
        uploadedLogs = logs;
        // 自动注册为 platform=uploaded 的日志源
        logSourceRegistry['uploaded-local'] = {
          id: 'uploaded-local', name: body.name || '上传日志（本地文件）',
          platform: 'uploaded', status: 'active',
        };
        console.log(`\x1b[36m[upload]\x1b[0m 已接收 ${logs.length} 条上传日志，来源="${body.name||'unknown'}"`);
        json(200, { ok:true, count: logs.length });
      } catch(e) { json(400, { ok:false, error:e.message }); }
    });
    return;
  }

  /* ── DELETE /api/log-source/upload — 清空上传日志 ───────────────────────── */
  if (req.method === 'DELETE' && pathname === '/api/log-source/upload') {
    uploadedLogs = [];
    delete logSourceRegistry['uploaded-local'];
    json(200, { ok:true });
    return;
  }

  /* ── GET /api/log-source/list — 列出已注册日志源（脱敏）─────────────────── */
  if (req.method === 'GET' && pathname === '/api/log-source/list') {
    const list = Object.values(logSourceRegistry).map(c => ({
      id: c.id, name: c.name, platform: c.platform,
      region: c.region, project: c.project, logstore: c.logstore,
      topicId: c.topicId, index: c.index,
      url: c.url ? c.url.replace(/\/\/[^@]*@/, '//*****@') : '',
      status: c.status || 'unknown',
    }));
    json(200, { ok:true, total: list.length, sources: list });
    return;
  }

  /* ── POST /api/log-source/query — 日志查询接口（供 AI 引擎调用）─────────── */
  if (req.method === 'POST' && pathname === '/api/log-source/query') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      (async () => {
        try {
          const body = raw ? JSON.parse(raw) : {};
          // source_id → 注册表查找；或传入 config 直接使用
          const cfg = body.source_id ? logSourceRegistry[body.source_id] : body.config;
          if (!cfg) { json(404, { ok:false, error:`日志源 "${body.source_id}" 未注册，请重新加载页面` }); return; }
          const result = await queryLogSource(cfg, {
            query: body.query || '*',
            from:  body.from  || '-1h',
            to:    body.to    || 'now',
            limit: body.limit || 100,
          });
          json(200, {
            ...result,
            source: { id:cfg.id, name:cfg.name, platform:cfg.platform },
            query_params: { query:body.query||'*', from:body.from||'-1h', to:body.to||'now', limit:body.limit||100 },
          });
        } catch(e) {
          console.error(`\x1b[31m[logsrc]\x1b[0m query error: ${e.message}`);
          json(200, { ok:false, msg:'查询异常：'+e.message });
        }
      })();
    });
    return;
  }

  /* ── POST /mcp/logsrc/call — MCP 工具桥接（大模型调用日志查询）─────────── */
  if (req.method === 'POST' && pathname === '/mcp/logsrc/call') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      (async () => {
        try {
          const { tool, args = {} } = raw ? JSON.parse(raw) : {};
          let result;
          switch(tool) {
            case 'list_sources': {
              result = {
                sources: Object.values(logSourceRegistry).map(c => ({
                  id:c.id, name:c.name, platform:c.platform,
                  region:c.region, project:c.project, logstore:c.logstore, topicId:c.topicId, index:c.index,
                })),
                total: Object.keys(logSourceRegistry).length,
              };
              break;
            }
            case 'query_logs': {
              const { source_id, query='*', from='-1h', to='now', limit=50 } = args;
              if (!source_id) { json(400, { ok:false, error:'source_id 必填' }); return; }
              const cfg = logSourceRegistry[source_id];
              if (!cfg)  { json(404, { ok:false, error:`日志源 "${source_id}" 未注册` }); return; }
              result = await queryLogSource(cfg, { query, from, to, limit });
              result.source = { id:cfg.id, name:cfg.name, platform:cfg.platform };
              result.query_params = { query, from, to, limit };
              break;
            }
            case 'query_all_sources': {
              const { query='*', from='-1h', to='now', limit=20 } = args;
              const srcs = Object.values(logSourceRegistry);
              if (!srcs.length) { result = { ok:true, total:0, logs:[], summary:[] }; break; }
              const settled = await Promise.allSettled(srcs.map(c => queryLogSource(c, { query, from, to, limit })));
              let allLogs = [];
              const summary = settled.map((r, i) => {
                const c = srcs[i];
                if (r.status==='fulfilled'&&r.value.ok) {
                  allLogs = allLogs.concat((r.value.logs||[]).map(l => ({ ...l, __source_id:c.id, __source_name:c.name })));
                  return { source:c.name, platform:c.platform, count:r.value.logs?.length||0, ok:true };
                }
                return { source:c.name, platform:c.platform, count:0, ok:false, msg:r.value?.msg||r.reason?.message };
              });
              result = { ok:true, total:allLogs.length, logs:allLogs.slice(0,500), summary };
              break;
            }
            default: { json(400, { ok:false, error:`未知工具: ${tool}` }); return; }
          }
          console.log(`\x1b[36m[logsrc-mcp]\x1b[0m ${tool} → ${result.total??result.logs?.length??'ok'}`);
          json(200, { ok:true, tool, result });
        } catch(e) {
          console.error(`\x1b[31m[logsrc-mcp]\x1b[0m ${e.message}`);
          json(500, { ok:false, error:e.message });
        }
      })();
    });
    return;
  }

  /* ── POST /mcp/aliyun-mail/call — execute Aliyun mail tool ──────────────── */
  if (req.method === 'POST' && pathname === '/mcp/aliyun-mail/call') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      (async () => {
        try {
          const { tool, args = {}, accessKeyId, accessKeySecret, mode = 'directmail' } = raw ? JSON.parse(raw) : {};
          if (!accessKeyId || !accessKeySecret) {
            json(400, { ok:false, error:'accessKeyId 和 accessKeySecret 必填' }); return;
          }
          if (!tool) { json(400, { ok:false, error:'tool 必填' }); return; }
          const result = await callAliyunTool(tool, args, accessKeyId, accessKeySecret, mode);
          console.log(`\x1b[36m[aliyun]\x1b[0m ${tool} → ok`);
          json(200, { ok:true, tool, result });
        } catch(e) {
          console.error(`\x1b[31m[aliyun]\x1b[0m ${e.message}`);
          json(500, { ok:false, error: e.message });
        }
      })();
    });
    return;
  }

  /* ── /api/db/* — MySQL CRUD ─────────────────────────────────────────────── */
  if (pathname.startsWith('/api/db/')) {
    const db = await getPool();
    if (!db) { json(503, { error: 'DB 未连接，请先启动 MariaDB（mysqld）' }); return; }

    // GET /api/db/ping
    if (req.method === 'GET' && pathname === '/api/db/ping') {
      try {
        // db already resolved above
        const [rows] = await db.execute('SELECT 1 AS ok, VERSION() AS version');
        json(200, { ok: true, version: rows[0].version });
      } catch(e) { json(500, { ok: false, error: e.message }); }
      return;
    }

    // GET /api/db/events?limit=50&scene=phishing&severity=high
    if (req.method === 'GET' && pathname === '/api/db/events') {
      try {
        // db already resolved above
        const qs = new URL('http://x' + req.url).searchParams;
        const limit    = Math.min(parseInt(qs.get('limit') || '50', 10), 500);
        const scene    = qs.get('scene');
        const severity = qs.get('severity');
        let q = 'SELECT id,source,scene,severity,title,created_at FROM events';
        const params = [];
        const where = [];
        if (scene)    { where.push('scene=?');    params.push(scene); }
        if (severity) { where.push('severity=?'); params.push(severity); }
        if (where.length) q += ' WHERE ' + where.join(' AND ');
        q += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        const [rows] = await db.execute(q, params);
        json(200, { total: rows.length, events: rows });
      } catch(e) { json(500, { error: e.message }); }
      return;
    }

    // POST /api/db/events — insert event
    if (req.method === 'POST' && pathname === '/api/db/events') {
      let raw = '';
      req.on('data', c => raw += c);
      req.on('end', async () => {
        try {
          // db already resolved above
          const b = JSON.parse(raw);
          const [r] = await db.execute(
            'INSERT INTO events (source, scene, severity, title, body) VALUES (?,?,?,?,?)',
            [b.source||'manual', b.scene||'unknown', b.severity||'medium', b.title||'', JSON.stringify(b.body||{})]
          );
          json(201, { ok: true, id: r.insertId });
        } catch(e) { json(500, { error: e.message }); }
      });
      return;
    }

    // GET /api/db/stats — aggregate counts
    if (req.method === 'GET' && pathname === '/api/db/stats') {
      try {
        // db already resolved above
        const [[totRow]]  = await db.execute('SELECT COUNT(*) AS total FROM events');
        const [sevRows]   = await db.execute('SELECT severity, COUNT(*) AS cnt FROM events GROUP BY severity');
        const [sceneRows] = await db.execute('SELECT scene, COUNT(*) AS cnt FROM events GROUP BY scene');
        const [invRow]    = await db.execute('SELECT COUNT(*) AS total FROM investigations');
        json(200, {
          events_total:   totRow.total,
          investigations: invRow[0].total,
          by_severity:    Object.fromEntries(sevRows.map(r => [r.severity, r.cnt])),
          by_scene:       Object.fromEntries(sceneRows.map(r => [r.scene, r.cnt])),
        });
      } catch(e) { json(500, { error: e.message }); }
      return;
    }

    json(404, { error: 'unknown db endpoint' });
    return;
  }

  /* ── POST /api/investigate/stream — ReAct 调查流水线（SSE）──────────────── */
  if (req.method === 'POST' && pathname === '/api/investigate/stream') {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      (async () => {
        try {
          const body = raw ? JSON.parse(raw) : {};
          const alertText = body.alertText || '';
          if (!alertText.trim()) { json(400, { ok:false, error:'alertText 必填' }); return; }
          if (!llmCfg?.apiKey)   { json(400, { ok:false, error:'LLM未配置，请先在设置中配置API Key' }); return; }

          // Set up SSE response
          res.writeHead(200, {
            ...CORS,
            'Content-Type':  'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection':    'keep-alive',
            'X-Accel-Buffering': 'no',
          });

          // Keep-alive ping every 15s
          const pingTimer = setInterval(() => {
            try { res.write(': ping\n\n'); } catch { clearInterval(pingTimer); }
          }, 15000);

          req.on('close', () => clearInterval(pingTimer));

          await investigateEventStream(res, alertText);
          clearInterval(pingTimer);
          res.end();
        } catch(e) {
          console.error('\x1b[31m[inv]\x1b[0m', e.message);
          try {
            res.write('data: ' + JSON.stringify({ type:'error', message: e.message }) + '\n\n');
            res.end();
          } catch {}
        }
      })();
    });
    return;
  }

  /* ── GET fallback → serve index.html for SPA page routes (no file extension) ── */
  if (req.method === 'GET') {
    const lastSegment = pathname.split('/').pop() || '';
    const hasExtension = lastSegment.includes('.');
    if (!hasExtension) {
      try {
        const html = fs.readFileSync(HTML_FILE, 'utf8');
        res.writeHead(200, { ...CORS, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (e) {
        res.writeHead(500, CORS);
        res.end('Cannot read index.html: ' + e.message);
      }
      return;
    }
  }

  json(404, { error: 'not found', path: pathname });
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✗  端口 ${PORT} 已被占用，请先关闭其他服务（如 npm run dev）后重试\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║           SecMind  本地 Webhook 服务器               ║
  ╚══════════════════════════════════════════════════════╝

  前端界面       http://localhost:${PORT}/
  Webhook 接收   POST  http://localhost:${PORT}/webhook/receive
  前端轮询       GET   http://localhost:${PORT}/webhook/events
  健康检查       GET   http://localhost:${PORT}/webhook/status

  ─────────────────────────────────────────────────────
  配置你的安全工具，将 Webhook 指向：
  POST http://localhost:${PORT}/webhook/receive
  Content-Type: application/json
  ─────────────────────────────────────────────────────

  等待告警推入...（Ctrl+C 退出）
`);
});
