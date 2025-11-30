# ╔═══════════════════════════════════════════════════════════════╗
# ║           LONGSANG ADMIN - STOP ALL SERVICES                 ║
# ╚═══════════════════════════════════════════════════════════════╝

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║           STOPPING ALL SERVICES                               ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Yellow

# Stop processes on ports
$ports = @(3001, 3002, 8080)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping $($process.ProcessName) on port $port..." -ForegroundColor Gray
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Also kill by name
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[OK] All services stopped" -ForegroundColor Green
