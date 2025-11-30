/**
 * 🧠 Copilot Learner Service
 *
 * Advanced Learning system with:
 * - Feedback collection & analysis
 * - Pattern recognition from behavior
 * - Content style auto-adjustment
 * - Preference learning & personalization
 *
 * @author LongSang Admin
 * @version 2.0.0 - Enhanced with Advanced Learning
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const embeddingService = require('./embedding-service');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_MODEL = 'gpt-4o-mini';

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED CONTENT STYLE LEARNING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze content performance patterns to auto-adjust style
 */
async function analyzeContentPerformance(pageId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get content performance data
    const { data: contentData, error } = await supabase
      .from('content_performance')
      .select('*')
      .eq('page_id', pageId)
      .gte('posted_at', startDate.toISOString())
      .order('engagement_rate', { ascending: false });
    
    if (error) throw error;
    if (!contentData || contentData.length < 5) {
      return { success: false, message: 'Not enough data for analysis' };
    }

    // Separate top and bottom performers
    const topPerformers = contentData.slice(0, Math.ceil(contentData.length * 0.3));
    const bottomPerformers = contentData.slice(-Math.ceil(contentData.length * 0.3));

    // Analyze patterns using AI
    const analysisResult = await analyzeContentPatterns(topPerformers, bottomPerformers, pageId);
    
    // Store learned patterns
    if (analysisResult.patterns) {
      await storeContentPatterns(pageId, analysisResult.patterns);
    }

    return {
      success: true,
      topPerformersCount: topPerformers.length,
      bottomPerformersCount: bottomPerformers.length,
      patterns: analysisResult.patterns,
      recommendations: analysisResult.recommendations,
    };
  } catch (error) {
    console.error('Error analyzing content performance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Use AI to analyze patterns in content
 */
async function analyzeContentPatterns(topPerformers, bottomPerformers, pageId) {
  const topSamples = topPerformers.slice(0, 5).map(c => ({
    content: c.content_preview,
    engagement: c.engagement_rate,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    time: new Date(c.posted_at).getHours(),
    dayOfWeek: new Date(c.posted_at).getDay(),
  }));

  const bottomSamples = bottomPerformers.slice(0, 5).map(c => ({
    content: c.content_preview,
    engagement: c.engagement_rate,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    time: new Date(c.posted_at).getHours(),
    dayOfWeek: new Date(c.posted_at).getDay(),
  }));

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Bạn là Content Performance Analyst. Phân tích patterns giữa top performers và bottom performers.

Trả về JSON:
{
  "patterns": {
    "contentStyle": {
      "optimalLength": { "min": number, "max": number },
      "emojiUsage": "none|minimal|moderate|heavy",
      "hashtagCount": { "min": number, "max": number },
      "toneOfVoice": "formal|casual|playful|urgent|inspirational",
      "hookTypes": ["question", "statistic", "story", "benefit"],
      "ctaStyle": "direct|subtle|question|urgency"
    },
    "timing": {
      "bestHours": [number],
      "bestDays": [0-6],
      "worstHours": [number],
      "worstDays": [0-6]
    },
    "contentTypes": {
      "bestPerforming": ["promotional", "educational", "entertainment", "community"],
      "worstPerforming": ["promotional", "educational", "entertainment", "community"]
    },
    "engagement": {
      "likeDrivers": ["element that drives likes"],
      "commentDrivers": ["element that drives comments"],
      "shareDrivers": ["element that drives shares"]
    }
  },
  "recommendations": [
    {
      "category": "content|timing|style",
      "action": "what to do",
      "impact": "high|medium|low",
      "reasoning": "why this helps"
    }
  ],
  "avoidPatterns": ["patterns that consistently underperform"]
}`
      },
      {
        role: 'user',
        content: `Phân tích content cho page ${pageId}:

TOP PERFORMERS:
${JSON.stringify(topSamples, null, 2)}

BOTTOM PERFORMERS:
${JSON.stringify(bottomSamples, null, 2)}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 1500,
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { patterns: null, recommendations: [] };
  }
}

/**
 * Store learned content patterns
 */
async function storeContentPatterns(pageId, patterns) {
  try {
    await supabase
      .from('copilot_patterns')
      .upsert({
        user_id: `page_${pageId}`,
        pattern_type: 'content_style',
        pattern_name: 'Auto-learned Content Style',
        pattern_description: 'Patterns learned from content performance analysis',
        pattern_data: patterns,
        confidence: 0.8,
        occurrence_count: 1,
        last_occurred_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,pattern_type,pattern_name',
      });
  } catch (error) {
    console.error('Error storing content patterns:', error);
  }
}

/**
 * Get learned content style for a page
 */
async function getLearnedContentStyle(pageId) {
  try {
    const { data, error } = await supabase
      .from('copilot_patterns')
      .select('pattern_data')
      .eq('user_id', `page_${pageId}`)
      .eq('pattern_type', 'content_style')
      .single();

    if (error || !data) {
      return getDefaultContentStyle();
    }

    return data.pattern_data;
  } catch (error) {
    return getDefaultContentStyle();
  }
}

/**
 * Default content style
 */
function getDefaultContentStyle() {
  return {
    contentStyle: {
      optimalLength: { min: 100, max: 250 },
      emojiUsage: 'moderate',
      hashtagCount: { min: 3, max: 5 },
      toneOfVoice: 'casual',
      hookTypes: ['question', 'benefit'],
      ctaStyle: 'direct',
    },
    timing: {
      bestHours: [10, 12, 19, 21],
      bestDays: [1, 2, 3, 4, 5],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED PATTERN RECOGNITION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Advanced pattern recognition with ML-like scoring
 */
async function advancedPatternRecognition(userId, interactionHistory = []) {
  const patterns = {
    behavioral: [],
    preference: [],
    temporal: [],
    contextual: [],
  };

  // 1. Behavioral Patterns - What user does
  const behavioralPatterns = await analyzeBehavioralPatterns(userId, interactionHistory);
  patterns.behavioral = behavioralPatterns;

  // 2. Preference Patterns - What user likes
  const preferencePatterns = await analyzePreferencePatterns(userId);
  patterns.preference = preferencePatterns;

  // 3. Temporal Patterns - When user is active
  const temporalPatterns = await analyzeTemporalPatterns(userId);
  patterns.temporal = temporalPatterns;

  // 4. Contextual Patterns - Context-specific behaviors
  const contextualPatterns = await analyzeContextualPatterns(userId);
  patterns.contextual = contextualPatterns;

  // Store all patterns with confidence scores
  await storeAdvancedPatterns(userId, patterns);

  return patterns;
}

/**
 * Analyze behavioral patterns
 */
async function analyzeBehavioralPatterns(userId, recentInteractions = []) {
  const patterns = [];
  
  try {
    // Get recent feedback
    const { data: feedback } = await supabase
      .from('copilot_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!feedback || feedback.length === 0) return patterns;

    // Analyze interaction types
    const interactionTypes = {};
    feedback.forEach(f => {
      interactionTypes[f.interaction_type] = (interactionTypes[f.interaction_type] || 0) + 1;
    });

    // Find dominant interaction patterns
    const sortedTypes = Object.entries(interactionTypes)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTypes.length > 0) {
      const dominantType = sortedTypes[0];
      const totalInteractions = feedback.length;
      const confidence = dominantType[1] / totalInteractions;

      patterns.push({
        type: 'dominant_interaction',
        name: `Primary Use: ${dominantType[0]}`,
        data: {
          interactionType: dominantType[0],
          frequency: dominantType[1],
          percentage: (confidence * 100).toFixed(1),
        },
        confidence,
        actionable: true,
        suggestion: `Optimize ${dominantType[0]} workflows for this user`,
      });
    }

    // Analyze feedback sentiment distribution
    const sentimentCounts = {
      positive: feedback.filter(f => f.feedback_type === 'positive').length,
      negative: feedback.filter(f => f.feedback_type === 'negative').length,
      correction: feedback.filter(f => f.feedback_type === 'correction').length,
    };

    const satisfactionRate = sentimentCounts.positive / 
      (sentimentCounts.positive + sentimentCounts.negative + 0.001);

    patterns.push({
      type: 'satisfaction_level',
      name: 'User Satisfaction',
      data: {
        satisfactionRate: (satisfactionRate * 100).toFixed(1),
        ...sentimentCounts,
      },
      confidence: Math.min(0.9, feedback.length / 50),
      actionable: satisfactionRate < 0.7,
      suggestion: satisfactionRate < 0.7 
        ? 'Increase personalization, review negative feedback' 
        : 'Maintain current approach',
    });

    return patterns;
  } catch (error) {
    console.error('Error analyzing behavioral patterns:', error);
    return patterns;
  }
}

/**
 * Analyze preference patterns from feedback
 */
async function analyzePreferencePatterns(userId) {
  const patterns = [];

  try {
    // Get positive feedback to understand what user likes
    const { data: positiveFeedback } = await supabase
      .from('copilot_feedback')
      .select('original_message, ai_response, context')
      .eq('user_id', userId)
      .eq('feedback_type', 'positive')
      .limit(30);

    // Get corrections to understand style preferences
    const { data: corrections } = await supabase
      .from('copilot_feedback')
      .select('original_message, ai_response, corrected_response')
      .eq('user_id', userId)
      .eq('feedback_type', 'correction')
      .limit(20);

    if (corrections && corrections.length >= 3) {
      // Use AI to extract style preferences from corrections
      const stylePreferences = await extractStylePreferences(corrections);
      if (stylePreferences) {
        patterns.push({
          type: 'style_preference',
          name: 'Content Style Preferences',
          data: stylePreferences,
          confidence: Math.min(0.85, corrections.length / 10),
          actionable: true,
          suggestion: 'Apply these style preferences to generated content',
        });
      }
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing preference patterns:', error);
    return patterns;
  }
}

/**
 * Extract style preferences from corrections using AI
 */
async function extractStylePreferences(corrections) {
  if (!corrections || corrections.length === 0) return null;

  try {
    const samples = corrections.slice(0, 5).map(c => ({
      original: c.ai_response?.substring(0, 200),
      corrected: c.corrected_response?.substring(0, 200),
    }));

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Phân tích corrections để extract style preferences.

Trả về JSON:
{
  "tone": "formal|casual|playful|professional",
  "length": "shorter|same|longer",
  "emoji": "more|less|same",
  "formatting": "bullet_points|paragraphs|mixed",
  "language": "simple|technical|mixed",
  "key_changes": ["change 1", "change 2"]
}`
        },
        {
          role: 'user',
          content: `Corrections:\n${JSON.stringify(samples, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error extracting style preferences:', error);
    return null;
  }
}

/**
 * Analyze temporal patterns
 */
async function analyzeTemporalPatterns(userId) {
  const patterns = [];

  try {
    const { data: feedback } = await supabase
      .from('copilot_feedback')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!feedback || feedback.length < 10) return patterns;

    // Analyze by hour
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    feedback.forEach(f => {
      const date = new Date(f.created_at);
      hourlyActivity[date.getHours()]++;
      dailyActivity[date.getDay()]++;
    });

    // Find peak hours (top 3)
    const peakHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .filter(h => h.count > 0);

    // Find peak days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const peakDays = dailyActivity
      .map((count, day) => ({ day: dayNames[day], dayIndex: day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .filter(d => d.count > 0);

    patterns.push({
      type: 'activity_schedule',
      name: 'Activity Schedule',
      data: {
        peakHours: peakHours.map(h => `${h.hour}:00`),
        peakDays: peakDays.map(d => d.day),
        hourlyDistribution: hourlyActivity,
        dailyDistribution: dailyActivity,
      },
      confidence: Math.min(0.9, feedback.length / 100),
      actionable: true,
      suggestion: `User most active at ${peakHours[0]?.hour || '12'}:00 on ${peakDays[0]?.day || 'weekdays'}`,
    });

    return patterns;
  } catch (error) {
    console.error('Error analyzing temporal patterns:', error);
    return patterns;
  }
}

/**
 * Analyze contextual patterns
 */
async function analyzeContextualPatterns(userId) {
  const patterns = [];

  try {
    const { data: feedback } = await supabase
      .from('copilot_feedback')
      .select('context, interaction_type, feedback_type')
      .eq('user_id', userId)
      .not('context', 'is', null)
      .limit(100);

    if (!feedback || feedback.length < 5) return patterns;

    // Analyze page/project context
    const contextCounts = {};
    feedback.forEach(f => {
      const ctx = f.context;
      if (ctx?.page_id) {
        contextCounts[ctx.page_id] = (contextCounts[ctx.page_id] || 0) + 1;
      }
      if (ctx?.project) {
        contextCounts[`project:${ctx.project}`] = (contextCounts[`project:${ctx.project}`] || 0) + 1;
      }
    });

    const topContexts = Object.entries(contextCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topContexts.length > 0) {
      patterns.push({
        type: 'context_preference',
        name: 'Preferred Contexts',
        data: {
          topContexts: topContexts.map(([ctx, count]) => ({ context: ctx, count })),
          totalContexts: Object.keys(contextCounts).length,
        },
        confidence: Math.min(0.85, topContexts[0][1] / feedback.length + 0.3),
        actionable: true,
        suggestion: `User primarily works in ${topContexts[0][0]} context`,
      });
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing contextual patterns:', error);
    return patterns;
  }
}

/**
 * Store advanced patterns
 */
async function storeAdvancedPatterns(userId, patterns) {
  try {
    const allPatterns = [
      ...patterns.behavioral,
      ...patterns.preference,
      ...patterns.temporal,
      ...patterns.contextual,
    ];

    for (const pattern of allPatterns) {
      if (pattern.confidence >= 0.5) {
        await supabase
          .from('copilot_patterns')
          .upsert({
            user_id: userId,
            pattern_type: pattern.type,
            pattern_name: pattern.name,
            pattern_description: pattern.suggestion,
            pattern_data: pattern.data,
            confidence: pattern.confidence,
            is_active: true,
            occurrence_count: 1,
            last_occurred_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,pattern_type,pattern_name',
          });
      }
    }
  } catch (error) {
    console.error('Error storing advanced patterns:', error);
  }
}

/**
 * Apply learned patterns to content generation
 */
async function applyLearnedPatternsToContent(pageId, contentPrompt) {
  const learnedStyle = await getLearnedContentStyle(pageId);
  
  if (!learnedStyle || !learnedStyle.contentStyle) {
    return contentPrompt;
  }

  const style = learnedStyle.contentStyle;
  
  const styleGuide = `
📏 LENGTH: ${style.optimalLength?.min || 100}-${style.optimalLength?.max || 250} characters
😊 EMOJI: ${style.emojiUsage || 'moderate'} usage
#️⃣ HASHTAGS: ${style.hashtagCount?.min || 3}-${style.hashtagCount?.max || 5} hashtags
🎨 TONE: ${style.toneOfVoice || 'casual'}
🎣 HOOK: Use ${style.hookTypes?.join(' or ') || 'question or benefit'}
📢 CTA: ${style.ctaStyle || 'direct'} style`;

  return `${contentPrompt}\n\n🧠 LEARNED STYLE GUIDE (from performance data):\n${styleGuide}`;
}

/**
 * Collect and store feedback
 * @param {object} feedbackData - Feedback data
 * @returns {Promise<object>} Stored feedback
 */
async function collectFeedback(feedbackData) {
  try {
    const {
      userId,
      feedbackType,
      interactionType,
      referenceId,
      referenceType,
      rating,
      comment,
      originalMessage,
      aiResponse,
      correctedResponse,
      context = {},
    } = feedbackData;

    if (!userId || !feedbackType || !interactionType) {
      throw new Error('Missing required feedback fields');
    }

    // Store feedback
    const { data, error } = await supabase
      .from('copilot_feedback')
      .insert({
        user_id: userId,
        feedback_type: feedbackType,
        interaction_type: interactionType,
        reference_id: referenceId || null,
        reference_type: referenceType || null,
        rating: rating || null,
        comment: comment || null,
        original_message: originalMessage || null,
        ai_response: aiResponse || null,
        corrected_response: correctedResponse || null,
        context: context,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger pattern recognition if positive/negative feedback
    if (feedbackType === 'positive' || feedbackType === 'negative') {
      // Async pattern recognition (don't wait)
      recognizePatterns(userId, feedbackData).catch(console.error);
    }

    // Update preferences if correction provided
    if (feedbackType === 'correction' && correctedResponse) {
      updatePreferencesFromCorrection(userId, {
        originalMessage,
        aiResponse,
        correctedResponse,
        context,
      }).catch(console.error);
    }

    return data;
  } catch (error) {
    console.error('Error collecting feedback:', error);
    throw error;
  }
}

/**
 * Recognize patterns from user behavior
 * @param {string} userId - User ID
 * @param {object} recentData - Recent interaction data
 * @returns {Promise<Array>} Detected patterns
 */
async function recognizePatterns(userId, recentData = {}) {
  try {
    // Get recent feedback and interactions
    const { data: recentFeedback } = await supabase
      .from('copilot_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get command history (from localStorage or database)
    // For now, we'll analyze feedback patterns

    // Analyze time patterns
    const timePatterns = analyzeTimePatterns(recentFeedback || []);

    // Analyze command patterns
    const commandPatterns = analyzeCommandPatterns(recentFeedback || []);

    // Analyze project preferences
    const projectPatterns = analyzeProjectPatterns(recentFeedback || []);

    // Store detected patterns
    const patterns = [...timePatterns, ...commandPatterns, ...projectPatterns];
    const storedPatterns = [];

    for (const pattern of patterns) {
      if (pattern.confidence > 0.6) {
        // Check if pattern already exists
        const { data: existing } = await supabase
          .from('copilot_patterns')
          .select('*')
          .eq('user_id', userId)
          .eq('pattern_type', pattern.pattern_type)
          .eq('pattern_name', pattern.pattern_name)
          .single();

        if (existing) {
          // Update existing pattern
          const { data } = await supabase
            .from('copilot_patterns')
            .update({
              pattern_data: pattern.pattern_data,
              confidence: pattern.confidence,
              occurrence_count: existing.occurrence_count + 1,
              last_occurred_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (data) storedPatterns.push(data);
        } else {
          // Create new pattern
          const { data } = await supabase
            .from('copilot_patterns')
            .insert({
              user_id: userId,
              pattern_type: pattern.pattern_type,
              pattern_name: pattern.pattern_name,
              pattern_description: pattern.pattern_description,
              pattern_data: pattern.pattern_data,
              confidence: pattern.confidence,
              occurrence_count: 1,
              first_occurred_at: new Date().toISOString(),
              last_occurred_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (data) storedPatterns.push(data);
        }
      }
    }

    return storedPatterns;
  } catch (error) {
    console.error('Error recognizing patterns:', error);
    return [];
  }
}

/**
 * Analyze time patterns
 */
function analyzeTimePatterns(feedback) {
  const patterns = [];

  // Group feedback by hour of day
  const hourGroups = {};
  feedback.forEach(f => {
    const hour = new Date(f.created_at).getHours();
    if (!hourGroups[hour]) hourGroups[hour] = [];
    hourGroups[hour].push(f);
  });

  // Find peak hours
  const peakHours = Object.entries(hourGroups)
    .filter(([hour, items]) => items.length >= 3)
    .map(([hour, items]) => ({
      hour: parseInt(hour),
      count: items.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (peakHours.length > 0) {
    patterns.push({
      pattern_type: 'time_pattern',
      pattern_name: 'Peak Usage Hours',
      pattern_description: `User active during hours: ${peakHours.map(h => `${h.hour}:00`).join(', ')}`,
      pattern_data: { peakHours },
      confidence: Math.min(0.8, peakHours[0].count / 10),
    });
  }

  return patterns;
}

/**
 * Analyze command patterns
 */
function analyzeCommandPatterns(feedback) {
  const patterns = [];

  // Extract commands from feedback
  const commands = feedback
    .filter(f => f.original_message)
    .map(f => f.original_message.toLowerCase());

  // Find frequent command sequences
  if (commands.length >= 5) {
    // Simple pattern: frequent commands
    const commandFreq = {};
    commands.forEach(cmd => {
      const keywords = cmd.split(' ').slice(0, 3).join(' ');
      commandFreq[keywords] = (commandFreq[keywords] || 0) + 1;
    });

    const frequentCommands = Object.entries(commandFreq)
      .filter(([cmd, freq]) => freq >= 3)
      .map(([cmd, freq]) => ({ command: cmd, frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    if (frequentCommands.length > 0) {
      patterns.push({
        pattern_type: 'command_sequence',
        pattern_name: 'Frequent Commands',
        pattern_description: `User frequently uses: ${frequentCommands.map(c => c.command).join(', ')}`,
        pattern_data: { frequentCommands },
        confidence: Math.min(0.7, frequentCommands[0].frequency / 10),
      });
    }
  }

  return patterns;
}

/**
 * Analyze project preferences
 */
function analyzeProjectPatterns(feedback) {
  const patterns = [];

  // Extract project IDs from context
  const projectIds = feedback
    .filter(f => f.context?.project_id)
    .map(f => f.context.project_id);

  if (projectIds.length === 0) return patterns;

  const projectFreq = {};
  projectIds.forEach(id => {
    projectFreq[id] = (projectFreq[id] || 0) + 1;
  });

  const favoriteProject = Object.entries(projectFreq)
    .sort((a, b) => b[1] - a[1])[0];

  if (favoriteProject && favoriteProject[1] >= 3) {
    patterns.push({
      pattern_type: 'project_preference',
      pattern_name: 'Favorite Project',
      pattern_description: `User primarily works with project: ${favoriteProject[0]}`,
      pattern_data: { projectId: favoriteProject[0], frequency: favoriteProject[1] },
      confidence: Math.min(0.9, favoriteProject[1] / projectIds.length),
    });
  }

  return patterns;
}

/**
 * Update preferences from correction
 */
async function updatePreferencesFromCorrection(userId, correctionData) {
  try {
    const { originalMessage, aiResponse, correctedResponse, context } = correctionData;

    // Use LLM to extract preference from correction
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là AI preference extractor. Phân tích correction và extract user preferences.',
        },
        {
          role: 'user',
          content: `Original: "${originalMessage}"\nAI Response: "${aiResponse}"\nCorrected: "${correctedResponse}"\n\nExtract preferences (format, style, tone, etc.)`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    const preferences = content.preferences || [];

    // Store preferences
    for (const pref of preferences) {
      if (pref.type && pref.key && pref.value) {
        await supabase
          .from('copilot_preferences')
          .upsert({
            user_id: userId,
            preference_type: pref.type,
            preference_key: pref.key,
            preference_value: pref.value,
            confidence: pref.confidence || 0.7,
            source: 'correction',
            context: context,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,preference_type,preference_key',
          });
      }
    }
  } catch (error) {
    console.error('Error updating preferences from correction:', error);
  }
}

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @param {string} preferenceType - Optional preference type filter
 * @returns {Promise<object>} User preferences
 */
async function getUserPreferences(userId, preferenceType = null) {
  try {
    let query = supabase
      .from('copilot_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('confidence', { ascending: false });

    if (preferenceType) {
      query = query.eq('preference_type', preferenceType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format as key-value object
    const preferences = {};
    (data || []).forEach(pref => {
      if (!preferences[pref.preference_type]) {
        preferences[pref.preference_type] = {};
      }
      preferences[pref.preference_type][pref.preference_key] = pref.preference_value;
    });

    return preferences;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
}

/**
 * Update embeddings based on feedback
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {object} feedback - Feedback data
 * @returns {Promise<boolean>} Success status
 */
async function updateEmbeddingsFromFeedback(entityType, entityId, feedback) {
  try {
    // If negative feedback, reduce relevance score
    // If positive feedback, boost relevance
    // For now, we'll re-index with updated description

    if (feedback.feedbackType === 'negative' || feedback.correctedResponse) {
      // Re-index with correction
      const correctedDescription = feedback.correctedResponse || feedback.comment;

      // Update embedding with corrected information
      // This would trigger re-indexing with new description

      return true;
    }

    return true;
  } catch (error) {
    console.error('Error updating embeddings:', error);
    return false;
  }
}

/**
 * Get patterns for user
 * @param {string} userId - User ID
 * @param {string} patternType - Optional pattern type filter
 * @returns {Promise<Array>} User patterns
 */
async function getUserPatterns(userId, patternType = null) {
  try {
    let query = supabase
      .from('copilot_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('confidence', { ascending: false });

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting user patterns:', error);
    return [];
  }
}

/**
 * Learn from batch feedback
 * @param {string} userId - User ID
 * @returns {Promise<object>} Learning summary
 */
async function learnFromBatch(userId) {
  try {
    // Get all recent feedback
    const { data: feedback } = await supabase
      .from('copilot_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Recognize patterns
    const patterns = await recognizePatterns(userId, { feedback });

    // Update preferences
    const corrections = (feedback || []).filter(f => f.feedback_type === 'correction');
    for (const correction of corrections) {
      await updatePreferencesFromCorrection(userId, {
        originalMessage: correction.original_message,
        aiResponse: correction.ai_response,
        correctedResponse: correction.corrected_response,
        context: correction.context,
      });
    }

    return {
      success: true,
      patternsDetected: patterns.length,
      preferencesUpdated: corrections.length,
      totalFeedback: feedback?.length || 0,
    };
  } catch (error) {
    console.error('Error learning from batch:', error);
    throw error;
  }
}

module.exports = {
  // Original functions
  collectFeedback,
  recognizePatterns,
  getUserPreferences,
  getUserPatterns,
  updateEmbeddingsFromFeedback,
  learnFromBatch,
  analyzeTimePatterns,
  analyzeCommandPatterns,
  analyzeProjectPatterns,
  
  // Advanced Learning (Phase 6)
  analyzeContentPerformance,
  getLearnedContentStyle,
  advancedPatternRecognition,
  applyLearnedPatternsToContent,
  analyzeBehavioralPatterns,
  analyzePreferencePatterns,
  analyzeTemporalPatterns,
  analyzeContextualPatterns,
};

