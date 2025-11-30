# Quick Test AI Workspace Backend
# Test nhanh các API chính

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3001"
$testUserId = "test-user-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "`n🧪 Quick Test AI Workspace Backend" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{ "x-user-id" = $testUserId }

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "   ✅ Health check OK" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Assistants Status
Write-Host "`n2️⃣  Testing Assistants Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/assistants/status" -Method GET -Headers $headers
    Write-Host "   ✅ Assistants status OK" -ForegroundColor Green
    Write-Host "   📊 Available assistants: $($response.assistants.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Assistants status failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test Research Assistant
Write-Host "`n3️⃣  Testing Research Assistant..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Xin chào, đây là test message"
        userId = $testUserId
        stream = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/assistants/research" -Method POST -Headers $headers -Body $body -ContentType "application/json"

    if ($response.success) {
        Write-Host "   ✅ Research assistant OK" -ForegroundColor Green
        Write-Host "   💬 Response length: $($response.response.Length) chars" -ForegroundColor Cyan

        if ($response.conversationId) {
            $convId = $response.conversationId
            Write-Host "   📝 Conversation ID: $convId" -ForegroundColor Cyan

            # Test get conversation
            try {
                $convResponse = Invoke-RestMethod -Uri "$baseUrl/api/assistants/research/conversations/$convId" -Method GET -Headers $headers
                Write-Host "   ✅ Get conversation OK" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️  Get conversation failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ❌ Research assistant failed: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Research assistant failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Conversations List
Write-Host "`n4️⃣  Testing Conversations List..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/assistants/research/conversations" -Method GET -Headers $headers
    if ($response.success) {
        Write-Host "   ✅ Conversations list OK" -ForegroundColor Green
        Write-Host "   📋 Total conversations: $($response.conversations.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Conversations list failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Analytics
Write-Host "`n5️⃣  Testing Analytics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ai-workspace/analytics?timeRange=month" -Method GET -Headers $headers
    if ($response.success) {
        Write-Host "   ✅ Analytics OK" -ForegroundColor Green
        Write-Host "   📊 Total messages: $($response.analytics.totalMessages)" -ForegroundColor Cyan
        Write-Host "   💰 Total cost: $($response.analytics.totalCost)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Analytics failed (may be empty): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 6: Documents API
Write-Host "`n6️⃣  Testing Documents API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/documents" -Method GET -Headers $headers
    if ($response.success) {
        Write-Host "   ✅ Documents API OK" -ForegroundColor Green
        Write-Host "   📄 Total documents: $($response.documents.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Documents API failed (may be empty): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n✅ Quick test complete!" -ForegroundColor Green
Write-Host ""

