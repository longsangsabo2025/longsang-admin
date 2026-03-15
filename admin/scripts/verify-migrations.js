/**
 * Verify Migrations Script
 *
 * Verifies that all required migrations have been applied
 *
 * Usage: node scripts/verify-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_TABLES = {
  // Context indexing tables
  'context_embeddings': {
    required: true,
    columns: ['id', 'entity_type', 'entity_id', 'embedding', 'content'],
    description: 'Stores vector embeddings for semantic search',
  },
  'context_indexing_log': {
    required: true,
    columns: ['id', 'entity_type', 'status', 'created_at'],
    description: 'Logs indexing operations',
  },

  // Learning system tables
  'copilot_feedback': {
    required: true,
    columns: ['id', 'user_id', 'feedback_type', 'interaction_type'],
    description: 'Stores user feedback for learning',
  },
  'copilot_patterns': {
    required: true,
    columns: ['id', 'user_id', 'pattern_type', 'pattern_name'],
    description: 'Stores recognized user patterns',
  },
  'copilot_preferences': {
    required: true,
    columns: ['id', 'user_id', 'preference_type', 'preference_key'],
    description: 'Stores learned user preferences',
  },
  'copilot_learning_log': {
    required: true,
    columns: ['id', 'operation_type', 'status'],
    description: 'Logs learning operations',
  },
};

const REQUIRED_FUNCTIONS = {
  'semantic_search': {
    required: true,
    description: 'Vector similarity search function',
  },
};

async function checkTable(tableName, tableConfig) {
  try {
    // Try to select from table to verify it exists
    const { data, error } = await supabase
      .from(tableName)
      .select(tableConfig.columns.join(', '))
      .limit(1);

    if (error && error.code === 'PGRST116') {
      return {
        exists: false,
        error: 'Table does not exist',
      };
    }

    if (error) {
      // Table exists but might have different structure
      return {
        exists: true,
        error: error.message,
        warning: true,
      };
    }

    // Verify columns exist by checking if we can select them
    const missingColumns = [];
    for (const column of tableConfig.columns) {
      try {
        const { error: colError } = await supabase
          .from(tableName)
          .select(column)
          .limit(1);

        if (colError) {
          missingColumns.push(column);
        }
      } catch {
        missingColumns.push(column);
      }
    }

    return {
      exists: true,
      missingColumns,
      error: missingColumns.length > 0 ? `Missing columns: ${missingColumns.join(', ')}` : null,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
}

async function checkFunction(functionName, functionConfig) {
  try {
    // Try to call the function with minimal parameters
    const dummyParams = functionName === 'semantic_search' ? {
      query_embedding: new Array(1536).fill(0.1),
      similarity_threshold: 0.7,
      max_results: 1,
    } : {};

    const { data, error } = await supabase.rpc(functionName, dummyParams);

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42883') {
        return {
          exists: false,
          error: 'Function does not exist',
        };
      }

      // Function exists but might have wrong signature
      return {
        exists: true,
        error: error.message,
        warning: true,
      };
    }

    return {
      exists: true,
      error: null,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
}

async function listMigrationFiles() {
  try {
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const files = await readdir(migrationsDir);
    return files.filter((f) => f.endsWith('.sql')).sort();
  } catch (error) {
    console.warn(`⚠️  Could not read migrations directory: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING MIGRATIONS');
  console.log('═══════════════════════════════════════════════════════════');

  // List migration files
  const migrationFiles = await listMigrationFiles();
  if (migrationFiles.length > 0) {
    console.log(`\n📁 Found ${migrationFiles.length} migration file(s):`);
    migrationFiles.forEach((file) => console.log(`   - ${file}`));
  }

  // Check tables
  console.log('\n🔍 Checking required tables...');
  const tableResults = [];

  for (const [tableName, tableConfig] of Object.entries(REQUIRED_TABLES)) {
    console.log(`\n  Checking table: ${tableName}`);
    const result = await checkTable(tableName, tableConfig);
    tableResults.push({ name: tableName, config: tableConfig, ...result });

    if (result.exists && !result.error) {
      console.log(`    ✅ Table exists with all required columns`);
    } else if (result.exists && result.warning) {
      console.log(`    ⚠️  Table exists but: ${result.error}`);
    } else {
      console.log(`    ❌ ${result.error || 'Table does not exist'}`);
    }
  }

  // Check functions
  console.log('\n🔍 Checking required functions...');
  const functionResults = [];

  for (const [functionName, functionConfig] of Object.entries(REQUIRED_FUNCTIONS)) {
    console.log(`\n  Checking function: ${functionName}`);
    const result = await checkFunction(functionName, functionConfig);
    functionResults.push({ name: functionName, config: functionConfig, ...result });

    if (result.exists && !result.error) {
      console.log(`    ✅ Function exists and is callable`);
    } else if (result.exists && result.warning) {
      console.log(`    ⚠️  Function exists but: ${result.error}`);
    } else {
      console.log(`    ❌ ${result.error || 'Function does not exist'}`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  const failedTables = tableResults.filter(
    (r) => !r.exists || (r.error && !r.warning)
  );
  const failedFunctions = functionResults.filter(
    (r) => !r.exists || (r.error && !r.warning)
  );

  const totalTables = tableResults.length;
  const passedTables = totalTables - failedTables.length;
  const totalFunctions = functionResults.length;
  const passedFunctions = totalFunctions - failedFunctions.length;

  console.log(`\n📊 Tables: ${passedTables}/${totalTables} passed`);
  console.log(`📊 Functions: ${passedFunctions}/${totalFunctions} passed`);

  if (failedTables.length > 0) {
    console.log('\n❌ Failed tables:');
    failedTables.forEach((table) => {
      console.log(`   - ${table.name}: ${table.error || 'Does not exist'}`);
    });
  }

  if (failedFunctions.length > 0) {
    console.log('\n❌ Failed functions:');
    failedFunctions.forEach((func) => {
      console.log(`   - ${func.name}: ${func.error || 'Does not exist'}`);
    });
  }

  if (failedTables.length === 0 && failedFunctions.length === 0) {
    console.log('\n✅ All migrations verified successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some migrations are missing or incomplete.');
    console.log('\n📝 To fix:');
    console.log('   npm run deploy:db');
    console.log('   or');
    console.log('   supabase db push');
    process.exit(1);
  }
}

// Run verification
main().catch((error) => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});

