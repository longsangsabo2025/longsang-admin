import pg from "pg";

const { Client } = pg;

const CONNECTION_STRING =
  "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

console.log("🔍 Verifying Analytics Database...\n");

const client = new Client({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  // Check tables
  const tablesResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE '%analytics%'
    OR table_name IN ('product_metrics', 'user_activity_log', 'funnel_analytics')
    ORDER BY table_name
  `);

  console.log("📊 Tables created:");
  tablesResult.rows.forEach((row) => {
    console.log(`   ✅ ${row.table_name}`);
  });

  // Check functions
  const functionsResult = await client.query(`
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND (routine_name LIKE '%analytics%' OR routine_name LIKE '%product%')
    ORDER BY routine_name
  `);

  console.log("\n🔧 Functions created:");
  functionsResult.rows.forEach((row) => {
    console.log(`   ✅ ${row.routine_name}`);
  });

  // Check sample data
  const countResult = await client.query("SELECT COUNT(*) FROM analytics_events");
  console.log(`\n📈 Sample data: ${countResult.rows[0].count} events\n`);

  console.log("=".repeat(60));
  console.log("✅ Analytics system verified and ready!");
  console.log("=".repeat(60));
  console.log("\n📊 View in Supabase:");
  console.log("https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor");
} catch (error) {
  console.error("❌ Verification failed!");
  console.error(error.message);
} finally {
  await client.end();
}
