import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("🔍 Checking system status...\n");

// Check activity logs
const { data: logs } = await supabase
  .from("activity_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(10);

console.log("📋 Recent Activity Logs:");
if (logs && logs.length > 0) {
  for (const log of logs) {
    const time = new Date(log.created_at).toLocaleString();
    console.log(`  [${time}] ${log.action} - ${log.status}`);
    if (log.details) {
      console.log("    Details:", JSON.stringify(log.details).substring(0, 100));
    }
    if (log.error_message) {
      console.log("    Error:", log.error_message.substring(0, 100));
    }
  }
} else {
  console.log("  No logs found");
}

// Check latest contact
console.log("\n📧 Latest Contact:");
const { data: contacts } = await supabase
  .from("contacts")
  .select("id, name, email, message, created_at")
  .order("created_at", { ascending: false })
  .limit(1);

if (contacts && contacts.length > 0) {
  const c = contacts[0];
  console.log(`  Name: ${c.name}`);
  console.log(`  Email: ${c.email}`);
  console.log(`  Time: ${new Date(c.created_at).toLocaleString()}`);
  console.log(`  Message: ${c.message.substring(0, 100)}...`);
}

// Check latest blog
console.log("\n📝 Latest Blog Post:");
const { data: blogs } = await supabase
  .from("content_queue")
  .select("*")
  .eq("content_type", "blog_post")
  .order("created_at", { ascending: false })
  .limit(1);

if (blogs && blogs.length > 0) {
  const b = blogs[0];
  console.log(`  Title: ${b.title}`);
  console.log(`  Status: ${b.status}`);
  console.log(`  Time: ${new Date(b.created_at).toLocaleString()}`);
  console.log(`  Has content: ${!!b.content || !!b.generated_content}`);
  if (b.metadata) {
    console.log(`  Metadata:`, JSON.stringify(b.metadata).substring(0, 100));
  }
}

// Check trigger
console.log("\n🔧 Checking Trigger:");
const { data: triggers } = await supabase.rpc("get_trigger_info");
if (triggers) {
  console.log("  Triggers:", triggers);
} else {
  console.log("  ⚠️  Cannot query triggers (may need custom function)");
}

console.log("\n✅ Status check complete");
console.log(
  "📊 View logs: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/logs/edge-functions"
);
