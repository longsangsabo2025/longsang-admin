# OpenClaw Configuration Reference

## Gateway

- URL: ws://127.0.0.1:18789
- Mode: local, bind=loopback
- Auto-start: Windows Scheduled Task + Startup folder

## Agents

| ID | Workspace | Model |
|----|-----------|-------|
| main | D:\0.PROJECTS\00-MASTER-ADMIN | google/gemini-2.5-flash |
| lyblack | D:\0.PROJECTS\AI Influencer\LyBlack-Content | google/gemini-2.5-flash |
| sabo | D:\0.PROJECTS\02-SABO-ECOSYSTEM | google/gemini-2.5-flash |
| dev | D:\0.PROJECTS\01-MAIN-PRODUCTS | google/gemini-2.5-flash |

## Cron Jobs

| ID | Name | Schedule | Delivery |
|----|------|----------|---------|
| a28d9c77 | foundation-hourly-sentinel | every 1h | failure-alert → Telegram |
| bab2335e | foundation-daily-brief | 8:00 AM daily | announce → Telegram |
| ba6a0ce9 | foundation-midday-triage | 1:00 PM daily | announce → Telegram |
| af2086fd | foundation-eod-review | 10:00 PM daily | announce → Telegram |
| e1dfcb1b | foundation-weekly-review | 9:00 AM Monday | announce → Telegram |

## Plugins (loaded)

- google-gemini-cli-auth — Gemini auth
- memory-core — file-backed memory search
- telegram — chat channel
- device-pair, phone-control, talk-voice, ollama, sglang, vllm

## Key Config Paths

- Config: C:\Users\admin\.openclaw\openclaw.json
- Env: C:\Users\admin\.openclaw\.env
- Memory DB: C:\Users\admin\.openclaw\memory\main.sqlite

## Useful Commands

```bash
openclaw doctor                  # Health check
openclaw cron list               # See all cron jobs
openclaw channels status         # Check Telegram connection
openclaw memory status           # Check embeddings
openclaw memory index --force    # Force reindex
openclaw gateway restart         # Restart gateway
```
