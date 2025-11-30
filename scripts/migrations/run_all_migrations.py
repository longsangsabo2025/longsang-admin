#!/usr/bin/env python3
"""
Script to run ALL Supabase migrations in order
"""

import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create PostgreSQL connection"""
    db_url = os.getenv('VITE_SUPABASE_DB_URL')
    
    # Parse connection string
    # Format: postgresql://postgres.PROJECT:PASSWORD@HOST:PORT/postgres
    conn = psycopg2.connect(db_url)
    return conn

def run_migrations():
    """Run all migration files in order"""
    
    print("🚀 Starting migration process...\n")
    
    # Connect to database
    try:
        conn = get_db_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        print("✅ Connected to database successfully!\n")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return
    
    # Get all migration files
    migrations_dir = Path(__file__).parent / "supabase" / "migrations"
    
    migration_files = sorted([
        f for f in os.listdir(migrations_dir) 
        if f.endswith('.sql')
    ])
    
    print(f"📁 Found {len(migration_files)} migration files\n")
    
    success_count = 0
    error_count = 0
    
    # Run each migration
    for migration_file in migration_files:
        file_path = migrations_dir / migration_file
        
        print(f"📄 Running: {migration_file}")
        
        try:
            # Read SQL content
            with open(file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # Execute SQL
            cursor.execute(sql_content)
            
            print(f"   ✅ Success\n")
            success_count += 1
            
        except psycopg2.Error as e:
            # Check if error is because table/function already exists
            if 'already exists' in str(e):
                print(f"   ⚠️  Already exists (skipping)\n")
                success_count += 1
            else:
                print(f"   ❌ Error: {e}\n")
                error_count += 1
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}\n")
            error_count += 1
    
    # Close connection
    cursor.close()
    conn.close()
    
    # Summary
    print("\n" + "="*50)
    print("📊 MIGRATION SUMMARY")
    print("="*50)
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {error_count}")
    print(f"📝 Total: {len(migration_files)}")
    print("="*50 + "\n")
    
    if error_count == 0:
        print("🎉 All migrations completed successfully!")
    else:
        print("⚠️  Some migrations had errors. Check the output above.")
    
    # Verify tables
    print("\n🔍 Verifying database structure...")
    verify_tables()

def verify_tables():
    """Verify that key tables exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check for key tables
        tables_to_check = [
            'agents',
            'workflows', 
            'tools',
            'agent_executions',
            'consultation_bookings',
            'projects',
            'seo_pages'
        ]
        
        print("\nChecking tables:")
        for table in tables_to_check:
            try:
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table}'
                """)
                exists = cursor.fetchone()[0] > 0
                
                if exists:
                    # Count rows
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"  ✅ {table}: {count} rows")
                else:
                    print(f"  ❌ {table}: not found")
                    
            except Exception as e:
                print(f"  ⚠️  {table}: error checking - {e}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error verifying tables: {e}")

if __name__ == "__main__":
    run_migrations()
