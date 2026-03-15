#!/usr/bin/env node
/**
 * Create Real Campaign with Authenticated User
 * This creates a campaign that will actually post to social media
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://diexsbzqwsbpilsymnfb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I"
);

console.log("🚀 Creating Real Marketing Campaign...\n");

// Check for user
const { data: users } = await supabase.from("profiles").select("id, email").limit(1);

if (!users || users.length === 0) {
  console.log("❌ No users found!");
  console.log("📝 Please create a user first:");
  console.log("   1. Open http://localhost:5173");
  console.log("   2. Sign up with email");
  console.log("   3. Run this script again\n");
  process.exit(1);
}

const userId = users[0].id;
console.log(`✅ Found user: ${users[0].email} (${userId})\n`);

// Schedule time: 2 minutes from now
const scheduledAt = new Date(Date.now() + 2 * 60 * 1000);

// Create campaign
const { data: campaign, error: campaignError } = await supabase
  .from("marketing_campaigns")
  .insert({
    user_id: userId,
    name: "LongSang Platform Launch 🚀",
    type: "social_media",
    status: "scheduled",
    content: `Exciting news! 🎉

We're launching LongSang - the AI-powered automation platform that helps solo founders automate their marketing!

✨ Features:
- Auto-posting to LinkedIn, Facebook, Twitter
- AI content optimization
- Lead nurturing automation
- Email campaign management

Join us: https://longsang.org

#AI #Automation #Marketing #SoloFounder`,
    platforms: ["linkedin", "facebook"],
    scheduled_at: scheduledAt.toISOString(),
    settings: {
      optimize_with_ai: true,
      auto_hashtags: true,
    },
  })
  .select()
  .single();

if (campaignError) {
  console.log("❌ Campaign creation failed:", campaignError);
  process.exit(1);
}

console.log(`✅ Campaign created: ${campaign.id}`);
console.log(`📅 Scheduled for: ${scheduledAt.toLocaleString("vi-VN")}\n`);

// Create posts for each platform
const platforms = ["linkedin", "facebook"];
for (const platform of platforms) {
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

  console.log(`✅ ${platform} post created (ID: ${post.id})`);
}

console.log("\n🎯 WHAT HAPPENS NEXT:\n");
console.log("1. n8n workflow checks database every 15 minutes");
console.log(`2. At ${scheduledAt.toLocaleString("vi-VN")}, it finds your campaign`);
console.log("3. AI optimizes content for each platform");
console.log("4. Posts to LinkedIn and Facebook automatically");
console.log("5. Updates database with results\n");

console.log("📍 WHERE TO SEE POSTS:\n");
console.log("LinkedIn:");
console.log("  - Check your LinkedIn profile feed");
console.log("  - Or company page (if configured)\n");
console.log("Facebook:");
console.log("  - Check your Facebook page posts");
console.log("  - URL format: facebook.com/YOUR_PAGE_ID/posts\n");

console.log("🔍 MONITORING:\n");
console.log("1. n8n Executions: http://localhost:5678/executions");
console.log("2. Check campaign status:");
console.log(
  `   node -e "import('@supabase/supabase-js').then(async({createClient})=>{const s=createClient('https://diexsbzqwsbpilsymnfb.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I');const{data}=await s.from('campaign_posts').select('platform,status,posted_at,post_url').eq('campaign_id','${campaign.id}');console.log(JSON.stringify(data,null,2))})"`
);

console.log("\n⚠️  IMPORTANT:");
console.log("Make sure you have configured social media credentials in n8n!");
console.log("Without credentials, posts will fail.\n");

console.log("✨ Campaign ready! Wait for auto-posting... 🚀\n");
