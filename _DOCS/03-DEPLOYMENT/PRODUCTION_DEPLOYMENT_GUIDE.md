# 🚀 Production Deployment Guide

## ✅ Điều Kiện Tiên Quyết

Hệ thống AI Automation đã hoàn thiện với:

- ✅ Real AI Integration (OpenAI + Claude)
- ✅ Email Service (Resend/SendGrid)
- ✅ Social Media Publishing (LinkedIn, Facebook)
- ✅ Auto-Triggering via Edge Functions
- ✅ Authentication System (Supabase Auth)
- ✅ Production RLS Policies

---

## 📋 Deployment Checklist

### **Phase 1: Database Setup (15 phút)**

#### 1.1 Apply All Migrations

```bash
# Connect to Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations in order
supabase db push

# Or apply manually via Supabase Dashboard > SQL Editor:
# 1. 20251015000001_create_automation_tables.sql
# 2. 20251015000002_seed_initial_agents.sql
# 3. 20251015000003_setup_auto_triggers.sql
# 4. 20251016000001_update_rls_production.sql
```

#### 1.2 Verify Tables Created

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'ai_agents',
  'automation_triggers',
  'workflows',
  'activity_logs',
  'content_queue'
);

-- Check seeded agents
SELECT name, type, status FROM ai_agents;
```

#### 1.3 Enable Realtime

Go to Supabase Dashboard > Database > Replication:

- Enable realtime for: `ai_agents`, `activity_logs`, `content_queue`

---

### **Phase 2: API Keys Configuration (10 phút)**

#### 2.1 Create `.env` File

```bash
# Copy example
cp .env.example .env
```

#### 2.2 Configure API Keys

**Required:**

```env
# Supabase (from Supabase Dashboard > Settings > API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**AI Providers (chọn một hoặc cả hai):**

```env
# OpenAI (https://platform.openai.com/api-keys)
VITE_OPENAI_API_KEY=sk-your-openai-api-key

# OR Anthropic Claude (https://console.anthropic.com/)
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

**Email Service (chọn một):**

```env
# Resend (Recommended - https://resend.com)
VITE_RESEND_API_KEY=re_your-resend-key

# OR SendGrid
VITE_SENDGRID_API_KEY=SG.your-sendgrid-key
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Social Media (Optional):**

```env
# LinkedIn
VITE_LINKEDIN_ACCESS_TOKEN=your-linkedin-token

# Facebook
VITE_FACEBOOK_ACCESS_TOKEN=your-facebook-token
VITE_FACEBOOK_PAGE_ID=your-page-id
```

#### 2.3 Get API Keys

**OpenAI:**

1. Go to <https://platform.openai.com/api-keys>
2. Click "Create new secret key"
3. Copy key (starts with `sk-`)
4. Add billing method: <https://platform.openai.com/account/billing>

**Resend:**

1. Go to <https://resend.com/api-keys>
2. Click "Create API Key"
3. Copy key (starts with `re_`)
4. Verify domain: <https://resend.com/domains>

**LinkedIn:**

1. Create app: <https://www.linkedin.com/developers/apps>
2. Get access token via OAuth 2.0
3. Scope: `w_member_social`

---

### **Phase 3: Deploy Edge Functions (20 phút)**

#### 3.1 Configure Supabase CLI

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref
```

#### 3.2 Set Environment Secrets

```bash
# AI API Keys
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key

# Email Service
supabase secrets set RESEND_API_KEY=re_your-key

# Social Media
supabase secrets set LINKEDIN_ACCESS_TOKEN=your-token
supabase secrets set FACEBOOK_ACCESS_TOKEN=your-token
supabase secrets set FACEBOOK_PAGE_ID=your-page-id
```

#### 3.3 Deploy Functions

```bash
# Deploy all functions
supabase functions deploy trigger-content-writer
supabase functions deploy send-scheduled-emails
supabase functions deploy publish-social-posts

# Verify deployment
supabase functions list
```

#### 3.4 Test Edge Functions

```bash
# Test content writer
curl -X POST \
  https://your-project.supabase.co/functions/v1/trigger-content-writer \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"record":{"id":"test","message":"Test AI automation"}}'

# Test email sender
supabase functions invoke send-scheduled-emails

# Test social publisher
supabase functions invoke publish-social-posts
```

---

### **Phase 4: Setup Cron Jobs (10 phút)**

#### 4.1 Create Cron Schedules

Go to Supabase Dashboard > Database > Cron Jobs:

**Send Scheduled Emails (every 10 minutes):**

```sql
SELECT cron.schedule(
  'send-scheduled-emails',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-scheduled-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  ) AS request_id;
  $$
);
```

**Publish Social Posts (every 15 minutes):**

```sql
SELECT cron.schedule(
  'publish-social-posts',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/publish-social-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  ) AS request_id;
  $$
);
```

---

### **Phase 5: Frontend Deployment (15 phút)**

#### 5.1 Build Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

#### 5.2 Deploy to Netlify/Vercel

**Netlify:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Configure environment variables in Netlify dashboard
```

**Vercel:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### 5.3 Configure Environment Variables

In Netlify/Vercel Dashboard, add all variables from `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY` or `VITE_ANTHROPIC_API_KEY`
- `VITE_RESEND_API_KEY`
- Social media tokens (if using)

---

### **Phase 6: Enable Authentication (5 phút)**

#### 6.1 Configure Auth Providers

Go to Supabase Dashboard > Authentication > Providers:

**Enable Email (Magic Link):**

- Enable Email provider
- Enable "Confirm email"
- Set redirect URLs:
  - Site URL: `https://yourdomain.com`
  - Redirect URLs: `https://yourdomain.com/**`

**Optional: Enable OAuth:**

- Google
- GitHub
- LinkedIn

#### 6.2 Configure Email Templates

Go to Authentication > Email Templates:

- Customize magic link email
- Customize confirmation email
- Add your branding

---

### **Phase 7: Testing & Verification (20 phút)**

#### 7.1 Test Authentication

1. Visit `https://yourdomain.com/automation`
2. Click "Sign In"
3. Enter email
4. Check email for magic link
5. Click link → Should sign in

#### 7.2 Test AI Agent

1. Sign in to dashboard
2. Navigate to "Content Writer Agent"
3. Click "Manual Trigger"
4. Provide test contact ID
5. Check activity logs for success
6. Verify content in queue

#### 7.3 Test Email Automation

1. Create test email in content queue
2. Wait for cron job (or trigger manually)
3. Check email received
4. Verify log in activity_logs

#### 7.4 Test Social Media

1. Create social post in queue
2. Wait for cron job
3. Verify post on LinkedIn/Facebook
4. Check activity logs

---

## 🔐 Security Checklist

### Database Security

- ✅ RLS enabled on all tables
- ✅ Production policies active (no anon access)
- ✅ Service role key secured in secrets
- ✅ No sensitive data in client code

### API Keys

- ✅ All keys in environment variables
- ✅ `.env` in `.gitignore`
- ✅ No keys committed to git
- ✅ Separate keys for dev/prod

### Authentication

- ✅ Magic link enabled
- ✅ Email confirmation required
- ✅ Proper redirect URLs configured
- ✅ Session management working

---

## 📊 Monitoring Setup

### 7.1 Setup Alerts

**Supabase Dashboard > Settings > Alerts:**

- Database usage > 80%
- API requests > 100k/day
- Edge function errors > 10/hour

### 7.2 Log Monitoring

```sql
-- Check for errors in last hour
SELECT * FROM activity_logs 
WHERE status = 'error' 
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check agent health
SELECT 
  name,
  status,
  total_runs,
  successful_runs,
  ROUND((successful_runs::float / NULLIF(total_runs, 0) * 100), 2) as success_rate
FROM ai_agents
ORDER BY total_runs DESC;
```

### 7.3 Cost Monitoring

**OpenAI:**

- Dashboard: <https://platform.openai.com/usage>
- Set spending limits

**Resend:**

- Dashboard: <https://resend.com/dashboard>
- Monitor email quota

**Supabase:**

- Dashboard: Project Settings > Billing
- Monitor database size, bandwidth

---

## 🐛 Troubleshooting

### Issue: "No AI API keys configured"

**Solution:**

```bash
# Verify environment variables are set
echo $VITE_OPENAI_API_KEY
echo $VITE_ANTHROPIC_API_KEY

# Rebuild application
npm run build

# Redeploy
```

### Issue: "Email not sending"

**Solution:**

1. Check Resend API key is valid
2. Verify domain is configured in Resend
3. Check Edge Function logs:

   ```bash
   supabase functions logs send-scheduled-emails
   ```

### Issue: "Authentication redirects to wrong URL"

**Solution:**

1. Supabase Dashboard > Authentication > URL Configuration
2. Update Site URL and Redirect URLs
3. Redeploy application

### Issue: "RLS blocking queries"

**Solution:**

```sql
-- Check current policies
SELECT * FROM pg_policies 
WHERE tablename = 'ai_agents';

-- Verify user is authenticated
SELECT auth.uid();

-- Check if migration applied
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '20251016000001';
```

---

## 💰 Cost Estimates

### Monthly Costs (Moderate Usage)

**Infrastructure:**

- Supabase Free Tier: $0
- Netlify/Vercel Free Tier: $0

**APIs:**

- OpenAI (100 requests/day): ~$30-50
- Resend (1000 emails/month): $0 (free tier)
- Total: **$30-50/month**

**Upgrade Thresholds:**

- Supabase Pro: $25/month (when > 500MB DB or > 2GB bandwidth)
- Resend Pro: $20/month (when > 3000 emails)
- OpenAI: Usage-based (set limits to control costs)

---

## 🎉 Post-Deployment

### Enable Auto-Triggering

```sql
-- Create database trigger for new contacts
CREATE TRIGGER on_new_contact_trigger_agent
AFTER INSERT ON contacts
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://your-project.supabase.co/functions/v1/trigger-content-writer',
  'POST',
  '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}',
  '1000'
);
```

### Monitor Performance

- Set up weekly reports
- Review success rates
- Optimize AI prompts
- Adjust agent configurations

### Scale Up

- Add more agents
- Implement multi-step workflows
- A/B test content
- Add analytics dashboard

---

## 📚 Resources

- **Supabase Docs:** <https://supabase.com/docs>
- **OpenAI API:** <https://platform.openai.com/docs>
- **Resend Docs:** <https://resend.com/docs>
- **LinkedIn API:** <https://docs.microsoft.com/en-us/linkedin/>

---

## ✅ Deployment Complete

Your AI Automation system is now:

- ✅ Running in production
- ✅ Secured with authentication
- ✅ Auto-triggering workflows
- ✅ Sending real emails
- ✅ Publishing to social media
- ✅ Monitoring and logging all activities

**Next Steps:**

1. Monitor system for 24 hours
2. Review activity logs
3. Optimize AI prompts based on results
4. Add custom agents as needed
5. Scale based on usage

---

**Need Help?** Check activity logs and Edge Function logs for debugging.
