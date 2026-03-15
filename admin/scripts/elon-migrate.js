/**
 * 🚀 ELON MODE: Auto-migrate database
 * Add project_id to tables for proper filtering
 */
import 'dotenv/config';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

async function migrate() {
  console.log('🚀 ELON MODE: Running migrations...\n');
  
  const client = new pg.Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase via Transaction Pooler\n');
    
    // 1. Add project_id to content_queue
    console.log('📦 Adding project_id to content_queue...');
    try {
      await client.query(`ALTER TABLE content_queue ADD COLUMN project_id UUID`);
      console.log('   ✅ Added project_id column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('   ⏭️ Column already exists');
      } else {
        console.log('   ⚠️', e.message);
      }
    }
    
    // 2. Add project_id to workflow_executions
    console.log('📦 Adding project_id to workflow_executions...');
    try {
      await client.query(`ALTER TABLE workflow_executions ADD COLUMN project_id UUID`);
      console.log('   ✅ Added project_id column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('   ⏭️ Column already exists');
      } else {
        console.log('   ⚠️', e.message);
      }
    }
    
    // 3. Create indexes
    console.log('🔍 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_content_queue_project_id ON content_queue(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_content_queue_project_scheduled ON content_queue(project_id, scheduled_for)',
      'CREATE INDEX IF NOT EXISTS idx_workflow_executions_project_id ON workflow_executions(project_id)',
    ];
    
    for (const idx of indexes) {
      try {
        await client.query(idx);
        console.log('   ✅', idx.split(' ON ')[0].replace('CREATE INDEX IF NOT EXISTS ', ''));
      } catch (e) {
        console.log('   ⚠️', e.message);
      }
    }
    
    // 4. Verify
    console.log('\n📊 Verifying columns...');
    const verify = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'project_id' 
      AND table_name IN ('content_queue', 'workflow_executions')
    `);
    
    for (const row of verify.rows) {
      console.log(`   ✅ ${row.table_name}.${row.column_name} exists`);
    }
    
    console.log('\n🎉 Migration complete! Ship it! 🚀');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
