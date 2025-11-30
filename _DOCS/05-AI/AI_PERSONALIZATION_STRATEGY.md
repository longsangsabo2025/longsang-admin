# 🧠 AI PERSONALIZATION STRATEGY
## "AI Hiểu Bạn" - Core MVP Feature

> **Mục tiêu**: Các AI Agent không chỉ trả lời chung chung mà THỰC SỰ hiểu Long Sang, hiểu context dự án, lĩnh vực kinh doanh, và style làm việc.

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ✅ Đã có:
| Component | Status | Location |
|-----------|--------|----------|
| Embedding Service | ✅ Working | `api/services/ai-workspace/embedding-service.js` |
| Context Retrieval | ✅ Working | `api/services/ai-workspace/context-retrieval.js` |
| Memory Service | ✅ Working | `api/services/ai-workspace/memory-service.js` |
| Conversation History | ✅ Working | Supabase `conversations` table |
| VectorStore (RAG) | ✅ Ready | `src/lib/ai/vector-store.ts` |
| 6 AI Assistants | ✅ Working | `api/services/ai-workspace/assistants.js` |

### ❌ Chưa có:
| Component | Priority | Impact |
|-----------|----------|--------|
| Knowledge Base cho Long Sang | 🔴 Critical | 10/10 |
| Personal Context Profile | 🔴 Critical | 10/10 |
| Document Embedding Pipeline | 🟡 High | 8/10 |
| Project Context Injection | 🟡 High | 8/10 |
| Learning from Conversations | 🟢 Medium | 6/10 |

---

## 🎯 CHIẾN LƯỢC TRIỂN KHAI

### Phase 1: KNOWLEDGE BASE FOUNDATION (Week 1)
**Mục tiêu**: Tạo nền tảng dữ liệu cho AI hiểu context

#### 1.1 Admin Profile Table
```sql
-- admin_profile: Thông tin cá nhân + business context
CREATE TABLE admin_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Personal Info
  full_name TEXT DEFAULT 'Long Sang',
  role TEXT DEFAULT 'Founder & CEO',
  communication_style TEXT DEFAULT 'professional', -- casual, formal, technical
  preferred_language TEXT DEFAULT 'vi',
  
  -- Business Context
  company_name TEXT DEFAULT 'LongSang Tech',
  industries JSONB DEFAULT '["AI/ML", "Real Estate", "EdTech", "Gaming"]',
  current_focus TEXT,
  business_goals JSONB,
  
  -- AI Preferences
  response_length TEXT DEFAULT 'medium', -- short, medium, detailed
  expertise_level TEXT DEFAULT 'expert', -- beginner, intermediate, expert
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Knowledge Base Table (với Vector)
```sql
-- knowledge_base: Kiến thức + embedding
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Content
  category TEXT NOT NULL, -- 'project', 'business', 'personal', 'domain', 'reference'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  
  -- Metadata
  source TEXT, -- 'manual', 'conversation', 'document', 'import'
  source_url TEXT,
  tags TEXT[],
  importance INTEGER DEFAULT 5, -- 1-10
  
  -- Vector for RAG
  embedding vector(1536),
  
  -- Stats
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search function
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id text DEFAULT 'default-longsang-user'
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  tags TEXT[],
  similarity float
) AS $$
  SELECT
    id,
    category,
    title,
    content,
    tags,
    1 - (embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE user_id = filter_user_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

#### 1.3 Project Context Table
```sql
-- project_knowledge: Context cho từng project
CREATE TABLE project_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Context
  context_type TEXT NOT NULL, -- 'overview', 'tech_stack', 'goals', 'challenges', 'decisions'
  content TEXT NOT NULL,
  embedding vector(1536),
  
  -- Metadata
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Phase 2: KNOWLEDGE INGESTION (Week 1-2)
**Mục tiêu**: Đưa data vào Knowledge Base

#### 2.1 Initial Data Seed
```javascript
// Seed initial knowledge về Long Sang
const LONGSANG_KNOWLEDGE = [
  {
    category: 'business',
    title: 'LongSang Tech - Company Overview',
    content: `
      LongSang Tech là công ty khởi nghiệp công nghệ tập trung vào:
      - AI/ML Solutions: Phát triển các ứng dụng AI thông minh
      - Real Estate Tech: Nền tảng bất động sản Vũng Tàu Dream Homes
      - EdTech: Khóa học AI cho người mới (AI Newbie)
      - Gaming: Sabo Hub - Hệ sinh thái gaming
      
      Founder: Long Sang - Full-stack developer với expertise về AI
      Team: Small, agile team với focus on automation
    `,
    importance: 10,
    tags: ['company', 'overview', 'core'],
  },
  {
    category: 'project',
    title: 'AI Newbie - EdTech Platform',
    content: `
      AI Newbie là nền tảng đào tạo AI cho người mới bắt đầu:
      - Target: Người Việt muốn học AI/ML từ cơ bản
      - Features: Khóa học online, AI assistant, hands-on projects
      - Tech stack: React, Node.js, OpenAI, Supabase
      - Status: MVP development
      - Revenue model: Subscription + Premium courses
    `,
    importance: 9,
    tags: ['project', 'edtech', 'ai-newbie'],
  },
  {
    category: 'project',
    title: 'Vũng Tàu Dream Homes - Real Estate',
    content: `
      Nền tảng bất động sản tập trung vào thị trường Vũng Tàu:
      - Target: Người mua/thuê BĐS tại Vũng Tàu
      - Features: Listings, 3D tours, AI property matching
      - Integration: Google Maps, VNPay
      - Status: Active development
    `,
    importance: 8,
    tags: ['project', 'real-estate', 'vungtau'],
  },
  {
    category: 'project',
    title: 'Sabo Hub - Gaming Ecosystem',
    content: `
      Hệ sinh thái gaming bao gồm:
      - Sabo Hub: Platform chính
      - Sabo Arena: Gaming competitions
      - Features: Tournaments, streaming, community
    `,
    importance: 7,
    tags: ['project', 'gaming', 'sabo'],
  },
  {
    category: 'personal',
    title: 'Long Sang - Working Style',
    content: `
      Communication style: Direct, efficient, likes bullet points
      Preferred format: Structured responses with actionable items
      Language: Vietnamese primary, English technical terms OK
      Decision making: Data-driven, fast iteration
      Tools preference: VS Code, GitHub Copilot, n8n automation
      Focus areas: Automation, AI integration, productivity
    `,
    importance: 10,
    tags: ['personal', 'style', 'preferences'],
  },
  {
    category: 'domain',
    title: 'Tech Stack Overview',
    content: `
      Frontend: React, TypeScript, TailwindCSS, Shadcn UI
      Backend: Node.js, Express, Supabase
      AI: OpenAI GPT-4o, Claude 3.5, Anthropic
      Database: PostgreSQL (Supabase), pgvector
      Automation: n8n, GitHub Actions
      Deployment: Vercel, Docker
      Payment: Stripe, VNPay
    `,
    importance: 8,
    tags: ['tech', 'stack', 'tools'],
  },
];
```

#### 2.2 Document Import Pipeline
```javascript
// Import documents từ folder/uploads
async function importDocuments(folderPath) {
  // 1. Read all .md, .txt, .pdf files
  // 2. Extract text content
  // 3. Chunk into smaller pieces (500-1000 tokens)
  // 4. Generate embeddings
  // 5. Store in knowledge_base
}
```

#### 2.3 Conversation Learning
```javascript
// Auto-extract knowledge from conversations
async function learnFromConversation(conversation) {
  // 1. Detect important info (names, decisions, preferences)
  // 2. Summarize key points
  // 3. Add to knowledge_base with lower importance
  // 4. Link back to conversation source
}
```

---

### Phase 3: CONTEXT INJECTION (Week 2)
**Mục tiêu**: Inject knowledge vào AI prompts

#### 3.1 Enhanced Prompt Builder
```javascript
// api/services/ai-workspace/prompt-builder.js

async function buildEnhancedPrompt({ 
  assistantType, 
  query, 
  userId,
  conversationHistory 
}) {
  // 1. Get admin profile
  const profile = await getAdminProfile(userId);
  
  // 2. Search relevant knowledge
  const knowledge = await searchKnowledge(query, {
    userId,
    categories: getRelevantCategories(assistantType),
    limit: 10,
    threshold: 0.7,
  });
  
  // 3. Get project context if relevant
  const projectContext = await getProjectContext(query);
  
  // 4. Build personalized system prompt
  const systemPrompt = `
${BASE_PROMPTS[assistantType]}

## 👤 Admin Profile:
- Name: ${profile.full_name}
- Role: ${profile.role}
- Company: ${profile.company_name}
- Industries: ${profile.industries.join(', ')}
- Communication style: ${profile.communication_style}
- Response preference: ${profile.response_length}

## 📚 Relevant Knowledge:
${knowledge.map(k => `### ${k.title}\n${k.content}`).join('\n\n')}

## 🎯 Project Context:
${projectContext ? projectContext.content : 'No specific project context'}

## ⚡ Instructions:
- Address ${profile.full_name} appropriately
- Match ${profile.communication_style} communication style
- Focus on ${profile.current_focus || 'general tasks'}
- Use Vietnamese unless technical terms
`;

  return systemPrompt;
}
```

#### 3.2 Update Assistants to Use Enhanced Context
```javascript
// Modify assistants.js to use prompt-builder
async function handleAssistant({ assistantType, query, userId, ... }) {
  // Use enhanced prompt builder
  const systemPrompt = await buildEnhancedPrompt({
    assistantType,
    query,
    userId,
    conversationHistory,
  });
  
  // Continue with AI call...
}
```

---

### Phase 4: UI INTEGRATION (Week 2-3)
**Mục tiêu**: UI để manage Knowledge Base

#### 4.1 Knowledge Base Manager Page
- View all knowledge entries
- Add/Edit/Delete entries
- Import from documents
- Search and filter
- Stats dashboard

#### 4.2 Admin Profile Settings
- Edit profile info
- Set communication preferences
- Manage business context
- Review learned knowledge

#### 4.3 Real-time Learning Indicator
- Show when AI learns something new
- Allow approve/reject learned items
- History of learned knowledge

---

## 🏗️ IMPLEMENTATION PRIORITY

### Week 1 (Foundation):
| Task | Priority | Est. Hours |
|------|----------|------------|
| Create DB migrations | 🔴 P0 | 2h |
| Seed initial knowledge | 🔴 P0 | 4h |
| Create prompt-builder service | 🔴 P0 | 4h |
| Update assistants.js | 🔴 P0 | 3h |
| Test with all 6 assistants | 🔴 P0 | 2h |

### Week 2 (Enhancement):
| Task | Priority | Est. Hours |
|------|----------|------------|
| Document import pipeline | 🟡 P1 | 6h |
| Conversation learning | 🟡 P1 | 4h |
| Knowledge Base UI | 🟡 P1 | 8h |
| Admin Profile Settings | 🟡 P1 | 4h |

### Week 3 (Polish):
| Task | Priority | Est. Hours |
|------|----------|------------|
| Learning indicator UI | 🟢 P2 | 4h |
| Analytics dashboard | 🟢 P2 | 4h |
| Performance optimization | 🟢 P2 | 4h |
| Documentation | 🟢 P2 | 2h |

---

## 📈 SUCCESS METRICS

### Before vs After:
| Metric | Before | Target After |
|--------|--------|--------------|
| Context relevance | 30% | 85%+ |
| User satisfaction | Unknown | 4.5/5 |
| Response accuracy | 60% | 90%+ |
| Personalization | None | High |

### Validation Criteria:
1. ✅ AI knows Long Sang's name and role
2. ✅ AI understands current projects
3. ✅ AI uses appropriate communication style
4. ✅ AI can reference past decisions
5. ✅ AI provides project-specific suggestions

---

## 🚀 IMMEDIATE NEXT STEPS

1. **Review this plan** - Approve/modify priorities
2. **Create DB migrations** - Start with Phase 1.1, 1.2
3. **Seed initial data** - Input Long Sang's core knowledge
4. **Build prompt-builder** - Enhanced context injection
5. **Test and iterate** - Validate with real conversations

---

## 📁 FILES TO CREATE/MODIFY

### New Files:
```
api/
├── services/ai-workspace/
│   ├── prompt-builder.js          # Enhanced prompt building
│   ├── knowledge-service.js       # Knowledge CRUD + search
│   └── learning-service.js        # Auto-learn from conversations
├── routes/
│   └── knowledge.js               # Knowledge API endpoints
└── migrations/
    └── 001_knowledge_base.sql     # DB migrations

src/
└── pages/
    └── KnowledgeBase.tsx          # Knowledge management UI
```

### Files to Modify:
```
api/services/ai-workspace/assistants.js  # Use prompt-builder
api/services/ai-workspace/prompts.js     # Add profile injection
```

---

**Ready to start Phase 1?** 🚀
