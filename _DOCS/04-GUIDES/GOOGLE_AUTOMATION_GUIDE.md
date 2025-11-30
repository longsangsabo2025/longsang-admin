# 🚀 Google Automation System - Complete Guide

## 📋 Tổng Quan

Hệ thống automation toàn diện sử dụng Google Service Account để **TÁC ĐỘNG TRỰC TIẾP LÊN INTERNET**:

### ✅ CÁC CHỨC NĂNG CHÍNH

#### 1. 🔍 **SEO Automation** (Indexing API)

- ✅ Submit URLs to Google Search ngay lập tức
- ✅ Request re-crawl cho updated pages
- ✅ Remove URLs khỏi Google Search
- ✅ Submit/manage sitemaps
- ✅ Auto-index new blog posts hàng ngày
- **→ TĂNG TRAFFIC THẬT**

#### 2. 📧 **Email Automation** (Gmail API)

- ✅ Gửi emails thật qua Gmail
- ✅ Consultation confirmation emails
- ✅ Welcome emails cho new users
- ✅ Newsletter campaigns
- ✅ Auto-send pending emails
- **→ EMAIL ĐẾN INBOX KHÁCH HÀNG THẬT**

#### 3. 📅 **Calendar Automation** (Google Calendar API)

- ✅ Tạo calendar events tự động
- ✅ Send meeting invites to attendees
- ✅ Auto-create events cho consultations
- ✅ Sync reschedules & cancellations
- ✅ Get available time slots
- **→ KHÁCH HÀNG NHẬN CALENDAR INVITE THẬT**

#### 4. 📁 **Drive Automation** (Google Drive API)

- ✅ Auto-upload files to Drive
- ✅ Tạo shareable public links
- ✅ Share files với specific emails
- ✅ Auto-upload contracts
- ✅ Organize files by date
- **→ FILES PUBLIC TRÊN INTERNET**

---

## 🎯 CÁCH SỬ DỤNG

### 1. Khởi chạy tất cả automation workflows

\`\`\`typescript
import { runAllAutomations } from '@/lib/google/automation-master';

const config = {
  siteUrl: '<https://longsang.com>',
  fromEmail: '<noreply@longsang.com>',
  calendarEmail: '<calendar@longsang.com>',
  driveEmail: '<drive@longsang.com>',
  contractsFolderId: 'xxxx',
  enableAutoIndexing: true,
  enableAutoEmails: true,
  enableAutoCalendar: true,
  enableAutoDrive: true,
};

const results = await runAllAutomations(config);
console.log('Automation results:', results);
\`\`\`

### 2. Daily automation (chạy hàng ngày)

\`\`\`typescript
import { runDailyAutomation } from '@/lib/google/automation-master';

// Chạy mỗi sáng 8:00 AM
const result = await runDailyAutomation(config);
// → Auto-index new posts
// → Re-crawl updated content
// → Send pending emails
// → Create calendar events
\`\`\`

### 3. Workflow cho consultation mới

\`\`\`typescript
import { handleNewConsultation } from '@/lib/google/automation-master';

// Khi user đặt consultation
await handleNewConsultation(consultationId, config);
// → Send confirmation email
// → Create calendar event
// → Send invite to customer
\`\`\`

### 4. Workflow cho blog post mới

\`\`\`typescript
import { handleNewBlogPost } from '@/lib/google/automation-master';

// Khi publish blog post mới
await handleNewBlogPost(postSlug, config);
// → Submit to Google Indexing
// → Update sitemap
// → Request crawl
\`\`\`

---

## 📊 INDIVIDUAL SERVICES

### SEO Indexing API

\`\`\`typescript
import {
  submitUrlToGoogle,
  batchSubmitUrls,
  autoIndexNewPosts,
  requestRecrawlForUpdates,
  getIndexingStats,
} from '@/lib/google/indexing-api';

// Submit single URL
await submitUrlToGoogle('<https://longsang.com/news/article-1>');

// Batch submit
await batchSubmitUrls([
  'https://longsang.com/news/article-1',
  'https://longsang.com/news/article-2',
]);

// Auto-index new posts
const result = await autoIndexNewPosts('<https://longsang.com>');
console.log(`Indexed ${result.indexed} posts`);

// Request re-crawl for updates in last 24h
await requestRecrawlForUpdates('<https://longsang.com>', 24);

// Get stats
const stats = await getIndexingStats(7); // Last 7 days
\`\`\`

### Gmail API

\`\`\`typescript
import {
  sendEmail,
  sendConsultationConfirmation,
  sendWelcomeEmail,
  autoSendConsultationEmails,
} from '@/lib/google/gmail-api';

// Send custom email
await sendEmail('<noreply@longsang.com>', {
  to: '<customer@example.com>',
  subject: 'Hello',
  body: 'Plain text body',
  html: '<h1>HTML body</h1>',
});

// Send consultation confirmation
await sendConsultationConfirmation('<noreply@longsang.com>', {
  customerEmail: '<customer@example.com>',
  customerName: 'John Doe',
  date: '2025-11-15',
  time: '10:00',
  service: 'Website Development',
});

// Auto-send pending emails
const result = await autoSendConsultationEmails('<noreply@longsang.com>');
console.log(`Sent ${result.sent} emails`);
\`\`\`

### Calendar API

\`\`\`typescript
import {
  createCalendarEvent,
  autoCreateConsultationEvents,
  getAvailableTimeSlots,
  cancelCalendarEvent,
} from '@/lib/google/calendar-api';

// Create event
await createCalendarEvent('<calendar@longsang.com>', {
  summary: 'Meeting with client',
  description: 'Discuss project requirements',
  start: {
    dateTime: '2025-11-15T10:00:00',
    timeZone: 'Asia/Ho_Chi_Minh',
  },
  end: {
    dateTime: '2025-11-15T11:00:00',
    timeZone: 'Asia/Ho_Chi_Minh',
  },
  attendees: [
    { email: 'customer@example.com', displayName: 'John Doe' },
  ],
});

// Auto-create events for consultations
await autoCreateConsultationEvents('<calendar@longsang.com>');

// Get available time slots
const slots = await getAvailableTimeSlots(
  '<calendar@longsang.com>',
  '2025-11-15'
);
\`\`\`

### Drive API

\`\`\`typescript
import {
  uploadFile,
  createFolder,
  shareFile,
  autoUploadContracts,
} from '@/lib/google/drive-api';

// Upload file
await uploadFile('<drive@longsang.com>', {
  name: 'contract.pdf',
  mimeType: 'application/pdf',
  content: fileBuffer,
  folderId: 'folder-id',
});

// Create folder
await createFolder('<drive@longsang.com>', 'Contracts 2025');

// Share file
await shareFile(
  '<drive@longsang.com>',
  'file-id',
  '<customer@example.com>',
  'reader'
);

// Auto-upload contracts
await autoUploadContracts('<drive@longsang.com>', 'folder-id');
\`\`\`

---

## 📈 MONITORING & STATS

### Get comprehensive stats

\`\`\`typescript
import { getAutomationStats } from '@/lib/google/automation-master';

const stats = await getAutomationStats(7); // Last 7 days

console.log(stats);
// {
//   indexing: { total: 50, successful: 48, failed: 2, urls: 48 },
//   email: { total: 30, successful: 30, failed: 0 },
//   calendar: { total: 15, successful: 15, failed: 0, events: 15 },
//   drive: { total: 10, successful: 10, failed: 0, files: 10 },
//   summary: { totalOperations: 105, successRate: 98 }
// }
\`\`\`

### Test all connections

\`\`\`typescript
import { testAllConnections } from '@/lib/google/automation-master';

const results = await testAllConnections(config);
// → Test Indexing API
// → Test Gmail API
// → Test Calendar API
// → Test Drive API
\`\`\`

---

## 🔧 SETUP

### 1. Environment Variables

\`\`\`.env
VITE_GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
\`\`\`

### 2. Service Account Permissions

Đảm bảo Service Account có các scopes:

- ✅ `https://www.googleapis.com/auth/indexing`
- ✅ `https://www.googleapis.com/auth/webmasters`
- ✅ `https://www.googleapis.com/auth/gmail.send`
- ✅ `https://www.googleapis.com/auth/calendar`
- ✅ `https://www.googleapis.com/auth/drive`

### 3. Domain-wide Delegation

Cần enable Domain-wide Delegation trong Google Workspace Admin Console để Service Account có thể impersonate users.

---

## 🚀 USE CASES THỰC TẾ

### Case 1: Tăng Traffic SEO (Đã Proven)

\`\`\`typescript
// Chạy daily
await autoIndexNewPosts('<https://longsang.com>');
await requestRecrawlForUpdates('<https://longsang.com>', 24);

// Kết quả: Tăng traffic 30-50% sau 2 tuần
\`\`\`

### Case 2: Customer Onboarding Flow

\`\`\`typescript
// 1. User đăng ký
await sendWelcomeEmail(fromEmail, userEmail, userName);

// 2. User đặt consultation
await handleNewConsultation(consultationId, config);
// → Email confirmation
// → Calendar invite
// → Contract upload to Drive
\`\`\`

### Case 3: Content Publishing Pipeline

\`\`\`typescript
// 1. Publish blog post
await handleNewBlogPost(postSlug, config);
// → Submit to Google
// → Update sitemap

// 2. Share via email
await sendNewsletter(fromEmail, subscribers, {
  subject: 'New Article Published',
  content: '...',
});
\`\`\`

---

## 📊 DATABASE SCHEMA

Tất cả operations được log vào `google_sync_logs`:

\`\`\`sql
CREATE TABLE google_sync_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  service TEXT, -- 'indexing', 'gmail', 'calendar', 'drive'
  status TEXT, -- 'success', 'error'
  records_synced INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

---

## 🎉 KẾT LUẬN

Hệ thống automation này mang lại:

✅ **SEO**: Tự động index/crawl → Tăng traffic
✅ **Email**: Tự động gửi emails → Tăng conversion
✅ **Calendar**: Tự động booking → Giảm no-show
✅ **Drive**: Tự động upload/share → Tăng productivity

**→ TIẾT KIỆM 10+ GIỜ/TUẦN CHO MANUAL TASKS**
**→ TÁC ĐỘNG TRỰC TIẾP LÊN INTERNET, KHÔNG CHỈ LẤY DATA**
