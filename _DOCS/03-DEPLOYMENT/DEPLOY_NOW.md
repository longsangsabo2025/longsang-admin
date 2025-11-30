# 🚀 QUICK DEPLOYMENT - 2 PHÚT

## ✅ Đã chuẩn bị sẵn

- ✅ Database schema: `supabase/migrations/app_showcase_schema.sql`
- ✅ Service layer: Đã migrate sang Supabase API
- ✅ Real-time updates: Supabase subscriptions
- ✅ Credentials: Có đủ keys trong `.env`

---

## 🎯 Deploy Schema (Chỉ 3 bước)

### Bước 1: Mở Supabase SQL Editor

Browser đã mở tự động, hoặc click:
👉 <https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql/new>

### Bước 2: Copy SQL

Mở file này trong VS Code:

```
supabase/migrations/app_showcase_schema.sql
```

Nhấn `Ctrl + A` → `Ctrl + C` (copy toàn bộ)

### Bước 3: Paste & Run

1. Paste vào SQL Editor (Ctrl + V)
2. Click nút **RUN** (góc phải dưới) hoặc nhấn `Ctrl + Enter`
3. Chờ 2-3 giây
4. Thấy ✅ "Success. No rows returned" → Xong!

---

## 🧪 Test ngay

### 1. Mở Admin Dashboard

```
http://localhost:8081/app-showcase/admin
```

### 2. Kiểm tra

- Trang load được → ✅ Database connected
- Thấy default data (SABO Arena) → ✅ Default insert worked
- Console (F12) không có lỗi → ✅ Service layer OK

### 3. Test Save

- Sửa Tagline thành: "Test Production Database"
- Click **Lưu Thay Đổi**
- Reload trang → Tagline vẫn là "Test Production Database" → ✅ Save works!

### 4. Test Public Showcase

```
http://localhost:8081/app-showcase
```

- Thấy content mới → ✅ Real-time sync works!

---

## 📊 Architecture Info

### Connection Types

**Transaction Pooler (Port 6543)** - Đang dùng cho app:

```
postgresql://postgres.diexsbzqwsbpilsymnfb:***@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

- ✅ Tốt cho: SELECT, INSERT, UPDATE, DELETE queries
- ✅ Connection pooling: Nhanh, hiệu quả
- ✅ Đã config trong `.env`: `VITE_SUPABASE_DB_URL`

**Direct Connection (Port 5432)** - Chỉ dùng cho migrations:

```
postgresql://postgres.diexsbzqwsbpilsymnfb:***@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

- ✅ Tốt cho: CREATE TABLE, ALTER TABLE, migrations
- ❌ Không dùng cho app queries (slow, no pooling)

### Tại sao deploy qua SQL Editor?

- ✅ Sử dụng direct connection tự động
- ✅ Không cần config thêm
- ✅ Có UI để xem errors (nếu có)
- ✅ An toàn, có thể rollback

---

## ✅ Success Checklist

- [ ] SQL chạy thành công (no errors)
- [ ] Admin dashboard load được
- [ ] Thấy default SABO Arena data
- [ ] Save changes works
- [ ] Public showcase updates real-time
- [ ] Reload browser, data vẫn còn

---

## 🐛 Troubleshooting

### Lỗi: "relation already exists"

→ Schema đã deploy rồi, skip bước này

### Lỗi: "Failed to load data"

→ Check Console (F12) → Xem error message chi tiết

### Admin không load data

→ Check `.env` có đủ keys:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

**Ready?** Làm theo 3 bước trên là xong! 🚀
