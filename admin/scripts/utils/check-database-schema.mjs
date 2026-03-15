import pg from "pg";
const { Client } = pg;

const client = new Client({
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.diexsbzqwsbpilsymnfb",
  password: "Acookingoil123",
  ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
  try {
    await client.connect();
    console.log("✅ Connected to Supabase\n");

    // List all tables
    console.log("📋 All Tables:");
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    // Check if marketing tables already exist
    console.log("\n🔍 Marketing Automation Tables:");
    const marketingTables = [
      "marketing_campaigns",
      "campaign_posts",
      "email_campaigns",
      "marketing_leads",
      "workflow_executions",
      "social_media_accounts",
      "content_library",
      "automated_workflows",
    ];

    for (const tableName of marketingTables) {
      const exists = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `,
        [tableName]
      );

      const status = exists.rows[0].exists ? "✅" : "❌";
      console.log(`  ${status} ${tableName}`);

      // If exists, show columns
      if (exists.rows[0].exists) {
        const cols = await client.query(
          `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `,
          [tableName]
        );
        console.log(`     Columns: ${cols.rows.map((c) => c.column_name).join(", ")}`);
      }
    }

    // Check auth.users table
    console.log("\n👤 Auth Users:");
    const authUsers = await client.query(`
      SELECT COUNT(*) as count FROM auth.users
    `);
    console.log(`  Total users: ${authUsers.rows[0].count}`);

    if (authUsers.rows[0].count > 0) {
      const users = await client.query(`
        SELECT id, email, created_at
        FROM auth.users
        LIMIT 5
      `);
      console.log("  Sample users:");
      users.rows.forEach((u) => console.log(`    - ${u.email} (${u.id})`));
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
