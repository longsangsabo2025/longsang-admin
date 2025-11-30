import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentExecution() {
  console.log('\n🤖 Testing AI Agent Execution...\n');

  // 1. Lấy một agent từ database
  console.log('📥 Fetching agents from Supabase...');
  const { data: agents, error: fetchError } = await supabase
    .from('ai_agents')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('❌ Error fetching agents:', fetchError);
    return;
  }

  if (!agents || agents.length === 0) {
    console.error('❌ No agents found in database');
    return;
  }

  const agent = agents[0];
  console.log('✅ Found agent:', {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
  });

  // 2. Simulate agent execution
  console.log('\n⚡ Executing agent:', agent.name);
  
  const executionId = `exec_${Date.now()}`;
  const startTime = Date.now();

  try {
    // Tạo log cho execution
    const logEntry = {
      workflow_id: agent.id,
      workflow_name: agent.name,
      status: 'running',
      started_at: new Date().toISOString(),
      message: `Starting ${agent.name} execution`,
      metadata: {
        agent_type: agent.type,
        execution_id: executionId,
      },
    };

    console.log('📝 Creating activity log...');
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert([logEntry]);

    if (logError) {
      console.error('⚠️ Error creating log:', logError);
    } else {
      console.log('✅ Activity log created');
    }

    // Simulate agent work (trong thực tế, đây sẽ là API call tới OpenAI/Claude)
    console.log('🔄 Agent is working...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s work

    const executionTime = Date.now() - startTime;
    const mockResult = {
      success: true,
      output: `Agent ${agent.name} executed successfully!`,
      tokens_used: 150,
      cost_usd: 0.0023,
      execution_time_ms: executionTime,
    };

    console.log('\n✅ Agent execution completed!');
    console.log('📊 Results:', mockResult);

    // Update agent stats
    console.log('\n📊 Updating agent statistics...');
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        total_runs: agent.total_runs + 1,
        successful_runs: agent.successful_runs + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

    if (updateError) {
      console.error('⚠️ Error updating stats:', updateError);
    } else {
      console.log('✅ Agent stats updated');
    }

    // Create completion log
    const completionLog = {
      workflow_id: agent.id,
      workflow_name: agent.name,
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      message: `Completed ${agent.name} execution`,
      metadata: {
        ...mockResult,
        execution_id: executionId,
      },
    };

    const { error: completionError } = await supabase
      .from('activity_logs')
      .insert([completionLog]);

    if (completionError) {
      console.error('⚠️ Error creating completion log:', completionError);
    } else {
      console.log('✅ Completion log created');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Agent: ${agent.name}`);
    console.log(`   Execution Time: ${executionTime}ms`);
    console.log(`   Status: Success`);
    console.log(`   Total Runs: ${agent.total_runs + 1}`);
    console.log(`   Success Rate: ${((agent.successful_runs + 1) / (agent.total_runs + 1) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('\n❌ Error during execution:', error);
    
    // Log failure
    const failureLog = {
      workflow_id: agent.id,
      workflow_name: agent.name,
      status: 'failed',
      started_at: new Date(startTime).toISOString(),
      message: `Failed ${agent.name} execution: ${error.message}`,
      metadata: {
        error: error.message,
        execution_id: executionId,
      },
    };

    await supabase
      .from('activity_logs')
      .insert([failureLog]);
  }
}

// Run test
testAgentExecution().catch(console.error);
