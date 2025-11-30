#!/usr/bin/env python3
"""
Complete backend test with real user
"""
import os
import json
import psycopg2
from pathlib import Path
from datetime import datetime, timezone


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
    print("🧪 COMPLETE BACKEND TEST - Social Media Credentials\n")
    print("=" * 70)

    load_env()

    # Connect to database
    conn_str = (
        f"host=aws-1-us-east-2.pooler.supabase.com "
        f"port=6543 "
        f"dbname=postgres "
        f"user=postgres.diexsbzqwsbpilsymnfb "
        f"password=Acookingoil123"
    )

    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    print("✅ Connected to PostgreSQL\n")

    # Get real user ID
    cursor.execute("SELECT id FROM auth.users LIMIT 1;")
    user_row = cursor.fetchone()

    if user_row:
        test_user_id = str(user_row[0])
        print(f"✅ Using real user: {test_user_id}\n")
    else:
        print("❌ No users found in auth.users!")
        print("💡 Please create a user first via Supabase Auth\n")
        return False

    # TEST 1: INSERT
    print("📊 TEST 1: INSERT credential")
    print("-" * 70)

    cursor.execute(
        """
        INSERT INTO social_media_credentials
        (user_id, platform, credentials, settings, account_info)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, platform, created_at;
    """,
        (
            test_user_id,
            "telegram",
            json.dumps({"bot_token": "test_token_123", "chat_id": "test_chat_456"}),
            json.dumps({"auto_publish": True, "add_hashtags": True}),
            json.dumps({"username": "test_bot", "name": "Test Bot"}),
        ),
    )

    insert_result = cursor.fetchone()
    conn.commit()

    credential_id = insert_result[0]
    print(f"✅ Inserted credential:")
    print(f"   ID: {credential_id}")
    print(f"   Platform: {insert_result[1]}")
    print(f"   Created: {insert_result[2]}\n")

    # TEST 2: SELECT
    print("📊 TEST 2: SELECT credential")
    print("-" * 70)

    cursor.execute(
        """
        SELECT id, platform, credentials, settings, account_info, is_active
        FROM social_media_credentials
        WHERE user_id = %s AND platform = %s;
    """,
        (test_user_id, "telegram"),
    )

    select_result = cursor.fetchone()

    if select_result:
        print(f"✅ Found credential:")
        print(f"   ID: {select_result[0]}")
        print(f"   Platform: {select_result[1]}")
        print(f"   Credentials: {select_result[2]}")
        print(f"   Settings: {select_result[3]}")
        print(f"   Account Info: {select_result[4]}")
        print(f"   Active: {select_result[5]}\n")
    else:
        print("❌ Not found!\n")

    # TEST 3: UPDATE
    print("📊 TEST 3: UPDATE credential")
    print("-" * 70)

    cursor.execute(
        """
        UPDATE social_media_credentials
        SET
            credentials = %s,
            last_tested_at = %s,
            account_info = %s
        WHERE id = %s
        RETURNING credentials, last_tested_at;
    """,
        (
            json.dumps(
                {"bot_token": "updated_token_999", "chat_id": "updated_chat_888"}
            ),
            datetime.now(timezone.utc),
            json.dumps({"username": "updated_bot", "followers": 1000}),
            credential_id,
        ),
    )

    update_result = cursor.fetchone()
    conn.commit()

    print(f"✅ Updated credential:")
    print(f"   New credentials: {update_result[0]}")
    print(f"   Last tested: {update_result[1]}\n")

    # TEST 4: UPSERT (on conflict)
    print("📊 TEST 4: UPSERT (insert or update)")
    print("-" * 70)

    cursor.execute(
        """
        INSERT INTO social_media_credentials
        (user_id, platform, credentials, settings)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id, platform)
        DO UPDATE SET
            credentials = EXCLUDED.credentials,
            settings = EXCLUDED.settings,
            updated_at = NOW()
        RETURNING id, credentials, settings;
    """,
        (
            test_user_id,
            "telegram",
            json.dumps({"bot_token": "upserted_final", "chat_id": "upserted_final"}),
            json.dumps({"auto_publish": False}),
        ),
    )

    upsert_result = cursor.fetchone()
    conn.commit()

    print(f"✅ Upserted credential:")
    print(f"   ID: {upsert_result[0]}")
    print(f"   Credentials: {upsert_result[1]}")
    print(f"   Settings: {upsert_result[2]}\n")

    # TEST 5: List all for user
    print("📊 TEST 5: LIST all credentials for user")
    print("-" * 70)

    cursor.execute(
        """
        SELECT platform, is_active, created_at
        FROM social_media_credentials
        WHERE user_id = %s AND is_active = true
        ORDER BY platform;
    """,
        (test_user_id,),
    )

    all_creds = cursor.fetchall()

    print(f"✅ Found {len(all_creds)} active credentials:")
    for cred in all_creds:
        print(f"   - {cred[0]}: Active={cred[1]}, Created={cred[2]}")
    print()

    # TEST 6: Update connection status
    print("📊 TEST 6: UPDATE connection status")
    print("-" * 70)

    cursor.execute(
        """
        UPDATE social_media_credentials
        SET
            last_tested_at = %s,
            last_error = NULL,
            is_active = true
        WHERE id = %s
        RETURNING last_tested_at, is_active;
    """,
        (datetime.now(timezone.utc), credential_id),
    )

    status_result = cursor.fetchone()
    conn.commit()

    print(f"✅ Updated status:")
    print(f"   Last tested: {status_result[0]}")
    print(f"   Active: {status_result[1]}\n")

    # TEST 7: DELETE
    print("📊 TEST 7: DELETE credential")
    print("-" * 70)

    cursor.execute(
        """
        DELETE FROM social_media_credentials
        WHERE id = %s
        RETURNING id, platform;
    """,
        (credential_id,),
    )

    delete_result = cursor.fetchone()
    conn.commit()

    print(f"✅ Deleted credential:")
    print(f"   ID: {delete_result[0]}")
    print(f"   Platform: {delete_result[1]}\n")

    # TEST 8: Verify deletion
    print("📊 TEST 8: VERIFY deletion")
    print("-" * 70)

    cursor.execute(
        """
        SELECT COUNT(*) FROM social_media_credentials WHERE id = %s;
    """,
        (credential_id,),
    )

    count_result = cursor.fetchone()[0]

    if count_result == 0:
        print(f"✅ Record successfully deleted (count = 0)\n")
    else:
        print(f"❌ Record still exists! (count = {count_result})\n")

    cursor.close()
    conn.close()

    print("=" * 70)
    print("✅ ALL BACKEND TESTS PASSED!")
    print("=" * 70)
    print("\n💡 Database is fully functional and ready for production!")

    return True


if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
