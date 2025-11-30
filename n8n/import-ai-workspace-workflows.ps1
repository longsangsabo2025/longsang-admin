# AI Workspace n8n Workflows Importer (PowerShell)
# Import workflows vào n8n server

$N8N_URL = $env:N8N_URL
if (-not $N8N_URL) {
    $N8N_URL = "http://localhost:5678"
}

$N8N_API_KEY = $env:N8N_API_KEY

$WORKFLOWS_DIR = Join-Path $PSScriptRoot "workflows"

$WORKFLOWS = @(
    "ai-workspace-daily-news-digest.json",
    "ai-workspace-weekly-financial-summary.json"
)

function Import-Workflow {
    param(
        [string]$WorkflowFile
    )

    $workflowPath = Join-Path $WORKFLOWS_DIR $WorkflowFile

    if (-not (Test-Path $workflowPath)) {
        Write-Host "❌ Workflow file not found: $workflowPath" -ForegroundColor Red
        return $false
    }

    $workflowData = Get-Content $workflowPath -Raw | ConvertFrom-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($N8N_API_KEY) {
        $headers["X-N8N-API-KEY"] = $N8N_API_KEY
    }

    try {
        $body = Get-Content $workflowPath -Raw
        $response = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json"

        Write-Host "✅ Imported: $($workflowData.name)" -ForegroundColor Green
        Write-Host "   ID: $($response.id)" -ForegroundColor Gray
        Write-Host "   Active: $($response.active)" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "❌ Failed to import $($workflowData.name): $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-N8NConnection {
    try {
        $response = Invoke-WebRequest -Uri "$N8N_URL/healthz" -Method Get -TimeoutSec 5
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

Write-Host "🚀 AI Workspace n8n Workflows Importer`n" -ForegroundColor Cyan

# Check n8n connection
Write-Host "📡 Checking n8n connection: $N8N_URL" -ForegroundColor Yellow
if (-not (Test-N8NConnection)) {
    Write-Host "❌ Cannot connect to n8n server!" -ForegroundColor Red
    Write-Host "   Make sure n8n is running at $N8N_URL" -ForegroundColor Yellow
    Write-Host "   Start n8n: npm run workflows hoặc POST /api/n8n/start" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ n8n server is accessible`n" -ForegroundColor Green

# Import workflows
Write-Host "📦 Importing workflows...`n" -ForegroundColor Cyan
$successCount = 0

foreach ($workflow in $WORKFLOWS) {
    if (Import-Workflow -WorkflowFile $workflow) {
        $successCount++
    }
    Write-Host ""
}

Write-Host "✅ Imported $successCount/$($WORKFLOWS.Count) workflows" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open n8n UI: http://localhost:5678" -ForegroundColor White
Write-Host "   2. Configure environment variables:" -ForegroundColor White
Write-Host "      - USER_ID: your-user-uuid" -ForegroundColor Gray
Write-Host "      - USER_EMAIL: your-email@example.com" -ForegroundColor Gray
Write-Host "   3. Configure credentials:" -ForegroundColor White
Write-Host "      - Supabase credentials" -ForegroundColor Gray
Write-Host "      - Email/SMTP credentials (for financial summary)" -ForegroundColor Gray
Write-Host "   4. Activate workflows" -ForegroundColor White
Write-Host "`n🎉 Done!" -ForegroundColor Green

