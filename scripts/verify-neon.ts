import pg from 'pg';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL.');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const schema = await client.query(`
    select to_regclass('public.workshops')::text as schema,
      (select count(*)::int from pg_policies where schemaname in ('public','private')) as policies,
      (select count(*)::int from pg_class
       where relrowsecurity and relnamespace in ('public'::regnamespace,'private'::regnamespace)) as rls_tables
  `);
    await client.query('begin');
    await client.query('set local role quality_motors_app');
    await client.query("select set_config('app.user_id',$1,true)", [
      '00000000-0000-0000-0000-000000000001',
    ]);
    const visible = await client.query(
      'select count(*)::int as visible_workshops from public.workshops',
    );
    await client.query('rollback');
    console.log(JSON.stringify({ schema: schema.rows[0], rls: visible.rows[0] }));
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
