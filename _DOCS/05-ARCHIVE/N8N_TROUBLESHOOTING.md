# 🔧 N8N SETUP & TROUBLESHOOTING GUIDE

## ❌ **VẤN ĐỀ BẠN GẶP PHẢI:**

- "Problem setting up owner"
- "Can't connect to n8n"

## ✅ **GIẢI PHÁP HOÀN CHỈNH:**

---

## 🚀 **QUICK FIX - SETUP N8N OWNER**

### **Step 1: Stop tất cả n8n processes**

```bash
# Kill all n8n processes
taskkill /f /im node.exe 2>nul || true
```

### **Step 2: Start n8n với tunnel (để setup owner)**

```bash
npm run n8n:tunnel
```

### **Step 3: Setup Owner Account**

1. Browser sẽ mở tự động: `https://xxx.hooks.n8n.cloud`
2. Tạo **Owner Account**:
   - Email: `admin@localhost.com`
   - Password: `Admin123!`
   - First Name: `Admin`
   - Last Name: `User`
3. Click **"Get Started"**

### **Step 4: Start n8n bình thường**

```bash
# Stop tunnel
Ctrl+C

# Start normal n8n
npm run n8n:start
```

---

## 🔧 **SETUP ENVIRONMENT**

### **Option A: Automatic Setup**

```bash
# Use our optimized script
npm run n8n:start
```

### **Option B: Manual Environment**

Tạo file `.env` với:

```bash
# N8N Configuration
DB_SQLITE_POOL_SIZE=10
N8N_RUNNERS_ENABLED=true
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
N8N_GIT_NODE_DISABLE_BARE_REPOS=true
N8N_HOST=localhost
N8N_PORT=5678
```

---

## 🌐 **ACCESS METHODS**

### **Local Access (Recommended)**

- URL: `http://localhost:5678`
- Use: Development & daily work

### **Tunnel Access (Setup only)**

- URL: `https://xxx.hooks.n8n.cloud`
- Use: Owner setup & external webhooks

---

## 🔍 **VERIFICATION STEPS**

### **1. Check n8n Status**

```bash
# Test local connection
curl http://localhost:5678/healthz

# Expected: HTTP 200 OK
```

### **2. Verify Database**

```bash
# Check n8n tables created
node scripts/run-migrations-pg.mjs

# Should show: ✓ n8n_workflows, n8n_executions, n8n_workflow_templates
```

### **3. Test Workflow Dashboard**

1. Go to: `http://localhost:5173/automation`
2. Click: **"Workflows"** tab
3. Should see: Workflow dashboard với stats

---

## 🚨 **COMMON ISSUES & FIXES**

### **Issue 1: "Owner was set up successfully" nhưng không connect được**

**Fix:**

```bash
# Stop n8n
Ctrl+C

# Clear n8n data
rm -rf ~/.n8n

# Restart with tunnel
npm run n8n:tunnel

# Setup owner again
```

### **Issue 2: "Port 5678 already in use"**

**Fix:**

```bash
# Kill existing process
taskkill /f /im node.exe
netstat -ano | findstr :5678

# Start again
npm run n8n:start
```

### **Issue 3: Database connection failed**

**Fix:**

```bash
# Verify Supabase connection
node scripts/run-migrations-pg.mjs

# Should show: ✅ Connected!
```

### **Issue 4: Tunnel URL not working**

**Fix:**

```bash
# Use local URL instead
http://localhost:5678

# Or restart tunnel
npm run n8n:tunnel
```

---

## 📋 **COMPLETE SETUP CHECKLIST**

### **Pre-Setup:**

- [ ] Stop all n8n processes
- [ ] Clear ~/.n8n directory (if needed)
- [ ] Verify port 5678 is free

### **Owner Setup:**

- [ ] Run `npm run n8n:tunnel`
- [ ] Access tunnel URL in browser
- [ ] Create owner account (<admin@localhost.com> / Admin123!)
- [ ] Complete n8n setup wizard

### **Regular Usage:**

- [ ] Stop tunnel (Ctrl+C)
- [ ] Run `npm run n8n:start`
- [ ] Access `http://localhost:5678`
- [ ] Verify workflow dashboard works

### **Integration Test:**

- [ ] Go to `/automation` → "Workflows" tab
- [ ] Click "Create Workflow"
- [ ] Select template and create
- [ ] Test workflow execution

---

## 🎯 **EXPECTED RESULTS**

### **After Successful Setup:**

1. ✅ n8n owner account created
2. ✅ n8n accessible at `http://localhost:5678`
3. ✅ Workflow dashboard shows in automation UI
4. ✅ Can create and execute workflows
5. ✅ Database integration working

### **Workflow Dashboard Features:**

- 📊 Stats overview (workflows, executions, success rate)
- 🔧 Create workflow from templates
- ⚡ Activate/deactivate workflows
- 🏃 Execute workflows manually
- 📈 Monitor executions real-time

---

## 📞 **STILL HAVING ISSUES?**

### **Debug Commands:**

```bash
# Check n8n logs
npm run n8n:start > n8n.log 2>&1

# Check port status
netstat -ano | findstr :5678

# Verify environment
env | grep N8N

# Test API
curl -X GET http://localhost:5678/api/v1/workflows
```

### **Reset Everything:**

```bash
# Complete reset
taskkill /f /im node.exe
rm -rf ~/.n8n
rm -rf node_modules/.n8n
npm run n8n:tunnel
```

---

## ✅ **SUCCESS CONFIRMATION**

You should see:

```
🚀 Starting n8n with optimized configuration...
📋 Loading n8n environment variables...
🔧 Configuration:
   - Database: SQLite with pool size 10
   - Task Runners: true
   - Host: localhost:5678
   - Webhook URL: http://localhost:5678

⚡ Starting n8n...
Initializing n8n process
n8n ready on ::, port 5678

Editor is now accessible via:
http://localhost:5678
```

**Bây giờ n8n đã sẵn sàng! 🎉**
