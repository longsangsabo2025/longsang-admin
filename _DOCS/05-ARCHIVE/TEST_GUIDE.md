# 🧪 HƯỚNG DẪN TEST AI AGENT CENTER

## 🚀 QUICK START

### Cách 1: Dùng Script (Khuyến nghị)

```bash
# Double-click file này:
start-agent-center.bat
```

### Cách 2: Manual

```bash
# Terminal 1 - Backend
cd personal-ai-system
python -m uvicorn api.main:app --reload --port 8000

# Terminal 2 - Frontend
cd d:\0.APP\1510\long-sang-forge
npm run dev
```

---

## 🎯 TEST SCENARIOS

### 1. ✅ Test Database Connection

**Mở Supabase Dashboard:**

```
https://app.supabase.com/project/ckivqeakosyaryhntpis/editor
```

**Verify Tables:**

- ✅ agents (5 records)
- ✅ workflows (1 record)
- ✅ tools (5 records)
- ✅ workflow_executions (0 records)

### 2. ✅ Test Backend API

**Mở API Docs:**

```
http://localhost:8000/docs
```

**Test Endpoints:**

#### Get All Agents

```bash
GET http://localhost:8000/v1/agent-center/agents
```

**Expected Response:**

```json
[
  {
    "id": "...",
    "name": "work_agent",
    "role": "Work Assistant",
    "type": "work",
    "status": "active"
  }
]
```

#### Get All Tools

```bash
GET http://localhost:8000/v1/agent-center/tools
```

#### Get Analytics

```bash
GET http://localhost:8000/v1/agent-center/analytics/overview
```

### 3. ✅ Test Frontend Dashboard

**Mở Agent Center:**

```
http://localhost:5173/agent-center
```

**Test Features:**

#### A. Agents Tab

- [ ] View agents list
- [ ] See agent stats (executions, success rate, cost)
- [ ] Click "Create Agent" button
- [ ] Fill form and create new agent
- [ ] Click "Execute Agent" on any agent
- [ ] View agent details

#### B. Workflows Tab

- [ ] View workflows list
- [ ] See workflow templates
- [ ] Click "Create Workflow" button
- [ ] Execute a workflow
- [ ] View workflow stats

#### C. Tools Tab

- [ ] Browse all tools
- [ ] Search for tools
- [ ] Filter by category
- [ ] View tool details
- [ ] Check usage stats

#### D. Executions Tab

- [ ] View execution history
- [ ] See real-time status updates
- [ ] Check progress bars
- [ ] View error messages (if any)
- [ ] Filter by status

#### E. Analytics Tab

- [ ] View execution trends chart
- [ ] Check cost analysis
- [ ] See agent distribution pie chart
- [ ] View tool usage bar chart
- [ ] Read AI insights

---

## 🔍 DEBUGGING

### Frontend Issues

**Check Console:**

```
F12 → Console tab
```

**Common Issues:**

- API connection errors → Check backend is running
- 404 errors → Check routes in App.tsx
- Component errors → Check imports

### Backend Issues

**Check Logs:**

```
Terminal running uvicorn
```

**Common Issues:**

- Port 8000 already in use → Kill process or use different port
- Import errors → Check requirements installed
- Database errors → Verify Supabase connection

### Database Issues

**Check Supabase:**

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check data
SELECT COUNT(*) FROM agents;
SELECT COUNT(*) FROM tools;
```

---

## 📊 EXPECTED RESULTS

### After Fresh Setup

| Component | Expected |
|-----------|----------|
| Agents | 5 default agents |
| Workflows | 1 template |
| Tools | 5 built-in tools |
| Executions | 0 (empty) |

### After Creating Agent

- ✅ New agent appears in list
- ✅ Stats show 0 executions
- ✅ Status is "active"
- ✅ Can execute agent

### After Executing Workflow

- ✅ New execution appears in Executions tab
- ✅ Status updates in real-time
- ✅ Progress bar shows completion
- ✅ Final result displayed

---

## 🎯 TEST CHECKLIST

### Basic Functionality

- [ ] Backend API starts successfully
- [ ] Frontend dev server starts
- [ ] Can access /agent-center route
- [ ] All 5 tabs load without errors
- [ ] Data loads from Supabase

### CRUD Operations

- [ ] Can create new agent
- [ ] Can view agent details
- [ ] Can update agent status
- [ ] Can delete agent
- [ ] Can create workflow
- [ ] Can execute workflow

### Real-time Features

- [ ] Execution status updates live
- [ ] Progress bars animate
- [ ] New executions appear automatically
- [ ] Charts update with new data

### UI/UX

- [ ] Dark mode works
- [ ] Responsive on mobile
- [ ] Buttons have hover effects
- [ ] Loading states show
- [ ] Error messages display
- [ ] Success toasts appear

### Performance

- [ ] Pages load quickly (<2s)
- [ ] Charts render smoothly
- [ ] No console errors
- [ ] No memory leaks

---

## 🐛 KNOWN ISSUES

### 1. Real-time Hook Errors

**Issue:** TypeScript errors in useRealtimeExecutions.ts
**Workaround:** Tables need to be added to Supabase types
**Fix:** Run `npm run supabase:generate-types`

### 2. Mock Data

**Issue:** Some components use mock data
**Fix:** Connect to real API endpoints in components

### 3. Missing Dependencies

**Issue:** recharts might not be installed
**Fix:** `npm install recharts`

---

## 💡 TIPS

### For Development

1. Keep both terminals open
2. Watch for hot reload
3. Check console for errors
4. Use React DevTools

### For Testing

1. Start with Agents tab
2. Create a test agent
3. Execute simple workflow
4. Check Executions tab
5. View Analytics

### For Debugging

1. Check backend logs first
2. Then check browser console
3. Verify Supabase data
4. Test API endpoints directly

---

## 🎊 SUCCESS CRITERIA

✅ **System is working if:**

- Backend API responds at :8000
- Frontend loads at :5173
- Agent Center shows 5 agents
- Can create new agent
- Can view analytics charts
- Real-time updates work

---

## 📞 SUPPORT

**If you encounter issues:**

1. Check this guide
2. Review COMPLETE_SYSTEM_GUIDE.md
3. Check Supabase logs
4. Verify all dependencies installed
5. Restart servers

**Quick Fixes:**

```bash
# Restart everything
npm run dev
python -m uvicorn api.main:app --reload --port 8000

# Clear cache
npm run build
rm -rf node_modules/.vite

# Reinstall
npm install
```

---

**Happy Testing! 🚀**
