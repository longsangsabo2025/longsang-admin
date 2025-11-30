/**
 * 📇 Index All Data Script
 *
 * Indexes all projects, workflows, and executions
 * Run: node scripts/index-all-data.js
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function indexAllData() {
  try {
    console.log('🚀 Starting full indexing pipeline...\n');

    // Check API health first
    console.log('📡 Checking API health...');
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthRes.json();

    if (healthData.status !== 'OK') {
      throw new Error('API server not healthy');
    }
    console.log('✅ API server is running\n');

    // Run full indexing
    console.log('📇 Starting full indexing...');
    const response = await fetch(`${API_BASE}/api/context/index/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 100,
        offset: 0,
        executionsLimit: 50,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Indexing complete!\n');
      console.log('📊 Results:');
      console.log(`   Total indexed: ${data.result.totalIndexed}`);
      console.log(`   - Projects: ${data.result.results.projects.indexed} (errors: ${data.result.results.projects.errors})`);
      console.log(`   - Workflows: ${data.result.results.workflows.indexed} (errors: ${data.result.results.workflows.errors})`);
      console.log(`   - Executions: ${data.result.results.executions.indexed} (errors: ${data.result.results.executions.errors})`);

      if (data.result.totalIndexed === 0) {
        console.log('\n⚠️  Warning: No entities indexed. Make sure you have data in your database.');
      }
    } else {
      console.error('❌ Indexing failed:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure API server is running:');
      console.error('   cd api && node server.js');
    }
    process.exit(1);
  }
}

indexAllData();

