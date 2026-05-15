export async function up(knex) {
  // Consent form template versions
  await knex.schema.createTable('consent_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('version').notNullable().unique();
    t.jsonb('content').notNullable(); // { en: {...}, fr: {...}, ki: {...} }
    t.boolean('is_active').defaultTo(false);
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('published_at', { useTz: true });

    t.index('is_active', 'idx_consent_templates_active');
  });

  // Only one active version at a time
  await knex.raw(
    `CREATE UNIQUE INDEX uniq_consent_templates_one_active
     ON consent_templates (is_active) WHERE is_active = true`,
  );

  // Questionnaire template versions
  await knex.schema.createTable('questionnaire_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('version').notNullable().unique();
    t.jsonb('content').notNullable();
    t.boolean('is_active').defaultTo(false);
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('published_at', { useTz: true });

    t.index('is_active', 'idx_questionnaire_templates_active');
  });

  await knex.raw(
    `CREATE UNIQUE INDEX uniq_questionnaire_templates_one_active
     ON questionnaire_templates (is_active) WHERE is_active = true`,
  );

  // Bind submitted steps to the template version they were signed against.
  // Required for IRB compliance: regenerated PDFs must reproduce the historical form.
  await knex.schema.alterTable('consent_steps', (t) => {
    t.uuid('template_version_id').references('id').inTable('consent_templates').onDelete('SET NULL');
  });

  await knex.schema.alterTable('questionnaire_steps', (t) => {
    t.uuid('template_version_id').references('id').inTable('questionnaire_templates').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('questionnaire_steps', (t) => {
    t.dropColumn('template_version_id');
  });
  await knex.schema.alterTable('consent_steps', (t) => {
    t.dropColumn('template_version_id');
  });
  await knex.schema.dropTable('questionnaire_templates');
  await knex.schema.dropTable('consent_templates');
}
