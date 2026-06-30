import { Pool, types } from 'pg';

// pg v8 parses DATE columns as JS Date objects by default, which NestJS then
// serializes to ISO strings ("YYYY-MM-DDTHH:MM:SSZ") breaking YYYY-MM-DD parsing on the FE.
// Setting OID 1082 to a pass-through keeps them as plain "YYYY-MM-DD" strings.
types.setTypeParser(1082, (val) => val);

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
