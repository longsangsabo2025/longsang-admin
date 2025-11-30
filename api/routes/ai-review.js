/**
 * AI Project Review API
 * Auto-review student project submissions using GPT-4
 */

const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * POST /api/ai-review
 * Generate AI-powered review for project submission
 */
router.post("/", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: "OpenAI service not configured" });
    }

    const { submissionId, title, description, github_url, demo_url } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required",
      });
    }

    console.error(`[AI Review] Reviewing project: ${title}`);

    // Build comprehensive review prompt
    const prompt = `You are an expert AI agent developer and instructor at Long Sang Academy.

Review this student's AI agent project submission and provide detailed, actionable feedback.

**Project Details:**
Title: ${title}
Description: ${description}
GitHub: ${github_url || "Not provided"}
Live Demo: ${demo_url || "Not provided"}

**Review Criteria:**
1. **Functionality** (30 points): Does it solve the problem? Is it working?
2. **Code Quality** (20 points): Clean code, error handling, documentation
3. **Innovation** (20 points): Creative approach, unique features
4. **Business Value** (20 points): Can this be sold to clients?
5. **Deployment** (10 points): Is it deployed and accessible?

**Instructions:**
- Be encouraging but honest
- Focus on practical improvements
- Relate feedback to real-world client needs
- Use Vietnamese mixed with English terms naturally
- Provide specific, actionable next steps

**Response Format (JSON):**
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "strengths": [
    "List 3-5 specific strengths"
  ],
  "improvements": [
    "List 3-5 areas for improvement"
  ],
  "feedback": "2-3 paragraph overall feedback",
  "next_steps": [
    "List 3-4 recommended next steps"
  ],
  "business_potential": "1 paragraph on monetization potential",
  "estimated_value": "<Monthly price range this could sell for>"
}

Return ONLY valid JSON, nothing else.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI agent developer and coding instructor. Provide detailed, practical reviews focused on real-world application and monetization.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const reviewText = completion.choices[0]?.message?.content;

    if (!reviewText) {
      throw new Error("No review generated");
    }

    const review = JSON.parse(reviewText);

    console.error(`[AI Review] Generated review with score: ${review.score}/100`);

    // Return review
    return res.status(200).json({
      success: true,
      review: review,
      usage: {
        tokens: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error("[AI Review] Error:", error);

    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again in a moment.",
      });
    }

    return res.status(500).json({
      error: "Failed to generate review. Please try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/ai-review/submission/:id
 * Get existing review for a submission
 */
router.get("/submission/:id", async (req, res) => {
  try {
    const { createClient } = require("@supabase/supabase-js");

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("project_submissions")
      .select("ai_review, status, grade")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;

    if (!data || !data.ai_review) {
      return res.status(404).json({
        error: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      review: data.ai_review,
      status: data.status,
      grade: data.grade,
    });
  } catch (error) {
    console.error("[AI Review] Get review error:", error);

    return res.status(500).json({
      error: "Failed to fetch review",
    });
  }
});

module.exports = router;
