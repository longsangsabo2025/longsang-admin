# Detailed Backend Test
$baseUrl = "http://localhost:3001"
$testUserId = "test-user-123"
$headers = @{ "x-user-id" = $testUserId }

Write-Host "`n🔍 Detailed Backend Test" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Documents API
Write-Host "1. Testing Documents API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/documents" -Method GET -Headers $headers
    Write-Host "   ✅ Documents API OK" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "   ❌ Documents API failed: Status $status" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Analytics API
Write-Host "`n2. Testing Analytics API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai-workspace/analytics?timeRange=month" -Method GET -Headers $headers
    Write-Host "   ✅ Analytics API OK" -ForegroundColor Green
    Write-Host "   Total Messages: $($response.analytics.totalMessages)" -ForegroundColor Cyan
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "   ❌ Analytics API failed: Status $status" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Research Assistant (with error details)
Write-Host "`n3. Testing Research Assistant..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Xin chào"
        userId = $testUserId
        stream = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/assistants/research" -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "   ✅ Research Assistant OK" -ForegroundColor Green
    Write-Host "   Response length: $($response.response.Length) chars" -ForegroundColor Cyan
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "   ❌ Research Assistant failed: Status $status" -ForegroundColor Red

    # Try to get error details
    try {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error details: $($errorResponse.error)" -ForegroundColor Red
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Test complete!" -ForegroundColor Green

