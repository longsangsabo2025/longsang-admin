#!/usr/bin/env python3
"""
Run Consultation Booking Migration via Transaction Pooler
Uses direct PostgreSQL connection to execute SQL
"""

import psycopg2
from pathlib import Path
import sys

# Database connection string from .env
# Using Session Pooler (port 5432) - supports DDL statements like CREATE TRIGGER
# Note: Transaction Pooler (port 6543) doesn't support some SQL commands
DATABASE_URL = "postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

def main():
    print("🚀 Consultation Booking Migration")
    print("=" * 50)
    
    # Read migration SQL
    migration_file = Path(__file__).parent / "supabase" / "migrations" / "20250111_create_consultation_booking.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        sys.exit(1)
    
    print(f"📄 Reading migration: {migration_file.name}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print(f"✅ Loaded {len(sql_content)} characters")
    
    # Connect to database
    print("\n📡 Connecting to Supabase (Transaction Pooler)...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True  # Important for CREATE statements
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        
        # Execute migration
        print("\n🔧 Executing SQL migration...")
        cursor.execute(sql_content)
        
        print("✅ Migration executed successfully!")
        
        # Verify tables
        print("\n🔍 Verifying tables...")
        tables = [
            'consultations',
            'consultation_types',
            'availability_settings',
            'unavailable_dates'
        ]
        
        for table in tables:
            cursor.execute(f"""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '{table}'
            """)
            exists = cursor.fetchone()[0] > 0
            
            if exists:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                row_count = cursor.fetchone()[0]
                print(f"✅ Table '{table}' exists ({row_count} rows)")
            else:
                print(f"❌ Table '{table}' NOT FOUND")
        
        # Show consultation types
        print("\n📋 Default Consultation Types:")
        cursor.execute("SELECT name, duration, price FROM consultation_types ORDER BY duration")
        for row in cursor.fetchall():
            print(f"  • {row[0]}: {row[1]} phút - {row[2]:,}đ")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 50)
        print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print("\n📌 Next Steps:")
        print("1. Visit: http://localhost:8083/consultation")
        print("2. Test booking form")
        print("3. Check admin panel: http://localhost:8083/admin/consultations")
        
    except psycopg2.Error as e:
        print(f"\n❌ Database Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
