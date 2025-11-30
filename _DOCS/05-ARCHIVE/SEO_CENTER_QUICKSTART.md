# ⚡ SEO CENTER - QUICK START

## 🎯 Bắt Đầu Ngay (5 Phút)

### Bước 1: Tạo Database Tables ⚡

**Via Supabase Dashboard** (Dễ nhất):

1. Mở: <https://app.supabase.com>
2. Chọn project **long-sang-forge**
3. Click **SQL Editor** (sidebar trái)
4. Click **New Query**
5. Copy toàn bộ file: `scripts/setup-seo-database.sql`
6. Paste vào editor
7. Click **RUN** ▶️
8. Đợi ~20 giây → Thấy "Success!" ✅

### Bước 2: Test Giao Diện 🖥️

```bash
cd d:\0.APP\1510\long-sang-forge
npm run dev
```

Truy cập: <http://localhost:8080/admin/seo-center>

### Bước 3: Thêm Domain Đầu Tiên 🌐

1. Click tab **"Domains"**
2. Click **"Add Domain"**
3. Điền thông tin:
   - **Name**: Long Sang Org
   - **URL**: <https://longsang.org>
   - **Google Service Account JSON**: (paste JSON key)
   - **Bing API Key**: (paste key từ Bing Webmaster)
4. Click **"Add Domain"** → Done! ✅

### Bước 4: Deploy Auto-indexing Service 🤖

```bash
cd d:\0.APP\1510\long-sang-forge

# Deploy Edge Function
npx supabase functions deploy auto-indexing

# Done! Service sẽ tự động index URLs mỗi 5 phút
```

---

## 📋 Files Đã Tạo

| File | Mục đích |
|------|----------|
| `src/pages/AdminSEOCenter.tsx` | Main dashboard với 6 tabs |
| `src/components/seo/DomainManagement.tsx` | Quản lý domains |
| `src/components/seo/IndexingMonitor.tsx` | Theo dõi indexing |
| `src/components/seo/SitemapGenerator.tsx` | Generate sitemaps |
| `src/components/seo/KeywordTracker.tsx` | Track keywords |
| `src/components/seo/SEOSettings.tsx` | Cấu hình API |
| `src/components/seo/SEOAnalytics.tsx` | Analytics |
| `src/lib/seo-api.ts` | API functions ⚠️ (đang có type errors, chờ tạo tables) |
| `scripts/setup-seo-database.sql` | SQL script tạo tables |
| `supabase/functions/auto-indexing/index.ts` | Auto-indexing service |

---

## ⚠️ Lưu Ý

### seo-api.ts đang có Type Errors

**Nguyên nhân**: Database tables chưa được tạo → TypeScript không biết table structure

**Giải pháp**:

1. Tạo tables bằng `setup-seo-database.sql` (Bước 1 ở trên)
2. Generate types:

   ```bash
   npx supabase gen types typescript --local > src/integrations/supabase/types.gen.ts
   ```

3. Restart dev server: `npm run dev`

Errors sẽ tự động mất khi tables được tạo! ✅

---

## 🎯 Tính Năng Chính

### ✅ Đã Hoàn Thành

1. **Domain Management**
   - Add/Edit/Delete domains
   - Enable/Disable auto-indexing
   - Configure API keys per domain

2. **Indexing Monitor**
   - Realtime status tracking (pending, crawling, indexed, failed)
   - Retry failed URLs
   - View indexing history

3. **Sitemap Generator**
   - Auto-generate sitemaps
   - Track sitemap stats
   - Download sitemap files

4. **Keyword Tracker**
   - Track keyword positions
   - Monitor ranking changes
   - View search volume & difficulty

5. **SEO Settings**
   - Global API configuration
   - Set daily quotas
   - Webhook integration

6. **Auto-indexing Service**
   - Submit URLs to Google Indexing API
   - Submit URLs to Bing Webmaster API
   - Automatic retry logic
   - Runs every 5 minutes

### 🔄 Workflow Tự Động

```
New URL → Added to Queue → Auto-indexing Service → Submit to Google/Bing 
→ Update Status → Track in Monitor → Done! ✅
```

---

## 🚀 Sử Dụng

### Add URLs to Index

```typescript
import { addToIndexingQueue } from '@/lib/seo-api';

await addToIndexingQueue({
  domain_id: 'your-domain-uuid',
  url: 'https://longsang.org/new-article',
  search_engine: 'google' // hoặc 'bing'
});
```

### Check Stats

```typescript
import { getIndexingStats } from '@/lib/seo-api';

const stats = await getIndexingStats();
// { total: 100, pending: 10, indexed: 85, failed: 5 }
```

### Track Keywords

```typescript
import { addKeyword } from '@/lib/seo-api';

await addKeyword({
  domain_id: 'domain-uuid',
  keyword: 'long sang forge',
  target_url: 'https://longsang.org'
});
```

---

## 📚 Full Documentation

Chi tiết đầy đủ: **SEO_CENTER_DEPLOYMENT.md**

---

## ✅ Checklist Deployment

- [ ] Tạo database tables (via SQL Editor)
- [ ] Generate TypeScript types
- [ ] Test giao diện (localhost:8080)
- [ ] Add domain đầu tiên
- [ ] Configure Google Service Account JSON
- [ ] Configure Bing API Key
- [ ] Deploy auto-indexing function
- [ ] Test submit 1 URL
- [ ] Verify indexing hoạt động
- [ ] Setup monitoring & alerts

---

## 🎉 Done

Hệ thống SEO Management Center hoàn chỉnh với:

- ✅ Multi-domain management
- ✅ Auto Google & Bing indexing
- ✅ Realtime monitoring
- ✅ Keyword tracking
- ✅ Sitemap generation
- ✅ SEO analytics

**Bắt đầu ngay từ Bước 1! 🚀**
