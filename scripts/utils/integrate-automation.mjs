// Integration: Edge Functions → n8n Marketing Automation
// This service bridges AI-generated content to marketing campaigns

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY";
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/auto-publish";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("🔗 Integration Service: Edge Functions ↔️ n8n Marketing\n");

// Monitor content_queue for new AI-generated content
async function monitorContentQueue() {
  console.log("👀 Monitoring content_queue for new AI-generated posts...\n");

  // Get pending blog posts from last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: pendingPosts, error } = await supabase
    .from("content_queue")
    .select("*")
    .eq("content_type", "blog_post")
    .eq("status", "pending")
    .gte("created_at", fiveMinutesAgo)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching posts:", error);
    return;
  }

  if (!pendingPosts || pendingPosts.length === 0) {
    console.log("⏳ No new pending posts found");
    return;
  }

  console.log(`✅ Found ${pendingPosts.length} new AI-generated post(s)\n`);

  // Process each post
  for (const post of pendingPosts) {
    await createMarketingCampaign(post);
  }
}

// Create marketing campaign from AI-generated content
async function createMarketingCampaign(contentItem) {
  console.log("📝 Creating marketing campaign for:", contentItem.title);

  try {
    // Get user (use first user for demo)
    const { data: users } = await supabase.auth.admin.listUsers();
    if (!users || users.users.length === 0) {
      console.log("⚠️  No users found, skipping...");
      return;
    }
    const userId = users.users[0].id;

    // Extract social media snippet from blog content
    const blogContent = contentItem.content || "";
    const firstParagraph = blogContent.split("\n\n")[1] || blogContent.substring(0, 280);
    const socialSnippet = firstParagraph.replace(/[#*]/g, "").trim();

    // Create marketing campaign
    const scheduledTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .insert({
        user_id: userId,
        name: `AUTO: ${contentItem.title}`,
        type: "social_media",
        status: "scheduled",
        content: `📝 ${contentItem.title}\n\n${socialSnippet}\n\n🔗 Read more: [Link to blog]`,
        platforms: ["linkedin", "facebook"],
        scheduled_at: scheduledTime.toISOString(),
        target_audience: {
          source: "ai_generated",
          content_queue_id: contentItem.id,
          topic: contentItem.metadata?.topic || "general",
          automated: true,
        },
      })
      .select()
      .single();

    if (campaignError) {
      console.error("❌ Campaign creation failed:", campaignError.message);
      return;
    }

    console.log(`✅ Campaign created: ${campaign.id}`);
    console.log(`   Scheduled for: ${new Date(campaign.scheduled_at).toLocaleString()}`);

    // Create individual posts for each platform
    for (const platform of campaign.platforms) {
      const { data: post } = await supabase
        .from("campaign_posts")
        .insert({
          campaign_id: campaign.id,
          platform,
          content: campaign.content,
          status: "pending",
        })
        .select()
        .single();

      console.log(`   ✅ ${platform} post queued`);
    }

    // Update content_queue status
    await supabase
      .from("content_queue")
      .update({
        status: "scheduled",
        metadata: {
          ...contentItem.metadata,
          marketing_campaign_id: campaign.id,
        },
      })
      .eq("id", contentItem.id);

    console.log(`   ✅ Content queue updated\n`);

    // Log activity
    await supabase.from("activity_logs").insert({
      action: "campaign_auto_created",
      status: "success",
      details: {
        content_queue_id: contentItem.id,
        campaign_id: campaign.id,
        platforms: campaign.platforms,
        scheduled_at: campaign.scheduled_at,
      },
    });
  } catch (error) {
    console.error("❌ Error creating campaign:", error.message);
  }
}

// Test the integration
async function testIntegration() {
  console.log("🧪 Testing Integration Flow\n");
  console.log("=".repeat(70));

  // Step 1: Create test contact (triggers Edge Function)
  console.log("\n1️⃣ Creating test contact (triggers AI generation)...");

  const { data: contact } = await supabase
    .from("contacts")
    .insert({
      name: "Integration Test User",
      email: "integration-test@longsang.com",
      message:
        "I need help with social media marketing automation. Can your platform help me schedule posts automatically across LinkedIn and Facebook?",
      phone: "0123456789",
      service: "Social Media Automation",
      company: "Test Company",
      budget: "medium",
    })
    .select()
    .single();

  console.log(`✅ Contact created: ${contact.id}`);
  console.log("⏳ Waiting 10 seconds for Edge Function to generate blog...");

  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Step 2: Check if blog was generated
  console.log("\n2️⃣ Checking for AI-generated content...");

  const { data: contentQueue } = await supabase
    .from("content_queue")
    .select("*")
    .eq("content_type", "blog_post")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (contentQueue) {
    console.log(`✅ Blog generated: ${contentQueue.title}`);
    console.log(`   Content length: ${contentQueue.content?.length || 0} chars`);

    // Step 3: Create marketing campaign
    console.log("\n3️⃣ Creating marketing campaign from AI content...");
    await createMarketingCampaign(contentQueue);

    // Step 4: Verify campaign
    console.log("\n4️⃣ Verifying marketing campaign...");
    const { data: campaigns } = await supabase
      .from("marketing_campaigns")
      .select("*, campaign_posts(*)")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (campaigns) {
      console.log("✅ Campaign verified:");
      console.log(`   Name: ${campaigns.name}`);
      console.log(`   Status: ${campaigns.status}`);
      console.log(`   Platforms: ${campaigns.platforms.join(", ")}`);
      console.log(`   Posts created: ${campaigns.campaign_posts.length}`);
      console.log(`   Scheduled: ${new Date(campaigns.scheduled_at).toLocaleString()}`);
    }
  } else {
    console.log("⚠️  No blog post found - Edge Function may not have run");
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 INTEGRATION TEST COMPLETE");
  console.log("=".repeat(70));
  console.log("\n📊 Flow Summary:");
  console.log("   1. Contact form → Edge Function → AI Blog (5-10 sec)");
  console.log("   2. Monitor → Detect new blog → Create campaign (instant)");
  console.log("   3. n8n scheduler → Optimize → Post to social (15 min)");
  console.log("\n💡 Next: n8n will auto-post in next 15-minute cycle");
}

// Main execution
const args = process.argv.slice(2);

if (args.includes("--test")) {
  testIntegration();
} else if (args.includes("--monitor")) {
  // Run monitor mode
  console.log("🔄 Starting continuous monitoring...\n");
  setInterval(monitorContentQueue, 60000); // Check every minute
  monitorContentQueue(); // Run once immediately
} else {
  console.log("Usage:");
  console.log("  node integrate-automation.mjs --test     # Test full integration");
  console.log("  node integrate-automation.mjs --monitor  # Monitor and auto-create campaigns");
  console.log("");
  console.log("Example flow:");
  console.log("  Contact → Edge Function → AI Blog → Marketing Campaign → n8n → Social Media");
}
