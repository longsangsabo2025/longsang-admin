#!/usr/bin/env python3
"""
Check database tables and schema
"""
import os
from pathlib import Path
from supabase import create_client


def load_env():
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    if "=" in line:
                        key, value = line.strip().split("=", 1)
                        os.environ[key] = value.strip('"').strip("'")


def main():
    print("🔍 Checking Database Schema\n")

    load_env()
    url = os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    supabase = create_client(url, service_key)

    print("📋 Listing all tables in public schema:")
    print("-" * 60)

    try:
        # Query information_schema to list tables
        result = supabase.rpc(
            "exec_raw_sql",
            {
                "query": """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """
            },
        ).execute()

        print(result.data)
    except Exception as e:
        print(f"Error listing tables: {e}")

    print("\n📋 Checking for social_media tables:")
    print("-" * 60)

    try:
        result = supabase.rpc(
            "exec_raw_sql",
            {
                "query": """
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name LIKE '%social_media%'
                ORDER BY table_name, ordinal_position;
            """
            },
        ).execute()

        print(result.data)
    except Exception as e:
        print(f"Error checking columns: {e}")


if __name__ == "__main__":
    main()
