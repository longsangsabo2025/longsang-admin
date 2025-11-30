import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

const CONNECTION_STRING =
  "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

console.log("🚀 Deploying Analytics Database Schema via Transaction Pooler...\n");

// Create PostgreSQL client
const client = new Client({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
});

try {
  // Connect
  console.log("📡 Connecting to database...");
  await client.connect();
  console.log("✅ Connected!\n");

  // Read SQL file
  const sql = readFileSync("./supabase/migrations/20251117_analytics_system.sql", "utf8");
  console.log("📄 SQL loaded:", Math.round(sql.length / 1024), "KB\n");

  // Execute full SQL as one statement for proper ordering
  console.log("⏳ Executing migration (this may take 10-20 seconds)...\n");

  await client.query(sql);

  console.log("✅ Analytics database deployed successfully!");
  console.log("\n📊 Created:");
  console.log(
    "   • 5 tables (analytics_events, analytics_daily_summary, product_metrics, user_activity_log, funnel_analytics)"
  );
  console.log("   • 1 materialized view (analytics_24h_overview)");
  console.log(
    "   • 4 functions (track_analytics_event, get_daily_stats, get_product_overview, update_product_metrics)"
  );
  console.log("   • RLS policies and permissions");
  console.log("   • Sample data for testing");
} catch (error) {
  console.error("❌ Deployment failed!");
  console.error(error.message);
  process.exit(1);
} finally {
  await client.end();
}

console.log("\n" + "=".repeat(60));
console.log("✅ Deployment Complete!");
console.log(`   Success: ${success}`);
console.log(`   Failed: ${failed}`);
console.log("=".repeat(60));

if (failed === 0) {
  console.log("\n🎉 All tables created successfully!");
  console.log("\n📊 Next: Verify at");
  console.log("   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor");
}
