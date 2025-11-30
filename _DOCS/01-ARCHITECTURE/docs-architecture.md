# 🏗️ DOCUMENTATION ARCHITECTURE
## LongSang Admin - Documentation System Design

> **Created:** 2025-01-XX
> **Purpose:** Architecture design for AI-powered documentation system
> **Status:** Design Phase

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Decision](#2-tech-stack-decision)
3. [Folder Structure](#3-folder-structure)
4. [AI Integration Architecture](#4-ai-integration-architecture)
5. [Search Architecture](#5-search-architecture)
6. [Internationalization (i18n)](#6-internationalization-i18n)
7. [Component System](#7-component-system)
8. [API Documentation Strategy](#8-api-documentation-strategy)
9. [Deployment & Hosting](#9-deployment--hosting)
10. [Performance Optimization](#10-performance-optimization)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Goals

- ✅ **Comprehensive Documentation** - Document 40+ APIs, 200+ components, 78+ pages
- ✅ **AI-Powered Search** - Semantic search with RAG integration
- ✅ **Bilingual Support** - Vietnamese + English
- ✅ **Interactive Examples** - Live code playgrounds
- ✅ **Auto-Generated Content** - From code comments & JSDoc
- ✅ **Modern UX** - Fast, searchable, scannable

### 1.2 Key Requirements

| Requirement | Priority | Solution |
|-------------|----------|----------|
| MDX Support | 🔴 High | Nextra/Docusaurus |
| AI Search | 🔴 High | Custom RAG + Algolia |
| i18n (VN/EN) | 🔴 High | next-intl / i18next |
| Code Playground | 🟡 Medium | Sandpack / StackBlitz |
| Auto-Doc Generation | 🟡 Medium | Custom scripts + GPT |
| Versioning | 🟢 Low | Git-based versioning |

---

## 2. TECH STACK DECISION

### 2.1 Framework Comparison

#### Option A: **Nextra** (Recommended ✅)

**Pros:**
- ✅ Built on Next.js (React ecosystem - matches current stack)
- ✅ Simple setup & configuration
- ✅ Excellent MDX support
- ✅ Easy customization with React components
- ✅ Fast builds with Next.js optimization
- ✅ Good TypeScript support
- ✅ Flexible routing
- ✅ Can use existing React components

**Cons:**
- ⚠️ Less mature than Docusaurus
- ⚠️ Smaller plugin ecosystem
- ⚠️ Search requires more setup

**Best For:**
- React/Next.js projects ✅ (Our case)
- Teams familiar with React
- Custom UI requirements
- Fast iteration

#### Option B: **Docusaurus**

**Pros:**
- ✅ Very mature & stable
- ✅ Excellent search (Algolia DocSearch built-in)
- ✅ Large plugin ecosystem
- ✅ Better for large documentation sites
- ✅ Versioning built-in
- ✅ Blog support

**Cons:**
- ⚠️ More opinionated structure
- ⚠️ Less flexible customization
- ⚠️ Steeper learning curve
- ⚠️ React but different patterns

**Best For:**
- Large open-source projects
- Teams needing extensive plugins
- Projects requiring versioning from day 1

### 2.2 Decision: **Nextra** ✅

**Rationale:**
1. **Stack Alignment** - Project uses React + TypeScript + Vite
2. **Flexibility** - Need custom AI components
3. **Simplicity** - Faster setup & iteration
4. **Component Reuse** - Can reuse existing React components
5. **Customization** - Need custom AI search & chat widgets

### 2.3 Complete Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Nextra 3.x | Documentation framework |
| **Base** | Next.js 14+ | React framework |
| **Language** | TypeScript | Type safety |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Content** | MDX | Markdown + React |
| **Search** | Algolia DocSearch + Custom RAG | Hybrid search |
| **AI Embeddings** | OpenAI `text-embedding-3-small` | Vector embeddings |
| **Vector DB** | Supabase pgvector | Embedding storage |
| **AI Chat** | OpenAI GPT-4o-mini | Documentation chatbot |
| **i18n** | next-intl | Internationalization |
| **Code Playground** | Sandpack | Interactive code examples |
| **Analytics** | Vercel Analytics | Usage tracking |
| **Hosting** | Vercel | Deployment platform |
| **CI/CD** | GitHub Actions | Automated deployment |

---

## 3. FOLDER STRUCTURE

### 3.1 Proposed Structure

```
docs/
├── .next/                          # Next.js build output
├── .nextra/                        # Nextra cache
├── public/                         # Static assets
│   ├── images/                     # Documentation images
│   ├── icons/                      # Icons & logos
│   └── favicon.ico                 # Favicon
├── pages/                          # MDX pages (Nextra convention)
│   ├── _meta.json                  # Navigation configuration
│   ├── getting-started/            # Getting started guides
│   │   ├── _meta.json
│   │   ├── introduction.mdx
│   │   ├── installation.mdx
│   │   ├── quickstart.mdx
│   │   └── configuration.mdx
│   ├── guides/                     # Feature guides
│   │   ├── _meta.json
│   │   ├── ai-workspace/           # AI Workspace guide
│   │   ├── agent-center/           # Agent Center guide
│   │   ├── automation/              # Automation guides
│   │   ├── integrations/           # Integration guides
│   │   └── tutorials/              # Step-by-step tutorials
│   ├── api-reference/              # API documentation
│   │   ├── _meta.json
│   │   ├── overview.mdx
│   │   ├── authentication.mdx
│   │   ├── ai/                     # AI APIs
│   │   │   ├── _meta.json
│   │   │   ├── ai-assistant.mdx
│   │   │   ├── ai-command.mdx
│   │   │   ├── ai-suggestions.mdx
│   │   │   └── copilot.mdx
│   │   ├── google/                 # Google APIs
│   │   │   ├── _meta.json
│   │   │   ├── analytics.mdx
│   │   │   ├── calendar.mdx
│   │   │   └── gmail.mdx
│   │   ├── core/                   # Core APIs
│   │   │   ├── _meta.json
│   │   │   ├── projects.mdx
│   │   │   ├── workflows.mdx
│   │   │   └── metrics.mdx
│   │   └── examples/               # API examples
│   │       └── _meta.json
│   ├── concepts/                   # Architecture & concepts
│   │   ├── _meta.json
│   │   ├── architecture.mdx
│   │   ├── database-schema.mdx
│   │   ├── ai-system.mdx
│   │   └── security.mdx
│   ├── components/                 # Component library
│   │   ├── _meta.json
│   │   ├── overview.mdx
│   │   ├── ui/                     # UI components
│   │   │   ├── _meta.json
│   │   │   ├── button.mdx
│   │   │   ├── input.mdx
│   │   │   └── dialog.mdx
│   │   ├── ai/                     # AI components
│   │   │   ├── _meta.json
│   │   │   ├── copilot-chat.mdx
│   │   │   └── command-palette.mdx
│   │   └── examples/               # Component examples
│   ├── changelog/                  # Version history
│   │   ├── _meta.json
│   │   └── [version].mdx
│   └── index.mdx                   # Homepage
├── components/                     # Custom React components
│   ├── ai/                         # AI components
│   │   ├── DocsSearchAI.tsx        # AI-powered search
│   │   ├── AskAIWidget.tsx         # Floating chatbot
│   │   ├── CodeExplainer.tsx       # Code explanation
│   │   └── AutoDocBadge.tsx        # Auto-doc indicator
│   ├── api/                        # API components
│   │   ├── APIPlayground.tsx       # Interactive API tester
│   │   ├── ParamTable.tsx          # Parameter table
│   │   └── CodeBlock.tsx           # Syntax-highlighted code
│   ├── layout/                     # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/                         # UI components
│       ├── Callout.tsx             # Callout boxes
│       ├── Cards.tsx                # Card components
│       ├── Tabs.tsx                 # Tab component
│       └── Accordion.tsx            # Accordion component
├── lib/                            # Utilities & helpers
│   ├── ai/                         # AI utilities
│   │   ├── embeddings.ts           # Embedding generation
│   │   ├── search.ts               # Semantic search
│   │   └── chat.ts                 # Chatbot logic
│   ├── api/                        # API utilities
│   │   ├── generate-docs.ts        # Auto-doc generation
│   │   └── validate-schema.ts      # Schema validation
│   └── utils.ts                    # General utilities
├── scripts/                        # Build & generation scripts
│   ├── generate-api-docs.ts        # Generate API docs from code
│   ├── generate-component-docs.ts  # Generate component docs
│   ├── index-embeddings.ts         # Index docs for search
│   └── sync-database-schema.ts     # Sync DB schema docs
├── styles/                         # Global styles
│   └── globals.css                 # Global CSS
├── next.config.js                  # Next.js configuration
├── nextra.config.ts                # Nextra configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
└── README.md                       # Setup instructions
```

### 3.2 Navigation Structure (`_meta.json`)

**Root `pages/_meta.json`:**
```json
{
  "index": "Home",
  "getting-started": "Getting Started",
  "guides": "Guides",
  "api-reference": "API Reference",
  "concepts": "Concepts",
  "components": "Components",
  "changelog": "Changelog"
}
```

**Example: `pages/api-reference/_meta.json`:**
```json
{
  "overview": "Overview",
  "authentication": "Authentication",
  "ai": "AI APIs",
  "google": "Google APIs",
  "core": "Core APIs",
  "examples": "Examples"
}
```

---

## 4. AI INTEGRATION ARCHITECTURE

### 4.1 AI Features Overview

| Feature | Technology | Purpose |
|---------|------------|---------|
| **Semantic Search** | pgvector + OpenAI embeddings | Find docs by meaning |
| **AI Chatbot** | GPT-4o-mini | Answer questions about docs |
| **Code Explanation** | GPT-4o-mini | Explain code blocks |
| **Auto-Doc Generation** | GPT-4o-mini | Generate docs from code |
| **Smart Suggestions** | GPT-4o-mini | Suggest related content |

### 4.2 Semantic Search Architecture

```
User Query
    ↓
[Query Embedding] (OpenAI text-embedding-3-small)
    ↓
[Vector Search] (Supabase pgvector)
    ↓
[Re-ranking] (Optional: Cross-encoder)
    ↓
[Results] (Top K relevant docs)
```

**Implementation:**

```typescript
// lib/ai/search.ts
interface SemanticSearchConfig {
  vectorDB: 'supabase-pgvector';
  embedModel: 'text-embedding-3-small';
  topK: 5;
  reranker: boolean;
  filters?: {
    language?: 'vi' | 'en';
    category?: string;
  };
}

async function semanticSearch(
  query: string,
  config: SemanticSearchConfig
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const embedding = await generateEmbedding(query);

  // 2. Vector similarity search
  const results = await supabase
    .rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: config.topK
    });

  // 3. Optional re-ranking
  if (config.reranker) {
    return await rerankResults(query, results);
  }

  return results;
}
```

### 4.3 AI Chatbot Architecture

```typescript
// components/ai/AskAIWidget.tsx
interface DocsChatbot {
  model: 'gpt-4o-mini';
  context: 'current-page' | 'full-docs' | 'section';
  maxTokens: 500;
  temperature: 0.7;
  systemPrompt: string;
}

// Flow:
// 1. User asks question
// 2. Retrieve relevant context (RAG)
// 3. Build prompt with context
// 4. Call GPT-4o-mini
// 5. Stream response
// 6. Show sources
```

### 4.4 Auto-Documentation Generation

```typescript
// scripts/generate-api-docs.ts
interface AutoDocConfig {
  sources: [
    { type: 'typescript', glob: 'api/routes/**/*.js' },
    { type: 'typescript', glob: 'src/**/*.ts' },
    { type: 'database', source: 'supabase-schema' }
  ];
  outputFormat: 'mdx';
  aiEnhance: true;
  template: 'api-reference-template.mdx';
}

// Process:
// 1. Parse code files
// 2. Extract JSDoc comments
// 3. Generate base documentation
// 4. AI enhancement (GPT polish)
// 5. Write MDX files
```

---

## 5. SEARCH ARCHITECTURE

### 5.1 Hybrid Search Strategy

**Combination of:**
1. **Keyword Search** (Algolia DocSearch) - Fast, exact matches
2. **Semantic Search** (Custom RAG) - Meaning-based search
3. **Hybrid** - Combine both for best results

### 5.2 Algolia DocSearch Setup

```typescript
// components/ai/DocsSearchAI.tsx
import { DocSearch } from '@docsearch/react';
import '@docsearch/css';

<DocSearch
  appId="YOUR_APP_ID"
  indexName="longsang-docs"
  apiKey="YOUR_SEARCH_API_KEY"
  placeholder="Tìm kiếm hoặc hỏi AI..."
  translations={{
    button: {
      buttonText: 'Tìm kiếm',
      buttonAriaLabel: 'Tìm kiếm trong tài liệu'
    },
    modal: {
      searchBox: {
        resetButtonTitle: 'Xóa',
        resetButtonAriaLabel: 'Xóa',
        cancelButtonText: 'Hủy',
        cancelButtonAriaLabel: 'Hủy'
      }
    }
  }}
/>
```

### 5.3 Custom Semantic Search Integration

```typescript
// components/ai/DocsSearchAI.tsx
interface HybridSearchProps {
  mode: 'keyword' | 'semantic' | 'hybrid';
  placeholder?: string;
  showSuggestions?: boolean;
}

export function DocsSearchAI({
  mode = 'hybrid',
  placeholder = "Tìm kiếm hoặc hỏi AI...",
  showSuggestions = true
}: HybridSearchProps) {
  // Combine Algolia + Semantic search
  const handleSearch = async (query: string) => {
    if (mode === 'hybrid') {
      const [keywordResults, semanticResults] = await Promise.all([
        algoliaSearch(query),
        semanticSearch(query)
      ]);
      return mergeResults(keywordResults, semanticResults);
    }
    // ...
  };
}
```

---

## 6. INTERNATIONALIZATION (i18n)

### 6.1 Language Support

- **Vietnamese (vi)** - Primary language
- **English (en)** - Secondary language

### 6.2 Implementation with next-intl

```typescript
// next.config.js
const withNextIntl = require('next-intl/plugin')(
  './i18n/request.ts'
);

module.exports = withNextIntl({
  // Next.js config
});

// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale) locale = 'vi'; // Default to Vietnamese

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

### 6.3 Content Structure

```
pages/
├── [locale]/                    # Locale-based routing
│   ├── vi/                      # Vietnamese pages
│   │   ├── getting-started/
│   │   └── guides/
│   └── en/                      # English pages
│       ├── getting-started/
│       └── guides/
```

### 6.4 Translation Management

```json
// messages/vi.json
{
  "docs": {
    "search": {
      "placeholder": "Tìm kiếm hoặc hỏi AI...",
      "noResults": "Không tìm thấy kết quả",
      "suggestions": "Gợi ý"
    }
  }
}

// messages/en.json
{
  "docs": {
    "search": {
      "placeholder": "Search or ask AI...",
      "noResults": "No results found",
      "suggestions": "Suggestions"
    }
  }
}
```

---

## 7. COMPONENT SYSTEM

### 7.1 Custom MDX Components

**Location:** `components/`

| Component | Purpose | Usage |
|-----------|---------|-------|
| `<Callout>` | Info/warning/error boxes | `<Callout type="info">Note</Callout>` |
| `<Cards>` | Card grid layout | `<Cards><Card>...</Card></Cards>` |
| `<Tabs>` | Tabbed content | `<Tabs><Tab>...</Tab></Tabs>` |
| `<Accordion>` | Collapsible sections | `<Accordion title="...">...</Accordion>` |
| `<ParamTable>` | API parameter table | `<ParamTable><Param>...</Param></ParamTable>` |
| `<CodeBlock>` | Syntax-highlighted code | `<CodeBlock language="ts">...</CodeBlock>` |
| `<APIPlayground>` | Interactive API tester | `<APIPlayground endpoint="/api/..." />` |

### 7.2 AI Components

| Component | Purpose |
|-----------|---------|
| `<DocsSearchAI>` | AI-powered search bar |
| `<AskAIWidget>` | Floating chatbot widget |
| `<CodeExplainer>` | AI code explanation |
| `<AutoDocBadge>` | Auto-generated doc indicator |

### 7.3 Example Component Implementation

```tsx
// components/ui/Callout.tsx
import { AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    success: AlertCircle
  };

  const Icon = icons[type];

  return (
    <div className={`callout callout-${type}`}>
      <Icon />
      <div>{children}</div>
    </div>
  );
}
```

---

## 8. API DOCUMENTATION STRATEGY

### 8.1 Auto-Generation Workflow

```
Code Files (api/routes/*.js)
    ↓
[Parse JSDoc Comments]
    ↓
[Extract API Info]
    ↓
[Generate Base MDX]
    ↓
[AI Enhancement] (GPT-4o-mini)
    ↓
[Write MDX Files]
    ↓
pages/api-reference/**/*.mdx
```

### 8.2 API Documentation Template

```mdx
---
title: [Endpoint Name]
method: POST
endpoint: /api/[path]
---

## Overview

[AI-generated description from code comments]

## Authentication

<Callout type="info">
  This endpoint requires authentication. Include your API key in the header.
</Callout>

## Request

<ParamTable>
  <Param name="field" type="string" required>
    Description of the field
  </Param>
</ParamTable>

## Response

<CodeBlock language="json">
{example response}
</CodeBlock>

## Examples

<Tabs>
  <Tab title="cURL">
    <CodeBlock language="bash">
      curl -X POST https://api.example.com/endpoint
    </CodeBlock>
  </Tab>
  <Tab title="JavaScript">
    <CodeBlock language="javascript">
      fetch('/api/endpoint', { method: 'POST' })
    </CodeBlock>
  </Tab>
</Tabs>

## Try It

<APIPlayground endpoint="/api/[path]" />
```

### 8.3 Database Schema Documentation

```mdx
---
title: Database Schema
---

## Overview

Complete database schema documentation with relationships.

## Entity Relationship Diagram

[Auto-generated ERD from migrations]

## Tables

### ai_suggestions

<ParamTable>
  <Param name="id" type="UUID" required>
    Primary key
  </Param>
  <Param name="type" type="TEXT" required>
    Suggestion type: action, workflow, optimization, alert
  </Param>
</ParamTable>

## Relationships

[Auto-generated from foreign keys]
```

---

## 9. DEPLOYMENT & HOSTING

### 9.1 Hosting Platform: **Vercel** ✅

**Why Vercel:**
- ✅ Zero-config Next.js deployment
- ✅ Automatic preview deployments
- ✅ Global CDN
- ✅ Free tier for docs
- ✅ Easy custom domain
- ✅ Analytics built-in

### 9.2 Deployment Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/search",
      "destination": "/api/search"
    }
  ]
}
```

### 9.3 CI/CD Pipeline

```yaml
# .github/workflows/docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run generate-api-docs
      - run: npm run index-embeddings
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### 9.4 Environment Variables

```env
# .env.production
NEXT_PUBLIC_ALGOLIA_APP_ID=xxx
NEXT_PUBLIC_ALGOLIA_API_KEY=xxx
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=longsang-docs

OPENAI_API_KEY=sk-xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

NEXT_PUBLIC_AI_CHAT_ENABLED=true
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Optimization Strategies

| Strategy | Implementation | Impact |
|----------|----------------|--------|
| **Code Splitting** | Next.js automatic | High |
| **Image Optimization** | Next.js Image | High |
| **MDX Caching** | Nextra built-in | Medium |
| **Search Indexing** | Algolia CDN | High |
| **Vector Search** | Supabase edge functions | Medium |
| **Static Generation** | Next.js SSG | High |

### 10.2 Performance Targets

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Search Response Time:** < 200ms
- **AI Chat Response Time:** < 2s

### 10.3 Monitoring

```typescript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export function DocsAnalytics() {
  return (
    <>
      <Analytics />
      {/* Custom tracking */}
    </>
  );
}
```

---

## 11. SECURITY CONSIDERATIONS

### 11.1 API Key Management

- ✅ Environment variables only
- ✅ Never commit keys to repo
- ✅ Use Vercel secrets
- ✅ Rotate keys regularly

### 11.2 Rate Limiting

```typescript
// API routes rate limiting
const rateLimit = {
  search: '10 requests/minute',
  aiChat: '20 requests/minute',
  apiDocs: '100 requests/minute'
};
```

### 11.3 Content Security

- ✅ Sanitize user inputs
- ✅ Validate API responses
- ✅ Use CSP headers
- ✅ Regular security audits

---

## 12. MAINTENANCE & UPDATES

### 12.1 Update Strategy

1. **Auto-Generated Docs** - Update on code changes
2. **Manual Docs** - Review quarterly
3. **AI Enhancements** - Continuous improvement
4. **Search Index** - Re-index weekly

### 12.2 Versioning Strategy

```typescript
// Version management
const versions = {
  current: '1.0.0',
  previous: '0.9.0',
  next: '1.1.0'
};
```

---

## 13. SUCCESS METRICS

### 13.1 Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Documentation Coverage** | 90%+ | Automated checks |
| **Search Success Rate** | 85%+ | Analytics |
| **User Satisfaction** | 4.5/5 | Surveys |
| **Time to Find Info** | < 30s | User testing |
| **AI Chat Accuracy** | 80%+ | Manual review |

### 13.2 Analytics Tracking

- Page views per section
- Search queries
- AI chat usage
- Most viewed docs
- User feedback

---

## 14. IMPLEMENTATION PHASES

### Phase 1: Foundation ✅
- [x] Project analysis
- [x] Architecture design
- [ ] Nextra setup
- [ ] Basic structure

### Phase 2: Content Migration
- [ ] Migrate existing docs
- [ ] Create getting started
- [ ] Auto-generate API docs
- [ ] Setup navigation

### Phase 3: AI Features
- [ ] Semantic search
- [ ] AI chatbot
- [ ] Auto-doc generation
- [ ] Code playground

### Phase 4: Polish
- [ ] i18n implementation
- [ ] Dark mode
- [ ] Performance optimization
- [ ] SEO optimization

---

## 15. APPENDIX

### 15.1 Useful Resources

- [Nextra Documentation](https://nextra.site/)
- [MDX Documentation](https://mdxjs.com/)
- [Algolia DocSearch](https://docsearch.algolia.com/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

### 15.2 Team Contacts

- **Documentation Lead:** [Name]
- **AI Integration:** [Name]
- **Design:** [Name]

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-01-XX
**Next Review:** After Phase 3 setup

