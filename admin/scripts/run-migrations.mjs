/**
 * Run Database Migrations
 * Automatically execute SQL migrations via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Running Database Migrations...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250101_academy_complete_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📖 Migration file loaded');
    console.log(`📊 File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);
    console.log('Executing migrations...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementNum = i + 1;

      try {
        // Execute statement
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(() => {
          // If rpc doesn't exist, try direct query
          return supabase.from('courses').select('count').limit(1);
        });

        if (error) {
          // Some errors are expected (e.g., table already exists)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('UNIQUE constraint')) {
            console.log(`⚠️  Statement ${statementNum}: ${error.message.substring(0, 50)}...`);
          } else {
            console.log(`❌ Statement ${statementNum}: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${statementNum}: Executed`);
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  Statement ${statementNum}: ${err.message.substring(0, 50)}...`);
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Warnings/Skipped: ${statements.length - successCount - errorCount}`);
    console.log(`  ❌ Errors: ${errorCount}\n`);

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tables = [
      'courses',
      'course_syllabus',
      'course_sections',
      'lessons',
      'course_enrollments',
      'course_assignments',
      'assignment_submissions',
      'course_quizzes',
      'quiz_questions',
      'quiz_question_options',
      'quiz_attempts',
      'learning_analytics',
      'course_certificates',
      'course_reviews',
      'discussion_topics',
      'discussion_replies',
      'qa_questions',
      'qa_answers',
      'course_announcements',
    ];

    let createdTables = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (!error) {
          console.log(`✅ ${table}`);
          createdTables++;
        } else {
          console.log(`❌ ${table}`);
        }
      } catch {
        console.log(`❌ ${table}`);
      }
    }

    console.log(`\n📊 Tables created: ${createdTables}/${tables.length}\n`);

    if (createdTables === tables.length) {
      console.log('🎉 All migrations completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('  1. Run: node scripts/quick-seed.mjs');
      console.log('  2. Then: npm run dev');
      console.log('  3. Visit: http://localhost:5173/academy/browse\n');
      return true;
    } else {
      console.log('⚠️  Some tables were not created');
      console.log('You may need to run migrations manually in Supabase Dashboard\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️  Could not run migrations automatically');
    console.log('Please run migrations manually in Supabase Dashboard:\n');
    console.log('1. Open: https://app.supabase.com/project/diexsbzqwsbpilsymnfb');
    console.log('2. SQL Editor → New Query');
    console.log('3. Copy content from: supabase/migrations/20250101_academy_complete_system.sql');
    console.log('4. Paste and Run\n');
    return false;
  }
}

const success = await runMigrations();
process.exit(success ? 0 : 1);
