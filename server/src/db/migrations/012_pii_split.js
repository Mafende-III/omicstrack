// Split the single `can_see_pii` boolean into three per-field flags so admins
// can grant per-field PII access (e.g. show facility but hide name).
// Backfill: existing users get all three set to whatever their can_see_pii was.
// can_see_pii column is kept for back-compat reads but no longer written to.

export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('can_see_name').defaultTo(true).notNullable();
    table.boolean('can_see_age').defaultTo(true).notNullable();
    table.boolean('can_see_facility').defaultTo(true).notNullable();
  });

  // Backfill: users with can_see_pii=false get all three locked down
  await knex('users')
    .where({ can_see_pii: false })
    .update({
      can_see_name: false,
      can_see_age: false,
      can_see_facility: false,
    });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('can_see_name');
    table.dropColumn('can_see_age');
    table.dropColumn('can_see_facility');
  });
}
