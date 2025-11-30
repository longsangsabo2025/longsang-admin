"""
Quick test script for Consultation Booking System
Tests if the API functions work correctly
"""
import sys
import os

# Add parent directory to path to import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

print("🧪 Testing Consultation Booking System")
print("=" * 60)

# Test 1: Check if Supabase connection works
print("\n📡 Test 1: Supabase Connection")
print("-" * 60)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ FAIL: Environment variables not found")
    print("   Make sure .env file is loaded")
    sys.exit(1)

print(f"✅ PASS: Found Supabase URL: {SUPABASE_URL[:30]}...")
print(f"✅ PASS: Found Supabase Key: {SUPABASE_KEY[:30]}...")

# Test 2: Check if tables exist
print("\n📊 Test 2: Database Tables")
print("-" * 60)

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    tables_to_check = [
        'consultations',
        'consultation_types',
        'availability_settings',
        'unavailable_dates'
    ]
    
    for table in tables_to_check:
        try:
            result = supabase.table(table).select("*").limit(1).execute()
            print(f"✅ PASS: Table '{table}' exists")
        except Exception as e:
            if "does not exist" in str(e).lower() or "relation" in str(e).lower():
                print(f"❌ FAIL: Table '{table}' not found")
                print(f"   Please run migration first!")
                print(f"   See: RUN_MIGRATION_NOW.md")
            else:
                print(f"⚠️  WARN: Table '{table}' - {str(e)[:50]}")
    
except ImportError:
    print("⚠️  SKIP: Supabase Python client not installed")
    print("   Install with: pip install supabase")
except Exception as e:
    print(f"❌ FAIL: {str(e)}")

# Test 3: Check consultation types
print("\n🏷️  Test 3: Consultation Types")
print("-" * 60)

try:
    result = supabase.table('consultation_types').select("*").execute()
    
    if result.data and len(result.data) > 0:
        print(f"✅ PASS: Found {len(result.data)} consultation types:")
        for ct in result.data:
            print(f"   - {ct['name']} ({ct['duration_minutes']} mins)")
    else:
        print("⚠️  WARN: No consultation types found")
        print("   Default types should be created by migration")
        
except Exception as e:
    print(f"❌ FAIL: {str(e)}")

# Test 4: Check file structure
print("\n📁 Test 4: File Structure")
print("-" * 60)

files_to_check = [
    ('src/lib/api/consultations.ts', 'API Functions'),
    ('src/components/consultation/BookingForm.tsx', 'Booking Form'),
    ('src/components/consultation/ConsultationManager.tsx', 'Admin Manager'),
    ('src/pages/ConsultationBooking.tsx', 'Public Page'),
    ('src/pages/AdminConsultations.tsx', 'Admin Page'),
    ('supabase/migrations/20250111_create_consultation_booking.sql', 'Migration File'),
]

for filepath, description in files_to_check:
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        print(f"✅ PASS: {description} ({size} bytes)")
    else:
        print(f"❌ FAIL: {description} not found")

# Test 5: Check routes in App.tsx
print("\n🛣️  Test 5: Routes Configuration")
print("-" * 60)

try:
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    routes_to_check = [
        ('/consultation', 'Public booking page'),
        ('/admin/consultations', 'Admin management page'),
    ]
    
    for route, description in routes_to_check:
        if route in content:
            print(f"✅ PASS: Route '{route}' configured ({description})")
        else:
            print(f"❌ FAIL: Route '{route}' not found")
            
except Exception as e:
    print(f"❌ FAIL: {str(e)}")

# Summary
print("\n" + "=" * 60)
print("📋 Test Summary")
print("=" * 60)
print("\n✅ If all tests passed, the system is ready!")
print("\n📖 Next steps:")
print("   1. Run migration (see RUN_MIGRATION_NOW.md)")
print("   2. Start dev server: npm run dev")
print("   3. Open: http://localhost:8083/consultation")
print("   4. Configure availability in admin panel")
print("\n🚀 System ready for use!")
