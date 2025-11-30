#!/usr/bin/env python3
"""
Direct test - try to query the table
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
    load_env()
    url = os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    supabase = create_client(url, service_key)

    print("🔍 Direct Table Access Test\n")

    # Test 1: Try social_media_credentials
    print("1️⃣ Testing: social_media_credentials")
    try:
        result = (
            supabase.table("social_media_credentials").select("*").limit(1).execute()
        )
        print(f"   ✅ Table EXISTS - Found {len(result.data)} records")
        if result.data:
            print(f"   📋 Sample: {result.data[0]}")
    except Exception as e:
        print(f"   ❌ Table NOT FOUND: {str(e)[:100]}")

    # Test 2: Try with schema prefix
    print("\n2️⃣ Testing: public.social_media_credentials")
    try:
        result = (
            supabase.schema("public")
            .table("social_media_credentials")
            .select("*")
            .limit(1)
            .execute()
        )
        print(f"   ✅ Table EXISTS with schema - Found {len(result.data)} records")
    except Exception as e:
        print(f"   ❌ Not found with schema: {str(e)[:100]}")

    # Test 3: Try social_media_accounts (suggested in error)
    print("\n3️⃣ Testing: social_media_accounts (alternative)")
    try:
        result = supabase.table("social_media_accounts").select("*").limit(1).execute()
        print(f"   ✅ Table EXISTS - Found {len(result.data)} records")
        if result.data:
            print(f"   📋 Columns: {list(result.data[0].keys())}")
    except Exception as e:
        print(f"   ❌ Table NOT FOUND: {str(e)[:100]}")

    # Test 4: List content_queue to verify connection
    print("\n4️⃣ Testing: content_queue (should exist)")
    try:
        result = supabase.table("content_queue").select("id").limit(1).execute()
        print(f"   ✅ Connection working - content_queue accessible")
    except Exception as e:
        print(f"   ❌ Connection issue: {str(e)[:100]}")

    # Test 5: Try to INSERT into social_media_credentials
    print("\n5️⃣ Testing: INSERT into social_media_credentials")
    try:
        test_data = {
            "user_id": "00000000-0000-0000-0000-000000000001",
            "platform": "telegram",
            "credentials": {"test": "data"},
        }
        result = supabase.table("social_media_credentials").insert(test_data).execute()
        print(f"   ✅ INSERT successful - ID: {result.data[0]['id']}")

        # Clean up
        supabase.table("social_media_credentials").delete().eq(
            "id", result.data[0]["id"]
        ).execute()
        print(f"   🧹 Test record deleted")
    except Exception as e:
        error_msg = str(e)
        if "PGRST205" in error_msg:
            print(f"   ❌ TABLE DOES NOT EXIST IN DATABASE")
            print(f"   💡 Migration did not create the table successfully")
        elif "PGRST204" in error_msg:
            print(f"   ❌ COLUMN MISMATCH - Table exists but schema is different")
        else:
            print(f"   ❌ INSERT failed: {error_msg[:200]}")


if __name__ == "__main__":
    main()
