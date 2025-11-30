/**
 * 🌱 Seed Initial Knowledge Data
 * Populate the knowledge base with Long Sang's information
 * 
 * Run: node api/scripts/seed-knowledge.js
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_USER_ID = 'default-longsang-user';

// ============================================
// ADMIN PROFILE DATA
// ============================================
const ADMIN_PROFILE = {
  user_id: DEFAULT_USER_ID,
  full_name: 'Long Sang',
  nickname: 'Sang',
  role: 'Founder & CEO',
  bio: 'Full-stack developer và entrepreneur với đam mê AI/ML. Đang xây dựng nhiều sản phẩm tech tại Việt Nam.',
  location: 'Vietnam',
  timezone: 'Asia/Ho_Chi_Minh',
  communication_style: 'direct',
  response_preference: 'structured',
  expertise_level: 'expert',
  preferred_language: 'vi',
  ai_verbosity: 'medium',
  include_explanations: true,
  include_examples: true,
};

// ============================================
// BUSINESS ENTITIES DATA
// ============================================
const BUSINESS_ENTITIES = [
  {
    name: 'LongSang Tech',
    legal_name: 'LongSang Technology Company',
    type: 'startup',
    status: 'active',
    description: 'Công ty công nghệ tập trung vào AI/ML solutions, EdTech, và Real Estate Tech',
    mission: 'Democratize AI for Vietnamese market',
    vision: 'Become leading AI solutions provider in Southeast Asia',
    industries: ['AI/ML', 'EdTech', 'Real Estate', 'Gaming'],
    target_market: 'B2C & B2B in Vietnam',
    business_model: 'B2B2C',
    revenue_model: ['subscription', 'one-time', 'commission'],
    funding_stage: 'bootstrapped',
    team_size: 1,
    founded_date: '2024-01-01',
  },
];

// ============================================
// PROJECT REGISTRY DATA
// ============================================
const PROJECTS = [
  {
    name: 'AI Newbie',
    slug: 'ai-newbie',
    description: 'Nền tảng đào tạo AI cho người mới bắt đầu - Khóa học từ cơ bản đến nâng cao',
    type: 'product',
    category: 'platform',
    status: 'active',
    priority: 10,
    tech_stack: {
      frontend: ['React', 'TypeScript', 'TailwindCSS', 'Shadcn UI'],
      backend: ['Node.js', 'Express', 'Supabase'],
      ai: ['OpenAI GPT-4', 'Claude 3.5'],
      infrastructure: ['Vercel', 'Supabase', 'GitHub Actions'],
    },
    current_phase: 'development',
    progress_percent: 60,
    monetization_status: 'not-monetized',
    short_term_goals: ['Launch MVP', 'Get first 100 users', 'Create 5 courses'],
    long_term_goals: ['10,000 users', '$10k MRR', 'Mobile app'],
    folder_path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/ainewbie-web',
  },
  {
    name: 'LongSang Admin',
    slug: 'longsang-admin',
    description: 'Admin dashboard với AI Workspace - Trung tâm điều khiển cho mọi project',
    type: 'internal-tool',
    category: 'web-app',
    status: 'active',
    priority: 9,
    tech_stack: {
      frontend: ['React', 'TypeScript', 'TailwindCSS', 'Shadcn UI'],
      backend: ['Node.js', 'Express'],
      ai: ['OpenAI', 'Anthropic Claude', 'Tavily'],
      database: ['Supabase', 'pgvector'],
    },
    current_phase: 'development',
    progress_percent: 70,
    monetization_status: 'not-monetized',
    short_term_goals: ['AI Workspace hoàn thiện', 'Knowledge Base integration'],
    folder_path: 'D:/0.PROJECTS/00-MASTER-ADMIN/longsang-admin',
  },
  {
    name: 'Vũng Tàu Dream Homes',
    slug: 'vungtau-dream-homes',
    description: 'Nền tảng bất động sản Vũng Tàu - Tìm kiếm, mua bán, cho thuê',
    type: 'product',
    category: 'platform',
    status: 'active',
    priority: 8,
    tech_stack: {
      frontend: ['React', 'TypeScript', 'TailwindCSS'],
      backend: ['Supabase'],
      integrations: ['Google Maps', 'VNPay'],
    },
    current_phase: 'development',
    progress_percent: 40,
    monetization_status: 'not-monetized',
    short_term_goals: ['Launch listings', 'SEO optimization'],
    folder_path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/vungtau-dream-homes',
  },
  {
    name: 'Sabo Hub',
    slug: 'sabo-hub',
    description: 'Gaming ecosystem platform - Community, tournaments, streaming',
    type: 'product',
    category: 'platform',
    status: 'active',
    priority: 7,
    tech_stack: {
      frontend: ['React', 'TypeScript'],
      backend: ['Supabase'],
    },
    current_phase: 'development',
    progress_percent: 30,
    monetization_status: 'not-monetized',
    folder_path: 'D:/0.PROJECTS/02-SABO-ECOSYSTEM/sabo-hub',
  },
  {
    name: 'Sabo Arena',
    slug: 'sabo-arena',
    description: 'Gaming competition platform - Esports tournaments',
    type: 'product',
    category: 'web-app',
    status: 'planning',
    priority: 6,
    tech_stack: {
      frontend: ['React'],
      backend: ['Supabase'],
    },
    current_phase: 'ideation',
    progress_percent: 10,
    folder_path: 'D:/0.PROJECTS/02-SABO-ECOSYSTEM/sabo-arena',
  },
  {
    name: 'LongSang Portfolio',
    slug: 'longsang-portfolio',
    description: 'Personal portfolio website - Showcase projects và services',
    type: 'product',
    category: 'web-app',
    status: 'live',
    priority: 5,
    tech_stack: {
      frontend: ['React', 'TypeScript', 'TailwindCSS'],
    },
    current_phase: 'maintenance',
    progress_percent: 90,
    folder_path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/longsang-portfolio',
  },
  {
    name: 'AI Secretary (EVA)',
    slug: 'ai-secretary',
    description: 'AI Personal Assistant - Thư ký ảo thông minh',
    type: 'product',
    category: 'api',
    status: 'active',
    priority: 7,
    tech_stack: {
      backend: ['Node.js', 'Express'],
      ai: ['OpenAI', 'Claude'],
      database: ['Supabase', 'pgvector'],
    },
    current_phase: 'development',
    progress_percent: 50,
    folder_path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/ai_secretary',
  },
];

// ============================================
// KNOWLEDGE BASE DATA
// ============================================
const KNOWLEDGE_ENTRIES = [
  // Personal knowledge
  {
    category: 'personal',
    title: 'Long Sang - Working Style & Preferences',
    content: `
Long Sang's working style and communication preferences:

**Communication:**
- Prefers direct, efficient communication
- Likes structured responses with bullet points
- Vietnamese primary, English technical terms OK
- Values actionable insights over theoretical discussion

**Decision Making:**
- Data-driven approach
- Fast iteration, MVP mindset
- Focus on automation and efficiency
- Prefers testing quickly over long planning

**Daily Routine:**
- Coding/Development: Primary focus
- Multiple projects in parallel
- Heavy use of AI tools (Copilot, ChatGPT, Claude)
- n8n for workflow automation

**Tools & Environment:**
- VS Code with GitHub Copilot
- Supabase for database
- Vercel for deployment
- n8n for automation
- Multiple monitors setup
    `,
    importance: 10,
    tags: ['personal', 'style', 'preferences', 'core'],
  },
  {
    category: 'personal',
    title: 'Long Sang - Skills & Expertise',
    content: `
Technical Skills:
- Full-stack Development: React, Node.js, TypeScript (Expert)
- AI/ML Integration: OpenAI, Claude, Embeddings (Advanced)
- Database: PostgreSQL, Supabase, pgvector (Advanced)
- DevOps: Docker, Vercel, GitHub Actions (Intermediate)
- Automation: n8n, Zapier (Expert)

Business Skills:
- Product Management: MVP, User research
- Marketing: SEO, Content Marketing (Intermediate)
- Finance: Basic accounting, budgeting

Domain Knowledge:
- AI/ML Applications
- EdTech platforms
- Real Estate market (Vietnam)
- Gaming industry
    `,
    importance: 9,
    tags: ['personal', 'skills', 'expertise'],
  },
  
  // Business knowledge
  {
    category: 'business',
    title: 'LongSang Tech - Business Model',
    content: `
LongSang Tech Business Overview:

**Revenue Streams:**
1. AI Newbie - Subscription courses ($9.99-$49.99/month)
2. Consulting - AI implementation services
3. Vũng Tàu Dream Homes - Commission on transactions
4. Sabo Hub - Premium features, tournament fees

**Cost Structure:**
- Infrastructure: ~$100-500/month (Vercel, Supabase, APIs)
- AI APIs: Variable based on usage ($50-500/month)
- Marketing: Minimal (organic SEO focus)
- No full-time employees (solo founder)

**Growth Strategy:**
- Focus on AI Newbie as primary revenue
- Build in public, organic marketing
- Leverage AI for content creation
- Automate everything possible

**Competitive Advantage:**
- Vietnamese language focus
- Practical, hands-on approach
- AI-powered personalization
- Fast iteration speed
    `,
    importance: 10,
    tags: ['business', 'model', 'strategy'],
  },
  {
    category: 'business',
    title: 'Target Market Analysis',
    content: `
Primary Target Markets:

**AI Newbie:**
- Demographics: Vietnamese professionals 25-45
- Pain point: Want to learn AI but courses are in English/too technical
- Size: ~5 million potential users
- Willingness to pay: $10-50/month

**Vũng Tàu Dream Homes:**
- Demographics: Home buyers in Vũng Tàu area
- Pain point: Hard to find trusted listings
- Market: Growing real estate market

**Sabo Hub:**
- Demographics: Vietnamese gamers 16-30
- Pain point: Lack of local gaming community platform
- Size: ~10 million gamers in Vietnam
    `,
    importance: 8,
    tags: ['business', 'market', 'analysis'],
  },
  
  // Technical knowledge
  {
    category: 'technical',
    title: 'Tech Stack Standards',
    content: `
Standard tech stack for all projects:

**Frontend:**
- React 18+ with TypeScript
- TailwindCSS + Shadcn UI components
- Vite for build tool
- React Router for routing

**Backend:**
- Node.js + Express
- Supabase for database & auth
- pgvector for embeddings

**AI Integration:**
- OpenAI GPT-4o/GPT-4o-mini for chat
- Claude 3.5 Sonnet for complex tasks
- text-embedding-3-small for vectors
- Tavily for web search

**Infrastructure:**
- Vercel for frontend hosting
- Supabase hosted database
- GitHub Actions for CI/CD

**Code Standards:**
- ESLint + Prettier
- TypeScript strict mode
- Component-based architecture
- API-first design
    `,
    importance: 9,
    tags: ['technical', 'stack', 'standards'],
  },
  {
    category: 'technical',
    title: 'AI Integration Patterns',
    content: `
Standard patterns for AI integration:

**Chat Interface:**
- Streaming responses for better UX
- Message history management
- Token optimization
- Error handling with retry

**RAG Implementation:**
- pgvector for vector storage
- text-embedding-3-small (1536 dimensions)
- Cosine similarity search
- Context window management

**Model Selection:**
- Simple queries: gpt-4o-mini
- Complex analysis: claude-3-5-sonnet
- Cost optimization: Route by complexity

**Best Practices:**
- Always set max_tokens
- Use temperature 0.7 for creative, 0.3 for factual
- Cache repeated queries
- Log all AI interactions for debugging
    `,
    importance: 8,
    tags: ['technical', 'ai', 'patterns'],
  },
  
  // Financial knowledge
  {
    category: 'financial',
    title: 'Financial Overview 2025',
    content: `
Current Financial Status (as of 2025):

**Monthly Expenses:**
- Infrastructure: ~$200
- AI APIs: ~$100-300
- Domains/Services: ~$50
- Total: ~$350-550/month

**Revenue (Target):**
- Currently: Pre-revenue
- Q2 2025: $500/month
- Q4 2025: $2,000/month
- 2026: $10,000/month

**Funding:**
- Bootstrapped
- No external investment
- Personal savings runway: 12+ months

**Investment Priorities:**
1. AI API costs (essential)
2. Marketing (when revenue positive)
3. Team (when profitable)
    `,
    importance: 8,
    tags: ['financial', 'budget', 'revenue'],
  },
  
  // Process knowledge
  {
    category: 'process',
    title: 'Development Workflow',
    content: `
Standard development workflow:

**Daily Process:**
1. Review overnight automation results
2. Check GitHub notifications
3. Priority task from todo list
4. Deep work blocks (2-3 hours)
5. AI-assisted code review
6. Deploy to staging
7. Document progress

**Project Management:**
- GitHub Projects for tracking
- Weekly sprint planning
- Daily standup (self)
- Monthly review

**Code Review:**
- Self-review with AI assistance
- Automated tests before merge
- Deploy preview for UI changes

**Release Process:**
1. Feature branch development
2. PR with description
3. Automated tests
4. Review (AI + self)
5. Merge to main
6. Auto-deploy to production
    `,
    importance: 7,
    tags: ['process', 'workflow', 'development'],
  },
  
  // Decision knowledge
  {
    category: 'decision',
    title: 'Technology Decisions Log',
    content: `
Key technology decisions and reasoning:

**Why Supabase over Firebase:**
- PostgreSQL flexibility
- pgvector for AI embeddings
- Better pricing model
- Open source

**Why React over Next.js:**
- Simpler deployment
- More control over routing
- Existing team expertise
- Vercel still works great

**Why Claude for complex tasks:**
- Better at nuanced analysis
- Longer context window
- More consistent outputs
- Good at Vietnamese

**Why n8n for automation:**
- Self-hosted option
- Visual workflow builder
- Good AI integrations
- Cost effective
    `,
    importance: 7,
    tags: ['decision', 'technology', 'rationale'],
  },
];

// ============================================
// GOALS DATA
// ============================================
const GOALS = [
  {
    title: 'Launch AI Newbie MVP',
    description: 'Complete and launch the minimum viable product for AI Newbie platform',
    type: 'business',
    timeframe: 'quarterly',
    status: 'active',
    target_metric: 'Users',
    target_value: 100,
    current_value: 0,
    priority: 10,
    target_date: '2025-03-31',
  },
  {
    title: 'AI Workspace Complete',
    description: 'Finish AI Workspace with all 6 assistants fully functional with knowledge base',
    type: 'business',
    timeframe: 'monthly',
    status: 'active',
    progress_percent: 70,
    priority: 9,
    target_date: '2025-12-15',
  },
  {
    title: 'First Revenue',
    description: 'Generate first $100 in revenue from any product',
    type: 'financial',
    timeframe: 'quarterly',
    status: 'active',
    target_metric: 'Revenue',
    target_value: 100,
    current_value: 0,
    priority: 8,
    target_date: '2025-03-31',
  },
  {
    title: 'Build Personal Brand',
    description: 'Establish presence on Twitter/LinkedIn with AI content',
    type: 'personal',
    timeframe: 'yearly',
    status: 'active',
    target_metric: 'Followers',
    target_value: 1000,
    current_value: 0,
    priority: 6,
    target_date: '2025-12-31',
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedAdminProfile() {
  console.log('🔄 Seeding admin profile...');
  
  const { error } = await supabase
    .from('admin_profiles')
    .upsert(ADMIN_PROFILE, { onConflict: 'user_id' });
  
  if (error) {
    console.error('❌ Error seeding profile:', error.message);
    return false;
  }
  
  console.log('✅ Admin profile seeded');
  return true;
}

async function seedBusinessEntities() {
  console.log('🔄 Seeding business entities...');
  
  for (const business of BUSINESS_ENTITIES) {
    const { error } = await supabase
      .from('business_entities')
      .upsert({ ...business, user_id: DEFAULT_USER_ID }, { onConflict: 'name' });
    
    if (error) {
      console.error(`❌ Error seeding business ${business.name}:`, error.message);
    } else {
      console.log(`  ✅ ${business.name}`);
    }
  }
  
  return true;
}

async function seedProjects() {
  console.log('🔄 Seeding projects...');
  
  for (const project of PROJECTS) {
    const { error } = await supabase
      .from('project_registry')
      .upsert({ ...project, user_id: DEFAULT_USER_ID }, { onConflict: 'slug' });
    
    if (error) {
      console.error(`❌ Error seeding project ${project.name}:`, error.message);
    } else {
      console.log(`  ✅ ${project.name}`);
    }
  }
  
  return true;
}

async function seedKnowledge() {
  console.log('🔄 Seeding knowledge base...');
  
  // Import knowledge service for embedding generation
  const knowledgeService = require('../services/ai-workspace/knowledge-service');
  
  for (const entry of KNOWLEDGE_ENTRIES) {
    try {
      await knowledgeService.addKnowledge(DEFAULT_USER_ID, entry);
      console.log(`  ✅ ${entry.title}`);
    } catch (error) {
      console.error(`❌ Error seeding knowledge ${entry.title}:`, error.message);
    }
  }
  
  return true;
}

async function seedGoals() {
  console.log('🔄 Seeding goals...');
  
  for (const goal of GOALS) {
    const { error } = await supabase
      .from('goals_roadmap')
      .insert({ ...goal, user_id: DEFAULT_USER_ID });
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`❌ Error seeding goal ${goal.title}:`, error.message);
    } else {
      console.log(`  ✅ ${goal.title}`);
    }
  }
  
  return true;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🌱 Starting Knowledge Base Seed...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`👤 User ID: ${DEFAULT_USER_ID}\n`);
  
  try {
    await seedAdminProfile();
    await seedBusinessEntities();
    await seedProjects();
    await seedKnowledge();
    await seedGoals();
    
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - 1 Admin Profile`);
    console.log(`  - ${BUSINESS_ENTITIES.length} Business Entities`);
    console.log(`  - ${PROJECTS.length} Projects`);
    console.log(`  - ${KNOWLEDGE_ENTRIES.length} Knowledge Entries`);
    console.log(`  - ${GOALS.length} Goals`);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

module.exports = {
  seedAdminProfile,
  seedBusinessEntities,
  seedProjects,
  seedKnowledge,
  seedGoals,
  ADMIN_PROFILE,
  BUSINESS_ENTITIES,
  PROJECTS,
  KNOWLEDGE_ENTRIES,
  GOALS,
};
