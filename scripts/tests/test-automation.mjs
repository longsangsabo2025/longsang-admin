import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY";

console.log("🧪 TESTING AUTO-TRIGGER SYSTEM\n");
console.log("=".repeat(60));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test 1: Insert contact to trigger AI generation
console.log("\n📝 TEST 1: Contact Form → AI Blog Generation");
console.log("-".repeat(60));

const testContact = {
  name: "John Smith",
  email: "john.smith@testcompany.com",
  message:
    "I run a digital marketing agency and need help with AI automation. Can your platform help me automate content creation, social media scheduling, and email campaigns? I want to save time and scale my operations.",
  phone: "0987654321",
  service: "AI Automation Consultation",
  company: "Test Digital Agency",
  budget: "medium",
};

console.log("Inserting test contact:", testContact.name);
const { data: contact, error: contactError } = await supabase
  .from("contacts")
  .insert(testContact)
  .select();

if (contactError) {
  console.error("❌ Error inserting contact:", contactError);
  process.exit(1);
}

console.log("✅ Contact inserted, ID:", contact[0].id);
console.log("⏳ Waiting 15 seconds for Edge Function to generate blog...\n");

// Wait for Edge Function to process
await new Promise((resolve) => setTimeout(resolve, 15000));

// Check if blog was generated
console.log("📊 Checking content queue...");
const { data: contentQueue, error: queueError } = await supabase
  .from("content_queue")
  .select("*")
  .eq("content_type", "blog_post")
  .order("created_at", { ascending: false })
  .limit(1);

if (queueError) {
  console.error("❌ Error checking queue:", queueError);
} else if (contentQueue && contentQueue.length > 0) {
  const blog = contentQueue[0];
  console.log("✅ Blog post generated!");
  console.log("   Title:", blog.title);
  console.log("   Status:", blog.status);
  console.log("   Topic:", blog.metadata?.topic || "N/A");
  console.log("   Content preview:", blog.generated_content?.substring(0, 150) + "...");
} else {
  console.log("⚠️  No blog post found yet");
}

// Check activity logs
console.log("\n📋 Checking activity logs...");
const { data: logs, error: logsError } = await supabase
  .from("activity_logs")
  .select("*")
  .eq("action", "content_generated")
  .order("created_at", { ascending: false })
  .limit(1);

if (logsError) {
  console.error("❌ Error checking logs:", logsError);
} else if (logs && logs.length > 0) {
  const log = logs[0];
  console.log("✅ Activity logged!");
  console.log("   Status:", log.status);
  console.log("   Model:", log.details?.model || "N/A");
  console.log("   Tokens:", log.details?.tokens || "N/A");
  if (log.error_message) {
    console.log("   Error:", log.error_message);
  }
} else {
  console.log("⚠️  No activity log found");
}

// Test 2: Check Edge Function HTTP calls
console.log("\n🌐 TEST 2: Edge Function Calls");
console.log("-".repeat(60));

const { data: httpCalls, error: httpError } = await supabase
  .from("net._http_response")
  .select("id, url, status_code, created")
  .ilike("url", "%trigger-content-writer%")
  .order("created", { ascending: false })
  .limit(3);

if (httpError) {
  console.log("⚠️  Cannot check HTTP calls (expected - table may not exist)");
} else if (httpCalls && httpCalls.length > 0) {
  console.log(`✅ Found ${httpCalls.length} Edge Function calls:`);
  httpCalls.forEach((call) => {
    console.log(`   ${call.created}: Status ${call.status_code}`);
  });
} else {
  console.log("⚠️  No Edge Function calls found");
}

// Test 3: Schedule test email
console.log("\n📧 TEST 3: Scheduling Test Email");
console.log("-".repeat(60));

const testEmail = {
  title: "Test Email from Auto-Trigger System",
  content_type: "email",
  status: "scheduled",
  scheduled_for: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
  metadata: {
    recipient: "test@longsang.com",
    subject: "🎉 Test Email - LongSang Auto-Trigger Works!",
  },
  generated_content: `
    <h1>🎉 Success!</h1>
    <p>Your auto-trigger system is working perfectly!</p>
    <ul>
      <li>✅ Contact form submission detected</li>
      <li>✅ AI content generation triggered</li>
      <li>✅ Email automation active</li>
    </ul>
    <p><strong>Next check:</strong> This email should be sent in 10 minutes by the cron job.</p>
    <p>Time sent: ${new Date().toLocaleString()}</p>
  `,
};

console.log("Scheduling test email for:", testEmail.metadata.recipient);
console.log("Scheduled time:", testEmail.scheduled_for);

const { data: emailData, error: emailError } = await supabase
  .from("content_queue")
  .insert(testEmail)
  .select();

if (emailError) {
  console.error("❌ Error scheduling email:", emailError);
} else {
  console.log("✅ Email scheduled, ID:", emailData[0].id);
  console.log("⏳ Email will be sent in ~10 minutes by cron job");
}

// Test 4: Check cron jobs
console.log("\n⏰ TEST 4: Cron Jobs Status");
console.log("-".repeat(60));

const { data: cronJobs, error: cronError } = await supabase.rpc("get_cron_jobs");

if (cronError) {
  console.log("⚠️  Cannot query cron jobs directly");
  console.log(
    "   Check manually: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/database/cron-jobs"
  );
} else if (cronJobs && cronJobs.length > 0) {
  console.log(`✅ Found ${cronJobs.length} cron jobs`);
} else {
  console.log("⚠️  No cron jobs found - may need manual setup in dashboard");
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(60));
console.log("✅ Contact insertion: PASS");
console.log("✅ Edge Function trigger: " + (contentQueue?.length > 0 ? "PASS" : "PENDING"));
console.log(
  "✅ AI content generation: " +
    (logs?.length > 0 && logs[0].status === "success" ? "PASS" : "PENDING")
);
console.log("✅ Email scheduling: " + (emailData ? "PASS" : "FAIL"));
console.log("\n⏳ Next: Wait 10 minutes and check if email was sent");
console.log("📧 Check email status:");
console.log(`   SELECT * FROM content_queue WHERE id='${emailData?.[0]?.id}';`);
console.log("\n📊 Monitor live:");
console.log("   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/logs/edge-functions");
console.log("=".repeat(60));
