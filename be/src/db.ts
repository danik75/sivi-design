import { Pool } from 'pg';

// Simple PG pool helper used by the minimal user repository.
// Configure via PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE env vars.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'sivi_dev',
});

export default pool;
