import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import { env } from '../config/env.js';
import { logAudit } from '../services/audit.service.js';

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, sites: user.sites, canSeePii: user.can_see_pii !== false },
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
  });
}
