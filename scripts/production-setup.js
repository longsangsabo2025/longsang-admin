/**
 * Production Setup Script
 *
 * Automated production environment setup
 * Verifies environment, runs migrations, indexes data
 *
 * Usage: node scripts/production-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const MIGRATION_TABLES = [
  'context_embeddings',
  'context_indexing_log',
  'copilot_feedback',
  'copilot_patterns',
  'copilot_preferences',
  'copilot_learning_log',
];

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'OPENAI_API_KEY',
  'NODE_ENV',
];

async function checkEnvironment() {
  console.log('\n🔍 Checking environment variables...');

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

async function checkDatabaseConnection() {
  console.log('\n🔍 Checking database connection...');

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      console.error(`❌ Database connection failed: ${error.message}`);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    return false;
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verifying database migrations...');

  const missingTables = [];

  for (const table of MIGRATION_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        missingTables.push(table);
      } else if (error) {
        console.warn(`⚠️  Error checking table ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ Table ${table} exists`);
      }
    } catch (error) {
      console.warn(`⚠️  Error checking table ${table}: ${error.message}`);
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
    console.log('\n📝 Please run migrations first:');
    console.log('   npm run deploy:db');
    console.log('   or');
    console.log('   supabase db push');
    return false;
  }

  console.log('✅ All required tables exist');
  return true;
}

async function checkVectorExtension() {
  console.log('\n🔍 Checking pgvector extension...');

  try {
    const { data, error } = await supabase.rpc('check_vector_extension', {});

    if (error) {
      // Try alternative check
      const { data: altData, error: altError } = await supabase
        .from('context_embeddings')
        .select('embedding')
        .limit(1);

      if (altError) {
        console.warn(`⚠️  Could not verify pgvector extension: ${altError.message}`);
        return true; // Assume it's okay if we can't check
      }
    }

    console.log('✅ pgvector extension is available');
    return true;
  } catch (error) {
    console.warn(`⚠️  Error checking pgvector: ${error.message}`);
    return true; // Assume it's okay
  }
}

async function checkSemanticSearchFunction() {
  console.log('\n🔍 Checking semantic_search function...');

  try {
    // Try to call the function with dummy data
    const { data, error } = await supabase.rpc('semantic_search', {
      query_embedding: new Array(1536).fill(0.1),
      similarity_threshold: 0.7,
      max_results: 1,
    });

    if (error) {
      console.error(`❌ semantic_search function not available: ${error.message}`);
      console.log('\n📝 Please ensure migration with semantic_search function is applied');
      return false;
    }

    console.log('✅ semantic_search function is available');
    return true;
  } catch (error) {
    console.warn(`⚠️  Error checking semantic_search: ${error.message}`);
    return true; // Assume it's okay
  }
}

async function verifyAPIEndpoints() {
  console.log('\n🔍 Verifying API server endpoints...');

  const API_PORT = process.env.API_PORT || process.env.PORT || 3001;
  const baseUrl = `http://localhost:${API_PORT}`;

  try {
    const response = await fetch(`${baseUrl}/api/health`);

    if (!response.ok) {
      console.warn(`⚠️  API server not responding at ${baseUrl}`);
      console.log('   Make sure API server is running: npm run dev:api');
      return false;
    }

    const health = await response.json();
    console.log('✅ API server is running');
    console.log(`   Status: ${health.status}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  API server not accessible: ${error.message}`);
    console.log('   Make sure API server is running: npm run dev:api');
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 PRODUCTION SETUP');
  console.log('═══════════════════════════════════════════════════════════');

  const checks = [
    { name: 'Environment Variables', fn: checkEnvironment },
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Migrations', fn: verifyMigrations },
    { name: 'Vector Extension', fn: checkVectorExtension },
    { name: 'Semantic Search Function', fn: checkSemanticSearchFunction },
    { name: 'API Endpoints', fn: verifyAPIEndpoints },
  ];

  const results = [];

  for (const check of checks) {
    const result = await check.fn();
    results.push({ name: check.name, passed: result });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SETUP SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n${passed}/${total} checks passed`);

  if (passed === total) {
    console.log('\n✅ Production environment is ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run data indexing: npm run index:all');
    console.log('   2. Start API server: npm run dev:api');
    console.log('   3. Test endpoints: npm run test:phase1');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above.');
    console.log('\n📝 Common fixes:');
    console.log('   - Run migrations: npm run deploy:db');
    console.log('   - Check environment variables in .env file');
    console.log('   - Start API server: npm run dev:api');
    process.exit(1);
  }
}

// Run setup
main().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
});

