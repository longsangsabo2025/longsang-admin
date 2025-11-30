Write-Host "⏳ Waiting for server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n🧪 Testing Agent Execution API" -ForegroundColor Cyan

$agentId = "fbda741f-9734-40bc-aabf-f03636b15ca7"
$url = "http://localhost:3001/api/agents/$agentId/execute"

$body = @{
    topic = "AI Marketing Strategy"
    style = "professional"
    length = "medium"
} | ConvertTo-Json

Write-Host "POST $url" -ForegroundColor Blue
Write-Host "Input: $body`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "`nExecution ID: $($response.executionId)" -ForegroundColor Cyan
    Write-Host "Agent: $($response.agentName)" -ForegroundColor Cyan
    Write-Host "Time: $($response.executionTime)ms" -ForegroundColor Cyan
    Write-Host "`nResult:" -ForegroundColor Yellow
    Write-Host $response.result.output
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
