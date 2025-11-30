# ✅ CHECKLIST - TRIỂN KHAI HỆ THỐNG ĐẶT LỊCH TƯ VẤN

## 🎯 Mục tiêu

Đưa hệ thống đặt lịch tư vấn vào production trong 10 phút!

---

## 📋 Các bước thực hiện

### ✅ BƯỚC 1: Chạy Migration Database (5 phút)

**Option A: Supabase SQL Editor (Khuyến nghị)**

1. [ ] Mở <https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb>
2. [ ] Click vào **SQL Editor** (sidebar trái)
3. [ ] Click **New query**
4. [ ] Mở file `supabase/migrations/20250111_create_consultation_booking.sql`
5. [ ] Copy toàn bộ nội dung
6. [ ] Paste vào SQL Editor
7. [ ] Click **Run** (hoặc Ctrl+Enter)
8. [ ] Đợi ~30 giây
9. [ ] Check kết quả - Should see "Success"

**Verify Migration:**

```sql
SELECT * FROM consultation_types;
```

Phải thấy 4 loại tư vấn ✅

---

### ✅ BƯỚC 2: Test Hệ Thống (2 phút)

1. [ ] Server đang chạy? (npm run dev)
   - ✅ Đang chạy ở <http://localhost:8083>

2. [ ] Mở trình duyệt: <http://localhost:8083/consultation>
   - [ ] Trang load thành công?
   - [ ] Thấy form đặt lịch?
   - [ ] Thấy calendar?

3. [ ] Test public booking page:
   - [ ] Chọn loại tư vấn
   - [ ] Chọn ngày (trong tương lai)
   - [ ] Có thấy "Không có khung giờ khả dụng"? ← Bình thường!

   **Lý do:** Chưa cấu hình availability

---

### ✅ BƯỚC 3: Cấu hình Lịch Làm Việc (3 phút)

1. [ ] Login admin: <http://localhost:8083/admin/login>
   - Email: <admin@example.com> (hoặc user của bạn)
   - Password: ***

2. [ ] Vào: <http://localhost:8083/admin/consultations>

3. [ ] Click nút **"Cấu hình lịch làm việc"**

4. [ ] Thêm khung giờ làm việc:

   **Ví dụ cấu hình:**

   ```
   Thứ 2:
   - 09:00 - 12:00
   - 14:00 - 18:00
   
   Thứ 3:
   - 09:00 - 12:00
   - 14:00 - 18:00
   
   Thứ 4:
   - 09:00 - 12:00
   
   Thứ 5:
   - 09:00 - 12:00
   - 14:00 - 18:00
   
   Thứ 6:
   - 09:00 - 12:00
   - 14:00 - 17:00
   ```

5. [ ] Click **"Lưu cấu hình"**

6. [ ] Thấy thông báo "Đã cập nhật lịch làm việc"? ✅

---

### ✅ BƯỚC 4: Test Đặt Lịch (2 phút)

1. [ ] Quay lại: <http://localhost:8083/consultation>

2. [ ] Chọn loại tư vấn: "Tư vấn nhanh" (30 phút)

3. [ ] Chọn ngày: Mai hoặc ngày trong tuần

4. [ ] Bây giờ có thấy các khung giờ? ✅
   - 09:00 AM
   - 09:30 AM
   - 10:00 AM
   - etc.

5. [ ] Chọn 1 khung giờ (VD: 09:00 AM)

6. [ ] Điền form:

   ```
   Họ tên: Nguyễn Văn A (test)
   Email: test@example.com
   Số ĐT: 0901234567
   Ghi chú: Test booking system
   ```

7. [ ] Click **"Đặt lịch tư vấn"**

8. [ ] Thấy thông báo thành công? ✅
   "Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm."

---

### ✅ BƯỚC 5: Kiểm tra Admin Panel (1 phút)

1. [ ] Vào: <http://localhost:8083/admin/consultations>

2. [ ] Thấy cuộc hẹn vừa đặt trong danh sách? ✅

3. [ ] Thông tin hiển thị đầy đủ:
   - [ ] Ngày & giờ
   - [ ] Tên khách hàng
   - [ ] Email & SĐT
   - [ ] Loại tư vấn
   - [ ] Trạng thái: "Chờ xác nhận" (màu vàng)

4. [ ] Thử xác nhận:
   - [ ] Click nút ✓ (checkmark)
   - [ ] Trạng thái chuyển sang "Đã xác nhận" (màu xanh)? ✅

5. [ ] Thử các action khác:
   - [ ] Hủy (✗)
   - [ ] Đánh dấu hoàn thành

---

### ✅ BƯỚC 6: Test Time Slot Conflict (1 phút)

1. [ ] Quay lại trang booking: /consultation

2. [ ] Chọn cùng ngày và giờ vừa đặt

3. [ ] Khung giờ đó bị **disabled**? ✅
   (Không click được, màu xám)

4. [ ] Chọn khung giờ khác → Đặt được bình thường? ✅

---

## 🎉 HOÀN THÀNH

Nếu tất cả ✅ đều pass → Hệ thống hoạt động 100%!

---

## 📱 Sử dụng thực tế

### Cho Khách hàng

```
Share link: https://yourdomain.com/consultation
```

### Cho Admin

```
Manage: https://yourdomain.com/admin/consultations
```

---

## 🔥 Tính năng đã có

✅ Đặt lịch trực tuyến  
✅ Calendar picker  
✅ Time slots tự động  
✅ Conflict detection  
✅ Nhiều loại tư vấn  
✅ Admin dashboard  
✅ Xác nhận/Hủy/Hoàn thành  
✅ Responsive design  
✅ Real-time updates  

---

## 🚀 Ready for Production

- [ ] Test xong tất cả các bước
- [ ] Cấu hình availability cho production
- [ ] Deploy lên server
- [ ] Share link với khách hàng
- [ ] Monitor bookings trong admin panel

---

## 💡 Tips

1. **Thêm ngày nghỉ:** Sử dụng API `addUnavailableDate()`
2. **Thay đổi giờ làm việc:** Vào admin → Cấu hình lịch làm việc
3. **Tùy chỉnh loại tư vấn:** Edit bảng `consultation_types` trong Supabase
4. **Xem tất cả booking:** Admin panel có filter và search

---

**Thời gian ước tính:** 10-15 phút  
**Độ khó:** ⭐⭐ (Dễ)  
**Yêu cầu:** Biết login admin, biết dùng browser 😄

---

## ❓ Cần hỗ trợ?

- 📖 Xem: `CONSULTATION_BOOKING_GUIDE.md`
- 🚀 Xem: `RUN_MIGRATION_NOW.md`
- 📊 Xem: `CONSULTATION_SYSTEM_COMPLETE.md`

---

✨ **Chúc mừng! Bạn đã có hệ thống đặt lịch tư vấn professional!** 🎉
