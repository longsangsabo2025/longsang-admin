# App Showcase Multi-Project Support

## 📋 Tổng Quan

Hệ thống App Showcase đã được chuẩn hóa để hỗ trợ showcase **nhiều projects**, không chỉ một project duy nhất.

## 🔄 Thay Đổi Routing

### Trước đây

- `/app-showcase` → Hiển thị chi tiết SABO Arena (hardcoded)
- `/app-showcase/admin` → Admin panel

### Bây giờ

- `/app-showcase` → **Danh sách tất cả projects** (AppShowcaseList)
- `/app-showcase/:slug` → **Chi tiết từng project** (VD: `/app-showcase/sabo-arena`)
- `/app-showcase/admin` → Admin panel (không đổi)

## 🆕 Tính Năng Mới

### 1. **Multi-Project List View**

- Grid hiển thị tất cả projects đã published
- Mỗi card hiển thị:
  - Icon/emoji của app
  - Tên app & tagline
  - Description ngắn gọn
  - Stats (rating, users)
  - Nút "Xem Chi Tiết" → đến `/app-showcase/:slug`
  - Nút icon "External Link" → đến production URL

### 2. **Slug-based Routing**

- Mỗi project có `slug` duy nhất (URL-friendly)
- VD: `sabo-arena`, `chrono-desk`, `marketplace-mvp`
- Slug được dùng trong URL thay vì ID

### 3. **Production URL Integration**

- Mỗi project có thể có `productionUrl`
- Hiển thị nút "Xem Trang Web" trực tiếp trong:
  - Hero Section (nút lớn)
  - Project Card (icon nhỏ)

## 📊 Database Schema Changes

Đã thêm 3 cột mới vào table `app_showcase`:

```sql
slug            TEXT    -- URL-friendly identifier (unique)
icon            TEXT    -- Emoji hoặc icon cho card preview
production_url  TEXT    -- Production URL của app
```

## 🚀 Migration

Chạy migration để thêm columns:

```bash
node scripts/add-showcase-multiproject.js
```

Hoặc manual trong Supabase SQL Editor:

```sql
ALTER TABLE app_showcase ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE app_showcase ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE app_showcase ADD COLUMN IF NOT EXISTS production_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_showcase_slug ON app_showcase(slug);

-- Update existing data
UPDATE app_showcase 
SET 
  slug = 'sabo-arena',
  icon = '🎱',
  production_url = 'https://longsang.org'
WHERE app_id = 'sabo-arena';
```

## 📁 File Structure

```
src/
├── pages/
│   ├── AppShowcaseList.tsx        # NEW: Danh sách projects
│   ├── AppShowcaseDetail.tsx      # RENAMED: Chi tiết project (was AppShowcase.tsx)
│   └── AppShowcaseAdmin.tsx       # Không đổi
├── services/
│   └── app-showcase.service.ts    # Updated: thêm loadAllProjects()
└── types/
    └── app-showcase.types.ts      # Updated: thêm slug, icon, productionUrl
```

## 🎨 UI Components

### AppShowcaseList (Trang List)

- Hero section với title "App Showcase - Khám Phá Dự Án"
- Grid responsive (1/2/3 columns)
- Project cards với hover effects
- Glass morphism design

### AppShowcaseDetail (Trang Chi Tiết)

- Giống như trang cũ
- Nhưng giờ nhận `slug` từ URL params
- Load data dựa trên slug
- Có nút "Xem Trang Web" trong Hero

## 🔧 API Service Updates

### New Method: `loadAllProjects()`

```typescript
static async loadAllProjects(): Promise<AppShowcaseData[]>
```

- Load tất cả projects có status = 'published'
- Sắp xếp theo `updated_at` DESC
- Trả về array of AppShowcaseData

### Updated Method: `loadData(slug)`

```typescript
static async loadData(slug: string): Promise<AppShowcaseData | null>
```

- Giờ nhận `slug` thay vì `appId`
- Query by slug thay vì app_id

## 📝 Cách Thêm Project Mới

1. Vào `/app-showcase/admin`
2. Điền thông tin app
3. **Quan trọng**: Điền các trường mới:
   - **Slug**: URL-friendly name (VD: `chrono-desk`)
   - **Icon**: Emoji cho app (VD: `⏰`)
   - **Production URL**: Link production (VD: `https://chronodesk.app`)
4. Publish
5. Project sẽ hiện trong `/app-showcase`

## 🎯 Benefits

✅ **Scalable**: Dễ dàng thêm nhiều projects mà không cần code thêm  
✅ **SEO-friendly**: Mỗi project có URL riêng với slug  
✅ **User-friendly**: Danh sách dễ duyệt, card đẹp mắt  
✅ **Direct Access**: Link trực tiếp đến production app  
✅ **Professional**: Portfolio showcase hoàn chỉnh  

## 🔗 Example URLs

- **List**: `https://longsang.org/app-showcase`
- **SABO Arena**: `https://longsang.org/app-showcase/sabo-arena`
- **Chrono Desk**: `https://longsang.org/app-showcase/chrono-desk`
- **Admin**: `https://longsang.org/app-showcase/admin`

## 🎨 Design Philosophy

- **Foundation-first**: Được thiết kế từ đầu để showcase nhiều projects
- **Card-based**: Mỗi project là 1 card trong grid
- **Click-to-detail**: Click card → trang chi tiết đầy đủ
- **Quick access**: Nút external link để truy cập nhanh production

---

**Created**: November 13, 2025  
**Purpose**: Multi-project showcase system  
**Status**: ✅ Ready for deployment
