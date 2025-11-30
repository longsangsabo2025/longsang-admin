# 📘 FACEBOOK MARKETING API - INTEGRATION GUIDE

> **Created:** November 26, 2025  
> **Project:** LongSang Admin  
> **Status:** ✅ Ready for Configuration

---

## 📋 TỔNG QUAN

Facebook Marketing API cho phép bạn:
- 📊 **Quản lý quảng cáo** (tạo campaign, theo dõi performance)
- 📝 **Đăng bài tự động** lên nhiều Facebook Pages
- 📈 **Theo dõi insights** (reach, engagement, conversions)
- 🎯 **Quản lý audiences** (custom audiences, lookalike)
- 🔔 **Server-side tracking** (Conversions API)
- 📆 **Lên lịch đăng bài** (schedule posts)

---

## ⚙️ CẤU HÌNH

### Bước 1: Tạo Facebook App

1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"**
3. Chọn **"Business"** type
4. Điền thông tin app

### Bước 2: Lấy Credentials

Thêm vào file `.env.local`:

```env
# ================================================
# FACEBOOK MARKETING API
# ================================================

# App Credentials (từ Facebook Developers Console)
VITE_FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here

# Page Access Token
# Lấy từ: https://developers.facebook.com/tools/explorer/
# Permissions cần: pages_manage_posts, pages_read_engagement, pages_show_list
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
FACEBOOK_PAGE_ID=your_default_page_id_here

# Business & Ads (Tùy chọn - cho quảng cáo)
FACEBOOK_BUSINESS_ID=your_business_id_here
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id_here  # Không có "act_" prefix

# Conversions API (Tùy chọn - cho tracking)
FACEBOOK_PIXEL_ID=your_pixel_id_here
```

### Bước 3: Lấy Page Access Token

1. Vào [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Chọn app của bạn
3. Click **"Get Token"** → **"Get Page Access Token"**
4. Chọn page và grant permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `pages_read_user_content`
5. Copy token (long-lived, 60 days)

### Bước 4: Extend Token (Tùy chọn)

Để có token vĩnh viễn:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}"
```

---

## 🚀 SỬ DỤNG

### Truy cập Dashboard

URL: `http://localhost:8080/admin/facebook-marketing`

### API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/facebook/health` | GET | Kiểm tra kết nối |
| `/api/facebook/pages` | GET | Danh sách Pages |
| `/api/facebook/pages/:id/insights` | GET | Insights của Page |
| `/api/facebook/pages/:id/post` | POST | Đăng bài lên Page |
| `/api/facebook/ads/account` | GET | Thông tin Ad Account |
| `/api/facebook/ads/campaigns` | GET | Danh sách campaigns |
| `/api/facebook/ads/campaigns` | POST | Tạo campaign mới |
| `/api/facebook/ads/insights` | GET | Performance metrics |
| `/api/facebook/audiences` | GET | Custom audiences |
| `/api/facebook/schedule` | POST | Lên lịch đăng bài |
| `/api/facebook/conversions` | POST | Server-side tracking |

---

## 📊 VÍ DỤ SỬ DỤNG

### 1. Đăng bài lên Page

```javascript
// POST /api/facebook/pages/{pageId}/post
const response = await fetch('/api/facebook/pages/123456/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello from LongSang Admin! 🚀',
    link: 'https://longsang.org'
  })
});
```

### 2. Tạo Campaign

```javascript
// POST /api/facebook/ads/campaigns
const response = await fetch('/api/facebook/ads/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Black Friday Sale 2025',
    objective: 'OUTCOME_SALES',
    daily_budget: 50000, // 50,000 VND per day
    status: 'PAUSED'
  })
});
```

### 3. Lên lịch đăng bài

```javascript
// POST /api/facebook/schedule
const scheduledTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

const response = await fetch('/api/facebook/schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Scheduled post for tomorrow! 📅',
    scheduled_publish_time: scheduledTime,
    pageId: '123456789'
  })
});
```

### 4. Server-side Conversion Tracking

```javascript
// POST /api/facebook/conversions
const response = await fetch('/api/facebook/conversions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'Purchase',
    user_data: {
      em: 'hash_of_email',
      ph: 'hash_of_phone'
    },
    custom_data: {
      currency: 'VND',
      value: 500000
    },
    event_source_url: 'https://longsang.org/checkout'
  })
});
```

---

## 🎯 CÁC TÍNH NĂNG CÓ THỂ TẬN DỤNG

### Marketing Automation

| Tính năng | Mô tả | Độ khó |
|-----------|-------|--------|
| Auto-posting | Đăng bài tự động theo lịch | ⭐ Easy |
| Cross-posting | Đăng lên nhiều Pages cùng lúc | ⭐ Easy |
| Engagement Analytics | Theo dõi likes, comments, shares | ⭐ Easy |
| Content Calendar | Lên lịch content cả tháng | ⭐⭐ Medium |
| A/B Testing Posts | Test nhiều phiên bản content | ⭐⭐ Medium |

### Advertising

| Tính năng | Mô tả | Độ khó |
|-----------|-------|--------|
| Campaign Management | Tạo/quản lý campaigns | ⭐⭐ Medium |
| Audience Targeting | Tạo custom audiences | ⭐⭐ Medium |
| Budget Optimization | Tự động điều chỉnh budget | ⭐⭐⭐ Hard |
| Creative Testing | A/B test ads | ⭐⭐⭐ Hard |
| Retargeting | Remarketing audiences | ⭐⭐⭐ Hard |

### Analytics & Insights

| Tính năng | Mô tả | Độ khó |
|-----------|-------|--------|
| Page Insights | Thống kê Page | ⭐ Easy |
| Post Performance | Phân tích từng bài | ⭐ Easy |
| Ads Reporting | Báo cáo quảng cáo | ⭐⭐ Medium |
| Attribution | Theo dõi conversions | ⭐⭐⭐ Hard |
| Custom Reports | Báo cáo tùy chỉnh | ⭐⭐⭐ Hard |

---

## 🔐 PERMISSIONS CẦN THIẾT

### Cho Page Management

- `pages_show_list` - Xem danh sách Pages
- `pages_read_engagement` - Đọc insights
- `pages_manage_posts` - Đăng/xóa bài
- `pages_read_user_content` - Đọc comments

### Cho Ads Management

- `ads_management` - Quản lý ads
- `ads_read` - Đọc ads data
- `business_management` - Quản lý Business

### Cho Conversions API

- `ads_management` - Cần cho Conversions API

---

## 📁 FILES CREATED

```
api/routes/facebook-marketing.js    # API routes
src/pages/FacebookMarketing.tsx     # Dashboard UI
_DOCS/02-FEATURES/FACEBOOK_MARKETING_API.md  # This doc
```

---

## 🔗 TÀI LIỆU THAM KHẢO

- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Pages API](https://developers.facebook.com/docs/pages-api)
- [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Token Expiration**: Page Access Token có thể hết hạn. Cần refresh định kỳ.
2. **Rate Limits**: Facebook có giới hạn API calls. Tránh spam requests.
3. **App Review**: Một số permissions cần Facebook review trước khi dùng production.
4. **Privacy**: Không lưu user data trực tiếp, sử dụng hashed values cho Conversions API.
5. **Testing**: Luôn test trên sandbox trước khi chạy production.

---

## ✅ NEXT STEPS

1. [ ] Thêm Facebook credentials vào `.env.local`
2. [ ] Test connection tại `/admin/facebook-marketing`
3. [ ] Link với n8n workflows để automation
4. [ ] Setup Conversions API cho tracking
5. [ ] Tạo content calendar

---

*Last updated: November 26, 2025*
