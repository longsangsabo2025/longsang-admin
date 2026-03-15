/**
 * Brain Knowledge Setup - Complete knowledge ingestion for all domains
 */

import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

const USER_ID = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';

// ========================================
// STEP 1: CLEANUP TEST DOMAINS
// ========================================
async function cleanupTestDomains() {
  console.log('\n🧹 STEP 1: CLEANING UP TEST DOMAINS...');
  console.log('─'.repeat(50));
  
  // Find test domains
  const testDomains = await pool.query(`SELECT id, name FROM brain_domains WHERE name LIKE 'Test Domain%'`);
  console.log(`Found ${testDomains.rows.length} test domains to delete`);
  
  // Delete knowledge in test domains first
  for (const domain of testDomains.rows) {
    await pool.query('DELETE FROM brain_knowledge WHERE domain_id = $1', [domain.id]);
  }
  
  // Delete test domains
  const result = await pool.query(`DELETE FROM brain_domains WHERE name LIKE 'Test Domain%' RETURNING name`);
  console.log(`✅ Deleted ${result.rows.length} test domains`);
}

// ========================================
// STEP 2: ADD NEW KNOWLEDGE
// ========================================
const KNOWLEDGE_DATA = {
  // =========== SABO ECOSYSTEM ===========
  'SABO Ecosystem': [
    {
      title: 'SABO Arena Overview',
      content: `# SABO Arena - Gaming Platform

## Overview
SABO Arena là nền tảng gaming blockchain với các tính năng:

### Core Features
1. **Play-to-Earn Games**
   - Multiple game modes
   - $SABO token rewards
   - Tournament system

2. **NFT Integration**
   - Character NFTs
   - Item NFTs
   - Marketplace trading

3. **Staking & DeFi**
   - Stake $SABO for rewards
   - Liquidity pools
   - Yield farming

### Tech Stack
- Frontend: Next.js 14, TypeScript, TailwindCSS
- Blockchain: Solana, Anchor Framework
- Backend: Node.js, PostgreSQL
- Real-time: WebSocket

### Key Files
- \`sabo-arena/website/\` - Main website
- \`sabo-arena/contracts/\` - Smart contracts
- \`sabo-arena/game-engine/\` - Game logic`,
      contentType: 'document',
      tags: ['sabo', 'arena', 'gaming', 'blockchain']
    },
    {
      title: 'SABO Hub Architecture',
      content: `# SABO Hub - Central Ecosystem Hub

## Overview
SABO Hub kết nối tất cả các sản phẩm trong SABO Ecosystem.

### Components
1. **Dashboard**
   - Portfolio overview
   - Activity feed
   - Notifications

2. **Wallet Integration**
   - Multi-chain support (Solana, Ethereum)
   - Token balances
   - Transaction history

3. **Social Features**
   - User profiles
   - Leaderboards
   - Community chat

### Project Structure
\`\`\`
sabo-hub/
├── sabohub-nexus/     # Main Next.js app
├── api/               # Backend services
└── contracts/         # Smart contracts
\`\`\`

### Key Technologies
- Next.js 14 with App Router
- Supabase for auth & database
- Solana Web3.js
- Wagmi for Ethereum`,
      contentType: 'document',
      tags: ['sabo', 'hub', 'ecosystem', 'dashboard']
    },
    {
      title: 'SABO Tokenomics',
      content: `# $SABO Token Economics

## Token Details
- Symbol: $SABO
- Blockchain: Solana
- Total Supply: 1,000,000,000

## Distribution
| Allocation | Percentage | Vesting |
|------------|------------|---------|
| Game Rewards | 40% | 4 years linear |
| Team | 15% | 1 year cliff, 3 years vesting |
| Treasury | 20% | DAO controlled |
| Liquidity | 15% | Locked |
| Marketing | 10% | 2 years vesting |

## Utility
1. **In-Game Currency** - Buy items, upgrades
2. **Staking** - Earn yield + governance
3. **Governance** - Vote on proposals
4. **NFT Minting** - Mint game assets
5. **Tournament Entry** - Join competitive events`,
      contentType: 'document',
      tags: ['sabo', 'tokenomics', 'crypto', 'economics']
    }
  ],

  // =========== REAL ESTATE PROJECTS ===========
  'Real Estate Projects': [
    {
      title: 'Vũng Tàu Dream Homes Overview',
      content: `# Vũng Tàu Dream Homes - Real Estate Platform

## Overview
Platform quản lý và marketing bất động sản Vũng Tàu.

### Features
1. **Property Listings**
   - Căn hộ, nhà phố, biệt thự
   - Filter theo giá, vị trí, diện tích
   - Gallery ảnh, video 360

2. **Investment Calculator**
   - ROI calculator
   - Mortgage calculator
   - Price comparison

3. **CRM System**
   - Lead management
   - Appointment scheduling
   - Customer history

### Tech Stack
- Frontend: React, Vite, TailwindCSS
- Backend: Supabase
- Maps: Google Maps API
- Analytics: Mixpanel

### Project Location
\`01-MAIN-PRODUCTS/vungtau-dream-homes/\``,
      contentType: 'document',
      tags: ['real-estate', 'vungtau', 'property', 'investment']
    },
    {
      title: 'Real Estate Investment Calculator',
      content: `# Investment Calculator Logic

## ROI Calculation
\`\`\`typescript
interface InvestmentParams {
  purchasePrice: number;
  downPayment: number;
  loanTerm: number; // years
  interestRate: number; // annual %
  monthlyRent: number;
  expenses: {
    maintenance: number;
    tax: number;
    insurance: number;
  };
}

function calculateROI(params: InvestmentParams) {
  const { purchasePrice, downPayment, monthlyRent, expenses } = params;
  
  const totalInvestment = downPayment;
  const annualRent = monthlyRent * 12;
  const annualExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
  const netIncome = annualRent - annualExpenses;
  
  const cashOnCashReturn = (netIncome / totalInvestment) * 100;
  const capRate = (netIncome / purchasePrice) * 100;
  
  return { cashOnCashReturn, capRate, netIncome };
}
\`\`\`

## Mortgage Calculator
- Monthly Payment = P * [r(1+r)^n] / [(1+r)^n - 1]
- P = Principal
- r = Monthly interest rate
- n = Number of payments`,
      contentType: 'document',
      tags: ['real-estate', 'investment', 'calculator', 'roi']
    }
  ],

  // =========== BUSINESS RULES ===========
  'Business Rules': [
    {
      title: 'Pricing Models',
      content: `# Pricing Models & Business Rules

## SaaS Pricing Tiers
| Tier | Price/month | Features |
|------|-------------|----------|
| Free | $0 | 1 project, 100 requests/day |
| Pro | $29 | 10 projects, 10k requests/day |
| Business | $99 | Unlimited projects, 100k requests/day |
| Enterprise | Custom | Dedicated support, SLA |

## Real Estate Commission
- Sale Commission: 2% of sale price
- Rental Commission: 1 month rent
- Referral Bonus: 10% of commission

## Discount Rules
1. Early Bird: 20% off first year
2. Annual Payment: 2 months free
3. Referral: Both get 15% off
4. Volume: 10+ users = 25% off`,
      contentType: 'document',
      tags: ['business', 'pricing', 'commission', 'rules']
    },
    {
      title: 'Marketing & Growth Rules',
      content: `# Marketing & Growth Guidelines

## Customer Acquisition Cost (CAC) Targets
- Organic: < $10
- Paid Search: < $50
- Social Ads: < $30
- Referral: < $15

## Conversion Funnels
\`\`\`
Landing Page → Sign Up → Onboarding → First Action → Paid
   100%    →    5%    →    60%     →     40%     → 10%
\`\`\`

## Email Campaign Rules
- Welcome series: Day 0, 1, 3, 7
- Nurture: Weekly tips
- Re-engagement: After 30 days inactive
- Unsubscribe: Must honor within 48h

## Content Marketing
- Blog: 2 posts/week
- Social: Daily posts
- Newsletter: Weekly
- Video: 1/month`,
      contentType: 'document',
      tags: ['marketing', 'growth', 'acquisition', 'funnels']
    },
    {
      title: 'ROI Calculation Formulas',
      content: `# Financial Formulas & Calculations

## Return on Investment (ROI)
\`\`\`
ROI = (Net Profit / Investment) × 100

Net Profit = Revenue - Costs
\`\`\`

## Customer Lifetime Value (CLV)
\`\`\`
CLV = Average Purchase Value × Purchase Frequency × Customer Lifespan

For SaaS:
CLV = ARPU × (1 / Churn Rate)
\`\`\`

## Payback Period
\`\`\`
Payback Period = CAC / (ARPU × Gross Margin)
\`\`\`

## Monthly Recurring Revenue (MRR)
\`\`\`
MRR = Number of Customers × Average Revenue per Customer

ARR = MRR × 12
\`\`\`

## Churn Rate
\`\`\`
Churn Rate = (Customers Lost / Total Customers) × 100

Revenue Churn = (MRR Lost / Total MRR) × 100
\`\`\``,
      contentType: 'document',
      tags: ['finance', 'roi', 'metrics', 'calculations']
    }
  ],

  // =========== LONGSANG ADMIN ===========
  'Longsang Admin': [
    {
      title: 'Component Library Overview',
      content: `# Longsang Admin - Component Library

## UI Components (shadcn/ui based)
Located in: \`src/components/ui/\`

### Form Components
- \`Button\` - Primary, secondary, ghost, outline variants
- \`Input\` - Text input with validation
- \`Select\` - Dropdown selection
- \`Checkbox\`, \`Radio\`, \`Switch\` - Boolean inputs
- \`Form\` - react-hook-form integration

### Layout Components
- \`Card\` - Content containers
- \`Dialog\` - Modal dialogs
- \`Sheet\` - Slide-out panels
- \`Tabs\` - Tabbed navigation
- \`Accordion\` - Collapsible sections

### Data Display
- \`Table\` - Data tables with sorting
- \`Badge\` - Status indicators
- \`Avatar\` - User avatars
- \`Progress\` - Progress bars
- \`Skeleton\` - Loading states

### Navigation
- \`Sidebar\` - App navigation
- \`Breadcrumb\` - Path navigation
- \`Menubar\` - Top menu
- \`Command\` - Command palette (Ctrl+K)`,
      contentType: 'document',
      tags: ['components', 'ui', 'shadcn', 'react']
    },
    {
      title: 'Custom Hooks Reference',
      content: `# Custom React Hooks

## Data Fetching Hooks
\`\`\`typescript
// Solo Hub hooks
useAgents()         // Get all AI agents
useAgentChat()      // Chat with agent
useMemories()       // Agent memory CRUD
useCreateMemory()   // Add new memory
useSearchMemories() // Semantic search

// Brain hooks
useDomains()        // Domain management
useKnowledge()      // Knowledge CRUD
useCoreLogic()      // Core logic queries
\`\`\`

## UI State Hooks
\`\`\`typescript
useSidebar()        // Sidebar open/close
useIsMobile()       // Responsive detection
useToast()          // Toast notifications
useConfirm()        // Confirmation dialogs
\`\`\`

## Feature Hooks
\`\`\`typescript
useChatHistory()    // Chat session persistence
useCanvasHistory()  // Undo/redo for canvas
useCanvasClipboard()// Copy/paste nodes
useCanvasKeyboard() // Keyboard shortcuts
\`\`\`

## Usage Example
\`\`\`typescript
const { data: agents, isLoading } = useAgents();
const createMemory = useCreateMemory();

await createMemory.mutateAsync({
  title: 'New Memory',
  content: 'Memory content...',
  category: 'fact'
});
\`\`\``,
      contentType: 'document',
      tags: ['hooks', 'react', 'typescript', 'api']
    },
    {
      title: 'Page Components Structure',
      content: `# Page Components

## Admin Pages (\`src/pages/\`)

### Dashboard Pages
- \`Index.tsx\` - Main dashboard
- \`BrainDashboard.tsx\` - AI Second Brain
- \`SystemMap.tsx\` - System architecture visualizer
- \`VisualWorkspace.tsx\` - AI workspace builder

### Feature Pages
- \`AICommandCenter.tsx\` - AI agent management
- \`UnifiedAICommandCenter.tsx\` - Unified AI interface
- \`AutomationDashboard.tsx\` - Workflow automation
- \`ProjectCommandCenter.tsx\` - Project management

### Utility Pages
- \`Settings.tsx\` - App settings
- \`Analytics.tsx\` - Usage analytics
- \`Documentation.tsx\` - Docs viewer

## Page Structure Pattern
\`\`\`tsx
export default function PageName() {
  // 1. Hooks
  const { data, isLoading } = useData();
  
  // 2. State
  const [filter, setFilter] = useState('');
  
  // 3. Effects
  useEffect(() => { /* ... */ }, []);
  
  // 4. Handlers
  const handleAction = () => { /* ... */ };
  
  // 5. Render
  return (
    <MainLayout>
      <PageHeader title="Page Title" />
      <PageContent>
        {/* Content */}
      </PageContent>
    </MainLayout>
  );
}
\`\`\``,
      contentType: 'document',
      tags: ['pages', 'react', 'structure', 'admin']
    }
  ],

  // =========== API REFERENCE ===========
  'API Reference': [
    {
      title: 'Brain API Endpoints',
      content: `# Brain API Reference

Base URL: \`http://localhost:3001/api/brain\`

## Domains
\`\`\`
GET    /domains              # List all domains
POST   /domains              # Create domain
GET    /domains/:id          # Get domain by ID
PUT    /domains/:id          # Update domain
DELETE /domains/:id          # Delete domain
\`\`\`

## Knowledge
\`\`\`
GET    /knowledge            # List knowledge (with filters)
POST   /knowledge/ingest     # Ingest new knowledge
GET    /knowledge/:id        # Get knowledge by ID
PUT    /knowledge/:id        # Update knowledge
DELETE /knowledge/:id        # Delete knowledge
POST   /knowledge/search     # Semantic search
\`\`\`

## Query
\`\`\`
POST   /query                # Query knowledge (RAG)
POST   /query/multi          # Multi-domain query
\`\`\`

## Request Examples
\`\`\`bash
# Search knowledge
curl -X POST /api/brain/knowledge/search \\
  -H "Content-Type: application/json" \\
  -d '{"query": "how to deploy", "domainIds": ["uuid"], "limit": 5}'

# Ingest knowledge
curl -X POST /api/brain/knowledge/ingest \\
  -H "Content-Type: application/json" \\
  -d '{"domainId": "uuid", "title": "Title", "content": "..."}'
\`\`\``,
      contentType: 'document',
      tags: ['api', 'brain', 'endpoints', 'rest']
    },
    {
      title: 'Solo Hub API Endpoints',
      content: `# Solo Hub API Reference

Base URL: \`http://localhost:3001/api/solo-hub\`

## Agents
\`\`\`
GET    /agents               # List all agents
GET    /agents/:agentId      # Get agent details
\`\`\`

## Chat
\`\`\`
POST   /chat                 # Send message (SSE streaming)
GET    /chat/history/:agentId # Get chat history
DELETE /chat/history/:agentId # Clear chat history
\`\`\`

## Memory
\`\`\`
GET    /memory               # List memories
POST   /memory               # Create memory
PUT    /memory/:id           # Update memory
DELETE /memory/:id           # Delete memory
GET    /memory/search        # Semantic search
GET    /memory/categories    # Get categories
\`\`\`

## SSE Streaming Response
\`\`\`javascript
// Client-side
const eventSource = new EventSource('/api/solo-hub/chat?...');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: 'token' | 'done' | 'error'
  // data.content: string
};
\`\`\``,
      contentType: 'document',
      tags: ['api', 'solo-hub', 'agents', 'chat']
    },
    {
      title: 'Supabase Database Schema',
      content: `# Database Schema Reference

## Brain Tables
\`\`\`sql
-- Domains
brain_domains (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  icon TEXT,
  color TEXT,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Knowledge with vector embeddings
brain_knowledge (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES brain_domains,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'document',
  tags TEXT[],
  metadata JSONB,
  embedding vector(1536),
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
\`\`\`

## Solo Hub Tables
\`\`\`sql
-- Agent Memory
agent_memory (
  id UUID PRIMARY KEY,
  memory_type TEXT,
  category TEXT,
  title TEXT,
  content TEXT,
  importance TEXT,
  tags TEXT[],
  source TEXT,
  used_count INTEGER,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
\`\`\`

## Vector Search Function
\`\`\`sql
SELECT * FROM match_knowledge(
  query_embedding := '[...]'::vector,
  match_threshold := 0.7,
  match_count := 10,
  domain_ids := ARRAY['uuid1', 'uuid2']
);
\`\`\``,
      contentType: 'document',
      tags: ['database', 'schema', 'supabase', 'sql']
    }
  ],

  // =========== AI SECOND BRAIN ===========
  'AI Second Brain': [
    {
      title: 'Knowledge Ingestion Pipeline',
      content: `# Knowledge Ingestion Pipeline

## Flow
\`\`\`
Input → Preprocessing → Chunking → Embedding → Storage
\`\`\`

## 1. Preprocessing
- Remove HTML tags
- Normalize whitespace
- Extract metadata (title, dates, authors)

## 2. Chunking Strategy
\`\`\`typescript
const CHUNK_CONFIG = {
  maxChunkSize: 1000,    // tokens
  overlapSize: 100,      // tokens overlap
  minChunkSize: 100,     // minimum viable chunk
};

function chunkDocument(content: string): string[] {
  // Split by paragraphs first
  // Then by sentences if still too large
  // Ensure overlap for context continuity
}
\`\`\`

## 3. Embedding Generation
- Model: OpenAI text-embedding-3-large
- Dimensions: 1536
- Batch size: 100 items

## 4. Storage
- PostgreSQL with pgvector
- Index: IVFFlat with 100 lists
- Similarity: Cosine distance

## API Endpoint
\`\`\`typescript
POST /api/brain/knowledge/ingest
{
  domainId: "uuid",
  title: "Document Title",
  content: "Full content...",
  contentType: "document",
  tags: ["tag1", "tag2"],
  metadata: { source: "url", author: "name" }
}
\`\`\``,
      contentType: 'document',
      tags: ['brain', 'ingestion', 'embedding', 'rag']
    },
    {
      title: 'Semantic Search Implementation',
      content: `# Semantic Search Implementation

## Query Pipeline
\`\`\`
User Query → Embedding → Vector Search → Reranking → Results
\`\`\`

## 1. Query Embedding
\`\`\`typescript
const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: userQuery,
});
\`\`\`

## 2. Vector Search
\`\`\`sql
SELECT 
  id, title, content,
  1 - (embedding <=> query_embedding) as similarity
FROM brain_knowledge
WHERE domain_id = ANY($1)
  AND 1 - (embedding <=> query_embedding) > 0.7
ORDER BY embedding <=> query_embedding
LIMIT 10;
\`\`\`

## 3. Hybrid Search (Vector + Keyword)
\`\`\`typescript
// Combine vector similarity with keyword matching
const results = await Promise.all([
  vectorSearch(query, domainIds),
  keywordSearch(query, domainIds),
]);

// Merge and rerank using RRF
const merged = reciprocalRankFusion(results, k=60);
\`\`\`

## 4. Reranking
- Remove duplicates
- Boost recent content
- Apply domain weights
- Filter by minimum similarity`,
      contentType: 'document',
      tags: ['brain', 'search', 'vector', 'rag']
    }
  ],

  // =========== DEVELOPMENT GUIDES ===========
  'Development Guides': [
    {
      title: 'Git Workflow & Branching',
      content: `# Git Workflow Guide

## Branch Naming
\`\`\`
main              # Production
develop           # Integration
feature/ABC-123   # New features
bugfix/ABC-123    # Bug fixes
hotfix/ABC-123    # Production fixes
\`\`\`

## Commit Messages
\`\`\`
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Tests
- chore: Maintenance

Examples:
feat(brain): add semantic search
fix(canvas): resolve drag-drop issue
docs(api): update endpoint docs
\`\`\`

## PR Process
1. Create feature branch from develop
2. Make changes, commit frequently
3. Push and create PR
4. Request review from team
5. Address feedback
6. Squash merge to develop

## Hotfix Process
1. Branch from main: \`hotfix/critical-bug\`
2. Fix and test
3. PR to main AND develop
4. Tag release`,
      contentType: 'document',
      tags: ['git', 'workflow', 'branching', 'commits']
    },
    {
      title: 'Testing Best Practices',
      content: `# Testing Guide

## Test Types
1. **Unit Tests** - Individual functions
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Full user flows

## Unit Testing
\`\`\`typescript
// vitest example
describe('calculateROI', () => {
  it('should return correct ROI percentage', () => {
    const result = calculateROI({
      investment: 1000,
      profit: 200
    });
    expect(result).toBe(20);
  });

  it('should handle zero investment', () => {
    expect(() => calculateROI({
      investment: 0,
      profit: 100
    })).toThrow('Investment cannot be zero');
  });
});
\`\`\`

## API Testing
\`\`\`typescript
describe('POST /api/brain/knowledge/search', () => {
  it('should return relevant results', async () => {
    const response = await request(app)
      .post('/api/brain/knowledge/search')
      .send({ query: 'deployment guide' });
    
    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(5);
  });
});
\`\`\`

## Coverage Goals
- Unit: 80%+
- Integration: 70%+
- Critical paths: 100%`,
      contentType: 'document',
      tags: ['testing', 'vitest', 'unit-tests', 'tdd']
    }
  ],

  // =========== OPERATIONS & DEVOPS ===========
  'Operations & DevOps': [
    {
      title: 'Deployment Pipeline',
      content: `# Deployment Pipeline

## Environments
| Environment | URL | Branch |
|-------------|-----|--------|
| Development | localhost:5173 | feature/* |
| Staging | staging.longsang.app | develop |
| Production | longsang.app | main |

## CI/CD Pipeline (GitHub Actions)
\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm test
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
\`\`\`

## Rollback Procedure
1. Identify the issue
2. Revert to previous deployment
3. Investigate root cause
4. Fix and deploy properly`,
      contentType: 'document',
      tags: ['deployment', 'cicd', 'vercel', 'github-actions']
    },
    {
      title: 'Monitoring & Alerting',
      content: `# Monitoring Guide

## Key Metrics
1. **Performance**
   - Page load time < 3s
   - API response time < 500ms
   - Error rate < 1%

2. **Availability**
   - Uptime > 99.9%
   - Health check interval: 30s

3. **Resources**
   - CPU usage < 80%
   - Memory usage < 85%
   - Database connections < 90%

## Tools
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance
- **Supabase Dashboard** - Database metrics
- **Custom Logger** - Application logs

## Alert Rules
\`\`\`yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    notify: slack, email
    
  - name: API Latency
    condition: p95_latency > 2s
    duration: 10m
    notify: slack
    
  - name: Database Connection Pool
    condition: connections > 90%
    duration: 5m
    notify: slack, pagerduty
\`\`\`

## On-Call Rotation
- Primary: Check alerts, respond within 15m
- Secondary: Backup if primary unavailable
- Escalation: After 30m no response`,
      contentType: 'document',
      tags: ['monitoring', 'alerting', 'sentry', 'observability']
    }
  ],

  // =========== TROUBLESHOOTING ===========
  'Troubleshooting': [
    {
      title: 'Common Issues & Solutions',
      content: `# Common Issues & Solutions

## 1. API Server Won't Start
**Symptoms:** Port already in use, connection refused
\`\`\`bash
# Find process using port
netstat -ano | findstr :3001
# Kill process
taskkill /PID <pid> /F

# Or use different port
PORT=3002 npm run server
\`\`\`

## 2. Supabase Connection Errors
**Symptoms:** ECONNREFUSED, timeout
\`\`\`bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl https://your-project.supabase.co/rest/v1/
\`\`\`

## 3. Build Failures
**Symptoms:** TypeScript errors, missing modules
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npx tsc --noEmit
\`\`\`

## 4. Vector Search Returns Empty
**Symptoms:** No results despite data exists
- Check if embeddings are generated
- Verify domain IDs are correct
- Lower similarity threshold (0.7 → 0.5)

## 5. Memory Leaks
**Symptoms:** Slow performance over time
- Check for unsubscribed event listeners
- Verify useEffect cleanup functions
- Monitor with Chrome DevTools Memory tab`,
      contentType: 'document',
      tags: ['troubleshooting', 'debugging', 'issues', 'solutions']
    }
  ]
};

// ========================================
// HELPER: Get domain ID by name
// ========================================
async function getDomainId(name) {
  const result = await pool.query(
    'SELECT id FROM brain_domains WHERE name = $1',
    [name]
  );
  return result.rows[0]?.id;
}

// ========================================
// HELPER: Create embedding via API
// ========================================
async function createEmbedding(text) {
  try {
    const response = await fetch('http://localhost:3001/api/brain/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.substring(0, 8000) }) // Truncate if too long
    });
    
    if (!response.ok) {
      console.log('  ⚠️ Embedding API not available, skipping');
      return null;
    }
    
    const data = await response.json();
    return data.embedding;
  } catch (e) {
    return null; // API not running
  }
}

// ========================================
// STEP 3: INSERT KNOWLEDGE
// ========================================
async function insertKnowledge() {
  console.log('\n📚 STEP 2: INSERTING KNOWLEDGE...');
  console.log('─'.repeat(50));
  
  let totalInserted = 0;
  let totalSkipped = 0;
  
  for (const [domainName, items] of Object.entries(KNOWLEDGE_DATA)) {
    const domainId = await getDomainId(domainName);
    
    if (!domainId) {
      console.log(`⚠️ Domain "${domainName}" not found, skipping ${items.length} items`);
      totalSkipped += items.length;
      continue;
    }
    
    console.log(`\n📁 ${domainName} (${items.length} items)`);
    
    for (const item of items) {
      // Check if already exists
      const existing = await pool.query(
        'SELECT id FROM brain_knowledge WHERE domain_id = $1 AND title = $2',
        [domainId, item.title]
      );
      
      if (existing.rows.length > 0) {
        console.log(`   ⏭️ "${item.title}" already exists`);
        totalSkipped++;
        continue;
      }
      
      // Generate embedding
      const embedding = await createEmbedding(item.title + '\n\n' + item.content);
      
      // Insert knowledge
      await pool.query(
        `INSERT INTO brain_knowledge 
          (domain_id, title, content, content_type, tags, embedding, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          domainId,
          item.title,
          item.content,
          item.contentType || 'document',
          item.tags || [],
          embedding ? `[${embedding.join(',')}]` : null,
          USER_ID
        ]
      );
      
      console.log(`   ✅ "${item.title}"${embedding ? ' (with embedding)' : ''}`);
      totalInserted++;
    }
  }
  
  console.log(`\n📊 Summary: Inserted ${totalInserted}, Skipped ${totalSkipped}`);
}

// ========================================
// STEP 4: GENERATE MISSING EMBEDDINGS
// ========================================
async function generateMissingEmbeddings() {
  console.log('\n🧬 STEP 3: GENERATING MISSING EMBEDDINGS...');
  console.log('─'.repeat(50));
  
  const missing = await pool.query(
    'SELECT id, title, content FROM brain_knowledge WHERE embedding IS NULL'
  );
  
  if (missing.rows.length === 0) {
    console.log('✅ All knowledge items have embeddings');
    return;
  }
  
  console.log(`Found ${missing.rows.length} items without embeddings`);
  
  let generated = 0;
  for (const item of missing.rows) {
    const embedding = await createEmbedding(item.title + '\n\n' + item.content);
    
    if (embedding) {
      await pool.query(
        'UPDATE brain_knowledge SET embedding = $1 WHERE id = $2',
        [`[${embedding.join(',')}]`, item.id]
      );
      console.log(`   ✅ Generated for "${item.title}"`);
      generated++;
    }
  }
  
  console.log(`Generated embeddings for ${generated}/${missing.rows.length} items`);
}

// ========================================
// MAIN EXECUTION
// ========================================
async function main() {
  console.log('═'.repeat(60));
  console.log('🧠 AI SECOND BRAIN - KNOWLEDGE SETUP');
  console.log('═'.repeat(60));
  
  try {
    await cleanupTestDomains();
    await insertKnowledge();
    await generateMissingEmbeddings();
    
    // Final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge');
    const withEmb = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge WHERE embedding IS NOT NULL');
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ SETUP COMPLETE');
    console.log(`   Total Knowledge: ${finalCount.rows[0].count}`);
    console.log(`   With Embeddings: ${withEmb.rows[0].count}`);
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  await pool.end();
}

main();
