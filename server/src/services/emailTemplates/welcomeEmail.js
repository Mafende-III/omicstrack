// OmicsTrack-themed welcome email with magic link.
// Inline styles only — most mail clients strip <style> blocks.

const TEAL = '#008573';
const TEAL_DARK = '#006659';
const TEAL_BG = '#e8f5f2';
const TX = '#1a202c';
const TX2 = '#4a5568';
const TX3 = '#9aa3b3';
const BD = '#e2e8f0';

function envelope(body) {
  return `<!doctype html>
<html>
<body style="margin:0;background:#f7fafc;font-family:Georgia,'Times New Roman',Times,serif;color:${TX};">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:14px;padding:32px 28px;box-shadow:0 6px 16px rgba(0,0,0,0.05);">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:${TEAL_BG};color:${TEAL_DARK};font-weight:700;font-size:12px;letter-spacing:0.1em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">OMICSTRACK</div>
    </div>
    ${body}
    <div style="border-top:1px solid ${BD};margin-top:32px;padding-top:18px;text-align:center;font-size:11px;color:${TX3};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.6;">
      OmicsTrack &middot; Leukemia Omics Research<br/>
      National Reference Laboratory, Kigali &middot; Universit&eacute; de Li&egrave;ge, Belgium
    </div>
    <div style="margin-top:10px;text-align:center;font-size:10px;color:${TX3};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.02em;">
      Built by
      <a href="https://www.streamlinexperts.rw" style="color:${TEAL_DARK};text-decoration:none;font-weight:600;">StreamlineXperts</a>
      &middot; &copy; 2026
    </div>
  </div>
</body>
</html>`;
}

function signatureBlock() {
  return `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid ${BD};font-size:13px;color:${TX2};line-height:1.6;">
      <div style="font-weight:600;color:${TX};">Esperance Umumararungu</div>
      <div style="font-size:12px;color:${TX3};">Director, Molecular &amp; Genomics Unit</div>
      <div style="font-size:12px;color:${TX3};">National Reference Laboratory &middot; Rwanda Biomedical Center</div>
      <div style="font-size:12px;color:${TX3};margin-top:4px;">+250 788 287 222</div>
    </div>`;
}

/**
 * Welcome email with magic-link button.
 *
 * @param {Object} opts
 * @param {string} opts.recipientEmail
 * @param {string} opts.recipientName
 * @param {string} opts.role - 'admin' | 'entry' | 'viewer' | 'liege'
 * @param {string} opts.setupUrl - Full URL with ?token=...
 * @param {number} opts.expiryHours - Token TTL in hours
 * @returns {{ to, subject, text, html }}
 */
export function buildWelcomeEmail({ recipientEmail, recipientName, role, setupUrl, expiryHours = 24 }) {
  const roleLabel = roleDisplayName(role);

  const body = `
    <h1 style="font-size:22px;margin:0 0 8px;font-weight:700;color:${TX};">Welcome to OmicsTrack</h1>
    <p style="margin:0 0 20px;font-size:14px;color:${TX2};line-height:1.6;">
      Hello ${escape(recipientName)},
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:${TX2};line-height:1.6;">
      An OmicsTrack account has been created for you as a <strong>${escape(roleLabel)}</strong>.
      OmicsTrack is the data tracking system for our research study on the
      characterization of omics perturbations driving leukemia in the Rwandan population.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:${TX2};line-height:1.6;">
      Click the button below to set your password and sign in. The link is valid for ${expiryHours} hours.
    </p>
    <div style="margin:28px 0;text-align:center;">
      <a href="${setupUrl}" style="display:inline-block;background:${TEAL};color:#ffffff;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Set your password</a>
    </div>
    <p style="margin:0 0 12px;font-size:12px;color:${TX3};line-height:1.5;">
      If the button doesn't work, paste this link into your browser:
    </p>
    <p style="margin:0 0 8px;font-size:11px;color:${TX3};line-height:1.4;word-break:break-all;font-family:'SF Mono',Menlo,Consolas,monospace;">
      ${setupUrl}
    </p>
    <p style="margin:24px 0 0;font-size:12px;color:${TX3};line-height:1.5;">
      If you weren't expecting this email, you can safely ignore it.
    </p>
    ${signatureBlock()}`;

  const text = [
    `Welcome to OmicsTrack`,
    ``,
    `Hello ${recipientName},`,
    ``,
    `An OmicsTrack account has been created for you as a ${roleLabel}.`,
    `OmicsTrack is the data tracking system for our research study on the`,
    `characterization of omics perturbations driving leukemia in the Rwandan population.`,
    ``,
    `Click the link below to set your password and sign in.`,
    `The link is valid for ${expiryHours} hours.`,
    ``,
    setupUrl,
    ``,
    `If you weren't expecting this email, you can safely ignore it.`,
    ``,
    `—`,
    `Esperance Umumararungu`,
    `Director, Molecular & Genomics Unit`,
    `National Reference Laboratory · Rwanda Biomedical Center`,
    ``,
    `Built by StreamlineXperts · https://www.streamlinexperts.rw · © 2026`,
  ].join('\n');

  return {
    to: recipientEmail,
    subject: 'Welcome to OmicsTrack — set your password',
    text,
    html: envelope(body),
  };
}

function roleDisplayName(role) {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'entry': return 'Data Entry user';
    case 'viewer': return 'Supervisor (read-only)';
    case 'liege': return 'Liège team member';
    default: return 'team member';
  }
}

function escape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
