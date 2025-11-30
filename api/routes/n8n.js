const express = require("express");
const router = express.Router();
const { spawn, exec } = require("child_process");
const path = require("path");

// Store n8n process globally
let n8nProcess = null;
let n8nStatus = {
  running: false,
  pid: null,
  startedAt: null,
  url: "http://localhost:5678",
  logs: [],
};

/**
 * Check if n8n is already running on port 5678
 */
function checkN8nRunning() {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "netstat -ano | findstr :5678" : "lsof -i :5678";

    exec(command, (error, stdout) => {
      if (error || !stdout) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Kill existing n8n process
 */
function killN8nProcess() {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      // Windows: Kill by port
      exec(
        "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :5678') do taskkill /F /PID %a",
        (error) => {
          setTimeout(resolve, 1000); // Wait for process to die
        }
      );
    } else {
      // Unix: Kill by port
      exec("kill $(lsof -t -i:5678)", (error) => {
        setTimeout(resolve, 1000);
      });
    }
  });
}

/**
 * GET /api/n8n/status
 * Get n8n server status
 */
router.get("/status", async (req, res) => {
  try {
    const isRunning = await checkN8nRunning();

    res.json({
      success: true,
      status: {
        running: isRunning,
        pid: n8nStatus.pid,
        startedAt: n8nStatus.startedAt,
        url: n8nStatus.url,
        uptime: n8nStatus.startedAt
          ? Math.floor((Date.now() - new Date(n8nStatus.startedAt).getTime()) / 1000)
          : 0,
        logs: n8nStatus.logs.slice(-50), // Last 50 log lines
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/n8n/start
 * Start n8n server
 * Body: { openBrowser: boolean } - Optional, open browser after start
 */
router.post("/start", async (req, res) => {
  try {
    const { openBrowser = false } = req.body;

    // Check if already running
    const isRunning = await checkN8nRunning();
    if (isRunning && n8nProcess) {
      return res.json({
        success: true,
        message: "n8n is already running",
        status: n8nStatus,
      });
    }

    // Kill any existing process first
    await killN8nProcess();

    // Clear logs
    n8nStatus.logs = [];

    // Spawn n8n process
    const isWindows = process.platform === "win32";
    const n8nCommand = isWindows ? "npx.cmd" : "npx";

    // n8n is installed in the parent directory (D:\PROJECTS\01-MAIN-PRODUCTS)
    const n8nWorkDir = path.join(__dirname, "..", "..", "..");

    n8nProcess = spawn(n8nCommand, ["n8n", "start"], {
      cwd: n8nWorkDir,
      env: {
        ...process.env,
        N8N_HOST: "localhost",
        N8N_PORT: "5678",
        N8N_PROTOCOL: "http",
        DB_SQLITE_POOL_SIZE: "10",
        N8N_RUNNERS_ENABLED: "true",
        // Disable user management for auto-login
        N8N_USER_MANAGEMENT_DISABLED: "true",
        // Security settings
        N8N_BLOCK_ENV_ACCESS_IN_NODE: "false",
        N8N_GIT_NODE_DISABLE_BARE_REPOS: "true",
      },
      detached: false,
      shell: true,
    });

    // Update status
    n8nStatus.running = true;
    n8nStatus.pid = n8nProcess.pid;
    n8nStatus.startedAt = new Date().toISOString();

    // Capture stdout
    n8nProcess.stdout.on("data", (data) => {
      const log = data.toString();
      n8nStatus.logs.push({
        type: "info",
        message: log,
        timestamp: new Date().toISOString(),
      });
      console.log("[n8n]", log);
    });

    // Capture stderr
    n8nProcess.stderr.on("data", (data) => {
      const log = data.toString();
      n8nStatus.logs.push({
        type: "error",
        message: log,
        timestamp: new Date().toISOString(),
      });
      console.error("[n8n ERROR]", log);
    });

    // Handle process exit
    n8nProcess.on("exit", (code) => {
      console.log(`[n8n] Process exited with code ${code}`);
      n8nStatus.running = false;
      n8nStatus.pid = null;
      n8nStatus.logs.push({
        type: "info",
        message: `Process exited with code ${code}`,
        timestamp: new Date().toISOString(),
      });
      n8nProcess = null;
    });

    // Handle process error
    n8nProcess.on("error", (error) => {
      console.error("[n8n] Process error:", error);
      n8nStatus.running = false;
      n8nStatus.logs.push({
        type: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Wait a bit to ensure it started
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Open browser if requested
    if (openBrowser) {
      const { exec } = require("child_process");
      const url = n8nStatus.url;
      const isWindows = process.platform === "win32";
      const isMac = process.platform === "darwin";

      if (isWindows) {
        exec(`start ${url}`);
      } else if (isMac) {
        exec(`open ${url}`);
      } else {
        exec(`xdg-open ${url}`);
      }
    }

    res.json({
      success: true,
      message: "n8n server started successfully",
      status: {
        running: true,
        pid: n8nStatus.pid,
        startedAt: n8nStatus.startedAt,
        url: n8nStatus.url,
      },
    });
  } catch (error) {
    console.error("[n8n] Start error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to start n8n server",
    });
  }
});

/**
 * POST /api/n8n/stop
 * Stop n8n server
 */
router.post("/stop", async (req, res) => {
  try {
    // Kill the process
    if (n8nProcess) {
      const isWindows = process.platform === "win32";

      if (isWindows) {
        // Windows: Use taskkill
        exec(`taskkill /F /PID ${n8nProcess.pid} /T`, (error) => {
          if (error) {
            console.error("Error killing process:", error);
          }
        });
      } else {
        // Unix: Use kill
        n8nProcess.kill("SIGTERM");
      }

      n8nProcess = null;
    }

    // Also kill by port to be sure
    await killN8nProcess();

    // Update status
    n8nStatus.running = false;
    n8nStatus.pid = null;
    n8nStatus.logs.push({
      type: "info",
      message: "Server stopped by user",
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "n8n server stopped successfully",
      status: {
        running: false,
        pid: null,
        stoppedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[n8n] Stop error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to stop n8n server",
    });
  }
});

/**
 * POST /api/n8n/restart
 * Restart n8n server
 */
router.post("/restart", async (req, res) => {
  try {
    // Stop first
    await killN8nProcess();
    if (n8nProcess) {
      n8nProcess.kill("SIGTERM");
      n8nProcess = null;
    }

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Start again
    const startResponse = await fetch("http://localhost:3001/api/n8n/start", {
      method: "POST",
    });

    res.json({
      success: true,
      message: "n8n server restarted successfully",
    });
  } catch (error) {
    console.error("[n8n] Restart error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to restart n8n server",
    });
  }
});

/**
 * GET /api/n8n/logs
 * Get n8n logs
 */
router.get("/logs", (req, res) => {
  const limit = parseInt(req.query.limit) || 100;

  res.json({
    success: true,
    logs: n8nStatus.logs.slice(-limit),
  });
});

// ============================================================
// N8N WORKFLOW CLONE & EXECUTE APIs
// ============================================================

const N8N_API_KEY = process.env.N8N_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODU5NDQ0LCJleHAiOjE3NjYzNzk2MDB9.soMLJs-B80r6MS6PELzM9u0gel2xofvrtLQ3UJ-xziQ";
const N8N_BASE_URL = process.env.N8N_URL || "http://localhost:5678";

// Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Workflow Templates for each agent type
 */
const WORKFLOW_TEMPLATES = {
  content_writer: (project) => ({
    name: `Content Writer - ${project.name}`,
    nodes: [
      {
        parameters: {
          path: `content-writer-${project.slug}`,
          responseMode: "responseNode",
          options: {}
        },
        id: "webhook-1",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: `cw-${project.slug}-${Date.now()}`
      },
      {
        parameters: {
          model: "gpt-4o-mini",
          messages: {
            values: [
              {
                role: "system",
                content: `Bạn là content writer chuyên nghiệp cho ${project.name}. Viết nội dung chất lượng cao, SEO-friendly bằng tiếng Việt.`
              },
              {
                role: "user",
                content: "={{ $json.body?.topic || $json.topic || 'Viết một bài blog' }}"
              }
            ]
          },
          options: { temperature: 0.7, maxTokens: 2000 }
        },
        id: "openai-1",
        name: "OpenAI",
        type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4,
        position: [500, 300],
        credentials: { openAiApi: { id: "openai-api", name: "OpenAI API" } }
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: `={{ { success: true, project: "${project.name}", content: $json.choices[0].message.content, timestamp: new Date().toISOString() } }}`
        },
        id: "respond-1",
        name: "Respond",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [750, 300]
      }
    ],
    connections: {
      "Webhook": { main: [[{ node: "OpenAI", type: "main", index: 0 }]] },
      "OpenAI": { main: [[{ node: "Respond", type: "main", index: 0 }]] }
    },
    settings: { executionOrder: "v1" }
  }),

  lead_nurture: (project) => ({
    name: `Lead Nurture - ${project.name}`,
    nodes: [
      {
        parameters: { path: `lead-nurture-${project.slug}`, responseMode: "responseNode" },
        id: "webhook-1", name: "New Lead", type: "n8n-nodes-base.webhook",
        typeVersion: 2, position: [250, 300], webhookId: `ln-${project.slug}-${Date.now()}`
      },
      {
        parameters: {
          model: "gpt-4o-mini",
          messages: { values: [
            { role: "system", content: `Sales assistant cho ${project.name}. Viết email follow-up thân thiện.` },
            { role: "user", content: "Viết email cho: {{ $json.body?.name }}, quan tâm: {{ $json.body?.service }}" }
          ]}
        },
        id: "openai-1", name: "Generate Email", type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4, position: [500, 300]
      },
      {
        parameters: { respondWith: "json", responseBody: `={{ { success: true, email: $json.choices[0].message.content } }}` },
        id: "respond-1", name: "Response", type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1, position: [750, 300]
      }
    ],
    connections: {
      "New Lead": { main: [[{ node: "Generate Email", type: "main", index: 0 }]] },
      "Generate Email": { main: [[{ node: "Response", type: "main", index: 0 }]] }
    }
  }),

  customer_support: (project) => ({
    name: `Support Bot - ${project.name}`,
    nodes: [
      {
        parameters: { path: `support-${project.slug}`, responseMode: "responseNode" },
        id: "webhook-1", name: "Support", type: "n8n-nodes-base.webhook",
        typeVersion: 2, position: [250, 300], webhookId: `cs-${project.slug}-${Date.now()}`
      },
      {
        parameters: {
          model: "gpt-4o-mini",
          messages: { values: [
            { role: "system", content: `Customer support cho ${project.name}. Trả lời thân thiện và hữu ích.` },
            { role: "user", content: "={{ $json.body?.question || $json.question }}" }
          ]}
        },
        id: "openai-1", name: "AI", type: "@n8n/n8n-nodes-langchain.openAi",
        typeVersion: 1.4, position: [500, 300]
      },
      {
        parameters: { respondWith: "json", responseBody: `={{ { success: true, answer: $json.choices[0].message.content } }}` },
        id: "respond-1", name: "Reply", type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1, position: [750, 300]
      }
    ],
    connections: {
      "Support": { main: [[{ node: "AI", type: "main", index: 0 }]] },
      "AI": { main: [[{ node: "Reply", type: "main", index: 0 }]] }
    }
  })
};

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
 * GET /api/n8n/workflows/list
 * List all workflows from n8n
 */
router.get("/workflows/list", async (req, res) => {
  try {
    const result = await n8nApi('GET', '/workflows');
    res.json({ success: true, workflows: result.data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/n8n/clone
 * Clone workflow template for a project
 * Body: { project_id, agent_type }
 */
router.post("/clone", async (req, res) => {
  try {
    const { project_id, agent_type } = req.body;

    if (!project_id || !agent_type) {
      return res.status(400).json({ error: 'Missing project_id or agent_type' });
    }

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get template generator
    const templateGenerator = WORKFLOW_TEMPLATES[agent_type];
    if (!templateGenerator) {
      return res.status(400).json({ error: `Unknown agent type: ${agent_type}` });
    }

    // Generate workflow from template
    const workflow = templateGenerator(project);

    console.log(`📤 Creating n8n workflow: ${workflow.name}`);

    // Create workflow in n8n
    const created = await n8nApi('POST', '/workflows', workflow);
    console.log(`✅ Created workflow ID: ${created.id}`);

    // Activate workflow
    await n8nApi('POST', `/workflows/${created.id}/activate`);
    console.log(`🟢 Activated workflow: ${created.id}`);

    // Generate webhook URL
    const webhookPath = `${agent_type.replace('_', '-')}-${project.slug}`;
    const webhookUrl = `${N8N_BASE_URL}/webhook/${webhookPath}`;

    // Get agent ID
    const { data: agentData } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('type', agent_type)
      .single();

    // Update project_agents with n8n info
    if (agentData) {
      await supabase
        .from('project_agents')
        .update({
          config_override: {
            n8n_workflow_id: created.id,
            n8n_webhook_url: webhookUrl,
            n8n_workflow_name: workflow.name,
            n8n_created_at: new Date().toISOString()
          }
        })
        .eq('project_id', project_id)
        .eq('agent_id', agentData.id);
    }

    res.json({
      success: true,
      message: `Workflow "${workflow.name}" created and activated`,
      workflow: {
        id: created.id,
        name: workflow.name,
        webhook_url: webhookUrl,
        webhook_path: webhookPath,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Clone workflow error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/n8n/execute
 * Execute a workflow via webhook
 * Body: { webhook_path, data }
 */
router.post("/execute", async (req, res) => {
  try {
    const { webhook_path, data, instance_id } = req.body;

    if (!webhook_path) {
      return res.status(400).json({ error: 'Missing webhook_path' });
    }

    console.log(`🚀 Executing workflow via webhook: ${webhook_path}`);
    const startTime = Date.now();

    const response = await fetch(`${N8N_BASE_URL}/webhook/${webhook_path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    });

    const result = await response.json();
    const executionTime = Date.now() - startTime;
    const success = response.ok;

    // Log execution to database if instance_id provided
    if (instance_id && supabase) {
      try {
        // Try to log to workflow_executions table
        await supabase.from('workflow_executions').insert({
          workflow_instance_id: instance_id,
          status: success ? 'completed' : 'failed',
          input_data: data,
          output_data: result,
          execution_time_ms: executionTime,
          error_message: success ? null : (result.error || 'Request failed'),
          triggered_by: 'api'
        });

        // Update instance last_run_at
        await supabase
          .from('project_workflow_instances')
          .update({ 
            last_run_at: new Date().toISOString(),
            total_runs: supabase.sql`COALESCE(total_runs, 0) + 1`
          })
          .eq('id', instance_id);
      } catch (logError) {
        console.warn('Failed to log execution:', logError.message);
      }
    }

    res.json({ success, result, executionTime });

  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/n8n/workflows/clone
 * Clone from workflow_templates table for a project
 * Body: { project_id, template_slug }
 */
router.post("/workflows/clone", async (req, res) => {
  try {
    const { project_id, template_slug } = req.body;

    if (!project_id || !template_slug) {
      return res.status(400).json({ error: 'Missing project_id or template_slug' });
    }

    // Get template from DB
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('slug', template_slug)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: `Template not found: ${template_slug}` });
    }

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('project_workflow_instances')
      .select('*')
      .eq('project_id', project_id)
      .eq('template_id', template.id)
      .single();

    if (existing?.n8n_workflow_id) {
      return res.json({
        success: true,
        message: 'Workflow already exists',
        n8nWorkflowId: existing.n8n_workflow_id,
        webhookUrl: existing.webhook_url
      });
    }

    // Clone workflow to n8n
    const workflowName = `[${project.name}] ${template.name}`;
    const webhookPath = `${template.slug}-${project.slug}`.replace(/_/g, '-');

    // Create workflow in n8n from template definition
    let n8nWorkflowId = null;
    let webhookUrl = null;

    if (template.n8n_workflow_json) {
      try {
        const workflowDef = {
          ...template.n8n_workflow_json,
          name: workflowName
        };

        const created = await n8nApi('POST', '/workflows', workflowDef);
        n8nWorkflowId = created.id;
        webhookUrl = `${N8N_BASE_URL}/webhook/${webhookPath}`;

        // Activate workflow
        await n8nApi('POST', `/workflows/${created.id}/activate`);
        console.log(`✅ Created & activated n8n workflow: ${created.id}`);
      } catch (n8nError) {
        console.warn('Could not create n8n workflow:', n8nError.message);
      }
    }

    // Create or update instance in DB
    const instanceData = {
      project_id,
      template_id: template.id,
      name: workflowName,
      status: n8nWorkflowId ? 'active' : 'pending',
      n8n_workflow_id: n8nWorkflowId,
      webhook_url: webhookUrl,
      custom_config: {
        project_slug: project.slug,
        created_from_api: true
      }
    };

    if (existing) {
      await supabase
        .from('project_workflow_instances')
        .update(instanceData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('project_workflow_instances')
        .insert(instanceData);
    }

    res.json({
      success: true,
      message: `Workflow "${workflowName}" created`,
      n8nWorkflowId,
      webhookUrl
    });

  } catch (error) {
    console.error('Clone template error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/n8n/workflows/:id
 * Delete a workflow from n8n
 */
router.delete("/workflows/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await n8nApi('DELETE', `/workflows/${id}`);
    res.json({ success: true, message: `Workflow ${id} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
