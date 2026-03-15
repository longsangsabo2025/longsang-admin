import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { escapeMarkdown, sendTelegram } from "../_shared/telegram.ts"

// =====================================================
// ECOSYSTEM HEALTH CHECK
// =====================================================
// Endpoint: /functions/v1/ecosystem-health-check
// Triggered by pg_cron every 15 minutes or manual call
//
// Pings all ecosystem products, logs results to
// `ecosystem_health_logs`, and sends Telegram alerts
// for any DOWN services.
// =====================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// ── Ecosystem endpoints ──────────────────────────────
interface Endpoint {
  product: string
  url: string
}

const ENDPOINTS: Endpoint[] = [
  { product: "VT Dream Homes", url: "https://vungtauland.store" },
  { product: "Sabo Arena", url: "https://saboarena.com" },
  { product: "Long Sang Forge", url: "https://longsang.org" },
  { product: "AINewbie", url: "https://ainewbievn.shop" },
  { product: "Admin Dashboard", url: "https://admin.longsang.org" },
]

// ── Health-check result type ─────────────────────────
interface HealthResult {
  product: string
  url: string
  status: "up" | "down"
  http_status: number | null
  response_ms: number
  error: string | null
  checked_at: string
}

// ── Ping a single endpoint ───────────────────────────
async function pingEndpoint(endpoint: Endpoint): Promise<HealthResult> {
  const checkedAt = new Date().toISOString()
  const start = performance.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000) // 15s timeout

    const res = await fetch(endpoint.url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "LongSang-Ecosystem-HealthCheck/1.0" },
      redirect: "follow",
    })

    clearTimeout(timeout)
    const elapsed = Math.round(performance.now() - start)
    const isUp = res.status >= 200 && res.status < 400

    return {
      product: endpoint.product,
      url: endpoint.url,
      status: isUp ? "up" : "down",
      http_status: res.status,
      response_ms: elapsed,
      error: isUp ? null : `HTTP ${res.status} ${res.statusText}`,
      checked_at: checkedAt,
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - start)
    return {
      product: endpoint.product,
      url: endpoint.url,
      status: "down",
      http_status: null,
      response_ms: elapsed,
      error: err instanceof Error ? err.message : String(err),
      checked_at: checkedAt,
    }
  }
}

// ── Send Telegram alert ──────────────────────────────
async function sendTelegramAlert(downServices: HealthResult[]): Promise<void> {
  const lines = downServices.map(
    (s) => `🔴 *${escapeMarkdown(s.product)}*\n   URL: ${escapeMarkdown(s.url)}\n   Error: ${escapeMarkdown(s.error ?? "unknown")}`
  )

  const message =
    `⚠️ *ECOSYSTEM HEALTH ALERT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${downServices.length} service(s) DOWN\n\n` +
    lines.join("\n\n") +
    `\n\n🕐 ${new Date().toISOString()}`

  await sendTelegram(message)
}

// ── Main handler ─────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    })
  }

  try {
    // 1. Ping all endpoints concurrently
    const results: HealthResult[] = await Promise.all(
      ENDPOINTS.map((ep) => pingEndpoint(ep))
    )

    // 2. Persist results in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const rows = results.map((r) => ({
      product: r.product,
      status: r.status,
      http_status: r.http_status,
      response_ms: r.response_ms,
      checked_at: r.checked_at,
      error: r.error,
    }))

    const { error: insertError } = await supabase
      .from("ecosystem_health_logs")
      .insert(rows)

    if (insertError) {
      console.error("Failed to insert health logs:", insertError)
    }

    // 3. Alert on DOWN services (with dedup — only newly-down)
    const downServices = results.filter((r) => r.status === "down")

    const newlyDown: HealthResult[] = []
    for (const svc of downServices) {
      const { data: lastCheck } = await supabase
        .from("ecosystem_health_logs")
        .select("status")
        .eq("product", svc.product)
        .neq("checked_at", svc.checked_at) // exclude the row we just inserted
        .order("checked_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // Alert if no previous record or was previously up
      if (!lastCheck || lastCheck.status === "up") {
        newlyDown.push(svc)
      }
    }

    if (newlyDown.length > 0) {
      await sendTelegramAlert(newlyDown)
    }

    // 4. Build summary
    const summary = {
      checked_at: new Date().toISOString(),
      total: results.length,
      up: results.filter((r) => r.status === "up").length,
      down: downServices.length,
      results: results.map((r) => ({
        product: r.product,
        status: r.status,
        http_status: r.http_status,
        response_ms: r.response_ms,
        error: r.error,
      })),
      alerts_sent: newlyDown.length > 0,
      persisted: !insertError,
    }

    return new Response(JSON.stringify(summary, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Health check failed:", err)

    // Alert that the watchdog itself failed
    await sendTelegramAlert([{
      product: "Health Check System",
      url: "internal",
      status: "down",
      http_status: null,
      response_ms: 0,
      error: err instanceof Error ? err.message : String(err),
      checked_at: new Date().toISOString(),
    }])

    return new Response(
      JSON.stringify({
        error: "Health check failed",
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
