/**
 * Action Executor Service
 * Executes queued actions (create_task, add_note, send_notification, update_knowledge, ...)
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function queueAction(userId, actionType, payload = {}, sessionId = null) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("brain_actions")
    .insert({
      user_id: userId,
      session_id: sessionId,
      action_type: actionType,
      payload,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to queue action: ${error.message}`);
  return data;
}

async function executeAction(action) {
  if (!supabase) throw new Error("Supabase not configured");

  const { id, user_id: userId, action_type: actionType, payload } = action;

  try {
    // mark running
    await supabase.from("brain_actions").update({ status: "running" }).eq("id", id);

    let result = {};

    switch (actionType) {
      case "create_task": {
        const taskPayload = payload || {};
        const { data, error } = await supabase
          .from("brain_tasks")
          .insert({
            user_id: userId,
            title: taskPayload.title || "Untitled Task",
            description: taskPayload.description || null,
            status: taskPayload.status || "open",
            priority: taskPayload.priority || "medium",
            due_date: taskPayload.due_date || null,
            related_domain_id: taskPayload.domain_id || null,
            related_session_id: taskPayload.session_id || null,
            source: taskPayload.source || "workflow",
            metadata: taskPayload.metadata || {},
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        result = { task_id: data.id };
        break;
      }
      case "send_notification": {
        const notif = payload || {};
        const { data, error } = await supabase
          .from("brain_notifications")
          .insert({
            user_id: userId,
            type: notif.type || "insight",
            message: notif.message || "No message",
            metadata: notif.metadata || {},
            is_read: false,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        result = { notification_id: data.id };
        break;
      }
      case "add_note": {
        // Placeholder: store as notification for now
        const note = payload || {};
        const { data, error } = await supabase
          .from("brain_notifications")
          .insert({
            user_id: userId,
            type: "insight",
            message: note.text || "New note",
            metadata: note || {},
            is_read: false,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        result = { note_id: data.id };
        break;
      }
      case "update_knowledge": {
        // Placeholder: Implement according to brain_knowledge schema
        result = { updated: true, payload };
        break;
      }
      default:
        throw new Error(`Unsupported action_type: ${actionType}`);
    }

    await supabase
      .from("brain_actions")
      .update({ status: "success", result, executed_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    await supabase
      .from("brain_actions")
      .update({
        status: "failed",
        error_log: err.message || String(err),
        executed_at: new Date().toISOString(),
      })
      .eq("id", action.id);
  }
}

async function executePendingActions(limit = 50) {
  if (!supabase) throw new Error("Supabase not configured");

  const { data: actions, error } = await supabase
    .from("brain_actions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch actions: ${error.message}`);
  if (!actions || actions.length === 0) return 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const action of actions) {
    // eslint-disable-next-line no-await-in-loop
    await executeAction(action);
  }
  return actions.length;
}

module.exports = {
  supabase,
  queueAction,
  executeAction,
  executePendingActions,
};

