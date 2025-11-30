/**
 * 🏢 Business Context Service
 *
 * Loads and provides business context for workflow generation
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Load business context
 * @returns {Promise<object>} Business context data
 */
async function load() {
  try {
    // Load projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Load active workflows
    const { data: workflows, error: workflowsError } = await supabase
      .from('project_workflows')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    // Load recent executions
    const { data: executions, error: executionsError } = await supabase
      .from('workflow_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    // Determine domain from projects
    let domain = 'general';
    if (projects && projects.length > 0) {
      const projectNames = projects.map((p) => p.name?.toLowerCase() || '').join(' ');
      if (
        projectNames.includes('bất động sản') ||
        projectNames.includes('real estate') ||
        projectNames.includes('vũng tàu')
      ) {
        domain = 'real-estate';
      } else if (projectNames.includes('marketing') || projectNames.includes('campaign')) {
        domain = 'marketing';
      }
    }

    return {
      domain,
      currentProjects: projects || [],
      activeCampaigns: [], // TODO: Load from campaigns table if exists
      recentWorkflows: workflows || [],
      recentExecutions: executions || [],
      businessGoals: [
        'Tăng engagement trên social media',
        'Tạo content SEO chất lượng',
        'Tự động hóa workflows',
        'Tối ưu chi phí AI',
      ],
      constraints: {
        budget: null, // TODO: Load from settings
        timeline: null,
        resources: ['OpenAI API', 'n8n', 'Supabase'],
      },
      stats: {
        totalProjects: projects?.length || 0,
        activeWorkflows: workflows?.length || 0,
        recentExecutions: executions?.length || 0,
      },
    };
  } catch (error) {
    console.error('Error loading business context:', error);
    // Return default context on error
    return {
      domain: 'general',
      currentProjects: [],
      activeCampaigns: [],
      recentWorkflows: [],
      recentExecutions: [],
      businessGoals: [],
      constraints: {},
      stats: {
        totalProjects: 0,
        activeWorkflows: 0,
        recentExecutions: 0,
      },
    };
  }
}

module.exports = {
  load,
};
