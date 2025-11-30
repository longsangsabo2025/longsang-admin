# 🚀 SUPABASE DEPLOYMENT GUIDE - App Showcase CMS

## ✅ Trạng thái Production

- **Database Schema**: ✅ Đã tạo (`supabase/migrations/app_showcase_schema.sql`)
- **Service Layer**: ✅ Đã migrate sang Supabase API
- **Supabase Config**: ✅ Đã có credentials trong `.env`
- **Next Step**: 🔄 Deploy SQL schema lên Supabase

---

## 📋 Bước 1: Deploy Database Schema

### Cách 1: Supabase Dashboard (Recommended - Nhanh nhất)

1. Mở trình duyệt, vào Supabase Dashboard:

   ```
   https://app.supabase.com/project/diexsbzqwsbpilsymnfb
   ```

2. Login với tài khoản Supabase của bạn

3. Vào **SQL Editor**:
   - Sidebar bên trái → Click **SQL Editor**
   - Hoặc truy cập: <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql>

4. Tạo New Query:
   - Click **New Query** (góc trên phải)

5. Copy toàn bộ nội dung file:

   ```bash
   # Mở file này trong VS Code:
   supabase/migrations/app_showcase_schema.sql
   ```

6. Paste vào SQL Editor và click **Run** (hoặc Ctrl/Cmd + Enter)

7. Kiểm tra kết quả:
   - Nếu thành công: "Success. No rows returned"
   - Nếu lỗi: Đọc error message để debug

### Cách 2: Supabase CLI (Nếu có cài đặt)

```bash
# 1. Login Supabase CLI
npx supabase login

# 2. Link project
npx supabase link --project-ref diexsbzqwsbpilsymnfb

# 3. Deploy migration
npx supabase db push

# 4. Hoặc run trực tiếp SQL file
npx supabase db execute -f supabase/migrations/app_showcase_schema.sql
```

---

## 🔍 Bước 2: Verify Database

Sau khi deploy xong, kiểm tra database:

### 1. Check Table tồn tại

Vào SQL Editor, chạy query:

```sql
-- Kiểm tra table đã được tạo
SELECT * FROM app_showcase LIMIT 10;

-- Xem structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'app_showcase';
```

### 2. Check Storage Bucket

- Sidebar → **Storage**
- Tìm bucket tên: `app-showcase`
- Nếu chưa có, tạo bằng tay:
  - Click **New Bucket**
  - Bucket name: `app-showcase`
  - Public bucket: ✅ (checked)
  - Click **Create**

### 3. Check RLS Policies

```sql
-- Xem tất cả policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'app_showcase';
```

Expected: 5 policies

- `Public read published apps`
- `Authenticated users can read all apps`
- `Authenticated users can insert apps`
- `Authenticated users can update apps`
- `Service role can delete apps`

---

## ⚙️ Bước 3: Test Connection từ App

### 1. Mở App Admin

```
http://localhost:8081/app-showcase/admin
```

### 2. Load Data

Mở Console (F12) → Console tab, xem logs:

```
Loading app showcase data for: sabo-arena
```

Nếu thành công: Data sẽ load từ database (default SABO Arena data đã được insert)

### 3. Test Save

- Thay đổi bất kỳ field nào (ví dụ: Tagline)
- Click **Lưu Thay Đổi**
- Check Console: "Data saved successfully!"
- Reload trang → Data vẫn giữ nguyên (đã lưu vào Supabase)

### 4. Test Real-time Updates

- Mở 2 tabs:
  - Tab 1: Admin (`/app-showcase/admin`)
  - Tab 2: Public showcase (`/app-showcase`)
- Edit ở Tab 1, save
- Tab 2 tự động update (real-time subscription)

---

## 🖼️ Bước 4: Test Image Upload

### 1. Upload Logo

- Admin → **Branding Tab**
- Click **Chọn Logo**
- Chọn file ảnh (PNG/JPG)
- Click **Lưu Thay Đổi**

### 2. Verify Storage

- Supabase Dashboard → **Storage** → `app-showcase` bucket
- Thấy folder `screenshots/` với file vừa upload
- Click file → Copy URL → Paste vào browser → Ảnh hiển thị

---

## 🐛 Troubleshooting

### Lỗi: "relation 'app_showcase' does not exist"

**Nguyên nhân**: Chưa chạy SQL migration

**Giải pháp**: Làm lại Bước 1 (Deploy Schema)

---

### Lỗi: "Failed to load app showcase data"

**Nguyên nhân**: RLS policies chặn read

**Giải pháp**:

```sql
-- Tạm tắt RLS để test
ALTER TABLE app_showcase DISABLE ROW LEVEL SECURITY;

-- Test load data
-- Nếu được, enable lại và fix policies
ALTER TABLE app_showcase ENABLE ROW LEVEL SECURITY;
```

---

### Lỗi: "Failed to upload image"

**Nguyên nhân**: Storage bucket chưa tạo hoặc policies sai

**Giải pháp**:

1. Check bucket tồn tại: Dashboard → Storage → `app-showcase`

2. Check policies:

```sql
-- List storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'app-showcase';
```

Expected: 4 policies (read public, insert/update/delete authenticated)

1. Nếu thiếu, chạy lại phần storage của migration SQL:

```sql
-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-showcase', 'app-showcase', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
CREATE POLICY "Public read access" ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'app-showcase');

-- ... (copy các policies khác từ migration file)
```

---

### Lỗi: "Supabase client not initialized"

**Nguyên nhân**: Environment variables chưa load

**Giải pháp**:

1. Check `.env` có keys:

```bash
VITE_SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

1. Restart dev server:

```bash
npm run dev
```

---

## ✅ Success Checklist

Sau khi deploy xong, bạn phải có:

- [x] Table `app_showcase` tồn tại trong database
- [x] Storage bucket `app-showcase` đã tạo
- [x] 5 RLS policies cho table
- [x] 4 Storage policies cho bucket
- [x] Default SABO Arena data đã insert
- [x] Admin dashboard load được data
- [x] Admin có thể save changes
- [x] Public showcase hiển thị đúng data
- [x] Image upload works (storage)
- [x] Real-time updates work (cross-tab sync)

---

## 🎯 Next Steps (Optional)

### 1. Add Authentication

Protect admin dashboard với Supabase Auth:

```typescript
// Check if user logged in
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
  window.location.href = '/login';
}
```

### 2. Add Image Optimization

Resize images on upload:

```typescript
// Install sharp
npm install sharp

// Optimize before upload
const optimizedImage = await sharp(file)
  .resize(800, 600)
  .webp({ quality: 80 })
  .toBuffer();
```

### 3. Add Version History

Track changes over time:

```sql
CREATE TABLE app_showcase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id TEXT NOT NULL,
  data JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📞 Support

Nếu gặp vấn đề:

1. Check Console (F12) → Console tab
2. Check Network tab → Filter "supabase"
3. Check Supabase Dashboard → Logs
4. Copy error message để debug

---

**Status**: 🟢 **PRODUCTION READY** (sau khi deploy schema)

Service layer đã migrate xong, chỉ cần deploy SQL là app sẽ chạy production!
