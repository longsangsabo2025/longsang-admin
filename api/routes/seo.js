const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// Initialize clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "dummy-key";
const openai =
  openaiApiKey && openaiApiKey !== "dummy-key" ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Crawl website
 */
async function crawlWebsite(domain) {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;

  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const $ = cheerio.load(response.data);

  // Remove scripts, styles
  $("script, style, nav, footer, header").remove();

  const title = $("title").text().trim() || $('meta[property="og:title"]').attr("content") || "";
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  const content = $("body").text().replaceAll(/\s+/g, " ").trim().slice(0, 5000);

  const headings = {
    h1: $("h1")
      .map((_, el) => $(el).text().trim())
      .get(),
    h2: $("h2")
      .map((_, el) => $(el).text().trim())
      .get(),
  };

  return {
    url,
    title,
    description,
    content,
    headings,
  };
}

/**
 * Discover pages
 */
async function discoverPages(domain) {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const sitemapUrl = `${url}/sitemap.xml`;

    const response = await axios.get(sitemapUrl, { timeout: 5000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const urls = $("url > loc")
      .map((_, el) => $(el).text())
      .get();
    return urls.length > 0 ? urls : [url];
  } catch {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    return [url];
  }
}

/**
 * POST /api/seo/analyze
 * Analyze domain and generate keywords + SEO plan
 */
router.post("/analyze", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: "OpenAI service not configured" });
    }

    const { domain, language = "en", country } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    console.log(`Analyzing domain: ${domain} (${language})`);

    // 1. Crawl domain
    const crawlData = await crawlWebsite(domain);

    // 2. Generate keywords with AI
    const keywordsPrompt = `
You are an expert SEO specialist. Analyze this website and generate keywords in ${
      language === "vi" ? "Vietnamese" : "English"
    } language.

WEBSITE: ${domain}
Title: ${crawlData.title}
Description: ${crawlData.description}
Main Headings: ${crawlData.headings.h1.slice(0, 5).join(", ")}
Content: ${crawlData.content.slice(0, 1000)}

Generate 60-90 keywords:
- 10 PRIMARY keywords (high volume 10k-100k/month, high competition)
- 30 SECONDARY keywords (medium volume 1k-10k/month, medium competition)
- 50 LONG-TAIL keywords (low volume 100-1k/month, low competition)

Return ONLY valid JSON:
{
  "primaryKeywords": [{"keyword":"","searchVolume":0,"competition":"high|medium|low","intent":"informational|commercial|transactional","difficulty":0,"relevance":0}],
  "secondaryKeywords": [...],
  "longTailKeywords": [...],
  "recommendations": ["rec1", "rec2"]
}`;

    const keywordsResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert SEO specialist. Return valid JSON only." },
        { role: "user", content: keywordsPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const keywords = JSON.parse(keywordsResponse.choices[0].message.content);

    // 3. Generate SEO plan
    const planPrompt = `
Create a 6-month SEO plan for: ${domain}

Keywords: ${
      keywords.primaryKeywords.length +
      keywords.secondaryKeywords.length +
      keywords.longTailKeywords.length
    } total

Return ONLY valid JSON:
{
  "summary": {"currentState":"","targetGoals":[],"estimatedTimeToResults":"","budgetEstimate":""},
  "technicalSEO": [{"task":"","priority":"critical|high|medium|low","estimatedTime":"","category":"technical","deadline":""}],
  "contentStrategy": {"overview":"","contentPillars":[],"publishingFrequency":"","calendar":[{"month":1,"year":2025,"topics":[{"title":"","keywords":[],"contentType":"blog","estimatedWordCount":0,"targetAudience":""}]}]},
  "linkBuilding": {"strategy":[],"targets":[{"type":"","priority":"","estimatedDR":0}],"outreachTemplates":[]},
  "timeline": {"week1":[],"month1":[],"month3":[],"month6":[]},
  "kpis": [{"metric":"","currentValue":"","targetValue":"","timeframe":""}]
}`;

    const planResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a senior SEO strategist. Return valid JSON only." },
        { role: "user", content: planPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const plan = JSON.parse(planResponse.choices[0].message.content);

    // 4. Discover pages
    const pages = await discoverPages(domain);

    // Calculate stats
    const allKeywords = [
      ...keywords.primaryKeywords,
      ...keywords.secondaryKeywords,
      ...keywords.longTailKeywords,
    ];
    const totalSearchVolume = allKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
    const avgSearchVolume = Math.round(totalSearchVolume / allKeywords.length);

    res.json({
      success: true,
      data: {
        domain,
        keywords: {
          ...keywords,
          totalKeywords: allKeywords.length,
          avgSearchVolume,
        },
        plan: {
          ...plan,
          domain,
          generatedAt: new Date().toISOString(),
        },
        pages: pages.slice(0, 50),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze domain",
    });
  }
});

/**
 * POST /api/seo/execute
 * Execute full SEO automation for a domain
 */
router.post("/execute", async (req, res) => {
  try {
    const { domain, keywords, plan, autoIndex = true } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    // 1. Check if domain exists
    const { data: existingDomain } = await supabase
      .from("seo_domains")
      .select("id")
      .eq("url", domain)
      .single();

    let domainId = existingDomain?.id;

    // 2. Create domain if doesn't exist
    if (!domainId) {
      const { data: newDomain, error } = await supabase
        .from("seo_domains")
        .insert({
          name: domain.replace(/^https?:\/\//, "").replace(/^www\./, ""),
          url: domain.startsWith("http") ? domain : `https://${domain}`,
          enabled: true,
          auto_indexing: autoIndex,
        })
        .select()
        .single();

      if (error) throw error;
      domainId = newDomain.id;
    }

    // 3. Save keywords to database
    if (keywords) {
      const allKeywords = [
        ...keywords.primaryKeywords.map((kw) => ({ ...kw, type: "primary" })),
        ...keywords.secondaryKeywords.map((kw) => ({ ...kw, type: "secondary" })),
        ...keywords.longTailKeywords.map((kw) => ({ ...kw, type: "longtail" })),
      ];

      const keywordsToInsert = allKeywords.map((kw) => ({
        domain_id: domainId,
        keyword: kw.keyword,
        search_volume: kw.searchVolume,
        competition: kw.competition,
        difficulty: kw.difficulty || 50,
        current_position: null,
        target_position: 10,
      }));

      await supabase.from("seo_keywords").insert(keywordsToInsert);
    }

    // 4. Save SEO plan settings
    if (plan) {
      await supabase.from("seo_settings").upsert({
        domain_id: domainId,
        settings: {
          plan,
          auto_indexing: autoIndex,
          auto_content: false, // Can be enabled later
        },
      });
    }

    // 5. Discover and queue pages for indexing
    const pages = await discoverPages(domain);

    if (pages.length > 0 && autoIndex) {
      const pagesToQueue = pages.map((url) => ({
        domain_id: domainId,
        url,
        status: "pending",
        priority: url === domain ? "high" : "normal",
      }));

      await supabase.from("seo_indexing_queue").insert(pagesToQueue);
    }

    res.json({
      success: true,
      data: {
        domainId,
        keywordsAdded: keywords
          ? keywords.primaryKeywords.length +
            keywords.secondaryKeywords.length +
            keywords.longTailKeywords.length
          : 0,
        pagesQueued: pages.length,
        autoIndexing: autoIndex,
        message: "SEO automation started successfully!",
      },
    });
  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to execute SEO automation",
    });
  }
});

/**
 * POST /api/seo/quick-wins
 * Get quick SEO wins
 */
router.post("/quick-wins", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const crawlData = await crawlWebsite(domain);

    const prompt = `
Analyze this website and identify 10-15 quick SEO wins (low effort, high impact):

${domain}
Title: ${crawlData.title}
Description: ${crawlData.description}

Return ONLY valid JSON array:
[{"task":"","priority":"critical|high|medium","estimatedTime":"","category":"technical|content|links","deadline":""}]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an SEO expert. Return valid JSON array only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    const tasks = result.tasks || result || [];

    res.json({ success: true, data: { domain, tasks, count: tasks.length } });
  } catch (error) {
    console.error("Quick wins error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/seo/crawl/:domain
 */
router.get("/crawl/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    const crawlData = await crawlWebsite(domain);
    res.json({ success: true, data: crawlData });
  } catch (error) {
    console.error("Crawl error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
