const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  
  console.log('📋 Projects Schema:');
  const schema = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position`);
  console.table(schema.rows);
  
  console.log('\n📋 Sample Project Data:');
  const data = await client.query(`SELECT * FROM projects LIMIT 1`);
  console.log(JSON.stringify(data.rows[0], null, 2));
  
  await client.end();
}
check();
