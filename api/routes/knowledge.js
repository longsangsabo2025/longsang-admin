/**
 * 🧠 Knowledge API Routes
 * REST API for AI Personal Operating System
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const knowledgeService = require('../services/ai-workspace/knowledge-service');

const DEFAULT_USER_ID = 'default-longsang-user';

// Helper: Get user ID from request
function getUserId(req) {
  return req.user?.id || req.headers['x-user-id'] || DEFAULT_USER_ID;
}

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * GET /api/knowledge/profile
 * Get admin profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = await knowledgeService.getAdminProfile(userId);
    
    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('[Knowledge API] Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/knowledge/profile
 * Update admin profile
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = await knowledgeService.updateAdminProfile(userId, req.body);
    
    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('[Knowledge API] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// BUSINESS ROUTES
// ============================================

/**
 * GET /api/knowledge/businesses
 * Get all business entities
 */
router.get('/businesses', async (req, res) => {
  try {
    const userId = getUserId(req);
    const businesses = await knowledgeService.getBusinessEntities(userId);
    
    res.json({
      success: true,
      businesses,
    });
  } catch (error) {
    console.error('[Knowledge API] Get businesses error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/knowledge/businesses
 * Add business entity
 */
router.post('/businesses', async (req, res) => {
  try {
    const userId = getUserId(req);
    const business = await knowledgeService.addBusinessEntity(userId, req.body);
    
    res.json({
      success: true,
      business,
    });
  } catch (error) {
    console.error('[Knowledge API] Add business error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// PROJECT ROUTES
// ============================================

/**
 * GET /api/knowledge/projects
 * Get all projects
 */
router.get('/projects', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { status, type } = req.query;
    
    const projects = await knowledgeService.getProjects(userId, { status, type });
    
    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('[Knowledge API] Get projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/knowledge/projects
 * Add project
 */
router.post('/projects', async (req, res) => {
  try {
    const userId = getUserId(req);
    const project = await knowledgeService.addProject(userId, req.body);
    
    res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('[Knowledge API] Add project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/knowledge/projects/:id
 * Update project
 */
router.put('/projects/:id', async (req, res) => {
  try {
    const project = await knowledgeService.updateProject(req.params.id, req.body);
    
    res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('[Knowledge API] Update project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// KNOWLEDGE BASE ROUTES
// ============================================

/**
 * GET /api/knowledge/entries
 * Get knowledge entries
 */
router.get('/entries', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, limit = 50 } = req.query;
    
    let entries;
    if (category) {
      entries = await knowledgeService.getKnowledgeByCategory(userId, category);
    } else {
      // Get all (with limit)
      entries = await knowledgeService.textSearchKnowledge('', { userId, limit: parseInt(limit) });
    }
    
    res.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error('[Knowledge API] Get entries error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/knowledge/entries
 * Add knowledge entry
 */
router.post('/entries', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { category, title, content, tags, importance, project_id } = req.body;
    
    if (!category || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'category, title, and content are required',
      });
    }
    
    const entry = await knowledgeService.addKnowledge(userId, {
      category,
      title,
      content,
      tags: tags || [],
      importance: importance || 5,
      project_id,
    });
    
    res.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('[Knowledge API] Add entry error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/knowledge/entries/:id
 * Update knowledge entry
 */
router.put('/entries/:id', async (req, res) => {
  try {
    const entry = await knowledgeService.updateKnowledge(req.params.id, req.body);
    
    res.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('[Knowledge API] Update entry error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/knowledge/entries/:id
 * Delete knowledge entry (soft delete)
 */
router.delete('/entries/:id', async (req, res) => {
  try {
    await knowledgeService.deleteKnowledge(req.params.id);
    
    res.json({
      success: true,
    });
  } catch (error) {
    console.error('[Knowledge API] Delete entry error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/knowledge/search
 * Semantic search in knowledge base
 */
router.post('/search', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, category, project_id, threshold = 0.7, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required',
      });
    }
    
    const results = await knowledgeService.searchKnowledge(query, {
      userId,
      category,
      projectId: project_id,
      threshold,
      limit,
    });
    
    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('[Knowledge API] Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// GOALS ROUTES
// ============================================

/**
 * GET /api/knowledge/goals
 * Get active goals
 */
router.get('/goals', async (req, res) => {
  try {
    const userId = getUserId(req);
    const goals = await knowledgeService.getActiveGoals(userId);
    
    res.json({
      success: true,
      goals,
    });
  } catch (error) {
    console.error('[Knowledge API] Get goals error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/knowledge/goals
 * Add goal
 */
router.post('/goals', async (req, res) => {
  try {
    const userId = getUserId(req);
    const goal = await knowledgeService.addGoal(userId, req.body);
    
    res.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error('[Knowledge API] Add goal error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// AI CONTEXT ROUTES
// ============================================

/**
 * GET /api/knowledge/context
 * Get full AI context for current user
 */
router.get('/context', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, maxTokens = 4000 } = req.query;
    
    const context = await knowledgeService.buildAIContext(userId, {
      query,
      maxKnowledgeItems: 10,
    });
    
    const formatted = knowledgeService.formatContextForPrompt(context, { maxTokens: parseInt(maxTokens) });
    
    res.json({
      success: true,
      context: formatted.context,
      estimatedTokens: formatted.estimatedTokens,
      truncated: formatted.truncated,
      raw: context,
    });
  } catch (error) {
    console.error('[Knowledge API] Get context error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/knowledge/learn
 * Learn from conversation
 */
router.post('/learn', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { messages, conversationId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required',
      });
    }
    
    const insights = await knowledgeService.learnFromConversation(userId, messages, {
      conversationId,
    });
    
    res.json({
      success: true,
      learned: insights !== null,
      insights,
    });
  } catch (error) {
    console.error('[Knowledge API] Learn error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// STATS ROUTES
// ============================================

/**
 * GET /api/knowledge/stats
 * Get knowledge base stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const [profile, businesses, projects, goals] = await Promise.all([
      knowledgeService.getAdminProfile(userId),
      knowledgeService.getBusinessEntities(userId),
      knowledgeService.getProjects(userId),
      knowledgeService.getActiveGoals(userId),
    ]);
    
    res.json({
      success: true,
      stats: {
        hasProfile: !!profile?.full_name,
        businessCount: businesses.length,
        projectCount: projects.length,
        activeProjectCount: projects.filter(p => p.status === 'active').length,
        goalCount: goals.length,
      },
    });
  } catch (error) {
    console.error('[Knowledge API] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// PROMPT DEBUG/PREVIEW ROUTES
// ============================================

/**
 * POST /api/knowledge/preview-prompt
 * Preview the full prompt that will be sent to AI
 * This helps users understand exactly what context is being used
 */
router.post('/preview-prompt', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, assistantType = 'research' } = req.body;
    
    // Get prompts
    const prompts = require('../services/ai-workspace/prompts');
    const contextRetrievalService = require('../services/ai-workspace/context-retrieval');
    
    // Get system prompt based on assistant type
    const systemPromptMap = {
      course: prompts.COURSE_ASSISTANT_PROMPT,
      financial: prompts.FINANCIAL_ASSISTANT_PROMPT,
      research: prompts.RESEARCH_ASSISTANT_PROMPT,
      news: prompts.NEWS_ASSISTANT_PROMPT,
      career: prompts.CAREER_ASSISTANT_PROMPT,
      daily: prompts.DAILY_ASSISTANT_PROMPT,
    };
    
    const baseSystemPrompt = systemPromptMap[assistantType] || prompts.RESEARCH_ASSISTANT_PROMPT;
    
    // Get personal context from Knowledge Base
    const personalContext = await knowledgeService.buildAIContext(userId, {
      includeProfile: true,
      includeProjects: true,
      includeGoals: true,
      includeKnowledge: true,
      query: query || '',
      maxKnowledgeItems: 5,
    });
    
    // Get RAG context (document retrieval)
    let ragContext = { documents: [], summary: '' };
    try {
      ragContext = await contextRetrievalService.retrieve({
        query: query || 'general',
        userId,
        assistantType,
        maxDocs: 5,
      });
    } catch (err) {
      console.warn('[Preview] RAG context error:', err.message);
    }
    
    // Format contexts
    const ragContextString = contextRetrievalService.formatContextForPrompt(ragContext);
    const personalContextString = personalContext.summary 
      ? `\n\n## 🧠 Personal Knowledge Base:\n${personalContext.summary}`
      : '';
    
    // Build final system prompt
    const fullSystemPrompt = `${baseSystemPrompt}

## Context từ dữ liệu cá nhân của user:
${ragContextString}${personalContextString}

## Lưu ý:
- Sử dụng context trên để đưa ra câu trả lời chính xác và cá nhân hóa
- Nếu context không đủ, hãy nói rõ và đề xuất cách bổ sung thông tin
- Luôn trả lời bằng tiếng Việt (trừ khi user dùng tiếng Anh)`;

    // Calculate token estimates
    const estimatedTokens = Math.ceil(fullSystemPrompt.length / 4);
    
    res.json({
      success: true,
      preview: {
        assistantType,
        query: query || '(no query)',
        
        // Breakdown
        sections: {
          basePrompt: {
            content: baseSystemPrompt,
            tokens: Math.ceil(baseSystemPrompt.length / 4),
          },
          ragContext: {
            content: ragContextString,
            tokens: Math.ceil(ragContextString.length / 4),
            documentCount: ragContext.documents?.length || 0,
          },
          personalContext: {
            content: personalContextString,
            tokens: Math.ceil(personalContextString.length / 4),
            profile: personalContext.profile,
            projectCount: personalContext.projects?.length || 0,
            goalCount: personalContext.goals?.length || 0,
            knowledgeCount: personalContext.relevantKnowledge?.length || 0,
          },
        },
        
        // Full prompt
        fullPrompt: fullSystemPrompt,
        totalTokens: estimatedTokens,
        
        // Raw data for debugging
        rawContext: {
          profile: personalContext.profile,
          projects: personalContext.projects,
          goals: personalContext.goals,
          knowledge: personalContext.relevantKnowledge,
        },
      },
    });
  } catch (error) {
    console.error('[Knowledge API] Preview prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
