# ====================================================
# N8N WORKFLOW IMPORTER
# Auto-import email automation workflows to n8n
# ====================================================

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  N8N WORKFLOW IMPORTER" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Configuration
$N8N_URL = "http://localhost:5678"
$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODU5NDQ0LCJleHAiOjE3NjYzNzk2MDB9.soMLJs-B80r6MS6PELzM9u0gel2xofvrtLQ3UJ-xziQ"

$WORKFLOWS_DIR = "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\n8n\workflows"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type" = "application/json"
}

# ============================================
# STEP 1: Check n8n is running
# ============================================
Write-Host "🔍 Step 1: Checking n8n server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$N8N_URL/healthz" -Method GET -ErrorAction Stop
    Write-Host "✅ n8n is running" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n is not running!" -ForegroundColor Red
    Write-Host "`n💡 Start n8n first:" -ForegroundColor Yellow
    Write-Host "   cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin" -ForegroundColor White
    Write-Host "   .\START_N8N_CORS.bat`n" -ForegroundColor Cyan
    exit 1
}

# ============================================
# STEP 2: Open n8n UI for manual import
# ============================================
Write-Host "`n📂 Step 2: Opening n8n UI..." -ForegroundColor Yellow
Start-Process "http://localhost:5678"
Start-Sleep -Seconds 2

# ============================================
# STEP 3: Guide user through manual import
# ============================================
Write-Host "`n📋 Step 3: Import Instructions" -ForegroundColor Yellow
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  MANUAL IMPORT REQUIRED" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "n8n UI đã mở. Làm theo các bước sau:`n" -ForegroundColor White

Write-Host "1️⃣  Click nút '+' (góc trên bên trái)" -ForegroundColor Green
Write-Host "2️⃣  Chọn 'Import from File'" -ForegroundColor Green
Write-Host "3️⃣  Import workflow đầu tiên:" -ForegroundColor Green
Write-Host "     📄 $WORKFLOWS_DIR\email-marketing-automation.json`n" -ForegroundColor Yellow

Write-Host "4️⃣  Click 'Save' → Activate workflow (toggle switch)" -ForegroundColor Green
Write-Host "5️⃣  Lặp lại cho workflow thứ 2:" -ForegroundColor Green
Write-Host "     📄 $WORKFLOWS_DIR\welcome-email-automation.json`n" -ForegroundColor Yellow

# ============================================
# STEP 4: List existing workflows
# ============================================
Write-Host "`n📊 Step 4: Current Workflows" -ForegroundColor Yellow
try {
    $workflows = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Headers $headers -Method GET
    
    if ($workflows.data.Count -gt 0) {
        Write-Host "`nExisting workflows ($($workflows.data.Count)):" -ForegroundColor Cyan
        $workflows.data | ForEach-Object {
            $status = if ($_.active) { "🟢 Active" } else { "⚪ Inactive" }
            Write-Host "  $status - $($_.name) (ID: $($_.id))" -ForegroundColor White
        }
    } else {
        Write-Host "`nℹ️  No workflows found yet" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not fetch workflows (might need to import first)" -ForegroundColor Yellow
}

# ============================================
# STEP 5: Wait and verify
# ============================================
Write-Host "`n⏸️  Press ENTER after importing workflows..." -ForegroundColor Cyan
Read-Host

Write-Host "`n🔍 Verifying imported workflows..." -ForegroundColor Yellow
try {
    $workflows = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Headers $headers -Method GET
    
    $emailWorkflow = $workflows.data | Where-Object { $_.name -like "*Email Marketing*" }
    $welcomeWorkflow = $workflows.data | Where-Object { $_.name -like "*Welcome Email*" }
    
    if ($emailWorkflow) {
        Write-Host "✅ Email Marketing Automation imported!" -ForegroundColor Green
        Write-Host "   Webhook: $N8N_URL/webhook/email-marketing" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Email Marketing workflow not found" -ForegroundColor Yellow
    }
    
    if ($welcomeWorkflow) {
        Write-Host "✅ Welcome Email Automation imported!" -ForegroundColor Green
        Write-Host "   Webhook: $N8N_URL/webhook/user-registration" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Welcome Email workflow not found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error verifying workflows: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 6: Test workflows
# ============================================
Write-Host "`n🧪 Step 6: Test Workflows" -ForegroundColor Yellow
Write-Host "`nReady to test? (y/n): " -ForegroundColor Cyan -NoNewline
$test = Read-Host

if ($test -eq 'y') {
    Write-Host "`n🚀 Running test script..." -ForegroundColor Green
    
    # Check if Python is available
    try {
        python --version | Out-Null
        
        Write-Host "`nExecuting: python test-email-templates.py`n" -ForegroundColor Cyan
        python "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\n8n\test-email-templates.py"
        
    } catch {
        Write-Host "⚠️  Python not found. Manual test:" -ForegroundColor Yellow
        Write-Host "`nTest webhook với curl:" -ForegroundColor White
        Write-Host 'curl -X POST http://localhost:5678/webhook/user-registration -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"email\":\"longsangsabo@gmail.com\"}"' -ForegroundColor Gray
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n================================" -ForegroundColor Green
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Configure Gmail OAuth2 in workflows (if not done)" -ForegroundColor White
Write-Host "   2. Activate workflows (toggle switch)" -ForegroundColor White
Write-Host "   3. Test with: python test-email-templates.py" -ForegroundColor White
Write-Host "   4. Check logs in Google Sheet`n" -ForegroundColor White

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Workflow Guide: n8n\workflows\README.md" -ForegroundColor Gray
Write-Host "   Email Templates: templates\emails\README.md`n" -ForegroundColor Gray

Write-Host "🌐 Quick Links:" -ForegroundColor Cyan
Write-Host "   n8n UI: http://localhost:5678" -ForegroundColor Gray
Write-Host "   Google Sheet: https://docs.google.com/spreadsheets/d/1ZDrD-z7l4rnu5WCdEJ4tvg_oigeoaUHTjdbDGnEPMtk`n" -ForegroundColor Gray
