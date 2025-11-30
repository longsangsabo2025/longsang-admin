# Project Launcher Script
# Usage: .\START_PROJECT.ps1 -Project "portfolio"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("portfolio", "ainewbie", "ai-secretary", "vungtau", "music-video")]
    [string]$Project
)

$projects = @{
    "portfolio" = @{
        Path = "D:\0.PROJECTS\01-MAIN-PRODUCTS\long-sang-forge"
        Port = 8080
        Name = "LongSang Portfolio"
    }
    "ainewbie" = @{
        Path = "D:\0.PROJECTS\01-MAIN-PRODUCTS\ainewbie-web"
        Port = 5174
        Name = "AI Newbie Web"
    }
    "ai-secretary" = @{
        Path = "D:\0.PROJECTS\01-MAIN-PRODUCTS\ai_secretary"
        Port = 5173
        Name = "AI Secretary"
    }
    "vungtau" = @{
        Path = "D:\0.PROJECTS\01-MAIN-PRODUCTS\vungtau-dream-homes"
        Port = 5175
        Name = "Vung Tau Dream Homes"
    }
    "music-video" = @{
        Path = "D:\0.PROJECTS\01-MAIN-PRODUCTS\music-video-app"
        Port = 3004
        Name = "Music Video App"
    }
}

$projectInfo = $projects[$Project]

Write-Host "`n🚀 Starting $($projectInfo.Name)..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Check if port is already in use
$portInUse = Get-NetTCPConnection -LocalPort $projectInfo.Port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "⚠️  Port $($projectInfo.Port) is already in use!" -ForegroundColor Yellow
    Write-Host "   Opening browser to http://localhost:$($projectInfo.Port)" -ForegroundColor White
    Start-Process "http://localhost:$($projectInfo.Port)"
    exit 0
}

# Change to project directory
Set-Location $projectInfo.Path

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start dev server
Write-Host "⚡ Starting dev server on port $($projectInfo.Port)..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Gray

# Open browser after 3 seconds
Start-Job -ScriptBlock {
    param($url)
    Start-Sleep -Seconds 3
    Start-Process $url
} -ArgumentList "http://localhost:$($projectInfo.Port)"

# Start the dev server
npm run dev
