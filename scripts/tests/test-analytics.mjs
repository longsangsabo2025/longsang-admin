import pg from "pg";

const { Client } = pg;

const CONNECTION_STRING =
  "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

console.log("🧪 Testing Analytics System...\n");

const client = new Client({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("✅ Connected to database\n");

  // Test 1: Insert sample events for all products
  console.log("📊 Inserting sample events...");

  const products = ["longsang", "vungtau", "sabo-arena", "ls-secretary"];
  const eventTypes = ["page_view", "click", "form_submit", "conversion"];

  let inserted = 0;

  for (const product of products) {
    for (let i = 0; i < 10; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const pages = ["/", "/dashboard", "/analytics", "/admin", "/settings"];
      const pageUrl = pages[Math.floor(Math.random() * pages.length)];

      await client.query(
        `
        INSERT INTO analytics_events (
          product_name,
          event_type,
          event_name,
          page_url,
          device_type,
          browser,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${i} hours')
      `,
        [
          product,
          eventType,
          `${eventType}_${pageUrl}`,
          pageUrl,
          i % 2 === 0 ? "desktop" : "mobile",
          i % 3 === 0 ? "Chrome" : "Firefox",
        ]
      );

      inserted++;
    }
  }

  console.log(`✅ Inserted ${inserted} sample events\n`);

  // Test 2: Query events
  console.log("🔍 Querying analytics_events...");
  const eventsResult = await client.query(`
    SELECT product_name, COUNT(*) as count
    FROM analytics_events
    GROUP BY product_name
    ORDER BY product_name
  `);

  console.log("📈 Events by product:");
  eventsResult.rows.forEach((row) => {
    console.log(`   ${row.product_name}: ${row.count} events`);
  });

  // Test 3: Test get_product_overview function
  console.log("\n🔧 Testing get_product_overview() function...");
  const overviewResult = await client.query("SELECT * FROM get_product_overview()");

  console.log("📊 Product Overview:");
  overviewResult.rows.forEach((row) => {
    console.log(`   ${row.product_name}:`);
    console.log(`      Total Events: ${row.total_events}`);
    console.log(`      Page Views: ${row.page_views}`);
    console.log(`      Unique Users: ${row.unique_users}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("✅ Analytics system is working!");
  console.log("=".repeat(60));
  console.log("\n📊 View dashboard at:");
  console.log("http://localhost:8081/admin/unified-analytics");
} catch (error) {
  console.error("❌ Test failed!");
  console.error(error.message);
  process.exit(1);
} finally {
  await client.end();
}
