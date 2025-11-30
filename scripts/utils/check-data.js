// Check SABO Arena data in Supabase
import pkg from 'pg';
const { Client } = pkg;

const connectionConfig = {
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.diexsbzqwsbpilsymnfb',
  password: 'Acookingoil123',
  ssl: { rejectUnauthorized: false }
};

async function checkData() {
  const client = new Client(connectionConfig);
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        app_name, 
        jsonb_array_length(features) as feature_count,
        features
      FROM app_showcase 
      WHERE app_id = 'sabo-arena'
    `);
    
    if (result.rows.length > 0) {
      console.log('📊 SABO Arena Data:');
      console.log('App Name:', result.rows[0].app_name);
      console.log('Feature Count:', result.rows[0].feature_count);
      console.log('\n📝 Features:');
      
      const features = result.rows[0].features;
      features.forEach((f, i) => {
        console.log(`\n${i + 1}. ${f.title}`);
        console.log(`   Icon: ${f.icon}`);
        console.log(`   Description: ${f.description.substring(0, 80)}...`);
      });
    } else {
      console.log('❌ No data found for SABO Arena');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
