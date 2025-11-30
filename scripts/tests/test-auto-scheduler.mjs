import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://diexsbzqwsbpilsymnfb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"
);

console.log("🧪 Testing Auto Scheduler Workflow\n");

// Get user
const { data: users } = await supabase.auth.admin.listUsers();
const userId = users.users[0].id;

// Create a scheduled campaign for NOW
console.log("1️⃣ Creating auto-scheduled campaign...");
const scheduledTime = new Date(Date.now() + 60000); // 1 minute from now

const { data: campaign, error } = await supabase
  .from("marketing_campaigns")
  .insert({
    user_id: userId,
    name: "AUTO: Test Scheduled Post",
    type: "social_media",
    status: "scheduled",
    content:
      "🚀 Testing automated social media posting! This post was automatically scheduled and will be published by n8n workflow.",
    platforms: ["linkedin", "facebook"],
    scheduled_at: scheduledTime.toISOString(),
    target_audience: {
      test: true,
      automated: true,
    },
  })
  .select()
  .single();

if (error) {
  console.log("❌ Failed:", error.message);
  process.exit(1);
}

console.log(`✅ Campaign created: ${campaign.id}`);
console.log(`   Status: ${campaign.status}`);
console.log(`   Scheduled for: ${new Date(campaign.scheduled_at).toLocaleString()}`);

// Create pending posts
console.log("\n2️⃣ Creating pending posts...");
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

  console.log(`   ✅ ${platform} post ready`);
}

console.log("\n" + "═".repeat(70));
console.log("🎯 AUTO SCHEDULER TEST SETUP COMPLETE");
console.log("═".repeat(70));
console.log("\n📋 What will happen next:");
console.log("   1. n8n scheduler runs every 15 minutes");
console.log("   2. Finds campaigns with scheduled_at <= NOW()");
console.log('   3. Marks campaign as "running"');
console.log("   4. AI optimizes content for each platform");
console.log("   5. Posts to LinkedIn & Facebook automatically");
console.log("   6. Saves results to database");
console.log('   7. Updates campaign status to "completed"');

console.log("\n⏱️ Timeline:");
console.log(`   Now: ${new Date().toLocaleTimeString()}`);
console.log(`   Scheduled: ${scheduledTime.toLocaleTimeString()}`);
console.log(`   Next check: Within 15 minutes`);

console.log("\n🔍 Monitor Progress:");
console.log("   Database: Check marketing_campaigns.status");
console.log("   n8n: http://localhost:5678/executions");
console.log("   Posts: Check campaign_posts table");

console.log("\n💡 Test Commands:");
console.log("   # Check campaign status");
console.log(
  `   node -e "import('@supabase/supabase-js').then(async({createClient})=>{const s=createClient('https://diexsbzqwsbpilsymnfb.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY');const c=await s.from('marketing_campaigns').select('*').eq('id','${campaign.id}').single();console.log('Status:',c.data.status);const p=await s.from('campaign_posts').select('*').eq('campaign_id','${campaign.id}');console.log('Posts:');for(const x of p.data)console.log(' -',x.platform,x.status)})"`
);

console.log("\n" + "═".repeat(70));
console.log("✅ Ready for auto-posting! Workflow will run in next 15 min cycle.");
console.log("═".repeat(70));
