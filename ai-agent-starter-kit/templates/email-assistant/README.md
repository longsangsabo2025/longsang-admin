# Email Assistant Template

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure

```bash
cp config.yaml.example config.yaml
```

Edit `config.yaml`:

- Add your OpenAI API key
- Set your email address
- Customize templates

### 3. Run

```bash
python agent.py
```

## How It Works

```
┌─────────────┐
│  Inbox      │
│  (Gmail)    │
└──────┬──────┘
       │ Every 5 min
       ▼
┌─────────────┐
│  Classify   │◄── GPT-4o-mini
│  Email      │
└──────┬──────┘
       │
       ├─► Sales ──────┐
       ├─► Support ────┤
       └─► Complaint ──┤
                       │
                   ┌───▼────────┐
                   │  Generate  │◄── GPT-4o-mini
                   │  Reply     │
                   └───┬────────┘
                       │
                   ┌───▼────────┐
                   │  Approve?  │
                   │  (Manual)  │
                   └───┬────────┘
                       │
                   ┌───▼────────┐
                   │  Send      │
                   └────────────┘
```

## Customization

### Change Reply Language

Edit `config.yaml`:

```yaml
agent:
  language: "english"  # or "vietnamese"
```

### Add New Categories

Edit `config.yaml`:

```yaml
classify:
  urgent:
    - "asap"
    - "urgent"
    - "emergency"

templates:
  urgent: |
    Your urgent request has been received...
```

Update `agent.py`:

```python
def classify_email(self, subject, body):
    prompt = f"""Classify into: sales, support, complaint, or urgent.
    ...
```

### Custom Email Signature

Edit templates in `config.yaml`:

```yaml
templates:
  sales: |
    ...
    
    Best regards,
    John Doe
    Sales Director
    Company Inc.
    phone: +1234567890
```

## Deployment

### Option 1: Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add environment variables
railway variables set OPENAI_API_KEY=sk-...

# 5. Deploy
railway up
```

### Option 2: Docker

```bash
docker build -t email-assistant .
docker run -e OPENAI_API_KEY=sk-... email-assistant
```

## Pricing for Clients

**Setup:**

- Basic: $299 (1 inbox, standard templates)
- Pro: $499 (multiple inboxes, custom templates)
- Enterprise: $999+ (CRM integration, custom AI training)

**Monthly:**

- Starter: $149/month (up to 500 emails)
- Business: $299/month (up to 2000 emails)
- Enterprise: $599/month (unlimited)

**Your Costs:**

- OpenAI API: ~$0.005 per email
- Hosting: $5/month (Railway/Render)
- Total: $10-30/month

**Profit Margin: 90-95%**

## Troubleshooting

### "No module named 'openai'"

```bash
pip install -r requirements.txt
```

### "Invalid API key"

- Check your OpenAI API key in config.yaml
- Make sure you have credits in your OpenAI account

### "No emails found"

- This template uses mock data by default
- Integrate Gmail API for real inbox access
- See: `docs/gmail-integration.md`

## Next Steps

1. Complete Lesson 1.1.2 to deploy to cloud
2. Customize for specific industry (real estate, e-commerce, etc.)
3. Add integrations (Slack, WhatsApp, etc.)
4. Build second agent (Lead Qualifier)

## Support

- Discord: <https://discord.gg/longsang-academy>
- Email: <support@longsang.academy>
- Docs: <https://docs.longsang.academy>
