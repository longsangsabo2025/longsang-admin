# Monitoring Guide

Comprehensive guide for monitoring LongSang Admin AI Copilot.

---

## Overview

Monitoring helps ensure system reliability, performance, and early detection of issues.

---

## Health Checks

### Basic Health Check

```bash
curl http://localhost:3001/api/health
```

**Response:**
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

**Status Codes:**
- `200` - OK (all services healthy)
- `200` - DEGRADED (some services degraded)
- `503` - ERROR (critical services down)

### Automated Health Checks

Setup monitoring to check `/api/health` every 5 minutes:

**Example (cron):**
```bash
*/5 * * * * curl -f http://localhost:3001/api/health || alert-admin
```

**Example (monitoring service):**
- UptimeRobot
- Pingdom
- Datadog

---

## Metrics Endpoint

### Get All Metrics

```bash
curl http://localhost:3001/api/metrics
```

**Response includes:**
- Request statistics
- Response times (avg, min, max, percentiles)
- Error rates
- Cache statistics
- Performance metrics
- Uptime information

### Get Endpoint-Specific Metrics

```bash
curl http://localhost:3001/api/metrics/endpoint/api/copilot/chat
```

### Time Window

```bash
# Last hour (default)
curl http://localhost:3001/api/metrics?timeWindow=3600000

# Last 24 hours
curl http://localhost:3001/api/metrics?timeWindow=86400000
```

---

## Key Metrics to Monitor

### Performance Metrics

1. **Response Times**
   - Target: < 500ms (95th percentile)
   - Alert if: > 1000ms

2. **Throughput**
   - Requests per second
   - Track trends

3. **Error Rate**
   - Target: < 1%
   - Alert if: > 5%

### Cache Metrics

1. **Hit Rate**
   - Target: > 70%
   - Alert if: < 50%

2. **Cache Size**
   - Monitor memory usage
   - Alert if: excessive growth

### Database Metrics

1. **Connection Pool**
   - Active connections
   - Alert if: near limit

2. **Query Performance**
   - Slow query count
   - Alert if: > 10 slow queries/hour

### Resource Metrics

1. **Memory Usage**
   - Target: < 80% of available
   - Alert if: > 90%

2. **CPU Usage**
   - Target: < 70%
   - Alert if: > 90%

3. **Disk Usage**
   - Monitor log files
   - Alert if: > 80%

---

## Alert Configuration

### Critical Alerts

**Triggers:**
- Health check returns ERROR
- Error rate > 10%
- Service completely down
- Data loss detected

**Actions:**
- Immediate notification
- Page on-call engineer
- Create incident ticket

### Warning Alerts

**Triggers:**
- Health check returns DEGRADED
- Error rate > 5%
- Response time > 1000ms
- Cache hit rate < 50%

**Actions:**
- Send notification
- Create ticket
- Monitor closely

---

## Log Monitoring

### Log Levels

- **ERROR**: Failures, exceptions
- **WARN**: Degraded performance, retries
- **INFO**: Important operations
- **DEBUG**: Detailed execution flow

### Log Aggregation

**Options:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki + Grafana
- CloudWatch (AWS)
- Datadog

### Log Retention

- **Production**: 30 days
- **Errors**: 90 days
- **Audit logs**: 1 year

---

## Error Tracking

### Sentry Integration

1. **Setup**
   - Create Sentry project
   - Configure DSN in environment
   - Install SDK (if not already)

2. **Configuration**
   ```javascript
   // Already configured in error handler
   // Captures errors automatically
   ```

3. **Alerts**
   - New error patterns
   - Error rate spikes
   - Critical errors

---

## Performance Monitoring

### APM Tools

**Options:**
- New Relic
- Datadog APM
- Elastic APM
- Custom metrics endpoint

### Custom Metrics

Monitor via `/api/metrics`:

1. **Response Times by Endpoint**
   ```bash
   curl http://localhost:3001/api/metrics | jq '.metrics.responseTimes'
   ```

2. **Cache Performance**
   ```bash
   curl http://localhost:3001/api/metrics | jq '.metrics.cache'
   ```

3. **Error Rates**
   ```bash
   curl http://localhost:3001/api/metrics | jq '.metrics.errors'
   ```

---

## Dashboard Setup

### Recommended Dashboards

1. **System Health Dashboard**
   - Health check status
   - Service status
   - Overall system status

2. **Performance Dashboard**
   - Response times
   - Throughput
   - Error rates
   - Cache hit rates

3. **Resource Dashboard**
   - Memory usage
   - CPU usage
   - Disk usage
   - Database connections

4. **Business Metrics Dashboard**
   - User activity
   - Commands executed
   - Suggestions generated
   - Workflows created

### Dashboard Tools

- Grafana
- Datadog
- CloudWatch Dashboards
- Custom React dashboard

---

## Alert Channels

### Notification Channels

1. **Email**
   - For warnings and summaries
   - Daily/weekly reports

2. **Slack/Teams**
   - For real-time alerts
   - Error notifications

3. **PagerDuty**
   - For critical alerts
   - On-call escalations

4. **SMS/Phone**
   - For critical issues only
   - Service-down alerts

---

## Monitoring Best Practices

1. **Start Simple**
   - Begin with basic health checks
   - Add metrics gradually

2. **Set Realistic Thresholds**
   - Based on actual performance
   - Allow for normal variation

3. **Avoid Alert Fatigue**
   - Only alert on actionable items
   - Group related alerts
   - Use different severity levels

4. **Regular Review**
   - Review alert effectiveness
   - Adjust thresholds
   - Remove unnecessary alerts

5. **Document Procedures**
   - Document alert responses
   - Keep runbooks updated

---

## Example Monitoring Setup

### Prometheus + Grafana

1. **Export Metrics**
   - Add Prometheus exporter
   - Expose `/api/metrics` in Prometheus format

2. **Configure Prometheus**
   ```yaml
   scrape_configs:
     - job_name: 'longsang-api'
       static_configs:
         - targets: ['localhost:3001']
       metrics_path: '/api/metrics'
   ```

3. **Create Grafana Dashboards**
   - Import dashboard templates
   - Customize for your needs

---

## Metrics Collection

### Automate Metrics Collection

**Cron job example:**
```bash
# Collect metrics every 5 minutes
*/5 * * * * curl -s http://localhost:3001/api/metrics | jq . > /var/log/longsang-metrics/$(date +\%Y\%m\%d\%H\%M).json
```

### Store Metrics

- Time-series database (InfluxDB, TimescaleDB)
- Monitoring service (Datadog, New Relic)
- Simple file storage (for small deployments)

---

**Last Updated:** 27/01/2025
**Version:** 1.0.0

