# 🤖 Personal Automation Hub

## Overview

A comprehensive AI-powered automation system built on top of your portfolio website. This system enables autonomous operation of business processes through intelligent agents that monitor, analyze, and act on data in real-time.

## 🎯 Key Features

### ✅ **Implemented (MVP)**

1. **📊 Automation Dashboard**
   - Real-time monitoring of all agents
   - Activity logs and performance metrics
   - Content queue management
   - Live updates via Supabase subscriptions

2. **🤖 AI Agent Fleet**
   - **Content Writer Agent**: Generates blog posts from contact form submissions
   - **Lead Nurture Agent**: Sends personalized follow-up emails
   - **Social Media Agent**: Creates platform-specific social posts
   - **Analytics Agent**: Monitors metrics and generates insights

3. **⚙️ Agent Management**
   - Pause/Resume agents
   - Manual triggering with custom context
   - View detailed performance stats
   - Configure agent parameters
   - Delete and recreate agents

4. **📝 Content Queue**
   - Priority-based queue system
   - Scheduling capabilities
   - Status tracking (pending, processing, published, failed)
   - Retry logic for failed items

5. **📈 Activity Logging**
   - Complete audit trail
   - Error tracking and debugging
   - Performance metrics (duration, success rate)
   - Searchable and filterable logs

6. **🔄 Real-time Updates**
   - Live agent status changes
   - Instant activity notifications
   - Content queue updates
   - WebSocket-based subscriptions

### 🚧 **Ready for Enhancement**

1. **Database Triggers** (Setup Required)
   - Automatic agent execution on data changes
   - Webhook integrations
   - Cron-based scheduling

2. **AI Integration** (API Keys Required)
   - OpenAI GPT-4 integration
   - Claude Sonnet 4 integration
   - Custom prompt engineering

3. **Publishing Integration** (Setup Required)
   - WordPress/CMS publishing
   - Email service integration (SendGrid/Resend)
   - Social media platform APIs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│  • Automation Dashboard (/automation)                        │
│  • Agent Detail Pages (/automation/agents/:id)               │
│  • Real-time Status Updates                                  │
│  • Activity Log Viewer                                       │
│  • Content Queue Manager                                     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUPABASE (Backend + Database)                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Tables:                                          │
│  • ai_agents - Agent configurations                          │
│  • automation_triggers - Trigger definitions                 │
│  • workflows - Multi-step processes                          │
│  • activity_logs - Complete audit trail                      │
│  • content_queue - Generated content                         │
│  • contacts - Form submissions (existing)                    │
│                                                              │
│  Features:                                                   │
│  • Row Level Security (RLS)                                  │
│  • Real-time Subscriptions                                  │
│  • Edge Functions (ready for triggers)                       │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI SERVICES (External APIs)                │
├─────────────────────────────────────────────────────────────┤
│  • OpenAI GPT-4                                              │
│  • Anthropic Claude                                          │
│  • Content Generation                                        │
│  • Personalization                                           │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Files Created

### Database Migrations

- `supabase/migrations/20251015000001_create_automation_tables.sql` - Core schema
- `supabase/migrations/20251015000002_seed_initial_agents.sql` - Initial data

### Type Definitions

- `src/types/automation.ts` - TypeScript interfaces for all automation entities

### API & Services

- `src/lib/automation/api.ts` - Supabase integration functions
- `src/lib/automation/ai-service.ts` - AI generation service (ready for API integration)
- `src/lib/automation/workflows.ts` - Agent workflow execution logic

### Pages

- `src/pages/AutomationDashboard.tsx` - Main automation dashboard
- `src/pages/AgentDetail.tsx` - Individual agent management page

### Components

- `src/components/automation/DashboardHeader.tsx` - Dashboard header
- `src/components/automation/StatsCards.tsx` - Overview statistics
- `src/components/automation/AgentStatusCards.tsx` - Agent status display
- `src/components/automation/ContentQueueList.tsx` - Content queue viewer
- `src/components/automation/ActivityLogList.tsx` - Activity log display

### Documentation

- `AUTOMATION_SETUP.md` - Complete setup and usage guide
- `AUTOMATION_README.md` - This file

## 🚀 Quick Start

### 1. Apply Database Migrations

```bash
# Option A: Using Supabase CLI (recommended)
supabase migration up

# Option B: Manual via Supabase Dashboard
# Go to SQL Editor and run:
# 1. 20251015000001_create_automation_tables.sql
# 2. 20251015000002_seed_initial_agents.sql
```

### 2. Install Dependencies

```bash
npm install
# All required packages are already in package.json
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access the Dashboard

Navigate to: `http://localhost:5173/automation`

Or click the **"Automation"** button in the navigation bar.

## 📖 Usage Guide

### Accessing the Dashboard

1. Click the **🤖 Automation** button in the top navigation
2. View real-time dashboard with:
   - Active agents count
   - Actions executed today
   - Success rate percentage
   - Content queue size

### Managing Agents

**View All Agents:**

- Dashboard shows active agents by default
- Click "View All" to see all agents (active, paused, error)

**View Agent Details:**

- Click on any agent card
- See performance metrics, configuration, triggers, and activity history

**Pause/Resume Agent:**

- Click pause/play icon on agent card
- Or use buttons in agent detail page

**Manual Trigger:**

1. Go to agent detail page
2. Click "Manual Trigger" button
3. Enter context JSON (optional):

   ```json
   {
     "contact_id": "uuid-of-contact"
   }
   ```

4. Click "Trigger Agent"

**Delete Agent:**

1. Go to agent detail page
2. Click "Delete" button
3. Confirm deletion

### Monitoring Activity

**Real-time Updates:**

- Dashboard auto-refreshes
- New activities appear instantly
- Agent status updates live

**Activity Logs:**

- View recent actions on dashboard
- Click "View All Logs" for complete history
- Filter by agent
- See execution details and errors

**Content Queue:**

- View pending content
- Check scheduled items
- Monitor publication status
- See priority and timestamps

## 🎨 Current Agents

### 1. Content Writer Agent ✍️

**Status:** Active (seeded with sample data)  
**Purpose:** Automatically generate blog posts from contact form submissions

**How it works:**

1. Monitors `contacts` table for new submissions
2. Extracts topic from contact message using AI
3. Generates comprehensive blog post
4. Creates SEO metadata
5. Adds to content queue for review/publishing

**Manual Trigger:**

```json
{
  "contact_id": "uuid-here"
}
```

### 2. Lead Nurture Agent 💌

**Status:** Paused (ready to activate)  
**Purpose:** Send personalized follow-up emails to leads

**How it works:**

1. Waits 24 hours after contact submission
2. Generates personalized follow-up email
3. Schedules email for sending
4. Tracks engagement and responses

**Configuration:**

- `follow_up_delay_hours`: 24
- `max_follow_ups`: 3
- `personalization_level`: high

### 3. Social Media Agent 📱

**Status:** Paused (ready to activate)  
**Purpose:** Generate and schedule social media posts

**How it works:**

1. Triggered when blog post is published
2. Generates platform-specific posts (LinkedIn, Twitter, Facebook)
3. Adds hashtags and formatting
4. Schedules for optimal posting times

**Platforms:**

- LinkedIn (professional tone)
- Twitter (casual, thread-friendly)
- Facebook (community-focused)

### 4. Analytics Agent 📊

**Status:** Paused (ready to activate)  
**Purpose:** Monitor metrics and generate insights

**How it works:**

1. Runs on weekly schedule (Mondays at 9 AM)
2. Collects website analytics
3. Generates insights and trends
4. Creates reports
5. Sends alerts on important metrics

## 🔧 Configuration

### Agent Configuration

Each agent has a `config` JSON field with customizable parameters:

```typescript
{
  ai_model: "claude-sonnet-4" | "gpt-4",
  auto_publish: boolean,
  require_approval: boolean,
  tone: "professional" | "casual" | "friendly",
  max_length: number,
  // Agent-specific parameters...
}
```

### Modifying Agent Config

**Via Dashboard:** (Coming soon - agent builder UI)

**Via SQL:**

```sql
UPDATE ai_agents 
SET config = jsonb_set(
  config, 
  '{ai_model}', 
  '"gpt-4"'
)
WHERE name = 'Content Writer Agent';
```

## 🔌 Integrations (Next Steps)

### AI APIs

**Current State:** Mock implementation in `ai-service.ts`

**To Enable Real AI:**

1. Get API key from OpenAI or Anthropic
2. Add to `.env`:

   ```env
   VITE_OPENAI_API_KEY=sk-...
   # OR
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Update `src/lib/automation/ai-service.ts` with actual API calls

**Example OpenAI Integration:**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export async function generateWithAI(request: AIGenerationRequest) {
  const response = await openai.chat.completions.create({
    model: request.config?.model || 'gpt-4',
    messages: [
      { role: 'system', content: request.config?.system_prompt || '' },
      { role: 'user', content: request.prompt }
    ],
    temperature: request.config?.temperature || 0.7,
    max_tokens: request.config?.max_tokens || 2000,
  });
  
  return {
    content: response.choices[0].message.content,
    model: response.model,
    tokens_used: response.usage?.total_tokens,
  };
}
```

### Email Service

**Recommended:** SendGrid or Resend

**Setup:**

1. Create account and get API key
2. Add to `.env`
3. Implement email sending in workflow

### Database Triggers

**Create Supabase Edge Function:**

```bash
supabase functions new trigger-content-writer
```

See `AUTOMATION_SETUP.md` for complete examples.

## 📊 Database Queries

### Check Agent Performance

```sql
SELECT 
  name,
  type,
  status,
  total_runs,
  successful_runs,
  ROUND((successful_runs::float / NULLIF(total_runs, 0) * 100), 2) as success_rate,
  last_run,
  last_error
FROM ai_agents
ORDER BY total_runs DESC;
```

### View Recent Activity

```sql
SELECT 
  al.created_at,
  aa.name as agent_name,
  al.action,
  al.status,
  al.duration_ms,
  al.error_message
FROM activity_logs al
LEFT JOIN ai_agents aa ON al.agent_id = aa.id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Check Content Queue

```sql
SELECT 
  cq.title,
  cq.content_type,
  cq.status,
  cq.priority,
  aa.name as agent_name,
  cq.created_at,
  cq.scheduled_for
FROM content_queue cq
LEFT JOIN ai_agents aa ON cq.agent_id = aa.id
WHERE cq.status IN ('pending', 'scheduled')
ORDER BY cq.priority DESC, cq.created_at ASC;
```

## 🐛 Troubleshooting

### Agent Not Triggering

1. **Check agent status:**

   ```sql
   SELECT * FROM ai_agents WHERE id = 'agent-id';
   ```

2. **Verify triggers are enabled:**

   ```sql
   SELECT * FROM automation_triggers WHERE agent_id = 'agent-id';
   ```

3. **Check activity logs for errors:**

   ```sql
   SELECT * FROM activity_logs 
   WHERE agent_id = 'agent-id' 
   ORDER BY created_at DESC LIMIT 10;
   ```

### Real-time Updates Not Working

1. Check Supabase Realtime is enabled in dashboard
2. Verify RLS policies allow SELECT operations
3. Check browser console for WebSocket errors
4. Try refreshing the page

### AI Generation Errors

1. Verify API keys are set correctly
2. Check `ai-service.ts` implementation
3. Review error messages in activity logs
4. Test with manual trigger first

## 🚦 Next Development Steps

### Phase 1: Enable Real AI (1-2 days)

- [ ] Integrate OpenAI or Claude API
- [ ] Replace mock AI service with real calls
- [ ] Test content generation quality
- [ ] Tune prompts and parameters

### Phase 2: Auto-Triggering (2-3 days)

- [ ] Create Supabase Edge Functions
- [ ] Set up database triggers
- [ ] Implement webhook handlers
- [ ] Add cron scheduling

### Phase 3: Publishing Integration (3-4 days)

- [ ] WordPress API integration
- [ ] Email service setup (SendGrid/Resend)
- [ ] Social media API connections
- [ ] Automated publishing workflow

### Phase 4: Enhanced UI (2-3 days)

- [ ] Agent creation wizard
- [ ] Workflow builder (visual)
- [ ] Analytics dashboard
- [ ] Performance charts

### Phase 5: Advanced Features (1-2 weeks)

- [ ] Multi-step workflows
- [ ] Conditional logic
- [ ] A/B testing for content
- [ ] Learning from engagement data
- [ ] Custom agent templates

## 💰 Cost Estimate

**Infrastructure:**

- Supabase: Free tier (sufficient for MVP)
- AI APIs: ~$50-200/month (usage-based)
- Email Service: Free tier or ~$15/month
- Total: $50-215/month

**Development Time Invested:**

- MVP System: ~20 hours ✅ COMPLETED
- AI Integration: ~8 hours (pending)
- Auto-triggering: ~12 hours (pending)
- Publishing: ~16 hours (pending)
- UI Enhancements: ~16 hours (pending)

## 📄 License

Part of your personal portfolio project.

## 🙏 Acknowledgments

Built with:

- React + TypeScript
- Supabase (PostgreSQL + Real-time)
- shadcn/ui components
- TailwindCSS
- React Query
- Lucide Icons
