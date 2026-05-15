import db from '../config/db.js';
import { logAudit } from '../services/audit.service.js';
import { stripPii, stripPiiFromSample } from '../middleware/piiFilter.js';

export async function getShipments(req, res) {
  const shipments = await db('shipments').orderBy('created_at', 'desc');

  const result = [];
  for (const s of shipments) {
    const samples = await db('shipment_samples')
      .where('shipment_id', s.id)
      .join('patients', 'patients.id', 'shipment_samples.patient_id')
      .select(
        'shipment_samples.*',
        'patients.code as patientCode',
        'patients.name as patientName',
        'patients.facility as facility'
      );

    result.push(formatShipment(s, samples, req.user.canSeePii));
  }

  res.json(result);
}

export async function getShipment(req, res) {
  const { id } = req.params;
  const shipment = await db('shipments').where('id', id).first();
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const samples = await db('shipment_samples')
    .where('shipment_id', id)
    .join('patients', 'patients.id', 'shipment_samples.patient_id')
    .select(
      'shipment_samples.*',
      'patients.code as patientCode',
      'patients.name as patientName'
    );

  res.json(formatShipment(shipment, samples, req.user.canSeePii));
}

export async function createShipment(req, res) {
  const { shipDate, samples } = req.validated;

  const trx = await db.transaction();
  try {
    // Create shipment
    const [shipment] = await trx('shipments')
      .insert({
        ship_date: shipDate,
        status: 'shipped',
        created_by: req.user.id,
      })
      .returning('*');

    // Insert samples
    for (const sample of samples) {
      await trx('shipment_samples').insert({
        shipment_id: shipment.id,
        patient_id: sample.patientId,
        vials_shipped: sample.vialsShipped,
        sample_condition: sample.sampleCondition || null,
        qc_cell_count: sample.qcCellCount || null,
        qc_viability: sample.qcViability || null,
        qc_notes: sample.qcNotes || null,
      });

      // Update transfer step
      const transfer = await trx('transfer_steps').where('patient_id', sample.patientId).first();
      const now = new Date();

      if (transfer) {
        await trx('transfer_steps').where('patient_id', sample.patientId).update({
          total_vials_shipped: transfer.total_vials_shipped + sample.vialsShipped,
          submitted: true,
          submitted_at: transfer.submitted_at || now,
          submitted_by: transfer.submitted_by || req.user.id,
          updated_at: now,
        });
      } else {
        await trx('transfer_steps').insert({
          patient_id: sample.patientId,
          total_vials_shipped: sample.vialsShipped,
          submitted: true,
          submitted_at: now,
          submitted_by: req.user.id,
        });
      }
    }

    await trx.commit();

    const actor = await db('users').where('id', req.user.id).first();
    await logAudit({
      userId: req.user.id,
      userName: actor?.name,
      action: 'shipment.create',
      entityType: 'shipment',
      entityId: shipment.id,
      details: `Shipment created with ${samples.length} sample(s)`,
      ipAddress: req.ip,
    });

    // Reload with full data
    const sampleRows = await db('shipment_samples')
      .where('shipment_id', shipment.id)
      .join('patients', 'patients.id', 'shipment_samples.patient_id')
      .select('shipment_samples.*', 'patients.code as patientCode', 'patients.name as patientName');

    res.status(201).json(formatShipment(shipment, sampleRows, req.user.canSeePii));
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

export async function receiveShipment(req, res) {
  const { id } = req.params;
  const { samples, receiptNotes } = req.validated;

  const shipment = await db('shipments').where('id', id).first();
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  if (shipment.status === 'received') return res.status(400).json({ error: 'Shipment already fully received' });

  const trx = await db.transaction();
  try {
    const now = new Date();

    // Update each sample's QC data
    for (const sample of samples) {
      const updates = {
        received: sample.received !== false,
      };
      if (sample.vialsReceived != null) updates.vials_received = sample.vialsReceived;
      if (sample.sampleCondition) updates.sample_condition = sample.sampleCondition;
      if (sample.qcCellCount) updates.qc_cell_count = sample.qcCellCount;
      if (sample.qcViability) updates.qc_viability = sample.qcViability;
      if (sample.qcNotes !== undefined) updates.qc_notes = sample.qcNotes;

      await trx('shipment_samples')
        .where('shipment_id', id)
        .where('patient_id', sample.patientId)
        .update(updates);
    }

    // Compute new shipment status
    const allSamples = await trx('shipment_samples').where('shipment_id', id);
    const allReceived = allSamples.every((s) => s.received);
    const someReceived = allSamples.some((s) => s.received);
    const newStatus = allReceived ? 'received' : someReceived ? 'partial' : shipment.status;

    await trx('shipments').where('id', id).update({
      status: newStatus,
      received_by: req.user.id,
      received_at: now,
      receipt_notes: receiptNotes || '',
    });

    // Sync QC data back to transfer steps
    for (const sample of allSamples) {
      if (!sample.received) continue;

      // Check if ALL shipments for this patient are received
      const patientShipmentSamples = await trx('shipment_samples')
        .where('patient_id', sample.patient_id);

      const allPatientShipmentsReceived = patientShipmentSamples.every((ss) => ss.received);

      const transferUpdates = {
        sample_condition: sample.sample_condition,
        vials_received: sample.vials_received,
        qc_cell_count: sample.qc_cell_count,
        qc_viability: sample.qc_viability,
        qc_notes: sample.qc_notes,
        updated_at: now,
      };

      if (allPatientShipmentsReceived) {
        transferUpdates.receipt_confirmed = true;
        transferUpdates.receipt_confirmed_at = now;
        transferUpdates.receipt_confirmed_by = req.user.id;
      }

      await trx('transfer_steps')
        .where('patient_id', sample.patient_id)
        .update(transferUpdates);
    }

    await trx.commit();

    const actor = await db('users').where('id', req.user.id).first();
    await logAudit({
      userId: req.user.id,
      userName: actor?.name,
      action: 'shipment.receive',
      entityType: 'shipment',
      entityId: id,
      details: `Shipment reception confirmed (${newStatus})`,
      ipAddress: req.ip,
    });

    // Reload
    const updatedShipment = await db('shipments').where('id', id).first();
    const sampleRows = await db('shipment_samples')
      .where('shipment_id', id)
      .join('patients', 'patients.id', 'shipment_samples.patient_id')
      .select('shipment_samples.*', 'patients.code as patientCode', 'patients.name as patientName');

    res.json(formatShipment(updatedShipment, sampleRows, req.user.canSeePii));
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

export async function deleteShipment(req, res) {
  const { id } = req.params;
  const shipment = await db('shipments').where('id', id).first();
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const samples = await db('shipment_samples').where('shipment_id', id);

  const trx = await db.transaction();
  try {
    // Revert transfer steps for each patient
    for (const sample of samples) {
      const remaining = await trx('shipment_samples')
        .where('patient_id', sample.patient_id)
        .whereNot('shipment_id', id);

      const totalVialsShipped = remaining.reduce((sum, s) => sum + s.vials_shipped, 0);

      if (remaining.length === 0) {
        // No more shipments — reset transfer step
        const transfer = await trx('transfer_steps').where('patient_id', sample.patient_id).first();
        if (transfer) {
          await trx('transfer_steps').where('patient_id', sample.patient_id).update({
            total_vials_shipped: 0,
            submitted: false,
            submitted_at: null,
            submitted_by: null,
            receipt_confirmed: false,
            receipt_confirmed_at: null,
            receipt_confirmed_by: null,
            sample_condition: null,
            vials_received: null,
            qc_cell_count: null,
            qc_viability: null,
            qc_notes: null,
            updated_at: new Date(),
          });
        }
      } else {
        await trx('transfer_steps').where('patient_id', sample.patient_id).update({
          total_vials_shipped: totalVialsShipped,
          updated_at: new Date(),
        });
      }
    }

    await trx('shipment_samples').where('shipment_id', id).del();
    await trx('shipments').where('id', id).del();
    await trx.commit();

    const actor = await db('users').where('id', req.user.id).first();
    await logAudit({
      userId: req.user.id,
      userName: actor?.name,
      action: 'shipment.delete',
      entityType: 'shipment',
      entityId: id,
      details: `Shipment deleted`,
      ipAddress: req.ip,
    });

    res.json({ ok: true });
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

export async function getShippablePatients(req, res) {
  const patients = await db('patients');
  const result = [];

  for (const p of patients) {
    // Site filter for entry role
    if (req.user.role === 'entry' && req.user.sites.length > 0 && !req.user.sites.includes(p.facility)) {
      continue;
    }

    const pbmc = await db('pbmc_steps').where('patient_id', p.id).where('submitted', true).first();
    if (!pbmc || !pbmc.vials || pbmc.vials <= 0) continue;

    const transfer = await db('transfer_steps').where('patient_id', p.id).first();
    const alreadyShipped = transfer?.total_vials_shipped || 0;
    const available = pbmc.vials - alreadyShipped;

    if (available > 0) {
      result.push(stripPii({
        id: p.id,
        code: p.code,
        name: p.name,
        facility: p.facility,
        leukemiaType: p.leukemia_type,
        vialsTotal: pbmc.vials,
        vialsAvailable: available,
      }, req.user.canSeePii));
    }
  }

  res.json(result);
}

function formatShipment(s, samples = [], canSeePii = true) {
  return {
    id: s.id,
    shipDate: s.ship_date,
    trackingNumber: s.tracking_number,
    status: s.status,
    createdBy: s.created_by,
    createdAt: s.created_at,
    receivedBy: s.received_by,
    receivedAt: s.received_at,
    receiptNotes: s.receipt_notes,
    samples: samples.map((sm) => stripPiiFromSample({
      patientId: sm.patient_id,
      patientCode: sm.patientCode,
      patientName: sm.patientName,
      facility: sm.facility,
      vialsShipped: sm.vials_shipped,
      received: sm.received,
      vialsReceived: sm.vials_received,
      sampleCondition: sm.sample_condition,
      qcCellCount: sm.qc_cell_count,
      qcViability: sm.qc_viability,
      qcNotes: sm.qc_notes,
    }, canSeePii)),
  };
}
