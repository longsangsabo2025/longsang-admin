const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function checkAgentRun() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected\n');
    
    // Check project_agents stats for Long Sang Portfolio
    console.log('📊 PROJECT AGENTS (Long Sang Portfolio):');
    const agents = await client.query(`
      SELECT 
        p.name as project,
        a.name as agent_name,
        pa.is_enabled,
        pa.total_runs,
        pa.successful_runs,
        pa.failed_runs,
        pa.last_run_at,
        pa.total_cost_usd
      FROM project_agents pa
      JOIN ai_agents a ON a.id = pa.agent_id
      JOIN projects p ON p.id = pa.project_id
      WHERE p.name ILIKE '%Long Sang%' OR p.name ILIKE '%Portfolio%'
      ORDER BY pa.last_run_at DESC NULLS LAST;
    `);
    console.table(agents.rows);

    // Check ALL project_agents recent runs
    console.log('\n🔥 RECENT AGENT RUNS (All Projects):');
    const recentRuns = await client.query(`
      SELECT 
        p.name as project,
        a.name as agent_name,
        pa.total_runs,
        pa.successful_runs,
        pa.last_run_at
      FROM project_agents pa
      JOIN ai_agents a ON a.id = pa.agent_id
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.last_run_at IS NOT NULL
      ORDER BY pa.last_run_at DESC
      LIMIT 10;
    `);
    console.table(recentRuns.rows);

    // Check ai_agents master stats
    console.log('\n🤖 AI AGENTS MASTER STATS:');
    const aiAgents = await client.query(`
      SELECT name, type, total_runs, successful_runs, total_cost_usd, last_used_at
      FROM ai_agents
      ORDER BY last_used_at DESC NULLS LAST
      LIMIT 5;
    `);
    console.table(aiAgents.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAgentRun();
