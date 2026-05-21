// One-off: send a real test welcome email to confirm the OmicsTrack template
// renders correctly in a real mail client. Not part of the production server.
// Run from server/: SENDGRID_API_KEY=... node scripts/send-test-email.js

import sgMail from '@sendgrid/mail';
import { buildWelcomeEmail } from '../src/services/emailTemplates/welcomeEmail.js';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('SENDGRID_API_KEY not set');
  process.exit(1);
}
sgMail.setApiKey(apiKey);

const setupUrl = 'https://omicstrack.com/set-password?token=demo-token-for-preview-only';
const msg = buildWelcomeEmail({
  recipientEmail: 'kk426st@gmail.com',
  recipientName: 'Mafende',
  role: 'admin',
  setupUrl,
  expiryHours: 24,
});

try {
  await sgMail.send({
    to: msg.to,
    from: { email: 'contact@streamlinexperts.rw', name: 'Esperance Umumararungu' },
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
  console.log('✓ Sent to', msg.to);
  console.log('  Subject:', msg.subject);
} catch (err) {
  console.error('✗ Send failed:', err.message);
  if (err.response?.body) console.error('  details:', JSON.stringify(err.response.body, null, 2));
  process.exit(1);
}
