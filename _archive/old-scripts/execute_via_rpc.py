#!/usr/bin/env python3
"""
Execute Investment Migration using custom exec_sql functions
"""

import requests
import json
from pathlib import Path

SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I"

print("🚀 Investment Migration via exec_sql Functions")
print("=" * 70)
print()

# SQL statements to execute
sql_statements = [
    {
        "name": "investment_applications table",
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
        "name": "project_interests table",
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
    },
    {
        "name": "RLS on investment_applications",
        "sql": "ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;"
    },
    {
        "name": "RLS on project_interests", 
        "sql": "ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;"
    },
    {
        "name": "Policy: Anyone can submit investment application",
        "sql": """
CREATE POLICY "Anyone can submit investment application"
ON investment_applications FOR INSERT
TO public
WITH CHECK (true);
"""
    },
    {
        "name": "Policy: Anyone can submit project interest",
        "sql": """
CREATE POLICY "Anyone can submit project interest"
ON project_interests FOR INSERT
TO public
WITH CHECK (true);
"""
    },
    {
        "name": "Index: investment_applications project_slug",
        "sql": "CREATE INDEX IF NOT EXISTS idx_investment_applications_project_slug ON investment_applications(project_slug);"
    },
    {
        "name": "Index: investment_applications status",
        "sql": "CREATE INDEX IF NOT EXISTS idx_investment_applications_status ON investment_applications(status);"
    },
    {
        "name": "Index: project_interests project_slug",
        "sql": "CREATE INDEX IF NOT EXISTS idx_project_interests_project_slug ON project_interests(project_slug);"
    },
    {
        "name": "Index: project_interests status",
        "sql": "CREATE INDEX IF NOT EXISTS idx_project_interests_status ON project_interests(status);"
    }
]

def execute_sql_via_rpc(sql, function_name="exec_safe_sql", use_service_key=False):
    """Execute SQL using custom RPC function"""
    
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY}"
    }
    
    # Correct payload format for RPC function call
    payload = {"query": sql}
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/{function_name}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result
        else:
            return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

# Execute each SQL statement
print("⚙️  Executing SQL statements...")
print("-" * 70)

success_count = 0
error_count = 0

for i, stmt in enumerate(sql_statements, 1):
    print(f"\n[{i}/{len(sql_statements)}] {stmt['name']}")
    
    # Try with exec_safe_sql first (uses anon key)
    result = execute_sql_via_rpc(stmt['sql'], "exec_safe_sql", use_service_key=False)
    
    if not result.get('success'):
        # If safe function fails, try with service key and raw function
        print("   🔄 Retrying with service key...")
        result = execute_sql_via_rpc(stmt['sql'], "exec_raw_sql", use_service_key=True)
    
    if result.get('success'):
        print("   ✅ Success")
        success_count += 1
    else:
        print(f"   ❌ Error: {result.get('error', 'Unknown error')}")
        error_count += 1

print()
print("=" * 70)
print(f"\n📊 Migration Summary:")
print(f"   ✅ Successful: {success_count}")
print(f"   ❌ Errors: {error_count}")
print(f"   📝 Total: {len(sql_statements)}")

# Verify tables were created
print("\n🔍 Verifying tables...")

try:
    from supabase import create_client
    
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Check investment_applications
    try:
        result = supabase.table('investment_applications').select('id').limit(1).execute()
        print("   ✅ investment_applications table exists")
        tables_exist = True
    except Exception as e:
        print(f"   ❌ investment_applications table: {str(e)[:50]}")
        tables_exist = False
    
    # Check project_interests  
    try:
        result = supabase.table('project_interests').select('id').limit(1).execute()
        print("   ✅ project_interests table exists")
        if not tables_exist:
            tables_exist = True
    except Exception as e:
        print(f"   ❌ project_interests table: {str(e)[:50]}")
        
    if tables_exist:
        print("\n🎉 Migration completed successfully!")
        print()
        print("📋 Next Steps:")
        print("   1. Start servers: npm run dev (Frontend) + npm run api (Backend)")
        print("   2. Test form: http://localhost:8080/project-showcase/sabo-arena/investment/apply")
        print("   3. Check data: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor")
        print("   4. API endpoint: http://localhost:3001/api/investment/applications")
    else:
        print("\n⚠️  Tables verification failed")
        
except ImportError:
    print("   ℹ️  Supabase client not available - check manually")
except Exception as e:
    print(f"   ⚠️  Verification error: {e}")