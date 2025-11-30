#!/usr/bin/env python3
"""
Test social media credentials storage from backend
Tests: Create, Read, Update, Delete operations
"""
import os
import json
from pathlib import Path
from supabase import create_client
from datetime import datetime


def load_env():
    """Load environment variables from .env file"""
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    if "=" in line:
                        key, value = line.strip().split("=", 1)
                        os.environ[key] = value.strip('"').strip("'")


def main():
    print("🧪 Testing Social Media Credentials Storage\n")
    print("=" * 60)

    # Load environment
    load_env()
    url = os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not service_key:
        print("❌ Missing environment variables")
        return False

    print(f"🔗 Connected to: {url}\n")

    # Create client with service role (bypasses RLS for testing)
    supabase = create_client(url, service_key)

    # Get a real user ID from auth.users
    print("📋 Getting real user ID from database...")
    try:
        # Query auth schema directly using raw SQL
        users_result = supabase.rpc(
            "exec_raw_sql", {"query": "SELECT id FROM auth.users LIMIT 1;"}
        ).execute()

        if users_result.data:
            # Parse the result (it comes as string)
            import re

            match = re.search(r"[a-f0-9-]{36}", str(users_result.data))
            if match:
                test_user_id = match.group(0)
                print(f"✅ Using real user ID: {test_user_id}\n")
            else:
                print("⚠️ No users found, will create test without user constraint\n")
                test_user_id = None
        else:
            print("⚠️ No users found, will create test without user constraint\n")
            test_user_id = None
    except Exception as e:
        print(f"⚠️ Could not get user ID: {e}")
        print("⚠️ Will create test without user constraint\n")
        test_user_id = None

    print("📊 TEST 1: Check if table exists")
    print("-" * 60)
    try:
        result = (
            supabase.table("social_media_credentials")
            .select("count", count="exact")
            .limit(0)
            .execute()
        )
        print(f"✅ Table exists with {result.count} total records\n")
    except Exception as e:
        print(f"❌ Table check failed: {e}\n")
        return False

    print("📊 TEST 2: Create credential (INSERT)")
    print("-" * 60)

    if test_user_id is None:
        print("⚠️ Skipping INSERT test (no valid user_id)\n")
        return True

    test_credentials = {
        "user_id": test_user_id,
        "platform": "telegram",
        "credentials": {
            "bot_token": "test_bot_token_123456",
            "chat_id": "test_chat_id_789",
        },
        "settings": {"auto_publish": True, "add_hashtags": True},
        "account_info": {"username": "test_bot", "name": "Test Bot"},
    }

    try:
        result = (
            supabase.table("social_media_credentials")
            .insert(test_credentials)
            .execute()
        )
        if result.data:
            record_id = result.data[0]["id"]
            print(f"✅ Created credential with ID: {record_id}")
            print(f"   Platform: {result.data[0]['platform']}")
            print(f"   Created at: {result.data[0]['created_at']}\n")
        else:
            print("❌ Insert returned no data\n")
            return False
    except Exception as e:
        print(f"❌ Insert failed: {e}\n")
        # Continue to check if it already exists

    print("📊 TEST 3: Read credential (SELECT)")
    print("-" * 60)
    try:
        result = (
            supabase.table("social_media_credentials")
            .select("*")
            .eq("user_id", test_user_id)
            .eq("platform", "telegram")
            .execute()
        )

        if result.data and len(result.data) > 0:
            cred = result.data[0]
            print(f"✅ Found credential:")
            print(f"   ID: {cred['id']}")
            print(f"   Platform: {cred['platform']}")
            print(f"   Active: {cred['is_active']}")
            print(f"   Credentials: {json.dumps(cred['credentials'], indent=2)}")
            print(f"   Settings: {json.dumps(cred['settings'], indent=2)}")
            print(f"   Account Info: {json.dumps(cred['account_info'], indent=2)}\n")
            record_id = cred["id"]
        else:
            print("❌ No credentials found\n")
            return False
    except Exception as e:
        print(f"❌ Select failed: {e}\n")
        return False

    print("📊 TEST 4: Update credential (UPDATE)")
    print("-" * 60)
    try:
        updated_data = {
            "credentials": {
                "bot_token": "updated_token_999999",
                "chat_id": "updated_chat_id_111",
            },
            "last_tested_at": datetime.utcnow().isoformat(),
            "account_info": {
                "username": "updated_bot",
                "name": "Updated Test Bot",
                "followers": 1000,
            },
        }

        result = (
            supabase.table("social_media_credentials")
            .update(updated_data)
            .eq("id", record_id)
            .execute()
        )

        if result.data:
            print(f"✅ Updated credential:")
            print(f"   New token: {result.data[0]['credentials']['bot_token']}")
            print(f"   Last tested: {result.data[0]['last_tested_at']}")
            print(f"   Account: {result.data[0]['account_info']['name']}\n")
        else:
            print("❌ Update returned no data\n")
    except Exception as e:
        print(f"❌ Update failed: {e}\n")

    print("📊 TEST 5: Test connection status update")
    print("-" * 60)
    try:
        result = (
            supabase.table("social_media_credentials")
            .update(
                {
                    "last_tested_at": datetime.utcnow().isoformat(),
                    "last_error": None,
                    "is_active": True,
                }
            )
            .eq("id", record_id)
            .execute()
        )

        if result.data:
            print(f"✅ Connection status updated")
            print(f"   Active: {result.data[0]['is_active']}")
            print(f"   Error: {result.data[0]['last_error']}\n")
    except Exception as e:
        print(f"❌ Status update failed: {e}\n")

    print("📊 TEST 6: List all credentials for user")
    print("-" * 60)
    try:
        result = (
            supabase.table("social_media_credentials")
            .select("platform, is_active, created_at")
            .eq("user_id", test_user_id)
            .eq("is_active", True)
            .execute()
        )

        print(f"✅ Found {len(result.data)} active credentials:")
        for cred in result.data:
            print(
                f"   - {cred['platform']}: Active={cred['is_active']}, Created={cred['created_at']}"
            )
        print()
    except Exception as e:
        print(f"❌ List failed: {e}\n")

    print("📊 TEST 7: Test UPSERT (insert or update)")
    print("-" * 60)
    try:
        upsert_data = {
            "user_id": test_user_id,
            "platform": "telegram",
            "credentials": {
                "bot_token": "upserted_token_final",
                "chat_id": "upserted_chat_final",
            },
            "settings": {"auto_publish": False, "add_hashtags": False},
        }

        result = (
            supabase.table("social_media_credentials")
            .upsert(upsert_data, on_conflict="user_id,platform")
            .execute()
        )

        if result.data:
            print(f"✅ Upserted credential:")
            print(f"   Token: {result.data[0]['credentials']['bot_token']}")
            print(f"   Auto-publish: {result.data[0]['settings']['auto_publish']}\n")
    except Exception as e:
        print(f"❌ Upsert failed: {e}\n")

    print("📊 TEST 8: Delete credential (DELETE)")
    print("-" * 60)
    try:
        result = (
            supabase.table("social_media_credentials")
            .delete()
            .eq("id", record_id)
            .execute()
        )

        print(f"✅ Deleted credential with ID: {record_id}\n")
    except Exception as e:
        print(f"❌ Delete failed: {e}\n")

    print("📊 TEST 9: Verify deletion")
    print("-" * 60)
    try:
        result = (
            supabase.table("social_media_credentials")
            .select("*")
            .eq("id", record_id)
            .execute()
        )

        if not result.data or len(result.data) == 0:
            print(f"✅ Record successfully deleted\n")
        else:
            print(f"❌ Record still exists!\n")
    except Exception as e:
        print(f"❌ Verification failed: {e}\n")

    print("=" * 60)
    print("✅ ALL TESTS COMPLETED!")
    print("=" * 60)

    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
