// Edge Function: trigger-content-writer
// Automatically generates blog posts when contact form is submitted

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface ContentQueueItem {
  title: string;
  content_type: string;
  status: string;
  priority: number;
  content?: string; // AI-generated content
  metadata: {
    topic: string;
    source: string;
    contact_id: string;
  };
  agent_id: string | null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request data
    const { record } = (await req.json()) as { record: ContactSubmission };

    console.log("📝 New contact submission:", {
      id: record.id,
      name: record.name,
      email: record.email,
    });

    // Extract topic from message (simple keyword extraction)
    const topic = extractTopic(record.message);
    console.log("🎯 Extracted topic:", topic);

    // Get Content Writer agent ID
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("type", "content_writer")
      .eq("status", "active")
      .single();

    if (!agent) {
      console.error("❌ Content Writer agent not found or not active");
      return new Response(JSON.stringify({ error: "Content Writer agent not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Generate blog post using AI
    const blogContent = await generateBlogPost(topic, record.message);

    // Add to content queue
    const contentItem: ContentQueueItem = {
      title: `${topic} - Auto-generated from contact form`,
      content_type: "blog_post",
      status: "pending",
      priority: 3, // Medium priority
      content: blogContent, // Add AI-generated content
      metadata: {
        topic: topic,
        source: "contact_form",
        contact_id: record.id,
      },
      agent_id: agent.id,
    };

    const { data: queueItem, error: queueError } = await supabase
      .from("content_queue")
      .insert(contentItem)
      .select()
      .single();

    if (queueError) {
      console.error("❌ Error adding to content queue:", queueError);
      throw queueError;
    }

    console.log("✅ Content added to queue:", queueItem.id);

    // Log activity
    await supabase.from("activity_logs").insert({
      agent_id: agent.id,
      action: "content_generated",
      status: "success",
      details: {
        topic: topic,
        contact_id: record.id,
        queue_item_id: queueItem.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        queue_item_id: queueItem.id,
        topic: topic,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in trigger-content-writer:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Extract main topic from message
function extractTopic(message: string): string {
  // Simple keyword extraction - in production, use NLP
  const keywords = [
    "automation",
    "ai",
    "marketing",
    "seo",
    "content",
    "social media",
    "email",
    "workflow",
    "integration",
    "analytics",
    "dashboard",
    "agent",
    "chatbot",
  ];

  const lowerMessage = message.toLowerCase();
  for (const keyword of keywords) {
    if (lowerMessage.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }

  return "General Inquiry";
}

// Generate blog post using AI
async function generateBlogPost(topic: string, context: string): Promise<string> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  // Use OpenAI if available
  if (openaiKey) {
    return await generateWithOpenAI(topic, context, openaiKey);
  }

  // Fall back to Anthropic
  if (anthropicKey) {
    return await generateWithAnthropic(topic, context, anthropicKey);
  }

  // No AI keys configured - return template
  console.warn("⚠️ No AI keys configured, using template");
  return `# ${topic}\n\n[Auto-generated blog post about ${topic}]\n\nContext: ${context}`;
}

// Generate with OpenAI
async function generateWithOpenAI(topic: string, context: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional content writer. Write engaging, SEO-optimized blog posts.",
        },
        {
          role: "user",
          content: `Write a blog post about "${topic}". Context from user inquiry: ${context}.

          Make it:
          - 500-800 words
          - SEO-optimized with keywords
          - Engaging and informative
          - Include actionable tips
          - Format in Markdown`,
        },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate with Anthropic
async function generateWithAnthropic(
  topic: string,
  context: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Write a blog post about "${topic}". Context from user inquiry: ${context}.

          Make it:
          - 500-800 words
          - SEO-optimized with keywords
          - Engaging and informative
          - Include actionable tips
          - Format in Markdown`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}
