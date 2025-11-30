# 🔑 ENVIRONMENT VARIABLES REFERENCE

> **Mục đích:** Hướng dẫn Cursor AI biết các biến môi trường có sẵn
> **File thật:** `.env` (gitignored, nhưng Cursor đọc được từ filesystem)

---

## 📋 AVAILABLE KEYS

### Supabase
```
VITE_SUPABASE_URL          - Supabase project URL
VITE_SUPABASE_ANON_KEY     - Public anon key (safe for frontend)
VITE_SUPABASE_PROJECT_ID   - Project ID
SUPABASE_SERVICE_ROLE_KEY  - Service role key (backend only!)
DATABASE_URL               - Direct database connection
```

### Facebook Pages (Multiple Pages Supported)
```
VITE_FACEBOOK_APP_ID       - Facebook App ID
FACEBOOK_APP_SECRET        - Facebook App Secret

# Main account
FACEBOOK_USER_ACCESS_TOKEN - User access token
FACEBOOK_PAGE_ID           - Default page ID
FACEBOOK_PAGE_NAME         - Default page name
FACEBOOK_PAGE_ACCESS_TOKEN - Default page token

# SABO Arena Page
FACEBOOK_PAGE_SABO_ARENA_ID
FACEBOOK_PAGE_SABO_ARENA_TOKEN

# AI Newbie VN Page
FACEBOOK_PAGE_AI_NEWBIE_VN_ID
FACEBOOK_PAGE_AI_NEWBIE_VN_TOKEN

# SABO Media Page
FACEBOOK_PAGE_SABO_MEDIA_ID
FACEBOOK_PAGE_SABO_MEDIA_TOKEN

# AI Art Newbie Page
FACEBOOK_PAGE_AI_ART_NEWBIE_ID
FACEBOOK_PAGE_AI_ART_NEWBIE_TOKEN

# SABO Billiard Shop Page
FACEBOOK_PAGE_SABO_BILLIARD_SHOP_ID
FACEBOOK_PAGE_SABO_BILLIARD_SHOP_TOKEN

# Thợ Săn Hoàng Hôn Page
FACEBOOK_PAGE_THO_SAN_HOANG_HON_ID
FACEBOOK_PAGE_THO_SAN_HOANG_HON_TOKEN
```

### Instagram Accounts
```
INSTAGRAM_SABO_BILLIARDS_ID
INSTAGRAM_SABO_MEDIA_ID
INSTAGRAM_AI_NEWBIE_VN_ID
INSTAGRAM_SABO_BILLIARD_SHOP_ID
INSTAGRAM_AI_ART_NEWBIE_ID
```

### Threads
```
THREADS_APP_ID
THREADS_USER_ID
THREADS_USERNAME
THREADS_ACCESS_TOKEN
```

### LinkedIn
```
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
LINKEDIN_USER_ID
LINKEDIN_USER_NAME
LINKEDIN_ACCESS_TOKEN
```

### Google Services
```
# Service Account (for Sheets, Drive, etc.)
GOOGLE_SERVICE_ACCOUNT_JSON  - Full JSON key

# Analytics & Search Console
GOOGLE_ANALYTICS_PROPERTY_ID
GOOGLE_SEARCH_CONSOLE_PROPERTY_URL

# YouTube API
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_ACCESS_TOKEN
YOUTUBE_REFRESH_TOKEN
YOUTUBE_CHANNEL_ID
YOUTUBE_CHANNEL_NAME

# Google Drive
GOOGLE_DRIVE_REFRESH_TOKEN   - For file upload/download
```

### App Configuration
```
VITE_PORT=8080              - Frontend dev server port
API_PORT=3001               - Backend API port
VITE_API_URL=http://localhost:3001
OAUTH_CALLBACK_PORT=3333    - OAuth callback port
```

---

## 🔧 HOW TO USE IN CODE

### Backend (api/*.js)
```javascript
// Access directly
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

// Google Service Account
const googleCreds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
```

### Frontend (src/*.tsx)
```typescript
// Only VITE_ prefixed vars are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

// ⚠️ Never expose secrets in frontend!
```

---

## 📝 NOTES FOR CURSOR AI

1. **File `.env` tồn tại** và có đầy đủ values
2. **Cursor có thể đọc** file `.env` từ filesystem (dù gitignored)
3. **Khi cần dùng key**, truy cập qua `process.env.KEY_NAME`
4. **Frontend chỉ thấy** các biến bắt đầu bằng `VITE_`
5. **Backend thấy tất cả** biến môi trường

---

## 🚀 QUICK ACTIONS

### Để xem giá trị key (trong terminal):
```powershell
# Xem một key cụ thể
$env:FACEBOOK_PAGE_ACCESS_TOKEN

# Hoặc từ file .env
Select-String -Path ".env" -Pattern "FACEBOOK_PAGE_ACCESS_TOKEN"
```

### Để test API key hoạt động:
```javascript
// Test trong Node.js
require('dotenv').config();
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
```
