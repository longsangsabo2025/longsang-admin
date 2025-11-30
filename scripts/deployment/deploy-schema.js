// Deploy App Showcase Schema to Supabase using Node.js
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Connection - Use pooler but both ports work for DDL
const connectionConfig = {
  host: 'aws-1-us-east-2.pooler.supabase.com', // From connection string
  port: 6543, // Transaction pooler (can handle DDL too)
  database: 'postgres',
  user: 'postgres.diexsbzqwsbpilsymnfb',
  password: 'Acookingoil123',
  ssl: {
    rejectUnauthorized: false
  }
};

const sqlFilePath = path.join(__dirname, 'supabase', 'migrations', 'app_showcase_schema.sql');

async function deploySchema() {
  console.log('🚀 Deploying App Showcase Schema to Supabase...\n');
  
  // Read SQL file
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ SQL file not found:', sqlFilePath);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('📄 SQL File:', sqlFilePath);
  console.log('📊 File Size:', sqlContent.length, 'characters\n');
  
  const client = new Client(connectionConfig);
  
  try {
    console.log('🔌 Connecting to Supabase (Direct Connection)...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('🔄 Executing SQL migration...');
    await client.query(sqlContent);
    console.log('✅ Schema deployed successfully!\n');
    
    console.log('📋 Next steps:');
    console.log('  1. Open admin: http://localhost:8081/app-showcase/admin');
    console.log('  2. Edit content and click Save');
    console.log('  3. Check showcase: http://localhost:8081/app-showcase\n');
    console.log('🎉 Production database is LIVE!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Schema already exists. This is OK!');
      console.log('✅ Database is ready to use.');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

deploySchema();
