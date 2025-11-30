# 🚀 DEPLOYMENT GUIDE - SEO Optimization Features

## ⚡ Quick Start

Để deploy các tính năng SEO mới, làm theo các bước sau:

---

## 1️⃣ **DATABASE MIGRATION**

### **Option A: Sử dụng Supabase Dashboard (Recommended)**

1. Mở [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy nội dung file `supabase/migrations/20251112_web_vitals_metrics.sql`
5. Paste vào SQL Editor và click **Run**

### **Option B: Sử dụng Supabase CLI**

```bash
# Nếu chưa cài Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push migration
supabase db push
```

### **Option C: Chạy SQL trực tiếp**

```sql
-- Copy và paste vào Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS web_vitals_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(10) NOT NULL CHECK (metric_name IN ('LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP')),
  metric_value DECIMAL(10, 2) NOT NULL,
  rating VARCHAR(20) CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  page_url VARCHAR(500) NOT NULL,
  user_agent TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_url ON web_vitals_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_web_vitals_recorded_at ON web_vitals_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals_metrics(rating);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_metric ON web_vitals_metrics(page_url, metric_name, recorded_at DESC);

ALTER TABLE web_vitals_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert web vitals" ON web_vitals_metrics
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Allow select web vitals" ON web_vitals_metrics
  FOR SELECT TO authenticated USING (true);
```

✅ **Verify:**

```sql
SELECT * FROM web_vitals_metrics LIMIT 1;
```

---

## 2️⃣ **DEPLOY CODE**

### **Frontend Changes:**

```bash
# Build the app
npm run build

# Deploy to your hosting (Vercel/Netlify/etc)
# Example for Vercel:
vercel --prod
```

### **API Changes:**

Nếu bạn deploy API riêng, đảm bảo file này có mặt:

- `api/routes/analytics/web-vitals.js`

---

## 3️⃣ **GITHUB ACTIONS SETUP**

### **Add Secrets to GitHub:**

1. Vào GitHub Repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Thêm các secrets sau:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### **Test Workflow:**

1. Vào **Actions** tab trên GitHub
2. Chọn workflow **SEO Automation Daily Tasks**
3. Click **Run workflow** → **Run workflow**
4. Đợi và xem kết quả

---

## 4️⃣ **VERIFY EVERYTHING WORKS**

### **Check Web Vitals:**

1. Deploy app lên production
2. Mở site trên browser
3. Mở DevTools Console (F12)
4. Reload page
5. Xem logs: `✅ Core Web Vitals tracking initialized`
6. Navigate qua các pages
7. Check database:

```sql
SELECT 
  page_url,
  metric_name,
  metric_value,
  rating,
  recorded_at
FROM web_vitals_metrics
ORDER BY recorded_at DESC
LIMIT 20;
```

### **Check Image Optimization:**

1. Mở site
2. Inspect một image component
3. Verify:
   - ✅ Has `loading="lazy"` attribute
   - ✅ Has proper `width` and `height`
   - ✅ Has `srcset` for responsive
   - ✅ Alt text present

### **Check Sitemap:**

```bash
# Generate sitemap locally
npm run seo:generate-sitemap

# Check file
cat public/sitemap.xml
```

### **Check GitHub Actions:**

1. Wait for scheduled run (2 AM UTC daily)
2. Or trigger manually
3. Check workflow logs
4. Verify sitemap was updated

---

## 5️⃣ **MONITORING**

### **Daily:**

- Check GitHub Actions run status
- Review Web Vitals dashboard
- Monitor errors in logs

### **Weekly:**

- Review SEO performance report
- Check keyword rankings
- Analyze top pages

### **Monthly:**

- Full SEO audit
- Content performance review
- Strategy adjustments

---

## 🐛 **TROUBLESHOOTING**

### **Web Vitals not tracking:**

```bash
# Check if library installed
npm list web-vitals

# Reinstall if needed
npm install web-vitals

# Check if initWebVitals() is called in main.tsx
```

### **Database errors:**

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'web_vitals_metrics';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'web_vitals_metrics';
```

### **GitHub Actions failing:**

1. Check secrets are set correctly
2. Review workflow logs
3. Verify Supabase credentials
4. Test scripts locally first:

```bash
npm run seo:analyze
npm run seo:monitor
```

---

## 📊 **SUCCESS METRICS**

### **After 1 Week:**

- ✅ Web Vitals data collecting
- ✅ GitHub Actions running daily
- ✅ Sitemap auto-updating
- ✅ Images loading optimally

### **After 1 Month:**

- ✅ Core Web Vitals improving
- ✅ SEO scores trending up
- ✅ Organic traffic increasing
- ✅ Content published consistently

---

## 🎯 **NEXT ACTIONS**

1. **Immediate:**
   - [ ] Deploy database migration
   - [ ] Deploy frontend code
   - [ ] Setup GitHub secrets
   - [ ] Test web vitals tracking

2. **This Week:**
   - [ ] Monitor first data collection
   - [ ] Verify GitHub Actions runs
   - [ ] Write first 2-3 blog posts
   - [ ] Check Core Web Vitals scores

3. **This Month:**
   - [ ] Publish 12-16 content pieces
   - [ ] Optimize low-scoring pages
   - [ ] Build backlink strategy
   - [ ] Review and adjust

---

## 📚 **RESOURCES**

- [Web Vitals Documentation](https://web.dev/vitals/)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Supabase Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [Content Calendar](./CONTENT_CALENDAR_2025.md)
- [SEO Strategy](./SEO_STRATEGY_2025.md)

---

**Ready to deploy? Let's go! 🚀**

If you need help, review:

- `SEO_OPTIMIZATION_COMPLETE_NOV12.md` - What was done
- `CONTENT_CALENDAR_2025.md` - Content strategy
- `SEO_STRATEGY_2025.md` - Overall SEO plan
