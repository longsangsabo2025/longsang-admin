/**
 * Workflow Engine Service
 * Evaluates triggers and generates actions based on workflows
 */

const { createClient } = require("@supabase/supabase-js");
const actionExecutor = require("./action-executor-service");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function getActiveWorkflows(userId) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("brain_workflows")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new Error(`Failed to get workflows: ${error.message}`);
  return data || [];
}

function matchTrigger(workflow, eventType, context) {
  if (!workflow || !workflow.trigger_type) return false;
  if (workflow.trigger_type !== eventType) return false;
  const cfg = workflow.trigger_config || {};

  if (eventType === "on_query") {
    if (cfg.contains && typeof context.query === "string") {
      const needle = String(cfg.contains).toLowerCase();
      if (!context.query.toLowerCase().includes(needle)) return false;
    }
    if (typeof cfg.min_confidence === "number") {
      const c = Number(context.confidence || 0);
      if (c < cfg.min_confidence) return false;
    }
  }

  // Extend with other event types as needed
  return true;
}

async function evaluateEvent(userId, eventType, context = {}) {
  const workflows = await getActiveWorkflows(userId);
  const matched = workflows.filter((wf) => matchTrigger(wf, eventType, context));
  return matched;
}

async function runWorkflow(workflow, userId, context = {}) {
  const actions = Array.isArray(workflow.actions) ? workflow.actions : [];
  const sessionId = context.sessionId || null;

  // Simple template rendering: replace {{var}} in payload with context[var]
  const renderTemplate = (obj) => {
    const str = JSON.stringify(obj || {});
    const rendered = str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const value = key.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), context);
      return value === undefined ? "" : String(value);
    });
    return JSON.parse(rendered || "{}");
  };

   
  for (const step of actions) {
    const actionType = step.action_type || step.type;
    const payloadTemplate = step.payload || step.payload_template || {};
    const payload = renderTemplate(payloadTemplate);
     
    await actionExecutor.queueAction(userId, actionType, payload, sessionId);
  }

  return actions.length;
}

module.exports = {
  supabase,
  getActiveWorkflows,
  evaluateEvent,
  runWorkflow,
};

