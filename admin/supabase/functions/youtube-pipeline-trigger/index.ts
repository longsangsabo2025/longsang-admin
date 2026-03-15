// Edge Function: youtube-pipeline-trigger
// Cloud-based trigger for the YouTube content pipeline
// Can be invoked via POST or by daily-content-scheduler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TriggerRequest {
  topic?: string;
  url?: string;
  mode?: "full" | "shorts";
  auto?: boolean;
  source?: "manual" | "auto" | "scheduler";
}

interface PipelineRun {
  id: string;                    // TEXT PK — generated via crypto.randomUUID()
  pipeline_name: string;         // NOT NULL — always 'youtube-crew'
  trigger_source: "manual" | "auto" | "scheduler"; // added via fix migration
  status: "queued" | "running" | "completed" | "failed" | "paused_cost";
  input_data: Record<string, unknown>;  // JSONB {topic, url, mode}
  stage_results: Record<string, unknown>; // JSONB — populated by pipeline server
  errors: unknown[];             // JSONB array
  total_cost: number;            // NUMERIC(10,6)
  duration_ms: number;           // INTEGER
  pipeline_job_id: string | null; // added via fix migration
  started_at: string;
  completed_at: string | null;
}

interface QueuedTopic {
  id: string;
  topic: string;
  url: string | null;
  mode: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCAL_API = "http://localhost:3001/api/youtube-crew";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPipelineApiBase(): string {
  const envUrl = Deno.env.get("PIPELINE_API_URL") ?? Deno.env.get("RENDER_PIPELINE_URL");
  return envUrl ? envUrl.replace(/\/+$/, "") : LOCAL_API.replace(/\/api\/youtube-crew$/, "");
}

function getPipelineApiUrl(): string {
  const envUrl = Deno.env.get("PIPELINE_API_URL") ?? Deno.env.get("RENDER_PIPELINE_URL");
  if (envUrl) {
    // If PIPELINE_API_URL already contains the full path, use it; otherwise append
    return envUrl.includes("/api/youtube-crew")
      ? envUrl.replace(/\/+$/, "")
      : `${envUrl.replace(/\/+$/, "")}/api/youtube-crew`;
  }
  return LOCAL_API;
}

function getSupabase(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function sendTelegram(message: string): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!botToken || !chatId) {
    console.warn("⚠️ Telegram credentials not configured — skipping notification");
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Telegram send failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Core: fetch next queued topic
// ---------------------------------------------------------------------------

async function fetchNextQueuedTopic(
  supabase: SupabaseClient
): Promise<QueuedTopic | null> {
  const { data, error } = await supabase
    .from("pipeline_queue")
    .select("id, topic, url, mode, status")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ Error fetching queue:", error);
    return null;
  }
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Core: trigger pipeline
// ---------------------------------------------------------------------------

async function triggerPipeline(params: {
  topic?: string;
  url?: string;
  mode: string;
}): Promise<{ jobId: string }> {
  const apiUrl = getPipelineApiUrl();
  console.log(`🚀 Triggering pipeline at ${apiUrl}/trigger`);

  const res = await fetch(`${apiUrl}/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: params.topic,
      url: params.url,
      videoUrl: params.url,  // server.js expects videoUrl
      mode: params.mode,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pipeline trigger failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  // Server may return runId, pipelineId, id, or jobId
  const jobId = data.runId ?? data.pipelineId ?? data.id ?? data.jobId ?? data.job_id;
  if (!jobId) throw new Error("Pipeline did not return a job ID");
  return { jobId };
}

// ---------------------------------------------------------------------------
// Core: store run result
// ---------------------------------------------------------------------------

async function storePipelineRun(
  supabase: SupabaseClient,
  run: PipelineRun
): Promise<string | null> {
  const { data, error } = await supabase
    .from("pipeline_runs")
    .insert(run)
    .select("id")
    .single();

  if (error) {
    console.error("❌ Error storing pipeline run:", error);
    return null;
  }
  return data?.id ?? null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  let body: TriggerRequest = {};
  try {
    body = await req.json();
  } catch {
    // empty body is acceptable — defaults to auto
  }

  const { topic: reqTopic, url: reqUrl, mode = "full", auto = false, source } = body;

  let topic = reqTopic ?? null;
  let url = reqUrl ?? null;
  const triggerSource: PipelineRun["trigger_source"] = source ?? (auto ? "auto" : "manual");
  let queueItemId: string | null = null;

  try {
    // -----------------------------------------------------------------------
    // 1. If auto → fetch next queued topic
    // -----------------------------------------------------------------------
    if (auto) {
      const queued = await fetchNextQueuedTopic(supabase);
      if (!queued) {
        const msg = "No queued topics found in pipeline_queue";
        console.log(`ℹ️ ${msg}`);
        return new Response(JSON.stringify({ success: false, message: msg }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      topic = queued.topic;
      url = queued.url;
      queueItemId = queued.id;
      console.log(`📋 Auto-picked queued topic: "${topic}"`);

      // Mark queue item as processing
      await supabase
        .from("pipeline_queue")
        .update({ status: "processing", started_at: startedAt })
        .eq("id", queueItemId);
    }

    if (!topic && !url) {
      return new Response(
        JSON.stringify({ error: "Either topic or url is required (or set auto: true)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // 2. Trigger the pipeline
    // -----------------------------------------------------------------------
    const { jobId } = await triggerPipeline({ topic: topic ?? undefined, url: url ?? undefined, mode });
    console.log(`🎬 Pipeline job started: ${jobId}`);

    // Store initial run record (aligned with actual pipeline_runs schema)
    const runRecord: PipelineRun = {
      id: crypto.randomUUID(),
      pipeline_name: "youtube-crew",
      trigger_source: triggerSource,
      status: "running",
      input_data: { topic, url, mode },
      stage_results: {},
      errors: [],
      total_cost: 0,
      duration_ms: 0,
      pipeline_job_id: jobId,
      started_at: startedAt,
      completed_at: null,
    };
    const runId = await storePipelineRun(supabase, runRecord);

    // -----------------------------------------------------------------------
    // 3. Send Telegram "Pipeline started" notification
    // -----------------------------------------------------------------------
    await sendTelegram(
      `🚀 *YouTube Pipeline Started*\n` +
        `📌 Topic: ${topic ?? url}\n` +
        `🎬 Mode: ${mode}\n` +
        `🔄 Source: ${triggerSource}\n` +
        `🆔 Job: \`${jobId}\`\n` +
        `📝 Run: \`${runId}\``
    );

    // -----------------------------------------------------------------------
    // 4. Return immediately (fire-and-forget — completion handled by webhook)
    // -----------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        status: "running",
        jobId,
        runId,
        topic,
        mode,
        trigger_source: triggerSource,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationSec = Math.round((Date.now() - startMs) / 1000);
    console.error("❌ youtube-pipeline-trigger error:", error);

    // Telegram error alert
    await sendTelegram(
      `🔥 *YouTube Pipeline Trigger Error*\n` +
        `📌 Topic: ${topic ?? url ?? "unknown"}\n` +
        `💥 ${(error as Error).message}\n` +
        `⏱ After ${durationSec}s`
    );

    // Mark queue item as failed
    if (queueItemId) {
      await supabase
        .from("pipeline_queue")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", queueItemId);
    }

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
