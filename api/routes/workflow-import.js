/**
 * Workflow Import API
 * 
 * Intelligent workflow import system with AI analysis
 * - Upload workflow JSON from external sources
 * - AI analyzes and customizes workflow for your projects
 * - Auto-creates workflow on n8n with proper webhooks
 */

const express = require("express");
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const N8N_API_KEY = process.env.N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODU5NDQ0LCJleHAiOjE3NjYzNzk2MDB9.soMLJs-B80r6MS6PELzM9u0gel2xofvrtLQ3UJ-xziQ";
const N8N_BASE_URL = process.env.N8N_URL || "http://localhost:5678";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper: Call n8n REST API
 */
async function n8nApi(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Content-Type": "application/json"
    }
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${N8N_BASE_URL}/api/v1${endpoint}`, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`n8n API error: ${response.status} - ${error}`);
  }
  return response.json();
}

/**
 * Helper: Analyze workflow with AI
 */
async function analyzeWorkflowWithAI(workflowJson, projectContext = null) {
  if (!OPENAI_API_KEY) {
    console.log('⚠️ No OpenAI API key, using basic analysis');
    return basicWorkflowAnalysis(workflowJson);
  }

  try {
    const systemPrompt = `Bạn là chuyên gia n8n workflow. Phân tích workflow JSON và trả về JSON với format:
{
  "summary": "Mô tả ngắn gọn workflow làm gì",
  "category": "một trong: automation, marketing, support, integration, content, data-processing, notification, other",
  "triggerType": "webhook, schedule, manual, event",
  "requiredCredentials": ["Danh sách credentials cần thiết như: OpenAI, Gmail, Slack..."],
  "suggestedName": "Tên gợi ý phù hợp với dự án",
  "webhookPath": "Đường dẫn webhook gợi ý (slug format)",
  "modifications": ["Danh sách gợi ý chỉnh sửa để phù hợp với dự án"],
  "risks": ["Các rủi ro tiềm ẩn nếu có"],
  "estimatedCost": "low/medium/high dựa trên API calls",
  "complexity": "simple/moderate/complex"
}`;

    const userPrompt = projectContext 
      ? `Phân tích workflow này cho dự án "${projectContext.name}" (${projectContext.type || 'web app'}):\n\n${JSON.stringify(workflowJson, null, 2)}`
      : `Phân tích workflow này:\n\n${JSON.stringify(workflowJson, null, 2)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return basicWorkflowAnalysis(workflowJson);
  } catch (error) {
    console.error('AI analysis error:', error);
    return basicWorkflowAnalysis(workflowJson);
  }
}

/**
 * Helper: Basic workflow analysis without AI
 */
function basicWorkflowAnalysis(workflowJson) {
  const nodes = workflowJson.nodes || [];
  const nodeTypes = nodes.map(n => n.type);
  
  // Detect trigger type
  let triggerType = 'manual';
  let webhookPath = null;
  
  const webhookNode = nodes.find(n => n.type?.includes('webhook'));
  if (webhookNode) {
    triggerType = 'webhook';
    webhookPath = webhookNode.parameters?.path || `workflow-${Date.now()}`;
  } else if (nodes.some(n => n.type?.includes('cron') || n.type?.includes('schedule'))) {
    triggerType = 'schedule';
  }

  // Detect credentials needed
  const requiredCredentials = [];
  if (nodeTypes.some(t => t?.includes('openAi'))) requiredCredentials.push('OpenAI');
  if (nodeTypes.some(t => t?.includes('gmail') || t?.includes('Google'))) requiredCredentials.push('Google');
  if (nodeTypes.some(t => t?.includes('slack'))) requiredCredentials.push('Slack');
  if (nodeTypes.some(t => t?.includes('notion'))) requiredCredentials.push('Notion');
  if (nodeTypes.some(t => t?.includes('supabase'))) requiredCredentials.push('Supabase');
  if (nodeTypes.some(t => t?.includes('telegram'))) requiredCredentials.push('Telegram');

  // Detect category
  let category = 'other';
  if (nodeTypes.some(t => t?.includes('openAi') || t?.includes('langchain'))) category = 'content';
  else if (nodeTypes.some(t => t?.includes('gmail') || t?.includes('email'))) category = 'notification';
  else if (nodeTypes.some(t => t?.includes('slack') || t?.includes('discord'))) category = 'notification';
  else if (nodeTypes.some(t => t?.includes('http') || t?.includes('webhook'))) category = 'integration';

  return {
    summary: `Workflow với ${nodes.length} nodes: ${nodeTypes.slice(0, 3).join(', ')}...`,
    category,
    triggerType,
    requiredCredentials,
    suggestedName: workflowJson.name || 'Imported Workflow',
    webhookPath,
    modifications: [],
    risks: requiredCredentials.length > 0 ? ['Cần cấu hình credentials'] : [],
    estimatedCost: nodeTypes.some(t => t?.includes('openAi')) ? 'medium' : 'low',
    complexity: nodes.length > 10 ? 'complex' : nodes.length > 5 ? 'moderate' : 'simple'
  };
}

/**
 * Helper: Customize workflow for project
 */
function customizeWorkflowForProject(workflowJson, project, analysis) {
  const customized = JSON.parse(JSON.stringify(workflowJson)); // Deep clone
  
  // Update workflow name
  customized.name = `[${project.name}] ${analysis.suggestedName || workflowJson.name}`;
  
  // Update webhook paths if exists
  if (customized.nodes) {
    customized.nodes = customized.nodes.map(node => {
      if (node.type?.includes('webhook')) {
        const basePath = analysis.webhookPath || node.parameters?.path || 'webhook';
        node.parameters = {
          ...node.parameters,
          path: `${project.slug}-${basePath}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
        };
        // Generate new webhookId
        node.webhookId = `${project.slug}-${Date.now()}`;
      }
      
      // Update any AI prompts to include project context
      if (node.type?.includes('openAi') || node.type?.includes('langchain')) {
        if (node.parameters?.messages?.values) {
          node.parameters.messages.values = node.parameters.messages.values.map(msg => {
            if (msg.role === 'system' && !msg.content?.includes(project.name)) {
              msg.content = `[${project.name}] ${msg.content}`;
            }
            return msg;
          });
        }
      }
      
      return node;
    });
  }
  
  return customized;
}

/**
 * POST /api/workflow-import/analyze
 * Analyze uploaded workflow JSON without creating it
 */
router.post("/analyze", async (req, res) => {
  try {
    const { workflow_json, project_id } = req.body;

    if (!workflow_json) {
      return res.status(400).json({ error: 'Missing workflow_json' });
    }

    let workflowData = workflow_json;
    if (typeof workflow_json === 'string') {
      workflowData = JSON.parse(workflow_json);
    }

    // Get project context if provided
    let projectContext = null;
    if (project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single();
      projectContext = project;
    }

    // Analyze with AI
    const analysis = await analyzeWorkflowWithAI(workflowData, projectContext);

    res.json({
      success: true,
      analysis,
      originalName: workflowData.name,
      nodeCount: workflowData.nodes?.length || 0,
      hasWebhook: workflowData.nodes?.some(n => n.type?.includes('webhook')) || false
    });

  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/workflow-import/import
 * Import workflow to n8n with AI customization
 */
router.post("/import", async (req, res) => {
  try {
    const { 
      workflow_json, 
      project_id, 
      customize = true,
      auto_activate = true,
      save_as_template = false 
    } = req.body;

    if (!workflow_json || !project_id) {
      return res.status(400).json({ error: 'Missing workflow_json or project_id' });
    }

    let workflowData = workflow_json;
    if (typeof workflow_json === 'string') {
      workflowData = JSON.parse(workflow_json);
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`📥 Importing workflow for project: ${project.name}`);

    // Analyze workflow
    const analysis = await analyzeWorkflowWithAI(workflowData, project);
    console.log(`📊 Analysis complete: ${analysis.summary}`);

    // Customize workflow if requested
    let finalWorkflow = workflowData;
    if (customize) {
      finalWorkflow = customizeWorkflowForProject(workflowData, project, analysis);
      console.log(`✨ Customized workflow: ${finalWorkflow.name}`);
    }

    // Create workflow in n8n
    console.log(`📤 Creating workflow in n8n...`);
    const created = await n8nApi('POST', '/workflows', finalWorkflow);
    console.log(`✅ Created workflow ID: ${created.id}`);

    // Activate if requested
    if (auto_activate) {
      try {
        await n8nApi('POST', `/workflows/${created.id}/activate`);
        console.log(`🟢 Activated workflow: ${created.id}`);
      } catch (activateError) {
        console.warn(`⚠️ Could not activate (may need credentials): ${activateError.message}`);
      }
    }

    // Generate webhook URL
    const webhookNode = finalWorkflow.nodes?.find(n => n.type?.includes('webhook'));
    const webhookPath = webhookNode?.parameters?.path;
    const webhookUrl = webhookPath ? `${N8N_BASE_URL}/webhook/${webhookPath}` : null;

    // Save to project_workflow_instances
    const instanceData = {
      project_id,
      name: finalWorkflow.name,
      status: auto_activate ? 'active' : 'inactive',
      n8n_workflow_id: created.id,
      webhook_url: webhookUrl,
      custom_config: {
        original_name: workflowData.name,
        analysis,
        imported_at: new Date().toISOString(),
        customized: customize
      }
    };

    const { data: instance, error: instanceError } = await supabase
      .from('project_workflow_instances')
      .insert(instanceData)
      .select()
      .single();

    if (instanceError) {
      console.warn('Could not save instance:', instanceError.message);
    }

    // Save as template if requested
    if (save_as_template) {
      try {
        await supabase.from('workflow_templates').insert({
          name: `[Imported] ${workflowData.name}`,
          slug: `imported-${Date.now()}`,
          description: analysis.summary,
          category: analysis.category,
          trigger_type: analysis.triggerType,
          n8n_workflow_json: workflowData,
          required_credentials: analysis.requiredCredentials,
          is_active: true
        });
        console.log(`📚 Saved as template`);
      } catch (templateError) {
        console.warn('Could not save template:', templateError.message);
      }
    }

    res.json({
      success: true,
      message: `Workflow "${finalWorkflow.name}" imported successfully`,
      workflow: {
        id: created.id,
        name: finalWorkflow.name,
        webhookUrl,
        webhookPath,
        status: auto_activate ? 'active' : 'inactive'
      },
      analysis,
      instanceId: instance?.id
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/workflow-import/smart-import
 * AI-powered smart import with recommendations
 */
router.post("/smart-import", async (req, res) => {
  try {
    const { workflow_json, purpose, project_id } = req.body;

    if (!workflow_json) {
      return res.status(400).json({ error: 'Missing workflow_json' });
    }

    let workflowData = workflow_json;
    if (typeof workflow_json === 'string') {
      workflowData = JSON.parse(workflow_json);
    }

    // Get project if provided
    let project = null;
    if (project_id) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single();
      project = data;
    }

    // AI-powered analysis with purpose
    const analysis = await analyzeWorkflowWithAI(workflowData, project);

    // Get AI recommendations for modifications
    let aiRecommendations = [];
    if (OPENAI_API_KEY && purpose) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: `Bạn là chuyên gia n8n. Dựa trên workflow và mục đích sử dụng, đề xuất các chỉnh sửa cụ thể. Trả về JSON array với format:
[
  {
    "type": "modify|add|remove|config",
    "target": "node name hoặc setting",
    "suggestion": "Mô tả chi tiết cần làm",
    "priority": "high|medium|low",
    "reason": "Lý do đề xuất"
  }
]`
              },
              { 
                role: 'user', 
                content: `Workflow: ${JSON.stringify(workflowData, null, 2)}\n\nMục đích sử dụng: ${purpose}\n\nDự án: ${project?.name || 'Chưa chọn'}`
              }
            ],
            temperature: 0.5,
            max_tokens: 1500
          })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiRecommendations = JSON.parse(jsonMatch[0]);
        }
      } catch (aiError) {
        console.warn('AI recommendations error:', aiError);
      }
    }

    // Check which credentials are missing
    const missingCredentials = [];
    for (const cred of analysis.requiredCredentials) {
      // In a real implementation, check if credentials exist in n8n
      missingCredentials.push({
        name: cred,
        status: 'unknown',
        message: `Cần kiểm tra credential ${cred} trong n8n`
      });
    }

    res.json({
      success: true,
      analysis,
      recommendations: aiRecommendations,
      missingCredentials,
      previewWorkflow: customizeWorkflowForProject(workflowData, project || { name: 'Preview', slug: 'preview' }, analysis),
      readyToImport: missingCredentials.length === 0,
      warnings: [
        ...analysis.risks,
        ...(analysis.estimatedCost === 'high' ? ['⚠️ Workflow này có thể tốn nhiều API calls'] : [])
      ]
    });

  } catch (error) {
    console.error('Smart import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workflow-import/templates
 * Get available workflow templates from community/library
 */
router.get("/templates", async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: templates, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      templates: templates || [],
      categories: ['automation', 'marketing', 'support', 'integration', 'content', 'data-processing', 'notification']
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/workflow-import/validate
 * Validate workflow JSON structure
 */
router.post("/validate", (req, res) => {
  try {
    const { workflow_json } = req.body;

    let workflowData = workflow_json;
    if (typeof workflow_json === 'string') {
      workflowData = JSON.parse(workflow_json);
    }

    const errors = [];
    const warnings = [];

    // Check required fields
    if (!workflowData.nodes) {
      errors.push('Missing "nodes" array');
    }

    if (!workflowData.connections) {
      warnings.push('Missing "connections" - workflow may not work correctly');
    }

    // Check nodes structure
    if (workflowData.nodes) {
      workflowData.nodes.forEach((node, index) => {
        if (!node.type) {
          errors.push(`Node ${index}: Missing "type"`);
        }
        if (!node.name) {
          warnings.push(`Node ${index}: Missing "name"`);
        }
      });
    }

    // Check for deprecated nodes
    const deprecatedTypes = ['n8n-nodes-base.gmail', 'n8n-nodes-base.googleSheets'];
    const deprecated = workflowData.nodes?.filter(n => 
      deprecatedTypes.some(t => n.type?.startsWith(t))
    );
    if (deprecated?.length > 0) {
      warnings.push(`Found ${deprecated.length} node(s) that may need updating`);
    }

    res.json({
      success: errors.length === 0,
      valid: errors.length === 0,
      errors,
      warnings,
      nodeCount: workflowData.nodes?.length || 0,
      connectionCount: Object.keys(workflowData.connections || {}).length
    });

  } catch (error) {
    res.status(400).json({ 
      success: false, 
      valid: false,
      errors: [`Invalid JSON: ${error.message}`],
      warnings: []
    });
  }
});

module.exports = router;
