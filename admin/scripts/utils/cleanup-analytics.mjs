import pg from "pg";

const { Client } = pg;

const CONNECTION_STRING =
  "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

console.log("🧹 Cleaning up old analytics tables...\n");

const client = new Client({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("✅ Connected!\n");

  // Drop all analytics tables and related objects
  const cleanupSQL = `
-- Drop existing analytics objects if they exist
DROP MATERIALIZED VIEW IF EXISTS analytics_24h_overview CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS analytics_daily_summary CASCADE;
DROP TABLE IF EXISTS product_metrics CASCADE;
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS funnel_analytics CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS track_analytics_event CASCADE;
DROP FUNCTION IF EXISTS get_daily_stats CASCADE;
DROP FUNCTION IF EXISTS get_product_overview CASCADE;
DROP FUNCTION IF EXISTS update_product_metrics CASCADE;
DROP FUNCTION IF EXISTS refresh_analytics_24h_overview CASCADE;
  `;

  console.log("⏳ Dropping old objects...");
  await client.query(cleanupSQL);
  console.log("✅ Cleanup complete!\n");
  console.log("Now run: node deploy-db.mjs");
} catch (error) {
  console.error("❌ Cleanup failed!");
  console.error(error.message);
  process.exit(1);
} finally {
  await client.end();
}
