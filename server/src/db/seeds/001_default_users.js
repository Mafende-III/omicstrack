import bcrypt from 'bcrypt';

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const VIEWER_ID = '00000000-0000-0000-0000-000000000002';
const LIEGE_ID = '00000000-0000-0000-0000-000000000003';
const ALL_SITES = ['CHUK', 'RMH', 'KFH', 'Butaro Hospital'];

export async function seed(knex) {
  const existing = await knex('users').where('is_default', true).count('id as count');
  if (parseInt(existing[0].count, 10) >= 3) return;

  const users = [
    {
      id: ADMIN_ID,
      name: 'Esperance Umumararungu',
      username: 'esperance',
      password_hash: await bcrypt.hash('leuktrack2025', 12),
      role: 'admin',
      sites: ALL_SITES,
      is_default: true,
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: VIEWER_ID,
      name: 'Supervisor Rwanda',
      username: 'supervisor',
      password_hash: await bcrypt.hash('viewer2025', 12),
      role: 'viewer',
      sites: ALL_SITES,
      is_default: true,
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: LIEGE_ID,
      name: 'Liege Team',
      username: 'liege_user',
      password_hash: await bcrypt.hash('liege2025', 12),
      role: 'liege',
      sites: ALL_SITES,
      is_default: true,
      created_at: '2025-01-01T00:00:00Z',
    },
  ];

  for (const user of users) {
    const exists = await knex('users').where('id', user.id).first();
    if (!exists) {
      await knex('users').insert(user);
    }
  }
}
