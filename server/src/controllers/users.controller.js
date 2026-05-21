import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../config/db.js';
import { env } from '../config/env.js';
import { logAudit } from '../services/audit.service.js';
import { createSetupToken, TOKEN_TTL_HOURS } from '../services/tokens.service.js';
import { sendMail } from '../services/email.service.js';
import { buildWelcomeEmail } from '../services/emailTemplates/welcomeEmail.js';

export async function getUsers(req, res) {
  const users = await db('users')
    .select('id', 'name', 'username', 'email', 'role', 'sites', 'can_see_pii', 'is_default', 'created_at', 'created_by', 'welcome_email_sent_at')
    .orderBy('created_at', 'asc');

  res.json(users.map(formatUser));
}

export async function createUser(req, res) {
  const { name, username, email, role, sites, canSeePii } = req.validated;

  const existing = await db('users').where('username', username).first();
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  if (email) {
    const emailTaken = await db('users')
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .first();
    if (emailTaken) {
      return res.status(409).json({ error: 'Email already in use' });
    }
  }

  // Initial password is a random placeholder — the user sets their own via the magic link.
  const placeholderPassword = crypto.randomBytes(32).toString('base64url');
  const passwordHash = await bcrypt.hash(placeholderPassword, 12);

  const [user] = await db('users')
    .insert({
      name,
      username,
      email: email ? email.trim() : null,
      password_hash: passwordHash,
      role,
      sites: sites || [],
      can_see_pii: canSeePii !== false,
      is_default: false,
      created_by: req.user.id,
    })
    .returning('*');

  const actor = await db('users').where('id', req.user.id).first();
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'user.create',
    entityType: 'user',
    entityId: user.id,
    details: `User ${name} created with role ${role}`,
    ipAddress: req.ip,
  });

  // Send welcome magic link — non-blocking on failure
  let welcomeEmailStatus = 'skipped_no_email';
  if (email) {
    try {
      const { plaintext } = await createSetupToken(user.id, 'initial_setup');
      const setupUrl = `${env.APP_URL.replace(/\/$/, '')}/set-password?token=${plaintext}`;
      const msg = buildWelcomeEmail({
        recipientEmail: email,
        recipientName: name,
        role,
        setupUrl,
        expiryHours: TOKEN_TTL_HOURS,
      });
      const result = await sendMail(msg);
      welcomeEmailStatus = result.sent ? 'sent' : 'dev_logged';
      if (result.sent) {
        await db('users').where('id', user.id).update({ welcome_email_sent_at: new Date() });
      }
    } catch (err) {
      console.error('[user.create] welcome email failed:', err.message);
      welcomeEmailStatus = 'failed';
      await logAudit({
        userId: req.user.id,
        userName: actor?.name,
        action: 'user.email.failed',
        entityType: 'user',
        entityId: user.id,
        details: `Welcome email failed for ${email}: ${err.message}`,
        ipAddress: req.ip,
      });
    }
  }

  res.status(201).json({
    ...formatUser(user),
    welcomeEmailStatus,
  });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, role, sites, canSeePii } = req.validated;

  const user = await db('users').where('id', id).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Username is immutable (logins depend on it). Role of default users is
  // changeable, but they cannot be deleted.

  if (email && email !== user.email) {
    const emailTaken = await db('users')
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .whereNot('id', id)
      .first();
    if (emailTaken) {
      return res.status(409).json({ error: 'Email already in use' });
    }
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email ? email.trim() : null;
  if (role !== undefined) updates.role = role;
  if (sites !== undefined) updates.sites = sites;
  if (canSeePii !== undefined) updates.can_see_pii = canSeePii;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  await db('users').where('id', id).update(updates);
  const updated = await db('users').where('id', id).first();

  const actor = await db('users').where('id', req.user.id).first();
  const changed = Object.keys(updates).join(', ');
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'user.update',
    entityType: 'user',
    entityId: id,
    details: `User ${updated.name} updated (${changed})`,
    ipAddress: req.ip,
  });

  res.json(formatUser(updated));
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  const user = await db('users').where('id', id).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.is_default) {
    return res.status(403).json({ error: 'Cannot delete default users' });
  }

  await db('sessions').where('user_id', id).del();
  await db('users').where('id', id).del();

  const actor = await db('users').where('id', req.user.id).first();
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'user.remove',
    entityType: 'user',
    entityId: id,
    details: `User ${user.name} removed`,
    ipAddress: req.ip,
  });

  res.json({ ok: true });
}

function formatUser(u) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email || null,
    role: u.role,
    sites: u.sites,
    canSeePii: u.can_see_pii !== false,
    isDefault: u.is_default,
    createdAt: u.created_at,
    createdBy: u.created_by,
    welcomeEmailSentAt: u.welcome_email_sent_at || null,
  };
}
