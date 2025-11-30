/**
 * Run SQL Migration via PostgreSQL Direct Connection
 * Using Transaction Pooler
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const migrations = [
  // Add missing columns to projects table
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(100)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📁'`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS color VARCHAR(100) DEFAULT 'from-blue-500 to-indigo-600'`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS local_url VARCHAR(500)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS production_url VARCHAR(500)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)`,
  
  // Update existing projects with slugs based on name
  `UPDATE projects SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL`,
  
  // Create index on slug
  `CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)`,
];

async function runMigrations() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const shortSql = sql.substring(0, 60).replace(/\n/g, ' ') + '...';
      
      try {
        await client.query(sql);
        console.log(`✅ [${i + 1}/${migrations.length}] ${shortSql}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  [${i + 1}/${migrations.length}] Already exists - ${shortSql}`);
        } else {
          console.log(`❌ [${i + 1}/${migrations.length}] Error: ${err.message}`);
        }
      }
    }
    
    // Verify columns
    console.log('\n📊 Verifying columns...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nProjects table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n🎉 Migration completed!');
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
