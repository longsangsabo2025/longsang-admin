# Simple test - just check if routes exist
$API_BASE = "http://localhost:3001"

Write-Host "Testing API Routes..." -ForegroundColor Cyan

# Test 1: Health
Write-Host "`n[1] Testing /api/health..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/health" -Method Get
    Write-Host "OK - Status: $($r.status)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Assistants Status
Write-Host "`n[2] Testing /api/assistants/status..." -ForegroundColor Yellow
try {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/assistants/status" -Method Get
    Write-Host "OK - Success: $($r.success)" -ForegroundColor Green
    if ($r.keys) {
        Write-Host "   OpenAI: $($r.keys.openai -ne $null)" -ForegroundColor Gray
        Write-Host "   Anthropic: $($r.keys.anthropic -ne $null)" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "   Response: $body" -ForegroundColor Gray
    }
}

# Test 3: Research Assistant
Write-Host "`n[3] Testing /api/assistants/research..." -ForegroundColor Yellow
$body = @{
    message = "Hello"
    userId = "test-123"
    stream = $false
} | ConvertTo-Json

try {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/assistants/research" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -Headers @{"x-user-id" = "test-123"}
    Write-Host "OK - Got response" -ForegroundColor Green
    Write-Host "   Success: $($r.success)" -ForegroundColor Gray
    if ($r.response) {
        Write-Host "   Response length: $($r.response.Length)" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "   Response: $body" -ForegroundColor Gray
    }
}

