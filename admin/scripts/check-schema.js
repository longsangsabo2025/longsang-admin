import { Client } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Check workflows columns
  console.log('brain_workflows columns:');
  const wf = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'brain_workflows' 
    ORDER BY ordinal_position
  `);
  wf.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

  // Check notifications columns
  console.log('\nbrain_notifications columns:');
  const nf = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'brain_notifications' 
    ORDER BY ordinal_position
  `);
  nf.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

  // Check functions
  console.log('\nBrain functions:');
  const fn = await client.query(`
    SELECT routine_name, data_type as return_type
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%search%' OR routine_name LIKE '%graph%' OR routine_name LIKE '%domain%')
    ORDER BY routine_name
  `);
  fn.rows.forEach(r => console.log('  -', r.routine_name, '->', r.return_type));

  await client.end();
}

main().catch(e => { console.error(e); client.end(); });
