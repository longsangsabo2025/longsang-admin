import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.diexsbzqwsbpilsymnfb',
  password: 'Acookingoil123',
  ssl: { rejectUnauthorized: false }
});

const client = await pool.connect();

// List all brain tables
const tablesRes = await client.query(
  `SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'brain_%'
   ORDER BY table_name`
);
console.log('=== Brain Tables (Phase 1-6) ===');
tablesRes.rows.forEach((r, i) => console.log(`${i+1}. ${r.table_name}`));
console.log(`\nTotal: ${tablesRes.rows.length} tables`);

client.release();
await pool.end();
