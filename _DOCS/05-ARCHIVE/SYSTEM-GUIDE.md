# 🤖 LONG SANG AI AUTOMATION - HƯỚNG DẪN SỬ DỤNG

## 🚀 CÁCH KHỞI ĐỘNG NHANH (RECOMMENDED)

### Option 1: Khởi động thủ công (Đơn giản nhất)

```bash
# Double-click file này:
START-SYSTEM.bat
```

### Option 2: Sử dụng PowerShell

```powershell
# Khởi động background với tunnel
.\scripts\system-manager.ps1 -Action start -Background -WithTunnel

# Khởi động local only
.\scripts\system-manager.ps1 -Action start -Background

# Kiểm tra trạng thái
.\scripts\system-manager.ps1 -Action status

# Dừng hệ thống
.\scripts\system-manager.ps1 -Action stop
```

## 🔧 WINDOWS SERVICE (Tự động khởi động với Windows)

### Cài đặt Service (Chạy PowerShell as Administrator)

```powershell
# Cài đặt service
.\scripts\service-manager.ps1 -Action install

# Khởi động service
.\scripts\service-manager.ps1 -Action start

# Kiểm tra trạng thái
.\scripts\service-manager.ps1 -Action status
```

### Gỡ cài đặt Service

```powershell
# Dừng và gỡ service
.\scripts\service-manager.ps1 -Action stop
.\scripts\service-manager.ps1 -Action uninstall
```

## 📊 TRUY CẬP HỆ THỐNG

Sau khi khởi động thành công:

- **🌐 N8N Editor**: <http://localhost:5678>
- **⚛️ React App**: <http://localhost:8080>  
- **🧪 Workflow Tester**: <http://localhost:8080/workflow-test>
- **🌍 Public Tunnel**: Sẽ hiển thị URL trong console

## 🛠️ TROUBLESHOOTING

### Lỗi Port đã được sử dụng

```powershell
# Dừng tất cả services
.\STOP-SYSTEM.bat

# Hoặc kill thủ công
Get-Process -Name "node" | Stop-Process -Force
```

### Kiểm tra trạng thái

```powershell
.\scripts\system-manager.ps1 -Action status
```

### Reset hoàn toàn

```powershell
.\scripts\system-manager.ps1 -Action restart -Background -WithTunnel
```

## 🎯 CÁC WORKFLOWS CÓ SẴN

1. **🏭 Advanced AI Content Factory**
2. **📱 Advanced Social Media Manager**  
3. **📧 Advanced Email Marketing Automation**
4. **🎯 Intelligent Lead Management System**
5. **🤖 AI-Powered Customer Support System**
6. **📈 Business Intelligence Analytics System**

## 💡 TIPS

- Sử dụng `-Background` để chạy trong background
- Sử dụng `-WithTunnel` để có public access
- Service mode tự động khởi động với Windows
- Luôn kiểm tra status trước khi khởi động

## 🆘 HỖ TRỢ

Nếu gặp vấn đề, chạy:

```powershell
.\scripts\system-manager.ps1 -Action status
```

Để xem chi tiết trạng thái hệ thống.
