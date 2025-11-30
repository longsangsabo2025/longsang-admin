#!/usr/bin/env python3
"""
Execute SQL Migration using Service Key via HTTP POST to Supabase
"""

import requests
import json
from pathlib import Path

SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"

print("🚀 Direct SQL Execution via Service Key")
print("=" * 70)
print()

# First, try to create a simple helper function via the Edge Functions API
print("🔧 Attempting to create SQL execution function...")

# Create the SQL statements as individual REST API calls
tables_to_create = [
    {
        "name": "investment_applications",
        "sql": """
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
            investor_type TEXT NOT NULL CHECK (investor_type IN ('individual', 'institution', 'fund')),
            company_name TEXT,
            investment_purpose TEXT NOT NULL,
            investment_experience TEXT NOT NULL,
            risk_tolerance TEXT NOT NULL CHECK (risk_tolerance IN ('low', 'medium', 'high')),
            identity_document TEXT NOT NULL,
            agree_terms BOOLEAN NOT NULL DEFAULT false,
            agree_risk BOOLEAN NOT NULL DEFAULT false,
            agree_privacy BOOLEAN NOT NULL DEFAULT false,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'contacted')),
            admin_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            reviewed_by UUID REFERENCES auth.users(id)
        );
        """
    },
    {
        "name": "project_interests", 
        "sql": """
        CREATE TABLE IF NOT EXISTS project_interests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id INTEGER NOT NULL,
            project_slug TEXT NOT NULL,
            project_name TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'not_interested')),
            contacted_at TIMESTAMP WITH TIME ZONE,
            contacted_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
    }
]

# Try Supabase's Edge Functions API to execute SQL
for table in tables_to_create:
    print(f"📝 Creating table: {table['name']}")
    
    # Try different endpoints
    endpoints_to_try = [
        f"{SUPABASE_URL}/functions/v1/execute-sql",
        f"{SUPABASE_URL}/rest/v1/rpc/execute_sql", 
        f"{SUPABASE_URL}/database/sql",
        f"{SUPABASE_URL}/api/sql"
    ]
    
    for endpoint in endpoints_to_try:
        try:
            response = requests.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_SERVICE_KEY
                },
                json={"sql": table['sql']},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"   ✅ Success via {endpoint}")
                break
            else:
                print(f"   ❌ {endpoint}: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ {endpoint}: {str(e)[:50]}")
            continue
    else:
        print(f"   ⚠️  All endpoints failed for {table['name']}")

print()
print("💡 Supabase doesn't allow direct SQL execution via REST API")
print("💡 This is a security feature - SQL must be executed via Dashboard")
print()
print("🎯 FINAL SOLUTION:")
print()
print("Since automated SQL execution isn't possible, let me create")
print("a streamlined manual process:")
print()

# Create a minimal SQL file for manual execution
minimal_sql = """
-- INVESTMENT PORTAL TABLES
-- Copy this entire block and paste in Supabase SQL Editor

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
    investor_type TEXT CHECK (investor_type IN ('individual', 'institution', 'fund')),
    company_name TEXT,
    investment_purpose TEXT NOT NULL,
    investment_experience TEXT NOT NULL,
    risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    identity_document TEXT NOT NULL,
    agree_terms BOOLEAN DEFAULT false,
    agree_risk BOOLEAN DEFAULT false,
    agree_privacy BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'contacted')),
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
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'not_interested')),
    contacted_at TIMESTAMP WITH TIME ZONE,
    contacted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;

-- Allow public to insert applications
CREATE POLICY "Public can submit applications" ON investment_applications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can submit interests" ON project_interests FOR INSERT TO public WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investment_applications_project_slug ON investment_applications(project_slug);
CREATE INDEX IF NOT EXISTS idx_investment_applications_status ON investment_applications(status);
CREATE INDEX IF NOT EXISTS idx_project_interests_project_slug ON project_interests(project_slug);
CREATE INDEX IF NOT EXISTS idx_project_interests_status ON project_interests(status);
"""

# Save minimal SQL
with open("minimal_migration.sql", "w", encoding="utf-8") as f:
    f.write(minimal_sql)

print("✅ Created minimal_migration.sql")
print()
print("📋 EXECUTE THIS:")

# Auto-execute the copy and browser open
import subprocess
import sys

if sys.platform == 'win32':
    ps_cmd = f'''
    Set-Content -Path "minimal_migration.sql" -Value @"
{minimal_sql}
"@;
    Get-Content "minimal_migration.sql" | Set-Clipboard;
    Start-Process "https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new";
    Write-Host "";
    Write-Host "🎯 READY!" -ForegroundColor Green;
    Write-Host "✅ Minimal SQL copied to clipboard" -ForegroundColor Green;
    Write-Host "✅ Supabase SQL Editor opened" -ForegroundColor Green;
    Write-Host "";
    Write-Host "📋 PASTE AND RUN!" -ForegroundColor Yellow;
    '''
    
    subprocess.run(['powershell', '-Command', ps_cmd])
    
    print("✨ After running SQL, verify with:")
    print("   C:/Python313/python.exe check_tables.py")

print()
print("⚡ This minimal SQL will create the essential tables needed for the Investment Portal!")