# ⚡ DEPLOY WEB VITALS TABLE - 2 PHÚT

## 🎯 Copy SQL này vào Supabase SQL Editor

**Link:** <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql>

---

## 📋 COPY SQL NÀY

```sql
-- Web Vitals Metrics Table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_url ON web_vitals_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_web_vitals_recorded_at ON web_vitals_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_metric ON web_vitals_metrics(page_url, metric_name, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE web_vitals_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: Allow insert for everyone, select for authenticated users
CREATE POLICY "Allow insert web vitals" ON web_vitals_metrics
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Allow select web vitals" ON web_vitals_metrics
  FOR SELECT TO authenticated USING (true);
```

---

## ✅ STEPS

1. **Mở link:** <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql>

2. **Click "New query"** hoặc "+ New query"

3. **Copy toàn bộ SQL ở trên** (từ CREATE TABLE đến USING (true);)

4. **Paste vào SQL Editor**

5. **Click "Run"** (hoặc Ctrl+Enter)

6. **Đợi 2-3 giây** → Thấy "Success! No rows returned"

7. **DONE!** ✅

---

## 🧪 VERIFY

Chạy lệnh này để kiểm tra:

```bash
node scripts/auto-deploy-web-vitals.mjs
```

Sẽ hiện: ✅ Table already exists!

---

## 🎉 HOÀN THÀNH

Sau khi có message "Table already exists", bạn đã sẵn sàng track Core Web Vitals!

**Time needed:** < 2 phút  
**Difficulty:** Cực dễ 😊
