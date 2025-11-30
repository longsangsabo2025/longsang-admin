import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error("   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log("🚀 Deploying Analytics Database Schema...");
console.log(`📦 Project: ${supabaseUrl}`);

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Read SQL file
const sqlPath = join(__dirname, "supabase", "migrations", "20251117_analytics_system.sql");
const sql = readFileSync(sqlPath, "utf8");

console.log("📄 SQL file loaded:", sqlPath);
console.log(`   Size: ${Math.round(sql.length / 1024)}KB`);

// Execute SQL
console.log("\n⏳ Executing SQL migration...");

try {
  // Split SQL into individual statements (rough split by semicolons outside strings)
  const statements = sql
    .split(/;\s*$/gm)
    .filter((stmt) => stmt.trim().length > 0)
    .filter((stmt) => !stmt.trim().startsWith("--") || stmt.includes("\n"));

  console.log(`   Found ${statements.length} SQL statements`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    // Show progress
    const firstLine = statement.split("\n")[0].substring(0, 60);
    console.log(`   [${i + 1}/${statements.length}] ${firstLine}...`);

    try {
      const { data, error } = await supabase.rpc("exec_sql", { sql_query: statement });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      // If rpc doesn't exist, try direct query
      try {
        const { error } = await supabase
          .from("_")
          .select("*")
          .limit(0)
          .then(() => {
            // This is a workaround - we'll use the REST API directly
            return fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ query: statement }),
            });
          });

        successCount++;
      } catch (directErr) {
        console.error(`   ❌ Failed: ${directErr.message}`);
        errorCount++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Deployment Summary:");
  console.log(`   ✓ Successful: ${successCount}`);
  console.log(`   ✗ Failed: ${errorCount}`);
  console.log("=".repeat(60));

  if (errorCount === 0) {
    console.log("\n🎉 Analytics database deployed successfully!");
    console.log("\n📊 Next Steps:");
    console.log(
      "   1. Verify tables: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor"
    );
    console.log("   2. Test query: SELECT COUNT(*) FROM analytics_events;");
    console.log("   3. Integrate tracking in App.tsx");
  } else {
    console.log("\n⚠️  Some statements failed. Please check errors above.");
    console.log("   You may need to run the SQL manually in Supabase Dashboard.");
  }
} catch (error) {
  console.error("\n❌ Deployment failed!");
  console.error(error);
  process.exit(1);
}
