# 🤖 AI INTEGRATION PLAN
## LongSang Admin Documentation - AI Features Implementation

> **Created:** 2025-01-XX
> **Purpose:** Detailed plan for AI-powered features in documentation system
> **Status:** Planning Phase

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [AI Features Architecture](#2-ai-features-architecture)
3. [Semantic Search Implementation](#3-semantic-search-implementation)
4. [AI Chatbot Implementation](#4-ai-chatbot-implementation)
5. [Auto-Documentation Generation](#5-auto-documentation-generation)
6. [Code Explanation Feature](#6-code-explanation-feature)
7. [Component Implementation](#7-component-implementation)
8. [API Design](#8-api-design)
9. [Database Schema](#9-database-schema)
10. [Deployment & Monitoring](#10-deployment--monitoring)

---

## 1. OVERVIEW

### 1.1 AI Features Summary

| Feature | Technology | Status | Priority |
|---------|------------|--------|----------|
| **Semantic Search** | pgvector + OpenAI embeddings | 🟡 Planned | 🔴 High |
| **AI Chatbot** | GPT-4o-mini | 🟡 Planned | 🔴 High |
| **Code Explanation** | GPT-4o-mini | 🟡 Planned | 🟡 Medium |
| **Auto-Doc Generation** | GPT-4o-mini | 🟡 Planned | 🟡 Medium |
| **Smart Suggestions** | GPT-4o-mini | 🟢 Future | 🟢 Low |

### 1.2 Technology Stack

- **Embeddings:** OpenAI `text-embedding-3-small`
- **Vector DB:** Supabase pgvector
- **LLM:** OpenAI GPT-4o-mini
- **Search:** Algolia DocSearch (keyword) + Custom RAG (semantic)
- **Frontend:** React + Next.js
- **Backend:** Next.js API Routes

---

## 2. AI FEATURES ARCHITECTURE

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Documentation Site                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Search Bar  │  │ AI Chatbot   │  │ Code Explainer│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Search API   │  │  Chat API    │  │ Explain API  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    AI Services Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Embeddings   │  │   GPT-4o     │  │   GPT-4o     │  │
│  │   Service    │  │   Chat       │  │   Explain    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Storage                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Supabase    │  │   OpenAI     │                    │
│  │  pgvector    │  │   API        │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Search Flow:**
1. User enters query
2. Generate query embedding (OpenAI)
3. Vector search (Supabase pgvector)
4. Retrieve top K results
5. Optional re-ranking
6. Return results to frontend

**Chat Flow:**
1. User asks question
2. Retrieve relevant context (RAG)
3. Build prompt with context
4. Call GPT-4o-mini
5. Stream response
6. Show sources

---

## 3. SEMANTIC SEARCH IMPLEMENTATION

### 3.1 Database Schema

```sql
-- Documentation embeddings table
CREATE TABLE doc_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_path TEXT NOT NULL UNIQUE,
  doc_title TEXT NOT NULL,
  doc_content TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- 'page', 'api', 'component', 'guide'
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX ON doc_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for text search
CREATE INDEX idx_doc_embeddings_content ON doc_embeddings
USING gin(to_tsvector('english', doc_content));

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  doc_path text,
  doc_title text,
  doc_content text,
  doc_type text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    doc_embeddings.id,
    doc_embeddings.doc_path,
    doc_embeddings.doc_title,
    doc_embeddings.doc_content,
    doc_embeddings.doc_type,
    1 - (doc_embeddings.embedding <=> query_embedding) as similarity,
    doc_embeddings.metadata
  FROM doc_embeddings
  WHERE
    (filter_type IS NULL OR doc_embeddings.doc_type = filter_type)
    AND 1 - (doc_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY doc_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 3.2 Embedding Service

```typescript
// lib/ai/embeddings.ts
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface DocContent {
  path: string;
  title: string;
  content: string;
  type: 'page' | 'api' | 'component' | 'guide';
  metadata?: Record<string, any>;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

export async function indexDocument(doc: DocContent): Promise<void> {
  // Generate embedding
  const embedding = await generateEmbedding(
    `${doc.title}\n\n${doc.content}`
  );

  // Store in database
  const { error } = await supabase
    .from('doc_embeddings')
    .upsert({
      doc_path: doc.path,
      doc_title: doc.title,
      doc_content: doc.content,
      doc_type: doc.type,
      embedding: embedding,
      metadata: doc.metadata || {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'doc_path',
    });

  if (error) {
    throw new Error(`Failed to index document: ${error.message}`);
  }
}

export async function searchDocuments(
  query: string,
  options: {
    threshold?: number;
    limit?: number;
    type?: string;
  } = {}
): Promise<SearchResult[]> {
  const {
    threshold = 0.7,
    limit = 5,
    type = null,
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Vector similarity search
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_type: type,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
}

export interface SearchResult {
  id: string;
  doc_path: string;
  doc_title: string;
  doc_content: string;
  doc_type: string;
  similarity: number;
  metadata: Record<string, any>;
}
```

### 3.3 Search API Route

```typescript
// pages/api/search.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { searchDocuments } from '@/lib/ai/embeddings';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, type, limit = 5, threshold = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await searchDocuments(query, {
      threshold,
      limit,
      type,
    });

    return res.status(200).json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({
      error: 'Search failed',
      message: error.message,
    });
  }
}
```

### 3.4 Frontend Search Component

```typescript
// components/ai/DocsSearchAI.tsx
'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  doc_path: string;
  doc_title: string;
  doc_content: string;
  similarity: number;
}

export function DocsSearchAI() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="Tìm kiếm hoặc hỏi AI..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
          {results.map((result) => (
            <a
              key={result.doc_path}
              href={result.doc_path}
              className="block p-4 hover:bg-gray-50 border-b last:border-b-0"
            >
              <h3 className="font-semibold">{result.doc_title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {result.doc_content}
              </p>
              <span className="text-xs text-gray-400">
                {(result.similarity * 100).toFixed(0)}% match
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 4. AI CHATBOT IMPLEMENTATION

### 4.1 Chat API Route

```typescript
// pages/api/chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { searchDocuments } from '@/lib/ai/embeddings';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [], contextMode = 'full-docs' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Retrieve relevant context using RAG
    const contextDocs = await searchDocuments(message, {
      limit: 3,
      threshold: 0.7,
    });

    // Build context string
    const context = contextDocs
      .map((doc) => `## ${doc.doc_title}\n${doc.doc_content}`)
      .join('\n\n---\n\n');

    // Build system prompt
    const systemPrompt = `You are a helpful documentation assistant for LongSang Admin.
You answer questions based on the provided documentation context.
If the answer is not in the context, say so.

Context:
${context}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      response,
      sources: contextDocs.map((doc) => ({
        title: doc.doc_title,
        path: doc.doc_path,
      })),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Chat failed',
      message: error.message,
    });
  }
}
```

### 4.2 Chatbot Component

```typescript
// components/ai/AskAIWidget.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; path: string }>;
}

export function AskAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        aria-label="Open AI chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white border rounded-lg shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Ask AI</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Ask me anything about the documentation!</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-semibold mb-1">Sources:</p>
                  {message.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.path}
                      className="text-xs text-blue-600 hover:underline block"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. AUTO-DOCUMENTATION GENERATION

### 5.1 Generation Script

```typescript
// scripts/generate-api-docs.ts
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface APIRoute {
  file: string;
  method: string;
  path: string;
  description: string;
  params: Array<{ name: string; type: string; required: boolean; description: string }>;
  response: any;
}

async function generateAPIDoc(route: APIRoute): Promise<string> {
  const prompt = `Generate comprehensive API documentation in MDX format for this endpoint:

Method: ${route.method}
Path: ${route.path}
Description: ${route.description}
Parameters: ${JSON.stringify(route.params, null, 2)}
Response: ${JSON.stringify(route.response, null, 2)}

Include:
- Overview
- Authentication requirements
- Request parameters table
- Response format
- Example requests (cURL, JavaScript)
- Error handling

Format as MDX with proper frontmatter.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return completion.choices[0].message.content || '';
}

async function parseAPIRoute(filePath: string): Promise<APIRoute | null> {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Parse and extract route information
  // Implementation depends on your route structure
  // This is a simplified example
  return null;
}

async function generateAllAPIDocs() {
  const routesDir = path.join(process.cwd(), '../api/routes');
  const outputDir = path.join(process.cwd(), 'pages/api-reference');

  const files = fs.readdirSync(routesDir);

  for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

    const route = await parseAPIRoute(path.join(routesDir, file));
    if (!route) continue;

    const doc = await generateAPIDoc(route);
    const outputPath = path.join(outputDir, `${route.path.replace(/\//g, '-')}.mdx`);

    fs.writeFileSync(outputPath, doc);
    console.log(`Generated: ${outputPath}`);
  }
}

generateAllAPIDocs().catch(console.error);
```

---

## 6. CODE EXPLANATION FEATURE

### 6.1 Code Explainer Component

```typescript
// components/ai/CodeExplainer.tsx
'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface CodeExplainerProps {
  code: string;
  language: string;
}

export function CodeExplainer({ code, language }: CodeExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Explanation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleExplain}
        className="absolute top-2 right-2 z-10 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Explain Code
      </button>

      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {explanation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold mb-2">Explanation:</h4>
          <p className="text-sm">{explanation}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 7. COMPONENT IMPLEMENTATION

### 7.1 Component List

| Component | File | Status |
|-----------|------|--------|
| `DocsSearchAI` | `components/ai/DocsSearchAI.tsx` | 🟡 To Implement |
| `AskAIWidget` | `components/ai/AskAIWidget.tsx` | 🟡 To Implement |
| `CodeExplainer` | `components/ai/CodeExplainer.tsx` | 🟡 To Implement |
| `AutoDocBadge` | `components/ai/AutoDocBadge.tsx` | 🟡 To Implement |

### 7.2 Implementation Priority

1. **DocsSearchAI** - High priority (core feature)
2. **AskAIWidget** - High priority (core feature)
3. **CodeExplainer** - Medium priority
4. **AutoDocBadge** - Low priority

---

## 8. API DESIGN

### 8.1 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | POST | Semantic search |
| `/api/chat` | POST | AI chatbot |
| `/api/explain-code` | POST | Code explanation |
| `/api/index-doc` | POST | Index new document |
| `/api/reindex-all` | POST | Reindex all documents |

### 8.2 Request/Response Formats

**Search Request:**
```json
{
  "query": "How to use AI workspace?",
  "type": "guide",
  "limit": 5,
  "threshold": 0.7
}
```

**Search Response:**
```json
{
  "success": true,
  "results": [
    {
      "doc_path": "/guides/ai-workspace",
      "doc_title": "AI Workspace Guide",
      "doc_content": "...",
      "similarity": 0.85
    }
  ],
  "count": 1
}
```

---

## 9. DATABASE SCHEMA

### 9.1 Tables

- `doc_embeddings` - Document embeddings for search
- `chat_sessions` - Chat conversation history (optional)
- `doc_analytics` - Documentation usage analytics (optional)

### 9.2 Migration Script

See Section 3.1 for complete SQL schema.

---

## 10. DEPLOYMENT & MONITORING

### 10.1 Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Features
NEXT_PUBLIC_AI_CHAT_ENABLED=true
NEXT_PUBLIC_AI_SEARCH_ENABLED=true
```

### 10.2 Monitoring

- Track search queries
- Monitor API usage (OpenAI)
- Track chat sessions
- Error logging

### 10.3 Cost Estimation

- **Embeddings:** ~$0.02 per 1M tokens
- **GPT-4o-mini:** ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Estimated monthly:** $50-200 (depending on usage)

---

## 11. IMPLEMENTATION TIMELINE

### Week 1: Foundation
- [ ] Setup database schema
- [ ] Implement embedding service
- [ ] Create search API

### Week 2: Search Feature
- [ ] Build DocsSearchAI component
- [ ] Integrate with Algolia
- [ ] Test and optimize

### Week 3: Chatbot
- [ ] Implement chat API
- [ ] Build AskAIWidget component
- [ ] Add conversation history

### Week 4: Polish
- [ ] Code explanation feature
- [ ] Auto-doc generation
- [ ] Performance optimization

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-01-XX

