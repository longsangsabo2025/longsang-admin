# 🤖 Personal Automation Hub - Setup Guide

## 📋 Overview

This automation system provides AI-powered agents that monitor your business operations and execute automated workflows. The system includes:

- **Content Writer Agent**: Automatically generates blog posts from contact form submissions
- **Lead Nurture Agent**: Sends personalized follow-up emails to leads
- **Social Media Agent**: Creates and schedules social media posts from blog content
- **Analytics Agent**: Monitors metrics and generates insights reports

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Dashboard UI
├── Agent Management
├── Real-time Updates
└── Activity Monitoring

Backend (Supabase)
├── PostgreSQL Database
├── Edge Functions (automation triggers)
├── Real-time Subscriptions
└── Row Level Security

AI Integration
├── OpenAI / Claude API
├── Content Generation
└── Workflow Automation
```

## 🚀 Quick Start

### 1. Database Setup

First, run the database migrations to create all necessary tables:

```bash
# Navigate to your project directory
cd d:\0.APP\1510\long-sang-forge

# If using Supabase CLI (recommended)
supabase migration up

# Or apply migrations manually in Supabase Dashboard:
# Go to SQL Editor and run the migrations in order:
# 1. 20251015000001_create_automation_tables.sql
# 2. 20251015000002_seed_initial_agents.sql
```

### 2. Install Dependencies

All required dependencies are already in `package.json`. Just run:

```bash
npm install
# or
bun install
```

### 3. Environment Variables

The Supabase credentials are already configured in:

- `src/integrations/supabase/client.ts`

For production, move these to `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. AI API Configuration (Optional)

To enable real AI generation (currently using mock data):

1. Get API key from OpenAI or Anthropic (Claude)
2. Add to `.env`:

```env
VITE_OPENAI_API_KEY=your_openai_key
# OR
VITE_ANTHROPIC_API_KEY=your_claude_key
```

1. Update `src/lib/automation/ai-service.ts` to use real API calls

### 5. Start Development Server

```bash
npm run dev
```

Navigate to:

- Main site: `http://localhost:5173/`
- Automation Dashboard: `http://localhost:5173/automation`

## 📊 Database Schema

### Core Tables

**ai_agents**

- Stores AI agent configurations
- Tracks run statistics and status
- Contains agent-specific settings (AI model, prompts, etc.)

**automation_triggers**

- Defines when agents should execute
- Types: database, schedule, webhook, manual
- Links to specific agents

**workflows**

- Multi-step automation sequences
- Tracks execution history
- JSON-defined workflow steps

**activity_logs**

- Complete audit trail of all actions
- Error tracking and debugging
- Performance metrics

**content_queue**

- Stores generated content awaiting publication
- Priority-based queue management
- Supports scheduling

## 🎯 Using the Dashboard

### Accessing the Dashboard

1. Navigate to `/automation`
2. View overview stats:
   - Active agents count
   - Actions executed today
   - Success rate
   - Queue size

### Managing Agents

**View Agent Details:**

- Click on any agent card
- See performance metrics
- View configuration
- Check activity history

**Pause/Resume Agent:**

- Click pause/play button on agent card
- Or use buttons in agent detail page

**Manual Trigger:**

1. Open agent detail page
2. Click "Manual Trigger"
3. Provide context (if needed):

   ```json
   {
     "contact_id": "uuid-here"
   }
   ```

4. Click "Trigger Agent"

### Monitoring Activity

**Real-time Updates:**

- Dashboard automatically refreshes
- New activities appear instantly
- Agent status updates live

**Activity Logs:**

- View recent actions
- Filter by agent
- See detailed execution info
- Debug errors

**Content Queue:**

- See pending content
- View scheduled items
- Check publication status

## 🔧 Workflow Examples

### Content Writer Workflow

**Trigger:** New contact form submission

**Steps:**

1. Detect new row in `contacts` table
2. Extract topic from contact message using AI
3. Generate blog post outline
4. Write full blog post with AI
5. Generate SEO metadata
6. Add to content queue
7. Log all activities

**Manual Execution:**

```bash
# In automation dashboard, trigger Content Writer Agent with:
{
  "contact_id": "paste-contact-uuid-here"
}
```

### Lead Nurture Workflow

**Trigger:** Contact form + 24 hours delay

**Steps:**

1. Check if contact was responded to
2. Generate personalized follow-up email
3. Add to content queue with schedule
4. Update contact status
5. Schedule next follow-up if needed

### Social Media Workflow

**Trigger:** Blog post published

**Steps:**

1. Extract blog post content
2. Generate platform-specific posts (LinkedIn, Twitter, Facebook)
3. Add hashtags and formatting
4. Schedule to optimal times
5. Track engagement

## 🔌 Setting Up Database Triggers (Automatic Execution)

To make agents run automatically when data changes, create Supabase Edge Functions:

### Example: Auto-trigger on new contact

Create file: `supabase/functions/trigger-content-writer/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()
  
  // Get Supabase client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Get Content Writer agent
  const { data: agent } = await supabaseAdmin
    .from('ai_agents')
    .select('*')
    .eq('type', 'content_writer')
    .eq('status', 'active')
    .single()
  
  if (agent) {
    // Call your workflow function
    // This would call your actual workflow logic
    console.log('Triggering Content Writer for contact:', record.id)
  }
  
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then create database webhook:

```sql
CREATE TRIGGER on_contact_created
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://your-project.supabase.co/functions/v1/trigger-content-writer',
    'POST',
    '{"Content-Type": "application/json"}',
    '{}',
    '1000'
  );
```

## 🎨 Customizing Agents

### Modify Agent Configuration

Edit agent in dashboard or directly in database:

```sql
UPDATE ai_agents 
SET config = jsonb_set(
  config, 
  '{ai_model}', 
  '"gpt-4"'
)
WHERE name = 'Content Writer Agent';
```

### Create New Agent Type

1. Add new type to `src/types/automation.ts`
2. Create workflow in `src/lib/automation/workflows.ts`
3. Add UI icon/color in components
4. Insert agent via dashboard or SQL:

```sql
INSERT INTO ai_agents (name, type, status, description, config)
VALUES (
  'My Custom Agent',
  'custom_type',
  'active',
  'Does custom automation',
  '{"ai_model": "gpt-4", "custom_param": "value"}'::jsonb
);
```

## 📈 Monitoring & Debugging

### Check Agent Status

```sql
SELECT 
  name,
  status,
  total_runs,
  successful_runs,
  last_run,
  last_error
FROM ai_agents
ORDER BY last_run DESC;
```

### View Recent Activity

```sql
SELECT 
  al.*,
  aa.name as agent_name
FROM activity_logs al
LEFT JOIN ai_agents aa ON al.agent_id = aa.id
ORDER BY al.created_at DESC
LIMIT 50;
```

### Check Content Queue

```sql
SELECT 
  title,
  content_type,
  status,
  priority,
  scheduled_for,
  created_at
FROM content_queue
WHERE status IN ('pending', 'scheduled')
ORDER BY priority DESC, created_at ASC;
```

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- Only authenticated users can access automation features
- API keys should be stored in environment variables
- Service role key needed for Edge Functions

## 🚦 Troubleshooting

### Agent not triggering?

1. Check agent status is 'active'
2. Verify triggers are enabled
3. Check activity logs for errors
4. Ensure database trigger/webhook is set up

### AI generation failing?

1. Verify API keys are configured
2. Check `ai-service.ts` implementation
3. Review error messages in activity logs
4. Test with manual trigger first

### Real-time updates not working?

1. Check Supabase Realtime is enabled
2. Verify RLS policies allow SELECT
3. Check browser console for errors
4. Refresh the page

## 📚 Next Steps

1. **Configure AI APIs**: Replace mock AI service with real API calls
2. **Set up Edge Functions**: Enable automatic triggering
3. **Add Email Integration**: Connect SendGrid/Resend for email sending
4. **Implement Publishing**: Add WordPress/CMS integration
5. **Create More Agents**: Build custom automation workflows
6. **Add Scheduling**: Implement cron-based triggers
7. **Analytics Dashboard**: Visualize agent performance over time

## 🆘 Support

For questions or issues:

1. Check activity logs in the dashboard
2. Review Supabase logs
3. Check browser console for errors
4. Verify database schema is up to date

## 📝 License

This automation system is part of your personal portfolio project.
