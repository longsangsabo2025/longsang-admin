import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
});

async function check() {
  const result = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE 'course%' OR table_name LIKE 'instructor%' OR table_name LIKE 'lesson%' OR table_name LIKE 'quiz%' OR table_name LIKE 'learning%')
    ORDER BY table_name
  `);
  console.log('📊 Academy tables:', result.rows.length);
  result.rows.forEach(r => console.log('   ✅', r.table_name));
  await pool.end();
}

check();
