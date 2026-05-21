export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.string('email', 200).nullable();
    t.boolean('email_verified').defaultTo(false);
    t.timestamp('welcome_email_sent_at', { useTz: true });
  });

  // Case-insensitive unique index — only enforces uniqueness when email is NOT NULL
  await knex.raw(
    `CREATE UNIQUE INDEX uniq_users_email_lower
     ON users (LOWER(email)) WHERE email IS NOT NULL`,
  );
}

export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS uniq_users_email_lower');
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('welcome_email_sent_at');
    t.dropColumn('email_verified');
    t.dropColumn('email');
  });
}
