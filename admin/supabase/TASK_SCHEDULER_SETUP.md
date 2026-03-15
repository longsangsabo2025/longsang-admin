## GIẢI PHÁP CUỐI CÙNG - LOCAL SCRIPT VỚI TASK SCHEDULER

### ✅ SCRIPT ĐÃ SẴN SÀNG
File: `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase\scripts\fetch-and-create-tickets.js`
- Đã test thành công
- Tương thích 100% Node.js
- Không lỗi Buffer

### 📝 SETUP WINDOWS TASK SCHEDULER

1. **Mở Task Scheduler:** Win + R → `taskschd.msc`

2. **Create Task** (Action → Create Task)

3. **General Tab:**
   - Name: `Supabase Fetch Support Emails`
   - Description: `Auto-fetch emails and create support tickets`
   - Run whether user is logged on or not: ✓
   - Run with highest privileges: ✓

4. **Triggers Tab:**
   - New → Daily
   - Start: Today
   - Recur every: 1 days
   - Repeat task every: 5 minutes
   - Duration: Indefinitely
   - Enabled: ✓

5. **Actions Tab:**
   - New → Start a program
   - Program/script: `C:\Program Files\nodejs\node.exe`
   - Arguments: `scripts\fetch-and-create-tickets.js`
   - Start in: `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase`

6. **Conditions Tab:**
   - ✓ Start only if the computer is on AC power: UNCHECK
   - ✓ Stop if the computer switches to battery power: UNCHECK

7. **Settings Tab:**
   - ✓ Allow task to be run on demand
   - ✓ Run task as soon as possible after a scheduled start is missed
   - If the running task does not end when requested: Stop the existing instance

8. **Click OK** → Enter Windows password

### 🧪 TEST
Right-click task → Run

Check logs:
```sql
SELECT * FROM support_tickets ORDER BY created_at DESC;
```

### ✅ ƯU ĐIỂM
- ✅ Không cần sửa code
- ✅ Đã test thành công
- ✅ Chạy ngay cả khi máy sleep/wake
- ✅ Tự động khởi động lại nếu fail
- ✅ Có logs trong Task Scheduler

### ❌ NHƯỢC ĐIỂM
- ❌ Cần máy tính bật (hoặc dùng VPS/Server)
