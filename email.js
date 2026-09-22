/**
 * Email sending for verification — branded Helion template.
 * Env:
 *   RESEND_API_KEY
 *   EMAIL_FROM          e.g. Helion <onboarding@resend.dev>
 *   FRONTEND_URL        e.g. http://127.0.0.1:8080 or https://user.github.io/repo
 *   EMAIL_MODE=log      log only, no send
 *   LOGO_URL            absolute HTTPS URL to logo (optional)
 *   TELEGRAM_URL        e.g. https://t.me/helionnetwork
 *   X_URL               e.g. https://x.com/helionnetwork
 *   WEBSITE_URL         optional public site
 */
const FROM = (process.env.EMAIL_FROM || 'Helion <onboarding@resend.dev>').trim();
const FRONTEND = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
const RESEND_KEY = (process.env.RESEND_API_KEY || '').trim();
const MODE = (process.env.EMAIL_MODE || '').trim().toLowerCase();
const LOGO_URL = (process.env.LOGO_URL || '').trim();
const TELEGRAM_URL = (process.env.TELEGRAM_URL || 'https://t.me/helionnetwork').trim();
const X_URL = (process.env.X_URL || 'https://x.com/helionnetwork').trim();
const WEBSITE_URL = (process.env.WEBSITE_URL || FRONTEND || '').trim();

function verifyLink(token) {
  if (FRONTEND) return FRONTEND + '/verify.html?verify=' + encodeURIComponent(token);
  return null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBrandedHtml({ username, token, link, hoursLeft }) {
  const name = escapeHtml(username);
  const code = escapeHtml(token);
  const logoBlock = LOGO_URL
    ? `<img src="${escapeHtml(LOGO_URL)}" alt="Helion" width="72" height="72" style="display:block;margin:0 auto 20px;border-radius:50%;" />`
    : `<div style="width:72px;height:72px;margin:0 auto 20px;border-radius:50%;background:#0A0C10;border:2px solid #F26A1B;line-height:72px;text-align:center;font-size:28px;font-weight:700;color:#F26A1B;font-family:Arial,sans-serif;">H</div>`;

  const btn = link
    ? `<a href="${escapeHtml(link)}" style="display:inline-block;background:#F26A1B;color:#0A0C10;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;letter-spacing:0.3px;">Verify email</a>`
    : '';

  const socials = [];
  if (TELEGRAM_URL) {
    socials.push(`<a href="${escapeHtml(TELEGRAM_URL)}" style="color:#F26A1B;text-decoration:none;margin:0 10px;font-size:13px;">Telegram</a>`);
  }
  if (X_URL) {
    socials.push(`<a href="${escapeHtml(X_URL)}" style="color:#F26A1B;text-decoration:none;margin:0 10px;font-size:13px;">X</a>`);
  }
  if (WEBSITE_URL) {
    socials.push(`<a href="${escapeHtml(WEBSITE_URL)}" style="color:#F26A1B;text-decoration:none;margin:0 10px;font-size:13px;">App</a>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Verify your Helion account</title></head>
<body style="margin:0;padding:0;background:#0A0C10;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0A0C10;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#12151c;border-radius:16px;border:1px solid #2a2f3a;overflow:hidden;">
        <tr><td style="padding:28px 28px 8px;text-align:center;">
          ${logoBlock}
          <div style="font-size:22px;font-weight:700;color:#F5F3EE;letter-spacing:0.5px;">Helion Network</div>
          <div style="font-size:12px;color:#8a8f9a;margin-top:4px;">Exchange &amp; DeFi Hub · BNB Chain</div>
        </td></tr>
        <tr><td style="padding:8px 28px 24px;color:#F5F3EE;">
          <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Hello <strong style="color:#F26A1B;">${name}</strong>,</p>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#c8c6c0;">
            Thank you for registering with Helion. You are one step away from the testnet wallet — mining, staking, swap and spot in one place.
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#c8c6c0;">
            Please confirm your email within <strong style="color:#F5F3EE;">${hoursLeft} hours</strong>. After that the account is removed automatically.
          </p>
          <div style="text-align:center;margin:24px 0;">
            ${btn}
          </div>
          <p style="margin:16px 0 6px;font-size:12px;color:#8a8f9a;text-align:center;">Or enter this code in the app:</p>
          <div style="text-align:center;margin:0 0 20px;">
            <span style="display:inline-block;font-family:Consolas,Monaco,monospace;font-size:22px;letter-spacing:4px;font-weight:700;color:#F26A1B;background:#0A0C10;border:1px solid #2a2f3a;border-radius:8px;padding:12px 20px;">${code}</span>
          </div>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#6a6f7a;">
            If you did not create a Helion account, you can ignore this message.
          </p>
        </td></tr>
        <tr><td style="padding:18px 28px 24px;border-top:1px solid #2a2f3a;text-align:center;">
          <div style="margin-bottom:10px;">${socials.join('<span style="color:#2a2f3a;">·</span>')}</div>
          <div style="font-size:11px;color:#5a5f6a;line-height:1.5;">
            Helion Network · Testnet<br/>
            Build · Mine · Stake · Trade
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPlainText({ username, token, link, hoursLeft }) {
  return (
    `Hello ${username},\n\n` +
    `Thank you for registering with Helion Network.\n` +
    `Confirm your account within ${hoursLeft} hours.\n\n` +
    (link ? `Verify email:\n${link}\n\n` : '') +
    `Or enter this code in the app:\n${token}\n\n` +
    (TELEGRAM_URL ? `Telegram: ${TELEGRAM_URL}\n` : '') +
    (X_URL ? `X: ${X_URL}\n` : '') +
    `\nIf you did not register, ignore this email.\n` +
    `Unverified accounts are deleted after 24 hours.\n\n` +
    `— Helion Network`
  );
}

async function sendVerificationEmail({ to, username, token, expiresAt }) {
  const link = verifyLink(token);
  const hoursLeft = Math.max(1, Math.round((expiresAt - Date.now()) / 3600000));
  const subject = 'Welcome to Helion — verify your email';
  const text = buildPlainText({ username, token, link, hoursLeft });
  const html = buildBrandedHtml({ username, token, link, hoursLeft });

  if (MODE === 'log' || !RESEND_KEY) {
    console.log('[email] verification →', to, 'token=', token, 'link=', link || '(set FRONTEND_URL)');
    return { ok: true, mode: RESEND_KEY ? 'log' : 'log-no-key', link, token };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + RESEND_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      text,
      html
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn('[email] resend failed', res.status, data);
    return { ok: false, error: data.message || 'email send failed', link, token };
  }
  return { ok: true, mode: 'resend', id: data.id, link };
}

module.exports = { sendVerificationEmail, verifyLink };
