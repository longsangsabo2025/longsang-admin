/**
 * Workflow Templates API Routes
 * Manages workflow templates and project instances
 */

const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// n8n API configuration
const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const N8N_API_KEY = process.env.N8N_API_KEY;

// ============================================================
// TEMPLATES ENDPOINTS
// ============================================================

/**
 * GET /api/workflow-templates
 * List all workflow templates
 */
router.get("/", async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let query = supabase
      .from("workflow_templates")
      .select("*")
      .order("category")
      .order("name");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/workflow-templates/:id
 * Get single template by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/workflow-templates
 * Create a new workflow template
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      category,
      icon,
      n8n_template_json,
      config_schema,
      default_config,
      required_credentials,
    } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: "Name and category are required",
      });
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const { data, error } = await supabase
      .from("workflow_templates")
      .insert({
        name,
        slug: finalSlug,
        description,
        category,
        icon: icon || "⚙️",
        n8n_template_json,
        config_schema: config_schema || {},
        default_config: default_config || {},
        required_credentials: required_credentials || [],
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: "Template created successfully",
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/workflow-templates/:id
 * Update an existing template
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.clone_count;

    const { data, error } = await supabase
      .from("workflow_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: "Template updated successfully",
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/workflow-templates/:id
 * Delete a template (soft delete by setting status to deprecated)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    if (hard === "true") {
      // Hard delete
      const { error } = await supabase
        .from("workflow_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } else {
      // Soft delete
      const { error } = await supabase
        .from("workflow_templates")
        .update({ status: "deprecated" })
        .eq("id", id);

      if (error) throw error;
    }

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// INSTANCES ENDPOINTS
// ============================================================

/**
 * GET /api/workflow-templates/instances
 * List all workflow instances across projects
 */
router.get("/instances/all", async (req, res) => {
  try {
    const { project_id, status } = req.query;

    let query = supabase
      .from("project_workflow_instances")
      .select(`
        *,
        projects:project_id (id, name, slug, icon),
        workflow_templates:template_id (id, name, icon, category)
      `)
      .order("created_at", { ascending: false });

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching instances:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/workflow-templates/clone
 * Clone a template to a project
 */
router.post("/clone", async (req, res) => {
  try {
    const { template_id, project_id, name, config } = req.body;

    // Validate required fields
    if (!template_id || !project_id) {
      return res.status(400).json({
        success: false,
        error: "template_id and project_id are required",
      });
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    if (templateError) throw templateError;

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, slug")
      .eq("id", project_id)
      .single();

    if (projectError) throw projectError;

    // Generate instance name
    const instanceName = name || `${project.name} - ${template.name}`;

    // Create instance
    const { data: instance, error: instanceError } = await supabase
      .from("project_workflow_instances")
      .insert({
        project_id,
        template_id,
        name: instanceName,
        description: template.description,
        config: config || template.default_config,
        n8n_workflow_json: template.n8n_template_json,
        status: "draft",
        is_enabled: false,
      })
      .select()
      .single();

    if (instanceError) throw instanceError;

    // Update template clone count
    await supabase
      .from("workflow_templates")
      .update({ clone_count: (template.clone_count || 0) + 1 })
      .eq("id", template_id);

    res.json({
      success: true,
      data: instance,
      message: `Template cloned to ${project.name}`,
    });
  } catch (error) {
    console.error("Error cloning template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/workflow-templates/instances/:id/deploy
 * Deploy an instance to n8n
 */
router.post("/instances/:id/deploy", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch instance with template
    const { data: instance, error: instanceError } = await supabase
      .from("project_workflow_instances")
      .select(`
        *,
        workflow_templates:template_id (*)
      `)
      .eq("id", id)
      .single();

    if (instanceError) throw instanceError;

    // Get workflow JSON from instance or template
    const workflowJson = instance.n8n_workflow_json || instance.workflow_templates?.n8n_template_json;

    if (!workflowJson) {
      return res.status(400).json({
        success: false,
        error: "No workflow JSON available to deploy",
      });
    }

    // Prepare workflow for n8n
    const n8nWorkflow = {
      ...workflowJson,
      name: instance.name,
      active: false, // Start inactive
    };

    // Create workflow in n8n
    const n8nResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_API_KEY && { "X-N8N-API-KEY": N8N_API_KEY }),
      },
      body: JSON.stringify(n8nWorkflow),
    });

    if (!n8nResponse.ok) {
      const error = await n8nResponse.text();
      throw new Error(`n8n API error: ${error}`);
    }

    const createdWorkflow = await n8nResponse.json();

    // Extract webhook URL if exists
    let webhookUrl = null;
    const webhookNode = createdWorkflow.nodes?.find(
      (n) => n.type === "n8n-nodes-base.webhook"
    );
    if (webhookNode) {
      const webhookPath = webhookNode.parameters?.path || createdWorkflow.id;
      webhookUrl = `${N8N_URL}/webhook/${webhookPath}`;
    }

    // Update instance with n8n info
    const { error: updateError } = await supabase
      .from("project_workflow_instances")
      .update({
        n8n_workflow_id: createdWorkflow.id,
        webhook_url: webhookUrl,
        status: "active",
      })
      .eq("id", id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        n8n_workflow_id: createdWorkflow.id,
        webhook_url: webhookUrl,
        n8n_url: `${N8N_URL}/workflow/${createdWorkflow.id}`,
      },
      message: "Workflow deployed to n8n successfully",
    });
  } catch (error) {
    console.error("Error deploying to n8n:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/workflow-templates/instances/:id/sync
 * Sync instance status with n8n
 */
router.post("/instances/:id/sync", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch instance
    const { data: instance, error: instanceError } = await supabase
      .from("project_workflow_instances")
      .select("*")
      .eq("id", id)
      .single();

    if (instanceError) throw instanceError;

    if (!instance.n8n_workflow_id) {
      return res.status(400).json({
        success: false,
        error: "Instance not deployed to n8n yet",
      });
    }

    // Fetch workflow from n8n
    const n8nResponse = await fetch(
      `${N8N_URL}/api/v1/workflows/${instance.n8n_workflow_id}`,
      {
        headers: {
          ...(N8N_API_KEY && { "X-N8N-API-KEY": N8N_API_KEY }),
        },
      }
    );

    if (!n8nResponse.ok) {
      // Workflow might have been deleted in n8n
      await supabase
        .from("project_workflow_instances")
        .update({
          n8n_workflow_id: null,
          status: "error",
        })
        .eq("id", id);

      return res.json({
        success: true,
        synced: false,
        message: "Workflow not found in n8n, marked as error",
      });
    }

    const n8nWorkflow = await n8nResponse.json();

    // Update instance with n8n data
    await supabase
      .from("project_workflow_instances")
      .update({
        is_enabled: n8nWorkflow.active,
        status: n8nWorkflow.active ? "active" : "paused",
        n8n_workflow_json: n8nWorkflow,
      })
      .eq("id", id);

    res.json({
      success: true,
      synced: true,
      data: {
        active: n8nWorkflow.active,
        updatedAt: n8nWorkflow.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error syncing with n8n:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/workflow-templates/instances/:id
 * Update instance
 */
router.put("/instances/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;
    delete updates.project_id;
    delete updates.template_id;

    const { data, error } = await supabase
      .from("project_workflow_instances")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error updating instance:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/workflow-templates/instances/:id
 * Delete an instance
 */
router.delete("/instances/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteFromN8n } = req.query;

    // Fetch instance to get n8n ID
    const { data: instance } = await supabase
      .from("project_workflow_instances")
      .select("n8n_workflow_id")
      .eq("id", id)
      .single();

    // Delete from n8n if requested and exists
    if (deleteFromN8n === "true" && instance?.n8n_workflow_id) {
      try {
        await fetch(`${N8N_URL}/api/v1/workflows/${instance.n8n_workflow_id}`, {
          method: "DELETE",
          headers: {
            ...(N8N_API_KEY && { "X-N8N-API-KEY": N8N_API_KEY }),
          },
        });
      } catch (e) {
        console.warn("Could not delete from n8n:", e.message);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("project_workflow_instances")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Instance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting instance:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// STATS ENDPOINT
// ============================================================

/**
 * GET /api/workflow-templates/stats
 * Get workflow statistics
 */
router.get("/stats/overview", async (req, res) => {
  try {
    // Get template counts
    const { data: templates } = await supabase
      .from("workflow_templates")
      .select("id, category, status, clone_count");

    // Get instance counts
    const { data: instances } = await supabase
      .from("project_workflow_instances")
      .select("id, status, is_enabled, total_executions, successful_executions, failed_executions");

    const stats = {
      templates: {
        total: templates?.length || 0,
        byCategory: {},
        totalClones: templates?.reduce((sum, t) => sum + (t.clone_count || 0), 0) || 0,
      },
      instances: {
        total: instances?.length || 0,
        active: instances?.filter((i) => i.is_enabled).length || 0,
        paused: instances?.filter((i) => !i.is_enabled).length || 0,
        totalExecutions: instances?.reduce((sum, i) => sum + (i.total_executions || 0), 0) || 0,
        successfulExecutions: instances?.reduce((sum, i) => sum + (i.successful_executions || 0), 0) || 0,
        failedExecutions: instances?.reduce((sum, i) => sum + (i.failed_executions || 0), 0) || 0,
      },
    };

    // Count by category
    templates?.forEach((t) => {
      stats.templates.byCategory[t.category] = (stats.templates.byCategory[t.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// WORKFLOW OPTIMIZATION ENDPOINTS
// ============================================================

const workflowOptimizer = require('../services/workflow-optimizer');

/**
 * GET /api/workflow-templates/:id/optimize
 * Get optimization suggestions for a workflow
 */
router.get('/:id/optimize', async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await workflowOptimizer.analyzeOptimizations(id);

    res.json({
      success: true,
      ...analysis
    });

  } catch (error) {
    console.error('Error analyzing workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
