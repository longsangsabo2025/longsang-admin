/**
 * AI Second Brain - Strategic Knowledge Ingestion
 * 
 * Nạp kiến thức có phương pháp, chất lượng cao
 * Tuân theo Knowledge Strategy đã định nghĩa
 */

const API_URL = 'http://localhost:3001/api/brain';
const USER_ID = '6490f4e9-ed96-4121-9c70-bb4ad1feb71d';

const headers = {
  'Content-Type': 'application/json',
  'x-user-id': USER_ID
};

// ========================================
// 🎯 DOMAIN TAXONOMY - Phân loại rõ ràng
// ========================================

const DOMAIN_TAXONOMY = {
  // Mỗi domain có mục đích rõ ràng
  CORE: {
    name: 'Core Architecture',
    description: 'Kiến thức nền tảng về kiến trúc hệ thống - tech stack, design decisions, patterns. Ít thay đổi.',
    systemPrompt: `Bạn là kiến trúc sư phần mềm senior. Khi trả lời:
- Giải thích WHY trước WHAT (tại sao chọn giải pháp này)
- Đề cập trade-offs của mỗi quyết định
- Liên kết với các pattern/principle nếu relevant
- Luôn xem xét scalability và maintainability`,
    color: '#3B82F6',
    icon: '🏗️',
    priority: 1
  },
  
  OPERATIONS: {
    name: 'Operations & DevOps', 
    description: 'Hướng dẫn vận hành - setup, deploy, monitoring, troubleshooting. Cập nhật khi có thay đổi.',
    systemPrompt: `Bạn là DevOps engineer. Khi trả lời:
- Đưa ra các bước cụ thể, có thể thực hiện được ngay
- Bao gồm commands và code snippets
- Cảnh báo các pitfalls phổ biến
- Đề xuất cách verify kết quả`,
    color: '#10B981',
    icon: '⚙️',
    priority: 2
  },
  
  BUSINESS: {
    name: 'Business Logic',
    description: 'Quy tắc kinh doanh - pricing, calculations, workflows. Nguồn truth cho logic nghiệp vụ.',
    systemPrompt: `Bạn là business analyst. Khi trả lời:
- Giải thích logic nghiệp vụ rõ ràng
- Đưa ra công thức/formula nếu có
- Nêu các edge cases và exceptions
- Tham chiếu đến requirements gốc nếu biết`,
    color: '#F59E0B',
    icon: '💼',
    priority: 3
  },
  
  API_REFERENCE: {
    name: 'API Reference',
    description: 'Documentation cho APIs - endpoints, parameters, responses. Nguồn truth cho integration.',
    systemPrompt: `Bạn là technical writer chuyên về API docs. Khi trả lời:
- Đưa ra request/response examples
- Mô tả tất cả parameters và types
- Nêu error codes và cách xử lý
- Đề cập rate limits và best practices`,
    color: '#8B5CF6',
    icon: '📡',
    priority: 4
  },
  
  TROUBLESHOOTING: {
    name: 'Troubleshooting',
    description: 'Các vấn đề đã gặp và cách giải quyết. Knowledge base cho debugging.',
    systemPrompt: `Bạn là senior developer chuyên debug. Khi trả lời:
- Phân tích root cause trước
- Đưa ra các bước diagnose
- Cung cấp solution và workaround
- Đề xuất cách prevent trong tương lai`,
    color: '#EF4444',
    icon: '🔧',
    priority: 5
  }
};

// ========================================
// 📝 CURATED KNOWLEDGE - Đã được review
// ========================================

const CURATED_KNOWLEDGE = [
  // ===== CORE ARCHITECTURE =====
  {
    domain: 'Core Architecture',
    items: [
      {
        title: 'Tech Stack Decision: Why React + Vite + TailwindCSS',
        content: `# Tech Stack Decision Record

## Decision
Sử dụng React 18 + Vite + TailwindCSS + shadcn/ui cho frontend.

## Context
Cần một stack frontend hiện đại, performant, developer-friendly cho admin dashboard.

## Why React 18?
- **Concurrent features**: Suspense, Transitions cho UX tốt hơn
- **Ecosystem**: Lớn nhất, nhiều libraries hỗ trợ
- **Hiring**: Dễ tìm developers
- **Trade-off**: Bundle size lớn hơn Vue/Svelte

## Why Vite (không CRA)?
- **Build speed**: 10-100x nhanh hơn webpack
- **HMR**: Instant refresh khi code thay đổi  
- **Modern**: Native ES modules
- **Trade-off**: Một số legacy plugins không hỗ trợ

## Why TailwindCSS?
- **Utility-first**: Không cần đặt tên class
- **Performance**: PurgeCSS tự động
- **Customizable**: Design system dễ config
- **Trade-off**: HTML dài hơn, learning curve

## Why shadcn/ui?
- **Copy-paste**: Own the code, không dependency
- **Radix UI**: Accessibility built-in
- **Customizable**: Dễ modify theo design
- **Trade-off**: Phải maintain code trong project

## Alternatives Considered
- Next.js: Quá nặng cho admin dashboard
- Vue 3: Ecosystem nhỏ hơn
- Angular: Learning curve cao, verbose`,
        contentType: 'document',
        tags: ['type:decision', 'domain:frontend', 'status:verified', 'priority:critical']
      },
      {
        title: 'Architecture: AI Second Brain Module Structure',
        content: `# AI Second Brain - Module Architecture

## Overview
AI Second Brain là module quản lý kiến thức thông minh, tích hợp vào Longsang Admin.

## Directory Structure
\`\`\`
api/brain/              # Backend
├── routes/            # API endpoints (RESTful)
├── services/          # Business logic (pure functions)
├── middleware/        # Auth, validation, rate limiting
└── jobs/              # Background processing

src/brain/             # Frontend  
├── components/        # UI components (presentational)
├── hooks/             # Data fetching & state (container logic)
├── types/             # TypeScript definitions
└── lib/               # Utilities & API client
\`\`\`

## Design Principles Applied

### 1. Separation of Concerns
- Routes: HTTP handling only
- Services: Business logic only
- Components: UI rendering only
- Hooks: State management only

### 2. Single Source of Truth
- Database schema = source of truth
- Types generated from schema
- API contracts enforced by TypeScript

### 3. Dependency Injection
- Services receive dependencies via parameters
- Easy to test with mocks
- No global state in services

## Data Flow
\`\`\`
User Action → Component → Hook → API Client → Server Route → Service → Database
                                      ↓
                              Response flows back
\`\`\`

## Key Integration Points
- **Supabase**: Database + Auth + Realtime
- **OpenAI**: Embeddings + Chat completions
- **n8n**: Workflow automation (external)`,
        contentType: 'document',
        tags: ['type:reference', 'domain:architecture', 'status:verified', 'project:longsang-admin']
      }
    ]
  },

  // ===== OPERATIONS =====
  {
    domain: 'Operations & DevOps',
    items: [
      {
        title: 'Setup: Local Development Environment',
        content: `# Local Development Setup

## Prerequisites
- Node.js 18+ (recommend 20 LTS)
- Git
- VS Code với extensions: ESLint, Prettier, Tailwind CSS IntelliSense

## Step 1: Clone và Install
\`\`\`bash
cd 00-MASTER-ADMIN/longsang-admin
npm install
\`\`\`

## Step 2: Environment Variables
Copy \`.env.example\` thành \`.env\` và điền:

\`\`\`env
# Required
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...

# Optional
API_PORT=3001
VITE_APP_URL=http://localhost:8080
\`\`\`

## Step 3: Run Development
\`\`\`bash
npm run dev          # Frontend (8080) + API (3001)
npm run dev:frontend # Frontend only
npm run dev:api      # API only
\`\`\`

## Verify Setup
1. Frontend: http://localhost:8080
2. API Health: http://localhost:3001/api/brain/health
3. Login với test user từ Supabase dashboard

## Common Issues

### Port already in use
\`\`\`bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F
\`\`\`

### Supabase connection failed
- Check VPN/firewall
- Verify credentials in .env
- Check Supabase dashboard for status

### OpenAI rate limit
- Use lower tier key có rate limit thấp
- Implement retry với exponential backoff`,
        contentType: 'document',
        tags: ['type:guide', 'domain:devops', 'status:verified', 'level:beginner']
      },
      {
        title: 'Troubleshoot: API Server Won\'t Start',
        content: `# Troubleshoot: API Server Won't Start

## Symptoms
- \`npm run dev:api\` fails
- Error: EADDRINUSE or Cannot find module
- Server starts but immediately exits

## Diagnosis Steps

### 1. Check Port Availability
\`\`\`powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
# Nếu có process, kill nó:
Stop-Process -Id <PID> -Force
\`\`\`

### 2. Check Dependencies
\`\`\`bash
npm install  # Reinstall all
rm -rf node_modules package-lock.json && npm install  # Nuclear option
\`\`\`

### 3. Check Environment Variables
\`\`\`bash
# Verify .env exists và có đủ biến
cat .env | grep -E "(SUPABASE|OPENAI)"
\`\`\`

### 4. Check Logs
\`\`\`bash
# Run với verbose
DEBUG=* node api/server.js
\`\`\`

## Common Fixes

### Fix: Module not found
\`\`\`bash
npm install <missing-module>
\`\`\`

### Fix: Supabase error
- Kiểm tra SUPABASE_SERVICE_ROLE_KEY (không phải ANON_KEY cho backend)

### Fix: OpenAI error
- Verify API key còn credit
- Check rate limits

## Prevention
- Sử dụng \`npm run dev\` thay vì \`node api/server.js\` trực tiếp
- Commit .env.example khi thêm biến mới
- Document breaking changes trong CHANGELOG`,
        contentType: 'document',
        tags: ['type:troubleshoot', 'domain:devops', 'status:verified', 'priority:high']
      }
    ]
  },

  // ===== BUSINESS LOGIC =====
  {
    domain: 'Business Logic',
    items: [
      {
        title: 'Business Rule: Knowledge Quality Scoring',
        content: `# Knowledge Quality Scoring System

## Purpose
Đánh giá chất lượng knowledge items để prioritize trong search results.

## Formula
\`\`\`
Quality Score = (Accuracy × 0.3) + (Relevance × 0.25) + (Completeness × 0.2) 
              + (Clarity × 0.15) + (Currency × 0.1)
\`\`\`

## Criteria Definitions

### Accuracy (0-5)
- 5: Đã verify bởi expert, có sources
- 4: Đã test/verify internally
- 3: Based on official docs
- 2: From reliable secondary source
- 1: Unverified/self-authored

### Relevance (0-5)
- 5: Core knowledge, được query thường xuyên
- 4: Important reference material
- 3: Useful supplementary info
- 2: Nice-to-have context
- 1: Barely relevant to domain

### Completeness (0-5)  
- 5: Self-contained, đủ context
- 4: Đầy đủ với minor gaps
- 3: Covers basics, needs supplementing
- 2: Partial coverage
- 1: Fragment/incomplete

### Clarity (0-5)
- 5: Crystal clear, có examples
- 4: Clear, well-structured
- 3: Understandable với effort
- 2: Confusing in parts
- 1: Unclear/ambiguous

### Currency (0-5)
- 5: Updated within 30 days
- 4: Updated within 90 days
- 3: Updated within 6 months
- 2: Updated within 1 year
- 1: Older than 1 year / unknown

## Thresholds
- **Minimum to publish**: 3.0
- **Featured knowledge**: 4.0+
- **Archive candidate**: < 2.0

## Auto-adjustment
- +0.1 per 10 successful searches (max +0.5)
- -0.1 per negative feedback (max -0.5)
- -0.5 if not accessed in 90 days`,
        contentType: 'document',
        tags: ['type:rule', 'domain:business', 'status:verified', 'project:ai-brain']
      }
    ]
  },

  // ===== API REFERENCE =====
  {
    domain: 'API Reference',
    items: [
      {
        title: 'API: Knowledge Search Endpoint',
        content: `# GET /api/brain/knowledge/search

## Purpose
Semantic search across knowledge base using vector embeddings.

## Request

### URL
\`\`\`
GET /api/brain/knowledge/search?q={query}&matchThreshold={threshold}&matchCount={count}&domainId={domainId}
\`\`\`

### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| q | string | ✅ | - | Search query text |
| userId | uuid | ✅ | - | User ID for filtering |
| matchThreshold | float | ❌ | 0.7 | Minimum similarity (0-1) |
| matchCount | int | ❌ | 10 | Max results to return |
| domainId | uuid | ❌ | null | Filter to specific domain |
| domainIds | uuid[] | ❌ | null | Filter to multiple domains |

### Headers
\`\`\`
Content-Type: application/json
x-user-id: {userId}  # Alternative to query param
\`\`\`

## Response

### Success (200)
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "domainId": "uuid",
      "title": "Knowledge Title",
      "content": "Full content...",
      "contentType": "document",
      "tags": ["tag1", "tag2"],
      "similarity": 0.85,
      "metadata": {},
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "count": 5,
  "query": "original query",
  "options": {
    "matchThreshold": 0.3,
    "matchCount": 10
  }
}
\`\`\`

### Error Responses
| Code | Reason |
|------|--------|
| 400 | Missing required query parameter |
| 401 | User ID not provided |
| 500 | Embedding generation failed |

## Best Practices

### Optimal Threshold Settings
- General search: 0.3-0.5 (more results)
- Precise search: 0.6-0.8 (fewer, better matches)
- Exact match: 0.9+ (very strict)

### Performance Tips
- Limit matchCount for faster responses
- Use domainId when possible to narrow scope
- Cache frequent queries client-side`,
        contentType: 'document',
        tags: ['type:reference', 'domain:api', 'status:verified', 'priority:high']
      }
    ]
  },

  // ===== TROUBLESHOOTING =====
  {
    domain: 'Troubleshooting',
    items: [
      {
        title: 'Issue: Search Returns No Results',
        content: `# Issue: Knowledge Search Returns Empty Results

## Symptoms
- API returns \`{ "data": [], "count": 0 }\`
- Search works in database directly but not via API

## Root Causes & Solutions

### 1. Match Threshold Too High (Most Common)
**Diagnosis**: Default threshold là 0.7, có thể quá cao.
**Solution**: 
\`\`\`
?matchThreshold=0.3  # Lower threshold
\`\`\`

### 2. User ID Mismatch
**Diagnosis**: Knowledge thuộc user khác.
**Solution**: Verify userId trong query matches knowledge owner.

### 3. Embeddings Not Generated
**Diagnosis**: Knowledge được insert nhưng chưa có embedding.
**Solution**:
\`\`\`sql
-- Check in database
SELECT id, title, embedding IS NOT NULL as has_embedding 
FROM brain_knowledge 
WHERE embedding IS NULL;
\`\`\`
Re-ingest knowledge nếu embedding missing.

### 4. Domain Filter Wrong
**Diagnosis**: domainId không match với knowledge.
**Solution**: Remove domainId filter hoặc verify đúng domain.

### 5. Vector Function Missing
**Diagnosis**: \`match_knowledge\` function chưa được tạo.
**Solution**: Run migration \`007-vector-search-function.sql\`.

## Verification Steps
1. Test search với threshold thấp (0.1)
2. Check knowledge count trong database
3. Verify embeddings exist
4. Test với cURL để isolate frontend issues

## Prevention
- Log search queries và results
- Monitor embedding generation jobs
- Set sensible default thresholds`,
        contentType: 'document',
        tags: ['type:troubleshoot', 'domain:api', 'status:verified', 'project:ai-brain']
      }
    ]
  }
];

// ========================================
// 🔍 QUALITY VALIDATION
// ========================================

function validateKnowledge(item) {
  const issues = [];
  
  // Title validation
  if (!item.title || item.title.length < 10) {
    issues.push('Title too short (min 10 chars)');
  }
  if (item.title && item.title.length > 100) {
    issues.push('Title too long (max 100 chars)');
  }
  
  // Content validation
  if (!item.content || item.content.length < 100) {
    issues.push('Content too short (min 100 chars)');
  }
  if (item.content && item.content.length > 10000) {
    issues.push('Content too long (max 10000 chars) - consider splitting');
  }
  
  // Tags validation
  if (!item.tags || item.tags.length === 0) {
    issues.push('Missing tags');
  } else {
    const hasType = item.tags.some(t => t.startsWith('type:'));
    const hasDomain = item.tags.some(t => t.startsWith('domain:'));
    const hasStatus = item.tags.some(t => t.startsWith('status:'));
    
    if (!hasType) issues.push('Missing type: tag');
    if (!hasDomain) issues.push('Missing domain: tag');
    if (!hasStatus) issues.push('Missing status: tag');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// ========================================
// 📡 API HELPERS
// ========================================

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

async function checkDuplicates(title, domainId) {
  try {
    const result = await fetchAPI(`/knowledge/search?q=${encodeURIComponent(title)}&userId=${USER_ID}&matchThreshold=0.8&matchCount=1`);
    if (result.data && result.data.length > 0 && result.data[0].similarity > 0.9) {
      return result.data[0];
    }
  } catch (e) {
    // Search might fail, continue anyway
  }
  return null;
}

async function createDomainIfNotExists(domainConfig) {
  // Check if domain exists
  const domains = await fetchAPI(`/domains?userId=${USER_ID}`);
  const existing = domains.data?.find(d => d.name === domainConfig.name);
  
  if (existing) {
    console.log(`  ℹ️ Domain exists: ${domainConfig.name}`);
    return existing;
  }
  
  // Create domain
  const result = await fetchAPI('/domains', {
    method: 'POST',
    body: JSON.stringify({
      name: domainConfig.name,
      description: domainConfig.description,
      systemPrompt: domainConfig.systemPrompt,
      userId: USER_ID,
      settings: {
        color: domainConfig.color,
        icon: domainConfig.icon
      }
    })
  });
  
  console.log(`  ✅ Created domain: ${domainConfig.name}`);
  return result.data;
}

async function ingestKnowledge(domainId, item) {
  // Validate first
  const validation = validateKnowledge(item);
  if (!validation.valid) {
    console.log(`  ⚠️ Validation failed: ${item.title}`);
    validation.issues.forEach(i => console.log(`      - ${i}`));
    return { success: false, reason: 'validation' };
  }
  
  // Check duplicates
  const duplicate = await checkDuplicates(item.title, domainId);
  if (duplicate) {
    console.log(`  ⏭️ Skipped (duplicate): ${item.title}`);
    return { success: false, reason: 'duplicate' };
  }
  
  // Ingest
  try {
    await fetchAPI('/knowledge/ingest', {
      method: 'POST',
      body: JSON.stringify({
        domainId,
        userId: USER_ID,
        title: item.title,
        content: item.content,
        contentType: item.contentType || 'document',
        tags: item.tags || []
      })
    });
    
    console.log(`  ✅ Added: ${item.title}`);
    return { success: true };
  } catch (error) {
    console.log(`  ❌ Failed: ${item.title} - ${error.message}`);
    return { success: false, reason: 'error', error: error.message };
  }
}

// ========================================
// 🚀 MAIN EXECUTION
// ========================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   🧠 AI SECOND BRAIN - STRATEGIC KNOWLEDGE INGESTION            ║');
  console.log('║   Following Knowledge Strategy for quality-first approach       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Step 1: Check API
  console.log('📡 Checking API connection...');
  try {
    await fetchAPI('/health');
    console.log('✅ API is running\n');
  } catch (error) {
    console.error('❌ API not running! Start with: npm run dev:api');
    process.exit(1);
  }

  // Step 2: Create Domains (taxonomized)
  console.log('═══ STEP 1: Setting up Domain Taxonomy ═══\n');
  const domainMap = {};
  
  for (const [key, config] of Object.entries(DOMAIN_TAXONOMY)) {
    const domain = await createDomainIfNotExists(config);
    if (domain) {
      domainMap[config.name] = domain.id;
    }
  }
  
  console.log(`\n✅ Domain taxonomy ready: ${Object.keys(domainMap).length} domains\n`);

  // Step 3: Ingest curated knowledge
  console.log('═══ STEP 2: Ingesting Curated Knowledge ═══\n');
  
  const stats = {
    added: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0
  };

  for (const group of CURATED_KNOWLEDGE) {
    const domainId = domainMap[group.domain];
    
    if (!domainId) {
      console.log(`⚠️ Domain not found: ${group.domain}`);
      continue;
    }
    
    console.log(`\n📂 ${group.domain}:`);
    
    for (const item of group.items) {
      const result = await ingestKnowledge(domainId, item);
      
      if (result.success) stats.added++;
      else if (result.reason === 'duplicate') stats.duplicates++;
      else if (result.reason === 'validation') stats.skipped++;
      else stats.failed++;
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                         📊 SUMMARY                               ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Knowledge added:     ${stats.added.toString().padEnd(4)}                                  ║`);
  console.log(`║  ⏭️  Duplicates skipped: ${stats.duplicates.toString().padEnd(4)}                                  ║`);
  console.log(`║  ⚠️  Validation failed:  ${stats.skipped.toString().padEnd(4)}                                  ║`);
  console.log(`║  ❌ Errors:              ${stats.failed.toString().padEnd(4)}                                  ║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                  ║');
  console.log('║  📖 Next Steps:                                                  ║');
  console.log('║  1. Test search: /api/brain/knowledge/search?q=...              ║');
  console.log('║  2. Add project-specific knowledge via UI                       ║');
  console.log('║  3. Review Knowledge Strategy: docs/BRAIN_KNOWLEDGE_STRATEGY.md ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
