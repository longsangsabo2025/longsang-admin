# 📱 HƯỚNG DẪN TRUY CẬP TỪ ĐIỆN THOẠI
# =====================================
# 
# Bạn cần chạy script này TRÊN MÁY TÍNH, không phải trên điện thoại!
# Điện thoại chỉ cần mở trình duyệt và nhập URL.

param(
    [switch]$Install
)

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║         📱 REMOTE ACCESS SETUP - LONGSANG ADMIN               ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokInstalled) {
    Write-Host "❌ ngrok chưa được cài đặt!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cách cài đặt ngrok:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Truy cập: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Tải file ngrok cho Windows" -ForegroundColor White
    Write-Host "  3. Giải nén và copy ngrok.exe vào C:\Windows" -ForegroundColor White
    Write-Host "  4. Đăng ký tài khoản tại https://dashboard.ngrok.com" -ForegroundColor White
    Write-Host "  5. Copy authtoken từ dashboard" -ForegroundColor White
    Write-Host "  6. Chạy: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    Write-Host ""
    
    if ($Install) {
        Write-Host "Đang cài đặt ngrok qua winget..." -ForegroundColor Yellow
        winget install ngrok.ngrok
        Write-Host ""
        Write-Host "Sau khi cài xong, chạy lại script này." -ForegroundColor Green
    } else {
        Write-Host "Chạy với -Install để tự động cài: .\SETUP_REMOTE_ACCESS.ps1 -Install" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "✅ ngrok đã được cài đặt" -ForegroundColor Green
Write-Host ""

# Check if services are running
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$port3002 = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue

Write-Host "Kiểm tra services:" -ForegroundColor Yellow
if ($port8080) {
    Write-Host "  ✅ Frontend (8080): Running" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend (8080): NOT Running - Chạy .\START_ALL.ps1 trước!" -ForegroundColor Red
    exit 1
}

if ($port3001) {
    Write-Host "  ✅ API Server (3001): Running" -ForegroundColor Green
} else {
    Write-Host "  ❌ API Server (3001): NOT Running" -ForegroundColor Red
}

if ($port3002) {
    Write-Host "  ✅ MCP Server (3002): Running" -ForegroundColor Green
} else {
    Write-Host "  ❌ MCP Server (3002): NOT Running" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Đang khởi động ngrok tunnel..." -ForegroundColor Yellow
Write-Host "  URL sẽ hiện bên dưới - Copy URL đó vào điện thoại!" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start ngrok
ngrok http 8080
