/**
 * Add project_name column to error_logs table
 */

import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function addColumn() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');

    // Check if column exists
    const { rows } = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'error_logs'
      AND column_name = 'project_name'
    `);

    if (rows.length > 0) {
      console.log('✅ Column project_name already exists');
    } else {
      console.log('📊 Adding project_name column...');
      await client.query(`
        ALTER TABLE public.error_logs
        ADD COLUMN IF NOT EXISTS project_name VARCHAR(100)
      `);
      console.log('✅ Column added successfully!');
    }

    // Add index for project_name
    console.log('\n📊 Adding index for project_name...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_error_logs_project_name
      ON public.error_logs(project_name)
      WHERE project_name IS NOT NULL
    `);
    console.log('✅ Index added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addColumn().catch(console.error);

