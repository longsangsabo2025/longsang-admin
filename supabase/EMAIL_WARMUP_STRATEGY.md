# ============================================
# EMAIL DOMAIN WARM-UP STRATEGY
# ============================================
# Để tránh vào spam khi gửi cho users mới

## 🎯 MỤC TIÊU
Build sender reputation cho longsang.org trong 2-4 tuần

## 📊 WARM-UP SCHEDULE

### Week 1: Start Slow (Days 1-7)
- **Day 1:** 10 emails/day
- **Day 2:** 20 emails/day
- **Day 3:** 40 emails/day
- **Day 4:** 80 emails/day
- **Day 5:** 150 emails/day
- **Day 6:** 250 emails/day
- **Day 7:** 400 emails/day

### Week 2: Scale Up (Days 8-14)
- **Day 8:** 600 emails/day
- **Day 9:** 900 emails/day
- **Day 10:** 1,200 emails/day
- **Day 11:** 1,500 emails/day
- **Day 12:** 1,800 emails/day
- **Day 13:** 2,200 emails/day
- **Day 14:** 2,500 emails/day

### Week 3+: Full Speed
- **Day 15+:** 3,000 emails/day (max capacity)

---

## ✅ BEST PRACTICES

### 1. Bắt đầu với Engaged Users
```sql
-- Gửi cho users có engagement cao trước
SELECT email FROM users 
WHERE last_active > NOW() - INTERVAL '30 days'
AND email_verified = true
ORDER BY engagement_score DESC
LIMIT 50;
```

### 2. Tránh Spam Triggers
**❌ TRÁNH:**
- Subject line toàn chữ HOA
- Nhiều dấu chấm than (!!!)
- Từ khóa spam: FREE, WIN, URGENT, CLICK NOW
- Too many links (>3-5 links)
- Large images as links

**✅ NÊN:**
- Subject line ngắn gọn, rõ ràng
- Personalization: "Hi {name}"
- Plain text + HTML balanced
- Include unsubscribe link
- Consistent sender name

### 3. Monitor Metrics
**Quan trọng:**
- **Open Rate:** >20% is good
- **Bounce Rate:** <2% is safe
- **Spam Complaint:** <0.1% is critical
- **Click Rate:** >2% shows engagement

### 4. Authentication Đầy Đủ
✅ SPF: Configured (send.longsang.org)
✅ DKIM: Configured (resend._domainkey)
✅ DMARC: Configured (quarantine policy)
⚠️ Recommendation: Change DMARC to p=none during warm-up

---

## 🔧 IMPLEMENTATION

### Option 1: Manual Rate Limiting (Recommended)
```javascript
// supabase/scripts/warm-up-sender.js
const WARMUP_SCHEDULE = {
  1: 10, 2: 20, 3: 40, 4: 80, 5: 150, 6: 250, 7: 400,
  8: 600, 9: 900, 10: 1200, 11: 1500, 12: 1800, 13: 2200, 14: 2500,
  15: 3000 // Day 15+: full speed
}

async function getDailyLimit() {
  const startDate = new Date('2025-11-23') // Domain verify date
  const today = new Date()
  const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1
  
  return WARMUP_SCHEDULE[daysSinceStart] || 3000
}
```

### Option 2: Use Warm-up Service
**Resend Pro** ($20/month):
- Automatic warm-up
- Shared IP pools with good reputation
- Better deliverability

### Option 3: Temporary Alternative
**Sử dụng Gmail SMTP** cho initial emails:
- Google's reputation = better inbox placement
- Limit: 500/day (free) or 2000/day (Workspace)
- Sau khi có 100+ users engaged → switch to longsang.org

---

## 📧 EMAIL CONTENT TIPS

### Welcome Email Template (High Engagement)
```html
Subject: Welcome to LongSang.org! 👋

Hi {name},

Thanks for signing up! I'm Long, and I'm excited to have you here.

Here's what you can do next:
→ [Complete your profile]
→ [Explore features]  
→ [Join our community]

Quick question: What brought you here today?

Best,
Long
LongSang.org

---
You're receiving this because you signed up at longsang.org
[Unsubscribe] | [Preferences]
```

**Why this works:**
- Personal tone (from founder)
- Clear call-to-action
- Asks question (encourages reply = good signal)
- Proper unsubscribe

---

## ⚡ QUICK WINS

### 1. Enable Reply-To
```javascript
// Edge Functions
{
  from: 'LongSang.org <noreply@longsang.org>',
  reply_to: 'longsangsabo@gmail.com', // ← Add this!
  to: [email]
}
```
**Why:** Replies improve sender reputation

### 2. Add List-Unsubscribe Header
```javascript
headers: {
  'List-Unsubscribe': '<mailto:unsubscribe@longsang.org?subject=unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
}
```

### 3. Segment by Engagement
```sql
-- Table: email_engagement
CREATE TABLE email_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  opens int DEFAULT 0,
  clicks int DEFAULT 0,
  last_opened timestamptz,
  spam_complaints int DEFAULT 0,
  engagement_score int GENERATED ALWAYS AS (
    opens * 2 + clicks * 5 - spam_complaints * 100
  ) STORED
);
```

---

## 🎯 TIMELINE TO INBOX

**Week 1:**
- 30-50% inbox placement
- Focus on engaged users
- Monitor feedback loops

**Week 2:**
- 60-80% inbox placement
- Gradually expand audience
- Maintain low complaint rate

**Week 3+:**
- 85-95% inbox placement
- Full volume
- Established reputation

---

## 🚨 WARNING SIGNS

**Stop immediately if:**
- Bounce rate >5%
- Spam complaint >0.5%
- Open rate <10%
- Many "this is spam" reports

**Action:** Pause, investigate, fix issues before continuing

---

## 📊 MONITORING DASHBOARD

```javascript
// Check daily stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE status = 'sent') as delivered,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'bounced') / COUNT(*), 2) as bounce_rate
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 💡 PRO TIP

**Sử dụng 2 domains:**
1. **Transactional** (longsang.org): Password resets, receipts, confirmations
2. **Marketing** (mail.longsang.org): Newsletters, promotions

Tách biệt để protect main domain reputation!

---

## 🎬 NEXT STEPS

1. ✅ Implement rate limiting (warm-up schedule)
2. ✅ Add reply-to and unsubscribe headers
3. ✅ Start with 10-20 most engaged users
4. ✅ Monitor metrics daily
5. ⏳ Gradually increase volume over 2-4 weeks
6. 🎯 After 4 weeks: Full 3,000/day with 90%+ inbox rate

---

**Bottom Line:**
Domain warm-up = tăng dần volume + focus on engagement = inbox placement tốt hơn ✅
