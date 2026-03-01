# 🚀 CLOUD DEPLOYMENT GUIDE — 24/7 Automation
> Không cần máy local chạy 24/7. Supabase + Vercel + Render lo hết.

---

## TỔNG QUAN

```
┌───────────────────────────────────────────────────────────┐
│  SUPABASE (Brain)          │  VERCEL (Web + Cron)        │
│                             │                              │
│  3 Edge Functions           │  9 deployed projects         │
│  3 pg_cron scheduled jobs   │  4 cron routes               │
│  3 automation tables        │  Auto-deploy from Git        │
│  3 utility views            │                              │
├─────────────────────────────┼──────────────────────────────┤
│  RENDER (Worker)            │  TELEGRAM (Monitoring)       │
│                             │                              │
│  YouTube Pipeline Docker    │  Health alerts               │
│  Node 20 + ffmpeg + yt-dlp  │  Pipeline status             │
│  HTTP trigger from Supabase │  Daily digest                │
└─────────────────────────────┴──────────────────────────────┘
```

---

## STEP 1: Deploy Supabase Edge Functions (5 phút)

### Prerequisites
```powershell
# Cài Supabase CLI nếu chưa có
npm install -g supabase

# Login
supabase login
```

### Deploy 3 Edge Functions
```powershell
cd "d:\0.PROJECTS\00-MASTER-ADMIN\apps\admin"

# Deploy từng function
supabase functions deploy ecosystem-health-check --project-ref diexsbzqwsbpilsymnfb
supabase functions deploy youtube-pipeline-trigger --project-ref diexsbzqwsbpilsymnfb
supabase functions deploy daily-content-scheduler --project-ref diexsbzqwsbpilsymnfb
```

### Set Edge Function Secrets
Vào **Supabase Dashboard** → **Edge Functions** → **Secrets**:

| Secret | Value | Mô tả |
|--------|-------|--------|
| `TELEGRAM_BOT_TOKEN` | `bot123456:ABC...` | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | `-100xxxxxxxxxx` | Chat ID nhận alert |
| `GEMINI_API_KEY` | `AIza...` | Google Gemini API key |
| `PIPELINE_API_URL` | `https://youtube-pipeline-xxx.onrender.com` | Render service URL (also reads RENDER_PIPELINE_URL as fallback) |
| `SUPABASE_URL` | (auto-set) | Đã có sẵn |
| `SUPABASE_SERVICE_ROLE_KEY` | (auto-set) | Đã có sẵn |

---

## STEP 2: Run pg_cron SQL Migration (2 phút)

### Mở Supabase SQL Editor
1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy nội dung file `supabase/migrations/20260225_cloud_automation_cron.sql`
3. Click **Run**

### Kiểm tra kết quả
```sql
-- Verify tables
SELECT * FROM ecosystem_health_logs LIMIT 5;
SELECT * FROM pipeline_queue LIMIT 5;
SELECT * FROM content_calendar LIMIT 5;

-- Verify cron jobs
SELECT * FROM cron.job;
-- Phải thấy 3 jobs:
--   ecosystem-health-check (every 15 min)
--   daily-content-scheduler (8:00 AM VN = 1:00 UTC)
--   process-email-queue (every 1 min)
```

### Set pg_cron Config
```sql
-- Trong SQL Editor, chạy:
ALTER DATABASE postgres SET app.supabase_url = 'https://diexsbzqwsbpilsymnfb.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '<YOUR_SERVICE_ROLE_KEY>';
```

### Run Fix Migration
Also run `20260225_cloud_automation_fix.sql` to add missing columns to `pipeline_runs` and `content_calendar`:
```
Copy nội dung supabase/migrations/20260225_cloud_automation_fix.sql → Run trong SQL Editor.
```

### Run Views Migration
Copy nội dung `supabase/migrations/20260225_cloud_automation_views.sql` → Run trong SQL Editor.

---

## STEP 3: Deploy VT Dream Homes with Cron (2 phút)

```powershell
cd "d:\0.PROJECTS\01-MAIN-PRODUCTS\vungtau-dream-homes"
vercel --prod
```

### Set Vercel Environment Variables
Vào **Vercel Dashboard** → **vungtau-dream-homes** → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `CRON_SECRET` | Random string (dùng `openssl rand -hex 32`) |

### Verify Cron Routes
Sau khi deploy, kiểm tra:
- `https://vungtauland.store/api/cron/health-report` — returns JSON health status
- `https://vungtauland.store/api/cron/seo-check` — returns JSON SEO report

Vercel sẽ tự chạy cron theo lịch trong `vercel.json`.

---

## STEP 4: Deploy YouTube Pipeline to Render (5 phút)

### Option A: Via Render Dashboard (Recommended)
1. Push `youtube-agent-crew/` lên GitHub repository
2. Vào **Render Dashboard** → **New** → **Blueprint**
3. Connect GitHub repo
4. Render tự đọc `render.yaml` → tạo Web Service
5. Set environment variables trong Render Dashboard

### Option B: Via render.yaml
```yaml
# render.yaml đã config sẵn:
services:
  - type: web           # Changed from worker → web for healthCheckPath support
    name: youtube-pipeline
    runtime: docker
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    plan: starter  # $7/month, 512MB RAM
    autoDeploy: true
```

> **Note:** `type: web` (not `type: worker`) — Render needs a web service to expose the HTTP endpoint and health check path.

### Render Environment Variables

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `SUPABASE_URL` | `https://diexsbzqwsbpilsymnfb.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token |
| `TELEGRAM_CHAT_ID` | Admin chat ID |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth2 client |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth2 secret |
| `YOUTUBE_REFRESH_TOKEN` | YouTube OAuth2 refresh token |
| `NODE_ENV` | `production` |
| `PORT` | `3001` | (Render sets automatically for web services) |

### Lấy Render URL
Sau khi deploy, Render sẽ cho URL dạng: `https://youtube-pipeline-xxxx.onrender.com`
→ Copy URL này → Set vào Supabase Edge Function secret `PIPELINE_API_URL` (fallback `RENDER_PIPELINE_URL` cũng được)

---

## STEP 5: Verify Everything Works (5 phút)

### Test Health Check
```bash
# Trigger manually
curl -X POST "https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/ecosystem-health-check" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json"
```

### Test Pipeline Trigger
```bash
curl -X POST "https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/youtube-pipeline-trigger" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"topic": "test topic", "auto": false}'
```

### Test Content Scheduler
```bash
curl -X POST "https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/daily-content-scheduler" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json"
```

### Check Cron Jobs Running
```sql
-- Trong Supabase SQL Editor
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Check Telegram Alerts
Mở Telegram → Bot sẽ gửi:
- ✅ Health check results mỗi 15 phút
- 🎬 Pipeline trigger notifications
- 📅 Daily content schedule at 8AM VN

---

## MONITORING & TROUBLESHOOTING

### View Health Logs
```sql
SELECT * FROM v_latest_health;
-- Shows latest health status for each product
```

### View Pipeline Stats
```sql
SELECT * FROM v_pipeline_stats;
-- Shows success rate, avg duration, total cost
```

### View Upcoming Content
```sql
SELECT * FROM v_content_calendar_upcoming;
-- Shows next 7 days of scheduled content
```

### Common Issues

| Issue | Fix |
|-------|-----|
| Edge Function timeout | Increase `--no-verify-jwt` or check RENDER_PIPELINE_URL |
| pg_cron not firing | Check `SELECT * FROM cron.job` — verify status = 'active' |
| Telegram not receiving | Verify BOT_TOKEN and CHAT_ID secrets |
| Render 502 | Check Render Dashboard logs — likely OOM or startup crash |
| Vercel cron not running | Verify cron syntax in vercel.json, check Vercel Dashboard → Cron Jobs |

---

## COST ESTIMATE

| Service | Plan | Cost/month |
|---------|------|-----------|
| Supabase (Free tier) | 500K Edge Function invocations, 500MB DB | **$0** |
| Vercel (Hobby) | Unlimited deploys, cron jobs | **$0** |
| Render (Starter) | 512MB RAM, auto-deploy | **$7** |
| **TOTAL** | | **$7/month** |

> Với $7/tháng, toàn bộ empire chạy 24/7 không cần mở máy local.

---

## FLOW: Daily Automation Cycle

```
1:00 UTC (8:00 AM VN)
  └─ pg_cron fires daily-content-scheduler Edge Function
      └─ Reads content_calendar table
      └─ If no topic scheduled → AI generates via Gemini
      └─ Calls youtube-pipeline-trigger Edge Function
          └─ POST to Render youtube-pipeline-worker
              └─ Runs 7-stage pipeline (Harvest→Brain→Script→Voice→Visual→Video→Publish)
              └─ Uploads to YouTube
              └─ Telegram notification: "🎬 Video published!"
          └─ Stores result in pipeline_runs table

Every 15 min
  └─ pg_cron fires ecosystem-health-check Edge Function
      └─ Pings: Admin, VT Homes, Sabo Arena, Forge, AINewbie
      └─ Stores in ecosystem_health_logs
      └─ If any DOWN → Telegram alert: "🔴 [product] is DOWN!"

Every Monday 1:00 UTC
  └─ Vercel cron fires VT Homes /api/cron/seo-check
      └─ Checks sitemap, OG tags, 404 errors
      └─ Stores report

Every day 1:00 UTC  
  └─ Vercel cron fires VT Homes /api/cron/health-report
      └─ Heartbeat + visitor stats
```

---

*Last updated: 2026-02-25 — BATCH-003 Cloud Automation Complete*
