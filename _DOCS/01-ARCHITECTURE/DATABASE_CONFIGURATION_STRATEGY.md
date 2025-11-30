# 🗄️ DATABASE CONFIGURATION STRATEGY

## 📋 **QUYẾT ĐỊNH: SỬ DỤNG LONGSANG.ORG DATABASE**

### **🎯 SUPABASE PROJECT CHÍNH:**

- **Project ID**: `diexsbzqwsbpilsymnfb`
- **Domain**: `longsang.org`
- **Arena Subdomain**: `arena.longsang.org`

---

## 🔄 **MIGRATION PLAN**

### **Option 1: Subdomain Strategy (Recommended)**

```bash
# Setup DNS
arena.longsang.org -> longsang.org/arena
saboarena.com -> redirect to arena.longsang.org
```

### **Option 2: Domain Redirect**

```bash
# All SABO ARENA traffic redirects
saboarena.com -> longsang.org/arena
```

### **Option 3: Unified Branding**

```bash
# Rebrand as Long Sang Gaming Arena
longsang.org/gaming
longsang.org/arena
longsang.org/tournaments
```

---

## 📝 **UPDATE REQUIRED FILES**

### **1. Update Base URLs**

```typescript
// OLD
const baseUrl = 'https://saboarena.com';

// NEW  
const baseUrl = 'https://arena.longsang.org';
// OR
const baseUrl = 'https://longsang.org/arena';
```

### **2. Update SEO References**

- Schema markup URLs
- Canonical URLs  
- Open Graph URLs
- Twitter Card URLs
- Sitemap URLs

### **3. Update Database Tables**

- Ensure all SEO tables exist in longsang.org database
- Migrate any existing SABO ARENA data if needed

---

## 🚀 **IMPLEMENTATION STEPS**

### **Step 1: Verify Current Database**

```bash
# Check current Supabase connection
npm run supabase:status

# Verify project link
supabase projects list
```

### **Step 2: Update URLs in Code**

1. Update all `saboarena.com` references
2. Change to `arena.longsang.org` or `longsang.org/arena`
3. Update social media references

### **Step 3: Deploy SEO Schema**

```bash
# Deploy database changes
npm run deploy:db

# Deploy updated functions
npm run deploy:functions
```

### **Step 4: DNS Configuration**

1. Setup `arena.longsang.org` subdomain
2. Configure SSL certificates
3. Setup redirects from `saboarena.com`

---

## 📊 **BENEFITS OF LONGSANG.ORG DATABASE**

### **✅ Technical Benefits:**

- ✅ All SEO infrastructure already built
- ✅ Database schema complete with 8 SEO tables
- ✅ Supabase functions deployed and tested
- ✅ Migration files and seeds ready
- ✅ Automation scripts configured

### **✅ Business Benefits:**

- ✅ Unified brand ecosystem under LongSang
- ✅ Better SEO authority consolidation
- ✅ Simplified maintenance and ops
- ✅ Cost optimization (single Supabase project)
- ✅ Easier team management

### **✅ SEO Benefits:**

- ✅ Domain authority consolidation
- ✅ Better internal linking structure
- ✅ Unified content strategy
- ✅ Single sitemap management
- ✅ Consistent brand signals

---

## 🎯 **RECOMMENDED DOMAIN STRUCTURE**

```
longsang.org/
├── arena/          # SABO ARENA gaming platform
├── automation/     # AI automation services  
├── blog/          # Gaming & tech blog
├── tournaments/   # Gaming tournaments
├── agents/        # AI agents showcase
└── api/          # API endpoints & sitemaps
```

### **URL Examples:**

- Main Gaming: `longsang.org/arena`
- Tournaments: `longsang.org/tournaments`
- Blog: `longsang.org/blog`
- AI Agents: `longsang.org/agents`
- API: `longsang.org/api/sitemap.xml`

---

## 🔗 **SEO URL UPDATES NEEDED**

### **Files to Update:**

1. `/src/utils/schema-markup.ts` - Organization URLs
2. `/src/components/SEOHead.tsx` - Base URL references
3. `/supabase/functions/*/index.ts` - All function URLs
4. `/index.html` - Meta tags and canonical URLs
5. `/SEO_STRATEGY_2025.md` - Documentation URLs

### **Search & Replace:**

```bash
# Find all saboarena.com references
grep -r "saboarena.com" src/ supabase/

# Replace with longsang.org/arena
# Or arena.longsang.org
```

---

## ✅ **CONCLUSION**

**RECOMMENDATION: Use longsang.org database** with subdomain strategy:

1. **Primary**: `arena.longsang.org`
2. **Redirect**: `saboarena.com` -> `arena.longsang.org`
3. **Unified SEO**: All under LongSang brand authority
4. **Infrastructure**: Leverage existing complete SEO setup

This approach maximizes the SEO infrastructure we've built while maintaining brand flexibility.

---

**Next Steps:**

1. Confirm domain strategy preference
2. Update all URL references in code
3. Configure DNS and SSL
4. Deploy updated functions
5. Test SEO functionality
