export const SITES = ['CHUK', 'RMH', 'KFH', 'Butaro Hospital'];
export const LK_TYPES = ['AML', 'ALL', 'CLL', 'CML', 'Other'];
export const STEP_KEYS = ['consent', 'questionnaire', 'collection', 'pbmc', 'transfer'];
export const SAMPLE_CONDITIONS = ['intact', 'compromised', 'damaged', 'missing'];

export const ROLES = {
  admin: 'admin',
  entry: 'entry',
  viewer: 'viewer',
  liege: 'liege',
};

export const STORAGE_KEYS = {
  schemaVersion: 'lt_schema_v',
  users: 'lt_users',
  patients: 'lt_patients',
  session: 'lt_session',
  preferences: 'lt_prefs',
  auditLog: 'lt_audit',
  consent: (id) => `lt_consent_${id}`,
  questionnaire: (id) => `lt_quest_${id}`,
  collection: (id) => `lt_collect_${id}`,
  pbmc: (id) => `lt_pbmc_${id}`,
  transfer: (id) => `lt_transfer_${id}`,
  shipments: 'lt_shipments',
};
