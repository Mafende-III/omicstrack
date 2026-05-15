import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';

const TABLES = {
  consent: 'consent_templates',
  questionnaire: 'questionnaire_templates',
};

function tableFor(req, res) {
  const kind = req.params.kind;
  const table = TABLES[kind];
  if (!table) {
    res.status(400).json({ error: 'Invalid template kind' });
    return null;
  }
  return table;
}

// GET /templates/:kind/active
export async function getActive(req, res) {
  const table = tableFor(req, res);
  if (!table) return;

  const row = await db(table).where('is_active', true).first();
  if (!row) return res.status(404).json({ error: 'No active template' });

  res.json(formatTemplate(row));
}

// GET /templates/:kind/versions  (admin only)
export async function listVersions(req, res) {
  const table = tableFor(req, res);
  if (!table) return;

  const rows = await db(table)
    .leftJoin('users', `${table}.created_by`, 'users.id')
    .select(
      `${table}.id`,
      `${table}.version`,
      `${table}.is_active`,
      `${table}.created_at`,
      `${table}.published_at`,
      'users.name as created_by_name',
    )
    .orderBy(`${table}.version`, 'desc');

  res.json(rows.map((r) => ({
    id: r.id,
    version: r.version,
    isActive: r.is_active,
    createdAt: r.created_at,
    publishedAt: r.published_at,
    createdByName: r.created_by_name,
  })));
}

// GET /templates/:kind/:id  (admin only)
export async function getVersion(req, res) {
  const table = tableFor(req, res);
  if (!table) return;

  const row = await db(table).where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Template version not found' });

  res.json(formatTemplate(row));
}

// POST /templates/:kind  (admin only) — creates new version, marks active, deactivates previous
export async function createVersion(req, res) {
  const table = tableFor(req, res);
  if (!table) return;

  const { content } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'content (object) is required' });
  }

  const now = new Date();
  let newRow;

  await db.transaction(async (trx) => {
    // Get current active for audit diff
    const previous = await trx(table).where('is_active', true).first();
    const nextVersion = ((await trx(table).max('version as v').first())?.v || 0) + 1;

    // Deactivate previous (partial unique index requires this to happen before insert)
    await trx(table).where('is_active', true).update({ is_active: false });

    const [inserted] = await trx(table)
      .insert({
        version: nextVersion,
        content: JSON.stringify(content),
        is_active: true,
        created_by: req.user.id,
        created_at: now,
        published_at: now,
      })
      .returning(['id', 'version', 'is_active', 'created_at', 'published_at']);

    newRow = { ...inserted, content };

    newRow.previousVersion = previous?.version;
    newRow.actor = await trx('users').where('id', req.user.id).first();
  });

  await logAudit({
    userId: req.user.id,
    userName: newRow.actor?.name,
    action: `template.${req.params.kind}.publish`,
    entityType: 'template',
    entityId: newRow.id,
    details: `Published ${req.params.kind} template v${newRow.version}` +
      (newRow.previousVersion ? ` (replaces v${newRow.previousVersion})` : ''),
    ipAddress: req.ip,
  });

  res.status(201).json({
    id: newRow.id,
    version: newRow.version,
    isActive: newRow.is_active,
    createdAt: newRow.created_at,
    publishedAt: newRow.published_at,
    content: newRow.content,
  });
}

function formatTemplate(row) {
  return {
    id: row.id,
    version: row.version,
    isActive: row.is_active,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
  };
}
