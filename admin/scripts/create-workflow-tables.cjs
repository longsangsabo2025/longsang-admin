const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function createWorkflowTables() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // =====================================================
    // 1. WORKFLOW TEMPLATES - Master templates
    // =====================================================
    const createTemplatesSQL = `
      DROP TABLE IF EXISTS project_workflow_instances CASCADE;
      DROP TABLE IF EXISTS workflow_templates CASCADE;
      
      -- Master workflow templates
      CREATE TABLE workflow_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Basic info
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        icon VARCHAR(10) DEFAULT '⚙️',
        
        -- n8n reference (template workflow in n8n)
        n8n_template_id VARCHAR(100),
        n8n_template_json JSONB,  -- Store the full workflow JSON
        
        -- Configuration schema
        config_schema JSONB DEFAULT '{}',  -- JSON Schema for required configs
        default_config JSONB DEFAULT '{}',  -- Default values
        
        -- Required credentials types
        required_credentials TEXT[] DEFAULT '{}',  -- ['openai', 'supabase', etc.]
        
        -- Metadata
        version VARCHAR(20) DEFAULT '1.0.0',
        status VARCHAR(20) DEFAULT 'active',  -- active, deprecated, draft
        is_public BOOLEAN DEFAULT true,
        
        -- Stats
        clone_count INTEGER DEFAULT 0,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID
      );

      -- Indexes
      CREATE INDEX idx_workflow_templates_slug ON workflow_templates(slug);
      CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
      CREATE INDEX idx_workflow_templates_status ON workflow_templates(status);

      -- RLS
      ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow all workflow_templates" ON workflow_templates FOR ALL USING (true);
    `;

    await client.query(createTemplatesSQL);
    console.log('✅ Created workflow_templates table');

    // =====================================================
    // 2. PROJECT WORKFLOW INSTANCES - Cloned per project
    // =====================================================
    const createInstancesSQL = `
      -- Workflow instances cloned for each project
      CREATE TABLE project_workflow_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- References
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
        
        -- Instance info
        name VARCHAR(255) NOT NULL,  -- e.g., "LongSang Content Writer"
        description TEXT,
        
        -- n8n reference (actual running workflow)
        n8n_workflow_id VARCHAR(100),  -- ID in n8n after import
        n8n_workflow_json JSONB,       -- Customized workflow JSON
        webhook_url TEXT,              -- Webhook URL for this instance
        
        -- Project-specific config (overrides template defaults)
        config JSONB DEFAULT '{}',
        
        -- Credential mappings: which project credential to use for each type
        -- e.g., { "openai": "cred-uuid-1", "supabase": "cred-uuid-2" }
        credential_mappings JSONB DEFAULT '{}',
        
        -- Scheduling
        is_enabled BOOLEAN DEFAULT true,
        schedule_cron TEXT,
        auto_trigger_events TEXT[],
        
        -- Stats
        total_executions INTEGER DEFAULT 0,
        successful_executions INTEGER DEFAULT 0,
        failed_executions INTEGER DEFAULT 0,
        last_execution_at TIMESTAMPTZ,
        last_execution_status VARCHAR(20),
        average_execution_time_ms INTEGER,
        total_cost_usd DECIMAL(10,4) DEFAULT 0,
        
        -- Metadata
        status VARCHAR(20) DEFAULT 'active',  -- active, paused, error, draft
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        
        -- Unique: each project can only have one instance of each template
        UNIQUE(project_id, template_id)
      );

      -- Indexes
      CREATE INDEX idx_pwi_project ON project_workflow_instances(project_id);
      CREATE INDEX idx_pwi_template ON project_workflow_instances(template_id);
      CREATE INDEX idx_pwi_status ON project_workflow_instances(status);
      CREATE INDEX idx_pwi_enabled ON project_workflow_instances(is_enabled);

      -- RLS
      ALTER TABLE project_workflow_instances ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow all project_workflow_instances" ON project_workflow_instances FOR ALL USING (true);

      -- Trigger for updated_at
      CREATE OR REPLACE FUNCTION update_pwi_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS pwi_updated_at ON project_workflow_instances;
      CREATE TRIGGER pwi_updated_at
        BEFORE UPDATE ON project_workflow_instances
        FOR EACH ROW
        EXECUTE FUNCTION update_pwi_updated_at();

      -- Notify schema cache
      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(createInstancesSQL);
    console.log('✅ Created project_workflow_instances table');

    // =====================================================
    // 3. SEED WORKFLOW TEMPLATES
    // =====================================================
    const seedTemplatesSQL = `
      INSERT INTO workflow_templates (name, slug, description, category, icon, required_credentials, config_schema, default_config)
      VALUES 
        (
          'Content Writer Agent',
          'content-writer',
          'Tự động viết blog posts, articles từ topic. Sử dụng AI để research, outline và viết nội dung chất lượng cao.',
          'content',
          '✍️',
          ARRAY['openai'],
          '{"type": "object", "properties": {"topic": {"type": "string"}, "tone": {"type": "string", "enum": ["professional", "casual", "friendly"]}, "language": {"type": "string"}, "max_words": {"type": "integer"}}}',
          '{"tone": "professional", "language": "vietnamese", "max_words": 1500}'
        ),
        (
          'Lead Nurture Agent', 
          'lead-nurture',
          'Tự động gửi email follow-up cho leads mới. Cá nhân hóa dựa trên thông tin khách hàng.',
          'crm',
          '💌',
          ARRAY['openai', 'gmail'],
          '{"type": "object", "properties": {"delay_hours": {"type": "integer"}, "max_emails": {"type": "integer"}, "template_style": {"type": "string"}}}',
          '{"delay_hours": 2, "max_emails": 3, "template_style": "friendly"}'
        ),
        (
          'Social Media Poster',
          'social-poster',
          'Tự động tạo và đăng posts lên Facebook, LinkedIn, Twitter từ nội dung blog.',
          'marketing',
          '📱',
          ARRAY['openai', 'facebook', 'linkedin'],
          '{"type": "object", "properties": {"platforms": {"type": "array"}, "hashtags": {"type": "boolean"}, "schedule_time": {"type": "string"}}}',
          '{"platforms": ["facebook", "linkedin"], "hashtags": true}'
        ),
        (
          'Customer Support Bot',
          'support-bot',
          'Tự động trả lời câu hỏi khách hàng qua email và chat. Có khả năng escalate nếu cần.',
          'customer-service',
          '🎧',
          ARRAY['openai', 'gmail'],
          '{"type": "object", "properties": {"response_time": {"type": "string"}, "escalation_keywords": {"type": "array"}, "knowledge_base_id": {"type": "string"}}}',
          '{"response_time": "instant", "escalation_keywords": ["refund", "complaint", "urgent"]}'
        ),
        (
          'SEO Analyzer',
          'seo-analyzer',
          'Phân tích SEO cho website, đề xuất cải thiện, theo dõi rankings.',
          'analytics',
          '🔍',
          ARRAY['openai', 'google-search-console'],
          '{"type": "object", "properties": {"target_keywords": {"type": "array"}, "competitors": {"type": "array"}, "check_frequency": {"type": "string"}}}',
          '{"check_frequency": "weekly"}'
        ),
        (
          'Sora Video Generator',
          'sora-video',
          'Tạo video từ text prompts sử dụng OpenAI Sora, upload lên Google Drive.',
          'content',
          '🎬',
          ARRAY['openai', 'google-drive'],
          '{"type": "object", "properties": {"video_style": {"type": "string"}, "duration": {"type": "integer"}, "resolution": {"type": "string"}}}',
          '{"video_style": "cinematic", "duration": 10, "resolution": "1080p"}'
        )
      ON CONFLICT (slug) DO UPDATE SET
        description = EXCLUDED.description,
        config_schema = EXCLUDED.config_schema,
        default_config = EXCLUDED.default_config,
        updated_at = NOW();
    `;

    await client.query(seedTemplatesSQL);
    console.log('✅ Seeded 6 workflow templates');

    // =====================================================
    // 4. SEED SAMPLE INSTANCES FOR PROJECTS
    // =====================================================
    const seedInstancesSQL = `
      -- Clone Content Writer for LongSang Admin
      INSERT INTO project_workflow_instances (project_id, template_id, name, description, config, auto_trigger_events)
      SELECT 
        p.id,
        t.id,
        p.name || ' - ' || t.name,
        'Instance của ' || t.name || ' cho project ' || p.name,
        t.default_config,
        ARRAY['manual', 'new_contact']
      FROM projects p
      CROSS JOIN workflow_templates t
      WHERE p.slug IN ('longsang-admin', 'ainewbie-web', 'sabo-hub')
        AND t.slug IN ('content-writer', 'lead-nurture')
      ON CONFLICT (project_id, template_id) DO NOTHING;
    `;

    const instanceResult = await client.query(seedInstancesSQL);
    console.log(`✅ Created ${instanceResult.rowCount || 0} workflow instances`);

    // =====================================================
    // 5. VERIFY
    // =====================================================
    const verifyTemplates = await client.query(`
      SELECT slug, name, category, icon, array_length(required_credentials, 1) as cred_count
      FROM workflow_templates ORDER BY category, name;
    `);
    console.log('\n📋 Workflow Templates:');
    console.table(verifyTemplates.rows);

    const verifyInstances = await client.query(`
      SELECT 
        pwi.name as instance_name,
        p.name as project,
        t.slug as template,
        pwi.is_enabled,
        pwi.status
      FROM project_workflow_instances pwi
      JOIN projects p ON p.id = pwi.project_id
      JOIN workflow_templates t ON t.id = pwi.template_id
      ORDER BY p.name, t.name;
    `);
    console.log('\n🚀 Workflow Instances:');
    console.table(verifyInstances.rows);

    console.log('\n✅ Done! Workflow system ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createWorkflowTables();
