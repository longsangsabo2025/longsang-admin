# Operations Runbook

Daily operations and maintenance procedures for LongSang Admin AI Copilot.

---

## Daily Operations

### Morning Checks

1. **Health Check**
   ```bash
   curl http://localhost:3001/api/health
   ```
   - Verify status is "OK"
   - Check all services are healthy

2. **Error Review**
   - Check error tracking (Sentry)
   - Review recent errors
   - Address critical issues

3. **Performance Review**
   ```bash
   curl http://localhost:3001/api/metrics
   ```
   - Review response times
   - Check error rates
   - Monitor cache hit rates

### Monitoring

- **Health Checks**: Every 5 minutes
- **Error Alerts**: Real-time
- **Performance Metrics**: Every hour
- **Log Review**: Daily

---

## Weekly Maintenance

### Data Indexing

1. **Index New Data**
   ```bash
   node scripts/index-production-data.js
   ```

2. **Verify Indexing**
   ```sql
   SELECT
     entity_type,
     COUNT(*) as count,
     MAX(created_at) as last_indexed
   FROM context_embeddings
   GROUP BY entity_type;
   ```

### Cache Maintenance

1. **Check Cache Stats**
   ```bash
   curl http://localhost:3001/api/metrics | jq '.metrics.cache'
   ```

2. **Clear Cache if Needed**
   - Cache clears automatically on TTL
   - Manual clear if issues occur

### Database Maintenance

1. **Check Database Size**
   ```sql
   SELECT
     pg_size_pretty(pg_database_size(current_database())) as size;
   ```

2. **Review Slow Queries**
   - Check query logs
   - Optimize slow queries

---

## Monthly Maintenance

### Performance Optimization

1. **Review Metrics**
   - Analyze response times
   - Identify bottlenecks
   - Optimize slow endpoints

2. **Database Optimization**
   - Analyze table sizes
   - Review indexes
   - Optimize queries

### Security Review

1. **Update Dependencies**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Review Access Logs**
   - Check for suspicious activity
   - Review authentication logs

3. **Rotate Secrets**
   - Update API keys if needed
   - Rotate database credentials

---

## Incident Response

### Service Down

1. **Immediate Actions**
   ```bash
   # Check health
   curl http://localhost:3001/api/health

   # Check logs
   pm2 logs longsang-api

   # Restart if needed
   pm2 restart longsang-api
   ```

2. **Investigation**
   - Check error logs
   - Review metrics
   - Check database connectivity

3. **Recovery**
   - Fix root cause
   - Verify recovery
   - Monitor for stability

### Performance Degradation

1. **Identify Issue**
   ```bash
   # Check metrics
   curl http://localhost:3001/api/metrics

   # Check specific endpoint
   curl http://localhost:3001/api/metrics/endpoint/api/copilot/chat
   ```

2. **Common Causes**
   - Database slow queries
   - Cache issues
   - External API slow
   - Resource constraints

3. **Resolution**
   - Optimize slow queries
   - Clear/invalidate cache
   - Check external API status
   - Scale resources if needed

### Data Issues

1. **Missing Context**
   - Re-index data
   - Check indexing logs
   - Verify embeddings

2. **Incorrect Results**
   - Review context retrieval
   - Check similarity thresholds
   - Verify data quality

---

## Backup Procedures

### Database Backups

1. **Automated Backups**
   - Supabase handles automatic backups
   - Verify backup completion

2. **Manual Backup**
   ```bash
   # Export schema
   pg_dump -h db.host -U user -d database > backup.sql
   ```

### Configuration Backups

1. **Environment Variables**
   - Store securely
   - Version control (encrypted)

2. **Migration Files**
   - Version controlled in git
   - Document changes

---

## Update Procedures

### Application Updates

1. **Pre-Update**
   - Backup database
   - Review changelog
   - Test in staging

2. **Update Process**
   ```bash
   # Pull latest code
   git pull

   # Install dependencies
   npm install

   # Run migrations
   npm run deploy:db

   # Restart service
   pm2 restart longsang-api
   ```

3. **Post-Update**
   - Verify health check
   - Test functionality
   - Monitor for issues

### Dependency Updates

1. **Security Updates**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Regular Updates**
   ```bash
   npm update
   npm test
   ```

---

## Monitoring Checklist

### Health Monitoring

- [ ] API server responding
- [ ] Database connected
- [ ] OpenAI API accessible
- [ ] Cache working
- [ ] All tables exist

### Performance Monitoring

- [ ] Response times < 500ms (95th percentile)
- [ ] Cache hit rate > 70%
- [ ] Error rate < 1%
- [ ] Memory usage stable
- [ ] CPU usage acceptable

### Error Monitoring

- [ ] No critical errors
- [ ] Error rate stable
- [ ] No new error patterns
- [ ] Errors resolved promptly

---

## Escalation Procedures

### Critical Issues

1. **Service Completely Down**
   - Immediate notification
   - All-hands response
   - Rollback if needed

2. **Data Loss**
   - Immediate notification
   - Stop all operations
   - Restore from backup

3. **Security Breach**
   - Immediate notification
   - Secure systems
   - Investigate impact

### Non-Critical Issues

1. **Performance Degradation**
   - Monitor closely
   - Investigate during business hours
   - Document resolution

2. **Minor Errors**
   - Log for review
   - Address in next maintenance window
   - Monitor trends

---

## Useful Commands

### Health & Status

```bash
# Health check
curl http://localhost:3001/api/health

# Metrics
curl http://localhost:3001/api/metrics

# PM2 status
pm2 status

# System resource usage
pm2 monit
```

### Logs

```bash
# PM2 logs
pm2 logs longsang-api

# Systemd logs
journalctl -u longsang-api -f

# Last 100 lines
pm2 logs longsang-api --lines 100
```

### Database

```bash
# Connect to database
psql $DATABASE_URL

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Last Updated:** 27/01/2025
**Version:** 1.0.0

