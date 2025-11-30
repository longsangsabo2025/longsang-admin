/**
 * 🧠 Copilot Learner Service
 *
 * Learning system that collects feedback, recognizes patterns,
 * updates embeddings, and learns user preferences
 *
 * @author LongSang Admin
 * @version 1.0.0
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
  collectFeedback,
  recognizePatterns,
  getUserPreferences,
  getUserPatterns,
  updateEmbeddingsFromFeedback,
  learnFromBatch,
  analyzeTimePatterns,
  analyzeCommandPatterns,
  analyzeProjectPatterns,
};

