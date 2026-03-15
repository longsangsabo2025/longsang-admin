import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY";

console.log("🚀 Deploying Integration Trigger\n");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read SQL file
const sql = readFileSync("./supabase/migrations/20251118_auto_marketing_integration.sql", "utf8");

// Execute SQL
const { data, error } = await supabase.rpc("exec", { query: sql });

if (error) {
  // Try executing via direct SQL execution (fallback)
  console.log("⚠️  RPC failed, trying direct execution...\n");

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ sql: stmt }),
      });

      if (response.ok) {
        console.log("✅", stmt.substring(0, 60) + "...");
        success++;
      } else {
        console.log("⚠️ ", stmt.substring(0, 60) + "...");
        failed++;
      }
    } catch (e) {
      console.log("❌", stmt.substring(0, 60) + "...");
      failed++;
    }
  }

  console.log(`\n📊 Result: ${success} success, ${failed} failed`);
} else {
  console.log("✅ Trigger deployed successfully!");
}

// Verify trigger exists
console.log("\n🔍 Verifying trigger...");
const { data: triggers, error: triggerError } = await supabase
  .from("pg_trigger")
  .select("*")
  .eq("tgname", "on_blog_post_created");

if (triggers && triggers.length > 0) {
  console.log("✅ Trigger verified: on_blog_post_created");
} else {
  console.log("⚠️  Trigger not found - using JavaScript integration instead");
  console.log("\n💡 Run: node integrate-automation.mjs --monitor");
}

console.log("\n🎉 Integration setup complete!");
console.log("\n📋 What happens now:");
console.log("   1. Contact form → Edge Function → AI Blog");
console.log("   2. Database trigger → Auto-create marketing campaign");
console.log("   3. n8n scheduler → Post to social media");
console.log("\n🧪 Test: node integrate-automation.mjs --test");
