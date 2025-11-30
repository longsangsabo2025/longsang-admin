# 🎫 PRAGMATIC MVP: SUPPORT TICKET SYSTEM

## ✅ HOÀN THÀNH

### 1. Database Schema
- ✅ `support_tickets` - Lưu tickets
- ✅ `ticket_messages` - Lưu tin nhắn
- ✅ `inbound_emails` - Log emails
- ✅ Migration đã chạy thành công

### 2. Local Script
- ✅ `scripts/fetch-and-create-tickets.js` - Script chính
- ✅ Kết nối Gmail IMAP
- ✅ Parse emails
- ✅ Tạo tickets tự động
- ✅ Mark emails as read

---

## 🚀 CÁCH SỬ DỤNG

### Bước 1: Setup Cloudflare Email Routing

1. Truy cập: https://dash.cloudflare.com
2. Chọn domain: `longsang.org`
3. Sidebar: **Email** → **Email Routing**
4. Click: **Enable Email Routing**
5. Cloudflare sẽ tự động thêm DNS records
6. Tạo addresses:
   - `support@longsang.org` → `longsangsabo@gmail.com`
   - `hello@longsang.org` → `longsangsabo@gmail.com`
   - `contact@longsang.org` → `longsangsabo@gmail.com`

### Bước 2: Test Email Receiving

Gửi email test đến `support@longsang.org` và check Gmail.

### Bước 3: Chạy Script

```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase
npm run tickets:fetch
```

**Script sẽ:**
1. Kết nối Gmail IMAP
2. Tìm emails UNSEEN
3. Filter emails gửi đến support/hello/contact@longsang.org
4. Parse email content
5. Tạo ticket trong database
6. Mark email as READ

### Bước 4: Verify

```sql
-- Check tickets
SELECT * FROM support_tickets ORDER BY created_at DESC;

-- Check messages
SELECT * FROM ticket_messages ORDER BY created_at DESC;

-- Check inbound log
SELECT * FROM inbound_emails ORDER BY received_at DESC;
```

---

## 📋 WORKFLOW

```
Customer sends email
        ↓
support@longsang.org
        ↓
Cloudflare Email Routing (Forward)
        ↓
longsangsabo@gmail.com
        ↓
YOU RUN: npm run tickets:fetch
        ↓
Script reads Gmail IMAP
        ↓
Creates ticket in Supabase
        ↓
Marks email as READ
```

---

## 🎯 TIẾP THEO (Optional)

### Option A: Auto-run với Cron
```bash
# Windows Task Scheduler
# Chạy mỗi 5 phút
schtasks /create /tn "Fetch Support Tickets" /tr "node d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase\scripts\fetch-and-create-tickets.js" /sc minute /mo 5
```

### Option B: n8n Workflow
1. n8n → Schedule Trigger (mỗi 5 phút)
2. Execute Command: `npm run tickets:fetch`
3. Notify Telegram nếu có ticket mới

### Option C: Admin UI
- Xem danh sách tickets
- Reply khách hàng (qua Gmail SMTP - đã có)
- Update ticket status

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Authentication failed"
- Check `GMAIL_APP_PASSWORD` trong `.env.gmail`
- Tạo lại App Password: https://myaccount.google.com/apppasswords

### Lỗi: "Database connection failed"
- Check `DATABASE_URL` trong `.env`
- Test: `node scripts/run-support-migration.js`

### Không tìm thấy emails
- Check Gmail: Có email UNREAD không?
- Check script filter: Email có gửi đến `support@` không?

---

## ✨ ƯU ĐIỂM CỦA CÁCH NÀY

✅ **Đơn giản**: Chỉ 1 script, chạy local  
✅ **Ổn định**: Không phụ thuộc deployment  
✅ **Dễ debug**: Console.log rõ ràng  
✅ **Linh hoạt**: Dễ thêm logic mới  
✅ **Chi phí 0**: Không cần thêm service nào  

---

## 🎉 KẾT QUẢ

Bạn đã có **Support Ticket System MVP** hoạt động được:
- ✅ Nhận email từ customers
- ✅ Tự động tạo tickets
- ✅ Lưu vào database
- ✅ Có thể reply sau (qua Gmail SMTP)

**Giờ bạn có thể:**
1. Test ngay bằng cách gửi email
2. Chạy script để import
3. Check database
4. Build Admin UI (nếu muốn)
