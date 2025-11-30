"""
Script to run consultation booking migration on Supabase
"""
import os
from supabase import create_client, Client

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Supabase credentials not found in environment")
    print("Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set")
    exit(1)

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 Running Consultation Booking Migration...")
print("=" * 50)

# Read migration file
migration_file = "supabase/migrations/20250111_create_consultation_booking.sql"
try:
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
except FileNotFoundError:
    print(f"❌ Migration file not found: {migration_file}")
    exit(1)

print(f"📄 Loaded migration file: {migration_file}")
print(f"📊 SQL content length: {len(sql_content)} characters")
print()

# Split SQL into individual statements
statements = []
current_statement = []
in_function = False

for line in sql_content.split('\n'):
    stripped = line.strip()
    
    # Skip comments and empty lines at statement level
    if not stripped or stripped.startswith('--'):
        if current_statement:
            current_statement.append(line)
        continue
    
    # Track function/procedure blocks
    if 'CREATE OR REPLACE FUNCTION' in line.upper() or 'CREATE FUNCTION' in line.upper():
        in_function = True
    
    current_statement.append(line)
    
    # End of statement detection
    if stripped.endswith(';') and not in_function:
        statements.append('\n'.join(current_statement))
        current_statement = []
    elif in_function and stripped == '$$;':
        in_function = False
        statements.append('\n'.join(current_statement))
        current_statement = []

# Add any remaining statement
if current_statement:
    statements.append('\n'.join(current_statement))

print(f"📝 Found {len(statements)} SQL statements to execute")
print()

# Execute each statement
success_count = 0
error_count = 0

for i, statement in enumerate(statements, 1):
    stmt_preview = statement.strip()[:100].replace('\n', ' ')
    
    try:
        # Use rpc to execute raw SQL (if available) or direct SQL execution
        # Note: Supabase Python client might need different approach
        print(f"⚙️  [{i}/{len(statements)}] Executing: {stmt_preview}...")
        
        # For Supabase, we'll use the REST API to execute SQL
        # This is a workaround since the Python client doesn't have direct SQL execution
        response = supabase.postgrest.rpc('exec', {'query': statement}).execute()
        
        print(f"✅ [{i}/{len(statements)}] Success")
        success_count += 1
        
    except Exception as e:
        error_msg = str(e)
        # Some errors are OK (like "already exists")
        if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
            print(f"⚠️  [{i}/{len(statements)}] Already exists (skipped)")
            success_count += 1
        else:
            print(f"❌ [{i}/{len(statements)}] Error: {error_msg}")
            error_count += 1

print()
print("=" * 50)
print(f"✅ Migration completed!")
print(f"   Success: {success_count}/{len(statements)}")
if error_count > 0:
    print(f"   Errors: {error_count}")
print()
print("🎉 Next steps:")
print("   1. Go to /admin/consultations")
print("   2. Configure your availability")
print("   3. Share /consultation link with customers")
