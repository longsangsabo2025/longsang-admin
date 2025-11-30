const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function createView() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create view project_workflows as alias to project_workflow_instances
    const sql = `
      -- Drop existing view if any
      DROP VIEW IF EXISTS project_workflows CASCADE;
      
      -- Create view as alias
      CREATE VIEW project_workflows AS 
      SELECT * FROM project_workflow_instances;
      
      -- Grant permissions for Supabase
      GRANT SELECT, INSERT, UPDATE, DELETE ON project_workflows TO anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON project_workflows TO authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON project_workflows TO service_role;
      
      -- Notify PostgREST to reload schema cache
      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(sql);
    console.log('✅ Created VIEW project_workflows -> project_workflow_instances');
    
    // Verify
    const { rows } = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('project_workflows', 'project_workflow_instances')
    `);
    console.log('\n📋 Verification:');
    rows.forEach(r => console.log(`  - ${r.table_name}: ${r.table_type}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createView();
