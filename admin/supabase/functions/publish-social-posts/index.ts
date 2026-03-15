// Edge Function: publish-social-posts
// Runs every 15 minutes to publish scheduled social media posts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("📱 Checking for scheduled social posts...");

    // Get scheduled posts ready to publish
    const now = new Date().toISOString();
    const { data: posts, error: fetchError } = await supabase
      .from("content_queue")
      .select("*")
      .eq("content_type", "social_post")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .limit(10);

    if (fetchError) throw fetchError;

    if (!posts || posts.length === 0) {
      console.log("✅ No posts to publish");
      return new Response(JSON.stringify({ message: "No posts to publish", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🚀 Found ${posts.length} posts to publish`);

    const results = [];
    for (const post of posts) {
      try {
        // Get platforms from metadata
        const platforms = post.metadata?.platforms || ["linkedin"];
        const publishResults = [];

        // Publish to each platform
        for (const platform of platforms) {
          try {
            await publishToSocialMedia(platform, post);
            publishResults.push({ platform, status: "success" });
          } catch (error) {
            console.error(`Failed to publish to ${platform}:`, error);
            publishResults.push({ platform, status: "failed", error: error.message });
          }
        }

        // Check if at least one platform succeeded
        const hasSuccess = publishResults.some((r) => r.status === "success");

        // Update status
        await supabase
          .from("content_queue")
          .update({
            status: hasSuccess ? "completed" : "failed",
            published_at: hasSuccess ? new Date().toISOString() : null,
            metadata: {
              ...post.metadata,
              publish_results: publishResults,
            },
          })
          .eq("id", post.id);

        // Log activity
        await supabase.from("activity_logs").insert({
          agent_id: post.agent_id,
          action: "social_post_published",
          status: hasSuccess ? "success" : "failed",
          details: {
            post_id: post.id,
            platforms: publishResults,
          },
        });

        results.push({
          id: post.id,
          status: hasSuccess ? "published" : "failed",
          platforms: publishResults,
        });

        console.log(`✅ Processed post ${post.id}:`, publishResults);
      } catch (error) {
        console.error(`❌ Failed to process post ${post.id}:`, error);

        // Update retry count
        const retryCount = (post.metadata?.retry_count || 0) + 1;
        const maxRetries = 3;

        if (retryCount >= maxRetries) {
          await supabase.from("content_queue").update({ status: "failed" }).eq("id", post.id);
        } else {
          await supabase
            .from("content_queue")
            .update({
              metadata: {
                ...post.metadata,
                retry_count: retryCount,
                last_error: error.message,
              },
            })
            .eq("id", post.id);
        }

        results.push({ id: post.id, status: "failed", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: posts.length,
        results: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in publish-social-posts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Publish to specific social media platform
async function publishToSocialMedia(platform: string, post: any): Promise<void> {
  const content = post.generated_content || post.metadata?.content;

  switch (platform.toLowerCase()) {
    case "linkedin":
      return await publishToLinkedIn(content);
    case "facebook":
      return await publishToFacebook(content);
    case "twitter":
    case "x":
      throw new Error("Twitter/X requires OAuth 1.0a - use Zapier or Buffer");
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Publish to LinkedIn
async function publishToLinkedIn(content: string): Promise<void> {
  const accessToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  if (!accessToken) {
    throw new Error("LINKEDIN_ACCESS_TOKEN not configured");
  }

  // Get LinkedIn user ID
  const userResponse = await fetch("https://api.linkedin.com/v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to get LinkedIn user ID");
  }

  const userData = await userResponse.json();
  const userId = userData.id;

  // Create post
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${userId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${error}`);
  }
}

// Publish to Facebook
async function publishToFacebook(content: string): Promise<void> {
  const accessToken = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
  const pageId = Deno.env.get("FACEBOOK_PAGE_ID");

  if (!accessToken || !pageId) {
    throw new Error("FACEBOOK_ACCESS_TOKEN or FACEBOOK_PAGE_ID not configured");
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: content,
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
  }
}
