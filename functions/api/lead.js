/**
 * Cloudflare Pages Function — POST /api/lead
 * Receives website form submissions and posts them into a Lark group
 * via a custom-bot incoming webhook (with optional signature verification).
 *
 * Required env var:  LARK_WEBHOOK_URL   (custom bot webhook, e.g. https://open.larksuite.com/open-apis/bot/v2/hook/XXXX)
 * Optional env vars:  LARK_WEBHOOK_SECRET (if the bot has "Signature verification" enabled)
 *                     LEAD_TO_EMAIL       (shown in the card; default welcome@vietnamcoco.vn)
 */

export async function onRequestPost({ request, env }) {
  try {
    const ct = request.headers.get('content-type') || '';
    let data = {};
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => { data[k] = typeof v === 'string' ? v : ''; });
    }

    // Spam honeypot — bots fill hidden fields; real users don't.
    if (data._hp_website) return json({ ok: true });

    const email = String(data.email || '').trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'invalid_email' }, 400);
    }

    const webhook = env.LARK_WEBHOOK_URL;
    if (!webhook) return json({ ok: false, error: 'not_configured' }, 500);

    const to = env.LEAD_TO_EMAIL || 'welcome@vietnamcoco.vn';
    const formType = String(data._form || 'contact');
    const F = (k) => {
      const v = data[k];
      return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
    };

    const titleMap = {
      contact: 'Liên hệ / Contact',
      desiccated: 'Yêu cầu Desiccated (spec / sample)',
      newsletter: 'Đăng ký Insights',
    };
    const title = '🥥 ' + (titleMap[formType] || 'Lead') + ' — vietnamcoco.vn';

    let lines;
    if (formType === 'newsletter') {
      lines = ['**Email:** ' + F('email')];
    } else if (formType === 'desiccated') {
      lines = [
        '**Loại yêu cầu:** ' + F('reqtype'),
        '**Tên:** ' + F('name'),
        '**Email:** ' + F('email'),
        '**Công ty:** ' + F('company'),
        '**Nội dung:** ' + F('message'),
      ];
    } else {
      lines = [
        '**Tên:** ' + F('name'),
        '**Email:** ' + F('email'),
        '**Công ty:** ' + F('company'),
        '**Thị trường:** ' + F('market'),
        '**Dòng sản phẩm:** ' + F('line'),
        '**Nội dung:** ' + F('message'),
      ];
    }
    lines.push('**Nhận tại:** ' + to);

    const card = {
      msg_type: 'interactive',
      card: {
        config: { wide_screen_mode: true },
        header: { template: 'green', title: { tag: 'plain_text', content: title } },
        elements: [
          { tag: 'div', text: { tag: 'lark_md', content: lines.join('\n') } },
          { tag: 'note', elements: [{ tag: 'plain_text', content: new Date().toISOString() }] },
        ],
      },
    };

    const body = await sign(card, env.LARK_WEBHOOK_SECRET);
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = await r.json().catch(() => ({}));
    if (out && (out.code === 0 || out.StatusCode === 0 || out.success === true)) {
      return json({ ok: true });
    }
    return json({ ok: false, error: 'lark_error', detail: out }, 502);
  } catch (e) {
    return json({ ok: false, error: 'server_error' }, 500);
  }
}

// Reject other methods cleanly.
export const onRequest = async (ctx) => {
  if (ctx.request.method === 'POST') return onRequestPost(ctx);
  return json({ ok: false, error: 'method_not_allowed' }, 405);
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Lark custom-bot signature: HMAC-SHA256(key = `${timestamp}\n${secret}`, data = "") -> base64
async function sign(payload, secret) {
  if (!secret) return payload;
  const ts = Math.floor(Date.now() / 1000).toString();
  const stringToSign = ts + '\n' + secret;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(stringToSign),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new Uint8Array(0));
  const sign = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return { timestamp: ts, sign, ...payload };
}
