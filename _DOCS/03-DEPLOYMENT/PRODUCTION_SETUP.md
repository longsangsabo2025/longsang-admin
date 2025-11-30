# 🚀 PRODUCTION DEPLOYMENT GUIDE

## 📋 Checklist Trước Khi Deploy

- [ ] Build frontend: `npm run build`
- [ ] Kiểm tra `.env` có đủ biến production
- [ ] Cài PM2 global: `npm install -g pm2`
- [ ] Setup Nginx/Apache reverse proxy
- [ ] Cấu hình SSL certificate (HTTPS)
- [ ] Setup database backup tự động
- [ ] Cấu hình firewall

## 🎯 Các Bước Deploy Production

### Step 1: Build Frontend

```bash
# Tại root folder
npm run build

# Kiểm tra dist/ folder đã tạo
ls dist/
```

### Step 2: Start API Server với PM2

```bash
# Start API server
pm2 start ecosystem.config.json --env production

# Hoặc manual:
pm2 start api/server.js --name sabo-api -i max --env production
```

### Step 3: Serve Frontend Build

```bash
# Option 1: Dùng PM2 serve
pm2 serve dist 8080 --name sabo-frontend --spa

# Option 2: Dùng Nginx (khuyên dùng)
# Xem config Nginx bên dưới
```

### Step 4: Save PM2 Config

```bash
# Save PM2 để auto-start sau khi reboot
pm2 save

# Setup PM2 startup script
pm2 startup
# → Copy và chạy lệnh nó suggest
```

### Step 5: Verify

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Monitor realtime
pm2 monit
```

## 🔧 PM2 Commands Quan Trọng

### Quản Lý Processes

```bash
pm2 start ecosystem.config.json    # Start all apps
pm2 stop all                        # Stop all
pm2 restart all                     # Restart all
pm2 reload all                      # Zero-downtime reload
pm2 delete all                      # Remove all from PM2

pm2 stop sabo-api                   # Stop specific app
pm2 restart sabo-api                # Restart specific app
```

### Monitoring & Logs

```bash
pm2 status                          # List all processes
pm2 monit                           # Real-time monitoring
pm2 logs                            # View all logs
pm2 logs sabo-api                   # View specific app logs
pm2 logs --lines 100                # View last 100 lines
pm2 flush                           # Clear all logs
```

### Update Code (Zero Downtime)

```bash
# Pull new code
git pull origin main

# Rebuild frontend
npm run build

# Reload API without downtime
pm2 reload sabo-api

# Restart frontend
pm2 restart sabo-frontend
```

### Cluster Mode (Multi-Core)

```bash
# Start với max CPU cores
pm2 start api/server.js -i max --name sabo-api

# Start với 4 instances
pm2 start api/server.js -i 4 --name sabo-api

# Scale up/down
pm2 scale sabo-api +2   # Add 2 more instances
pm2 scale sabo-api 4    # Set to exactly 4 instances
```

## 🌐 Nginx Configuration (Khuyên Dùng)

### File: `/etc/nginx/sites-available/sabo-arena`

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React Build)
    location / {
        root /var/www/sabo-arena/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Reverse Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Support (nếu cần)
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
}
```

### Enable Nginx Config

```bash
# Link config
sudo ln -s /etc/nginx/sites-available/sabo-arena /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔒 SSL Certificate (Free với Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto renewal (certbot tự động setup)
sudo certbot renew --dry-run
```

## 🗄️ Database Backup Automation

### Cron Job cho Auto Backup

```bash
# Edit crontab
crontab -e

# Add backup script (chạy hàng ngày lúc 2 AM)
0 2 * * * /usr/bin/pg_dump -U postgres sabo_arena > /backups/sabo_$(date +\%Y\%m\%d).sql

# Xóa backup cũ hơn 30 ngày
0 3 * * * find /backups -name "sabo_*.sql" -mtime +30 -delete
```

## 📊 Monitoring Setup

### PM2 Plus (Cloud Monitoring)

```bash
# Link PM2 với PM2 Plus dashboard
pm2 link <secret_key> <public_key>

# Hoặc dùng pm2-logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Check Script

Create `health-check.sh`:

```bash
#!/bin/bash

# Check API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)

if [ $API_STATUS -ne 200 ]; then
    echo "API is down! Restarting..."
    pm2 restart sabo-api
    # Send notification (email/Slack/Discord)
fi

# Check Frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

if [ $FRONTEND_STATUS -ne 200 ]; then
    echo "Frontend is down! Restarting..."
    pm2 restart sabo-frontend
fi
```

Run every 5 minutes:

```bash
*/5 * * * * /path/to/health-check.sh >> /var/log/health-check.log 2>&1
```

## 🐳 Docker Production (Alternative)

### Build Docker Images

```bash
# Build frontend
docker build -t sabo-frontend -f Dockerfile.frontend .

# Build API
docker build -t sabo-api -f Dockerfile.api .
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  frontend:
    image: sabo-frontend
    restart: always
    ports:
      - "8080:80"
    depends_on:
      - api
    networks:
      - sabo-network

  api:
    image: sabo-api
    restart: always
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - postgres
    networks:
      - sabo-network

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: sabo_arena
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - sabo-network

volumes:
  postgres-data:

networks:
  sabo-network:
    driver: bridge
```

Start production stack:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ⚡ Performance Optimization

### Node.js Production Settings

```bash
# Trong ecosystem.config.json
{
  "apps": [{
    "name": "sabo-api",
    "script": "server.js",
    "cwd": "./api",
    "instances": "max",
    "exec_mode": "cluster",
    "env_production": {
      "NODE_ENV": "production",
      "NODE_OPTIONS": "--max-old-space-size=2048"
    }
  }]
}
```

### Enable HTTP/2 trong Nginx

```nginx
listen 443 ssl http2;
```

### Enable Gzip Compression

Already included in Nginx config above.

## 🔥 Firewall Setup

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to API port
# (chỉ cho phép qua Nginx reverse proxy)

# Enable firewall
sudo ufw enable
```

## 📱 Quick Commands Cheat Sheet

```bash
# Deploy new version
git pull && npm run build && pm2 reload all

# View logs
pm2 logs --lines 50

# Check status
pm2 status && curl http://localhost:3001/api/health

# Restart everything
pm2 restart all

# Stop everything
pm2 stop all

# Monitor realtime
pm2 monit
```

## 🆘 Troubleshooting

### API không start

```bash
# Check logs
pm2 logs sabo-api --lines 100

# Check port
netstat -tulpn | grep :3001

# Restart
pm2 restart sabo-api
```

### Database connection error

```bash
# Check Postgres running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d sabo_arena -c "SELECT 1"
```

### High memory usage

```bash
# Check PM2 apps
pm2 status

# Restart to free memory
pm2 restart all

# Set memory limit trong ecosystem.config.json
"max_memory_restart": "500M"
```

---

**🎯 TÓM LẠI:**

| Environment | Command | Auto Restart | Background |
|-------------|---------|--------------|------------|
| **Development** | `npm start` | Có (concurrently) | ❌ |
| **Production** | `pm2 start ecosystem.config.json --env production` | ✅ | ✅ |

**Production = PM2 + Nginx + SSL + Monitoring + Auto Backup** 🚀
