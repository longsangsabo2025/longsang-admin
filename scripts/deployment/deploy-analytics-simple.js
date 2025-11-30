// Quick Deploy Analytics Database
// Usage: node deploy-analytics-simple.js

import("dotenv/config");

const SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SERVICE_ROLE_KEY_HERE";

console.log("🚀 Deploying Analytics Database via REST API...\n");

// Read SQL file
import { readFileSync } from "node:fs";
const sql = readFileSync("./supabase/migrations/20251117_analytics_system.sql", "utf8");

console.log("📄 SQL loaded:", Math.round(sql.length / 1024), "KB");
console.log("⏳ Executing via Supabase REST API...\n");

// Execute SQL via Supabase REST API (query endpoint)
fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    Prefer: "return=minimal",
  },
  body: JSON.stringify({ query: sql }),
})
  .then((res) => {
    if (res.ok) {
      console.log("✅ Database deployed successfully!");
      console.log("\n📊 Verify at:");
      console.log("https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor\n");
      return res.text();
    } else {
      return res.text().then((text) => {
        throw new Error(`HTTP ${res.status}: ${text}`);
      });
    }
  })
  .then((data) => {
    if (data) console.log("Response:", data);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error.message);
    console.log("\n💡 Alternative: Copy SQL and paste in Supabase Dashboard");
    console.log("   SQL already in clipboard - just Ctrl+V in browser\n");
  });
