/**
 * Knowledge Quality Service
 * Score knowledge items and identify improvements
 */

const learningService = require('./learning-service');

/**
 * Score knowledge item (wrapper around learning service)
 */
async function scoreKnowledgeItem(knowledgeId) {
  return learningService.scoreKnowledgeItem(knowledgeId);
}

/**
 * Identify low-quality knowledge
 */
async function identifyLowQualityKnowledge(domainId, threshold = 30) {
  return learningService.identifyLowQualityKnowledge(domainId, threshold);
}

/**
 * Suggest improvements
 */
async function suggestImprovements(knowledgeId) {
  return learningService.suggestImprovements(knowledgeId);
}

/**
 * Auto-archive outdated knowledge
 */
async function autoArchiveOutdated(thresholdDays = 365, minScore = 20) {
  return learningService.autoArchiveOutdated(thresholdDays, minScore);
}

/**
 * Batch score knowledge items
 */
async function batchScoreKnowledge(domainId, limit = 100) {
  if (!learningService.supabase) throw new Error('Supabase not configured');

  // Get knowledge items for domain
  const { data: knowledgeItems, error } = await learningService.supabase
    .from('brain_knowledge')
    .select('id')
    .eq('domain_id', domainId)
    .eq('status', 'active')
    .limit(limit);

  if (error) throw new Error(`Failed to fetch knowledge items: ${error.message}`);

  const results = [];
  for (const item of knowledgeItems || []) {
    try {
      const score = await scoreKnowledgeItem(item.id);
      results.push(score);
    } catch (err) {
      console.error(`[Knowledge Quality] Error scoring knowledge ${item.id}:`, err);
    }
  }

  return results;
}

module.exports = {
  scoreKnowledgeItem,
  identifyLowQualityKnowledge,
  suggestImprovements,
  autoArchiveOutdated,
  batchScoreKnowledge,
};


