/**
 * Fix schema - Add missing columns to project tables
 * Run: node scripts/fix-project-schema.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixSchema() {
  console.log('🔧 Fixing project table schemas...\n');

  const migrations = [
    // project_domains
    `ALTER TABLE project_domains ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production'`,
    
    // project_social_links
    `ALTER TABLE project_social_links ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0`,
    `ALTER TABLE project_social_links ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false`,
    
    // project_analytics
    `ALTER TABLE project_analytics ADD COLUMN IF NOT EXISTS property_name TEXT`,
    `ALTER TABLE project_analytics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    
    // project_integrations
    `ALTER TABLE project_integrations ADD COLUMN IF NOT EXISTS integration_type TEXT DEFAULT 'other'`,
    `ALTER TABLE project_integrations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE project_integrations ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'`,
    `ALTER TABLE project_integrations ADD COLUMN IF NOT EXISTS notes TEXT`,
    
    // project_documents
    `ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS notes TEXT`,
  ];

  for (const sql of migrations) {
    console.log(`Running: ${sql.substring(0, 60)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // Try direct query
      const { error: error2 } = await supabase.from('_migrations').select('*').limit(0);
      console.log(`  ⚠️ Note: May need to run manually in Supabase SQL Editor`);
    } else {
      console.log(`  ✅ Success`);
    }
  }

  console.log('\n📝 If migrations failed, run these in Supabase SQL Editor:');
  console.log('');
  migrations.forEach(m => console.log(m + ';'));
}

fixSchema().catch(console.error);
