# 🚀 Agent Execution Setup Guide

## ✅ What's Been Implemented

### 1. Edge Function Created

- **File**: `supabase/functions/trigger-content-writer/index.ts`
- **Purpose**: Generate blog posts using OpenAI or Claude
- **Features**:
  - Supports GPT-4, GPT-4 Turbo, Claude Opus, Claude Sonnet
  - Configurable tone, length, custom prompts
  - Automatic SEO metadata generation
  - Content queue integration
  - Activity logging

### 2. Frontend Integration

- **File**: `src/lib/automation/workflows.ts`
- Manual trigger now calls Edge Function
- Real-time activity logging
- Error handling

## 🔧 Setup Steps

### Step 1: Add API Keys to Supabase

You need to add your API keys to Supabase (not just .env):

1. Go to Supabase Dashboard: <https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/settings/secrets>

2. Add these secrets:

   ```
   OPENAI_API_KEY=sk-your-openai-key-here
   ```

   OR

   ```
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   ```

### Step 2: Deploy Edge Function

Run this command to deploy:

```powershell
# Install Supabase CLI if you haven't
# scoop install supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref diexsbzqwsbpilsymnfb

# Deploy function
supabase functions deploy trigger-content-writer
```

### Step 3: Test the Agent

1. **Navigate** to <http://localhost:8080/automation>
2. **Click** on "SABO Billiard Content Agent"
3. **Click** "Manual Trigger" button
4. **Enter** context (optional):

   ```json
   {
     "topic": "Top 10 Billiard Tips for Beginners"
   }
   ```

5. **Click** "Trigger Agent"
6. **Watch** activity logs for real-time status
7. **Check** Content Queue tab for generated content

## 📊 How It Works

```
User clicks "Run Now"
    ↓
Frontend calls manuallyTriggerAgent()
    ↓
Calls Supabase Edge Function
    ↓
Edge Function:
  1. Gets agent config from database
  2. Builds AI prompt with custom settings
  3. Calls OpenAI or Claude API
  4. Generates blog post (title, content, SEO)
  5. Saves to content_queue table
  6. Logs activity
  7. Updates agent stats
    ↓
Frontend shows success + content ID
    ↓
User can view generated content in Content Queue
```

## 🎯 Configuration Options

When you edit agent config, these settings affect the Edge Function:

- **AI Model**: Which AI to use (GPT-4, Claude, etc.)
- **Tone**: Writing style (professional, casual, friendly, etc.)
- **Max Length**: Target word count
- **Custom Prompt**: Additional instructions for the AI
- **Generate SEO**: Create meta tags automatically
- **Require Approval**: Hold content for review before publish

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY missing" or "ANTHROPIC_API_KEY missing"

- Make sure you added the key in Supabase Dashboard (Step 1)
- Not in .env file - Edge Functions use Supabase Secrets

### Error: "Function not found"

- Deploy the function using `supabase functions deploy`
- Check deployment status in Supabase Dashboard

### Content not appearing in queue

- Check Activity Logs for error messages
- Verify agent status is "active"
- Check browser console for errors

## 🎉 What's Next?

After testing Content Writer:

1. **Implement Lead Nurture Agent**
   - Email generation with Resend API
   - Follow-up sequences

2. **Implement Social Media Agent**
   - Post generation for multiple platforms
   - Auto-scheduling

3. **Add Triggers**
   - Schedule triggers (cron)
   - Database triggers (on new data)
   - Webhook triggers (external services)

## 📝 Example API Keys

### OpenAI

- Get key: <https://platform.openai.com/api-keys>
- Format: `sk-proj-...` or `sk-...`
- Cost: ~$0.01-0.03 per blog post

### Anthropic

- Get key: <https://console.anthropic.com/settings/keys>
- Format: `sk-ant-api...`
- Cost: Similar to OpenAI

## 🔥 Quick Test Without API Keys

Want to test without spending money? Edit the Edge Function to return mock data:

```typescript
// In trigger-content-writer/index.ts
// Replace the AI call with:
const blogPost = {
  title: "Mock Blog Post",
  seo_title: "Mock Post - Test",
  seo_description: "This is a test post",
  tags: ["test", "mock"],
  content: "# Test Content\n\nThis is mock content for testing."
};
const tokensUsed = 0;
```

Then deploy and test!
