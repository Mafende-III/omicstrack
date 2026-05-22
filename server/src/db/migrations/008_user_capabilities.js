// Adds a per-user capabilities array on top of the existing role column.
// Roles continue to exist as preset labels (used for UI styling); capabilities
// are the actual authorization signal. New users get their role's preset
// capabilities on creation; admin can tweak per-user via Edit User.
//
// This migration backfills existing users so their effective permissions
// don't change at the moment of upgrade — they keep doing what their role
// previously allowed.

const ROLE_PRESETS = {
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

export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.specificType('capabilities', 'TEXT[]').defaultTo('{}');
  });

  // Backfill — each user gets the preset for their role
  for (const [role, caps] of Object.entries(ROLE_PRESETS)) {
    await knex('users').where('role', role).update({ capabilities: caps });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('capabilities');
  });
}
