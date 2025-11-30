# Production Deployment Checklist

Complete checklist for deploying LongSang Admin AI Copilot to production.

---

## Pre-Deployment

### Environment Setup

- [ ] **Environment Variables**
  - [ ] `SUPABASE_URL` - Production Supabase URL
  - [ ] `SUPABASE_SERVICE_KEY` - Production service key
  - [ ] `OPENAI_API_KEY` - Valid OpenAI API key
  - [ ] `NODE_ENV=production`
  - [ ] `API_PORT` - Production API port (default: 3001)
  - [ ] All other required environment variables

- [ ] **Database**
  - [ ] Production Supabase project created
  - [ ] Database connection verified
  - [ ] Backup strategy in place

- [ ] **Infrastructure**
  - [ ] Server/hosting environment ready
  - [ ] Domain configured
  - [ ] SSL certificates installed
  - [ ] Firewall rules configured

---

## Database Migrations

- [ ] **Run Migrations**
  ```bash
  npm run deploy:db
  # or
  supabase db push
  ```

- [ ] **Verify Migrations**
  ```bash
  node scripts/verify-migrations.js
  ```

- [ ] **Verify Tables Exist**
  - [ ] `context_embeddings`
  - [ ] `context_indexing_log`
  - [ ] `copilot_feedback`
  - [ ] `copilot_patterns`
  - [ ] `copilot_preferences`
  - [ ] `copilot_learning_log`

- [ ] **Verify Functions Exist**
  - [ ] `semantic_search` (pgvector)

- [ ] **Verify Extensions**
  - [ ] `pgvector` extension enabled

---

## Data Indexing

- [ ] **Index Existing Data**
  ```bash
  node scripts/index-production-data.js
  ```

- [ ] **Verify Indexing**
  - [ ] Check `context_indexing_log` for successful indexing
  - [ ] Verify embeddings in `context_embeddings` table
  - [ ] Test semantic search functionality

---

## Application Setup

### API Server

- [ ] **Build Production Bundle** (if applicable)
  ```bash
  npm run build
  ```

- [ ] **Start API Server**
  ```bash
  npm run dev:api
  # or use PM2/forever for production
  ```

- [ ] **Verify Health Check**
  ```bash
  curl http://localhost:3001/api/health
  ```

- [ ] **Test API Endpoints**
  - [ ] `/api/copilot/chat`
  - [ ] `/api/copilot/suggestions`
  - [ ] `/api/context/search`
  - [ ] `/api/copilot/analytics/insights`

### Frontend

- [ ] **Build Frontend**
  ```bash
  npm run build
  ```

- [ ] **Deploy Frontend**
  - [ ] Upload to hosting/CDN
  - [ ] Configure base URL
  - [ ] Set environment variables

- [ ] **Verify Frontend**
  - [ ] Can access application
  - [ ] API connections work
  - [ ] Authentication works

---

## Security

- [ ] **Authentication**
  - [ ] Supabase Auth configured
  - [ ] API authentication working
  - [ ] Session management working

- [ ] **Authorization**
  - [ ] Role-based access control (if applicable)
  - [ ] Resource ownership checks

- [ ] **API Security**
  - [ ] Rate limiting enabled
  - [ ] CORS configured correctly
  - [ ] Input validation in place
  - [ ] SQL injection prevention
  - [ ] XSS prevention

- [ ] **Secrets Management**
  - [ ] API keys stored securely
  - [ ] No secrets in codebase
  - [ ] Environment variables secured

---

## Monitoring & Logging

- [ ] **Logging Setup**
  - [ ] Structured logging configured
  - [ ] Log levels set appropriately
  - [ ] Log aggregation configured (if applicable)

- [ ] **Error Tracking**
  - [ ] Sentry or similar configured
  - [ ] Error alerts set up
  - [ ] Error notification working

- [ ] **Monitoring**
  - [ ] Health check monitoring
  - [ ] Performance monitoring
  - [ ] Uptime monitoring

- [ ] **Analytics**
  - [ ] Usage analytics configured
  - [ ] Performance metrics tracked

---

## Testing

- [ ] **Integration Tests**
  ```bash
  npm run test:integration
  ```

- [ ] **E2E Tests**
  ```bash
  npm run test:e2e
  ```

- [ ] **Performance Tests**
  ```bash
  npm run test:performance
  ```

- [ ] **Security Tests**
  ```bash
  npm run test:security
  ```

- [ ] **Manual Testing**
  - [ ] Test Copilot chat flow
  - [ ] Test suggestion generation
  - [ ] Test workflow execution
  - [ ] Test error handling
  - [ ] Test with real users (if possible)

---

## Post-Deployment

- [ ] **Smoke Tests**
  - [ ] Health check endpoint
  - [ ] Basic Copilot functionality
  - [ ] Context retrieval
  - [ ] Suggestion generation

- [ ] **Performance Verification**
  - [ ] Response times acceptable
  - [ ] Cache working correctly
  - [ ] No memory leaks
  - [ ] Database queries optimized

- [ ] **Documentation**
  - [ ] Update deployment docs
  - [ ] Document any changes
  - [ ] Update runbooks

- [ ] **Communication**
  - [ ] Notify team of deployment
  - [ ] Update status page (if applicable)
  - [ ] Prepare rollback plan

---

## Rollback Plan

- [ ] **Rollback Steps Documented**
  - [ ] How to rollback database migrations
  - [ ] How to rollback application version
  - [ ] How to restore from backup

- [ ] **Rollback Triggers**
  - [ ] Critical errors
  - [ ] Performance degradation
  - [ ] Security issues
  - [ ] Data loss

---

## Maintenance

- [ ] **Backup Strategy**
  - [ ] Database backups automated
  - [ ] Backup restoration tested
  - [ ] Backup retention policy

- [ ] **Update Strategy**
  - [ ] How to apply updates
  - [ ] Testing process for updates
  - [ ] Rollback procedure

- [ ] **Monitoring Alerts**
  - [ ] Error rate alerts
  - [ ] Performance alerts
  - [ ] Resource usage alerts

---

## Success Criteria

- [ ] All health checks passing
- [ ] All tests passing
- [ ] Performance metrics within targets
- [ ] No critical errors in logs
- [ ] Users can access and use Copilot
- [ ] Context retrieval working
- [ ] Suggestions generating correctly

---

## Quick Command Reference

```bash
# Production setup
node scripts/production-setup.js

# Verify migrations
node scripts/verify-migrations.js

# Index production data
node scripts/index-production-data.js

# Health check
curl http://localhost:3001/api/health

# Run tests
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security
```

---

**Last Updated:** 27/01/2025
**Version:** 1.0.0

