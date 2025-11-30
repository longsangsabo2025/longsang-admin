import OpenAI from 'openai';
import { analyzeDomain } from './crawler';
import type { KeywordAnalysis } from './keyword-generator';

export interface SEOTask {
  task: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  category: 'technical' | 'content' | 'links' | 'analytics';
  deadline?: string;
}

export interface ContentCalendar {
  month: number;
  year: number;
  topics: Array<{
    title: string;
    keywords: string[];
    contentType: 'blog' | 'guide' | 'tutorial' | 'video' | 'infographic';
    estimatedWordCount: number;
    targetAudience: string;
  }>;
}

export interface SEOPlan {
  domain: string;
  generatedAt: string;
  
  // Executive Summary
  summary: {
    currentState: string;
    targetGoals: string[];
    estimatedTimeToResults: string;
    budgetEstimate?: string;
  };

  // Technical SEO
  technicalSEO: SEOTask[];

  // Content Strategy
  contentStrategy: {
    overview: string;
    contentPillars: string[];
    publishingFrequency: string;
    calendar: ContentCalendar[];
  };

  // Link Building
  linkBuilding: {
    strategy: string[];
    targets: Array<{
      type: string;
      priority: string;
      estimatedDR: number;
    }>;
    outreachTemplates: string[];
  };

  // Timeline & Milestones
  timeline: {
    week1: SEOTask[];
    month1: SEOTask[];
    month3: SEOTask[];
    month6: SEOTask[];
  };

  // KPIs & Metrics
  kpis: {
    metric: string;
    currentValue: string;
    targetValue: string;
    timeframe: string;
  }[];
}

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
}

/**
 * Generate comprehensive SEO plan
 */
export async function generateSEOPlan(
  domain: string,
  keywords: KeywordAnalysis
): Promise<SEOPlan> {
  try {
    // Analyze domain
    const domainAnalysis = await analyzeDomain(domain);

    const prompt = `
You are a senior SEO strategist creating a comprehensive 6-month SEO plan.

DOMAIN ANALYSIS:
${domainAnalysis}

KEYWORD RESEARCH COMPLETED:
- Primary Keywords: ${keywords.primaryKeywords.length}
- Secondary Keywords: ${keywords.secondaryKeywords.length}
- Long-tail Keywords: ${keywords.longTailKeywords.length}
- Total Search Volume: ${keywords.avgSearchVolume * keywords.totalKeywords}/month

Top 10 Target Keywords:
${keywords.primaryKeywords.slice(0, 10).map(kw => `- ${kw.keyword} (${kw.searchVolume}/month, ${kw.competition} competition)`).join('\n')}

Create a detailed 6-month SEO implementation plan including:

1. EXECUTIVE SUMMARY
   - Current SEO state assessment
   - 3-5 specific target goals
   - Estimated time to see results
   - Budget estimate (if applicable)

2. TECHNICAL SEO (15-20 tasks)
   - Site speed optimization
   - Mobile responsiveness
   - Schema markup
   - XML sitemap
   - Robots.txt
   - SSL/HTTPS
   - Core Web Vitals
   - Internal linking
   - URL structure
   - Duplicate content
   - Each with priority, estimated time, deadline

3. CONTENT STRATEGY
   - Overview and approach
   - 5-7 content pillars based on keywords
   - Publishing frequency (posts/week)
   - 6-month content calendar (24 topics minimum)
   - Each topic with: title, target keywords, type, word count, audience

4. LINK BUILDING
   - 5-7 link building strategies
   - 10-15 target types (guest posts, directories, partnerships)
   - 2-3 outreach email templates

5. TIMELINE
   - Week 1: Quick wins and setup
   - Month 1: Foundation building
   - Month 3: Content & links ramping up
   - Month 6: Optimization & scaling

6. KPIs & METRICS
   - 8-10 key metrics to track
   - Current baseline values
   - Target values for 6 months
   - Timeframes

Return ONLY valid JSON (no markdown):
{
  "summary": {
    "currentState": "...",
    "targetGoals": ["goal1", "goal2"],
    "estimatedTimeToResults": "3-6 months",
    "budgetEstimate": "optional"
  },
  "technicalSEO": [
    {
      "task": "Task name",
      "priority": "critical|high|medium|low",
      "estimatedTime": "2 hours",
      "category": "technical",
      "deadline": "Week 1"
    }
  ],
  "contentStrategy": {
    "overview": "...",
    "contentPillars": ["pillar1", "pillar2"],
    "publishingFrequency": "3 posts/week",
    "calendar": [
      {
        "month": 1,
        "year": 2025,
        "topics": [
          {
            "title": "Topic title",
            "keywords": ["kw1", "kw2"],
            "contentType": "blog",
            "estimatedWordCount": 2000,
            "targetAudience": "audience description"
          }
        ]
      }
    ]
  },
  "linkBuilding": {
    "strategy": ["strategy1", "strategy2"],
    "targets": [
      {
        "type": "Guest posts",
        "priority": "high",
        "estimatedDR": 40
      }
    ],
    "outreachTemplates": ["template1", "template2"]
  },
  "timeline": {
    "week1": [...tasks],
    "month1": [...tasks],
    "month3": [...tasks],
    "month6": [...tasks]
  },
  "kpis": [
    {
      "metric": "Organic Traffic",
      "currentValue": "1,000/month",
      "targetValue": "5,000/month",
      "timeframe": "6 months"
    }
  ]
}
`;

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a senior SEO strategist creating comprehensive implementation plans. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(responseText);

    return {
      domain,
      generatedAt: new Date().toISOString(),
      summary: parsed.summary,
      technicalSEO: parsed.technicalSEO || [],
      contentStrategy: parsed.contentStrategy,
      linkBuilding: parsed.linkBuilding,
      timeline: parsed.timeline,
      kpis: parsed.kpis || []
    };

  } catch (error) {
    console.error('SEO plan generation error:', error);
    throw new Error(`Failed to generate SEO plan: ${error.message}`);
  }
}

/**
 * Generate quick action plan (for immediate implementation)
 */
export async function generateQuickWins(domain: string): Promise<SEOTask[]> {
  try {
    const domainAnalysis = await analyzeDomain(domain);

    const prompt = `
Analyze this website and identify 10-15 quick SEO wins that can be implemented immediately:

${domainAnalysis}

Focus on:
- Low-hanging fruit
- High impact, low effort tasks
- Technical issues that are easy to fix
- Content improvements that take < 1 hour each

Return ONLY valid JSON array:
[
  {
    "task": "Task description",
    "priority": "critical|high|medium",
    "estimatedTime": "30 minutes",
    "category": "technical|content|links|analytics",
    "deadline": "Today"
  }
]
`;

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an SEO expert identifying quick wins. Return valid JSON array only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content || '{"tasks":[]}';
    const parsed = JSON.parse(responseText);
    
    return parsed.tasks || parsed || [];

  } catch (error) {
    console.error('Quick wins generation error:', error);
    throw new Error(`Failed to generate quick wins: ${error.message}`);
  }
}

/**
 * Generate content outline for a specific keyword
 */
export async function generateContentOutline(
  keyword: string,
  wordCount: number = 2000
): Promise<{
  title: string;
  metaDescription: string;
  headings: string[];
  suggestedImages: string[];
  internalLinks: string[];
  cta: string;
}> {
  try {
    const prompt = `
Create a detailed content outline for:
Keyword: "${keyword}"
Target Word Count: ${wordCount} words

Provide:
1. SEO-optimized title (60 chars max)
2. Meta description (155 chars max)
3. H2 and H3 headings structure (8-12 headings)
4. Suggested images/visuals (5-7)
5. Internal linking opportunities (3-5)
6. Call-to-action

Return ONLY valid JSON:
{
  "title": "...",
  "metaDescription": "...",
  "headings": ["H2: heading", "H3: subheading"],
  "suggestedImages": ["image description"],
  "internalLinks": ["link topic"],
  "cta": "call to action text"
}
`;

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert content strategist. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content || '{}';
    return JSON.parse(responseText);

  } catch (error) {
    console.error('Content outline generation error:', error);
    throw new Error(`Failed to generate content outline: ${error.message}`);
  }
}
