import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';

export async function getUsers(req, res) {
  const users = await db('users')
    .select('id', 'name', 'username', 'role', 'sites', 'can_see_pii', 'is_default', 'created_at', 'created_by')
    .orderBy('created_at', 'asc');

  res.json(users.map(formatUser));
}

export async function createUser(req, res) {
  const { name, username, password, role, sites, canSeePii } = req.validated;

  const existing = await db('users').where('username', username).first();
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db('users')
    .insert({
      name,
      username,
      password_hash: passwordHash,
      role,
      sites: sites || [],
      can_see_pii: canSeePii !== false,
      is_default: false,
      created_by: req.user.id,
    })
    .returning('*');

  await logAudit({
    userId: req.user.id,
    userName: (await db('users').where('id', req.user.id).first())?.name,
    action: 'user.create',
    entityType: 'user',
    entityId: user.id,
    details: `User ${name} created with role ${role}`,
    ipAddress: req.ip,
  });

  res.status(201).json(formatUser(user));
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
    role: u.role,
    sites: u.sites,
    canSeePii: u.can_see_pii !== false,
    isDefault: u.is_default,
    createdAt: u.created_at,
    createdBy: u.created_by,
  };
}
