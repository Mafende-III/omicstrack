import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';
import { generateConsentPdf, generateQuestionnairePdf } from '../services/pdfGenerator.js';
import { CONSENT_TEMPLATE } from '../constants/consentTemplate.js';
import { QF } from '../constants/questionnaire.js';

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

  // Bind to current active template version (consent + questionnaire only).
  // This snapshot ensures the signed record always refers to what was actually shown,
  // even if admin publishes a new version afterwards.
  let templateVersionId = null;
  if (step === 'consent' || step === 'questionnaire') {
    const tplTable = step === 'consent' ? 'consent_templates' : 'questionnaire_templates';
    const active = await db(tplTable).where('is_active', true).first();
    templateVersionId = active?.id || null;
  }

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
    if (templateVersionId) updates.template_version_id = templateVersionId;
    await db(table).where('patient_id', patientId).update(updates);
  } else {
    const data = req.body || {};
    const inserts = buildInserts(step, data, patientId);
    inserts.submitted = true;
    inserts.submitted_at = now;
    inserts.submitted_by = req.user.id;
    inserts.created_at = now;
    inserts.updated_at = now;
    if (templateVersionId) inserts.template_version_id = templateVersionId;
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

  // Generate PDF for consent and questionnaire on submit
  if (step === 'consent' || step === 'questionnaire') {
    try {
      const lang = ['en', 'fr', 'ki'].includes(req.body?.lang) ? req.body.lang : 'en';
      await generateStepPdf(step, patientId, patient, actor, lang);
    } catch (err) {
      console.error(`PDF generation failed for ${step}:`, err.message);
      // Non-blocking — step is still submitted even if PDF fails
    }
  }

  const row = await db(table).where('patient_id', patientId).first();
  res.json(STEP_FORMATTERS[step](row));
}

// Generate and store PDF for consent or questionnaire step.
// Uses the historical template version the step was bound to (if any),
// falling back to the current active version, then to the static defaults.
async function generateStepPdf(step, patientId, patient, actor, lang = 'en') {
  if (step === 'consent') {
    const row = await db('consent_steps').where('patient_id', patientId).first();
    if (!row) return;

    const content = await loadConsentTemplateContent(row.template_version_id);
    const tpl = content?.[lang] || content?.en || CONSENT_TEMPLATE.en;

    const pdfBuffer = await generateConsentPdf({
      title: tpl.title,
      studyTitle: tpl.studyTitle,
      sections: tpl.sections,
      consentStatement: tpl.consentStatement,
      consentSectionLabel: tpl.consentSectionLabel,
      participantName: patient.name,
      participantLabel: tpl.participantLabel,
      researcherName: actor?.name || '',
      researcherLabel: tpl.researcherLabel,
      signatureAndDateLabel: tpl.signatureAndDate,
      doneAtLabel: tpl.doneAt,
      doneAtValue: patient.facility || '',
      patientCode: patient.code,
      patientSignatureBase64: row.patient_signature_path,
      researcherSignatureBase64: row.researcher_signature_path,
      signedDate: row.submitted_at ? new Date(row.submitted_at).toISOString().split('T')[0] : '',
    });

    const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    await db('consent_steps').where('patient_id', patientId).update({ generated_pdf: base64Pdf });
  }

  if (step === 'questionnaire') {
    const row = await db('questionnaire_steps').where('patient_id', patientId).first();
    if (!row) return;

    const fields = typeof row.fields === 'string' ? JSON.parse(row.fields) : (row.fields || {});

    const content = await loadQuestionnaireTemplateContent(row.template_version_id);
    const sectionDefs = buildQuestionnaireSectionDefs(content, lang);

    // Also load the consent template for its localized title + study title so
    // the questionnaire's header matches the consent visually.
    const consentContent = await loadConsentTemplateContent(null);
    const consentTpl = consentContent?.[lang] || consentContent?.en || CONSENT_TEMPLATE.en;

    const pdfBuffer = await generateQuestionnairePdf({
      title: 'Patient Questionnaire',
      studyTitle: consentTpl.studyTitle,
      patientCode: patient.code,
      patientName: patient.name,
      patientFacility: patient.facility,
      patientAge: patient.age,
      patientLeukemiaType: patient.leukemia_type,
      sectionDefs,
      answers: fields,
      submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString().split('T')[0] : '',
      submittedBy: actor?.name || '',
    });

    const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    await db('questionnaire_steps').where('patient_id', patientId).update({ generated_pdf: base64Pdf });
  }
}

async function loadConsentTemplateContent(templateVersionId) {
  let row;
  if (templateVersionId) {
    row = await db('consent_templates').where('id', templateVersionId).first();
  }
  if (!row) {
    row = await db('consent_templates').where('is_active', true).first();
  }
  if (!row) return null;
  return typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
}

async function loadQuestionnaireTemplateContent(templateVersionId) {
  let row;
  if (templateVersionId) {
    row = await db('questionnaire_templates').where('id', templateVersionId).first();
  }
  if (!row) {
    row = await db('questionnaire_templates').where('is_active', true).first();
  }
  if (!row) return null;
  return typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
}

// Converts DB questionnaire content into the shape generateQuestionnairePdf expects:
// [{ key, label, fields: [{ id, label }] }, ...]
function buildQuestionnaireSectionDefs(content, lang = 'en') {
  const fallbackLabels = {
    A: 'A — Identity',
    B: 'B — Socio-economic',
    C: 'C — Health',
    D: 'D — Clinical / Diagnosis',
    E: 'E — Treatment History',
    F: 'F — Environmental',
  };
  if (!content?.sections) {
    return Object.entries(QF).map(([k, defs]) => ({
      key: k,
      label: fallbackLabels[k] || k,
      fields: defs.map((d) => ({ id: d.id, label: d.en })),
    }));
  }
  return content.sections.map((section) => ({
    key: section.key,
    label: section.labels?.[lang] || section.labels?.en || fallbackLabels[section.key] || section.key,
    fields: section.fields.map((f) => ({
      id: f.id,
      label: f.labels?.[lang] || f.labels?.en || f.id,
    })),
  }));
}

// Build column updates from request data for each step type
function buildUpdates(step, data) {
  switch (step) {
    case 'consent':
      return pickDefined({
        mode: data.mode,
        confirmed: data.confirmed,
        patient_signature_path: data.patientSignature ?? data.patientSignaturePath,
        researcher_signature_path: data.researcherSignature ?? data.researcherSignaturePath,
        file_path: data.file ?? data.filePath,
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
        tubes_collected: data.tubesCollected != null && data.tubesCollected !== ''
          ? Math.max(1, Math.min(3, parseInt(data.tubesCollected, 10) || 1))
          : undefined,
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
        lab_result_file: data.labResultFile,
        lab_result_name: data.labResultFileName,
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

export async function downloadStepPdf(req, res) {
  const { patientId, step } = req.params;
  if (step !== 'consent' && step !== 'questionnaire') {
    return res.status(400).json({ error: 'PDF only available for consent and questionnaire steps' });
  }

  const table = STEP_TABLES[step];
  const row = await db(table).where('patient_id', patientId).first();
  if (!row?.generated_pdf) {
    return res.status(404).json({ error: 'No generated PDF found' });
  }

  // Extract base64 data
  const match = row.generated_pdf.match(/^data:application\/pdf;base64,(.+)$/);
  if (!match) {
    return res.status(500).json({ error: 'Invalid PDF data' });
  }

  const patient = await db('patients').where('id', patientId).first();
  const filename = `${step}_${patient?.code || patientId}.pdf`;

  const pdfBuffer = Buffer.from(match[1], 'base64');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
}

function formatConsent(row) {
  if (!row) return null;
  return {
    mode: row.mode,
    confirmed: row.confirmed,
    patientSignature: row.patient_signature_path,
    researcherSignature: row.researcher_signature_path,
    file: row.file_path,
    fileName: row.file_name,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    hasGeneratedPdf: !!row.generated_pdf,
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
    hasGeneratedPdf: !!row.generated_pdf,
  };
}

function formatCollection(row) {
  if (!row) return null;
  return {
    dateTime: row.date_time,
    leukemiaType: row.leukemia_type,
    tubesConfirmed: row.tubes_confirmed,
    tubesCollected: row.tubes_collected,
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
    labResultFile: row.lab_result_file || null,
    labResultFileName: row.lab_result_name || null,
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
