import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import { env } from '../config/env.js';
import { logAudit } from '../services/audit.service.js';
import { findValidToken, consumeToken } from '../services/tokens.service.js';

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sites: user.sites,
      // Back-compat: canSeePii is the "all three" combined view, kept for old
      // clients. New clients should use the per-field flags below.
      canSeePii: user.can_see_pii !== false,
      canSeeName: user.can_see_name !== false,
      canSeeAge: user.can_see_age !== false,
      canSeeFacility: user.can_see_facility !== false,
      capabilities: Array.isArray(user.capabilities) && user.capabilities.length > 0
        ? user.capabilities
        : undefined, // omit if empty so middleware's fallback to role preset kicks in
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
}

function parseExpiry(str) {
  const match = str.match(/^(\d+)([dhm])$/);
  if (!match) return 7 * 24 * 3600 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'd') return val * 24 * 3600 * 1000;
  if (unit === 'h') return val * 3600 * 1000;
  if (unit === 'm') return val * 60 * 1000;
  return val * 1000;
}

export async function login(req, res) {
  const { username, password } = req.validated;

  const user = await db('users').where('username', username).first();
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));

  await db('sessions').insert({
    user_id: user.id,
    refresh_token_hash: refreshHash,
    expires_at: expiresAt,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] || null,
  });

  // Clean up expired sessions for this user
  await db('sessions').where('user_id', user.id).where('expires_at', '<', new Date()).del();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: parseExpiry(env.JWT_REFRESH_EXPIRY),
    path: '/api/v1/auth',
  });

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: 'user.login',
    entityType: 'user',
    entityId: user.id,
    details: `${user.name} logged in`,
    ipAddress: req.ip,
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      sites: user.sites,
      isDefault: user.is_default,
      canSeePii: user.can_see_pii !== false,
      canSeeName: user.can_see_name !== false,
      canSeeAge: user.can_see_age !== false,
      canSeeFacility: user.can_see_facility !== false,
      capabilities: user.capabilities || [],
    },
  });
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const sessions = await db('sessions')
    .where('expires_at', '>', new Date())
    .select('*');

  let matchedSession = null;
  for (const session of sessions) {
    const valid = await bcrypt.compare(token, session.refresh_token_hash);
    if (valid) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await db('users').where('id', matchedSession.user_id).first();
  if (!user) {
    await db('sessions').where('id', matchedSession.id).del();
    return res.status(401).json({ error: 'User not found' });
  }

  const accessToken = generateAccessToken(user);

  res.json({ accessToken });
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) {
    const sessions = await db('sessions').where('user_id', req.user.id).select('*');
    for (const session of sessions) {
      const valid = await bcrypt.compare(token, session.refresh_token_hash);
      if (valid) {
        await db('sessions').where('id', session.id).del();
        break;
      }
    }
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.json({ ok: true });
}

/**
 * Unauthenticated endpoint: validate a setup token from the welcome email link.
 * Returns minimal user info if the token is valid, so the UI can show "Hi {name}, set your password".
 */
export async function getSetupToken(req, res) {
  const { token } = req.params;
  const row = await findValidToken(token);
  if (!row) {
    return res.status(410).json({ error: 'Link is invalid, expired, or already used' });
  }

  res.json({
    userName: row.user_name,
    username: row.username,
    role: row.role,
    purpose: row.purpose,
    expiresAt: row.expires_at,
  });
}

/**
 * Unauthenticated endpoint: consume a setup token and set the user's password.
 * Logs the user in automatically on success (same as the regular login flow).
 */
export async function setupPassword(req, res) {
  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const row = await findValidToken(token);
  if (!row) {
    return res.status(410).json({ error: 'Link is invalid, expired, or already used' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.transaction(async (trx) => {
    await trx('users').where('id', row.user_id).update({
      password_hash: passwordHash,
      email_verified: true,
    });
    await trx('user_setup_tokens')
      .where('id', row.token_id)
      .whereNull('consumed_at')
      .update({ consumed_at: new Date() });
  });

  // Fetch the now-updated user record for session creation
  const user = await db('users').where('id', row.user_id).first();

  // Issue session — mirrors the login flow
  const accessToken = generateAccessToken(user);
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));

  await db('sessions').insert({
    user_id: user.id,
    refresh_token_hash: refreshHash,
    expires_at: expiresAt,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] || null,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: parseExpiry(env.JWT_REFRESH_EXPIRY),
    path: '/api/v1/auth',
  });

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: 'user.password_set',
    entityType: 'user',
    entityId: user.id,
    details: `${user.name} completed initial password setup`,
    ipAddress: req.ip,
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      sites: user.sites,
      isDefault: user.is_default,
      canSeePii: user.can_see_pii !== false,
      canSeeName: user.can_see_name !== false,
      canSeeAge: user.can_see_age !== false,
      canSeeFacility: user.can_see_facility !== false,
      capabilities: user.capabilities || [],
    },
  });
}

export async function me(req, res) {
  const user = await db('users').where('id', req.user.id).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    sites: user.sites,
    isDefault: user.is_default,
    canSeePii: user.can_see_pii !== false,
      canSeeName: user.can_see_name !== false,
      canSeeAge: user.can_see_age !== false,
      canSeeFacility: user.can_see_facility !== false,
    capabilities: user.capabilities || [],
  });
}
