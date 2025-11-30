# 🚀 SEO MANAGEMENT CENTER - DEPLOYMENT GUIDE

## ✅ Hoàn Thành

Hệ thống SEO Management Center đã được xây dựng hoàn chỉnh với:

### 1. Frontend UI ✅

- **AdminSEOCenter Page** - Dashboard chính với 6 tabs
- **DomainManagement** - Quản lý domains (CRUD operations)
- **IndexingMonitor** - Theo dõi realtime indexing status  
- **SitemapGenerator** - Quản lý sitemaps
- **KeywordTracker** - Theo dõi keyword rankings
- **SEOSettings** - Cấu hình Google/Bing API
- **SEOAnalytics** - Analytics dashboard

### 2. Backend API ✅

- **seo-api.ts** - Complete API functions cho:
  - Domain management (getDomains, createDomain, updateDomain, deleteDomain)
  - Indexing queue (getIndexingQueue, addToIndexingQueue, updateIndexingStatus)
  - Keywords (getKeywords, addKeyword, updateKeywordPosition)
  - SEO Settings (getSEOSettings, updateSEOSettings)
  - Sitemaps (getSitemaps, upsertSitemap)
  - Stats & Analytics

### 3. Auto-indexing Service ✅

- **auto-indexing/index.ts** - Supabase Edge Function
  - Tự động submit URLs vào Google Indexing API
  - Tự động submit URLs vào Bing Webmaster API
  - Retry logic cho failed URLs
  - Chạy mỗi 5 phút hoặc trigger manual

### 4. Database Schema ✅

- **setup-seo-database.sql** - Complete SQL script với:
  - 6 tables (domains, queue, keywords, analytics, settings, sitemaps)
  - Row Level Security (RLS) policies
  - Auto-update triggers
  - Performance indexes
  - Foreign key relationships

---

## 📋 Deployment Steps

### Step 1: Create Database Tables

**Option A: Via Supabase Dashboard (Recommended)**

1. Mở Supabase Dashboard: <https://app.supabase.com>
2. Chọn project `long-sang-forge`
3. Vào **SQL Editor** (sidebar)
4. Click **New Query**
5. Copy toàn bộ nội dung từ `scripts/setup-seo-database.sql`
6. Paste vào SQL Editor
7. Click **Run** (hoặc Ctrl+Enter)
8. Đợi ~30 giây để tạo tables, indexes, triggers
9. Kiểm tra output: `SEO Management System tables created successfully! ✅`

**Option B: Via Supabase CLI**

```bash
cd d:\0.APP\1510\long-sang-forge

# Pull remote schema để sync
npx supabase db pull

# Chạy SQL script
npx supabase db execute -f scripts/setup-seo-database.sql
```

### Step 2: Update TypeScript Types

Sau khi tạo tables xong, cần generate TypeScript types:

```bash
cd d:\0.APP\1510\long-sang-forge

# Generate types from database
npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.gen.ts
```

Hoặc dùng Supabase Dashboard:

1. Vào **Project Settings** → **API**
2. Scroll xuống **Generated types**
3. Copy TypeScript types
4. Paste vào `src/integrations/supabase/types.gen.ts`

### Step 3: Deploy Auto-indexing Service

Deploy Edge Function lên Supabase:

```bash
cd d:\0.APP\1510\long-sang-forge

# Deploy function
npx supabase functions deploy auto-indexing

# Set environment variables
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{...your-json...}'
npx supabase secrets set BING_API_KEY='your-bing-api-key'
```

### Step 4: Setup Cron Job (Optional)

Để auto-indexing service chạy tự động mỗi 5 phút:

1. Vào Supabase Dashboard → **Database** → **Cron Jobs**
2. Click **New Cron Job**
3. Cấu hình:
   - Name: `auto-indexing-service`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - SQL:

   ```sql
   SELECT 
     net.http_post(
       url := 'https://your-project-id.supabase.co/functions/v1/auto-indexing',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY',
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     );
   ```

### Step 5: Test the System

1. **Khởi động dev server** (nếu chưa chạy):

```bash
cd d:\0.APP\1510\long-sang-forge
npm run dev
```

1. **Truy cập SEO Center**:
   - URL: <http://localhost:8080/admin/seo-center>
   - Login với admin account

2. **Test Domain Management**:
   - Click tab "Domains"
   - Click "Add Domain"
   - Nhập:
     - Domain Name: `Long Sang Org`
     - Domain URL: `https://longsang.org`
     - Google Service Account JSON: (paste JSON)
     - Bing API Key: (paste key)
   - Click "Add Domain"

3. **Test Indexing**:
   - Click tab "Indexing Monitor"
   - Sẽ thấy queue rỗng lúc đầu
   - Thử add URL vào queue (via API)
   - Refresh để xem status updates

4. **Test Sitemap**:
   - Click tab "Sitemap"
   - Click "Regenerate All"
   - Sẽ tạo sitemaps cho tất cả domains

---

## 🎯 Cách Sử Dụng

### Adding a New Domain

```typescript
import { createDomain } from '@/lib/seo-api';

const domain = await createDomain({
  name: 'Long Sang Org',
  url: 'https://longsang.org',
  google_service_account_json: { /* ... */ },
  bing_api_key: 'your-bing-api-key',
  auto_index: true
});
```

### Auto-submit URLs for Indexing

```typescript
import { addToIndexingQueue } from '@/lib/seo-api';

// Add URL to queue
await addToIndexingQueue({
  domain_id: 'domain-uuid',
  url: 'https://longsang.org/new-page',
  search_engine: 'google' // or 'bing'
});

// Service sẽ tự động submit trong vòng 5 phút
```

### Track Keyword Rankings

```typescript
import { addKeyword, updateKeywordPosition } from '@/lib/seo-api';

// Add keyword to track
const keyword = await addKeyword({
  domain_id: 'domain-uuid',
  keyword: 'long sang forge',
  target_url: 'https://longsang.org',
  volume: 'High',
  difficulty: '★★☆'
});

// Update position later
await updateKeywordPosition(keyword.id, 5); // Now at position 5
```

### Check Indexing Stats

```typescript
import { getIndexingStats } from '@/lib/seo-api';

const stats = await getIndexingStats('domain-uuid');
// Returns: { total: 100, pending: 10, crawling: 5, indexed: 80, failed: 5 }
```

---

## 🔧 Configuration

### Google Service Account Setup

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Tạo Service Account với quyền "Indexing API User"
3. Download JSON key file
4. Paste JSON vào SEO Settings hoặc Domain config

### Bing Webmaster API Setup

1. Đăng ký tại [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Verify domain ownership
3. Vào **Settings** → **API Access**
4. Copy API Key
5. Paste vào SEO Settings hoặc Domain config

---

## 📊 Database Structure

```
seo_domains              → Domains cần quản lý
  ├─ seo_indexing_queue  → URLs cần index
  ├─ seo_keywords        → Keywords tracking
  ├─ seo_analytics       → Daily analytics data
  └─ seo_sitemaps        → Sitemap files

seo_settings             → Global SEO settings
```

---

## 🚨 Troubleshooting

### Database Tables Not Created

**Vấn đề**: Lỗi "Table seo_domains does not exist"

**Giải pháp**:

1. Check xem SQL script đã chạy chưa
2. Vào Supabase Dashboard → Table Editor
3. Kiểm tra xem có tables `seo_*` không
4. Nếu không có, chạy lại `setup-seo-database.sql`

### TypeScript Errors in seo-api.ts

**Vấn đề**: Type errors khi call API functions

**Giải pháp**:

1. Generate lại types: `npx supabase gen types typescript`
2. Restart TypeScript server: Cmd+Shift+P → "Restart TS Server"
3. Restart dev server: `npm run dev`

### Auto-indexing Service Not Working

**Vấn đề**: URLs không được index tự động

**Giải pháp**:

1. Check Edge Function đã deploy chưa: `npx supabase functions list`
2. Check logs: `npx supabase functions logs auto-indexing`
3. Test manual: `curl https://your-project.supabase.co/functions/v1/auto-indexing`
4. Verify API credentials trong database

### Rate Limiting from Google/Bing

**Vấn đề**: Quá nhiều requests bị reject

**Giải pháp**:

1. Vào SEO Settings
2. Giảm `Daily Quota Google` xuống 100
3. Giảm `Daily Quota Bing` xuống 50
4. Service sẽ tự động throttle

---

## 📈 Next Steps

Sau khi deploy xong, bạn có thể:

1. ✅ **Add domains** - Thêm longsang.org và các domains khác
2. ✅ **Configure API keys** - Setup Google & Bing credentials
3. ✅ **Import URLs** - Bulk import URLs cần index
4. ✅ **Monitor progress** - Xem realtime indexing status
5. ✅ **Track keywords** - Add keywords để theo dõi rankings
6. ✅ **View analytics** - Xem traffic, CTR, impressions data

---

## 🎉 Hoàn Thành

Hệ thống SEO Management Center giờ đã sẵn sàng để:

- ✅ Quản lý multiple domains từ 1 giao diện
- ✅ Auto-submit URLs vào Google & Bing
- ✅ Theo dõi indexing status realtime
- ✅ Track keyword rankings
- ✅ Generate sitemaps tự động
- ✅ View SEO analytics

**Chúc bạn SEO thành công! 🚀**
