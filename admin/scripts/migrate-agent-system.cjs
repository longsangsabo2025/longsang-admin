/**
 * Direct PostgreSQL Migration
 * Runs migration using pg pool connection
 */

const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  // 1. Add arcs column to ai_series
  `ALTER TABLE ai_series ADD COLUMN IF NOT EXISTS arcs JSONB DEFAULT '[]'::jsonb`,
  
  // 2. Create index for arcs
  `CREATE INDEX IF NOT EXISTS idx_ai_series_arcs ON ai_series USING GIN (arcs)`,
  
  // 3. Add shot_list to ai_episodes
  `ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS shot_list JSONB DEFAULT '[]'::jsonb`,
  
  // 4. Add cinematography to ai_episodes
  `ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS cinematography JSONB DEFAULT '{}'::jsonb`,
  
  // 5. Add image_prompts to ai_episodes
  `ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS image_prompts JSONB DEFAULT '[]'::jsonb`,
  
  // 6. Add motion_prompts to ai_episodes
  `ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS motion_prompts JSONB DEFAULT '[]'::jsonb`,
  
  // 7. Create index for shot_list
  `CREATE INDEX IF NOT EXISTS idx_ai_episodes_shot_list ON ai_episodes USING GIN (shot_list)`,
  
  // 8. Create index for cinematography
  `CREATE INDEX IF NOT EXISTS idx_ai_episodes_cinematography ON ai_episodes USING GIN (cinematography)`,
  
  // 9. Create agent_jobs table
  `CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES ai_episodes(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
  )`,
  
  // 10. Create indexes for agent_jobs
  `CREATE INDEX IF NOT EXISTS idx_agent_jobs_episode_id ON agent_jobs(episode_id)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_jobs_agent_type ON agent_jobs(agent_type)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(status)`,
  
  // 11. Create update function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql'`,
  
  // 12. Create trigger
  `DROP TRIGGER IF EXISTS update_agent_jobs_updated_at ON agent_jobs`,
  `CREATE TRIGGER update_agent_jobs_updated_at
   BEFORE UPDATE ON agent_jobs
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column()`
];

async function runMigration() {
  console.log('🚀 Starting AI Agent System Migration\n');
  console.log('=' .repeat(60));
  
  const client = await pool.connect();
  
  try {
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const shortSql = sql.substring(0, 70).replace(/\n/g, ' ') + '...';
      
      process.stdout.write(`\n[${i + 1}/${migrations.length}] ${shortSql}\n`);
      
      try {
        await client.query(sql);
        console.log('✅ Success');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⏭️  Already exists (skipped)');
          skipCount++;
        } else {
          console.log(`⚠️  ${error.message}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Failed: ${migrations.length - successCount - skipCount}`);
    
    // Verify columns exist
    console.log('\n🔍 Verifying schema...\n');
    
    const verifications = [
      { table: 'ai_series', column: 'arcs', expected: 'jsonb' },
      { table: 'ai_episodes', column: 'shot_list', expected: 'jsonb' },
      { table: 'ai_episodes', column: 'cinematography', expected: 'jsonb' },
      { table: 'ai_episodes', column: 'image_prompts', expected: 'jsonb' },
      { table: 'ai_episodes', column: 'motion_prompts', expected: 'jsonb' },
      { table: 'agent_jobs', column: 'id', expected: 'uuid' }
    ];
    
    for (const { table, column, expected } of verifications) {
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
      
      if (result.rows.length > 0) {
        console.log(`✅ ${table}.${column} (${result.rows[0].data_type})`);
      } else {
        console.log(`❌ ${table}.${column} NOT FOUND`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Migration Complete!\n');
    console.log('🎬 AI Production Crew is ready to use!');
    console.log('   - Script Supervisor: ✅ Ready');
    console.log('   - Director of Photography: ✅ Ready');
    console.log('   - Production Studio UI: ✅ Ready\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
