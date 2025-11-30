import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate mock result based on agent type
 */
function generateMockResult(agent, input) {
  const baseTokens = 100 + Math.floor(Math.random() * 200);
  const cost = (baseTokens / 1000) * 0.002; // $0.002 per 1K tokens

  const results = {
    content_writer: {
      output: `# Generated Content\n\nThis is AI-generated content by ${agent.name}.\n\n## Key Points:\n- Professional tone\n- SEO optimized\n- Engaging structure\n\nContent created based on: ${JSON.stringify(input)}`,
      tokens_used: baseTokens,
      cost_usd: cost,
      metadata: {
        word_count: 150,
        reading_time: '2 min',
        seo_score: 92,
      },
    },
    lead_nurture: {
      output: `Email campaign created for lead nurturing:\n\nSubject: We noticed you're interested...\n\nBody: Personalized content for ${input.contact || 'prospect'}`,
      tokens_used: baseTokens,
      cost_usd: cost,
      metadata: {
        emails_drafted: 3,
        personalization_score: 95,
        expected_conversion_rate: '8.5%',
      },
    },
    social_media: {
      output: `Social media post created:\n\n🚀 ${input.topic || 'Exciting news'}!\n\n#marketing #business #success`,
      tokens_used: baseTokens,
      cost_usd: cost,
      metadata: {
        platforms: ['facebook', 'instagram', 'linkedin'],
        hashtag_count: 5,
        optimal_posting_time: '10:00 AM',
      },
    },
    analytics: {
      output: `Analysis Report:\n\nKey Metrics:\n- Conversion Rate: 12.5%\n- ROI: 245%\n- Growth: +18%`,
      tokens_used: baseTokens,
      cost_usd: cost,
      metadata: {
        data_points_analyzed: 1500,
        insights_generated: 8,
        confidence_score: 0.94,
      },
    },
    customer_support: {
      output: `Support Response:\n\nThank you for contacting us! I understand your concern about ${input.issue || 'the matter'}. Let me help you resolve this...`,
      tokens_used: baseTokens,
      cost_usd: cost,
      metadata: {
        response_time: '< 30 seconds',
        sentiment: 'positive',
        resolution_probability: '95%',
      },
    },
  };

  return results[agent.type] || {
    output: `Agent ${agent.name} executed successfully with input: ${JSON.stringify(input)}`,
    tokens_used: baseTokens,
    cost_usd: cost,
    metadata: { execution_mode: 'default' },
  };
}

/**
 * Vercel Serverless Function - Execute AI Agent
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get agentId from URL path (Vercel passes it as query param)
  const { agentId } = req.query;
  const input = req.body || {};

  if (!agentId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Agent ID is required' 
    });
  }

  try {
    // 1. Fetch agent from database
    const { data: agent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return res.status(404).json({ 
        success: false, 
        error: `Agent not found: ${agentId}` 
      });
    }

    if (agent.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        error: `Agent is not active: ${agent.status}` 
      });
    }

    // 2. Log execution start
    await supabase
      .from('activity_logs')
      .insert([{
        agent_id: agentId,
        workflow_id: agentId,
        action: 'execution_started',
        status: 'running',
        details: {
          agent_name: agent.name,
          agent_type: agent.type,
          execution_id: executionId,
          input: input,
        },
        duration_ms: 0,
      }]);

    // 3. Execute agent (Mock for now)
    console.log(`🤖 Executing agent: ${agent.name} (${agent.type})`);
    
    // Simulate agent execution (2-5 seconds)
    const simulatedWorkTime = 2000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, simulatedWorkTime));

    // Generate mock result
    const mockResult = generateMockResult(agent, input);
    const executionTime = Date.now() - startTime;

    // 4. Update agent statistics
    await supabase
      .from('ai_agents')
      .update({
        total_runs: agent.total_runs + 1,
        successful_runs: agent.successful_runs + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    // 5. Log execution success
    await supabase
      .from('activity_logs')
      .insert([{
        agent_id: agentId,
        workflow_id: agentId,
        action: 'execution_completed',
        status: 'success',
        details: {
          agent_name: agent.name,
          execution_id: executionId,
          result: mockResult,
          tokens_used: mockResult.tokens_used,
          cost_usd: mockResult.cost_usd,
        },
        duration_ms: executionTime,
      }]);

    console.log(`✅ Agent execution completed in ${executionTime}ms`);

    return res.status(200).json({
      success: true,
      executionId,
      agentId,
      agentName: agent.name,
      executionTime,
      result: mockResult,
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Agent execution failed:`, error);

    // Log execution failure
    await supabase
      .from('activity_logs')
      .insert([{
        agent_id: agentId,
        workflow_id: agentId,
        action: 'execution_failed',
        status: 'error',
        error_message: error.message,
        details: {
          execution_id: executionId,
          error: error.message,
        },
        duration_ms: executionTime,
      }]);

    return res.status(500).json({
      success: false,
      executionId,
      agentId,
      executionTime,
      error: error.message,
    });
  }
}
