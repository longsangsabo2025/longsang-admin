"""
Run social media credentials migration
"""

import os
from supabase import create_client, Client

# Get Supabase credentials from environment
url = os.environ.get("VITE_SUPABASE_URL", "https://diexsbzqwsbpilsymnfb.supabase.co")
key = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY",
)

supabase: Client = create_client(url, key)

# Read SQL migration file
with open(
    "supabase/migrations/20251122_social_media_credentials.sql", "r", encoding="utf-8"
) as f:
    sql = f.read()

print("🚀 Running migration: social_media_credentials table...")

try:
    # Execute SQL
    result = supabase.rpc("exec_sql", {"sql_query": sql}).execute()
    print("✅ Migration completed successfully!")
    print(f"Result: {result}")
except Exception as e:
    # If exec_sql doesn't exist, try direct query
    print(f"⚠️ RPC method not found, trying direct execution...")
    try:
        # Split SQL into individual statements
        statements = [s.strip() for s in sql.split(";") if s.strip()]

        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"Executing statement {i}/{len(statements)}...")
                result = supabase.postgrest.rpc(
                    "exec_sql", {"query": statement}
                ).execute()
                print(f"✅ Statement {i} done")

        print("✅ All statements executed!")
    except Exception as e2:
        print(f"❌ Error: {e2}")
        print("\n📋 Please run this SQL manually in Supabase Dashboard:")
        print("Go to: https://app.supabase.com/project/diexsbzqwsbpilsymnfb/editor")
        print("\nSQL to execute:")
        print("=" * 60)
        print(sql)
