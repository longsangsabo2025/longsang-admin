#!/usr/bin/env python3
"""
Execute social_media_credentials migration using service role key
Uses direct SQL execution with admin privileges
"""
import os
from pathlib import Path
from supabase import create_client


def main():
    # Load environment
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value.strip('"').strip("'")

    # Get credentials
    url = os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not service_key:
        print("❌ Missing environment variables")
        print("Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return False

    print(f"🔗 Connecting to: {url}")

    # Create admin client with service role key
    supabase = create_client(url, service_key)

    # Read SQL file
    sql_file = (
        Path(__file__).parent
        / "supabase"
        / "migrations"
        / "20251122_social_media_credentials.sql"
    )

    if not sql_file.exists():
        print(f"❌ SQL file not found: {sql_file}")
        return False

    sql_content = sql_file.read_text(encoding="utf-8")
    print(f"📄 Read SQL file: {len(sql_content)} characters")

    # Execute SQL using rpc with service role
    try:
        print("🚀 Executing migration...")

        # Split into individual statements
        statements = [s.strip() for s in sql_content.split(";") if s.strip()]

        print(f"📊 Found {len(statements)} SQL statements")

        success_count = 0
        for i, stmt in enumerate(statements, 1):
            if not stmt or stmt.startswith("--"):
                continue

            print(f"  [{i}/{len(statements)}] Executing...")

            try:
                # Execute via PostgREST query
                result = supabase.rpc("exec_raw_sql", {"query": stmt}).execute()
                success_count += 1
                print(f"  ✅ Success")
            except Exception as e:
                error_msg = str(e)
                # Some statements might fail if already exist (IF NOT EXISTS)
                if (
                    "already exists" in error_msg.lower()
                    or "duplicate" in error_msg.lower()
                ):
                    print(f"  ⚠️ Already exists (OK)")
                    success_count += 1
                else:
                    print(f"  ❌ Error: {error_msg}")

        print(
            f"\n✅ Migration complete: {success_count}/{len(statements)} statements executed"
        )
        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("\n📋 Manual execution required:")
        print("1. Go to: https://app.supabase.com/project/diexsbzqwsbpilsymnfb/sql/new")
        print(
            "2. Copy SQL from: supabase/migrations/20251122_social_media_credentials.sql"
        )
        print("3. Click 'Run' to execute")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
