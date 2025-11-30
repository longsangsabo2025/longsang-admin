#!/usr/bin/env pwsh
# Start n8n Workflows project
# This script helps you quickly start the n8n automation workflows

Write-Host "🚀 Starting n8n Workflows..." -ForegroundColor Cyan
Write-Host ""

$n8nPath = Join-Path $PSScriptRoot ".." "n8n-workflows"

if (-not (Test-Path $n8nPath)) {
    Write-Host "❌ n8n-workflows project not found at: $n8nPath" -ForegroundColor Red
    Write-Host "Please make sure the n8n-workflows project exists." -ForegroundColor Yellow
    exit 1
}

# Check if .env exists
$envPath = Join-Path $n8nPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    $envExamplePath = Join-Path $n8nPath ".env.example"
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "✅ Created .env file. Please update with your settings." -ForegroundColor Green
        Write-Host ""
    }
}

# Check if node_modules exists
$nodeModulesPath = Join-Path $n8nPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Set-Location $n8nPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Start n8n
Set-Location $n8nPath

Write-Host "🎯 n8n will be available at: http://localhost:5678" -ForegroundColor Green
Write-Host "📝 Press Ctrl+C to stop n8n" -ForegroundColor Yellow
Write-Host ""

npm start
