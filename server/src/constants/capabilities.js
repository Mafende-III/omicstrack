// Capabilities are the atomic units of authorization. Roles are named presets
// of capabilities; admins can additionally toggle individual capabilities on
// or off per user via the Edit User form.
//
// IMPORTANT: keep this file in sync with client/src/constants/capabilities.js.

export const CAPABILITIES = {
  VIEW_PATIENTS: 'view_patients',
  ADD_PATIENT: 'add_patient',
  EDIT_PATIENT: 'edit_patient',
  VIEW_PII: 'view_pii',
  SUBMIT_CONSENT: 'submit_consent',
  SUBMIT_QUESTIONNAIRE: 'submit_questionnaire',
  SUBMIT_COLLECTION: 'submit_collection',
  SUBMIT_PBMC: 'submit_pbmc',
  CREATE_SHIPMENT: 'create_shipment',
  RECEIVE_SHIPMENT: 'receive_shipment',
  MANAGE_USERS: 'manage_users',
  EDIT_FORMS: 'edit_forms',
  VIEW_AUDIT: 'view_audit',
};

// Display labels grouped by area — for the Edit User UI.
export const CAPABILITY_GROUPS = [
  {
    label: 'Patients',
    items: [
      { id: CAPABILITIES.VIEW_PATIENTS, label: 'View patient list' },
      { id: CAPABILITIES.ADD_PATIENT, label: 'Add new patients' },
      { id: CAPABILITIES.EDIT_PATIENT, label: 'Edit patient profile' },
      { id: CAPABILITIES.VIEW_PII, label: 'View patient personal data (name, age, facility)' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { id: CAPABILITIES.SUBMIT_CONSENT, label: 'Submit consent step' },
      { id: CAPABILITIES.SUBMIT_QUESTIONNAIRE, label: 'Submit questionnaire' },
      { id: CAPABILITIES.SUBMIT_COLLECTION, label: 'Submit sample collection' },
      { id: CAPABILITIES.SUBMIT_PBMC, label: 'Submit PBMC isolation' },
    ],
  },
  {
    label: 'Shipments',
    items: [
      { id: CAPABILITIES.CREATE_SHIPMENT, label: 'Create shipments' },
      { id: CAPABILITIES.RECEIVE_SHIPMENT, label: 'Receive shipments (Liège)' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: CAPABILITIES.MANAGE_USERS, label: 'Manage users (create / edit / delete)' },
      { id: CAPABILITIES.EDIT_FORMS, label: 'Edit consent / questionnaire templates' },
      { id: CAPABILITIES.VIEW_AUDIT, label: 'View audit log' },
    ],
  },
];

// Default capability set for each role. New users inherit their role's set;
// admins can later tweak per-user.
export const ROLE_PRESETS = {
  admin: [
    CAPABILITIES.VIEW_PATIENTS,
    CAPABILITIES.ADD_PATIENT,
    CAPABILITIES.EDIT_PATIENT,
    CAPABILITIES.VIEW_PII,
    CAPABILITIES.SUBMIT_CONSENT,
    CAPABILITIES.SUBMIT_QUESTIONNAIRE,
    CAPABILITIES.SUBMIT_COLLECTION,
    CAPABILITIES.SUBMIT_PBMC,
    CAPABILITIES.CREATE_SHIPMENT,
    CAPABILITIES.RECEIVE_SHIPMENT,
    CAPABILITIES.MANAGE_USERS,
    CAPABILITIES.EDIT_FORMS,
    CAPABILITIES.VIEW_AUDIT,
  ],
  entry: [
    CAPABILITIES.VIEW_PATIENTS,
    CAPABILITIES.ADD_PATIENT,
    CAPABILITIES.EDIT_PATIENT,
    CAPABILITIES.VIEW_PII,
    CAPABILITIES.SUBMIT_CONSENT,
    CAPABILITIES.SUBMIT_QUESTIONNAIRE,
    CAPABILITIES.SUBMIT_COLLECTION,
    CAPABILITIES.SUBMIT_PBMC,
    CAPABILITIES.CREATE_SHIPMENT,
  ],
  viewer: [
    CAPABILITIES.VIEW_PATIENTS,
    CAPABILITIES.VIEW_PII,
  ],
  liege: [
    CAPABILITIES.VIEW_PATIENTS,
    CAPABILITIES.RECEIVE_SHIPMENT,
    // Note: VIEW_PII intentionally omitted — Liege team works with masked data
  ],
};

export function capabilitiesForRole(role) {
  return ROLE_PRESETS[role] || [];
}

export function hasCapability(user, capability) {
  if (!user) return false;
  // If the user has an explicit capabilities array, use it; otherwise fall
  // back to the role preset (covers legacy JWTs issued before migration 008).
  const caps = Array.isArray(user.capabilities) && user.capabilities.length > 0
    ? user.capabilities
    : capabilitiesForRole(user.role);
  return caps.includes(capability);
}
