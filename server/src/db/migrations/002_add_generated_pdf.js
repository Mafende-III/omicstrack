export async function up(knex) {
  await knex.schema.alterTable('consent_steps', (table) => {
    table.text('generated_pdf').nullable();
  });
  await knex.schema.alterTable('questionnaire_steps', (table) => {
    table.text('generated_pdf').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('consent_steps', (table) => {
    table.dropColumn('generated_pdf');
  });
  await knex.schema.alterTable('questionnaire_steps', (table) => {
    table.dropColumn('generated_pdf');
  });
}
