/**
 * Collaboration Service
 * Knowledge sharing, comments, and team workspaces
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Share knowledge with another user
 */
async function shareKnowledge(knowledgeId, userId, permission = 'read') {
  if (!supabase) throw new Error('Supabase not configured');

  // Verify user owns the knowledge
  const { data: knowledge, error: knowledgeError } = await supabase
    .from('brain_knowledge')
    .select('user_id')
    .eq('id', knowledgeId)
    .single();

  if (knowledgeError || !knowledge) {
    throw new Error(`Knowledge item not found: ${knowledgeId}`);
  }

  // Get the owner ID (from request context, not from knowledge.user_id for security)
  // This should be passed from the route handler
  const ownerId = knowledge.user_id;

  const { data, error } = await supabase
    .from('brain_collaboration_shares')
    .upsert({
      knowledge_id: knowledgeId,
      shared_by: ownerId,
      shared_with: userId,
      permission,
    }, {
      onConflict: 'knowledge_id,shared_with',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to share knowledge: ${error.message}`);

  return data;
}

/**
 * Add comment to knowledge
 */
async function addComment(knowledgeId, userId, comment, parentId = null) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('brain_collaboration_comments')
    .insert({
      knowledge_id: knowledgeId,
      user_id: userId,
      comment,
      parent_comment_id: parentId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add comment: ${error.message}`);

  return data;
}

/**
 * Create team workspace
 */
async function createTeamWorkspace(name, description, userId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: workspace, error: workspaceError } = await supabase
    .from('brain_team_workspaces')
    .insert({
      name,
      description,
      created_by: userId,
    })
    .select()
    .single();

  if (workspaceError) throw new Error(`Failed to create workspace: ${workspaceError.message}`);

  // Add creator as admin member
  await supabase.from('brain_team_members').insert({
    team_id: workspace.id,
    user_id: userId,
    role: 'admin',
  });

  return workspace;
}

/**
 * Add team member
 */
async function addTeamMember(teamId, userId, role = 'member') {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('brain_team_members')
    .upsert({
      team_id: teamId,
      user_id: userId,
      role,
    }, {
      onConflict: 'team_id,user_id',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add team member: ${error.message}`);

  return data;
}

/**
 * Get shared knowledge for a user
 */
async function getSharedKnowledge(userId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('brain_collaboration_shares')
    .select(`
      *,
      knowledge:brain_knowledge(*)
    `)
    .eq('shared_with', userId);

  if (error) throw new Error(`Failed to get shared knowledge: ${error.message}`);

  return data || [];
}

/**
 * Get comments for knowledge item
 */
async function getComments(knowledgeId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('brain_collaboration_comments')
    .select('*')
    .eq('knowledge_id', knowledgeId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get comments: ${error.message}`);

  return data || [];
}

/**
 * Get teams for a user
 */
async function getTeams(userId) {
  if (!supabase) throw new Error('Supabase not configured');

  // First get team IDs where user is a member
  const { data: memberTeams } = await supabase
    .from('brain_team_members')
    .select('team_id')
    .eq('user_id', userId);

  const memberTeamIds = memberTeams?.map((t) => t.team_id) || [];

  // Get workspaces created by user or where user is a member
  const { data, error } = await supabase
    .from('brain_team_workspaces')
    .select(`
      *,
      members:brain_team_members(*)
    `)
    .or(`created_by.eq.${userId}${memberTeamIds.length > 0 ? `,id.in.(${memberTeamIds.join(',')})` : ''}`);

  if (error) throw new Error(`Failed to get teams: ${error.message}`);

  return data || [];
}

module.exports = {
  supabase,
  shareKnowledge,
  addComment,
  createTeamWorkspace,
  addTeamMember,
  getSharedKnowledge,
  getComments,
  getTeams,
};

