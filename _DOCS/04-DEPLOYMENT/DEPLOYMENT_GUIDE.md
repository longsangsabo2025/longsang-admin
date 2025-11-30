# Deployment Guide

Complete guide for deploying LongSang Admin AI Copilot to production.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase)
- OpenAI API key
- Production server/hosting environment
- Domain and SSL certificates

---

## Pre-Deployment Checklist

1. **Environment Variables**
   - All required environment variables set
   - Secrets stored securely
   - Production values configured

2. **Database**
   - Production Supabase project created
   - Database backups configured
   - Connection verified

3. **Infrastructure**
   - Server resources allocated
   - Network configuration done
   - Firewall rules configured

---

## Step 1: Environment Setup

### 1.1 Clone and Setup

```bash
git clone <repository-url>
cd longsang-admin
npm install
```

### 1.2 Configure Environment

Create `.env` file with production values:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# API
API_PORT=3001
NODE_ENV=production

# Logging
LOG_LEVEL=INFO
```

### 1.3 Verify Environment

```bash
node scripts/production-setup.js
```

This will verify all environment variables and configuration.

---

## Step 2: Database Setup

### 2.1 Run Migrations

```bash
# Option 1: Using npm script
npm run deploy:db

# Option 2: Using Supabase CLI
supabase db push
```

### 2.2 Verify Migrations

```bash
node scripts/verify-migrations.js
```

This verifies all required tables and functions exist.

### 2.3 Enable Extensions

Ensure `pgvector` extension is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Step 3: Index Production Data

### 3.1 Start API Server

```bash
npm run dev:api
```

### 3.2 Index Data

```bash
node scripts/index-production-data.js
```

This indexes all existing projects, workflows, and executions.

### 3.3 Verify Indexing

Check `context_indexing_log` table for indexing results:

```sql
SELECT * FROM context_indexing_log
ORDER BY created_at DESC
LIMIT 10;
```

---

## Step 4: Build and Deploy

### 4.1 Build Frontend

```bash
npm run build
```

This creates production-ready frontend bundle in `dist/` directory.

### 4.2 Deploy Frontend

Upload `dist/` directory to your hosting/CDN:

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Custom Server**: Upload `dist/` to web server

### 4.3 Deploy API Server

#### Option A: PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start API server
pm2 start api/server.js --name "longsang-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on reboot
pm2 startup
```

#### Option B: Docker

```bash
docker build -t longsang-api .
docker run -d -p 3001:3001 --env-file .env longsang-api
```

#### Option C: Systemd Service

Create `/etc/systemd/system/longsang-api.service`:

```ini
[Unit]
Description=LongSang API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/longsang-admin
ExecStart=/usr/bin/node api/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Start service:

```bash
sudo systemctl enable longsang-api
sudo systemctl start longsang-api
```

---

## Step 5: Verify Deployment

### 5.1 Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "OK",
  "services": {
    "database": { "status": "OK" },
    "openai": { "status": "OK" },
    "cache": { "status": "OK" }
  }
}
```

### 5.2 Test Endpoints

```bash
# Test Copilot chat
curl -X POST http://localhost:3001/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test-user"}'

# Test context search
curl "http://localhost:3001/api/context/search?q=test"
```

### 5.3 Frontend Verification

1. Open application in browser
2. Verify API connection works
3. Test Copilot functionality
4. Check authentication

---

## Step 6: Post-Deployment

### 6.1 Setup Monitoring

- Configure health check monitoring
- Setup error tracking (Sentry)
- Configure uptime monitoring

### 6.2 Setup Logging

- Configure log aggregation
- Setup log rotation
- Configure log retention

### 6.3 Setup Backups

- Database backups automated
- Backup restoration tested
- Backup retention policy configured

---

## Rollback Procedure

If deployment fails:

1. **Rollback Database**
   ```bash
   # Restore from backup or revert migrations
   supabase db reset
   ```

2. **Rollback Application**
   ```bash
   # Stop current version
   pm2 stop longsang-api

   # Start previous version
   pm2 start api/server.js --name "longsang-api" -- <previous-version>
   ```

3. **Rollback Frontend**
   - Deploy previous frontend build
   - Clear CDN cache if applicable

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Maintenance

See [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) for daily operations and maintenance procedures.

---

**Last Updated:** 27/01/2025
**Version:** 1.0.0

