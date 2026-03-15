const { Client } = require('pg');

// PostgreSQL Transaction Pooler connection
const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function createProjectAgentsTable() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create project_agents junction table (Many-to-Many)
    const createTableSQL = `
      -- Drop if exists for clean slate
      DROP TABLE IF EXISTS project_agents CASCADE;
      
      -- Create junction table for Project <-> Agent relationship
      CREATE TABLE project_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
        
        -- Configuration per project
        is_enabled BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,  -- Lower = higher priority
        config_override JSONB DEFAULT '{}',  -- Project-specific agent config
        
        -- Scheduling
        schedule_cron TEXT,  -- e.g., "0 9 * * *" for 9am daily
        auto_trigger_events TEXT[],  -- ['new_contact', 'new_order', etc.]
        
        -- Stats per project
        total_runs INTEGER DEFAULT 0,
        successful_runs INTEGER DEFAULT 0,
        failed_runs INTEGER DEFAULT 0,
        last_run_at TIMESTAMPTZ,
        total_cost_usd DECIMAL(10,4) DEFAULT 0,
        
        -- Metadata
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_by UUID,
        
        -- Unique constraint: each agent can only be assigned once per project
        UNIQUE(project_id, agent_id)
      );

      -- Create indexes
      CREATE INDEX idx_project_agents_project ON project_agents(project_id);
      CREATE INDEX idx_project_agents_agent ON project_agents(agent_id);
      CREATE INDEX idx_project_agents_enabled ON project_agents(is_enabled);

      -- Enable RLS
      ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY;

      -- RLS Policies (allow all for now)
      CREATE POLICY "Allow all project_agents" ON project_agents FOR ALL USING (true);

      -- Trigger for updated_at
      CREATE OR REPLACE FUNCTION update_project_agents_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS project_agents_updated_at ON project_agents;
      CREATE TRIGGER project_agents_updated_at
        BEFORE UPDATE ON project_agents
        FOR EACH ROW
        EXECUTE FUNCTION update_project_agents_updated_at();

      -- Notify schema cache
      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(createTableSQL);
    console.log('✅ Created project_agents table');

    // Seed some sample assignments
    const seedSQL = `
      INSERT INTO project_agents (project_id, agent_id, is_enabled, priority, auto_trigger_events, notes)
      SELECT 
        p.id as project_id,
        a.id as agent_id,
        true as is_enabled,
        1 as priority,
        ARRAY['new_contact', 'form_submission'] as auto_trigger_events,
        'Auto-assigned by system' as notes
      FROM projects p
      CROSS JOIN ai_agents a
      WHERE p.slug IN ('longsang-admin', 'ainewbie-web', 'sabo-hub')
        AND a.type IN ('content_writer', 'lead_nurture', 'customer_support')
      ON CONFLICT (project_id, agent_id) DO NOTHING;
    `;

    const seedResult = await client.query(seedSQL);
    console.log(`✅ Seeded ${seedResult.rowCount || 0} project-agent assignments`);

    // Verify
    const verifyResult = await client.query(`
      SELECT 
        pa.id,
        p.name as project_name,
        a.name as agent_name,
        a.type as agent_type,
        pa.is_enabled,
        pa.priority
      FROM project_agents pa
      JOIN projects p ON p.id = pa.project_id
      JOIN ai_agents a ON a.id = pa.agent_id
      ORDER BY p.name, pa.priority;
    `);

    console.log('\n📊 Project-Agent Assignments:');
    console.table(verifyResult.rows);

    console.log('\n✅ Done! Table project_agents created successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createProjectAgentsTable();
