import OpenAI from 'openai';
import { analyzeDomain } from './crawler';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  difficulty: number; // 0-100
  relevance: number; // 0-100
}

export interface KeywordAnalysis {
  domain: string;
  primaryKeywords: KeywordData[];      // Top 10 main keywords
  secondaryKeywords: KeywordData[];    // 20-30 supporting keywords
  longTailKeywords: KeywordData[];     // 30-50 long-tail phrases
  totalKeywords: number;
  avgSearchVolume: number;
  recommendations: string[];
}

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY or OPENAI_API_KEY in .env');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // For frontend use
  });
}

/**
 * Generate keywords using OpenAI GPT-4
 */
export async function generateKeywords(domain: string): Promise<KeywordAnalysis> {
  try {
    // 1. Analyze domain
    console.log(`🔍 Analyzing domain: ${domain}...`);
    const domainAnalysis = await analyzeDomain(domain);

    // 2. Create AI prompt
    const prompt = `
You are an expert SEO specialist. Analyze this website and generate a comprehensive keyword strategy.

${domainAnalysis}

Generate 60-100 keywords in the following categories:

1. PRIMARY KEYWORDS (10 keywords):
   - High search volume (10k-100k+/month)
   - Highly relevant to the business
   - Medium to high competition
   - Target the main services/products

2. SECONDARY KEYWORDS (30 keywords):
   - Medium search volume (1k-10k/month)
   - Supporting the primary keywords
   - Lower competition
   - More specific services/features

3. LONG-TAIL KEYWORDS (50 keywords):
   - Low to medium search volume (100-1k/month)
   - Very specific queries
   - Low competition
   - High conversion intent

For EACH keyword, provide:
- Search Volume (estimated monthly searches)
- Competition Level (low/medium/high)
- Search Intent (informational/commercial/transactional/navigational)
- SEO Difficulty (0-100)
- Relevance Score (0-100)

Also provide 5-10 strategic recommendations for SEO.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "primaryKeywords": [
    {
      "keyword": "example keyword",
      "searchVolume": 50000,
      "competition": "high",
      "intent": "commercial",
      "difficulty": 75,
      "relevance": 95
    }
  ],
  "secondaryKeywords": [...],
  "longTailKeywords": [...],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}
`;

    // 3. Call OpenAI
    console.log('🤖 Generating keywords with AI...');
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO specialist who generates comprehensive keyword strategies. Always return valid JSON only, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    // 4. Parse response
    const responseText = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(responseText);

    // 5. Calculate statistics
    const allKeywords = [
      ...parsed.primaryKeywords,
      ...parsed.secondaryKeywords,
      ...parsed.longTailKeywords
    ];

    const totalSearchVolume = allKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
    const avgSearchVolume = Math.round(totalSearchVolume / allKeywords.length);

    console.log(`✅ Generated ${allKeywords.length} keywords!`);

    return {
      domain,
      primaryKeywords: parsed.primaryKeywords || [],
      secondaryKeywords: parsed.secondaryKeywords || [],
      longTailKeywords: parsed.longTailKeywords || [],
      totalKeywords: allKeywords.length,
      avgSearchVolume,
      recommendations: parsed.recommendations || []
    };

  } catch (error) {
    console.error('❌ Keyword generation error:', error);
    throw new Error(`Failed to generate keywords: ${error.message}`);
  }
}

/**
 * Generate keywords for specific language/market
 */
export async function generateLocalizedKeywords(
  domain: string,
  language: 'vi' | 'en' = 'en',
  country?: string
): Promise<KeywordAnalysis> {
  try {
    const domainAnalysis = await analyzeDomain(domain);

    const languageMap = {
      vi: 'Vietnamese (Vietnam)',
      en: 'English'
    };

    const prompt = `
You are an expert SEO specialist specializing in ${languageMap[language]} markets.

${domainAnalysis}

Generate 60-100 keywords in ${languageMap[language]} language${country ? ` for ${country} market` : ''}.

IMPORTANT:
- All keywords MUST be in ${languageMap[language]} language
- Consider local search behavior and terminology
- Include local variations and slang if applicable
- Consider seasonal trends in ${country || 'the region'}

Follow the same structure: 10 primary, 30 secondary, 50 long-tail keywords.

Return ONLY valid JSON (no markdown):
{
  "primaryKeywords": [...],
  "secondaryKeywords": [...],
  "longTailKeywords": [...],
  "recommendations": [...]
}
`;

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO specialist for ${languageMap[language]} markets. Always return valid JSON only.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(responseText);

    const allKeywords = [
      ...parsed.primaryKeywords,
      ...parsed.secondaryKeywords,
      ...parsed.longTailKeywords
    ];

    const totalSearchVolume = allKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0);
    const avgSearchVolume = Math.round(totalSearchVolume / allKeywords.length);

    return {
      domain,
      primaryKeywords: parsed.primaryKeywords || [],
      secondaryKeywords: parsed.secondaryKeywords || [],
      longTailKeywords: parsed.longTailKeywords || [],
      totalKeywords: allKeywords.length,
      avgSearchVolume,
      recommendations: parsed.recommendations || []
    };

  } catch (error) {
    console.error('Localized keyword generation error:', error);
    throw new Error(`Failed to generate localized keywords: ${error.message}`);
  }
}

/**
 * Analyze competitor keywords
 */
export async function analyzeCompetitors(
  domain: string,
  competitors: string[]
): Promise<{
  competitorKeywords: Record<string, KeywordData[]>;
  opportunities: KeywordData[];
  gaps: string[];
}> {
  try {
    const analyses = await Promise.all(
      competitors.map(comp => analyzeDomain(comp))
    );

    const prompt = `
You are an expert SEO competitor analyst.

YOUR WEBSITE: ${domain}

COMPETITORS:
${analyses.map((analysis, i) => `
${i + 1}. ${competitors[i]}
${analysis}
`).join('\n')}

Analyze the competitive landscape and identify:

1. Top keywords competitors are ranking for
2. Keyword opportunities (low competition, high value)
3. Keyword gaps (what competitors have that you don't)

Return ONLY valid JSON:
{
  "competitorKeywords": {
    "competitor1.com": [...],
    "competitor2.com": [...]
  },
  "opportunities": [...],
  "gaps": ["gap 1", "gap 2"]
}
`;

    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert SEO competitor analyst. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content || '{}';
    return JSON.parse(responseText);

  } catch (error) {
    console.error('Competitor analysis error:', error);
    throw new Error(`Failed to analyze competitors: ${error.message}`);
  }
}
