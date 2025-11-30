# ⚡ Edge Functions Setup Guide

## 🎯 What Are Edge Functions?

Supabase Edge Functions are serverless functions that run on Deno at the edge (close to users). They enable:

- ✅ Auto-triggers when database events occur
- ✅ Background processing (AI generation, emails, etc.)
- ✅ Webhook handling
- ✅ Scheduled tasks

---

## 📁 What's Already Created

### Edge Function: `trigger-content-writer`

**Location:** `supabase/functions/trigger-content-writer/index.ts`

**Purpose:** Automatically generates blog posts when contact form is submitted

**Flow:**

1. Contact form submitted → `contacts` table INSERT
2. Database trigger fires
3. Edge Function called
4. AI extracts topic from message
5. AI generates blog post
6. Content added to queue
7. Activity logged

---

## 🚀 Setup Instructions

### Option 1: Using Supabase CLI (Recommended)

#### Step 1: Install Supabase CLI

```bash
# Windows (PowerShell)
scoop install supabase

# Or download from:
# https://github.com/supabase/cli/releases
```

#### Step 2: Login to Supabase

```bash
supabase login
```

#### Step 3: Link to Your Project

```bash
cd d:\0.APP\1510\long-sang-forge
supabase link --project-ref ckivqeakosyaryhntpis
```

#### Step 4: Deploy Edge Function

```bash
supabase functions deploy trigger-content-writer
```

#### Step 5: Set Environment Variables

```bash
# Set AI API keys
supabase secrets set OPENAI_API_KEY=sk-your-key
# OR
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
```

#### Step 6: Apply Database Migration

```bash
supabase db push
```

---

### Option 2: Using Supabase Dashboard (Easier)

#### Step 1: Deploy Edge Function

1. Go to: <https://supabase.com/dashboard/project/ckivqeakosyaryhntpis/functions>
2. Click "Create a new function"
3. Name: `trigger-content-writer`
4. Copy code from `supabase/functions/trigger-content-writer/index.ts`
5. Paste into editor
6. Click "Deploy"

#### Step 2: Set Secrets

1. Go to "Edge Functions" → "Settings"
2. Add secrets:
   - `OPENAI_API_KEY` = your OpenAI key
   - OR `ANTHROPIC_API_KEY` = your Claude key

#### Step 3: Setup Webhook

1. Go to "Database" → "Webhooks"
2. Click "Create a new webhook"
3. Configure:
   - **Name:** `Contact Form Auto-Trigger`
   - **Table:** `contacts`
   - **Events:** `INSERT`
   - **Type:** `HTTP Request`
   - **Method:** `POST`
   - **URL:** `https://ckivqeakosyaryhntpis.supabase.co/functions/v1/trigger-content-writer`
   - **Headers:**

     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
     }
     ```

4. Click "Create webhook"

#### Step 4: Apply Migration

Use the MCP Supabase tool or SQL Editor:

```sql
-- Copy contents of:
-- supabase/migrations/20251015000003_setup_auto_triggers.sql
-- Paste into SQL Editor and run
```

---

## 🧪 Testing Auto-Triggers

### Test 1: Manual Contact Submission

```sql
-- Insert test contact
INSERT INTO public.contacts (name, email, service, message)
VALUES (
  'John Doe',
  'john@example.com',
  'AI Automation',
  'I want to learn about building AI automation systems for my business. Can you help me understand the best practices?'
);
```

**Expected Result:**

1. Edge Function triggered automatically
2. Activity log created: "Content generated from contact form"
3. Content queue has new blog post
4. Topic extracted: "AI Automation Systems"

### Test 2: Check Logs

```bash
# Using CLI
supabase functions logs trigger-content-writer

# Or in Dashboard:
# Edge Functions → trigger-content-writer → Logs
```

### Test 3: Verify Content Queue

```sql
SELECT 
  title,
  content_type,
  status,
  metadata->>'topic' as topic,
  created_at
FROM content_queue
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 Monitoring

### View Function Invocations

Dashboard → Edge Functions → trigger-content-writer → Metrics

**Metrics:**

- Total invocations
- Success rate
- Average duration
- Error rate

### Check Activity Logs

```sql
SELECT 
  action,
  status,
  details,
  created_at
FROM activity_logs
WHERE action LIKE '%contact form%'
ORDER BY created_at DESC;
```

### Monitor Costs

Edge Functions pricing:

- **Free tier:** 500K invocations/month
- **Pro:** $2/month + $0.000002 per invocation
- **Typical cost:** ~$0.01-0.05/month for moderate use

---

## 🔧 Customization

### Add More Triggers

Create new Edge Functions for other agents:

**Lead Nurture (24h delay):**

```typescript
// supabase/functions/trigger-lead-nurture/index.ts
// Schedule follow-up email 24h after contact
```

**Social Media (on blog publish):**

```typescript
// supabase/functions/trigger-social-media/index.ts
// Generate social posts when blog published
```

**Analytics (weekly):**

```typescript
// supabase/functions/trigger-analytics/index.ts
// Generate weekly report (use Supabase Cron)
```

### Modify Content Writer Logic

Edit `supabase/functions/trigger-content-writer/index.ts`:

```typescript
// Change topic extraction
async function extractTopic(message: string, config: any): Promise<string> {
  // Your custom logic
  const keywords = extractKeywords(message);
  return keywords[0]; // Use first keyword as topic
}

// Customize blog post generation
async function generateBlogPost(topic: string, config: any) {
  const prompt = `Your custom prompt here...`;
  // ...
}
```

Then redeploy:

```bash
supabase functions deploy trigger-content-writer
```

---

## 🐛 Troubleshooting

### Function Not Triggering

**Check:**

1. Webhook is enabled (Dashboard → Webhooks)
2. Function is deployed (Dashboard → Edge Functions)
3. Secrets are set (OPENAI_API_KEY or ANTHROPIC_API_KEY)
4. Contact has `processed = false`

**Debug:**

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_contact_submitted';

-- Check recent contacts
SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5;
```

### Function Errors

**View logs:**

```bash
supabase functions logs trigger-content-writer --tail
```

**Common errors:**

- `No AI API keys configured` → Set secrets
- `Agent not found` → Ensure Content Writer agent is active
- `Rate limit exceeded` → Wait or upgrade API plan

### Webhook Not Working

**Test webhook manually:**

```bash
curl -X POST \
  https://ckivqeakosyaryhntpis.supabase.co/functions/v1/trigger-content-writer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "record": {
      "id": "test-id",
      "name": "Test",
      "email": "test@example.com",
      "message": "Test message about AI automation"
    }
  }'
```

---

## 🔐 Security

### Service Role Key

**Never expose in frontend!**

- ✅ Use in Edge Functions (server-side)
- ✅ Use in database triggers
- ❌ Never in browser code
- ❌ Never commit to git

### RLS Policies

Contacts table has RLS:

- ✅ Anyone can INSERT (contact form)
- ✅ Only authenticated can SELECT
- ✅ Only service role can UPDATE/DELETE

### API Keys

Store in Supabase Secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

**Never** hardcode in Edge Function code!

---

## 📈 Performance Tips

### Optimize Function

```typescript
// Use streaming for large responses
const stream = await callAI(prompt, { stream: true });

// Cache common prompts
const cachedPrompts = new Map();

// Limit max_tokens to reduce cost
config.max_tokens = 1500; // Instead of 2000
```

### Batch Processing

Instead of triggering per contact, batch:

```sql
-- Process multiple contacts at once
SELECT * FROM contacts 
WHERE processed = false 
LIMIT 10;
```

### Rate Limiting

Add cooldown between triggers:

```typescript
// Check last run time
const lastRun = await getLastAgentRun(agentId);
const hoursSinceLastRun = (Date.now() - lastRun) / 3600000;

if (hoursSinceLastRun < 1) {
  console.log('Cooldown period, skipping');
  return;
}
```

---

## 🎯 Next Steps

1. **✅ Deploy Edge Function** - Follow Option 1 or 2 above
2. **✅ Set AI API keys** - In Supabase secrets
3. **✅ Apply migration** - Create contacts table & triggers
4. **✅ Test with sample contact** - Insert test data
5. **⏭️ Add email integration** - For Lead Nurture agent
6. **⏭️ Add WordPress publishing** - Auto-publish blog posts
7. **⏭️ Schedule analytics** - Weekly reports with Cron

---

## 📚 Resources

- **Supabase Edge Functions:** <https://supabase.com/docs/guides/functions>
- **Deno Deploy:** <https://deno.com/deploy/docs>
- **Webhooks Guide:** <https://supabase.com/docs/guides/database/webhooks>
- **Cron Jobs:** <https://supabase.com/docs/guides/functions/schedule-functions>

---

## ✨ Summary

**You now have:**

- ✅ Edge Function code ready to deploy
- ✅ Database triggers configured
- ✅ Webhook setup instructions
- ✅ Testing & monitoring guides
- ✅ Security best practices

**To activate:**

1. Deploy Edge Function (CLI or Dashboard)
2. Set AI API key secrets
3. Apply database migration
4. Insert test contact
5. Watch automation magic happen! 🎉

**Status:** Ready to deploy! Follow Option 1 or 2 to activate auto-triggers.
