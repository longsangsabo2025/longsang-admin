#!/usr/bin/env python3
"""
Script to run Supabase migrations directly using Python
"""

import os
from supabase import create_client, Client
from pathlib import Path

# Supabase credentials from .env
SUPABASE_URL = "https://diexsbzqwsbpilsymnfb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY"

def main():
    print("🚀 Connecting to Supabase...")
    
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print("✅ Connected to Supabase!")
    
    # Read migration files
    migrations_dir = Path(__file__).parent / "supabase" / "migrations"
    
    migration_files = [
        "20251018000001_create_agent_center_tables.sql",
        "20251018000002_seed_agent_center_data.sql"
    ]
    
    for migration_file in migration_files:
        file_path = migrations_dir / migration_file
        
        if not file_path.exists():
            print(f"❌ Migration file not found: {migration_file}")
            continue
        
        print(f"\n📄 Running migration: {migration_file}")
        
        # Read SQL content
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        try:
            # Execute SQL using Supabase RPC
            # Note: We need to use the REST API directly for raw SQL
            import requests
            
            headers = {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json'
            }
            
            # Use Supabase SQL endpoint
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                headers=headers,
                json={'query': sql_content}
            )
            
            if response.status_code == 200 or response.status_code == 201:
                print(f"✅ Migration successful: {migration_file}")
            else:
                print(f"⚠️  Response: {response.status_code}")
                print(f"   {response.text}")
                
        except Exception as e:
            print(f"❌ Error running migration {migration_file}: {e}")
    
    # Verify tables were created
    print("\n🔍 Verifying tables...")
    
    try:
        # Check if agents table exists
        result = supabase.table('agents').select("count", count='exact').limit(0).execute()
        print(f"✅ 'agents' table exists")
        
        # Check workflows table
        result = supabase.table('workflows').select("count", count='exact').limit(0).execute()
        print(f"✅ 'workflows' table exists")
        
        # Check tools table
        result = supabase.table('tools').select("count", count='exact').limit(0).execute()
        print(f"✅ 'tools' table exists")
        
        print("\n🎉 All tables verified successfully!")
        
    except Exception as e:
        print(f"⚠️  Could not verify tables (they might not exist yet): {e}")
        print("\n💡 Alternative: Let's try creating tables directly...")
        
        # Try direct table creation
        create_tables_directly(supabase)

def create_tables_directly(supabase: Client):
    """Create tables directly using Supabase client"""
    print("\n📝 Creating tables directly via Supabase...")
    
    # We'll use the SQL from migration files
    migrations_dir = Path(__file__).parent / "supabase" / "migrations"
    
    # Read and execute the main migration
    main_migration = migrations_dir / "20251018000001_create_agent_center_tables.sql"
    
    if main_migration.exists():
        with open(main_migration, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("📄 SQL file loaded, length:", len(sql), "characters")
        print("\n⚠️  Note: Direct SQL execution requires Supabase Management API")
        print("   Please run migrations manually via Supabase Dashboard:")
        print(f"   1. Go to: {SUPABASE_URL.replace('https://', 'https://app.')}/project/_/sql")
        print(f"   2. Copy SQL from: {main_migration}")
        print("   3. Execute in SQL Editor")

if __name__ == "__main__":
    main()
