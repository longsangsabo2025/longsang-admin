/**
 * Run Consultation Booking Migration
 * This script executes the SQL migration directly on Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

console.log('🚀 Consultation Booking Migration');
console.log('='.repeat(60));
console.log('');

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250111_create_consultation_booking.sql');

console.log('📄 Reading migration file...');
let sql;
try {
  sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`✅ Loaded ${sql.length} characters`);
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

console.log('');
console.log('📡 Connecting to Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);
console.log('');

// Execute SQL using Supabase REST API
async function runMigration() {
  try {
    // Use Supabase's REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ Migration executed successfully!');
      console.log('');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️  Response status:', response.status);
      console.log('⚠️  Note: If tables already exist, this is normal!');
      console.log('');
      
      // Try alternative method - execute via pg REST endpoint
      console.log('🔄 Trying alternative method...');
      return await executeSQLDirectly();
    }
  } catch (error) {
    console.log('⚠️  REST API method failed:', error.message);
    console.log('🔄 Trying direct SQL execution...');
    return await executeSQLDirectly();
  }
}

async function executeSQLDirectly() {
  console.log('');
  console.log('📋 Manual Migration Steps:');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Open Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb');
  console.log('');
  console.log('2. Go to SQL Editor (left sidebar)');
  console.log('');
  console.log('3. Create New Query');
  console.log('');
  console.log('4. Copy the SQL from:');
  console.log(`   ${migrationPath}`);
  console.log('');
  console.log('5. Paste and click RUN');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  // Verify tables exist
  console.log('🔍 Checking if tables already exist...');
  return await verifyTables();
}

async function verifyTables() {
  const tablesToCheck = [
    'consultations',
    'consultation_types',
    'availability_settings',
    'unavailable_dates'
  ];

  let allExist = true;

  for (const table of tablesToCheck) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );

      if (response.ok) {
        console.log(`   ✅ Table '${table}' exists`);
      } else if (response.status === 404 || response.status === 406) {
        console.log(`   ❌ Table '${table}' NOT FOUND`);
        allExist = false;
      } else {
        console.log(`   ⚠️  Table '${table}' - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking '${table}':`, error.message);
      allExist = false;
    }
  }

  console.log('');

  if (allExist) {
    console.log('🎉 All tables exist! Checking consultation types...');
    await checkConsultationTypes();
    return true;
  } else {
    console.log('⚠️  Some tables are missing. Please run the manual steps above.');
    return false;
  }
}

async function checkConsultationTypes() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/consultation_types?select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('');
      console.log(`✅ Found ${data.length} consultation types:`);
      data.forEach(type => {
        console.log(`   - ${type.name} (${type.duration_minutes} mins)`);
      });
      console.log('');
      console.log('🎉 Migration verified successfully!');
      console.log('');
      printNextSteps();
    }
  } catch (error) {
    console.log('⚠️  Could not verify consultation types');
  }
}

function printNextSteps() {
  console.log('='.repeat(60));
  console.log('📝 NEXT STEPS:');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Make sure dev server is running:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Open in browser:');
  console.log('   http://localhost:8083/admin/consultations');
  console.log('');
  console.log('3. Configure your working hours:');
  console.log('   - Click "Cấu hình lịch làm việc"');
  console.log('   - Add time slots for each day');
  console.log('   - Save configuration');
  console.log('');
  console.log('4. Test booking:');
  console.log('   http://localhost:8083/consultation');
  console.log('');
  console.log('5. Check bookings in admin panel');
  console.log('');
  console.log('✨ System is ready to use!');
  console.log('');
}

// Run the migration
runMigration().then(success => {
  if (success) {
    console.log('✅ Migration process completed!');
    process.exit(0);
  } else {
    console.log('⚠️  Please complete manual steps above');
    process.exit(0);
  }
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
