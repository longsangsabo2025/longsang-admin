# 📅 Hệ thống Đặt lịch Tư vấn

> Hệ thống đặt lịch tư vấn hoàn chỉnh, 100% nội bộ, không phụ thuộc Calendly hay nền tảng bên thứ ba!

## ⚡ Quick Start

### 1. Chạy Migration

**Option A: Supabase CLI** (khuyến nghị)

```bash
# Linux/Mac
./setup-consultation-booking.sh

# Windows
setup-consultation-booking.bat
```

**Option B: Manual**

1. Mở Supabase SQL Editor
2. Copy nội dung file `supabase/migrations/20250111_create_consultation_booking.sql`
3. Chạy

### 2. Cấu hình lịch làm việc

1. Login admin
2. Vào `/admin/consultations`
3. Click **"Cấu hình lịch làm việc"**
4. Thêm khung giờ cho từng ngày trong tuần
5. Lưu

### 3. Share với khách hàng

```
https://yourdomain.com/consultation
```

## 📍 Routes

| URL | Mô tả | Quyền |
|-----|-------|-------|
| `/consultation` | Trang đặt lịch công khai | Public |
| `/admin/consultations` | Quản lý lịch hẹn | Admin only |

## 🎯 Tính năng

✅ Đặt lịch online  
✅ Nhiều loại tư vấn  
✅ Calendar picker  
✅ Time slots tự động  
✅ Xác nhận/Hủy/Hoàn thành  
✅ Cấu hình lịch làm việc  
✅ Ngày nghỉ  
✅ Mobile responsive  

## 📖 Documentation

- **Chi tiết:** [CONSULTATION_BOOKING_GUIDE.md](./CONSULTATION_BOOKING_GUIDE.md)
- **Tổng kết:** [CONSULTATION_SYSTEM_COMPLETE.md](./CONSULTATION_SYSTEM_COMPLETE.md)

## 💡 So với Calendly

| | Hệ thống này | Calendly |
|-|--------------|----------|
| Chi phí | **Miễn phí** | $8-12/tháng |
| Tùy chỉnh | **100%** | Giới hạn |
| Sở hữu data | **✅** | ❌ |
| Branding | **Của bạn** | Có logo Calendly |

## 🛠️ Tech Stack

- React + TypeScript
- Supabase (PostgreSQL)
- shadcn/ui
- React Router

## 📦 Files

```
📁 Consultation Booking System
├── 📄 supabase/migrations/20250111_create_consultation_booking.sql
├── 📄 src/lib/api/consultations.ts
├── 📁 src/components/consultation/
│   ├── BookingForm.tsx
│   └── ConsultationManager.tsx
├── 📁 src/pages/
│   ├── ConsultationBooking.tsx
│   └── AdminConsultations.tsx
└── 📄 Documentation files
```

## ✅ Status

**🟢 Production Ready** - Version 1.0.0

---

Phát triển: 2025-01-11 | Status: ✅ Complete
