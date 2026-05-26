// Patient notes — a lightweight comment thread per patient. Used in two
// places: overall notes on the patient detail page (step IS NULL) and
// per-step comments embedded in each workflow step (step = consent/...).
//
// Author info is duplicated (author_id FK + author_name snapshot) so the
// note survives user deletion legibly.

export async function up(knex) {
  await knex.schema.createTable('patient_notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE');
    table.string('step', 32).nullable(); // null = overall patient note
    table.uuid('author_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('author_name', 200).nullable();
    table.text('body').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['patient_id', 'created_at']);
    table.index(['patient_id', 'step']);
  });
}

export async function down(knex) {
  await knex.schema.dropTable('patient_notes');
}
