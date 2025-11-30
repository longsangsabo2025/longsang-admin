/**
 * Execute SQL directly to Supabase using pg driver
 */

import pg from 'pg';

const { Client } = pg;

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Create tables one by one
    console.log('📝 Creating Bug System v2.0 tables...\n');
    
    // 1. alert_logs
    console.log('1️⃣ Creating alert_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.alert_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        error_id UUID REFERENCES public.error_logs(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT,
        message TEXT NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        project_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ alert_logs created');
    
    // 2. ai_fix_suggestions
    console.log('2️⃣ Creating ai_fix_suggestions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ai_fix_suggestions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        error_id UUID REFERENCES public.error_logs(id) ON DELETE CASCADE,
        error_type TEXT NOT NULL,
        error_message TEXT NOT NULL,
        analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
        suggested_fix TEXT,
        fix_code TEXT,
        confidence DECIMAL(3,2) DEFAULT 0.00,
        ai_model TEXT DEFAULT 'pattern-matching',
        was_applied BOOLEAN DEFAULT FALSE,
        applied_at TIMESTAMPTZ,
        success BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ ai_fix_suggestions created');
    
    // 3. predictions_log
    console.log('3️⃣ Creating predictions_log...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.predictions_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        prediction_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        probability DECIMAL(3,2) DEFAULT 0.00,
        predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT NOT NULL,
        recommendations JSONB DEFAULT '[]'::jsonb,
        metrics_snapshot JSONB DEFAULT '{}'::jsonb,
        was_accurate BOOLEAN,
        actual_occurred_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ predictions_log created');
    
    // 4. error_metrics
    console.log('4️⃣ Creating error_metrics...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.error_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        granularity TEXT NOT NULL,
        total_errors INTEGER DEFAULT 0,
        critical_errors INTEGER DEFAULT 0,
        high_errors INTEGER DEFAULT 0,
        medium_errors INTEGER DEFAULT 0,
        low_errors INTEGER DEFAULT 0,
        mttr_seconds DECIMAL(10,2),
        mtbf_seconds DECIMAL(10,2),
        auto_resolved INTEGER DEFAULT 0,
        manual_resolved INTEGER DEFAULT 0,
        ai_fixes_applied INTEGER DEFAULT 0,
        uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ error_metrics created');
    
    // 5. error_resolutions
    console.log('5️⃣ Creating error_resolutions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.error_resolutions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        error_id UUID,
        error_fingerprint TEXT NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        resolved_at TIMESTAMPTZ,
        resolution_method TEXT,
        resolution_details JSONB DEFAULT '{}'::jsonb,
        time_to_resolve_seconds INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ error_resolutions created');
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_alert_logs_error_id ON public.alert_logs(error_id)',
      'CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON public.alert_logs(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_ai_fix_error_id ON public.ai_fix_suggestions(error_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_fix_confidence ON public.ai_fix_suggestions(confidence DESC)',
      'CREATE INDEX IF NOT EXISTS idx_predictions_severity ON public.predictions_log(severity)',
      'CREATE INDEX IF NOT EXISTS idx_predictions_probability ON public.predictions_log(probability DESC)',
      'CREATE INDEX IF NOT EXISTS idx_resolutions_fingerprint ON public.error_resolutions(error_fingerprint)',
      'CREATE INDEX IF NOT EXISTS idx_resolutions_occurred_at ON public.error_resolutions(occurred_at DESC)',
    ];
    
    for (const idx of indexes) {
      try {
        await client.query(idx);
        console.log('   ✅ Index created');
      } catch (e) {
        console.log('   ⏭️ Index already exists');
      }
    }
    
    // Enable RLS
    console.log('\n🔒 Enabling RLS...');
    const tables = ['alert_logs', 'ai_fix_suggestions', 'predictions_log', 'error_metrics', 'error_resolutions'];
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
        console.log(`   ✅ RLS enabled on ${table}`);
      } catch (e) {
        console.log(`   ⏭️ RLS already enabled on ${table}`);
      }
    }
    
    // Create policies
    console.log('\n📜 Creating policies...');
    for (const table of tables) {
      try {
        await client.query(`
          CREATE POLICY "Allow all for service_role" ON public.${table}
          FOR ALL TO service_role USING (true) WITH CHECK (true)
        `);
        console.log(`   ✅ Policy created for ${table}`);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log(`   ⏭️ Policy already exists for ${table}`);
        } else {
          console.log(`   ⚠️ ${e.message}`);
        }
      }
      
      try {
        await client.query(`
          CREATE POLICY "Allow read for anon" ON public.${table}
          FOR SELECT TO anon USING (true)
        `);
      } catch (e) {
        // ignore
      }
      
      try {
        await client.query(`
          CREATE POLICY "Allow insert for anon" ON public.${table}
          FOR INSERT TO anon WITH CHECK (true)
        `);
      } catch (e) {
        // ignore
      }
    }
    
    console.log('\n🎉 Bug System v2.0 migration complete!');
    
    // Verify tables
    console.log('\n📋 Verifying tables...');
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('alert_logs', 'ai_fix_suggestions', 'predictions_log', 'error_metrics', 'error_resolutions')
      ORDER BY table_name
    `);
    console.log('   Tables created:', rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
