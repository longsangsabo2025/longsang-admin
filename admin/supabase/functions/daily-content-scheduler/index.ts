// Edge Function: daily-content-scheduler
// Runs daily via pg_cron — reads content_calendar, triggers pipelines,
// suggests topics via Gemini, and sends a daily Telegram brief.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarItem {
  id: string;
  title: string;
  topic: string | null;
  scheduled_date: string;
  type: "full" | "shorts";
  status: string;
  notes: string | null;
}

interface PipelineRunSummary {
  id: string;
  input_data: Record<string, unknown> | null;
  status: string;
  duration_ms: number | null;
  total_cost: number | null;
  completed_at: string | null;
}

interface GeminiSuggestion {
  topic: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSupabase(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
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
// Trigger the youtube-pipeline-trigger Edge Function
// ---------------------------------------------------------------------------

async function triggerYoutubePipeline(item: CalendarItem): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const fnUrl = `${supabaseUrl}/functions/v1/youtube-pipeline-trigger`;
  console.log(`🚀 Triggering pipeline for "${item.topic ?? item.title}" via ${fnUrl}`);

  try {
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        topic: item.topic ?? item.title,
        mode: item.type ?? "full",
        source: "scheduler",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`❌ Pipeline trigger failed for "${item.topic ?? item.title}": ${res.status} ${body}`);
      return false;
    }

    const data = await res.json();
    console.log(`✅ Pipeline triggered for "${item.topic ?? item.title}": jobId=${data.jobId}`);
    return true;
  } catch (err) {
    console.error(`❌ Pipeline trigger error for "${item.topic ?? item.title}":`, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Gemini: suggest trending topics
// ---------------------------------------------------------------------------

async function suggestTopicsWithGemini(
  existingTopics: string[]
): Promise<GeminiSuggestion[]> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    console.warn("⚠️ GEMINI_API_KEY not set — skipping AI topic suggestions");
    return [];
  }

  const prompt = `You are a YouTube content strategist for a Vietnamese tech/AI/automation channel.
Existing upcoming topics: ${existingTopics.length > 0 ? existingTopics.join(", ") : "none yet"}.

Suggest 3 trending YouTube video topics for today. For each topic provide:
- "topic": a concise title (Vietnamese or English)
- "reason": why it's trending right now (1 sentence)

Respond ONLY with a JSON array, no markdown.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Parse JSON from response (strip possible markdown fences)
    const jsonStr = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const suggestions: GeminiSuggestion[] = JSON.parse(jsonStr);
    return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
  } catch (err) {
    console.error("Gemini suggestion error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fetch yesterday's completed runs
// ---------------------------------------------------------------------------

async function getYesterdayRuns(
  supabase: SupabaseClient
): Promise<PipelineRunSummary[]> {
  const yesterday = yesterdayISO();
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("id, input_data, status, duration_ms, total_cost, completed_at")
    .gte("completed_at", `${yesterday}T00:00:00Z`)
    .lt("completed_at", `${todayISO()}T00:00:00Z`)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Error fetching yesterday runs:", error);
    return [];
  }
  return (data as PipelineRunSummary[]) ?? [];
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getSupabase();
  const today = todayISO();

  try {
    console.log(`📅 Daily Content Scheduler running for ${today}`);

    // -------------------------------------------------------------------
    // 1. Get today's scheduled items from content_calendar
    // -------------------------------------------------------------------
    const { data: todayItems, error: calError } = await supabase
      .from("content_calendar")
      .select("id, title, topic, scheduled_date, type, status, notes")
      .eq("scheduled_date", today)
      .in("status", ["planned", "scheduled", "pending"])
      .order("created_at", { ascending: true });

    if (calError) {
      console.error("❌ Error reading content_calendar:", calError);
      throw calError;
    }

    const scheduled: CalendarItem[] = (todayItems as CalendarItem[]) ?? [];
    console.log(`📋 Found ${scheduled.length} items scheduled for today`);

    // -------------------------------------------------------------------
    // 2. Trigger pipelines for today's items
    // -------------------------------------------------------------------
    const triggered: string[] = [];
    const triggerFailed: string[] = [];

    for (const item of scheduled) {
      // Mark as triggering
      await supabase
        .from("content_calendar")
        .update({ status: "triggering" })
        .eq("id", item.id);

      const ok = await triggerYoutubePipeline(item);

      if (ok) {
        triggered.push(item.topic ?? item.title);
        await supabase
          .from("content_calendar")
          .update({ status: "triggered" })
          .eq("id", item.id);
      } else {
        triggerFailed.push(item.topic ?? item.title);
        await supabase
          .from("content_calendar")
          .update({ status: "trigger_failed" })
          .eq("id", item.id);
      }
    }

    // -------------------------------------------------------------------
    // 3. For unscheduled items → AI topic suggestions
    // -------------------------------------------------------------------
    const { data: unscheduledItems } = await supabase
      .from("content_calendar")
      .select("topic")
      .is("scheduled_date", null)
      .in("status", ["draft", "idea"]);

    const existingTopics: string[] = [
      ...scheduled.map((i) => i.topic ?? i.title).filter(Boolean),
      ...(unscheduledItems ?? []).map((i: { topic: string | null }) => i.topic).filter((t): t is string => t !== null),
    ];

    const suggestions = await suggestTopicsWithGemini(existingTopics);

    // Insert AI suggestions into content_calendar as drafts
    if (suggestions.length > 0) {
      const rows = suggestions.map((s) => ({
        title: s.topic,
        topic: s.topic,
        type: "full",
        status: "ai_suggested",
        scheduled_date: null,
        notes: `AI reason: ${s.reason} | Suggested: ${new Date().toISOString()}`,
      }));

      const { error: insertErr } = await supabase
        .from("content_calendar")
        .insert(rows);

      if (insertErr) {
        console.warn("⚠️ Could not insert AI suggestions:", insertErr);
      } else {
        console.log(`💡 Inserted ${suggestions.length} AI-suggested topics`);
      }
    }

    // -------------------------------------------------------------------
    // 4. Yesterday's completed runs summary
    // -------------------------------------------------------------------
    const yesterdayRuns = await getYesterdayRuns(supabase);
    const completedYesterday = yesterdayRuns.filter((r) => r.status === "completed");
    const failedYesterday = yesterdayRuns.filter((r) => r.status !== "completed");
    const totalCost = completedYesterday.reduce((s, r) => s + (r.total_cost ?? 0), 0);

    // -------------------------------------------------------------------
    // 5. Send daily Telegram brief
    // -------------------------------------------------------------------
    const lines: string[] = [
      `📅 *Daily Content Brief — ${today}*`,
      "",
    ];

    // Scheduled & triggered
    if (triggered.length > 0) {
      lines.push(`🚀 *Triggered today (${triggered.length}):*`);
      triggered.forEach((t) => lines.push(`  • ${t}`));
    }
    if (triggerFailed.length > 0) {
      lines.push(`⚠️ *Trigger failed (${triggerFailed.length}):*`);
      triggerFailed.forEach((t) => lines.push(`  • ${t}`));
    }
    if (triggered.length === 0 && triggerFailed.length === 0) {
      lines.push("📭 No items scheduled for today.");
    }

    // Yesterday's results
    lines.push("");
    if (yesterdayRuns.length > 0) {
      lines.push(
        `📊 *Yesterday's runs:* ${completedYesterday.length} ✅ / ${failedYesterday.length} ❌`
      );
      if (totalCost > 0) {
        lines.push(`💰 Total cost: $${totalCost.toFixed(2)}`);
      }
      completedYesterday.slice(0, 5).forEach((r) => {
        const topic = (r.input_data as any)?.topic ?? "N/A";
        const durationSec = r.duration_ms ? Math.round(r.duration_ms / 1000) : null;
        lines.push(
          `  ✅ ${topic} — ${durationSec ?? "?"}s, $${r.total_cost?.toFixed(2) ?? "?"}`
        );
      });
      failedYesterday.slice(0, 3).forEach((r) => {
        lines.push(`  ❌ ${(r.input_data as any)?.topic ?? "N/A"} — ${r.status}`);
      });
    } else {
      lines.push("📊 No pipeline runs yesterday.");
    }

    // AI suggestions
    if (suggestions.length > 0) {
      lines.push("");
      lines.push(`💡 *AI-suggested topics:*`);
      suggestions.forEach((s) => lines.push(`  • ${s.topic} — _${s.reason}_`));
    }

    const briefMessage = lines.join("\n");
    console.log(briefMessage);
    await sendTelegram(briefMessage);

    // -------------------------------------------------------------------
    // 6. Response
    // -------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        triggered: triggered.length,
        trigger_failed: triggerFailed.length,
        ai_suggestions: suggestions.length,
        yesterday_completed: completedYesterday.length,
        yesterday_failed: failedYesterday.length,
        yesterday_cost_usd: totalCost,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ daily-content-scheduler error:", error);

    await sendTelegram(
      `🔥 *Daily Content Scheduler Error*\n` +
        `📅 ${today}\n` +
        `💥 ${(error as Error).message}`
    );

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
