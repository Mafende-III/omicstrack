// Add tubes_collected (1–3) column to collection_steps. Replaces the boolean
// tubes_confirmed for new submissions (kept for back-compat with existing rows).
// Backfill: rows with tubes_confirmed=true get tubes_collected=3.

export async function up(knex) {
  await knex.schema.alterTable('collection_steps', (table) => {
    table.integer('tubes_collected').nullable();
  });

  // Backfill: any row that previously confirmed 3 tubes -> set the count
  await knex('collection_steps')
    .where({ tubes_confirmed: true })
    .whereNull('tubes_collected')
    .update({ tubes_collected: 3 });
}

export async function down(knex) {
  await knex.schema.alterTable('collection_steps', (table) => {
    table.dropColumn('tubes_collected');
  });
}
