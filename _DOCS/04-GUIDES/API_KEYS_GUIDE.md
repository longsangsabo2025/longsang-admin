# 🔐 API Keys Setup Guide

## Quick Setup (5 minutes)

Run the automated script:

```powershell
.\add-api-keys.ps1
```

Or add manually using commands below.

---

## 1️⃣ AI Provider (Required)

### Option A: OpenAI (Recommended)

**Get Key:** https://platform.openai.com/api-keys

**Add to Supabase:**

```powershell
supabase secrets set OPENAI_API_KEY=sk-your-actual-key --project-ref diexsbzqwsbpilsymnfb
```

**Cost:** ~$0.10/100 blog posts (GPT-4o-mini)

---

### Option B: Anthropic Claude

**Get Key:** https://console.anthropic.com/settings/keys

**Add to Supabase:**

```powershell
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-actual-key --project-ref diexsbzqwsbpilsymnfb
```

**Cost:** ~$0.15/100 blog posts (Claude 3.5 Sonnet)

---

## 2️⃣ Email Provider (Required)

### Option A: Resend (Recommended)

**Get Key:** https://resend.com/api-keys

**Free Tier:** 3,000 emails/month

**Add to Supabase:**

```powershell
supabase secrets set RESEND_API_KEY=re-your-actual-key --project-ref diexsbzqwsbpilsymnfb
```

---

### Option B: SendGrid

**Get Key:** https://app.sendgrid.com/settings/api_keys

**Free Tier:** 100 emails/day

**Add to Supabase:**

```powershell
supabase secrets set SENDGRID_API_KEY=SG.your-actual-key --project-ref diexsbzqwsbpilsymnfb
```

---

## 3️⃣ LinkedIn (Optional)

### Get Access Token

**Step 1:** Create LinkedIn App

- Go to: https://www.linkedin.com/developers/apps
- Click "Create app"
- Fill in app details
- Enable "Share on LinkedIn" permission

**Step 2:** Generate Access Token

- Go to "Auth" tab
- Copy "Access Token" (or generate OAuth token)
- Token expires in 60 days (needs refresh)

**Step 3:** Add to Supabase

```powershell
supabase secrets set LINKEDIN_ACCESS_TOKEN=your-token --project-ref diexsbzqwsbpilsymnfb
```

### Get User ID (Required)

```bash
curl -X GET "https://api.linkedin.com/v2/userinfo" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Copy the `sub` field (your LinkedIn user ID).

**Full Guide:** https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication

---

## 4️⃣ Facebook (Optional)

### Get Access Token & Page ID

**Step 1:** Create Facebook App

- Go to: https://developers.facebook.com/apps
- Create app → "Business" type
- Add "Facebook Login" product

**Step 2:** Get Access Token

- Go to: https://developers.facebook.com/tools/explorer/
- Select your app
- Get Token → "Get Page Access Token"
- Select your page
- Copy the token

**Step 3:** Get Page ID

- Go to your Facebook Page
- Click "About" → "Page Info"
- Copy the Page ID

Or use Graph API:

```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_USER_TOKEN"
```

**Step 4:** Add to Supabase

```powershell
supabase secrets set FACEBOOK_ACCESS_TOKEN=your-token --project-ref diexsbzqwsbpilsymnfb
supabase secrets set FACEBOOK_PAGE_ID=your-page-id --project-ref diexsbzqwsbpilsymnfb
```

**Token Types:**

- User Token: Expires in 60 days
- Page Token: Can be permanent (request `pages_read_engagement`, `pages_manage_posts`)

**Full Guide:** https://developers.facebook.com/docs/pages/

---

## Verify Setup

### List all secrets:

```powershell
supabase secrets list --project-ref diexsbzqwsbpilsymnfb
```

### View in Dashboard:

https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/settings/functions

Click any function → "Secrets" tab

---

## Test After Setup

### 1. Test Contact Form → Blog Generation

```sql
-- Run in SQL Editor
INSERT INTO contacts (name, email, message, phone)
VALUES ('Test', 'test@example.com', 'I need AI automation help', '123456789');

-- Wait 5 seconds, then check:
SELECT * FROM content_queue ORDER BY created_at DESC LIMIT 1;
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1;
```

### 2. Test Email Sending

```sql
-- Add a test email to queue
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
  '{"recipient":"your@email.com","subject":"Test from LongSang"}'::jsonb
);

-- Wait 10 minutes (next cron run), then check:
SELECT * FROM content_queue WHERE content_type='email' ORDER BY updated_at DESC LIMIT 1;
SELECT * FROM activity_logs WHERE action='email_sent' ORDER BY created_at DESC LIMIT 1;
```

### 3. Monitor Logs

https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/logs/edge-functions

Look for:

- ✅ Status 200 = Success
- ❌ Status 500 = Error (check logs for details)

---

## Cost Summary

### Free Tier (Recommended):

- OpenAI GPT-4o-mini: ~$0.10/100 blogs
- Resend: 3,000 emails/month FREE
- LinkedIn: FREE (no API costs)
- Facebook: FREE (no API costs)

### Your Estimated Cost:

- 50 contacts/month × $0.001 = **$0.05/month**
- 100 emails/month = **FREE**
- 50 social posts/month = **FREE**

**Total:** ~**$0.05/month** 🎉

---

## Troubleshooting

### Error: "Invalid API Key"

- Check key format (OpenAI: `sk-...`, Claude: `sk-ant-...`)
- Verify key has correct permissions
- Check if key is expired

### Error: "Rate limit exceeded"

- OpenAI: $5 minimum credit required
- LinkedIn: 100 requests/day limit
- Facebook: 200 requests/hour limit

### Error: "Secret not found"

- Run `supabase secrets list` to verify
- May need to redeploy functions: `.\deploy-edge-functions.ps1`

### Edge Function not triggering

- Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name='on_contact_submitted';`
- View logs: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/logs/edge-functions
- Test manually: `curl -X POST https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/trigger-content-writer`

---

## Security Notes

⚠️ **Never commit API keys to git!**

- Keys are stored securely in Supabase
- Only accessible by Edge Functions
- Not visible in client-side code
- Can be rotated anytime

✅ **Best Practices:**

- Rotate keys every 90 days
- Use least-privilege permissions
- Monitor usage in provider dashboards
- Set spending limits on AI providers

---

Created: 2025-11-17
Updated: Ready for keys 🔐
