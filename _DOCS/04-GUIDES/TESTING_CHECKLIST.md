# ✅ TESTING CHECKLIST - Kiểm tra toàn bộ tính năng

## 📋 Trước khi Refactor Code

### 1. 🔧 Infrastructure Tests

- [ ] **Frontend Server** - <http://localhost:8080>
  - [ ] Trang chủ load được
  - [ ] Routing hoạt động (về Admin, Agent Center...)
  - [ ] Hot reload working

- [ ] **Backend API** - <http://localhost:3001>
  - [ ] Health check: `GET /api/health`
  - [ ] CORS configured properly
  - [ ] Error handling works

### 2. 🔐 Authentication & Authorization

- [ ] **Dev Login** - <http://localhost:8080/dev-setup>
  - [ ] Quick login works
  - [ ] Create admin account
  - [ ] Session persistence

- [ ] **Admin Portal** - <http://localhost:8080/admin>
  - [ ] Login page works
  - [ ] Protected routes redirect
  - [ ] Logout works

### 3. 📁 Google Drive Integration

- [ ] **File Manager** - <http://localhost:8080/admin/files>
  - [ ] List files from Google Drive
  - [ ] Upload file
  - [ ] Create folder
  - [ ] Delete file
  - [ ] Download file
  - [ ] Search files
  - [ ] Toggle star

- [ ] **Backend API**
  - [ ] `GET /api/drive/list` - List files
  - [ ] `POST /api/drive/upload` - Upload
  - [ ] `POST /api/drive/folder` - Create folder
  - [ ] `DELETE /api/drive/:id` - Delete
  - [ ] `GET /api/drive/download/:id` - Download

### 4. 🤖 AI Agent System

- [ ] **Agent Center** - <http://localhost:8080/agent-center>
  - [ ] Load agents from database
  - [ ] Create new agent
  - [ ] Edit agent config
  - [ ] Delete agent
  - [ ] Execute agent task

- [ ] **Agent Execution**
  - [ ] Run simple task
  - [ ] View execution logs
  - [ ] Check execution status
  - [ ] Error handling

- [ ] **Agent Dashboard** - <http://localhost:8080/admin>
  - [ ] Recent executions display
  - [ ] Execution metrics
  - [ ] Filter by status

### 5. 📅 Consultation Booking

- [ ] **Booking Form** - <http://localhost:8080/consultation>
  - [ ] Form validation works
  - [ ] Date picker works
  - [ ] Time slot selection
  - [ ] Submit booking
  - [ ] Confirmation message

- [ ] **Database**
  - [ ] Booking saved to Supabase
  - [ ] Email notification sent (if configured)
  - [ ] View bookings in admin

### 6. 🗄️ Database (Supabase)

- [ ] **Tables exist**
  - [ ] agents
  - [ ] agent_executions
  - [ ] credentials
  - [ ] consultation_bookings
  - [ ] seo_pages

- [ ] **RLS (Row Level Security)**
  - [ ] Policies enabled
  - [ ] Admin can access all
  - [ ] Public read access where needed

### 7. 🔌 N8N Workflows (Optional)

- [ ] N8N running on port 5678
- [ ] Workflows imported
- [ ] Test webhook trigger
- [ ] Check automation logs

### 8. 🛡️ Security Features

- [ ] Input validation working (Zod schemas)
- [ ] XSS protection
- [ ] SQL injection protection
- [ ] CORS whitelist
- [ ] Environment variables secure

### 9. 🚀 Performance

- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] No console errors in browser
- [ ] No memory leaks
- [ ] Bundle size reasonable

### 10. 🧪 Unit Tests

- [ ] Fix test import errors
- [ ] Run `npm test`
- [ ] All tests passing
- [ ] Coverage > 50%

---

## 📝 MANUAL TESTING STEPS

### Step 1: Start Servers

```bash
npm run dev
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
```

### Step 2: Test Authentication

1. Go to <http://localhost:8080/dev-setup>
2. Click "Quick Login"
3. Should redirect to admin dashboard

### Step 3: Test Google Drive

1. Go to <http://localhost:8080/admin/files>
2. Try uploading a small file
3. Try creating a folder
4. Try deleting a file
5. Check console for errors

### Step 4: Test Agent Execution

1. Go to <http://localhost:8080/agent-center>
2. Click on an agent
3. Enter a task description
4. Click "Execute"
5. Watch execution logs
6. Verify result

### Step 5: Test Consultation Booking

1. Go to <http://localhost:8080/consultation>
2. Fill in the form
3. Select date & time
4. Submit
5. Check confirmation

### Step 6: Check Database

```bash
python check_database.py
```

### Step 7: Check API Endpoints

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/drive/list
```

---

## ✅ PASS CRITERIA

Để **đạt 9.5/10** trước khi refactor:

1. ✅ All core features working (0 critical bugs)
2. ✅ No console errors in production
3. ✅ API endpoints responding correctly
4. ✅ Database migrations applied
5. ✅ Authentication working
6. ✅ Google Drive integration working
7. ✅ Agent execution working
8. ✅ Performance acceptable (<3s load)

## ⚠️ KNOWN ISSUES

(Document any issues found during testing)

- [ ] Issue 1: ...
- [ ] Issue 2: ...

---

**Test Date:** _____________
**Tester:** _____________
**Result:** PASS / FAIL
**Notes:** _____________
