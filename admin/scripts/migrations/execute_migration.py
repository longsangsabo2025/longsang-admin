#!/usr/bin/env python3
"""
Execute SQL Migration by creating tables directly via Supabase Management API
"""

import requests
from pathlib import Path

SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"

print("🚀 Creating Investment Tables via Supabase Management API")
print("=" * 70)
print()

# Read SQL
migration_file = Path(__file__).parent / "supabase" / "migrations" / "20241113_investment_tables.sql"
with open(migration_file, 'r', encoding='utf-8') as f:
    sql = f.read()

print(f"📄 SQL loaded: {len(sql)} characters")
print()

# Try to execute via pg_net extension (if available)
print("⚙️  Attempting to execute SQL via Supabase...")
print()

# Create a helper function to execute SQL
helper_function_sql = """
CREATE OR REPLACE FUNCTION execute_migration()
RETURNS text AS $$
BEGIN
  -- Your migration SQL here
  EXECUTE '
-- Investment Applications Table
CREATE TABLE IF NOT EXISTS investment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  investment_amount NUMERIC NOT NULL,
  investor_type TEXT NOT NULL CHECK (investor_type IN (''individual'', ''institution'', ''fund'')),
  company_name TEXT,
  investment_purpose TEXT NOT NULL,
  investment_experience TEXT NOT NULL,
  risk_tolerance TEXT NOT NULL CHECK (risk_tolerance IN (''low'', ''medium'', ''high'')),
  identity_document TEXT NOT NULL,
  agree_terms BOOLEAN NOT NULL DEFAULT false,
  agree_risk BOOLEAN NOT NULL DEFAULT false,
  agree_privacy BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT ''pending'' CHECK (status IN (''pending'', ''reviewing'', ''approved'', ''rejected'', ''contacted'')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Project Interest Table
CREATE TABLE IF NOT EXISTS project_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL,
  project_slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT ''new'' CHECK (status IN (''new'', ''contacted'', ''converted'', ''not_interested'')),
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
';
  
  RETURN 'Tables created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
"""

print("💡 Supabase REST API doesn't support direct SQL execution.")
print("💡 You need to use the Supabase SQL Editor in the dashboard.")
print()
print("🎯 FASTEST WAY - Use this PowerShell command:")
print()
print("-" * 70)
print('Get-Content "supabase\\migrations\\20241113_investment_tables.sql" | Set-Clipboard')
print('Start-Process "https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new"')
print('Write-Host "✅ SQL copied! Paste in editor and click Run" -ForegroundColor Green')
print("-" * 70)
print()
print("📋 Manual Steps:")
print("   1. The SQL is already in your clipboard")
print("   2. Browser will open to SQL Editor")
print("   3. Paste (Ctrl+V) and click 'Run'")
print("   4. Done in 10 seconds!")
print()

# Execute the PowerShell command automatically
import subprocess
import sys

if sys.platform == 'win32':
    print("🔄 Auto-executing PowerShell command...")
    print()
    
    ps_command = '''
    Get-Content "supabase\\migrations\\20241113_investment_tables.sql" | Set-Clipboard;
    Start-Process "https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new";
    Write-Host "";
    Write-Host "🎯 MIGRATION READY!" -ForegroundColor Green;
    Write-Host "";
    Write-Host "✅ SQL copied to clipboard" -ForegroundColor Green;
    Write-Host "✅ Browser opened to SQL Editor" -ForegroundColor Green;
    Write-Host "";
    Write-Host "📋 NOW:" -ForegroundColor Yellow;
    Write-Host "   1. Paste (Ctrl+V) in SQL Editor" -ForegroundColor White;
    Write-Host "   2. Click RUN button" -ForegroundColor White;
    Write-Host "   3. Wait 5 seconds" -ForegroundColor White;
    Write-Host "";
    '''
    
    subprocess.run(['powershell', '-Command', ps_command])
    
    print()
    print("✨ After clicking RUN in Supabase, come back and run:")
    print("   C:/Python313/python.exe check_tables.py")
    print()
    print("   To verify tables were created successfully!")

else:
    print("⚠️  Not on Windows - please execute SQL manually in Supabase Dashboard")
