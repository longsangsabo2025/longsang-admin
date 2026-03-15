/**
 * Run migration for projects tables
 * Uses PostgreSQL transaction pooler
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251126_create_projects_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...\n');
    
    // Split and run statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement + ';');
          // Show first 50 chars of statement
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.log(`  ✓ ${preview}...`);
        } catch (err) {
          // Skip "already exists" errors
          if (err.message.includes('already exists')) {
            console.log(`  ⚠️ Already exists, skipping...`);
          } else {
            console.error(`  ❌ Error: ${err.message}`);
          }
        }
      }
    }

    console.log('\n✅ Migration completed!');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'project_social_accounts', 'project_posts')
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
