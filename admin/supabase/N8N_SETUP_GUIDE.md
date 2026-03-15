# N8N Email Support Automation Setup

## 🎯 Objective
Setup n8n workflow to run `fetch-and-create-tickets.js` every 5 minutes automatically.

## ✅ Prerequisites
- [x] n8n running on http://localhost:5678
- [x] n8n API Key saved in `.env`
- [x] Working Node.js script: `supabase/scripts/fetch-and-create-tickets.js`
- [x] Existing workflow: "AI-Powered Customer Support System" (ID: CtNUeYE3iikBlcxi)

## 🔧 Setup Steps

### Step 1: Disable Broken Cron Job (IMPORTANT!)
The pg_cron job (ID=1) is still running and calling the broken Edge Function every 5 minutes.

**Run this SQL in Supabase Dashboard:**
```sql
SELECT cron.unschedule('fetch-support-emails');
```

Or use the SQL file:
```bash
# Copy SQL from DISABLE_CRON_JOB.sql and run in Supabase Dashboard
```

### Step 2: Update Existing n8n Workflow

Open workflow **"AI-Powered Customer Support System"** in n8n UI:

1. **Navigate to workflow:**
   - Open http://localhost:5678
   - Click "AI-Powered Customer Support System" (Active)
   - Workflow ID: `CtNUeYE3iikBlcxi`

2. **Check/Add Schedule Trigger Node:**
   - If no Schedule Trigger exists, add one
   - Set cron expression: `*/5 * * * *` (every 5 minutes)
   - Or use n8n's "Every 5 minutes" preset

3. **Check/Add Execute Command Node:**
   - Node Type: "Execute Command"
   - Command: `node`
   - Arguments: `scripts/fetch-and-create-tickets.js`
   - Working Directory: `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase`
   
   Or use single line command:
   - Command: `node scripts/fetch-and-create-tickets.js`
   - Working Directory: `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase`

4. **Set Environment Variables (if needed):**
   - The script uses Supabase credentials from its parent directory
   - `.env` file path: `D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\.env`
   - If workflow can't access env, add these to Execute Command node:
     ```
     SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=<from .env>
     GMAIL_USER=support@longsang.org
     GMAIL_APP_PASSWORD=<from .env>
     ```

5. **Save & Activate:**
   - Click "Save" button
   - Toggle "Active" to ON (green)

### Step 3: Test Workflow

**Manual Test:**
1. Click "Execute Workflow" button in n8n UI
2. Check output from Execute Command node
3. Verify tickets created in database:
   ```sql
   SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 5;
   ```

**Automatic Test:**
1. Wait 5 minutes for scheduled execution
2. Check workflow execution history in n8n
3. Check database for new tickets

## 📊 Monitoring

### Check Workflow Status
- n8n UI: http://localhost:5678/workflow/CtNUeYE3iikBlcxi
- Executions tab shows all runs (success/failure)

### Check Database
```sql
-- Recent tickets
SELECT id, subject, status, priority, created_at 
FROM support_tickets 
ORDER BY created_at DESC 
LIMIT 10;

-- Inbound emails log
SELECT * FROM inbound_emails 
ORDER BY received_at DESC 
LIMIT 10;
```

### Check Script Output
If workflow fails, check the Execute Command node output in n8n UI.

## 🔄 Alternative: Windows Task Scheduler

If n8n workflow doesn't work, use Windows Task Scheduler instead:

**Create scheduled task:**
```powershell
$action = New-ScheduledTaskAction -Execute "node" `
  -Argument "scripts/fetch-and-create-tickets.js" `
  -WorkingDirectory "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask -TaskName "LongSang-EmailSupport" `
  -Action $action `
  -Trigger $trigger `
  -Description "Fetch support emails and create tickets every 5 minutes"
```

**Manage task:**
```powershell
# Check status
Get-ScheduledTask -TaskName "LongSang-EmailSupport"

# Disable
Disable-ScheduledTask -TaskName "LongSang-EmailSupport"

# Remove
Unregister-ScheduledTask -TaskName "LongSang-EmailSupport" -Confirm:$false
```

## 🎉 Success Criteria

✅ Cron job (ID=1) disabled - no more Edge Function errors  
✅ n8n workflow running every 5 minutes  
✅ New support emails converted to tickets automatically  
✅ No manual intervention required  

## 📝 Notes

- **Why n8n instead of Edge Functions?**
  - Edge Functions can't run ImapFlow (requires Node.js Buffer API)
  - Local script already working perfectly
  - n8n provides visual workflow monitoring
  - Easy to modify schedule without touching database

- **API Key Storage:**
  - n8n API Key saved in: `D:\0.PROJECTS\00-MASTER-ADMIN\n8n-workflows\.env`
  - Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Used for programmatic workflow triggers (if needed later)

## 🚨 Troubleshooting

**Workflow not executing:**
- Check n8n server is running: http://localhost:5678
- Check workflow is Active (green toggle)
- Check Schedule Trigger node is configured correctly

**Script fails in workflow:**
- Check working directory is correct
- Check environment variables are accessible
- Run script manually to verify it still works:
  ```bash
  cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\supabase
  node scripts/fetch-and-create-tickets.js
  ```

**Duplicate tickets:**
- Check if old cron job (ID=1) is still running
- Run: `SELECT * FROM cron.job;` to verify
- If exists, run: `SELECT cron.unschedule(1);`
