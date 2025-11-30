# 📧 EMAIL ACCOUNTS & USE CASES

> **Tài liệu quản lý email accounts và phân bổ use cases**  
> Last Updated: 2025-11-23

---

## 📋 DANH SÁCH EMAIL ACCOUNTS

### 1️⃣ **longsangsabo@gmail.com** (PRIMARY)

**Loại:** Gmail Personal  
**Mục đích:** Main business email & SMTP sender  
**App Password:** ✅ Đã cấu hình (`qjycfpexpnbviuvt`)  
**Daily Limit:** 500 emails/day (Gmail free tier)

#### 🎯 USE CASES:

**A. SMTP Sender (Đã setup)**
- ✅ Gửi email tự động qua Gmail SMTP
- ✅ Notification emails
- ✅ Transactional emails (password reset, welcome, etc.)
- ✅ Weekly analytics reports
- ✅ System alerts

**B. Business Communication**
- Nhận email từ clients/partners
- Reply to business inquiries
- Professional correspondence

**C. Service Registrations**
- Domain registrations (longsang.org)
- Hosting accounts
- Third-party services (Vercel, Supabase, etc.)

**D. Admin Functions**
- Account recovery email
- Security notifications
- Service updates

---

### 2️⃣ **longsangsabo1@gmail.com** (TESTING)

**Loại:** Gmail Personal  
**Mục đích:** Test recipient & development  
**App Password:** ❌ Chưa cần  
**Daily Limit:** N/A (chỉ nhận, không gửi)

#### 🎯 USE CASES:

**A. Email Testing**
- ✅ Test email delivery
- ✅ Test email templates
- ✅ QA email workflows
- ✅ Verify email formatting

**B. Development**
- Test user registration flow
- Test password reset emails
- Test notification systems
- Debug email issues

**C. Demo Accounts**
- Demo user account
- Test multi-user scenarios
- User journey testing

---

### 3️⃣ **noreply@longsang.org** (RESEND)

**Loại:** Custom domain via Resend  
**Mục đích:** Production transactional emails  
**Status:** 🔄 Đang warm-up (cần 4 tuần)  
**Daily Limit:** 3,000 emails/day (sau khi warm-up xong)

#### 🎯 USE CASES:

**A. Transactional Emails (Future - sau warm-up)**
- User registration confirmations
- Password reset links
- Email verification
- Order confirmations
- Payment receipts

**B. Notifications (Future)**
- System notifications
- Activity alerts
- Status updates
- Reminders

**C. Marketing (Limited)**
- Newsletter (với user consent)
- Product updates
- Feature announcements

**⚠️ HIỆN TẠI:**
- Chưa dùng được vì đang warm-up
- Inbox placement rate chưa tốt
- Có thể vào Spam

---

### 4️⃣ **hello@longsang.org** (Future)

**Loại:** Custom domain  
**Mục đích:** Customer support & inquiries  
**Status:** 📋 Planned (chưa setup)

#### 🎯 USE CASES (PLANNED):

**A. Customer Support**
- Support tickets
- Customer inquiries
- Help requests
- Bug reports

**B. Sales Inquiries**
- Product questions
- Pricing inquiries
- Partnership requests
- Demo requests

---

## 📊 STRATEGY & WORKFLOW

### **HIỆN TẠI (Current)**

```
┌─────────────────────────────────────────────┐
│  PRIMARY SENDER: longsangsabo@gmail.com     │
│  - Tất cả email tự động                     │
│  - Notification & alerts                    │
│  - Transactional emails                     │
│  - Limit: 500/day                           │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  TEST RECIPIENT: longsangsabo1@gmail.com    │
│  - Nhận test emails                         │
│  - QA & debugging                           │
└─────────────────────────────────────────────┘
```

### **TƯƠNG LAI (After Warm-up - Tuần 4)**

```
┌─────────────────────────────────────────────┐
│  PRIMARY: noreply@longsang.org (Resend)     │
│  - Transactional emails                     │
│  - High volume (3,000/day)                  │
│  - Professional branding                    │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  BACKUP: longsangsabo@gmail.com             │
│  - Fallback nếu Resend fail                 │
│  - Emergency notifications                  │
│  - Critical alerts                          │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  SUPPORT: hello@longsang.org                │
│  - Customer support                         │
│  - Incoming inquiries                       │
└─────────────────────────────────────────────┘
```

---

## 🔐 CREDENTIALS & ACCESS

### **Gmail SMTP (longsangsabo@gmail.com)**

**Cấu hình:**
```env
GMAIL_USER=longsangsabo@gmail.com
GMAIL_APP_PASSWORD=qjycfpexpnbviuvt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**Vị trí file:**
- `supabase/.env.gmail`

**App Password Management:**
- URL: https://myaccount.google.com/apppasswords
- Tên: "LongSang Admin v2"
- Rotate: Mỗi 3 tháng (recommended)

### **Resend API (noreply@longsang.org)**

**Cấu hình:**
```env
RESEND_API_KEY=re_xxx...
```

**Vị trí:**
- Supabase Edge Functions secrets
- `.env` files (local dev)

**Dashboard:**
- https://resend.com/domains
- Domain: longsang.org
- Status: Warming up

---

## 📈 USAGE METRICS & LIMITS

| Email Account | Provider | Daily Limit | Current Usage | Status |
|---------------|----------|-------------|---------------|--------|
| longsangsabo@gmail.com | Gmail | 500 | ~50/day | ✅ Active |
| longsangsabo1@gmail.com | Gmail | N/A | Test only | ✅ Active |
| noreply@longsang.org | Resend | 3,000 | Warming up | 🔄 Pending |
| hello@longsang.org | - | - | Not setup | 📋 Planned |

---

## 🎯 MIGRATION PLAN

### **Week 1-2 (Current)**
- ✅ Gmail SMTP primary
- ✅ Handle all emails
- ✅ Monitor delivery rates

### **Week 3-4 (Warm-up)**
- 🔄 Continue Resend warm-up
- 📊 Monitor inbox placement
- 🧪 Test small batches

### **Week 5+ (Production)**
- 🎯 Switch to Resend primary
- 🔄 Gmail as fallback
- 📈 Scale to 3,000/day

---

## 🛠️ INTEGRATION STATUS

### **Đã Tích Hợp:**
- ✅ Gmail SMTP script (`scripts/gmail-smtp.js`)
- ✅ Test script (`scripts/test-gmail.js`)
- ✅ .env.gmail configuration
- ✅ Nodemailer setup

### **Cần Tích Hợp:**
- ⏳ Supabase Edge Functions (send-email)
- ⏳ Admin Dashboard UI
- ⏳ n8n workflows
- ⏳ Email templates system

---

## 📝 BEST PRACTICES

### **Email Sending:**
1. **Luôn test trước** với longsangsabo1@gmail.com
2. **Monitor delivery rates** (Gmail > 95%, Resend đang warm-up)
3. **Respect limits** (Gmail 500/day, Resend 3,000/day)
4. **Use templates** cho consistency
5. **Track bounces** và remove invalid emails

### **Security:**
1. **Rotate App Passwords** mỗi 3 tháng
2. **Never commit** credentials to git
3. **Use environment variables** cho tất cả secrets
4. **Enable 2FA** trên tất cả accounts
5. **Monitor unauthorized access**

### **Deliverability:**
1. **Warm-up custom domains** từ từ
2. **Maintain sender reputation**
3. **Avoid spam triggers**
4. **Provide unsubscribe links**
5. **Monitor spam complaints**

---

## 🆘 TROUBLESHOOTING

### **Gmail SMTP Issues:**

**Problem:** Email không gửi được  
**Solutions:**
- Kiểm tra App Password còn valid không
- Verify SMTP settings (port 587, TLS)
- Check daily limit (500 emails)
- Test với script: `node scripts/test-gmail.js`

**Problem:** Email vào Spam  
**Solutions:**
- Check SPF/DKIM records
- Improve email content (avoid spam words)
- Request recipients whitelist sender
- Use Gmail's own domain (@gmail.com)

### **Resend Issues:**

**Problem:** Low inbox placement  
**Solutions:**
- Tiếp tục warm-up process
- Gửi email đến engaged users
- Monitor bounce rates
- Check domain reputation

---

## 📞 SUPPORT CONTACTS

### **Gmail Support:**
- Help Center: https://support.google.com/mail
- Account Security: https://myaccount.google.com/security

### **Resend Support:**
- Dashboard: https://resend.com/domains
- Docs: https://resend.com/docs
- Support: support@resend.com

---

## 🔄 CHANGELOG

### 2025-11-23
- ✅ Setup Gmail SMTP với App Password mới
- ✅ Test email delivery thành công
- ✅ Document tất cả email accounts
- 📋 Plan migration strategy

---

## 📌 NEXT STEPS

1. ⏳ **Tích hợp Gmail SMTP vào Supabase Edge Functions**
2. ⏳ **Update Admin Dashboard để trigger emails**
3. ⏳ **Setup email templates system**
4. ⏳ **Monitor Resend warm-up progress**
5. ⏳ **Plan migration timeline**

---

**📧 Email Strategy Owner:** LongSang  
**📅 Review Schedule:** Monthly  
**🎯 Goal:** 95%+ inbox placement, <1% bounce rate
