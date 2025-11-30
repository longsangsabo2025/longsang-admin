# 🚀 CHẠY MIGRATION NGAY BÂY GIỜ

## Cách 1: Supabase SQL Editor (Khuyến nghị - Nhanh nhất!)

### Bước 1: Mở Supabase Dashboard

```
https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb
```

### Bước 2: Vào SQL Editor

1. Click vào tab **SQL Editor** ở sidebar bên trái
2. Click **New query**

### Bước 3: Copy & Run SQL

1. Mở file: `supabase/migrations/20250111_create_consultation_booking.sql`
2. Copy toàn bộ nội dung (Ctrl+A, Ctrl+C)
3. Paste vào SQL Editor
4. Click **Run** (hoặc Ctrl+Enter)

### Bước 4: Verify

Sau khi chạy xong, kiểm tra:

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('consultations', 'consultation_types', 'availability_settings', 'unavailable_dates');

-- Check consultation types
SELECT * FROM consultation_types;
```

Nếu thấy 4 rows với:

- Tư vấn AI Agent
- Tư vấn Automation  
- Tư vấn SEO
- Tư vấn nhanh

✅ **THÀNH CÔNG!**

---

## Cách 2: Supabase CLI (Nếu có cài)

```bash
# Make sure you're in project directory
cd d:\0.APP\1510\long-sang-forge

# Link to project (first time only)
supabase link --project-ref diexsbzqwsbpilsymnfb

# Run migration
supabase db push
```

---

## Cách 3: Python Script (Alternative)

```bash
# Install supabase client
pip install supabase

# Run migration script
python run_consultation_migration.py
```

---

## ✅ Sau khi migration thành công

1. **Start dev server:**

   ```bash
   npm run dev
   ```

2. **Login as admin:**
   - Go to: <http://localhost:5173/admin/login>

3. **Configure availability:**
   - Go to: <http://localhost:5173/admin/consultations>
   - Click "Cấu hình lịch làm việc"
   - Add your working hours

4. **Test booking:**
   - Go to: <http://localhost:5173/consultation>
   - Try booking an appointment

5. **Check in admin:**
   - Back to: <http://localhost:5173/admin/consultations>
   - See your test booking
   - Confirm it!

---

## 🎉 Ready to go

System is now ready for production. Share this link with customers:

```
https://yourdomain.com/consultation
```

---

## 🆘 Troubleshooting

### "Table already exists"

✅ This is OK! It means tables were already created.

### "Permission denied"

❌ Make sure you're using the SERVICE_ROLE_KEY, not ANON_KEY

### "Cannot connect to Supabase"

❌ Check your .env file has correct VITE_SUPABASE_URL

### Migration runs but no data

❌ Check RLS policies are created. Run this:

```sql
SELECT * FROM pg_policies WHERE tablename IN ('consultations', 'consultation_types', 'availability_settings', 'unavailable_dates');
```

Should see multiple policies for each table.

---

**Status:** Ready to run! ⚡
**Time needed:** 2 minutes ⏱️
**Difficulty:** Easy 😊
