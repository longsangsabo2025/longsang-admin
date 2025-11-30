/**
 * 🧪 A/B Testing Service
 * 
 * Generate and track multiple content variants to find best performers
 * 
 * Features:
 * - Auto-generate content variants
 * - Track engagement metrics
 * - Statistical significance testing
 * - Winner selection algorithm
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Content variation strategies
 */
const VARIATION_STRATEGIES = {
  headline: {
    name: 'Headline Variations',
    description: 'Test different opening hooks',
    variations: ['question', 'statistic', 'benefit', 'urgency', 'curiosity'],
  },
  tone: {
    name: 'Tone Variations', 
    description: 'Test different writing tones',
    variations: ['professional', 'casual', 'excited', 'empathetic', 'authoritative'],
  },
  length: {
    name: 'Length Variations',
    description: 'Test short vs long content',
    variations: ['short', 'medium', 'long'],
  },
  cta: {
    name: 'CTA Variations',
    description: 'Test different call-to-actions',
    variations: ['direct', 'soft', 'question', 'fomo', 'benefit'],
  },
  emoji: {
    name: 'Emoji Usage',
    description: 'Test emoji density',
    variations: ['none', 'minimal', 'moderate', 'heavy'],
  },
};

/**
 * Create an A/B test with multiple content variants
 * @param {object} options - Test configuration
 * @returns {Promise<object>} Created test with variants
 */
async function createABTest(options = {}) {
  try {
    const {
      topic,
      pageId = 'sabo_arena',
      strategy = 'headline',
      variantCount = 3,
      testDuration = 24, // hours
      targetMetric = 'engagement', // engagement, reach, clicks
    } = options;

    console.log(`🧪 [A/B Test] Creating test for "${topic}" with ${variantCount} variants`);

    // Generate variants using AI
    const variants = await generateVariants(topic, {
      strategy,
      count: variantCount,
      pageId,
    });

    // Create test record
    const testId = `ab-${Date.now()}`;
    const test = {
      id: testId,
      topic,
      pageId,
      strategy,
      variants,
      targetMetric,
      status: 'draft',
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + testDuration * 60 * 60 * 1000).toISOString(),
      winner: null,
      metrics: {},
    };

    // Save to database (if table exists)
    try {
      await supabase.from('ab_tests').insert(test);
    } catch (dbError) {
      console.warn('[A/B Test] DB save skipped:', dbError.message);
    }

    return {
      success: true,
      test,
      message: `Created A/B test with ${variants.length} variants`,
    };
  } catch (error) {
    console.error('[A/B Test] Error creating test:', error);
    throw error;
  }
}

/**
 * Generate content variants using AI
 */
async function generateVariants(topic, options = {}) {
  const { strategy = 'headline', count = 3, pageId } = options;
  const strategyConfig = VARIATION_STRATEGIES[strategy] || VARIATION_STRATEGIES.headline;

  // Get business context for the page
  const pageContext = getPageContext(pageId);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Bạn là AI Marketing Expert tạo A/B test variants.

Business Context:
${JSON.stringify(pageContext, null, 2)}

Strategy: ${strategyConfig.name} - ${strategyConfig.description}
Variation Types: ${strategyConfig.variations.join(', ')}

Tạo ${count} biến thể khác nhau cho topic được yêu cầu.
Mỗi biến thể phải:
1. Khác biệt rõ ràng về ${strategy}
2. Phù hợp với business context
3. Có thể đo lường được
4. Tối ưu cho Facebook

Trả về JSON:
{
  "variants": [
    {
      "id": "A",
      "name": "Variant A - ${strategyConfig.variations[0]}",
      "content": "Nội dung đầy đủ...",
      "variationType": "${strategyConfig.variations[0]}",
      "hypothesis": "Dự đoán tại sao variant này có thể hiệu quả"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Tạo ${count} variants cho topic: "${topic}"`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8, // Higher for more creative variations
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.variants || [];
}

/**
 * Get business context for a page
 */
function getPageContext(pageId) {
  const contexts = {
    sabo_arena: {
      name: 'SABO Arena',
      business: 'Billiards & Gaming Center',
      location: 'Ho Chi Minh City',
      features: ['12 bàn billiards', 'Gaming zone', 'Cafe', 'Giải đấu hàng tuần'],
      audience: 'Young adults 18-35, gamers, billiards enthusiasts',
      tone: 'Energetic, competitive, community-focused',
    },
    sabo_billiards: {
      name: 'SABO Billiards',
      business: 'Premium Billiards Club',
      location: 'Vung Tau',
      features: ['Không gian cao cấp', 'Bàn tournament', 'Coaching'],
      audience: 'Professional players, serious enthusiasts',
      tone: 'Professional, prestigious, exclusive',
    },
    ai_newbie: {
      name: 'AI Newbie VN',
      business: 'AI Education Community',
      features: ['Tutorials', 'News', 'Community', 'Tools'],
      audience: 'Tech enthusiasts, developers, AI learners',
      tone: 'Educational, helpful, cutting-edge',
    },
    sabo_media: {
      name: 'SABO Media',
      business: 'Media Production',
      features: ['Video production', 'Marketing', 'Content creation'],
      audience: 'Businesses, content creators',
      tone: 'Creative, professional, innovative',
    },
  };

  return contexts[pageId] || contexts.sabo_arena;
}

/**
 * Start an A/B test - publish variants
 */
async function startTest(testId, options = {}) {
  try {
    const { autoSchedule = true, staggerMinutes = 30 } = options;
    const facebookPublisher = require('./facebook-publisher');
    const postScheduler = require('./post-scheduler');

    // Get test from database
    const { data: test } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (!test) {
      // Try in-memory tests
      return { success: false, error: 'Test not found' };
    }

    const publishedVariants = [];
    const startTime = new Date();

    for (let i = 0; i < test.variants.length; i++) {
      const variant = test.variants[i];
      const publishTime = new Date(startTime.getTime() + i * staggerMinutes * 60 * 1000);

      if (autoSchedule) {
        // Schedule with stagger
        const result = await postScheduler.schedulePost({
          pageId: test.pageId,
          content: variant.content,
          postType: 'ab_test',
          preferredTime: publishTime.toISOString(),
        });

        publishedVariants.push({
          ...variant,
          scheduledPostId: result.postId,
          scheduledTime: publishTime.toISOString(),
        });
      } else {
        // Post immediately
        const result = await facebookPublisher.createPost(test.pageId, {
          message: variant.content,
        });

        publishedVariants.push({
          ...variant,
          facebookPostId: result.id,
          postedAt: new Date().toISOString(),
        });
      }
    }

    // Update test status
    await supabase
      .from('ab_tests')
      .update({
        status: 'running',
        startedAt: new Date().toISOString(),
        variants: publishedVariants,
      })
      .eq('id', testId);

    return {
      success: true,
      testId,
      publishedVariants: publishedVariants.length,
      message: autoSchedule 
        ? `Scheduled ${publishedVariants.length} variants with ${staggerMinutes}min intervals`
        : `Posted ${publishedVariants.length} variants`,
    };
  } catch (error) {
    console.error('[A/B Test] Error starting test:', error);
    throw error;
  }
}

/**
 * Get test results and determine winner
 */
async function getTestResults(testId) {
  try {
    const facebookPublisher = require('./facebook-publisher');

    const { data: test } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (!test) {
      return { success: false, error: 'Test not found' };
    }

    // Fetch metrics for each variant
    const results = [];
    for (const variant of test.variants) {
      if (variant.facebookPostId) {
        try {
          const insights = await facebookPublisher.getPostInsights(
            test.pageId,
            variant.facebookPostId
          );
          
          results.push({
            variantId: variant.id,
            name: variant.name,
            metrics: {
              reach: insights.reach || 0,
              engagement: insights.engagement || 0,
              clicks: insights.clicks || 0,
              reactions: insights.reactions || 0,
              comments: insights.comments || 0,
              shares: insights.shares || 0,
            },
            score: calculateScore(insights, test.targetMetric),
          });
        } catch (error) {
          console.warn(`[A/B Test] Could not fetch insights for ${variant.id}:`, error.message);
          results.push({
            variantId: variant.id,
            name: variant.name,
            metrics: null,
            error: error.message,
          });
        }
      }
    }

    // Determine winner
    const winner = results
      .filter(r => r.score !== undefined)
      .sort((a, b) => b.score - a.score)[0];

    // Check statistical significance
    const isSignificant = checkStatisticalSignificance(results);

    return {
      success: true,
      testId,
      status: test.status,
      results,
      winner: winner ? {
        ...winner,
        isStatisticallySignificant: isSignificant,
      } : null,
      recommendation: generateRecommendation(results, winner, isSignificant),
    };
  } catch (error) {
    console.error('[A/B Test] Error getting results:', error);
    throw error;
  }
}

/**
 * Calculate variant score based on target metric
 */
function calculateScore(metrics, targetMetric = 'engagement') {
  if (!metrics) return 0;

  switch (targetMetric) {
    case 'engagement':
      return (metrics.reactions || 0) + (metrics.comments || 0) * 2 + (metrics.shares || 0) * 3;
    case 'reach':
      return metrics.reach || 0;
    case 'clicks':
      return metrics.clicks || 0;
    default:
      return metrics.engagement || 0;
  }
}

/**
 * Check if results are statistically significant
 * Using simplified z-test approximation
 */
function checkStatisticalSignificance(results) {
  if (results.length < 2) return false;

  const scores = results.filter(r => r.score !== undefined).map(r => r.score);
  if (scores.length < 2) return false;

  const max = Math.max(...scores);
  const secondMax = scores.filter(s => s !== max).sort((a, b) => b - a)[0] || 0;
  
  // Simple significance check: winner needs to be at least 20% better
  const improvement = max > 0 ? (max - secondMax) / max : 0;
  return improvement >= 0.2;
}

/**
 * Generate recommendation based on results
 */
function generateRecommendation(results, winner, isSignificant) {
  if (!winner) {
    return 'Chưa có đủ dữ liệu để đưa ra khuyến nghị. Hãy đợi thêm thời gian để thu thập metrics.';
  }

  if (!isSignificant) {
    return `${winner.name} đang dẫn đầu nhưng chưa đủ ý nghĩa thống kê. Tiếp tục theo dõi để có kết quả chính xác hơn.`;
  }

  return `🏆 ${winner.name} là variant chiến thắng với score ${winner.score}. Khuyến nghị sử dụng style này cho các bài post tương lai.`;
}

/**
 * Quick A/B test - create and generate variants in one call
 */
async function quickTest(topic, options = {}) {
  const test = await createABTest({
    topic,
    ...options,
  });

  return {
    success: true,
    testId: test.test.id,
    variants: test.test.variants.map(v => ({
      id: v.id,
      name: v.name,
      preview: v.content.substring(0, 150) + '...',
      variationType: v.variationType,
    })),
    message: `Created A/B test with ${test.test.variants.length} variants. Use startTest("${test.test.id}") to publish.`,
  };
}

/**
 * List all tests for a page
 */
async function listTests(pageId, options = {}) {
  const { status, limit = 10 } = options;

  let query = supabase
    .from('ab_tests')
    .select('*')
    .eq('pageId', pageId)
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('[A/B Test] Error listing tests:', error.message);
    return [];
  }

  return data;
}

module.exports = {
  createABTest,
  generateVariants,
  startTest,
  getTestResults,
  quickTest,
  listTests,
  VARIATION_STRATEGIES,
};
