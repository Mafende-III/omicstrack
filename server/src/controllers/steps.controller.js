import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';

const STEP_TABLES = {
  consent: 'consent_steps',
  questionnaire: 'questionnaire_steps',
  collection: 'collection_steps',
  pbmc: 'pbmc_steps',
  transfer: 'transfer_steps',
};

const STEP_FORMATTERS = {
  consent: formatConsent,
  questionnaire: formatQuestionnaire,
  collection: formatCollection,
  pbmc: formatPbmc,
  transfer: formatTransfer,
};

export async function getStep(req, res) {
  const { patientId, step } = req.params;
  const table = STEP_TABLES[step];
  if (!table) return res.status(400).json({ error: 'Invalid step' });

  // Verify patient exists
  const patient = await db('patients').where('id', patientId).first();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Site check for entry role
  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(patient.facility)) {
    return res.status(403).json({ error: 'Patient not at your assigned site' });
  }

  const row = await db(table).where('patient_id', patientId).first();
  if (!row) return res.json(null);

  // For transfer step, include shipment details
  if (step === 'transfer') {
    const shipmentSamples = await db('shipment_samples')
      .join('shipments', 'shipments.id', 'shipment_samples.shipment_id')
      .where('shipment_samples.patient_id', patientId)
      .select(
        'shipments.id as shipmentId',
        'shipment_samples.vials_shipped as vialsShipped',
        'shipments.ship_date as shipDate',
        'shipments.status as shipmentStatus'
      );

    const formatted = formatTransfer(row);
    formatted.shipments = shipmentSamples;
    return res.json(formatted);
  }

  res.json(STEP_FORMATTERS[step](row));
}

export async function saveStep(req, res) {
  const { patientId, step } = req.params;
  const table = STEP_TABLES[step];
  if (!table || step === 'transfer') {
    return res.status(400).json({ error: 'Invalid step or transfer is read-only' });
  }

  const patient = await db('patients').where('id', patientId).first();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(patient.facility)) {
    return res.status(403).json({ error: 'Patient not at your assigned site' });
  }

  const existing = await db(table).where('patient_id', patientId).first();
  const data = req.body;
  const now = new Date();

  if (existing) {
    if (existing.submitted) {
      return res.status(400).json({ error: 'Step already submitted' });
    }
    const updates = buildUpdates(step, data);
    updates.updated_at = now;
    await db(table).where('patient_id', patientId).update(updates);
  } else {
    const inserts = buildInserts(step, data, patientId);
    inserts.created_at = now;
    inserts.updated_at = now;
    await db(table).insert(inserts);
  }

  const row = await db(table).where('patient_id', patientId).first();
  res.json(STEP_FORMATTERS[step](row));
}

export async function submitStep(req, res) {
  const { patientId, step } = req.params;
  const table = STEP_TABLES[step];
  if (!table || step === 'transfer') {
    return res.status(400).json({ error: 'Invalid step or transfer is read-only' });
  }

  const patient = await db('patients').where('id', patientId).first();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(patient.facility)) {
    return res.status(403).json({ error: 'Patient not at your assigned site' });
  }

  const existing = await db(table).where('patient_id', patientId).first();
  const now = new Date();

  if (existing) {
    if (existing.submitted) {
      return res.status(400).json({ error: 'Step already submitted' });
    }
    // Merge any body data before submitting
    const data = req.body || {};
    const updates = buildUpdates(step, data);
    updates.submitted = true;
    updates.submitted_at = now;
    updates.submitted_by = req.user.id;
    updates.updated_at = now;
    await db(table).where('patient_id', patientId).update(updates);
  } else {
    const data = req.body || {};
    const inserts = buildInserts(step, data, patientId);
    inserts.submitted = true;
    inserts.submitted_at = now;
    inserts.submitted_by = req.user.id;
    inserts.created_at = now;
    inserts.updated_at = now;
    await db(table).insert(inserts);
  }

  const actor = await db('users').where('id', req.user.id).first();
  await logAudit({
    userId: req.user.id,
    userName: actor?.name,
    action: `${step}.submit`,
    entityType: step,
    entityId: patientId,
    details: `${step} step submitted for patient ${patient.code}`,
    ipAddress: req.ip,
  });

  const row = await db(table).where('patient_id', patientId).first();
  res.json(STEP_FORMATTERS[step](row));
}

// Build column updates from request data for each step type
function buildUpdates(step, data) {
  switch (step) {
    case 'consent':
      return pickDefined({
        mode: data.mode,
        confirmed: data.confirmed,
        patient_signature_path: data.patientSignaturePath,
        researcher_signature_path: data.researcherSignaturePath,
        file_path: data.filePath,
        file_name: data.fileName,
      });
    case 'questionnaire':
      return pickDefined({
        mode: data.mode,
        fields: data.fields ? JSON.stringify(data.fields) : undefined,
        sections_done: data.sectionsDone ? JSON.stringify(data.sectionsDone) : undefined,
        file_path: data.filePath,
        file_name: data.fileName,
      });
    case 'collection':
      return pickDefined({
        date_time: data.dateTime,
        leukemia_type: data.leukemiaType,
        tubes_confirmed: data.tubesConfirmed,
      });
    case 'pbmc':
      return pickDefined({
        location: data.location,
        date_time: data.dateTime,
        cell_count: data.cellCount,
        viability: data.viability,
        concentration: data.concentration,
        vials: data.vials != null ? parseInt(data.vials, 10) || 0 : undefined,
        storage_site: data.storage?.site,
        storage_fridge: data.storage?.fridge,
        storage_shelf: data.storage?.shelf,
        storage_box: data.storage?.box,
      });
    default:
      return {};
  }
}

function buildInserts(step, data, patientId) {
  const updates = buildUpdates(step, data);
  return { patient_id: patientId, ...updates };
}

function pickDefined(obj) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v;
  }
  return result;
}

function formatConsent(row) {
  if (!row) return null;
  return {
    mode: row.mode,
    confirmed: row.confirmed,
    patientSignaturePath: row.patient_signature_path,
    researcherSignaturePath: row.researcher_signature_path,
    filePath: row.file_path,
    fileName: row.file_name,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
  };
}

function formatQuestionnaire(row) {
  if (!row) return null;
  return {
    mode: row.mode,
    fields: row.fields || {},
    sectionsDone: row.sections_done || {},
    filePath: row.file_path,
    fileName: row.file_name,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
  };
}

function formatCollection(row) {
  if (!row) return null;
  return {
    dateTime: row.date_time,
    leukemiaType: row.leukemia_type,
    tubesConfirmed: row.tubes_confirmed,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
  };
}

function formatPbmc(row) {
  if (!row) return null;
  return {
    location: row.location,
    dateTime: row.date_time,
    cellCount: row.cell_count,
    viability: row.viability,
    concentration: row.concentration,
    vials: row.vials,
    storage: {
      site: row.storage_site || '',
      fridge: row.storage_fridge || '',
      shelf: row.storage_shelf || '',
      box: row.storage_box || '',
    },
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
  };
}

function formatTransfer(row) {
  if (!row) return null;
  return {
    totalVialsShipped: row.total_vials_shipped,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    receiptConfirmed: row.receipt_confirmed,
    receiptConfirmedAt: row.receipt_confirmed_at,
    receiptConfirmedBy: row.receipt_confirmed_by,
    sampleCondition: row.sample_condition,
    vialsReceived: row.vials_received,
    qcCellCount: row.qc_cell_count,
    qcViability: row.qc_viability,
    qcNotes: row.qc_notes,
  };
}
