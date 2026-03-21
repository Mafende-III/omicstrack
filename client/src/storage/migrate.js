import { storage } from './engine.js';
import { STORAGE_KEYS as K } from '../constants/index.js';
import { DEF_USERS, SEED_PATIENTS } from '../constants/seedData.js';

const CURRENT_VERSION = 4;

export function runMigrations() {
  const version = storage.get(K.schemaVersion, 0);

  if (version < 1) {
    migrateV0toV1();
  }

  if (version < 2) {
    migrateV1toV2();
  }

  if (version < 3) {
    migrateV2toV3();
  }

  if (version < 4) {
    migrateV3toV4();
  }

  storage.set(K.schemaVersion, CURRENT_VERSION);
}

function migrateV0toV1() {
  // Try to read old keys from previous storage format
  const oldUsers = storage.get('lt_u2', null);
  const oldPatients = storage.get('lt_p2', null);
  const oldSession = storage.get('lt_sess2', null);
  const oldPrefs = storage.get('lt_pr2', null);

  // Migrate users
  if (oldUsers && oldUsers.length > 0) {
    const migrated = oldUsers.map((u) => ({
      ...u,
      isDefault: ['u_esp', 'u_sup', 'u_lie'].includes(u.id),
      createdAt: u.createdAt || '2025-01-01T00:00:00Z',
      createdBy: u.createdBy || 'system',
    }));
    storage.set(K.users, migrated);
  }

  // Migrate patients
  if (oldPatients && oldPatients.length > 0) {
    const migrated = oldPatients.map((p) => ({
      ...p,
      age: typeof p.age === 'string' ? parseInt(p.age, 10) || 0 : p.age,
      enrolledBy: p.enrolledBy || 'u_esp',
      updatedAt: p.updatedAt || p.enrolledAt || new Date().toISOString(),
      updatedBy: p.updatedBy || 'u_esp',
    }));
    storage.set(K.patients, migrated);
  }

  // Migrate session
  if (oldSession) {
    storage.set(K.session, oldSession);
  }

  // Migrate prefs
  if (oldPrefs) {
    storage.set(K.preferences, oldPrefs);
  }
}

function migrateV1toV2() {
  // Ensure users exist
  const users = storage.get(K.users, null);
  if (!users || users.length === 0) {
    storage.set(K.users, DEF_USERS);
  }

  // Ensure patients exist, fix age type
  let patients = storage.get(K.patients, null);
  if (!patients || patients.length === 0) {
    storage.set(K.patients, SEED_PATIENTS);
  } else {
    const fixed = patients.map((p) => ({
      ...p,
      age: typeof p.age === 'string' ? parseInt(p.age, 10) || 0 : p.age,
      enrolledBy: p.enrolledBy || 'u_esp',
      updatedAt: p.updatedAt || p.enrolledAt || new Date().toISOString(),
      updatedBy: p.updatedBy || 'u_esp',
    }));
    storage.set(K.patients, fixed);
  }
}

function migrateV2toV3() {
  // Initialize shipments array
  if (storage.get(K.shipments, null) === null) {
    storage.set(K.shipments, []);
  }

  // Migrate existing per-patient transfer data to new pointer schema
  const patients = storage.get(K.patients, []);
  for (const p of patients) {
    const transfer = storage.get(K.transfer(p.id), null);
    if (transfer && !('shipmentId' in transfer)) {
      storage.set(K.transfer(p.id), {
        shipmentId: null,
        vialsShipped: 0,
        submitted: transfer.submitted || false,
        submittedAt: transfer.submittedAt || null,
        submittedBy: transfer.submittedBy || null,
        receiptConfirmed: transfer.receiptConfirmed || false,
        receiptConfirmedAt: transfer.receiptConfirmedAt || null,
        receiptConfirmedBy: transfer.receiptConfirmedBy || null,
        sampleCondition: '',
        vialsReceived: null,
        qcCellCount: '',
        qcViability: '',
        qcNotes: '',
      });
    }
  }
}

function migrateV3toV4() {
  // Convert single-shipment pointer to multi-shipment array format
  const patients = storage.get(K.patients, []);
  for (const p of patients) {
    const transfer = storage.get(K.transfer(p.id), null);
    if (!transfer) continue;

    // Already migrated (has shipments array)
    if (Array.isArray(transfer.shipments)) continue;

    // Convert old single-pointer format to array format
    const shipments = [];
    if (transfer.shipmentId) {
      // Look up shipDate from the shipment entity
      const allShipments = storage.get(K.shipments, []);
      const shipment = allShipments.find((s) => s.id === transfer.shipmentId);
      shipments.push({
        shipmentId: transfer.shipmentId,
        vialsShipped: transfer.vialsShipped || 0,
        shipDate: shipment?.shipDate || null,
      });
    }

    storage.set(K.transfer(p.id), {
      shipments,
      totalVialsShipped: transfer.vialsShipped || 0,
      submitted: transfer.submitted || false,
      submittedAt: transfer.submittedAt || null,
      submittedBy: transfer.submittedBy || null,
      receiptConfirmed: transfer.receiptConfirmed || false,
      receiptConfirmedAt: transfer.receiptConfirmedAt || null,
      receiptConfirmedBy: transfer.receiptConfirmedBy || null,
      sampleCondition: transfer.sampleCondition || '',
      vialsReceived: transfer.vialsReceived ?? null,
      qcCellCount: transfer.qcCellCount || '',
      qcViability: transfer.qcViability || '',
      qcNotes: transfer.qcNotes || '',
    });
  }
}
