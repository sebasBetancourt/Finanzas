import { Pool, type PoolConfig } from 'pg';
import 'dotenv/config';

function buildPoolConfig(): PoolConfig {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null;

  if (connectionString) {
    const needsSsl =
      process.env.PGSSL !== 'false' &&
      (/neon\.tech|render\.com|supabase|amazonaws|sslmode=require/i.test(connectionString) ||
        process.env.NODE_ENV === 'production' ||
        process.env.PGSSL === 'true');

    console.log('[DB] Using DATABASE_URL connection');
    return {
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    };
  }

  const host = process.env.PG_HOST;
  if (!host) {
    throw new Error(
      '[DB] Falta DATABASE_URL (Neon/Render) o PG_HOST. ' +
        'En Render → Environment agrega DATABASE_URL con el connection string de Neon.'
    );
  }

  console.log(`[DB] Using PG_HOST=${host}`);
  return {
    host,
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

export default pool;
