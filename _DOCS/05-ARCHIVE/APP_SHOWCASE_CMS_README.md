# App Showcase CMS - Hệ thống quản lý nội dung

## 📋 Tổng quan

Hệ thống CMS cho phép Admin cập nhật toàn bộ nội dung của trang App Showcase một cách trực quan và dễ dàng, không cần code.

## 🎯 Tính năng chính

### 1. **Thông tin chung** (General Tab)

- ✅ Tên ứng dụng
- ✅ Tagline
- ✅ Mô tả
- ✅ Hero Section (Badge, Title, Stats)
- ✅ CTA Section (Heading, Description, Rating)

### 2. **Quản lý tính năng** (Features Tab)

- ✅ Thêm/Xóa/Sửa tính năng
- ✅ Upload screenshot cho từng tính năng
- ✅ Chọn icon từ thư viện
- ✅ Thêm highlights và stats cho mỗi feature

### 3. **Branding** (Branding Tab)

- ✅ Color picker cho Primary/Secondary/Accent colors
- ✅ Upload logo
- ✅ Upload background images

### 4. **Liên kết** (Links Tab)

- ✅ App Store URL
- ✅ Google Play URL
- ✅ 6 Social media links (Facebook, Instagram, YouTube, TikTok, Discord, Twitter)

## 🚀 Cách sử dụng

### Truy cập Admin Dashboard

1. **Từ trang App Showcase:**
   - Nhấn vào nút Settings (⚙️) ở góc dưới bên phải màn hình

2. **Direct URL:**

   ```
   http://localhost:8081/app-showcase/admin
   ```

### Chỉnh sửa nội dung

1. **Chọn tab** tương ứng với nội dung muốn chỉnh sửa
2. **Cập nhật thông tin** trong các form fields
3. **Upload hình ảnh** bằng cách click vào nút "Upload"
4. **Nhấn "Lưu thay đổi"** để save data

### Preview thay đổi

- Nhấn nút **"Xem trước"** để mở trang App Showcase trong tab mới
- Hoặc click nút **Back** để quay lại trang showcase

## 📁 Cấu trúc Code

```
src/
├── types/
│   └── app-showcase.types.ts       # Type definitions
├── services/
│   └── app-showcase.service.ts     # Data service (localStorage)
├── pages/
│   ├── AppShowcase.tsx             # Public showcase page
│   └── AppShowcaseAdmin.tsx        # Admin CMS page
└── components/showcase/
    ├── HeroSection.tsx
    ├── FeaturesSection.tsx
    ├── CTASection.tsx
    └── FooterSection.tsx
```

## 💾 Lưu trữ dữ liệu

### Hiện tại: localStorage

Data được lưu trong browser localStorage với key: `app_showcase_data_{appId}`

### Production: API Integration

Để deploy production, thay thế `AppShowcaseService` methods:

```typescript
// Thay thế localStorage bằng API calls
static async loadData(appId: string): Promise<AppShowcaseData | null> {
  const response = await fetch(`/api/app-showcase/${appId}`);
  return response.json();
}

static async saveData(data: AppShowcaseData): Promise<boolean> {
  const response = await fetch(`/api/app-showcase/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.ok;
}
```

## 🖼️ Upload hình ảnh

### Hiện tại: Base64 encoding

Images được convert sang base64 và lưu trong localStorage

### Production: Cloud Storage

Để deploy production, integrate với cloud storage:

```typescript
static async uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { url } = await response.json();
  return url; // Return CDN URL
}
```

Recommended services:

- **Cloudinary** - Easy to use, great for images
- **AWS S3** - Scalable, industry standard
- **Supabase Storage** - Good if using Supabase
- **Firebase Storage** - Good if using Firebase

## 🎨 Icon System

Admin có thể chọn icons từ các thư viện:

### Lucide React (Default)

```
Trophy, Star, Zap, Users, Target, Crown, etc.
```

### React Icons

```typescript
// Format: {LibraryPrefix}{IconName}
FaFacebook, FaInstagram    // FontAwesome
RiDashboardLine            // Remix Icons
TbTournament              // Tabler Icons
BiTrendingUp              // BoxIcons
GiDiamondTrophy           // Game Icons
```

## 🔐 Bảo mật (TODO)

Hiện tại admin page là public. Để production cần:

1. **Add authentication:**

```typescript
<Route 
  path="/app-showcase/admin" 
  element={
    <ProtectedRoute>
      <AppShowcaseAdmin />
    </ProtectedRoute>
  } 
/>
```

1. **Role-based access:**

```typescript
// Chỉ cho phép user có role "admin" hoặc "editor"
<ProtectedRoute requiredRoles={['admin', 'editor']}>
  <AppShowcaseAdmin />
</ProtectedRoute>
```

## 📱 Responsive Design

- ✅ Desktop (1920px+): Full layout với 2 columns
- ✅ Tablet (768px-1920px): Stacked layout
- ✅ Mobile (320px-768px): Single column, optimized forms

## 🚧 Roadmap / TODO

### Phase 1: Core CMS ✅

- [x] CRUD operations cho tất cả fields
- [x] Image upload (base64)
- [x] Color picker
- [x] Icon selector
- [x] Real-time preview

### Phase 2: Enhanced Features

- [ ] Drag & drop để sắp xếp features
- [ ] Rich text editor cho descriptions
- [ ] Image optimization
- [ ] Multi-language support
- [ ] Version history & rollback

### Phase 3: Production Ready

- [ ] API integration
- [ ] Cloud storage for images
- [ ] Authentication & authorization
- [ ] Audit logs
- [ ] Bulk operations

### Phase 4: Advanced

- [ ] Multiple apps management
- [ ] Template system
- [ ] A/B testing
- [ ] Analytics integration
- [ ] SEO optimization tools

## 💡 Tips & Best Practices

### Images

- **Logo:** Nên dùng PNG với transparent background, 512x512px
- **Screenshots:** Dùng 1080x2340px (9:19.5 ratio) cho phone mockups
- **Background:** Dùng 1920x1080px, optimize để < 500KB

### Colors

- **Primary:** Màu chủ đạo của brand (buttons, links)
- **Secondary:** Màu phụ (backgrounds, borders)
- **Accent:** Màu nhấn mạnh (highlights, badges)

### Content Writing

- **Titles:** Ngắn gọn, 5-10 từ
- **Descriptions:** 2-3 câu, focus vào benefit
- **CTA:** Hành động rõ ràng, tạo urgency

## 🆘 Troubleshooting

### Data không load?

```typescript
// Check localStorage
console.log(localStorage.getItem('app_showcase_data_sabo-arena'));

// Clear và reload
localStorage.removeItem('app_showcase_data_sabo-arena');
window.location.reload();
```

### Images không hiển thị?

- Check file size (< 5MB recommended)
- Check format (jpg, png, webp, svg)
- Check browser console for errors

### Changes không save?

- Check browser console
- Verify localStorage quota không full
- Try hard refresh (Ctrl + Shift + R)

## 📞 Support

Nếu có vấn đề, tạo issue trên GitHub hoặc liên hệ dev team.

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Author:** LongSang Automation
