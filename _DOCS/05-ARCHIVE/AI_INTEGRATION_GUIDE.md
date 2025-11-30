# 🤖 AI Integration Guide

## ✅ What's Already Done

The automation system now supports **real AI providers**:

- ✅ **OpenAI** (GPT-4, GPT-4 Turbo)
- ✅ **Anthropic Claude** (Claude 3.5 Sonnet)
- ✅ **Automatic provider selection**
- ✅ **Fallback to mock** if no API keys configured
- ✅ **Error handling** with graceful degradation

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get API Keys

#### Option A: OpenAI (Recommended for beginners)

1. Go to: <https://platform.openai.com/api-keys>
2. Sign up / Log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Cost:** ~$0.01-0.03 per request (GPT-4)

#### Option B: Anthropic Claude (Recommended for quality)

1. Go to: <https://console.anthropic.com/>
2. Sign up / Log in
3. Go to "API Keys"
4. Create new key
5. Copy the key (starts with `sk-ant-...`)
6. **Cost:** ~$0.015 per request (Claude 3.5 Sonnet)

### Step 2: Add to .env

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your API key(s):

```env
# For OpenAI
VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here

# OR for Claude
VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-claude-key-here

# You can add both - system will auto-select
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test It

1. Go to dashboard: `http://localhost:8080/automation`
2. Click on "Content Writer Agent"
3. Click "Manual Trigger"
4. Leave context empty or add: `{"topic": "AI Automation"}`
5. Click "Trigger Agent"
6. Check Activity Logs - should see real AI-generated content!

---

## 🎯 How It Works

### Automatic Provider Selection

```typescript
// System automatically chooses:
1. If model contains "claude" → Use Claude
2. Else if OPENAI_API_KEY exists → Use OpenAI
3. Else if ANTHROPIC_API_KEY exists → Use Claude
4. Else → Use Mock (with warning)
```

### Agent Configurations

Each agent type has default AI settings:

**Content Writer:**

```json
{
  "ai_model": "claude-3-5-sonnet-20241022",
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Lead Nurture:**

```json
{
  "ai_model": "gpt-4-turbo-preview",
  "temperature": 0.8,
  "max_tokens": 1000
}
```

**Social Media:**

```json
{
  "ai_model": "gpt-4",
  "temperature": 0.9,
  "max_tokens": 500
}
```

---

## 📊 Cost Estimates

### Per Agent Run

| Agent Type | Tokens | OpenAI Cost | Claude Cost |
|------------|--------|-------------|-------------|
| Content Writer | ~2000 | $0.02 | $0.015 |
| Lead Nurture | ~1000 | $0.01 | $0.008 |
| Social Media | ~500 | $0.005 | $0.004 |
| Analytics | ~1500 | $0.015 | $0.012 |

### Monthly Estimates (100 runs/agent)

- **Content Writer:** $2.00/month (OpenAI) or $1.50/month (Claude)
- **Lead Nurture:** $1.00/month
- **Social Media:** $0.50/month
- **Analytics:** $1.50/month

**Total:** ~$5-7/month for moderate usage

---

## 🔧 Advanced Configuration

### Custom Models

Edit agent config in database or UI:

```sql
UPDATE ai_agents 
SET config = jsonb_set(
  config, 
  '{ai_model}', 
  '"gpt-4-turbo-preview"'
)
WHERE id = 'your-agent-id';
```

### Temperature & Creativity

```json
{
  "temperature": 0.3,  // More focused, deterministic
  "temperature": 0.7,  // Balanced (default)
  "temperature": 1.0   // More creative, varied
}
```

### System Prompts

Add custom instructions:

```json
{
  "system_prompt": "You are a professional content writer specializing in tech. Write in a friendly but authoritative tone."
}
```

---

## 🧪 Testing Real AI

### Test 1: Content Writer

```bash
# Manual trigger with topic
{
  "topic": "How to Build AI Automation Systems"
}
```

**Expected:**

- Activity log: "Content generated"
- Content queue: New blog post with title, SEO, content
- Real AI-generated text (not mock)

### Test 2: Lead Nurture

```bash
# Manual trigger with contact info
{
  "contact_id": "test-uuid",
  "contact_name": "John Doe",
  "service": "Web Development",
  "message": "I need a website for my business"
}
```

**Expected:**

- Activity log: "Follow-up email generated"
- Personalized email in logs
- Real AI-crafted message

### Test 3: Social Media

```bash
# Manual trigger with blog content
{
  "blog_title": "10 Tips for Productivity",
  "blog_content": "Here are the best tips..."
}
```

**Expected:**

- Activity log: "Social posts generated"
- Posts for LinkedIn, Twitter, Facebook
- Platform-appropriate formatting

---

## 🐛 Troubleshooting

### "Mock AI" in logs

**Problem:** System using mock responses

**Solutions:**

1. Check `.env` file exists in project root
2. Verify API key format (starts with `sk-` or `sk-ant-`)
3. Restart dev server after adding keys
4. Check browser console for warnings

### API Error: 401 Unauthorized

**Problem:** Invalid API key

**Solutions:**

1. Regenerate key from provider dashboard
2. Copy entire key including `sk-` prefix
3. No spaces or quotes in `.env` file
4. Check key hasn't expired

### API Error: 429 Rate Limit

**Problem:** Too many requests

**Solutions:**

1. Wait a few minutes
2. Upgrade API plan
3. Add rate limiting to agents
4. Use different provider

### High Costs

**Problem:** Unexpected API charges

**Solutions:**

1. Set `max_tokens` lower (e.g., 1000)
2. Use GPT-3.5 instead of GPT-4
3. Add usage monitoring
4. Pause unused agents

---

## 📈 Monitoring Usage

### Check API Usage

**OpenAI:**

- Dashboard: <https://platform.openai.com/usage>
- See costs by day/month
- Set spending limits

**Claude:**

- Console: <https://console.anthropic.com/>
- View usage stats
- Monitor costs

### In-App Monitoring

Check activity logs:

```sql
SELECT 
  agent_id,
  COUNT(*) as total_runs,
  SUM((details->>'tokens_used')::int) as total_tokens
FROM activity_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_id;
```

---

## 🎨 Customizing Prompts

### Edit in Code

File: `src/lib/automation/ai-service.ts`

**Example: Better blog posts**

```typescript
export async function generateBlogPost(topic: string, config?: AIGenerationConfig) {
  const prompt = `Write a comprehensive blog post about "${topic}".

Requirements:
- 2000-2500 words
- Include real examples
- Add actionable tips
- Use storytelling
- SEO-optimized
- Engaging introduction
- Clear conclusion

Format as JSON:
{
  "title": "...",
  "seo_title": "...",
  "seo_description": "...",
  "tags": ["..."],
  "content": "...",
  "outline": ["..."]
}`;

  return await generateWithAI({ prompt, config });
}
```

### Dynamic Prompts

Load from database:

```typescript
const agent = await getAgent(agentId);
const customPrompt = agent.config.custom_prompt || defaultPrompt;
```

---

## 🔐 Security Best Practices

### ✅ DO

- Store API keys in `.env` (never commit)
- Add `.env` to `.gitignore`
- Use environment variables
- Rotate keys regularly
- Monitor usage

### ❌ DON'T

- Hardcode API keys in code
- Commit `.env` to git
- Share keys publicly
- Use same key across projects
- Ignore usage alerts

---

## 🚀 Next Steps

1. **✅ Test with real API** - Add key and trigger agent
2. **⏭️ Setup email integration** - For Lead Nurture agent
3. **⏭️ Add auto-triggers** - Edge Functions + DB triggers
4. **⏭️ WordPress integration** - Auto-publish blog posts
5. **⏭️ Social media APIs** - Auto-post to platforms

---

## 📚 Resources

### Official Docs

- **OpenAI:** <https://platform.openai.com/docs>
- **Claude:** <https://docs.anthropic.com/>
- **Pricing:** Compare at <https://openai.com/pricing> vs <https://www.anthropic.com/pricing>

### Useful Tools

- **Token Counter:** <https://platform.openai.com/tokenizer>
- **Prompt Engineering:** <https://www.promptingguide.ai/>
- **Cost Calculator:** <https://gptforwork.com/tools/openai-chatgpt-api-pricing-calculator>

---

## ✨ Summary

**You now have:**

- ✅ Real AI integration (OpenAI + Claude)
- ✅ Automatic provider selection
- ✅ Graceful fallbacks
- ✅ Error handling
- ✅ Cost-effective defaults

**To activate:**

1. Add API key to `.env`
2. Restart server
3. Trigger an agent
4. See real AI magic! 🎉

**Current status:** System works with mock AI. Add API key to unlock real power!
