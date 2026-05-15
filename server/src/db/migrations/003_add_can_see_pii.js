export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('can_see_pii').notNullable().defaultTo(true);
  });

  // Default: liege users cannot see PII
  await knex('users').where('role', 'liege').update({ can_see_pii: false });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('can_see_pii');
  });
}
