# Test AI Workspace Backend APIs
# Test tất cả các API routes mới được thêm vào

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3001"
$testUserId = "test-user-123"

Write-Host "🧪 Testing AI Workspace Backend APIs" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Colors
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Yellow }

# Test counter
$passed = 0
$failed = 0

# Helper function to test API
function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    Write-Host "Testing: $Name" -ForegroundColor White

    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
        }

        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-RestMethod @params -ErrorAction Stop

        if ($response.success -or $response -is [array]) {
            Write-Success "$Name - Status: OK"
            $script:passed++
            return $response
        } else {
            Write-Error "$Name - Unexpected response format"
            $script:failed++
            return $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "$Name - Expected error status: $statusCode"
            $script:passed++
            return $null
        } else {
            Write-Error "$Name - Failed: $($_.Exception.Message) (Status: $statusCode)"
            $script:failed++
            return $null
        }
    }
}

# 1. Test Health Check
Write-Host "`n📊 Health Check" -ForegroundColor Cyan
Test-API -Name "Health Check" -Method "GET" -Url "$baseUrl/api/health"

# 2. Test AI Assistants Status
Write-Host "`n🤖 AI Assistants" -ForegroundColor Cyan
$headers = @{ "x-user-id" = $testUserId }

Test-API -Name "Assistants Status" -Method "GET" -Url "$baseUrl/api/assistants/status" -Headers $headers

# 3. Test Each Assistant Type
$assistants = @("course", "financial", "research", "news", "career", "daily")

foreach ($assistant in $assistants) {
    Write-Host "`n📝 Testing $assistant Assistant" -ForegroundColor Cyan

    # Test conversation creation
    $body = @{
        message = "Xin chào, đây là test message"
        userId = $testUserId
        stream = $false
    }

    $response = Test-API -Name "$assistant Assistant Chat" -Method "POST" -Url "$baseUrl/api/assistants/$assistant" -Headers $headers -Body $body

    if ($response -and $response.conversationId) {
        $conversationId = $response.conversationId

        # Test get conversations
        Test-API -Name "$assistant Conversations List" -Method "GET" -Url "$baseUrl/api/assistants/$assistant/conversations" -Headers $headers

        # Test get single conversation
        Test-API -Name "$assistant Get Conversation" -Method "GET" -Url "$baseUrl/api/assistants/$assistant/conversations/$conversationId" -Headers $headers

        # Test rename conversation
        $renameBody = @{ title = "Renamed Conversation" }
        Test-API -Name "$assistant Rename Conversation" -Method "PATCH" -Url "$baseUrl/api/assistants/$assistant/conversations/$conversationId" -Headers $headers -Body $renameBody

        # Test delete conversation (optional - comment out if you want to keep test data)
        # Test-API -Name "$assistant Delete Conversation" -Method "DELETE" -Url "$baseUrl/api/assistants/$assistant/conversations/$conversationId" -Headers $headers
    }
}

# 4. Test Documents API
Write-Host "`n📄 Documents API" -ForegroundColor Cyan

# Test list documents
Test-API -Name "List Documents" -Method "GET" -Url "$baseUrl/api/documents" -Headers $headers

# Test get document (will fail if no documents exist, which is expected)
Test-API -Name "Get Document (404 expected)" -Method "GET" -Url "$baseUrl/api/documents/non-existent-id" -Headers $headers -ExpectedStatus 404

# 5. Test Analytics API
Write-Host "`n📊 Analytics API" -ForegroundColor Cyan

$timeRanges = @("today", "week", "month", "all")
foreach ($range in $timeRanges) {
    Test-API -Name "Analytics ($range)" -Method "GET" -Url "$baseUrl/api/ai-workspace/analytics?timeRange=$range" -Headers $headers
}

# 6. Test n8n Workflows (if available)
Write-Host "`n🔄 n8n Workflows" -ForegroundColor Cyan

Test-API -Name "n8n Workflows List" -Method "GET" -Url "$baseUrl/api/ai-workspace/n8n/workflows" -Headers $headers

# Summary
Write-Host "`n" -NoNewline
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Success "Passed: $passed"
if ($failed -gt 0) {
    Write-Error "Failed: $failed"
} else {
    Write-Success "Failed: $failed"
}
Write-Host "Total: $($passed + $failed)" -ForegroundColor White
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
    exit 1
}

