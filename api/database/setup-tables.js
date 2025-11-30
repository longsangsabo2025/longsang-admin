/**
 * Create Database Tables for Solo Hub Foundation
 * Run: node api/database/setup-tables.js
 * 
 * Uses direct PostgreSQL connection to create tables
 */

const { Pool } = require('pg');

// Connection string from .env
const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  console.log('🗄️ Creating Solo Hub Foundation tables...\n');

  const client = await pool.connect();
  
  try {
    // 1. Scheduled Posts Table
    console.log('  Creating scheduled_posts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.scheduled_posts (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        scheduled_for TIMESTAMPTZ NOT NULL,
        status TEXT DEFAULT 'scheduled',
        post_type TEXT DEFAULT 'default',
        facebook_post_id TEXT,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ scheduled_posts created');

    // 2. A/B Tests Table
    console.log('  Creating ab_tests...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ab_tests (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        page_id TEXT NOT NULL,
        strategy TEXT DEFAULT 'headline',
        variants JSONB NOT NULL DEFAULT '[]',
        target_metric TEXT DEFAULT 'engagement',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        ends_at TIMESTAMPTZ,
        winner_variant_id TEXT,
        metrics JSONB DEFAULT '{}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ ab_tests created');

    // 3. Carousels Table
    console.log('  Creating carousels...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.carousels (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        page_id TEXT NOT NULL,
        type TEXT DEFAULT 'product_showcase',
        caption TEXT,
        slides JSONB NOT NULL DEFAULT '[]',
        theme TEXT,
        hashtags JSONB DEFAULT '[]',
        status TEXT DEFAULT 'draft',
        facebook_post_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ carousels created');

    // 4. Copilot Feedback Table
    console.log('  Creating copilot_feedback...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.copilot_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id TEXT,
        user_message TEXT NOT NULL,
        response_type TEXT,
        execution_time INTEGER,
        layers_used JSONB DEFAULT '[]',
        success BOOLEAN DEFAULT true,
        user_rating INTEGER,
        feedback_text TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ copilot_feedback created');

    // 5. Cross Platform Posts Table
    console.log('  Creating cross_platform_posts...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.cross_platform_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        original_content TEXT NOT NULL,
        page_id TEXT NOT NULL,
        platforms JSONB NOT NULL DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ cross_platform_posts created');

    // 6. AI Usage Table
    console.log('  Creating ai_usage...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ai_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service TEXT NOT NULL,
        model TEXT,
        tokens_used INTEGER DEFAULT 0,
        cost_estimate DECIMAL(10, 6) DEFAULT 0,
        request_type TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ ai_usage created');

    // 7. Content Performance Table
    console.log('  Creating content_performance...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.content_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id TEXT,
        platform TEXT NOT NULL,
        page_id TEXT NOT NULL,
        content_type TEXT DEFAULT 'post',
        ab_test_id TEXT,
        variant_id TEXT,
        impressions INTEGER DEFAULT 0,
        reach INTEGER DEFAULT 0,
        engagement INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        reactions INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✅ content_performance created');

    // 8. Platform Analytics Table
    console.log('  Creating platform_analytics...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.platform_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        page_id TEXT NOT NULL,
        date DATE NOT NULL,
        posts_count INTEGER DEFAULT 0,
        total_reach INTEGER DEFAULT 0,
        total_engagement INTEGER DEFAULT 0,
        total_clicks INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(platform, page_id, date)
      );
    `);
    console.log('  ✅ platform_analytics created');

    // Create indexes
    console.log('\n  Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time ON public.scheduled_posts(status, scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_copilot_feedback_created ON public.copilot_feedback(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_service_date ON public.ai_usage(service, created_at DESC);
    `);
    console.log('  ✅ indexes created');

    console.log('\n🎉 All 8 tables created successfully!');
    console.log('\n📊 Tables ready:');
    console.log('   • scheduled_posts');
    console.log('   • ab_tests');
    console.log('   • carousels');
    console.log('   • copilot_feedback');
    console.log('   • cross_platform_posts');
    console.log('   • ai_usage');
    console.log('   • content_performance');
    console.log('   • platform_analytics');

  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables().catch(console.error);
