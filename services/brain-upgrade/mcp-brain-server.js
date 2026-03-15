#!/usr/bin/env node
/**
 * 🧠 MCP BRAIN SERVER
 * 
 * Exposes Second Brain via Model Context Protocol (MCP).
 * This allows Windsurf, Claude Desktop, Cursor, and n8n to
 * directly access your Brain knowledge.
 * 
 * Tools exposed:
 * - brain_search: Search knowledge by query
 * - brain_ingest: Add new knowledge
 * - brain_domains: List all domains
 * - brain_core_logic: Get core logic for a domain
 * - brain_stats: Get Brain statistics
 * - brain_chat: Chat with Brain RAG
 * 
 * Usage:
 *   node mcp-brain-server.js
 * 
 * MCP Config (add to .vscode/mcp.json or claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "brain": {
 *         "command": "node",
 *         "args": ["D:/0.PROJECTS/00-MASTER-ADMIN/apps/admin/brain-upgrade/mcp-brain-server.js"],
 *         "env": {
 *           "SUPABASE_URL": "...",
 *           "SUPABASE_SERVICE_KEY": "...",
 *           "OPENAI_API_KEY": "..."
 *         }
 *       }
 *     }
 *   }
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const USER_ID = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

async function searchBrain(query, limit = 5, threshold = 0.3) {
  const embedding = await generateEmbedding(query);
  
  const { data, error } = await supabase.rpc('match_knowledge_v2', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    user_id_filter: USER_ID,
    importance_weight: 0.2,
    time_decay_days: 30,
  });
  
  if (error) {
    // Fallback to v1
    const { data: v1Data, error: v1Error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      user_id_filter: USER_ID,
    });
    if (v1Error) throw new Error(`Brain search failed: ${v1Error.message}`);
    return v1Data || [];
  }
  
  return data || [];
}

async function getDomains() {
  const { data, error } = await supabase
    .from('brain_domains')
    .select('id, name, description, created_at')
    .eq('user_id', USER_ID)
    .order('name');
  
  if (error) throw new Error(`Failed to get domains: ${error.message}`);
  return data || [];
}

async function getCoreLogic(domainId) {
  const { data, error } = await supabase
    .from('brain_core_logic')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('domain_id', domainId);
  
  if (error) throw new Error(`Failed to get core logic: ${error.message}`);
  return data || [];
}

async function getStats() {
  const { count: knowledgeCount } = await supabase
    .from('brain_knowledge')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID);
  
  const { count: domainCount } = await supabase
    .from('brain_domains')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID);
  
  const { count: coreLogicCount } = await supabase
    .from('brain_core_logic')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID);
  
  return {
    knowledge_items: knowledgeCount || 0,
    domains: domainCount || 0,
    core_logic_items: coreLogicCount || 0,
  };
}

async function ingestKnowledge(title, content, domain, tags = []) {
  // Find or create domain
  let domainId;
  const { data: existingDomain } = await supabase
    .from('brain_domains')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('name', domain)
    .single();
  
  if (existingDomain) {
    domainId = existingDomain.id;
  } else {
    const { data: newDomain, error } = await supabase
      .from('brain_domains')
      .insert({ user_id: USER_ID, name: domain })
      .select('id')
      .single();
    if (error) throw new Error(`Failed to create domain: ${error.message}`);
    domainId = newDomain.id;
  }
  
  // Generate embedding
  const embedding = await generateEmbedding(content);
  
  // Insert knowledge
  const { data, error } = await supabase
    .from('brain_knowledge')
    .insert({
      user_id: USER_ID,
      domain_id: domainId,
      title,
      content,
      tags,
      embedding: `[${embedding.join(',')}]`,
      importance_score: 3,
      content_type: 'note',
    })
    .select('id')
    .single();
  
  if (error) throw new Error(`Failed to ingest: ${error.message}`);
  return { id: data.id, domain, domainId };
}

async function chatWithBrain(query) {
  // Search for relevant context
  const results = await searchBrain(query, 5, 0.3);
  
  // Build context
  const context = results.map((r, i) => 
    `[${i + 1}] ${r.title} (relevance: ${Math.round(r.similarity * 100)}%)\n${r.content}`
  ).join('\n\n---\n\n');
  
  const systemPrompt = context 
    ? `Bạn là AI Assistant với Second Brain. Sử dụng context sau để trả lời:\n\n${context}\n\nQuy tắc: Ưu tiên thông tin từ Brain, cite source, trả lời tiếng Việt.`
    : 'Bạn là AI Assistant thông minh. Trả lời tiếng Việt, ngắn gọn.';
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });
  
  return {
    answer: response.choices[0].message.content,
    sources: results.map(r => ({ title: r.title, relevance: Math.round(r.similarity * 100) })),
    rag_applied: results.length > 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// MCP Server setup
// ═══════════════════════════════════════════════════════════════

const server = new Server(
  { name: 'brain-second-brain', version: '3.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// ── List Tools ──

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'brain_search',
      description: 'Search the Second Brain knowledge base. Use this to find relevant knowledge about projects, business concepts, books, marketing skills, or any stored knowledge. Returns top matching results with relevance scores.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query in natural language (Vietnamese or English)' },
          limit: { type: 'number', description: 'Max results (default: 5)', default: 5 },
        },
        required: ['query'],
      },
    },
    {
      name: 'brain_ingest',
      description: 'Add new knowledge to the Second Brain. Use this to save important information, learnings, or notes that should be remembered for future reference.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title for the knowledge item' },
          content: { type: 'string', description: 'The knowledge content to store' },
          domain: { type: 'string', description: 'Knowledge domain/category (e.g., "business", "tech", "project-docs")' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        },
        required: ['title', 'content', 'domain'],
      },
    },
    {
      name: 'brain_domains',
      description: 'List all knowledge domains in the Second Brain. Shows how knowledge is organized.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'brain_core_logic',
      description: 'Get distilled Core Logic (First Principles, Decision Rules, Mental Models) for a specific domain. This is the most concentrated form of knowledge.',
      inputSchema: {
        type: 'object',
        properties: {
          domain_id: { type: 'string', description: 'Domain ID to get core logic for' },
        },
        required: ['domain_id'],
      },
    },
    {
      name: 'brain_stats',
      description: 'Get Second Brain statistics — total knowledge items, domains, core logic count.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'brain_chat',
      description: 'Chat with the Second Brain using RAG (Retrieval-Augmented Generation). Ask questions and get answers grounded in your personal knowledge base.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Question to ask the Brain' },
        },
        required: ['query'],
      },
    },
  ],
}));

// ── Call Tool ──

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'brain_search': {
        const results = await searchBrain(args.query, args.limit || 5);
        const formatted = results.map((r, i) => 
          `[${i + 1}] **${r.title}** (${Math.round(r.similarity * 100)}% relevant)\n${r.content?.substring(0, 500)}${r.content?.length > 500 ? '...' : ''}`
        ).join('\n\n---\n\n');
        
        return {
          content: [{
            type: 'text',
            text: results.length > 0 
              ? `Found ${results.length} results for "${args.query}":\n\n${formatted}`
              : `No results found for "${args.query}". Try a different query or check brain_domains for available topics.`,
          }],
        };
      }
      
      case 'brain_ingest': {
        const result = await ingestKnowledge(args.title, args.content, args.domain, args.tags || []);
        return {
          content: [{
            type: 'text',
            text: `✅ Knowledge saved!\n- ID: ${result.id}\n- Domain: ${result.domain}\n- Title: ${args.title}`,
          }],
        };
      }
      
      case 'brain_domains': {
        const domains = await getDomains();
        const formatted = domains.map(d => `- **${d.name}**: ${d.description || '(no description)'}`).join('\n');
        return {
          content: [{
            type: 'text',
            text: `📚 ${domains.length} domains in Brain:\n\n${formatted}`,
          }],
        };
      }
      
      case 'brain_core_logic': {
        const coreLogic = await getCoreLogic(args.domain_id);
        if (coreLogic.length === 0) {
          return { content: [{ type: 'text', text: 'No core logic found for this domain. Run distillation first.' }] };
        }
        const formatted = coreLogic.map(cl => `### ${cl.logic_type}: ${cl.title}\n${cl.content}`).join('\n\n');
        return {
          content: [{ type: 'text', text: `🧠 Core Logic (${coreLogic.length} items):\n\n${formatted}` }],
        };
      }
      
      case 'brain_stats': {
        const stats = await getStats();
        return {
          content: [{
            type: 'text',
            text: `📊 Brain Stats:\n- Knowledge items: ${stats.knowledge_items}\n- Domains: ${stats.domains}\n- Core Logic items: ${stats.core_logic_items}`,
          }],
        };
      }
      
      case 'brain_chat': {
        const result = await chatWithBrain(args.query);
        const sourcesText = result.sources.length > 0 
          ? `\n\n📚 Sources:\n${result.sources.map(s => `- ${s.title} (${s.relevance}%)`).join('\n')}`
          : '';
        return {
          content: [{
            type: 'text',
            text: `${result.answer}${sourcesText}`,
          }],
        };
      }
      
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ── List Resources ──

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'brain://stats',
      name: 'Brain Statistics',
      description: 'Current Second Brain statistics',
      mimeType: 'application/json',
    },
  ],
}));

// ── Read Resource ──

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'brain://stats') {
    const stats = await getStats();
    return {
      contents: [{
        uri: 'brain://stats',
        mimeType: 'application/json',
        text: JSON.stringify(stats, null, 2),
      }],
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// ═══════════════════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Brain MCP] 🧠 Second Brain MCP Server v3.0 running');
  console.error(`[Brain MCP] Supabase: ${SUPABASE_URL}`);
  console.error(`[Brain MCP] User: ${USER_ID}`);
}

main().catch((error) => {
  console.error('[Brain MCP] Fatal error:', error);
  process.exit(1);
});
