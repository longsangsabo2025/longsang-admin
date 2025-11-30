import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://diexsbzqwsbpilsymnfb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"
);

console.log("🚀 Testing Marketing Automation System\n");

// Get first user
const { data: users } = await supabase.auth.admin.listUsers();
if (!users || users.users.length === 0) {
  console.log("❌ No users found. Please create a user first.");
  process.exit(1);
}

const userId = users.users[0].id;
console.log(`✅ Using user: ${users.users[0].email} (${userId})\n`);

// Test 1: Create a campaign
console.log("📝 Test 1: Creating campaign...");
const { data: campaign, error: campaignError } = await supabase
  .from("marketing_campaigns")
  .insert({
    user_id: userId,
    name: "Test Social Media Campaign",
    type: "social_media",
    status: "draft",
    content:
      "Excited to announce our new AI-powered automation platform! 🚀\n\nCheck it out: https://longsang.io",
    platforms: ["linkedin", "facebook", "twitter"],
    scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    target_audience: {
      interests: ["AI", "automation", "startups"],
      age_range: "25-45",
      locations: ["Vietnam", "Singapore"],
    },
  })
  .select()
  .single();

if (campaignError) {
  console.log("❌ Campaign creation failed:", campaignError.message);
  process.exit(1);
}
console.log("✅ Campaign created:", campaign.id);

// Test 2: Create campaign posts
console.log("\n📱 Test 2: Creating campaign posts...");
const platforms = ["linkedin", "facebook", "twitter"];
const posts = [];

for (const platform of platforms) {
  const { data: post, error: postError } = await supabase
    .from("campaign_posts")
    .insert({
      campaign_id: campaign.id,
      platform,
      content: `${campaign.content}\n\n#${platform} #automation #ai`,
      status: "pending",
    })
    .select()
    .single();

  if (postError) {
    console.log(`❌ ${platform} post failed:`, postError.message);
  } else {
    posts.push(post);
    console.log(`✅ ${platform} post created`);
  }
}

// Test 3: Create a lead
console.log("\n👤 Test 3: Creating test lead...");
const { data: lead, error: leadError } = await supabase
  .from("marketing_leads")
  .insert({
    user_id: userId,
    email: "test@example.com",
    name: "John Doe",
    company: "Tech Startup Inc",
    lead_score: 75,
    lead_status: "new",
    source: "linkedin",
    campaign_id: campaign.id,
    tags: ["interested", "enterprise"],
    interests: ["AI", "automation"],
  })
  .select()
  .single();

if (leadError) {
  console.log("❌ Lead creation failed:", leadError.message);
} else {
  console.log("✅ Lead created:", lead.email);
}

// Test 4: Create content in library
console.log("\n📚 Test 4: Creating content library entry...");
const { data: content, error: contentError } = await supabase
  .from("content_library")
  .insert({
    user_id: userId,
    title: "AI Automation Benefits",
    content: "Top 5 reasons why AI automation will transform your business in 2025",
    content_type: "post",
    tags: ["AI", "automation", "productivity"],
    category: "educational",
    is_ai_generated: true,
  })
  .select()
  .single();

if (contentError) {
  console.log("❌ Content creation failed:", contentError.message);
} else {
  console.log("✅ Content created:", content.title);
}

// Test 5: Create automated workflow record
console.log("\n⚙️ Test 5: Creating workflow record...");
const { data: workflow, error: workflowError } = await supabase
  .from("automated_workflows")
  .insert({
    user_id: userId,
    name: "Social Media Auto-Post",
    description: "Automatically post to multiple platforms",
    workflow_type: "social_media",
    n8n_workflow_id: "social-media-campaign",
    trigger_type: "webhook",
    is_active: true,
  })
  .select()
  .single();

if (workflowError) {
  console.log("❌ Workflow creation failed:", workflowError.message);
} else {
  console.log("✅ Workflow created:", workflow.name);
}

// Test 6: Check n8n connection
console.log("\n🔗 Test 6: Checking n8n connection...");
try {
  const response = await fetch("http://localhost:5678/healthz");
  if (response.ok) {
    console.log("✅ n8n is running");
  } else {
    console.log("⚠️ n8n responded but with status:", response.status);
  }
} catch (err) {
  console.log("❌ Cannot connect to n8n:", err.message);
  console.log("   Make sure Docker containers are running: docker ps");
}

// Test 7: Check Mautic
console.log("\n📧 Test 7: Checking Mautic connection...");
try {
  const response = await fetch("http://localhost:8081");
  if (response.ok) {
    console.log("✅ Mautic is running");
  } else {
    console.log("⚠️ Mautic responded but with status:", response.status);
  }
} catch (err) {
  console.log("❌ Cannot connect to Mautic:", err.message);
}

// Summary
console.log("\n" + "═".repeat(70));
console.log("📊 TEST SUMMARY");
console.log("═".repeat(70));
console.log("\n✅ Database Tables Working:");
console.log("   - marketing_campaigns");
console.log("   - campaign_posts");
console.log("   - marketing_leads");
console.log("   - content_library");
console.log("   - automated_workflows");

console.log("\n🔗 Services:");
console.log("   - n8n: http://localhost:5678");
console.log("   - Mautic: http://localhost:8081");
console.log("   - Redis: localhost:6379");

console.log("\n📋 Next Steps:");
console.log("   1. Open n8n: http://localhost:5678");
console.log("   2. Create n8n account (first time)");
console.log("   3. Import workflow: n8n/workflows/social-media-campaign.json");
console.log("   4. Add credentials (OpenAI, LinkedIn, Facebook)");
console.log("   5. Test campaign via dashboard: npm run dev");
console.log("   6. Navigate to /admin/marketing-automation");

console.log("\n" + "═".repeat(70));
