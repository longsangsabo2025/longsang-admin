/**
 * AI Workspace RAG System - Migration Runner
 * Chạy migrations qua Supabase PostgreSQL (Transaction Pooler)
 * 
 * ⚠️ QUY ĐỊNH: KHÔNG THÊM RLS - App chỉ có 1 user
 * 
 * Usage: 
 *   1. Set DATABASE_URL trong .env.local
 *   2. node scripts/run-migrations.cjs
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================
// Migration 1: Vector Extension
// ============================================
const migration1_vector = `
CREATE EXTENSION IF NOT EXISTS vector;
`;

// ============================================
// Migration 2: RAG System Tables
// ⚠️ NO RLS - Single user app
// ============================================
const migration2_rag = `
-- Documents table for RAG
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  source_type TEXT NOT NULL,
  source_id TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  assistant_type TEXT NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent executions tracking
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  agent_type TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model_used TEXT,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Response cache table
CREATE TABLE IF NOT EXISTS response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  assistant_type TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// ============================================
// Migration 2b: Indexes
// ============================================
const migration2b_indexes = `
-- HNSW Index for fast similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for filtering
CREATE INDEX IF NOT EXISTS documents_source_type_idx ON documents(source_type);
CREATE INDEX IF NOT EXISTS conversations_created_idx ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS agent_executions_status_idx ON agent_executions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS response_cache_hash_idx ON response_cache(query_hash);
CREATE INDEX IF NOT EXISTS response_cache_type_idx ON response_cache(assistant_type, created_at DESC);
`;

// ============================================
// Migration 2d: Functions
// ============================================
const migration2d_functions = `
-- Function: match_documents for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  source_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    (1 - (d.embedding <=> query_embedding))::FLOAT AS similarity,
    d.metadata,
    d.source_type
  FROM documents d
  WHERE
    d.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND (filter_source_types IS NULL OR d.source_type = ANY(filter_source_types))
    AND (1 - (d.embedding <=> query_embedding)) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

// ============================================
// Migration 3: n8n Integration Tables
// ⚠️ NO RLS - Single user app
// ============================================
const migration3_n8n = `
-- News digests table
CREATE TABLE IF NOT EXISTS news_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_digests_created_idx ON news_digests(created_at DESC);

-- Financial summaries table
CREATE TABLE IF NOT EXISTS financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  content TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS financial_summaries_created_idx ON financial_summaries(created_at DESC);
`;

// ============================================
// Run Migrations
// ============================================
async function runMigrations() {
  const client = await pool.connect();
  
  console.log('🚀 AI Workspace RAG System - Migration Runner');
  console.log('⚠️  NO RLS MODE - Single user app');
  console.log('━'.repeat(50));
  console.log('📡 Connecting to Supabase (Transaction Pooler)...');
  
  try {
    const { rows } = await client.query('SELECT version()');
    console.log('✅ Connected to PostgreSQL');
    console.log('   Version: ' + rows[0].version.split(',')[0]);
    console.log('━'.repeat(50));

    // Migration 1: Vector Extension
    console.log('\n📦 Migration 1: Vector Extension');
    try {
      await client.query(migration1_vector);
      console.log('   ✅ pgvector extension enabled');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ✅ pgvector extension already exists');
      } else {
        console.log('   ⚠️  ' + err.message);
      }
    }

    // Migration 2: RAG Tables
    console.log('\n📦 Migration 2: RAG System Tables (NO RLS)');
    try {
      await client.query(migration2_rag);
      console.log('   ✅ Tables created: documents, conversations, agent_executions, response_cache');
    } catch (err) {
      console.log('   ⚠️  ' + err.message);
    }

    // Migration 2b: Indexes
    console.log('\n📦 Migration 2b: Indexes');
    try {
      await client.query(migration2b_indexes);
      console.log('   ✅ Indexes created (including HNSW for vector search)');
    } catch (err) {
      console.log('   ⚠️  ' + err.message);
    }

    // Migration 2d: Functions
    console.log('\n📦 Migration 2d: Functions & Triggers');
    try {
      await client.query(migration2d_functions);
      console.log('   ✅ match_documents() function created');
      console.log('   ✅ updated_at triggers created');
    } catch (err) {
      console.log('   ⚠️  ' + err.message);
    }

    // Migration 3: n8n Tables
    console.log('\n📦 Migration 3: n8n Integration Tables (NO RLS)');
    try {
      await client.query(migration3_n8n);
      console.log('   ✅ Tables created: news_digests, financial_summaries');
    } catch (err) {
      console.log('   ⚠️  ' + err.message);
    }

    // Verification
    console.log('\n' + '━'.repeat(50));
    console.log('🔍 Verification');
    console.log('━'.repeat(50));

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('documents', 'conversations', 'agent_executions', 'response_cache', 'news_digests', 'financial_summaries')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables: ' + tablesResult.rows.length + '/6');
    tablesResult.rows.forEach(row => {
      console.log('   ✅ ' + row.table_name);
    });

    const vectorResult = await client.query(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'
    `);
    if (vectorResult.rows.length > 0) {
      console.log('\n📦 pgvector: v' + vectorResult.rows[0].extversion);
    }

    const funcResult = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'match_documents'
    `);
    if (funcResult.rows.length > 0) {
      console.log('\n⚡ Functions: match_documents() ✅');
    }

    console.log('\n' + '━'.repeat(50));
    console.log('🎉 All migrations completed!');
    console.log('🔓 RLS is DISABLED');
    console.log('━'.repeat(50));

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
