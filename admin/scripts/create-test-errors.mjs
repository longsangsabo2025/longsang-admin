/**
 * Create test errors in database for auto-fix testing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function createTestErrors() {
  console.log('🧪 Creating test errors for auto-fix system...\n');

  const testErrors = [
    {
      error_type: 'ESLintError',
      error_message: 'Missing semicolon at end of statement',
      error_stack: 'at src/test-auto-fix.ts:5:25',
      severity: 'low',
      context: {
        filePath: 'src/test-auto-fix.ts',
        line: 5,
        column: 25,
        rule: 'semi',
      },
      project_name: 'longsang-admin',
    },
    {
      error_type: 'PrettierError',
      error_message: 'Code formatting issue - inconsistent spacing',
      error_stack: 'at src/test-auto-fix.ts:8:15',
      severity: 'low',
      context: {
        filePath: 'src/test-auto-fix.ts',
        line: 8,
        column: 15,
        rule: 'formatting',
      },
      project_name: 'longsang-admin',
    },
    {
      error_type: 'ESLintError',
      error_message: 'Unused variable: unusedVar',
      error_stack: 'at src/test-auto-fix.ts:11:7',
      severity: 'low',
      context: {
        filePath: 'src/test-auto-fix.ts',
        line: 11,
        column: 7,
        rule: 'no-unused-vars',
      },
      project_name: 'longsang-admin',
    },
    {
      error_type: 'TypeError',
      error_message: "Cannot read property 'name' of undefined",
      error_stack: 'at testNullSafety (src/test-auto-fix.ts:16:20)',
      severity: 'medium',
      context: {
        filePath: 'src/test-auto-fix.ts',
        line: 16,
        column: 20,
        rule: 'null-safety',
      },
      project_name: 'longsang-admin',
    },
  ];

  let created = 0;
  let failed = 0;

  for (const error of testErrors) {
    try {
      const { data, error: insertError } = await supabase
        .from('error_logs')
        .insert(error)
        .select('id')
        .single();

      if (insertError) {
        console.error(`❌ Failed to create error: ${error.error_type}`, insertError.message);
        failed++;
      } else {
        console.log(`✅ Created: ${error.error_type} (ID: ${data.id})`);
        created++;
      }
    } catch (err) {
      console.error(`❌ Error creating ${error.error_type}:`, err.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created} test errors`);
  console.log(`   ❌ Failed: ${failed} errors`);
  console.log('\n💡 Now run: npm run fix:auto');
}

createTestErrors().catch(console.error);

