/**
 * Knowledge Graph Service
 * Manages knowledge graph operations
 */

const { createClient } = require('@supabase/supabase-js');
const embeddingService = require('./embedding-service');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Build knowledge graph from domain
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Build result
 */
async function buildGraph(domainId, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.rpc('build_graph_from_knowledge', {
      p_domain_id: domainId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to build graph: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('[Knowledge Graph] Build error:', error);
    throw error;
  }
}

/**
 * Find paths between two nodes
 * @param {string} sourceNodeId - Source node ID
 * @param {string} targetNodeId - Target node ID
 * @param {string} userId - User ID
 * @param {Object} options - Path finding options
 * @returns {Promise<Array>} - Array of paths
 */
async function findPaths(sourceNodeId, targetNodeId, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const maxDepth = options.maxDepth || 5;

    const { data, error } = await supabase.rpc('find_graph_paths', {
      p_source_node_id: sourceNodeId,
      p_target_node_id: targetNodeId,
      p_max_depth: maxDepth,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to find paths: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[Knowledge Graph] Find paths error:', error);
    throw error;
  }
}

/**
 * Get related concepts
 * @param {string} nodeId - Node ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of related concepts
 */
async function getRelatedConcepts(nodeId, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const maxResults = options.maxResults || 10;

    const { data, error } = await supabase.rpc('get_related_concepts', {
      p_node_id: nodeId,
      p_max_results: maxResults,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to get related concepts: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[Knowledge Graph] Get related concepts error:', error);
    throw error;
  }
}

/**
 * Traverse graph from a node
 * @param {string} startNodeId - Start node ID
 * @param {string} userId - User ID
 * @param {Object} options - Traversal options
 * @returns {Promise<Array>} - Traversal results
 */
async function traverseGraph(startNodeId, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const maxDepth = options.maxDepth || 3;

    const { data, error } = await supabase.rpc('traverse_graph', {
      p_start_node_id: startNodeId,
      p_max_depth: maxDepth,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to traverse graph: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[Knowledge Graph] Traverse error:', error);
    throw error;
  }
}

/**
 * Create node in graph
 * @param {Object} nodeData - Node data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created node
 */
async function createNode(nodeData, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const {
      nodeType,
      nodeId,
      nodeLabel,
      nodeDescription,
      domainId,
      properties = {},
      embedding = null,
    } = nodeData;

    const { data, error } = await supabase
      .from('brain_knowledge_graph_nodes')
      .insert({
        node_type: nodeType,
        node_id: nodeId,
        node_label: nodeLabel,
        node_description: nodeDescription,
        domain_id: domainId,
        properties: properties,
        embedding: embedding,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create node: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('[Knowledge Graph] Create node error:', error);
    throw error;
  }
}

/**
 * Create edge in graph
 * @param {Object} edgeData - Edge data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created edge
 */
async function createEdge(edgeData, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const {
      sourceNodeId,
      targetNodeId,
      edgeType,
      edgeLabel,
      edgeWeight = 1.0,
      isCrossDomain = false,
      properties = {},
    } = edgeData;

    const { data, error } = await supabase
      .from('brain_knowledge_graph_edges')
      .insert({
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        edge_type: edgeType,
        edge_label: edgeLabel,
        edge_weight: edgeWeight,
        is_cross_domain: isCrossDomain,
        properties: properties,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create edge: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('[Knowledge Graph] Create edge error:', error);
    throw error;
  }
}

/**
 * Get graph statistics
 * @param {string} domainId - Domain ID (optional)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Graph statistics
 */
async function getGraphStatistics(domainId, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    let nodesQuery = supabase
      .from('brain_knowledge_graph_nodes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    let edgesQuery = supabase
      .from('brain_knowledge_graph_edges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (domainId) {
      nodesQuery = nodesQuery.eq('domain_id', domainId);
      // For edges, we need to check both source and target nodes
      const { data: nodeIds } = await supabase
        .from('brain_knowledge_graph_nodes')
        .select('id')
        .eq('domain_id', domainId)
        .eq('user_id', userId);

      if (nodeIds && nodeIds.length > 0) {
        const ids = nodeIds.map((n) => n.id);
        edgesQuery = edgesQuery
          .in('source_node_id', ids)
          .or(`target_node_id.in.(${ids.join(',')})`);
      } else {
        edgesQuery = edgesQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // No results
      }
    }

    const [{ count: nodeCount }, { count: edgeCount }] = await Promise.all([
      nodesQuery,
      edgesQuery,
    ]);

    return {
      nodeCount: nodeCount || 0,
      edgeCount: edgeCount || 0,
      domainId: domainId || 'all',
    };
  } catch (error) {
    console.error('[Knowledge Graph] Statistics error:', error);
    throw error;
  }
}

module.exports = {
  buildGraph,
  findPaths,
  getRelatedConcepts,
  traverseGraph,
  createNode,
  createEdge,
  getGraphStatistics,
  isConfigured: !!supabase,
};
