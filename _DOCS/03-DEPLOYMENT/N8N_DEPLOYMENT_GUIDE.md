# N8N Workflow Deployment Guide

## Overview

Deploy the AI automation workflows to your n8n instance for complete automation functionality.

## Prerequisites

- N8n instance running (local or cloud)
- OpenAI API key for AI-powered routing
- Supabase database connection configured
- Webhook endpoints accessible

## Step 1: N8n Instance Setup

### Local Development

```bash
# Install n8n globally
npm install n8n -g

# Start n8n
n8n start
```

Access n8n at: `http://localhost:5678`

### Production Setup

- Use n8n cloud: <https://n8n.cloud>
- Or deploy to your server following n8n documentation

## Step 2: Import Workflows

### Import Files

1. Access n8n UI
2. Go to **Workflows** > **Import from file**
3. Import these workflow files in order:

```
workflows/
├── master-orchestrator.json       # Core master control
├── smart-workflow-router.json     # AI-powered routing
└── content-production-factory.json # Content generation
```

### Workflow Details

#### 1. Master Orchestrator

- **File**: `workflows/master-orchestrator.json`
- **Purpose**: Central control for full automation activation
- **Webhook URL**: `/webhook/master-orchestrator`
- **Key Nodes**: 16 nodes including webhook trigger, system analyzer, agent deployment

#### 2. Smart Workflow Router

- **File**: `workflows/smart-workflow-router.json`
- **Purpose**: AI-powered intelligent workflow routing
- **Webhook URL**: `/webhook/smart-workflow-router`
- **Key Nodes**: 12 nodes with OpenAI integration for smart routing

#### 3. Content Production Factory

- **File**: `workflows/content-production-factory.json`
- **Purpose**: Multi-line content production system
- **Webhook URL**: `/webhook/content-production-factory`
- **Key Nodes**: 12 nodes for blog, social, email content generation

## Step 3: Configure Credentials

### Required Credentials in N8n

1. **OpenAI API** (for AI routing and content generation)
2. **Supabase** (for database operations)
3. **HTTP Basic Auth** (for webhook security)

### Setup Credentials

1. Go to **Credentials** in n8n
2. Add **OpenAI API** credential with your API key
3. Add **Supabase** credential with your database URL and key
4. Create **HTTP Basic Auth** for webhook security

## Step 4: Webhook Configuration

### Webhook URLs After Import

```
Master Orchestrator:     POST /webhook/master-orchestrator
Smart Router:           POST /webhook/smart-workflow-router
Content Factory:        POST /webhook/content-production-factory
```

### Webhook Security

- Enable webhook authentication in n8n settings
- Use the webhook secret configured in `.env`

## Step 5: Test Workflows

### Test Master Orchestrator

```bash
curl -X POST http://localhost:5678/webhook/master-orchestrator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-webhook-secret" \
  -d '{
    "action": "activate_full_automation",
    "user_id": "test-user",
    "data": {
      "automation_level": "full",
      "enable_monitoring": true
    }
  }'
```

### Test Smart Router

```bash
curl -X POST http://localhost:5678/webhook/smart-workflow-router \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-webhook-secret" \
  -d '{
    "action": "route_workflow",
    "user_id": "test-user",
    "data": {
      "event_type": "content_request",
      "event_data": {"type": "blog_post", "topic": "AI automation"}
    }
  }'
```

## Step 6: Activate Workflows

1. In n8n UI, go to each imported workflow
2. Click **Activate** button for each workflow
3. Verify webhook endpoints are active
4. Check execution logs for any errors

## Step 7: Frontend Integration

### Update Environment Variables

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Update n8n configuration
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook
VITE_N8N_WEBHOOK_SECRET=your-secure-webhook-secret
VITE_N8N_INSTANCE_URL=http://localhost:5678
```

### Test Frontend Integration

1. Start your React app: `npm run dev`
2. Go to Automation Dashboard
3. Click the **▶️ ACTIVATE FULL AUTOMATION** button
4. Monitor workflow executions in n8n UI

## Troubleshooting

### Common Issues

1. **Webhook 404 Error**
   - Verify workflow is activated
   - Check webhook URL spelling
   - Ensure n8n is running

2. **Authentication Failed**
   - Verify webhook secret in environment
   - Check n8n webhook authentication settings
   - Confirm Authorization header format

3. **OpenAI API Errors**
   - Verify OpenAI API key in n8n credentials
   - Check API quota and billing
   - Confirm model names in workflow nodes

4. **Database Connection Issues**
   - Verify Supabase credentials in n8n
   - Check database connectivity
   - Confirm table schemas exist

### Logs & Monitoring

- Check n8n execution logs in UI
- Monitor webhook responses in browser network tab
- Review React console for frontend errors
- Check Supabase logs for database issues

## Production Deployment

### For Production

1. Use n8n cloud or secure server deployment
2. Enable HTTPS for webhook URLs
3. Use strong webhook secrets
4. Monitor workflow executions
5. Set up error alerting
6. Configure backup strategies

### Performance Optimization

- Enable workflow caching where appropriate
- Use webhook queues for high-volume scenarios
- Monitor execution times and optimize
- Scale n8n instance based on load

## Next Steps

After successful deployment:

1. Monitor automation effectiveness
2. Optimize workflow performance
3. Add more specialized workflows
4. Integrate additional AI providers
5. Expand automation capabilities

## Support

For issues:

- Check n8n documentation: <https://docs.n8n.io>
- Review workflow execution logs
- Test individual workflow nodes
- Verify all credentials and configurations
