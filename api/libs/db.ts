import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

export default pool;
