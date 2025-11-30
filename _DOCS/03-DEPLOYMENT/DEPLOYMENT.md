# Deployment Guide

## Overview

This guide covers deployment processes for LongSang Forge across different environments.

## Prerequisites

- Vercel account (for hosting)
- Supabase account (for database)
- GitHub repository access
- Environment variables configured
- Domain name (optional for custom domain)

## Environment Setup

### Local Development

1. **Install dependencies**

   ```bash
   npm install
   cd api && npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Required variables:

   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key

   # OpenAI
   VITE_OPENAI_API_KEY=your_openai_key

   # Google APIs
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_secret

   # Other services
   RESEND_API_KEY=your_resend_key
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:8081
   - API: http://localhost:3001

### Staging Environment

Staging mirrors production for testing.

1. **Create staging branch**

   ```bash
   git checkout -b staging
   ```

2. **Deploy to Vercel staging**

   ```bash
   vercel --prod=false
   ```

3. **Configure staging environment variables** in Vercel dashboard

## Production Deployment

### Initial Setup

#### 1. Vercel Configuration

**Frontend Deployment:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import GitHub repository
3. Configure build settings:

   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. Add environment variables in Vercel dashboard

**API Deployment:**

The API runs as Vercel Serverless Functions:

```javascript
// api/index.js
export default function handler(req, res) {
  // Your API logic
}
```

#### 2. Supabase Configuration

1. Create project at [Supabase Dashboard](https://app.supabase.com/)

2. **Database Setup:**

   ```bash
   # Link to Supabase project
   supabase link --project-ref your-project-ref

   # Push database schema
   supabase db push
   ```

3. **Enable Row-Level Security:**

   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
   -- ... for all tables
   ```

4. **Create RLS Policies:**

   ```sql
   -- Example: Users can only read their own profile
   CREATE POLICY "Users can read own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = id);

   -- Example: Users can update their own profile
   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = id);
   ```

5. **Setup Supabase Functions:**
   ```bash
   # Deploy edge functions
   supabase functions deploy trigger-content-writer
   supabase functions deploy send-scheduled-emails
   supabase functions deploy publish-social-posts
   ```

#### 3. Domain Configuration

**Custom Domain Setup:**

1. Add domain in Vercel dashboard
2. Configure DNS records:

   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

3. Enable HTTPS (automatic with Vercel)

### Deployment Process

#### Automated Deployment (Recommended)

1. **Push to production branch**

   ```bash
   git checkout production
   git merge main
   git push origin production
   ```

2. **Vercel auto-deploys** on push to production branch

3. **Verify deployment**
   - Check Vercel deployment logs
   - Test critical features
   - Monitor error tracking

#### Manual Deployment

```bash
# Deploy frontend
npm run build
vercel --prod

# Deploy database changes
supabase db push

# Deploy functions
npm run deploy:functions
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API endpoints tested
- [ ] Performance optimized (Lighthouse score > 90)
- [ ] Security audit passed
- [ ] Backup database
- [ ] Update CHANGELOG.md
- [ ] Tag release in Git

## Database Migrations

### Creating Migrations

```bash
# Create new migration
supabase migration new add_user_preferences

# Edit migration file in supabase/migrations/
# Example: 20250117_add_user_preferences.sql
```

```sql
-- Add new column
ALTER TABLE profiles
ADD COLUMN preferences JSONB DEFAULT '{}'::JSONB;

-- Create index
CREATE INDEX idx_profiles_preferences
ON profiles USING GIN (preferences);
```

### Running Migrations

```bash
# Local
supabase db reset

# Production
supabase db push --db-url $DATABASE_URL
```

### Migration Best Practices

1. **Test migrations locally first**
2. **Make migrations reversible** (include DOWN migration)
3. **Backup before migrating production**
4. **Run during low-traffic periods**
5. **Monitor after deployment**

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"

### Database Rollback

```bash
# Restore from backup
supabase db restore backup_file.sql

# Or revert specific migration
supabase migration revert --version 20250117
```

### Emergency Rollback

```bash
# Quick rollback to last known good state
git revert HEAD
git push origin production

# Vercel will auto-deploy the reverted version
```

## Monitoring & Maintenance

### Health Checks

**Frontend:**

```typescript
// src/lib/health-check.ts
export const healthCheck = async () => {
  try {
    const response = await fetch("/api/health");
    return response.ok;
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
};
```

**API:**

```javascript
// api/routes/health.js
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.VERSION,
  });
});
```

### Logging

**Setup Winston Logger:**

```typescript
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});
```

### Error Tracking

**Sentry Integration (Planned):**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

**Web Vitals:**

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

const sendToAnalytics = (metric) => {
  // Send to analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Backup & Recovery

### Database Backups

**Automated Backups:**

- Supabase provides automatic daily backups
- Retention: 7 days (free tier), 30 days (pro tier)

**Manual Backups:**

```bash
# Export database
supabase db dump > backup_$(date +%Y%m%d).sql

# Store in secure location (S3, Google Drive, etc.)
```

**Restore from Backup:**

```bash
supabase db reset
psql -h db.supabase.co -U postgres -d postgres < backup.sql
```

### File Storage Backups

```bash
# Backup Supabase Storage bucket
supabase storage export bucket-name ./backups/
```

## Troubleshooting

### Common Issues

#### Build Failures

**Issue:** Module not found errors

```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue:** TypeScript errors

```bash
# Solution: Check types and regenerate
npm run typecheck
```

#### Deployment Failures

**Issue:** Environment variables not set

```bash
# Solution: Verify in Vercel dashboard
vercel env ls
```

**Issue:** Database connection timeout

```bash
# Solution: Check Supabase status and connection string
curl https://status.supabase.com
```

#### Runtime Errors

**Issue:** CORS errors

```javascript
// Solution: Configure CORS in API
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
```

**Issue:** 500 Internal Server Error

```bash
# Solution: Check logs
vercel logs your-deployment-url
```

## Security Checklist

### Pre-Deployment Security

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled (force redirect)
- [ ] CORS properly configured
- [ ] Rate limiting enabled on API
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF protection (tokens)
- [ ] Authentication required for protected routes
- [ ] Row-Level Security enabled in database

### Post-Deployment Security

- [ ] SSL certificate valid
- [ ] Security headers configured
- [ ] Content Security Policy (CSP) enabled
- [ ] Dependencies up to date (`npm audit fix`)
- [ ] No sensitive data in logs
- [ ] Error messages don't expose system details

## Performance Optimization

### Frontend Optimization

```typescript
// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Image optimization
<Image
  src="/image.jpg"
  width={800}
  height={600}
  loading="lazy"
  format="webp"
/>

// Bundle analysis
npm run build -- --analyze
```

### API Optimization

```javascript
// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
});

// Caching
const cache = new NodeCache({ stdTTL: 600 });

app.get("/api/users", async (req, res) => {
  const cached = cache.get("users");
  if (cached) return res.json(cached);

  const users = await fetchUsers();
  cache.set("users", users);
  res.json(users);
});
```

### Database Optimization

```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

## Scaling Considerations

### Horizontal Scaling

- **Vercel**: Automatic scaling based on traffic
- **Supabase**: Upgrade to Pro tier for more connections
- **CDN**: Use Vercel Edge Network for static assets

### Vertical Scaling

- Upgrade Supabase instance size
- Optimize database queries
- Implement caching layer (Redis)

## Support & Resources

- **Documentation**: https://docs.longsang.com
- **Support Email**: support@longsang.com
- **Status Page**: https://status.longsang.com
- **Community Discord**: https://discord.gg/longsang

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
