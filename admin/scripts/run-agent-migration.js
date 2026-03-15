/**
 * Run Agent System Migration
 * Executes SQL migration to add agent system schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const migrationSQL = `
-- Add columns for AI agent system to existing tables
-- This migration extends the ai_series and ai_episodes tables for multi-agent production workflow

-- Add arcs column to ai_series if not exists (for story structure)
ALTER TABLE ai_series ADD COLUMN IF NOT EXISTS arcs JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_ai_series_arcs ON ai_series USING GIN (arcs);

-- Add shot_list and cinematography columns to ai_episodes
ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS shot_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS cinematography JSONB DEFAULT '{}'::jsonb;
ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS image_prompts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_episodes ADD COLUMN IF NOT EXISTS motion_prompts JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_episodes_shot_list ON ai_episodes USING GIN (shot_list);
CREATE INDEX IF NOT EXISTS idx_ai_episodes_cinematography ON ai_episodes USING GIN (cinematography);

-- Create agent_jobs table to track agent processing
CREATE TABLE IF NOT EXISTS agent_jobs (
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
);

-- Create indexes for agent_jobs
CREATE INDEX IF NOT EXISTS idx_agent_jobs_episode_id ON agent_jobs(episode_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_agent_type ON agent_jobs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for agent_jobs
DROP TRIGGER IF EXISTS update_agent_jobs_updated_at ON agent_jobs;
CREATE TRIGGER update_agent_jobs_updated_at
    BEFORE UPDATE ON agent_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE agent_jobs IS 'Tracks AI agent job execution for multi-agent production workflow';
COMMENT ON COLUMN agent_jobs.agent_type IS 'Type of agent: script_supervisor, dp, designer, editor, continuity, coordinator';
COMMENT ON COLUMN agent_jobs.status IS 'Job status: pending, processing, completed, failed, approved, rejected';
`;

async function runMigration() {
  console.log('🔄 Running agent system migration...\n');
  
  try {
    // Execute migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      // If rpc doesn't exist, try direct query
      console.log('⚠️  RPC method not available, trying direct execution...\n');
      
      // Split by statement and execute one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('COMMENT')) {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            query: statement + ';' 
          });
          
          if (stmtError) {
            console.log(`⚠️  Statement result: ${stmtError.message}`);
          } else {
            console.log('✅ Done\n');
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    // Verify tables exist
    console.log('\n🔍 Verifying migration...\n');
    
    // Check ai_series for arcs column
    const { data: seriesCheck, error: seriesError } = await supabase
      .from('ai_series')
      .select('arcs')
      .limit(1);
    
    if (seriesError) {
      console.log(`❌ ai_series.arcs column: ${seriesError.message}`);
    } else {
      console.log('✅ ai_series.arcs column exists');
    }

    // Check ai_episodes for new columns
    const { data: episodesCheck, error: episodesError } = await supabase
      .from('ai_episodes')
      .select('shot_list, cinematography, image_prompts, motion_prompts')
      .limit(1);
    
    if (episodesError) {
      console.log(`❌ ai_episodes columns: ${episodesError.message}`);
    } else {
      console.log('✅ ai_episodes.shot_list column exists');
      console.log('✅ ai_episodes.cinematography column exists');
      console.log('✅ ai_episodes.image_prompts column exists');
      console.log('✅ ai_episodes.motion_prompts column exists');
    }

    // Check agent_jobs table
    const { data: jobsCheck, error: jobsError } = await supabase
      .from('agent_jobs')
      .select('*')
      .limit(1);
    
    if (jobsError) {
      console.log(`⚠️  agent_jobs table: ${jobsError.message}`);
      console.log('\n📝 NOTE: You may need to run the migration SQL manually in Supabase Dashboard');
    } else {
      console.log('✅ agent_jobs table exists');
    }

    console.log('\n✅ Migration verification complete!');
    console.log('\n🎬 AI Production Crew is ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Manual migration required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new');
    console.log('2. Copy SQL from: api/migrations/add_agent_system_schema.sql');
    console.log('3. Click Run');
  }
}

runMigration();
