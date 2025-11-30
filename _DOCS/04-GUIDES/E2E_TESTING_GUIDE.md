# 🧪 AI Marketplace E2E Testing Guide

## 📋 Test Checklist

### ✅ Phase 1: Database Setup

- [ ] Supabase connection working
- [ ] Tables exist: `agents`, `agent_executions`, `usage_tracking`
- [ ] RLS policies configured

### ✅ Phase 2: Agent Activation

- [ ] Browse marketplace at `/agent-center` → Marketplace tab
- [ ] Click "Activate" button on any agent
- [ ] Check browser console for logs:

  ```
  🔍 Activating agent: lead-qualifier
  ⚠️ No authenticated user - using demo mode with ID: demo-user-xxxxx
  ✅ Activation result: { success: true, agent_id: "xxx", ... }
  ```

- [ ] Toast notification appears: "🎉 Agent Activated!"
- [ ] No error toast

### ✅ Phase 3: Agent Execution

- [ ] Click "Details" on activated agent
- [ ] Go to "🧪 Try It Now" tab
- [ ] Enter test input (JSON or text)
- [ ] Click "Run Test"
- [ ] See loading spinner
- [ ] Get AI-generated output
- [ ] Check console for:

  ```
  🤖 Executing agent with GPT-4o-mini
  ✅ AI execution successful
  💰 Cost: $0.XXXX (XXX tokens)
  ```

### ✅ Phase 4: Usage Tracking

- [ ] Check Supabase dashboard:
  - `agents` table has new row
  - `agent_executions` table has execution record
  - `usage_tracking` table incremented
- [ ] Free runs counter decreases
- [ ] Cost tracked correctly

---

## 🚀 Quick Test Commands

### Run Debug Script

```bash
node scripts/debug-activate.mjs
```

### Run E2E Test Suite

```bash
node scripts/test-marketplace-e2e.mjs
```

### Check Database Manually

```bash
# In Supabase SQL Editor:

-- Check agents
SELECT * FROM agents ORDER BY created_at DESC LIMIT 5;

-- Check executions
SELECT * FROM agent_executions ORDER BY started_at DESC LIMIT 5;

-- Check usage
SELECT * FROM usage_tracking ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "User not authenticated"

**Symptom:** Red toast error after clicking Activate

**Solution:** Already fixed! Demo mode enabled.

- Check console for: `⚠️ No authenticated user - using demo mode`
- Demo user ID auto-generated

### Issue 2: "Failed to activate agent"

**Possible Causes:**

1. **RLS Policy Missing**
   - Go to Supabase → Authentication → Policies
   - Add INSERT policy for `agents` table

   ```sql
   CREATE POLICY "Allow demo inserts" ON agents
   FOR INSERT TO anon
   USING (true);
   ```

2. **Missing Columns**
   - Run: `node scripts/debug-activate.mjs`
   - Check error details
   - Update table schema if needed

3. **Network Error**
   - Check Supabase URL in `.env`
   - Verify API key is correct
   - Test connection: `node scripts/debug-activate.mjs`

### Issue 3: Agent activation works but execution fails

**Solution:**

- Check OpenAI API key in `.env`:

  ```
  VITE_OPENAI_API_KEY=sk-proj-...
  ```

- Verify key is valid
- Check console for OpenAI errors

### Issue 4: No output from AI

**Solution:**

- Check `ai-service.ts` imports correctly
- Verify GPT-4o-mini model available
- Check browser console for errors

---

## 📊 Expected Results

### Successful Flow

1. **Activate Agent** (< 1s)
   - Agent saved to database
   - Free runs initialized
   - Toast: "Agent Activated!"

2. **Execute Agent** (2-5s)
   - Input sent to GPT-4o-mini
   - AI generates structured JSON output
   - Execution tracked in database
   - Cost calculated
   - Free runs decremented

3. **View Results**
   - Output displayed in sandbox
   - Execution time shown
   - Cost/tokens displayed
   - Can run again

### Performance Benchmarks

- **Activation:** < 1 second
- **AI Execution:** 2-5 seconds (GPT-4o-mini)
- **Database Query:** < 500ms
- **Total Flow:** < 10 seconds

---

## 🔬 Manual Test Scenarios

### Test Case 1: Lead Qualifier Agent

**Input:**

```json
{
  "name": "John Doe",
  "email": "john@techcorp.com",
  "company": "Tech Corp",
  "position": "CTO",
  "message": "Need automation for 500+ employees, budget $200k"
}
```

**Expected Output:**

```json
{
  "lead_score": 95,
  "quality": "HOT",
  "reason": "C-level executive, large company, clear budget",
  "next_action": "Schedule demo call immediately",
  "estimated_deal_size": "$150,000 - $250,000",
  "follow_up_email": "Dear John,\n\nThank you for reaching out..."
}
```

### Test Case 2: Blog Writer Agent

**Input:**

```json
{
  "topic": "AI in Marketing 2025",
  "primary_keyword": "AI marketing automation",
  "tone": "professional",
  "word_count": 1000
}
```

**Expected Output:**

```json
{
  "title": "AI Marketing Automation: Complete Guide 2025",
  "content": "Full 1000-word article...",
  "seo_score": 92,
  "meta_description": "...",
  "keywords_used": 15
}
```

### Test Case 3: Edge Cases

- [ ] Empty input → Should show validation error
- [ ] Invalid JSON → Should parse as text
- [ ] Very long input → Should handle gracefully
- [ ] Rapid clicks → Should debounce/disable button
- [ ] Network timeout → Should show error toast

---

## 📈 Success Criteria

✅ **MVP is Ready** when:

1. All 5 agents can be activated
2. All agents execute with real AI
3. Costs tracked accurately
4. Free trials work correctly
5. No console errors
6. Database records created
7. User experience smooth (< 10s total)
8. Error handling graceful

---

## 🎯 Next Steps After Testing

1. **User Dashboard** - Show active agents & history
2. **Billing Integration** - Stripe auto-charge
3. **Rate Limiting** - Prevent abuse
4. **Analytics** - Usage stats & insights
5. **Production Deploy** - Vercel + Supabase
6. **Real Authentication** - Replace demo mode
7. **Monitoring** - Error tracking & alerts

---

## 📞 Need Help?

Check browser console for detailed logs:

- 🔍 Activation logs
- 🤖 AI execution logs  
- ❌ Error details
- 💰 Cost calculations

Run debug script for detailed diagnostics:

```bash
node scripts/debug-activate.mjs
```
