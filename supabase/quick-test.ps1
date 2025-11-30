$key = "564e46c5e5e128be154e1d25de7088aa11c51"
$headers = @{
    "X-Auth-Email" = "longsangsabo@gmail.com"
    "X-Auth-Key" = $key
}

Write-Host "`nTesting API key..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/845966ad8db7c98b0e945bf5555eb94c" -Headers $headers
    Write-Host "SUCCESS: $($result.result.name)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
