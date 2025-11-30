const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const result = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_agents' ORDER BY ordinal_position");
  console.table(result.rows);
  await client.end();
}
check();
