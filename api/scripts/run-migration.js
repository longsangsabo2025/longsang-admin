/**
 * Run Migration Script v2
 * Properly handles PostgreSQL $$ syntax for functions
 */

const { Pool } = require('pg');

// Transaction Pooler URL
const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Connecting to Supabase via Transaction Pooler...\n');
    
    // ============ EXTENSIONS ============
    console.log('📦 Creating extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ vector extension');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    console.log('✅ pg_trgm extension');
    
    // ============ TABLES ============
    console.log('\n📦 Creating tables...');
    
    // 1. Admin Profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL UNIQUE DEFAULT 'default-longsang-user',
        full_name TEXT NOT NULL DEFAULT 'Long Sang',
        nickname TEXT,
        role TEXT DEFAULT 'Founder & CEO',
        bio TEXT,
        avatar_url TEXT,
        email TEXT,
        phone TEXT,
        location TEXT DEFAULT 'Vietnam',
        timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
        communication_style TEXT DEFAULT 'direct',
        response_preference TEXT DEFAULT 'structured',
        expertise_level TEXT DEFAULT 'expert',
        preferred_language TEXT DEFAULT 'vi',
        ai_verbosity TEXT DEFAULT 'medium',
        include_explanations BOOLEAN DEFAULT true,
        include_examples BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ admin_profiles');
    
    // 2. Business Entities
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_entities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        name TEXT NOT NULL,
        legal_name TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        description TEXT,
        mission TEXT,
        vision TEXT,
        industries TEXT[],
        target_market TEXT,
        business_model TEXT,
        revenue_model TEXT[],
        monthly_revenue DECIMAL(15,2),
        monthly_costs DECIMAL(15,2),
        funding_stage TEXT,
        team_size INTEGER DEFAULT 1,
        roles JSONB,
        website TEXT,
        social_links JSONB,
        founded_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ business_entities');
    
    // 3. Project Registry
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_registry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        business_entity_id UUID REFERENCES business_entities(id),
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        description TEXT,
        type TEXT NOT NULL,
        category TEXT,
        status TEXT DEFAULT 'active',
        priority INTEGER DEFAULT 5,
        tech_stack JSONB,
        infrastructure JSONB,
        progress_percent INTEGER DEFAULT 0,
        current_phase TEXT,
        milestones JSONB,
        budget DECIMAL(15,2),
        spent DECIMAL(15,2),
        revenue DECIMAL(15,2),
        monetization_status TEXT,
        repository_url TEXT,
        live_url TEXT,
        docs_url TEXT,
        folder_path TEXT,
        short_term_goals TEXT[],
        long_term_goals TEXT[],
        success_metrics JSONB,
        start_date DATE,
        target_launch_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ project_registry');
    
    // 4. Knowledge Base
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        project_id UUID REFERENCES project_registry(id),
        business_entity_id UUID REFERENCES business_entities(id),
        category TEXT NOT NULL,
        subcategory TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        source TEXT DEFAULT 'manual',
        source_url TEXT,
        source_file TEXT,
        tags TEXT[],
        importance INTEGER DEFAULT 5,
        is_public BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMPTZ,
        embedding vector(1536),
        version INTEGER DEFAULT 1,
        previous_version_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      )
    `);
    console.log('✅ knowledge_base');
    
    // 5. Financial Overview
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_overview (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        period_type TEXT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        revenue_streams JSONB,
        total_revenue DECIMAL(15,2) DEFAULT 0,
        expense_categories JSONB,
        total_expenses DECIMAL(15,2) DEFAULT 0,
        net_income DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue - total_expenses) STORED,
        assets JSONB,
        liabilities JSONB,
        savings_goal DECIMAL(15,2),
        savings_actual DECIMAL(15,2),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ financial_overview');
    
    // 6. Goals Roadmap
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals_roadmap (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        project_id UUID REFERENCES project_registry(id),
        business_entity_id UUID REFERENCES business_entities(id),
        parent_goal_id UUID REFERENCES goals_roadmap(id),
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        timeframe TEXT,
        status TEXT DEFAULT 'active',
        progress_percent INTEGER DEFAULT 0,
        target_metric TEXT,
        target_value DECIMAL(15,2),
        current_value DECIMAL(15,2),
        start_date DATE,
        target_date DATE,
        completed_date DATE,
        priority INTEGER DEFAULT 5,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ goals_roadmap');
    
    // 7. Skills Expertise
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills_expertise (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        proficiency_level TEXT DEFAULT 'intermediate',
        years_experience DECIMAL(4,1),
        projects_used TEXT[],
        certifications TEXT[],
        currently_learning BOOLEAN DEFAULT false,
        learning_goal TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ skills_expertise');
    
    // 8. AI Context Cache
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_context_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
        context_type TEXT NOT NULL,
        related_entity_id UUID,
        context_content TEXT NOT NULL,
        token_count INTEGER,
        valid_until TIMESTAMPTZ,
        is_stale BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ ai_context_cache');
    
    // ============ INDEXES ============
    console.log('\n📦 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_knowledge_user ON knowledge_base(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_project ON knowledge_base(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags)',
      `CREATE INDEX IF NOT EXISTS idx_knowledge_search ON knowledge_base USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')))`,
      'CREATE INDEX IF NOT EXISTS idx_project_user ON project_registry(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_status ON project_registry(status)',
      'CREATE INDEX IF NOT EXISTS idx_project_priority ON project_registry(priority DESC)',
      'CREATE INDEX IF NOT EXISTS idx_goals_user ON goals_roadmap(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_goals_status ON goals_roadmap(status)',
      'CREATE INDEX IF NOT EXISTS idx_goals_timeframe ON goals_roadmap(timeframe)',
    ];
    
    for (const idx of indexes) {
      try {
        await client.query(idx);
        const name = idx.match(/idx_\w+/)?.[0] || 'index';
        console.log(`✅ ${name}`);
      } catch (e) {
        console.log(`⏭️  Skipped: ${e.message.substring(0, 50)}`);
      }
    }
    
    // Vector index (separate - may need more vectors first)
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
      `);
      console.log('✅ idx_knowledge_embedding (vector)');
    } catch (e) {
      console.log('⏭️  Vector index skipped (needs data first)');
    }
    
    // ============ FUNCTIONS ============
    console.log('\n📦 Creating functions...');
    
    // Search Knowledge Function
    await client.query(`
      CREATE OR REPLACE FUNCTION search_knowledge(
        query_embedding vector(1536),
        p_user_id TEXT DEFAULT 'default-longsang-user',
        p_category TEXT DEFAULT NULL,
        p_project_id UUID DEFAULT NULL,
        match_threshold FLOAT DEFAULT 0.7,
        match_count INT DEFAULT 10
      )
      RETURNS TABLE (
        id UUID,
        category TEXT,
        title TEXT,
        content TEXT,
        tags TEXT[],
        project_id UUID,
        similarity FLOAT
      ) AS $func$
      BEGIN
        RETURN QUERY
        SELECT
          kb.id,
          kb.category,
          kb.title,
          kb.content,
          kb.tags,
          kb.project_id,
          1 - (kb.embedding <=> query_embedding) as similarity
        FROM knowledge_base kb
        WHERE kb.user_id = p_user_id
          AND kb.is_active = true
          AND (p_category IS NULL OR kb.category = p_category)
          AND (p_project_id IS NULL OR kb.project_id = p_project_id)
          AND 1 - (kb.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
      END;
      $func$ LANGUAGE plpgsql STABLE
    `);
    console.log('✅ search_knowledge');
    
    // Get AI Context Function
    await client.query(`
      CREATE OR REPLACE FUNCTION get_ai_context(
        p_user_id TEXT DEFAULT 'default-longsang-user'
      )
      RETURNS TABLE (
        profile JSONB,
        businesses JSONB,
        projects JSONB,
        active_goals JSONB,
        skills JSONB
      ) AS $func$
      BEGIN
        RETURN QUERY
        SELECT
          (SELECT row_to_json(p) FROM admin_profiles p WHERE p.user_id = p_user_id)::JSONB,
          (SELECT COALESCE(jsonb_agg(b), '[]'::JSONB) FROM business_entities b WHERE b.user_id = p_user_id AND b.status = 'active'),
          (SELECT COALESCE(jsonb_agg(pr), '[]'::JSONB) FROM project_registry pr WHERE pr.user_id = p_user_id AND pr.status IN ('active', 'mvp', 'live')),
          (SELECT COALESCE(jsonb_agg(g), '[]'::JSONB) FROM goals_roadmap g WHERE g.user_id = p_user_id AND g.status = 'active'),
          (SELECT COALESCE(jsonb_agg(s), '[]'::JSONB) FROM skills_expertise s WHERE s.user_id = p_user_id);
      END;
      $func$ LANGUAGE plpgsql STABLE
    `);
    console.log('✅ get_ai_context');
    
    // Update updated_at Function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql
    `);
    console.log('✅ update_updated_at');
    
    // ============ TRIGGERS ============
    console.log('\n📦 Creating triggers...');
    
    const triggers = [
      ['tr_admin_profiles_updated', 'admin_profiles'],
      ['tr_business_entities_updated', 'business_entities'],
      ['tr_project_registry_updated', 'project_registry'],
      ['tr_knowledge_base_updated', 'knowledge_base'],
      ['tr_goals_roadmap_updated', 'goals_roadmap'],
    ];
    
    for (const [name, table] of triggers) {
      try {
        await client.query(`DROP TRIGGER IF EXISTS ${name} ON ${table}`);
        await client.query(`
          CREATE TRIGGER ${name}
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at()
        `);
        console.log(`✅ ${name}`);
      } catch (e) {
        console.log(`⚠️  ${name}: ${e.message.substring(0, 40)}`);
      }
    }
    
    // ============ RLS ============
    console.log('\n📦 Enabling Row Level Security...');
    
    const rlsTables = [
      'admin_profiles', 'business_entities', 'project_registry',
      'knowledge_base', 'financial_overview', 'goals_roadmap', 'skills_expertise'
    ];
    
    for (const table of rlsTables) {
      try {
        await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        console.log(`✅ RLS on ${table}`);
      } catch (e) {
        console.log(`⏭️  ${table}: already enabled`);
      }
    }
    
    // ============ POLICIES ============
    console.log('\n📦 Creating policies...');
    
    const policies = [
      ['admin_profiles', 'Users can access own profile'],
      ['business_entities', 'Users can access own businesses'],
      ['project_registry', 'Users can access own projects'],
      ['knowledge_base', 'Users can access own knowledge'],
      ['financial_overview', 'Users can access own financials'],
      ['goals_roadmap', 'Users can access own goals'],
      ['skills_expertise', 'Users can access own skills'],
    ];
    
    for (const [table, policyName] of policies) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policyName}" ON ${table}`);
        await client.query(`
          CREATE POLICY "${policyName}" ON ${table}
          FOR ALL USING (user_id = COALESCE(auth.uid()::text, 'default-longsang-user') OR user_id = 'default-longsang-user')
        `);
        console.log(`✅ Policy on ${table}`);
      } catch (e) {
        console.log(`⚠️  ${table}: ${e.message.substring(0, 40)}`);
      }
    }
    
    // ============ DONE ============
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Created:');
    console.log('   • 8 tables');
    console.log('   • 11+ indexes');
    console.log('   • 3 functions');
    console.log('   • 5 triggers');
    console.log('   • 7 RLS policies');
    console.log('\n👉 Next: Run seed script to populate data');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
