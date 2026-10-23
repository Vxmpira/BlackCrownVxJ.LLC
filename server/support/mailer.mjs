// BlackCrown support mail relay
// Receives POST /api/support from support.html (proxied by Nginx),
// renders the branded template, and sends via AWS SES.
// Credentials come from the EC2 instance role, so no keys live on disk.

import { createServer } from 'node:http';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { notifyEmail, ackEmail, CATEGORIES } from './templates.mjs';

const PORT = Number(process.env.PORT || 8787);
const REGION = process.env.AWS_REGION || 'us-east-1';
const MAIL_FROM = process.env.MAIL_FROM || 'BlackCrown Support <support@blackcrownvxj.com>';
const MAIL_TO = process.env.MAIL_TO || 'BlackCrownVxJ.LLC@outlook.com';
// Visitor acknowledgment emails only deliver once SES has production access.
// Leave SEND_ACK=0 until then; failures are swallowed either way.
const SEND_ACK = process.env.SEND_ACK === '1';

const ses = new SESv2Client({ region: REGION });

// Basic per-IP rate limit: 5 submissions per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  return false;
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket.remoteAddress || '';
}

function validate(b) {
  const errors = [];
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim();
  const concern = String(b.concern || '').trim();
  const message = String(b.message || '').trim();
  if (name.length < 2 || name.length > 120) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.push('email');
  if (!Object.prototype.hasOwnProperty.call(CATEGORIES, concern)) errors.push('concern');
  if (message.length < 5 || message.length > 6000) errors.push('message');
  return { ok: errors.length === 0, errors, v: { name, email, concern, message } };
}

async function sendSes({ to, replyTo, subject, html, text }) {
  await ses.send(new SendEmailCommand({
    FromEmailAddress: MAIL_FROM,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' }
        }
      }
    }
  }));
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/support/health') {
    return json(res, 200, { ok: true });
  }
  if (req.method !== 'POST' || !req.url.startsWith('/api/support')) {
    return json(res, 404, { success: false, error: 'not_found' });
  }

  let raw = '';
  let overflow = false;
  req.on('data', chunk => {
    raw += chunk;
    if (raw.length > 32 * 1024) { overflow = true; req.destroy(); }
  });
  req.on('end', async () => {
    if (overflow) return;
    let body;
    try { body = JSON.parse(raw || '{}'); }
    catch { return json(res, 400, { success: false, error: 'bad_json' }); }

    // Honeypot: bots that tick the hidden checkbox get a quiet "success".
    if (body.botcheck) return json(res, 200, { success: true });

    const ip = clientIp(req);
    if (rateLimited(ip)) {
      return json(res, 429, { success: false, error: 'rate_limited' });
    }

    const { ok, errors, v } = validate(body);
    if (!ok) return json(res, 400, { success: false, error: 'invalid', fields: errors });

    try {
      const n = notifyEmail({ ...v, ip, when: new Date().toUTCString() });
      await sendSes({ to: MAIL_TO, replyTo: v.email, subject: n.subject, html: n.html, text: n.text });

      if (SEND_ACK) {
        const a = ackEmail(v);
        sendSes({ to: v.email, subject: a.subject, html: a.html, text: a.text })
          .catch(err => console.error('ack failed (ok in SES sandbox):', err.name || err.message));
      }

      console.log(new Date().toISOString(), 'sent', v.concern, 'from', v.email, ip);
      return json(res, 200, { success: true });
    } catch (err) {
      console.error(new Date().toISOString(), 'SES send failed:', err.name || '', err.message || err);
      return json(res, 502, { success: false, error: 'send_failed' });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('BlackCrown support relay on 127.0.0.1:' + PORT, 'region', REGION, 'to', MAIL_TO, 'ack', SEND_ACK ? 'on' : 'off');
});
