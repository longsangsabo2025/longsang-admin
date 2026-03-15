# =====================================================
# SUPABASE EMAIL AUTOMATION - SETUP GUIDE
# =====================================================
# Created: 2025-11-23
# Purpose: Complete email automation with Supabase
# =====================================================

## 📋 OVERVIEW

Simple email automation system using:
- ✅ Supabase Database (PostgreSQL)
- ✅ Edge Functions (Deno/TypeScript)
- ✅ Database Triggers (auto-send emails)
- ✅ Resend API (email delivery)
- ✅ 4 Email Templates (migrated from N8N)

## 🚀 QUICK START

### 1. Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
supabase init

# Link to existing project OR create new one
supabase link --project-ref YOUR_PROJECT_REF
# OR
supabase projects create longsang-admin
```

### 2. Run Database Migration

```bash
# Apply schema
supabase db push

# OR manually run migration
psql YOUR_DATABASE_URL -f supabase/migrations/001_email_automation_schema.sql
```

### 3. Deploy Edge Functions

```bash
# Deploy email sender
supabase functions deploy send-emails

# Deploy template seeder
supabase functions deploy seed-templates

# Set environment variables
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### 4. Seed Email Templates

```bash
# Call seed function once
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/seed-templates \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 5. Setup Cron Job (Auto-send emails)

```sql
-- In Supabase Dashboard → Database → Cron
-- Add new cron job to run every minute

SELECT cron.schedule(
  'send-pending-emails',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## 📧 USAGE EXAMPLES

### Send Welcome Email (Auto-triggered)

```sql
-- Just insert into user_registrations
-- Trigger will auto-add to email queue
INSERT INTO user_registrations (email, name, activation_token)
VALUES (
  'user@example.com',
  'John Doe',
  'abc123xyz'
);
```

### Send Custom Email (Manual)

```sql
-- Add to email queue
INSERT INTO email_queue (
  template_id,
  to_email,
  to_name,
  subject,
  variables
) VALUES (
  (SELECT id FROM email_templates WHERE template_type = 'newsletter' LIMIT 1),
  'subscriber@example.com',
  'Jane Smith',
  'Latest Updates from LongSang.org',
  '{
    "subscriber_name": "Jane Smith",
    "newsletter_title": "November 2025 Update",
    "main_content": "<p>Check out our latest features...</p>",
    "cta_text": "Read More",
    "cta_link": "https://longsang.org/blog",
    "company_name": "LongSang.org",
    "unsubscribe_link": "https://longsang.org/unsubscribe?email=subscriber@example.com",
    "social_links": "<a href=\"https://twitter.com/longsang\">Twitter</a>"
  }'::jsonb
);
```

### Via API (from frontend)

```javascript
// Using Supabase client
const { data, error } = await supabase
  .from('email_queue')
  .insert({
    template_id: 'uuid-of-template',
    to_email: 'user@example.com',
    to_name: 'User Name',
    subject: 'Your Subject',
    variables: {
      user_name: 'User Name',
      // ... other variables
    }
  })
```

## 🔧 CONFIGURATION

### Get Resend API Key

1. Go to https://resend.com
2. Create account
3. Get API key from dashboard
4. Add to Supabase secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_...
   ```

### Environment Variables

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_api_key
```

## 📊 DATABASE TABLES

### email_templates
- Stores 4 reusable templates
- Variables defined as JSONB array
- Can be updated via Supabase dashboard

### email_queue
- Pending/sending/sent/failed emails
- Auto-retry up to 3 times
- Processed by Edge Function

### email_logs
- Complete audit trail
- Tracks success/failures
- Includes provider message IDs

### user_registrations
- Example trigger table
- Auto-sends welcome email on insert

## 🔄 HOW IT WORKS

```
1. User Registration
   └─→ INSERT into user_registrations
        └─→ Database Trigger: trigger_welcome_email()
             └─→ INSERT into email_queue
                  └─→ Cron Job (every minute)
                       └─→ Edge Function: send-emails
                            └─→ Fetch template from email_templates
                                 └─→ Replace variables
                                      └─→ Send via Resend API
                                           └─→ Update email_queue status
                                                └─→ INSERT into email_logs
```

## 🧪 TESTING

### Test Welcome Email

```sql
-- Insert test user
INSERT INTO user_registrations (email, name, activation_token)
VALUES ('longsangsabo@gmail.com', 'Test User', 'test-token-123');

-- Check queue
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;

-- Check logs
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 5;
```

### Test Edge Function Directly

```bash
# Trigger email sender manually
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📱 FRONTEND INTEGRATION

### Send Order Confirmation

```javascript
// After successful payment
const sendOrderEmail = async (orderData) => {
  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      template_id: orderConfirmationTemplateId,
      to_email: orderData.customerEmail,
      to_name: orderData.customerName,
      subject: `Order Confirmation #${orderData.orderId}`,
      variables: {
        customer_name: orderData.customerName,
        order_id: orderData.orderId,
        order_date: new Date().toLocaleDateString(),
        items: orderData.items,
        total_amount: orderData.total,
        shipping_address: orderData.shippingAddress,
        tracking_link: `https://longsang.org/track/${orderData.orderId}`,
        company_name: 'LongSang.org',
        support_email: 'support@longsang.org'
      }
    })
  
  return { data, error }
}
```

### Send Password Reset

```javascript
const sendPasswordReset = async (email, resetToken) => {
  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      template_id: passwordResetTemplateId,
      to_email: email,
      subject: 'Reset Your Password - LongSang.org',
      variables: {
        user_name: email.split('@')[0],
        reset_link: `https://longsang.org/reset-password?token=${resetToken}`,
        expiry_time: '1 hour',
        company_name: 'LongSang.org',
        support_email: 'support@longsang.org'
      }
    })
  
  return { data, error }
}
```

## 🎯 ADVANTAGES OVER N8N

✅ **Simpler Setup** - No separate server to manage
✅ **Auto-scaling** - Supabase handles infrastructure
✅ **Database-first** - Natural triggers and relationships
✅ **Cost-effective** - Pay only for what you use
✅ **Built-in Auth** - Easy integration with Supabase Auth
✅ **Realtime** - Can listen to queue changes
✅ **Edge Functions** - Fast, globally distributed
✅ **No CORS issues** - Supabase handles it

## 🔒 SECURITY

- ✅ Service Role Key only in Edge Functions
- ✅ Row Level Security (RLS) on tables
- ✅ Anon key safe for frontend
- ✅ Email validation before sending
- ✅ Rate limiting via Supabase

## 📚 NEXT STEPS

1. ✅ Create Supabase project
2. ✅ Run migration (database schema)
3. ✅ Deploy Edge Functions
4. ✅ Seed email templates
5. ✅ Setup cron job for auto-send
6. ✅ Test with sample data
7. ✅ Integrate with frontend

## 🆘 TROUBLESHOOTING

### Emails not sending?
- Check email_queue status
- Check email_logs for errors
- Verify Resend API key
- Check cron job is running

### Template not found?
- Run seed-templates function
- Check email_templates table
- Verify template_type matches

### Variables not replacing?
- Check variable names match template
- Verify JSONB format in email_queue
- Check Edge Function logs

## 🌐 USEFUL LINKS

- Supabase Dashboard: https://app.supabase.com
- Resend Dashboard: https://resend.com/emails
- Edge Functions Docs: https://supabase.com/docs/guides/functions
- Cron Jobs: https://supabase.com/docs/guides/database/extensions/pg_cron

---

**Migration Complete!** 🎉
From N8N → Supabase (simpler, faster, better)
