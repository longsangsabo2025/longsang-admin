# 📘 HƯỚNG DẪN CHẠY SERVER ỔN ĐỊNH 24/7

## 🔍 Tổng quan

Server API của longsang-admin được thiết kế để chạy ổn định với:
- **Global Error Handlers** - Bắt tất cả exceptions, không crash
- **Graceful Shutdown** - Tắt an toàn khi nhận tín hiệu
- **Auto Port Recovery** - Tự động tìm port khác nếu bị chiếm
- **PM2 Support** - Process manager cho production

---

## 🖥️ DEVELOPMENT MODE (Local)

### Cách 1: Chạy trực tiếp
```powershell
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
npm run dev:api
```

### Cách 2: Chạy cả Frontend + API
```powershell
npm run dev
```

### Cách 3: Với nodemon (auto-reload khi sửa code)
```powershell
npm install -g nodemon
nodemon api/server.js
```

---

## 🚀 PRODUCTION MODE (24/7)

### Bước 1: Cài đặt PM2
```powershell
npm install -g pm2
```

### Bước 2: Khởi động với PM2
```powershell
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin

# Khởi động chỉ API
pm2 start ecosystem.config.js --only longsang-api

# Hoặc khởi động cả API + Frontend
pm2 start ecosystem.config.js

# Với môi trường production
pm2 start ecosystem.config.js --env production
```

### Bước 3: Các lệnh PM2 thường dùng
```powershell
# Xem status
pm2 status

# Xem logs real-time
pm2 logs longsang-api

# Monitor CPU/Memory
pm2 monit

# Restart
pm2 restart longsang-api

# Stop
pm2 stop longsang-api

# Xóa process
pm2 delete longsang-api
```

### Bước 4: Auto-start khi khởi động máy (Windows)
```powershell
# Tạo startup script
pm2 startup

# Lưu danh sách processes
pm2 save
```

---

## 📊 MONITORING

### Health Check Endpoint
```
GET http://localhost:3001/api/health

Response:
{
  "status": "OK",
  "timestamp": "2025-11-26T12:00:00.000Z",
  "uptime": 3600.123,
  "memory": { "heapUsed": 50000000 },
  "pid": 12345
}
```

### Kiểm tra server đang chạy
```powershell
# PowerShell
Test-NetConnection -ComputerName localhost -Port 3001

# Hoặc curl
curl http://localhost:3001/api/health
```

---

## 🛠️ TROUBLESHOOTING

### 1. Port 3001 đã bị chiếm
```powershell
# Tìm process đang dùng port 3001
netstat -ano | findstr :3001

# Kill process (thay PID)
taskkill /PID <PID> /F
```

### 2. Server tự thoát
- Kiểm tra logs: `pm2 logs longsang-api`
- Server đã có global error handlers, sẽ KHÔNG crash với exceptions
- Nếu vẫn crash, check file `logs/api-error.log`

### 3. Memory leak
```powershell
# PM2 tự restart khi vượt 500MB
# Xem memory usage
pm2 monit
```

---

## 📁 CẤU TRÚC LOGS

```
longsang-admin/
├── logs/
│   ├── api-combined.log    # Tất cả logs
│   ├── api-out.log         # Console output
│   └── api-error.log       # Errors only
```

---

## 🔐 PRODUCTION CHECKLIST

- [ ] Đổi `NODE_ENV=production` trong .env
- [ ] Tắt debug logs
- [ ] Setup HTTPS với reverse proxy (nginx)
- [ ] Cấu hình firewall
- [ ] Setup log rotation
- [ ] Cài đặt monitoring (PM2 Plus hoặc custom)
- [ ] Backup database định kỳ
- [ ] Cấu hình auto-restart khi boot

---

## 🌐 DEPLOY LÊN VPS (Tương lai)

### 1. Chuẩn bị VPS
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx

# Install PM2
npm install -g pm2
```

### 2. Clone và cài đặt
```bash
git clone <repo>
cd longsang-admin
npm install
```

### 3. Cấu hình Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name admin.longsang.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/longsang-admin/dist;
        try_files $uri /index.html;
    }
}
```

### 4. SSL với Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.longsang.com
```

---

## 💡 TIPS

1. **Luôn dùng PM2** cho production - không bao giờ `node server.js` trực tiếp
2. **Monitor memory** - Node.js có thể leak memory
3. **Log rotation** - PM2 có module pm2-logrotate
4. **Backup logs** - Quan trọng để debug issues
5. **Health checks** - Setup uptime monitoring (UptimeRobot, etc.)
