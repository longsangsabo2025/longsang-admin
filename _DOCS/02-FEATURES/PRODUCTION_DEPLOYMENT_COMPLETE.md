# 🚀 PRODUCTION DEPLOYMENT GUIDE

## Complete Checklist for Going Live

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables

Verify all required environment variables in `.env`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# OpenAI API Keys
OPENAI_API_KEY=sk-proj-ga-hzByLUC6...
OPENAI_ADMIN_API_KEY=sk-admin-...

# Optional: Email Providers
RESEND_API_KEY=re_xxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxx

# Optional: Social Media
LINKEDIN_ACCESS_TOKEN=AQVxxxxxxxxx
FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxx
FACEBOOK_PAGE_ID=123456789

# Optional: Analytics
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxx
```

---

## 📊 DATABASE SETUP

### Step 1: Verify All Migrations

```bash
# Run migrations to ensure database is up to date
node scripts/run-migrations-pg.mjs
```

**Expected Output:**

```
✅ Connected!
📋 Found 15 migration files
✅ SUCCESS (for new migrations)
✅ Database is ready!
```

**Verify 30 Tables Exist:**

- `ai_agents` (with category column)
- `agent_budgets` (with enforcement)
- `budget_alerts` (for notifications)
- `cost_analytics` (real-time tracking)
- `api_keys_vault` (secure storage)
- `activity_logs`, `content_queue`, `automation_triggers`
- `email_templates`, `analytics_events`
- All other supporting tables

### Step 2: Verify Database Functions

```sql
-- Test budget enforcement
SELECT check_agent_budget('agent-id-here');

-- Test cost tracking
SELECT track_agent_cost('agent-id', 'gpt-4o-mini', 1000, 0.002, 'generate_content');

-- Test threshold alerts
SELECT check_budget_threshold('agent-id');
```

---

## 🔑 SUPABASE SECRETS CONFIGURATION

### Critical Secrets (REQUIRED)

```bash
# Navigate to project directory
cd d:/0.APP/1510/long-sang-forge

# Set OpenAI API Key (REQUIRED)
npx supabase secrets set OPENAI_API_KEY="sk-proj-ga-hzByLUC6..."

# Optional: Claude AI
npx supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
```

### Email Provider Secrets (Choose ONE)

```bash
# Option A: Resend (Recommended)
npx supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"

# Option B: SendGrid
npx supabase secrets set SENDGRID_API_KEY="SG.xxxxxxxxx"
```

### Social Media Secrets (Optional)

```bash
# LinkedIn
npx supabase secrets set LINKEDIN_ACCESS_TOKEN="AQVxxxxxxxxx"

# Facebook
npx supabase secrets set FACEBOOK_ACCESS_TOKEN="EAAxxxxxxxxx"
npx supabase secrets set FACEBOOK_PAGE_ID="123456789"
```

### Verify Secrets

```bash
npx supabase secrets list
```

---

## 🔧 EDGE FUNCTIONS DEPLOYMENT

### Deploy All Functions

```bash
# Function 1: Content Writer with AI
npx supabase functions deploy trigger-content-writer

# Function 2: Email Sender
npx supabase functions deploy send-scheduled-emails

# Function 3: Social Media Publisher
npx supabase functions deploy publish-social-posts
```

**Expected Output:**

```
Deployed Functions on project diexsbzqwsbpilsymnfb: [function-name]
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/...
```

### Verify Deployments

Visit Supabase Dashboard → Edge Functions → Check all 3 functions are active.

---

## 🎨 FRONTEND DEPLOYMENT

### Build for Production

```bash
# Build optimized production bundle
npm run build
```

**Expected Output:**

```
✓ 3029 modules transformed.
dist/index.html        1.61 kB
dist/assets/*.css     93.22 kB
dist/assets/*.js    1,419.86 kB
✓ built in 4.34s
```

### Deploy Options

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Option C: Supabase Storage (Static Hosting)

```bash
# Upload to Supabase Storage
npx supabase storage upload public dist/
```

---

## 🔐 SECURITY CONFIGURATION

### 1. Supabase RLS Policies

**Verify Row Level Security is enabled on ALL tables:**

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**All tables should show `rowsecurity = true`**

### 2. Authentication Setup

**Enable Email Auth:**

1. Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Configure email templates
4. Set redirect URLs

**Optional: OAuth Providers:**

- Google
- GitHub
- Facebook

### 3. API Rate Limiting

Configure in Supabase Dashboard → Settings → API:

- Request limit: 100 requests/second
- Burst limit: 200 requests

---

## ⚙️ AGENT CONFIGURATION

### Step 1: Create First Agent

Visit `https://yourdomain.com/automation`

1. Click "Create New Agent"
2. **Select Category:** website
3. **Choose Type:** content_writer
4. **Set Name:** "Production Content Writer"
5. **Configure:**
   - AI Model: gpt-4o-mini (cost-effective)
   - Daily Budget: $5
   - Monthly Budget: $100
   - Auto-pause: ON

### Step 2: Configure All Settings

Click "Configure All Settings" on agent detail page:

**General Tab:**

- ✅ AI Model: gpt-4o-mini
- ✅ Auto-Publish: OFF (require approval)
- ✅ Require Approval: ON

**Email Tab:**

- Provider: Resend
- From Email: <noreply@yourdomain.com>
- From Name: Your Company

**Budget Tab:**

- Daily Limit: $5
- Monthly Limit: $100
- Auto-Pause: ON

**Schedule Tab:**

- Enable: YES
- Frequency: Daily
- Time: 09:00

### Step 3: Test Agent

1. Click "Manual Trigger"
2. Monitor Activity Logs
3. Check Content Queue
4. Review & Approve content
5. Verify publishing works

---

## 📧 EMAIL CONFIGURATION

### Resend Setup

1. Sign up at <https://resend.com>
2. Add & verify your domain
3. Create API key
4. Set in Supabase secrets:

   ```bash
   npx supabase secrets set RESEND_API_KEY="re_xxx"
   ```

5. Update agent config → from_email

### DNS Records

Add these TXT records to your domain:

```
_resend.[your-domain]    TXT    "resend-verification-code"
```

---

## 📱 SOCIAL MEDIA SETUP

### LinkedIn

1. Create LinkedIn App at <https://developer.linkedin.com>
2. OAuth 2.0 Credentials → Get Access Token
3. Permissions needed: `w_member_social`, `r_liteprofile`
4. Set token:

   ```bash
   npx supabase secrets set LINKEDIN_ACCESS_TOKEN="AQVxxx"
   ```

### Facebook

1. Create Facebook App at <https://developers.facebook.com>
2. Get Page Access Token (doesn't expire)
3. Get Page ID from Facebook Page settings
4. Set tokens:

   ```bash
   npx supabase secrets set FACEBOOK_ACCESS_TOKEN="EAAxxx"
   npx supabase secrets set FACEBOOK_PAGE_ID="123456789"
   ```

---

## 💰 BUDGET MONITORING

### Daily Checks

Visit `/analytics` dashboard to monitor:

- Total spending today
- Budget utilization %
- Agent-wise costs
- Top spending agents

### Alerts Setup

1. Go to `/settings`
2. Notifications tab
3. Enable Email Notifications
4. Set notification email
5. Optional: Webhook for Slack

### Budget Thresholds

Automatic alerts at:

- 50% of budget
- 75% of budget
- 90% of budget
- 100% (auto-pause)

---

## 🧪 TESTING CHECKLIST

### Before Going Live

- [ ] Create test agent
- [ ] Configure all settings
- [ ] Run manual trigger
- [ ] Content generates successfully
- [ ] Review modal works
- [ ] Approve content
- [ ] Email sends (if configured)
- [ ] Social post publishes (if configured)
- [ ] Activity logs record correctly
- [ ] Budget tracking updates
- [ ] Budget limits enforce correctly
- [ ] Notifications appear
- [ ] Agent pauses when budget exceeded

### Load Testing

```bash
# Test with 10 agents running simultaneously
# Monitor for:
- Database performance
- Edge Function execution time
- API rate limits
- Budget calculation accuracy
```

---

## 📚 USER TRAINING

### Admin Quick Start

1. **Dashboard Overview:** `/automation`
   - View all agents
   - Check budget status
   - Monitor activity logs

2. **Create Agent:** Click "+ Create Agent"
   - Choose category & type
   - Name & describe
   - Set initial status

3. **Configure Agent:** Click "Configure All Settings"
   - General settings
   - Email/Social setup
   - Budget limits
   - Schedule

4. **Review Content:** Content Queue section
   - Click "Review" on pending items
   - Edit if needed
   - Approve or Reject

5. **Monitor Performance:** `/analytics`
   - Cost breakdown
   - Usage statistics
   - Budget alerts

---

## 🔧 TROUBLESHOOTING

### Issue: Agent Not Running

**Check:**

1. Agent status is "active" (not paused)
2. Budget not exceeded
3. Schedule configured correctly
4. API keys set in Supabase secrets

**Fix:**

```bash
# Verify secrets
npx supabase secrets list

# Check Edge Function logs
npx supabase functions logs trigger-content-writer
```

### Issue: Email Not Sending

**Check:**

1. RESEND_API_KEY set correctly
2. Domain verified in Resend
3. from_email matches verified domain

**Fix:**

```bash
# Test email manually
curl https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/send-scheduled-emails \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### Issue: Social Post Fails

**Check:**

1. Token not expired (LinkedIn tokens expire)
2. Permissions granted
3. Page ID correct (Facebook)

**Fix:**

- Regenerate tokens
- Update in Supabase secrets
- Test with manual trigger

### Issue: Budget Not Tracking

**Check:**

1. Database function exists: `track_agent_cost`
2. Edge Functions call the function
3. Triggers are active

**Fix:**

```sql
-- Verify function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%budget%';

-- Test manually
SELECT track_agent_cost('agent-id', 'gpt-4o-mini', 1000, 0.002, 'test');
```

---

## 📞 SUPPORT & MAINTENANCE

### Daily Tasks

- [ ] Check dashboard for errors
- [ ] Review budget utilization
- [ ] Approve pending content
- [ ] Monitor agent performance

### Weekly Tasks

- [ ] Review analytics
- [ ] Check spending trends
- [ ] Optimize agent configs
- [ ] Rotate API keys (security)

### Monthly Tasks

- [ ] Full system audit
- [ ] Update dependencies
- [ ] Review user feedback
- [ ] Optimize budgets

---

## 🎉 LAUNCH CHECKLIST

Final verification before announcing:

- [ ] All Edge Functions deployed
- [ ] Database migrations complete
- [ ] Supabase secrets configured
- [ ] Frontend deployed & accessible
- [ ] Domain/DNS configured
- [ ] SSL certificate active
- [ ] Email sending works
- [ ] Social posting works
- [ ] Budget enforcement active
- [ ] Notifications working
- [ ] Test agent runs successfully
- [ ] Analytics tracking correctly
- [ ] Admin settings accessible
- [ ] Documentation complete
- [ ] User training complete

---

## 📊 MONITORING URLS

After deployment, bookmark these:

- **Dashboard:** `https://yourdomain.com/automation`
- **Analytics:** `https://yourdomain.com/analytics`
- **Settings:** `https://yourdomain.com/settings`
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb`
- **Edge Functions:** `https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/functions`

---

## 🚀 YOU'RE READY TO LAUNCH

The system is fully configured and production-ready. All automation workflows are operational, budget enforcement is active, and admin has complete control via UI. No coding required for daily operations! 🎉
