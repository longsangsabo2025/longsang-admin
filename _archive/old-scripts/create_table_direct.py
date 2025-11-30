#!/usr/bin/env python3
"""
Create social_media_credentials table using direct PostgreSQL connection
"""
import os
import psycopg2
from pathlib import Path


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
    print(
        "🚀 Creating social_media_credentials table via direct PostgreSQL connection\n"
    )

    load_env()

    # Build connection string from env
    db_host = os.getenv("SUPABASE_DB_HOST", "aws-1-us-east-2.pooler.supabase.com")
    db_port = os.getenv("SUPABASE_DB_PORT", "6543")
    db_name = os.getenv("SUPABASE_DB_NAME", "postgres")
    db_user = os.getenv("SUPABASE_DB_USER", "postgres.diexsbzqwsbpilsymnfb")
    db_pass = os.getenv("SUPABASE_DB_PASSWORD", "Acookingoil123")

    conn_str = f"host={db_host} port={db_port} dbname={db_name} user={db_user} password={db_pass}"

    print(f"🔗 Host: {db_host}")

    print(f"📡 Connecting to PostgreSQL...")

    try:
        # Connect to database
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True  # Important for CREATE TABLE
        cursor = conn.cursor()

        print(f"✅ Connected successfully\n")

        # Read SQL file
        sql_file = (
            Path(__file__).parent
            / "supabase"
            / "migrations"
            / "20251122_social_media_credentials.sql"
        )
        sql_content = sql_file.read_text(encoding="utf-8")

        print(f"📄 Read SQL file: {len(sql_content)} characters")
        print(f"📊 Executing SQL...\n")

        # Execute the entire SQL script
        cursor.execute(sql_content)

        print(f"✅ SQL executed successfully!\n")

        # Verify table was created
        print(f"🔍 Verifying table creation...")
        cursor.execute(
            """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'social_media_credentials'
            ORDER BY ordinal_position;
        """
        )

        columns = cursor.fetchall()

        if columns:
            print(f"✅ Table created with {len(columns)} columns:")
            for col_name, col_type in columns:
                print(f"   - {col_name}: {col_type}")
        else:
            print(f"❌ Table not found after creation!")

        # Check indexes
        print(f"\n🔍 Checking indexes...")
        cursor.execute(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'social_media_credentials';
        """
        )

        indexes = cursor.fetchall()
        print(f"✅ Found {len(indexes)} indexes:")
        for idx in indexes:
            print(f"   - {idx[0]}")

        # Check RLS policies
        print(f"\n🔍 Checking RLS policies...")
        cursor.execute(
            """
            SELECT policyname
            FROM pg_policies
            WHERE tablename = 'social_media_credentials';
        """
        )

        policies = cursor.fetchall()
        print(f"✅ Found {len(policies)} RLS policies:")
        for policy in policies:
            print(f"   - {policy[0]}")

        cursor.close()
        conn.close()

        print(f"\n{'='*60}")
        print(f"✅ TABLE CREATED SUCCESSFULLY!")
        print(f"{'='*60}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
