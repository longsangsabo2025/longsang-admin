import pg from "pg";
const c = new pg.Client({
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.diexsbzqwsbpilsymnfb",
  password: "Acookingoil123",
  ssl: { rejectUnauthorized: false },
});
await c.connect();
console.log("✅ Connected!\n");

const tables = await c.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
);
console.log("📋 All Tables:");
tables.rows.forEach((r) => console.log(`  - ${r.table_name}`));

const marketing = [
  "marketing_campaigns",
  "campaign_posts",
  "email_campaigns",
  "marketing_leads",
  "workflow_executions",
  "social_media_accounts",
  "content_library",
  "automated_workflows",
];
console.log("\n🎯 Marketing Tables Check:");
for (const t of marketing) {
  const e = await c.query(
    `SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name=$1)`,
    [t]
  );
  console.log(`  ${e.rows[0].exists ? "✅" : "❌"} ${t}`);
}

const users = await c.query(`SELECT COUNT(*) FROM auth.users`);
console.log(`\n👤 Total users: ${users.rows[0].count}`);

console.log("\n📊 Existing workflow_executions structure:");
const cols = await c.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='workflow_executions' ORDER BY ordinal_position`
);
for (const col of cols.rows) {
  console.log(`  ${col.column_name}: ${col.data_type}`);
}

await c.end();
