/**
 * Run Solo Founder Hub Migration - Step by Step
 * Creates tables one by one
 */

import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('🚀 Starting Solo Founder Hub Migration...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to Supabase via Transaction Pooler...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Enable UUID extension
    console.log('1️⃣ Enabling UUID extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('   ✅ Done\n');

    // 1. Morning Briefings
    console.log('2️⃣ Creating morning_briefings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS morning_briefings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        summary TEXT,
        priorities JSONB DEFAULT '[]'::jsonb,
        key_metrics JSONB DEFAULT '{}'::jsonb,
        pending_emails JSONB DEFAULT '[]'::jsonb,
        pending_tasks JSONB DEFAULT '[]'::jsonb,
        content_queue JSONB DEFAULT '[]'::jsonb,
        decisions_needed JSONB DEFAULT '[]'::jsonb,
        ai_insights TEXT,
        motivation_quote TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        generated_by TEXT DEFAULT 'n8n',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ morning_briefings created\n');

    // 2. AI Agents
    console.log('3️⃣ Creating ai_agents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        description TEXT,
        avatar_url TEXT,
        status TEXT DEFAULT 'offline',
        last_active_at TIMESTAMPTZ,
        model TEXT DEFAULT 'gpt-4o-mini',
        temperature DECIMAL(2,1) DEFAULT 0.7,
        system_prompt TEXT,
        capabilities JSONB DEFAULT '[]'::jsonb,
        tasks_completed INTEGER DEFAULT 0,
        tasks_pending INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0,
        avg_response_time INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ ai_agents created\n');

    // 3. Agent Tasks
    console.log('4️⃣ Creating agent_tasks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        task_type TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        input_data JSONB DEFAULT '{}'::jsonb,
        output_data JSONB DEFAULT '{}'::jsonb,
        error_message TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        due_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ agent_tasks created\n');

    // 4. Agent Responses
    console.log('5️⃣ Creating agent_responses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_responses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
        agent_type TEXT NOT NULL,
        response JSONB NOT NULL,
        raw_response TEXT,
        status TEXT DEFAULT 'completed',
        tokens_used INTEGER,
        response_time_ms INTEGER,
        model_used TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ agent_responses created\n');

    // 5. Decision Queue
    console.log('6️⃣ Creating decision_queue table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS decision_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
        task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        decision_type TEXT NOT NULL,
        impact TEXT DEFAULT 'medium',
        urgency TEXT DEFAULT 'this_week',
        recommendation TEXT DEFAULT 'review',
        recommendation_reason TEXT,
        details JSONB DEFAULT '{}'::jsonb,
        attachments JSONB DEFAULT '[]'::jsonb,
        status TEXT DEFAULT 'pending',
        user_feedback TEXT,
        decided_at TIMESTAMPTZ,
        deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ decision_queue created\n');

    // 6. Agent Memory
    console.log('7️⃣ Creating agent_memory table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_memory (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        memory_type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        importance TEXT DEFAULT 'medium',
        source TEXT DEFAULT 'manual',
        source_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
        used_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMPTZ,
        linked_items UUID[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ agent_memory created\n');

    // 7. Agent Communications
    console.log('8️⃣ Creating agent_communications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_communications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        from_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
        to_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
        to_user BOOLEAN DEFAULT FALSE,
        message_type TEXT DEFAULT 'info',
        subject TEXT,
        content TEXT NOT NULL,
        related_task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ agent_communications created\n');

    // Create Indexes
    console.log('9️⃣ Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_briefings_user_date ON morning_briefings(user_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_agents_user ON ai_agents(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_agents_role ON ai_agents(role)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_user ON agent_tasks(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON agent_tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_decisions_user ON decision_queue(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_decisions_status ON decision_queue(status)',
      'CREATE INDEX IF NOT EXISTS idx_memory_user ON agent_memory(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_memory_type ON agent_memory(memory_type)',
      'CREATE INDEX IF NOT EXISTS idx_comms_user ON agent_communications(user_id)',
    ];
    for (const idx of indexes) {
      try {
        await client.query(idx);
      } catch (e) {}
    }
    console.log('   ✅ Indexes created\n');

    // Enable RLS
    console.log('🔟 Enabling RLS...');
    const tables = ['morning_briefings', 'ai_agents', 'agent_tasks', 'agent_responses', 'decision_queue', 'agent_memory', 'agent_communications'];
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      } catch (e) {}
    }
    console.log('   ✅ RLS enabled\n');

    // Create Views
    console.log('1️⃣1️⃣ Creating views...');
    try {
      await client.query(`
        CREATE OR REPLACE VIEW v_pending_decisions AS
        SELECT 
          user_id,
          COUNT(*) as total_pending,
          COUNT(*) FILTER (WHERE urgency = 'immediate') as immediate_count,
          COUNT(*) FILTER (WHERE urgency = 'today') as today_count,
          COUNT(*) FILTER (WHERE impact = 'high') as high_impact_count
        FROM decision_queue
        WHERE status = 'pending'
        GROUP BY user_id
      `);
      console.log('   ✅ v_pending_decisions view created\n');
    } catch (e) {
      console.log('   ⏭️ View already exists\n');
    }

    // Seed default agents
    console.log('1️⃣2️⃣ Seeding default AI agents...');
    const defaultAgents = [
      { name: 'Dev Agent', role: 'dev', description: 'Code, debug, review PRs', model: 'gpt-4o', temperature: 0.3, status: 'online' },
      { name: 'Content Agent', role: 'content', description: 'Write blogs, social, emails', model: 'gpt-4o', temperature: 0.7, status: 'online' },
      { name: 'Marketing Agent', role: 'marketing', description: 'Campaigns, analytics, SEO', model: 'gpt-4o-mini', temperature: 0.5, status: 'online' },
      { name: 'Sales Agent', role: 'sales', description: 'Outreach, follow-ups, leads', model: 'gpt-4o-mini', temperature: 0.6, status: 'offline' },
      { name: 'Admin Agent', role: 'admin', description: 'Scheduling, emails, tasks', model: 'gpt-4o-mini', temperature: 0.3, status: 'offline' },
      { name: 'Advisor Agent', role: 'advisor', description: 'Strategy, decisions, analysis', model: 'gpt-4o', temperature: 0.5, status: 'online' },
    ];

    for (const agent of defaultAgents) {
      try {
        await client.query(`
          INSERT INTO ai_agents (name, role, description, model, temperature, status, capabilities)
          VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb)
          ON CONFLICT DO NOTHING
        `, [agent.name, agent.role, agent.description, agent.model, agent.temperature, agent.status]);
        console.log(`   ✅ ${agent.name} created`);
      } catch (e) {
        console.log(`   ⏭️ ${agent.name} already exists`);
      }
    }

    // Verify
    console.log('\n📊 Verifying tables...');
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('morning_briefings', 'ai_agents', 'agent_tasks', 'decision_queue', 'agent_memory', 'agent_communications', 'agent_responses')
      ORDER BY table_name
    `);
    
    console.log('\n✅ Solo Hub Tables:');
    rows.forEach(row => console.log(`   ✓ ${row.table_name}`));

    // Check agents
    const { rows: agents } = await client.query('SELECT name, role, status FROM ai_agents ORDER BY role');
    console.log('\n🤖 AI Agents:');
    agents.forEach(a => console.log(`   ${a.status === 'online' ? '🟢' : '⚪'} ${a.name} (${a.role})`));

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Solo Founder Hub migration completed!');
    console.log('='.repeat(50));
    console.log('\n📍 Next steps:');
    console.log('   1. Open http://localhost:8081/admin/solo-hub');
    console.log('   2. Start chatting with AI agents!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
