/**
 * Re-enable RLS on all tables (if needed later)
 * Run: node scripts/enable-rls.cjs
 */
require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  
  const res = await c.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  
  console.log('📋 Enabling RLS on ALL tables...\n');
  
  for (const row of res.rows) {
    try {
      await c.query(`ALTER TABLE public."${row.tablename}" ENABLE ROW LEVEL SECURITY`);
      console.log('✅', row.tablename);
    } catch (e) {
      console.log('⚠️', row.tablename, '-', e.message.split('\n')[0]);
    }
  }
  
  console.log('\n🎉 DONE! RLS re-enabled. You need to recreate policies manually.');
  await c.end();
  process.exit(0);
})();
