# Hệ thống Đặt lịch Tư vấn

## 🎯 Tổng quan

Hệ thống đặt lịch tư vấn hoàn chỉnh được xây dựng ngay trong ứng dụng, không phụ thuộc vào nền tảng bên thứ ba. Hệ thống bao gồm:

- ✅ Đặt lịch trực tuyến cho khách hàng
- ✅ Quản lý lịch làm việc
- ✅ Xác nhận/hủy cuộc hẹn
- ✅ Kiểm tra khung giờ trống tự động
- ✅ Nhiều loại tư vấn
- ✅ Giao diện thân thiện

## 📦 Cài đặt

### 1. Chạy Migration Database

Kết nối vào Supabase và chạy migration:

```bash
# Nếu dùng Supabase CLI
supabase db push

# Hoặc copy nội dung file migration vào Supabase SQL Editor
# File: supabase/migrations/20250111_create_consultation_booking.sql
```

### 2. Cấu hình Ban đầu

Sau khi chạy migration, hệ thống đã tự động tạo sẵn 4 loại tư vấn:

1. **Tư vấn AI Agent** - 60 phút
2. **Tư vấn Automation** - 60 phút  
3. **Tư vấn SEO** - 45 phút
4. **Tư vấn nhanh** - 30 phút

## 🚀 Sử dụng

### Cho Admin/Consultant

#### 1. Cấu hình lịch làm việc

Truy cập: `/admin/consultations`

1. Click nút **"Cấu hình lịch làm việc"**
2. Chọn ngày trong tuần
3. Thêm các khung giờ làm việc (VD: 9:00 - 17:00)
4. Lưu cấu hình

**Ví dụ cấu hình:**

```
Thứ 2: 09:00 - 12:00, 14:00 - 18:00
Thứ 3: 09:00 - 12:00, 14:00 - 18:00
Thứ 4: 09:00 - 12:00
Thứ 5: 09:00 - 12:00, 14:00 - 18:00
Thứ 6: 09:00 - 12:00, 14:00 - 17:00
```

#### 2. Quản lý cuộc hẹn

Tại trang `/admin/consultations`, bạn có thể:

- ✅ Xem danh sách tất cả cuộc hẹn
- ✅ Xác nhận cuộc hẹn mới (status: pending → confirmed)
- ✅ Hủy cuộc hẹn
- ✅ Đánh dấu hoàn thành
- ✅ Xem thông tin liên hệ khách hàng

#### 3. Thêm ngày nghỉ

Sử dụng API function:

```typescript
import { addUnavailableDate } from '@/lib/api/consultations';

await addUnavailableDate('2025-01-20', 'Nghỉ Tết');
```

### Cho Khách hàng

#### Đặt lịch tư vấn

Truy cập: `/consultation`

**Bước 1: Chọn loại tư vấn**

- Chọn từ danh sách các loại tư vấn có sẵn

**Bước 2: Chọn ngày**

- Sử dụng calendar để chọn ngày
- Chỉ hiển thị các ngày có sẵn trong tương lai

**Bước 3: Chọn giờ**

- Hệ thống hiển thị các khung giờ trống
- Các khung giờ đã được đặt sẽ bị vô hiệu hóa

**Bước 4: Điền thông tin**

- Họ tên (*)
- Email (*)
- Số điện thoại
- Ghi chú

**Bước 5: Xác nhận**

- Kiểm tra lại thông tin
- Click "Đặt lịch tư vấn"
- Nhận thông báo thành công

## 📊 Database Schema

### Bảng `consultations`

Lưu thông tin các cuộc tư vấn

```sql
- id: UUID
- consultant_id: UUID (người tư vấn)
- client_name: VARCHAR(255)
- client_email: VARCHAR(255)
- client_phone: VARCHAR(50)
- consultation_date: DATE
- start_time: TIME
- end_time: TIME
- duration_minutes: INTEGER
- status: VARCHAR(50) [pending, confirmed, cancelled, completed, no_show]
- consultation_type: VARCHAR(100)
- notes: TEXT
- meeting_link: TEXT
```

### Bảng `availability_settings`

Cấu hình lịch làm việc

```sql
- id: UUID
- user_id: UUID
- day_of_week: INTEGER [0-6, Sunday=0]
- start_time: TIME
- end_time: TIME
- is_available: BOOLEAN
```

### Bảng `unavailable_dates`

Các ngày nghỉ/không làm việc

```sql
- id: UUID
- user_id: UUID
- date: DATE
- reason: TEXT
```

### Bảng `consultation_types`

Các loại tư vấn

```sql
- id: UUID
- name: VARCHAR(255)
- description: TEXT
- duration_minutes: INTEGER
- price: DECIMAL
- color: VARCHAR(7)
- is_active: BOOLEAN
```

## 🔧 API Functions

### Consultations

```typescript
// Lấy danh sách tư vấn
getConsultations(filters?: {
  consultant_id?: string;
  client_email?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}): Promise<Consultation[]>

// Tạo cuộc tư vấn mới
createConsultation(consultation: Omit<Consultation, 'id'>): Promise<Consultation>

// Cập nhật
updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation>

// Hủy
cancelConsultation(id: string, reason?: string): Promise<void>
```

### Availability

```typescript
// Lấy cấu hình
getAvailabilitySettings(userId?: string): Promise<AvailabilitySetting[]>

// Cập nhật cấu hình
setAvailability(settings: AvailabilitySetting[]): Promise<void>

// Kiểm tra khung giờ trống
getAvailableTimeSlots(
  consultantId: string,
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]>
```

### Ngày nghỉ

```typescript
// Lấy danh sách
getUnavailableDates(userId?: string): Promise<UnavailableDate[]>

// Thêm ngày nghỉ
addUnavailableDate(date: string, reason?: string): Promise<void>

// Xóa
removeUnavailableDate(id: string): Promise<void>
```

## 🎨 Components

### BookingForm

Form đặt lịch cho khách hàng

```tsx
import { BookingForm } from '@/components/consultation/BookingForm';

<BookingForm 
  consultantId="user-id"
  onSuccess={() => {
    // Handle success
  }}
/>
```

### ConsultationManager  

Quản lý lịch cho admin

```tsx
import { ConsultationManager } from '@/components/consultation/ConsultationManager';

<ConsultationManager consultantId="user-id" />
```

## 🔐 Security

Hệ thống sử dụng Row Level Security (RLS) của Supabase:

- ✅ Bất kỳ ai cũng có thể đặt lịch (INSERT)
- ✅ Chỉ consultant mới xem được lịch của mình
- ✅ Chỉ consultant mới có thể cập nhật/xóa lịch của mình
- ✅ Khách hàng có thể xem lịch của mình qua email

## 📱 Tính năng nâng cao (Coming soon)

- [ ] Email thông báo tự động
- [ ] SMS reminder
- [ ] Tích hợp Google Calendar
- [ ] Zoom/Meet link tự động
- [ ] Thanh toán trực tuyến (nếu có phí)
- [ ] Đánh giá sau tư vấn
- [ ] Chatbot hỗ trợ đặt lịch

## 🚨 Troubleshooting

### Không thấy khung giờ nào

- Kiểm tra đã cấu hình lịch làm việc chưa
- Kiểm tra ngày chọn có nằm trong ngày nghỉ không
- Kiểm tra consultant_id có đúng không

### Lỗi khi đặt lịch

- Kiểm tra database migration đã chạy chưa
- Kiểm tra RLS policies đã được tạo chưa
- Xem console log để biết lỗi chi tiết

### Email không nhận được

- Tính năng email notification chưa được implement
- Cần cấu hình SMTP server

## 📞 Support

Nếu gặp vấn đề, vui lòng:

1. Check console log
2. Xem Supabase logs
3. Liên hệ team dev

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-11
