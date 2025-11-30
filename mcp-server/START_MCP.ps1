# ═══════════════════════════════════════════════════════════
#   START MCP SERVER - Longsang Workspace
#   Port: 3002
# ═══════════════════════════════════════════════════════════

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       STARTING MCP SERVER               " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if virtual environment exists
if (-not (Test-Path ".venv")) {
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Check if dependencies installed
$venvPython = Join-Path $scriptDir ".venv\Scripts\python.exe"

$mcpInstalled = & $venvPython -c "import mcp" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    & $venvPython -m pip install -r requirements.txt
}

Write-Host ""
Write-Host "[INFO] Starting MCP Server on port 3002..." -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

& $venvPython server.py
