const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  
  console.log('📋 project_social_links Schema:');
  const schema = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_social_links' ORDER BY ordinal_position");
  console.table(schema.rows);
  
  if (schema.rows.length === 0) {
    console.log('\n⚠️ Table project_social_links does not exist! Creating...');
  }
  
  await client.end();
}
check();
