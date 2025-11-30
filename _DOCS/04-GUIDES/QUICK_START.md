# 🚀 QUICK START - AI Automation System

## ⚡ TL;DR - Start in 5 Minutes

### **Prerequisites**

- ✅ Node.js 18+ installed
- ✅ Supabase CLI installed: `npm install -g supabase`
- ✅ Supabase account & project created

---

## 🔥 Option 1: Automatic Setup (Recommended)

### **Windows:**

```powershell
# Run the auto-deploy script
.\scripts\deploy-all.ps1
```

### **Mac/Linux:**

```bash
# Make script executable
chmod +x scripts/deploy-all.sh

# Run the auto-deploy script
./scripts/deploy-all.sh
```

**What it does:**

- ✅ Links Supabase project
- ✅ Applies all database migrations
- ✅ Configures Edge Function secrets
- ✅ Deploys all Edge Functions
- ✅ Builds frontend

---

## 🛠️ Option 2: Manual Setup

### **Step 1: Configure Environment**

Your `.env` is already configured! ✅

```env
VITE_SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 2: Install Dependencies**

```bash
npm install
```

### **Step 3: Link Supabase Project**

```bash
supabase link --project-ref diexsbzqwsbpilsymnfb
```

### **Step 4: Apply Database Migrations**

```bash
supabase db push
```

Or manually via Supabase Dashboard:

1. Go to <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql/new>
2. Copy & paste content from `setup-database.sql`
3. Click "Run"

### **Step 5: Enable Realtime (Important!)**

Go to: <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/database/replication>

Enable realtime for these tables:

- ✅ `ai_agents`
- ✅ `activity_logs`
- ✅ `content_queue`

### **Step 6: Deploy Edge Functions**

```bash
# Deploy all functions
supabase functions deploy trigger-content-writer
supabase functions deploy send-scheduled-emails
supabase functions deploy publish-social-posts
```

### **Step 7: Start Development Server**

```bash
npm run dev
```

Open: <http://localhost:5173>

---

## 🎯 Test the System

### **1. Test Authentication**

1. Go to <http://localhost:5173/automation>
2. Click "Sign In"
3. Enter your email
4. Check email for magic link
5. Click link → You're in! ✅

### **2. Test Content Writer Agent**

1. Sign in to dashboard
2. Click on "Content Writer Agent"
3. Click "Manual Trigger"
4. Enter test data:

   ```json
   {
     "contact_id": "test-123"
   }
   ```

5. Check Activity Logs for success ✅

### **3. Verify Database**

Go to: <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/editor>

Check tables:

```sql
-- Check agents
SELECT * FROM ai_agents;

-- Check activity logs
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;

-- Check content queue
SELECT * FROM content_queue;
```

---

## 🔑 Add API Keys (Optional but Recommended)

### **OpenAI (for Real AI)**

1. Get key: <https://platform.openai.com/api-keys>
2. Add to `.env`:

   ```env
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```

3. Restart dev server

### **Resend (for Email)**

1. Get key: <https://resend.com/api-keys>
2. Verify domain: <https://resend.com/domains>
3. Add to `.env`:

   ```env
   VITE_RESEND_API_KEY=re_your-key-here
   ```

### **LinkedIn (for Social Media)**

1. Create app: <https://www.linkedin.com/developers/apps>
2. Get OAuth token
3. Add to `.env`:

   ```env
   VITE_LINKEDIN_ACCESS_TOKEN=your-token-here
   ```

---

## 📊 System Status Check

### **Verify Everything Works:**

```bash
# 1. Check database connection
npm run dev
# Navigate to http://localhost:5173/automation
# If you see the dashboard → Database OK ✅

# 2. Check Edge Functions
supabase functions list
# Should show 3 functions ✅

# 3. Check real-time
# In dashboard, create an agent
# Should update instantly without refresh ✅
```

---

## 🐛 Troubleshooting

### **"No AI API keys configured"**

- Add `VITE_OPENAI_API_KEY` or `VITE_ANTHROPIC_API_KEY` to `.env`
- Restart dev server: `npm run dev`

### **"Authentication failed"**

- Check Supabase URL and keys in `.env`
- Verify email settings in Supabase Dashboard > Authentication

### **"Database connection error"**

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check network connection
- Try: `supabase db reset` then `supabase db push`

### **Edge Functions not working**

- Redeploy: `supabase functions deploy trigger-content-writer`
- Check logs: `supabase functions logs trigger-content-writer`
- Verify secrets: `supabase secrets list`

---

## 🎉 You're Ready

**System is now:**

- ✅ Connected to Supabase
- ✅ Database configured
- ✅ Real-time enabled
- ✅ Edge Functions deployed
- ✅ Authentication working

**Next Steps:**

1. 🎨 Customize agent configurations
2. 🤖 Add AI API keys for real generation
3. 📧 Setup email service
4. 📱 Connect social media
5. 🚀 Deploy to production (see `PRODUCTION_DEPLOYMENT_GUIDE.md`)

---

## 📚 Documentation

- **Full Setup:** `AUTOMATION_SETUP.md`
- **AI Integration:** `AI_INTEGRATION_GUIDE.md`
- **Production Deploy:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **System Overview:** `AUTOMATION_README.md`

---

## 🆘 Need Help?

**Check Logs:**

```bash
# Supabase logs
supabase functions logs trigger-content-writer

# Activity logs in dashboard
SELECT * FROM activity_logs 
WHERE status = 'error' 
ORDER BY created_at DESC;
```

**Common Issues:**

- Missing API keys → Add to `.env`
- RLS blocking queries → Apply migration `20251016000001_update_rls_production.sql`
- Real-time not working → Enable in Dashboard > Replication

---

**🌟 Happy Automating!**
