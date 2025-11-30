# ✅ Edge Functions Ready to Deploy!

## 📦 What's Created

I've created **3 Edge Functions** for full automation:

### 1. **trigger-content-writer**

📝 Auto-generates blog posts from contact form submissions

**Features:**

- ✅ Extracts topic from contact message
- ✅ Calls OpenAI/Claude to generate blog post
- ✅ Adds to content queue
- ✅ Logs activity
- ✅ Falls back if AI keys not configured

**Triggers:** Database INSERT on `contacts` table

---

### 2. **send-scheduled-emails**

📧 Sends scheduled emails from content queue

**Features:**

- ✅ Checks queue every 10 minutes (via cron)
- ✅ Sends via Resend or SendGrid
- ✅ Updates status
- ✅ Retry logic (3 attempts)
- ✅ Error logging

**Triggers:** Cron job (every 10 minutes)

---

### 3. **publish-social-posts**

📱 Publishes scheduled social media posts

**Features:**

- ✅ Checks queue every 15 minutes (via cron)
- ✅ Posts to LinkedIn & Facebook
- ✅ Multi-platform support
- ✅ Retry logic
- ✅ Success/failure tracking

**Triggers:** Cron job (every 15 minutes)

---

## 🚀 How to Deploy

### Option 1: Automated Script (Recommended)

```powershell
cd d:\PROJECTS\01-MAIN-PRODUCTS\long-sang-forge
.\deploy-edge-functions.ps1
```

**What it does:**

1. ✅ Checks Supabase CLI installed (installs if needed)
2. ✅ Loads environment variables from .env
3. ✅ Deploys all 3 functions
4. ✅ Sets secrets (API keys)
5. ✅ Shows deployment summary

---

### Option 2: Manual Deploy

If script fails, deploy manually:

```powershell
# Install Supabase CLI (if not installed)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Login
supabase login

# Deploy each function
supabase functions deploy trigger-content-writer --project-ref diexsbzqwsbpilsymnfb
supabase functions deploy send-scheduled-emails --project-ref diexsbzqwsbpilsymnfb
supabase functions deploy publish-social-posts --project-ref diexsbzqwsbpilsymnfb

# Set secrets
supabase secrets set \
  SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  OPENAI_API_KEY=sk-your-key \
  --project-ref diexsbzqwsbpilsymnfb
```

---

### Option 3: Via Supabase Dashboard (No CLI)

1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/functions
2. Click "Create a new function"
3. Copy code from `supabase/functions/[function-name]/index.ts`
4. Paste into editor
5. Click "Deploy"
6. Repeat for all 3 functions
7. Set secrets in Function Settings

---

## 🔐 Required Secrets (Environment Variables)

### Mandatory (Edge Functions won't work without these):

```env
SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI... (get from .env)
```

### AI Provider (at least 1 required for content generation):

```env
OPENAI_API_KEY=sk-your-key          # OR
ANTHROPIC_API_KEY=sk-ant-your-key   # OR both
```

### Email Provider (for send-scheduled-emails):

```env
RESEND_API_KEY=re_your-key          # Recommended
# OR
SENDGRID_API_KEY=SG.your-key
SENDGRID_FROM_EMAIL=noreply@longsang.org
```

### Social Media (for publish-social-posts):

```env
LINKEDIN_ACCESS_TOKEN=your-token
FACEBOOK_ACCESS_TOKEN=your-token
FACEBOOK_PAGE_ID=your-page-id
```

---

## ⏰ Setup Cron Jobs

After deploying, setup cron jobs in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/database/cron-jobs
2. Create 2 cron jobs:

### Cron Job 1: Send Emails

```sql
-- Name: send-scheduled-emails
-- Schedule: */10 * * * * (every 10 minutes)
SELECT net.http_post(
  url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/send-scheduled-emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  )
);
```

### Cron Job 2: Publish Social Posts

```sql
-- Name: publish-social-posts
-- Schedule: */15 * * * * (every 15 minutes)
SELECT net.http_post(
  url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/publish-social-posts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  )
);
```

---

## 🧪 Testing

### Test trigger-content-writer:

```sql
-- Insert a test contact
INSERT INTO contacts (name, email, message)
VALUES ('Test User', 'test@example.com', 'I need help with AI automation');

-- Check if content was added to queue
SELECT * FROM content_queue ORDER BY created_at DESC LIMIT 1;

-- Check activity logs
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1;
```

### Test send-scheduled-emails:

```sql
-- Insert scheduled email
INSERT INTO content_queue (
  title,
  content_type,
  status,
  scheduled_for,
  metadata
) VALUES (
  'Test Email',
  'email',
  'scheduled',
  NOW(),
  '{"recipient":"your-email@example.com","content":"Test email body"}'::jsonb
);

-- Manually trigger function
SELECT net.http_post(
  url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/send-scheduled-emails',
  headers := '{"Authorization":"Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
);
```

### Test publish-social-posts:

```sql
-- Insert scheduled post
INSERT INTO content_queue (
  title,
  content_type,
  status,
  scheduled_for,
  generated_content,
  metadata
) VALUES (
  'Test Social Post',
  'social_post',
  'scheduled',
  NOW(),
  'This is a test post from LongSang automation! #AI #Automation',
  '{"platforms":["linkedin"]}'::jsonb
);

-- Manually trigger function
SELECT net.http_post(
  url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/publish-social-posts',
  headers := '{"Authorization":"Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
);
```

---

## 🎯 Next Steps

1. ✅ **Deploy Edge Functions** (run `.\deploy-edge-functions.ps1`)
2. ✅ **Setup Cron Jobs** (in Supabase Dashboard)
3. ✅ **Setup Database Trigger** (for trigger-content-writer)
4. ✅ **Test End-to-End** (submit contact form → check content queue)
5. ✅ **Monitor Logs** (Supabase Dashboard → Edge Functions → Logs)

---

## 📊 Expected Results

### Before Edge Functions:

```
Contact form → Database → ❌ STOP (manual trigger needed)
```

### After Edge Functions:

```
Contact form → Database → ✅ Auto-trigger Edge Function
                        ↓
                    AI generates blog post
                        ↓
                    Auto-add to queue
                        ↓
                    Auto-publish (if scheduled)
                        ↓
                    24/7 AUTOMATION! 🎉
```

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb
- **Edge Functions:** https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/functions
- **Cron Jobs:** https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/database/cron-jobs
- **Secrets:** https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/settings/functions
- **Logs:** https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/logs/edge-functions

---

## 💰 Cost

**Edge Functions:**

- ✅ **FREE**: 500K invocations/month
- ✅ **FREE**: 400K GB-seconds/month
- Your usage: ~10K invocations/month = **$0/month** 💯

---

## 🚨 Troubleshooting

### Function not deploying?

- Check Supabase CLI installed: `supabase --version`
- Check logged in: `supabase projects list`
- Check project ID correct in .env

### Function deployed but not working?

- Check secrets set: Supabase Dashboard → Functions → Settings
- Check function logs: Dashboard → Edge Functions → Logs
- Check network requests in browser DevTools

### Cron jobs not running?

- Check pg_cron extension enabled: Dashboard → Database → Extensions
- Check cron job syntax correct
- Check function URL correct

---

**Created:** 2025-11-17
**Status:** ✅ Ready to deploy
**Impact:** 🚀 24/7 automation activated!
