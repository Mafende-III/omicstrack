import db from '../config/db.js';

export async function getAuditLog(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = (page - 1) * limit;

  const [{ count }] = await db('audit_log').count('id as count');
  const entries = await db('audit_log')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .offset(offset);

  res.json({
    entries: entries.map(formatAuditEntry),
    total: parseInt(count, 10),
    page,
    limit,
  });
}

export async function getAuditForEntity(req, res) {
  const { entityId } = req.params;
  const entries = await db('audit_log')
    .where('entity_id', entityId)
    .orderBy('timestamp', 'desc')
    .limit(100);

  res.json(entries.map(formatAuditEntry));
}

function formatAuditEntry(e) {
  return {
    id: e.id,
    timestamp: e.timestamp,
    userId: e.user_id,
    userName: e.user_name,
    action: e.action,
    entityType: e.entity_type,
    entityId: e.entity_id,
    details: e.details,
  };
}
