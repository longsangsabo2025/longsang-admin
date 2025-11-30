/**
 * Index Production Data Script
 *
 * Indexes all existing production data for Copilot context
 *
 * Usage: node scripts/index-production-data.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);

    if (!response.ok) {
      throw new Error(`API health check failed: ${response.statusText}`);
    }

    const health = await response.json();
    console.log('✅ API server is running');
    return true;
  } catch (error) {
    console.error(`❌ API server not accessible: ${error.message}`);
    console.log('\n📝 Please start the API server:');
    console.log('   npm run dev:api');
    return false;
  }
}

async function indexEntityType(entityType, options = {}) {
  const { limit = BATCH_SIZE, offset = 0 } = options;

  console.log(`\n📇 Indexing ${entityType}...`);

  try {
    const response = await fetch(`${API_BASE}/api/context/index/${entityType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit,
        offset,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Indexing failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log(`  ✅ Indexed ${result.indexed || 0} ${entityType}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`  ⚠️  ${result.errors.length} errors`);
      }
      return result;
    } else {
      throw new Error(result.error || 'Indexing failed');
    }
  } catch (error) {
    console.error(`  ❌ Error indexing ${entityType}: ${error.message}`);
    throw error;
  }
}

async function indexAllData() {
  console.log('📇 Starting full production data indexing...');

  try {
    const response = await fetch(`${API_BASE}/api/context/index/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: BATCH_SIZE,
        offset: 0,
        executionsLimit: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Full indexing failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      const stats = result.result;
      console.log('\n✅ Full indexing complete!');
      console.log(`\n📊 Statistics:`);
      console.log(`   Total indexed: ${stats.totalIndexed || 0}`);
      console.log(`   - Projects: ${stats.results?.projects?.indexed || 0} (errors: ${stats.results?.projects?.errors || 0})`);
      console.log(`   - Workflows: ${stats.results?.workflows?.indexed || 0} (errors: ${stats.results?.workflows?.errors || 0})`);
      console.log(`   - Executions: ${stats.results?.executions?.indexed || 0} (errors: ${stats.results?.executions?.errors || 0})`);

      return result;
    } else {
      throw new Error(result.error || 'Full indexing failed');
    }
  } catch (error) {
    console.error(`❌ Error during full indexing: ${error.message}`);
    throw error;
  }
}

async function indexWithRetry(entityType, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await indexEntityType(entityType, options);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`  ⚠️  Attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📇 PRODUCTION DATA INDEXING');
  console.log('═══════════════════════════════════════════════════════════');

  // Check API health
  const apiHealthy = await checkAPIHealth();
  if (!apiHealthy) {
    process.exit(1);
  }

  // Option 1: Index all at once (recommended)
  try {
    console.log('\n🚀 Starting full indexing pipeline...');
    await indexAllData();

    console.log('\n✅ Production data indexing complete!');
    console.log('\n📝 Next steps:');
    console.log('   - Test context retrieval: npm run test:phase1');
    console.log('   - Check indexing logs in context_indexing_log table');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Full indexing failed: ${error.message}`);

    // Option 2: Try indexing entity types individually
    console.log('\n🔄 Attempting individual entity type indexing...');

    const entityTypes = ['projects', 'workflows', 'executions'];
    const results = [];

    for (const entityType of entityTypes) {
      try {
        const result = await indexWithRetry(entityType, { limit: BATCH_SIZE });
        results.push({ entityType, success: true, result });
      } catch (error) {
        console.error(`  ❌ Failed to index ${entityType}: ${error.message}`);
        results.push({ entityType, success: false, error: error.message });
      }
    }

    const successful = results.filter((r) => r.success).length;
    console.log(`\n📊 Indexed ${successful}/${entityTypes.length} entity types`);

    if (successful === 0) {
      console.log('\n❌ All indexing attempts failed.');
      console.log('\n📝 Troubleshooting:');
      console.log('   1. Check API server is running');
      console.log('   2. Verify database connection');
      console.log('   3. Check OpenAI API key is valid');
      console.log('   4. Review API server logs for errors');
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run indexing
main().catch((error) => {
  console.error('\n❌ Indexing script failed:', error);
  process.exit(1);
});

