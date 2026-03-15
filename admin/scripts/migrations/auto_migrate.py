#!/usr/bin/env python3
"""
Automatically Execute Investment Tables Migration via Supabase REST API
"""

import requests
from pathlib import Path
import json

# Supabase credentials
SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"

print("🚀 Auto-Execute Investment Tables Migration")
print("=" * 70)
print()

# Read migration SQL
migration_file = Path(__file__).parent / "supabase" / "migrations" / "20241113_investment_tables.sql"

print(f"📄 Reading migration: {migration_file.name}")
with open(migration_file, 'r', encoding='utf-8') as f:
    sql = f.read()

print(f"✅ Loaded {len(sql)} characters")
print()

# Split SQL into individual statements
statements = []
current_statement = []

for line in sql.split('\n'):
    line = line.strip()
    
    # Skip empty lines and comments
    if not line or line.startswith('--'):
        continue
    
    current_statement.append(line)
    
    # Check if statement is complete (ends with semicolon)
    if line.endswith(';'):
        statement = ' '.join(current_statement)
        statements.append(statement)
        current_statement = []

print(f"📊 Found {len(statements)} SQL statements")
print()
print("⚙️  Executing statements via Supabase API...")
print("-" * 70)

# Execute each statement
success_count = 0
error_count = 0
errors = []

for i, statement in enumerate(statements, 1):
    # Preview statement
    preview = statement[:80].replace('\n', ' ')
    if len(statement) > 80:
        preview += "..."
    
    print(f"\n[{i}/{len(statements)}] {preview}")
    
    try:
        # Use Supabase's query endpoint
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/query",
            headers={
                "Content-Type": "application/json",
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
            },
            json={"query": statement},
            timeout=30
        )
        
        if response.status_code == 200:
            print("   ✅ Success")
            success_count += 1
        else:
            error_msg = response.text[:100]
            print(f"   ⚠️  Warning: {error_msg}")
            error_count += 1
            errors.append((i, statement[:100], error_msg))
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")
        error_count += 1
        errors.append((i, statement[:100], str(e)))

print()
print("=" * 70)
print(f"\n📊 Execution Summary:")
print(f"   ✅ Successful: {success_count}")
print(f"   ⚠️  Errors: {error_count}")
print(f"   📝 Total: {len(statements)}")

if errors:
    print("\n⚠️  Errors encountered:")
    for idx, stmt, err in errors[:5]:  # Show first 5 errors
        print(f"   [{idx}] {stmt}...")
        print(f"        Error: {err[:100]}")

# Verify tables were created using Supabase client
print("\n🔍 Verifying tables...")
print()

try:
    from supabase import create_client
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Check investment_applications
    try:
        result = supabase.table('investment_applications').select('id').limit(1).execute()
        print("   ✅ investment_applications table exists")
    except:
        print("   ❌ investment_applications table not found")
    
    # Check project_interests  
    try:
        result = supabase.table('project_interests').select('id').limit(1).execute()
        print("   ✅ project_interests table exists")
    except:
        print("   ❌ project_interests table not found")
        
    print("\n🎉 Migration completed!")
    print()
    print("📋 Next Steps:")
    print("   1. Test form: http://localhost:8080/project-showcase/sabo-arena/investment/apply")
    print("   2. Check data: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor")
    print("   3. API endpoint: http://localhost:3001/api/investment/applications")
    
except ImportError:
    print("   ℹ️  Supabase client not available for verification")
    print("   ℹ️  Check tables manually in Supabase Dashboard")
except Exception as e:
    print(f"   ⚠️  Verification error: {e}")
