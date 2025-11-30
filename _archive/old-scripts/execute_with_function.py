#!/usr/bin/env python3
"""
Execute Investment Migration using custom exec_raw_sql function
"""

from supabase import create_client
from pathlib import Path

SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"

print("🚀 Execute Migration via exec_raw_sql function")
print("=" * 70)
print()

# Initialize Supabase client with service key
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Read migration SQL
migration_file = Path(__file__).parent / "supabase" / "migrations" / "20241113_investment_tables.sql"
with open(migration_file, 'r', encoding='utf-8') as f:
    sql = f.read()

print(f"📄 Loaded migration: {len(sql)} characters")
print()

# Split SQL into statements
statements = []
current = []
for line in sql.split('\n'):
    line = line.strip()
    if not line or line.startswith('--'):
        continue
    current.append(line)
    if line.endswith(';'):
        statements.append(' '.join(current))
        current = []

print(f"📊 Found {len(statements)} SQL statements")
print()

success_count = 0
error_count = 0

for i, statement in enumerate(statements, 1):
    print(f"[{i}/{len(statements)}] {statement[:80]}...")
    
    try:
        # Use the custom exec_raw_sql function
        result = supabase.rpc('exec_raw_sql', {'query': statement}).execute()
        
        if result.data and result.data.get('success'):
            print("   ✅ Success")
            success_count += 1
        else:
            error_msg = result.data.get('error', 'Unknown error') if result.data else 'No response'
            print(f"   ⚠️  Error: {error_msg}")
            error_count += 1
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        error_count += 1

print()
print("=" * 70)
print(f"📊 Migration Summary:")
print(f"   ✅ Successful: {success_count}")
print(f"   ⚠️  Errors: {error_count}")
print(f"   📝 Total: {len(statements)}")

# Verify tables
print()
print("🔍 Verifying tables...")
try:
    app_result = supabase.table('investment_applications').select('id').limit(1).execute()
    print("   ✅ investment_applications table exists")
except:
    print("   ❌ investment_applications table not found")

try:
    int_result = supabase.table('project_interests').select('id').limit(1).execute()
    print("   ✅ project_interests table exists")
except:
    print("   ❌ project_interests table not found")

print()
print("🎉 Migration completed!")
