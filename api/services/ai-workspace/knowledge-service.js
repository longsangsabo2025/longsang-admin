/**
 * 🧠 Knowledge Service
 * Core service for AI Personal Operating System
 * Manages knowledge, context retrieval, and AI personalization
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize clients
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_USER_ID = 'default-longsang-user';

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      return null;
    }
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim().substring(0, 8000), // Limit to 8k chars
      dimensions: EMBEDDING_DIMENSIONS,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('[KnowledgeService] Embedding error:', error.message);
    return null;
  }
}

// ============================================
// ADMIN PROFILE
// ============================================

/**
 * Get admin profile
 */
async function getAdminProfile(userId = DEFAULT_USER_ID) {
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error;
    }
    
    return data || getDefaultProfile(userId);
  } catch (error) {
    console.error('[KnowledgeService] Get profile error:', error.message);
    return getDefaultProfile(userId);
  }
}

/**
 * Default profile for new users
 */
function getDefaultProfile(userId) {
  return {
    user_id: userId,
    full_name: 'Long Sang',
    role: 'Founder & CEO',
    communication_style: 'direct',
    response_preference: 'structured',
    expertise_level: 'expert',
    preferred_language: 'vi',
    ai_verbosity: 'medium',
  };
}

/**
 * Update admin profile
 */
async function updateAdminProfile(userId = DEFAULT_USER_ID, updates) {
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Update profile error:', error.message);
    throw error;
  }
}

// ============================================
// BUSINESS ENTITIES
// ============================================

/**
 * Get all business entities
 */
async function getBusinessEntities(userId = DEFAULT_USER_ID) {
  try {
    const { data, error } = await supabase
      .from('business_entities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[KnowledgeService] Get businesses error:', error.message);
    return [];
  }
}

/**
 * Add business entity
 */
async function addBusinessEntity(userId = DEFAULT_USER_ID, entity) {
  try {
    const { data, error } = await supabase
      .from('business_entities')
      .insert({
        user_id: userId,
        ...entity,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Add business error:', error.message);
    throw error;
  }
}

// ============================================
// PROJECT REGISTRY
// ============================================

/**
 * Get all projects
 */
async function getProjects(userId = DEFAULT_USER_ID, filters = {}) {
  try {
    let query = supabase
      .from('project_registry')
      .select('*')
      .eq('user_id', userId);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data, error } = await query.order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[KnowledgeService] Get projects error:', error.message);
    return [];
  }
}

/**
 * Add project to registry
 */
async function addProject(userId = DEFAULT_USER_ID, project) {
  try {
    const { data, error } = await supabase
      .from('project_registry')
      .insert({
        user_id: userId,
        ...project,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Also add to knowledge base
    await addKnowledge(userId, {
      category: 'project',
      title: `Project: ${project.name}`,
      content: `
        Name: ${project.name}
        Type: ${project.type}
        Description: ${project.description || 'N/A'}
        Tech Stack: ${JSON.stringify(project.tech_stack || {})}
        Status: ${project.status || 'planning'}
      `,
      project_id: data.id,
      importance: 8,
      tags: ['project', project.type, project.status].filter(Boolean),
    });
    
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Add project error:', error.message);
    throw error;
  }
}

/**
 * Update project
 */
async function updateProject(projectId, updates) {
  try {
    const { data, error } = await supabase
      .from('project_registry')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Update project error:', error.message);
    throw error;
  }
}

// ============================================
// KNOWLEDGE BASE
// ============================================

/**
 * Add knowledge entry
 */
async function addKnowledge(userId = DEFAULT_USER_ID, knowledge) {
  try {
    // Generate embedding for semantic search
    const textForEmbedding = `${knowledge.title} ${knowledge.content}`;
    const embedding = await generateEmbedding(textForEmbedding);
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: userId,
        ...knowledge,
        embedding,
      })
      .select()
      .single();
    
    if (error) throw error;
    console.log(`[KnowledgeService] Added knowledge: ${knowledge.title}`);
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Add knowledge error:', error.message);
    throw error;
  }
}

/**
 * Search knowledge by semantic similarity
 */
async function searchKnowledge(query, options = {}) {
  try {
    const {
      userId = DEFAULT_USER_ID,
      category = null,
      projectId = null,
      threshold = 0.7,
      limit = 10,
    } = options;
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      return [];
    }
    
    // Use Supabase RPC for vector search
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding,
      p_user_id: userId,
      p_category: category,
      p_project_id: projectId,
      match_threshold: threshold,
      match_count: limit,
    });
    
    if (error) {
      // Fallback to text search if vector search fails
      console.warn('[KnowledgeService] Vector search failed, using text search:', error.message);
      return await textSearchKnowledge(query, { userId, category, limit });
    }
    
    return data || [];
  } catch (error) {
    console.error('[KnowledgeService] Search knowledge error:', error.message);
    return [];
  }
}

/**
 * Fallback text search
 */
async function textSearchKnowledge(query, options = {}) {
  try {
    const { userId = DEFAULT_USER_ID, category = null, limit = 10 } = options;
    
    let queryBuilder = supabase
      .from('knowledge_base')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }
    
    // Text search with OR on title and content
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    
    const { data, error } = await queryBuilder
      .order('importance', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[KnowledgeService] Text search error:', error.message);
    return [];
  }
}

/**
 * Get knowledge by category
 */
async function getKnowledgeByCategory(userId = DEFAULT_USER_ID, category) {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('is_active', true)
      .order('importance', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[KnowledgeService] Get by category error:', error.message);
    return [];
  }
}

/**
 * Update knowledge entry
 */
async function updateKnowledge(knowledgeId, updates) {
  try {
    // Re-generate embedding if content changed
    let embedding = undefined;
    if (updates.title || updates.content) {
      const textForEmbedding = `${updates.title || ''} ${updates.content || ''}`;
      embedding = await generateEmbedding(textForEmbedding);
    }
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({
        ...updates,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', knowledgeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Update knowledge error:', error.message);
    throw error;
  }
}

/**
 * Delete knowledge (soft delete)
 */
async function deleteKnowledge(knowledgeId) {
  try {
    const { error } = await supabase
      .from('knowledge_base')
      .update({ is_active: false })
      .eq('id', knowledgeId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[KnowledgeService] Delete knowledge error:', error.message);
    throw error;
  }
}

// ============================================
// GOALS & ROADMAP
// ============================================

/**
 * Get active goals
 */
async function getActiveGoals(userId = DEFAULT_USER_ID) {
  try {
    const { data, error } = await supabase
      .from('goals_roadmap')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[KnowledgeService] Get goals error:', error.message);
    return [];
  }
}

/**
 * Add goal
 */
async function addGoal(userId = DEFAULT_USER_ID, goal) {
  try {
    const { data, error } = await supabase
      .from('goals_roadmap')
      .insert({
        user_id: userId,
        ...goal,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[KnowledgeService] Add goal error:', error.message);
    throw error;
  }
}

// ============================================
// AI CONTEXT BUILDING
// ============================================

/**
 * Build comprehensive AI context for a user
 * This is the main function used by AI assistants
 */
async function buildAIContext(userId = DEFAULT_USER_ID, options = {}) {
  try {
    const {
      includeProfile = true,
      includeProjects = true,
      includeGoals = true,
      includeKnowledge = true,
      query = null, // If provided, search for relevant knowledge
      maxKnowledgeItems = 10,
    } = options;
    
    const context = {
      profile: null,
      businesses: [],
      projects: [],
      goals: [],
      relevantKnowledge: [],
      summary: '',
    };
    
    // Profile
    if (includeProfile) {
      context.profile = await getAdminProfile(userId);
      context.businesses = await getBusinessEntities(userId);
    }
    
    // Projects
    if (includeProjects) {
      context.projects = await getProjects(userId, { status: 'active' });
    }
    
    // Goals
    if (includeGoals) {
      context.goals = await getActiveGoals(userId);
    }
    
    // Relevant Knowledge
    if (includeKnowledge && query) {
      context.relevantKnowledge = await searchKnowledge(query, {
        userId,
        limit: maxKnowledgeItems,
      });
    }
    
    // Build summary
    context.summary = buildContextSummary(context);
    
    return context;
  } catch (error) {
    console.error('[KnowledgeService] Build context error:', error.message);
    return {
      profile: getDefaultProfile(userId),
      businesses: [],
      projects: [],
      goals: [],
      relevantKnowledge: [],
      summary: 'Context unavailable',
    };
  }
}

/**
 * Build human-readable context summary for AI prompts
 */
function buildContextSummary(context) {
  const parts = [];
  
  // Profile summary
  if (context.profile) {
    const p = context.profile;
    parts.push(`## 👤 Admin Profile
- Name: ${p.full_name}
- Role: ${p.role}
- Communication: ${p.communication_style}
- Language: ${p.preferred_language === 'vi' ? 'Vietnamese' : 'English'}
- Expertise: ${p.expertise_level}`);
  }
  
  // Business summary
  if (context.businesses.length > 0) {
    const businessList = context.businesses
      .map(b => `- ${b.name} (${b.type}) - ${b.status}`)
      .join('\n');
    parts.push(`## 🏢 Business Entities\n${businessList}`);
  }
  
  // Project summary
  if (context.projects.length > 0) {
    const projectList = context.projects
      .map(p => `- ${p.name} [${p.status}] - ${p.description || 'No description'}`)
      .join('\n');
    parts.push(`## 📁 Active Projects\n${projectList}`);
  }
  
  // Goals summary
  if (context.goals.length > 0) {
    const goalList = context.goals
      .slice(0, 5)
      .map(g => `- ${g.title} (${g.timeframe}) - ${g.progress_percent}%`)
      .join('\n');
    parts.push(`## 🎯 Active Goals\n${goalList}`);
  }
  
  // Relevant knowledge
  if (context.relevantKnowledge.length > 0) {
    const knowledgeList = context.relevantKnowledge
      .map(k => `### ${k.title}\n${k.content.substring(0, 500)}...`)
      .join('\n\n');
    parts.push(`## 📚 Relevant Knowledge\n${knowledgeList}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Format context for AI prompt injection
 */
function formatContextForPrompt(context, options = {}) {
  const { maxTokens = 4000 } = options;
  
  let formatted = context.summary;
  
  // Rough token estimate (4 chars = 1 token)
  const estimatedTokens = formatted.length / 4;
  
  if (estimatedTokens > maxTokens) {
    // Truncate if too long
    const maxChars = maxTokens * 4;
    formatted = formatted.substring(0, maxChars) + '\n\n[Context truncated...]';
  }
  
  return {
    context: formatted,
    estimatedTokens: Math.ceil(formatted.length / 4),
    truncated: formatted.length / 4 > maxTokens,
  };
}

// ============================================
// LEARNING FROM CONVERSATIONS
// ============================================

/**
 * Extract and save knowledge from conversation
 */
async function learnFromConversation(userId, messages, metadata = {}) {
  try {
    // Only learn from longer conversations
    if (messages.length < 4) {
      return null;
    }
    
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    // Use AI to extract key insights
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract key learnable insights from this conversation.
Return JSON with:
{
  "insights": [
    {
      "category": "personal|business|project|technical|decision",
      "title": "Brief title",
      "content": "What to remember",
      "importance": 1-10
    }
  ],
  "shouldLearn": true/false
}

Only extract if there's genuinely useful information to remember.`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    if (result.shouldLearn && result.insights?.length > 0) {
      for (const insight of result.insights) {
        await addKnowledge(userId, {
          category: insight.category,
          title: insight.title,
          content: insight.content,
          importance: insight.importance,
          source: 'conversation',
          source_url: metadata.conversationId,
          tags: ['auto-learned', insight.category],
        });
      }
      
      console.log(`[KnowledgeService] Learned ${result.insights.length} insights from conversation`);
      return result.insights;
    }
    
    return null;
  } catch (error) {
    console.error('[KnowledgeService] Learn from conversation error:', error.message);
    return null;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Profile
  getAdminProfile,
  updateAdminProfile,
  
  // Business
  getBusinessEntities,
  addBusinessEntity,
  
  // Projects
  getProjects,
  addProject,
  updateProject,
  
  // Knowledge
  addKnowledge,
  searchKnowledge,
  textSearchKnowledge,
  getKnowledgeByCategory,
  updateKnowledge,
  deleteKnowledge,
  
  // Goals
  getActiveGoals,
  addGoal,
  
  // AI Context
  buildAIContext,
  formatContextForPrompt,
  
  // Learning
  learnFromConversation,
  
  // Utils
  generateEmbedding,
  DEFAULT_USER_ID,
};
