#!/usr/bin/env python3
"""
Execute Investment Tables Migration via Supabase Client
"""

from supabase import create_client, Client
from pathlib import Path
import os

# Supabase credentials
SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I"

print("🚀 Investment Tables Migration via Supabase Client")
print("=" * 70)
print()

# Initialize Supabase client
print("📡 Connecting to Supabase...")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Client initialized")
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Check if tables already exist
print()
print("🔍 Checking if tables exist...")

try:
    # Try to query investment_applications table
    response = supabase.table('investment_applications').select('id').limit(1).execute()
    
    print("✅ Tables already exist!")
    print()
    print("📊 Current Data:")
    
    # Count records
    app_count = supabase.table('investment_applications').select('id', count='exact').execute()
    int_count = supabase.table('project_interests').select('id', count='exact').execute()
    
    print(f"   • investment_applications: {app_count.count} records")
    print(f"   • project_interests: {int_count.count} records")
    print()
    print("✨ Migration not needed - tables are ready!")
    print()
    print("📋 Next Steps:")
    print("   1. Test form: http://localhost:8080/project-showcase/sabo-arena/investment/apply")
    print("   2. Check data: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor")
    print("   3. API endpoint: http://localhost:3001/api/investment/applications")
    
except Exception as e:
    print("⚠️  Tables not found - need to create them")
    print()
    print("💡 Since Supabase Python client doesn't support direct SQL execution,")
    print("   please use the SQL Editor in Supabase Dashboard:")
    print()
    print("📝 Steps:")
    print("   1. Open: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new")
    print("   2. Copy SQL from: supabase/migrations/20241113_investment_tables.sql")
    print("   3. Paste and click 'Run'")
    print()
    print("🔄 Or run this command to copy SQL to clipboard:")
    print('   Get-Content "supabase\\migrations\\20241113_investment_tables.sql" | Set-Clipboard')
    print()
    
    # Read and display first part of SQL
    migration_file = Path(__file__).parent / "supabase" / "migrations" / "20241113_investment_tables.sql"
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("📄 SQL Preview:")
    print("-" * 70)
    print(sql[:500] + "...")
    print("-" * 70)
