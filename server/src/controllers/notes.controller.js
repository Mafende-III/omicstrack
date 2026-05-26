// Patient notes / comments — overall and per-step threads.
// Visibility: any user with view_patients can read; any user with view_patients
// can post. Delete is author-only OR manage_users (admin). Site filter applies
// the same as patient access.

import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';

const ALLOWED_STEPS = ['consent', 'questionnaire', 'collection', 'pbmc', 'transfer'];

async function assertPatientAccess(req, patientId) {
  const patient = await db('patients').where('id', patientId).first();
  if (!patient) return { error: { status: 404, msg: 'Patient not found' } };
  if (req.user.role === 'entry' && req.user.sites?.length > 0) {
    if (!req.user.sites.includes(patient.facility)) {
      return { error: { status: 403, msg: 'Forbidden (site)' } };
    }
  }
  return { patient };
}

export async function listNotes(req, res) {
  const { patientId } = req.params;
  const { step } = req.query;

  const { patient, error } = await assertPatientAccess(req, patientId);
  if (error) return res.status(error.status).json({ error: error.msg });

  let q = db('patient_notes').where('patient_id', patient.id);
  if (step === 'overall') {
    q = q.whereNull('step');
  } else if (step) {
    if (!ALLOWED_STEPS.includes(step)) {
      return res.status(400).json({ error: 'Invalid step' });
    }
    q = q.where('step', step);
  }
  const rows = await q.orderBy('created_at', 'asc');
  res.json(rows.map(formatNote));
}

export async function createNote(req, res) {
  const { patientId } = req.params;
  const { step, body } = req.body || {};

  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ error: 'Body required' });
  }
  if (body.length > 4000) {
    return res.status(400).json({ error: 'Note too long (4000 char max)' });
  }
  if (step != null && !ALLOWED_STEPS.includes(step)) {
    return res.status(400).json({ error: 'Invalid step' });
  }

  const { patient, error } = await assertPatientAccess(req, patientId);
  if (error) return res.status(error.status).json({ error: error.msg });

  const actor = await db('users').where('id', req.user.id).first();

  const [row] = await db('patient_notes').insert({
    patient_id: patient.id,
    step: step || null,
    author_id: req.user.id,
    author_name: actor?.name || null,
    body: body.trim(),
  }).returning('*');

  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'note.create',
    entityType: 'patient',
    entityId: patient.id,
    details: `Note added (${step || 'overall'})`,
    ipAddress: req.ip,
  });

  res.status(201).json(formatNote(row));
}

export async function deleteNote(req, res) {
  const { patientId, noteId } = req.params;

  const { patient, error } = await assertPatientAccess(req, patientId);
  if (error) return res.status(error.status).json({ error: error.msg });

  const note = await db('patient_notes')
    .where({ id: noteId, patient_id: patient.id })
    .first();
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const isAuthor = note.author_id === req.user.id;
  const isAdmin = req.user.capabilities?.includes('manage_users');
  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: 'Only the author or an admin can delete this note' });
  }

  await db('patient_notes').where('id', noteId).del();

  const actor = await db('users').where('id', req.user.id).first();
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'note.delete',
    entityType: 'patient',
    entityId: patient.id,
    details: `Note deleted (${note.step || 'overall'})`,
    ipAddress: req.ip,
  });

  res.status(204).end();
}

function formatNote(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    step: row.step || null,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
