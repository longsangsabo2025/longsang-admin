# 🚀 SUPABASE EMAIL AUTOMATION - QUICK SETUP

## 📋 BƯớC 1: TẠO SUPABASE PROJECT

1. Vào https://supabase.com/dashboard
2. Click **"New Project"**
3. Điền thông tin:
   - **Name**: `longsang-admin`
   - **Database Password**: Tạo password mạnh (LƯU LẠI!)
   - **Region**: `Southeast Asia (Singapore)`
4. Click **"Create new project"** → Đợi ~2 phút

## 🔑 BƯỚC 2: LẤY API KEYS & DATABASE URL

### API Keys
1. Vào **Settings** → **API**
2. Copy 3 thông tin này:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database URL (Transaction Pooler)
1. Vào **Settings** → **Database**
2. Scroll xuống **"Connection string"**
3. Chọn tab **"Transaction"** (Session pooler)
4. Copy **Connection string** (với password bạn đã tạo)

```
postgresql://postgres.YOUR_REF:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 📧 BƯỚC 3: TẠO RESEND API KEY

1. Vào https://resend.com/login
2. Đăng ký/đăng nhập
3. Vào **API Keys** → **Create API Key**
4. Name: `LongSang Admin`
5. Permission: **Sending access**
6. Copy API key: `re_...`

⚠️ **Lưu ý**: Resend free tier cho phép:
- ✅ 100 emails/day
- ✅ 1 verified domain hoặc dùng `onboarding@resend.dev`

## 🗄️ BƯỚC 4: CHẠY DATABASE MIGRATION

### Option A: Via Supabase SQL Editor (Recommended)

1. Vào Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy toàn bộ file này:
   ```
   D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase\migrations\001_email_automation_schema.sql
   ```
4. Paste vào SQL Editor
5. Click **"Run"** (hoặc Ctrl+Enter)
6. ✅ Kiểm tra: **Database** → **Tables** → Should see 4 tables:
   - `email_templates`
   - `email_queue`
   - `email_logs`
   - `user_registrations`

### Option B: Via psql (Advanced)

```powershell
$env:PGPASSWORD="your_db_password"
psql "postgresql://postgres.YOUR_REF:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f migrations/001_email_automation_schema.sql
```

## ⚡ BƯỚC 5: DEPLOY EDGE FUNCTIONS

### 5.1. Install Supabase CLI (One-time)

```powershell
# Via Scoop (Recommended for Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR via NPX (no install needed)
# Just use: npx supabase ...
```

### 5.2. Login to Supabase

```powershell
supabase login
# Browser sẽ mở → Authorize CLI
```

### 5.3. Link Project

```powershell
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase

# Get Project Ref from Dashboard URL: https://supabase.com/dashboard/project/YOUR_REF
supabase link --project-ref YOUR_PROJECT_REF
```

### 5.4. Set Environment Secrets

```powershell
# Set Resend API Key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Verify
supabase secrets list
```

### 5.5. Deploy Functions

```powershell
# Deploy email sender
supabase functions deploy send-emails

# Deploy template seeder
supabase functions deploy seed-templates
```

## 📧 BƯỚC 6: SEED EMAIL TEMPLATES

Sau khi deploy xong, call seed function:

```powershell
# Get your SUPABASE_URL and ANON_KEY from Step 2

curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/seed-templates" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json"
```

✅ Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Email templates seeded successfully",
  "results": [
    {"template": "welcome-email", "success": true, "id": "..."},
    {"template": "order-confirmation", "success": true, "id": "..."},
    {"template": "password-reset", "success": true, "id": "..."},
    {"template": "newsletter", "success": true, "id": "..."}
  ]
}
```

## ⏰ BƯỚC 7: SETUP CRON JOB (Auto-send emails)

### 7.1. Enable pg_cron Extension

1. Vào **Database** → **Extensions**
2. Tìm `pg_cron`
3. Click **Enable**

### 7.2. Create Cron Job

1. Vào **SQL Editor** → **New query**
2. Paste SQL này (thay YOUR_PROJECT_REF và SERVICE_ROLE_KEY):

```sql
SELECT cron.schedule(
  'send-pending-emails',           -- Job name
  '* * * * *',                     -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

3. Click **Run**

### 7.3. Verify Cron Job

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## 🧪 BƯỚC 8: TEST EMAIL SYSTEM

### 8.1. Create .env file

```powershell
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase
Copy-Item .env.example .env
```

Edit `.env` với thông tin từ Bước 2:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
```

### 8.2. Install Dependencies

```powershell
npm install
```

### 8.3. Run Test

```powershell
node scripts/test-email.js
```

✅ Kết quả mong đợi:
- 4 emails được thêm vào queue
- Sau 1 phút, emails được gửi
- Check inbox: `longsangsabo@gmail.com`

## 🎯 BƯỚC 9: VERIFY TRONG DASHBOARD

### Check Email Queue
```sql
SELECT * FROM email_queue ORDER BY created_at DESC;
```

### Check Email Logs
```sql
SELECT * FROM email_logs ORDER BY sent_at DESC;
```

### Check Templates
```sql
SELECT id, name, template_type FROM email_templates;
```

## 🔧 TROUBLESHOOTING

### Lỗi: "Relation does not exist"
→ Chưa chạy migration. Quay lại Bước 4.

### Lỗi: "Function not found"
→ Chưa deploy Edge Functions. Quay lại Bước 5.

### Emails không gửi?
1. Check `email_queue` → status = 'pending'?
2. Check cron job đang chạy: `SELECT * FROM cron.job`
3. Check Edge Function logs: Dashboard → Edge Functions → send-emails → Logs
4. Check Resend dashboard: https://resend.com/emails

### Lỗi: "Invalid API key"
→ Check `RESEND_API_KEY` trong secrets: `supabase secrets list`

## 📱 TÍCH HỢP VỚI FRONTEND

### Send Welcome Email (Auto)
```javascript
// Chỉ cần insert vào user_registrations
const { data, error } = await supabase
  .from('user_registrations')
  .insert({
    email: 'user@example.com',
    name: 'John Doe',
    activation_token: crypto.randomUUID()
  })

// Trigger tự động thêm vào email_queue!
```

### Send Manual Email
```javascript
const { data, error } = await supabase
  .from('email_queue')
  .insert({
    template_id: 'get-from-email_templates-table',
    to_email: 'customer@example.com',
    to_name: 'Customer Name',
    subject: 'Your Subject',
    variables: {
      user_name: 'Customer Name',
      // ... other variables
    }
  })
```

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Tạo Supabase project
- [ ] Lấy API keys (ANON + SERVICE_ROLE)
- [ ] Lấy Database URL (Transaction pooler)
- [ ] Tạo Resend API key
- [ ] Chạy database migration (4 tables)
- [ ] Deploy Edge Functions (send-emails + seed-templates)
- [ ] Set Resend API key secret
- [ ] Seed email templates (4 templates)
- [ ] Enable pg_cron extension
- [ ] Create cron job (send emails every minute)
- [ ] Test với test-email.js
- [ ] Verify emails nhận được

## 🎉 DONE!

Hệ thống email automation đã sẵn sàng!

**Next steps:**
- Tích hợp vào frontend
- Customize email templates
- Monitor email logs
- Scale as needed (Supabase auto-scales!)

---

**Support:** Xem `README.md` để biết thêm chi tiết
