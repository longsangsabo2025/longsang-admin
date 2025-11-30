# Test AI Workspace Migration from Frontend
# Script để test migration database từ frontend

$ErrorActionPreference = "Stop"

Write-Host "🔧 Testing AI Workspace Migration" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Colors
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Yellow }

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

# Check if migration script exists
$migrationScript = "scripts/run-ai-workspace-migration.cjs"
if (-not (Test-Path $migrationScript)) {
    Write-Error "Migration script not found: $migrationScript"
    exit 1
}

Write-Info "Found migration script: $migrationScript"

# Check if .env.local or .env exists
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    $envFile = ".env"
    if (-not (Test-Path $envFile)) {
        Write-Error ".env.local or .env file not found"
        Write-Info "Please create .env.local with required environment variables"
        exit 1
    }
}

Write-Success "Environment file found: $envFile"

# Read .env file to check for required variables
Write-Host "`n📋 Checking environment variables..." -ForegroundColor Cyan

# Check for at least one Supabase URL and one key
$envContent = Get-Content $envFile -Raw
$hasSupabaseUrl = $envContent -match "SUPABASE_URL|VITE_SUPABASE_URL"
$hasSupabaseKey = $envContent -match "SUPABASE_SERVICE|SUPABASE_ANON|VITE_SUPABASE_ANON"

if ($hasSupabaseUrl) {
    Write-Success "Supabase URL found"
} else {
    Write-Error "Supabase URL not found (need SUPABASE_URL or VITE_SUPABASE_URL)"
    exit 1
}

if ($hasSupabaseKey) {
    Write-Success "Supabase Key found"
} else {
    Write-Error "Supabase Key not found (need SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)"
    exit 1
}

# Check if migration SQL file exists
$migrationSQL = "supabase/migrations/20250128_ai_workspace_rag.sql"
if (-not (Test-Path $migrationSQL)) {
    Write-Error "Migration SQL file not found: $migrationSQL"
    exit 1
}

Write-Success "Migration SQL file found: $migrationSQL"

# Check if n8n migration SQL exists
$n8nMigrationSQL = "supabase/migrations/20250128_ai_workspace_n8n_tables.sql"
if (Test-Path $n8nMigrationSQL) {
    Write-Success "n8n migration SQL file found: $n8nMigrationSQL"
} else {
    Write-Info "n8n migration SQL file not found (optional)"
}

# Run migration script
Write-Host "`n🚀 Running migration..." -ForegroundColor Cyan

try {
    $currentDir = Get-Location
    Set-Location $PSScriptRoot

    # Run migration and capture output
    $process = Start-Process -FilePath "node" -ArgumentList $migrationScript -NoNewWindow -Wait -PassThru -RedirectStandardOutput "migration-output.txt" -RedirectStandardError "migration-error.txt"

    $output = Get-Content "migration-output.txt" -ErrorAction SilentlyContinue
    $errorOutput = Get-Content "migration-error.txt" -ErrorAction SilentlyContinue

    if ($process.ExitCode -eq 0) {
        Write-Success "Migration completed successfully!"
        if ($output) {
            Write-Host "`nMigration output:" -ForegroundColor Cyan
            Write-Host $output
        }
    } else {
        Write-Error "Migration failed with exit code: $($process.ExitCode)"
        if ($errorOutput) {
            Write-Host "`nError output:" -ForegroundColor Red
            Write-Host $errorOutput
        }
        if ($output) {
            Write-Host "`nStandard output:" -ForegroundColor Yellow
            Write-Host $output
        }
        Set-Location $currentDir
        exit 1
    }

    # Clean up temp files
    Remove-Item "migration-output.txt" -ErrorAction SilentlyContinue
    Remove-Item "migration-error.txt" -ErrorAction SilentlyContinue

    Set-Location $currentDir
} catch {
    Write-Error "Error running migration: $($_.Exception.Message)"
    Set-Location $currentDir
    exit 1
}

# Test database connection and verify tables
Write-Host "`n🔍 Verifying database tables..." -ForegroundColor Cyan

$verifyScript = @"
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    const tables = [
        'documents',
        'conversations',
        'agent_executions',
        'response_cache',
        'news_digests',
        'financial_summaries'
    ];

    console.log('📋 Checking tables...');

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(\`⚠️  Table '\${table}' does not exist\`);
                } else {
                    console.log(\`❌ Error checking '\${table}': \${error.message}\`);
                }
            } else {
                console.log(\`✅ Table '\${table}' exists\`);
            }
        } catch (err) {
            console.log(\`❌ Exception checking '\${table}': \${err.message}\`);
        }
    }

    // Check vector extension
    try {
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: new Array(1536).fill(0),
            match_threshold: 0.5,
            match_count: 1
        });

        if (error) {
            if (error.message.includes('function') || error.message.includes('does not exist')) {
                console.log('⚠️  Vector extension or match_documents function may not be set up');
            } else {
                console.log(\`⚠️  match_documents function check: \${error.message}\`);
            }
        } else {
            console.log('✅ Vector extension and match_documents function are working');
        }
    } catch (err) {
        console.log(\`⚠️  Could not verify vector extension: \${err.message}\`);
    }
}

verifyTables()
    .then(() => {
        console.log('\\n✅ Verification complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    });
"@

$verifyScriptPath = "scripts/verify-migration.cjs"
$verifyScript | Out-File -FilePath $verifyScriptPath -Encoding UTF8

try {
    Write-Host "Running verification script..." -ForegroundColor Cyan
    $verifyOutput = node $verifyScriptPath 2>&1
    Write-Host $verifyOutput

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database verification passed!"
    } else {
        Write-Error "Database verification failed"
        exit 1
    }
} catch {
    Write-Error "Error running verification: $($_.Exception.Message)"
} finally {
    # Clean up temp script
    if (Test-Path $verifyScriptPath) {
        Remove-Item $verifyScriptPath
    }
}

Write-Host "`n" -NoNewline
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Migration Test Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

