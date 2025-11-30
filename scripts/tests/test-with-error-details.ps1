# Test với error details đầy đủ
$baseUrl = "http://localhost:3001"
$testUserId = "test-user-123"
$headers = @{ "x-user-id" = $testUserId }

Write-Host "`n🔍 Testing với Error Details" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Test Research Assistant với full error
Write-Host "Testing Research Assistant..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Xin chào"
        userId = $testUserId
        stream = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/assistants/research" -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Failed: Status $status" -ForegroundColor Red

    # Get full error response
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()

        Write-Host "`nFull Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red

        # Try to parse as JSON
        try {
            $errorObj = $responseBody | ConvertFrom-Json
            Write-Host "`nParsed Error:" -ForegroundColor Yellow
            $errorObj | ConvertTo-Json -Depth 3 | Write-Host
        } catch {
            Write-Host "Could not parse as JSON" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Could not read error stream: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Test complete!" -ForegroundColor Green

