#!/usr/bin/env python3
"""
Execute Investment Tables Migration on Supabase
"""

import psycopg2
import os
from pathlib import Path

# Supabase connection details - Direct connection (no pooler)
DB_HOST = "diexsbzqwsbpilsymnfb.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Acookingoil123"

print("🚀 Investment Tables Migration")
print("=" * 70)
print()

# Read migration SQL
migration_file = Path(__file__).parent / "supabase" / "migrations" / "20241113_investment_tables.sql"

print(f"📄 Reading migration file: {migration_file}")
try:
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    print(f"✅ Loaded {len(sql)} characters")
except Exception as e:
    print(f"❌ Error reading file: {e}")
    exit(1)

print()
print("📡 Connecting to Supabase...")

# Connect to database
connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"

try:
    conn = psycopg2.connect(connection_string)
    print("✅ Connected successfully!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit(1)

print()
print("⚙️  Executing SQL migration...")
print("-" * 70)

# Execute migration
cursor = conn.cursor()
try:
    cursor.execute(sql)
    conn.commit()
    print()
    print("✅ Migration executed successfully!")
    
    # Verify tables
    print()
    print("🔍 Verifying tables...")
    
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('investment_applications', 'project_interests')
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print()
    for table in tables:
        print(f"   ✅ {table[0]}")
    
    # Count records
    print()
    print("📊 Table Statistics:")
    
    cursor.execute("SELECT COUNT(*) FROM investment_applications")
    app_count = cursor.fetchone()[0]
    print(f"   • investment_applications: {app_count} records")
    
    cursor.execute("SELECT COUNT(*) FROM project_interests")
    int_count = cursor.fetchone()[0]
    print(f"   • project_interests: {int_count} records")
    
    print()
    print("🎉 Migration completed successfully!")
    print()
    print("📋 Next Steps:")
    print("   1. Test form: http://localhost:8080/project-showcase/sabo-arena/investment/apply")
    print("   2. Check data: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor")
    print("   3. API endpoint: http://localhost:3001/api/investment/applications")
    
except psycopg2.Error as e:
    conn.rollback()
    print()
    print(f"❌ Error executing migration: {e}")
    print()
    print("💡 Tip: Check if tables already exist or if there are permission issues")
    exit(1)
    
except Exception as e:
    conn.rollback()
    print()
    print(f"❌ Unexpected error: {e}")
    exit(1)
    
finally:
    cursor.close()
    conn.close()
    print()
    print("🔌 Connection closed")
