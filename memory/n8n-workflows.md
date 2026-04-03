# n8n Workflows — Reference

## Location

Workflow JSON files: `D:\0.PROJECTS\00-MASTER-ADMIN\workflows\n8n\`
n8n running at: http://localhost:5678
API Key: in `workflows/n8n/.env` as N8N_API_KEY

## Available Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| youtube-crew-trigger.json | Webhook + Schedule (Mon/Wed/Fri) | Triggers YouTube pipeline, polls status, Telegram notify |
| daily-ai-topic-research.json | Cron 6AM | Google News+Reddit scan → Telegram |
| auto-script-writer.json | Telegram reply | AI script generation |
| social-media-auto-post.json | Webhook/Cron | Multi-platform posts |
| daily-business-report.json | Cron 9PM | Business metrics → Telegram |
| content-idea-bank.json | Telegram "idea:" | AI idea expansion |
| ai-video-generation.json | Webhook | AI video gen with Telegram notify |
| google-calendar-v2.json | - | Google Calendar integration |

## Telegram Bot

Bot: LongSang AI Assistant
Token: in admin/.env as TELEGRAM_BOT_TOKEN (8205041225:AAEbqQuD-...)
Admin Chat ID: 554888288

## Setup Guide

See: workflows/n8n/SETUP_GUIDE.md

## n8n API Usage

```bash
# List workflows
curl -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows

# Trigger workflow by webhook
curl -X POST http://localhost:5678/webhook/youtube-trigger
```
