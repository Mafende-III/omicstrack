import sgMail from '@sendgrid/mail';
import { env } from '../config/env.js';

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

/**
 * Send an email via SendGrid. When SENDGRID_API_KEY is unset (typical for local dev),
 * the message is logged to the server console instead of actually sending — so the
 * onboarding flow can be exercised end-to-end without consuming quota or needing a
 * verified sender.
 *
 * @param {Object} msg
 * @param {string} msg.to
 * @param {string} msg.subject
 * @param {string} msg.text - Plain text fallback (mandatory)
 * @param {string} msg.html - HTML body (mandatory)
 * @returns {Promise<{ sent: boolean, dev: boolean }>}
 */
export async function sendMail(msg) {
  if (!env.SENDGRID_API_KEY) {
    console.warn(
      `[email] SENDGRID_API_KEY not set — skipping real send.\n` +
      `  to:      ${msg.to}\n` +
      `  from:    ${env.EMAIL_SENDER} (${env.EMAIL_SENDER_NAME})\n` +
      `  subject: ${msg.subject}\n` +
      `  body:    ${msg.text}`,
    );
    return { sent: false, dev: true };
  }

  await sgMail.send({
    to: msg.to,
    from: { email: env.EMAIL_SENDER, name: env.EMAIL_SENDER_NAME },
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
  return { sent: true, dev: false };
}
