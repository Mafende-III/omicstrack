export async function up(knex) {
  await knex.schema.createTable('user_setup_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    // SHA-256 hex of the plaintext token (we never store the plaintext)
    t.string('token_hash', 64).notNullable().unique();
    // Currently 'initial_setup' only; room for 'password_reset' later
    t.string('purpose', 30).notNullable();
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('consumed_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    t.index('user_id', 'idx_user_setup_tokens_user');
    t.index('expires_at', 'idx_user_setup_tokens_expires');

    t.check("purpose IN ('initial_setup', 'password_reset')", [], 'check_token_purpose');
  });
}

export async function down(knex) {
  await knex.schema.dropTable('user_setup_tokens');
}
