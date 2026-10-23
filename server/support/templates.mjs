// BlackCrown support email templates (v3)
// Table-based, inline-styled HTML so it renders in Outlook, Gmail and Apple Mail.
// Brand typography and the glowing crown are pre-rendered PNGs served from the
// site (assets/img/email-header.png, email-crown.png), because email clients
// refuse to load webfonts. CSS glow is layered on top and degrades to flat
// color in clients that strip text-shadow (classic Outlook).

const SITE = 'https://blackcrownvxj.com';
const ASSETS = (process.env.BC_ASSET_BASE || SITE) + '/assets/img';

export const CATEGORIES = {
  'General question':       { color: '#FF2D95', tag: 'GENERAL', headline: 'A question at the desk.',  triage: 'No lookup needed. Answer and close.' },
  'Account access':         { color: '#E8C77F', tag: 'ACCOUNT', headline: 'Operator locked out.',     triage: 'Verify this email against the account first. No resets on request alone.' },
  'Payment or billing':     { color: '#E8C77F', tag: 'BILLING', headline: 'Billing needs eyes.',      triage: 'Pull this email up in Stripe before anything else.' },
  'Bug or technical issue': { color: '#FF3B47', tag: 'BUG',     headline: 'Something broke.',         triage: 'Get product, steps, expected vs actual. Then hunt.' },
  'Feature request':        { color: '#5BE7A9', tag: 'FEATURE', headline: 'They want more.',          triage: 'Log it. Reply planned, considered, or out of scope.' },
  'Partnership or press':   { color: '#FF6FB6', tag: 'PARTNER', headline: 'Outside interest.',        triage: 'Vet them before numbers or roadmap leave the desk.' },
  'Other':                  { color: '#85838F', tag: 'OTHER',   headline: 'Unfiled signal.',          triage: 'Read it. Route it.' }
};

function cat(concern) {
  return CATEGORIES[concern] || CATEGORIES['Other'];
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const mono = "'Courier New',Courier,monospace";
const sans = "Arial,Helvetica,sans-serif";
const PINK = '#FF2D95';
const glowPink = 'text-shadow:0 0 6px rgba(255,45,149,.55),0 0 16px rgba(255,45,149,.3);';
const glowWhite = 'text-shadow:0 0 8px rgba(255,255,255,.3);';

function shell(inner, preheader) {
  return '<!DOCTYPE html>' +
'<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">' +
'<title>BlackCrown</title></head>' +
'<body style="margin:0;padding:0;background:#000000;" bgcolor="#000000">' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + escapeHtml(preheader) + '</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background:#000000;">' +
'<tr><td align="center" style="padding:26px 14px 34px 14px;">' +
'<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">' +
inner +
'</table></td></tr></table></body></html>';
}

// Pre-rendered brand banner: glowing crown + Space Grotesk wordmark.
function banner() {
  return '<tr><td style="padding:0 0 18px 0;">' +
'<a href="' + SITE + '" style="text-decoration:none;">' +
'<img src="' + ASSETS + '/email-header.png" width="600" alt="BlackCrown" ' +
'style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:14px;"></a>' +
'</td></tr>';
}

// Card with a hairline accent bar on top, echoing the site's line work.
function cardOpen(accent) {
  return '<tr><td style="padding:0;">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
'<tr><td height="2" bgcolor="' + (accent || PINK) + '" style="background:' + (accent || PINK) + ';border-radius:2px 2px 0 0;font-size:1px;line-height:2px;">&nbsp;</td></tr>' +
'<tr><td bgcolor="#0B0B10" style="background:#0B0B10;border:1px solid #27262E;border-top:none;border-radius:0 0 16px 16px;padding:28px 30px 26px 30px;">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
}

function cardClose() {
  return '</table></td></tr></table></td></tr>';
}

function eyebrow(t, color) {
  return '<span style="font-family:' + mono + ';font-size:10px;letter-spacing:3px;color:' + (color || PINK) + ';text-transform:uppercase;' + glowPink + '">' + t + '</span>';
}

function chip(t, color) {
  return '<span style="font-family:' + mono + ';font-size:10px;letter-spacing:2px;color:' + color + ';border:1px solid ' + color + ';border-radius:5px;padding:4px 10px;white-space:nowrap;text-transform:uppercase;">' + t + '</span>';
}

function label(t) {
  return '<span style="font-family:' + mono + ';font-size:10px;letter-spacing:2px;color:#85838F;text-transform:uppercase;">' + t + '</span>';
}

function footer() {
  return '<tr><td align="center" style="padding:22px 10px 0 10px;">' +
'<span style="font-family:' + mono + ';font-size:10px;letter-spacing:2px;color:#55535E;text-transform:uppercase;">' +
'BlackCrownVxJ LLC &nbsp;&middot;&nbsp; <a href="' + SITE + '" style="color:#85838F;text-decoration:none;">blackcrownvxj.com</a> &nbsp;&middot;&nbsp; <span style="color:' + PINK + ';">Built, not handed down.</span>' +
'</span></td></tr>';
}

// ---------------------------------------------------------------------------
// Internal notification: what lands in the BlackCrown inbox
// ---------------------------------------------------------------------------
export function notifyEmail(v) {
  const c = cat(v.concern);
  const when = v.when || new Date().toUTCString();
  const subject = '[' + c.tag + '] ' + v.name + ' / ' + v.concern;

  const row = (k, val) =>
    '<tr><td style="padding:9px 0;border-bottom:1px solid #1C1B22;" width="110">' + label(k) + '</td>' +
    '<td style="padding:9px 0;border-bottom:1px solid #1C1B22;font-family:' + sans + ';font-size:14px;color:#E8E8EF;">' + val + '</td></tr>';

  const html = shell(
    banner() +
    cardOpen(c.color) +
    '<tr><td style="padding-bottom:10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td align="left">' + eyebrow('Incoming transmission', c.color) + '</td>' +
      '<td align="right">' + chip('SIG // ' + c.tag, c.color) + '</td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="font-family:' + sans + ';font-size:27px;font-weight:bold;letter-spacing:-.5px;color:#FFFFFF;padding-bottom:16px;line-height:1.15;' + glowWhite + '">' +
      escapeHtml(c.headline) + '</td></tr>' +
    '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
      row('Operator', escapeHtml(v.name)) +
      row('Reply line', '<a href="mailto:' + escapeHtml(v.email) + '" style="color:' + c.color + ';text-decoration:none;">' + escapeHtml(v.email) + '</a>') +
      row('Channel', '<span style="color:' + c.color + ';">' + escapeHtml(v.concern) + '</span>') +
      row('Logged', escapeHtml(when) + (v.ip ? ' &nbsp;&middot;&nbsp; ' + escapeHtml(v.ip) : '')) +
    '</table></td></tr>' +
    '<tr><td style="padding-top:18px;">' + label('Transmission') + '</td></tr>' +
    '<tr><td style="padding-top:8px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td width="3" bgcolor="' + c.color + '" style="background:' + c.color + ';border-radius:3px;font-size:1px;line-height:1px;">&nbsp;</td>' +
      '<td bgcolor="#101017" style="background:#101017;border-radius:0 10px 10px 0;padding:16px 18px;font-family:' + sans + ';font-size:14px;line-height:1.7;color:#E8E8EF;white-space:pre-wrap;">' +
      escapeHtml(v.message) + '</td></tr></table></td></tr>' +
    '<tr><td style="padding-top:18px;">' +
      '<span style="font-family:' + mono + ';font-size:11px;letter-spacing:1px;color:#85838F;">NEXT MOVE &gt; ' + escapeHtml(c.triage) + '</span>' +
    '</td></tr>' +
    '<tr><td style="padding-top:22px;">' +
      '<a href="mailto:' + escapeHtml(v.email) + '?subject=' + encodeURIComponent('Re: ' + v.concern + ' | BlackCrown Support') + '" ' +
      'style="display:inline-block;background:' + c.color + ';color:#0A0008;font-family:' + mono + ';font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;">Reply to ' + escapeHtml(v.name.split(' ')[0]) + '</a>' +
    '</td></tr>' +
    cardClose() +
    footer(),
    c.tag + ' from ' + v.name + ': ' + v.message.slice(0, 80)
  );

  const text = 'INCOMING TRANSMISSION [' + c.tag + '] ' + c.headline + '\n\n' +
    'Operator: ' + v.name + '\nReply line: ' + v.email + '\nChannel: ' + v.concern + '\nLogged: ' + when + '\n\n' +
    'Transmission:\n' + v.message + '\n\nNext move > ' + c.triage + '\n';

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Visitor acknowledgment
// (Delivers once SES has production access; sandbox failures are swallowed.)
// ---------------------------------------------------------------------------
export function ackEmail(v) {
  const c = cat(v.concern);
  const first = v.name.split(' ')[0];
  const subject = 'Signal received | BlackCrown';

  const html = shell(
    banner() +
    cardOpen(PINK) +
    '<tr><td align="center" style="padding:4px 0 6px 0;">' +
      '<img src="' + ASSETS + '/email-crown.png" width="200" alt="" style="display:inline-block;width:200px;height:auto;border:0;">' +
    '</td></tr>' +
    '<tr><td align="center" style="font-family:' + sans + ';font-size:30px;font-weight:bold;letter-spacing:-.5px;color:#FFFFFF;padding-bottom:12px;' + glowWhite + '">Signal <span style="color:' + PINK + ';' + glowPink + '">received</span>.</td></tr>' +
    '<tr><td align="center" style="font-family:' + sans + ';font-size:14px;line-height:1.75;color:#A7A5B2;padding:0 30px 18px 30px;">' +
      'Your message hit the desk, ' + escapeHtml(first) + '. It goes to a real person, not a ticket queue, and the reply lands right here at this address.' +
    '</td></tr>' +
    '<tr><td align="center" style="padding-bottom:20px;">' + chip('FILED // ' + escapeHtml(c.tag), c.color) + '</td></tr>' +
    '<tr><td align="center" style="padding-bottom:6px;">' + label('Meanwhile') + '</td></tr>' +
    '<tr><td align="center" style="font-family:' + sans + ';font-size:13px;line-height:1.9;color:#A7A5B2;padding-bottom:4px;">' +
      '<a href="' + SITE + '" style="color:' + PINK + ';text-decoration:none;">blackcrownvxj.com</a>' +
      ' &nbsp;&middot;&nbsp; <a href="https://korvus.industries" style="color:' + PINK + ';text-decoration:none;">Korvus terminal</a>' +
      ' &nbsp;&middot;&nbsp; <a href="https://discord.gg/xmuSA5mMTN" style="color:' + PINK + ';text-decoration:none;">Eclipse-X on Discord</a>' +
    '</td></tr>' +
    cardClose() +
    footer(),
    'Your message hit the desk. A real person reads it and replies to this address.'
  );

  const text = 'Signal received.\n\nYour message hit the desk, ' + first + '. It goes to a real person, not a ticket queue, ' +
    'and the reply lands right here at this address.\n\nFiled under: ' + v.concern + '\n\nblackcrownvxj.com\n';

  return { subject, html, text };
}
