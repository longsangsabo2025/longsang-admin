import pg from 'pg';
import { readFileSync, existsSync } from 'fs';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    // Step 1: Run base academy migration (creates courses, instructors, etc.)
    console.log('🚀 Step 1: Running base Academy migration...');
    const baseSql = readFileSync('supabase/migrations/20250100_academy_base.sql', 'utf8');
    await client.query(baseSql);
    console.log('✅ Base tables created!');
    
    // Step 2: Run complete academy migration (adds quizzes, assignments, etc.)
    console.log('🚀 Step 2: Running complete Academy migration...');
    const completeSql = readFileSync('supabase/migrations/20250101_academy_complete_system.sql', 'utf8');
    await client.query(completeSql);
    console.log('✅ Complete system created!');
    
    // Verify
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'course_%' OR table_name LIKE 'quiz_%' OR table_name LIKE 'learning_%' OR table_name LIKE 'discussion_%' OR table_name LIKE 'qa_%' OR table_name LIKE 'study_%' OR table_name LIKE 'student_%')
      ORDER BY table_name
    `);
    
    console.log('📊 Academy tables created:', result.rows.length);
    result.rows.forEach(r => console.log('   ✅', r.table_name));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
