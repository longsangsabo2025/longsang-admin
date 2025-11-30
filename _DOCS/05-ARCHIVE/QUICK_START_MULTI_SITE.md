# 🚀 QUICK START - Multi-Site SEO Management

## ⚡ **5-MINUTE SETUP**

### **Step 1: Deploy Database (2 min)**

```bash
# Open Supabase SQL Editor
https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql

# Copy & Run:
scripts/setup-seo-database.sql

# Expected: 6 tables created ✅
```

### **Step 2: Add First Website (1 min)**

```bash
node scripts/deploy-multi-site-foundation.mjs
# → Follow prompts
# → SABO ARENA added automatically ✅
```

### **Step 3: Verify (1 min)**

```bash
node scripts/multi-site-manager.mjs
# → Choose "Xem tất cả websites"
# → Should see: SABO ARENA ✅
```

### **Step 4: Setup Google (3 min)**

```
1. Go to: https://search.google.com/search-console/
2. Add: saboarena.com
3. Verify ownership
4. Add service account: automation-bot-102@long-sang-automation.iam.gserviceaccount.com
5. Grant: Owner permission ✅
```

### **Step 5: Test Automation (2 min)**

```bash
node scripts/multi-site-daily-automation.mjs
# → Should fetch data from Google ✅
# → Should record to database ✅
```

---

## 📝 **DAILY COMMANDS**

### **View All Websites**

```bash
node scripts/multi-site-manager.mjs
# → Option 1: Xem tất cả websites
```

### **Add New Website**

```bash
node scripts/multi-site-manager.mjs
# → Option 2: Thêm website mới
# → Enter: Name, URL
# → Auto-index: Yes
```

### **View Statistics**

```bash
node scripts/multi-site-manager.mjs
# → Option 3: Xem thống kê
```

### **Run Daily Automation**

```bash
node scripts/multi-site-daily-automation.mjs
```

---

## 🗂️ **KEY FILES**

### **Database**

```
scripts/setup-seo-database.sql          # Schema (run once)
```

### **API Layer**

```
src/lib/seo-api.ts                      # All API functions
```

### **CLI Tools**

```
scripts/multi-site-manager.mjs          # Interactive manager
scripts/multi-site-daily-automation.mjs # Daily automation
scripts/deploy-multi-site-foundation.mjs # Initial setup
```

### **UI Components**

```
src/components/seo/DomainManagement.tsx # Domain management UI
```

### **Documentation**

```
MULTI_SITE_SEO_COMPLETE.md              # Complete guide
MULTI_SITE_SEO_FOUNDATION.md            # Architecture guide
```

---

## 🎯 **COMMON TASKS**

### **Add Client Website**

```bash
$ node scripts/multi-site-manager.mjs

? Bạn muốn làm gì? Thêm website mới

? Tên website: Client XYZ
? URL: https://clientxyz.com
? Bật tự động indexing? Yes

✅ Đã thêm website: Client XYZ

Next steps:
1. Verify trong Google Search Console
2. Add service account
3. Generate sitemap
4. Run automation
```

### **Check Website Status**

```bash
$ node scripts/multi-site-manager.mjs

? Bạn muốn làm gì? Xem thống kê

📊 Tổng quan:
• Tổng số websites: 5
• Websites active: 4
• Tổng URLs: 2,450
• URLs indexed: 1,890 (77%)
```

### **Disable Website**

```bash
$ node scripts/multi-site-manager.mjs

? Bạn muốn làm gì? Bật/tắt website

? Chọn website: Client ABC (✅ Active)

✅ Đã tắt website: Client ABC
```

---

## 📊 **DATABASE QUERIES**

### **Get All Websites**

```sql
SELECT * FROM seo_domains ORDER BY created_at DESC;
```

### **Get Website Stats**

```sql
SELECT 
  name,
  url,
  total_urls,
  indexed_urls,
  ROUND((indexed_urls::float / NULLIF(total_urls, 0) * 100)::numeric, 2) as progress
FROM seo_domains
WHERE enabled = true;
```

### **Get Pending URLs**

```sql
SELECT 
  d.name,
  COUNT(*) as pending_count
FROM seo_indexing_queue q
JOIN seo_domains d ON d.id = q.domain_id
WHERE q.status = 'pending'
GROUP BY d.name;
```

### **Get Analytics Summary**

```sql
SELECT 
  d.name,
  SUM(a.impressions) as total_impressions,
  SUM(a.clicks) as total_clicks
FROM seo_analytics a
JOIN seo_domains d ON d.id = a.domain_id
WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.name
ORDER BY total_clicks DESC;
```

---

## 🔧 **TROUBLESHOOTING**

### **Error: "seo_domains does not exist"**

```bash
# Solution: Deploy database schema
# Open: https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql
# Run: scripts/setup-seo-database.sql
```

### **Error: "GOOGLE_SERVICE_ACCOUNT_JSON not found"**

```bash
# Solution: Check .env file
# Verify: GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### **Error: "Permission denied"**

```bash
# Solution: Add service account to Google Search Console
# Account: automation-bot-102@long-sang-automation.iam.gserviceaccount.com
# Role: Owner
```

### **No data in automation**

```bash
# Possible causes:
# 1. Website not verified in Google Search Console
# 2. Service account not added
# 3. Website too new (< 24 hours)
# 4. No traffic to website yet
```

---

## 🎯 **PRODUCTION CHECKLIST**

### **Database**

- [ ] Run setup-seo-database.sql
- [ ] Verify 6 tables created
- [ ] Test connection

### **Initial Website**

- [ ] Add SABO ARENA
- [ ] Verify in database
- [ ] Setup Google Search Console

### **Automation**

- [ ] Test manual run
- [ ] Schedule with cron/GitHub Actions
- [ ] Monitor logs

### **Documentation**

- [ ] Read MULTI_SITE_SEO_COMPLETE.md
- [ ] Understand architecture
- [ ] Know troubleshooting steps

---

## 📞 **SUPPORT**

### **Commands Not Working?**

```bash
# Check Node.js version (should be 18+)
node --version

# Install dependencies
npm install

# Check environment variables
cat .env | grep SUPABASE
```

### **Need Help?**

1. Check documentation: `MULTI_SITE_SEO_COMPLETE.md`
2. View logs in terminal
3. Check Supabase dashboard for errors
4. Verify Google Search Console setup

---

## ✅ **SUCCESS INDICATORS**

You know it's working when:

1. ✅ `node scripts/multi-site-manager.mjs` shows websites
2. ✅ Database has records in `seo_domains` table
3. ✅ `node scripts/multi-site-daily-automation.mjs` completes without errors
4. ✅ `seo_analytics` table gets new records daily
5. ✅ Google Search Console shows service account as Owner

---

## 🚀 **READY TO SCALE!**

**Current Status:** PRODUCTION READY ✅  
**Can Manage:** UNLIMITED websites  
**From:** One central dashboard  
**With:** Complete automation  

**Start adding websites now! 🎯**
