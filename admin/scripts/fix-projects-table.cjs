/**
 * Fix and complete tables setup
 */

require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function fixTables() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔗 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check current columns
    console.log('📋 Checking projects table...');
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'projects'
    `);
    console.log('Current columns:', cols.rows.map(r => r.column_name).join(', '));

    // Add missing columns
    console.log('\n📝 Adding missing columns...');
    
    const alterQueries = [
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS name TEXT`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6'`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS website_url TEXT`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`,
      `ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`  ✓ ${query.substring(0, 60)}...`);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.log(`  ⚠️ ${err.message}`);
        }
      }
    }

    // Verify
    console.log('\n📋 Final columns:');
    const finalCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `);
    for (const col of finalCols.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixTables();
