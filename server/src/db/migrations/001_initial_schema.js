export async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Users
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 200).notNullable();
    t.string('username', 100).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.string('role', 20).notNullable();
    t.specificType('sites', 'TEXT[]').defaultTo('{}');
    t.boolean('is_default').defaultTo(false);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');

    t.check("role IN ('admin', 'entry', 'viewer', 'liege')", [], 'check_role');
  });

  // Sessions (for refresh tokens)
  await knex.schema.createTable('sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('refresh_token_hash', 255).notNullable();
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.specificType('ip_address', 'INET');
    t.text('user_agent');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    t.index('user_id', 'idx_sessions_user');
    t.index('expires_at', 'idx_sessions_expires');
  });

  // Patients
  await knex.schema.createTable('patients', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('code', 10).notNullable().unique();
    t.string('name', 200).notNullable();
    t.integer('age').notNullable();
    t.string('leukemia_type', 20).notNullable();
    t.string('treatment', 30).notNullable();
    t.string('facility', 50).notNullable();
    t.timestamp('enrolled_at', { useTz: true }).defaultTo(knex.fn.now());
    t.uuid('enrolled_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    t.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');

    t.check("leukemia_type IN ('AML', 'ALL', 'CLL', 'CML', 'Other')", [], 'check_leukemia_type');
    t.check("treatment IN ('On Treatment', 'Not on Treatment')", [], 'check_treatment');
    t.check("facility IN ('CHUK', 'RMH', 'KFH', 'Butaro Hospital')", [], 'check_facility');
    t.check('age >= 0 AND age <= 150', [], 'check_age');

    t.index('facility', 'idx_patients_facility');
  });

  // Consent steps
  await knex.schema.createTable('consent_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().unique().references('id').inTable('patients').onDelete('CASCADE');
    t.string('mode', 10).defaultTo('upload');
    t.boolean('confirmed').defaultTo(false);
    t.text('patient_signature_path');
    t.text('researcher_signature_path');
    t.text('file_path');
    t.string('file_name', 255);
    t.boolean('submitted').defaultTo(false);
    t.timestamp('submitted_at', { useTz: true });
    t.uuid('submitted_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Questionnaire steps
  await knex.schema.createTable('questionnaire_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().unique().references('id').inTable('patients').onDelete('CASCADE');
    t.string('mode', 10).defaultTo('upload');
    t.jsonb('fields').defaultTo('{}');
    t.jsonb('sections_done').defaultTo('{}');
    t.text('file_path');
    t.string('file_name', 255);
    t.boolean('submitted').defaultTo(false);
    t.timestamp('submitted_at', { useTz: true });
    t.uuid('submitted_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Collection steps
  await knex.schema.createTable('collection_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().unique().references('id').inTable('patients').onDelete('CASCADE');
    t.timestamp('date_time', { useTz: true });
    t.string('leukemia_type', 20);
    t.boolean('tubes_confirmed').defaultTo(false);
    t.boolean('submitted').defaultTo(false);
    t.timestamp('submitted_at', { useTz: true });
    t.uuid('submitted_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // PBMC steps
  await knex.schema.createTable('pbmc_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().unique().references('id').inTable('patients').onDelete('CASCADE');
    t.string('location', 50);
    t.timestamp('date_time', { useTz: true });
    t.string('cell_count', 50);
    t.string('viability', 10);
    t.string('concentration', 50);
    t.integer('vials').defaultTo(0);
    t.string('storage_site', 100);
    t.string('storage_fridge', 50);
    t.string('storage_shelf', 50);
    t.string('storage_box', 50);
    t.boolean('submitted').defaultTo(false);
    t.timestamp('submitted_at', { useTz: true });
    t.uuid('submitted_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Shipments
  await knex.schema.createTable('shipments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('ship_date').notNullable();
    t.string('tracking_number', 100);
    t.text('ship_notes');
    t.string('status', 20).defaultTo('shipped');
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.uuid('received_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('received_at', { useTz: true });
    t.text('receipt_notes');

    t.check("status IN ('shipped', 'partial', 'received')", [], 'check_shipment_status');
  });

  // Shipment samples (junction: shipment ↔ patient)
  await knex.schema.createTable('shipment_samples', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('shipment_id').notNullable().references('id').inTable('shipments').onDelete('CASCADE');
    t.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE');
    t.integer('vials_shipped').notNullable().defaultTo(0);
    t.boolean('received').defaultTo(false);
    t.integer('vials_received');
    t.string('sample_condition', 20);
    t.string('qc_cell_count', 50);
    t.string('qc_viability', 10);
    t.text('qc_notes');

    t.unique(['shipment_id', 'patient_id']);
    t.index('shipment_id', 'idx_shipment_samples_shipment');
    t.index('patient_id', 'idx_shipment_samples_patient');
  });

  // Transfer steps (per-patient transfer summary)
  await knex.schema.createTable('transfer_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('patient_id').notNullable().unique().references('id').inTable('patients').onDelete('CASCADE');
    t.integer('total_vials_shipped').defaultTo(0);
    t.boolean('submitted').defaultTo(false);
    t.timestamp('submitted_at', { useTz: true });
    t.uuid('submitted_by').references('id').inTable('users').onDelete('SET NULL');
    t.boolean('receipt_confirmed').defaultTo(false);
    t.timestamp('receipt_confirmed_at', { useTz: true });
    t.uuid('receipt_confirmed_by').references('id').inTable('users').onDelete('SET NULL');
    t.string('sample_condition', 20);
    t.integer('vials_received');
    t.string('qc_cell_count', 50);
    t.string('qc_viability', 10);
    t.text('qc_notes');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Audit log (append-only)
  await knex.schema.createTable('audit_log', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now());
    t.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('user_name', 200);
    t.string('action', 50).notNullable();
    t.string('entity_type', 30).notNullable();
    t.string('entity_id', 100);
    t.text('details');
    t.specificType('ip_address', 'INET');

    t.index(['entity_type', 'entity_id'], 'idx_audit_entity');
    t.index('user_id', 'idx_audit_user');
  });

  // Create a descending index on timestamp for audit_log
  await knex.raw('CREATE INDEX idx_audit_timestamp ON audit_log (timestamp DESC)');

  // User preferences
  await knex.schema.createTable('user_preferences', (t) => {
    t.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    t.string('lang', 5).defaultTo('en');
    t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    t.check("lang IN ('en', 'fr', 'ki')", [], 'check_lang');
  });
}

export async function down(knex) {
  const tables = [
    'user_preferences',
    'audit_log',
    'transfer_steps',
    'shipment_samples',
    'shipments',
    'pbmc_steps',
    'collection_steps',
    'questionnaire_steps',
    'consent_steps',
    'patients',
    'sessions',
    'users',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
