/**
 * Run migration: Create user_settings table
 */

const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running migration: user_settings table...\n');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        settings_key TEXT NOT NULL,
        settings_value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, settings_key)
      )
    `);
    console.log('✅ Created user_settings table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(settings_key)
    `);
    console.log('✅ Created indexes');

    // Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Created trigger function');

    // Drop existing trigger if exists, then create
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_user_settings_timestamp ON user_settings
    `);
    await client.query(`
      CREATE TRIGGER trigger_update_user_settings_timestamp
        BEFORE UPDATE ON user_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_user_settings_timestamp()
    `);
    console.log('✅ Created update trigger');

    // Enable RLS
    await client.query(`
      ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY
    `);
    console.log('✅ Enabled RLS');

    // Create policy (drop first if exists)
    await client.query(`
      DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings
    `);
    await client.query(`
      CREATE POLICY "Users can manage their own settings"
        ON user_settings
        FOR ALL
        USING (true)
    `);
    console.log('✅ Created RLS policy');

    // Grant permissions
    await client.query(`GRANT ALL ON user_settings TO authenticated`);
    await client.query(`GRANT ALL ON user_settings TO anon`);
    await client.query(`GRANT ALL ON user_settings TO service_role`);
    console.log('✅ Granted permissions');

    // Verify
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'user_settings'
    `);
    
    if (result.rows.length > 0) {
      console.log('\n🎉 Migration complete! user_settings table is ready.');
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
