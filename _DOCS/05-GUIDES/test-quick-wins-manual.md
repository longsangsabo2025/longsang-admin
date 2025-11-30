# 🧪 Manual Testing Guide - Quick Wins

**Date:** 2025-01-27
**Purpose:** Test all 5 Quick Wins manually

---

## 🔧 Setup

### 1. Start Development Servers

```bash
# Terminal 1: Start API server
cd api
node server.js

# Terminal 2: Start Frontend
npm run dev:frontend

# Or start both together:
npm run dev
```

### 2. Access Application

- Frontend: http://localhost:8080/admin/ai-center
- API: http://localhost:3001

---

## ✅ Quick Win 1: Enhanced Command Suggestions

### Test Steps

1. **Navigate to AI Command Center**
   - Go to: `http://localhost:8080/admin/ai-center`
   - You should see `ProactiveSuggestionsPanel` at the top

2. **Check Suggestions Display**
   - [ ] Suggestions panel appears
   - [ ] Suggestions have project badges (📁 Project Name)
   - [ ] Suggestions are grouped by priority
   - [ ] Each suggestion shows project context

3. **Test Generate Suggestions**
   ```javascript
   // Open browser console
   fetch('http://localhost:3001/api/ai/suggestions/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(console.log)
   ```
   - [ ] Returns suggestions with `project_context` field
   - [ ] Suggestions have `project_name` field

4. **Test Project-Specific Suggestions**
   - [ ] Suggestions mention project names
   - [ ] Project badges appear in suggestion cards
   - [ ] Click "Thực hiện ngay" works

**Expected Result:**
- Suggestions include project context
- UI displays project badges
- Suggestions are more relevant

---

## ✅ Quick Win 2: Context-Aware Command Parsing

### Test Steps

1. **Test Command with Project Name**
   ```
   Command: "Tạo bài post về dự án Vũng Tàu"
   ```
   - [ ] Command is parsed successfully
   - [ ] Response includes `context_used` field
   - [ ] Parsed arguments include `project_id` if project found

2. **Test Command Parsing API**
   ```javascript
   fetch('http://localhost:3001/api/ai/command', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       command: 'Tạo bài post về dự án Vũng Tàu',
       preview_only: true
     })
   })
   .then(r => r.json())
   .then(d => {
     console.log('Context used:', d.context_used);
     console.log('Parsed:', d.parsed);
   })
   ```
   - [ ] Response includes `context_used` with project/workflow counts
   - [ ] Parsed function arguments include project_id if detected

3. **Test Multiple Commands**
   - [ ] "Backup database" - system command, no project
   - [ ] "Tạo post cho project X" - should detect project
   - [ ] "Thống kê hôm nay" - general command

**Expected Result:**
- Commands parse with business context
- Project IDs auto-injected when mentioned
- Better accuracy in parsing

---

## ✅ Quick Win 3: Command History with Context

### Test Steps

1. **Navigate to AI Command Center**
   - Go to: `http://localhost:8080/admin/ai-center`
   - Find Command Input section

2. **Execute Some Commands**
   - Execute: "Tạo bài post về dự án Vũng Tàu"
   - Execute: "Backup database"
   - Execute: "Thống kê hôm nay"

3. **Check History Display**
   - [ ] History section appears below command input
   - [ ] Each history item shows:
     - [ ] Command text
     - [ ] Project badge (if project context exists)
     - [ ] Status badge (success/error/pending)
     - [ ] Timestamp
   - [ ] "System" badge for non-project commands

4. **Test Project Filter**
   - [ ] Filter dropdown appears in history header
   - [ ] Can select "Tất cả projects"
   - [ ] Can filter by specific project
   - [ ] Filtering works correctly

5. **Check localStorage**
   ```javascript
   // Open browser console
   const history = JSON.parse(localStorage.getItem('ai_command_history') || '[]');
   console.log('History entries:', history);
   console.log('Has project_id:', history.map(h => ({
     command: h.command.substring(0, 30),
     project_id: h.project_id,
     project_name: h.project_name
   })));
   ```
   - [ ] History stored with `project_id`
   - [ ] History stored with `project_name`

**Expected Result:**
- History shows project context
- Can filter by project
- Better organization

---

## ✅ Quick Win 4: Quick Actions Panel

### Test Steps

1. **Navigate to AI Command Center**
   - Go to: `http://localhost:8080/admin/ai-center`
   - Look at bottom-right corner

2. **Check Floating Button**
   - [ ] Floating button appears (⚡ icon)
   - [ ] Button is positioned bottom-right
   - [ ] Button is not intrusive

3. **Open Quick Actions Panel**
   - [ ] Click floating button
   - [ ] Panel expands showing categories:
     - [ ] 📝 Content (3 actions)
     - [ ] 📊 Analytics (1 action)
     - [ ] ⚡ Automation (1 action)
     - [ ] 🔧 System (1 action)

4. **Test Quick Actions**
   - Click "Tạo bài post"
     - [ ] Command executes or shows preview
   - Click "Backup DB"
     - [ ] Command executes
   - Click "Thống kê"
     - [ ] Command executes

5. **Test Panel Close**
   - [ ] X button closes panel
   - [ ] Clicking outside closes panel (if implemented)

**Expected Result:**
- Quick actions accessible in 1 click
- Panel organized by categories
- Actions execute correctly

---

## ✅ Quick Win 5: Execution Plan Preview

### Test Steps

1. **Navigate to AI Command Center**
   - Go to: `http://localhost:8080/admin/ai-center`

2. **Enter Command**
   - Type: "Tạo bài post về dự án Vũng Tàu và đăng lên Facebook"
   - Press Enter or click Send

3. **Check Plan Preview Dialog**
   - [ ] Dialog appears showing execution plan
   - [ ] Shows steps:
     - [ ] Step 1: Load Business Context
     - [ ] Step 2: Parse Command
     - [ ] Step 3: Generate Workflow(s)
     - [ ] Step 4: Execute function(s)
   - [ ] Shows estimated times
   - [ ] Shows function parameters preview

4. **Test Confirm/Cancel**
   - Click "Hủy"
     - [ ] Dialog closes
     - [ ] Command does NOT execute
   - Type command again and click "Xác nhận & Thực hiện"
     - [ ] Command executes
     - [ ] Dialog closes
     - [ ] Result appears in history

5. **Test Preview Mode API**
   ```javascript
   fetch('http://localhost:3001/api/ai/command', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       command: 'Tạo bài post về dự án Vũng Tàu',
       preview_only: true
     })
   })
   .then(r => r.json())
   .then(d => {
     console.log('Preview response:', d);
     console.log('Has preview flag:', d.preview === true);
     console.log('Parsed functions:', d.parsed?.functions);
   })
   ```
   - [ ] Response has `preview: true`
   - [ ] Response includes parsed functions
   - [ ] NO workflows are actually created (preview only)

**Expected Result:**
- Plan preview shows before execution
- User can confirm or cancel
- Preview mode doesn't execute

---

## 🔍 Integration Testing

### Test Full Flow

1. **Start Fresh**
   - Clear browser localStorage (optional)
   - Navigate to AI Command Center

2. **Complete Flow**
   - [ ] See proactive suggestions at top
   - [ ] Click a suggestion → executes
   - [ ] Type command → shows plan preview
   - [ ] Confirm plan → command executes
   - [ ] Check history → shows with project context
   - [ ] Use quick actions panel → executes quickly

3. **Check All Features Together**
   - [ ] Suggestions have project context
   - [ ] Commands parse with context
   - [ ] History shows project badges
   - [ ] Quick actions work
   - [ ] Plan preview shows

**Expected Result:**
- All features work together
- Smooth user experience
- Context flows through all features

---

## 🐛 Known Issues to Check

1. **API Connection**
   - If API not running, features that need API will fail
   - Check: `http://localhost:3001/api/health`

2. **Supabase Connection**
   - History project loading needs Supabase
   - Check browser console for errors

3. **Missing Projects**
   - If no projects in DB, some features won't show project context
   - This is expected behavior

---

## 📊 Test Checklist

### Quick Win 1: Enhanced Suggestions
- [ ] Suggestions load
- [ ] Project badges appear
- [ ] Context-aware suggestions work

### Quick Win 2: Context-Aware Parsing
- [ ] Commands parse with context
- [ ] Project ID auto-injection works
- [ ] Context metadata in response

### Quick Win 3: History with Context
- [ ] History displays
- [ ] Project filtering works
- [ ] Project badges in history

### Quick Win 4: Quick Actions
- [ ] Panel appears
- [ ] Actions categorized
- [ ] Actions execute

### Quick Win 5: Plan Preview
- [ ] Preview dialog shows
- [ ] Steps displayed correctly
- [ ] Confirm/Cancel works

---

## ✅ Success Criteria

All Quick Wins are working if:
- ✅ Suggestions show project context
- ✅ Commands parse accurately with context
- ✅ History filters by project
- ✅ Quick actions accessible in 1 click
- ✅ Plan preview shows before execution

---

**Ready for manual testing!** 🚀

