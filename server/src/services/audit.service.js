import db from '../config/db.js';

export async function logAudit({ userId, userName, action, entityType, entityId, details, ipAddress }) {
  try {
    await db('audit_log').insert({
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}
