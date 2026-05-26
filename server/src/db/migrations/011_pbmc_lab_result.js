// Add lab_result_file (base64 data URL, large) + lab_result_name to pbmc_steps.
// Stored inline (same approach as consent file uploads) — keeps the schema
// simple and means the value travels with the step row, no separate file path
// to manage. Tradeoff: PBMC rows can be a few MB. Worth it for MVP.

export async function up(knex) {
  await knex.schema.alterTable('pbmc_steps', (table) => {
    table.text('lab_result_file').nullable();   // base64 data URL
    table.string('lab_result_name').nullable(); // original filename
  });
}

export async function down(knex) {
  await knex.schema.alterTable('pbmc_steps', (table) => {
    table.dropColumn('lab_result_file');
    table.dropColumn('lab_result_name');
  });
}
