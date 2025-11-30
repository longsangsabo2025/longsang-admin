# 📸 Hướng Dẫn Thêm Ảnh Chân Dung

## ✅ Code đã được cập nhật

File `HeroSection.tsx` đã sẵn sàng hiển thị ảnh chân dung của bạn.

## 🎯 Bước tiếp theo

### 1. **Save ảnh của bạn**

- Lưu ảnh chân dung (ảnh 1 bạn đã upload) với tên: `profile.jpg`
- Đường dẫn: `d:\0.APP\1510\long-sang-forge\public\images\profile.jpg`

### 2. **Tạo thư mục images nếu chưa có**

```bash
# Nếu folder images chưa tồn tại
mkdir d:\0.APP\1510\long-sang-forge\public\images
```

### 3. **Copy ảnh vào đúng vị trí**

```
d:\0.APP\1510\long-sang-forge\
└── public/
    └── images/
        └── profile.jpg  <-- ĐẶT ẢNH VÀO ĐÂY
```

### 4. **Format ảnh khuyến nghị:**

- **Định dạng**: JPG hoặc PNG
- **Kích thước**: 1000x1400px (tỷ lệ 5:7)
- **Chất lượng**: High quality (>200KB)
- **Background**: Dark/professional (như ảnh bạn đã có)

---

## 🎨 Những gì đã thay đổi

### ✅ **Đã làm:**

1. Thay icon `<User />` bằng `<img />`
2. Thêm hover effects professional
3. Thêm gradient overlay khi hover
4. Responsive cho mọi screen sizes
5. Fallback nếu ảnh không load được

### 🎨 **Effects mới:**

- **Hover scale**: Card phóng to nhẹ khi hover
- **Gradient overlay**: Hiệu ứng gradient từ dưới lên
- **Shadow**: Shadow 2xl cho depth
- **Smooth transition**: Animation mượt mà
- **Object-cover**: Ảnh luôn fill đầy không bị méo

---

## 🚀 Test ngay

1. **Copy ảnh vào folder:**

   ```
   public/images/profile.jpg
   ```

2. **Refresh browser:**

   ```
   http://localhost:8080/
   ```

3. **Kiểm tra:**
   - ✅ Ảnh hiển thị đẹp
   - ✅ Hover có effect
   - ✅ Responsive trên mobile
   - ✅ Load nhanh

---

## 🔧 Tùy chỉnh thêm (nếu cần)

### Nếu muốn điều chỉnh position ảnh

```tsx
// Trong HeroSection.tsx, dòng 88
className="w-full h-full object-cover object-top"  // Focus vào phần trên
// hoặc
className="w-full h-full object-cover object-center"  // Center (mặc định)
```

### Nếu muốn thay đổi kích thước khung

```tsx
// Dòng 84
lg:w-[500px] h-[400px] lg:h-[600px]  // Hiện tại
// Thay thành:
lg:w-[600px] h-[500px] lg:h-[700px]  // Lớn hơn
```

---

## 📝 Tên file khác (optional)

Nếu bạn muốn đặt tên khác cho ảnh (VD: `longsang.jpg`):

1. **Đổi tên file** trong code:

```tsx
// File: HeroSection.tsx, line 86
src="/images/longsang.jpg"  // Thay vì profile.jpg
```

---

## 🎯 Kết quả mong đợi

Sau khi thêm ảnh, hero section sẽ có:

- ✅ Ảnh chân dung professional xịn sò
- ✅ Hover effects smooth
- ✅ Perfect trên mọi devices
- ✅ Fast loading với optimization

**Professional branding chuẩn chỉnh! 🚀**
