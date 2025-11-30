# 🧪 EMAIL SYSTEM TESTING PLAN

> **Kế hoạch test toàn diện cho email automation system**  
> Test Date: 2025-11-23  
> Tester: LongSang (User role)  
> System: Gmail SMTP + Supabase Edge Functions

---

## 🎯 MỤC TIÊU TEST

1. ✅ Verify Gmail SMTP hoạt động với nhiều loại email
2. ✅ Test email templates với dynamic variables
3. ✅ Test edge cases & error handling
4. ✅ Measure delivery rates & performance
5. ✅ Validate user experience end-to-end

---

## 📋 CHUẨN BỊ TRƯỚC KHI TEST

### **A. Setup Test Environment**

```bash
# 1. Đảm bảo Gmail SMTP đã config
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase
cat .env.gmail  # Verify credentials

# 2. Test basic connection
node scripts/test-gmail.js

# 3. Start Supabase local (if needed)
supabase start

# 4. Deploy Edge Functions (if needed)
supabase functions deploy send-email
```

### **B. Tạo Test Recipients**

| Email | Purpose | Expected Behavior |
|-------|---------|-------------------|
| longsangsabo1@gmail.com | Primary test inbox | Nhận tất cả test emails |
| longsangsabo@gmail.com | Self-test | Verify sender can receive |
| (Thêm email khác nếu có) | Multi-recipient test | Test CC/BCC |

### **C. Chuẩn bị Test Data**

```javascript
// Test variables for email templates
const testUsers = [
  {
    name: "Long Sang",
    email: "longsangsabo1@gmail.com",
    role: "admin",
    company: "LongSang.org"
  },
  {
    name: "Test User",
    email: "longsangsabo1@gmail.com",
    role: "user",
    company: "Demo Corp"
  }
]
```

---

## 🧪 TEST CASES

### **TEST SUITE 1: Basic Email Sending**

#### **TC-001: Simple Text Email**
**Mô tả:** Gửi email text đơn giản nhất  
**User Action:** Request gửi email với subject + body text  
**Expected Result:** Email delivered successfully

**Test Script:**
```javascript
// File: test-cases/tc-001-simple-text.js
node scripts/test-gmail.js longsangsabo1@gmail.com
```

**Verification:**
- [ ] Email arrives in inbox (not spam)
- [ ] Subject correct
- [ ] Body text correct
- [ ] Sender name shows "LongSang.org"
- [ ] Delivery time < 5 seconds

---

#### **TC-002: HTML Email with Formatting**
**Mô tả:** Email với HTML formatting (headings, lists, links)  
**User Request:** "Gửi cho tôi email welcome với design đẹp"

**Test Script:**
```javascript
// Test HTML email with rich formatting
const emailData = {
  to: 'longsangsabo1@gmail.com',
  subject: '🎉 Welcome to LongSang.org!',
  html: `
    <h1>Welcome!</h1>
    <p>Thanks for joining <strong>LongSang.org</strong></p>
    <ul>
      <li>Feature 1</li>
      <li>Feature 2</li>
    </ul>
    <a href="https://longsang.org">Visit Dashboard</a>
  `
}
```

**Verification:**
- [ ] HTML renders correctly
- [ ] Links are clickable
- [ ] Formatting preserved (bold, lists, etc.)
- [ ] Responsive on mobile
- [ ] No broken images

---

#### **TC-003: Email with Images**
**Mô tả:** Email có chứa hình ảnh (logo, banner)  
**User Request:** "Gửi email có logo LongSang.org"

**Test Script:**
```javascript
const emailData = {
  to: 'longsangsabo1@gmail.com',
  subject: 'Email with Logo',
  html: `
    <img src="https://longsang.org/logo.png" alt="Logo" />
    <p>Email with embedded image</p>
  `
}
```

**Verification:**
- [ ] Image loads correctly
- [ ] Alt text shows if image blocked
- [ ] Image size appropriate
- [ ] Fast loading time

---

### **TEST SUITE 2: Dynamic Templates**

#### **TC-004: Welcome Email Template**
**Mô tả:** Welcome email với dynamic variables  
**User Request:** "Gửi welcome email cho user mới tên 'Long Sang'"

**Variables:**
```javascript
{
  user_name: "Long Sang",
  user_email: "longsangsabo1@gmail.com",
  signup_date: "2025-11-23",
  dashboard_url: "https://admin.longsang.org"
}
```

**Template:**
```html
<h1>Hi {{user_name}}! 👋</h1>
<p>Welcome to LongSang.org</p>
<p>Your account: {{user_email}}</p>
<p>Signup date: {{signup_date}}</p>
<a href="{{dashboard_url}}">Go to Dashboard</a>
```

**Verification:**
- [ ] All variables replaced correctly
- [ ] No {{}} brackets visible
- [ ] Personal name shows correctly
- [ ] Links work properly

---

#### **TC-005: Password Reset Email**
**Mô tả:** Password reset với unique token  
**User Request:** "Tôi quên mật khẩu, gửi reset link"

**Variables:**
```javascript
{
  user_name: "Long Sang",
  reset_token: "abc123xyz789",
  reset_url: "https://admin.longsang.org/reset?token=abc123xyz789",
  expires_in: "1 hour"
}
```

**Verification:**
- [ ] Reset link unique
- [ ] Token in URL correct
- [ ] Expiry time shown
- [ ] Security warning included
- [ ] "If not you" message present

---

#### **TC-006: Weekly Report Email**
**Mô tả:** Analytics report với nhiều data points  
**User Request:** "Gửi báo cáo weekly analytics"

**Variables:**
```javascript
{
  week: "Week 47, 2025",
  total_users: "1,234",
  new_signups: "56",
  active_users: "789",
  revenue: "$1,234.56",
  top_feature: "AI Secretary"
}
```

**Verification:**
- [ ] Numbers formatted correctly
- [ ] Charts/graphs render (if any)
- [ ] Data accurate
- [ ] CTA buttons work

---

### **TEST SUITE 3: Edge Cases & Error Handling**

#### **TC-007: Invalid Email Address**
**Mô tả:** Gửi đến email không hợp lệ  
**User Request:** "Gửi email đến: invalid-email"

**Expected Result:**
- [ ] System validates email format
- [ ] Error message: "Invalid email address"
- [ ] No email sent
- [ ] User notified

---

#### **TC-008: Missing Required Variables**
**Mô tả:** Template thiếu biến bắt buộc  
**User Request:** "Gửi welcome email" (không có user_name)

**Expected Result:**
- [ ] System detects missing variable
- [ ] Error: "Missing required variable: user_name"
- [ ] Email not sent
- [ ] User prompted to provide data

---

#### **TC-009: Large Email (>1MB)**
**Mô tả:** Email có nhiều nội dung/hình lớn  
**User Request:** "Gửi email có 10 hình ảnh HD"

**Expected Result:**
- [ ] System checks email size
- [ ] Warning if > 1MB
- [ ] Suggest optimization
- [ ] Or reject if > Gmail limit (25MB)

---

#### **TC-010: Rapid Fire (Rate Limiting)**
**Mô tả:** Gửi 100 emails liên tiếp  
**User Request:** "Gửi email đến 100 users"

**Expected Result:**
- [ ] System respects Gmail 500/day limit
- [ ] Queue emails if over limit
- [ ] Show progress (50/100 sent)
- [ ] Retry failed emails

---

### **TEST SUITE 4: Multi-Recipient**

#### **TC-011: Multiple Recipients (TO)**
**Mô tả:** Gửi 1 email đến nhiều người  
**User Request:** "Gửi đến longsangsabo1@gmail.com và longsangsabo@gmail.com"

```javascript
{
  to: ['longsangsabo1@gmail.com', 'longsangsabo@gmail.com'],
  subject: 'Multi-recipient test'
}
```

**Verification:**
- [ ] Both recipients receive
- [ ] Both see all recipients in TO field
- [ ] No duplicate sends

---

#### **TC-012: CC & BCC**
**Mô tả:** Test CC và BCC functionality  
**User Request:** "Gửi đến A, CC cho B, BCC cho C"

```javascript
{
  to: 'longsangsabo1@gmail.com',
  cc: 'longsangsabo@gmail.com',
  bcc: 'longsangsabo@gmail.com',
  subject: 'CC/BCC test'
}
```

**Verification:**
- [ ] TO receives and sees CC
- [ ] CC receives and knows they're CC'd
- [ ] BCC receives but hidden from TO/CC
- [ ] No BCC visible in headers

---

### **TEST SUITE 5: Attachments**

#### **TC-013: PDF Attachment**
**Mô tả:** Email kèm file PDF  
**User Request:** "Gửi invoice.pdf"

**Expected Result:**
- [ ] PDF attached correctly
- [ ] File size shown
- [ ] Downloadable
- [ ] Opens correctly

---

#### **TC-014: Multiple Attachments**
**Mô tả:** Email có 3-5 files đính kèm  
**User Request:** "Gửi kèm 3 files"

**Expected Result:**
- [ ] All files attached
- [ ] Total size < 25MB
- [ ] All downloadable
- [ ] Correct filenames

---

### **TEST SUITE 6: Scheduling & Automation**

#### **TC-015: Scheduled Email**
**Mô tả:** Hẹn giờ gửi email  
**User Request:** "Gửi email này vào 2pm ngày mai"

**Expected Result:**
- [ ] Email queued
- [ ] Status: "Scheduled"
- [ ] Sends at correct time (±1 min)
- [ ] Can cancel before send

---

#### **TC-016: Recurring Email**
**Mô tả:** Email tự động hàng tuần  
**User Request:** "Gửi weekly report mỗi thứ 2"

**Expected Result:**
- [ ] Schedule created
- [ ] Sends every Monday
- [ ] Can pause/resume
- [ ] Can modify schedule

---

### **TEST SUITE 7: Deliverability & Spam**

#### **TC-017: Spam Words Test**
**Mô tả:** Email có từ ngữ dễ bị spam  
**Content:** "FREE MONEY!!! CLICK HERE NOW!!!"

**Expected Result:**
- [ ] System warns about spam words
- [ ] Suggests alternatives
- [ ] Shows spam score
- [ ] User can override

---

#### **TC-018: Inbox Placement**
**Mô tả:** Kiểm tra email vào Inbox hay Spam  
**Test:** Gửi 10 emails khác nhau

**Verification:**
- [ ] 9/10 in Inbox (90%+ rate)
- [ ] 0-1 in Spam
- [ ] 0 in Promotions
- [ ] All delivered (0 bounce)

---

### **TEST SUITE 8: Performance & Reliability**

#### **TC-019: Send Speed**
**Mô tả:** Đo thời gian gửi email

**Test Cases:**
- Simple email: < 2 seconds
- HTML email: < 3 seconds
- With attachment: < 5 seconds
- Batch 10 emails: < 30 seconds

---

#### **TC-020: Error Recovery**
**Mô tả:** Gmail SMTP temporary down

**Scenario:**
1. Disconnect internet
2. Try send email
3. Reconnect internet

**Expected:**
- [ ] Error caught gracefully
- [ ] User notified
- [ ] Email queued for retry
- [ ] Auto-retry after reconnect

---

## 📊 TEST EXECUTION PLAN

### **Phase 1: Basic Functionality (30 mins)**
- TC-001 to TC-003
- Verify core sending works
- Check deliverability

### **Phase 2: Templates & Variables (45 mins)**
- TC-004 to TC-006
- Test all template types
- Verify variable replacement

### **Phase 3: Edge Cases (30 mins)**
- TC-007 to TC-010
- Break things intentionally
- Verify error handling

### **Phase 4: Advanced Features (60 mins)**
- TC-011 to TC-016
- Multi-recipient, attachments, scheduling
- Test complete workflows

### **Phase 5: Production Readiness (30 mins)**
- TC-017 to TC-020
- Spam testing, performance, reliability
- Final checks

**Total Time:** ~3 hours

---

## 🎮 USER TEST SCENARIOS

### **Scenario 1: New User Signup**
**Your Role:** User đăng ký tài khoản mới

**Steps:**
1. "Tôi vừa đăng ký tài khoản mới"
2. "Tên tôi là Long Sang"
3. "Email: longsangsabo1@gmail.com"
4. "Gửi welcome email cho tôi"

**Expected Emails:**
- Welcome email with my name
- Email verification link
- Getting started guide

---

### **Scenario 2: Forgot Password**
**Your Role:** User quên mật khẩu

**Steps:**
1. "Tôi quên mật khẩu"
2. "Email của tôi: longsangsabo1@gmail.com"
3. "Gửi link reset password"

**Expected Emails:**
- Password reset email
- Unique reset link
- Expiry time (1 hour)
- Security warning

---

### **Scenario 3: Weekly Analytics Report**
**Your Role:** Admin muốn báo cáo

**Steps:**
1. "Gửi báo cáo analytics tuần này"
2. "Gửi đến: longsangsabo1@gmail.com"
3. "Include: users, revenue, top features"

**Expected Emails:**
- Professional report format
- Charts/data visualization
- Summary insights
- CTA to view full dashboard

---

### **Scenario 4: Bulk Invitation**
**Your Role:** Admin mời nhiều users

**Steps:**
1. "Tôi muốn mời 5 người vào hệ thống"
2. "Gửi invitation email cho họ"
3. Provide: names + emails

**Expected Emails:**
- Personalized for each recipient
- Unique invitation links
- Clear instructions
- Brand consistent

---

### **Scenario 5: System Alert**
**Your Role:** System phát hiện issue

**Steps:**
1. "Có lỗi xảy ra trên server"
2. "Gửi alert email cho admin"
3. "Priority: HIGH"

**Expected Emails:**
- Urgent subject line
- Clear error description
- Action items
- Quick access links

---

## ✅ SUCCESS CRITERIA

### **Must Have:**
- [ ] 95%+ emails delivered to inbox
- [ ] All templates work correctly
- [ ] Variables replaced properly
- [ ] No crashes or errors
- [ ] Delivery time < 5 seconds
- [ ] Works on mobile & desktop

### **Should Have:**
- [ ] Error messages clear and helpful
- [ ] Queue system works
- [ ] Rate limiting prevents spam
- [ ] Attachments work
- [ ] Scheduling works

### **Nice to Have:**
- [ ] Preview before send
- [ ] Email analytics/tracking
- [ ] Retry logic for failures
- [ ] Email logs/history

---

## 📝 TEST REPORT TEMPLATE

```markdown
## Test Execution Report

**Date:** 2025-11-23
**Tester:** LongSang
**Duration:** X hours
**Environment:** Production (Gmail SMTP)

### Summary
- Total Tests: 20
- Passed: X
- Failed: Y
- Blocked: Z
- Pass Rate: X%

### Critical Issues
1. [Issue description]
   - Severity: High/Medium/Low
   - Impact: [Description]
   - Steps to reproduce
   - Suggested fix

### Performance Metrics
- Average send time: X seconds
- Inbox placement: X%
- Bounce rate: X%
- Error rate: X%

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

### Next Steps
- [ ] Fix critical issues
- [ ] Retest failed cases
- [ ] Document learnings
- [ ] Update test plan
```

---

## 🚀 GETTING STARTED

### **Option A: Interactive Test (Recommended)**
Bạn (User) sẽ request, tôi (System) sẽ execute và report kết quả

**Start Command:**
```
"Bắt đầu test! Scenario 1: New User Signup"
```

### **Option B: Automated Test Suite**
Run tất cả test cases tự động

**Start Command:**
```bash
cd supabase/scripts
node run-email-tests.js
```

### **Option C: Mixed Approach**
- Critical tests: Interactive (hands-on)
- Basic tests: Automated (faster)

---

## 📞 TEST SUPPORT

**Nếu có vấn đề trong test:**
1. Note down error message
2. Check logs: `supabase/logs/email.log`
3. Verify credentials: `.env.gmail`
4. Test basic connection: `node scripts/test-gmail.js`

**Emergency contacts:**
- Gmail SMTP issues: Check App Password
- Template issues: Check variables syntax
- Delivery issues: Check spam folder first

---

## 🎯 READY TO START?

**Bạn chọn:**
- **A)** Interactive testing (tôi sẽ đóng vai User, request từng scenario)
- **B)** Tạo automated test scripts trước
- **C)** Run quick smoke test (5 phút) để verify basic
- **D)** Khác

**Sẵn sàng khi nào báo tôi! 🚀**
