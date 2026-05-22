import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';
import { stripPii } from '../middleware/piiFilter.js';

export async function getPatients(req, res) {
  let query = db('patients').orderBy('enrolled_at', 'desc');

  if (req.siteFilter) {
    query = query.whereIn('facility', req.siteFilter);
  }

  const patients = await query;
  res.json(patients.map((p) => stripPii(formatPatient(p), req.user.canSeePii)));
}

export async function getPatient(req, res) {
  const { id } = req.params;
  const patient = await db('patients').where('id', id).first();
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Site check for entry role
  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(patient.facility)) {
    return res.status(403).json({ error: 'Patient not at your assigned site' });
  }

  // Include step completion status
  const [consent, questionnaire, collection, pbmc, transfer] = await Promise.all([
    db('consent_steps').where('patient_id', id).first(),
    db('questionnaire_steps').where('patient_id', id).first(),
    db('collection_steps').where('patient_id', id).first(),
    db('pbmc_steps').where('patient_id', id).first(),
    db('transfer_steps').where('patient_id', id).first(),
  ]);

  res.json({
    ...stripPii(formatPatient(patient), req.user.canSeePii),
    steps: {
      consent: !!consent?.submitted,
      questionnaire: !!questionnaire?.submitted,
      collection: !!collection?.submitted,
      pbmc: !!pbmc?.submitted,
      transfer: !!transfer?.submitted,
      receiptConfirmed: !!transfer?.receipt_confirmed,
    },
  });
}

export async function createPatient(req, res) {
  const data = req.validated;

  // Site restriction for entry role
  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(data.facility)) {
    return res.status(403).json({ error: 'Cannot create patients outside your assigned sites' });
  }

  // Uniqueness check
  const existing = await db('patients').where('code', data.code).first();
  if (existing) {
    return res.status(409).json({ error: 'Patient code already exists' });
  }

  const [patient] = await db('patients')
    .insert({
      code: data.code,
      name: data.name,
      age: data.age,
      leukemia_type: data.leukemiaType,
      treatment: data.treatment,
      facility: data.facility,
      enrolled_by: req.user.id,
      updated_by: req.user.id,
    })
    .returning('*');

  const actor = await db('users').where('id', req.user.id).first();
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'patient.create',
    entityType: 'patient',
    entityId: patient.id,
    details: `Patient ${data.code} - ${data.name} added`,
    ipAddress: req.ip,
  });

  res.status(201).json(stripPii(formatPatient(patient), req.user.canSeePii));
}

export async function updatePatient(req, res) {
  const { id } = req.params;
  const data = req.validated;

  const patient = await db('patients').where('id', id).first();
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Site check for entry role
  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(patient.facility)) {
    return res.status(403).json({ error: 'Cannot modify patients outside your assigned sites' });
  }

  // Code uniqueness if changing code
  if (data.code && data.code !== patient.code) {
    const existing = await db('patients').where('code', data.code).whereNot('id', id).first();
    if (existing) {
      return res.status(409).json({ error: 'Patient code already exists' });
    }
  }

  const updates = {};
  if (data.code !== undefined) updates.code = data.code;
  if (data.name !== undefined) updates.name = data.name;
  if (data.age !== undefined) updates.age = data.age;
  if (data.leukemiaType !== undefined) updates.leukemia_type = data.leukemiaType;
  if (data.treatment !== undefined) updates.treatment = data.treatment;
  if (data.facility !== undefined) updates.facility = data.facility;
  updates.updated_at = new Date();
  updates.updated_by = req.user.id;

  const [updated] = await db('patients').where('id', id).update(updates).returning('*');

  const actor = await db('users').where('id', req.user.id).first();
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'patient.update',
    entityType: 'patient',
    entityId: id,
    details: `Patient ${updated.code} updated`,
    ipAddress: req.ip,
  });

  res.json(stripPii(formatPatient(updated), req.user.canSeePii));
}

export async function deletePatient(req, res) {
  const { id } = req.params;

  const patient = await db('patients').where('id', id).first();
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Optional safety: entry users with site restrictions can only delete
  // patients at their assigned sites. (Will only matter if delete_patient
  // is ever granted to an entry user.)
  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(patient.facility)) {
    return res.status(403).json({ error: 'Cannot delete patients outside your assigned sites' });
  }

  const actor = await db('users').where('id', req.user.id).first();

  // Log audit BEFORE delete so the entry survives even if the FK cascade
  // wipes any audit_log rows that referenced this patient (it shouldn't —
  // audit_log doesn't FK to patients — but log first as a habit).
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: 'patient.delete',
    entityType: 'patient',
    entityId: id,
    details: `Patient ${patient.code} - ${patient.name} deleted (cascade: consent/questionnaire/collection/pbmc/transfer steps + shipment samples)`,
    ipAddress: req.ip,
  });

  // FK cascades handle consent_steps, questionnaire_steps, collection_steps,
  // pbmc_steps, transfer_steps, shipment_samples.
  await db('patients').where('id', id).del();

  res.json({ ok: true, deleted: { id, code: patient.code, name: patient.name } });
}

export async function getDashboardStats(req, res) {
  let patientsQuery = db('patients');
  if (req.siteFilter) {
    patientsQuery = patientsQuery.whereIn('facility', req.siteFilter);
  }
  const patients = await patientsQuery;
  const patientIds = patients.map((p) => p.id);

  if (patientIds.length === 0) {
    return res.json({
      total: 0,
      byType: {},
      byFacility: {},
      byTreatment: {},
      steps: { consent: 0, questionnaire: 0, collection: 0, pbmc: 0, transfer: 0 },
      pipelineCounts: { preCollection: 0, processing: 0, ready: 0, inTransit: 0, received: 0 },
    });
  }

  const [consentCount, questCount, collectCount, pbmcCount, transferCount] = await Promise.all([
    db('consent_steps').whereIn('patient_id', patientIds).where('submitted', true).count('* as c'),
    db('questionnaire_steps').whereIn('patient_id', patientIds).where('submitted', true).count('* as c'),
    db('collection_steps').whereIn('patient_id', patientIds).where('submitted', true).count('* as c'),
    db('pbmc_steps').whereIn('patient_id', patientIds).where('submitted', true).count('* as c'),
    db('transfer_steps').whereIn('patient_id', patientIds).where('submitted', true).count('* as c'),
  ]);

  const byType = {};
  const byFacility = {};
  const byTreatment = {};
  for (const p of patients) {
    byType[p.leukemia_type] = (byType[p.leukemia_type] || 0) + 1;
    byFacility[p.facility] = (byFacility[p.facility] || 0) + 1;
    byTreatment[p.treatment] = (byTreatment[p.treatment] || 0) + 1;
  }

  // Pipeline counts
  const allConsent = await db('consent_steps').whereIn('patient_id', patientIds).select('patient_id', 'submitted');
  const allPbmc = await db('pbmc_steps').whereIn('patient_id', patientIds).select('patient_id', 'submitted');
  const allTransfer = await db('transfer_steps').whereIn('patient_id', patientIds).select('patient_id', 'submitted', 'receipt_confirmed');

  const consentMap = Object.fromEntries(allConsent.map((r) => [r.patient_id, r.submitted]));
  const pbmcMap = Object.fromEntries(allPbmc.map((r) => [r.patient_id, r.submitted]));
  const transferMap = Object.fromEntries(allTransfer.map((r) => [r.patient_id, { submitted: r.submitted, confirmed: r.receipt_confirmed }]));

  let preCollection = 0, processing = 0, ready = 0, inTransit = 0, received = 0;
  for (const p of patients) {
    const hasConsent = !!consentMap[p.id];
    const hasPbmc = !!pbmcMap[p.id];
    const transferInfo = transferMap[p.id];
    const hasTransfer = !!transferInfo?.submitted;
    const hasReceipt = !!transferInfo?.confirmed;

    if (hasReceipt) received++;
    else if (hasTransfer) inTransit++;
    else if (hasPbmc) ready++;
    else if (hasConsent) processing++;
    else preCollection++;
  }

  res.json({
    total: patients.length,
    byType,
    byFacility: req.user.canSeePii ? byFacility : {},
    byTreatment,
    steps: {
      consent: parseInt(consentCount[0].c, 10),
      questionnaire: parseInt(questCount[0].c, 10),
      collection: parseInt(collectCount[0].c, 10),
      pbmc: parseInt(pbmcCount[0].c, 10),
      transfer: parseInt(transferCount[0].c, 10),
    },
    pipelineCounts: { preCollection, processing, ready, inTransit, received },
  });
}

function formatPatient(p) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    age: p.age,
    leukemiaType: p.leukemia_type,
    treatment: p.treatment,
    facility: p.facility,
    enrolledAt: p.enrolled_at,
    enrolledBy: p.enrolled_by,
    updatedAt: p.updated_at,
    updatedBy: p.updated_by,
  };
}
