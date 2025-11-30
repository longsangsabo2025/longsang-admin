# 🚀 SABO ARENA - Quick Start Guide

## 🎯 Chạy Toàn Bộ Hệ Thống - CHỈ 1 LỆNH

### ⚡ Cách Nhanh Nhất (Khuyên Dùng)

**Windows PowerShell:**

```powershell
npm start
```

Hoặc:

```powershell
.\start-all.ps1
```

**Windows Command Prompt:**

```cmd
start-all.bat
```

**Linux/Mac:**

```bash
chmod +x start-all.sh
./start-all.sh
```

## 🎨 Các Lệnh Khác

### Development Mode

```bash
npm run dev              # Chạy Frontend + API cùng lúc
npm run dev:frontend     # Chỉ chạy Frontend (port 8080)
npm run dev:api          # Chỉ chạy API (port 3001)
npm run dev:full         # Chạy Frontend + API + N8N
```

### Production Mode với PM2

```bash
# Install PM2 globally (chỉ cần 1 lần)
npm install -g pm2

# Start all services
pm2 start ecosystem.config.json

# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop all services
pm2 stop all

# Remove from PM2
pm2 delete all
```

## 🌐 Access Points

Sau khi chạy thành công, truy cập:

- 🏠 **Homepage**: <http://localhost:8080>
- 👨‍💼 **Admin Portal**: <http://localhost:8080/admin>
- 🤖 **AI Agent Center**: <http://localhost:8080/agent-center>
- 📊 **Agent Marketplace**: <http://localhost:8080/agent-center> (tab Marketplace)
- 🔔 **Notifications**: Trong Admin Portal (bell icon trên header)
- 🎨 **Theme Toggle**: Trong Admin Portal (sun/moon icon)
- 🔐 **Credentials**: <http://localhost:8080/admin/credentials>
- 📁 **File Manager**: <http://localhost:8080/admin/files>
- 🔧 **API Server**: <http://localhost:3001>

## 🏥 Health Checks

```bash
# Check API
curl http://localhost:3001/api/health

# Check Frontend
curl http://localhost:8080
```

## 🛑 Dừng Tất Cả Services

**PowerShell:**

```powershell
Get-Process -Name node | Stop-Process -Force
```

**Command Prompt:**

```cmd
taskkill /F /IM node.exe
```

**Linux/Mac:**

```bash
pkill -9 node
```

**PM2:**

```bash
pm2 stop all
```

## 📊 Monitoring

### Xem Process đang chạy

**Windows:**

```powershell
Get-Process -Name node | Select-Object Id,ProcessName,StartTime,CPU
```

**Linux/Mac:**

```bash
ps aux | grep node
```

### Xem Logs (với PM2)

```bash
pm2 logs sabo-arena-frontend  # Frontend logs
pm2 logs sabo-arena-api        # API logs
pm2 logs                       # All logs
```

## 🔧 Troubleshooting

### Port đã được sử dụng

**Windows:**

```powershell
# Xem process đang dùng port
netstat -ano | findstr :8080
netstat -ano | findstr :3001

# Kill process
taskkill /F /PID <PID_NUMBER>
```

**Linux/Mac:**

```bash
# Xem và kill process
lsof -ti:8080 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Dependencies lỗi

```bash
# Clear node_modules và reinstall
rm -rf node_modules api/node_modules
npm install
cd api && npm install && cd ..
```

### Database lỗi

```bash
# Re-run migrations
python run_all_migrations.py
```

## 🎯 Tính Năng Mới Đã Được Tích Hợp

✅ **Backend Credential Manager** - AES-256 encryption
✅ **AI Agent Marketplace** - 12 templates sẵn sàng sử dụng
✅ **Real-time Notifications** - Bell icon với badge count
✅ **PWA Support** - Install như native app
✅ **Theme Customization** - Light/Dark/System modes

## 🚀 Auto-Restart Features

### Với PM2 (Production)

- ✅ Auto restart khi crash
- ✅ Cluster mode (multi-core)
- ✅ Log rotation
- ✅ Memory limit monitoring
- ✅ Watch file changes

### Với start-all.ps1 (Development)

- ✅ Auto cleanup old processes
- ✅ Health check monitoring
- ✅ Auto restart nếu API down
- ✅ Colored output logs

## 💡 Tips

1. **Lần đầu chạy:** Dùng `npm start` - đơn giản nhất
2. **Development:** Dùng `npm run dev` - có hot reload
3. **Production:** Dùng PM2 - stable và auto-restart
4. **Docker:** Dùng `docker-compose up` (nếu cần)

---

**Made with ❤️ by SABO ARENA Team**
