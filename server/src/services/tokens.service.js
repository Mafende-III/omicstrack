import { randomBytes, createHash } from 'node:crypto';
import db from '../config/db.js';

const SETUP_TOKEN_TTL_HOURS = 24;

/**
 * Generate a cryptographically random URL-safe token (base64url, 32 bytes → 43 chars).
 * Returns the plaintext to embed in the email link.
 */
export function generateToken() {
  return randomBytes(32).toString('base64url');
}

/**
 * SHA-256 hex hash. Used to look up tokens in DB without ever storing the plaintext.
 */
export function hashToken(plaintext) {
  return createHash('sha256').update(plaintext).digest('hex');
}

/**
 * Create a setup token for a user. Stores only the hash; returns the plaintext.
 *
 * @param {string} userId
 * @param {string} purpose - 'initial_setup' or 'password_reset'
 * @param {number} ttlHours - default 24
 * @returns {Promise<{ plaintext: string, expiresAt: Date }>}
 */
export async function createSetupToken(userId, purpose = 'initial_setup', ttlHours = SETUP_TOKEN_TTL_HOURS) {
  const plaintext = generateToken();
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await db('user_setup_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    purpose,
    expires_at: expiresAt,
  });

  return { plaintext, expiresAt };
}

/**
 * Look up a token by its plaintext value. Returns the row joined with the user,
 * or null if not found, expired, or already consumed.
 *
 * @param {string} plaintext
 * @returns {Promise<Object|null>}
 */
export async function findValidToken(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return null;
  const tokenHash = hashToken(plaintext);

  const row = await db('user_setup_tokens')
    .join('users', 'users.id', 'user_setup_tokens.user_id')
    .where('user_setup_tokens.token_hash', tokenHash)
    .select(
      'user_setup_tokens.id as token_id',
      'user_setup_tokens.user_id',
      'user_setup_tokens.purpose',
      'user_setup_tokens.expires_at',
      'user_setup_tokens.consumed_at',
      'users.name as user_name',
      'users.username',
      'users.email',
      'users.role',
    )
    .first();

  if (!row) return null;
  if (row.consumed_at) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  return row;
}

/**
 * Mark a token as consumed. Idempotent — subsequent calls do nothing.
 */
export async function consumeToken(tokenId) {
  await db('user_setup_tokens')
    .where('id', tokenId)
    .whereNull('consumed_at')
    .update({ consumed_at: new Date() });
}

export const TOKEN_TTL_HOURS = SETUP_TOKEN_TTL_HOURS;
