import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const globalPool = globalThis as unknown as { qualityMotorsPool?: Pool };
export const pool =
  globalPool.qualityMotorsPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
if (process.env.NODE_ENV !== 'production') globalPool.qualityMotorsPool = pool;

export async function asUser<T>(userId: string, work: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('set local role quality_motors_app');
    await client.query("select set_config('app.user_id',$1,true)", [userId]);
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function rows<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  values: unknown[] = [],
) {
  return (await client.query<T>(text, values)).rows;
}

export async function mutate(userId: string, action: string, payload: Record<string, unknown>) {
  return asUser(userId, async (client) => {
    const result = await client.query<{ data: Record<string, unknown> }>(
      'select public.app_mutate($1,$2::jsonb) data',
      [action, JSON.stringify(payload)],
    );
    return result.rows[0]?.data ?? {};
  });
}
