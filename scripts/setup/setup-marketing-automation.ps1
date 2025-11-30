# ======================================================
# LongSang Marketing Automation Setup Script
# Deploys n8n, Mautic, Redis, and Database Schema
# ======================================================

Write-Host "🚀 LongSang Marketing Automation Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Check if Docker is installed and running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Step 1: Deploy Database Schema
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Step 1: Deploying Marketing Database Schema...`n" -ForegroundColor Yellow

$sqlFile = ".\supabase\migrations\20251117_marketing_automation.sql"

if (Test-Path $sqlFile) {
    Write-Host "📄 SQL file found" -ForegroundColor Green
    Write-Host "⏳ Executing migration...`n" -ForegroundColor Yellow

    # Run deploy-db.mjs equivalent for marketing schema
    node -e "
    const pg = require('pg');
    const fs = require('fs');
    const { Client } = pg;

    const client = new Client({
      connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false }
    });

    (async () => {
      try {
        await client.connect();
        const sql = fs.readFileSync('./supabase/migrations/20251117_marketing_automation.sql', 'utf8');
        await client.query(sql);
        console.log('✅ Database schema deployed successfully!');
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        await client.end();
      }
    })();
    "

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema deployed successfully!`n" -ForegroundColor Green
        Write-Host "📋 Created tables:" -ForegroundColor Cyan
        Write-Host "   • marketing_campaigns" -ForegroundColor White
        Write-Host "   • campaign_posts" -ForegroundColor White
        Write-Host "   • email_campaigns" -ForegroundColor White
        Write-Host "   • marketing_leads" -ForegroundColor White
        Write-Host "   • workflow_executions" -ForegroundColor White
        Write-Host "   • social_media_accounts" -ForegroundColor White
        Write-Host "   • content_library" -ForegroundColor White
        Write-Host "   • automated_workflows`n" -ForegroundColor White
    } else {
        Write-Host "❌ Database deployment failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

# Step 2: Generate encryption keys if needed
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔐 Step 2: Checking encryption keys...`n" -ForegroundColor Yellow

$envFile = ".\.env.marketing"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw

    if ($envContent -match "your-encryption-key-here-change-this") {
        Write-Host "🔐 Generating encryption keys..." -ForegroundColor Yellow

        # Generate random keys
        $encryptionKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

        $envContent = $envContent -replace "your-encryption-key-here-change-this", $encryptionKey
        $envContent = $envContent -replace "your-jwt-secret-here-change-this", $jwtSecret

        Set-Content $envFile $envContent
        Write-Host "✅ Encryption keys generated`n" -ForegroundColor Green
    } else {
        Write-Host "✅ Encryption keys already configured`n" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env.marketing file not found`n" -ForegroundColor Yellow
}

# Step 3: Start Docker Services
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🐳 Step 3: Starting Docker Services...`n" -ForegroundColor Yellow

Write-Host "🚀 Starting n8n, Redis, and Mautic..." -ForegroundColor Yellow

# Load environment variables
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}

docker compose -f docker-compose.marketing.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Docker services started successfully!`n" -ForegroundColor Green
    Write-Host "📍 Services running at:" -ForegroundColor Cyan
    Write-Host "   • n8n:    http://localhost:5678" -ForegroundColor White
    Write-Host "   • Mautic: http://localhost:8080" -ForegroundColor White
    Write-Host "   • Redis:  localhost:6379`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to start Docker services!" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for services to be ready
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⏳ Step 4: Waiting for services to be ready...`n" -ForegroundColor Yellow

function Test-Service {
    param($Url, $Name, $MaxRetries = 30)

    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
                Write-Host "✅ $Name is ready" -ForegroundColor Green
                return $true
            }
        } catch {
            # Service not ready yet
        }

        Write-Host "   Waiting for ${Name}... $i/$MaxRetries" -ForegroundColor Yellow -NoNewline
        Write-Host "`r" -NoNewline
        Start-Sleep -Seconds 2
    }

    Write-Host "⚠️  $Name might not be fully ready, but continuing..." -ForegroundColor Yellow
    return $false
}

Test-Service "http://localhost:5678" "n8n"
Test-Service "http://localhost:8080" "Mautic"

Write-Host ""

# Step 5: Final Instructions
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 SETUP COMPLETE!`n" -ForegroundColor Green

Write-Host "📍 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open n8n at http://localhost:5678" -ForegroundColor White
Write-Host "   2. Create your n8n account (first time)" -ForegroundColor White
Write-Host "   3. Import workflow templates from ./n8n/workflows/" -ForegroundColor White
Write-Host "   4. Configure API keys in n8n:" -ForegroundColor White
Write-Host "      - OpenAI API Key" -ForegroundColor Gray
Write-Host "      - LinkedIn OAuth" -ForegroundColor Gray
Write-Host "      - Facebook OAuth" -ForegroundColor Gray
Write-Host "      - Email service (Resend/SendGrid)" -ForegroundColor Gray
Write-Host "   5. Test the Marketing Dashboard:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host "      → Navigate to /marketing-automation`n" -ForegroundColor Gray

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - n8n docs: https://docs.n8n.io/" -ForegroundColor White
Write-Host "   - Mautic docs: https://docs.mautic.org/`n" -ForegroundColor White

Write-Host "💡 Tip: Run 'docker compose -f docker-compose.marketing.yml logs -f'" -ForegroundColor Yellow
Write-Host "   to view service logs`n" -ForegroundColor Yellow

Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Open n8n in browser
Write-Host "🌐 Opening n8n in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5678"

Write-Host "✅ Done! Happy automating! 🚀`n" -ForegroundColor Green
