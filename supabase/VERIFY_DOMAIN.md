# =====================================================
# VERIFY LONGSANG.ORG WITH RESEND
# =====================================================
# Guide: https://resend.com/docs/dashboard/domains/introduction
# =====================================================

## 🌐 STEP 1: Add Domain to Resend

1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `longsang.org`
4. Click **"Add"**

## 📝 STEP 2: Get DNS Records

Resend will give you these records to add:

### SPF Record (TXT)
```
Name: @
Type: TXT
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM Records (3 records)
```
Name: resend._domainkey
Type: TXT
Value: [Resend will provide this - copy from dashboard]

Name: resend2._domainkey  
Type: TXT
Value: [Resend will provide this - copy from dashboard]

Name: resend3._domainkey
Type: TXT  
Value: [Resend will provide this - copy from dashboard]
```

## ☁️ STEP 3: Add to Cloudflare

Since you manage `longsang.org` via Cloudflare:

1. Go to: https://dash.cloudflare.com
2. Select `longsang.org` domain
3. Go to **DNS** → **Records**
4. Click **"Add record"** for each DNS record above

### Quick Commands (If you have Cloudflare API)

```powershell
# Set these from your .env.cloudflare
$ZONE_ID = "845966ad8db7c98b0e945bf5555eb94c"
$API_KEY = "564e46c5e5e128be154e1d25de7088aa11c51"
$EMAIL = "longsangsabo@gmail.com"

# Add SPF
$body = @{
    type = "TXT"
    name = "@"
    content = "v=spf1 include:_spf.resend.com ~all"
    ttl = 3600
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Method POST `
    -Headers @{
        "X-Auth-Email" = $EMAIL
        "X-Auth-Key" = $API_KEY
        "Content-Type" = "application/json"
    } `
    -Body $body

# Add DKIM records (get values from Resend dashboard first)
# Then repeat above with DKIM values
```

## ✅ STEP 4: Verify Domain

1. After adding DNS records to Cloudflare
2. Wait 5-10 minutes for DNS propagation
3. Go back to Resend dashboard
4. Click **"Verify"** button
5. Should see ✅ "Verified"

## 🧪 STEP 5: Update Supabase Functions

Once verified, update email sender to use your domain:

```typescript
// In send-email/index.ts and process-queue/index.ts
from: 'LongSang Admin <noreply@longsang.org>'  // ✅ Your domain!
```

Re-deploy:
```powershell
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase
npx supabase functions deploy send-email --project-ref diexsbzqwsbpilsymnfb
npx supabase functions deploy process-queue --project-ref diexsbzqwsbpilsymnfb
```

## 📧 Benefits of Using Your Domain

✅ **Professional**: `noreply@longsang.org` vs `onboarding@resend.dev`
✅ **Brand trust**: Recipients see your domain
✅ **Better deliverability**: Verified domain = less spam
✅ **No limits**: 3,000 emails/day (vs 100 with onboarding)
✅ **Custom emails**: Can use any prefix (support@, hello@, etc.)

## 🔍 Verify DNS Propagation

Check if DNS records are live:

```powershell
# Check SPF
nslookup -type=TXT longsang.org

# Check DKIM
nslookup -type=TXT resend._domainkey.longsang.org
```

## ⚠️ Common Issues

### Domain not verifying?
- Wait 10-15 minutes after adding DNS
- Check DNS records are correct (no typos)
- Ensure Proxy is OFF in Cloudflare (DNS only)

### Still using Cloudflare for email routing?
- ✅ You can use BOTH:
  - Cloudflare Email Routing for receiving (admin@, support@)
  - Resend for sending (noreply@, notifications@)

## 🎯 Quick Action Plan

1. ⏱️ **2 min**: Add domain to Resend → Get DNS records
2. ⏱️ **3 min**: Add DNS records to Cloudflare  
3. ⏱️ **10 min**: Wait for propagation
4. ⏱️ **1 min**: Verify in Resend dashboard
5. ⏱️ **2 min**: Update & redeploy functions

**Total: ~20 minutes to professional email! 🚀**

---

Bạn muốn tôi tạo script tự động add DNS vào Cloudflare không? 😊
