// Mirror of server/src/constants/capabilities.js — kept in sync manually.
// The client uses these only for UI gating (hiding buttons/tabs); the server
// is the authoritative enforcer.

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

export const ROLE_PRESETS = {
  admin: [
    'view_patients', 'add_patient', 'edit_patient', 'view_pii',
    'submit_consent', 'submit_questionnaire', 'submit_collection', 'submit_pbmc',
    'create_shipment', 'receive_shipment',
    'manage_users', 'edit_forms', 'view_audit',
  ],
  entry: [
    'view_patients', 'add_patient', 'edit_patient', 'view_pii',
    'submit_consent', 'submit_questionnaire', 'submit_collection', 'submit_pbmc',
    'create_shipment',
  ],
  viewer: ['view_patients', 'view_pii'],
  liege: ['view_patients', 'receive_shipment'],
};

export function capabilitiesForRole(role) {
  return ROLE_PRESETS[role] || [];
}

export function hasCapability(user, capability) {
  if (!user) return false;
  const caps = Array.isArray(user.capabilities) && user.capabilities.length > 0
    ? user.capabilities
    : capabilitiesForRole(user.role);
  return caps.includes(capability);
}
