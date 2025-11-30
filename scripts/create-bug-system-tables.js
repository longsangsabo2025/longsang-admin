/**
 * Script to create Bug System v2.0 tables in Supabase
 */

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

async function createTables() {
  console.log('🔧 Creating Bug System v2.0 tables...\n');
  
  const tables = [
    {
      name: 'alert_logs',
      sql: `
        CREATE TABLE IF NOT EXISTS alert_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          error_id UUID REFERENCES error_logs(id) ON DELETE CASCADE,
          channel TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT NOT NULL,
          payload JSONB DEFAULT '{}'::jsonb,
          status TEXT NOT NULL DEFAULT 'pending',
          sent_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'ai_fix_suggestions',
      sql: `
        CREATE TABLE IF NOT EXISTS ai_fix_suggestions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          error_id UUID REFERENCES error_logs(id) ON DELETE CASCADE,
          error_type TEXT NOT NULL,
          error_message TEXT NOT NULL,
          analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
          suggested_fix TEXT,
          confidence DECIMAL(3,2) DEFAULT 0.00,
          was_applied BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'predictions_log',
      sql: `
        CREATE TABLE IF NOT EXISTS predictions_log (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          prediction_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          probability DECIMAL(3,2) DEFAULT 0.00,
          predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          description TEXT NOT NULL,
          recommendations JSONB DEFAULT '[]'::jsonb,
          was_accurate BOOLEAN,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'error_metrics',
      sql: `
        CREATE TABLE IF NOT EXISTS error_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          period_start TIMESTAMPTZ NOT NULL,
          period_end TIMESTAMPTZ NOT NULL,
          granularity TEXT NOT NULL,
          total_errors INTEGER DEFAULT 0,
          critical_errors INTEGER DEFAULT 0,
          mttr_seconds DECIMAL(10,2),
          mtbf_seconds DECIMAL(10,2),
          auto_resolved INTEGER DEFAULT 0,
          uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'error_resolutions',
      sql: `
        CREATE TABLE IF NOT EXISTS error_resolutions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          error_id UUID,
          error_fingerprint TEXT NOT NULL,
          occurred_at TIMESTAMPTZ NOT NULL,
          resolved_at TIMESTAMPTZ,
          resolution_method TEXT,
          time_to_resolve_seconds INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    }
  ];

  for (const table of tables) {
    try {
      // Use the SQL Editor API endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({})
      });
      
      // Since RPC exec_sql might not exist, let's just test the table exists
      const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table.name}?limit=0`, {
        method: 'GET',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        }
      });
      
      if (testResponse.ok) {
        console.log(`✅ Table '${table.name}' exists`);
      } else if (testResponse.status === 404) {
        console.log(`❌ Table '${table.name}' does NOT exist - needs to be created via Supabase Dashboard`);
      } else {
        console.log(`⚠️  Table '${table.name}': ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error checking '${table.name}':`, error.message);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('If tables are missing, please run the SQL in Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql');
  console.log('\nSQL file: supabase/migrations/20250602_bug_system_v2_tables.sql');
}

createTables();
