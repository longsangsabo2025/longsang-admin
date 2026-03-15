/**
 * AI Second Brain - Knowledge Setup Script
 * Nạp kiến thức ban đầu cho hệ thống
 */

const API_URL = 'http://localhost:3001/api/brain';
const USER_ID = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';

const headers = {
  'Content-Type': 'application/json',
  'x-user-id': USER_ID
};

// ============================
// ĐỊNH NGHĨA CÁC DOMAIN
// ============================
const DOMAINS = [
  {
    name: 'Longsang Admin',
    description: 'Kiến thức về hệ thống quản trị Longsang Admin - cấu trúc code, API endpoints, components',
    systemPrompt: 'Bạn là chuyên gia về hệ thống Longsang Admin. Trả lời câu hỏi về cấu trúc code, API, components React, database schema.',
    color: '#3B82F6',
    icon: '🖥️'
  },
  {
    name: 'AI Second Brain',
    description: 'Kiến thức về module AI Second Brain - architecture, features, API, workflows',
    systemPrompt: 'Bạn là chuyên gia về AI Second Brain module. Giải thích về domains, knowledge management, learning system, analytics.',
    color: '#8B5CF6',
    icon: '🧠'
  },
  {
    name: 'SABO Ecosystem',
    description: 'Kiến thức về hệ sinh thái SABO - Arena, Hub, các dự án blockchain',
    systemPrompt: 'Bạn là chuyên gia về SABO Ecosystem. Trả lời về SABO Arena, SABO Hub, tokenomics, gaming features.',
    color: '#F59E0B',
    icon: '🎮'
  },
  {
    name: 'Real Estate Projects',
    description: 'Kiến thức về các dự án bất động sản - Vũng Tàu Dream Homes, tính năng, công nghệ',
    systemPrompt: 'Bạn là chuyên gia về dự án bất động sản. Trả lời về Vũng Tàu Dream Homes, tính năng website, investment tracking.',
    color: '#10B981',
    icon: '🏠'
  },
  {
    name: 'Development Guides',
    description: 'Hướng dẫn phát triển - best practices, coding standards, deployment',
    systemPrompt: 'Bạn là mentor về phát triển phần mềm. Hướng dẫn về coding standards, deployment, CI/CD, testing.',
    color: '#EC4899',
    icon: '📚'
  },
  {
    name: 'Business Rules',
    description: 'Quy tắc kinh doanh - pricing, tính toán ROI, marketing rules',
    systemPrompt: 'Bạn là chuyên gia về business logic. Giải thích về pricing models, ROI calculations, marketing strategies.',
    color: '#6366F1',
    icon: '💼'
  }
];

// ============================
// KIẾN THỨC CẦN NẠP
// ============================
const KNOWLEDGE_ITEMS = [
  // === Longsang Admin ===
  {
    domain: 'Longsang Admin',
    items: [
      {
        title: 'Project Structure Overview',
        content: `# Longsang Admin Project Structure

## Directory Layout
\`\`\`
longsang-admin/
├── api/                    # Backend Express.js API
│   ├── server.js          # Main entry point
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   └── brain/             # AI Second Brain module
│       ├── routes/        # Brain API routes
│       ├── services/      # Brain services
│       └── jobs/          # Background jobs
├── src/                   # Frontend React + Vite
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── brain/             # Brain UI module
│   │   ├── components/    # Brain-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript types
│   └── lib/               # Utilities
├── supabase/              # Database migrations
│   └── migrations/brain/  # Brain table migrations
└── scripts/               # Utility scripts
\`\`\`

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI API for embeddings and chat
- **State**: TanStack Query (React Query)`,
        contentType: 'document',
        tags: ['architecture', 'structure', 'overview']
      },
      {
        title: 'API Endpoints Reference',
        content: `# Longsang Admin API Endpoints

## Brain API (/api/brain)

### Domains
- GET /api/brain/domains - List all domains
- POST /api/brain/domains - Create domain
- GET /api/brain/domains/:id - Get domain details
- PUT /api/brain/domains/:id - Update domain
- DELETE /api/brain/domains/:id - Delete domain

### Knowledge
- POST /api/brain/knowledge/ingest - Add knowledge
- GET /api/brain/knowledge/search?q= - Search knowledge
- GET /api/brain/knowledge/:id - Get knowledge item

### Actions & Workflows
- GET /api/brain/actions - List actions
- POST /api/brain/actions - Queue action
- GET /api/brain/workflows - List workflows
- POST /api/brain/workflows - Create workflow

### Analytics (Phase 6)
- GET /api/brain/analytics/system-performance
- GET /api/brain/analytics/user-behavior
- GET /api/brain/analytics/query-patterns

### Collaboration (Phase 6)
- GET /api/brain/collaboration/shared
- POST /api/brain/collaboration/share
- GET /api/brain/collaboration/teams

### Learning (Phase 6)
- GET /api/brain/learning/metrics
- POST /api/brain/learning/feedback`,
        contentType: 'document',
        tags: ['api', 'endpoints', 'reference']
      }
    ]
  },
  
  // === AI Second Brain ===
  {
    domain: 'AI Second Brain',
    items: [
      {
        title: 'AI Second Brain Architecture',
        content: `# AI Second Brain - System Architecture

## Core Concepts

### 1. Domains
Domains are knowledge containers organized by topic:
- Each domain has its own system prompt for AI responses
- Domains can have custom colors and icons
- Knowledge is organized within domains

### 2. Knowledge
Knowledge items are the building blocks:
- Title, content, content type
- Automatic embedding generation for semantic search
- Tags for categorization
- Metadata for extra information

### 3. Multi-Domain Query
Query across multiple domains:
- Intelligent routing based on query content
- Response synthesis from multiple sources
- Confidence scoring

## Database Tables (32 total)
- brain_domains - Domain definitions
- brain_knowledge - Knowledge items with embeddings
- brain_memory - Conversation memory
- brain_actions - Queued actions
- brain_workflows - Automated workflows
- brain_tasks - Task management
- brain_notifications - User notifications
- brain_analytics_events - Usage analytics
- brain_collaboration_shares - Knowledge sharing
- brain_integrations - External integrations

## Phase Overview
- Phase 1-2: Core domains & knowledge
- Phase 3: Multi-domain & Master Brain
- Phase 4: Knowledge Graph
- Phase 5: Actions, Workflows, Tasks
- Phase 6: Analytics, Learning, Collaboration`,
        contentType: 'document',
        tags: ['architecture', 'brain', 'overview']
      },
      {
        title: 'How to Use AI Second Brain',
        content: `# Using AI Second Brain

## Getting Started

### 1. Create Domains
First, create domains for your knowledge areas:
- Go to Brain Dashboard > Domain Manager
- Click "Create Domain"
- Enter name, description, system prompt

### 2. Add Knowledge
Add knowledge to your domains:
- Select a domain
- Go to "Knowledge" tab
- Enter title, content, tags
- System generates embeddings automatically

### 3. Search & Query
Search your knowledge:
- Use the search bar for semantic search
- Use Master Brain for multi-domain queries
- Results show relevance scores

### 4. Actions & Workflows
Automate tasks:
- Create workflows with triggers
- Queue actions for processing
- Monitor in Action Center

### 5. Collaborate
Share knowledge:
- Share with team members
- Add comments to knowledge
- Create team workspaces

## Best Practices
1. Use descriptive titles
2. Add relevant tags
3. Keep content focused
4. Review analytics regularly
5. Provide feedback to improve routing`,
        contentType: 'document',
        tags: ['guide', 'usage', 'tutorial']
      }
    ]
  },

  // === Development Guides ===
  {
    domain: 'Development Guides',
    items: [
      {
        title: 'Local Development Setup',
        content: `# Local Development Setup

## Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Supabase account

## Steps

### 1. Clone & Install
\`\`\`bash
cd 00-MASTER-ADMIN/longsang-admin
npm install
\`\`\`

### 2. Environment Variables
Create .env file:
\`\`\`
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
API_PORT=3001
\`\`\`

### 3. Run Development
\`\`\`bash
npm run dev        # Both frontend + API
npm run dev:frontend  # Frontend only (port 8080)
npm run dev:api      # API only (port 3001)
\`\`\`

### 4. Run Migrations
\`\`\`bash
cd scripts
node run-brain-migrations.js
\`\`\`

## Common Issues
- Port conflict: Change API_PORT in .env
- Supabase error: Check credentials
- Module not found: Run npm install`,
        contentType: 'document',
        tags: ['setup', 'development', 'local']
      },
      {
        title: 'Coding Standards',
        content: `# Coding Standards

## TypeScript
- Use strict mode
- Define interfaces for all props
- Use type instead of any
- Export types from dedicated files

## React Components
- Use functional components
- Custom hooks for logic
- Props interface with readonly
- Destructure props

## File Naming
- Components: PascalCase.tsx
- Hooks: useCamelCase.ts
- Types: camelCase.types.ts
- Utils: camelCase.ts

## Git Commits
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure

## Code Organization
\`\`\`typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface Props {
  readonly title: string;
}

// 3. Component
export function MyComponent({ title }: Props) {
  // 4. State & hooks
  const [state, setState] = useState('');
  
  // 5. Handlers
  const handleClick = () => {};
  
  // 6. Render
  return <div>{title}</div>;
}
\`\`\``,
        contentType: 'document',
        tags: ['standards', 'coding', 'best-practices']
      }
    ]
  }
];

// ============================
// HELPER FUNCTIONS
// ============================

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

async function createDomain(domain) {
  console.log(`Creating domain: ${domain.name}...`);
  
  try {
    const result = await fetchAPI('/domains', {
      method: 'POST',
      body: JSON.stringify({
        name: domain.name,
        description: domain.description,
        systemPrompt: domain.systemPrompt,
        userId: USER_ID,
        settings: {
          color: domain.color,
          icon: domain.icon
        }
      })
    });
    
    console.log(`  ✅ Created: ${domain.name} (${result.data.id})`);
    return result.data;
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`  ⚠️ Already exists: ${domain.name}`);
      // Get existing domain
      const domains = await fetchAPI('/domains');
      return domains.data.find(d => d.name === domain.name);
    }
    console.error(`  ❌ Failed: ${error.message}`);
    return null;
  }
}

async function ingestKnowledge(domainId, item) {
  console.log(`  Adding: ${item.title}...`);
  
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
    
    console.log(`    ✅ Added`);
    return true;
  } catch (error) {
    console.error(`    ❌ Failed: ${error.message}`);
    return false;
  }
}

// ============================
// MAIN EXECUTION
// ============================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       🧠 AI SECOND BRAIN - KNOWLEDGE SETUP                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Check API
  console.log('📡 Checking API connection...');
  try {
    await fetchAPI('/health');
    console.log('✅ API is running\n');
  } catch (error) {
    console.error('❌ API not running! Please start with: npm run dev:api');
    process.exit(1);
  }

  // Step 2: Create Domains
  console.log('═══ STEP 1: Creating Domains ═══\n');
  const domainMap = {};
  
  for (const domain of DOMAINS) {
    const created = await createDomain(domain);
    if (created) {
      domainMap[domain.name] = created.id;
    }
  }
  
  console.log(`\n✅ Domains ready: ${Object.keys(domainMap).length}/${DOMAINS.length}\n`);

  // Step 3: Ingest Knowledge
  console.log('═══ STEP 2: Adding Knowledge ═══\n');
  let totalAdded = 0;
  let totalFailed = 0;

  for (const knowledgeGroup of KNOWLEDGE_ITEMS) {
    const domainId = domainMap[knowledgeGroup.domain];
    
    if (!domainId) {
      console.log(`⚠️ Skipping ${knowledgeGroup.domain} - domain not found`);
      continue;
    }
    
    console.log(`\n📂 ${knowledgeGroup.domain}:`);
    
    for (const item of knowledgeGroup.items) {
      const success = await ingestKnowledge(domainId, item);
      if (success) totalAdded++;
      else totalFailed++;
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      📊 SUMMARY                              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Domains created: ${Object.keys(domainMap).length}/${DOMAINS.length}                                    ║`);
  console.log(`║  Knowledge added: ${totalAdded}                                        ║`);
  console.log(`║  Failed items: ${totalFailed}                                           ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  🎉 AI Second Brain is ready to use!                        ║');
  console.log('║  Go to: http://localhost:8080/admin/brain                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
