# Troubleshooting Guide

Common issues and solutions for LongSang Admin AI Copilot.

---

## Database Issues

### Problem: Database connection failed

**Symptoms:**
- Error: "Database connection failed"
- API returns 503 errors
- Health check shows database as ERROR

**Solutions:**

1. **Check connection string**
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_KEY
   ```

2. **Test connection manually**
   ```bash
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
   supabase.from('projects').select('id').limit(1).then(console.log);
   "
   ```

3. **Check firewall rules**
   - Ensure server IP is whitelisted in Supabase
   - Check network connectivity

### Problem: Missing tables

**Symptoms:**
- Error: "relation does not exist"
- Migration verification fails

**Solutions:**

1. **Run migrations**
   ```bash
   npm run deploy:db
   ```

2. **Verify migrations applied**
   ```bash
   node scripts/verify-migrations.js
   ```

3. **Check migration status**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations;
   ```

---

## API Issues

### Problem: API server won't start

**Symptoms:**
- Port already in use
- Missing dependencies

**Solutions:**

1. **Check port availability**
   ```bash
   # Windows
   netstat -ano | findstr :3001

   # Linux/Mac
   lsof -i :3001
   ```

2. **Kill process using port**
   ```bash
   # Windows
   taskkill /PID <pid> /F

   # Linux/Mac
   kill <pid>
   ```

3. **Reinstall dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Problem: API returns 500 errors

**Symptoms:**
- Random 500 errors
- Error logs show exceptions

**Solutions:**

1. **Check logs**
   ```bash
   # PM2 logs
   pm2 logs longsang-api

   # Systemd logs
   journalctl -u longsang-api -f
   ```

2. **Check environment variables**
   ```bash
   node scripts/production-setup.js
   ```

3. **Verify OpenAI API key**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

---

## Context Retrieval Issues

### Problem: Context retrieval slow

**Symptoms:**
- Slow response times
- Timeouts

**Solutions:**

1. **Check cache**
   ```javascript
   // Check cache stats
   GET /api/metrics
   ```

2. **Verify embeddings exist**
   ```sql
   SELECT COUNT(*) FROM context_embeddings;
   ```

3. **Re-index data**
   ```bash
   node scripts/index-production-data.js
   ```

### Problem: No context found

**Symptoms:**
- Empty results
- Low similarity scores

**Solutions:**

1. **Index more data**
   ```bash
   node scripts/index-production-data.js
   ```

2. **Check indexing logs**
   ```sql
   SELECT * FROM context_indexing_log
   WHERE status = 'failed'
   ORDER BY created_at DESC;
   ```

3. **Lower similarity threshold**
   - Adjust `similarity_threshold` in API calls

---

## OpenAI API Issues

### Problem: OpenAI API errors

**Symptoms:**
- Error: "Invalid API key"
- Rate limit errors
- Timeout errors

**Solutions:**

1. **Verify API key**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **Check rate limits**
   - Verify account limits
   - Check usage dashboard

3. **Add retry logic**
   - Already implemented in error handler
   - Check retry configuration

---

## Performance Issues

### Problem: Slow response times

**Symptoms:**
- High response times
- Timeouts

**Solutions:**

1. **Check metrics**
   ```bash
   curl http://localhost:3001/api/metrics
   ```

2. **Enable caching**
   - Cache is enabled by default
   - Check cache hit rates

3. **Optimize database queries**
   - Add indexes if needed
   - Review query performance

### Problem: High memory usage

**Symptoms:**
- Memory leaks
- Server crashes

**Solutions:**

1. **Check memory usage**
   ```bash
   # PM2
   pm2 monit

   # System
   top
   ```

2. **Clear cache**
   ```javascript
   // Via API (if endpoint exists)
   POST /api/cache/clear
   ```

3. **Restart server**
   ```bash
   pm2 restart longsang-api
   ```

---

## Frontend Issues

### Problem: Frontend can't connect to API

**Symptoms:**
- CORS errors
- Network errors
- 404 errors

**Solutions:**

1. **Check API URL**
   - Verify `VITE_API_URL` in frontend config
   - Check API server is running

2. **Check CORS configuration**
   - Verify CORS settings in `api/server.js`
   - Check allowed origins

3. **Check network**
   - Verify firewall rules
   - Check DNS resolution

---

## Authentication Issues

### Problem: Authentication fails

**Symptoms:**
- 401 errors
- Session expired

**Solutions:**

1. **Check Supabase Auth**
   - Verify Supabase project settings
   - Check auth configuration

2. **Verify tokens**
   - Check token expiration
   - Verify token format

3. **Check session**
   - Clear browser cookies
   - Re-authenticate

---

## Migration Issues

### Problem: Migration fails

**Symptoms:**
- Migration errors
- Tables not created

**Solutions:**

1. **Check migration syntax**
   ```bash
   # Validate SQL
   psql -f supabase/migrations/YYYYMMDD_migration.sql
   ```

2. **Check permissions**
   - Verify service role key has permissions
   - Check RLS policies

3. **Manual migration**
   - Run SQL directly in Supabase dashboard
   - Check error messages

---

## Common Error Messages

### "Connection refused"

**Cause:** API server not running or wrong port

**Solution:** Start API server and verify port

### "Table does not exist"

**Cause:** Migrations not run

**Solution:** Run migrations with `npm run deploy:db`

### "Rate limit exceeded"

**Cause:** Too many requests

**Solution:** Wait or increase rate limits

### "Invalid API key"

**Cause:** Wrong or expired API key

**Solution:** Verify and update API key in environment

### "Context retrieval timeout"

**Cause:** Slow database or network

**Solution:** Check database performance, increase timeout

---

## Getting Help

If issues persist:

1. Check logs: `pm2 logs` or `journalctl -u service-name`
2. Check metrics: `GET /api/metrics`
3. Check health: `GET /api/health`
4. Review error tracking (Sentry)
5. Contact support team

---

**Last Updated:** 27/01/2025
**Version:** 1.0.0

