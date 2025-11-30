# AI Command Center - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase project configured
- n8n server running
- OpenAI API key
- Environment variables set

## Environment Variables

Create `.env` file with:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-key

# n8n
N8N_URL=http://localhost:5678
N8N_API_KEY=your-n8n-key

# API
API_PORT=3001
NODE_ENV=production
```

## Step 1: Database Migrations

Run migrations:

```bash
node run-ai-command-migrations.js
```

Or manually in Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run each migration file:
   - `supabase/migrations/20250127_ai_suggestions.sql`
   - `supabase/migrations/20250127_intelligent_alerts.sql`
   - `supabase/migrations/20250127_workflow_metrics.sql`

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build Frontend

```bash
npm run build
```

## Step 4: Start Services

### Development

```bash
npm run dev
```

### Production

```bash
# Backend
cd api && node server.js

# Frontend (if using separate server)
npm run preview
```

## Step 5: Verify Deployment

1. **Health Check**

   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test Command API**

   ```bash
   curl -X POST http://localhost:3001/api/ai/command \
     -H "Content-Type: application/json" \
     -d '{"command": "Tạo bài post về test"}'
   ```

3. **Check Database Tables**
   - Verify `ai_suggestions` table exists
   - Verify `intelligent_alerts` table exists
   - Verify `workflow_metrics` table exists

## Step 6: Setup Monitoring

### Sentry (Error Tracking)

1. Install Sentry:

```bash
npm install @sentry/react @sentry/vite-plugin
```

2. Configure in `vite.config.ts`:

```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'your-org',
      project: 'your-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

3. Initialize in `src/main.tsx`:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

## Troubleshooting

### Migration Errors

- Check Supabase connection
- Verify service key permissions
- Check table names don't conflict

### API Errors

- Check environment variables
- Verify OpenAI API key
- Check n8n server status

### Frontend Errors

- Check build output
- Verify API endpoints
- Check browser console

## Support

For issues, check:

- Error logs in Sentry
- API server logs
- Browser console
- Supabase logs
