# 🚀 Multi-Project Migration Guide

## Cách chạy Migration qua Transaction Pooler

### Bước 1: Lấy Database Password

1. Mở: <https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/settings/database>
2. Scroll xuống phần **Connection String**
3. Chọn tab **Transaction**
4. Click "Show password" hoặc copy connection string
5. Password sẽ có dạng: `postgres://postgres.xxx:[password]@...`

### Bước 2: Cập nhật .env

Thêm vào file `.env`:

```env
SUPABASE_DB_PASSWORD=your-actual-password-here
```

**Lưu ý:** Đừng commit password vào git!

### Bước 3: Cài package pg

```bash
npm install pg
```

### Bước 4: Chạy Migration

```bash
node scripts/migrate-showcase-pooler.mjs
```

## 📊 Kết quả mong đợi

```
🚀 Running Multi-Project Migration via Transaction Pooler...
✅ Transaction started
📝 Adding slug column...
✅ Added slug column
📝 Adding icon column...
✅ Added icon column
📝 Adding production_url column...
✅ Added production_url column
📝 Creating unique index on slug...
✅ Created unique index
📝 Updating sabo-arena record...
✅ Updated sabo-arena: {
  app_id: 'sabo-arena',
  app_name: 'SABO ARENA',
  slug: 'sabo-arena',
  icon: '🎱',
  production_url: 'https://longsang.org'
}
✅ Transaction committed successfully!
🎉 Migration completed successfully!
```

## ✅ Sau khi migration xong, test ngay

- **List**: <http://localhost:8082/app-showcase>
- **Detail**: <http://localhost:8082/app-showcase/sabo-arena>

## 🔧 Troubleshooting

### Lỗi "password authentication failed"

→ Kiểm tra lại `SUPABASE_DB_PASSWORD` trong .env

### Lỗi "column already exists"

→ Bình thường! Script sẽ skip nếu column đã tồn tại

### Lỗi connection timeout

→ Thử lại, hoặc dùng Session mode (port 5432) thay vì Transaction mode

## 🎯 Tại sao dùng Transaction Pooler?

✅ **Connection pooling** - Hiệu suất cao hơn  
✅ **Transaction support** - ALTER TABLE trong transaction  
✅ **Production-ready** - Tối ưu cho production  
✅ **Rollback** - Tự động rollback nếu có lỗi  
