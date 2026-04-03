# HEARTBEAT.md

## Active Checks

When you receive a heartbeat, rotate through these (2-4x per day):

### Service Health
- Check pm2 status: are all services running?
- Check API Gateway health: GET http://localhost:3001/health
- Check n8n: GET http://localhost:5678/healthz
- Check OpenClaw: `openclaw doctor --quiet`

### Cron Jobs
- `openclaw cron list` — any errors? (check status column)
- Review most recent run output for action items

### Memory Maintenance (every 3-4 days)
- Read recent `memory/YYYY-MM-DD.md` files
- Distill important points into `MEMORY.md`
- Clean outdated entries from MEMORY.md

## Quiet Hours

- Late night 23:00-08:00 VN time: HEARTBEAT_OK unless urgent
- Skip if checked < 30 min ago

## Track State

`memory/heartbeat-state.json`
```json
{
  "lastChecks": {
    "services": null,
    "cron": null,
    "memory_maintenance": null
  }
}
```
