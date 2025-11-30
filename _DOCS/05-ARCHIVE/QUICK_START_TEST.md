# 🚀 Quick Start - Test Marketplace Now

## Step 1: Run Debug Script (5 seconds)

```bash
npm run debug:activate
```

**This will check:**

- ✅ Database connection
- ✅ Table structure  
- ✅ RLS policies
- ✅ Insert permissions

**Expected Output:**

```
🔍 Debugging Agent Activation...

1️⃣ Testing database connection...
✅ Database connected

2️⃣ Checking agents table structure...
✅ Table structure: id, name, role, agent_type, ...

3️⃣ Testing agent insertion...
✅ Agent inserted successfully!
🧹 Test agent cleaned up

✅ Debug complete!
```

---

## Step 2: Test in Browser (30 seconds)

1. **Open:** <http://localhost:8080/agent-center>
2. **Click:** "Marketplace" tab
3. **Click:** "Activate" on "Lead Qualifier Agent"
4. **Check:** Browser console (F12)

**Expected Console Output:**

```
🔍 Activating agent: lead-qualifier
⚠️ No authenticated user - using demo mode with ID: demo-user-abc123
✅ Activation result: { success: true, agent_id: "xxx", free_runs_remaining: 50 }
```

**Expected Toast:** 🎉 "Agent Activated!"

---

## Step 3: Test AI Execution (10 seconds)

1. **Click:** "Details" button on activated agent
2. **Go to:** "🧪 Try It Now" tab
3. **Paste input:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Tech Corp",
  "position": "CEO",
  "message": "Need automation for 100+ employees"
}
```
1. **Click:** "Run Test"
2. **Wait:** 2-5 seconds
3. **See:** AI-generated JSON output

**Expected Output:**

```json
{
  "lead_score": 95,
  "quality": "HOT",
  "reason": "CEO level, 100+ employees, clear intent",
  "next_action": "Schedule call immediately",
  "estimated_deal_size": "$50,000 - $100,000"
}
```

---

## Step 4: Verify Database (5 seconds)

Go to Supabase Dashboard → SQL Editor:

```sql
-- Check agents
SELECT id, name, role, status FROM agents 
ORDER BY created_at DESC LIMIT 1;

-- Check executions
SELECT id, agent_id, status, cost_usd FROM agent_executions 
ORDER BY started_at DESC LIMIT 1;
```

**Expected:**

- 1 new agent row
- 1 new execution row with status 'completed'

---

## 🎯 If Everything Works

✅ **Marketplace is READY!**

You have:

- 5 AI agents ready to use
- Real GPT-4o-mini integration
- Database tracking
- Free trial system
- Cost calculation

---

## 🐛 If You See Errors

### Error: "Failed to activate agent"

**Run debug:**

```bash
npm run debug:activate
```

**Common Fix:** RLS Policy missing

```sql
-- In Supabase SQL Editor:
CREATE POLICY "Allow demo inserts" ON agents
FOR INSERT TO anon
USING (true);
```

### Error: "AI execution failed"

**Check:**

1. OpenAI API key in `.env`:

   ```
   VITE_OPENAI_API_KEY=sk-proj-...
   ```

2. Browser console for detailed error
3. Network tab in DevTools

### Still Issues?

**Full diagnostic:**

```bash
npm run test:marketplace
```

This runs complete E2E test suite and shows exactly what's wrong.

---

## 📊 Success Metrics

✅ **Everything works when:**

- Activation takes < 1 second
- AI execution takes 2-5 seconds
- No error toasts appear
- Console shows successful logs
- Database has new records
- Toast shows "Agent Activated!"

**Total time:** < 60 seconds to test complete flow! 🚀
