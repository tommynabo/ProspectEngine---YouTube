import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Get a client from the pool
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Execute a single query
 */
export async function query(
  text: string,
  params?: any[]
): Promise<any> {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Get a single row
 */
export async function getOne(
  text: string,
  params?: any[]
): Promise<any | null> {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * Get multiple rows
 */
export async function getAll(
  text: string,
  params?: any[]
): Promise<any[]> {
  const result = await query(text, params);
  return result.rows;
}

/**
 * Execute with transaction
 */
export async function transaction(
  callback: (client: PoolClient) => Promise<any>
): Promise<any> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
